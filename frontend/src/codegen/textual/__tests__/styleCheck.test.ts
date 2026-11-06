/**
 * Step T3 of the textual notation (P-2026-11-01-2356; R-TXT-16, R-TXT-21 (1) and (10),
 * docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.2, §A.7): the style check on T1's corpus, on deliberately
 * broken styles and metamodels, and nearley as the oracle that counts parses on samples of each concrete grammar.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ConcreteGrammar } from '../concreteGrammar';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE, INDENT_STYLE, PASCAL_STYLE, STYLE_CATALOG, styleOf } from '../style';
import type { NotationStyle } from '../style';
import { checkStyle, STYLE_RULES } from '../styleCheck';
import type { StyleFinding } from '../styleCheck';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import { operatorFixity } from '../annotations';
import type { TextMetamodel, TextObject } from '../metamodel';
import { classFeatures } from '../metamodel';
import { arithGrammar, BOOL_CLIKE, BOOL_IDS, BOOL_MM, BOOL_PASCAL, boolGrammar, withOperator } from './boolCorpus';
import { generateSamples, nearleyGrammarOf, parseCount } from './oracle';
import { BOX, CASES, DIAMOND, GARAGE, grammarOf, INNER, LOWER, NON_DIAMOND } from './corpus';
import { FIXTURE, objectsOf } from './spec';
import type { Spec } from './spec';

const errors = (fs: readonly StyleFinding[]): [string, string][] => fs.filter(f => f.level === 'error').map(f => [f.rule, f.where]);

const mm = (classes: Spec['classes'], enums: Spec['enums'] = {}): Spec => ({ classes, enums, objects: [] });

const CORPUS: [string, Spec, NotationStyle][] = [
    ['the 1709 fixture', FIXTURE, CLIKE_STYLE],
    ['a diamond', DIAMOND, CLIKE_STYLE],
    ['a multiple inheritance without a diamond', NON_DIAMOND, CLIKE_STYLE],
    ['names, homonyms, choices, a single containment', GARAGE, CLIKE_STYLE],
    ['a nameless recursive class', BOX, CLIKE_STYLE],
    ['a single containment and a homonymous name', INNER, CLIKE_STYLE],
    ['two class keywords one case apart', CASES, CLIKE_STYLE],
    ['the garage, lower case', GARAGE, LOWER],
    ['the fixture, lower case after the fallback', FIXTURE, LOWER],
    ['two class keywords, lower case after the fallback', CASES, LOWER],
];

// Step C3a (P-2026-11-04-0345): the corpus under the Pascal/Ada style of the catalog, in both cases.
const PASCAL_LOWER: NotationStyle = { ...PASCAL_STYLE, id: 'pascal-lower', classCase: 'lower', literalCase: 'lower' };
const PASCAL_CORPUS: [string, Spec, NotationStyle][] = CORPUS.map(([name, spec, style]) => [name, spec, style === LOWER ? PASCAL_LOWER : PASCAL_STYLE]);

// Broken metamodels: an inherited feature redeclared (§A.2 (i)); two classes of one name (§A.2 (ii), report §3).
const REDECLARED = mm([
    { name: 'A', isAbstract: true, attributes: [{ name: 'x', type: 'EInt' }] },
    { name: 'C', supers: ['A'], attributes: [{ name: 'x', type: 'EInt' }, { name: 'y', type: 'EInt' }] },
]);
const HOMONYMS = mm([{ name: 'Node', attributes: [{ name: 'w', type: 'EInt' }] }, { name: 'Node', attributes: [{ name: 'v', type: 'EInt' }] }]);
// A class named like a style word once folded.
const SCRIPT = mm([
    { name: 'Script', references: [{ name: 'steps', type: 'Item', containment: true, many: true }] },
    { name: 'Item', isAbstract: true },
    { name: 'Step', supers: ['Item'], attributes: [{ name: 'name', type: 'EString' }] },
    { name: 'End', supers: ['Item'] },
]);

// Broken styles.
const OPEN_IS_KEYWORD: NotationStyle = { ...CLIKE_STYLE, id: 'open-doc', blockOpen: ['doc'] };
const WORD_BLOCKS: NotationStyle = { ...CLIKE_STYLE, id: 'begin-end', blockOpen: ['begin'], blockClose: ['end'], emptyBlock: ['begin', 'end'], reservedNames: ['begin', 'end'] };
const WORD_BLOCKS_LOWER: NotationStyle = { ...WORD_BLOCKS, id: 'begin-end-lower', classCase: 'lower' };
const SEPARATOR_IS_TERMINATOR: NotationStyle = { ...CLIKE_STYLE, id: 'comma-terminated', terminator: [','] };
const DOT_SEPARATOR: NotationStyle = { ...CLIKE_STYLE, id: 'dot-list', list: { open: '[', separator: '.', close: ']' } };

describe('style check (R-TXT-16, §A.2)', () => {
    it.each(CORPUS.filter(([, , style]) => style === CLIKE_STYLE))('C-like on %s: every rule ok', (_, spec) => {
        const fs = checkStyle(grammarOf(spec));
        expect(fs.map(f => [f.level, f.rule])).toEqual(STYLE_RULES.map(r => ['ok', r]));
    });

    it.each(PASCAL_CORPUS.filter(([, , style]) => style === PASCAL_STYLE))('Pascal/Ada on %s: every rule ok (kills: a catalog entry the check refuses)', (_, spec) => {
        const g = grammarOf(spec, PASCAL_STYLE);
        expect(g.style.id).toBe('pascal');
        const fs = checkStyle(g);
        expect(fs.map(f => [f.level, f.rule])).toEqual(STYLE_RULES.map(r => ['ok', r]));
    });

    it.each(PASCAL_CORPUS.filter(([, , style]) => style === PASCAL_LOWER))('Pascal/Ada lower case on %s: no error', (_, spec) => {
        expect(errors(checkStyle(grammarOf(spec, PASCAL_LOWER)))).toEqual([]);
    });

    it('the catalog: C-like and Pascal/Ada by their record ids, C-like when the record names none (kills: a default other than C-like)', () => {
        expect(STYLE_CATALOG).toEqual({ clike: CLIKE_STYLE, pascal: PASCAL_STYLE, indent: INDENT_STYLE });
        expect(styleOf(undefined)).toBe(CLIKE_STYLE);
        expect(styleOf('pascal')).toBe(PASCAL_STYLE);
        expect(PASCAL_STYLE).toMatchObject({ blockOpen: ['begin'], blockClose: ['end', ';'], assign: [':='], terminator: [';'], string: { quote: "'", escape: 'double' } });
    });

    it('the FAST/Fast fixture under a lower-case style: the R-TXT-21 (10) fallback is a notice, nothing fails', () => {
        const fs = checkStyle(grammarOf(FIXTURE, LOWER));
        expect(errors(fs)).toEqual([]);
        expect(fs.filter(f => f.level === 'notice')).toEqual([
            { level: 'notice', rule: 'case-injective', where: 'style c-like-lower', message: 'literals kept as declared: case lower would merge Mode: FAST, Fast' },
        ]);
        expect(fs.filter(f => f.level === 'ok').map(f => f.rule)).toEqual(STYLE_RULES.filter(r => r !== 'case-injective'));
    });

    it('a block opener equal to a feature keyword, and a word not reserved', () => {
        expect(errors(checkStyle(grammarOf(FIXTURE, OPEN_IS_KEYWORD)))).toEqual([
            ['reserved-words', 'style.blockOpen'],
            ['block-delimiters', 'Sys.doc'],
            ['block-delimiters', 'Part.doc'],
        ]);
    });

    it('R-TXT-25 (7): a class keyword the case would fold onto a style word keeps its declared case, a notice', () => {
        expect(errors(checkStyle(grammarOf(SCRIPT, WORD_BLOCKS)))).toEqual([]);
        const fs = checkStyle(grammarOf(SCRIPT, WORD_BLOCKS_LOWER));
        expect(errors(fs)).toEqual([]);
        expect(fs.filter(f => f.level === 'notice')).toEqual([
            { level: 'notice', rule: 'case-injective', where: 'style begin-end-lower', message: 'class keywords kept as declared: case lower would fold End onto "end", a style word' },
        ]);
    });

    it('a class keyword equal to a block token, without folding, is a block-delimiters error', () => {
        const END_LOWER = mm([{ name: 'Script', references: [{ name: 'steps', type: 'end', containment: true, many: true }] }, { name: 'end' }]);
        expect(errors(checkStyle(grammarOf(END_LOWER, WORD_BLOCKS)))).toEqual([['block-delimiters', 'class end']]);
    });

    it('a list separator equal to the terminator', () => {
        expect(errors(checkStyle(grammarOf(FIXTURE, SEPARATOR_IS_TERMINATOR)))).toEqual([['terminator', 'style.terminator']]);
    });

    it('a list separator that continues a reference path, and list tokens not distinct', () => {
        expect(errors(checkStyle(grammarOf(FIXTURE, DOT_SEPARATOR)))).toEqual([['list-tokens', 'style.list.separator']]);
        expect(errors(checkStyle(grammarOf(FIXTURE, { ...CLIKE_STYLE, list: { open: '[', separator: ']', close: ']' } })))).toEqual([['list-tokens', 'style.list']]);
    });

    it('a free-layout style without block tokens', () => {
        expect(errors(checkStyle(grammarOf(BOX, { ...CLIKE_STYLE, blockOpen: [], blockClose: [] })))).toEqual([
            ['block-delimiters', 'style.blockOpen'], ['block-delimiters', 'style.blockClose'],
        ]);
    });

    it('R-TXT-32: a style token, comment opener or string quote that starts with "@" is an outer-reference error (mutants: rule removed; comments or quote not checked)', () => {
        expect(errors(checkStyle(grammarOf(FIXTURE, { ...CLIKE_STYLE, comments: { line: '@@', block: null } })))).toEqual([['outer-reference', 'style.comments.line']]);
        expect(errors(checkStyle(grammarOf(FIXTURE, { ...CLIKE_STYLE, comments: { line: '//', block: ['@*', '*@'] } })))).toEqual([['outer-reference', 'style.comments.block']]);
        expect(errors(checkStyle(grammarOf(FIXTURE, { ...CLIKE_STYLE, terminator: ['@'] })))).toEqual([['outer-reference', 'style.terminator']]);
        expect(errors(checkStyle(grammarOf(FIXTURE, { ...CLIKE_STYLE, string: { quote: '@', escape: 'double' } })))).toEqual([['outer-reference', 'style.string.quote']]);
    });

    it('§A.2 (i): a feature redeclared by an heir', () => {
        const fs = checkStyle(grammarOf(REDECLARED));
        expect(errors(fs)).toEqual([['distinct-features', 'class C']]);
        expect(fs[0].message).toBe('the keyword "x" starts 2 features: A.x, C.x');
    });

    it('§A.2 (ii): two classes of one name', () => {
        expect(errors(checkStyle(grammarOf(HOMONYMS)))).toEqual([['distinct-classes', 'Model']]);
    });

    it('two literals declared the same: the fallback cannot separate them', () => {
        expect(errors(checkStyle(grammarOf(mm([{ name: 'K', attributes: [{ name: 'k', type: 'E' }] }], { E: ['a', 'a', 'b'] }))))).toEqual([['case-injective', 'enumeration E']]);
    });
});

describe('nearley as the unambiguity oracle (R-TXT-21 (1))', () => {
    it.each([...CORPUS, ...PASCAL_CORPUS.map(([n, sp, st]) => [`${n}, Pascal/Ada`, sp, st] as [string, Spec, NotationStyle])])('%s: every sample has exactly one parse', (_, spec, style) => {
        const g = grammarOf(spec, style);
        const ng = nearleyGrammarOf(g);
        const samples = generateSamples(g);
        const counts = samples.map(s => [s.text, parseCount(g, s.text, ng)] as const);
        expect(counts.filter(([, n]) => n !== 1)).toEqual([]);
        expect(samples.length).toBeGreaterThan(g.rules.length);
    });

    // One enumeration with more literals than one round of samples visits: the rounds must cycle through them.
    const COVERAGE: [string, Spec, NotationStyle][] = [...CORPUS, ['five literals', mm([{ name: 'K', attributes: [{ name: 'k', type: 'E' }] }], { E: ['a', 'b', 'c', 'd', 'e'] }), CLIKE_STYLE]];
    it.each(COVERAGE)('%s: the samples cover every rule, feature, alternative, repetition and separator', (_, spec, style) => {
        const g = grammarOf(spec, style);
        const covered = new Set(generateSamples(g).flatMap(s => [...s.covered]));
        const wanted = g.rules.flatMap(r => {
            switch (r.t) {
                case 'model': return [r.name];
                case 'object': return [
                    r.name, ...r.features.map(f => `${r.cls}.${f.name}`), ...(r.named ? [`${r.cls}.name`] : []),
                    ...r.features.filter(f => f.many).map(f => `${r.cls}.${f.name}${f.kind === 'containment' ? '*' : ','}`),
                ];
                case 'enum': return [r.name, ...r.literals.map(l => `${r.name}=${l}`)];
                case 'choice': return [r.name, ...(r.body.t === 'alt' ? r.body.alts.map(a => `${r.name}>${a.t === 'rule' ? a.name : '?'}`) : [])];
            }
        });
        expect(wanted.filter(w => !covered.has(w))).toEqual([]);
    });

    it('the printed fixture has exactly one parse, in both cases', () => {
        for (const style of [CLIKE_STYLE, LOWER]) {
            const g = grammarOf(FIXTURE, style);
            expect(parseCount(g, printTextModel(g, objectsOf(FIXTURE)).text)).toBe(1);
        }
    });

    it('the oracle sees an ambiguity where the check reports one (kills: an oracle that always answers one)', () => {
        const ambiguous = (g: ConcreteGrammar): string[] => generateSamples(g).map(s => s.text).filter(t => parseCount(g, t) > 1);
        expect(ambiguous(grammarOf(REDECLARED)).filter(t => /^C \{ x -?\d+\n\}$/.test(t))).toHaveLength(2);
        expect(ambiguous(grammarOf(HOMONYMS)).length).toBeGreaterThan(0);
        expect(ambiguous(grammarOf(FIXTURE, DOT_SEPARATOR)).some(t => t.includes('peers ['))).toBe(true);
        expect(parseCount(grammarOf(FIXTURE), 'Part { size one }')).toBe(0);
    });
});

// Step C lane C1a (P-2026-11-04-0910): the conditions an expression adds, each with the BOOL variant that breaks it.
describe('the operators of an expression', () => {
    const findings = (record: Parameters<typeof boolGrammar>[0], mm = BOOL_MM, ids = BOOL_IDS): [string, string, string][] =>
        checkStyle(boolGrammar(record, mm, ids)).filter(f => f.level === 'error').map(f => [f.rule, f.where, f.message]);
    const PASCAL_NOT = withOperator(BOOL_PASCAL, 'C_Not', { symbol: 'not', precedence: 4 });

    it('BOOL holds every rule in both styles', () => {
        for (const record of [BOOL_CLIKE, BOOL_PASCAL]) {
            expect(checkStyle(boolGrammar(record)).map(f => [f.level, f.rule])).toEqual(STYLE_RULES.map(r => ['ok', r]));
        }
        expect(STYLE_RULES.slice(-5)).toEqual(['operator-fixity', 'operator-symbols', 'operator-tokens', 'operator-follow', 'call-words']);
    });

    it('operator-fixity: a symbol is prefix on one class and infix on another at most (C1b)', () => {
        // A prefix and an infix share a symbol, as the unary and the binary minus do: accepted, in either order.
        expect(findings(withOperator(BOOL_CLIKE, 'C_Not', { symbol: '&', precedence: 4 }))).toEqual([]);
        expect(checkStyle(arithGrammar()).filter(f => f.level === 'error')).toEqual([]);
        // Two infix fixities on one symbol stay an error, and so does a third fixity next to the pair.
        expect(findings(withOperator(BOOL_CLIKE, 'C_Imp', { symbol: '&', precedence: 1, assoc: 'right' }))).toEqual([
            ['operator-fixity', 'class And', 'the symbol "&" is n-ary here and binary for Imp: one fixity per symbol'],
        ]);
        expect(findings(withOperator(withOperator(BOOL_CLIKE, 'C_Not', { symbol: '&', precedence: 4 }), 'C_Imp', { symbol: '&', precedence: 1, assoc: 'right' }))).toEqual([
            ['operator-fixity', 'class And', 'the symbol "&" is n-ary here and binary for Imp: one fixity per symbol'],
        ]);
    });

    it('operator-symbols: two classes do not share a symbol', () => {
        expect(findings(withOperator(BOOL_CLIKE, 'C_Or', { symbol: '&', precedence: 2, call: 'or' }))).toEqual([
            ['operator-symbols', 'class And', 'the symbol "&" is the symbol of Or too'],
        ]);
    });

    it('operator-tokens: a symbol is no token of the style, of the expression or of a reference, and no comment', () => {
        expect(findings(withOperator(BOOL_CLIKE, 'C_And', { symbol: '{', precedence: 3 }))).toEqual([
            ['operator-tokens', 'class And', 'the symbol "{" is the style token style.blockOpen'],
        ]);
        expect(findings(withOperator(BOOL_CLIKE, 'C_And', { symbol: '(', precedence: 3 }))).toEqual([
            ['operator-tokens', 'class And', 'the symbol "(" is a token of the expression itself'],
        ]);
        expect(findings(withOperator(BOOL_CLIKE, 'C_And', { symbol: '.', precedence: 3 }))).toEqual([
            ['operator-tokens', 'class And', 'the symbol "." is a token of a reference'],
        ]);
        expect(findings(withOperator(PASCAL_NOT, 'C_Imp', { symbol: '-', precedence: 1, assoc: 'right' }))).toEqual([
            ['operator-tokens', 'class Imp', 'the symbol "-" is a prefix of "--": the longer token would be read'],
        ]);
        expect(findings(withOperator(BOOL_CLIKE, 'C_Imp', { symbol: '//>', precedence: 1, assoc: 'right' }))).toEqual([
            ['operator-tokens', 'class Imp', 'the symbol "//>" starts with the comment opener "//"'],
        ]);
    });

    it('operator-follow: an infix symbol does not follow an expression', () => {
        const mm = { ...BOOL_MM, classes: BOOL_MM.classes.map(c => (c.name === 'Rule' ? { ...c, references: [{ name: 'when', type: 'Expr', containment: true, many: true }] } : c)) };
        const record = withOperator(<SyntaxAnnotations>{ ...BOOL_CLIKE, classes: { ...BOOL_CLIKE.classes, C_Lit: { keyword: 'lit', layout: 'line' } } }, 'C_Or', { symbol: 'lit', precedence: 2 });
        expect(findings(record, mm)).toEqual([
            ['operator-follow', 'class Or', 'the infix symbol "lit" can also follow an expression of Expr_'],
        ]);
    });

    it('call-words: not the keyword of another class, not a symbol, not shared', () => {
        expect(findings(withOperator(BOOL_CLIKE, 'C_And', { symbol: '&', precedence: 3, call: 'Rule' }))).toEqual([
            ['call-words', 'class And', 'the call word "Rule" is the keyword of Rule'],
        ]);
        expect(findings(withOperator(BOOL_PASCAL, 'C_And', { symbol: 'and', precedence: 3, call: 'or' }))).toEqual([
            ['call-words', 'class And', 'the call word "or" is an operator symbol'],
        ]);
        expect(findings(withOperator(BOOL_CLIKE, 'C_And', { symbol: '&', precedence: 3, call: 'or' }))).toEqual([
            ['annotations', 'rule Expr_', 'not LL(1): "or" can start the call form of Or and the call form of And'],
            ['call-words', 'class And', 'the call word "or" is the call word of Or too'],
        ]);
    });

    it('annotations: a primary that can be empty, and two starts of an expression that overlap, are not LL(1)', () => {
        const ids = { ...BOOL_IDS, features: { ...BOOL_IDS.features, F_Use_atom: { owner: 'Use', name: 'atom', lower: 0 } } };
        expect(findings(BOOL_CLIKE, BOOL_MM, ids)).toEqual([['annotations', 'rule Expr_', 'not LL(1): the primary Use can be empty']]);
        const lit: SyntaxAnnotations = { ...BOOL_CLIKE, classes: { ...BOOL_CLIKE.classes, C_Lit: { keyword: 'lit', layout: 'line' } } };
        expect(findings(withOperator(lit, 'C_Not', { symbol: 'lit', precedence: 4 }))).toEqual([
            ['annotations', 'rule Expr_', 'not LL(1): "lit" can start Lit and the prefix operator Not'],
        ]);
    });

    it('nearley: BOOL samples rooted at Sheet have one parse in both styles; Or sharing "&" is ambiguous', () => {
        for (const record of [BOOL_CLIKE, BOOL_PASCAL]) {
            const g = boolGrammar(record);
            const n = nearleyGrammarOf(g);
            // The last sample joins the roots' samples, and only Sheet stands at the top level.
            const samples = generateSamples(g).slice(0, -1).filter(x => x.covered.has('Sheet') && x.covered.has('Expr_'));
            expect(samples.length).toBeGreaterThan(0);
            for (const x of samples) expect([x.text, parseCount(g, x.text, n)]).toEqual([x.text, 1]);
            const covered = new Set(samples.flatMap(x => [...x.covered]));
            for (const k of ['Expr_>Imp', 'Expr_>Or', 'Expr_>And', 'Expr_>Not', 'Expr_>Or()', 'Expr_>And()', 'Expr_>0', 'Expr_>1', 'Expr_()']) expect(covered).toContain(k);
        }
        const g = boolGrammar(withOperator(BOOL_CLIKE, 'C_Or', { symbol: '&', precedence: 2, call: 'or' }));
        expect(parseCount(g, 'Sheet s { rules { Rule r { when { a & b } } } }')).toBe(2);
    });
});

// The RISC-V Briefs' SyncRTL, read-only from the prototype's folder in the PROTO environment variable (no path in the
// repo); skipped without it. C1d: Ref.name is optional, and a positional one-line Ref keeps it under R-TXT-41 (D3),
// printing `{}` when unset; the port line `input instr : Word(32)`.
const PROTO = process.env.PROTO ?? '';

function syncRtl(): { mm: TextMetamodel; ids: ElementIds } {
    const text = readFileSync(`${PROTO}/metamodels/SyncRTL.ecore`, 'utf8');
    const classes: TextMetamodel['classes'][number][] = [];
    const enumerations: TextMetamodel['enumerations'][number][] = [];
    const ids = { classes: {} as Record<string, string>, features: {} as Record<string, { owner: string; name: string; lower: number }>, enums: {} as Record<string, string> };
    const re = /<eClassifiers xsi:type="ecore:(EClass|EEnum)" name="(\w+)"([^>]*?)(\/>|>([\s\S]*?)<\/eClassifiers>)/g;
    for (const [, kind, name, attrs, , body = ''] of text.matchAll(re)) {
        if (kind === 'EEnum') { enumerations.push({ name, literals: [...body.matchAll(/eLiterals name="(\w+)"/g)].map(x => x[1]) }); ids.enums[`E_${name}`] = name; continue; }
        const supers = /eSuperTypes="([^"]+)"/.exec(attrs)?.[1].split(' ').map(x => x.replace('#//', ''));
        const attributes: { name: string; type: string; many: boolean }[] = [];
        const references: { name: string; type: string; many: boolean; containment: boolean }[] = [];
        for (const [, k, n, a] of body.matchAll(/<eStructuralFeatures xsi:type="ecore:(EAttribute|EReference)" name="(\w+)"([^>]*)>/g)) {
            const type = /eType="[^"]*?(\w+)"/.exec(a)![1];
            const many = a.includes('upperBound="-1"');
            if (k === 'EAttribute') attributes.push({ name: n, type, many });
            else references.push({ name: n, type, many, containment: a.includes('containment="true"') });
            ids.features[`F_${name}_${n}`] = { owner: name, name: n, lower: a.includes('lowerBound="1"') ? 1 : 0 };
        }
        classes.push({ name, isAbstract: attrs.includes('abstract="true"'), supers, attributes, references });
        ids.classes[`C_${name}`] = name;
    }
    return { mm: { classes, enumerations }, ids };
}

/** A SyncRTL model from its JSON (nested objects): ids `o1`, `o2`, ... in document order (the probe's loader, C1b). */
function loadSync(path: string): TextObject[] {
    const out: TextObject[] = [];
    let n = 0;
    const walk = (e: Record<string, unknown>): string => {
        const id = `o${++n}`;
        const slots: Record<string, unknown> = {};
        out.push({ id, cls: String(e.__type), slots });
        for (const [k, v] of Object.entries(e)) {
            if (k.startsWith('__') || k === 'className') continue;
            if (Array.isArray(v)) slots[k] = v.map(x => (x && typeof x === 'object' ? walk(x as Record<string, unknown>) : x));
            else if (v && typeof v === 'object') slots[k] = walk(v as Record<string, unknown>);
            else slots[k] = v;
        }
        return id;
    };
    walk(JSON.parse(readFileSync(path, 'utf8')));
    return out;
}
const SYNC_FILES = ['out/arb3-syncrtl.json', 'out/arb3_rr-syncrtl.json', 'out/arb3_fixed-syncrtl.json', 'out/scaling-ref/mc_w4_r4-syncrtl.json', 'out/scaling-ref/pf_w4_r4-syncrtl.json', 'out/scaling-ref/mc_w32_r32-syncrtl.json'];

describe.skipIf(!PROTO)('the Briefs: SyncRTL with the operator table of the probe (PROTO)', () => {
    const table: [string, { symbol: string; precedence: number; assoc?: 'left' | 'right'; call?: string }, string][] = [
            ['Implies', { symbol: '->', precedence: 1, assoc: 'right' }, 'binary'],
            ['Disj', { symbol: '|', precedence: 2, call: 'or' }, 'nary'],
            ['Conj', { symbol: '&', precedence: 3, call: 'and' }, 'nary'],
            ['Eq', { symbol: '=', precedence: 4 }, 'binary'],
            ['Le', { symbol: '<=', precedence: 4 }, 'binary'],
            ['Add', { symbol: '+', precedence: 5 }, 'binary'],
            ['Sub', { symbol: '-', precedence: 5 }, 'binary'],
            ['Neg', { symbol: '!', precedence: 9 }, 'prefix'],
    ];
    // Positional Port and Ref cannot both stand at the top level: the roots are the uncontained classes.
    const record: SyntaxAnnotations = {
        v: 1,
        roots: 'uncontained',
        classes: {
            ...Object.fromEntries(table.map(([cls, operator]) => [`C_${cls}`, { operator }])),
            C_Ref: { keyword: '', layout: 'line' }, C_Port: { keyword: '', layout: 'line' }, C_Word: { layout: 'call' }, C_Bool: { layout: 'line' },
        },
        features: {
            F_Module_inputs: { itemKeyword: 'input' }, F_Module_outputs: { itemKeyword: 'output' },
            F_Port_type: { keyword: ':', inline: true }, F_Port_driver: { inline: true },
        },
    };

    it('derives the fixities and holds the five operator rules', () => {
        const { mm, ids } = syncRtl();
        for (const [cls, , fixity] of table) {
            expect([cls, operatorFixity(classFeatures(mm, mm.classes.find(c => c.name === cls)!))?.fixity]).toEqual([cls, fixity]);
        }
        const g = boolGrammar(record, mm, ids);
        const expr = g.rules.find(r => r.body.t === 'expr')?.body;
        expect(expr?.t === 'expr' && expr.operators.map(o => o.cls)).toEqual(['Implies', 'Disj', 'Conj', 'Eq', 'Le', 'Add', 'Sub', 'Neg']);
        expect((g.annotationIssues ?? []).filter(i => i.level === 'error')).toEqual([]);
        expect(checkStyle(g).filter(f => f.level === 'error')).toEqual([]);
        const rules = new Set(STYLE_RULES.slice(-5));
        expect(checkStyle(g).filter(f => rules.has(f.rule)).map(f => [f.level, f.rule])).toEqual(STYLE_RULES.slice(-5).map(r => ['ok', r]));
    });

    it('print-parse-print is byte-identical on the six models; dmem_we and its driver read on one line (C1b, C1d)', () => {
        const { mm, ids } = syncRtl();
        const g = boolGrammar(record, mm, ids);
        for (const f of SYNC_FILES) {
            const first = printTextModel(g, loadSync(`${PROTO}/${f}`)).text;
            const r = parseText(first, g);
            expect(r.errors, f).toEqual([]);
            expect(printTextModel(g, r.objects).text === first, f).toBe(true);
            if (f.includes('mc_w4_r4')) {
                const lines = first.split('\n');
                expect(lines.filter(l => /^\s*(input|output) dmem_we\b/.test(l)).map(l => l.trim())).toEqual(['output dmem_we origin "Core:memory port" : Bool driver st & or(is_sw)']);
                expect(lines.filter(l => /^\s*input instr\b/.test(l)).map(l => l.trim())).toEqual(['input instr origin "Core:instruction port" : Word(32)']);
            }
        }
    });
});
