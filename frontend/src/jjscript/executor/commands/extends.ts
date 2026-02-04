/**
 * JjScript EXTENDS Command Handler
 * Sets class inheritance (ChildClass extends ParentClass)
 */

import {
    ExtendsArgs,
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
// EXTENDS COMMAND EXECUTOR
// ============================================

export async function executeExtends(
    args: ExtendsArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { childClass, parentClass } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'extends',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot set inheritance without an active project' }]
            };
        }

        // Get target metamodel for scoped resolution
        const targetMetamodel = getTargetMetamodel(context, project);

        // Resolve the child class
        let childElement = targetMetamodel
            ? resolveElementInMetamodel(childClass, targetMetamodel)
            : null;
        if (!childElement) {
            childElement = resolveElement(childClass, project);
        }

        if (!childElement) {
            return {
                success: false,
                command: 'extends',
                message: `Child class not found: ${qualifiedNameToString(childClass)}`,
                errors: [{
                    code: 'CHILD_NOT_FOUND',
                    message: `Could not find class '${qualifiedNameToString(childClass)}'`
                }]
            };
        }

        // Verify child is a class
        const childClassName = childElement.className || childElement.constructor?.name || '';
        if (!childClassName.includes('Class')) {
            return {
                success: false,
                command: 'extends',
                message: `'${qualifiedNameToString(childClass)}' is not a class`,
                errors: [{
                    code: 'NOT_A_CLASS',
                    message: `Element '${qualifiedNameToString(childClass)}' is a ${childClassName}, not a class`
                }]
            };
        }

        // Resolve the parent class
        let parentElement = targetMetamodel
            ? resolveElementInMetamodel(parentClass, targetMetamodel)
            : null;
        if (!parentElement) {
            parentElement = resolveElement(parentClass, project);
        }

        if (!parentElement) {
            return {
                success: false,
                command: 'extends',
                message: `Parent class not found: ${qualifiedNameToString(parentClass)}`,
                errors: [{
                    code: 'PARENT_NOT_FOUND',
                    message: `Could not find class '${qualifiedNameToString(parentClass)}'`
                }]
            };
        }

        // Verify parent is a class
        const parentClassName = parentElement.className || parentElement.constructor?.name || '';
        if (!parentClassName.includes('Class')) {
            return {
                success: false,
                command: 'extends',
                message: `'${qualifiedNameToString(parentClass)}' is not a class`,
                errors: [{
                    code: 'NOT_A_CLASS',
                    message: `Element '${qualifiedNameToString(parentClass)}' is a ${parentClassName}, not a class`
                }]
            };
        }

        // Check for circular inheritance
        if (wouldCreateCycle(childElement, parentElement)) {
            return {
                success: false,
                command: 'extends',
                message: `Circular inheritance detected: ${childElement.name} cannot extend ${parentElement.name}`,
                errors: [{
                    code: 'CIRCULAR_INHERITANCE',
                    message: `Setting ${childElement.name} to extend ${parentElement.name} would create a circular inheritance chain`
                }]
            };
        }

        // Check if already extends this parent
        const existingExtends = childElement.extends || [];
        if (existingExtends.includes(parentElement.id)) {
            return {
                success: true,
                command: 'extends',
                message: `${childElement.name} already extends ${parentElement.name}`,
                data: {
                    childId: childElement.id,
                    parentId: parentElement.id
                }
            };
        }

        // Set the inheritance using SetFieldAction
        return new Promise((resolve) => {
            try {
                // Use '+=' to add to extends array (supports multiple inheritance in Ecore)
                SetFieldAction.new(childElement, 'extends', parentElement.id, '+=', true);

                resolve({
                    success: true,
                    command: 'extends',
                    message: `Set ${childElement.name} extends ${parentElement.name}`,
                    data: {
                        childId: childElement.id,
                        childName: childElement.name,
                        parentId: parentElement.id,
                        parentName: parentElement.name
                    },
                    affectedElements: [childElement.id],
                    undoable: true
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'extends',
                    message: `Failed to set inheritance: ${(error as Error).message}`,
                    errors: [{ code: 'EXTENDS_ERROR', message: (error as Error).message }]
                });
            }
        });

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'extends',
            message: `Failed to set inheritance: ${err.message}`,
            errors: [{ code: 'EXTENDS_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if setting child to extend parent would create a circular inheritance chain
 */
function wouldCreateCycle(child: any, parent: any): boolean {
    // If parent already extends child (directly or indirectly), we'd have a cycle
    const visited = new Set<string>();

    function checkAncestors(current: any): boolean {
        if (!current) return false;
        if (visited.has(current.id)) return false;
        visited.add(current.id);

        // If we reach the child while traversing parent's ancestors, there's a cycle
        if (current.id === child.id) return true;

        // Check parent's ancestors
        const ancestors = current.extends || [];
        for (const ancestorId of ancestors) {
            // Need to resolve ancestorId to element - for now, just check ID
            if (ancestorId === child.id) return true;
        }

        return false;
    }

    return checkAncestors(parent);
}
