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
 *  - no cycles (D-4-6): the view itself and its whole subtree cannot be picked, so a
 *    cycle is not creatable from the UI. That matters beyond tidiness: a cycle that gets
 *    in from legacy data or the console is walked by `get_viewpoint`/`get_fatherChain` in
 *    view.tsx, which terminate on it but answer nothing useful (`undefined` and a partial
 *    chain respectively). This list is what keeps the cycle from being created at all.
 *
 * The list is a TREE, not an alphabetical roll: depth-first from the root of the
 * viewpoint, siblings by name, one indent step per level — the nesting the Tree card
 * draws, in the order it draws it. Picking a parent is a statement about position in that
 * hierarchy, and a flat list made the user reconstruct it from memory.
 *
 * The forbidden entries are DISABLED, not removed (2026-08-10). Removing them made the
 * rendered tree disagree with the Tree card — sub-views vanishing with no stated reason —
 * and the rule is easier to obey when it is visible: the user sees exactly which branch
 * is out of reach, and why it would be a cycle.
 *
 * The root of the viewpoint is a first-class entry, not a "None": `father` pointing at
 * the viewpoint IS how a top-level view is stored. The old "None" option wrote `''`,
 * which `set_father` then propagated as an undefined `viewpoint` — the view disappeared
 * from the IR index and made the classic scoring throw (D-4-7).
 *
 * See docs/discovery/discovery_2026-08-07_father_single_writer.md (B4, N3).
 */

import { collectViewSubtree, type ViewSubtreeSource } from '../../view/viewElement/viewSubtree';

/**
 * One indent step per nesting level, written as explicit NON-BREAKING spaces: react-select
 * renders the label as plain text, and ordinary leading spaces collapse in HTML.
 *
 * The indent lives in `label` rather than in a `formatOptionLabel` renderer, because that
 * renderer would have to be threaded through the data-bound `Select` of `forEndUser` — a
 * shared control with many other consumers. Visible cost: the CLOSED select shows the
 * indent too, in front of the name of the picked parent.
 */
const INDENT = '\u00A0\u00A0\u00A0\u00A0';

export interface ParentOption {
    value: string;
    label: string;
    /** Nesting level, 0 for the root of the viewpoint. The indent of `label` mirrors it. */
    depth: number;
    /**
     * Offered but not selectable: picking it would make the view its own ancestor.
     * `isDisabled` is the field react-select's default `isOptionDisabled` reads.
     */
    isDisabled?: boolean;
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
    /**
     * The viewpoint's tree: its root first, then the co-located views depth-first with
     * siblings by name. The view and its descendants are present but `isDisabled`.
     */
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
    const forbidden: Set<string> = new Set(subtree);
    forbidden.add(viewId);

    const viewpointName: string | undefined = viewpointId ? state.idlookup?.[viewpointId]?.name : undefined;
    const fatherName: string | undefined = fatherId ? state.idlookup?.[fatherId]?.name : undefined;

    // With no viewpoint of its own there is nothing to be co-located WITH: offering the
    // views that happen to share that emptiness would propose a parent at random.
    const coLocated: string[] = [];
    if (viewpointId) {
        for (const vid of (state?.viewelements || [])) {
            const dv = state.idlookup?.[vid];
            if (!dv || dv.viewpoint !== viewpointId) continue;
            coLocated.push(vid);
        }
    }

    const nameOf = (vid: string): string => state.idlookup?.[vid]?.name || vid;
    const byName = (a: string, b: string) => nameOf(a).localeCompare(nameOf(b));

    // father -> children, restricted to the co-located set: the nesting the Tree draws.
    const childrenByFather: { [fatherId: string]: string[] } = {};
    for (const vid of coLocated) {
        const f = state.idlookup?.[vid]?.father;
        if (typeof f !== 'string' || !f) continue;
        (childrenByFather[f] || (childrenByFather[f] = [])).push(vid);
    }

    const parentOptions: ParentOption[] = [];
    // Guards a cycle among the co-located views: `collectViewSubtree` protects the walk
    // DOWN from `viewId`, this one protects the walk down from the viewpoint root.
    const emitted: Set<string> = new Set();

    const emit = (vid: string, depth: number): void => {
        if (emitted.has(vid)) return;
        emitted.add(vid);
        parentOptions.push({
            value: vid,
            label: INDENT.repeat(depth) + nameOf(vid),
            depth,
            // Its own subtree, itself included, would make the view its own ancestor. It
            // stays in the list — hiding it would misrepresent the nesting the user sees
            // in the Tree — but it cannot be picked.
            ...(forbidden.has(vid) ? { isDisabled: true } : {}),
        });
        for (const child of (childrenByFather[vid] || []).slice().sort(byName)) emit(child, depth + 1);
    };

    if (viewpointId) {
        // The root of the viewpoint is a first-class entry, not a "None" (D-4-7), and it
        // is the trunk everything else hangs from.
        parentOptions.push({ value: viewpointId, label: `(root of ${viewpointName || 'viewpoint'})`, depth: 0 });
        emitted.add(viewpointId);
        for (const top of (childrenByFather[viewpointId] || []).slice().sort(byName)) emit(top, 1);

        // Co-located views the walk never reached: a `father` that points outside the
        // viewpoint, at a dangling id, or into a cycle. They were offered before this
        // change and stay offered — dropping a legitimate parent to tidy the tree would
        // be a regression — listed flat after the tree, by name.
        for (const vid of coLocated.slice().sort(byName)) emit(vid, 1);
    }

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
