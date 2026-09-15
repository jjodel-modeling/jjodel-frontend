# Discovery — Bug B: pipeline Redux → ReactFlow.edges (flow editor v2)

**Data**: 2026-05-09
**Tipo**: Fase A read-only
**Scope**: mappare la derivazione `edges` per il flow editor v2 e identificare punti di fix per il caso `Edge_0` post-mount.

## Sommario esecutivo

La rottura è univoca e si trova nel **trigger** del Step 4 di `useJjomSync.ts`, non nella sua logica di costruzione. Il `useEffect` auto-populate (`useJjomSync.ts:343-698`) dipende da `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]`. Una scrittura `SetFieldAction` su `DValue.values` (slot di una reference M1) non muta nessuna di queste sei chiavi → l'effetto non rigira → Step 4 non si rilancia → nessun `DVoidEdge` viene creato per `Edge_0`. Il selettore `elementSnapshots` rileva invece la modifica (l'hash `ch:${id}` include `child.values`, useJjomSync.ts:742-750), ma alimenta solo l'incremental sync, che **non crea** edge nuovi. Il candidato di fix più pulito a parità di rischio è (C) un nuovo hook sibling `useM1ReferenceEdges` invocato accanto a `useJjomSync` in `EditorV2.tsx`: replica il selettore reattivo del pattern già esistente `liveRefNameSig` (EditorV2.tsx:358-367), scansiona Redux per (sourceObjId, refMetaId, targetObjId) mancanti nel graph e dispatcha `DVoidEdge.new2`. La pipeline a valle (Selector 1 di useJjomSync → `lGraph.edges` → `jjomEdgeToRFEdge`) propaga il resto senza modifiche.

## D1 — Costruzione di ReactFlow.edges

**JSX root**: `frontend/src/components/editor-v2/EditorV2.tsx:2921-2983`. Il prop è `edges={stableEdges}` (riga 2923).

**Catena del valore** (downstream → upstream):

1. `stableEdges` — `useMemo` di stabilizzazione referenziale di `edges`, ritorna lo stesso array reference se `id|source|target|sourceHandle|targetHandle|type|data|selected|hidden` non cambiano per nessun elemento (EditorV2.tsx:960-981). Solo dietetica: non altera contenuto.
2. `edges` — stato locale del componente da `useEdgesState(modelid ? [] : initialEdges)` (EditorV2.tsx:263).
3. `setEdgesRaw` — setter underlying. Wrappato da `setEdges` con dedup per ID (EditorV2.tsx:282-289).
4. `setEdges` viene passato come parametro al sync hook: `useJjomSync(modelid, setNodes, setEdges, ...)` (EditorV2.tsx:313).

**Producer principale (in modalità JjOM)**: `useJjomSync` popola `edges` in due punti:

- **Inizializzazione** (full transform, `useJjomSync.ts:790-864`):
  - Linea 817-821: legge `lGraph.edges` (proxy LGraph, espande le `DVoidEdge` dal `subElements` del DGraph filtrate per className contenente `'Edge'`).
  - Linea 833-839: per ciascuna LEdge → `jjomEdgeToRFEdge(e)`. Filtra orfani (source/target non in `nodeCache`).
  - Linea 853: `setEdges(deduplicateInheritanceEdges(Array.from(edgeCache.values())))`.
- **Incremental sync** (per-elemento patches, `useJjomSync.ts:867-1147`):
  - Linea 887-960: per ID nuovo in `currentIds \ prevIds` con className contenente `'Edge'`, costruisce RFEdge via `jjomEdgeToRFEdge` e lo aggiunge a `addedEdges`.
  - Linea 962-967: per ID rimosso, lo aggiunge a `removedEdgeIds`.
  - Linea 970-1033: per property changes su edge esistente, ricalcola via `jjomEdgeToRFEdge` e patcha.
  - Linea 1102-1146: applica le patch via `pendingEdgePatchRef` → `setEdges` (con dedupe inheritance).

**Sorgente per ogni elemento `edges[i]`**: ogni elemento è derivato da un `DVoidEdge` in `state.idlookup[X]` dove `X` è in `state.idlookup[graphId].subElements`. **Non** direttamente da un `DObject` con feature reference. **Non** da un campo di un `DGraph` diverso.

**Mappatura `jjomEdgeToRFEdge`** (`frontend/src/components/editor-v2/utils/jjomTransformers.ts:379-521`):

- `edge.start` / `edge.end` sono LVertex (non DObject diretti). `startVertex.id` è l'ID del LVertex (= DVertex).
- `sourceHandle` / `targetHandle` calcolati da `computeOptimalHandles(startVertex, endVertex, isInheritance)` (jjomTransformers.ts:327-373). Restituisce uno tra `'top-0' | 'bottom-0' | 'left-0' | 'right-0'` per lato, sempre indice 0 (il distribuite multi-handle viene poi applicato da `applyDistribution` in EditorV2).
- Branch principali (jjomTransformers.ts:394-499):
  - `sourceClassName === 'DObject'` → tipo `'instanceRef'` (o `'composition'` se `refModel.composition`). **Questo è il caso di Edge_0.from / Edge_0.to.**
  - `edge.isReference` (M2) → tipo `'reference'`.
  - `edge.isExtend` → tipo `'inheritance'`.
  - Fallback: `'reference'` generic.

**Snippet del case M1 instanceRef** (jjomTransformers.ts:432-444):

```typescript
return {
    id: edge.id,                         // DVoidEdge id
    source: startVertex.id,              // DVertex id
    target: endVertex.id,                // DVertex id
    sourceHandle: handles.sourceHandle,  // es. 'top-0'
    targetHandle: handles.targetHandle,  // es. 'bottom-0'
    type: 'instanceRef',
    label: refName,                      // DReference.name
    data: {
        referenceName: refName,
        referenceId: refId,              // DReference.id (dal `edge.model`)
    } as InstanceReferenceEdgeData,
};
```

**Schema utilizzato dai consumer**: l'`UnifiedEdge` legge `data.referenceName` per il label e `data.referenceId` per il rename live (vedi EditorV2.tsx:345-410, sub `liveRefNameSig`).

## D2 — Trigger di riderivazione

`useJjomSync` espone tre selector primari più uno secondario di tipo Map.

| Selettore | Range | Cosa legge | Re-fire condition |
|-----------|-------|------------|-------------------|
| `graphInfo` | useJjomSync.ts:271-291 | `state.graphs` + `state.idlookup[graphId].subElements` | `graphId` cambia oppure `subElements` ha contenuto diverso (shallow array eq) |
| `modelObjectCount` | useJjomSync.ts:299-303 | `state.idlookup[modelid].objects.length` | `objects.length` cambia (= aggiunta/rimozione DObject) |
| `modelClassCount` | useJjomSync.ts:307-318 | numero classi+enum in tutti i package | aggiunta/rimozione DClass o DEnumerator |
| `modelRefCount` | useJjomSync.ts:322-337 | sommatoria di `(class.references ?? []).length` per classe | aggiunta/rimozione DReference **al livello M2** (definizione metaclasse) |
| `elementSnapshots` (Map) | useJjomSync.ts:704-787 | per ogni `id` in `subElements`, salva `state.idlookup[id]`, il `model:${id}`, e un hash `ch:${id}` derivato dai children del modelElem (`attributes`, `references`, `operations`, `literals`, `features`) | `mapReferenceEqual`: ognuno dei tre valori per ogni id deve essere uguale per reference; altrimenti re-fire |

**Crucially**: l'hash `ch:${id}` (useJjomSync.ts:742-750) **include esplicitamente** `child.values` per ogni child. Quindi per i nodi M1 (vertex con `model = DObject`), quando una `DValue.values` viene mutata, `ch:${vertexId}` cambia. Il selettore `elementSnapshots` re-fira di conseguenza.

**Dipendenze degli effetti**:

- **Auto-populate effect** (useJjomSync.ts:698): `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]`. **Nessuna di queste cambia** quando `SetFieldAction` muta `DValue.values`. → Step 4 NON viene rilanciato.
- **Initialization effect** (useJjomSync.ts:864): `[isJjomMode, modelid, graphInfo, elementSnapshots, setNodes, setEdges, subElementIds]`. Esce subito se `initializedRef.current` è già true (riga 813). Quindi, dopo il primo run, le modifiche a `elementSnapshots` non riportano effetto qui.
- **Incremental sync effect** (useJjomSync.ts:1147): `[isJjomMode, elementSnapshots, subElementIds, scheduleFlush]`. Re-fira a ogni mutazione `elementSnapshots`. **Ma**: l'incremental sync gestisce solo (a) addizioni di sub-element già presenti in `subElementIds` (non in cache RF), (b) rimozioni, (c) patch di property su elementi esistenti (riga 970-1033). Non scansiona DObject features per creare DVoidEdge mancanti.

**Frequenza di esecuzione**:
- Auto-populate: solo quando una delle sei dep cambia (raro: drop di un nodo, aggiunta DReference al metamodello, init).
- Incremental: una volta per dispatch (subordinato al RAF debounce in `scheduleFlush`, useJjomSync.ts:235-252).

**`modelRefCount` esattamente** (useJjomSync.ts:322-337):

```typescript
const modelRefCount = useSelector((state: DState) => {
    if (!modelid) return 0;
    const rawModel = state.idlookup?.[modelid] as any;
    if (!rawModel) return 0;
    let count = 0;
    for (const pkgId of (rawModel.packages ?? [])) {
        const pkg = state.idlookup?.[pkgId] as any;
        if (!pkg) continue;
        for (const clsId of (pkg.classes ?? [])) {
            const cls = state.idlookup?.[clsId] as any;
            if (!cls) continue;
            count += (cls.references ?? []).length;
        }
    }
    return count;
});
```

Conta esclusivamente le `DReference` definite a livello di metaclasse (M2). I `values` di una `DValue` (slot M1 popolato per istanza) **non** sono contati.

**Meccanismo già presente che reagisce a `set DObject.feature = value` per le reference M1**:
- ❌ Nessun listener / subscription / middleware su `SetFieldAction`. `frontend/src/redux/createStore.ts` non applica middleware (è 11 righe totali, no `applyMiddleware`).
- ❌ Nessun custom event `M1_REFERENCE_MATERIALIZED`, `SLOT_VALUE_CHANGED`, o simile in `frontend/src/events/registry.ts` (controllato).
- ✅ L'unico path che reagisce è il selettore `elementSnapshots` → incremental sync, ma come detto sopra non crea edge nuovi.
- ⚠️ **Caso speciale**: `syncCreateCompositionLink` (canvasToJjom.ts:1253-1310) è un path proattivo: quando l'utente crea una connessione via canvas (non Slots panel), questa funzione fa **insieme** il populate del DValue e il `DVoidEdge.new2`. Quindi il bug riguarda solo i path che usano `syncUpdateFeatureValue` (canvasToJjom.ts:1218-1244, dal M1PropertiesPanel) o `setValueAtPosition` (Info.tsx:644, dalla Slots view del classic editor).

## D3 — Step 4 di useJjomSync sul caso Edge_0

**Posizione**: useJjomSync.ts:636-689, preceduto dal calcolo `missingM1EdgeCount` (righe 454-477).

**Funzione/loop**: nessuna funzione separata — il blocco è inline nell'effetto auto-populate. Il branch è gated da `if (missingM1EdgeCount > 0)` (riga 642).

**Cosa itera** (righe 658-688):
1. `for (const objId of (rawModel.objects ?? []))` — tutti i DObject del modello.
2. `for (const featId of (dObj.features ?? []))` — tutte le DValue feature di ogni DObject.
3. Filtra: `dFeat.instanceof` deve essere risolvibile a un elemento con `className === 'DReference'` (riga 671). Skippa attributi e altri tipi.
4. `for (const tgtObjId of (dFeat.values ?? []))` — tutti i target dell'istanza di reference. **Il loop opera correttamente su slot popolati con qualsiasi target DObject**.

**Filtri per skip**:
- `srcVertex` deve esistere (riga 662): se l'oggetto sorgente non ha vertice nel graph, skip.
- `tgtVertex` deve esistere (riga 674-675): idem per target.
- `existingEdgeKeys.has(ek) || hasCanvasEdgePair(ek)` (riga 677): skip se l'edge è già presente (idempotenza).

**Generalità**: il loop **non è cablato a metaclassi specifiche**. Usa `meta.className === 'DReference'` come unico filtro semantico. Quindi per `Edge_0` (di metaclasse `Edge` con feature `from: Source` e `to: Target`), l'algoritmo si comporta correttamente: itererebbe Edge_0.features → DValues `from` e `to` → `dFeat.instanceof` punta alle DReference `from` e `to` definite sulla classe Edge → crea due DVoidEdge.

**Lifecycle Edge_0 — analisi trigger by trigger**:

| Trigger | Cosa cambia in store | `modelObjectCount` | `modelClassCount` | `modelRefCount` | `subElementIds.length` | Effetto auto-populate gira? |
|---------|----------------------|--------------------|--------------------|------------------|------------------------|-----------------------------|
| 1. Drop Source_0 (palette → canvas) | `rawModel.objects` += Source_0 (nuovo DObject + DValues vuoti) | **+1** | invariato | invariato | invariato (vertice non ancora creato) | ✅ sì, dep `modelObjectCount` |
| Step 2bis effect: crea vertex per Source_0 | `subElements` += vertice | invariato | invariato | invariato | **+1** | ✅ sì, dep `subElementIds.length` (re-run idempotente) |
| 2. Drop Edge_0 | `rawModel.objects` += Edge_0 (DObject + DValues `from`/`to` con `values: []`) | **+1** | invariato | invariato | invariato (vertice non ancora creato) | ✅ sì |
| Step 2bis: crea vertex per Edge_0 | `subElements` += vertice | invariato | invariato | invariato | **+1** | ✅ sì (re-run idempotente, Step 4 itera ma Edge_0.values=[], nulla da creare) |
| 3. Slots panel: imposta `Edge_0.from = Source_0` | `idlookup[edge0.dvalue.from].values = [source_0_id]` | invariato | invariato | invariato | invariato | ❌ **NO. Nessuna dep cambia.** |
| 4. Slots panel: imposta `Edge_0.to = target_ojt` | `idlookup[edge0.dvalue.to].values = [target_ojt_id]` | invariato | invariato | invariato | invariato | ❌ **NO.** |

**Conclusione D3**: Step 4 sarebbe perfettamente in grado di creare i due DVoidEdge per Edge_0 — il branch riga 671 (`meta.className === 'DReference'`) accetta qualsiasi metaclasse. Il problema è esclusivamente che la sua dependency list non rileva la mutazione di `DValue.values`. L'effetto non viene mai rilanciato dopo il drop di Edge_0 (modelObjectCount stabilizzato a 5).

## D4 — Sequenza di ispezione runtime

Da incollare nella DevTools console del browser, dopo aver riprodotto lo scenario (Source_0 + Edge_0 droppati con slot popolati via Slots panel):

```js
// ──────────────────────────────────────────────────────────────────
// L0 — Redux raw: M1 instances + slot values per la classe "Edge"
// Atteso: vedi sia edge_qsl che Edge_0 con from/to popolati
// ──────────────────────────────────────────────────────────────────
const s = window.store.getState();
const lookup = s.idlookup;
const dObjects = Object.values(lookup).filter(o => o?.className === 'DObject');
const edgeMC = Object.values(lookup).find(o => o?.className === 'DClass' && o?.name === 'Edge');
console.table(dObjects.filter(o => o.instanceof === edgeMC?.id).map(o => {
  const fromDV = o.features?.map(fid => lookup[fid]).find(dv => lookup[dv?.instanceof]?.name === 'from');
  const toDV   = o.features?.map(fid => lookup[fid]).find(dv => lookup[dv?.instanceof]?.name === 'to');
  return { id: o.id, name: o.name, from: fromDV?.values, to: toDV?.values };
}));

// ──────────────────────────────────────────────────────────────────
// L1 — DVoidEdge derivati: chi li ha generati?
// Atteso: per edge_qsl si vedono 2 DVoidEdge; per Edge_0 ZERO.
// ──────────────────────────────────────────────────────────────────
const allEdges = Object.values(lookup).filter(o => o?.className === 'DVoidEdge' || o?.className === 'DEdge');
console.table(allEdges.map(e => {
  const startV = lookup[e.start]; const endV = lookup[e.end];
  const startObj = startV?.model ? lookup[startV.model] : null;
  const endObj   = endV?.model   ? lookup[endV.model]   : null;
  return {
    id: e.id, ownerObj: startObj?.name, targetObj: endObj?.name,
    refModel: e.model ? lookup[e.model]?.name : null,
    isReference: e.isReference, isExtend: e.isExtend,
  };
}));

// ──────────────────────────────────────────────────────────────────
// L1b — v2-flow graph subElements (sorgente di verità per la pipeline)
// ──────────────────────────────────────────────────────────────────
const graph = Object.values(lookup).find(o => o?.className?.includes('Graph') && o?.graphStyle === 'v2-flow');
console.log('v2-flow graph:', graph?.id, 'subElements:',
  (graph?.subElements ?? []).map(id => ({
    id, kind: lookup[id]?.className,
    model: lookup[id]?.model && lookup[lookup[id].model]?.name,
    start: lookup[id]?.start, end: lookup[id]?.end,
  })));

// ──────────────────────────────────────────────────────────────────
// L2 — ReactFlow edges live nel DOM (data-id = edge.id = DVoidEdge.id)
// Atteso: solo gli edge di edge_qsl sono nella lista.
// ──────────────────────────────────────────────────────────────────
[...document.querySelectorAll('.react-flow__edge')].map(el => ({
  id: el.dataset.id,
  classes: el.className.baseVal || el.className,
  visible: el.getBoundingClientRect().width > 0,
}));

// ──────────────────────────────────────────────────────────────────
// L3 — DOM path check: distingue "edge non in lista" vs "in lista ma non disegnato"
// Atteso: nessun path con d="" — se manca completamente significa che L2 è vuota.
// ──────────────────────────────────────────────────────────────────
[...document.querySelectorAll('.react-flow__edge-path')].map(p => ({
  edgeId: p.closest('.react-flow__edge')?.getAttribute('data-id'),
  dStart: p.getAttribute('d')?.slice(0, 40) ?? '<empty>',
}));
```

**Risultato atteso del bug**: L0 mostra `Edge_0` con `from: [source_0_id]` e `to: [target_ojt_id]` correttamente. L1 e L1b mostrano DVoidEdge solo per `edge_qsl`. L2 (DOM RF) elenca solo gli edge di `edge_qsl`. L3 conferma che la disclosed è alla sorgente (non un path vuoto). → conferma diagnosi: il problema è upstream di RF.

## D5 — Handle pool e DefaultNode

**File del componente che renderizza i handle**: `frontend/src/components/editor-v2/components/DynamicHandles.tsx`. **Non si chiama `DefaultNode`** — Jjodel definisce 4 node type concreti (`ClassNode`, `EnumNode`, `PackageNode`, `ObjectNode`), ognuno include `<DynamicHandles nodeId={id} />` in fondo al markup:
- ClassNode.tsx:223 e 259 (due varianti per layout)
- ObjectNode.tsx:349
- PackageNode.tsx:70
- EnumNode.tsx:164

**Pre-allocazione del pool**: `MAX_HANDLES_PER_SIDE = 4` (`frontend/src/components/editor-v2/utils/portDistribution.ts:247`). Il loop a DynamicHandles.tsx:191-199 itera `for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++)` per ognuno dei 4 lati (`SIDES = ['top', 'right', 'bottom', 'left']`, riga 5). **Totale: 16 handle per nodo, sempre montati nel DOM**.

**Visibility**: gli handle inattivi usano `inactiveStyle` (riga 213-220):
```typescript
const inactiveStyle: React.CSSProperties = {
    [positionProp]: '50%',
    visibility: 'hidden' as const,
    opacity: 0,
    pointerEvents: 'none' as const,
    border: 'none', background: 'transparent',
};
```
**MA** restano misurabili da `getBoundingClientRect` perché il commento esplicito a riga 217-219 dice: "*NO width:0, NO height:0 — React Flow MUST be able to measure via getBoundingClientRect(). Dimensions come from CSS .mm-anchor (8x8px).*"

**ID handle stabili**: `${side}-${index}` → `'top-0'..'top-3'`, `'right-0'..'right-3'`, `'bottom-0'..'bottom-3'`, `'left-0'..'left-3'` (DynamicHandles.tsx:194). React keys uguali (`<React.Fragment key={handleId}>` riga 268) → mai unmount/remount.

**Coerenza con `jjomEdgeToRFEdge`**: `computeOptimalHandles` (jjomTransformers.ts:327-373) ritorna sempre indici 0 (`'top-0'`, `'bottom-0'`, `'left-0'`, `'right-0'`). Sono ID validi del pool. Nessun mismatch potenziale al tempo iniziale.

**Endpoint timing per Edge_0**:
- `Source_0` viene droppato per primo. Il suo vertex viene creato dal Step 2bis dell'auto-populate effect → render del nodo → DynamicHandles monta il pool da 16 handle.
- Poi `Edge_0` viene droppato. Stesso flow.
- Solo dopo (quando entrambi i nodi sono già renderizzati con pool registrato) l'utente apre Slots panel di Edge_0 e imposta `from = Source_0`.
- Conclusione: **gli handle sono pronti**. Anche se il DVoidEdge per Edge_0→Source_0 fosse creato in questo momento, troverebbe target valido. **Il pool NON è il punto di rottura.**

## D6 — Punti di intervento alternativi

| Candidato | Path principali | Invasività (LOC) | Pro | Contro |
|-----------|-----------------|------------------|-----|--------|
| **(A)** Selettore reattivo in EditorV2 | EditorV2.tsx + nuovo `useEffect` | ~80-120 | Mirrora il pattern già esistente `liveRefNameSig` (EditorV2.tsx:358-410). Nessuna modifica a useJjomSync. | Duplica in spirito Step 4. Rumore in EditorV2 (già 3151 righe). |
| **(B)** Custom event `M1_REFERENCE_MATERIALIZED` | events/registry.ts + Info.tsx:644 + canvasToJjom.ts:1218 + EditorV2.tsx | ~30-50 | Semantica esplicita. Estendibile. | Ogni futuro path che muta DValue.values (JjScript, JjTL, import) deve ricordarsi di emettere — silent regression risk. Toccare 4 file. |
| **(C)** Hook sibling `useM1ReferenceEdges` | nuovo file + 1 riga in EditorV2.tsx | ~60-100 | Separazione di concerns pulita. Replica solo il selettore reattivo, sfruttando Step 4 della pipeline a valle (idempotenza naturale). | Selettore costoso se modello grande (itera tutti DObject su ogni dispatch). |
| **(D)** Middleware Redux su SetFieldAction | createStore.ts + nuovo middleware | ~40-80 | Cattura ogni mutazione DValue.values, qualunque sia la sorgente. | Tocca il core Redux (createStore.ts). Coupling tra middleware generico e v2-flow concept. Rischio dispatch ricorsivi. |
| **(E)** Modificare deps di useJjomSync | useJjomSync.ts (vincolo violato) | ~10 | Patch chirurgica. | Vincolo hard violato. Selettore aggiuntivo computa hash a ogni dispatch. |

**Dettaglio per candidato**:

### (A) Selettore reattivo in EditorV2

Strutturalmente fattibile: il pattern esiste già con `liveRefNameSig` (EditorV2.tsx:358-367 + effect 379-410). Aggiungere un selettore che ritorna un hash di tutte le tuple `(srcObjId, refMetaId, tgtObjId)` correnti, e un `useEffect` che chiama `DVoidEdge.new2` per le mancanti. Prerequisito: `DVoidEdge`, `DEdge`, `TRANSACTION` sono già importati o facilmente importabili.

### (B) Custom event

Strutturalmente fattibile. Aggiungere `M1_REFERENCE_MATERIALIZED: 'jjodel:m1-ref-materialized'` a `JjodelEvents` (registry.ts:7). Emettere `window.dispatchEvent(new CustomEvent(...))` in:
- `Info.tsx:644` (dopo `value.setValueAtPosition(...)` se la feature è una reference).
- `canvasToJjom.ts:1218` (`syncUpdateFeatureValue` — ma deve distinguere reference vs attribute, il suo signature non lo discrimina; serve check `feature?.className === 'DReference'`).

EditorV2 ascolta e dispatcha la replay logic (uguale ad A o C). **Rischio**: silent regression — un futuro mutator (es. JjScript runtime, future Slot inline editor in M1PropertiesPanel) deve ricordarsi di emettere. Niente type system lo forzerà.

### (C) Hook sibling `useM1ReferenceEdges` ← **preferenza dell'autore**

Strutturalmente fattibile. Nuovo file `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts`:

```typescript
export function useM1ReferenceEdges(modelid: string | undefined, graphId: string | null) {
    const m1RefValuesSig = useSelector((state: DState) => {
        if (!modelid) return '';
        const lookup = state.idlookup;
        const rawModel = lookup[modelid] as any;
        if (!rawModel?.objects) return '';
        const parts: string[] = [];
        for (const objId of rawModel.objects) {
            const dObj = lookup[objId] as any;
            if (!dObj?.features) continue;
            for (const featId of dObj.features) {
                const dFeat = lookup[featId] as any;
                if (!dFeat) continue;
                const meta = lookup[dFeat.instanceof] as any;
                if (meta?.className !== 'DReference') continue;
                for (const tgtId of (dFeat.values ?? [])) {
                    if (typeof tgtId === 'string') {
                        parts.push(`${objId}:${dFeat.instanceof}:${tgtId}`);
                    }
                }
            }
        }
        return parts.sort().join('|');
    });

    useEffect(() => {
        if (!modelid || !graphId || !m1RefValuesSig) return;
        const lookup = store.getState().idlookup;
        const rawModel = lookup[modelid] as any;
        const rawGraph = lookup[graphId] as any;
        if (!rawModel || !rawGraph) return;

        // Mirror Step 4 di useJjomSync: build vertex map + existing keys
        const vertexByModel = new Map<string, string>();
        const existingKeys = new Set<string>();
        for (const seId of (rawGraph.subElements ?? [])) {
            const se = lookup[seId] as any;
            if (!se) continue;
            if (se.className?.includes('Vertex') && se.model) vertexByModel.set(se.model, seId);
            if (se.className?.includes('Edge') && se.start && se.end) existingKeys.add(`${se.start}→${se.end}`);
        }

        for (const objId of (rawModel.objects ?? [])) {
            const dObj = lookup[objId] as any;
            const srcV = vertexByModel.get(objId);
            if (!dObj || !srcV) continue;
            for (const featId of (dObj.features ?? [])) {
                const dFeat = lookup[featId] as any;
                if (!dFeat) continue;
                const meta = lookup[dFeat.instanceof] as any;
                if (meta?.className !== 'DReference') continue;
                for (const tgtId of (dFeat.values ?? [])) {
                    if (typeof tgtId !== 'string') continue;
                    const tgtV = vertexByModel.get(tgtId);
                    if (!tgtV) continue;
                    const ek = `${srcV}→${tgtV}`;
                    if (existingKeys.has(ek)) continue;
                    DVoidEdge.new2(
                        dFeat.instanceof, graphId, graphId, undefined,
                        srcV, tgtV,
                        (d: DEdge) => { d.isReference = true; }
                    );
                    existingKeys.add(ek);
                }
            }
        }
    }, [modelid, graphId, m1RefValuesSig]);
}
```

Una sola riga in EditorV2.tsx (subito dopo la chiamata a `useJjomSync`):
```typescript
useM1ReferenceEdges(modelid, graphId);
```

Il `DVoidEdge.new2` muta `subElements` → Selector 1 di useJjomSync re-fira → la pipeline a valle (initialization o incremental sync) si occupa di rendere l'edge in RF. Niente da modificare in `useJjomSync`.

### (D) Middleware Redux

Strutturalmente fattibile ma invasivo. Richiede modificare `frontend/src/redux/createStore.ts` aggiungendo `applyMiddleware(...)`. Il middleware intercetta `action.type === 'SET_FIELD'` o `'SET_ROOT_FIELD'`, ispeziona `action.fullpath` (forma `idlookup.{id}.{field}`) per identificare DValue.values, e dopo `next(action)` lancia la replay logic. Coupling concettuale: il middleware è generico (Redux core) ma deve conoscere il concetto v2-flow graph (graphStyle === 'v2-flow') per filtrare il graph corretto. Cattura però **ogni** path: anche futuri JjScript runtime o JjTL.

### (E) Renegotiate

Aggiungere a `useJjomSync.ts:322-337` un nuovo `modelRefValueCount` selector:

```typescript
const modelRefValueCount = useSelector((state: DState) => {
    if (!modelid) return 0;
    const rawModel = state.idlookup?.[modelid] as any;
    if (!rawModel) return 0;
    let count = 0;
    for (const objId of (rawModel.objects ?? [])) {
        const dObj = state.idlookup?.[objId] as any;
        if (!dObj) continue;
        for (const featId of (dObj.features ?? [])) {
            const dFeat = state.idlookup?.[featId] as any;
            if (!dFeat) continue;
            const meta = state.idlookup?.[dFeat.instanceof] as any;
            if (meta?.className !== 'DReference') continue;
            count += (dFeat.values ?? []).length;
        }
    }
    return count;
});
```

E aggiungerlo alla dep array dell'auto-populate effect (riga 698). Patch ~10 LOC. **Vincolo hard violato**. Motivazione tecnica per rinegoziare: il problema è esattamente che `useJjomSync` ha definito una dependency-list incompleta; aggiungere la dep mancante è la più piccola correzione semantica possibile, e il rischio di regressione è minimo dato che Step 4 è già idempotente.

## Bozza di fix proposta (preferenza dell'autore della discovery)

**Candidato (C) — `useM1ReferenceEdges` hook sibling**.

Motivazione:
1. **Rispetta il vincolo hard** senza sforzare la rinegoziazione di useJjomSync.
2. **Nessuna duplicazione effettiva** della logica di rendering: il nuovo hook scrive solo nella sorgente Redux (`DVoidEdge.new2`), e la pipeline a valle (`useJjomSync`'s Selector 1 → `lGraph.edges` → `jjomEdgeToRFEdge` → setEdges) è quella unica già esistente. La "duplicazione" è solo della **scansione iniziale** (find missing edges), che è inevitabile data la dependency list di Step 4 incompleta.
3. **Idempotenza naturale**: Step 4 di useJjomSync già controlla `existingEdgeKeys.has(ek)` (useJjomSync.ts:677). Il nuovo hook ha la stessa guardia. Non ci sono race condition: entrambi possono runare sullo stesso store senza creare duplicati.
4. **Costo selettore**: la scansione di tutti i DObject su ogni dispatch è O(n_objects × n_features × n_values). Per modelli M1 medi (centinaia di oggetti) è accettabile. Se diventa un bottleneck, si può memoizzare il risultato per (objId, featId) usando `WeakMap`. Da rivedere solo se profilato come hot.
5. **Reversibilità**: l'hook è un singolo file. Rimuoverlo è un revert atomico.

Variante minore (C'): se il costo del selettore fosse misurato come problematico, si può combinare con un **debounce** sul `useEffect` (es. `setTimeout(..., 50)` accumulato in ref) per coalescare run rapidi durante l'editing slot consecutivo (es. utente che imposta `from` e poi subito `to`).

**Da rifiutare in Fase B**: candidati (D) (invade core), (E) (vincolo violato senza giustificazione tecnica forte). Candidato (B) è un fallback se (C) si rivelasse insufficiente per qualche path non ancora identificato.

## Asimmetria edge_qsl vs Edge_0

Dato il modello tracciato in D1-D5, l'asimmetria è completamente spiegata dal **timing della popolazione delle slot rispetto alla execution del Step 4**.

**edge_qsl (pre-mount)**:
1. Esiste in store **prima** che EditorV2 monti (creato da JjScript / model load).
2. Le sue DValue `from`/`to` hanno `values = [source_m87_id]` e `[target_ojt_id]` già al mount.
3. EditorV2 monta → `useJjomSync` rileva il modello, l'auto-populate effect parte (mount = first run di `useEffect`).
4. Step 2 / 2bis crea i vertici per source_m87, target_ojt, edge_qsl.
5. **Step 4 (riga 658-688)** itera `rawModel.objects` → trova `edge_qsl` con DValue popolate → crea due `DVoidEdge.new2` (uno per `from`, uno per `to`).
6. I DVoidEdge entrano in `subElements` del v2-flow graph.
7. L'initialization effect (useJjomSync.ts:790) eventualmente legge `lGraph.edges` (proxy che espande i DVoidEdge da subElements) → costruisce gli RF edges via `jjomEdgeToRFEdge` → `setEdges` li pubblica.

**Edge_0 (post-mount)**:
1. Source_0 viene droppato sul canvas → `DObject.new` in store → `modelObjectCount` cresce → auto-populate effect re-fira.
2. Step 2bis crea il vertice per Source_0.
3. Step 4 itera Source_0 (no features popolate, è appena creato) e tutti gli altri DObject. Per Edge_0, **Edge_0 non esiste ancora**.
4. Edge_0 viene droppato → `DObject.new` in store → `modelObjectCount` cresce → effect re-fira.
5. Step 2bis crea il vertice per Edge_0.
6. Step 4 itera Edge_0: le sue DValue `from`/`to` esistono ma `values = []` (DObject appena creato, senza slot popolati). Niente da creare.
7. Utente apre Slots panel → seleziona `Source_0` per `from` → `setValueAtPosition` (Info.tsx:644) → `SetFieldAction` su `idlookup[edge_0_dvalue_from].values = [source_0_id]`.
8. **Nessuna delle dep dell'auto-populate effect cambia.** L'effect non re-fira.
9. `elementSnapshots` rileva il cambio (hash `ch:${edge_0_vertex_id}` cambia perché include `child.values`, useJjomSync.ts:742-750) → incremental sync re-fira.
10. **Incremental sync NON crea edge nuovi**. Il branch "addedEdges" (useJjomSync.ts:910-955) si attiva solo per id in `currentIds \ prevIds` (cioè quando un nuovo subElement è in `subElementIds`) — nessun nuovo subElement esiste perché Step 4 non l'ha creato. Il branch "patchedEdges" (riga 1019-1031) si attiva solo per id già esistenti in cache — anch'esso non applica.
11. Stesso flow per `to = target_ojt`.
12. Risultato finale: vertice Edge_0 disegnato, slot popolate correttamente in Redux, ma **zero DVoidEdge** nel graph subElements → zero RF edges → Edge_0 appare come nodo standalone.

L'EdgeOverlay del classic editor (citato nel prompt come "L2") disegna invece l'arco completo perché legge una sorgente diversa (probabilmente direttamente i DObject + DValue.values, senza passare per DVoidEdge nel graph). Questo conferma che la materializzazione in Redux è completa e corretta — la rottura è esclusivamente alla fase di proiezione su DVoidEdge per il flow editor v2.
