/**
 * Editable EBNF literals, step 2, lane L2a (P-2026-11-05-1430; docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md
 * §4, R-TXT-48 (2), R-TXT-49 D9 D10 D11 D12): the style tokens as overrides on `style.base`, whole arrays per parameter.
 * The resolution validates them and the effective style derives from them; the record drops them on a base switch and
 * writes them in a fixed order; the style check's `style-tokens` rule; the form's field per parameter.
 * Mutations each test kills are in its name; the bench is in the commit bodies.
 */

import { describe, expect, it } from 'vitest';
import { resolveAnnotations, withStyleOptions } from '../annotations';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel } from '../metamodel';
import { CLIKE_STYLE, INDENT_STYLE, PASCAL_STYLE, styleOf } from '../style';
import type { NotationStyle } from '../style';
import { checkStyle } from '../styleCheck';
import { decodeSyntax, encodeSyntax, textualNotation, withStyleBase } from '../syntaxRecord';
import { PORT_CLIKE, PORT_IDS, PORT_MM, PORT_PASCAL } from './portCorpus';
import { GARAGE, grammarOf } from './corpus';

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
