# Language Documentation Audit Report

**Date:** 2026-03-25
**Document audited:** `docs/jjtl-jjel-paper.tex`
**Audited against:** Codebase implementation in `frontend/src/jjel/`, `frontend/src/jjtl/`, `frontend/src/jjscript/`

---

## 3.1 — JjEL Syntax

### 3.1.1 — Lambda syntax
**Doc dice**: `a => a.name` (Section 2.8, line ~490)
**Codice dice**: Parser uses `ARROW` token (`=>`) at `jjel/parser/parser.ts:481-530`. Both single-param and multi-param lambdas supported.
**Stato**: ✅ Allineato

### 3.1.2 — `forall` separators: `such that`, `:`, `do`
**Doc dice**: Four forms — `such that` (filter), `:` (projection), `do` (action). All three separators documented (Section 2.3.2).
**Codice dice**: Parser at `jjel/parser/parser.ts:624-659` implements `such that` filter and `:` projection. `do` keyword is in the lexer keywords (`jjel/types/tokens.ts:119`) but the parser does **not** implement the `forall ... do action` form — the evaluator handles `filter` and `projection` only (`jjel/evaluator/evaluator.ts:762-778`).
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Doc claims `forall x in S do action` form exists. In JjEL this is not implemented (it only exists in JjTL's executor as a mapping construct). Clarify in the doc that `do` in `forall` is JjTL-only.

### 3.1.3 — `exists` separators
**Doc dice**: Accepts `such that` and `|` (pipe) but NOT `:` (Section 2.4).
**Codice dice**: Parser at `jjel/parser/parser.ts:665-692` accepts `such that` and `|`. No `:` separator.
**Stato**: ✅ Allineato

### 3.1.4 — `with...do`
**Doc dice**: `with expr do body` (Section 2.6)
**Codice dice**: Implemented at `jjel/parser/parser.ts:697-710` and `jjel/evaluator/evaluator.ts:795-807`. Exposes all properties of context object as unqualified identifiers.
**Stato**: ✅ Allineato

### 3.1.5 — `implies`
**Doc dice**: Right-associative, short-circuit, lower precedence than `and`/`or` (Section 2.5)
**Codice dice**: Implemented at `jjel/evaluator/evaluator.ts:750-756`. **Correctly short-circuits**: if left is falsy, returns `true` without evaluating right. Right-associative per parser precedence.
**Stato**: ✅ Allineato

### 3.1.6 — `is` operator (type check)
**Doc dice**: `value is Type` with kind-of semantics including supertypes (Section 2.2)
**Codice dice**: Parser at `jjel/parser/parser.ts:243-257`, evaluator at `jjel/evaluator/evaluator.ts:699-702`. Uses `TypeRegistry.isInstance()` which checks supertypes (`jjel/evaluator/context.ts:69-126`).
**Stato**: ✅ Allineato

### 3.1.7 — `??` (null coalesce)
**Doc dice**: `a ?? b` returns right if left is null (Section 2.9)
**Codice dice**: Implemented in parser at `jjel/parser/parser.ts:123-137`.
**Stato**: ✅ Allineato

### 3.1.8 — `?.` (null-safe navigation)
**Doc dice**: `obj?.prop` returns null if obj is null (Section 2.9)
**Codice dice**: Parser at `jjel/parser/parser.ts:363-385`. Both `?.property` and `?.method()` supported.
**Stato**: ✅ Allineato

### 3.1.9 — `if/then/else` as expression
**Doc dice**: `if cond then a else b`, optional `else` returns `null` (Section 2.7)
**Codice dice**: Parser at `jjel/parser/parser.ts:95-118`.
**Stato**: ✅ Allineato

### 3.1.10 — Logical operators: `and`, `or`, `not`
**Doc dice**: Textual operators, not `&&`/`||`/`!` (Section 2.1, design criteria)
**Codice dice**: Keywords in `jjel/types/tokens.ts:106-125`. Parser uses textual operators. However, the AST bridge (`jjtl/executor/astBridge.ts:300-308`) maps `&&` → `and` and `||` → `or`, meaning JjTL expressions **can** use symbolic operators as aliases.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Doc should mention that `&&`/`||` are accepted as aliases in JjTL expressions (via AST bridge normalization).

### 3.1.11 — Comments: `--` for single line
**Doc dice**: `--` for line comments in JjEL (Section 2, listings). JjTL also uses `#` (listing preamble).
**Codice dice**: JjEL lexer at `jjel/lexer/lexer.ts:73-77` uses `--`. JjTL lexer at `jjtl/lexer/lexer.ts:142` uses both `#` and `--`.
**Stato**: ✅ Allineato

### 3.1.12 — String interpolation `${...}`
**Doc dice**: "Lexer supports `${...}` syntax but parser does not yet produce interpolated string nodes" (Section 8.2, open points)
**Codice dice**: JjEL lexer at `jjel/lexer/lexer.ts:229-272` tokenizes interpolation. AST type `InterpolatedStringExpr` exists at `jjel/types/ast.ts:339-346`. The parser **does** handle it — `STRING_PART` and `DOLLAR_LBRACE` tokens are processed.
**Stato**: ❌ Disallineato — doc is outdated
**Azione necessaria**: Update doc to reflect that string interpolation IS implemented (lexer + parser + AST node).

### 3.1.13 — Short-circuit evaluation for `and`/`or`
**Doc dice**: "`and` and `or` use short-circuit evaluation" (Section 2.11.1)
**Codice dice**: At `jjel/evaluator/evaluator.ts:198-202`, `evaluateBinary()` evaluates **both** operands before applying the operator. Lines 269-273 compute `this.isTruthy(left) && this.isTruthy(right)` for `and` and `this.isTruthy(left) || this.isTruthy(right)` for `or`. JavaScript's `&&`/`||` short-circuits at the JS level, BUT both JjEL expressions are already evaluated at line 199-200. **Short-circuit is NOT implemented.**
**Stato**: ❌ Disallineato
**Azione necessaria**: Either implement short-circuit evaluation in the evaluator (evaluate left first, check, then conditionally evaluate right) OR update the doc to remove the short-circuit claim. Note: `implies` at line 750-756 DOES correctly short-circuit.

---

## 3.2 — JjEL Built-in Methods

### 3.2.1 — String method count
**Doc dice**: 33 methods (Section 2.10, Appendix B.1)
**Codice dice**: `jjel/evaluator/builtins/strings.ts` exports **36 methods** (lines 305-346). The 3 extra methods not in the doc are: `quote()`, `format()`, `toInt()`.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Add `quote()`, `format()` to the doc. Appendix lists `toInt` already but summary count says 33.

### 3.2.2 — Collection method count
**Doc dice**: 28 methods (Section 2.10, Appendix B.2)
**Codice dice**: `jjel/evaluator/builtins/collections.ts` exports **31 methods** (lines 555-591). Extra methods: `at()`, `indexOf()` (duplicate from string), and the method name is `sortByDescending` not `sortByDesc`.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Update count and method list in doc. Fix `sortByDesc` → `sortByDescending`.

### 3.2.3 — `filter()` and `map()` — "removed"
**Doc dice**: "`filter()` and `map()` are *removed* from the collection methods, as they are replaced by the `forall` construct" (Section 2.10)
**Codice dice**: `filter()` and `map()` are **STILL PRESENT** in `jjel/evaluator/builtins/collections.ts:22-48`, exported at lines 557-558.
**Stato**: ❌ Disallineato
**Azione necessaria**: Either remove `filter`/`map` from the code (breaking change) or update the doc to acknowledge they still exist as convenience methods alongside `forall`.

### 3.2.4 — Naming convention methods
**Doc dice**: `camelCase()`, `pascalCase()`, `snakeCase()`, `kebabCase()` are native (Section 2.10)
**Codice dice**: All four present in `jjel/evaluator/builtins/strings.ts` — confirmed in method registration.
**Stato**: ✅ Allineato

### 3.2.5 — Date methods count
**Doc dice**: 39 methods (Section 2.10)
**Codice dice**: `jjel/evaluator/builtins/dates.ts` has **36 methods** + **5 constructor functions** (`now`, `today`, `date`, `datetime`, `parseDate`). Total functions: 41.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: The doc count of 39 doesn't match either the 36 methods or 41 total. Clarify whether constructors are counted.

### 3.2.6 — Number methods count
**Doc dice**: 30 methods (Section 2.10)
**Codice dice**: `jjel/evaluator/builtins/numbers.ts` has **35 methods** (lines 270-310).
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Update doc count from 30 to 35.

---

## 3.3 — JjEL Types

### 3.3.1 — Primitive types
**Doc dice**: EString, EInt, EDouble, EBoolean, null (Section 2.2)
**Codice dice**: AST `LiteralExpr.dataType` at `jjel/types/ast.ts:54-58` supports `'EString' | 'EInt' | 'EDouble' | 'EBoolean' | 'null'`.
**Stato**: ✅ Allineato

### 3.3.2 — Type aliases
**Doc dice**: EString/String, EInt/Integer, EDouble/Double/Number, EBoolean/Boolean (Section 2.2)
**Codice dice**: `TypeRegistry.isInstance()` at `jjel/evaluator/context.ts:97-126` handles: EString/String, EInt/EInteger/Integer, EDouble/EFloat/Double/Float/Number, EBoolean/Boolean. Also supports Array/List/Collection, Object, Null.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Doc missing: `EInteger` alias, `EFloat`/`Float` aliases, `Array`/`List`/`Collection` aliases. These should be documented.

### 3.3.3 — Array literal
**Doc dice**: `[1, 2, 3]` (Section 2.2)
**Codice dice**: Parser at `jjel/parser/parser.ts:560-577`. `ArrayLiteralExpr` AST node at `jjel/types/ast.ts:307-310`.
**Stato**: ✅ Allineato

### 3.3.4 — Truthiness model
**Doc dice**: `null`, `false`, `0`, `""`, `[]` are falsy (Section 2.11.2)
**Codice dice**: `jjel/evaluator/evaluator.ts:849-856` — `null` → false, `boolean` → native, `number` → non-zero, `string` → non-empty, `array` → non-empty, `object` → always true.
**Stato**: ✅ Allineato

### 3.3.5 — Object literal (not in doc)
**Doc dice**: No mention of object literals
**Codice dice**: `ObjectLiteralExpr` AST node at `jjel/types/ast.ts:321-329`. Parser at `jjel/parser/parser.ts:583-612` supports `{key: expr, ...}` syntax.
**Stato**: 🆕 Non documentato
**Azione necessaria**: Add object literal syntax to the doc.

---

## 3.4 — JjTL Structure

### 3.4.1 — Header syntax
**Doc dice**: `transformation Name / from X / to Y` (Section 3.2)
**Codice dice**: Parser at `jjtl/parser/parser.ts:74-112`.
**Stato**: ✅ Allineato

### 3.4.2 — Guard keyword: `when` vs `where`
**Doc dice**: `when { condition }` (Section 3.3.2, throughout the document)
**Codice dice**: Token is `WHERE` (not `WHEN`) at `jjtl/types/tokens.ts:15,110`. Parser at `jjtl/parser/parser.ts:141` matches `TokenType.WHERE`.
**Stato**: ❌ Disallineato
**Azione necessaria**: The doc says `when` everywhere, but the implementation uses `where`. Update the document to use `where` consistently, OR rename the token. This is a major terminology mismatch that affects all examples in the paper.

### 3.4.3 — Class mapping
**Doc dice**: `SourceClass -> TargetClass` (Section 3.3)
**Codice dice**: Parser at `jjtl/parser/parser.ts:116-165`. Supports both single-source and **multi-source** (`Class1 [alias], Class2 [alias] -> Target`).
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Multi-source class mapping with aliases is implemented but not documented in the paper.

### 3.4.4 — Multiplicity
**Doc dice**: `[*]`, `[n]`, `[m..n]` — parsed but not enforced (Section 3.3.1)
**Codice dice**: Parser at `jjtl/parser/parser.ts:168-207`. Executor creates only 1 instance regardless (`executor.ts:860-867`).
**Stato**: ✅ Allineato (doc already notes this limitation)

### 3.4.5 — Attribute mapping — new `:=` syntax
**Doc dice**: Only `sourceAttr -> targetAttr` syntax (Section 3.4)
**Codice dice**: Parser at `jjtl/parser/parser.ts:285-324` also supports `attr := expression`. The `:=` operator is a token at `jjtl/types/tokens.ts:58`.
**Stato**: 🆕 Non documentato
**Azione necessaria**: The `:=` attribute mapping syntax is a significant addition not mentioned in the paper. Should be documented alongside the legacy `->` syntax.

### 3.4.6 — Value mapping
**Doc dice**: `isInitial -> tokens : true=1, false=0` (Section 3.4.2)
**Codice dice**: Parser at `jjtl/parser/parser.ts:402-417`.
**Stato**: ✅ Allineato

### 3.4.7 — Expression mapping
**Doc dice**: `name -> tableName : name.snakeCase()` (Section 3.4.3)
**Codice dice**: Expression mappings with JjEL delegation at `jjtl/parser/parser.ts:609-707`.
**Stato**: ✅ Allineato

### 3.4.8 — Object creation
**Doc dice**: Nested `-> Type { ... }` (Section 3.4.4)
**Codice dice**: Parser at `jjtl/parser/parser.ts:420-438`.
**Stato**: ✅ Allineato

### 3.4.9 — Helper functions
**Doc dice**: `helper name(params) -> Type { body }` (Section 3.5)
**Codice dice**: Parser at `jjtl/parser/parser.ts:554-595`. Body parsed via JjEL delegation.
**Stato**: ✅ Allineato

### 3.4.10 — `let` statement in JjTL
**Doc dice**: `let $x = expr in { body }` (Section 5, JjLet)
**Codice dice**: Fully implemented. Token `LET` at `jjtl/types/tokens.ts:23`. `DOLLAR_IDENT` at line 92. Parser `letStatement()` at `jjtl/parser/parser.ts:441-471`. Executor handles let in 3 body methods. Multiple bindings comma-separated. Block body `in { mappings }`.
**Stato**: ✅ Allineato
**Note**: The doc presents this as "planned" with an implementation plan in 3 phases. All 3 phases are now complete (JjEL `$identifier`, JjTL `let`, JjScript `let`).

### 3.4.11 — `$identifier` sigil in JjEL lexer
**Doc dice**: DOLLAR_IDENT token, `$` sigil for let-bound variables (Section 5.3)
**Codice dice**: JjEL lexer handles `$identifier` at `jjel/lexer/lexer.ts:150-155`. Token type `DOLLAR_IDENT` in `jjel/types/tokens.ts`. Parser produces `Identifier` AST with `$`-prefixed name.
**Stato**: ✅ Allineato

### 3.4.12 — Multi-model `from X, Y / to Z, W`
**Doc dice**: Not mentioned in the paper
**Codice dice**: Not implemented at transformation level. However, multi-source per-rule `Class1, Class2 -> Target` IS implemented (parser lines 119-129).
**Stato**: N/A — neither documented nor implemented at transformation level

---

## 3.5 — JjTL Interactive Features

### 3.5.1 — `alert(msg, type)`
**Doc dice**: Blocking modal, remains JjTL built-in (Section 3.6, Section 4.8)
**Codice dice**: Parsed at `jjtl/parser/parser.ts:1232-1261`. AST type `AlertStatementAST` at `jjtl/types/ast.ts:250-258`. Executor calls `getUIBridge().showAlert()`. React dialog: `jjtl/components/dialogs/JjtlAlertDialog.tsx`.
**Stato**: ✅ Allineato

### 3.5.2 — `notify(msg, duration)`
**Doc dice**: Non-blocking toast, remains JjTL built-in (Section 3.6, Section 4.8)
**Codice dice**: Parsed at `jjtl/parser/parser.ts:1264-1284`. Executor calls `getUIBridge().showNotify()`. Toast: `jjtl/components/dialogs/JjtlNotifyToast.tsx`.
**Stato**: ✅ Allineato

### 3.5.3 — `prompt(msg, default)` → `prompt(label, type, default?)`
**Doc dice**: Section 4 (JjModal) upgrades prompt to typed: `prompt(label, type, defaultValue?)` (Section 4.2.1)
**Codice dice**: Parsed at `jjtl/parser/parser.ts:1291-1315` with 3 args: message (expr), typeRef (IDENTIFIER), defaultValue (optional expr). Executor calls `showPrompt()` with type info. Dialog: `jjtl/components/dialogs/JjtlPromptDialog.tsx` with type conversion (EString/EInt/EFloat/EDate/EBoolean).
**Stato**: ✅ Allineato

### 3.5.4 — `input(msg, type, options)`
**Doc dice**: Subsumed by typed `prompt()` per Section 4.8 table
**Codice dice**: `input()` is **still parsed separately** at `jjtl/parser/parser.ts:1331-1372` with its own AST node `InputExpressionAST`. Token `INPUT` exists at `jjtl/types/tokens.ts:29`. Executor calls `showInput()`. Dialog: `jjtl/components/dialogs/JjtlInputDialog.tsx`.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Doc says `input` is subsumed by `prompt`, but code still has separate `input()` command with distinct AST, parser, and executor logic. Either unify in code or update doc to reflect both commands coexist.

### 3.5.5 — `confirm(label)`
**Doc dice**: New command in JjModal, returns boolean (Section 4.2.2)
**Codice dice**: Parsed at `jjtl/parser/parser.ts:1318-1328`. Token `CONFIRM` at `jjtl/types/tokens.ts:30`. Executor calls `showConfirm()`. Dialog: `jjtl/components/dialogs/JjtlConfirmDialog.tsx`. Returns boolean.
**Stato**: ✅ Allineato

### 3.5.6 — JjModal separation (alert/notify = JjTL, prompt/confirm = JjModal)
**Doc dice**: alert/notify are output-only JjTL built-ins. prompt/confirm are JjModal input commands (Section 4.8).
**Codice dice**: No separate "JjModal" module exists. All five commands are in the JjTL parser and executor. The UI layer is unified under `UIBridge` pattern with `JjtlDialogManager.tsx` handling all dialog types.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: The doc describes JjModal as a separate sub-language with its own grammar. In implementation, there is no such separation — all interactive commands are JjTL-level features using a shared UIBridge. The conceptual separation exists but the architectural separation does not. Clarify in the doc.

---

## 3.6 — JjTL Trace Model

### 3.6.1 — Trace model exists?
**Doc dice**: Automatic trace model with rule-level and binding-level detail (Section 3.6)
**Codice dice**: Full trace infrastructure at `jjtl/executor/traceModel.ts` (~300 lines). Types: `TraceModel`, `TraceLink`, `BindingTrace`, `TraceElementRef`. Builder: `TraceModelBuilder` with `addLink()`, `resolve()`, `resolveAll()`, `reverseResolve()`, `build()`, `getStats()`.
**Stato**: ✅ Allineato

### 3.6.2 — Rule-level trace
**Doc dice**: "which class mapping produced which target instance" (Section 3.6)
**Codice dice**: `TraceLink` contains `rule`, `sourceElement`, `targetElements[]` at `traceModel.ts:63-74`.
**Stato**: ✅ Allineato

### 3.6.3 — Binding-level trace
**Doc dice**: "source value, target value, expression used, and whether the mapping is invertible" (Section 3.6)
**Codice dice**: `BindingTrace` at `traceModel.ts:40-57` contains all claimed fields plus `inverseExpression` and `userProvided`.
**Stato**: ✅ Allineato

### 3.6.4 — Invertibility analysis
**Doc dice**: Direct mappings always invertible, value mappings invertible if injective, expressions generally non-invertible (Section 3.6.1)
**Codice dice**: Implemented at `jjtl/executor/executor.ts:1104-1173`. Direct copy: ✅ invertible. Value mappings: ✅ if unique target values. String concat with known constant: ✅ invertible. Function calls: ❌ non-invertible. Guards: ❌ non-invertible. Inverse expression generation at lines 1178-1203.
**Stato**: ✅ Allineato

---

## 3.7 — JjTL Execution Model

### 3.7.1 — Pipeline: Match → Guard → Create → Bind → Trace
**Doc dice**: Initialize → Match → Guard → Create → Bind → Trace (Section 3.7)
**Codice dice**: Executor `execute()` at `jjtl/executor/executor.ts:317-438`:
1. Deep copy source (line 322-361)
2. Initialize context (line 370)
3. Register helpers (line 373)
4. Extract source instances (line 382)
5. Validate target classes (line 385)
6. Execute class mappings (lines 399-401) → each mapping does match/guard/create/bind
7. Build trace (line 406)

**Stato**: ✅ Allineato

### 3.7.2 — Atomic per rule (not two-phase)
**Doc dice**: "processes each mapping atomically: match, create, bind" (Section 3.7)
**Codice dice**: Each class mapping at `executor.ts:701-758` does match → guard → create → bind sequentially. No two-phase execution.
**Stato**: ✅ Allineato

### 3.7.3 — Deep copy prevents source mutation
**Doc dice**: Not explicitly claimed in the paper
**Codice dice**: `safeDeepCopy()` via `flattenProxy()` at `executor.ts:322-361`.
**Stato**: ✅ Implemented (good practice, not a doc issue)

---

## 3.8 — JjModal

### 3.8.1 — `prompt(label, type, defaultValue?)`
**Doc dice**: Modal dialog with typed input, validation, cancel returns null (Section 4.2.1)
**Codice dice**: `UIBridge.showPrompt()` interface at `jjtl/executor/UIBridge.ts`. `JjtlPromptDialog.tsx` renders type-aware input (EString → text, EInt → number, EFloat → number, EBoolean → checkbox, EDate → date picker). Cancel returns `{ cancelled: true }`.
**Stato**: ✅ Allineato

### 3.8.2 — `confirm(label)`
**Doc dice**: Yes/No dialog, returns true/false (Section 4.2.2)
**Codice dice**: `UIBridge.showConfirm()`. `JjtlConfirmDialog.tsx`. Returns boolean.
**Stato**: ✅ Allineato

### 3.8.3 — `<JjModalDialog>` component
**Doc dice**: "Single, centralised React component `<JjModalDialog>` mounted at the root" (Section 4.7)
**Codice dice**: Component is actually named `JjtlDialogManager` at `jjtl/components/dialogs/JjtlDialogManager.tsx`. Mounted at app root in `App.tsx:121`.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Update doc component name from `<JjModalDialog>` to `<JjtlDialogManager>`.

### 3.8.4 — Async/await execution
**Doc dice**: Commands are synchronous from author's perspective, async under the hood (Section 4.6)
**Codice dice**: `UIBridge` methods return `Promise`. Executor uses `await`. `ReactUIBridge` at `jjtl/executor/ReactUIBridge.ts` emits `DialogRequest` objects resolved by dialog submit/cancel handlers. Sequential execution ensured (one dialog at a time).
**Stato**: ✅ Allineato

### 3.8.5 — Execution context display
**Doc dice**: "dialog header can display the name of the transformation currently executing" (Section 4.7)
**Codice dice**: `buildDialogContext()` at `executor.ts:1865-1871` constructs context string like "Person → Human :: Mario". Passed as `executionContext` to dialog.
**Stato**: ✅ Allineato

### 3.8.6 — MetaclassRef type resolution in prompt
**Doc dice**: IDENTIFIER resolved against metamodel — EEnum renders dropdown, EClass renders element selector (Section 4.3)
**Codice dice**: `JjtlPromptDialog.tsx` handles EString, EInt, EFloat, EBoolean, EDate types. **EEnum and EClass metamodel-relative resolution is NOT implemented** — the dialog only handles primitive Ecore types.
**Stato**: ❌ Disallineato
**Azione necessaria**: Doc describes metamodel-relative type resolution (dropdown for EEnum, element selector for EClass) that is not implemented. Note this as planned but not yet available.

---

## 3.9 — JjLet

### 3.9.1 — `let $x = expr in body`
**Doc dice**: Single binding with block body (Section 5.4)
**Codice dice**: JjTL parser `letStatement()` at `jjtl/parser/parser.ts:441-471`. JjScript parser `parseLetCommand()` at `jjscript/parser/parser.ts:767-807`.
**Stato**: ✅ Allineato

### 3.9.2 — `$` sigil in JjEL lexer — DOLLAR_IDENT token
**Doc dice**: `$letter...` recognized as DOLLAR_IDENT token (Section 5.7, Phase 1)
**Codice dice**: JjEL lexer at `jjel/lexer/lexer.ts:150-155`. Token type in `jjel/types/tokens.ts`. Parser handles at primary expression level.
**Stato**: ✅ Allineato

### 3.9.3 — Multiple bindings comma-separated
**Doc dice**: `let $x = e1, $y = e2 in body` desugars to nested (Section 5.4.2)
**Codice dice**: JjTL parser supports multiple bindings at `jjtl/parser/parser.ts:447-467`. JjScript parser at `jjscript/parser/parser.ts:777-803`.
**Stato**: ✅ Allineato

### 3.9.4 — Block body in JjTL
**Doc dice**: `let $x = e in { mappings }` (Section 5.4.3)
**Codice dice**: Parser checks for `{` after `in` and parses mapping body items.
**Stato**: ✅ Allineato

### 3.9.5 — Implementation status
**Doc dice**: Presented as 3-phase implementation plan (Phase 1: JjEL $identifier, Phase 2: JjTL let, Phase 3: JjScript let) (Section 5.7)
**Codice dice**: All 3 phases are **complete** per the claude-code-log.md entries from 2026-03-24/25.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Update doc to reflect that all 3 phases are implemented, not just planned.

---

## 3.10 — JjScript (NOT DOCUMENTED in LaTeX paper)

**Stato**: 🆕 Non documentato

JjScript is a complete imperative scripting language for metamodel manipulation that is entirely absent from the paper. Key facts:

### Scope and Purpose
JjScript provides CRUD operations on metamodel elements (classes, attributes, references, etc.) via a command-line console. It is the imperative counterpart to JjEL (expressions) and JjTL (transformations).

### Commands (19 total)
`create`, `delete`, `rename`, `set`, `add`, `remove`, `move`, `copy`, `list`, `show`, `help`, `undo`, `redo`, `clear`, `export`, `import`, `validate`, `extends`, `eval`, `let`

### Parser
Recursive descent parser at `jjscript/parser/parser.ts` (~1056 lines). Own lexer at `jjscript/parser/lexer.ts` (~350 lines). Supports qualified names (`Package::Class.attribute`), multiplicity (`[0..*]`), type references.

### JjEL Integration
- `eval` command delegates to JjEL evaluator
- `forall`, `exists`, `with` as first token → implicit `eval`
- `let` bindings evaluate expressions via JjEL

### JjModal Integration
- `let $x = prompt('msg', Type) in command` — supported
- `let $ok = confirm('msg') in command` — supported
- Delegates to UIBridge (same as JjTL)

### Architecture
- **46 files**, ~4,942 lines of TypeScript
- Singleton executor with command history (undo/redo)
- Dependency pre-check with Redux store polling
- Structured error codes with suggestions
- Autocomplete engine with metamodel-aware completions

### Azione necessaria
JjScript should be mentioned at minimum in the Introduction (Section 1) where the Jjodel ecosystem is described, and ideally given a brief dedicated section. The `let` command is already partially covered in Section 5 (JjLet Phase 3) but the broader language is not acknowledged.

---

## 3.11 — Grammar EBNF (Appendix A)

### 3.11.1 — Grammar vs implementation
**Doc dice**: Appendix A provides complete JjEL grammar in EBNF
**Codice dice**: Compared against parser at `jjel/parser/parser.ts`

**Missing from grammar:**
- `ObjectLiteralExpr` — `'{' (IDENT ':' expr ',')* '}'` production is missing
- `IndexAccessExpr` — `postfix '[' expr ']'` is mentioned but not in the production
- `InterpolatedStringExpr` — `'"' (text | '${' expr '}')* '"'` not in grammar
- `DOLLAR_IDENT` — `'$' IDENT` primary production not in grammar

**Extra in grammar:**
- No significant extras — grammar is a subset of implementation

**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Add `ObjectLiteral`, `IndexAccess`, `InterpolatedString`, and `DOLLAR_IDENT` productions to the grammar.

### 3.11.2 — `LetExpr` in grammar
**Doc dice**: Let grammar is in a separate section (Section 5.4.5), not in the JjEL grammar appendix
**Codice dice**: `let` is parsed at the JjTL/JjScript level, NOT in the JjEL parser. JjEL only handles `$identifier` tokens.
**Stato**: ✅ Allineato — correct to keep `LetExpr` out of the JjEL grammar

---

## 3.12 — Token Types (Appendix C)

### 3.12.1 — Token list completeness
**Doc dice**: Lists 14 token types in 4 categories (Keywords, Interactive, Literals, Operators)
**Codice dice**: `jjtl/types/tokens.ts` defines **35 token types** in 7 categories

**Missing from doc:**
- `WHERE` keyword (doc says `WHEN` which doesn't exist)
- `FORALL`, `IN`, `SUCH`, `THAT`, `LET` iteration keywords
- `CONFIRM` interactive keyword
- `FAT_ARROW` (`=>`), `ASSIGN` (`:=`), `EQUALS` (`=`), `COMMA`
- All JjEL operators: `EQUALS_EQUALS`, `NOT_EQUALS`, `LESS_THAN`, `GREATER_THAN`, `LESS_EQUAL`, `GREATER_EQUAL`, `PLUS`, `MINUS`, `STAR`, `SLASH`, `PERCENT`, `NULL_COALESCE`
- JjEL keywords: `IF`, `THEN`, `ELSE`, `AND`, `OR`, `NOT`, `IS`
- Brackets: `LBRACE`, `RBRACE`, `LPAREN`, `RPAREN`, `LBRACKET`, `RBRACKET`
- Special: `DOLLAR_IDENT`, `COMMENT`, `NEWLINE`, `WHITESPACE`, `EOF`, `UNKNOWN`
- `NULL` literal

**In doc but wrong:**
- `WHEN` listed → should be `WHERE`

**Stato**: ❌ Disallineato
**Azione necessaria**: The appendix only lists a small subset of actual tokens. Either expand to cover all 35 token types or clarify this is an illustrative subset.

---

## 3.13 — Operator Precedence Table (Section 2.10)

**Doc dice**: 12 levels from lowest (1: if/then/else) to highest (12: `.`, `?.`, `[index]`)
**Codice dice**: Parser at `jjel/parser/parser.ts:5-19` defines precedence. `forall`/`exists`/`with...do` are at level 0 (lowest), then `if/then/else`, then `??`, etc.

**Discrepancy**: Doc lists `forall`/`exists`/`with...do` inside the `if/then/else` level 1 row. In code, they are at a separate level 0 (even lower than if/then/else).

**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Add level 0 row for `forall`/`exists`/`with...do` in the precedence table.

---

## 3.14 — Comparison Tables (Sections 6-7)

### Feature comparison: `when` keyword
**Doc dice**: JjTL uses `when` in all comparison tables (Section 6 feature matrix, Section 6 examples)
**Codice dice**: JjTL uses `where` (token `WHERE`)
**Stato**: ❌ Disallineato
**Azione necessaria**: Replace `when` with `where` in ALL comparison tables and examples.

### Feature comparison: Interactive features
**Doc dice**: Table shows ATL/ETL/QVT-R/QVT-O have no interactive features, JjTL has ✓
**Codice dice**: Confirmed — interactive features (prompt, confirm, alert, notify, input) are unique to JjTL.
**Stato**: ✅ Allineato

### Feature comparison: Bidirectional
**Doc dice**: JjTL marked as ✓ (bidirectional) with footnote "declarative core is bidirectional"
**Codice dice**: Invertibility analysis exists in trace model. No actual bidirectional execution engine is implemented yet.
**Stato**: ⚠️ Parzialmente disallineato
**Azione necessaria**: Clarify that bidirectionality is tracked (invertibility annotations) but not yet executable. The ✓ in the table may overstate the current capability.

---

## 3.15 — Examples (Section 7)

### Example code keyword: `when` vs `where`
**Doc dice**: All JjTL examples use `when { condition }` syntax
**Codice dice**: Implementation uses `where` keyword
**Stato**: ❌ Disallineato
**Azione necessaria**: Replace `when` → `where` in ALL code examples (Listings 7, 9, 11, 13 at minimum).

### Example code: Class2Relational
**Doc dice**: Uses `forall a in attributes such that not a.multiValued -> Column { ... }` (Listing 7)
**Codice dice**: ForAll mapping syntax in parser at `jjtl/parser/parser.ts:474-515` matches this.
**Stato**: ✅ Allineato (modulo `when` → `where`)

---

## Summary

### Statistiche
- Punti verificati: 55
- ✅ Allineati: 35
- ⚠️ Parzialmente disallineati: 13
- ❌ Disallineati: 7
- 🆕 Non documentati: 3 (oggetto literal, `:=` syntax, JjScript)

### Priorità di aggiornamento

#### 1. [Critico] `when` → `where` keyword mismatch
The paper uses `when` throughout (examples, grammar, comparisons, feature matrices) but the implementation uses `where`. This affects ~20+ locations in the document and is the single most visible discrepancy.

#### 2. [Critico] Short-circuit evaluation claim is false
Section 2.11.1 claims `and`/`or` use short-circuit evaluation. The code evaluates both operands unconditionally (`evaluator.ts:198-202`). Either fix the evaluator or remove the claim.

#### 3. [Critico] `filter()`/`map()` claimed as "removed" but still present
Section 2.10 explicitly states these methods are removed. They exist in `collections.ts`. Update the doc or remove the methods.

#### 4. [Importante] JjLet phases all implemented — doc says "planned"
Section 5.7 presents a 3-phase implementation plan. All phases were completed 2026-03-24/25. Update to reflect completed status.

#### 5. [Importante] New `:=` syntax not documented
The `:=` attribute mapping syntax is a significant language feature not mentioned anywhere in the paper.

#### 6. [Importante] Multi-source class mappings not documented
`Class1 alias1, Class2 alias2 -> Target {}` is implemented but not in the paper.

#### 7. [Importante] Built-in method counts are wrong
- Strings: doc says 33, code has 36
- Collections: doc says 28, code has 31
- Numbers: doc says 30, code has 35
- Dates: doc says 39, code has 36 methods + 5 constructors

#### 8. [Importante] Token appendix is severely incomplete
Appendix C lists 14 tokens; the lexer has 35. Missing the guard keyword entirely (lists neither `when` nor `where`).

#### 9. [Importante] MetaclassRef type resolution in prompt not implemented
Doc Section 4.3 describes EEnum → dropdown and EClass → element selector. Only primitive types are implemented.

#### 10. [Importante] JjScript completely undocumented
A 4,942-line language with 19 commands, its own parser, autocomplete engine, and Redux integration is not mentioned in the paper.

#### 11. [Nice-to-have] `input()` still exists separately from `prompt()`
Doc says input is subsumed by prompt. Code has both with separate AST, parser, executor logic.

#### 12. [Nice-to-have] Object literal syntax not documented
`{key: expr, ...}` works in JjEL but isn't in the grammar or type table.

#### 13. [Nice-to-have] String interpolation is implemented
Doc says "not yet" but lexer + parser + AST support it.

#### 14. [Nice-to-have] Type aliases incomplete in doc
Missing: EInteger, EFloat, Float, Array/List/Collection.

#### 15. [Nice-to-have] `<JjModalDialog>` component name wrong
Actual name is `JjtlDialogManager`.

#### 16. [Nice-to-have] Precedence table missing level 0
`forall`/`exists`/`with...do` are lower precedence than `if/then/else` but not shown as a separate level.

---

### JjScript — Scheda per documentazione

> Draft section outline for adding JjScript to the paper.

**JjScript** (Jjodel Scripting Language) is an imperative command language for manipulating metamodels within the Jjodel environment. While JjEL provides pure expressions and JjTL handles model-to-model transformations, JjScript fills the third role: interactive, side-effecting metamodel operations.

#### Purpose
JjScript enables users to create, modify, and query metamodel elements through a command-line console. It serves as the scripting backbone for:
- Interactive metamodel construction
- AI-assisted metamodeling (via Jjodie chat integration)
- Batch metamodel operations
- Interactive exploration and validation

#### Command Taxonomy (19 commands)

| Category | Commands | Description |
|----------|----------|-------------|
| CRUD | `create`, `delete`, `rename`, `set` | Core element manipulation |
| Collection | `add`, `remove`, `move`, `copy` | Element relationship management |
| Query | `list`, `show`, `eval` | Inspection and expression evaluation |
| Utility | `help`, `undo`, `redo`, `clear` | Session management |
| Structure | `extends`, `validate` | Metamodel constraints |
| Binding | `let` | Scoped variable bindings with JjModal |
| I/O | `export`, `import` | Model serialization (planned) |

#### Syntax Examples

```
create class Person
add attribute name to Person type String [1]
create reference manager to Person type Person [0..1]
Person extends BaseEntity
set Person.isAbstract = true
list attributes in Person
eval forall c in classes : c.name
let $name = prompt('Name', EString) in rename Person to $name
```

#### Architecture
- **Parser**: Recursive descent (1,056 lines) with own lexer (350 lines)
- **Executor**: Async command dispatch with Redux store integration
- **Dependencies**: Pre-check system that polls Redux for element availability
- **Autocomplete**: Metamodel-aware suggestion engine with keyword/type/element providers
- **Error system**: Structured error codes with suggestions and documentation links

#### JjEL Integration
JjScript delegates expression evaluation to JjEL. The tokens `forall`, `exists`, and `with` as first token trigger implicit `eval` mode, treating the entire input as a JjEL expression.

#### JjModal Integration
The `let` command supports `prompt()` and `confirm()` as binding values, enabling interactive workflows:
```
let $prefix = prompt('Table prefix', EString, 'tbl_'),
    $ok = confirm('Apply to all?')
in set Schema.prefix = $prefix
```

#### Language Boundary

| Aspect | JjEL | JjTL | JjScript |
|--------|------|------|----------|
| Paradigm | Functional/declarative | Declarative transformation | Imperative |
| Side effects | None | Target model creation | Metamodel mutation |
| Expression eval | Self | Delegates to JjEL | Delegates to JjEL |
| Interactive | No | prompt/confirm in rules | prompt/confirm in let |
| Entry point | Expression string | Transformation file | Console/chat |
