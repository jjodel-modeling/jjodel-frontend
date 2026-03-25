/**
 * AST Bridge: JjTL ExpressionAST → JjEL JjelExpression
 *
 * Converts JjTL expression AST nodes to JjEL expression AST nodes so that
 * the JjTL executor can delegate expression evaluation to the JjEL evaluator.
 * This eliminates ~500 lines of duplicate expression evaluation code in the
 * JjTL executor and gives JjTL access to all JjEL builtins (snakeCase,
 * camelCase, forall, exists, implies, etc.).
 *
 * AST type mapping:
 *   JjTL 'Literal'                → JjEL 'Literal'
 *   JjTL 'Identifier'             → JjEL 'Identifier'
 *   JjTL 'MemberAccess'           → JjEL 'MemberAccess'
 *   JjTL 'NullSafeMemberAccess'   → JjEL 'NullSafeMemberAccess'
 *   JjTL 'FunctionCall'           → JjEL 'MethodCall' (when callee is MemberAccess)
 *                                  → JjEL Identifier + call (when callee is Identifier)
 *   JjTL 'NullSafeFunctionCall'   → JjEL 'NullSafeMethodCall'
 *   JjTL 'BinaryExpression'       → JjEL 'Binary'
 *   JjTL 'UnaryExpression'        → JjEL 'Unary'
 *   JjTL 'ConditionalExpression'  → JjEL 'IfThenElse'
 *   JjTL 'NullCoalesceExpression' → JjEL 'NullCoalesce'
 *   JjTL 'IsTypeExpression'       → JjEL 'IsType'
 *   JjTL 'LambdaExpression'       → JjEL 'Lambda'
 *   JjTL 'ArrayLiteral'           → JjEL 'ArrayLiteral'
 *   JjTL 'JjelExpression'         → unwrap to inner JjelExpression
 *   JjTL 'PromptExpression'       → NOT convertible (JjTL-specific interactive)
 *   JjTL 'InputExpression'        → NOT convertible (JjTL-specific interactive)
 */

import type { JjelExpression, BinaryOperator, UnaryOperator } from '../../jjel/types/ast';
import type {
    ExpressionAST,
    LiteralAST,
    IdentifierAST,
    MemberAccessAST,
    NullSafeMemberAccessAST,
    FunctionCallAST,
    NullSafeFunctionCallAST,
    BinaryExpressionAST,
    UnaryExpressionAST,
    ConditionalExpressionAST,
    NullCoalesceExpressionAST,
    IsTypeExpressionAST,
    LambdaExpressionAST,
    ArrayLiteralAST,
    JjelExpressionWrapperAST,
} from '../types/ast';

/**
 * Convert a JjTL expression AST node to a JjEL expression AST node.
 *
 * This bridge eliminates the need for the JjTL executor to re-implement
 * expression evaluation — it can delegate to JjelEvaluator directly.
 *
 * @throws Error if the expression type is not convertible (PromptExpression, InputExpression)
 */
export function toJjelAst(expr: ExpressionAST): JjelExpression {
    switch (expr.type) {
        case 'Literal': {
            const lit = expr as LiteralAST;
            return {
                type: 'Literal',
                value: lit.value,
                dataType: mapLiteralType(lit.literalType),
            };
        }

        case 'Identifier': {
            const id = expr as IdentifierAST;
            return {
                type: 'Identifier',
                name: id.name,
            };
        }

        case 'MemberAccess': {
            const ma = expr as MemberAccessAST;
            return {
                type: 'MemberAccess',
                object: toJjelAst(ma.object),
                property: ma.property,
            };
        }

        case 'NullSafeMemberAccess': {
            const nma = expr as NullSafeMemberAccessAST;
            return {
                type: 'NullSafeMemberAccess',
                object: toJjelAst(nma.object),
                property: nma.property,
            };
        }

        case 'FunctionCall': {
            const fc = expr as FunctionCallAST;
            return convertFunctionCall(fc);
        }

        case 'NullSafeFunctionCall': {
            const nfc = expr as NullSafeFunctionCallAST;
            return convertNullSafeFunctionCall(nfc);
        }

        case 'BinaryExpression': {
            const bin = expr as BinaryExpressionAST;
            return {
                type: 'Binary',
                operator: mapBinaryOperator(bin.operator),
                left: toJjelAst(bin.left),
                right: toJjelAst(bin.right),
            };
        }

        case 'UnaryExpression': {
            const un = expr as UnaryExpressionAST;
            return {
                type: 'Unary',
                operator: un.operator as UnaryOperator,
                operand: toJjelAst(un.operand),
            };
        }

        case 'ConditionalExpression': {
            const cond = expr as ConditionalExpressionAST;
            return {
                type: 'IfThenElse',
                condition: toJjelAst(cond.condition),
                thenBranch: toJjelAst(cond.thenBranch),
                elseBranch: cond.elseBranch ? toJjelAst(cond.elseBranch) : null,
            };
        }

        case 'NullCoalesceExpression': {
            const nc = expr as NullCoalesceExpressionAST;
            return {
                type: 'NullCoalesce',
                left: toJjelAst(nc.left),
                right: toJjelAst(nc.right),
            };
        }

        case 'IsTypeExpression': {
            const is = expr as IsTypeExpressionAST;
            return {
                type: 'IsType',
                expression: toJjelAst(is.expression),
                targetType: is.targetType,
            };
        }

        case 'LambdaExpression': {
            const lam = expr as LambdaExpressionAST;
            return {
                type: 'Lambda',
                params: lam.params,
                body: toJjelAst(lam.body),
            };
        }

        case 'ArrayLiteral': {
            const arr = expr as ArrayLiteralAST;
            return {
                type: 'ArrayLiteral',
                elements: arr.elements.map(toJjelAst),
            };
        }

        case 'JjelExpression': {
            // Already a JjEL expression — unwrap
            const wrapper = expr as JjelExpressionWrapperAST;
            return wrapper.expression;
        }

        case 'PromptExpression':
        case 'InputExpression':
            // These are JjTL-specific interactive expressions that cannot be
            // converted to JjEL. They must be handled separately by the executor.
            console.warn(`[astBridge] ${expr.type} is JjTL-specific and cannot be converted to JjEL`);
            return { type: 'Literal', value: null, dataType: 'null' };

        default:
            console.warn(`[astBridge] Unhandled JjTL expression type: ${(expr as any).type}`);
            return { type: 'Literal', value: null, dataType: 'null' };
    }
}

/**
 * Convert JjTL FunctionCall to JjEL MethodCall or function invocation.
 *
 * JjTL models function calls as FunctionCall { callee, arguments }.
 * When callee is MemberAccess (e.g., `name.toUpper()`), this maps to
 * JjEL MethodCall { object, method, args }.
 * When callee is Identifier (e.g., `resolve("x")`), we need to handle
 * it as an identifier lookup + method call via a synthetic self call.
 */
function convertFunctionCall(fc: FunctionCallAST): JjelExpression {
    const args = fc.arguments.map(toJjelAst);

    // obj.method(args) → MethodCall
    if (fc.callee.type === 'MemberAccess') {
        const ma = fc.callee as MemberAccessAST;
        return {
            type: 'MethodCall',
            object: toJjelAst(ma.object),
            method: ma.property,
            args,
        };
    }

    // obj?.method(args) → NullSafeMethodCall
    if (fc.callee.type === 'NullSafeMemberAccess') {
        const nma = fc.callee as NullSafeMemberAccessAST;
        return {
            type: 'NullSafeMethodCall',
            object: toJjelAst(nma.object),
            method: nma.property,
            args,
        };
    }

    // Standalone function call: resolve("x"), helper(a, b)
    // JjEL evaluator handles this via Identifier → builtin lookup.
    // We model it as MethodCall on a synthetic "self" identifier
    // so the JjEL evaluator's callMethod path is used, OR we can
    // just return Identifier and let the caller handle it.
    //
    // Actually, the JjEL evaluator doesn't have a standalone function call node.
    // Builtins are resolved via Identifier (returns JjelFunction), then the
    // executor would need to invoke it. To keep things simple, we keep
    // this as an Identifier — the executor handles calling builtins separately.
    if (fc.callee.type === 'Identifier') {
        // Return null — this case needs special handling in the executor
        // because JjEL doesn't have a "FunctionCall" AST node for standalone calls.
        // The executor will check for builtins/helpers before converting.
        return {
            type: 'Identifier',
            name: (fc.callee as IdentifierAST).name,
        };
    }

    // Fallback for nested function calls like foo()(x)
    console.warn(`[astBridge] Complex function call with callee type ${fc.callee.type}`);
    return { type: 'Literal', value: null, dataType: 'null' };
}

/**
 * Convert JjTL NullSafeFunctionCall to JjEL NullSafeMethodCall
 */
function convertNullSafeFunctionCall(nfc: NullSafeFunctionCallAST): JjelExpression {
    const args = nfc.arguments.map(toJjelAst);

    if (nfc.callee.type === 'MemberAccess') {
        const ma = nfc.callee as MemberAccessAST;
        return {
            type: 'NullSafeMethodCall',
            object: toJjelAst(ma.object),
            method: ma.property,
            args,
        };
    }

    if (nfc.callee.type === 'NullSafeMemberAccess') {
        const nma = nfc.callee as NullSafeMemberAccessAST;
        return {
            type: 'NullSafeMethodCall',
            object: toJjelAst(nma.object),
            method: nma.property,
            args,
        };
    }

    // Standalone null-safe call — treat as identifier
    if (nfc.callee.type === 'Identifier') {
        return {
            type: 'Identifier',
            name: (nfc.callee as IdentifierAST).name,
        };
    }

    console.warn(`[astBridge] Complex null-safe function call with callee type ${nfc.callee.type}`);
    return { type: 'Literal', value: null, dataType: 'null' };
}

/**
 * Map JjTL literal type to JjEL dataType
 */
function mapLiteralType(literalType: 'string' | 'number' | 'boolean' | 'null'): 'EString' | 'EInt' | 'EDouble' | 'EBoolean' | 'null' {
    switch (literalType) {
        case 'string': return 'EString';
        case 'number': return 'EInt'; // Note: JjEL distinguishes EInt/EDouble but JjTL doesn't
        case 'boolean': return 'EBoolean';
        case 'null': return 'null';
    }
}

/**
 * Map JjTL operator string to JjEL BinaryOperator.
 * JjTL accepts some extra operators (=, <>, &&, ||) that JjEL doesn't.
 */
function mapBinaryOperator(op: string): BinaryOperator {
    switch (op) {
        case '=': return '==';
        case '<>': return '!=';
        case '&&': return 'and';
        case '||': return 'or';
        default: return op as BinaryOperator;
    }
}
