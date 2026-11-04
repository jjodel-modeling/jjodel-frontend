/**
 * BOOL, the corpus's expression metamodel (step C lane C1a, P-2026-11-04-0910; docs/discovery/discovery_2026-11-04_textual_step_c.md
 * §2.2): a small boolean-expression language, not hardware, from the probe of P-2026-11-04-0303. `Use` refers to an `Atom`
 * (a cross-reference inside an expression); `Lit.value` is an integer, so that a literal never reads as a reference name.
 * Two records give it its notation, C-like with symbols and Pascal/Ada with words.
 */

import type { ElementIds, OperatorAnnotation, SyntaxAnnotations } from '../annotations';
import { resolveAnnotations, withStyleOptions } from '../annotations';
import { deriveBaseGrammar } from '../baseGrammar';
import type { ConcreteGrammar } from '../concreteGrammar';
import { deriveConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import { styleOf } from '../style';

export const BOOL_MM: TextMetamodel = {
    classes: [
        { name: 'Sheet', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'atoms', type: 'Atom', containment: true, many: true }, { name: 'rules', type: 'Rule', containment: true, many: true }] },
        { name: 'Atom', attributes: [{ name: 'name', type: 'EString' }] },
        { name: 'Rule', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'when', type: 'Expr', containment: true }] },
        { name: 'Expr', isAbstract: true },
        { name: 'Use', supers: ['Expr'], references: [{ name: 'atom', type: 'Atom' }] },
        { name: 'Lit', supers: ['Expr'], attributes: [{ name: 'value', type: 'EInt' }] },
        { name: 'Not', supers: ['Expr'], references: [{ name: 'op', type: 'Expr', containment: true }] },
        { name: 'And', supers: ['Expr'], references: [{ name: 'ops', type: 'Expr', containment: true, many: true, ordered: true }] },
        { name: 'Or', supers: ['Expr'], references: [{ name: 'ops', type: 'Expr', containment: true, many: true, ordered: true }] },
        { name: 'Imp', supers: ['Expr'], references: [{ name: 'left', type: 'Expr', containment: true }, { name: 'right', type: 'Expr', containment: true }] },
    ],
    enumerations: [],
};

export const BOOL_IDS: ElementIds = {
    classes: { C_Sheet: 'Sheet', C_Atom: 'Atom', C_Rule: 'Rule', C_Expr: 'Expr', C_Use: 'Use', C_Lit: 'Lit', C_Not: 'Not', C_And: 'And', C_Or: 'Or', C_Imp: 'Imp' },
    features: {
        F_Sheet_name: { owner: 'Sheet', name: 'name', lower: 1 }, F_Sheet_atoms: { owner: 'Sheet', name: 'atoms' }, F_Sheet_rules: { owner: 'Sheet', name: 'rules' },
        F_Atom_name: { owner: 'Atom', name: 'name', lower: 1 }, F_Rule_name: { owner: 'Rule', name: 'name', lower: 1 }, F_Rule_when: { owner: 'Rule', name: 'when', lower: 1 },
        F_Use_atom: { owner: 'Use', name: 'atom', lower: 1 }, F_Lit_value: { owner: 'Lit', name: 'value', lower: 1 }, F_Not_op: { owner: 'Not', name: 'op', lower: 1 },
        F_And_ops: { owner: 'And', name: 'ops' }, F_Or_ops: { owner: 'Or', name: 'ops' }, F_Imp_left: { owner: 'Imp', name: 'left', lower: 1 }, F_Imp_right: { owner: 'Imp', name: 'right', lower: 1 },
    },
    enums: {},
};

/** Use and Lit are positional one-line primaries; the rest is the operators. */
const PRIMARIES: Pick<SyntaxAnnotations, 'roots' | 'features'> & { readonly classes: NonNullable<SyntaxAnnotations['classes']> } = {
    roots: 'uncontained',
    classes: { C_Use: { keyword: '', layout: 'line' }, C_Lit: { keyword: '', layout: 'line' } },
    features: { F_Use_atom: { keyword: '' }, F_Lit_value: { keyword: '' } },
};

/** C-like: `a -> b | c & !d`, the n-ary operators with the call words `or` and `and`. */
export const BOOL_CLIKE: SyntaxAnnotations = {
    v: 1,
    ...PRIMARIES,
    classes: {
        ...PRIMARIES.classes,
        C_Imp: { operator: { symbol: '->', precedence: 1, assoc: 'right' } },
        C_Or: { operator: { symbol: '|', precedence: 2, call: 'or' } },
        C_And: { operator: { symbol: '&', precedence: 3, call: 'and' } },
        C_Not: { operator: { symbol: '!', precedence: 4 } },
    },
};

/** Pascal/Ada: `a implies b or c and not d`, the default call words. */
export const BOOL_PASCAL: SyntaxAnnotations = {
    v: 1,
    style: { base: 'pascal' },
    ...PRIMARIES,
    classes: {
        ...PRIMARIES.classes,
        C_Imp: { operator: { symbol: 'implies', precedence: 1, assoc: 'right' } },
        C_Or: { operator: { symbol: 'or', precedence: 2 } },
        C_And: { operator: { symbol: 'and', precedence: 3 } },
        C_Not: { operator: { symbol: 'not', precedence: 4 } },
    },
};

/** The concrete grammar a record gives BOOL (or another metamodel with its ids), as the textual notation derives it (syntaxRecord.ts). */
export function boolGrammar(record: SyntaxAnnotations, mm: TextMetamodel = BOOL_MM, ids: ElementIds = BOOL_IDS): ConcreteGrammar {
    const resolved = resolveAnnotations(record, ids, mm);
    return deriveConcreteGrammar(deriveBaseGrammar(mm), withStyleOptions(styleOf(resolved.style.base), resolved), resolved);
}

/** The record with the operator of class id `classId` replaced, or removed with `null`. */
export function withOperator(record: SyntaxAnnotations, classId: string, op: OperatorAnnotation | null): SyntaxAnnotations {
    const { operator: _old, ...rest } = record.classes?.[classId] ?? {};
    return { ...record, classes: { ...record.classes, [classId]: op ? { ...rest, operator: op } : rest } };
}

/** The BOOL model: `driver` mirrors the Briefs' `Conj(st, Disj(is_sw))`, and the cases a round trip has to keep. */
export function boolObjects(): TextObject[] {
    const os: TextObject[] = [];
    let n = 0;
    const mk = (cls: string, slots: Record<string, unknown>): string => { const id = `x${++n}`; os.push({ id, cls, slots }); return id; };
    const atoms = ['st', 'is_sw', 'ld', 'rdy'].map(a => mk('Atom', { name: a }));
    const [st, sw, ld, rdy] = atoms;
    const use = (a: string): string => mk('Use', { atom: a });
    const rules = [
        ['driver', mk('And', { ops: [use(st), mk('Or', { ops: [use(sw)] })] })],
        ['guard', mk('Or', { ops: [mk('And', { ops: [use(st), use(ld)] }), mk('Not', { op: use(rdy) })] })],
        ['chain', mk('And', { ops: [use(st), use(ld), use(rdy)] })],
        ['nested', mk('And', { ops: [mk('And', { ops: [use(st), use(ld)] }), use(rdy)] })],
        ['impR', mk('Imp', { left: use(st), right: mk('Imp', { left: use(ld), right: use(rdy) }) })],
        ['impL', mk('Imp', { left: mk('Imp', { left: use(st), right: use(ld) }), right: use(rdy) })],
        ['empty', mk('And', { ops: [] })],
        ['lit', mk('Or', { ops: [mk('Lit', { value: 1 }), mk('Not', { op: mk('Not', { op: use(st) }) })] })],
    ].map(([name, when]) => mk('Rule', { name, when }));
    const sheet: TextObject = { id: 'sheet', cls: 'Sheet', slots: { name: 'core', atoms, rules } };
    return [sheet, ...os];
}

/** ARITH (step C lane C1b): BOOL with a unary and a binary minus, and `+` on the level of the binary minus. */
export const ARITH_MM: TextMetamodel = {
    classes: [
        ...BOOL_MM.classes,
        { name: 'Neg', supers: ['Expr'], references: [{ name: 'op', type: 'Expr', containment: true }] },
        { name: 'Add', supers: ['Expr'], references: [{ name: 'left', type: 'Expr', containment: true }, { name: 'right', type: 'Expr', containment: true }] },
        { name: 'Sub', supers: ['Expr'], references: [{ name: 'left', type: 'Expr', containment: true }, { name: 'right', type: 'Expr', containment: true }] },
    ],
    enumerations: [],
};

export const ARITH_IDS: ElementIds = {
    classes: { ...BOOL_IDS.classes, C_Neg: 'Neg', C_Add: 'Add', C_Sub: 'Sub' },
    features: {
        ...BOOL_IDS.features, F_Neg_op: { owner: 'Neg', name: 'op', lower: 1 },
        F_Add_left: { owner: 'Add', name: 'left', lower: 1 }, F_Add_right: { owner: 'Add', name: 'right', lower: 1 },
        F_Sub_left: { owner: 'Sub', name: 'left', lower: 1 }, F_Sub_right: { owner: 'Sub', name: 'right', lower: 1 },
    },
    enums: {},
};

/** C-like: `-` prefix (Neg) and binary (Sub), `+` and `-` one level. */
export const ARITH_CLIKE: SyntaxAnnotations = {
    ...BOOL_CLIKE,
    classes: {
        ...BOOL_CLIKE.classes,
        C_Add: { operator: { symbol: '+', precedence: 5 } },
        C_Sub: { operator: { symbol: '-', precedence: 5 } },
        C_Neg: { operator: { symbol: '-', precedence: 9 } },
    },
};

export const arithGrammar = (record: SyntaxAnnotations = ARITH_CLIKE): ConcreteGrammar => boolGrammar(record, ARITH_MM, ARITH_IDS);
