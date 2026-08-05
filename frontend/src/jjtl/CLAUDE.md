# JjTL — working rules

Loaded only when working under `frontend/src/jjtl/`. Moved verbatim out of the root
`CLAUDE.md` (§12.7, §12.8) on 2026-08-05: both only apply while editing JjTL, and the
root file is always in context.

**Full reference**: `frontend/src/jjtl/SPEC.md`. Cross-language symbol ownership
(`do`, `->`, `:`, `=>`, `--`) stays in the root `CLAUDE.md` §12.6 — it governs JjEL and
JjScript too.

---

## MANDATORY checklist when modifying JjTL syntax

Always update all 5 files together. Never just the parser:

1. `frontend/src/jjtl/types/tokens.ts` — token types + `JJTL_KEYWORDS` map
2. `frontend/src/jjtl/lexer/lexer.ts` — tokenization (uses `JJTL_KEYWORDS`)
3. `frontend/src/jjtl/parser/parser.ts` — parsing rules
4. `frontend/src/jjtl/diagrams/types.ts` — EBNF in `GRAMMAR_RULES`
5. `frontend/src/jjtl/diagrams/GrammarDiagram.tsx` — railroad diagram rendering

Railroad diagrams are user-facing visual documentation and do **not** update automatically.

## Known limitations

- **Source attribute in forall**: `a.name -> targetAttr` does not parse (dotted source attrs). Workaround: conversion syntax `-> targetAttr : a.name`.
- **Source format**: flat array `[{className, ...}]` is more reliable than `{classes, instances}` (the latter has a duplicate extraction bug).
- **Pluralization heuristic**: `targetClass.charAt(0).toLowerCase() + targetClass.slice(1) + 's'` — naive, needs a proper strategy.
