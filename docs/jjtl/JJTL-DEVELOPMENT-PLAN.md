# JjTL Development Plan — From Prototype to Complete Language

## Vision

JjTL (Jjodel Transformation Language) serves as both a **user-facing transformation language** and a **core execution language** that ATL and ETL can be translated into. It is designed for web-based metamodeling with AI assistance, progressive disclosure, and educational clarity.

---

## Current State (v0.1 — Proof of Concept)

**What works:**
- Transformation declaration (`transformation Name from MM1 to MM2`)
- Basic class mapping (`A -> B`)
- Direct attribute mapping (`name -> label`)
- Simple conversion expressions (`name -> label : name + '_suffix'`)
- Parser → AST → Executor pipeline
- Visual mapping editor with Manhattan arrows
- Monaco editor with syntax highlighting

**What doesn't work:**
- No trace model
- No cross-reference resolution
- No rule guards at execution level
- No called/lazy rules
- No collection operations
- No control flow
- No rule inheritance
- Single-input patterns only
- Single source / single target model only (no N:M)

---

## Development Phases

### Phase 1: Foundations (v0.2)
**Goal:** Make JjTL usable for real-world simple transformations

**Priority: CRITICAL — everything else depends on this**

#### 1.1 Trace Model
The trace model is the backbone of any M2M transformation. Without it, you cannot resolve cross-references between target elements.

**What it does:**
- Automatically records: which source element → which rule → which target element(s)
- Enables `resolve(sourceElement)` to find the corresponding target element
- Enables back-tracking for debugging and explanation

**Design:**
```typescript
interface TraceEntry {
    rule: string;              // rule name that created this
    sourceElements: Array<{    // source elements with model qualification
        modelName: string;     // which source model
        elementId: string;
    }>;
    targetElements: Array<{    // target elements with model qualification
        modelName: string;     // which target model
        elementId: string;
    }>;
    timestamp: number;
}

interface TraceModel {
    entries: TraceEntry[];
    resolve(sourceId: string, targetType?: string, targetModel?: string): any;
    resolveAll(sourceId: string, targetModel?: string): any[];
}
```

**JjTL syntax for trace access:**
```jjtl
// Implicit: when assigning a reference, the engine auto-resolves
// e.g., if Class -> Table exists, then:
Association -> ForeignKey {
    table -> owner : source.endType   // auto-resolved to Table via trace
}

// Explicit: resolve() function in expressions
Association -> ForeignKey {
    -> owner : resolve(source.endType)
    -> columns : source.ends->collect(e | resolve(e))
}
```

**Implementation tasks:**
- [ ] Design TraceModel data structure
- [ ] Build trace during executor's matching phase
- [ ] Implement `resolve()` and `resolveAll()` in JjEL
- [ ] Auto-resolve metamodel-typed bindings (ATL-style resolution algorithm)
- [ ] Trace visualization in the UI (which source produced which target)

#### 1.2 Rule Guards (Conditions)
Currently parsed but not executed.

**Syntax (updated):**
```jjtl
// Parentheses for conditions (not braces)
Class -> Table when (isAbstract == false) {
    name -> tableName
}

// Complex guards
Class -> Table when (not isPrimitive and attributes.size > 0) {
    name -> tableName
}
```

**Implementation tasks:**
- [ ] Update parser: `when ( expression )` instead of `when { expression }`
- [ ] Evaluate guard expression against each source instance in executor
- [ ] Filter source instances before applying mapping
- [ ] Update grammar diagrams

#### 1.3 Navigation Expressions in JjEL
Currently JjEL only supports simple property access. Need dot-navigation through references.

```jjtl
Class -> Table {
    // Navigate through references
    name -> tableName : source.package.name + '_' + name

    // Collection navigation
    -> columnCount : source.attributes.size
}
```

**Implementation tasks:**
- [ ] Implement dot-path navigation in JjEL evaluator
- [ ] Support reference traversal (not just attributes)
- [ ] Basic collection properties: `size`, `isEmpty`, `first`, `last`

#### 1.4 Multi-Model Support (N Sources → M Targets)
The current design assumes 1 source → 1 target. Real-world transformations require N:M.

**Why this must be in Phase 1:** The `from`/`to` declaration, the executor's model access, the trace model, and the type resolution all need to be model-qualified from the start. Retrofitting this later would require rewriting the entire pipeline.

**ATL, ETL, QVTo all support this:**
```
ATL:  create OUT1:Java, OUT2:Config from IN1:UML, IN2:Profile;
ETL:  transform c : UML!Class to t : RDBMS!Table, log : Audit!Entry
QVTo: transformation(in uml:UML, in profile:Profile, out rdbms:RDBMS);
```

**Proposed JjTL syntax:**
```jjtl
// Multiple source and target models
transformation MergeAndGenerate
from UML, Profile
to   Java, Config

// Type qualification with model name (dot notation)
// When unambiguous (type exists in only one model), qualification is optional
Class -> JavaClass {
    name -> className
}

// When ambiguous or cross-model access, qualify with model name
Class -> Java.JavaClass, Config.ConfigEntry {
    name -> className             // JavaClass.className
    name -> entryKey              // ConfigEntry.entryKey
}

// Access elements from different source models
Class -> JavaClass when (Profile.stereotypes->exists(s | s.appliedTo == source)) {
    name -> className
    -> annotations : Profile.stereotypes->select(s | s.appliedTo == source)
}
```

**Alternative qualification syntax options:**
```jjtl
// Option A: Dot notation (recommended — clean, familiar)
Profile.Stereotype
Java.JavaClass

// Option B: Bang notation (ATL-style)
Profile!Stereotype
Java!JavaClass

// Option C: Colon notation
Profile:Stereotype
Java:JavaClass
```

**Recommendation:** Dot notation (Option A) for consistency with JjEL navigation expressions. The `!` notation is ATL-specific and would be confusing. The `:` notation conflicts with conversion expressions.

**Grammar update:**
```ebnf
// Current (single model)
transformation = "transformation" IDENTIFIER
                 "from" IDENTIFIER
                 "to" IDENTIFIER
                 ( classMapping | helper )* ;

// New (multi-model)
transformation = "transformation" IDENTIFIER
                 "from" modelList
                 "to" modelList
                 ( classMapping | helper )* ;

modelList      = IDENTIFIER ( "," IDENTIFIER )* ;

// Type references become optionally qualified
qualifiedType  = ( IDENTIFIER "." )? IDENTIFIER ;

// Class mapping with multiple targets
classMapping   = qualifiedType "->" targetList
                 multiplicity? condition? mappingBody? ;

targetList     = qualifiedType ( "," qualifiedType )* ;
```

**Impact on executor:**
```typescript
interface TransformationContext {
    sourceModels: Map<string, Model>;    // name → model (was: single model)
    targetModels: Map<string, Model>;    // name → model (was: single model)
    trace: TraceModel;

    // Resolve type to model
    resolveType(qualifiedName: string): { model: Model; type: Class };

    // Find all instances across source models (or in a specific one)
    allInstances(typeName: string, modelName?: string): Instance[];
}
```

**Implementation tasks:**
- [ ] Update parser: `from modelList` and `to modelList`
- [ ] Update parser: `qualifiedType` with optional model prefix
- [ ] Update parser: multiple targets in class mapping (`A -> B, C`)
- [ ] Update AST: `TransformationDeclaration.sourceModels: string[]`, `.targetModels: string[]`
- [ ] Update executor: `TransformationContext` with `Map<string, Model>`
- [ ] Update executor: type resolution with model qualification
- [ ] Update executor: instance creation in correct target model
- [ ] Update trace model: entries qualified by model name
- [ ] Update UI: transformation editor shows multiple source/target models
- [ ] Backward compatible: single `from`/`to` still works (sugar for N=1, M=1)

**Scenarios to support:**

| Scenario | Example | Priority |
|----------|---------|----------|
| 1:1 (current) | `from UML to Java` | ✅ Already works |
| N:1 (merge) | `from UML, Profile to Java` | High |
| 1:M (split) | `from UML to Java, Config` | High |
| N:M (full) | `from UML, Profile to Java, Config, Deployment` | Medium |
| Same MM (endogenous) | `from UML to UML` | Medium (refining mode) |

---

### Phase 2: Rule System (v0.3)
**Goal:** Support the three fundamental rule types needed for ATL/ETL translation

#### 2.1 Matched Rules (Standard)
This is what JjTL already has, but needs formalization:
- Automatically match all source elements of the declared type
- Apply guard to filter
- Execute once per match

**Current syntax works:**
```jjtl
Class -> Table when (not isAbstract) {
    name -> tableName
}
```

#### 2.2 Called Rules
Rules explicitly invoked from other rules. Essential for imperative patterns.

**Proposed syntax:**
```jjtl
// Define a callable rule
rule createColumn(attr: Attribute, table: Table) -> Column {
    -> name : attr.name
    -> type : attr.type.name
    -> owner : table
}

// Call from a matched rule's body
Class -> Table when (not isAbstract) {
    name -> tableName
    -> columns : attributes->collect(a | createColumn(a, self))
}
```

**Implementation tasks:**
- [ ] New AST node: `CalledRuleDeclaration`
- [ ] Parser: `rule` keyword + parameter list + `->` return type
- [ ] Executor: callable rule registry, parameter passing
- [ ] Scope management (local variables within called rules)

#### 2.3 Lazy Rules
Rules triggered only when a source element needs to be resolved, not during global matching.

**Proposed syntax:**
```jjtl
lazy Attribute -> Column {
    name -> columnName
    type -> columnType : mapType(source.type)
}

// Usage: when a binding references an Attribute,
// the lazy rule fires automatically
Class -> Table {
    name -> tableName
    attributes -> columns    // triggers lazy rule for each attribute
}
```

**Unique lazy variant** (create target once, reuse on subsequent references):
```jjtl
unique lazy DataType -> SQLType {
    name -> typeName : mapDataType(name)
}
```

**Implementation tasks:**
- [ ] New AST node: `LazyRuleDeclaration` with `unique` flag
- [ ] Parser: `lazy` and `unique lazy` keywords
- [ ] Executor: lazy rule registry, on-demand execution
- [ ] Cache for unique lazy rules (memoization)
- [ ] Integration with trace model and resolution algorithm

#### 2.4 Rule Inheritance
Rules can extend other rules, inheriting source pattern and target bindings.

**Proposed syntax:**
```jjtl
// Base rule (can be abstract)
abstract Class -> Table {
    name -> tableName
}

// Sub-rule: inherits bindings, adds more
PersistentClass -> Table extends Class -> Table
    when (isPersistent) {
    -> primaryKey : createPrimaryKey(self)
}
```

**Implementation tasks:**
- [ ] `abstract` keyword for rules
- [ ] `extends` clause in rule declaration
- [ ] Binding merge logic (child overrides parent)
- [ ] Guard intersection (child guard AND parent guard)
- [ ] Multiple inheritance support (for ETL compatibility)

---

### Phase 3: Expressions & Collections (v0.4)
**Goal:** Rich expression language for complex transformations

#### 3.1 Collection Operations
Essential for any non-trivial transformation.

```jjtl
// Filtering
attributes->select(a | a.isPublic)
attributes->reject(a | a.isDerived)

// Transformation
attributes->collect(a | a.name)
attributes->collect(a | createColumn(a))

// Aggregation
attributes->exists(a | a.isPrimaryKey)
attributes->forAll(a | a.type != null)
attributes->size
attributes->isEmpty
attributes->first
attributes->last

// Flattening
packages->collect(p | p.classes)->flatten

// Sorting
attributes->sortBy(a | a.name)
```

**Implementation tasks:**
- [ ] Collection type in JjEL type system
- [ ] Iterator expressions (`->select`, `->collect`, `->reject`, etc.)
- [ ] Lambda/closure support for iterator body
- [ ] `flatten` operation
- [ ] `sortBy`, `first`, `last`, `at(index)`
- [ ] Set operations: `union`, `intersection`, `excluding`, `including`

#### 3.2 Conditional Expressions

```jjtl
// If-then-else expression
name -> targetName : if (source.alias != null) then source.alias else source.name endif

// Let expressions (local bindings)
name -> targetName : let fullName = package.name + '.' + name in fullName.toLower()
```

**Implementation tasks:**
- [ ] `if/then/else/endif` expression in JjEL
- [ ] `let/in` expression
- [ ] Ternary shorthand: `condition ? trueExpr : falseExpr` (optional)

#### 3.3 String Operations

```jjtl
name.toLower()
name.toUpper()
name.substring(0, 3)
name.trim()
name.startsWith('prefix')
name.endsWith('suffix')
name.replaceAll('old', 'new')
name + '_suffix'          // concatenation (already works)
```

#### 3.4 Type Operations

```jjtl
// Type checking
source.oclIsKindOf(PersistentClass)
source.oclIsTypeOf(Class)

// Type casting
source.oclAsType(PersistentClass).tableName
```

---

### Phase 4: Imperative Extensions (v0.5)
**Goal:** Support imperative patterns needed for QVTo translation and complex logic

#### 4.1 Imperative Blocks in Rules

```jjtl
Class -> Table when (not isAbstract) {
    name -> tableName

    do {
        // Imperative code executed after bindings
        for (attr in source.attributes) {
            if (attr.isPrimaryKey) {
                createPrimaryKeyColumn(attr, self)
            } else {
                createRegularColumn(attr, self)
            }
        }
    }
}
```

#### 4.2 Variables and Assignment

```jjtl
Class -> Table {
    do {
        var prefix = source.package.name
        var tableName = prefix + '_' + source.name
        self.name = tableName
    }
}
```

#### 4.3 Control Flow

```jjtl
// For loop
for (item in collection) { ... }

// While loop (with safety limit)
while (condition) { ... }

// If statement
if (condition) { ... }
else if (condition) { ... }
else { ... }

// Switch/match
match (source.visibility) {
    'public'    -> 'RW'
    'private'   -> 'NONE'
    'protected' -> 'R'
    default     -> 'NONE'
}
```

#### 4.4 Entry Point (Optional)

```jjtl
transformation UML2RDBMS
from UML
to   RDBMS

// Optional entry point — if absent, use declarative matching
main {
    UML.classes->select(c | c.isPersistent)->map class2Table()
}

// Explicitly called mapping
mapping class2Table(c: Class) -> Table {
    name -> tableName : 't_' + c.name
}
```

**Implementation tasks for Phase 4:**
- [ ] `do { }` block in rules (post-binding imperative section)
- [ ] `var` declarations and assignment
- [ ] `for/in`, `while`, `if/else` statements
- [ ] `match` expression
- [ ] Optional `main { }` entry point
- [ ] `mapping` keyword (QVTo-style explicit invocation)

---

### Phase 5: Modularity & Composition (v0.6)
**Goal:** Large-scale transformation organization

#### 5.1 Module System

```jjtl
// Import other transformation modules
import CommonHelpers from './common-helpers.jjtl'
import TypeMapping from './type-mapping.jjtl'

transformation UML2RDBMS
from UML
to   RDBMS

uses CommonHelpers, TypeMapping

// ... rules can use imported helpers
```

#### 5.2 Libraries (Helper-only modules)

```jjtl
library TypeMappingLibrary

helper mapUMLType(umlType: String) -> String {
    match (umlType) {
        'String'  -> 'VARCHAR(255)'
        'Integer' -> 'INT'
        'Boolean' -> 'BIT'
        'Date'    -> 'DATETIME'
        default   -> 'VARCHAR(255)'
    }
}

helper toSnakeCase(name: String) -> String {
    name.replaceAll('([a-z])([A-Z])', '$1_$2').toLower()
}
```

#### 5.3 Superimposition (Module Overlay)

```jjtl
// Base transformation
transformation Base_UML2RDBMS
from UML to RDBMS

Class -> Table { name -> tableName }

// Override specific rules
transformation Extended_UML2RDBMS
superimposes Base_UML2RDBMS

// This overrides the Class -> Table rule from base
Class -> Table when (not isAbstract) {
    name -> tableName : toSnakeCase(name)
    -> schema : source.package.name
}
```

---

### Phase 6: ATL Front-End (v0.7)
**Goal:** Parse ATL syntax and translate to JjTL Core

#### 6.1 ATL Parser
- [ ] ATL lexer (OCL-based tokens + ATL keywords)
- [ ] ATL parser → ATL AST
- [ ] ATL AST → JjTL AST translator

#### 6.2 Semantic Mapping

| ATL Construct | JjTL Equivalent |
|---------------|----------------|
| `module` | `transformation` |
| `create OUT1:MM1, OUT2:MM2 from IN1:MM3, IN2:MM4` | `from MM3, MM4` / `to MM1, MM2` |
| `MM!Type` (model-qualified type) | `Model.Type` (dot notation) |
| `from` pattern | Class mapping source |
| `to` pattern | Class mapping target + bindings |
| `matched rule` | Standard class mapping |
| `lazy rule` | `lazy` class mapping |
| `unique lazy rule` | `unique lazy` class mapping |
| `called rule` | `rule` (callable) |
| `helper def:` | `helper` |
| `attribute helper` | `helper` with memoization |
| `using` (local vars) | `do { var ... }` |
| `do` (imperative) | `do { ... }` |
| `thisModule.rule(x)` | `ruleName(x)` |
| `refining mode` | `transformation ... refining` (future) |
| OCL expressions | JjEL expressions |

#### 6.3 ATL Resolution Algorithm
The key complexity: ATL's implicit resolution when a binding evaluates to a source model element.

```
ATL: feature <- sourceElement
     → engine looks up trace: which rule matched sourceElement?
     → returns the corresponding target element

JjTL equivalent: feature -> target : resolve(sourceElement)
```

**Implementation tasks:**
- [ ] ATL parser (can start with subset)
- [ ] AST-to-AST translator
- [ ] Verify semantic equivalence with ATL Zoo examples
- [ ] ATL editor mode in Monaco (syntax highlighting)

---

### Phase 7: ETL Front-End (v0.8)
**Goal:** Parse ETL syntax and translate to JjTL Core

#### 7.1 ETL Parser
- [ ] ETL lexer (EOL-based tokens + ETL keywords)
- [ ] ETL parser → ETL AST
- [ ] ETL AST → JjTL AST translator

#### 7.2 Semantic Mapping

| ETL Construct | JjTL Equivalent |
|---------------|----------------|
| `transform c : MM!Type` | `Model.Type` source in class mapping |
| `to t : MM1!T1, t2 : MM2!T2` | `-> Model1.T1, Model2.T2` (multi-target) |
| `transform` rule | Class mapping with ordered execution |
| `guard` | `when ( condition )` |
| `equivalent()` | `resolve()` |
| `equivalents()` | `resolveAll()` |
| `::=` operator | Auto-resolve in binding |
| Rule inheritance | `extends` clause |
| `@greedy` | Execution annotation |
| `@lazy` | `lazy` keyword |
| `pre`/`post` blocks | `main { }` with pre/post sections |
| EOL expressions | JjEL expressions |

---

### Phase 8: Advanced Features (v0.9+)
**Goal:** Research-grade features

#### 8.1 Bidirectionality
- [ ] Invertibility analysis (which rules can run backwards?)
- [ ] Reverse transformation generation for invertible rules
- [ ] Consistency checking between forward/backward

#### 8.2 Incrementality
- [ ] Change detection on source model
- [ ] Incremental re-execution (only re-run affected rules)
- [ ] Live transformation preview

#### 8.3 Debugging & Explanation
- [ ] Step-through execution
- [ ] Trace visualization (source → rule → target graph)
- [ ] "Why was this element created?" explanations
- [ ] Breakpoints in transformation rules

#### 8.4 AI-Assisted Transformation
- [ ] "Suggest mappings" from metamodel analysis (already started)
- [ ] Auto-generate transformation from examples (by-example)
- [ ] Natural language to JjTL ("map all persistent classes to tables")
- [ ] Transformation repair suggestions

#### 8.5 Validation & Testing
- [ ] Pre/post conditions on transformations
- [ ] Contract-based testing
- [ ] Coverage analysis (which rules fired, which source elements matched)
- [ ] Metamodel conformance verification of output

---

## Cross-Cutting Track: Static Invertibility Analysis

**This is not a phase — it evolves incrementally alongside the main phases.**

### Concept

At parse time, every AST node is annotated with an `Invertibility` classification. This enables real-time feedback in the editor and eventually automatic reverse transformation generation. This is a novel research contribution: **"Static Invertibility Analysis for Model Transformations."**

### Invertibility Spectrum

Rather than binary yes/no, JjTL uses four levels:

| Level | Meaning | Example |
|-------|---------|---------|
| **Fully invertible** | Exact reverse can be generated automatically | `name -> label` |
| **Conditionally invertible** | Invertible under known constraints | `name -> label : name.toLower()` (only if source was lowercase) |
| **Partially invertible** | Some bindings reversible, others need defaults | Rule with 3/4 invertible bindings |
| **Non-invertible** | One-way only | `-> count : attributes.size` |

### Classification Rules

#### AST-Level (Static Analysis)

| AST Construct | Invertibility | Reason |
|---------------|--------------|--------|
| `srcAttr -> tgtAttr` (direct mapping) | ✅ Fully | Bijective 1:1 |
| `srcAttr -> tgtAttr : valueMapping` | ⚠️ Check | Only if bijective (no duplicate values) |
| `-> tgtAttr : literal` | ❌ Non | No source, value invented |
| `srcAttr -> tgtAttr : expression` | ⚠️ Analyze | Depends on expression (see below) |
| `when ( condition )` | ❌ Non | Filter = information loss |
| `do { ... }` | ❌ Non | Imperative = not statically analyzable |
| `lazy rule` | ⚠️ Check | Depends on trigger pattern |
| `called rule` | ❌ Non | Explicit invocation, complex control flow |
| `abstract rule` | ✅ Fully | Bindings inherited, analyzed per-binding |
| `rule extends ...` | ⚠️ Check | Depends on parent + child bindings |

#### Expression-Level (Recursive Analysis)

| Expression Type | Invertibility | Reason |
|----------------|--------------|--------|
| Property access (`name`) | ✅ Fully | Direct reference |
| String concatenation (`a + b`) | ❌ Non | Ambiguous split point |
| Concatenation with constant separator (`prefix + '_' + name`) | ⚠️ Conditional | Invertible if prefix is known/constant and separator is unambiguous |
| `toLower()` / `toUpper()` | ⚠️ Conditional | Lossy if original had mixed case |
| `substring(n, m)` | ❌ Non | Truncation = information loss |
| `trim()` | ⚠️ Conditional | Lossy if original had whitespace |
| `replaceAll(old, new)` | ⚠️ Conditional | Invertible only if replacement is bijective |
| `if/then/else/endif` | ❌ Non | Branch = information loss (which branch was taken?) |
| `let/in` | ⚠️ Analyze | Depends on body expression |
| `->select()` / `->reject()` | ❌ Non | Filtering = information loss |
| `->collect()` | ⚠️ Analyze | Depends on body expression |
| `->size` / `->isEmpty` | ❌ Non | Aggregation = information loss |
| `->first` / `->last` | ❌ Non | Selection from collection |
| `resolve()` | ✅ Fully | Trace-based, reverse trace available |
| Arithmetic (`a + 1`, `a * 2`) | ⚠️ Conditional | Invertible for linear operations |

### Data Model

```typescript
type InvertibilityLevel = 'invertible' | 'conditional' | 'partial' | 'non-invertible';

// Added to every AST node
interface InvertibilityAnnotation {
    level: InvertibilityLevel;
    reason: string;                    // human-readable explanation
    condition?: string;                // what would make it invertible (for 'conditional')
    reverseExpression?: string;        // the inverse expression (for 'invertible')
}

// Binding-level analysis
interface BindingAnalysis {
    sourceAttr: string;
    targetAttr: string;
    invertibility: InvertibilityAnnotation;
}

// Rule-level analysis (weakest-link principle)
interface RuleAnalysis {
    ruleName: string;
    overallLevel: InvertibilityLevel;  // worst of all bindings
    bindings: BindingAnalysis[];
    factors: string[];                 // what makes it non-invertible (guards, do blocks, etc.)
}

// Transformation-level analysis
interface TransformationAnalysis {
    name: string;
    overallLevel: InvertibilityLevel;
    rules: RuleAnalysis[];
    invertiblePercentage: number;      // e.g., "75% of bindings are invertible"
    canGenerateReverse: boolean;       // true only if ALL rules are fully invertible
}
```

### Implementation Roadmap (Integrated with Main Phases)

#### With Phase 1 (v0.2) — Foundation
- [ ] Add `InvertibilityAnnotation` to AST node types
- [ ] Implement basic classifier for direct mappings and derived literals
- [ ] Annotate during parsing: `name -> label` → invertible, `-> attr : literal` → non-invertible
- [ ] Display rule-level invertibility icon in the transformation editor (✅ / ⚠️ / ❌)

#### With Phase 2 (v0.3) — Rule System
- [ ] Classify called rules as non-invertible
- [ ] Classify lazy rules (unique lazy = conditionally invertible)
- [ ] Handle rule inheritance: child invertibility ≤ parent invertibility
- [ ] Add guard detection: `when()` → marks rule as non-invertible

#### With Phase 3 (v0.4) — Expressions
- [ ] Build recursive expression analyzer (`analyzeExpression(node): InvertibilityLevel`)
- [ ] Classify all collection operations
- [ ] Classify string operations
- [ ] Classify conditional expressions
- [ ] Value mapping bijection checker (detect duplicate values)

#### With Phase 4 (v0.5) — Imperative
- [ ] `do {}` blocks → automatic non-invertible
- [ ] Variable assignments → non-invertible
- [ ] Control flow → non-invertible
- [ ] `match` expression → conditionally invertible (if all branches produce unique values)

#### With Phase 5 (v0.6) — Modularity
- [ ] Cross-module invertibility analysis (imported helpers may be non-invertible)
- [ ] Library-level annotations (`@invertible` decorator for helpers)

#### With Phase 8 (v0.9+) — Reverse Generation
- [ ] For fully invertible transformations: auto-generate reverse JjTL
- [ ] For partially invertible: generate reverse with `TODO` markers for non-invertible bindings
- [ ] Consistency checking: forward(reverse(model)) ≈ model

### UI Integration

#### Monaco Editor — Real-time Gutter Marks
```
  ✅  Class -> Table {                         // Rule: fully invertible
  ✅      name -> tableName                     // direct mapping
  ✅      visibility -> access : "pub"="RW"     // bijective value mapping
  ❌      -> schema : pkg.name + '_' + name     // concat = non-invertible
  ✅      isAbstract -> flag                     // direct mapping
       }
       // Summary: 3/4 bindings invertible → Rule: PARTIAL
```

Colors: green (✅ invertible), yellow (⚠️ conditional), red (❌ non-invertible)

#### Transformation Overview Panel
```
┌─────────────────────────────────────────┐
│ Invertibility Analysis                  │
│                                         │
│ Overall: ⚠️ Partially Invertible (75%)  │
│                                         │
│ Rules:                                  │
│   ✅ Class -> Table        4/4 bindings │
│   ⚠️ Attr -> Column       2/3 bindings │
│   ❌ Assoc -> ForeignKey   0/3 bindings │
│                                         │
│ [Generate Reverse ▸] (with warnings)    │
└─────────────────────────────────────────┘
```

#### Tooltip on Hover
Hovering over a binding's gutter mark shows:
- Invertibility level
- Reason
- For conditional: what constraint would make it invertible
- For invertible: the reverse expression

### Research Value

This track produces at least two publishable contributions:

1. **"Static Invertibility Analysis for Rule-Based Model Transformations"**
   - Formal classification of transformation constructs by invertibility
   - Recursive expression analysis algorithm
   - Integration with IDE for real-time feedback
   - Evaluation on ATL Zoo transformations

2. **"Automatic Reverse Transformation Generation from Invertibility Annotations"**
   - For fully/partially invertible transformations
   - Comparison with manual reverse transformations
   - Quality metrics: completeness, correctness, information preservation

---

## Timeline Estimate

| Phase | Version | Effort | Dependencies | Invertibility Track |
|-------|---------|--------|-------------|-------------------|
| Phase 1: Foundations | v0.2 | 3-4 weeks | None | AST annotations + basic classifier |
| Phase 2: Rule System | v0.3 | 4-5 weeks | Phase 1 | Rule-type classification |
| Phase 3: Expressions | v0.4 | 3-4 weeks | Phase 1 | Recursive expression analyzer |
| Phase 4: Imperative | v0.5 | 3-4 weeks | Phase 2, 3 | Imperative = non-invertible |
| Phase 5: Modularity | v0.6 | 2-3 weeks | Phase 4 | Cross-module analysis |
| Phase 6: ATL Front-End | v0.7 | 5-6 weeks | Phase 5 | Analyze ATL transformations |
| Phase 7: ETL Front-End | v0.8 | 4-5 weeks | Phase 5 | Analyze ETL transformations |
| Phase 8: Advanced | v0.9+ | Ongoing | Phase 6, 7 | Reverse generation |

**Note:** Phases 2 and 3 can be developed in parallel. Phases 6 and 7 can also be parallelized.

---

## Syntax Summary (Target State)

```jjtl
// Module
import TypeMapping from './type-mapping.jjtl'

// Multi-model transformation (N sources → M targets)
transformation UML2JavaConfig
from UML, Profile
to   Java, Config

uses TypeMapping

// Optional entry point
main {
    // explicit orchestration if needed
}

// Matched rule — single target (model inferred when unambiguous)
// IDE shows: ⚠️ Partially invertible (3/5 bindings)
Class -> JavaClass when (not isAbstract and isPersistent) {
    name -> className : toSnakeCase(name)              // ⚠️ conditional (toLower is lossy)
    attributes -> fields                                // ✅ invertible (lazy rule)
    -> package : source.package.name                    // ❌ non-invertible (no source attr)

    do {
        // ❌ imperative block → non-invertible
        for (ref in source.references->select(r | r.isNavigable)) {
            createForeignKey(ref, self)
        }
    }
}

// Matched rule — multiple targets (qualified when needed)
Class -> Java.JavaClass, Config.ConfigEntry {
    name -> className                                   // JavaClass.className
    name -> entryKey                                    // ConfigEntry.entryKey
}

// Cross-model access
Class -> JavaClass when (Profile.stereotypes->exists(s | s.appliedTo == source)) {
    name -> className
    -> annotations : Profile.stereotypes->select(s | s.appliedTo == source)
}

// Lazy rule
lazy Attribute -> Column {
    name -> columnName
    type -> columnType : mapUMLType(source.type.name)
}

// Unique lazy rule
unique lazy DataType -> SQLType {
    name -> typeName : mapDataType(name)
}

// Called rule
rule createForeignKey(ref: Reference, table: Table) -> ForeignKey {
    -> name : 'fk_' + ref.name
    -> owner : table
    -> referencedTable : resolve(ref.type)
}

// Abstract rule with inheritance
abstract NamedElement -> NamedDBElement {
    name -> dbName : toSnakeCase(name)
}

PersistentClass -> Table extends NamedElement -> NamedDBElement
    when (isPersistent) {
    -> primaryKey : createPrimaryKey(self)
}

// Helpers
helper toSnakeCase(name: String) -> String {
    name.replaceAll('([a-z])([A-Z])', '$1_$2').toLower()
}

helper mapUMLType(typeName: String) -> String {
    match (typeName) {
        'String'  -> 'VARCHAR(255)'
        'Integer' -> 'INT'
        'Boolean' -> 'BIT'
        default   -> 'VARCHAR(255)'
    }
}

// Library import provides: mapDataType, ...
```

---

## Design Principles

1. **Declarative first, imperative when needed** — matched rules are the default; `do {}` blocks and called rules are escape hatches
2. **Progressive disclosure** — simple transformations use simple syntax; advanced features are opt-in
3. **Familiar concepts** — rule types, trace model, resolution algorithm align with ATL/ETL semantics
4. **Clean syntax** — no semicolons, no excessive punctuation, indentation-agnostic, parentheses for guards
5. **Tooling-friendly** — designed for Monaco autocompletion, railroad diagrams, AI assistance
6. **Publishable** — the language design and ATL/ETL translation are academic contributions

---

## Research Contributions

1. **JjTL as unified core** — formal mapping between ATL/ETL semantics and a common IR
2. **Static invertibility analysis** — automatic classification of transformation constructs by bidirectionality potential, with real-time IDE feedback and reverse transformation generation
3. **Web-based transformation environment** — first web-native M2M transformation IDE
4. **AI-assisted transformation** — using LLMs to suggest and generate transformation rules
5. **Progressive disclosure in transformation languages** — basic/advanced modes for educational use
6. **Live transformation preview** — incremental execution with visual feedback
