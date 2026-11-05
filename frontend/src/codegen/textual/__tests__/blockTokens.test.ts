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
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { checkStyle } from '../styleCheck';
import { textualNotation } from '../syntaxRecord';

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
        const r = resolved(withEntries({ cP: { keyword: '', prefix: ['begin'] } }, { fDecls: { keyword: 'declaration', blockopen: ['is'] } }));
        expect(r.issues).toEqual([
            { level: 'notice', where: 'class Program', message: 'unknown key "prefix": not applied' },
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
