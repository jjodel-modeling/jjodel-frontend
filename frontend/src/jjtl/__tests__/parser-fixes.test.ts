/**
 * Parser Fixes Tests
 *
 * Fix 1: Conversion expression disambiguation (value mapping vs expression)
 * Fix 2: Lambda syntax changed from ':' to '=>'
 */

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import type {
    TransformationAST,
    AttributeMappingAST,
    ConversionAST,
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

function getFirstConversion(source: string): ConversionAST {
    const ast = parseTransformation(source);
    expect(ast).not.toBeNull();
    expect(ast!.mappings.length).toBeGreaterThan(0);
    const body = ast!.mappings[0].body;
    expect(body.length).toBeGreaterThan(0);
    const attrMapping = body[0] as AttributeMappingAST;
    expect(attrMapping.conversion).toBeDefined();
    return attrMapping.conversion!;
}

const HEADER = `transformation Test\nfrom Source\nto Target\n`;

describe('JjTL Parser Fixes', () => {

    describe('Fix 1: Conversion disambiguation', () => {

        describe('Expression mappings (constant values)', () => {
            it('parses -> attr : "string constant"', () => {
                const source = `${HEADER}A -> B {\n  -> name : "id"\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect(conv.mappings).toBeUndefined();
                expect((conv.expression as LiteralAST).type).toBe('Literal');
                expect((conv.expression as LiteralAST).value).toBe('id');
                expect((conv.expression as LiteralAST).literalType).toBe('string');
            });

            it('parses -> attr : number constant', () => {
                const source = `${HEADER}A -> B {\n  -> weight : 1\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect(conv.mappings).toBeUndefined();
                expect((conv.expression as LiteralAST).value).toBe(1);
            });

            it('parses -> attr : boolean constant', () => {
                const source = `${HEADER}A -> B {\n  -> active : true\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect(conv.mappings).toBeUndefined();
                expect((conv.expression as LiteralAST).value).toBe(true);
            });

            it('parses -> attr : expression starting with literal then operator', () => {
                const source = `${HEADER}A -> B {\n  -> count : 1 + 2\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect(conv.mappings).toBeUndefined();
                const expr = conv.expression as BinaryExpressionAST;
                expect(expr.type).toBe('BinaryExpression');
                expect(expr.operator).toBe('+');
            });
        });

        describe('Expression mappings (computed values)', () => {
            it('parses sourceAttr -> targetAttr : method call', () => {
                const source = `${HEADER}A -> B {\n  name -> tableName : name.snakeCase()\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect(conv.mappings).toBeUndefined();
                expect((conv.expression as FunctionCallAST).type).toBe('FunctionCall');
            });

            it('parses -> attr : binary expression with strings', () => {
                const source = `${HEADER}A -> B {\n  -> fullName : firstName + " " + lastName\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect((conv.expression as BinaryExpressionAST).type).toBe('BinaryExpression');
            });

            it('parses -> attr : negation', () => {
                const source = `${HEADER}A -> B {\n  -> flag : not isAbstract\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                const expr = conv.expression as UnaryExpressionAST;
                expect(expr.type).toBe('UnaryExpression');
                expect(expr.operator).toBe('not');
            });

            it('parses -> attr : conditional', () => {
                const source = `${HEADER}A -> B {\n  -> tokens : if isInitial then 1 else 0\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect((conv.expression as ConditionalExpressionAST).type).toBe('ConditionalExpression');
            });

            it('parses -> attr : null coalesce', () => {
                const source = `${HEADER}A -> B {\n  -> label : name ?? "unnamed"\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect((conv.expression as NullCoalesceExpressionAST).type).toBe('NullCoalesceExpression');
            });

            it('parses sourceAttr -> targetAttr : identifier (simple expression)', () => {
                const source = `${HEADER}A -> B {\n  name -> label : name\n}`;
                const conv = getFirstConversion(source);
                expect(conv.expression).toBeDefined();
                expect((conv.expression as IdentifierAST).type).toBe('Identifier');
                expect((conv.expression as IdentifierAST).name).toBe('name');
            });
        });

        describe('Value mappings (must still work)', () => {
            it('parses boolean value mapping', () => {
                const source = `${HEADER}A -> B {\n  isInitial -> tokens : true=1, false=0\n}`;
                const conv = getFirstConversion(source);
                expect(conv.mappings).toBeDefined();
                expect(conv.expression).toBeUndefined();
                expect(conv.mappings!.length).toBe(2);
                expect((conv.mappings![0].sourceValue as LiteralAST).value).toBe(true);
                expect((conv.mappings![0].targetValue as LiteralAST).value).toBe(1);
                expect((conv.mappings![1].sourceValue as LiteralAST).value).toBe(false);
                expect((conv.mappings![1].targetValue as LiteralAST).value).toBe(0);
            });

            it('parses string value mapping', () => {
                const source = `${HEADER}A -> B {\n  status -> code : "active"=1, "inactive"=0\n}`;
                const conv = getFirstConversion(source);
                expect(conv.mappings).toBeDefined();
                expect(conv.mappings!.length).toBe(2);
                expect((conv.mappings![0].sourceValue as LiteralAST).value).toBe('active');
            });

            it('parses multi-pair value mapping', () => {
                const source = `${HEADER}A -> B {\n  visibility -> level : "public"=3, "protected"=2, "private"=1\n}`;
                const conv = getFirstConversion(source);
                expect(conv.mappings).toBeDefined();
                expect(conv.mappings!.length).toBe(3);
            });
        });
    });

    describe('Fix 2: Lambda => syntax', () => {

        it('parses single-param lambda with => in method argument', () => {
            const source = `${HEADER}A -> B {\n  -> names : items.map(x => x.name)\n}`;
            const conv = getFirstConversion(source);
            expect(conv.expression).toBeDefined();
            const call = conv.expression as FunctionCallAST;
            expect(call.type).toBe('FunctionCall');
            expect(call.arguments.length).toBe(1);
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
            expect(lambda.params).toEqual(['x']);
            expect((lambda.body as MemberAccessAST).property).toBe('name');
        });

        it('parses multi-param lambda with =>', () => {
            const source = `${HEADER}A -> B {\n  -> total : items.reduce((a, b) => a + b)\n}`;
            const conv = getFirstConversion(source);
            const call = conv.expression as FunctionCallAST;
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
            expect(lambda.params).toEqual(['a', 'b']);
            expect((lambda.body as BinaryExpressionAST).operator).toBe('+');
        });

        it('parses lambda in filter', () => {
            const source = `${HEADER}A -> B {\n  -> filtered : items.filter(x => x.isPublic)\n}`;
            const conv = getFirstConversion(source);
            const call = conv.expression as FunctionCallAST;
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
            expect(lambda.params).toEqual(['x']);
        });

        it('parses lambda in sortBy', () => {
            const source = `${HEADER}A -> B {\n  -> sorted : items.sortBy(x => x.priority)\n}`;
            const conv = getFirstConversion(source);
            const call = conv.expression as FunctionCallAST;
            const lambda = call.arguments[0] as LambdaExpressionAST;
            expect(lambda.type).toBe('LambdaExpression');
        });

        it('colon still works for expression mapping (NOT lambda)', () => {
            const source = `${HEADER}A -> B {\n  name -> tableName : name.snakeCase()\n}`;
            const conv = getFirstConversion(source);
            expect(conv.expression).toBeDefined();
            expect(conv.mappings).toBeUndefined();
        });

        it('colon still works for value mapping', () => {
            const source = `${HEADER}A -> B {\n  isInitial -> tokens : true=1, false=0\n}`;
            const conv = getFirstConversion(source);
            expect(conv.mappings).toBeDefined();
            expect(conv.mappings!.length).toBe(2);
        });
    });

    describe('Combined: lambda inside expression mapping', () => {
        it('parses expression with lambda and method chain', () => {
            const source = `${HEADER}A -> B {\n  -> names : items.filter(x => x.isPublic).map(x => x.name)\n}`;
            const ast = parseTransformation(source);
            expect(ast).not.toBeNull();
            const body = ast!.mappings[0].body;
            const attrMapping = body[0] as AttributeMappingAST;
            expect(attrMapping.conversion).toBeDefined();
            expect(attrMapping.conversion!.expression).toBeDefined();
        });
    });

    describe('Lexer: FAT_ARROW token', () => {
        it('lexes => as FAT_ARROW', () => {
            const lexer = new JjtlLexer('x => y');
            const { tokens } = lexer.tokenize();
            const fatArrow = tokens.find(t => t.value === '=>');
            expect(fatArrow).toBeDefined();
            expect(fatArrow!.type).toBe('FAT_ARROW');
        });

        it('does not confuse => with == or =', () => {
            const lexer = new JjtlLexer('a == b => c = d');
            const { tokens } = lexer.tokenize();
            const types = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.type);
            expect(types).toEqual(['IDENTIFIER', 'EQUALS_EQUALS', 'IDENTIFIER', 'FAT_ARROW', 'IDENTIFIER', 'EQUALS', 'IDENTIFIER']);
        });
    });
});
