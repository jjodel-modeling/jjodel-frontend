/**
 * Step C lane C2a (P-2026-11-05-0010; report docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §2.2, D1, D2,
 * D3, D7, D9): the pure module of the Syntax form. The field table by element kind with its Basic and Advanced split,
 * the values read from a record and a change applied to a draft, the `checkStyle` findings de-duplicated and mapped to
 * fields on the seven ambiguous records of the C2 probe (F4), the three Save gates, the annotations of deleted elements,
 * and the preview. Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel } from '../metamodel';
import { encodeSyntax } from '../syntaxRecord';
import { advancedInEffect, byField, draftPreview, fieldKey, fieldValue, fieldsOf, formElements, isDirty, readDraft, saveGate, setField, staleEntries, withoutStale } from '../syntaxForm';
import type { FieldRef, FormFault } from '../syntaxForm';
import { BOOL_CLIKE, BOOL_IDS, BOOL_MM, boolObjects } from './boolCorpus';
import { LIBRARY_IDS, LIBRARY_MM, libraryObjects } from './tolerantCorpus';

const ids = (form: ReturnType<typeof fieldsOf>): string[] => form.map(f => f.id);
const at = (element: string, field: FieldRef['field']): string => fieldKey({ element, field });
const keysOf = (f: FormFault): string[] => f.at.map(fieldKey).sort();
const errors = (fs: readonly FormFault[]): FormFault[] => fs.filter(f => f.level === 'error');

// The C2 probe's BOOL ids, with the Sheet's name optional for the one-line case (F4 row 6).
const PROBE_IDS: ElementIds = { ...BOOL_IDS, features: { ...BOOL_IDS.features, F_Sheet_name: { owner: 'Sheet', name: 'name', lower: 0 } } };

// A string attribute that is not the name, for `value "name"`.
const NOTE_MM: TextMetamodel = { classes: [{ name: 'Note', attributes: [{ name: 'name', type: 'EString' }, { name: 'text', type: 'EString' }, { name: 'tags', type: 'EString', many: true }] }], enumerations: [] };
const NOTE_IDS: ElementIds = { classes: { C_Note: 'Note' }, features: { A_Note_name: { owner: 'Note', name: 'name', lower: 1 }, A_Note_text: { owner: 'Note', name: 'text' }, A_Note_tags: { owner: 'Note', name: 'tags' } }, enums: {} };

describe('the field table (F1, D2)', () => {
    it('the elements: the language, every class with its own features, every enumeration (mutant: inherited features listed under the heir)', () => {
        const els = formElements(LIBRARY_MM, LIBRARY_IDS);
        expect(els.map(e => e.key)).toEqual(['language', 'class:C_Lib', 'class:C_Book', 'class:C_Mem', 'enum:E_Genre']);
        expect(els.find(e => e.key === 'class:C_Book')!.features).toEqual(['feature:A_Book_name', 'feature:A_Book_genre', 'feature:A_Book_year', 'feature:R_Book_borrowedBy']);
        const bool = formElements(BOOL_MM, BOOL_IDS);
        expect(bool.find(e => e.key === 'class:C_Expr')).toMatchObject({ abstract: true, features: [] });
        expect(bool.find(e => e.key === 'class:C_And')!.features).toEqual(['feature:F_And_ops']);
    });

    it('Basic shows what changes the look of the text, Advanced the rest (mutants: an advanced field in Basic; a basic one dropped)', () => {
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'language', 'basic'))).toEqual(['language.name', 'language.style']);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'language', 'advanced'))).toEqual(['language.name', 'language.style', 'language.classCase', 'language.literalCase', 'language.blankBeforeContainment', 'language.roots']);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'class:C_Mem', 'basic'))).toEqual(['class.keyword', 'class.layout']);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'class:C_Mem', 'advanced'))).toEqual(['class.keyword', 'class.positional', 'class.layout', 'class.nameKeyword', 'class.namePattern']);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'feature:R_Lib_books', 'basic'))).toEqual(['feature.keyword', 'feature.itemKeyword']);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'feature:R_Lib_books', 'advanced'))).toEqual(['feature.keyword', 'feature.itemKeyword', 'feature.positional', 'feature.inline', 'feature.groupBy']);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'enum:E_Genre', 'basic'))).toEqual([]);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'enum:E_Genre', 'advanced'))).toEqual(['enum.subsets']);
    });

    it('a field is offered only where it can apply (mutants: class fields on an abstract class; per-item keyword on a single-valued containment; the name annotated as a feature; value on a non-string)', () => {
        expect(fieldsOf(BOOL_MM, BOOL_IDS, 'class:C_Expr', 'advanced')).toEqual([]);
        expect(ids(fieldsOf(BOOL_MM, BOOL_IDS, 'feature:F_Rule_when', 'advanced'))).toEqual(['feature.keyword', 'feature.positional', 'feature.inline']);
        expect(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'feature:A_Book_name', 'advanced')).toEqual([]);
        expect(ids(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'feature:A_Book_year', 'advanced'))).toEqual(['feature.keyword', 'feature.positional']);
        expect(ids(fieldsOf(NOTE_MM, NOTE_IDS, 'feature:A_Note_text', 'advanced'))).toEqual(['feature.keyword', 'feature.positional', 'feature.value']);
        expect(ids(fieldsOf(NOTE_MM, NOTE_IDS, 'feature:A_Note_tags', 'advanced'))).toEqual(['feature.keyword', 'feature.positional']);
        // groupBy offers the enumeration attributes of the contained class.
        expect(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'feature:R_Lib_books', 'advanced').find(f => f.id === 'feature.groupBy')!.options).toEqual(['A_Book_genre']);
        expect(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'feature:R_Lib_members', 'advanced').some(f => f.id === 'feature.groupBy')).toBe(false);
    });

    it('the layout offers block, line where no containment is many-valued, call where there is none and nothing many-valued; call only in Advanced (mutants: line offered over a many-valued containment; call in Basic)', () => {
        const layout = (mm: TextMetamodel, i: ElementIds, el: string, mode: 'basic' | 'advanced') => fieldsOf(mm, i, el, mode).find(f => f.id === 'class.layout')?.options;
        expect(layout(LIBRARY_MM, LIBRARY_IDS, 'class:C_Lib', 'advanced')).toBeUndefined();
        expect(layout(LIBRARY_MM, LIBRARY_IDS, 'class:C_Mem', 'basic')).toEqual(['block', 'line']);
        expect(layout(LIBRARY_MM, LIBRARY_IDS, 'class:C_Mem', 'advanced')).toEqual(['block', 'line', 'call']);
        expect(layout(BOOL_MM, BOOL_IDS, 'class:C_Rule', 'advanced')).toEqual(['block', 'line']);
    });

    it('the operator group only on a class of an operator\'s shape, the call word only n-ary (mutants: the group on any class; call on a binary one)', () => {
        const op = (el: string) => ids(fieldsOf(BOOL_MM, BOOL_IDS, el, 'advanced')).filter(f => f.startsWith('class.operator'));
        expect(op('class:C_And')).toEqual(['class.operatorSymbol', 'class.operatorPrecedence', 'class.operatorAssoc', 'class.operatorCall']);
        expect(op('class:C_Imp')).toEqual(['class.operatorSymbol', 'class.operatorPrecedence', 'class.operatorAssoc']);
        expect(op('class:C_Not')).toEqual(['class.operatorSymbol', 'class.operatorPrecedence']);
        expect(op('class:C_Rule')).toEqual([]);
        expect(ids(fieldsOf(BOOL_MM, BOOL_IDS, 'class:C_And', 'basic')).some(f => f.startsWith('class.operator'))).toBe(false);
    });

    it('the default is the placeholder, never a stored value', () => {
        expect(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'class:C_Book', 'basic').find(f => f.id === 'class.keyword')!.placeholder).toBe('Book');
        expect(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'feature:R_Lib_members', 'basic').find(f => f.id === 'feature.keyword')!.placeholder).toBe('members');
        expect(fieldsOf(LIBRARY_MM, LIBRARY_IDS, 'language', 'basic', 'Library').find(f => f.id === 'language.name')!.placeholder).toBe('Library');
        expect(fieldValue(null, { element: 'class:C_Book', field: 'class.keyword' })).toBeUndefined();
    });
});

describe('values and the draft setter', () => {
    const LIB: SyntaxAnnotations = { v: 1, language: 'Shelf', style: { base: 'pascal', classCase: 'lower' }, classes: { C_Mem: { keyword: '', layout: 'line' }, C_Book: { name: { keyword: 'titled' } } },
        features: { R_Lib_members: { keyword: 'patrons', itemKeyword: 'patron' }, R_Lib_books: { groupBy: 'A_Book_genre', inline: true } } };

    it('reads every field from a record; a keyword "" reads as positional, not as a keyword (mutant: "" shown as the keyword)', () => {
        expect(fieldValue(LIB, { element: 'language', field: 'language.name' })).toBe('Shelf');
        expect(fieldValue(LIB, { element: 'language', field: 'language.style' })).toBe('pascal');
        expect(fieldValue(LIB, { element: 'language', field: 'language.classCase' })).toBe('lower');
        expect(fieldValue(LIB, { element: 'class:C_Mem', field: 'class.keyword' })).toBeUndefined();
        expect(fieldValue(LIB, { element: 'class:C_Mem', field: 'class.positional' })).toBe(true);
        expect(fieldValue(LIB, { element: 'class:C_Mem', field: 'class.layout' })).toBe('line');
        expect(fieldValue(LIB, { element: 'class:C_Book', field: 'class.nameKeyword' })).toBe('titled');
        expect(fieldValue(LIB, { element: 'feature:R_Lib_members', field: 'feature.itemKeyword' })).toBe('patron');
        expect(fieldValue(LIB, { element: 'feature:R_Lib_books', field: 'feature.groupBy' })).toBe('A_Book_genre');
        expect(fieldValue(LIB, { element: 'feature:R_Lib_books', field: 'feature.inline' })).toBe(true);
    });

    it('a cleared field leaves no {} behind, and the last one leaves the empty record (mutant: an emptied entry kept)', () => {
        let d: SyntaxAnnotations = { v: 1 };
        d = setField(d, { element: 'class:C_Book', field: 'class.nameKeyword' }, 'titled');
        expect(d).toEqual({ v: 1, classes: { C_Book: { name: { keyword: 'titled' } } } });
        d = setField(d, { element: 'class:C_Book', field: 'class.keyword' }, 'book');
        d = setField(d, { element: 'class:C_Book', field: 'class.nameKeyword' }, undefined);
        expect(d).toEqual({ v: 1, classes: { C_Book: { keyword: 'book' } } });
        d = setField(d, { element: 'class:C_Book', field: 'class.keyword' }, undefined);
        expect(d).toEqual({ v: 1 });
        expect(encodeSyntax(d)).toBe('{"v":1}');
        // A toggle switched off and an emptied text are cleared, not stored.
        expect(setField({ v: 1, features: { R_Lib_books: { inline: true } } }, { element: 'feature:R_Lib_books', field: 'feature.inline' }, false)).toEqual({ v: 1 });
        expect(setField({ v: 1, language: 'Shelf' }, { element: 'language', field: 'language.name' }, '')).toEqual({ v: 1 });
    });

    it('positional writes keyword "", and off removes it only when it is ""; a keyword typed over it replaces it (mutant: positional off leaves "")', () => {
        const pos = setField({ v: 1 }, { element: 'class:C_Mem', field: 'class.positional' }, true);
        expect(pos).toEqual({ v: 1, classes: { C_Mem: { keyword: '' } } });
        expect(setField(pos, { element: 'class:C_Mem', field: 'class.positional' }, false)).toEqual({ v: 1 });
        expect(setField(pos, { element: 'class:C_Mem', field: 'class.keyword' }, 'reader')).toEqual({ v: 1, classes: { C_Mem: { keyword: 'reader' } } });
        expect(setField({ v: 1, classes: { C_Mem: { keyword: 'reader' } } }, { element: 'class:C_Mem', field: 'class.positional' }, false)).toEqual({ v: 1, classes: { C_Mem: { keyword: 'reader' } } });
        expect(setField({ v: 1 }, { element: 'feature:A_Book_genre', field: 'feature.positional' }, true)).toEqual({ v: 1, features: { A_Book_genre: { keyword: '' } } });
    });

    it('the style C-like is written as no base, as the picker does; the other fields of the style stay (mutant: clike written)', () => {
        expect(setField({ v: 1, style: { base: 'pascal' } }, { element: 'language', field: 'language.style' }, 'clike')).toEqual({ v: 1 });
        expect(setField({ v: 1, style: { base: 'pascal', classCase: 'lower' } }, { element: 'language', field: 'language.style' }, 'clike')).toEqual({ v: 1, style: { classCase: 'lower' } });
        expect(setField({ v: 1 }, { element: 'language', field: 'language.blankBeforeContainment' }, true)).toEqual({ v: 1, style: { blankBeforeContainment: true } });
    });

    it('the operator group: a field set alone, the others kept, the group gone when emptied; value "name" as a toggle (mutant: the operator replaced whole)', () => {
        let d = setField({ v: 1 }, { element: 'class:C_And', field: 'class.operatorSymbol' }, '&');
        d = setField(d, { element: 'class:C_And', field: 'class.operatorPrecedence' }, 3);
        expect(d).toEqual({ v: 1, classes: { C_And: { operator: { symbol: '&', precedence: 3 } } } });
        d = setField(d, { element: 'class:C_And', field: 'class.operatorSymbol' }, undefined);
        d = setField(d, { element: 'class:C_And', field: 'class.operatorPrecedence' }, undefined);
        expect(d).toEqual({ v: 1 });
        expect(setField({ v: 1 }, { element: 'feature:A_Note_text', field: 'feature.value' }, true)).toEqual({ v: 1, features: { A_Note_text: { value: 'name' } } });
        expect(fieldValue({ v: 1, features: { A_Note_text: { value: 'name' } } }, { element: 'feature:A_Note_text', field: 'feature.value' })).toBe(true);
    });

    it('Basic says how many Advanced fields are in effect on an element (mutant: basic fields counted)', () => {
        expect(advancedInEffect(LIB, 'class:C_Mem')).toBe(1); // positional; the layout line is Basic
        expect(advancedInEffect(LIB, 'feature:R_Lib_books')).toBe(2);
        expect(advancedInEffect(LIB, 'language')).toBe(1);
        expect(advancedInEffect(LIB, 'feature:R_Lib_members')).toBe(0);
    });
});

describe('the findings at their fields (F4, F5, D9)', () => {
    const faults = (record: SyntaxAnnotations): readonly FormFault[] => readDraft(BOOL_MM, PROBE_IDS, record).faults;

    it('two classes, one keyword: four checkStyle errors are one fault, at the keyword of And and of Or (mutant: no de-duplication)', () => {
        const fs = errors(faults({ v: 1, classes: { C_And: { keyword: 'all' }, C_Or: { keyword: 'all' } } }));
        expect(fs).toHaveLength(1);
        expect(keysOf(fs[0])).toEqual([at('class:C_And', 'class.keyword'), at('class:C_Or', 'class.keyword')]);
        expect(fs[0].message).toContain('"all"');
    });

    it('two positional containments: one fault at both, the message saying why instead of naming tokens (mutant: the token message kept)', () => {
        const fs = errors(faults({ v: 1, features: { F_Imp_left: { keyword: '' }, F_Imp_right: { keyword: '' } } }));
        expect(fs).toHaveLength(1);
        expect(keysOf(fs[0])).toEqual([at('feature:F_Imp_left', 'feature.positional'), at('feature:F_Imp_right', 'feature.positional')]);
        expect(fs[0].message).toBe('the features left and right have no keyword, so the parser cannot tell which one a value is for');
    });

    it.each([
        ['a class keyword that is a block token', { v: 1, classes: { C_Rule: { keyword: '{' } } }, [at('class:C_Rule', 'class.keyword')]],
        ['an operator symbol that is a block token', { v: 1, classes: { C_And: { operator: { symbol: '{', precedence: 1 } } } }, [at('class:C_And', 'class.operatorSymbol')]],
        ['two operators, one symbol', { v: 1, classes: { C_And: { operator: { symbol: '&', precedence: 1 } }, C_Or: { operator: { symbol: '&', precedence: 2 } } } }, [at('class:C_And', 'class.operatorSymbol'), at('class:C_Or', 'class.operatorSymbol')]],
        ['a one-line class with an optional name', { v: 1, classes: { C_Sheet: { layout: 'line' } } }, [at('class:C_Sheet', 'class.layout')]],
    ] as const)('%s: one fault at its field (mutant: the message not mapped)', (_c, record, where) => {
        const fs = errors(faults(record as SyntaxAnnotations));
        expect(fs).toHaveLength(1);
        expect(keysOf(fs[0])).toEqual(where);
    });

    it('one message at two fields is two faults (mutant: the key without its fields)', () => {
        const fs = errors(faults({ v: 1, classes: { C_Rule: { keyword: '{' }, C_Atom: { keyword: '{' } } }));
        expect(fs.flatMap(keysOf).sort()).toEqual([at('class:C_Atom', 'class.keyword'), at('class:C_Rule', 'class.keyword')]);
        expect(fs[0].message).toBe(fs[1].message);
    });

    it('two different faults at one field stay two (mutant: the key without its tokens or message)', () => {
        // Found by the C2a probe: the keyword "{" of books is not applied, so its default "books" stays and meets the
        // name keyword "books" of Library. Both faults are at the keyword of books, with different tokens.
        const fs = errors(readDraft(LIBRARY_MM, LIBRARY_IDS, { v: 1, classes: { C_Lib: { name: { keyword: 'books' } } }, features: { R_Lib_books: { keyword: '{' } } }).faults);
        const books = fs.filter(f => f.at.some(r => fieldKey(r) === at('feature:R_Lib_books', 'feature.keyword')));
        expect(books.map(f => f.message).sort()).toEqual(['the keyword "books" starts 2 features: Library.books', 'the keyword "{" is a block token of the style c-like; not applied']);
        expect(books.every(f => keysOf(f).join() === at('feature:R_Lib_books', 'feature.keyword'))).toBe(true);
    });

    it('byField: one message per fault at each of its fields, naming the others (mutant: also lists the field itself)', () => {
        const fs = faults({ v: 1, classes: { C_And: { keyword: 'all' }, C_Or: { keyword: 'all' } } });
        const m = byField(fs);
        const and = m.get(at('class:C_And', 'class.keyword'))!;
        const or = m.get(at('class:C_Or', 'class.keyword'))!;
        expect(and).toHaveLength(1);
        expect(or).toHaveLength(1);
        expect(and[0].also.map(fieldKey)).toEqual([at('class:C_Or', 'class.keyword')]);
        expect(or[0].also.map(fieldKey)).toEqual([at('class:C_And', 'class.keyword')]);
    });

    it('a record the derivation accepts has no error fault (mutant: an ok finding kept)', () => {
        expect(errors(faults(BOOL_CLIKE))).toEqual([]);
        expect(errors(readDraft(BOOL_MM, BOOL_IDS, { v: 1 }).faults)).toEqual([]);
    });

    it('a decoding issue of the stored record is a fault of the record, at no field', () => {
        const fs = readDraft(BOOL_MM, BOOL_IDS, { v: 1 }, [{ level: 'error', where: 'annotations record', message: 'style is not a record: dropped' }]).faults;
        expect(fs).toEqual([{ level: 'error', rule: 'annotations', message: 'style is not a record: dropped', at: [] }]);
    });
});

describe('annotations of deleted elements (D7)', () => {
    const STALE: SyntaxAnnotations = { v: 1, roots: ['C_Sheet', 'C_Gone'], classes: { C_X: {}, C_Atom: { keyword: 'atom' } }, features: { F_Gone: { keyword: 'k' } }, enums: { E_Gone: { subsets: [] } } };

    it('are counted, dropped from what Save writes with every other entry kept, and announced once as a notice (mutants: kept in the record; one notice per entry; an error)', () => {
        expect(staleEntries(STALE, BOOL_IDS)).toEqual(['roots:C_Gone', 'classes:C_X', 'features:F_Gone', 'enums:E_Gone']);
        expect(withoutStale(STALE, BOOL_IDS)).toEqual({ v: 1, roots: ['C_Sheet'], classes: { C_Atom: { keyword: 'atom' } } });
        expect(withoutStale({ v: 1, roots: ['C_Gone'] }, BOOL_IDS)).toEqual({ v: 1 });
        const r = readDraft(BOOL_MM, BOOL_IDS, STALE);
        expect(r.stale).toBe(4);
        expect(r.faults.filter(f => f.rule === 'stale')).toEqual([{ level: 'notice', rule: 'stale', message: '4 annotations of deleted elements: Save writes the record without them', at: [] }]);
        expect(errors(r.faults)).toEqual([]);
        expect(readDraft(BOOL_MM, BOOL_IDS, { v: 1, classes: { C_X: {} } }).faults.map(f => f.message)).toEqual(['1 annotation of a deleted element: Save writes the record without it']);
    });
});

describe('the Save gates (D1)', () => {
    const err: FormFault = { level: 'error', rule: 'distinct-classes', message: 'the keyword "all" starts 2 classes: And, Or', at: [] };
    const note: FormFault = { level: 'notice', rule: 'stale', message: '1 annotation of a deleted element', at: [] };
    const draft: SyntaxAnnotations = { v: 1, language: 'Shelf' };

    it('Save is enabled only for a changed draft with no error and no pending Text edit (mutants: each gate dropped)', () => {
        expect(saveGate({ faults: [note], storedRaw: undefined, draft, pendingEdit: false })).toEqual({ enabled: true, blocks: [], title: 'Save the syntax' });
        expect(saveGate({ faults: [err, note], storedRaw: undefined, draft, pendingEdit: false })).toEqual({ enabled: false, blocks: ['errors'], title: '1 error: the keyword "all" starts 2 classes: And, Or' });
        expect(saveGate({ faults: [err, err], storedRaw: undefined, draft, pendingEdit: false }).title).toBe('2 errors: the keyword "all" starts 2 classes: And, Or');
        expect(saveGate({ faults: [], storedRaw: encodeSyntax(draft), draft, pendingEdit: false })).toEqual({ enabled: false, blocks: ['unchanged'], title: 'No unsaved changes' });
        expect(saveGate({ faults: [], storedRaw: undefined, draft, pendingEdit: true })).toEqual({ enabled: false, blocks: ['pending'], title: 'Apply or discard the edit in Text first' });
        expect(saveGate({ faults: [err], storedRaw: encodeSyntax(draft), draft, pendingEdit: true }).blocks).toEqual(['errors', 'unchanged', 'pending']);
    });

    it('D3: the empty draft over no record is unchanged, and so is a stored {"v":1} (mutant: dirty by string inequality alone)', () => {
        expect(isDirty(undefined, { v: 1 })).toBe(false);
        expect(isDirty(null, { v: 1 })).toBe(false);
        expect(isDirty('{"v":1}', { v: 1 })).toBe(false);
        expect(isDirty('{"v":1}', draft)).toBe(true);
        expect(saveGate({ faults: [], storedRaw: undefined, draft: { v: 1 }, pendingEdit: false }).blocks).toEqual(['unchanged']);
    });
});

describe('the preview from a draft', () => {
    it('the EBNF and the open model\'s print follow the draft, without its stale entries (mutants: the stored record previewed; stale entries derived)', () => {
        const objects = libraryObjects(4, 2);
        const plain = draftPreview(LIBRARY_MM, LIBRARY_IDS, { v: 1 }, objects);
        expect(plain.error).toBeNull();
        expect(plain.text.split('\n')[0]).toBe('Library city {');
        const draft = setField({ v: 1, classes: { C_Gone: { keyword: 'x' } } }, { element: 'class:C_Lib', field: 'class.keyword' }, 'shelf');
        const p = draftPreview(LIBRARY_MM, LIBRARY_IDS, draft, objects);
        expect(p.error).toBeNull();
        expect(p.text.split('\n')[0]).toBe('shelf city {');
        expect(p.ebnf).toContain('"shelf"');
        expect(p.ebnf).not.toBe(plain.ebnf);
        expect(draftPreview(BOOL_MM, BOOL_IDS, BOOL_CLIKE, boolObjects()).error).toBeNull();
    });
});
