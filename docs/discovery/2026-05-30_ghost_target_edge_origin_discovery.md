# Micro-discovery — origine dell'edge per reference cross off-canvas (Fase 1, READ-ONLY)

**Nome documento prompt**: 2026-05-30 — discovery_ghost_target_edge_origin
**Branch**: `alfonso-frontend-jjtl`
**Modalità**: sola lettura. Nessun file sorgente modificato. Citazioni `file:riga` verificate sul working tree.

## Sintesi esecutiva

La contraddizione si scioglie cosi': **per un target davvero off-canvas non nasce alcun edge** (confermata R5 della discovery 29/05). Il "riccio" che si vede e' un **self-loop**: la voce "Add reference" crea la reference col `type` di default = la classe stessa (`B -> B`, fallback `get_type` su `father`), e l'auto-populate del sync **crea legittimamente un `DVoidEdge B->B`** perche' il target (B) ha un vertice sul canvas. Quando poi si cambia `type` verso una classe cross off-canvas, il branch reconcile-or-create del sync **esce in anticipo** (`useJjomSync.ts:737`, manca `tgtVertex`), quindi il self-loop **non viene ne' ri-puntato ne' cancellato**: resta li', e `jjomEdgeToRFEdge` continua a disegnarlo (target da `edge.end`, ancora = B).

- **G1**: il riccio e' un `DVoidEdge` persistito (self-loop, `start === end ===` vertice sorgente), creato a `useJjomSync.ts:751` quando il type e' self/on-canvas; sopravvive al cambio type->cross per l'early-return `:737`.
- **G2**: il punto "non disegnarlo" e' `jjomEdgeToRFEdge` in `jjomTransformers.ts:458` (branch `edge.isReference`) -> `return null` se cross. **FUORI** dalla critical-zone. Invece "non generarlo / cancellare il leftover" vivrebbe nel reconcile di `useJjomSync.ts:733-808` -> **DENTRO** la critical-zone (finding da segnalare, non una via da prendere).
- **G3**: il dato del nodo sorgente (e quindi un futuro `ghostTargets`) ricalcola al cambio type (la firma del vertice include i `type` delle reference); ma il **self-loop gia' disegnato non si rimuove live** (il suo snapshot non cambia, e il patch path non rimuove su `null`): sparisce solo a reload/full-rebuild. Reattivita' = punto aperto, stessa famiglia del caveat `ghostParents`.

---

## G1 — Origine dell'edge degenere

**L'edge e' un `DVoidEdge` reale (self-loop), non un fallback di `jjomEdgeToRFEdge`.**

`jjomEdgeToRFEdge` ricava source/target **solo** da `edge.start`/`edge.end` e, se uno dei due manca, **ritorna null** (nessun edge fabbricato):
```typescript
// jjomTransformers.ts:402-406
const startVertex = edge.start;
const endVertex = edge.end;
if (!startVertex?.id || !endVertex?.id) {
    return null;
}
...
// branch reference (edge.isReference), jjomTransformers.ts:485-495
return { id: edge.id, source: startVertex.id, target: endVertex.id, type: 'reference', ... };
```
Quindi il transformer **non** crea da solo un self-loop: serve un `DVoidEdge` con `start`/`end` valorizzati.

**Da dove nasce il `DVoidEdge`.** La voce "Add reference" crea la reference **senza type**, che per fallback diventa self (`get_type` ripiega su `father`, `LModelElement.tsx:1404`). L'auto-populate del sync, per ogni reference della classe, risolve i vertici e crea l'edge:
```typescript
// useJjomSync.ts:733-757  (Step 3, branch References)
const targetId = typeof refObj.type === 'string' ? refObj.type : null;   // type self → = id della classe stessa
if (!targetId) continue;
const srcVertex = vertexIdByModelId.get(entry.id);
const tgtVertex = vertexIdByModelId.get(targetId);
if (!srcVertex || !tgtVertex) continue;                                  // :737  ← off-canvas esce QUI
...
if (decision.action === 'create') {
    if (!existingEdgeKeys.has(ek)) {
        DVoidEdge.new2(refId, graphId, graphId, undefined, srcVertex, tgtVertex,
            (d: DEdge) => { d.isReference = true; });                    // :751  ← crea il self-loop (srcVertex === tgtVertex)
        ...
    }
}
```
Per il type **self**, `targetId` = id della classe sorgente -> `tgtVertex === srcVertex` (entrambi presenti) -> viene creato `DVoidEdge` con `start === end` = vertice sorgente. `jjomEdgeToRFEdge` lo rende come `source === target` -> **self-loop** ("riccio sopra il nodo sorgente", cardinalita' staccata).

**Perche' sopravvive al passaggio a cross.** Quando si cambia `type` verso una classe **off-canvas**, `vertexIdByModelId.get(targetId)` e' `undefined` -> `tgtVertex` undefined -> **`continue` a `:737`**. Il branch reconcile (`:759-808`, che ri-punterebbe `edge.end` e cancellerebbe i duplicati) **non viene mai raggiunto**. Il self-loop resta nel modello con `end` = vecchio target (la classe stessa). `jjomEdgeToRFEdge` continua a derivarne il target da `edge.end` (cachato, `:403`), quindi disegna ancora il self-loop. E' la stessa "disconnessione strutturale" della discovery 28/05 (`end` cachato vs `model.type`), qui aggravata dal fatto che il fix-reconcile **non puo'** agire (target senza vertice).

**Per un target genuinamente off-canvas non nasce alcun edge.** Sia in creazione (`:737 continue`) sia in rendering full-rebuild (`useJjomSync.ts:1015`, `nodeCache.has(rfEdge.target)` falso) l'edge verso un vertice inesistente e' scartato. Quindi il riccio **richiede** che `edge.end` sia un vertice **on-canvas** -> nel caso tipico e' il **self** lasciato dal default di "Add reference".

---

## G2 — Punto di soppressione fuori critical-zone

Due semantiche distinte, con esiti opposti rispetto alla critical-zone:

### (a) "Non disegnare" l'edge cross — FUORI critical-zone ✓
Punto unico e naturale: `jjomEdgeToRFEdge`, branch `edge.isReference` (`jjomTransformers.ts:458-495`). Aggiungendo li' un check "se la reference e' cross -> `return null`", l'edge degenere non viene prodotto. Il file **`jjomTransformers.ts` NON e' nella lista critical-zone** (CLAUDE.md §3.1: useJjomSync, useM1ReferenceEdges, syncState, canvasToJjom, portDistribution, VersionFixer, defaultViewTemplate, DV; `jjomTransformers` non c'e'). E' inoltre il **chokepoint unico**: lo chiamano sia il full-rebuild (`useJjomSync.ts:1013`) sia il patch incrementale (`:1099`, `:1191`) sia `transformJjomGraph` (`:548`). Caveat di prudenza: e' sync-adjacent (tocca TUTTO il rendering degli edge) -> il check va scritto stretto sul caso reference cross.

Condizione "cross" calcolabile dai proxy gia' in scope nel transformer (`refModel = edge.model` = LReference; `sourceModel = startVertex.model` = LClass sorgente):
```typescript
// dentro il branch edge.isReference, refModel = edge.model
const tgtMetamodel = refModel?.type?.model?.id;       // metamodello del type corrente (B)
const srcMetamodel = sourceModel?.model?.id;          // metamodello della classe sorgente
const isCross = tgtMetamodel && srcMetamodel && tgtMetamodel !== srcMetamodel;
// → if (isCross) return null;
```
Nota: usa `refModel.type` (il type **corrente**, B), non `edge.end` (stale, = self) -> identifica il cross anche quando l'edge e' un self-loop residuo. In alternativa si puo' riusare il getter esistente `refModel.hasCrossReference` / `refModel.crossReferences` (`LModelElement.tsx:1253-1259`), ma quello dipende dal flag `allowCrossReference` (toggle), mentre il confronto sui `model.id` no.

### (b) "Non generare / cancellare" il `DVoidEdge` leftover — DENTRO critical-zone ✗ (finding)
Il leftover self-loop andrebbe **cancellato** quando il type passa a cross. Il posto e' il branch reconcile-or-create che oggi esce a `useJjomSync.ts:737` (`if (!srcVertex || !tgtVertex) continue;`): servirebbe un caso "target senza vertice -> elimina il `DVoidEdge` con questo refId". Questo e' **dentro `useJjomSync.ts`** = critical-zone (e tocca un `TRANSACTION` sync-adjacent, §3.3). **Da segnalare, non da intraprendere in questa direzione.** La via pulita resta (a): lasciare il dato residuo nel modello ma **non renderizzarlo**, e disegnare al suo posto il ghost-target stub.

---

## G3 — Reattivita' al cambio di type

**Dato del nodo (futuro `ghostTargets`): ricalcola sul cambio type.** La firma per-elemento del vertice include i `type` delle reference, quindi al cambio di `DReference.type` lo snapshot del **vertice sorgente** cambia e il patch incrementale ricomputa `jjomVertexToRFNode` -> patcha `data` se diverso:
```typescript
// useJjomSync.ts:1160-1189 (patch vertice)
if (isVertexClassName(className)) {
    const rfNode = jjomVertexToRFNode(lProxy);     // ricomputa data (oggi: references, ghostParents, ...)
    ...
    if (!existing || !shallowDataEqual(existing.data, rfNode.data)) {
        patchedNodeData.set(id, rfNode.data);      // → un ghostTargets calcolato qui verrebbe aggiornato live
    }
}
```
(Esiste anche il selettore dedicato `modelRefTypeSig`, `useJjomSync.ts:358-387`, che hasha tutte le coppie `(refId, type)` e fa ri-scattare l'auto-populate; serve al reconcile degli edge, non al data del nodo, ma conferma che il cambio type e' osservato dal sync.)

**Edge gia' disegnato (il riccio): NON si rimuove live.** Due ragioni:
1. Per il cross, il reconcile esce a `:737` -> `edge.end` non viene mai riscritto -> lo **snapshot dell'edge non cambia** -> il loop di patch (`:1140 if (!prevIds.has(id)) ...; :1153 if (... currHash === prevHash) continue;`) **non ri-elabora** quell'edge.
2. Anche se ri-elaborato, il patch path **non rimuove su `null`**: `const rfEdge = jjomEdgeToRFEdge(lProxy); if (rfEdge) { ... patchedEdges.set(...) }` (`:1191-1201`) — un `null` non cancella l'edge esistente, lo lascia com'e'.

Quindi una soppressione messa in `jjomEdgeToRFEdge` (G2a) ha effetto:
- **full-rebuild / reload** (`:1013`, dietro la guardia one-shot `:994 if (initializedRef.current) return;` o `modelid` change `:985`): l'edge `null` non rientra nella `edgeCache` -> riccio sparito. ✓
- **live, sul singolo cambio type->cross**: il riccio gia' a schermo **resta** finche' non c'e' un full-rebuild. ✗ (gap di reattivita').

**Conclusione G3**: il futuro `ghostTargets` (data del nodo) si aggiornera' al volo come gli altri campi del nodo; ma la **rimozione live del self-loop residuo** quando si va cross e' un **punto aperto** — analogo, in spirito, al caveat di reattivita' gia' annotato per `ghostParents` (extends). Disegnare lo stub e non l'edge funziona "pulito" dopo reload; per il live serve decidere come triggerare la rimozione dell'edge residuo (vedi Aperto).

---

## Aperto / Da decidere in chat

1. **Strategia di soppressione.** Confermare G2a: `return null` in `jjomEdgeToRFEdge` per le reference cross (fuori critical-zone, chokepoint unico, reattivo su full-rebuild). E' la via che non tocca `useJjomSync`/`portDistribution`.
2. **Leftover nel modello.** Con la sola (a), il `DVoidEdge` self-loop residuo **resta nel D-layer** (non renderizzato). E' accettabile come dato "morto" (verra' filtrato a ogni transform), o si vuole la pulizia? La pulizia richiede il reconcile in `useJjomSync.ts:737` = critical-zone (finding G2b): da valutare separatamente, con Layer Impact Report.
3. **Reattivita' live del riccio.** Sul passaggio type->cross il riccio gia' a schermo non si rimuove senza reload (G3). Decidere se: (i) accettare il reload come per `ghostParents`; (ii) trovare un trigger fuori critical-zone (es. un filtro reattivo lato `EditorV2` su `setEdges`/`applyDistribution`); (iii) affrontare la pulizia del `DVoidEdge` (punto 2, critical-zone).
4. **Condizione "cross".** Scegliere tra confronto diretto `refModel.type.model.id !== sourceModel.model.id` (indipendente dal toggle) e il getter `hasCrossReference`/`crossReferences` (dipende da `allowCrossReference`). Il confronto sui `model.id` e' piu' robusto e coerente col calcolo di `ghostParents` (`jjomTransformers.ts:111`, `p.model.id !== lClass.model.id`).
5. **Caso self legittimo.** Una reference davvero self (`A -> A`, non cross) deve continuare a mostrare il self-loop: la condizione di soppressione deve essere **solo cross** (`type.model.id !== source.model.id`), non "`source === target`", per non sopprimere i self-loop legittimi.
