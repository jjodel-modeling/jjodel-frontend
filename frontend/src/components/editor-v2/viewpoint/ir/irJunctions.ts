/**
 * irJunctions — the view-only decision and merge of Activity (UML), P-2026-09-30-1935
 * (docs/discovery/discovery_2026-09-30_activity_decision_merge.md §3).
 *
 * The engine fires one transition per step and a plain control flow is a transition of
 * its own (netCompile.ts, R-SIM-7): two exits of an action are a choice, two entries a
 * merge. Read with UML 2, the same edges drawn straight from the action say fork and
 * join, so the notation draws a diamond where the engine chooses or merges. Nothing is
 * added to the model or to React Flow's nodes: the members of a group share one handle
 * on the action, each draws its branch to (from) a vertex of the diamond, and the first
 * member by id draws the trunk and the diamond itself (the inheritance tree's pattern,
 * UnifiedEdge CASE 1).
 *
 * Keyed on the provenance of the views (`ir.generated`, R-VP-21 (4)): a control flow is
 * a view of `activityUml` in the `transition` role, an action one in the `node` role. A
 * decision, a bar, an initial or a final never takes a synthetic diamond; a viewpoint
 * derived before this lane gets them as it is.
 *
 * Pure module (no joiner, no react): unit-tested in irJunctions.test.ts.
 */

import type { Edge } from '@xyflow/react';

export type JunctionSide = 'left' | 'right' | 'top' | 'bottom';
export type JunctionKind = 'merge' | 'decision';

/** What an edge carries about the junction at one of its ends (`data.irJunctionTarget` / `data.irJunctionSource`). */
export interface JunctionEnd {
    readonly kind: JunctionKind;
    /** The side of the action the trunk leaves from (decision) or enters (merge). */
    readonly side: JunctionSide;
    /** The member that draws the trunk and the diamond: the lowest edge id of the group. */
    readonly primary: boolean;
}

export interface Pt { readonly x: number; readonly y: number }

/** The persisted notation id of Activity (UML) (R-VP-26), and the roles of R-VP-21 its views carry. */
export const ACTIVITY_NOTATION = 'activityUml';
/** Half the diamond's diagonal: 28 px across, the target drawing's (docs/design/activity_uml_target_2026-09-30.svg). */
export const JUNCTION_HALF = 14;
/** The trunk, from the point xyflow gives the handle to the diamond's near vertex. */
export const JUNCTION_TRUNK = 40;

const provenanceOf = (ir: unknown): { notation?: unknown; role?: unknown } | null => {
    const g = (ir as { generated?: unknown } | null | undefined)?.generated;
    return g && typeof g === 'object' ? g as { notation?: unknown; role?: unknown } : null;
};

/** A view derived as an Activity (UML) control flow. */
export function isActivityFlowView(ir: unknown): boolean {
    const g = provenanceOf(ir);
    return !!g && g.notation === ACTIVITY_NOTATION && g.role === 'transition';
}

/** A view derived as an Activity (UML) action: the Node role, and every class that takes it. */
export function isActivityActionView(ir: unknown): boolean {
    const g = provenanceOf(ir);
    return !!g && g.notation === ACTIVITY_NOTATION && g.role === 'node';
}

const NORMAL: Record<JunctionSide, Pt> = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 } };
const OPPOSITE: Record<JunctionSide, JunctionSide> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
/** The two sides across a side's normal, in the order the tie-break reads them. */
const ACROSS: Record<JunctionSide, [JunctionSide, JunctionSide]> = {
    left: ['top', 'bottom'], right: ['top', 'bottom'], top: ['left', 'right'], bottom: ['left', 'right'],
};

export interface JunctionGeometry {
    /** The point xyflow gives the shared handle. */
    readonly anchor: Pt;
    /** The vertex on the trunk. */
    readonly near: Pt;
    readonly centre: Pt;
    readonly far: Pt;
    /** The vertices a branch can use, far first, then the two across the normal. */
    readonly vertices: ReadonlyArray<{ readonly point: Pt; readonly side: JunctionSide }>;
    /** `points` of the diamond's polygon: near, the first side, far, the second side. */
    readonly polygon: string;
}

/** The diamond of a junction on `side` of an action, from the point of its shared handle. */
export function junctionGeometry(anchor: Pt, side: JunctionSide): JunctionGeometry {
    const n = NORMAL[side];
    const at = (d: number): Pt => ({ x: anchor.x + n.x * d, y: anchor.y + n.y * d });
    const near = at(JUNCTION_TRUNK);
    const centre = at(JUNCTION_TRUNK + JUNCTION_HALF);
    const far = at(JUNCTION_TRUNK + 2 * JUNCTION_HALF);
    const [a, b] = ACROSS[side];
    const off = (s: JunctionSide): Pt => ({ x: centre.x + NORMAL[s].x * JUNCTION_HALF, y: centre.y + NORMAL[s].y * JUNCTION_HALF });
    const pa = off(a), pb = off(b);
    return {
        anchor, near, centre, far,
        vertices: [{ point: far, side }, { point: pa, side: a }, { point: pb, side: b }],
        polygon: [near, pa, far, pb].map(p => `${p.x},${p.y}`).join(' '),
    };
}

/**
 * The vertex a branch uses: the one whose direction from the centre faces `towards` (the
 * centre of the node at the branch's other end) the most. A tie goes to the earlier one,
 * far first. The side is the one the Manhattan router reads for that end.
 */
export function junctionVertex(g: JunctionGeometry, towards: Pt): { point: Pt; side: JunctionSide } {
    const v = { x: towards.x - g.centre.x, y: towards.y - g.centre.y };
    let best = g.vertices[0];
    let score = -Infinity;
    for (const c of g.vertices) {
        const s = v.x * NORMAL[c.side].x + v.y * NORMAL[c.side].y;
        if (s > score) { score = s; best = c; }
    }
    return { point: best.point, side: best.side };
}

/** The trunk's path: from the diamond into the action for a merge, from the action into the diamond for a decision. */
export function junctionTrunkPath(g: JunctionGeometry, kind: JunctionKind): string {
    const [a, b] = kind === 'merge' ? [g.near, g.anchor] : [g.anchor, g.near];
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

const sideOfHandle = (h: string | null | undefined): JunctionSide | null => {
    const base = typeof h === 'string' ? h.split('-')[0] : '';
    return base === 'left' || base === 'right' || base === 'top' || base === 'bottom' ? base : null;
};

/** The side most members use; a tie goes to the first member's; `exclude` is never chosen (its opposite then). */
function majoritySide(sides: ReadonlyArray<JunctionSide | null>, exclude: JunctionSide | null): JunctionSide {
    const count = new Map<JunctionSide, number>();
    const order: JunctionSide[] = [];
    for (const s of sides) {
        if (!s) continue;
        if (!count.has(s)) order.push(s);
        count.set(s, (count.get(s) ?? 0) + 1);
    }
    let best: JunctionSide | null = null;
    for (const s of order) {
        if (s === exclude) continue;
        if (best === null || (count.get(s) ?? 0) > (count.get(best) ?? 0)) best = s;
    }
    if (best) return best;
    return exclude ? OPPOSITE[exclude] : 'left';
}

/** The first `${side}-${k}` no edge of `rest` uses on `nodeId`, as a source or as a target. */
function freeSharedHandle(nodeId: string, side: JunctionSide, rest: readonly Edge[]): string {
    const used = new Set<string>();
    for (const e of rest) {
        if (e.source === nodeId && e.sourceHandle) used.add(e.sourceHandle);
        if (e.target === nodeId && e.targetHandle) used.add(e.targetHandle);
    }
    let k = 0;
    while (used.has(`${side}-${k}`)) k++;
    return `${side}-${k}`;
}

const isFlow = (e: Edge) => !!(e.data as { irActivityFlow?: unknown } | undefined)?.irActivityFlow && e.source !== e.target;

/**
 * The junctions of the synthetic control flows `synthetic` (handles already assigned),
 * `others` the rest of the canvas's edges. An action (`isAction(vertexId)`) with two or
 * more entries gets a merge, with two or more exits a decision: its members' handle on
 * the action becomes one id and their data a `JunctionEnd`. The merge is placed first;
 * a decision on the same action takes another side. A self-loop is no member.
 * Returns `synthetic` itself when no group forms; a non-member is the same object.
 */
export function assignActivityJunctions(synthetic: Edge[], others: readonly Edge[], isAction: (vertexId: string) => boolean): Edge[] {
    const flows = synthetic.filter(isFlow);
    if (flows.length < 2) return synthetic;
    const into = new Map<string, Edge[]>();
    const outOf = new Map<string, Edge[]>();
    for (const e of flows) {
        if (!into.has(e.target)) into.set(e.target, []);
        into.get(e.target)!.push(e);
        if (!outOf.has(e.source)) outOf.set(e.source, []);
        outOf.get(e.source)!.push(e);
    }
    const merges = [...into].filter(([n, es]) => es.length >= 2 && isAction(n));
    const decisions = [...outOf].filter(([n, es]) => es.length >= 2 && isAction(n));
    if (merges.length === 0 && decisions.length === 0) return synthetic;

    const current = new Map<string, Edge>(synthetic.map(e => [e.id, e]));
    const rewrite = (e: Edge, patch: (x: Edge) => Edge) => current.set(e.id, patch(current.get(e.id) ?? e));
    const mergeSide = new Map<string, JunctionSide>();
    const groups: Array<[JunctionKind, string, Edge[]]> = [
        ...merges.map(([n, es]): [JunctionKind, string, Edge[]] => ['merge', n, es]),
        ...decisions.map(([n, es]): [JunctionKind, string, Edge[]] => ['decision', n, es]),
    ];
    for (const [kind, nodeId, members] of groups) {
        const ids = new Set(members.map(e => e.id));
        const live = members.map(e => current.get(e.id) ?? e);
        const sides = live.map(e => sideOfHandle(kind === 'merge' ? e.targetHandle : e.sourceHandle));
        const side = majoritySide(sides, kind === 'decision' ? mergeSide.get(nodeId) ?? null : null);
        if (kind === 'merge') mergeSide.set(nodeId, side);
        const rest = [...others, ...[...current.values()].filter(e => !ids.has(e.id))];
        const handle = freeSharedHandle(nodeId, side, rest);
        const primary = [...ids].sort()[0];
        for (const e of members) {
            const end: JunctionEnd = { kind, side, primary: e.id === primary };
            rewrite(e, x => kind === 'merge'
                ? { ...x, targetHandle: handle, data: { ...(x.data ?? {}), irJunctionTarget: end } }
                : { ...x, sourceHandle: handle, data: { ...(x.data ?? {}), irJunctionSource: end } });
        }
    }
    return synthetic.map(e => current.get(e.id) ?? e);
}
