/**
 * Step C lane C1b (P-2026-11-04-0938; R-TXT-41 D1; docs/discovery/discovery_2026-11-04_textual_step_c.md §2.2): the
 * expressions of the textual notation in the tokenizer, the parser and the printer, on BOOL and ARITH (boolCorpus.ts).
 */

import { describe, expect, it } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import { tokenizeText } from '../parser';
import { BOOL_CLIKE, arithGrammar, boolGrammar, withOperator } from './boolCorpus';

const tokensOf = (text: string, g: ConcreteGrammar): string[] => tokenizeText(text, g).tokens.filter(t => t.k !== 'EOF').map(t => `${t.k}:${t.v}`);

describe('(1) the tokenizer: operator symbols and the sign of a number', () => {
    it('operator symbols and the parentheses are punctuation, longest match first', () => {
        const g = boolGrammar(BOOL_CLIKE);
        expect(tokensOf('st & (ld|rdy) -> !st', g)).toEqual(['ID:st', 'P:&', 'P:(', 'ID:ld', 'P:|', 'ID:rdy', 'P:)', 'P:->', 'P:!', 'ID:st']);
        expect(tokenizeText('st & ld', g).errors).toEqual([]);
    });

    it('with a symbol starting with "-", the sign is folded only where no operand ends before it', () => {
        const g = arithGrammar();
        expect(tokensOf('st -1', g)).toEqual(['ID:st', 'P:-', 'INT:1']);
        expect(tokensOf('2 -1', g)).toEqual(['INT:2', 'P:-', 'INT:1']);
        expect(tokensOf('"s" -1', g)).toEqual(['STR:s', 'P:-', 'INT:1']);
        expect(tokensOf('(st) -1.5', g)).toEqual(['P:(', 'ID:st', 'P:)', 'P:-', 'FLOAT:1.5']);
        expect(tokensOf('st - -1', g)).toEqual(['ID:st', 'P:-', 'INT:-1']);
        expect(tokensOf('st+-1', g)).toEqual(['ID:st', 'P:+', 'INT:-1']);
        expect(tokensOf('(-1)', g)).toEqual(['P:(', 'INT:-1', 'P:)']);
        expect(tokensOf('-1', g)).toEqual(['INT:-1']);
    });

    it('without such a symbol reading there the lexer is unchanged: the sign is part of the number', () => {
        expect(tokensOf('st -1', boolGrammar(BOOL_CLIKE))).toEqual(['ID:st', 'INT:-1']);
        expect(tokenizeText('st -1', boolGrammar(BOOL_CLIKE)).errors).toEqual([]);
        expect(tokensOf('st -1', boolGrammar(withOperator(BOOL_CLIKE, 'C_Imp', { symbol: '=>', precedence: 1, assoc: 'right' })))).toEqual(['ID:st', 'INT:-1']);
    });
});
