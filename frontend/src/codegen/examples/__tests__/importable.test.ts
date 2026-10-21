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
 *
 * The hardware demonstrator's CPU (P-2026-10-21-1036, slice S-A1), frontend/public/examples/hw/hw-cpu.jjodel, is
 * checked by the same tests (exampleFixture.ts `SHIPPED`). Built from nothing, its spec lists the whole metamodel and
 * model, so its file is also compared with the spec element by element; the oracle runs once it has templates and a
 * scenario (slices S-B, S-D).
 */

import { readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { describe, it, expect } from 'vitest';
import { generate } from '../../engine/generate';
import { readModelTemplates } from '../../engine/templateCodec';
import { runOracle } from '../../oracle/oracle';
import { storedScenarios } from '../../oracle/storedScenarios';
import { SHIPPED, SHIPPED_EXAMPLES, inProcess, loadSpec, recordOf } from '../../oracle/__tests__/exampleFixture';
import type { ShippedName } from '../../oracle/__tests__/exampleFixture';

type Lookup = Record<string, any>;

interface ProjectFile {
    readonly json: Record<string, any>;
    readonly store: Record<string, any>;
    readonly lookup: Lookup;
}

async function readFile(name: ShippedName): Promise<ProjectFile> {
    const json = JSON.parse(readFileSync(new URL(`../../../../public/examples/${SHIPPED[name].dir}/${name}.jjodel`, import.meta.url), 'utf8'));
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

/**
 * The given classes and their features, one line each: the spec's and the file's read alike. A type that is one of
 * these classes reads by name; any other, a primitive's pointer, by id (the file resolves `Pointer_EINT` to a class
 * `EInt` of its own, the spec does not hold it).
 */
function metamodelLines(lookup: Lookup, classes: any[]): string[] {
    const ids = new Set(classes.map(c => c.id));
    const type = (t: string) => (ids.has(t) ? `@${lookup[t].name}` : t);
    return classes.flatMap((c: any) => [
        `class ${c.name}${c.abstract ? ' abstract' : ''} extends [${(c.extends ?? []).map((e: string) => lookup[e].name).join(',')}]`,
        ...Object.values(lookup).filter((f: any) => (f?.className === 'DAttribute' || f?.className === 'DReference') && f.father === c.id)
            .map((f: any) => `${c.name}.${f.name} : ${type(f.type)} ${f.lowerBound}..${f.upperBound}${f.composition ? ' contains' : ''}`),
    ]).sort();
}

/** The objects of a model by name, each with its class and slots, a reference's values as object names. */
function modelObjects(lookup: Lookup, mId: string): Record<string, { cls: string; f: Record<string, unknown[]> }> {
    const under = (id: string) => { let d = lookup[id]; for (let i = 0; d && i < 40; i++) { if (d.id === mId) return true; d = lookup[d.father]; } return false; };
    const out: Record<string, { cls: string; f: Record<string, unknown[]> }> = {};
    for (const o of Object.values(lookup).filter((d: any) => d?.className === 'DObject' && under(d.id)) as any[]) {
        const f: Record<string, unknown[]> = {};
        for (const vid of o.features ?? []) {
            const v = lookup[vid], fd = lookup[v.instanceof];
            f[fd.name] = (v.values ?? []).filter((x: unknown) => x !== undefined && x !== null && x !== '')
                .map((x: unknown) => (fd.className === 'DReference' ? lookup[x as string]?.name ?? `?${x}` : x));
        }
        out[o.name] = { cls: lookup[o.instanceof].name, f: Object.fromEntries(Object.entries(f).sort(([a], [b]) => (a < b ? -1 : 1))) };
    }
    return out;
}

/** The examples built from nothing (no scene): their spec lists the whole metamodel and model, so the file equals it. */
const FROM_NOTHING = SHIPPED_EXAMPLES.filter(n => loadSpec(n).scene === null);

describe.each(SHIPPED_EXAMPLES)('the project file of %s', name => {
    const spec = loadSpec(name);
    const others = SHIPPED_EXAMPLES.filter(n => n !== name).map(loadSpec);

    it('is the export of one project: the raw project, its store and its megamodel (mutant: a hand-written file)', async () => {
        const { json, store } = await readFile(name);
        expect(json.name).toBe(SHIPPED[name].project);
        expect(store.projects).toEqual([json.id]);
        expect(store.idlookup[json.id]).toMatchObject({ className: 'DProject', id: json.id });
        expect(json.megamodel?.megamodelVersion).toBe('1.0');
    });

    it('holds the fixture\'s metamodel and model, and no model of another example (mutant: the build reuses one context)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadSpec(name);
        expect(models(lookup, true).map((m: any) => m.name)).toEqual([ex.lookup.MM.name]);
        expect(models(lookup, false).map((m: any) => m.name)).toContain(ex.lookup.M.name);
        for (const other of others) expect(models(lookup, false).map((m: any) => m.name)).not.toContain(other.lookup.M.name);
    });

    it('carries its own templates on the metamodel, not another example\'s (mutant: one file carries the other\'s templates)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadSpec(name);
        const mm = models(lookup, true)[0] as any;
        expect(mm._state?.genTemplates).toBe(ex.lookup.MM._state?.genTemplates);
        for (const other of others.filter(o => o.lookup.MM._state?.genTemplates !== undefined)) {
            expect(mm._state?.genTemplates).not.toBe(other.lookup.MM._state.genTemplates);
        }
    });

    it('carries the simulation roles of the fixture, each on the namesake of the fixture\'s element (mutant: the export drops a role)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadSpec(name);
        const mm = models(lookup, true)[0] as any;
        for (const [key, value] of Object.entries(ex.lookup.MM._state ?? {})) {
            if (key === 'genTemplates') continue;
            const expected = typeof value === 'string' && ex.lookup[value] ? namesake(lookup, ex.lookup, value) : value;
            expect(expected, key).not.toBeUndefined();
            expect(mm._state[key], key).toBe(expected);
        }
    });

    it('carries the data declarations of the fixture\'s model (mutant: the export drops the model\'s bag)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadSpec(name);
        const m = models(lookup, false).find((d: any) => d.name === ex.lookup.M.name) as any;
        for (const [key, value] of Object.entries(ex.lookup.M._state ?? {})) expect(m._state[key], key).toBe(value);
    });

    it('stores the fixture\'s scenario alone under its name, its steps on the namesakes, or none without one (mutant: the export drops runScenarios)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadSpec(name);
        const m = models(lookup, false).find((d: any) => d.name === ex.lookup.M.name) as any;
        const scenarios = storedScenarios(lookup, m.id);
        expect(scenarios.map(s => s.name)).toEqual(ex.scenario ? [ex.scenario.name] : []);
        if (!ex.scenario) return;
        const ref = (fid: string | null) => (fid === null ? null : namesake(lookup, ex.lookup, fid));
        expect(scenarios[0].steps).toEqual(ex.scenario.steps.map(s => ({ ...s, event: ref(s.event), selector: ref(s.selector) })));
        expect(scenarios[0].expect).toBe(ex.scenario.expect);
    });

    it.runIf(FROM_NOTHING.includes(name))('holds the spec\'s metamodel, class by class and feature by feature (mutant: a feature dropped, retyped or rebound)', async () => {
        const { lookup } = await readFile(name);
        const mm = models(lookup, true)[0] as any;
        const under = (id: string) => { let d = lookup[id]; for (let i = 0; d && i < 40; i++) { if (d.id === mm.id) return true; d = lookup[d.father]; } return false; };
        // The spec's classes hang from no package (the turnstile.json shape): every class of the spec is its metamodel's.
        const want = metamodelLines(spec.lookup, Object.values(spec.lookup).filter((d: any) => d?.className === 'DClass'));
        expect(want.length).toBeGreaterThan(0);
        expect(metamodelLines(lookup, Object.values(lookup).filter((d: any) => d?.className === 'DClass' && under(d.id)))).toEqual(want);
    });

    it.runIf(FROM_NOTHING.includes(name))('holds the spec\'s model, object by object and slot by slot (mutant: a slot value, a reference or an object changed)', async () => {
        const { lookup } = await readFile(name);
        const m = models(lookup, false).find((d: any) => d.name === spec.lookup.M.name) as any;
        const want = modelObjects(spec.lookup, spec.modelId);
        expect(Object.keys(want).length).toBeGreaterThan(0);
        expect(modelObjects(lookup, m.id)).toEqual(want);
    });

    it('has no id that is the prefix of another id followed by a digit (mutant: ids the import\'s text replacement would corrupt)', async () => {
        const { store } = await readFile(name);
        const ids = Object.keys(store.idlookup);
        const clashes = ids.filter(a => ids.some(b => b !== a && b.startsWith(a) && /^\d/.test(b.slice(a.length))));
        expect(clashes).toEqual([]);
    });

    it.runIf(!!spec.scenario && spec.lookup.MM._state?.genTemplates !== undefined)('passes the oracle on its stored scenario with the templates it carries: «Check» in node (mutant: the scenario or the templates of the other example)', async () => {
        const { lookup } = await readFile(name);
        const ex = loadSpec(name);
        const m = models(lookup, false).find((d: any) => d.name === ex.lookup.M.name) as any;
        const templates = readModelTemplates(lookup, m.id);
        expect(templates.defects).toEqual([]);
        const out = generate(recordOf(lookup, m.id), lookup, m.id, templates.templates, 'main');
        expect(out.errors).toEqual([]);
        const [scenario] = storedScenarios(lookup, m.id);
        const result = await runOracle({ lookup, modelId: m.id, globals: recordOf(lookup, m.id), scenario, code: out.code, map: out.map, run: inProcess });
        expect(result.ok, JSON.stringify(result).slice(0, 1500)).toBe(true);
        expect(result.sim.length).toBe(ex.scenario!.steps.length + 1);
    });
});
