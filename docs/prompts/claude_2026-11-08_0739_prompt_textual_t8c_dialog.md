# Textual syntax, lane T8c: the re-import dialog in the confirm panel

Prompt-ID: P-2026-11-08-0739
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane full · 66c612ab3 (red first, bench 8/8), acf1391ee (red first, bench 6/6) · continued in P-2026-11-08-0802 after the context ceiling · gates green (vitest: 3 import reds baseline) · app check ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-08-0739/ · log entry in docs/log-inbox/codegen.md, uncommitted (RC-17)
Lane: full (confirm panel and plan rows, tests; app check with crops)
Depends: T8a, T8b (merged), R-TXT-55 (F10)
Worktree: ~/jjodel-w-textt8c, branch textual-t8c-dialog (from trunk ce18b0c02, own node_modules)
Request: Alfonso 2026-11-08 07:36 «Procedi con tutto in lane auto»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency, no store write outside `applyTextEdit`. Every reply opens with [P-2026-11-08-0739 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0739/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row T8c of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decision F10 (one panel for edits and re-imports); risk R6 of §9. Read the T8a and T8b log entries first.

(1) **Plan rows** (`textDiff.ts`): each uncertain pairing carries its score; an unticked uncertain row becomes a create plus a delete when applied. Make the T8b `ids` input an explicit optional field of the diff input (T8b typed it around the file). Tests in `__tests__/textDiff.test.ts`: score present on uncertain rows; unticking turns one pairing into create plus delete; counts of creates, deletes and changes; a delete of an object referenced from another model is flagged.

(2) **The panel** (`ui/TextConfirmPanel.tsx`): counts at the top (changes, creates, deletes), a checkbox per uncertain row with its score, creates and deletes listed, cross-model deletes in red (existing danger token, no new color), and a **Cancel** button that closes the panel and applies nothing (candidate ticket from T8b: the panel had no Cancel). Same component for an edit and a re-import (F10). Existing classes and tokens; grep before any new class. If the bar cannot hold counts and checkboxes at the panel's width, stop with Outcome: question and a Recommended line (F10 allows a modal only then).

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-0739/, reusing the probe of ~/.jjodel-lanes/P-2026-11-08-0206/ (copy it and what it imports) on its own port: 1-counts (an import with a change, a create and a delete shows the counts), 2-uncertain (an uncertain row with its score and checkbox), 3-untick (unticking and applying creates and deletes instead of pairing: measured from the model), 4-cancel (Cancel closes the panel, the model is unchanged, the undo stack length is unchanged). Measure from the DOM, the model and the undo stack, not from the screenshot.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/textDiff.ts, ui/TextConfirmPanel.tsx, __tests__/textDiff.test.ts; textFile.ts and ui/TextualTab.tsx only for the ids field and the Cancel wiring. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§6.3, §8, §9 R6); docs/decisions.md R-TXT-55; the T8a and T8b log entries in docs/log-inbox/codegen.md.
