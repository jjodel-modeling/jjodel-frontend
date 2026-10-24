# Jjodie S4c: Apply as one undoable step

Prompt-ID: P-2026-10-24-0256
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S4c, core undo layer authorised by R-JJD-6)
Depends: P-2026-10-24-0225
Status: eseguito 2026-10-24 · lane jjodie-ui · code 74fab8b7c · probe a12b100fd ALL PASS · gates green · done
Corregge: none
Request: Alfonso, 2026-10-24 01:14, in the project chat («Apply ok»: one-step Apply through a minimal undo group)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`, A2). CLAUDE.md rule 5 (no core
change without approval) is satisfied for `redux/reducer/reducer.ts` only, by R-JJD-6 ratified by Alfonso at 01:14.
The critical-zone list of CLAUDE.md §3.2 stays not authorised: if the undo group needs one of those files, stop.

Worktree: `~/jjodel-w-jjp-s4c`, branch `jjp-s4c`, cut from `jjodie-panel` at `709122e2c` (S4a, S4b merged) plus the
commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0256 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 80 minutes. No subagents, no background tasks. Commit as soon as the
gates are green. One probe run per tool call. Context discipline: never `cat` a whole large file or log;
`reducer.ts` and `EditorV2.tsx` only by grep-found ranges (the report cites `reducer.ts:1200-1265`, `:1252`, `:1445`);
test, build and probe output through `tail` or `grep`. If the context passes about 150k, commit what is green, write a
handoff and stop. Dev server only on a free port in 3010..3019, never 3000, 3001 or 3003; stop it at the end.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in
`docs/log-inbox/jjodie-ui-s4c.md`, with the Layer Impact Report field filled (core change). Nothing merges anywhere.

## Read first, and only this

The report: Q2 and A2. Row R-JJD-6 (and R-JJD-2). `docs/log-inbox/jjodie-ui-s4b.md` (its «Risk for the probe lane»:
Apply pauses 20 ms between lines and short pauses can merge lines into one undo entry). The Apply path in
`frontend/src/components/editor-v2/preview/PreviewBar.tsx` and what it calls (`ScriptBlock.tsx`, the run passes).

## COSA

1. In `reducer.ts`, a minimal undo group under R-JJD-6: an explicit begin and end (two small exported functions or two
   actions; grep names first) that mark `statehistory[user].undoable.length` at begin and, at end, merge every delta
   pushed since the mark into one entry through the existing `U.objectMergeInPlace(pastDelta, delta)` path. Nested
   begin is a no-op with a counter; end without begin is a no-op; a group that pushed nothing leaves history as it is;
   the redo stack behaves as for any single entry. Batched commits (300 ms) that land after the end are flushed into
   the group before closing: Apply waits for the pending commit before calling end.
2. Apply (and only Apply) wraps the script run in the group. Run in the code block is unchanged.
3. After Apply, compare the planned effects (the S4a plan) with the real ones (count per metaclass of created
   elements) and, on a mismatch, show it in the preview bar for a few seconds and log it to the console as a warning.
4. Tests first: reducer-level tests for the group (begin/end around N deltas gives one undo entry; undo restores the
   state before begin; redo reapplies all; nesting; empty group; end without begin), then the code. Mutation bench: at
   least five mutants on the group logic, all killed. A probe: preview a three-line script, Apply, one Ctrl+Z removes
   all three created elements, Ctrl+Shift+Z (or the app's redo) brings them back.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` once. Commit
(`feat(undo): group the deltas of a script Apply into one step`).

## HARD STOP

None unless a stop condition fires: close with the docs commit (log entry with Layer Impact Report, Status) and
`Outcome: done`, with the probe result.

## NON FARE

No edit to critical-zone files, to Jjodie components, or to the executor semantics. No merge, no push.
