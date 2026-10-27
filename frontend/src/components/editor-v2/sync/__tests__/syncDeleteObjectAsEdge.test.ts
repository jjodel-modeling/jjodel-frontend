/**
 * An object rendered as an edge is deleted as the object it is (P-2026-10-04-0130).
 *
 * MEASURED (report `docs/discovery/discovery_2026-10-04_object_edge_delete.md` §2): on DemoESM with the statechart
 * notation active, the transitions are synthetic edges `irobj_<objectId>`; «Delete reference» and the Delete key reach
 * `syncDeleteEdge`, which resolves the synthetic id as a pointer, finds nothing and returns before writing: 4 edges and
 * 4 DObjects before and after, no undo delta.
 *
 * `resolveObjectAsEdge` is the gate of the edge's own menu and of the delete (EditorV2.tsx does not import under
 * vitest, so the decision lives in canvasToJjom.ts and runs here); `syncDeleteObjectAsEdge` takes the object's vertices
 * and their DEdges out of their graphs, then runs the DObject cascade (report §10: the cascade alone left them as
 * ghosts on a loaded project); an edge-object without a vertex (R-B14 form (b)) gets the cascade alone. Same fake-barrel idiom as `syncDeleteEdge.test.ts`: the joiner is mocked, the subject runs. That the edge does
 * not come back after a sync is measured by the lane probe (`scripts/probe/object-edge-delete.ts`), not here.
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
const graphEdges: Any[] = [];

/** A metaclass (DClass) with its name and singleton flag. */
function metaclass(id: string, name: string | undefined, singleton = false): void {
    H.state.idlookup[id] = { className: 'DClass', id, name };
    H.proxies[id] = { id, name, isSingleton: singleton };
}

/** A DObject of `meta`; with `vertex`, its DVertex in the graph. Its proxy's `delete` is a spy. */
function object(id: string, meta: string, vertex?: string): void {
    H.state.idlookup[id] = { className: 'DObject', id, instanceof: meta, features: [] };
    H.proxies[id] = {
        id, className: 'DObject', __raw: H.state.idlookup[id],
        get instanceof() { return H.proxies[meta]; },
        delete: () => H.log.push({ kind: 'delete', args: [id], depth: H.depth }),
    };
    if (vertex) {
        H.state.idlookup[vertex] = { className: 'DVertex', id: vertex, model: id, father: GRAPH };
        H.state.idlookup[GRAPH].subElements.push(vertex);
        H.proxies[vertex] = { id: vertex, get model() { return H.proxies[id]; }, get graph() { return H.proxies[GRAPH]; } };
    }
}

/** A DEdge of the graph between two vertices, optionally backed by `model`. */
function edge(id: string, start: string, end: string, model?: string): void {
    H.state.idlookup[id] = { className: 'DVoidEdge', id, start, end, model, father: GRAPH, graph: GRAPH };
    H.state.idlookup[GRAPH].subElements.push(id);
    H.proxies[id] = {
        id, __raw: H.state.idlookup[id], isExtend: false,
        get model() { return model ? H.proxies[model] ?? null : undefined; },
        get start() { return H.proxies[start]; },
        get end() { return H.proxies[end]; },
    };
    graphEdges.push(H.proxies[id]);
}

const writes = (kind: string) => H.log.filter(l => l.kind === kind);

let SUT: typeof import('../canvasToJjom');

beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    H.state = { idlookup: {} };
    H.proxies = {};
    H.log = [];
    H.depth = 0;
    H.transactions = 0;
    graphEdges.length = 0;
    H.state.idlookup[GRAPH] = { className: 'DGraph', id: GRAPH, subElements: [] };
    H.proxies[GRAPH] = { id: GRAPH, get edges() { return graphEdges.slice(); } };
    SUT = await import('../canvasToJjom');
});

/** DemoESM's shape: two states, a Transition with its hidden vertex and its two link DEdges, a reference between. */
function statechart(): void {
    metaclass('State', 'State');
    metaclass('Transition', 'Transition');
    H.state.idlookup.R = { className: 'DReference', id: 'R', name: 'nextState' };
    H.proxies.R = { id: 'R', delete: () => H.log.push({ kind: 'delete', args: ['R'], depth: H.depth }) };
    object('locked', 'State', 'vLocked');
    object('unlocked', 'State', 'vUnlocked');
    object('tc', 'Transition', 'vTc');
    edge('eSrc', 'vLocked', 'vTc', 'R');    // State -> Transition (outgoing)
    edge('eTgt', 'vTc', 'vUnlocked', 'R');  // Transition -> State (nextState)
    edge('eOther', 'vLocked', 'vUnlocked', 'R');
}

describe('resolveObjectAsEdge: the gate of the object-as-edge menu and delete', () => {
    beforeEach(statechart);

    it('answers the object and its metaclass name for the synthetic id of a live DObject', () => {
        expect(SUT.resolveObjectAsEdge('irobj_tc', H.state.idlookup)).toEqual({ objectId: 'tc', metaclassName: 'Transition' });
    });

    it('answers null once the object has left the lookup', () => {
        delete H.state.idlookup.tc;
        expect(SUT.resolveObjectAsEdge('irobj_tc', H.state.idlookup)).toBeNull();
    });

    it('answers null when the synthetic id names something other than a DObject', () => {
        expect(SUT.resolveObjectAsEdge('irobj_State', H.state.idlookup)).toBeNull();
    });

    it('answers null for an M1 link, an M2 reference and an inheritance edge', () => {
        H.state.idlookup.vA = { className: 'DVertex', id: 'vA', model: 'State' };
        H.state.idlookup.vB = { className: 'DVertex', id: 'vB', model: 'Transition' };
        edge('m2', 'vA', 'vB', 'R');
        H.state.idlookup.inh = { className: 'DEdge', id: 'inh', start: 'vA', end: 'vB' };
        expect(SUT.resolveObjectAsEdge('eTgt', H.state.idlookup)).toBeNull();
        expect(SUT.resolveObjectAsEdge('m2', H.state.idlookup)).toBeNull();
        expect(SUT.resolveObjectAsEdge('inh', H.state.idlookup)).toBeNull();
        expect(SUT.resolveObjectAsEdge('nope', H.state.idlookup)).toBeNull();
    });

    it('only the irobj_ prefix names an object-as-edge: six other characters before an object id do not', () => {
        expect(SUT.resolveObjectAsEdge('xxxxxxtc', H.state.idlookup)).toBeNull();
    });

    it('names the metaclass «object» when it has no name', () => {
        metaclass('Anon', undefined);
        object('x', 'Anon');
        expect(SUT.resolveObjectAsEdge('irobj_x', H.state.idlookup)).toEqual({ objectId: 'x', metaclassName: 'object' });
    });
});

describe('syncDeleteObjectAsEdge: the object with its vertex and that vertex\'s edges', () => {
    beforeEach(statechart);

    it('takes the vertex and its link DEdges out of the graph and deletes them, then the DObject', () => {
        SUT.syncDeleteObjectAsEdge('tc');
        expect(writes('DeleteElementAction').map(l => l.args[0].id).sort()).toEqual(['eSrc', 'eTgt', 'vTc']);
        expect(writes('SetFieldAction').map(l => l.args).sort()).toEqual([
            [GRAPH, 'subElements', 'eSrc', '-=', true],
            [GRAPH, 'subElements', 'eTgt', '-=', true],
            [GRAPH, 'subElements', 'vTc', '-=', true],
        ]);
        expect(writes('delete').map(l => l.args[0])).toEqual(['tc']);
    });

    it('strips in ONE TRANSACTION and runs the cascade last, outside it', () => {
        SUT.syncDeleteObjectAsEdge('tc');
        expect(H.transactions).toBe(1);
        expect(H.log.filter(l => l.kind !== 'delete').every(l => l.depth === 1)).toBe(true);
        expect(H.log[H.log.length - 1]).toEqual({ kind: 'delete', args: ['tc'], depth: 0 });
    });

    it('leaves every other edge, the states\' vertices and the reference alone', () => {
        SUT.syncDeleteObjectAsEdge('tc');
        const deleted = writes('DeleteElementAction').map(l => l.args[0].id);
        expect(deleted).not.toContain('eOther');
        expect(deleted).not.toContain('vLocked');
        expect(writes('delete').map(l => l.args[0])).not.toContain('R');
    });

    it('takes an id out of the graph that lists it only', () => {
        H.state.idlookup.eTgt.father = 'vTc';   // a father that does not list it, next to the graph that does
        SUT.syncDeleteObjectAsEdge('tc');
        expect(writes('SetFieldAction').filter(l => l.args[2] === 'eTgt').map(l => l.args[0])).toEqual([GRAPH]);
    });

    it('clears the pair guard of each removed link (rule 13)', async () => {
        const SYNC = await import('../syncState');
        SYNC.markCanvasEdgePair('vTc', 'vUnlocked');
        SYNC.markCanvasEdgePair('vLocked', 'vUnlocked');
        SUT.syncDeleteObjectAsEdge('tc');
        expect(SYNC.hasCanvasEdgePair('vTc→vUnlocked')).toBe(false);
        expect(SYNC.hasCanvasEdgePair('vLocked→vUnlocked')).toBe(true);
    });

    it('without a vertex (a nested edge-object), deletes the DObject alone', () => {
        object('nested', 'Transition');
        SUT.syncDeleteObjectAsEdge('nested');
        expect(writes('DeleteElementAction')).toEqual([]);
        expect(writes('delete').map(l => l.args[0])).toEqual(['nested']);
    });

    it('a singleton keeps its vertex and links: the cascade\'s guard refuses, nothing is stripped first', () => {
        metaclass('One', 'One', true);
        object('only', 'One', 'vOnly');
        edge('eOnly', 'vOnly', 'vLocked', 'R');
        SUT.syncDeleteObjectAsEdge('only');
        expect(writes('DeleteElementAction')).toEqual([]);
        expect(writes('SetFieldAction')).toEqual([]);
        expect(writes('delete').map(l => l.args[0])).toEqual(['only']);
    });

    it('an id that is not a live DObject writes nothing', () => {
        SUT.syncDeleteObjectAsEdge('ghost');
        SUT.syncDeleteObjectAsEdge('State');
        expect(H.log).toEqual([]);
    });

    it('a class with a vertex and a delete of its own is not deleted as an object-as-edge', () => {
        H.proxies.State.delete = () => H.log.push({ kind: 'delete', args: ['State'], depth: H.depth });
        H.state.idlookup.vState = { className: 'DVertex', id: 'vState', model: 'State', father: GRAPH };
        H.state.idlookup[GRAPH].subElements.push('vState');
        SUT.syncDeleteObjectAsEdge('State');
        expect(H.log).toEqual([]);
    });
});

describe('syncDeleteEdge is unchanged for a synthetic id', () => {
    it('still writes nothing: the object-as-edge never reaches the edge paths', () => {
        statechart();
        SUT.syncDeleteEdge('irobj_tc', false);
        vi.runAllTimers();
        expect(H.log).toEqual([]);
    });
});
