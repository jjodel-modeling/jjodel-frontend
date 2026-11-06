/**
 * templateDrafts with typed templates (P-2026-10-31-1410): drafts keyed by `templateKey`, so two templates of one name
 * and different types are edited, saved and told apart; an untyped template keeps its name as key. Mutations each test
 * kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { applyDrafts, draftOf, editDraft, followStore, isDirty, recordOf, shownDraft } from '../templateDrafts';
import type { TemplateRecord } from '../../engine/templates';

const REF: TemplateRecord = { name: 'expr', params: ['e'], paramType: 'Ref', body: 'R', mode: 'text' };
const CONJ: TemplateRecord = { name: 'expr', params: ['e'], paramType: 'Conj', body: 'C', mode: 'text' };
const ANY: TemplateRecord = { name: 'expr', params: ['e'], body: 'any', mode: 'text' };

describe('drafts of typed templates', () => {
    it('two templates of one name keep two drafts, each under its key (kills: drafts keyed by name)', () => {
        let drafts = editDraft({}, REF, { body: 'R2' });
        drafts = editDraft(drafts, CONJ, { body: 'C2' });
        expect(Object.keys(drafts)).toEqual(['expr:Ref', 'expr:Conj']);
        expect(shownDraft(drafts, CONJ).body).toBe('C2');
        expect(shownDraft(drafts, ANY).body).toBe('any');
        const { next, problems } = applyDrafts([REF, CONJ, ANY], drafts);
        expect(problems).toEqual({});
        expect(next.map(t => t.body)).toEqual(['R2', 'C2', 'any']);
    });

    it('the type is a draft edit: setting it dirties, clearing it back drops the draft, and recordOf carries it (kills: paramType outside the draft)', () => {
        const typed = editDraft({}, ANY, { paramType: 'Ref' });
        expect(isDirty(typed.expr)).toBe(true);
        expect(recordOf(typed.expr).paramType).toBe('Ref');
        expect(editDraft(typed, ANY, { paramType: '' })).toEqual({});
        expect('paramType' in recordOf(draftOf(ANY))).toBe(false);
    });

    it('a draft that takes the key of another template is refused; a different type of the same name is not (kills: name-only taken check)', () => {
        const clash = editDraft({}, CONJ, { paramType: 'Ref' });
        expect(applyDrafts([REF, CONJ], clash).problems).toEqual({ 'expr:Conj': 'The name expr with the type Ref is taken by another template.' });
        const untyped = editDraft({}, CONJ, { paramType: '' });
        expect(applyDrafts([REF, CONJ, ANY], untyped).problems).toEqual({ 'expr:Conj': 'The name expr is taken by another template.' });
        expect(applyDrafts([REF, CONJ], untyped).problems).toEqual({});
    });

    it('a draft the store comes to hold is dropped, matched by key (kills: followStore by name)', () => {
        const drafts = editDraft({}, CONJ, { body: 'C2' });
        expect(followStore(drafts, [REF, { ...CONJ, body: 'C2' }])).toEqual({});
        expect(followStore(drafts, [REF, CONJ])).toBe(drafts);
    });
});
