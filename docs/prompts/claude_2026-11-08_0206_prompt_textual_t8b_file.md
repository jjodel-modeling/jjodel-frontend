# Textual syntax, lane T8b: Export and Import of the text in the Text tab

Prompt-ID: P-2026-11-08-0206
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane full · 6f5207c66 (pure, red first, bench 2/2), ca62444fa (red first) · gates green (vitest: 3 import reds baseline) · app check 13/13 ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-08-0206/ · log entry in docs/log-inbox/codegen.md, uncommitted (RC-17)
Lane: full (pure file module, two toolbar actions in the Text tab, tests; app check with crops)
Depends: T8a (ids in the text, merged), D, E, F (merged), R-TXT-55 (F8, F9, F10), R-TXT-21 (8)
Worktree: ~/jjodel-w-textt8b, branch textual-t8b-file (from trunk c8153d84a, own node_modules)
Request: Alfonso 2026-11-08 00:24 «decidi tu» (the chat chose to continue with F2, then T8)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency, no store write outside `applyTextEdit`. Every reply opens with [P-2026-11-08-0206 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0206/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row T8b of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, designed in §6.3 point 3; decisions F8 to F10 (R-TXT-55); risk R6 of §9. Read §6 whole and the T8a log entry first.

(1) **`textFile.ts`**, new and pure (grep the name first): the export text (the print of the current model with T8a's `printIds` on, turned on locally for the export only, since T8a does not save it in the syntax record) and the import plan (a file's text planned against the current model with no carried spans, so the match starts at the ids, then names; the same `planTextEdit` the Text tab uses). Tests in `__tests__/textFile.test.ts`: the export carries one `@id` comment per object head; an exported text re-imported unchanged plans no change; an edited value plans one change; a file without ids still plans by names; a recovered object is refused as R-TXT-21 (8) says.

(2) **In the Text tab** (`ui/TextualTab.tsx`): two toolbar actions, Export (download a .txt named after the model) and Import (pick a file, show the existing confirm panel with the plan, apply through `applyTextEdit` in one undo step). Bootstrap Icons only, existing toolbar classes, no new layout. Touch only what this needs.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-0206/, reusing the probe of ~/.jjodel-lanes/P-2026-11-08-0027/ (copy it and what it imports) on its own port: 1-export-button (the two actions in the toolbar), 2-exported-file (the downloaded text has the @id comments: measure from the file, not the screen), 3-import-confirm (importing an edited copy opens the confirm panel with the change), 4-applied (after confirming, the model holds the edit and one Cmd+Z undoes it: measure from the model and the undo stack). Measure from the DOM, the file and the model, not from the screenshot.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/textFile.ts (new), __tests__/textFile.test.ts (new), ui/TextualTab.tsx. Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§6, §8, §9 R6); docs/decisions.md R-TXT-55, R-TXT-21; the T8a log entry in docs/log-inbox/codegen.md.
