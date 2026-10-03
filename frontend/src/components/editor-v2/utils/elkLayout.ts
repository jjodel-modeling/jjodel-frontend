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
import type { AnchorSide } from '../types';
import { JUNCTION_HALF } from '../viewpoint/ir/irJunctions';
import type { LabelAnchor } from '../viewpoint/ir/irTypes';

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

// ═══════════════════════════════════════════════════════════════════════════
// Toolbar auto-layout (P-2026-10-01-2215 Phase 2,
// docs/discovery/discovery_2026-10-01_elk_layout_quality.md §6 F1-F3, F6).
//
// computeElkLayout above stays the layout of the first open and of the late-edge
// re-layout, byte for byte. The toolbar runs computeElkAutoLayout instead: real
// node sizes, hidden nodes out (an object drawn as an edge keeps a hidden vertex,
// irEdgeViews.ts), edge labels in with their measured size, model order off, the
// notation's profile when the viewpoint carries one, positions on the 8 px grid,
// and ELK's own routes returned for the edge renderer.
// ═══════════════════════════════════════════════════════════════════════════

/** The grid auto-layout positions land on (Q4; the 16 px drag snap is unchanged). */
export const ELK_GRID = 8;

/** The size ELK is given for a node React Flow has neither measured nor sized (today's uniform size). */
const DEFAULT_NODE_W = 180;
const DEFAULT_NODE_H = 120;

/** A notation's layout (Q2): every key optional; absent keys keep today's values. */
export interface ElkLayoutProfile {
    /** 'stress' for notations with no flow direction (ER (Chen)). Default 'layered'. */
    algorithm?: 'layered' | 'stress';
    /** stress only: a second pass of ELK's overlap removal (sporeOverlap). */
    overlapRemoval?: boolean;
    direction?: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT';
    edgeRouting?: 'ORTHOGONAL' | 'POLYLINE';
    nodePlacement?: 'NETWORK_SIMPLEX' | 'BRANDES_KOEPF';
    /** Roles (the derived viewpoint's `derivedRole_<classId>` values) pinned to the first or the last layer. */
    layerConstraints?: { first?: string[]; last?: string[] };
    spacing?: { node?: number; layer?: number; edgeNode?: number; edgeEdge?: number; label?: number };
    /** stress only: the desired edge length. */
    edgeLength?: number;
}

/** The compact spacing measured in Phase 1 (V4): node 40, layer 56, edge-node 24, edge-edge 16, label 4. */
export const COMPACT_SPACING = { node: 40, layer: 56, edgeNode: 24, edgeEdge: 16, label: 4 } as const;

/** A metamodel canvas without a derived profile (Phase 1 §5.1: V4-ns best on both class scenes). */
export const CLASS_VIEW_PROFILE: ElkLayoutProfile = {
    direction: 'DOWN', edgeRouting: 'ORTHOGONAL', nodePlacement: 'NETWORK_SIMPLEX', spacing: { ...COMPACT_SPACING },
};

/** A label drawn on an edge, measured in the DOM: the centre one, or the one at either end. */
export interface ElkLabelInput {
    kind: 'center' | 'source' | 'target';
    text: string;
    width: number;
    height: number;
}

/**
 * A label a vertex paints outside its box (`position: 'outside'`, irStyle.ts), measured in the DOM, in flow units
 * (P-2026-10-03-1415, R-VP-53).
 */
export interface ElkNodeLabelInput {
    /** The side of the box it sits on. */
    anchor: LabelAnchor;
    text: string;
    width: number;
    height: number;
    /** The painted distance between the label and the node's box. */
    gap: number;
}

export interface ElkAutoLayoutInput {
    /** The viewpoint's profile; null or absent keeps today's strategy. */
    profile?: ElkLayoutProfile | null;
    /** A node's role in the derived viewpoint, for the layer constraints. */
    roleOf?: (nodeId: string) => string | undefined;
    /** The visible labels of an edge, with their measured size. */
    labelsOf?: (edgeId: string) => ElkLabelInput[] | undefined;
    /** The outside labels of a vertex, with their measured size and gap: ELK reserves their room. */
    outsideLabelsOf?: (nodeId: string) => ElkNodeLabelInput[] | undefined;
}

export interface ElkRect { x: number; y: number; width: number; height: number }
export interface ElkPoint { x: number; y: number }

/** ELK's route of one edge, React Flow source to target, in flow coordinates. Session only, never persisted. */
export interface ElkRoute {
    points: ElkPoint[];
    sourceSide: AnchorSide;
    targetSide: AnchorSide;
    /** The rects of the two end nodes the route was computed for (positions on the grid). */
    sourceRect: ElkRect;
    targetRect: ElkRect;
    /** Axis-aligned segments (ORTHOGONAL), or a polyline / straight line. */
    orthogonal: boolean;
    /** A centre-to-centre line on the boxes (stress): its ends are on the box, not on the shape's outline. */
    straight?: boolean;
    /** Where ELK put the centre label: the label's centre. */
    centerLabel?: ElkPoint;
}

export interface ElkAutoLayoutResult {
    positions: Map<string, ElkPoint>;
    routes: Map<string, ElkRoute>;
}

const LABEL_ID = (edgeId: string, kind: ElkLabelInput['kind']) => `${edgeId}::elk-${kind}`;
const NODE_LABEL_ID = (nodeId: string, i: number) => `${nodeId}::elk-outside-${i}`;
/** Where ELK puts an outside label, by its anchor: on that side of the box, centred along it. */
const NODE_LABEL_PLACEMENT: Record<LabelAnchor, string> = {
    n: 'OUTSIDE V_TOP H_CENTER', s: 'OUTSIDE V_BOTTOM H_CENTER', e: 'OUTSIDE H_RIGHT V_CENTER', w: 'OUTSIDE H_LEFT V_CENTER',
};
const snapToGrid = (v: number) => Math.round(v / ELK_GRID) * ELK_GRID + 0;

/** Measured first, then the width/height the size contract writes (useContentSize.ts), today's 180x120 last. */
function realSizeOf(n: Node): { width: number; height: number } {
    const w = n.measured?.width ?? n.width;
    const h = n.measured?.height ?? n.height;
    return { width: w && w > 0 ? w : DEFAULT_NODE_W, height: h && h > 0 ? h : DEFAULT_NODE_H };
}

const junctionNodeId = (nodeId: string, kind: 'merge' | 'decision') => `::junction::${nodeId}::${kind}`;

/** The junction ends of an edge (irJunctions.ts `JunctionEnd` on `data`), on a non-self-loop only. */
function junctionEnds(e: Edge): { merge?: AnchorSide; decision?: AnchorSide } {
    if (e.source === e.target) return {};
    const d = (e.data ?? {}) as { irJunctionTarget?: { side?: AnchorSide }; irJunctionSource?: { side?: AnchorSide } };
    return { merge: d.irJunctionTarget?.side, decision: d.irJunctionSource?.side };
}

/** The ELK graph of the toolbar auto-layout. Pure. */
export function buildElkGraph(nodes: Node[], edges: Edge[], input: ElkAutoLayoutInput = {}): ElkNode {
    const profile = input.profile ?? null;
    const visible = nodes.filter(n => !n.hidden);
    const ids = new Set(visible.map(n => n.id));
    const constraints = profile?.layerConstraints;

    const children: ElkNode[] = visible.map(n => {
        const child: ElkNode = { id: n.id, ...realSizeOf(n) };
        const role = constraints ? input.roleOf?.(n.id) : undefined;
        if (role && constraints?.first?.includes(role)) child.layoutOptions = { 'elk.layered.layering.layerConstraint': 'FIRST' };
        else if (role && constraints?.last?.includes(role)) child.layoutOptions = { 'elk.layered.layering.layerConstraint': 'LAST' };
        // The vertex's outside labels (R-VP-53): ELK reserves their room on their side, at the gap they are painted at
        // (a node-level label spacing; a plain node option is ignored by layered). The node keeps its own box.
        const outside = (input.outsideLabelsOf?.(n.id) ?? []).filter(l => l.width > 0 && l.height > 0);
        if (outside.length) {
            child.labels = outside.map((l, i) => ({
                id: NODE_LABEL_ID(n.id, i), text: l.text, width: l.width, height: l.height,
                layoutOptions: { 'elk.nodeLabels.placement': NODE_LABEL_PLACEMENT[l.anchor] },
            }));
            const gap = Math.round(Math.max(0, ...outside.map(l => l.gap)));
            child.layoutOptions = { ...child.layoutOptions, 'elk.spacing.individual': `elk.spacing.labelNode:${gap}` };
        }
        return child;
    });

    // Today's priority scheme, unchanged: inheritance reversed at 10, references at 0 beside it, else 3.
    const hasInheritance = edges.some(e => e.type === 'inheritance' && ids.has(e.source) && ids.has(e.target));
    const refPriority = hasInheritance ? '0' : '3';
    const elkEdges: ElkExtendedEdge[] = [];
    // Activity (UML)'s view-only merge and decision (irJunctions.ts): one diamond-sized node per group, so the
    // branches are laid out to it and the trunk to the action, as they are drawn.
    const junctionNodes = new Map<string, string>();
    const junctionOf = (nodeId: string, kind: 'merge' | 'decision') => {
        const jid = junctionNodeId(nodeId, kind);
        if (!junctionNodes.has(jid)) {
            junctionNodes.set(jid, nodeId);
            children.push({ id: jid, width: 2 * JUNCTION_HALF, height: 2 * JUNCTION_HALF });
            elkEdges.push(kind === 'merge'
                ? { id: `${jid}::trunk`, sources: [jid], targets: [nodeId], layoutOptions: { 'elk.layered.priority.direction': refPriority } }
                : { id: `${jid}::trunk`, sources: [nodeId], targets: [jid], layoutOptions: { 'elk.layered.priority.direction': refPriority } });
        }
        return jid;
    };
    for (const e of edges) {
        if (!ids.has(e.source) || !ids.has(e.target)) continue;
        const reversed = e.type === 'inheritance';
        const { merge, decision } = junctionEnds(e);
        const from = reversed ? e.target : decision ? junctionOf(e.source, 'decision') : e.source;
        const to = reversed ? e.source : merge ? junctionOf(e.target, 'merge') : e.target;
        const ee: ElkExtendedEdge = {
            id: e.id,
            sources: [from],
            targets: [to],
            layoutOptions: { 'elk.layered.priority.direction': reversed ? '10' : refPriority },
        };
        const labels = (input.labelsOf?.(e.id) ?? []).filter(l => l.width > 0 && l.height > 0);
        if (labels.length) {
            // HEAD is ELK's target end: on a reversed edge that is React Flow's source.
            const head = reversed ? 'TAIL' : 'HEAD';
            const tail = reversed ? 'HEAD' : 'TAIL';
            ee.labels = labels.map(l => ({
                id: LABEL_ID(e.id, l.kind), text: l.text, width: l.width, height: l.height,
                layoutOptions: { 'elk.edgeLabels.placement': l.kind === 'center' ? 'CENTER' : l.kind === 'target' ? head : tail },
            }));
        }
        elkEdges.push(ee);
    }

    const sp = profile?.spacing ?? {};
    const pad = profile ? 48 : 50;
    const padding = `[top=${pad},left=${pad},bottom=${pad},right=${pad}]`;
    let layoutOptions: Record<string, string>;
    if (profile?.algorithm === 'stress') {
        layoutOptions = {
            'elk.algorithm': 'stress',
            'elk.stress.desiredEdgeLength': String(profile.edgeLength ?? 110),
            'elk.padding': padding,
        };
    } else {
        const placement = profile?.nodePlacement ?? 'NETWORK_SIMPLEX';
        layoutOptions = {
            'elk.algorithm': 'layered',
            'elk.direction': profile?.direction ?? 'DOWN',
            'elk.edgeRouting': profile?.edgeRouting ?? 'ORTHOGONAL',
            'elk.spacing.nodeNode': String(sp.node ?? 100),
            'elk.layered.spacing.nodeNodeBetweenLayers': String(sp.layer ?? 120),
            'elk.spacing.edgeEdge': String(sp.edgeEdge ?? 25),
            'elk.spacing.edgeNode': String(sp.edgeNode ?? 30),
            ...(profile ? {
                'elk.layered.spacing.edgeNodeBetweenLayers': String(sp.edgeNode ?? 24),
                'elk.layered.spacing.edgeEdgeBetweenLayers': String(sp.edgeEdge ?? 16),
                'elk.spacing.edgeLabel': String(sp.label ?? 4),
                'elk.spacing.labelNode': '6',
                // Disconnected parts (a statechart's event objects) clear the self-loops the renderer draws above a node.
                'elk.spacing.componentComponent': '80',
            } : {}),
            'elk.padding': padding,
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
            'elk.layered.nodePlacement.strategy': placement,
            // NONE, not BALANCED (P-2026-10-03-1304, Q8): BK keeps the one alignment that gives the narrowest
            // layout; the balanced average of the four pulled DemoFlowB's `work` 56 px off its main path.
            ...(placement === 'BRANDES_KOEPF' ? { 'elk.layered.nodePlacement.bk.fixedAlignment': 'NONE' } : {}),
            // Phase 1 §4.7: NODES_AND_EDGES never changed a crossing count and cost area; off.
            'elk.layered.considerModelOrder.strategy': 'NONE',
        };
    }
    return { id: 'root', layoutOptions, children, edges: elkEdges };
}

/**
 * The outside labels each node of `container` paints (`.ir-label--outside`, irStyle.ts), as drawn: the size in flow
 * units (offsetWidth/Height, which the zoom does not scale), the side from the anchor class, the gap from the rects
 * divided by the zoom. Read by the toolbar auto-layout, beside the edge labels (R-VP-53).
 */
export function measureOutsideLabels(container: ParentNode): Map<string, ElkNodeLabelInput[]> {
    const out = new Map<string, ElkNodeLabelInput[]>();
    container.querySelectorAll<HTMLElement>('.react-flow__node[data-id]').forEach(nodeEl => {
        const id = nodeEl.getAttribute('data-id');
        if (!id) return;
        const box = nodeEl.getBoundingClientRect();
        const zoom = nodeEl.offsetWidth > 0 && box.width > 0 ? box.width / nodeEl.offsetWidth : 1;
        nodeEl.querySelectorAll<HTMLElement>('.ir-node-content > .ir-label--outside').forEach(el => {
            const anchor = (['n', 'e', 's', 'w'] as const).find(a => el.classList.contains(`ir-label--anchor-${a}`));
            if (!anchor || !el.offsetWidth || !el.offsetHeight) return;
            const r = el.getBoundingClientRect();
            const gap = anchor === 'n' ? box.top - r.bottom : anchor === 's' ? r.top - box.bottom : anchor === 'e' ? r.left - box.right : box.left - r.right;
            const list = out.get(id) ?? [];
            list.push({ anchor, text: (el.textContent ?? '').trim(), width: el.offsetWidth, height: el.offsetHeight, gap: gap / zoom });
            out.set(id, list);
        });
    });
    return out;
}

/** The side of a rect a point on (or near) its border sits on. */
function sideOfPoint(p: ElkPoint, r: ElkRect): AnchorSide {
    const d: [AnchorSide, number][] = [
        ['left', Math.abs(p.x - r.x)], ['right', Math.abs(p.x - r.x - r.width)],
        ['top', Math.abs(p.y - r.y)], ['bottom', Math.abs(p.y - r.y - r.height)],
    ];
    d.sort((a, b) => a[1] - b[1]);
    return d[0][0];
}

/** Where the line between the two centres leaves rect `r` toward point `to`. */
function clipToBorder(r: ElkRect, to: ElkPoint): ElkPoint {
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const dx = to.x - cx, dy = to.y - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const t = Math.min(dx ? (r.width / 2) / Math.abs(dx) : Infinity, dy ? (r.height / 2) / Math.abs(dy) : Infinity);
    return { x: cx + dx * t, y: cy + dy * t };
}

/** The ends of a leg are kept this far from the corners of the side they move along. */
const STRAIGHT_CORNER = 4;

/**
 * A leg ELK drew straight, kept straight after the grid snap (P-2026-10-03-1304, Q8): the snap moves its two nodes by
 * different amounts across the leg, and the fit turns it into a jog of up to the grid step. Both ends take one cross
 * coordinate: `pin` when given (the action's centre under a junction end, where the diamond is drawn), else the end on
 * the narrower node, when it falls on the other node's side away from its corners. A null rect is a junction end, which
 * takes any coordinate. `points` back unchanged when no coordinate fits both sides.
 */
function keepStraight(points: ElkPoint[], vertical: boolean, sr: ElkRect | null, tr: ElkRect | null, pin?: number): ElkPoint[] {
    const first = points[0], last = points[points.length - 1];
    const across = (p: ElkPoint) => (vertical ? p.x : p.y);
    const span = (r: ElkRect | null): [number, number] => (r
        ? (vertical ? [r.x + STRAIGHT_CORNER, r.x + r.width - STRAIGHT_CORNER] : [r.y + STRAIGHT_CORNER, r.y + r.height - STRAIGHT_CORNER])
        : [-Infinity, Infinity]);
    const fits = (c: number, r: ElkRect | null) => { const [lo, hi] = span(r); return c >= lo - 0.01 && c <= hi + 0.01; };
    const size = (r: ElkRect | null) => (r ? (vertical ? r.width : r.height) : Infinity);
    const candidates = pin !== undefined ? [pin]
        : size(sr) <= size(tr) ? [across(first), across(last)] : [across(last), across(first)];
    const c = candidates.find(v => fits(v, sr) && fits(v, tr));
    if (c === undefined) return points;
    return vertical
        ? [{ x: c, y: first.y }, { x: c, y: last.y }]
        : [{ x: first.x, y: c }, { x: last.x, y: c }];
}

function readElkResult(out: ElkNode, edges: Edge[], input: ElkAutoLayoutInput): ElkAutoLayoutResult {
    const straight = input.profile?.algorithm === 'stress';
    const orthogonal = !straight && (input.profile?.edgeRouting ?? 'ORTHOGONAL') === 'ORTHOGONAL';
    const raw = new Map<string, ElkRect>();
    const snapped = new Map<string, ElkRect>();
    const positions = new Map<string, ElkPoint>();
    for (const c of out.children ?? []) {
        if (c.id.startsWith('::junction::')) continue;
        const r = { x: c.x ?? 0, y: c.y ?? 0, width: c.width ?? DEFAULT_NODE_W, height: c.height ?? DEFAULT_NODE_H };
        raw.set(c.id, r);
        const p = { x: snapToGrid(r.x), y: snapToGrid(r.y) };
        positions.set(c.id, p);
        snapped.set(c.id, { ...p, width: r.width, height: r.height });
    }
    const rfEdges = new Map(edges.map(e => [e.id, e] as const));
    const routes = new Map<string, ElkRoute>();
    for (const ee of (out.edges ?? []) as ElkExtendedEdge[]) {
        const e = rfEdges.get(ee.id);
        if (!e) continue;
        const sr = snapped.get(e.source), tr = snapped.get(e.target);
        if (!sr || !tr) continue;
        let points: ElkPoint[] = [];
        let sideFrame: [ElkRect, ElkRect];
        if (straight) {
            // A straight line between the final (snapped) boxes: the stress pass has no sections worth keeping.
            const a = clipToBorder(sr, { x: tr.x + tr.width / 2, y: tr.y + tr.height / 2 });
            const b = clipToBorder(tr, { x: sr.x + sr.width / 2, y: sr.y + sr.height / 2 });
            points = [a, b];
            sideFrame = [sr, tr];
        } else {
            for (const s of ee.sections ?? []) {
                for (const p of [s.startPoint, ...(s.bendPoints ?? []), s.endPoint]) {
                    const last = points[points.length - 1];
                    if (!last || Math.abs(last.x - p.x) > 0.01 || Math.abs(last.y - p.y) > 0.01) points.push({ x: p.x, y: p.y });
                }
            }
            if (e.type === 'inheritance') points.reverse();
            // The sides are read on the boxes the route was computed for (before the snap).
            sideFrame = [raw.get(e.source)!, raw.get(e.target)!];
        }
        if (points.length < 2) continue;
        const { merge, decision } = junctionEnds(e);
        // An end on a junction keeps the junction's side: the action's shared handle is there (irJunctions.ts).
        const sourceSide = decision ?? sideOfPoint(points[0], sideFrame[0]);
        const targetSide = merge ?? sideOfPoint(points[points.length - 1], sideFrame[1]);
        if (!straight) {
            // The ends on real nodes follow their node's snap to the grid; an end on a junction stays where ELK put it.
            const rs = raw.get(e.source)!, rt = raw.get(e.target)!;
            const first = points[0], last = points[points.length - 1];
            const start = decision ? first : { x: first.x + sr.x - rs.x, y: first.y + sr.y - rs.y };
            const end = merge ? last : { x: last.x + tr.x - rt.x, y: last.y + tr.y - rt.y };
            const straightLeg = orthogonal && points.length === 2 && (Math.abs(first.x - last.x) < 0.01 || Math.abs(first.y - last.y) < 0.01);
            points = fitRouteToEnds({ points, sourceSide, targetSide, sourceRect: sr, targetRect: tr, orthogonal }, start, end);
            if (straightLeg && points.length > 2 && vertical(sourceSide) === vertical(targetSide)) {
                const v = vertical(sourceSide);
                // A junction end is drawn at the action's shared handle, the centre of its side (irJunctions.ts).
                const action = merge ? tr : decision ? sr : null;
                const pin = action ? (v ? action.x + action.width / 2 : action.y + action.height / 2) : undefined;
                points = keepStraight(points, v, decision ? null : sr, merge ? null : tr, pin);
            }
        }
        const centre = ee.labels?.find(l => l.id === LABEL_ID(e.id, 'center'));
        routes.set(e.id, {
            points,
            sourceSide,
            targetSide,
            sourceRect: sr,
            targetRect: tr,
            orthogonal,
            ...(straight ? { straight: true } : {}),
            ...(centre && centre.x !== undefined && centre.y !== undefined
                ? { centerLabel: { x: centre.x + (centre.width ?? 0) / 2, y: centre.y + (centre.height ?? 0) / 2 } }
                : {}),
        });
    }
    return { positions, routes };
}

/** The toolbar auto-layout: positions on the grid and a route per laid-out edge. */
export async function computeElkAutoLayout(nodes: Node[], edges: Edge[], input: ElkAutoLayoutInput = {}): Promise<ElkAutoLayoutResult> {
    const graph = buildElkGraph(nodes, edges, input);
    if (!graph.children?.length) return { positions: new Map(), routes: new Map() };
    let out = await elk.layout(graph);
    const profile = input.profile;
    if (profile?.algorithm === 'stress' && profile.overlapRemoval) {
        // Q6: ELK's overlap removal on the stress positions; edges are straight lines afterwards.
        const second = await elk.layout({
            id: 'root',
            layoutOptions: {
                'elk.algorithm': 'sporeOverlap',
                'elk.spacing.nodeNode': String(profile.spacing?.node ?? 24),
                'elk.padding': '[top=48,left=48,bottom=48,right=48]',
            },
            children: (out.children ?? []).map(c => ({ id: c.id, x: c.x, y: c.y, width: c.width, height: c.height })),
            edges: [],
        });
        const moved = new Map((second.children ?? []).map(c => [c.id, c] as const));
        out = { ...out, children: (out.children ?? []).map(c => ({ ...c, x: moved.get(c.id)?.x ?? c.x, y: moved.get(c.id)?.y ?? c.y })) };
    }
    return readElkResult(out, edges, input);
}

// ── Route validity and fitting ─────────────────────────────────────────────

const RECT_TOLERANCE = 0.5;
const sameRect = (a: ElkRect, b: ElkRect) =>
    Math.abs(a.x - b.x) <= RECT_TOLERANCE && Math.abs(a.y - b.y) <= RECT_TOLERANCE
    && Math.abs(a.width - b.width) <= RECT_TOLERANCE && Math.abs(a.height - b.height) <= RECT_TOLERANCE;

/** A route holds while both end nodes keep the rects it was computed for; a move or a resize drops it. */
export function isElkRouteValid(route: ElkRoute, sourceRect: ElkRect, targetRect: ElkRect): boolean {
    return sameRect(route.sourceRect, sourceRect) && sameRect(route.targetRect, targetRect);
}

const vertical = (s: AnchorSide) => s === 'top' || s === 'bottom';

/**
 * The route with its two ends moved onto the points React Flow gives the handles. An orthogonal
 * route moves its first and last segments along their own axis, so every segment stays
 * axis-aligned (a straight leg between offset handles gets a jog); a polyline takes the ends as is.
 */
export function fitRouteToEnds(route: ElkRoute, start: ElkPoint, end: ElkPoint): ElkPoint[] {
    const pts = route.points.map(p => ({ ...p }));
    if (pts.length < 2) return [{ ...start }, { ...end }];
    if (!route.orthogonal) {
        pts[0] = { ...start };
        pts[pts.length - 1] = { ...end };
        return pts;
    }
    const sv = vertical(route.sourceSide), tv = vertical(route.targetSide);
    if (pts.length === 2) {
        if (sv && tv) {
            if (Math.abs(start.x - end.x) < 0.5) return [{ ...start }, { x: start.x, y: end.y }];
            const my = (start.y + end.y) / 2;
            return [{ ...start }, { x: start.x, y: my }, { x: end.x, y: my }, { ...end }];
        }
        if (!sv && !tv) {
            if (Math.abs(start.y - end.y) < 0.5) return [{ ...start }, { x: end.x, y: start.y }];
            const mx = (start.x + end.x) / 2;
            return [{ ...start }, { x: mx, y: start.y }, { x: mx, y: end.y }, { ...end }];
        }
        return [{ ...start }, sv ? { x: start.x, y: end.y } : { x: end.x, y: start.y }, { ...end }];
    }
    const n = pts.length;
    pts[0] = { ...start };
    if (sv) pts[1].x = start.x; else pts[1].y = start.y;
    pts[n - 1] = { ...end };
    if (tv) pts[n - 2].x = end.x; else pts[n - 2].y = end.y;
    // A bend both ends moved (three points, both sides on one axis) can leave a slanted leg: square it.
    const out: ElkPoint[] = [pts[0]];
    for (let i = 1; i < n; i++) {
        const p = out[out.length - 1], q = pts[i];
        if (Math.abs(p.x - q.x) > 0.01 && Math.abs(p.y - q.y) > 0.01) {
            const prev = out.length > 1 ? out[out.length - 2] : null;
            const prevVertical = prev ? Math.abs(prev.x - p.x) <= 0.01 : sv;
            out.push(prevVertical ? { x: q.x, y: p.y } : { x: p.x, y: q.y });
        }
        out.push(q);
    }
    return out;
}

// ── Session store of the routes (never written to JjOM or to the persisted model) ──

const elkRouteStore = new Map<string, ElkRoute>();
let elkRouteRevision = 0;

/** Sets the routes of the given edges: an id absent from `routes` loses its route. Other edges keep theirs. */
export function setElkRoutes(edgeIds: Iterable<string>, routes: Map<string, ElkRoute>): void {
    for (const id of edgeIds) {
        const r = routes.get(id);
        if (r) elkRouteStore.set(id, r);
        else elkRouteStore.delete(id);
    }
    elkRouteRevision++;
}

export function getElkRoute(edgeId: string): ElkRoute | undefined {
    return elkRouteStore.get(edgeId);
}

/** Bumped by every setElkRoutes; read in the renderer's memo dependencies. */
export function elkRoutesRevision(): number {
    return elkRouteRevision;
}
