/**
 * Step T3 of the textual notation (P-2026-11-01-2356; R-TXT-16, R-TXT-21 (1) and (10),
 * docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.2, §A.7): the style check on T1's corpus, on deliberately
 * broken styles and metamodels, and nearley as the oracle that counts parses on samples of each concrete grammar.
 */

import { describe, it, expect } from 'vitest';
import { deriveBaseGrammar } from '../baseGrammar';
import { deriveConcreteGrammar } from '../concreteGrammar';
import type { ConcreteGrammar } from '../concreteGrammar';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { checkStyle, STYLE_RULES } from '../styleCheck';
import type { StyleFinding } from '../styleCheck';
import { generateSamples, nearleyGrammarOf, parseCount } from './oracle';
import { FIXTURE, metamodelOf, objectsOf } from './spec';
import type { Spec } from './spec';

const grammarOf = (spec: Spec, style: NotationStyle = CLIKE_STYLE): ConcreteGrammar => deriveConcreteGrammar(deriveBaseGrammar(metamodelOf(spec)), style);
const errors = (fs: readonly StyleFinding[]): [string, string][] => fs.filter(f => f.level === 'error').map(f => [f.rule, f.where]);
const LOWER: NotationStyle = { ...CLIKE_STYLE, id: 'c-like-lower', classCase: 'lower', literalCase: 'lower' };

// T1's corpus (textual.test.ts), the metamodels only: that file exports nothing.
const mm = (classes: Spec['classes'], enums: Spec['enums'] = {}): Spec => ({ classes, enums, objects: [] });
const DIAMOND = mm([
    { name: 'A', isAbstract: true, attributes: [{ name: 'a', type: 'EInt' }], references: [{ name: 'ra', type: 'C' }] },
    { name: 'B1', isAbstract: true, supers: ['A'], attributes: [{ name: 'b1', type: 'EInt' }] },
    { name: 'B2', isAbstract: true, supers: ['A'], attributes: [{ name: 'b2', type: 'EInt' }] },
    { name: 'C', supers: ['B1', 'B2'], attributes: [{ name: 'c', type: 'EInt' }], references: [{ name: 'rc', type: 'C' }] },
]);
const NON_DIAMOND = mm([
    { name: 'Q1', isAbstract: true, attributes: [{ name: 'q1', type: 'EInt' }] },
    { name: 'Q2', isAbstract: true, attributes: [{ name: 'q2', type: 'EInt' }] },
    { name: 'T', isAbstract: true, attributes: [{ name: 't', type: 'EInt' }] },
    { name: 'S', isAbstract: true, supers: ['T'], attributes: [{ name: 's', type: 'EInt' }] },
    { name: 'P', isAbstract: true, supers: ['Q1', 'Q2'], attributes: [{ name: 'p', type: 'EInt' }] },
    { name: 'R', isAbstract: true, supers: ['S'], attributes: [{ name: 'r', type: 'EInt' }] },
    { name: 'C', supers: ['P', 'R'], attributes: [{ name: 'c', type: 'EInt' }] },
]);
const GARAGE = mm([
    { name: 'Item', isAbstract: true, attributes: [{ name: 'name', type: 'EString' }] },
    {
        name: 'Car', supers: ['Item'],
        attributes: [{ name: 'speed', type: 'EDouble' }, { name: 'colors', type: 'Color', many: true }, { name: 'marks', type: 'EInt', many: true }],
        references: [
            { name: 'engine', type: 'Engine', containment: true }, { name: 'wheels', type: 'Wheel', containment: true, many: true },
            { name: 'spare', type: 'Item', containment: true, many: true },
            { name: 'best', type: 'Item' }, { name: 'tow', type: 'Car' }, { name: 'eng', type: 'Engine' },
        ],
    },
    { name: 'Wheel', supers: ['Item'], attributes: [{ name: 'size', type: 'EInt' }], references: [{ name: 'bolts', type: 'Bolt', containment: true, many: true }, { name: 'pair', type: 'Bolt' }] },
    { name: 'Engine', attributes: [{ name: 'power', type: 'EInt' }, { name: 'note', type: 'EString' }] },
    { name: 'Bolt', attributes: [{ name: 'name', type: 'EString' }] },
    { name: 'Gear', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'wheel', type: 'Wheel' }] },
], { Color: ['Red', 'GREEN', 'blue'] });
const BOX = mm([
    { name: 'Box', references: [{ name: 'inner', type: 'Box', containment: true }, { name: 'label', type: 'Tag', containment: true }, { name: 'self', type: 'Box' }, { name: 'tag', type: 'Tag' }] },
    { name: 'Tag', attributes: [{ name: 'name', type: 'EString' }] },
]);
const CASES = mm([{ name: 'Node', attributes: [{ name: 'name', type: 'EString' }] }, { name: 'NODE', attributes: [{ name: 'name', type: 'EString' }] }]);

const CORPUS: [string, Spec, NotationStyle][] = [
    ['the 1709 fixture', FIXTURE, CLIKE_STYLE],
    ['a diamond', DIAMOND, CLIKE_STYLE],
    ['a multiple inheritance without a diamond', NON_DIAMOND, CLIKE_STYLE],
    ['names, homonyms, choices, a single containment', GARAGE, CLIKE_STYLE],
    ['a nameless recursive class', BOX, CLIKE_STYLE],
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

    it('a class keyword that the case folds onto a style word; the declared case is fine', () => {
        expect(errors(checkStyle(grammarOf(SCRIPT, WORD_BLOCKS)))).toEqual([]);
        const fs = checkStyle(grammarOf(SCRIPT, WORD_BLOCKS_LOWER));
        expect(errors(fs)).toEqual([['case-injective', 'class End']]);
        expect(fs.find(f => f.level === 'error')!.message).toBe('case lower folds the keyword of End onto the style word "end"');
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
