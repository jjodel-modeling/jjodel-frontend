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
import { executeDeleteInstance } from './instance';

import {
    DeleteElementAction,
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

        // M1 routing: 'delete instance X' or any 'delete X' in M1 context targets an instance.
        if (args.elementType === 'instance' || context.level === 'M1') {
            return executeDeleteInstance(args, context, project);
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

        // Type guard: when an explicit element type was given, ensure the
        // resolved element's D-layer className matches. A bare/ambiguous target
        // (e.g. "delete attribute name") can resolve project-wide to the first
        // element of that name — possibly the wrong kind — so reject a mismatch
        // instead of deleting the wrong element. L-proxy .className returns the
        // D-name (DAttribute, DClass, …), so substring matching is correct (CLAUDE.md §3.13).
        if (args.elementType && !matchesElementType(element, args.elementType)) {
            return {
                success: false,
                command: 'delete',
                message: `'${qualifiedNameToString(target)}' is not a ${args.elementType} (found ${element.className})`,
                errors: [{
                    code: 'TYPE_MISMATCH',
                    message: `Resolved element is ${element.className}, expected ${args.elementType}`,
                    suggestion: 'Check the element name or use a qualified name like Class.attribute'
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

        // Perform deletion via L-proxy delete(): fires Dummy.get_delete cascade
        // (children, father's collection, pointedBy cleanup, M1 DValues, and
        // canvas DVertex nodes via lDeleted.nodes + case 'model' edges).
        // It wraps its own TRANSACTION internally — no outer wrapper (see
        // canvasToJjom.syncRemoveAttribute for the canonical pattern).
        try {
            const elementId = element.id;
            const elementName = element.name || qualifiedNameToString(target);
            element.delete();
            return {
                success: true,
                command: 'delete',
                message: `Deleted '${elementName}'`,
                data: { id: elementId, name: elementName },
                affectedElements: [elementId],
                undoable: true
            };
        } catch (error) {
            return {
                success: false,
                command: 'delete',
                message: `Failed to delete: ${(error as Error).message}`,
                errors: [{ code: 'DELETE_ERROR', message: (error as Error).message }]
            };
        }

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

// Substring tokens matched against an L-proxy's D-layer className
// (DAttribute, DClass, …). See CLAUDE.md §3.13: .className returns the
// D-name, never the L-name, so substring matching — not equality — is correct.
const TYPE_TOKENS: Record<string, string> = {
    class: 'Class', interface: 'Class', attribute: 'Attribute',
    reference: 'Reference', operation: 'Operation', package: 'Package',
    enum: 'Enum', enumeration: 'Enum', literal: 'Literal', parameter: 'Parameter'
};

function matchesElementType(element: any, elementType: string): boolean {
    const token = TYPE_TOKENS[elementType.toLowerCase()];
    if (!token) return true; // unknown type string: do not block
    const className = element?.className || '';
    return className.includes(token);
}

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

// TODO: cleanup — superseded by element.delete() cascade (Dummy.get_delete
// iterates lDeleted.children). Retained per CLAUDE.md §2; no longer called.
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
