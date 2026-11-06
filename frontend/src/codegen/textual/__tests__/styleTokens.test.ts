/**
 * Editable EBNF literals, step 2, lane L2a (P-2026-11-05-1430; docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md
 * §4, R-TXT-48 (2), R-TXT-49 D9 D10 D11 D12): the style tokens as overrides on `style.base`, whole arrays per parameter.
 * The resolution validates them and the effective style derives from them; the record drops them on a base switch and
 * writes them in a fixed order; the style check's `style-tokens` rule; the form's field per parameter.
 * Mutations each test kills are in its name; the bench is in the commit bodies.
 */

import { describe, expect, it, vi } from 'vitest';

// The Text tab's imports that reach Monaco and the store, mocked as ebnfIslands.test.ts does (section 7).
vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));
import { resolveAnnotations, withStyleOptions } from '../annotations';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel } from '../metamodel';
import { CLIKE_STYLE, INDENT_STYLE, PASCAL_STYLE, styleOf } from '../style';
import type { NotationStyle } from '../style';
import { checkStyle } from '../styleCheck';
import { concreteGrammarEbnfSpans } from '../concreteGrammar';
import type { ConcreteGrammar, LiteralSrc } from '../concreteGrammar';
import { advancedInEffect, byField, fieldKey, fieldPhrase, fieldValue, literalDefault, literalField, parseTokens, readDraft, setField, setLiteral, styleTokenFields, tokensText } from '../syntaxForm';
import type { FieldId } from '../syntaxForm';
import { BOOL_IDS, BOOL_MM, BOOL_PASCAL, boolObjects } from './boolCorpus';
import { decodeSyntax, encodeSyntax, textualNotation, withStyleBase } from '../syntaxRecord';
import { PORT_CLIKE, PORT_IDS, PORT_MM, PORT_PASCAL, portObjects, portWith } from './portCorpus';
import { BOX, CASES, DIAMOND, GARAGE, grammarOf, INNER, NON_DIAMOND } from './corpus';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import type { TextObject } from '../metamodel';
import { FIXTURE, metamodelOf, objectsOf } from './spec';
import { ebnfOfDraft, styleEntryName, styleSwitchRecord } from '../ui/TextualTab';

const EMPTY_MM: TextMetamodel = { classes: [], enumerations: [] };
const EMPTY_IDS: ElementIds = { classes: {}, features: {}, enums: {} };

/** The resolution of a record with only a `style`. */
const resolved = (style: Record<string, unknown>) => resolveAnnotations({ v: 1, style } as SyntaxAnnotations, EMPTY_IDS, EMPTY_MM);
/** The effective style of a record's `style`, as syntaxRecord.ts `textualNotation` takes it. */
const effective = (style: Record<string, unknown>): NotationStyle => {
    const r = resolved(style);
    return withStyleOptions(styleOf(r.style.base), r);
};

describe('(1) the resolution of the token overrides', () => {
    it('keeps well-formed overrides, words and punctuation, with no issue (mutant: a token key not read)', () => {
        const r = resolved({ base: 'pascal', blockOpen: ['start'], blockClose: ['stop', '.;'], assign: ['='], terminator: ['!'], list: { open: '<', separator: '|', close: '>' } });
        expect(r.issues).toEqual([]);
        expect(r.style).toEqual({ base: 'pascal', blockOpen: ['start'], blockClose: ['stop', '.;'], assign: ['='], terminator: ['!'], list: { open: '<', separator: '|', close: '>' } });
    });

    it('drops a parameter that is not a list of strings, with an error at the parameter (mutant: the shape not checked)', () => {
        const r = resolved({ blockOpen: '{', terminator: [';', 4], list: 'x' });
        expect(r.style).toEqual({});
        expect(r.issues.map(i => [i.level, i.where])).toEqual([['error', 'style.blockOpen'], ['error', 'style.terminator'], ['error', 'style.list']]);
    });

    it('drops a token that is empty, holds a blank or a quote, or is neither a word nor a run of punctuation (mutant: well-formedness left to the widget)', () => {
        const cases: [string, unknown, RegExp][] = [
            ['blockOpen', [''], /empty/], ['blockClose', ['end', 'a b'], /blank/], ['assign', ['"'], /quote/], ['terminator', ['a;'], /word|punctuation/],
            ['blockOpen', ['1x'], /word|punctuation/], ['assign', ["'"], /word|punctuation/], ['terminator', ['@'], /word|punctuation/],
        ];
        for (const [param, value, reason] of cases) {
            const r = resolved({ [param]: value });
            expect(r.style, `${param} ${JSON.stringify(value)}`).toEqual({});
            expect(r.issues.map(i => i.where)).toEqual([`style.${param}`]);
            expect(r.issues[0].message).toMatch(reason);
        }
    });

    it('validates the list key by key: a malformed token drops that key only (mutant: the whole list dropped)', () => {
        const r = resolved({ list: { open: '<', separator: 5, close: ' ' } });
        expect(r.style).toEqual({ list: { open: '<' } });
        expect(r.issues.map(i => i.where)).toEqual(['style.list.separator', 'style.list.close']);
    });

    it('the four options keep their messages and their where (mutant: the options moved under a token where)', () => {
        const r = resolved({ classCase: 'upper' });
        expect(r.issues).toEqual([{ level: 'error', where: 'style', message: 'classCase "upper" is not declared or lower' }]);
    });
});

describe('(1) the effective style', () => {
    it('with no override is the base with its options, as before (mutant: the empty block derived with no block override)', () => {
        expect(effective({})).toEqual(CLIKE_STYLE);
        expect(effective({ base: 'pascal', classCase: 'lower' })).toEqual({ ...PASCAL_STYLE, classCase: 'lower' });
    });

    it('takes each overridden parameter whole (mutant: an override ignored)', () => {
        const s = effective({ base: 'pascal', blockClose: ['stop', ';'], assign: ['='], terminator: ['.'] });
        expect([s.blockOpen, s.blockClose, s.assign, s.terminator]).toEqual([['begin'], ['stop', ';'], ['='], ['.']]);
    });

    it('merges the list key by key: a partial list keeps the base\'s other tokens (mutant: the list spread whole)', () => {
        expect(effective({ list: { open: '<' } }).list).toEqual({ open: '<', separator: ',', close: ']' });
        expect(effective({ base: 'pascal', list: { separator: ';' } }).list).toEqual({ open: '(', separator: ';', close: ')' });
    });

    it('reserves the word tokens of the effective style, and frees a word no token is any more (mutant: reservedNames kept the base\'s)', () => {
        expect(effective({ blockOpen: ['start'], blockClose: ['stop'] }).reservedNames).toEqual(['start', 'stop']);
        expect(effective({ base: 'pascal', blockOpen: ['{'] }).reservedNames).toEqual(['end']);
        expect(effective({ base: 'pascal', list: { open: 'of' } }).reservedNames).toEqual(['begin', 'end', 'of']);
    });

    it('derives the empty block from open and close when either is overridden, else keeps the base\'s (mutant: emptyBlock always the base\'s; always derived)', () => {
        expect(effective({ blockOpen: ['start'] }).emptyBlock).toEqual(['start', '}']);
        expect(effective({ base: 'pascal', blockClose: ['end'] }).emptyBlock).toEqual(['begin', 'end']);
        expect(effective({ list: { open: '<' } }).emptyBlock).toEqual(['{}']);
        expect(effective({ blockOpen: ['{'] }).emptyBlock).toEqual(['{}']);
    });
});

describe('(2) the record', () => {
    const OVERRIDES = { blockOpen: ['start'], blockClose: ['stop'], assign: ['='], terminator: ['.'], list: { open: '<', separator: '|', close: '>' } };

    it('a base switch drops the token overrides and keeps the case and blank options (D10; mutant: withStyleBase spreads every key)', () => {
        const r: SyntaxAnnotations = { v: 1, language: 'L', style: { base: 'pascal', classCase: 'lower', literalCase: 'lower', blankBeforeContainment: true, ...OVERRIDES } };
        expect(withStyleBase(r, 'clike')).toEqual({ v: 1, language: 'L', style: { classCase: 'lower', literalCase: 'lower', blankBeforeContainment: true } });
        expect(withStyleBase(r, 'indent')).toEqual({ v: 1, language: 'L', style: { base: 'indent', classCase: 'lower', literalCase: 'lower', blankBeforeContainment: true } });
        expect(withStyleBase({ v: 1, style: { blockOpen: ['start'] } }, 'pascal')).toEqual({ v: 1, style: { base: 'pascal' } });
        expect(withStyleBase({ v: 1, style: { base: 'pascal', terminator: ['.'] } }, 'clike')).toEqual({ v: 1 });
    });

    it('choosing the base already in effect is no switch: the overrides stay (mutant: tokens dropped on any call)', () => {
        const r: SyntaxAnnotations = { v: 1, style: { base: 'pascal', ...OVERRIDES } };
        expect(withStyleBase(r, 'pascal')).toEqual(r);
        expect(withStyleBase({ v: 1, style: { blockOpen: ['start'] } }, 'clike')).toEqual({ v: 1, style: { blockOpen: ['start'] } });
    });

    it('writes the token keys after the options in a fixed order, the list keys too, whatever the insertion order (mutant: style written as given)', () => {
        const a: SyntaxAnnotations = { v: 1, style: { base: 'pascal', classCase: 'lower', ...OVERRIDES } };
        const b: SyntaxAnnotations = { v: 1, style: { list: { close: '>', open: '<', separator: '|' }, base: 'pascal', terminator: ['.'], assign: ['='], blockClose: ['stop'], classCase: 'lower', blockOpen: ['start'] } };
        expect(encodeSyntax(b)).toBe(encodeSyntax(a));
        expect(encodeSyntax(a)).toBe('{"v":1,"style":{"base":"pascal","classCase":"lower","blockOpen":["start"],"blockClose":["stop"],"assign":["="],"terminator":["."],"list":{"open":"<","separator":"|","close":">"}}}');
    });

    it('a record with no token keys encodes as before, its options in their own order (mutant: the options reordered too)', () => {
        expect(encodeSyntax({ v: 1, style: { blankBeforeContainment: true, classCase: 'lower', base: 'pascal' } })).toBe('{"v":1,"style":{"blankBeforeContainment":true,"classCase":"lower","base":"pascal"}}');
    });

    it('stays at version 1 and reads back byte for byte (D12; mutant: the version bumped)', () => {
        const raw = encodeSyntax({ v: 1, style: { base: 'pascal', ...OVERRIDES } });
        expect(raw.startsWith('{"v":1,')).toBe(true);
        const decoded = decodeSyntax(raw);
        expect(decoded.issues).toEqual([]);
        expect(encodeSyntax(decoded.record!)).toBe(raw);
    });
});

describe('(3) the style-tokens rule', () => {
    /** The `style-tokens` findings of the garage under a style, as [where, message]. */
    const tokenFindings = (style: NotationStyle): [string, string][] =>
        checkStyle(grammarOf(GARAGE, style)).filter(f => f.rule === 'style-tokens' && f.level === 'error').map(f => [f.where, f.message]);

    it('holds on every style of the catalog, Pascal\'s "(" beside its "(*" included (mutant: a strict prefix of a comment opener refused whatever follows)', () => {
        for (const s of [CLIKE_STYLE, PASCAL_STYLE, INDENT_STYLE]) {
            const fs = checkStyle(grammarOf(GARAGE, s)).filter(f => f.rule === 'style-tokens');
            expect(fs, s.id).toEqual([{ level: 'ok', rule: 'style-tokens', where: '', message: 'holds' }]);
        }
    });

    it('refuses an empty token, a blank, a quote, a mixed token, each at its parameter (mutant: well-formedness not checked here)', () => {
        expect(tokenFindings({ ...CLIKE_STYLE, assign: [''] })).toEqual([['style.assign', 'the assign token "" is empty']]);
        expect(tokenFindings({ ...PASCAL_STYLE, blockClose: ['end x', ';'] })).toEqual([['style.blockClose', 'the blockClose token "end x" holds a blank']]);
        expect(tokenFindings({ ...CLIKE_STYLE, list: { ...CLIKE_STYLE.list, open: '<"' } })).toEqual([['style.list.open', 'the list.open token "<"" holds a quote']]);
        expect(tokenFindings({ ...PASCAL_STYLE, terminator: ['a;'] })).toEqual([['style.terminator', 'the terminator token "a;" is neither a word nor a run of punctuation']]);
    });

    it('refuses a token that starts with a comment opener (mutant: the opener check dropped)', () => {
        expect(tokenFindings({ ...CLIKE_STYLE, terminator: ['//'] })).toEqual([['style.terminator', 'the terminator token "//" starts with the comment opener "//"']]);
        expect(tokenFindings({ ...PASCAL_STYLE, list: { ...PASCAL_STYLE.list, close: '--)' } })).toEqual([['style.list.close', 'the list.close token "--)" starts with the comment opener "--"']]);
        expect(tokenFindings({ ...PASCAL_STYLE, blockOpen: ['(*'], emptyBlock: ['(*', 'end', ';'] })).toEqual([['style.blockOpen', 'the blockOpen token "(*" starts with the comment opener "(*"']]);
    });

    it('refuses a strict prefix of a comment opener that a style token can complete (mutant: only "starts with" checked)', () => {
        expect(tokenFindings({ ...CLIKE_STYLE, terminator: ['/'] })).toEqual([['style.terminator', 'the terminator token "/" followed by "/" reads as the comment opener "//"']]);
        expect(tokenFindings({ ...PASCAL_STYLE, assign: ['-'] })).toEqual([['style.assign', 'the assign token "-" followed by "-" reads as the comment opener "--"']]);
        expect(tokenFindings({ ...PASCAL_STYLE, terminator: ['*'] })).toEqual([['style.list.open', 'the list.open token "(" followed by "*" reads as the comment opener "(*"']]);
    });

    it('refuses a block open equal to the block close (mutant: open = close not checked)', () => {
        expect(tokenFindings({ ...CLIKE_STYLE, blockOpen: ['|'], blockClose: ['|'], emptyBlock: ['|', '|'] })).toEqual([['style.blockOpen', 'the block open "|" is the block close too: an open would read as a close']]);
    });

    it('reaches a record: a relational fault is a style-tokens error, a malformed token an annotations error, both at the parameter', () => {
        const rec = (style: Record<string, unknown>): SyntaxAnnotations => ({ ...PORT_CLIKE, style } as SyntaxAnnotations);
        const findings = (r: SyntaxAnnotations) => checkStyle(textualNotation(PORT_MM, { record: r, issues: [] }, PORT_IDS).grammar).filter(f => f.level === 'error').map(f => [f.rule, f.where]);
        expect(findings(rec({ blockOpen: ['|'], blockClose: ['|'] }))).toContainEqual(['style-tokens', 'style.blockOpen']);
        expect(findings(rec({ terminator: ['//'] }))).toContainEqual(['style-tokens', 'style.terminator']);
        expect(findings(rec({ terminator: ['a b'] }))).toEqual([['annotations', 'style.terminator']]);
        expect(findings(PORT_PASCAL).filter(([r]) => r === 'style-tokens')).toEqual([]);
    });
});

describe('(4) the form: a field per style parameter', () => {
    const grammarOf2 = (mm: TextMetamodel, ids: ElementIds, d: SyntaxAnnotations): ConcreteGrammar => textualNotation(mm, { record: d, issues: [] }, ids).grammar;
    const styleSrc = (param: Extract<LiteralSrc, { k: 'style' }>['param'], index = 0): LiteralSrc => ({ k: 'style', param, index });
    const lang = (field: FieldId) => ({ element: 'language', field });
    const editPort = (d: SyntaxAnnotations, src: LiteralSrc, value: string) => setLiteral(PORT_MM, PORT_IDS, d, src, value);
    const ok = (r: ReturnType<typeof setLiteral>): SyntaxAnnotations => { if (!r.ok) throw new Error(r.reason); return r.draft; };

    it('a style token\'s EBNF literal maps to its parameter\'s field (mutant: style origins left read only)', () => {
        const g = grammarOf2(PORT_MM, PORT_IDS, PORT_PASCAL);
        const at = (src: LiteralSrc) => { const r = literalField(PORT_MM, PORT_IDS, src); return r && fieldKey(r); };
        const printed = concreteGrammarEbnfSpans(g).literals.flatMap(l => (l.src?.k === 'style' ? [[at(l.src), `language#language.${l.src.param}`]] : []));
        expect(printed.length).toBeGreaterThan(0);
        for (const [got, want] of printed) expect(got).toBe(want);
        const params = ['assign', 'terminator', 'blockOpen', 'blockClose', 'list.open', 'list.separator', 'list.close'] as const;
        expect(params.map(p => at(styleSrc(p)))).toEqual(params.map(p => `language#language.${p}`));
        expect(literalField(PORT_MM, PORT_IDS, { k: 'fixed' })).toBeUndefined();
    });

    it('an edit writes the whole array with its element replaced, only when different from the base (D9; mutants: the element alone stored; the base value stored)', () => {
        const d1 = ok(editPort(PORT_PASCAL, styleSrc('blockClose', 1), '.'));
        expect(d1.style).toEqual({ base: 'pascal', blockClose: ['end', '.'] });
        const d2 = ok(editPort(d1, styleSrc('blockOpen'), 'start'));
        expect(d2.style).toEqual({ base: 'pascal', blockClose: ['end', '.'], blockOpen: ['start'] });
        const back = ok(editPort(d2, styleSrc('blockClose', 1), ';'));
        expect(back.style).toEqual({ base: 'pascal', blockOpen: ['start'] });
        expect(ok(editPort(back, styleSrc('blockOpen'), 'begin'))).toEqual(PORT_PASCAL);
    });

    it('a list token is stored key by key, and set back to the base it goes, with an emptied style (mutant: the list stored whole)', () => {
        const d = ok(editPort(PORT_CLIKE, styleSrc('list.separator'), ';'));
        expect(d.style).toEqual({ list: { separator: ';' } });
        expect(ok(editPort(d, styleSrc('list.separator'), ','))).toEqual(PORT_CLIKE);
    });

    it('one edit changes the token everywhere it is printed (R-TXT-48 (2))', () => {
        const d = ok(setLiteral(BOOL_MM, BOOL_IDS, BOOL_PASCAL, styleSrc('blockOpen'), 'start'));
        const spans = concreteGrammarEbnfSpans(grammarOf2(BOOL_MM, BOOL_IDS, d)).literals.filter(l => l.src?.k === 'style' && l.src.param === 'blockOpen');
        expect(spans.length).toBeGreaterThan(1);
        expect(new Set(spans.map(l => l.text))).toEqual(new Set(['start']));
    });

    it('refuses an empty token, a blank, a quote, a mixed token (mutant: the style shape not checked before the draft)', () => {
        const why = (v: string) => { const r = editPort(PORT_PASCAL, styleSrc('terminator'), v); return r.ok ? undefined : r.reason; };
        expect(why('')).toMatch(/empty/);
        expect(why('; ;')).toMatch(/blank/);
        expect(why('"')).toMatch(/quote/);
        expect(why('a;')).toMatch(/word|punctuation/);
        expect(why('.')).toBeUndefined();
    });

    it('the printed default of a style token is the base\'s token at its index', () => {
        const d = ok(editPort(PORT_PASCAL, styleSrc('blockClose', 1), '.'));
        expect(literalDefault(PORT_MM, PORT_IDS, d, styleSrc('blockClose', 1))).toBe(';');
    });

    it('fieldValue and setField read and write a parameter, cleared when equal to the base (mutant: a base-equal array stored)', () => {
        const d = setField(PORT_PASCAL, lang('language.assign'), ['=']);
        expect(fieldValue(d, lang('language.assign'))).toEqual(['=']);
        expect(setField(d, lang('language.assign'), [':='])).toEqual(PORT_PASCAL);
        expect(setField(d, lang('language.assign'), undefined)).toEqual(PORT_PASCAL);
        const l = setField(PORT_CLIKE, lang('language.list.close'), '>');
        expect(fieldValue(l, lang('language.list.close'))).toBe('>');
        expect(fieldValue(l, lang('language.list.open'))).toBeUndefined();
    });

    it('a finding at style.<param> lands on that parameter\'s field, and on the Style row until it has its own (mutant: every style finding at language.style only)', () => {
        const at = (style: Record<string, unknown>, rule: string) => readDraft(PORT_MM, PORT_IDS, { ...PORT_CLIKE, style } as SyntaxAnnotations).faults
            .filter(f => f.rule === rule).map(f => f.at.map(fieldKey));
        expect(at({ blockOpen: ['|'], blockClose: ['|'] }, 'style-tokens')).toEqual([['language#language.blockOpen', 'language#language.blockClose', 'language#language.style']]);
        expect(at({ terminator: ['//'] }, 'style-tokens')).toEqual([['language#language.terminator', 'language#language.style']]);
        expect(at({ terminator: ['a b'] }, 'annotations')).toEqual([['language#language.terminator', 'language#language.style']]);
        expect(at({ list: { open: ',' } }, 'list-tokens')).toEqual([['language#language.list.open', 'language#language.list.separator', 'language#language.list.close', 'language#language.style']]);
        expect(at({ classCase: 'upper' }, 'annotations')).toEqual([['language#language.classCase']]);
    });

    it('names a parameter\'s field in a sentence', () => {
        expect(fieldPhrase(PORT_IDS, lang('language.blockOpen'))).toBe('the block open of the language');
        expect(fieldPhrase(PORT_IDS, lang('language.list.separator'))).toBe('the list separator of the language');
    });
});

describe('(6) the form\'s token rows, lane B0 (P-2026-11-05-2220; Corregge P-2026-11-05-1457, F5)', () => {
    const lang = (field: FieldId) => ({ element: 'language', field });
    const PARAMS = ['blockOpen', 'blockClose', 'assign', 'terminator', 'list.open', 'list.separator', 'list.close'] as const;

    it('the array parameters take the tokens input, the list tokens a text, Advanced only, the base\'s tokens as placeholder (mutants: a text input over an array; the rows in Basic; the C-like placeholder under Pascal)', () => {
        expect(styleTokenFields(PORT_PASCAL, 'basic')).toEqual([]);
        const pascal = styleTokenFields(PORT_PASCAL, 'advanced');
        expect(pascal.map(f => f.id)).toEqual(PARAMS.map(p => `language.${p}`));
        expect(pascal.map(f => f.input)).toEqual(['tokens', 'tokens', 'tokens', 'tokens', 'text', 'text', 'text']);
        expect(pascal.every(f => f.tier === 'advanced')).toBe(true);
        expect(pascal.map(f => f.placeholder)).toEqual(['begin', 'end ;', ':=', ';', '(', ',', ')']);
        expect(styleTokenFields(PORT_CLIKE, 'advanced').map(f => f.placeholder)).toEqual(['{', '}', undefined, undefined, '[', ',', ']']);
    });

    it('an override shows joined by one space, an absent one empty (F5: the override shown empty)', () => {
        const d: SyntaxAnnotations = { ...PORT_PASCAL, style: { base: 'pascal', blockClose: ['end', '.'] } };
        expect(tokensText(fieldValue(d, lang('language.blockClose')))).toBe('end .');
        expect(tokensText(fieldValue(d, lang('language.blockOpen')))).toBe('');
    });

    it('the text splits on blanks into the array, an empty text clears the override (F5: the input string stored as is)', () => {
        expect(parseTokens('  begin   end ')).toEqual(['begin', 'end']);
        expect(parseTokens(' \t ')).toBeUndefined();
        const c = setField(setField(PORT_CLIKE, lang('language.blockOpen'), parseTokens('begin')), lang('language.blockClose'), parseTokens('end'));
        expect(c.style).toEqual({ blockOpen: ['begin'], blockClose: ['end'] });
        expect(readDraft(PORT_MM, PORT_IDS, c).faults.filter(f => f.level === 'error')).toEqual([]);
        expect(setField(c, lang('language.blockOpen'), parseTokens('')).style).toEqual({ blockClose: ['end'] });
        const p = setField(PORT_PASCAL, lang('language.blockClose'), parseTokens('end .'));
        expect(p.style).toEqual({ base: 'pascal', blockClose: ['end', '.'] });
        expect(setField(p, lang('language.blockClose'), parseTokens('end ;'))).toEqual(PORT_PASCAL);
    });

    it('a token with a quote is refused at its own field, with its reason (mutant: the finding at the Style row only)', () => {
        const d = setField(PORT_PASCAL, lang('language.blockClose'), parseTokens('end"'));
        const at = byField(readDraft(PORT_MM, PORT_IDS, d).faults).get('language#language.blockClose') ?? [];
        expect(at.map(f => f.level)).toEqual(['error']);
        expect(at[0].message).toMatch(/quote/);
    });

    it('Basic announces a token override in effect (mutant: the token rows not counted)', () => {
        const n = advancedInEffect(PORT_CLIKE, 'language');
        expect(advancedInEffect({ ...PORT_CLIKE, style: { blockOpen: ['begin'], list: { close: '>' } } }, 'language')).toBe(n + 2);
    });
});

describe('(7) the picker under token overrides, lane L2b (P-2026-11-05-2350)', () => {
    const decoded = (record: SyntaxAnnotations | null) => ({ record, issues: [] });
    const OVERRIDDEN: SyntaxAnnotations = { ...PORT_PASCAL, style: { base: 'pascal', blockClose: ['end', '.'] } };
    const PER_BLOCK: SyntaxAnnotations = { ...PORT_PASCAL, features: { ...PORT_PASCAL.features, F_Module_inputs: { blockOpen: ['is'] } } };

    it('the selected base reads <name> (custom) under a language-wide override, plain without (mutants: the label never custom; always custom)', () => {
        expect(styleEntryName(decoded(OVERRIDDEN), 'pascal')).toBe('Pascal/Ada (custom)');
        expect(styleEntryName(decoded(PORT_PASCAL), 'pascal')).toBe('Pascal/Ada');
        expect(styleEntryName(decoded(null), 'clike')).toBe('C-like');
        expect(styleEntryName(decoded({ ...PORT_CLIKE, style: { list: { close: '>' } } }), 'clike')).toBe('C-like (custom)');
    });

    it('only the selected base is custom, and per-block tokens or options do not count (mutants: every entry custom; the per-block entries counted; any style key counted)', () => {
        expect(styleEntryName(decoded(OVERRIDDEN), 'clike')).toBe('C-like');
        expect(styleEntryName(decoded(OVERRIDDEN), 'indent')).toBe('Indentation');
        expect(styleEntryName(decoded(PER_BLOCK), 'pascal')).toBe('Pascal/Ada');
        expect(styleEntryName(decoded({ ...PORT_PASCAL, style: { base: 'pascal', blankBeforeContainment: true } }), 'pascal')).toBe('Pascal/Ada');
    });

    it('switching the base drops the language-wide overrides and keeps the per-block ones (R-TXT-49 D10, R-TXT-52 D3)', () => {
        const both: SyntaxAnnotations = { ...PER_BLOCK, style: OVERRIDDEN.style };
        const switched = styleSwitchRecord(decoded(both), 'clike')!;
        expect(switched.style).toBeUndefined();
        expect(switched.features).toEqual(PER_BLOCK.features);
        expect(styleEntryName(decoded(switched), 'clike')).toBe('C-like');
        expect(styleSwitchRecord(decoded(both), 'pascal')).toBeNull();
    });

    it('the style tokens keep their islands in the EBNF mode (mutant: a style origin mapped to no field)', () => {
        const shown = ebnfOfDraft(PORT_MM, PORT_IDS, readDraft(PORT_MM, PORT_IDS, OVERRIDDEN).grammar)!;
        const style = shown.islands.filter(i => i.src.k === 'style');
        expect(style.length).toBeGreaterThan(0);
        expect(style.every(i => i.at.element === 'language')).toBe(true);
        expect(style.some(i => i.text === '.' && i.at.field === 'language.blockClose')).toBe(true);
    });
});

describe('(5) round trips under overrides', () => {
    const errors = (g: ConcreteGrammar): string[] => checkStyle(g).filter(f => f.level === 'error').map(f => `${f.rule}@${f.where}: ${f.message}`);
    /** Print, parse with no error, print byte for byte; the text, for the caller's own checks. */
    const roundTrip = (g: ConcreteGrammar, objects: readonly TextObject[]): string => {
        const text = printTextModel(g, objects).text;
        const r = parseText(text, g);
        expect(r.errors).toEqual([]);
        expect(printTextModel(g, r.objects).text).toBe(text);
        return text;
    };
    const PASCAL_OVERRIDE = { base: 'pascal', blockOpen: ['start'], blockClose: ['stop', '.'], assign: ['is'], terminator: ['!'] };
    const CLIKE_OVERRIDE = { blockOpen: ['<<'], blockClose: ['>>'], assign: ['<-'], list: { open: '<', separator: ';', close: '>' } };

    it.each([
        ['PORT, C-like', PORT_MM, PORT_IDS, { ...PORT_CLIKE, style: CLIKE_OVERRIDE }, portObjects, ['Module cpu <<', '<< >>']],
        ['PORT, Pascal', PORT_MM, PORT_IDS, { ...PORT_PASCAL, style: PASCAL_OVERRIDE }, portObjects, ['start', 'stop .']],
        ['BOOL, Pascal', BOOL_MM, BOOL_IDS, { ...BOOL_PASCAL, style: PASCAL_OVERRIDE }, boolObjects, ['start', 'stop .', '!']],
    ] as const)('%s: the overridden tokens print, no error, and the text reads back byte for byte', (_, mm, ids, record, objects, printed) => {
        const g = textualNotation(mm, { record: record as SyntaxAnnotations, issues: [] }, ids).grammar;
        expect(errors(g)).toEqual([]);
        const text = roundTrip(g, objects());
        for (const t of printed) expect(text).toContain(t);
    });

    const SPECS = [['the 1709 fixture', FIXTURE], ['a diamond', DIAMOND], ['a multiple inheritance without a diamond', NON_DIAMOND], ['the garage', GARAGE],
        ['a nameless recursive class', BOX], ['a single containment', INNER], ['two class keywords one case apart', CASES]] as const;
    it.each(SPECS.flatMap(([n, sp]) => [[n, 'C-like', sp, CLIKE_OVERRIDE], [n, 'Pascal', sp, PASCAL_OVERRIDE]] as const))('%s, %s with overrides: print, parse with no error, print byte for byte', (_, __, sp, style) => {
        const g = grammarOf(sp, effective(style));
        expect(errors(g)).toEqual([]);
        roundTrip(g, objectsOf(sp));
    });

    it('a ( ) block beside the call layout of Word(32): the expression\'s parentheses conflict and the LL(1) check reports it; without the operator they coexist (measured, report §4 open point)', () => {
        const parens = { blockOpen: ['('], blockClose: [')'] };
        const withOperator = textualNotation(PORT_MM, { record: { ...PORT_CLIKE, style: parens }, issues: [] }, PORT_IDS).grammar;
        expect(errors(withOperator)).toEqual(['annotations@rule Expr_: not LL(1): "(" can start Ref and the parentheses']);
        for (const style of [parens, { base: 'pascal', ...parens }]) {
            const g = textualNotation(PORT_MM, { record: { ...portWith({ C_Conj: {} }), style } as SyntaxAnnotations, issues: [] }, PORT_IDS).grammar;
            expect(errors(g)).toEqual([]);
            const text = roundTrip(g, portObjects());
            expect(text).toContain('input instr : Word(32)');
            expect(text).toMatch(/^Module cpu \(\n/);
        }
    });

    it('an object named like a new word token prints quoted and reads back with its name (mutant: the reserved names not following the word tokens)', () => {
        const g = textualNotation(PORT_MM, { record: { ...PORT_PASCAL, style: { base: 'pascal', blockOpen: ['start'] } }, issues: [] }, PORT_IDS).grammar;
        const objects = portObjects().map(o => (o.id === 'm' ? { ...o, slots: { ...o.slots, name: 'start' } } : o));
        const text = roundTrip(g, objects);
        expect(text.startsWith(`Module 'start' start\n`)).toBe(true);
        expect(parseText(text, g).objects.find(o => o.cls === 'Module')?.slots.name).toBe('start');
    });
});
