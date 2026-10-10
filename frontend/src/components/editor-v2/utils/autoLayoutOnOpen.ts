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
 * `createdOnOpen`: the populate run of this mount created something (`justCreatedGraphRef`).
 * `graphId`: the model's v2-flow graph; absent means nothing was ever laid out.
 */
export function shouldAutoLayoutOnOpen(
    createdOnOpen: boolean,
    graphId: string | null | undefined,
    idlookup: Readonly<Record<string, unknown>>,
): boolean {
    if (!createdOnOpen) return false;
    if (!graphId) return true;
    return !graphHasLayoutRecord(graphId, idlookup);
}
