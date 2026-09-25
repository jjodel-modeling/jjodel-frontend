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
