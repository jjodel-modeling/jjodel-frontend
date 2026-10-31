/**
 * Generators panel export anomalies (P-2026-10-31-1342; discovery_2026-10-31_generators_export_and_import_anomalies):
 * the root and the files follow the templates on a Save (point 1), a new template's name counts a renamed draft once
 * (point 2), Export with drafts asks first, and the right pane is off once the metamodel or the generator is gone
 * (point 4). Executes the pure rules the generator tab calls, in the tab's order; the tab itself does not import in the
 * bench (monaco). Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import {
    exportDraftsQuestion, freshTemplateName, goneGeneratorLabel, previewOffReason, retargetGenerator, saveGeneratorTemplates,
} from '../generatorTabs';
import { applyDrafts, editDraft, savedNames } from '../templateDrafts';
import type { Drafts } from '../templateDrafts';
import { addGenerator, decodeGenerators, GEN_GENERATORS_KEY, generatorsPatch } from '../../engine/generatorCodec';
import type { GeneratorRecord } from '../../engine/generatorCodec';
import { encodeTemplates, GEN_TEMPLATES_KEY } from '../../engine/templateCodec';
import { decodeGeneratorFile, encodeGeneratorFile, generatorDocument } from '../../engine/generatorFile';
import type { TemplateRecord } from '../../engine/templates';

const t = (name: string, body = ''): TemplateRecord => ({ name, params: [], body, mode: 'text' });

/** A metamodel's two keys, written as the `state` setter writes a patch. */
class Bag {
    rawT: string | undefined;
    rawG: string | undefined;
    constructor(rawT?: string, rawG?: string) { this.rawT = rawT; this.rawG = rawG; }
    apply(patch: Record<string, string> | null): void {
        if (!patch) return;
        if (patch[GEN_TEMPLATES_KEY] !== undefined) this.rawT = patch[GEN_TEMPLATES_KEY];
        if (patch[GEN_GENERATORS_KEY] !== undefined) this.rawG = patch[GEN_GENERATORS_KEY];
    }
    get generators(): GeneratorRecord[] { return decodeGenerators(this.rawT, this.rawG).generators; }
    get(id: string): GeneratorRecord { return this.generators.find(g => g.id === id)!; }
    save(id: string, next: readonly TemplateRecord[], renames?: Readonly<Record<string, string>>): void {
        this.apply(saveGeneratorTemplates(this.rawT, this.rawG, this.generators, id, next, renames));
    }
}

/** A new generator `g1` on a metamodel with no key, as `createGenerator` (TemplateEditorTab.tsx) makes it. */
function newGenerator(): Bag {
    const bag = new Bag();
    bag.apply(generatorsPatch(bag.rawT, bag.rawG, addGenerator(bag.generators, 'generator1')));
    return bag;
}

/** Ten «New template» presses, each new template renamed and given a body as a draft, as the tab does. */
function tenNewWithDrafts(bag: Bag, names: readonly string[]): Drafts {
    let drafts: Drafts = {};
    for (const n of names) {
        const templates = bag.get('g1').templates;
        const name = freshTemplateName(templates.map(x => x.name), drafts);
        bag.save('g1', [...templates, t(name)]);
        const record = bag.get('g1').templates.find(x => x.name === name)!;
        drafts = editDraft(drafts, record, { name: n, body: `body of ${n}` });
    }
    return drafts;
}

const NAMES = ['main', 'cls', 'attr', 'ref', 'temporal', 'op', 'pkg', 'enumx', 'lit', 'footer'];

describe('point 2: the name of a new template', () => {
    it('ten New with a renamed draft each give template1..template10 with no gap (kills: a renamed draft counted twice)', () => {
        const bag = newGenerator();
        tenNewWithDrafts(bag, NAMES);
        expect(bag.get('g1').templates.map(x => x.name)).toEqual(Array.from({ length: 10 }, (_, i) => `template${i + 1}`));
    });

    it('a name a draft gives, or a template holds, is skipped (kills: the taken names ignored)', () => {
        expect(freshTemplateName(['template1'], { template1: { name: 'template2' } })).toBe('template3');
        expect(freshTemplateName(['a', 'template3'], {})).toBe('template4');
    });

    it('a draft whose template is gone is listed and counts (kills: only the stored names counted)', () => {
        expect(freshTemplateName(['a'], { b: { name: 'b' } })).toBe('template3');
    });
});

describe('point 1: the root and the files follow the templates', () => {
    it('Save of the renaming drafts gives an entry equal to the file entry, and the file imports back (kills: no retarget on Save)', () => {
        const bag = newGenerator();
        const drafts = tenNewWithDrafts(bag, NAMES);
        const applied = applyDrafts(bag.get('g1').templates, drafts);
        expect(applied.problems).toEqual({});
        bag.save('g1', applied.next, savedNames(drafts));
        const doc = generatorDocument('MM', bag.get('g1'));
        expect(doc.templates.map(x => x.name)).toEqual(NAMES);
        expect(doc.entry).toBe('main');
        expect(doc.files).toEqual([{ path: 'generator1.txt', entry: 'main' }]);
        const back = decodeGeneratorFile(encodeGeneratorFile(doc));
        expect(back.problems.filter(p => p.severity === 'error')).toEqual([]);
    });

    it('the first template of a new generator becomes its root and its file entry (kills: a file entry naming no template kept)', () => {
        const bag = newGenerator();
        bag.save('g1', [t('template1')]);
        const g = bag.get('g1');
        expect(g.root).toBe('template1');
        expect(g.files).toEqual([{ path: 'generator1.txt', entry: 'template1' }]);
        expect(JSON.parse(bag.rawG!).generators[1].files[0].entry).toBe('template1');
    });

    it('a rename of the root moves its file entry, and another file keeps its own entry (kills: every file entry set to the root)', () => {
        const g: GeneratorRecord = { id: 'g1', name: 'G', root: 'a', files: [{ path: 'G.txt', entry: 'a' }, { path: 'H.txt', entry: 'b' }], target: 'none', templates: [t('a'), t('b')] };
        const r = retargetGenerator(g, [t('x'), t('b')], { a: 'x', b: 'b' });
        expect(r.root).toBe('x');
        expect(r.files).toEqual([{ path: 'G.txt', entry: 'x' }, { path: 'H.txt', entry: 'b' }]);
    });

    it('a Save passes the renames on, where the fallback root would differ (kills: the Save drops the renames)', () => {
        const bag = newGenerator();
        bag.save('g1', [t('a'), t('b'), t('main')]);
        bag.apply({ [GEN_GENERATORS_KEY]: bag.rawG!.replace('"root":"main"', '"root":"b"').replace('"entry":"main"', '"entry":"b"') });
        expect(bag.get('g1').root).toBe('b');
        bag.save('g1', [t('a'), t('x'), t('main')], { a: 'a', b: 'x', main: 'main' });
        expect(bag.get('g1').root).toBe('x');
        expect(bag.get('g1').files[0].entry).toBe('x');
    });

    it('a swap of two names follows the templates, not the names (kills: follow ignores renames)', () => {
        const g: GeneratorRecord = { id: 'g1', name: 'G', root: 'a', files: [{ path: 'G.txt', entry: 'b' }], target: 'none', templates: [t('a'), t('b')] };
        const r = retargetGenerator(g, [t('b'), t('a')], { a: 'b', b: 'a' });
        expect(r.root).toBe('b');
        expect(r.files[0].entry).toBe('a');
    });

    it('Delete of the root template gives the fallback root, and its file the new root (kills: a dangling root kept)', () => {
        const bag = newGenerator();
        bag.save('g1', [t('main'), t('cls'), t('other')]);
        expect(bag.get('g1').root).toBe('main');
        bag.save('g1', [t('cls'), t('other')]);
        const g = bag.get('g1');
        expect(g.root).toBe('cls');
        expect(g.files).toEqual([{ path: 'generator1.txt', entry: 'cls' }]);
    });

    it('a list emptied keeps root and files as they are (kills: an empty list rewrites the metadata)', () => {
        const g: GeneratorRecord = { id: 'g1', name: 'G', root: 'a', files: [{ path: 'G.txt', entry: 'a' }], target: 'none', templates: [t('a')] };
        const r = retargetGenerator(g, []);
        expect(r.root).toBe('a');
        expect(r.files).toEqual([{ path: 'G.txt', entry: 'a' }]);
        expect(r.templates).toEqual([]);
    });

    it('a root named like an Object.prototype member stays the root (kills: renames read through the prototype)', () => {
        const g: GeneratorRecord = { id: 'g1', name: 'G', root: 'toString', files: [{ path: 'G.txt', entry: 'toString' }], target: 'none', templates: [t('main'), t('toString')] };
        const r = retargetGenerator(g, [t('main'), t('toString'), t('c')], {});
        expect(r.root).toBe('toString');
        expect(r.files[0].entry).toBe('toString');
    });

    it('a 3.2 default with no genGenerators writes genTemplates only on a rename (kills: the derived default retargeted)', () => {
        const rawT = encodeTemplates([t('a', '"A"'), t('b', '"B"')]);
        const bag = new Bag(rawT, undefined);
        bag.save('default', [t('main', '"A"'), t('b', '"B"')], { a: 'main', b: 'b' });
        expect(bag.rawG).toBeUndefined();
        expect(bag.get('default').root).toBe('main');
    });

    it('a default whose metadata is stored follows a rename of its root (kills: the default never retargeted)', () => {
        const rawT = encodeTemplates([t('a', '"A"'), t('b', '"B"')]);
        const bag = new Bag(rawT, undefined);
        // «New generator» writes genGenerators: the default's resolved root `a` is stored from then on.
        bag.apply({ [GEN_GENERATORS_KEY]: JSON.stringify({ v: 1, generators: [{ id: 'default', name: 'Default', root: 'a', files: [{ path: 'main.js', entry: 'a' }], target: 'js' }] }) });
        bag.save('default', [t('main', '"A"'), t('b', '"B"')], { a: 'main', b: 'b' });
        const d = bag.get('default');
        expect(d.root).toBe('main');
        expect(d.files).toEqual([{ path: 'main.js', entry: 'main' }]);
    });
});

describe('Export with unsaved drafts', () => {
    it('asks only while a draft is unsaved, and says the saved list is exported (kills: never asked, always asked)', () => {
        expect(exportDraftsQuestion(0)).toBeNull();
        expect(exportDraftsQuestion(1)).toBe('1 template has unsaved changes. The export holds the saved templates only.');
        expect(exportDraftsQuestion(3)).toBe('3 templates have unsaved changes. The export holds the saved templates only.');
    });
});

describe('point 4: a gone metamodel or generator', () => {
    it('the default of a gone metamodel still decodes, and the pane is off with the metamodel reason (kills: the generator checked first)', () => {
        const stillDecoded = decodeGenerators(undefined, undefined).generators[0];
        expect(previewOffReason(false, stillDecoded)).toBe('This metamodel is gone: nothing is generated.');
        expect(previewOffReason(false, null)).toBe('This metamodel is gone: nothing is generated.');
    });

    it('a gone generator of a live metamodel turns the pane off, a live one keeps it (kills: always off, never off)', () => {
        expect(previewOffReason(true, null)).toBe('This generator is gone: nothing is generated.');
        expect(previewOffReason(true, { id: 'g1' })).toBeNull();
    });

    it('the selector shows the last known name, the id only when none is known (kills: the id always shown)', () => {
        expect(goneGeneratorLabel('g1', 'SMV')).toBe('SMV (gone)');
        expect(goneGeneratorLabel('g1', null)).toBe('g1 (gone)');
    });
});
