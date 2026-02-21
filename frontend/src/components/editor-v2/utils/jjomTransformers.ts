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
    EnumNodeData,
    PackageNodeData,
    MetaAttribute,
    MetaLiteral,
    MetaReference,
    MetaOperation,
    MetaParameter,
    ReferenceEdgeData,
    InheritanceEdgeData,
    ReferenceKind,
} from '../types';

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

    return {
        id: vertex.id,
        type: 'classNode',
        position: { x: vertex.x ?? 0, y: vertex.y ?? 0 },
        data: {
            label: lClass?.name ?? 'Class',
            isAbstract: !!lClass?.abstract,
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

    return {
        id: vertex.id,
        type: 'enumNode',
        position: { x: vertex.x ?? 0, y: vertex.y ?? 0 },
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
    return {
        id: vertex.id,
        type: 'packageNode',
        position: { x: vertex.x ?? 0, y: vertex.y ?? 0 },
        style: {
            zIndex: -1,
            width: vertex.w ?? 400,
            height: vertex.h ?? 300,
        },
        data: {
            label: lPackage?.name ?? 'Package',
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
        default:
            // Unknown type — skip (could be DObject in model instances, etc.)
            return null;
    }
}

/**
 * Transform a JjOM edge (LEdge) into a React Flow Edge.
 * Returns null if the edge cannot be mapped.
 */
export function jjomEdgeToRFEdge(edge: any): Edge | null {
    if (!edge) return null;

    const startVertex = edge.start;
    const endVertex = edge.end;
    if (!startVertex?.id || !endVertex?.id) return null;

    if (edge.isExtend) {
        // Inheritance edge: source extends target
        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            type: 'inheritance',
            data: {} as InheritanceEdgeData,
        };
    }

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
        };

        return {
            id: edge.id,
            source: startVertex.id,
            target: endVertex.id,
            type: 'reference',
            label: refModel?.name ?? '',
            data: refData,
        };
    }

    // Fallback: treat as a generic reference edge
    return {
        id: edge.id,
        source: startVertex.id,
        target: endVertex.id,
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
