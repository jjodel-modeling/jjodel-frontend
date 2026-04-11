# Task: Click su view nel Tree View → mostrare sub-tab editor nel pannello Properties

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

## Contesto
Il Tree View a destra mostra la struttura completa del progetto, inclusi i VIEWPOINTS con le view espandibili (es. Default > Model, Package, Class, Attribute, Reference, ecc.).

Quando l'utente clicca su una **view** nel Tree View, il pannello Properties (a sinistra del Tree View) deve mostrare l'editor della view con i sub-tab:
- **Apply to** — Name, Is Exclusive, Priority, Preferred appearance, Appliable to, Viewpoint, Parent view, OCL Editor, JS Editor
- **Template** — editor Monaco con JSX template
- **Style** — color picker per variabili CSS + Local CSS/LESS Editor
- **Events** — Default Events (onDataUpdate, onDragStart, whileDragging, etc.) + Custom Events
- **Options** — Field, Edge (BendingMode, offsets, sizes), EdgePoint, Vertex (Draggable, Resizable, etc.), Graph

Questi componenti esistono già nel codebase — sono stati confermati funzionanti:
- Apply to → `InfoData` 
- Template → `TemplateData`
- Style → `PaletteData`
- Events → `EventsData`
- Options → `GenericNodeData`

Sono usati dentro `ViewData` che li renderizza come sub-tab.

## Fase 1 — Capire il flusso attuale

```bash
# Come fa il Properties panel a decidere cosa mostrare?
# Trova il componente principale del pannello Properties
grep -rn "Properties\|Info\|PropertiesPanel" src/components/panels/ --include="*.tsx" -l | head -10

# Trova dove viene letto l'elemento selezionato per decidere il rendering
grep -rn "_lastSelected\|selectedElement\|selection" src/components/panels/Info*.tsx | head -20

# Trova ViewData — il componente che renderizza i sub-tab per una view
grep -rn "ViewData" src/ --include="*.tsx" -l | head -10
cat src/components/panels/ViewData.tsx 2>/dev/null | head -50
find src/ -name "ViewData*" -type f
```

```bash
# Come il Tree View gestisce il click sulle view?
grep -rn "view.*click\|selectView\|VIEW\|LView\|DView" src/components/**/TreeView*.tsx --include="*.tsx" | head -20

# Cosa succede quando si clicca un elemento nel Tree View? Quale tipo viene settato?
grep -rn "handleClick\|onClick\|dispatch.*select\|_lastSelected" src/components/**/TreeView*.tsx --include="*.tsx" | head -20
```

## Fase 2 — Capire la discriminazione per tipo

Il pannello Properties decide cosa renderizzare in base al tipo dell'elemento selezionato. Per classi/attributi mostra il form con GENERAL/INHERITANCE/FLAGS. Per una view deve mostrare ViewData con i sub-tab.

```bash
# Trova dove il Properties panel discrimina per tipo di elemento
grep -rn "instanceof\|isView\|isViewpoint\|DView\|LView\|modelElement\|switch\|case" \
  src/components/panels/Info*.tsx | head -30

# Oppure cerca un pattern condizionale
grep -rn "view\|View\|viewpoint\|Viewpoint" src/components/panels/Info*.tsx | head -20
```

## Fase 3 — Implementare il rendering condizionale

Ci sono due possibilità:

### A) Il Properties panel ha già il case per le view ma non funziona
Trova il branch condizionale e fixalo — probabilmente il tipo dell'elemento selezionato non viene riconosciuto come view.

### B) Il Properties panel non ha il case per le view
Aggiungi un branch: se l'elemento selezionato è una view (DView o LView), renderizza `ViewData` al posto del form proprietà standard.

```typescript
// Pseudocodice del pattern atteso
if (selectedElement is DClass/LClass) {
  return <ClassProperties ... />  // GENERAL, INHERITANCE, FLAGS
} else if (selectedElement is DView/LView) {
  return <ViewData view={selectedElement} />  // Apply to, Template, Style, Events, Options
} else if (selectedElement is DViewPoint/LViewPoint) {
  return <ViewpointProperties ... />  // Name, Type (Syntax/Validation), Exclusive
} else {
  return <DefaultProperties ... />
}
```

## Fase 4 — Rimuovere il tab "Viewpoints" dal pannello destro

Il tab "Viewpoints" separato (quello con la rappresentazione gerarchica dell'intero viewpoint, con bottone "+ New" e le voci con priority, OCL, EX) NON deve più apparire. Era un tentativo messo da parte.

```bash
# Trova dove il tab Viewpoints viene aggiunto al dock
grep -rn "Viewpoints\|right-panel-viewpoints\|viewpoints.*tab" \
  src/components/abstract/Dock.tsx --include="*.tsx" | head -10
```

Rimuovi (o commenta) il rendering di questo tab. Il Tree View già mostra i viewpoint e le view — non serve un tab dedicato.

**ATTENZIONE**: NON rimuovere i componenti interni (NestedView, ViewData, ecc.) — rimuovi solo il tab dalla tab bar del pannello destro. I sub-tab (Apply to, Template, etc.) vengono renderizzati dal Properties panel, non dal tab Viewpoints.

## Fase 5 — Verifica anche il click su viewpoint (non view)

Quando si clicca su un **viewpoint** (es. "Default" o "Default Validation") nel Tree View, il pannello Properties deve mostrare:
- Name del viewpoint
- Type (Syntax / Validation) — come segmented control
- Exclusive toggle

Questo è `ViewpointProperties` nella terminologia del codebase.

## Vincoli
- Non toccare il Tree View — la sua struttura è corretta
- Non toccare i componenti ViewData, InfoData, TemplateData, etc. — sono funzionanti
- Modifica solo il pannello Properties (discriminazione per tipo) e Dock.tsx (rimozione tab)
- `npm run build` deve passare
- Aggiornare `docs/claude-code-log.md`

## Verifica
- Apri metamodello → Tree View mostra VIEWPOINTS con le view
- Click su una view (es. "Class") → pannello Properties mostra sub-tab: Apply to | Template | Style | Events | Options
- Click su Apply to → Name, Is Exclusive, Priority, OCL/JS Editor
- Click su Template → editor Monaco con JSX
- Click su Style → color picker + CSS editor
- Click su Events → Default Events + Custom Events  
- Click su Options → Edge, Vertex, Graph settings
- Click su un viewpoint (es. "Default") → pannello Properties mostra Name, Type, Exclusive
- Click su una classe → pannello Properties torna al form GENERAL/INHERITANCE/FLAGS
- Il tab "Viewpoints" separato NON appare più nel pannello destro
- Nessun errore in console

## Log

```
## 2026-04-10 — feat: view selection in tree shows editor sub-tabs in Properties
**Prompt**: click view nel tree → Properties mostra ViewData sub-tab, rimuovi tab Viewpoints separato
**File toccati**: [lista]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [come è stata implementata la discriminazione per tipo, quale componente renderizza ViewData]
```
