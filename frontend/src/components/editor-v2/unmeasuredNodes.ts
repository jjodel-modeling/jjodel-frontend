/**
 * The nodes React Flow has never measured (P-2026-11-04-0901, LIR docs/discovery/lir_2026-11-04_canvas_mount_unmeasured.md).
 *
 * With `onlyRenderVisibleElements` on, React Flow still renders every node whose handles it has not measured
 * (`forceInitialRender = !node.internals.handleBounds`, @xyflow/system), measures it, then unmounts what is off
 * screen: on a large canvas, two long tasks on open (discovery_2026-11-04_jjtl_canvas_render.md, F2-F3). A node that
 * reaches the `nodes=` prop with a `handles` array and a `measured` size is not force-rendered: its handles are the
 * 32 of the DynamicHandles pool, where that component would draw them on an estimated box, and its size is the
 * estimate, so every `fitView()` resolves (`nodesInitialized`) and every edge into it finds its handle.
 *
 * The decoration lives on React Flow's side of the prop only. `undecorate` gives the canvas node back to every
 * reader of `getNodes()` and to every change React Flow builds from a decorated node: port distribution and ELK
 * never read the estimate. A node that mounts is measured by React Flow as any other; the estimate is half a pixel
 * off an integer, so that first measurement always differs from it and reaches the canvas state, which then holds
 * a real `measured` and the node is no longer decorated.
 */
import { Position, type Edge, type Node } from '@xyflow/react';
import { MAX_HANDLES_PER_SIDE, type NodePosition, type Side } from './utils/portDistribution';
import { computeSideEndpoints, computeSidePositions } from './utils/handlePosition';

/** At or under this many nodes the canvas mounts every node, as before: the decoration is for large canvases. */
export const MOUNT_ALL_MAX_NODES = 150;

/** The box a never-measured node goes in with: 180 x 80 (the size fallback of DynamicHandles and getNodeRect), half a pixel off. */
export const ESTIMATED_NODE_SIZE = { width: 180.5, height: 80.5 } as const;

/** Side of a pool handle, from `.mm-anchor` (8 x 8 px). */
export const HANDLE_SIZE = 8;

/** One entry of a node's `handles` array (React Flow does not export the type by name). */
type NodeHandle = NonNullable<Node['handles']>[number];

const SIDES: readonly Side[] = ['top', 'right', 'bottom', 'left'];
const SIDE_TO_POSITION: Record<Side, Position> = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };

/** On a decorated node, and on any copy React Flow makes of it: the canvas node it was made from. */
const SOURCE = Symbol('unmeasuredNodes.source');
const DECORATED = new WeakSet<object>();

type Decorated = Node & { [SOURCE]?: Node };

/** Whether the canvas hands React Flow decorated nodes: only where it renders the visible elements only, and only above the cap. */
export function shouldDecorate(onlyRenderVisible: boolean, nodeCount: number): boolean {
    return onlyRenderVisible && nodeCount > MOUNT_ALL_MAX_NODES;
}

/**
 * The handle bounds DynamicHandles renders for `nodeId` on a `box`, in React Flow's `NodeHandle` form (relative to
 * the node, in flow units). Per side and index a target then a source, as in the DOM. An endpoint an edge uses sits
 * at the fraction `computeSidePositions` gives it, any other handle at the middle of its side; React Flow's handle
 * CSS centres each one on the side line. Rectangular outline: no shape inset, no bar ink.
 */
export function synthesizeHandles(
    nodeId: string,
    ownEdges: readonly Edge[],
    box: { width: number; height: number },
    nodePositions: Map<string, NodePosition>,
): NodeHandle[] {
    const half = HANDLE_SIZE / 2;
    const out: NodeHandle[] = [];
    for (const side of SIDES) {
        const fractions = computeSidePositions(computeSideEndpoints(ownEdges as Edge[], nodeId, side), nodePositions);
        for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++) {
            const id = `${side}-${index}`;
            for (const type of ['target', 'source'] as const) {
                const t = fractions.get(`${id}:${type}`) ?? 0.5;
                const cx = side === 'left' ? 0 : side === 'right' ? box.width : t * box.width;
                const cy = side === 'top' ? 0 : side === 'bottom' ? box.height : t * box.height;
                out.push({ id, type, position: SIDE_TO_POSITION[side], x: cx - half, y: cy - half, width: HANDLE_SIZE, height: HANDLE_SIZE });
            }
        }
    }
    return out;
}

/** The fields DynamicHandles keys its handle recompute on (its `edgeTopologyKey`), for one node. */
function topologyKey(ownEdges: readonly Edge[]): string {
    return ownEdges.map((e) => {
        const d = e.data as { irSourcePin?: unknown; irTargetPin?: unknown } | undefined;
        const pins = d && (d.irSourcePin !== undefined || d.irTargetPin !== undefined) ? `:${String(d.irSourcePin ?? '')}:${String(d.irTargetPin ?? '')}` : '';
        return `${e.id}:${e.source}:${e.target}:${e.type}:${e.sourceHandle ?? ''}:${e.targetHandle ?? ''}${pins}`;
    }).sort().join('|');
}

function needsDecoration(n: Node): boolean {
    return !n.hidden && !n.measured && !n.handles;
}

/** Node centres as DynamicHandles reads them off React Flow's lookup: absolute position plus half the size it knows. */
function centres(nodes: readonly Node[]): Map<string, NodePosition> {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const abs = (n: Node): { x: number; y: number } => {
        let x = n.position.x, y = n.position.y;
        let p = n.parentId ? byId.get(n.parentId) : undefined;
        for (let depth = 0; p && depth < 64; depth++) {
            x += p.position.x; y += p.position.y;
            p = p.parentId ? byId.get(p.parentId) : undefined;
        }
        return { x, y };
    };
    const out = new Map<string, NodePosition>();
    for (const n of nodes) {
        const { x, y } = abs(n);
        const w = n.measured?.width ?? (needsDecoration(n) ? ESTIMATED_NODE_SIZE.width : 180);
        const h = n.measured?.height ?? (needsDecoration(n) ? ESTIMATED_NODE_SIZE.height : 80);
        out.set(n.id, { centerX: x + w / 2, centerY: y + h / 2 });
    }
    return out;
}

export interface DecorationEntry { src: Node; key: string; handles: NodeHandle[]; out: Node }

/**
 * `nodes` with every node that needs it decorated; the array itself when none does. `cache` (one per canvas) keeps a
 * decorated object while its node object and its own edges stay, so React Flow keeps its internal node; its handles
 * are recomputed on the node's own edges only, never on positions, as DynamicHandles recomputes them.
 *
 * `measuredOnce` holds the ids React Flow has measured at least once. Such a node is never decorated, even with no
 * `measured`: the sync drops `measured` on a size change so that React Flow measures the node again
 * (useJjomSync.ts), and an estimate there would stand in for that measurement.
 */
export function decorateUnmeasured(
    nodes: Node[],
    edges: readonly Edge[],
    cache: Map<string, DecorationEntry>,
    measuredOnce?: { has(id: string): boolean },
): Node[] {
    const needs = (n: Node): boolean => needsDecoration(n) && !measuredOnce?.has(n.id);
    if (!nodes.some(needs)) {
        cache.clear();
        return nodes;
    }
    const own = new Map<string, Edge[]>();
    for (const n of nodes) if (needs(n)) own.set(n.id, []);
    for (const e of edges) {
        own.get(e.source)?.push(e);
        if (e.target !== e.source) own.get(e.target)?.push(e);
    }
    let positions: Map<string, NodePosition> | null = null;
    const seen = new Set<string>();
    const out = nodes.map((n) => {
        const ownEdges = own.get(n.id);
        if (!ownEdges) return n;
        seen.add(n.id);
        const key = topologyKey(ownEdges);
        const hit = cache.get(n.id);
        if (hit && hit.src === n && hit.key === key) return hit.out;
        let handles: NodeHandle[];
        if (hit && hit.key === key) handles = hit.handles;
        else {
            positions ??= centres(nodes);
            handles = synthesizeHandles(n.id, ownEdges, ESTIMATED_NODE_SIZE, positions);
        }
        const decorated: Decorated = { ...n, measured: { ...ESTIMATED_NODE_SIZE }, handles, [SOURCE]: n };
        DECORATED.add(decorated);
        cache.set(n.id, { src: n, key, handles, out: decorated });
        return decorated;
    });
    for (const id of cache.keys()) if (!seen.has(id)) cache.delete(id);
    return out;
}

/** Whether `n` is a decorated node or a copy of one. */
export function isDecorated(n: Node): boolean {
    return (n as Decorated)[SOURCE] !== undefined;
}

/**
 * The canvas node for a node read off React Flow: the source of a decorated node; for a copy React Flow made of one
 * (`getNodes()`, a `replace` change), the copy without the estimate and the handles; any other node as it is.
 */
export function undecorate<T extends Node>(n: T): T {
    const src = (n as Decorated)[SOURCE];
    if (src === undefined) return n;
    if (DECORATED.has(n)) return src as T;
    const { measured: _measured, handles: _handles, ...rest } = n as Decorated;
    delete (rest as Decorated)[SOURCE];
    return rest as T;
}

/** Whether every node that is not hidden has a measured size. */
export function allMeasured(nodes: readonly Node[]): boolean {
    return nodes.every((n) => n.hidden || (!!n.measured?.width && !!n.measured?.height));
}
