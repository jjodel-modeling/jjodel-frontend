/**
 * The importable lecture examples (slice S8, P-2026-10-11-1415): frontend/public/examples/codegen/<name>.jjodel, the
 * project files a student imports, written by the app's own export (scripts/examples/build-codegen-examples.ts).
 *
 * A `.jjodel` file is the raw project with its whole store in `state`, compressed by `async-lz-string`
 * (`U.compressedState`). Here each file's store is read back as the import reads it, and checked against the fixture
 * of its example (codegen/examples/<name>/<name>.json): the metamodel carries the fixture's roles and the fixture's
 * own `genTemplates`, the model its data declarations and the fixture's scenario under its name, in `runScenarios`.
 * Then the templates found in the file generate the program, and the oracle replays the scenario found in the file
 * against the simulator, in node, through the runner's in-process path (oracle/__tests__/exampleFixture.ts): what
 * «Check» does in the app, on the file's own store.
 *
 * The import half of the round trip (`ProjectsApi.importFromText`, `duplicateProject`) does not load in node (the
 * joiner writes on `window`); it is the probe's, scripts/probe/codegen-examples.ts. What the import needs from the
 * file is checked here: its renewal of ids is a text replacement per id, so no id of the file may be the prefix of
 * another one followed by a digit. Each test name says which break kills it; the bench is in the commit body.
 */

import { readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { describe, it, expect } from 'vitest';
import { generate } from '../../engine/generate';
import { readModelTemplates } from '../../engine/templateCodec';
import { runOracle } from '../../oracle/oracle';
import { storedScenarios } from '../../oracle/storedScenarios';
import { EXAMPLES, inProcess, loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';

type Lookup = Record<string, any>;

/** The project name each file carries (the build script's). */
const PROJECT: Record<(typeof EXAMPLES)[number], string> = { turnstile: 'Turnstile', 'petri-producer-consumer': 'Producer-consumer' };

interface ProjectFile {
    readonly json: Record<string, any>;
    readonly store: Record<string, any>;
    readonly lookup: Lookup;
}

async function readFile(name: (typeof EXAMPLES)[number]): Promise<ProjectFile> {
    const json = JSON.parse(readFileSync(new URL(`../../../../public/examples/codegen/${name}.jjodel`, import.meta.url), 'utf8'));
    const store = JSON.parse(await lz.decompressFromUTF16(json.state));
    return { json, store, lookup: store.idlookup };
}

const models = (lookup: Lookup, meta: boolean) => Object.values(lookup).filter((d: any) => d?.className === 'DModel' && !!d.isMetamodel === meta);

/** The element of the file named as the fixture's element `fid`, of the same class: the id the build mapped it to. */
function namesake(lookup: Lookup, fixture: Lookup, fid: string): string | undefined {
    const f = fixture[fid];
    if (!f) return undefined;
    const hits = Object.values(lookup).filter((d: any) => d?.className === f.className && d.name === f.name);
    return hits.length === 1 ? (hits[0] as any).id : undefined;
}

describe.each(EXAMPLES)('the project file of %s', name => {
    it('is the export of one project: the raw project, its store and its megamodel (mutant: a hand-written file)', async () => {
        const { json, store } = await readFile(name);
        expect(json.name).toBe(PROJECT[name]);
        expect(store.projects).toEqual([json.id]);
        expect(store.idlookup[json.id]).toMatchObject({ className: 'DProject', id: json.id });
        expect(json.megamodel?.megamodelVersion).toBe('1.0');
    });

    it('holds the fixture\'s metamodel and model, and no model of the other example (mutant: the build reuses one context)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadExample(name);
        const other = loadExample(EXAMPLES.find(n => n !== name)!);
        expect(models(lookup, true).map((m: any) => m.name)).toEqual([ex.lookup.MM.name]);
        expect(models(lookup, false).map((m: any) => m.name)).toContain(ex.lookup.M.name);
        expect(models(lookup, false).map((m: any) => m.name)).not.toContain(other.lookup.M.name);
    });

    it('carries its own templates on the metamodel, not the other example\'s (mutant: one file carries the other\'s templates)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadExample(name);
        const other = loadExample(EXAMPLES.find(n => n !== name)!);
        const mm = models(lookup, true)[0] as any;
        expect(mm._state.genTemplates).toBe(ex.lookup.MM._state.genTemplates);
        expect(mm._state.genTemplates).not.toBe(other.lookup.MM._state.genTemplates);
    });

    it('carries the simulation roles of the fixture, each on the namesake of the fixture\'s element (mutant: the export drops a role)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadExample(name);
        const mm = models(lookup, true)[0] as any;
        for (const [key, value] of Object.entries(ex.lookup.MM._state)) {
            if (key === 'genTemplates') continue;
            const expected = typeof value === 'string' && ex.lookup[value] ? namesake(lookup, ex.lookup, value) : value;
            expect(expected, key).not.toBeUndefined();
            expect(mm._state[key], key).toBe(expected);
        }
    });

    it('carries the data declarations of the fixture\'s model (mutant: the export drops the model\'s bag)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadExample(name);
        const m = models(lookup, false).find((d: any) => d.name === ex.lookup.M.name) as any;
        for (const [key, value] of Object.entries(ex.lookup.M._state ?? {})) expect(m._state[key], key).toBe(value);
    });

    it('stores the fixture\'s scenario alone under its name, its steps on the namesakes (mutant: the export drops runScenarios)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadExample(name);
        const m = models(lookup, false).find((d: any) => d.name === ex.lookup.M.name) as any;
        const scenarios = storedScenarios(lookup, m.id);
        expect(scenarios.map(s => s.name)).toEqual([ex.scenario.name]);
        const ref = (fid: string | null) => (fid === null ? null : namesake(lookup, ex.lookup, fid));
        expect(scenarios[0].steps).toEqual(ex.scenario.steps.map(s => ({ ...s, event: ref(s.event), selector: ref(s.selector) })));
        expect(scenarios[0].expect).toBe(ex.scenario.expect);
    });

    it('has no id that is the prefix of another id followed by a digit (mutant: ids the import\'s text replacement would corrupt)', async () => {
        const { store } = await readFile(name);
        const ids = Object.keys(store.idlookup);
        const clashes = ids.filter(a => ids.some(b => b !== a && b.startsWith(a) && /^\d/.test(b.slice(a.length))));
        expect(clashes).toEqual([]);
    });

    it('passes the oracle on its stored scenario with the templates it carries: «Check» in node (mutant: the scenario or the templates of the other example)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadExample(name);
        const m = models(lookup, false).find((d: any) => d.name === ex.lookup.M.name) as any;
        const templates = readModelTemplates(lookup, m.id);
        expect(templates.defects).toEqual([]);
        const out = generate(recordOf(lookup, m.id), lookup, m.id, templates.templates, 'main');
        expect(out.errors).toEqual([]);
        const [scenario] = storedScenarios(lookup, m.id);
        const result = await runOracle({ lookup, modelId: m.id, globals: recordOf(lookup, m.id), scenario, code: out.code, map: out.map, run: inProcess });
        expect(result.ok, JSON.stringify(result).slice(0, 1500)).toBe(true);
        expect(result.sim.length).toBe(ex.scenario.steps.length + 1);
    });
});
