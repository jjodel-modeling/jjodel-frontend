# Textual T7, continuation: moves, reorder, marker, acceptance (continues P-2026-11-03-1225 after the context ceiling)

Prompt-ID: P-2026-11-03-1251
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (write path to a model; continuation under RC-51)
Depends: P-2026-11-03-1225 (hard-stop at the ceiling; planner commit ee2f4ccc6, handoff in its lane folder)
Worktree: ~/jjodel-w-textt7, branch textual-t7 (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 22c3d1b41 and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md, the core (LModelElement.tsx) or move.ts; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-1251 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate or probe log. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each green item, in this order, so a ceiling stop loses nothing.

## COSA
Read ~/.jjodel-lanes/P-2026-11-03-1225/handoff.md and, only where you need it, docs/discovery/discovery_2026-11-03_textual_t7_moves.md. Do not repeat the discovery. Do items (2) to (5) of docs/prompts/claude_2026-11-03_1225_prompt_textual_t7.md with tests red first, then the mutation bench on the textual write path, the gates, the in-app acceptance and the crops as written there and in the handoff.

Chat answers, R-TXT-33 on the trunk, provisional, unattended: D-2 stands, a feature is ordered unless `ordered === false` (the Ecore default); reversing a list in the text therefore reorders the model. D-5 stands: a cut followed by a paste of the identical text is certain identity, no confirmation panel; a paste with the original still in the text is a new object; any other move stays uncertain and is confirmed. The quoted string on an enum attribute has its own ticket: leave it.

Measure and report discovery risk R1, the hole the core leaves in the old slot. If a move leaves a hole that the core must fix, stop with Outcome: question. Say exactly which steps are keystrokes in the Text tab and which setup is a direct model write. Log entry in docs/log-inbox/codegen.md and Status flips of 1225 and this prompt written and left uncommitted until the visual check (RC-17). The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.
