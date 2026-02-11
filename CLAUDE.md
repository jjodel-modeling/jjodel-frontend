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

**Status UI Redesign:** ~50% completato
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
│   ├── project/           # ProjectEditor, Dashboard
│   └── shared/            # Componenti riutilizzabili
├── jjtl/                  # Transformation Language
│   ├── lexer/             # Tokenizer
│   ├── parser/            # Parser -> AST
│   ├── executor/          # Esecuzione trasformazioni
│   ├── editor/            # Monaco integration
│   ├── components/        # UI (ExecuteTransformationDialog)
│   ├── views/             # MappingTraceView, DualMetamodelPanel
│   └── types/             # AST types, transformation types
├── jjscript/              # Scripting Language
│   ├── parser/            # Grammar, tokenizer
│   ├── executor/          # Command execution
│   └── commands/          # create, copy, delete, etc.
├── jjel/                  # Expression Language
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
    
    # Con conversione
    sourceAttr -> targetAttr : true=1, false=0
    
    # Con espressione
    sourceAttr -> targetAttr : sourceAttr + "_suffix"
}
```

### AST Types
```typescript
interface TransformationAST {
    type: 'Transformation';
    name: string;
    sourceMetamodel: string;
    targetMetamodel: string;
    mappings: ClassMappingAST[];
}

interface ClassMappingAST {
    type: 'ClassMapping';
    sourceClass: string;
    targetClass: string;
    body: AttributeMappingAST[];
}

interface AttributeMappingAST {
    type: 'AttributeMapping';
    sourceAttribute?: string;
    targetAttribute: string;
    conversion?: ConversionAST;
}
```

### Esecuzione Trasformazione
1. Parse JjTL code → AST
2. Trova source model instances
3. Per ogni class mapping:
   - Filtra istanze source per className
   - Crea istanze target
   - Applica attribute mappings
4. Crea DModel + DGraph
5. Aggiungi a Redux state

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

### Modifica Sintassi JjTL — Checklist Obbligatoria

Quando si modifica la grammatica JjTL, aggiornare **SEMPRE** tutti e 4 i file:

1. **Lexer** (`frontend/src/jjtl/parser/lexer.ts`) — nuovi token se necessari
2. **Parser** (`frontend/src/jjtl/parser/parser.ts`) — regole di parsing
3. **Grammar Rules** (`frontend/src/jjtl/diagrams/types.ts`) — EBNF in `GRAMMAR_RULES`
4. **Railroad Diagrams** (`frontend/src/jjtl/diagrams/GrammarDiagram.tsx`) — rendering visuale

⚠️ Non aggiornare MAI solo il parser senza gli altri. I railroad diagrams sono la documentazione visiva per l'utente e non si aggiornano automaticamente.

### Stato JjTL (Aggiornamento 2026-02-09)

**Completato:**
- ✅ Parser JjTL → AST
- ✅ Executor: class mapping (A -> B)
- ✅ Executor: attribute mapping diretto (name -> label)
- ✅ Executor: evaluatePropertyPath con fallback multi-strategia
- ✅ ProjectEditor: creazione modello target con DModel.new
- ✅ ProjectEditor: creazione istanze con DObject.new
- ✅ ProjectEditor: deferred attribute setting via LModel proxy
- ✅ UI: Manhattan arrows per mapping visualization
- ✅ UI: nomi trasformazioni con `_to_` (no trattini)
- ✅ UI: nomi modelli unici con numerazione progressiva

**Da Completare:**
- ❌ Conversion expressions JjEL (name -> label : name + '_suffix') — da testare
- ❌ Multi-attribute mapping — da testare
- ❌ Reference mapping (oggetti collegati)
- ❌ Guard conditions (`when` clause)
- ❌ Undo/redo per trasformazioni
- ❌ Cleanup log di debug

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

### Nuovi Bug Aperti (2026-02-09)
| Bug | Stato | Note |
|-----|-------|------|
| Valore duplicato (tutti B ricevono A_0) | ⚠️ APERTO | Da verificare executor loop |
| Doppia esecuzione executor | ⚠️ APERTO | React double rendering |
| "Error in View: Fallback" su target | ⚠️ APERTO | Rendering modello creato |

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
| `executor.ts` (jjtl) | Esecuzione trasformazioni |
| `MappingLinesOverlay.tsx` | Frecce di mapping |
| `DualMetamodelPanel.tsx` | Vista side-by-side metamodelli |
| `ExecuteTransformationDialog.tsx` | Dialog esecuzione |

---

## 📅 Ultimo Aggiornamento

**Data:** Febbraio 2026
**Stato JjTL Executor:** In debug - attribute mapping non funziona
**Prossimi Step:** 
1. Fix attribute mapping (verificare flusso executor → ProjectEditor)
2. Completare UI redesign
3. Implementare JjEL property aliases
