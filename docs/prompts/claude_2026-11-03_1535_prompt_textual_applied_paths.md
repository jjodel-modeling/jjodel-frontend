# Textual syntax: after an application the text shows the current paths

Prompt-ID: P-2026-11-03-1535
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane full · 2c68de01b, 4656b4ac6 · in attesa della verifica visiva (crops in ~/.jjodel-lanes/P-2026-11-03-1535/)
Lane: full (Text tab, undo, write path)
Depends: P-2026-11-03-1517 (merged); replaces P-2026-11-03-1530, launched by mistake in a stale worktree, blocked by its guard with no work done
Worktree: ~/jjodel-w-textapplied, branch textual-applied-paths
Request: none (R-TXT-35, ratified by Alfonso 2026-11-03 14:21; defect measured by P-2026-11-03-1451)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-1535 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each green step, a fix with a test red first. Near the context ceiling, commit and write a handoff in the lane folder.

## COSA
R-TXT-35: after an application the reprint shows the new path. Measured by P-2026-11-03-1451 (crops 6-as-typed, 7-reprint in its lane folder): nothing reprints by itself, so `fires Initial[0].transitions[1]` stays on screen under the status Applied and, read in the text, names another object while the model is right.

(1) After an application, rewrite only the reference tokens whose printed text changed, using the per-token spans of the printer. Never the token under the cursor, whose rewrite waits for the cursor to leave it or for the next application. Keep the caret, the selection, comments and all other text as typed. A full reprint is not the fix. The rewrite is no model write and is not a further application: the tab reads Up to date or Applied, with no loop. (2) One Undo per application stays true, in the model and in the text: decide how the rewrite sits in the editor undo stack so that one Cmd+Z restores the state before the application, with a test. If that cannot hold without a change outside the Text tab files, stop with Outcome: question. (3) Measure the failed cleanup of P-2026-11-03-1451: after an edit and a rename by a direct model write, two Cmd+Z did not restore the original print. Say whether it comes from the direct write, and fix it only if it is in the Text tab; otherwise report it with figures.

Tests first on a non-hardware metamodel. Mutation bench on the rewrite. Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (read the baseline of red-at-import files from the last merge, result.json of P-2026-11-03-1517); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. In the app, on a free port: the five edits of P-2026-11-03-1451 show the current path right after Applied, the caret stays where it was, a comment-free text otherwise as typed, one Undo restores; the cursor-on-token case. Say which steps are keystrokes and which setup is a direct model write. Crops of the Text tab, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-1535/: after each edit, after Undo, the cursor-on-token case. Log entry in docs/log-inbox/codegen.md and Status flip written and left uncommitted until the visual check (RC-17). Stop the probe server.

The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop.
