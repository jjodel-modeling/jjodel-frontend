/**
 * M1 instance deletion through the canonical cascade (headless, canvas-faithful).
 *
 * Repro (Alfonso, validation battery row #5, 2026-07-16): deleting an M1
 * instance from the v2 canvas or via JjScript used a raw DeleteElementAction,
 * which removes only the idlookup entry — incoming reference slots kept the
 * dead pointer (CHECK 6 dangling_reference), the instance's own DValue
 * features went orphan, model.objects kept the dead id, vertices went ghost.
 * RCA: docs/discovery/discovery_2026-07-16_instance_delete_dangling_refs.md.
 *
 * Fix under test: syncDeleteVertex routes DObject through modelElement.delete()
 * (Dummy.get_delete cascade) and executeDeleteInstance uses lObject.delete()
 * with a singleton pre-check reading the same flag as the canonical guard.
 *
 * Scenario: M2 = A, B, r:A->B, r2:B->A. M1 = a1:A, b1:B with r:a1->b1 and
 * r2:b1->a1 (so a1 has BOTH an outgoing slot and an incoming one). Deleting a1
 * must: remove the entry, clean b1's r2 slot (incoming), clean model.objects,
 * delete a1's own slots (children), delete a1's vertex (nodes).
 *
 * Fixture idiom (headless compensation, findSlot fallback, registered writes)
 * mirrors m2-reference-delete.test.ts.
 *
 * Runs headless via its own config:
 *   npx vitest run --config coevolution-tests/vitest.coevolution.config.ts
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';

// All app imports are dynamic, resolved in beforeAll AFTER the dom-setup
// setupFile has installed the shims (see m2-reference-delete.test.ts).
let joiner: any;
let store: any;
let DProject: any;
let DModel: any;
let LModel: any;
let LPackage: any;
let DGraph: any;
let DValue: any;
let LPointerTargetable: any;
let SetFieldAction: any;
let syncCreateClass: any;
let syncReferenceEdge: any;
let syncCreateObject: any;
let syncCreateReferenceLink: any;
let syncDeleteVertex: any;
let executeDeleteInstance: any;

beforeAll(async () => {
    joiner = await import('../src/joiner');
    store = joiner.store;
    DProject = joiner.DProject;
    DModel = joiner.DModel;
    LModel = joiner.LModel;
    LPackage = joiner.LPackage;
    DGraph = joiner.DGraph;
    DValue = joiner.DValue;
    LPointerTargetable = joiner.LPointerTargetable;
    SetFieldAction = joiner.SetFieldAction;

    const canvasToJjom = await import('../src/components/editor-v2/sync/canvasToJjom');
    syncCreateClass = canvasToJjom.syncCreateClass;
    syncReferenceEdge = canvasToJjom.syncReferenceEdge;
    syncCreateObject = canvasToJjom.syncCreateObject;
    syncCreateReferenceLink = canvasToJjom.syncCreateReferenceLink;
    syncDeleteVertex = canvasToJjom.syncDeleteVertex;

    // The dom-setup window shim has no event API; handleRegistry.ts registers
    // an EXECUTION_START listener at module load. No-op polyfills suffice.
    const w: any = (globalThis as any).window;
    if (w) {
        if (typeof w.addEventListener !== 'function') w.addEventListener = () => {};
        if (typeof w.removeEventListener !== 'function') w.removeEventListener = () => {};
        if (typeof w.dispatchEvent !== 'function') w.dispatchEvent = () => true;
    }
    const instanceCmd = await import('../src/jjscript/executor/commands/instance');
    executeDeleteInstance = instanceCmd.executeDeleteInstance;

    await joiner.stateInitializer();

    const DUser: any = joiner.DUser;
    const uid = 'Pointer_OfflineUser';
    DUser.new('Test', 'User', 'test', '', '', false, 'test@example.com', '', uid, undefined, true);
    DUser.current = uid;
    if (joiner.statehistory && joiner.UserHistory && !joiner.statehistory[uid]) {
        joiner.statehistory[uid] = new joiner.UserHistory();
    }
    await new Promise((r) => setTimeout(r, 30));
});

// ---------------------------------------------------------------------------
// Helpers (same idiom as m2-reference-delete.test.ts)
// ---------------------------------------------------------------------------

const flush = async (rounds = 4, ms = 15) => {
    for (let i = 0; i < rounds; i++) {
        await new Promise((r) => setTimeout(r, ms));
    }
};

const lookup = () => (store.getState() as any).idlookup as Record<string, any>;

let consoleErrors: string[] = [];
let origError: typeof console.error;
beforeEach(() => {
    consoleErrors = [];
    origError = console.error;
    console.error = (...args: any[]) => {
        consoleErrors.push(args.map((a) => String(a)).join(' '));
        origError(...args);
    };
});
afterEach(() => {
    console.error = origError;
});

const abortMessages = () =>
    consoleErrors.filter((m) => /transaction (failed|aborted)/i.test(m) || /readonly/i.test(m));

function ensureInCollection(ownerId: string, field: string, id: string) {
    const arr: any[] = lookup()[ownerId]?.[field] ?? [];
    if (!arr.includes(id)) SetFieldAction.new(ownerId as any, field as any, id, '+=', true);
}

interface Fixture {
    projectId: string;
    m2Id: string;
    m1Id: string;
    m1GraphId: string;
    aId: string;          // DClass A
    bId: string;          // DClass B
    rId: string;          // DReference r: A -> B
    r2Id: string;         // DReference r2: B -> A
    a1Id: string;         // DObject a1 (the one that gets deleted)
    b1Id: string;         // DObject b1 (holds the INCOMING slot to a1)
    vA1: string;          // M1 vertices
    vB1: string;
    e1: string;           // M1 edge a1 -r-> b1
    e2: string;           // M1 edge b1 -r2-> a1
    slotA1: string;       // DValue on a1, instanceof r, values [b1]
    slotB1: string;       // DValue on b1, instanceof r2, values [a1]
}

/** Build M2 + M1 through the v2 canvas write paths (+ headless compensation). */
async function buildFixture(tag: string): Promise<Fixture> {
    const dProj = DProject.new('private', 'instdel-' + tag);
    const projectId = dProj.id;
    const dM2 = DModel.new('mm-' + tag, undefined, true);
    const m2: any = LModel.fromD(dM2);
    SetFieldAction.new(projectId, 'metamodels', m2.id, '+=', true);
    const dPkg = m2.addChild('package');
    const pkg: any = LPackage.fromD(dPkg);
    pkg.name = 'default';
    const m2GraphId: string = DGraph.new(0, m2.id).id;
    await flush();

    const vA = syncCreateClass(m2GraphId, 0, 0, false, 'A');
    const vB = syncCreateClass(m2GraphId, 300, 0, false, 'B');
    await flush();
    expect(vA && vB, 'M2 vertices created').toBeTruthy();

    const rRes = syncReferenceEdge(vA, vB, 'r');
    await flush();
    const r2Res = syncReferenceEdge(vB, vA, 'r2');
    await flush();
    expect(rRes?.edgeId && r2Res?.edgeId, 'M2 reference edges created').toBeTruthy();
    const rId: string = lookup()[rRes!.edgeId]?.model;
    const r2Id: string = lookup()[r2Res!.edgeId]?.model;
    expect(rId && r2Id, 'edge.model resolves both DReferences').toBeTruthy();

    const aId: string = lookup()[vA]?.model;
    const bId: string = lookup()[vB]?.model;

    const dM1 = DModel.new('m-' + tag, m2.id, false, true);
    const m1: any = LModel.fromD(dM1);
    SetFieldAction.new(projectId, 'models', m1.id, '+=', true);
    const m1GraphId: string = DGraph.new(0, m1.id).id;
    await flush();

    const vA1 = syncCreateObject(m1GraphId, aId, 0, 0, 'a1') as string;
    const vB1 = syncCreateObject(m1GraphId, bId, 300, 0, 'b1') as string;
    await flush();
    expect(vA1 && vB1, 'M1 vertices created').toBeTruthy();

    const a1Id: string = lookup()[vA1]?.model;
    const b1Id: string = lookup()[vB1]?.model;

    const e1 = syncCreateReferenceLink(vA1, vB1, 'r') as string;
    await flush();
    const e2 = syncCreateReferenceLink(vB1, vA1, 'r2') as string;
    await flush(6);
    expect(e1 && e2, 'M1 edges created').toBeTruthy();

    // Headless compensation (audit F7): force the father-collection shape real
    // app projects have, with REGISTERED writes.
    ensureInCollection(aId, 'references', rId);
    ensureInCollection(bId, 'references', r2Id);
    for (const vid of [vA1, vB1, e1, e2]) ensureInCollection(m1GraphId, 'subElements', vid);
    ensureInCollection(m1.id, 'objects', a1Id);
    ensureInCollection(m1.id, 'objects', b1Id);
    // graph-element father → graph: get_innerGraph (hence vertexProxy.graph,
    // which syncDeleteVertex's connected-edge cleanup depends on) walks
    // data.father; the app runtime wires it, the headless harness does not.
    for (const vid of [vA1, vB1, e1, e2]) {
        if (!lookup()[vid]?.father) SetFieldAction.new(vid as any, 'father' as any, m1GraphId, '', true);
    }
    await flush();

    // Slots: a1 -r-> [b1], b1 -r2-> [a1]. Create directly when the canvas
    // $-accessor write failed headless (registered instanceof so the refs'
    // and objects' pointedBy see them — load-bearing for the cascade).
    const findSlot = (objId: string, refId: string) =>
        (lookup()[objId]?.features ?? []).find((fid: string) => lookup()[fid]?.instanceof === refId);
    const mkSlot = async (name: string, refId: string, targetId: string, objId: string) => {
        let sid = findSlot(objId, refId);
        if (!sid) {
            const dv = DValue.new(name, refId, [targetId], objId, true, false);
            await flush(2);
            if (dv?.id) {
                ensureInCollection(objId, 'features', dv.id);
                SetFieldAction.new(dv.id as any, 'instanceof' as any, refId, '', true);
                sid = dv.id;
            }
        } else {
            // ensure the value itself is a REGISTERED pointer write so the
            // target's pointedBy records the slot (cascade case 'values').
            const vals: any[] = lookup()[sid]?.values ?? [];
            if (!vals.includes(targetId)) SetFieldAction.new(sid as any, 'values' as any, targetId, '+=', true);
        }
        return sid as string;
    };
    const slotA1 = await mkSlot('r', rId, b1Id, a1Id);
    const slotB1 = await mkSlot('r2', r2Id, a1Id, b1Id);
    await flush();
    expect(slotA1 && slotB1, 'both M1 slots exist').toBeTruthy();

    return {
        projectId, m2Id: m2.id, m1Id: m1.id, m1GraphId,
        aId, bId, rId, r2Id, a1Id, b1Id, vA1, vB1, e1, e2, slotA1, slotB1,
    };
}

function deleteContext(fx: Fixture): any {
    return {
        projectId: fx.projectId,
        modelId: fx.m1Id,
        targetMetamodelId: fx.m2Id,
        level: 'M1',
        history: [],
        variables: new Map(),
    };
}

const deleteArgs = (name: string): any => ({ command: 'delete', target: { raw: name, segments: [name] } });

/** The four required post-conditions of a canonical a1 delete. */
function expectA1FullyCascaded(fx: Fixture) {
    const lk = lookup();
    // (1) entry removed
    expect(lk[fx.a1Id], 'a1 idlookup entry removed').toBeUndefined();
    // (2) incoming slot on b1 CLEANED (not deleted): no dead pointer
    expect(lk[fx.slotB1]?.className, 'b1 incoming slot survives').toBe('DValue');
    expect(lk[fx.slotB1]?.values ?? [], 'b1 incoming slot no longer points at a1').not.toContain(fx.a1Id);
    // (3) model.objects without the dead id
    expect(lk[fx.m1Id]?.objects ?? [], 'model.objects cleaned').not.toContain(fx.a1Id);
    // (4) a1's own DValue features deleted (children cascade)
    expect(lk[fx.slotA1], 'a1 own slot removed').toBeUndefined();
    // Vertex: the cascade's nodes step only reaches vertices registered in the
    // transient node registry (mounted classic components — get_nodes filters
    // on n.html). Headless (and in v2-flow) the DVertex may survive as a
    // model-dead ghost: accepted pollution class, render-filtered by
    // jjomVertexToRFNode. If it survives, its model MUST be dead.
    const ghostVertex = lk[fx.vA1];
    if (ghostVertex) expect(lk[ghostVertex.model], 'surviving vertex is model-dead (render-filtered)').toBeUndefined();
    // survivors
    expect(lk[fx.b1Id]?.className).toBe('DObject');
    expect(lk[fx.b1Id]?.features ?? [], 'b1 keeps its slot').toContain(fx.slotB1);
}

// ---------------------------------------------------------------------------
// D1 — JjScript executor path (executeDeleteInstance)
// ---------------------------------------------------------------------------

describe('D1 — executeDeleteInstance routes through the canonical cascade', () => {
    it('deletes a1: entry gone, incoming slot cleaned, model.objects clean, own features gone', async () => {
        const fx = await buildFixture('d1');
        const lProject: any = LPointerTargetable.fromPointer(fx.projectId);

        const res = await executeDeleteInstance(deleteArgs('a1'), deleteContext(fx), lProject);
        await flush(8);

        expect(res.success, 'executor reports success').toBe(true);
        expectA1FullyCascaded(fx);
        // NB: e1/e2 (endpoint-dead zombie edges) are the ACCEPTED residual gap
        // on this path — render-filtered, not asserted here.
        expect(abortMessages(), 'no silent transaction abort').toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// D2 — canvas path (syncDeleteVertex on the instance vertex)
// ---------------------------------------------------------------------------

describe('D2 — syncDeleteVertex on a DObject vertex', () => {
    it('deletes a1 with the same cascade, plus the connected canvas edges', async () => {
        const fx = await buildFixture('d2');

        syncDeleteVertex(fx.vA1);
        await flush(8);

        expectA1FullyCascaded(fx);
        // Canvas path pre-deletes the connected edges of the current graph.
        const lk = lookup();
        expect(lk[fx.e1], 'edge a1->b1 removed').toBeUndefined();
        expect(lk[fx.e2], 'edge b1->a1 removed').toBeUndefined();
        expect(abortMessages(), 'no silent transaction abort').toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// D3 — singleton refusal (both entry points; same flag as the canonical guard)
// ---------------------------------------------------------------------------

describe('D3 — singleton instances are refused', () => {
    it('executor: success=false with SINGLETON_INSTANCE; canvas: instance AND edges survive', async () => {
        const fx = await buildFixture('d3');
        // Flag A as singleton AFTER instance creation (registered D-write; the
        // L-setter would auto-create instances — out of scope here).
        SetFieldAction.new(fx.aId as any, 'isSingleton' as any, true, '', false);
        await flush(2);

        // Executor path: actionable failure, nothing deleted.
        const lProject: any = LPointerTargetable.fromPointer(fx.projectId);
        const res = await executeDeleteInstance(deleteArgs('a1'), deleteContext(fx), lProject);
        await flush(4);
        expect(res.success).toBe(false);
        expect(res.errors?.[0]?.code).toBe('SINGLETON_INSTANCE');
        expect(res.message).toContain('singleton');
        expect(lookup()[fx.a1Id]?.className, 'a1 survives the executor attempt').toBe('DObject');

        // Canvas path: the up-front guard must bail BEFORE the connected-edge
        // cleanup — instance alive AND its canvas edges intact.
        syncDeleteVertex(fx.vA1);
        await flush(4);
        const lk = lookup();
        expect(lk[fx.a1Id]?.className, 'a1 survives the canvas attempt').toBe('DObject');
        expect(lk[fx.vA1]?.className, 'a1 vertex survives').toBeTruthy();
        expect(lk[fx.e1], 'edge a1->b1 NOT pre-deleted on refusal').toBeTruthy();
        expect(lk[fx.e2], 'edge b1->a1 NOT pre-deleted on refusal').toBeTruthy();
        expect(lk[fx.slotB1]?.values ?? [], 'incoming slot untouched').toContain(fx.a1Id);
    });
});
