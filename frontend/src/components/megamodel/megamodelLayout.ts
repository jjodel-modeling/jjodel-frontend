/**
 * Megamodel Layout — Transformation-centric auto-layout.
 *
 * Places nodes in a left-to-right flow:
 *   LEFT: source metamodels + their conforming models
 *   CENTER: transformations
 *   RIGHT: target metamodels + their conforming/generated models
 *
 * Falls back to dagre when no transformations exist.
 */

import dagre from '@dagrejs/dagre';
import type { MmNode, MmEdge, MmEdgeType } from './MegamodelEdge';
import { NODE_W, NODE_H } from './MegamodelEdge';

// ─── Spacing constants ──────────────────────────────────────────────────────

const COLUMN_GAP = 120;  // horizontal gap between the 3 macro-columns
const V_GAP = 40;        // vertical gap between nodes in the same column
const H_GAP = 80;        // horizontal gap for orphan grid

// ─── Dagre fallback (no transformations) ────────────────────────────────────

function computeDagreFallback(
    nodes: MmNode[],
    edges: MmEdge[],
): Map<string, { x: number; y: number }> {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: 'TB',
        ranksep: 100,
        nodesep: 30,
        edgesep: 20,
        marginx: 40,
        marginy: 40,
        ranker: 'network-simplex',
    });

    for (const node of nodes) {
        g.setNode(node.id, { width: NODE_W, height: NODE_H });
    }

    const structural: Set<MmEdgeType> = new Set(['conformsTo', 'generatedBy', 'sourceOf']);
    for (const edge of edges) {
        if (structural.has(edge.type)) {
            g.setEdge(edge.to, edge.from); // reversed for correct TB hierarchy
        }
    }

    dagre.layout(g);

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

// ─── Transformation-centric layout ──────────────────────────────────────────

function computeTransformationCentricLayout(
    nodes: MmNode[],
    edges: MmEdge[],
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const placed = new Set<string>();

    // ── Step 1: Classify nodes ──────────────────────────────────────────────

    const transformations: MmNode[] = [];
    const metamodels: MmNode[] = [];
    const models: MmNode[] = [];

    for (const node of nodes) {
        if (node.kind === 'transformation') transformations.push(node);
        else if (node.kind === 'metamodel') metamodels.push(node);
        else models.push(node);
    }

    // ── Step 2: Determine source/target MMs via inputOf/outputOf edges ──────

    const sourceMMIds = new Set<string>();
    const targetMMIds = new Set<string>();

    for (const edge of edges) {
        if (edge.type === 'inputOf') {
            // inputOf: from=metamodel, to=transformation
            sourceMMIds.add(edge.from);
        }
        if (edge.type === 'outputOf') {
            // outputOf: from=transformation, to=metamodel
            targetMMIds.add(edge.to);
        }
    }

    const sourceMMs = metamodels.filter(n => sourceMMIds.has(n.id) && !targetMMIds.has(n.id));
    const targetMMs = metamodels.filter(n => targetMMIds.has(n.id) && !sourceMMIds.has(n.id));
    const bothMMs = metamodels.filter(n => sourceMMIds.has(n.id) && targetMMIds.has(n.id));
    const otherMMs = metamodels.filter(n => !sourceMMIds.has(n.id) && !targetMMIds.has(n.id));

    // MMs that are both source and target: put on the side with fewer connections
    for (const mm of bothMMs) {
        // Count source vs target connections
        let srcCount = 0, tgtCount = 0;
        for (const edge of edges) {
            if (edge.type === 'inputOf' && edge.from === mm.id) srcCount++;
            if (edge.type === 'outputOf' && edge.to === mm.id) tgtCount++;
        }
        if (srcCount >= tgtCount) sourceMMs.push(mm);
        else targetMMs.push(mm);
    }

    // ── Step 3: Group models by their metamodel (conformsTo) ────────────────

    const mmToModels = new Map<string, MmNode[]>();
    const mmToGenModels = new Map<string, MmNode[]>();

    for (const edge of edges) {
        if (edge.type !== 'conformsTo') continue;
        // conformsTo: from=model, to=metamodel
        const modelNode = nodes.find(n => n.id === edge.from);
        if (!modelNode || modelNode.kind !== 'model') continue;
        const mmId = edge.to;
        const bucket = modelNode.generated ? mmToGenModels : mmToModels;
        if (!bucket.has(mmId)) bucket.set(mmId, []);
        bucket.get(mmId)!.push(modelNode);
    }

    // ── Step 4: Calculate column X positions ────────────────────────────────

    const centerX = 0;
    const leftX = centerX - NODE_W - COLUMN_GAP;
    const rightX = centerX + NODE_W + COLUMN_GAP;

    // ── Step 5: Place columns ───────────────────────────────────────────────

    // Helper: place a MM + its conforming models vertically, return next Y
    function placeMMStack(mm: MmNode, x: number, startY: number, includeGenerated: boolean): number {
        positions.set(mm.id, { x, y: startY });
        placed.add(mm.id);
        let y = startY + NODE_H + V_GAP;

        const conforming = mmToModels.get(mm.id) ?? [];
        for (const model of conforming) {
            if (placed.has(model.id)) continue;
            positions.set(model.id, { x, y });
            placed.add(model.id);
            y += NODE_H + V_GAP;
        }

        if (includeGenerated) {
            const generated = mmToGenModels.get(mm.id) ?? [];
            for (const model of generated) {
                if (placed.has(model.id)) continue;
                positions.set(model.id, { x, y });
                placed.add(model.id);
                y += NODE_H + V_GAP;
            }
        }

        return y;
    }

    // -- LEFT column: source MMs + their models --
    let leftY = 0;
    for (const mm of sourceMMs) {
        leftY = placeMMStack(mm, leftX, leftY, false);
        leftY += V_GAP; // extra gap between MM groups
    }

    // -- CENTER column: transformations --
    let transY = 0;
    for (const trans of transformations) {
        positions.set(trans.id, { x: centerX, y: transY });
        placed.add(trans.id);
        transY += NODE_H + V_GAP * 2;
    }

    // -- RIGHT column: target MMs + their models (including generated) --
    let rightY = 0;
    for (const mm of targetMMs) {
        rightY = placeMMStack(mm, rightX, rightY, true);
        rightY += V_GAP;
    }

    // -- Vertically center all 3 columns --
    const maxH = Math.max(leftY, transY, rightY);
    const leftOffset = (maxH - leftY) / 2;
    const transOffset = (maxH - transY) / 2;
    const rightOffset = (maxH - rightY) / 2;

    for (const mm of sourceMMs) {
        adjustColumnY(mm.id, leftOffset);
        for (const m of (mmToModels.get(mm.id) ?? [])) adjustColumnY(m.id, leftOffset);
    }
    for (const trans of transformations) {
        adjustColumnY(trans.id, transOffset);
    }
    for (const mm of targetMMs) {
        adjustColumnY(mm.id, rightOffset);
        for (const m of [...(mmToModels.get(mm.id) ?? []), ...(mmToGenModels.get(mm.id) ?? [])]) {
            adjustColumnY(m.id, rightOffset);
        }
    }

    function adjustColumnY(id: string, offset: number) {
        const pos = positions.get(id);
        if (pos) pos.y += offset;
    }

    // -- Other MMs (not connected to any transformation): below main layout --
    let otherY = maxH + V_GAP * 2;
    let otherX = leftX;
    for (const mm of otherMMs) {
        otherY = placeMMStack(mm, otherX, otherY, true);
        otherX += NODE_W + H_GAP;
        if (otherX > rightX + NODE_W) {
            otherX = leftX;
            otherY += V_GAP;
        }
    }

    // -- Orphan nodes (no position yet): grid at bottom --
    let orphanY = Math.max(otherY, maxH) + V_GAP * 2;
    let orphanX = leftX;
    for (const node of nodes) {
        if (placed.has(node.id)) continue;
        positions.set(node.id, { x: orphanX, y: orphanY });
        placed.add(node.id);
        orphanX += NODE_W + H_GAP;
        if (orphanX > rightX + NODE_W) {
            orphanX = leftX;
            orphanY += NODE_H + V_GAP;
        }
    }

    return positions;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compute positions for megamodel nodes.
 * Uses transformation-centric layout when transformations exist,
 * falls back to dagre for simple metamodel/model-only diagrams.
 */
export function computeMegamodelLayout(
    nodes: MmNode[],
    edges: MmEdge[],
): Map<string, { x: number; y: number }> {
    if (nodes.length === 0) return new Map();

    const hasTransformations = nodes.some(n => n.kind === 'transformation');

    if (hasTransformations) {
        return computeTransformationCentricLayout(nodes, edges);
    }

    return computeDagreFallback(nodes, edges);
}
