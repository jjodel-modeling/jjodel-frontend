/**
 * viewParentingOptions — what the "Applies to" parenting block needs to know, computed
 * from the persisted state and nothing else.
 *
 * Kept out of the component so the two rules that matter can be asserted by a test
 * instead of by looking at a rendered list:
 *
 *  - co-membership (D-4-2): a candidate parent is filed under the SAME viewpoint as the
 *    view being edited, read from the same denormalized field the read-only row shows.
 *    Row and list cannot contradict each other, because they are the same value.
 *  - no cycles (D-4-6): the view itself and its whole subtree are out of the list, so a
 *    cycle is not creatable from the UI. That matters beyond tidiness: a cycle that gets
 *    in from legacy data or the console is walked by `get_viewpoint`/`get_fatherChain` in
 *    view.tsx, which terminate on it but answer nothing useful (`undefined` and a partial
 *    chain respectively). This list is what keeps the cycle from being created at all.
 *
 * The root of the viewpoint is a first-class entry, not a "None": `father` pointing at
 * the viewpoint IS how a top-level view is stored. The old "None" option wrote `''`,
 * which `set_father` then propagated as an undefined `viewpoint` — the view disappeared
 * from the IR index and made the classic scoring throw (D-4-7).
 *
 * See docs/discovery/discovery_2026-08-07_father_single_writer.md (B4, N3).
 */

import { collectViewSubtree, type ViewSubtreeSource } from '../../view/viewElement/viewSubtree';

export interface ParentOption {
    value: string;
    label: string;
}

export interface ViewParentingFacts {
    /** `d.viewpoint`: the persisted field the IR resolver files the view under. */
    viewpointId?: string;
    viewpointName?: string;
    /** `d.father`, empty when the view hangs from nothing. */
    fatherId?: string;
    /** Name of the father, when there is one. */
    fatherName?: string;
    /** No father at all: legacy state, no UI path produces it any more. */
    detached: boolean;
    /** Root of the viewpoint first, then the co-located views, by name. */
    parentOptions: ParentOption[];
    /** How many views would follow this one in a move. */
    descendantCount: number;
}

export function readViewParenting(state: ViewSubtreeSource, viewId: string): ViewParentingFacts {
    const d = state?.idlookup?.[viewId];
    const viewpointId: string | undefined =
        (typeof d?.viewpoint === 'string' && d.viewpoint) ? d.viewpoint : undefined;
    const fatherId: string | undefined =
        (typeof d?.father === 'string' && d.father) ? d.father : undefined;

    const subtree = collectViewSubtree(state, viewId);
    const excluded: Set<string> = new Set(subtree);
    excluded.add(viewId);

    const coLocated: ParentOption[] = [];
    // With no viewpoint of its own there is nothing to be co-located WITH: offering the
    // views that happen to share that emptiness would propose a parent at random.
    if (viewpointId) {
        for (const vid of (state?.viewelements || [])) {
            if (excluded.has(vid)) continue;
            const dv = state.idlookup?.[vid];
            if (!dv || dv.viewpoint !== viewpointId) continue;
            coLocated.push({ value: vid, label: dv.name || vid });
        }
        coLocated.sort((a, b) => a.label.localeCompare(b.label));
    }

    const viewpointName: string | undefined = viewpointId ? state.idlookup?.[viewpointId]?.name : undefined;
    const fatherName: string | undefined = fatherId ? state.idlookup?.[fatherId]?.name : undefined;
    const parentOptions: ParentOption[] = viewpointId
        ? [{ value: viewpointId, label: `(root of ${viewpointName || 'viewpoint'})` }, ...coLocated]
        : coLocated;

    return {
        viewpointId,
        viewpointName,
        fatherId,
        fatherName,
        detached: !fatherId,
        parentOptions,
        descendantCount: subtree.length,
    };
}
