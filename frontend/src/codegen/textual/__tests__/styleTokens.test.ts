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
import { CLIKE_STYLE, PASCAL_STYLE, styleOf } from '../style';
import type { NotationStyle } from '../style';

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
