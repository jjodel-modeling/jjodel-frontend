/**
 * D2a, the expected set at a cursor (P-2026-11-06-2118; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md
 * §3.2, §3.3 C1, decisions D2 and D10): under `ParseOptions.cursor` the parser lists what may stand at the first token at
 * or after the cursor, from the nodes it tested there, nullable ones included; without it, the result is unchanged.
 *
 * D2b, the candidates at a cursor (P-2026-11-06-2146; report §3.3 C2 and C3, decisions D3 and D10): `completionsAt` turns
 * the expected set into the words to write, each with its kind and the range it replaces.
 */

import { describe, expect, it } from 'vitest';
import type { ConcreteGrammar, GrammarNode } from '../concreteGrammar';
import type { TextCompletion } from '../languageService';
import { analyzeText, completionsAt } from '../languageService';
import type { ExpectedItem, TextParseResult } from '../parser';
import { parseText } from '../parser';
import { printTextModel, textNaming } from '../printer';
import { BOOL_CLIKE, BOOL_PRINTS, boolGrammar, boolSheet } from './boolCorpus';
import { BOX, CASES, DIAMOND, GARAGE, grammarOf, INNER, LOWER, NON_DIAMOND } from './corpus';
import { portGrammar, portObjects, portWith, PORT_CLIKE, PORT_MM, PORT_PASCAL, PORT_TEXT_CLIKE, PORT_TEXT_PASCAL } from './portCorpus';
import { metamodelOf, objectsOf } from './spec';
import type { Spec } from './spec';
import { mutantsOf, probeTokens, tolerantCases } from './tolerantCorpus';

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

/** The targets of the reference `feat` of class `cls`, read off its object rule. */
const targetsOf = (g: ConcreteGrammar, cls: string, feat: string): readonly string[] | undefined => {
    const walk = (n: GrammarNode, f: string | undefined): readonly string[] | undefined => {
        switch (n.t) {
            case 'xref': return f === feat ? n.targets : undefined;
            case 'seq': case 'block': for (const x of n.items) { const r = walk(x, f); if (r) return r; } return undefined;
            case 'alt': for (const x of n.alts) { const r = walk(x, f); if (r) return r; } return undefined;
            case 'assign': case 'list': return walk(n.item, n.feat);
            case 'opt': case 'star': return walk(n.item, f);
            default: return undefined;
        }
    };
    const body = g.objects[cls]?.body;
    return body ? walk(body, undefined) : undefined;
};

describe('D2b, C3: the printer writes every reference through the exported writer', () => {
    it('on corpus B, every reference token of a print is what `textNaming` writes for its target', () => {
        const specs: [string, Spec][] = [['diamond', DIAMOND], ['non-diamond', NON_DIAMOND], ['garage', GARAGE], ['box', BOX], ['cases', CASES], ['inner', INNER]];
        let compared = 0;
        let paths = 0;
        for (const [label, spec] of specs) {
            for (const style of [undefined, LOWER]) {
                const g = grammarOf(spec, style);
                const objects = objectsOf(spec);
                const byId = new Map(objects.map(o => [o.id, o]));
                const naming = textNaming(g, objects);
                for (const r of printTextModel(g, objects).refs ?? []) {
                    const t = byId.get(r.target);
                    if (!t) continue;
                    const owner = byId.get(r.owner)!;
                    expect(naming.ref(targetsOf(g, owner.cls, r.feature)!, t), `${label}, ${r.owner}.${r.feature}`).toBe(r.text);
                    if (r.text.includes('[')) { expect(naming.path(t)).toBe(r.text); paths++; }
                    compared++;
                }
            }
        }
        expect(compared).toBeGreaterThan(20);
        expect(paths).toBeGreaterThan(5);
    });
});

/** The candidates at the `⎸` of `marked`, as `kind label`, sorted, and the candidates themselves. */
const offeredAt = (g: ConcreteGrammar, mm: Parameters<typeof completionsAt>[3], marked: string): { readonly shown: string[]; readonly all: TextCompletion[]; readonly at: number } => {
    const at = marked.indexOf(CUT);
    if (at < 0) throw new Error('no cursor in the text');
    const all = completionsAt(marked.replace(CUT, ''), at, g, mm);
    return { shown: all.map(c => `${c.kind} ${c.label}`).sort(), all, at };
};

describe('D2b: the candidates at the seven cursors of the probe (report §3.2), C-like port', () => {
    const g = portGrammar();
    const at = (marked: string): string[] => offeredAt(g, PORT_MM, marked).shown;
    /** What starts an operand: no candidate for a new Ref's name, its block, a parenthesis, the call word of `&`. */
    const OPERAND = ['keyword (', 'keyword and', 'keyword {', 'keyword {}'];

    it('1: after a class keyword, the block; no candidate for the new name', () => {
        expect(at('Module ⎸')).toEqual(['keyword {', 'keyword {}']);
    });

    it("2: on a new line of a body, its items, `=` and the close", () => {
        expect(at('Module cpu {\n  input instr : Word(32)\n  ⎸\n}')).toEqual(['keyword =', 'keyword input', 'keyword output', 'keyword }']);
    });

    it("3: after ':', the classes of the type", () => {
        expect(at('Module cpu {\n  input instr : ⎸\n}')).toEqual(['keyword Bool', 'keyword Word']);
    });

    it("4 and 5: after '=' and after an operator, what starts an operand", () => {
        expect(at('Module cpu {\n  output r : Bool = ⎸\n}')).toEqual(OPERAND);
        expect(at('Module cpu {\n  output r : Bool = instr & ⎸\n}')).toEqual(OPERAND);
    });

    it('6: an empty text, the class keyword', () => {
        expect(at('⎸')).toEqual(['keyword Module']);
    });

    it("7: after an item keyword, ':' only", () => {
        expect(at('Module cpu {\n  input ⎸\n}')).toEqual(['keyword :']);
    });

    it('after a space a candidate replaces nothing; on a word begun it replaces the word', () => {
        const blank = offeredAt(g, PORT_MM, 'Module cpu {\n  input instr : ⎸\n}');
        expect(blank.all.every(c => c.start === blank.at && c.end === blank.at)).toBe(true);
        const begun = offeredAt(g, PORT_MM, 'Module cpu {\n  input instr : Wo⎸\n}');
        expect(begun.shown).toEqual(['keyword Bool', 'keyword Word']);
        expect(begun.all.every(c => c.start === begun.at - 2 && c.end === begun.at)).toBe(true);
        const inside = offeredAt(g, PORT_MM, 'Module cpu {\n  input instr : W⎸o\n}');
        expect(inside.all.every(c => c.start === inside.at - 1 && c.end === inside.at + 1)).toBe(true);
    });
});

describe('ticket #687: no candidate inside a comment or a string, so Enter breaks the line', () => {
    const g = portGrammar();
    const at = (marked: string): string[] => offeredAt(g, PORT_MM, marked).shown;
    /** An empty body's items and its close (no `=`: no item before it). */
    const BODY = ['keyword input', 'keyword output', 'keyword }'];

    it('inside a line comment and at its end, before a line break or the end of the text', () => {
        expect(at('Module cpu {} // end st⎸ate\n')).toEqual([]);
        expect(at('Module cpu {} // end state⎸\n')).toEqual([]);
        expect(at('Module cpu {} // end state⎸')).toEqual([]);
        expect(at('Module cpu {\n  // the ⎸inputs\n  input : Bool\n}')).toEqual([]);
        expect(at('Module cpu {\n  input : Bool // a flag⎸\n}')).toEqual([]);
    });

    it('inside a block comment, closed or not', () => {
        expect(at('Module cpu {\n  /* the ⎸inputs */\n}')).toEqual([]);
        expect(at('Module cpu {\n  /* the inputs⎸')).toEqual([]);
    });

    it('inside a string', () => {
        expect(at('Module "cp⎸u" {}')).toEqual([]);
        expect(at('Module "⎸" {}')).toEqual([]);
    });

    it('the comment markers of the pascal style', () => {
        const gp = portGrammar(PORT_PASCAL);
        expect(offeredAt(gp, PORT_MM, 'Module cpu begin end; -- end state⎸\n').shown).toEqual([]);
        expect(offeredAt(gp, PORT_MM, 'Module cpu begin\n  (* the ⎸inputs *)\nend;').shown).toEqual([]);
    });

    it('unchanged elsewhere: before a comment, after it, on the next line, around a string', () => {
        expect(at('Module cpu {\n  ⎸// the inputs\n}')).toEqual(BODY);
        expect(at('Module cpu {\n  /* the inputs */ ⎸\n}')).toEqual(BODY);
        expect(at('Module cpu {\n  // the inputs\n  ⎸\n}')).toEqual(BODY);
        expect(at('Module cpu {} // end state\n⎸')).toEqual(['keyword Module']);
        expect(at('Module ⎸"cpu" {}')).toEqual(at('Module ⎸cpu {}'));
        expect(at('Module "cpu" ⎸')).toEqual(['keyword {', 'keyword {}']);
    });
});

describe('D2b and D10: the tokens of step C as keywords', () => {
    const gb = portGrammar(portWith({ C_Module: { blockOpen: ['is'], blockClose: ['end', 'module'], prefix: ['begin'] } } as never, {}, PORT_CLIKE));
    const at = (marked: string): string[] => offeredAt(gb, PORT_MM, marked).shown;

    it('the head prefix, then the class keyword after it', () => {
        expect(at('⎸')).toEqual(['keyword begin']);
        expect(at('begin ⎸')).toEqual(['keyword Module']);
    });

    it("the per-block open, and the multi-word close whole", () => {
        expect(at('begin Module cpu ⎸\n  input : Bool\nend module')).toContain('keyword is');
        expect(at('begin Module cpu is\n  ⎸\nend module')).toEqual(['keyword end module', 'keyword input', 'keyword output']);
    });

    it('a half-typed close offers its rest', () => {
        expect(at('begin Module cpu is\n  input : Bool\nend ⎸')).toEqual(['keyword module']);
        const begun = offeredAt(gb, PORT_MM, 'begin Module cpu is\n  input : Bool\nend mo⎸');
        expect(begun.shown).toEqual(['keyword module']);
        expect(begun.all.map(c => [c.start, c.end])).toEqual([[begun.at - 2, begun.at]]);
    });
});

describe('D2b and D3: references and enumeration literals (corpus B)', () => {
    const g = grammarOf(GARAGE);
    const mm = metamodelOf(GARAGE);
    const text = printTextModel(g, objectsOf(GARAGE)).text;
    /** The text with the value after `head` cut out and the cursor in its place. */
    const cutAfter = (head: string, value: string): string => {
        const k = text.indexOf(head + value);
        if (k < 0) throw new Error(`no ${head}${value} in the text`);
        return text.slice(0, k + head.length) + CUT + text.slice(k + head.length + value.length);
    };

    it('the targets of a reference, written as the printer writes them: a duplicate name by path, `@"id"` never', () => {
        const { shown, all } = offeredAt(g, mm, cutAfter('best ', 'Car[0].wheels[0]'));
        expect(shown).toEqual([
            'reference "it\'s \\"odd\\""', 'reference Car[0].wheels[0]', 'reference Car[0].wheels[1]',
            'reference alpha', 'reference beta', 'reference inner', 'reference v',
        ]);
        expect(all.some(c => c.label.startsWith('@'))).toBe(false);
        expect(all.some(c => c.label === 'w')).toBe(false);
    });

    it('a reference begun: the same targets, replacing the word', () => {
        const { shown, all, at } = offeredAt(g, mm, cutAfter('tow ', 'beta').replace(CUT, `al${CUT}`));
        expect(shown).toEqual(['reference alpha', 'reference beta', 'reference inner']);
        expect(all.every(c => c.start === at - 2 && c.end === at)).toBe(true);
    });

    it('a target with no name is offered by its path only', () => {
        expect(offeredAt(g, mm, cutAfter('eng ', 'Engine[0]')).shown).toEqual(['reference Car[0].engine[0]', 'reference Engine[0]']);
        const gx = grammarOf(BOX);
        const bt = printTextModel(gx, objectsOf(BOX)).text;
        const k = bt.indexOf('tag ') + 'tag '.length;
        const value = bt.slice(k).split(/\s/)[0];
        const got = offeredAt(gx, metamodelOf(BOX), bt.slice(0, k) + CUT + bt.slice(k + value.length));
        expect(got.shown).toEqual([`reference ${value}`]);
        expect(value).toMatch(/\[\d+\]$/);
    });

    it('enumeration literals in their cased form, with the hover of the literal', () => {
        const marked = cutAfter('colors [', 'Red');
        const { all } = offeredAt(g, mm, marked);
        const lits = all.filter(c => c.kind === 'literal');
        expect(lits.map(c => c.label)).toEqual(['Red', 'GREEN', 'blue']);
        const hover = analyzeText(text, parseText(text, g), g, mm).hoverAt(marked.indexOf(CUT));
        expect(hover).not.toBeNull();
        expect(lits[0].doc).toEqual(hover!.contents);
        const lower = grammarOf(GARAGE, LOWER);
        const lt = printTextModel(lower, objectsOf(GARAGE)).text;
        const lk = lt.indexOf('colors [') + 'colors ['.length;
        expect(completionsAt(lt, lk, lower, mm).filter(c => c.kind === 'literal').map(c => c.label)).toEqual(['red', 'green', 'blue']);
    });
});

/** Every text of the corpus, with the grammar it is read by and the cursors to try: prints, then broken texts. */
function corpus(): { readonly label: string; readonly g: ConcreteGrammar; readonly text: string; readonly cursors: readonly number[] }[] {
    const out: { label: string; g: ConcreteGrammar; text: string; cursors: number[] }[] = [];
    const everyToken = (g: ConcreteGrammar, text: string): number[] => [0, ...probeTokens(text, g.style).flatMap(t => [t.start, t.end]), text.length];
    const add = (label: string, g: ConcreteGrammar, text: string): void => { out.push({ label, g, text, cursors: everyToken(g, text) }); };
    const specs: [string, Spec][] = [['diamond', DIAMOND], ['non-diamond', NON_DIAMOND], ['garage', GARAGE], ['box', BOX], ['cases', CASES], ['inner', INNER]];
    for (const [name, spec] of specs) {
        for (const [sn, style] of [['c-like', undefined], ['lower', LOWER]] as const) {
            const g = grammarOf(spec, style);
            add(`${name}, ${sn}`, g, printTextModel(g, objectsOf(spec)).text);
        }
    }
    add('port, c-like', portGrammar(), PORT_TEXT_CLIKE);
    add('port, pascal', portGrammar(PORT_PASCAL), PORT_TEXT_PASCAL);
    const gb = portGrammar(portWith({ C_Module: { blockOpen: ['is'], blockClose: ['end', 'module'], prefix: ['begin'] } } as never, {}, PORT_CLIKE));
    add('port, block tokens', gb, printTextModel(gb, portObjects()).text);
    const gbool = boolGrammar(BOOL_CLIKE);
    BOOL_PRINTS.forEach(([read], k) => add(`bool ${k}`, gbool, boolSheet(read)));
    for (const base of ['clike', 'pascal', 'indent'] as const) {
        for (const c of tolerantCases(base)) {
            const { text, mutants } = mutantsOf(c);
            add(`${c.name}, ${base}`, c.g, text);
            // A broken text, with the cursor at its fault and at its end.
            for (const m of mutants) out.push({ label: `${c.name}, ${base}, ${m.kind} at ${m.at}`, g: c.g, text: m.text, cursors: [m.at, m.text.length] });
        }
    }
    return out;
}

describe('D2a, CLAUDE.md §5: the cursor changes nothing but the expected set', () => {
    it('on the whole textual corpus, a parse with a cursor equals the parse without one, but for `expected`', () => {
        let compared = 0;
        for (const { label, g, text, cursors } of corpus()) {
            const base = parseText(text, g);
            expect('expected' in base, label).toBe(false);
            for (const cursor of new Set(cursors)) {
                const { expected, ...rest } = parseText(text, g, { cursor });
                expect(rest, `${label}, cursor ${cursor}`).toEqual(base);
                expect(Array.isArray(expected), `${label}, cursor ${cursor}`).toBe(true);
                compared++;
            }
        }
        expect(compared).toBeGreaterThan(1000);
    }, 120_000);
});
