# Textual syntax, step D, lane D2c: the completion provider in the editor

Prompt-ID: P-2026-11-06-2213
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · f5fb02d8b · gates green · app check 8/8 PASS, crops in ~/.jjodel-lanes/P-2026-11-06-2213/, visual GO pending · log entry in docs/log-inbox/codegen.md
Lane: full (Monaco providers; tests; app check with crops)
Depends: P-2026-11-06-2146 (D2b, completionsAt, 387e558d7 on this branch), P-2026-11-06-2118 (D2a), R-TXT-53 (provisional)
Worktree: ~/jjodel-w-textd, branch textual-d-writing-aids
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 20:34, «decidi tu in /lane auto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-06-2213 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D2c of docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §8, design §3.3 C4.

(1) A `CompletionItemProvider` registered in `registerTextualMonaco` (ui/textualMonaco.ts) for TEXTUAL_LANGUAGE_ID, built on D2b's `completionsAt` and on the session's reading (the parse per version the other providers already share): candidate kind mapped to Monaco's (keyword, enum member, reference), the replace range from the candidate, the literal's hover doc as documentation. Trigger characters from the style's punctuation (no letters). No candidate when the session has no reading.
(2) Tests in __tests__/languageService.test.ts: the provider returns the candidates of `completionsAt` with the right kinds and ranges, at three cursors; nothing without a session.
(3) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(4) App check, port corpus (copy ~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, banner and What's new suppressed; real keystrokes, Ctrl+Space and typing), crops in ~/.jjodel-lanes/P-2026-11-06-2213/, light theme, scale 1: the suggest widget inside a block (keywords), after `:` (types), after `=` in an expression (references written as the printer writes them), and on a half-typed close (`end ⎸`) with a per-block close set. Picking a candidate inserts it; the text stays applicable. Stop the server.
(5) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/ui/textualMonaco.ts, frontend/src/codegen/textual/__tests__/languageService.test.ts. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §3.3, §8; docs/decisions.md R-TXT-53; D2b's final message in ~/.jjodel-lanes/P-2026-11-06-2146/.
