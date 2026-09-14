/**
 * isKindOf — "is a" with ancestry, over the raw D-layer (R-SIM-8).
 *
 * True when the object's metaclass is `classId` or inherits from it through
 * `DClass.extends`, transitively and cycle-safe. The engine recognises the
 * metaclasses of its roles with this notion, the same one the IR applies to
 * views, instead of `instanceof ===`.
 *
 * ── Why a copy of the walk ──────────────────────────────────────────────────
 *
 * The IR already has this walk: `classAncestry` in
 * `components/editor-v2/viewpoint/ir/irReadCtx.ts`, exported and import-free.
 * It is not imported here because the core does not import from
 * `components/` (R-SIM-14), and importing it only in the panel's adapter would
 * leave the matching executed by no test (the panel imports the joiner, which
 * does not load under the node test bench). The duplication is declared, and
 * `step.test.ts` runs both walks on the same fixture so they cannot drift apart
 * unnoticed.
 *
 * One deliberate difference: an object whose metaclass id equals `classId` is
 * a match even when that DClass is no longer in the lookup. `classAncestry`
 * skips a missing class; the exact-id match this replaces did not, and a
 * behaviour the panel had is not taken away.
 */

export function isKindOf(lookup: Record<string, any>, objectId: string, classId: string): boolean {
    const start = lookup[objectId]?.instanceof;
    if (typeof start !== 'string') return false;
    const seen = new Set<string>();
    const queue: string[] = [start];
    while (queue.length > 0) {
        const cid = queue.shift() as string;
        if (cid === classId) return true;
        if (seen.has(cid)) continue;
        seen.add(cid);
        const ext = lookup[cid]?.extends;
        if (Array.isArray(ext)) {
            for (const e of ext) if (typeof e === 'string') queue.push(e);
        }
    }
    return false;
}
