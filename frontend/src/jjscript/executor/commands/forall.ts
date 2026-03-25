/**
 * JjScript FORALL Command Handler
 * Iterates over a JjEL collection and executes a JjScript command per element.
 *
 * Syntax:
 *   forall c in classes do delete c
 *   forall c in classes such that c.isAbstract do rename c to "Abstract_" + c.name
 */

import {
    ForAllArgs,
    ExecutionResult,
    ExecutionContext,
    CommandNode,
} from '../../types';
import { getExecutor } from '../executor';
import { jjelEval } from '../../../jjel';
import type { JjelValue } from '../../../jjel';
import { buildEvalContext } from './eval';

// ============================================
// FORALL COMMAND EXECUTOR
// ============================================

export async function executeForAll(
    args: ForAllArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    try {
        // 1. Build eval context: metamodel variables + context variables (from let, etc.)
        const evalVars = buildEvalContext(context);
        for (const [key, value] of context.variables) {
            evalVars[key] = value;
        }

        // 2. Evaluate collection expression via JjEL
        const collection = jjelEval(args.collectionExpr, evalVars);
        if (!Array.isArray(collection)) {
            return {
                success: false,
                command: 'forall',
                message: `forall: collection must be an array, got ${typeof collection}`,
                errors: [{ code: 'FORALL_TYPE_ERROR', message: `Expected array for collection expression '${args.collectionExpr}'` }]
            };
        }

        // 3. Apply 'such that' filter if present
        let items = collection;
        if (args.filterExpr) {
            items = [];
            for (const element of collection) {
                const filterVars: Record<string, JjelValue> = {
                    ...evalVars,
                    [args.variable]: element as JjelValue,
                };
                const pass = jjelEval(args.filterExpr, filterVars);
                if (pass) items.push(element);
            }
        }

        if (items.length === 0) {
            return {
                success: true,
                command: 'forall',
                message: 'forall: 0 elements matched — nothing to do',
                data: { total: 0, successCount: 0, errorCount: 0 }
            };
        }

        // 4. Execute body command for each element
        const executor = getExecutor();
        const results: ExecutionResult[] = [];
        let successCount = 0;
        let errorCount = 0;

        for (const element of items) {
            // Resolve the iteration variable in the body AST
            const elementName = typeof element === 'string'
                ? element
                : ((element as any)?.name ?? String(element));
            const resolvedBody = resolveVariableInBody(args.body, args.variable, elementName);

            // Create child context with the iteration variable available
            const childContext: ExecutionContext = {
                ...context,
                variables: new Map(context.variables),
            };
            childContext.variables.set(args.variable, element);

            const result = await executor.executeAST(resolvedBody, childContext);
            results.push(result);
            if (result.success) successCount++;
            else errorCount++;
        }

        // 5. Build summary
        const total = items.length;
        const message = errorCount === 0
            ? `forall: ${successCount}/${total} executed successfully`
            : `forall: ${successCount} succeeded, ${errorCount} failed (${total} total)`;

        return {
            success: errorCount === 0,
            command: 'forall',
            message,
            data: { total, successCount, errorCount, results },
            errors: errorCount > 0
                ? results.filter(r => !r.success).flatMap(r => r.errors || [])
                : undefined
        };
    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'forall',
            message: `forall error: ${err.message}`,
            errors: [{ code: 'FORALL_ERROR', message: err.message }]
        };
    }
}

// ============================================
// VARIABLE RESOLUTION IN BODY AST
// ============================================

/**
 * Deep-clone the body AST and replace QualifiedName references that match
 * the iteration variable with the actual element name.
 *
 * Example: forall c in classes do rename c to NewName
 *   → body has target.raw == 'c'
 *   → replaced with target.raw == 'Person' (the element's name)
 */
function resolveVariableInBody(
    body: CommandNode,
    variable: string,
    elementName: string
): CommandNode {
    const clone = JSON.parse(JSON.stringify(body)) as CommandNode;
    replaceVariableRefs(clone.args, variable, elementName);
    return clone;
}

/**
 * Recursively walk an object and replace QualifiedName nodes whose
 * raw or first segment matches the variable name.
 */
function replaceVariableRefs(obj: any, variable: string, replacement: string): void {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
        for (const item of obj) replaceVariableRefs(item, variable, replacement);
        return;
    }
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === 'object') {
            // Check for QualifiedName shape: { segments: string[], raw: string }
            if ('raw' in val && 'segments' in val && Array.isArray(val.segments)) {
                if (val.raw === variable) {
                    // Exact match: c → Person
                    val.raw = replacement;
                    val.segments = [replacement];
                } else if (val.segments[0] === variable && val.segments.length > 1) {
                    // Prefix match: c.abstract → Person.abstract (qualified name)
                    val.segments[0] = replacement;
                    val.raw = val.segments.join('::') + (val.member ? '.' + val.member : '');
                }
            }
            replaceVariableRefs(val, variable, replacement);
        }
    }
}
