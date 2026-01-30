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
