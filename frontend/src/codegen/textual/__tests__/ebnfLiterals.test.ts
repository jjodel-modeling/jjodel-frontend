/**
 * Editable EBNF literals, lane L1a (P-2026-11-05-0841; docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §1,
 * §3, R-TXT-49 D1, D4, D5, D8, D11): each quoted literal of the EBNF carries its origin, set where the grammar node is
 * created, and the spans printer finds it in the text the EBNF mode shows. On the probe's six grammars (§1.3) the
 * spans are the quoted strings of the EBNF, in order and in number.
 */

import { describe, expect, it } from 'vitest';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import { concreteGrammarEbnf, concreteGrammarEbnfSpans } from '../concreteGrammar';
import type { ConcreteGrammar, EbnfLiteral, LiteralSrc } from '../concreteGrammar';
import type { TextMetamodel } from '../metamodel';
import { BOOL_CLIKE, BOOL_IDS, BOOL_MM, BOOL_PASCAL, boolGrammar } from './boolCorpus';
import { PORT_CLIKE, PORT_IDS, PORT_MM, PORT_PASCAL, portGrammar } from './portCorpus';

/** The probe's synthetic case for the origins the corpora lack: an enumeration, a grouping, a name keyword, a list. */
const LIB_MM: TextMetamodel = {
    classes: [
        { name: 'Library', attributes: [{ name: 'name', type: 'EString' }, { name: 'tags', type: 'EString', many: true }], references: [{ name: 'books', type: 'Book', containment: true, many: true }] },
        { name: 'Book', attributes: [{ name: 'name', type: 'EString' }, { name: 'genre', type: 'Genre' }, { name: 'pages', type: 'EInt' }] },
    ],
    enumerations: [{ name: 'Genre', literals: ['FICTION', 'HISTORY', 'POETRY'] }],
};
const LIB_IDS: ElementIds = {
    classes: { C_Library: 'Library', C_Book: 'Book' },
    features: {
        F_Library_name: { owner: 'Library', name: 'name', lower: 1 }, F_Library_tags: { owner: 'Library', name: 'tags' }, F_Library_books: { owner: 'Library', name: 'books' },
        F_Book_name: { owner: 'Book', name: 'name', lower: 1 }, F_Book_genre: { owner: 'Book', name: 'genre', lower: 1 }, F_Book_pages: { owner: 'Book', name: 'pages' },
    },
    enums: { E_Genre: 'Genre' },
};
const LIB = (base?: 'pascal'): SyntaxAnnotations => ({
    v: 1, ...(base ? { style: { base } } : {}),
    classes: { C_Library: { keyword: 'library', name: { keyword: 'called' } }, C_Book: { layout: 'line' } },
    features: { F_Library_books: { groupBy: 'F_Book_genre' }, F_Book_pages: { keyword: 'pp' } },
    enums: { E_Genre: { subsets: [{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'verse', literals: ['POETRY'] }] } },
});

interface Case {
    readonly name: string;
    readonly mm: TextMetamodel;
    readonly ids: ElementIds;
    readonly record: SyntaxAnnotations;
    readonly grammar: () => ConcreteGrammar;
    /** The probe's counts (report §1.3): literals, element, style token, fixed, enumeration literal. */
    readonly counts: readonly [number, number, number, number, number];
}

const CASES: readonly Case[] = [
    { name: 'port C-like', mm: PORT_MM, ids: PORT_IDS, record: PORT_CLIKE, grammar: () => portGrammar(PORT_CLIKE), counts: [21, 10, 5, 6, 0] },
    { name: 'port Pascal', mm: PORT_MM, ids: PORT_IDS, record: PORT_PASCAL, grammar: () => portGrammar(PORT_PASCAL), counts: [23, 10, 7, 6, 0] },
    { name: 'BOOL C-like', mm: BOOL_MM, ids: BOOL_IDS, record: BOOL_CLIKE, grammar: () => boolGrammar(BOOL_CLIKE), counts: [34, 14, 14, 6, 0] },
    { name: 'BOOL Pascal', mm: BOOL_MM, ids: BOOL_IDS, record: BOOL_PASCAL, grammar: () => boolGrammar(BOOL_PASCAL), counts: [41, 14, 21, 6, 0] },
    { name: 'Library C-like', mm: LIB_MM, ids: LIB_IDS, record: LIB(), grammar: () => boolGrammar(LIB(), LIB_MM, LIB_IDS), counts: [28, 15, 7, 0, 6] },
    { name: 'Library Pascal', mm: LIB_MM, ids: LIB_IDS, record: LIB('pascal'), grammar: () => boolGrammar(LIB('pascal'), LIB_MM, LIB_IDS), counts: [44, 15, 23, 0, 6] },
];

/** The quoted strings of an EBNF text, in order, the comments skipped (the probe's reading). */
const quotedOf = (ebnf: string): string[] => [...ebnf.replace(/\(\*[\s\S]*?\*\)/g, '').matchAll(/"([^"]*)"/g)].map(m => m[1]);

const ELEMENT_KINDS: ReadonlySet<LiteralSrc['k']> = new Set(['class', 'feature', 'itemKeyword', 'nameKeyword', 'subset', 'operatorSymbol', 'operatorCall']);
const isElement = (l: EbnfLiteral): boolean => l.src !== undefined && ELEMENT_KINDS.has(l.src.k);

/** The text a style parameter gives at an index. */
function styleToken(g: ConcreteGrammar, src: Extract<LiteralSrc, { k: 'style' }>): string | undefined {
    const s = g.style;
    switch (src.param) {
        case 'list.open': return src.index === 0 ? s.list.open : undefined;
        case 'list.separator': return src.index === 0 ? s.list.separator : undefined;
        case 'list.close': return src.index === 0 ? s.list.close : undefined;
        default: return s[src.param][src.index];
    }
}

describe('EBNF literal spans (D1)', () => {
    it.each(CASES)('$name: the text is concreteGrammarEbnf byte for byte', c => {
        const g = c.grammar();
        expect(concreteGrammarEbnfSpans(g).text).toBe(concreteGrammarEbnf(g));
    });

    it.each(CASES)('$name: the spans are the quoted strings of the EBNF, in order, each between its quotes', c => {
        const { text, literals } = concreteGrammarEbnfSpans(c.grammar());
        expect(literals.map(l => l.text)).toEqual(quotedOf(text));
        for (const l of literals) {
            expect(text.slice(l.start, l.end)).toBe(l.text);
            expect(text[l.start - 1]).toBe('"');
            expect(text[l.end]).toBe('"');
        }
        expect(literals.length).toBe(c.counts[0]);
    });

    it.each(CASES)('$name: every literal has an origin, and the origins split as the probe measured', c => {
        const { literals } = concreteGrammarEbnfSpans(c.grammar());
        expect(literals.filter(l => l.src === undefined)).toEqual([]);
        const kinds = literals.map(l => l.src?.k);
        expect([
            literals.filter(isElement).length,
            kinds.filter(k => k === 'style').length,
            kinds.filter(k => k === 'fixed').length,
            kinds.filter(k => k === 'literal').length,
        ]).toEqual(c.counts.slice(1));
    });

    it.each(CASES)('$name: a style origin carries its parameter, and the literal is that parameter\'s token', c => {
        const g = c.grammar();
        for (const l of concreteGrammarEbnfSpans(g).literals) {
            if (l.src?.k !== 'style') continue;
            expect(styleToken(g, l.src)).toBe(l.text);
        }
    });

    it('the origins of the port line: item keyword, punctuation keyword, operator, call word, class keyword, fixed call tokens', () => {
        const by = new Map(concreteGrammarEbnfSpans(portGrammar(PORT_CLIKE)).literals.map(l => [l.text, l.src]));
        expect(by.get('input')).toEqual({ k: 'itemKeyword', feature: 'Module.inputs' });
        expect(by.get(':')).toEqual({ k: 'feature', feature: 'Port.type' });
        expect(by.get('&')).toEqual({ k: 'operatorSymbol', cls: 'Conj' });
        expect(by.get('and')).toEqual({ k: 'operatorCall', cls: 'Conj' });
        expect(by.get('Word')).toEqual({ k: 'class', cls: 'Word' });
        expect(by.get('(')).toEqual({ k: 'fixed' });
        expect(by.get(',')).toEqual({ k: 'style', param: 'list.separator', index: 0 });
    });

    it('the origins of the Library: name keyword, group names, enumeration literals, a feature keyword printed three times', () => {
        const { literals } = concreteGrammarEbnfSpans(boolGrammar(LIB(), LIB_MM, LIB_IDS));
        const srcOf = (t: string) => literals.filter(l => l.text === t).map(l => l.src);
        expect(srcOf('called')).toEqual([{ k: 'nameKeyword', cls: 'Library' }]);
        expect(srcOf('prose')).toEqual([{ k: 'subset', enumName: 'Genre', index: 0 }]);
        expect(srcOf('verse')).toEqual([{ k: 'subset', enumName: 'Genre', index: 1 }]);
        expect(srcOf('FICTION')).toEqual([{ k: 'literal', enumName: 'Genre', literal: 'FICTION' }, { k: 'literal', enumName: 'Genre', literal: 'FICTION' }]);
        expect(srcOf('pp')).toEqual([1, 2, 3].map(() => ({ k: 'feature', feature: 'Book.pages' })));
    });

    it('Pascal: the ";" that closes a block and the one that ends a line are two origins', () => {
        const { literals } = concreteGrammarEbnfSpans(boolGrammar(BOOL_PASCAL));
        const semis = literals.filter(l => l.text === ';').map(l => l.src);
        expect(semis).toContainEqual({ k: 'style', param: 'blockClose', index: 1 });
        expect(semis).toContainEqual({ k: 'style', param: 'terminator', index: 0 });
    });
});
