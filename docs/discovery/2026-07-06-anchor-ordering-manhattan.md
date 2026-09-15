# Discovery — Anchor ordering & Manhattan routing per la minimizzazione degli incroci (v2-flow)

**Data**: 2026-07-06 13:36
**Tipo**: discovery Fase 1, **READ-ONLY** (nessuna modifica a file sorgente)
**Critical-zone coinvolta**: `portDistribution.ts` (§3.10), `handlePosition.ts`, `DynamicHandles.tsx`
**Fixture di riferimento**: `Families.ecore` — `Family`/`Member` collegate da 8 reference (4 containment + 4 eOpposite)
**HARD STOP**: al termine di questo documento. La Fase 2 (implementazione) parte solo dopo go-ahead esplicito.

---

## 0. Sintesi (TL;DR) — leggere prima di tutto

**Il "sort baricentrico delle porte per la y dell'endpoint opposto" che il prompt propone come leva
(a) della Fase 2 è GIÀ IMPLEMENTATO E MERGIATO.** Vive in due punti coordinati:

1. `portDistribution.ts` **STEP 2** (`:142-157`): ordina i gruppi-porta *dentro ogni bucket di ruolo*
   per il centroide del nodo opposto → incide l'ordine spaziale nell'**indice** dell'handle.
2. `handlePosition.ts::computeSidePositions` (`:184-271`): il vero posizionatore fisico. Ordina gli
   endpoint reference di un lato con **`byGeometry`** (centroide opposto, `:230-235`) + tiebreak
   **`byPairStable`** sull'`edgeId` (`:223-226`), inheritance pinnata al centro. Committato come
   `71335c17e` (geometry-aware, 2026-05-27) + `f8fe3e2eb` (pair-stable, 2026-06-05).

**Conseguenza forte sul caso Family↔Member.** Se gli 8 edge stanno su una coppia di lati *frontali*
(es. `Member.left` ↔ `Family.right`), il centroide opposto è identico per tutti e 8 gli endpoint
(puntano all'unico nodo opposto) → `byGeometry` pareggia → subentra `byPairStable(edgeId)`. Poiché lo
**stesso** edge ha lo stesso `edgeId` su entrambi i lati, riceve lo **stesso rank** su entrambi →
frazione `(rank+1)/(N+1)` identica sui due lati → percorsi **paralleli** → **zero incroci per
costruzione** (indipendentemente da altezze/nodi diversi: l'ordine è monotòno). Questo è esattamente
il caso che i commenti di `handlePosition.ts:170-178` dichiarano "collision-free" e che le discovery
precedenti (05-25 role_segregation §S4, 05-27 §D6) trattano come **già corretto**, non come la causa
del bug d'inversione (che era il caso *cross-role 1+1*, ora risolto).

**Quindi**: la premessa del prompt ("6+ incroci evitabili perché l'ordine sorgente non corrisponde
all'ordine target") **non è riproducibile dal solo ordinamento intra-lato sul codice attuale** per un
bundle frontale pulito. Per §5.1 di CLAUDE.md ("non fidarsi di fixture a memoria tra sessioni;
riprodurre prima; verificare che l'output sia consumato") la Fase 2 **deve prima riprodurre lo stato
renderizzato attuale** ed estrarre una specifica formale, PRIMA di ricostruire un sort che esiste già.

**I veri sospetti ancora aperti** che possono produrre il sintomo osservato (in ordine di probabilità):

- **S1 — `applyBundleSpread` scavalca l'ordine baricentrico.** Lo spread del corridoio centrale
  (`UnifiedEdge.tsx:64-103`) offsetta *per indice handle* (`(sourceIndex+targetIndex+1)*6px`), **non**
  per la frazione geometrica. Con `directionSign = source<target ? 1 : -1` (`:75`) i 4 containment e i
  4 eOpposite vengono spinti su lati opposti del corridoio. Se l'offset per-indice contraddice l'ordine
  verticale degli anchor (baricentrico), i segmenti **si incrociano nel corridoio centrale** pur avendo
  anchor ordinati. Fires solo su Z a 4 punti (`:71`) — che è esattamente la forma del bundle frontale
  `routeOppositeH`. **Sospetto primario, verificabile.**
- **S2 — collasso delle label** (non incroci di path). Le label ruolo sono ancorate al *midpoint
  d'arco* del path (`computeLabelPosition`, `edgeUtils.ts:799-833`); il de-overlap `roleArcShift` scorre
  solo *lungo* l'arco (nessun stacking perpendicolare, nessuna collision detection) e `cardinalityShift`
  raggruppa per (target,side) spezzando la coppia eOpposite. 8 label near-collineari → si sovrappongono.
  Questo *da solo* legge come "caos" anche con zero incroci di path.
- **S3 — lane/overlap dei path**. `laneSeparation.ts` è **Phase A inerte** (`LANE_DEBUG=true`, nessun
  offset prodotto). Fuori dalla Z a 4 punti non c'è alcuno spread → edge paralleli possono correre
  collineari/sovrapposti.
- **S4 — side escape / assi misti**. La deconfliction bidirezionale (`deconflictBidirectionalEdges`)
  gira **solo sul drag**, non al load. Al load la convergenza sui lati frontali dipende dalla simmetria
  della coppia (`computeOptimalHandles` è per-edge, dominant-axis). Anchor pinnati, dead-zone
  hysteresis o topologia terza possono far finire alcuni degli 8 su lati *non frontali* → incroci
  cross-asse che l'ordinamento intra-lato non può risolvere.
- **S5 — limite noto post-fix**: l'ordinamento cross-role non si ri-sorta sul drag live senza
  ri-bucketing (documentato in `2026-05-27` §"Known limitation"; non è una regressione).

---

## 1. Architettura reale della pipeline (5 stadi)

L'anchoring→routing è una pipeline di 5 stadi distinti, in moduli distinti. **Nessuno stadio "vede" il
modello**: lavorano su edge RF (`{id, source, target, sourceHandle, targetHandle, type, data}`).

| # | Stadio | Modulo / funzione | file:line | Output |
|---|--------|-------------------|-----------|--------|
| 1 | **Selezione lato** (top/right/bottom/left) | load: `computeOptimalHandles`; drag: `computeAnchorsWithHysteresis` → `deconflictBidirectionalEdges` | `jjomTransformers.ts:374-419` · `useAutoAnchor.ts:270-435` / `:56-116` | `sourceHandle/targetHandle` = `${side}-N` |
| 2 | **Indice intra-lato** (`side-0..3`) | `computePortDistribution` (chiamato da `applyDistribution`) | `portDistribution.ts:61-238` · `EditorV2.tsx:880-985` | `edgeHandles` (usato) + `nodeHandles` (**morto**) |
| 3 | **Frazione fisica lungo il lato** | `computeSidePositions` ∘ `computeSideEndpoints` (via `DynamicHandles`) | `handlePosition.ts:131-271` · `DynamicHandles.tsx:96-116,241-267` | `Map<'${handleId}:${role}', 0..1>` → CSS `top/left %` |
| 4 | **Geometria del path** (bend, trunk) | `computeManhattanPath` + `applyWaypoints` + `applyBundleSpread` (via `UnifiedEdge`) | `edgeUtils.ts:92-135` · `UnifiedEdge.tsx:202-285` | array di punti → `<path d=…>` |
| 5 | **Label** (ruolo + cardinalità) | `computeLabelPosition` / `computeCardinalityAnchor` + `roleArcShift`/`cardinalityShift` | `edgeUtils.ts:799-833` · `EditorV2.tsx:929-983` | posizione delle 2 `<div>` label |

**Nota chiave (conferma §3.10)**: `computePortDistribution` ritorna `{edgeHandles, nodeHandles}`, ma
`applyDistribution` destruttura **solo `edgeHandles`** (`EditorV2.tsx:885`) → `nodeHandles` +
`portDistribution` STEP 4 (`:189-235`, formula `(i+1)/(n+1)`) sono **dato morto**. Il posizionamento
fisico è tutto nello **Stadio 3** (`computeSidePositions`). *(Il numero di riga citato in CLAUDE.md
§3.10 come "EditorV2.tsx:792" è drift: oggi è `:885`.)*

---

## 2. Risposte puntuali D1–D7

### D1 — Distribuzione porte oggi (input/output, chiamante, momento, per-lato?)

`computePortDistribution(edges, nodeIds, nodePositions?)` (`portDistribution.ts:61-238`).
- **Input**: la lista edge RF minimale, gli id nodo, e (opzionale) una `Map<nodeId,{centerX,centerY}>`.
- **Output**: `edgeHandles: Map<edgeId,{sourceHandle,targetHandle}>` (consumato) e `nodeHandles`
  (scartato — vedi §1).
- **Chiamante unico**: `EditorV2.applyDistribution` (`:880-985`). `applyDistribution` è invocata
  ovunque si mutino gli edge: onInit (`:353`), creazione edge (`:1463,1565`), drag/reposition
  (`:2834,2873,3035,3199`), guard reattiva (`:1028`). Quindi gira a **render/sync/drag/create**, non a
  ogni frame di drag continuo (memoizzata sulle deps `[getNodes, buildNodePositions]`).
- **Per lato del nodo?** Sì: STEP 1 (`:69-140`) bucketizza per **`${nodeId}:${side}:${role}`**. Le
  chiavi includono il **ruolo** (§3.10): una singola `(nodeId, side)` può avere sia bucket `:source`
  che `:target`, ri-unificati in STEP 4 (dato morto) ma tenuti distinti per l'assegnazione indici.

### D2 — Ordinamento esistente delle porte su un lato

**Sì, ordinamento geometrico su due livelli** (nessun "ordine di definizione/creazione" grezzo):
- **Indice** (Stadio 2): `portDistribution.ts` **STEP 2** (`:142-157`) ordina i gruppi del bucket per
  centroide del nodo opposto (`averagePosition(otherNodeIds)`, `:150-151`; asc `centerY` sui lati
  verticali, `centerX` sugli orizzontali). Guardia `groups.length <= 1` (`:145`): per un bucket con 1
  solo edge il comparator non gira (irrilevante, ordine banale). STEP 3 (`:159-178`) assegna
  `handleId = ${side}-${index}` nell'ordine post-sort.
- **Posizione fisica** (Stadio 3): `computeSidePositions` (`handlePosition.ts:184-271`) è il decisore
  finale. `byGeometry` (`:230-235`) ordina i reference per centroide opposto; `byPairStable`
  (`:223-226`) fa da tiebreak sull'`edgeId` quando i centroidi pareggiano (caso stesso-nodo-opposto);
  `bySortKey` (role, index) è solo fallback per inheritance e input degeneri (senza posizioni). Con
  `M=0` (no inheritance) le frazioni sono uniformi `(k+1)/(N+1)` nell'ordine geometrico (`:249-251`).
  Test che bloccano l'invariante: `handlePosition.test.ts:7-194` (cross-role geometrico, same-role,
  pair-stable Loan↔BookCopy, fallback role-primary, inheritance centrata).

### D3 — Routing Manhattan (dove, dipende solo dalle porte, lane?)

`computeManhattanPath(sx,sy,srcSide, tx,ty,tgtSide)` (`edgeUtils.ts:92-135`), chiamato da
`UnifiedEdge.tsx:202-205`. **Router ortogonale custom** — nessun `getSmoothStepPath`/`getBezierPath`.
Dispatch per coppia di lati (`categorizeSidePair`): `routeOppositeH` (`:145-184`, Z al `midX`),
`routeOppositeV` (`:187-226`, Z/trunk verticale al `midY`), `routeSameSide` (`:229-251`, U-detour),
`routeAdjacent` (`:254-331`, L/Z). Post: `ensureOrthogonalEndpoints` (stub 20px, `:389-444`),
`cleanPoints`, `roundManhattanPath` (arch 4px), e "bridge" a scavalco negli incroci
(`getEdgeCrossings`/`buildFinalPath`, `:1334-1552`).

**Dipende solo dai 6 scalari degli endpoint** (il router non vede gli edge fratelli). MA sopra ci sono
tre meccanismi di lane/offset:
- **(a) Lane per indice handle** — il vero separatore: ogni reference ha un handle indicizzato distinto
  (Stadi 2+3) → gli edge partono/arrivano a frazioni diverse del lato.
- **(b) `applyBundleSpread`** (`UnifiedEdge.tsx:64-103`, invocato `:218-221`): shift **perpendicolare
  del corridoio centrale**, **solo per Z a 4 punti** (`:71`), offset `= directionSign *
  (sourceIndex+targetIndex+1) * 12/2` con `directionSign = source<target ? 1 : -1` (`:75`). ⚠️ **offset
  guidato dall'INDICE, non dalla frazione geometrica** → può contraddire l'ordine baricentrico (S1).
  Saltato se ci sono waypoint o edge inheritance/self-loop.
- **(c) `laneSeparation.ts`** — **Phase A inerte** (`LANE_DEBUG=true`, `:37`): ricostruisce il point
  array con le stesse funzioni pure ma **non produce alcun offset** (`:8-11`). È lo scaffold del futuro
  lane router globale (Phase B) — **hook naturale per la Fase 2**.

### D4 — Coppie eOpposite (edge indipendenti o consapevolezza della coppia?)

**A livello di geometria del path: edge del tutto indipendenti** — il router non consulta mai `opposite`.
Ogni `DReference` → esattamente 1 edge RF `type:'reference'` (`jjomTransformers.ts:487-538`); l'`opposite`
è solo un campo dati (`types.ts:93`; popolato `jjomTransformers.ts:517`) non letto dal router.

**Consapevolezza della coppia esiste UN livello sopra** (side/handle assignment), e influenza il routing
indirettamente:
- `deconflictBidirectionalEdges` (`useAutoAnchor.ts:56-116`): raggruppa per coppia **non ordinata**
  `{A,B}` e, con ≥2 edge routabili, li forza sulla **stessa coppia di lati frontali** (asse dominante),
  assegnando ogni endpoint direction-aware (`:108-112`). Copre covariante `{A→B,A→B}` e contravariante
  `{A→B,B→A}`. Gira in `computeAnchorsWithHysteresis` 2ª passata (`:404-432`) — **solo su drag/recalc**
  (`EditorV2.tsx:2995,3164`), NON al load.
- `byPairStable` (Stadio 3): allinea lo stesso edge sui due lati frontali (test Loan↔BookCopy,
  `handlePosition.test.ts:151-180`).
- `directionSign` di `applyBundleSpread`: separa le due direzioni ai lati opposti del corridoio.

**Rendering visivo della coppia come UN edge con due label di ruolo: NON esiste** (leva (c) del prompt
= non implementata).

### D5 — Label placement (dove, perché collassano)

- **Ruolo/nome**: `<div className="edge-label">` in `<EdgeLabelRenderer>` (`UnifiedEdge.tsx:640-667`),
  ancorato al **midpoint d'arco** del path via `computeLabelPosition(spreadPath, roleArcShift)`
  (`:297`; `edgeUtils.ts:799-833`) + offset **costante** `+10px` x e `labelOffset` (`:301-304`,
  uguale per ogni edge → non separa).
- **Cardinalità**: `<div className="edge-cardinality">` **separata** (`:671-682`),
  `formatCardinality(lower,upper)` (`types.ts:278-285`), ancorata **vicino al target** via
  `computeCardinalityAnchor` (`:307-314`; `edgeUtils.ts:879-896`), `pointerEvents:none`.
- **Perché collassano**: l'ancora dipende **solo dai due endpoint** → edge paralleli tra la stessa
  coppia hanno midpoint quasi identici. I mitigatori sono strutturalmente deboli:
  - `roleArcShift` (raggruppato per coppia non ordinata, `EditorV2.tsx:947-963`, step 22px) scorre
    **solo lungo l'arco**, clampato a `[margin, total-margin]` → su path corti satura; **nessuno
    stacking perpendicolare, nessuna collision detection 2D**.
  - `cardinalityShift` (raggruppato per `${target}:${side}`, `:929-945`, step 11px) **spezza la coppia
    eOpposite in due gruppi** (uno keyed su Family, uno su Member) invece di trattare il bundle come uno.
  - `applyBundleSpread` sposta il *path*, ma solo Z a 4 punti.
- eOpposite: le due label sono rese **indipendenti** (una per edge), mai co-locate/UML-paired.

### D6 — Stabilità delle porte (identità, cosa si rompe se l'ordine cambia dinamicamente)

- **Identità porta = stringa `${side}-${index}`** (`top-0`..`left-3`, `MAX_HANDLES_PER_SIDE=4`). È la
  chiave con cui ReactFlow accoppia gli edge agli Handle DOM (per `(id, type)`), la chiave dei bucket in
  `portDistribution`, e la key React stabile dei `<Handle>` in `DynamicHandles` (`:220-221`, mai
  mount/unmount).
- **L'ordine è GIÀ funzione dinamica della posizione** (Stadio 3, `byGeometry`) — quindi cambiare
  l'ordine al move non è una novità concettuale. Cosa può rompersi estendendolo/rendendolo più reattivo:
  1. **Re-render cascade** — `DynamicHandles` legge le posizioni nodo **imperativamente** al recompute
     della memo `sidePositionsBySide` (deps `[edgeTopologyKey, nodeId]`, `:96-116`), **senza**
     sottoscrizione live, *deliberatamente* per non innescare cascade durante il drag (`:99-102`,
     `2026-05-27` §"Known limitation"). Rendere l'ordine reattivo al drag reintrodurrebbe la cascade.
  2. **Misurazione DOM (double-rAF)** — cambiare il set di handle attivi forza
     `updateNodeInternals` con doppio `requestAnimationFrame` (`:184-203`) per leggere posizioni CSS
     risolte; riordini frequenti stressano questo timing (rischio letture stale = 50%).
  3. **Persistenza waypoint** — i waypoint manuali sono `{segmentIndex, offset}` (`types.ts:157-160`),
     **relativi all'indice di segmento** del path calcolato, ri-iniettati sui merge di sync
     (`useJjomSync.ts:1360-1361`). Se un riordino cambia numero/forma dei segmenti di un edge, i
     waypoint persistiti si applicano al **segmento sbagliato**. È l'accoppiamento di persistenza più
     delicato.
  4. **Anchor pinnati** — `data.sourceAnchor/targetAnchor` con `mode:'pinned'` (`useAutoAnchor.ts:249-262`)
     sono persistiti e **congelano l'intero edge** (`:314-322`): un riordino non deve scavalcarli.
  - **Handle index NON persistiti** di per sé (ricalcolati ogni `applyDistribution`) → per la
    *persistenza del progetto* il riordino è sicuro; il rischio è su waypoint (segmentIndex) e pinned.

### D7 — Layer Impact Report per `portDistribution.ts` (consumer + rischi)

**Consumer diretti dell'output di `computePortDistribution`:**
- `EditorV2.applyDistribution` (`:885`) — unico chiamante; usa `edgeHandles` (scrive
  `sourceHandle/targetHandle` sugli edge), scarta `nodeHandles`.

**Consumer indiretti (di `sourceHandle/targetHandle` sugli edge):**
- `DynamicHandles.tsx` → `computeSideEndpoints`+`computeSidePositions` (rendering handle, Stadio 3).
- `handlePosition.ts` (`computeSidePositions`, `computeHandlePositionForNode`).
- `useTreeLayout.ts` → `computeHandlePositionForNode` (landing dei rami tree inheritance; **stesse
  funzioni** → un cambio di ordinamento si propaga identico al connettore inheritance).
- `UnifiedEdge.tsx` → `getHandleIndex(sourceHandle/targetHandle)` per `applyBundleSpread`; `sourceX/Y`
  arrivano *misurati da RF* (Stadio 4).
- `laneSeparation.reconstructEdgePoints` (inerte).
- `getNextFreeHandleIndex` (`portDistribution.ts:267-294`) — creazione edge in `EditorV2`.
- `useAutoAnchor` (`getBaseSide` per l'occupancy scoring).
- ReactFlow interno (accoppiamento handle↔edge per `(id,type)`).

**Rischio (a) — l'ordine porte diventa funzione della posizione del nodo opposto**: *è già lo stato
attuale* (byGeometry). Spingerlo oltre (indici position-driven in `portDistribution`, o
`computeSidePositions` drag-reattivo) → rischio **re-render cascade** (D6.1) e destabilizzazione della
misura double-rAF (D6.2). Vincolo: **inheritance deve restare centrata** (accoppiamento `useTreeLayout`),
e il fallback senza posizioni deve restare role-primary (test `handlePosition.test.ts:31-39`).

**Rischio (b) — l'assegnazione porta→edge cambia a runtime**: accoppiamento **waypoint/segmentIndex**
(D6.3) e **anchor pinnati** (D6.4); ri-misura RF (D6.2); la memo `edgeTopologyKey` **non ricalcola** se
cambia solo l'ordine e non la topologia (`DynamicHandles.tsx:46-53`) → posizioni stale finché non scatta
un altro recompute (è il "limite noto" S5).

---

## 3. Punti di aggancio (Fase 2) — dove inserire, con invasività

> Prerequisito trasversale (§5.1): **riprodurre lo stato renderizzato attuale** del bundle Family↔Member
> (catturare per ciascuno degli 8 edge: `source/target`, `sourceHandle/targetHandle`, le frazioni
> `computeSidePositions`, e i punti finali del path da `UnifiedEdge`) ed estrarre la specifica formale
> (osservato / atteso / criterio d'accettazione meccanico) **prima** di scrivere qualunque fix. Il sort
> baricentrico esiste già: il primo passo è capire *quale* dei sospetti S1–S5 produce il sintomo.

| Leva | Dove agganciare | Stato | Invasività | Note |
|------|-----------------|-------|-----------|------|
| **(a) sort porte per y opposto** | `handlePosition.ts::computeSidePositions` + `portDistribution` STEP 2 | **GIÀ FATTO** (`byGeometry`+`byPairStable`) | — | Residuo: reattività al drag (S5) = **alta** (cascade); oppure migliorare il tiebreak sul tie stesso-nodo-opposto. Bassa priorità: il caso frontale è già zero-crossing. |
| **(b) lane assignment annidata dei trunk** | Phase B in `laneSeparation.ts` (scaffold pronto) → scrive `edge.data.laneOffset` letto dal pipeline di `UnifiedEdge`; **e/o** riscrivere `applyBundleSpread` perché l'offset segua la **frazione geometrica** invece dell'indice | Phase A inerte (`LANE_DEBUG`) + `applyBundleSpread` parziale | **media** (edge.data additivo + un consumer in UnifiedEdge; niente critical-zone se non si tocca `computeManhattanPath`) | Indirizza **S1** (bundle-spread che scavalca l'ordine) e **S3** (overlap fuori Z-4pt). Preferibile partire da S1: allineare il segno/entità dello spread all'ordine baricentrico è a basso rischio e testabile. |
| **(c) merge visivo coppie eOpposite** | produzione edge in `jjomTransformers.ts` (collassare le 2 `DReference` opposte in 1 edge) + rendering 2 label di ruolo in `UnifiedEdge.tsx` | non implementato | **alta** (tocca creazione edge, label, selezione, hit-test, coevoluzione delete) | Massimo guadagno UX sul **collasso label (S2)**, ma cambia il modello edge↔reference (1:1 → 2:1) con ricadute ampie. Da valutare solo dopo aver isolato la causa. |
| **(d) label de-overlap perpendicolare** | `EditorV2.applyDistribution` (`:929-983`) + `computeLabelPosition`/`computeCardinalityAnchor` | parziale (along-arc only) | **bassa/media** (logica additiva su `edge.data`, nessuna critical-zone) | Fix mirato a **S2** senza toccare il modello: stacking perpendicolare per bundle + gruppo cardinalità coerente con la coppia. |

**Raccomandazione di sequenza**: riproduci → identifica S1 vs S2/S3 → se incroci di *path* reali,
parti dalla leva (b)/S1 (bassa invasività, alta resa); se il sintomo è *label*, leva (d) prima di (c).

---

## 4. Rischi (dal LIR — §2 D7)

- **R1 — re-render cascade** se si rende l'ordinamento reattivo al drag (rompe il contratto
  `DynamicHandles.tsx:46-53,99-102`). Trade-off già scartato consapevolmente in `2026-05-27`.
- **R2 — waypoint su segmento sbagliato** se un riordino cambia la forma/numero di segmenti di un edge
  con waypoint persistiti (`{segmentIndex,offset}`).
- **R3 — override di anchor pinnati** (`mode:'pinned'`): qualunque nuova logica deve rispettare il
  freeze dell'intero edge (`useAutoAnchor.ts:314-322,404-423`).
- **R4 — inheritance decentrata**: `useTreeLayout` usa `computeSidePositions` per il landing dei rami;
  toccarne l'ordinamento senza mantenere inheritance a 0.5 sfasa il connettore tree.
- **R5 — TRANSACTION/critical-zone**: la leva (c) tocca la produzione edge (vicina a sync/JjOM). Se
  toccasse `useJjomSync`/`DVoidEdge.new2` servono le guardie §3.3/§3.4 e il Layer Impact Report §3.2.
  Le leve (a)(b)(d) restano fuori dalla critical-zone di scrittura (solo `edge.data` additivo +
  posizionatori puri) → LIR "not-required" per quelle.
- **R6 — memo stale** (`edgeTopologyKey`): modifiche che dipendono dall'ordine ma non dalla topologia
  non ricalcolano finché non scatta un altro recompute.

---

## 5. Onestà intellettuale / limiti

- **Non ho eseguito l'app** (Fase 1 read-only): lo stato "6+ incroci" del prompt è un'**ipotesi su una
  versione passata**. L'analisi statica del codice attuale mostra che il bundle frontale è zero-crossing
  per costruzione (byPairStable) → il sintomo, se persiste, viene da S1–S5, non dall'ordinamento
  intra-lato. **Riprodurre è il primo task della Fase 2** (§3, §5.1).
- **Drift di riferimenti in CLAUDE.md §3.10**: "EditorV2.tsx:792" → oggi `:885`; la sostanza
  (`nodeHandles` scartato, posizionamento in `computeSidePositions`) resta esatta. Non ho modificato
  CLAUDE.md (fuori scope).
- File `-toDelete` presenti (`ManhattanEdge-toDelete.tsx`, `astarPathfinder-toDelete.ts`, …): **non**
  registrati in `edgeTypes`, non nel path attivo — ignorati.

---

## HARD STOP

Fermata dopo la produzione di questo documento. Nessuna modifica a file sorgente, nessun refactoring.
La Fase 2 parte solo dopo go-ahead esplicito di Alfonso, con prompt separato, e **deve iniziare
riproducendo lo stato renderizzato attuale** del caso Family↔Member.
