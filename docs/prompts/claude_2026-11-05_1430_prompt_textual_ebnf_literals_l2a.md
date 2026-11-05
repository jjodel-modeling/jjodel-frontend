# Textual syntax, editable EBNF literals step 2, lane L2a: style token overrides (pure)

Prompt-ID: P-2026-11-05-1430
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (the syntax record, the style options, the style check; no UI)
Depends: P-2026-11-05-0906 (L1a merged), P-2026-11-05-1413 (C3b merged, 45fcd7233), R-TXT-48 (2), R-TXT-49 D9 D10 D11 D12
Worktree: ~/jjodel-w-ebnflit2, branch textual-ebnf-literals-step2, from 8565e3e84 (own node_modules from npm ci)
Request: none (lane auto, Alfonso 07:38, 09:22, 13:55)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 8565e3e84 and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no new dependency. Every reply opens with [P-2026-11-05-1430 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Read docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §4 and the L2a row of §5.1 once, then code. Each item: test red first, its own commit (RC-51). Grep every new exported name first. The exported union `StyleRule` gains the member `style-tokens`: this is a declared change of an exported type, allowed by this prompt.

## COSA

The L2a row of the report §5.1: (1) annotations.ts: the optional token keys of `style` (blockOpen, blockClose, assign, terminator, list.open, list.separator, list.close as whole arrays), their validation in `resolveAnnotations`, `withStyleOptions` merging `list` key by key and recomputing `reservedNames` as the effective style's word tokens, `emptyBlock` the base's unless open or close is overridden (then open followed by close); style.ts untouched. (2) syntaxRecord.ts: `withStyleBase` drops the token keys and keeps the case and blank options (D10), `style` keys written in a fixed order; the record stays at version 1 (D12). (3) styleCheck.ts: the rule `style-tokens` (empty, whitespace, neither a word nor a run of punctuation, a `"`, a comment opener, block open equal to block close), each finding at its parameter's field id. (4) syntaxForm.ts: a `FieldId` per style parameter, `locate` of `style.<param>`, the setter; the EBNF literal origin of a style token now maps to its field (L1a left them read only). (5) One test file: C-like and Pascal overrides round-trip (print, parse, print byte-identical on the corpora), each `style-tokens` case, block `(`/`)` over a call layout (measure first whether the LL(1) check catches it, the report's open point), a name equal to a new word token quoted by the printer; a mutation bench on (1), (3), red counts in the commit body. (6) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. (7) Log entry (Notes under 500 characters; Corregge and Causa the dash), Status flip, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/annotations.ts, syntaxRecord.ts, styleCheck.ts, syntaxForm.ts, one new test file under __tests__/. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §4, §5; docs/decisions.md R-TXT-48, R-TXT-49, R-TXT-50, R-TXT-51 (block tokens per element come later, on top of this).
