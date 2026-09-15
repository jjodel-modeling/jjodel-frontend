/**
 * jjform/write — the RESULT of a write, as the engine will report it.
 *
 * Slice S2 of the WriteCtx sequence (referto
 * `docs/discovery/discovery_2026-08-30_writectx_migrazione_motore.md` §4.2). The
 * `WriteCtx` interface itself is S4: what lands here now is the only piece of it
 * that a caller can already consume, and the piece without which `WriteCtx` would
 * be born with the wrong type.
 *
 * ── Why a boolean was not enough, measured ────────────────────────────────────
 *
 * The core's write primitive returns `{success, reason}`
 * (`LValue.setValueAtPosition`, `LModelElement.tsx:7582`), and it does refuse: a
 * containment loop comes back as
 * `{success: false, reason: "cannot create a containment loop"}` (`:7656`). Until
 * S2 `formWrite` threw that verdict away and returned `true` on a comparison taken
 * BEFORE the write, so a refused write was reported as a successful one and marked
 * the project modified. Exercised on the running app, not read
 * (`scripts/smoke/_tmp_s2_probe.ts`, 2026-08-30): the return was `true`,
 * `U.isProjectModified` went `false -> true`, and the slot values were `[]` before
 * and `[]` after. A boolean has no place to put "the host said no".
 *
 * ── Why `ok` and `changed` are two fields and not one ─────────────────────────
 *
 * They answer two different questions and they disagree in a case the form hits
 * constantly. A field commits on blur, so leaving it untouched reaches the write
 * path with the value it already holds: nothing is written, and nothing is wrong.
 * That is `{ok: true, changed: false}` — the project must not be flagged dirty, and
 * the field must not declare a refusal. Collapsing the two into one boolean forces
 * that case to lie in one direction or the other, which is the bug this type exists
 * to close.
 *
 * ── The convergence, declared and NOT taken here ──────────────────────────────
 *
 * Three verdict shapes now live side by side and are deliberately left apart:
 *
 *   S1a  `UniquenessVerdict {ok, reason?, collidingWith?}`  (nameUniqueness.ts)
 *   S1b  `{ok, value?, reason?, candidates?}`               (instance resolution)
 *   S2   `WriteResult {ok, changed, reason?}`               (this file)
 *
 * All three carry `{ok, reason}` and that is not a coincidence: S1a says so in its
 * own header. Unifying them now would mean deciding, before `WriteCtx` exists,
 * whether `changed` and `collidingWith` belong to one type — a decision the
 * evidence does not yet support. They converge in **S4**, when `WriteCtx` gives
 * the write side a single surface and the question becomes answerable. Until then
 * each keeps its own shape and this note is the pointer.
 *
 * Zero imports, like every file in this directory (`shape.ts` header).
 */

/** The outcome of one write. */
export interface WriteResult {
    /** The host accepted the write. `false` means it refused, and `reason` says why. */
    ok: boolean;
    /** Something actually changed in the model. `ok: true, changed: false` is a
     *  no-op — the value asked for was the value already there — and is NOT a failure. */
    changed: boolean;
    /** The host's own words for the refusal. Passed through verbatim from whoever
     *  refused; never composed by the caller, never invented when the host gives none. */
    reason?: string;
}

/** The write happened. */
export function writeDone(): WriteResult { return { ok: true, changed: true }; }

/** Nothing to do: the value was already the one asked for. Not a failure. */
export function writeUnchanged(): WriteResult { return { ok: true, changed: false }; }

/** The host refused. `reason` is the host's, and stays `undefined` when it gave none
 *  — a caller that needs a sentence supplies its own, rather than this file
 *  inventing one on the host's behalf. */
export function writeRefused(reason?: string): WriteResult {
    return { ok: false, changed: false, reason };
}
