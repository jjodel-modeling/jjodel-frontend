/**
 * The gallery projects of R-LIB-5 (slice S1, P-2026-10-18-1800): frontend/public/library/gallery/<id>.jjodel, the
 * project files the Templates page clones, written by the app's own importers and export
 * (scripts/library/build-gallery.ts).
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

import { existsSync, readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { describe, it, expect } from 'vitest';

type Lookup = Record<string, any>;

interface Entry { id: string; kind: string; label: string; status: string; package?: string }

const catalog = JSON.parse(readFileSync(new URL('../../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { entries: Entry[] };
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject');

/** What the build's sources hold: metamodel names, and each model with its number of objects. */
const EXPECTED: Record<string, { metamodels: string[]; models: Record<string, number> }> = {
    library: { metamodels: ['Library'], models: { 'sample-Library': 9 } },
    familiesPersons: { metamodels: ['Families', 'Persons'], models: { 'sample-Families': 11, 'sample-Persons': 9 } },
    stateMachineEcore: { metamodels: ['statemachine'], models: { 'sample-StateMachine': 10 } },
    graph: { metamodels: ['Graph'], models: { 'sample-Graph': 10 } },
    shapes: { metamodels: ['Shapes'], models: { 'sample-Shapes': 4 } },
};

const fileUrl = (id: string) => new URL(`../../../public/library/gallery/${id}.jjodel`, import.meta.url);

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
    it('has the five R-LIB-5 projects, each available with its package (mutant: an entry left planned or without a file)', () => {
        expect(GALLERY.map(e => e.id).sort()).toEqual(Object.keys(EXPECTED).sort());
        for (const e of GALLERY) {
            expect(e.status, e.id).toBe('available');
            expect(e.package, e.id).toBe(`library/gallery/${e.id}.jjodel`);
            expect(existsSync(fileUrl(e.id)), e.id).toBe(true);
        }
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

    it('adds no viewpoint of its own: the default syntax renders it (mutant: the build adds a viewpoint)', async () => {
        const { json, lookup } = await readProject(id);
        const own = (lookup[json.id].viewpoints || []).map((v: string) => lookup[v]).filter((v: any) => v && v.name !== 'Default' && !/^Pointer_/.test(v.id));
        expect(own.map((v: any) => v.name)).toEqual([]);
    });

    it('has no id that is the prefix of another id followed by a digit (mutant: ids the import\'s text replacement would corrupt)', async () => {
        const { store } = await readProject(id);
        const ids = Object.keys(store.idlookup);
        const clashes = ids.filter(a => ids.some(b => b !== a && b.startsWith(a) && /^\d/.test(b.slice(a.length))));
        expect(clashes).toEqual([]);
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

    it('Graph: five edges, each with its source, six targets in all (mutant: a multi-valued target loses an entry)', async () => {
        const { lookup } = await readProject('graph');
        const m = modelNamed(lookup, 'sample-Graph');
        const edges = objectsOfType(lookup, m.id, 'Edge');
        expect(edges.length).toBe(5);
        expect(objectsOfType(lookup, m.id, 'Node').length).toBe(4);
        for (const e of edges) expect(valuesOf(lookup, e, 'source').length).toBe(1);
        expect(edges.reduce((n, e) => n + valuesOf(lookup, e, 'target').length, 0)).toBe(6);
    });

    it('StateMachine: the deliberate Broken state is kept, with no kind (mutant: the fixture is made conformant)', async () => {
        const { lookup } = await readProject('stateMachineEcore');
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
