# Textual syntax, block tokens per element, lane B1: the core (R-TXT-51, R-TXT-52)

Prompt-ID: P-2026-11-05-1541
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (annotations, grammar derivation, parser tokenizer, style check; no UI)
Depends: P-2026-11-05-1525 (discovery report, cb6edf13e), R-TXT-51, R-TXT-52 (provisional)
Worktree: ~/jjodel-w-blocktok, branch textual-block-tokens (on the L2a tip)
Request: none (lane auto, Alfonso 15:33 «chiudi C»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 79272faf3 and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no new dependency. Every reply opens with [P-2026-11-05-1541 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Read docs/discovery/discovery_2026-11-05_textual_block_tokens.md §1, §2, §4 and the B1 row of §5 once, then code. Each item: test red first, its own commit (RC-51). Grep every new exported name first.

## COSA

The B1 row of the report §5, per R-TXT-52 D2, D4, D5, D6, D8, D9, D10: (1) annotations.ts: optional `blockOpen` and `blockClose` (token arrays) on class and containment-feature annotations, validated by `styleTokenFault`; D5 (a per-block token equal to the terminator, the assignment or a list token refused); D6 (unknown keys in a class or feature entry become a notice); D9 (per-block tokens where there is no block are an error, not applied: a line or call class, an attribute, an inline or `itemKeyword` feature); D8 (an empty side refused under free layout); a notice under Indentation, where per-block tokens are ignored. (2) concreteGrammar.ts: `block()` takes the owner's tokens, a side not given inherits the style's, `empty` derived; D4 a grouped containment applies its tokens to each group's block; the block node carries its origin per side (D10) and `nodeText` gives the new `LiteralSrc` kinds where tokens are the element's own (F3); the words join `grammar.style.reservedNames` (D2) and the case fallback's `styleWords` (concreteGrammar.ts:288-291); the punctuation joins `taken`. (3) parser.ts: `grammarPuncts` reads block tokens (F2), so per-block punctuation the style lacks reads back. (4) styleCheck.ts: per-block `style-tokens` and `block-delimiters`. (5) New test __tests__/blockTokens.test.ts: the target text of R-TXT-51 (`begin program` / `declaration is` ... `end` / `end program`, without the head prefix: `program` as a positional nameless class opened by `begin program` is a block token here if the report's probe shows it, else the class keyword plus a per-block open) prints, parses and prints byte-identical; F2's `<<` `>>` round-trip; F4's `done` as a name quoted; every refusal and notice; the EBNF origins per side; mutation bench, red counts in the commit body. (6) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. (7) Log entry (Notes under 500 characters; Corregge and Causa the dash), Status flip, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/annotations.ts, concreteGrammar.ts, parser.ts, styleCheck.ts, __tests__/blockTokens.test.ts (new). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_block_tokens.md; docs/decisions.md R-TXT-48..52.
