# Textual syntax, lane E2a continuation: commit the wiring, gates, crops, docs

Prompt-ID: P-2026-11-07-0840
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (Text tab wiring and tests; gates; docs)
Depends: P-2026-11-07-0746 (E2a, stopped at the soft ceiling; item 1 committed ef8c76e3c, item 2 in its handoff.diff), R-TXT-54
Worktree: ~/jjodel-w-texte2a, branch textual-e2a-select
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-07-0840 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call.

## COSA

Finish E2a from its handoff, ~/.jjodel-lanes/P-2026-11-07-0746/handoff.md (read it whole first; its decisions stand, including `canvasNodeOf`, `canvasVertexIds` from the store, and the hidden-pane refusal).

(1) **Item 2.** `git apply ~/.jjodel-lanes/P-2026-11-07-0746/handoff.diff` (the chat took it off the tree unchanged so this lane starts clean). Typecheck, the textual suite, then its own commit (RC-51) with the red-first evidence and the mutation results the handoff lists.

(2) **Gates** on the tip, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 files red at import are the baseline; harness, timing or order-dependent reds rerun alone and are named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(3) **Crops.** The app check passed on the same code (run7.log, 27 checks); do not rerun it unless the commit changed code. View crops 3-typing, 4-outline-click, 6-r2-hidden-canvas in ~/.jjodel-lanes/P-2026-11-07-0746/ and say what each shows. Crop 2 was taken after down, down, up: retake it after two ArrowDown only, if you can do it in one probe run; otherwise say so.

(4) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill covering 0746 and this continuation (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required with a pointer to the §7.2 draft for `_lastSelected`; mention the two findings the discovery did not foresee). Status flip of both prompt files. Leave all of it uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/selectionSync.ts, __tests__/selectionSync.test.ts, ui/TextualTab.tsx; docs as above. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-07-0746/handoff.md, handoff.diff, run7.log; docs/discovery/discovery_2026-11-06_textual_e_sync.md (§4, §6, §7.2, §8.2); docs/decisions.md R-TXT-54.
