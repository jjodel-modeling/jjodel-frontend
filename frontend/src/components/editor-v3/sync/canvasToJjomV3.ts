/**
 * Editor V3 — Canvas → JjOM write functions.
 *
 * Forked from editor-v2/sync/canvasToJjom.ts and adapted for V3.
 * Each function writes a canvas change to JjOM via SetFieldAction/TRANSACTION.
 * Position/size changes call markCanvasUpdated() for anti-bounce.
 * Data changes (labels, attributes) do NOT use anti-bounce.
 */

import {
    SetFieldAction,
    TRANSACTION,
    DeleteElementAction,
    LPointerTargetable,
    DVertex,
    DEdge,
    DVoidEdge,
    GraphSize,
    DClass,
    DEnumerator,
    DPackage,
    DModel,
    DObject,
    DAttribute,
    DOperation,
    DEnumLiteral,
} from '../../../joiner';
import { markCanvasUpdated, markCanvasUpdatedBatch } from './syncCoordinator';

// ---------------------------------------------------------------------------
// Transaction cleanup utility
// ---------------------------------------------------------------------------

/**
 * The framework's async TRANSACTION leaks 1 transaction depth level per
 * Constructors.persist() call because nested async functions don't fully
 * unwind their BEGIN/END pairs. This helper resets the stuck state so that
 * subsequent .new() calls can dispatch their actions to Redux correctly.
 *
 * Safe to call when: depth > 0, no pending actions (i.e. all prior
 * transactions have completed their work but left the depth counter stuck).
 */
function resetStuckTransaction(): void {
    const t = (window as any).transactionStatus;
    if (t && t.transactionDepthLevel > 0 && t.pendingActions.length === 0) {
        t.transactionDepthLevel = 0;
        t.hasBegun = false;
    }
}

// ---------------------------------------------------------------------------
// Position sync
// ---------------------------------------------------------------------------

/** Write a vertex's new position to JjOM. */
export function syncPositionToJjom(vertexId: string, x: number, y: number): void {
    markCanvasUpdated(vertexId);
    resetStuckTransaction();
    TRANSACTION('EditorV3 drag', () => {
        SetFieldAction.new(vertexId as any, 'x' as any, x, undefined, false);
        SetFieldAction.new(vertexId as any, 'y' as any, y, undefined, false);
    });
}

/** Write multiple vertex positions at once (multi-select drag). */
export function syncPositionBatchToJjom(updates: Array<{ id: string; x: number; y: number }>): void {
    if (updates.length === 0) return;
    markCanvasUpdatedBatch(updates.map(u => u.id));
    resetStuckTransaction();
    TRANSACTION('EditorV3 drag batch', () => {
        for (const { id, x, y } of updates) {
            SetFieldAction.new(id as any, 'x' as any, x, undefined, false);
            SetFieldAction.new(id as any, 'y' as any, y, undefined, false);
        }
    });
}

// ---------------------------------------------------------------------------
// Size sync
// ---------------------------------------------------------------------------

/** Write a vertex's new size to JjOM (after resize). */
export function syncSizeToJjom(vertexId: string, w: number, h: number): void {
    markCanvasUpdated(vertexId);
    resetStuckTransaction();
    TRANSACTION('EditorV3 resize', () => {
        SetFieldAction.new(vertexId as any, 'w' as any, w, undefined, false);
        SetFieldAction.new(vertexId as any, 'h' as any, h, undefined, false);
        SetFieldAction.new(vertexId as any, 'isResized' as any, true, undefined, false);
    });
}

// ---------------------------------------------------------------------------
// Edge creation
// ---------------------------------------------------------------------------

/** Create an inheritance relationship (DEdge) in JjOM. Returns DEdge ID or null. */
export function syncInheritanceEdge(
    sourceVertexId: string,
    targetVertexId: string,
): string | null {
    try {
        const sourceProxy: any = LPointerTargetable.fromPointer(sourceVertexId);
        const targetProxy: any = LPointerTargetable.fromPointer(targetVertexId);
        const sourceClass = sourceProxy?.model;
        const targetClass = targetProxy?.model;

        if (!sourceClass || !targetClass) {
            console.warn('[canvasToJjomV3] Cannot create inheritance: missing model on vertex');
            return null;
        }

        const graphId = sourceProxy?.graph?.id ?? sourceProxy?.__raw?.graph;
        if (!graphId) return null;

        let edgeId: string | null = null;

        resetStuckTransaction();
        TRANSACTION('EditorV3 create inheritance', () => {
            // Add extends relationship
            SetFieldAction.new(sourceClass.id, 'extends', targetClass.id, '+=', true);

            // Create DEdge
            const de = DEdge.new(0, undefined, graphId, graphId, undefined, sourceVertexId, targetVertexId);
            edgeId = de?.id ?? null;
        });

        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create inheritance:', err);
        return null;
    }
}

/** Create a reference edge (DEdge + DReference) in JjOM. Returns DEdge ID or null. */
export function syncReferenceEdge(
    sourceVertexId: string,
    targetVertexId: string,
    name: string = 'newRef',
): string | null {
    try {
        const sourceProxy: any = LPointerTargetable.fromPointer(sourceVertexId);
        const targetProxy: any = LPointerTargetable.fromPointer(targetVertexId);
        const sourceClass = sourceProxy?.model;
        const targetClass = targetProxy?.model;

        if (!sourceClass || !targetClass) {
            console.warn('[canvasToJjomV3] Cannot create reference: missing model on vertex');
            return null;
        }

        const graphId = sourceProxy?.graph?.id ?? sourceProxy?.__raw?.graph;
        if (!graphId) return null;

        let edgeId: string | null = null;

        resetStuckTransaction();
        TRANSACTION('EditorV3 create reference', () => {
            // Create DReference on source class
            const refId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
            // Use the model's action system to add a reference
            SetFieldAction.new(sourceClass.id, 'references', {
                id: refId,
                name,
                type: targetClass.id,
                lowerBound: 0,
                upperBound: -1,
                containment: false,
            }, '+=', true);

            // Create DEdge pointing to the reference
            const de = DEdge.new(0, refId, graphId, graphId, undefined, sourceVertexId, targetVertexId);
            edgeId = de?.id ?? null;
        });

        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create reference:', err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Deletion
// ---------------------------------------------------------------------------

/** Delete a vertex and its associated model element. */
export function syncDeleteVertex(vertexId: string): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 delete vertex', () => {
            DeleteElementAction.new(vertexId);
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to delete vertex:', err);
    }
}

/** Delete an edge. If it's an inheritance edge, also remove the extends relationship. */
export function syncDeleteEdge(edgeId: string, isInheritance: boolean = false): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 delete edge', () => {
            if (isInheritance) {
                const lEdge: any = LPointerTargetable.fromPointer(edgeId);
                const sourceModel = lEdge?.start?.model;
                const targetModel = lEdge?.end?.model;
                if (sourceModel?.id && targetModel?.id) {
                    SetFieldAction.new(sourceModel.id, 'extends', targetModel.id, '-=', true);
                }
            }
            DeleteElementAction.new(edgeId);
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to delete edge:', err);
    }
}

// ---------------------------------------------------------------------------
// Property updates (no anti-bounce — let sync re-transform from JjOM)
// ---------------------------------------------------------------------------

/** Update node label (model element name). */
export function syncNodeLabel(vertexId: string, newName: string): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(vertexId);
        const modelId = lVertex?.model?.id ?? lVertex?.__raw?.model;
        if (!modelId) return;

        resetStuckTransaction();
        TRANSACTION('EditorV3 rename', () => {
            SetFieldAction.new(modelId, 'name', newName, '', false);
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to sync label:', err);
    }
}

/** Toggle abstract flag on a class. */
export function syncClassAbstract(vertexId: string, isAbstract: boolean): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(vertexId);
        const modelId = lVertex?.model?.id ?? lVertex?.__raw?.model;
        if (!modelId) return;

        resetStuckTransaction();
        TRANSACTION('EditorV3 toggle abstract', () => {
            SetFieldAction.new(modelId, 'abstract', isAbstract, '', false);
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to sync abstract:', err);
    }
}

// ---------------------------------------------------------------------------
// Element creation (palette drops)
// ---------------------------------------------------------------------------

/** Create a new DClass + DVertex. Returns vertexId or false. */
export function syncCreateClass(
    graphId: string,
    x: number,
    y: number,
    isAbstract: boolean = false,
): string | false {
    try {
        const lGraph: any = LPointerTargetable.fromPointer(graphId);
        const modelId = lGraph?.model?.id ?? lGraph?.__raw?.model;
        if (!modelId) {
            console.warn('[syncCreateClass] No modelId from graph', graphId);
            return false;
        }

        // Find the default package in the model
        const lModel: any = LPointerTargetable.fromPointer(modelId);
        const packages = lModel?.packages ?? [];
        const pkgId = packages[0]?.id ?? modelId;

        // DClass.new(name, isInterface, isAbstract, isPrimitive, partial, partialDefaultName, father, persist, id)
        resetStuckTransaction();
        const className = `NewClass_${Date.now().toString(36).slice(-4)}`;
        const dc = (DClass as any).new(className, false, isAbstract, false, undefined, undefined, pkgId);
        if (!dc?.id) return false;

        // Create vertex positioned at drop coordinates
        const size = new GraphSize(x, y, 200, 120);
        const dv = DVertex.new(0, dc.id, graphId, graphId, undefined, size);
        return dv?.id ?? false;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create class:', err);
        return false;
    }
}

/** Create a new DEnumerator + DVertex. Returns vertexId or false. */
export function syncCreateEnum(graphId: string, x: number, y: number): string | false {
    try {
        const lGraph: any = LPointerTargetable.fromPointer(graphId);
        const modelId = lGraph?.model?.id ?? lGraph?.__raw?.model;
        if (!modelId) return false;

        const lModel: any = LPointerTargetable.fromPointer(modelId);
        const packages = lModel?.packages ?? [];
        const pkgId = packages[0]?.id ?? modelId;

        // DEnumerator.new(name, father, persist)
        resetStuckTransaction();
        const enumName = `NewEnum_${Date.now().toString(36).slice(-4)}`;
        const de = (DEnumerator as any).new(enumName, pkgId);
        if (!de?.id) return false;

        const size = new GraphSize(x, y, 160, 100);
        const dv = DVertex.new(0, de.id, graphId, graphId, undefined, size);
        return dv?.id ?? false;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create enum:', err);
        return false;
    }
}

/** Create a new DPackage + DVertex. Returns vertexId or false. */
export function syncCreatePackage(graphId: string, x: number, y: number): string | false {
    try {
        const lGraph: any = LPointerTargetable.fromPointer(graphId);
        const modelId = lGraph?.model?.id ?? lGraph?.__raw?.model;
        if (!modelId) return false;

        // DPackage.new(name, uri, prefix, father, persist, fatherType)
        resetStuckTransaction();
        const pkgName = `NewPackage_${Date.now().toString(36).slice(-4)}`;
        const dp = (DPackage as any).new(pkgName, undefined, undefined, modelId, true, DModel);
        if (!dp?.id) return false;

        const size = new GraphSize(x, y, 400, 300);
        const dv = DVertex.new(0, dp.id, graphId, graphId, undefined, size);
        return dv?.id ?? false;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create package:', err);
        return false;
    }
}

/** Create a new DataType (DClass with isPrimitive=true) + DVertex. Returns vertexId or false. */
export function syncCreateDataType(graphId: string, x: number, y: number): string | false {
    try {
        const lGraph: any = LPointerTargetable.fromPointer(graphId);
        const modelId = lGraph?.model?.id ?? lGraph?.__raw?.model;
        if (!modelId) return false;

        const lModel: any = LPointerTargetable.fromPointer(modelId);
        const packages = lModel?.packages ?? [];
        const pkgId = packages[0]?.id ?? modelId;

        // DDataType is abstract, so use DClass with isPrimitive=true
        // DClass.new(name, isInterface, isAbstract, isPrimitive, partial, partialDefaultName, father, persist, id)
        resetStuckTransaction();
        const dtName = `NewDataType_${Date.now().toString(36).slice(-4)}`;
        const dt = (DClass as any).new(dtName, false, false, true, undefined, undefined, pkgId);
        if (!dt?.id) return false;

        const size = new GraphSize(x, y, 140, 60);
        const dv = DVertex.new(0, dt.id, graphId, graphId, undefined, size);
        return dv?.id ?? false;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create datatype:', err);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Attribute CRUD
// ---------------------------------------------------------------------------

/** Add a new attribute to a class. */
export function syncAddAttribute(vertexId: string, name: string = 'newAttr', type: string = 'EString'): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(vertexId);
        const modelId = lVertex?.model?.id ?? lVertex?.__raw?.model;
        if (!modelId) return;

        // No outer TRANSACTION — .new() internally calls Constructors.persist()
        // which wraps in its own async TRANSACTION.
        resetStuckTransaction();
        (DAttribute as any).new(name, type, modelId);
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to add attribute:', err);
    }
}

/** Update an attribute's properties. */
export function syncUpdateAttribute(
    attrId: string,
    updates: { name?: string; type?: string; defaultValue?: string; lowerBound?: number; upperBound?: number },
): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 update attribute', () => {
            if (updates.name !== undefined) {
                SetFieldAction.new(attrId as any, 'name' as any, updates.name, '', false);
            }
            if (updates.type !== undefined) {
                SetFieldAction.new(attrId as any, 'type' as any, updates.type, '', false);
            }
            if (updates.defaultValue !== undefined) {
                SetFieldAction.new(attrId as any, 'default' as any, updates.defaultValue, '', false);
            }
            if (updates.lowerBound !== undefined) {
                SetFieldAction.new(attrId as any, 'lowerBound' as any, updates.lowerBound, '', false);
            }
            if (updates.upperBound !== undefined) {
                SetFieldAction.new(attrId as any, 'upperBound' as any, updates.upperBound, '', false);
            }
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to update attribute:', err);
    }
}

/** Remove an attribute from its owner. */
export function syncRemoveAttribute(attrId: string): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 remove attribute', () => {
            DeleteElementAction.new(attrId);
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to remove attribute:', err);
    }
}

// ---------------------------------------------------------------------------
// Operation CRUD
// ---------------------------------------------------------------------------

/** Add a new operation to a class. */
export function syncAddOperation(vertexId: string, name: string = 'newOp', returnType: string = 'void'): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(vertexId);
        const modelId = lVertex?.model?.id ?? lVertex?.__raw?.model;
        if (!modelId) return;

        // DOperation.new(name, type, exceptions, father, persist)
        // No outer TRANSACTION — .new() handles its own via Constructors.persist()
        resetStuckTransaction();
        (DOperation as any).new(name, returnType, [], modelId);
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to add operation:', err);
    }
}

/** Update an operation's properties. */
export function syncUpdateOperation(
    opId: string,
    updates: { name?: string; returnType?: string },
): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 update operation', () => {
            if (updates.name !== undefined) {
                SetFieldAction.new(opId as any, 'name' as any, updates.name, '', false);
            }
            if (updates.returnType !== undefined) {
                SetFieldAction.new(opId as any, 'type' as any, updates.returnType, '', false);
            }
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to update operation:', err);
    }
}

/** Remove an operation from its owner. */
export function syncRemoveOperation(opId: string): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 remove operation', () => {
            DeleteElementAction.new(opId);
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to remove operation:', err);
    }
}

// ---------------------------------------------------------------------------
// Enum Literal CRUD
// ---------------------------------------------------------------------------

/** Add a new literal to an enum. */
export function syncAddLiteral(vertexId: string, name: string = 'NEW_LITERAL', value?: number): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(vertexId);
        const modelId = lVertex?.model?.id ?? lVertex?.__raw?.model;
        if (!modelId) return;

        // DEnumLiteral.new(name, value, father, persist)
        // No outer TRANSACTION — .new() handles its own via Constructors.persist()
        resetStuckTransaction();
        (DEnumLiteral as any).new(name, value, modelId);
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to add literal:', err);
    }
}

/** Update a literal's properties. */
export function syncUpdateLiteral(
    litId: string,
    updates: { name?: string; value?: number },
): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 update literal', () => {
            if (updates.name !== undefined) {
                SetFieldAction.new(litId as any, 'name' as any, updates.name, '', false);
            }
            if (updates.value !== undefined) {
                SetFieldAction.new(litId as any, 'value' as any, updates.value, '', false);
            }
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to update literal:', err);
    }
}

/** Remove a literal from its owner enum. */
export function syncRemoveLiteral(litId: string): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 remove literal', () => {
            DeleteElementAction.new(litId);
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to remove literal:', err);
    }
}

// ---------------------------------------------------------------------------
// Reference updates
// ---------------------------------------------------------------------------

/** Update a reference's properties (name, bounds, containment, kind). */
export function syncUpdateReference(
    refId: string,
    updates: { name?: string; lowerBound?: number; upperBound?: number; containment?: boolean },
): void {
    try {
        resetStuckTransaction();
        TRANSACTION('EditorV3 update reference', () => {
            if (updates.name !== undefined) {
                SetFieldAction.new(refId as any, 'name' as any, updates.name, '', false);
            }
            if (updates.lowerBound !== undefined) {
                SetFieldAction.new(refId as any, 'lowerBound' as any, updates.lowerBound, '', false);
            }
            if (updates.upperBound !== undefined) {
                SetFieldAction.new(refId as any, 'upperBound' as any, updates.upperBound, '', false);
            }
            if (updates.containment !== undefined) {
                SetFieldAction.new(refId as any, 'containment' as any, updates.containment, '', false);
            }
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to update reference:', err);
    }
}

// ---------------------------------------------------------------------------
// M1: Object instance creation (Phase 5)
// ---------------------------------------------------------------------------

/**
 * Create a new DObject + DVertex for an M1 model instance.
 * Drag a class from the M1 palette → creates an object conforming to that class.
 */
export function syncCreateObject(
    graphId: string,
    metamodelClassId: string,
    x: number,
    y: number,
    objectName?: string,
): string | false {
    try {
        const lGraph: any = LPointerTargetable.fromPointer(graphId);
        const modelId = lGraph?.model?.id ?? lGraph?.__raw?.model;
        if (!modelId) return false;

        const name = objectName || `obj_${Date.now().toString(36).slice(-4)}`;
        resetStuckTransaction();
        const dObject = (DObject as any).new(metamodelClassId, modelId, DModel, name, true);
        if (!dObject?.id) return false;

        const size = new GraphSize(x, y, 200, 100);
        const dv = DVertex.new(0, dObject.id, graphId, graphId, undefined, size);
        return dv?.id ?? false;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create object:', err);
        return false;
    }
}

/**
 * Set a feature value on a DObject (attribute or reference).
 * Uses a small delay for proxy availability after transaction.
 */
export function syncFeatureValue(
    objectVertexId: string,
    featureName: string,
    newValue: string | number | boolean | null,
): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(objectVertexId);
        const lObject = lVertex?.model;
        if (!lObject) return;

        resetStuckTransaction();
        TRANSACTION(`EditorV3 set ${featureName}`, () => {
            // Access via proxy magic getter: $featureName
            const featureProxy = (lObject as any)['$' + featureName];
            if (featureProxy) {
                featureProxy.value = newValue;
            }
        });
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to set feature value:', err);
    }
}

/**
 * Create an instance link between two objects.
 * Adds targetObjectId to the reference feature's values.
 */
export function syncInstanceLink(
    sourceVertexId: string,
    targetVertexId: string,
    referenceName?: string,
): string | null {
    try {
        const sourceProxy: any = LPointerTargetable.fromPointer(sourceVertexId);
        const targetProxy: any = LPointerTargetable.fromPointer(targetVertexId);
        const sourceObject = sourceProxy?.model;
        const targetObject = targetProxy?.model;

        if (!sourceObject || !targetObject) {
            console.warn('[canvasToJjomV3] Cannot create instance link: missing model');
            return null;
        }

        const graphId = sourceProxy?.graph?.id ?? sourceProxy?.__raw?.graph;
        if (!graphId) return null;

        let edgeId: string | null = null;

        resetStuckTransaction();
        TRANSACTION('EditorV3 create instance link', () => {
            // If a reference name is given, set the value
            if (referenceName) {
                const refProxy = (sourceObject as any)['$' + referenceName];
                if (refProxy) {
                    const current = refProxy.values ?? [];
                    refProxy.values = [...current, targetObject.id];
                }
            }

            // Create a visual edge between the vertices
            const de = DEdge.new(0, undefined, graphId, graphId, undefined, sourceVertexId, targetVertexId);
            edgeId = de?.id ?? null;
        });

        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjomV3] Failed to create instance link:', err);
        return null;
    }
}
