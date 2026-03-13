import { describe, it, test, expect } from 'vitest';
/**
 * AST Bridge Tests
 *
 * Tests that JjTL expression AST nodes are correctly converted to
 * JjEL expression AST nodes by toJjelAst().
 */

import { toJjelAst } from '../executor/astBridge';
import type { ExpressionAST, LiteralAST, IdentifierAST, BinaryExpressionAST, MemberAccessAST, FunctionCallAST, LambdaExpressionAST, ConditionalExpressionAST, UnaryExpressionAST, NullCoalesceExpressionAST, IsTypeExpressionAST, ArrayLiteralAST, NullSafeMemberAccessAST } from '../types/ast';
import type { JjelExpression } from '../../jjel/types/ast';

const LOC = { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } };

function lit(value: string | number | boolean | null, literalType: 'string' | 'number' | 'boolean' | 'null'): LiteralAST {
    return { type: 'Literal', value, literalType, location: LOC };
}

function id(name: string): IdentifierAST {
    return { type: 'Identifier', name, location: LOC };
}

// ============================================
// LITERAL CONVERSION
// ============================================

describe('toJjelAst — Literals', () => {
    test('string literal', () => {
        const result = toJjelAst(lit('hello', 'string'));
        expect(result.type).toBe('Literal');
        expect((result as any).value).toBe('hello');
        expect((result as any).dataType).toBe('EString');
    });

    test('number literal', () => {
        const result = toJjelAst(lit(42, 'number'));
        expect(result.type).toBe('Literal');
        expect((result as any).value).toBe(42);
        expect((result as any).dataType).toBe('EInt');
    });

    test('boolean literal', () => {
        const result = toJjelAst(lit(true, 'boolean'));
        expect(result.type).toBe('Literal');
        expect((result as any).value).toBe(true);
        expect((result as any).dataType).toBe('EBoolean');
    });

    test('null literal', () => {
        const result = toJjelAst(lit(null, 'null'));
        expect(result.type).toBe('Literal');
        expect((result as any).value).toBeNull();
        expect((result as any).dataType).toBe('null');
    });
});

// ============================================
// IDENTIFIER CONVERSION
// ============================================

describe('toJjelAst — Identifiers', () => {
    test('simple identifier', () => {
        const result = toJjelAst(id('name'));
        expect(result.type).toBe('Identifier');
        expect((result as any).name).toBe('name');
    });
});

// ============================================
// BINARY EXPRESSION CONVERSION
// ============================================

describe('toJjelAst — Binary expressions', () => {
    test('arithmetic operator +', () => {
        const expr: BinaryExpressionAST = {
            type: 'BinaryExpression', operator: '+',
            left: lit(1, 'number'), right: lit(2, 'number'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('Binary');
        expect((result as any).operator).toBe('+');
    });

    test('logical and', () => {
        const expr: BinaryExpressionAST = {
            type: 'BinaryExpression', operator: 'and',
            left: lit(true, 'boolean'), right: lit(false, 'boolean'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('Binary');
        expect((result as any).operator).toBe('and');
    });

    test('maps = to ==', () => {
        const expr: BinaryExpressionAST = {
            type: 'BinaryExpression', operator: '=',
            left: id('x'), right: lit(1, 'number'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect((result as any).operator).toBe('==');
    });

    test('maps <> to !=', () => {
        const expr: BinaryExpressionAST = {
            type: 'BinaryExpression', operator: '<>',
            left: id('x'), right: lit(1, 'number'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect((result as any).operator).toBe('!=');
    });

    test('maps && to and', () => {
        const expr: BinaryExpressionAST = {
            type: 'BinaryExpression', operator: '&&',
            left: lit(true, 'boolean'), right: lit(true, 'boolean'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect((result as any).operator).toBe('and');
    });

    test('maps || to or', () => {
        const expr: BinaryExpressionAST = {
            type: 'BinaryExpression', operator: '||',
            left: lit(true, 'boolean'), right: lit(false, 'boolean'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect((result as any).operator).toBe('or');
    });
});

// ============================================
// UNARY EXPRESSION CONVERSION
// ============================================

describe('toJjelAst — Unary expressions', () => {
    test('not', () => {
        const expr: UnaryExpressionAST = {
            type: 'UnaryExpression', operator: 'not',
            operand: lit(true, 'boolean'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('Unary');
        expect((result as any).operator).toBe('not');
    });

    test('negation', () => {
        const expr: UnaryExpressionAST = {
            type: 'UnaryExpression', operator: '-',
            operand: lit(5, 'number'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('Unary');
        expect((result as any).operator).toBe('-');
    });
});

// ============================================
// MEMBER ACCESS CONVERSION
// ============================================

describe('toJjelAst — Member access', () => {
    test('simple member access', () => {
        const expr: MemberAccessAST = {
            type: 'MemberAccess',
            object: id('source'),
            property: 'name',
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('MemberAccess');
        expect((result as any).property).toBe('name');
    });

    test('null-safe member access', () => {
        const expr: NullSafeMemberAccessAST = {
            type: 'NullSafeMemberAccess',
            object: id('parent'),
            property: 'name',
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('NullSafeMemberAccess');
        expect((result as any).property).toBe('name');
    });
});

// ============================================
// FUNCTION CALL → METHOD CALL CONVERSION
// ============================================

describe('toJjelAst — FunctionCall to MethodCall', () => {
    test('obj.method() → MethodCall', () => {
        const expr: FunctionCallAST = {
            type: 'FunctionCall',
            callee: {
                type: 'MemberAccess',
                object: id('name'),
                property: 'toUpper',
                location: LOC,
            } as MemberAccessAST,
            arguments: [],
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('MethodCall');
        expect((result as any).method).toBe('toUpper');
        expect((result as any).args).toHaveLength(0);
    });

    test('obj.method(arg) → MethodCall with args', () => {
        const expr: FunctionCallAST = {
            type: 'FunctionCall',
            callee: {
                type: 'MemberAccess',
                object: id('items'),
                property: 'filter',
                location: LOC,
            } as MemberAccessAST,
            arguments: [
                { type: 'LambdaExpression', params: ['x'], body: id('x'), location: LOC } as LambdaExpressionAST,
            ],
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('MethodCall');
        expect((result as any).method).toBe('filter');
        expect((result as any).args).toHaveLength(1);
        expect((result as any).args[0].type).toBe('Lambda');
    });

    test('standalone fn() → Identifier (for builtin handling)', () => {
        const expr: FunctionCallAST = {
            type: 'FunctionCall',
            callee: id('resolve'),
            arguments: [lit('x', 'string')],
            location: LOC,
        };
        const result = toJjelAst(expr);
        // Standalone calls can't be mapped to MethodCall, so we get Identifier
        // The executor handles builtin calls before delegating to the bridge
        expect(result.type).toBe('Identifier');
        expect((result as any).name).toBe('resolve');
    });
});

// ============================================
// CONDITIONAL EXPRESSION CONVERSION
// ============================================

describe('toJjelAst — Conditional', () => {
    test('if-then-else', () => {
        const expr: ConditionalExpressionAST = {
            type: 'ConditionalExpression',
            condition: id('isActive'),
            thenBranch: lit('yes', 'string'),
            elseBranch: lit('no', 'string'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('IfThenElse');
        expect((result as any).elseBranch).not.toBeNull();
    });

    test('if-then without else', () => {
        const expr: ConditionalExpressionAST = {
            type: 'ConditionalExpression',
            condition: id('isActive'),
            thenBranch: lit('yes', 'string'),
            elseBranch: null,
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('IfThenElse');
        expect((result as any).elseBranch).toBeNull();
    });
});

// ============================================
// NULL COALESCE CONVERSION
// ============================================

describe('toJjelAst — NullCoalesce', () => {
    test('a ?? b', () => {
        const expr: NullCoalesceExpressionAST = {
            type: 'NullCoalesceExpression',
            left: id('name'),
            right: lit('unnamed', 'string'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('NullCoalesce');
    });
});

// ============================================
// IS TYPE CONVERSION
// ============================================

describe('toJjelAst — IsType', () => {
    test('x is String', () => {
        const expr: IsTypeExpressionAST = {
            type: 'IsTypeExpression',
            expression: id('x'),
            targetType: 'String',
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('IsType');
        expect((result as any).targetType).toBe('String');
    });
});

// ============================================
// LAMBDA CONVERSION
// ============================================

describe('toJjelAst — Lambda', () => {
    test('single param lambda', () => {
        const expr: LambdaExpressionAST = {
            type: 'LambdaExpression',
            params: ['x'],
            body: id('x'),
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('Lambda');
        expect((result as any).params).toEqual(['x']);
    });

    test('multi param lambda', () => {
        const expr: LambdaExpressionAST = {
            type: 'LambdaExpression',
            params: ['a', 'b'],
            body: {
                type: 'BinaryExpression', operator: '+',
                left: id('a'), right: id('b'),
                location: LOC,
            } as BinaryExpressionAST,
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('Lambda');
        expect((result as any).params).toEqual(['a', 'b']);
        expect((result as any).body.type).toBe('Binary');
    });
});

// ============================================
// ARRAY LITERAL CONVERSION
// ============================================

describe('toJjelAst — ArrayLiteral', () => {
    test('array of numbers', () => {
        const expr: ArrayLiteralAST = {
            type: 'ArrayLiteral',
            elements: [lit(1, 'number'), lit(2, 'number'), lit(3, 'number')],
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result.type).toBe('ArrayLiteral');
        expect((result as any).elements).toHaveLength(3);
    });
});

// ============================================
// JJEL EXPRESSION WRAPPER
// ============================================

describe('toJjelAst — JjelExpressionWrapper', () => {
    test('unwraps JjEL expression', () => {
        const inner: JjelExpression = { type: 'Identifier', name: 'test' };
        const expr = {
            type: 'JjelExpression' as const,
            expression: inner,
            location: LOC,
        };
        const result = toJjelAst(expr);
        expect(result).toBe(inner); // Same reference — unwrapped
    });
});
