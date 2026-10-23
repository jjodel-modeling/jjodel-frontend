import { describe, expect, it } from 'vitest';
import { applyDrafts, changedOutside, editDraft, followStore, isDirty, shownDraft } from '../templateDrafts';
import type { Drafts } from '../templateDrafts';
import type { TemplateRecord } from '../../engine/templates';

const main: TemplateRecord = { name: 'main', params: [], body: '"${cls(self)}"' };
const cls: TemplateRecord = { name: 'cls', params: ['c'], body: '"class ${c.name}"', target: 'ts' };
const stored = [main, cls];

describe('templateDrafts: dirty, clean and outside writes (R-GEN-22)', () => {
    it('an edit makes a draft; an edit back to the base drops it (mutant: clean drafts kept)', () => {
        const d1 = editDraft({}, cls, { body: '"x"' });
        expect(Object.keys(d1)).toEqual(['cls']);
        expect(isDirty(d1.cls)).toBe(true);
        expect(editDraft(d1, cls, { body: cls.body })).toEqual({});
    });

    it('parameters compare as a list, not as typed', () => {
        expect(editDraft({}, cls, { params: ' c ,' })).toEqual({});
        expect(Object.keys(editDraft({}, cls, { params: 'c, d' }))).toEqual(['cls']);
    });

    it('a template with no draft shows the stored record, so it follows an outside write', () => {
        const undone: TemplateRecord = { ...cls, body: '"older"' };
        expect(shownDraft({}, undone).body).toBe('"older"');
    });

    it('a dirty draft stays under an outside write and is marked; it is dropped when the store holds it (mutant: drafts never dropped)', () => {
        const drafts = editDraft({}, cls, { body: '"mine"' });
        const outside = [main, { ...cls, body: '"theirs"' }];
        expect(followStore(drafts, outside)).toBe(drafts);
        expect(changedOutside(drafts.cls, outside)).toBe(true);
        expect(changedOutside(drafts.cls, stored)).toBe(false);
        expect(followStore(drafts, [main, { ...cls, body: '"mine"' }])).toEqual({});
    });

    it('applyDrafts keeps the stored order and the target, renames in place (mutant: drafts appended)', () => {
        let drafts: Drafts = editDraft({}, cls, { name: 'klass ', body: '"k"' });
        drafts = editDraft(drafts, main, { body: '"${klass(self)}"' });
        const { next, problems } = applyDrafts(stored, drafts);
        expect(problems).toEqual({});
        expect(next).toEqual([
            { name: 'main', params: [], body: '"${klass(self)}"' },
            { name: 'klass', params: ['c'], body: '"k"', target: 'ts' },
        ]);
    });

    it('a draft whose template is gone is saved again at the end', () => {
        const drafts = editDraft({}, cls, { body: '"kept"' });
        expect(applyDrafts([main], drafts).next.map(t => t.name)).toEqual(['main', 'cls']);
    });

    it('an empty name, or one another template holds, refuses the save', () => {
        expect(applyDrafts(stored, editDraft({}, cls, { name: ' ' })).problems).toEqual({ cls: 'A template needs a name.' });
        expect(applyDrafts(stored, editDraft({}, cls, { name: 'main' })).problems).toEqual({ cls: 'The name main is taken by another template.' });
        // A swap of two names in one save is no clash.
        let swap: Drafts = editDraft({}, cls, { name: 'main' });
        swap = editDraft(swap, main, { name: 'cls' });
        expect(applyDrafts(stored, swap).problems).toEqual({});
    });
});
