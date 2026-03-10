/**
 * ELK-based auto-layout for Editor V2.
 *
 * Uses the ELK layered algorithm to compute hierarchical node positions.
 *
 * Layout strategy (adaptive):
 * - Inheritance edges ALWAYS drive the primary hierarchy (high priority →
 *   layer assignment mirrors inheritance depth).
 * - Reference/composition edge priority adapts to the graph content:
 *     • When inheritance edges exist: reference priority = 0 → they do NOT
 *       influence layer assignment, so the vertical hierarchy is driven
 *       exclusively by inheritance.
 *     • When NO inheritance edges exist: reference priority = 3 → they
 *       provide moderate directional structure (containers above contained
 *       elements) so the layout is not flat/arbitrary.
 *
 * elkjs is already a project dependency (^0.11.0).
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import type { Node, Edge } from '@xyflow/react';

const elk = new ELK();

export interface ElkLayoutOptions {
    /** Layout direction. Default: 'DOWN' (parent on top, children below). */
    direction?: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT';
    /** Spacing between sibling nodes (px). Default: 100. */
    spacing?: number;
    /** Spacing between layers (px). Default: 120. */
    layerSpacing?: number;
}

/**
 * Compute new node positions using ELK layered layout.
 *
 * Both inheritance and reference edges participate in the layout:
 *   - Inheritance edges have high priority (10) and are reversed so parents
 *     sit in upper layers with direction=DOWN.
 *   - Reference edge priority adapts: 0 when inheritance edges exist (so
 *     inheritance alone drives layers), 3 when no inheritance exists (so
 *     references provide basic vertical structure).
 *
 * @param nodes  Current React Flow nodes (uses uniform max dimensions for even spacing).
 * @param edges  Current React Flow edges.
 * @param options  Layout configuration.
 * @returns  New array of nodes with updated positions. Original nodes are not mutated.
 */
export async function computeElkLayout(
    nodes: Node[],
    edges: Edge[],
    options: ElkLayoutOptions = {},
): Promise<Node[]> {
    if (nodes.length === 0) return nodes;

    const { direction = 'DOWN', spacing = 100, layerSpacing = 120 } = options;

    // ── Uniform node sizing ────────────────────────────────────────────
    // Always use fixed default dimensions for ELK, ignoring measured sizes.
    // This produces evenly-spaced layouts identical to the Jjodie path
    // (where nodes aren't measured yet). Actual rendering uses real
    // dimensions — ELK only needs these for spacing calculations.
    const NODE_W = 180;
    const NODE_H = 120;

    const elkChildren = nodes.map(n => ({
        id: n.id,
        width: NODE_W,
        height: NODE_H,
    }));

    // Collect all node IDs for edge validation
    const nodeIdSet = new Set(nodes.map(n => n.id));

    // ── Adaptive priority strategy ──────────────────────────────────────
    // Check whether inheritance edges exist in the current graph.
    const hasInheritance = edges.some(
        e => e.type === 'inheritance'
            && nodeIdSet.has(e.source)
            && nodeIdSet.has(e.target),
    );

    // When inheritance exists, references must NOT compete with it for
    // layer assignment (priority 0). When there is no inheritance at all,
    // references provide moderate structure (priority 3) so the layout
    // isn't flat/random.
    const refPriority = hasInheritance ? '0' : '3';

    const elkEdges: ElkExtendedEdge[] = [];

    for (const e of edges) {
        // Skip orphan edges (source or target not in current graph)
        if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)) continue;

        if (e.type === 'inheritance') {
            // Inheritance: reversed so parent sits in upper layer.
            // High priority (10) → dominates layer assignment.
            elkEdges.push({
                id: e.id,
                sources: [e.target],  // parent
                targets: [e.source],  // child
                layoutOptions: { 'elk.layered.priority.direction': '10' },
            });
        } else {
            // Reference / composition / other: natural direction.
            // Priority adapts based on whether inheritance edges exist.
            elkEdges.push({
                id: e.id,
                sources: [e.source],
                targets: [e.target],
                layoutOptions: { 'elk.layered.priority.direction': refPriority },
            });
        }
    }

    const elkGraph: ElkNode = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': direction,
            // Node spacing within a layer (horizontal gap between siblings)
            'elk.spacing.nodeNode': String(spacing),
            // Spacing between layers (vertical gap parent ↔ child)
            'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
            // Edge-to-edge and edge-to-node spacing (reduces overlap)
            'elk.spacing.edgeEdge': '25',
            'elk.spacing.edgeNode': '30',
            // Canvas padding
            'elk.padding': '[top=50,left=50,bottom=50,right=50]',
            // Crossing minimisation
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
            // Node placement: NETWORK_SIMPLEX spreads nodes more evenly
            // and produces less compact (but clearer) layouts than BRANDES_KOEPF
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            // Consider model order for initial layer ordering
            'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        },
        children: elkChildren,
        edges: elkEdges,
    };

    const layout = await elk.layout(elkGraph);

    // Build a position lookup from the layout result
    const posMap = new Map<string, { x: number; y: number }>();
    for (const child of layout.children ?? []) {
        posMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
    }

    // Return new node objects with updated positions
    return nodes.map(n => {
        const pos = posMap.get(n.id);
        return pos ? { ...n, position: pos } : n;
    });
}
