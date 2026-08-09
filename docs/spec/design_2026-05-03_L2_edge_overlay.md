# Design Doc — L2: Edge nativo via overlay SVG (classic editor)

**Stato**: design, pronto per derivazione prompt operativi per Claude Code
**Data**: 2026-05-03
**Sessione**: continuazione del redesign default class view (v4 in produzione)
**Scope**: classic editor only. Flow editor non viene toccato.
**Successore**: L3 (drag endpoint per edit di source/target), in design separato dopo L2 stabile.

---

## 1. Goals & non-goals

### Goals

L'utente dichiara su una view che la metaclasse rappresentata è semanticamente un edge (associative class binary o pattern equivalente). Concretamente: la view ha un flag `isEdge: boolean` e due espressioni `edgeSource`, `edgeTarget` che individuano gli endpoint nella struttura dati dell'istanza.

Quando il flag è attivo e le espressioni sono valutabili, nel classic editor:
- L'istanza non viene visualizzata come box (DVertex), ma come arco SVG da source a target.
- L'arco è selezionabile (click su path o label).
- L'arco si comporta correttamente durante drag dei suoi endpoint (S1, S2) e durante pan/zoom del canvas.
- L'arco esiste solo come effetto di rendering: nello state Redux T1 resta DVertex.

Heuristic visiva: il sistema rileva candidati (classi con esattamente 2 reference verso LObject) e suggerisce di marcarli come edge, ma non forza la conversione.

### Non-goals (espliciti, per evitare scope creep)

- **Modifica di `useJjomSync.ts`**. Il sync esistente continua a creare DVertex per ogni DObject. Niente DVoidEdge generati da `isEdge`.
- **Modifica del flow editor**. La feature `isEdge` ha effetto solo nel classic. Nel flow, T1 continua a essere un nodo standalone (con il smart preview compatto in v4 attuale).
- **Edit interattivo degli endpoint** (drag dell'arco). È L3, sessione successiva.
- **Espressioni JjEL complete**. Si parte con path semplici stringa-based (`$source.value`, `$source.value.parent`). JjEL inline è evolutivo.
- **Multi-viewpoint conflicting**. Se due viewpoint attivi forniscono view applicabili a T1 con `isEdge` divergenti (uno true, uno false), il comportamento è "first-match-wins" senza UX dedicata. Decisione consapevole, raffinabile in futuro.

---

## 2. Schema dati

### Estensione di `DViewElement`

Tre nuovi campi:

```ts
isEdge: boolean;          // default: false
edgeSource: string;       // default: "" (vuoto = "non valutabile")
edgeTarget: string;       // default: "" (vuoto = "non valutabile")
```

`edgeSource` e `edgeTarget` sono espressioni stringa che il mini-evaluator (sezione 3) sa interpretare. Tipico contenuto: `"$source.value"`, `"$from.value"`, `"$pair.value.left"`. Se vuoti o non valutabili runtime, il rendering edge è disattivato per quell'istanza specifica (graceful degradation, non rotture).

### Migration `'2.212 -> 2.213'` in VersionFixer

Pattern atteso: itera `s.idlookup`, per ogni DViewElement aggiunge i tre campi se mancanti, con i default sopra.

Nota: la heuristic "auto-bootstrap di `isEdge=true` per metaclasse con 2 reference" **non viene applicata in migration**. Le view esistenti restano `isEdge=false` di default. Il bootstrap è applicato solo alle **view nuove** create dal context menu, dove il sistema ha contesto per decidere (la metaclasse è sotto il cursore). Questo evita di trasformare in edge le view legacy senza che l'utente se ne accorga.

### Aggiornamento del template default

Il template di stamattina (v4) usa la heuristic `length === 2` per attivare `--edge-like` compact + smart preview. Con `isEdge` come campo dichiarativo, il template **continua a funzionare invariato per il flow editor** (la heuristic resta come fallback estetico). Per il classic editor, `isEdge=true` ha priorità: l'overlay disegna l'arco, il template del DVertex ritorna null.

In sostanza il flag `isEdge` non sostituisce la heuristic del template, **co-esiste**: heuristic per estetica generica, flag per conversione edge in classic.

---

## 3. Mini-evaluator delle espressioni

### Interface

```ts
function evalEdgeExpression(data: LObject, expr: string): LObject | null
```

Input: l'istanza M1 (es. T1) e l'espressione stringa (es. `"$source.value"`).
Output: l'LObject puntato (es. S1), oppure `null` se l'espressione non è valutabile sui dati correnti.

### Sintassi supportata (MVP)

Solo path con dot e bracket access. Il proxy L gestisce sia `data.$source.value` sia `data['$source'].value` sia `data['$' + 'source'].value` (verificato runtime in sessione di stamattina).

Casi che il MVP deve coprire:

```
$source.value                    → data.$source.value
$source.values[0]                → data.$source.values[0]   (per ref multi-valued)
$pair.value.left                 → data.$pair.value.left    (navigazione cross-class)
$source.value.$container.value   → navigazione a 2 livelli
```

### Casi che il MVP NON copre

- Ternari, condizioni: `$cond ? $a : $b`. Da L2.5 o L3.
- Aggregazioni: `$members.values.find(m => m.role === 'leader')`. Da L3+.
- Funzioni JjEL: `OCL.first(...)`. Mai (è scope JjEL/JjTL).

### Implementazione

Parsing e evaluation in 30-40 righe di TypeScript:

```ts
function evalEdgeExpression(data: any, expr: string): any | null {
    if (!data || !expr) return null;
    
    // Tokenizza in segmenti separati da '.', tenendo bracket access uniti
    const segments = parseSegments(expr);  // es. ['$source', 'value']
    
    let current: any = data;
    for (const seg of segments) {
        if (current === null || current === undefined) return null;
        
        // Bracket access esplicito: 'values[0]'
        const bracketMatch = seg.match(/^([^\[]+)\[(\d+)\]$/);
        if (bracketMatch) {
            current = current[bracketMatch[1]];
            if (current === null || current === undefined) return null;
            current = current[parseInt(bracketMatch[2], 10)];
        } else {
            current = current[seg];
        }
    }
    
    // Verifica che il risultato sia un LObject (ha .id, .name, è "selezionabile")
    if (current && typeof current === 'object' && current.id && current.className) {
        return current;
    }
    return null;
}
```

Funzione standalone, vive in `frontend/src/utils/edgeExpressionEval.ts`. Importata dall'overlay SVG e dal template engine se serve. Hook-free, side-effect-free.

### Fallback / errori

L'evaluator non lancia mai eccezioni: ritorna `null` su qualunque problema. Caller (overlay SVG) usa il null per skippare il rendering dell'edge. Niente try/catch sparso.

---

## 4. Overlay SVG layer

### Anatomia

Componente React `<EdgeOverlay>`, vive dentro `.canvas-zoom-pan-wrapper` (o nome equivalente del classic — da verificare in discovery), accanto al layer dei nodi.

Struttura DOM target:

```
.canvas-zoom-pan-wrapper { transform: translate + scale }
  .nodes-layer
    [DVertex S1]  (visibile)
    [DVertex S2]  (visibile)
    [DVertex T1]  (template ritorna null, no DOM)
  <svg class="edge-overlay">    ← nuovo
    <path d="M ... L ..." />    ← arco T1 da S1 a S2
    <foreignObject>             ← label HTML di T1
      <div class="edge-label">T1 [Transition]</div>
    </foreignObject>
    [...altri edge dichiarati con isEdge=true...]
  </svg>
```

`pointer-events: none` di default su `<svg>`, `pointer-events: auto` su `<path>` e `<foreignObject>`. Pan/zoom è gratis perché il transform del wrapper si applica al layer SVG.

### Singolo SVG vs molti SVG

Confermato singolo SVG per tutto il canvas (decisione presa: più performante). React renderizza l'array di edge come children di un solo `<svg>`. Niente N componenti `<svg>` separati.

### Algoritmo di disegno

A ogni render:
1. Itera tutti i DObject del progetto correntemente visibili nel viewpoint attivo.
2. Per ognuno, recupera la view applicabile (prima nel viewpoint attivo, decisione "first-match-wins").
3. Se `view.isEdge === true`:
   - Valuta `evalEdgeExpression(data, view.edgeSource)` → LObject source.
   - Valuta `evalEdgeExpression(data, view.edgeTarget)` → LObject target.
   - Se entrambi non null: leggi le posizioni DOM dei loro DVertex (sezione 4.3 sotto), calcola endpoint anchor (es. midpoint del border più vicino), genera un `<path>` SVG, e una `<foreignObject>` per la label.
   - Se uno è null: skip dell'edge per questa istanza (opzionalmente, log diagnostico in dev mode).

### Lettura delle posizioni dei DVertex

Due opzioni:

**A. Da Redux state.** Il classic mantiene `dvertex.x, dvertex.y, dvertex.w, dvertex.h` nel project state. Letti via `useSelector` o equivalente, l'overlay riceve nuove posizioni a ogni cambio.

**B. Da DOM.** L'overlay usa `getBoundingClientRect()` o legge le `transform` CSS dei node DOM elements. Più diretto ma duplica una source-of-truth.

**Decisione**: A per i casi normali (state-driven, idiomatico React+Redux). B come ottimizzazione durante drag attivo (sezione 4.4).

### Performance ibrida durante drag

Durante drag di un nodo (mouse-down → mouse-up su un nodo `S1`), l'aggiornamento delle coordinate Redux può essere debounced o throttled (verificare). L'overlay deve rispondere a 60fps anche se Redux non aggiorna a 60fps.

Soluzione ibrida:

1. **A riposo (no drag in corso)**: overlay è event-driven. Re-render solo quando cambia state Redux. Una volta ogni movimento committato.
2. **Durante drag attivo**: overlay si subscribe a un mouse-move globale (o al ciclo drag esistente del classic, da scoprire), mantiene un map locale `nodeId → {x, y}` aggiornato dal DOM (`getBoundingClientRect` su `.draggable-node` interessato), ridisegna solo gli edge che hanno il nodo trascinato come endpoint. `requestAnimationFrame` per evitare thrashing.
3. **A mouse-up**: il drag commit aggiorna Redux, il map locale si flush, l'overlay torna in modalità event-driven.

L'implementazione concreta dipende da come il classic espone l'evento "drag started/moved/ended". Va in discovery prima della Fase 4 (overlay implementation).

### Hit-test e selezione

`<path>` ha `pointer-events: stroke` (cliccabile solo sul tracciato, non sull'area) con stroke-width "fisica" più grande di quella visibile (es. visible 2px, hit-area 10px tramite `<path>` invisibile più spesso sotto). Pattern standard SVG.

Click su path → callback che esegue equivalente di `setIsSelected(T1.id, currentUser, true)` nel state Redux. Il classic propaga la selezione (properties panel mostra T1, ecc.).

Click su label (`<foreignObject>` con `<div>` dentro) → stessa callback.

### Stili visuali

Path:
- Default: `stroke: #94a3b8; stroke-width: 1.5; fill: none;` (slate-400)
- Hover: `stroke: #64748b; stroke-width: 2;`
- Selected: `stroke: #0ea5e9; stroke-width: 2;`
- Marker freccia in chiusura (`marker-end="url(#arrow)"`).

Label HTML (foreignObject):
- Card piccola simile a `--edge-like` del template attuale: nome + pill cyan compatta.
- Posizionata a midpoint del path. Foreignobject dimensioni fisse (es. 120x32), centrata sul midpoint.
- `pointer-events: auto` per click.
- Stati hover/selected coerenti con il path.

### Routing del path

MVP: linea retta da source endpoint a target endpoint. No Manhattan, no bezier curve.

L'anchor "endpoint" è calcolato come intersezione della linea source-center → target-center con il bounding box del nodo. Funzione standalone `computeEdgeAnchor(nodeRect, otherCenter): {x, y}`. ~15 righe.

Routing Manhattan o bezier può essere aggiunto in iterazione successiva; non è critical path per L2.

### Rendering dell'arco quando source o target sono null

Nessun rendering. La presenza dell'edge è condizionata dalla risolvibilità di entrambe le espressioni. T1 con `source` settato e `target` no → niente arco visibile, T1 invisibile (template ritorna null) → **T1 è di fatto invisibile e non interagibile nel canvas**.

Questo è un comportamento problematico: l'utente ha creato T1, vede che è scomparso, non sa come selezionarlo per fixare il target.

Mitigazione (proposta):
- Se la view ha `isEdge=true` e una delle espressioni non è valutabile, **rendering fallback**: il template del DVertex non ritorna null, ritorna una piccola "card di emergenza" (es. variante del default edge-like compact attuale) con preview `? → ?` o `S1 → ?`. La card resta selezionabile e cliccabile per editare i dati.

Questo significa che il template engine deve sapere se l'edge è risolvibile. Logica condizionale nel template (jsxString runtime) che invoca un check preliminare. Aggiunge complessità ma evita user trap.

**Decisione (raccomandata)**: implementare il fallback. Il template del DVertex con `isEdge=true` ritorna:
- `null` se entrambe le espressioni sono risolvibili (l'arco SVG ne prende il posto).
- Card edge-like compact con preview `? → ?` o `S1 → ?` se almeno una è null (fallback selezionabile).

Implementazione: il template runtime invoca `evalEdgeExpression` due volte e decide. Funzione esposta nel scope template (`windoww.evalEdgeExpression`). Coerente con il pattern di registrazione components esistente (`ExecuteOnRead.ts:101-120`).

---

## 5. Visibilità del DVertex edge-converted

Quando T1 ha view `isEdge=true` ed entrambe le espressioni sono risolvibili:

- Il template del DVertex T1 **ritorna null** (componente non renderizza nulla nel DOM).
- T1 esiste solo nel state Redux (DVertex con `x, y, w, h` ignorati dal rendering).
- T1 non è draggabile (no DOM, no hit-test).
- T1 è selezionabile via click su path/label dell'overlay.

Quando una delle espressioni è null (caso fallback):

- Il template ritorna una card edge-like compact con preview parziale (`? → ?`, `S1 → ?`, ecc.).
- T1 è draggabile come normale DVertex.
- T1 è selezionabile via click sulla card.
- L'overlay non disegna nulla per T1.

Il switch tra i due stati è **per-istanza** e **per-render**: ogni rendering del template valuta le espressioni runtime. Se l'utente edita `T1.target = S2` (prima null), al prossimo render la card scompare e l'arco SVG appare.

### Conseguenza sulle view classic non-isEdge

Le view senza `isEdge` continuano a comportarsi esattamente come oggi. Niente regressione, niente conditional rendering aggiuntivo.

---

## 6. Heuristics + edge-candidate hints

### Quando emerge il hint

Quando l'utente apre la properties panel di una view, il sistema valuta heuristic sulla metaclasse:

- **Heuristic strong**: la classe ha esattamente 2 reference verso LObject (cardinality upper=1).
- **Heuristic medium**: la classe ha 2+ reference e almeno 2 hanno nomi convenzionali (`source/target`, `from/to`, `start/end`, `src/dst`, case-insensitive).
- **Heuristic weak**: classe ha 0 attributi propri (oltre `name`) e ha solo reference (suggerisce "pura relation").

Score combinato 0-3. Se score ≥ 1, hint è mostrato.

### Dove appare il hint

**Nel properties panel della view**, in cima alla sezione Advanced (sopra ai 3 campi `isEdge`, `edgeSource`, `edgeTarget`):

```
┌─────────────────────────────────────────────┐
│ ⚡ Edge candidate detected                   │
│                                             │
│ This metaclass has 2 references and could  │
│ be displayed as an edge.                    │
│                                             │
│ Suggested:                                  │
│   Source: $source.value                     │
│   Target: $target.value                     │
│                                             │
│ [ Apply suggestions ]   [ Dismiss ]         │
└─────────────────────────────────────────────┘
```

Il bottone "Apply suggestions" pre-fila i 3 campi con i valori suggeriti e setta `isEdge=true`. L'utente può poi modificare a mano. Dismiss nasconde il banner per la sessione.

**Sulla card del DVertex nel canvas**, quando la view non ha ancora `isEdge=true` ma matcha heuristic: una piccola icon Bootstrap `bi-arrow-left-right` in top-right della card, semi-trasparente, con tooltip "Edge candidate". Cliccando l'icon si apre la properties panel con il banner attivo.

### Suggester per edgeSource/edgeTarget

Quando l'utente attiva `isEdge`, i campi `edgeSource` e `edgeTarget` sono input testuali con dropdown di suggerimenti.

Algoritmo per popolare il dropdown (chiamiamolo `suggestEdgeExpressions(klass: LClass): string[]`):

1. Per ogni reference `r` di `klass` con cardinality upper=1 e target classifier `T` che è LObject (non datatype primitive):
   - Aggiungi `$<r.name>.value` alla lista (livello 1).
   - Per ogni reference `r2` di `T` con upper=1:
     - Aggiungi `$<r.name>.value.$<r2.name>.value` (livello 2).
   - Stop a livello 2.
2. Per ogni reference `r` con upper>1:
   - Aggiungi `$<r.name>.values[0]` (heuristic comune).

Ordinamento del dropdown: nomi convenzionali (`source/target/from/to/start/end/src/dst`) in cima, gli altri in ordine di dichiarazione.

L'utente può sempre digitare un'espressione custom. Il dropdown è aiuto, non vincolo.

---

## 7. Sequenza di implementazione

Le fasi sono atomiche e ognuna produce un commit deployabile. Le dipendenze:

```
Fase 1 (schema + migration)
    ↓
Fase 2 (mini-evaluator)
    ↓               ↘
Fase 3 (overlay)    Fase 5 (UI properties panel + heuristic + suggester)
    ↓
Fase 4 (template fallback per espressioni null)
    ↓
Fase 6 (icon canvas hint)
```

### Fase 1 — Schema + migration

**Scope**:
- Aggiungere `isEdge: boolean`, `edgeSource: string`, `edgeTarget: string` al type `DViewElement` (verificare nome del file: `frontend/src/joiner/types.ts` o equivalente).
- Migration `'2.212 -> 2.213'` in `VersionFixer.tsx` che popola i default su tutte le DViewElement esistenti.
- Verificare che il serialization Redux gestisca i nuovi campi.

**Scope file**:
- `frontend/src/joiner/types.ts` (o equivalente)
- `frontend/src/redux/VersionFixer.tsx`
- Possibilmente `frontend/src/joiner/D.ts` o `view/viewElement/view.tsx` se i defaults sono dichiarati lì.

**Discovery necessaria** (Fase 0 del prompt): identificare i file esatti dove vivono i type, dove sono inizializzati i default, dove si serializza/deserializza.

**Esito atteso**: build verde, le view esistenti hanno i nuovi campi a default. Niente cambio visibile in canvas.

### Fase 2 — Mini-evaluator

**Scope**:
- Funzione `evalEdgeExpression(data, expr)` in `frontend/src/utils/edgeExpressionEval.ts`.
- Test unitari (se il progetto ha framework di test: scoprire) su 5-6 casi.
- Registrazione su `windoww.evalEdgeExpression` per uso da template engine.

**Scope file**:
- `frontend/src/utils/edgeExpressionEval.ts` (nuovo)
- `frontend/src/joiner/ExecuteOnRead.ts` (registrazione su `windoww`)

**Esito atteso**: funzione disponibile, testabile via console (`window.evalEdgeExpression(...)`), e usabile dentro jsxString runtime.

### Fase 3 — Overlay SVG

**Scope**:
- Componente `<EdgeOverlay>` in `frontend/src/components/canvasOverlay/EdgeOverlay.tsx` (path da decidere).
- Logic di iterazione DObject + view applicabile + valutazione espressioni + render `<path>` + `<foreignObject>`.
- Integrazione nel canvas wrapper del classic.
- Performance ibrida: state-driven a riposo, DOM-driven con rAF durante drag.
- Hit-test su path e label, callback di selezione.
- Styling SCSS in `frontend/src/styles/edge-overlay.scss`.

**Scope file**:
- `frontend/src/components/canvasOverlay/EdgeOverlay.tsx` (nuovo)
- `frontend/src/styles/edge-overlay.scss` (nuovo)
- File del classic editor che renderizza il canvas wrapper (da identificare in discovery)
- `frontend/src/App.tsx` (import SCSS)

**Discovery necessaria**: anatomia del canvas wrapper classic, dove si inserisce l'overlay, ciclo drag esistente per agganciarsi durante drag, struttura del state Redux per posizioni nodi.

**Esito atteso**: una view con `isEdge=true` e due espressioni valide produce un arco visibile in canvas. Il drag dei nodi endpoint è fluido. Pan/zoom funziona. Click su path/label seleziona T1.

**Fase più rischiosa.** Possibile spezzare in due:
- 3a: rendering statico (nessun drag, nessun pan/zoom, solo disegno iniziale).
- 3b: aggiunta di drag fluido + pan/zoom.

### Fase 4 — Template fallback

**Scope**:
- Modifica del template default (in `defaultViewTemplate.ts` di v4) per gestire il caso `isEdge=true` con espressioni non risolvibili.
- Logica nel template: se `isEdge=true` e `evalEdgeExpression` ritorna null su almeno una espressione, render edge-like compact con preview parziale. Altrimenti ritorna null (l'overlay si occupa di disegnare).
- Coordinamento con la Fase 3: l'overlay non deve disegnare nulla quando il template renderizza il fallback.

**Scope file**:
- `frontend/src/utils/defaultViewTemplate.ts` (modifica)
- Test funzionale: T1 con `target=null` mostra fallback; settandolo, fallback scompare e arco appare.

**Esito atteso**: nessuna user trap. T1 è sempre visibile o come arco o come card.

### Fase 5 — UI properties panel + heuristic + suggester

**Scope**:
- Properties panel della view: aggiungere sezione Advanced con checkbox `isEdge` e due input `edgeSource`/`edgeTarget`.
- Banner "Edge candidate" in cima alla sezione, computato da heuristic.
- Bottone "Apply suggestions" pre-fila i 3 campi.
- Funzione `suggestEdgeExpressions(klass)` in utils.
- Dropdown autocomplete sui due input (componente esistente o nuovo).

**Scope file**:
- File del properties panel (da identificare; probabilmente `frontend/src/components/properties/ViewProperties.tsx` o equivalente)
- `frontend/src/utils/edgeHeuristic.ts` (nuovo)
- `frontend/src/utils/edgeSuggester.ts` (nuovo)
- Eventuali SCSS

**Discovery necessaria**: come è strutturato il properties panel oggi, dove vivono i form controls per le proprietà delle view, pattern per autocomplete dropdown se già esistente.

**Esito atteso**: l'utente può configurare `isEdge` da UI, vedere il banner di hint, applicare suggerimenti. Niente JSON editing manuale necessario.

### Fase 6 — Icon canvas hint

**Scope**:
- Nel template default, quando heuristic matcha e `isEdge` è ancora false, mostra icon Bootstrap in top-right della card.
- Click sull'icon apre il properties panel.
- Tooltip "Edge candidate" sull'hover.

**Scope file**:
- `frontend/src/utils/defaultViewTemplate.ts` (modifica)
- Eventuali aggiornamenti SCSS

**Esito atteso**: l'utente vede a colpo d'occhio quali metaclasse del canvas sono candidate edge, senza aprire menu.

---

## 8. Incognite aperte (da risolvere in discovery prima delle fasi rilevanti)

### Fase 1

1. Dove esattamente sono dichiarati i type `DViewElement` e i loro defaults? (`joiner/types.ts`? `D.ts`? `view.tsx`?)
2. Come si propaga un nuovo campo nel serialization Redux + caricamento progetto?
3. La migration `'2.205 -> 2.206'` è il pattern da imitare oppure ce n'è uno più recente da preferire?

### Fase 3

1. Anatomia esatta del DOM del canvas classic. Esiste `.canvas-zoom-pan-wrapper` o nome diverso? L'overlay dove va inserito (sibling del nodes-layer? wrap intorno?).
2. Il classic ha già un evento "drag in corso" su cui agganciarsi, o serve listener globale `mousedown/mousemove/mouseup`?
3. Le posizioni dei DVertex sono in Redux state aggiornate a ogni mouse-move durante drag, o sono throttled? Se throttled, il rAF-during-drag è obbligatorio.
4. Il classic ha un coordinate system specifico (es. origine al center, scaling factor non-1, ecc.) o è 1:1 con pixel CSS?
5. Il classic gestisce edge esistenti (DVoidEdge) come SVG path. Esiste un componente o stile che possiamo riusare per coerenza visiva?
6. Pan/zoom: è gestito da CSS transform sul wrapper, o da ricalcolo coordinate per tutti i nodi? Implica differenze nell'implementazione overlay.

### Fase 4

1. Il template engine espone un modo standard per "ritornare null"? `{null}` dentro un `<View>` produce un wrapper vuoto o niente?
2. Se T1 ha template che ritorna null e l'overlay non disegna nulla, la posizione (x, y) di T1 nello state è ancora rilevante per qualcosa? (Es. per il group selection di rectangle, per il center calculation di un cluster?)

### Fase 5

1. Il properties panel della view è un componente unico o composto da multiple sub-panels per categoria (size, position, jsx, css, ecc.)? Dove inserire la sezione Advanced.
2. Esiste un pattern di autocomplete dropdown già nel codebase (es. nel jsxEditor, nel cssEditor)? Se sì, riusarlo.
3. La heuristic si ricalcola a ogni render del panel, o è cachata? Probabilmente cachata, ma da decidere.

### Fase 6

1. Il template engine permette di iniettare un click handler su un'icona dentro il jsxString, che apra un'altra UI (properties panel)? O il click deve passare per un custom event globale?

### Generali

1. **Edge case multi-viewpoint**: due viewpoint attivi con view divergenti su Transition (uno isEdge, uno no). Comportamento attuale del classic: rendering della prima view applicabile? Tutte? Da chiarire prima della Fase 3.
2. **Edge case bidirectional**: se A → B esiste e B → A anche (due Transition con source/target invertiti), gli archi si sovrappongono. Routing offset o fallback a Manhattan? Probabilmente parking della cosa per L2.5.
3. **Edge che punta a se stesso (self-loop)**: T con `source = T.someRef.value`, dove `someRef.value === T`. Caso teoricamente possibile. MVP: probabilmente non supportato visivamente bene (path da node a se stesso = punto). Park.

---

## 9. Estensioni future (out of L2, ma utili da nominare)

- **L3**: drag dell'endpoint dell'arco per modificare `T1.source` / `T1.target` direttamente nel canvas. Richiede integrazione col sistema di drag esistente (probabile listener su path overlay).
- **L2.5**: routing Manhattan / bezier per gli archi overlay. Coerenza visiva con i DVoidEdge esistenti.
- **Espressioni avanzate**: ternari, condition. Es. `isInitial ? $first.value : $last.value`. Richiede un mini-parser (oltre a path).
- **Edit inline della label**: la `<foreignObject>` diventa Input editabile, modifica `T1.name` direttamente.
- **Bidirectional edge** rendering: se due Transition formano un ciclo A↔B, mostrare un solo path con doppia freccia invece di due path sovrapposti.
- **Edge label con preview attributi**: la card sull'arco non solo mostra nome+pill, mostra anche un attributo chiave (es. `name=T1, guard=isReady`).

---

## 10. Note operative per la derivazione dei prompt Claude Code

Ogni fase del piano (sezione 7) corrisponde a un prompt MD distinto, da generare in chat dedicata dopo questa. Convenzione:

- Una chat di progetto per fase. La chat di Fase 1 deriva il prompt MD per Fase 1, lo lancia in Claude Code, raccoglie il risultato, e produce il checkpoint.
- Il design doc (questo file) vive nel knowledge base come riferimento condiviso. Non si modifica durante l'implementazione: se emergono decisioni nuove, si aggiungono **addendum** in fondo, non modifiche alle sezioni esistenti.
- Ogni prompt include una Fase 0 di micro-discovery che blinda le incognite della sezione 8 specifiche per quella fase.

Tre principi operativi che voglio fissare:

1. **Niente tocco a `useJjomSync.ts`** in nessuna fase. È vincolo architetturale assoluto. Se in discovery emerge che è inevitabile, fermare e rivalutare.
2. **Niente tocco al flow editor**. Idem, vincolo architetturale.
3. **Ogni fase deve essere deployabile da sola**. Tra una fase e l'altra il codice resta in stato funzionante. Nessuna feature half-baked merged.

---

## 11. Prossimi passi immediati

1. Caricare questo design doc nel knowledge base del progetto come `design_2026-05-03_L2_edge_overlay.md`.
2. Generare checkpoint della sessione corrente (questa è grossa, 70%+ context).
3. Aprire nuova chat di progetto.
4. In nuova chat: leggere design doc + memory, generare prompt MD per Fase 1 (schema + migration) con Fase 0 di micro-discovery sui type del DViewElement.
5. Eseguire prompt in Claude Code, verificare build verde.
6. Procedere fase per fase. Stimati 4-6 cicli di lavoro (1 fase = 1-2 sessioni in media, alcune in parallelo).

Quando il design doc è caricato e questo lavoro è chiuso, L2 è pronto per partire.
