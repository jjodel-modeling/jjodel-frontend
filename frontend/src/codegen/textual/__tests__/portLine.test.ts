/**
 * Step C lane C1d (P-2026-11-04-1312): the port line `input instr : Word(32)` of
 * docs/discovery/discovery_2026-11-04_textual_step_c.md §2.4. (1) the per-item keyword, the punctuation keyword, the
 * inline containment in a one-line class and the call layout, with their refusals; (2) the optional head name under the
 * LL(1) condition (R-TXT-41, D3); (3) print and read back, byte for byte, in both styles.
 */

import { describe, it, expect } from 'vitest';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import { resolveAnnotations } from '../annotations';
import type { OutlineNode } from '../languageService';
import { textOutline } from '../languageService';
import type { ConcreteGrammar } from '../concreteGrammar';
import { concreteGrammarEbnf } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { checkStyle } from '../styleCheck';
import { boolGrammar } from './boolCorpus';
import { PORT_CLIKE, PORT_IDS, PORT_MM, PORT_PASCAL, PORT_TEXT_CLIKE, PORT_TEXT_PASCAL, portGrammar, portObjects, portWith } from './portCorpus';

const errorsOf = (g: ConcreteGrammar): string[] => (g.annotationIssues ?? []).filter(i => i.level === 'error').map(i => `${i.where}: ${i.message}`);
const checkErrors = (g: ConcreteGrammar): string[] => checkStyle(g).filter(f => f.level === 'error').map(f => `${f.rule} ${f.where}: ${f.message}`);
const ebnfLine = (g: ConcreteGrammar, rule: string): string | undefined => concreteGrammarEbnf(g).split('\n').find(l => l.startsWith(`${rule} `))?.replace(/ +::=/, ' ::=');

describe('(1) the four shapes of the port line, and what they refuse', () => {
    it('C-like and Pascal/Ada: the record applies whole, and the style check holds', () => {
        for (const record of [PORT_CLIKE, PORT_PASCAL]) {
            const g = portGrammar(record);
            expect(errorsOf(g)).toEqual([]);
            expect(checkErrors(g)).toEqual([]);
        }
    });

    it('the EBNF shows the per-item keyword, the punctuation keyword with the inline child, the call layout and the empty braces', () => {
        const g = portGrammar();
        expect(ebnfLine(g, 'Module')).toBe('Module ::= "Module" [name=NAME] "{" {"input" inputs+=Port} {"output" outputs+=Port} "}" ;');
        expect(ebnfLine(g, 'Port')).toBe('Port ::= [name=NAME] ":" type=Type_ ["=" driver=Expr_] ;');
        expect(ebnfLine(g, 'Word')).toBe('Word ::= "Word" "(" width=INT ")" ;');
        expect(ebnfLine(g, 'Ref')).toBe('Ref ::= name=NAME | "{" "}" ;');
    });

    it('a feature keyword may be one punctuation token; not a word with a space, a quote or "@"', () => {
        for (const keyword of ['a b', '"', "'", '@']) {
            const r = resolveAnnotations(portWith({}, { F_Port_type: { keyword, inline: true } }), PORT_IDS, PORT_MM);
            expect(r.issues.map(i => `${i.where}: ${i.message}`)).toEqual([`Port.type: the keyword ${JSON.stringify(keyword)} is not an identifier, "" or one punctuation token`]);
        }
        expect(resolveAnnotations(portWith({}, { F_Port_type: { keyword: '->', inline: true } }), PORT_IDS, PORT_MM).issues).toEqual([]);
    });

    it.each([
        ['{', PORT_CLIKE, 'a block token of the style c-like'],
        ['{}', PORT_CLIKE, 'a block token of the style c-like'],
        [',', PORT_CLIKE, 'a list token of the style c-like'],
        ['&', PORT_CLIKE, 'an operator symbol of the style c-like'],
        ['(', PORT_CLIKE, 'a token of an expression or a call of the style c-like'],
        [';', PORT_PASCAL, 'a block token of the style pascal'],
        [':=', PORT_PASCAL, 'the assignment of the style pascal'],
    ] as const)('a punctuation keyword %j that is a token of the style in force is refused', (keyword, base, what) => {
        const g = portGrammar(portWith({}, { F_Port_type: { keyword, inline: true } }, base));
        expect(errorsOf(g)).toEqual([`Port.type: the keyword "${keyword}" is ${what}; not applied`]);
        expect(ebnfLine(g, 'Port')).toBe('Port ::= [name=NAME] "type" type=Type_ ["=" driver=Expr_] ;');
    });

    it('an item keyword that is no identifier, or on a single-valued feature or an attribute, is refused', () => {
        const r = resolveAnnotations(portWith({}, { F_Module_inputs: { itemKeyword: ':' } }), PORT_IDS, PORT_MM);
        expect(r.issues.map(i => `${i.where}: ${i.message}`)).toEqual(['Module.inputs: the item keyword ":" is not an identifier']);
        expect(errorsOf(portGrammar(portWith({}, { F_Port_type: { keyword: ':', inline: true, itemKeyword: 'of' } }))))
            .toEqual(['Port.type: itemKeyword applies to a multi-valued containment, and Port.type is single-valued; not applied']);
        expect(errorsOf(pinGrammar({ F_Pin_label: { itemKeyword: 'of' } })))
            .toEqual(['Pin.label: itemKeyword applies to a multi-valued containment, and Pin.label is not a containment; not applied']);
    });

    it('a one-line class whose containment is not inline, or inline and multi-valued, is refused as today', () => {
        expect(errorsOf(portGrammar(portWith({}, { F_Port_driver: {} })))).toEqual(['class Port: Port has a containment: layout line not applied']);
        expect(errorsOf(portGrammar(portWith({ C_Module: { layout: 'line' } }, { F_Module_inputs: { inline: true } }))))
            .toEqual(['class Module: Module has a containment: layout line not applied']);
    });

    it('the call layout is refused on a class with a containment, a many-valued or an optional argument', () => {
        expect(errorsOf(portGrammar(portWith({ C_Port: { keyword: '', layout: 'call' } })))).toEqual(['class Port: Port has a containment: layout call not applied']);
        const ids: ElementIds = { ...PORT_IDS, features: { ...PORT_IDS.features, F_Word_width: { owner: 'Word', name: 'width' } } };
        expect(errorsOf(boolGrammar(PORT_CLIKE, PORT_MM, ids))).toEqual(['class Word: Word.width is optional: layout call not applied, a call takes every argument']);
        const mm: TextMetamodel = { ...PORT_MM, classes: PORT_MM.classes.map(c => (c.name === 'Word' ? { ...c, attributes: [{ name: 'width', type: 'EInt', many: true }] } : c)) };
        expect(errorsOf(boolGrammar(PORT_CLIKE, mm, PORT_IDS))).toEqual(['class Word: Word.width is many-valued: layout call not applied, a call takes one value per argument']);
    });
});

// A metamodel of the lane's own for the refusal of D3: a pin whose net is a positional reference after its optional name.
const PIN_MM: TextMetamodel = {
    classes: [
        { name: 'Board', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'pins', type: 'Pin', containment: true, many: true }] },
        { name: 'Pin', attributes: [{ name: 'name', type: 'EString' }, { name: 'label', type: 'EString' }, { name: 'number', type: 'EInt' }] },
    ],
    enumerations: [],
};
const PIN_IDS: ElementIds = {
    classes: { C_Board: 'Board', C_Pin: 'Pin' },
    features: { F_Board_name: { owner: 'Board', name: 'name', lower: 1 }, F_Board_pins: { owner: 'Board', name: 'pins' }, F_Pin_name: { owner: 'Pin', name: 'name' }, F_Pin_label: { owner: 'Pin', name: 'label', lower: 1 }, F_Pin_number: { owner: 'Pin', name: 'number', lower: 1 } },
    enums: {},
};
const pinGrammar = (features: SyntaxAnnotations['features'], layout: 'line' | 'call' = 'line'): ConcreteGrammar =>
    boolGrammar({ v: 1, roots: 'uncontained', classes: { C_Pin: { keyword: '', layout } }, features: { F_Board_pins: { itemKeyword: 'pin' }, ...features } }, PIN_MM, PIN_IDS);

describe('(2) the optional head name under the LL(1) condition (R-TXT-41, D3)', () => {
    it('accepted when what follows the name position cannot be a name; the keyword after it is reserved there', () => {
        const g = pinGrammar({});
        expect(errorsOf(g)).toEqual([]);
        expect(ebnfLine(g, 'Pin')).toBe('Pin ::= [name=NAME] "label" label=STRING "number" number=INT ;');
        expect(g.headWords).toEqual(['label']);
        expect(checkErrors(g)).toEqual([]);
    });

    it('refused when a positional string can follow it, the message naming the name and the part', () => {
        const g = pinGrammar({ F_Pin_label: { keyword: '' } });
        const since = 'since Pin.label can start with a name too (an identifier or a string)';
        expect(errorsOf(g)).toEqual([
            `class Pin: Pin.name is optional: a one-line class needs a mandatory name in its head, ${since}; layout line not applied`,
            `class Pin: Pin.name is optional: a positional class needs a mandatory name in its head, ${since}; the keyword "" not applied`,
        ]);
        expect(ebnfLine(g, 'Pin')).toMatch(/^Pin ::= "Pin" \[name=NAME\] "\{"/);
    });

    it('a positional INT after the name is no conflict; a positional class with a block head, neither', () => {
        expect(errorsOf(pinGrammar({ F_Pin_label: {}, F_Pin_number: { keyword: '' } }))).toEqual([]);
        const block = boolGrammar({ v: 1, classes: { C_Pin: { keyword: '' } } }, PIN_MM, PIN_IDS);
        expect(errorsOf(block)).toEqual([]);
        expect(ebnfLine(block, 'Pin')).toMatch(/^Pin ::= \[name=NAME\] "\{"/);
    });

    it('a name equal to a reserved head word is quoted, and reads back', () => {
        const g = pinGrammar({});
        const objects: TextObject[] = [{ id: 'b', cls: 'Board', slots: { name: 'j1', pins: ['a', 'c'] } }, { id: 'a', cls: 'Pin', slots: { name: 'label', label: 'VCC', number: 1 } }, { id: 'c', cls: 'Pin', slots: { label: 'GND', number: 2 } }];
        const text = printTextModel(g, objects).text;
        expect(text).toBe('Board j1 {\n  pin "label" label "VCC" number 1\n  pin label "GND" number 2\n}');
        const r = parseText(text, g);
        expect(r.errors).toEqual([]);
        expect(printTextModel(g, r.objects).text).toBe(text);
        expect(r.objects.find(o => o.cls === 'Pin' && o.slots.label === 'GND')?.slots.name).toBeUndefined();
    });
});

describe('(3) the port line printed and read back, byte for byte', () => {
    it.each([['C-like', PORT_CLIKE, PORT_TEXT_CLIKE], ['Pascal/Ada', PORT_PASCAL, PORT_TEXT_PASCAL]] as const)('%s', (_s, record, expected) => {
        const g = portGrammar(record);
        const printed = printTextModel(g, portObjects());
        expect(printed.text).toBe(expected);
        expect(printed.tree).toBeDefined();
        const r = parseText(printed.text, g);
        expect(r.errors).toEqual([]);
        expect(r.objects.map(o => o.cls)).toEqual(portObjects().map(o => o.cls));
        expect(printTextModel(g, r.objects).text).toBe(expected);
        const p2 = r.objects.find(o => o.cls === 'Port' && o.slots.name === undefined);
        expect(p2).toBeDefined();
        expect(r.objects.filter(o => o.cls === 'Ref').map(o => o.slots.name ?? null)).toEqual(['instr', null, 'ready']);
    });

    it('the spans of the inline child and of the call object', () => {
        const printed = printTextModel(portGrammar(), portObjects());
        const at = (id: string): string => { const s = printed.spans.find(x => x.id === id)!; return printed.text.slice(s.start, s.end); };
        expect([at('p1'), at('w1'), at('b1'), at('r2'), at('c2')]).toEqual(['instr : Word(32)', 'Word(32)', 'Bool', '{}', 'and(ready)']);
    });

    it('the outline labels the inline child and the call object as a positional object (R-TXT-39, C4\')', () => {
        const g = portGrammar();
        const text = printTextModel(g, portObjects()).text;
        const outline = textOutline(text, parseText(text, g), g);
        const flat = (ss: readonly OutlineNode[]): OutlineNode[] => ss.flatMap(s => [s, ...flat(s.children)]);
        const objects = flat(outline.nodes).filter(s => s.kind === 'object');
        expect(objects.map(s => `${s.label}${s.named || !s.detail ? '' : ` (${s.detail})`}`))
            .toEqual(['cpu', 'instr', 'Word 32 (width)', 'Port[1]', 'Bool[0]', 'result', 'Word 8 (width)', 'Conj[0]', 'instr', 'Ref[1]', 'Conj[2]', 'ready']);
        expect(outline.pathAt(text.indexOf('32')).map(s => s.label)).toEqual(['cpu', 'input', 'instr', 'Word 32']);
    });

    it('a broken port line is a syntax error, and the rest of the module reads', () => {
        const r = parseText('Module cpu {\n  input instr : Word(32\n  input : Bool\n}', portGrammar());
        expect(r.errors.length).toBeGreaterThan(0);
        expect(r.objects.some(o => o.cls === 'Bool')).toBe(true);
    });
});
