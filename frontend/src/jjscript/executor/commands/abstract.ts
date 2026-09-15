/**
 * JjScript ABSTRACT Command Handler
 * Toggles the abstract flag on a class (abstract Person)
 */

import {
    AbstractArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement, resolveElementInMetamodel } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject, getTargetMetamodel } from '../utils';

import {
    SetFieldAction
} from '../../../joiner';

// ============================================
// ABSTRACT COMMAND EXECUTOR
// ============================================

export async function executeAbstract(
    args: AbstractArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'abstract',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot toggle abstract without an active project' }]
            };
        }

        // Get target metamodel for scoped resolution
        const targetMetamodel = getTargetMetamodel(context, project);

        // Resolve the target element
        let element = targetMetamodel
            ? resolveElementInMetamodel(target, targetMetamodel)
            : null;
        if (!element) {
            element = resolveElement(target, project);
        }

        if (!element) {
            return {
                success: false,
                command: 'abstract',
                message: `Element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`
                }]
            };
        }

        // Verify it's a class
        const className = element.className || element.constructor?.name || '';
        if (!className.includes('Class')) {
            return {
                success: false,
                command: 'abstract',
                message: `'${qualifiedNameToString(target)}' is not a class`,
                errors: [{
                    code: 'NOT_A_CLASS',
                    message: `Element '${qualifiedNameToString(target)}' is a ${className}, not a class`
                }]
            };
        }

        // Toggle the abstract flag
        const currentValue = !!element.abstract;
        const newValue = !currentValue;

        return new Promise((resolve) => {
            try {
                SetFieldAction.new(element, 'abstract', newValue);

                const state = newValue ? 'abstract' : 'concrete';
                resolve({
                    success: true,
                    command: 'abstract',
                    message: `Class '${element.name}' is now ${state}`,
                    data: {
                        id: element.id,
                        name: element.name,
                        abstract: newValue
                    },
                    affectedElements: [element.id],
                    undoable: true
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'abstract',
                    message: `Failed to toggle abstract: ${(error as Error).message}`,
                    errors: [{ code: 'ABSTRACT_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'abstract',
            message: `Failed to toggle abstract: ${err.message}`,
            errors: [{ code: 'ABSTRACT_ERROR', message: err.message }]
        };
    }
}
