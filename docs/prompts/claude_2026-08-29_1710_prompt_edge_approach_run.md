# Distanza minima del primo/ultimo raccordo negli edge Manhattan

**Data**: 2026-08-29 17:10
**File**: `frontend/src/components/editor-v2/utils/edgeUtils.ts`, `utils/__tests__/edgeUtils.test.ts`

## Prompt ricevuto

Quattro modifiche, tutte in `edgeUtils.ts` salvo i test:

1. `MIN_APPROACH_RUN` da 16 a 24, e il commento riscritto come contratto per **entrambi**
   i capi (punta della freccia ~9 + raggio del raccordo 4 + margine).
2. `tightJogBend`: clamp simmetrico. Con `|to − from| ≥ 2 × RUN` lo scalino sta in
   `[from + RUN, to − RUN]`, il midpoint resta il default per varchi ampi; sotto,
   metà varco (degradazione dichiarata).
3. `routeAdjacent`, ramo «Clean L-shape»: se la curva cade a meno di `RUN` da una delle
   due ancore, si usa il ramo Z-fallback esistente. Nessun routing nuovo.
4. `STUB_LENGTH` allineato a `MIN_APPROACH_RUN`, valutando la sola costante.

Da non toccare: `MARKER_APPROACH_RUN` e `RoundingPolicy`, il connettore d'ereditarietà
(`buildFinalPath` senza policy) byte-identico, self-loop e waypoint espliciti.

Criterio d'accettazione visivo: con due nodi collegati da una L o Z, il tratto dritto
prima della punta e dopo l'uscita dal nodo è ≥ 24px quando la geometria lo consente.

## Cosa è stato fatto

Le quattro modifiche, alla lettera. `STUB_LENGTH` è diventato `= MIN_APPROACH_RUN`
invece di un secondo letterale `24`: una sola sede, e l'identificatore resta (regola 2).

`routeAdjacent` è stato ristrutturato per riusare il fallback senza duplicarlo: il
calcolo del midpoint è estratto in una closure `zFallback()` locale a ciascuno dei due
rami, e il `} else {` diventa un `return zFallback()`. Zero cambi di comportamento in
quel passaggio: stessa formula, stesso ordine.

## Misure

### Il router è cambiato — sweep esaustivo, 362 960 geometrie

Sorgente fissa in `(540, 426.5)`, target su una griglia `dx, dy ∈ [−300, 300]` passo 4,
tutte e 16 le coppie di lati; scartate le rette pure (nessun raccordo da proteggere).
Confronto fra `HEAD` e la modifica, stesso sweep, stessa griglia.

| | HEAD | dopo |
|---|---|---|
| geometrie con `min(primo, ultimo) < 24px` | **150 712** | **6 528** |
| migliorate | — | 144 216 |
| peggiorate | — | 16 |
| invariate | — | 218 728 |

Dei 6 528 residui, 6 512 sono le quattro coppie di lati **opposti** con varco sotto
`2 × RUN`: la degradazione dichiarata, `min(24, varco/2)`, che il contratto ammette.
I 16 restanti sono la banda degenere sotto.

### La banda degenere: preesistente, spostata di 4px

Le 16 «peggiorate» sono un'unica configurazione: distanza fra le ancore **esattamente**
pari allo stub, con lati adiacenti. Lì `buildOrthogonalPath` mette i due stub sulla
stessa verticale, salta la svolta di raccordo, e `cleanPoints` collassa la U a larghezza
zero lasciando un ultimo segmento di lunghezza 0.

Misurato su `right → top`, source `(540, 426.5)`:

| dx | HEAD (stub 20) | dopo (stub 24) |
|---|---|---|
| 16 | 20 / 20 | 24 / 24 |
| **20** | **20 / 0** | 24 / 24 |
| **24** | 20 / 20 | **24 / 0** |
| 28 | 20 / 20 | 24 / 24 |

Il difetto non è nuovo e non si è allargato: la banda singolare stava a `dx == 20`
perché `STUB_LENGTH` valeva 20, ora sta a `dx == 24`. Chiuderla vuol dire scegliere uno
scostamento in `buildOrthogonalPath`, cioè inventare routing: fuori dal perimetro
dichiarato. È pinnata da una prova che la nomina per quello che è.

### Il connettore d'ereditarietà: byte-identico, provato

`computeTreeConnectorPath` non contiene né `computeManhattanPath` né
`ensureOrthogonalEndpoints` né `stubPoint` (controllo positivo: la funzione è trovata,
114 righe). L'unico chiamante di `ensureOrthogonalEndpoints` è `computeManhattanPath`
(:177). Verifica per esecuzione, non per lettura: sei `d` — tronco, barra, tre rami,
tronco arrotondato e `buildFinalPath` senza policy — generati su `HEAD` e sulla
modifica e confrontati con `diff`: **identici**. I sei valori sono ora pinnati nel
file di test.

### Sul canvas vero: nessun pixel cambia, e il perché

Due scene, entrambe con `HEAD` e con la modifica, `d` letto dal DOM:

- **`_tmp_two_nodes.ts`** — due nodi, un riferimento, 69 pose del target (sweep su
  `dx = 500` con `y ∈ [280, 360]`, diagonale, e il target sotto il source).
  `diff` fra le due corse: **nessuna differenza**.
- **`_tmp_approach_run.ts`** — la scena densa Heater di `_tmp_dense.ts`, 10 nodi e
  18 archi. Minimi per arco, identici nelle due corse:
  `7.5, 7.5, 7.5, 7.5, 10.5, 12.0 ×5, 12.5, 16.3, 87.9, 97.0, 133.5, 165.5, 172.5, 301.4`.

Il criterio d'accettazione visivo **non è soddisfatto** sulla scena densa — dodici archi
su diciotto stanno sotto i 24px — e questa modifica non lo può soddisfare. Rigiocando
`computeManhattanPath` sugli input veri della scena (18 archi su 18 con entrambe le
ancore risolte dal pool di handle, `/tmp/replay.json`), il router da solo produce tratti
terminali fra **107 e 770px**: mai sotto 24, né prima né dopo la modifica. Il `d` di
quei due file è identico byte per byte fra `HEAD` e la modifica.

I tratti corti nascono **a valle** del router. La catena in `UnifiedEdge.tsx:209-318` è
`computeManhattanPath → applyBundleSpread → avoidNodeRects → applyLaneShifts →
applyWaypointsWithMap → buildFinalPath`. I numeri misurati sono le costanti di
`avoidNodeRects` (`edgeUtils.ts:2079-2081`, `AVOID_STUB = 8`, `AVOID_STUB_OUT = 12`) e
il `approachRun: 12` della `RoundingPolicy`, che il prompt mette esplicitamente fuori
perimetro. Il 7.5px si legge in chiaro: `M 886 147 L 878.5 147 L 878.5 246.25` — spigolo
vivo a 7.5px dall'ancora, su un arco che il router aveva mandato a 316px prima di
svoltare, e che `avoidNodeRects` ha re-instradato.

Perché la scena a due nodi non cambia è un'altra ragione: `chooseEdgeSides` sceglie
sempre la coppia frontale, e la Z che ne esce ha già lo scalino a metà di un varco
ampio. I rami cambiati si raggiungono quando i lati sono **forzati** — veto di capienza,
inerzia della coppia corrente, `deny` — cioè su diagrammi densi, dove però il tracciato
lo riscrive l'evitamento.

**Conclusione onesta**: la modifica è corretta e migliora il router in modo misurabile
(150 712 → 6 528 geometrie fuori contratto), ma sulle due scene provate non muove un
pixel. Il difetto riportato in produzione, se è quello misurato qui a 7.5px, sta in
`avoidNodeRects` e nel `approachRun` della policy, non nel router.

## Scostamenti dal prompt

1. **`edgeRouting.test.ts` non codificava 16 né 20.** Il prompt dice che entrambi i file
   di test fissano i valori attuali; misurato, solo `edgeUtils.test.ts` lo fa (tre
   asserzioni). `edgeRouting.test.ts` ha una costante locale `STUB = 8` che è altra cosa,
   e passa senza modifiche. Non è stato toccato.
2. **`MIN_APPROACH_RUN` è condiviso con `applyWaypointsWithMap`.** La gomitata dei
   waypoint terminali usa `min(MIN_APPROACH_RUN, run/2)`: alzando la costante il tallone
   passa da 16 a 24px. Il prompt mette i waypoint espliciti fuori perimetro, ma chiede
   una sola costante: si è tenuta la costante unica e aggiornate le due asserzioni che
   ne fissavano il valore. È coerente col difetto (più spazio anche lì), non un effetto
   collaterale silenzioso.
3. **`edgeRouting.ts` ri-esporta `MIN_APPROACH` = `MIN_APPROACH_RUN`** e lo usa a :125
   come `stubDeficit`, terzo criterio di spareggio in `compareCandidates`, dopo svolte e
   lunghezza. Il file non è stato toccato; il deficit ora si misura su 24 invece che 16.
   Effetto misurato: `edgeRouting.test.ts` verde senza modifiche, 15/15.
4. **`edgeLanes.ts:54` ha `LANE_APPROACH_RUN = 16`** con il commento «Coincide con la
   sporgenza minima del router (`MIN_APPROACH_RUN`)». Ora non coincide più. È una
   divergenza di documentazione, non di comportamento (la costante è indipendente). File
   fuori dalla lista del prompt: **non toccato**, segnalato qui.
5. **`routeAdjacent` ristrutturato** con la closure `zFallback()` invece di duplicare il
   calcolo del midpoint nei due punti che ora ne hanno bisogno. Il prompt chiedeva di
   usare il fallback esistente; questa è la forma minima che lo riusa senza copiarlo.

## Debiti registrati, non aperti

- **La banda degenere a `dx == STUB_LENGTH`** in `buildOrthogonalPath`. Preesistente,
  16 geometrie su 362 960, pinnata da una prova.
- **`avoidNodeRects` non rispetta `MIN_APPROACH_RUN`**: `AVOID_STUB = 8` e
  `AVOID_STUB_OUT = 12` sono le misure che si vedono a schermo sulle scene dense. È qui
  che il criterio d'accettazione visivo si gioca davvero.
- **`LANE_APPROACH_RUN` disallineato** da `MIN_APPROACH_RUN` (16 vs 24).

## Sonde (non committate)

`frontend/scripts/smoke/_tmp_approach_run.ts` (scena densa, dump delle ancore per il
replay), `_tmp_two_nodes.ts` (due nodi, sweep di 69 pose), con i ritagli
`_tmp_approach_run.png` e `_tmp_two_nodes.png`.
