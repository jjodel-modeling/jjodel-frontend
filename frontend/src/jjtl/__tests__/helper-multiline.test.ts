import { describe, it, expect } from 'vitest';
/**
 * Helper bodies spanning several lines.
 *
 * The application parses without the source string (JjtlEditor.tsx,
 * useJjtlParser.ts), so helper bodies go through the internal expression
 * parser. Before the fix, `helper()` called `expression()` right after `{`
 * with a NEWLINE token in front, and every multi-line helper failed with
 * "Expected expression" on the opening brace; an `else` on its own line
 * failed with "Expected '}'". These tests cover the documented forms of
 * SPEC.md §3.4 and §13.2 on both parser paths.
 */

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import type { ConditionalExpressionAST, AttributeMappingAST } from '../types/ast';

const HEADER = `transformation T\nfrom A\nto B\n\n`;

function parseWith(source: string, withSource: boolean) {
    const { tokens, errors: lexErrors } = new JjtlLexer(source).tokenize();
    expect(lexErrors).toEqual([]);
    const parser = withSource ? new JjtlParser(tokens, source) : new JjtlParser(tokens);
    return parser.parse();
}

function expectClean(source: string, withSource: boolean) {
    const result = parseWith(source, withSource);
    expect(result.errors).toEqual([]);
    expect(result.ast).not.toBeNull();
    return result.ast!;
}

const SIMPLE = `${HEADER}helper formatLabel(name: String, prefix: String) -> String {
    prefix + "_" + name
}
`;

const CHAIN = `${HEADER}helper translateType(t: Type) -> SqlType {
    if t == "String" then "VARCHAR"
    else if t == "Integer" then "INTEGER"
    else "BOOLEAN"
}
`;

const CHAIN_THEN_MAPPING = `${CHAIN}
X -> Y {
    kind := translateType(type)
}
`;

describe('JjTL helper body across lines', () => {

    describe.each([
        ['without source (application path)', false],
        ['with source (JjEL delegation)', true],
    ])('%s', (_label, withSource) => {

        it('simple expression on its own line (SPEC §3.4)', () => {
            const ast = expectClean(SIMPLE, withSource);
            expect(ast.helpers.length).toBe(1);
            expect(ast.helpers[0].name).toBe('formatLabel');
        });

        it('if / else if / else chain, one branch per line (SPEC §13.2)', () => {
            const ast = expectClean(CHAIN, withSource);
            expect(ast.helpers.length).toBe(1);
            expect(ast.helpers[0].returnType).toBe('SqlType');
        });

        it('helper followed by a mapping that calls it', () => {
            const ast = expectClean(CHAIN_THEN_MAPPING, withSource);
            expect(ast.helpers.length).toBe(1);
            expect(ast.mappings.length).toBe(1);
            expect((ast.mappings[0].body[0] as AttributeMappingAST).targetAttribute).toBe('kind');
        });
    });

    it('internal parser: the chain is nested ConditionalExpression with three leaves', () => {
        const ast = expectClean(CHAIN, false);
        const cond = ast.helpers[0].body as ConditionalExpressionAST;
        expect(cond.type).toBe('ConditionalExpression');
        const inner = cond.elseBranch as ConditionalExpressionAST;
        expect(inner.type).toBe('ConditionalExpression');
        expect(inner.elseBranch).not.toBeNull();
        expect((inner.elseBranch as any).type).not.toBe('ConditionalExpression');
    });

    it('internal parser: a NEWLINE still terminates a := expression without else', () => {
        const source = `${HEADER}X -> Y {
    a := if flag then 1 else 2
    b := 3
}
`;
        const ast = expectClean(source, false);
        const body = ast.mappings[0].body as AttributeMappingAST[];
        expect(body.map(i => i.targetAttribute)).toEqual(['a', 'b']);
    });

    it('internal parser: a := conditional may continue with else on the next line', () => {
        const source = `${HEADER}X -> Y {
    a := if flag then 1
         else 2
    b := 3
}
`;
        const ast = expectClean(source, false);
        const body = ast.mappings[0].body as AttributeMappingAST[];
        expect(body.map(i => i.targetAttribute)).toEqual(['a', 'b']);
        expect((body[0].expression as ConditionalExpressionAST).elseBranch).not.toBeNull();
    });
});
