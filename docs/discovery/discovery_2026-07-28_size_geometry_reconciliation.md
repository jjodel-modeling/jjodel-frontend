# Discovery (read-only) — Riconciliazione size ↔ geometria degli object node IR

**Data**: 2026-07-28
**Branch**: `alfonso-frontend-jjtl` (ahead of origin, non pushato — numeri di riga confermati sui file reali)
**Tipo**: discovery Fase 1 (read-only). Nessun edit al codice di feature, nessun commit, nessun tocco al WIP.
**Nome documento prompt**: 2026-07-28 15:04

---

## Obiettivo

Mappare le sorgenti di size di un object node IR e stabilire la RCA di due anomalie osservate su una
view State (`rounded`, pill "S1"/"S2"): **A** (collapse all'attivazione del resize) e **B** (edge che
non toccano il bordo in content-hug). Verificare/smentire le ipotesi RCA. Nessuna implementazione.

## Verdetto in una riga

Entrambe le anomalie hanno **la stessa causa strutturale**: l'object node IR **non ha una size
autorevole unica**. Il box di layout misurato da React Flow (il `.mm-node`, con floor 140×40) è
**decoupled** dalla size renderizzata content-hug (`.ir-node-content`). L'ipotesi RCA di **A** è
**confermata**; quella di **B** è **parzialmente smentita** (l'ancora edge NON deriva da `raw.w/h` in
pixel — deriva dal DOM misurato — quindi il gap è box-model, non un read-back geometrico).

## File letti / analizzati (path completi)

Diretti: `nodes/ObjectNode.tsx`, `viewpoint/ir/irStyle.ts`, `EditorV2.scss` (floor `.mm-node`),
`EditorV2.tsx` (listener propagazione + `resetNodeSize`), `viewpoint/authoring/VertexAuthoringPanel.tsx`,
`components/DynamicHandles.tsx`, `utils/handlePosition.ts` (indice).
Via 3 agenti read-only: `utils/jjomTransformers.ts` (transformer + `computeOptimalHandles` +
`jjomEdgeToRFEdge`), `model/dataStructure/GraphDataElements.tsx` + `joiner/classes.ts` (DVertex w/h),
`edges/UnifiedEdge.tsx` + `utils/edgeUtils.ts` (edge component), `hooks/useJjomSync.ts` (gate
`sizeChanged`, **critical zone, sola lettura**), `sync/canvasToJjom.ts`, `utils/portDistribution.ts`
(**critical zone, sola lettura**); `git status`/`git stash list`/diff `EditorV2.tsx`.

---

## Gruppo A — Collapse all'attivazione del resize

### QA1 — Meccanismo del collapse (ipotesi CONFERMATA)

`ObjectNode.tsx` ramo IR (`:378-395`):
```tsx
const shapeForm = irResolution.compiled.form(...);
const hasGeometricShape = defaultResizableForForm(shapeForm);
const resolvedResizable = (irResolution.compiled.ir as VertexViewIR).resizable;
const canResize = resolvedResizable ?? hasGeometricShape;
... className={`mm-node mm-object ... ${canResize ? ' ir-resizable' : ''}`}
... {isNodeResizable('objectNode', canResize) && <NodeResizer minWidth={SHAPE_MIN_SIZE} minHeight={SHAPE_MIN_SIZE} ... />}
```
Il marker `ir-resizable` è sul **`.mm-node`** (wrapper esterno, `:384`). Neutralizer (`irStyle.ts:80`):
```
.mm-node.ir-resizable { min-width: 0; min-height: 0; width: 100%; height: 100%; }
```
Floor base (`EditorV2.scss:1208-1213`): `.mm-node { ... min-width: 140px; min-height: 40px; }`.

**Conferma**: con `resizable:true`, il neutralizer azzera il floor 140×40 e impone `width:100%;
height:100%`. Ma il nodo RF **non ha width/height esplicite** (il transformer emette solo x/y — vedi
QB1) e non c'è stato resize; quindi `100%` si risolve contro un contenitore **senza dimensione
definita** con `min-width:0` → il box **collassa a min-content** (la pill minuscola). Deselezionando
(`resizable` off/undefined) il neutralizer sparisce, torna il floor + content-hug → dimensione
originale. **Ipotesi RCA A: confermata.**

### QA2 — Size misurata a render-time

`ObjectNode({ id, data, selected }: NodeProps<ObjectNodeType>)` (`:43`) destruttura **solo**
`id/data/selected`. **Non** legge `width`/`height` da `NodeProps` né `measured` via `useStore`. →
oggi ObjectNode **non ha accesso alla propria size misurata a render**; un seed render-side richiede
di aggiungere quell'accesso (React Flow espone `width`/`height` opzionali su `NodeProps`, oppure
`useStore(nodeLookup.get(id)?.measured)`).

### QA3 — Chi conosce la size imperativamente (modello propagazione)

Listener `PROPAGATE_VIEW_SIZE` (`EditorV2.tsx:964-1002`):
```tsx
const w = src.measured?.width ?? (src as any).width;   // :982
const h = src.measured?.height ?? (src as any).height; // :983
...
setNodes(nds => nds.map(n => targetIds.has(n.id) ? { ...n, width: w, height: h, measured: undefined } : n)); // :993-995
syncSizeBatchToJjom([...targetIds].map(id => ({ vertexId: id, w, h }))); // :997
```
`resetNodeSize` (`:2316-2327`) fa l'inverso: `const { width, height, measured, ...rest } = n; return rest`
→ rimuove size esplicita, torna content-hug.
`VertexAuthoringPanel`: `draft` (`:52`), `dirtyRef` (`:56`), commit debounced `(view as any).ir = draft`
dopo `COMMIT_DEBOUNCE_MS=300` (`:33,:68-76`); la checkbox scrive solo `draft.resizable` via `patch`.
**Nessun seed canvas-side al toggle oggi**: il pannello scrive solo il campo IR; il canvas reagisce
(ObjectNode → `canResize` → neutralizer → collapse). Un seed richiederebbe nuovo wiring analogo al
listener (leggere `measured` del nodo, applicarla via `setNodes` width/height).

### QA4 — Un px esplicito vince sul neutralizer? SÌ

- Inline-style `width/height` in px sul `.mm-node` → **vince** sul `.mm-node.ir-resizable { width:100% }`
  (inline beats class), e `min-width:0` del neutralizer **rimuove il floor** quindi il px non è floorato.
- RF top-level `width/height` sul nodo → RF setta la **dimensione del wrapper** `.mm-node` (dimensione
  definita) → `width:100%` interno si risolve contro un box definito → **niente collapse**.
- **Conclusione**: il neutralizer va **mantenuto** (serve ad azzerare il floor per far scendere il
  resizer sotto 140×40); una size esplicita seminata **convive** e vince. Un marker distinto
  `ir-sized` NON è strettamente necessario (l'inline px vince comunque), ma potrebbe chiarire lo stato
  "size esplicita" se si preferisce agire via classe anziché inline.

---

## Gruppo B — Edge che non toccano il bordo (content-hug)

### QB1 — Sorgente di size della geometria edge

`utils/jjomTransformers.ts`:
- `objectVertexToRFNode` (`:243`, return `:328-338`): legge **solo** `raw.x/raw.y`; il nodo RF **non
  ha width/height/style** — solo `position`. La size dell'object node è **content-hug/DOM**.
- `packageVertexToRFNode` (`:215`, `:221-232`): unico che emette `style.width/height` da `raw.w/raw.h`
  con **default 400/300**. (`class`/`enum` come object: position-only.)
- `computeOptimalHandles` (`:374`, size `:381-390`): legge `raw.w/raw.h` con **fallback 180/80**, MA
  **solo per scegliere il LATO** (ritorna un handle id `top-0`/`bottom-0`/`left-0`/`right-0`), **non
  pixel**.

`DVertex.w/h` (D-layer): dichiarate senza default (`GraphDataElements.tsx:96` `w!:number; h!:number`;
ridichiarate `:1680-1681`). `defaultVertexSize = undefined` (`:1088`); `DVoidVertex` (`classes.ts:1323`)
setta x/y ma **non** w/h quando `defaultVSize` è undefined (`isResized=false`). → **per un object node
content-hug mai ridimensionato `raw.w/raw.h` sono `undefined`/assenti** (non 0, non un default migrato).
Diventano numeri **solo** dopo un resize esplicito (`syncSizeToJjom`, `canvasToJjom.ts:72-78`).

### QB2 — Size renderizzata vs geometria (il cuore di B)

**Da dove nasce il pixel dell'ancora**: da React Flow. L'edge è reso da **`UnifiedEdge`** (unico
componente edge; le transizioni M1 `DObject→DObject` sono `composition`/`instanceRef`, tutte
`UnifiedEdge`). Gli estremi `sourceX/sourceY/targetX/targetY` arrivano da `EdgeProps` di RF
(`UnifiedEdge.tsx:62-76`), che RF calcola dalle **posizioni DOM misurate degli handle**; il path è un
Manhattan da quegli estremi (`:164-167`). **Nessun `getBoundingClientRect`/`raw.w-h`/`computeOptimalHandles`
nel path dei pixel** (l'IR gating di UnifiedEdge è solo-stile: stroke/dash/terminazioni).

**Dove sono posizionati gli handle** (ciò che RF misura): `DynamicHandles.tsx` calcola le posizioni
dal **bounding box del `.mm-node`** (`:127-131`):
```tsx
const rect = nodeEl.getBoundingClientRect();
const w = rect.width; const h = rect.height;
```
(il centroid map per l'ordinamento usa `n.measured?.width ?? 180` / `?? 80`, `:106-107`.)

**Box model `.mm-node` → `.ir-node-content`**:
- Bordo **visibile** = `.ir-node-content` (`irStyle.ts:44`: `box-sizing:border-box; border:1px solid;
  border-radius:4px; box-shadow: …`), reso `width:100%; height:100%` di `.mm-node` (`irStyle.ts:18`).
- `.mm-node` per gli IR node ha il **bordo reso trasparente ma mantenuto 1px** ("keeps the 1px
  geometry, avoids layout shift", `irStyle.ts:41`) e il **floor `min-width:140px; min-height:40px`**
  (`EditorV2.scss:1208-1213`); selezione = `outline` con `outline-offset:1px` (`irStyle.ts:81`).

**Meccanismo del gap (RCA B, condizionata a conferma DOM)**: per un object node **content-hug** il
`.mm-node` ha **altezza indefinita** (auto) con `min-height:40px`. `.ir-node-content { height:100% }`
**non si risolve** contro un'altezza indefinita → `.ir-node-content` va in content-hug (es. ~24px per
la pill), mentre `.mm-node` è **floorato a 40px**. Gli handle stanno sul bounding box del `.mm-node`
(40px), il bordo visibile della pill è più piccolo (~24px, in alto per il flex-column) → **gap tra
terminazione edge e bordo visibile** (+ l'offset dell'`outline`/`box-shadow` accentua l'aspetto
"doppio bordo"). In larghezza il `width:100%` si risolve (la width è definita post-layout), quindi il
gap è prevalentemente **verticale**. → **l'ipotesi RCA B ("divergenza pixel da `raw.w/h`") è smentita**:
i pixel vengono dal DOM misurato; il gap è **box-model** (`.mm-node` floored/indefinito vs
`.ir-node-content` content-hug), stessa radice di A.
*Nota §5.1 CLAUDE.md*: quantificare il gap richiede una conferma sul DOM live (`getBoundingClientRect`
di `.mm-node` vs `.ir-node-content`) — il valore ±px non è confermabile dalla sola cascata.

### QB3 — Pista alternativa (WIP/rendering) ESCLUSA

`git status` + diff `EditorV2.tsx` (agente): il diff è **97 delete / 0 insert**, interamente
debug-cleanup (`[BUG-DIAG-DROP]`) + rimozione lane-separation; **nessun cambio di logica edge/anchor**;
la pipeline `computePortDistribution`/`edgeHandles` è intatta; `PROPAGATE_VIEW_SIZE` è **committato**
(`ade4e50bf`). `git stash list`: un WIP edge-label abbandonato è in `stash@{0}` (non nel tree). →
**pista rendering/refactor esclusa**: B è un gap geometrico/box-model, non una regressione di rendering.

### QB4 — B è specifica del content-hug? SÌ

Resize manuale / propagazione scrivono `DVertex.w/h` (`syncSizeToJjom`, `canvasToJjom.ts:72-78`) **e**
settano `width/height` top-level sul nodo RF (in-sessione, `EditorV2.tsx:993-995`) → `.mm-node` ha una
**dimensione definita** → `.ir-node-content { height:100% }` la riempie → box e handle **coincidono**
→ gap chiuso. Su un content-hug **mai** ridimensionato `.mm-node` resta floored/indefinito → gap.
**Confermato dal codice.** (Nota: `raw.w/h` allineati o meno sono irrilevanti per i pixel — ciò che
conta è che `.mm-node` acquisti una dimensione definita che `.ir-node-content` possa riempire.)

---

## Gruppo C — Convergenza, critical-zone, content-hug

### QC1 — Riconciliazione unica? Cosa risolve ciascuna opzione

| Opzione | Cosa fa | Risolve A? | Risolve B? | Costo / note |
|---|---|---|---|---|
| **(R) read-back** — `objectVertexToRFNode` emette `style.width/height` da `raw.w/raw.h` | porta la size persistita nel nodo RF | **No** da sola (content-hug mai resized → `raw.w/h` undefined → niente da emettere) | **No** da sola (idem; e i pixel vengono dal DOM, non dallo style) | **Sveglia la critical zone** (QC2). Utile solo a far sopravvivere una size **già** persistita al reload. |
| **(M) geometria su size misurata** — `computeOptimalHandles`/`jjomEdgeToRFEdge` usano la measured invece di `raw.w/h` | corregge la **scelta del lato** | No | **Solo il lato**, non il gap px (i pixel già vengono dal DOM) | Basso, **fuori critical zone** (edge transformer). Ma NON chiude il gap box-model di B. |
| **(S) size autorevole in `view.ir` / seed esplicito** — una size (da measured al seed, o `size?:{w,h}`) applicata come **inline-style su `.mm-node`** (render-side) | dà al `.mm-node` una **dimensione definita** | **Sì** (niente collapse, QA4) | **Sì** (`.ir-node-content` riempie → handle allineati, QB2/QB4) | Schema/render. **Render-side inline-style bypassa il transformer → NON tocca la critical zone.** |

**Insight**: A e B sono lo **stesso** problema (nessuna size definita sul box che RF misura). L'opzione
che li chiude entrambi è **(S)/seed esplicito render-side**. L'opzione (R) è la **sola** che sveglia la
critical zone e da sola non risolve nessuna delle due per il content-hug. L'opzione (M) è cheap e
sicura ma corregge solo il lato (utile come complemento, non come fix di B).

### QC2 — Verdetto critical-zone + LIR

Gate `sizeChanged` (`useJjomSync.ts:1356-1377`): confronta `rfNode.style.width/height` vs cache;
se cambia → `patchedNodeStyles.set` → `hasNodeChanges` (`:1423-1424`) → `scheduleFlush()` (`:1466`).
**Dormiente per gli object node** perché `objectVertexToRFNode` non emette `style` (solo
`packageVertexToRFNode` lo fa). `portDistribution.ts` **non ha input di size** (solo posizioni/lato/indice,
`NodePosition {centerX,centerY}` `:28-31`).

- **(R) read-back → SVEGLIA la critical zone** (`newW` non più undefined → il gate scatta a ogni cambio
  `raw.w/h` JjOM → nuovo flusso di re-style/flush; l'anti-bounce 300ms copre solo i write canvas-origin,
  non i cambi JjOM-origin). → **Fase 2 con (R) richiede Layer Impact Report.**
- **(M) → NON tocca la critical zone** (resta nell'edge transformer `jjomEdgeToRFEdge:385-390`; gate e
  portDistribution invariati). → **niente LIR.**
- **(S) render-side inline-style → NON tocca la critical zone** (non passa dal transformer/gate; niente
  `style` RF sul nodo). → **niente LIR.** *(Se invece (S) fosse implementata emettendo `style` dal
  transformer, ricadrebbe in (R) → LIR.)*

### QC3 — Preservazione del content-hug

`nodes/nodeSizing.ts`: `NODE_SIZING_DEFAULTS.objectNode = {adaptWidth:true, adaptHeight:true}`,
`isNodeResizable(type, hasGeometricShape)`, `SHAPE_MIN_SIZE=24`, `defaultResizableForForm`. Una
`width/height` **esplicita** sul nodo RF disattiva di fatto l'adapt per **quel** nodo (RF usa la dim
esplicita); i box **senza** size esplicita restano content-hug. → seminare la size **solo** sui nodi
IR resizable/locked (o via inline-style condizionato a `canResize`/`ir.size`) **preserva** il
content-hug dei class-diagram a compartimenti e degli altri object node auto-misurati. Nessuna
regressione se il seed è **condizionato**, non globale.

---

## RCA — sintesi

- **Anomalia A**: **CONFERMATA**. Neutralizer `ir-resizable` (100% + min:0) su un `.mm-node` senza
  dimensione definita → collapse a min-content. Fix = dare una size definita al box (seed).
- **Anomalia B**: ipotesi originale (**divergenza pixel da `raw.w/h`**) **SMENTITA**. I pixel
  dell'ancora vengono dal DOM misurato (`.mm-node` `getBoundingClientRect`). Causa reale
  (condizionata a conferma DOM): **box-model** — `.mm-node` floored/indefinito vs `.ir-node-content`
  content-hug (`height:100%` non risolve) → handle sul box grande, bordo visibile più piccolo. Stessa
  radice di A. Un uso secondario di `raw.w/h` (180/80) resta nella **scelta del lato** e può sbagliare
  lato per i content-hug.

## Raccomandazione: fetta unica vs fette separate

**Fetta unica render-side** raccomandata: dare all'object node IR **una size definita sul `.mm-node`**
(seed = size measured al toggle `resizable`, e/o `view.ir.size` per il default-lock), applicata
**render-side** (inline-style su `.mm-node`, condizionata). Chiude **A e B insieme**, **fuori critical
zone**, preserva il content-hug (QC3). L'opzione (M) resta un complemento cheap per la scelta-lato; la
(R) va evitata a meno che l'obiettivo sia solo la sopravvivenza-al-reload di size già persistite (e in
quel caso serve LIR).

## File che la Fase 2 dovrà (probabilmente) toccare — proposta

| File | Ruolo | Critical zone |
|---|---|---|
| `nodes/ObjectNode.tsx` | leggere measured/`ir.size` e applicare inline-style/size al `.mm-node` (seed) | no |
| `viewpoint/ir/irStyle.ts` | eventuale marker `ir-sized` / aggiustare il neutralizer | no |
| `viewpoint/ir/irTypes.ts` | (se opzione S) campo `size?:{w,h}` su `VertexViewIR` | no |
| `viewpoint/authoring/VertexAuthoringPanel.tsx` | (se seed imperativo) wiring del toggle → dispatch size | no |
| `EditorV2.tsx` | (se seed imperativo) listener che semina la measured come la propagazione | no |
| `utils/jjomTransformers.ts` | (opzione M) `computeOptimalHandles`/`jjomEdgeToRFEdge` su measured | no |
| `utils/jjomTransformers.ts` | (opzione R) `objectVertexToRFNode` emette `style.w/h` | **SÌ (sveglia `useJjomSync`)** |
| `hooks/useJjomSync.ts` | **solo se opzione R** — impatto sul gate `sizeChanged` | **CRITICAL — LIR** |

## Domande aperte per Alfonso (decisione a valle)

1. **Seed di A**: render-side (inline-style alla measured, zero stato) o imperativo al toggle (setNodes
   come la propagazione)? La size iniziale è **per-istanza** o diventa il **default di view** (`view.ir.size`)?
2. **Fix di B**: fetta unica (S/seed → `.mm-node` size definita, chiude A+B) oppure due fette (M per il
   lato + seed per il collapse)? Nota: (M) da sola **non** chiude il gap px di B.
3. **Marker**: serve `ir-sized` distinto, o basta l'inline-style px (che vince già sul neutralizer)?
4. **Conferma DOM di B**: vuoi una micro-verifica sul DOM live (`.mm-node` vs `.ir-node-content`
   getBoundingClientRect su una pill State) prima della Fase 2, per quantificare il gap e blindare la RCA?

## Rischi

- **Critical zone (R)**: risvegliare il gate `sizeChanged` cambia il comportamento del read-path per
  **tutti** gli object node (non solo IR) → regressioni di sync/flush; LIR obbligatorio.
- **Content-hug (QC3)**: un seed **non condizionato** romperebbe il content-hug dei class diagram →
  seminare solo su nodi IR resizable/locked.
- **RCA B non ancora quantificata sul DOM**: la causa box-model è la più coerente col codice ma il ±px
  va confermato sul render live (§5.1) prima di dimensionare il fix.

---

## Hard stop

Report scritto. **STOP.** Nessun edit al codice, nessun commit, nessun `git add`, nessun tocco al WIP.
L'analisi prosegue in chat da questo documento.
