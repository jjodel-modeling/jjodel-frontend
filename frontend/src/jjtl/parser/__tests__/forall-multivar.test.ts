import { describe, it, expect } from 'vitest';

/**
 * A `forall` with several variables (P-2026-11-02-1331, R-FA-1, R-FA-5, R-FA-7).
 *
 * Both spellings, mixable: `forall q, r in xs` and `forall q in xs, r in ys`.
 * The first binding stays in `variable`/`collection`, so the readers of a
 * one-variable forall are unchanged; `bindings` lists every variable in order
 * and is set only when there is more than one.
 */

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../parser';
import type { TransformationAST, ForAllMappingAST } from '../../types/ast';

const HEAD = 'transformation T\nfrom S\nto U\n\n';

function parse(body: string, withSource: boolean): { ast: TransformationAST | null; errors: string[] } {
    const src = HEAD + body;
    const { tokens } = new JjtlLexer(src).tokenize();
    const { ast, errors } = withSource ? new JjtlParser(tokens, src).parse() : new JjtlParser(tokens).parse();
    return { ast, errors: errors.map(e => e.message) };
}

function forallOf(body: string, withSource: boolean): ForAllMappingAST {
    const { ast, errors } = parse(body, withSource);
    expect(errors).toEqual([]);
    return ast!.mappings[0].body[0] as ForAllMappingAST;
}

const names = (f: ForAllMappingAST) => (f.bindings ?? []).map(b => b.variable);

describe.each([
    ['without source (legacy expression path)', false],
    ['with source (JjEL delegation)', true],
])('multi-variable forall, %s', (_label, withSource) => {

    it('one variable: no bindings list, the AST is as before', () => {
        const f = forallOf(`A a -> B {\n    forall x in xs -> C { }\n}`, withSource);
        expect(f.variable).toBe('x');
        expect(f.bindings).toBeUndefined();
    });

    it('`forall q, r in xs`: two variables over the same collection', () => {
        const f = forallOf(`A a -> B {\n    forall q, r in xs such that q.p < r.p -> C { }\n}`, withSource);
        expect(names(f)).toEqual(['q', 'r']);
        expect(f.variable).toBe('q');
        expect(f.bindings![0].collection).toBe(f.collection);
        expect(f.bindings![1].collection).toBe(f.collection);
        expect(f.filter).toBeDefined();
    });

    it('`forall q in xs, r in ys`: one collection each', () => {
        const f = forallOf(`A a -> B {\n    forall q in xs, r in ys -> C { }\n}`, withSource);
        expect(names(f)).toEqual(['q', 'r']);
        expect((f.bindings![0].collection as any).name).toBe('xs');
        expect((f.bindings![1].collection as any).name).toBe('ys');
    });

    it('the spellings mix: `forall a, b in xs, c in a.children`', () => {
        const f = forallOf(`A a -> B {\n    forall a, b in xs, c in a.children -> C { }\n}`, withSource);
        expect(names(f)).toEqual(['a', 'b', 'c']);
        expect(f.bindings![0].collection).toBe(f.bindings![1].collection);
        expect(f.bindings![2].collection.type).toBe('MemberAccess');
    });

    it('accepted inside a feature of a created object', () => {
        const { errors } = parse(`A a -> B {\n    -> cs {\n        forall q in xs, r in xs -> C { }\n    }\n}`, withSource);
        expect(errors).toEqual([]);
    });

    it('rejects a repeated name, in either spelling', () => {
        expect(parse(`A a -> B {\n    forall q, q in xs -> C { }\n}`, withSource).errors.join(' '))
            .toMatch(/'q' is bound twice/);
        expect(parse(`A a -> B {\n    forall q in xs, q in ys -> C { }\n}`, withSource).errors.join(' '))
            .toMatch(/'q' is bound twice/);
    });

    it('a comma after a collection must start another binding', () => {
        expect(parse(`A a -> B {\n    forall q in xs, r -> C { }\n}`, withSource).errors.length).toBeGreaterThan(0);
    });
});
