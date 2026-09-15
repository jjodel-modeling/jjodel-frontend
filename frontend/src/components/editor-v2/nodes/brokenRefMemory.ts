/**
 * brokenRefMemory — the name a deleted reference target used to have.
 *
 * Design handoff: `Instance Node Proposal.dc.html`, Turno 5b — a broken
 * reference shows «the last known target name in slate-400 with line-through».
 *
 * ── Why a session map and not a stored field ────────────────────────────────
 *
 * Deleting a DObject does not scrub the pointers that referred to it: the
 * reducer removes the record from `idlookup` and nothing walks the inbound
 * edges (measured 2026-08-28; `docs/decisions.md` R-SGL-9 (f) records the same
 * gap for M1 edges). So the dangling pointer survives in `DValue.values` and
 * the broken state is detectable — but the NAME went with the object, and no
 * field anywhere holds a copy of it.
 *
 * The three ways to get one:
 *
 *   1. print the dangling pointer id — always available, always right, and
 *      reads as debug output rather than as "the thing that used to be here";
 *   2. remember it for the session — correct for the case the user actually
 *      witnesses, which is deleting a target while looking at the canvas;
 *   3. persist it in the D layer — correct always, and a schema change plus a
 *      VersionFixer migration, well outside a level-3 row-view task.
 *
 * This is (2) with (1) as the fallback, which is the only combination that has
 * no wrong answer: while the name is known it is shown, and when it is not the
 * row degrades to the id rather than to a confident guess.
 *
 * Module-level state, deliberately: the map has to outlive every node unmount
 * (the row that goes broken is on a DIFFERENT node from the one deleted) and
 * has no place in Redux, being neither model data nor undoable. The same shape
 * as `syncState.ts`, one layer up.
 */

/**
 * Target id → the name it last resolved to. Never cleared: an entry is one
 * short string per object ever seen as a reference target on this canvas, and
 * dropping one can only downgrade a row to its pointer id.
 */
const lastSeenNames = new Map<string, string>();

/**
 * Record the name of a target that resolved. Called from the D→canvas
 * transformer on every pass, so the map is fresh for anything currently alive.
 */
export function rememberRefTargetName(id: string, name: string): void {
    if (!id || !name) return;
    lastSeenNames.set(id, name);
}

/**
 * What to print for a target that no longer resolves.
 *
 * The fallback shortens the pointer rather than printing it whole: an id is
 * ~20 characters of noise in a cell sized for a name, and its only job here is
 * to be visibly an id. The prefix is kept because it is the half a user can
 * match against the console.
 */
export function lastSeenRefTargetName(id: string): string {
    const known = lastSeenNames.get(id);
    if (known) return known;
    return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

/** True when the name below is remembered rather than a shortened pointer. */
export function hasLastSeenRefTargetName(id: string): boolean {
    return lastSeenNames.has(id);
}

/** Test seam. Not called by the application. */
export function __resetBrokenRefMemory(): void {
    lastSeenNames.clear();
}
