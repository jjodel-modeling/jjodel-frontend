/**
 * PORT, the corpus of the port line (step C lane C1d, P-2026-11-04-1312; docs/discovery/discovery_2026-11-04_textual_step_c.md
 * §2.4): a module with input and output ports, a port with an optional name, a type held by containment (`Bool`, or
 * `Word` with a width) and an optional driver expression. Its records give it `input instr : Word(32)` through the
 * per-item keyword, the punctuation keyword, the inline containment, the call layout and the optional head name.
 */

import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import { boolGrammar } from './boolCorpus';

export const PORT_MM: TextMetamodel = {
    classes: [
        { name: 'Module', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'inputs', type: 'Port', containment: true, many: true }, { name: 'outputs', type: 'Port', containment: true, many: true }] },
        { name: 'Port', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'type', type: 'Type', containment: true }, { name: 'driver', type: 'Expr', containment: true }] },
        { name: 'Type', isAbstract: true },
        { name: 'Bool', supers: ['Type'] },
        { name: 'Word', supers: ['Type'], attributes: [{ name: 'width', type: 'EInt' }] },
        { name: 'Expr', isAbstract: true },
        { name: 'Ref', supers: ['Expr'], attributes: [{ name: 'name', type: 'EString' }] },
        { name: 'Conj', supers: ['Expr'], references: [{ name: 'ops', type: 'Expr', containment: true, many: true, ordered: true }] },
    ],
    enumerations: [],
};

export const PORT_IDS: ElementIds = {
    classes: { C_Module: 'Module', C_Port: 'Port', C_Type: 'Type', C_Bool: 'Bool', C_Word: 'Word', C_Expr: 'Expr', C_Ref: 'Ref', C_Conj: 'Conj' },
    features: {
        F_Module_name: { owner: 'Module', name: 'name', lower: 1 }, F_Module_inputs: { owner: 'Module', name: 'inputs' }, F_Module_outputs: { owner: 'Module', name: 'outputs' },
        F_Port_name: { owner: 'Port', name: 'name' }, F_Port_type: { owner: 'Port', name: 'type', lower: 1 }, F_Port_driver: { owner: 'Port', name: 'driver' },
        F_Word_width: { owner: 'Word', name: 'width', lower: 1 }, F_Ref_name: { owner: 'Ref', name: 'name' }, F_Conj_ops: { owner: 'Conj', name: 'ops' },
    },
    enums: {},
};

/** The port line in C-like: `input instr : Word(32)`, `output result : Word(8) = instr & {} & and(ready)`. */
export const PORT_CLIKE: SyntaxAnnotations = {
    v: 1,
    roots: 'uncontained',
    classes: {
        C_Port: { keyword: '', layout: 'line' },
        C_Bool: { layout: 'line' },
        C_Word: { layout: 'call' },
        C_Ref: { keyword: '', layout: 'line' },
        C_Conj: { operator: { symbol: '&', precedence: 1, call: 'and' } },
    },
    features: {
        F_Module_inputs: { itemKeyword: 'input' },
        F_Module_outputs: { itemKeyword: 'output' },
        F_Port_type: { keyword: ':', inline: true },
        F_Port_driver: { keyword: '=', inline: true },
    },
};

/** The same notation under the Pascal/Ada style. */
export const PORT_PASCAL: SyntaxAnnotations = { ...PORT_CLIKE, style: { base: 'pascal' } };

export const portGrammar = (record: SyntaxAnnotations = PORT_CLIKE): ConcreteGrammar => boolGrammar(record, PORT_MM, PORT_IDS);

/** A record with some class or feature annotations replaced (by id). */
export const portWith = (classes: SyntaxAnnotations['classes'] = {}, features: SyntaxAnnotations['features'] = {}, base: SyntaxAnnotations = PORT_CLIKE): SyntaxAnnotations =>
    ({ ...base, classes: { ...base.classes, ...classes }, features: { ...base.features, ...features } });

/** The module `cpu`: a named and a nameless input, an output driven by `instr & {} & and(ready)` (a nameless Ref, a one-operand Conj). */
export function portObjects(): TextObject[] {
    return [
        { id: 'm', cls: 'Module', slots: { name: 'cpu', inputs: ['p1', 'p2'], outputs: ['p3'] } },
        { id: 'p1', cls: 'Port', slots: { name: 'instr', type: 'w1' } },
        { id: 'w1', cls: 'Word', slots: { width: 32 } },
        { id: 'p2', cls: 'Port', slots: { type: 'b1' } },
        { id: 'b1', cls: 'Bool', slots: {} },
        { id: 'p3', cls: 'Port', slots: { name: 'result', type: 'w2', driver: 'c1' } },
        { id: 'w2', cls: 'Word', slots: { width: 8 } },
        { id: 'c1', cls: 'Conj', slots: { ops: ['r1', 'r2', 'c2'] } },
        { id: 'r1', cls: 'Ref', slots: { name: 'instr' } },
        { id: 'r2', cls: 'Ref', slots: {} },
        { id: 'c2', cls: 'Conj', slots: { ops: ['r3'] } },
        { id: 'r3', cls: 'Ref', slots: { name: 'ready' } },
    ];
}

export const PORT_TEXT_CLIKE = 'Module cpu {\n  input instr : Word(32)\n  input : Bool\n  output result : Word(8) = instr & {} & and(ready)\n}';
export const PORT_TEXT_PASCAL = 'Module cpu begin\n  input instr : Word(32)\n  input : Bool\n  output result : Word(8) = instr & begin end; & and(ready)\nend;';
