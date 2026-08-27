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
import type {
    ClassNodeData,
    GhostParentInfo,
    GhostTargetInfo,
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
import { displayTypeLabel } from '../types';
import { readVertexLayout, type VertexLayout, type VertexLayoutSource } from '../viewpoint/layout/vertexLayout';
import { getActiveLayoutKey } from '../viewpoint/layout/vertexLayoutAdapter';
import { chooseEdgeSides } from './edgeRouting';

// L-proxy types — using `any` for property access to avoid coupling to
// the exact proxy shape which uses runtime magic getters.
// The property names are documented and stable.

/**
 * Effective layout of a vertex: the record of the layout in force — the active exclusive
 * viewpoint, or abstract syntax, which has a record of its own and is not a special case. A
 * layout with no record yet falls back to the seed, i.e. the scalars the vertex was born with
 * (read-through, R-LAY-15 as rectified 2026-08-24). EVERY geometry read in this
 * file goes through here — positions, sizes, and the geometry `computeOptimalHandles` uses to
 * pick anchors — so a node never ends up placed on one record and anchored on the other.
 *
 * `raw` is the D-object (`vertex.__raw ?? vertex`), which satisfies `VertexLayoutSource`
 * structurally. Missing or non-numeric fields are NOT patched here: the callers' existing
 * `typeof … === 'number'` guards and defaults keep working exactly as before — and a nullish
 * `raw` (computeOptimalHandles can be handed an unresolved endpoint) yields an all-undefined
 * record, which those same guards turn into the very defaults the `sRaw?.x` form used to give.
 */
function effectiveLayoutOf(raw: any): VertexLayout {
    return readVertexLayout((raw ?? {}) as VertexLayoutSource, getActiveLayoutKey());
}

/**
 * Explicit node dimensions for a manually-resized vertex, or {} for
 * content-driven auto-sizing.
 *
 * Gate on `isResized` (not on w/h presence): every DVertex is created with
 * default w/h, so restoring them unconditionally would freeze auto-sized
 * nodes at the default size. `isResized` is raised by syncSizeToJjom on a
 * NodeResizer drag and cleared by syncSizeResetToJjom ("Reset size"), so a
 * resized class/enum/object node reloads at its persisted dimensions —
 * top-level width/height, the same fields a NodeResizer drag writes via
 * applyNodeChanges (and the same ones resetNodeSize drops).
 */
function manualSizeOf(raw: any): { width?: number; height?: number } {
    if (!raw) return {};
    // Per-layout read-through: `isResized` and w/h are read off the SAME record, never mixed
    // between a layout record and the seed (the fallback is per record, R-LAY-15). Sizes are
    // therefore independent per layout, "Reset size" included.
    const eff = effectiveLayoutOf(raw);
    if (!eff.isResized) return {};
    const w = typeof eff.w === 'number' && eff.w > 0 ? eff.w : undefined;
    const h = typeof eff.h === 'number' && eff.h > 0 ? eff.h : undefined;
    if (w === undefined || h === undefined) return {};
    return { width: w, height: h };
}

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
                type: displayTypeLabel(attr.type?.name ?? 'EString'),
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
                        type: displayTypeLabel(p.type?.name ?? 'EString'),
                    });
                }
            } catch { /* ignore */ }

            ops.push({
                id: op.id ?? `op_${ops.length}`,
                name: op.name ?? 'unnamed',
                returnType: displayTypeLabel(op.type?.name ?? 'void'),
                parameters: params,
            });
        }
    } catch { /* proxy access can throw */ }

    // Cross-metamodel parents (extends pointing to a class in another metamodel).
    // Rendered as an in-node "ghost parent" overlay by ClassNode — no real edge/node.
    const ghostParents: GhostParentInfo[] = [];
    const ghostParentOffsetsRaw = (vertex.__raw ?? vertex).ghostParentOffsets;
    try {
        for (const p of (lClass?.extends ?? [])) {
            if (p?.model && p.model.id !== lClass.model.id) {
                ghostParents.push({
                    id: p.id,
                    name: p.name,
                    metamodelName: p.model.name,
                    fullname: p.fullname,
                    offset: ghostParentOffsetsRaw?.[p.id],
                });
            }
        }
    } catch { /* proxy access can throw if data is stale */ }

    // Cross-metamodel reference targets (type pointing to a class in another
    // metamodel). Rendered as an in-node "ghost target" stub by ClassNode — no
    // real edge (the leftover self-loop edge is suppressed in jjomEdgeToRFEdge).
    const ghostTargets: GhostTargetInfo[] = [];
    const ghostOffsetsRaw = (vertex.__raw ?? vertex).ghostOffsets;
    try {
        for (const ref of (lClass?.references ?? [])) {
            const t = ref?.type;
            if (t?.model && t.model.id !== lClass.model.id) {
                const lower = ref.lowerBound ?? 0;
                const upper = ref.upperBound ?? -1;
                ghostTargets.push({
                    refName: ref.name ?? '',
                    targetName: t.name,
                    targetMetamodel: t.model.name,
                    cardinality: `${lower}..${upper === -1 ? '*' : upper}`,
                    targetFullname: t.fullname,
                    refId: ref.id,
                    offset: ghostOffsetsRaw?.[ref.id],
                });
            }
        }
    } catch { /* proxy access can throw if data is stale */ }

    // Use __raw for reliable numeric coordinates (LProxy gotcha:
    // proxy getters return {} instead of numbers when stale)
    const raw = vertex.__raw ?? vertex;
    const eff = effectiveLayoutOf(raw);
    const x = typeof eff.x === 'number' ? eff.x : 0;
    const y = typeof eff.y === 'number' ? eff.y : 0;

    // console.log('[DEBUG classVertexToRFNode] x:', x, 'y:', y, 'raw:', raw?.x, raw?.y, 'id:', vertex.id);



    return {
        id: vertex.id,
        type: 'classNode',
        position: { x, y },
        ...manualSizeOf(raw),
        data: {
            label: lClass?.name ?? 'Class',
            isAbstract: !!lClass?.abstract,
            isSingleton: !!lClass?.isSingleton,
            attributes: attrs,
            references: refs.length > 0 ? refs : undefined,
            operations: ops.length > 0 ? ops : undefined,
            ghostParents: ghostParents.length > 0 ? ghostParents : undefined,
            ghostTargets: ghostTargets.length > 0 ? ghostTargets : undefined,
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
    const eff = effectiveLayoutOf(raw);
    const x = typeof eff.x === 'number' ? eff.x : 0;
    const y = typeof eff.y === 'number' ? eff.y : 0;

    return {
        id: vertex.id,
        type: 'enumNode',
        position: { x, y },
        ...manualSizeOf(raw),
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
    const eff = effectiveLayoutOf(raw);
    const x = typeof eff.x === 'number' ? eff.x : 0;
    const y = typeof eff.y === 'number' ? eff.y : 0;
    // Same record as the position above: a package moved AND resized under a viewpoint
    // must not show that viewpoint's position with the abstract syntax's size.
    const w = typeof eff.w === 'number' ? eff.w : 400;
    const h = typeof eff.h === 'number' ? eff.h : 300;

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
    const eff = effectiveLayoutOf(raw);
    const x = typeof eff.x === 'number' ? eff.x : 0;
    const y = typeof eff.y === 'number' ? eff.y : 0;

    return {
        id: vertex.id,
        type: 'objectNode',
        position: { x, y },
        ...manualSizeOf(raw),
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
 *
 * Per i reference, dal 2026-08-27 la scelta e' la stessa di `useAutoAnchor`:
 * `edgeRouting.chooseEdgeSides`, minimo di svolte e poi lunghezza sui sedici
 * accoppiamenti. Le due sedi devono concordare, altrimenti un progetto mostra lati
 * diversi appena caricato e lati diversi dopo il primo trascinamento.
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
    // Anchors are picked from the SAME geometry the nodes are placed on: reading the
    // scalars here while the nodes sit on a viewpoint record would anchor edges on the
    // wrong side without moving a single node.
    const sEff = effectiveLayoutOf(sRaw);
    const tEff = effectiveLayoutOf(tRaw);
    const sx = typeof sEff?.x === 'number' ? sEff.x : 0;
    const sy = typeof sEff?.y === 'number' ? sEff.y : 0;
    const sw = typeof sEff?.w === 'number' ? sEff.w : 180;
    const sh = typeof sEff?.h === 'number' ? sEff.h : 80;
    const tx = typeof tEff?.x === 'number' ? tEff.x : 0;
    const ty = typeof tEff?.y === 'number' ? tEff.y : 0;
    const tw = typeof tEff?.w === 'number' ? tEff.w : 180;
    const th = typeof tEff?.h === 'number' ? tEff.h : 80;

    if (isInheritance) {
        // Inheritance always anchors child=top, parent=bottom
        // (consistent with EditorV2 creation and useAutoAnchor hysteresis)
        return { sourceHandle: 'top-0', targetHandle: 'bottom-0' };
    }

    // Non-inheritance: minimo di svolte, poi lunghezza.
    const chosen = chooseEdgeSides(
        { x: sx, y: sy, width: sw, height: sh },
        { x: tx, y: ty, width: tw, height: th },
    );
    return { sourceHandle: `${chosen.sourceSide}-0`, targetHandle: `${chosen.targetSide}-0` };
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

        // Suppress cross-metamodel references: their target lives in another
        // metamodel (off-canvas) and is shown as an in-node ghost-target stub,
        // not an edge. Decide on the CURRENT type (refModel.type), NOT edge.end
        // (cached/stale). A legitimate self-loop is same-metamodel → not cross,
        // so it is never suppressed here. See discovery 2026-05-30 ghost-target.
        try {
            const refTypeModelId = refModel?.type?.model?.id;
            const srcModelId = sourceModel?.model?.id;
            if (refTypeModelId && srcModelId && refTypeModelId !== srcModelId) {
                return null;
            }
        } catch { /* on proxy error fall through and render normally */ }

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
            reconnectable: 'target',   // only the target endpoint is grabbable (re-target via drag)
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
