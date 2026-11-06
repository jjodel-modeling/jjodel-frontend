/**
 * D2a, the expected set at a cursor (P-2026-11-06-2118; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md
 * §3.2, §3.3 C1, decisions D2 and D10): under `ParseOptions.cursor` the parser lists what may stand at the first token at
 * or after the cursor, from the nodes it tested there, nullable ones included; without it, the result is unchanged.
 */

import { describe, expect, it } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { ExpectedItem, TextParseResult } from '../parser';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { GARAGE, grammarOf, LOWER } from './corpus';
import { portGrammar, portWith, PORT_CLIKE } from './portCorpus';
import { objectsOf } from './spec';

const CUT = '⎸';

/** Parses `marked` with the cursor at its `⎸`, which is not part of the text. */
const parseAt = (g: ConcreteGrammar, marked: string): TextParseResult => {
    const cursor = marked.indexOf(CUT);
    if (cursor < 0) throw new Error('no cursor in the text');
    return parseText(marked.replace(CUT, ''), g, { cursor });
};

/** One line per item: its kind and what it offers, sorted, without repeats. */
const shown = (r: TextParseResult): string[] => {
    const line = (e: ExpectedItem): string => {
        switch (e.kind) {
            case 'kw': case 'p': return `${e.kind} ${e.words!.join(' ')}`;
            case 'block': return `block ${e.side} ${e.words!.join(' ')}`;
            case 'lit': return `lit ${e.feature} ${e.literal}`;
            case 'xref': return `xref ${e.feature} ${e.matcher}`;
            case 'tok': return `tok ${e.feature} ${e.terminal} ${e.matcher}`;
        }
    };
    return [...new Set((r.expected ?? []).map(line))].sort();
};

const NAME = (feature: string): string[] => [`tok ${feature} NAME ID`, `tok ${feature} NAME STR`];
/** What starts an expression of the port: a Ref (its name, or its block), a parenthesis, the call word of `&`. */
const OPERAND = [...NAME('name'), 'block empty {}', 'block open {', 'kw and', 'p ('];

describe('D2a: the expected set at the seven cursors of the probe (report §3.2), C-like port', () => {
    const g = portGrammar();

    it('1: after a class keyword, the optional head name (F2) and the block', () => {
        expect(shown(parseAt(g, 'Module ⎸'))).toEqual([...NAME('name'), 'block empty {}', 'block open {'].sort());
    });

    it('2: on a new line of a body, its items and its close, before the end-of-text branch (F3)', () => {
        // The free layout lets the port above go on with its driver, so `=` may stand there too.
        const want = ['block close }', 'kw input', 'kw output', 'p ='].sort();
        expect(shown(parseAt(g, 'Module cpu {\n  input instr : Word(32)\n  ⎸\n}'))).toEqual(want);
        expect(shown(parseAt(g, 'Module cpu {\n  input instr : Word(32)\n  ⎸'))).toEqual(want);
    });

    it("3: after ':', the classes of the type, and nothing after them", () => {
        expect(shown(parseAt(g, 'Module cpu {\n  input instr : ⎸\n}'))).toEqual(['kw Bool', 'kw Word']);
    });

    it("4: after '=', what starts an operand", () => {
        expect(shown(parseAt(g, 'Module cpu {\n  output r : Bool = ⎸\n}'))).toEqual([...OPERAND].sort());
    });

    it('5: inside an expression, after an operator, what starts an operand', () => {
        expect(shown(parseAt(g, 'Module cpu {\n  output r : Bool = instr & ⎸\n}'))).toEqual([...OPERAND].sort());
    });

    it('6: an empty text, the top level (F5)', () => {
        expect(shown(parseAt(g, '⎸'))).toEqual(['kw Module']);
        expect(shown(parseAt(g, 'Module cpu {}\n⎸'))).toEqual(['kw Module']);
    });

    it("7: after an item keyword, the optional head name (F2) and ':', not what follows ':'", () => {
        expect(shown(parseAt(g, 'Module cpu {\n  input ⎸\n}'))).toEqual([...NAME('name'), 'p :'].sort());
    });

    it('an operand read: the operators that may follow it, then what may follow the expression', () => {
        // After an output, an input is out of order ("must come before"): not offered.
        expect(shown(parseAt(g, 'Module cpu {\n  output r : Bool = instr ⎸\n}'))).toEqual(['block close }', 'kw output', 'p &'].sort());
    });

    it('the cursor before a token that matches: what was tested up to reading it, not what follows it', () => {
        expect(shown(parseAt(g, 'Module ⎸cpu {}'))).toEqual(NAME('name'));
    });

    it('with no cursor, no expected set', () => {
        expect('expected' in parseText('Module ', g)).toBe(false);
    });
});

describe('D2a and D10: the tokens of step C at a cursor', () => {
    const gb = portGrammar(portWith({ C_Module: { blockOpen: ['is'], blockClose: ['end', 'module'], prefix: ['begin'] } } as never, {}, PORT_CLIKE));

    it('1b: an empty text offers the head prefix, not the class keyword after it', () => {
        expect(shown(parseAt(gb, '⎸'))).toEqual(['kw begin']);
    });

    it('1c: after the head prefix, the class keyword', () => {
        expect(shown(parseAt(gb, 'begin ⎸'))).toEqual(['kw Module']);
    });

    it("a per-block open: after the head, the block's own open", () => {
        const got = shown(parseAt(gb, 'begin Module cpu ⎸\n  input : Bool\nend module'));
        expect(got).toContain('block open is');
        expect(got.some(x => x.includes('{'))).toBe(false);
    });

    it('2b: inside a per-block body, its items and its multi-word close, whole', () => {
        expect(shown(parseAt(gb, 'begin Module cpu is\n  ⎸\nend module'))).toEqual(['block close end module', 'kw input', 'kw output'].sort());
        expect(shown(parseAt(gb, 'begin Module cpu is\n  input : Bool\n  ⎸\nend module'))).toEqual(['block close end module', 'kw input', 'kw output', 'p ='].sort());
    });

    it('2c: a multi-word close begun offers its rest only (F4)', () => {
        expect(shown(parseAt(gb, 'begin Module cpu is\n  input : Bool\nend ⎸'))).toEqual(['block close module']);
        expect(shown(parseAt(gb, 'begin Module cpu is\n  input : Bool\nend ⎸\n'))).toEqual(['block close module']);
    });
});

describe('D2a: references and enumeration literals (corpus B, report F6)', () => {
    const g = grammarOf(GARAGE);
    const text = printTextModel(g, objectsOf(GARAGE)).text;

    it('a reference value is an xref item with its targets, type and feature', () => {
        const at = text.indexOf('best ') + 'best '.length;
        const r = parseText(text, g, { cursor: at });
        const xs = (r.expected ?? []).filter(e => e.kind === 'xref');
        expect(xs.map(x => x.matcher).sort()).toEqual(['ID', 'P:@', 'STR']);
        expect(xs.every(x => x.feature === 'best' && x.type === 'Item' && x.targets!.includes('Wheel') && x.targets!.includes('Car'))).toBe(true);
        expect((r.expected ?? []).some(e => e.kind !== 'xref')).toBe(false);
    });

    it('an enumeration value is one lit item per literal, cased as the text writes it', () => {
        const at = text.indexOf('colors [') + 'colors ['.length;
        const r = parseText(text, g, { cursor: at });
        const ls = (r.expected ?? []).filter(e => e.kind === 'lit');
        expect(ls.map(l => [l.literal, l.matcher])).toEqual([['Red', 'ID:Red'], ['GREEN', 'ID:GREEN'], ['blue', 'ID:blue']]);
        expect(ls.every(l => l.feature === 'colors' && l.rule === 'Color')).toBe(true);
        const lower = grammarOf(GARAGE, LOWER);
        const lt = printTextModel(lower, objectsOf(GARAGE)).text;
        const rl = parseText(lt, lower, { cursor: lt.indexOf('colors [') + 'colors ['.length });
        expect((rl.expected ?? []).filter(e => e.kind === 'lit').map(l => l.matcher)).toEqual(['ID:red', 'ID:green', 'ID:blue']);
    });
});
