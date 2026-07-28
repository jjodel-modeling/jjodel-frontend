# Layer Impact Report — Propagazione size a tutte le istanze di una view

> Fase 2, Passo 0. Read-only completato. **Nessun edit al codice di feature ancora.**
> Branch: `alfonso-frontend-jjtl`. Base: `docs/discovery/discovery_2026-07-27_size_propagation.md`.
> Data: 2026-07-27.

## Punti d'innesto confermati (file:riga reali)

| # | Cosa | file:riga | Esito conferma |
|---|------|-----------|----------------|
| 1 | `syncPositionBatchToJjom` (gemello) | `canvasToJjom.ts:54-63` | usa `markCanvasUpdatedBatch(updates.map(...))` + `TRANSACTION('EditorV2 drag batch', ...)`. Early return `if (updates.length === 0) return;` |
| 1 | `syncSizeToJjom` | `canvasToJjom.ts:72-78` | `markCanvasUpdated(vertexId)` + `TRANSACTION('EditorV2 resize', ...)`, `SetFieldAction.new(id,'w'/'h',v,undefined,false)` |
| 1 | import syncState | `canvasToJjom.ts:31` | `markCanvasUpdatedBatch` gia' importato |
| 2 | listener modello `handleSelectNode` | `EditorV2.tsx:893-910` | `addEventListener`/`removeEventListener` in `useEffect`, deps `[modelid, setNodes, setEdges, getNodes, getViewport, setViewport]` |
| 2 | import resolver | `EditorV2.tsx:40-41` | `computeIRSignature, getIRIndex, resolveObjectAsEdgeView` + `makeReadCtx` gia' importati; **`resolveIRView` NON importato** → va aggiunto alla riga 40 |
| 2 | import store/actions | `EditorV2.tsx:95` | `store`, `SetFieldAction`, `TRANSACTION` presenti |
| 2 | import canvasToJjom | `EditorV2.tsx:69-70` | `syncPositionBatchToJjom`, `syncSizeToJjom` presenti → aggiungere `syncSizeBatchToJjom` |
| 2 | `scheduleLayoutSave` | `EditorV2.tsx:436` (`useLayoutAutosave`) | in scope, stabile |
| 2 | `resetNodeSize` (reset measured) | `EditorV2.tsx:2255-2266` | destruttura `{ width, height, measured, ...rest }` e ritorna rest → il reset di `measured` e' l'intento da specchiare |
| 3 | checkbox Resizable | `VertexAuthoringPanel.tsx:256-265` | **NON esiste una variabile `canResize`**: il valore e' inline nel `checked` (`draft.resizable ?? defaultResizableForForm(...)`, `:260`) — vedi Discrepanza D1 |
| 3 | import UI | `VertexAuthoringPanel.tsx:3,8` | `Button` gia' importato; `defaultResizableForForm` gia' importato; **`JjodelEvents` da aggiungere** |
| 4 | registry Canvas | `events/registry.ts:17-24` | `SELECT_NODE: 'jjodel:selectNode'` a `:19` |
| 5 | view risolta da object node | `ObjectNode.tsx:50`, `irResolveCore.ts:213` | `data.instanceOfClassId` + `lookup[nodeId].model` = DObject id; `resolveIRView(objectId, classId, index, readCtx, lookup)?.viewId === view.id` |

**Grep collisione (Passo 0)**: `PROPAGATE_VIEW_SIZE`, `jjodel:propagate-view-size`,
`syncSizeBatchToJjom` → **NESSUNA occorrenza** in `frontend/src/`.

**Firme resolver confermate** (da `irResolveCore.ts`, ri-esportate da `irResolve.ts:29`):
- `resolveIRView(objectId, metaclassId, index, readCtx, idlookup) → CompiledView | null` (`:213-219`)
- `getIRIndex(state, signature) → IRViewpointIndex | null` (`:94`)
- `computeIRSignature(state) → string` (`:76`)
- `makeReadCtx(idlookup) → ReadCtx` (`irReadCtxLproxy.ts:52`)

**Meccanismo di avviso (punto 3)**: sistema **toast** del progetto —
`import { toast } from '../Toast/toastDispatch'` (stesso stile di `contextMenu/ContextMenu.tsx:52`).
`toast.warning('msg')`. E' il meccanismo esistente (drop-in di `U.alert`), **non** un nuovo sistema.
Non e' ancora importato in EditorV2 → import da aggiungere.

---

## LAYER IMPACT REPORT

**Layers touched:**
- [ ] D-layer (Redux raw data) — **SI'** (scrive `DVertex.w`, `DVertex.h`)
- [ ] L-layer (computed proxies) — no (lettura via `lookup[nodeId].model` per risoluzione, nessuna scrittura)
- [ ] JjOM (model entities) — no
- [x] Canvas v2-flow (ReactFlow nodes/edges) — **SI'** (`setNodes` applica width/height ai target)
- [ ] Canvas classic — no
- [ ] Sync layer (useJjomSync hooks) — no (non modificato; interazione passiva, sotto)
- [ ] Persistence (VersionFixer / jsxString) — no (nessuna migrazione; l'autosave riusa `ProjectsApi.save`)

**Per ogni layer toccato:**

- **D-layer (DVertex.w / DVertex.h)**
  - *What changes*: per ogni DVertex target, `SetFieldAction.new(vertexId, 'w', w, undefined, false)` e
    `SetFieldAction.new(vertexId, 'h', h, undefined, false)` dentro **UNA** `TRANSACTION`
    (nuova `syncSizeBatchToJjom`, gemella di `syncPositionBatchToJjom`).
  - *What does NOT change*: nessun altro campo del DVertex (x/y invariati), nessun DObject, nessun
    DReference, nessun edge D-layer.
  - *Cross-layer interaction*: `markCanvasUpdatedBatch(ids)` (anti-bounce) segna i target come
    "canvas-updated" → `useJjomSync` salta la ri-trasformazione di posizione/size per quegli id nel
    tick corrente.
  - *Side-effect safety*: `SetFieldAction` su campi **esistenti** dentro `TRANSACTION` — mai wrappato
    un `.new()` di creazione (§3.3 rispettato). Un solo passo di undo per l'intero batch.

- **Canvas v2-flow (ReactFlow)**
  - *What changes*: `setNodes(nds => nds.map(n => targetIds.has(n.id) ? { ...n, width: w, height: h,
    measured: undefined } : n))` — applica width/height top-level ai soli nodi target e forza la
    rimisura (intento di `resetNodeSize`). E' questo il write che rende **visibile** la size (per gli
    object node il D-layer w/h non e' riletto — finding Q1).
  - *What does NOT change*: nodi non-target invariati; nessun altro tipo di nodo; nessun edge RF
    modificato direttamente.
  - *Cross-layer interaction*: la rimisura genera `dimensions` change **senza `resizing`** →
    filtrate dal rate-limiter/dedup di `onNodesChange` (`EditorV2.tsx:3569-3595`); NON ritriggerano
    `syncSizeToJjom` (gate `ch.resizing`, `:3544`). Nessun loop.
  - *Side-effect safety*: snapshot RF via undo esistente (posso chiamare `takeSnapshot()` prima del
    `setNodes`, come `resetNodeSize`) → il render e' revocabile con Ctrl+Z.

**Reconcile/sync che potrebbero scattare:**
- `useJjomSync` gate `sizeChanged` calcolato **solo** su `rfNode.style.width/height`
  (`:1364-1376`). `objectVertexToRFNode` non emette `style` → per gli object node `sizeChanged`
  resta `false` → **il sync NON ripatcha la size** (nessun conflitto/ritorno indietro).
- `markCanvasUpdatedBatch` anti-bounce sui target.
- `portDistribution` **NON coinvolto** (governa handleId, non la size del nodo).
- Geometria edge: `computeOptimalHandles` (`jjomTransformers.ts:385-390`) legge `raw.w/raw.h` →
  persistere DVertex.w/h tiene gli handle/edge coerenti con la nuova size.

**Blast radius:** solo gli object node che risolvono a `view.id` nel viewpoint attivo di
**questo** editor. Nessun altro tipo di nodo, nessun altro viewpoint, nessun altro modello.

**Rollback:** (a) `setNodes` → snapshot RF (undo esistente, un passo); (b) scrittura D-layer → una
sola `TRANSACTION` = un solo passo di undo.

**Cosa NON si tocca:** `objectVertexToRFNode`/`jjomTransformers.ts` (read-back fuori scope, fetta
futura), `useJjomSync.ts`, `portDistribution.ts`, `syncPositionToJjom`/`syncSizeToJjom` esistenti,
il memo `featureInfo` del pannello.

---

## Discrepanze rispetto al prompt (da approvare)

- **D1 — `canResize` nel pannello non esiste.** Il prompt dice "riusa `canResize` gia' calcolato a
  ~:260". In realta' `VertexAuthoringPanel.tsx` **non ha** una variabile `canResize`: a `:260` il
  valore e' inline nel `checked` della checkbox (`draft.resizable ?? defaultResizableForForm(typeof
  form === 'string' ? form : undefined)`). **Piano**: aggiungo una `const canResize = <stessa
  espressione>;` (una riga nuova, vicino a `const form` a `:175`) e la uso **solo** nel
  `disabled={!canResize}` del bottone. **Lascio la checkbox a `:260` invariata** (nessun tocco a
  codice committed adiacente, §rule 8). Micro-duplicazione dell'espressione accettata per zero
  rischio.
- **D2 — batch anti-bounce.** Il gemello reale `syncPositionBatchToJjom` usa
  `markCanvasUpdatedBatch(ids)`, **non** un loop di `markCanvasUpdated`. La nuova
  `syncSizeBatchToJjom` userà `markCanvasUpdatedBatch(sizes.map(s => s.vertexId))` per specchiarlo
  esattamente (il corpo proposto nel prompt usava il loop; lo allineo al gemello).
- **D3 — scoping multi-editor dell'avviso.** Per evitare warning spuri se piu' EditorV2 sono montati:
  calcolo prima i **target** (`resolvesToView`); se `targets.length === 0` → **return silenzioso**
  (questo editor non rende la view). La sorgente = target **selezionati**; se `!== 1` → `toast.warning`
  + return. Rispetta la decisione ratificata ("esattamente un selezionato che risolve alla view; else
  no-op con avviso") e non spara warning dagli editor che non mostrano la view. Nessun gate su
  `modelid` (il pannello ha solo `view.id`; la risoluzione e' gia' scopata dal viewpoint attivo).
- **D4 — import da aggiungere:** in EditorV2 `resolveIRView` (riga 40), `syncSizeBatchToJjom` (blocco
  ~69-70), `toast` (nuovo import da `../Toast/toastDispatch`); nel pannello `JjodelEvents` (da
  `../../../../events/registry` — verifico la profondita' esatta in implementazione). Nessuno e' un
  identificatore nuovo pubblico: sono import di simboli esistenti.

Nessuna di queste tocca file fuori dai 5 dichiarati o layer non nominati.

---

## Lista file (5 in scrittura, dopo go-ahead)

1. `frontend/src/events/registry.ts` — `+ PROPAGATE_VIEW_SIZE: 'jjodel:propagate-view-size'` (gruppo Canvas)
2. `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — **critical zone**: SOLA aggiunta di `syncSizeBatchToJjom` (gemella, `markCanvasUpdatedBatch` + una `TRANSACTION`)
3. `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — bottone "Propaga dimensione" + `const canResize` + import `JjodelEvents`
4. `frontend/src/components/editor-v2/EditorV2.tsx` — listener `PROPAGATE_VIEW_SIZE` (target-first, source = 1 selezionato, `setNodes` + `syncSizeBatchToJjom` + `scheduleLayoutSave`) + 3 import
5. `docs/claude-code-log.md` — entry finale

**Verdetto critical-zone**: confermato. Scrittura D-layer (`DVertex.w/h` via `SetFieldAction near
sync`) + modifica di `canvasToJjom.ts`. LIR prodotto (questo file).

---

## HARD STOP — attendo go-ahead di Alfonso sull'LIR prima di ogni edit al codice.
