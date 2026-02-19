/**
 * Canvas → JjOM write functions.
 *
 * Each function writes a canvas change to JjOM via the existing action system
 * (SetFieldAction, TRANSACTION, DeleteElementAction). All functions call
 * markCanvasUpdated() before dispatching so the JjOM→RF sync path skips
 * re-transformation for that element (anti-bounce).
 */

import {
    SetFieldAction,
    TRANSACTION,
    DeleteElementAction,
    LPointerTargetable,
} from '../../../joiner';
import { markCanvasUpdated, markCanvasUpdatedBatch } from './syncState';

// ---------------------------------------------------------------------------
// Position sync
// ---------------------------------------------------------------------------

/**
 * Write a vertex's new position to JjOM.
 * Called on drag end (lazy mode) or during drag (faithful mode).
 */
export function syncPositionToJjom(vertexId: string, x: number, y: number): void {
    markCanvasUpdated(vertexId);
    TRANSACTION('EditorV2 drag', () => {
        SetFieldAction.new(vertexId as any, 'x' as any, x, undefined, false);
        SetFieldAction.new(vertexId as any, 'y' as any, y, undefined, false);
    });
}

/**
 * Write multiple vertex positions at once (e.g. multi-select drag).
 */
export function syncPositionBatchToJjom(updates: Array<{ id: string; x: number; y: number }>): void {
    if (updates.length === 0) return;
    markCanvasUpdatedBatch(updates.map(u => u.id));
    TRANSACTION('EditorV2 drag batch', () => {
        for (const { id, x, y } of updates) {
            SetFieldAction.new(id as any, 'x' as any, x, undefined, false);
            SetFieldAction.new(id as any, 'y' as any, y, undefined, false);
        }
    });
}

// ---------------------------------------------------------------------------
// Size sync
// ---------------------------------------------------------------------------

/**
 * Write a vertex's new size to JjOM (after resize).
 */
export function syncSizeToJjom(vertexId: string, w: number, h: number): void {
    markCanvasUpdated(vertexId);
    TRANSACTION('EditorV2 resize', () => {
        SetFieldAction.new(vertexId as any, 'w' as any, w, undefined, false);
        SetFieldAction.new(vertexId as any, 'h' as any, h, undefined, false);
    });
}

// ---------------------------------------------------------------------------
// Edge creation
// ---------------------------------------------------------------------------

/**
 * Create an inheritance (extends) relationship in JjOM.
 * The child class extends the parent class.
 */
export function syncInheritanceEdge(sourceVertexId: string, targetVertexId: string): boolean {
    try {
        const sourceProxy: any = LPointerTargetable.fromPointer(sourceVertexId);
        const targetProxy: any = LPointerTargetable.fromPointer(targetVertexId);
        const sourceClass = sourceProxy?.model;
        const targetClass = targetProxy?.model;

        if (!sourceClass || !targetClass) {
            console.warn('[canvasToJjom] Cannot create inheritance: missing model on vertex');
            return false;
        }

        // Add target to source's extends list via L-proxy setter
        // which handles validation and TRANSACTION internally
        const currentExtends = (sourceClass.extends ?? []).map((c: any) => c.id ?? c);
        if (currentExtends.includes(targetClass.id)) return true; // already extends
        sourceClass.extends = [...currentExtends, targetClass.id];
        return true;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create inheritance edge:', err);
        return false;
    }
}

/**
 * Create a reference relationship in JjOM.
 */
export function syncReferenceEdge(
    sourceVertexId: string,
    targetVertexId: string,
    name: string = 'newRef',
): boolean {
    try {
        const sourceProxy: any = LPointerTargetable.fromPointer(sourceVertexId);
        const targetProxy: any = LPointerTargetable.fromPointer(targetVertexId);
        const sourceClass = sourceProxy?.model;
        const targetClass = targetProxy?.model;

        if (!sourceClass || !targetClass) {
            console.warn('[canvasToJjom] Cannot create reference: missing model on vertex');
            return false;
        }

        // addReference is available on LClass via L-proxy
        sourceClass.addReference(name, targetClass.id);
        return true;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create reference edge:', err);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Deletion
// ---------------------------------------------------------------------------

/**
 * Delete a vertex and its corresponding model element from JjOM.
 */
export function syncDeleteVertex(vertexId: string): void {
    try {
        markCanvasUpdated(vertexId);
        // Delete the model element first (the graph vertex will be cleaned up)
        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const modelElement = vertexProxy?.model;
        if (modelElement) {
            TRANSACTION('EditorV2 delete node', () => {
                DeleteElementAction.new(modelElement.__raw ?? modelElement);
            });
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to delete vertex:', err);
    }
}

/**
 * Delete an edge from JjOM.
 * For inheritance edges: removes from extends array.
 * For reference edges: deletes the DReference.
 */
export function syncDeleteEdge(edgeId: string, isInheritance: boolean): void {
    try {
        markCanvasUpdated(edgeId);
        const edgeProxy: any = LPointerTargetable.fromPointer(edgeId);
        if (!edgeProxy) return;

        if (isInheritance) {
            // Remove from extends array
            const startVertex: any = edgeProxy.start;
            const endVertex: any = edgeProxy.end;
            const sourceClass = startVertex?.model;
            const targetClass = endVertex?.model;
            if (sourceClass && targetClass) {
                const currentExtends = (sourceClass.extends ?? [])
                    .map((c: any) => c.id ?? c)
                    .filter((id: string) => id !== targetClass.id);
                sourceClass.extends = currentExtends;
            }
        } else {
            // Delete the reference model element
            const refModel = edgeProxy.model;
            if (refModel) {
                TRANSACTION('EditorV2 delete edge', () => {
                    DeleteElementAction.new(refModel.__raw ?? refModel);
                });
            }
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to delete edge:', err);
    }
}

// ---------------------------------------------------------------------------
// Property sync
// ---------------------------------------------------------------------------

/**
 * Sync a node label (class/enum/package name) change to JjOM.
 */
export function syncNodeLabel(vertexId: string, newName: string): void {
    try {
        markCanvasUpdated(vertexId);
        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const model = vertexProxy?.model;
        if (model) {
            model.name = newName; // L-proxy setter handles TRANSACTION
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to sync node label:', err);
    }
}
