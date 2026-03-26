/**
 * JjScript LET Command Handler
 * Evaluates scoped variable bindings and executes the body command
 * with those variables injected into the execution context.
 *
 * Syntax:
 *   let $name = prompt('Name', EString),
 *       $upper = $name.toUpper()
 *   in set Mario.name = $name
 */

import {
    LetArgs,
    BlockArgs,
    ExecutionResult,
    ExecutionContext,
    CommandNode,
    SetArgs,
    RenameArgs,
    LiteralValue,
    QualifiedName
} from '../../types';
import { getExecutor } from '../executor';
import { jjelEval } from '../../../jjel';
import type { JjelValue } from '../../../jjel';
import { getUIBridge } from '../../../jjtl/executor/UIBridge';
import { buildEvalContext } from './eval';

// ============================================
// LET COMMAND EXECUTOR
// ============================================

export async function executeLet(
    args: LetArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    try {
        // Create a child context — never mutate the parent
        const letContext: ExecutionContext = {
            ...context,
            variables: new Map(context.variables),
        };

        // Evaluate bindings sequentially (later bindings can reference earlier ones)
        for (const binding of args.bindings) {
            const value = await evaluateBindingValue(binding.valueExpr, letContext);
            letContext.variables.set(binding.name, value);
        }

        // Resolve $variable references in the body AST before executing
        const resolvedBody = resolveVariablesInBody(args.body, letContext.variables);

        // Execute the body with the enriched context
        const executor = getExecutor();
        return executor.executeAST(resolvedBody, letContext);

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'let',
            message: `Let binding error: ${err.message}`,
            errors: [{ code: 'LET_ERROR', message: err.message }]
        };
    }
}

// ============================================
// BINDING VALUE EVALUATION
// ============================================

/**
 * Evaluate a binding value expression.
 * Handles three cases:
 *   1. prompt(...) — delegates to UIBridge.showPrompt
 *   2. confirm(...) — delegates to UIBridge.showConfirm
 *   3. Everything else — evaluates as JjEL expression
 */
async function evaluateBindingValue(
    expr: string,
    context: ExecutionContext
): Promise<any> {
    const trimmed = expr.trim();

    // 1. prompt('message', TypeRef[, 'default'])
    if (trimmed.startsWith('prompt(') && trimmed.endsWith(')')) {
        return evaluatePrompt(trimmed);
    }

    // 2. confirm('message')
    if (trimmed.startsWith('confirm(') && trimmed.endsWith(')')) {
        return evaluateConfirm(trimmed);
    }

    // 3. JjEL expression
    return evaluateJjel(trimmed, context);
}

async function evaluatePrompt(expr: string): Promise<any> {
    const inner = expr.slice('prompt('.length, -1);
    const parts = splitFunctionArgs(inner);

    const message = unquote(parts[0] || '');
    const typeRef = parts[1]?.trim() || 'EString';
    const defaultValue = parts[2] ? unquote(parts[2]) : undefined;

    const bridge = getUIBridge();
    const result = await bridge.showPrompt(message, typeRef, defaultValue);

    if (result.cancelled) return null;
    return result.value;
}

async function evaluateConfirm(expr: string): Promise<boolean> {
    const inner = expr.slice('confirm('.length, -1);
    const parts = splitFunctionArgs(inner);
    const message = unquote(parts[0] || '');

    const bridge = getUIBridge();
    return bridge.showConfirm(message);
}

function evaluateJjel(expr: string, context: ExecutionContext): any {
    // Build full evaluation context (classes, attributes, metamodel, project)
    const variables: Record<string, JjelValue> = buildEvalContext(context);

    // Overlay context.variables (includes earlier let bindings)
    for (const [key, value] of context.variables) {
        variables[key] = value;
    }

    return jjelEval(expr, variables);
}

// ============================================
// VARIABLE RESOLUTION IN BODY AST
// ============================================

/**
 * Walk the body AST and replace $variable references with concrete values.
 * Currently handles: SetArgs.value, RenameArgs.newName
 */
function resolveVariablesInBody(
    body: CommandNode,
    variables: Map<string, any>
): CommandNode {
    // Handle block commands by resolving variables in each sub-command
    if (body.command === 'block') {
        const blockArgs = body.args as BlockArgs;
        return {
            ...body,
            args: {
                ...blockArgs,
                commands: blockArgs.commands.map(cmd => resolveVariablesInBody(cmd, variables))
            } as BlockArgs
        };
    }

    if (body.command === 'set') {
        const setArgs = body.args as SetArgs;
        const resolvedValue = tryResolveVariable(setArgs.value, variables);
        if (resolvedValue !== undefined) {
            return {
                ...body,
                args: { ...setArgs, value: resolvedValue } as SetArgs
            };
        }
    }

    if (body.command === 'rename') {
        const renameArgs = body.args as RenameArgs;
        if (renameArgs.newName.startsWith('$') && variables.has(renameArgs.newName)) {
            const resolved = variables.get(renameArgs.newName);
            return {
                ...body,
                args: { ...renameArgs, newName: String(resolved) } as RenameArgs
            };
        }
    }

    // For nested let, the executor handles it recursively — no substitution needed
    return body;
}

/**
 * If the value is a QualifiedName whose raw starts with '$',
 * resolve it from the variables map and return a LiteralValue.
 */
function tryResolveVariable(
    value: LiteralValue | QualifiedName,
    variables: Map<string, any>
): LiteralValue | undefined {
    if (value && typeof value === 'object' && 'raw' in value) {
        const qn = value as QualifiedName;
        if (qn.raw.startsWith('$') && variables.has(qn.raw)) {
            const resolved = variables.get(qn.raw);
            if (typeof resolved === 'string') return { kind: 'string', value: resolved };
            if (typeof resolved === 'number') return { kind: 'number', value: resolved };
            if (typeof resolved === 'boolean') return { kind: 'boolean', value: resolved };
            if (resolved === null || resolved === undefined) return { kind: 'null' };
            return { kind: 'string', value: String(resolved) };
        }
    }
    return undefined;
}

// ============================================
// UTILITY
// ============================================

/**
 * Split function arguments respecting string quoting and nested parens.
 * e.g. "prompt('hello, world', EString)" → ["'hello, world'", "EString"]
 */
function splitFunctionArgs(argsStr: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];

        if (inString) {
            current += char;
            if (char === stringChar && argsStr[i - 1] !== '\\') {
                inString = false;
            }
        } else if (char === "'" || char === '"') {
            inString = true;
            stringChar = char;
            current += char;
        } else if (char === '(') {
            depth++;
            current += char;
        } else if (char === ')') {
            depth--;
            current += char;
        } else if (char === ',' && depth === 0) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        result.push(current.trim());
    }
    return result;
}

function unquote(s: string): string {
    const trimmed = s.trim();
    if (
        (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}
