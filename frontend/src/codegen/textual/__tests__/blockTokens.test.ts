/**
 * Block tokens per element, lane B1 (P-2026-11-05-1541; docs/discovery/discovery_2026-11-05_textual_block_tokens.md §1,
 * §2, §5, R-TXT-51, R-TXT-52 D2 D4 D5 D6 D8 D9 D10): optional `blockOpen` and `blockClose` on a class and on a
 * containment, over the language-wide tokens of the style. The resolution validates them; the derivation applies them to
 * the element's blocks, refuses them where there is no block, and reserves their words; the tokenizer reads their
 * punctuation; the style check reads them per block. The target text of R-TXT-51 prints, parses and prints the same.
 * Mutations each test kills are in its name; the bench is in the commit bodies.
 */

import { describe, expect, it } from 'vitest';
import { resolveAnnotations } from '../annotations';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel, TextObject } from '../metamodel';
import { concreteGrammarEbnf, concreteGrammarEbnfSpans, DEDENT_MARK, INDENT_MARK } from '../concreteGrammar';
import type { ConcreteGrammar, GrammarNode, LiteralSrc } from '../concreteGrammar';
import { parseText, tokenizeText } from '../parser';
import { printTextModel } from '../printer';
import { checkStyle } from '../styleCheck';
import { textualNotation } from '../syntaxRecord';
import { advancedInEffect, blockTokenFields, byField, draftPreview, fieldKey, fieldsOf, fieldValue, literalDefault, literalField, parseTokens, readDraft, setField, setLiteral, tokensText } from '../syntaxForm';
import type { FieldId, FieldRef } from '../syntaxForm';

/** The probe's metamodel (report §4.4): a nameless Program holding declarations and statements, both named. */
const MM: TextMetamodel = {
    classes: [
        { name: 'Program', references: [{ name: 'declarations', type: 'Declaration', containment: true, many: true }, { name: 'statements', type: 'Statement', containment: true, many: true }] },
        { name: 'Declaration', attributes: [{ name: 'name', type: 'EString', lower: 1 }, { name: 'type', type: 'EString' }] },
        { name: 'Statement', attributes: [{ name: 'name', type: 'EString', lower: 1 }, { name: 'value', type: 'EInt' }] },
    ],
    enumerations: [],
};
const IDS: ElementIds = {
    classes: { cP: 'Program', cD: 'Declaration', cS: 'Statement' },
    features: {
        fDecls: { owner: 'Program', name: 'declarations' }, fStmts: { owner: 'Program', name: 'statements' },
        fDN: { owner: 'Declaration', name: 'name', lower: 1 }, fDT: { owner: 'Declaration', name: 'type' },
        fSN: { owner: 'Statement', name: 'name', lower: 1 }, fSV: { owner: 'Statement', name: 'value' },
    },
    enums: {},
};

/** The record of R-TXT-51's target: Pascal, Program positional and opened by `begin program`, declarations `is ... end`. */
const TARGET: SyntaxAnnotations = {
    v: 1, style: { base: 'pascal' }, roots: 'uncontained',
    classes: { cP: { keyword: '', blockOpen: ['begin', 'program'], blockClose: ['end', 'program'] }, cD: { layout: 'line' }, cS: { layout: 'line' } },
    features: { fDecls: { keyword: 'declaration', blockOpen: ['is'], blockClose: ['end'] }, fStmts: { keyword: 'statement' } },
};

/** The record with entries merged over TARGET's, by element id. */
const withEntries = (classes: Record<string, unknown>, features: Record<string, unknown> = {}, style?: Record<string, unknown>): SyntaxAnnotations => ({
    ...TARGET,
    ...(style ? { style } : {}),
    classes: { ...TARGET.classes, ...classes },
    features: { ...TARGET.features, ...features },
} as SyntaxAnnotations);

const resolved = (record: SyntaxAnnotations) => resolveAnnotations(record, IDS, MM);

describe('(1) the resolution of the per-block tokens', () => {
    it('keeps well-formed tokens on a class and on a feature, with no issue (mutant: a side not read)', () => {
        const r = resolved(TARGET);
        expect(r.issues).toEqual([]);
        expect(r.classes.Program).toEqual({ keyword: '', blockOpen: ['begin', 'program'], blockClose: ['end', 'program'] });
        expect(r.features['Program.declarations']).toEqual({ keyword: 'declaration', blockOpen: ['is'], blockClose: ['end'] });
        const p = resolved(withEntries({}, { fDecls: { blockOpen: ['<<'], blockClose: ['>>'] } }));
        expect(p.features['Program.declarations']).toEqual({ blockOpen: ['<<'], blockClose: ['>>'] });
    });

    it('drops a side that is not a list of well-formed tokens, with an error at the element; the other side stays (mutant: styleTokenFault not applied)', () => {
        const cases: [Record<string, unknown>, Record<string, unknown>, string, RegExp][] = [
            [{ cP: { blockOpen: 'begin', blockClose: ['end'] } }, {}, 'class Program', /blockOpen is not a list of tokens/],
            [{ cP: { blockOpen: ['begin'], blockClose: ['end', 'a b'] } }, {}, 'class Program', /the blockClose token "a b" holds a blank/],
            [{}, { fDecls: { blockOpen: ['is', ''], blockClose: ['end'] } }, 'Program.declarations', /the blockOpen token "" is empty/],
            [{}, { fDecls: { blockOpen: ['is'], blockClose: ['"'] } }, 'Program.declarations', /quote/],
            [{}, { fDecls: { blockOpen: ['@'], blockClose: ['end'] } }, 'Program.declarations', /neither a word nor a run of punctuation/],
            [{}, { fDecls: { blockOpen: ['is'], blockClose: [3] } }, 'Program.declarations', /is not a string/],
        ];
        for (const [classes, features, where, reason] of cases) {
            const r = resolved(withEntries(classes, features));
            const errors = r.issues.filter(i => i.level === 'error');
            expect(errors.map(i => i.where), JSON.stringify([classes, features])).toEqual([where]);
            expect(errors[0].message).toMatch(reason);
            const kept = where === 'class Program' ? r.classes.Program : r.features['Program.declarations'];
            const bad = /blockOpen/.test(errors[0].message) ? 'blockOpen' : 'blockClose';
            const good = bad === 'blockOpen' ? 'blockClose' : 'blockOpen';
            expect(kept[bad]).toBeUndefined();
            expect(kept[good]).toBeDefined();
        }
    });

    it('D6: an unknown key of a class or a feature entry is a notice, the known keys applied (mutant: unknown keys dropped silently)', () => {
        const r = resolved(withEntries({ cP: { keyword: '', before: ['begin'] } }, { fDecls: { keyword: 'declaration', blockopen: ['is'] } }));
        expect(r.issues).toEqual([
            { level: 'notice', where: 'class Program', message: 'unknown key "before": not applied' },
            { level: 'notice', where: 'Program.declarations', message: 'unknown key "blockopen": not applied' },
        ]);
        expect(r.classes.Program).toEqual({ keyword: '' });
        expect(r.features['Program.declarations']).toEqual({ keyword: 'declaration' });
    });

    it('an empty side resolves: whether it applies depends on the layout, the derivation\'s (mutant: an empty list refused by the resolution)', () => {
        const r = resolved(withEntries({ cP: { keyword: '', blockOpen: [] } }));
        expect(r.issues).toEqual([]);
        expect(r.classes.Program.blockOpen).toEqual([]);
    });
});

/** The target's objects: a program, two declarations, one statement. */
const OBJECTS: TextObject[] = [
    { id: 'p', cls: 'Program', slots: { declarations: ['d1', 'd2'], statements: ['s1'] } },
    { id: 'd1', cls: 'Declaration', slots: { name: 'x', type: 'int' } },
    { id: 'd2', cls: 'Declaration', slots: { name: 'y' } },
    { id: 's1', cls: 'Statement', slots: { name: 's', value: 3 } },
];
/** R-TXT-51's target text (report §1.4, P4). */
const TARGET_TEXT = [
    'begin program',
    '  declaration is',
    "    Declaration x type := 'int';",
    '    Declaration y',
    '  end',
    '  statement begin',
    '    Statement s value := 3;',
    '  end;',
    'end program',
].join('\n');

const notation = (record: SyntaxAnnotations, mm: TextMetamodel = MM, ids: ElementIds = IDS) => textualNotation(mm, { record, issues: [] }, ids);
const grammar = (record: SyntaxAnnotations, mm: TextMetamodel = MM, ids: ElementIds = IDS): ConcreteGrammar => notation(record, mm, ids).grammar;
const issuesOf = (record: SyntaxAnnotations, mm: TextMetamodel = MM, ids: ElementIds = IDS) => grammar(record, mm, ids).annotationIssues ?? [];
/** Print, parse with no error, print byte for byte; the text. */
const roundTrip = (g: ConcreteGrammar, objects: readonly TextObject[]): string => {
    const text = printTextModel(g, objects).text;
    const r = parseText(text, g);
    expect(r.errors).toEqual([]);
    expect(printTextModel(g, r.objects).text).toBe(text);
    return text;
};
/** Every block node of a grammar, in rule order. */
const blocks = (g: ConcreteGrammar): Extract<GrammarNode, { t: 'block' }>[] => {
    const out: Extract<GrammarNode, { t: 'block' }>[] = [];
    const visit = (n: GrammarNode): void => {
        switch (n.t) {
            case 'block': out.push(n); n.items.forEach(visit); return;
            case 'seq': n.items.forEach(visit); return;
            case 'opt': case 'star': case 'assign': case 'list': visit(n.item); return;
            case 'alt': n.alts.forEach(visit); return;
            default: return;
        }
    };
    g.rules.forEach(r => visit(r.body));
    return out;
};
/** The literals of one EBNF rule, as [text, origin]. */
const ruleLiterals = (g: ConcreteGrammar, rule: string): [string, LiteralSrc | undefined][] => {
    const { text, literals } = concreteGrammarEbnfSpans(g);
    const start = text.split('\n').findIndex(l => l.startsWith(`${rule} `));
    const from = text.split('\n').slice(0, start).join('\n').length;
    const to = from + text.split('\n')[start].length + 1;
    return literals.filter(l => l.start > from && l.end < to).map(l => [l.text, l.src]);
};

describe('(2) the derivation of the per-block tokens', () => {
    it('R-TXT-51\'s target text prints, parses with no error and prints byte for byte (mutant: block() ignores the owner\'s tokens)', () => {
        const g = grammar(TARGET);
        expect(issuesOf(TARGET)).toEqual([]);
        expect(printTextModel(g, OBJECTS).text.trimEnd()).toBe(TARGET_TEXT);
        roundTrip(g, OBJECTS);
        expect(concreteGrammarEbnf(g).split('\n')[1]).toBe('Program     ::= "begin" "program" ["declaration" "is" {declarations+=Declaration} "end"] ["statement" "begin" {statements+=Statement} "end" ";"] "end" "program" ;');
    });

    it('D10: an own side has the element\'s origin per token, an inherited side the style\'s (mutant: own tokens given the style origin)', () => {
        const cls = (side: 'open' | 'close', index: number): LiteralSrc => ({ k: 'classBlock', cls: 'Program', side, index });
        const feat = (side: 'open' | 'close', index: number): LiteralSrc => ({ k: 'featureBlock', feature: 'Program.declarations', side, index });
        const style = (param: 'blockOpen' | 'blockClose', index: number): LiteralSrc => ({ k: 'style', param, index });
        expect(ruleLiterals(grammar(TARGET), 'Program')).toEqual([
            ['begin', cls('open', 0)], ['program', cls('open', 1)],
            ['declaration', { k: 'feature', feature: 'Program.declarations' }], ['is', feat('open', 0)], ['end', feat('close', 0)],
            ['statement', { k: 'feature', feature: 'Program.statements' }], ['begin', style('blockOpen', 0)], ['end', style('blockClose', 0)], [';', style('blockClose', 1)],
            ['end', cls('close', 0)], ['program', cls('close', 1)],
        ]);
        // Only the open given: the close is the style's, with the style's origin.
        const openOnly = withEntries({ cP: { keyword: '', blockOpen: ['begin', 'program'] } }, { fDecls: { keyword: 'declaration', blockOpen: ['is'] } });
        expect(ruleLiterals(grammar(openOnly), 'Program').filter(([t]) => t !== 'declaration' && t !== 'statement').map(([, s]) => s)).toEqual([
            cls('open', 0), cls('open', 1), feat('open', 0), style('blockClose', 0), style('blockClose', 1),
            style('blockOpen', 0), style('blockClose', 0), style('blockClose', 1), style('blockClose', 0), style('blockClose', 1),
        ]);
    });

    it('a side not given is the style\'s, and the empty block is open then close (mutant: the empty block kept as the style\'s)', () => {
        const openOnly = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['is'] } });
        const decls = blocks(grammar(openOnly))[1];
        expect([decls.open, decls.close, decls.empty]).toEqual([['is'], ['end', ';'], ['is', 'end', ';']]);
        const g = grammar(TARGET);
        const empty: TextObject[] = [{ id: 'p', cls: 'Program', slots: {} }];
        expect(roundTrip(g, empty).trimEnd()).toBe('begin program end program');
        // A block with no token of its own keeps the style's.
        expect(blocks(g)[2].empty).toEqual(['begin', 'end', ';']);
    });

    it('D4: a grouped containment applies its tokens to each group\'s block (mutant: the group blocks take the style\'s)', () => {
        const GMM: TextMetamodel = {
            classes: [
                { name: 'Shop', references: [{ name: 'items', type: 'Item', containment: true, many: true }] },
                { name: 'Item', attributes: [{ name: 'name', type: 'EString', lower: 1 }, { name: 'kind', type: 'Kind', lower: 1 }] },
            ],
            enumerations: [{ name: 'Kind', literals: ['A', 'B', 'C'] }],
        };
        const GIDS: ElementIds = {
            classes: { cS: 'Shop', cI: 'Item' },
            features: { fI: { owner: 'Shop', name: 'items' }, fN: { owner: 'Item', name: 'name', lower: 1 }, fK: { owner: 'Item', name: 'kind', lower: 1 } },
            enums: { eK: 'Kind' },
        };
        const record: SyntaxAnnotations = {
            v: 1, style: { base: 'pascal' },
            features: { fI: { groupBy: 'fK', blockOpen: ['with'], blockClose: ['done'] } },
            enums: { eK: { subsets: [{ name: 'first', literals: ['A', 'B'] }, { name: 'second', literals: ['C'] }] } },
        };
        const g = grammar(record, GMM, GIDS);
        expect(issuesOf(record, GMM, GIDS)).toEqual([]);
        const shop = concreteGrammarEbnf(g).split('\n').find(l => l.startsWith('Shop '));
        expect(shop).toContain('"first" "with" {items+=Item_first} "done"');
        expect(shop).toContain('"second" "with" {items+=Item_second} "done"');
        const text = roundTrip(g, [
            { id: 's', cls: 'Shop', slots: { name: 'x', items: ['a', 'c'] } },
            { id: 'a', cls: 'Item', slots: { name: 'a', kind: 'A' } },
            { id: 'c', cls: 'Item', slots: { name: 'c', kind: 'C' } },
        ]);
        expect(text).toMatch(/first with\n/);
        expect(text).toMatch(/second with\n/);
    });

    it('D5: a token equal to the assignment, the terminator or a list token is refused, the style\'s side applied; one the style\'s blocks hold is not (mutant: no D5; mutant: the style\'s block tokens not exempted)', () => {
        const cases: [Record<string, unknown>, Record<string, unknown> | undefined, string, string][] = [
            [{ fDecls: { keyword: 'declaration', blockOpen: [':='] } }, undefined, 'blockOpen', 'the blockOpen token ":=" is the assignment of the style pascal; not applied'],
            [{ fDecls: { keyword: 'declaration', blockClose: ['end', '!'] } }, { base: 'pascal', terminator: ['!'] }, 'blockClose', 'the blockClose token "!" is the terminator of the style pascal; not applied'],
            [{ fDecls: { keyword: 'declaration', blockOpen: ['('] } }, undefined, 'blockOpen', 'the blockOpen token "(" is a list token of the style pascal; not applied'],
        ];
        for (const [features, style, side, message] of cases) {
            const record = withEntries({}, features, style);
            expect(issuesOf(record)).toEqual([{ level: 'error', where: 'Program.declarations', message }]);
            const decls = blocks(grammar(record))[1];
            const s = notation(record).grammar.style;
            expect(side === 'blockOpen' ? decls.open : decls.close).toEqual(side === 'blockOpen' ? s.blockOpen : s.blockClose);
        }
        // Pascal's own close holds its terminator: a per-block close `end ;` is the style's shape, not refused.
        const semi = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['is'], blockClose: ['done', ';'] } });
        expect(issuesOf(semi)).toEqual([]);
        expect(blocks(grammar(semi))[1].close).toEqual(['done', ';']);
        roundTrip(grammar(semi), OBJECTS);
    });

    it('D8: an empty side is refused under free layout, the style\'s applied (mutant: an empty side applied)', () => {
        const record = withEntries({ cP: { keyword: '', blockOpen: [], blockClose: ['end', 'program'] } });
        expect(issuesOf(record)).toEqual([{ level: 'error', where: 'class Program', message: 'blockOpen is empty: a block needs a token on each side; not applied' }]);
        const program = blocks(grammar(record))[0];
        expect([program.open, program.close]).toEqual([['begin'], ['end', 'program']]);
    });

    it('D9: per-block tokens where there is no block are an error and not applied (mutant: no D9)', () => {
        const ids: ElementIds = { ...IDS, features: { ...IDS.features, fSV: { owner: 'Statement', name: 'value', lower: 1 } } };
        const none = (where: string, why: string) => ({ level: 'error', where, message: `blockOpen and blockClose apply to a block, and ${where.replace(/^class /, '')} has none (${why}); not applied` });
        const cases: [SyntaxAnnotations, object][] = [
            [withEntries({ cD: { layout: 'line', blockOpen: ['inside'] } }), none('class Declaration', 'layout line')],
            [withEntries({ cS: { layout: 'call', blockClose: ['done'] } }), none('class Statement', 'layout call')],
            [withEntries({}, { fDT: { blockOpen: ['inside'] } }), none('Declaration.type', 'not a containment')],
            [withEntries({}, { fStmts: { inline: true, blockOpen: ['inside'] } }), none('Program.statements', 'inline')],
            [withEntries({}, { fStmts: { itemKeyword: 'stmt', blockOpen: ['inside'] } }), none('Program.statements', 'an item keyword')],
        ];
        for (const [record, issue] of cases) {
            const found = issuesOf(record, MM, ids).filter(i => i.level === 'error');
            expect(found, JSON.stringify(record.classes) + JSON.stringify(record.features)).toEqual([issue]);
            expect(concreteGrammarEbnf(grammar(record, MM, ids)), JSON.stringify(issue)).not.toMatch(/"inside"|"done"/);
        }
        const AMM: TextMetamodel = { classes: [{ name: 'Thing', isAbstract: true }, { name: 'Box', supers: ['Thing'] }], enumerations: [] };
        const AIDS: ElementIds = { classes: { cT: 'Thing', cB: 'Box' }, features: {}, enums: {} };
        expect(issuesOf({ v: 1, classes: { cT: { blockOpen: ['is'] } } }, AMM, AIDS)).toEqual([
            { level: 'error', where: 'class Thing', message: 'Thing is abstract: blockOpen and blockClose go on its concrete classes; not applied' },
        ]);
    });

    it('under Indentation the per-block tokens are ignored with a notice, and the marks have no editable origin (mutant: applied under Indentation; mutant: the marks given the style origin)', () => {
        const record = withEntries({}, {}, { base: 'indent' });
        expect(issuesOf(record)).toEqual([
            { level: 'notice', where: 'class Program', message: 'blockOpen and blockClose are ignored under the style indent: a block is its indentation' },
            { level: 'notice', where: 'Program.declarations', message: 'blockOpen and blockClose are ignored under the style indent: a block is its indentation' },
        ]);
        const g = grammar(record);
        for (const b of blocks(g)) expect([b.open, b.close]).toEqual([[INDENT_MARK], [DEDENT_MARK]]);
        const marks = concreteGrammarEbnfSpans(g).literals.filter(l => l.text === INDENT_MARK || l.text === DEDENT_MARK);
        expect(marks.length).toBeGreaterThan(0);
        for (const m of marks) expect(m.src).toEqual({ k: 'fixed' });
    });

    it('D2: the per-block words are reserved, a name equal to one printed quoted, and the text reads back (mutant: the words not reserved)', () => {
        const g = grammar(TARGET);
        expect(g.style.reservedNames).toEqual(['begin', 'end', 'is', 'program']);
        const named: TextObject[] = [
            { id: 'p', cls: 'Program', slots: { declarations: ['d1', 'd2'], statements: [] } },
            { id: 'd1', cls: 'Declaration', slots: { name: 'program' } },
            { id: 'd2', cls: 'Declaration', slots: { name: 'is' } },
        ];
        const text = roundTrip(g, named);
        expect(text).toContain("Declaration 'program'");
        expect(text).toContain("Declaration 'is'");
        // No per-block word: the style object is the style's.
        const plain = grammar({ ...TARGET, classes: { cD: { layout: 'line' } }, features: {} });
        expect(plain.style.reservedNames).toEqual(['begin', 'end']);
    });

    it('F4: a Declaration named like the close of a positional block prints quoted and reads back (mutant: the words not reserved)', () => {
        const record = withEntries({ cD: { keyword: '', layout: 'line' } }, { fDecls: { keyword: 'declaration', blockOpen: ['is'], blockClose: ['done'] } });
        const g = grammar(record);
        // The conflict F4 measured, ID meeting the unreserved close; Declaration.type's is P9's confound (report §2.1), not a block token's.
        expect(checkStyle(g).filter(f => f.level === 'error' && f.where === 'Program.declarations')).toEqual([]);
        const text = roundTrip(g, [
            { id: 'p', cls: 'Program', slots: { declarations: ['d1', 'd2'] } },
            { id: 'd1', cls: 'Declaration', slots: { name: 'done', type: 'int' } },
            { id: 'd2', cls: 'Declaration', slots: { name: 'z' } },
        ]);
        expect(text).toContain("'done' type := 'int';");
    });

    it('R3: a class keyword that the case would fold onto a per-block word falls back to declared (mutant: the per-block words not in the case fallback)', () => {
        const mm: TextMetamodel = { ...MM, classes: [...MM.classes, { name: 'Is' }] };
        const ids: ElementIds = { ...IDS, classes: { ...IDS.classes, cI: 'Is' } };
        const g = grammar(withEntries({}, {}, { base: 'pascal', classCase: 'lower' }), mm, ids);
        expect(g.classCase).toBe('declared');
        expect(g.notices.map(n => n.message)).toEqual(['class keywords kept as declared: case lower would fold Is onto "is", a style word']);
    });

    it('a punctuation feature keyword equal to a per-block punctuation token is refused (mutant: the per-block punctuation not taken)', () => {
        const record = withEntries({}, { fDecls: { blockOpen: ['<<'], blockClose: ['>>'] }, fStmts: { keyword: '<<' } });
        expect(issuesOf(record)).toEqual([{ level: 'error', where: 'Program.statements', message: 'the keyword "<<" is a block token of Program.declarations; not applied' }]);
    });
});

describe('(3) the tokenizer reads the per-block punctuation', () => {
    it('F2: a per-block << >> the style lacks prints and reads back (mutant: grammarPuncts skips the block tokens)', () => {
        const record = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['<<'], blockClose: ['>>'] } });
        const g = grammar(record);
        expect(issuesOf(record)).toEqual([]);
        const text = roundTrip(g, OBJECTS);
        expect(text).toContain('declaration <<\n');
        expect(text).toContain('  >>\n');
    });

    it('the indentation marks are not read from the text (mutant: the marks read as punctuation)', () => {
        const g = grammar(withEntries({}, {}, { base: 'indent' }));
        const r = tokenizeText(`declaration ${INDENT_MARK}`, g);
        expect(r.errors.map(e => e.message)).toEqual([`unexpected character "${INDENT_MARK}"`]);
    });

    it('R2: an unclosed `is` block takes the `end` of `end program` as its close; two errors, the objects before it read (measured)', () => {
        const text = ['begin program', '  declaration is', "    Declaration x type := 'int';", 'end program'].join('\n');
        const r = parseText(text, grammar(TARGET));
        expect(r.errors.map(e => `${e.line} ${e.message}`)).toEqual([
            '4 expected "statement" or "end" "program"; found name "program"',
            '4 expected "end" "program" to close the "begin" "program" at 1:1; found end of text',
        ]);
        expect(r.objects.filter(o => o.cls === 'Declaration').map(o => o.slots.name)).toEqual(['x']);
    });
});

describe('(4) the style check reads the per-block tokens', () => {
    const findings = (g: ConcreteGrammar, rule: string) => checkStyle(g).filter(f => f.level === 'error' && f.rule === rule).map(f => [f.where, f.message]);

    it('the target has no finding (mutant: none; a guard on the rules below)', () => {
        expect(checkStyle(grammar(TARGET)).filter(f => f.level === 'error')).toEqual([]);
    });

    it('style-tokens: a per-block token that starts a comment, or completes into one, at the element (mutant: per-block tokens not checked)', () => {
        const clike = (open: string) => grammar(withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: [open], blockClose: ['>>'] } }, {}));
        expect(findings(clike('//'), 'style-tokens')).toEqual([['Program.declarations', 'the blockOpen token "//" starts with the comment opener "//"']]);
        expect(findings(clike('/'), 'style-tokens')).toEqual([['Program.declarations', 'the blockOpen token "/" followed by "/" reads as the comment opener "//"']]);
    });

    it('style-tokens: a per-block token of a bad shape, in a grammar not built from a record (mutant: the shape not checked per block)', () => {
        const g = structuredClone(grammar(TARGET));
        const own = blocks(g).find(b => b.origin?.open?.k === 'feature') as unknown as { open: string[] };
        own.open = ['a b'];
        expect(findings(g, 'style-tokens')).toEqual([['Program.declarations', 'the blockOpen token "a b" holds a blank']]);
    });

    it('style-tokens: a block whose open is its close, one side its own (mutant: open = close not checked per block)', () => {
        const g = grammar(withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['end'] } }));
        expect(findings(g, 'style-tokens')).toEqual([['Program.declarations', 'the block open "end" is the block close too: an open would read as a close']]);
    });

    it('block-delimiters: a feature keyword in a class block, a class keyword in a containment block, equal to its own token (mutant: per-block tokens not checked)', () => {
        const inClass = grammar(withEntries({}, { fStmts: { keyword: 'program' } }));
        expect(findings(inClass, 'block-delimiters')).toEqual([['Program.statements', 'the feature keyword "program" is a block token of Program']]);
        const inFeature = grammar(withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['is'], blockClose: ['Declaration'] } }));
        expect(findings(inFeature, 'block-delimiters')).toEqual([['class Declaration', 'the class keyword "Declaration" is a block token of Program.declarations']]);
    });
});

// ---- Lane B2 (P-2026-11-05-2350): the per-block tokens in the Syntax form and the EBNF mode ---------------------------

const block = (element: string, field: FieldId): FieldRef => ({ element, field });
/** The faults of a draft at one field, as [level, message]. */
const faultsAt = (record: SyntaxAnnotations, ref: FieldRef, mm: TextMetamodel = MM, ids: ElementIds = IDS) =>
    (byField(readDraft(mm, ids, record).faults).get(fieldKey(ref)) ?? []).map(f => [f.level, f.message]);
/** TARGET without its per-block tokens: what the form starts from. */
const PLAIN: SyntaxAnnotations = {
    v: 1, style: { base: 'pascal' }, roots: 'uncontained',
    classes: { cP: { keyword: '' }, cD: { layout: 'line' }, cS: { layout: 'line' } },
    features: { fDecls: { keyword: 'declaration' }, fStmts: { keyword: 'statement' } },
};

describe('(5) B2: the per-block fields of the Syntax form', () => {
    const ids = (fs: readonly { id: FieldId }[]) => fs.map(f => f.id);
    const rows = (element: string, mode: 'basic' | 'advanced' = 'advanced', record: SyntaxAnnotations | null = PLAIN, mm: TextMetamodel = MM, eids: ElementIds = IDS) => blockTokenFields(mm, eids, element, mode, record);

    it('a concrete class and a containment get Block open and Block close, Advanced only, the tokens input with a Reset, fieldsOf unchanged (mutants: the rows in Basic; a text input over an array; no Reset)', () => {
        for (const [element, prefix] of [['class:cP', 'class'], ['feature:fDecls', 'feature']] as const) {
            expect(rows(element).map(f => [f.id, f.label, f.input, f.tier, f.reset])).toEqual([
                [`${prefix}.blockOpen`, 'Block open', 'tokens', 'advanced', true],
                [`${prefix}.blockClose`, 'Block close', 'tokens', 'advanced', true],
            ]);
            expect(rows(element, 'basic')).toEqual([]);
            expect(ids(fieldsOf(MM, IDS, element, 'advanced'))).not.toContain(`${prefix}.blockOpen`);
        }
        expect(rows('language')).toEqual([]);
    });

    it('an attribute and an abstract class get none, unless the draft sets them, so the refusal has a field (mutants: offered on an attribute; hidden while in effect)', () => {
        expect(rows('feature:fDT')).toEqual([]);
        expect(rows('feature:fDN')).toEqual([]);
        expect(ids(rows('feature:fDT', 'advanced', withEntries({}, { fDT: { blockOpen: ['inside'] } })))).toEqual(['feature.blockOpen', 'feature.blockClose']);
        const AMM: TextMetamodel = { classes: [{ name: 'Thing', isAbstract: true }, { name: 'Box', supers: ['Thing'] }], enumerations: [] };
        const AIDS: ElementIds = { classes: { cT: 'Thing', cB: 'Box' }, features: {}, enums: {} };
        expect(rows('class:cT', 'advanced', null, AMM, AIDS)).toEqual([]);
        const onAbstract: SyntaxAnnotations = { v: 1, classes: { cT: { blockOpen: ['is'] } } };
        expect(ids(rows('class:cT', 'advanced', onAbstract, AMM, AIDS))).toEqual(['class.blockOpen', 'class.blockClose']);
        expect(rows('class:cT', 'basic', onAbstract, AMM, AIDS)).toEqual([]);
        expect(faultsAt(onAbstract, block('class:cT', 'class.blockOpen'), AMM, AIDS)).toEqual([['error', 'Thing is abstract: blockOpen and blockClose go on its concrete classes; not applied']]);
    });

    it('Q1: a side left empty shows the inherited tokens as placeholder, the language-wide override included (mutants: no placeholder; the base\'s over the override)', () => {
        const placeholders = (r: SyntaxAnnotations, element: string) => rows(element, 'advanced', r).map(f => f.placeholder);
        expect(placeholders(PLAIN, 'class:cP')).toEqual(['begin', 'end ;']);
        expect(placeholders(PLAIN, 'feature:fDecls')).toEqual(['begin', 'end ;']);
        expect(placeholders({ ...PLAIN, style: { base: 'pascal', blockClose: ['stop'] } }, 'feature:fDecls')).toEqual(['begin', 'stop']);
        expect(placeholders({ ...PLAIN, style: {} }, 'class:cP')).toEqual(['{', '}']);
        expect(placeholders({ ...PLAIN, style: { base: 'indent' } }, 'class:cP')).toEqual([undefined, undefined]);
    });

    it('fieldValue and setField read and write a side as a whole array; cleared, or equal to the inherited side, the key goes (mutants: a side not written; an inherited copy stored)', () => {
        let d = setField(PLAIN, block('class:cP', 'class.blockOpen'), parseTokens('begin program'));
        d = setField(d, block('class:cP', 'class.blockClose'), parseTokens('end program'));
        d = setField(d, block('feature:fDecls', 'feature.blockOpen'), parseTokens('is'));
        d = setField(d, block('feature:fDecls', 'feature.blockClose'), parseTokens('end'));
        expect(d).toEqual(TARGET);
        expect(tokensText(fieldValue(d, block('class:cP', 'class.blockClose')))).toBe('end program');
        expect(tokensText(fieldValue(d, block('feature:fDecls', 'feature.blockOpen')))).toBe('is');
        expect(setField(d, block('feature:fDecls', 'feature.blockOpen'), undefined).features?.fDecls).toEqual({ keyword: 'declaration', blockClose: ['end'] });
        expect(setField(d, block('feature:fDecls', 'feature.blockClose'), ['end', ';']).features?.fDecls).toEqual({ keyword: 'declaration', blockOpen: ['is'] });
        expect(setField(PLAIN, block('class:cD', 'class.blockOpen'), ['inside']).classes?.cD).toEqual({ layout: 'line', blockOpen: ['inside'] });
    });

    it('the form reaches R-TXT-51\'s target: the preview prints it, the other blocks unchanged (mutant: the form\'s value not stored)', () => {
        let d = setField(PLAIN, block('class:cP', 'class.blockOpen'), ['begin', 'program']);
        d = setField(d, block('class:cP', 'class.blockClose'), ['end', 'program']);
        d = setField(d, block('feature:fDecls', 'feature.blockOpen'), ['is']);
        d = setField(d, block('feature:fDecls', 'feature.blockClose'), ['end']);
        expect(draftPreview(MM, IDS, d, OBJECTS).text.trimEnd()).toBe(TARGET_TEXT);
        expect(readDraft(MM, IDS, d).faults).toEqual([]);
    });

    it('the refusals of B1 land at the side they are about, with their reason (mutants: D9 at the layout; D5, D8 at the keyword; the finding at the element only; the named side ignored)', () => {
        const none = (name: string, why: string) => `blockOpen and blockClose apply to a block, and ${name} has none (${why}); not applied`;
        expect(faultsAt(withEntries({ cD: { layout: 'line', blockOpen: ['inside'] } }), block('class:cD', 'class.blockOpen'))).toEqual([['error', none('Declaration', 'layout line')]]);
        expect(faultsAt(withEntries({ cD: { layout: 'line', blockOpen: ['inside'] } }), block('class:cD', 'class.layout'))).toEqual([]);
        expect(faultsAt(withEntries({}, { fStmts: { inline: true, blockClose: ['done'] } }), block('feature:fStmts', 'feature.blockClose'))).toEqual([['error', none('Program.statements', 'inline')]]);
        expect(faultsAt(withEntries({}, { fStmts: { inline: true, blockClose: ['done'] } }), block('feature:fStmts', 'feature.blockOpen'))).toEqual([]);
        const d5 = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: [':='] } });
        expect(faultsAt(d5, block('feature:fDecls', 'feature.blockOpen'))).toEqual([['error', 'the blockOpen token ":=" is the assignment of the style pascal; not applied']]);
        expect(faultsAt(d5, block('feature:fDecls', 'feature.keyword'))).toEqual([]);
        const d8 = withEntries({ cP: { keyword: '', blockOpen: [], blockClose: ['end', 'program'] } });
        expect(faultsAt(d8, block('class:cP', 'class.blockOpen'))).toEqual([['error', 'blockOpen is empty: a block needs a token on each side; not applied']]);
        const shape = withEntries({ cP: { keyword: '', blockOpen: ['begin'], blockClose: ['end', 'a b'] } });
        expect(faultsAt(shape, block('class:cP', 'class.blockClose'))).toEqual([['error', 'the blockClose token "a b" holds a blank']]);
        expect(faultsAt(shape, block('class:cP', 'class.blockOpen'))).toEqual([]);
    });

    it('the style check\'s per-block findings land at the element\'s sides; a keyword equal to a block token at both (mutants: style-tokens at the Style row; the owner\'s side not named; every side of the owner named)', () => {
        const comment = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['//'], blockClose: ['>>'] } }, {});
        expect(faultsAt(comment, block('feature:fDecls', 'feature.blockOpen'))).toEqual([['error', 'the blockOpen token "//" starts with the comment opener "//"']]);
        expect(faultsAt(comment, block('language', 'language.style'))).toEqual([]);
        const same = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['end'] } });
        expect(faultsAt(same, block('feature:fDecls', 'feature.blockOpen'))).toEqual([['error', 'the block open "end" is the block close too: an open would read as a close']]);
        const kw = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['is'], blockClose: ['Declaration'] } });
        expect(faultsAt(kw, block('feature:fDecls', 'feature.blockClose'))).toEqual([['error', 'the class keyword "Declaration" is a block token of Program.declarations']]);
        expect(faultsAt(kw, block('class:cD', 'class.keyword'))).toEqual([['error', 'the class keyword "Declaration" is a block token of Program.declarations']]);
        expect(faultsAt(kw, block('feature:fDecls', 'feature.blockOpen'))).toEqual([]);
        const inClass = withEntries({}, { fStmts: { keyword: 'program' } });
        expect(faultsAt(inClass, block('class:cP', 'class.blockOpen'))).toEqual([['error', 'the feature keyword "program" is a block token of Program']]);
        expect(faultsAt(inClass, block('class:cP', 'class.blockClose'))).toEqual([['error', 'the feature keyword "program" is a block token of Program']]);
    });

    it('under Indentation the notice sits at the sides the entry sets (mutant: the notice at the element only)', () => {
        const d = withEntries({ cP: { keyword: '', blockOpen: ['begin', 'program'] } }, {}, { base: 'indent' });
        expect(faultsAt(d, block('class:cP', 'class.blockOpen'))).toEqual([['notice', 'blockOpen and blockClose are ignored under the style indent: a block is its indentation']]);
        expect(faultsAt(d, block('class:cP', 'class.blockClose'))).toEqual([]);
    });

    it('Basic announces a per-block side in effect (mutant: the block fields not counted)', () => {
        expect(advancedInEffect(TARGET, 'class:cP') - advancedInEffect(PLAIN, 'class:cP')).toBe(2);
        expect(advancedInEffect(TARGET, 'feature:fDecls') - advancedInEffect(PLAIN, 'feature:fDecls')).toBe(2);
    });
});

describe('(6) B2: the per-block tokens edited in the EBNF mode', () => {
    const cls = (side: 'open' | 'close', index: number): LiteralSrc => ({ k: 'classBlock', cls: 'Program', side, index });
    const feat = (side: 'open' | 'close', index: number): LiteralSrc => ({ k: 'featureBlock', feature: 'Program.declarations', side, index });
    const style = (param: 'blockOpen' | 'blockClose', index: number): LiteralSrc => ({ k: 'style', param, index });
    const edit = (draft: SyntaxAnnotations, src: LiteralSrc, value: string) => setLiteral(MM, IDS, draft, src, value);
    const edited = (draft: SyntaxAnnotations, src: LiteralSrc, value: string): SyntaxAnnotations => {
        const r = edit(draft, src, value);
        if (!r.ok) throw new Error(r.reason);
        return r.draft;
    };
    const literalsOf = (d: SyntaxAnnotations) => ruleLiterals(grammar(d), 'Program');

    it('an own token maps to its element\'s side (mutant: the per-block kinds read only)', () => {
        expect(literalField(MM, IDS, cls('open', 1))).toEqual({ element: 'class:cP', field: 'class.blockOpen' });
        expect(literalField(MM, IDS, cls('close', 0))).toEqual({ element: 'class:cP', field: 'class.blockClose' });
        expect(literalField(MM, IDS, feat('open', 0))).toEqual({ element: 'feature:fDecls', field: 'feature.blockOpen' });
        expect(literalField(MM, IDS, feat('close', 0))).toEqual({ element: 'feature:fDecls', field: 'feature.blockClose' });
        expect(literalField(MM, IDS, { k: 'classBlock', cls: 'Nowhere', side: 'open', index: 0 })).toBeUndefined();
    });

    it('editing an own token changes that element\'s block only, its other tokens kept (R-TXT-51 (4); mutants: the style array rewritten; the whole side replaced)', () => {
        const d = edited(TARGET, feat('open', 0), 'as');
        expect(d.features?.fDecls).toEqual({ keyword: 'declaration', blockOpen: ['as'], blockClose: ['end'] });
        expect(d.style).toEqual(TARGET.style);
        expect(d.classes).toEqual(TARGET.classes);
        const p = edited(TARGET, cls('close', 1), 'prog');
        expect(p.classes?.cP).toEqual({ keyword: '', blockOpen: ['begin', 'program'], blockClose: ['end', 'prog'] });
        const lits = literalsOf(p);
        expect(lits.slice(-2)).toEqual([['end', cls('close', 0)], ['prog', cls('close', 1)]]);
        // The statements' block inherits and is unchanged.
        expect(lits.filter(([, s]) => s?.k === 'style').map(([t]) => t)).toEqual(['begin', 'end', ';']);
    });

    it('D10: editing an inherited side stays language-wide and changes every block that inherits it (mutant: the edit written to the element)', () => {
        const openOnly = withEntries({ cP: { keyword: '', blockOpen: ['begin', 'program'] } });
        const d = edited(openOnly, style('blockClose', 0), 'stop');
        expect(d.style).toEqual({ base: 'pascal', blockClose: ['stop', ';'] });
        expect(d.classes?.cP).toEqual({ keyword: '', blockOpen: ['begin', 'program'] });
        const lits = literalsOf(d);
        expect(lits.filter(([, s]) => s?.k === 'style' && s.param === 'blockClose' && s.index === 0).map(([t]) => t)).toEqual(['stop', 'stop']);
        // The declarations' own close is not the style's.
        expect(lits.find(([, s]) => s?.k === 'featureBlock' && s.side === 'close')).toEqual(['end', feat('close', 0)]);
    });

    it('a token equal to the inherited side leaves the side cleared, its origin the style\'s again (R-TXT-49 D5; mutant: an inherited copy stored)', () => {
        const once = withEntries({}, { fDecls: { keyword: 'declaration', blockOpen: ['is'] } });
        const d = edited(once, feat('open', 0), 'begin');
        expect(d.features?.fDecls).toEqual({ keyword: 'declaration' });
    });

    it('refuses an empty token, a quote, a blank, a malformed token, an index the side does not hold (mutants: the shape not checked; the index not checked)', () => {
        const refusal = (src: LiteralSrc, value: string): string => { const r = edit(TARGET, src, value); return r.ok ? 'accepted' : r.reason; };
        expect(refusal(feat('open', 0), '')).toBe('a block token of a containment cannot be empty: clearing it removes it from the notation');
        expect(refusal(cls('open', 0), '')).toBe('a block token of a class cannot be empty: clearing it removes it from the notation');
        expect(refusal(feat('open', 0), 'a"')).toBe('a block token of a containment cannot hold a quote');
        expect(refusal(feat('open', 0), 'a b')).toBe('a block token of a containment cannot hold a blank');
        expect(refusal(feat('open', 0), 'a+')).toBe('a block token of a containment: "a+" is neither a word nor a run of punctuation');
        expect(refusal(feat('open', 3), 'x')).toBe('a block token of a containment: the token is not in the block');
        expect(refusal({ k: 'classBlock', cls: 'Declaration', side: 'open', index: 0 }, 'x')).toBe('a block token of a class: the token is not in the block');
    });

    it('accepts a run of punctuation as an own token, as a style token is (mutant: the identifier check applied to the per-block kinds)', () => {
        expect(edited(TARGET, feat('open', 0), '{').features?.fDecls?.blockOpen).toEqual(['{']);
        expect(edited(TARGET, cls('close', 1), '.').classes?.cP?.blockClose).toEqual(['end', '.']);
    });

    it('the printed default of an own token is the inherited one at its index, none past it (mutant: the default looked up by the cleared origin)', () => {
        expect(literalDefault(MM, IDS, TARGET, cls('open', 0))).toBe('begin');
        expect(literalDefault(MM, IDS, TARGET, cls('open', 1))).toBeUndefined();
        expect(literalDefault(MM, IDS, TARGET, cls('close', 1))).toBe(';');
        expect(literalDefault(MM, IDS, { ...TARGET, style: {} }, cls('close', 1))).toBeUndefined();
        expect(literalDefault(MM, IDS, { ...TARGET, style: {} }, feat('open', 0))).toBe('{');
    });

    it('under Indentation the marks stay read only (R4; mutant: the marks given an editable origin)', () => {
        const g = grammar(withEntries({}, {}, { base: 'indent' }));
        const marks = concreteGrammarEbnfSpans(g).literals.filter(l => l.text === INDENT_MARK || l.text === DEDENT_MARK);
        expect(marks.length).toBeGreaterThan(0);
        for (const m of marks) {
            expect(literalField(MM, IDS, m.src)).toBeUndefined();
            expect(setLiteral(MM, IDS, TARGET, m.src, 'x')).toEqual({ ok: false, reason: 'a fixed token is read only' });
        }
    });
});

// ---- Lane B3a (P-2026-11-06-0147): the head prefix of a class (report §3, R-TXT-51 (3), R-TXT-52 D1) ----------------

/** The probe's metamodel with a mandatory name on Program: `begin program P ... end program` (report §3.1, reading B). */
const NMM: TextMetamodel = {
    ...MM,
    classes: [{ ...MM.classes[0], attributes: [{ name: 'name', type: 'EString', lower: 1 }] }, ...MM.classes.slice(1)],
};
const NIDS: ElementIds = { ...IDS, features: { ...IDS.features, fPN: { owner: 'Program', name: 'name', lower: 1 } } };
/** P5: the prefix `begin` before the class keyword `program` of a named Program; the block keeps the style's open. */
const P5: SyntaxAnnotations = {
    ...TARGET,
    classes: { ...TARGET.classes, cP: { keyword: 'program', prefix: ['begin'], blockClose: ['end', 'program'] } },
};
const named = (record: SyntaxAnnotations) => grammar(record, NMM, NIDS);
const namedIssues = (record: SyntaxAnnotations) => issuesOf(record, NMM, NIDS);
const NAMED_OBJECTS: TextObject[] = [{ ...OBJECTS[0], slots: { ...OBJECTS[0].slots, name: 'P' } }, ...OBJECTS.slice(1)];

describe('(7) B3a: the resolution of the head prefix', () => {
    it('keeps a well-formed prefix on a class, words and punctuation, with no issue (mutant: the prefix not read)', () => {
        const r = resolveAnnotations(P5, NIDS, NMM);
        expect(r.issues).toEqual([]);
        expect(r.classes.Program).toEqual({ keyword: 'program', prefix: ['begin'], blockClose: ['end', 'program'] });
        expect(resolved(withEntries({ cP: { keyword: '', prefix: ['<<', 'program'] } })).classes.Program.prefix).toEqual(['<<', 'program']);
        expect(resolved(withEntries({ cP: { keyword: '', prefix: [] } })).issues).toEqual([]);
    });

    it('drops a prefix that is not a list of well-formed tokens, with an error at the class; the other keys stay (mutant: styleTokenFault not applied to the prefix)', () => {
        const cases: [unknown, RegExp][] = [
            ['begin', /^prefix is not a list of tokens$/],
            [['begin', 'a b'], /^the prefix token "a b" holds a blank$/],
            [[''], /^the prefix token "" is empty$/],
            [['"'], /quote/],
            [[3], /^the prefix token 3 is not a string$/],
        ];
        for (const [prefix, reason] of cases) {
            const r = resolved(withEntries({ cP: { keyword: '', prefix } }));
            expect(r.issues.map(i => [i.level, i.where]), JSON.stringify(prefix)).toEqual([['error', 'class Program']]);
            expect(r.issues[0].message).toMatch(reason);
            expect(r.classes.Program).toEqual({ keyword: '' });
        }
    });
});
