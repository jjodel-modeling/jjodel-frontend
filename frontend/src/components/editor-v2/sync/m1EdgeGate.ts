/**
 * m1EdgeGate — the pure half of the gate in front of `useJjomSync`'s Step 4.
 *
 * Why it is a module and not four lines inline: the orchestrator is not reachable
 * under vitest (the joiner barrel reaches monaco, which dereferences `window` at
 * import time — nine suites in this repo die that way), and the bug this file
 * exists for was a COUNT, not a write. A count that cannot be executed in a test
 * can only be validated by reading it, and reading it is exactly what missed the
 * defect for as long as it lived. Same split, and same reason, as
 * `refEdgeReconcile.ts` next door, which carved Step 3's decision out of the hook.
 *
 * ── The defect, measured 2026-09-02 ───────────────────────────────────────────
 *
 * Step 4 creates the M1 instance edges and is gated on `missingM1EdgeCount > 0`.
 * That counter resolved both endpoints through the map of vertices PERSISTED in
 * the graph, and it is computed BEFORE Step 2/2bis create the missing ones. On a
 * graph whose M1 vertices are all still to be made — a model reopened after its
 * instances were created with the canvas unmounted — every endpoint missed, the
 * counter came out 0, and Step 4 never ran: the canvas drew three root nodes and
 * zero edges, with no warning anywhere. Step 3, whose creation loop is NOT gated
 * on its own counter, drew its M2 edges in the same run. The asymmetry was the bug.
 *
 * The fix is not a third pass and not a retry queue: the bootstrap already makes
 * all vertices before all edges, and Step 4 already re-reads the store before it
 * resolves endpoints. What was missing is that the GATE agreed with the pass it
 * guards — an endpoint whose vertex is one line away from existing is a reason to
 * run Step 4, not a reason to skip it.
 *
 * Everything here is a pure function over plain data: no store, no proxies, no
 * imports.
 */

/** The shape this module needs out of a raw D-object. Structural on purpose. */
export interface RawLike {
    className?: string;
    features?: unknown;
    values?: unknown;
    instanceof?: unknown;
}

export interface PendingVertexInput {
    /** `rawModel.objects` — the M1 roots Step 2bis iterates. */
    objects: readonly unknown[];
    /** `state.idlookup`. Only membership and `className` are read. */
    idlookup: Record<string, RawLike | undefined>;
    /** DObject id → DVertex id, for the vertices ALREADY in `graph.subElements`. */
    vertexByObject: ReadonlyMap<string, string>;
    /** `isSingletonSuppressed`, injected so this module stays import-free. */
    isSuppressed: (objId: string) => boolean;
}

/**
 * The objects Step 2bis is about to give a vertex to.
 *
 * Byte-for-byte the membership rule of Step 2bis's own loop — same order, same
 * four rejections — because a set that disagreed with it would gate Step 4 on
 * vertices that never arrive.
 */
export function collectPendingVertexObjects(input: PendingVertexInput): Set<string> {
    const { objects, idlookup, vertexByObject, isSuppressed } = input;
    const pending = new Set<string>();
    for (const objId of objects) {
        if (typeof objId !== 'string') continue;
        if (!idlookup[objId]) continue;
        if (vertexByObject.has(objId)) continue;
        if (isSuppressed(objId)) continue;
        pending.add(objId);
    }
    return pending;
}

/** One (source object, meta reference, target object) tuple that has no edge yet. */
export interface MissingM1Edge {
    srcObject: string;
    /** The `DReference` the slot instantiates. */
    metaId: string;
    tgtObject: string;
    /** The persisted source vertex, or `null` when Step 2bis still has to make it. */
    srcVertex: string | null;
    tgtVertex: string | null;
    /**
     * `${metaId}:${srcVertex}→${tgtVertex}`, or `null` when an endpoint is pending:
     * an edge cannot be keyed on a vertex that does not exist, so it cannot exist.
     */
    key: string | null;
}

export interface MissingM1EdgeInput extends Omit<PendingVertexInput, 'isSuppressed'> {
    /** Output of `collectPendingVertexObjects`. */
    pendingVertexObjects: ReadonlySet<string>;
    /** Edge keys already present in the graph, in `edgeKeyForD` format. */
    existingEdgeKeys: ReadonlySet<string>;
}

/**
 * Every M1 reference tuple that still needs an edge.
 *
 * An endpoint counts when it HAS a vertex or is in `pendingVertexObjects`; a
 * target outside `rawModel.objects` (a contained instance, which lives in its
 * parent's slot and never in that collection) counts through the first branch,
 * because whoever created it also created its vertex.
 *
 * Composition is not special-cased: a containment slot is a `DReference` like any
 * other and its value is the child, so `Book_0 --editions--> Edition_0` is found
 * by the same walk as `Book_0 --authors--> A`.
 */
export function collectMissingM1Edges(input: MissingM1EdgeInput): MissingM1Edge[] {
    const { objects, idlookup, vertexByObject, pendingVertexObjects, existingEdgeKeys } = input;
    const out: MissingM1Edge[] = [];
    for (const objId of objects) {
        if (typeof objId !== 'string') continue;
        const dObj = idlookup[objId] as any;
        if (!dObj) continue;
        const srcV = vertexByObject.get(objId) ?? null;
        if (!srcV && !pendingVertexObjects.has(objId)) continue;
        for (const featId of (dObj.features ?? [])) {
            if (typeof featId !== 'string') continue;
            const dFeat = idlookup[featId] as any;
            if (!dFeat) continue;
            const metaId = dFeat.instanceof;
            if (!metaId || typeof metaId !== 'string') continue;
            const meta = idlookup[metaId] as any;
            if (!meta || meta.className !== 'DReference') continue;
            for (const tgtObjId of (dFeat.values ?? [])) {
                if (typeof tgtObjId !== 'string') continue;
                const tgtV = vertexByObject.get(tgtObjId) ?? null;
                if (!tgtV && !pendingVertexObjects.has(tgtObjId)) continue;
                if (!srcV || !tgtV) {
                    out.push({ srcObject: objId, metaId, tgtObject: tgtObjId,
                               srcVertex: srcV, tgtVertex: tgtV, key: null });
                    continue;
                }
                // Composite key (metaId:src→tgt): the same metaref is instantiated
                // across many object pairs (Family1.father → Member1, ...), and each
                // pair gets its own edge. Pair-only keys would collapse siblings
                // (CLAUDE.md §3.4).
                const key = `${metaId}:${srcV}→${tgtV}`;
                if (existingEdgeKeys.has(key)) continue;
                out.push({ srcObject: objId, metaId, tgtObject: tgtObjId,
                           srcVertex: srcV, tgtVertex: tgtV, key });
            }
        }
    }
    return out;
}
