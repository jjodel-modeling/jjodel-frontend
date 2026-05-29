# Discovery — Reference re-target via edge drag (v2-flow)

**Data**: 2026-05-29
**Tipo**: discovery read-only (nessuna modifica al codice produttivo)
**Branch**: `alfonso-frontend-jjtl`
**Documento prompt**: 2026-05-29 12:22
**Obiettivo**: raccogliere i fatti di codice per la Fase 2 (trascinare l'estremità *target* di un edge reference M2 da `B` a `C` per ottenere `r.type = C`, riusando il path del property panel).

---

## Nota di contesto preliminare (premessa del prompt vs codice attuale)

Il prompt afferma come fatto che «oggi il type si cambia dal property panel e l'edge si **re-instrada live** (confermato a runtime)». Questo **contraddice** la discovery del 2026-05-28 (`2026-05-28_reference_type_change_orphan_edges.md`), che concludeva l'opposto: l'edge **non** si re-instradava e accumulava orfani.

La spiegazione è nello stato del working tree: il **fix di quella discovery è già stato applicato** (non committato) a `useJjomSync.ts` (`git diff HEAD`: +147/-6) e dipende dai due file untracked `utils/refEdgeReconcile.ts` (+ test). Quindi nel codice **attuale** il cambio di `DReference.type` dal panel re-instrada davvero l'edge live — coerente con la premessa del prompt. Per disciplina §5.1 ("do not trust fixtures from memory across sessions") tutte le risposte qui sotto sono verificate sul **working tree corrente**, non sulla discovery del 28.

Questo fatto è centrale per la Fase 2: il meccanismo di re-instradamento che la Fase 2 vuole riusare **esiste ed è recentissimo** (§ Q7).

---

## Q1 — Versione ReactFlow e API di reconnect

**Pacchetto**: `@xyflow/react` (v12, NON il legacy `reactflow` v11).
- `frontend/package.json:27` → `"@xyflow/react": "^12.10.0"`
- Versione installata in `node_modules`: **12.10.2**

**Conseguenza API**: si usa il set v12 — handler **`onReconnect(oldEdge, newConnection)`**, `onReconnectStart`, `onReconnectEnd`, helper `reconnectEdge(...)`, prop globale `edgesReconnectable`, prop per-edge `edge.reconnectable` (`boolean | 'source' | 'target'`). **NON** esistono qui `onEdgeUpdate` / `updatable` (quelli sono v11).

---

## Q2 — Mount di `<ReactFlow>` nel v2-flow

**File**: `frontend/src/components/editor-v2/EditorV2.tsx`
**Tag di apertura** (`:2964-3001`):

```tsx
<ReactFlow
    nodes={stableNodes}
    edges={stableEdges}
    onNodesChange={handleNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    onConnectEnd={onConnectEnd}
    onReconnect={handleReconnect}
    onReconnectStart={handleReconnectStart}
    reconnectRadius={15}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onNodeContextMenu={onNodeContextMenu}
    onEdgeContextMenu={onEdgeContextMenu}
    onNodeClick={jjomSelection.onNodeClick}
    onEdgeClick={onEdgeClick}
    onPaneClick={onPaneClick}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    defaultEdgeOptions={defaultEdgeOptions}
    connectionMode={ConnectionMode.Loose}
    fitView={!isJjomMode && nodes.length > 0}
    fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    snapToGrid={snapEnabled}
    snapGrid={[16, 16]}
    multiSelectionKeyCode="Shift"
    selectionMode={SelectionMode.Partial}
    panOnDrag={[0, 1, 2]}
    zoomOnScroll={false}
    panOnScroll={false}
    panOnScrollMode={PanOnScrollMode.Free}
    zoomActivationKeyCode="Shift"
    preventScrolling={false}
    zoomOnPinch={true}
    deleteKeyCode={null}
    connectionRadius={40}
>
```

Il mount è dentro `flowCanvas` (`:2962`), reso in `<ReactFlowProvider>` (`:3179-3188`).

### Presenza/assenza delle props rilevanti

| Prop | Presente? | Note |
|------|-----------|------|
| `onReconnect` | ✅ `:2971` → `handleReconnect` | vedi corpo sotto |
| `onReconnectStart` | ✅ `:2972` → `handleReconnectStart` | vedi corpo sotto |
| `onReconnectEnd` | ❌ assente | da aggiungere in Fase 2 per snap-back/no-op |
| `onConnect` | ✅ `:2969` → `onConnect` | vedi corpo sotto |
| `onConnectStart` | ❌ assente | — |
| `onConnectEnd` | ✅ `:2970` → `onConnectEnd` | vedi corpo sotto |
| `edgesReconnectable` | ❌ assente | default v12 = `true` (tutti gli edge sono reconnectable da entrambi i capi). Per limitare al solo target servirà `edge.reconnectable = 'target'` per-edge o gating in `handleReconnect`. |
| `reconnectRadius` | ✅ `:2973` = `15` | — |
| `isValidConnection` | ❌ assente | da aggiungere per validare "solo EClass" (vale sia per reconnect sia per connect) |

### Corpi degli handler presenti

**`handleReconnect`** (`:1416-1424`) — **purely RF-level, NON tocca il modello**:
```tsx
const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
        setEdges((eds) => {
            const updated = reconnectEdge(oldEdge, newConnection, eds);
            return applyDistribution(updated);
        });
    },
    [setEdges, applyDistribution]
);
```
`reconnectEdge` è importato da `@xyflow/react` (`:16`). Questo handler aggiorna **solo** lo stato edge di ReactFlow (sposta `target`/`targetHandle`) e ridistribuisce le ancore. **Non** scrive `DReference.type`, **non** ri-punta `DVoidEdge.end`. → Vedi "Rischi / note Fase 2": al prossimo flush del sync l'edge verrebbe ri-trasformato dal `DVoidEdge.end` (immutato) e il reconnect visivo **verrebbe annullato**. Inoltre è generico (qualunque edge, qualunque capo), senza il gating "solo target" e "solo EClass" richiesto.

**`handleReconnectStart`** (`:1426-1428`):
```tsx
const handleReconnectStart = useCallback(() => {
    takeSnapshot();
}, [takeSnapshot]);
```
Prende solo uno snapshot per l'undo. Non ha parametri (non distingue ancora source vs target né l'edge).

**`onConnect`** (`:1019-1033`): logga (BUG-DIAG) e memorizza la connection in `pendingConnectionRef.current`; il lavoro vero è in `onConnectEnd`.

**`onConnectEnd`** (`:1035-1154`): legge `pendingConnectionRef.current`; se invalido (drop su vuoto) esce (`:1049-1054`). In M1 mode risolve i nodi e crea reference M1 (ramo `:1059-1145`). In M2 mode apre `EdgeTypePopup` via `setPendingConnection({ connection, position })` (`:1147-1151`).

---

## Q3 — Tassonomia degli edge

### `edgeTypes` (EditorV2.tsx:101-106)
```tsx
const edgeTypes: EdgeTypes = {
    reference: UnifiedEdge,
    inheritance: UnifiedEdge,
    composition: UnifiedEdge,   // M1: containment edge
    instanceRef: UnifiedEdge,   // M1: non-containment reference
};
```
Tutti i tipi mappano allo stesso componente `UnifiedEdge`; il `type` discrimina il rendering (frecce/diamanti/cardinalità).

Significato (da `jjomEdgeToRFEdge`, `jjomTransformers.ts:379-512`, ordine dei controlli):

| `edge.type` | Cosa rappresenta | Come viene scelto |
|-------------|------------------|-------------------|
| `composition` | **M1**: containment instance edge (`DVoidEdge`, endpoint su vertici di `DObject`) | `sourceClassName === 'DObject'` **e** `refModel.composition` (`:400,407`) |
| `instanceRef` | **M1**: reference instance non-containment | `sourceClassName === 'DObject'` e non-composition (`:423-435`) |
| `reference` | **M2**: reference (`DReference`) | `edge.isReference` (`:440`) — controllato **dopo** il ramo M1 |
| `inheritance` | **M2**: extends/generalization | `edge.isExtend` (`:479`), `model === undefined` |

> Nota: il ramo M1 è controllato **prima** di `isReference` perché gli edge M1 hanno anch'essi `isReference === true` (`:394-396`); il discriminante è la `className` del modello del vertice sorgente (`DObject` ⇒ M1).

### Edge della reference M2 — forma completa

**Costruzione** (`jjomTransformers.ts:440-476`):
```tsx
if (edge.isReference) {
    const refModel = edge.model;               // :442  L-proxy della DReference
    let kind: ReferenceKind = 'association';
    if (refModel?.composition) kind = 'composition';
    else if (refModel?.aggregation) kind = 'aggregation';

    const refData: ReferenceEdgeData = {
        reference: {
            id: refModel?.id ?? edge.id,       // :449  ← id della DReference
            name: refModel?.name ?? '',        // :450
            kind,                              // :451
            targetClassId: endVertex.id,       // :452  ← id del VERTICE target (NON della classe)
            lowerBound: refModel?.lowerBound ?? 0,
            upperBound: refModel?.upperBound ?? -1,
            containment: !!refModel?.composition,
            opposite: refModel?.opposite?.name,
        },
        jjomRefId: refModel?.id,               // :458  ← id della DReference (canale primario)
    } as any;

    if (refModel?.id) {
        setEdgeRefId(edge.id, refModel.id);    // :463-465  registry module-level
    }

    return {
        id: edge.id,                           // :468  ← id del DVoidEdge
        source: startVertex.id,                // :469  ← vertice owner (A)
        target: endVertex.id,                  // :470  ← vertice target (B), da edge.end CACHATO
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'reference',                     // :473
        label: refModel?.name ?? '',           // :474
        data: refData,
    };
}
```

- **`edge.id`**: è l'**id del `DVoidEdge`** (`edge.id`, `:468`) — pointer del graph element, non una stringa sintetica `ref_*` (quei prefissi `ref_${Date.now()}` esistono solo nel path non-JjOM, EditorV2.tsx:1251). In JjOM mode l'id è il pointer del `DVoidEdge`.
- **`edge.source`** = `startVertex.id` (vertice owner della classe A).
- **`edge.target`** = `endVertex.id` (vertice della classe target B), derivato da `edge.end` **cachato alla creazione**.
- **`edge.data`** = `ReferenceEdgeData`:
  - `.reference.id` = id della **DReference**
  - `.reference.targetClassId` = id del **vertice** target (ATTENZIONE: è l'id del DVertex, non del DClass)
  - `.reference.{name,kind,lowerBound,upperBound,containment,opposite}` = letti live da `refModel`
  - `.jjomRefId` = id della **DReference** (canale primario per risalire alla reference)

### Come risalire dall'edge alla reference del modello

Tre vie, tutte disponibili e ridondanti:
1. **`edge.data.jjomRefId`** (`jjomTransformers.ts:458`) — id della `DReference`. **Canale primario consigliato.**
2. **`edge.data.reference.id`** (`:449`) — stesso id.
3. **Registry module-level** `getEdgeRefId(edge.id)` (`syncState.ts:65`, popolato da `setEdgeRefId` a `jjomTransformers.ts:464`) — usato da `commitLabel` come fallback robusto ai merge di React state.

Per ottenere il proxy: `LPointerTargetable.fromPointer(jjomRefId)` → `LReference`. (Pattern già usato da `syncDeleteEdge`/`syncReferenceEdge` in `canvasToJjom.ts`.)

**Back-reference persistita**: il `DVoidEdge.model` punta all'id della `DReference` (vedi `syncReferenceEdge` arg1 = `refId`, canvasToJjom.ts:232). `edge.model` nel transformer è proprio quella DReference (via L-proxy).

---

## Q4 — Risoluzione nodo → classe e discriminatore EClass

### Costruzione del nodo classe (`jjomTransformers.ts:38-128`, `classVertexToRFNode`)
```tsx
return {
    id: vertex.id,             // :116  ← id del DVertex (== node id RF)
    type: 'classNode',         // :117
    position: { x, y },
    data: {                    // :119-126  ClassNodeData
        label: lClass?.name ?? 'Class',
        isAbstract: !!lClass?.abstract,
        isSingleton: !!lClass?.isSingleton,
        attributes: attrs,
        references: refs.length > 0 ? refs : undefined,
        operations: ops.length > 0 ? ops : undefined,
    },
};
```

**Punto chiave**: per i nodi M2 il `node.id` **è l'id del `DVertex`** (`:116`), e **`node.data` NON contiene l'id della classe** (`ClassNodeData` ha solo label/flags/membri, `:119-126`). L'`instanceOfClassId` esiste **solo** sui nodi M1 `objectNode` (`:202-207, :288`), non sui `classNode` M2.

### Come risalire da node id → DClass

Via L-proxy, esattamente come fa `syncReferenceEdge` (canvasToJjom.ts:164-167):
```ts
const vertexProxy: any = LPointerTargetable.fromPointer(nodeId); // LVertex
const lClass = vertexProxy?.model;       // LClass
const classId = lClass?.id;              // id della DClass
```
Alternativa raw (più robusta ai gotcha LProxy, usata in canvasToJjom.ts:185-187):
```ts
const rawVertex = store.getState().idlookup[nodeId] as any;
const classId = rawVertex?.model;        // string pointer alla DClass
```

### Discriminatore EClass (per la validazione "solo EClass")

**`node.type`** (campo RF) è il discriminatore esatto. Mappa `nodeTypes` (EditorV2.tsx:93-98):
```tsx
const nodeTypes: NodeTypes = {
    classNode: ClassNode,       // ← EClass (M2)
    enumNode: EnumNode,         // ← EEnum (M2)
    packageNode: PackageNode,   // ← EPackage (M2)
    objectNode: ObjectNode,     // ← M1 instance
};
```
- **EClass ⇔ `node.type === 'classNode'`**.
- Enum ⇔ `'enumNode'`. Package ⇔ `'packageNode'`. M1 object ⇔ `'objectNode'`.
- **Non esiste un nodo "datatype"**: i datatypes/tipi primitivi compaiono solo come *nome del tipo* di un attributo (`attr.type?.name`, `:51`), mai come nodo sul canvas. Quindi "drop valido solo su EClass, no enum/datatype" si riduce a `node.type === 'classNode'`.

A livello raw, la corrispondenza è `idlookup[vertex.model].className === 'DClass'` (vedi `isM2ReferenceEdge` in `refEdgeReconcile.ts`, che usa esattamente questo test sul vertice sorgente).

---

## Q5 — Mutazione del type dal property panel (path da riusare)

### File e wiring
- **Componente**: `frontend/src/components/editors/Info.tsx`.
- Il pannello "TYPE & BOUNDS" rende il selettore del type in `Info.feature(...)` (`:411-415`):
  ```tsx
  <CollapsibleSection title="TYPE &amp; BOUNDS">
      <div className="jj-field">
          <div className="jj-field-label">Type <span className="jj-field-required">*</span></div>
          <Select data={data} field={'type'} />     // :414
      </div>
      ...
  </CollapsibleSection>
  ```
- `Info.reference(...)` (`:461-471`) include `this.feature(...)` (`:463`), quindi per una `LReference` selezionata il `<Select field='type'>` è quello che cambia il target. (`data` = `LModelElement`, qui la `LReference`.)

### Chiamata di mutazione esatta
`Select` è il componente `Input` in `frontend/src/components/forEndUser/Input.tsx`. Il selettore single (non multi) rende un `<select>` con `inputProps.onChange` (`:405-412`, props assemblate a `:288-291`). Alla conferma il write è (Input.tsx):
- `confirmValue` (`:239-245`):
  ```ts
  const oldValue = getter ? getter(data, field) : data[field];   // :239
  if (...changed...) {
      if (setter) setter(newValue as any, data, field);
      else data[field] = serializeValue(newValue);               // :243  ← WRITE
  }
  ```
- (path simmetrico in `onChange` immediato, `:188`: `data[field] = target`.)

Con `field === 'type'` e `data` = `LReference` proxy, questo è **`lReference.type = <classId serializzato>`**, che attraverso il setter del L-proxy dispatcha un `SetFieldAction` su `DReference.type`. **Nessun altro side effect** parte da qui: l'handler del panel setta **solo** `type` (niente normalizzazione nome, niente cardinalità, niente gestione `eOpposite`, niente toccare alcun `DVoidEdge`). Validazione: solo `valueDidChange` (`:136`, no-op se invariato) e le opzioni offerte da `getSelectOptions`.

### Forma riusabile verbatim
La stessa mutazione, già scritta proceduralmente, è in `syncReferenceEdge` (canvasToJjom.ts:209-215):
```ts
const lRef = sourceClass.addReference(uniqueName, targetClass.id);
if (lRef && typeof lRef === 'object') {
    lRef.type = targetClass.id;     // :212  ← identica mutazione del type
    lRef.upperBound = -1;
}
```
**Per la Fase 2**, il path da riusare è quindi: risolvere la `LReference` (da `edge.data.jjomRefId`) e fare `lRef.type = <nuovo DClass id>`. Il nuovo DClass id si ottiene dal nodo droppato via `LPointerTargetable.fromPointer(connection.target).model.id` (Q4). Il sync re-instrada da solo (Q7).

> Caveat coerenza: il panel scrive `lRef.type`; il valore selezionabile è un **DClass id**. Il drop fornisce un **vertex id** (`connection.target`): va convertito in **class id** prima della scrittura (`vertexProxy.model.id`), altrimenti si scriverebbe un id di vertice in `type` (incoerente). Questo è l'unico adattamento rispetto al "verbatim".

---

## Q6 — `onConnect` / creazione reference via drag (esiste già)

Sì: trascinare tra handle di due classi crea già una nuova reference M2. Catena:

1. `onConnect` (`:1019-1033`) salva la connection in `pendingConnectionRef`.
2. `onConnectEnd` (`:1035`), ramo M2 (`:1147-1151`): apre il popup `EdgeTypePopup` via `setPendingConnection({ connection, position })`.
3. L'utente sceglie il tipo → `handleEdgeTypeSelected(choice)` (`:1157-1317`). Per `reference` (JjOM mode, `:1235-1244`):
   ```ts
   const result = syncReferenceEdge(edgeSource, edgeTarget, refLabel, choice as any); // :1236
   edgeId = result.edgeId;
   refLabel = result.refName;
   markDropCreated(edgeId);   // :1249  evita duplicati nel sync incrementale
   ```
   poi crea l'edge RF locale (`:1254-1287`) e forza `updateNodeInternals` (double-rAF, `:1300-1312`).

**Mutazione di create** — `syncReferenceEdge` (canvasToJjom.ts:157-250):
- mappa **node id → classe**: `LPointerTargetable.fromPointer(sourceVertexId).model` / `...(targetVertexId).model` (`:164-167`);
- nome univoco nella classe (`:182-200`);
- `TRANSACTION('EditorV2 create reference edge')` (`:208-224`): `sourceClass.addReference(uniqueName, targetClass.id)` poi `lRef.type = targetClass.id`, `lRef.upperBound = -1`, e composition/aggregation via `SetFieldAction` (`:219-223`);
- **fuori** dalla TRANSACTION (per non annidare): `markCanvasEdgePair` (`:230`) + `DVoidEdge.new2(refId, graphId, graphId, undefined, srcV, tgtV, d => d.isReference = true)` (`:232-240`).

È l'analogo più vicino al re-target: stessa risoluzione node→class e **stessa mutazione `lRef.type`** che la Fase 2 deve riusare — con la differenza che il re-target NON deve creare una nuova reference né un nuovo `DVoidEdge`, solo cambiare `type` di una reference esistente.

---

## Q7 — Conferma in codice del re-instradamento reattivo

Nel **working tree corrente** (fix orphan-edges già applicato, non committato) la catena reattiva sul cambio `DReference.type` è:

1. **Trigger**: il nuovo selettore `modelRefTypeSig` (useJjomSync.ts, blocco aggiunto a `~:345-385`) calcola un hash delle coppie `(refId, type)` di tutte le reference M2 ed **è ora una dep dell'effect di auto-populate** (deps a `:877`, prima `:738`: aggiunto `modelRefTypeSig`). Un `SetFieldAction` su `type` cambia l'hash → l'effect rifà partire (questo è esattamente ciò che il `modelRefCount` da solo NON faceva — vedi discovery 2026-05-28 §3.3).
2. **Reconcile**: nello Step 3 references, `classifyRefEdgeReconcile(existingForRef, targetId)` (useJjomSync.ts:740) ritorna `'reconcile'`; il ramo (`~:756-...`) esegue in `TRANSACTION('Reconcile DReference edge endpoint')` 3 write — `SetFieldAction(keepEdgeId,'end',tgtVertex)`, `oldEndVertex.edgesIn -= edge`, `newTargetVertex.edgesIn += edge` — e cancella i duplicati storici (`DeleteElementAction`). Ora `DVoidEdge.end` punta al **nuovo** vertice target.
3. **Re-render**: il cambio di `edge.end` (e dell'hash `type`) propaga al selettore `elementSnapshots`; l'incremental-sync (`useJjomSync.ts:~907`) ri-trasforma l'edge via `jjomEdgeToRFEdge` (che deriva `target` da `edge.end`, ora aggiornato) → `setEdges` → l'edge si re-instrada verso C.

In breve: **non** esiste un selector "puro" preesistente che re-instrada; il re-instradamento live è prodotto dalla macchina di reconcile appena introdotta in `useJjomSync.ts` (dipendente da `utils/refEdgeReconcile.ts`). Riferimenti chiave: `useJjomSync.ts` deps `:877`, reconcile branch `:740`+, transformer `jjomTransformers.ts:452,470`.

---

## Rischi / note per la Fase 2

1. **`handleReconnect` attuale fa l'OPPOSTO della decisione di design.** Oggi (`EditorV2.tsx:1416-1424`) è un reconnect *solo-RF*: `reconnectEdge(...) + applyDistribution`, nessun write al modello. Sposta `edge.target` nello stato ReactFlow ma lascia `DVoidEdge.end` e `DReference.type` invariati → **al primo flush del sync l'edge verrebbe ri-trasformato dal `edge.end` cachato e lo spostamento visivo verrebbe annullato** (snap-back involontario, non per scelta). La Fase 2 deve **sostituire/riscrivere** questo handler in modo che esegua la mutazione del modello (`lRef.type = newClassId`) e lasci che il sync re-instradi (Q7), invece di mutare gli edge RF a mano.

2. **L'handler attuale è generico (entrambi i capi, qualunque edge).** Manca il gating:
   - **Solo estremità target**: `onReconnect` v12 riceve `oldEdge`+`newConnection` ma **non** dice quale capo è stato trascinato; va inferito (es. confronto `newConnection.source === oldEdge.source` ⇒ è stato mosso il target). In alternativa v12 supporta la prop **per-edge** `edge.reconnectable = 'target'` per consentire il drag solo sul capo target (da verificare in Fase 2 sulla 12.10.2; in caso, andrebbe settata sugli edge `type==='reference'` nel transformer o in `applyDistribution`, ma attenzione a §3.10/§5.1 — non toccare `portDistribution`/`useJjomSync` se evitabile).
   - **Solo su `classNode`**: serve `isValidConnection` (oggi assente, vale anche per `onConnect`) che ritorni `true` solo se il nodo target risolto ha `node.type === 'classNode'` (Q4). Cura: `isValidConnection` filtra anche le connect normali — verificare di non restringere il flusso create esistente (oggi nessun filtro ⇒ qualunque coppia è ammessa e poi gestita da `getCompatibleReferences`/popup).
   - **Solo reference M2**: applicare il re-target solo a `oldEdge.type === 'reference'`; per `inheritance`/`composition`/`instanceRef` il drag va trattato come no-op/snap-back.

3. **`onReconnectEnd` assente.** Per il requisito "drop su vuoto/invalido → no-op / snap-back, mai delete" serve cablare `onReconnectEnd` (oggi non presente, `:2964-3001`). In v12, se `onReconnect` non viene chiamato (drop su vuoto), il default di ReactFlow **rimuove** l'edge; per evitare il delete bisogna gestire `onReconnectStart`/`onReconnectEnd` con il pattern "flag + restore" (es. settare un ref in start, e in end ripristinare se il reconnect non è andato a buon fine). Da progettare in Fase 2.

4. **Conversione vertex id → class id obbligatoria.** `connection.target` è un **vertex id** (Q4: `node.id == DVertex.id`), ma `lRef.type` vuole un **DClass id**. Va fatto `LPointerTargetable.fromPointer(connection.target).model.id` (o lookup raw `idlookup[vertexId].model`) prima della scrittura. Scrivere il vertex id in `type` produrrebbe stato incoerente.

5. **La macchina di re-instradamento è uncommitted e fresca.** Il re-routing live su cui la Fase 2 si appoggia vive nel `git diff HEAD` di `useJjomSync.ts` + i due file untracked (`refEdgeReconcile.ts`, `__tests__/refEdgeReconcile.test.ts`). Non è ancora committato. La Fase 2 dipende funzionalmente da questo fix: se venisse droppato/rivisto, il re-target via drag non si re-instraderebbe. Segnalare ad Alfonso che i due lavori sono accoppiati.

6. **Snapshot undo già preso in `handleReconnectStart`.** `takeSnapshot()` (`:1426-1428`) è già cablato; la Fase 2 può riusarlo. Da decidere se lo snapshot vada preso anche quando il drop è invalido (snap-back) — in tal caso andrebbe scartato per non sporcare lo stack undo.

7. **eOpposite / cardinalità non gestiti dal path del panel** (Q5): il panel cambia solo `type`. Se la reference ha un `eOpposite`, cambiare `type` lascia l'opposite puntato alla vecchia classe (comportamento identico al panel oggi). Coerente col requisito "riusa lo stesso path", ma è un edge case noto (vedi anche discovery 2026-05-28 §7.2) da non risolvere in Fase 2 se l'obiettivo è la parità col panel.

8. **`targetClassId` in `ReferenceEdgeData` è un vertex id, non un class id** (`jjomTransformers.ts:452`). Non usare `edge.data.reference.targetClassId` come "classe target" credendola un DClass id: è `endVertex.id`. Per la classe target reale si passa da `edge.end`/vertice → `.model`.

---

## File letti (nessuno modificato fuori da `docs/`)

- `frontend/package.json` (`:27`)
- `frontend/src/components/editor-v2/EditorV2.tsx` (`:93-106, :1019-1154, :1156-1322, :1416-1428, :2964-3026`)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`:36-128, :375-512`)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`:155-264`)
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (diff HEAD: `:48-51, :345-385, :446-500, :719-770, :877`)
- `frontend/src/components/editor-v2/utils/refEdgeReconcile.ts` (integrale, untracked)
- `frontend/src/components/editor-v2/sync/syncState.ts` (`:61-66`)
- `frontend/src/components/editors/Info.tsx` (`:395-485`)
- `frontend/src/components/forEndUser/Input.tsx` (`:35-50, :180-291, :333-414`)
- Prior art: `docs/discovery/2026-05-28_reference_type_change_orphan_edges.md`

**Working tree**: nessun `.ts/.tsx/.scss` modificato in questa sessione. Solo questo documento + `docs/claude-code-log.md`.
