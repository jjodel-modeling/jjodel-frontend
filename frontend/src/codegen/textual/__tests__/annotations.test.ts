/**
 * Step T4a-1 of the textual notation (P-2026-11-02-0955, design P-2026-11-02-0846; R-TXT-16 level 3, R-TXT-21 (4),
 * R-TXT-24 (a), R-TXT-27): syntax annotations as data, applied by the derivation, the printer and the parser, and
 * refused with the reason when they would make the grammar ambiguous. The fixture is the micron prototype's CoreSpec and
 * ArbiterSpec with the annotations that give their brief notation; `Instruction.mnemonic` and `Requester.name` are
 * mandatory here (R-TXT-27), as the prototype's metamodels are to declare them.
 */

import { describe, it, expect } from 'vitest';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import { expandNamePattern, parseNamePattern, resolveAnnotations, withStyleOptions } from '../annotations';
import { deriveBaseGrammar } from '../baseGrammar';
import type { ConcreteGrammar } from '../concreteGrammar';
import { concreteGrammarEbnf, deriveConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import { classFeatures } from '../metamodel';
import { isApplicableParse, parseText } from '../parser';
import { printTextModel } from '../printer';
import type { NotationStyle } from '../style';
import { CLIKE_STYLE } from '../style';
import { checkStyle, STYLE_RULES } from '../styleCheck';
import { grammarOf } from './corpus';
import { parseCount } from './oracle';
import { FIXTURE, metamodelOf } from './spec';

// ---- The fixture -----------------------------------------------------------------------------------------------

export const CORE_MM: TextMetamodel = {
    classes: [
        {
            name: 'Core',
            attributes: [{ name: 'name', type: 'EString' }, { name: 'xlen', type: 'EInt' }, { name: 'nregs', type: 'EInt' }, { name: 'microarch', type: 'Microarch' }],
            references: [
                { name: 'instructions', type: 'Instruction', containment: true, many: true },
                { name: 'requirements', type: 'Requirement', containment: true, many: true },
            ],
        },
        { name: 'Instruction', attributes: [{ name: 'mnemonic', type: 'Mnemonic' }] },
        { name: 'Requirement', attributes: [{ name: 'name', type: 'EString' }, { name: 'kind', type: 'RequirementKind' }] },
    ],
    enumerations: [
        { name: 'Microarch', literals: ['MULTICYCLE', 'PIPE3_STALL', 'PIPE3_FORWARD'] },
        {
            name: 'Mnemonic', literals: [
                'ADD', 'SUB', 'AND', 'OR', 'XOR', 'ADDI', 'LW', 'SW', 'BEQ', 'BNE', 'ANDI', 'ORI', 'XORI', 'SLTI', 'SLTIU', 'SLT',
                'SLTU', 'SLL', 'SRL', 'SRA', 'SLLI', 'SRLI', 'SRAI', 'LUI', 'AUIPC', 'JAL', 'JALR', 'BLT', 'BGE', 'BLTU', 'BGEU', 'FENCE',
            ],
        },
        { name: 'RequirementKind', literals: ['ISA_CONFORMANCE', 'NO_HAZARD', 'IN_ORDER_RETIRE'] },
    ],
};

export const ARBITER_MM: TextMetamodel = {
    classes: [
        {
            name: 'Arbiter',
            attributes: [{ name: 'name', type: 'EString' }, { name: 'policy', type: 'Policy' }],
            references: [
                { name: 'requesters', type: 'Requester', containment: true, many: true },
                { name: 'requirements', type: 'Requirement', containment: true, many: true },
            ],
        },
        { name: 'Requester', attributes: [{ name: 'name', type: 'EString' }, { name: 'priority', type: 'EInt' }] },
        {
            name: 'Requirement',
            attributes: [{ name: 'name', type: 'EString' }, { name: 'kind', type: 'RequirementKind' }, { name: 'requester', type: 'EString' }, { name: 'bound', type: 'EInt' }],
        },
    ],
    enumerations: [
        { name: 'Policy', literals: ['FIXED', 'ROUND_ROBIN'] },
        { name: 'RequirementKind', literals: ['MUTEX', 'NO_SPURIOUS_GRANT', 'PRIORITY', 'BOUNDED_WAIT'] },
    ],
};

/** Ids as T4a-2 will build them from the shells: `c:C`, `f:C.f`, `e:E`; `lower` from the given mandatory features. */
export function idsOf(mm: TextMetamodel, mandatory: readonly string[] = []): ElementIds {
    const features: Record<string, { owner: string; name: string; lower?: number }> = {};
    for (const c of mm.classes) {
        for (const f of classFeatures(mm, c)) if (f.owner === c.name) features[`f:${f.owner}.${f.name}`] = { owner: f.owner, name: f.name, lower: mandatory.includes(`${f.owner}.${f.name}`) ? 1 : 0 };
    }
    return {
        classes: Object.fromEntries(mm.classes.map(c => [`c:${c.name}`, c.name])),
        features,
        enums: Object.fromEntries(mm.enumerations.map(e => [`e:${e.name}`, e.name])),
    };
}

export const CORE_MANDATORY = ['Instruction.mnemonic'];
export const ARBITER_MANDATORY = ['Requester.name'];

export const CORE_ANNOTATIONS: SyntaxAnnotations = {
    v: 1,
    style: { classCase: 'lower', literalCase: 'lower', blankBeforeContainment: true },
    roots: 'uncontained',
    classes: {
        'c:Instruction': { keyword: '', layout: 'line' },
        'c:Requirement': { keyword: 'require', layout: 'line', name: { keyword: 'as', default: '{kind}' } },
    },
    features: {
        'f:Core.nregs': { keyword: 'registers' },
        'f:Core.instructions': { groupBy: 'f:Instruction.mnemonic' },
        'f:Core.requirements': { inline: true },
        'f:Instruction.mnemonic': { keyword: '' },
        'f:Requirement.kind': { keyword: '' },
    },
    enums: {
        'e:Mnemonic': {
            subsets: [
                { name: 'reg_reg', literals: ['ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLT', 'SLTU', 'SLL', 'SRL', 'SRA'] },
                { name: 'reg_imm', literals: ['ADDI', 'ANDI', 'ORI', 'XORI', 'SLTI', 'SLTIU', 'SLLI', 'SRLI', 'SRAI', 'LUI', 'AUIPC'] },
                { name: 'control', literals: ['JAL', 'JALR', 'BEQ', 'BNE', 'BLT', 'BGE', 'BLTU', 'BGEU'] },
                { name: 'load_store', literals: ['LW', 'SW'] },
                { name: 'ordering', literals: ['FENCE'] },
            ],
        },
    },
};

export const ARBITER_ANNOTATIONS: SyntaxAnnotations = {
    v: 1,
    style: { classCase: 'lower', literalCase: 'lower', blankBeforeContainment: true },
    roots: 'uncontained',
    classes: {
        'c:Requester': { layout: 'line' },
        'c:Requirement': { keyword: 'require', layout: 'line', name: { keyword: 'as', default: '{kind}(_{requester})?' } },
    },
    features: {
        'f:Arbiter.requesters': { inline: true },
        'f:Arbiter.requirements': { inline: true },
        'f:Requirement.kind': { keyword: '' },
        'f:Requirement.requester': { keyword: 'for', value: 'name' },
        'f:Requirement.bound': { keyword: 'within' },
    },
};

/** The concrete grammar of a metamodel under C-like with its annotations and their style options. */
export function annotatedGrammar(mm: TextMetamodel, record: SyntaxAnnotations, mandatory: readonly string[], style: NotationStyle = CLIKE_STYLE): ConcreteGrammar {
    const resolved = resolveAnnotations(record, idsOf(mm, mandatory), mm);
    return deriveConcreteGrammar(deriveBaseGrammar(mm), withStyleOptions(style, resolved), resolved);
}

export const coreGrammar = (): ConcreteGrammar => annotatedGrammar(CORE_MM, CORE_ANNOTATIONS, CORE_MANDATORY);
export const arbiterGrammar = (): ConcreteGrammar => annotatedGrammar(ARBITER_MM, ARBITER_ANNOTATIONS, ARBITER_MANDATORY);

const errorsOf = (g: ConcreteGrammar): string[] => (g.annotationIssues ?? []).filter(i => i.level === 'error').map(i => `${i.where}: ${i.message}`);
const print = (g: ConcreteGrammar, objects: readonly TextObject[]): string => printTextModel(g, objects).text;
/** Print, parse, print: the text reads back without error to objects that print the same. */
function roundTrip(g: ConcreteGrammar, objects: readonly TextObject[]): { text: string; parsed: readonly TextObject[] } {
    const text = print(g, objects);
    const r = parseText(text, g);
    expect(r.errors).toEqual([]);
    expect(isApplicableParse(r)).toBe(true);
    expect(print(g, r.objects)).toBe(text);
    return { text, parsed: r.objects };
}

// A core with every group but `ordering`, a requirement named apart from its kind, and an instruction listed twice.
const CORE_OBJECTS: TextObject[] = [
    {
        id: 'c', cls: 'Core', slots: {
            name: 'mc4', xlen: 4, nregs: 4, microarch: 'MULTICYCLE',
            instructions: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'], requirements: ['r1', 'r2'],
        },
    },
    { id: 'i1', cls: 'Instruction', slots: { mnemonic: 'ADD' } },
    { id: 'i2', cls: 'Instruction', slots: { mnemonic: 'BEQ' } },
    { id: 'i3', cls: 'Instruction', slots: { mnemonic: 'SUB' } },
    { id: 'i4', cls: 'Instruction', slots: { mnemonic: 'LW' } },
    { id: 'i5', cls: 'Instruction', slots: { mnemonic: 'ADD' } },
    { id: 'i6', cls: 'Instruction', slots: { mnemonic: 'ADDI' } },
    { id: 'r1', cls: 'Requirement', slots: { name: 'isa_conformance', kind: 'ISA_CONFORMANCE' } },
    { id: 'r2', cls: 'Requirement', slots: { name: 'forwarding_correct', kind: 'NO_HAZARD' } },
];

const CORE_TEXT = [
    'core mc4 {',
    '  xlen 4',
    '  registers 4',
    '  microarch multicycle',
    '',
    '  instructions {',
    '    reg_reg add add sub',
    '    reg_imm addi',
    '    control beq',
    '    load_store lw',
    '  }',
    '',
    '  require isa_conformance',
    '  require no_hazard as forwarding_correct',
    '}',
].join('\n');

const ARBITER_OBJECTS: TextObject[] = [
    { id: 'a', cls: 'Arbiter', slots: { name: 'arb', policy: 'ROUND_ROBIN', requesters: ['q1', 'q2'], requirements: ['r1', 'r2', 'r3'] } },
    { id: 'q1', cls: 'Requester', slots: { name: 'cpu', priority: 0 } },
    { id: 'q2', cls: 'Requester', slots: { name: 'dma', priority: null } },
    { id: 'r1', cls: 'Requirement', slots: { name: 'one_grant', kind: 'MUTEX', requester: null, bound: null } },
    { id: 'r2', cls: 'Requirement', slots: { name: 'bounded_wait_cpu', kind: 'BOUNDED_WAIT', requester: 'cpu', bound: 3 } },
    { id: 'r3', cls: 'Requirement', slots: { name: 'priority', kind: 'PRIORITY', requester: null, bound: null } },
];

const ARBITER_TEXT = [
    'arbiter arb {',
    '  policy round_robin',
    '',
    '  requester cpu priority 0',
    '  requester dma',
    '',
    '  require mutex as one_grant',
    '  require bounded_wait for cpu within 3',
    '  require priority',
    '}',
].join('\n');

// ---- Resolution ------------------------------------------------------------------------------------------------

describe('resolveAnnotations: ids to names, tolerant', () => {
    it('keys classes by name, features by Owner.f, and carries the grouping attribute with its bound', () => {
        const r = resolveAnnotations(CORE_ANNOTATIONS, idsOf(CORE_MM, CORE_MANDATORY), CORE_MM);
        expect(r.issues).toEqual([]);
        expect(r.classes.Requirement.keyword).toBe('require');
        expect(r.classes.Requirement.name?.default?.source).toBe('{kind}');
        expect(r.features['Core.nregs']).toEqual({ keyword: 'registers' });
        expect(r.features['Core.instructions'].groupBy).toEqual({ attr: 'mnemonic', owner: 'Instruction', mandatory: true });
        expect(r.enums.Mnemonic.subsets.map(s => s.name)).toEqual(['reg_reg', 'reg_imm', 'control', 'load_store', 'ordering']);
        expect(r.roots).toBe('uncontained');
        expect(r.style).toEqual({ classCase: 'lower', literalCase: 'lower', blankBeforeContainment: true });
    });

    it('reads a mandatory name through the class that declares it', () => {
        const r = resolveAnnotations(ARBITER_ANNOTATIONS, idsOf(ARBITER_MM, ARBITER_MANDATORY), ARBITER_MM);
        expect([...r.mandatoryName]).toEqual(['Requester']);
    });

    it('drops an unknown id or a malformed entry with an error, and never throws', () => {
        const record = {
            v: 1,
            classes: {
                'c:Nope': { keyword: 'x' },
                'c:Requirement': { keyword: 'two words', layout: 'diagonal', name: { default: '{kind' } },
                'c:Instruction': { operator: { symbol: '+', precedence: 1.5 } },
            },
            features: { 'f:Core.nregs': { keyword: 'registers', groupBy: 'f:Nope.x' }, 'f:Nope.y': { keyword: 'y' } },
            roots: ['c:Core', 'c:Nope'],
        } as unknown as SyntaxAnnotations;
        const r = resolveAnnotations(record, idsOf(CORE_MM), CORE_MM);
        expect(r.issues.map(i => i.where)).toEqual(['roots', 'classes', 'class Requirement', 'class Requirement', 'class Requirement', 'class Instruction', 'Core.nregs', 'features']);
        expect(r.issues.every(i => i.level === 'error')).toBe(true);
        expect(r.classes.Requirement).toEqual({});
        expect(r.features['Core.nregs']).toEqual({ keyword: 'registers' });
        expect(r.roots).toEqual(['Core']);
    });

    it('a record of another version applies nothing', () => {
        const r = resolveAnnotations({ v: 2 } as unknown as SyntaxAnnotations, idsOf(CORE_MM), CORE_MM);
        expect(r.issues).toHaveLength(1);
        expect(r.classes).toEqual({});
    });

    it('stores a well-formed operator with a notice that it is not applied yet', () => {
        const record: SyntaxAnnotations = { v: 1, classes: { 'c:Instruction': { operator: { symbol: '+', precedence: 3, assoc: 'left' } } } };
        const g = annotatedGrammar(CORE_MM, record, CORE_MANDATORY);
        expect(g.annotationIssues).toEqual([{ level: 'notice', where: 'class Instruction', message: 'the operator "+" is stored, not applied yet' }]);
        expect(concreteGrammarEbnf(g)).toBe(concreteGrammarEbnf(deriveConcreteGrammar(deriveBaseGrammar(CORE_MM), CLIKE_STYLE)));
    });
});

describe('name patterns', () => {
    it('expand their holes, a segment only when all its holes are set', () => {
        const p = parseNamePattern('{kind}(_{requester})?');
        if (typeof p === 'string') throw new Error(p);
        expect(expandNamePattern(p, h => ({ kind: 'bounded_wait', requester: 'cpu' } as Record<string, string>)[h])).toBe('bounded_wait_cpu');
        expect(expandNamePattern(p, h => (h === 'kind' ? 'mutex' : undefined))).toBe('mutex');
        expect(expandNamePattern(p, () => undefined)).toBeUndefined();
    });

    it('refuse a malformed pattern with the reason', () => {
        for (const bad of ['{kind', 'a(b(c{x})?)?', '(_x)?', 'a)?', '', 'x}']) expect(typeof parseNamePattern(bad)).toBe('string');
    });
});

// ---- Derivation ------------------------------------------------------------------------------------------------

describe('deriveConcreteGrammar with annotations', () => {
    it('without annotations the grammar is unchanged; an empty record changes no rule', () => {
        const base = deriveBaseGrammar(metamodelOf(FIXTURE));
        const plain = deriveConcreteGrammar(base, CLIKE_STYLE);
        expect(plain.annotationIssues).toBeUndefined();
        expect(plain).toEqual(grammarOf(FIXTURE));
        const mm = metamodelOf(FIXTURE);
        const empty = deriveConcreteGrammar(base, CLIKE_STYLE, resolveAnnotations({ v: 1 }, idsOf(mm), mm));
        expect(empty.rules).toEqual(plain.rules);
        expect(empty.annotationIssues).toEqual([]);
        expect(checkStyle(empty).map(f => f.level)).toEqual(STYLE_RULES.map(() => 'ok'));
    });

    it('gives the CoreSpec brief grammar', () => {
        const g = coreGrammar();
        expect(g.annotationIssues).toEqual([]);
        expect(concreteGrammarEbnf(g)).toBe(CORE_EBNF);
    });

    it('gives the ArbiterSpec brief grammar', () => {
        const g = arbiterGrammar();
        expect(g.annotationIssues).toEqual([]);
        expect(concreteGrammarEbnf(g)).toBe(ARBITER_EBNF);
    });

    it('both grammars pass the style check, LL(1) included', () => {
        for (const g of [coreGrammar(), arbiterGrammar()]) expect(checkStyle(g).filter(f => f.level !== 'ok')).toEqual([]);
    });
});

const CORE_EBNF = [
    'Model                  ::= {Core} ;',
    'Core                   ::= "core" [name=NAME] "{" ["xlen" xlen=INT] ["registers" nregs=INT] ["microarch" microarch=Microarch] ["instructions" "{" ["reg_reg" {instructions+=Instruction_reg_reg}] ["reg_imm" {instructions+=Instruction_reg_imm}] ["control" {instructions+=Instruction_control}] ["load_store" {instructions+=Instruction_load_store}] ["ordering" {instructions+=Instruction_ordering}] "}"] {requirements+=Requirement} "}" ;',
    'Instruction            ::= [mnemonic=Mnemonic] ;',
    'Requirement            ::= "require" [kind=RequirementKind] ["as" name=NAME] (* else name = {kind} *) ;',
    'Instruction_reg_reg    ::= mnemonic=Mnemonic_reg_reg ;',
    'Instruction_reg_imm    ::= mnemonic=Mnemonic_reg_imm ;',
    'Instruction_control    ::= mnemonic=Mnemonic_control ;',
    'Instruction_load_store ::= mnemonic=Mnemonic_load_store ;',
    'Instruction_ordering   ::= mnemonic=Mnemonic_ordering ;',
    'Microarch              ::= "multicycle" | "pipe3_stall" | "pipe3_forward" ;',
    'Mnemonic               ::= "add" | "sub" | "and" | "or" | "xor" | "addi" | "lw" | "sw" | "beq" | "bne" | "andi" | "ori" | "xori" | "slti" | "sltiu" | "slt" | "sltu" | "sll" | "srl" | "sra" | "slli" | "srli" | "srai" | "lui" | "auipc" | "jal" | "jalr" | "blt" | "bge" | "bltu" | "bgeu" | "fence" ;',
    'RequirementKind        ::= "isa_conformance" | "no_hazard" | "in_order_retire" ;',
    'Mnemonic_reg_reg       ::= "add" | "sub" | "and" | "or" | "xor" | "slt" | "sltu" | "sll" | "srl" | "sra" ;',
    'Mnemonic_reg_imm       ::= "addi" | "andi" | "ori" | "xori" | "slti" | "sltiu" | "slli" | "srli" | "srai" | "lui" | "auipc" ;',
    'Mnemonic_control       ::= "jal" | "jalr" | "beq" | "bne" | "blt" | "bge" | "bltu" | "bgeu" ;',
    'Mnemonic_load_store    ::= "lw" | "sw" ;',
    'Mnemonic_ordering      ::= "fence" ;',
].join('\n');
const ARBITER_EBNF = [
    'Model           ::= {Arbiter} ;',
    'Arbiter         ::= "arbiter" [name=NAME] "{" ["policy" policy=Policy] {requesters+=Requester} {requirements+=Requirement} "}" ;',
    'Requester       ::= "requester" name=NAME ["priority" priority=INT] ;',
    'Requirement     ::= "require" [kind=RequirementKind] ["for" requester=NAME] ["within" bound=INT] ["as" name=NAME] (* else name = {kind}(_{requester})? *) ;',
    'Policy          ::= "fixed" | "round_robin" ;',
    'RequirementKind ::= "mutex" | "no_spurious_grant" | "priority" | "bounded_wait" ;',
].join('\n');

// ---- Printer and parser ----------------------------------------------------------------------------------------

describe('print and parse an annotated model', () => {
    it('prints the CoreSpec brief: groups and their instructions in subset order, ties in model order, blank lines, derived names left out', () => {
        expect(print(coreGrammar(), CORE_OBJECTS)).toBe(CORE_TEXT);
    });

    it('reads the CoreSpec brief back, filling a derived name and grouping attributes from the subset', () => {
        const { parsed } = roundTrip(coreGrammar(), CORE_OBJECTS);
        expect(parsed.filter(o => o.cls === 'Instruction').map(o => o.slots.mnemonic)).toEqual(['ADD', 'ADD', 'SUB', 'ADDI', 'BEQ', 'LW']);
        expect(parsed.filter(o => o.cls === 'Requirement').map(o => o.slots.name)).toEqual(['isa_conformance', 'forwarding_correct']);
    });

    it('prints and reads the ArbiterSpec brief: a name value unquoted, an optional segment of the pattern', () => {
        const g = arbiterGrammar();
        expect(print(g, ARBITER_OBJECTS)).toBe(ARBITER_TEXT);
        const { parsed } = roundTrip(g, ARBITER_OBJECTS);
        expect(parsed.filter(o => o.cls === 'Requirement').map(o => o.slots.name)).toEqual(['one_grant', 'bounded_wait_cpu', 'priority']);
        expect(parsed.find(o => o.slots.name === 'bounded_wait_cpu')?.slots.requester).toBe('cpu');
    });

    it('a name that differs from its pattern is printed, one equal to it is not', () => {
        const g = arbiterGrammar();
        const one = (name: string): string => print(g, [
            { id: 'a', cls: 'Arbiter', slots: { name: 'x', requirements: ['r'] } },
            { id: 'r', cls: 'Requirement', slots: { name, kind: 'BOUNDED_WAIT', requester: 'io', bound: null } },
        ]);
        expect(one('bounded_wait_io')).toBe('arbiter x {\n  require bounded_wait for io\n}');
        expect(one('bounded_wait')).toBe('arbiter x {\n  require bounded_wait for io as bounded_wait\n}');
    });

    it('nearley finds exactly one parse of each printed text', () => {
        expect(parseCount(coreGrammar(), CORE_TEXT)).toBe(1);
        expect(parseCount(arbiterGrammar(), ARBITER_TEXT)).toBe(1);
    });

    it('no blank line at the start of a body', () => {
        const g = arbiterGrammar();
        expect(print(g, [
            { id: 'a', cls: 'Arbiter', slots: { name: 'x', requesters: ['q'] } },
            { id: 'q', cls: 'Requester', slots: { name: 'cpu', priority: 1 } },
        ])).toBe('arbiter x {\n  requester cpu priority 1\n}');
    });

    it('the top level admits only the uncontained classes', () => {
        const r = parseText('require mutex', arbiterGrammar());
        expect(r.errors.map(e => e.message)).toEqual(['expected "arbiter"; found name "require"']);
    });
});

// ---- Refusals --------------------------------------------------------------------------------------------------

describe('what the derivation refuses, with the reason', () => {
    const coreWith = (patch: Partial<SyntaxAnnotations>, mandatory = CORE_MANDATORY): ConcreteGrammar => annotatedGrammar(CORE_MM, { ...CORE_ANNOTATIONS, ...patch }, mandatory);

    it('a grouping by an optional attribute (R-TXT-21 (4)): the containment stays a plain block', () => {
        const g = coreWith({}, []);
        expect(errorsOf(g)).toEqual(['Core.instructions: groupBy not applied: Instruction.mnemonic is optional, and a grouping needs a mandatory attribute (R-TXT-21 (4))']);
        expect(g.rules.some(r => r.name === 'Instruction_reg_reg')).toBe(false);
    });

    it('subsets that are not a partition', () => {
        const subsets = CORE_ANNOTATIONS.enums!['e:Mnemonic'].subsets!;
        const g = coreWith({ enums: { 'e:Mnemonic': { subsets: subsets.slice(0, 4) } } });
        expect(errorsOf(g)).toEqual(['Core.instructions: groupBy not applied: FENCE in no subset of Mnemonic: the subsets are not a partition']);
        const twice = coreWith({ enums: { 'e:Mnemonic': { subsets: [...subsets, { name: 'more', literals: ['ADD'] }] } } });
        expect(errorsOf(twice)).toEqual(['Core.instructions: groupBy not applied: ADD in more than one subset of Mnemonic']);
        const asLiteral = coreWith({ enums: { 'e:Mnemonic': { subsets: [...subsets.slice(0, 4), { name: 'fence', literals: ['FENCE'] }] } } });
        expect(errorsOf(asLiteral)).toEqual(['Core.instructions: groupBy not applied: the subset name fence prints as a literal of Mnemonic']);
    });

    it('a one-line class with a containment', () => {
        const g = coreWith({ classes: { ...CORE_ANNOTATIONS.classes, 'c:Core': { layout: 'line' } } });
        expect(errorsOf(g)).toEqual(['class Core: Core has a containment: layout line not applied']);
    });

    it('a one-line or positional class whose name is optional (R-TXT-27)', () => {
        const g = annotatedGrammar(ARBITER_MM, ARBITER_ANNOTATIONS, []);
        expect(errorsOf(g)).toEqual(['class Requester: Requester.name is optional: a one-line class needs a mandatory name in its head; layout line not applied']);
        expect(print(g, ARBITER_OBJECTS.slice(0, 2).map(o => (o.id === 'a' ? { ...o, slots: { name: 'arb', requesters: ['q1'] } } : o))))
            .toBe('arbiter arb {\n  requester cpu {\n    priority 0\n  }\n}');
        const positional = annotatedGrammar(ARBITER_MM, { ...ARBITER_ANNOTATIONS, classes: { ...ARBITER_ANNOTATIONS.classes, 'c:Requester': { keyword: '' } } }, []);
        expect(errorsOf(positional)).toEqual(['class Requester: Requester.name is optional: a positional class needs a mandatory name in its head; the keyword "" not applied']);
    });

    it('a feature keyword that collides with another', () => {
        const g = coreWith({ features: { ...CORE_ANNOTATIONS.features, 'f:Core.nregs': { keyword: 'xlen' } } });
        expect(checkStyle(g).filter(f => f.level === 'error').map(f => `${f.rule} ${f.where}`)).toEqual(['distinct-features class Core', 'annotations Core.xlen']);
    });

    it('a positional class that can be empty, in a repetition, is not LL(1)', () => {
        const g = coreWith({ features: { ...CORE_ANNOTATIONS.features, 'f:Core.instructions': {} } });
        expect(errorsOf(g)).toEqual([]);
        const errors = checkStyle(g).filter(f => f.level === 'error');
        expect(errors.map(f => `${f.rule} ${f.where}`)).toContain('annotations Core.instructions');
        expect(errors.find(f => f.where === 'Core.instructions')?.message).toBe('not LL(1): the repeated part can be empty');
    });

    it('annotations on an abstract class, or roots that leave no class', () => {
        const mm = metamodelOf(FIXTURE);
        const ids = idsOf(mm);
        const r = resolveAnnotations({ v: 1, classes: { 'c:Named': { keyword: 'n' } }, roots: [] }, ids, mm);
        const g = deriveConcreteGrammar(deriveBaseGrammar(mm), CLIKE_STYLE, r);
        expect(errorsOf(g)).toEqual([
            'class Named: Named is abstract: a keyword, layout or name annotation goes on its concrete classes; not applied',
            'roots: no class is left at the top level; roots not applied',
        ]);
    });
});
