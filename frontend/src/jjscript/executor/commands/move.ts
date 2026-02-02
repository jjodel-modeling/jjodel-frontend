/**
 * JjScript MOVE Command Handler
 * Moves elements to a different container
 */

import {
    MoveArgs,
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
// MOVE COMMAND EXECUTOR
// ============================================

export async function executeMove(
    args: MoveArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, to } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'move',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot move element without an active project' }]
            };
        }

        // Resolve both elements
        const targetElement = resolveElement(target, project);
        if (!targetElement) {
            return {
                success: false,
                command: 'move',
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
                command: 'move',
                message: `Destination not found: ${qualifiedNameToString(to)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find destination '${qualifiedNameToString(to)}'`
                }]
            };
        }

        // Validate move is allowed
        const validation = validateMove(targetElement, toElement);
        if (!validation.valid) {
            return {
                success: false,
                command: 'move',
                message: validation.reason || 'Invalid move operation',
                errors: [{
                    code: 'INVALID_MOVE',
                    message: validation.reason || 'Cannot move element to specified destination'
                }]
            };
        }

        const oldParent = targetElement.parent;
        const oldParentName = oldParent?.name || 'root';

        // Perform move
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Move element', () => {
                    // Update parent reference
                    SetFieldAction.new(targetElement, 'parent', toElement.id, undefined, true);

                    resolve({
                        success: true,
                        command: 'move',
                        message: `Moved '${targetElement.name}' from '${oldParentName}' to '${toElement.name}'`,
                        data: {
                            id: targetElement.id,
                            from: oldParent?.id,
                            to: toElement.id
                        },
                        affectedElements: [targetElement.id, oldParent?.id, toElement.id].filter(Boolean),
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'move',
                    message: `Failed to move: ${(error as Error).message}`,
                    errors: [{ code: 'MOVE_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'move',
            message: `Failed to move: ${err.message}`,
            errors: [{ code: 'MOVE_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface ValidationResult {
    valid: boolean;
    reason?: string;
}

function validateMove(target: any, destination: any): ValidationResult {
    const targetType = target.className || target.constructor?.name || '';
    const destType = destination.className || destination.constructor?.name || '';

    // Classes can move to packages
    if (targetType.includes('Class') || targetType.includes('Enum')) {
        if (!destType.includes('Package') && !destType.includes('Model')) {
            return {
                valid: false,
                reason: 'Classes and enums can only be moved to packages'
            };
        }
    }

    // Attributes can move to classes
    if (targetType.includes('Attribute')) {
        if (!destType.includes('Class')) {
            return {
                valid: false,
                reason: 'Attributes can only be moved to classes'
            };
        }
    }

    // References can move to classes
    if (targetType.includes('Reference')) {
        if (!destType.includes('Class')) {
            return {
                valid: false,
                reason: 'References can only be moved to classes'
            };
        }
    }

    // Operations can move to classes
    if (targetType.includes('Operation')) {
        if (!destType.includes('Class')) {
            return {
                valid: false,
                reason: 'Operations can only be moved to classes'
            };
        }
    }

    // Parameters can move to operations
    if (targetType.includes('Parameter')) {
        if (!destType.includes('Operation')) {
            return {
                valid: false,
                reason: 'Parameters can only be moved to operations'
            };
        }
    }

    // Packages can move to other packages or models
    if (targetType.includes('Package')) {
        if (!destType.includes('Package') && !destType.includes('Model')) {
            return {
                valid: false,
                reason: 'Packages can only be moved to other packages or models'
            };
        }
    }

    // Enum literals can move to enums
    if (targetType.includes('Literal')) {
        if (!destType.includes('Enum')) {
            return {
                valid: false,
                reason: 'Enum literals can only be moved to enums'
            };
        }
    }

    // Prevent circular containment
    if (isAncestor(target, destination)) {
        return {
            valid: false,
            reason: 'Cannot move element into its own descendant'
        };
    }

    return { valid: true };
}

function isAncestor(possibleAncestor: any, element: any): boolean {
    let current = element;
    while (current) {
        if (current.id === possibleAncestor.id) {
            return true;
        }
        current = current.parent;
    }
    return false;
}
