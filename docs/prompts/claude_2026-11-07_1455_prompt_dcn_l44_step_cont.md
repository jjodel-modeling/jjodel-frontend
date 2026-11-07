# DCN L4.4 continuation: dcnStep.ts and its tests from the handoff

Prompt-ID: P-2026-11-07-1455
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (continuation of P-2026-11-07-1432, stopped at the context ceiling)
Corregge: 2026-11-07 14:32 (stopped at the soft context ceiling with five files edited and uncommitted, RC-51)
Worktree: ~/jjodel-w-dcn-l44, branch dcn-l44, at the commit that adds this prompt on top of ffe501487
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the uncommitted changes are exactly the edits of the previous session to `netTypes.ts`, `simBridge.ts`, `subsetChecker.ts`, `guardEvaluator.ts` and `boardOutputs.ts` (plus the gitignored node_modules symlink); otherwise stop with Outcome: blocked. Do not discard that work: continue it. No subagents, no background tasks. Every reply opens with [P-2026-11-07-1455 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log; grep only failing test names. Commit the code as soon as the targeted suites are green, before the full run.

## Contesto (non rifare l'analisi)

Read only ~/.jjodel-lanes/P-2026-11-07-1432/handoff.md (design, test list, Interleave after SoSyM Definition 3, Sync, redefinitions, slot-marker check, order of the halts) and the prompt claude_2026-11-07_1432_prompt_dcn_l44_step.md, whose COSA, HARD STOP and NON FARE stand. The chat's answers stand: simBridge.ts as seventh file for two haltMessage case lines only; Interleave is one contribution per step, Sync all contributions in one parallel assignment.

## COSA

The handoff's steps 1 to 4: the test file first, then `model/simulation/dcn/dcnStep.ts` with the Definition 3 comment and the either-order ticks test; targeted suites and mutation bench; one code commit with the seventh-file deroga in the body; typecheck, full vitest at its baseline, build, check:docs; the log entry appended to `docs/log-inbox/dcn.md` with the `generalizationClosure` ticket, the deroga and the stale comment in `actionEvaluator.ts`; the Status flips of both prompts in one docs commit; symlink removed. No visual check is owed.

## NON FARE

No edit to `netStep.ts`, `netCompile.ts`, `simRunState.ts`; no wiring into `startRun`; no push, no merge. Public repo: name no partner company.
