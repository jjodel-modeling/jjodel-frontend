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

## 2026-09-26 — feat: the panel says why an input has no candidate (P-2026-09-26-1315)
**Prompt**: `claude_2026-09-26_1315_fase2_sim_guard_outcomes.md`, Phase 2 of `P-2026-09-26-1315` on `simulation-engine` in `~/jjodel-sim`, full lane, bound by R-SIM-57..63 (`5fdd3da6a`). Phase 1 report `7abb57eaa` (`docs/discovery/discovery_2026-09-26_sim_guard_outcomes.md`). Options C1 and A plus the discard wording and the one-line clamp; `model/simulation/` untouched. Closes the B2 ticket «the panel shows no guard outcome, false and defect alike».
**Files touched**: code `fa56c14de`: `frontend/src/components/editor-v2/sim/simBridge.ts`, `SimulationPanel.tsx`, `simulation-panel.scss`, test `sim/__tests__/simBridge.test.ts`. Docs: the report `7abb57eaa`; this commit: this entry, the Status lines of the two `P-2026-09-26-1315` prompt files.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 11:03 (`claude_2026-09-25_1103_fase2_sim_step3b_panel.md`: its discard text says no transition accepted the input when a guard was false)
**Causa**: (c)
**Regressions**: no. On `fa56c14de`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4828 passed (4818 + 10, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: 10 new tests and the reworded defects line. Mutation bench 11/11 killed.
**Out-of-scope changes**: no — the four files of DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, 2026-09-26 on 3002, steps 1-6: the Deadlock reason and its list, the defects line for `a b` and `node.[x] > 0`, `p2.[visits]` named, the turnstile title and discard, a long «Last step» on one row, `flow` Terminated with no reason.
**Notes**: The prompt's ruling «no text changes the panel's height» was stronger than R-SIM-63 and is met only for wrapping (second ticket). Interpretations under test: the error class stripped in the title too; within an input «;», between inputs «·», the inputs that say why before «nothing enabled». One closure commit with the entry and both Status flips (RC-17), not the inbox alone as the log-entry skill says. Probe files gitignored and removed.
**Prompt document name**: 2026-09-26 13:15
**Ticket** (priority medium, opened here, docs only). `else` on a Petri transition is compiled as an ordinary guard expression: `netCompile.ts:228` recognises it on control-flow edges only and `compilePetri` sets `elseOf: null`, while R-SIM-25 and R-SIM-31 define it as the complement of its siblings. Probe on the pure core (not committed): p (1 token) with `tf` (p → a, guard `false`) and `te` (p → b, guard `else`): `te` has `elseOf: null`, its guard is a `parse-error` defect («1:1 Expected expression») listed in `compileDefects`, no candidate, status `Deadlock`; with the complement `te` would fire. The panel now says `ε: tf false; te defect, parse error 1:1 Expected expression`.
**Ticket** (priority medium, opened here; the chat decides the layout). A line that appears for the first time (the defects line at Reset, the halt, error and interruption lines) still moves the action buttons, measured 24.5 px at Reset (b2net with `a b`: Step 854.5 → 830), because the panel is anchored at the bottom and those lines sit below the actions row; the one-line clamp of R-SIM-63 prevents wrapping, not appearing. Candidate fix: place the variable lines above the actions row, so the panel grows upward without moving the buttons.

## 2026-09-26 — fix: else on Petri transitions, panel lines above the buttons (P-2026-09-26-1535)
**Prompt**: `claude_2026-09-26_1535_prompt_sim_petri_else_panel_lines.md`, full lane on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-64 and R-SIM-65 (`470c07ee7`), then R-SIM-66, ratified by Alfonso at the hard stop (amends R-SIM-65; block added by this commit). Closes both Ticket paragraphs of the `P-2026-09-26-1315` entry: `else` on Petri transitions, and a line that appears moving the buttons.
**Files touched**: code `b76d75cc9`: `frontend/src/model/simulation/netCompile.ts`, `model/simulation/__tests__/netCompile.test.ts`, `components/editor-v2/sim/SimulationPanel.tsx`; code `f58456c63`: `SimulationPanel.tsx`. Docs, this commit: this entry, the Status of the prompt file, R-SIM-66 in `docs/decisions.md`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-26 13:15 (`claude_2026-09-26_1315_fase2_sim_guard_outcomes.md`: its one-line clamp left the lines that appear moving the buttons)
**Causa**: (a)
**Regressions**: yes — transient: `b76d75cc9` made the interruption move Step 24.5 px down (it did not move before), measured at the hard stop and fixed by `f58456c63` (R-SIM-66). On `f58456c63`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4832 passed (4828 + 4), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Mutation bench 5/5 killed.
**Out-of-scope changes**: no — the files of DOVE; `simulation-panel.scss` needed no change; the second commit on `SimulationPanel.tsx` was asked for by the chat at the hard stop.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, 2026-09-26 on 3002, steps 1, 2, 3, 4 and 6: `pelse` fires `te`; defects and halt lines above the buttons; the interruption replaces «Last step»; Step never moves; `flow` Terminated. Step 5 (a refused Reset after a run) verified by the session only (measurement and `shots_1535r` screenshots).
**Notes**: One helper, `resolveElse`, serves both shapes, so `else-twice` is written once; the Petri message reads «two else transitions share a preset». The end-to-end cases sit in `netCompile.test.ts` with an inline oracle, not in `netStep.test.ts`. Second cause (c): the 3a compiler read R-SIM-31's `else` on control-flow edges only. The session was not fresh: the same as `P-2026-09-26-1315`. The first Reset of a run still makes the slot appear once (R-SIM-66).
**Prompt document name**: 2026-09-26 15:35
**Ticket** (priority low, opened here, not fixed). An `else` on an edge of a fused fork/join in control flow gets `elseOf: null`: `compileControlFlow` builds the fused transitions after `resolveElse` has run on the plain edges (`netCompile.ts`), so the text `else` stays a guard site and, from the Petri probe of `P-2026-09-26-1315` on the same parser, is a `parse-error` defect («1:1 Expected expression»). Read, not measured on a fused fixture.
