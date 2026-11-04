/**
 * Decides whether the open-time auto-layout may run (P-2026-10-10-1155).
 *
 * Why it exists: `useJjomSync` raises `justCreatedGraphRef` on EVERY populate run that creates
 * something, not only when it creates the graph, and EditorV2's init callback answered that flag with
 * an ELK pass over the whole canvas, written back under the active layout key. So an open that only had
 * to add one vertex (e.g. an object JjScript created while the canvas was closed) moved every node the
 * user had placed and overwrote their records. Measured by the nested-vertices probe, scenario E3b:
 * docs/discovery/discovery_2026-10-10_relayout_on_open.md.
 *
 * The rule: the open-time layout runs only on a graph that has never been laid out, i.e. no vertex of it
 * carries a layout record (`DVertex.layoutByViewpoint`, any key, R-LAY-14). A record is written only by a
 * layout gesture or by this same auto-layout, never by the populate run, so reading the graph when the
 * decision is taken sees what it held before the run. The birth position (the four scalars, the seed of
 * R-LAY-14) does not count: the transformation flow (ProjectEditor) creates every vertex on its own grid
 * before the canvas opens and relies on this layout, as does a first import, whose graph does not exist yet.
 *
 * Pure, over plain D-state, so it is tested without React or the store.
 */

/** Does any element under `graphId`, followed through `subElements`, carry a layout record? */
function graphHasLayoutRecord(graphId: string, idlookup: Readonly<Record<string, unknown>>): boolean {
    const seen = new Set<string>();
    const stack: string[] = [graphId];
    while (stack.length > 0) {
        const id = stack.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const el = idlookup[id] as { layoutByViewpoint?: unknown; subElements?: unknown } | undefined;
        if (!el) continue;
        const records = el.layoutByViewpoint;
        if (records && typeof records === 'object' && Object.values(records).some(r => !!r && typeof r === 'object')) return true;
        if (Array.isArray(el.subElements)) {
            for (const se of el.subElements) if (typeof se === 'string') stack.push(se);
        }
    }
    return false;
}

/**
 * Above this many nodes, or this many edges, the open-time layout does not run (P-2026-11-04-0926).
 * ELK runs in the main thread and grows about n^2.3 with the edges: 639 nodes with edges took 4 s,
 * 1,535 took 61 s, 2,559 took 153 s, while 2,559 nodes with no edge took under 1 s
 * (docs/discovery/discovery_2026-11-04_elk_open_freeze.md F2). The edges drive the cost, but at the
 * decision the reference edges may not be in the canvas yet, and the re-layout watcher would then rerun
 * ELK with them; the node count is there already and, on a tree, is the edge count plus one. So both
 * count. The explicit layout command is not capped.
 */
export const AUTO_LAYOUT_ON_OPEN_CAP = 500;

/**
 * `createdOnOpen`: the populate run of this mount created something (`justCreatedGraphRef`).
 * `graphId`: the model's v2-flow graph; absent means nothing was ever laid out.
 * `size`: the nodes and edges the layout would get; absent means no cap.
 */
export function shouldAutoLayoutOnOpen(
    createdOnOpen: boolean,
    graphId: string | null | undefined,
    idlookup: Readonly<Record<string, unknown>>,
    size?: { nodes: number; edges: number },
): boolean {
    if (!createdOnOpen) return false;
    if (graphId && graphHasLayoutRecord(graphId, idlookup)) return false;
    if (size && (size.nodes > AUTO_LAYOUT_ON_OPEN_CAP || size.edges > AUTO_LAYOUT_ON_OPEN_CAP)) {
        console.info(`[autoLayoutOnOpen] auto-layout on open skipped: ${size.nodes} nodes, ${size.edges} edges, above the cap of ${AUTO_LAYOUT_ON_OPEN_CAP}. The vertices keep their default placement; the layout command still lays them out.`);
        return false;
    }
    return true;
}
