/**
 * Co-evolution repro (headless, canvas-faithful): deleting r:A->B at M2 must
 * cascade to M1 at every layer that exists headless (D-layer DValue slots,
 * persisted DVoidEdges, graph subElements).
 *
 * Scenario (Alfonso, 2026-07-04): M2 = A, B, r:A->B. M1 = a1:A, a2:A, b:B
 * with r:a1->b and r:a2->b. Deleting r from M2 must delete the M1 links at
 * D-layer, L-layer and visual level.
 *
 * The fixture is built through the SAME functions the v2 canvas uses
 * (syncCreateClass, syncReferenceEdge, syncCreateObject,
 * syncCreateReferenceLink, DGraph.new). Where the headless harness diverges
 * from the app (father-collection arrays not updated without the full app
 * runtime — audit F7), the fixture compensates with explicit registered
 * SetFieldActions so the D-layer state matches what real app projects
 * contain. The two M1 edges deliberately cover BOTH zombie families:
 *   e1 — created model-less (resolveReferenceIdByName failure, audit F5)
 *   e2 — carries a registered `model` back-pointer to r
 *
 * Entry points covered:
 *   T2 — canvas edge delete (syncDeleteEdge)         = Alfonso's repro
 *   T3 — bare lRef.delete() (panel/script semantics) + explicit sweep
 *   T4 — target class delete (syncDeleteVertex on B) = incoming-ref cascade
 *
 * Runs headless via its own config (stubs for monaco/jquery/sweetalert2):
 *   npx vitest run --config coevolution-tests/vitest.coevolution.config.ts
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';

// ESM static imports hoist above any stub statement, and the joiner touches
// window/document at module load. All app imports are dynamic, resolved in
// beforeAll AFTER the dom-setup setupFile has installed the shims.
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
let syncDeleteEdge: any;
let syncDeleteVertex: any;
let sweepAllM1ReferenceGraphs: any;

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
    syncDeleteEdge = canvasToJjom.syncDeleteEdge;
    syncDeleteVertex = canvasToJjom.syncDeleteVertex;

    const sweep = await import('../src/components/editor-v2/sync/m1EdgeSweep');
    sweepAllM1ReferenceGraphs = sweep.sweepAllM1ReferenceGraphs;

    // App bootstrap: stateInitializer wires D→L logic/singletons
    // (buildLSingletons) exactly as App.tsx:95 does.
    await joiner.stateInitializer();

    // Offline-user bootstrap: DProject.new → LUser.getUser().projects.
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
// Helpers
// ---------------------------------------------------------------------------

const flush = async (rounds = 4, ms = 15) => {
    for (let i = 0; i < rounds; i++) {
        await new Promise((r) => setTimeout(r, ms));
    }
};

const lookup = () => (store.getState() as any).idlookup as Record<string, any>;

/** Collect console.error output to surface silent TRANSACTION aborts. */
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

interface Fixture {
    projectId: string;
    m2Id: string;
    m1Id: string;
    m2GraphId: string;
    m1GraphId: string;
    aId: string;          // DClass A
    bId: string;          // DClass B
    rId: string;          // DReference r: A -> B
    vA: string;           // M2 vertices
    vB: string;
    m2EdgeId: string;     // DVoidEdge over r on the M2 canvas
    a1Id: string;         // DObjects
    a2Id: string;
    bObjId: string;
    vA1: string;          // M1 vertices
    vA2: string;
    vBo: string;
    m1EdgeNoModel: string;   // e1 — zombie family: no `model` back-pointer
    m1EdgeWithModel: string; // e2 — `model` registered to r
    slotIds: string[];       // DValue slots with instanceof === rId
}

/** Ensure `id` is listed in the `field` array of `ownerId` (registered write). */
function ensureInCollection(ownerId: string, field: string, id: string) {
    const arr: any[] = lookup()[ownerId]?.[field] ?? [];
    if (!arr.includes(id)) SetFieldAction.new(ownerId as any, field as any, id, '+=', true);
}

/** Build M2 + M1 through the v2 canvas write paths (+ headless compensation). */
async function buildCanvasFixture(tag: string): Promise<Fixture> {
    // Project + M2 model + package (ProjectEditor idiom)
    const dProj = DProject.new('private', 'coevo-' + tag);
    const projectId = dProj.id;
    const dM2 = DModel.new('mm-' + tag, undefined, true);
    const m2: any = LModel.fromD(dM2);
    SetFieldAction.new(projectId, 'metamodels', m2.id, '+=', true);
    const dPkg = m2.addChild('package');
    const pkg: any = LPackage.fromD(dPkg);
    pkg.name = 'default';
    const m2GraphId: string = DGraph.new(0, m2.id).id;
    await flush();

    // M2 canvas: two classes and the reference edge (palette drop + drawn edge)
    const vA = syncCreateClass(m2GraphId, 0, 0, false, 'A');
    const vB = syncCreateClass(m2GraphId, 300, 0, false, 'B');
    await flush();
    expect(vA && vB, 'M2 vertices created').toBeTruthy();

    const refRes = syncReferenceEdge(vA, vB, 'r');
    await flush();
    expect(refRes?.edgeId, 'M2 reference edge created').toBeTruthy();
    const m2EdgeId: string = refRes!.edgeId;
    const rId: string = lookup()[m2EdgeId]?.model;
    expect(rId, 'edge.model resolves the DReference').toBeTruthy();

    const aId: string = lookup()[vA]?.model;
    const bId: string = lookup()[vB]?.model;

    // M1 model + canvas
    const dM1 = DModel.new('m-' + tag, m2.id, false, true);
    const m1: any = LModel.fromD(dM1);
    SetFieldAction.new(projectId, 'models', m1.id, '+=', true);
    const m1GraphId: string = DGraph.new(0, m1.id).id;
    await flush();

    const vA1 = syncCreateObject(m1GraphId, aId, 0, 0, 'a1') as string;
    const vA2 = syncCreateObject(m1GraphId, aId, 0, 200, 'a2') as string;
    const vBo = syncCreateObject(m1GraphId, bId, 300, 100, 'b') as string;
    await flush();
    expect(vA1 && vA2 && vBo, 'M1 vertices created').toBeTruthy();

    const a1Id: string = lookup()[vA1]?.model;
    const a2Id: string = lookup()[vA2]?.model;
    const bObjId: string = lookup()[vBo]?.model;

    // Draw the two instance links (M1ReferencePopup / edge-draw path)
    const e1 = syncCreateReferenceLink(vA1, vBo, 'r') as string;
    await flush();
    const e2 = syncCreateReferenceLink(vA2, vBo, 'r') as string;
    await flush(6);
    expect(e1 && e2, 'M1 edges created').toBeTruthy();

    // ---- Headless compensation (audit F7) --------------------------------
    // Without the full app runtime some father-collection arrays are not
    // updated headless (A.references, DObject.features, graph.subElements).
    // Real app projects DO contain them, so force the same shape with
    // REGISTERED SetFieldActions before exercising deletion semantics.
    ensureInCollection(aId, 'references', rId);
    ensureInCollection(m2GraphId, 'subElements', vA);
    ensureInCollection(m2GraphId, 'subElements', vB);
    ensureInCollection(m2GraphId, 'subElements', m2EdgeId);
    for (const vid of [vA1, vA2, vBo, e1, e2]) ensureInCollection(m1GraphId, 'subElements', vid);
    ensureInCollection(m1.id, 'objects', a1Id);
    ensureInCollection(m1.id, 'objects', a2Id);
    ensureInCollection(m1.id, 'objects', bObjId);
    await flush();

    // Slots: one DValue per source object, instanceof=r, values=[b].
    // syncCreateReferenceLink's $-accessor write depends on the metaclass
    // reference being resolvable by name; create the slots directly when it
    // failed (registered instanceof so r.pointedBy sees them — cascade path).
    const findSlot = (objId: string) =>
        (lookup()[objId]?.features ?? []).find((fid: string) => lookup()[fid]?.instanceof === rId);
    for (const objId of [a1Id, a2Id]) {
        if (!findSlot(objId)) {
            const dv = DValue.new('r', rId, [bObjId], objId, true, false);
            await flush(2);
            if (dv?.id) {
                ensureInCollection(objId, 'features', dv.id);
                // re-set instanceof as a REGISTERED pointer write so the slot
                // appears in r.pointedBy even if the constructor path did not
                // register it headless.
                SetFieldAction.new(dv.id as any, 'instanceof' as any, rId, '', true);
            }
        }
    }
    await flush();

    // e1 stays model-less (zombie family F5); e2 gets a registered back-pointer.
    SetFieldAction.new(e2 as any, 'model' as any, rId, '', true);
    await flush();

    const lk = lookup();
    const slotIds: string[] = [];
    for (const objId of [a1Id, a2Id]) {
        for (const fid of lk[objId]?.features ?? []) {
            if (lk[fid]?.instanceof === rId) slotIds.push(fid);
        }
    }

    return {
        projectId, m2Id: m2.id, m1Id: m1.id, m2GraphId, m1GraphId,
        aId, bId, rId, vA, vB, m2EdgeId,
        a1Id, a2Id, bObjId,
        vA1, vA2, vBo,
        m1EdgeNoModel: e1, m1EdgeWithModel: e2,
        slotIds,
    };
}

// ---------------------------------------------------------------------------
// T1 — fixture sanity: D-layer wiring as real app projects have it
// ---------------------------------------------------------------------------

describe('T1 — canvas-path fixture sanity', () => {
    it('wires r into A.references, 2 slots, 3 backing edges (e1 model-less)', async () => {
        const fx = await buildCanvasFixture('t1');
        const lk = lookup();

        expect(lk[fx.rId]?.className).toBe('DReference');
        expect(lk[fx.rId]?.type, 'r.type -> B').toBe(fx.bId);
        expect(lk[fx.aId]?.references ?? [], 'A.references contains r').toContain(fx.rId);
        expect(lk[fx.rId]?.__readonly ?? false).toBeFalsy();

        expect(fx.slotIds.length, 'one r-slot on a1 and one on a2').toBe(2);
        for (const sid of fx.slotIds) {
            expect(lk[sid]?.className).toBe('DValue');
            expect(lk[sid]?.instanceof).toBe(fx.rId);
            expect(lk[sid]?.values ?? []).toContain(fx.bObjId);
        }

        expect(lk[fx.m2EdgeId]?.model, 'M2 edge backed by r').toBe(fx.rId);
        expect(lk[fx.m1EdgeWithModel]?.model, 'e2 backed by r').toBe(fx.rId);
        const e1Model = lk[fx.m1EdgeNoModel]?.model;
        console.log('[T1] e1.model (expected missing, zombie family F5):', JSON.stringify(e1Model));

        // Load-bearing for the cascade: the slots' instanceof pointers must be
        // REGISTERED in r.pointedBy, otherwise Dummy.get_delete cannot reach them.
        const pb = JSON.stringify(lk[fx.rId]?.pointedBy ?? []);
        for (const sid of fx.slotIds) {
            expect(pb, `r.pointedBy references slot ${sid} (instanceof)`).toContain(sid);
        }

        expect(abortMessages(), 'no transaction abort during fixture build').toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// T2 — Alfonso's repro: delete the r edge on the M2 canvas (syncDeleteEdge)
// ---------------------------------------------------------------------------

describe('T2 — syncDeleteEdge on the M2 reference edge (canvas repro)', () => {
    it('cascades to M1: r, slots, and BOTH backing edge families disappear', async () => {
        const fx = await buildCanvasFixture('t2');

        syncDeleteEdge(fx.m2EdgeId, false);
        await flush(8);

        const lk = lookup();
        // M2
        expect(lk[fx.rId], 'DReference removed').toBeUndefined();
        expect(lk[fx.aId]?.references ?? [], 'A.references cleaned').not.toContain(fx.rId);
        expect(lk[fx.m2EdgeId], 'M2 DVoidEdge removed').toBeUndefined();
        // M1 D-layer
        for (const sid of fx.slotIds) {
            expect(lk[sid], `DValue slot ${sid} removed`).toBeUndefined();
        }
        expect(lk[fx.a1Id]?.features ?? [], 'a1.features cleaned').not.toContain(fx.slotIds[0]);
        expect(lk[fx.a2Id]?.features ?? [], 'a2.features cleaned').not.toContain(fx.slotIds[1]);
        // M1 visual: model-backed edge (enumeration/cascade) AND model-less
        // edge (structural sweep) must both die.
        expect(lk[fx.m1EdgeWithModel], 'M1 edge WITH model removed').toBeUndefined();
        expect(lk[fx.m1EdgeNoModel], 'M1 edge WITHOUT model removed (sweep)').toBeUndefined();
        expect(lk[fx.m1GraphId]?.subElements ?? []).not.toContain(fx.m1EdgeWithModel);
        expect(lk[fx.m1GraphId]?.subElements ?? []).not.toContain(fx.m1EdgeNoModel);
        // survivors
        expect(lk[fx.a1Id]?.className).toBe('DObject');
        expect(lk[fx.a2Id]?.className).toBe('DObject');
        expect(lk[fx.bObjId]?.className).toBe('DObject');

        expect(abortMessages(), 'no silent transaction abort').toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// T3 — bare lRef.delete(): semantics of every non-canvas entry point
// (properties panel / scripts / cascades that call .delete() directly)
// ---------------------------------------------------------------------------

describe('T3 — bare lRef.delete() (non-canvas entry points)', () => {
    it('cascade cleans M2+slots+model-backed edges; sweep reaps model-less', async () => {
        const fx = await buildCanvasFixture('t3');

        const lRef: any = LPointerTargetable.fromPointer(fx.rId);
        expect(lRef).toBeTruthy();
        lRef.delete();
        await flush(8);

        const lk1 = lookup();
        expect(lk1[fx.rId], 'DReference removed').toBeUndefined();
        expect(lk1[fx.aId]?.references ?? []).not.toContain(fx.rId);
        for (const sid of fx.slotIds) {
            expect(lk1[sid], `DValue slot ${sid} removed`).toBeUndefined();
        }
        // Fix A (Dummy case 'model'): edges whose model POINTS at r die in-cascade.
        expect(lk1[fx.m2EdgeId], 'M2 edge removed by cascade (case model)').toBeUndefined();
        expect(lk1[fx.m1EdgeWithModel], 'model-backed M1 edge removed by cascade').toBeUndefined();
        // The model-less edge is unreachable via pointedBy: reaped by the sweep
        // (in the app: useM1ReferenceEdges' reconcile when the canvas is
        // mounted, or the imperative sweep from the delete paths).
        expect(lk1[fx.m1EdgeNoModel], 'model-less edge still there pre-sweep').toBeTruthy();
        sweepAllM1ReferenceGraphs();
        await flush(4);
        const lk2 = lookup();
        expect(lk2[fx.m1EdgeNoModel], 'model-less edge reaped by sweep').toBeUndefined();

        expect(abortMessages(), 'no silent transaction abort').toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// T4 — delete the TARGET class B from the M2 canvas (syncDeleteVertex)
// ---------------------------------------------------------------------------

describe('T4 — syncDeleteVertex on class B (incoming reference cascade)', () => {
    it('deletes B, incoming r, M1 slots, and all backing edges', async () => {
        const fx = await buildCanvasFixture('t4');

        syncDeleteVertex(fx.vB);
        await flush(8);

        const lk = lookup();
        expect(lk[fx.bId], 'DClass B removed').toBeUndefined();
        expect(lk[fx.rId], 'incoming r removed (case type)').toBeUndefined();
        expect(lk[fx.aId]?.references ?? [], 'A.references cleaned').not.toContain(fx.rId);
        for (const sid of fx.slotIds) {
            expect(lk[sid], `DValue slot ${sid} removed`).toBeUndefined();
        }
        expect(lk[fx.m2EdgeId], 'M2 edge removed').toBeUndefined();
        expect(lk[fx.m1EdgeWithModel], 'model-backed M1 edge removed').toBeUndefined();
        expect(lk[fx.m1EdgeNoModel], 'model-less M1 edge removed (deferred sweep)').toBeUndefined();
        // b instance survives orphaned (design choice C.3 / Fix 2c)
        expect(lk[fx.bObjId]?.className).toBe('DObject');
        expect(lk[fx.bObjId]?.instanceof ?? '', 'b orphaned').toBe('');

        expect(abortMessages(), 'no silent transaction abort').toEqual([]);
    });
});
