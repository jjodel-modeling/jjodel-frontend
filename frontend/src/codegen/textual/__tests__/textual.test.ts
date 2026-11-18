/**
 * Step T1 of the textual notation (P-2026-11-01-2320; R-TXT-16, docs/discovery/discovery_2026-11-01_textual_viewpoint.md
 * §A.1, §A.2, §A.7): the base grammar, the C-like style, the EBNF and the printer, checked against the addendum's
 * outputs and, byte for byte, against the shipped JjGen generator (R-TXT-14) on the 1709 fixture and a corpus.
 */

import { describe, it, expect } from 'vitest';
import { baseGrammarText, deriveBaseGrammar } from '../baseGrammar';
import { concreteGrammarEbnf } from '../concreteGrammar';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { BOX, CASES, DIAMOND, GARAGE, grammarOf, INNER, LOWER, NON_DIAMOND } from './corpus';
import { FIXTURE, metamodelOf, objectsOf, referenceText, shippedTemplates } from './spec';
import type { Spec } from './spec';

const printed = (spec: Spec, style: NotationStyle = CLIKE_STYLE): string => printTextModel(grammarOf(spec, style), objectsOf(spec)).text;

// The addendum §A.1 (`out-base.txt` of the probe P-2026-11-01-2232), verbatim.
const FIXTURE_BASE = `Model ::= (Obj_Sys | Obj_Part | Obj_Link)*
Named_ ::= Obj_Sys | Obj_Part
Obj_Sys ::= HEAD("Sys") NAME? BODY(FEAT("doc", STRING)? FEAT("width", INT)? FEAT("depth", INT)? FEAT("enabled", BOOL)? FEAT("ready", BOOL)? FEAT("label", STRING)? FEAT("note", STRING)? FEAT("mode", Mode)? FEAT("tags", LIST(STRING))? FEAT("empty", LIST(STRING))? FEAT("level", INT)? FEAT("count", INT)? FEAT("parts", BLOCK(Obj_Part*))? FEAT("links", BLOCK(Obj_Link*))? FEAT("main", REF)?)
Obj_Part ::= HEAD("Part") NAME? BODY(FEAT("doc", STRING)? FEAT("size", INT)? FEAT("kind", Mode)? FEAT("peers", LIST(REF))?)
Obj_Link ::= HEAD("Link") BODY(FEAT("weight", INT)? FEAT("from", REF)? FEAT("to", REF)?)
Mode ::= "FAST" | "Fast" | "slow"`;

// The addendum §A.2 (`out-ebnf-fixture-clike.txt`), verbatim; compared with every run of spaces made one space, since
// the probe padded rule names to 13 columns and the module pads them to the longest name.
const FIXTURE_EBNF = `Model         ::= {Sys | Part | Link} ;
Sys           ::= "Sys" [name=NAME] "{" ["doc" doc=STRING] ["width" width=INT] ["depth" depth=INT] ["enabled" enabled=BOOL] ["ready" ready=BOOL] ["label" label=STRING] ["note" note=STRING] ["mode" mode=Mode] ["tags" ("[" [tags+=STRING {"," tags+=STRING}] "]")] ["empty" ("[" [empty+=STRING {"," empty+=STRING}] "]")] ["level" level=INT] ["count" count=INT] ["parts" "{" {parts+=Part} "}"] ["links" "{" {links+=Link} "}"] ["main" main=REF] "}" ;
Part          ::= "Part" [name=NAME] "{" ["doc" doc=STRING] ["size" size=INT] ["kind" kind=Mode] ["peers" ("[" [peers+=REF {"," peers+=REF}] "]")] "}" ;
Link          ::= "Link" "{" ["weight" weight=INT] ["from" from=REF] ["to" to=REF] "}" ;
Mode          ::= "FAST" | "Fast" | "slow" ;`;
const spaces = (s: string): string => s.replace(/ +/g, ' ');

describe('base grammar (R-TXT-16 level 1)', () => {
    it('of the 1709 fixture is the addendum\'s (kills: feature order, name not in the head, wrong value shape)', () => {
        expect(baseGrammarText(deriveBaseGrammar(metamodelOf(FIXTURE)))).toBe(FIXTURE_BASE);
    });

    it('a single containment is a block of one, as the reference prints it; an abstract containment is a choice', () => {
        const text = baseGrammarText(deriveBaseGrammar(metamodelOf(GARAGE)));
        expect(text).toContain('FEAT("engine", BLOCK(Obj_Engine))?');
        expect(text).toContain('FEAT("spare", BLOCK(Item_*))?');
        expect(text).toContain('Item_ ::= Obj_Car | Obj_Wheel');
        expect(text).toContain('FEAT("colors", LIST(Color))? FEAT("marks", LIST(INT))?');
        expect(text).toContain('FEAT("speed", FLOAT)?');
    });
});

describe('C-like style and EBNF (R-TXT-16 level 2)', () => {
    it('the fixture\'s EBNF is the addendum\'s, up to runs of spaces', () => {
        expect(spaces(concreteGrammarEbnf(grammarOf(FIXTURE)))).toBe(spaces(FIXTURE_EBNF));
    });

    it('a choice is emitted once used, a single containment is a block with one assignment', () => {
        const ebnf = spaces(concreteGrammarEbnf(grammarOf(GARAGE)));
        expect(ebnf).toContain('["spare" "{" {spare+=Item_} "}"]');
        expect(ebnf).toContain('Item_ ::= Car | Wheel ;');
        expect(ebnf).toContain('["engine" "{" engine=Engine "}"]');
        expect(ebnf).toContain('["colors" ("[" [colors+=Color {"," colors+=Color}] "]")]');
        expect(grammarOf(GARAGE).notices).toEqual([]);
    });

    it('case folding applies when it merges nothing (kills: style case ignored)', () => {
        const g = grammarOf(GARAGE, LOWER);
        expect(g.notices).toEqual([]);
        const text = printTextModel(g, objectsOf(GARAGE)).text;
        expect(text.split('\n')[0]).toBe('car alpha {');
        expect(text).toContain('colors [red, blue]');
        expect(spaces(concreteGrammarEbnf(g))).toContain('Color ::= "red" | "green" | "blue" ;');
    });

    it('R-TXT-21 (10): a folding that merges two literals falls back to the declared case, with a notice', () => {
        const g = grammarOf(FIXTURE, LOWER);
        expect(g.literalCase).toBe('declared');
        expect(g.classCase).toBe('lower');
        expect(g.notices.map(n => n.message)).toEqual(['literals kept as declared: case lower would merge Mode: FAST, Fast']);
    });

    it('the same for two class keywords', () => {
        const g = grammarOf(CASES, LOWER);
        expect(g.classCase).toBe('declared');
        expect(g.notices.map(n => n.message)).toEqual(['class keywords kept as declared: case lower would merge Node, NODE']);
    });

    it('R-TXT-25 (7): a folding that lands a class keyword on a style word falls back too, with a notice', () => {
        const SCRIPT: Spec = { classes: [{ name: 'Script', references: [{ name: 'steps', type: 'End', containment: true, many: true }] }, { name: 'End' }], enums: {}, objects: [] };
        const words: NotationStyle = { ...CLIKE_STYLE, id: 'begin-end-lower', blockOpen: ['begin'], blockClose: ['end'], emptyBlock: ['begin', 'end'], reservedNames: ['begin', 'end'], classCase: 'lower' };
        const g = grammarOf(SCRIPT, words);
        expect(g.classCase).toBe('declared');
        expect(g.notices.map(n => n.message)).toEqual(['class keywords kept as declared: case lower would fold End onto "end", a style word']);
        expect(grammarOf(SCRIPT, { ...words, blockClose: ['fin'], emptyBlock: ['begin', 'fin'] }).classCase).toBe('lower');
    });
});

describe('printer against the JjGen generator, byte for byte (R-TXT-14)', () => {
    const templates = shippedTemplates();

    it('the 1709 fixture', () => {
        const reference = referenceText(FIXTURE, templates);
        expect(reference.startsWith('Sys s1 {\n  doc "top"\n')).toBe(true);
        expect(printed(FIXTURE)).toBe(reference);
    });

    const corpus: [string, Spec, NotationStyle][] = [
        ['a diamond (R-TXT-1)', DIAMOND, CLIKE_STYLE],
        ['a multiple inheritance without a diamond, by number of ancestors (R-TXT-12)', NON_DIAMOND, CLIKE_STYLE],
        ['names, homonyms, paths, several roots as Class[k] (R-TXT-4, R-TXT-25 (5, 6))', GARAGE, CLIKE_STYLE],
        ['a single nameless root referenced as Box[0], a class without name', BOX, CLIKE_STYLE],
        ['a single containment and a name that printed alike before R-TXT-25 (5, 6)', INNER, CLIKE_STYLE],
        ['mixed-case literals under a lower-case style, after the fallback (R-TXT-21 (10))', FIXTURE, { ...CLIKE_STYLE, literalCase: 'lower' }],
        ['two class keywords under a lower-case style, after the fallback (R-TXT-21 (10))', CASES, { ...CLIKE_STYLE, classCase: 'lower' }],
    ];
    it.each(corpus)('%s', (_, spec, style) => {
        expect(printed(spec, style)).toBe(referenceText(spec, templates));
    });

    it('the corpus prints what the rules say (kills: a reference that agrees with a broken printer)', () => {
        expect(printed(DIAMOND)).toBe('C {\n  a 1\n  ra C[0]\n  b1 2\n  b2 3\n  c 4\n  rc C[0]\n}');
        expect(printed(NON_DIAMOND)).toBe('C {\n  q1 1\n  q2 2\n  t 3\n  s 4\n  p 5\n  r 6\n  c 7\n}');
        expect(printed(BOX)).toBe('Box {\n  inner {\n    Box {\n      inner {\n        Box {}\n      }\n      label {\n        Tag {}\n      }\n      self Box[0].inner[0]\n    }\n  }\n  self Box[0]\n  tag Box[0].inner[0].label[0]\n}');
        const garage = printed(GARAGE);
        expect(garage).toContain('  speed 1.5\n  colors [Red, blue]\n  marks [3, 1]\n  engine {\n    Engine {\n      power 90\n      note "line1\\nline2 \\"q\\""\n    }\n  }');
        expect(garage).toContain('    Wheel "it\'s \\"odd\\"" {\n      size 1\n    }');
        expect(garage).toContain('  best Car[0].wheels[0]\n  tow beta\n  eng Car[0].engine[0]\n}');
        expect(garage).toContain('Car beta {\n  wheels {\n    Wheel v {\n      bolts {\n        Bolt v {}\n      }\n      pair Car[0].wheels[0].bolts[0]\n    }\n  }\n  best Car[0].wheels[1]\n  tow inner\n  eng Engine[0]\n}');
        expect(printed(INNER)).toBe('Room hall {\n  inner {\n    Room {}\n  }\n  rooms {\n    Room inner {}\n  }\n  see [Room[0].inner[0], inner, hall]\n}');
        expect(garage).toContain('Gear w {\n  wheel v\n}');
    });
});

describe('spans (R-TXT-22 origins)', () => {
    it('one per object, from its keyword to its last token, nested in its container\'s, in text order', () => {
        const objects = objectsOf(GARAGE);
        const { text, spans } = printTextModel(grammarOf(GARAGE), objects);
        expect(spans.map(s => s.id).sort()).toEqual(objects.map(o => o.id).sort());
        const byId = new Map(spans.map(s => [s.id, s]));
        for (const o of objects) {
            const s = byId.get(o.id)!;
            const slice = text.slice(s.start, s.end);
            expect(slice.startsWith(o.cls)).toBe(true);
            expect(slice.endsWith('}')).toBe(true);
        }
        expect(text.slice(byId.get('w3')!.start, byId.get('w3')!.end)).toBe('Wheel "it\'s \\"odd\\"" {\n      size 1\n    }');
        const within = (inner: string, outer: string) => byId.get(outer)!.start <= byId.get(inner)!.start && byId.get(inner)!.end <= byId.get(outer)!.end;
        expect(within('b1', 'w1') && within('w1', 'c1') && within('e1', 'c1') && within('b3', 'c2')).toBe(true);
        expect(within('c2', 'c1')).toBe(false);
        expect(byId.get('c1')!.start).toBe(0);
        expect(spans.map(s => s.start)).toEqual([...spans.map(s => s.start)].sort((a, b) => a - b));
    });
});
