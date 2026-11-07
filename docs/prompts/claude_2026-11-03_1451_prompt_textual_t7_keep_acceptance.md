# Textual T7, keep rule: tab tests, bench, gates, in-app check (continues P-2026-11-03-1425 after the context ceiling)

Prompt-ID: P-2026-11-03-1451
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane fast · 4b34517b0 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1451; the as-typed path after an application goes to the next lane)
Lane: fast (closure of work already written and unit-tested)
Depends: P-2026-11-03-1425 (hard-stop at the ceiling, RC-51; code at 74b0703d5, handoff in its lane folder)
Worktree: ~/jjodel-w-textt7, branch textual-t7 (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 74b0703d5 and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-1451 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each green step, a fix with a test red first.

## COSA
Read ~/.jjodel-lanes/P-2026-11-03-1425/handoff.md only. R-TXT-35 is written on the trunk (3997a368f), not on this branch: the text in docs/prompts/claude_2026-11-03_1425_prompt_textual_t7_keep_refs.md is enough. In this order:
(1) The three Text tab tests of the handoff. (2) Mutation bench on the keep rule. (3) Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (9 files red at import are the baseline, #199); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. (4) In the app, on a free port: a non-hardware model with unnamed children and an incoming path; a reorder, a cut and paste of a sibling, a deletion of a sibling, an insertion before the target, a move of the target. After each, the incoming reference is on the same object in the D-layer and one Undo restores both. Say which steps are keystrokes and which setup is a direct model write. (5) One thing the chat wants measured and shown: after an application the text stays as typed until a reprint, so an untouched path can read as naming another object while the model keeps the right one. State what the tab shows at that moment and when the reprint happens, with a crop. Do not change the behaviour; report it. (6) RISC-V Briefs, read-only: print and parse. (7) Crops of the Text tab, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-1451/: before and after each of the five edits, and the reprint. (8) Log entry in docs/log-inbox/codegen.md and the Status flips of 1425 and this prompt, written and left uncommitted until the visual check (RC-17). Stop the probe server.

The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop.
