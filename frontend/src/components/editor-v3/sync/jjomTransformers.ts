/**
 * Editor V3 — JjOM → React Flow transformers.
 *
 * Pure functions that convert JjOM graph elements (DVertex/DEdge accessed
 * through L-proxies) into React Flow Node<ModelNodeData> / Edge<UnifiedEdgeData>.
 *
 * Key difference from V2: single node type (ModelNode) with unified ModelNodeData.
 * The `modelSnapshot` discriminated union captures per-type data.
 */

import type { Node, Edge } from '@xyflow/react';
import type {
    ModelNodeData,
    UnifiedEdgeData,
    ModelSnapshot,
    ClassSnapshot,
    EnumSnapshot,
    ObjectSnapshot,
    PackageSnapshot,
    DataTypeSnapshot,
    AttributeInfo,
    ReferenceInfo,
    OperationInfo,
    ParameterInfo,
    LiteralInfo,
    FeatureValueInfo,
    NotationMode,
    ColorScheme,
    ThemeMode,
    AnchorConfig,
    V3Node,
    V3Edge,
} from '../types';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../constants';
import { setEdgeModelId } from './syncCoordinator';

// ---------------------------------------------------------------------------
// Vertex → RF Node transformers
// ---------------------------------------------------------------------------

/**
 * Extract a ClassSnapshot from an LClass proxy.
 */
function buildClassSnapshot(lClass: any): ClassSnapshot {
    const attributes: AttributeInfo[] = [];
    const references: ReferenceInfo[] = [];
    const operations: OperationInfo[] = [];
    const superclassNames: string[] = [];

    try {
        for (const attr of (lClass?.attributes ?? [])) {
            attributes.push({
                id: attr.id ?? `attr_${attributes.length}`,
                name: attr.name ?? 'unnamed',
                type: attr.type?.name ?? 'EString',
                typeId: attr.type?.id ?? '',
                defaultValue: attr.defaultValueLiteral || '',
                lowerBound: attr.lowerBound ?? 0,
                upperBound: attr.upperBound ?? 1,
            });
        }
    } catch { /* proxy access can throw if data is stale */ }

    try {
        for (const ref of (lClass?.references ?? [])) {
            let kind: 'association' | 'composition' | 'aggregation' = 'association';
            if (ref.composition) kind = 'composition';
            else if (ref.aggregation) kind = 'aggregation';

            references.push({
                id: ref.id ?? `ref_${references.length}`,
                name: ref.name ?? 'unnamed',
                targetClassName: ref.type?.name ?? '',
                targetClassId: ref.type?.id ?? '',
                kind,
                lowerBound: ref.lowerBound ?? 0,
                upperBound: ref.upperBound ?? -1,
                containment: !!ref.composition,
                opposite: ref.opposite?.name ?? null,
            });
        }
    } catch { /* proxy access can throw */ }

    try {
        for (const op of (lClass?.operations ?? [])) {
            const params: ParameterInfo[] = [];
            try {
                for (const p of (op.parameters ?? [])) {
                    params.push({
                        id: p.id ?? `param_${params.length}`,
                        name: p.name ?? 'unnamed',
                        type: p.type?.name ?? 'EString',
                    });
                }
            } catch { /* ignore */ }

            operations.push({
                id: op.id ?? `op_${operations.length}`,
                name: op.name ?? 'unnamed',
                returnType: op.type?.name ?? 'void',
                parameters: params,
            });
        }
    } catch { /* proxy access can throw */ }

    try {
        const supers = lClass?.extends ?? lClass?.superClasses ?? [];
        for (const sup of supers) {
            const name = typeof sup === 'string' ? sup : sup?.name;
            if (name) superclassNames.push(name);
        }
    } catch { /* ignore */ }

    return {
        kind: 'class',
        isAbstract: !!lClass?.abstract,
        isInterface: !!lClass?.interface,
        attributes,
        references,
        operations,
        superclassNames,
    };
}

/**
 * Extract an EnumSnapshot from an LEnumerator proxy.
 */
function buildEnumSnapshot(lEnum: any): EnumSnapshot {
    const literals: LiteralInfo[] = [];

    try {
        for (let i = 0; i < (lEnum?.literals ?? []).length; i++) {
            const lit = lEnum.literals[i];
            literals.push({
                id: lit.id ?? `lit_${i}`,
                name: lit.name ?? `VALUE_${i}`,
                value: lit.value ?? i,
            });
        }
    } catch { /* proxy access can throw */ }

    return { kind: 'enum', literals };
}

/**
 * Extract an ObjectSnapshot from an LObject proxy (M1 instances).
 */
function buildObjectSnapshot(lObject: any): ObjectSnapshot {
    const features: FeatureValueInfo[] = [];

    try {
        const instanceOf = lObject?.instanceof;
        const featureValues = lObject?.features ?? [];

        for (const fv of featureValues) {
            const feature = fv?.feature;
            features.push({
                id: fv.id ?? `fv_${features.length}`,
                featureName: feature?.name ?? 'unnamed',
                featureKind: feature?.className === 'DReference' ? 'reference' : 'attribute',
                featureTypeId: feature?.type?.id ?? '',
                values: fv.values ?? [],
                resolvedNames: fv.resolvedNames,
            });
        }

        return {
            kind: 'object',
            instanceOfClassName: instanceOf?.name ?? 'Object',
            instanceOfClassId: instanceOf?.id ?? '',
            features,
        };
    } catch {
        return {
            kind: 'object',
            instanceOfClassName: 'Object',
            instanceOfClassId: '',
            features: [],
        };
    }
}

/**
 * Extract a PackageSnapshot from an LPackage proxy.
 */
function buildPackageSnapshot(lPackage: any): PackageSnapshot {
    let childCount = 0;
    try {
        childCount = (lPackage?.classes?.length ?? 0)
            + (lPackage?.enumerators?.length ?? 0)
            + (lPackage?.packages?.length ?? 0);
    } catch { /* ignore */ }

    return { kind: 'package', childCount };
}

/**
 * Extract anchor data from a DVertex (JjOM named anchors as percentages).
 */
function extractAnchors(vertex: any): Record<string, { x: number; y: number }> {
    const anchors: Record<string, { x: number; y: number }> = {};
    try {
        const raw = vertex?.anchors ?? vertex?.__raw?.anchors;
        if (raw && typeof raw === 'object') {
            for (const [name, point] of Object.entries(raw)) {
                const p = point as any;
                if (p && typeof p.x === 'number' && typeof p.y === 'number') {
                    anchors[name] = { x: p.x, y: p.y };
                }
            }
        }
    } catch { /* ignore */ }
    return anchors;
}

/**
 * Extract CSS state from DVertex.state dictionary.
 */
function extractCssState(vertex: any): Record<string, string | number> {
    const state: Record<string, string | number> = {};
    try {
        const raw = vertex?.state ?? vertex?.__raw?.state;
        if (raw && typeof raw === 'object') {
            for (const [key, val] of Object.entries(raw)) {
                if (typeof val === 'string' || typeof val === 'number') {
                    state[key] = val;
                }
            }
        }
    } catch { /* ignore */ }
    return state;
}

// ---------------------------------------------------------------------------
// Defaults for rendering context (overridden by EditorV3Context in components)
// ---------------------------------------------------------------------------

const DEFAULT_NOTATION: NotationMode = 'uml';
const DEFAULT_COLOR_SCHEME: ColorScheme = 'default';
const DEFAULT_THEME: ThemeMode = 'light';

// ---------------------------------------------------------------------------
// Main vertex transformer
// ---------------------------------------------------------------------------

/**
 * Transform a single JjOM vertex (LVertex) into a React Flow Node<ModelNodeData>.
 * Returns null if the vertex type is not recognized or has no model.
 */
export function jjomVertexToV3Node(
    vertex: any,
    notation: NotationMode = DEFAULT_NOTATION,
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
    theme: ThemeMode = DEFAULT_THEME,
): V3Node | null {
    const model = vertex?.model;
    if (!model) return null;

    const className: string = model.className ?? model.__raw?.className ?? '';

    let modelSnapshot: ModelSnapshot;
    let modelClassName: ModelNodeData['modelClassName'];

    switch (className) {
        case 'DClass':
            modelSnapshot = buildClassSnapshot(model);
            modelClassName = 'DClass';
            break;
        case 'DEnumerator':
            modelSnapshot = buildEnumSnapshot(model);
            modelClassName = 'DEnumerator';
            break;
        case 'DObject':
            modelSnapshot = buildObjectSnapshot(model);
            modelClassName = 'DObject';
            break;
        case 'DPackage':
            modelSnapshot = buildPackageSnapshot(model);
            modelClassName = 'DPackage';
            break;
        default:
            // Unknown type — skip
            return null;
    }

    // LProxy may return objects for x/y/w/h — use __raw for reliable numeric access
    const raw = vertex.__raw ?? vertex;
    const w = (typeof raw.w === 'number' ? raw.w : null) ?? DEFAULT_NODE_WIDTH;
    const h = (typeof raw.h === 'number' ? raw.h : null) ?? DEFAULT_NODE_HEIGHT;
    const isResized = vertex.isResized ?? false;
    const isDGraphVertex = !!(vertex.__isDGraphVertex || vertex.__isDGraph);

    const nodeData: ModelNodeData = {
        modelElementId: model.id ?? vertex.model ?? '',
        modelClassName,
        viewId: vertex.view ?? null,
        isResized,
        width: w,
        height: h,
        anchors: extractAnchors(vertex),
        cssState: extractCssState(vertex),
        zIndex: vertex.zIndex ?? 100,
        zoom: vertex.zoom ?? { x: 1, y: 1 },
        label: model.name ?? className.replace('D', ''),
        modelSnapshot,
        notation,
        colorScheme,
        theme,
        isGraphVertex: isDGraphVertex || undefined,
        isExpanded: isDGraphVertex ? false : undefined,
    };

    return {
        id: vertex.id,
        type: 'modelNode',
        position: {
            x: typeof raw.x === 'number' ? raw.x : 0,
            y: typeof raw.y === 'number' ? raw.y : 0,
        },
        style: className === 'DPackage' ? { zIndex: -1, width: w, height: h } : undefined,
        data: nodeData,
    };
}

// ---------------------------------------------------------------------------
// Edge transformer
// ---------------------------------------------------------------------------

/**
 * Compute optimal source/target handle sides based on vertex positions.
 * Inheritance: strongly prefer vertical routing (child top → parent bottom).
 */
function computeOptimalHandles(
    sourceVertex: any,
    targetVertex: any,
    isInheritance: boolean = false,
): { sourceHandle: string; targetHandle: string } {
    const sr = sourceVertex.__raw ?? sourceVertex;
    const tr = targetVertex.__raw ?? targetVertex;
    const sx = (typeof sr.x === 'number' ? sr.x : null) ?? 0;
    const sy = (typeof sr.y === 'number' ? sr.y : null) ?? 0;
    const sw = (typeof sr.w === 'number' ? sr.w : null) ?? DEFAULT_NODE_WIDTH;
    const sh = (typeof sr.h === 'number' ? sr.h : null) ?? DEFAULT_NODE_HEIGHT;
    const tx = (typeof tr.x === 'number' ? tr.x : null) ?? 0;
    const ty = (typeof tr.y === 'number' ? tr.y : null) ?? 0;
    const tw = (typeof tr.w === 'number' ? tr.w : null) ?? DEFAULT_NODE_WIDTH;
    const th = (typeof tr.h === 'number' ? tr.h : null) ?? DEFAULT_NODE_HEIGHT;

    const scx = sx + sw / 2;
    const scy = sy + sh / 2;
    const tcx = tx + tw / 2;
    const tcy = ty + th / 2;

    const dx = tcx - scx;
    const dy = tcy - scy;

    if (isInheritance) {
        if (Math.abs(dy) < 30 && Math.abs(dx) > 50) {
            return dx > 0
                ? { sourceHandle: 'right-0', targetHandle: 'left-0' }
                : { sourceHandle: 'left-0', targetHandle: 'right-0' };
        }
        return dy < 0
            ? { sourceHandle: 'top-0', targetHandle: 'bottom-0' }
            : { sourceHandle: 'bottom-0', targetHandle: 'top-0' };
    }

    if (Math.abs(dy) >= Math.abs(dx)) {
        return dy < 0
            ? { sourceHandle: 'top-0', targetHandle: 'bottom-0' }
            : { sourceHandle: 'bottom-0', targetHandle: 'top-0' };
    }
    return dx > 0
        ? { sourceHandle: 'right-0', targetHandle: 'left-0' }
        : { sourceHandle: 'left-0', targetHandle: 'right-0' };
}

/**
 * Transform a JjOM edge (LEdge) into a React Flow Edge<UnifiedEdgeData>.
 * Returns null if the edge cannot be mapped.
 */
export function jjomEdgeToV3Edge(
    edge: any,
    notation: NotationMode = DEFAULT_NOTATION,
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
    theme: ThemeMode = DEFAULT_THEME,
): V3Edge | null {
    if (!edge) return null;

    const startVertex = edge.start;
    const endVertex = edge.end;
    if (!startVertex?.id || !endVertex?.id) return null;

    const isInheritance = !!edge.isExtend;
    const isReference = !!edge.isReference;
    const isInstanceLink = !!edge.isInstanceLink || !!edge.isValue;
    const handles = computeOptimalHandles(startVertex, endVertex, isInheritance);

    const defaultAnchor: AnchorConfig = { mode: 'auto', side: 'top' };

    // M1: instance link (DValue reference between DObjects)
    if (isInstanceLink) {
        const valueModel = edge.model;
        const edgeData: UnifiedEdgeData = {
            edgeKind: 'instanceLink',
            jjomEdgeId: edge.id,
            jjomModelId: valueModel?.id ?? null,
            label: valueModel?.feature?.name ?? '',
            waypoints: [],
            sourceAnchor: { ...defaultAnchor, side: handles.sourceHandle.split('-')[0] as any },
            targetAnchor: { ...defaultAnchor, side: handles.targetHandle.split('-')[0] as any },
            notation,
            colorScheme,
            theme,
        };

        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: 'unifiedEdge',
            data: edgeData,
        };
    }

    if (isReference) {
        const refModel = edge.model;
        let edgeKind: UnifiedEdgeData['edgeKind'] = 'reference';
        if (refModel?.composition) edgeKind = 'composition';
        else if (refModel?.aggregation) edgeKind = 'aggregation';

        // Register in the stable module-level registry
        if (refModel?.id) {
            setEdgeModelId(edge.id, refModel.id);
        }

        const edgeData: UnifiedEdgeData = {
            edgeKind,
            jjomEdgeId: edge.id,
            jjomModelId: refModel?.id ?? null,
            label: refModel?.name ?? '',
            sourceCardinality: undefined,
            targetCardinality: refModel
                ? `${refModel.lowerBound ?? 0}..${refModel.upperBound === -1 ? '*' : refModel.upperBound ?? 1}`
                : undefined,
            waypoints: [],
            sourceAnchor: { ...defaultAnchor, side: handles.sourceHandle.split('-')[0] as any },
            targetAnchor: { ...defaultAnchor, side: handles.targetHandle.split('-')[0] as any },
            notation,
            colorScheme,
            theme,
        };

        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: 'unifiedEdge',
            label: refModel?.name ?? '',
            data: edgeData,
        };
    }

    if (isInheritance) {
        const edgeData: UnifiedEdgeData = {
            edgeKind: 'inheritance',
            jjomEdgeId: edge.id,
            jjomModelId: null,
            label: '',
            waypoints: [],
            sourceAnchor: { ...defaultAnchor, side: handles.sourceHandle.split('-')[0] as any },
            targetAnchor: { ...defaultAnchor, side: handles.targetHandle.split('-')[0] as any },
            notation,
            colorScheme,
            theme,
        };

        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: 'unifiedEdge',
            data: edgeData,
        };
    }

    // Fallback: generic reference edge
    const edgeData: UnifiedEdgeData = {
        edgeKind: 'reference',
        jjomEdgeId: edge.id,
        jjomModelId: null,
        label: '',
        waypoints: [],
        sourceAnchor: { ...defaultAnchor, side: handles.sourceHandle.split('-')[0] as any },
        targetAnchor: { ...defaultAnchor, side: handles.targetHandle.split('-')[0] as any },
        notation,
        colorScheme,
        theme,
    };

    return {
        id: edge.id,
        source: startVertex.id,
        target: endVertex.id,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'unifiedEdge',
        data: edgeData,
    };
}

// ---------------------------------------------------------------------------
// Batch transformer
// ---------------------------------------------------------------------------

/**
 * Batch-transform all vertices and edges from a JjOM graph.
 */
export function transformJjomGraph(
    vertices: any[],
    edges: any[],
    notation?: NotationMode,
    colorScheme?: ColorScheme,
    theme?: ThemeMode,
): { nodes: V3Node[]; edges: V3Edge[] } {
    const rfNodes: V3Node[] = [];
    for (const v of vertices) {
        const node = jjomVertexToV3Node(v, notation, colorScheme, theme);
        if (node) rfNodes.push(node);
    }

    const nodeIds = new Set(rfNodes.map(n => n.id));
    const rfEdges: V3Edge[] = [];
    for (const e of edges) {
        const edge = jjomEdgeToV3Edge(e, notation, colorScheme, theme);
        // Skip orphan edges (source/target vertex not in graph)
        if (edge && nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
            rfEdges.push(edge);
        }
    }

    return { nodes: rfNodes, edges: rfEdges };
}
