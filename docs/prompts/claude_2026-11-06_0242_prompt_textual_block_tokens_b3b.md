# Textual syntax, lane B3b: the head prefix, readers and form

Prompt-ID: P-2026-11-06-0242
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · ca03ff90d, 65a842fe2 · gates green · app check 10/10 (step 3 in P-2026-11-06-0310) · soft ceiling, continued by P-2026-11-06-0310
Lane: full (parser, printer, Syntax form; tests)
Depends: P-2026-11-06-0147 and P-2026-11-06-0215 (the prefix in the core, on this branch; gap 6 of the 0147 handoff), R-TXT-51 (3), R-TXT-52 D1
Worktree: ~/jjodel-w-blocktok, branch textual-block-tokens
Request: none (lane auto, «chiudi C»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-06-0242 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

The B3b row of docs/discovery/discovery_2026-11-05_textual_block_tokens.md §5.1 (§3.2 table).

(1) The class keyword by origin, not by position, in the other readers: parser `classKeywords` (`parser.ts:705`), printer `pathKeyword` (`printer.ts:87-91`) and `classKeywords` (`printer.ts:355`), the syntax form's class-keyword location (`syntaxForm.ts:382`). Tests with a prefixed class: the repair never infers the prefix as a class keyword, a path's first segment is the keyword, the prefix tokens get their own role, a finding is located at the keyword. Also gap 6 of ~/.jjodel-lanes/P-2026-11-06-0147/handoff.md: `parser.ts:1100` prints `to close the  at` for an open-less block (error path); give it the class name.
(2) A `class.prefix` field in the Syntax form (Advanced, B0's `tokens` input, a Reset as the other token rows, the refusals of B3a at the field); the EBNF mode edits a prefix token through `literalField`/`setLiteral` for the `classPrefix` kind.
(3) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(4) App check, port corpus (copy ~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, banner and What's new suppressed), crops in ~/.jjodel-lanes/P-2026-11-06-0242/, light theme, scale 1: the prefix field in Advanced with `begin` on a named class; the Text preview `begin program P ... end program`; the EBNF mode showing the prefix island and an edit of it; a prefix shared by two root classes refused once with its reason. Stop the server.
(5) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/parser.ts, printer.ts, syntaxForm.ts, ui/SyntaxForm.tsx (only if the field needs it), __tests__/blockTokens.test.ts. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_block_tokens.md §3.2, §5; docs/decisions.md R-TXT-51, R-TXT-52.
