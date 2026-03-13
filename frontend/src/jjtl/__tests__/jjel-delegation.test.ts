import { describe, it, test, expect } from 'vitest';
/**
 * JjTL Parser — JjEL Expression Delegation Tests
 *
 * Tests that the JjTL parser correctly delegates expression parsing to the
 * JjEL parser for guards, conversion expressions, and helper bodies.
 * This enables JjEL-specific constructs (implies, exists, with...do, forall
 * as set comprehension) to be used in JjTL transformations.
 */

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import type {
    TransformationAST,
    AttributeMappingAST,
    HelperAST,
} from '../types/ast';
import { toJjelAst } from '../executor/astBridge';

const HEADER = `transformation Test\nfrom Source\nto Target\n`;

/**
 * Parse with JjEL delegation enabled (passes source string to parser).
 */
function parseWithDelegation(source: string): TransformationAST | null {
    const lexer = new JjtlLexer(source);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    if (lexErrors.length > 0) {
        throw new Error(`Lexer errors: ${lexErrors.map(e => e.message).join(', ')}`);
    }
    // Pass source string to enable JjEL delegation
    const parser = new JjtlParser(tokens, source);
    const { ast, errors: parseErrors } = parser.parse();
    if (parseErrors.length > 0) {
        throw new Error(`Parser errors: ${parseErrors.map(e => e.message).join(', ')}`);
    }
    return ast;
}

function getFirstMapping(source: string) {
    const ast = parseWithDelegation(source);
    expect(ast).not.toBeNull();
    expect(ast!.mappings.length).toBeGreaterThan(0);
    return ast!.mappings[0];
}

function getFirstAttrMapping(source: string): AttributeMappingAST {
    const mapping = getFirstMapping(source);
    expect(mapping.body.length).toBeGreaterThan(0);
    return mapping.body[0] as AttributeMappingAST;
}

function getFirstHelper(source: string): HelperAST {
    const ast = parseWithDelegation(source);
    expect(ast).not.toBeNull();
    expect(ast!.helpers.length).toBeGreaterThan(0);
    return ast!.helpers[0];
}

describe('JjTL Parser — JjEL Expression Delegation', () => {

    describe('Guards with JjEL constructs', () => {

        it('parses simple guard (backward compat)', () => {
            const source = HEADER + `A -> B where not isAbstract {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');
        });

        it('parses guard with and/or', () => {
            const source = HEADER + `A -> B where not isAbstract and attributes.isNotEmpty {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');

            // Verify the JjEL AST is valid by converting through astBridge
            const jjelExpr = toJjelAst(mapping.condition!);
            expect(jjelExpr).toBeDefined();
            expect(jjelExpr.type).toBe('Binary');
        });

        it('parses guard with equality', () => {
            const source = HEADER + `A -> B where name != "Object" {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');
        });

        it('parses implies in guard', () => {
            const source = HEADER + `A -> B where isAbstract implies subClasses.isNotEmpty {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(mapping.condition!);
            expect(jjelExpr.type).toBe('Implies');
        });

        it('parses exists in guard', () => {
            const source = HEADER + `A -> B where exists a in attributes : a.type == "String" {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(mapping.condition!);
            expect(jjelExpr.type).toBe('Exists');
        });

        it('parses with...do in guard', () => {
            const source = HEADER + `A -> B where with superClass do attributes.isNotEmpty {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(mapping.condition!);
            expect(jjelExpr.type).toBe('WithDo');
        });

        it('parses complex guard with implies + exists (parenthesized)', () => {
            // In JjEL, exists has lower precedence than implies, so parentheses are needed
            const source = HEADER + `A -> B where isAbstract implies (exists s in subClasses : not s.isAbstract) {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();

            const jjelExpr = toJjelAst(mapping.condition!);
            expect(jjelExpr.type).toBe('Implies');
        });

        it('parses guard with if-then-else', () => {
            const source = HEADER + `A -> B where if isAbstract then subClasses.size > 0 else true {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();

            const jjelExpr = toJjelAst(mapping.condition!);
            expect(jjelExpr.type).toBe('IfThenElse');
        });

        it('parses guard with null coalesce', () => {
            const source = HEADER + `A -> B where (parent ?? self).name == "Root" {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');
        });
    });

    describe('Expression mappings with JjEL constructs', () => {

        it('parses simple expression', () => {
            const source = HEADER + `A -> B {\n  tableName := name.snakeCase()\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();
            expect(attrMapping.expression!.type).toBe('JjelExpression');
        });

        it('parses string concat expression', () => {
            const source = HEADER + `A -> B {\n  label := name + "_suffix"\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();
            expect(attrMapping.expression!.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(attrMapping.expression!);
            expect(jjelExpr.type).toBe('Binary');
        });

        it('parses implies in expression mapping', () => {
            const source = HEADER + `A -> B {\n  isLeaf := not isAbstract implies subClasses.isEmpty\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();

            const jjelExpr = toJjelAst(attrMapping.expression!);
            expect(jjelExpr.type).toBe('Implies');
        });

        it('parses forall (set comprehension) in expression mapping', () => {
            const source = HEADER + `A -> B {\n  attrNames := forall a in attributes : a.name\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();

            const jjelExpr = toJjelAst(attrMapping.expression!);
            expect(jjelExpr.type).toBe('ForAll');
        });

        it('parses exists in expression mapping', () => {
            const source = HEADER + `A -> B {\n  hasStrings := exists a in attributes : a.type == "String"\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();

            const jjelExpr = toJjelAst(attrMapping.expression!);
            expect(jjelExpr.type).toBe('Exists');
        });

        it('parses with...do in expression mapping', () => {
            const source = HEADER + `A -> B {\n  parentName := with parent do name ?? "root"\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();

            const jjelExpr = toJjelAst(attrMapping.expression!);
            expect(jjelExpr.type).toBe('WithDo');
        });

        it('parses if-then-else in expression mapping', () => {
            const source = HEADER + `A -> B {\n  display := if active then "yes" else "no"\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();

            const jjelExpr = toJjelAst(attrMapping.expression!);
            expect(jjelExpr.type).toBe('IfThenElse');
        });

        it('parses literal true in expression mapping', () => {
            const source = HEADER + `A -> B {\n  active := true\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();

            const jjelExpr = toJjelAst(attrMapping.expression!);
            expect(jjelExpr.type).toBe('Literal');
        });

        it('parses method chain in expression mapping', () => {
            const source = HEADER + `A -> B {\n  count := attributes.filter(a => a.isPublic).size\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();
            expect(attrMapping.expression!.type).toBe('JjelExpression');
        });

        it('handles multiple attribute mappings with expressions', () => {
            const source = HEADER + `A -> B {\n  label := name.toUpper()\n  count := attributes.size\n}`;
            const ast = parseWithDelegation(source);
            expect(ast).not.toBeNull();
            const body = ast!.mappings[0].body;
            expect(body.length).toBe(2);

            const expr1 = (body[0] as AttributeMappingAST).expression;
            const expr2 = (body[1] as AttributeMappingAST).expression;
            expect(expr1?.type).toBe('JjelExpression');
            expect(expr2?.type).toBe('JjelExpression');
        });
    });

    describe('Helper bodies with JjEL constructs', () => {

        it('parses simple helper body', () => {
            const source = HEADER + `helper formatName(s: String) -> String { s.camelCase() }`;
            const helper = getFirstHelper(source);
            expect(helper.body.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(helper.body);
            expect(jjelExpr.type).toBe('MethodCall');
        });

        it('parses implies in helper body', () => {
            const source = HEADER + `helper isLeaf(c: Class) -> Boolean { not c.isAbstract implies c.subClasses.isEmpty }`;
            const helper = getFirstHelper(source);
            expect(helper.body.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(helper.body);
            expect(jjelExpr.type).toBe('Implies');
        });

        it('parses exists in helper body', () => {
            const source = HEADER + `helper hasStringAttr(c: Class) -> Boolean { exists a in c.attributes : a.type == "String" }`;
            const helper = getFirstHelper(source);
            expect(helper.body.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(helper.body);
            expect(jjelExpr.type).toBe('Exists');
        });

        it('parses with...do in helper body', () => {
            const source = HEADER + `helper parentName(c: Class) -> String { with c.parent do name ?? "root" }`;
            const helper = getFirstHelper(source);
            expect(helper.body.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(helper.body);
            expect(jjelExpr.type).toBe('WithDo');
        });

        it('parses if-then-else in helper body', () => {
            const source = HEADER + `helper label(c: Class) -> String { if c.isAbstract then c.name + " (abstract)" else c.name }`;
            const helper = getFirstHelper(source);
            expect(helper.body.type).toBe('JjelExpression');

            const jjelExpr = toJjelAst(helper.body);
            expect(jjelExpr.type).toBe('IfThenElse');
        });
    });

    describe('Value mappings still work', () => {

        it('parses value mapping', () => {
            const source = HEADER + `A -> B {\n  enabled := active : true=1, false=0\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.valueMapping).toBeDefined();
            expect(attrMapping.valueMapping!.length).toBe(2);
            expect(attrMapping.expression).toBeDefined(); // source expression: `active`
        });
    });

    describe('astBridge handles JjelExpressionWrapper', () => {

        it('unwraps JjelExpressionWrapper to inner JjEL expression', () => {
            const source = HEADER + `A -> B where name == "test" {\n  label := name\n}`;
            const mapping = getFirstMapping(source);
            expect(mapping.condition).toBeDefined();
            expect(mapping.condition!.type).toBe('JjelExpression');

            // toJjelAst should unwrap the wrapper
            const jjelExpr = toJjelAst(mapping.condition!);
            expect(jjelExpr).toBeDefined();
            expect(jjelExpr.type).not.toBe('JjelExpression');
        });
    });

    describe('Backward compatibility without source', () => {

        it('parser works without source string (legacy path)', () => {
            const source = HEADER + `A -> B where not isAbstract {\n  label := name.snakeCase()\n}`;
            const lexer = new JjtlLexer(source);
            const { tokens } = lexer.tokenize();

            // No source string — uses legacy expression parser
            const parser = new JjtlParser(tokens);
            const { ast, errors } = parser.parse();
            expect(errors.length).toBe(0);
            expect(ast).not.toBeNull();

            // Guard uses legacy AST type (not JjelExpression)
            expect(ast!.mappings[0].condition).toBeDefined();
            expect(ast!.mappings[0].condition!.type).not.toBe('JjelExpression');
        });
    });
});
