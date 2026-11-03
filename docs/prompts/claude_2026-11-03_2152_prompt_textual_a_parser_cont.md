# Textual syntax, step A parser half, continuation (continues P-2026-11-03-2120 after the context ceiling)

Prompt-ID: P-2026-11-03-2152
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (parser core; continuation under RC-51)
Depends: P-2026-11-03-2120 (hard-stop at the ceiling; items i and ii at 93ec1bd92, handoff in its lane folder)
Worktree: ~/jjodel-w-texta, branch textual-a-tolerant-parser (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 93ec1bd92, and the only changes are the three files named in the handoff (tolerant.test.ts modified, the probe in docs/discovery/harness/, _tmp_tolerant_recovery.test.ts untracked), otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-2152 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each item is green, a test red first. Near the context ceiling, commit and write a handoff in the lane folder.

## COSA
Read ~/.jjodel-lanes/P-2026-11-03-2120/handoff.md only, and docs/prompts/claude_2026-11-03_2120_prompt_textual_a_parser.md for the items and the checks. Do items (iii) to (vi) in order, starting from recovery_patch.py in that lane folder, applied only after its tests are seen red, with the fix the handoff names: objects read from a skipped block do not count as top-level objects when paths are resolved. Rerun the probe and give the before and after tables. Delete the _tmp_ test copy before closing. Then the mutation bench, the Briefs, the gates, the in-app check, the crops in ~/.jjodel-lanes/P-2026-11-03-2152/, the log entry and the Status flips of 1415, 2120 and this prompt, written and left uncommitted until the visual check (RC-17), all as that prompt says. Inferring a class keyword stays out. A text with a syntax error is never applied.

The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop, or a handoff if the ceiling comes first.
