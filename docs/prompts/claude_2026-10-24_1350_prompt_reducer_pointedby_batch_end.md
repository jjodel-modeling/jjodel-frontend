# Reducer: resolve pending pointedBy writes in the same batch, and the duplicated vertexs entry

Prompt-ID: P-2026-10-24-1350
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (core change authorised by R-JJD-12)
Depends: P-2026-10-24-0657
Status: da eseguire
Corregge: 2026-10-24 02:56
Request: Alfonso, 2026-10-24 13:47, in the project chat («si hai il mio si esplicito, fixa anche il ticket .. procedi con /lane auto»)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_undo_after_apply.md`). CLAUDE.md rule 5 (no core change without
approval) is satisfied for `frontend/src/redux/reducer/reducer.ts` and the D-layer by R-JJD-12, ratified by Alfonso at
13:47. The critical-zone files of CLAUDE.md §3.2 (`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`,
`portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`, `defaultViewTemplate.ts`) stay not authorised: if
either fix needs one, stop with `Outcome: question`.

Worktree: `~/jjodel-w-jjp-pba`, branch `jjp-pba`, cut from `jjodie-panel` at `d5f86306e` plus the commit that adds this
prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules`
symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-1350 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 80 minutes. No subagents, no background tasks. Commit as soon as the
gates are green. One probe run per tool call. Context discipline: never `cat` a whole large file or log; `reducer.ts`
only by grep-found ranges (the report cites `reducer.ts:471-472`, `:547`, `:556-557`); test, build and probe output
through `tail` or `grep`. If the context passes about 150k, commit what is green, write a handoff and stop. Dev server
only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Subject lines
without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-pba.md`, with
the Layer Impact Report field filled. Nothing merges anywhere: the chat merges.

## Read first, and only this

`docs/discovery/discovery_2026-10-24_undo_after_apply.md` in full (option A, its tests and its LIR sketch, finding F8).
Rows R-JJD-6 and R-JJD-12 in `docs/decisions.md`. `docs/log-inbox/jjodie-ui-udo.md`. The probe
`frontend/scripts/probe/jjodie-udo-after-apply.ts`.

## COSA

1. Option A of the report: at the end of `CompositeActionReducer`, after the action loop and before
   `updateRedundancies_OBSOLETE`, drain `PendingPointedByPaths` again (`getSolveableActions2(newState, oldState)`), so a
   pointer to an element created later in the same batch is resolved in that batch's delta. Tests first, in
   `frontend/src/redux/reducer/__tests__/`, as the report lists: one batch with `graph.subElements += V` and
   `CreateElementAction(V)` leaves `V.pointedBy` with the `subElements` path and the queue empty; the previous state
   keeps its identity (`reducerCopyOnWrite.test.ts` style); the next unrelated action yields no `idlookup` in its delta.
   Mutation bench on the new call: at least four mutants, all killed.
2. Ticket F8: every new DVertex carries `vertexs` twice in `pointedBy`. Trace it (candidate `reducer.ts:471-472`, an
   in-place push into `action.value`); if the cause is in `reducer.ts` or the D-layer and outside the critical zone, fix
   it with a test that fails before the fix (exactly one `vertexs` entry after a creation, and after undo and redo). If
   it lies in a critical-zone file, write the cause with file:line in the log as a ticket and do not fix it.
3. Re-run `jjodie-udo-after-apply.ts` (after Apply and a canvas click the undo stack has no extra entry; one Cmd+Z
   undoes the Apply; a hand-made creation followed by a click adds no extra entry), `jjodie-s4c-apply-undo.ts`, and the
   report's smoke list: create a class on M2 and an object on M1, one Cmd+Z each; import Families.ecore, 8 edges; save,
   reopen, identical state.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (a timeout on the
first load of a fresh server is the known machine issue: re-run once on the same server). Commits
(`fix(reducer): resolve pending pointedBy writes within the batch`, `fix(reducer): ...` for F8).

## HARD STOP

None unless a stop condition fires: close with the docs commit (log entry with LIR, Status) and `Outcome: done`, with
the probe and smoke results.

## NON FARE

No critical-zone file, no Jjodie or canvas component, no persistence change. No merge, no push.
