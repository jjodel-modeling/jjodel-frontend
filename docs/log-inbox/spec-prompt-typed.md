# log-inbox — lane «spec-prompt-typed» (P-2026-10-31-2025)

Entries written by the SPEC §3.5 prompt-typed-form lane (front release-3-2) on branch `spec-prompt-typed`,
worktree `jjodel-w-specprompt`. Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim
and in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — docs(jjtl): SPEC §3.5 documents prompt(message, Type [, default]) (P-2026-10-31-2025)
**Prompt**: rewrite SPEC §3.5 for both prompt forms (bare name in second position is the type, any other expression the default, typed `EString`), one example each, say whether `input` shares the rule, update the grammar diagram if it shows the arguments; no code changes.
**Files touched**: `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/components/GrammarDiagram/types.ts` (8e5ee511b); this inbox, prompt file Status line
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs only; the diagram prints the EBNF string verbatim, GrammarDiagram.tsx:108)
**Notes**: Rule read in parser.ts:803-818 (JjEL path) and :1457-1473 (legacy). Both reject `prompt(message)`, so §3.5 documents `prompt(message, default)`, not `prompt(message [, default])`. `input` does not share the rule (string-literal kind). Not touched: §3.5 and §8.3 status notes saying prompt/input return null; Appendix A comment. Typecheck 0 (types.ts edited); check:docs below.
**Prompt document name**: 2026-10-31 20:25

**Ticket** (P-2026-10-31-2025): the executor drops the default of `input(message, kind, default)`: `evaluateExpressionAsync` passes `undefined` to `showInput` (executor.ts:2686-2691), so the parsed `defaultValue` never reaches the dialog.
