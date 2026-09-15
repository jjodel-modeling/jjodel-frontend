/**
 * viewSubtree — the descendants of a view, enumerated by scanning `father`.
 *
 * Two consumers need the same answer and must not disagree on it: the cascade in
 * `LViewElement.set_father`, which realigns the denormalized `viewpoint` of every
 * descendant when a view moves, and the "Parent view" select, whose candidate list
 * excludes the view itself and everything under it so that a cycle is not creatable
 * from the UI.
 *
 * Why it scans `father` and not `subViews`. `subViews` is the persisted opposite of
 * `father` and it has four live writers — creation (`joiner/classes.ts:1189`),
 * `set_father` itself, the recursive delete (`common/Dummy.ts:92`) and
 * `LViewElement.updateDefaultView` (`view.tsx:1758`), the last one a raw mutation
 * outside any action that runs on every project load. On top of that, the
 * `2.2 -> 2.201` migration sets `father = viewpoint` without rebuilding the reciprocal
 * entries, so a project migrated from that schema can carry a `father` whose parent
 * does not list it. Scanning the backward link is immune to all of it, and it is the
 * discipline CLAUDE.md §3.6 already prescribes for this exact situation.
 *
 * Cycles cannot be built from the UI once the select excludes the subtree, but they
 * remain reachable from the console and from legacy data. The visited set here is that
 * belt: this function always terminates. The two upward walks in view.tsx
 * (`get_viewpoint`, `get_fatherChain`) each carry their own, for the same reason.
 *
 * Pure: no store access, no import from the joiner barrel (view.tsx is itself part of
 * that barrel's graph), no side effect. The caller passes the state it has already
 * snapshotted.
 *
 * See docs/discovery/discovery_2026-08-07_father_single_writer.md (A3, A4, N4, N7).
 */

/** The two slices of `DState` this enumeration reads. */
export interface ViewSubtreeSource {
    /** Pointers of every DViewElement in the project. Viewpoints are not in here, and cannot be children. */
    viewelements: readonly string[];
    idlookup: { [id: string]: any };
}

/**
 * Every descendant of `rootId`, breadth-first, excluding `rootId` itself.
 * Returns `[]` for a leaf, for an unknown id and for an empty root pointer.
 */
export function collectViewSubtree(state: ViewSubtreeSource, rootId: string): string[] {
    if (!rootId || !state) return [];

    // father -> direct children, in one pass over the view list.
    const childrenByFather: { [fatherId: string]: string[] } = {};
    for (const vid of (state.viewelements || [])) {
        const father = state.idlookup?.[vid]?.father;
        if (typeof father !== 'string' || !father) continue;
        (childrenByFather[father] || (childrenByFather[father] = [])).push(vid);
    }

    const descendants: string[] = [];
    const visited: Set<string> = new Set([rootId]);
    let frontier: string[] = childrenByFather[rootId] || [];
    while (frontier.length) {
        const next: string[] = [];
        for (const vid of frontier) {
            if (visited.has(vid)) continue;   // also closes a cycle back onto rootId
            visited.add(vid);
            descendants.push(vid);
            const children = childrenByFather[vid];
            if (children) next.push(...children);
        }
        frontier = next;
    }
    return descendants;
}
