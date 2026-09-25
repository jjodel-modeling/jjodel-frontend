# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---

## 2026-09-25 — feat: .[x] state access and strict parse, wave B1 (P-2026-09-25-1445)
**Prompt**: `claude_2026-09-25_1445_fase2_state_operator_b1.md`, Phase 2 wave B1 of `P-2026-09-25-1445` on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `ec68ddb9b` (`docs/discovery/discovery_2026-09-25_state_operator_core_types.md`); its eighteen answers ratified as recommended, R-SIM-38..45 (`86f36a205`), B1 bound by R-SIM-38..42. Pure code: grammar, AST, strict parse, evaluator hook, single reserved list, checker case; nothing wired, persisted or typed.
**Files touched**: code `1c7a9be76`: `frontend/src/jjel/types/tokens.ts`, `jjel/lexer/lexer.ts`, `jjel/types/ast.ts`, `jjel/parser/parser.ts`, `jjel/parser/index.ts`, `jjel/evaluator/context.ts`, `jjel/evaluator/evaluator.ts`, `jjel/stateReserved.ts` (new), `jjel/autocomplete/providers/identifier.ts`, `jjel/SPEC.md`, `model/simulation/subsetChecker.ts`, tests `jjel/__tests__/parser.test.ts`, `jjel/__tests__/evaluator.test.ts`, `model/simulation/__tests__/subsetChecker.test.ts`. Docs, this commit: this entry, the Status lines of the two `P-2026-09-25-1445` prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `1c7a9be76`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the baseline empty); `npx vitest run` 4654 passed (4620 + 34, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` 1 finding, the known `_tmp_sim1_verify.ts:186`. Red first: 2 test files failing at collection and 11 evaluator tests before the code. Mutation bench 15/15 killed.
**Out-of-scope changes**: no — 14 files, above the Rule 19 five, every one named by the prompt's DOVE list, which authorized them; no file outside it changed.
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Deviations: the reserved list was written before the parser, which reads it; one closure commit carries this entry and both Status flips, as the prompt and P13 ask, not the inbox alone as the log-entry skill says. The B1 draft of report §8 holds, one correction: `.[x]` parses everywhere and throws only at evaluation without the hook; `?.[` and `:=` stay lexer errors with new messages. Mutant table in the body of `1c7a9be76`.
**Prompt document name**: 2026-09-25 14:45
**Ticket** (R-SIM-45 tickets, in `docs/decisions.md`; cited, not duplicated): the global trailing-token fix of `parseExpression`; `Pointer_EOBJECT` missing from older saved projects.
**Ticket** (opened here, docs only). The trunk has its own R-SIM-38 (`79175e94c`, the event class derived from the trigger, chat `C-2026-09-25-1500`), while this branch carries R-SIM-38..45 (`86f36a205`): merging `simulation-engine` into the trunk would put two R-SIM-38 in `docs/decisions.md`. One series needs renumbering before that merge.

## 2026-09-25 — feat: the event class derived from the Trigger reference (P-2026-09-25-1500)
**Prompt**: `claude_2026-09-25_1500_prompt_sim_event_from_trigger.md`, single phase, fast lane, on `sim-event-trigger` in `~/jjodel-events` (worktree made by the project chat at `79175e94c`). R-SIM-38: Trigger alone configures the event role; `simEvent` is derived at every read of the bag and never written. One mid-lane stop (the netParity fixture, authorised), the hard stop of step 7, then a GO with two items: the cleanup marker dropped, the Vite scan error classified as pre-existing (a ticket).
**Files touched**: report `623b330d4`: `docs/discovery/discovery_2026-09-25_sim_event_from_trigger.md` (new). Code `332f8d03c`: `frontend/src/model/simulation/netCompile.ts`, `components/editor-v2/sim/simBridge.ts`, `SimulationPanel.tsx`, `simRoleStatus.ts`; tests `model/simulation/__tests__/netCompile.test.ts`, `netParity.test.ts`, `sim/__tests__/simBridge.test.ts`, `simRoleStatus.test.ts`. Code `470149a51`: `simRoleStatus.ts` (the marker dropped). Docs, this commit: this entry, three tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `332f8d03c`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the trunk run empty); `npx vitest run` 4624 passed (4620 − 5 + 2 + 5 + 2, stated before the run), the same 9 files red at import; `npm run build` exit 0, pre-existing warnings only; `check:docs` 4/4. Mutation bench 10/10 killed (commit body). On `470149a51`: typecheck 14, the same set; the 43 sim tests pass.
**Out-of-scope changes**: yes — `frontend/src/model/simulation/__tests__/netParity.test.ts`, not in DOVE: one fixture line (the typed `R_trigger` DReference), no assertion changed, authorised in chat at the stop (RC-11). Nine files over the lane, above the Rule 19 threshold: the eight of DOVE (four code, three tests, the report) plus that one.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso on 3004, items (a)-(d) of step 7, plus a Trigger typed to a node/arc class refused as an overlap.
**Notes**: Decisions: withDerivedEventRole in netCompile.ts; simEvent kept in ROLE_SPECS (mapStateToProps copies ROLE_KEYS) and hidden via ROLE_GROUPS; a primitive-typed Trigger (EString is a DClass with isPrimitive) gives no event role; the class name reaches the row as a primitive prop. Mid-lane stop: (c), netParity.test.ts drives startRun and was missed at step 2. The panel does not load under the bench: its edits are covered by the visual check only. Detail: report §8.
**Prompt document name**: 2026-09-25 15:00

## 2026-09-25 — ticket: the Trigger select offers every reference of the metamodel
**Ticket**: The Trigger select of the Events group lists every plain reference of the metamodel, not only those of the arc/transition class. Since R-SIM-38 the Trigger also fixes the event class, so a reference of an unrelated class silently changes the event alphabet (the overlap check only catches node/arc/transition types). Restrict the options to the references of the arc/transition class.
**Priority**: medium
**Found in**: P-2026-09-25-1500

## 2026-09-25 — ticket: eventRoleWarning and roleWriteVerdict are dead since R-SIM-38
**Ticket**: Since `P-2026-09-25-1500`, `eventRoleWarning` (`components/editor-v2/sim/simRoleStatus.ts`) has no caller, and `roleWriteVerdict` (`model/simulation/stcFromRoles.ts`) is called by tests only: `writeRole` derives the event class after the write and calls `overlapVerdict`. Remove both, with their tests, in the SimModelView cleanup lane (the R-SIM-37 ticket).
**Priority**: low
**Found in**: P-2026-09-25-1500

## 2026-09-25 — ticket: the Vite dependency scan fails on every cold start
**Ticket**: Vite dependency scan fails on every cold start: esbuild rejects MTM.tsx:27 importing Nearley from DSL/nearley/nearley.tsx:34 (suggests _Nearley); pre-bundling is skipped, all deps are discovered at runtime and the page reloads once. Pre-existing since 0787639fd, silent on 3001, printed on a fresh worktree. Medium because worktree lanes cold-start by design.
**Priority**: medium
**Found in**: P-2026-09-25-1500

## 2026-09-25 — feat: the Expression and Action primitive types, wave A (P-2026-09-25-1445)
**Prompt**: `claude_2026-09-25_1445_fase2_state_operator_a.md`, wave A of `P-2026-09-25-1445` on `simulation-engine`, bound by R-SIM-44, R-SIM-45, R-SIM-46 (series renumbered in `8f97d4f6f`). Layer Impact Report posted before `VersionFixer.tsx`; OK with one condition, the seed as the oracle of the migrated records, plus CHECK 3 keyed on ids and an EDouble-field mutant.
**Files touched**: A1 `b14294906`: `frontend/src/common/U.tsx`, `common/Defaults.ts`, `redux/VersionFixer.tsx`, `model/logicWrapper/LModelElement.tsx`, `common/Dummy.ts`, `model/conformance/ConformanceValidator.ts`, `jjscript/executor/commands/create.ts`, `joiner/classes.ts`, `services/export/EcoreService.ts`, `services/export/JsonModelService.ts`; tests `redux/__tests__/versionfixer_2229_migration.test.ts` (new), `ConformanceValidator.test.ts`, `joiner/__tests__/dTypedElement.test.ts`, `services/export/__tests__/ecore-io.test.ts`. A2 `066383e24`: `EcoreService.ts`, `api/data.ts`, `components/editor-v2/types.ts`, `ecore-io.test.ts`. Docs, this commit: this entry, the Status of the wave A prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `b14294906` and `066383e24`: `npm run typecheck` exit 2, 14, the §17 set; `npx vitest run` 4686 then 4694 passed (4654 + 32 + 8, each stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Mutation bench 15/15 (A1) and 7/7 (A2), tables in the commit bodies.
**Out-of-scope changes**: no — 14 files in A1 and 4 in A2, above the Rule 19 five, every one in the prompt's list, which authorized them. The JjScript alias test sits in `dTypedElement.test.ts`: `create.ts` does not load under vitest, even with a stub joiner.
**Layer Impact Report**: produced
**Smoke visivo**: passato — Alfonso, 2026-09-25 on 3002, items 1-5: both type selects, CHECK 3 on `a +`, `self.x > 0` and `else`, an old project, the .ecore round trip, the smoke.
**Notes**: Deviation: A1's non-VersionFixer code preceded its tests; with those nine files at HEAD, 13 new tests failed. The step writes the seeded record (captured on 3002), not an EDouble copy (6 fields differed on the 7 examples). CHECK 3 moved from type names to ids after the OK. Held only by this visual check, because their files do not load under vitest (window): get_values and the set_type aliases (LModelElement.tsx), Dummy.ts, the data.ts import.
**Prompt document name**: 2026-09-25 14:45
## 2026-09-25 — feat: role catalog and simulation profiles (P-2026-09-25-1805)
**Prompt**: `claude_2026-09-25_1805_prompt_sim_role_catalog_profiles.md`, full lane (more than 3 files) on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-47..55 and R-SIM-38 read from the trunk (`b5e977907`). A pure module, only new files under `frontend/src/model/simulation/`: role catalog, eight system profiles, required set and checkability, `simProfile` codec and the «Custom» profile. Nothing wired or persisted.
**Files touched**: code `0834329e4`: `frontend/src/model/simulation/roleCatalog.ts`, `simProfiles.ts`, `profileCodec.ts` (new), tests `__tests__/roleCatalog.test.ts`, `__tests__/simProfiles.test.ts`, `__tests__/profileCodec.test.ts` (new). Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `0834329e4`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the baseline empty); `npx vitest run` 4758 passed (4694 + 64, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: the 3 test files failed at collection. Name check empty (exit 1), positive control 5 lines.
**Out-of-scope changes**: no — 6 files, above the Rule 19 five, all new and all named by the prompt's DOVE list; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Hard stop answered by Alfonso: the prompt table wins over the memo on singleToken (six profiles) and eventIdentifier (edit wherever trigger is). Interpretations, under test: active = not off; the either-item is met by one side; an off role never binds; Custom follows its shape's system profile (event from trigger, Petri initial off, unread keys in ignoredKeys). One closure commit with Status, per RC-17, not the inbox alone. Mutation bench 32/32, in `0834329e4`.
**Prompt document name**: 2026-09-25 18:05
**Ticket** (for the wiring lane, docs only). Today `netStcFromRoles` runs a control-flow bag with `simInitialMarking` and no `simInitial`, and reads `simBound` in control flow. R-SIM-48 and R-SIM-54 require Initial and derive k = 1 there, so `inferCustomProfile` of such a bag lists both keys as ignored and reports Initial missing. The lane that wires the profiles decides whether such bags become not checkable.

## 2026-09-25 — fix: profile closure separates shape and genre (P-2026-09-25-1840)
**Prompt**: `claude_2026-09-25_1840_prompt_sim_profiles_genre_fix.md`, fast lane on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-56 (`fcc012cc8`) with R-SIM-28, R-SIM-48, R-SIM-54, R-SIM-55. Fixes the pure profiles module of `P-2026-09-25-1805`: the control-flow closure takes Initial or Initial marking, Initial marking is derived from Initial in the system profiles, a derived role with a source binds only when its source does, and Custom reads `simBound` and `simInitialMarking` in control flow. Nothing wired.
**Files touched**: code `a27e46e8d`: `frontend/src/model/simulation/simProfiles.ts`, `profileCodec.ts`, tests `__tests__/simProfiles.test.ts`, `__tests__/profileCodec.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 18:05 (`claude_2026-09-25_1805_prompt_sim_role_catalog_profiles.md`: its closure followed R-SIM-48, amended by R-SIM-56)
**Causa**: (a)
**Regressions**: no. On `a27e46e8d`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4772 passed (4767 + 5, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline. Red first: 19 tests in the two files before the code. Mutation bench 14/14 killed, table in `a27e46e8d`.
**Out-of-scope changes**: no — the four files of DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Closes the Ticket paragraph of `a14c7dfa8` (the P-2026-09-25-1805 entry above): a control-flow bag with `simInitialMarking` and no `simInitial` is complete for its Custom profile, and `simBound` gives k. Interpretations, under test: a derived role without `from` still binds; a cycle of sources binds nothing and does not throw. One closure commit with the Status, per RC-17, not the inbox alone as the log-entry skill says.
**Prompt document name**: 2026-09-25 18:40
**Ticket** (for the wiring lane, docs only). `validateProfile` accepts a derived role whose `from` is off: a user profile with Initial off and Initial marking derived from Initial validates, since the derived side meets the either-item, yet it can never be checkable. The catalog does not list Initial among the dependencies of Initial marking, so `dependencyOff` does not catch it. Candidate fix in `simProfiles.ts`: a derived `from` that is off is a defect.
