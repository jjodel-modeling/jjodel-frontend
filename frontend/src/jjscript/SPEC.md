# JjScript — Jjodel Scripting Language Specification

> **Status:** living reference, generated from the implementation under `frontend/src/jjscript/`.
> Where this document and the code disagree, **the code is authoritative**.
>
> **Positioning.** JjScript is the *imperative* scripting language of the Jjodel
> ecosystem. It manipulates metamodels (M2) and models/instances (M1) through
> plain-text, one-line commands. It is not a general-purpose programming language:
> there are no loops, no local control flow, no closures. What it does not say in
> its own syntax it delegates to **JjEL**, the pure expression language
> (`src/jjel/SPEC.md`), for query, filter and value-computation.
>
> ```
> Manipulate the model          Query / compute a value
> ◄─────────────────────────────────────────────────────►
> JjScript (imperative)      JjEL (pure expressions)
> "do this to the model"      "which elements, what value"
> ```
>
> The three languages of the system, for contrast:
>
> | Language  | Nature                     | Own evaluator | Lives in              |
> |-----------|----------------------------|---------------|-----------------------|
> | **JjEL**  | Pure expression            | Yes           | `src/jjel/`           |
> | **JjTL**  | Model-to-model transform   | No (delegates to JjEL) | `src/jjtl/`   |
> | **JjScript** | Imperative commands     | Yes (executor) | `src/jjscript/`       |

---

## 1. Architecture

```
            ┌──────────┐   tokenize   ┌─────────┐    parse    ┌─────┐
input ────► │  Lexer   │ ───────────► │ Parser  │ ──────────► │ AST │
 (a string) └──────────┘   Token[]    └─────────┘  CommandNode └──┬──┘
                                                                  │
            ┌─────────────────────────────────────────────────────┘
            ▼
     ┌────────────┐   dispatch    ┌─────────────────────────────┐
     │  Executor  │ ────────────► │  one handler per command     │
     │ (singleton)│               │  create / set / delete / …   │
     └────────────┘               └──────────────┬──────────────┘
                                                 │  D-layer actions
                                                 ▼
                                    Jjodel model (Redux / joiner)
```

| Piece | File(s) | Responsibility |
|-------|---------|----------------|
| Token types, AST, args, literals, context | `types.ts` | The language's type surface. |
| Reserved words (the one list) | `reservedIdentifiers.ts` | Commands, element types, keywords, booleans. |
| Lexer | `parser/lexer.ts` | Characters → `Token[]`. Case-sensitive keyword classification. |
| Grammar helpers | `parser/grammar.ts` | Parse qualified names, multiplicities, types, literals. |
| Parser | `parser/parser.ts` | `Token[]` → `CommandNode` (AST). |
| Executor | `executor/executor.ts` | Dispatch AST → handler; history; M1/M2 routing; guards. |
| Command handlers | `executor/commands/*.ts` | One file per command (semantics below). |
| Service (UI/Jjodie glue) | `services/JjScriptService.ts` | Reads active context, strips `/` prefix, history. |
| Detection / normalizer | `normalizer/*.ts` | Legacy natural→formal `/…` rewriting (auxiliary path). |

**Execution flow.** `JjScriptService.execute(input)` resolves the active project,
level (`M1`/`M2`), model and metamodel, then calls `executeCommand(...)`, which
tokenizes, parses, and dispatches the AST through `JjScriptExecutor.executeAST`.
A **singleton** executor is keyed by `(projectId, modelId, targetMetamodelId,
level, scopeBound)`; changing any of those yields a fresh executor so `self` and
routing always see the correct host.

**Batch / multi-line.** `executeBatch` runs lines in order and **stops at the first
error**. `executeScript` first groups `do … end` / `forall … do … end` blocks that
span multiple lines into a single command (`groupBlockCommands`), then batch-runs.

---

## 2. Lexical grammar

### 2.1 Tokens

| Token | Examples | Notes |
|-------|----------|-------|
| `COMMAND` | `create`, `set`, `delete` | Lowercase command words. |
| `KEYWORD` | `type`, `in`, `to`, `abstract` | Lowercase keywords and element-type words. |
| `IDENTIFIER` | `Person`, `myAttr` | Letters, digits, `_`; not a reserved word. |
| `QUALIFIED_NAME` | `Pkg::Class`, `Pkg::Class.attr` | Joined by `::` and optional `.member`. |
| `STRING` | `"hello"`, `'world'` | Escapes: `\n \t \r \\ \" \'`. Value stored unquoted. |
| `NUMBER` | `42`, `3.14`, `-5` | Int or decimal; leading `-` allowed. |
| `BOOLEAN` | `true`, `false` | Lowercase only. |
| `MULTIPLICITY` | `[0..1]`, `[1..*]`, `[*]`, `[+]`, `[?]`, `[0..5]` | See §2.6. |
| `OPERATOR` | `=`, `+=`, `-=` | Assignment / collection ops. |
| `PUNCTUATION` | `(` `)` `[` `]` `{` `}` `,` `;` `.` `:` `$` `@` `#` | |
| `ARROW` | `->`, `<->` | (Legacy reference notation.) |
| `COMMENT` | `// …`, `/* … */` | Stripped by the lexer; not parsed. |

### 2.2 Case sensitivity — the single most important lexical rule

**Keywords, commands and element types are case-sensitive and must be lowercase.**
`attribute` is a keyword; `Attribute` is an ordinary identifier (a valid class name).
This is deliberate: it keeps the door open for classes named `Class`, `Attribute`,
`Reference`, etc. A name is reserved **only** in its exact lowercase spelling.

Consequence (measured): a command word or a boolean can never be an element name
(`copy` is reserved, `Copy` is not); an element type or keyword *can* be declared,
but a later script cannot then address that element by its bare name.

### 2.3 Reserved words (the one list, `reservedIdentifiers.ts`)

- **Commands (21):** `create delete rename set add remove move copy list show
  help undo redo clear export import validate extends eval let forall abstract`
- **Element types (17):** `class  abstract class  interface  attribute  reference
  containment  composition  operation  parameter  package  enum  enumeration
  literal  model  metamodel  project  annotation  instance`
- **Keywords (26):** `to from in of as with type extends implements abstract
  readonly derived transient volatile containment opposite default ordered unique
  cascade force deep brief full tree`
- **Booleans (2):** `true false`

`RESERVED_IDENTIFIERS` is the set of the 63 single-word members (words containing a
space, i.e. `abstract class`, are excluded). `isReservedIdentifier(name)` tests exact
membership.

### 2.4 Qualified names

| Form | Example | Meaning |
|------|---------|---------|
| Simple | `Person` | A name in scope. |
| Package-qualified | `domain::Person` | Path of segments joined by `::`. |
| Deep | `domain::sub::Person` | Multiple segments. |
| Member access | `Person.name` | `Class.attribute` (last dotted part). |
| Full | `domain::Person.name` | Package path + member. |

The last dotted segment, when it is a bare identifier, is treated as the **member**
(e.g. an attribute on a class); everything before it is the package/class path.

### 2.5 Values and literals

| Value | Spelling |
|-------|----------|
| String | `"hello"`, `'world'` |
| Number | `42`, `3.14`, `-5` |
| Boolean | `true`, `false` |
| Null | `null` |
| Array | `[1, 2, 3]`, `["a", "b"]` |
| Enum literal | `Status::ACTIVE` (or `Status.ACTIVE`) |
| Variable | `$name` (in `let` bodies and `set` values) |

### 2.6 Multiplicity

Accepted spellings (brackets optional): `[0..1]`, `[1..*]`, `[*]`, `[0..5]`, and the
shorthand `*` (0..*), `+` (1..*), `?` (0..1), a bare `n` (n..n).

| Shorthand | Range | Meaning |
|-----------|-------|---------|
| `[1]` / `1` | 1..1 | exactly one |
| `[0..1]` / `?` | 0..1 | optional |
| `[1..*]` / `+` | 1..* | one or more |
| `[0..*]` / `*` / `[*]` | 0..* | many |
| `[0..5]` | 0..5 | bounded |

### 2.7 Types

| Kind | Spelling |
|------|----------|
| Primitive | `String`, `Integer`/`int`, `Boolean`/`bool`, `Float`/`double`, `Date`, `Object`/`Any`, `Void` |
| Ecore primitives | `EString`, `EInt`, `EBoolean`, `EDouble`, `EFloat`, `EDate`, … (accepted for attributes) |
| Class | `MyClass`, `Package::MyClass` |
| Collection | `List<String>`, `Set<MyClass>`, `OrderedSet<…>`, `Bag<…>`, `Sequence<…>` |

Type aliases are normalized by `TYPE_ALIASES` (`types.ts`); attribute creation
additionally maps user spellings to E-prefixed names (`create.ts →
PRIMITIVE_ATTRIBUTE_TYPES`). A class or enum **named after a primitive alias** is
coerced to that primitive in a `type` clause — a known sharp edge.

---

## 3. Commands — M2 (metamodel)

> **Level rule.** M2 commands modify the **metamodel** and are refused when the
> executor's level is `M1` (error `WRONG_LEVEL`): *"Open a metamodel editor (M2)…"*.
> Conversely, M1 instance commands are refused at `M2`.

### 3.1 `create`

```
create <elementType> <name> [in <parent>] [options…]
```

`<elementType>` is one of: `class`, `abstract class`, `interface`, `attribute`,
`reference`, `containment`, `composition`, `operation`, `parameter`, `package`,
`enum`, `enumeration`, `literal`.

**Options by element type** (order-free; read until the line ends):

| Element | Options |
|---------|---------|
| class / interface | `abstract`, `extends <Class>`, `extends <A> extends <B>` (multiple) |
| attribute | `type <T>`, `[multiplicity]`, `default <value>`, `derived`, `readonly`, `transient`, `volatile`, `unsettable`, `id` |
| reference | `type <Class>`, `[multiplicity]`, `containment`, `container`, `opposite <ref>`, `resolveProxies` |
| containment / composition | shorthand for `reference … containment` |
| operation | `returns <T>` (or `return <T>`), parameters via separate `create parameter` |
| literal | `value <int>` (or `= <int>`) |
| package | `nsUri "…"` / `uri "…"`, `nsPrefix <p>` / `prefix <p>` |

**Semantics.**
- The parent is resolved **scoped to the target metamodel first**, then project-wide
  (backward compat). The parent's kind is validated against the element type:
  attributes/references/operations → class; parameter → operation; literal → enum;
  class/enum/package → package or model. Wrong kind or missing parent ⇒ error.
- **Name uniqueness** is checked once, against the prospective father's namespace
  (`checkM2NameUniqueness`): a true duplicate is **refused**; a case-only near-homonym
  (`dupprobe` next to `DupProbe`) is **legal and reported as a warning**, not a conflict.
- For a class, every `extends` target is resolved **before** the class is created; an
  unresolvable superclass fails the command rather than leaving a half-made element.

**Examples.**
```
create class Person
create abstract class Entity
create interface Named
create class Employee extends Person
create attribute name in Person type String
create attribute age in Person type Integer default 0 [0..1]
create reference manager in Person type Person [0..1]
create containment children in Person type Person [0..*]
create reference spouse in Person type Person [0..1] opposite spouse
create package domain
create package entities in domain nsUri "http://ex.org/entities" prefix ent
create enum Status in domain
create literal ACTIVE in Status value 0
create operation greet in Person returns String
create parameter msg in greet type String
```

### 3.2 `delete`

```
delete [type] <target> [in <parent>] [cascade] [force]
```

- `[type]` is optional and **narrows resolution** to that kind (so `delete attribute
  mood` cannot silently hit an enum named `Mood`).
- `in <parent>` folds into a member target (`Person.name`).
- `cascade` deletes contained elements; `force` deletes even when referenced.
- **Refusals:** `MEMBER_NOT_FOUND`, `AMBIGUOUS_TARGET` (qualify with `::`),
  `TYPE_MISMATCH` (resolved element is not the named kind), `HAS_DEPENDENCIES`
  (use `force`/`cascade`).
- The delete goes through the canonical cascade (`element.delete()`), which fires its
  own `TRANSACTION`; editor-v2 canvas vertices/edges for the element are dropped first
  so no dangling ReactFlow nodes remain.

```
delete Person
delete class Person cascade
delete attribute name in Person
delete domain::OldClass force
```

### 3.3 `rename`

```
rename [type] <target> [in <parent>] to|as <newName>
```

- New name must be a valid identifier (M2) — `INVALID_NAME` otherwise.
- Uniqueness verdict as in `create`: duplicate refused (`NAME_CONFLICT`), near-homonym
  legal + warning.
- The write goes through the **L-layer `set_name` setter** (not a raw `SetFieldAction`)
  so the owning element re-emits its side effects (e.g. `LClass` fires
  `ClassNameChanged.<id>`, `LAttribute` re-infers its type).

```
rename Person to Human
rename class Person to Human
rename attribute oldAttr in Person to newAttr
rename reference items in Order to orderItems
```

### 3.4 `set`

```
set <target>.<property> = <value>
set <target>.<property> to <value>
set <target>.<property> += <value>     (append to collection)
set <target>.<property> -= <value>     (remove from collection)
set <target>.<property> = [v1, v2, …]  (replace a collection, #211)
```

**Property surface by element** (from `set.ts → getPropertyInfo`):

| Element | Settable properties |
|---------|--------------------|
| class | `abstract`, `interface`, `singleton`, `superTypes`, `attributes`, `references`, `operations`, `name`, `annotations` |
| attribute | `type`, `lowerBound`/`lower`, `upperBound`/`upper`, `derived`, `changeable`, `readonly`, `transient`, `volatile`, `unsettable`, `iD`/`id`, `defaultValueLiteral`/`default` |
| reference | `type`, `lowerBound`, `upperBound`, `containment`, `container`, `opposite`, `resolveProxies` |
| operation | `type`, `parameters`, `exceptions` |
| package | `uri`, `prefix`, `classifiers`, `subPackages` |
| enum | `literals` |
| literal | `value` |

**Sharp edges (deliberate):**
- `readonly` is the **inverse** of `changeable`: `set X.attr.readonly = true` writes
  `changeable = false`.
- `default` maps to `defaultValueLiteral`.
- `set <el>.type = <Name>` is a **classifier pointer**: resolved with a kind rule per
  element (attribute → primitive or enum; reference → class; parameter/operation →
  primitive, class or enum). Unknown / ambiguous type ⇒ `UNKNOWN_TYPE` /
  `AMBIGUOUS_TYPE` — **not** a silent string fallback.
- `+=` / `-=` only apply to array-valued properties (e.g. `superTypes`).
- `= [v1, v2, …]` replaces the whole collection, order as written; elements are literals or
  names (`set Person.superTypes = [Animal, Plant]`). A single-element `[1]` never parses as a
  list: the lexer reads it as a multiplicity (`[*]`, `[+]`, `[?]` too) — a known sharp edge.

```
set Person.abstract = true
set Person.singleton = true
set Person.age.readonly = true
set Person.superTypes += Animal
set Person.superTypes = [Animal, Plant]
set Person.name.default = "Unknown"
set r.type = Person
```

### 3.5 `add`

```
add <type> <name> to|in <parent> [options…]
```

`add` is **syntactic sugar for `create` with an explicit parent** — `executeAdd`
rewrites to `executeCreate`. If you try to `add` an existing element by name (a link),
the parser points you to the real form: `set <Instance>.<reference> += <name>`.

```
add attribute email to Person type String
add reference manager to Employee type Employee [0..1]
```

### 3.6 `remove`

```
remove <element> from <container>      (take an element out of a collection — not destroy)
remove extends from <class>            (clear all superclasses of the class)
```

- The first form removes `<element>` from whichever collection of `<container>` holds
  it (`NOT_IN_COLLECTION` otherwise). The element itself is **not deleted**.
- The second form clears the class's `extends` list entirely.

```
remove name from Person
remove Employee from MyPackage
remove extends from Employee
```

### 3.7 `move`

```
move <element> to <destination>
```

Validated by kind (class/enum → package|model; attribute/reference/operation → class;
parameter → operation; literal → enum; package → package|model) and against **circular
containment** (cannot move an element into its own descendant).

```
move Person to NewPackage
move myAttr to OtherClass
```

### 3.8 `copy`

```
copy <element> to <destination> [as <newName>] [deep]
```

Creates a copy in the destination; `as` names it, `deep` copies contained elements too.
Without `as`, a non-clashing name is generated.

```
copy Person to MyPackage as PersonCopy
copy MyPackage to OtherModel deep
```

### 3.9 `extends` (inheritance shorthand)

```
<ChildClass> extends <ParentClass>
```

Equivalent to `set ChildClass.superTypes += ParentClass`. **Adds** to the superclass
list (supports multiple inheritance); idempotent if already present; **refuses circular
inheritance** (`CIRCULAR_INHERITANCE`). Both operands must be classes.

```
SoftGoal extends Goal
Employee extends Person
domain::Manager extends domain::Employee
```

### 3.10 `abstract` (toggle)

```
abstract <ClassName>
```

**Toggles** the `abstract` flag on a class (abstract → concrete, and back). Target must
be a class (`NOT_A_CLASS` otherwise).

```
abstract Person        // now abstract
abstract Person        // back to concrete
```

### 3.11 `list`

```
list [type] [in <scope>]
```

`type` may be `all` or an element type; plural forms accepted (`classes`, `attributes`,
`enums`, …). `in <scope>` filters to a container.

```
list                      // everything
list class
list classes
list attribute in Person
list enums in domain
```

### 3.12 `show`

```
show <target> [brief|full|tree]
show project
show model
```

`brief` = minimal, `full` = all properties (default), `tree` = hierarchical.

```
show Person
show Person tree
show project
show model full
```

### 3.13 `validate`

```
validate [target|all]
```

Runs validation over the target (or the whole project) and reports error / warning /
info counts plus up to five of each.

```
validate
validate all
validate Person
```

### 3.14 `help`

```
help
help <command>            // e.g. help create
help <elementType>        // e.g. help reference
help syntax
help examples
```

### 3.15 `undo` / `redo` / `clear`

```
undo [n]                  // undo last n actions (default 1)
redo [n]                  // redo last n actions
clear [history|selection|console]
```

`undo`/`redo` operate on the executor's undo/redo stacks. `clear` resets a UI surface.

---

## 4. Commands — expressions (JjEL-backed)

These three bridge JjScript's imperative core to **JjEL**'s pure expression engine.
The collection/filter/value expressions are JjEL, evaluated against a context built
from the active metamodel (`buildEvalContext`, `eval.ts`).

### 4.1 `eval`

```
eval <JjEL expression>
```

Evaluates one JjEL expression and prints the result. A bare unknown identifier is
surfaced as `UNDEFINED_VARIABLE` rather than a silent `null`.

**Context variables available in JjEL** (from `buildEvalContext`):
`classes`, `attributes`, `references`, `packages`, `enumerations`, `instances`,
`metamodel`, `project`, `data` (selected element), `node` (selected graph vertex) —
plus **each class registered by name** (`State`, `Person`, …) and uniquely-named
instances by bare name.

```
eval classes
eval classes.size
eval forall c in classes : c.name
eval exists c in classes such that c.isAbstract
```

### 4.2 `let` (scoped bindings)

```
let $a = <expr>, $b = <expr>, …
in <command | block … end>
```

- Bindings are evaluated **sequentially**; later bindings may reference earlier ones.
- A binding may be a **JjEL expression**, or one of two UI-bridge calls:
  - `prompt('message', EString[, 'default'])` → `UIBridge.showPrompt`
  - `confirm('message')` → `UIBridge.showConfirm`
- `$variable` references in the body are substituted before execution (supported in
  `set` values and `rename` new-names, and recursively in blocks).

```
let $n = prompt('Name', EString),
    $upper = $n.toUpper()
in set Mario.name = $n

let $name = prompt('New name', EString)
in rename Person to $name
```

### 4.3 `forall` (iterate + command)

```
forall <var> in <collectionExpr> [such that <filterExpr>] do <command | block … end>
```

- `<collectionExpr>` must evaluate to an **array** (`FORALL_TYPE_ERROR` otherwise).
- Optional `such that <filterExpr>` filters element-by-element.
- The body runs **once per element**, with the iteration variable bound. Inside the
  body, the variable name is rewritten to the element's name
  (e.g. `rename c to …` → `rename Person to …`).
- **Disambiguation:** the parser looks ahead — a `do` at paren-depth 0 makes it the
  JjScript `forall…do` command; a top-level `:` makes it a **JjEL** `forall` set
  comprehension (delegated to `eval`). `exists …` and a leading `with …` are likewise
  routed straight to JjEL.

```
forall c in classes do delete c
forall c in classes such that c.isAbstract do rename c to "Abstract_" + c.name
forall a in Person.attributes do set a.readonly = true
```

### 4.4 `do … end` block (sequential commands)

```
do
  <command>
  <command>
  …
end
```

Runs the commands in order and **stops at the first error** (`Block: failed at command
i/n …`). A single-command body after `do`/`in`/`such that` is also accepted without the
`end` when there is exactly one command.

```
do
  create class A
  create attribute x in A type String
  set A.abstract = true
end
```

---

## 5. Commands — M1 (instances)

> **Level rule.** M1 commands require an active **model editor** (level `M1` with a
> model of conformity); otherwise `WRONG_LEVEL` / `NO_MODEL`.
>
> **Resolution & ambiguity.** An instance name is **not a key**: a model may hold
> several instances sharing a name. Resolution therefore returns a *list*; if more than
> one matches, the command **refuses** (`AMBIGUOUS_INSTANCE`) and names the candidates
> by metaclass — it never silently acts on "the first". Instances created earlier in the
> same run are tracked in a **handle registry** (keyed by id), so a freshly-created
> instance is always addressable by the handle it was created as, race-free.

### 5.1 `create instance`

```
create instance of <ClassName> ["<instanceName>"] [in <Parent>.<reference>]
```

- `<ClassName>` must exist in the metamodel of conformity (`CLASS_NOT_FOUND`), and be
  **concrete** (`ABSTRACT_CLASS`) and **non-singleton** (`SINGLETON_CLASS`).
- The instance name may be a quoted string (spaces allowed) or a bare identifier. Omit
  it to auto-generate `<ClassName>`, `<ClassName>2`, … (chosen free of names already
  taken in the model *and* reserved earlier in this run).
- `in <Parent>.<reference>` creates the instance **inside that reference's
  containment slot** (the father is the slot, a `DValue`). The reference must be a
  **containment** of the parent's class (`NOT_A_CONTAINMENT`), its type must accept the
  new class (`TYPE_MISMATCH`), and the slot must have room (`MULTIPLICITY_EXCEEDED`).
- The new instance is **not** listed at the model root when born in a slot.

```
create instance of Customer "Alice"
create instance of Customer            // auto-named Customer, Customer2, …
create instance of Order "o1" in Alice.orders
```

### 5.2 `set` (instance attribute or reference link)

```
set <Instance>.<attribute> = <literal>          (attribute)
set <Instance>.<attribute> = [v1, v2, …]        (vector attribute, #211)
set <Instance>.<attribute> += <literal>         (vector attribute, #211)
set <Instance>.<attribute> -= <literal>         (vector attribute, #211)
set <Instance>.<reference> = <OtherInstance>    (link)
set <Instance>.<reference> += <OtherInstance>   (append to multi-valued)
set <Instance>.<reference> -= <OtherInstance>   (remove)
set <Instance>.<reference> = null               (clear / unlink)
```

**Attribute branch.** The property must be a metaclass **attribute** (`UNKNOWN_PROPERTY`
otherwise); the value must be a literal (`TYPE_MISMATCH` if a name is given).

- **Single-valued** (upper bound 1): only `=` is allowed (`OPERATOR_NOT_SUPPORTED` for
  `+=`/`-=` — R-JS-13, as amended by #211); the literal replaces the slot.
- **Vector** (upper bound > 1 or `*`, #211):
  - `= [v1, v2, …]` — **replaces the whole vector**, order as written; `= []` and `= null`
    clear it; elements are primitive literals — a name, `null` or an enum literal in the
    list is `TYPE_MISMATCH`;
  - `+= <literal>` — appends while the slot has room; a bounded slot at its bound is
    `MULTIPLICITY_EXCEEDED`; **duplicates are kept**, as in the reference vectors;
  - `-= <literal>` — takes the element out by value, every copy; the slot does not hold it
    ⇒ `NOT_SET`, nothing is written;
  - a single literal with `=` keeps the committed behavior (first slot).

  All refusals are decided before any write; the slot is read only after the queued writes
  of earlier lines have landed (`settlePendingWrites`).

**Reference branch (link semantics).**
- `= Y` — single-valued slot: **replaces**; multi-valued: appends.
- `+= Y` — appends **only while the slot has room**; a full slot ⇒ `MULTIPLICITY_EXCEEDED`.
- `-=` / `remove … from` — removes by value; `NOT_LINKED` if absent.
- `= null` — clears the slot (`UNLINK`). `+= null` / `-= null` are refused.
- **Type check:** the target must be an instance of the reference's type or a subclass
  (`TYPE_MISMATCH`). A removal is **not** type-checked (taking a wrong-typed element
  out is how such a slot is repaired).
- **Orphan guard:** removing a containment child that was born in that slot and has no
  other place ⇒ `WOULD_ORPHAN` (delete it instead).
- Queued writes are drained before the slot is read (`settlePendingWrites`) so a
  `set` right after a `create`/link in the same block sees the committed state.

```
set Alice.name = "Alice Smith"
set Alice.age = 42
set Alice.tags = ["new", "urgent"]
set Alice.tags += "billable"
set Alice.tags -= "new"
set Alice.tags = null
set o1.customer = Alice
set o1.orders += newOrder
set o1.orders -= newOrder
set o1.customer = null
```

### 5.3 `delete instance`

```
delete <InstanceName>
```

Refuses singletons (`SINGLETON_INSTANCE`). Deletes the instance **and its contained
elements**, deepest first, container last, through the editor-v2 delete plan; releases
the handle and any pending-child slot claim.

```
delete Alice
delete o1
```

### 5.4 `rename instance`

```
rename <InstanceName> to <newName>
```

New name non-empty (`INVALID_NAME`); must not already be held by another instance
(`NAME_CONFLICT`); the handle is moved to the new name (same id).

```
rename Alice to Bob
```

### 5.5 `remove` (instance out of a reference)

```
remove <Instance> from <Owner>.<reference>
```

Exactly `set <Owner>.<reference> -= <Instance>`. The reference **must** be named
(`REFERENCE_REQUIRED`).

```
remove newOrder from o1.orders
```

---

## 6. Execution model & context

`ExecutionContext` (`types.ts`) carries what a command runs against:

| Field | Meaning |
|-------|---------|
| `projectId` | Active project. |
| `modelId` | Active M1 model (when level is `M1`). |
| `targetMetamodelId` | Metamodel that create/modify commands are scoped to; prevents the "added to the wrong class with the same name in another metamodel" bug. |
| `level` | `'M1'` (instance editor) or `'M2'` (metamodel editor, default). |
| `scopeBound` | `true` when the caller fixed the scope (a Jjodie reply). Then a bare name held only by *another* metamodel is refused before dispatch (`scopeGuard.ts`), instead of falling back project-wide. |
| `selectedElement` | The UI selection (feeds `data` / `node` in JjEL). |
| `history` | Command history (capped at 100). |
| `variables` | `Map` of `let`/`forall` bindings. |

**Guards & safety rails** (in `executor.ts` and `commands/`):
- **Profile permission guard** (`permissionGuard.ts`) — a standalone environment
  profile can forbid certain writes; refusal surfaces before the handler runs.
- **Dependency waiter** (`elementWaiter.ts` / `dependencies.ts`) — waits for elements a
  command depends on to become resolvable before executing.
- **Superclass / type resolution** — always metamodel-scoped first, then project-wide.
- **Uniqueness verdict** (`nameUniqueness`) — one rule shared by create and rename.
- **Undo** — model-mutating commands report `undoable: true` and are recorded in
  history; `undo`/`redo` walk the executor's action stacks.

**Result shape** (`ExecutionResult`): `{ success, command, message, data?, errors?,
warnings?, affectedElements?, undoable? }`. Errors carry a stable `code` (e.g.
`AMBIGUOUS_TARGET`, `TYPE_MISMATCH`, `MULTIPLICITY_EXCEEDED`, `WRONG_LEVEL`), a
`message`, and often a `suggestion`.

---

## 7. Error-code quick reference

| Code | Command(s) | Meaning |
|------|-----------|---------|
| `WRONG_LEVEL` | create/set/delete/rename/remove | Command's level (M1/M2) doesn't match the editor. |
| `NO_PROJECT` / `NO_MODEL` / `NO_METAMODEL` | all | Missing project / active model / metamodel of conformity. |
| `PARENT_NOT_FOUND` / `AMBIGUOUS_PARENT` | create | Parent missing, or the name answers to more than one. |
| `MEMBER_NOT_FOUND` | create/delete/rename/set | `Parent.member` where the member isn't on the parent. |
| `AMBIGUOUS_TARGET` | delete/rename/set | Name resolves to 2+ elements — qualify with `::`. |
| `TYPE_MISMATCH` | delete/create-instance/set | Resolved/linked element is not the required kind/type. |
| `NAME_CONFLICT` | rename | New name already taken in the namespace. |
| `HAS_DEPENDENCIES` | delete | Element is referenced; use `force`/`cascade`. |
| `NOT_A_CLASS` / `NOT_IN_COLLECTION` / `NOT_A_CONTAINMENT` | abstract/remove | Kind/containment precondition failed. |
| `CIRCULAR_INHERITANCE` | extends | Would create an inheritance cycle. |
| `FORALL_TYPE_ERROR` / `FORALL_ERROR` | forall | Collection not an array / evaluation failed. |
| `LET_ERROR` | let | Binding or body failed. |
| `UNDEFINED_VARIABLE` | eval | Bare identifier not in the JjEL context. |
| `JJEL_ERROR` | eval/let/forall | JjEL expression error. |
| `CLASS_NOT_FOUND` / `ABSTRACT_CLASS` / `SINGLETON_CLASS` | create instance | Metaclass missing / abstract / singleton. |
| `INSTANCE_NOT_FOUND` / `AMBIGUOUS_INSTANCE` | set/delete/rename/remove | Instance missing / name shared by 2+. |
| `MULTIPLICITY_EXCEEDED` | create/set | Reference slot full. |
| `NOT_LINKED` / `WOULD_ORPHAN` | set/remove | Target not in slot / removal would orphan it. |
| `UNKNOWN_PROPERTY` / `OPERATOR_NOT_SUPPORTED` | set | Property not on metaclass / operator not allowed. |
| `UNKNOWN_TYPE` / `AMBIGUOUS_TYPE` | set | `type` value not a valid/unique classifier. |

---

## 8. End-to-end examples

### 8.1 Build a small metamodel (M2)

```
create package library

create class Book in library
create attribute title in Book type String
create attribute isbn  in Book type String
create attribute year  in Book type Integer [0..1]

create class Author in library
create attribute name  in Author type String

create reference authors in Book   type Author [1..*]
create reference books   in Author type Book   [0..*] opposite authors

create enum BookStatus in library
create literal AVAILABLE in BookStatus value 0
create literal BORROWED  in BookStatus value 1

create attribute status in Book type BookStatus default AVAILABLE

create abstract class NamedElement
create attribute name in NamedElement type String
create class Person extends NamedElement
```

### 8.2 Modify & inspect (M2)

```
set Book.abstract = false
rename Author to Writer
move Book to newPackage
delete isbn
list classes
show Book tree
validate all
```

### 8.3 Drive a model from the metamodel (M1)

```
create instance of Person "alice"
create instance of Person "bob"
set alice.name = "Alice"
set bob.name    = "Bob"

create instance of Person "carol" in alice.friends     // containment slot
set alice.knows += bob
set alice.knows -= bob
delete bob
```

### 8.4 Scripted transformation with bindings & iteration

```
let $prefix = prompt('Prefix', EString, "v1")
in rename Person to $prefix + "_Person"

forall c in classes such that c.isAbstract do
  set c.abstract = false
end
```

---

## 9. Natural-language & legacy `/` syntax (auxiliary)

A **normalizer** (`normalizer/rules.ts`) rewrites common natural-language lines into the
legacy `/…` formal form (e.g. `create class Person` → `/add class Person`,
`create reference r in A type B [*]` → `/add A -> B as r [*]`). The **detector**
(`normalizer/detector.ts`) scores whether a block is JjScript at all (and guards against
it being JS/Python/SQL/etc.). This is an auxiliary path: the canonical route is the
parser in §1, and `JjScriptService.execute` strips a leading `/` before parsing. Treat
the `/…` forms as compatibility, not as the recommended syntax.

---

## 10. Code map (where to look)

| Concern | File |
|---------|------|
| Type surface (tokens, AST, args, literals, context) | `types.ts` |
| Reserved words | `reservedIdentifiers.ts` |
| Lexer / tokenization / case rules | `parser/lexer.ts` |
| Grammar helpers (names, multiplicity, types, literals) | `parser/grammar.ts` |
| Parser (AST construction, blocks, let/forall routing) | `parser/parser.ts` |
| Executor (dispatch, context, guards, batch, block) | `executor/executor.ts` |
| One handler per command | `executor/commands/*.ts` |
| M1 instance semantics (handles, links, orphans) | `executor/commands/instance.ts` |
| JjEL context builder (eval/let/forall) | `executor/commands/eval.ts` |
| Reference link planning | `executor/referenceWrite.ts` |
| Element/type resolution | `executor/resolvers.ts` |
| Name uniqueness verdict | `model/logicWrapper/nameUniqueness.ts` |
| Scope guard (bound replies) | `executor/scopeGuard.ts` |
| UI/Jjodie service + history | `services/JjScriptService.ts` |
| Natural→formal normalizer + detector | `normalizer/*.ts` |
| JjEL (the expression engine) | `src/jjel/SPEC.md`, `src/jjel/` |
