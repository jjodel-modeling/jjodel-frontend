/**
 * useM1ReferenceEdges — a stale M1 reference edge leaves its graph's subElements (P-2026-10-10-1600).
 *
 * MEASURED (report `docs/discovery/discovery_2026-10-10_stale_m1_reference_edge.md` §4, trunk `7a271476c`): after a
 * reference-slot removal the reconcile deleted the DVoidEdge with a bare DeleteElementAction, which removes the
 * idlookup key only. The id stayed in `graph.subElements`, so useJjomSync's incremental removal, which fires when an
 * id leaves `subElements`, never dropped the React Flow edge: 1, 2, 3 stale edges drawn over three round trips. The
 * fix scrubs the id in the same delete-only TRANSACTION, the write m1EdgeSweep.ts and canvasToJjom.deleteM1Link make.
 *
 * The subject runs, its world is faked. Same fake-barrel idiom as `sync/__tests__/syncDeleteEdge.test.ts`: the
 * joiner barrel reaches monaco, which dereferences `window` at import, so it is mocked and every write is a spy
 * tagged with the TRANSACTION depth it ran at. `react` is stubbed so the hook's effect body runs when the hook is
 * called, and `react-redux`'s `useSelector` reads the fake state, as in
 * `viewpoint/ir/__tests__/useContentSizeLoop.test.ts`. `sync/syncState.ts` is real (pure), and its pair guard is
 * read back. Module state (the pair guard) is flushed in `beforeEach` (P11).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Any = any;

const H = vi.hoisted(() => ({
    state: { idlookup: {} as Record<string, Any> },
    /** Every write, tagged with the TRANSACTION depth it ran at. */
    log: [] as Array<{ kind: string; args: Any[]; depth: number }>,
    depth: 0,
    transactions: 0,
}));

vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return { ...actual, useEffect: (fn: () => void) => { fn(); } };
});
vi.mock('react-redux', () => ({ useSelector: (sel: (s: Any) => unknown) => sel(H.state) }));
vi.mock('../../../../joiner', () => {
    const rec = (kind: string) => (...args: Any[]) => { H.log.push({ kind, args, depth: H.depth }); return true; };
    return {
        store: { getState: () => H.state },
        TRANSACTION: (_name: string, fn: () => void) => { H.transactions++; H.depth++; try { fn(); } finally { H.depth--; } },
        SetFieldAction: { new: rec('SetFieldAction') },
        DeleteElementAction: { new: rec('DeleteElementAction') },
        DVoidEdge: { new2: rec('DVoidEdge.new2') },
        DState: {}, DEdge: {},
    };
});

const MODEL = 'M';
const GRAPH = 'G';

function reference(id: string): void {
    H.state.idlookup[id] = { className: 'DReference', id };
}

/** A root DObject of the model and its vertex in the graph. */
function object(id: string, vertex: string): void {
    H.state.idlookup[id] = { className: 'DObject', id, features: [] };
    H.state.idlookup[MODEL].objects.push(id);
    H.state.idlookup[vertex] = { className: 'DVertex', id: vertex, model: id, father: GRAPH };
    H.state.idlookup[GRAPH].subElements.push(vertex);
}

/** A DValue of `owner` instantiating `meta`. */
function slot(id: string, owner: string, meta: string, values: string[]): void {
    H.state.idlookup[id] = { className: 'DValue', id, father: owner, instanceof: meta, values };
    H.state.idlookup[owner].features.push(id);
}

/** A persisted M1 reference edge listed in the graph. */
function edge(id: string, start: string, end: string, model: string): void {
    H.state.idlookup[id] = { className: 'DVoidEdge', id, start, end, model, father: GRAPH, graph: GRAPH };
    H.state.idlookup[GRAPH].subElements.push(id);
}

const writes = (kind: string) => H.log.filter(l => l.kind === kind);

let SUT: typeof import('../useM1ReferenceEdges');
let SYNC: typeof import('../../sync/syncState');

beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('window', {});
    H.state = { idlookup: {} };
    H.log = [];
    H.depth = 0;
    H.transactions = 0;
    H.state.idlookup[MODEL] = { className: 'DModel', id: MODEL, objects: [] };
    H.state.idlookup[GRAPH] = { className: 'DGraph', id: GRAPH, model: MODEL, subElements: [] };
    reference('R');
    object('a', 'va');
    object('b', 'vb');
    object('c', 'vc');
    SUT = await import('../useM1ReferenceEdges');
    SYNC = await import('../../sync/syncState');
    SYNC.clearCanvasEdgePairs();
});

describe('useM1ReferenceEdges reconcile: a stale edge', () => {
    beforeEach(() => {
        // a.R was [b]; the value was removed, the edge a→b is still persisted.
        slot('aR', 'a', 'R', []);
        edge('E', 'va', 'vb', 'R');
    });

    it('takes the deleted edge out of its graph\'s subElements', () => {
        SUT.useM1ReferenceEdges(MODEL, GRAPH);
        expect(writes('SetFieldAction').map(l => l.args)).toEqual([[GRAPH, 'subElements', 'E', '-=', true]]);
    });

    it('deletes the DVoidEdge and scrubs it in one TRANSACTION', () => {
        SUT.useM1ReferenceEdges(MODEL, GRAPH);
        expect(writes('DeleteElementAction').map(l => l.args[0])).toEqual([H.state.idlookup.E]);
        expect(H.transactions).toBe(1);
        expect(H.log.every(l => l.depth === 1)).toBe(true);
        expect(H.log.map(l => l.kind).sort()).toEqual(['DeleteElementAction', 'SetFieldAction']);
    });

    it('clears the pair guard of the two vertices', () => {
        SYNC.markCanvasEdgePair('va', 'vb');
        SUT.useM1ReferenceEdges(MODEL, GRAPH);
        expect(SYNC.hasCanvasEdgePair('va→vb')).toBe(false);
    });

    it('scrubs every stale edge of the batch, each by its own id, in the one TRANSACTION', () => {
        edge('F', 'va', 'vc', 'R');
        SUT.useM1ReferenceEdges(MODEL, GRAPH);
        expect(H.transactions).toBe(1);
        expect(writes('SetFieldAction').map(l => l.args)).toEqual([
            [GRAPH, 'subElements', 'E', '-=', true],
            [GRAPH, 'subElements', 'F', '-=', true],
        ]);
        expect(H.log.every(l => l.depth === 1)).toBe(true);
    });

    it('leaves the live edge of another pair alone', () => {
        H.state.idlookup.aR.values = ['c'];
        edge('F', 'va', 'vc', 'R');
        SUT.useM1ReferenceEdges(MODEL, GRAPH);
        expect(writes('SetFieldAction').map(l => l.args[2])).toEqual(['E']);
        expect(writes('DeleteElementAction').map(l => l.args[0].id)).toEqual(['E']);
    });
});

describe('useM1ReferenceEdges reconcile: unchanged paths', () => {
    it('writes nothing when the pair is live', () => {
        slot('aR', 'a', 'R', ['b']);
        edge('E', 'va', 'vb', 'R');
        SUT.useM1ReferenceEdges(MODEL, GRAPH);
        expect(H.log).toEqual([]);
        expect(H.transactions).toBe(0);
    });

    it('creates a missing pair edge bare, outside any TRANSACTION, and marks the pair (rule 12, rule 13)', () => {
        slot('aR', 'a', 'R', ['b']);
        SUT.useM1ReferenceEdges(MODEL, GRAPH);
        expect(writes('DVoidEdge.new2').map(l => [l.depth, ...l.args.slice(0, 6)])).toEqual([[0, 'R', GRAPH, GRAPH, undefined, 'va', 'vb']]);
        expect(writes('SetFieldAction')).toEqual([]);
        expect(H.transactions).toBe(0);
        expect(SYNC.hasCanvasEdgePair('va→vb')).toBe(true);
    });
});
