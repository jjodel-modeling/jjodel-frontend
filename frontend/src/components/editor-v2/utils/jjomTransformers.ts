/**
 * JjOM → React Flow transformation utilities.
 *
 * Pure functions that convert JjOM graph elements (DVertex/DEdge accessed
 * through L-proxies) into React Flow Node / Edge objects compatible with
 * the Editor v2 node and edge types.
 *
 * Phase 2: read-only — no Canvas → JjOM sync.
 */

import type { Node, Edge } from '@xyflow/react';
import { getBaseSide } from './portDistribution';
import { computeBestAnchorsWithContext, getNodeRect, type EdgeContext, type NodeRect } from '../hooks/useAutoAnchor';
import type {
    ClassNodeData,
    EnumNodeData,
    PackageNodeData,
    ObjectNodeData,
    FeatureValueRow,
    MetaAttribute,
    MetaLiteral,
    MetaReference,
    MetaOperation,
    MetaParameter,
    ReferenceEdgeData,
    InheritanceEdgeData,
    CompositionEdgeData,
    InstanceReferenceEdgeData,
    ReferenceKind,
} from '../types';
import { setEdgeRefId } from '../sync/syncState';

// L-proxy types — using `any` for property access to avoid coupling to
// the exact proxy shape which uses runtime magic getters.
// The property names are documented and stable.

/**
 * Map a JjOM vertex (LVertex with LClass model) to a React Flow classNode.
 */
function classVertexToRFNode(vertex: any): Node<ClassNodeData> {
    const lClass = vertex.model;
    const attrs: MetaAttribute[] = [];
    const refs: MetaReference[] = [];
    const ops: MetaOperation[] = [];

    // Map attributes
    try {
        const lAttributes = lClass?.attributes ?? [];
        for (const attr of lAttributes) {
            attrs.push({
                id: attr.id ?? `attr_${attrs.length}`,
                name: attr.name ?? 'unnamed',
                type: attr.type?.name ?? 'EString',
                defaultValue: attr.defaultValueLiteral || undefined,
                lowerBound: attr.lowerBound ?? 0,
                upperBound: attr.upperBound ?? 1,
            });
        }
    } catch { /* proxy access can throw if data is stale */ }

    // Map references
    try {
        const lReferences = lClass?.references ?? [];
        for (const ref of lReferences) {
            let kind: ReferenceKind = 'association';
            if (ref.composition) kind = 'composition';
            else if (ref.aggregation) kind = 'aggregation';

            refs.push({
                id: ref.id ?? `ref_${refs.length}`,
                name: ref.name ?? 'unnamed',
                kind,
                targetClassId: ref.type?.id ?? '',
                lowerBound: ref.lowerBound ?? 0,
                upperBound: ref.upperBound ?? -1,
                containment: !!ref.composition,
                opposite: ref.opposite?.name,
                type: ref.type ? { id: ref.type.id, name: ref.type.name } : undefined,
            });
        }
    } catch { /* proxy access can throw */ }

    // Map operations
    try {
        const lOperations = lClass?.operations ?? [];
        for (const op of lOperations) {
            const params: MetaParameter[] = [];
            try {
                for (const p of (op.parameters ?? [])) {
                    params.push({
                        id: p.id ?? `param_${params.length}`,
                        name: p.name ?? 'unnamed',
                        type: p.type?.name ?? 'EString',
                    });
                }
            } catch { /* ignore */ }

            ops.push({
                id: op.id ?? `op_${ops.length}`,
                name: op.name ?? 'unnamed',
                returnType: op.type?.name ?? 'void',
                parameters: params,
            });
        }
    } catch { /* proxy access can throw */ }

    // Use __raw for reliable numeric coordinates (LProxy gotcha:
    // proxy getters return {} instead of numbers when stale)
    const raw = vertex.__raw ?? vertex;
    const x = typeof raw.x === 'number' ? raw.x : 0;
    const y = typeof raw.y === 'number' ? raw.y : 0;

    // console.log('[DEBUG classVertexToRFNode] x:', x, 'y:', y, 'raw:', raw?.x, raw?.y, 'id:', vertex.id);



    return {
        id: vertex.id,
        type: 'classNode',
        position: { x, y },
        data: {
            label: lClass?.name ?? 'Class',
            isAbstract: !!lClass?.abstract,
            isSingleton: !!lClass?.isSingleton,
            attributes: attrs,
            references: refs.length > 0 ? refs : undefined,
            operations: ops.length > 0 ? ops : undefined,
        },
    };
}

/**
 * Map a JjOM vertex (LVertex with LEnumerator model) to a React Flow enumNode.
 */
function enumVertexToRFNode(vertex: any): Node<EnumNodeData> {
    const lEnum = vertex.model;
    const literals: MetaLiteral[] = [];

    try {
        const lLiterals = lEnum?.literals ?? [];
        for (let i = 0; i < lLiterals.length; i++) {
            const lit = lLiterals[i];
            literals.push({
                id: lit.id ?? `lit_${i}`,
                name: lit.name ?? `VALUE_${i}`,
                value: lit.value ?? i,
            });
        }
    } catch { /* proxy access can throw */ }

    // Use __raw for reliable numeric coordinates (LProxy gotcha)
    const raw = vertex.__raw ?? vertex;
    const x = typeof raw.x === 'number' ? raw.x : 0;
    const y = typeof raw.y === 'number' ? raw.y : 0;

    return {
        id: vertex.id,
        type: 'enumNode',
        position: { x, y },
        data: {
            label: lEnum?.name ?? 'Enum',
            literals,
        },
    };
}

/**
 * Map a JjOM vertex (LVertex with LPackage model) to a React Flow packageNode.
 */
function packageVertexToRFNode(vertex: any): Node<PackageNodeData> {
    const lPackage = vertex.model;
    // Use __raw for reliable numeric coordinates (LProxy gotcha)
    const raw = vertex.__raw ?? vertex;
    const x = typeof raw.x === 'number' ? raw.x : 0;
    const y = typeof raw.y === 'number' ? raw.y : 0;
    const w = typeof raw.w === 'number' ? raw.w : 400;
    const h = typeof raw.h === 'number' ? raw.h : 300;

    return {
        id: vertex.id,
        type: 'packageNode',
        position: { x, y },
        style: {
            zIndex: -1,
            width: w,
            height: h,
        },
        data: {
            label: lPackage?.name ?? 'Package',
        },
    };
}

/**
 * Map a JjOM vertex (LVertex with LObject model) to a React Flow objectNode.
 * Used for M1 (model instance) editing.
 */
function objectVertexToRFNode(vertex: any): Node<ObjectNodeData> {
    const lObject = vertex.model;
    const features: FeatureValueRow[] = [];

    // Read the metaclass info
    let instanceOfClassName = 'Object';
    let instanceOfClassId = '';
    try {
        const instanceOf = lObject?.instanceof;
        if (instanceOf) {
            instanceOfClassName = instanceOf.name ?? 'Object';
            instanceOfClassId = instanceOf.id ?? '';
        }
    } catch { /* proxy can throw */ }

    // Read feature values (DValue instances)
    try {
        const featureValues = lObject?.features ?? [];
        for (const fv of featureValues) {
            const feature = fv?.instanceof ?? fv?.feature;
            const featureClassName = feature?.className ?? feature?.__raw?.className ?? '';
            const isRef = featureClassName === 'DReference';
            const featureKind: 'attribute' | 'reference' = isRef ? 'reference' : 'attribute';

            let value = '';
            let featureTypeId = '';
            let typeName = '';
            let enumLiterals: Array<{ name: string; value: number }> | undefined;

            if (isRef) {
                // Reference: show resolved target names (handle both pointer IDs and objects)
                try {
                    const vals = fv.values ?? [];
                    const names: string[] = [];
                    for (const v of vals) {
                        const target = typeof v === 'string' ? null : v;
                        if (target?.name) names.push(target.name);
                    }
                    value = names.join(', ') || '—';
                } catch { value = '—'; }
            } else {
                // Attribute: show primitive value
                try {
                    const vals = fv.values ?? [];
                    value = vals.length > 0 ? String(vals[0] ?? '') : '';
                } catch { value = ''; }

                // Resolve enum literals if the attribute type is an enumeration
                try {
                    const featureType = feature?.type;
                    featureTypeId = featureType?.id ?? '';
                    typeName = featureType?.name ?? '';
                    if (featureType?.isEnum) {
                        const lits = featureType.literals ?? [];
                        if (lits.length > 0) {
                            enumLiterals = [];
                            for (let i = 0; i < lits.length; i++) {
                                const lit = lits[i];
                                enumLiterals.push({
                                    name: lit.name ?? `VALUE_${i}`,
                                    value: lit.value ?? i,
                                });
                            }
                        }
                    }
                } catch { /* proxy access can throw */ }
            }

            features.push({
                id: fv.id ?? `fv_${features.length}`,
                featureName: feature?.name ?? 'unnamed',
                featureKind,
                featureTypeId,
                typeName: typeName || undefined,
                value,
                enumLiterals,
            });
        }
    } catch { /* proxy access can throw */ }

    // Use __raw for reliable numeric coordinates (LProxy gotcha)
    const raw = vertex.__raw ?? vertex;
    const x = typeof raw.x === 'number' ? raw.x : 0;
    const y = typeof raw.y === 'number' ? raw.y : 0;

    return {
        id: vertex.id,
        type: 'objectNode',
        position: { x, y },
        data: {
            label: lObject?.name ?? 'obj',
            instanceOfClassName,
            instanceOfClassId,
            features,
        },
    };
}

/**
 * Transform a single JjOM vertex (LVertex) into the appropriate React Flow Node.
 * Returns null if the vertex type is not recognized or has no model.
 */
export function jjomVertexToRFNode(vertex: any): Node | null {
    const model = vertex?.model;

    if (!model) return null;

    const className = model.className ?? model.__raw?.className;
    switch (className) {
        case 'DClass':
            return classVertexToRFNode(vertex);
        case 'DEnumerator':
            return enumVertexToRFNode(vertex);
        case 'DPackage':
            return packageVertexToRFNode(vertex);
        case 'DObject':
            return objectVertexToRFNode(vertex);
        default:
            return null;
    }
}

/**
 * Compute optimal source/target handle sides based on vertex positions.
 * Returns handle IDs like 'top-0', 'bottom-0', etc.
 *
 * For inheritance edges, UML convention dictates the triangle marker is always
 * at the bottom of the parent (target). So we force vertical routing:
 * child (source) connects from top, parent (target) from bottom.
 * Horizontal routing is only used if classes are at nearly the same Y level.
 */
function computeOptimalHandles(
    sourceVertex: any,
    targetVertex: any,
    isInheritance: boolean = false,
): { sourceHandle: string; targetHandle: string } {
    // Use __raw to get reliable numeric values — LProxy getters return {}
    // instead of numbers, which causes NaN and wrong fallthrough.
    const sRaw = sourceVertex?.__raw ?? sourceVertex;
    const tRaw = targetVertex?.__raw ?? targetVertex;
    const sx = typeof sRaw?.x === 'number' ? sRaw.x : 0;
    const sy = typeof sRaw?.y === 'number' ? sRaw.y : 0;
    const sw = typeof sRaw?.w === 'number' ? sRaw.w : 180;
    const sh = typeof sRaw?.h === 'number' ? sRaw.h : 80;
    const tx = typeof tRaw?.x === 'number' ? tRaw.x : 0;
    const ty = typeof tRaw?.y === 'number' ? tRaw.y : 0;
    const tw = typeof tRaw?.w === 'number' ? tRaw.w : 180;
    const th = typeof tRaw?.h === 'number' ? tRaw.h : 80;

    const scx = sx + sw / 2;
    const scy = sy + sh / 2;
    const tcx = tx + tw / 2;
    const tcy = ty + th / 2;

    const dx = tcx - scx;
    const dy = tcy - scy;

    if (isInheritance) {
        // Inheritance always anchors child=top, parent=bottom
        // (consistent with EditorV2 creation and useAutoAnchor hysteresis)
        return { sourceHandle: 'top-0', targetHandle: 'bottom-0' };
    }

    // Non-inheritance: use dominant axis
    if (Math.abs(dy) >= Math.abs(dx)) {
        if (dy < 0) {
            return { sourceHandle: 'top-0', targetHandle: 'bottom-0' };
        } else {
            return { sourceHandle: 'bottom-0', targetHandle: 'top-0' };
        }
    } else {
        if (dx > 0) {
            return { sourceHandle: 'right-0', targetHandle: 'left-0' };
        } else {
            return { sourceHandle: 'left-0', targetHandle: 'right-0' };
        }
    }
}

/**
 * Convert a base side ('right') from the anchor selector into an indexed handle id
 * ('right-0'): keep the provisional index when the side is unchanged, otherwise restart
 * at index 0 on the new side (portDistribution re-indexes within a side downstream).
 */
function remapSideToHandle(currentHandle: string | null | undefined, newSide: string): string {
    return getBaseSide(currentHandle) === newSide && currentHandle ? currentHandle : `${newSide}-0`;
}

/**
 * Occupancy-aware side selection for a batch of freshly-built RF edges (load/import).
 *
 * computeOptimalHandles picks each edge's side from the dominant axis between the two node
 * centers alone, with no awareness of other edges on the same node — so two references from
 * the same source toward opposite targets can both land on the same side and cross. This
 * pass re-runs the occupancy-aware selector (computeBestAnchorsWithContext — the same
 * primitive used by onConnect and the drag hysteresis) over the whole set, feeding each
 * edge the edges already processed as occupancy context.
 *
 * Pure and deterministic: no side-effects / window / DOM / Redux; edges are processed in a
 * fixed (source, target, id) order. Explicit user pins (data.sourceAnchor/targetAnchor with
 * mode 'pinned') are skipped. Only the base side is decided here; an unchanged side keeps
 * its provisional index, a changed side restarts at 0 (portDistribution re-indexes later).
 */
export function selectOptimalSidesForEdges(edges: Edge[], nodes: Node[]): Edge[] {
    const nodeRects = new Map<string, NodeRect>();
    for (const n of nodes) nodeRects.set(n.id, getNodeRect(n));

    // Deterministic processing order so the incremental occupancy is reproducible.
    const ordered = [...edges].sort((a, b) =>
        a.source.localeCompare(b.source) ||
        a.target.localeCompare(b.target) ||
        a.id.localeCompare(b.id)
    );

    const existing: EdgeContext[] = [];
    const remapped = new Map<string, { sourceHandle: string; targetHandle: string }>();

    for (const edge of ordered) {
        const sourceRect = nodeRects.get(edge.source);
        const targetRect = nodeRects.get(edge.target);
        const data = edge.data as { sourceAnchor?: { mode?: string }; targetAnchor?: { mode?: string } } | undefined;
        const pinned = data?.sourceAnchor?.mode === 'pinned' || data?.targetAnchor?.mode === 'pinned';

        let sourceHandle: string | undefined = edge.sourceHandle ?? undefined;
        let targetHandle: string | undefined = edge.targetHandle ?? undefined;

        if (sourceRect && targetRect && !pinned) {
            const edgeType = edge.type === 'inheritance' ? 'inheritance' : 'reference';
            const best = computeBestAnchorsWithContext(sourceRect, targetRect, edge.source, edge.target, edgeType, existing);
            if (best && best.sourceHandle && best.targetHandle) {
                sourceHandle = remapSideToHandle(edge.sourceHandle, best.sourceHandle);
                targetHandle = remapSideToHandle(edge.targetHandle, best.targetHandle);
                if (sourceHandle !== (edge.sourceHandle ?? undefined) || targetHandle !== (edge.targetHandle ?? undefined)) {
                    remapped.set(edge.id, { sourceHandle, targetHandle });
                }
            } else {
                // Graceful fallback: keep the provisional side for this edge.
                console.warn('[selectOptimalSidesForEdges] no anchor result; keeping provisional side for edge', edge.id);
            }
        }

        // Occupancy context for subsequent edges uses this edge's resulting handles
        // (skipped / pinned edges still occupy their side).
        existing.push({ source: edge.source, target: edge.target, sourceHandle, targetHandle, type: edge.type });
    }

    if (remapped.size === 0) return edges;
    return edges.map(e => {
        const h = remapped.get(e.id);
        return h ? { ...e, sourceHandle: h.sourceHandle, targetHandle: h.targetHandle } : e;
    });
}

/**
 * Transform a JjOM edge (LEdge) into a React Flow Edge.
 * Returns null if the edge cannot be mapped.
 */
export function jjomEdgeToRFEdge(edge: any): Edge | null {
    if (!edge) {
        return null;
    }

    const startVertex = edge.start;
    const endVertex = edge.end;
    if (!startVertex?.id || !endVertex?.id) {
        return null;
    }

    // Compute optimal handle sides from vertex positions
    const isInheritance = !!edge.isExtend;
    const handles = computeOptimalHandles(startVertex, endVertex, isInheritance);

    // Check M1 instance edges FIRST — before isReference/isExtend.
    // M1 edges also have isReference === true but need different RF types
    // ('composition' / 'instanceRef') so that UnifiedEdge can suppress
    // diamonds and cardinality labels.
    const sourceModel = startVertex?.model;
    const sourceClassName = sourceModel?.className ?? sourceModel?.__raw?.className;
    if (sourceClassName === 'DObject') {
        // M1 edge — check if composition or reference
        const refModel = edge.model;
        const isComposition = !!refModel?.composition;
        const refName = refModel?.name ?? '';
        const refId = refModel?.id ?? edge.id;

        if (isComposition) {
            return {
                id: edge.id,
                source: startVertex.id,
                target: endVertex.id,
                sourceHandle: handles.sourceHandle,
                targetHandle: handles.targetHandle,
                type: 'composition',
                label: refName,
                data: {
                    referenceName: refName,
                    referenceId: refId,
                } as CompositionEdgeData,
            };
        }

        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: 'instanceRef',
            label: refName,
            data: {
                referenceName: refName,
                referenceId: refId,
            } as InstanceReferenceEdgeData,
        };
    }

    // Check isReference for M2 edges (DEdge.model points to a DReference).
    // isExtend can give false positives when the source class happens to extend another class.
    if (edge.isReference) {
        // Reference edge — extract info from the model (DReference)
        const refModel = edge.model;
        let kind: ReferenceKind = 'association';
        if (refModel?.composition) kind = 'composition';
        else if (refModel?.aggregation) kind = 'aggregation';

        const refData: ReferenceEdgeData = {
            reference: {
                id: refModel?.id ?? edge.id,
                name: refModel?.name ?? '',
                kind,
                targetClassId: endVertex.id,
                lowerBound: refModel?.lowerBound ?? 0,
                upperBound: refModel?.upperBound ?? -1,
                containment: !!refModel?.composition,
                opposite: refModel?.opposite?.name,
            },
            jjomRefId: refModel?.id,
        } as any;

        // Register in the stable module-level registry so commitLabel can
        // always find the DReference ID regardless of React state merges.
        if (refModel?.id) {
            setEdgeRefId(edge.id, refModel.id);
        }

        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: 'reference',
            label: refModel?.name ?? '',
            data: refData,
        };
    }

    if (edge.isExtend) {
        // Inheritance edge: source extends target
        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: 'inheritance',
            data: {} as InheritanceEdgeData,
        };
    }

    // Fallback: treat as a generic reference edge
    return {
        id: edge.id,
        source: startVertex.id,
        target: endVertex.id,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'reference',
        data: {
            reference: {
                id: edge.id,
                name: '',
                kind: 'association',
                targetClassId: endVertex.id,
                lowerBound: 0,
                upperBound: -1,
                containment: false,
            },
        } as ReferenceEdgeData,
    };
}

/**
 * Batch-transform all vertices and edges from a JjOM graph.
 */
export function transformJjomGraph(
    vertices: any[],
    edges: any[],
): { nodes: Node[]; edges: Edge[] } {
    const rfNodes: Node[] = [];
    for (const v of vertices) {
        const node = jjomVertexToRFNode(v);
        if (node) rfNodes.push(node);
    }

    const rfEdges: Edge[] = [];
    for (const e of edges) {
        const edge = jjomEdgeToRFEdge(e);
        if (edge) rfEdges.push(edge);
    }

    return { nodes: rfNodes, edges: rfEdges };
}
