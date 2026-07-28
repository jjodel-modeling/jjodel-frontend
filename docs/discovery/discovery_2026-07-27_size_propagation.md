# Discovery 2026-07-27 — propagazione della size a tutte le istanze di una view

> **Fase 1 di un two-phase. Read-only.** Nessun edit al codice di feature, nessun commit.
> Questo report mappa dove vive la size per-istanza, come si enumerano le istanze di una
> view, con quale primitiva si scrive in bulk, e valuta il rischio critical-zone.
> Branch: `alfonso-frontend-jjtl`.

## Obiettivo (Fase 2, NON implementata ora)

Accanto alla checkbox "Resizable" nel `VertexAuthoringPanel`, un **pulsante** che prende la
dimensione dell'istanza sorgente (il nodo appena ridimensionato con le maniglie) e la propaga
**uguale a TUTTE le istanze rese da quella view** nel viewpoint corrente. One-shot "uniforma
ora", scrittura di **geometria per-istanza** (w/h sui DVertex), nessun nuovo campo IR.

## File letti / analizzati

- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`syncSizeToJjom`, `syncPositionToJjom`, `syncPositionBatchToJjom`)
- `frontend/src/components/editor-v2/EditorV2.tsx` (handler resize `onNodesChange`, listener CustomEvent, `getNodes/setNodes`, `resetNodeSize`)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`objectVertexToRFNode`, `packageVertexToRFNode`, `computeOptimalHandles`)
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (patch surgico nodi, gate `sizeChanged` su `style.width/height`)
- `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts` (persistenza layout = full project save)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo IR, `useIRView`, `data-viewid`, gate resize, `canResize`)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (`isNodeResizable`, `defaultResizableForForm`, `SHAPE_MIN_SIZE`)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (`useIRView`, `IRViewResolution`)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`resolveIRView`, `getIRIndex`, `computeIRSignature`)
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts` (`makeReadCtx`)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (props `{ view }`, checkbox Resizable)
- `frontend/src/components/editors/views/ViewData.tsx` (chi monta il pannello, quale contesto passa)
- `frontend/src/events/registry.ts` (`JjodelEvents`, gruppo Canvas)
- `docs/discovery/discovery_2026-07-23_classic_node_resize_sizing.md` (persistenza size: gia' documentata)

---

## Q1 — Dove vive la size per-istanza e chi la scrive

**Esiste gia' un `syncSizeToJjom` speculare a `syncPositionToJjom`.** `canvasToJjom.ts:72-78`, verbatim:

```ts
export function syncSizeToJjom(vertexId: string, w: number, h: number): void {
    markCanvasUpdated(vertexId);
    TRANSACTION('EditorV2 resize', () => {
        SetFieldAction.new(vertexId as any, 'w' as any, w, undefined, false);
        SetFieldAction.new(vertexId as any, 'h' as any, h, undefined, false);
    });
}
```

- **Campi esatti**: `w` e `h`, top-level sul **DVertex** (D-layer). Primitiva:
  `SetFieldAction.new(vertexId, 'w'/'h', value, undefined, false)` dentro `TRANSACTION`, con
  `markCanvasUpdated(vertexId)` anti-bounce prima (identico pattern di `syncPositionToJjom` `:43-49`).
- **Chi la chiama**: `EditorV2.tsx:3543-3552`, solo sui `dimensions` change con `resizing` true
  (resize esplicito, non l'auto-measure di RF), verbatim:

  ```ts
  if (hasResize) {
      for (const c of changes.filter((ch: any) => ch.type === 'dimensions' && ch.resizing)) {
          const node = getNodes().find((n) => n.id === c.id);
          const w = c.dimensions?.width ?? node?.measured?.width;
          const h = c.dimensions?.height ?? node?.measured?.height;
          if (w !== undefined && h !== undefined) {
              syncSizeToJjom(c.id, w, h);
          }
      }
  }
  ```

- **Per-DVertex = per-istanza-per-viewpoint.** Il DVertex e' l'artefatto grafico dell'oggetto
  DENTRO un graph/viewpoint; ogni viewpoint ha il proprio DVertex per lo stesso DObject. Quindi la
  size e' **per-istanza dentro il viewpoint**, NON condivisa fra viewpoint. Coerente col bersaglio
  ("tutte le istanze della view nel viewpoint corrente").

### ⚠️ Nota critica Q1 — la size e' PERSISTITA ma NON RILETTA per gli object node

`objectVertexToRFNode` (`jjomTransformers.ts:243-339`) legge **solo x/y** (`:324-326`) e ritorna
`{ position: {x,y}, data }` — **nessun `style`, nessun `width`, nessun `height`**. L'**unico**
transformer che rilegge `raw.w`/`raw.h` e' `packageVertexToRFNode` (`:221-231`):

```ts
const w = typeof raw.w === 'number' ? raw.w : 400;
const h = typeof raw.h === 'number' ? raw.h : 300;
// ... style: { ..., width: w, height: h }
```

Il patch surgico di `useJjomSync.ts:1364-1376` calcola `sizeChanged` **solo su
`rfNode.style.width/height`** (commento esplicito `:1364`: "packageNode uses style.width/height").
Poiche' `objectVertexToRFNode` non emette `style`, per un object node `newW/oldW` sono sempre
`undefined` → `sizeChanged === false` → **il sync NON ripatcha mai la size di un object node**.

Il resize a mano di un object node scrive `node.width`/`node.height` **top-level sul nodo RF** (via
`applyNodeChanges` interno al `NodeResizer`); vive solo nell'array `nodes` (stato React di EditorV2),
non nel D-layer render-path. Confermato e gia' documentato in
`discovery_2026-07-23_classic_node_resize_sizing.md:162-166`:

> *"viene persistito ma non riletto. [...] `syncSizeToJjom(c.id, w, h)` [...] scrive `w` e `h` in
> D-layer. Ma `objectVertexToRFNode` non li rilegge mai. In sessione le dimensioni sopravvivono
> [...] a un rebuild completo o al reload il resize di un Object [node non sopravvive]"*

**Conseguenza per la Fase 2 (fondamentale):** scrivere `w/h` su N DVertex **NON basta** ne' a
ri-renderizzare le istanze montate ne' a farle sopravvivere al reload. Il write che rende
visibile la size deve passare da **`setNodes`** applicando `width`/`height` top-level sui nodi RF
target (esattamente come fa il `NodeResizer`). La scrittura DVertex.w/h resta utile per
consistenza col resize manuale e perche' e' letta dalla geometria degli edge (`computeOptimalHandles`
legge `raw.w`/`raw.h`, `jjomTransformers.ts:385-390`), ma da sola e' inerte sul render del box.

---

## Q2 — Come si legge la size della sorgente (nodo attivo)

- **Il pannello NON ha accesso alla selezione/canvas.** `VertexAuthoringPanel` riceve solo
  `{ view: LViewElement }` (`VertexAuthoringPanel.tsx:14-16`, `:48`) e viene montato da
  `ViewData.tsx:90` con `<VertexAuthoringPanel view={view} />`. La selezione RF vive nello stato
  `useNodesState` di EditorV2 (`EditorV2.tsx:325`), NON in Redux. Il pannello conosce quindi la
  **view** (`view.id`), non il nodo sorgente.
- **La sorgente va risolta in EditorV2** (che ha `getNodes()`/`setNodes`). Sorgente = il nodo
  object **selezionato** (`getNodes().find(n => n.selected)`), coerente con la decisione di Alfonso
  ("il nodo selezionato/ridimensionato, quello di cui e' aperto il pannello IR").
- **Lettura affidabile della size dal nodo RF sorgente**: pattern gia' usato in
  `EditorV2.tsx:948-949` e `:1780-1781`:

  ```ts
  const w = (n.measured?.width  ?? (n as any).width  ?? DEFAULT) as number;
  const h = (n.measured?.height ?? (n as any).height ?? DEFAULT) as number;
  ```

  `node.width`/`node.height` (top-level, settati dal NodeResizer) rappresentano il resize esplicito;
  `node.measured` e' la misura corrente di RF. Preferire il live RF node al DVertex `raw.w/raw.h`
  (che per un object node auto-misurato content-hug potrebbe non riflettere la size resa).

---

## Q3 — Come si enumerano tutte le istanze di una view nel viewpoint corrente

- **Chiave di match: `compiled.viewId === view.id`.** Confermato: `getIRIndex` compila ogni view con
  `compileView(vid, ir)` dove `vid` e' l'id del DViewElement iterando `state.viewelements` filtrato
  su `d.viewpoint === vp` (`irResolveCore.ts:110-142`, `:167`). Quindi `compiled.viewId ===
  DViewElement.id === LViewElement.id` (l'id che il pannello edita).
- **Il campo discriminante NON e' in `node.data`.** La risoluzione e' per-render dentro `ObjectNode`
  via `useIRView(id, data.instanceOfClassId)` (`ObjectNode.tsx:50`), che ritorna `IRViewResolution`
  con `compiled.viewId` (`irResolve.ts:32-36`, `:94`). Sul DOM il wrapper espone
  `data-viewid={irResolution.compiled.viewId}` e class `ir-view-${viewId}` (`ObjectNode.tsx:384-385`).
- **Dall'RF node al DVertex.id**: l'id del nodo RF **E'** l'id del DVertex (`objectVertexToRFNode`
  `:329`: `id: vertex.id`). Nessuna mappatura extra.
- **Strategia (A), canonica, senza DOM — replica della risoluzione in EditorV2:**

  ```ts
  const state = store.getState();
  const lookup = state.idlookup;
  const index = getIRIndex(state, computeIRSignature(state));
  const readCtx = makeReadCtx(lookup);
  const targets = getNodes().filter(n => {
      if (n.type !== 'objectNode') return false;
      const objectId = lookup?.[n.id]?.model;              // DVertex.model = DObject id
      const classId  = (n.data as ObjectNodeData).instanceOfClassId;
      if (typeof objectId !== 'string' || !classId || !index) return false;
      const compiled = resolveIRView(objectId, classId, index, readCtx, lookup);
      return compiled?.viewId === targetViewId;             // === view.id
  });
  ```

  `resolveIRView` (`irResolveCore.ts:213-246`), `getIRIndex` (`:94`), `computeIRSignature` (`:76`),
  `makeReadCtx` (`irReadCtxLproxy.ts:52`) sono tutti export standalone (ri-esportati da `irResolve.ts`).
  Questo restituisce **esattamente** gli oggetti che risolvono a QUESTA view (non tutti i nodi, non
  tutti gli oggetti della metaclasse: il resolver applica specificita' + predicato).
- **Strategia (B), fallback DOM**: `document.querySelectorAll('[data-viewid="<viewId>"]')`, poi
  risalire al `.react-flow__node[data-id]` per l'id. Meno robusta; usare solo se A non praticabile.

---

## Q4 — Primitiva di scrittura in bulk + verdetto critical zone

**Il write ha DUE componenti** (per la nota Q1):

1. **Render immediato (obbligatorio)** — `setNodes` che applica `width`/`height` top-level ai nodi
   target, come fa il resizer:

   ```ts
   setNodes(nds => nds.map(n =>
       targetIds.has(n.id) ? { ...n, width: w, height: h, measured: undefined } : n
   ));
   ```

   (`measured: undefined` forza RF a rimisurare rispettando la nuova width/height; verificare vs
   il pattern di `resetNodeSize` `EditorV2.tsx:2258-2263` che rimuove `width/height/measured`.)

2. **Persistenza D-layer (consigliata)** — per ogni target `syncSizeToJjom(id, w, h)`
   (`SetFieldAction` su campo esistente, dentro `TRANSACTION`). Due opzioni:
   - **loop di `syncSizeToJjom`** in EditorV2 → N transazioni, **nessuna modifica a file
     critical-zone** (riuso della funzione esistente).
   - **nuova `syncSizeBatchToJjom`** in `canvasToJjom.ts` (una sola `TRANSACTION` per N vertici,
     specchio di `syncPositionBatchToJjom` `:54-63`) → **modifica un file critical-zone**.

**Pattern TRANSACTION**: sicuro su `SetFieldAction` di campo esistente; **mai** wrappare un `.new()`
(§3.3). Qui non si crea nulla, si scrive solo w/h → safe. `markCanvasUpdated` (gia' interno a
`syncSizeToJjom`) evita il bounce del sync.

**Effetti collaterali del bulk write:**
- `setNodes` → re-render + rimisura RF dei nodi target. Il loop di dimension-change e' protetto da
  dedup + rate-limiter (`EditorV2.tsx:3569-3595`); il resize esplicito passa, l'auto-measure e'
  filtrato.
- Edge: `computeOptimalHandles` (`jjomTransformers.ts:385-390`) legge `raw.w/raw.h` → persistere
  DVertex.w/h tiene gli edge ancorati correttamente alla nuova size.
- `portDistribution` NON e' coinvolto (governa gli handleId, non la size del nodo).
- `useJjomSync` NON ripatcha la size degli object node (vedi Q1) → nessun conflitto di reconcile.

### VERDETTO CRITICAL-ZONE — **LIR RICHIESTO in Fase 2**

Il feature **scrive nel D-layer** (`DVertex.w/h` via `SetFieldAction near sync`, tramite
`syncSizeToJjom`). Questo rientra nei write-path elencati in §3.2 ("D-layer write paths ...
`SetFieldAction` near sync") e nella regola 20 ("una change che propaga al D-layer → pausa e
report"). Inoltre, se si sceglie la `syncSizeBatchToJjom`, si **modifica `canvasToJjom.ts`**, file
critical-zone §3.1. In entrambi i casi la **Fase 2 richiede go-ahead + Layer Impact Report**
prima del diff.

---

## Q5 — Wiring: pulsante nel pannello → azione sul canvas

- **Il pannello non ha accesso al canvas** → pattern canonico del progetto = **CustomEvent
  pannello→EditorV2**. Esempi esistenti (EditorV2 e' un listener-hub): `SELECT_NODE`
  (`EditorV2.tsx:893-910`, detail `{ nodeId, modelId }`), `TOGGLE_SINGLETONS` (`:757`),
  `CHILD_CONTEXT_MENU` (`:2573`), `TOGGLE_GRID/EDGE_LABELS/BACKGROUND` (`:598-600`).
- **Proposta**:
  - `registry.ts` (gruppo Canvas, dopo `SELECT_NODE` `:19`): nuovo `PROPAGATE_VIEW_SIZE:
    'jjodel:propagate-view-size'` (verificato: nessuna collisione con stringhe esistenti).
  - `VertexAuthoringPanel.tsx`: bottone accanto alla checkbox Resizable (`:258-265`), che dispatcha
    `window.dispatchEvent(new CustomEvent(JjodelEvents.PROPAGATE_VIEW_SIZE, { detail: { viewId: view.id } }))`.
    Il pannello ha `view.id` dalle props. Non conosce la sorgente: la risolve EditorV2.
  - `EditorV2.tsx`: nuovo `useEffect` con `window.addEventListener(JjodelEvents.PROPAGATE_VIEW_SIZE, ...)`
    (specchio esatto di `handleSelectNode` `:893-910`) che: (1) trova la sorgente = object node
    selezionato che risolve a `viewId`; (2) ne legge w/h (Q2); (3) enumera i target (Q3); (4)
    applica via `setNodes` + `syncSizeToJjom` per target (Q4); (5) `scheduleLayoutSave()`
    (`useLayoutAutosave`).
- **Stato resizable nel pannello (per il gate del bottone)**: gia' calcolato a
  `VertexAuthoringPanel.tsx:260`: `draft.resizable ?? defaultResizableForForm(form)`.

---

## Q6 — Vincoli ed edge case

- **Bottone solo per view resizable**: **si', disabilitarlo quando `canResize` e' false**. Il
  pannello conosce lo stato via `draft.resizable ?? defaultResizableForForm(typeof form === 'string'
  ? form : undefined)` (`VertexAuthoringPanel.tsx:260`, `defaultResizableForForm` in
  `nodeSizing.ts:37-39`). Su una content-hug non-resizable propagare una size fissa non ha effetto
  utile: il neutralizzatore CSS `ir-resizable` (irStyle) si applica solo se `canResize`, e senza di
  esso il box ri-hugga il contenuto.
- **Istanza content-hug che riceve w/h espliciti**: diventa **fixed-size** (la `width`/`height`
  top-level sul nodo RF vince sul content-hug, come un resize manuale). E' coerente **solo** se la
  view e' resizable → per questo si gate il bottone su `canResize`.
- **Sopravvivenza al reload**: **NO per gli object node** allo stato attuale. `w/h` sono persistiti
  in D-layer (full project save di `useLayoutAutosave`) ma `objectVertexToRFNode` non li rilegge mai
  (Q1 + `discovery_2026-07-23_classic_node_resize_sizing.md:162-166`). La size propagata sopravvive
  **in-sessione** (via `setNodes`) ma si perde al reload/rebuild, **identico** al resize manuale di
  un object node. Campo persistito = lo stesso (`w`/`h`). E' un **gap pre-esistente**, non introdotto
  da questa feature; per farla sopravvivere al reload servirebbe estendere `objectVertexToRFNode` a
  leggere `raw.w/raw.h` ed emettere `style` (fuori scope, tocca il transformer). **→ Domanda aperta
  per Alfonso.**
- **Nessuna istanza oltre la sorgente**: no-op benigno (la sorgente e' gia' dimensionata).
- **Sorgente ambigua (piu' nodi selezionati)**: serve una regola. Raccomandazione: usare l'unico
  object node selezionato che risolve alla view; se 0 o >1, no-op con avviso (o primo selezionato).
  **→ Decisione per Alfonso.**
- **Istanze fuori dal viewport**: RF tiene TUTTI i nodi nell'array `nodes` (default
  `onlyRenderVisibleElements=false`), quindi `getNodes()` le include e `setNodes` le dimensiona
  tutte. Il loro `measured` puo' essere `undefined` finche' non renderizzate — irrilevante per la
  SCRITTURA (settiamo width/height espliciti).

---

## Sintesi write-path proposto (Fase 2)

1. Enumerare i target con la **Strategia A** (resolver replication, `compiled.viewId === view.id`).
2. Leggere w/h dalla **sorgente** (object node selezionato) via `measured ?? width/height`.
3. **Render**: `setNodes` con `width`/`height` top-level sui target (+ reset `measured`).
4. **Persistenza**: `syncSizeToJjom(id, w, h)` per target (loop) — oppure `syncSizeBatchToJjom`
   (una TRANSACTION, ma modifica un file critical-zone).
5. `scheduleLayoutSave()`.

## File che la Fase 2 dovra' toccare (proposta)

| File | Modifica | Critical-zone |
|------|----------|:---:|
| `frontend/src/events/registry.ts` | +1 costante `PROPAGATE_VIEW_SIZE` | no |
| `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | bottone accanto a "Resizable", dispatch evento, gate su `canResize` | no |
| `frontend/src/components/editor-v2/EditorV2.tsx` | listener evento: sorgente + enumerazione + `setNodes` + `syncSizeToJjom` + `scheduleLayoutSave` | no (ma scrive D-layer via `syncSizeToJjom`) |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` *(opzionale)* | `syncSizeBatchToJjom` (una TRANSACTION) | **SI'** |

**Verdetto**: la Fase 2 scrive nel D-layer (DVertex.w/h) → **LIR obbligatorio** a prescindere;
`canvasToJjom.ts` va toccato solo se si sceglie il batch. Sono 3 file (4 col batch) → sotto la
soglia dei 5, ma con write critical-adjacent.

## Rischi

- **Render inerte se si scrive solo DVertex.w/h** (senza `setNodes`): l'errore piu' probabile, dato
  che `syncSizeToJjom` esiste gia' e sembra "sufficiente". NON lo e' per gli object node (Q1).
- **Loop di rimisura RF** su `setNodes` di molti nodi: mitigato dal rate-limiter `:3569-3595`, da
  verificare su viewpoint con molte istanze.
- **Overwrite silenzioso** di istanze dimensionate a mano: e' il comportamento voluto ("uguale per
  tutte"), ma va confermato in UX (nessun undo dedicato oltre allo snapshot RF esistente).

## Domande aperte per Alfonso

1. **Reload**: accetti che la size propagata sopravviva **in-sessione** ma si perda al reload (come
   il resize manuale degli object node oggi), oppure la Fase 2 deve **anche** chiudere il gap di
   read-back (`objectVertexToRFNode` legge `raw.w/raw.h`)? Quest'ultimo tocca il transformer ed
   estende lo scope.
2. **Sorgente ambigua**: se ci sono 0 o >1 object node selezionati che risolvono alla view, cosa
   fare — no-op con avviso, primo selezionato, o richiedere selezione singola?
3. **Batch vs loop**: preferisci `syncSizeBatchToJjom` (una TRANSACTION, ma tocca `canvasToJjom.ts`
   critical-zone) o il loop di `syncSizeToJjom` (N transazioni, nessun file critical-zone modificato)?

---

**HARD STOP** — report scritto. Nessun edit al codice di feature, nessun commit, nessun `git add`.
