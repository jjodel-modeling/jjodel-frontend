/**
 * Step C lane C1b (P-2026-11-04-0938; R-TXT-41 D1; docs/discovery/discovery_2026-11-04_textual_step_c.md §2.2): the
 * expressions of the textual notation in the tokenizer, the parser and the printer, on BOOL and ARITH (boolCorpus.ts).
 */

import { describe, expect, it } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { SyntaxElement, SyntaxNode, TextNode, TextParseResult } from '../parser';
import { isApplicableParse, parseText, tokenizeText } from '../parser';
import { printTextModel } from '../printer';
import { BOOL_CLIKE, BOOL_PASCAL, BOOL_PRINTS, arithGrammar, boolGrammar, boolSheet, withOperator } from './boolCorpus';

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

const sheet = boolSheet;

/** The `when` of each rule as a term: an atom's name, a literal's value, else `Class(operands)`. */
function termsOf(r: Pick<TextParseResult, 'objects'>): string[] {
    const byId = new Map(r.objects.map(o => [o.id, o]));
    const term = (id: unknown): string => {
        const o = byId.get(String(id));
        if (!o) return `?${String(id)}`;
        if (o.cls === 'Use') return String(byId.get(String(o.slots.atom))?.slots.name);
        if (o.cls === 'Lit') return String(o.slots.value);
        const ops = ['ops', 'left', 'right', 'op'].flatMap(f => (o.slots[f] === undefined ? [] : Array.isArray(o.slots[f]) ? o.slots[f] as unknown[] : [o.slots[f]]));
        return `${o.cls}(${ops.map(term).join(', ')})`;
    };
    return r.objects.filter(o => o.cls === 'Rule').map(o => term(o.slots.when));
}

const nodesOf = (n: SyntaxNode): SyntaxNode[] => [n, ...n.children.flatMap(c => (c.kind === 'token' ? [] : nodesOf(c)))];
const shape = (c: SyntaxElement): string => (c.kind === 'token' ? c.raw : c.kind);

describe('(2) the parser: precedence climbing on the expression', () => {
    const read = (g: ConcreteGrammar, ...whens: string[]): TextParseResult => parseText(sheet(...whens), g);

    it('BOOL: precedence, a flat chain per class, right associativity, prefix operators', () => {
        const r = read(boolGrammar(BOOL_CLIKE), 'st | ld & rdy', 'st & ld | rdy', '!st & ld', '!(st & ld)', 'st & ld & rdy', '(st & ld) & rdy',
            'st -> ld -> rdy', '(st -> ld) -> rdy', '1 | !!st', 'st & ld -> rdy | st');
        expect(r.errors).toEqual([]);
        expect(isApplicableParse(r)).toBe(true);
        expect(termsOf(r)).toEqual([
            'Or(st, And(ld, rdy))', 'Or(And(st, ld), rdy)', 'And(Not(st), ld)', 'Not(And(st, ld))', 'And(st, ld, rdy)', 'And(And(st, ld), rdy)',
            'Imp(st, Imp(ld, rdy))', 'Imp(Imp(st, ld), rdy)', 'Or(1, Not(Not(st)))', 'Imp(And(st, ld), Or(rdy, st))',
        ]);
    });

    it('BOOL: the call form, with 0, 1 or more operands', () => {
        const r = read(boolGrammar(BOOL_CLIKE), 'and()', 'or(is_sw)', 'st & or(is_sw)', 'and(st, ld | rdy)', 'or(st & ld)');
        expect(r.errors).toEqual([]);
        expect(termsOf(r)).toEqual(['And()', 'Or(is_sw)', 'And(st, Or(is_sw))', 'And(st, Or(ld, rdy))', 'Or(And(st, ld))']);
    });

    it('ARITH: "+" and "-" one level, left to right; a prefix minus where no operand precedes; the sign of a number', () => {
        const r = read(arithGrammar(), 'st - ld + rdy', 'st + ld - rdy', '-st - ld', 'st - -ld', 'st -1', 'st - -1', '-1', '- 1', '-st & ld', '-(st + ld)', 'st + ld & rdy', '--st');
        expect(r.errors).toEqual([]);
        expect(termsOf(r)).toEqual([
            'Add(Sub(st, ld), rdy)', 'Sub(Add(st, ld), rdy)', 'Sub(Neg(st), ld)', 'Sub(st, Neg(ld))', 'Sub(st, 1)', 'Sub(st, -1)', '-1', 'Neg(1)',
            'And(Neg(st), ld)', 'Neg(Add(st, ld))', 'And(Add(st, ld), rdy)', 'Neg(Neg(st))',
        ]);
    });

    it('st & (is_sw) reads And(st, is_sw), with a paren node around the operand; the operator object holds its operands', () => {
        const text = sheet('st & (is_sw)');
        const r = parseText(text, boolGrammar(BOOL_CLIKE));
        expect(r.errors).toEqual([]);
        expect(termsOf(r)).toEqual(['And(st, is_sw)']);
        const nodes = nodesOf(r.tree as TextNode);
        const and = nodes.find(n => n.kind === 'object' && n.cls === 'And')!;
        expect(and.children.map(shape)).toEqual(['item', '&', 'item']);
        const paren = nodes.find(n => n.kind === 'paren')!;
        expect(paren.children.map(shape)).toEqual(['(', 'object', ')']);
        expect(text.slice(and.start, and.end)).toBe('st & (is_sw)');
        const use = r.spans.find(s => text.slice(s.start, s.end) === 'is_sw');
        expect(use).toBeDefined();
        expect(nodes.filter(n => n.kind === 'object').map(n => n.kind === 'object' && n.cls)).toEqual(['Sheet', 'Atom', 'Atom', 'Atom', 'Atom', 'Rule', 'And', 'Use', 'Use']);
    });

    it('errors carry their position; a bad expression costs its line, the next rule is read', () => {
        const text = sheet('st & & ld', 'st | ld');
        const r = parseText(text, boolGrammar(BOOL_CLIKE));
        const line = text.split('\n').findIndex(l => l.includes('st & & ld'));
        expect(r.errors.map(e => [e.line, e.col])).toEqual([[line + 1, text.split('\n')[line].lastIndexOf('&') + 1]]);
        expect(r.errors[0].message).toMatch(/^expected .*; found "&"$/);
        expect(termsOf(r)[1]).toBe('Or(st, ld)');
        expect(isApplicableParse(r)).toBe(false);
        const rule1 = nodesOf(r.tree as TextNode).find(n => n.kind === 'object' && n.cls === 'Rule' && text.slice(n.start, n.end).includes('st | ld'));
        expect(rule1?.kind === 'object' && rule1.state).toBe('complete');
    });

    it('a parenthesis or a call left open at the end of its line, an operand missing before a close', () => {
        const g = boolGrammar(BOOL_CLIKE);
        for (const [when, message] of [['(st & ld', 'expected ")"; found "}"'], ['or(st, ld', 'expected ")"; found "}"'], ['st &', '; found "}"']] as const) {
            const r = parseText(sheet(when, 'st'), g);
            expect(r.errors.length, when).toBe(1);
            expect(r.errors[0].message, when).toContain(message);
            expect(r.errors[0].line, when).toBe(12);
            expect(termsOf(r)[1], when).toBe('st');
            expect(isApplicableParse(r), when).toBe(false);
        }
    });

    it('call words and word symbols are no names', () => {
        const r = parseText(sheet('and'), boolGrammar(BOOL_CLIKE));
        expect(r.errors[0].message).toMatch(/^expected "\(";/);
    });
});

describe('(3) the printer: flat chains, parentheses where the parser needs them, the call form, prefix', () => {
    /** The text the printer writes from the model a C-like BOOL or ARITH text reads into. */
    const reprint = (g: ConcreteGrammar, whens: readonly string[], out = g): string => printTextModel(out, parseText(sheet(...whens), g).objects).text;

    it('BOOL: every expression prints on one line, in the form listed (boolCorpus.ts BOOL_PRINTS)', () => {
        expect(reprint(boolGrammar(BOOL_CLIKE), BOOL_PRINTS.map(([w]) => w))).toBe(sheet(...BOOL_PRINTS.map(([, p]) => p)));
    });

    it('ARITH: a prefix minus glued to its operand unless they would read as one token; a negative number; one level, left to right', () => {
        const prints = [['st - ld + rdy', 'st - ld + rdy'], ['st + (ld - rdy)', 'st + (ld - rdy)'], ['st - (ld + rdy)', 'st - (ld + rdy)'], ['-st - ld', '-st - ld'],
            ['st - -ld', 'st - -ld'], ['st -1', 'st - 1'], ['st - -1', 'st - -1'], ['-1', '-1'], ['- 1', '- 1'], ['-(st + ld)', '-(st + ld)'], ['--st', '--st'],
            ['- -1', '--1'], ['-st & ld', '-st & ld'], ['st & -ld', 'st & -ld']] as const;
        expect(reprint(arithGrammar(), prints.map(([w]) => w))).toBe(sheet(...prints.map(([, p]) => p)));
    });

    it('Pascal/Ada: word symbols spaced, the call form absent: a flat chain of two operands or more', () => {
        const text = reprint(boolGrammar(BOOL_CLIKE), ['st | ld & rdy', '!(st & ld)', 'st -> ld -> rdy', '(st & ld) & rdy'], boolGrammar(BOOL_PASCAL));
        const whens = text.split('\n').filter(l => /^ {8}\S/.test(l)).map(l => l.trim());
        // The ";" after each atom is the style terminator the C1a grammar puts in a primary's feature (concreteGrammar.ts
        // `feature`), outside this lane: the text reads back, and whether a primary drops it is a decision left open.
        expect(whens).toEqual(['st; or ld; and rdy;', 'not (st; and ld;)', 'st; implies ld; implies rdy;', '(st; and ld;) and rdy;']);
    });

    it('a name that is an expression word is quoted', () => {
        const objects = parseText(sheet('st'), boolGrammar(BOOL_CLIKE)).objects.map(o => (o.slots.name === 'st' ? { ...o, slots: { ...o.slots, name: 'and' } } : o));
        const text = printTextModel(boolGrammar(BOOL_CLIKE), objects).text;
        expect(text).toContain('Atom "and" {}');
        expect(parseText(text, boolGrammar(BOOL_CLIKE)).errors).toEqual([]);
    });
});

describe('(4) the round trip: print, parse, print, byte for byte', () => {
    it.each([
        ['BOOL, C-like', boolGrammar(BOOL_CLIKE), boolGrammar(BOOL_CLIKE), BOOL_PRINTS.map(([w]) => w)],
        ['BOOL, Pascal/Ada', boolGrammar(BOOL_CLIKE), boolGrammar(BOOL_PASCAL), BOOL_PRINTS.map(([w]) => w).filter(w => !/\b(and|or)\(/.test(w))],
        ['ARITH', arithGrammar(), arithGrammar(), ['st - ld + rdy', '-st - (ld + -1)', '- 1 + st', '--st', 'st & -(ld - 1)', '- -1', 'st - -1']],
    ] as const)('%s', (_, source, g, whens) => {
        const first = printTextModel(g, parseText(sheet(...whens), source).objects).text;
        const r = parseText(first, g);
        expect(r.errors).toEqual([]);
        expect(isApplicableParse(r)).toBe(true);
        expect(printTextModel(g, r.objects).text).toBe(first);
    });
});
