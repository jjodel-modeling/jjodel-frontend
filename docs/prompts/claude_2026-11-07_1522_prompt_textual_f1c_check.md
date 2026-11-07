# Textual syntax, lane F1c: JjEL syntax check inside the islands

Prompt-ID: P-2026-11-07-1522
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (pure check in jjelIslands, markers in the Text tab, tests; app check with crops)
Depends: F1a and F1b (this branch starts from F1b's tip e5cc8bc3f, which contains F1a), R-TXT-55 (F3)
Worktree: ~/jjodel-w-textf1c, branch textual-f1c-check (from e5cc8bc3f, own node_modules)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-1522 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-07-1522/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row F1c of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decision F3 of §8.2 (R-TXT-55), designed in §4.3 «Checking»; risk R2 of §9.

(1) **`checkIslands(islands)`**, pure, in `jjelIslands.ts`: per island, `parseExpressionStrict` for an EXPRESSION attribute and `parseAction` for an ACTION one, with conformance's exemptions (blank value; `else` for an Expression). Read how conformance calls them and reuse the same entry points (no copy of the grammar). An error gives one diagnostic `{ start, end, message }` in raw text offsets: the parser's line and column converted through the value's lines and the island's `map` (F1a), and the end found by re-lexing at the error's offset (end of the offending token; the parser gives no end). A lexer error is also one diagnostic (R2: one per island). Tests in `__tests__/jjelIslands.test.ts`: a valid expression and action give nothing; blank and `else` give nothing; an error in the C-like and Pascal styles lands on the right raw span, including after an escape (`\"`, `''`, `#10`); a lexer error; a multi-line value. Mutation bench on the offset conversion and the exemptions.

(2) **Markers in the Text tab** (`ui/TextualTab.tsx`): the diagnostics as Monaco markers with their own owner (for example `jjel`, grep first), severity **warning**, source `jjel`, recomputed where the textual markers are recomputed, and never consulted by the apply path: a JjEL warning must not block or delay applying the text (F3: the model accepts a malformed value, conformance reports it). Touch only the lines that set markers; nothing else in that file.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with crops in ~/.jjodel-lanes/P-2026-11-07-1522/, reusing the probe of ~/.jjodel-lanes/P-2026-11-07-1444/ (probe.mjs, common.mjs; copy them into this lane's folder) on its own port: 1-valid (no squiggle on a correct guard), 2-error (a malformed guard: warning squiggle on the offending token, hover shows the message with source jjel), 3-pascal (same error in the Pascal style, squiggle on the same token), 4-apply (the text with the malformed guard still applies: the model value changes, no blocking message). Measure from the DOM and from Monaco's markers, not from the screenshot.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/jjelIslands.ts, __tests__/jjelIslands.test.ts, ui/TextualTab.tsx (marker lines only). Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§4.1, §4.3, §8, §9); docs/decisions.md R-TXT-55; the F1a and F1b log entries in docs/log-inbox/codegen.md.
