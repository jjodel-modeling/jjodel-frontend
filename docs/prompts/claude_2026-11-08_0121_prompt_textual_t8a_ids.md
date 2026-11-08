# Textual syntax, lane T8a: object ids in the text as structured comments, and the id as first evidence of the match

Prompt-ID: P-2026-11-08-0121
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (style option, printer, reader, match cascade; tests and mutation bench; no visual change)
Depends: D5 (comments by owner, merged), R-TXT-55 (F8, F9), R-TXT-18 and R-TXT-20 (styles, comments)
Worktree: ~/jjodel-w-textt8a, branch textual-t8a-ids (from the trunk tip at launch, own node_modules)
Request: Alfonso 2026-11-08 00:24 «decidi tu» (the chat chose to continue with F2, then T8)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-08-0121 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a whole gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0121/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row T8a of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decisions F8 and F9 of §8.2 (R-TXT-55), designed in §6.3 points 1 and 2; risk R6 of §9. Read §6 whole first.

(1) **Style option** in `style.ts`: ids in the text, off by default (the Text tab prints as today), on for the export of T8b. Follow how the existing style options are declared and persisted; additive, no migration.

(2) **Printer** (`printer.ts`): with the option on, a structured comment `// @id <id>` at the end of each object's head line, in the comment syntax of the style in use (C-like and Pascal at least; read how D5 prints comments). With the option off the output is byte-identical to today: a test pins it on the existing fixtures.

(3) **Reader**: a pure pass over `commentsOf` (`parser.ts`, as D1 uses it) that returns, for each object node, the id its head comment carries, if any. No grammar change, no LL(1) or EBNF change (F9). An ordinary comment that is not of that shape is not an id.

(4) **Evidence 0** in `matchObjects` (`textMatch.ts`): an id from the text pairs the object first, before span and name; an id that is not in the model falls through to the rest of the cascade; the same id on two objects pairs neither by id and adds a repeated-id warning (one, naming the id). Tests in the existing match tests (or a new `__tests__/textMatch.test.ts` if there is none): id pairs across a rename; unknown id falls back; repeated id warns and falls back; a file with no ids behaves exactly as today. Mutation bench on the evidence order and the repeated-id check.

(5) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy. No crops: nothing changes on screen with the option off (one DOM check that the Text tab prints no `@id` comment is enough, from any existing probe, or say why it is not needed).

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/style.ts, printer.ts, textMatch.ts, a reader in the textual layer (in textMatch.ts or a small new pure module; grep the name first), and their tests. Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§6, §8, §9 R6); docs/decisions.md R-TXT-55, R-TXT-18, R-TXT-20; the D1 and D5 log entries in docs/log-inbox/codegen.md.
