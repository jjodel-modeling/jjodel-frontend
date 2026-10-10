/**
 * templateCodec — the `genTemplates` key of the metamodel's bag (slice S2, P-2026-10-10-0945; spec §3, R-GEN-3,
 * R-GEN-12, discovery §C, U2).
 *
 * Executes the encoder, the decoder, the patch and the reader (P11), then the D-layer round trip: the saved state
 * is the JSON the save writes (`U.tsx`, `JSON.stringify(state, proxyToIdReplacer)`; a D-layer state holds no
 * proxy), and the load is `JSON.parse` then the REAL `VersionFixer.update` (`SaveManager.ts`), with the joiner
 * barrel mocked as in `redux/__tests__/versionfixer_old_states.test.ts` (the block below is that file's, verbatim
 * but for the relative paths). The experimental setting does not exist yet (slice S5): nothing on the save and
 * load path reads the key, which is what «with the setting off» means here.
 *
 * No existing test keeps `runScenarios` or `runWatches` across a save and a load: a search for either key over
 * the `__tests__` files of `frontend/src` (`command grep -rn "runScenarios\|runWatches\|RUN_SCENARIOS_KEY\|
 * RUN_WATCHES_KEY"`) hits the two codec tests, the positive control, and three run tests that seed the bag. This
 * test is the first of its kind; its positive control is that the chain ran.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../../../joiner', () => {
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
vi.mock('../../../components/forEndUser/Tooltip', () => ({ Tooltip: { show: () => undefined } }));

const { VersionFixer } = await import('../../../redux/VersionFixer');
const { default: first } = await import('../../../examples/first');
const { decodeTemplates, encodeTemplates, GEN_TEMPLATES_KEY, readModelTemplates, readTemplates, templatesPatch } = await import('../templateCodec');
type TemplateRecord = import('../templates').TemplateRecord;

beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });

const MAIN: TemplateRecord = { name: 'main', params: [], body: '"export const states = [${stc.nodes.map(s => "\'${s.name}\'").join(", ")}];\n"' };
const ROW: TemplateRecord = { name: 'row', params: ['t', 'indent'], body: '"\\t«${t.name}» — \\"quoted\\" ünïcödé"', target: 'javascript' };

describe('the key', () => {
    it('is genTemplates, not a sim* key: the run signature folds every sim* key, so an edit would interrupt a run (mutant: simTemplates)', () => {
        expect(GEN_TEMPLATES_KEY).toBe('genTemplates');
        expect(GEN_TEMPLATES_KEY.startsWith('sim')).toBe(false);
    });
});

describe('encodeTemplates and decodeTemplates', () => {
    it('round trip, byte-identical: newlines, quotes, backslashes, non-ASCII and the optional target (mutant: a field dropped on decode)', () => {
        const raw = encodeTemplates([MAIN, ROW]);
        expect(JSON.parse(raw)).toEqual({ v: 1, templates: [
            { name: 'main', params: [], body: MAIN.body },
            { name: 'row', params: ['t', 'indent'], body: ROW.body, target: 'javascript' },
        ] });
        const d = decodeTemplates(raw);
        expect(d).toEqual({ templates: [MAIN, ROW], defects: [], readable: true });
        expect(encodeTemplates(d.templates)).toBe(raw);
    });

    it('unknown fields are ignored, at the root and in a record', () => {
        const raw = JSON.stringify({ v: 1, future: true, templates: [{ name: 'main', params: [], body: '"x"', author: 'ada', z: 2 }] });
        expect(decodeTemplates(raw)).toEqual({ templates: [{ name: 'main', params: [], body: '"x"' }], defects: [], readable: true });
    });

    it('an absent key is no templates and no defect', () => {
        expect(decodeTemplates(undefined)).toEqual({ templates: [], defects: [], readable: true });
        expect(decodeTemplates(null)).toEqual({ templates: [], defects: [], readable: true });
    });

    it('a key that is not JSON, or has no version 1 and list, is one defect and unreadable', () => {
        for (const raw of ['{"v":1,', '{"v":2,"templates":[]}', '{"v":1}', '[]']) {
            const d = decodeTemplates(raw);
            expect([d.templates, d.readable, d.defects.length, d.defects[0].index]).toEqual([[], false, 1, null]);
        }
    });

    it('a record that is not one is a defect of its own, and the others decode', () => {
        const raw = JSON.stringify({ v: 1, templates: [
            { name: 'a', params: [], body: '"a"' }, 7, { params: [], body: '"x"' }, { name: 'a', params: [], body: '"dup"' },
            { name: 'p', params: ['x', 3], body: '"x"' }, { name: 'q', params: [], body: 3 }, { name: 'r', body: '"r"' },
            { name: 's', params: [], body: '"s"', target: 4 },
        ] });
        const d = decodeTemplates(raw);
        expect(d.templates.map(t => t.name)).toEqual(['a']);
        expect(d.defects.map(x => [x.index, x.name])).toEqual([[1, null], [2, null], [3, 'a'], [4, 'p'], [5, 'q'], [6, 'r'], [7, 's']]);
        expect(d.readable).toBe(true);
    });
});

describe('templatesPatch: what S5 writes through the state setter', () => {
    it('one key: the encoded list (C.6)', () => {
        expect(templatesPatch(undefined, [MAIN])).toEqual({ genTemplates: encodeTemplates([MAIN]) });
    });

    it('nothing when the list is the stored one, or empty on a metamodel with no key, which keeps its bytes', () => {
        expect(templatesPatch(encodeTemplates([MAIN]), [MAIN])).toBeNull();
        expect(templatesPatch(undefined, [])).toBeNull();
        expect(templatesPatch(null, [])).toBeNull();
    });

    it('an emptied list is written [], never by removing the key: the undo of a removed bag key does not restore it (mutant: the key removed)', () => {
        expect(templatesPatch(encodeTemplates([MAIN]), [])).toEqual({ genTemplates: '{"v":1,"templates":[]}' });
    });
});

describe('the reader, from the metamodel\'s _state', () => {
    const lookup: Record<string, any> = {
        MM: { className: 'DModel', id: 'MM', _state: { simProfile: 'stateMachine', genTemplates: encodeTemplates([MAIN]) } },
        M: { className: 'DModel', id: 'M', instanceof: 'MM' },
        MM2: { className: 'DModel', id: 'MM2', _state: { simProfile: 'stateMachine' } },
        M2: { className: 'DModel', id: 'M2', instanceof: 'MM2' },
    };

    it('reads the metamodel\'s key, and a model\'s through its instanceof', () => {
        expect(readTemplates(lookup, 'MM').templates).toEqual([MAIN]);
        expect(readModelTemplates(lookup, 'M').templates).toEqual([MAIN]);
    });

    it('a metamodel without the key, or not in the lookup, has no templates', () => {
        expect(readTemplates(lookup, 'MM2')).toEqual({ templates: [], defects: [], readable: true });
        expect(readModelTemplates(lookup, 'M2').templates).toEqual([]);
        expect(readTemplates(lookup, 'nope').templates).toEqual([]);
        expect(readModelTemplates(lookup, 'nope').templates).toEqual([]);
    });
});

describe('the D-layer save and load keep genTemplates intact', () => {
    it('saved, loaded through the real VersionFixer chain: the key byte for byte, the templates the same', () => {
        const state = JSON.parse(first as unknown as string);
        const mmId = (state.models as string[]).find(id => state.idlookup[id]?.isMetamodel === true)!;
        expect(mmId).toBeDefined();
        const raw = encodeTemplates([MAIN, ROW]);
        state.idlookup[mmId]._state = { ...(state.idlookup[mmId]._state ?? {}), [GEN_TEMPLATES_KEY]: raw };
        expect(state.version).toBeUndefined();

        const saved = JSON.stringify(state);
        const loaded = VersionFixer.update(JSON.parse(saved));

        // Positive control: the chain ran over this state, from no version to the highest.
        expect(loaded.version.n).toBe(VersionFixer.get_highestversion());
        expect(loaded.version.conversionList.length).toBeGreaterThan(10);
        expect(loaded.idlookup[mmId]._state[GEN_TEMPLATES_KEY]).toBe(raw);
        expect(readTemplates(loaded.idlookup, mmId).templates).toEqual([MAIN, ROW]);
    });
});
