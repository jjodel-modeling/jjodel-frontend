/**
 * A project saved by 3.0.0 through the VersionFixer chain (P-2026-10-12-0116, release 3.1 L5).
 *
 * FIXTURE: `fixtures/save_3_0_0.jjodel`, exported on 2026-10-12 by a 3.0.0 build (`git archive 3.0.0`, cb699ad58)
 * with the File menu's «Download Project»: project Fixture300; metamodel_1 with Person (one attribute per primitive
 * of 3.0.0, EChar to EDouble, and the reference `home`) and Address (`street`); model_1 with `alice : Person` and
 * `home1 : Address`, `alice.home = home1`; default views untouched. Format 2.228. The file is the raw project with
 * its store in `state`, compressed by `async-lz-string` (`U.compressedState`), read back here as the open reads it
 * (`U.decompressState` in redux/reducer). How it was built: docs/discovery/discovery_2026-10-12_rel31_fixture.md.
 *
 * SOURCE: `frontend/src/redux/VersionFixer.tsx`, the REAL class, with the joiner barrel mocked as in
 * `versionfixer_old_states.test.ts` (copied, not imported: a `vi.mock` factory is per file). One difference:
 * `LViewElement.updateDefaultView`, the tail loop of `update()`, records the ids it is handed instead of dropping them.
 *
 * A 3.0.0 save holds no DViewElement: a project born on 2.226 or later has its default views built in, not stored
 * (measured on this fixture and on the six 2.229 saves of scripts/probe/fixtures). So «the migrated default view is
 * kept» (rule 14) reads here as: the chain stores no view, rewrites no jsxString, and hands the tail the default
 * viewpoint alone; `isMigratedDefaultView` has no stored view to answer for.
 *
 * Each test names the mutation that kills it; the bench is in the report and in the commit body.
 */
import { readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const tail = vi.hoisted(() => ({ ids: [] as string[] }));

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
        LViewElement: { updateDefaultView: (v: any) => { tail.ids.push(v.id); } },
    };
});
vi.mock('../../components/forEndUser/Tooltip', () => ({ Tooltip: { show: () => undefined } }));

const { VersionFixer } = await import('../VersionFixer');

type AnyRec = Record<string, any>;
const VF: any = VersionFixer;
const adapters: Record<number, { n: number; f: (s: AnyRec) => AnyRec }> = VF.versionAdapters;
const HIGHEST: number = VersionFixer.get_highestversion();

const FILE: AnyRec = JSON.parse(readFileSync(new URL('./fixtures/save_3_0_0.jjodel', import.meta.url), 'utf8'));
const SAVED: string = await lz.decompressFromUTF16(FILE.state);
/** A fresh copy of the saved store: `update()` writes in place. */
const saved = (): AnyRec => JSON.parse(SAVED);
const clone = (s: AnyRec): AnyRec => JSON.parse(JSON.stringify(s));
const migrate = (s: AnyRec): AnyRec => VersionFixer.update(s as any) as any;

/** The steps a state at `from` walks to the highest version, read from the registered adapters. */
function pathFrom(from: number): number[] {
    const path: number[] = [];
    for (let v = from; v !== HIGHEST && path.length < 100; v = adapters[v].n) path.push(v);
    return path;
}
const ofClass = (s: AnyRec, cn: string): AnyRec[] =>
    Object.values(s.idlookup).filter((e: any) => e && typeof e === 'object' && e.className === cn) as AnyRec[];
const named = (s: AnyRec, cn: string, name: string): AnyRec => ofClass(s, cn).find(e => e.name === name)!;

const NEW_PRIMITIVES = ['Pointer_EXPRESSION', 'Pointer_ACTION'];

beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });
beforeEach(() => { tail.ids.length = 0; });

describe('a 3.0.0 save through the VersionFixer chain', () => {
    it('the file is a 3.0.0 export: format 2.228, one project with its store and its megamodel', () => {
        const s = saved();
        expect(s.version.n).toBe(2.228);
        expect(FILE.className).toBe('DProject');
        expect(s.projects).toEqual([FILE.id]);
        expect(s.idlookup[FILE.id]).toMatchObject({ className: 'DProject', id: FILE.id, name: 'Fixture300' });
        expect(FILE.megamodel?.megamodelVersion).toBe('1.0');
        expect(HIGHEST).toBeGreaterThan(2.228);
    });

    it('reaches the highest version through every step after 2.228, in order (kills: update stopping short of the highest)', () => {
        const before = saved();
        const out = migrate(saved());
        expect(pathFrom(2.228)[0]).toBe(2.228);
        expect(out.version.n).toBe(HIGHEST);
        expect(out.version.conversionList).toEqual([...before.version.conversionList, ...pathFrom(2.228)]);
    });

    it('keeps every record of the save as it was and adds Expression and Action only (kills: the 2.228 step body dropped)', () => {
        const before = saved();
        const out = migrate(saved());
        expect(Object.keys(out.idlookup).sort()).toEqual([...Object.keys(before.idlookup), ...NEW_PRIMITIVES].sort());
        for (const k of Object.keys(before.idlookup)) expect(out.idlookup[k], k).toEqual(before.idlookup[k]);
    });

    it('the primitives of 3.0.0 keep their ids and order, and Expression and Action follow EDouble (kills: the ids prepended)', () => {
        const before = saved();
        const out = migrate(saved());
        const prims: string[] = before.primitiveTypes;
        expect(prims[prims.length - 1]).toBe('Pointer_EDOUBLE');
        expect(out.primitiveTypes).toEqual([...prims, ...NEW_PRIMITIVES]);
        // api/data.ts reads index 1 of the primitives as EString.
        expect(out.primitiveTypes[1]).toBe('Pointer_ESTRING');
        expect(out.classs).toEqual([...before.classs, ...NEW_PRIMITIVES]);
    });

    it('Expression and Action are primitives nothing of the save points at (kills: the records copied from EDouble)', () => {
        const out = migrate(saved());
        for (const id of NEW_PRIMITIVES) {
            expect(out.idlookup[id]).toMatchObject({ className: 'DClass', id, isPrimitive: true });
            expect(out.idlookup[id].pointedBy.filter((p: AnyRec) => String(p.source).startsWith('idlookup.'))).toEqual([]);
        }
    });

    it('every attribute keeps its own primitive, aDouble still EDouble, and its saved value (declared: no mutant of the bench kills it alone)', () => {
        const before = saved();
        const out = migrate(saved());
        const attrs = named(out, 'DClass', 'Person').attributes.map((id: string) => out.idlookup[id]);
        expect(attrs).toHaveLength(10);
        for (const a of attrs) {
            expect(a.type, a.name).toBe(before.idlookup[a.id].type);
            expect(out.idlookup[a.type].name, a.name).toBe('E' + a.name.slice(1));
        }
        expect(new Set(attrs.map((a: AnyRec) => a.type))).toEqual(new Set(before.primitiveTypes));
        expect(named(out, 'DValue', 'aDouble').values).toEqual([3.25]);
    });

    it('stores no view, writes none, and hands the tail the default viewpoint alone (rule 14: kills a step after 2.228 that writes a view)', () => {
        const before = saved();
        const out = migrate(saved());
        expect(ofClass(before, 'DViewElement')).toEqual([]);
        expect(ofClass(out, 'DViewElement')).toEqual([]);
        expect(out.viewelements).toEqual([]);
        expect(out.viewpoints).toEqual(['Pointer_ViewPointDefault']);
        expect(out.idlookup.Pointer_ViewPointDefault).toEqual(before.idlookup.Pointer_ViewPointDefault);
        expect(Object.values(out.idlookup).filter((e: any) => e && (e.ir !== undefined || e.irLegacyClassic))).toEqual([]);
        expect(tail.ids).toEqual(['Pointer_ViewPointDefault']);
    });

    it('instances and references are as saved: two objects, one reference, alice.home is home1, both edges (kills: the purge reaching a live element)', () => {
        const before = saved();
        const out = migrate(saved());
        for (const cn of ['DObject', 'DValue', 'DReference', 'DAttribute', 'DVertex', 'DEdge', 'DModel']) {
            expect(ofClass(out, cn).length, cn).toBe(ofClass(before, cn).length);
        }
        expect(ofClass(out, 'DObject').map(o => o.name).sort()).toEqual(['alice', 'home1']);
        expect(ofClass(out, 'DReference').map(r => r.name)).toEqual(['home']);
        expect(named(out, 'DModel', 'model_1').objects).toEqual(named(before, 'DModel', 'model_1').objects);
        expect(named(out, 'DValue', 'home').values).toEqual([named(out, 'DObject', 'home1').id]);
        expect(ofClass(out, 'DEdge').map(e => e.model)).toEqual([named(out, 'DReference', 'home').id, named(out, 'DReference', 'home').id]);
    });

    it('a second update at the highest version changes nothing (declared: no mutant of the bench reaches it)', () => {
        const once = migrate(saved());
        const copy = clone(once);
        expect(migrate(once)).toEqual(copy);
    });
});

describe('a build without the last step', () => {
    const last = Number(Object.keys(adapters).find(k => adapters[Number(k)].n === HIGHEST));

    it(`a chain without the ${last} -> ${HIGHEST.toFixed(3)} adapter throws on a ${HIGHEST.toFixed(3)} save, and still opens the 3.0.0 save (control; kills: update tolerating a missing adapter)`, () => {
        const atHighest = migrate(saved());
        expect(atHighest.version.n).toBe(HIGHEST);
        const real = { adapters: VF.versionAdapters, highest: VF.highestVersion };
        const trimmed = { ...real.adapters };
        delete trimmed[last];
        try {
            VF.versionAdapters = trimmed;
            VF.highestVersion = last;
            expect(() => migrate(clone(atHighest))).toThrow(`missing version adapter from "${HIGHEST}"`);
            expect(migrate(saved()).version.n).toBe(last);
        } finally {
            VF.versionAdapters = real.adapters;
            VF.highestVersion = real.highest;
        }
        expect(migrate(clone(atHighest)).version.n).toBe(HIGHEST);
    });
});
