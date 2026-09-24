# Prompt: identity of the migrated default object view, structural fix

Prompt-ID: P-2026-09-24-1455
Chat: C-2026-09-24-1005
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl` (the trunk). Another lane is open in parallel: `P-2026-09-24-1005` in `~/jjodel-sim` on `simulation-engine`, touching `components/editor-v2/EditorV2.tsx` and `components/editor-v2/sim/`. Do not touch those files, do not work in `~/jjodel-sim` or `~/jjodel`.

Two-phase. Phase 1 is read-only and ends with a saved report and a hard stop. Phase 2 starts only on a GO that opens with this ID.

## COSA

`isMigratedDefaultView` (`frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts:228`) decides whether a migrated default object view delegates to the native renderer (`ObjectNode.tsx:118`). It does so by structural hash equality with the LIVE `defaultObjectViewIR()` plus a hand-kept list of frozen past shapes. Every change to the factory silently breaks every project migrated before it, unless someone freezes one more shape. This has now happened twice: R-IRN-33 (`516afd310`, `LEGACY_OBJECT_VIEW_SNAPSHOT`) and `P-2026-09-22-2105` (`fb876efaa`, `LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18`). R-IRN-33 in `docs/decisions.md` records the debt and names the structural solution to decide in its own round: mark the identity at migration time instead of comparing against a moving target. This is that round.

The chat's lean, to be tested against the code, not assumed: stamp each migrated or factory-created default view with the hash of its own `ir` at birth (a "birth hash"), and define "untouched" as `hash(current ir) === birth hash`. Untouched views delegate. That is robust to any future factory change and needs no hook on the edit paths, because any user edit changes the hash. Views that exist today without a stamp keep today's recognition (live shape plus the frozen list), and the frozen list is closed for good: no new entry is ever added, because every new view carries its stamp.

Out of scope: the native renderer and `ObjectNode.tsx` beyond the delegation decision, the row view (`EnableIRPanel.tsx` `rowSeed`, left out by the round of R-IRN-32), any change to how a delegated view paints.

## DOVE

Phase 1 reads, under `frontend/src/`: `components/editor-v2/viewpoint/ir/irDefaults.ts`, `irCompile.ts`, `irKindConvert.ts`, `__tests__/ir.test.ts`; `components/editor-v2/nodes/ObjectNode.tsx` (the delegation site); `view/viewElement/view.tsx`; every place that creates a view from `defaultObjectViewIR()` or writes an `ir` onto a view (grep for `defaultObjectViewIR`, `IR_DEFAULT_OBJECT_VIEW_ID`, writes of `.ir`); `VersionFixer.tsx` read-only, for the 2.225→2.226 migration path. In `docs/`: R-IRN-29..35, R-STR-6, R-STR-7 in `decisions.md`; `discovery_2026-09-22_ir_default_fill.md`.

`VersionFixer.tsx` is in the critical zone (§3.2 of `CLAUDE.md`). If Phase 2 needs to touch it, the report says so and carries a Layer Impact Report; no edit to it without an explicit go-ahead.

## COME

### Phase 1 (read-only)

1. Map every creation and write path of a default object view `ir`: migration (VersionFixer), new view from the viewpoint UI, IR seed (`plus view`), copy or duplicate, import/export (`.jjodel`, `.ecore` round-trip), collaborative sync. File and line for each. For each, say whether the view ends up delegated today, and whether that is intended.
2. Measure the current state: on a project saved before `400095370`, one saved between `516afd310` and `fb876efaa`, and a new one, which default views delegate. Use saved fixtures if they exist; if they do not, say so and measure at unit level with the frozen shapes. Report verbatim.
3. Evaluate the birth-hash design against the map of item 1. Where does the stamp live (a field on the view, an annotation, inside `ir`)? It must survive save/load, copy, import/export and collaborative sync, and must not itself enter the hash. Which paths must write it? What happens to a view whose `ir` the user edits and then reverts by hand to the default shape (with the birth hash it delegates again; say whether that is right)?
4. Alternatives, for comparison only: (a) an explicit `untouched` flag cleared by every edit path; (b) keep the frozen list and add a test that fails when the factory hash changes without a new snapshot (a guard, not a fix). Say what each costs. Recommend one; do not decide.
5. **Open questions for Alfonso**: whether existing unstamped views should be stamped once (that is a write at load, likely through VersionFixer, which R-IRN-32 avoided) or left on the closed legacy recognition forever; and whether a new default view created from the UI should delegate at all or always go through the IR interpreter.
6. Before proposing any new identifier (field, annotation key, function), grep the whole codebase for it and report the result.
7. Test plan with one mutation per rule: stamped and untouched delegates; stamped and edited does not; unstamped legacy shapes still delegate; a factory change does not break a stamped view (simulate by mutating the factory in the test); the stamp does not enter the hash.
8. Baseline gates now: typecheck error set (14 expected), vitest count, build.

Save the report as `docs/discovery/discovery_2026-09-24_migrated_view_identity.md`: objective, files read with full paths, the map of item 1, the measurement of item 2 verbatim, findings, risks, open questions for Alfonso (item 5 first), the proposed Phase 2 diff in prose with the file list. Commit it alone, with pathspec, on the trunk. Hard stop: the phase is not complete until the report is on disk and committed.

### Phase 2 (after GO)

1. Implement what the GO ratifies. Critical-zone files only with a Layer Impact Report and explicit go-ahead.
2. Tests per Phase 1 item 7, mutations reported.
3. Gates: typecheck with the same error set as the baseline, vitest, build, `npm run check:docs`, `npm run check:agents`.
4. Hard stop for Alfonso's visual check on 3001: a project saved before `400095370` and one saved between `516afd310` and `fb876efaa` still render their default object views natively; a new default view behaves as ratified; editing a default view's border switches it to the IR interpreter, and the change survives a save and reload.
5. After the OK: one code commit with pathspec, then one docs commit with the entry appended to `docs/log-inbox/ir.md` (create it with the header of the other inboxes if missing), a closing line under R-IRN-33 in `decisions.md`, and the Status flip of this file per P13. P6 trailer `Model: ...` in both bodies. Subjects end with `(P-2026-09-24-1455)` and stay within 72 characters without the suffix.

Never: `git add .`, `git stash` (R-IRN-33 records why), commits outside the trunk, push.

## RIFERIMENTI

- `docs/decisions.md`: R-IRN-29..35 (R-IRN-33 is the debt), R-STR-6, R-STR-7.
- Commits: `400095370`, `6ee6efcd5` (factory change), `516afd310` (first snapshot), `fb876efaa` (second snapshot, P-2026-09-22-2105).
- `docs/discovery/discovery_2026-09-22_ir_default_fill.md`.
