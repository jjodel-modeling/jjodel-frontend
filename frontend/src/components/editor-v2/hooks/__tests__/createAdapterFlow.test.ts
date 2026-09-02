/**
 * VIEW1 — the v2-flow artifacts a containment child gets from the Data Manager path.
 *
 * MEASURED (probe `_tmp_view1_verify.ts`): a child created from the manager existed in the
 * model and had no node and no edge on the canvas, because `useJjomSync` Step 2 iterates
 * `model.objects` (`useJjomSync.ts:759`) and a contained instance is deliberately not in
 * that collection. `createInstance` now creates them, the way `ContextMenu.tsx:347-373`
 * already does after `LValue.addObject`.
 *
 * Why every dependency is mocked and the subject is not: `createAdapter.ts` says in its own
 * header that it is the impure half and cannot be imported under vitest — the joiner barrel
 * reaches monaco, which dereferences `window` at import time. Same fake-barrel idiom as
 * `problems/__tests__/UniquenessProblemSync.test.ts`. What runs for real is the subject: the
 * graph resolution, the idempotence guard, the cascade, and the two calls.
 *
 * The two canvas writers are SPIES rather than stubs on purpose: the assertion of this slice
 * is not «a vertex exists» but «the vertex wraps THIS child, on THIS graph» — identity, which
 * only the arguments can show.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Any = any;

const H = vi.hoisted(() => ({
    state: { idlookup: {} as Record<string, Any>, graphs: [] as string[] },
    proxies: {} as Record<string, Any>,
    createVertex: vi.fn(),
    createEdge: vi.fn(),
}));

vi.mock('../../../../joiner', () => ({
    store: { getState: () => H.state },
    U: { isProjectModified: false, UpdatingTimer: 0 },
    LPointerTargetable: { fromPointer: (id: string) => H.proxies[id] ?? null },
}));
vi.mock('../../../../model/logicWrapper/nameUniqueness', () => ({ getNamespaceOf: () => [] }));
vi.mock('../../../../jjform', () => ({
    draftableAttrs: () => [], draftableRefs: () => [], draftTargets: () => [],
}));
vi.mock('../../../../jjform/shape', () => ({ isAutoIdAttr: () => false }));
vi.mock('../createDraw', () => ({
    candidatesFor: () => [], childCount: () => 0, containmentChain: () => [], nextIdValue: () => 1,
}));
vi.mock('../useEditorMode', () => ({
    getMetaclassInfo: () => ({
        allClasses: [{ name: 'Edition', id: 'edCls', references: [], attributes: [], allAttributes: [] }],
    }),
}));
vi.mock('../../sync/canvasToJjom', () => ({
    createVertexForObject: (...a: Any[]) => H.createVertex(...a),
    createCompositionEdgeForObjects: (...a: Any[]) => H.createEdge(...a),
}));

const GRAPH = 'g1';
const MODEL = 'm1';
const PARENT = 'book';
const CHILD = 'child';

/** The graph as the store holds it: a DGraph plus whatever DVertex ids it carries. */
function setGraph(subElements: string[], opts: { style?: string; model?: string } = {}): void {
    H.state.graphs = [GRAPH];
    H.state.idlookup[GRAPH] = {
        className: 'DGraph', id: GRAPH, model: opts.model ?? MODEL,
        graphStyle: opts.style ?? 'v2-flow', subElements,
    };
}

let SUT: typeof import('../createAdapter');

beforeEach(async () => {
    vi.resetModules();
    H.createVertex = vi.fn(() => 'newVertex');
    H.createEdge = vi.fn(() => 'newEdge');
    H.state = { idlookup: {}, graphs: [] };
    // The parent, drawn at a known place so the cascade has something to read.
    H.state.idlookup.pv = { className: 'DVertex', id: 'pv', model: PARENT, x: 100, y: 50, w: 200 };
    setGraph(['pv']);
    // The owner proxy: a containment slot that "creates" and returns the child.
    H.proxies[PARENT] = {
        id: PARENT,
        $editions: { name: 'editions', __raw: { values: [] }, addObject: () => ({ id: CHILD }) },
        features: [],
    };
    SUT = await import('../createAdapter');
});

describe('VIEW1 — createInstance gives a contained child its canvas artifacts', () => {
    it('creates the vertex for THIS child on THIS graph, and the containment edge', () => {
        const r = SUT.createInstance(MODEL, 'Edition', PARENT, 'editions', {});
        expect(r.ok).toBe(true);
        expect(r.id).toBe(CHILD);

        // Identity, not existence: graph and object id are the first two arguments.
        expect(H.createVertex).toHaveBeenCalledTimes(1);
        expect(H.createVertex.mock.calls[0].slice(0, 2)).toEqual([GRAPH, CHILD]);
        // The edge names the parent, the child and the slot it was created under.
        expect(H.createEdge).toHaveBeenCalledTimes(1);
        expect(H.createEdge.mock.calls[0]).toEqual([GRAPH, PARENT, CHILD, 'editions']);
    });

    it('cascades to the right of the parent vertex, one row per sibling already drawn', () => {
        // One sibling that is already on the canvas → the new child goes one row down.
        H.state.idlookup.sv = { className: 'DVertex', id: 'sv', model: 'sib', x: 380, y: 50, w: 200 };
        setGraph(['pv', 'sv']);
        H.proxies[PARENT].$editions.__raw.values = ['sib'];

        SUT.createInstance(MODEL, 'Edition', PARENT, 'editions', {});
        const [, , x, y] = H.createVertex.mock.calls[0];
        expect([x, y]).toEqual([100 + 200 + 80, 50 + 80]);
    });

    it('is idempotent: a child that already has a vertex gets no second one', () => {
        H.state.idlookup.cv = { className: 'DVertex', id: 'cv', model: CHILD, x: 0, y: 0, w: 200 };
        setGraph(['pv', 'cv']);

        const r = SUT.createInstance(MODEL, 'Edition', PARENT, 'editions', {});
        expect(r.ok).toBe(true);
        expect(H.createVertex).not.toHaveBeenCalled();
        expect(H.createEdge).not.toHaveBeenCalled();
    });

    it('writes nothing when the model has no v2-flow graph, and still creates the instance', () => {
        // The limit case measured as real: a model whose tab was never opened has zero.
        setGraph(['pv'], { style: '' });

        const r = SUT.createInstance(MODEL, 'Edition', PARENT, 'editions', {});
        expect(r.ok).toBe(true);
        expect(r.id).toBe(CHILD);
        expect(H.createVertex).not.toHaveBeenCalled();
        expect(H.createEdge).not.toHaveBeenCalled();
    });

    it('leaves a ROOT create alone — useJjomSync Step 2 already draws model.objects', () => {
        H.proxies[MODEL] = { id: MODEL, addObject: () => ({ id: 'root1' }) };

        const r = SUT.createInstance(MODEL, 'Edition', null, null, {});
        expect(r).toEqual({ ok: true, id: 'root1' });
        expect(H.createVertex).not.toHaveBeenCalled();
        expect(H.createEdge).not.toHaveBeenCalled();
    });

    it('picks the graph of ITS OWN model, not the first v2-flow graph in the store', () => {
        H.state.idlookup.other = {
            className: 'DGraph', id: 'other', model: 'someOtherModel',
            graphStyle: 'v2-flow', subElements: [],
        };
        H.state.graphs = ['other', GRAPH];

        SUT.createInstance(MODEL, 'Edition', PARENT, 'editions', {});
        expect(H.createVertex.mock.calls[0][0]).toBe(GRAPH);
    });
});
