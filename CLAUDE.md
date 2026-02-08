# CLAUDE.md - Jjodel Project Reference

> Questo file contiene tutte le informazioni, convenzioni e decisioni architetturali per il progetto Jjodel. Da usare come riferimento in Claude Code (VS Code) e nelle sessioni future.

---

## 🎯 Contesto del Progetto

**Jjodel** è un metamodeling tool open-source per ricerca ed educazione. Permette di:
- Creare metamodelli (definizioni di strutture)
- Creare modelli (istanze conformi ai metamodelli)
- Definire trasformazioni model-to-model (JjTL)
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

### Attribute Mapping Non Funziona (IN CORSO)
**Problema:** `label` resta `undefined` dopo trasformazione
**Causa:** `applyAttributeMappings()` non viene chiamato o i valori non vengono copiati nelle features
**Soluzione:** Verificare che:
1. L'executor applichi i mapping dal `classMapping.body`
2. ProjectEditor copi `instanceData[attrName]` in `feature.value`

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

### Per Feature Complesse
1. **Discuti architettura** prima di implementare
2. Crea un **prompt dettagliato** con requisiti chiari
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
