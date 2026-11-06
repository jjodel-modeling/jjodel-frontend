# Textual syntax, lanes B2 and L2b: per-block tokens and style tokens editable from the Syntax form and the EBNF mode

Prompt-ID: P-2026-11-05-2350
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · acd8e599b, then continued by P-2026-11-06-0100 (soft context ceiling) · 73e84d110, 941fc26fb, f47568f91 · app probe 10/10 pass; verifica visiva in attesa del GO (crops in ~/.jjodel-lanes/P-2026-11-06-0100/)
Lane: full (the Syntax form's pure module and component, the Text tab's picker; tests)
Depends: P-2026-11-05-2212 (B1, per-block tokens in the core, merged into the trunk), P-2026-11-05-2220 (B0, the `tokens` input kind), R-TXT-49, R-TXT-51, R-TXT-52
Worktree: ~/jjodel-w-blocktok, branch textual-block-tokens
Request: none (lane auto, «chiudi C»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-05-2350 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

B2 and L2b together, because they share the Syntax form. B2 is the B2 row of docs/discovery/discovery_2026-11-05_textual_block_tokens.md §5.1; L2b is the L2b row of docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §5 table. Target text of R-TXT-51: `begin program / declaration is ... end / end program`, now reachable without writing the record by hand.

(1) **B2, form fields.** In syntaxForm.ts, four Advanced fields for the per-block tokens: `blockOpen` and `blockClose` on a class entry and on a feature entry, using B0's `tokens` input kind. `fieldValue`, `setField`, `locate` meet them; a side left empty inherits (the field shows the inherited token as placeholder, Q1 of the block-tokens report). The refusals B1 already produces (D5, D8, D9, an abstract class) appear at the field with their reason.

(2) **B2, EBNF edit.** `literalField`, `setLiteral`, `literalDefault` for the `classBlock` and `featureBlock` kinds B1 added (today they map to no field). Editing an own per-block token in the EBNF mode changes that element's block only; editing an inherited side stays language-wide (D10 of R-TXT-52). Marks under Indentation stay not editable.

(3) **L2b, picker.** In ui/TextualTab.tsx the style picker shows `<base> (custom)` when the record holds language-wide token overrides; switching the base drops them (D10 of R-TXT-49), per-block ones survive (D3 of R-TXT-52). Style-token islands stay enabled in the EBNF mode (B0 already showed them working; keep a test).

(4) **L2b, Reset.** In ui/SyntaxForm.tsx every language-wide token row and every per-block row in Advanced gets a Reset control that clears the override (back to the base or the inherited token). Follow the existing row layout of the form: 11px labels, 8px grid, Bootstrap Icons only, no layout shift when the Reset appears (reserve its width).

(5) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

(6) **App check**, port corpus (copy ~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, banner and What's new suppressed), crops in ~/.jjodel-lanes/P-2026-11-05-2350/, light theme, scale 1:
- the picker reading `<base> (custom)` after a language-wide override, and back to `<base>` after Reset;
- a class entry in Advanced with per-block `is` / `end`, the Text preview printing that block with them and the other blocks unchanged;
- in the EBNF mode an own per-block token edited at one place changes only that element; an inherited side edited changes every block;
- a refused per-block token (D9, on a class with no block) with its reason at the field;
- the R-TXT-51 target text in the preview: `begin program`, `declaration is ... end`, `end program` (needs B3 for a head prefix: if the head cannot be reached yet, crop what the per-block tokens alone give and say so).
Stop the server.

(7) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/syntaxForm.ts, ui/SyntaxForm.tsx, ui/TextualTab.tsx, __tests__/blockTokens.test.ts, __tests__/styleTokens.test.ts. Five files. Nothing else; ask first. Before a new CSS class or identifier, grep the codebase for it.

## COME

Reuse B0's `tokens` input and the existing Advanced section; no new component file. The draft is `ui/useSyntaxDraft.ts` (D3 of R-TXT-49): read it, do not change it. If a needed change falls outside DOVE, stop with Outcome: question.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_block_tokens.md (§5, B2 row, D3, D10, Q1); docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md (§5, L2b row); docs/decisions.md R-TXT-48, R-TXT-49, R-TXT-51, R-TXT-52; B1 handoff ~/.jjodel-lanes/P-2026-11-05-2212/handoff.md (decisions 1-11).
