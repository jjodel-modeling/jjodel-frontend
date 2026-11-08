# Textual syntax, lane T8e: match thresholds as a parameter, content-aware homonym pairing, highlight on open off-screen

Prompt-ID: P-2026-11-08-1625
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (pure matcher changes with the T8d bench, one Text tab fix, tests, app check with crops)
Depends: T8c, T8d (calibration bench), TABFIX (P-2026-11-08-0859)
Worktree: ~/jjodel-w-textt8e, branch textual-t8e-match (from trunk f081ad4f2, own node_modules)
Request: Alfonso 2026-11-08 16:23 «procedi in lane auto» on the candidate tickets of the checkpoint docs/sessioni/sessione_2026-11-07_textual_DEF.md

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core, nothing outside frontend/src/codegen/textual/, no store write, no new dependency. Every reply opens with [P-2026-11-08-1625 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1625/handoff.md first.

## COSA

Read the T8c, T8d and TABFIX entries in docs/log-inbox/codegen.md and the T8d table ~/.jjodel-lanes/P-2026-11-08-0831/calibration-table.md first.

(1) **Thresholds as a parameter**: MatchInput (textMatch.ts:149) gets two optional fields for the rename threshold and margin; absent, RENAME_THRESHOLD 0.6 and RENAME_MARGIN 0.2 apply exactly as today (test: every existing match test unchanged). No caller passes them. Extend the T8d bench (__tests__/calibration.test.ts) to run 0.5, 0.6, 0.7 and margins 0.1, 0.2, 0.3 and print one table; the defaults do NOT change in this lane: report the numbers and a Recommended line.

(2) **Content-aware homonym pairing**: T8d found that the wrong pairings come from homonym order (swap homonyms, delete plus add of one class). When two or more model objects and two or more text objects share class and name (or are all unnamed), pair them by content similarity (the same feature scoring the cascade already uses) instead of order, with order only as the tie-break. Tests: swapped homonyms pair correctly; delete of the first homonym does not shift the others; identical homonyms keep order pairing. Rerun the T8d bench before and after: the wrong rows of swap homonyms and delete plus add must drop, no other row may get worse; put both tables in the report. If a row gets worse, stop with Outcome: question and a Recommended line.

(3) **Highlight on open for off-screen nodes**: TABFIX reads the canvas selection on open from .react-flow__node.selected, so a selected node outside the viewport is not highlighted. Find a read path for the current selection that does not depend on the DOM (the publisher of CANVAS_SELECTION_CHANGED, a selection holder it already keeps, or the store selection the canvas reads; grep, read only). If one exists inside reach without touching files outside codegen/textual, use it in heldOnOpen's caller; if it needs a file outside codegen/textual, stop this item with Outcome: question and a Recommended line, and finish (1) and (2).

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(5) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-1625/, reusing the T8c probe (~/.jjodel-lanes/P-2026-11-08-0739/) and the TABFIX probe (~/.jjodel-lanes/P-2026-11-08-0859/), copied, on its own port: 1-swap (re-import with two swapped homonyms: the confirm panel pairs them right), 2-offscreen (a selected node scrolled out of the canvas viewport is highlighted when the Text tab opens; skip if (3) stopped). Measure from the DOM and Monaco, not from the screenshot.

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, the bench tables, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/textMatch.ts, textDiff.ts if the pairing lives there, selectionSync.ts, ui/TextualTab.tsx (the on-open read only), their tests under __tests__/. Nothing else; ask first. Before a new identifier, grep for it.

## RIFERIMENTI

docs/sessioni/sessione_2026-11-07_textual_DEF.md (candidate tickets); the T8c, T8d, TABFIX log entries; docs/discovery/discovery_2026-11-06_textual_e_sync.md §6.1.
