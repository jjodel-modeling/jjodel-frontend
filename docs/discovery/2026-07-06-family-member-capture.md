# Step A — Cattura formale del bundle Family↔Member (verdetto S1)

**Data**: 2026-07-06 20:44
**Tipo**: riproduzione + specifica (Fase 2, Step A)
**Prerequisito**: `docs/discovery/2026-07-06-anchor-ordering-manhattan.md` (§0, sospetto S1)
**Metodo**: riproduzione headless attraverso la **pipeline reale** (nessuna app, nessuna fixture a memoria — §5.1)

---

## 1. Fixture

Due classi affiancate, con un leggero offset verticale così che le route siano **Z a 4 punti**
(altrimenti `routeOppositeH` fa snap a linea retta e `applyBundleSpread` non ingaggia):

| Nodo | x | y | w | h | centro |
|------|---|---|---|---|--------|
| `Family` | 0 | 0 | 180 | 120 | (90, 60) |
| `Member` | 400 | 40 | 180 | 120 | (490, 100) |

8 reference tra la coppia: 4 **containment** `Family→Member` (id `a,c,e,g`) + 4 **eOpposite**
`Member→Family` (id `b,d,f,h`), con id interlacciati così che l'ordine fisico per `edgeId`
(`byPairStable`) alterni le due direzioni — esattamente il caso di *tie sul centroide* che la
discovery segnala per S1. Lati base come li assegnerebbe `computeOptimalHandles` (Member a destra di
Family, asse x dominante): containment `right-0`→`left-0`, eOpposite `left-0`→`right-0`.

## 2. Metodo (pipeline reale usata, sola lettura)

1. `computePortDistribution(edges, ['Family','Member'], positions)` → **indici** handle reali
   (`portDistribution.ts`, STEP 2 con tie sul centroide → ordine di iterazione, nessun tiebreak
   pair-stable).
2. `computeSideEndpoints` + `computeSidePositions(endpoints, positions)` per `Member.left` e
   `Family.right` → **frazioni fisiche** reali (`handlePosition.ts`, `byGeometry`→tie→`byPairStable`
   su `edgeId`).
3. coordinate anchor da (rect nodo + frazione), `computeManhattanPath` → path a 4 punti.
4. `applyBundleSpread` **copia verbatim del corrente** (`UnifiedEdge.tsx:64-103`, offset per indice)
   → `spreadPoints`.
5. conteggio incroci: intersezioni proprie H×V tra i path (contate a coppie di edge).

Harness temporaneo (`edges/__tests__/_s1_capture.test.ts`), **rimosso** dopo la trascrizione (nessuna
strumentazione committata).

## 3. Dati catturati (8 edge)

| edge | dir | sH | tH | srcFrac | tgtFrac | meanY | **trunkX** (corrente) | pts |
|------|-----|----|----|---------|---------|-------|-----------------------|-----|
| a | Fam→Mem | right-0 | left-0 | 0.111 | 0.111 | 33.3 | **296.0** | 4 |
| b | Mem→Fam | left-0 | right-0 | 0.222 | 0.222 | 46.7 | **284.0** | 4 |
| c | Fam→Mem | right-1 | left-1 | 0.333 | 0.333 | 60.0 | **308.0** | 4 |
| d | Mem→Fam | left-1 | right-1 | 0.444 | 0.444 | 73.3 | **272.0** | 4 |
| e | Fam→Mem | right-2 | left-2 | 0.556 | 0.556 | 86.7 | **320.0** | 4 |
| f | Mem→Fam | left-2 | right-2 | 0.667 | 0.667 | 100.0 | **260.0** | 4 |
| g | Fam→Mem | right-3 | left-3 | 0.778 | 0.778 | 113.3 | **332.0** | 4 |
| h | Mem→Fam | left-3 | right-3 | 0.889 | 0.889 | 126.7 | **248.0** | 4 |

**Incroci (path): 6 coppie** → `a×c, b×c, c×e, d×e, e×g, f×g`.

## 4. Verifica meccanica e verdetto S1

- **Ordine fisico corretto e allineato**: le frazioni `computeSidePositions` ordinano gli edge
  `a,b,c,d,e,f,g,h` dall'alto (0.111) al basso (0.889), **identiche su entrambi i lati**
  (`srcFrac==tgtFrac` per ogni edge) → `byPairStable` funziona: gli edge sono geometricamente
  paralleli/annidabili a zero incroci **se i trunk rispettano quest'ordine**.
- **`meanY` monotòna** nell'ordine fisico: 33.3 → 126.7.
- **`trunkX` (corrente) NON monotòna**: 296, 284, 308, 272, 320, 260, 332, 248. I 4 containment
  ventagliano a **destra** crescente (296→332), i 4 eOpposite a **sinistra** decrescente (284→248),
  perché `directionSign = source<target ? 1 : -1` splitta le due direzioni ai lati opposti del
  corridoio, e l'entità è `(sourceIndex+targetIndex+1)*6` (indice, non frazione).
- Poiché l'ordine dei trunk (per indice+direzione) contraddice l'ordine verticale degli anchor (per
  frazione fisica), i corridoi **si scavalcano** → **6 incroci**.

**VERDETTO: S1 CONFERMATO.** La causa dei 6 incroci è esattamente `applyBundleSpread` che offsetta il
corridoio **per indice handle e per direzione**, invece che per la **posizione fisica** (frazione) già
calcolata, corretta e allineata da `computeSidePositions`. Il conteggio (6) coincide con i "6+ incroci"
riportati nel prompt. **Nessun checkpoint di stop: si procede allo Step B.**

## 5. Criterio d'accettazione per lo Step B (verificabile meccanicamente)

Sullo stesso bundle, dopo il fix di `applyBundleSpread`:

- **AC1 — zero incroci**: `countCrossings(spreadPaths).pairs === 0`.
- **AC2 — offset monotòni nella frazione fisica**: ordinando gli edge per `meanY`, la sequenza dei
  `trunkX` (per corridoio verticale) — o `trunkY` (per corridoio orizzontale) — è **monotòna** (nessuna
  coppia di trunk che inverte l'ordine → corridoi annidati).
- **AC3 — invarianti preservati**: `spreadPoints.length === 4` per ogni edge (numero di segmenti
  invariato → i waypoint `{segmentIndex,offset}` restano validi, rischio R2); spread applicato solo su Z
  a 4 punti; nessuna modifica per inheritance/self-loop/edge con waypoint.

---

## Nota di scope

L'harness di cattura ha dimostrato che `applyBundleSpread` **non è unit-testabile importando
`UnifiedEdge.tsx`**: sotto vitest (`environment: 'node'`) l'import del `.tsx` tira il grafo
`canvasToJjom → joiner/monaco` e lancia `ReferenceError: window is not defined`. Tutti i test del repo
importano util `.ts` pure. Perciò lo Step B **estrae** `applyBundleSpread` in un modulo puro
`edges/bundleSpread.ts` (nessuna dipendenza React/ReactFlow), importato da `UnifiedEdge.tsx` e testato
in isolamento — addizione necessaria per il test richiesto dal prompt (§4.1 CLAUDE.md), segnalata qui.
