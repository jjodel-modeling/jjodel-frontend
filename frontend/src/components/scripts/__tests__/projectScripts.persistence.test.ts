/**
 * `DProject.scripts` through save and open (S6a, R-JJD-5): no VersionFixer migration, the field read with `|| []`.
 *
 * FIXTURE: `redux/__tests__/fixtures/save_3_0_0.jjodel`, a project saved before the field existed (format 2.228; how
 * it was built: docs/discovery/discovery_2026-10-12_rel31_fixture.md). The open is the one `redux/reducer` runs:
 * `decompressFromUTF16`, `JSON.parse`, then `VersionFixer.update`, the REAL class with the joiner barrel mocked as in
 * `redux/__tests__/versionfixer_3_0_0_save.test.ts` (copied, not imported: a `vi.mock` factory is per file). The save
 * is the body of `U.compressedState` past its idlookup filter: `JSON.stringify` and `compressToUTF16`.
 *
 * Each test names the mutation that kills it.
 */
import { readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { addScript, readScripts, updateScript } from '../projectScripts';

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
vi.mock('../../forEndUser/Tooltip', () => ({ Tooltip: { show: () => undefined } }));

const { VersionFixer } = await import('../../../redux/VersionFixer');

type AnyRec = Record<string, any>;
const FILE: AnyRec = JSON.parse(readFileSync(new URL('../../../redux/__tests__/fixtures/save_3_0_0.jjodel', import.meta.url), 'utf8'));
const SAVED: string = await lz.decompressFromUTF16(FILE.state);
const saved = (): AnyRec => JSON.parse(SAVED);
/** The open of `redux/reducer`: decompress, parse, migrate. */
const open = async (compressed: string): Promise<AnyRec> =>
    VersionFixer.update(JSON.parse(await lz.decompressFromUTF16(compressed)) as any) as any;
/** The save of `U.compressedState`, past its idlookup filter. */
const save = async (state: AnyRec): Promise<string> => lz.compressToUTF16(JSON.stringify(state));

beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });

describe('DProject.scripts through save and open', () => {
    it('a project saved before the field loads unchanged and reads an empty list (kills: a migration adding the field, the || [] dropped)', async () => {
        const before = saved();
        expect(before.idlookup[FILE.id]).toMatchObject({ className: 'DProject', name: 'Fixture300' });
        expect('scripts' in before.idlookup[FILE.id]).toBe(false);
        const out = await open(FILE.state);
        expect('scripts' in out.idlookup[FILE.id]).toBe(false);
        expect(readScripts(out.idlookup[FILE.id])).toEqual([]);
        // The project entry is otherwise the one the chain gives without this change: same keys.
        expect(Object.keys(out.idlookup[FILE.id]).sort()).toEqual(Object.keys(before.idlookup[FILE.id]).sort());
    });

    it('a project with scripts round-trips save and open with every entry intact (kills: the field dropped on save or open)', async () => {
        const state = saved();
        const project = state.idlookup[FILE.id];
        let { scripts } = addScript(readScripts(project), { name: 'make people', text: 'create Person p\nset p.name = "a"', modelId: 'Pointer_M1' }, 100, 'Script_a');
        ({ scripts } = addScript(scripts, { name: 'make people', text: 'create Address a', generatedText: 'create Address a' }, 200, 'Script_b'));
        scripts = updateScript(scripts, 'Script_a', { text: 'create Person q' }, 300);
        project.scripts = scripts;

        const reopened = await open(await save(state));
        expect(readScripts(reopened.idlookup[FILE.id])).toEqual([
            { id: 'Script_a', name: 'make people.jjs', text: 'create Person q', modelId: 'Pointer_M1', updatedAt: 300 },
            { id: 'Script_b', name: 'make people (1).jjs', text: 'create Address a', generatedText: 'create Address a', updatedAt: 200 },
        ]);
        // A second round trip is stable.
        const twice = await open(await save(reopened));
        expect(twice.idlookup[FILE.id].scripts).toEqual(reopened.idlookup[FILE.id].scripts);
    });
});
