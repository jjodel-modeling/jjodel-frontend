# Forced Reflow ~37ms esterno a EdgeOverlay — Discovery Report

**Branch:** `alfonso-frontend-jjtl`
**Data:** 2026-05-05
**Tipo:** READ-ONLY discovery. Nessuna modifica al codice.
**Prompt:** `2026-05-05_2230_forced_reflow_external_discovery.md`

---

## Note preliminari sulla risoluzione dei path

Il prompt indicava i seguenti percorsi primari:

- `frontend/src/components/forEndUser/GraphDataElements.tsx` → **non esiste**. Path reale: `frontend/src/model/dataStructure/GraphDataElements.tsx`.
- `frontend/src/joiner/utils/Log.ts` → **non esiste**. Path reale: `frontend/src/common/Log.ts`.
- `frontend/src/components/forEndUser/Measurable.tsx` → esiste, OK.

Procedo con i path reali (i nomi file e gli intent del prompt corrispondono univocamente al singolo match, niente ambiguità).

---

## 1. Sintesi

**Conclusione operativa:** il forced reflow non è in EdgeOverlay (verificato dal prompt) ma in **`Size.of(element)` in `frontend/src/common/Geom.ts:615-664`**, che è la primitiva di misurazione DOM usata sia da `adaptSize` (storm di N chiamate per N vertici visibili dopo ogni commit di pan) sia da `Measurable.getCoords` (1 chiamata per drag tick di pan). `Size.of` esegue per costruzione un pattern di **layout thrashing**: ancestor-walk, `getComputedStyle` per ciascun antenato, scrittura condizionale di `style.display`, `getBoundingClientRect` + `offsetWidth/offsetHeight` sull'elemento, ripristino degli `style.display`. Ogni invocazione costa più reflow.

**Candidati ordinati per probabilità:**

1. **`adaptSize` storm (line `model/dataStructure/GraphDataElements.tsx:585-664`, single caller `graph/graphElement/graphElement.tsx:1227`)** — pattern dominante. N×24 chiamate × 30/sec di pan → 720 `Size.of` al secondo. Il branch "mismatching clonedcounter" che appare nel log è pure overhead: `Size.of` è già stato eseguito prima del check (riga 595 vs 603), early-return non risparmia il reflow.
2. **`Measurable.getCoords` (line `components/forEndUser/Measurable.tsx:443`)** — singola chiamata per drag tick, ma misura `evt.target` (panning-handle) che in pan-mode non ha un uso sensato. Costo minore ma additivo allo storm di adaptSize.
3. **Resto delle 39 occorrenze di `getBoundingClientRect`** — fuori path pan (popup, overlay, mapping diagrams, navbar).

I sintomi puntano in modo coerente al candidato 1: presenza del log `adaptSize mismatching clonedcounter` durante pan ⇒ `adaptSize` è invocato ⇒ `Size.of` è invocato ⇒ reflow.

---

## 2. A. Inventario read-layout sites

Grep su `frontend/src/**/*.{ts,tsx}`. Tabella sintetica; ho elencato per esteso solo i siti con potenziale rilevanza al pan-path. Gli altri 30+ hit di `getBoundingClientRect` sono in popup, mapping editor, megamodel viewer, navbar, jjtl dev env — non eseguiti durante pan del canvas principale.

| file:line | snippet (1 riga) | eseguito in pan? | preceduto da write stesso tick? |
|-----------|------------------|-------------------|----------------------------------|
| `common/Geom.ts:638` | `getComputedStyle(ancestors[i]).display === 'none'` (loop ancestor) | **sì** (via `Size.of` chiamato da `adaptSize` + `getCoords`) | sì — il loop scrive `ancestors[i].style.display='block'` dopo aver letto |
| `common/Geom.ts:641` | `let rect = element.getBoundingClientRect();` | **sì** (stesso path) | sì — preceduto dalle write a `style.display` di antenati nel loop precedente |
| `common/Geom.ts:652-653` | `element.offsetWidth; element.offsetHeight` | **sì** (stesso path) | sì — stesso flusso |
| `components/edgeOverlay/EdgeOverlay.tsx:375` | `const cs = getComputedStyle(el);` | **no** — fallback path 2 di `getNodeRect`, counter `__edgeOverlayPath2Count` resta a 0 in pan (verificato dal prompt) | n/a |
| `components/edgeOverlay/EdgeOverlay.tsx:381-382` | `el.offsetWidth, el.offsetHeight` | **no** — stesso fallback non esercitato | n/a |
| `components/forEndUser/Color.tsx:31, 106` | `svRef.current.getBoundingClientRect()`, `anchorRef.current?.getBoundingClientRect()` | no — picker UI, non pan canvas | n/a |
| `services/CanvasExportService.ts:54` | `graphElement.offsetWidth, ... offsetHeight` (commento) | no — codice commentato | n/a |
| 35 hit residui di `getBoundingClientRect` | (NodeProblemOverlay, MetamodelTab popup, EditorV2 helpers, M1ReferencePopup, EdgeTypePopup, DynamicHandles, MegamodelView, MappingLinesOverlay, ProjectEditor, JjtlDevelopmentEnv, Navbar, ProjectEditor button, …) | **no** durante pan canvas | n/a |
| `common/UX.tsx:486-487` | `clientHeight`, `clientWidth` (su `documentElement`) | no — visibility check | n/a |
| `JjScriptConsole.tsx:40`, `ExplainModal.tsx:202`, `ChatInput.tsx:271`, `WelcomeModal.tsx:23`, `ConsoleInput.tsx:207` | scroll* per autoscroll testo | no | n/a |

**Verifica negativa esplicita su Measurable.tsx e Vertex.tsx:** grep diretto di `getBoundingClientRect|offset(Width|Height|Top|Left)|client(Width|Height)|scroll(Width|Height)|getComputedStyle` su questi due file restituisce zero match. L'unico read DOM che `Measurable` esegue sul pan-path è indiretto, attraverso la chiamata a `Size.of(evt.target)` in `getCoords`.

**Conclusione sezione A:** tutte le strade in pan-path convergono su `Size.of` in `common/Geom.ts`. È il choke point.

---

## 3. B. `adaptSize` — body, caller, lifecycle, pattern

### B.1 Posizione

`frontend/src/model/dataStructure/GraphDataElements.tsx`:

- Dichiarazione (riga 582-583): metodo astratto `adaptSize` che chiama `wrongAccessMessage` — è il placeholder del proxy L-layer.
- Implementazione (riga 585-664): `get_adaptSize(c: Context)` ritorna la closure che il proxy espone come `adaptSize`.

### B.2 Body integrale (commenti rimossi)

```ts
get_adaptSize(c: Context): (typeof this['adaptSize']) {
    return (size: EPSize, view: LViewElement, canTriggerSet: {w: boolean, h: boolean} = {w: true, h: true})=> {
        if (Debug.lightMode) return;
        if (!canTriggerSet.w && !canTriggerSet.h) return;
        let ret0 = size;
        let ret = {...ret0};

        let html: HTMLElement | undefined | null = this.get_component(c)?.html?.current;
        let actualSize: Partial<Size> & {w:number, h:number} = html ? Size.of(html) : {w:0, h:0};   // <-- READ DOM (line 595)
        let cumulativeZoom = this.get_graph(c).cumulativeZoom;
        actualSize.w /= cumulativeZoom.x;
        actualSize.h /= cumulativeZoom.y;
        let isOldElement = true;

        if (!html || (c.data.clonedCounter && (c.data.clonedCounter || -1) !== +(html.dataset.clonedcounter as string))) { // <-- mismatch check (line 603)
            console.warn('adaptSize mismatching clonedcounter', {cc:c.data.clonedCounter, htmlcc:html?.dataset?.clonedcounter,
                cw: canTriggerSet.w, ch: canTriggerSet.h, ret:{...ret}, actualSize, cumulativeZoom, data: c.data});
            return;                                                                                  // <-- early return (line 607)
        }

        let updateSize: boolean = false;
        if (ret.w !== actualSize.w) { if (canTriggerSet.w && (isOldElement || actualSize.w !== 0)) { ret.w = actualSize.w; updateSize = true; } }
        if (ret.h !== actualSize.h) { if (canTriggerSet.h && (isOldElement || actualSize.h !== 0)) { ret.h = actualSize.h; updateSize = true; } }

        if (updateSize) {
            // resize-loop detection: pushes to tn.sizeHistory, scans for >=2 changes in window of 3 entries,
            // and if so disables autosize for the view via TRANSACTION (lines 629-658)
            ...
        }
        if (updateSize) this.set_size(ret, c, true);                                                 // <-- WRITE Redux (line 660)
        return ret;
    }
}
```

### B.3 Caller

Grep `adaptSize` su tutto `frontend/src` ⇒ **un solo call site**, in `frontend/src/graph/graphElement/graphElement.tsx:1226-1228`:

```tsx
if (this.props.isVertex && !Debug.lightMode && !isResized && (adaptWidth || adaptHeight) && this.countRenders >= 0) AT_TRANSACTION(()=>{
    this.props.node.adaptSize(size, this.props.view, {w: adaptWidth, h: adaptHeight});
});
```

Il blocco è dentro `render()` di `graphElement` (vedi righe 1180+ inizio del render path). Schedula `adaptSize` via `AT_TRANSACTION`.

### B.4 Lifecycle e frequenza

`AT_TRANSACTION` è definito in `frontend/src/redux/action/action.ts:227-231`:

```ts
let at_transaction: ((...a:any)=>void)[] = [];
export async function AT_TRANSACTION(a:(...argss:any)=>void) { at_transaction.push(a); }
```

La coda viene drenata in `FINAL_END` (action.ts:177-178), che è il termine della pipeline TRANSACTION:

```ts
ret = ca.fire();
if (ret) try {
    for (callback of at_transaction) callback?.();
    at_transaction = [];
} catch (e) { Log.eDevv('error in AT_TRANSACTION callback', {e, callback}); }
```

**Sequenza durante pan:**

1. `whileDragging` (Measurable) → `commitOffset` → `TRANSACTION('pan ' + graph.name + ' offset', () => { graph.offset = coords; })` (Measurable.tsx:484-486)
2. TRANSACTION COMMIT → reducer applica → React re-render dei `GraphElement` connessi alla CSS var `--offset-x/y` del graph
3. Render di ciascun Vertex valuta il blocco a riga 1226 → `AT_TRANSACTION(() => adaptSize(...))` viene **enqueued**
4. Al successivo commit TRANSACTION (prossimo throttled tick di pan, ~33ms dopo), `FINAL_END` drena la coda → tutte le `adaptSize` accumulate fanno fire **insieme** prima della render successiva
5. Ognuna esegue `Size.of(html)` (riga 595) → reflow per ciascun vertice

**Frequenza stimata:** 24 vertici (progetto di test) × 30Hz throttled pan = 720 `Size.of` al secondo. Con anchor depth ~10-15 livelli e relativa `getComputedStyle` per ognuno, il costo cumulativo per drain è coerente con i 37ms osservati per pan tick.

### B.5 Pattern read→write — analisi esplicita

Dentro la chiusura `adaptSize`:

- **READ** `Size.of(html)` (line 595) — **incondizionato**, fatto sempre, anche se la successiva clonedCounter check fallisce.
- **CHECK** `clonedCounter` mismatch (line 603) — se mismatch, `console.warn` + `return` (riga 607). **Il read è già stato pagato.** Nessuna write in questo branch.
- Se non mismatch: confronto con `ret.w/h`, eventuale update.
- **WRITE** `this.set_size(ret, c, true)` (line 660) — wrapped in `TRANSACTION('autosize ...', () => { ... SetFieldAction.new(... 'w' ...) ... })` dentro `set_size` (riga 675-684). Le `SetFieldAction` triggerano dispatch Redux → React re-render → DOM update → al prossimo render adaptSize fa di nuovo `Size.of` → potenziale ciclo.

**Il pattern è classico read-write-read-write** entro lo stesso macro-step di pan. Il fast-path `Debug.lightMode` (line 587) c'è ma è disabilitato in pan normale. Non esiste un fast-path che eviti `Size.of` quando `clonedCounter` è già mismatch — l'ordine è sbagliato: la check è dopo la read.

### B.6 Resize-loop detection (lines 629-658)

Se `updateSize=true` per più di 2 volte in una finestra di 3 osservazioni × 1.2 × `U.UpdatingTimer`, disabilita autosize per la view via TRANSACTION. Questo è un guard contro infinite resize, ma non aiuta con il caso pan: durante pan le dimensioni dei vertici NON cambiano (cambia solo l'offset del graph), quindi `actualSize.w/h === ret.w/h` la maggior parte del tempo, `updateSize` resta false, il guard non interviene. Cioè: il read è sprecato perché il risultato non porta a write — ma viene fatto comunque.

---

## 4. C. `Measurable` durante pan — call chain con annotazione layout

### C.1 Catena

```
[jQuery UI 'drag' event]
  ↓
makeEvent wrapped callback (Measurable.tsx:301-310)
  ↓
allevents = [defaultevt, jquievt, propsevent].filter(...)
  ↓
for (e of allevents):
  ├── defaultevt = getDefaultEvent('draggable', 'ing') (Measurable.tsx:267-271)
  │     → translateeevents.draggable.ing (line 256) → absoluteToTransform (line 174-182)
  │         → e.style.transform = `translate(${x}, ${y})`              [WRITE STYLE — invalidates layout]
  │     → childmode (line 183-244)
  │         → child.style[key] = newpos + 'px' (line 223)              [WRITE STYLE]
  │         → child.classList.remove/add('idle','dragging') (line 233-234)  [WRITE — invalidates]
  │     [NO LAYOUT READ]
  │
  ├── jquievt (jQuery UI internal, opt props.drag) — usually undefined for ScrollableComponent
  │     [NO LAYOUT READ in this codebase]
  │
  └── propsevent = whileDragging (passed from ScrollableComponent line 509-518)
        ├── propsevent invocato come: e(this.getCoords(evt, ui, isPanning), evt, ui)  (line 306)
        │     ↓
        │     getCoords (Measurable.tsx:442-452):
        │       let size = Size.of(evt.target);                         [LAYOUT READ HERE — Geom.ts:615-664]
        │       let graph = DGraphElement.graphLFromHtml(evt.target);   [no DOM geometry, walks dataset]
        │       gsize = graph?.translateHtmlSize(size);                 [pure math]
        │       if (isPanning) { gsize.x = oldPos.left; gsize.y = oldPos.top; }
        │       return gsize;
        │     ↑ getCoords ritorna; whileDragging riceve coords
        │
        ├── whileDragging body (ScrollableComponent.tsx:509-518):
        │     const fresh = ui?.position
        │       ? ({ ...coords, x: coords.x + ui.position.left, y: coords.y + ui.position.top } as GraphSize)
        │       : coords;                                                [pure math]
        │     throttledCommit(fresh);                                    [enqueue rAF]
        │     [NO LAYOUT READ]
        │
        └── (rAF fires) → commitOffset (line 477-487):
              if (offset.equals(coords)) return;
              TRANSACTION('pan ... offset', () => { graph.offset = coords; });
              [NO LAYOUT READ; il TRANSACTION dispatch parte qui]
```

### C.2 Sintesi step-per-step

| Step | Layout read? |
|------|--------------|
| jQuery UI drag dispatch | NO |
| `absoluteToTransform` | [NO LAYOUT READ] (write only) |
| `childmode` (style/classList writes) | [NO LAYOUT READ] |
| `getCoords` → `Size.of(evt.target)` | **[LAYOUT READ HERE]** — 1 elemento per tick |
| `whileDragging` body (ScrollableComponent) | [NO LAYOUT READ] |
| `commitOffset` → `TRANSACTION` | [NO LAYOUT READ] |
| (downstream) React re-render dei Vertex | [NO LAYOUT READ in render path stesso] |
| (downstream) `AT_TRANSACTION` queue drain → `adaptSize × N` | **[LAYOUT READ HERE × N]** — N=visible vertices, via Size.of(html) |

### C.3 `componentDidUpdate` / lifecycle reattivi

`Measurable.tsx:63-76`:

```ts
componentDidMount() { this.afterUpdate(); }
componentDidUpdate(...) { this.afterUpdate(); }
afterUpdate(): void {
    if (!this.html) return;
    this.$html = $(this.html);
    if (this.dragOptionsChanged) { this.afterUpdateSingle("draggable"); }
    if (this.resizeOptionsChanged) { this.afterUpdateSingle("resizable"); }
    if (this.rotateOptionsChanged) { this.afterUpdateSingle("rotatable"); }
}
```

Solo re-attach jQuery UI; nessun layout read. `afterUpdateSingle` è lo set/reset di opzioni jQuery UI.

### C.4 Cache di dimensioni dei children

Verificato: `Measurable` mantiene solo `oldPos: {left, top}` (Measurable.tsx:61) come cache di POSIZIONE (non size). Nessun re-read di geometria child su update Redux. Niente subscribe a `LGraph.offset`/`LGraph.zoom` (Measurable è un wrapper jQuery UI puro, riceve props da fuori — è il GraphElement che leghe alla zoom/offset Redux).

**Conclusione sezione C:** Measurable contribuisce con un `Size.of(evt.target)` per drag tick (~30/sec), che è significativo ma non basta a spiegare 37ms. Il grosso del cost è nello storm di `adaptSize` × N triggerato downstream dal commit TRANSACTION del pan.

---

## 5. D. Origine del log `adaptSize mismatching clonedcounter`

### D.1 Posizione esatta della stringa

`frontend/src/model/dataStructure/GraphDataElements.tsx:605`:

```ts
console.warn('adaptSize mismatching clonedcounter', {cc:c.data.clonedCounter, htmlcc:html?.dataset?.clonedcounter,
    cw: canTriggerSet.w, ch: canTriggerSet.h, ret:{...ret}, actualSize, cumulativeZoom, data: c.data});
```

Il `Log.ts:214` che appare nel runtime stack è il **wrapper di `console.warn`** definito in `frontend/src/common/Log.ts:206-215`:

```ts
console.warn = (...e): void => {
    let e0 = e[0];
    if (e0 && (e0[0] === 's' && e0[14] === 's' && e0.substring(0,15) === 'src\\api\\data.ts')) {
        console.info(...e);
        return;
    }
    return warn(...e);   // <-- riga 214: il browser stack frame punta qui
}
```

Cioè 214 è il punto in cui il `console.warn` originale viene effettivamente invocato. Il sito di chiamata è 605 in `GraphDataElements.tsx`.

### D.2 Condizione del branch

`GraphDataElements.tsx:603`:

```ts
if (!html || (c.data.clonedCounter && (c.data.clonedCounter || -1) !== +(html.dataset.clonedcounter as string)))
```

In termini logici:
- `!html` → il proxy ha perso il riferimento DOM (componente smontato/non ancora montato) — improbabile in pan
- `c.data.clonedCounter && ...` → il D-layer ha un clonedCounter > 0 (cioè l'oggetto è stato clonato almeno una volta), E
- `c.data.clonedCounter !== html.dataset.clonedcounter` → il counter sul dato Redux non corrisponde a quello scritto nell'attributo DOM

### D.3 Semantica di "clonedcounter"

`clonedcounter` è una proprietà del proxy (proxy.ts:383, vedi anche classes.ts:563 con commento esplicativo) che funge da contatore di sincronizzazione fra il record D originale e le sue copie clonate da Redux durante l'aggiornamento immutabile. Ogni volta che il record è "rimpiazzato" da una sua copia (es. dopo `SetFieldAction` che lo riscrive), il contatore avanza.

Il DOM mirror è scritto in `graph/graphElement/graphElement.tsx:1448` durante render:

```tsx
"data-clonedcounter": props.node?.clonedCounter || -1,
```

Quindi:
- al render, il DOM riceve il valore corrente di `clonedCounter` come attributo
- se dopo il render il D-layer aggiorna nuovamente il counter (per un'altra azione Redux), il DOM resta con il valore vecchio finché non re-renderizza

**Mismatch durante pan = c'è stato un update Redux che ha avanzato il counter, ma React non ha ancora committato il nuovo render al DOM.**

Dato che ogni `commitOffset` (~30Hz) fa un TRANSACTION con `SetFieldAction` su `graph.offset`, e che adaptSize gira via `AT_TRANSACTION` queue (drenata al PROSSIMO commit), c'è una finestra in cui `clonedCounter` su `c.data` (graph) è stato bumpato dal nuovo commit ma il DOM è ancora alla revisione precedente. Da qui il mismatch.

### D.4 Azione del branch del mismatch

Solo `console.warn` + `return` (line 607). **Nessuna mutazione DOM, nessuna scrittura Redux.** Però — punto critico — la `Size.of(html)` a riga 595 è già stata eseguita **prima** della check. Quindi il branch "evita lavoro inutile" rispetto a `set_size`, ma NON evita il reflow read.

### D.5 Ipotesi runtime sul branch attivo durante pan

Il prompt dice che il log appare durante pan ⇒ il mismatch branch è quello che fira. Coerente con la finestra di lag descritta in D.3.

---

## 6. E. Ipotesi di root cause e percorso di verifica

### E.1 Root cause più probabile

**`Size.of` chiamato da `adaptSize` × N vertici per ogni drain di `at_transaction` durante pan, dove ciascuna chiamata fa ancestor walk + `getComputedStyle` × ancestor depth + `getBoundingClientRect` + `offsetWidth/Height` + scrittura/ripristino di `style.display` su antenati.**

Il pattern di `Size.of` (Geom.ts:615-664) è una sequenza read→write→read→write entro la singola invocazione, che per costruzione provoca multiple invalidation del layout. Moltiplicato per N=24 vertici per tick di pan, e con la frequenza ~30Hz del throttled commit, porta facilmente a 37ms di reflow per tick.

Il branch "mismatching clonedcounter" osservato nel log è secondario: conferma che `adaptSize` sta correndo durante pan e che il sistema entra nel ramo che fa solo `Log.warn` — ma il reflow viene comunque pagato perché la `Size.of` precede il check.

### E.2 Contributo additivo

`Size.of(evt.target)` in `Measurable.getCoords` (Measurable.tsx:443) gira 1 volta per drag tick (jQuery UI fa fire più frequente del throttle, ma comunque ~30-60Hz). 1×~1-3ms reflow per tick. Non è il main driver ma si somma allo storm di adaptSize.

### E.3 Verifica per la sessione successiva

**Diagnostic counter gated su `window.__sizeOfDebug`** (pattern allineato a `__edgeOverlayPath2Count`):

In `Geom.ts:615` ad inizio `Size.of`, aggiungere (per la sessione di fix, NON ora):

```ts
if ((window as any).__sizeOfDebug) {
    (window as any).__sizeOfCount = ((window as any).__sizeOfCount || 0) + 1;
    (window as any).__sizeOfStack = (window as any).__sizeOfStack || [];
    (window as any).__sizeOfStack.push({t: performance.now(), elementTag: element.tagName, elementClass: (element.classList ? [...element.classList].join(' ') : '')});
}
```

Procedura di test:
1. Apri devtools, `window.__sizeOfDebug = true; window.__sizeOfCount = 0; window.__sizeOfStack = [];`
2. Pan il canvas per 5s
3. `window.__sizeOfCount` — atteso ≥ 100 con N=24 vertici, ~30Hz pan throttle, ~5s
4. Group `__sizeOfStack` per `elementClass` per disambiguare se il driver è `adaptSize` (target = `.vertex .graph-element ...`) o `getCoords` (target = `.panning-handle`)

### E.4 Direzione fix candidate (da non applicare ora)

- **Inversione ordine in `adaptSize`**: spostare la check `clonedCounter mismatch` PRIMA di `Size.of(html)`. Se mismatch, return *senza* leggere geometria. Salva il reflow nel ramo bail-out.
- **Skip durante pan**: aggiungere short-circuit `if (graph.isPanning) return` (analogo al `Debug.lightMode` esistente in line 587). Le dimensioni dei vertici non cambiano durante pan, l'autosize è inutile.
- **Memoization su clonedCounter**: cache `Size.of` result keyed by `clonedCounter` of the element's data. Match → skip read.
- **Eliminare l'ancestor walk di `Size.of`**: il loop su `ancestors` con write-read-write di `style.display` è il vero killer. Una versione "fast" che fa solo `getBoundingClientRect()` (senza guardare visibilità) sarebbe drasticamente più economica per il caso normale (elemento nel DOM e visibile).

Ognuna di queste è chirurgica e non tocca la cablatura del pan handler. Ma sono fix per una sessione successiva, non per ora.

---

## 7. F. Allargamenti necessari

**Allargamento 1 (consigliato)** — `frontend/src/joiner/proxy.ts:383` (case `clonedcounter`). Verificare la semantica esatta del bump del counter per stabilire se è incrementato per **ogni** dispatch `SetFieldAction` o solo per certi tipi di azione. Se è incrementato per ogni `SetFieldAction`, un singolo pan tick (1 SetField su `offset`) bumperà `clonedCounter` del graph una sola volta. Se invece cascade (es. proxy invalidation cascading sui figli), il bump si propaga e diventa più probabile osservare mismatch sui vertici. Questo influenza la scelta del fix più efficace (memoize vs re-order).

**Allargamento 2 (condizionale)** — se la verifica diagnostic counter di sezione E.3 mostra che `Size.of` è chiamato MENO di quanto atteso (es. <50 in 5s di pan), allora il candidato 1 è meno dominante e bisogna allargare a:
- `Vertex.tsx` (uses `Measurable` + `componentDidUpdate` reactive a Redux). Verificare se Vertex ha un `componentDidUpdate` o subscriber che reagisce a offset change con un `Size.of` o `getBoundingClientRect`.
- `EditorV2.tsx` riga ~849 + ~2895 — c'è un commento che menziona `getBoundingClientRect` per misurare dopo CSS update. Se EditorV2 wrappa il canvas e fa una misura sincrona dopo offset change, è un altro candidato.

**Allargamento 3 (improbabile ma da segnare)** — `transientProperties.node[c.data.id]` e il blocco resize-loop detection (GraphDataElements.tsx:629-658). Se durante pan `actualSize.w/h` è instabile per dimensioni dipendenti da CSS (es. padding influenzato da zoom), `updateSize` può fluttuare e attivare il guard, che fa una TRANSACTION sincrona. Improbabile in pan puro (zoom non cambia), ma da considerare per sessioni con pan+zoom combinati.

**Non allargare a:**
- `MetamodelTab.tsx`, `NodeProblemOverlay.tsx`, popup vari → fuori canvas main path.
- `Color.tsx`, `JjScriptConsole.tsx` → fuori scope canvas.

---

## 8. Vincoli rispettati

- ✅ READ-ONLY. Zero modifiche a sorgente. Nessun fix applicato.
- ✅ Report autocontenuto in `docs/reports/2026-05-05-forced-reflow-external-discovery.md`.
- ✅ Tutti i sei punti A-F coperti.
- ✅ File path discrepancies del prompt risolti senza assumere `main`.
- ✅ Pattern di gating diagnostic proposto allineato a `__edgeOverlayDebug` (sezione E.3).
- ✅ Convenzione di logging Jjodel rispettata: cite full call site + wrapper site (sezione D.1).
- ✅ Nessun refactor opportunistico, nessun cleanup di log esistenti.

---

**Fine report.**
