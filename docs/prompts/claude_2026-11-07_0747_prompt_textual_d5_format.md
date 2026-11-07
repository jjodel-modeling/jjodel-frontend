# Textual syntax, lane D5: format document and format selection

Prompt-ID: P-2026-11-07-0747
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (pure formatter, Monaco providers, tests; app check)
Depends: D4 (merged, P-2026-11-07-0717), E1a (textReprint.ts, merged), R-TXT-53
Worktree: ~/jjodel-w-textd5, branch textual-d5-format
Request: none (lane auto, «Procedi con E e poi F»; D continues alongside)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-0747 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D5 of docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §8, designed in its §6.2, and decision D5 of R-TXT-53 (parentheses).

(1) **`format.ts`, pure** (new): full format of an applicable text = print the parsed objects, then put each comment back by its owner (leading before the owner's first token, trailing at the end of the owner's line), with `commentsOf` (parser.ts). Check first whether E1a's `textReprint.ts` already gives the comment placement you need and reuse it rather than duplicating it; say what you reused. Range format = the full format, then splice only the top-level objects whose spans meet the range. No format on a text that is not applicable (return nothing). Parentheses as decision D5 says. Tests in `__tests__/format.test.ts` (new): idempotence (format of a formatted text is unchanged), print-parse equality of the objects (a format never changes meaning), every comment kept with its owner, range format leaving other objects byte-identical, a broken text left alone.

(2) **Providers** in ui/textualMonaco.ts: `registerDocumentFormattingEditProvider` and `registerDocumentRangeFormattingEditProvider`, each returning one minimal edit (common prefix and suffix trimmed) so the caret and the decorations of untouched objects stay.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 files red at import are the baseline; harness, timing or order-dependent reds rerun alone and are named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check**, port corpus (copy ~/.jjodel-lanes/P-2026-11-07-0609/ probe files into ~/.jjodel-lanes/P-2026-11-07-0747/), real gestures (Shift+Alt+F, and the context menu's Format Selection on a selected range), crops light theme scale 1: 1-before (a badly indented text with a leading and a trailing comment), 2-after-format (indented, both comments in place), 3-range (only the selected object reformatted), 4-broken (format on a broken text does nothing). Stop your server.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/format.ts (new), frontend/src/codegen/textual/__tests__/format.test.ts (new), frontend/src/codegen/textual/ui/textualMonaco.ts. ui/TextualTab.tsx is not touched (another lane holds it). Nothing else; ask first. Before a new identifier, grep the codebase for it.

## COME

Reuse the printer, `commentsOf` and E1a's splice. If a needed change falls outside DOVE, stop with Outcome: question.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (§6, §8 D5 row, §9); docs/decisions.md R-TXT-53; docs/discovery/discovery_2026-11-06_textual_e_sync.md §3 (T10, the splice).
