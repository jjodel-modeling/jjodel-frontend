# JjTL — Jjodel Transformation Language Specification

**Version:** 0.2-draft
**Status:** Normative specification for implementation
**Companion:** JjEL SPEC (`frontend/src/jjel/SPEC.md`) — expression sub-language

---

## 1. Objectives and Design Principles

JjTL is a declarative model-to-model (M2M) transformation language. Its declarative core is **bidirectional**: the engine can execute transformations in either direction when bindings are invertible. JjTL also provides an **imperative extension** for unidirectional patterns.

### Design Criteria

1. **Declarative first** — class mappings with attribute bindings. Imperative `do {}` blocks are an escape hatch.
2. **Implicit trace resolution** — when a binding assigns a source element to a target property expecting a different type, the engine resolves via the trace automatically (ATL-style).
3. **Per-binding invertibility** — each binding is individually classified; the engine knows which parts of a transformation can be reversed.
4. **Progressive disclosure** — simple transformations use simple syntax; advanced features (called rules, lazy rules, imperative blocks) are opt-in.
5. **JjEL as expression sub-language** — all expressions inside JjTL are JjEL expressions. No duplication of evaluation logic.

### What JjTL Is NOT

| JjTL is not... | Because... |
|---|---|
| A general-purpose language | No standalone execution; transformations operate on models |
| A text template language | M2T is handled by the existing Handlebars engine |
| An OCL dialect | It uses JjEL, not OCL, as its expression language |

---

## 2. Lexical Structure

### 2.1 Keywords

| Keyword | Category |
|---|---|
| `transformation` | Declaration |
| `from`, `to` | Model references |
| `when` | Guard |
| `helper` | Helper definition |
| `rule` | Called rule definition (Phase 2) |
| `lazy`, `unique` | Rule modifiers (Phase 2) |
| `abstract`, `extends` | Rule inheritance (Phase 2) |
| `do` | Imperative block (Phase 4) |
| `import`, `uses`, `library` | Module system (Phase 5) |
| `main`, `mapping` | Entry point (Phase 4) |
| `alert`, `notify`, `prompt`, `input` | Interactive |
| `if`, `then`, `else` | Conditional expression (JjEL) |
| `and`, `or`, `not` | Logical operators (JjEL) |
| `is` | Type check (JjEL) |
| `true`, `false`, `null` | Literals (JjEL) |

Keywords are **case-insensitive** at the lexer level.

### 2.2 Operators and Punctuation

| Token | Symbol | Token | Symbol |
|---|---|---|---|
| `ARROW` | `->` | `COLON` | `:` |
| `EQUALS` | `=` | `DOT` | `.` |
| `COMMA` | `,` | `QUESTION_DOT` | `?.` |
| `NULL_COALESCE` | `??` | `EQUALS_EQUALS` | `==` |
| `NOT_EQUALS` | `!=` | `LESS_THAN` | `<` |
| `GREATER_THAN` | `>` | `LESS_EQUAL` | `<=` |
| `GREATER_EQUAL` | `>=` | `PLUS` | `+` |
| `MINUS` | `-` | `STAR` | `*` |
| `SLASH` | `/` | `PERCENT` | `%` |

Brackets: `{ }`, `( )`, `[ ]`

### 2.3 Comments

Line comments start with `#` and extend to end of line.

```jjtl
# This is a comment
Class -> Table {  # inline comment
    name -> tableName
}
```

### 2.4 Strings

Strings use `"` or `'` delimiters. Escape sequences: `\n`, `\t`, `\r`, `\\`, `\"`, `\'`.

### 2.5 Numbers

Integer and decimal literals: `42`, `3.14`, `-7`, `.5`.

> **Implementation note:** The lexer produces a single `NUMBER` token. The AST bridge maps all numbers to JjEL `EInt`. This should be fixed to distinguish `EInt`/`EDouble` based on presence of decimal point.

---

## 3. Grammar

### 3.1 Transformation Declaration

```ebnf
transformation  = "transformation" IDENTIFIER NEWLINE*
                  "from" modelList NEWLINE*
                  "to" modelList NEWLINE*
                  ( classMapping | helper )* ;

modelList       = IDENTIFIER ( "," IDENTIFIER )* ;
```

**Current implementation:** Single model per `from`/`to`. Multi-model is Phase 1 future work.

**Example:**
```jjtl
transformation StateMachine2PetriNet
from StateMachine
to PetriNet
```

### 3.2 Class Mapping

```ebnf
classMapping    = sourceType "->" targetType multiplicity? condition? mappingBody? ;

sourceType      = qualifiedType ;
targetType      = qualifiedType ;
qualifiedType   = ( IDENTIFIER "." )? IDENTIFIER ;

multiplicity    = "[" bound ( ".." bound )? "]" ;
bound           = NUMBER | "*" ;

condition       = "when" "{" expression "}" ;

mappingBody     = "{" mappingBodyItem* "}" ;
mappingBodyItem = attributeMapping | alertStatement | notifyStatement ;
```

**Semantics:** For each instance of `sourceType` in the source model, if `condition` evaluates to truthy, create instance(s) of `targetType` in the target model and execute the body.

**Execution order:** Class mappings fire in **declaration order**. All instances of the source type are matched (no priority, no scheduling).

**Source matching:** Exact class name match (string equality on `className` or `__type`). No inheritance-based matching in current implementation.

> **`when` syntax discrepancy:** The parser currently uses `when { expr }` (braces). The development plan specifies `when ( expr )` (parentheses). **Decision needed.** Braces are consistent with mapping body syntax; parentheses are more conventional for guards. The current implementation uses braces.

**Examples:**
```jjtl
State -> Place { ... }

State -> Place [*] { ... }

State -> Place when { not isFinal } { ... }
```

### 3.3 Attribute Mapping

```ebnf
attributeMapping = sourceAttr? "->" targetAttr ( ":" conversion )?
                 | "->" targetAttr objectCreation ;

sourceAttr       = IDENTIFIER ;
targetAttr       = IDENTIFIER ;

conversion       = valueMappingList | expression ;
valueMappingList = valueMapping ( "," valueMapping )* ;
valueMapping     = literal "=" literal ;

objectCreation   = "{" ( "->" IDENTIFIER objectCreation | mappingBodyItem )* "}" ;
```

**Five binding forms:**

| Form | Syntax | Semantics |
|---|---|---|
| Direct | `name -> label` | `target.label = source.name` |
| Expression | `name -> label : expr` | `target.label = eval(expr)` |
| Value mapping | `isInitial -> tokens : true=1, false=0` | Lookup table |
| Computed (no source) | `-> count : expr` | `target.count = eval(expr)` |
| Object creation | `-> arcs { -> Arc { ... } }` | Create nested object |

**Property resolution** (4-strategy fallback for reading source values):
1. Direct property access: `source[path]`
2. Context variable lookup: `ctx.get(path)` (instance properties are bound as context variables)
3. JjEL evaluation: `jjelEval(path, contextRecord)` (for complex paths)
4. Dotted traversal: split on `.` and walk the object

### 3.4 Helper Functions

```ebnf
helper = "helper" IDENTIFIER "(" paramList? ")" "->" returnType "{" expression "}" ;

paramList = param ( "," param )* ;
param     = IDENTIFIER ":" IDENTIFIER ;
returnType = IDENTIFIER ;
```

**Semantics:** Helpers are named, reusable JjEL expressions. They are registered as JjEL builtins, making them callable from any expression in the transformation.

**Example:**
```jjtl
helper formatLabel(name: String, prefix: String) -> String {
    prefix + '_' + name.snakeCase()
}
```

### 3.5 Interactive Statements

```ebnf
alertStatement  = "alert" "(" expression ( "," STRING )? ")" ;
notifyStatement = "notify" "(" expression ( "," NUMBER )? ")" ;
```

**Interactive expressions** (usable inside conversion expressions):

```ebnf
promptExpr = "prompt" "(" expression ( "," expression )? ")" ;
inputExpr  = "input" "(" expression "," STRING ( "," ( arrayLiteral | expression ) )? ")" ;
```

> **Implementation status:** Parser produces AST nodes. UIBridge interface and React dialog components exist. **Executor does NOT execute alert/notify statements** (silently dropped). **Prompt/Input in expressions return null** via the AST bridge. This is a gap that needs to be closed.

### 3.6 Expressions

All expressions follow the JjEL grammar (see `jjel/SPEC.md`). Operator precedence (lowest to highest):

1. `if ... then ... else ...`
2. `??` (null coalesce)
3. `or`
4. `and`
5. `==`, `!=`
6. `<`, `>`, `<=`, `>=`
7. `is` (type check)
8. `+`, `-`
9. `*`, `/`, `%`
10. `not`, `-` (unary)
11. `.`, `?.` (member access / method call)

Lambda syntax: `param : body` or `(p1, p2) : body`

---

## 4. Execution Model

### 4.1 Overview

```
Source Model → [Match] → [Guard] → [Create] → [Bind] → [Trace] → Target Model
```

1. **Parse** the JjTL source into an AST
2. **Initialize** the execution context (bindings, helpers, trace builder)
3. **Register helpers** as JjEL builtins
4. **Extract source instances** from the source model (keyed by class name)
5. **For each class mapping** (in declaration order):
   a. Look up all source instances matching the source class name
   b. For each instance, evaluate the `when` guard; skip if falsy
   c. Create target instance(s) according to multiplicity
   d. Execute attribute mappings (bindings)
   e. Record trace links
6. **Return** the execution result (target model + trace model)

### 4.2 Source Instance Extraction

The executor accepts four input formats:

| Format | Detection | Instance extraction |
|---|---|---|
| Array | `Array.isArray(source)` | Each item; class from `className` or `__type` |
| Object with `.classes` | `source.classes` exists | Class definitions as instances |
| Object with `.instances` | `source.instances` exists | Instances array |
| Flat object | Any object | Array-valued properties iterated |

### 4.3 Guard Evaluation

The `when` expression is evaluated with a per-instance context. Source instance properties are bound as context variables (all non-`__` prefixed properties). The result is coerced to boolean:
- `false`, `null`, `undefined`, `0`, `""` → skip
- Everything else → proceed

### 4.4 Target Instance Creation

Each target instance is a plain JavaScript object:

```typescript
{
    __type: targetClassName,
    className: targetClassName,
    __sourceId: sourceInstance.name || sourceInstance.id || `${className}_${index}`,
    __createdBy: 'JjTL'
}
```

**Multiplicity behavior:**

| Multiplicity | Creates |
|---|---|
| (none) | 1 instance |
| `[1]` | 1 instance |
| `[N]` (N > 1) | N instances |
| `[*]` | **Currently:** 1 instance. **Should:** create instances based on context (e.g., collection size) |

> **Known limitation:** `[*]` always creates exactly 1 instance. The semantics of unbounded multiplicity need to be defined.

### 4.5 Attribute Binding Execution

For each `AttributeMappingAST` in the mapping body:

1. If **object creation**: recursively create nested object and assign
2. If **conversion with expression**: evaluate via JjEL and assign
3. If **conversion with value mappings**: evaluate source attribute, look up in mapping table, assign
4. If **direct mapping** (source -> target): resolve source property value via 4-strategy fallback, assign
5. If **no source attribute** and **no conversion**: assign `null`

Result is written as: `targetInstance[targetAttribute] = fromJjelValue(value)`

### 4.6 Expression Evaluation Delegation

All expression evaluation is delegated to JjEL:

1. **Standalone function calls** (identifier + arguments): handled specially by the executor before delegation. Looks up builtin or helper in context.
2. **All other expressions**: converted from JjTL AST to JjEL AST via `toJjelAst()` (astBridge), then evaluated by `JjelEvaluator.evaluate()`.

On error, evaluation returns `null` with a console warning (no throw).

---

## 5. Trace Model

### 5.1 Structure

```
TraceModel
├── transformationName: string
├── sourceModelName: string
├── targetModelName: string
├── executedAt: Date
└── links: TraceLink[]

TraceLink
├── rule: string                    # e.g., "State -> Place"
├── sourceElement: TraceElementRef
│   ├── modelName: string
│   ├── elementName: string
│   └── className: string
├── targetElements: TraceElementRef[]
├── bindings: BindingTrace[]
│   ├── sourceAttribute: string | null
│   ├── targetAttribute: string
│   ├── expression?: string
│   ├── sourceValue: any
│   ├── targetValue: any
│   ├── invertible: boolean
│   └── inverseExpression?: string
└── invertible: boolean             # weakest-link of all bindings
```

### 5.2 Trace Resolution

Two builtins are registered at initialization:

- `resolve(sourceElementName, targetClassName?, targetModelName?)` → first matching target element
- `resolveAll(sourceElementName, targetClassName?, targetModelName?)` → all matching target elements

For reverse lookups:
- `reverseResolve(targetElementName)` → source element

### 5.3 Implicit Trace Resolution

> **STATUS: NOT IMPLEMENTED**

**Intended behavior (ATL-style):** When an attribute binding assigns a source element (or a reference to one) to a target property, and the target property's type corresponds to a target class in the transformation, the engine should **automatically resolve** via the trace.

**Example:**
```jjtl
Transition -> Transition {
    source -> source    # source.source is a State; target.source expects a Place
                        # Engine should auto-resolve State → Place via trace
}
```

**Algorithm (to implement):**

1. Evaluate the source expression → get a value `v`
2. If `v` is an object with a `className` or `__type`:
   a. Check if any class mapping maps that type to a target type
   b. If yes, look up the trace for `v` → get the corresponding target element
   c. Assign the target element (not the source element)
3. If `v` is a collection, apply step 2 to each element
4. If no trace link found, assign `v` as-is (fallback to direct copy)

**Disambiguation for multiple rules matching the same source type:**
- Use the first matching trace link (declaration order)
- If the target property has a declared type, prefer the rule whose target class matches

**Endogenous transformations (same metamodel):**
- When source and target types are the same, implicit resolution is ambiguous
- Require explicit `resolve()` in this case, or use type context from the target property

### 5.4 Per-Binding Invertibility

Each binding is classified at runtime:

| Binding form | Invertible? | Inverse expression |
|---|---|---|
| Direct `name -> label` | Yes | `label -> name` |
| Value mapping (all targets unique) | Yes | Reversed lookup table |
| Value mapping (duplicate targets) | No | — |
| `Identifier` expression | Yes | Direct reference |
| `MemberAccess` expression | Yes | Property path |
| `Literal` expression | No | No source to reverse |
| `BinaryExpression` `+` with one literal | Conditional | `substring` inverse |
| Other expressions | No | — |

---

## 6. Bidirectionality

### 6.1 Design Philosophy

JjTL's declarative core is bidirectional. The bidirectionality is **per-binding**, not per-transformation: each individual binding is analyzed for invertibility, and the transformation can be executed in reverse for the invertible subset.

### 6.2 Static Analysis

The `BidirectionalityAnalyzer` classifies the entire transformation:

- **`bidirectional`**: all bindings are invertible, no guards, no imperative blocks
- **`partial`**: some bindings are invertible
- **`unidirectional`**: no bindings are invertible, or imperative-only rules

### 6.3 Reverse Execution

> **STATUS: NOT IMPLEMENTED**

The trace model records all information needed for reverse execution:
- `inverseExpression` strings for invertible bindings
- `sourceValue`/`targetValue` pairs for value mappings
- Full trace links for cross-reference reversal

**Future implementation:** Generate a reverse transformation AST from the trace model for fully/partially invertible transformations.

---

## 7. JjEL Integration

### 7.1 AST Bridge

The `astBridge.ts` module converts JjTL expression AST nodes to JjEL AST nodes:

| JjTL AST | JjEL AST | Notes |
|---|---|---|
| `Literal` | `Literal` | Type mapping: `string→EString`, `number→EInt`, `boolean→EBoolean`, `null→null` |
| `Identifier` | `Identifier` | Direct |
| `MemberAccess` | `MemberAccess` | Recursive |
| `NullSafeMemberAccess` | `NullSafeMemberAccess` | Recursive |
| `FunctionCall` (method) | `MethodCall` | When callee is `MemberAccess` |
| `FunctionCall` (standalone) | `Identifier` | **Gap**: loses arguments; executor handles before bridge |
| `BinaryExpression` | `Binary` | Operator remapping: `=`→`==`, `<>`→`!=`, `&&`→`and`, `||`→`or` |
| `UnaryExpression` | `Unary` | Direct |
| `ConditionalExpression` | `IfThenElse` | Direct |
| `NullCoalesceExpression` | `NullCoalesce` | Direct |
| `IsTypeExpression` | `IsType` | Direct |
| `LambdaExpression` | `Lambda` | Direct |
| `ArrayLiteral` | `ArrayLiteral` | Recursive |
| `JjelExpressionWrapper` | Unwrapped | Pass-through |
| `PromptExpression` | `Literal(null)` | **Gap**: should delegate to UIBridge |
| `InputExpression` | `Literal(null)` | **Gap**: should delegate to UIBridge |

### 7.2 Available Builtins

All JjEL builtins are available in JjTL expressions:

**Strings:** `toUpper`, `toLower`, `trim`, `length`/`size`, `startsWith`, `endsWith`, `contains`, `replace`, `split`, `substring`, `camelCase`, `snakeCase`, `pascalCase`, `kebabCase`

**Collections:** `filter`, `map`, `flatMap`, `first`, `last`, `any`, `all`, `count`/`size`, `isEmpty`, `flatten`, `distinct`, `join`

**Trace (registered by executor):** `resolve`, `resolveAll`

**Helpers:** All `helper` definitions in the transformation are registered as builtins.

### 7.3 Context Binding

For each source instance, the executor creates a child `EvaluationContext` with:
- `source` → the source instance object
- `self` → the target instance (when available)
- `data` → the source model root
- All non-`__` properties of the source instance as individual bindings (e.g., `name`, `isAbstract`, etc.)

This means `name` and `source.name` are equivalent in expressions.

---

## 8. Interactive Features

### 8.1 UIBridge Interface

```typescript
interface UIBridge {
    showAlert(message: string, alertType: AlertType): Promise<void>
    showNotify(message: string, duration?: number): void
    showPrompt(message: string, defaultValue?: string): Promise<InputResult<string>>
    showInput<T>(message: string, inputType: InputType, defaultValue?: T, options?): Promise<InputResult<T>>
}
```

Three implementations:
- `NoopUIBridge` — returns defaults (testing/headless)
- `ConsoleUIBridge` — logs to console (default)
- `ReactUIBridge` — emits events to React `DialogManager`

### 8.2 Alert Types

| Type | Usage |
|---|---|
| `info` | Informational message |
| `warning` | Warning condition |
| `error` | Error condition |
| `success` | Success confirmation |

### 8.3 Input Types

| Type | Widget |
|---|---|
| `text` | Text input field |
| `number` | Numeric input |
| `boolean` | Checkbox / toggle |
| `select` | Dropdown from options array |

> **Implementation gap:** The executor silently drops `AlertStatement` and `NotifyStatement` from mapping bodies. `PromptExpression` and `InputExpression` evaluate to `null`. The UIBridge exists but is not wired into the executor.

---

## 9. JjOM Integration

### 9.1 Source Model Conversion

`jjodelConverter.ts` provides `convertJjodelModelToSource(model)`:
- Converts `LModel.objects` (LProxy objects) to plain `SourceElement[]`
- Each element has: `name`, `className`, `attributes: Map`, `references: Map`
- Class name resolved via: `instanceof.name` → `className` → `__type` → `class.name`

### 9.2 Target Model Write-back

> **Not in jjodelConverter.** Lives in `ProjectEditor.tsx` with timing workarounds:

1. Create `DObject.new(instanceOf, father, fatherType, name, persist)` inside a TRANSACTION
2. IDs are temporary during TRANSACTION — cannot use them immediately
3. After TRANSACTION: `setTimeout(1000)` → locate object by name via `lModel.objects.find()`
4. Write attribute values: `(lObject as any)['$' + attrName].value = attrValue`

This is fragile. A proper `convertResultToJjodel()` in the converter should encapsulate this pattern.

---

## 10. Error Handling

| Situation | Behavior |
|---|---|
| Source class not found | Silently skip (no instances to match) |
| Guard evaluation error | Log warning, skip instance (treated as false) |
| Expression evaluation error | Log warning, return `null` |
| Property path not found | Return `null` after trying all 4 strategies |
| Value mapping: no match | Return `null` |
| Object creation error | Log warning, assign `null` |

No exceptions are thrown to the caller. All errors are caught and logged.

---

## 11. Execution Result

```typescript
interface ExecutionResult {
    success: boolean;
    targetModel: {
        name: string;
        instances: any[];       // flat array of all created target instances
    };
    trace: TraceModel;          // full trace with per-binding invertibility
    errors: string[];
    warnings: string[];
    stats: {
        rulesExecuted: number;
        instancesCreated: number;
        bindingsApplied: number;
        executionTimeMs: number;
    };
}
```

---

## 12. Implementation Status and Gaps

### 12.1 What Works (v0.1+)

| Feature | Status | Files |
|---|---|---|
| Lexer (all tokens) | ✅ | `lexer/lexer.ts`, `types/tokens.ts` |
| Parser (full grammar) | ✅ | `parser/parser.ts` |
| AST types | ✅ | `types/ast.ts` |
| Class mapping execution | ✅ | `executor/executor.ts` |
| `when` guards | ✅ | `executor/executor.ts` lines 404-470 |
| Direct attribute binding | ✅ | `executor/executor.ts` lines 619-673 |
| Value mapping conversion | ✅ | `executor/executor.ts` |
| Expression conversion (via JjEL) | ✅ | `executor/astBridge.ts` |
| Helper definition + calling | ✅ | `executor/executor.ts` lines 270-325 |
| Nested object creation | ✅ | `executor/executor.ts` |
| Trace model (build + query) | ✅ | `executor/traceModel.ts` |
| Per-binding invertibility | ✅ | `executor/executor.ts` lines 678-776 |
| Bidirectionality analyzer | ✅ | `analyzer/bidirectionality.ts` |
| `resolve()` / `resolveAll()` builtins | ✅ | `executor/executor.ts` lines 285-306 |
| JjEL builtin delegation | ✅ | `executor/astBridge.ts` + `executor/executor.ts` |
| UIBridge interface + React components | ✅ | `executor/UIBridge.ts`, `executor/ReactUIBridge.ts`, `components/dialogs/*` |
| Monaco syntax highlighting | ✅ | `editor/` |
| JjOM source model conversion | ✅ | `executor/jjodelConverter.ts` |

### 12.2 Known Bugs

| Bug | Description | Severity |
|---|---|---|
| Multiplicity `[*]` | Always creates 1 instance | Medium |
| Number type | All numbers bridged as `EInt`, never `EDouble` | Low |
| Duplicate values | B_1 may receive A_0's attribute values | High |
| Double execution | React StrictMode double-render causes second execution | Medium |
| Debug logging | Extensive `console.log` in executor not cleaned up | Low |

### 12.3 Implementation Gaps (Priority Order)

| # | Gap | Description | Priority |
|---|---|---|---|
| 1 | **Implicit trace resolution** | Auto-resolve source elements to target via trace | Critical |
| 2 | **Alert/Notify execution** | Wire executor body items to UIBridge | High |
| 3 | **Prompt/Input execution** | Wire AST bridge to UIBridge for interactive expressions | High |
| 4 | **Multiplicity `[*]`** | Define and implement unbounded creation semantics | Medium |
| 5 | **Reference mapping** | Map reference-typed properties (not just primitives) | High |
| 6 | **`when` syntax decision** | Decide `{ }` vs `( )` and update parser if needed | Low |
| 7 | **Multi-model** | `from A, B to C, D` with qualified types | Phase 1 |
| 8 | **Called rules** | `rule name(params) -> Type { ... }` | Phase 2 |
| 9 | **Lazy rules** | `lazy` / `unique lazy` keyword | Phase 2 |
| 10 | **Rule inheritance** | `abstract` / `extends` | Phase 2 |
| 11 | **`do {}` blocks** | Imperative post-binding section | Phase 4 |
| 12 | **Variables** | `var` declarations in imperative blocks | Phase 4 |
| 13 | **Control flow** | `for`, `while`, `if` statements | Phase 4 |
| 14 | **Module system** | `import`, `uses`, `library` | Phase 5 |
| 15 | **Reverse execution** | Generate reverse transformation from trace | Phase 8 |
| 16 | **JjOM write-back** | Move from ProjectEditor.tsx to jjodelConverter.ts | Infra |

---

## 13. Complete Transformation Examples

### 13.1 StateMachine to PetriNet

```jjtl
transformation SM2PN
from StateMachine
to PetriNet

# Simple 1:1 mapping
State -> Place {
    name -> name
    isInitial -> tokens : true=1, false=0
}

# 1:1 mapping with nested object creation
Transition -> Transition {
    label -> name

    # Input arc: source state -> this transition
    -> inputArcs {
        -> Arc {
            source -> source       # implicit trace resolution: State → Place
            -> weight : 1
        }
    }

    # Output arc: this transition -> target state
    -> outputArcs {
        -> Arc {
            target -> target       # implicit trace resolution: State → Place
            -> weight : 1
        }
    }
}
```

### 13.2 Class Diagram to RDBMS

```jjtl
transformation Class2RDBMS
from ClassDiagram
to RDBMS

# Only non-abstract, non-primitive classes become tables
Class -> Table when { not isAbstract and not isPrimitive } {
    name -> tableName : name.snakeCase()
}

# Attributes become columns
Attribute -> Column {
    name -> columnName : name.snakeCase()
    type -> columnType : mapType(type)
}

helper mapType(umlType: String) -> String {
    if umlType == "String" then "VARCHAR(255)"
    else if umlType == "Integer" then "INT"
    else if umlType == "Boolean" then "BIT"
    else "VARCHAR(255)"
}
```

### 13.3 With Interactive Features (target state)

```jjtl
transformation InteractiveMapping
from Source
to Target

Element -> TargetElement {
    name -> name

    # Ask user for confirmation on ambiguous mappings
    category -> category : prompt("Category for " + name + "?", source.category)

    alert("Processing element: " + name, "info")
}
```

---

## Appendix A: AST Node Types Reference

### Top-Level Nodes

```typescript
TransformationAST {
    type: 'Transformation'
    name: string
    sourceMetamodel: string
    targetMetamodel: string
    mappings: ClassMappingAST[]
    helpers: HelperAST[]
    location: Location
}

ClassMappingAST {
    type: 'ClassMapping'
    sourceClass: string
    targetClass: string
    targetMultiplicity?: MultiplicityAST
    condition?: ExpressionAST
    body: MappingBodyItemAST[]
    location: Location
}

HelperAST {
    type: 'Helper'
    name: string
    parameters: ParameterAST[]
    returnType: string
    body: ExpressionAST
    location: Location
}
```

### Structural Nodes

```typescript
MultiplicityAST {
    type: 'Multiplicity'
    lower: number
    upper: number    // -1 = unbounded
}

AttributeMappingAST {
    type: 'AttributeMapping'
    sourceAttribute?: string
    targetAttribute: string
    conversion?: ConversionAST
    objectCreation?: ObjectCreationAST
    location: Location
}

ConversionAST {
    type: 'Conversion'
    mappings?: ValueMappingAST[]
    expression?: ExpressionAST
}

ValueMappingAST {
    type: 'ValueMapping'
    sourceValue: LiteralAST
    targetValue: LiteralAST
}

ObjectCreationAST {
    type: 'ObjectCreation'
    targetClass: string
    body: AttributeMappingAST[]
}
```

### Expression Nodes

All expression types are defined in `types/ast.ts` as a union type `ExpressionAST`:

```typescript
type ExpressionAST =
    | LiteralAST              // "hello", 42, true, null
    | IdentifierAST           // name, isAbstract
    | MemberAccessAST         // source.name
    | NullSafeMemberAccessAST // source?.name
    | FunctionCallAST         // name.toUpper(), resolve("x")
    | NullSafeFunctionCallAST // list?.first()
    | BinaryExpressionAST     // a + b, x == y, p and q
    | UnaryExpressionAST      // not x, -n
    | ConditionalExpressionAST // if a then b else c
    | NullCoalesceExpressionAST // a ?? b
    | IsTypeExpressionAST     // x is Type
    | LambdaExpressionAST     // x : x.name
    | PromptExpressionAST     // prompt("message", default)
    | InputExpressionAST      // input("message", "text", default)
    | ArrayLiteralAST         // [1, 2, 3]
    | JjelExpressionWrapperAST // wrapped JjEL expression
```

### Interactive Statement Nodes

```typescript
AlertStatementAST {
    type: 'AlertStatement'
    message: ExpressionAST
    alertType: 'info' | 'warning' | 'error' | 'success'
}

NotifyStatementAST {
    type: 'NotifyStatement'
    message: ExpressionAST
    duration: number    // milliseconds, default 3000
}
```

---

## Appendix B: Key Files

| Component | Path (relative to `frontend/src/jjtl/`) |
|---|---|
| Lexer | `lexer/lexer.ts` |
| Token types | `types/tokens.ts` |
| AST types | `types/ast.ts` |
| Parser | `parser/parser.ts` |
| Executor | `executor/executor.ts` |
| AST Bridge (JjTL→JjEL) | `executor/astBridge.ts` |
| Trace Model | `executor/traceModel.ts` |
| JjOM Converter | `executor/jjodelConverter.ts` |
| UIBridge | `executor/UIBridge.ts` |
| React UIBridge | `executor/ReactUIBridge.ts` |
| Bidirectionality Analyzer | `analyzer/bidirectionality.ts` |
| AST-to-Source | `executor/astToSource.ts` |
| Tests (bridge) | `__tests__/astBridge.test.ts` |
| Tests (executor) | `__tests__/executor-bridge.test.ts` |
| React dialogs | `components/dialogs/` |
| Monaco editor | `editor/` |

---

## Appendix C: Test Coverage

### Tested (37 tests pass)

- AST bridge: all node type conversions (22 tests)
- Executor integration: direct mapping, JjEL builtins, value mapping, guards, nested objects, if/then/else, null-safe navigation, multiple instances, trace recording (15 tests)

### Not Tested

- Helpers
- Multiple class mappings in one transformation
- Multiplicity `[*]`
- Alert/Notify/Prompt/Input execution
- Cross-reference resolution
- Multi-attribute with complex conversions
- Edge cases for `evaluatePropertyPath`
- Implicit trace resolution
- Bidirectionality analysis integration
- JjOM round-trip (source conversion → execution → write-back)
