# Task: Fix 5 bug dal release testing (sezione B — modello)

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

---

## Bug A — CRITICO: Click su tree view non carica proprietà nel panel

### Sintomi
Quando si clicca su un'istanza (oggetto) nel tree view del modello, il pannello Properties a destra non si aggiorna — resta vuoto o mostra le proprietà dell'elemento precedente.

### Diagnosi

```bash
# Trova il handler di selezione nel tree view per oggetti del modello
grep -rn "onSelect\|onClick\|handleSelect\|handleClick\|treeSelect\|nodeClick" \
  src/components/**/TreeView*.tsx src/components/**/tree*.tsx --include="*.tsx" | head -30

# Trova come la selezione viene propagata al pannello properties
grep -rn "selectedElement\|selection\|setSelected\|dispatch.*select" \
  src/components/**/TreeView*.tsx --include="*.tsx" | head -20

# Cerca il dispatch dell'evento di selezione (potrebbe essere un custom event)
grep -rn "jjodel:select\|SELECT\|setSelection" src/events/registry.ts
```

### Causa probabile
Il click nel tree view dispatcha la selezione per elementi del metamodello (DClass, DAttribute, etc.) ma potrebbe non gestire correttamente gli elementi del modello (istanze/oggetti DObject). Oppure il pannello Properties filtra per tipo e non riconosce gli oggetti del modello.

### Fix
Segui il flusso: tree click → dispatch selezione → Properties panel legge selezione → renderizza.
Trova dove la catena si rompe per gli oggetti del modello e correggi. Non inventare — leggi il codice del flusso che funziona (es. click su metamodello) e replica per il modello.

### Verifica
- Clicca su un'istanza nel tree view → le proprietà appaiono nel pannello destro
- Clicca su un'istanza diversa → le proprietà si aggiornano
- Clicca su un elemento del metamodello → funziona ancora come prima

---

## Bug B — Mostrare "Conforms to" nella property panel del modello

### Sintomi
Quando si seleziona un modello (non un'istanza), la property panel (img2) mostra OVERVIEW, GENERAL (Name), e DEPENDENCIES, ma NON mostra a quale metamodello il modello è conforme. Questa informazione è essenziale per l'utente.

### Diagnosi

```bash
# Trova il componente properties del modello
grep -rn "MODEL\|model_1\|conformsTo\|conforms" \
  src/components/**/Properties*.tsx src/components/**/Model*.tsx --include="*.tsx" | head -20

# Trova dove viene renderizzata la sezione GENERAL per un modello
grep -rn "GENERAL\|DEPENDENCIES\|model.*properties\|ModelProperties" \
  src/ --include="*.tsx" | head -20
```

### Fix
Nella property panel del modello, aggiungi una sezione o una riga sotto OVERVIEW o GENERAL che mostra:
```
Conforms to: metamodel_1
```
L'informazione è già presente nel modello (il modello sa a quale metamodello è conforme). Cerca come viene letto — probabilmente qualcosa come `model.conformsTo` o `model.metamodel` o una reference nel modello dati.

Stile: usa lo stesso pattern visivo del breadcrumb "Conforms to **Person**" che si vede nella property panel degli oggetti (img5 degli screenshot). Dot colorato + "Conforms to" + nome cliccabile.

### Verifica
- Seleziona un modello nel tree view o nella dashboard → la property panel mostra "Conforms to: metamodel_1"
- Il nome del metamodello è visibile e idealmente cliccabile (naviga al metamodello)

---

## Bug C — Context menu posizionato lontano dal click

### Sintomi
Il context menu del flow editor (right-click su un'istanza) appare spostato rispetto al punto del click, come se ci fosse un offset.

### Diagnosi

```bash
# Trova il calcolo della posizione del context menu nel flow editor
grep -rn "contextMenu\|context-menu\|menuPosition\|clientX\|clientY\|pageX\|pageY" \
  src/components/editor-v2/EditorV2.tsx | head -20

# Cerca se c'è un offset o una trasformazione applicata
grep -rn "getBoundingClientRect\|offset\|transform\|scale\|zoom" \
  src/components/editor-v2/EditorV2.tsx | head -20
```

### Causa probabile
Il canvas ha uno zoom/pan attivo (xyflow). La posizione del context menu viene calcolata con `clientX/clientY` del mouse event, ma non tiene conto del viewport transform di xyflow, oppure aggiunge un offset fisso che non corrisponde.

### Fix
Usa le coordinate `clientX/clientY` del mouse event direttamente (non le coordinate del canvas xyflow) per posizionare il menu, dato che il menu è un overlay DOM posizionato rispetto al viewport, non al canvas.

### Verifica
- Right-click su un'istanza → il context menu appare al punto del click
- Zoom in/out → il context menu continua ad apparire al punto del click

---

## Bug D — Highlight tab "File" nel menu

### Sintomi
L'highlight (stato attivo/hover) del tab "File" nella toolbar ha uno stile poco visibile o incongruente con gli altri tab.

### Diagnosi

```bash
# Trova gli stili del menu/toolbar tabs
grep -rn "File\|menu-tab\|nav-tab\|toolbar.*tab" \
  src/components/**/Toolbar*.tsx src/components/**/Navbar*.tsx --include="*.tsx" --include="*.scss" | head -20
```

### Fix
Allinea lo stile hover/active del tab "File" con gli altri tab della toolbar. Probabilmente serve aggiungere o correggere uno stile `:hover` o `.active` nella classe CSS.

### Verifica
- Hover su "File" → highlight visivamente coerente con gli altri tab (Edit, etc.)

---

## Bug E — Attributi non editabili inline nel canvas (flow editor)

### Analisi
In img3 si vede un'istanza Person con `name =` e `age =` ma i valori non sono editabili direttamente nel canvas. L'editing funziona dal pannello Properties (img5).

### Diagnosi prima del fix

```bash
# Verifica se l'editing inline è previsto o se è by design
grep -rn "editable\|inline.*edit\|contentEditable\|input.*slot\|slot.*edit" \
  src/components/editor-v2/ --include="*.tsx" | head -20

# Cerca come vengono renderizzati gli slot/attributi nei nodi del flow editor
grep -rn "slot\|attribute.*value\|renderAttribute\|renderSlot" \
  src/components/editor-v2/ --include="*.tsx" | head -20
```

### NOTA: Potrebbe essere by design
Se gli slot nel flow editor sono read-only (mostra il valore, editing nel pannello), allora NON è un bug — è il pattern corrente. In tal caso NON fixare, ma segnalalo nel log come "by design, editing via Properties panel".

Se invece è previsto che siano editabili (c'è codice per l'inline editing che non funziona), allora è un bug da fixare.

### Verifica
- Se by design: conferma che il valore si aggiorna nel canvas quando lo modifichi nel pannello Properties
- Se bug: double-click sullo slot → appare input → modifica → salva → valore aggiornato

---

## Vincoli generali
- Zero refactoring opportunistico
- `npm run build` deve passare
- Aggiornare `docs/claude-code-log.md`

```
## 2026-04-10 — fix: 5 bug release testing sezione B (tree select, conformsTo, context menu, File tab, slots)
**Prompt**: fix tree view selection per modello, aggiungi conformsTo, fix context menu position, fix File highlight, verifica inline slot editing
**File toccati**: [lista]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [dettagli, specialmente se Bug E è by design]
```
