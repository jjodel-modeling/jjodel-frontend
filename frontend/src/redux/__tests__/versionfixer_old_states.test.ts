/**
 * Old saved states through the VersionFixer chain (P-2026-09-24-1610).
 *
 * SOURCE: `frontend/src/redux/VersionFixer.tsx`, the REAL class, not a copy. R-IRN-20 mirrors a
 * step body because the file drags the joiner in; here the joiner barrel is mocked instead, the
 * pattern of `jjscript/executor/__tests__/m2CreateGuard.test.ts`, so the driver and all the steps
 * run as written. The mock stands in only for what the chain reads at runtime:
 *  - `Log.exDev` THROWS when its condition holds, like the real one (`Log.ts:152` passes
 *    `canthrow = true`); the other loggers are silent.
 *  - `U.getHashParam` returns null (no `?repair=1`), `U.getProjectID_URL` a fixed id, `U.replaceAll`
 *    is the real body (`U.tsx:874-876`), `U.hexToPalette` a same-shape stand-in.
 *  - `RuntimeAccessibleClass.extends(cn, DGraphElement)` answers from the class list of
 *    `joiner/classes.ts` (DGraph, DGraphVertex, DVertex, DVoidVertex, DEdgePoint, DVoidEdge, DEdge,
 *    DExtEdge, DRefEdge).
 *  - `DV.defaultLanguages` returns an empty language table, `LViewElement.updateDefaultView` (the
 *    tail loop, `VersionFixer.tsx:149`) is a no-op: what these tests assert is that the chain
 *    terminates on a defined state, not what the default views become.
 *  - Enum and constant values are copied from `joiner/types.ts:125`, `common/DV.tsx:1122` and
 *    `joiner/classes.ts:1640`; `Defaults.isSystemViewpoint` is the real body (`Defaults.ts:105`).
 * The examples are the seven distinct blobs of `frontend/src/examples/` (the four under
 * `examples/examples/` are duplicates, md5 in the Phase 1 report).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

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
const { default: second } = await import('../../examples/second');
const { sequence } = await import('../../examples/sequence');
const { statechartplus } = await import('../../examples/statechartplus');
const { statechartplus: statechartplusOld } = await import('../../examples/statechartplus_old');
const { shapes } = await import('../../examples/shapes');
const { conflictsimulation } = await import('../../examples/conflictsimulation');

type AnyRec = Record<string, any>;
const VF: any = VersionFixer;
const adapters: Record<number, { n: number; f: (s: AnyRec) => AnyRec }> = VF.versionAdapters;
const runStep = (from: number, s: AnyRec): AnyRec => adapters[from].f.call(new VF(), s);
const fresh = (blob: unknown): AnyRec => (typeof blob === 'string' ? JSON.parse(blob) : JSON.parse(JSON.stringify(blob)));

beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });

/** A 2.2 state where every root collection of `'2.2 -> 2.201'` exists and every pointer resolves. */
function wellFormed22(): AnyRec {
    return {
        idlookup: {
            c1: { id: 'c1', className: 'DClass', isSingleton: undefined },
            v1: { id: 'v1', className: 'DViewElement', viewpoint: 'vp1' },
            vp1: { id: 'vp1', className: 'DViewPoint' },
            p1: { id: 'p1', className: 'DProject' },
            r1: { id: 'r1', className: 'DReference', containment: true },
            m1: { id: 'm1', className: 'DModel' },
            a1: { id: 'a1', className: 'DAttribute', derived: 1,
                pointedBy: [{ source: 'idlookup.c1.attributes+=[]' }], zoom: { x: 40, y: 40 } },
        },
        classs: ['c1'], viewelements: ['v1'], viewpoints: ['vp1'], projects: ['p1'],
        references: ['r1'], models: ['m1'], attributes: ['a1'],
    };
}

/** Per root collection of `'2.2 -> 2.201'`: the effect its loop leaves on the resolvable element. */
const LOOP_EFFECT: Record<string, (s: AnyRec) => void> = {
    classs: s => expect(s.idlookup.c1.sealed).toEqual([]),
    viewelements: s => expect(s.idlookup.v1.father).toBe('vp1'),
    viewpoints: s => expect(s.idlookup.vp1.cssIsGlobal).toBe(true),
    projects: s => expect(s.idlookup.p1.description).toBe(''),
    references: s => expect(s.idlookup.r1.composition).toBe(true),
    models: s => expect(s.idlookup.m1.dependencies).toEqual([]),
    attributes: s => expect(s.idlookup.a1.derived).toBe(true),
};

describe('VersionFixer chain on the seven distinct examples', () => {
    const EXAMPLES: [string, unknown][] = [
        ['first.ts', first], ['second.ts', second], ['sequence.ts', sequence],
        ['statechartplus.ts', statechartplus], ['statechartplus_old.ts', statechartplusOld],
        ['shapes.ts', shapes], ['conflictsimulation.ts', conflictsimulation],
    ];
    it.each(EXAMPLES)('%s: update() terminates on a defined state at the highest version', (_name, blob) => {
        const s = fresh(blob);
        expect(s.version).toBeUndefined();
        const out = VersionFixer.update(s as any);
        expect(out).toBeDefined();
        expect(out.version.n).toBe(VersionFixer.get_highestversion());
        expect(out.version.conversionList).toEqual(expect.arrayContaining([2.1, 2.2, 2.201]));
    });
});

describe('entry into the chain', () => {
    it('a state with no version enters at 2.1 and reaches the highest version', () => {
        const out = VersionFixer.update({ idlookup: {} } as any);
        expect(out).toBeDefined();
        expect(out.version.n).toBe(VersionFixer.get_highestversion());
        expect(out.version.conversionList.slice(0, 4)).toEqual([0, 2.1, 2.2, 2.201]);
    });
    it('a version with a falsy n enters at 0 -> 2.1 and reaches the highest version', () => {
        const out = VersionFixer.update({ idlookup: {}, version: { n: 0, date: 'x', conversionList: [] } } as any);
        expect(out.version.date).toBe('_reconverted');
        expect(out.version.n).toBe(VersionFixer.get_highestversion());
    });
    it("'2.1 -> 2.2' hands back the state it was given", () => {
        const s = wellFormed22();
        expect(runStep(2.1, s)).toBe(s);
    });
});

describe("'2.2 -> 2.201' on old shapes", () => {
    it.each(Object.keys(LOOP_EFFECT))('absent %s is read as empty and the other loops still run', (key) => {
        const s = wellFormed22();
        delete s[key];
        const out = runStep(2.2, s);
        for (const [k, effect] of Object.entries(LOOP_EFFECT)) if (k !== key) effect(out);
    });
    it.each(Object.keys(LOOP_EFFECT))('an unresolved pointer in %s is skipped, the resolvable one after it is migrated', (key) => {
        const s = wellFormed22();
        s[key] = ['Pointer_Ghost', ...s[key]];
        const out = runStep(2.2, s);
        LOOP_EFFECT[key](out);
    });
    it('on a well-formed state the output is exactly the migration of every element', () => {
        const out = runStep(2.2, wellFormed22());
        expect(out.idlookup).toStrictEqual({
            c1: { id: 'c1', className: 'DClass', isSingleton: false, sealed: [], final: false, rootable: undefined, isCrossReference: false },
            v1: { id: 'v1', className: 'DViewElement', viewpoint: 'vp1', father: 'vp1', isCrossReference: false },
            vp1: { id: 'vp1', className: 'DViewPoint', cssIsGlobal: true, isCrossReference: false },
            p1: { id: 'p1', className: 'DProject', favorite: {}, description: '', isCrossReference: false },
            r1: { id: 'r1', className: 'DReference', containment: true, composition: true, aggregation: false, isCrossReference: false },
            m1: { id: 'm1', className: 'DModel', dependencies: [], isCrossReference: false },
            a1: { id: 'a1', className: 'DAttribute', derived: true, derived_write: undefined, derived_read: undefined,
                pointedBy: [{ source: 'idlookup.c1.attributes' }], zoom: { x: 1, y: 1 }, isCrossReference: false },
        });
    });
});
