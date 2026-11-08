# Textual syntax, lane T8d: calibration of the match thresholds on re-imports without ids

Prompt-ID: P-2026-11-08-0831
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (a measurement bench as tests; no threshold change, no UI)
Depends: T8a, T8b (merged), T8c (merging), R-TXT-55 (F8)
Worktree: ~/jjodel-w-textt8d, branch textual-t8d-calibration (from textual-t8c-dialog at 948b1402b, T8c being merged, own node_modules)
Request: Alfonso 2026-11-08 07:36 «Procedi con tutto in lane auto»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no change outside frontend/src/codegen/textual/__tests__/ and its fixtures, no new dependency. Every reply opens with [P-2026-11-08-0831 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a whole log. If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0831/handoff.md before anything else.

## COSA

Row T8d of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1; risk R6 of §9. The match cascade of textMatch.ts pairs objects by similarity with thresholds 0.6 and 0.2 (read them where they are defined). Measure how they behave when a file is re-imported without ids, so a later decision can keep or change them. A threshold changes only by a ratified decision row: this lane does not change any threshold.

(1) **Bench** in a new `__tests__/calibration.test.ts` (grep the name first): on the 16 Briefs used by the textual tests and on the state-machine fixture, apply scripted edits to the printed text (rename an object, reorder siblings, delete one object, add one, change two attributes of one object, swap two homonyms, combinations of two), strip any ids, plan the re-import against the original model, and record per edit kind: correct pairings, wrong pairings, uncertain rows, creates plus deletes that should have been a pairing. Assertions only on invariants that already hold (no crash, plan applies); the numbers go to a table file in the lane folder and to your final message, not into assertions.

(2) **What the numbers say**: for each threshold, would a different value (try 0.5, 0.55, 0.65, 0.7 for the upper; 0.15, 0.25, 0.3 for the lower) reduce wrong pairings without raising uncertain rows a lot? Run the bench with each value by a parameter of the bench only (do not change textMatch.ts; if it cannot take the threshold as a parameter, measure only the current values and say so).

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run check:docs.

(4) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters; the table in the lane folder, cited), Status flip; both uncommitted (RC-17). Edit only your entry's lines. No push, no merge. Final message: the table (short), a Recommended line (keep or change, with the evidence), Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/__tests__/calibration.test.ts (new), test fixtures if needed. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§6, §8, §9 R6); textMatch.ts; the T8a, T8b and T8c log entries in docs/log-inbox/codegen.md.
