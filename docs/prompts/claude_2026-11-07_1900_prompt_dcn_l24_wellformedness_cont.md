# DCN L2.4 continuation: problems mapping, sync, gates and crops from the handoff

Prompt-ID: P-2026-11-07-1900
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (continuation of P-2026-11-07-1825, stopped at the context ceiling; `editor-v2/problems/`, LIR 12019b986 already committed; launched with the critical-zone go-ahead of Alfonso, 2026-11-07 18:21 «via» on L2.4)
Corregge: 2026-11-07 18:25 (stopped at the soft context ceiling with two new files and one modified, uncommitted, RC-51)
Worktree: ~/jjodel-w-dcn-l24, branch dcn-l24, at the commit that adds this prompt on top of 12019b986
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the uncommitted changes are exactly `problems/registry.ts` (modified) and `frontend/src/model/dcn/` (untracked, the module and its test), plus the gitignored node_modules symlink; otherwise stop with Outcome: blocked. Do not discard that work: continue it. No subagents, no background tasks. Every reply opens with [P-2026-11-07-1900 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; grep only failing test names. Before the browser probe check uptime: wait while the 1-minute load is above 20. If the rule-trigger hook refuses a write, read its message and follow the rule it names (it is not an error to work around); if it cannot be satisfied inside this prompt, stop with Outcome: question.

## Contesto (non rifare l'analisi)

Read only ~/.jjodel-lanes/P-2026-11-07-1825/handoff.md (task, seven files and their state, decisions, expected results, remaining steps, the `dcnToProblems.ts` draft) and the prompt claude_2026-11-07_1825_prompt_dcn_l24_wellformedness.md, whose COSA, HARD STOP and NON FARE stand, with the chat's answers recorded there: clean drone copy (speed := 0 in Flying.land, status on Sensor), strict visibility, `self` receivers only, Drone-only crops, the association-end ticket, seven files with one import and one mount line in EditorV2.tsx, bounds and parameters found by name in the metamodel.

## COSA

The handoff's remaining steps in order: run the module test first and fix the module until green (record in the log entry that the module was written before its test); write `dcnToProblems.ts` from the draft, its test, `DcnProblemSync.tsx` and the two lines in `EditorV2.tsx`; targeted suites, mutation bench on the pure module; one code commit (the seven files); typecheck, full vitest at its baseline, build, check:docs; the browser probe and the two Drone crops into ~/.jjodel-lanes/P-2026-11-07-1900/crops/; hard stop with the log entry in `docs/log-inbox/dcn.md` and the Status flips of both prompts left uncommitted (RC-17), for the chat's visual GO.

## NON FARE

No W5, no run-time or object-level checks, no edit to the six files of CLAUDE.md §3.2, no push, no merge. Public repo: name no partner company.
