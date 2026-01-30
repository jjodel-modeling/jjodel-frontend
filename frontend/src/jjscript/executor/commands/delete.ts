/**
 * JjScript DELETE Command Handler
 * Deletes model elements
 */

import {
    DeleteArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject } from '../utils';

import {
    DeleteElementAction,
    TRANSACTION,
    LProject
} from '../../../joiner';

// ============================================
// DELETE COMMAND EXECUTOR
// ============================================

export async function executeDelete(
    args: DeleteArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, cascade, force } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'delete',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot delete element without an active project' }]
            };
        }

        // Resolve the target element
        const element = resolveElement(target, project);
        if (!element) {
            return {
                success: false,
                command: 'delete',
                message: `Element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`,
                    suggestion: 'Check the element name and path'
                }]
            };
        }

        // Check for dependencies if not forcing
        if (!force) {
            const dependencies = checkDependencies(element, project);
            if (dependencies.length > 0) {
                return {
                    success: false,
                    command: 'delete',
                    message: `Cannot delete: element has ${dependencies.length} dependent element(s)`,
                    errors: [{
                        code: 'HAS_DEPENDENCIES',
                        message: `Element is referenced by: ${dependencies.slice(0, 3).join(', ')}${dependencies.length > 3 ? '...' : ''}`,
                        suggestion: "Use 'delete ... force' to delete anyway, or 'delete ... cascade' to delete dependents"
                    }],
                    data: { dependencies }
                };
            }
        }

        // Perform deletion
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Delete element', () => {
                    const elementId = element.id || element;
                    const elementName = element.name || qualifiedNameToString(target);

                    // If cascade, delete all children first
                    if (cascade) {
                        deleteChildren(element);
                    }

                    // Delete the element
                    DeleteElementAction.new(element);

                    resolve({
                        success: true,
                        command: 'delete',
                        message: `Deleted '${elementName}'${cascade ? ' and its children' : ''}`,
                        data: { id: elementId, name: elementName },
                        affectedElements: [elementId],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'delete',
                    message: `Failed to delete: ${(error as Error).message}`,
                    errors: [{ code: 'DELETE_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'delete',
            message: `Failed to delete: ${err.message}`,
            errors: [{ code: 'DELETE_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkDependencies(element: any, project: LProject): string[] {
    const dependencies: string[] = [];

    try {
        // Check if element is referenced by others
        // This would require traversing the model to find references
        // For now, return empty (no dependency check)

        // If it's a class, check for:
        // - References pointing to it
        // - Subclasses extending it

        // If it's an enum, check for:
        // - Attributes using it as type

        // This is a simplified implementation
    } catch {
        // Ignore errors in dependency check
    }

    return dependencies;
}

function deleteChildren(element: any): void {
    try {
        // Delete children based on element type
        if (element.attributes) {
            for (const attr of element.attributes) {
                DeleteElementAction.new(attr);
            }
        }
        if (element.references) {
            for (const ref of element.references) {
                DeleteElementAction.new(ref);
            }
        }
        if (element.operations) {
            for (const op of element.operations) {
                // Delete parameters first
                if (op.parameters) {
                    for (const param of op.parameters) {
                        DeleteElementAction.new(param);
                    }
                }
                DeleteElementAction.new(op);
            }
        }
        if (element.literals) {
            for (const lit of element.literals) {
                DeleteElementAction.new(lit);
            }
        }
        if (element.classifiers) {
            for (const cls of element.classifiers) {
                deleteChildren(cls);
                DeleteElementAction.new(cls);
            }
        }
        if (element.subPackages) {
            for (const pkg of element.subPackages) {
                deleteChildren(pkg);
                DeleteElementAction.new(pkg);
            }
        }
    } catch {
        // Ignore errors in cascade delete
    }
}
