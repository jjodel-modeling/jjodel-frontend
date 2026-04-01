/**
 * Polymetric Layouts — Layout algorithms for polymetric views.
 *
 * All layouts take PolymetricNodeData[] (with raw metrics) and return
 * the same array with x, y, width, height, and colorValue computed.
 */

import type { MetricKey, PolymetricNodeData, PolymetricViewConfig } from './polymetricViews';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_NODE_SIZE = 14;
const METRIC_SCALE = 5;
const MAX_NODE_SIZE = 80;
const GAP = 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function metricToPx(value: number | undefined): number {
    const raw = MIN_NODE_SIZE + (value ?? 0) * METRIC_SCALE;
    return Math.min(raw, MAX_NODE_SIZE);
}

/**
 * Normalize a set of values to [0, 1].
 * Returns a Map from node id to normalized value.
 */
function normalizeMetric(nodes: PolymetricNodeData[], metric: MetricKey): Map<string, number> {
    const result = new Map<string, number>();
    let min = Infinity, max = -Infinity;

    for (const n of nodes) {
        const v = n.metrics[metric] ?? 0;
        if (v < min) min = v;
        if (v > max) max = v;
    }

    const range = max - min;
    for (const n of nodes) {
        const v = n.metrics[metric] ?? 0;
        result.set(n.id, range > 0 ? (v - min) / range : 0.5);
    }

    return result;
}

// ---------------------------------------------------------------------------
// Apply dimensions + color normalization (shared pre-step)
// ---------------------------------------------------------------------------

function applyDimensions(
    nodes: PolymetricNodeData[],
    config: PolymetricViewConfig,
): void {
    const colorNorm = normalizeMetric(nodes, config.metrics.color);
    const widthNorm = normalizeMetric(nodes, config.metrics.width);
    const heightNorm = normalizeMetric(nodes, config.metrics.height);

    for (const n of nodes) {
        n.width = metricToPx(n.metrics[config.metrics.width]);
        n.height = metricToPx(n.metrics[config.metrics.height]);
        n.colorValue = colorNorm.get(n.id) ?? 0;
        n.normWidth = widthNorm.get(n.id) ?? 0;
        n.normHeight = heightNorm.get(n.id) ?? 0;
    }
}

// ---------------------------------------------------------------------------
// Checker layout
// ---------------------------------------------------------------------------

export function checkerLayout(
    nodes: PolymetricNodeData[],
    config: PolymetricViewConfig,
    canvasWidth: number = 800,
): PolymetricNodeData[] {
    applyDimensions(nodes, config);

    // Sort by sortBy metric descending
    if (config.sortBy) {
        const key = config.sortBy;
        nodes.sort((a, b) => (b.metrics[key] ?? 0) - (a.metrics[key] ?? 0));
    }

    // Simple row packing
    let x = GAP;
    let y = GAP;
    let rowHeight = 0;

    for (const n of nodes) {
        const w = n.width!;
        const h = n.height!;

        if (x + w > canvasWidth - GAP && x > GAP) {
            // New row
            x = GAP;
            y += rowHeight + GAP;
            rowHeight = 0;
        }

        n.x = x;
        n.y = y;
        x += w + GAP;
        if (h > rowHeight) rowHeight = h;
    }

    return nodes;
}

// ---------------------------------------------------------------------------
// Tree layout
// ---------------------------------------------------------------------------

interface TreeNode {
    data: PolymetricNodeData;
    children: TreeNode[];
    depth: number;
    subtreeWidth: number;
}

export function treeLayout(
    nodes: PolymetricNodeData[],
    config: PolymetricViewConfig,
): PolymetricNodeData[] {
    applyDimensions(nodes, config);

    if (nodes.length === 0) return nodes;

    // Build parent-child map
    const nodeMap = new Map<string, PolymetricNodeData>();
    for (const n of nodes) nodeMap.set(n.id, n);

    const childrenOf = new Map<string, string[]>();
    const hasParent = new Set<string>();

    for (const n of nodes) {
        if (n.parentId && nodeMap.has(n.parentId)) {
            hasParent.add(n.id);
            const existing = childrenOf.get(n.parentId) || [];
            existing.push(n.id);
            childrenOf.set(n.parentId, existing);
        }
    }

    // Roots = nodes without a parent (or parent not in this set)
    const rootIds = nodes.filter(n => !hasParent.has(n.id)).map(n => n.id);

    const LEVEL_HEIGHT = 70;
    const H_GAP = 12;

    // Build tree recursively
    function buildTree(id: string, depth: number): TreeNode {
        const data = nodeMap.get(id)!;
        const childIds = childrenOf.get(id) || [];
        const children = childIds.map(cid => buildTree(cid, depth + 1));

        const childrenWidth = children.length > 0
            ? children.reduce((sum, c) => sum + c.subtreeWidth, 0) + (children.length - 1) * H_GAP
            : 0;
        const subtreeWidth = Math.max(data.width! + H_GAP, childrenWidth);

        return { data, children, depth, subtreeWidth };
    }

    // Position tree nodes
    function positionTree(tree: TreeNode, startX: number): void {
        const nodeW = tree.data.width!;
        tree.data.y = tree.depth * LEVEL_HEIGHT + GAP;

        if (tree.children.length === 0) {
            tree.data.x = startX + (tree.subtreeWidth - nodeW) / 2;
            return;
        }

        // Position children first
        let cx = startX;
        for (const child of tree.children) {
            positionTree(child, cx);
            cx += child.subtreeWidth + H_GAP;
        }

        // Center parent above children
        const firstChild = tree.children[0].data;
        const lastChild = tree.children[tree.children.length - 1].data;
        const childrenCenter = (firstChild.x! + lastChild.x! + lastChild.width!) / 2;
        tree.data.x = childrenCenter - nodeW / 2;
    }

    // Layout all root trees side by side
    const trees = rootIds.map(id => buildTree(id, 0));
    let offsetX = GAP;
    for (const tree of trees) {
        positionTree(tree, offsetX);
        offsetX += tree.subtreeWidth + GAP * 3;
    }

    return nodes;
}

// ---------------------------------------------------------------------------
// Tree edges (for rendering)
// ---------------------------------------------------------------------------

export interface TreeEdge {
    sourceId: string;
    targetId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * Compute edges for tree layout (parent->child lines).
 * Call after treeLayout has set x/y/width/height on nodes.
 */
export function computeTreeEdges(nodes: PolymetricNodeData[]): TreeEdge[] {
    const nodeMap = new Map<string, PolymetricNodeData>();
    for (const n of nodes) nodeMap.set(n.id, n);

    const edges: TreeEdge[] = [];
    for (const n of nodes) {
        if (n.parentId && nodeMap.has(n.parentId)) {
            const parent = nodeMap.get(n.parentId)!;
            edges.push({
                sourceId: parent.id,
                targetId: n.id,
                x1: parent.x! + parent.width! / 2,
                y1: parent.y! + parent.height!,
                x2: n.x! + n.width! / 2,
                y2: n.y!,
            });
        }
    }
    return edges;
}

// ---------------------------------------------------------------------------
// Scatterplot layout
// ---------------------------------------------------------------------------

export function scatterplotLayout(
    nodes: PolymetricNodeData[],
    config: PolymetricViewConfig,
    canvasW: number = 800,
    canvasH: number = 600,
): PolymetricNodeData[] {
    applyDimensions(nodes, config);

    if (nodes.length === 0) return nodes;

    const margin = 60;
    const plotW = canvasW - margin * 2;
    const plotH = canvasH - margin * 2;

    const posXKey = config.metrics.posX!;
    const posYKey = config.metrics.posY!;

    const xNorm = normalizeMetric(nodes, posXKey);
    const yNorm = normalizeMetric(nodes, posYKey);

    // Pseudo-random jitter for overlapping positions
    let jitterSeed = 42;
    function jitter(): number {
        jitterSeed = (jitterSeed * 1103515245 + 12345) & 0x7fffffff;
        return ((jitterSeed % 7) - 3); // -3 to +3
    }

    for (const n of nodes) {
        const nx = xNorm.get(n.id) ?? 0.5;
        const ny = yNorm.get(n.id) ?? 0.5;

        n.x = margin + nx * plotW - n.width! / 2 + jitter();
        // Invert Y so high values are at the top
        n.y = margin + (1 - ny) * plotH - n.height! / 2 + jitter();
    }

    return nodes;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/**
 * Apply the appropriate layout based on the view config.
 */
export function applyLayout(
    nodes: PolymetricNodeData[],
    config: PolymetricViewConfig,
    canvasW?: number,
    canvasH?: number,
): PolymetricNodeData[] {
    switch (config.layout) {
        case 'checker':
            return checkerLayout(nodes, config, canvasW);
        case 'tree':
            return treeLayout(nodes, config);
        case 'scatterplot':
            return scatterplotLayout(nodes, config, canvasW, canvasH);
        default:
            return checkerLayout(nodes, config, canvasW);
    }
}
