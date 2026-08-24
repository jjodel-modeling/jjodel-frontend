/**
 * Impure adapter at the store boundary for the per-viewpoint vertex layout.
 *
 * Sits next to the pure `vertexLayout.ts` exactly as `irResolve.ts` sits next to
 * `irResolveCore.ts`: everything that needs the store lives here, so the resolver stays a module
 * with no imports at all (R-LAY-16 as amended 2026-08-24).
 *
 * It maps BOTH "no active viewpoint" AND "the active viewpoint is not exclusive" to `null`
 * BEFORE the pure module is called: downstream, `null` means "the abstract-syntax record", i.e.
 * the vertex's own x/y/w/h/isResized scalars. That single mapping is what makes the classic
 * renderer governed rather than exempt (R-LAY-9): its drop goes through the same resolver and
 * simply always lands on the scalars.
 */

import { store } from '../../../../joiner';

/**
 * Id of the active EXCLUSIVE viewpoint, or `null`.
 *
 * The activation source is the root `state.viewpoint` — the same one `irResolveCore.ts:139`
 * reads, never a second reading of the activation (R-LAY-11). Exclusivity is a direct read of
 * `isExclusiveView` on the viewpoint's D-object: no reusable predicate exists in the codebase,
 * the two existing readings are `lastViewpoint.ts:96` and `selectors.ts:558` (measured in
 * `docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md` §5.2).
 *
 * Deliberately defensive: any missing piece of state collapses to `null`, i.e. to today's
 * behavior. A layout gesture must never throw because a viewpoint could not be resolved.
 */
export function getActiveExclusiveVpId(): string | null {
    try {
        const state: any = store.getState();
        const vp = state?.viewpoint;
        if (typeof vp !== 'string' || !vp) return null;
        const d: any = state?.idlookup?.[vp];
        if (!d) return null;
        return d.isExclusiveView ? vp : null;
    } catch {
        return null;
    }
}
