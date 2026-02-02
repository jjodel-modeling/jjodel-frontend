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
import { resolveElement } from '../resolvers';
import { qualifiedNameToString, literalValueToString } from '../../parser/grammar';
import { getProject } from '../utils';

import {
    SetFieldAction,
    TRANSACTION,
    LProject
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

        // Convert value to appropriate type
        const convertedValue = convertValue(value, propertyInfo.type, project);
        const oldValue = element[property];

        // Apply operator
        let finalValue = convertedValue;
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
    const classProps = ['abstract', 'interface', 'superTypes', 'attributes', 'references', 'operations'];
    const attributeProps = ['type', 'lowerBound', 'upperBound', 'derived', 'changeable', 'transient', 'volatile', 'unsettable', 'iD', 'defaultValueLiteral'];
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
        'lower': 'lowerBound',
        'upper': 'upperBound',
        'id': 'iD',
    };

    return mapping[property.toLowerCase()] || property;
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
