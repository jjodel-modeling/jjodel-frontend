/**
 * Canvas → JjOM write functions.
 *
 * Each function writes a canvas change to JjOM via the existing action system
 * (SetFieldAction, TRANSACTION, DeleteElementAction). All functions call
 * markCanvasUpdated() before dispatching so the JjOM→RF sync path skips
 * re-transformation during drag/resize (position/size changes only).
 * Data changes (attributes, labels, etc.) do NOT use anti-bounce — they
 * let the sync re-transform from JjOM so the cache stays fresh.
 * re-transformation for that element (anti-bounce).
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
    store,
} from '../../../joiner';
import { markCanvasUpdated, markCanvasUpdatedBatch, setEdgeRefId } from './syncState';

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
 * Create an inheritance relationship in JjOM AND its graph edge (DEdge).
 * Both operations are wrapped in a single TRANSACTION to prevent
 * useJjomSync from firing between extends assignment and DEdge creation.
 * Returns the DEdge ID on success, null on failure.
 */
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
            console.warn('[canvasToJjom] Cannot create inheritance: missing model on vertex');
            return null;
        }

        const graphId = sourceProxy?.graph?.id ?? sourceProxy?.__raw?.graph;
        if (!graphId) {
            console.warn('[canvasToJjom] Cannot find graphId from source vertex');
            return null;
        }

        const currentExtends = (sourceClass.extends ?? []).map((c: any) => c.id ?? c);
        if (currentExtends.includes(targetClass.id)) return null; // already extends

        let edgeId: string | null = null;

        TRANSACTION('EditorV2 create inheritance edge', () => {
            sourceClass.extends = [...currentExtends, targetClass.id];

            const dEdge = DVoidEdge.new2(
                undefined,
                graphId,
                graphId,
                undefined,
                sourceVertexId,
                targetVertexId,
                (d: DEdge) => { d.isExtend = true; },
            );
            edgeId = dEdge.id;
        });

        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create inheritance edge:', err);
        return null;
    }
}

/**
 * Create a reference relationship in JjOM AND its graph edge (DEdge).
 * Both operations are wrapped in a single TRANSACTION to prevent
 * useJjomSync from firing between addReference and DEdge creation.
 * Returns the DEdge ID on success, null on failure.
 */
export function syncReferenceEdge(
    sourceVertexId: string,
    targetVertexId: string,
    name: string = 'newRef',
    kind: string = 'association',
): string | null {
    try {
        const sourceProxy: any = LPointerTargetable.fromPointer(sourceVertexId);
        const targetProxy: any = LPointerTargetable.fromPointer(targetVertexId);
        const sourceClass = sourceProxy?.model;
        const targetClass = targetProxy?.model;

        if (!sourceClass || !targetClass) {
            console.warn('[canvasToJjom] Cannot create reference: missing model on vertex');
            return null;
        }

        const graphId = sourceProxy?.graph?.id ?? sourceProxy?.__raw?.graph;
        if (!graphId) {
            console.warn('[canvasToJjom] Cannot find graphId from source vertex');
            return null;
        }

        let edgeId: string | null = null;
        let refIdOuter: string | undefined;

        TRANSACTION('EditorV2 create reference edge', () => {
            // 1. Log della signature di addReference
            console.log('[DEBUG] addReference function:', sourceClass.addReference?.toString?.()?.slice(0, 300));

            // 2. Creazione
            const lRef = sourceClass.addReference(name, targetClass.id);
            const refId = lRef?.id ?? lRef;
            refIdOuter = refId;

            // 3. Dump completo PRIMA dei nostri fix
            const rawRef = store.getState()?.idlookup?.[refId] as any;
            console.log('[DEBUG] DReference raw BEFORE fix:', JSON.stringify({
                id: rawRef?.id,
                type: rawRef?.type,
                father: rawRef?.father,
                upperBound: rawRef?.upperBound,
            }, null, 2));

            // 4. Tenta il fix
            SetFieldAction.new(refId as any, 'type' as any, targetClass.id, undefined, false);

            // 5. Dump DOPO il fix
            const rawRefAfter = store.getState()?.idlookup?.[refId] as any;
            console.log('[DEBUG] DReference raw AFTER fix:', JSON.stringify({
                type: rawRefAfter?.type,
                typeChanged: rawRefAfter?.type !== rawRef?.type,
                targetClassId: targetClass.id,
            }, null, 2));

            SetFieldAction.new(refId as any, 'upperBound' as any, -1, undefined, false);

            // Set kind on the DReference if not association
            if (refId && kind !== 'association') {
                const lRefKind: any = LPointerTargetable.fromPointer(refId);
                if (lRefKind) {
                    if (kind === 'composition') {
                        lRefKind.composition = true;
                    } else if (kind === 'aggregation') {
                        lRefKind.aggregation = true;
                    }
                }
            }

            // 2. Create DEdge in the graph
            const dEdge = DVoidEdge.new2(
                refId ?? undefined,
                graphId,
                graphId,
                undefined,
                sourceVertexId,
                targetVertexId,
                (d: DEdge) => { d.isReference = true; },
            );
            edgeId = dEdge.id;

            if (edgeId && refId) {
                setEdgeRefId(edgeId, refId);
            }
        });

        // Fix: type viene sovrascritto dal pending init, setTimeout aspetta che finisca
        if (refIdOuter) {
            const capturedRefId = refIdOuter;
            const capturedTargetId = targetClass.id;
            setTimeout(() => {
                const lRef: any = LPointerTargetable.fromPointer(capturedRefId);
                if (lRef) {
                    lRef.type = capturedTargetId;
                    lRef.upperBound = -1;
                }
            }, 0);
        }

        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create reference edge:', err);
        return null;
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
        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        if (!vertexProxy) return;

        // Find and delete all connected DEdges in the same graph first.
        // Without this, orphan edges remain in graph.subElements and the
        // sync re-adds them as floating arrows.
        const graphProxy: any = vertexProxy.graph;
        if (graphProxy) {
            const allEdges: any[] = graphProxy.edges ?? [];
            const connectedEdges = allEdges.filter((e: any) => {
                const startId = e?.start?.id ?? e?.__raw?.start;
                const endId = e?.end?.id ?? e?.__raw?.end;
                return startId === vertexId || endId === vertexId;
            });
            if (connectedEdges.length > 0) {
                TRANSACTION('EditorV2 delete connected edges', () => {
                    for (const edge of connectedEdges) {
                        // Clean up inheritance extends arrays
                        const startVertex: any = edge.start;
                        const endVertex: any = edge.end;
                        if (edge.isExtend && startVertex?.model && endVertex?.model) {
                            const sourceClass = startVertex.model;
                            const targetClass = endVertex.model;
                            const currentExtends = (sourceClass.extends ?? [])
                                .map((c: any) => c.id ?? c)
                                .filter((id: string) => id !== targetClass.id);
                            sourceClass.extends = currentExtends;
                        }
                        DeleteElementAction.new(edge.__raw ?? edge);
                    }
                });
            }
        }

        // Delete the model element (DClass/DEnum)
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

        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const model = vertexProxy?.model;
        if (model) {
            model.name = newName; // L-proxy setter handles TRANSACTION
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to sync node label:', err);
    }
}

// ---------------------------------------------------------------------------
// Class: isAbstract
// ---------------------------------------------------------------------------

export function syncClassAbstract(vertexId: string, isAbstract: boolean): void {
    try {

        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const lClass = vertexProxy?.model;
        if (lClass) {
            lClass.abstract = isAbstract;
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to sync abstract:', err);
    }
}

// ---------------------------------------------------------------------------
// Attributes CRUD
// ---------------------------------------------------------------------------

export function syncAddAttribute(vertexId: string): void {
    try {

        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const lClass = vertexProxy?.model;
        if (lClass) {
            lClass.addAttribute();
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to add attribute:', err);
    }
}

export function syncUpdateAttribute(
    attrId: string,
    field: string,
    value: string | number,
    _vertexId: string,
): void {
    try {
        // Don't markCanvasUpdated here — the sync should re-transform this
        // vertex from JjOM so the cache stays fresh. The local setNodes()
        // in ClassNode provides immediate feedback; the sync confirms it.
        const lAttr: any = LPointerTargetable.fromPointer(attrId);
        if (lAttr) {
            (lAttr as any)[field] = value;
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to update attribute:', err);
    }
}

/**
 * Update a DReference property by its ID — same pattern as syncUpdateAttribute.
 * The refId is the JjOM DReference ID, obtained from the edge registry or data.reference.id.
 */
export function syncUpdateReference(
    refId: string,
    field: string,
    value: string | number | boolean,
): void {
    try {
        const lRef: any = LPointerTargetable.fromPointer(refId);
        console.log('[syncUpdateReference] DIAG:', {
            refId,
            field,
            value,
            found: !!lRef,
            currentName: lRef?.name,
            className: lRef?.className ?? lRef?.__raw?.className,
        });
        if (lRef) {
            (lRef as any)[field] = value;
            console.log('[syncUpdateReference] AFTER write:', { field, newValue: (lRef as any)[field] });
        } else {
            console.warn('[canvasToJjom] syncUpdateReference: ref not found:', refId);
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to update reference:', err);
    }
}

export function syncRemoveAttribute(attrId: string, _vertexId: string): void {
    try {
        const lAttr: any = LPointerTargetable.fromPointer(attrId);
        if (lAttr) {
            TRANSACTION('EditorV2 remove attribute', () => {
                DeleteElementAction.new(lAttr.__raw ?? lAttr);
            });
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to remove attribute:', err);
    }
}

// ---------------------------------------------------------------------------
// Operations CRUD
// ---------------------------------------------------------------------------

export function syncAddOperation(vertexId: string): void {
    try {

        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const lClass = vertexProxy?.model;
        if (lClass) {
            lClass.addOperation();
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to add operation:', err);
    }
}

export function syncUpdateOperation(
    opId: string,
    field: string,
    value: string | number,
    vertexId: string,
): void {
    try {

        const lOp: any = LPointerTargetable.fromPointer(opId);
        if (lOp) {
            (lOp as any)[field] = value;
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to update operation:', err);
    }
}

export function syncRemoveOperation(opId: string, vertexId: string): void {
    try {

        const lOp: any = LPointerTargetable.fromPointer(opId);
        if (lOp) {
            TRANSACTION('EditorV2 remove operation', () => {
                DeleteElementAction.new(lOp.__raw ?? lOp);
            });
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to remove operation:', err);
    }
}

// ---------------------------------------------------------------------------
// Enum Literals CRUD
// ---------------------------------------------------------------------------

export function syncAddEnumLiteral(vertexId: string): void {
    try {

        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const lEnum = vertexProxy?.model;
        if (lEnum) {
            const literals = lEnum.literals ?? [];
            const nextVal = literals.length > 0
                ? Math.max(...literals.map((l: any) => l.value ?? 0)) + 1
                : 0;
            lEnum.addLiteral(undefined, nextVal);
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to add enum literal:', err);
    }
}

export function syncUpdateEnumLiteral(
    litId: string,
    field: string,
    value: string | number,
    vertexId: string,
): void {
    try {

        const lLit: any = LPointerTargetable.fromPointer(litId);
        if (lLit) {
            (lLit as any)[field] = value;
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to update enum literal:', err);
    }
}

export function syncRemoveEnumLiteral(litId: string, vertexId: string): void {
    try {

        const lLit: any = LPointerTargetable.fromPointer(litId);
        if (lLit) {
            TRANSACTION('EditorV2 remove literal', () => {
                DeleteElementAction.new(lLit.__raw ?? lLit);
            });
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to remove enum literal:', err);
    }
}

// ---------------------------------------------------------------------------
// Edge Reference Properties
// ---------------------------------------------------------------------------

/**
 * Update a property on the DReference linked to a DEdge.
 * @param refId - optional direct DReference ID (bypasses edge.model lookup)
 */
export function syncEdgeRefProperty(
    edgeId: string,
    field: string,
    value: string | number | boolean,
    refId?: string,
): void {
    try {
        console.log('[DEBUG syncEdgeRefProperty] called with:', { edgeId, field, value, refId });
        // Try direct refId first (most reliable)
        if (refId) {
            const lRef: any = LPointerTargetable.fromPointer(refId);
            console.log('[DEBUG syncEdgeRefProperty] direct refId lookup:', { refId, found: !!lRef, name: lRef?.name });
            if (lRef) {
                (lRef as any)[field] = value;
                console.log('[DEBUG syncEdgeRefProperty] wrote via direct refId, verify:', lRef[field]);
                return;
            }
        }

        // Fall back to edge.model
        const edgeProxy: any = LPointerTargetable.fromPointer(edgeId);
        console.log('[DEBUG syncEdgeRefProperty] lEdge resolved:', {
            found: !!edgeProxy,
            hasModel: !!edgeProxy?.model,
            modelName: edgeProxy?.model?.name,
            modelId: edgeProxy?.model?.id,
        });
        if (!edgeProxy) {
            console.warn('[canvasToJjom] syncEdgeRefProperty: edge not found:', edgeId);
            return;
        }
        const lRef = edgeProxy?.model;
        if (lRef) {
            (lRef as any)[field] = value;
            console.log('[DEBUG syncEdgeRefProperty] wrote via edge.model, verify:', lRef[field]);
            return;
        }

        // Last resort: find via source class references
        console.warn('[canvasToJjom] syncEdgeRefProperty: no model, fallback via source class');
        const startVertex: any = edgeProxy.start;
        const sourceClass = startVertex?.model;
        if (sourceClass) {
            const refs: any[] = sourceClass.references ?? [];
            const endVertex: any = edgeProxy.end;
            const targetClassId = endVertex?.model?.id;
            const matchingRef = refs.find((r: any) =>
                (r.type?.id ?? r.__raw?.type) === targetClassId
            );
            if (matchingRef) {
                (matchingRef as any)[field] = value;
            }
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to sync edge ref property:', err);
    }
}

export function syncEdgeRefKind(edgeId: string, kind: string): void {
    try {
        const edgeProxy: any = LPointerTargetable.fromPointer(edgeId);
        if (!edgeProxy) return;

        let lRef = edgeProxy?.model;

        // Fallback: find reference through source class if model link is missing
        if (!lRef) {
            const startVertex: any = edgeProxy.start;
            const endVertex: any = edgeProxy.end;
            const sourceClass = startVertex?.model;
            const targetClassId = endVertex?.model?.id;
            if (sourceClass && targetClassId) {
                const refs: any[] = sourceClass.references ?? [];
                lRef = refs.find((r: any) =>
                    (r.type?.id ?? r.__raw?.type) === targetClassId
                );
                // Fix the model link for future operations
                if (lRef?.id) {
                    SetFieldAction.new(edgeId as any, 'model' as any, lRef.id, undefined, false);
                }
            }
        }

        if (lRef) {
            if (kind === 'composition') {
                lRef.composition = true;
            } else if (kind === 'aggregation') {
                lRef.aggregation = true;
            } else {
                lRef.composition = false;
                lRef.aggregation = false;
            }
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to sync edge ref kind:', err);
    }
}

// ---------------------------------------------------------------------------
// Element Creation (palette drop → JjOM)
// ---------------------------------------------------------------------------

/**
 * Resolve the LModel from a graphId.
 * The DGraph points to a DModel via graph.model; we need the LModel
 * to call addChild().
 */
function resolveModelFromGraph(graphId: string): any | null {
    try {
        const lGraph: any = LPointerTargetable.fromPointer(graphId);
        if (!lGraph) return null;
        // lGraph.model is the LModel (or its ID)
        const model = lGraph.model;
        if (!model) return null;
        // If model is already an L-proxy, return it directly
        if (typeof model === 'object' && model.id) return model;
        // If it's a string (pointer), resolve it
        if (typeof model === 'string') {
            return LPointerTargetable.fromPointer(model);
        }
        return null;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to resolve model from graph:', err);
        return null;
    }
}

/**
 * Safely call addChild, which may return a function or an element directly.
 * Pattern from ToolBar.tsx: try calling as function, catch means it's the element.
 */
function safeAddChild(lModel: any, childType: string): any | null {
    const d = lModel.addChild(childType);
    if (!d) return null;
    try {
        return (d as any)();
    } catch {
        return d;
    }
}

/**
 * Create a new class in JjOM and position its vertex on the graph.
 * Returns true if creation succeeded.
 */
export function syncCreateClass(
    graphId: string,
    x: number,
    y: number,
    isAbstract: boolean = false,
): string | false {
    try {
        const lModel = resolveModelFromGraph(graphId);
        if (!lModel) {
            console.warn('[canvasToJjom] Cannot create class: model not found for graph', graphId);
            return false;
        }

        const lClass = safeAddChild(lModel, 'class');
        if (!lClass) {
            console.warn('[canvasToJjom] addChild("class") returned null');
            return false;
        }

        const classId = lClass.id ?? lClass;

        // Set abstract if needed
        if (isAbstract && typeof lClass === 'object') {
            try { lClass.abstract = true; } catch { /* ignore */ }
        }

        // Create the DVertex positioned at drop coordinates
        const size = new GraphSize(x, y, 140, 40);
        const dv = DVertex.new(0, classId, graphId, graphId, undefined, size);
        const vertexId = dv?.id;

        return vertexId || false;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create class:', err);
        return false;
    }
}

/**
 * Create a new enum in JjOM and position its vertex on the graph.
 */
export function syncCreateEnum(
    graphId: string,
    x: number,
    y: number,
): string | false {
    try {
        const lModel = resolveModelFromGraph(graphId);
        if (!lModel) {
            console.warn('[canvasToJjom] Cannot create enum: model not found for graph', graphId);
            return false;
        }

        const lEnum = safeAddChild(lModel, 'enum');
        if (!lEnum) {
            console.warn('[canvasToJjom] addChild("enum") returned null');
            return false;
        }

        const enumId = lEnum.id ?? lEnum;

        const size = new GraphSize(x, y, 140, 40);
        const dv = DVertex.new(0, enumId, graphId, graphId, undefined, size);
        const vertexId = dv?.id;

        return vertexId || false;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create enum:', err);
        return false;
    }
}

/**
 * Create a new package in JjOM and position its vertex on the graph.
 */
export function syncCreatePackage(
    graphId: string,
    x: number,
    y: number,
): string | false {
    try {
        const lModel = resolveModelFromGraph(graphId);
        if (!lModel) {
            console.warn('[canvasToJjom] Cannot create package: model not found for graph', graphId);
            return false;
        }

        const lPackage = safeAddChild(lModel, 'package');
        if (!lPackage) {
            console.warn('[canvasToJjom] addChild("package") returned null');
            return false;
        }

        const packageId = lPackage.id ?? lPackage;

        const size = new GraphSize(x, y, 200, 120);
        const dv = DVertex.new(0, packageId, graphId, graphId, undefined, size);
        const vertexId = dv?.id;

        return vertexId || false;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create package:', err);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Model/Metamodel info (for PropertiesPanel when nothing selected)
// ---------------------------------------------------------------------------

export interface ModelInfoData {
    name: string;
    uri: string;
    className: string;
    classCount: number;
    abstractCount: number;
    enumCount: number;
    packageCount: number;
    referenceCount: number;
    totalClassifiers: number;
}

export function getModelInfo(modelid: string): ModelInfoData | null {
    try {
        const state = store.getState();
        const dModel = state.idlookup?.[modelid] as any;
        if (!dModel) return null;

        const className = dModel.className ?? '';

        const children = (dModel.classifiers ?? dModel.children ?? [])
            .map((ptr: string) => state.idlookup?.[ptr])
            .filter(Boolean);

        const classes = children.filter((c: any) => c.className === 'DClass' && !c.abstract);
        const abstractClasses = children.filter((c: any) => c.className === 'DClass' && c.abstract);
        const enums = children.filter((c: any) => c.className === 'DEnumerator');
        const packages = children.filter((c: any) => c.className === 'DPackage');

        const references = children.flatMap((c: any) =>
            (c.references ?? []).map((ptr: string) => state.idlookup?.[ptr]).filter(Boolean)
        );

        return {
            className,
            name: dModel.name ?? '',
            uri: dModel.uri ?? '',
            classCount: classes.length,
            abstractCount: abstractClasses.length,
            enumCount: enums.length,
            packageCount: packages.length,
            referenceCount: references.length,
            totalClassifiers: children.length,
        };
    } catch {
        return null;
    }
}

export function setModelName(modelid: string, name: string): void {
    try {
        const lModel: any = LPointerTargetable.fromPointer(modelid);
        if (lModel) lModel.name = name;
    } catch (err) {
        console.warn('[canvasToJjom] setModelName failed:', err);
    }
}

export function setModelUri(modelid: string, uri: string): void {
    try {
        const lModel: any = LPointerTargetable.fromPointer(modelid);
        if (lModel) lModel.uri = uri;
    } catch (err) {
        console.warn('[canvasToJjom] setModelUri failed:', err);
    }
}
