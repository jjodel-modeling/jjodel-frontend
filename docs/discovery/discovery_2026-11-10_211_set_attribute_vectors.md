# Discovery — #211: multiple assignment in `set` on multi-valued attributes

Date: 2026-11-10. Lane: `fix-jjscript`, HEAD `4f567dd45` before the diff.
Prompt: issue [jjodel-frontend#211](https://github.com/jjodel-modeling/jjodel-frontend/issues/211), plan ratified the same day (four decisions, §4).

## 1. The state before

| Piece | State | Where |
|---|---|---|
| `set` operators `=`, `+=`, `-=` | already parsed | `jjscript/parser/parser.ts` `parseSetCommand` |
| Array literal as a `set` value | **not parseable**: `[a, b]` lexes as `PUNCTUATION '['`, `parseValueOrQualified` fell into `parseQualifiedNameToken` and threw `Expected qualified name or identifier, found '['` | `parser.ts` `parseValueOrQualified`; `lexer.ts` `readMultiplicityOrPunctuation` |
| `ArrayLiteral` (`kind: 'array'`) | existed with toString support, never produced by the token parser | `jjscript/types.ts`; `parser/grammar.ts` `literalValueToString` |
| M2 executor | already array-ready: `convertValue` maps array elements (names → ids), `+=`/`-=` on array `oldValue` | `executor/commands/set.ts` |
| M1 attribute branch | refused `+=`/`-=` (`OPERATOR_NOT_SUPPORTED`, R-JS-13); an array would have written `null` (`literalToPrimitive` default) | `executor/commands/instance.ts` |
| M1 reference branch | full `+=`/`-=` semantics — the model mirrored here | `instance.ts`, `executor/referenceWrite.ts` |
| Reducer | whole-array plain set grows and shrinks; `'-='` removes by value (all copies); `'-='` with `undefined` is **dropped** — so the proxy `slot.values = [...]` setter cannot shrink and was not used | `redux/reducer/reducer.ts` `deepCopyButOnlyFollowingPath`; `model/AGENTS.md` §9.3; `instance.ts` `removeLinked` |
| Planner | `planSet` refused `operator !== '='` on every attribute and wrote `literalToPrimitive(array)` ⇒ `null` | `executor/effectsPlanner.ts` |

Measured, not inferred: the parse failure of `set x = [a, b]` and the drop of the valueless
`'-='` are both reproduced by the reducer/lexer code paths above; the reference branch's
write forms (`removeLinked`, `planAdd`/`planRemove`) are the committed precedent for the
by-value removal and the capacity check.

## 2. What changed

- **Parser** (`parser.ts`): `parseSetValue` — a `PUNCTUATION '['` in the `set` value position
  reads a comma-separated list of values-or-names until `']'` and builds the existing
  `ArrayLiteral`; `= []` is the empty list. `parseValueOrQualified` is untouched.
- **Type** (`types.ts`): `ArrayLiteral.values` widened `LiteralValue[]` →
  `(LiteralValue | QualifiedName)[]` (deliberate rule-11 exception, forced by the feature;
  name elements are required for M2 `superTypes = [Animal, Plant]`). Mandatory compile ripples,
  two: `grammar.ts` `literalValueToString` and `components/Jodie/consumerProposalModel.ts`
  `literalText` both render name elements by name; `grammar.test.ts` cast.
- **M1 executor** (`instance.ts`): the attribute branch reads the metaclass attribute's
  `upperBound` via the existing `isManyValued` and gains the vector forms. Writes are direct
  `SetFieldAction` on the slot: whole-array plain set (replace/append/clear) and by-value
  `'-='` (every copy) — the two reducer forms, not the proxy setter. Reads of the slot happen
  after `settlePendingWrites()`, as the reference branch does.
- **Planner** (`effectsPlanner.ts`): `planSet` mirrors the executor's refusals;
  `PlannedFeature` gains the optional `values` (rule-11-legal addition). The planner does not
  track attribute slots, so capacity/absence stay executor-side, as before.
- **Surface**: `SPEC.md` §3.4/§5.2, `help.ts` `set` section.

## 3. Semantics (ratified 2026-11-10)

| Form on `inst.attr` | multi-valued | single-valued |
|---|---|---|
| `= [a, b]` | replaces the whole vector, order as written; `= []`, `= null` clear | refused (`MULTIPLICITY_EXCEEDED`); `= a` unchanged |
| `+= c` | appends while there is room (`MULTIPLICITY_EXCEEDED` at the bound); **duplicates kept** | refused (`OPERATOR_NOT_SUPPORTED`, R-JS-13 retained) |
| `-= c` | removes **all copies** by value; absent ⇒ `NOT_SET`, no write | refused (`OPERATOR_NOT_SUPPORTED`, R-JS-13 retained) |
| element kinds | primitive literals; a name, `null` or an enum literal ⇒ `TYPE_MISMATCH` | unchanged |

All refusals decided before any write.

## 4. The four ratified decisions

1. Duplicates on `+=` are **kept** (symmetry with the reference vectors, #175).
2. `= null` on a multi-valued attribute **clears the whole vector**.
3. **R-JS-13 amended** in this lane: `+=`/`-=` enabled on multi-valued attributes with the
   table above; `OPERATOR_NOT_SUPPORTED` retained for single-valued attributes.
4. File list of the plan confirmed.

## 5. What was measured

- Bench (`vitest`, node): 125 parser tests green (7 new `set` list cases), 25 new
  `m1AttributeVectors` cases green (replace/grow/shrink/clear, append/duplicate/bounded full,
  by-value removal/all-copies/absent, every refusal, both single-valued regressions),
  `m1Operators` 25 green unchanged (the committed reference semantics and the single-valued
  attribute refusal stand), `effectsPlanner`/`effectsPlannerM2`/`planWorld`/`referenceWrite`
  green.
- `tsc --noEmit` exit 0 (zero-error baseline). `vite build` exit 0, pre-existing chunk
  warning only.
- Full suite: 12276 passed, 8 skipped; the 11 failed files are the nine documented
  monaco-import files plus `irCollapsedRender.test.ts` and `irSelectionRing.test.ts`,
  environmental (`browserType.launch: Executable doesn't exist` — the Playwright Chromium
  binary is not installed in this worktree).
- **Not measured**: the visual smoke (create a `[0..*]` attribute, run the forms in the app,
  undo, save/reopen) — it needs a manual browser session and was not run in this lane.

## 6. Sharp edges carried

- `[1]`, `[*]`, `[0]` are lexed as MULTIPLICITY, not a list: a single-element numeric array
  cannot be spelled. Documented in `SPEC.md` and the parser comment; the lexer's multiplicity
  rule feeds `create` options and was not touched.
- The M2 `+=`/`-=` degradation to `=` when `oldValue` is not an array
  (`set.ts:101-107`) is committed behavior, left as-is.
- Pre-existing, not touched, candidate ticket: `executor/commands/eval.ts:502` reads
  `multiValued` as `upperBound === -1 || upperBound === '*'`, missing numeric `upperBound > 1`
  that `isManyValued` covers.
