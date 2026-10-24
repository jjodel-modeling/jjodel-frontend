/**
 * Ghost preview elements — the planned creations of a script as synthetic React Flow nodes and
 * edges (S4b, R-JJD-2, decision D3 of the jjodie report).
 *
 * Pure: a plan and the boxes of the nodes already drawn in, React Flow elements out. EditorV2
 * appends them to the arrays it hands to React Flow (the `hideRunEvents` pattern, R-SIM-16/29):
 * nothing is written, laid out or persisted, and no D-object exists behind them. Every id carries
 * `PREVIEW_ID_PREFIX`, which EditorV2's handlers and `getNodes`/`getEdges` filter out.
 *
 * Placement: one column to the right of the drawn top-level nodes, top-aligned with them; an
 * empty canvas starts at the origin. Edges: the reference writes `=` and `+=` whose two ends are
 * drawn (a planned node or a node of the model), and the containment of a
 * `create instance … in P.ref`. A planned element carries the warning marker when a warning's line
 * is its create line or a line that writes one of its features or references.
 */
import type { Edge, Node } from '@xyflow/react';
import type { EffectsPlan, PlanWorld } from '../../../jjscript/executor/effectsPlanner';

export const PREVIEW_ID_PREFIX = 'jjpreview:';

/** True for the id of a ghost preview node or edge. */
export function isPreviewId(id: unknown): boolean {
    return typeof id === 'string' && id.startsWith(PREVIEW_ID_PREFIX);
}

/** A node already on the canvas: its id, the model element behind it, its box in flow coordinates. */
export interface DrawnNode {
    nodeId: string;
    elementId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    /** Inside a parent node: its position is relative, so it takes no part in the placement. */
    nested: boolean;
}

export const PREVIEW_NODE_WIDTH = 180;
export const PREVIEW_NODE_HEIGHT = 48;
const COLUMN_GAP = 80;
const ROW_GAP = 24;

export interface PreviewElements {
    nodes: Node[];
    edges: Edge[];
}

/** The model element a container handle names: a planned instance first, else a unique world element. */
function resolveHandle(handle: string, plan: EffectsPlan, world: PlanWorld): string | null {
    const planned = plan.created.filter((c) => c.name === handle);
    if (planned.length > 0) return planned[planned.length - 1].id;
    const found = world.elements.filter((e) => e.name === handle);
    return found.length === 1 ? found[0].id : null;
}

export function buildPreviewElements(plan: EffectsPlan, world: PlanWorld, drawn: readonly DrawnNode[]): PreviewElements {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    if (plan.created.length === 0 && plan.references.length === 0) return { nodes, edges };

    let x = 0;
    let y = 0;
    const placed = drawn.filter((d) => !d.nested);
    if (placed.length > 0) {
        x = Math.max(...placed.map((d) => d.x + d.width)) + COLUMN_GAP;
        y = Math.min(...placed.map((d) => d.y));
    }

    const warnedLines = new Set(plan.warnings.map((w) => w.line));
    const warned = new Set<string>();
    for (const c of plan.created) if (warnedLines.has(c.line)) warned.add(c.id);
    for (const f of plan.features) if (warnedLines.has(f.line)) warned.add(f.ownerId);
    for (const r of plan.references) if (warnedLines.has(r.line)) warned.add(r.sourceId);

    // Element id -> node id: planned instances get their preview node, drawn elements their node.
    const nodeOf = new Map<string, string>();
    for (const d of drawn) if (!nodeOf.has(d.elementId)) nodeOf.set(d.elementId, d.nodeId);

    plan.created.forEach((c, i) => {
        const id = PREVIEW_ID_PREFIX + c.id;
        nodeOf.set(c.id, id);
        nodes.push({
            id,
            type: 'default',
            position: { x, y: y + i * (PREVIEW_NODE_HEIGHT + ROW_GAP) },
            width: PREVIEW_NODE_WIDTH,
            height: PREVIEW_NODE_HEIGHT,
            data: { label: `${c.name} : ${c.metaclass}` },
            className: warned.has(c.id) ? 'jj-preview-node jj-preview-node--warning' : 'jj-preview-node',
            draggable: false,
            selectable: false,
            deletable: false,
            connectable: false,
            focusable: false,
        });
    });

    const pushEdge = (source: string | undefined, target: string | undefined, label: string, containment: boolean) => {
        if (!source || !target) return;
        edges.push({
            id: `${PREVIEW_ID_PREFIX}edge:${edges.length + 1}`,
            source,
            target,
            type: 'default',
            label,
            className: containment ? 'jj-preview-edge jj-preview-edge--containment' : 'jj-preview-edge',
            selectable: false,
            deletable: false,
            reconnectable: false,
            focusable: false,
        });
    };

    for (const c of plan.created) {
        if (!c.container) continue;
        const dot = c.container.lastIndexOf('.');
        const owner = resolveHandle(c.container.slice(0, dot), plan, world);
        if (owner) pushEdge(nodeOf.get(owner), nodeOf.get(c.id), c.container.slice(dot + 1), true);
    }
    for (const r of plan.references) {
        if ((r.operator !== '=' && r.operator !== '+=') || !r.targetId) continue;
        pushEdge(nodeOf.get(r.sourceId), nodeOf.get(r.targetId), r.feature, r.containment);
    }
    return { nodes, edges };
}

/** `base` with the preview appended; `base` itself, same reference, when there is nothing to add. */
export function appendPreview<T extends { nodes: Node[]; edges: Edge[] }>(base: T, preview: PreviewElements | null): T {
    if (!preview || (preview.nodes.length === 0 && preview.edges.length === 0)) return base;
    return { ...base, nodes: [...base.nodes, ...preview.nodes], edges: [...base.edges, ...preview.edges] };
}

/** The boxes of the drawn, visible nodes; `elementOf` gives the model element behind a node. */
export function drawnNodes(nodes: readonly Node[], elementOf: (nodeId: string) => string | undefined): DrawnNode[] {
    const out: DrawnNode[] = [];
    for (const n of nodes) {
        if (n.hidden || isPreviewId(n.id)) continue;
        out.push({
            nodeId: n.id,
            elementId: elementOf(n.id) ?? n.id,
            x: n.position.x,
            y: n.position.y,
            width: (n.measured?.width ?? n.width ?? PREVIEW_NODE_WIDTH) as number,
            height: (n.measured?.height ?? n.height ?? PREVIEW_NODE_HEIGHT) as number,
            nested: !!n.parentId,
        });
    }
    return out;
}
