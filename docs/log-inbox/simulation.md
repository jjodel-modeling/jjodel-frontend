# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---

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

## 2026-09-26 — feat: guards read state, pure action evaluator, wave B2 (P-2026-09-26-1105)
**Prompt**: `claude_2026-09-26_1105_fase2_state_operator_b2.md`, wave B2 of the `.[x]` operator (report §7.3) on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-17, R-SIM-18, R-SIM-30, R-SIM-39..43. Guards read σ through an adapter of `SimStateAccess` (`marked`, `tokens`), parsed strictly; a pure action evaluator, tested end to end on the core with `decls`, not wired (`NO_SIM_ACTIONS` until lane C).
**Files touched**: code `81373fab0`: `frontend/src/model/simulation/guardContext.ts`, `guardEvaluator.ts`, `actionEvaluator.ts` (new), `components/editor-v2/sim/simBridge.ts`; tests `model/simulation/__tests__/guardContext.test.ts`, `guardEvaluator.test.ts`, `actionEvaluator.test.ts` (new), `sim/__tests__/simBridge.test.ts`. Docs, this commit: this entry, the ticket below, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `81373fab0`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4818 passed (4772 + 46, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: 16 tests and one file at collection before the code. Mutation bench 12/12 killed.
**Out-of-scope changes**: no — 8 files, above the Rule 19 five, every one in the prompt's DOVE list, which authorized them; `git diff --stat` of every other path empty.
**Layer Impact Report**: produced
**Smoke visivo**: passato — Alfonso, 2026-09-26 on 3002, steps 1-6: b2net Deadlock after two steps with p1 still marked; `p2.[marked]` fires only with p2.tokens = 1; `node.[x]` and `p2.[visits]` end in Deadlock, outcome read from the console snippet; flow unchanged to Terminated.
**Notes**: Prompt error, not a lane deviation: step 7 expected the guard outcome in the label or candidate line and the inputs enabled in Deadlock; the panel never shows `evaluated` and R-SIM-29 turns every input off, so items 2 and 4 were confirmed via the console snippet. Interpretation under test: `marked`/`tokens` only on places of the net. §8 B2 draft holds, plus the strict parse. Console error `failed to get project {project: null}` at load, not investigated. One closure commit (RC-17).
**Prompt document name**: 2026-09-26 11:05

## 2026-09-26 — ticket: the panel shows no guard outcome, false and defect alike
**Ticket**: The Simulation panel never renders `NetLabel.evaluated` nor a guard's defect detail: no UI reads them (`lastStepText` in `simBridge.ts` prints fired, halted, discard, quiescence, inadmissible; `defectsLine` covers net compile defects only). A guard that is `false`, one that does not parse, `node.[x] > 0` (E-NODE) and `p.[visits] > 0` (undeclared) all show the same `Deadlock` with the buttons off (R-SIM-29). Show the evaluated guards of the last step, or at least the guard defects after Reset. To be scheduled before lane C: actions multiply the run-time defects the panel cannot show.
**Priority**: medium
**Found in**: P-2026-09-26-1105
