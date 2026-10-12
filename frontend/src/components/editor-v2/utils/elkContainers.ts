/**
 * elkContainers — the toolbar Auto layout across graphVertex containers (P-2026-10-10-0105, slice S6).
 *
 * ELK is flat (`buildElkGraph`: every visible node a root child): a pool's flow nodes left their lanes, a composite
 * state's substates left its frame. Here the layout runs bottom-up by container, innermost first, and each laid-out
 * container is a fixed-size block one level up (RC-25):
 *   - a container that declares a `free` layout (its own box, or `frame: 'self'`) gets one ELK run on its visible
 *     children and the edges among them, with the root run's options; the result goes inside its content box (under
 *     its band, inside its padding);
 *   - a `partitions` container gets one layered run on the nodes of all its partitions together, flowing across them
 *     (stacked: RIGHT; side by side: DOWN); along the flow ELK's coordinate is kept, across it each node goes into its
 *     own partition's band, in ELK's relative order; a partition sized by hand grows when its nodes need more and
 *     never shrinks below its stored size;
 *   - an edge takes part in the run of the lowest container holding both its ends (or the root), between the blocks
 *     that hold them there; an edge hidden by channel suppression takes no part;
 *   - a collapsed container is one node at its collapsed size; its hidden content moves with it, unchanged.
 * The geometry of partitions and frames stays where S2 and S2b put it (`irPartitions`, `irFrame`): the boxes written
 * here are the ones the presentation pass computes back from the new positions.
 *
 * With no visible container that declares a layout the call is today's `computeElkAutoLayout`, unchanged.
 *
 * No React, no Redux: the containment model and the stored boxes come in as plain data. Unit-tested in
 * __tests__/elkContainers.test.ts (with ELK).
 */

import type { Edge, Node } from '@xyflow/react';
import { computeElkAutoLayout, type ElkAutoLayoutInput, type ElkAutoLayoutResult, type ElkPoint, type ElkRoute } from './elkLayout';
import { layoutPartitions, MIN_PARTITION_EXTENT, type PartitionSpec, type Rect } from '../viewpoint/ir/irPartitions';
import { frameBox } from '../viewpoint/ir/irFrame';
import type { CompiledContainmentLayout } from '../viewpoint/ir/irTypes';

/** Space kept around the nodes inside a band or a free container's box: PARTITION_CONTENT_MARGIN (irContainment). */
export const CONTAINER_CONTENT_MARGIN = 16;

/** What the layout reads of the containment model (irContainment's ContainmentModel satisfies it). */
export interface LayoutContainment {
    containers: ReadonlyMap<string, { vertexId: string; layout?: CompiledContainmentLayout }>;
    childrenOf: ReadonlyMap<string, string[]>;
    parentOf: ReadonlyMap<string, string>;
    vertexByObj: ReadonlyMap<string, string>;
    objByVertex: ReadonlyMap<string, string>;
}

/** A vertex's stored box under the active layout key (R-LAY-14). */
export interface StoredBox { w: number; h: number; isResized: boolean }

export interface ContainedAutoLayoutInput extends ElkAutoLayoutInput {
    containment?: LayoutContainment | null;
    storedOf?: (vertexId: string) => StoredBox | undefined;
}

export interface ContainedAutoLayoutResult extends ElkAutoLayoutResult {
    /** The boxes a run grew (a partition or a free container sized by hand, its content needing more): written, sized. */
    sizes: Map<string, { w: number; h: number }>;
}

type Pt = { x: number; y: number };
type Size = { w: number; h: number };
const DEFAULT_W = 180;
const DEFAULT_H = 120;

/** The size the toolbar layout gives a node: measured first, then its width/height, today's 180x120 last. */
function sizeOfNode(n: Node): Size {
    const w = n.measured?.width ?? n.width;
    const h = n.measured?.height ?? n.height;
    return { w: w && w > 0 ? w : DEFAULT_W, h: h && h > 0 ? h : DEFAULT_H };
}

/** The bottom-up plan of the containers: who lays out what. Pure; exported for the tests. */
export function planContainedLayout(nodes: Node[], model: LayoutContainment) {
    const byVertex = new Map(nodes.map(n => [n.id, n] as const));
    const shown = (v: string | undefined) => v !== undefined && !!byVertex.get(v) && !byVertex.get(v)!.hidden;
    const layoutOf = (o: string) => model.containers.get(o)?.layout;
    const vertexOf = (o: string) => (o.startsWith('v:') ? o.slice(2) : model.vertexByObj.get(o));
    /** The key of a node: its object, or the vertex itself for a node with no object. */
    const keyOf = (v: string) => model.objByVertex.get(v) ?? `v:${v}`;
    const parentOf = (o: string) => (o.startsWith('v:') ? undefined : model.parentOf.get(o));
    /** A partition: a child of a shown `partitions` container. Placed by its parent, it is a band, not a node. */
    const isBand = (o: string) => {
        const p = parentOf(o);
        return p !== undefined && layoutOf(p)?.mode === 'partitions' && shown(vertexOf(p));
    };
    const ownerMemo = new Map<string, boolean>();
    /** A container that lays out its own content: a shown one that declares a layout and has a shown child; a band
     *  only when it is itself a `partitions` container (sub-lanes). */
    const isOwner = (o: string): boolean => {
        const memo = ownerMemo.get(o);
        if (memo !== undefined) return memo;
        const l = layoutOf(o);
        const out = !!l && shown(vertexOf(o)) && (!isBand(o) || l.mode === 'partitions')
            && (model.childrenOf.get(o) ?? []).some(k => shown(vertexOf(k)));
        ownerMemo.set(o, out);
        return out;
    };
    /** The run a node belongs to: its nearest owner ancestor; undefined = the root. */
    const runOf = (o: string): string | undefined => {
        const seen = new Set<string>([o]);
        for (let a = parentOf(o); a !== undefined && !seen.has(a); a = parentOf(a)) {
            seen.add(a);
            if (isOwner(a)) return a;
        }
        return undefined;
    };
    /** The node that stands for `o` in the run of `c`: `o` itself or the block of an owner holding it; null when `o`
     *  is not under `c`, is `c` itself, or is a band. */
    const itemIn = (c: string | undefined, o: string): string | null => {
        let x = o;
        for (let guard = 0; guard < 256; guard++) {
            const r = runOf(x);
            if (r === c) return isBand(x) && !isOwner(x) ? null : x;
            if (r === undefined) return null;
            x = r;
        }
        return null;
    };
    const depthOf = (o: string) => { let d = 0; const seen = new Set<string>(); for (let a = parentOf(o); a !== undefined && !seen.has(a); a = parentOf(a)) { seen.add(a); d++; } return d; };
    const keys = nodes.filter(n => !n.hidden).map(n => keyOf(n.id));
    const owners = [...new Set(keys)].filter(isOwner).sort((a, b) => depthOf(b) - depthOf(a));
    const itemsOf = new Map<string | undefined, string[]>();
    for (const k of keys) {
        if (isBand(k) && !isOwner(k)) continue;
        const r = runOf(k);
        if (!itemsOf.has(r)) itemsOf.set(r, []);
        itemsOf.get(r)!.push(k);
    }
    /** The band of a node in a `partitions` run: its ancestor-or-self whose parent is the run's container. */
    const bandOf = (c: string, o: string): string | undefined => {
        const seen = new Set<string>();
        for (let x: string | undefined = o; x !== undefined && !seen.has(x); x = parentOf(x)) {
            seen.add(x);
            if (parentOf(x) === c) return x;
        }
        return undefined;
    };
    return { byVertex, shown, layoutOf, vertexOf, keyOf, isBand, isOwner, runOf, itemIn, owners, itemsOf, bandOf, depthOf };
}

const translateRoute = (r: ElkRoute, t: Pt): ElkRoute => ({
    ...r,
    points: r.points.map(p => ({ x: p.x + t.x, y: p.y + t.y })),
    sourceRect: { ...r.sourceRect, x: r.sourceRect.x + t.x, y: r.sourceRect.y + t.y },
    targetRect: { ...r.targetRect, x: r.targetRect.x + t.x, y: r.targetRect.y + t.y },
    ...(r.centerLabel ? { centerLabel: { x: r.centerLabel.x + t.x, y: r.centerLabel.y + t.y } } : {}),
});

/**
 * The toolbar Auto layout with containment (S6). Positions in flow coordinates for every node it lays out or carries
 * (its hidden content included), ELK's routes where they still hold, and the boxes to grow.
 */
export async function computeContainedAutoLayout(nodes: Node[], edges: Edge[], input: ContainedAutoLayoutInput = {}): Promise<ContainedAutoLayoutResult> {
    const model = input.containment;
    const anyLayout = !!model && [...model.containers.values()].some(c => !!c.layout && nodes.some(n => n.id === c.vertexId && !n.hidden));
    if (!model || !anyLayout) return { ...(await computeElkAutoLayout(nodes, edges, input)), sizes: new Map() };

    const plan = planContainedLayout(nodes, model);
    const { byVertex, shown, layoutOf, vertexOf, keyOf, itemIn, owners, itemsOf, bandOf, isOwner, depthOf } = plan;
    const block = new Map<string, Size>();                    // owner -> its laid-out size
    const rel = new Map<string, Map<string, Pt>>();           // owner -> item or band -> position from the owner's origin
    const runShift = new Map<string, Pt>();                   // owner -> run coordinates to owner coordinates (free runs)
    const runRoutes = new Map<string, Map<string, ElkRoute>>();
    const sizes = new Map<string, { w: number; h: number }>();
    const sizeOf = (o: string): Size => block.get(o) ?? sizeOfNode(byVertex.get(vertexOf(o)!)!);
    const nodeFor = (o: string): Node => {
        const n = byVertex.get(vertexOf(o)!)!;
        const b = block.get(o);
        return b ? { ...n, width: b.w, height: b.h, measured: { width: b.w, height: b.h } } : n;
    };
    /** The run's edges, between the blocks that hold their ends there; `real` when both ends are the edge's own. */
    const edgesIn = (c: string | undefined, items: Set<string>) => {
        const out: Edge[] = [];
        const real = new Set<string>();
        for (const e of edges) {
            if (e.hidden || !shown(e.source) || !shown(e.target)) continue;
            const s = keyOf(e.source), t = keyOf(e.target);
            const a = itemIn(c, s), b = itemIn(c, t);
            if (!a || !b || a === b || !items.has(a) || !items.has(b)) continue;
            out.push(a === s && b === t ? e : { ...e, source: vertexOf(a)!, target: vertexOf(b)! });
            if (a === s && b === t) real.add(e.id);
        }
        return { out, real };
    };

    for (const c of owners) {
        const layout = layoutOf(c)!;
        const items = itemsOf.get(c) ?? [];
        if (layout.mode === 'partitions') {
            await layoutPartitionsRun(c, layout, items);
            continue;
        }
        // A free container: one run on its children, the root run's options; the result inside its content box.
        const { out: runEdges, real } = edgesIn(c, new Set(items));
        const res = await computeElkAutoLayout(items.map(nodeFor), runEdges, input);
        const pos = new Map(items.map(o => [o, res.positions.get(vertexOf(o)!) ?? { x: 0, y: 0 }] as const));
        const minX = Math.min(...[...pos.values()].map(p => p.x));
        const minY = Math.min(...[...pos.values()].map(p => p.y));
        const content = items.map(o => ({ x: pos.get(o)!.x - minX, y: pos.get(o)!.y - minY, ...sizeOf(o) }));
        const band = layout.header;
        const bandW = band?.side === 'w' ? band.size : 0;
        const bandH = band?.side === 'n' ? band.size : 0;
        const stored = input.storedOf?.(vertexOf(c)!);
        let origin: Pt;
        if (layout.frame === 'self') {
            // The frame the presentation pass will draw around them (irFrame), its top-left at the container's origin.
            const f = frameBox({ children: content.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h })), padding: layout.padding, header: band, stored })!;
            origin = { x: -f.x, y: -f.y };
            block.set(c, { w: f.w, h: f.h });
        } else {
            // Its own box: the stored one, grown (and written) when the content needs more.
            const m = Math.max(layout.padding, CONTAINER_CONTENT_MARGIN);
            origin = { x: bandW + m, y: bandH + m };
            const cw = Math.max(0, ...content.map(r => r.x + r.w));
            const ch = Math.max(0, ...content.map(r => r.y + r.h));
            const own = sizeOfNode(byVertex.get(vertexOf(c)!)!);
            const need = { w: cw + 2 * m + bandW, h: ch + 2 * m + bandH };
            const size = { w: Math.max(own.w, need.w), h: Math.max(own.h, need.h) };
            if (size.w > own.w + 0.5 || size.h > own.h + 0.5) sizes.set(vertexOf(c)!, size);
            block.set(c, size);
        }
        rel.set(c, new Map(items.map((o, i) => [o, { x: origin.x + content[i].x, y: origin.y + content[i].y }] as const)));
        runShift.set(c, { x: origin.x - minX, y: origin.y - minY });
        const kept = new Map<string, ElkRoute>();
        for (const [id, r] of res.routes) if (real.has(id)) kept.set(id, r);
        runRoutes.set(c, kept);
    }

    async function layoutPartitionsRun(c: string, layout: CompiledContainmentLayout, items: string[]) {
        const vertical = layout.axis !== 'horizontal';
        const bands = (model!.childrenOf.get(c) ?? []).filter(k => shown(vertexOf(k)));
        // A band that lays out its own content (sub-partitions) is a block of its own: out of this run.
        const flowItems = items.filter(o => !bands.includes(o));
        const { out: runEdges } = edgesIn(c, new Set(flowItems));
        const profile = { ...(input.profile ?? {}), algorithm: 'layered' as const, direction: vertical ? 'RIGHT' as const : 'DOWN' as const };
        const res = flowItems.length ? await computeElkAutoLayout(flowItems.map(nodeFor), runEdges, { ...input, profile }) : { positions: new Map<string, ElkPoint>() };
        const along = (p: Pt) => (vertical ? p.x : p.y);
        const across = (p: Pt) => (vertical ? p.y : p.x);
        const sizeAlong = (s: Size) => (vertical ? s.w : s.h);
        const sizeAcross = (s: Size) => (vertical ? s.h : s.w);
        const posOf = (o: string) => res.positions.get(vertexOf(o)!) ?? { x: 0, y: 0 };
        const minAlong = flowItems.length ? Math.min(...flowItems.map(o => along(posOf(o)))) : 0;
        const M = CONTAINER_CONTENT_MARGIN;
        const perBand = bands.map(b => {
            const own = flowItems.filter(o => bandOf(c, o) === b);
            const minAcross = own.length ? Math.min(...own.map(o => across(posOf(o)))) : 0;
            const hb = layoutOf(b)?.header ?? null;
            const offAlong = hb && (vertical ? hb.side === 'w' : hb.side === 'n') ? hb.size : 0;
            const offAcross = hb && (vertical ? hb.side === 'n' : hb.side === 'w') ? hb.size : 0;
            const stored = input.storedOf?.(vertexOf(b)!);
            let need: number, contentAlong: number, spanNeed: number;
            if (isOwner(b)) {
                need = sizeAcross(sizeOf(b));
                contentAlong = spanNeed = sizeAlong(sizeOf(b));
            } else {
                const spanAcross = Math.max(0, ...own.map(o => across(posOf(o)) - minAcross + sizeAcross(sizeOf(o))));
                // Along the flow the band's content runs from the run's start (the flow's coordinate is shared), while
                // the presentation pass sizes a band by its own span: both are kept, to tell when the box must be written.
                const end = Math.max(0, ...own.map(o => along(posOf(o)) - minAlong + sizeAlong(sizeOf(o))));
                const start = own.length ? Math.min(...own.map(o => along(posOf(o)) - minAlong)) : 0;
                need = own.length ? spanAcross + 2 * M + offAcross : 0;
                contentAlong = own.length ? end + 2 * M + offAlong : 0;
                spanNeed = own.length ? end - start + 2 * M + offAlong : 0;
            }
            const storedAcross = stored ? (vertical ? stored.h : stored.w) : 0;
            const extent = stored?.isResized ? Math.max(storedAcross, need) : Math.max(need, MIN_PARTITION_EXTENT);
            return { b, own, minAcross, offAlong, offAcross, need, contentAlong, spanNeed, extent, grows: !!stored?.isResized && need > storedAcross + 0.5 };
        });
        const storedC = input.storedOf?.(vertexOf(c)!);
        const containerOf = (cross: (p: typeof perBand[number]) => number) => layoutPartitions({
            container: { x: 0, y: 0, w: storedC?.w, h: storedC?.h, isResized: !!storedC?.isResized },
            axis: layout.axis, header: layout.header, padding: layout.padding,
            partitions: perBand.map((p): PartitionSpec => ({ stored: p.extent, isResized: true, contentCross: cross(p) })),
        });
        const l = containerOf(p => p.contentAlong);
        // The box the presentation pass would give from the bands' own spans: when the shared flow needs more, the
        // container's laid-out box is written (sized by hand), the floor the pass keeps.
        const byPass = containerOf(p => p.spanNeed).container;
        if (l.container.w > byPass.w + 0.5 || l.container.h > byPass.h + 0.5) sizes.set(vertexOf(c)!, { w: l.container.w, h: l.container.h });
        const at = new Map<string, Pt>();
        perBand.forEach((p, i) => {
            const r: Rect = l.partitions[i];
            at.set(p.b, { x: r.x, y: r.y });
            if (p.grows) sizes.set(vertexOf(p.b)!, { w: r.w, h: r.h });
            for (const o of p.own) {
                const a = along(posOf(o)) - minAlong + M + p.offAlong;
                const x = across(posOf(o)) - p.minAcross + M + p.offAcross;
                at.set(o, vertical ? { x: r.x + a, y: r.y + x } : { x: r.x + x, y: r.y + a });
            }
        });
        rel.set(c, at);
        block.set(c, { w: l.container.w, h: l.container.h });
    }

    // The root: every top-level node and container together, as today.
    const rootItems = itemsOf.get(undefined) ?? [];
    const { out: rootEdges, real: rootReal } = edgesIn(undefined, new Set(rootItems));
    const rootRes = await computeElkAutoLayout(rootItems.map(nodeFor), rootEdges, input);
    const abs = new Map<string, Pt>();
    for (const o of rootItems) { const p = rootRes.positions.get(vertexOf(o)!); if (p) abs.set(o, p); }
    // Top-down: each owner's content from where its block landed.
    for (const c of [...owners].sort((a, b) => depthOf(a) - depthOf(b))) {
        const base = abs.get(c);
        if (!base) continue;
        for (const [o, p] of rel.get(c) ?? []) abs.set(o, { x: base.x + p.x, y: base.y + p.y });
    }

    const positions = new Map<string, ElkPoint>();
    for (const [o, p] of abs) positions.set(vertexOf(o)!, p);
    // Hidden content (a collapsed container's, a hidden child's) moves with its nearest moved ancestor, unchanged.
    for (const n of nodes) {
        if (!n.hidden || positions.has(n.id)) continue;
        const seen = new Set<string>();
        for (let a = model.parentOf.get(keyOf(n.id)); a !== undefined && !seen.has(a); a = model.parentOf.get(a)) {
            seen.add(a);
            const to = abs.get(a);
            const from = byVertex.get(vertexOf(a)!);
            if (!to || !from) continue;
            positions.set(n.id, { x: n.position.x + to.x - from.position.x, y: n.position.y + to.y - from.position.y });
            break;
        }
    }

    // Routes: the root's as they come; a free run's moved with its container; a partitions run's dropped (the bands
    // moved its nodes across the flow). Only edges laid out between their own ends.
    const routes = new Map<string, ElkRoute>();
    for (const [id, r] of rootRes.routes) if (rootReal.has(id)) routes.set(id, r);
    for (const [c, rs] of runRoutes) {
        const base = abs.get(c);
        const shift = runShift.get(c);
        if (!base || !shift) continue;
        for (const [id, r] of rs) routes.set(id, translateRoute(r, { x: base.x + shift.x, y: base.y + shift.y }));
    }
    return { positions, routes, sizes, ...(rootRes.outsideAnchors ? { outsideAnchors: rootRes.outsideAnchors } : {}) };
}
