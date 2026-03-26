/**
 * JjScript EVAL Command Handler
 * Evaluates JjEL expressions against the active metamodel context
 */

import {
    EvalArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { getProject, getTargetMetamodel } from '../utils';
import { jjelEval } from '../../../jjel';
import type { JjelValue } from '../../../jjel';

// ============================================
// EVAL COMMAND EXECUTOR
// ============================================

export async function executeEval(
    args: EvalArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { expression } = args;

    try {
        // Build evaluation context from active metamodel
        const variables = buildEvalContext(context);

        // Also include context variables (from let bindings, forall, etc.)
        for (const [key, value] of context.variables) {
            variables[key] = value;
        }

        // Evaluate the JjEL expression
        const result = jjelEval(expression, variables);

        // Detect undefined bare identifiers: if expression is a simple word
        // not in context, the evaluator returns null silently — treat as error
        if (result === null && isBareIdentifier(expression) && !(expression in variables)) {
            return {
                success: false,
                command: 'eval',
                message: `Unknown identifier: '${expression}'`,
                errors: [{
                    code: 'UNDEFINED_VARIABLE',
                    message: `'${expression}' is not a recognized variable or command`,
                    suggestion: 'Available variables: classes, attributes, metamodel, project. Try: help'
                }]
            };
        }

        // Format the result for display
        const formatted = formatJjelResult(result);

        return {
            success: true,
            command: 'eval',
            message: formatted.message,
            data: {
                expression,
                result,
                resultType: formatted.type,
                items: formatted.items
            }
        };
    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'eval',
            message: `JjEL evaluation error: ${err.message}`,
            errors: [{
                code: 'JJEL_ERROR',
                message: err.message,
                suggestion: 'Check expression syntax. Example: forall c in classes : c.name'
            }]
        };
    }
}

// ============================================
// CONTEXT BUILDING
// ============================================

/**
 * Build JjEL evaluation context from the active metamodel.
 * Converts L-layer proxy objects to plain JjelValue objects
 * using shallow conversion to avoid circular reference issues.
 */
export function buildEvalContext(context: ExecutionContext): Record<string, JjelValue> {
    const variables: Record<string, JjelValue> = {};

    const project = getProject(context);
    if (!project) return variables;

    const metamodel = getTargetMetamodel(context, project);
    if (!metamodel) return variables;

    // Convert classes to plain JjEL-compatible objects
    const classes = (metamodel as any).classes || [];
    variables['classes'] = classes.map((cls: any) => shallowClassToJjelValue(cls));

    // Flat list of all attributes across all classes
    const allAttributes: JjelValue[] = [];
    for (const cls of classes) {
        const attrs = cls.attributes || [];
        for (const attr of attrs) {
            allAttributes.push(shallowAttributeToJjelValue(attr, cls.name));
        }
    }
    variables['attributes'] = allAttributes;

    // Metamodel as a plain object
    variables['metamodel'] = {
        name: metamodel.name ?? '',
        isMetamodel: true,
        classes: variables['classes']
    } as JjelValue;

    // Project-level context
    const metamodels = (project as any).metamodels || [];
    variables['project'] = {
        name: project.name ?? '',
        metamodels: metamodels.map((mm: any) => ({
            name: mm.name ?? '',
            isMetamodel: true,
            classes: ((mm as any).classes || []).map((cls: any) => shallowClassToJjelValue(cls))
        }))
    } as JjelValue;

    return variables;
}

/**
 * Convert an L-layer class proxy to a plain JjEL object.
 * Uses shallow conversion to avoid circular proxy loops.
 */
function shallowClassToJjelValue(cls: any): JjelValue {
    const attributes = (cls.attributes || []).map((attr: any) =>
        shallowAttributeToJjelValue(attr, cls.name)
    );
    const references = (cls.references || []).map((ref: any) => ({
        name: ref.name ?? '',
        type: ref.type?.name ?? ref.typeName ?? '',
        containment: ref.containment ?? false,
        multiplicity: ref.upperBound === -1 || ref.upperBound === '*' ? '*' : String(ref.upperBound ?? 1),
        className: cls.name ?? ''
    }));
    const operations = (cls.operations || []).map((op: any) => ({
        name: op.name ?? '',
        returnType: op.type?.name ?? op.typeName ?? 'void',
        className: cls.name ?? ''
    }));

    // Read superclass names
    const superTypes: string[] = [];
    try {
        const supers = cls.superClasses || cls.extend || [];
        for (const s of supers) {
            if (typeof s === 'string') superTypes.push(s);
            else if (s?.name) superTypes.push(s.name);
        }
    } catch { /* proxy access can fail */ }

    return {
        name: cls.name ?? '',
        isAbstract: cls.isAbstract ?? cls.abstract ?? false,
        isInterface: cls.isInterface ?? cls.interface ?? false,
        attributes,
        references,
        operations,
        superTypes,
        attributeCount: attributes.length,
        referenceCount: references.length,
        operationCount: operations.length
    } as JjelValue;
}

/**
 * Convert an L-layer attribute proxy to a plain JjEL object.
 */
function shallowAttributeToJjelValue(attr: any, className: string): JjelValue {
    return {
        name: attr.name ?? '',
        type: attr.type?.name ?? attr.typeName ?? 'String',
        className,
        isDerived: attr.isDerived ?? attr.derived ?? false,
        isId: attr.isId ?? attr.id ?? false,
        multiValued: attr.upperBound === -1 || attr.upperBound === '*',
        defaultValue: attr.defaultValue ?? null
    } as JjelValue;
}

// ============================================
// RESULT FORMATTING
// ============================================

interface FormattedResult {
    message: string;
    type: 'array' | 'primitive' | 'object' | 'null';
    items?: string[];
}

function formatJjelResult(result: JjelValue): FormattedResult {
    if (result === null || result === undefined) {
        return { message: 'null', type: 'null' };
    }

    if (Array.isArray(result)) {
        if (result.length === 0) {
            return { message: '*Empty result (0 items)*', type: 'array', items: [] };
        }

        const items = result.map(item => formatSingleValue(item));
        return {
            message: `**${result.length}** result${result.length !== 1 ? 's' : ''}`,
            type: 'array',
            items
        };
    }

    if (typeof result === 'object') {
        const name = (result as any).name;
        if (name !== undefined) {
            return { message: String(name), type: 'object' };
        }
        return { message: JSON.stringify(result, null, 2), type: 'object' };
    }

    return { message: String(result), type: 'primitive' };
}

/**
 * Check if an expression is a bare identifier (single word, no dots/operators/parens).
 * Used to detect undefined variable references vs valid null-returning expressions.
 */
function isBareIdentifier(expr: string): boolean {
    const trimmed = expr.trim();
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed);
}

function formatSingleValue(value: JjelValue): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `[${value.map(v => formatSingleValue(v)).join(', ')}]`;
    if (typeof value === 'object') {
        const name = (value as any).name;
        if (name !== undefined) return String(name);
        return JSON.stringify(value);
    }
    return String(value);
}
