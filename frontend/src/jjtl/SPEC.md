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
| `where` | Guard |
| `helper` | Helper definition |
| `rule` | Called rule definition (contextual, §3.4b) |
| `lazy`, `unique` | Rule modifiers (contextual, §3.4b) |
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

`rule`, `lazy` and `unique` are **contextual** (P-2026-11-02-2224): the lexer gives them no
token, since lowercasing would take a class `Rule` or Ecore's feature `unique` away from every
saved transformation. The parser reads them, lowercase and by value, only at the start of a
top-level declaration: `rule NAME (`, `unique rule NAME (`, `lazy NAME`, `unique lazy NAME`
(`unique rule`: P-2026-11-03-2111, R-JTG-16). Everywhere else they are
identifiers. One form changes reading: a source class called `lazy` with an alias
(`lazy l -> T`) is now a lazy rule on `l`; `lazy -> T` still maps the class.

### 2.2 Operators and Punctuation

| Token | Symbol | Token | Symbol |
|---|---|---|---|
| `ARROW` | `->` | `COLON` | `:` |
| `ASSIGN` | `:=` | `EQUALS` | `=` |
| `DOT` | `.` | `QUESTION_DOT` | `?.` |
| `COMMA` | `,` | `QUESTION_DOT` | `?.` |
| `NULL_COALESCE` | `??` | `EQUALS_EQUALS` | `==` |
| `NOT_EQUALS` | `!=` | `LESS_THAN` | `<` |
| `GREATER_THAN` | `>` | `LESS_EQUAL` | `<=` |
| `GREATER_EQUAL` | `>=` | `PLUS` | `+` |
| `MINUS` | `-` | `STAR` | `*` |
| `SLASH` | `/` | `PERCENT` | `%` |

Brackets: `{ }`, `( )`, `[ ]`

### 2.3 Comments

Line comments start with `--` and extend to end of line.

```jjtl
-- This is a comment
Class -> Table {  -- inline comment
    tableName := name
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
classMapping    = sourceSpec ( "," sourceSpec )* "->" targetType multiplicity? condition? mappingBody? ;

sourceSpec      = qualifiedType ( IDENTIFIER )? ;    -- optional alias
targetType      = qualifiedType ;
qualifiedType   = ( IDENTIFIER "." )? IDENTIFIER ;

multiplicity    = "[" bound ( ".." bound )? "]" ;
bound           = NUMBER | "*" ;

condition       = "where" expression ;               -- no braces

mappingBody     = "{" mappingBodyItem* "}" ;
mappingBodyItem = attributeMapping | alertStatement | notifyStatement ;
```

**Semantics:** For each instance of `sourceType` in the source model, if `condition` evaluates to truthy, create instance(s) of `targetType` in the target model and execute the body.

**Execution order:** Class mappings fire in **declaration order**. All instances of the source type are matched (no priority, no scheduling).

**Source matching:** Exact class name match (string equality on `className` or `__type`). No inheritance-based matching in current implementation.

**Source alias:** An optional identifier after the source class name binds the source instance to a name usable in the body and the `where` guard.

**Multi-source:** Multiple comma-separated source specs allow joining source elements; the `where` guard typically constrains the join.

**Examples:**
```jjtl
State -> Place { ... }

State -> Place [*] { ... }

State -> Place where not isFinal { ... }

-- With alias
Person p -> Human where p.age > 18 {
    name := p.fullName
}

-- Multi-source join
Class c, Package p -> Table where c.package = p {
    name := p.name + "." + c.name
}
```

### 3.3 Attribute Mapping

```ebnf
attributeMapping = targetAttr ":=" ( sourceAttr | expression ) ( ":" valueMappingList )?
                 | "->" targetAttr ( ":" expression ( ":" valueMappingList )? )?
                 | "->" targetFeature objectCreation ;

sourceAttr       = IDENTIFIER ;
targetAttr       = IDENTIFIER ;
targetFeature    = IDENTIFIER ;   -- a feature of the ENCLOSING target class

valueMappingList = valueMapping ( "," valueMapping )* ;
valueMapping     = valueKey "=" valueKey ;
valueKey         = literal | IDENTIFIER ;

objectCreation   = "{" ( "->" targetType mappingBody | forAllMapping+ ) "}" ;

forAllMapping    = "forall" forAllBinding ( "," forAllBinding )*
                   ( "such" "that" expression )? NEWLINE*
                   "->" targetType mappingBody ;
forAllBinding    = IDENTIFIER ( "," IDENTIFIER )* "in" expression ;
```

**Binding forms:**

| Form | Syntax | Semantics |
|---|---|---|
| Direct copy | `label := name` | `target.label = source.name` |
| Expression | `fullName := name + " " + surname` | `target.fullName = eval(expr)` |
| Value mapping | `tokens := isInitial : true=1, false=0` | Lookup table |
| Value mapping (enum) | `type := a.type : String=VARCHAR` | Lookup table with identifier keys |
| Conversion | `-> label : name.toUpper()` | `target.label = eval(expr)` |
| Conversion + lookup | `-> type : a.type : String=VARCHAR` | Both, in that order |
| Computed | `count := items.size()` | `target.count = eval(expr)` |
| Object creation | `-> columns { -> Column { ... } }` | One object, in feature `columns` |
| Iterated creation | `-> columns { forall a in attrs -> Column { ... } }` | One object per element, in `columns` |

#### Object creation

`-> feature { ... }` creates objects and stores them **in that feature of the
enclosing target instance**. `feature` is resolved against the target metamodel
and is **never validated as a class name**. Two bodies are legal:

```jjtl
Entity -> Table {
    name := name

    -- one object
    -> primaryKey {
        -> Column { name := "id" }
    }

    -- one object per element of a collection
    -> columns {
        forall a in ownedAttributes such that not a.derived -> Column {
            name := a.name
            isPrimaryKey := a.isKey
            type := a.type : String=VARCHAR, Integer=INTEGER
        }
    }
}
```

Rules:

- A **bare class creation in a rule body** — `-> Column { ... }` with no enclosing
  feature — is a **validation error**: `Object creation must be nested in a feature`.
  There is no feature to store the object in, so it used to run and produce nothing.
- A `forall` **directly in a rule body**, naming no feature, is still accepted. The
  executor looks for the one reference of the target class that can hold the created
  class (its type, or a supertype of it); with none or several it falls back to the
  pluralization heuristic `Column → columns` and **warns naming the guess**. Write
  `-> feature { forall ... }` to say it explicitly.
- Objects created inside a feature carry `__createdBy: 'JjTL'` and `__nested: true`.
  `__nested` is what distinguishes *an object to create in this feature* from
  `__ref_result`, *a pointer to a target another rule created*.
- A wrapper whose body is neither of the two forms produces a warning and no object.

#### Reference collections in `forall`

The source model serializes every reference value as `{ __ref: pointerId }`. Inside a
`forall` each element is dereferenced to the **source object** it names before the body
runs, so `a.name` reads the attribute rather than `undefined`. Elements naming no object
of the source model are iterated unresolved, with one warning per collection.

This is the opposite direction from trace resolution (§5.3), which maps the same wrapper
source → **target**. Both coexist and neither changed the other.

#### `forall` over several variables

A `forall` may bind several variables, in two spellings that mix
(R-FA-1, R-FA-7): `forall q, r in xs` ranges both over `xs`, `forall q in xs, r in ys`
gives each its collection. The iteration is the **cartesian product**, first variable
outermost; without a filter the pair `(a, a)` and both orders are present, and excluding
them is the filter's job. A later collection may read an earlier variable
(`forall c in classes, a in c.attributes`). Every variable is bound in the `such that`
and in the body, with the variables of an enclosing `forall` and the `let` bindings in
scope. The `such that` sees what the body sees (R-JTG-19, P-2026-11-04-0015): with one
variable, the element's bare names too, so `forall x in xs such that kind == "k"` reads
`x.kind`. The created objects form **one flat list** in the feature; an empty product creates
nothing, without a warning. A name bound twice in the same `forall` is a parse error.
Unlike a one-variable `forall`, the properties of the elements are not bound unqualified.
With the source text, JjEL is the only parser of a collection, up to `such`, `->`, the comma of the next binding or the end of the line, so it reads what the legacy expression parser cannot, an object literal (`{ hi: q, lo: r }`) among them (P-2026-11-02-2345, P-2026-11-03-1135). Without the source text the collection is the legacy expression.

```jjtl
-- same collection: every unordered pair of requesters, once
-> ops {
    forall q, r in requesters such that r.priority > q.priority -> Neg { ... }
}

-- one collection each, the second reading the first
-> columns {
    forall e in entities, a in e.ownedAttributes -> Column { name := e.name + "_" + a.name }
}
```

An element of a collection that is a record built by an expression
(`{ hi: q, lo: r }`) has its fields lifted like a source reference, so `pr.hi.name`
reads the source object.

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

**Scoping:** inside a helper's body its parameters shadow a helper, or any builtin, of the same name. Read as a value (`pick`, or passed on as `f(cx, pick)`), the name is the argument. Called (`pick(...)`), it is the argument only when the argument is a function; otherwise the call goes to the helper. The shadowing covers the body and the lambdas in it, not the helpers it calls: each helper sees its own parameters only. Outside helper bodies JjEL resolution is unchanged, builtins first (P-2026-11-06-2226; before it, the parameter read as the helper, silently).

```jjtl
helper pick(x: Any, which: String) -> String { if which == "a" then "A" else "B" }
helper echo(cx: Any, pick: String) -> String { pick }               -- the argument
helper call(cx: Any, pick: String) -> String { pick(cx, pick) }     -- the helper, given the argument
```

**Example:**
```jjtl
helper formatLabel(name: String, prefix: String) -> String {
    prefix + '_' + name.snakeCase()
}
```

### 3.4b Called and Lazy Rules

> **STATUS: implemented in the executor (P-2026-11-02-2224, slice B).** The app's write-back
> of several targets per source element is slice B2. Semantics: §5.3.3.

```ebnf
calledRule = [ "unique" ] "rule" IDENTIFIER "(" [ ruleParam ( "," ruleParam )* ] ")" ruleTail ;
ruleParam  = IDENTIFIER [ ":" IDENTIFIER ] ;
lazyRule   = [ "unique" ] "lazy" IDENTIFIER [ IDENTIFIER ] ruleTail ;
ruleTail   = "->" IDENTIFIER multiplicity? condition? [ "{" mappingBody "}" ]
           | "=" expression ;                     (* a delegating rule, to the end of the line *)
classMapping = sourcePattern ( "," sourcePattern )* ruleTail ;
```

The form follows `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md:268-322` (R-JTG-5). Called and lazy
rules are kept in `TransformationAST.rules`, not in `mappings`: neither takes part in pass-1
matching. A parameter typed `Env` receives the environment (§5.3.3); other parameter types are
optional and not checked.

**Delegating rules** (`= expression`) are this lane's addition to the sketch: a rule that
creates no target of its own and lowers to what the expression lowers to. A source node with
no target counterpart needs one: `Bind(expr, bindings)` lowers to its `expr`, and a variable
lowers either to a `Ref` or to the expression bound to it. Any of the three kinds may delegate;
a delegating rule has no guard, its expression decides.

```jjtl
rule mkRef(v) -> Ref { name := v.name }
rule under(e, env: Env) = e
lazy Add -> Add { left := left  right := right }
unique lazy Const -> Const { value := value }
lazy Var v = if envHas(v.name) then envLookup(v.name) else mkRef(v)
Main m = m.expr
```

### 3.5 Interactive Statements

```ebnf
alertStatement  = "alert" "(" expression ( "," STRING )? ")" ;
notifyStatement = "notify" "(" expression ( "," NUMBER )? ")" ;
```

**Interactive expressions** (usable inside conversion expressions):

```ebnf
promptExpr = "prompt" "(" expression "," ( IDENTIFIER ( "," expression )? | expression ) ")" ;
inputExpr  = "input" "(" expression "," STRING ( "," ( arrayLiteral | expression ) )? ")" ;
```

`prompt` has two forms:

- `prompt(message, default)`: asks for a value of type `EString`, with `default` pre-filled.
- `prompt(message, Type [, default])`: asks for a value of type `Type`, with an optional `default`.

The second argument is read by its shape. A bare name (an identifier followed by `,` or `)`) is the type; any
other expression (a string, a number, a dotted path, a call, a concatenation) is the default, and the type is
`EString`. With three arguments the second must be a bare name. The parser does not check the name against the
known types. Both parser paths, legacy and JjEL, apply the same rule.

```jjtl
prefix := prompt("Table prefix:", "tbl_")          -- default "tbl_", type EString
size   := prompt("Column size:", EInt, 255)        -- type EInt, default 255
label  := prompt("Label for " + name + "?", EString, name)
```

A bare name is never a default: `prompt("Label?", name)` asks for a value of type `name`, it does not pre-fill the
`name` attribute. To pre-fill from a variable or attribute, write the type explicitly, as in the third line above.
The second argument is required: `prompt(message)` alone is rejected by both paths.

`input` does not share this rule. Its second argument is always a string literal naming the input kind (`"string"`,
`"number"`, `"boolean"`, `"date"`, `"select"`); the optional third is the default, or the options array for
`"select"`.

> **Implementation status:** The executor runs all four. `alert` awaits the host dialog; `notify` shows a toast and does not wait. `prompt`, `input` and `confirm` open the host dialog when the call is the whole right-hand side of an attribute mapping, a `let` binding or a conversion: the executor awaits the answer and binds the value entered (for `input`, the default is pre-filled), or `null` when the dialog is cancelled. A call nested inside a larger expression opens no dialog: on both parse paths the whole expression fails with the warning `Expression evaluation failed (JjelExpression): Function 'prompt' is not defined` (`confirm` or `input` named likewise) and the value is `null`, so `"x" + prompt("N", EString)` yields `null`.

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
   b. For each instance, evaluate the `where` guard; skip if falsy
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

**Which instances the array contains.** `ProjectEditor` builds it from
`LModel.allSubObjects` — every object of the source model, contained ones
**included**. It used to build it from `LModel.objects`, the roots only, so a class
instantiated exclusively inside a containment slot reported
*"Source class 'X' has no instances in the source model"* and produced nothing.

This is a behavioural change with a scope wider than the bug it fixes: **the set of
instances a transformation sees no longer depends on which rules are written**. A rule
on a contained class that was silently empty now produces output, and `source` / `data`
(bound to the whole array) count more elements than before.

Each contained object carries `_containerId`, the id of the object that owns it through
a containment feature; `parent` resolves through it (§7.3).

### 4.3 Guard Evaluation

The `where` expression is evaluated with a per-instance context. Source instance properties are bound as context variables (all non-`__` prefixed properties). The result is coerced to boolean:
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
| `[*]`, `[0..*]` | 1 instance |
| `[n..*]` (n > 0) | n instances, the lower bound |

The counts are per source instance. An unbounded upper bound fixes no count, so the rule creates its lower bound, at least one (R-JTG-21, P-2026-11-04-0900); no warning.

### 4.5 Attribute Binding Execution

For each `AttributeMappingAST` in the mapping body:

1. If **object creation**: recursively create nested object and assign
2. If **conversion with expression**: evaluate via JjEL and assign
3. If **conversion with value mappings**: evaluate source attribute, look up in mapping table, assign
4. If **direct mapping** (`target := source`): resolve source property value via 4-strategy fallback, assign
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
├── links: TraceLink[]
└── placements?: TracePlacement[]   # containment placements (§5.3.1), absent when none

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

TracePlacement
├── rule: string                    # the rule whose binding placed the target
├── target: TraceElementRef
├── container: TraceElementRef
└── feature: string                 # the containment feature of the container
```

### 5.2 Trace Resolution

Two builtins are registered at initialization:

- `resolve(sourceElementName, targetClassName?, targetModelName?)` → first matching target element
- `resolveAll(sourceElementName, targetClassName?, targetModelName?)` → all matching target elements

For reverse lookups:
- `reverseResolve(targetElementName)` → source element

### 5.3 Implicit Trace Resolution

> **STATUS: implemented for references (P-2026-11-02-1742, slice A0) and for containment
> placement, in the executor (P-2026-11-02-1956, slice A) and in the app's write-back
> (P-2026-11-02-2024, §9.2). Environments and called rules are PLANNED: part B of
> `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md`, ratified as R-JTG-1..5
> in `docs/decisions.md`.** Each paragraph below says which of the two it describes.

When a binding assigns a source element, or a reference to one, the engine replaces it with
the target that a rule created for it, found through the trace. No `resolve()` is needed.

```jjtl
Transition -> Transition {
    source := source    -- source.source is a State; the target holds the Place
}                       -- that the rule State -> Place created for it
```

#### 5.3.1 What is implemented

**When.** Every binding value goes through resolution before it is stored: rule-level
bindings, bindings inside a `let`, and bindings of objects created in a body
(`-> feature { -> T { ... } }`). A collection is resolved element by element.

**The trace.** Pass 1 creates every target of every matched rule and records it under the
source element's id and name, with the rule and the target class (§4). Pass 2 evaluates the
bindings, so resolution finds a target whatever the rule order.

**Value shapes.**

| Value | Resolution |
|---|---|
| `{ __ref: id }` (a reference read from the model) | the trace entries for `id` |
| an object with `className` / `__type` | the rules for that class, then the trace entry for that rule |
| primitive, `null` | unchanged |
| array | element by element |

**Binding by identity.** The parent holds the **live** target instance, not a copy. What
pass 2 binds on that target, before or after the parent, is visible through the parent, and
two targets may point at each other (`a.b = b`, `b.a = a`). A reference value is stored as
`{ __ref_result: true, targets: [...] }`, which the write-back turns into pointers (§9.2).
Every reader of the output tolerates cycles: the write-back reads one level, the trace view
is depth-bounded, `serializeTraceModel` writes a rule target as `{__type, className, __sourceId}`.

**Ambiguity.** Two rules matching one source element throw, naming both target classes;
`resolve(e, TargetType)` disambiguates (R-JTG-3). An element of a class with a rule but no
trace entry (filtered by `where`) throws `Unresolved reference`.

**Fallbacks, reported.** Three cases keep their result and add one warning naming the rule
and the source element whose binding hit them (R-JTG-2):

| Case | Bound | Warning |
|---|---|---|
| an object of a class no rule maps | the source object itself | `... has no rule mapping '<Class>': the source object itself was bound` |
| a `{ __ref }` to an element no rule maps | `null` (dropped from a collection that also holds resolved targets, with the partial-array warning) | `... points to an element no rule maps: it resolved to null` |
| several targets of one rule for one source (multiplicity `[n]`) | the first | `... has <n> targets from rule '<rule>': the first was bound` |

**Containment (slice A, P-2026-11-02-1956).** A binding on a containment feature (`composition`
in the target metamodel) places each rule target it resolves to inside the object that owns the
feature: the feature holds the **live** target, not a `__ref_result`, a collection element by
element in order. A value holding no rule target is bound as before, and a fallback of the table
above keeps its warning: an unmapped `{ __ref }` is dropped, an unmapped embedded object is bound
as itself. Without a target metamodel no feature is known as a containment and nothing is placed.

- *Roots.* After pass 2 every placed target leaves `roots`. This is recorded, not warned
  (R-JTG-4): `targetModel.containment` maps each placed target to `{ container, feature }`, and
  `traceModel.placements` lists `{ rule, target, container, feature }`.
- *Ownership, decided in the executor.* A second claim on a target by another container, or by
  another feature of the same one, is an error naming the target and both containers; the
  second claim is not placed. A containment cycle, self-containment included, is an error naming
  the elements on it; the walk runs through objects created in a body as well. Both make the
  run fail (`success: false`) before anything reaches the D-layer.
- *Assignment.* A second binding of the same feature on the same owner replaces the first and
  releases its claims. Objects created into that feature by `-> feature { ... }` are kept in
  source order with the placed targets: created first, then placed, or the reverse.
- *Identity.* Objects created in a body keep their identity through the bind-time conversion,
  so one of them can be the container of a placed target.
- *Order.* Placement happens in pass 2 against targets created in pass 1, so the tree is the
  same, by identity, whatever the rule order.
- *References.* A non-containment binding to a placed target is still a `__ref_result` pointer.
- *Format (P-2026-11-02-2108).* After pass 2 every placed target is marked `__nested: true`, the
  format of an object created in a body, and `__placed: true`. `__nested` is what the write-back
  reads; `__placed` keeps it a rule target for the readers that tell the two apart (binding by
  identity, the trace serializer, which writes it short). It is marked once every binding is
  made, never at claim time, so no pointer to it depends on rule order. Its trace link, its
  bindings and the pointers to it are unchanged. `targetModel.containment` stays, for ownership
  and errors.
- *Write-back.* The app writes a placed target once, inside its container, never as a root
  (§9.2). A run that fails on a second claim or a cycle writes nothing.

**Per model.** The trace maps source elements to target elements of one run. An object of the
target model (`__createdBy: 'JjTL'`) is never resolved as a source element, so `Add -> Add` from
one model to another is not endogenous: a target returned by `resolve()` is bound as itself.

**Trace key.** Each trace entry carries an environment, and implicit resolution looks entries up
under (source, rule, environment). Until B the environment is always the empty one.

#### 5.3.2 The frame of A and B (planned)

The terms are those of R-JTG-5 and of `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md:268-322`: called
rules `rule name(args) -> T`, `lazy` and `unique lazy` rules; an **environment** that is dynamically
scoped over a rule application and reified as a named parameter of called rules; values held
in an environment are closures (the expression with the environment of the binding site).

- **Trace key.** A trace entry is keyed by **(source element, rule, environment)**. Never
  "one target per source": B creates several targets for one source element, one per
  environment, and A must not be specified in a way B would have to break.
- **Inherited environment.** Implicit resolution looks up the entry under the **caller's**
  environment. Until B ships the environment is always empty, so this is vacuous and A0's
  behaviour is the whole of it.
- **Containment (A).** Implemented in the executor, §5.3.1 (P-2026-11-02-1956). The placed
  target is not marked `__nested` at claim time: other bindings may point at it, and marking
  it then would make the pointer depend on rule order. It is marked `__nested` and `__placed`
  after pass 2 (P-2026-11-02-2108), and the write-back materializes it with the nested path
  by that marker alone (§9.2, P-2026-11-02-2024).
- **Called and lazy rules (B).** A called rule is invoked from a binding or a `forall` body,
  binds its arguments, and returns the target it creates; it takes no part in pass-1 matching.
  `lazy` creates on first demand, `unique lazy` memoizes on (rule, arguments, environment).
  The write-back stops assuming one target per source id before B ships.

**Two rulings on how the planned points relate (R-JTG-6, R-JTG-7; planned, not implemented).**

1. *Containment under A and B (R-JTG-6).* A containment resolves (source, rule, caller's
   environment) and creates the entry on demand when absent. Under A the environment is empty
   and pass 1 has created the entry, so it is a lookup; under B a new environment has no entry
   yet, so it is a fresh subtree. A call of a rule not declared `unique` always creates a fresh
   subtree, even under an environment seen before, so one expression may be placed twice with
   the same bindings. The double-claim error (R-JTG-4) applies to implicit resolutions and to
   `unique` rules.
2. *Rules for lowering (R-JTG-7).* Rules meant for lowering are declared `lazy`: they never
   match in pass 1 and create a target only when a resolution or a call reaches the node.
   Matched rules stay for the elements the transformation maps as such. Containment under A
   alone therefore does not serve library expressions; that value arrives with B.

#### 5.3.3 Called rules, the environment, lazy rules (B1)

Implemented by P-2026-11-02-2224, P-2026-11-02-2247 and P-2026-11-02-2321, in the executor.
The app's write-back of several targets per source element is B2 (list below).

- **Calls.** A called rule is a JjEL function. Calling it during an expression yields a
  demand, which the receiving binding carries out before it resolves its value: the rule is
  applied, its target created and returned, then placed as any rule target (§5.3.1). Each call
  applies the rule afresh, unless the rule is `unique`. A delegating rule (`= expression`, §3.4b) returns what its
  expression lowers to; what is left a source element resolves through the trace.
- **Environment.** Each application runs under an environment, a chain of frames binding names
  to closures. It is the caller's, unless a called rule receives one through a parameter typed
  `Env`. `extendEnv(names, values)` returns a frame over the current environment, every value a
  closure over the current environment, which is its binding site. `envHas(name)` tests a name;
  `envLookup(name)` yields the bound value, lowered under the closure's environment and not the
  caller's, so names are not captured. `envValue(name[, env])` (P-2026-11-08-0740) returns the
  bound value as bound, never a demand: a string a string, an integer an integer, a source
  element the element, so it can be concatenated, computed with and navigated (`envValue("s").name`)
  in a called rule, a helper body, a guard or a `forall` collection; with a second argument, an
  `extendEnv` marker, it reads that environment instead of the current one. An unbound name
  stops the run as a failing builtin does (§10); `envHas` is the test.
- **A demand is not a value.** The demand of a called rule or of `envLookup` is carried out only
  where a binding places it: as a binding's whole value, an element of a list, a branch of
  `if-then-else`, an argument of a call, or a `let` (R-JTG-15). As the operand of an operator
  (`envLookup(n) + "_w"`, `envLookup("w") + 1`, `-envLookup("w")`, `1 - mk(c)`) it stops the run
  (P-2026-11-08-0740, §10); before, `+` wrote `"[object Object]_w"` or `null` with `success true`.
  Read a bound value with `envValue`, or bind the demand with `let` first.
- **Implicit resolution under an environment.** Under a non-empty environment, a source element
  reached by a binding is lowered by its matched rule under that environment, once per
  (rule, source, environment), and its targets are traced with that key; environments compare
  structurally, by the closures they make visible. Under the empty environment the pass-1
  target answers, as before. A delegating matched rule is applied when a binding first reaches
  its element, or in pass 2, whichever comes first.
- **Lazy rules (R-JTG-7).** A lazy rule never matches in pass 1: it applies when a binding
  reaches a node of its source class, under the environment of that moment. The lazy rules of
  a class are candidates; the one whose guard holds applies (no guard always holds), and none
  or several is an error naming the candidates. A class may have both a matched and a lazy rule
  (R-JTG-18, P-2026-11-04-0015): the lazy one never matches in pass 1, so it does not compete with
  the matched one under R-JTG-3. Provisional, not ratified (R-JTG-20): a binding that reaches a
  node of such a class is settled by the type of its feature: the lazy rules whose target fits it, when no matched rule's does; the
  matched rule's pass 1 target, when no lazy rule's does; an error naming both, when both fit or
  the feature has no known type (`binding 'f' reaches Cls 'c1', lowered by matched ... and lazy
  ...`). `resolve()` still finds the matched target only (R-JTG-13). A lazy node nothing reaches creates no target and no root.
- **`unique`.** A `unique lazy` rule applies once per (rule, source, environment); a later
  reach under an equal environment returns the same target. A `unique rule` (R-JTG-16,
  P-2026-11-03-2111) applies once per (rule, arguments, environment): a second call with the
  same arguments under an equal environment returns the same target. Arguments compare by
  value key, a source element by its id, any other object by identity; an `Env` argument is
  left out of the arguments and counts as the environment of the application. Placing that one
  target twice is the double-claim error of R-JTG-4.
- **`let` (R-JTG-15).** A `let` holds the value of its expression, computed once, at the
  binding (P-2026-11-03-2111, #515): the calls and the `envLookup` closures it holds are
  carried out there, so two uses of the name are the same object, and a `unique` or a fresh
  rule is applied once per `let`, not once per use. A source element bound by a `let` stays
  the element: it is not lowered at the `let`, and `$x.name` navigates the source as before.
- **Containment under B (R-JTG-6).** A call of a rule not `unique`, a reach of a lazy rule not
  `unique`, and the lookup of a bound value each lower to a fresh subtree, once per `let` that
  holds them (R-JTG-15), even under an
  environment seen before: one expression may be placed twice, with the same bindings or with
  different ones. A bound value whose class has a matched rule is lowered anew by that rule
  under its binding site's environment, even an empty one, never resolved to the shared pass-1
  target; that new target is not traced, so a reference to the element still means its pass-1
  target. Its descendants follow their own rules: matched classes resolve through the trace, so
  a value to be placed twice is lowered by lazy rules (R-JTG-12). The double-claim error (R-JTG-4)
  remains for implicit resolutions and `unique` rules. Tested: a bound `Add(Const 5, Const 6)`
  placed twice with `Const` matched raises one containment conflict per `Const`, and with `Const`
  lazy places two separate subtrees (`called-lazy-rules.test.ts`, P-2026-11-03-0539).
- **Non-termination.** More than 256 nested applications (calls, delegations, closures) stop the
  run with one error naming the application stack, innermost first: rule, source element, and
  the bindings visible in each frame.

**Left for B2.** Done by P-2026-11-02-2338; item 4 decided by R-JTG-13.
1. Done. The app's write-back kept one target per source id (the map at
   `components/project/ProjectEditor.tsx:1809`, as cited by P-2026-11-02-2247): lazy, called and
   fresh targets can be several per source element. Root targets are now found by the identity
   of the executor object (`makeRootTargetIndex`, `nestedMaterialization.ts`); `__sourceId` is a
   fallback only when it names exactly one root, otherwise the pointer is skipped with a warning.
   A pointer array is deduplicated by target identity, not by source id, so two fresh targets of
   one source stay two pointers.
2. Done. The optional `isPlacedIn` of `nestedMaterialization.ts` is removed.
3. Done, nothing to change. The legacy `trace` Map, which called, lazy and fresh targets do not
   fill, is read only by `hooks/useJjtlExecutor.ts`, as a fallback when `traceModel.links` is
   empty; every called, lazy and fresh target has a trace link, so no consumer loses one.
4. Decided (R-JTG-13, 2026-11-03), nothing to change. `resolve()`, `resolveAll()` and
   `{ __ref }` lookups find matched targets only, never a lazy node: a lazy node is reached by a
   binding's value, not by an explicit `resolve()`.
5. Done. A non-abort error raised under a delegating matched rule in pass 2, a lazy-rule
   selection error among them, is an error of that element, `Failed to lower <Class 'x'> by rule
   '<label>': <message>` with the application stack, and the other elements are still lowered;
   the depth limit still ends the run.

### 5.4 Per-Binding Invertibility

Each binding is classified at runtime:

| Binding form | Invertible? | Inverse expression |
|---|---|---|
| Direct `label := name` | Yes | `name := label` |
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

### 7.4 All instances of a type: search `data`

`data` is the whole source array (§4.2: every object of the model, contained ones included), so
the idiom for "every instance of type T" is a collection search over it, filtered on `className`:

```
data.filter(t => t.className == "DataType" and t.name == "Integer").first()
```

This is how Class2Relational finds the Integer type from any element, whatever its container
(`docs/discovery/discovery_2026-11-03_jjtl_class2relational.md`, W3). There is no
`T.allInstances` (searched `frontend/src/jjtl/` and `frontend/src/jjel/`, positive control
`resolveAll`, P-2026-11-03-1434), and none is added for now (#519, low): `data.filter` covers the
need, and a second spelling would be a language-surface change of its own.

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

The kind is the second argument of `input`, a string literal: `input("Name?", "string")`. Both
parsers accept exactly the kinds below, compared after lowercasing; any other kind is a parse
error.

| Type | Widget |
|---|---|
| `string` | Text input field |
| `number` | Numeric input |
| `boolean` | Checkbox / toggle |
| `date` | Date picker |
| `select` | Dropdown from options array |

> **Implementation status:** The executor runs `AlertStatement`, `NotifyStatement`, `PromptExpression`, `InputExpression` and `ConfirmExpression` through the UIBridge. An `input` call opens the host dialog with its kind, its default pre-filled and, for `select`, its evaluated options, and returns the value entered, or `null` when the dialog is cancelled. The interactive expressions open a dialog only as the whole right-hand side of a binding; see §3.5 for the nested case.

---

## 9. JjOM Integration

### 9.1 Source Model Conversion

The conversion that actually runs lives in `ProjectEditor.handleExecuteTransformation`:
it reads `sourceModel.allSubObjects` **once** per Execute (the accessor rescans the whole
store on each access), maps each object to `{ id, name, className, __type, ...features }`,
wraps reference values as `{ __ref: pointerId }` and enum values as the literal's **name**,
and computes `_containerId` for contained objects. See §4.2.

The shape of a feature follows its declared upper bound (`components/project/jjtlSourceValues.ts`,
P-2026-11-03-0539): a many-valued feature (upper bound `-1` or above `1`), attribute, reference or
containment alike, is always a list, `[]` when empty and a one-element list for one value; a
single-valued feature is the bare value, `null` when empty. A slot with no declared feature keeps
the shape by count (none `null`, one bare, several a list). Until then the shape was by count for
every feature, so a many-valued feature with one value reached the rules as a single value:
`coll.map(...)` failed with `Unknown method 'map'` and a `forall` over it produced nothing. A
string value repeated in one slot, a Pointer id among them, is kept once on a feature declared
`unique` (the default) and kept every time on a feature declared `unique=false`
(P-2026-11-03-1553, #474).

`jjodelConverter.ts` also provides `convertJjodelModelToSource(model)`, which converts
`LModel.objects` to `SourceElement[]`. It is **not** on the execution path.

### 9.2 Target Model Write-back

> **Not in jjodelConverter.** Lives in `ProjectEditor.tsx` with timing workarounds.
> `convertResultToJjodel()` exists in the converter, is imported by the executor, and is
> **never called**: it is not the write-back. Left in place pending a decision.

Rule-level instances (STEP 6, 6b, 8, 8b):

1. Create `DObject.new(instanceOf, father, fatherType, name, persist)` inside a TRANSACTION
2. IDs are temporary during TRANSACTION — cannot use them immediately
3. `DVertex.new` runs **after** the TRANSACTION: it opens its own, and nesting creators
   loses coordinates (root `CLAUDE.md` §3.3)
4. After TRANSACTION: `setTimeout(1000)` → locate object by name via `lModel.objects`
   (`resolveSeeded` declares ambiguity instead of resolving it)
5. Write attribute values through `writeAttribute` (see below)
6. Write reference values with `setValueAtPosition(i, id, { isPtr: true })`

Nested objects (STEP 6c), i.e. what `-> feature { ... }` created:

7. `LValue.addObject(json, className)` on the parent's `$feature` slot. **It opens its own
   TRANSACTION around `DObject.new3`**, so it runs outside STEP 6's, for the same reason as
   `DVertex.new`, and every call stays top-level. It runs at the top of the STEP 8 timeout,
   where `lModel.objects` is populated. The walk goes **level by level, to any depth**
   (`components/project/nestedMaterialization.ts`): roots are found by name as in STEP 8,
   every object below them by the id `addObject` returned for it.
8. The slots of an object `addObject` has just created do not answer synchronously (measured
   at 90-316 ms). Each level polls the slot it writes into, by id, every **50 ms with a cap of
   3 s per level**; a slot that does not answer leaves its subtree **unplaced**, with a warning.
9. The child is created with **`{}`**. Its `name` and its remaining attributes are queued
   against the **real id `addObject` returned** and written on a further timer, past
   `addObject`'s own deferred value seeding (`U.UpdatingTimer * 2`), once the walk is done.
   A name in the `addObject` json is refused for a second same-named sibling in one slot, and
   outright on a class with no `name` attribute (decision R-S1-6): such a class never
   receives a `name`.
10. Objects left unplaced are counted and listed in the JjTL output panel
    (`SystemEvents.JJTL_NESTED_MATERIALIZED`).

Rule targets placed in a containment (slice A, §5.3.1) take the same path; there is no second
writer:

11. STEP 6 does not create a target listed in `targetModel.containment`: no root DObject, no
    DVertex, no entry in the source-id map. A feature's children for STEP 6c are its `__nested`
    objects, one test: the executor marks a placed target `__nested` too (P-2026-11-02-2108),
    in the feature's order, so a created object and a placed target share one containment.
    A placed target's own features are walked the same way, to any depth.
12. A placed target is created with `{}` by `addObject`, polled and capped as above, and its
    declared attributes are queued by the created id (ticket #445 applies unchanged).
13. The walk returns the id it created for every executor object. A `__ref_result` held by a
    created or placed object is queued against that id instead of being dropped; on a key that
    is not a reference of its class it is warned and dropped.
14. Pointers are written in a second phase: when STEP 6c runs, every pointer, the roots'
    included, is written after the last level is created and its attributes seeded. A pointer
    to a placed target resolves by the id the walk returned; a pointer to a root keeps the
    `__sourceId` → name path.

**Design decision — children are resolved by id, not by name.** The STEP 8/8b name pool
stays `lModel.objects` (the roots). Two tables may each own a column called `id`: a name
lookup could not tell them apart, and widening the pool would only make the rule-level
lookups ambiguous without serving any case. A pointer to a contained object, a placed target,
resolves by the id the walk returned for it (item 14), never by name. This is design, not a
limitation.

**Design decision — enum values travel as strings.** The executor carries an enum value as
the literal's **name**, which is also how the source side serializes it. `writeAttribute`
resolves it at the last moment: when the target attribute is typed by a `DEnumerator` and
the value names one of its literals, it writes that literal's **pointer** with
`setValueAtPosition(0, literal.id, { isPtr: true })`, because that is how the D-layer stores
an enum. A string naming no literal is written as-is, with a warning. This keeps the
executor free of Jjodel pointers and confines the D-layer knowledge to the write-back.

**Every value that does not reach the model is now named.** A key that is neither an
attribute of the target class, nor a resolved reference, nor a nested creation is reported
with the instance, the feature and the reason. It used to fall between the attribute
whitelist (`allAttributes`, which excludes references) and the `__ref_result` channel
without a word. This holds at every depth: a key of a nested object that is neither an
attribute nor a nested creation nor a resolved reference is warned with its path, and an object
that could not be placed is reported as above.

---

## 10. Error Handling

| Situation | Behavior |
|---|---|
| Source class not found | Silently skip (no instances to match) |
| Rule target class not in the target metamodel | **Error** before pass 1 (R-JTG-17): `Target class 'Nope' not found in target metamodel (A -> Nope). Nothing is written.` The run returns no target model, as for an abstract target |
| Nested creation of a class not in the target metamodel (`-> feature { -> Ghost { ... } }`, `forall x in xs -> Ghost { ... }`) | **Error** before pass 1, the same as a rule target (R-JTG-17, nested case, ratified 2026-11-04): `Target class 'Ghost' not found in target metamodel (object creation in Table.columns). Nothing is written.`, or `(forall in B)`. No target model. A creation inside a `let` body is checked the same way, at any depth (R-JTG-22), and so is an abstract class; the shape of the creation is not checked there |
| A binding reaches a node whose class has both a matched and a lazy rule, and the feature type fits both or is unknown | **Error** naming both rules (R-JTG-20, provisional, not ratified; §5.3.3) |
| Guard evaluation error | Log warning, skip instance (treated as false) |
| Expression evaluation error | Log warning, return `null` |
| Builtin call that fails inside an expression (`range(null)`, a helper, a called rule) | **Error** on both parse paths, never a warning with `null` (R-FA-11): `Builtin 'range' failed in expression at line L, column C (rule 'Core -> M', source element 's'): <reason>`, naming the rule and the source element with the wording of a failing method (R-FA-13): those being evaluated when the builtin failed, the location that of the outermost expression. The same in a binding, a `where` guard, a `forall` collection and a helper body. In a feature or attribute mapping the mapping stops (`Failed to map ...`); in a `where` guard the run stops (`Execution failed: ...`). A call to a name that resolves to nothing (`Function 'f' is not defined`) stays an expression evaluation error |
| JjEL method that fails inside an expression: a method the value's type does not have (`"4".log2()`), or a library method that throws (`4.toFixed(200)`) | **Error** on both parse paths, as a failing builtin (R-FA-12, extends R-FA-11): `Method 'log2' failed in expression at line L, column C (rule 'Core -> Module', source element 'rv_mc4'): Unknown method 'log2' for type String...`: the location is that of the outermost expression, the rule and the source element those being evaluated when the method failed. The same in a binding, a `where` guard (the run stops), a `forall` collection and a helper body. Out of it, unchanged, a warning with `null`: a method called on null (a missing feature reads as null: `Cannot call method 'log2' on null`) and a call on a model element that has no feature of that name (`c.nofeature()`, a missing feature). A failure inside a lambda passed to a collection method is the lambda's own: it stops only if it is itself a failed builtin or method |
| `envValue(name)` with `name` unbound in the environment read | **Error**, as a failing builtin (R-FA-11, R-FA-13): `Builtin 'envValue' failed in expression at line L, column C (rule '...', source element '...'): 'nope' is not bound in the environment; envHas tests it`. `envLookup` keeps `null` for an unbound name |
| A demand (of a called rule, or of `envLookup`) used as the operand of a binary or unary operator (`envLookup(n) + "_w"`, `envLookup("w") + 1`) | **Error** on both parse paths, worded as a failing builtin (R-FA-12, R-FA-13), naming the builtin or the called rule: `Builtin 'envLookup' failed in expression at line L, column C (rule '...', source element '...'): its result, a demand, is an operand of '+'; a demand is carried out only where a binding places it; bind it with let, or read a bound value with envValue`. A demand that a binding places (bare, in a list, in a branch of `if-then-else`, as a call argument, in a `let`) is not affected (§5.3.3) |
| Property path not found | Return `null` after trying all 4 strategies |
| Value mapping: no match | Return `null` |
| Object creation error | Log warning, assign `null` |
| Object creation with no feature | **Validation error**, nothing created |
| Feature of `-> feature { ... }` unknown | Warning naming instance and feature, nothing created |
| Wrapper body neither `-> Class` nor `forall` | Warning naming the feature, nothing created |
| `forall` element is an unresolvable `{ __ref }` | One warning per collection, element iterated unresolved |
| Value that reaches no attribute, reference or feature | Warning naming instance, key and reason |
| Binding to a feature the target class does not declare, own or inherited (`name := ...` on a class with no `name`) | One warning per binding, before the run, with the metamodel known (#445): `Rule 'B -> Box', binding 'name' at line L, column C: 'name' is not a feature of target class 'Kid'; the value is not written to the model.` Let bodies included. Nothing is created; the executor keeps the value on its object and the write-back writes declared features only |

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

A failed run (`success: false`) returns no target model: `targetModel` is `undefined`, so no caller
can write a partial one. Its errors, warnings and trace are returned as for any run (R-FA-14).

---

## 12. Implementation Status and Gaps

### 12.1 What Works (v0.1+)

| Feature | Status | Files |
|---|---|---|
| Lexer (all tokens) | ✅ | `lexer/lexer.ts`, `types/tokens.ts` |
| Parser (full grammar) | ✅ | `parser/parser.ts` |
| AST types | ✅ | `types/ast.ts` |
| Class mapping execution | ✅ | `executor/executor.ts` |
| `where` guards | ✅ | `executor/executor.ts` lines 404-470 |
| Direct attribute binding | ✅ | `executor/executor.ts` lines 619-673 |
| Value mapping conversion | ✅ | `executor/executor.ts` |
| Expression conversion (via JjEL) | ✅ | `executor/astBridge.ts` |
| Helper definition + calling | ✅ | `executor/executor.ts` lines 270-325 |
| Nested object creation into a target feature | ✅ | `executor/executor.ts`, `components/project/ProjectEditor.tsx` |
| `forall` in a mapping body | ✅ | `parser/parser.ts`, `executor/executor.ts` |
| Contained source instances | ✅ | `components/project/ProjectEditor.tsx` |
| Reference collections dereferenced in `forall` | ✅ | `executor/executor.ts` |
| `forall` over several variables (cartesian product, flat) | ✅ | `parser/parser.ts`, `executor/executor.ts` |
| Trace model (build + query) | ✅ | `executor/traceModel.ts` |
| Per-binding invertibility | ✅ | `executor/executor.ts` lines 678-776 |
| Bidirectionality analyzer | ✅ | `analyzer/bidirectionality.ts` |
| `resolve()` / `resolveAll()` builtins | ✅ | `executor/executor.ts` lines 285-306 |
| JjEL builtin delegation | ✅ | `executor/astBridge.ts` + `executor/executor.ts` |
| UIBridge interface + React components | ✅ | `executor/UIBridge.ts`, `executor/ReactUIBridge.ts`, `components/dialogs/*` |
| Monaco syntax highlighting | ✅ | `editor/` |
| JjOM source model conversion | ✅ | `executor/jjodelConverter.ts` |
| Called, `unique` called, lazy, `unique lazy` and delegating rules; the environment (B1, §5.3.3); a `let` holds its value (R-JTG-15) | ✅ executor; app write-back B2 | `parser/parser.ts`, `executor/executor.ts` |

### 12.2 Known Bugs

Each row reviewed against the code on 2026-11-03 (P-2026-11-03-1402) and reproduced by
`executor/__tests__/spec12-known-bugs.test.ts`, on both parser paths where a parse is involved.
The verdict leads the description: **real**, **fixed** with its commit, or **stale** with the
commit that made it so.

| Bug | Description | Severity |
|---|---|---|
| `.forAll(...)` never parses | **Stale on the app path.** JjEL takes any keyword as a member name since `3aa5993c8` (P-2026-10-21-0011), and both app callers of the JjTL parser pass `source` since `d3d42310c` (P-2026-10-31-1910), so `coll.forAll(x => p)` parses and the evaluator answers `Unknown method 'forAll' for type Array. Did you mean 'all'?`. JjEL has no `forAll` by design: the quantifier is `coll.all(x => pred)` (root `CLAUDE.md` §12.6). Only the legacy path (no `source`), reached by tests alone, still refuses it | — |
| 7 test files fail at import | **Fixed** in `e784e325d`: `executor.ts` took only `U.asNumber` from the `joiner` barrel and now holds a verbatim copy, so six of the seven load and pass (two stale expectations updated). `ai-prompt-sanitization.test.ts` still fails at import, through `services/AIMatcher`, not the executor. Full suite: import failures 9 → 3 | Low |
| Multiplicity `[*]` | **Settled** (R-JTG-21, P-2026-11-04-0900). `A -> B[*]` creates one target per source, `[n..*]` creates n, `[n]` creates n; no warning (§4.4). The warning of P-2026-11-04-0015 is removed | — |
| Number type | **Fixed, never observable.** The `EInt` tag on a bridged number literal was a dead write: the evaluator returns the literal's value and reads no tag, so `w := 3.5` and `v := 2 + 0.25` bound 3.5 and 2.25 on both paths before the change. A decimal literal is now tagged `EDouble` (`e784e325d`) | — |
| Duplicate values | **Stale for a flat array source**, the shape the app passes: each target receives its own source's values, on both paths. **Real and fixed** for a `{ classes, instances }` source, whose arrays the flat-object loop read a second time, matching every instance twice (`e784e325d`) | — |
| Double execution | **Stale, by reading only** (no app probe): there is no `<StrictMode>` in `src/` (`index.tsx` renders `<Provider><App/></Provider>`), Execute is a click callback and not an effect, and `handleExecuteTransformation` has carried a re-entry guard since `40fc9ff66` | — |
| Debug logging | **Fixed** in `e784e325d`: the seven live `console.log` of a run removed, two of them per binding per instance. A run writes nothing to `console.log` | — |
| Binding to an undeclared feature (#445) | **Fixed by a warning** in `e784e325d`. A nested creation lost `name` on a class with no `name` attribute, silently: the nested write-back writes declared attributes only and exempts `name` from its leftover check (`components/project/nestedMaterialization.ts`, `nestedAttributesOf` and the leftover loop). Now warned once per binding with rule, line and column (§10); nothing is created. The Output panel prints the warnings of a run since P-2026-11-03-1553 (#520), at most 20 lines and a count of the rest, all of them in the Trace tab; seen in the app on Class2Relational | — |

**One ambiguity left by design.** The parser produces two shapes for the same node, and
the executor tells them apart by `objectCreation.targetClass === targetAttribute`, which
the "nested mapping body" branch always yields. That is decisive except in one case: a
feature whose name is exactly the class it holds, written as `-> Column { -> Column { ... } }`.
It lands on the "wrapper body is neither form" warning rather than creating. Features are
lowercase by convention, so the case is theoretical; it is named here because it produces a
message, not silence.

### 12.3 Implementation Gaps (Priority Order)

| # | Gap | Description | Priority |
|---|---|---|---|
| 1 | **Implicit trace resolution** | Done for references, by identity, fallbacks reported (A0, §5.3.1), and for containments (A). The (source, rule, environment) key is in place; non-empty environments, lazy rules and fresh subtrees under B are done in the executor (B1, §5.3.3); the app write-back of several targets per source is B2 | High |
| 2 | **Alert/Notify execution** | Wire executor body items to UIBridge | High |
| 3 | **Prompt/Input execution** | Wire AST bridge to UIBridge for interactive expressions | High |
| 5 | **Reference mapping** | References: done (§5.3.1). Containments: done in the executor, placed targets leave `roots`, second claims and cycles are errors (A, §5.3.1, R-JTG-4). App write-back: done, placed targets created inside their container by the nested path (§9.2, P-2026-11-02-2024) | High |
| 6 | **Source alias** | Parse and bind `Person p -> Human` alias in executor | Medium |
| 7 | **Multi-model** | `from A, B to C, D` with qualified types | Phase 1 |
| 8 | **Called rules** | `rule name(params) -> Type { ... }`: done in the executor (B1, §5.3.3); write-back B2 | Phase 2 |
| 9 | **Lazy rules** | `lazy` / `unique lazy`: done in the executor (B1, §5.3.3); write-back B2 | Phase 2 |
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

-- Simple 1:1 mapping
State -> Place {
    name := name
    tokens := isInitial : true=1, false=0
}

-- 1:1 mapping with nested object creation
Transition -> Transition {
    name := label

    -- Input arc: source state -> this transition
    -> inputArcs {
        -> Arc {
            source := source       -- implicit trace resolution: State → Place
            weight := 1
        }
    }

    -- Output arc: this transition -> target state
    -> outputArcs {
        -> Arc {
            target := target       -- implicit trace resolution: State → Place
            weight := 1
        }
    }
}
```

### 13.2 Class Diagram to RDBMS

```jjtl
transformation Class2RDBMS
from ClassDiagram
to RDBMS

-- Only non-abstract, non-primitive classes become tables
Class -> Table where not isAbstract and not isPrimitive {
    tableName := name.snakeCase()
}

-- Attributes become columns
Attribute -> Column {
    columnName := name.snakeCase()
    columnType := mapType(type)
}

helper mapType(umlType: String) -> String {
    if umlType == "String" then "VARCHAR(255)"
    else if umlType == "Integer" then "INT"
    else if umlType == "Boolean" then "BIT"
    else "VARCHAR(255)"
}
```

### 13.2b ER to Relational — contained sources and iterated creation

The `Attribute` instances live inside `Entity.ownedAttributes`, so they are contained,
not roots (§4.2); `ownedAttributes` arrives as a collection of `{ __ref }` and is
dereferenced inside the `forall` (§3.3).

```jjtl
transformation ER2Relational
from ERD
to Relational

Entity -> Table {
    name := name

    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
            isPrimaryKey := a.isKey
            type := a.type : String=VARCHAR, Integer=INTEGER, Boolean=BOOLEAN
        }
    }
}

Relationship -> ForeignKey {
    name := name
    source := left        -- implicit trace resolution: Entity → Table
    target := right
}
```

The `Column` objects become DObjects **contained in** `Table.columns`; `type` is written
as a pointer to the `SqlType` literal named by the mapped value (§9.2).

### 13.3 With Interactive Features (target state)

```jjtl
transformation InteractiveMapping
from Source
to Target

Element -> TargetElement {
    name := name

    -- Ask user for confirmation on ambiguous mappings
    category := prompt("Category for " + name + "?", source.category)

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
    | PromptExpressionAST     // prompt("message", default) | prompt("message", Type [, default])
    | InputExpressionAST      // input("message", "string", default)
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
- Prompt/Confirm/Input execution, host mocked: `__tests__/jjel-path-interactive.test.ts` — the dialog opens and binds the answer on the JjEL path; the `input` default reaches the host on both paths (P-2026-10-31-2245); a call nested in an expression yields `null` with the same warning on both paths (P-2026-11-01-0110)

### Not Tested

- Helpers
- Multiple class mappings in one transformation
- Alert/Notify execution
- Cross-reference resolution
- Multi-attribute with complex conversions
- Edge cases for `evaluatePropertyPath`
- Implicit trace resolution
- Bidirectionality analysis integration
- JjOM round-trip (source conversion → execution → write-back)
