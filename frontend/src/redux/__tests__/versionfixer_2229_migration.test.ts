/**
 * The VersionFixer step `2.228 -> 2.229`: the primitive types `Expression` and `Action`
 * (R-SIM-17, R-SIM-44, R-SIM-46), P-2026-09-25-1445.
 *
 * SOURCE: `frontend/src/redux/VersionFixer.tsx`, the REAL class, with the joiner barrel mocked
 * exactly as in `versionfixer_old_states.test.ts` (copied, not imported: a `vi.mock` factory is
 * per file). The step uses literal ids, so the mocked `Defaults` needs nothing new.
 *
 * Each test names the mutant of report §7.2 (discovery_2026-09-25_state_operator_core_types.md)
 * that it kills.
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
const { statechartplus } = await import('../../examples/statechartplus');

type AnyRec = Record<string, any>;
const VF: any = VersionFixer;
const adapters: Record<number, { n: number; f: (s: AnyRec) => AnyRec }> = VF.versionAdapters;
const runStep = (from: number, s: AnyRec): AnyRec => adapters[from].f.call(new VF(), s);
const fresh = (blob: unknown): AnyRec => (typeof blob === 'string' ? JSON.parse(blob) : JSON.parse(JSON.stringify(blob)));

beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });

/**
 * THE ORACLE: `Pointer_EXPRESSION` as the store of a NEW project holds it, captured on 2026-09-25
 * from a project created through the UI on 3002 (this tree, A1 code before the step: version
 * 2.228, the two ids seeded by `redux/store.tsx` from `ShortAttribETypes`), read with
 * `JSON.parse(JSON.stringify(store.getState().idlookup['Pointer_EXPRESSION']))`. The seeded
 * `Pointer_ACTION` was the same record with its own id and name. No `clonedCounter` and no
 * timestamp field in the record; the state's `version.date` is the only timestamp and it is not
 * part of it.
 */
const SEED_EXPRESSION: AnyRec = {
    "className": "DClass",
    "id": "Pointer_EXPRESSION",
    "pointedBy": [
        {
            "source": "classs"
        },
        {
            "source": "primitiveTypes"
        },
        {
            "source": "classs"
        }
    ],
    "_state": {},
    "name": "Expression",
    "parent": [],
    "annotations": [],
    "abstract": false,
    "interface": false,
    "instances": [],
    "operations": [],
    "features": [],
    "references": [],
    "attributes": [],
    "referencedBy": [],
    "extends": [],
    "isPrimitive": true,
    "implements": [],
    "implementedBy": [],
    "partial": false,
    "partialdefaultname": "",
    "isSingleton": false,
    "sealed": [],
    "final": false,
    "allowCrossReference": false
};
const seedOf = (id: string, name: string): AnyRec => ({ ...JSON.parse(JSON.stringify(SEED_EXPRESSION)), id, name });
const withoutCloned = (r: AnyRec): AnyRec => { const { clonedCounter: _c, ...rest } = r; return rest; };

const PRIMS = ['Pointer_ECHAR', 'Pointer_ESTRING', 'Pointer_EDATE', 'Pointer_EBOOLEAN', 'Pointer_EBYTE',
    'Pointer_ESHORT', 'Pointer_EINT', 'Pointer_ELONG', 'Pointer_EFLOAT', 'Pointer_EDOUBLE'];

/** A primitive record with the saved shape of `examples/statechartplus.ts`. */
function primitive(id: string, name: string): AnyRec {
    return {
        className: 'DClass', clonedCounter: 3, id, name, isPrimitive: true,
        pointedBy: [{ source: 'classs' }, { source: 'primitiveTypes' }, { source: 'idlookup.a1.type' }],
        parent: [], annotations: [], abstract: false, interface: false, instances: [], operations: [],
        features: [], references: [], attributes: [], referencedBy: [], extends: [], extendedBy: [],
        implements: [], implementedBy: [], partial: false, partialdefaultname: '', sealed: [], final: false,
    };
}

/** A 2.228 state with the ten primitives, a user class and an attribute typed EDouble. */
function state228(): AnyRec {
    const idlookup: AnyRec = {};
    for (const id of PRIMS) idlookup[id] = primitive(id, id.slice('Pointer_E'.length).toLowerCase());
    idlookup.Pointer_EDOUBLE.name = 'EDouble';
    idlookup.c1 = { id: 'c1', className: 'DClass', name: 'Expression', isPrimitive: false };
    idlookup.a1 = { id: 'a1', className: 'DAttribute', name: 'x', type: 'Pointer_EDOUBLE' };
    return {
        idlookup, primitiveTypes: [...PRIMS], classs: [...PRIMS, 'c1'], attributes: ['a1'],
        version: { n: 2.228, date: '', conversionList: [] },
    };
}

describe("VersionFixer '2.228 -> 2.229' — the Expression and Action primitives", () => {
    it('is the step after 2.228, and 2.229 is the highest version', () => {
        expect(adapters[2.228]?.n).toBe(2.229);
        expect(VersionFixer.get_highestversion()).toBe(2.229);
    });

    it('the migrated records are the seeded ones, field by field (modulo clonedCounter)', () => {
        const out = runStep(2.228, state228());
        expect(withoutCloned(out.idlookup.Pointer_EXPRESSION)).toStrictEqual(seedOf('Pointer_EXPRESSION', 'Expression'));
        expect(withoutCloned(out.idlookup.Pointer_ACTION)).toStrictEqual(seedOf('Pointer_ACTION', 'Action'));
    });

    it('M2: the records are primitive (autocorrect keeps a fatherless DClass only then)', () => {
        const out = runStep(2.228, state228());
        expect(out.idlookup.Pointer_EXPRESSION.isPrimitive).toBe(true);
        expect(out.idlookup.Pointer_ACTION.isPrimitive).toBe(true);
    });

    it('nothing is taken from EDouble: not its pointedBy, not its fields; EDouble is left as it was', () => {
        const s = state228();
        const before = JSON.parse(JSON.stringify(s.idlookup.Pointer_EDOUBLE));
        const out = runStep(2.228, s);
        expect(out.idlookup.Pointer_EXPRESSION.pointedBy).not.toContainEqual({ source: 'idlookup.a1.type' });
        expect(out.idlookup.Pointer_EXPRESSION).not.toHaveProperty('clonedCounter');
        expect(out.idlookup.Pointer_EDOUBLE).toEqual(before);
    });

    it.each(['first', 'second', 'sequence', 'statechartplus', 'statechartplus_old', 'shapes', 'conflictsimulation'])(
        'a real save taken to 2.228 (%s.ts) gets the seeded records through the step', async (name) => {
            const mod: AnyRec = await import(`../../examples/${name}.ts`);
            let s = fresh(mod.default ?? mod[Object.keys(mod)[0]]);
            s.version = { n: 2.1, date: 'x', conversionList: [] };
            for (let v = 2.1; v !== 2.228; v = s.version.n = adapters[v].n) s = runStep(v, s);
            expect(s.idlookup.Pointer_EXPRESSION).toBeUndefined();
            const out = runStep(2.228, s);
            expect(withoutCloned(out.idlookup.Pointer_EXPRESSION)).toStrictEqual(seedOf('Pointer_EXPRESSION', 'Expression'));
            expect(withoutCloned(out.idlookup.Pointer_ACTION)).toStrictEqual(seedOf('Pointer_ACTION', 'Action'));
        });

    it('M12: the ids go after EDouble, in enum order, and index 1 stays EString', () => {
        const out = runStep(2.228, state228());
        expect(out.primitiveTypes).toEqual([...PRIMS, 'Pointer_EXPRESSION', 'Pointer_ACTION']);
        expect(out.primitiveTypes[1]).toBe('Pointer_ESTRING');
        expect(out.classs).toEqual([...PRIMS, 'c1', 'Pointer_EXPRESSION', 'Pointer_ACTION']);
    });

    it('M1: a second pass changes nothing', () => {
        const once = runStep(2.228, state228());
        const snapshot = JSON.parse(JSON.stringify(once));
        const twice = runStep(2.228, once);
        expect(twice).toEqual(snapshot);
    });

    it('a user class named Expression is not taken for the primitive', () => {
        const out = runStep(2.228, state228());
        expect(out.idlookup.c1).toEqual({ id: 'c1', className: 'DClass', name: 'Expression', isPrimitive: false });
        expect(out.idlookup.Pointer_EXPRESSION.id).toBe('Pointer_EXPRESSION');
    });

    it('M3: a state with no primitives survives and is left as it is', () => {
        expect(() => runStep(2.228, { idlookup: {} })).not.toThrow();
        expect(runStep(2.228, { idlookup: {} })).toEqual({ idlookup: {} });
        const noPrims = { idlookup: { c1: { id: 'c1', className: 'DClass' } }, classs: ['c1'], primitiveTypes: [] };
        expect(runStep(2.228, JSON.parse(JSON.stringify(noPrims)))).toEqual(noPrims);
    });

    it('a saved list with duplicates gets each id once, at the end', () => {
        const s = state228();
        s.primitiveTypes = [...PRIMS, ...PRIMS];
        const out = runStep(2.228, s);
        expect(out.primitiveTypes.filter((x: string) => x === 'Pointer_EXPRESSION')).toHaveLength(1);
        expect(out.primitiveTypes.slice(-2)).toEqual(['Pointer_EXPRESSION', 'Pointer_ACTION']);
    });

    it.each([['first.ts', first], ['statechartplus.ts', statechartplus]])(
        '%s: the whole chain ends with the two primitives listed after EDouble', (_name, blob) => {
            const out = VersionFixer.update(fresh(blob) as any) as AnyRec;
            expect(out.version.n).toBe(2.229);
            expect(out.idlookup.Pointer_EXPRESSION?.isPrimitive).toBe(true);
            expect(out.idlookup.Pointer_ACTION?.isPrimitive).toBe(true);
            const list: string[] = out.primitiveTypes;
            expect(list.indexOf('Pointer_EXPRESSION')).toBeGreaterThan(list.lastIndexOf('Pointer_EDOUBLE'));
            expect(list.indexOf('Pointer_ACTION')).toBe(list.indexOf('Pointer_EXPRESSION') + 1);
            expect(list[1]).toBe('Pointer_ESTRING');
        });
});
