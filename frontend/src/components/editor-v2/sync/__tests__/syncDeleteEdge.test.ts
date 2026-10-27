/**
 * syncDeleteEdge — an M1 edge is a link, not the reference it instantiates (P-2026-09-30-1542).
 *
 * MEASURED (report `docs/discovery/discovery_2026-09-30_reference_delete.md` §2, §4): on an M1 canvas the
 * four delete paths (Delete, Backspace, the edge's context menu, the toolbar trash) reach `syncDeleteEdge`,
 * whose non-inheritance branch read the edge's `model` — for an M1 link, the metaclass DReference — and ran
 * the M2 cascade on it: the reference, every slot of every instance and every edge backed by it were gone.
 *
 * Same fake-barrel idiom as `hooks/__tests__/createAdapterFlow.test.ts`: the joiner barrel reaches monaco,
 * which dereferences `window` at import, so it is mocked; the subject, `canvasToJjom.ts`, runs for real, and
 * so does `syncState.ts` (pure), whose pair guard is read back. The L proxies are plain objects whose writes
 * are spies: the assertion is which slot, which index, which graph, and that the three writes share ONE
 * TRANSACTION (one dispatch), which only the call record can show.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Any = any;

const H = vi.hoisted(() => ({
    state: { idlookup: {} as Record<string, Any> },
    proxies: {} as Record<string, Any>,
    /** Every write, tagged with the TRANSACTION depth it ran at. */
    log: [] as Array<{ kind: string; args: Any[]; depth: number }>,
    depth: 0,
    transactions: 0,
}));

vi.mock('../../../../joiner', () => {
    const rec = (kind: string) => (...args: Any[]) => { H.log.push({ kind, args, depth: H.depth }); return true; };
    return {
        store: { getState: () => H.state },
        LPointerTargetable: { fromPointer: (id: string) => (id ? H.proxies[id] ?? null : null) },
        TRANSACTION: (_name: string, fn: () => void) => { H.transactions++; H.depth++; try { fn(); } finally { H.depth--; } },
        SetFieldAction: { new: rec('SetFieldAction') },
        DeleteElementAction: { new: rec('DeleteElementAction') },
        DVertex: {}, DEdge: {}, DVoidEdge: { new2: rec('DVoidEdge.new2') }, DObject: {}, DModel: {}, DClass: {},
        DEnumerator: {}, DPackage: {}, GraphSize: {},
    };
});
vi.mock('../m1EdgeSweep', () => ({ sweepAllM1ReferenceGraphs: vi.fn() }));
vi.mock('../../hooks/useOrphanFeatures', () => ({ captureAttributeOrphanValues: vi.fn() }));
vi.mock('../../viewpoint/layout/vertexLayoutAdapter', () => ({ getActiveLayoutKey: () => 'abstract' }));

const GRAPH = 'g1';

/** A DObject with its vertex; `features` filled by `slot`. */
function object(id: string, vertex: string): void {
    H.state.idlookup[id] = { className: 'DObject', id, features: [] };
    H.state.idlookup[vertex] = { className: 'DVertex', id: vertex, model: id, father: GRAPH };
}

/** A DValue of `owner` instantiating `meta`, with a proxy whose setValueAtPosition is a spy. */
function slot(id: string, owner: string, meta: string, values: string[]): void {
    H.state.idlookup[id] = { className: 'DValue', id, father: owner, instanceof: meta, values };
    H.state.idlookup[owner].features.push(id);
    H.proxies[id] = {
        id,
        setValueAtPosition: (...args: Any[]) => { H.log.push({ kind: 'setValueAtPosition', args: [id, ...args], depth: H.depth }); return { success: true }; },
    };
}

function reference(id: string, opts: { containment?: boolean } = {}): void {
    H.state.idlookup[id] = { className: 'DReference', id, containment: !!opts.containment };
    H.proxies[id] = { id, __raw: H.state.idlookup[id], delete: () => H.log.push({ kind: 'delete', args: [id], depth: H.depth }) };
}

function edge(id: string, start: string, end: string, model?: string): void {
    H.state.idlookup[id] = { className: 'DVoidEdge', id, start, end, model, father: GRAPH, graph: GRAPH };
    H.state.idlookup[GRAPH].subElements.push(id);
    H.proxies[id] = {
        id, __raw: H.state.idlookup[id],
        get model() { return model ? H.proxies[model] ?? null : undefined; },
        get start() { return H.proxies[start]; },
        get end() { return H.proxies[end]; },
    };
}

const writes = (kind: string) => H.log.filter(l => l.kind === kind);

let SUT: typeof import('../canvasToJjom');
let SYNC: typeof import('../syncState');

beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    H.state = { idlookup: {} };
    H.proxies = {};
    H.log = [];
    H.depth = 0;
    H.transactions = 0;
    H.state.idlookup[GRAPH] = { className: 'DGraph', id: GRAPH, subElements: [] };
    SUT = await import('../canvasToJjom');
    SYNC = await import('../syncState');
    SYNC.clearCanvasEdgePairs();
});

describe('syncDeleteEdge on an M1 link', () => {
    beforeEach(() => {
        reference('R');
        object('a', 'va');
        object('b', 'vb');
        object('x', 'vx');
        // b sits at index 1, not 0: the index is the target's, not the first.
        slot('aR', 'a', 'R', ['x', 'b']);
        edge('E', 'va', 'vb', 'R');
    });

    it('removes the target from the slot at its index and never deletes the reference', () => {
        SUT.syncDeleteEdge('E', false);
        vi.runAllTimers();
        expect(writes('delete')).toEqual([]);
        expect(writes('setValueAtPosition').map(l => l.args)).toEqual([['aR', 1, undefined, { isPtr: true }]]);
    });

    it('deletes the DEdge and takes it out of its graph', () => {
        SUT.syncDeleteEdge('E', false);
        expect(writes('DeleteElementAction').map(l => l.args[0])).toEqual([H.state.idlookup.E]);
        expect(writes('SetFieldAction').map(l => l.args)).toEqual([[GRAPH, 'subElements', 'E', '-=', true]]);
    });

    it('issues the three writes in one TRANSACTION', () => {
        SUT.syncDeleteEdge('E', false);
        expect(H.transactions).toBe(1);
        expect(H.log.every(l => l.depth === 1)).toBe(true);
        expect(H.log.map(l => l.kind).sort()).toEqual(['DeleteElementAction', 'SetFieldAction', 'setValueAtPosition']);
    });

    it('clears the pair guard of the two vertices', () => {
        SYNC.markCanvasEdgePair('va', 'vb');
        SUT.syncDeleteEdge('E', false);
        expect(SYNC.hasCanvasEdgePair('va→vb')).toBe(false);
    });

    it('writes the slot of the edge\'s reference when two references link the same pair', () => {
        reference('S');
        slot('aS', 'a', 'S', ['b']);
        // The other reference's slot first, so a «first slot holding the target» would pick it.
        H.state.idlookup.a.features = ['aS', 'aR'];
        SUT.syncDeleteEdge('E', false);
        expect(writes('setValueAtPosition').map(l => l.args[0])).toEqual(['aR']);
    });

    it('with no model on the edge, writes the one reference slot that holds the target', () => {
        edge('E2', 'va', 'vx');   // model-less (resolveReferenceIdByName failed at creation)
        SUT.syncDeleteEdge('E2', false);
        expect(writes('setValueAtPosition').map(l => l.args)).toEqual([['aR', 0, undefined, { isPtr: true }]]);
        expect(writes('delete')).toEqual([]);
    });

    it('with no model and two candidate slots, deletes the edge alone', () => {
        reference('S');
        slot('aS', 'a', 'S', ['b']);
        edge('E3', 'va', 'vb');
        SUT.syncDeleteEdge('E3', false);
        expect(writes('setValueAtPosition')).toEqual([]);
        expect(writes('DeleteElementAction').map(l => l.args[0].id)).toEqual(['E3']);
        expect(writes('delete')).toEqual([]);
    });

    it('with no model, an attribute slot holding the same string is not a candidate', () => {
        H.state.idlookup.nameAttr = { className: 'DAttribute', id: 'nameAttr' };
        slot('aName', 'a', 'nameAttr', ['vx', 'x']);
        edge('E4', 'va', 'vx');
        SUT.syncDeleteEdge('E4', false);
        expect(writes('setValueAtPosition').map(l => l.args[0])).toEqual(['aR']);
    });

    it('takes the edge out of the graph that lists it only', () => {
        // A father that does not list the edge (the vertex) next to the graph that does.
        H.state.idlookup.va.subElements = [];
        edge('E5', 'va', 'vb', 'R');
        H.state.idlookup.E5.father = 'va';
        SUT.syncDeleteEdge('E5', false);
        expect(writes('SetFieldAction').map(l => l.args[0])).toEqual([GRAPH]);
    });

    it('a composition link goes through the same slot write (the L-layer detaches the child)', () => {
        reference('C', { containment: true });
        object('child', 'vchild');
        slot('aC', 'a', 'C', ['child']);
        edge('EC', 'va', 'vchild', 'C');
        SUT.syncDeleteEdge('EC', false);
        expect(writes('setValueAtPosition').map(l => l.args)).toEqual([['aC', 0, undefined, { isPtr: true }]]);
        expect(writes('delete')).toEqual([]);
    });
});

describe('syncDeleteEdge: the other paths are unchanged', () => {
    it('an M2 reference edge still cascades the DReference', () => {
        reference('R');
        H.state.idlookup.A = { className: 'DClass', id: 'A' };
        H.state.idlookup.B = { className: 'DClass', id: 'B' };
        H.state.idlookup.vA = { className: 'DVertex', id: 'vA', model: 'A', father: GRAPH };
        H.state.idlookup.vB = { className: 'DVertex', id: 'vB', model: 'B', father: GRAPH };
        edge('M2', 'vA', 'vB', 'R');
        SUT.syncDeleteEdge('M2', false);
        expect(writes('delete').map(l => l.args[0])).toEqual(['R']);
        expect(writes('setValueAtPosition')).toEqual([]);
    });

    it('an M1 edge whose model is not a DReference keeps the legacy path', () => {
        object('a', 'va');
        object('b', 'vb');
        H.state.idlookup.O = { className: 'DObject', id: 'O', features: [] };
        H.proxies.O = { id: 'O', delete: () => H.log.push({ kind: 'delete', args: ['O'], depth: H.depth }) };
        edge('EO', 'va', 'vb', 'O');
        SUT.syncDeleteEdge('EO', false);
        expect(writes('delete').map(l => l.args[0])).toEqual(['O']);
        expect(writes('setValueAtPosition')).toEqual([]);
    });

    it('an inheritance edge updates extends and deletes the edge', () => {
        const sub: Any = { id: 'Sub', extends: ['Sup', 'Other'] };
        const sup: Any = { id: 'Sup' };
        H.proxies.vSub = { model: sub };
        H.proxies.vSup = { model: sup };
        H.state.idlookup.I = { className: 'DEdge', id: 'I', start: 'vSub', end: 'vSup' };
        H.proxies.I = { id: 'I', __raw: H.state.idlookup.I, start: H.proxies.vSub, end: H.proxies.vSup };
        SUT.syncDeleteEdge('I', true);
        expect(sub.extends).toEqual(['Other']);
        expect(writes('DeleteElementAction').map(l => l.args[0].id)).toEqual(['I']);
    });

    it('an unknown edge id writes nothing', () => {
        SUT.syncDeleteEdge('nope', false);
        expect(H.log).toEqual([]);
    });
});
