# Task: Rimuovere il vecchio viewpoint editor e usare solo il nuovo

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

## Problema
Quando si crea o apre un viewpoint dalla dashboard di progetto, si apre il **vecchio** viewpoint editor — quello con la sidebar "VIEWS" a sinistra, canvas split (preview + "Select a view from the tree to edit"), e pannello destro semplice (Name + Type).

Il **nuovo** viewpoint editor (basato su WorkbenchEditors/ViewpointEditorRoot) è già implementato e funzionante. Il vecchio deve essere rimosso e tutti i flussi di apertura viewpoint devono puntare al nuovo.

## Diagnosi

```bash
# Trova dove la dashboard apre il viewpoint editor
grep -rn "openViewpoint\|editViewpoint\|viewpoint.*editor\|viewpoint.*open\|DockManager.*viewpoint" \
  src/pages/components/Dashboard.tsx src/components/dock/ --include="*.tsx" | head -20

# Trova il componente del vecchio editor
grep -rn "VIEWS\|Select a view from the tree\|Select a preview model" \
  src/components/ --include="*.tsx" -l | head -10

# Trova il nuovo editor (WorkbenchEditors / ViewpointEditorRoot)
find src/ -name "*Workbench*" -o -name "*ViewpointEditor*" | grep -v node_modules

# Trova come il DockManager/TabDataMaker decide quale componente aprire per un viewpoint
grep -rn "viewpoint\|Viewpoint" src/components/dock/ --include="*.tsx" | head -20
```

## Analisi
Il vecchio editor probabilmente viene aperto via `DockManager` o `TabDataMaker` che associa un viewpoint a un componente tab. Bisogna:

1. **Trovare il mapping** vecchio viewpoint → componente tab
2. **Sostituirlo** con il nuovo componente (ViewpointWorkbench o equivalente)
3. **Non rimuovere i file** del vecchio editor per ora — solo scollegare il routing

## Fix

### Step 1: Trova il punto di routing
```bash
grep -rn "TabDataMaker\|tabData\|dockTab\|createTab" src/ --include="*.tsx" | grep -i viewpoint | head -10
```

### Step 2: Sostituisci il componente
Nel punto dove viene creato il tab per il viewpoint, cambia il componente renderizzato dal vecchio al nuovo.

Il nuovo editor è probabilmente `ViewpointWorkbench` o `ViewpointEditorPanel` — cerca quale componente è usato quando il viewpoint si apre dal percorso che funziona (se ce n'è uno).

```bash
# Cerca tutti i percorsi che aprono il nuovo editor
grep -rn "ViewpointWorkbench\|ViewpointEditorPanel\|ViewpointEditorRoot" src/ --include="*.tsx" | head -20
```

### Step 3: Verifica che il nuovo editor riceva le props necessarie
Il vecchio editor probabilmente riceve l'ID del viewpoint come prop. Assicurati che il nuovo editor riceva lo stesso dato.

## Vincoli
- NON eliminare i file del vecchio editor (potrebbe servire come riferimento)
- Cambia SOLO il routing/mapping nel DockManager o TabDataMaker
- Se il nuovo editor è già raggiungibile da un altro percorso (es. doppio click nella sezione Viewpoints della dashboard), verifica che quel percorso funzioni e replica lo stesso pattern
- `npm run build` deve passare
- Aggiornare `docs/claude-code-log.md`

## Verifica
- Dalla dashboard progetto, clicca su un viewpoint → si apre il NUOVO editor (con sezioni GENERAL, BEHAVIOR, template JSX, etc.)
- Crea un nuovo viewpoint → si apre il NUOVO editor
- Il tab nella barra dei tab mostra il nome del viewpoint
- Il vecchio editor (con sidebar VIEWS e canvas split) NON appare più da nessun percorso

```
## 2026-04-10 — fix: redirect viewpoint opening to new editor
**Prompt**: sostituire routing vecchio viewpoint editor con nuovo ViewpointWorkbench
**File toccati**: [lista]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [quale componente era il vecchio, quale il nuovo, dove era il routing]
```
