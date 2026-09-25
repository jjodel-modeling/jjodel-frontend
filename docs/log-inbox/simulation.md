# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---


## 2026-09-25 — feat: simulation step 3a, the Petri core, unwired (P-2026-09-25-0935)
**Prompt**: `P-2026-09-25-0935`, two-phase, on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `de21a2c93` (`docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md`); the thirteen answers ratified as recommended, R-SIM-27..33 (`e4506e78f`); Phase 2 prompt `claude_2026-09-25_0935_fase2_sim_step3a_core.md` (`f36fe1c2e`), wave 3a only: the pure core beside the old step, six new files, no modified file.
**Files touched**: code `79ee9fba3`, 6 new files under `frontend/src/model/simulation/`: `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `__tests__/netCompile.test.ts`, `__tests__/netStep.test.ts`, `__tests__/netParity.test.ts`. Docs, this commit: this entry, the Status line of the Phase 2 prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `79ee9fba3`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the Phase 1 run empty); `npx vitest run` 4623 passed (4530 + 93), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4; `check:scripts` 1 hit, the known `_tmp_sim1_verify.ts:186`. `git diff` on every existing file empty; `step.test.ts` and `events.test.ts` green unchanged. Mutation bench 36 of 36 killed, table in the commit body.
**Out-of-scope changes**: no — six files, all named by the prompt's DOVE, above the P6 five by the GO's rule 19 exception: `netTypes.ts`, `netCompile.ts`, `netStep.ts` and their three tests. No existing file modified.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — nothing imports the new core outside its tests; the panel still runs the old step.
**Notes**: Deviations from report §5.2: `StateAttributeDecl.metaclass` is `string | null` (globals, `model.[x]`); action sites are `ActionSite { element, role }`, since a plain string cannot tell exit(A) from entry(A); `CompiledNet` gains `declared` (element → attribute → declaration) for the domain check. `step.test.ts:167` is not a difference in the core (the §7 shim dropped unknown ids, the core keeps them): pinned for 3b under R-SIM-13.
**Prompt document name**: 2026-09-25 09:35
**Ticket** (for 3b, not a slot of its own). What 3b wires: a `GuardOracle` from `compileGuard` + `buildGuardContext` over a snapshot built with `targetMetamodelId` (R-SIM-33 ticket); an `ActionOracle` returning `[]` until the Action lane; the store holding `NetConfiguration`, the net and a `HaltReason` per started run; `stcFromRoles`/`ENGINE_ROLE_KEYS` made optional on Terminal together (R-SIM-28; `simRoleStatus.test.ts:48` pins their agreement); the old step, `applyStepLabel`, `simApplyStep` and their tests deleted, with `netParity.test.ts` rewritten against the new store. The Phase 1 prompt file still reads `Status: da eseguire`.

## 2026-09-25 — feat: simulation step 3b, the panel and the run-state on the Petri core (P-2026-09-25-1103)
**Prompt**: `P-2026-09-25-1103`, two-phase, on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `b9fd3a1f7` (`docs/discovery/discovery_2026-09-25_sim_step3b_panel.md`); the sixteen answers ratified as recommended with two precisions, R-SIM-34..37 (`7a93968c5`); Phase 2 prompt `claude_2026-09-25_1103_fase2_sim_step3b_panel.md` (`3a2c76b83`). Precision A: the panel's lines never depend on the mark version. Precision B: `SimModelView` untouched, no TODO marker; its slimming and the `stcFromRoles.ts` rename as tickets.
**Files touched**: code `c400a5163` (feat): `components/editor-v2/sim/SimulationPanel.tsx`, `simRunState.ts`, `simRoleStatus.ts`, `simulation-panel.scss`, `simBridge.ts` (new), `__tests__/simRoleStatus.test.ts`, `__tests__/simBridge.test.ts` (new), `__tests__/simRunState.test.ts` (new); `model/simulation/netCompile.ts`, `stcFromRoles.ts`, `__tests__/events.test.ts`, `__tests__/netParity.test.ts`. Code `11de5af03` (refactor): `model/simulation/step.ts` and `__tests__/step.test.ts` deleted; `types.ts`, `stcFromRoles.ts`, `netCompile.ts`, `__tests__/events.test.ts`, `__tests__/netParity.test.ts`, `sim/simRoleStatus.ts`. Docs, this commit: this entry, the Status line of the Phase 2 prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On each code commit: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the Phase 1 run empty); `npx vitest run` 4670 passed after `c400a5163` and 4617 after `11de5af03`, each total stated before the run, the same 9 files red at import; `npm run build` exit 0, the same 5 warnings; `check:docs` 4/4; `check:scripts` 1 hit, the known `_tmp_sim1_verify.ts:186`. The not-touched files of report §11.1 byte-identical to `3a2c76b83`. Mutation bench 38/38 and 10/10 killed, tables in the commit bodies.
**Out-of-scope changes**: no — 15 files, the list of report §11.1 authorized by the GO (rule 19): 10 modified, 2 deleted, 3 new, all named above; the exported interfaces changed are those of report §11.2. Nothing else.
**Layer Impact Report**: produced
**Smoke visivo**: passato — Alfonso, 2026-09-25 on 3002, items 1-6 of report §11.5, light and dark. P8 smoke (item 7) GREEN, 12 passed and 3 skipped, from a scratchpad copy of `scripts/smoke` pointed at 3002 (`states.ts` hardcodes 3000), so its RUN VALIDITY block watched 0 files.
**Notes**: Deviations: the sort/refusal change of stcFromRoles.ts and its 3 tests in events.test.ts went in the feat commit, not the refactor one; the panel no longer calls useSimVersion (precision A, LIR corrected before the store edit); candidate and halt labels use DObject.name before objectLabel (the probe showed short ids otherwise); the Last step line reads "Reset" after a Reset. Evidence: the Phase 1 report and the two commit bodies.
**Prompt document name**: 2026-09-25 11:03
**Ticket** (precision B, R-SIM-37 ticket; opened, not implemented here). `SimModelView` (`model/simulation/types.ts`) keeps `outgoingTransitions`, `transitionTarget` and `transitionTriggers`, read only by the deleted boolean step; every `NetModelView` adapter stubs the first two (`sim/simBridge.ts` `makeNetModelView`, and the test views of `netCompile.test.ts`, `netStep.test.ts`, `events.test.ts`, `netParity.test.ts`). Slimming it is a lane of its own: a changed exported interface (rule 11) and those test files.
**Ticket** (precision B, R-SIM-37 ticket; opened, not implemented here). `model/simulation/stcFromRoles.ts` now holds only the overlap rules (`roleOverlaps`, `overlapVerdict`, `roleWriteVerdict`, `RoleOverlap`); the name no longer says what it holds. Rename in a lane of its own (rule 2 forbade it here); importers: `sim/SimulationPanel.tsx`, `__tests__/events.test.ts`.
**Ticket** (opened, not fixed here). Comments in files this lane had to leave byte-identical now describe the old state: `netStep.ts:22` and `netTypes.ts:5` ("not wired yet", `step.ts`), `netTypes.ts:72` (`stcFromRoles`), `isKindOf.ts:17` (the `classAncestry` parity lives in `events.test.ts` now, not `step.test.ts`), `guardEvaluator.ts:21` ("The step does not call this module yet"). A comment-only lane.
**Ticket** (opened, not fixed here). The gitignored step 1 probes assume the old store and statuses and will break or lie if rerun: `scripts/smoke/_tmp_sim0_verify.ts` (`simReset` with an array of ids), `_tmp_sim1_e2e.ts` and `_tmp_sim1005_e2e.ts` (old enablement and status rules), the first imported by Alfonso's `_tmp_sim1_verify.ts`, left untouched. The 3b probes live in this session's scratchpad. The Phase 1 prompt file `claude_2026-09-25_1103_prompt_sim_step3b_discovery.md` still reads `Status: da eseguire`.
