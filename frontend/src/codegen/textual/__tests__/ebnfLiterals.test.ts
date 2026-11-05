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
import { fieldKey, fieldsOf, literalDefault, literalField, setLiteral } from '../syntaxForm';
import { textualNotation } from '../syntaxRecord';
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

// ---- The literal's field (syntaxForm.ts; report §3.1, D4, D5, D8, D11) ----------------------------------------------

/** The grammar a draft derives, as the form reads it. */
const derived = (c: Pick<Case, 'mm' | 'ids'>, draft: SyntaxAnnotations): ConcreteGrammar => textualNotation(c.mm, { record: draft, issues: [] }, c.ids).grammar;
const PORT: Pick<Case, 'mm' | 'ids'> = { mm: PORT_MM, ids: PORT_IDS };
const BOOL: Pick<Case, 'mm' | 'ids'> = { mm: BOOL_MM, ids: BOOL_IDS };
const LIBRARY: Pick<Case, 'mm' | 'ids'> = { mm: LIB_MM, ids: LIB_IDS };

/** The origin of the first literal printed as `text`. */
function srcOf(g: ConcreteGrammar, text: string): LiteralSrc {
    const l = concreteGrammarEbnfSpans(g).literals.find(x => x.text === text);
    if (!l?.src) throw new Error(`no literal "${text}"`);
    return l.src;
}

/** The draft an edit gives, failing the test on a refusal. */
function edited(c: Pick<Case, 'mm' | 'ids'>, draft: SyntaxAnnotations, text: string, value: string): SyntaxAnnotations {
    const r = setLiteral(c.mm, c.ids, draft, srcOf(derived(c, draft), text), value);
    if (!r.ok) throw new Error(`refused: ${r.reason}`);
    return r.draft;
}

/** The refusal of an edit, undefined when accepted. */
function refusal(c: Pick<Case, 'mm' | 'ids'>, draft: SyntaxAnnotations, text: string, value: string): string | undefined {
    const r = setLiteral(c.mm, c.ids, draft, srcOf(derived(c, draft), text), value);
    return r.ok ? undefined : r.reason;
}

describe('the field of an EBNF literal (R-TXT-48)', () => {
    it.each(CASES)('$name: every element origin maps to a field the form shows for that element', c => {
        for (const l of concreteGrammarEbnfSpans(c.grammar()).literals) {
            if (!isElement(l)) continue;
            const ref = literalField(c.mm, c.ids, l.src);
            expect(ref, `${l.text} ${JSON.stringify(l.src)}`).toBeDefined();
            expect(fieldsOf(c.mm, c.ids, ref!.element, 'advanced').map(f => f.id)).toContain(ref!.field);
        }
    });

    it.each(CASES)('$name: an enumeration literal, a fixed token and a style token map to no field (D8, D11)', c => {
        for (const l of concreteGrammarEbnfSpans(c.grammar()).literals) {
            if (isElement(l)) continue;
            expect(literalField(c.mm, c.ids, l.src)).toBeUndefined();
        }
    });

    it('the port line\'s literals go to their record fields, by id', () => {
        const g = portGrammar(PORT_CLIKE);
        const at = (text: string) => { const r = literalField(PORT_MM, PORT_IDS, srcOf(g, text)); return r && fieldKey(r); };
        expect(at('input')).toBe('feature:F_Module_inputs#feature.itemKeyword');
        expect(at(':')).toBe('feature:F_Port_type#feature.keyword');
        expect(at('&')).toBe('class:C_Conj#class.operatorSymbol');
        expect(at('and')).toBe('class:C_Conj#class.operatorCall');
        expect(at('Word')).toBe('class:C_Word#class.keyword');
        expect(at('Module')).toBe('class:C_Module#class.keyword');
    });

    it('the Library\'s literals: the name keyword, a group name, a feature keyword', () => {
        const g = boolGrammar(LIB(), LIB_MM, LIB_IDS);
        const at = (text: string) => { const r = literalField(LIB_MM, LIB_IDS, srcOf(g, text)); return r && fieldKey(r); };
        expect(at('called')).toBe('class:C_Library#class.nameKeyword');
        expect(at('verse')).toBe('enum:E_Genre#enum.subsets');
        expect(at('pp')).toBe('feature:F_Book_pages#feature.keyword');
        expect(at('library')).toBe('class:C_Library#class.keyword');
    });
});

describe('the printed default (D5)', () => {
    it('is the text the origin prints with its field cleared, the class case applied', () => {
        const lower: SyntaxAnnotations = { ...PORT_CLIKE, style: { classCase: 'lower' } };
        const g = derived(PORT, lower);
        expect(literalDefault(PORT_MM, PORT_IDS, lower, srcOf(g, 'module'))).toBe('module');
        const annotated = edited(PORT, lower, 'module', 'unit');
        expect(literalDefault(PORT_MM, PORT_IDS, annotated, srcOf(derived(PORT, annotated), 'unit'))).toBe('module');
    });

    it('of a call word is the class keyword, not the class name under a case', () => {
        expect(literalDefault(BOOL_MM, BOOL_IDS, BOOL_CLIKE, srcOf(boolGrammar(BOOL_CLIKE), 'or'))).toBe('Or');
        const lower: SyntaxAnnotations = { ...BOOL_CLIKE, style: { classCase: 'lower' } };
        expect(literalDefault(BOOL_MM, BOOL_IDS, lower, srcOf(derived(BOOL, lower), 'or'))).toBe('or');
    });

    it('is absent where clearing the field removes the literal', () => {
        const g = portGrammar(PORT_CLIKE);
        expect(literalDefault(PORT_MM, PORT_IDS, PORT_CLIKE, srcOf(g, 'input'))).toBeUndefined();
        expect(literalDefault(PORT_MM, PORT_IDS, PORT_CLIKE, srcOf(g, '&'))).toBeUndefined();
    });

    it('a value equal to the default is stored as cleared, any other value as given', () => {
        const mod = edited(PORT, PORT_CLIKE, 'Module', 'unit');
        expect(mod.classes?.C_Module).toEqual({ keyword: 'unit' });
        expect(edited(PORT, mod, 'unit', 'Module').classes?.C_Module).toBeUndefined();
        const lower: SyntaxAnnotations = { ...PORT_CLIKE, style: { classCase: 'lower' } };
        expect(edited(PORT, lower, 'module', 'module').classes?.C_Module).toBeUndefined();
        expect(edited(PORT, lower, 'module', 'Module').classes?.C_Module).toEqual({ keyword: 'Module' });
    });

    it('a call word set back to the class keyword is cleared; the operator keeps the rest', () => {
        const d = edited(BOOL, BOOL_CLIKE, 'or', 'Or');
        expect(d.classes?.C_Or).toEqual({ operator: { symbol: '|', precedence: 2 } });
    });

    it('a punctuation keyword set to the feature name is cleared, inline kept', () => {
        expect(edited(PORT, PORT_CLIKE, ':', 'type').features?.F_Port_type).toEqual({ inline: true });
        expect(edited(PORT, PORT_CLIKE, ':', 'of').features?.F_Port_type).toEqual({ keyword: 'of', inline: true });
    });

    it('one edit changes every occurrence of its origin', () => {
        const np = edited(LIBRARY, LIB(), 'pp', 'np');
        const texts = (d: SyntaxAnnotations) => concreteGrammarEbnfSpans(derived(LIBRARY, d)).literals
            .filter(l => l.src?.k === 'feature' && l.src.feature === 'Book.pages').map(l => l.text);
        expect(texts(np)).toEqual(['np', 'np', 'np']);
        const pages = edited(LIBRARY, LIB(), 'pp', 'pages');
        expect(pages.features?.F_Book_pages).toBeUndefined();
        expect(texts(pages)).toEqual(['pages', 'pages', 'pages']);
    });
});

describe('the value of an EBNF literal (D4, well-formedness)', () => {
    it('an empty value is the default for a class keyword, a feature keyword and a call word', () => {
        expect(edited(PORT, edited(PORT, PORT_CLIKE, 'Module', 'unit'), 'unit', '').classes?.C_Module).toBeUndefined();
        expect(edited(PORT, PORT_CLIKE, ':', '').features?.F_Port_type).toEqual({ inline: true });
        expect(edited(BOOL, BOOL_CLIKE, 'and', '').classes?.C_And).toEqual({ operator: { symbol: '&', precedence: 3 } });
    });

    it('an empty value is refused for a per-item keyword, a name keyword, an operator symbol and a group name', () => {
        expect(refusal(PORT, PORT_CLIKE, 'input', '')).toMatch(/empty/);
        expect(refusal(LIBRARY, LIB(), 'called', '')).toMatch(/empty/);
        expect(refusal(PORT, PORT_CLIKE, '&', '')).toMatch(/empty/);
        expect(refusal(LIBRARY, LIB(), 'prose', '')).toMatch(/empty/);
    });

    it('a quote or a blank is refused in any literal', () => {
        expect(refusal(PORT, PORT_CLIKE, 'Module', 'a"b')).toMatch(/quote/);
        expect(refusal(PORT, PORT_CLIKE, '&', '"')).toMatch(/quote/);
        expect(refusal(PORT, PORT_CLIKE, 'input', 'in put')).toMatch(/blank/);
        expect(refusal(PORT, PORT_CLIKE, ':', ' :')).toMatch(/blank/);
        expect(refusal(BOOL, BOOL_CLIKE, 'and', 'and\t')).toMatch(/blank/);
    });

    it('a value not well formed for its field is refused with a reason', () => {
        expect(refusal(PORT, PORT_CLIKE, 'Module', '1x')).toMatch(/identifier/);
        expect(refusal(PORT, PORT_CLIKE, ':', 'a-b')).toMatch(/identifier|punctuation/);
        expect(refusal(PORT, PORT_CLIKE, 'input', ':')).toMatch(/identifier/);
        expect(refusal(LIBRARY, LIB(), 'called', 'x.y')).toMatch(/identifier/);
        expect(refusal(BOOL, BOOL_CLIKE, 'and', '&&')).toMatch(/identifier/);
        expect(refusal(BOOL, BOOL_CLIKE, '|', 'a+')).toMatch(/symbol/);
        expect(refusal(LIBRARY, LIB(), 'prose', '9')).toMatch(/identifier/);
    });

    it('well-formed values are written to their fields', () => {
        expect(edited(PORT, PORT_CLIKE, 'input', 'in').features?.F_Module_inputs).toEqual({ itemKeyword: 'in' });
        expect(edited(PORT, PORT_CLIKE, ':', '::').features?.F_Port_type).toEqual({ keyword: '::', inline: true });
        expect(edited(LIBRARY, LIB(), 'called', 'named').classes?.C_Library).toEqual({ keyword: 'library', name: { keyword: 'named' } });
        expect(edited(BOOL, BOOL_CLIKE, '|', '||').classes?.C_Or).toEqual({ operator: { symbol: '||', precedence: 2, call: 'or' } });
        expect(edited(BOOL, BOOL_PASCAL, 'or', 'orelse').classes?.C_Or).toEqual({ operator: { symbol: 'orelse', precedence: 2 } });
    });

    it('a group name renames its own group only', () => {
        const d = edited(LIBRARY, LIB(), 'verse', 'poetry');
        expect(d.enums?.E_Genre?.subsets).toEqual([{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'poetry', literals: ['POETRY'] }]);
        expect(concreteGrammarEbnfSpans(derived(LIBRARY, d)).literals.filter(l => l.src?.k === 'subset').map(l => l.text)).toEqual(['prose', 'poetry']);
    });

    it('an enumeration literal, a fixed token and a style token are read only (D8, D11)', () => {
        expect(refusal(LIBRARY, LIB(), 'FICTION', 'FACT')).toMatch(/read only/);
        expect(refusal(PORT, PORT_CLIKE, '(', '[')).toMatch(/read only/);
        expect(refusal(PORT, PORT_CLIKE, ',', ';')).toMatch(/read only/);
        expect(refusal(BOOL, BOOL_PASCAL, 'begin', 'do')).toMatch(/read only/);
    });
});
