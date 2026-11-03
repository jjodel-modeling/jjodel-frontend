# Textual T7, closure and one measurement: positional paths after a move or reorder

Prompt-ID: P-2026-11-03-1356
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (closure, plus one measurement with no fix)
Depends: P-2026-11-03-1321 (hard-stop at the ceiling, RC-51; code at d2125a90f, handoff in its lane folder)
Worktree: ~/jjodel-w-textt7, branch textual-t7 (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of d2125a90f and the tree is clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-03-1356 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate log. Do not change production code in this lane.

## COSA
(1) The chat's question. A reference to an unnamed object prints as a positional path, for example `fires State[0].transitions[1]`. R-TXT-32 forbids re-resolving by position for outer targets, and R-TXT-22 keeps identity on a move. Measure, with tests at the textDiff level on a Folder/File-style fixture of unnamed children, what happens to an incoming reference whose path text the user did NOT retype in each case: (a) a reorder of the list the path indexes; (b) a cut and paste of an earlier sibling out of that list; (c) deleting an earlier sibling; (d) inserting a new sibling before it; (e) a move of the target itself, with the old index still valid because a sibling shifts into it. For each: does the plan retarget the reference silently to a different object, refuse, or keep it? Commit the tests that show a silent retarget as it.fails expected-fail tests, named paths only. Write the table in docs/discovery/discovery_2026-11-03_textual_positional_paths.md with file:line, and a single recommended rule, with rejected alternatives. Commit it.
(2) Then ~/.jjodel-lanes/P-2026-11-03-1321/handoff.md step (7): npm run check:docs through node scripts/run-quiet.mjs; log entry in docs/log-inbox/codegen.md and the Status flips of 1225, 1251, 1321 and this prompt, written and left uncommitted until the visual check (RC-17).

The repo is public: name no partner company. No push, no merge. Final message: the table, the recommendation, Decisions awaiting Alfonso, then the Outcome.
