# Pan system discovery — 2026-05-04

## TL;DR

Il pan del classic editor è jQuery UI `draggable`, applicato a `.panning-handle` tramite il React wrapper `<Measurable>` (in `<ScrollableComponent>`). Redux `LGraph.offset` viene aggiornato **solo a `mouseup`** dal callback `onDragEnd` — il wrapper supporterebbe `whileDragging` ma il pan **non lo registra**. Durante il drag le card si muovono perché jQuery UI muta inline `style.left/top` su `.panning-content` (path `Measurable.childmode_drag → fixpos`); le CSS var `--offset-x/--offset-y` (settate dal render React leggendo Redux) restano stale fino al rilascio. Il drag dei nodi (Vertex) usa una bind jQuery UI **separata e diretta** (`Vertex.tsx:212`) con un callback `drag` throttled a `~30fps` via `rafThrottle(..., 32ms)` che dispatcha Redux durante il drag — quindi il drag dei nodi **già aggiorna Redux live**.

## A. Pan del canvas

### A1. Listener attachment

- **File:linea**: `frontend/src/components/forEndUser/Measurable.tsx:484-495` (ramo attivo) e `:469-481` (ramo gemello commentato; usa `<div className="localized-panning-root">` come wrapper extra). Entrambi rendono `<Measurable draggable={{create}} isPanning={graph} onDragEnd={...} onChildren={true}>` con figli `<div.panning-handle><div.panning-content>{children}</div></div>`.
- **Sistema**: jQuery UI draggable. La chiamata effettiva a `($measurable as GObject)['draggable'](options)` è in `Measurable.tsx:170` (path `componentDidMount` legacy) e `:343` (`afterUpdateSingle`).
- **Target element**: il primo figlio della `<div.scrollable>` (cioè `.panning-handle` nella variante attiva). `Measurable` è `onChildren=true`, quindi jQuery UI è bound al wrapper esterno ma il "child" (`.panning-content`) è quello che riceve gli inline style updates durante il drag.
- **Caller chain**: `<Scrollable graph={node}>` viene chiamato da `frontend/src/common/DV.tsx:1221` e `:1329` dentro il compiled jsxString del `DefaultView`. `<Scrollable>` è il named export di `ScrollableComponent` (`Measurable.tsx:613-617`, classe a `:454-499`).

### A2. Pan visuale (cosa muove le card durante il drag)

- **CSS variables**: `--offset-x` e `--offset-y` (formato `'<n>px'`) sono settate dal render React via `styleoverride` su `graphElement.tsx:1202-1203`, leggendo `LGraph.offset.x/y` da Redux:
  ```ts
  if (this.props.isGraph){
      let offset = (this.props.node as any as LGraph).offset;
      styleoverride['--offset-x'] = offset.x + 'px';
      styleoverride['--offset-y'] = offset.y + 'px';
  }
  ```
  Lette in `Measurable.scss:25-29`:
  ```scss
  .panning-content { position: relative; left: var(--offset-x); top: var(--offset-y); }
  ```
- **Durante il drag**: jQuery UI muta inline `style.left`/`style.top` su `.panning-content` (il "child" in `onChildren=true`). Path:
  - `Measurable.tsx:96-134` — `childmode_drag(e, evt, evtkind, ui)` chiamato dal jQuery UI `start`/`drag`/`stop` callback.
  - `Measurable.tsx:212-242` — secondo path `childmode(...)` (riga 182-242 nel file corrente). Il `fixpos()` interno setta `child.style[key] = (oldpos[key] + ui.position[key]) + 'px'` per `left` e `top` ad ogni `evtkind` ('s','ing','e').
  - In modalità panning (`isPanning` non-undefined), allo `start` `oldPos` viene inizializzato da Redux: `Measurable.tsx:206-209` — `this.oldPos.left = ui.position.left = graph.offset.x; ... .top = graph.offset.y`.
- **Al drag end**: `Measurable.tsx:223-230` rimuove gli inline styles dopo 1ms (`setTimeout`):
  ```ts
  if (evtkind === 'e') {
      this.oldPos[key] = newpos;
      AT_TRANSACTION(()=> setTimeout(()=>{
          child.classList.remove('dragging');
          child.classList.add('idle');
          child.style.removeProperty('left');
          child.style.removeProperty('top');
      }, 1));
  }
  ```
  La CSS var-driven positioning torna in carica con il nuovo valore Redux (dispatchato dall'`onDragEnd` callback, A3).
- **Conclusione A2**: durante il drag il movimento è guidato da inline `style.left/top` mutato da jQuery UI; le CSS var `--offset-x/--offset-y` vengono ri-applicate (con il nuovo `LGraph.offset`) solo dopo il `mouseup`. **L'overlay, che legge da Redux, vede solo il valore vecchio fino al `mouseup`.**

### A3. Redux update timing

- **Posizione del dispatch**: `Measurable.tsx:475` (e `:489` nel ramo attivo) — dentro il callback `onDragEnd`:
  ```ts
  if (!offset.equals(coords)) graph.offset = coords as any;
  ```
  Trigger chain: `LGraph.set_offset` (`GraphDataElements.tsx:1131-1144`) → `TRANSACTION` → `SetFieldAction.new(context.data, "offset", val)` → reducer → React re-render → `--offset-x/y` aggiornate via `styleoverride`.
- **Frequenza**: **solo a `mouseup`**. Il pan instantiation a `Measurable.tsx:484-495` passa solo `draggable={{create}}`, `isPanning={graph}`, `onDragEnd={...}`, `onChildren={true}` — **nessun `whileDragging`**. Verificato leggendo i prop dell'unico render attivo del Scrollable.
- **Throttle**: nessun throttle perché nessun update durante drag. (Per riferimento: il vertex drag usa `rafThrottle` a 32ms, vedi B1.)

### A4. Custom event

- **Nessun custom DOM event** specifico per il ciclo del pan. Grep `dispatchEvent` / `new CustomEvent` nei file rilevanti non produce match attinenti.
- **Flag globale**: `windoww.dragging_vertex_size_tmp` (`Vertex.tsx:166`) viene settato solo per il drag dei vertex, **NON per il pan**. Non utile come segnale "is-panning-active".
- **Enum `EMeasurableEvents`** (`joiner/types.ts:145-156`): include `onDragStart`, `onDragEnd`, `whileDragging`, `onResizeStart/End`, `whileResizing`, ecc. È target di `doMeasurableEvent(...)` (`graphElement.tsx:537`, chiamato da `Vertex.tsx:165, 187, 208`) e dispatcha **callback string-eval definite a livello di `DViewElement.whileDragging`** (vedi `joiner/classes.ts:4051`). NON è un DOM event osservabile da componenti React esterni — è interno al sistema view-callback di Jjodel. Per il pan non viene mai dispatchato (il pan non è un DGraphElement con DViewElement applicabile).

## B. Drag dei nodi

### B1. Listener attachment + Redux update

- **File:linea**: `frontend/src/graph/vertex/Vertex.tsx:120-213`. La bind jQuery UI è **diretta**, NON via il React `<Measurable>` wrapper:
  ```ts
  $measurable.draggable(this.draggableOptions);   // :212
  ```
  `this.draggableOptions` (definito a `:120-211`) ha `start`/`drag`/`stop` callbacks tutti popolati.
- **Sistema**: jQuery UI direct call. Stesso jQuery sotto il cofano di Measurable, ma senza il React wrapper.
- **Target element**: `$measurable` è la jQuery wrapping del DOM root del `GraphElementComponent` (verifica esatta del nodo richiede ispezione runtime — vedi D5).
- **Redux update timing**: **throttled a ~30fps DURANTE il drag**. `Vertex.tsx:179-192`:
  ```ts
  const throttledDragUpdate = rafThrottle(
      dragThrottleKey,
      (pos) => {
          PerformanceMetrics.countRender('Vertex_drag_throttled');
          TRANSACTION('Vertex dragging ' + name, () => {
              if (!view.lazySizeUpdate) this.setSize({x: pos.left, y: pos.top});
              for (let vid of allviews) this.doMeasurableEvent(EMeasurableEvents.whileDragging, vid);
          });
      },
      32 // ~30fps
  );
  throttledDragUpdate({left: ui.position.left, top: ui.position.top});
  ```
  `setSize` (`Vertex.tsx:426`) → `node.size = ...` → `set_x/set_y/set_w/set_h` (`GraphDataElements.tsx:447-454`) → `set_size` → `SetFieldAction`. Throttle helper in `frontend/src/utils/DragThrottle.ts:34-...` (`rafThrottle` con minInterval ms).
- **`stop` callback** (`:194-210`): TRANSACTION finale con `setSize({x:ui.position.left, y:ui.position.top})` e `EMeasurableEvents.onDragEnd` per view.
- **`start` callback** (`:156-168`): TRANSACTION + `EMeasurableEvents.onDragStart` + `windoww.dragging_vertex_size_tmp = node.size`.
- **Custom event**: nessun DOM event. Solo `EMeasurableEvents.whileDragging/onDragStart/onDragEnd` via `doMeasurableEvent` (per script user-defined sui DViewElement applicabili).

### B2. Relazione pan / drag nodi

- **Indipendenti**. Pan è bind a `.panning-handle` (jQuery UI via React `<Measurable>` wrapper). Node drag è bind al DOM root del vertex (jQuery UI chiamata diretta in `Vertex.tsx:212`).
- **Mutually exclusive di fatto**: il `mousedown` su una card finisce sul listener della card (vertex drag); su zona vuota della `.panning-handle` finisce sul listener del pan. jQuery UI gestisce la propagation/cancel via il sistema di event delegation interno a `draggable` (handle vs not-handle), ma la mutual exclusion qui è di fatto strutturale per via dei diversi DOM target.
- **Implicazione per L2**: i due flussi richiedono fix indipendenti. Se aggiungiamo `whileDragging` al pan, copriamo il pan; per Fase 3b (drag nodo + edge live) il binario Redux è già pronto, va solo verificato che l'overlay re-renderizzi sui dispatch del vertex drag.

## C. Element ref e selettori

### C1. Ref React stabili

- **`EdgeOverlay.tsx`**: NESSUN `useRef`/`forwardRef`.
- **`ModelTab.tsx`**: NESSUN ref.
- **`GraphElementComponent`** (`graphElement.tsx:583`): ha `this.html = React.createRef<HTMLElement>()` per la root del graph element, ma è incapsulato nella classe (private field, non esposto come prop o context).
- **Conclusione C1**: nessun ref React condiviso fra overlay / ModelTab / graphElement. Per coordinazione (es. overlay che vuole leggere stato del pan) servono callback espliciti, DOM query, oppure subscribe al Redux store. Non c'è un canale React idiomatic disponibile out-of-the-box.

### C2. Class DOM stabili e lifecycle

| Class | Renderer | File:linea | Lifecycle |
|---|---|---|---|
| `.GraphContainer` | `ModelTab` | `ModelTab.tsx:46` | mount finché `graph` esiste sul model; unmount alla chiusura del tab. Stabile durante editing. Anche `MetamodelTab.tsx:190` e `WorkbenchCanvas.tsx:188`, ma sono code path differenti (metamodel + workbench viewpoint). |
| `.scrollable` | `ScrollableComponent` | `Measurable.tsx:467` (`<div ... className=".. + ' scrollable'">`)  | Mount al primo render del `<Scrollable>`; unmount alla rimozione. Aggiunta dinamicamente `.has-scrollable`/`.not-scrollable` a `.GraphContainer` parent in `graphElement.tsx:629-635`. |
| `.panning-handle` | `ScrollableComponent` (interno a `<Measurable>`) | `Measurable.tsx:492` | Direct child di `.scrollable`. Vita = vita del Scrollable. Riceve la class `.ui-draggable` runtime da jQuery UI. |
| `.panning-content` | `ScrollableComponent` | `Measurable.tsx:493` | Direct child di `.panning-handle`. Contiene `{this.props.children}` (le card e tutto il rendering di DefaultView). |
| `.ui-draggable` | jQuery UI runtime | n/a (CSS rules in `Measurable.scss:2-14`) | Aggiunta da `$measurable.draggable(options)` su mount; rimossa on `disable`. |

Lifecycle pratico: tutti questi selettori sono **stabili a edit-session**. L'overlay può fare `document.querySelector('.panning-content')` con ragionevole confidenza.

### C3. CSS variables / inline transform

| Variabile | Scopo | Settata da | Letta da |
|---|---|---|---|
| `--offset-x`, `--offset-y` | pan | `graphElement.tsx:1202-1203` (`if (this.props.isGraph)`), formato `'<n>px'`, da `LGraph.offset` | `Measurable.scss:25-29` (`.panning-content { left: var(--offset-x); top: var(--offset-y); }`) |
| `--zoom-x`, `--zoom-y` | zoom dell'elemento corrente | `graphElement.tsx:1192-1193`, da `node.zoom` | uso interno templates |
| `--total-zoom-x`, `--total-zoom-y` | zoom cumulativo (root → element) | `graphElement.tsx:1195-1196`, da `node.cumulativeZoom` | `Measurable.scss:21-22` (`.scrollable, .not-zoomed { width: calc(100%/var(--total-zoom-x)); ... }`), `DV.tsx:784-785` |
| `--own-zoom-x`, `--own-zoom-y` | zoom proprio del nodo | `graphElement.tsx:1197-1198`, da `node.zoom` | uso interno |
| `--top`, `--left` | posizione vertex | `graphElement.tsx:1208-1209` (`if (this.props.isVertex)`), formato `'<n>px'`, da `vertex.size.x/y` | template DVertex |

**Inline transform durante drag**:
- Pan: `child.style.left = '<n>px'` e `style.top = '<n>px'` su `.panning-content`. Set/reset path: `Measurable.tsx:222-230`.
- Vertex drag: jQuery UI gestisce inline `style.left/top` sull'elemento draggato (il root del vertex). In parallelo, il React render dispatchato a 30fps applica `--top`/`--left` aggiornate. Le due strade convergono perché Redux è la single source of truth.

## D. Ispezione runtime TODO

Comandi DevTools per chiarire i punti che static analysis non risolve:

1. **Verifica frequenza Redux dispatch durante pan**:
   ```js
   const seen = [];
   const orig = window.store.dispatch;
   window.store.dispatch = function(...a) {
       const action = a[0];
       const isOffset = action?.type?.includes?.('offset')
           || (action?.field === 'offset')
           || (typeof action === 'object' && JSON.stringify(action).includes('offset'));
       if (isOffset) seen.push({ t: Date.now(), action });
       return orig.apply(this, a);
   };
   // Pan attivo per ~2s, poi:
   console.table(seen);  // atteso: 1 sola entry (a mouseup)
   window.store.dispatch = orig;  // ripristina
   ```

2. **Verifica esistenza inline style durante pan**:
   ```js
   // Durante un pan sostenuto (mouse held down):
   const pc = document.querySelector('.panning-content');
   const gc = document.querySelector('.GraphContainer');
   console.log({
       inline_left: pc?.style.left,                     // atteso: '<n>px'
       inline_top:  pc?.style.top,
       css_var_x:   gc?.style.getPropertyValue('--offset-x'),  // atteso: stale (vecchio valore)
       css_var_y:   gc?.style.getPropertyValue('--offset-y'),
       computed_left: getComputedStyle(pc).left,
   });
   ```

3. **Verifica jQuery UI options del panning-handle (conferma assenza `drag` callback)**:
   ```js
   const opts = $('.panning-handle').data('uiDraggable')?.options;
   console.log({
       hasStart: typeof opts?.start === 'function',
       hasDrag:  typeof opts?.drag === 'function',   // atteso: false (per il pan)
       hasStop:  typeof opts?.stop === 'function',
   });
   ```

4. **Confronto: frequenza Redux dispatch durante node drag**:
   ```js
   // Stesso wrap del punto 1, ma drag su una card per ~1s:
   // atteso: ~30 entry (rafThrottle a 32ms)
   ```

5. **Verifica DOM node target di `$measurable.draggable()` per Vertex**:
   ```js
   // Su una card visibile:
   $('[data-nodeid]').each(function() {
       const ui = $(this).data('uiDraggable');
       if (ui) console.log(this.tagName, this.className, this.dataset.nodeid);
   });
   ```

6. **Verifica `windoww.dragging_vertex_size_tmp` in entrambi i casi**:
   ```js
   // dragStart su card → atteso: { x, y, w, h }
   // dragStart su .panning-handle (pan) → atteso: undefined
   console.log(windoww.dragging_vertex_size_tmp);
   ```

7. **Verifica EdgeOverlay re-render durante node drag**:
   ```js
   // Nel componente o via React DevTools profiler:
   // Patch console.log gated già presente. Setta window.__edgeOverlayDebug = true.
   // Aspetta drag di una card. Atteso: log "RENDER" multipli (1 ogni 32ms).
   ```

## Considerazioni per il fix

- Il pan ha già il binario pronto: `<Measurable>` accetta `whileDragging` (`Measurable.tsx:91, 162, 274, 520`) che, se passato, registra il callback jQuery UI `drag`. Il fix più piccolo è aggiungere `whileDragging={...}` accanto al `onDragEnd` esistente in `Measurable.tsx:484-490` (`ScrollableComponent`), simmetrico, che dispatchi `graph.offset = coords` con `rafThrottle(...)` come già fa `Vertex.tsx:179-192`. Questa modifica copre L2 (overlay) **e** ogni altro consumer che subscriba a `LGraph.offset`.
- **Alternativa** isolata a `EdgeOverlay`: leggere durante un drag attivo la posizione visuale direttamente da `.panning-content.style.left/top` (parsing inline string). Richiede però un segnale "is-panning-active" — al momento non esiste; servirebbe aggiungerlo (custom event, flag globale, oppure MutationObserver su `.panning-content` style). Più frammentario, sconsigliato salvo vincoli forti.
- Per **Fase 3b** (drag nodo + edge live): il binario è già pronto via `rafThrottle` 30fps + dispatch Redux. Resta da verificare runtime (Test D7) che `EdgeOverlay` re-renderizzi effettivamente — il selettore `useSelector((state) => state)` ritorna oggetto fresco a ogni dispatch, quindi dovrebbe re-renderizzare; conferma via DevTools.

## File ispezionati

- `frontend/src/components/edgeOverlay/EdgeOverlay.tsx` — overlay attuale, `useSelector` + `<g transform>` su LGraph.offset/zoom.
- `frontend/src/components/abstract/tabs/ModelTab.tsx` — mount EdgeOverlay come primo figlio di `.GraphContainer`.
- `frontend/src/components/forEndUser/Measurable.tsx` — Measurable React wrapper, ScrollableComponent, jQuery UI integration, pan instantiation.
- `frontend/src/components/forEndUser/Measurable.scss` — CSS rules per `.panning-handle`, `.panning-content`, `.scrollable`, CSS var consumers.
- `frontend/src/graph/vertex/Vertex.tsx` — node drag setup con jQuery UI direct call e rafThrottle 30fps.
- `frontend/src/graph/graphElement/graphElement.tsx` — render pipeline che setta `--offset-x/y`, `--top/left`, `--total-zoom-x/y` su `styleoverride`.
- `frontend/src/model/dataStructure/GraphDataElements.tsx` — `LGraph.set_offset` Redux dispatch handler (riga 1131).
- `frontend/src/joiner/types.ts` — enum `EMeasurableEvents` (riga 145).
- `frontend/src/joiner/classes.ts` — `whileDragging` callback su DViewElement (riga 4051).
- `frontend/src/utils/DragThrottle.ts` — `rafThrottle` helper.
- `frontend/src/styles/diagram.scss` — `.GraphContainer > .panning-handle { overflow: hidden }` (riga 889).
- `frontend/src/common/DV.tsx` — caller di `<Scrollable>` (`:1221, :1329`) dentro il jsxString del DefaultView.
