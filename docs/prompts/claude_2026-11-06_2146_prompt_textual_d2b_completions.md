# Textual syntax, step D, lane D2b: completion candidates in the language service

Prompt-ID: P-2026-11-06-2146
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (language service, printer refactor; tests)
Depends: P-2026-11-06-2118 (D2a, the expected set, c4a545aa3 and e23c3870c on this branch), R-TXT-53 (provisional, D3 and D10)
Worktree: ~/jjodel-w-textd, branch textual-d-writing-aids
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 20:34, «decidi tu in /lane auto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-06-2146 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D2b of docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §8, design §3.3 C2 and C3, decisions D3 and D10 (R-TXT-53).

(1) **C3 first, a refactor guarded by the print tests.** The printer's `ref`/`path`/`name` closures move into one exported pure function the printer itself calls, so completion and print cannot drift. The existing print tests stay green unchanged; no output changes.
(2) **C2, `completionsAt(text, offset, …)` in languageService.ts**, built on D2a's `expected`, with no metamodel-specific code: keywords and style tokens as written; a `block` item gives its words as keyword candidates, a multi-word close whole and its remainder once begun (D10); enum literals in their cased form, with the hover doc `hoverAt` already builds; reference targets from the parse of the full text (objects whose class is in the item's targets), each written by the function of (1), name when unique else path, `@"id"` never offered (D3); no candidate for a new name. Each candidate carries its kind (keyword, literal, reference) and the range it replaces.
(3) Tests in __tests__/completion.test.ts: the seven probe cursors give the expected candidates; a reference with a duplicate name is offered by path; a nameless target is not offered by name; the per-block close and the head prefix appear; a half-typed `end ⎸` offers the rest of the close.
(4) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(5) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Smoke visivo non applicabile, no UI), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/languageService.ts, printer.ts, __tests__/completion.test.ts. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §3.3, §8; docs/decisions.md R-TXT-4, R-TXT-28, R-TXT-45, R-TXT-53; D2a's final message in ~/.jjodel-lanes/P-2026-11-06-2118/ (the `block` kind and the cursor-on-a-word behaviour).
