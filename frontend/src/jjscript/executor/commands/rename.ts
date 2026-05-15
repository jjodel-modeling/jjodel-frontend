/**
 * JjScript RENAME Command Handler
 * Renames model elements
 */

import {
    RenameArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString, isValidIdentifier } from '../../parser/grammar';
import { getProject } from '../utils';
import { executeRenameInstance } from './instance';

import {
    SetFieldAction,
    TRANSACTION,
    LProject
} from '../../../joiner';

// ============================================
// RENAME COMMAND EXECUTOR
// ============================================

export async function executeRename(
    args: RenameArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, newName } = args;

    try {
        // Validate new name
        if (!isValidIdentifier(newName)) {
            return {
                success: false,
                command: 'rename',
                message: `Invalid identifier: '${newName}'`,
                errors: [{
                    code: 'INVALID_NAME',
                    message: 'Name must start with a letter or underscore and contain only letters, numbers, and underscores',
                    suggestion: `Try a name like '${newName.replace(/[^a-zA-Z0-9_]/g, '_')}'`
                }]
            };
        }

        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'rename',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot rename element without an active project' }]
            };
        }

        // M1 routing: 'rename instance X' or any 'rename X' in M1 context targets an instance.
        if (args.elementType === 'instance' || context.level === 'M1') {
            return executeRenameInstance(args, context, project);
        }

        // Resolve the target element
        const element = resolveElement(target, project);
        if (!element) {
            return {
                success: false,
                command: 'rename',
                message: `Element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`
                }]
            };
        }

        const oldName = element.name;

        // Check for name conflicts
        const conflict = checkNameConflict(element, newName, project);
        if (conflict) {
            return {
                success: false,
                command: 'rename',
                message: `Name conflict: '${newName}' already exists`,
                errors: [{
                    code: 'NAME_CONFLICT',
                    message: `An element named '${newName}' already exists in the same scope`,
                    suggestion: 'Choose a different name'
                }]
            };
        }

        // Perform rename
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Rename element', () => {
                    SetFieldAction.new(element, 'name', newName);

                    resolve({
                        success: true,
                        command: 'rename',
                        message: `Renamed '${oldName}' to '${newName}'`,
                        data: {
                            id: element.id,
                            oldName,
                            newName
                        },
                        affectedElements: [element.id],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'rename',
                    message: `Failed to rename: ${(error as Error).message}`,
                    errors: [{ code: 'RENAME_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'rename',
            message: `Failed to rename: ${err.message}`,
            errors: [{ code: 'RENAME_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkNameConflict(element: any, newName: string, project: LProject): boolean {
    try {
        // Get siblings (elements in the same container)
        const parent = element.parent;
        if (!parent) return false;

        // Check based on element type
        const className = element.className || element.constructor?.name;

        let siblings: any[] = [];
        if (className?.includes('Class') || className?.includes('Enum')) {
            siblings = parent.classifiers || [];
        } else if (className?.includes('Attribute')) {
            siblings = parent.attributes || [];
        } else if (className?.includes('Reference')) {
            siblings = parent.references || [];
        } else if (className?.includes('Operation')) {
            siblings = parent.operations || [];
        } else if (className?.includes('Parameter')) {
            siblings = parent.parameters || [];
        } else if (className?.includes('Package')) {
            siblings = parent.subPackages || [];
        } else if (className?.includes('Literal')) {
            siblings = parent.literals || [];
        }

        // Check for conflict (exclude self)
        return siblings.some(s =>
            s.id !== element.id &&
            s.name?.toLowerCase() === newName.toLowerCase()
        );
    } catch {
        return false;
    }
}
