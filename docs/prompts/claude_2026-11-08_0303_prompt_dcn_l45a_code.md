# DCN L4.5a continuation: DCN runs in startRun and the panel, code and gates

Prompt-ID: P-2026-11-08-0303
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (continuation of P-2026-11-08-0248, stopped at the context ceiling after discovery; `editor-v2/sim/` and `model/simulation/dcn/`; code and gates only, the visual check is a separate lane)
Corregge: 2026-11-08 02:55 (P-2026-11-08-0248 stopped at the soft ceiling with the discovery report written and uncommitted, no code)
Worktree: ~/jjodel-w-dcn-l45, branch dcn-l45, at the commit that adds this prompt on top of 6d98d145c
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the only uncommitted change is the untracked `docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md`, plus the gitignored `frontend/node_modules` symlink; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1/§3.2 critical-zone file (if a file below is listed there, stop with Outcome: question before editing it). No subagents, no background tasks. Every reply opens with [P-2026-11-08-0303 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: read only the handoff, the report's §5-§6 and the exact line ranges you edit; never read whole large files (`simBridge.ts`, `SimulationPanel.tsx`): grep for the symbol, then read about 60 lines around it. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log; grep only failing test names. One item per commit, commit as soon as an item is green.

## Contesto (non rifare l'analisi)

Read ~/.jjodel-lanes/P-2026-11-08-0248/handoff.md whole (its five decisions stand) and only §5 and §6 of the report. The chat's answers: **Q1 adopted as Recommended**: the panel gate accepts either role set (`rolesComplete` true when the Petri engine roles or the dcn roles are complete), a DCN inputs row (Tick plus one button per invocation, labelled by `dcnCandidateLabel`, from `run.alphabet`), `markingChips` receives `r.net`, the heading reads «Classification» for a DCN run. **Q2 as decided**: Reset does not classify σ0. This widens DOVE of P-2026-11-08-0248 to `SimulationPanel.tsx` and `simRoleStatus.ts` for exactly these changes (chat decision, unattended, 2026-11-08 03:03).

## COSA

(0) Commit the discovery report alone (`docs(dcn): L4.5 run wiring discovery (P-2026-11-08-0248)`).

(1) `frontend/src/model/simulation/dcn/dcnPanelText.ts` and `dcn/__tests__/dcnPanelText.test.ts`: the twins of decision 5, tests first from the fixture the handoff describes (dji with Mode {Ready, Flying, Charging} and Alert {Nominal, Windy}, `t_takeOff` redefined by `t_Flying_takeOff`, `t_charge(rate)`, tick `t_drain`, wau1 without viewpoints). If a hook refuses the test file, read its message and follow the rule it names; if it cannot be satisfied, stop with Outcome: question.

(2) `simBridge.ts`: decisions 1-4 (startRun Petri first then DCN, the WeakMap dispatch of the panel texts, press and playTick through `DcnNucleus.candidates`, `markingChips(state, lookup, net)`). Tests in `sim/__tests__/simBridge.test.ts`: a DCN bag starts a run whose `nucleusOf(run)` is the DCN nucleus; a Petri bag is unchanged; both bound gives Petri; an incomplete DCN binding gives no DCN run; pressing `takeOff` with the Flying redefinition active is admissible and is one step (R-DCN-22).

(3) `simRoleStatus.ts` and `SimulationPanel.tsx`: the Q1 answer above, nothing else. Keep existing class names; any new class name is grepped first.

(4) Gates: typecheck, typecheck:scripts, full vitest (baseline: the 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on dcnPanelText.ts and the startRun branch (at least 8 mutants).

(5) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill covering 0248 and this lane (Notes under 480 characters, measured before committing; Corregge and Causa the dash; Layer Impact Report not-required unless the hook asks; Smoke visivo: «separate lane, chat to read the crops»). Status flip of both prompts to `eseguito ... · code <sha>`. Remove the node_modules symlink at the end. `git add` only named files. No push, no merge. Final message: files and commits, gate table, mutants, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simBridge.ts, sim/simRoleStatus.ts, sim/SimulationPanel.tsx, sim/__tests__/simBridge.test.ts (and a SimulationPanel or simRoleStatus test file if one exists); new frontend/src/model/simulation/dcn/dcnPanelText.ts and its test; docs/discovery/ (the report), docs/log-inbox/dcn.md, the two prompt files. `problems/dcnToProblems.ts` is imported, not edited. Nothing else in model/simulation/dcn/. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0248/handoff.md; docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md §5-§6; docs/prompts/claude_2026-11-08_0248_prompt_dcn_l45_run_wiring.md (COSA (1)-(3), NON FARE); docs/decisions.md R-DCN-3, R-DCN-22, R-SIM-47.
