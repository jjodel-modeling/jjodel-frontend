# JjEL — Jjodel Expression Language Specification

## 1. Objectives and Design Principles

JjEL is a declarative expression language designed for navigating, querying, and transforming models within the Jjodel ecosystem.

### Design Criteria

1. **Maximum declarativity** — The user describes *what* they want, never *how* to compute it. No assignment, no loops, no mutation. Every expression is pure and produces a value without side-effects.

2. **Minimum cognitive load** — Few rules to remember, minimal syntax, no boilerplate. The most frequent MDE operations (naming convention conversion, hierarchy navigation, type filtering) are available as native methods.

3. **Maximum intuitiveness** — Textual logical operators (`and`, `or`, `not`), natural-language-like constructs (`forall`, `exists`, `implies`), and null-safe navigation (`?.`, `??`) that reads almost like prose.

### What JjEL Is NOT

| JjEL is not... | Because... |
|-----------------|------------|
| A constraint language (like OCL) | It does not assert what must be true — it computes values and selects sets |
| A programming language (like JS) | No variables, no loops, no side-effects, no I/O |
| A transformation language (like JjTL) | It does not define rules — it provides expressions *inside* rules |
| A query language (like SQL) | It does not query a database — it navigates a model graph in memory |

### Positioning

```
Formal constraints    Set-theoretic expressions    Scripting models         Programming
◄────────────────────────────────────────────────────────────────────────────────────────►
OCL                   JjEL                         EOL                      JavaScript

"what must             "which elements,             "manipulate the          "general-purpose
 be true"               which values"                model"                   computation"
```

JjEL has a **set-theoretic** semantics: its core construct (`forall`) selects and transforms sets of elements. It is more computational than OCL, more declarative than EOL, and specifically designed for the MDE domain.

**Scope boundary:** JjEL provides expressions for JjTL (Model-to-Model transformations). JjTL does not cover Model-to-Text generation (M2T). M2T has two homes that coexist: the legacy `DState.languages` subsystem (`doM2T`, with engines such as Handlebars), left as it is, and the code generator in `frontend/src/codegen/`, whose templates are JjEL interpolated strings (§9.4; R-GEN-10, R-GEN-13).

---

## 2. Types and Values

### Primitive Types

| Type | Literals | Examples |
|------|----------|---------|
| `EString` | Double-quoted strings | `"hello"`, `"Customer"` |
| `EInt` | Integer numbers | `0`, `42`, `-7` |
| `EDouble` | Decimal numbers | `3.14`, `.5`, `-2.7` |
| `EBoolean` | Boolean keywords | `true`, `false` |
| `null` | Null keyword | `null` |

### Composite Types

| Type | Literal | Examples |
|------|---------|---------|
| Array | `[elements]` | `[]`, `[1, 2, 3]`, `["a", "b"]` |
| Object | `{key: value, ...}` | `{}`, `{name: "hello", count: 42}` |
| Function | Lambda expressions | `a => a.name` |
| BitVector | none yet; built by `bits(w, v)` / `sbits(w, v)` | `bits(8, 255)`, `sbits(4, -1)` (§7.5) |

### Type Hierarchy (for `is` operator)

The `is` operator checks type membership including supertypes:
- Primitive aliases: `EString`/`String`, `EInt`/`Integer`, `EDouble`/`Double`/`Number`, `EBoolean`/`Boolean`
- Collection aliases: `Array`/`List`/`Collection`
- `Object`, `Null`
- `BitVector` (not an `Object`)
- JjOM types: `DClass`, `DPackage`, `DEnumerator`, etc.

---

## 3. Lexical Elements

### Keywords

| Category | Keywords |
|----------|----------|
| Set-theoretic | `forall`, `exists` |
| Logical | `and`, `or`, `not`, `implies` |
| Conditional | `if`, `then`, `else` |
| Type checking | `is` |
| Context | `with` |
| Imperative | `do` |
| Qualifier | `such`, `that` |
| Literals | `true`, `false`, `null` |

### Operators

| Category | Symbols |
|----------|---------|
| Arithmetic | `+`, `-`, `*`, `/`, `%` |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=` |
| Navigation | `.` (member access), `?.` (null-safe), `.[` (state access, §5.10) |
| Null handling | `??` (null coalesce) |
| Lambda | `=>` |
| Grouping | `(`, `)`, `[`, `]`, `{`, `}` |
| Separator | `:`, `,` |
| Assignment | `:=` (actions only, §5.10; an error in an expression) |

### Operator Semantics

- `+` is **polymorphic**: numeric addition, string concatenation, or array concatenation
- `*` with string and number: string repetition (`"ab" * 3` → `"ababab"`)
- Division by zero returns `null`
- `and`/`or` are **short-circuit**: right operand is not evaluated if the result is determined by the left operand

---

## 4. Grammar

### Precedence (lowest to highest)

| Level | Construct | Associativity |
|-------|-----------|--------------|
| 1 | `if ... then ... else ...` | right |
| 2 | `??` (null coalesce) | left |
| 3 | `implies` | right |
| 4 | `or` | left |
| 5 | `and` | left |
| 6 | `==`, `!=` | left |
| 7 | `<`, `>`, `<=`, `>=` | left |
| 8 | `is` | — |
| 9 | `+`, `-` | left |
| 10 | `*`, `/`, `%` | left |
| 11 | `not`, `-` (unary) | right |
| 12 | `.`, `?.` (postfix), `.[attr]`, `[index]` | left |

### Productions

```
expression     = forallExpr | existsExpr | withExpr | ifThenElse

forallExpr     = 'forall' IDENT 'in' expression
                   ('such' 'that' expression)?
                   (':' expression)?
                   ('do' expression)?

existsExpr     = 'exists' IDENT 'in' expression
                   (':' | 'such' 'that') expression

withExpr       = 'with' expression 'do' expression

ifThenElse     = 'if' expression 'then' expression ('else' expression)?
               | nullCoalesce

nullCoalesce   = implies (?? implies)*

implies        = logicalOr ('implies' logicalOr)?

logicalOr      = logicalAnd ('or' logicalAnd)*

logicalAnd     = equality ('and' equality)*

equality       = comparison (('==' | '!=') comparison)*

comparison     = isType (('<' | '>' | '<=' | '>=') isType)*

isType         = addition ('is' IDENT)?

addition       = multiplication (('+' | '-') multiplication)*

multiplication = unary (('*' | '/' | '%') unary)*

unary          = 'not' unary
               | '-' unary
               | postfix

postfix        = primary (
                   '.' IDENT ('(' argList ')')?
                 | '?.' IDENT ('(' argList ')')?
                 | '.[' IDENT ']'
                 | '[' expression ']'
                 )*

primary        = literal
               | IDENT
               | lambda
               | arrayLiteral
               | objectLiteral
               | '(' expression ')'

lambda         = IDENT '=>' expression
               | '(' IDENT (',' IDENT)* ')' '=>' expression

arrayLiteral   = '[' (expression (',' expression)*)? ']'

objectLiteral  = '{' (objectEntry (',' objectEntry)*)? '}'
objectEntry    = (IDENT | STRING) ':' expression

argList        = (expression (',' expression)*)?

literal        = STRING | NUMBER | 'true' | 'false' | 'null'

action         = postfix ':=' expression      -- parseAction only (§5.10)
```

---

## 5. Core Constructs

### 5.1 `forall` — Set Comprehension

`forall` is the **fundamental construct** of JjEL. It has set-theoretic semantics: it selects and optionally transforms elements from a collection.

**Syntax:**
```
forall <var> in <collection> [such that <condition>] [: <projection>] [do <action>]
```

**Forms:**

| Form | Returns | Description |
|------|---------|-------------|
| `forall x in S such that P` | Set | Filter: elements where P is true |
| `forall x in S: expr` | Set | Map: transform each element |
| `forall x in S such that P: expr` | Set + Map | Filter then transform |
| `forall x in S do action` | — | Imperative: execute action per element (JjTL only) |

**The separator roles:**

| Separator | Role | Introduces |
|-----------|------|-----------|
| `such that` | Filter | A boolean condition |
| `:` | Projection | A value expression |
| `do` | Action | An imperative command (JjTL context) |

Note: `such that` and `:` are **not** synonyms. They have distinct roles.

**Examples:**
```
-- filter only: public attributes
forall a in attributes such that a.isPublic

-- map only: attribute names
forall a in attributes: a.name

-- filter + map: names of public attributes in camelCase
forall a in attributes such that a.isPublic: a.name.camelCase()

-- complex projection
forall a in attributes: a.name + " " + a.type.toUpper()

-- filter + map + chaining
(forall a in attributes such that a.isPublic: a.salary).sum()

-- imperative (in JjTL context only)
forall a in attributes do createColumn(a)
```

### 5.2 `exists` — Existential Check

`exists` checks whether at least one element in a collection satisfies a condition. It always returns a **boolean**.

**Syntax:**
```
exists <var> in <collection> : <condition>
exists <var> in <collection> such that <condition>
exists <var> in <collection> | <condition>
```

Note: `|` is an alias for `such that`. The `:` separator is **NOT** accepted for `exists` — it is reserved exclusively for `forall` projections. This avoids ambiguity in nested expressions like `forall c in classes | (exists a in c.attrs | a.isPublic) : c.name`.

**Semantics:**
`exists x in S such that P` is equivalent to `(forall x in S such that P).isNotEmpty`

**Examples:**
```
exists a in attributes such that a.type == "String"
exists a in attributes | a.isPublic and not a.isDerived
```

### 5.3 `implies` — Logical Implication

**Syntax:**
```
<antecedent> implies <consequent>
```

**Semantics:**
`P implies Q` is equivalent to `not P or Q`, but reads as natural language.

**Examples:**
```
isAbstract implies subClasses.isNotEmpty
a.isPublic implies a.type != null
```

### 5.4 `with...do` — Context Binding

Establishes a context object whose properties are directly accessible in the body expression.

**Syntax:**
```
with <expression> do <body>
```

**Semantics:** Properties of the context object are resolved first during identifier lookup in the body. Useful in the Console where there is no implicit source.

**Examples:**
```
-- Console: explicit context
with selectedNode do name.pascalCase()

with selectedNode do forall a in attributes such that a.isPublic: a.name

-- Nested
with selectedNode do
  with attributes.first do name + ": " + type
```

### 5.5 `if...then...else` — Conditional

**Status: UNDER REVIEW** — The `if/then/else` syntax works but has a procedural flavor that may conflict with JjEL's declarative goals. It is retained for now pending evaluation of alternatives.

**Syntax:**
```
if <condition> then <trueExpr> [else <falseExpr>]
```

If `else` is omitted, the expression returns `null` when the condition is false.

**Examples:**
```
if isAbstract then "abstract" else "concrete"
if lowerBound == 0 then "NULL" else "NOT NULL"
(if attributes.size > 5 then "tbl_" else "") + name.snakeCase()
```

### 5.6 Lambda Expressions

Lambda expressions define anonymous functions, primarily used with collection methods that are not covered by `forall` (e.g., `sortBy`, `groupBy`).

**Syntax:**
```
<param> => <body>
(param1, param2) => <body>
```

**Examples:**
```
(forall c in classes: c).sortBy(c => c.name)
(forall a in attributes: a.type).groupBy(t => t)
```

### 5.7 Null-Safe Navigation

**Operators:**

| Operator | Behavior |
|----------|----------|
| `?.` | Returns `null` if left side is null (no error) |
| `??` | Returns right side if left side is null |

**Examples:**
```
parent?.name                     -- null if parent is null
parent?.name ?? "no parent"      -- "no parent" if parent or name is null
element?.container?.package?.name ?? "default"
```

### 5.8 Type Checking

**Syntax:**
```
<expression> is <TypeName>
```

Checks whether the value is an instance of the given type, including subtypes (kind-of semantics).

**Examples:**
```
element is DClass
element is DPackage
```

### 5.9 Index Access

**Syntax:**
```
<collection>[<index>]
```

Equivalent to `.at(index)`.

**Examples:**
```
attributes[0]                    -- first attribute
attributes[attributes.size - 1]  -- last attribute
```

### 5.10 State Access `.[x]` and Actions

Ratified in `docs/decisions.md` R-SIM-18, R-SIM-30 and R-SIM-39..43.

**Syntax:**
```
<path>.[<attribute>]                     -- read
<path>.[<attribute>] := <expression>     -- an action (parseAction only)
```

`e.f` is always navigation on the model, `e.[x]` is always state: the two never collide.
`.[` is one token (`. [` is not state access); the attribute is an identifier, never a
keyword; `?.[` is a lexer error (in JavaScript it is a computed access).

**Reading.** The path locates an element, the last segment is the attribute. The value
comes from the state hook of the evaluation context, which only the simulator sets:
anywhere else (Console, Jodie, validation) `.[x]` throws, never a silent `null`. A left
side that is not an element, and an attribute the hook does not know, throw as well.
`node.[x]` is the presentation state of the element the expression is attached to:
`node` is recognized by syntax there and never evaluated as a variable (elsewhere `node`
is the selected graph vertex). `x.[marked]` and `x.[tokens]` are read-only.

**Actions.** An action is not an expression: `parseAction` returns a separate type
(`JjelAction`), so no evaluator meets an assignment. Its target ends in `.[attribute]`
and is never `marked` or `tokens`. `:=` is lexed only by `parseAction`; in an expression
it stays an error.

**Strict parse.** `parseExpressionStrict` and `parseAction` require the end of the input;
`parseExpression` still drops trailing tokens (`a b` is `a`), a known defect with a ticket.

**Reserved names** (one list, `stateReserved.ts`, no lexer keyword): the roots `self`,
`event`, `model`, `node`; the attributes `marked`, `tokens`.

**Examples:**
```
self.target.[visits] + 1 < 3                           -- a guard
p.[tokens] < 2 and q.[marked]                          -- a guard over the marking
self.target.[visits] := self.target.[visits] + 1       -- an action
model.[i] := 0                                         -- a global attribute
```

---

## 6. Evaluation Rules

### 6.1 Identifier Resolution

In order of priority:
1. Built-in functions (`now()`, `String()`, etc.)
2. `with` context properties (if inside a `with...do`)
3. JjTL implicit source properties (if in a JjTL rule)
4. Context variables (scope chain)
5. `null` for undefined identifiers

### 6.2 Truthiness

| Value | Truthy? |
|-------|:-------:|
| `null` | No |
| `false` | No |
| `0` | No |
| `""` (empty string) | No |
| `[]` (empty array) | No |
| a bit-vector | none: a defect (§7.5) |
| Everything else | Yes |

### 6.3 Binary Operator Semantics

- `+`: string concatenation if either operand is string; numeric addition if both numbers; array concatenation if both arrays
- `*`: string repetition if string × number; numeric multiplication if both numbers
- `/`, `%`: return `null` on division by zero
- `==`: deep equality for arrays and objects
- `and`, `or`: **short-circuit** evaluation; return boolean
- `implies`: short-circuit; `P implies Q` ≡ `not P or Q`

### 6.4 Error Handling Policy

| Situation | Behavior |
|-----------|----------|
| Undefined variable | `null` (silent) |
| Property not found on object | `null` + console warning with typo suggestions |
| Method not found | `throw JjelEvaluationError` with suggestions |
| `.property` on `null` | `throw` error (use `?.` instead) |
| `?.property` on `null` | `null` (silent) |
| Division by zero | `null` (silent) |
| Type mismatch in arithmetic | `null` (silent) |

---

## 7. Built-in Methods

### 7.1 String Methods (33)

**Case:** `toUpper()`, `toLower()`, `capitalize()`, `uncapitalize()`
**Naming:** `camelCase()`, `pascalCase()`, `snakeCase()`, `kebabCase()`
**Whitespace:** `trim()`, `trimStart()`, `trimEnd()`, `padStart(n, char)`, `padEnd(n, char)`
**Search:** `contains(str)`, `startsWith(str)`, `endsWith(str)`, `indexOf(str)`, `lastIndexOf(str)`, `matches(regex)`
**Transform:** `replace(old, new)`, `replaceAll(old, new)`, `substring(start, end?)`, `slice(start, end?)`, `split(sep)`, `repeat(n)`, `reverse()`
**Info:** `length`, `isEmpty`, `isNotEmpty`, `isBlank`, `isNotBlank`, `charAt(i)`
**Conversion:** `toNumber()`, `toInt()`
**Format:** `quote()`, `format(pattern)`

### 7.2 Number Methods (30)

**Math:** `abs()`, `round()`, `floor()`, `ceil()`, `trunc()`, `sign()`, `sqrt()`, `pow(exp)`, `exp()`, `log()`, `log10()`, `log2()`
**Trigonometry:** `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`
**Format:** `toFixed(digits)`, `toPrecision(digits)`, `toExponential(digits)`, `toString()`, `toHex()`, `toBinary()`, `toOctal()`
**Check:** `isInteger()`, `isFinite()`, `isNaN()`, `isPositive()`, `isNegative()`, `isZero()`
**Range:** `clamp(min, max)`, `between(min, max)`, `mod(divisor)`, `div(divisor)`

### 7.3 Collection Methods (28)

With `forall` replacing `filter` and `map`, the remaining collection methods are:

**Aggregation:** `sum()`, `avg()`, `min()`, `max()`, `count()`
**Access:** `first`, `last`, `at(index)`, `indexOf(item)`
**Info:** `size`, `length`, `isEmpty`, `isNotEmpty`, `contains(item)`
**Structure:** `distinct()`, `distinctBy(fn)`, `sortBy(fn)`, `sortByDescending(fn)`, `reverse()`, `flatten()`, `flatMap(fn)`, `groupBy(fn)`
**Slicing:** `take(n)`, `skip(n)`, `takeWhile(fn)`, `skipWhile(fn)`
**Join:** `join(separator)`
**Boolean:** `all(fn)`, `any(fn)`, `none(fn)`

Note: `filter` and `map` are **removed** — replaced by `forall` construct.

### 7.4 Date Methods (34 + 5 constructors)

Dates are represented as ISO 8601 strings.

**Accessors:** `year()`, `month()`, `day()`, `hour()`, `minute()`, `second()`, `millisecond()`, `dayOfWeek()`, `dayOfYear()`, `weekOfYear()`, `quarter()`
**Predicates:** `isLeapYear()`, `daysInMonth()`, `isBefore(date)`, `isAfter(date)`, `isSameDay(date)`
**Arithmetic:** `addDays(n)`, `addMonths(n)`, `addYears(n)`, `addHours(n)`, `addMinutes(n)`, `addSeconds(n)`
**Boundaries:** `startOfDay()`, `endOfDay()`, `startOfMonth()`, `endOfMonth()`, `startOfYear()`, `endOfYear()`
**Differences:** `diffDays(date)`, `diffMonths(date)`, `diffYears(date)`
**Format:** `timestamp()`, `toISOString()`, `toDateString()`, `toTimeString()`, `format(pattern)`

**Global constructors:** `now()`, `today()`, `date(y, m, d)`, `datetime(y, m, d, h, min, s)`, `parseDate(str)`

### 7.5 Bit-vector Values (R-BV)

A bit-vector is a fixed-width, two-state value: a width `w` from 1 to 1024, a signedness, and `w` bits, with no `X` and no `Z` (R-BV-2). The bits are stored unsigned; signedness is an interpretation, used by comparisons, `sext`, `toNumber` and printing. The semantics lives in one module, `evaluator/builtins/bitvectors.ts`. A vector is printed in Verilog form, hex padded to the width: `8'hff`, `8'sh80`, `16'h0034`. Model data holds the width as an `EInt` and the value as an `EInt` or an `EString`; an expression builds the vector: `bits(self.width, self.value)`. A vector never enters the model data.

**Global constructors:** `bits(w, v)` (unsigned) and `sbits(w, v)` (signed), the only bit-vector globals. `v` is a safe integer or a decimal string (`'-12'`), which is a value and must be in range (`0 ≤ v < 2^w` for `bits`, `-2^(w-1) ≤ v < 2^(w-1)` for `sbits`); or a `0x`/`0b` string, which is a bit pattern that must fit in `w` bits (`sbits(8, '0xff')` is -1). Anything else is a defect, never a truncation. Being builtins, `bits` and `sbits` shadow a context variable of the same bare name: read a model feature called `bits` as `self.bits`.

**Operators.** `+`, `-`, `*` compute modulo 2^w; `<`, `<=`, `>`, `>=` follow the signedness; `==`, `!=` compare the bits; unary `-` negates modulo 2^w. Both operands must be vectors of the same width **and** the same signedness (stricter than Verilog, R-BV-3); widen with `zext`/`sext`/`trunc` and cast with `asSigned()`/`asUnsigned()`. Any other operand is a defect naming both kinds: `bits(8, 1) + 1` gives `'+' needs two bit-vectors of the same width and signedness, got 8-bit unsigned and number`; write `bits(8, 1) + bits(8, 1)`. Exceptions: `x == null` is `false` and `x != null` is `true`; `+` with a string concatenates the Verilog form. `/` and `%` are defects (R-BV-4). A vector has no truth value: `not x`, `if x`, `x and y`, `Boolean(x)` and a lambda predicate returning a vector are defects; compare explicitly, `x != bits(8, 0)`. Inside a collection, `==` of two vectors of different width or signedness is `false`, not a defect.

**Methods** (dispatched on the vector, like string and number methods):

| Method | Result |
|--------|--------|
| `width`, `signed` | the width; whether it is read signed |
| `slice(hi, lo)` | bits `hi..lo` inclusive, `0 ≤ lo ≤ hi < w` (Verilog `x[hi:lo]`), unsigned. Not the string `slice`, which is half-open |
| `bit(i)` | bit `i`, a 1-bit unsigned vector |
| `concat(y, ...)` | Verilog `{x, y, ...}`, the receiver in the high bits, unsigned |
| `replicate(n)` | Verilog `{n{x}}`, `n ≥ 1`, unsigned |
| `zext(w2)`, `sext(w2)` | extend to `w2 ≥ w` with zeros, or with copies of the top bit; signedness kept |
| `trunc(w2)` | the low `w2 ≤ w` bits; signedness kept. Not the number `trunc` |
| `and(y)`, `or(y)`, `xor(y)`, `not()` | bitwise, same pair rule as the operators |
| `shl(n)`, `shr(n)` | shifts with zero fill; `n` a non-negative integer or a vector read unsigned; a shift of `w` or more gives 0 |
| `ashr(n)` | arithmetic right shift: copies the top bit whatever the signedness |
| `asSigned()`, `asUnsigned()` | the same bits, read signed or unsigned (`$signed`, `$unsigned`) |
| `toNumber()` | the value as a number; a defect beyond ±(2^53-1) |
| `toVerilog()` | the Verilog form as a string |

Zero-argument methods also read without parentheses (`x.asSigned.toNumber`). Known limit: `and`, `or` and `not` are keywords, and the parser takes only an identifier after `.`, so `x.and(y)`, `x.or(y)` and `x.not()` do not parse yet; they are reachable once the parser accepts a keyword as a member name. `x[i]`, `with x do` and `.[x]` on a vector are not defined.

**Collections.** `distinct`, `distinctBy`, `groupBy`, `contains`, `indexOf` compare width, signedness and bits; `sortBy`, `min`, `max` order vectors under the pair rule; `join` and string interpolation print the Verilog form; `sum` and `avg` refuse vectors.

---

## 8. Contexts of Use

### 8.1 JjTL Guard Conditions

Guards select which source elements a transformation rule applies to. The source is **implicit** (declared by `from:`).

```
rule ClassToTable {
  from: DClass
  guard: not isAbstract
         and exists a in attributes | not a.isDerived
         and forall r in references such that r.target != null
}
```

### 8.2 JjTL Mapping Expressions

Mapping expressions compute values for target model properties.

```
rule ClassToTable {
  from: DClass
  mapping:
    tableName = name.snakeCase()
    columns = forall a in attributes: a.name + " " + a.type.toUpper()
    foreignKeys = forall r in references such that r.upperBound == 1: r.name.snakeCase() + "_id"
}
```

### 8.3 Console REPL

Interactive exploration and debugging. No implicit source — context must be explicit via `with...do` or qualified access.

```
> with selectedNode do name
"CustomerOrder"

> with selectedNode do forall a in attributes such that a.isPublic: a.name
["id", "name", "email"]

> with selectedNode do isAbstract implies subClasses.isNotEmpty
true
```

### 8.4 Validation / Invariants

```
forall c in classes: c.attributes.isNotEmpty
forall c in classes: c.isAbstract implies c.subClasses.isNotEmpty
(forall c in classes: c.name).distinct().size == classes.size
```

### 8.5 Derived Attributes

```
fullName = firstName + " " + lastName
requiredCount = (forall a in attributes such that a.lowerBound > 0).size
qualifiedName = package?.name + "." + name ?? name
isLeaf = subClasses.isEmpty
```

### 8.6 Value Expressions for Code Fragments

JjEL can compute string values that represent code fragments within M2M transformations. Full code generation (M2T) belongs to the code generator in `frontend/src/codegen/`, with JjEL templates (§9.4); the legacy `DState.languages` subsystem coexists (R-GEN-13).

```
forall a in attributes: "public " + a.type + " get" + a.name.pascalCase() + "()"
(forall r in references such that r.target.package != package: r.target.qualifiedName).distinct()
```

### 8.7 View Filters / UI Conditions

```
-- filterable elements
forall c in classes such that not c.isAbstract and c.isPublic

-- conditional label
label = name + if isAbstract then " (abstract)" else ""

-- conditional visibility
visible = attributes.isNotEmpty or references.isNotEmpty
```

### 8.8 Queries and Metrics

```
-- anti-pattern detection
forall c in allClasses such that c.isAbstract and c.subClasses.isEmpty
forall c in allClasses such that c.attributes.size > 10

-- metrics
(forall c in classes: c.attributes.size).avg()
(forall c in classes: c.allSuperclasses.size).max()
```

---

## 9. Open Points

### 9.1 `if/then/else` — Procedural flavor

The conditional `if P then A else B` works correctly but has an imperative connotation. Alternatives discussed:
- `when P then A otherwise B` — more declarative
- `A given P, B otherwise` — value-first (parsing challenges)
- Keep as-is — familiar, unambiguous, works inside larger expressions

**Status:** Retained for now. May be revisited.

### 9.2 Property Access Without Parentheses

Some string methods work as properties (no parentheses): `name.toUpper`, `name.trim`. Others require parentheses: `name.capitalize()`. This inconsistency is confusing.

**Proposal:** Methods with zero arguments may be invoked without parentheses. Methods with arguments require parentheses. This is a simple, memorable rule.

**Status:** To be decided.

### 9.3 DClass-Specific Properties in the Evaluator

`superclass`, `superclasses`, `allSuperclasses`, `subclass`, `subclasses`, `allSubclasses` are hardcoded in the evaluator. This is domain-specific logic inside the generic engine.

**Proposal:** Move to virtual property registration or implement a generic `closure` method (like EOL) for transitive navigation:
```
class.closure(c => c.superclass)     -- replaces allSuperclasses
class.closure(c => c.subclasses)     -- replaces allSubclasses
```

**Status:** To be decided.

### 9.4 String Interpolation

**Status:** Implemented, opt-in (R-GEN-10, 2026-10-10).

`"public ${a.type} ${a.name}"` interpolates only where interpolation is turned on: the lexer option `interpolation` (off by default, like `actionMode`) and the entry point `parseTemplate(source)`, the twin of `parseAction`, with a strict end of input. Through `parseExpression`, `parseExpressionStrict` and `parseAction` a string with a hole still fails to parse, so no expression that works elsewhere changes meaning.

- A hole holds any expression, lambdas whose bodies are interpolated strings included: `"${xs.map(x => "<${x.name}>").join(", ")}"`. Locations inside a hole are absolute in the template's source.
- `\$` writes a literal `$`, so `"\${x}"` is the text `${x}`. Single-quoted strings never interpolate.
- Without a Text host the value is a string: `null` renders as `''`, a collection as its items joined by `", "`, numbers and booleans with `String`.
- Two optional fields of the evaluation context serve the code generator (`frontend/src/codegen/`) and nothing else, both inherited by child scopes: `textHost`, a `JjelTextHost` that builds Text values from interpolations and takes over `+`, `join` and the rendering of a hole when a Text is involved; and `readObserver`, called with target, property and value on every member read that finds its property, `o.p` and `o.p()`.

### 9.5 `forall` Nesting

Nested `forall` expressions need validation:
```
forall a in (forall p in packages: p.attributes) such that a.isPublic: a.name
```

**Status:** Needs grammar validation and readability assessment.

---

## 10. Summary of Changes from Current Implementation

| Aspect | Current | New |
|--------|---------|-----|
| Lambda syntax | `a: expr` | `a => expr` |
| Set comprehension | — | `forall x in S such that P: expr` |
| Existential check | — | `exists x in S such that P` (or `exists x in S \| P`) |
| Implication | — | `P implies Q` |
| Context binding | — | `with obj do expr` |
| Index access | `.at(index)` only | `collection[index]` (+ `.at()`) |
| `and`/`or` | Not short-circuit | **Short-circuit** |
| `filter()` / `map()` | Collection methods | **Replaced by `forall`** |
| `:` role | Lambda parameter separator | Projection in `forall`, predicate in `exists` |
| `such that` | — | Filter condition in `forall` |
| `do` | — | Imperative action in `forall`, body in `with` |
