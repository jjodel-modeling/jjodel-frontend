/**
 * The load purge of `VersionFixer` (R-NEST-8, #174): at every load, after the version steps, the graph
 * elements that represent nothing are removed. P-2026-10-07-0950, Layer Impact Report
 * docs/lir/lir_2026-10-10_174_load_purge.md.
 *
 * SOURCE: `frontend/src/redux/VersionFixer.tsx`, the REAL class, with the joiner barrel mocked exactly as
 * in `versionfixer_2230_migration.test.ts` (copied, not imported: a `vi.mock` factory is per file).
 *
 * Each test names the mutant of the purge that it kills.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('../../joiner', () => {
    const DGraphElement = { cname: 'DGraphElement' };
    const GRAPH_ELEMENTS = new Set(['DGraphElement', 'DGraph', 'DGraphVertex', 'DVertex', 'DVoidVertex',
        'DEdgePoint', 'DVoidEdge', 'DEdge', 'DExtEdge', 'DRefEdge']);
    const viewpoints = ['Pointer_ViewPointDefault'];
    return {
        RuntimeAccessible: () => (ctor: any) => ctor,
        Log: {
            exDev: (b: boolean, ...rest: any[]) => { if (b) throw new Error('[Dev Error] ' + String(rest[0])); return null; },
            eDevv: () => '', ii: () => '', ww: () => '', ll: () => '',
        },
        U: {
            getHashParam: () => null,
            getProjectID_URL: () => 'Pointer_TestProject',
            replaceAll: (str: string, searchText: string, replacement?: string) =>
                (!str ? str : str.split(searchText).join(replacement || '')),
            hexToPalette: (...hexs: string[]) => ({ type: 'color', value: hexs.map(() => ({ r: 0, g: 0, b: 0, a: 1 })) }),
        },
        DV: { defaultLanguages: () => ({ _selected: 'JSON' }) },
        RuntimeAccessibleClass: { extends: (cn: string, sup: any) => sup === DGraphElement && GRAPH_ELEMENTS.has(cn) },
        DGraphElement,
        Pointers: { ESTRING: 'Pointer_ESTRING' },
        EdgeBendingMode: { Line: 'L', Manhattan: 'Manhattan', Bezier_QT: 'QT' },
        EdgeHead: {
            Head_reference: 'M11.354 5.646a.5.5 90 010 .708l-6.035 6.089a.5.5 90 01-.156-.116L11.375 5.999l-6.406-6.211a.5.5 90 01.208-.115z',
            Tail_composition: 'M8.5776-.9085c.6316-.522 1.6553-.522 2.2869 0l7.0948 5.8644c.6316.522.6316 1.3671 0 1.8882L10.8645 12.7085c-.6316.522-1.6542.522-2.2847 0L1.4827 6.845a1.6117 1.332 0 010-1.8882z',
        },
        Defaults: { viewpoints, isSystemViewpoint: (id: any) => viewpoints.includes(id as string) },
        LViewElement: { updateDefaultView: () => undefined },
    };
});
vi.mock('../../components/forEndUser/Tooltip', () => ({ Tooltip: { show: () => undefined } }));

const { VersionFixer } = await import('../VersionFixer');
const { default: first } = await import('../../examples/first');
const { statechartplus } = await import('../../examples/statechartplus');

type AnyRec = Record<string, any>;
const VF: any = VersionFixer;
const adapters: Record<number, { n: number; f: (s: AnyRec) => AnyRec }> = VF.versionAdapters;
const purge = (s: AnyRec): AnyRec => VF.purgeDeadGraphElements(s);
const clone = (s: AnyRec): AnyRec => JSON.parse(JSON.stringify(s));
const fresh = (blob: unknown): AnyRec => (typeof blob === 'string' ? JSON.parse(blob) : JSON.parse(JSON.stringify(blob)));
const deepFreeze = (o: any): any => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const pb = (...sources: string[]) => sources.map((source) => ({ source }));

let logSpy: ReturnType<typeof vi.spyOn>;
beforeAll(() => { logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined); });
beforeEach(() => { logSpy.mockClear(); });

/**
 * A graph `g` of model `m`, with every case of the rule:
 *
 *   KEPT     v1, v2      DVertex over the live o1, o2          e1   DEdge v1 -> v2, its point ep1 (midnodes)
 *            f1          a field of v1 (DGraphElement)         vNo  DVertex with no model at all
 *            vVoid       DVoidVertex, no model                 gv   DGraphVertex listing vIn (a nested DVertex)
 *            vVoidUn     DVoidVertex nobody lists (declared: not a starting point, left)
 *            fShared     listed by the ghost AND by v1
 *   REMOVED  vGhost      DVertex whose model 'gone' does not resolve, and its field fG
 *            eToGhost    DEdge v1 -> vGhost (an end is a removed record), and its point epG
 *            eNowhere    DEdge v1 -> 'nowhere' (an end does not resolve)
 *            vUn, eUn    a DVertex and a DEdge that no container lists (what R-NEST-7 detaches)
 */
function fixture(): AnyRec {
    const idlookup: AnyRec = {
        m: { id: 'm', className: 'DModel', objects: ['o1', 'o2'], pointedBy: [] },
        o1: { id: 'o1', className: 'DObject', father: 'm', pointedBy: pb('idlookup.m.objects', 'idlookup.v1.model', 'idlookup.vUn.model') },
        o2: { id: 'o2', className: 'DObject', father: 'm', pointedBy: pb('idlookup.m.objects', 'idlookup.v2.model', 'idlookup.vIn.model') },
        r: { id: 'r', className: 'DReference', pointedBy: pb('idlookup.e1.model', 'idlookup.eToGhost.model', 'idlookup.eNowhere.model', 'idlookup.eUn.model') },
        g: { id: 'g', className: 'DGraph', model: 'm', subElements: ['v1', 'v2', 'vGhost', 'e1', 'eToGhost', 'eNowhere', 'vNo', 'vVoid', 'gv'], pointedBy: pb('idlookup.v1.father', 'idlookup.vGhost.father', 'idlookup.vUn.father') },
        v1: { id: 'v1', className: 'DVertex', model: 'o1', father: 'g', graph: 'g', subElements: ['f1', 'fShared'], edgesIn: [], edgesOut: ['e1', 'eToGhost', 'eNowhere', 'eUn'],
            pointedBy: pb('vertexs', 'idlookup.g.subElements', 'idlookup.e1.start', 'idlookup.eToGhost.start', 'idlookup.eNowhere.start', 'idlookup.eUn.start') },
        f1: { id: 'f1', className: 'DGraphElement', model: 'o1', father: 'v1', graph: 'g', subElements: [], pointedBy: [] },
        fShared: { id: 'fShared', className: 'DGraphElement', father: 'v1', graph: 'g', subElements: [], pointedBy: [] },
        v2: { id: 'v2', className: 'DVertex', model: 'o2', father: 'g', graph: 'g', subElements: [], edgesIn: ['e1', 'eUn'], edgesOut: [], pointedBy: pb('idlookup.e1.end', 'idlookup.eUn.end') },
        vGhost: { id: 'vGhost', className: 'DVertex', model: 'gone', father: 'g', graph: 'g', subElements: ['fG', 'fShared'], edgesIn: ['eToGhost'], edgesOut: [], pointedBy: pb('idlookup.eToGhost.end') },
        fG: { id: 'fG', className: 'DGraphElement', model: 'gone2', father: 'vGhost', graph: 'g', subElements: [], pointedBy: [] },
        e1: { id: 'e1', className: 'DEdge', model: 'r', father: 'g', graph: 'g', start: 'v1', end: 'v2', subElements: [], midnodes: ['ep1'], pointedBy: [] },
        ep1: { id: 'ep1', className: 'DEdgePoint', father: 'e1', graph: 'g', subElements: [], pointedBy: [] },
        eToGhost: { id: 'eToGhost', className: 'DEdge', model: 'r', father: 'g', graph: 'g', start: 'v1', end: 'vGhost', subElements: [], midnodes: ['epG'], pointedBy: [] },
        epG: { id: 'epG', className: 'DEdgePoint', father: 'eToGhost', graph: 'g', subElements: [], pointedBy: [] },
        eNowhere: { id: 'eNowhere', className: 'DVoidEdge', model: 'r', father: 'g', graph: 'g', start: 'v1', end: 'nowhere', subElements: [], midnodes: [], pointedBy: [] },
        vUn: { id: 'vUn', className: 'DVertex', model: 'o1', father: 'g', graph: 'g', subElements: [], edgesIn: [], edgesOut: [], pointedBy: [] },
        eUn: { id: 'eUn', className: 'DEdge', model: 'r', father: 'g', graph: 'g', start: 'v1', end: 'v2', subElements: [], midnodes: [], pointedBy: [] },
        vNo: { id: 'vNo', className: 'DVertex', father: 'g', graph: 'g', subElements: [], edgesIn: [], edgesOut: [], pointedBy: [] },
        vVoid: { id: 'vVoid', className: 'DVoidVertex', father: 'g', graph: 'g', subElements: [], pointedBy: [] },
        vVoidUn: { id: 'vVoidUn', className: 'DVoidVertex', father: 'g', graph: 'g', subElements: [], pointedBy: [] },
        gv: { id: 'gv', className: 'DGraphVertex', model: 'm', father: 'g', graph: 'g', subElements: ['vIn'], pointedBy: [] },
        vIn: { id: 'vIn', className: 'DVertex', model: 'o2', father: 'gv', graph: 'g', subElements: [], edgesIn: [], edgesOut: [], pointedBy: [] },
    };
    return {
        idlookup, version: { n: 2.23, date: 'test', conversionList: [] },
        vertexs: ['v1', 'v2', 'vGhost', 'vUn', 'vNo', 'vIn'], edges: ['e1', 'eToGhost', 'eNowhere', 'eUn', 'longDead'], edgepoints: ['ep1', 'epG'],
        graphelements: ['f1', 'fShared', 'fG'], voidvertexs: ['vVoid', 'vVoidUn'], graphvertexs: ['gv'], graphs: ['g'],
    };
}
const REMOVED = ['vGhost', 'fG', 'eToGhost', 'epG', 'eNowhere', 'vUn', 'eUn'];
const KEPT = ['m', 'o1', 'o2', 'r', 'g', 'v1', 'f1', 'fShared', 'v2', 'e1', 'ep1', 'vNo', 'vVoid', 'vVoidUn', 'gv', 'vIn'];

describe('VersionFixer load purge — graph elements that represent nothing (R-NEST-8)', () => {
    it('removes exactly the seven records of the fixture and keeps the sixteen others', () => {
        const out = purge(fixture());
        expect(Object.keys(out.idlookup).sort()).toEqual([...KEPT].sort());
        for (const id of REMOVED) expect(out.idlookup[id], id).toBeUndefined();
    });

    it('a ghost vertex is removed, from the store and from its graph (kills: the ghost rule dropped)', () => {
        const s = fixture();
        // isolate the rule: only the ghost, listed, with nothing else wrong
        for (const id of ['eToGhost', 'epG', 'eNowhere', 'vUn', 'eUn']) delete s.idlookup[id];
        s.idlookup.g.subElements = ['v1', 'v2', 'vGhost', 'e1', 'vNo', 'vVoid', 'gv'];
        const out = purge(s);
        expect(out.idlookup.vGhost).toBeUndefined();
        expect(out.idlookup.g.subElements).toEqual(['v1', 'v2', 'e1', 'vNo', 'vVoid', 'gv']);
    });

    it('a vertex with no model is not a ghost: undefined, null and the empty string (kills: «no model» read as dead)', () => {
        const s = fixture();
        s.idlookup.vNull = { ...s.idlookup.vNo, id: 'vNull', model: null };
        s.idlookup.vEmpty = { ...s.idlookup.vNo, id: 'vEmpty', model: '' };
        s.idlookup.g.subElements.push('vNull', 'vEmpty');
        const out = purge(s);
        for (const id of ['vNo', 'vNull', 'vEmpty']) expect(out.idlookup[id], id).toBeDefined();
    });

    it('an edge whose end does not resolve is removed (kills: the dead-end rule dropped)', () => {
        const s = fixture();
        for (const id of ['vGhost', 'fG', 'eToGhost', 'epG', 'vUn', 'eUn']) delete s.idlookup[id];
        s.idlookup.g.subElements = ['v1', 'v2', 'e1', 'eNowhere', 'vNo', 'vVoid', 'gv'];
        const out = purge(s);
        expect(out.idlookup.eNowhere).toBeUndefined();
        expect(out.idlookup.e1).toBeDefined();
    });

    it('an edge that ends on a removed vertex is removed with it (kills: ends checked against the store only)', () => {
        const out = purge(fixture());
        expect(out.idlookup.eToGhost).toBeUndefined();
    });

    it('a vertex and an edge that no container lists are removed (kills: the unlisted rule dropped)', () => {
        const s = fixture();
        for (const id of ['vGhost', 'fG', 'eToGhost', 'epG', 'eNowhere']) delete s.idlookup[id];
        s.idlookup.g.subElements = ['v1', 'v2', 'e1', 'vNo', 'vVoid', 'gv'];
        s.idlookup.v1.subElements = ['f1', 'fShared'];
        const out = purge(s);
        expect(out.idlookup.vUn).toBeUndefined();
        expect(out.idlookup.eUn).toBeUndefined();
    });

    it('a nested vertex listed by its own container is kept (kills: only a DGraph counts as a container)', () => {
        const out = purge(fixture());
        expect(out.idlookup.vIn).toBeDefined();
        expect(out.idlookup.gv.subElements).toEqual(['vIn']);
    });

    it('what only a removed record lists goes with it, through subElements and through midnodes (kills: no descendants; kills: midnodes ignored)', () => {
        const out = purge(fixture());
        expect(out.idlookup.fG).toBeUndefined();     // subElements of the ghost
        expect(out.idlookup.epG).toBeUndefined();    // midnodes of the removed edge
    });

    it('a record a kept container also lists stays (kills: descendants removed without asking who else lists them)', () => {
        const out = purge(fixture());
        expect(out.idlookup.fShared).toBeDefined();
        expect(out.idlookup.ep1).toBeDefined();
    });

    it('the classes left out as a starting point are left, listed or not: DGraph, DVoidVertex (kills: unlisted rule on every class)', () => {
        const out = purge(fixture());
        expect(out.idlookup.g).toBeDefined();
        expect(out.idlookup.vVoidUn).toBeDefined();
    });

    it('pointedBy of the kept records loses the entries that name a removed record, and only those (kills: pointedBy not cleaned)', () => {
        const out = purge(fixture());
        const sources = (id: string) => out.idlookup[id].pointedBy.map((p: AnyRec) => p.source);
        expect(sources('o1')).toEqual(['idlookup.m.objects', 'idlookup.v1.model']);
        expect(sources('r')).toEqual(['idlookup.e1.model']);
        expect(sources('v1')).toEqual(['vertexs', 'idlookup.g.subElements', 'idlookup.e1.start']);
        expect(sources('v2')).toEqual(['idlookup.e1.end']);
        expect(sources('g')).toEqual(['idlookup.v1.father']);
    });

    it('edgesIn, edgesOut, subElements and midnodes of the kept records lose the removed ids (kills: lists not cleaned)', () => {
        const out = purge(fixture());
        expect(out.idlookup.v1.edgesOut).toEqual(['e1']);
        expect(out.idlookup.v2.edgesIn).toEqual(['e1']);
        expect(out.idlookup.g.subElements).toEqual(['v1', 'v2', 'e1', 'vNo', 'vVoid', 'gv']);
        expect(out.idlookup.e1.midnodes).toEqual(['ep1']);
    });

    it('the root graph lists lose the removed ids and nothing else (kills: root lists not cleaned)', () => {
        const out = purge(fixture());
        expect(out.vertexs).toEqual(['v1', 'v2', 'vNo', 'vIn']);
        expect(out.edges).toEqual(['e1', 'longDead']);   // an id dead before the purge is not its business
        expect(out.edgepoints).toEqual(['ep1']);
        expect(out.graphelements).toEqual(['f1', 'fShared']);
        expect(out.voidvertexs).toEqual(['vVoid', 'vVoidUn']);
        expect(out.graphs).toEqual(['g']);
    });

    it('is idempotent: a second run changes nothing', () => {
        const once = purge(fixture());
        const twice = purge(clone(once));
        expect(twice).toEqual(once);
    });

    it('writes nothing on a coherent state: the same object back, deep-frozen, and no log (kills: the early return dropped)', () => {
        const coherent = deepFreeze(clone(purge(fixture())));
        logSpy.mockClear();
        let out: AnyRec | undefined;
        expect(() => { out = purge(coherent); }).not.toThrow();
        expect(out).toBe(coherent);
        expect(logSpy).not.toHaveBeenCalled();
    });

    it('does not touch `version`, and logs the counts once when it removes', () => {
        const out = purge(fixture());
        expect(out.version).toEqual({ n: 2.23, date: 'test', conversionList: [] });
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(String(logSpy.mock.calls[0][0])).toContain('7');
    });

    it('returns a state without idlookup as it is', () => {
        const s: AnyRec = { version: { n: 2.23 } };
        expect(purge(s)).toBe(s);
    });

    it('update() runs the purge at a load, on a state already at the highest version (kills: the call dropped from update)', () => {
        const s = fixture();
        s.version.n = VersionFixer.get_highestversion();
        const out = VersionFixer.update(s as any) as AnyRec;
        expect(out.idlookup.vGhost).toBeUndefined();
        expect(out.version.n).toBe(VersionFixer.get_highestversion());
    });
});

// The two real saved states the version tests use, through the whole chain of steps, then the purge.
describe('VersionFixer load purge — the real saved states', () => {
    const chain = (blob: unknown): AnyRec => {
        let s = fresh(blob);
        if (!s.version) s.version = { n: 2.1, date: '_reconverted', conversionList: [0] };
        for (let v = s.version.n || 0; v !== VersionFixer.get_highestversion(); v = s.version.n = adapters[v].n) s = adapters[v].f.call(new VF(), s);
        return s;
    };
    const removedBy = (blob: unknown) => {
        const before = chain(blob);
        const snapshot = clone(before);
        const after = purge(before);
        return Object.keys(snapshot.idlookup).filter((k) => !after.idlookup[k]).map((k) => `${snapshot.idlookup[k].className}:${snapshot.idlookup[k].model && !snapshot.idlookup[snapshot.idlookup[k].model] ? 'dead-model' : 'x'}`).sort();
    };

    it('first.ts: nothing is removed', () => {
        expect(removedBy(first)).toEqual([]);
    });

    // Measured 2026-10-10 on the state after the whole chain (350 records): a DVertex whose model is gone,
    // listed by the DGraphVertex of package pkg_1 (a ghost saved on the classic canvas), and the one
    // DGraphElement that only it lists.
    it('statechartplus.ts: the one saved ghost and what only it lists are removed, nothing else', () => {
        expect(removedBy(statechartplus)).toEqual(['DGraphElement:dead-model', 'DVertex:dead-model']);
    });

    it('statechartplus.ts: a dead-model field under a LIVE vertex is left (declared: DGraphElement is not a starting point)', () => {
        const after = purge(chain(statechartplus));
        const L = after.idlookup;
        const left = Object.values(L).filter((e: any) => e?.className === 'DGraphElement' && typeof e.model === 'string' && e.model && !L[e.model]) as AnyRec[];
        expect(left).toHaveLength(1);
        expect(L[L[left[0].father].model]?.name).toBe('StateChart');
    });
});
