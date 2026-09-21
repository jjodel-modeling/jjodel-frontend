# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---

## 2026-09-14 — feat(sim slice 0, commit 3): one notion of «is a» for the simulation roles (R-SIM-8)
**Prompt**: `claude_2026-09-14_0140_prompt_sim_slice0_foundations.md`, commit 3 of 3 — ancestry-aware
matching for `simInitial`/`simTerminal` in the adapter's `isInstanceOf`, test on a subclass.
**Files touched**: code in `c09cf4353` — `frontend/src/model/simulation/isKindOf.ts` (new),
`frontend/src/model/simulation/__tests__/step.test.ts` (+6 tests), `frontend/src/components/editor-v2/
sim/SimulationPanel.tsx` (import + one line of the adapter). Docs: this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` 14, same set; `npx vitest run` 3416 passed (3410 + 6), the
same 9 files red at import; `src/model/simulation` 27/27. Mutation bench 3/3 red (exact id only,
direct parents only, missing class not matched). Probe `after` on the exact-id fixture: 17 PASS, trace
identical to the pre-slice run.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — no critical-zone file modified. The test imports
`classAncestry` from `editor-v2/viewpoint/ir/irReadCtx.ts`: exported, and the module has zero imports
(no React, no store). Test-only, for the parity check with the IR walk.
**Smoke visivo**: passato. Probe `after3`: J, instance of `SInitSub extends SInit`, no outgoing
transition. Reset {I,J} Deadlock; Step {A,J}; {B,C,J}; {C,F,J} Terminated; Stop {}. DOM and store
agree, 0 page errors. Under exact-id matching Reset would give {I} Running, so the expectation itself
discriminates. A first `after` run timed out on `page.goto` with two probes on a cold server (g); re-run
alone, green.
**Notes**: No pure helper outside `viewpoint/ir/` (ConformanceValidator on L types, singletonShape
direct `extends` only, metamodelConverter on L chains). `classAncestry` qualified but was not imported:
the core does not import `components/`, and an adapter-only import would leave the match untested
(the panel does not load under node). Walk duplicated, parity-tested. One difference: an exact id still
matches a deleted DClass, as before.
**Prompt document name**: 2026-09-14 01:40

## 2026-09-14 — feat(sim slice 0, commit 2): the panel delegates to the core, run-state per model
**Prompt**: `claude_2026-09-14_0140_prompt_sim_slice0_foundations.md`, commit 2 of 3 — Reset, Step and
status through `model/simulation/`; `Map<modelId, SimConfiguration>` (R-SIM-13).
**Files touched**: code in `c70c9f7b5` — `frontend/src/components/editor-v2/sim/simRunState.ts`,
`frontend/src/components/editor-v2/sim/SimulationPanel.tsx`. Docs: this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` 14, same set as the baseline; `npx vitest run` 3410 passed
(3389 + 21), 9 files red at import for `window`, the same set as before the slice. `isSimActive` keeps
its boolean contract (union over models), so `ObjectNode.tsx` and `irReadCtxLproxy.ts` are untouched.
`simApplyStep` bumps exactly when the in-place version did.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — no critical-zone file touched.
**Smoke visivo**: passato. Dev server started from the worktree on 3002 (3000 serves the main tree),
own `cacheDir`; gitignored probe `scripts/smoke/_tmp_sim0_verify.ts`. The prompt's «flowchart example
of the 2026-08-17 memo» does not exist (0 hits in the memo; that M1 run stayed open), so the probe
builds one on RowViewSmoke: I→A, A→B|C, B→F, C stuck. Same trace before and after, DOM and store:
Reset {I} Running; Step {A} Running; {B,C} Deadlock; {C,F} Terminated, Step disabled; Stop {} Not
started. R-SIM-13 per contrasto: Stop empties its own model (2→0), leaves a marking injected on another
model, and `isSimActive` still paints it until that one is cleared. 0 page errors.
**Notes**: Two after-runs failed on the probe, not the app: after HMR the app loads `simRunState.ts?t=…`
and a bare `import()` got a second, empty instance. Restarted the server; green. Status now reads its
own model (`getSimActiveIds(modelid)`); with one editor it is the same set.
**Prompt document name**: 2026-09-14 01:40

## 2026-09-14 — feat(sim slice 0, commit 1): pure simulation core, committed step locked by tests
**Prompt**: `claude_2026-09-14_0140_prompt_sim_slice0_foundations.md`, commit 1 of 3 — `model/simulation/`
with types, `stcFromRoles`, the step moved out of the panel unchanged, tests on the quirks.
**Files touched**: code in `2f53c876a`, all new — `frontend/src/model/simulation/{types.ts,
stcFromRoles.ts,step.ts,__tests__/step.test.ts}`. Docs: this entry. Worktree `../jjodel-sim`, branch
`simulation-engine` from `alfonso-frontend-jjtl` `2241dd056`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no existing file changed. `npx tsc --noEmit` 14 errors, the same set as before
(diffed line by line), 0 in `model/simulation`; control `--listFilesOnly` lists the 4 new files.
`npx vitest run src/model/simulation` 21/21. Mutation bench 7/7 red (activation order, terminal
freeze, stuck skip, dangling deactivation, target existence, Deadlock `some`, `nextState` required).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — no critical-zone file touched.
**Smoke visivo**: non applicabile — no UI change in this commit.
**Notes**: Baseline in a fresh worktree is 14, not 33: the 19 casing errors do not exist on a clean
checkout. Prompt facts: `../jjodel-release` is not marked prunable in `git worktree list`; left
alone. Addition: `applyStepLabel`, the one place of the activation-wins rule, for the store to reuse.
Role names in `StcRoles` are the prompt's (`initial`…); the bag keys stay `sim*`.
**Prompt document name**: 2026-09-14 01:40
