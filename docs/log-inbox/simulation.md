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
