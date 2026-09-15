# HANDOVER: JjTL - Jjodel Transformation Language

## DATA
2026-02-01

## CONTESTO
Implementazione completa del modulo JjTL (Jjodel Transformation Language) per trasformazioni Model-to-Model dichiarative. Il linguaggio permette di definire mappature tra metamodelli sorgente e target in modo intuitivo.

---

## LAVORO COMPLETATO

### 1. Core Language Implementation

#### Types (`frontend/src/jjtl/types/`)

**tokens.ts** - Token types per il lexer:
- Keywords: `TRANSFORMATION`, `FROM`, `TO`, `WHEN`, `HELPER`
- Literals: `IDENTIFIER`, `STRING`, `NUMBER`, `BOOLEAN`
- Operators: `ARROW` (->), `COLON`, `EQUALS`, `DOT`, `COMMA`
- Brackets: `LBRACE`, `RBRACE`, `LPAREN`, `RPAREN`, `LBRACKET`, `RBRACKET`
- Special: `COMMENT`, `NEWLINE`, `WHITESPACE`, `EOF`

**ast.ts** - AST node types:
| Node Type | Descrizione |
|-----------|-------------|
| `TransformationAST` | Root node con name, source/target metamodel, mappings, helpers |
| `ClassMappingAST` | Mapping tra classi: `State -> Place { ... }` |
| `AttributeMappingAST` | Mapping attributi: `name -> label` |
| `ConversionAST` | Conversione valori: `true=1, false=0` |
| `ObjectCreationAST` | Creazione oggetti: `-> Arc { ... }` |
| `HelperAST` | Funzioni helper: `helper formatName(...) -> String` |
| `MultiplicityAST` | Molteplicità: `[*]`, `[1]`, `[0..*]` |

---

#### Lexer (`frontend/src/jjtl/lexer/`)

**lexer.ts** - Tokenizer completo:
```typescript
import { tokenize } from './jjtl';

const source = `transformation Test
from SourceMM
to   TargetMM

State -> Place`;

const { tokens, errors } = tokenize(source);
```

Features:
- Scansione single-pass efficiente
- Supporto commenti `# ...`
- String literals con escape
- Numeri interi e decimali
- Tracking posizione (line, column) per error reporting

---

#### Parser (`frontend/src/jjtl/parser/`)

**parser.ts** - Recursive descent parser:
```typescript
import { parse } from './jjtl';

const { ast, errors } = parse(tokens);
```

Grammar supportata:
```
transformation = "transformation" ID "from" ID "to" ID (classMapping | helper)*
classMapping   = ID "->" ID multiplicity? condition? mappingBody?
mappingBody    = "{" attributeMapping* "}"
attributeMapping = (ID "->")? ID (":" conversion)? | "->" ID objectCreation
```

---

#### Executor (`frontend/src/jjtl/executor/`)

**executor.ts** - Placeholder per esecuzione (Sprint 2):
```typescript
import { execute } from './jjtl';

const result = execute(ast, sourceModel);
// { success: boolean, targetModel?: any, trace?: Map, errors: string[] }
```

---

### 2. Monaco Editor Integration

#### Language Definition (`jjtlLanguage.ts`)

```typescript
// Syntax highlighting rules
tokenizer: {
    root: [
        [/#.*$/, 'comment'],
        [/\b(transformation|from|to|when|helper)\b/, 'keyword'],
        [/\b(true|false)\b/, 'constant.language'],
        [/[A-Z][a-zA-Z0-9_]*/, 'type.identifier'],  // Class names
        [/[a-z][a-zA-Z0-9_]*/, 'identifier'],
        [/->/, 'operator.arrow'],
    ],
}
```

Features:
- Bracket matching e auto-closing
- Folding regions con `# region` / `# endregion`
- Commenti con `#`

---

#### Theme (`jjtlTheme.ts`)

Colori basati su design system Jjodel (slate/cyan):

| Token | Colore | Hex |
|-------|--------|-----|
| Keywords | Cyan | `#0ea5e9` |
| Types (classes) | Purple | `#8b5cf6` |
| Identifiers | Slate | `#334155` |
| Booleans/Numbers | Amber | `#f59e0b` |
| Strings/Functions | Green | `#10b981` |
| Arrow operator | Cyan bold | `#0ea5e9` |
| Comments | Gray italic | `#94a3b8` |

Background: `#f8fafc` (light theme)

---

#### Autocompletion (`jjtlCompletions.ts`)

```typescript
import { registerJjtlCompletions, setCompletionContext } from './jjtl';

// Register completions
registerJjtlCompletions();

// Provide metamodel context for intelligent completions
setCompletionContext({
    sourceClasses: ['State', 'Transition'],
    targetClasses: ['Place', 'Arc'],
});
```

Completions disponibili:
- **Keywords**: transformation, from, to, when, helper (con snippets)
- **Built-in functions**: map, mapAll, resolve, select, collect, first, isEmpty, size, concat, toUpper, toLower
- **Snippets**: class-mapping, attr-mapping, object-creation, conditional-mapping
- **Context-aware**: classi sorgente/target quando disponibili

---

### 3. View Components (`frontend/src/jjtl/views/`)

#### MetamodelTreeView
Tree collapsibile per visualizzare struttura metamodello.

Props:
```typescript
interface MetamodelTreeViewProps {
    metamodel: MetamodelElement[];
    title: string;
    side: 'source' | 'target';
    selectedElement?: string;
    onElementSelect?: (element: MetamodelElement) => void;
    onElementDragStart?: (element: MetamodelElement, e: React.DragEvent) => void;
    highlightedElements?: Set<string>;
}
```

Features:
- Icone colorate per tipo (package, class, attribute, reference, enumeration)
- Ricerca elementi
- Drag & drop per creare mappings
- Highlight elementi mappati

---

#### DualMetamodelPanel
Vista side-by-side metamodelli sorgente e target.

```typescript
<DualMetamodelPanel
    sourceMetamodel={sourceElements}
    targetMetamodel={targetElements}
    sourceMetamodelName="StateMachineMM"
    targetMetamodelName="PetriNetMM"
    mappings={connections}
    onMappingCreate={(srcId, tgtId) => { ... }}
    onMappingDelete={(mappingId) => { ... }}
/>
```

---

#### MappingLinesOverlay
SVG overlay con curve Bezier per collegare elementi mappati.

Features:
- Linee colorate per tipo (class=cyan, attribute=green, reference=purple)
- Linee tratteggiate per mapping inferiti
- Hover per delete button
- Click per selezionare mapping

---

#### ProblemsPanel
Pannello errori/warning stile VS Code.

```typescript
<ProblemsPanel
    problems={errors.map(parserErrorToProblem)}
    onProblemClick={(problem) => editor.revealLine(problem.line)}
/>
```

Features:
- Filtro per severità (errors, warnings, info)
- Conteggi per tipo
- Click per navigare a errore

---

#### MappingTraceView
Visualizzazione trace di esecuzione trasformazione.

Features:
- Lista elementi mappati con stato (success, partial, failed)
- Espansione per dettagli attributi mappati
- Filtro per stato
- Ricerca

---

#### InferredMappingsPanel
Pannello per mapping suggeriti automaticamente.

Features:
- Confidence score con indicatore visivo
- Accept/Reject singolo o multiplo
- Filtro per confidence (High/Medium/Low)
- Preview on hover

---

### 4. Container Components (`frontend/src/jjtl/components/`)

#### JjtlToolbar
Toolbar principale con azioni file/edit/execute.

```typescript
<JjtlToolbar
    transformationName="StateMachine2PetriNet"
    sourceMetamodel="StateMachineMM"
    targetMetamodel="PetriNetMM"
    hasUnsavedChanges={true}
    canExecute={isValid}
    onSave={handleSave}
    onExecute={handleExecute}
/>
```

Sezioni:
- File: New, Open, Save, Save As
- Edit: Undo, Redo
- Metamodels: Source/Target selector dropdowns
- Actions: Validate, Format, Execute (primary button)
- Info: Transformation name, unsaved indicator

---

#### JjtlStatusBar
Status bar con info parser/execution.

```typescript
<JjtlStatusBar
    parserStatus="valid"  // 'idle' | 'parsing' | 'valid' | 'error'
    errorCount={0}
    warningCount={2}
    cursorLine={15}
    cursorColumn={8}
    executionStatus="success"
    lastExecutionTime={234}  // ms
    mappedElementsCount={12}
/>
```

---

#### JjtlDevelopmentEnv
Container principale IDE completo.

```typescript
<JjtlDevelopmentEnv
    initialCode={savedCode}
    sourceMetamodel={sourceElements}
    targetMetamodel={targetElements}
    sourceMetamodelName="StateMachineMM"
    targetMetamodelName="PetriNetMM"
    onSave={(code) => saveToFile(code)}
/>
```

Layout modes:
- `editor-only`: Solo editor
- `split-horizontal`: Metamodels | Editor | Inferred
- `split-vertical`: Metamodels sopra, Editor sotto

Bottom panel tabs:
- Problems: Errori parser
- Trace: Execution trace

---

### 5. React Hooks (`frontend/src/jjtl/hooks/`)

#### useJjtlParser
Hook per parsing con debounce.

```typescript
const { ast, errors, isValid, isParsing, parse } = useJjtlParser({
    debounceMs: 300,
});

// In onChange handler
parse(newCode);
```

---

#### useJjtlExecutor
Hook per esecuzione trasformazioni.

```typescript
const {
    execute,
    isExecuting,
    executionStatus,  // 'idle' | 'running' | 'success' | 'failed'
    trace,
    lastExecutionTime,
    clearTrace,
} = useJjtlExecutor({
    onExecutionComplete: (result) => { ... },
});

// Execute
await execute(ast, sourceModel);
```

---

### 6. Styles (`frontend/src/jjtl/styles/jjtl.scss`)

SCSS completo con:
- Variabili design system (colori, typography, spacing)
- Stili tutti i componenti
- Layout responsive
- Animazioni (spinning, transitions)
- Dark mode ready (variabili CSS)

---

## STRUTTURA FINALE

```
frontend/src/jjtl/
├── index.ts                     # Main exports
├── README.md                    # Documentation
├── types/
│   ├── index.ts
│   ├── ast.ts                   # AST node types
│   └── tokens.ts                # Token types
├── lexer/
│   ├── index.ts
│   └── lexer.ts                 # Tokenizer
├── parser/
│   ├── index.ts
│   └── parser.ts                # Recursive descent parser
├── executor/
│   ├── index.ts
│   └── executor.ts              # Execution engine (placeholder)
├── editor/
│   ├── index.ts
│   ├── JjtlEditor.tsx           # Monaco editor wrapper
│   ├── jjtlLanguage.ts          # Language definition
│   ├── jjtlTheme.ts             # Syntax highlighting theme
│   └── jjtlCompletions.ts       # Autocompletion provider
├── views/
│   ├── index.ts
│   ├── MetamodelTreeView.tsx    # Tree component
│   ├── DualMetamodelPanel.tsx   # Side-by-side view
│   ├── MappingLinesOverlay.tsx  # SVG connections
│   ├── ProblemsPanel.tsx        # Error list
│   ├── MappingTraceView.tsx     # Execution trace
│   └── InferredMappingsPanel.tsx # AI suggestions
├── components/
│   ├── index.ts
│   ├── JjtlToolbar.tsx          # Main toolbar
│   ├── JjtlStatusBar.tsx        # Status bar
│   └── JjtlDevelopmentEnv.tsx   # Full IDE container
├── hooks/
│   ├── index.ts
│   ├── useJjtlParser.ts         # Parser hook
│   └── useJjtlExecutor.ts       # Executor hook
└── styles/
    └── jjtl.scss                # All component styles
```

---

## SINTASSI JjTL

```jjtl
transformation StateMachine2PetriNet

from StateMachineMM
to   PetriNetMM

# Ogni State diventa un Place
State -> Place {
    name -> label
    isInitial -> tokens : true=1, false=0
}

# Ogni Transition diventa Transition + Arcs
Transition -> Transition [*] {
    name -> label

    # Crea arco da Place sorgente
    -> inputArcs {
        -> Arc {
            place -> source.map()
            weight -> 1
        }
    }
}

# Helper function
helper formatLabel(s: String) -> String {
    s.toUpper()
}
```

---

## API USAGE

```typescript
// Import everything
import {
    tokenize,
    parse,
    execute,
    JjtlEditor,
    JjtlDevelopmentEnv,
    useJjtlParser,
    useJjtlExecutor,
    registerJjtlLanguage,
    registerJjtlTheme,
    registerJjtlCompletions,
} from './jjtl';

// Basic parsing
const { tokens, errors: lexerErrors } = tokenize(source);
const { ast, errors: parserErrors } = parse(tokens);

// React component
<JjtlEditor
    value={code}
    onChange={setCode}
    onParse={({ errors }) => setErrors(errors)}
    height="400px"
    readOnly={false}
/>

// Full IDE
<JjtlDevelopmentEnv
    sourceMetamodel={sourceElements}
    targetMetamodel={targetElements}
    onSave={handleSave}
/>
```

---

## FILES CREATI

| File | Linee | Descrizione |
|------|-------|-------------|
| `types/tokens.ts` | 63 | Token types e interfaces |
| `types/ast.ts` | 150 | AST node types completi |
| `lexer/lexer.ts` | 240 | Tokenizer con error handling |
| `parser/parser.ts` | 520 | Parser recursive descent |
| `executor/executor.ts` | 45 | Placeholder esecuzione |
| `editor/jjtlLanguage.ts` | 103 | Monaco language definition |
| `editor/jjtlTheme.ts` | 62 | Syntax highlighting theme |
| `editor/JjtlEditor.tsx` | 135 | React editor component |
| `editor/jjtlCompletions.ts` | 200 | Autocompletion provider |
| `views/MetamodelTreeView.tsx` | 180 | Tree view component |
| `views/DualMetamodelPanel.tsx` | 150 | Dual panel component |
| `views/MappingLinesOverlay.tsx` | 200 | SVG overlay |
| `views/ProblemsPanel.tsx` | 160 | Problems panel |
| `views/MappingTraceView.tsx` | 280 | Trace viewer |
| `views/InferredMappingsPanel.tsx` | 250 | Suggestions panel |
| `components/JjtlToolbar.tsx` | 180 | Toolbar component |
| `components/JjtlStatusBar.tsx` | 140 | Status bar |
| `components/JjtlDevelopmentEnv.tsx` | 320 | Main IDE container |
| `hooks/useJjtlParser.ts` | 100 | Parser React hook |
| `hooks/useJjtlExecutor.ts` | 140 | Executor React hook |
| `styles/jjtl.scss` | 850 | Complete SCSS styles |
| `README.md` | 170 | Documentation |

**Totale: ~4,400 linee di codice**

---

---

## LAVORO COMPLETATO (Sessione 2 - 2026-02-01)

### 7. JjScript `extends` Command

Implementato comando `extends` per definire ereditarietà tra classi in JjScript.

#### Sintassi
```jjscript
ChildClass extends ParentClass
```

#### Files Creati/Modificati

**frontend/src/jjscript/executor/commands/extends.ts** (nuovo):
- Risolve child e parent class nel metamodel corrente
- Verifica che entrambi siano classi
- Rileva cicli di ereditarietà
- Usa `SetFieldAction.new()` con `+=` per supportare ereditarietà multipla (Ecore)

**frontend/src/jjscript/parser/parser.ts**:
- Aggiunto `peekNext()` per lookahead
- Rilevamento speciale pattern `Identifier extends Identifier`
- Metodo `parseExtendsCommand()` per parsing

**frontend/src/jjscript/types.ts**:
- Aggiunto `'extends'` a `CommandType`
- Nuova interfaccia `ExtendsArgs`

**frontend/src/jjscript/executor/executor.ts**:
- Aggiunto case per comando `extends`

**frontend/src/jjscript/executor/commands/index.ts**:
- Export `executeExtends`

---

### 8. Execute Transformation Dialog

Dialog per eseguire trasformazioni JjTL con selezione del modello sorgente.

#### UI Design

```
┌─────────────────────────────────────────┐
│ ▶  Execute Transformation         [X]  │
├─────────────────────────────────────────┤
│ Transformation: StateMachine2PetriNet   │
│ [StateMachineMM] → [PetriNetMM]         │
├─────────────────────────────────────────┤
│                                         │
│ Source Model *                          │
│ Select an instance of StateMachineMM    │
│ ┌─────────────────────────────────────┐ │
│ │ MyStateMachine                    ▼ │ │
│ └─────────────────────────────────────┘ │
│ 3 models available                      │
│                                         │
│ Output Model Name *                     │
│ Name for the generated PetriNetMM       │
│ ┌─────────────────────────────────────┐ │
│ │ StateMachineMM_to_PetriNetMM        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ EXECUTION PREVIEW ─────────────────┐ │
│ │ Input: MyStateMachine               │ │
│ │   →                                 │ │
│ │ Output: StateMachineMM_to_PetriNetMM│ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│              [Cancel]  [▶ Execute]      │
└─────────────────────────────────────────┘
```

#### Features
- Filtro automatico modelli compatibili (conformi al metamodel sorgente)
- Generazione automatica nome output
- Validazione nome duplicato
- Preview esecuzione
- Warning se nessun modello compatibile

#### Files Creati

**frontend/src/jjtl/components/ExecuteTransformationDialog.tsx**:
```typescript
interface ExecuteTransformationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (sourceModelId: string, outputModelName: string) => void;
    transformationName: string;
    sourceMetamodelName: string;
    targetMetamodelName: string;
    availableModels: ModelOption[];
    existingModelNames: string[];
}

interface ModelOption {
    id: string;
    name: string;
    metamodelId: string;
    metamodelName: string;
}
```

**frontend/src/jjtl/components/execute-transformation-dialog.scss**:
- Stili dialog con design system Jjodel
- Badge colorati source (cyan) / target (purple)
- Bottone execute verde gradient
- Preview box con layout flex

#### Files Modificati

**frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx**:
- Nuove props: `availableModels`, `existingModelNames`, `onExecuteTransformation`
- State `isExecuteDialogOpen`
- Handler `handleExecuteClick` apre dialog
- Handler `handleExecuteTransformation` esegue trasformazione
- Integrazione dialog nel render

**frontend/src/jjtl/components/index.ts**:
- Export `ExecuteTransformationDialog` e tipi

---

## TODO / PROSSIMI PASSI (Sprint 2)

1. ⬜ **Executor Implementation** - Implementare esecuzione effettiva trasformazioni
2. ⬜ **Trace Mapping** - Collegare trace entries a elementi UI
3. ⬜ **Inferred Mappings AI** - Algoritmo per suggerire mapping da struttura metamodelli
4. ⬜ **File I/O** - Salvare/caricare file .jjtl
5. ⬜ **Integration** - Integrare in Jjodel main app
6. ⬜ **Validation** - Validazione semantica (tipi, riferimenti)
7. ⬜ **Error Recovery** - Parser error recovery per migliore UX

---

*Ultimo aggiornamento: 2026-02-01*
