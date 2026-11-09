# Gates on the merge of the trunk into lost-link-fix

Prompt-ID: P-2026-11-09-1358
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-09 · lane lost-link-fix · 067e796bc
Lane: full (continuation of merge lane P-2026-11-09-1347, stopped at the context ceiling after committing the merge 067e796bc; no code change)
Depends: merge 067e796bc (parents f2ac2d722, 7571f8a53); handoff ~/.jjodel-lanes/P-2026-11-09-1347/handoff.md
Worktree: ~/jjodel-w-lostfix, branch lost-link-fix, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt, its parent is 067e796bc, and the tree is clean; otherwise stop with Outcome: blocked. Read the handoff's list of remaining checks only. Never read `EditorV2.tsx` or any file over 400 lines; the merge was already inspected. No code change: a red caused by the merge stops the lane with Outcome: question and the failing names. No subagents, no background tasks. Every reply opens with [P-2026-11-09-1358 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a log; read each exit code; before vitest wait while the 1-minute load is above 20.

## COSA

(1) On the tree of 067e796bc: typecheck, typecheck:scripts, full vitest (expected about 15964 passed; baseline 3 known import reds; any other red rerun alone, load reds named), hook tests, build, check:docs, check:scripts, check:addonly against 646c78b89 as the pre-merge code tip. If check:addonly reports a violation, do not reset anything: stop with Outcome: question (a reset target would be f2ac2d722, which keeps the prompt commit).

(2) One probe run of `frontend/scripts/probe/lost-containment-write.ts` through `lane-run probe` (grep MEAS in the lane folder log): forced arms keep both writes, the two-drops arm keeps 2 of 2.

(3) Status flip of this prompt and of `docs/prompts/claude_2026-11-09_1347_prompt_lost-link-fix_take_trunk.md`, one commit, `git add` only those files. Leave the `frontend/node_modules` link (the merge lane into the trunk follows). No push, no merge. Final message: gate table with exit codes, probe MEAS, then the Outcome.

## DOVE

The two prompts' Status lines only. Nothing else.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-09-1347/handoff.md; docs/prompts/claude_2026-11-09_1347_prompt_lost-link-fix_take_trunk.md.
