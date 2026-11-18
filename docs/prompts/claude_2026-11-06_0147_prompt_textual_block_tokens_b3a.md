# Textual syntax, lane B3a: the head prefix of a class, core

Prompt-ID: P-2026-11-06-0147
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · 2caec7308, 571675a7a, c3e06275c, then continued by P-2026-11-06-0215 (soft context ceiling) · 961f43a3f · core only, no visual check
Lane: full (core of the textual layer; tests)
Depends: P-2026-11-06-0100 (B2 and L2b on this branch), R-TXT-51 (3), R-TXT-52 D1
Worktree: ~/jjodel-w-blocktok, branch textual-block-tokens
Request: none (lane auto, «chiudi C»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-06-0147 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Each item: test red first, its own commit (RC-51, code first).

## COSA

The B3a row of docs/discovery/discovery_2026-11-05_textual_block_tokens.md §5.1, with §3 of the same report as the design (reading B: `begin program P ... end program`, a prefix `begin`, the keyword `program`, the name `P`).

(1) A `prefix` (array of tokens, same shape rules as a per-block side, validated by `styleTokenFault`) on a class annotation, resolved in annotations.ts.
(2) In concreteGrammar.ts the prefix goes before the head (`:597`) and before the name opt of a positional class, as `kw`/`p` nodes with their own origin (`{ k: 'classPrefix', cls, index }`; extend `LiteralSrc`, and meet every exhaustive switch the typecheck flags inside DOVE). Its words join the reserved names as per-block words do (D2), its punctuation joins the tokenizer and `taken`.
(3) In styleCheck.ts `headKeyword` finds the class keyword by origin (`src.k === 'class'`), not by position (§3.2), so `distinct-classes`, `case-injective`, `block-delimiters` and `call-words` stop reading the prefix. Tests: P5 of the report (prefix on a named class) prints, reads back and checks clean; P7 (the same prefix on two root classes) is refused by the LL(1) finding alone, not twice; a prefix shared by classes at different positions is no conflict.
(4) D8 reconsidered for a prefixed head: a class with a prefix may have an empty block open under free layout only if the prefix makes FIRST non-empty; otherwise refused as today. State the rule you implement in the commit body.
(5) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(6) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Smoke visivo non applicabile, core only), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/annotations.ts, concreteGrammar.ts, styleCheck.ts, __tests__/blockTokens.test.ts. If the new `LiteralSrc` kind forces a line in syntaxForm.ts (LITERAL_NAME), add only that line and declare it as out of scope. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_block_tokens.md §3, §5; docs/decisions.md R-TXT-51, R-TXT-52; B1 handoff ~/.jjodel-lanes/P-2026-11-05-2212/handoff.md.
