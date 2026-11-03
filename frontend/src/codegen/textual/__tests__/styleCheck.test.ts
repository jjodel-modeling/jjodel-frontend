/**
 * Step T3 of the textual notation (P-2026-11-01-2356; R-TXT-16, R-TXT-21 (1) and (10),
 * docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.2, §A.7): the style check on T1's corpus, on deliberately
 * broken styles and metamodels, and nearley as the oracle that counts parses on samples of each concrete grammar.
 */

import { describe, it, expect } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { checkStyle, STYLE_RULES } from '../styleCheck';
import type { StyleFinding } from '../styleCheck';
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
    it.each(CORPUS)('%s: every sample has exactly one parse', (_, spec, style) => {
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
