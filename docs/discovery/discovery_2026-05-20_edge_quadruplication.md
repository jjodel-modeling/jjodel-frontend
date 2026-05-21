# Discovery: edge quadruplication on Ecore import (v2-flow)

**Data**: 2026-05-20
**Branch**: alfonso-frontend-jjtl
**Sintomo**: 2 EReference → 8 RF edges (4 cloni diretti + 4 cloni inversi), confermato da diag11.
**Modalità**: read-only, nessuna modifica al codice.

---

## D1 — Catena di generazione edge

### Mappa testuale del flusso

```
[1] XML Ecore (Families.ecore)
       ↓
[2] EcoreParser.parse()             api/data.ts:170
       ↓ parseM2Model → parseDPackage → parseDClass → parseDReference (per ogni EReference)
[3] parseDReference()               api/data.ts:904-946
       ↓ Crea UNA DReference per EReference. NESSUN DVoidEdge creato qui.
       ↓ (parent.references.push commentato out a riga 910, linking deferred)
[4] LinkAllNamesToIDs()             api/data.ts:181, definito alla 232
       ↓ Risolve nomi → id e popola DClass.references[]
[5] Constructors.persist()          api/data.ts:187
       ↓ Dispatch Redux delle DModelElement parsed
       ↓
[6] Redux state aggiornato: state.idlookup[DClassId].references = [DReferenceId, ...]
       ↓
[7] useJjomSync selectors fire      useJjomSync.ts:274,302,310,325
       ↓ modelClassCount, modelRefCount, subElementIds.length cambiano
       ↓
[8] useJjomSync auto-create effect  useJjomSync.ts:346-741
    deps: [modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]
       ↓
[8a] Step 1 — crea v2-flow DGraph se mancante     useJjomSync.ts:539-546
[8b] Step 2 — crea DVertex per ogni DClass        useJjomSync.ts:549-568
[8c] Step 3 — crea DVoidEdge per references       useJjomSync.ts:648-674
              chiave: `${refId}:${srcVertex}→${tgtVertex}` (composite)
              ⚠️ NO hasCanvasEdgePair check (riga 657-661 comment esplicito)
[8d] Step 3 — crea DVoidEdge per extends          useJjomSync.ts:623-646
              chiave: `${srcVertex}→${tgtVertex}` (pair-only)
              + hasCanvasEdgePair check
       ↓
[9] DVoidEdge.new2()                GraphDataElements.tsx:1874-1880
    Constructors.persist() ⇒ Redux dispatch via setTimeout(fn, 0) (action.ts:349 commento)
       ↓
[10] subElementIds.length aumenta → init effect deps cambiano
       ↓
[11] useJjomSync init effect         useJjomSync.ts:833-954
     ⚠️ Solo LEGGE, NON CREA edge. Trasforma lGraph.edges → RF Edge[].
       ↓
[12] lGraph.edges getter             GraphDataElements.tsx:763
     return subElements.filter(className.indexOf('Edge') >= 0)
     subElements è deduplicato con `[...new Set(...)]` in get_subElements (riga 793-794)
       ↓
[13] jjomEdgeToRFEdge()              jjomTransformers.ts:379-591
     Per ogni LEdge: extract start/end/model → RF Edge { id, source, target, sourceHandle, targetHandle, type, label, data }
       ↓
[14] setEdges(rfEdgesToSet)          useJjomSync.ts:943
     diag9 location='useJjomSync-init-effect' con edgeCount=8
       ↓
[15] EditorV2.setEdges callback wrapper       EditorV2.tsx:283-291
     applica deduplicateEdges (per `edge.id` — NON cattura cloni con id diversi)
       ↓
[16] setEdgesRaw → React Flow state → render
```

### Risposte specifiche

**Q: Qual è il/i file che traducono LReference/DReference (M2) in edge `Edge<...>` di `@xyflow/react`?**

Due file separati. Il path completo coinvolge una traduzione **a due stadi**:

1. **Stadio JjOM → DVoidEdge**: `frontend/src/components/editor-v2/hooks/useJjomSync.ts:648-674` (auto-create effect, Step 3). Itera `entry.raw.references` di ogni DClass e chiama `DVoidEdge.new2(refId, graphId, graphId, undefined, srcVertex, tgtVertex, setter)` con `setter` che setta `d.isReference = true`.
2. **Stadio DVoidEdge → RF Edge**: `frontend/src/components/editor-v2/utils/jjomTransformers.ts:379-591` (`jjomEdgeToRFEdge`). Estrae `start/end/model/isReference/isExtend` dall'LEdge proxy e restituisce un `Edge<>` con type 'reference' (riga 532-541) o 'inheritance' (riga 553-561).

Il bridge è `useJjomSync.ts:883-889` (init effect) che chiama `jjomEdgeToRFEdge` per ogni elemento di `lGraph.edges`.

**Q: C'è una funzione separata che genera gli edge "inversi" (`eOpposite`-like)?**

**No.** Non esiste alcuna funzione che generi edge inversi separati. L'`eOpposite` viene letto dal parser Ecore come pointer raw (`api/data.ts:928-944`) e salvato su `DReference.opposite`. Non triggera la creazione di un secondo edge.

I "4 edge inversi" osservati in diag11 (cluster N206→N204) sono in realtà l'altra EReference del metamodello — Families.ecore ha **2 EReference, una in ciascuna classe**, ciascuna che punta all'altra. La direzione "inversa" è l'EReference della classe target che punta indietro alla classe source. Non sono creati come "opposite" da nessun generator: sono semplicemente la seconda EReference iterata dal loop `for (const refId of entry.raw.references)`.

**Q: L'init-effect di `useJjomSync.ts` chiama un transformer che ritorna una List<Edge> già completa? O assembla incrementalmente da fonti multiple?**

Ritorna una **lista completa** trasformando 1-a-1 ogni `LEdge` di `lGraph.edges` in un RF Edge tramite `jjomEdgeToRFEdge`. Non assembla da fonti multiple: il "merge" che precede `setEdges` è solo `deduplicateInheritanceEdges` (utility locale che rimuove cloni di edge `type === 'inheritance'` con stesso `source→target`; non agisce sui reference edge).

```typescript
// useJjomSync.ts:883-889
for (const e of edges) {
    const rfEdge = jjomEdgeToRFEdge(e);
    if (rfEdge && nodeCache.has(rfEdge.source) && nodeCache.has(rfEdge.target)) {
        edgeCache.set(rfEdge.id, rfEdge);
    }
}
// :904
const rfEdgesToSet = deduplicateInheritanceEdges(Array.from(edgeCache.values()));
// :943
setEdges(rfEdgesToSet);
```

Conseguenza: **se `lGraph.edges` contiene 8 LEdge, l'init effect chiama setEdges con 8 RF Edge**. La traduzione è 1:1 (modulo orphan filter su nodeCache.has e modulo dedupe inheritance). L'init effect NON è la fonte della duplicazione: la duplicazione è già presente nel grafo Redux prima che l'init effect parta.

---

## D2 — Idempotenza init-effect useJjomSync

### Snippet completo

```typescript
// useJjomSync.ts:833-954
useEffect(() => {
    if (!isJjomMode || !modelid) {
        // Clear caches if no longer in JjOM mode
        if (initializedRef.current) {
            rfNodeCache.current.clear();
            rfEdgeCache.current.clear();
            prevElementsRef.current.clear();
            prevSubElementsRef.current = EMPTY_ARRAY;
            initializedRef.current = false;
        }
        return;
    }

    // Reset if modelid changed
    if (modelid !== prevModelidRef.current) {
        rfNodeCache.current.clear();
        rfEdgeCache.current.clear();
        prevElementsRef.current.clear();
        prevSubElementsRef.current = EMPTY_ARRAY;
        initializedRef.current = false;
        prevModelidRef.current = modelid;
    }

    if (initializedRef.current) return;         // ← GUARD idempotenza

    try {
        // Full transform using L-proxies
        const lGraph: any = LGraph.fromPointer(graphInfo!.graphId);
        if (!lGraph) return;

        const vertices: any[] = lGraph.nodes ?? [];
        const edges: any[] = lGraph.edges ?? [];

        // [diag6] init effect run — logs edgesFromLGetter, edgeIdsTail, timestamp

        const nodeCache = new Map<string, Node>();
        const edgeCache = new Map<string, Edge>();

        for (const v of vertices) {
            if (isSingletonSuppressed(v.id)) continue;
            const rfNode = jjomVertexToRFNode(v);
            if (rfNode) nodeCache.set(rfNode.id, rfNode);
        }
        for (const e of edges) {
            const rfEdge = jjomEdgeToRFEdge(e);
            // Skip orphan edges (source/target vertex not in graph)
            if (rfEdge && nodeCache.has(rfEdge.source) && nodeCache.has(rfEdge.target)) {
                edgeCache.set(rfEdge.id, rfEdge);
            }
        }

        rfNodeCache.current = nodeCache;
        rfEdgeCache.current = edgeCache;

        if (elementSnapshots) {
            prevElementsRef.current = new Map(elementSnapshots);
        }
        prevSubElementsRef.current = subElementIds;

        // Push to React Flow state
        const rfNodesToSet = Array.from(nodeCache.values());
        setNodes(rfNodesToSet);

        const rfEdgesToSet = deduplicateInheritanceEdges(Array.from(edgeCache.values()));
        // [diag7] RF nodes registered
        // [diag8] rfEdges JSON dump
        // [diag6] setEdges call
        // [diag9] setEdges location=useJjomSync-init-effect
        setEdges(rfEdgesToSet);                  // ← SET ASSOLUTO, non updater

        initializedRef.current = true;           // ← Mark inizializzato

        if (onInitialized) {
            requestAnimationFrame(() => onInitialized());
        }
    } catch (err) {
        console.warn('[useJjomSync] Initialization error:', err);
    }
}, [isJjomMode, modelid, graphInfo, elementSnapshots, setNodes, setEdges, subElementIds]);
```

### Commento di idempotenza

**L'init effect È idempotente** all'interno di un singolo mount lifecycle. Tre meccanismi lo garantiscono:

1. **Guard `if (initializedRef.current) return;` (riga 856)**: dopo il primo run setta `initializedRef.current = true` (riga 945). I run successivi tornano subito.
2. **Reset selettivo (righe 834-854)**: il flag torna a `false` solo se (a) `isJjomMode` diventa falso, (b) `modelid` cambia identità, o (c) il componente si unmount-a (cleanup riga 1240-1252 che chiama `initializedRef.current = false`).
3. **`setEdges(rfEdgesToSet)` è una set ASSOLUTA** (riga 943, non un updater): se ri-fired, ricalcolerebbe la stessa lista da `lGraph.edges` e la setterebbe come array assoluto, **non accumulando**. Non c'è append.

**Conclusione D2: l'init effect non è la fonte della quadruplicazione.** Anche se ri-fired (es. React StrictMode mount/unmount/mount), il primo run vede già 8 D-edge in `lGraph.edges` e setta 8 RF edge. Il secondo run vedrebbe ancora 8, setterebbe ancora 8 — non 16. La duplicazione è già consolidata in Redux **prima** che l'init effect parta.

**Caveat — implicazione di React StrictMode**: il cleanup (riga 1240-1252) ripristina `initializedRef.current = false` e `clearCanvasEdgePairs()`. Su re-mount, l'init effect parte di nuovo e re-trasforma da `lGraph.edges`. Ma poiché legge un valore già duplicato, ricicla la stessa duplicazione — non l'amplifica. **Il bug è upstream, nell'auto-create effect.**

---

## D3 — Dedupe hasCanvasEdgePair nel path M2

### Risposta: **NO, il path M2 reference non interroga `hasCanvasEdgePair`.**

Citazione del codice in `useJjomSync.ts:648-674`:

```typescript
// References
for (const refId of (entry.raw.references ?? [])) {
    const refObj = typeof refId === 'string' ? idlookup[refId] as any : null;
    if (!refObj) continue;
    const targetId = typeof refObj.type === 'string' ? refObj.type : null;
    if (!targetId) continue;
    const srcVertex = vertexIdByModelId.get(entry.id);
    const tgtVertex = vertexIdByModelId.get(targetId);
    if (srcVertex && tgtVertex) {
        // Composite key allows multiple references between the
        // same pair (Family→Member: father, mother, sons, ...).
        // hasCanvasEdgePair is pair-based and would block siblings,
        // so it's not consulted here — race-window protection is
        // provided by the idlookup scan above.
        const ek = `${refId}:${srcVertex}→${tgtVertex}`;
        if (!existingEdgeKeys.has(ek)) {
            DVoidEdge.new2(
                refId, graphId, graphId, undefined,
                srcVertex, tgtVertex,
                (d: DEdge) => { d.isReference = true; }
            );
            existingEdgeKeys.add(ek);
            markCanvasEdgePair(srcVertex, tgtVertex);
        }
    }
}
```

**Note esplicite nel codice (riga 657-661):**
> Composite key allows multiple references between the same pair (Family→Member: father, mother, sons, ...). hasCanvasEdgePair is pair-based and would block siblings, so it's not consulted here — race-window protection is provided by the idlookup scan above.

Confronto con il path **inheritance** (riga 623-646) — che invece USA `hasCanvasEdgePair`:

```typescript
// Extends (inheritance)
for (const supId of (entry.raw.extends ?? [])) {
    // ...
    const ek = `${srcVertex}→${tgtVertex}`;
    if (!existingEdgeKeys.has(ek) && !hasCanvasEdgePair(ek)) {  // ← AND hasCanvasEdgePair
        DVoidEdge.new2(...);
        existingEdgeKeys.add(ek);
        markCanvasEdgePair(srcVertex, tgtVertex);
    }
}
```

### Struttura del dedupe sul path M2

Il path M2 reference fa affidamento su **un solo meccanismo di dedupe**: il Set locale `existingEdgeKeys`, popolato in 3 passi prima del loop di creazione:

1. **Scan subElements del graph corrente** (useJjomSync.ts:414-426): per ogni edge in `graph.subElements`, aggiunge `edgeKeyForD(se)` a `existingEdgeKeys`.
2. **Scan rfEdgeCache** (useJjomSync.ts:428-437): per ogni RF edge già cached, aggiunge una chiave composite o pair.
3. **Race-window safety net** (useJjomSync.ts:439-450): scansiona TUTTO `idlookup` cercando edge i cui endpoint sono vertex del nostro grafo, e ne aggiunge la chiave composite.

La chiave composite usata sia per dedupe sia per il match scan è generata da `edgeKeyForD` (useJjomSync.ts:407-412):

```typescript
const edgeKeyForD = (se: any): string => {
    const refIdPtr = typeof se?.model === 'string' ? se.model : null;
    return refIdPtr
        ? `${refIdPtr}:${se.start}→${se.end}`
        : `${se.start}→${se.end}`;
};
```

La chiave è composite (`refId:src→tgt`) **se e solo se** `se.model` è una stringa (DReference pointer). Se `se.model` fosse undefined/null/oggetto, fallback a pair-only — divergerebbe dalla chiave usata nel check di creazione (`${refId}:${srcVertex}→${tgtVertex}`) e il dedupe sarebbe inefficace per quel singolo edge.

Anche `useM1ReferenceEdges.ts:106` (path M1, separato) usa `hasCanvasEdgePair` ma con chiave pair-only `srcV→tgtV` — non rilevante per M2 references da metamodelli importati.

### Esiste un altro dedupe?

No, non c'è un secondo Map o livello di dedupe oltre a `existingEdgeKeys` sulla path M2. Il dedupe React-level (`deduplicateEdges` in `EditorV2.tsx:267-280`) opera per `edge.id` ed è inefficace contro cloni con id diversi ma stessi endpoint/handles (esattamente il pattern osservato in diag11).

---

## Conclusione

Il punto di quadruplicazione **non** è nel render path (init effect): l'init effect è idempotente e si limita a trasformare 1:1 `lGraph.edges` → RF Edge[]. Quando `[diag9]` registra `edgeCount=8` nel location `useJjomSync-init-effect`, le 8 DVoidEdge sono già consolidate in Redux.

La duplicazione avviene **a monte**, nell'**auto-create effect di `useJjomSync.ts:346-741`**, e in particolare nella sezione M2 references **righe 648-674**, dove l'unico meccanismo di dedupe è il Set locale `existingEdgeKeys` con chiave composite `${refId}:${srcVertex}→${tgtVertex}`. La protezione race-window della safety net (righe 439-450) dipende dal fatto che ogni DVoidEdge in `idlookup` abbia `se.model` di tipo string e dal fatto che `idlookup` rifletta sincronicamente i dispatch di `DVoidEdge.new2`. Le deps dell'effect (`[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]`) cambiano almeno 4-5 volte durante un singolo import Ecore — re-firing dell'effect prima del consolidamento di `idlookup` aprirebbe esattamente una finestra di duplicazione 4× compatibile con quanto osservato in diag11.

L'assenza dell'`hasCanvasEdgePair` check sul path M2 references è intenzionale (per supportare sibling refs come Family→Member: father, mother) e non è quindi un bug-fix candidato diretto: serve invece un meccanismo di dedupe robusto contro race-window — verosimilmente promuovere `existingEdgeKeys` da locale del singolo effect run a registry persistente (analogo a `canvasEdgePairs` di `syncState.ts` ma con chiavi composite), o garantire che `DVoidEdge.new2` aggiorni `idlookup` sincronicamente prima di restituire.

---

## Allegati

- **diag9** (commit `d04de7af6`): instrumentazione di tutti i caller di `setEdges` per discriminare T2/T4 (location + timestamp + edgeCount). Output critico: `location=useJjomSync-init-effect, edgeCount=8`.
- **diag10** (commit `b8388167e`): confronto DOM handle vs endpoint edge. Conferma che tutti i 64 handle DOM esistono e gli 8 endpoint puntano a handle validi.
- **diag11** (commit `e448079c8`): dump JSON + `console.table` + duplicate analysis su `props.edges` di ReactFlow. Output critico: 8 edge in 2 cluster da 4 cloni perfetti (N204→N206 right-0/left-0 × 4; N206→N204 left-0/right-0 × 4).
- **diag6/7/8** (in useJjomSync.ts:867-942): logging già esistente nell'init effect — `[diag6] init effect run` (edgesFromLGetter), `[diag7] RF nodes registered`, `[diag8] rfEdges JSON dump`.

### File coinvolti nella catena (riferimenti)

| Step | File | Righe | Ruolo |
|------|------|-------|-------|
| Parse Ecore | `frontend/src/api/data.ts` | 170-195 | `EcoreParser.parse()` |
| Crea DReference | `frontend/src/api/data.ts` | 904-946 | `parseDReference()` |
| Risolve names | `frontend/src/api/data.ts` | 232+ | `LinkAllNamesToIDs()` |
| Auto-create graph + edge | `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | 346-741 | Auto-populate effect |
| M2 ref edge creation | `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | 648-674 | DVoidEdge.new2 per references |
| Race-window scan | `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | 439-450 | idlookup composite-key scan |
| edgeKeyForD | `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | 407-412 | Generator chiave composite/pair |
| Init effect | `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | 833-954 | Lettura lGraph.edges → setEdges |
| jjomEdgeToRFEdge | `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | 379-591 | LEdge → RF Edge |
| lGraph.edges getter | `frontend/src/model/dataStructure/GraphDataElements.tsx` | 763 | subElements filter |
| DVoidEdge.new2 | `frontend/src/model/dataStructure/GraphDataElements.tsx` | 1874-1880 | Costruttore DVoidEdge |
| setEdges dedup wrapper | `frontend/src/components/editor-v2/EditorV2.tsx` | 267-291 | dedupe per id (inefficace) |
| syncState helpers | `frontend/src/components/editor-v2/sync/syncState.ts` | 129-141 | markCanvasEdgePair/hasCanvasEdgePair |
| useM1ReferenceEdges (M1) | `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` | 30-132 | path separato per M1 (non M2) |
