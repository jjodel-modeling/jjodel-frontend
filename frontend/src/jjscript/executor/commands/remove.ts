/**
 * JjScript REMOVE Command Handler
 * Removes elements from collections
 */

import {
    RemoveArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject } from '../utils';

import {
    SetFieldAction,
    TRANSACTION,
    LProject
} from '../../../joiner';

// ============================================
// REMOVE COMMAND EXECUTOR
// ============================================

export async function executeRemove(
    args: RemoveArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, from } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'remove',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot remove element without an active project' }]
            };
        }

        // Special case: "remove extends from ChildClass" - clear all inheritance
        if (target.segments.length === 1 && target.segments[0] === '__extends__') {
            return executeRemoveExtends(from, project);
        }

        // Resolve both elements
        const targetElement = resolveElement(target, project);
        if (!targetElement) {
            return {
                success: false,
                command: 'remove',
                message: `Target element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`
                }]
            };
        }

        const fromElement = resolveElement(from, project);
        if (!fromElement) {
            return {
                success: false,
                command: 'remove',
                message: `Container not found: ${qualifiedNameToString(from)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find container '${qualifiedNameToString(from)}'`
                }]
            };
        }

        // Find which collection contains the target
        const collectionInfo = findContainingCollection(targetElement, fromElement);
        if (!collectionInfo) {
            return {
                success: false,
                command: 'remove',
                message: `'${qualifiedNameToString(target)}' is not in '${qualifiedNameToString(from)}'`,
                errors: [{
                    code: 'NOT_IN_COLLECTION',
                    message: 'Element is not contained in the specified container'
                }]
            };
        }

        // Perform removal
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Remove from collection', () => {
                    SetFieldAction.new(
                        fromElement,
                        collectionInfo.property,
                        targetElement.id,
                        '-=',
                        true
                    );

                    resolve({
                        success: true,
                        command: 'remove',
                        message: `Removed '${targetElement.name}' from '${fromElement.name}.${collectionInfo.property}'`,
                        data: {
                            removed: targetElement.id,
                            from: fromElement.id,
                            property: collectionInfo.property
                        },
                        affectedElements: [targetElement.id, fromElement.id],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'remove',
                    message: `Failed to remove: ${(error as Error).message}`,
                    errors: [{ code: 'REMOVE_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'remove',
            message: `Failed to remove: ${err.message}`,
            errors: [{ code: 'REMOVE_ERROR', message: err.message }]
        };
    }
}

// ============================================
// REMOVE EXTENDS (CLEAR INHERITANCE)
// ============================================

async function executeRemoveExtends(
    classRef: import('../../types').QualifiedName,
    project: LProject
): Promise<ExecutionResult> {
    const classElement = resolveElement(classRef, project);

    if (!classElement) {
        return {
            success: false,
            command: 'remove',
            message: `Class not found: ${qualifiedNameToString(classRef)}`,
            errors: [{
                code: 'CLASS_NOT_FOUND',
                message: `Could not find class '${qualifiedNameToString(classRef)}'`
            }]
        };
    }

    // Verify it's a class
    const className = classElement.className || classElement.constructor?.name || '';
    if (!className.includes('Class')) {
        return {
            success: false,
            command: 'remove',
            message: `'${qualifiedNameToString(classRef)}' is not a class`,
            errors: [{
                code: 'NOT_A_CLASS',
                message: `Cannot remove extends from non-class element`
            }]
        };
    }

    // Check if class has any extends
    const currentExtends = classElement.extends || [];
    if (currentExtends.length === 0) {
        return {
            success: true,
            command: 'remove',
            message: `Class '${classElement.name}' has no superclasses`,
            data: {
                classId: classElement.id,
                className: classElement.name,
                removedCount: 0
            }
        };
    }

    // Remove all extends
    return new Promise((resolve) => {
        try {
            TRANSACTION('JjScript: Remove all extends', () => {
                // Set extends to empty array
                SetFieldAction.new(classElement, 'extends', [], '=', false);

                resolve({
                    success: true,
                    command: 'remove',
                    message: `Removed all superclasses from '${classElement.name}' (${currentExtends.length} removed)`,
                    data: {
                        classId: classElement.id,
                        className: classElement.name,
                        removedCount: currentExtends.length,
                        previousExtends: currentExtends
                    },
                    affectedElements: [classElement.id],
                    undoable: true
                });
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'remove',
                message: `Failed to remove extends: ${(error as Error).message}`,
                errors: [{ code: 'REMOVE_EXTENDS_ERROR', message: (error as Error).message }]
            });
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface CollectionInfo {
    property: string;
    index: number;
}

function findContainingCollection(target: any, container: any): CollectionInfo | null {
    const collections = [
        'attributes',
        'references',
        'operations',
        'parameters',
        'classifiers',
        'subPackages',
        'literals',
        'superTypes',
        'exceptions'
    ];

    for (const prop of collections) {
        const collection = container[prop];
        if (Array.isArray(collection)) {
            const index = collection.findIndex((item: any) =>
                item?.id === target.id || item === target.id
            );
            if (index >= 0) {
                return { property: prop, index };
            }
        }
    }

    return null;
}
