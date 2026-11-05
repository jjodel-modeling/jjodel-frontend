# Textual syntax, lane B0: the token fields of the Syntax form, and style-token islands after L2a (R-TXT-52 D7)

Prompt-ID: P-2026-11-05-2220
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (the Syntax form's pure module and component; one test assertion of L1b)
Depends: P-2026-11-05-1537 (the trunk merged into this branch, 2f6c8111d; one genuine red), P-2026-11-05-1525 (B0 row of its report), R-TXT-52 D7
Worktree: ~/jjodel-w-ebnflit2, branch textual-ebnf-literals-step2 (the same tree)
Request: none (lane auto, «chiudi C»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of d01f05e5e and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no new dependency. Every reply opens with [P-2026-11-05-2220 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51).

## COSA

(1) **F5 of the block-tokens report, Corregge P-2026-11-05-1457**: the form's language-wide token fields (blockOpen, blockClose, assign, terminator, list.*) are array-valued; today an existing override shows empty and typing saves a string the record refuses. Add a `tokens` input kind in syntaxForm.ts and ui/SyntaxForm.tsx: the array shown joined by one space, the text split on blanks into the array; an empty text clears the override. Tests red first in __tests__/styleTokens.test.ts. (2) **The merge's genuine red**: __tests__/ebnfIslands.test.ts:42 asserts no style-token island; after L2a style tokens map to fields, so the EBNF mode shows them as islands (R-TXT-48 step 2). Narrow that assertion: style tokens are islands, fixed tokens and enumeration literals are not; add a test that editing a style-token island in the draft changes that parameter everywhere (one origin, linked). (3) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. (4) In the app, port corpus (copy the probe of ~/.jjodel-lanes/P-2026-11-05-1415/, banner and What's new suppressed): the Syntax form's token fields in Advanced show a C-like override (`begin end` as block tokens) and a Pascal one; an invalid token (with a space inside one token is not possible by construction: use a `"`) is refused with its reason at the field; in the EBNF mode a style-token island `{` opens, edited to `begin`, every block opener follows, Save, the Text mode prints with `begin`, one Undo restores. Crops in ~/.jjodel-lanes/P-2026-11-05-2220/, light theme, scale 1. Stop the server. (5) Log entry (Notes under 500 characters; Corregge `2026-11-05 14:57`; Causa (c); Out-of-scope changes: yes, the ebnfIslands assertion, declared here), Status flip, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/syntaxForm.ts, ui/SyntaxForm.tsx, __tests__/styleTokens.test.ts, __tests__/ebnfIslands.test.ts (the assertion and one new test). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_block_tokens.md (F5, B0 row; on branch textual-block-tokens); docs/decisions.md R-TXT-48, R-TXT-49, R-TXT-52.
