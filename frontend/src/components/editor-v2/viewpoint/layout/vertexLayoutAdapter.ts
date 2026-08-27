/**
 * Impure adapter at the store boundary for the per-viewpoint vertex layout.
 *
 * Sits next to the pure `vertexLayout.ts` exactly as `irResolve.ts` sits next to
 * `irResolveCore.ts`: everything that needs the store lives here, so the resolver stays a module
 * with no imports at all (R-LAY-16 as amended 2026-08-24).
 *
 * It answers one question — which layout record is in force right now — and every reader and
 * writer of vertex geometry asks it. Abstract syntax is NOT a special case here: it is a layout
 * like any other, under its own key (see `ABSTRACT_SYNTAX_LAYOUT_KEY`).
 */

import { store } from '../../../../joiner';

/**
 * The key abstract syntax stores its layout under — a layout of its own, independent of every
 * viewpoint's (ratified 2026-08-24, after the visual verification of slice 1b).
 *
 * WHY A KEY AND NOT THE SCALARS. Until that rectification the four scalars played two roles at
 * once: the abstract-syntax layout AND the fallback every viewpoint without a record read from.
 * The second role made the first one leak — moving a node in abstract syntax moved it under
 * every viewpoint that had not been touched yet. Splitting the roles fixes it: the scalars are
 * now the SEED (the layout a vertex is born with, never rewritten by editor-v2) and abstract
 * syntax is just another key. Every layout then starts from the seed and forks at its first
 * gesture, symmetrically.
 *
 * The spelling is a reserved literal, deliberately NOT `Defaults.Pointer_ViewPointDefault`: it
 * can never collide with a viewpoint id, and it keeps the two spellings of "empty viewpoint"
 * (D10.a) out of the layout key.
 *
 * No migration: an existing project has no dictionary at all, so every viewpoint AND abstract
 * syntax fall back to the seed, i.e. to the exact layout the project has today.
 */
export const ABSTRACT_SYNTAX_LAYOUT_KEY = '__abstract__';

/**
 * The layout key in force: the id of the active EXCLUSIVE viewpoint, or
 * `ABSTRACT_SYNTAX_LAYOUT_KEY` when no viewpoint is active, when the active one is decorative
 * rather than exclusive, or on a metamodel (where the viewpoint selector is not rendered by
 * design — a metamodel is simply a model that only ever has abstract syntax).
 *
 * The activation source is the root `state.viewpoint` — the same one `irResolveCore.ts:139`
 * reads, never a second reading of the activation (R-LAY-11). Exclusivity is a direct read of
 * `isExclusiveView` on the viewpoint's D-object: no reusable predicate exists in the codebase,
 * the two existing readings are `lastViewpoint.ts:96` and `selectors.ts:558` (measured in
 * `docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md` §5.2).
 *
 * Deliberately defensive: any missing piece of state collapses to abstract syntax, never to a
 * half-resolved viewpoint. A layout gesture must not throw because a viewpoint could not be
 * resolved. Note that `null` — the pure module's "write the seed" case — is never returned from
 * here: editor-v2 does not rewrite the seed.
 */
export function getActiveLayoutKey(): string {
    return getLayoutKeyOf(store.getState());
}

/**
 * The same answer, on a state the caller already holds.
 *
 * Exists for `useSelector` bodies, which are handed the state and must not reach for the store
 * themselves: a selector that read `store.getState()` would not re-run when the activation
 * changes, because react-redux compares what the selector RETURNS over the state it was GIVEN.
 * Reading `state.viewpoint` through this function is what makes a selector re-evaluate at every
 * layout change with no extra dependency (slice 1c: `useContentSize.ts`,
 * `SymbolEditorModal.tsx`).
 *
 * `getActiveLayoutKey` is this function applied to the live store, and nothing else — the two
 * can never disagree.
 */
export function getLayoutKeyOf(state: any): string {
    try {
        const vp = state?.viewpoint;
        if (typeof vp !== 'string' || !vp) return ABSTRACT_SYNTAX_LAYOUT_KEY;
        const d: any = state?.idlookup?.[vp];
        if (!d) return ABSTRACT_SYNTAX_LAYOUT_KEY;
        return d.isExclusiveView ? vp : ABSTRACT_SYNTAX_LAYOUT_KEY;
    } catch {
        return ABSTRACT_SYNTAX_LAYOUT_KEY;
    }
}
