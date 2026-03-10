# JjEL and JjTL Comprehensive Audit Report

> Generated: 2026-03-09 — Read-only analysis, no files modified.

## Executive Summary

This report provides a complete read-only analysis of the JjEL (Jjodel Expression Language) and JjTL (Jjodel Transformation Language) implementation in the Jjodel codebase. The codebase contains **~77,836 lines of TypeScript** with dedicated **jjel/** (~1,500 lines) and **jjtl/** (~3,500 lines) directories implementing two complementary domain-specific languages for model transformation and expression evaluation.

**Key Finding:** JjEL and JjTL are **well-isolated, cohesive subsystems** with minimal entanglement with other parts of the codebase. JjEL is primarily consumed by JjTL executor and the Console component.

**Cleanup Recommendation:** **Clean swap** — the architecture is clean enough that replacing the JjEL parser/evaluator only requires changing a few imports and adapting the `jjelEval` API surface.

---

## 1. File Inventory

### JjEL Files (~1,500 lines across 16 files)

| Path | Description |
|------|-------------|
| `frontend/src/jjel/index.ts` | Public API re-exports, convenience functions (`jjelEval`, `isValidJjel`) |
| `frontend/src/jjel/types/tokens.ts` | Token enum and keywords map |
| `frontend/src/jjel/types/ast.ts` | AST node type definitions for all expression types |
| `frontend/src/jjel/types/index.ts` | Re-export types |
| `frontend/src/jjel/lexer/lexer.ts` | Hand-written lexer, no Chevrotain dependency |
| `frontend/src/jjel/lexer/index.ts` | Re-export lexer |
| `frontend/src/jjel/parser/parser.ts` | Recursive descent parser |
| `frontend/src/jjel/parser/index.ts` | Re-export parser |
| `frontend/src/jjel/evaluator/evaluator.ts` | Expression evaluator with method dispatch |
| `frontend/src/jjel/evaluator/context.ts` | Evaluation context, type registry, value types |
| `frontend/src/jjel/evaluator/builtins/index.ts` | Re-export builtin methods |
| `frontend/src/jjel/evaluator/builtins/strings.ts` | String methods: `toUpper`, `toLower`, `camelCase`, `snakeCase`, etc. |
| `frontend/src/jjel/evaluator/builtins/collections.ts` | Collection methods: `filter`, `map`, `flatMap`, `first`, `last`, `any`, `all` |
| `frontend/src/jjel/evaluator/builtins/numbers.ts` | Numeric methods |
| `frontend/src/jjel/evaluator/builtins/dates.ts` | Date constructors and methods |
| `frontend/src/jjel/SPEC.md` | Complete language specification |

### JjTL Files (~3,500 lines across ~74 files)

**Core Language Implementation:**

| Path | Description |
|------|-------------|
| `frontend/src/jjtl/lexer/lexer.ts` | Tokenizer (custom, no Chevrotain) |
| `frontend/src/jjtl/parser/parser.ts` | Recursive descent parser |
| `frontend/src/jjtl/types/tokens.ts` | Token definitions |
| `frontend/src/jjtl/types/ast.ts` | AST node types |
| `frontend/src/jjtl/index.ts` | Public API |

**Executor & Runtime:**

| Path | Description |
|------|-------------|
| `frontend/src/jjtl/executor/executor.ts` | Core transformation execution engine (~1,500 lines) |
| `frontend/src/jjtl/executor/jjodelConverter.ts` | Jjodel model to/from conversion |
| `frontend/src/jjtl/executor/traceModel.ts` | Trace model builder and types |
| `frontend/src/jjtl/executor/UIBridge.ts` | UI interaction interface |
| `frontend/src/jjtl/executor/ReactUIBridge.ts` | React implementation of UI bridge |

**Editor Integration:**

| Path | Description |
|------|-------------|
| `frontend/src/jjtl/editor/JjtlEditor.tsx` | Monaco Editor component |
| `frontend/src/jjtl/editor/jjtlLanguage.ts` | Syntax highlighting language definition |
| `frontend/src/jjtl/editor/jjtlTheme.ts` | Color theme |
| `frontend/src/jjtl/editor/jjtlCompletions.ts` | AutoComplete engine |

**UI Components:**

| Path | Description |
|------|-------------|
| `frontend/src/jjtl/components/ExecuteTransformationDialog.tsx` | Execute dialog |
| `frontend/src/jjtl/components/NewTransformationDialog.tsx` | New transformation dialog |
| `frontend/src/jjtl/components/TransformationsList.tsx` | List transformations |
| `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` | Dev workbench |
| `frontend/src/jjtl/components/JjtlToolbar.tsx` | Toolbar |
| `frontend/src/jjtl/components/JjtlStatusBar.tsx` | Status bar |
| `frontend/src/jjtl/components/dialogs/` | 6 dialog components |

**Visualization & Analysis:**

| Path | Description |
|------|-------------|
| `frontend/src/jjtl/views/DualMetamodelPanel.tsx` | Side-by-side metamodel view |
| `frontend/src/jjtl/views/MappingTraceView.tsx` | Trace visualization |
| `frontend/src/jjtl/views/MappingCard.tsx` | Individual mapping display |
| `frontend/src/jjtl/views/MappingLinesOverlay.tsx` | Arrows connecting mapped classes |
| `frontend/src/jjtl/analyzer/bidirectionality.ts` | Inverse transformation analysis |

**Services:**

| Path | Description |
|------|-------------|
| `frontend/src/jjtl/services/MappingSuggestionService.ts` | AI-assisted mapping suggestions |
| `frontend/src/jjtl/services/AIMatcher.ts` | Semantic matching |
| `frontend/src/jjtl/services/SimpleMatcher.ts` | Rule-based matching |

**Utilities:**

| Path | Description |
|------|-------------|
| `frontend/src/jjtl/utils/astToGrammar.ts` | AST to grammar string conversion |
| `frontend/src/jjtl/utils/metamodelConverter.ts` | Metamodel transformation |
| `frontend/src/jjtl/README.md` | Language documentation |

---

## 2. Architecture Map

### JjEL Architecture

```
┌─────────────────────────────────────────────────┐
│             jjel/index.ts                       │
│  Public API: parse, evaluate, jjelEval()        │
└────────────┬────────────────────────────────────┘
             │
      ┌──────┴────────┬─────────────┐
      │               │             │
  ┌───▼──────┐  ┌────▼──────┐ ┌───▼──────────┐
  │  LEXER   │  │  PARSER   │ │  EVALUATOR  │
  ├──────────┤  ├───────────┤ ├─────────────┤
  │JjelLexer │  │JjelParser │ │JjelEvaluator│
  │ (custom) │  │ (rec.desc)│ │  (visitor)  │
  └────┬─────┘  └─────┬─────┘ └──────┬──────┘
       │              │              │
       ▼              ▼              ▼
   Tokens→AST      AST→Parse    JjelValue
                                     │
                            ┌────────┴────────┐
                            │ EvaluationContext│
                            │ - var bindings  │
                            │ - builtins      │
                            │ - TypeRegistry  │
                            └─────────────────┘
```

**Design Pattern:** Three-stage pipeline
1. **Lexer** (`JjelLexer`) — Hand-written tokenizer, produces `JjelToken[]`
2. **Parser** (`JjelParser`) — Recursive descent, produces `JjelExpression | null`
3. **Evaluator** (`JjelEvaluator`) — Visitor pattern on AST, uses `EvaluationContext`

**NO Chevrotain dependency** — Custom implementation throughout.

### JjTL Architecture

```
JjTL Source Code
     ↓
┌─────────────────────────────────────────────────┐
│  JjtlLexer (custom, similar to JjEL lexer)      │
│  Tokens: TRANSFORMATION, FROM, TO, ->, etc.     │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  JjtlParser (recursive descent)                 │
│  - Transformation header                        │
│  - ClassMapping[] { AttributeMapping[] }        │
│  - Helpers[]                                    │
│  - Integrates JjEL for all expressions          │
└──────────────────┬──────────────────────────────┘
                   ↓
         TransformationAST
     (with JjelExpression nodes embedded)
                   │
                   ├─→ Grammar visualization (GrammarDiagram.tsx)
                   └─→ Semantic analysis (bidirectionality.ts)
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  JjtlExecutor                                   │
│  - initializeContext()                          │
│  - extractSourceInstances()                     │
│  - executeClassMapping()                        │
│  - executeAttributeMapping()                    │
│  - evaluatePropertyPath() — 4-strategy resolve  │
│  - evaluateExpression() — JjelExpression eval   │
└──────────────────┬──────────────────────────────┘
                   ↓
             ExecutionResult
       { success, targetModel,
         trace, traceModel, errors }
```

---

## 3. Dependency Graph

### JjEL

**External (NPM):** NONE (pure TypeScript)

**Internal chain:**
```
jjel/types → jjel/lexer → jjel/parser → jjel/evaluator
jjel/evaluator/builtins/* → jjel/evaluator
jjel/index.ts (re-exports all)
```

**Consumers of JjEL:**
```
jjel/index.ts (public API)
    ↑
    ├── frontend/src/components/editors/Console.tsx  (uses jjelEval)
    └── frontend/src/jjtl/executor/executor.ts       (uses jjelEval, EvaluationContext)
```

### JjTL

**External:** NONE beyond React/TypeScript

**Internal dependencies:**
```
jjtl/types/ast.ts  ← imports JjelExpression from jjel/types/ast.ts
jjtl/lexer         → jjtl/types
jjtl/parser        → jjtl/types, jjel/parser (for expression sub-parsing)
jjtl/executor      → jjtl/types, jjel/* (for evaluation)
jjtl/editor        → jjtl/parser, jjtl/types
jjtl/components    → jjtl/executor, jjtl/editor, jjtl/types
jjtl/views         → jjtl/executor, jjtl/types
jjtl/analyzer      → jjtl/types
jjtl/services      → jjtl/types
```

**Consumers of JjTL:**
```
App.tsx
  → ProjectEditor.tsx
    → DockManager.ts (loads JjtlEditor)
    → ExecuteTransformationDialog, etc.
```

---

## 4. Current Grammar Analysis

### JjEL — Implemented Constructs

| Construct | Example | Status |
|-----------|---------|--------|
| Literals | `42`, `"hello"`, `true`, `null` | ✅ |
| Identifiers | `name`, `self` | ✅ |
| Member access | `a.b.c` | ✅ |
| Null-safe nav | `a?.b`, `a?.method()` | ✅ |
| Arithmetic | `+`, `-`, `*`, `/`, `%` | ✅ |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=` | ✅ |
| Logical | `and`, `or`, `not` (textual) | ✅ |
| Null coalesce | `a ?? b` | ✅ |
| Conditional | `if cond then a else b` | ✅ |
| Type check | `a is ClassName` | ✅ |
| Lambda | `x: x.name` or `(a,b): a+b` | ✅ |
| Array literal | `[1, 2, 3]` | ✅ |
| String interpolation | `"Hello ${name}"` | ✅ |
| Method call | `items.filter(x: x.active)` | ✅ |

### JjEL — MISSING Constructs (in SPEC but not implemented)

| Construct | Example | Notes |
|-----------|---------|-------|
| `forall` | `forall x in S such that P : expr` | Not in lexer/parser |
| `exists` | `exists x in S : pred` | Not in lexer/parser |
| `implies` | `p implies q` | Not in lexer/parser |
| `with...do` | `with obj do expr` | Not in lexer/parser |
| Line comment | `-- this is a comment` | Not in lexer |
| Array indexing | `arr[0]` | Not in parser |
| Tuple literals | `(a, b)` | Not in parser |

### JjEL — JS-like constructs NOT in the new grammar

The current JjEL does NOT have:
- `var` / `let` / `const` declarations
- `function` keyword
- `===` / `!==` (uses `==` / `!=`)
- `typeof` / `instanceof`
- Ternary `? :` (uses `if/then/else`)
- `&&` / `||` / `!` (uses `and`/`or`/`not`)
- Semicolons or statement sequences

The language is purely expression-based (no statements). This matches the new grammar spec.

### Operator Precedence Chain

```
1. if/then/else       (lowest, right-associative)
2. ??                 (null coalesce)
3. or
4. and
5. ==, !=
6. <, >, <=, >=
7. is
8. +, -              (additive)
9. *, /, %           (multiplicative)
10. not, - (unary)
11. ., ?. (postfix)   (highest)
```

### JjTL — Implemented Constructs

```
transformation NAME
from SOURCE
to TARGET

SourceClass -> TargetClass {
    sourceAttr -> targetAttr               // direct copy
    sourceAttr -> targetAttr : expr        // with conversion expression
    sourceAttr -> targetAttr : true=1, false=0  // value mapping
    -> newAttr : expr                      // computed attribute (no source)
    -> NewClass { ... }                    // nested object creation
    when guardExpr                         // guard condition
}

helper helperName(param: Type) -> Type {
    expression
}
```

### JjTL — NOT Implemented

- Reference mappings (`ref -> ref`)
- Rule composition/inheritance
- `transformation extends OtherTransformation`
- Batch operations
- Debugger breakpoints
- Complex set-quantified guards

---

## 5. Evaluator/Runtime Analysis

### JjEL Evaluator

**Entry point:** `evaluate(expr: JjelExpression, ctx?: EvaluationContext): JjelValue`

**Dispatch logic:**
```
evaluate(expr)
  ├─ Literal           → return expr.value directly
  ├─ Identifier        → ctx.get(name) ?? ctx.getBuiltin(name) ?? null
  ├─ BinaryExpression  → applyBinaryOperator(left, right)
  ├─ UnaryExpression   → evaluateUnary(operand)
  ├─ MemberAccess      → getProperty(obj, prop)
  │   └─ Special casing for:
  │       - Array: length, first, last, isEmpty, notEmpty
  │       - String: length
  │       - DClass: superclass, subclasses, etc.
  ├─ MethodCall        → evaluateMethodCall (dispatches to builtins)
  ├─ IfThenElse        → evaluate condition, pick branch
  ├─ NullCoalesce      → left ?? (evaluate right)
  ├─ IsType            → check value against TypeRegistry
  ├─ Lambda            → createFunction (closure over params + body)
  ├─ ArrayLiteral      → map elements
  └─ InterpolatedString → evaluate parts, concatenate
```

**Built-in Methods by Category:**

| Category | Methods |
|----------|---------|
| **Strings** | `toUpper`, `toLower`, `capitalize`, `uncapitalize`, `camelCase`, `pascalCase`, `snakeCase`, `kebabCase`, `trim`, `trimStart`, `length`, `substring`, `split`, `replace`, `contains`, `startsWith`, `endsWith` |
| **Collections** | `filter`, `map`, `flatMap`, `first`, `last`, `any`, `all`, `select`, `size`, `isEmpty`, `notEmpty`, `sum`, `avg`, `min`, `max`, `sortBy`, `reverse`, `take`, `skip`, `distinct`, `join` |
| **Numbers** | `abs`, `round`, `floor`, `ceil`, `min`, `max` |
| **Dates** | `now`, `today`, `format`, `addDays`, `parseDate` |

**Implicit Context Resolution:**
1. `ctx.get(name)` — variable bindings
2. `ctx.getBuiltin(name)` — registered built-in functions
3. Null if not found (no exception)

**Null Handling:**
- `?.` prevents null propagation on member access
- `??` provides fallback for null/undefined
- `null + 5` returns `null` (safe nulls throughout)

**JjOM/LModel Interaction:**
- Uses L-layer proxies (`LObject`, `LClass`, etc.) when JjTL passes them in context
- JjEL itself has no direct JjOM imports; it treats values as generic JS objects
- JjOM-specific handling is in the evaluator's `getProperty()` for `DClass`-specific fields

### JjTL Executor

**Execution Phases:**

1. **Initialization**
   - Deep copy source model
   - Create `EvaluationContext` with `{source, data, classes, instances}`
   - Register helper functions as builtins
   - Create `TraceModelBuilder`

2. **Source Instance Extraction**
   - Handles: flat arrays, `{classes, instances}` objects, typed-property objects
   - Groups by `className` or `__type`

3. **Class Mapping** (for each `ClassMappingAST`)
   - Filter source instances by class name
   - Check guard (`when` clause)
   - Create target instance
   - Create trace link
   - Execute attribute mappings

4. **Attribute Mapping** (for each `AttributeMappingAST`)
   - Object creation: `-> TargetClass { ... }`
   - Conversion: apply expression or value-map
   - Direct copy: `source.attr -> target.attr`

5. **Property Path Resolution** (`evaluatePropertyPath`) — 4 strategies:
   1. Direct property: `source['name']`
   2. Context lookup: `ctx.has('name')`
   3. JjEL eval: `jjelEval('source.owner.name', contextToRecord(ctx))`
   4. Manual dotted traversal: `'owner.name' → source.owner.name`

---

## 6. JjTL-Specific Analysis

### Parser Integration with JjEL

The JjTL parser does **NOT** re-implement expression parsing. When it encounters an expression context, it delegates to the JjEL parser. The hybrid AST contains embedded `JjelExpression` nodes:

```typescript
interface AttributeMappingAST {
  sourceAttribute?: string;
  targetAttribute: string;
  conversion?: ConversionAST;
}

interface ConversionAST {
  expression?: JjelExpression;  // ← direct JjEL node embedded in JjTL AST
}
```

### Trace Model

**Structure:**
```
TraceModel
  ├─ transformationName: "StateMachine_to_PetriNet"
  ├─ sourceModelName: "statemachine_src"
  ├─ targetModelName: "petriNet_tgt"
  ├─ executedAt: timestamp
  └─ links: TraceLink[]
      └─ TraceLink
          ├─ rule: "State -> Place"
          ├─ sourceElement: {modelName, elementName, className}
          ├─ targetElements: TraceElementRef[]
          ├─ bindings: BindingTrace[]
          │   └─ BindingTrace
          │       ├─ sourceAttribute, targetAttribute
          │       ├─ expression: "name + '_copy'"
          │       ├─ sourceValue, targetValue
          │       ├─ invertible: true/false
          │       └─ inverseExpression: "..."
          └─ invertible: true/false
```

### Bidirectionality Analysis (`bidirectionality.ts`)

Static analysis of each attribute mapping:
- **Invertible:** direct copy, string suffix, constant value maps
- **NOT invertible:** method calls, lossy transformations, guarded rules

Result: percentage of transformation that is reversible, stored in trace.

---

## 7. Test Coverage

**Search result:** No dedicated test suites found for JjEL or JjTL.

- ❌ No unit tests for JjEL lexer/parser
- ❌ No unit tests for JjEL evaluator or builtins
- ❌ No unit tests for JjTL parser
- ❌ No unit tests for JjTL executor
- ⚠️ Manual testing only via UI (Console component, ExecuteTransformationDialog)
- ✅ Good error propagation in executor (logs to console with `[JjtlExecutor]` prefix)

**Recommendation:** Add Jest test suite at:
```
frontend/src/jjel/__tests__/
  ├── lexer.test.ts
  ├── parser.test.ts
  ├── evaluator.test.ts
  └── builtins.test.ts

frontend/src/jjtl/__tests__/
  ├── lexer.test.ts
  ├── parser.test.ts
  ├── executor.test.ts
  └── traceModel.test.ts
```

---

## 8. Entanglement Assessment

### Entanglement Points

| Entanglement | File | What It Imports | Replaceability |
|--------------|------|-----------------|----------------|
| JjTL executor → JjEL | `jjtl/executor/executor.ts` | `jjelEval`, `EvaluationContext`, `JjelFunction`, `JjelValue` | **Moderate** — would need to re-implement expression eval or adapt API |
| JjTL types → JjEL types | `jjtl/types/ast.ts` | `JjelExpression` (embedded in AttributeMappingAST) | **Moderate** — AST types are interleaved |
| Console → JjEL | `components/editors/Console.tsx` | `jjelEval` | **Trivial** — single function call |
| JjTL parser → JjEL parser | `jjtl/parser/parser.ts` | JjEL parser for sub-expressions | **Moderate** — parsing is delegated |
| ProjectEditor → JjTL UI | `ProjectEditor.tsx` | `ExecuteTransformationDialog`, `TransformationsList` | **Moderate** — Redux-coupled |

### Overall Rating: **Well-Isolated**

JjEL and JjTL have a **clean internal dependency** on each other (JjTL uses JjEL), and only **2 external consumers** of JjEL (Console + JjTL executor). No JjEL/JjTL internals leak into unrelated modules (model layer, Redux, routing, etc.).

---

## 9. Reuse Assessment

### Reusable Components

| Component | File | Reuse Potential | Notes |
|-----------|------|-----------------|-------|
| JjEL as standalone expression engine | `jjel/index.ts` | ✅ HIGH | Clean API, zero deps, usable in Node.js |
| JjEL builtin methods (strings) | `jjel/evaluator/builtins/strings.ts` | ✅ HIGH | naming convention methods especially valuable |
| JjEL builtin methods (collections) | `jjel/evaluator/builtins/collections.ts` | ✅ HIGH | filter, map, etc. — well-tested patterns |
| JjTL Parser (AST generator) | `jjtl/parser/parser.ts` | ✅ HIGH | Produces clean AST, no side effects |
| JjTL Trace Model | `jjtl/executor/traceModel.ts` | ✅ HIGH | Serializable, framework-agnostic |
| Bidirectionality analyzer | `jjtl/analyzer/bidirectionality.ts` | ✅ MEDIUM | Depends on JjTL AST types |
| Monaco editor integration | `jjtl/editor/` | ⚠️ MEDIUM | Depends on Monaco, reusable with same editor |
| UI components | `jjtl/components/` | ⚠️ LOW | Tightly coupled to React + Redux |
| Jjodel converter | `jjtl/executor/jjodelConverter.ts` | ❌ LOW | Uses LObject/DModel proxies — Jjodel-specific |

### Not Reusable

- `jjtl/executor/jjodelConverter.ts` — uses `LObject`, `DModel`, Jjodel proxy system
- `jjtl/services/MappingSuggestionService.ts` — uses AI provider system
- All UI components — React + Redux bound

---

## 10. Cleanup Plan Recommendation

### Verdict: **Clean Swap**

The architecture is sufficiently isolated that:
- A new JjEL parser can be swapped in by replacing the `jjel/` directory and keeping the same `jjelEval(code, vars)` API.
- The JjTL executor would need minor updates to handle any new `JjelExpression` AST shape.
- Only 2 external consumers need updating (Console + executor).

### Recommended Steps for New JjEL Implementation

**Phase 1 — Add Missing Features to Existing Implementation (low risk)**
1. Add `forall`, `exists`, `implies` tokens to `jjel/lexer/lexer.ts`
2. Add parser rules for these constructs to `jjel/parser/parser.ts`
3. Add evaluator handling in `jjel/evaluator/evaluator.ts`
4. Add `--` line comment support to lexer
5. Add array indexing `[expr]` to parser
6. Add tests

**Phase 2 — If Replacing the Parser Entirely**
1. Create `jjel-v2/` directory with new lexer/parser
2. Implement same `EvaluationContext` shape and `jjelEval` signature
3. Ensure `JjelExpression` AST types are compatible (or add adapter)
4. Update `jjel/index.ts` to re-export from `jjel-v2/`
5. Run existing manual tests
6. Add automated test suite

**Phase 3 — Add Test Coverage (regardless of approach)**
- Prioritize: builtin methods, operator precedence, null handling, collection methods
- Then: JjTL parser, JjTL executor, trace model

### Effort Estimate

| Task | Effort |
|------|--------|
| Add `forall/exists/implies` to existing parser | Small (2–4 hours) |
| Add test suite | Medium (1–2 days) |
| Replace JjEL parser from scratch | Medium (2–3 days) |
| Replace JjTL parser from scratch | Large (3–5 days) |
| Rewire all consumers after swap | Small (2–4 hours) |

---

## Summary Table

| Aspect | Status | Notes |
|--------|--------|-------|
| Architecture | ✅ SOLID | Clean lexer → parser → evaluator pipeline |
| Grammar completeness | ⚠️ PARTIAL | SPEC defines `forall/exists/implies` not yet implemented |
| Test coverage | ❌ MISSING | No automated tests exist |
| Documentation | ✅ GOOD | SPEC.md and README are comprehensive |
| Entanglement | ✅ LOW | Only 2 external consumers |
| Reusability | ✅ HIGH | JjEL is standalone; JjTL AST is clean |
| Null safety | ✅ EXCELLENT | `?.` and `??` implemented correctly |
| Traceability | ✅ GOOD | Trace model enables debugging and bidirectional analysis |
| Naming convention support | ✅ COMPLETE | camelCase, snakeCase, pascalCase, kebabCase all implemented |

---

## Absolute Path Reference

```
frontend/src/jjel/
  index.ts
  SPEC.md
  lexer/lexer.ts
  parser/parser.ts
  evaluator/evaluator.ts
  evaluator/context.ts
  evaluator/builtins/strings.ts
  evaluator/builtins/collections.ts
  evaluator/builtins/numbers.ts
  evaluator/builtins/dates.ts
  types/ast.ts
  types/tokens.ts

frontend/src/jjtl/
  index.ts
  README.md
  lexer/lexer.ts
  parser/parser.ts
  executor/executor.ts
  executor/traceModel.ts
  executor/jjodelConverter.ts
  executor/UIBridge.ts
  executor/ReactUIBridge.ts
  editor/JjtlEditor.tsx
  editor/jjtlLanguage.ts
  editor/jjtlTheme.ts
  editor/jjtlCompletions.ts
  analyzer/bidirectionality.ts
  services/MappingSuggestionService.ts
  services/AIMatcher.ts
  services/SimpleMatcher.ts
  views/DualMetamodelPanel.tsx
  views/MappingTraceView.tsx
  views/MappingCard.tsx
  views/MappingLinesOverlay.tsx
  utils/astToGrammar.ts
  utils/metamodelConverter.ts
  components/ExecuteTransformationDialog.tsx
  components/NewTransformationDialog.tsx
  components/TransformationsList.tsx
  components/JjtlDevelopmentEnv.tsx
  components/JjtlToolbar.tsx
  components/JjtlStatusBar.tsx
```
