/**
 * JjScript COPY Command Handler
 * Copies elements to a new location
 */

import {
    CopyArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject } from '../utils';

import {
    DClass,
    DAttribute,
    DReference,
    DOperation,
    DParameter,
    DPackage,
    DEnumerator,
    DEnumLiteral,
    CreateElementAction,
    SetFieldAction,
    TRANSACTION,
    LProject
} from '../../../joiner';

// ============================================
// COPY COMMAND EXECUTOR
// ============================================

export async function executeCopy(
    args: CopyArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, to, newName, deep } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'copy',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot copy element without an active project' }]
            };
        }

        // Resolve both elements
        const targetElement = resolveElement(target, project);
        if (!targetElement) {
            return {
                success: false,
                command: 'copy',
                message: `Element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`
                }]
            };
        }

        const toElement = resolveElement(to, project);
        if (!toElement) {
            return {
                success: false,
                command: 'copy',
                message: `Destination not found: ${qualifiedNameToString(to)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find destination '${qualifiedNameToString(to)}'`
                }]
            };
        }

        // Determine the name for the copy
        const copyName = newName || generateCopyName(targetElement.name, toElement);

        // Perform copy
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Copy element', () => {
                    const copiedElement = copyElement(targetElement, toElement, copyName, deep || false);

                    if (copiedElement) {
                        resolve({
                            success: true,
                            command: 'copy',
                            message: `Copied '${targetElement.name}' to '${toElement.name}' as '${copyName}'`,
                            data: {
                                originalId: targetElement.id,
                                copyId: copiedElement.id,
                                name: copyName,
                                destination: toElement.id
                            },
                            affectedElements: [copiedElement.id, toElement.id],
                            undoable: true
                        });
                    } else {
                        resolve({
                            success: false,
                            command: 'copy',
                            message: 'Failed to create copy',
                            errors: [{ code: 'COPY_FAILED', message: 'Could not create copy of element' }]
                        });
                    }
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'copy',
                    message: `Failed to copy: ${(error as Error).message}`,
                    errors: [{ code: 'COPY_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'copy',
            message: `Failed to copy: ${err.message}`,
            errors: [{ code: 'COPY_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateCopyName(originalName: string, container: any): string {
    // Check for existing copies
    const siblings = getSiblings(container);
    const baseName = originalName.replace(/_copy\d*$/, '');

    let copyNum = 1;
    let newName = `${baseName}_copy`;

    while (siblings.some((s: any) => s.name === newName)) {
        copyNum++;
        newName = `${baseName}_copy${copyNum}`;
    }

    return newName;
}

function getSiblings(container: any): any[] {
    const collections = [
        'classifiers',
        'attributes',
        'references',
        'operations',
        'parameters',
        'subPackages',
        'literals'
    ];

    for (const prop of collections) {
        if (Array.isArray(container[prop])) {
            return container[prop];
        }
    }

    return [];
}

function copyElement(source: any, destination: any, newName: string, deep: boolean): any {
    const sourceType = source.className || source.constructor?.name || '';

    let copy: any;

    if (sourceType.includes('Class')) {
        copy = copyClass(source, destination, newName, deep);
    } else if (sourceType.includes('Attribute')) {
        copy = copyAttribute(source, destination, newName);
    } else if (sourceType.includes('Reference')) {
        copy = copyReference(source, destination, newName);
    } else if (sourceType.includes('Operation')) {
        copy = copyOperation(source, destination, newName, deep);
    } else if (sourceType.includes('Package')) {
        copy = copyPackage(source, destination, newName, deep);
    } else if (sourceType.includes('Enum')) {
        copy = copyEnumerator(source, destination, newName, deep);
    } else if (sourceType.includes('Literal')) {
        copy = copyEnumLiteral(source, destination, newName);
    }

    return copy;
}

function copyClass(source: any, destination: any, newName: string, deep: boolean): any {
    const copy = DClass.new(newName);

    // Copy properties
    if (source.abstract) SetFieldAction.new(copy, 'abstract', source.abstract);
    if (source.interface) SetFieldAction.new(copy, 'interface', source.interface);

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);

    // Deep copy: copy attributes, references, operations
    if (deep) {
        if (source.attributes) {
            for (const attr of source.attributes) {
                copyAttribute(attr, copy, attr.name);
            }
        }
        if (source.references) {
            for (const ref of source.references) {
                copyReference(ref, copy, ref.name);
            }
        }
        if (source.operations) {
            for (const op of source.operations) {
                copyOperation(op, copy, op.name, true);
            }
        }
    }

    return copy;
}

function copyAttribute(source: any, destination: any, newName: string): any {
    const copy = DAttribute.new(newName);

    // Copy properties
    if (source.type) SetFieldAction.new(copy, 'type', source.type);
    if (source.lowerBound !== undefined) SetFieldAction.new(copy, 'lowerBound', source.lowerBound);
    if (source.upperBound !== undefined) SetFieldAction.new(copy, 'upperBound', source.upperBound);
    if (source.derived) SetFieldAction.new(copy, 'derived', source.derived);
    if (source.changeable !== undefined) SetFieldAction.new(copy, 'changeable', source.changeable);
    if (source.defaultValueLiteral) SetFieldAction.new(copy, 'defaultValueLiteral', source.defaultValueLiteral);

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);
    return copy;
}

function copyReference(source: any, destination: any, newName: string): any {
    const copy = DReference.new(newName);

    // Copy properties
    if (source.lowerBound !== undefined) SetFieldAction.new(copy as any, 'lowerBound', source.lowerBound, '', false);
    if (source.upperBound !== undefined) SetFieldAction.new(copy as any, 'upperBound', source.upperBound, '', false);
    if (source.containment) SetFieldAction.new(copy as any, 'containment', source.containment, '', false);
    // Note: opposite and type references are not copied as they may not be valid in new context

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);
    return copy;
}

function copyOperation(source: any, destination: any, newName: string, deep: boolean): any {
    const copy = DOperation.new(newName);

    // Copy properties
    if (source.type) SetFieldAction.new(copy as any, 'type', source.type, '', false);

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);

    // Deep copy: copy parameters
    if (deep && source.parameters) {
        for (const param of source.parameters) {
            copyParameter(param, copy, param.name);
        }
    }

    return copy;
}

function copyParameter(source: any, destination: any, newName: string): any {
    const copy = DParameter.new(newName);

    // Copy properties
    if (source.type) SetFieldAction.new(copy as any, 'type', source.type, '', false);

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);
    return copy;
}

function copyPackage(source: any, destination: any, newName: string, deep: boolean): any {
    const copy = DPackage.new(newName);

    // Copy properties
    if (source.uri) SetFieldAction.new(copy as any, 'uri', source.uri, '', false);
    if (source.prefix) SetFieldAction.new(copy as any, 'prefix', source.prefix, '', false);

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);

    // Deep copy: copy classifiers and subpackages
    if (deep) {
        if (source.classifiers) {
            for (const cls of source.classifiers) {
                copyElement(cls, copy, cls.name, true);
            }
        }
        if (source.subPackages) {
            for (const pkg of source.subPackages) {
                copyPackage(pkg, copy, pkg.name, true);
            }
        }
    }

    return copy;
}

function copyEnumerator(source: any, destination: any, newName: string, deep: boolean): any {
    const copy = DEnumerator.new(newName);

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);

    // Deep copy: copy literals
    if (deep && source.literals) {
        for (const lit of source.literals) {
            copyEnumLiteral(lit, copy, lit.name);
        }
    }

    return copy;
}

function copyEnumLiteral(source: any, destination: any, newName: string): any {
    const copy = DEnumLiteral.new(newName);

    // Copy properties
    if (source.value !== undefined) SetFieldAction.new(copy as any, 'value', source.value, '', false);

    // Set parent
    SetFieldAction.new(copy, 'parent', destination.id, undefined, true);

    CreateElementAction.new(copy);
    return copy;
}
