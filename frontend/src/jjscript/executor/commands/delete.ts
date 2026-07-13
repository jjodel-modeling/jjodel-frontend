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
    LProject,
    LPointerTargetable,
    store
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

        // Perform deletion. Drop the editor-v2 canvas vertices for this element
        // FIRST: Dummy.get_delete reaches vertices only via LClass.nodes — a
        // classic-editor-only transient map that is empty for editor-v2 — so a
        // class cascade alone leaves the DVertex dangling in graph.subElements
        // and useJjomSync never removes the live ReactFlow node (it only clears
        // on reopen). See deleteCanvasVerticesForModel.
        // Then element.delete() fires the model cascade (children, father's
        // collection, pointedBy cleanup, M1 DValues). Each .delete() wraps its
        // own TRANSACTION — no outer wrapper (see canvasToJjom.syncRemoveAttribute).
        try {
            const elementId = element.id;
            const elementName = element.name || qualifiedNameToString(target);
            deleteCanvasVerticesForModel(elementId);
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

/**
 * Delete the editor-v2 canvas DVertices that render `modelId`, plus their
 * connected edges, via the L-proxy .delete() cascade.
 *
 * Why this is needed: Dummy.get_delete reaches a class's canvas vertices only
 * through LClass.nodes — a classic-editor-only transient map (LModelElement
 * get_nodes, filtered by a live .html DOM ref) that is always empty for
 * editor-v2 — and `case 'model'` in the cascade is a no-op for non-Edge
 * dependents. So deleting a DClass never deletes its editor-v2 DVertex: the
 * vertex id lingers in graph.subElements as a dangling pointer, and
 * useJjomSync's incremental removal (which keys off subElements) never drops
 * the live ReactFlow node — it only disappears on reopen.
 *
 * Deleting each vertex through its own .delete() fires the vertex cascade
 * (Dummy case 'subElements'), removing its id from graph.subElements, which
 * drives useJjomSync's live node removal. Connected edges are deleted the same
 * way so no floating arrows remain. Each .delete() wraps its own TRANSACTION —
 * no outer wrapper (mirrors canvasToJjom.syncDeleteVertex / syncRemoveAttribute).
 *
 * The reverse lookup is by `model === modelId`, so for non-vertex targets
 * (e.g. an attribute) it finds nothing and is a no-op.
 */
function deleteCanvasVerticesForModel(modelId: string): void {
    try {
        const idlookup: any = store.getState().idlookup;
        const vertexIds: string[] = [];
        for (const id in idlookup) {
            const ge = idlookup[id];
            if (ge?.className === 'DVertex' && ge.model === modelId) vertexIds.push(id);
        }

        const deletedEdgeIds = new Set<string>();
        for (const vertexId of vertexIds) {
            const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
            if (!vertexProxy) continue;

            // Delete connected edges first, else they remain as floating arrows
            // (their source/target vertex is gone) — mirrors syncDeleteVertex.
            const graphProxy: any = vertexProxy.graph;
            const allEdges: any[] = graphProxy?.edges ?? [];
            for (const edge of allEdges) {
                const startId = edge?.start?.id ?? edge?.__raw?.start;
                const endId = edge?.end?.id ?? edge?.__raw?.end;
                const edgeId = edge?.id ?? edge?.__raw?.id;
                if ((startId === vertexId || endId === vertexId) && edgeId && !deletedEdgeIds.has(edgeId)) {
                    deletedEdgeIds.add(edgeId);
                    edge?.delete?.();
                }
            }

            vertexProxy.delete();
        }
    } catch (err) {
        console.warn('[JjScript delete] Failed to delete canvas vertices:', err);
    }
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
