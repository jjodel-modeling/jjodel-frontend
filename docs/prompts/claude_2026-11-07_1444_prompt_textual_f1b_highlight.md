# Textual syntax, lane F1b: JjEL highlighting inside the islands

Prompt-ID: P-2026-11-07-1444
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (semantic tokens, tests; app check with crops)
Depends: F1a (branch textual-f1a-islands, merging now), R-TXT-55 (F2)
Worktree: ~/jjodel-w-textf1b, branch textual-f1b-highlight (from textual-f1a-islands 6ce76bca7, so F1a is in; merges after F1a)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-1444 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Test red first, its own commit (RC-51, code first).

## COSA

Row F1b of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decision F2 of §8.2 (R-TXT-55), designed in its §4.

(1) **Sub-tokens.** In `analyzeText` (languageService.ts), each JjEL island from F1a's `jjelIslands` is lexed with the JjEL lexer and its tokens become semantic sub-tokens with the existing legend (keywords, identifiers, numbers, operators, strings as the legend already maps them), placed in text offsets through the island's map so they are right across escapes. The quotes of the value stay `string`. A lexer error leaves the island as one `string` token (R2 of §9). Tests in `__tests__/languageService.test.ts`: sub-tokens for an expression and an action in the C-like and Pascal styles, a token across `\"` and Pascal's `''`, a lexer error falling back, non-JjEL strings unchanged.

(2) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(3) **App check**, real gestures, the state-machine fixture (it has guards and effects, `"model.[paid]"`, `"model.[coins] := model.[coins] + 1"`): crops light theme scale 1 in ~/.jjodel-lanes/P-2026-11-07-1444/: 1-clike (guard and effect coloured inside their quotes), 2-pascal, 3-third-style (the other style the picker offers), 4-lexer-error (a broken expression shown as one string). Stop your server.

(4) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/languageService.ts, jjelIslands.ts, __tests__/languageService.test.ts (or __tests__/jjelIslands.test.ts). ui/TextualTab.tsx is not touched. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§4, §8, §9 R2 and R3); docs/decisions.md R-TXT-55; the F1a log entry and commits d592aa7c2, 2bd20c384 on textual-f1a-islands.
