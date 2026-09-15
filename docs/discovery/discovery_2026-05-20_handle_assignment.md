# Discovery: handle assignment per RF edges in v2-flow

**Data**: 2026-05-20
**Branch**: alfonso-frontend-jjtl
**Sintomo**: 4 dei 8 edge inversi (Member→Family) hanno sourceHandle=left-0 e targetHandle=right-0 mentre i 4 diretti hanno right-0/left-0. Lo screenshot del rendering mostra incompletezza nella seconda direzione.
**Modalità**: read-only.

---

## Q1 — Funzione di assignment

Il valore di `sourceHandle` e `targetHandle` per ogni RF Edge generato da un `LEdge` JjOM è deciso in **due stadi**:

### Stadio 1 — `computeOptimalHandles` (assegnazione del lato)

File: `frontend/src/components/editor-v2/utils/jjomTransformers.ts:327-373`

```typescript
function computeOptimalHandles(
    sourceVertex: any,
    targetVertex: any,
    isInheritance: boolean = false,
): { sourceHandle: string; targetHandle: string } {
    // Use __raw to get reliable numeric values — LProxy getters return {}
    // instead of numbers, which causes NaN and wrong fallthrough.
    const sRaw = sourceVertex?.__raw ?? sourceVertex;
    const tRaw = targetVertex?.__raw ?? targetVertex;
    const sx = typeof sRaw?.x === 'number' ? sRaw.x : 0;
    const sy = typeof sRaw?.y === 'number' ? sRaw.y : 0;
    const sw = typeof sRaw?.w === 'number' ? sRaw.w : 180;
    const sh = typeof sRaw?.h === 'number' ? sRaw.h : 80;
    const tx = typeof tRaw?.x === 'number' ? tRaw.x : 0;
    const ty = typeof tRaw?.y === 'number' ? tRaw.y : 0;
    const tw = typeof tRaw?.w === 'number' ? tRaw.w : 180;
    const th = typeof tRaw?.h === 'number' ? tRaw.h : 80;

    const scx = sx + sw / 2;
    const scy = sy + sh / 2;
    const tcx = tx + tw / 2;
    const tcy = ty + th / 2;

    const dx = tcx - scx;
    const dy = tcy - scy;

    if (isInheritance) {
        // Inheritance always anchors child=top, parent=bottom
        return { sourceHandle: 'top-0', targetHandle: 'bottom-0' };
    }

    // Non-inheritance: use dominant axis
    if (Math.abs(dy) >= Math.abs(dx)) {
        if (dy < 0) {
            return { sourceHandle: 'top-0', targetHandle: 'bottom-0' };
        } else {
            return { sourceHandle: 'bottom-0', targetHandle: 'top-0' };
        }
    } else {
        if (dx > 0) {
            return { sourceHandle: 'right-0', targetHandle: 'left-0' };
        } else {
            return { sourceHandle: 'left-0', targetHandle: 'right-0' };
        }
    }
}
```

Punto di chiamata in `jjomEdgeToRFEdge` (stesso file):

```typescript
// jjomTransformers.ts:420-422
// Compute optimal handle sides from vertex positions
const isInheritance = !!edge.isExtend;
const handles = computeOptimalHandles(startVertex, endVertex, isInheritance);
```

Il valore di `handles` viene poi usato in tutti i return branch di `jjomEdgeToRFEdge` (M1 composition, M1 instanceRef, M2 reference, inheritance, fallback). Per il branch M2 reference (rilevante per Families.ecore):

```typescript
// jjomTransformers.ts:532-541
return {
    id: edge.id,
    source: startVertex.id,
    target: endVertex.id,
    sourceHandle: handles.sourceHandle,
    targetHandle: handles.targetHandle,
    type: 'reference',
    label: refModel?.name ?? '',
    data: refData,
};
```

### Stadio 2 — `applyDistribution` (eventuale riassegnazione dell'indice del lato)

File: `frontend/src/components/editor-v2/EditorV2.tsx:770-790`

```typescript
const applyDistribution = useCallback((edgeList: Edge[]): Edge[] => {
    const currentNodes = getNodes();
    const nodeIds = currentNodes.map(n => n.id);
    const positions = buildNodePositions(currentNodes);

    const { edgeHandles } = computePortDistribution(edgeList, nodeIds, positions);

    return edgeList.map(edge => {
        const distributed = edgeHandles.get(edge.id);
        if (distributed &&
            (edge.sourceHandle !== distributed.sourceHandle ||
             edge.targetHandle !== distributed.targetHandle)) {
            return {
                ...edge,
                sourceHandle: distributed.sourceHandle,
                targetHandle: distributed.targetHandle,
            };
        }
        return edge;
    });
}, [getNodes, buildNodePositions]);
```

`applyDistribution` chiama `computePortDistribution` definita in `frontend/src/components/editor-v2/utils/portDistribution.ts:61-227`. La funzione:

- Estrae il lato base di ogni handle esistente tramite `getBaseSide` (`portDistribution.ts:37-44`), che split su `-` e ritorna `'right'`/`'left'`/`'top'`/`'bottom'`.
- Raggruppa gli edge per chiave `${nodeId}:${side}` (`portDistribution.ts:69-140`).
- Per non-inheritance edges: ogni edge va in un proprio gruppo (`portDistribution.ts:100-108` per source; `131-139` per target).
- Riassegna handle IDs come `${side}-${index}` con index incrementale per ogni gruppo (`portDistribution.ts:162-178`).

Punti di chiamata di `applyDistribution` rilevanti per l'init di un import (visti via grep):
- `EditorV2.tsx:329-330` — dentro la `onInitialized` callback passata a `useJjomSync`, eseguita dopo l'init effect dentro `setTimeout(…, 50)`.
- Altri site post-azione utente: `pendingConnection-addEdge` (1269), `m1ReferenceSelected-addEdge` (1382), `handleReconnect` (1414), `deleteSelected-jjom-otherNodes` (1668), `deleteSelected-nonjjom` (1688), `useClassRemoval` (796).

---

## Q2 — Regola di assegnazione

### Stadio 1 (`computeOptimalHandles`)

Regola **(b) direzione-aware**, basata sul vettore tra i centri dei nodi:

- `dx = targetCenter.x - sourceCenter.x`
- `dy = targetCenter.y - sourceCenter.y`

Decisione (riga 360-372):

| Condizione | sourceHandle | targetHandle |
|------------|--------------|--------------|
| `isInheritance` (override forzato, riga 353-357) | `top-0` | `bottom-0` |
| `|dy| >= |dx|` e `dy < 0` | `top-0` | `bottom-0` |
| `|dy| >= |dx|` e `dy >= 0` | `bottom-0` | `top-0` |
| `|dy| < |dx|` e `dx > 0` | `right-0` | `left-0` |
| `|dy| < |dx|` e `dx <= 0` | `left-0` | `right-0` |

Index del lato sempre `-0` (Stadio 1 non gestisce indici multipli).

**Caso 4 edge Member→Family (source=206, target=204)**: assumendo che 204 sia a sinistra di 206 nello spazio canvas, si ha `dx < 0`. Se inoltre l'asse orizzontale è dominante (`|dy| < |dx|`), il match è il ramo `dx <= 0` → ritorna `{ sourceHandle: 'left-0', targetHandle: 'right-0' }` (jjomTransformers.ts:370-371). Questo è esattamente il valore osservato nel diag11 per tutti e 4 gli edge inversi.

### Stadio 2 (`computePortDistribution`)

Regola **(d) round-robin con spatial sort**, condizionata al raggruppamento per `nodeId:side`:

- Tutti gli edge che condividono `${source}:${baseSide}` come chiave (rispettivamente `${target}:${baseSide}`) finiscono nello stesso group bucket.
- Ogni edge non-inheritance ottiene un proprio sub-group dentro il bucket (`portDistribution.ts:100-108` / `131-139`).
- I sub-group vengono ordinati spazialmente (`portDistribution.ts:142-157`) per centro del nodo altro.
- L'index handle viene assegnato come `${side}-${groupIndex}` (`portDistribution.ts:162-178`).

In assenza di un override (`distributed` undefined o uguale all'esistente), `applyDistribution` lascia gli handle invariati (EditorV2.tsx:779-787).

---

## Q3 — Code path simmetrico o asimmetrico

**Same function.** Le due direzioni passano attraverso lo **stesso** code path.

Citazione:

```typescript
// jjomTransformers.ts:420-422 (eseguito una volta per ogni edge, NO branch per direzione)
const isInheritance = !!edge.isExtend;
const handles = computeOptimalHandles(startVertex, endVertex, isInheritance);
```

E nel branch `edge.isReference` (M2 reference, riga 497-542) entrambi i set di edge restituiscono lo stesso shape:

```typescript
// jjomTransformers.ts:532-541
return {
    id: edge.id,
    source: startVertex.id,
    target: endVertex.id,
    sourceHandle: handles.sourceHandle,
    targetHandle: handles.targetHandle,
    type: 'reference',
    label: refModel?.name ?? '',
    data: refData,
};
```

Non esiste in `jjomTransformers.ts` né in `useJjomSync.ts` un branch che distingua "edge diretti" da "edge inversi" né alcuna logica basata su `eOpposite` per la scelta degli handle. La differenza nei valori finali (`right-0`/`left-0` vs `left-0`/`right-0`) è prodotta dalla **stessa funzione** in virtù del fatto che `dx = target.center.x - source.center.x` cambia segno quando si invertono `source` e `target`.

Anche lo Stadio 2 (`computePortDistribution`) usa lo stesso loop su `edges` (`portDistribution.ts:72-140`) senza distinzione di direzione.

---

## Allegati

- **diag9** (commit `d04de7af6`): instrumentazione setEdges-callers — log location `useJjomSync-init-effect` mostra che gli 8 edge sono passati a `setEdges` in un singolo array dall'init effect.
- **diag10** (commit `b8388167e`): handle DOM inventory + diff endpoint→handle presence — confermò che tutti gli 8 endpoint matchano handle DOM esistenti.
- **diag11** (commit `e448079c8`): JSON dump + `console.table` + duplicate analysis — fornisce gli 8 edge nel formato `{source, target, sourceHandle, targetHandle}` su cui questa discovery si basa.
- **diag12** (commit `666ba1c96`): `console.count` su auto-create-effect-FIRED e DVoidEdge.new2 EMITTED — discriminò scenario re-firing.
- **diag13** (commit `1402e03bc`): log `entry.raw.references.length` pre-loop — confermò che il modello M2 contiene 4 reference per EClass (8 totali, legittimo).
- **Cleanup** (commit `147ca2620`): rimozione di tutti i diag9-13.

### File coinvolti nella catena di handle assignment

| File | Righe | Ruolo |
|------|-------|-------|
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | 327-373 | `computeOptimalHandles` (Stadio 1) |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | 422 | sito di chiamata di `computeOptimalHandles` |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | 532-541 | branch M2 reference: shape `Edge` con handles |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | 553-561 | branch inheritance: shape `Edge` con handles |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | 572-590 | branch fallback: shape `Edge` con handles |
| `frontend/src/components/editor-v2/EditorV2.tsx` | 770-790 | `applyDistribution` (Stadio 2 wrapper) |
| `frontend/src/components/editor-v2/EditorV2.tsx` | 329-330 | call site `applyDistribution` dentro onInitialized |
| `frontend/src/components/editor-v2/utils/portDistribution.ts` | 61-227 | `computePortDistribution` (Stadio 2 core) |
| `frontend/src/components/editor-v2/utils/portDistribution.ts` | 37-44 | `getBaseSide` (estrae lato base da handleId) |
