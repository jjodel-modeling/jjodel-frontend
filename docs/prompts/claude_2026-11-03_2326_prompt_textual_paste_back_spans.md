# Textual syntax: a pasted-back text gets its agreed spans back

Prompt-ID: P-2026-11-03-2326
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (one defect, Text tab only)
Depends: P-2026-11-03-2300
Worktree: ~/jjodel-w-textb, branch textual-b-navigation (the same tree)
Request: none (R-TXT-38, chat decision, unattended; defect found by P-2026-11-03-2152, measured by P-2026-11-03-2300)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 85abf3dc4 and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core. Every reply opens with [P-2026-11-03-2326 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run.

## COSA
The defect, measured in docs/discovery/discovery_2026-11-03_textual_language_service.md: when the whole text is deleted, the object ranges Monaco tracks shrink to nothing and a paste back does not restore them; the tab sees the text equal to the agreed one and keeps the empty ranges (TextualTab.tsx:803-807, 861-866), so a later comment-only edit stops at «confirm below» pairing unnamed objects by order. Fix as the report says: the agreed text keeps its spans and reference tokens with the agreement, and they are put back whenever the text equals it again. Test first, red: delete all, paste back, comment-only edit gives «No change»; and the same with a partial delete and paste back of a block. Mutation bench on the restore. Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (3 files red at import are the baseline); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. In the app, on a free port, keystrokes: Cmd+A, Backspace, Cmd+V, then a comment edit: «No change» or «Applied» with no confirm panel; one Undo. Crops in ~/.jjodel-lanes/P-2026-11-03-2326/. Log entry in docs/log-inbox/codegen.md (Notes under 500 characters) and Status flip, written and left uncommitted (RC-17). Stop the probe server. The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, then the Outcome.
