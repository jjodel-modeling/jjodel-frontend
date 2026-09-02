/**
 * useClassRemoval — Co-evolution hook for class removal from metamodel.
 *
 * When a class B is removed:
 * 1. Collapse hierarchy: subclasses inherit B's attributes/operations/references
 * 2. Remove all edges involving B (inheritance + references)
 * 3. Mark instances of B as Orphan (via Redux — model canvas updates via useJjomSync)
 * 4. Remove B from canvas and JjOM
 */

import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { DAttribute, DOperation, DReference, LPointerTargetable, TRANSACTION, SetFieldAction, store } from '../../../joiner';
import { syncDeleteVertex } from '../sync/canvasToJjom';
import type { ClassNodeData } from '../types';
import { JjodelEvents } from '../../../events/registry';

interface ClassRemovalResult {
    orphanedInstances: number;
    collapsedSubclasses: number;
    removedEdges: number;
    className: string;
}

interface AnalysisResult {
    className: string;
    classModelId: string;            // JjOM DClass ID
    subclassIds: string[];           // RF node IDs of direct subclasses
    instanceObjectIds: string[];     // JjOM DObject IDs (from Redux, not RF)
    connectedEdgeIds: string[];      // all edge IDs involving this class
    inheritanceEdgeIds: string[];    // inheritance edges specifically
}

/**
 * Analyze what will be affected by removing a class node.
 * Instances are found in Redux store (they live in a different canvas).
 */
function analyzeClassRemoval(
    nodeId: string,
    nodes: Node[],
    edges: Edge[],
): AnalysisResult {
    const classNode = nodes.find(n => n.id === nodeId);
    const className = (classNode?.data as ClassNodeData)?.label ?? 'Unknown';

    // Find edges connected to this node
    const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
    const connectedEdgeIds = connectedEdges.map(e => e.id);
    const inheritanceEdgeIds = connectedEdges
        .filter(e => e.type === 'inheritance')
        .map(e => e.id);

    // Find direct subclasses: nodes that have an inheritance edge pointing TO this class
    // (source = subclass, target = superclass)
    const subclassIds = connectedEdges
        .filter(e => e.type === 'inheritance' && e.target === nodeId)
        .map(e => e.source);

    // Find instances via Redux store — DObjects whose instanceof === classModelId
    let classModelId = '';
    const instanceObjectIds: string[] = [];
    try {
        const vertexProxy: any = LPointerTargetable.fromPointer(nodeId);
        classModelId = vertexProxy?.model?.id ?? '';
        if (classModelId) {
            const state = store.getState();
            const lookup = state?.idlookup;
            if (lookup) {
                for (const [id, elem] of Object.entries(lookup)) {
                    const d = elem as any;
                    if (d?.className === 'DObject' && d?.instanceof === classModelId) {
                        instanceObjectIds.push(id);
                    }
                }
            }
        }
    } catch { /* ignore */ }

    return {
        className,
        classModelId,
        subclassIds,
        instanceObjectIds,
        connectedEdgeIds,
        inheritanceEdgeIds,
    };
}

/**
 * Collapse hierarchy: copy B's own attributes/operations into each direct subclass.
 * Skip attributes/operations that already exist in the subclass (match by name).
 */
function collapseHierarchy(
    removedClassNodeId: string,
    subclassNodeIds: string[],
): number {
    if (subclassNodeIds.length === 0) return 0;

    try {
        const vertexProxy: any = LPointerTargetable.fromPointer(removedClassNodeId);
        const lClass = vertexProxy?.model;
        if (!lClass) return 0;

        // Collect B's own attributes and operations
        const ownAttrs: any[] = lClass.ownAttributes ?? [];
        const ownOps: any[] = lClass.ownOperations ?? [];
        const ownRefs: any[] = lClass.ownReferences ?? [];

        // Also collect inherited attributes (from B's parents) since subclasses
        // will lose access to those when B is removed and the inheritance edge
        // to B is deleted. The subclass may or may not have its own path to those
        // ancestors — but if B is the only path, the subclass needs these too.
        const inheritedAttrs: any[] = lClass.inheritedAttributes ?? [];
        const inheritedOps: any[] = lClass.inheritedOperations ?? [];
        const inheritedRefs: any[] = lClass.inheritedReferences ?? [];

        const allAttrs = [...ownAttrs, ...inheritedAttrs];
        const allOps = [...ownOps, ...inheritedOps];
        const allRefs = [...ownRefs, ...inheritedRefs];

        if (allAttrs.length === 0 && allOps.length === 0 && allRefs.length === 0) return 0;

        // For each subclass, add missing attributes/operations via JjOM
        TRANSACTION('Co-evolution: collapse hierarchy', () => {
            for (const subId of subclassNodeIds) {
                try {
                    const subProxy: any = LPointerTargetable.fromPointer(subId);
                    const subClass = subProxy?.model;
                    if (!subClass) continue;

                    // Get existing names to avoid duplicates
                    const existingAttrNames = new Set(
                        (subClass.ownAttributes ?? []).map((a: any) => a.name)
                    );
                    const existingOpNames = new Set(
                        (subClass.ownOperations ?? []).map((o: any) => o.name)
                    );
                    const existingRefNames = new Set(
                        (subClass.ownReferences ?? []).map((r: any) => r.name)
                    );

                    // ── Why D*.new and not subClass.addAttribute (S1-M2) ──────────
                    //
                    // This is a SYSTEM COPY, not a user create: it moves features the
                    // subclass is about to lose down into the subclass, and it runs
                    // BEFORE B is removed — so at this instant the subclass still
                    // INHERITS every one of them. The M2 uniqueness rule (R-M2U-4, no
                    // shadowing) therefore refuses each copy, correctly by its own
                    // terms, and the co-evolution would silently produce nothing and
                    // lose the features when B goes.
                    //
                    // Measured: with `Sup{label}` <- `Sub`, the copy list is `[label]`
                    // and `subClass.addAttribute('label')` returns null, leaving `Sub`
                    // with none of it. See
                    // docs/discovery/discovery_2026-08-30_s1m2_una_regola.md §G.
                    //
                    // The bypass is DECLARED and takes the same door the loader takes:
                    // `D*.new` directly, which the ratified design leaves un-gated for
                    // exactly this reason (import, seeding, fixtures — writes that must
                    // reproduce a state, not propose one). The gate stays on the L-layer
                    // primitive, where user gestures arrive. The `existing*Names` guard
                    // above is unchanged and still keeps the copy idempotent.

                    // Add missing attributes
                    for (const attr of allAttrs) {
                        if (existingAttrNames.has(attr.name)) continue;
                        const newAttr: any = LPointerTargetable.fromD(
                            DAttribute.new(attr.name, attr.type?.id ?? attr.__raw?.type, subClass.id, true)
                        );
                        if (newAttr?.__raw) {
                            newAttr.__raw.lowerBound = attr.lowerBound ?? 0;
                            newAttr.__raw.upperBound = attr.upperBound ?? 1;
                            if (attr.defaultValueLiteral) {
                                newAttr.__raw.defaultValueLiteral = attr.defaultValueLiteral;
                            }
                        }
                    }

                    // Add missing operations
                    for (const op of allOps) {
                        if (existingOpNames.has(op.name)) continue;
                        DOperation.new(op.name, op.type?.id ?? op.__raw?.type, [], subClass.id, true);
                    }

                    // Add missing references
                    for (const ref of allRefs) {
                        if (existingRefNames.has(ref.name)) continue;
                        const newRef: any = LPointerTargetable.fromD(
                            DReference.new(ref.name, ref.type?.id ?? ref.__raw?.type, subClass.id, true)
                        );
                        if (newRef?.__raw) {
                            newRef.__raw.lowerBound = ref.lowerBound ?? 0;
                            newRef.__raw.upperBound = ref.upperBound ?? -1;
                            newRef.__raw.composition = !!ref.composition;
                        }
                    }
                } catch (err) {
                    console.warn('[useClassRemoval] Failed to collapse into subclass:', subId, err);
                }
            }
        });

        return subclassNodeIds.length;
    } catch (err) {
        console.warn('[useClassRemoval] collapseHierarchy failed:', err);
        return 0;
    }
}

/**
 * Mark instances of the removed class as orphan by clearing their instanceof
 * pointer in Redux. The model canvas updates automatically via useJjomSync.
 * ObjectNode shows "Orphan" when instanceOfClassId is empty (see ObjectNode.tsx).
 */
function orphanInstances(
    instanceObjectIds: string[],
): number {
    if (instanceObjectIds.length === 0) return 0;

    // Clear the instanceof pointer on each DObject in Redux.
    // useJjomSync in the model canvas will detect the change and update node.data.
    // ObjectNode's useSelector will read the cleared instanceof and show "Orphan".
    TRANSACTION('Co-evolution: orphan instances', () => {
        for (const objectId of instanceObjectIds) {
            try {
                SetFieldAction.new(objectId as any, 'instanceof' as any, '', '', true);
            } catch (err) {
                console.warn('[useClassRemoval] Failed to orphan instance:', objectId, err);
            }
        }
    });

    return instanceObjectIds.length;
}

/**
 * Fire a toast via CustomEvent — bypasses React batching and works
 * regardless of component tree position. The ToastProvider listener
 * in ToastContext.tsx catches 'jjodel:toast' events.
 */
function fireToast(message: string, duration = 3000) {
    window.dispatchEvent(new CustomEvent(JjodelEvents.TOAST, {
        detail: { message, priority: 'info', duration, dismiss: 'auto' },
    }));
}

export function useClassRemoval(
    modelid: string | undefined,
    isJjomMode: boolean,
    setNodes: (updater: (nodes: Node[]) => Node[]) => void,
    setEdges: (updater: (edges: Edge[]) => Edge[]) => void,
    getNodes: () => Node[],
    getEdges: () => Edge[],
    takeSnapshot: () => void,
    applyDistribution: (edges: Edge[]) => Edge[],
) {
    const handleClassRemoval = useCallback((nodeId: string): ClassRemovalResult | null => {
        if (!isJjomMode || !modelid) return null;

        const nodes = getNodes();
        const edges = getEdges();

        // Step 0: Analyze (instances found via Redux, not RF canvas)
        const analysis = analyzeClassRemoval(nodeId, nodes, edges);

        // Take undo snapshot before any changes
        takeSnapshot();

        // Step 2: Collapse hierarchy (BEFORE removing B)
        const collapsedSubclasses = collapseHierarchy(nodeId, analysis.subclassIds);

        // Step 3: Remove all edges involving B from RF
        if (analysis.connectedEdgeIds.length > 0) {
            const edgeIdSet = new Set(analysis.connectedEdgeIds);
            setEdges(eds => applyDistribution(eds.filter(e => !edgeIdSet.has(e.id))));
        }

        // Step 4: Orphan instances (via Redux — model canvas updates via useJjomSync)
        const orphanedInstances = orphanInstances(analysis.instanceObjectIds);

        if (orphanedInstances > 0) {
            const n = orphanedInstances;
            fireToast(
                n === 1
                    ? `1 instance of ${analysis.className} became orphaned`
                    : `${n} instances of ${analysis.className} became orphaned`,
            );
        }

        // Step 5: Remove B from RF
        setNodes(nds => nds.filter(n => n.id !== nodeId));

        // Step 5b: Sync to JjOM (syncDeleteVertex handles edge cleanup + model element deletion)
        syncDeleteVertex(nodeId);

        return {
            orphanedInstances,
            collapsedSubclasses,
            removedEdges: analysis.connectedEdgeIds.length,
            className: analysis.className,
        };
    }, [isJjomMode, modelid, getNodes, getEdges, takeSnapshot, setNodes, setEdges, applyDistribution]);

    return { handleClassRemoval };
}
