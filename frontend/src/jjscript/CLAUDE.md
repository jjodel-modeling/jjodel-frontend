# jjscript — Scripting Language working rules

Loaded only when working under `frontend/src/jjscript/`. Moved verbatim out of the root
`CLAUDE.md` (§13) on 2026-09-19 (P-2026-09-18-1930 Phase 3).

---

## 13. JjScript — Scripting Language

Imperative scripting for metamodel manipulation.

### 13.1 Directory structure

```
frontend/src/jjscript/
├── autocomplete/
├── components/
├── executor/         (with commands/)
├── normalizer/
├── parser/
├── recovery/
├── services/
├── __tests__/
├── index.ts
└── types.ts
```

### 13.2 Tests

Test files in `jjscript/__tests__/`: `lexer.test.ts`, `parser.test.ts`, `commands.test.ts`, `grammar.test.ts`, `context-binding.test.ts`.
