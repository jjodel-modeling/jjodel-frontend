# Discovery — the `.[x]` state operator and the core types `Expression` and `Action`

- **Prompt-ID**: P-2026-09-25-1445 (chat C-2026-09-25-1353), Phase 1 only, read-only on the source.
- **Prompt file**: `docs/prompts/claude_2026-09-25_1445_prompt_state_operator_discovery.md`.
- **Session**: `fd0a5efa-464a-4c5f-bf61-8421793dea7e`.
- **Tree**: `~/jjodel-sim`, branch `simulation-engine`, fast-forwarded to `1201382ac` ("docs: add prompts
  P-2026-09-25-1440 and P-2026-09-25-1445"). Every measurement below ran on that commit.
- **Executor**: Claude Code, model `claude-opus-5-5` (Opus 5.5), effort xhigh.
- **Specification**: R-SIM-17, R-SIM-18, R-SIM-19, R-SIM-30 (`docs/decisions.md:1392-1439`, `:1523-1530`),
  read whole; with R-SIM-4, -11, -13, -14, -16, -24, -31, -33 and spec §5, §9, §11.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the
real files. Tags: **[M]** measured in this phase on `1201382ac`; **[R]** read. Two broad sweeps (primitive
types across layers; reserved names and `node`) were run by read-only sub-agents; the claims taken from them
are tagged **[R, sweep]**, and the load-bearing ones were re-read by hand, tagged **[R, checked]**.

---

## 0. Answer in brief

- **A (types)** is feasible as ratified, but it is not "add two enum members": saved projects carry their own
  primitive records, so it needs the first VersionFixer step that ever adds a built-in D-object, and the
  Ecore import would bind a user class named `Action` or `Expression` to the new primitive (§3.3, R1).
- **B (operator)** is additive on the grammar: `.[`, `?.[` and `:=` are all parse errors today [M]. The
  parser, however, silently drops trailing tokens (`a b` parses as `a`, no error) [M]: a syntax check "by the
  type" means nothing without a strict entry, and lexing `:=` globally would turn today's error on `x := 1`
  into a silent `x` (§4.3).
- **The core is already shaped for actions**: `ActionOracle`, one parallel assignment, double-assignment and
  domain halts, `declared`, `stateAccess` all exist in `netStep.ts`/`netTypes.ts`; the guard oracle already
  receives `SimStateAccess` and the bridge ignores it (§5).
- **`node` does not collide** in the editor v2 IR rules (the IR evaluates no JjEL, and `STEP_RE` rejects any
  bare word): the fallback to `look` is not needed. `node` does mean "the selected graph vertex" in the
  Console, Jodie and validation contexts (§6).
- **Wave proposal**: B1 grammar and evaluator hook (pure) → A the two primitive types (migration, critical
  zone) → B2 simulator wiring of `.[x]` in guards and a pure action evaluator. **C goes to the next lane**
  (§7.4).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Adding two members to the primitive enum is enough for new and old projects | **Falsified** | new projects seed automatically (`redux/store.tsx:331-336`) [R, checked]; saved projects keep their own records and loading replaces the state (§3.2) [R, sweep]; the Ecore import throws on a missing primitive (`api/data.ts:262-267`, `Log.exDev` throws, `common/Log.ts:146-151`, `:113-119`) [R, checked] |
| H2 | `.[`, `?.[`, `:=` are free in the JjEL grammar today | **Holds** | all three are parse or lexer errors (§4.2) [M] |
| H3 | JjEL's parser rejects malformed input, so "syntax checked by the type" is `parseExpression` without errors | **Falsified** | `a b`, `a.b c`, `1 2` parse with no error to their first expression (§4.2) [M]; `parse()` never checks for EOF (`jjel/parser/parser.ts:67-77`) [R] |
| H4 | The guard path can take `SimStateAccess` without touching the core | **Holds** | `GuardOracle` already has `state: SimStateAccess` (`model/simulation/netTypes.ts:184`); `makeGuardOracle` drops it (`components/editor-v2/sim/simBridge.ts:142-146`) [R] |
| H5 | Actions need new core machinery | **Falsified** | `step()` already runs one parallel assignment through `ActionOracle` with double-assignment, undeclared-attribute and domain halts (`netStep.ts:208-260`, the assignment block at `:229-250`) [R]; only the oracle and the declarations are missing |
| H6 | `node` already means something in the editor v2 IR rules | **Falsified** | no IR file evaluates JjEL; `STEP_RE` accepts only `$feature`, `value`, `values[N]` (`viewpoint/ir/pathExpr.ts:23`) [R, checked] |
| H7 | `node` is a free name elsewhere | **Falsified** | bound to the selected vertex by `buildEvalContext` (`jjscript/executor/commands/eval.ts:333-335`) and by the classic Console (`components/editors/Console.tsx:1067`) [R, checked] |
| H8 | The critical zone is out of this lane | **Partly** | VersionFixer.tsx is in (wave A); `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx` are out (§8) |

---

## 2. Objective and files read

Objective: map R-SIM-17, -18, -19, -30 onto the code, without reopening them; say where the code makes a
ratified choice costly, as a question; propose waves with files, tests, RC-3 triggers, mutants and visual checks.

Files read by hand (full paths under `/Users/alfonso/jjodel-sim/`):

- `docs/decisions.md` (RC-3, RC-13, RC-17; R-SIM-1..37; R-J1..7; R-MK-1..9), `docs/spec/claude_spec_2026-09-13_computational_model.md`
  (header, §3.2, §5, §9, §10, §11), `docs/discovery/discovery_2026-09-08_keyword_dopo_il_punto.md` §4,
  `docs/discovery/discovery_2026-09-13_jjel_eval_context.md` §0, §8, §9, `docs/sessioni/sessione_2026-09-25.md`,
  the head of `docs/claude-code-log.md`, the `.[x]` passages of the two step 3 reports.
- `frontend/src/jjel/types/tokens.ts`, `frontend/src/jjel/lexer/lexer.ts` (whole), `frontend/src/jjel/parser/parser.ts`
  (whole), `frontend/src/jjel/parser/index.ts`, `frontend/src/jjel/types/ast.ts` (union and tail),
  `frontend/src/jjel/evaluator/evaluator.ts:1-260`, `frontend/src/jjel/evaluator/context.ts:244-345`,
  `frontend/src/jjel/SPEC.md:71-194`, `frontend/src/jjel/CLAUDE.md`, `frontend/src/jjel/autocomplete/providers/identifier.ts:33-44`.
- `frontend/src/model/simulation/guardContext.ts`, `guardEvaluator.ts`, `subsetChecker.ts`, `netTypes.ts` (whole);
  `netCompile.ts:1-120`, `:195-235`, `:320-400`; `netStep.ts:36-90`, `:170-262`; `frontend/src/model/jjelTriState.ts` (API).
- `frontend/src/components/editor-v2/sim/simBridge.ts:100-195`, `SimulationPanel.tsx:60-140`.
- `frontend/src/jjscript/executor/commands/eval.ts:318-345`, `:560-660`; `frontend/src/jjtl/parser/parser.ts:633-710`.
- `frontend/src/common/U.tsx:3313-3363`, `frontend/src/redux/store.tsx:328-337`, `frontend/src/api/data.ts:250-292`,
  `:330-366`, `:688-709`, `frontend/src/common/Log.ts:139-152`, `frontend/src/redux/selectors/selectors.ts:140-146`,
  `frontend/src/redux/VersionFixer.tsx:180-190`, `:225-235`, `:1185-1220`,
  `frontend/src/model/conformance/ConformanceValidator.ts:192-244`, `frontend/src/joiner/classes.ts:895-902`,
  `frontend/src/joiner/__tests__/dTypedElement.test.ts:130-145`, `frontend/src/model/logicWrapper/LModelElement.tsx:7694-7702`,
  `frontend/src/components/editor-v2/types.ts:25-63`, `frontend/src/components/editor-v2/nodes/rowViewAnnotations.ts:55-80`,
  `frontend/src/model/validation/validationEvaluator.ts:272-276`, `frontend/src/common/DV.tsx:1221`, `:1354`,
  `frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx:17`, `frontend/src/examples/first.ts` (primitive record).
- Sweeps (read-only sub-agents, their file:line reported in §3 and §6 as [R, sweep]): `common/Defaults.ts`,
  `common/Dummy.ts`, `components/editors/Info.tsx`, `components/editor-v2/components/InlineTypeSelect.tsx`,
  `components/editor-v2/utils/jjomTransformers.ts`, `components/editor-v2/viewpoint/ir/*`,
  `services/export/EcoreService.ts`, `services/export/JsonModelService.ts`, `jjscript/executor/commands/create.ts`,
  `set.ts`, `instance.ts`, `jjscript/types.ts`, `jjtl/types/tokens.ts`, `components/editor-v2/problems/*`,
  `model/conformance/*`, `redux/reducer/reducer.ts`, `components/topbar/SaveManager.ts`.

Absence claims are backed by the command that found nothing and a positive control on the same tool; they are
named where they occur.

---

## 3. Type map (part A)

### 3.1 The table

"RC-3" names the trigger a row fires: **CZ** critical zone, **MIG** migration, **IF** changed exported
interface. "—" none.

| Layer | file:line | What an existing primitive does | What `Expression` and `Action` need | RC-3 |
|---|---|---|---|---|
| Definition | `common/U.tsx:3322-3348` `export enum ShortAttribETypes` [R, checked] | 11 members, `EVoid`…`EDouble` | two members **after** `EDouble`: `api/data.ts:255` takes `getAllPrimitiveTypes()[1]` as EString by position [R, checked] | IF |
| Definition | `common/U.tsx:3351-3363` `ShortAttribSuperTypes` [R, checked] | a `Dictionary` keyed by every member | two entries, `[]` (no widening) | IF |
| Definition | `common/U.tsx:3615` `export enum AttribETypes`, used by `toLongEType` [R, sweep] | long `ecore:EDataType …#//X` forms | two entries; the long form never reaches an `.ecore` (they export as EString, §3.4) | IF |
| Definition | `common/Defaults.ts:28-40` list, `:73-84` static pointers [R, checked `:31`, `:75`, `:84`] | `Pointer_ESTRING` … `Pointer_EOBJECT` | two static pointers; JjScript reads `Defaults['Pointer_'+UPPER]` (`jjscript/executor/commands/create.ts:553`, `:663-676`) [R, sweep] | — |
| Seeding | `redux/store.tsx:331-336` [R, checked] | one `DClass.new(..., isPrimitive=true, ..., 'Pointer_'+UPPER)` per member, pushed to `primitiveTypes` | automatic for new projects; ids come out `Pointer_EXPRESSION`, `Pointer_ACTION` | — |
| Registry | `redux/selectors/selectors.ts:146-150` `getPrimitiveType` [R, sweep] | `idlookup['Pointer_'+UPPER]` | automatic | — |
| L-layer read | `model/logicWrapper/LModelElement.tsx:7579-7734` `LValue.get_values` [R, sweep; `:7698-7700` checked] | EString and EDate share the string branch | **required**: add both to that branch. Otherwise they fall to the reference/enum branch: `namedPointers` shows `#undefined`, `ecorePointers` calls `.ecorePointer()` on a string and throws (`:7664-7672`) [R, sweep] | — |
| L-layer write | `LModelElement.tsx:1489-1511` `set_type` name aliases (`:1493` checked) | `'estring'` → `Pointer_ESTRING` | add `'expression'`, `'action'`; otherwise the raw string is stored and `get_type` falls back to EString (`:1471`) [R, sweep] | — |
| Text-to-model | `common/Dummy.ts:389-411` (`:392` checked) | a primitive short name files the element under `attributes` | add both; otherwise `default` files them under `references` [R, sweep] | — |
| Properties, M1 value | `components/editors/Info.tsx:893-904` `Info.value` [R, sweep] | switch on `feature.type.name`, unknown → `'text'` | nothing required: a text input works | — |
| Properties, M1 value (IR) | `viewpoint/ir/useFormWidgets.ts:136-148` `widgetForPrimitive` [R, sweep] | unknown → `text` | nothing required (CZ folder: leave it) | — |
| Properties, M2 type choice | `components/editors/Info.tsx:301-319` `TypeSelect` from `validTargetOptions` (`LModelElement.tsx:1343`, `:1367-1375`, reads `state.primitiveTypes`) [R, sweep] | lists the project's primitives | automatic once seeded or migrated | — |
| Editor v2 type choice | `components/editor-v2/types.ts:27-35` `EDataType`, `:41-50` `PRIMITIVE_TYPE_LABELS` [R, checked] | 8 of the 10 primitives (no EByte, EShort) | add both labels and widen the exported `EDataType` union; the write path (`ClassNode.tsx:784-801` → `canvasToJjom.ts:652-681`) matches labels against `validTargetOptions` and needs no change [R, sweep] | IF |
| JJOM / editor v2 | `components/editor-v2/utils/jjomTransformers.ts:102`, `:142`, `:150`, `:398-423` [R, sweep] | `displayTypeLabel` passes unknown names through (`types.ts:60-63`, checked) | **nothing** (CZ file not touched) | — |
| Persistence | `components/topbar/SaveManager.ts:56` → `redux/reducer/reducer.ts:519-520` [R, sweep] | load runs `VersionFixer.update(save)` then replaces the state; seeding never runs again | a VersionFixer step that adds the two records (§3.2) | **CZ, MIG** |
| Ecore export | `services/export/EcoreService.ts:290-325` `exportAttribute`, `:697-734` `mapToEcoreType`; `:42` `includeAnnotations` [R, sweep; `:42`, `:702` checked] | `eType` from `mapToEcoreType`; **no EAnnotation is written anywhere** (`includeAnnotations` declared, never read) | emit `eType` EString plus an `<eAnnotations>` child: a new code path | — |
| Ecore import | `api/data.ts:691-709` `parseDAnnotation` (checked), `:925-926`, `:330-366` `LinkAllNamesToIDs` (checked) | annotations import as `DAnnotation('<source>/<key>=<value>')`; nothing reads them back into a type | a post-pass after type linking that turns an annotated EString attribute into the primitive; and the two new members kept **out** of the `#//<name>` map (§3.3) | — |
| Validation | `model/conformance/ConformanceValidator.ts:192-244` CHECK 3 [R, checked] | int, boolean, float/double checked on the raw stored value; EString always ok; `''` skipped; violation `type_mismatch`, severity `warning` | two branches: Expression by the strict JjEL parse, Action by the action parse (§4); reuse `type_mismatch` | — |
| Problems registry | `useConformance` → `ConformanceProblemSync.tsx:57`, `:64` → `conformanceToProblems.ts:35-64` → `registerProblem` kind `'conformance'` (`problems/registry.ts:38`) [R, sweep] | generic | nothing, if `type_mismatch` is reused | — |
| Save of a malformed value | `LModelElement.tsx:7894-7906` `setValueAtPosition` [R, sweep] | writes unchecked | nothing: R-SIM-17 "si salva comunque" already holds | — |
| JjScript `create`/`set` | `jjscript/executor/commands/create.ts:49-75` `PRIMITIVE_ATTRIBUTE_TYPES` (`:50` checked), `:85-87`; `set.ts:340-353` [R, sweep] | aliases → short name → `Defaults['Pointer_'+UPPER]` | add `'expression'`, `'action'`; without them `type Action` silently falls back to EString (`classes.ts:941`, `:978-979`) [R, sweep] | — |
| JjScript `set` on M1 | `jjscript/executor/commands/instance.ts:694-721` [R, sweep] | no per-type coercion | nothing | — |
| Primitive-id checks | `joiner/classes.ts:899` `/^Pointer_E[A-Z]+$/` (checked, pinned by `dTypedElement.test.ts:139`), `EcoreService.ts:702` `startsWith('Pointer_E')` (pinned by `ecore-io.test.ts:205`), `JsonModelService.ts:321` [R, checked] | tell built-in primitives by the `Pointer_E` prefix | `Pointer_EXPRESSION` passes by accident; `Pointer_ACTION` does not (Q3) | — |
| Classic views | `common/DV.tsx:1106-1119`, `:1695` value colours [R, sweep] | per-type colour | nothing: new types render grey. **DV.tsx not touched** (Rule 14 would demand a view migration) | — |

### 3.2 The migration (VersionFixer)

[R, sweep; `:1185-1220` checked] The highest step is `'2.227 -> 2.228'` (`redux/VersionFixer.tsx:1198`); the
comment at `:1193` earmarks **2.229** for the R-IRN-19 purge (Q5). A step is `private ['X -> Y'](s: DState): DState`,
pure, no actions, no L-proxies, idempotent, skipping the numeric `idlookup.clonedCounter`.

What the new step must do: build two `DClass` records with the shape of a saved primitive (`examples/first.ts`:
`"Pointer_ESTRING":{"className":"DClass",…,"pointedBy":[{"source":"classs"},{"source":"classs[]"},{"source":"primitiveTypes"}]…}`
[R, checked]), `isPrimitive: true` (so `autocorrect` keeps them without a `father`: `VersionFixer.tsx:186`, checked),
append the ids to `s.primitiveTypes` and `s.classs` in enum order, and survive states without those arrays
(`versionfixer_old_states.test.ts:122` runs `{idlookup:{}}`) [R, sweep].

**No precedent**: no step has ever added a built-in D-object [R, sweep]. A related latent defect, read and **not
reproduced**: `Pointer_EOBJECT` is absent from the saved examples `first.ts`, `second.ts`, `sequence.ts`,
`statechartplus_old.ts` (`grep -c` gives 0 on each, 1 on `conflictsimulation.ts`, `shapes.ts`, `statechartplus.ts`
as control) [M], and the Ecore import throws when it is missing (`api/data.ts:275-279`, `selectors.ts:144`)
[R, checked]. Candidate ticket (Q18), not this lane.

### 3.3 The import would hijack user classes named `Action` or `Expression`

[R, checked] The import builds one map of primitives keyed by `#//<shortkey>` and the bare short key
(`api/data.ts:262-272`: `replacePrimitiveMap[typeprefix + shortkey] = dClassType; // like "#//EChar"`), and user
classes by `#//<name>` (`:318`: `nameMap[typeprefix + name] = dobj;`). Resolution tries primitives first
(`:338-339`):

```
let target: DModelElement = replacePrimitiveMap[value];
if (!target) target = nameMap[value];
```

With a member named `Action`, an `.ecore` whose root package has a class `Action` referenced as `#//Action` would
link to the primitive. Not measured (it needs the enum edit). "Action" is a common metaclass name; none of the
shipped examples has one [R, sweep]. Mitigation (Q4): keep the two new members out of this loop — they never
appear as `eType` in an `.ecore`, since they export as EString plus an annotation. The same skip removes the
`exDev` throw at `:267` for an old project that has not been migrated.

### 3.4 Ecore form

R-SIM-17: "In esportazione Ecore i due tipi diventano `EString` con un'`EAnnotation` che li marca, e
l'importazione li ripristina." The import side already parses annotations (`data.ts:691-709`); the export side
writes none (`EcoreService.ts:42`). The `jjodel/` prefix is owned by `rowViewAnnotations.ts:67-70` (keys
`renderer`, `unit`, `min`, `max`, `multiline`) [R, checked]. Proposed wire form (Q14):
`<eAnnotations source="jjodel"><details key="type" value="Expression"/></eAnnotations>`, which imports as
`jjodel/type=Expression`.

---

## 4. Grammar map (part B)

### 4.1 Today

| Symbol | Lexer (`jjel/lexer/lexer.ts`) | Parser (`jjel/parser/parser.ts`) |
|---|---|---|
| `.` | `DOT`, or a number when a digit follows (`:98-108`) | postfix: `consume(IDENTIFIER, "Expected property name after '.'")`, then `MethodCall` or `MemberAccess` (`:341-363`) |
| `?.` | `QUESTION_DOT` (`:110-112`) | postfix: same with `NullSafe*` (`:364-386`) |
| `[` | `LBRACKET` (`:71`) | postfix `IndexAccess` with a full `expression()` inside (`:387-396`); in primary, an array literal (`:453-455`) |
| `:` | `COLON` (`:75`) | `forall` projection (`:662`), object literal (`:618`) |
| `=` | error unless `==` or `=>` (`:120-134`) | — |
| keywords | 18 in `JJEL_KEYWORDS` (`types/tokens.ts:106-125`), matched after lowercasing (`lexer.ts:397-400`); `true`/`false`/`null` become literals (`:403-406`) | — |

Precedence (`parser.ts:5-19`): postfix `.`, `?.`, `[]` is the tightest level (12). `parse()` (`:67-77`) returns
after one `expression()` and never checks that the tokens are exhausted.

### 4.2 Probes [M]

Script `probe_grammar.ts` in the session scratchpad, bundled with the tree's esbuild and run with node; it calls
`tokenize`, `parseExpression` and `compileGuard` of `1201382ac` unchanged.

| Input | Tokens | Parse | `compileGuard` |
|---|---|---|---|
| `a.[b]` | `IDENT DOT LBRACKET IDENT RBRACKET` | error `1:3 Expected property name after '.'` | defect `parse-error` |
| `a?.[b]` | `IDENT QUESTION_DOT LBRACKET IDENT RBRACKET` | error `1:4 Expected property name after '?.'` | defect `parse-error` |
| `x := 1` | `IDENT COLON ERROR NUMBER` | lexer error `1:4 Unexpected '='. Did you mean '==' or '=>'?` | defect `parse-error` |
| `self.target.[visits] := self.target.[visits] + 1` | `… DOT LBRACKET IDENT RBRACKET COLON ERROR …` | lexer error `1:23 Unexpected '='…` | defect |
| `node.[x] > 0`, `model.[i] == 0`, `a.[marked]`, `a.[tokens]` | `… DOT LBRACKET IDENT RBRACKET …` | error `Expected property name after '.'` | defect |
| controls `a.b`, `a[b]`, `a?.b` | as expected | `MemberAccess`, `IndexAccess`, `NullSafeMemberAccess` | no defect |
| **`a b`** | `IDENT IDENT` | **no error**, AST `Identifier a` | **no defect** |
| **`a.b c`**, **`1 2`** | | **no error**, AST of the first expression | **no defect** |
| `True`, `NULL` | `BOOLEAN(true)`, `NULL` | literals | no defect |
| `x.true`, `x.True` | `IDENT DOT BOOLEAN` | error `1:3 Expected property name after '.'` | defect |
| `x["true"]` | | `IndexAccess` with a string literal | no defect |
| `else` | `ELSE` | error `1:1 Expected expression` | defect |

Consequences:

1. **`.[`, `?.[` and `:=` are free**: no expression that parses today contains them, so giving them a meaning
   changes no accepted input.
2. **Trailing tokens are dropped in silence.** A guard `self.a > 0 self.b` evaluates `self.a > 0` today. For the
   `Expression` type the syntax check must require EOF (Q6).
3. **The `true`/`false`/`null` defect R-SIM-17 asks to cover**: the keyword lookup is case-insensitive, so
   `True`/`NULL` parse as literals and a binding or feature named `true`, `false` or `null` is silently
   unreachable; after a dot every keyword is a parse error; `x["true"]` is the escape. The syntax check inherits
   this; the tests pin the four rows above.
4. **`:=` must not become a token in expression mode.** If the lexer emitted it everywhere, `parseExpression("x := 1")`
   would return `x` with no error (consequence 2), where today it is an error. Every consumer of `parseExpression`
   (Console, Jodie, validation, JjTL, guards: `grep -rln parseExpression` lists them) would see that silence.

### 4.3 The smallest change

- **Lexer.** In `case '.'`, when the next character is `[`, emit one token `DOT_LBRACKET` (`.[` must be
  contiguous, like `?.`). In `case '?'`, after `?.`, when `[` follows, a lexer error: "`?.[` is a computed access in
  JavaScript; state is read with `x.[a]`" (R-SIM-18). In `case ':'`, `:=` becomes `ASSIGN` **only in action mode**
  (a lexer option); in expression mode the current error stays, with a message that names Actions (Q7). JjTL
  already lexes `:=` as its own `ASSIGN` (`jjtl/lexer/lexer.ts:60-62`, `jjtl/types/tokens.ts:58`) [R]; the name can
  match.
- **AST.** One node in the `JjelExpression` union: `StateAccessExpr { type: 'StateAccess'; object: JjelExpression;
  attribute: string }`. The action is **not** an expression: a separate exported type
  `JjelAction { target: StateAccessExpr; value: JjelExpression }`, so no evaluator ever sees an assignment.
- **Parser.** In `postfix()`, a third branch on `DOT_LBRACKET`: `IDENTIFIER` (the attribute), then `RBRACKET`
  ("the last segment is the attribute", R-SIM-18). Precedence unchanged: it is a postfix like `.` and `[`. Two new
  entries: a strict `parseExpression` variant that requires EOF, and `parseAction(source)` = strict target postfix
  that must end in `StateAccess` whose attribute is not `marked`/`tokens` (R-SIM-30 "mai assegnabili"), `ASSIGN`,
  strict expression, EOF.
- **Effect on the existing tests** [M]: baseline `src/jjel` 3 files, 214 tests (`ambiguous-instance` 12, `evaluator` 90,
  `parser` 112); `src/model/simulation` 7 files, 200 tests; `src/components/editor-v2/sim` 3 files, 44 tests; full suite
  4620 passed, the 9 files of §17 red at import (exit 1). No existing JjEL test uses `.[`, `?.[` or `:=`
  (`grep` over `src/jjel/__tests__`, `src/model`, `src/components/editor-v2` test files: the only `:=` hits are in
  JjTL sources and one comment at `jjel/__tests__/parser.test.ts:570`; control: the same grep finds those JjTL lines).
  The one compile-time consequence: `subsetChecker.ts` has two exhaustive `never` switches over `JjelExpression`
  (`:203-206`, `:370-373`), which will refuse to compile until they gain the `StateAccess` case — the intended
  forcing function. The evaluator's `switch` throws on an unknown type (`evaluator.ts:194-195`). No other
  exhaustive switch over the union exists outside `jjel/` (`grep` for `'IndexAccess'` outside tests hits only
  `subsetChecker.ts` and `evaluator.ts`, control `parser.ts:392`).

---

## 5. Evaluator path (part B)

### 5.1 How a guard reaches the evaluator today [R]

1. **Reset**: `startRun` (`simBridge.ts:161-190`) compiles the net, builds the JjEL globals with
   `evalContextFor` (`:113-124`, `targetMetamodelId` from the model's `instanceof`, `scopeBound: true`), freezes
   them once (`freezeSnapshot`, `guardContext.ts:112-141`: drops `data`/`node`, deep-freezes, indexes the pool
   by `id`, `model` = frozen `{ __type: 'Model', id, name }`).
2. **Compile**: `compileGuards` (`simBridge.ts:127-139`) reads each guard site's text through the `simGuard`
   pointer and calls `compileGuard` (`guardEvaluator.ts:60-81`): blank → absent (`true`); `parseExpression`;
   `checkGuardSubset`; an `error` diagnostic makes it a defect.
3. **Evaluate**: the core calls `GuardOracle(site, event, state)` (`netTypes.ts:184`, `netStep.ts:96-104`);
   `makeGuardOracle` (`simBridge.ts:142-146`) ignores `state`, builds `buildGuardContext(snapshot, {transitionId: site}, {event})`
   (`guardContext.ts:152-166`: `self`, `event`, `model` in a child scope) and runs `evaluateGuard`
   (`guardEvaluator.ts:88-113`, tri-state, path B evaluator with no builtins).

### 5.2 Where `SimStateAccess` enters

- **JjEL side**: an optional field on `EvaluationContext`, the precedent being `diagnostics` and
  `ambiguousInstances` (`context.ts:254`, `:261`), propagated by `child()` (`:330-345`) so lambdas and `forall`
  bodies see it. Its type is JjEL's own (JjEL cannot import `model/simulation`): a reader keyed by element id and
  attribute, plus one for the site's presentation. JjEL does not know `marked`/`tokens`; the simulator's adapter
  maps them to `isMarked`/`tokens` of `SimStateAccess` (Q12). Without the field, `.[x]` throws a
  `JjelEvaluationError` ("state is readable only in the simulator"), never a silent `null`: that covers the Console,
  Jodie and validation, which build contexts through `buildEvalContext`.
- **The element id**: a pool handle carries `id` and `__type: 'Object'`, which no user feature can overwrite
  (`jjscript/executor/commands/eval.ts:570-572`, `:653`) [R]; `model` carries the model id, the key of global
  attributes in σ (`netTypes.ts:35`, `:51`). A `StateAccess` whose object evaluates to anything else (a primitive, a
  collection, `null`) is a defect at run time (R-SIM-18: "un percorso che dà un primitivo o una collezione").
- **`node.[x]`** is recognised by syntax: the object is the identifier `node`, which is never evaluated as a
  variable (in the Console it would be the selected vertex). It reads `readPresentation(attr)`, which is already
  local to the site (`netStep.ts:50-57`).
- **Simulator side**: `buildGuardContext` gains an optional `state` parameter; `makeGuardOracle` passes the `state`
  the core already hands it. An undeclared attribute (`read` → `undefined`) throws, so the tri-state reports
  `exception` and the arc leaves the candidates, as spec §5.2 wants.

### 5.3 Actions: their own path, the same context

Actions cannot reuse `evaluateGuard`: the tri-state demands a boolean (`jjelTriState.ts:40-47`, `:101-103`).
They reuse the snapshot, `buildGuardContext` (with `self` = the action site) and the state hook. A new pure
module (for example `model/simulation/actionEvaluator.ts`) would: compile each `Action` value once per run
(`parseAction`), evaluate the right-hand side with diagnostics (an absent identifier or an exception is a defect;
a value that is not `boolean | number | string` is a defect), resolve the target's element (the path is over the
frozen M plus the root, so it is constant per site and event), and return `ActionOutcome` (`netTypes.ts:192-197`).
The core then does the rest: `step()` reads every right-hand side on σ before any write, halts on a double
assignment, an undeclared attribute or a value outside the domain (`netStep.ts:208-260`, the assignment block at `:229-250`). One gap the core does
not close: it takes the space from the declaration (`netStep.ts:237-245`), so `self.[p] := …` on a
**presentation** attribute would be accepted; the action evaluator must refuse a non-`node` target on a
presentation attribute and a `node` target on a semantic one (locality, R-SIM-18).

---

## 6. Reserved names and `node` (part B)

### 6.1 The lists that exist today

| List | file:line | `node` | `model` | `marked` | `tokens` | `self` | `event` | `else` |
|---|---|---|---|---|---|---|---|---|
| `JJEL_KEYWORDS` | `jjel/types/tokens.ts:106-125` [R, checked] | – | – | – | – | – | – | yes |
| SPEC keywords | `jjel/SPEC.md:73-84` [R, checked] | – | – | – | – | – | – | yes |
| Autocomplete keywords | `jjel/autocomplete/providers/keyword.ts:23-42` [R, sweep] | – | – | – | – | – | – | yes |
| Autocomplete `LEVEL_2_CONTEXT`, `RESERVED_FOR_BUILTINS` | `jjel/autocomplete/providers/identifier.ts:35-44` [R, checked] | yes ("Currently selected graph node") | – | – | – | – | – | – |
| `buildEvalContext` globals | `jjscript/executor/commands/eval.ts:122-408`, `node` at `:335` [R, checked] | yes (selected vertex) | – | – | – | – | – | – |
| JjTL keywords | `jjtl/types/tokens.ts:105-137` [R, sweep] | – | – | – | – | – | – | yes |
| JjTL executor bindings | `jjtl/executor/executor.ts:2276-2278` [R, sweep] | – | – | – | – | yes | – | – |
| JjScript `ELEMENT_TYPES` | `jjscript/types.ts:589` [R, sweep] | – | yes (command noun) | – | – | – | – | – |
| `GUARD_ROOTS` | `model/simulation/subsetChecker.ts:56` [R] | yes | yes | – | – | yes | yes | – |
| `STRIPPED_KEYS` | `model/simulation/guardContext.ts:76` [R] | yes | – | – | – | – | – | – |
| `marked`/`tokens` | doc comment only, `model/simulation/netTypes.ts:33-34` [R] | – | – | comment | comment | – | – | – |

`evaluator/context.ts` has no reserved list; its only reserved key is `__ambiguousInstances` (`:177`) [R, sweep].
No code enforces `marked`/`tokens` today. "Elenco unico" (R-SIM-18) does not exist yet: the reservations are
spread over four lists that do not import one another (Q10).

### 6.2 `node`

- **Editor v2 IR rules: no collision** (the question R-SIM-18 asks). No IR file imports the JjEL parser or
  evaluator [R, sweep]; the only IR token grammar is `STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/`
  (`viewpoint/ir/pathExpr.ts:23`, checked), which rejects any bare word; predicates (`{ op: 'marked'; path?: PathExpr }`,
  `irTypes.ts:47`, checked) have no named roots; the only reserved IR token is `container` (`irTypes.ts:552-562`)
  [R, sweep]. The editor v2 `ViewpointRenderer` binds only `React` and `data`
  (`ViewpointRenderer.tsx:17`: `new Function('React', 'data', …)`, checked). **`look` is not needed**; it is unused
  as an identifier in `frontend/src` [R, sweep].
- **Elsewhere `node` is taken**, with meanings that do not block the name:
  1. The selected graph vertex in `buildEvalContext` (`eval.ts:333-335`), hence in Jodie, the Console and
     validation rules (validation evaluates on `{...globals, ...instance.bindings, self}`, `validationEvaluator.ts:274`,
     checked: it does not strip `node`). `node.[x]` cannot be misread, because `.[` does not parse today; `node.f`
     keeps its meaning outside guards. The autocomplete description (`identifier.ts:37`) will need a second sentence.
  2. The graph element in classic JSX templates, with presentation written as `node.state = {…}`
     (`common/DV.tsx:1221`, `:1354`, checked) into `DGraphElement.state` — the very store R-SIM-18 excludes. Same
     idea, different storage; the view extension (R-SIM-4's four files, §6.4) is where the two meet.
- **`model`**: bound nowhere as a JjEL root outside the guard context; a class or instance named `model` is bound
  bare by `buildEvalContext` and hidden by the root in guards (`guardContext.ts:144-147`) [R].
- **`marked`**: the IR predicate op `marked` (`irTypes.ts:47`, `irCompile.ts:193-222`) reads `isSimActive` through
  `ReadCtx.isMarked`; `x.[marked]` will read `SimStateAccess.isMarked`. Different syntax, same notion: both must
  come from the run's marking (R-SIM-11) [R, sweep].

### 6.3 Reserved names do not belong in the lexer

Making `node` or `model` lexer keywords would break `node.name` in the Console and any metaclass or instance named
`model` (bound bare, `eval.ts:315-320`, `:372`) [R, sweep], and every keyword is unusable after a dot (§4.2).
The single list is an exported constant read by the checkers, not a keyword table (Q10).

### 6.4 The view extension (mapped, not planned)

The four files of R-SIM-4, all under `components/editor-v2/viewpoint/ir/` [R, sweep]: `pathExpr.ts` (a root step
and a `.[x]` terminal step in `ParsedPath.steps`), `irReadCtx.ts` (a state reader in `ReadCtx`, injected like
`isMarked`), `irCrossDeps.ts` (a state read has no DValue: it stays out of `crossPaths` and goes through a channel,
like `mark`), `IRNodeContent.tsx` (the consumer, re-render on the channel). Out of scope here.

---

## 7. Waves

Order proposed: **B1 → A → B2**, then C in the next lane. B1 comes first because A's syntax check for `Action`
and for an `Expression` containing `.[x]` needs B1's grammar; B1 is pure and needs no migration, A carries the
migration and the visual check, B2 wires the simulator. Each wave is a full lane by RC-3 (IF in all three, MIG and
CZ in A, more than 3 files in all three) and passes Rule 19 (more than 5 files) with a list.

### 7.1 Wave B1 — grammar, AST, evaluator hook, checker (pure)

Files: `frontend/src/jjel/types/tokens.ts` (two token types), `jjel/lexer/lexer.ts`, `jjel/types/ast.ts`
(`StateAccessExpr`, `JjelAction`), `jjel/parser/parser.ts` (+ `parser/index.ts` exports), `jjel/evaluator/context.ts`
(optional hook, `child()`), `jjel/evaluator/evaluator.ts` (`evaluateStateAccess`), a new `jjel/stateReserved.ts`
(the single list), `model/simulation/subsetChecker.ts` (the `StateAccess` case; `GUARD_ROOTS` read from the list),
`jjel/autocomplete/providers/identifier.ts` (the `node` description), `jjel/SPEC.md` (grammar, operators).
Tests: `jjel/__tests__/parser.test.ts`, `evaluator.test.ts`, `model/simulation/__tests__/subsetChecker.test.ts`.
RC-3: IF (`JjelTokenType`, `JjelExpression` union, exported class `EvaluationContext` gains an optional field).
Critical zone: none. Vitest delta: about +55. Visual check: none (optional: the Console shows the
"simulator only" error on `a.[b]`).

Mutants the tests must kill:

1. `.` followed by `[` emits `DOT` (no `DOT_LBRACKET`): `a.[b]` no longer parses.
2. The `?.[` lexer error removed: `a?.[b]` gives the generic parser message.
3. `. [` (with a space) accepted as the operator.
4. The strict entry without the EOF check: `a b` accepted.
5. `ASSIGN` lexed in expression mode: `parseExpression('x := 1')` returns `x` with no error.
6. `parseAction` accepts a target that does not end in `.[a]` (`self.x := 1`).
7. `parseAction` accepts `x.[marked] := …` or `x.[tokens] := …`.
8. `.[x]` without the hook returns `null` instead of throwing.
9. `node.[x]` evaluates `node` as a variable (with `node` bound, it reads the bound object's id).
10. `child()` does not propagate the hook: `.[x]` inside a lambda throws.
11. `subsetChecker`'s `StateAccess` case does not walk the object: `node.[x]` in a guard is not `E-NODE`.
12. The `true`/`false`/`null` pins: `True` stops being a literal, or `x.true` stops being an error.

### 7.2 Wave A — the two primitive types

Files (read in §3.1): `common/U.tsx` (three declarations), `common/Defaults.ts`, `redux/VersionFixer.tsx` (step),
`model/logicWrapper/LModelElement.tsx` (the `get_values` branch, the `set_type` aliases), `common/Dummy.ts`,
`model/conformance/ConformanceValidator.ts` (CHECK 3), `services/export/EcoreService.ts` (annotation),
`api/data.ts` (skip in the name map, import post-pass), `jjscript/executor/commands/create.ts`,
`components/editor-v2/types.ts`; plus `joiner/classes.ts:899` and `services/export/JsonModelService.ts:321` if Q3
keeps `Pointer_ACTION`. About 12 source files: RC-11-style declaration, or a split A1 (definition, migration,
L-layer, conformance, JjScript) and A2 (Ecore both ways, editor v2 labels). Tests: `redux/__tests__/versionfixer_2229_migration.test.ts`
(new), `model/conformance/__tests__/ConformanceValidator.test.ts`, `services/export/__tests__/ecore-io.test.ts`, a JjScript
`create` test, `joiner/__tests__/dTypedElement.test.ts` if the regex moves. RC-3: MIG, CZ, IF. Critical zone:
`VersionFixer.tsx`. Vitest delta: about +35. Known bench gap: `LModelElement.tsx` does not load under vitest
(joiner, Monaco, `window`), so the `get_values` branch is held by the visual check, not by a source-text test
(`CLAUDE.md` §5).

Mutants:

1. The migration step is not idempotent: a second pass appends the ids twice.
2. The records without `isPrimitive: true`: `autocorrect` deletes them (`VersionFixer.tsx:186`).
3. The step crashes on `{idlookup:{}}` (no `primitiveTypes`).
4. CHECK 3 uses the non-strict parse: `self.a self.b` is not a violation.
5. CHECK 3 flags `''`: an absent guard becomes a violation (R-SIM-17: absent is `true`).
6. CHECK 3 rejects `else` on an Expression (Q8).
7. The export writes no annotation, or `eType="…#//Expression"`: the round trip comes back EString.
8. The import post-pass skipped: the round trip comes back EString.
9. The two members left in the `#//` map: a user class `Action` in an imported `.ecore` binds to the primitive.
10. `create … type Action` falls back to EString (alias missing).

Visual check (Alfonso): (1) the M2 type dropdowns, the canvas `InlineTypeSelect` on a class node and the Info
`TypeSelect`, list Expression and Action; (2) on M1, an Expression attribute edits as text; `a +` is saved and a
conformance problem appears in the problems overlay; a well-formed value and `else` show none; (3) a project saved
before the step opens with the two types listed, and an `.ecore` import into it works; (4) export of a metamodel
with an Expression attribute, re-import, the attribute type is Expression again. Smoke: open an existing project,
views render; import Families.ecore, 8 edges Family↔Member; save, reopen, identical state plus the two records.

### 7.3 Wave B2 — the simulator reads state

Files: `model/simulation/guardContext.ts` (`buildGuardContext` with the optional state, the adapter for
`marked`/`tokens`), `model/simulation/guardEvaluator.ts` (strict parse), a new `model/simulation/actionEvaluator.ts`,
`components/editor-v2/sim/simBridge.ts` (`makeGuardOracle` passes `state`; the action oracle stays
`NO_SIM_ACTIONS` until C). Tests: `guardContext.test.ts`, `guardEvaluator.test.ts`, a new `actionEvaluator.test.ts`
(with declarations injected through `compileNet`'s `decls`, `netCompile.ts:324-326`), `simBridge.test.ts`, and the
spec example Ex1 of the step 3 report (`model.[x] := model.[x] + 1`, `[model.[x] < 2]`, `[else]`) end to end on
the pure core. RC-3: IF (optional parameter, new exports), more than 3 files. Critical zone: none. Vitest delta:
about +45.

Mutants:

1. `makeGuardOracle` still drops `state`: `p.[tokens] > 0` is a defect.
2. The adapter maps `marked` to `read()`: `x.[marked]` is a defect.
3. An undeclared attribute reads `null` instead of a defect.
4. Actions evaluated sequentially (each on the state after the previous one): `a := b`, `b := a` does not swap.
5. A non-`node` target accepted on a presentation attribute (locality).
6. A right-hand side that yields an object or a collection is accepted.
7. A target path that yields a collection or `null` is accepted.
8. An absent identifier on the right-hand side yields a `null` assignment instead of a defect.
9. `compileGuard` keeps the non-strict parse: `a b` is not a defect.

Visual check (Alfonso): a Petri net whose transition guard reads `p.[tokens] < 2` (or `p.[marked]`): the input
button and the candidate list change with the marking; a guard containing `node` shows its defect after Reset.

### 7.4 C — declarations of state attributes: the next lane

Reasons, each from the code or the ratifications: (1) **storage**: R-SIM-2 forbids a nested sub-object in the M2
bag, and a declaration is a record (metaclass, name, space, initial, domain, or an equation): flat keys encoding a
list, M2 elements or annotations are three different designs, which need their own discovery and ratification;
(2) **UI**: a fifth group on the M2 face, beside the four of R-SIM-37; (3) **action roles**: R-SIM-17's `[0..*]`
Action features on arcs, entry, exit and action nodes need keys R-SIM-32 did not name; (4) **derived attributes**
need the circularity check over `.[y]` reads, i.e. B1's AST; (5) **no need to wait for testing**: the core already
takes `decls` (`netCompile.ts:324-326`, `:356-370`) and applies them, so B2 is tested end to end without C. Until C,
the app's run moves the marking only, and guards gain `x.[marked]`/`x.[tokens]`.

---

## 8. Layer Impact Report drafts

Critical-zone files of the prompt: `VersionFixer.tsx` **touched** in A (the step). `useJjomSync.ts`, `canvasToJjom.ts`
(the type write path matches labels and needs nothing, §3.1), `jjomTransformers.ts` (type labels pass through),
`portDistribution.ts`, `handlePosition.ts` (no primitive logic, [R, sweep] with a positive control on "primitive"
in `useJjomSync.ts`), `DV.tsx` (left alone on purpose, Rule 14) — **not touched** in any wave. The folders
`editor-v2/problems/` and `viewpoint/ir/` of `CLAUDE.md` §3.1: not touched.

```
LAYER IMPACT REPORT — wave B1 (draft)
Layers touched: none of the seven. The change is in the JjEL module (lexer, parser, AST, evaluator) and in the
pure simulator checker.
  - What changes: a token, an AST node, two parse entries, an optional context field, one checker case.
  - What does NOT change: parseExpression on every input it accepts today (probes §4.2); evaluation of every
    existing node; buildEvalContext.
  - Cross-layer interaction: none. Console, Jodie, validation and JjTL see a new parse error class
    (`.[x]` without the hook throws), never a new silent value.
Smoke-test scenarios: Jodie console on `self.name`, a validation rule, a JjTL transformation: unchanged.
```

```
LAYER IMPACT REPORT — wave A (draft)
Layers touched:
  [x] D-layer — two new DClass records (seeded at init; added to saved states by the step).
  [x] L-layer — LValue.get_values string branch and set_type aliases (LModelElement.tsx).
  [ ] JjOM — nothing: jjomTransformers passes type names through.
  [x] Canvas v2-flow — the InlineTypeSelect list (types.ts labels); no node or edge logic.
  [ ] Canvas classic — nothing; DV.tsx untouched, the new types render grey.
  [ ] Sync layer — nothing.
  [x] Persistence — one VersionFixer step; no jsxString rewrite.
  - What does NOT change: every existing record and value; the type of every existing attribute; EString
    handling in the import (the two members are kept out of the name map).
  - Cross-layer interaction: the migration must run before any L read of primitiveTypes (it does: update()
    precedes LOAD, SaveManager.ts:56); the Ecore import depends on the records existing.
  - Side-effect safety: a user class named Action/Expression keeps winning on import (§3.3).
Smoke-test scenarios: open an existing project → views render; import Families.ecore → 8 edges Family↔Member;
save → reopen → identical state plus the two records; JjScript `create attribute e type Expression`.
```

```
LAYER IMPACT REPORT — wave B2 (draft)
Layers touched: none of the seven. The run-state stays outside Redux (R-SIM-1, R-SIM-13); the bridge reads the
raw lookup as today.
  - What changes: guards read σ through the hook; the action evaluator exists but is not wired.
  - What does NOT change: the IR highlight and `{op:'marked'}` (isSimActive), the panel's buttons (structural,
    R-SIM-16), the mark version rules (R-SIM-36).
Smoke-test scenarios: the six 3b scenarios on 3002 (`_tmp_sim3b_scenarios.js`) unchanged on models whose guards
do not use `.[x]`.
```

---

## 9. Risks

| # | Risk | Evidence | Where it bites |
|---|---|---|---|
| R1 | A user class `Action`/`Expression` in an imported `.ecore` binds to the new primitive | `api/data.ts:269`, `:318`, `:338-339` [R, checked]; not measured | A; Q4 |
| R2 | First migration that adds built-in D-objects; version number already earmarked | `VersionFixer.tsx:1193` [R, checked]; no precedent [R, sweep] | A; Q5 |
| R3 | Trailing tokens dropped: the syntax check and the guards accept malformed text | §4.2 [M] | B1, A, B2; Q6 |
| R4 | `:=` lexed globally makes `x := 1` a silent `x` in every consumer | §4.2 consequence 4 [M + R] | B1; Q7 |
| R5 | `node` means the selected vertex in Console, Jodie and validation | `eval.ts:335`, `identifier.ts:37`, `validationEvaluator.ts:274` [R, checked] | B1 (documentation, autocomplete) |
| R6 | A missing `get_values` branch shows `#undefined` or throws, and the L-layer cannot be benched | `LModelElement.tsx:7664-7672` [R, sweep] | A (visual check holds it) |
| R7 | `Pointer_ACTION` fails the three `Pointer_E` checks | `classes.ts:899`, `EcoreService.ts:702`, `JsonModelService.ts:321` [R, checked] | A; Q3 |
| R8 | Ecore annotation export is a new code path | `EcoreService.ts:42` [R, checked] | A |
| R9 | "A path that gives a primitive or a collection is an authoring error" needs receiver types the checker does not have | `subsetChecker.ts:28-34` [R] | B2 (runtime defect), C (static); Q15 |
| R10 | Saved projects without `Pointer_EOBJECT` would throw on `.ecore` import | §3.2 [M count + R]; not reproduced | ticket; Q18 |
| R11 | `simGuard` values typed EString keep working, but get no authoring-time check | `SimulationPanel.tsx:91-96` lists every attribute [R] | Q17 |

---

## 10. Questions for Alfonso

Each with the recommended answer and the entry it touches.

- **Q1** Wave order B1 → A → B2, C in the next lane? Recommended: yes (§7). R-SIM-17, R-SIM-18, R-SIM-19.
- **Q2** Keep the ratified form, two primitive DClasses with a migration, rather than EString plus a `jjodel/type` annotation inside the tool? Recommended: keep the ratified form; the annotation stays the Ecore form only. R-SIM-17.
- **Q3** Names `Expression`/`Action` with seed-derived ids `Pointer_EXPRESSION`/`Pointer_ACTION`, and the three `Pointer_E` prefix checks replaced by a test on the primitive set (updating the pins `dTypedElement.test.ts:139`, `ecore-io.test.ts:205`)? Recommended: yes. R-SIM-17.
- **Q4** Keep the two members out of the Ecore import's `#//<name>` map, so user classes named `Action`/`Expression` keep winning and the types come back only through the annotation? Recommended: yes. R-SIM-17.
- **Q5** VersionFixer number: this lane takes 2.229 and R-IRN-19's purge moves to the next free number when scheduled? Recommended: yes (the purge is a comment and a plan, not code). R-SIM-17, R-IRN-19.
- **Q6** A strict parse entry (EOF required) for the two types, guards and actions, with `parseExpression` unchanged for Console, Jodie, validation and JjTL, and the global fix as a ticket? Recommended: yes; guards like `a b` become defects. R-SIM-17, R-VAL-13.
- **Q7** `:=` a token only in action mode, the current error kept in expressions with a message naming Actions? Recommended: yes. R-SIM-17.
- **Q8** The Expression check accepts exactly `else` (trimmed) as well-formed, and the rejection outside guard features belongs to the STC's contextual check (C)? Recommended: yes. R-SIM-31, R-SIM-17.
- **Q9** `.[` a single contiguous token, attribute an `IDENTIFIER` only (keywords excluded, as spec §11 already asks of names)? Recommended: yes. R-SIM-18.
- **Q10** One exported list in `jjel/` (the operator, the roots `self`/`event`/`model`/`node`, the attributes `marked`/`tokens`) read by the checkers and autocomplete, and no lexer keywords? Recommended: yes. R-SIM-18, R-SIM-30.
- **Q11** Keep `node` (no collision in the IR rules), with its Console meaning documented beside it? Recommended: keep `node`. R-SIM-18.
- **Q12** The evaluator hook as an optional `EvaluationContext` field inherited by `child()`, `.[x]` throwing without it, and `marked`/`tokens` resolved by the simulator's adapter, not by JjEL? Recommended: yes. R-SIM-18, R-SIM-30, R-SIM-14.
- **Q13** A malformed Expression or Action reported as the existing `type_mismatch` at severity `warning`, as int and boolean are today? Recommended: yes (no union change in `ConformanceTypes.ts`). R-SIM-17.
- **Q14** Wire form `<eAnnotations source="jjodel"><details key="type" value="Expression"/>`, consumed on import (the DAnnotation is not kept)? Recommended: yes. R-SIM-17.
- **Q15** A target path yielding a collection or `null` is a run-time defect in B2 (resolved once per site and event over the frozen M), and the static authoring check arrives with C's typed checker? Recommended: yes. R-SIM-18.
- **Q16** C in the next lane with its own discovery (storage under R-SIM-2, M2 group, action role keys, derived attributes)? Recommended: yes (§7.4). R-SIM-19, R-SIM-17, R-SIM-32.
- **Q17** `simGuard` keeps accepting EString-typed attributes beside Expression-typed ones, with no retyping of existing metamodels? Recommended: yes. R-SIM-17, R-SIM-37.
- **Q18** The missing `Pointer_EOBJECT` in older saved projects as a ticket, outside this lane? Recommended: yes, after reproducing it. —
