/**
 * JjEL - Jjodel Expression Language
 *
 * A unified expression language for Jjodel that provides:
 * - Null-safe navigation (?. and ??)
 * - Collection operations (filter, map, first, etc.)
 * - String manipulation (toUpper, toLower, etc.)
 * - Type checking (is operator)
 * - Conditional expressions (if-then-else)
 * - Lambda expressions (x: expr)
 *
 * Key syntax differences from other languages:
 * - Logical operators: 'and', 'or', 'not' (NOT &&, ||, !)
 * - Conditional: 'if cond then a else b' (NOT ternary)
 * - Lambda: 'x: x.name' or '(a, b): a + b' (NOT arrow)
 *
 * Example usage:
 * ```typescript
 * import { parse, evaluate, EvaluationContext } from '@/jjel';
 *
 * const expr = parse('items.filter(x: x.isActive).map(x: x.name)');
 * const ctx = new EvaluationContext({ items: [...] });
 * const result = evaluate(expr, ctx);
 * ```
 */

// Types
export * from './types';

// Lexer
export { JjelLexer, tokenize } from './lexer';

// Parser
export { JjelParser, parse } from './parser';

// Evaluator
export {
    JjelEvaluator,
    JjelEvaluationError,
    evaluate,
    EvaluationContext,
    TypeRegistry,
    createFunction,
    isJjelFunction,
    isJjelObject,
    toJjelValue,
    fromJjelValue
} from './evaluator';
export type { JjelValue, JjelObject, JjelFunction } from './evaluator';

// ============================================
// CONVENIENCE API
// ============================================

import { parseExpression } from './parser';
import { evaluate } from './evaluator';
import { EvaluationContext } from './evaluator';
import type { JjelValue } from './evaluator';

/**
 * Parse and evaluate a JjEL expression in one step
 *
 * @param source - JjEL expression string
 * @param variables - Optional variable bindings
 * @returns The evaluated result
 * @throws Error if parsing or evaluation fails
 *
 * @example
 * ```typescript
 * const result = jjelEval('name.toUpper()', { name: 'hello' });
 * // result: 'HELLO'
 * ```
 */
export function jjelEval(
    source: string,
    variables?: Record<string, JjelValue>
): JjelValue {
    const result = parseExpression(source);

    if (result.errors.length > 0) {
        throw new Error(`JjEL parse error: ${result.errors[0].message}`);
    }

    if (!result.expression) {
        throw new Error('JjEL parse error: No expression produced');
    }

    const ctx = variables ? new EvaluationContext(variables) : undefined;
    return evaluate(result.expression, ctx);
}

/**
 * Check if a JjEL expression is valid
 *
 * @param source - JjEL expression string
 * @returns True if the expression is syntactically valid
 */
export function isValidJjel(source: string): boolean {
    const result = parseExpression(source);
    return result.errors.length === 0 && result.expression !== null;
}

/**
 * Get parse errors for a JjEL expression
 *
 * @param source - JjEL expression string
 * @returns Array of error messages (empty if valid)
 */
export function getJjelErrors(source: string): string[] {
    const result = parseExpression(source);
    return result.errors.map(e => `Line ${e.line}:${e.column}: ${e.message}`);
}
