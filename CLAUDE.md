# CLAUDE.md - Jjodel Project Reference

> Questo file contiene tutte le informazioni, convenzioni e decisioni architetturali per il progetto Jjodel. Da usare come riferimento in Claude Code (VS Code) e nelle sessioni future.

---

## 🎯 Contesto del Progetto

**Jjodel** è un metamodeling tool open-source per ricerca ed educazione. Permette di:
- Creare metamodelli (definizioni di strutture)
- Creare modelli (istanze conformi ai metamodelli)
- Definire trasformazioni model-to-model (JjTL)
- Eseguire trasformazioni model-to-model
- Manipolare metamodelli via scripting (JjScript)
- Valutare espressioni sui modelli (JjEL)

**Status UI Redesign:** ~60% completato (header redesign completato 2026-03-15)
**Focus:** Ridurre cognitive load mantenendo full functionality
**Users:** Ricercatori, educatori, studenti (beginner to expert)

---

## 🛠 Tech Stack

| Tecnologia | Uso |
|------------|-----|
| **React 18** | Framework UI |
| **TypeScript** | Strict mode |
| **Vite** | Bundler (migrato da webpack) |
| **Redux** | State management |
| **Monaco Editor** | Code editing (JjTL, JjScript, JSX) |
| **Bootstrap Icons** | Unica libreria icone |
| **SCSS** | Styling |

### Librerie Chiave
- `LPointerTargetable` - Sistema di riferimenti tra oggetti
- `DModel`, `DObject`, `DGraph` - Data layer (D = Data)
- `LModel`, `LObject`, `LClass` - Logic layer (L = Logic wrapper)
- `SetFieldAction`, `SetRootFieldAction` - Redux actions

---

## 🎨 Design System

> **Full design system spec:** [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — single source of truth for artifact type colors, component catalog, layout patterns, and interaction behaviors.

### Colori
```scss
// Base (Slate)
$slate-900: #0f172a;  // Background scuro
$slate-800: #1e293b;  // Panels
$slate-700: #334155;  // Borders
$slate-400: #94a3b8;  // Testo secondario
$slate-200: #e2e8f0;  // Testo chiaro

// Accent (Cyan)
$cyan-500: #0ea5e9;   // Primary accent
$cyan-400: #22d3ee;   // Hover
$cyan-600: #0891b2;   // Active

// Semantic
$success: #10b981;    // Verde
$warning: #f59e0b;    // Arancio  
$error: #ef4444;      // Rosso
```

### Typography
- **Font UI:** System fonts
- **Font Code:** `'IBM Plex Mono', Monaco, Consolas, monospace`
- **Gerarchia chiara** con pesi e dimensioni coerenti

### Spacing
- **Grid base:** 8px
- Padding standard: 8px, 12px, 16px, 24px

### Icone
- **SOLO Bootstrap Icons** (`bi bi-*`)
- Mai usare altre librerie di icone

### Buttons
- **Primary buttons:** Slate gradient (`linear-gradient(135deg, #334155, #1e293b)`)
- **Secondary buttons:** Transparent with border
- **Danger buttons:** Red accent for destructive actions
- **Cyan (#0ea5e9):** NEVER for button backgrounds — only for focus states, active indicators, and links
- **Icons on dark buttons:** Always white (`#ffffff`)

```scss
// Primary button example
.btn-primary {
    background: linear-gradient(135deg, #334155, #1e293b);
    color: white;

    &:hover {
        background: linear-gradient(135deg, #475569, #334155);
    }
}
```

### Toggle Styles

**Two toggle styles exist in the app:**

- **Style A (Vertical toggle):** ONLY for toolbar debug/advanced mode toggles in the navbar
- **Style B (Horizontal switch):** Everywhere else — settings, properties, options, preferences

**Standard horizontal switch (36×20px):**
```scss
.jjodel-switch {
    width: 36px;
    height: 20px;
    background: #cbd5e1;        // inactive
    border-radius: 10px;

    &.active {
        background: #334155;    // slate — NOT cyan
    }

    // Thumb: 16×16px white circle
    &::after {
        width: 16px;
        height: 16px;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
}
```

**Key rules:**
- Active color: `#334155` (slate), NOT cyan
- Inactive color: `#cbd5e1`
- Knob: white circle with subtle shadow
- Size: 36×20px (compact)
- Label always to the LEFT of the switch, never inside it

### Multi-Select (react-select)

**Visual consistency with single-select:**
- Same height (38px) as regular selects
- Container grows only when tags wrap to second line
- Borderless filter input (seamless typing)
- Smaller, lighter indicator icons (14px)

**Tag styling (light slate):**
```scss
// Selected tag chips
[class*="-multiValue"] {
    background: #f1f5f9;           // slate-100 — light, subtle
    border: 1px solid #e2e8f0;     // slate-200 border
    border-radius: 4px;
}

[class*="-multiValue__label"] {
    color: #334155;                // slate-700 — readable
    font-size: 12px;
    font-weight: 500;
    padding: 2px 6px;
}

[class*="-multiValue__remove"] {
    color: #94a3b8;                // slate-400
    &:hover {
        background: #e2e8f0;       // slate-200
        color: #ef4444;            // red on hover
    }
}
```

**Dropdown menu styling:**
```scss
// Selected option (subtle cyan, not solid)
[class*="-option--is-selected"] {
    background: rgba(14, 165, 233, 0.08);  // very subtle cyan
    color: #0ea5e9;
    font-weight: 500;
}

// Hover state
[class*="-option"]:hover {
    background: #f1f5f9;           // slate-100
}

// Group header
[class*="-groupHeading"] {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
}
```

**Implementation:**
- Uses `classNamePrefix="jjodel-select"` for reliable CSS targeting
- Inline `styles` prop overrides react-select defaults
- Files: `inputselect.scss`, `viewapplyto.scss`, `Input.tsx`

---

## 📁 Struttura Progetto

```
frontend/src/
├── components/
│   ├── abstract/tabs/     # Tab components (ModelTab, MetamodelTab)
│   ├── editor-v2/          # React Flow-based editor (V2)
│   │   ├── hooks/           # useJjomSync, useEditorMode, useAutoAnchor
│   │   ├── sync/            # canvasToJjom (RF→JjOM), jjomTransformers (JjOM→RF)
│   │   ├── panels/          # PalettePanel, PropertiesPanel
│   │   └── EditorV2.tsx     # Main editor component
│   ├── project/           # ProjectEditor, Dashboard
│   └── shared/            # Componenti riutilizzabili
├── jjtl/                  # Transformation Language
│   ├── lexer/             # Tokenizer (uses JJTL_KEYWORDS from types/)
│   ├── parser/            # Recursive descent parser → TransformationAST
│   ├── executor/
│   │   ├── executor.ts    # JjtlExecutor — transformation execution
│   │   └── astBridge.ts   # toJjelAst() — JjTL expr → JjEL expr conversion
│   ├── editor/            # Monaco integration
│   ├── components/        # UI (ExecuteTransformationDialog)
│   ├── views/             # MappingTraceView, DualMetamodelPanel
│   ├── types/             # AST types (tokens.ts, ast.ts), transformation types
│   └── __tests__/         # 4 test files (211 tests)
├── jjscript/              # Scripting Language
│   ├── parser/            # Grammar, tokenizer
│   ├── executor/          # Command execution
│   └── commands/          # create, copy, delete, etc.
├── jjel/                  # Expression Language (standalone evaluator)
│   ├── lexer/             # Tokenizer
│   ├── parser/            # Parser → JjelExpression AST
│   ├── evaluator/         # JjelEvaluator + EvaluationContext + builtins/
│   ├── types/             # AST types, token types
│   └── __tests__/         # evaluator.test.ts, parser.test.ts
├── joiner/                # Core utilities, Redux, data layer
└── pages/                 # Route pages
```

---

## 🔧 Convenzioni Codice

### Naming
- **Componenti:** PascalCase (`MetamodelPanel.tsx`)
- **Funzioni:** camelCase (`handleExecuteTransformation`)
- **Costanti:** UPPER_SNAKE_CASE (`MAX_RESULTS`)
- **File SCSS:** kebab-case (`dual-metamodel-panel.scss`)

### TypeScript
```typescript
// Props interfaces esportate dal file del componente
export interface MyComponentProps {
    value: string;
    onChange: (value: string) => void;
}

// Functional components con hooks
export const MyComponent: React.FC<MyComponentProps> = ({ value, onChange }) => {
    // ...
};
```

### Imports
```typescript
// 1. React
import React, { useState, useCallback } from 'react';

// 2. Librerie esterne
import { useSelector } from 'react-redux';

// 3. Componenti interni
import { DModel, LObject } from '../../joiner';

// 4. Types
import type { TransformationAST } from '../types';

// 5. Styles
import './MyComponent.scss';
```

---

## 🏗 Pattern Architetturali

### Progressive Disclosure
- Modalità **Basic** (default) vs **Advanced**
- Nascondere complessità finché non serve

### State Management
- **Redux** per stato globale (project, models, graphs)
- **useState** per stato locale UI
- **useRef** per valori che non devono triggerare re-render

### Actions Pattern
```typescript
// Modifica campo di un oggetto
SetFieldAction.new(objectId, 'fieldName', value, '+=', true);

// Modifica stato root
SetRootFieldAction.new('graphs', graphId, '+=', true);

// Transazione atomica
TRANSACTION('Description', () => {
    // multiple actions
});
```

### Data vs Logic Layer
- **D*** (DModel, DObject): Dati puri, serializzabili
- **L*** (LModel, LObject): Wrapper con logica, computed properties

---

## 📐 JjEL - Expression Language

JjEL (Jjodel Expression Language) is the expression evaluation engine used by both JjTL and JjScript. It is a standalone language with its own lexer, parser, evaluator, and type system.

### Architecture

```
frontend/src/jjel/
├── lexer/lexer.ts          # Tokenizer
├── parser/parser.ts        # Recursive descent parser → AST
├── evaluator/
│   ├── evaluator.ts        # JjelEvaluator class — main evaluation engine
│   ├── context.ts          # EvaluationContext — scoped variable bindings
│   └── builtins/
│       ├── strings.ts      # 35+ string methods
│       ├── collections.ts  # 30+ collection methods
│       ├── numbers.ts      # 35+ numeric methods
│       └── dates.ts        # 35+ date/time methods
├── types/
│   ├── ast.ts              # JjelExpression union type
│   └── tokens.ts           # Token types
└── __tests__/
    ├── evaluator.test.ts   # Evaluator tests
    └── parser.test.ts      # Parser tests
```

### Core Constructs

| Construct | Syntax | Example |
|-----------|--------|---------|
| Member access | `obj.prop` | `source.name` |
| Null-safe access | `obj?.prop` | `source?.owner` |
| Method call | `obj.method()` | `name.toUpper()` |
| Null coalesce | `a ?? b` | `name ?? "default"` |
| Conditional | `if c then a else b` | `if active then "yes" else "no"` |
| Type check | `x is Type` | `value is String` |
| Implication | `a implies b` | `isAbstract implies hasSubclasses` |
| Lambda | `x => expr` | `x => x.name` |
| ForAll (set comp.) | `forall x in S [such that P] [: proj]` | `forall a in attrs such that a.isPublic : a.name` |
| Exists | `exists x in S : pred` | `exists a in attrs : a.type == "String"` |
| With...do | `with expr do body` | `with parent do name.camelCase()` |
| Array literal | `[a, b, c]` | `["red", "green"]` |
| Index access | `arr[index]` | `items[0]` |
| Line comment | `-- comment` | `-- this is ignored` |

### Operators (by precedence, lowest to highest)

1. `if/then/else`, `forall`, `exists`, `with...do` — lowest
2. `??` — null coalesce
3. `implies` — right-associative logical implication
4. `or` — logical OR
5. `and` — logical AND
6. `==`, `!=` — equality
7. `<`, `>`, `<=`, `>=` — comparison
8. `is` — type check
9. `+`, `-` — additive (+ also string concat)
10. `*`, `/`, `%` — multiplicative
11. `not`, `-` (unary) — unary
12. `.`, `?.`, `()`, `[index]` — postfix (highest)

### Design Decisions

- `forall` has **set-theoretic semantics** (returns a set, not a boolean)
- `do` keyword exists ONLY in `with...do` — nowhere else
- Lambda uses `=>` (not `:`) to avoid conflict with forall projection separator
- Implicit context: Console uses selected node; JjTL uses matched source element
- Truthiness: `null`, `false`, `0`, `""`, `[]` are falsy

### Built-in Methods Summary

- **Strings (35+):** `toUpper`, `toLower`, `camelCase`, `pascalCase`, `snakeCase`, `kebabCase`, `capitalize`, `trim`, `split`, `replace`, `contains`, `startsWith`, `endsWith`, `substring`, `length`, `isEmpty`, `matches`, `format`, ...
- **Collections (30+):** `filter`, `map`, `flatMap`, `first`, `last`, `any`, `all`, `none`, `count`, `size`, `distinct`, `sortBy`, `groupBy`, `join`, `sum`, `avg`, `min`, `max`, `take`, `skip`, ...
- **Numbers (35+):** `abs`, `round`, `floor`, `ceil`, `sqrt`, `pow`, `clamp`, `between`, `toFixed`, `isInteger`, `isPositive`, ...
- **Dates (35+):** `now()`, `today()`, `date()`, `year`, `month`, `day`, `addDays`, `diffDays`, `isBefore`, `isAfter`, `format`, ...

### EvaluationContext

Scoped binding system with parent-child relationship:

```typescript
// Create child context with additional bindings
const child = parentCtx.child({ myVar: someValue });

// child inherits all parent bindings + has myVar
```

Used by JjTL executor to pass forall variables into nested scopes.

### Tests

- `frontend/src/jjel/__tests__/evaluator.test.ts` — expression evaluation
- `frontend/src/jjel/__tests__/parser.test.ts` — parsing to AST

---

## 📐 JjTL - Transformation Language

### Sintassi
```jjtl
transformation NomeTransformazione

from SourceMetamodel
to   TargetMetamodel

# Class mapping
SourceClass -> TargetClass {
    # Attribute mapping (copia diretta)
    sourceAttr -> targetAttr

    # Con conversione (value mapping)
    sourceAttr -> targetAttr : true=1, false=0

    # Con espressione JjEL
    sourceAttr -> targetAttr : sourceAttr + "_suffix"

    # Object creation (inline)
    -> Arc { place -> source.map() }

    # ForAll mapping (iterazione su collezione)
    forall a in attributes such that not a.multiValued -> Column {
        -> name : a.name.snakeCase()
        -> type : a.type
    }
}
```

### AST Bridge Architecture

JjTL does NOT have its own expression evaluator. All expression evaluation is delegated to JjEL via `astBridge.ts`:

```
JjTL Parser → JjTL AST → astBridge.toJjelAst() → JjEL AST → JjelEvaluator.evaluate()
```

Key mappings in `astBridge.ts`:
- `FunctionCall` → `MethodCall` (if callee is MemberAccess) or `Identifier`
- `BinaryExpression` → `Binary` (with operator normalization: `=`→`==`, `<>`→`!=`)
- `ConditionalExpression` → `IfThenElse`
- `JjelExpression` wrapper → unwraps inner expression

### AST Types (Key Nodes)

```typescript
// Root
interface TransformationAST {
    type: 'Transformation';
    name: string;
    sourceMetamodel: string;
    targetMetamodel: string;
    mappings: ClassMappingAST[];
    helpers: HelperAST[];
}

// Class mapping body can contain multiple item types
type MappingBodyItemAST =
    | AttributeMappingAST
    | ForAllMappingAST
    | AlertStatementAST
    | NotifyStatementAST;

// ForAll mapping (added 2026-03)
interface ForAllMappingAST {
    type: 'ForAllMapping';
    variable: string;
    collection: ExpressionAST;
    filter?: ExpressionAST;         // such that clause
    objectCreation: ObjectCreationAST;
}

// Object creation body also supports MappingBodyItemAST (not just AttributeMapping)
interface ObjectCreationAST {
    type: 'ObjectCreation';
    targetClass: string;
    body: MappingBodyItemAST[];
}
```

### Esecuzione Trasformazione

**Executor:** `JjtlExecutor` class in `frontend/src/jjtl/executor/executor.ts`

```typescript
const executor = new JjtlExecutor(ast);
const result: ExecutionResult = executor.execute(sourceModel);
// result.success, result.targetModel, result.trace, result.errors, result.warnings
```

**Execution flow:**
1. Parse JjTL code → AST
2. Deep-copy source model (prevents mutation)
3. Extract source instances (supports both flat array and `{classes, instances}` format)
4. Per ogni class mapping:
   - Filtra istanze source per className
   - Crea istanze target
   - Applica attribute mappings (direct copy or JjEL conversion)
   - Esegue ForAll mappings (iterate, filter, create sub-objects)
5. Result contains `targetModel.instances: Map<string, any[]>`

**ForAll execution:**
- Evaluates collection expression on source instance
- Iterates elements, applies `such that` filter via JjEL
- Creates child EvaluationContext with forall variable bound
- Executes object creation for each passing element
- Stores created objects under pluralized property name (e.g., `Column` → `columns`)

**Integration with Jjodel framework:**
1. Executor produces `ExecutionResult` (pure data, no framework dependency)
2. `ProjectEditor` takes result and creates DModel + DGraph via framework APIs
3. Uses deferred attribute setting pattern (see below)

### ⚠️ Pattern Critici per Object Persistence (2026-02-09)

#### DObject.new() — ID Temporanei
`DObject.new()` ritorna un ID temporaneo che **NON corrisponde** all'ID reale dell'oggetto nel framework. Gli oggetti non sono accessibili tramite `store.getState()[dObject.id]`.

```typescript
// ❌ SBAGLIATO — l'ID è temporaneo
const dObject = DObject.new(classId, modelId, DModel, name, true);
store.getState()[dObject.id]; // → undefined!

// ❌ SBAGLIATO — SetFieldAction non scrive valori leggibili dal proxy
SetFieldAction.new(featurePointer, 'values', [value], '', true);

// ✅ CORRETTO — trova per NOME via proxy LModel
const lModel = LPointerTargetable.fromD(modelId) as LModel;
const lObject = lModel.objects.find(o => o.name === objectName);

// ✅ CORRETTO — scrivi valori via proxy
(lObject as any)['$' + attrName].value = attrValue;
```

#### Pattern Deferred Attribute Setting
Dopo una TRANSACTION che crea oggetti, i proxy non sono immediatamente disponibili. Usa `setTimeout` per attendere la propagazione Redux:

```typescript
// 1. Dentro TRANSACTION: accumula per NOME (non ID!)
const pending: Array<{ objectName: string; attributes: Record<string, any> }> = [];

TRANSACTION('Create Objects', () => {
    const dObject = DObject.new(classId, modelId, DModel, name, true);
    pending.push({ objectName: name, attributes: { label: 'value' } });
});

// 2. Dopo TRANSACTION: delay + proxy
setTimeout(() => {
    const lModel = LPointerTargetable.fromD(modelId) as LModel;
    for (const { objectName, attributes } of pending) {
        const lObj = lModel.objects.find(o => o.name === objectName);
        if (!lObj) continue;
        for (const [attr, val] of Object.entries(attributes)) {
            (lObj as any)['$' + attr].value = val;
        }
    }
}, 1000);
```

#### evaluatePropertyPath — 4 Strategie Fallback
Il metodo `evaluatePropertyPath` nell'executor risolve nomi di proprietà con:
1. **Direct access** — `source[path]` per proprietà dell'istanza
2. **Context lookup** — `ctx.get(path)` per variabili di contesto
3. **JjEL evaluation** — `jjelEval(path, record)` per espressioni complesse
4. **Manual traversal** — split per `.` e traverse manuale per path come `source.owner.name`

**CRITICO:** `contextToRecord()` deve includere TUTTE le proprietà dell'istanza source, non solo le variabili hardcoded.

### JjTL — Development Plan

For the complete JjTL development roadmap (8 phases + invertibility analysis track), see:
**`/docs/jjtl/JJTL-DEVELOPMENT-PLAN.md`**

JjTL is designed as both a user-facing transformation language AND a core IR (Intermediate Representation) that ATL and ETL can be translated into. The development plan covers:
- Phase 1-5: Language features (trace model, rule system, expressions, imperative, modularity)
- Phase 6-7: ATL and ETL front-ends (parse → translate to JjTL → execute)
- Phase 8: Advanced features (bidirectionality, incrementality, AI-assisted transformation)
- Cross-cutting: Static invertibility analysis with real-time IDE feedback

### Language Boundaries: JjEL / JjTL / JjScript

| Aspect | JjEL | JjTL | JjScript |
|--------|------|------|----------|
| **Purpose** | Expression evaluation | Model-to-model transformation | Metamodel scripting |
| **Nature** | Pure (no side effects) | Declarative + side effects | Imperative |
| **Has own evaluator?** | Yes (`JjelEvaluator`) | No — delegates to JjEL via AST bridge | Yes (command executor) |
| **Keyword overlap** | `if/then/else`, `and/or/not`, `is` | Shares JjEL keywords + `transformation/from/to/forall/in/such/that` | Own keywords |
| **ForAll semantics** | Returns a boolean (quantifier: `collection.forAll(x: predicate)`) | Creates objects (iteration: `forall x in coll -> Type { ... }`) | N/A |

**Key rule:** JjTL's `forall` is a **mapping construct** (creates target objects as side effect). JjEL's `forall` is a **set comprehension** (returns filtered/projected collection). They share the keyword but have different semantics.

**Symbol ownership:**
- `do` keyword: ONLY in JjEL's `with...do`. Not in JjTL. Not anywhere else.
- `->` operator: ONLY in JjTL (mapping arrow). Not in JjEL.
- `:` separator: JjEL forall projection + JjTL conversion/value mapping (context-distinct).
- `=>` separator: Lambda in both JjEL and JjTL.
- `--` comments: Both JjEL and JjTL.

### Grammar Spec References

- **JjEL SPEC:** `frontend/src/jjel/SPEC.md`
- **JjTL SPEC:** `frontend/src/jjtl/SPEC.md`
- **JjTL Token definitions:** `frontend/src/jjtl/types/tokens.ts` (`JJTL_KEYWORDS` map)
- **JjEL Token definitions:** `frontend/src/jjel/types/tokens.ts`
- **Audit report:** `docs/jjel-jjtl-audit.md` — comprehensive read-only analysis
- **Design document:** `___JjTL__1_.pdf` — full language design rationale and comparative analysis with ATL, ETL, QVT-R, QVT-O

### Modifica Sintassi JjTL — Checklist Obbligatoria

Quando si modifica la grammatica JjTL, aggiornare **SEMPRE** tutti e 4 i file:

1. **Tokens** (`frontend/src/jjtl/types/tokens.ts`) — nuovi token types + keyword map
2. **Lexer** (`frontend/src/jjtl/lexer/lexer.ts`) — tokenizzazione (usa `JJTL_KEYWORDS` automaticamente)
3. **Parser** (`frontend/src/jjtl/parser/parser.ts`) — regole di parsing
4. **Grammar Rules** (`frontend/src/jjtl/diagrams/types.ts`) — EBNF in `GRAMMAR_RULES`
5. **Railroad Diagrams** (`frontend/src/jjtl/diagrams/GrammarDiagram.tsx`) — rendering visuale

⚠️ Non aggiornare MAI solo il parser senza gli altri. I railroad diagrams sono la documentazione visiva per l'utente e non si aggiornano automaticamente.

### Stato JjTL (Aggiornamento 2026-03-10)

**Completato:**
- ✅ Lexer/Parser JjTL → AST (full recursive descent)
- ✅ AST Bridge: JjTL expressions → JjEL evaluation (no duplicate evaluator)
- ✅ Executor: class mapping (A -> B)
- ✅ Executor: attribute mapping diretto (name -> label)
- ✅ Executor: conversion expressions via JjEL (`name -> label : name.snakeCase()`)
- ✅ Executor: ForAll mapping (`forall x in collection such that predicate -> Type { ... }`)
- ✅ Executor: object creation (`-> Arc { place -> source }`)
- ✅ Executor: evaluatePropertyPath con fallback multi-strategia
- ✅ ProjectEditor: creazione modello target con DModel.new
- ✅ ProjectEditor: creazione istanze con DObject.new
- ✅ ProjectEditor: deferred attribute setting via LModel proxy
- ✅ UI: Manhattan arrows per mapping visualization
- ✅ UI: nomi trasformazioni con `_to_` (no trattini)
- ✅ UI: nomi modelli unici con numerazione progressiva
- ✅ Executor: guard conditions (`when` clause) — evaluates via JjEL bridge
- ✅ Executor: helper functions (`helper` declarations) — registered as JjEL builtins
- ✅ Interactive statements: alert(), notify(), prompt(), input() — parsed (AST)
- ✅ Test suite: 211 tests passing (4 test files in `jjtl/__tests__/`)

**Da Completare:**
- ❌ Reference mapping (oggetti collegati tra modelli)
- ❌ Multiplicity constraints — parsed but not enforced (executor always creates 1)
- ❌ Interactive statements — parsed but not wired to UIBridge
- ❌ Multiple source types: `[Class, Interface] -> Table {}`
- ❌ Undo/redo per trasformazioni
- ❌ Cleanup log di debug (executor has verbose console.log)

### JjTL Tests

```
frontend/src/jjtl/__tests__/
├── astBridge.test.ts          # AST bridge JjTL→JjEL conversion
├── executor-bridge.test.ts    # Executor with JjEL integration
├── forall-mapping.test.ts     # ForAll mapping (13 tests)
└── parser-fixes.test.ts       # Parser edge cases
```

### Known Limitations

- **Source attribute in forall:** `a.name -> targetAttr` does not parse (dotted source attributes). Use conversion syntax instead: `-> targetAttr : a.name`
- **Flat array source format:** Using `[{ className: 'X', ... }]` is more reliable than `{ classes: [...], instances: [...] }` format (avoids duplicate extraction bug)
- **Pluralization heuristic:** ForAll stores created objects under `targetClass.charAt(0).toLowerCase() + targetClass.slice(1) + 's'` (e.g., `Column` → `columns`)

---

## 🤖 AI Provider System (2026-02-11)

Sistema unificato per la gestione dei provider AI in tutte le feature dell'applicazione.

### Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    Settings Page                             │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │   Sidebar       │  │  AISettingsContent               │  │
│  │   - Profile     │  │  - Default Provider selector     │  │
│  │   - Providers ◄─┼──┼─ - Provider cards (API keys)     │  │
│  │   - ...         │  │  - Model selection per provider  │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ openSettings('providers')
                              │
┌─────────────────────────────┴───────────────────────────────┐
│              SettingsModalContext                            │
│  - openSettings(section?)  - Keyboard shortcut: Cmd+,       │
│  - closeSettings()         - Renders UnifiedSettingsModal   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ useSettingsModalSafe()
                              │
┌─────────────────────────────┴───────────────────────────────┐
│              ProviderSelector Component                      │
│  - Dropdown con icone distintive per provider               │
│  - Supporta local options (non-AI)                          │
│  - "Configure in Settings" link                             │
│  - Compact mode per toolbar                                 │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ useAIProviderPreference(feature)
                              │
┌─────────────────────────────┴───────────────────────────────┐
│              AIProviderPreferences Service                   │
│  - Per-feature preferences (localStorage)                   │
│  - Global default fallback                                  │
│  - CustomEvent sync across components                       │
└─────────────────────────────────────────────────────────────┘
```

### Features Supportate

| Feature | AIFeature ID | Local Options |
|---------|--------------|---------------|
| Documentation | `'documentation'` | Local (Instant) |
| Jjodie Chat | `'chat'` | - |
| ScriptBlock | `'scriptblock'` | - |
| Suggested Mappings | `'mappings'` | Simple (Local) |

### Provider Resolution Order

1. **Feature override** — preferenza specifica per la feature
2. **Global default** — impostato in Settings
3. **First configured** — primo provider con API key valida

### Provider Icons

Ogni provider ha un'icona Bootstrap distintiva con colore brand:

| Provider | Icon | Color |
|----------|------|-------|
| OpenAI | `bi-circle` | `#10a37f` (green) |
| Anthropic | `bi-chat-square-text` | `#d97706` (amber) |
| DeepSeek | `bi-search` | `#4d6bfe` (blue) |
| Mistral | `bi-wind` | `#ff7000` (orange) |
| Gemini | `bi-gem` | `#4285f4` (Google blue) |
| Groq | `bi-speedometer2` | `#f55036` (red) |
| Kimi | `bi-moon` | `#6366f1` (purple) |
| Ollama | `bi-hdd-network` | `#10b981` (green) |
| Local | `bi-lightning` | `#f59e0b` (amber) |

### Componenti Chiave

| File | Descrizione |
|------|-------------|
| `services/AIProviderPreferences.ts` | Service per persistenza preferenze |
| `hooks/useAIProviderPreference.ts` | Hook per accesso preferenze |
| `components/common/ProviderSelector.tsx` | Dropdown riutilizzabile |
| `contexts/SettingsModalContext.tsx` | Context per aprire Settings |
| `components/settings/AISettingsContent.tsx` | UI configurazione provider |

### Uso del ProviderSelector

```typescript
import { ProviderSelector, LocalOption } from '../common/ProviderSelector';

// Con local options
const LOCAL_OPTIONS: LocalOption[] = [
    { id: 'local', label: 'Local (Instant)', icon: 'lightning' }
];

<ProviderSelector
    feature="documentation"
    localOptions={LOCAL_OPTIONS}
    selectedLocalOption={isLocalMode ? 'local' : null}
    onLocalOptionSelect={(id) => setLocalMode(id === 'local')}
    compact
/>

// Solo AI providers
<ProviderSelector feature="chat" />
```

### Navigazione a Settings

```typescript
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';

const settingsModal = useSettingsModalSafe();

// Apri Settings alla sezione Providers
settingsModal?.openSettings('providers');
```

---

## 🐛 Bug Noti e Soluzioni

### Stale AST Bug (RISOLTO)
**Problema:** L'AST nel callback era una closure stale
**Soluzione:** Usa `useRef` per mantenere AST corrente
```typescript
const astRef = useRef<TransformationAST | null>(null);
astRef.current = currentAST;
// Nel callback usa astRef.current
```

### Target Model Non Visibile (RISOLTO)
**Problema:** Modello creato ma tab bloccato su "Building the Graph..."
**Soluzione:** 
- Usa `SetRootFieldAction.new('graphs', graphId, '+=', true)` per aggiungere a state.graphs
- Usa `setTimeout(200)` prima di aprire il tab

### Attribute Mapping Non Funziona (RISOLTO 2026-02-09)
**Problema:** `label` resta `undefined` dopo trasformazione
**Root Causes:**
1. `evaluatePropertyPath()` non passava proprietà istanza a `contextToRecord()`
2. `DObject.new()` ritorna ID temporanei non usabili per lookup Redux
3. `SetFieldAction` non scrive valori leggibili dal proxy

**Soluzione:**
1. Fix executor `evaluatePropertyPath` con accesso diretto + contextToRecord esteso
2. Trovare oggetti per NOME via `lModel.objects.find(o => o.name)`
3. Scrivere valori via proxy `$attr.value = val`

### Bug Aperti (2026-03)
| Bug | Stato | Note |
|-----|-------|------|
| Doppia esecuzione executor | ⚠️ APERTO | React double rendering (StrictMode) |
| "Error in View: Fallback" su target | ⚠️ APERTO | Rendering modello creato |
| ForAll pluralization heuristic naive | ⚠️ APERTO | `TargetClass + 's'` — needs proper strategy |

---

## 🎯 UI Components - Decisioni

### Mapping Arrows (DualMetamodelPanel)
- **Stesso livello (|dy| < 5):** Linea dritta orizzontale
- **Livelli diversi:** Percorso Manhattan con curve (radius 6px)
- **Colori:**
  - Class mapping: Verde (#10b981)
  - Attribute mapping: Blu (#3b82f6) o varianti per tipo

### Monaco Editor Configuration
```typescript
{
    fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
    fontSize: 13,
    lineHeight: 20,
    fontLigatures: false,
    lineNumbers: 'on',
    minimap: { enabled: false },
    wordWrap: 'on',
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    padding: { top: 8, bottom: 8 }
}
```

### Console Panel
- Font con ligatures per codice
- Auto-scroll per nuovi messaggi
- Resize handle con hover effect
- Filtri per tipo messaggio (errors, warnings, info)

### Transformation Names
- Formato: `SourceMetamodel_to_TargetMetamodel`
- NO trattini `-` (non validi in JjTL)
- Numeri progressivi se duplicato: `name`, `name (1)`, `name (2)`

---

## 🖥 Header Layout (aggiornato 2026-03-15)

### Struttura: 2 righe (~84px totali)
- **Riga 1 — App bar (50px)**: Logo | Menu 12px | Project link | Tab (overflow Chrome-style) | Level badge (read-only) | Help | Avatar
- **Riga 2 — Toolbar (34px)**: [undo][redo][duplicate][delete] | VIEW [Notation ▾] [Theme: X ▾] | LAYOUT [grid][autolayout] | [● Abstract syntax] | spacer | [−] 100% [+] [⤢] | [panel toggle]

### Toolbar — Multi-selezione
Quando 2+ elementi selezionati, il primo gruppo della toolbar fa swap:
- Normale: undo, redo, duplicate, delete
- Multi-selezione: ALIGN [6 icone allineamento] + "N selected"
Zero layout shift — stesso spazio, altezza invariata.

### Toolbar — Regole anti-shift
- Dropdown notation: `min-width: 120px` (per "Structured")
- Zoom value: `min-width: 44px`, `text-align: center`, `font-variant-numeric: tabular-nums`
- Abstract syntax pill: `white-space: nowrap`, `flex-shrink: 0`
- Tutti i bottoni icon: 28×28px fissi

### Debug mode
- NON nella app bar — accessibile da menu View → ☑ Debug Mode
- Quasi solo per sviluppatori

### Progressive disclosure
- 3 livelli: Basic, Intermediate, Advanced
- Selezionabili nei Settings, badge read-only nella app bar
- Click badge → Settings

### Polymetric view
- NON nella toolbar — accessibile da menu Tools con label "(beta)"

### Panel toggle
- 1 solo bottone (non 3) — alterna fullscreen ↔ split con properties
- Icona contestuale: mostra l'azione disponibile

---

## 📋 Properties Panel (aggiornato 2026-03-15)

### Form layout
- Label SOPRA i campi input (layout verticale stacked)
- Nessun ":" dopo le label
- Gap label↔input: 4px
- Gap tra campi: 12-16px

### Campi booleani
- Checkbox custom 14×14px, stile shadcn/ui
- Unchecked: border `#cbd5e1`, bg trasparente
- Checked: bg `#0ea5e9` (cyan), check SVG bianco
- Posizione: checkbox a sinistra, label a destra (pattern Bootstrap)
- Componente: `PropertiesCheckbox` in Info.tsx

### Container
- `properties-panel-container`: margin 0 (adiacente al canvas, no gap)

---

## 🔄 Workflow Preferito

- Al termine di ogni task che introduce nuovi pattern o convenzioni, proponi un aggiornamento a questo file.

### Per Feature Complesse
1. **Discuti architettura** prima di implementare
2. Crea un **prompt dettagliato e autocontenuto** con requisiti chiari
3. Usa **Plan Mode** in Claude Code per verificare l'approccio
4. Implementa in modo incrementale
5. Testa e itera

### Per Bug Fix
1. **Analizza root cause** con log di debug
2. Crea prompt con:
   - Descrizione problema
   - Log rilevanti
   - Codice da modificare
   - Risultato atteso
3. Applica fix
4. Verifica con test case specifico

### Per Refactoring
1. Spiega **motivazioni** prima del codice
2. Mantieni backward compatibility
3. Documenta breaking changes

---

## 📝 Note Aggiuntive

### Cose da Evitare
- ❌ Emoji nel codice (ok nelle risposte)
- ❌ Librerie esterne senza discussione
- ❌ Modifiche al core senza approvazione
- ❌ Over-engineering per feature semplici
- ❌ Usare `createM1()` per creare modelli target (genera nomi automatici)
- ❌ `require()` nel frontend — restituisce `{}` (usare ES module imports)
- ❌ `model.addChild()` in canvasToJjom — causa nested TRANSACTION (usare `.new()` direttamente)

### Best Practices
- ✅ Accessibility (WCAG guidelines)
- ✅ Dark mode support
- ✅ Lazy loading dove appropriato
- ✅ Memoization per performance
- ✅ Console.log con prefissi `[Component]` per debug

### Documentazione
- JSDoc per componenti pubblici
- README per moduli complessi
- Commenti per logica non ovvia

---

## 🔗 File Importanti

| File | Descrizione |
|------|-------------|
| `ProjectEditor.tsx` | Dashboard principale, gestione progetto |
| `DockManager.ts` | Gestione tabs e pannelli |
| `jjtl/executor/executor.ts` | JjtlExecutor — esecuzione trasformazioni |
| `jjtl/executor/astBridge.ts` | toJjelAst() — converte espressioni JjTL → JjEL |
| `jjel/evaluator/evaluator.ts` | JjelEvaluator — valutazione espressioni |
| `jjel/evaluator/context.ts` | EvaluationContext — scope e bindings |
| `MappingLinesOverlay.tsx` | Frecce di mapping |
| `DualMetamodelPanel.tsx` | Vista side-by-side metamodelli |
| `ExecuteTransformationDialog.tsx` | Dialog esecuzione |
| `Navbar.tsx` + `navbar.scss` | App bar (riga 1 header) |
| `Toolbar.tsx` | Toolbar (riga 2 header) |
| `Info.tsx` + `info.scss` | Properties panel (form layout, checkbox custom) |

---

## 📅 Ultimo Aggiornamento

**Data:** Marzo 2026
**Stato JjTL Executor:** Funzionante — class mapping, attribute mapping, forall mapping, guard conditions, helper functions, JjEL expressions via AST bridge
**Stato JjEL:** Completo — 100+ built-in methods, forall/exists/implies/with...do, scoped contexts
**Test:** 211 tests passing (JjTL: 4 test files, JjEL: 2 test files)
**Prossimi Step:**
1. Reference mapping (cross-model object links)
2. Multiplicity enforcement in executor
3. Interactive statements (wire to UIBridge)
4. Completare UI redesign
