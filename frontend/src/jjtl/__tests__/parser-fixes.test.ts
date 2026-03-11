/**
 * Parser Fixes Tests
 *
 * Fix 1: := syntax — expression/value-mapping disambiguation
 * Fix 2: Lambda syntax with '=>'
 */

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import type {
    TransformationAST,
    AttributeMappingAST,
    LiteralAST,
    IdentifierAST,
    BinaryExpressionAST,
    UnaryExpressionAST,
    FunctionCallAST,
    MemberAccessAST,
    LambdaExpressionAST,
    ConditionalExpressionAST,
    NullCoalesceExpressionAST,
} from '../types/ast';

function parseTransformation(source: string): TransformationAST | null {
    const lexer = new JjtlLexer(source);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    if (lexErrors.length > 0) {
        throw new Error(`Lexer errors: ${lexErrors.map(e => e.message).join(', ')}`);
    }
    const parser = new JjtlParser(tokens);
    const { ast, errors: parseErrors } = parser.parse();
    if (parseErrors.length > 0) {
        throw new Error(`Parser errors: ${parseErrors.map(e => e.message).join(', ')}`);
    }
    return ast;
}

function getFirstAttrMapping(source: string): AttributeMappingAST {
    const ast = parseTransformation(source);
    expect(ast).not.toBeNull();
    expect(ast!.mappings.length).toBeGreaterThan(0);
    const body = ast!.mappings[0].body;
    expect(body.length).toBeGreaterThan(0);
    return body[0] as AttributeMappingAST;
}

const HEADER = `transformation Test\nfrom Source\nto Target\n`;

describe('JjTL Parser Fixes', () => {

    describe('Fix 1: := syntax disambiguation', () => {

        describe('Expression mappings (constant values)', () => {
            it('parses name := "string constant"', () => {
                const source = `${HEADER}A -> B {\n  name := "id"\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect(attrMapping.valueMapping).toBeUndefined();
                expect((attrMapping.expression as LiteralAST).type).toBe('Literal');
                expect((attrMapping.expression as LiteralAST).value).toBe('id');
                expect((attrMapping.expression as LiteralAST).literalType).toBe('string');
            });

            it('parses weight := number constant', () => {
                const source = `${HEADER}A -> B {\n  weight := 1\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect(attrMapping.valueMapping).toBeUndefined();
                expect((attrMapping.expression as LiteralAST).value).toBe(1);
            });

            it('parses active := boolean constant', () => {
                const source = `${HEADER}A -> B {\n  active := true\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect(attrMapping.valueMapping).toBeUndefined();
                expect((attrMapping.expression as LiteralAST).value).toBe(true);
            });

            it('parses count := expression starting with literal then operator', () => {
                const source = `${HEADER}A -> B {\n  count := 1 + 2\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect(attrMapping.valueMapping).toBeUndefined();
                const expr = attrMapping.expression as BinaryExpressionAST;
                expect(expr.type).toBe('BinaryExpression');
                expect(expr.operator).toBe('+');
            });
        });

        describe('Expression mappings (computed values)', () => {
            it('parses tableName := method call', () => {
                const source = `${HEADER}A -> B {\n  tableName := name.snakeCase()\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect(attrMapping.valueMapping).toBeUndefined();
                expect((attrMapping.expression as FunctionCallAST).type).toBe('FunctionCall');
            });

            it('parses fullName := binary expression with strings', () => {
                const source = `${HEADER}A -> B {\n  fullName := firstName + " " + lastName\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect((attrMapping.expression as BinaryExpressionAST).type).toBe('BinaryExpression');
            });

            it('parses flag := negation', () => {
                const source = `${HEADER}A -> B {\n  flag := not isAbstract\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                const expr = attrMapping.expression as UnaryExpressionAST;
                expect(expr.type).toBe('UnaryExpression');
                expect(expr.operator).toBe('not');
            });

            it('parses tokens := conditional', () => {
                const source = `${HEADER}A -> B {\n  tokens := if isInitial then 1 else 0\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect((attrMapping.expression as ConditionalExpressionAST).type).toBe('ConditionalExpression');
            });

            it('parses label := null coalesce', () => {
                const source = `${HEADER}A -> B {\n  label := name ?? "unnamed"\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect((attrMapping.expression as NullCoalesceExpressionAST).type).toBe('NullCoalesceExpression');
            });

            it('parses label := identifier (simple expression)', () => {
                const source = `${HEADER}A -> B {\n  label := name\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.expression).toBeDefined();
                expect((attrMapping.expression as IdentifierAST).type).toBe('Identifier');
                expect((attrMapping.expression as IdentifierAST).name).toBe('name');
            });
        });

        describe('Value mappings (must still work)', () => {
            it('parses boolean value mapping', () => {
                const source = `${HEADER}A -> B {\n  tokens := isInitial : true=1, false=0\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.valueMapping).toBeDefined();
                expect(attrMapping.expression).toBeDefined(); // source expression: isInitial
                expect(attrMapping.valueMapping!.length).toBe(2);
                expect((attrMapping.valueMapping![0].sourceValue as LiteralAST).value).toBe(true);
                expect((attrMapping.valueMapping![0].targetValue as LiteralAST).value).toBe(1);
                expect((attrMapping.valueMapping![1].sourceValue as LiteralAST).value).toBe(false);
                expect((attrMapping.valueMapping![1].targetValue as LiteralAST).value).toBe(0);
            });

            it('parses string value mapping', () => {
                const source = `${HEADER}A -> B {\n  code := status : "active"=1, "inactive"=0\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.valueMapping).toBeDefined();
                expect(attrMapping.valueMapping!.length).toBe(2);
                expect((attrMapping.valueMapping![0].sourceValue as LiteralAST).value).toBe('active');
            });

            it('parses multi-pair value mapping', () => {
                const source = `${HEADER}A -> B {\n  level := visibility : "public"=3, "protected"=2, "private"=1\n}`;
                const attrMapping = getFirstAttrMapping(source);
                expect(attrMapping.valueMapping).toBeDefined();
                expect(attrMapping.valueMapping!.length).toBe(3);
            });
        });
    });

    describe('Fix 2: Lambda => syntax', () => {

        it('parses single-param lambda with => in method argument', () => {
            const source = `${HEADER}A -> B {\n  names := items.map(x => x.name)\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();
            const call = attrMapping.expression as FunctionCallAST;
            expect(call.type).toBe('FunctionCall');
            expect(call.arguments.length).toBe(1);
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
            expect(lambda.params).toEqual(['x']);
            expect((lambda.body as MemberAccessAST).property).toBe('name');
        });

        it('parses multi-param lambda with =>', () => {
            const source = `${HEADER}A -> B {\n  total := items.reduce((a, b) => a + b)\n}`;
            const attrMapping = getFirstAttrMapping(source);
            const call = attrMapping.expression as FunctionCallAST;
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
            expect(lambda.params).toEqual(['a', 'b']);
            expect((lambda.body as BinaryExpressionAST).operator).toBe('+');
        });

        it('parses lambda in filter', () => {
            const source = `${HEADER}A -> B {\n  filtered := items.filter(x => x.isPublic)\n}`;
            const attrMapping = getFirstAttrMapping(source);
            const call = attrMapping.expression as FunctionCallAST;
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
            expect(lambda.params).toEqual(['x']);
        });

        it('parses lambda in sortBy', () => {
            const source = `${HEADER}A -> B {\n  sorted := items.sortBy(x => x.priority)\n}`;
            const attrMapping = getFirstAttrMapping(source);
            const call = attrMapping.expression as FunctionCallAST;
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
        });

        it(':= works for expression mapping (NOT lambda)', () => {
            const source = `${HEADER}A -> B {\n  tableName := name.snakeCase()\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.expression).toBeDefined();
            expect(attrMapping.valueMapping).toBeUndefined();
        });

        it(':= works for value mapping', () => {
            const source = `${HEADER}A -> B {\n  tokens := isInitial : true=1, false=0\n}`;
            const attrMapping = getFirstAttrMapping(source);
            expect(attrMapping.valueMapping).toBeDefined();
            expect(attrMapping.valueMapping!.length).toBe(2);
        });
    });

    describe('Combined: lambda inside expression mapping', () => {
        it('parses expression with lambda and method chain', () => {
            const source = `${HEADER}A -> B {\n  names := items.filter(x => x.isPublic).map(x => x.name)\n}`;
            const ast = parseTransformation(source);
            expect(ast).not.toBeNull();
            const body = ast!.mappings[0].body;
            const attrMapping = body[0] as AttributeMappingAST;
            expect(attrMapping.expression).toBeDefined();
            expect(attrMapping.valueMapping).toBeUndefined();
        });
    });

    describe('Lexer: ASSIGN and FAT_ARROW tokens', () => {
        it('lexes := as ASSIGN', () => {
            const lexer = new JjtlLexer('x := y');
            const { tokens } = lexer.tokenize();
            const assign = tokens.find(t => t.value === ':=');
            expect(assign).toBeDefined();
            expect(assign!.type).toBe('ASSIGN');
        });

        it('lexes => as FAT_ARROW', () => {
            const lexer = new JjtlLexer('x => y');
            const { tokens } = lexer.tokenize();
            const fatArrow = tokens.find(t => t.value === '=>');
            expect(fatArrow).toBeDefined();
            expect(fatArrow!.type).toBe('FAT_ARROW');
        });

        it('does not confuse := with : or =', () => {
            const lexer = new JjtlLexer('a := b : c = d');
            const { tokens } = lexer.tokenize();
            const types = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.type);
            expect(types).toEqual(['IDENTIFIER', 'ASSIGN', 'IDENTIFIER', 'COLON', 'IDENTIFIER', 'EQUALS', 'IDENTIFIER']);
        });

        it('does not confuse => with == or =', () => {
            const lexer = new JjtlLexer('a == b => c = d');
            const { tokens } = lexer.tokenize();
            const types = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.type);
            expect(types).toEqual(['IDENTIFIER', 'EQUALS_EQUALS', 'IDENTIFIER', 'FAT_ARROW', 'IDENTIFIER', 'EQUALS', 'IDENTIFIER']);
        });
    });
});
