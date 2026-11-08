# Textual syntax, lane T8c continuation: probe, gates and docs from the handoff

Prompt-ID: P-2026-11-08-0802
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane full · no code (probe line fixed, no defect) · probe t8c-probe2 ALL PASS, crops 1-4 in ~/.jjodel-lanes/P-2026-11-08-0739/ · gates green (vitest: 3 import reds baseline, 2 load reds green alone) · log entry in docs/log-inbox/codegen.md, uncommitted (RC-17)
Lane: full (continuation of P-2026-11-08-0739; no new code unless the probe proves a defect)
Worktree: ~/jjodel-w-textt8c, branch textual-t8c-dialog
Request: Alfonso 2026-11-08 07:36 «Procedi con tutto in lane auto»

Before anything else run pwd, git branch --show-current, git log -3, git status --short, and read ~/.jjodel-lanes/P-2026-11-08-0739/handoff.md (and handoff.diff if the tree is not as the handoff says). Every reply opens with [P-2026-11-08-0802 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines.

## COSA

Finish P-2026-11-08-0739 exactly as its handoff lists: (1) fix the probe line and rerun it, crops 1-counts, 2-uncertain, 3-untick, 4-cancel in ~/.jjodel-lanes/P-2026-11-08-0739/ (measured from the DOM, the model and the undo stack); (2) the five gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy; (3) one log entry in docs/log-inbox/codegen.md via the log-entry skill covering 0739 and this continuation (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required; mention the candidate ticket about unnamed homonyms reading Transition (unnamed)), and the Status flip of both prompt files, all left uncommitted (RC-17); edit only your entry's lines; (4) stop the Vite server on 3739. Code only if the probe proves a defect, in the files of 0739's DOVE; ask first for anything else. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0739/handoff.md, handoff.diff; docs/prompts/claude_2026-11-08_0739_prompt_textual_t8c_dialog.md.
