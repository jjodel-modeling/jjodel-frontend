/**
 * templatePreview — the list the Template Editor's preview generates from, its entry, and the markers of its errors
 * (slice S3, P-2026-10-23-2225). The markers are taken from a real `generate` over the synthetic record of
 * origin.test.ts (`buildEvalContext` does not import under the node bench). Mutations each test kills are in its
 * name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { previewEntry, previewMarkers, previewTemplates } from '../templatePreview';
import { editDraft } from '../templateDrafts';
import { templateMarkers } from '../templateMarkers';
import { generate } from '../../engine/generate';
import type { Drafts } from '../templateDrafts';
import type { TemplateRecord } from '../../engine/templates';

const main: TemplateRecord = { name: 'main', params: [], body: 'stored ${row()}', mode: 'text' };
const row: TemplateRecord = { name: 'row', params: [], body: '"r"' };
const stored = [main, row];

function fixture() {
    const lookup: Record<string, any> = {
        MM: { className: 'DModel', id: 'MM', name: 'mm' },
        M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' },
        s2: { className: 'DObject', id: 's2', name: 's2', father: 'M', features: ['v_s2_title'] },
        v_s2_title: { className: 'DValue', id: 'v_s2_title', instanceof: 'A_title', values: ['unlocked'], father: 's2' },
        A_title: { className: 'DAttribute', id: 'A_title', name: 'title' },
    };
    const s = { id: 's2', __type: 'Object', name: 's2', title: 'unlocked' };
    return { lookup, globals: { instances: [s], s, n: null } as Record<string, any> };
}

const gen = (templates: readonly TemplateRecord[], entry: string) => {
    const { lookup, globals } = fixture();
    return generate(globals, lookup, 'M', templates, entry);
};

describe('previewTemplates', () => {
    it('a draft wins over the stored body (kills: the stored body used instead of the draft)', () => {
        const drafts = editDraft({}, main, { body: 'draft ${row()}' });
        const list = previewTemplates(stored, drafts);
        expect(list.find(t => t.name === 'main')?.body).toBe('draft ${row()}');
        expect(gen(list, 'main').code).toBe('draft r');
    });

    it('no draft: the stored list as it is, in its order (kills: stored templates dropped or reordered)', () => {
        expect(previewTemplates(stored, {})).toEqual(stored);
    });

    it('a renamed draft generates under its new name (kills: the draft keyed by its base name in the list)', () => {
        const drafts = editDraft({}, row, { name: ' line ' });
        expect(previewTemplates(stored, drafts).map(t => t.name)).toEqual(['main', 'line']);
    });

    it('a deleted template is gone, and a dropped draft gives the stored body back (kills: deleted template kept; dropped draft still applied)', () => {
        const drafts = editDraft({}, row, { body: '"x"' });
        const { row: _gone, ...none }: Drafts = drafts;
        expect(previewTemplates([main], none).map(t => t.name)).toEqual(['main']);
        expect(previewTemplates(stored, none).find(t => t.name === 'row')?.body).toBe('"r"');
    });

    it('the mode travels with the body (kills: the stored mode kept under a converted body)', () => {
        const drafts = editDraft({}, row, { body: 'r ${s.title}', mode: 'text' });
        const list = previewTemplates(stored, drafts);
        expect(list.find(t => t.name === 'row')?.mode).toBe('text');
        expect(gen(list, 'row').code).toBe('r unlocked');
    });

    it('a draft whose template the store no longer holds is still generated, as Save would write it (kills: orphan drafts dropped)', () => {
        const drafts = editDraft({}, row, { body: '"y"' });
        expect(previewTemplates([main], drafts).map(t => [t.name, t.body])).toEqual([['main', main.body], ['row', '"y"']]);
    });
});

describe('previewEntry', () => {
    it('`main` when present, over the edited template (kills: edited preferred to main)', () => {
        expect(previewEntry(stored, null, 'row')).toBe('main');
    });

    it('the edited template when there is no `main` (kills: the first template instead of the edited one)', () => {
        const list = [row, { name: 'other', params: [], body: '"o"' }];
        expect(previewEntry(list, null, 'other')).toBe('other');
    });

    it('the chosen entry while listed, the default once it is gone (kills: chosen ignored; a gone choice kept)', () => {
        expect(previewEntry(stored, 'row', 'main')).toBe('row');
        expect(previewEntry(stored, 'gone', 'row')).toBe('main');
    });

    it('none on an empty list (kills: a name returned for no template)', () => {
        expect(previewEntry([], null, null)).toBeNull();
    });
});

describe('previewMarkers', () => {
    it('a navigation on null in the edited template is marked at its hole (kills: column of the body; line off by one)', () => {
        const edited: TemplateRecord = { name: 'main', params: [], body: 'a\n  ${s.missing.title} b', mode: 'text' };
        const result = gen([edited], 'main');
        expect(result.errors.length).toBe(1);
        const markers = previewMarkers(result.errors, 'main', templateMarkers(edited.body, 'text'));
        expect(markers).toEqual([{ startLineNumber: 2, startColumn: 5, endLineNumber: 2, endColumn: 6, message: result.errors[0].message }]);
    });

    it('errors of another template are not marked (kills: every error marked)', () => {
        const broken: TemplateRecord = { name: 'row', params: [], body: '${s.missing.title}', mode: 'text' };
        const result = gen([{ name: 'main', params: [], body: '${row()}', mode: 'text' }, broken], 'main');
        expect(result.errors.some(e => e.template === 'row')).toBe(true);
        expect(previewMarkers(result.errors, 'main', [])).toEqual([]);
        expect(previewMarkers(result.errors, 'row', []).length).toBe(1);
    });

    it('an error a parse marker already holds is not marked twice (kills: parse problems duplicated under codegen-gen)', () => {
        const edited: TemplateRecord = { name: 'main', params: [], body: 'a ${s.title +} b', mode: 'text' };
        const result = gen([edited], 'main');
        const parsed = templateMarkers(edited.body, 'text');
        expect(parsed.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.template === 'main')).toBe(true);
        expect(previewMarkers(result.errors, 'main', parsed)).toEqual([]);
    });

    it('a budget stop is its one error, marked where it tripped (kills: the stop dropped)', () => {
        const edited: TemplateRecord = { name: 'main', params: [], body: '${[1,2,3].map(x => s.title).join("")}', mode: 'text' };
        const { lookup, globals } = fixture();
        const result = generate(globals, lookup, 'M', [edited], 'main', [], { maxChars: 4 });
        expect(result.code).toBe('');
        expect(result.errors.length).toBe(1);
        expect(previewMarkers(result.errors, 'main', templateMarkers(edited.body, 'text')).length).toBe(1);
    });

    it('no edited template, no marker (kills: every error marked)', () => {
        const result = gen([{ name: 'main', params: [], body: 's.missing.title' }], 'main');
        expect(previewMarkers(result.errors, null, [])).toEqual([]);
    });
});
