# DCN L4.5c continuation: the panel gate and the DCN inputs row, gates and closure

Prompt-ID: P-2026-11-08-0315
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-08 · lane full · b4bb4c04c
Lane: full (continuation of P-2026-11-08-0303, stopped at the context ceiling with items (0)-(2) committed; `editor-v2/sim/`)
Corregge: 2026-11-08 03:11 (P-2026-11-08-0303 stopped at the soft ceiling before item (3))
Worktree: ~/jjodel-w-dcn-l45, branch dcn-l45, at the commit that adds this prompt on top of b7bffda4c
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean except the gitignored `frontend/node_modules` symlink; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1/§3.2 critical-zone file. No subagents, no background tasks. Every reply opens with [P-2026-11-08-0315 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: read only ~/.jjodel-lanes/P-2026-11-08-0303/handoff.md and the exact line ranges you edit; never read whole `SimulationPanel.tsx` or `simBridge.ts`: grep for the symbol, then read about 60 lines around it; do not read handoff.diff. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log; grep only failing test names. Commit as soon as an item is green.

## Contesto (non rifare l'analisi)

Items (0)-(2) of P-2026-11-08-0303 are committed (bdd94bfc7, 70c5174c8, b7bffda4c), 25/25 mutants killed, typecheck 0. Their decisions stand. The chat's answers to the two open points of 0303: **heading**: the panel picks `DCN_PANEL_HEADING` for a DCN run; `simLabels.ts` is not touched. **Arguments lost in `withInputs` (`simRunState.ts:303`)**: not fixed here; record it as a ticket paragraph in the log entry (the drone visual check uses `takeOff`, which has no arguments).

## COSA

(3) `simRoleStatus.ts` and `SimulationPanel.tsx`, exactly the Q1 answer of P-2026-11-08-0303: `rolesComplete` true when either the Petri engine roles or the dcn roles are complete; a DCN inputs row (Tick plus one button per invocation of `run.alphabet`, labelled by `dcnCandidateLabel`) shown only for a DCN run, through the existing press path; `markingChips` receives `r.net`; the heading is `DCN_PANEL_HEADING` for a DCN run. Keep existing class names; grep any new class name first. Tests in the existing test file of `simRoleStatus` (or the closest existing panel test): a dcn-only bag is complete; a bag with neither is not; the Petri case is unchanged.

(4) Gates: typecheck, typecheck:scripts, full vitest (baseline: the 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on the gate change (at least 4 mutants).

(5) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill covering 0248, 0303 and this lane (Notes at most 480 characters, measured with `wc -m` on the field before committing; Corregge and Causa the dash; Layer Impact Report not-required unless the hook asks; Smoke visivo: «separate lane, chat to read the crops»; a `**Ticket** (` paragraph for the `withInputs` arguments). Status flip of the three prompts to `eseguito 2026-11-08 · lane full · <code sha>`. Remove the node_modules symlink at the end. `git add` only named files. No push, no merge. Final message: files and commits, gate table, mutants, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simRoleStatus.ts, sim/SimulationPanel.tsx, their existing test files; docs/log-inbox/dcn.md, the three prompt files of L4.5. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0303/handoff.md; docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md §6 (Q1); docs/prompts/claude_2026-11-08_0303_prompt_dcn_l45a_code.md.
