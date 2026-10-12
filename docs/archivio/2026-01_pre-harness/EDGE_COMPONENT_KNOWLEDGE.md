# Edge Component per jjodel - Documentazione Completa

## Panoramica del Progetto

Questo documento descrive il componente **Edge** per il framework **jjodel**, un editor di diagrammi UML basato su React. Il componente è responsabile del rendering e dell'interazione degli archi (edges) che collegano i nodi nei diagrammi.

**Versione attuale:** v1.7.13  
**LOC:** ~2440 righe  
**File:** `edge1-17-13.jsx`

---

## Architettura e Vincoli Tecnici

### Pattern IIFE Obbligatorio

Il componente **DEVE** usare il pattern IIFE (Immediately Invoked Function Expression) all'interno di JSX. Questo è un requisito del framework jjodel e non può essere modificato.

```jsx
<div className={"edge hoverable hide-ep clickthrough fullscreen Association"}>
{(() => {
  try {
    // Tutto il codice del componente va qui
    return (/* JSX */);
  } catch (e) {
    console.error("Edge Render Error:", e);
    return null;
  }
})()}
</div>
```

### Gestione dello Stato

**IMPORTANTE:** Non si possono usare React hooks (useState, useEffect, etc.) a causa del pattern IIFE.

Lo stato deve essere gestito tramite `edge.state`:

```javascript
// Helper per leggere lo stato
const getEdgeState = function(key, defaultVal) {
  if (!edge.state) return defaultVal;
  if (edge.state[key] === undefined) return defaultVal;
  return edge.state[key];
};

// Helper per scrivere lo stato (crea nuovo oggetto, non modifica)
const setEdgeState = function(key, value) {
  var newState = {};
  if (edge.state) {
    for (var k in edge.state) {
      if (edge.state.hasOwnProperty(k)) {
        newState[k] = edge.state[k];
      }
    }
  }
  newState[key] = value;
  edge.state = newState;
};
```

### Oggetti Principali Disponibili

- `edge` - L'oggetto edge corrente
- `edge.start` - Il nodo sorgente (startBox)
- `edge.end` - Il nodo destinazione (endBox)
- `edge.anchorStart` - Nome dell'anchor sul nodo sorgente (es: 't', 'b', 'l', 'r', 'ttr', 'bbl', etc.)
- `edge.anchorEnd` - Nome dell'anchor sul nodo destinazione
- `edge.startFollow` - Boolean: se `true`, l'edge sta aspettando selezione anchor su start
- `edge.endFollow` - Boolean: se `true`, l'edge sta aspettando selezione anchor su end
- `edge.midnodes` - Array di punti intermedi per il routing
- `props` - Props passate al componente (slabel, elabel, etc.)
- `segments` - Informazioni sui segmenti dell'edge

---

## Sistema degli Anchor

### Nomenclatura Anchor

Gli anchor sui nodi sono identificati da stringhe:

| Nome | Posizione | x | y |
|------|-----------|---|---|
| `tl` | Top-Left (corner) | 0 | 0 |
| `t` | Top-Center | 0.5 | 0 |
| `tr` | Top-Right (corner) | 1 | 0 |
| `l` | Left-Center | 0 | 0.5 |
| `0` | Center | 0.5 | 0.5 |
| `r` | Right-Center | 1 | 0.5 |
| `bl` | Bottom-Left (corner) | 0 | 1 |
| `b` | Bottom-Center | 0.5 | 1 |
| `br` | Bottom-Right (corner) | 1 | 1 |
| `ttl` | Top tra tl e t | 0.25 | 0 |
| `ttr` | Top tra t e tr | 0.75 | 0 |
| `bbl` | Bottom tra bl e b | 0.25 | 1 |
| `bbr` | Bottom tra b e br | 0.75 | 1 |
| `tll` | Left tra tl e l | 0 | 0.25 |
| `bll` | Left tra l e bl | 0 | 0.75 |
| `trr` | Right tra tr e r | 1 | 0.25 |
| `brr` | Right tra r e br | 1 | 0.75 |

### Anchor per Lato

```javascript
const SIDE_ANCHORS = {
  'top':    ['ttl', 't', 'ttr'],
  'bottom': ['bbl', 'b', 'bbr'],
  'left':   ['tll', 'l', 'bll'],
  'right':  ['trr', 'r', 'brr']
};
```

### Accesso agli Anchor

Gli anchor di un nodo sono accessibili tramite:
```javascript
edge.start.anchors['t']  // { x: 0.5, y: 0, name: 't', w: 15, h: 15 }
edge.end.anchors['r']    // { x: 1, y: 0.5, name: 'r', w: 15, h: 15 }
```

---

## Follow Mode (Cambio Anchor)

### Come Funziona

Quando l'utente clicca su un anchor handle dell'edge e trascina:

1. `edge.endFollow = true` (o `startFollow` se trascina l'altro endpoint)
2. jjodel mostra gli anchor disponibili sul nodo target
3. Appare il messaggio "Changing anchor, press Esc to undo"
4. L'utente può:
   - Rilasciare su un anchor → cambia l'anchor
   - Premere Esc → annulla l'operazione
   - **Rilasciare su area vuota → PRIMA richiedeva Esc, ORA auto-cancella (v1.7.13)**

### Regole Importanti

- `startFollow` e `endFollow` **non possono essere entrambi `true`** contemporaneamente
- Possono essere **entrambi `false`** (stato normale, edge vincolato)
- Impostare `xxxFollow = false` annulla l'operazione pending

---

## v1.7.13 - Auto-Cancel su Area Vuota

### Il Problema

Prima della v1.7.13, se l'utente trascinava un anchor handle e rilasciava il mouse su un'area vuota (non su un anchor del nodo target), l'operazione rimaneva in stato "pending":
- Gli anchor del nodo target rimanevano visibili
- Il messaggio "press Esc to undo" rimaneva visibile
- L'utente doveva premere Esc manualmente per annullare

### La Soluzione

#### 1. Rilevamento del rilascio su anchor valido

```javascript
const isReleasedOnAnchor = function(eventTarget) {
  var el = eventTarget;
  while (el && el !== document) {
    if (el.classList && el.classList.contains('anchor')) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
};
```

Questo pattern replica quello usato internamente da jjodel:
```javascript
U.ancestorArray(event.target).some(e => e.classList.contains('anchor'))
```

#### 2. Auto-cancel nel handler mouseup

```javascript
var handleNormalDragEnd = function(upEvent) {
  document.removeEventListener('mousemove', handleNormalDragMove, true);
  document.removeEventListener('mouseup', handleNormalDragEnd, true);
  setEdgeState('_ghostPosition', null);
  setEdgeState('_draggingAnchor', null);
  
  // NEW in v1.7.13: Auto-cancel if not released on a valid anchor
  if (!isReleasedOnAnchor(upEvent.target)) {
    // Released in empty space - cancel with setTimeout to run after jjodel
    setTimeout(function() { edge.endFollow = false; }, 0);
  }
};
```

### Perché `setTimeout(..., 0)`?

**CRITICO:** Il `setTimeout` è essenziale! Senza di esso, non funziona.

Il motivo: i nostri event listener usano la fase di **capture** (`true` come terzo parametro di `addEventListener`), ma jjodel ha i suoi handler che vengono eseguiti e potrebbero sovrascrivere le nostre modifiche immediate.

`setTimeout(..., 0)` schedula l'esecuzione per il prossimo tick dell'event loop, **dopo** che jjodel ha completato i suoi handler.

### Tentativo Fallito: Simulare Escape

Prima abbiamo provato a simulare la pressione del tasto Escape:

```javascript
// NON FUNZIONA!
document.dispatchEvent(new KeyboardEvent('keydown', {
  key: 'Escape',
  code: 'Escape',
  keyCode: 27,
  which: 27,
  bubbles: true,
  cancelable: true
}));
```

**Perché non funziona:** L'evento sintetico ha `isTrusted: false`, e jjodel (come molti framework) ignora eventi non-trusted per ragioni di sicurezza.

---

## Sistema di Interazione Completo

### Tabella Riassuntiva

| Azione | Risultato |
|--------|-----------|
| Hover su anchor handle | Cursor: crosshair, handle evidenziato |
| Hover + Shift | Cursor: ew-resize/ns-resize (not-allowed per '0') |
| Click + Drag | Ghost circle segue il mouse, jjodel mostra anchor target |
| Rilascio su anchor | Cambia l'anchor dell'edge |
| Rilascio su area vuota | **Auto-cancel** (v1.7.13) |
| Shift + Click + Drag | Fine-tuning: slide anchor lungo il suo lato |
| Ctrl + Click | Reset anchor a posizione default |

### Ghost Circle

Durante il drag normale, appare un cerchio grigio che segue il mouse. È implementato come div HTML (non SVG) per garantire z-index superiore:

```javascript
window.__edgeGhostDiv = document.createElement('div');
window.__edgeGhostDiv.style.cssText = 
  'position:fixed;width:16px;height:16px;border-radius:50%;' +
  'background:#888;opacity:0.7;pointer-events:none;z-index:99999;' +
  'transform:translate(-50%,-50%);display:none;';
document.body.appendChild(window.__edgeGhostDiv);
```

### Shift Mode (Fine-Tuning)

- L'anchor handle diventa teal (#0480A8) con bordo più spesso
- L'utente può trascinare l'anchor lungo il suo lato (top/bottom = orizzontale, left/right = verticale)
- Il movimento è fluido durante il drag
- Allo rilascio, snappa alla griglia (ANCHOR_SNAP_GRID = 30px)
- I corner sono esclusi (ANCHOR_CORNER_THRESHOLD = 0.08)

### Ctrl Mode (Reset)

Resetta l'anchor alla sua posizione default definita in `ANCHOR_POSITIONS`.

---

## Costanti di Configurazione

```javascript
const ANCHOR_SNAP_GRID = 30;           // Snap grid in pixels
const ANCHOR_CORNER_THRESHOLD = 0.08;  // Exclude corners (< 0.08 or > 0.92)
const ANCHOR_HANDLE_RADIUS = 8;        // Radius of anchor handle circle

// Shift mode styling
const ANCHOR_SHIFT_FILL = 'rgba(4, 128, 168, 0.3)';
const ANCHOR_SHIFT_RADIUS = 10;
const ANCHOR_SHIFT_STROKE = '#0480A8';
const ANCHOR_SHIFT_STROKE_WIDTH = 4;

// Ghost circle
const ANCHOR_GHOST_FILL = '#888888';
const ANCHOR_GHOST_OPACITY = 0.7;
```

---

## Struttura delle Sezioni del Codice

Il componente è organizzato in sezioni numerate:

1. **CONFIGURATION CONSTANTS** - Costanti di configurazione
2. **HELPER FUNCTIONS** - getEdgeState, setEdgeState
2b. **ANCHOR DRAG HELPERS** - Funzioni per drag anchor
2c. **ANCHOR RELEASE HELPER** - isReleasedOnAnchor (v1.7.13)
3. **SELF-LOOP CHECK** - Rilevamento self-loop
4. **SELF-LOOP RENDERING** - Rendering per self-loop
5. **GEOMETRY HELPERS** - Funzioni geometriche
6. **COLLISION DETECTION** - Rilevamento collisioni
7. **ANCHORS & CONTROL POINTS** - Calcolo anchor
8. **ESCAPE POINTS** - Punti di uscita dai nodi
9. **ROUTING POINT CONSTRUCTION** - Costruzione path
10. **ORTHOGONALIZATION** - Ortogonalizzazione path
11. **PATH CLEANUP & BUILDING** - Costruzione path SVG
12. **COMPUTE FINAL PATH** - Path finale
13. **SEGMENT HANDLES DATA** - Dati per handle segmenti
14. **LABEL POSITIONING** - Posizionamento etichette
15. **EVENT HANDLERS** - Tutti gli handler eventi
15.1. **SEGMENT DRAG HANDLER** - Drag segmenti
15.2. **HOVER HANDLERS** - Handler hover
16. **BUILD HOVER RECTS** - Rect invisibili per hover
17. **RENDER** - JSX finale

---

## Changelog Rilevante

### v1.7.13 (Attuale)
- Auto-cancel quando si rilascia su area vuota
- `isReleasedOnAnchor()` + `setTimeout` pattern

### v1.7.12
- Ghost circle durante drag normale
- Fix hover highlighting anchor handle

### v1.7.11
- Shift+Click fine-tuning mode
- Ctrl+Click reset to default
- Hover + Shift cursor preview

### v1.7.10
- Fluid anchor drag con snap on release

### v1.7.2 - v1.7.9
- Self-loop support
- Anchor drag infrastructure

### v1.6.0
- Invisible hover rects per flicker-free hover

---

## Debug Tips

### Filtro Console
Usa il prefisso "Alfi" nei console.log per filtrare facilmente:
```javascript
console.log('Alfi something:', value);
```

### Ispezionare l'oggetto edge
```javascript
// NON usare JSON.stringify (riferimenti circolari)
console.log('edge keys:', Object.keys(edge));
console.log('edge.endFollow:', edge.endFollow);
console.log('edge.startFollow:', edge.startFollow);
```

### Verificare U.ancestorArray di jjodel
```javascript
if (typeof U !== 'undefined' && typeof U.ancestorArray === 'function') {
  var ancestors = U.ancestorArray(someElement);
  console.log('ancestors:', ancestors.length);
}
```

---

## Note Importanti

1. **Non usare optional chaining (`?.`)** - Per compatibilità con versioni vecchie
2. **Usare `var` invece di `let/const`** dentro i closure per sicurezza
3. **Event listener in capture phase** - Usare `true` come terzo parametro per intercettare prima di jjodel
4. **Elementi SVG vs HTML** - Per z-index elevato, usare div HTML invece di elementi SVG

---

## Come Continuare lo Sviluppo

1. Carica questo documento nella nuova chat
2. Carica il file `edge1-17-13.jsx`
3. Spiega cosa vuoi modificare/aggiungere
4. Ricorda di aggiornare sempre il changelog nel file!

---

*Documento generato il 2026-01-16 dalla sessione di sviluppo conversazionale.*
