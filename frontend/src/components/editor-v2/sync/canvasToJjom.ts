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
    DObject,
    DModel,
    DClass,
    DEnumerator,
    DPackage,
    GraphSize,
    store,
} from '../../../joiner';
import type { Node } from '@xyflow/react';
import type { ClassNodeData } from '../types';
import { markCanvasUpdated, markCanvasUpdatedBatch, markCanvasEdgePair } from './syncState';
import { captureAttributeOrphanValues } from '../hooks/useOrphanFeatures';

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
 * Both operations are wrapped in a single TRANSACTION.
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
        if (currentExtends.includes(targetClass.id)) return null;

        let edgeId: string | null = null;

        // Model change and edge creation are done in SEPARATE transactions.
        // DVoidEdge.new2 internally calls Constructors.persist() which creates
        // its own TRANSACTION. Nesting it inside an outer TRANSACTION causes
        // the edge to not be properly added to the graph's subElements.
        // The auto-populate effect's dependencies (modelClassCount, subElementIds.length)
        // do NOT include the extends array, so the effect won't fire between the two.
        TRANSACTION('EditorV2 create inheritance edge', () => {
            sourceClass.extends = [...currentExtends, targetClass.id];
        });

        // Register the edge pair BEFORE creating the DVoidEdge so the
        // auto-populate won't create a duplicate even if it runs before
        // the DVoidEdge appears in the graph's subElements.
        markCanvasEdgePair(sourceVertexId, targetVertexId);

        const dEdge = DVoidEdge.new2(
            undefined,
            graphId,
            graphId,
            undefined,
            sourceVertexId,
            targetVertexId,
            (d: DEdge) => { d.isExtend = true; }
        );
        edgeId = dEdge.id;

        if (edgeId) markCanvasUpdated(edgeId);

        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create inheritance edge:', err);
        return null;
    }
}

/**
 * Create a reference relationship in JjOM AND its graph edge (DEdge).
 * Model changes (addReference, type, bounds, kind) are done in one TRANSACTION,
 * then DVoidEdge.new2 runs separately (it has its own internal TRANSACTION).
 * Nesting DVoidEdge.new2 inside an outer TRANSACTION caused the edge to not
 * appear in the graph's subElements, leading to duplicate edges.
 * Returns the DEdge ID on success, null on failure.
 */
export function syncReferenceEdge(
    sourceVertexId: string,
    targetVertexId: string,
    name: string = 'newRef',
    kind?: 'association' | 'composition' | 'aggregation',
): { edgeId: string; refName: string } | null {
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

        // Make the reference name unique within the source class.
        // Use raw store lookup (NOT LProxy .id getter which can return {} — see MEMORY.md)
        let uniqueName = name;
        try {
            const state = store.getState();
            const rawVertex = state.idlookup?.[sourceVertexId] as any;
            const classId = rawVertex?.model;  // raw string pointer, reliable
            const dClass = classId ? state.idlookup?.[classId] as any : null;
            if (dClass) {
                const refNames = new Set<string>();
                for (const refId of (dClass.references ?? [])) {
                    const ref = state.idlookup?.[refId] as any;
                    if (ref?.name) refNames.add(ref.name);
                }
                if (refNames.has(uniqueName)) {
                    let i = 1;
                    while (refNames.has(`${name}${i}`)) i++;
                    uniqueName = `${name}${i}`;
                }
            }
        } catch { /* use original name */ }

        // Model changes and edge creation are done in SEPARATE transactions.
        // DVoidEdge.new2 internally calls Constructors.persist() which creates
        // its own TRANSACTION. Nesting it inside an outer TRANSACTION causes
        // the edge to not be properly added to the graph's subElements.
        let refId: any = null;

        TRANSACTION('EditorV2 create reference edge', () => {
            const lRef = sourceClass.addReference(uniqueName, targetClass.id);
            // lRef è un LReference proxy — setta type direttamente
            if (lRef && typeof lRef === 'object') {
                lRef.type = targetClass.id;
                lRef.upperBound = -1;
            }
            refId = lRef?.id ?? lRef;
            if (!refId) return;

            // Set composition/aggregation via SetFieldAction (more reliable than proxy setter)
            if (kind === 'composition') {
                SetFieldAction.new(refId as any, 'composition' as any, true, undefined, false);
            } else if (kind === 'aggregation') {
                SetFieldAction.new(refId as any, 'aggregation' as any, true, undefined, false);
            }
        });

        if (!refId) return null;

        // Register the edge pair BEFORE creating the DVoidEdge so the
        // auto-populate won't create a duplicate.
        markCanvasEdgePair(sourceVertexId, targetVertexId);

        const dEdge = DVoidEdge.new2(
            refId,
            graphId,
            graphId,
            undefined,
            sourceVertexId,
            targetVertexId,
            (d: DEdge) => { d.isReference = true; }
        );
        const edgeId = dEdge.id;

        if (!edgeId) return null;
        markCanvasUpdated(edgeId);
        return { edgeId, refName: uniqueName };
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
        const lAttr: any = LPointerTargetable.fromPointer(attrId);
        if (!lAttr) return;

        if (field === 'type' && typeof value === 'string') {
            const options = lAttr.validTargetOptions || [];
            let pointerId: string | null = null;
            for (const group of options) {
                if (group.options) {
                    const match = group.options.find((opt: any) => opt.label === value);
                    if (match) { pointerId = match.value; break; }
                } else if (group.value && group.label === value) {
                    pointerId = group.value;
                    break;
                }
            }
            lAttr.type = pointerId || value;
        } else {
            (lAttr as any)[field] = value;
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to update attribute:', err);
    }
}

/**
 * Resolve a DReference ID by walking from a source DObject's L-proxy to its
 * metaclass and matching the reference by name. Returns undefined if the
 * lookup fails for any reason (caller should keep working with undefined as
 * a fallback to preserve previous behavior).
 */
function resolveReferenceIdByName(sourceObject: any, referenceName: string): string | undefined {
    try {
        const klass: any = sourceObject?.instanceof;
        if (!klass) return undefined;
        const refs: any[] = klass.allReferences ?? klass.references ?? [];
        for (const r of refs) {
            const lr: any = typeof r === 'string' ? LPointerTargetable.fromPointer(r) : r;
            const name = lr?.name ?? lr?.__raw?.name;
            if (name === referenceName) {
                return lr?.id ?? lr?.__raw?.id ?? (typeof r === 'string' ? r : undefined);
            }
        }
    } catch { /* fall through */ }
    return undefined;
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
        if (lRef) {
            (lRef as any)[field] = value;
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
        if (!lAttr) return;

        // Snapshot instance values into OrphanStore BEFORE delete: the
        // lAttr.delete() cascade (Dummy.get_delete, case 'instanceof') removes
        // every DValue bound to this attribute, so a post-hoc capture would
        // find nothing. Values become restorable on a later re-add matching
        // {classId, attrName, attrType} — see useOrphanFeatures.
        captureAttributeOrphanValues(attrId);

        // Use lAttr.delete() (not DeleteElementAction direct) so Dummy's
        // cascade fires and every zombie DValue with instanceof === attrId
        // gets properly removed from idlookup. lAttr.delete() wraps its own
        // TRANSACTION internally, so no outer wrapper here.
        lAttr.delete();
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
        if (!lOp) return;

        if (field === 'returnType' && typeof value === 'string') {
            const options = lOp.validTargetOptions || [];
            let pointerId: string | null = null;
            for (const group of options) {
                if (group.options) {
                    const match = group.options.find((opt: any) => opt.label === value);
                    if (match) { pointerId = match.value; break; }
                } else if (group.value && group.label === value) {
                    pointerId = group.value;
                    break;
                }
            }
            lOp.returnType = pointerId || value;
        } else {
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
        // Try direct refId first (most reliable)
        if (refId) {
            const lRef: any = LPointerTargetable.fromPointer(refId);
            if (lRef) {
                (lRef as any)[field] = value;
                return;
            }
        }

        // Fall back to edge.model
        const edgeProxy: any = LPointerTargetable.fromPointer(edgeId);
        if (!edgeProxy) {
            console.warn('[canvasToJjom] syncEdgeRefProperty: edge not found:', edgeId);
            return;
        }
        const lRef = edgeProxy?.model;
        if (lRef) {
            (lRef as any)[field] = value;
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
 * Generate a unique name with progressive numbering.
 *
 * Scans ALL elements in the store by className (DClass, DEnumerator, DPackage)
 * to collect existing names. This brute-force approach is reliable regardless
 * of the model/package tree structure.
 *
 * Returns the first available name:
 *   "NewClass"  (if no collision)
 *   "NewClass1" (if "NewClass" exists)
 *   "NewClass2" (if both exist)
 *   ...
 */
export function nextUniqueName(
    _graphId: string,
    prefix: string,
): string {
    try {
        const state = store.getState();
        const idlookup = state.idlookup;
        if (!idlookup) return prefix;

        const names = new Set<string>();
        for (const id in idlookup) {
            const elem = idlookup[id] as any;
            if (!elem?.name) continue;
            const cn = elem.className;
            if (cn === 'DClass' || cn === 'DEnumerator' || cn === 'DPackage') {
                names.add(elem.name);
            }
        }

        if (!names.has(prefix)) return prefix;
        let i = 1;
        while (names.has(`${prefix}${i}`)) i++;
        return `${prefix}${i}`;
    } catch {
        return prefix;
    }
}

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
 * Resolve the first package ID for a model associated with a graphId.
 * Classes and enumerators live inside packages, not directly on the model.
 * If the model has no packages, one is created automatically.
 *
 * Uses raw Redux state to avoid LProxy gotchas.
 */
function resolvePackageIdFromGraph(graphId: string): string | null {
    try {
        const state = store.getState();
        // DGraph → model (pointer)
        const rawGraph = state.idlookup?.[graphId] as any;
        if (!rawGraph) return null;
        const modelId = rawGraph.model;
        if (!modelId || typeof modelId !== 'string') return null;

        const rawModel = state.idlookup?.[modelId] as any;
        if (!rawModel) return null;

        // Get first package
        const packages = rawModel.packages;
        if (Array.isArray(packages) && packages.length > 0) {
            const pkgId = packages[0];
            if (typeof pkgId === 'string') return pkgId;
        }

        // No package exists — create one via LProxy (this is rare, but safe)
        const lModel = resolveModelFromGraph(graphId);
        if (lModel?.addPackage) {
            const pkg = lModel.addPackage();
            const id = pkg?.id ?? pkg;
            return typeof id === 'string' ? id : null;
        }

        return null;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to resolve package from graph:', err);
        return null;
    }
}

/**
 * Resolve the model ID from a graphId using raw Redux state.
 */
function resolveModelIdFromGraph(graphId: string): string | null {
    try {
        const state = store.getState();
        const rawGraph = state.idlookup?.[graphId] as any;
        if (!rawGraph) return null;
        const modelId = rawGraph.model;
        return (typeof modelId === 'string') ? modelId : null;
    } catch {
        return null;
    }
}

/**
 * Safely call addChild, which may return a function or an element directly.
 * Pattern from ToolBar.tsx: try calling as function, catch means it's the element.
 *
 * @param name  Optional name forwarded to the constructor (e.g. DClass.new(name, ...)).
 *              When provided, the JjOM constructor uses it directly instead of
 *              generating a default like "Concept 1" / "enum 1".
 *
 * @deprecated  Prefer calling DClass.new() / DEnumerator.new() / DPackage.new()
 *              directly to avoid nested TRANSACTIONs.
 */
function safeAddChild(lModel: any, childType: string, name?: string): any | null {
    const d = name ? lModel.addChild(childType, name) : lModel.addChild(childType);
    if (!d) return null;
    try {
        return (d as any)();
    } catch {
        return d;
    }
}

/**
 * Create a new class in JjOM and position its vertex on the graph.
 * Returns the DVertex ID on success, false on failure.
 *
 * IMPORTANT: Calls DClass.new() directly (NOT through model.addChild())
 * to avoid nested TRANSACTIONs.  model.addChild() wraps the call in its
 * own TRANSACTION, while DClass.new() already creates one via
 * Constructors.persist().  Nesting TRANSACTIONs can cause actions
 * (like adding the class ID to the package's `classes` array) to be lost.
 *
 * @param name  Optional name for the class.
 */
export function syncCreateClass(
    graphId: string,
    x: number,
    y: number,
    isAbstract: boolean = false,
    name?: string,
): string | false {
    try {
        // Resolve the model's first package (where classes are stored)
        const packageId = resolvePackageIdFromGraph(graphId);
        if (!packageId) {
            console.warn('[canvasToJjom] Cannot create class: package not found for graph', graphId);
            return false;
        }

        if (!name) name = nextUniqueName(graphId, 'Concept ');

        // Call DClass.new() directly — single TRANSACTION (no nesting).
        // DClass.new(name, isInterface, isAbstract, isPrimitive, partial, partialDefaultName, father, persist, id)
        const dClass = DClass.new(name, false, isAbstract, false, undefined, undefined, packageId, true);
        if (!dClass) {
            console.warn('[canvasToJjom] DClass.new() returned null');
            return false;
        }

        const classId = dClass.id;

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
 *
 * Calls DEnumerator.new() directly to avoid nested TRANSACTIONs.
 * DEnumerator.new(name, father, persist)
 *
 * @param name  Optional name for the enumerator.
 */
export function syncCreateEnum(
    graphId: string,
    x: number,
    y: number,
    name?: string,
): string | false {
    try {
        const packageId = resolvePackageIdFromGraph(graphId);
        if (!packageId) {
            console.warn('[canvasToJjom] Cannot create enum: package not found for graph', graphId);
            return false;
        }

        if (!name) name = nextUniqueName(graphId, 'enum ');

        // DEnumerator.new(name, father, persist)
        const dEnum = DEnumerator.new(name, packageId, true);
        if (!dEnum) {
            console.warn('[canvasToJjom] DEnumerator.new() returned null');
            return false;
        }

        const enumId = dEnum.id;

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
 *
 * Calls DPackage.new() directly to avoid nested TRANSACTIONs.
 * DPackage.new(name, uri, prefix, father, persist, fatherType)
 *
 * @param name  Optional name for the package.
 */
export function syncCreatePackage(
    graphId: string,
    x: number,
    y: number,
    name?: string,
): string | false {
    try {
        const modelId = resolveModelIdFromGraph(graphId);
        if (!modelId) {
            console.warn('[canvasToJjom] Cannot create package: model not found for graph', graphId);
            return false;
        }

        if (!name) name = nextUniqueName(graphId, 'pkg_');

        // DPackage.new(name, uri, prefix, father, persist, fatherType)
        // father is the model; fatherType must be DModel when parent is a model
        const dPkg = DPackage.new(name, undefined, undefined, modelId, true, DModel);
        if (!dPkg) {
            console.warn('[canvasToJjom] DPackage.new() returned null');
            return false;
        }

        const packageId = dPkg.id;

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

// ---------------------------------------------------------------------------
// M1 (Model Instance) — Object CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new DObject instance + DVertex on the graph.
 * IMPORTANT: Do NOT wrap DObject.new in an outer TRANSACTION — nesting
 * causes x/y coordinates to be lost (see MEMORY.md).
 *
 * @param graphId - the DGraph pointer
 * @param metaclassId - the DClass pointer (class to instantiate)
 * @param x - canvas X coordinate
 * @param y - canvas Y coordinate
 * @param objectName - optional instance name
 * @returns the DVertex ID on success, false on failure
 */
export function syncCreateObject(
    graphId: string,
    metaclassId: string,
    x: number,
    y: number,
    objectName?: string,
): string | false {
    try {
        const lGraph: any = LPointerTargetable.fromPointer(graphId);
        const modelId = lGraph?.model?.id ?? lGraph?.__raw?.model;

        if (!modelId) {
            console.warn('[canvasToJjom] syncCreateObject: cannot find model from graph', graphId);
            return false;
        }

        const name = objectName || `obj_${Date.now().toString(36).slice(-4)}`;

        // DObject.new(instanceof, father, fatherType, name, persist)
        // Do NOT wrap in TRANSACTION — .new() creates its own internally

        const dObject = (DObject as any).new(
            metaclassId,   // which class to instantiate
            modelId,       // parent model
            DModel,        // fatherType — MUST be DModel
            name,          // instance name
            true           // persist
        );

        if (!dObject?.id) {
            console.warn('[canvasToJjom] syncCreateObject: DObject.new returned null');
            return false;
        }

        // Create the DVertex positioned at drop coordinates
        const size = new GraphSize(x, y, 200, 80);
        const dv = DVertex.new(0, dObject.id, graphId, graphId, undefined, size);
        const vertexId = dv?.id;

        return vertexId || false;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create object:', err);
        return false;
    }
}

/**
 * Update a feature value on a DObject instance.
 * Uses the LProxy magic getter: lObject['$featureName'].value = newValue
 *
 * @param objectVertexId - the DVertex ID of the object
 * @param featureName - the attribute name
 * @param newValue - the new value
 */
export function syncUpdateFeatureValue(
    objectVertexId: string,
    featureName: string,
    newValue: string | number | boolean | null,
): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(objectVertexId);
        const lObject = lVertex?.model;

        if (!lObject) {
            console.warn('[canvasToJjom] syncUpdateFeatureValue: no model for vertex', objectVertexId);
            return;
        }


        TRANSACTION(`EditorV2 set ${featureName}`, () => {
            const featureProxy = (lObject as any)['$' + featureName];
            if (featureProxy) {
                featureProxy.value = newValue;
            } else {
                console.warn('[canvasToJjom] syncUpdateFeatureValue: feature proxy not found:', featureName);
            }
        });
    } catch (err) {
        console.warn('[canvasToJjom] Failed to update feature value:', err);
    }
}

/**
 * Create a composition link between a parent and child object.
 * Appends the child's DObject ID to the parent's reference values
 * and creates a visual DEdge.
 *
 * @returns the DEdge ID on success, null on failure
 */
export function syncCreateCompositionLink(
    parentVertexId: string,
    childVertexId: string,
    referenceName: string,
): string | null {
    try {
        const parentProxy: any = LPointerTargetable.fromPointer(parentVertexId);
        const childProxy: any = LPointerTargetable.fromPointer(childVertexId);
        const parentObject = parentProxy?.model;
        const childObject = childProxy?.model;

        if (!parentObject || !childObject) {
            console.warn('[canvasToJjom] syncCreateCompositionLink: missing model');
            return null;
        }

        const graphId = parentProxy?.graph?.id ?? parentProxy?.__raw?.graph;
        if (!graphId) {
            console.warn('[canvasToJjom] syncCreateCompositionLink: cannot find graphId');
            return null;
        }

        let edgeId: string | null = null;

        const refDefId = resolveReferenceIdByName(parentObject, referenceName);
        // [BUG-DIAG] log when the metaclass reference id can't be resolved —
        // this is the path that left edge.model = undefined and caused the
        // M1 reference edge to render with empty label / wrong type.
        if (!refDefId) {
            console.warn('[BUG-DIAG] syncCreateCompositionLink: cannot resolve DReference id', { referenceName, parentObjectId: parentObject?.id });
        }

        TRANSACTION('EditorV2 create composition link', () => {
            // Append child object ID to reference values.
            // Read from __raw.values (the DValue array) instead of the L-layer
            // .values getter, which pads empty slots with `undefined` when
            // length < lowerBound. That padding caused new targets to land at
            // index 1+ instead of index 0 for [1..1] references.
            const refProxy = (parentObject as any)['$' + referenceName];
            if (refProxy) {
                const rawVals: any[] = refProxy.__raw?.values ?? [];
                const meaningful = rawVals.filter((v: any) => v != null && v !== '');
                refProxy.values = [...meaningful, childObject.id];
            }

            // Create visual edge — pass the metaclass DReference id so the
            // JjOM→RF transformer (jjomEdgeToRFEdge) can recover the
            // reference name, type and composition flag.
            const dEdge = DVoidEdge.new2(
                refDefId,
                graphId,
                graphId,
                undefined,
                parentVertexId,
                childVertexId,
                (d: DEdge) => {
                    d.isReference = true;
                }
            );
            edgeId = dEdge?.id ?? null;
        });

        if (edgeId) markCanvasUpdated(edgeId);
        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create composition link:', err);
        return null;
    }
}

/**
 * Create a non-composition reference link between two object instances.
 */
export function syncCreateReferenceLink(
    sourceVertexId: string,
    targetVertexId: string,
    referenceName: string,
): string | null {
    try {
        const sourceProxy: any = LPointerTargetable.fromPointer(sourceVertexId);
        const targetProxy: any = LPointerTargetable.fromPointer(targetVertexId);
        const sourceObject = sourceProxy?.model;
        const targetObject = targetProxy?.model;

        if (!sourceObject || !targetObject) {
            console.warn('[canvasToJjom] syncCreateReferenceLink: missing model');
            return null;
        }

        const graphId = sourceProxy?.graph?.id ?? sourceProxy?.__raw?.graph;
        if (!graphId) {
            console.warn('[canvasToJjom] syncCreateReferenceLink: cannot find graphId');
            return null;
        }

        let edgeId: string | null = null;

        const refDefId = resolveReferenceIdByName(sourceObject, referenceName);
        // [BUG-DIAG] log when the metaclass reference id can't be resolved —
        // this is the path that left edge.model = undefined and caused the
        // M1 reference edge to render with empty label / wrong type.
        if (!refDefId) {
            console.warn('[BUG-DIAG] syncCreateReferenceLink: cannot resolve DReference id', { referenceName, sourceObjectId: sourceObject?.id });
        }

        TRANSACTION('EditorV2 create reference link', () => {
            // Append target object ID to reference values.
            // Read from __raw.values — see comment in syncCreateCompositionLink.
            const refProxy = (sourceObject as any)['$' + referenceName];
            if (refProxy) {
                const rawVals: any[] = refProxy.__raw?.values ?? [];
                const meaningful = rawVals.filter((v: any) => v != null && v !== '');
                refProxy.values = [...meaningful, targetObject.id];
            }

            // Create visual edge — pass the metaclass DReference id so the
            // JjOM→RF transformer (jjomEdgeToRFEdge) can recover the
            // reference name and type.
            const dEdge = DVoidEdge.new2(
                refDefId,
                graphId,
                graphId,
                undefined,
                sourceVertexId,
                targetVertexId,
                (d: DEdge) => { d.isReference = true; }
            );
            edgeId = dEdge?.id ?? null;
        });

        if (edgeId) markCanvasUpdated(edgeId);
        return edgeId;
    } catch (err) {
        console.warn('[canvasToJjom] Failed to create reference link:', err);
        return null;
    }
}

/**
 * Delete a DObject and its associated DVertex.
 */
// ---------------------------------------------------------------------------
// Undo/Redo JjOM reconciliation
// ---------------------------------------------------------------------------

/**
 * After undo/redo restores RF state, reconcile JjOM to match.
 *
 * The RF undo system restores canvas nodes/edges but doesn't undo JjOM
 * operations. This function bridges the gap by comparing the restored RF
 * attribute lists with the current JjOM state and syncing the differences.
 *
 * For each class node in the restored state:
 *  - Attributes present in RF but deleted from JjOM → re-create in JjOM
 *  - Attributes present in JjOM but absent in RF → delete from JjOM
 *  - Attribute names/types that differ → update in JjOM
 *
 * Returns a Map<oldAttrId, newAttrId> for any re-created attributes so the
 * caller can patch RF node data with the new JjOM IDs.
 */
export function reconcileJjomAfterUndoRedo(
    restoredNodes: Node[],
): Map<string, string> {
    const idMap = new Map<string, string>(); // oldId → newId
    const lookup = store.getState()?.idlookup;
    if (!lookup) return idMap;

    for (const node of restoredNodes) {
        if (node.type !== 'classNode') continue;
        const data = node.data as ClassNodeData;
        const rfAttrs = data.attributes ?? [];

        // Resolve the DClass via the vertex
        const lVertex: any = LPointerTargetable.fromPointer(node.id);
        const lClass = lVertex?.model;
        if (!lClass) continue;

        // Current JjOM attribute IDs for this class
        const dClass = lookup[lClass.id] as any;
        if (!dClass) continue;
        const jjomAttrIds: string[] = dClass.attributes ?? [];
        const jjomAttrSet = new Set(jjomAttrIds);

        // RF attribute IDs
        const rfAttrIds = rfAttrs.map(a => a.id);
        const rfAttrSet = new Set(rfAttrIds);

        // --- Attributes in RF but not in JjOM: re-create ---
        for (const rfAttr of rfAttrs) {
            if (jjomAttrSet.has(rfAttr.id)) continue;
            // Also skip temp IDs (client-side, never existed in JjOM)
            if (rfAttr.id.startsWith('attr_')) continue;

            // console.log('[UndoReconcile] Re-creating deleted attribute:', { name: rfAttr.name, type: rfAttr.type, oldId: rfAttr.id });
            try {
                const newLAttr = lClass.addAttribute(rfAttr.name);
                if (newLAttr?.id) {
                    idMap.set(rfAttr.id, newLAttr.id);
                    // console.log('[UndoReconcile] Created new attribute:', { oldId: rfAttr.id, newId: newLAttr.id, name: rfAttr.name });
                }
            } catch (err) {
                console.warn('[UndoReconcile] Failed to re-create attribute:', err);
            }
        }

        // --- Attributes in JjOM but not in RF: delete ---
        for (const jjomAttrId of jjomAttrIds) {
            if (rfAttrSet.has(jjomAttrId)) continue;
            // Also check if this attr was just re-created (new ID maps to an RF attr)
            let isRemapped = false;
            for (const [, newId] of idMap) {
                if (newId === jjomAttrId) { isRemapped = true; break; }
            }
            if (isRemapped) continue;

            // console.log('[UndoReconcile] Removing extra JjOM attribute:', { attrId: jjomAttrId });
            try {
                const lAttr: any = LPointerTargetable.fromPointer(jjomAttrId);
                if (lAttr) {
                    TRANSACTION('UndoReconcile remove attr', () => {
                        DeleteElementAction.new(lAttr.__raw ?? lAttr);
                    });
                }
            } catch (err) {
                console.warn('[UndoReconcile] Failed to remove attribute:', err);
            }
        }

        // --- Attributes in both: sync name/type if different ---
        for (const rfAttr of rfAttrs) {
            if (!jjomAttrSet.has(rfAttr.id)) continue;
            const dAttr = lookup[rfAttr.id] as any;
            if (!dAttr) continue;

            // DISABLED (2026-04-23): Opzione 4 interim fix per bug "undo/attr_0" / "attributi rinominati tornano a default".
            // Il rename branch forzava sincronizzazione JjOM al RF snapshot name, ma il snapshot non cattura
            // i rename fatti via Info panel (dock destro) che vanno solo in Redux. Il risultato era che Ctrl+Z
            // post-rename riportava il nome al valore pre-rename presente nel RF snapshot.
            //
            // Trade-off accettato: Ctrl+Z dopo inline-edit rename non revoca più il rename. Per revocarlo,
            // l'utente deve ri-rinominare manualmente.
            //
            // Fix strutturale (opzione 3 del report): unificare il dual undo system. Tracked come debito
            // tecnico in docs/TECH-DEBT.md.
            //
            // Riferimento: docs/reports/2026-04-23-undo-attr-zero-analysis.md (sezioni B.3, B.5, E.2)
            //
            // if (dAttr.name !== rfAttr.name) {
            //     // console.log('[UndoReconcile] Renaming attribute:', { id: rfAttr.id, from: dAttr.name, to: rfAttr.name });
            //     try {
            //         const lAttr: any = LPointerTargetable.fromPointer(rfAttr.id);
            //         if (lAttr) lAttr.name = rfAttr.name;
            //     } catch { /* ignore */ }
            // }
        }
    }

    return idMap;
}

export function syncDeleteObject(objectVertexId: string): void {
    try {
        const vertexProxy: any = LPointerTargetable.fromPointer(objectVertexId);
        if (!vertexProxy) return;

        // Delete connected edges first

        const graphProxy: any = vertexProxy.graph;
        if (graphProxy) {
            const allEdges: any[] = graphProxy.edges ?? [];
            const connected = allEdges.filter((e: any) => {
                const startId = e?.start?.id ?? e?.__raw?.start;
                const endId = e?.end?.id ?? e?.__raw?.end;
                return startId === objectVertexId || endId === objectVertexId;
            });
            if (connected.length > 0) {
                TRANSACTION('EditorV2 delete object edges', () => {
                    for (const edge of connected) {
                        DeleteElementAction.new(edge.__raw ?? edge);
                    }
                });
            }
        }

        // Delete the DObject model element
        const modelElement = vertexProxy?.model;
        if (modelElement) {
            TRANSACTION('EditorV2 delete object', () => {
                DeleteElementAction.new(modelElement.__raw ?? modelElement);
            });
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to delete object:', err);
    }
}
