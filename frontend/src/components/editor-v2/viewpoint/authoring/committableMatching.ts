/**
 * committableMatching — the commit gate for an unfinished matching (item C of
 * P-2026-09-18-1650).
 *
 * Switching "All metaclasses (*)" off writes `metaclasses: []` into the draft, a
 * shape that passes `validateIR` (probe G1, discovery_2026-09-15_plus_view_ir_seed
 * §5), so the debounced commit of the host panels used to store it: the view then
 * entered `viewIds` and matched nothing, blanking a viewpoint whose only IR view
 * is this one (probe G2). Decision (chat, 2026-09-18): an empty metaclass list is
 * not a matching, it is an unfinished edit — it stays in the draft and is never
 * committed; the stored ir keeps its previous `metaclasses` until the list has at
 * least one name.
 *
 * Pure module, no imports, so the node test bench can reach it: the host panels
 * import the `joiner` barrel (window is not defined under vitest) and
 * MatchingSection pulls scss through the `ui` barrel (no sass preprocessor in the
 * bench) — both measured 2026-09-18. Same move, and same reason, as
 * `frontend/src/model/nameLookup.ts` (CLAUDE.md §5).
 */

/**
 * True when `ir` may be committed as-is: the wildcard string, a non-empty
 * metaclass list, or a kind that has no `metaclasses` at all (edges, rows).
 * False exactly when the list exists and is empty — the unfinished edit.
 */
export function isCommittableMatching(ir: { metaclasses?: string | string[] }): boolean {
    return !(Array.isArray(ir?.metaclasses) && ir.metaclasses.length === 0);
}