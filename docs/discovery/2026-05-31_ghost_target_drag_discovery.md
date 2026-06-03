# Discovery (READ-ONLY) — Ghost-target stub: stato attuale del rendering

**Documento prompt**: 2026-05-31 11:30
**Tipo**: discovery (sola lettura)
**Branch**: `alfonso-frontend-jjtl`
**Data esecuzione**: 2026-05-31
**Obiettivo a valle (NON in scope qui)**: valutare se rendere lo stub trascinabile trasformandolo
da overlay in-node a synthetic ReactFlow node (`ghost:${refId}`, `draggable`, senza DVertex).

Questo documento riporta **solo fatti osservati** con riferimenti `file:riga`. Nessun fix proposto,
nessuna architettura, nessuna modifica al codice.

---

## Premessa corretta (§5.1 — "non fidarti di fixture da memoria")

Il prompt (§1) ipotizza che la feature ghost-stub possa essere **non committata** sul branch.
**Falso sul working tree corrente**: l'albero è pulito e la feature è interamente committata.

- `git status` → `nothing to commit, working tree clean` (branch `alfonso-frontend-jjtl`, allineato a origin).
- Commit rilevanti (`git log --oneline`):
  - `2a540a92d feat(editor-v2): ghost-parent stub for cross-metamodel extends` → ghost **parent**.
  - `0048662cb cross metamodel extension and reference` → ghost **target** + soppressione cross-MM
    + regole SCSS `.ghost-target-stub` (`git log -S "ghost-target-stub"` → `0048662cb`).
  - `3550d7e3b`, `b07e9b03d` → fix/discovery cross-MM retarget collaterali.

Nessuna parte della feature vive solo nel working tree: **tutto è già in HEAD**.

---

## 1. Stato git della feature

Working tree pulito (vedi sopra). Tutti i file coinvolti sono committati a HEAD:

| File | Ruolo nella feature | Ultimo commit toccante |
|------|--------------------|------------------------|
| `frontend/src/components/editor-v2/types.ts` | tipi `GhostParentInfo`/`GhostTargetInfo` | `0048662cb` |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | calcolo `ghostTargets`/`ghostParents` + soppressione edge cross-MM | `0048662cb` / `9b5fe0b89` |
| `frontend/src/components/editor-v2/nodes/ClassNode.tsx` | rendering DOM dello stub | `0048662cb` |
| `frontend/src/components/editor-v2/EditorV2.scss` | classi `.ghost-target-stub` / `.ghost-parent-stub` | `0048662cb` |
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | cleanup DVoidEdge cross-MM (NON crea ghost) | `3550d7e3b` |
| `frontend/src/components/editor-v2/utils/refEdgeReconcile.ts` | classificazione edge cross-MM = overlay | committato |

Nessuna parte da ricostruire dal locale.

---

## 2. Rendering dello stub

### 2.1 Dove e con quale markup

Lo stub è **figlio DOM diretto del `ClassNode`** (overlay in-node), reso prima dell'header del nodo.

- Lettura della prop: `ClassNode.tsx:34` — `const ghostTargets = data.ghostTargets ?? [];`
- Markup: `ClassNode.tsx:290-308`. Struttura:
  ```
  <div className="ghost-target-stub">                       // 291: contenitore, uno per nodo
    {ghostTargets.map((gt, i) => (                          // 292: una riga per ogni ref cross-MM
      <div className="ghost-target-stub__item">             // 293
        <span className="ghost-target-stub__label">…</span> // 294: "refName cardinality"
        <div className="ghost-target-stub__arc">            // 295: wrapper connettore
          <svg className="ghost-target-stub__connector">…   // 296-299: linea + freccia statiche
        </div>
        <div className="ghost-target-stub__chip">           // 301: chip tratteggiato
          <span className="…__name">{gt.targetName}</span>  // 302
          <span className="…__mm">{gt.targetMetamodel}</span>// 303
        </div>
      </div>
    ))}
  </div>
  ```

Il blocco è interno al markup del componente `ClassNode`, **non** in un overlay separato e **non**
in un layer ReactFlow dedicato. Il render è condizionato a `ghostTargets.length > 0` (`ClassNode.tsx:290`).

### 2.2 Classi CSS rilevanti

Regole in `EditorV2.scss:1398-1466` (`.ghost-target-stub` e figli BEM):

- `.ghost-target-stub` (`:1398-1408`): `position: absolute; top: 0; left: 100%;` → **ancorato al
  bordo destro del nodo, cresce verso destra**. `flex-direction: column; gap: 12px;` → stub multipli
  impilati verticalmente. `z-index: 4` (sopra il corpo nodo). `pointer-events: none` (non blocca gli
  handle a destra).
- `.ghost-target-stub__item` (`:1412-1417`): `position: relative; flex-direction: row;` →
  contesto di posizionamento per la label assoluta; allinea connettore + chip in orizzontale.
- `.ghost-target-stub__arc` (`:1421-1424`): wrapper flush al bordo nodo.
- `.ghost-target-stub__label` (`:1426-1437`): `position: absolute; bottom: 100%;` → label sopra la riga.
- `.ghost-target-stub__connector` (`:1439-1443`): `width: 24px; height: 12px;` → **dimensione fissa**.
- `.ghost-target-stub__chip` (`:1445-1455`): `border: 1px dashed var(--color-canvas-accent)` →
  il chip tratteggiato cyan. `pointer-events: auto` (target del tooltip).
- `.ghost-target-stub__name` (`:1457-1460`): colore `var(--color-accent)`.

### 2.3 Come viene calcolato l'elenco dei ghost target

Calcolato a **transform-time** (non a render-time), dentro `classVertexToRFNode` in
`jjomTransformers.ts:126-142`:

```typescript
const ghostTargets: GhostTargetInfo[] = [];          // :126
for (const ref of (lClass?.references ?? [])) {       // :128  itera le reference via L-proxy
    const t = ref?.type;                              // :129  type risolto via L-proxy (get_type)
    if (t?.model && t.model.id !== lClass.model.id) { // :130  DISCRIMINATORE cross-MM
        const lower = ref.lowerBound ?? 0;            // :131
        const upper = ref.upperBound ?? -1;           // :132
        ghostTargets.push({ refName, targetName, targetMetamodel, cardinality, targetFullname });
    }
}
```

- Sorgente dati: `lClass.references` (collezione L-proxy) → `ref.type` (L-proxy `get_type`).
- Discriminatore cross-MM: `ref.type.model.id !== lClass.model.id` (`:130`) — **L-proxy, NON campo
  raw `DReference.type`**. Coincide con il discriminatore usato altrove (vedi §6).
- L'array è allegato al node data solo se non vuoto: `jjomTransformers.ts:166`
  (`ghostTargets: ghostTargets.length > 0 ? ghostTargets : undefined`).
- Wrappato in `try/catch` (`:127`, `:142`) perché l'accesso ai proxy può lanciare su dati stale.

Quindi: il calcolo avviene **ogni volta che il vertice viene ri-trasformato** (init transform e
incremental sync, vedi §5), a partire dallo stato JjOM corrente. È stateless e derivato.

### 2.4 Shape completa di `GhostTargetInfo`

`types.ts:71-78`:

```typescript
export interface GhostTargetInfo {
    refName: string;         // nome della EReference cross-MM
    targetName: string;      // nome della classe target (in altro metamodello)
    targetMetamodel: string; // nome del metamodello del target
    cardinality: string;     // es. "0..1", "0..*"  (pre-formattata in :137)
    targetFullname: string;  // fullname per il tooltip (title del chip)
}
```

Per confronto, `GhostParentInfo` (`types.ts:64-69`): `{ id, name, metamodelName, fullname }`.
Nota: `GhostParentInfo` **ha** un `id` (l'id della classe parent); `GhostTargetInfo` **non** porta
alcun id (né del target, né della reference — solo nomi/cardinalità/fullname).

### 2.5 Lo stub possiede dati di posizione?

**No.** Confermato:
- `GhostTargetInfo` (`types.ts:72-78`) non ha campi `x`/`y`/`offset`/`position`/`side`.
- Il markup (`ClassNode.tsx:290-308`) non legge né scrive coordinate; la posizione è puramente
  CSS-driven (`left: 100%`, stacking via flex `gap: 12px`, `EditorV2.scss:1398-1405`).
- Nessun dato di posizione persistito da nessuna parte per lo stub.

---

## 3. Connettore cyan

### 3.1 Cosa è (e cosa non è)

Il "connettore" è un **SVG statico inline nel DOM del `ClassNode`**, non un RF edge e non un SVG
dell'overlay ReactFlow.

`ClassNode.tsx:296-299`:
```jsx
<svg className="ghost-target-stub__connector" viewBox="0 0 24 12" aria-hidden="true">
  <line x1="0" y1="6" x2="23" y2="6" stroke="var(--color-canvas-accent)" strokeWidth="1.2" />
  <polyline points="17,2 23,6 17,10" fill="none" stroke="var(--color-canvas-accent)" … />
</svg>
```

È una linea orizzontale + una punta di freccia, in un viewBox `24×12`, reso a dimensione CSS fissa
`24×12 px` (`EditorV2.scss:1439-1443`).

### 3.2 Da dove prende start/end

**Non collega la classe sorgente a un nodo target separato.** Collega visivamente:
- **start**: il bordo destro del nodo sorgente (il contenitore `.ghost-target-stub` è ancorato a
  `left: 100%` del nodo, `EditorV2.scss:1401`; il connettore è il primo elemento flush via
  `.ghost-target-stub__arc`, `:1421`).
- **end**: il chip tratteggiato (`.ghost-target-stub__chip`), che segue nel flusso flex-row dell'item.

Non ci sono handle, né riferimenti a coordinate del target (il target è off-canvas, in un altro
metamodello, e non ha vertice/nodo RF). Lo "spazio" tra start ed end è semplicemente la larghezza
fissa di 24px del connettore SVG.

### 3.3 Esiste routing/aggancio?

**No.** Il connettore è completamente statico: linea fissa di 24px in DOM, nessun calcolo di routing,
nessun aggancio a handle, nessuna reattività alla posizione di altri nodi. È decorativo.

---

## 4. Registrazione `nodeTypes` / `edgeTypes` (fattibilità ghost-node)

`EditorV2.tsx:94-111`. Entrambe sono **costanti module-level** (fuori dal componente):

```typescript
const nodeTypes: NodeTypes = {            // :94
    classNode: ClassNode,                 // :95
    enumNode: EnumNode,                   // :96
    packageNode: PackageNode,             // :97
    objectNode: ObjectNode,               // :98   (M1: instance of a metaclass)
};

const edgeTypes: EdgeTypes = {            // :106
    reference: UnifiedEdge,               // :107
    inheritance: UnifiedEdge,             // :108
    composition: UnifiedEdge,             // :109  (M1: containment)
    instanceRef: UnifiedEdge,             // :110  (M1: non-containment)
};
```

Passati a `<ReactFlow>` a `EditorV2.tsx:3147-3148` (`nodeTypes={nodeTypes}` / `edgeTypes={edgeTypes}`).
Conferma: **tutti gli `edgeTypes` mappano a `UnifiedEdge`** (l'unico edge component).

**Fattibilità (osservazione strutturale, non proposta)**: la struttura è una mappa-oggetto aperta.
Aggiungere una chiave (es. `ghost: GhostNode` in `nodeTypes`, `ghost-edge: …` in `edgeTypes`) è
additivo e non tocca le entry esistenti. Le costanti sono module-level e stabili, quindi non
ricreate a ogni render (requisito ReactFlow per evitare re-mount degli edge/node component).

---

## 5. Costruzione dell'array `nodes` / `edges` di RF

### 5.1 Dove vengono assemblati

Stato RF detenuto in `EditorV2.tsx:267-269`:
```typescript
const [nodes, setNodes, onNodesChange] = useNodesState(modelid ? [] : initialNodes);  // :267
const [edges, setEdgesRaw, …] = useEdgesState(modelid ? [] : initialEdges);           // :269
```

In modalità JjOM (`modelid` presente) gli array partono vuoti e vengono popolati da
**`useJjomSync`**, che riceve `setNodes`/`setEdges` dal parent (`EditorV2.tsx:334`).

Pipeline di popolamento (init transform), `useJjomSync.ts:1064-1094`:
```typescript
const vertices: any[] = lGraph.nodes ?? [];        // :1064  sorgente = DGraph.nodes (DVertex)
for (const v of vertices) {                        // :1070
    const rfNode = jjomVertexToRFNode(v);          // :1072  un RF node per DVertex
    …
}
setNodes(rfNodesToSet);                            // :1094
```

Gli edge passano per `transformJjomGraph` / `jjomEdgeToRFEdge` (`jjomTransformers.ts:573-590`,
`:585`). Prima del mount, gli array passano per memoizzazione di stabilità: `stableNodes`/
`stableEdges` (`EditorV2.tsx:1068-1108`, `nodes={stableNodes}`/`edges={stableEdges}` a `:3130-3131`).

### 5.2 È possibile iniettare nodi sintetici non-DVertex?

**Fatto attuale**: oggi **ogni** RF node deriva 1:1 da un DVertex. `jjomVertexToRFNode` è l'unico
costruttore di node nel path JjOM (`useJjomSync.ts:1072`, `:1146`), e prende sempre un vertice
(`lGraph.nodes`, `subElements`). Non esiste nel path JjOM un precedente di RF node **non** backed
da DVertex.

**Quasi-precedente (non identico)**: nodi creati via palette/drop ricevono un `id` e vengono inseriti
in `setNodes` prima che il DVertex esista (`EditorV2.tsx:1653`, `:1722`), ma sono transitori — il
sync poi crea il DVertex corrispondente (Step 2, `useJjomSync.ts:638`) e li riconcilia per id. Quindi
non sono "synthetic permanenti senza dominio": convergono a un DVertex.

**Edge non-dominio**: gli edge ghost (cross-MM) **non** producono alcun RF edge — sono soppressi
(vedi §6). Non c'è oggi un RF edge che non corrisponda a un DVoidEdge persistito.

### 5.3 Reazione a un nodo con `position` ricalcolata a ogni transform

Osservazione: il merge di stabilità `stableNodes` (`EditorV2.tsx:1068-1090`) confronta gli array e,
se cambiano lunghezza o contenuto, sostituisce il riferimento. Le posizioni dei DVertex sono lette da
`__raw.x/__raw.y` a transform-time (`jjomTransformers.ts:146-148`) e scritte da drag via
`SetFieldAction` su `x`/`y` (`canvasToJjom.ts:45-46`). Un nodo la cui `position` viene **derivata e
ricalcolata** a ogni transform (anziché letta da DVertex) sarebbe ricostruito ad ogni `setNodes`
dell'incremental sync; il dedup di `stableNodes` confronta per contenuto (`:1075-1085`), quindi una
position che cambia ad ogni ciclo forzerebbe un nuovo riferimento ogni volta. Questo è un **fatto del
meccanismo di stabilità**, segnalato come dato (non come problema da risolvere qui).

---

## 6. Interazione con soppressione cross-MM e reconcile DVoidEdge

### 6.1 Comportamento di `jjomEdgeToRFEdge` per edge cross-MM

`jjomTransformers.ts:481-496`. Nel ramo M2 (`edge.isReference`):
```typescript
const refTypeModelId = refModel?.type?.model?.id;     // :491  type via L-proxy
const srcModelId = sourceModel?.model?.id;            // :492
if (refTypeModelId && srcModelId && refTypeModelId !== srcModelId) {
    return null;                                       // :494  SOPPRESSO → nessun RF edge
}
```

**Confermato `return null` per edge cross-MM**. Il commento (`:485-489`) esplicita: il target vive in
un altro metamodello (off-canvas) ed è mostrato come stub `ghostTargets` in-node, mai come edge. La
decisione usa `refModel.type.model.id` (CURRENT, via L-proxy), **NON** `edge.end` (cachato/stale).

### 6.2 Lo stub NON genera DVoidEdge e NON è toccato dal reconcile

Confermato per lettura:
- **Il ghost stub non crea alcun DVoidEdge**: il calcolo `ghostTargets` (`jjomTransformers.ts:126-142`)
  è puramente derivato e produce node-data, mai una scrittura D-layer. `grep "ghost" useJjomSync.ts`
  trova solo commenti che spiegano che il target cross-MM **non** produce edge (`useJjomSync.ts:533`,
  `:752`), mai una `DVoidEdge.new2` per un ghost.
- **Cleanup, non creazione**: la macchina di reconcile in `useJjomSync.ts` interagisce col cross-MM
  solo per **cancellare** un DVoidEdge stale lasciato da un retarget (es. self-loop residuo), non per
  crearlo. Punti esatti:
  - `useJjomSync.ts:764-766` — discriminatore:
    ```typescript
    const srcModelId = (LPointerTargetable.fromPointer(entry.id) as any)?.model?.id;
    const tgtModelId = (LPointerTargetable.fromPointer(refId) as any)?.type?.model?.id;
    const targetCrossMM = !!(srcModelId && tgtModelId && srcModelId !== tgtModelId);
    ```
    → **`ref.type.model.id !== source.model.id` via L-proxy** (coincide con `jjomTransformers.ts:130`
    e `:491`), come atteso dal prompt.
  - Se cross-MM: `classifyRefEdgeReconcile(staleEdges, null, { targetCrossMM: true })`
    (`useJjomSync.ts:769`) → `delete-all` → `DeleteElementAction` in TRANSACTION (`:779-784`) +
    rimozione RF edge dalla cache/canvas (`:791-793`), poi `continue` (`:795`, "cross-MM = overlay,
    never an edge").
  - Anche in Step pre-conteggio: `useJjomSync.ts:552-556` incrementa `staleCrossMMEdgeCount`
    (stesso discriminatore L-proxy) per non saltare lo Step 3.
- **`refEdgeReconcile.ts`** documenta la stessa invariante: target cross-MM = overlay `ghostTargets`,
  ogni edge persistito è stale (`refEdgeReconcile.ts:104-107`, `:173`, `:192`).

### 6.3 Punti di possibile collisione con un ghost RF node/edge view-side

Segnalazione (solo dato, non valutazione architetturale):
- La soppressione a `jjomEdgeToRFEdge:494` agisce **prima** di costruire l'edge: un eventuale ghost
  RF edge view-side dovrebbe nascere **fuori** da `jjomEdgeToRFEdge` (che oggi ritorna `null` proprio
  per quegli edge), altrimenti verrebbe soppresso allo stesso punto.
- Il cleanup `useJjomSync.ts:767-795` **cancella attivamente** qualunque DVoidEdge cross-MM persistito
  e rimuove l'RF edge corrispondente da `setEdges`/`rfEdgeCache`. Un ghost RF edge che condividesse
  l'`id` di un DVoidEdge cross-MM ricadrebbe in questa rimozione. Un id puramente view-side
  (es. `ghost:${refId}`, non presente in `idlookup`) non sarebbe intercettato da
  `DeleteElementAction.new(idlookup[staleId])` (`:781-782`) perché quel path opera solo su edge
  presenti in `existingRefEdgesByRefId` / `idlookup`.
- L'incremental sync ricostruisce `nodes` da `lGraph.nodes` (`useJjomSync.ts:1064`): un node sintetico
  non-DVertex **non** sarebbe rigenerato da quel loop e andrebbe iniettato da un altro path (e
  preservato dal dedup `stableNodes`). Dato di meccanismo, non una raccomandazione.

---

## 7. Pattern di persistenza per-view

### 7.1 Cosa è persistito oggi

- **Posizione per-vertex**: l'unica posizione persistita è `DVertex.x` / `DVertex.y`, scritta da
  `canvasToJjom.ts:45-46` (`SetFieldAction.new(vertexId, 'x'|'y', …)`) e ri-letta a transform-time da
  `__raw.x/__raw.y` (`jjomTransformers.ts:146-148`). È **D-layer**, per vertice, non "per-view".
- **Anchor degli edge (`AnchorConfig = {mode, side}`)**: definito in `types.ts:129-132`, presente sui
  data degli edge (`types.ts:138-139`, `:150-151`, `:184-185`, `:193-194`). **NON è persistito nel
  D-layer**: `grep` su `canvasToJjom.ts` per `Anchor`/`sourceAnchor`/`targetAnchor` → **0 occorrenze
  di scrittura**. Il pin manuale (`EndpointHandles.tsx:148-157`) scrive solo via
  `editorCtx.onEdgeDataChange` → `handleEdgeChange` (`EditorV2.tsx:2731-2740`), che fa **solo**
  `takeSnapshot()` (undo) + `setEdges` + `applyDistribution` → **stato RF, non Redux**. Sopravvive
  in-sessione via il merge `useJjomSync.ts:1363-1367` (`mergedData.sourceAnchor = existingData…`),
  **non** attraverso save/reopen.
- **Nessun store per-reference o per-view** per offset/flag custom: non esiste oggi uno slot
  persistente associato a una singola reference (M2) lato view. La feature ghost è **interamente
  derivata** e non ha persistenza.

Conseguenza per l'obiettivo a valle (solo constatazione): per persistere un offset per-`refId` di uno
stub trascinabile non esiste oggi un contenitore pronto. Le opzioni-pattern esistenti sono:
(a) D-layer su un DVertex (ma il ghost per definizione **non** ha DVertex);
(b) edge data RF (ma non sopravvive a reload, come `AnchorConfig`);
(c) `jsxString` della view via VersionFixer (vedi §7.2).
La scelta è materia del prompt di implementazione, non di questa discovery.

### 7.2 VersionFixer — versione corrente e pattern

- Versione massima corrente: migration `'2.217 -> 2.218'` (`VersionFixer.tsx:804`) — è l'ultima
  definita; `highestVersion` è derivato automaticamente dai nomi-metodo (CLAUDE.md §3.9).
- Metodi recenti: `'2.213 -> 2.214'` (`:669`), `'2.214 -> 2.215'` (`:695`), `'2.215 -> 2.216'`
  (`:715`), `'2.216 -> 2.217'` (`:769`), `'2.217 -> 2.218'` (`:804`).
- Pattern di registrazione: metodo privato con chiave stringa `'<da> -> <a>'` su `DState→DState`
  (CLAUDE.md §3.9). Le migration jsxString iterano i `DViewElement` e riscrivono `e.jsxString` per le
  view che matchano un detect marker (`defaultViewTemplate.ts`).

**Vincolo CLAUDE.md §3.9 rilevante a valle**: se l'implementazione toccasse i file default-view
(`DV.tsx`, `defaultViewTemplate.ts`) per appoggiare l'offset, servirebbe una migration. Se invece
l'offset vivesse su DVertex (D-layer) o solo in edge-data RF, la regola jsxString non si applica.
Segnalato come dato, non come scelta.

---

## 8. Multipli stub e ghostParents

### 8.1 Disposizione di più ghost-target stub sulla stessa classe

Stacking **verticale** lungo il bordo destro del nodo:
- Contenitore unico `.ghost-target-stub` con `flex-direction: column; gap: 12px`
  (`EditorV2.scss:1402-1405`), ancorato a `top: 0; left: 100%` (`:1400-1401`).
- Un `.ghost-target-stub__item` per ogni reference cross-MM, generati da `ghostTargets.map`
  (`ClassNode.tsx:292`). `padding-top: 8px` (`EditorV2.scss:1406`) offset del primo sotto il bordo
  superiore.
- Ordine = ordine di iterazione di `lClass.references` (`jjomTransformers.ts:128`). Nessun riordino,
  nessun anti-overlap rispetto ad **altri** nodi o ad altri overlay: lo stacking è puramente locale
  al singolo nodo. Stub di nodi diversi possono sovrapporsi nel canvas (nessun layout globale).

### 8.2 Rendering dei `ghostParents`

`ClassNode.tsx:32`, `:269-284`:
```typescript
const ghost = data.ghostParents?.[0];   // :32  SOLO il primo parent
…
{ghost && ( <div className="ghost-parent-stub" …> … </div> )}   // :269-284
```

**Asimmetria notevole** (dato di fatto):
- `ghostParents`: viene reso **solo il primo** (`data.ghostParents?.[0]`, `ClassNode.tsx:32`). Eventuali
  parent cross-MM successivi nell'array **non** sono mostrati.
- `ghostTargets`: vengono resi **tutti** (`.map`, `ClassNode.tsx:292`).

Layout del ghost-parent (`EditorV2.scss:1357-1394`): `.ghost-parent-stub` con `position: absolute;
bottom: 100%; left: 50%; transform: translateX(-50%)` → **ancorato al bordo superiore del nodo,
centrato, cresce verso l'alto**. Connettore SVG = triangolo di generalizzazione UML + linea
(`ClassNode.tsx:279-282`, viewBox `12×18`), anch'esso **statico** in DOM. Chip tratteggiato analogo
(`.ghost-parent-stub__chip`, `EditorV2.scss:1368-1377`).

Conseguenza per coerenza (constatazione): target e parent condividono la stessa famiglia
(overlay in-node, SVG statico, chip tratteggiato, nessun dato di posizione). Un eventuale rifacimento
del target come synthetic node lascerebbe il parent sull'attuale modello overlay, salvo intervento
parallelo; e dovrebbe gestire l'asimmetria "1 parent vs N target" (`ClassNode.tsx:32` vs `:292`).

---

## Sintesi fattuale (per il prompt di implementazione a valle)

| Aspetto | Stato osservato | Riferimento |
|---------|-----------------|-------------|
| Natura dello stub | Overlay DOM figlio di `ClassNode` | `ClassNode.tsx:290-308` |
| Sorgente dati | `ghostTargets` calcolato a transform-time da `lClass.references` via L-proxy `ref.type` | `jjomTransformers.ts:126-142` |
| Discriminatore cross-MM | `ref.type.model.id !== lClass.model.id` (L-proxy, non raw) | `jjomTransformers.ts:130`, `:491`, `useJjomSync.ts:764-766` |
| Posizione dello stub | Nessuna; solo CSS (`left:100%`, flex gap) | `types.ts:72-78`, `EditorV2.scss:1398-1408` |
| Connettore cyan | SVG statico in DOM, 24px fissi, niente routing/handle | `ClassNode.tsx:296-299`, `EditorV2.scss:1439-1443` |
| Edge cross-MM | Soppresso (`return null`) | `jjomTransformers.ts:494` |
| DVoidEdge per ghost | Mai creato; reconcile lo cancella se residuo | `useJjomSync.ts:767-795`, `refEdgeReconcile.ts:104-107` |
| nodeTypes/edgeTypes | Mappa module-level aperta; tutti gli edge → `UnifiedEdge` | `EditorV2.tsx:94-111` |
| Array nodes | 1:1 da DVertex (`lGraph.nodes`), nessun synthetic permanente | `useJjomSync.ts:1064-1094` |
| Persistenza posizione | Solo DVertex.x/y (D-layer); AnchorConfig NON persistito | `canvasToJjom.ts:45-46`; nessuna scrittura anchor |
| VersionFixer | ultima `'2.217 -> 2.218'` | `VersionFixer.tsx:804` |
| ghostParents | Solo il primo `[0]`; ancorato in alto al centro | `ClassNode.tsx:32`, `:269-284` |

Nessuna modifica al codice. Nessuna proposta architetturale. Solo fatti con riferimenti `file:riga`.
