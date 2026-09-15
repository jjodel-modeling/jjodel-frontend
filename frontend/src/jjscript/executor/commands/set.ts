/**
 * JjScript SET Command Handler
 * Sets property values on model elements
 */

import {
    SetArgs,
    ExecutionResult,
    ExecutionContext,
    LiteralValue,
    QualifiedName
} from '../../types';
import { resolveElement, resolveTypeTarget, ResolutionKind, QUALIFY_ADVICE } from '../resolvers';
import { qualifiedNameToString, literalValueToString } from '../../parser/grammar';
import { getProject, getTargetMetamodel } from '../utils';
import { executeSetInstance } from './instance';
import { primitiveAttributeType } from './create';

import {
    SetFieldAction,
    TRANSACTION,
    LProject,
    Defaults
} from '../../../joiner';

// ============================================
// SET COMMAND EXECUTOR
// ============================================

export async function executeSet(
    args: SetArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, property, value, operator } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'set',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot set property without an active project' }]
            };
        }

        // M1 routing: in an M1 model editor, 'set' targets instance values (attribute or reference link).
        if (context.level === 'M1') {
            return executeSetInstance(args, context, project);
        }

        // Resolve the target element
        const element = resolveElement(target, project);
        if (!element) {
            return {
                success: false,
                command: 'set',
                message: `Element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`
                }]
            };
        }

        // Validate the property exists
        const propertyInfo = getPropertyInfo(element, property);
        if (!propertyInfo.exists) {
            return {
                success: false,
                command: 'set',
                message: `Unknown property: '${property}'`,
                errors: [{
                    code: 'UNKNOWN_PROPERTY',
                    message: `Element does not have property '${property}'`,
                    suggestion: propertyInfo.suggestion
                        ? `Did you mean '${propertyInfo.suggestion}'?`
                        : `Available properties: ${propertyInfo.available?.slice(0, 5).join(', ')}`
                }]
            };
        }

        // `type` is a pointer to a classifier, and which classifiers are admissible depends
        // on what is being typed -- so it does not go through `convertValue`, whose
        // unrestricted project-wide lookup ends in a string fallback (see `resolveSetType`).
        let convertedValue: any;
        const typeRule = setTypeRuleFor(element, property);
        if (typeRule) {
            const settled = resolveSetType(element, typeRule, value, project, getTargetMetamodel(context, project));
            if (!settled.ok) return settled.error;
            convertedValue = settled.typePointer;
        } else {
            convertedValue = convertValue(value, propertyInfo.type, project);
        }
        const oldValue = element[property];

        // Apply special property transformations (e.g., readonly -> !changeable)
        const transformedValue = transformPropertyValue(property, convertedValue);

        // Apply operator
        let finalValue = transformedValue;
        if (operator === '+=' && Array.isArray(oldValue)) {
            finalValue = [...oldValue, convertedValue];
        } else if (operator === '-=' && Array.isArray(oldValue)) {
            finalValue = oldValue.filter((v: any) => v !== convertedValue);
        }

        // Perform the set operation
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Set property', () => {
                    // Handle special properties
                    const actualProperty = mapPropertyName(property);
                    const isPointer = propertyInfo.isPointer;

                    SetFieldAction.new(element, actualProperty, finalValue, undefined, isPointer);

                    const valueDisplay = isLiteralValue(value)
                        ? literalValueToString(value as LiteralValue)
                        : qualifiedNameToString(value as QualifiedName);

                    resolve({
                        success: true,
                        command: 'set',
                        message: `Set ${element.name}.${property} ${operator || '='} ${valueDisplay}`,
                        data: {
                            id: element.id,
                            property,
                            oldValue,
                            newValue: finalValue
                        },
                        affectedElements: [element.id],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'set',
                    message: `Failed to set property: ${(error as Error).message}`,
                    errors: [{ code: 'SET_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'set',
            message: `Failed to set property: ${err.message}`,
            errors: [{ code: 'SET_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface PropertyInfo {
    exists: boolean;
    type?: string;
    isPointer?: boolean;
    available?: string[];
    suggestion?: string;
}

function getPropertyInfo(element: any, property: string): PropertyInfo {
    // Common properties for all elements
    const commonProps = ['name', 'annotations'];

    // Type-specific properties
    const classProps = ['abstract', 'interface', 'singleton', 'superTypes', 'attributes', 'references', 'operations'];
    const attributeProps = ['type', 'lowerBound', 'upperBound', 'derived', 'changeable', 'transient', 'volatile', 'unsettable', 'iD', 'defaultValueLiteral', 'default'];
    const referenceProps = ['type', 'lowerBound', 'upperBound', 'containment', 'container', 'opposite', 'resolveProxies'];
    const operationProps = ['type', 'parameters', 'exceptions'];
    const packageProps = ['uri', 'prefix', 'classifiers', 'subPackages'];
    const enumProps = ['literals'];
    const literalProps = ['value'];

    // Get available properties based on element type
    let available: string[] = [...commonProps];
    const className = element.className || element.constructor?.name || '';

    if (className.includes('Class')) {
        available = [...available, ...classProps];
    } else if (className.includes('Attribute')) {
        available = [...available, ...attributeProps];
    } else if (className.includes('Reference')) {
        available = [...available, ...referenceProps];
    } else if (className.includes('Operation')) {
        available = [...available, ...operationProps];
    } else if (className.includes('Package')) {
        available = [...available, ...packageProps];
    } else if (className.includes('Enum')) {
        available = [...available, ...enumProps];
    } else if (className.includes('Literal')) {
        available = [...available, ...literalProps];
    }

    // Check if property exists
    const normalizedProp = property.toLowerCase();
    const matchedProp = available.find(p => p.toLowerCase() === normalizedProp);

    if (matchedProp || property in element) {
        // Determine if it's a pointer reference
        const pointerProps = ['type', 'opposite', 'superTypes', 'exceptions'];
        const isPointer = pointerProps.includes(property);

        return {
            exists: true,
            type: typeof element[property],
            isPointer,
            available
        };
    }

    // Find suggestion for typo
    const suggestion = findClosestMatch(property, available);

    return {
        exists: false,
        available,
        suggestion
    };
}

function mapPropertyName(property: string): string {
    // Map user-friendly names to internal names
    const mapping: Record<string, string> = {
        'readonly': 'changeable', // Note: readonly = !changeable
        'default': 'defaultValueLiteral',
        'defaultvalue': 'defaultValueLiteral',
        'lower': 'lowerBound',
        'upper': 'upperBound',
        'id': 'iD',
        // Singleton is stored directly as 'singleton' in Jjodel
    };

    return mapping[property.toLowerCase()] || property;
}

/**
 * Handle special property value transformations
 * For example, 'readonly = true' means 'changeable = false'
 */
function transformPropertyValue(property: string, value: any): any {
    const propLower = property.toLowerCase();

    // 'readonly' is the inverse of 'changeable'
    if (propLower === 'readonly') {
        if (typeof value === 'boolean') {
            return !value;
        }
        if (value && typeof value === 'object' && value.kind === 'boolean') {
            return !value.value;
        }
    }

    return value;
}

/**
 * The `type` clause of `set`, per element being typed.
 *
 * Same table as `create` and for the same reason: it is `LTypedElement.get_validTargets`
 * (`model/logicWrapper/LModelElement.tsx:1340-1346`). It is keyed on the **D-layer**
 * className, which is what an L-proxy reports (CLAUDE.md §3.13) -- a matcher written
 * against 'LAttribute' would never fire and would silently disable the whole branch.
 *
 * `set` reaches `type` on all four: `attributeProps`, `referenceProps` and
 * `operationProps` above all list it, and a DParameter answers `'type' in element`. A
 * single `['enum']` for every one of them would turn `set r.type = Person`, which works
 * today, into an error.
 */
interface SetTypeRule {
    /** The word used in the messages. */
    what: string;
    /** The admissible kinds handed to the resolver. */
    kinds: ResolutionKind[];
    /** Whether a primitive is one of the admissible types. False only for a reference. */
    primitives: boolean;
    /** «Expected a primitive type or an enum.» */
    expected: string;
}

const SET_TYPE_RULES: Record<string, SetTypeRule> = {
    DAttribute: { what: 'attribute', kinds: ['enum'],          primitives: true,  expected: 'a primitive type or an enum' },
    DReference: { what: 'reference', kinds: ['class'],         primitives: false, expected: 'a class' },
    DParameter: { what: 'parameter', kinds: ['class', 'enum'], primitives: true,  expected: 'a primitive type, a class or an enum' },
    DOperation: { what: 'operation', kinds: ['class', 'enum'], primitives: true,  expected: 'a primitive type, a class or an enum' },
};

/**
 * The rule for this `set`, or undefined when the assignment is not a type at all.
 *
 * Deliberately narrow: only the property named `type`, only on the four elements whose
 * `type` is a classifier pointer. Everything else -- `opposite`, `superTypes`,
 * `exceptions`, and `type` on anything else -- keeps the path it has always had.
 */
function setTypeRuleFor(element: any, property: string): SetTypeRule | undefined {
    if (property.toLowerCase() !== 'type') return undefined;
    const className: string = element?.className || element?.constructor?.name || '';
    return SET_TYPE_RULES[className];
}

type SetTypeOutcome =
    | { ok: true; typePointer: string }
    | { ok: false; error: ExecutionResult };

/**
 * Resolve the value of a `set <el>.type = <Name>` to the pointer to write.
 *
 * The same three steps `create` runs (`commands/create.ts`, `resolveTypeClause`): a
 * primitive first where one is admissible, then a classifier of the admissible kinds with
 * the metamodel consulted before the project, then an error.
 *
 * What it replaces: `convertValue` resolved the name project-wide with no kind restriction
 * and, when nothing answered, wrote `qualifiedNameToString(qn)` -- the NAME, as a pointer,
 * with `success: true`. An unknown type, an ambiguity across metamodels and a primitive all
 * ended there, and the resulting pointer resolves to nothing.
 */
function resolveSetType(
    element: any,
    rule: SetTypeRule,
    value: LiteralValue | QualifiedName,
    project: LProject,
    targetMetamodel: any
): SetTypeOutcome {
    const ownerName: string = element?.name || 'unnamed';

    // A quoted string is as much a type name as a bare one; a number or a boolean is not.
    const spelled = isLiteralValue(value)
        ? ((value as LiteralValue).kind === 'string' ? String((value as any).value) : undefined)
        : qualifiedNameToString(value as QualifiedName);
    const qn: QualifiedName | undefined = isLiteralValue(value) ? undefined : (value as QualifiedName);

    // 1. primitive, where the element admits one. `primitiveAttributeType` covers both the
    //    JjScript aliases ('String', 'int') and the raw Ecore spellings ('EString', 'EInt').
    const primitive = spelled ? primitiveAttributeType(spelled) : null;
    if (primitive && rule.primitives) {
        const ptr = (Defaults as any)['Pointer_' + primitive.toUpperCase()];
        if (!ptr) {
            return { ok: false, error: {
                success: false,
                command: 'set',
                message: `Internal error: no pointer registered for primitive type '${primitive}'.`,
                errors: [{ code: 'UNKNOWN_PRIMITIVE_POINTER', message: `Missing Defaults.Pointer_${primitive.toUpperCase()}` }]
            }};
        }
        return { ok: true, typePointer: ptr };
    }

    // 2. a classifier of the admissible kinds, metamodel before project.
    if (qn) {
        const found = resolveTypeTarget(qn, targetMetamodel, project, rule.kinds);
        if (found.element) return { ok: true, typePointer: found.element.id };
        if (found.ambiguousWith && found.ambiguousWith.length > 0) {
            const shown = found.ambiguousWith.join(', ');
            return { ok: false, error: {
                success: false,
                command: 'set',
                message: `Ambiguous type '${qualifiedNameToString(qn)}' for ${rule.what} '${ownerName}': ${shown}. ${QUALIFY_ADVICE}`,
                errors: [{
                    code: 'AMBIGUOUS_TYPE',
                    message: `'${qualifiedNameToString(qn)}' matches more than one admissible type: ${shown}`,
                    suggestion: QUALIFY_ADVICE
                }]
            }};
        }
    }

    // 3. anything else stops the line. A false success is not a working script.
    const shownName = spelled ?? String((value as any)?.value ?? '');
    return { ok: false, error: {
        success: false,
        command: 'set',
        message: `Unknown type '${shownName}' for ${rule.what} '${ownerName}'. Expected ${rule.expected}.`,
        errors: [{
            code: 'UNKNOWN_TYPE',
            message: `'${shownName}' is not ${rule.expected} reachable from this metamodel`,
            suggestion: `Use ${rule.expected}. Qualify as Metamodel::Name if needed.`
        }]
    }};
}

function convertValue(
    value: LiteralValue | QualifiedName,
    targetType: string | undefined,
    project: LProject
): any {
    if (isLiteralValue(value)) {
        const lit = value as LiteralValue;
        switch (lit.kind) {
            case 'null': return null;
            case 'boolean': return lit.value;
            case 'number': return lit.value;
            case 'string': return lit.value;
            case 'array': return lit.values.map(v => convertValue(v, targetType, project));
            case 'enumLiteral': return `${qualifiedNameToString(lit.enum)}::${lit.literal}`;
        }
    }

    // It's a QualifiedName - resolve to element ID
    const qn = value as QualifiedName;
    const resolved = resolveElement(qn, project);
    return resolved?.id || qualifiedNameToString(qn);
}

function isLiteralValue(value: any): value is LiteralValue {
    return value && typeof value === 'object' && 'kind' in value;
}

function findClosestMatch(input: string, possibilities: string[]): string | undefined {
    const inputLower = input.toLowerCase();
    let bestMatch: string | undefined;
    let bestScore = Infinity;

    for (const p of possibilities) {
        const score = levenshtein(inputLower, p.toLowerCase());
        if (score < bestScore && score <= 3) {
            bestScore = score;
            bestMatch = p;
        }
    }

    return bestMatch;
}

function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}
