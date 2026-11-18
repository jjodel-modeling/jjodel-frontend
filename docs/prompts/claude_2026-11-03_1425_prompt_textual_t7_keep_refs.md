# Textual T7, fix: a reference the user did not retype keeps its target (R-TXT-35)

Prompt-ID: P-2026-11-03-1425
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane fast · 74b0703d5 · stopped at the context ceiling (RC-51), closed by P-2026-11-03-1451 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1451; the as-typed path after an application goes to the next lane)
Lane: full (write path to a model, printer and diff)
Depends: P-2026-11-03-1356
Worktree: ~/jjodel-w-textt7, branch textual-t7 (the same tree)
Request: none (Alfonso 2026-11-03 14:21 in chat C-2026-11-03-1037, R-TXT-35)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-1425 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each green step. Near the context ceiling, commit and write a handoff in the lane folder.

## COSA
Read R-TXT-35 and R-TXT-32 in docs/decisions.md and docs/discovery/discovery_2026-11-03_textual_positional_paths.md. Do not repeat the discovery.

(1) Turn the five it.fails tests of textDiff.test.ts into plain tests. Add red tests first for: (e2), the old index gone, now a kept reference instead of a parse error; a retyped path that resolves as before; a target deleted in the same edit, cleared; a name reference with a rename plus a new object taking the old name, kept; an application followed by the reprint showing the new path. (2) Give the printer a span per reference token, and make the plan keep a reference whose text, owner and feature equal the previous print, for paths and names. A kept token that names nothing in the edited text must not be a parse error, while a retyped one still is. Say what a reference inside a pasted copy does, with a test: it is a new owner, so it resolves in the edited text. No path is rewritten during an edit or a paste. Outside the editor (T8) there is no previous print: leave it, and state it. (3) Mutation bench on the keep rule.

(4) Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (9 files red at import are the baseline, #199); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. (5) In the app, on a free port: a non-hardware model with unnamed children and an incoming path; a reorder, a cut and paste of a sibling, a deletion of a sibling, an insertion before the target, a move of the target. After each, the incoming reference is on the same object in the D-layer, the reprint shows its new path, and one Undo restores both. Say which steps are keystrokes and which setup is a direct model write. RISC-V Briefs, read-only: print and parse. (6) Crops of the Text tab, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-1425/: before and after each of the five edits. (7) Log entry in docs/log-inbox/codegen.md and this prompt's Status flip, written and left uncommitted until the visual check (RC-17). Stop the probe server.

The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop.
