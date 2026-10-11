/**
 * The VersionFixer step `2.229 -> 2.230`: every instance is listed by its model (R-NEST-6, #174),
 * P-2026-10-07-0950. Layer Impact Report: docs/lir/lir_2026-10-07_174_migration.md.
 *
 * SOURCE: `frontend/src/redux/VersionFixer.tsx`, the REAL class, with the joiner barrel mocked
 * exactly as in `versionfixer_2229_migration.test.ts` (copied, not imported: a `vi.mock` factory is
 * per file).
 *
 * Each test names the mutant of the step that it kills.
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

type AnyRec = Record<string, any>;
const VF: any = VersionFixer;
const adapters: Record<number, { n: number; f: (s: AnyRec) => AnyRec }> = VF.versionAdapters;
const runStep = (s: AnyRec): AnyRec => adapters[2.229].f.call(new VF(), s);
const clone = (s: AnyRec): AnyRec => JSON.parse(JSON.stringify(s));
const src = (m: string) => `idlookup.${m}.objects`;
const objectsPb = (o: AnyRec, m: string) => (o.pointedBy ?? []).filter((p: AnyRec) => p?.source === src(m)).length;

beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });

/**
 * A model `m` and its metamodel `mm`:
 *
 *   m (DModel)
 *     +- s   : Scenario (father m, listed)
 *     |    +- k   : Phase (s.pathway, listed)            the `set` / XMI form
 *     |    +- a   : Phase (s.pathway, NOT listed)        the «Add» form saved before #174
 *     |    |    +- g : Phase (a.sub, NOT listed)        a grandchild
 *     |    +- p   : Person (s.team, aggregation, NOT listed) re-fathered by an aggregation
 *     +- o   : Phase (father m, NOT listed)              the eviction orphan
 *     +- d   : Phase (father 'gone', a deleted slot)     dangling: left untouched
 */
function fixture(): AnyRec {
    const pb = (m: string) => [{ source: src(m) }];
    const idlookup: AnyRec = {
        mm: { id: 'mm', className: 'DModel', isMetamodel: true, objects: [] },
        m: { id: 'm', className: 'DModel', isMetamodel: false, objects: ['s', 'k'] },
        r_path: { id: 'r_path', className: 'DReference', name: 'pathway', composition: true },
        r_sub: { id: 'r_sub', className: 'DReference', name: 'sub', composition: true },
        r_team: { id: 'r_team', className: 'DReference', name: 'team', aggregation: true, composition: false },
        s: { id: 's', className: 'DObject', father: 'm', features: ['v_s_path', 'v_s_team'], pointedBy: pb('m') },
        v_s_path: { id: 'v_s_path', className: 'DValue', father: 's', instanceof: 'r_path', values: ['k', 'a'] },
        v_s_team: { id: 'v_s_team', className: 'DValue', father: 's', instanceof: 'r_team', values: ['p'] },
        k: { id: 'k', className: 'DObject', father: 'v_s_path', features: [], pointedBy: pb('m') },
        a: { id: 'a', className: 'DObject', father: 'v_s_path', features: ['v_a_sub'], pointedBy: [] },
        v_a_sub: { id: 'v_a_sub', className: 'DValue', father: 'a', instanceof: 'r_sub', values: ['g'] },
        g: { id: 'g', className: 'DObject', father: 'v_a_sub', features: [], pointedBy: [] },
        p: { id: 'p', className: 'DObject', father: 'v_s_team', features: [], pointedBy: [] },
        o: { id: 'o', className: 'DObject', father: 'm', features: [], pointedBy: [] },
        d: { id: 'd', className: 'DObject', father: 'gone', features: [], pointedBy: [] },
    };
    return { idlookup, version: { n: 2.229, date: 'test', conversionList: [] } };
}

describe('2.229 -> 2.230: every instance is listed by its model (R-NEST-6)', () => {
    it('the step is registered and 2.230 is the highest version', () => {
        expect(adapters[2.229]?.n).toBe(2.23);
        expect(VF.get_highestversion()).toBe(2.23);
    });

    it('lists a nested child born in its slot (kills: no append to objects)', () => {
        const out = runStep(fixture());
        expect(out.idlookup.m.objects).toContain('a');
    });

    it('lists a grandchild, two slots down (kills: a walk that stops at the first hop)', () => {
        const out = runStep(fixture());
        expect(out.idlookup.m.objects).toContain('g');
    });

    it('lists the eviction orphan, fathered to the model and listed nowhere (kills: nested-only filter)', () => {
        const out = runStep(fixture());
        expect(out.idlookup.m.objects).toContain('o');
    });

    it('lists an element an aggregation re-fathered and leaves its father on the slot (R-NEST-2)', () => {
        const out = runStep(fixture());
        expect(out.idlookup.m.objects).toContain('p');
        expect(out.idlookup.p.father).toBe('v_s_team');
    });

    it('writes the pointedBy entry an objects += writes, once (kills: no pointedBy write)', () => {
        const out = runStep(fixture());
        for (const id of ['a', 'g', 'o', 'p']) expect(objectsPb(out.idlookup[id], 'm'), id).toBe(1);
    });

    it('does not duplicate a pointedBy entry already there (kills: pointedBy pushed unconditionally)', () => {
        const s = fixture();
        s.idlookup.a.pointedBy = [{ source: src('m') }];
        const out = runStep(s);
        expect(objectsPb(out.idlookup.a, 'm')).toBe(1);
    });

    it('leaves a dangling chain untouched: not listed, father unchanged', () => {
        const out = runStep(fixture());
        expect(out.idlookup.m.objects).not.toContain('d');
        expect(out.idlookup.d.father).toBe('gone');
        expect(out.idlookup.d.pointedBy).toEqual([]);
    });

    it('deduplicates objects keeping the first entry (kills: no dedup)', () => {
        const s = fixture();
        s.idlookup.m.objects = ['s', 'k', 's', 'k'];
        const out = runStep(s);
        expect(out.idlookup.m.objects.slice(0, 2)).toEqual(['s', 'k']);
        expect(new Set(out.idlookup.m.objects).size).toBe(out.idlookup.m.objects.length);
    });

    it('keeps the order of the existing entries and appends the new ones after them', () => {
        const out = runStep(fixture());
        expect(out.idlookup.m.objects.slice(0, 2)).toEqual(['s', 'k']);
        expect(out.idlookup.m.objects).toHaveLength(6);
    });

    it('is idempotent: a second run changes nothing (declared: dropping the includes check is an equivalent mutant, the dedup restores the list)', () => {
        const once = runStep(fixture());
        const twice = runStep(clone(once));
        expect(twice.idlookup).toEqual(once.idlookup);
    });

    it('is a no-op on a coherent state (declared: no mutant of the bench reaches a state that lists everything)', () => {
        const coherent = clone(runStep(fixture()));
        const before = clone(coherent);
        const out = runStep(coherent);
        expect(out.idlookup).toEqual(before.idlookup);
    });

    it('touches no metamodel and no father (the listed ones keep theirs)', () => {
        const s = fixture();
        const fathers = Object.fromEntries(Object.entries(s.idlookup).map(([k, v]: [string, any]) => [k, v.father]));
        const out = runStep(s);
        expect(out.idlookup.mm.objects).toEqual([]);
        for (const [k, f] of Object.entries(fathers)) expect(out.idlookup[k].father, k).toBe(f);
    });

    it('returns a state without idlookup as it is', () => {
        const s: AnyRec = { version: { n: 2.229 } };
        expect(runStep(s)).toBe(s);
    });
});
