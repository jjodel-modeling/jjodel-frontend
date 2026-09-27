# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---

## 2026-09-27 — feat: declared state attributes and action keys, lane C1 (P-2026-09-26-2340)
**Prompt**: `claude_2026-09-26_2340_fase2_sim_state_declarations_c1.md`, Phase 2 of lane C1 on `simulation-engine` in `~/jjodel-sim`, full lane, bound by R-SIM-67..72 (`320d4afcf`); Phase 1 report `06d911dd9`. Declarations in `simStateAttributes` (codec, per-record defects), the three action keys in `NetStc` and the step through a table built at Reset, declaration and action defects at Reset with the transition still a candidate, the Data group of the panel with the declarations table.
**Files touched**: code `3ec3405d5`: `frontend/src/model/simulation/stateAttributesCodec.ts` (new), `roleCatalog.ts`, `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `actionEvaluator.ts`, `simProfiles.ts`, `components/editor-v2/sim/simBridge.ts`, tests `stateAttributesCodec.test.ts` (new), `netCompile.test.ts`, `netStep.test.ts`, `actionEvaluator.test.ts`, `roleCatalog.test.ts`, `simProfiles.test.ts`, `sim/__tests__/simBridge.test.ts`; code `f507d166d`: `simRoleStatus.ts`, `SimulationPanel.tsx`, `simulation-panel.scss`; code `b62141aba`: `simulation-panel.scss`. Docs, this commit: this entry, the Status of the two prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `b62141aba`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4926 passed (4884 + 42, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: 30 tests and the codec file at collection. Mutation bench 12/12 killed.
**Out-of-scope changes**: yes — 18 code paths, above the Rule 19 five, listed before the first edit. Outside DOVE: `roleCatalog.test.ts` (the assertions that pinned the unwired keys, R-SIM-52, declared) and `simProfiles.ts` with `simProfiles.test.ts` (Flowchart / Activity row + `stateAttributes`, ratified at the question stop as an R-SIM-68 amendment of the R-SIM-54 table); `b62141aba` is a third code commit.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 6/6 + Alfonso
**Notes**: Baseline vitest 4884, not 4837: the trunk merge 17a3d308c added tests. Question stop: R-SIM-68 made Flowchart / Activity fail validateProfile; answer A ratified. b62141aba fixes the table's 36px text cells (global input rule), found in the session's run. Step 3 needs the entry blank and the second action blanked: a shorter array does not truncate the slot. set_state to undefined via the panel select removed the key: no ticket. Halt lines drop the action text for action-defect too.
**Prompt document name**: 2026-09-26 23:40
**Ticket** (priority low, opened here). The console error `failed to get project {project: null}` at load is still there, one per run on 3002 (noted by the B2 entry and report §7.5). Not investigated.
**Ticket** (priority medium, opened here). The checker gap of report risk 5 stays open: `node.[x]` in a guard is reported only at Reset (`compileDefects`), never in the problems registry, and actions get no contextual check there either.
**Ticket** (priority low, found by the chat's run of the checklist). Keyboard select-all inside the declarations table appends instead of replacing the text of the cell. Not reproduced by the session.

## 2026-09-27 — feat: derived state attributes, eager DEFINE, lane C2 (P-2026-09-27-0200)
**Prompt**: `claude_2026-09-27_0200_fase2_sim_derived_attributes.md`, Phase 2 of lane C2 on `sim-derived` in `~/jjodel-icons`, full lane, bound by R-SIM-73..76 (`0a8ad4270`); Phase 1 report `655706bab`. Derived attributes as `equation` records, evaluated eagerly into `SimState.derived` at Reset and after every fired step by an optional `DerivedOracle`; the declarations table offers «stored | derived».
**Files touched**: code `5060657c5`: `frontend/src/model/simulation/stateAttributesCodec.ts`, `netTypes.ts`, `derivedEvaluator.ts` (new), `netCompile.ts`, `netStep.ts`, `components/editor-v2/sim/simBridge.ts`, `simRunState.ts`, tests `stateAttributesCodec.test.ts`, `netCompile.test.ts`, `netStep.test.ts`, `derivedEvaluator.test.ts` (new), `actionEvaluator.test.ts`, `sim/__tests__/simBridge.test.ts`; code `53c24b1fc`: `SimulationPanel.tsx`, `simulation-panel.scss`. Docs, this commit: this entry, the Status of the two prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `53c24b1fc`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4971 passed (4931 + 40, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: 24 tests and the evaluator file at collection. Mutation bench 11/11 killed.
**Out-of-scope changes**: yes — 15 code paths, above the Rule 19 five, listed before the first edit. Outside DOVE: `actionEvaluator.test.ts`, one line of `handNet` skipping a declaration with no initial, ratified at the question stop (RC-21).
**Layer Impact Report**: not-required
**Smoke visivo**: passato 2026-09-27 (chat, unattended: probe re-run on 3005, 5/5; Alfonso in the morning digest)
**Notes**: Probe (4): `cnet.[total] := 5` does not resolve (a model name is no JjEL root): no defect at Reset, then an action-defect halt; `model.[total] := 5` gives read-only. Out of domain at Reset keeps the value (report decision 5, where R-SIM-73 reads «valore assente»). A presentation failure after a step leaves the value out and is shown nowhere. Rows of three lines, 88px, stored and derived alike (R-SIM-76, RC-26 digest).
**Prompt document name**: 2026-09-27 02:00
**Ticket** (priority low, opened here, R-SIM-74). The dependency graph is by name, so a well-founded recursion on containment (`total := own + sum(children.[total])`) is a self-loop and a cycle defect; nuXmv would accept it. Refinement by (metaclass, name) or by element deferred.
**Ticket** (priority medium, opened here, R-SIM-76). `simStateOutput` and `simTransitionOutput` still have no reader: the outputs lane after C2.
**Ticket** (priority low, opened here, report risk 5). A derived attribute that failed at Reset is absent, and a reader says «'total' is not a state attribute of cnet»: true of the value, misleading about the declaration. Not done in this lane.
**Ticket** (priority low, seen in this lane's dark screenshots). Every select of the declarations table shows a doubled chevron with `data-theme="dark"`, the C1 selects as the new one. Not investigated.
**Ticket** (priority medium, ruled at the GO). R-SIM-73 wording (value absent at Reset on out-of-domain) differs from the implementation (value kept, defect shown): align the row text; RC-26 for Alfonso.
**Ticket** (priority low, ruled at the GO). A failed presentation equation is not surfaced; consider a line in «Last step» title.
