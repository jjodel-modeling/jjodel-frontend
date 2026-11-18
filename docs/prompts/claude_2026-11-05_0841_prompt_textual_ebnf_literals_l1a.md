# Textual syntax, editable EBNF literals, lane L1a: literal origins and the field mapping (pure)

Prompt-ID: P-2026-11-05-0841
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-05 · commit 251e4e565, 210c61ee1 · verifica visiva non applicabile
Lane: full (grammar derivation and the Syntax form's pure module; no UI)
Depends: P-2026-11-05-0815 (report complete, 50382685f), R-TXT-48, R-TXT-49 (provisional)
Worktree: ~/jjodel-w-ebnflit, branch textual-ebnf-literals (it took the trunk at 664929d03)
Request: none (lane auto, Alfonso 07:38)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no new dependency. Every reply opens with [P-2026-11-05-0841 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Each item: test red first, its own commit as soon as it is green (RC-51). Read docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §1, §3 and the L1a row of §5.1 once, then code. Grep every new exported name first.

## COSA

The L1a row of the report §5.1, per R-TXT-49 D1, D4, D5, D8, D11:
(1) concreteGrammar.ts: an optional `src` on the `kw` and `p` grammar nodes, set at each creating line the report §1 names (element origins and the style tokens through `tokens(param, ts)`); `concreteGrammarEbnfSpans` returning the EBNF text and each literal's span and origin, with `concreteGrammarEbnf` wrapping it so the text stays byte for byte the same (annotations.test.ts:293 and every existing EBNF expectation unchanged).
(2) syntaxForm.ts: an origin maps to a `FieldRef` through `contextOf`; the printed default computed by a second derivation with the field cleared; a value equal to the default is stored as cleared (D5); an empty value is the default for a class keyword, a feature keyword and a call word and is refused for a per-item keyword, a name keyword, an operator symbol and a group name (D4); a value containing `"` or whitespace, or not well formed for its field, is refused with a reason; enumeration literals and fixed tokens map to no field (D8, D11).
(3) One new test file under __tests__/: on the probe's six grammars (port corpus, BOOL, the Library model, each in C-like and Pascal; the probe is in ~/.jjodel-lanes/P-2026-11-05-0746/) the spans equal the quoted strings of the EBNF in order, every element origin maps to a field, the style origins carry their parameter; a mutation bench on the mapping and on D4/D5, red counts in the commit body.
(4) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.
(5) Log entry in docs/log-inbox/codegen.md (Notes under 500 characters; Corregge and Causa the dash), Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/concreteGrammar.ts, syntaxForm.ts, one new test file under __tests__/. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md; docs/decisions.md R-TXT-47, R-TXT-48, R-TXT-49.
