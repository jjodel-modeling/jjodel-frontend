# JjTL — working rules

Loaded only when working under `frontend/src/jjtl/`. Moved verbatim out of the root
`CLAUDE.md` (§12.7, §12.8) on 2026-08-05: both only apply while editing JjTL, and the
root file is always in context.

**Full reference**: `frontend/src/jjtl/SPEC.md`. Cross-language symbol ownership
(`do`, `->`, `:`, `=>`, `--`) stays in the root `CLAUDE.md` §12.6 — it governs JjEL and
JjScript too.

Moved here out of the root `CLAUDE.md` §12 on 2026-09-19 (P-2026-09-18-1930 Phase 3): the two
lines below, verbatim. The former §12.7 pointer ("the 5-file checklist ... live in
`frontend/src/jjtl/CLAUDE.md`") was dropped, not moved: it named this file, which now holds the
checklist itself.

**Full reference**: `frontend/src/jjtl/SPEC.md` — syntax and grammar, AST-bridge mappings, the execution model (incl. the 4-strategy property resolution), trace model, JjEL integration, and known bugs/gaps. Single source; not duplicated here. Only the subsections **not** in the SPEC are kept below.

**Roadmap**: `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md`

---

## MANDATORY checklist when modifying JjTL syntax

Always update all 6 files together. Never just the parser:

1. `frontend/src/jjtl/types/tokens.ts` — token types + `JJTL_KEYWORDS` map
2. `frontend/src/jjtl/lexer/lexer.ts` — tokenization (uses `JJTL_KEYWORDS`)
3. `frontend/src/jjtl/parser/parser.ts` — parsing rules
4. `frontend/src/jjtl/SPEC.md` — normative grammar (§3) and execution model (§4, §9)
5. `frontend/src/jjtl/components/GrammarDiagram/types.ts` — EBNF in `GRAMMAR_RULES`
6. `frontend/src/jjtl/components/GrammarDiagram/GrammarDiagram.tsx` — railroad diagram rendering

Paths 5 and 6 were listed as `jjtl/diagrams/…` until 2026-09-06; that directory has never
existed. Corrected against the tree. Note that `GRAMMAR_RULES` currently documents neither
`objectCreation` nor `forAllMapping` nor `valueMapping` — a rule that is absent there cannot
be "kept in sync", it has to be added, which is a change of its own.

Railroad diagrams are user-facing visual documentation and do **not** update automatically.

## Known limitations

- **`.forAll(...)` never parses, in either lambda form**: BOTH lexers lowercase before the
  keyword lookup (`jjel/lexer/lexer.ts:397-400`, `jjtl/lexer/lexer.ts:330`), so `forAll` becomes
  the FORALL token and cannot follow a `.`. Measured 2026-09-08 calling JjEL **directly**, so
  the defect is not scoped to the app path as this bullet said until then; `useJjtlParser.ts:61`
  calling `parse(tokens)` **without** `source` — the legacy expression parser, where JjEL is
  never consulted — is a second, independent reason. There is no `forAll` collection builtin
  either: the boolean quantifier is `coll.all(x => pred)`, and the lambda form `x: pred` is not
  accepted as a method argument. See
  `docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` §5.3. Open bug, not
  scoped to any current work.
- **7 test files fail at import** with `window is not defined` under `environment: 'node'`:
  `executor.ts` imports the `joiner` barrel for `U.asNumber` alone, which drags in
  monaco/jquery/sweetalert2/axios. `forall-mapping.test.ts` is among them, so nine `forall`
  tests do not run. New tests under `executor/__tests__/` work around it with
  `vi.mock('../../../joiner', ...)`, reproducing `asNumber` verbatim; the executor runs
  unstubbed. Open todo: narrow the import, or give the suite a DOM environment.
- **Source attribute in forall**: `a.name -> targetAttr` does not parse (dotted source attrs).
  Workaround: `name := a.name` (which does parse), or the conversion syntax
  `-> targetAttr : a.name`.
- **Source format**: flat array `[{className, ...}]` is more reliable than
  `{classes, instances}` (the latter has a duplicate extraction bug).
- **Pluralization heuristic**: still the fallback for a `forall` written directly in a rule
  body with no enclosing feature. The executor now prefers the one reference of the target
  class that can hold the created class, and warns naming the guess when it has to fall back.
- **Feature named like the class it holds**: `-> Column { -> Column { ... } }` cannot be told
  from a bare rule-level creation (the discriminator is `targetClass === targetAttribute`).
  It produces a warning rather than an object. See SPEC.md §12.2.

## Design decisions that read like limitations and are not

- **Nested children are resolved by the id `LValue.addObject` returns**, never by name, and
  the STEP 8/8b name pool stays `lModel.objects`. Two tables may each own a column called
  `id`. See SPEC.md §9.2.
- **Enum values travel through the executor as the literal's name**, a plain string, and are
  resolved to the `DEnumLiteral` pointer in `writeAttribute` at write-back time, with a
  warning when no literal matches. This keeps Jjodel pointers out of the executor.
  See SPEC.md §9.2.
