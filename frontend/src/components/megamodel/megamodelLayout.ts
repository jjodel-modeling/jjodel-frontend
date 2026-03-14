/**
 * Megamodel Layout — Dagre-based auto-layout for the Megamodel diagram.
 *
 * Uses @dagrejs/dagre to compute a layered (DAG) layout that respects the
 * natural hierarchy: metamodels at top, models in the middle, transformations
 * at bottom. Only structural edges (conformsTo, generatedBy, sourceOf) drive
 * the hierarchy; type-level edges (inputOf, outputOf) are excluded from layout
 * to avoid confusing cross-layer connections.
 */

import dagre from '@dagrejs/dagre';
import type { MmNode, MmEdge, MmEdgeType } from './MegamodelEdge';
import { NODE_W, NODE_H } from './MegamodelEdge';

// ─── Configuration ───────────────────────────────────────────────────────────

interface LayoutOptions {
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    rankSep?: number;
    nodeSep?: number;
    edgeSep?: number;
    marginX?: number;
    marginY?: number;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
    direction: 'TB',
    rankSep: 80,
    nodeSep: 40,
    edgeSep: 20,
    marginX: 40,
    marginY: 40,
};

// Edge types that define vertical hierarchy (used for dagre layout)
const STRUCTURAL_EDGE_TYPES: Set<MmEdgeType> = new Set([
    'conformsTo',
    'generatedBy',
    'sourceOf',
]);

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compute positions for megamodel nodes using dagre layered layout.
 * Returns a Map of nodeId → { x, y } (top-left corner coordinates).
 */
export function computeDagreLayout(
    nodes: MmNode[],
    edges: MmEdge[],
    options?: LayoutOptions,
): Map<string, { x: number; y: number }> {
    if (nodes.length === 0) return new Map();

    const opts = { ...DEFAULT_OPTIONS, ...options };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: opts.direction,
        ranksep: opts.rankSep,
        nodesep: opts.nodeSep,
        edgesep: opts.edgeSep,
        marginx: opts.marginX,
        marginy: opts.marginY,
    });

    // Add nodes with dimensions
    for (const node of nodes) {
        g.setNode(node.id, { width: NODE_W, height: NODE_H });
    }

    // Add only structural edges for hierarchy
    for (const edge of edges) {
        if (STRUCTURAL_EDGE_TYPES.has(edge.type)) {
            g.setEdge(edge.from, edge.to);
        }
    }

    // Compute layout
    dagre.layout(g);

    // Extract positions (dagre returns center, we need top-left)
    const positions = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
        const dagreNode = g.node(node.id);
        if (dagreNode) {
            positions.set(node.id, {
                x: dagreNode.x - NODE_W / 2,
                y: dagreNode.y - NODE_H / 2,
            });
        }
    }

    return positions;
}
