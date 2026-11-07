# DCN L2.3 continuation: finish the roles group and profile from the uncommitted tree

Prompt-ID: P-2026-11-07-1012
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (continuation of P-2026-11-07-0941, stopped at the context ceiling)
Corregge: 2026-11-07 09:41 (stopped at the soft context ceiling with the code uncommitted, RC-51)
Worktree: ~/jjodel-w-dcn-l23, branch dcn-l23, at the commit that adds this prompt on top of b02f337d7
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt, and the uncommitted changes are exactly the nine modified files and the untracked `frontend/src/model/simulation/dcn/` of the previous session; otherwise stop with Outcome: blocked. Do not discard or rewrite that work: continue it. No subagents, no background tasks. Every reply opens with [P-2026-11-07-1012 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; grep only failing test names. Commit the code as soon as the targeted suites are green, before the full run, so a context stop loses nothing.

## Contesto (non rifare l'analisi)

Read the last message of the previous session in ~/.jjodel-lanes/P-2026-11-07-0941/log.jsonl (its final result) and the prompt claude_2026-11-07_0941_prompt_dcn_l23_roles_profile.md; the chat's answer A (up to 11 files, one shared list of hidden groups per shape, `generic` notation, `{}` preset) stands, with its Rule 19 deroga. Decisions on the open points: events off in «Dynamic classification» is accepted (trigger depends on transition); the panel's profile dropdown (`PANEL_PROFILE_IDS`, `simRoleStatus.ts`) stays out of scope, a later lane; `operation` and `body` become `multi` (R-SIM-90) only if `roleValues`/`encodeRoleValues` already accept the reference and actionList kinds with no change outside the 11 files, otherwise they stay single and the commit body says so.

## COSA

(1) Fix the `simRolesDraft.ts` regression: the dcn roles must not appear, not even as «not used», in the dialog of the control-flow and Petri profiles (the State machine count back to 14), and the control-flow and Petri groups must not appear under `dcn`.
(2) Read the failing `simLabels.test.ts` case; if it needs a change outside the 11 files, stop with Outcome: question. Rerun `outline.test.ts` alone to confirm it is a timing flake.
(3) One code commit (the 11 files at most, the `dcn/` folder included). Then the mutation bench (P5), the full vitest run at its baseline, `npm run build`, `npm run check:docs`.
(4) The browser probe of the original COSA (5): crops of the dialog with «Dynamic classification», and the Petri profile on this branch and on the base b02f337d7 (temporary worktree, removed after), light theme, in ~/.jjodel-lanes/P-2026-11-07-1012/crops/. Throwaway probe under a gitignored `_tmp_` name, deleted after.
(5) Hard stop with the log entry appended to `docs/log-inbox/dcn.md` and the Status lines of both prompts left uncommitted (RC-17); the chat reads the crops and gives the GO.

## NON FARE

No change to the resolved roles of any existing profile, no engine or `startRun` change, no push, no merge. Public repo: name no partner company.
