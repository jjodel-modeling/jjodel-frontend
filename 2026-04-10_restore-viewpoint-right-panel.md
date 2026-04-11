# Task: Riportare l'editing dei viewpoint nel pannello destro

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

## Contesto
Nella versione precedente (Natale 2025), l'editing dei viewpoint era nel **pannello destro** come tab "Viewpoints" con:
- Tree dei viewpoint e delle view (con breadcrumb navigazione: `State Machine Syntax > Model > View for State > View for InitialState`)
- Sub-tab per ogni view: **Apply to** | **Template** | **Style** | **Events** | **Options** (NO Permissions — da rimuovere)
- Apply to: Name, Is Exclusive, Priority, Preferred appearance, Appliable to, Viewpoint, Parent view, OCL Editor, JS Editor
- Template: editor Monaco con JSX
- Style: color picker per variabili CSS + Local CSS & LESS Editor (Monaco)
- Events: Default Events (onDataUpdate, onDragStart, whileDragging, onDragEnd, onResizeStart, whileResizing, onResizeEnd) + Custom Events
- Options: Field, Edge (BendingMode, GapMode, offsets, sizes), EdgePoint, Vertex (Store Size, Lazy Update, Adapt Width/Height, Draggable, Resizable), Graph

Attualmente il routing usa `ViewpointEditorPanel` (pagina dedicata via `TabDataMaker`). Dobbiamo tornare al pannello destro.

## Fase 1 — Verifica cosa esiste ancora nel pannello destro

```bash
# Cerca il tab Viewpoints nel pannello destro
grep -rn "Viewpoints\|viewpoints.*tab\|ViewpointsTab\|ViewpointsPanel" \
  src/components/panels/ src/components/abstract/ --include="*.tsx" -l | head -10

# Cerca i sub-tab (Apply to, Template, Style, Events, Options)
grep -rn "Apply to\|Template\|Events\|Options\|Permissions" \
  src/components/panels/ --include="*.tsx" | head -20

# Cerca il componente che renderizza il pannello destro con i tab
grep -rn "Properties\|Tree View\|Viewpoints\|Node\|Console" \
  src/components/panels/ src/components/abstract/ --include="*.tsx" | grep -i "tab" | head -20

# Cerca NestedView che era il componente del tree viewpoint nel pannello destro
grep -rn "NestedView" src/ --include="*.tsx" --include="*.ts" -l | head -10
```

## Fase 2 — Capire lo stato del codice

Possibili scenari:
A) Il tab "Viewpoints" è ancora nel pannello destro ma nascosto/disabilitato → riattivarlo
B) Il tab è stato rimosso ma i componenti interni esistono ancora → ricollegare
C) Il codice è stato eliminato → serve un recovery da git (ma è improbabile, il redesign ha toccato solo `panels/viewpoint-editor/`)

Per ciascun sub-tab, verifica se il componente esiste:
```bash
# Apply to (proprietà della view)
grep -rn "Exclusive\|Priority\|Appliable\|Parent view\|OCL Editor\|JS Editor" \
  src/components/panels/ --include="*.tsx" -l | head -10

# Template editor
grep -rn "template.*editor\|TemplateEditor\|templateTab" \
  src/components/panels/ --include="*.tsx" -l | head -10

# Style editor (color picker + CSS editor)
grep -rn "StyleEditor\|color.*picker\|LESS\|styleTab" \
  src/components/panels/ --include="*.tsx" -l | head -10

# Events
grep -rn "onDataUpdate\|onDragStart\|Default Events\|Custom Events\|EventsTab" \
  src/components/panels/ --include="*.tsx" -l | head -10

# Options (Edge, Vertex, Graph settings)
grep -rn "BendingMode\|EdgeGapMode\|EdgeStartOffset\|Draggable\|Resizable\|OptionsTab" \
  src/components/panels/ --include="*.tsx" -l | head -10
```

## Fase 3 — Riattivare il tab Viewpoints nel pannello destro

### Se il tab esiste ma è nascosto:
Trova dove i tab del pannello destro vengono definiti e riattiva "Viewpoints".

### Se il tab è stato rimosso:
Aggiungi il tab "Viewpoints" alla lista dei tab del pannello destro. Il contenuto del tab deve essere il componente che renderizza:
1. Il tree dei viewpoint (quello con NestedView o equivalente)
2. Quando una view è selezionata nel tree: i sub-tab Apply to | Template | Style | Events | Options

### Rimuovi Permissions:
Se il sub-tab "Permissions" esiste, rimuovi solo il suo rendering (non il componente). Non deve apparire nella tab bar.

## Fase 4 — Aggiornare il routing

In `TabDataMaker.tsx`, il click su un viewpoint NON deve più aprire una pagina dedicata. Due opzioni:
1. Il click sulla sezione Viewpoints nella dashboard seleziona il tab "Viewpoints" nel pannello destro (come faceva prima)
2. Oppure il viewpoint si apre come tab del metamodello e il pannello destro mostra automaticamente il tab Viewpoints

Verifica come funzionava il flusso nella versione precedente:
```bash
# Come veniva aperto il viewpoint dalla dashboard?
grep -rn "openViewpoint\|editViewpoint\|selectViewpoint" \
  src/pages/components/Dashboard.tsx --include="*.tsx" | head -10
```

Se il flusso precedente era: click viewpoint nella dashboard → si apre il tab del metamodello → pannello destro switch al tab Viewpoints → allora ripristina quel flusso.

## Fase 5 — NON rimuovere ViewpointEditorPanel

Lascia i file in `src/components/panels/viewpoint-editor/`. Rimuovi solo l'import e l'uso in `TabDataMaker.tsx`. Cleanup separato post-release.

## Fase 6 — Build e verifica

```bash
npm run build
```

## Verifica funzionale
- Apri un progetto con viewpoint
- Nel pannello destro, il tab "Viewpoints" è visibile
- Click sul tab → mostra il tree dei viewpoint con le view
- Click su una view nel tree → appaiono i sub-tab: Apply to | Template | Style | Events | Options
- NO tab "Permissions"
- Apply to: mostra Name, Is Exclusive, Priority, OCL/JS Editor
- Template: editor Monaco con JSX
- Style: color picker + CSS editor
- Events: lista Default Events + Custom Events
- Options: impostazioni Edge, Vertex, Graph
- Il breadcrumb di navigazione funziona (es. `State Machine Syntax > Model > View for State`)
- Dalla dashboard, click su viewpoint → non apre più pagina dedicata, ma seleziona il tab nel pannello destro

## Log

```
## 2026-04-10 — feat: riportare viewpoint editing nel pannello destro
**Prompt**: riattivare tab Viewpoints nel pannello destro con sub-tab Apply to/Template/Style/Events/Options
**File toccati**: [lista]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [cosa era ancora presente vs cosa è stato ricollegato, Permissions rimosso]
```
