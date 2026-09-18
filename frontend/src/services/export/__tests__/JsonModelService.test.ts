import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LModel } from '../../../joiner';
import { JsonModelService } from '../JsonModelService';

const fixture = vi.hoisted(() => ({
    state: { idlookup: {} as Record<string, any>, version: { n: '3.0' } },
    proxies: new Map<string, any>(),
}));

vi.mock('../../../joiner', () => ({
    store: { getState: () => fixture.state },
    LPointerTargetable: { fromD: (raw: { id: string }) => fixture.proxies.get(raw.id) },
}));

function metamodel(id: string) {
    const pkg = { name: id, __raw: { uri: `urn:${id}` }, classes: [] as any[] };
    const mm = { id, name: id, packages: [pkg] };
    const cls = { id: `${id}-class`, name: `${id}Class`, model: mm, package: pkg };
    pkg.classes.push(cls);
    return { mm, cls };
}

function model(id: string, mm: ReturnType<typeof metamodel>['mm']) {
    return { id, name: id, instanceof: mm, objects: [] as any[] };
}

function object(id: string, owner: ReturnType<typeof model>, cls: any, root = true) {
    const obj = { id, name: id, className: 'DObject', model: owner, instanceof: cls, features: [] as any[] };
    fixture.state.idlookup[id] = { id, className: 'DObject' };
    fixture.proxies.set(id, obj);
    if (root) owner.objects.push(obj);
    return obj;
}

function reference(obj: ReturnType<typeof object>, name: string, targets: string[], composition = false) {
    obj.features.push({
        instanceof: { name, className: 'DReference', composition },
        __raw: { values: targets },
        get values(): never { throw new Error('The exporter must read raw values'); },
    });
}

function exported(m: ReturnType<typeof model>): any {
    return JSON.parse(JsonModelService.exportModelToJSON(m as unknown as LModel));
}

function objectDefinitions(doc: any): any[] {
    const definitions: any[] = [];
    const visit = (obj: any) => {
        if (obj.id) definitions.push(obj);
        for (const children of Object.values(obj.children || {})) {
            (children as any[]).forEach(visit);
        }
    };
    [...doc.objects, ...(doc.externalObjects || [])].forEach(visit);
    return definitions;
}

function expectResolvedOnce(doc: any, ids: string[]) {
    const definitions = objectDefinitions(doc);
    expect(definitions.map(obj => obj.id).sort()).toEqual([...ids].sort());
    const visit = (value: any) => {
        if (!value || typeof value !== 'object') return;
        if (value.$ref) expect(definitions.filter(obj => obj.id === value.$ref)).toHaveLength(1);
        Object.values(value).forEach(visit);
    };
    visit(doc);
}

describe('JsonModelService M1 reference closure (#128)', () => {
    beforeEach(() => {
        fixture.state.idlookup = {};
        fixture.proxies.clear();
    });

    afterEach(() => vi.unstubAllGlobals());

    function setup() {
        const { mm, cls } = metamodel('Library');
        const local = model('Local', mm);
        const foreign = model('Foreign', mm);
        const book = object('book', local, cls);
        const author = object('author', foreign, cls);
        return { mm, cls, local, foreign, book, author };
    }

    it('embeds an externally referenced object with its values, without unrelated objects', () => {
        const { cls, local, foreign, book, author } = setup();
        reference(book, 'author', [author.id]);
        author.features.push({ instanceof: { name: 'age', className: 'DAttribute' }, __raw: { values: [42] } });
        object('unrelated', foreign, cls);

        const doc = exported(local);
        expect(doc.objects.map((obj: any) => obj.id)).toEqual(['book']);
        expect(doc.objects[0].references.author).toEqual([{ $ref: 'author' }]);
        expect(doc.externalObjects).toEqual([expect.objectContaining({ id: 'author', attributes: { age: 42 } })]);
        expectResolvedOnce(doc, ['book', 'author']);
    });

    it('follows transitive references across models and terminates cycles and self-references', () => {
        const { mm, cls, local, book, author } = setup();
        const third = object('third', model('Third', mm), cls);
        reference(book, 'author', [author.id, author.id]);
        reference(author, 'next', [third.id, author.id]);
        reference(third, 'back', [book.id, author.id]);

        const doc = exported(local);
        expect(doc.externalObjects.map((obj: any) => obj.id)).toEqual(['author', 'third']);
        expect(doc.externalObjects[1].references.back).toEqual([{ $ref: 'book' }, { $ref: 'author' }]);
        expectResolvedOnce(doc, ['book', 'author', 'third']);
    });

    it('finds external references from nested local children without duplicating local targets', () => {
        const { cls, local, book, author } = setup();
        const chapter = object('chapter', local, cls, false);
        reference(book, 'chapters', [chapter.id], true);
        reference(book, 'selected', [chapter.id]);
        reference(chapter, 'author', [author.id]);
        reference(author, 'chapter', [chapter.id]);

        const doc = exported(local);
        expect(doc.objects[0].children.chapters[0].id).toBe('chapter');
        expect(doc.externalObjects.map((obj: any) => obj.id)).toEqual(['author']);
        expectResolvedOnce(doc, ['book', 'chapter', 'author']);
    });

    it.each([true, false])('nests external children once regardless of reference order (child first: %s)', childFirst => {
        const { cls, local, foreign, book, author } = setup();
        const address = object('address', foreign, cls, false);
        reference(author, 'address', [address.id], true);
        reference(book, 'targets', childFirst ? [address.id, author.id] : [author.id, address.id]);

        const doc = exported(local);
        expect(doc.externalObjects.map((obj: any) => obj.id)).toEqual(['author']);
        expect(doc.externalObjects[0].children.address[0].id).toBe('address');
        expectResolvedOnce(doc, ['book', 'author', 'address']);
    });

    it('embeds a referenced contained object without exporting its unreachable owner', () => {
        const { cls, local, foreign, book, author } = setup();
        const address = object('address', foreign, cls, false);
        reference(author, 'address', [address.id], true);
        reference(book, 'address', [address.id]);

        const doc = exported(local);
        expect(doc.externalObjects.map((obj: any) => obj.id)).toEqual(['address']);
        expectResolvedOnce(doc, ['book', 'address']);
    });

    it('embeds the actual foreign class metamodel and its transitive metamodel dependencies', () => {
        const { local, book, author } = setup();
        const people = metamodel('People');
        const base = metamodel('Base');
        (people.cls as any).extends = [base.cls];
        author.instanceof = people.cls;
        reference(book, 'author', [author.id]);

        const doc = exported(local);
        expect(doc.externalObjects[0].class.metamodel.id).toBe('People');
        expect(doc.externalMetamodels.map((mm: any) => mm.id)).toEqual(['People', 'Base']);
        expect(doc.externalMetamodels[0].packages[0].classes[0].name).toBe('PeopleClass');
        expectResolvedOnce(doc, ['book', 'author']);
    });

    it('preserves local-only exports, containment, primitive attributes and enum literals', () => {
        const { cls, local, book } = setup();
        const chapter = object('chapter', local, cls);
        reference(book, 'chapters', [chapter.id], true);
        reference(chapter, 'book', [book.id]);
        fixture.state.idlookup.genre = { id: 'genre', className: 'DEnumLiteral', name: 'FICTION' };
        for (const [name, values] of Object.entries({ title: ['author'], genre: ['genre'], tags: ['one', 'two'], count: [0], active: [false] })) {
            book.features.push({ instanceof: { name, className: 'DAttribute' }, __raw: { values } });
        }

        const doc = exported(local);
        expect(doc).not.toHaveProperty('externalObjects');
        expect(doc).not.toHaveProperty('externalMetamodels');
        expect(doc.objects).toHaveLength(1);
        expect(doc.objects[0].attributes).toEqual({ title: 'author', genre: 'FICTION', tags: ['one', 'two'], count: 0, active: false });
        expect(doc.objects[0].children.chapters[0].id).toBe('chapter');
        expectResolvedOnce(doc, ['book', 'chapter']);
    });

    it('deduplicates by id while preserving distinct objects with the same name', () => {
        const { cls, local, foreign, book, author } = setup();
        const other = object('other-author', foreign, cls);
        other.name = author.name;
        reference(book, 'authors', [author.id, other.id, author.id]);
        expectResolvedOnce(exported(local), ['book', 'author', 'other-author']);
    });

    it('retains unresolved references without inventing definitions for stale or non-object ids', () => {
        const { local, book, author } = setup();
        fixture.state.idlookup.feature = { id: 'feature', className: 'DReference' };
        reference(book, 'targets', ['missing', 'feature', author.id]);

        const doc = exported(local);
        expect(doc.objects[0].references.targets).toEqual([{ $ref: 'missing' }, { $ref: 'feature' }, { $ref: 'author' }]);
        expect(objectDefinitions(doc).map(obj => obj.id)).toEqual(['book', 'author']);
    });

    it('guards repeated containment and a containment cycle in the reachable graph', () => {
        const { local, book, author } = setup();
        reference(book, 'author', [author.id]);
        reference(author, 'self', [author.id, author.id], true);

        const doc = exported(local);
        expect(doc.externalObjects[0].children.self).toEqual([{ $ref: 'author' }, { $ref: 'author' }]);
        expectResolvedOnce(doc, ['book', 'author']);
    });

    it('preserves external object identities in light documents and resets traversal on every export', () => {
        const { local, book, author } = setup();
        reference(book, 'author', [author.id]);
        const light = JsonModelService.buildModelDocumentLight(local as unknown as LModel);
        expectResolvedOnce(light, ['book', 'author']);
        expect(light).not.toHaveProperty('formatVersion');
        expectResolvedOnce(exported(local), ['book', 'author']);

        book.features = [];
        const subsequent = exported(local);
        expect(subsequent).not.toHaveProperty('externalObjects');
        expectResolvedOnce(subsequent, ['book']);
    });

    it('handles an empty model and still rejects a model without a metamodel', () => {
        const { local } = setup();
        local.objects = [];
        expect(exported(local).objects).toEqual([]);
        expect(exported(local)).not.toHaveProperty('externalObjects');
        expect(() => JsonModelService.buildModelDocument({ id: 'invalid' } as LModel))
            .toThrow('Model has no metamodel reference (instanceof)');
    });

    it('downloads a self-contained JSON document through the public file-export entry point', async () => {
        const { local, book, author } = setup();
        reference(book, 'author', [author.id]);
        const link = { href: '', download: '', click: vi.fn() };
        const createObjectURL = vi.fn(() => 'blob:export');
        const revokeObjectURL = vi.fn();
        vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
        vi.stubGlobal('document', {
            createElement: vi.fn(() => link),
            body: { appendChild: vi.fn(), removeChild: vi.fn() },
        });

        JsonModelService.exportToFile(local as unknown as LModel, 'model');
        const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
        expect(blob.type).toBe('application/json');
        expectResolvedOnce(JSON.parse(await blob.text()), ['book', 'author']);
        expect(link.download).toBe('Local.json');
        expect(link.click).toHaveBeenCalledOnce();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
    });
});
