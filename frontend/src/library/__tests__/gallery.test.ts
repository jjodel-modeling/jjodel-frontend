/**
 * The gallery projects of R-LIB-5 (slice S1, P-2026-10-18-1800): frontend/public/library/gallery/<id>/<n>.jjodel, the
 * project files the Templates page clones, written by the app's own importers and export
 * (scripts/library/build-gallery.ts). Two tiers and versions since R-LIB-9 (P-2026-10-18-2300): five templates, two
 * examples, every version with the sha256 of its file in the catalog. An example is its codegen example of
 * frontend/public/examples/codegen/ imported, with a hand-written viewpoint added (R-LIB-10, P-2026-10-19-0300): the
 * import renews the ids, so the files differ, and what it must keep is checked here, the generated text above all.
 *
 * A `.jjodel` file is the raw project with its whole store in `state`, compressed by `async-lz-string`
 * (`U.compressedState`). Here each file's store is read back as the import reads it and checked against the catalog
 * (docs/library/catalog.json) and against the sources of the build (scripts/library/gallery/): one project per
 * catalog `galleryProject`, named as its label, with the metamodels and the models of its sources and the number of
 * objects each sample model holds.
 *
 * The import half of the round trip (`ProjectsApi.importFromText`, `duplicateProject`) does not load in node (the
 * joiner writes on `window`); it is the probe's. What the import needs from the file is checked here: its renewal of
 * ids is a text replacement per id, so no id of the file may be the prefix of another one followed by a digit. Each
 * test name says which break kills it.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { describe, it, expect } from 'vitest';
import { currentVersion, parseGalleryRef, resolveGalleryRef, type GalleryVersion } from '../galleryRef';
import { generate } from '../../codegen/engine/generate';
import { readModelTemplates } from '../../codegen/engine/templateCodec';
import { storedScenarios } from '../../codegen/oracle/storedScenarios';
import { recordOf } from '../../codegen/oracle/__tests__/exampleFixture';

type Lookup = Record<string, any>;

interface Entry { id: string; kind: string; label: string; status: string; tier?: string; version?: number; versions?: GalleryVersion[];
    level?: string; concepts?: string[]; callout?: string; preview?: string }

const catalog = JSON.parse(readFileSync(new URL('../../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { version: number; entries: Entry[] };
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject');
const EXAMPLES = GALLERY.filter(e => e.tier === 'example');

/** What the build's sources hold: metamodel names, and each model with its number of objects. */
const EXPECTED: Record<string, { metamodels: string[]; models: Record<string, number> }> = {
    library: { metamodels: ['Library'], models: { 'sample-Library': 9 } },
    'families-persons': { metamodels: ['Families', 'Persons'], models: { 'sample-Families': 11, 'sample-Persons': 9 } },
    'state-machine': { metamodels: ['statemachine'], models: { 'sample-StateMachine': 10 } },
    graph: { metamodels: ['Graph'], models: { 'sample-Graph': 11 } },
    shapes: { metamodels: ['Shapes'], models: { 'sample-Shapes': 4 } },
    turnstile: { metamodels: ['DemoESM'], models: { demoESM: 10 } },
    'petri-producer-consumer': { metamodels: ['DemoPetri'], models: { demoNet: 13, producerConsumer: 19 } },
};
/** The tier of each entry, in catalog order: the order of the cards. */
const TIERS: Record<string, string> = {
    library: 'template', 'families-persons': 'template', 'state-machine': 'template', graph: 'template', shapes: 'template',
    turnstile: 'example', 'petri-producer-consumer': 'example',
};

/** The card fields of R-LIB-19 (P-2026-10-19-1615): the closed vocabularies the Templates page filters on, and the
 *  values ratified in R-LIB-20, concepts in catalog order. */
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const CONCEPTS = ['containment', 'inheritance', 'references', 'enumerations', 'validation', 'multiple-metamodels', 'simulation', 'code-generation'];
const CARDS: Record<string, { level: string; concepts: string[] }> = {
    library: { level: 'beginner', concepts: ['containment', 'inheritance', 'references'] },
    'families-persons': { level: 'intermediate', concepts: ['multiple-metamodels', 'containment', 'inheritance'] },
    'state-machine': { level: 'intermediate', concepts: ['enumerations', 'containment', 'validation'] },
    graph: { level: 'beginner', concepts: ['references', 'containment'] },
    shapes: { level: 'beginner', concepts: ['inheritance', 'containment'] },
    turnstile: { level: 'intermediate', concepts: ['code-generation', 'simulation'] },
    'petri-producer-consumer': { level: 'advanced', concepts: ['code-generation', 'references', 'simulation'] },
};

/** The hand-written viewpoints of each entry (R-LIB-9; the examples' since R-LIB-10, P-2026-10-19-0300), in order, the
 *  first active on open; each with the view kinds it holds, sorted, as `<metaclass>:<kind>`. */
const VIEWPOINTS: Record<string, Record<string, string[]>> = {
    library: { Library: ['Book:edge', 'Book:vertex', 'Library:vertex', 'LibraryItem:edge', 'Magazine:vertex', 'Member:vertex', 'Writer:vertex'] },
    'families-persons': {
        Families: ['Family:graphVertex', 'Member:edge', 'Member:edge', 'Member:edge', 'Member:edge', 'Member:vertex'],
        Persons: ['Female:vertex', 'Male:vertex'],
    },
    'state-machine': { StateMachine: ['State:edge', 'State:graphVertex', 'State:vertex', 'State:vertex', 'State:vertex', 'StateMachine:vertex', 'Transition:edge', 'Transition:edge'] },
    graph: { Graph: ['Edge:edge', 'Graph:vertex', 'Node:vertex'] },
    shapes: { Shapes: ['Canvas:graphVertex', 'Circle:vertex', 'Square:vertex'] },
    turnstile: { 'Turnstile statechart': ['Event:vertex', 'Initial:vertex', 'State:vertex', 'Terminal:vertex', 'Transition:edge', 'Transition:edge'] },
    'petri-producer-consumer': { 'Petri net': ['Arc:edge', 'Arc:edge', 'InhibitorArc:edge', 'Place:vertex', 'Transition:vertex'] },
};

const publicUrl = (file: string) => new URL(`../../../public/${file}`, import.meta.url);
/** The file of the entry's current version. */
const fileUrl = (id: string) => publicUrl(currentVersion(GALLERY.find(e => e.id === id)!)!.file);
const sha256 = (url: URL) => createHash('sha256').update(readFileSync(url)).digest('hex');

async function readProject(id: string): Promise<{ json: Record<string, any>; store: Record<string, any>; lookup: Lookup }> {
    const json = JSON.parse(readFileSync(fileUrl(id), 'utf8'));
    const store = JSON.parse(await lz.decompressFromUTF16(json.state));
    return { json, store, lookup: store.idlookup };
}

const ofClass = (lookup: Lookup, className: string) => Object.values(lookup).filter((d: any) => d?.className === className) as any[];

/** The objects whose father chain reaches the model `modelId`. */
function objectsOf(lookup: Lookup, modelId: string): any[] {
    return ofClass(lookup, 'DObject').filter(o => {
        let d = lookup[o.father];
        for (let i = 0; d && i < 60; i++) {
            if (d.id === modelId) return true;
            d = lookup[d.father];
        }
        return false;
    });
}

/** The values of the feature named `feature` (an attribute or a reference) of the object `o`. */
function valuesOf(lookup: Lookup, o: any, feature: string): unknown[] {
    const v = (o.features || []).map((id: string) => lookup[id]).find((d: any) => d && lookup[d.instanceof]?.name === feature);
    return v?.values ?? [];
}

const objectsOfType = (lookup: Lookup, modelId: string, className: string) =>
    objectsOf(lookup, modelId).filter(o => lookup[o.instanceof]?.name === className);

const modelNamed = (lookup: Lookup, name: string) => ofClass(lookup, 'DModel').find(m => !m.isMetamodel && m.name === name);

describe('the gallery of the catalog', () => {
    it('is catalog version 2 with five templates then two examples, in that order (mutant: a tier swapped or an entry moved)', () => {
        expect(catalog.version).toBe(2);
        expect(GALLERY.map(e => [e.id, e.tier])).toEqual(Object.entries(TIERS));
    });

    it('gives every entry a current version among its versions, each file under <id>/<n>.jjodel (mutant: a version without a file)', () => {
        for (const e of GALLERY) {
            expect(e.status, e.id).toBe('available');
            expect(currentVersion(e), e.id).toBeDefined();
            for (const v of e.versions!) {
                expect(v.file, e.id).toBe(`library/gallery/${e.id}/${v.n}.jjodel`);
                expect(v.published, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(existsSync(publicUrl(v.file)), v.file).toBe(true);
            }
        }
    });

    it('records the sha256 of every version\'s file (mutant: a published file rewritten, the catalog left as it was)', () => {
        for (const e of GALLERY) for (const v of e.versions!) expect(sha256(publicUrl(v.file)), `${e.id}@${v.n}`).toBe(v.sha256);
    });


    it('gives every entry a level and non-empty concepts of the closed vocabularies, no slug twice (mutant: a concept label written for its slug, a level misspelt)', () => {
        for (const e of GALLERY) {
            expect(LEVELS, `${e.id} level`).toContain(e.level);
            expect(e.concepts?.length, e.id).toBeGreaterThan(0);
            for (const c of e.concepts!) expect(CONCEPTS, `${e.id} concept`).toContain(c);
            expect(new Set(e.concepts).size, e.id).toBe(e.concepts!.length);
        }
    });

    it('carries the levels and concepts ratified in R-LIB-20 (mutant: families-persons tagged transformation, simulation dropped from an example)', () => {
        expect(Object.fromEntries(GALLERY.map(e => [e.id, { level: e.level, concepts: e.concepts }]))).toEqual(CARDS);
    });

    it('points every preview at <id>/<n>.preview.png of the current version (mutant: the package path, or a version other than the current)', () => {
        for (const e of GALLERY) expect(e.preview, e.id).toBe(`${e.id}/${e.version}.preview.png`);
    });

    it('gives the callout to StateMachine only, as a non-empty sentence, and writes no counts (mutant: a callout on every card, a count written by hand)', () => {
        expect(GALLERY.filter(e => e.callout !== undefined).map(e => e.id)).toEqual(['state-machine']);
        expect(GALLERY.find(e => e.id === 'state-machine')!.callout).toBe('Contains one validation error on purpose. Find it and fix it.');
        for (const e of GALLERY) for (const k of ['metamodels', 'models']) expect(Object.keys(e), e.id).not.toContain(k);
    });

    it('is served as the public copy the Templates page fetches, byte for byte (mutant: the docs catalog edited, not copied)', () => {
        const docs = readFileSync(new URL('../../../../docs/library/catalog.json', import.meta.url), 'utf8');
        const served = readFileSync(new URL('../../../public/library/catalog.json', import.meta.url), 'utf8');
        expect(served).toBe(docs);
    });
});

describe.each(GALLERY.map(e => [e.id, e] as const))('the project file of %s', (id, entry) => {
    it('is the export of one project named as the catalog label, with its store and its megamodel (mutant: a hand-written file)', async () => {
        const { json, store } = await readProject(id);
        expect(json.name).toBe(entry.label);
        expect(store.projects).toEqual([json.id]);
        expect(store.idlookup[json.id]).toMatchObject({ className: 'DProject', id: json.id });
        expect(json.megamodel?.megamodelVersion).toBe('1.0');
    });

    it('holds the metamodels and the models of its sources, and no other (mutant: the build reuses one context)', async () => {
        const { json, lookup } = await readProject(id);
        const project = lookup[json.id];
        const names = (ids: string[]) => ids.map(i => lookup[i]?.name);
        expect(names(project.metamodels)).toEqual(EXPECTED[id].metamodels);
        expect(names(project.models)).toEqual(Object.keys(EXPECTED[id].models));
        expect(ofClass(lookup, 'DModel').filter(m => m.isMetamodel).map(m => m.name).sort()).toEqual([...EXPECTED[id].metamodels].sort());
        expect(ofClass(lookup, 'DModel').filter(m => !m.isMetamodel).map(m => m.name).sort()).toEqual(Object.keys(EXPECTED[id].models).sort());
    });

    it('carries every object of each sample model (mutant: the export drops the objects of a model)', async () => {
        const { lookup } = await readProject(id);
        for (const [name, count] of Object.entries(EXPECTED[id].models)) {
            const m = modelNamed(lookup, name);
            expect(m, name).toBeDefined();
            expect(objectsOf(lookup, m.id).length, name).toBe(count);
            expect(m.instanceof, name).toBe(ofClass(lookup, 'DModel').find(x => x.isMetamodel && m.instanceof === x.id)?.id);
        }
    });

    it('has no id that is the prefix of another id followed by a digit (mutant: ids the import\'s text replacement would corrupt)', async () => {
        const { store } = await readProject(id);
        const ids = Object.keys(store.idlookup);
        const clashes = ids.filter(a => ids.some(b => b !== a && b.startsWith(a) && /^\d/.test(b.slice(a.length))));
        expect(clashes).toEqual([]);
    });
});

describe.each(GALLERY.map(e => [e.id] as const))('the viewpoints of %s', (id) => {
    /** The project's own viewpoints (not the built-in `Pointer_` ones), each with its views' `<metaclass>:<kind>`. */
    async function own() {
        const { json, store, lookup } = await readProject(id);
        const vps = (lookup[json.id].viewpoints || []).map((v: string) => lookup[v]).filter((v: any) => v && !/^Pointer_/.test(v.id));
        const views = (vp: any) => (store.viewelements || []).map((v: string) => lookup[v]).filter((v: any) => v?.viewpoint === vp.id && v.ir)
            .map((v: any) => `${v.ir.metaclasses?.[0]}:${v.ir.kind}`).sort();
        return { json, store, lookup, vps, views };
    }

    it('has one hand-written viewpoint per metamodel, named after it, with the expected view kinds (mutant: a viewpoint left Default, or derived)', async () => {
        const { vps, views } = await own();
        expect(Object.fromEntries(vps.map((v: any) => [v.name, views(v)]))).toEqual(VIEWPOINTS[id]);
        for (const v of vps) {
            expect(v._state?.derivedFrom, v.name).toBeUndefined();
            expect(views(v).length, v.name).toBeGreaterThan(0);
        }
    });

    it('opens on its first viewpoint: the record, the project and the root agree (mutant: the viewpoint built, not activated)', async () => {
        const { json, store, lookup, vps } = await own();
        const first = vps.find((v: any) => v.name === Object.keys(VIEWPOINTS[id])[0]);
        expect(first).toBeDefined();
        expect(json.activeViewpoint).toBe(first.id);
        expect(lookup[json.id].activeViewpoint).toBe(first.id);
        expect(store.viewpoint).toBe(first.id);
    });
});

/** The codegen example an example was built from: the file a student imports, which stays as it was. */
async function readCodegenExample(id: string): Promise<Lookup> {
    const json = JSON.parse(readFileSync(publicUrl(`examples/codegen/${id}.jjodel`), 'utf8'));
    return JSON.parse(await lz.decompressFromUTF16(json.state)).idlookup;
}

/** What a model generates: `main`, then every template that takes no argument, each with its errors. */
function generated(lookup: Lookup, modelId: string): { templates: string[]; out: Record<string, { code: string; errors: unknown[] }> } {
    const { templates } = readModelTemplates(lookup, modelId);
    const entries = ['main', ...templates.filter(t => t.params.length === 0 && t.name !== 'main').map(t => t.name)];
    const out = Object.fromEntries(entries.map(name => {
        const r = generate(recordOf(lookup, modelId), lookup, modelId, templates, name);
        return [name, { code: r.code, errors: r.errors.map((e: any) => e.message ?? e) }];
    }));
    return { templates: templates.map(t => `${t.name}(${t.params.join(',')}) ${t.body}`), out };
}

describe.each(EXAMPLES.map(e => [e.id] as const))('the example %s against its codegen example', (id) => {
    it('generates the same text from the same templates on every model, byte for byte (mutant: the build loses or edits a template, or the data)', async () => {
        const { lookup } = await readProject(id);
        const before = await readCodegenExample(id);
        const names = Object.keys(EXPECTED[id].models);
        for (const name of names) {
            const a = generated(before, modelNamed(before, name).id), b = generated(lookup, modelNamed(lookup, name).id);
            expect(b.templates.length, name).toBeGreaterThan(0);
            expect(b.templates, name).toEqual(a.templates);
            expect(b.out.main.code.length, name).toBeGreaterThan(0);
            expect(b.out, name).toEqual(a.out);
        }
    });

    it('keeps the stored scenarios of each model (mutant: the import drops `runScenarios`)', async () => {
        const { lookup } = await readProject(id);
        const before = await readCodegenExample(id);
        const shape = (lk: Lookup, name: string) => storedScenarios(lk, modelNamed(lk, name).id).map(s => ({ name: s.name, steps: s.steps.length }));
        for (const name of Object.keys(EXPECTED[id].models)) expect(shape(lookup, name), name).toEqual(shape(before, name));
    });

    it('keeps the Default viewpoint beside its own, and adds no other (mutant: the build replaces Default)', async () => {
        const { json, lookup } = await readProject(id);
        const vps = (lookup[json.id].viewpoints || []).map((v: string) => lookup[v]?.name);
        expect(vps).toEqual(['Default', ...Object.keys(VIEWPOINTS[id])]);
    });
});

describe('the references of the sample models', () => {
    it('Library: every book has its author, two items are borrowed (mutant: the XMI references are not resolved)', async () => {
        const { lookup } = await readProject('library');
        const m = modelNamed(lookup, 'sample-Library');
        const books = objectsOfType(lookup, m.id, 'Book');
        expect(books.length).toBe(3);
        expect(objectsOfType(lookup, m.id, 'Writer').length).toBe(2);
        for (const b of books) expect(valuesOf(lookup, b, 'authors').length).toBe(1);
        const borrowed = objectsOf(lookup, m.id).filter(o => valuesOf(lookup, o, 'borrowedBy').length === 1);
        expect(borrowed.length).toBe(2);
    });

    it('Graph: six edges, each with one source and one target (mutant: the fixture\'s two-target edge kept, which no arc can draw)', async () => {
        const { lookup } = await readProject('graph');
        const m = modelNamed(lookup, 'sample-Graph');
        const edges = objectsOfType(lookup, m.id, 'Edge');
        expect(edges.length).toBe(6);
        expect(objectsOfType(lookup, m.id, 'Node').length).toBe(4);
        for (const e of edges) {
            expect(valuesOf(lookup, e, 'source').length).toBe(1);
            expect(valuesOf(lookup, e, 'target').length).toBe(1);
        }
    });

    it('StateMachine: the deliberate Broken state is kept, with no kind (mutant: the fixture is made conformant)', async () => {
        const { lookup } = await readProject('state-machine');
        const m = modelNamed(lookup, 'sample-StateMachine');
        const broken = objectsOfType(lookup, m.id, 'State').filter(o => valuesOf(lookup, o, 'name')[0] === 'Broken');
        expect(broken.length).toBe(1);
        expect(valuesOf(lookup, broken[0], 'kind').filter(v => v !== undefined && v !== null && v !== '')).toEqual([]);
    });

    it('Shapes: at least one instance of each concrete class (mutant: xsi:type falls back to the abstract Shape)', async () => {
        const { lookup } = await readProject('shapes');
        const m = modelNamed(lookup, 'sample-Shapes');
        for (const c of ['Canvas', 'Circle', 'Square']) expect(objectsOfType(lookup, m.id, c).length, c).toBeGreaterThan(0);
    });
});

describe('a gallery reference', () => {
    it('splits <id>@<n> and <id> (mutant: the version read as part of the id, or a leading zero accepted)', () => {
        expect(parseGalleryRef('graph@1')).toEqual({ id: 'graph', n: 1 });
        expect(parseGalleryRef('petri-producer-consumer@12')).toEqual({ id: 'petri-producer-consumer', n: 12 });
        expect(parseGalleryRef('graph')).toEqual({ id: 'graph' });
        for (const bad of ['', 'graph@', 'graph@0', 'graph@01', 'graph@1.2', '@1', 'Graph', 'a--b', '-a', 'graph@1@2', 'graph@-1']) {
            expect(parseGalleryRef(bad), bad).toBeNull();
        }
    });

    it('resolves to the version it names, <id> to the current one, and to nothing for an unknown id or version (mutant: <id>@<n> falls back to the current)', () => {
        const entries = [{ id: 'x', version: 2, versions: [1, 2].map(n => ({ n, file: `library/gallery/x/${n}.jjodel`, published: '2026-10-18', sha256: '' })) }];
        expect(resolveGalleryRef(entries, 'x@1')?.version.n).toBe(1);
        expect(resolveGalleryRef(entries, 'x')?.version.n).toBe(2);
        expect(resolveGalleryRef(entries, 'x@3')).toBeNull();
        expect(resolveGalleryRef(entries, 'nope@9')).toBeNull();
        expect(resolveGalleryRef(GALLERY, 'graph@1')?.entry.id).toBe('graph');
    });
});
