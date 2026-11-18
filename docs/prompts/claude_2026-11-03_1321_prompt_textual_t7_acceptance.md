# Textual T7, acceptance: bench, gates, in-app check (continues P-2026-11-03-1251 after the context ceiling)

Prompt-ID: P-2026-11-03-1321
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane fast · d2125a90f · stopped at the context ceiling (RC-51), closed by P-2026-11-03-1356 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1321)
Lane: fast (closure of work already written and unit-tested)
Depends: P-2026-11-03-1251 (hard-stop at the ceiling, RC-51; code at b2e9bae4d, handoff in its lane folder)
Worktree: ~/jjodel-w-textt7, branch textual-t7 (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of b2e9bae4d and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md, the core (LModelElement.tsx) or move.ts; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-1321 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate or probe log. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit a fix as soon as it is green, with a test red first.

## COSA
Read ~/.jjodel-lanes/P-2026-11-03-1251/handoff.md only. In this order:
(1) Run the bench of the newest helpers (bench2.py, in that lane folder). A new test for a move into a single-valued slot whose current object is deleted: the outcome must be the moved object in the slot and the old one gone, or a stated refusal; fix if it fails.
(2) Gates, one tool call each, from frontend/, through node scripts/run-quiet.mjs LABEL -- CMD: npx tsc --noEmit; full npx vitest run (9 files red at import are the baseline, #199); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.
(3) In-app acceptance on a free port, typing in the Text tab: cut and paste an object to another container, id and incoming references intact; reorder an ordered feature; a feature with `ordered` false keeps the model order; a pasted copy with the original still there is a new object; a held cut shows its status and Delete button; the outer marker shows on its token; one Undo per application. Say exactly which steps are keystrokes and which setup is a direct model write.
(4) Measure discovery risk R1, the hole the core leaves in the old slot, in the app. If a move leaves a hole that only the core can fix, stop with Outcome: question.
(5) RISC-V Briefs, read-only: print and parse, figures.
(6) Crops of the Text tab, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-1321/: before and after the move, before and after the reorder, after Undo, held cut, outer marker. Close the Quick tip toast first if it covers the text.
(7) Log entry in docs/log-inbox/codegen.md and Status flips of 1225, 1251 and this prompt, written and left uncommitted until the visual check (RC-17). Stop the probe server.

The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.
