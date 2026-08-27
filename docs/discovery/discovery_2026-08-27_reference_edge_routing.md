# Routing dei reference edge — selezione dei lati, tratto d'approccio, jog, label

> 2026-08-27. Fase 1 read-only del prompt «Refactor routing dei reference-edge:
> selezione dinamica dei lati + rifiniture». **Nessuna modifica al sorgente.**
> Sonda temporanea: un test vitest usa-e-getta creato e cancellato dentro questa
> fase (`utils/__tests__/_tmp_probe.test.ts`, rimosso: `git status` non lo vede).
> Tutte le tabelle qui sotto sono output di quella sonda, non letture del codice.
>
> Prosecuzione di `discovery_2026-08-25_routing_faseA.md`, che al §5.4 dichiarava
> fuori perimetro proprio la scelta dei lati: «Nessuno dei tre rossi misurati qui
> dipende da loro: in tutti e tre i casi i lati scelti sono quelli giusti per la
> disposizione». Questo report misura il caso in cui **non** lo sono.

---

## 1. Ipotesi che questa fase falsifica

| # | Ipotesi di partenza | Esito |
|---|---|---|
| H1 | «Gli edge di associazione hanno ancore fisse» — esiste un ramo che impone `top → bottom` | **Falsa.** Nessun ramo lo impone per i reference. La coppia `top → bottom` sopravvive perché la **isteresi di dead zone** congela i lati precedenti (§4.2) |
| H2 | La geometria di base sbaglia il lato | **Falsa.** `computeBestAnchors` (percorso di load / auto-layout) sceglie lati sani in tutti e otto i quadranti (§4.1) |
| H3 | Il wrap-around nasce dal router | **Falsa.** Nasce a monte: con edge diagonale e nessuno stato precedente la selezione ritorna `right → right` (§4.2, riga 1) |
| H4 | L'uncino sotto l'arrowhead è un problema di marker | **Falsa.** È l'arrotondamento: l'ultimo raccordo può consumare **tutto** il segmento finale (§5) |
| H5 | Il jog a S ravvicinato è già coperto dallo `SNAP = 8` | **Parzialmente vera.** Copre sotto gli 8px; fra 8 e ~16px produce due archi separati da 0–2px di retta (§6) |

---

## 2. Obiettivo

Stabilire, con misure sul codice a HEAD (`b9da5f15b`), dove vivono i quattro
difetti del prompt, quali file vanno toccati, e quali decisioni restano ad Alfonso
prima della Fase 2.

---

## 3. File letti (path completi)

Sorgente:

- `frontend/src/components/editor-v2/utils/edgeUtils.ts` (1976 righe, letto per intero nelle parti 1-470, 505-620, 730-1060, 1582-1700, 1775-1976)
- `frontend/src/components/editor-v2/hooks/useAutoAnchor.ts` (762 righe, per intero)
- `frontend/src/components/editor-v2/utils/handlePosition.ts` (292 righe, per intero)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (righe 400-540)
- `frontend/src/components/editor-v2/utils/portDistribution.ts` (righe 1-120)
- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (righe 1-520, più le righe di render della label, 887-950)
- `frontend/src/components/editor-v2/EditorV2.tsx` (righe 3770-3870, 3950-3990)
- `frontend/src/components/editor-v2/utils/__tests__/nodeAvoidance.test.ts`

Documenti:

- `docs/discovery/discovery_2026-08-25_routing_faseA.md` (Fase A **e** Fase B, per intero)
- `docs/decisions.md` (R-B9, R-B9-bis, R-B10, R-B12, RC-3, R-LAY-19 citate qui)
- `docs/PROTOCOL.md`, `CLAUDE.md` §3, §5, §17

---

## 4. Difetto 1 — selezione dei lati

### 4.1 La geometria pura è sana: il difetto non è lì

Otto disposizioni, nodi 140x53, A fisso in (400,400), ancoraggio al centro del lato,
selezione via `computeBestAnchors` (`useAutoAnchor.ts:139`, il percorso di load e di
auto-layout). `hits` conta i segmenti che entrano in un bounding box (padding 0).

| disposizione di B | lati | svolte | lunghezza | hits |
|---|---|---|---|---|
| sotto | `bottom → top` | 0 | 147 | 0 |
| sopra | `top → bottom` | 0 | 147 | 0 |
| destra | `right → left` | 0 | 160 | 0 |
| sinistra | `left → right` | 0 | 160 | 0 |
| NE / NO / SE / SO | `right → left` / `left → right` | 2 | 360 | 0 |

Nessun giro del nodo. **H2 falsificata**: il percorso geometrico puro non produce il
difetto riportato.

### 4.2 Il difetto è nell'isteresi: `computeAnchorsWithHysteresis`

È questa la funzione che gira davvero al trascinamento dei nodi
(`EditorV2.tsx:3789`) e alla creazione di un edge (`EditorV2.tsx:3965`). Stessa
fixture, stessi nodi, con il set di edge indicato:

| caso | lati scelti | svolte | lunghezza | hits |
|---|---|---|---|---|
| **NE, nessuno stato precedente** | **`right → right`** | 2 | **560** | 0 |
| NE, lati precedenti `top → bottom` | **`top → bottom`** | 2 | 447 | 0 |
| sud, lati precedenti `top → bottom` | `bottom → top` | 0 | 147 | 0 |
| sud, reference + ereditarietà sulla stessa coppia | `right → right` | 2 | 260 | 0 |
| **est, reference + ereditarietà sulla stessa coppia** | `right → right` | 0 | 300 | **1** |
| NE, due reference sulla stessa coppia | `right → left` | 2 | 360 | 0 |

Tre meccanismi distinti, tutti in `useAutoAnchor.ts`:

**(a) La dead zone congela — e in assenza di stato ripiega su `right`.**
`useAutoAnchor.ts:389-392`:

```typescript
if (angle >= DEG_30 && angle <= DEG_60) {
    finalSourceSide = currentSource.side;
    finalTargetSide = currentTarget.side;
}
```

`currentSource` viene da `getAnchorConfig` (`:250-262`), che senza handle ripiega su
`getBaseSide(handleId)`; e `getBaseSide(null)` è `'right'` (`:240-245`). Su un edge
diagonale a 33,7° senza handle assegnati **entrambi** i capi diventano `right`: è la
riga 1 della tabella, la U che gira attorno a B (330px di sporgenza a destra prima di
rientrare). Con handle già assegnati la stessa riga congela quelli che ci sono, quali
che siano: è la riga 2, ed è **esattamente la forma descritta nel prompt** — uscita
dal top del source, ingresso dal bottom del target, con l'edge che scavalca.

La banda 30°-60° è un terzo di tutte le direzioni: la disposizione diagonale, che sul
canvas è la più comune, ci cade per costruzione.

**(b) La regola «tipo diverso sulla stessa coppia» impone la U.**
`useAutoAnchor.ts:504-525`: se fra i due nodi esiste già un edge di tipo diverso
(tipicamente l'ereditarietà), l'associazione è forzata su `right → right` o
`left → left`. Riga 5 della tabella: con B a est, quella U **collassa** in una retta
che attraversa il corpo di B (`hits=1`) — lo stesso collasso per collinearità
diagnosticato in Fase A §3 per il caso F2. A valle `avoidNodeRects` lo intercetta e
ri-instrada (Fase B del 2026-08-25), quindi a schermo il criterio regge; ma la scelta
del lato resta sbagliata e il tracciato è quello ripiegato, non quello diretto.

**(c) La deconfliction impone la coppia frontale** quando due o più edge condividono
la coppia di nodi (`deconflictBidirectionalEdges`, `:57-113`). Riga 6: `right → left`,
sano. Questa regola **non** è un difetto, ma è un vincolo che la nuova selezione deve
rispettare o sostituire consapevolmente.

### 4.3 Quanto vale il minimo di svolte — tutte e 16 le coppie su NE

B a nord-est di A (dx=300, dy=-200), ancoraggio al centro del lato:

```
top   ->left    turns=1  len=404      <-- minimo di svolte
right ->bottom  turns=1  len=404      <-- minimo di svolte, pari merito
right ->left    turns=2  len=360      <-- minimo di lunghezza
top   ->bottom  turns=2  len=447
right ->right   turns=2  len=560      <-- quello che sceglie oggi (§4.2 riga 1)
bottom->top     turns=4  len=673      <-- il peggiore
```

Due conseguenze da mettere a verbale prima di scrivere il codice:

1. **Il criterio «prima le svolte, poi la lunghezza» sceglie una L più lunga di una Z.**
   Su NE vince una L da 404 contro una Z da 360. È una scelta di gusto, non un
   ottimo: cambia l'aspetto di **ogni** edge diagonale del canvas. È il punto A del §9.
2. **Sulla diagonale il minimo è a pari merito** (`top→left` e `right→bottom`, 1 svolta
   e 404px entrambe). Il prompt non dà il criterio di spareggio. È il punto B del §9.

### 4.4 Il vincolo «mai dentro i bounding box» esiste già a valle

`avoidNodeRects` (`edgeUtils.ts:1969`) con `AVOID_CLEARANCE = 8` è già applicato in
`UnifiedEdge.tsx:267-277`, dopo waypoint e spread, su **tutti** i nodi visibili. È
letteralmente il vincolo chiesto dal punto 1 del prompt («padding ~8px»), già a
terra dal 2026-08-25 con cinque test unitari (`nodeAvoidance.test.ts`). Nella nuova
selezione dei lati serve **anche** come filtro dei candidati (un lato che nasce
dentro il corpo dell'altro nodo va scartato prima, non corretto dopo), ma non va
riscritto: si riusa `pathBlockingRects`.

### 4.5 Tre sedi scrivono i lati, non una

| sede | quando | funzione |
|---|---|---|
| `jjomTransformers.ts:428` `computeOptimalHandles` | caricamento progetto, ogni `jjomEdgeToRFEdge` | asse dominante, nessun contesto |
| `useAutoAnchor.ts:271` `computeAnchorsWithHysteresis` | trascinamento nodi, creazione edge, `recalculateAnchors` | isteresi + occupazione + deconfliction |
| `useAutoAnchor.ts:672` `computeGeometricAnchorsForAllEdges` | auto-layout (ELK) | geometria pura + deconfliction |

Se il minimizzatore entra in una sola delle tre, il canvas mostra lati diversi prima
e dopo un trascinamento. Vanno allineate tutte e tre — è la ragione principale per cui
questo task supera i 5 file di CLAUDE.md regola 19.

**Nota morta, verificata:** la guardia `e.data.oaaOptimized` che salta il ricalcolo
(`EditorV2.tsx:3780` e `:3963`) non ha **nessun** writer nel repo
(`grep -rn "oaaOptimized" frontend/src` → 2 sole occorrenze, entrambe letture). Non
è quindi una causa del congelamento, e non va toccata qui.

---

## 5. Difetto 2 — il tratto d'approccio non è dritto

`roundManhattanPath` (`edgeUtils.ts:562-563`):

```typescript
const maxR1 = (i === 1) ? len1 : len1 / 2;
const maxR2 = (i === points.length - 2) ? len2 : len2 / 2;
```

Il commento sopra dichiara l'intenzione — «for the first/last corner we allow the
full length of the endpoint segment so the arc doesn't shorten the segment toward the
marker» — ma l'effetto misurato è l'opposto: il raccordo può consumare **tutto** il
segmento terminale.

Misure (raggio 4):

| ingresso | uscita |
|---|---|
| ultimo tratto 3px | `… L 100 37 A 3 3 0 0 0 103 40 L 103 40` |
| ultimo tratto 6px | `… A 4 4 0 0 0 104 40 L 106 40` (2px di retta) |
| primo tratto 5px | `M 0 0 L 1 0 A 4 4 …` (1px di retta) |

Nel primo caso l'arco **finisce esattamente sull'ultimo punto** e la `L` che segue è
di lunghezza zero: il marker, che è `orient="auto"`, prende la tangente dall'arco e
non dalla direzione d'ingresso. È l'uncino del punto 2 del prompt.

**La stessa politica è duplicata** in `buildFinalPath` (`edgeUtils.ts:1636-1637`,
righe identiche), che è il ramo usato quando l'edge ha incroci. Correggere una sola
delle due lascia il difetto vivo su ogni edge incrociato.

---

## 6. Difetto 3 — il jog a S ravvicinato

`computeManhattanPath` ha `SNAP = 8` (`edgeUtils.ts:106`) e collassa in retta solo
per offset **strettamente minori** di 8. Misure su `right → left`:

| offset fra le ancore | esito |
|---|---|
| 7px | `M 540 430 L 700 430` — retta, ma **entrambi** i capi spostati di 3,5px sulla media |
| 8px | `M 540 426.5 L 620 426.5 L 620 434.5 L 700 434.5` — Z, due archi a contatto |
| 10px | `… L 616 426.5 A 4 … L 620 432.5 A 4 … L 700 436.5` — **2px di retta fra i due archi** |

Il buco è la fascia 8-16px: sopra lo `SNAP`, sotto `2 × 2 × raggio`. Il prompt chiede
di collassare sotto `2 × raggio` (8px), che è la soglia già in vigore; la fascia
visivamente rotta è quella immediatamente sopra. Da qui il punto C del §9.

Da notare per la Fase 2: lo snap attuale **sposta gli ancoraggi** (media delle due
ordinate). A 3,5px non si vede, ma la seconda opzione del prompt («piega spostata a
ridosso del source») non ha questo effetto collaterale.

---

## 7. Difetto 4 — label e molteplicità

**Label.** L'ancora è il punto a metà **lunghezza d'arco**
(`computeLabelPosition`, `edgeUtils.ts:799`), non il punto medio del segmento più
lungo. Su una polilinea a due segmenti i due criteri spesso coincidono (misurato: L
20+300 → la label cade sul lungo; Z 400+30+40 → idem), e divergono sulle U-detour a
5 segmenti, dove il punto a metà arco cade sul tratto centrale corto.

L'offset invece **non** è quello del prompt. `UnifiedEdge.tsx:385-392` produce
`{x: 10, y: -10}` sui tratti orizzontali, e la riga di render aggiunge un altro
`+10` letterale:

```tsx
transform: `translate(-50%, -50%) translate(${10+ labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)`,
```

(`UnifiedEdge.tsx:899`). Totale +20px in X e −10px in Y su un tratto orizzontale,
dove il prompt chiede 8px sopra e basta. Nessun vincolo di bounding box è presente.

**Molteplicità.** `computeCardinalityAnchor` (`edgeUtils.ts:879`) la mette già fuori
dal box del target, al gap d'ingresso, con uno scostamento laterale fisso per lato
(`top → destra`, `bottom → sinistra`, `right → su`, `left → giù`). È fisso **per
lato**, non scelto in base a dove passa davvero il tracciato: è la parte da rendere
consapevole del path, non da riscrivere.

---

## 8. Dipendenze e rischi

1. **R-B10 (waypoint dell'utente vincono).** `UnifiedEdge.tsx:269` esclude dal
   passaggio a valle gli edge con waypoint. La nuova selezione dei lati deve fare lo
   stesso: cambiare lato invalida i waypoint (`EditorV2.tsx:3810` li azzera quando
   `sidesChanged`), e farlo più spesso di oggi vuol dire cancellare più spesso il
   lavoro manuale dell'utente. **Rischio di regressione percepita.**
2. **Ancoraggi pinnati.** `mode === 'pinned'` congela l'edge intero
   (`useAutoAnchor.ts:315-323`). Da preservare senza modifiche.
3. **Ereditarietà intoccabile.** Il prompt lo dichiara, e il codice lo presidia in
   quattro punti (`useAutoAnchor.ts:153, 331, 491`, `jjomTransformers.ts:460`).
   Nessuno di quei quattro va toccato.
4. **R-B9 / R-B12 (routing IR non ortogonale).** `straight` / `curved` bypassano il
   router: il minimizzatore non deve girare per loro, e il loro path non va registrato
   per gli incroci.
5. **Self-loop.** `source === target` ha geometria propria (`computeSelfLoopCornerPath`)
   e capi fissi `right → top`. Fuori perimetro.
6. **`portDistribution.ts` è in critical zone (CLAUDE.md §3.1).** Il minimizzatore
   sceglie il **lato**; l'indice sul lato e lo spill restano suoi. Se la Fase 2 non
   lo tocca, niente Layer Impact Report; se lo tocca, il report è obbligatorio.
7. **Stato del working tree.** Al momento di questo report l'albero porta 13 file
   modificati e 12 non tracciati, di un'altra sessione (IRForm, formDiagnostics,
   token di colore, problems/, fixture XMI): la lista è **cresciuta** fra due
   `git status` a pochi minuti di distanza. Nessuno di quei file è nel perimetro di
   questo task, ma il commit di Fase 2 dovrà usare `git commit -- <path>` espliciti
   (CLAUDE.md §6.1), mai un commit dell'indice intero.

---

## 9. Domande aperte — decisioni che precedono la Fase 2

**A. Svolte prima della lunghezza, confermato?** Sulla diagonale il criterio del
prompt sceglie una L da 404px al posto della Z da 360px che si vede oggi. Cambia
l'aspetto di ogni edge diagonale. Confermi, o la lunghezza pesa (per esempio: la L
vince solo se non è più lunga della Z oltre una soglia)?

**B. Spareggio sulla diagonale.** `top→left` e `right→bottom` pareggiano su svolte
**e** lunghezza. Proposta: vince il lato d'uscita sull'**asse dominante** (su NE con
|dx| > |dy| esce da `right`); a parità perfetta di assi, si tiene la coppia corrente
(stabilità). Va bene?

**C. Che fine fa l'isteresi.** Il minimizzatore puro fa cambiare lato ai nodi durante
il trascinamento, anche per pochi pixel attorno a una soglia (sfarfallio). Tre
possibilità: (i) via del tutto, il lato segue sempre la geometria; (ii) resta come
soglia di miglioramento (si cambia lato solo se il nuovo punteggio è migliore di una
soglia); (iii) resta solo durante il drag e si ricalcola al rilascio. Serve una scelta.

**D. La regola «tipo diverso sulla stessa coppia» (§4.2b).** Oggi impone la U
all'associazione quando fra i due nodi c'è già un'ereditarietà, e su nodi affiancati
quella U collassa dentro il corpo del target. Il minimizzatore la sostituisce, o
resta come vincolo prioritario?

**E. Sporgenza minima 16px quando non c'è spazio.** Misurato: con i box a 20px di
distanza il primo tratto è di 10px, e 16+16 non ci stanno. Proposta: `min(16, gap/2)`.
Confermi la degradazione, o preferisci un'altra regola?

**F. Soglia del collasso del jog (§6).** Il prompt dice `2 × raggio` = 8px, che è la
soglia già attiva; la fascia visivamente rotta è 8-16px (`4 × raggio`). Alzo la
soglia a 16px o resto a 8?

**G. Collasso: retta inclinata o piega a ridosso del source?** Il prompt ammette
entrambe. La retta inclinata rompe l'ortogonalità (e quindi la registrazione degli
incroci, che appaia solo segmenti strettamente orizzontali a strettamente verticali —
`getEdgeCrossings`); la piega a ridosso del source no. **Raccomando la piega.**

---

## 10. Perimetro proposto per la Fase 2

Sette file, oltre la soglia dei cinque di CLAUDE.md regola 19 — da confermare.

| file | cosa cambia | difetto |
|---|---|---|
| `utils/edgeRouting.ts` **(nuovo)** | modulo puro: candidati sui 16 accoppiamenti, conteggio svolte, lunghezza, filtro sui bounding box, sporgenza minima. Nessuna dipendenza da React o ReactFlow | 1 |
| `hooks/useAutoAnchor.ts` | `computeBestAnchors` e `computeBestAnchorsWithContext` delegano al modulo; sorte della dead zone secondo la risposta a **C** | 1 |
| `utils/jjomTransformers.ts` | `computeOptimalHandles` delega allo stesso modulo (l'ereditarietà resta col suo ramo dedicato) | 1 |
| `utils/edgeUtils.ts` | tetto del raggio sui raccordi terminali in `roundManhattanPath` **e** in `buildFinalPath`; collasso del jog; punto medio del segmento più lungo per la label | 2, 3, 4 |
| `edges/UnifiedEdge.tsx` | offset della label a 8px (e via il `+10` letterale di riga 899); molteplicità dal lato che non collide | 4 |
| `utils/__tests__/edgeRouting.test.ts` **(nuovo)** | un caso per quadrante: lati attesi, tetto di svolte, nessun segmento dentro i due box | 1 |
| `utils/__tests__/edgeUtils.test.ts` **(nuovo)** | tratto d'approccio dritto ≥12px, collasso del jog, ancora della label | 2, 3, 4 |

Fuori perimetro, e da non toccare: `portDistribution.ts` e `handlePosition.ts`
(indice sul lato e posizione fisica dell'ancora), `useTreeLayout.ts` e tutto il
connettore d'ereditarietà, i marker, i token colore, `avoidNodeRects` (si riusa,
non si riscrive).

**Gate della Fase 2**: `npm run typecheck` baseline **33** (misurata oggi su output
completo, `EXIT=2`, 33 righe `error TS`); `npm run build`; vitest sui file toccati
più `nodeAvoidance.test.ts`, `handlePosition.test.ts`, `portDistribution.test.ts`,
`useAutoAnchor.test.ts`, `bundleSpread.test.ts`, `treeConnector.test.ts`; smoke
visivo su un metamodello con edge diagonali ed ereditarietà sulla stessa coppia.

---

# Fase 2 — implementazione e verifica (2026-08-27)

GO di Alfonso sulle quattro domande poste al hard stop: **A** svolte sempre prima
della lunghezza; **C** soglia di miglioramento al posto della dead zone; **D** il
minimizzatore sostituisce la regola «tipo diverso sulla stessa coppia»; perimetro
completo, tutti e quattro i difetti. Per B, E, F, G valgono le raccomandazioni del §9,
non contestate.

## 11. Cosa è stato scritto

**`utils/edgeRouting.ts` (nuovo, puro)** — il criterio. `measureSidePair` costruisce la
polilinea che il router produrrebbe **davvero** fra i due centri di lato
(`computeManhattanPath`, la stessa funzione che disegna) e ne misura svolte, lunghezza,
deficit di sporgenza e violazione dei corpi (riusando `pathBlockingRects`, non una
seconda implementazione del criterio). `rankSidePairs` ordina i sedici accoppiamenti;
`chooseEdgeSides` applica la soglia di miglioramento. Due valvole:

- `occupancy`, spareggio fra pari merito — non può scavalcare la geometria;
- `deny`, veto su un accoppiamento a prescindere dalla geometria: serve alla capienza
  fisica dei lati (§12.2).

**`hooks/useAutoAnchor.ts`** — `computeBestAnchors` e `computeBestAnchorsWithContext`
delegano al modulo. Cadono: la dead zone angolare 30°-60°, la regola «tipo diverso
sulla stessa coppia» (due sedi), il punteggio geometrico a prodotto scalare con le sue
penali, e le due tabelle che solo quel ciclo leggeva (`SIDE_VECTORS`,
`SIDE_PREFERENCE`). Restano intatti: self-loop, convenzione d'ereditarietà nei quattro
punti che la presidiano, ancoraggi pinnati, `deconflictBidirectionalEdges`.

**`utils/jjomTransformers.ts`** — `computeOptimalHandles` usa lo stesso modulo, così i
lati al caricamento e i lati dopo il primo trascinamento non divergono.

**`utils/edgeUtils.ts`** — le tre rifiniture, tutte a costo zero sui casi sani:

- `RoundingPolicy` opzionale su `roundManhattanPath` **e** `buildFinalPath` (la
  politica era duplicata nei due rami del rendering: correggerne uno solo avrebbe
  lasciato il difetto vivo su ogni arco incrociato). `approachRun` riserva la retta
  accanto ai marker, `interiorStraight` tiene dritta metà di ogni segmento interno.
  **Assente = comportamento storico byte per byte**, ed è così che il connettore
  d'ereditarietà — l'altro consumatore, via `useTreeLayout` — resta fuori da questo
  lavoro senza essere toccato;
- `tightJogBend`: sotto i 16px di offset lo scalino della Z si sposta a ridosso del
  source, col clamp sul punto medio che rende il caso a varco stretto identico a prima;
- `computeLabelAnchor`: punto medio del segmento più lungo. `computeCardinalityAnchor`
  prende la polilinea e posa la molteplicità sul fianco che la linea non occupa;
  senza polilinea produce **la stessa stringa di prima**, carattere per carattere.

**`edges/UnifiedEdge.tsx`** — passa `REFERENCE_ROUNDING` (solo ai non-ereditarietà),
legge la nuova ancora, e perde il `+10` letterale che si sommava all'offset della
label. `ROLE_LINE_GAP_PX/PY` da 10 a 8.

**Due file di test nuovi**, 38 prove: `edgeRouting.test.ts` (un caso per quadrante,
lati attesi, tetto di svolte, nessun segmento nei corpi) e `edgeUtils.test.ts`
(approccio dritto, collasso del jog, ancora della label, fianco della molteplicità),
ognuna con il **controllo negativo** che mostra il comportamento storico senza politica.

## 12. Tre scelte da mettere a verbale

### 12.1 La sporgenza minima non ha richiesto di toccare il router

Misurato: la Z mette lo scalino a metà del varco, cioè a `gap/2` da ciascun capo, che
è esattamente `min(16, gap/2)` — la degradazione concordata al punto E. Le U e i
ripieghi usano `DETOUR_PADDING = 30`. L'unico caso sotto misura è la L pulita di
`routeAdjacent`, dove allungare la sporgenza costerebbe tre svolte in più: lì il
vincolo agisce come `stubDeficit`, che è un criterio di scelta fra candidati, non una
riscrittura del tracciato. Nessuna riga del router cambiata per il punto E.

### 12.2 La capienza fisica dei lati è stata preservata, non rimossa

Il cancello di `sideCapacity` (commit `2f58de915`) era una penale dentro il punteggio
cancellato. Tradotto in `DenyFn`, mantiene la semantica esatta: conteggio cieco al
ruolo, l'arco in esame **si conta da solo**, confronto stretto (esattamente la capienza
ci sta ancora). Le tre prove di `useAutoAnchor.test.ts` che lo presidiano — (a), (b),
(b-boundary) — passano invariate. Cambia solo quale U viene scelta a saturazione:
`top→top` invece di `right→right`, 580px invece di 760.

### 12.3 Tre prove esistenti sono state riscritte

Non per farle passare, ma perché descrivevano politiche ritirate per ratifica:

| prova | prima | ora |
|---|---|---|
| `Case A layout` | target entra da `left` | entra dal fianco vicino (`bottom`/`top`), 1 svolta. **L'intento originario — il lato d'uscita segue la geometria post-layout, niente U-turn — è invariato e resta asserito** |
| `inheritance+reference pair` | la reference sta su una U | la reference è frontale, e si asserisce che l'ereditarietà non si muove |
| `(b) frontal over capacity` | commento sulla penale | annotata la traduzione in veto; asserzione invariata |

## 13. Verifica

| gate | esito |
|---|---|
| `npx tsc --noEmit` | **33**, baseline invariata (conteggio su output completo, `EXIT=2`) |
| `npm run build` | verde, solo l'avviso preesistente sulla taglia dei chunk |
| vitest `editor-v2` | **609/609**, 31 file (erano 571 su 29: +38 prove nuove) |
| vitest intero | 1506 passate; 9 file falliscono all'import con `window is not defined` (jjtl, jjscript, UDComparator) — preesistenti, nessuno tocca editor-v2 |
| `npm run smoke` | 12 passate, 0 fallite, 3 saltate. **Non copre il routing**: i tre stati montano un canvas senza archi |
| sonda `_tmp_routing.ts` | vedi sotto |

### 13.1 La sonda del punto 1: 7 PASS, 1 limite caduto, 3 salti

Corsa sul dev server con la modifica in vigore:

| caso | esito | misura |
|---|---|---|
| R0 ×5 | PASS | nessuna intersezione |
| F1a box sovrapposti | PASS | nessuna, clearance 13,4px (era 9px in Fase B) |
| F2 box adiacenti, varco −44px | PASS | nessuna, clearance 13,8px (era 9px) |
| **F2-degenere** | **la prova cade** | a1(288,304) b1(352,304): **nessuna intersezione**, clearance 12,6px |
| F1b, W1, P1 | SKIP | trascinamento a bersaglio mancato (presa a 1161,149, fuori dal nodo) |

Il rosso su F2-degenere **non è una regressione**: quella prova asserisce
`crossings.length > 0`, cioè che il limite dichiarato in Fase B §8.1 — ancoraggio
sepolto ⇒ si degrada al path del router — si osservi ancora. Non si osserva più, perché
la selezione dei lati adesso scarta gli accoppiamenti il cui tracciato finisce dentro un
corpo e su quella geometria ne trova uno pulito. Il limite è caduto per il caso
misurato; la prova va riscritta quando la sonda tornerà in uso, e non si tocca qui
perché è gitignorata e fuori dal repo.

### 13.2 Buchi di copertura dichiarati

1. **R-B10 (waypoint utente) non verificato in questa corsa**: W1 è saltato per il
   difetto di presa della sonda. È il rischio §8.1 e resta aperto: cambiare lato azzera
   i waypoint (`EditorV2.tsx:3810`), e il nuovo criterio cambia lato più spesso del
   vecchio congelamento. Da guardare nella verifica visiva.
2. **Archi paralleli sulla stessa coppia (P1) non verificati**: la deconfliction non è
   stata toccata, ma la sua interazione col nuovo criterio (i lati frontali che impone
   possono divergere dalla L a una svolta che il minimizzatore sceglierebbe) non è
   misurata.
3. **Ereditarietà singola non raggruppata**: passa dal router generico, quindi eredita
   lo spostamento dello scalino della Z (non l'arrotondamento, che è gated). Il
   connettore ad albero — bus, tronco, T — non passa da lì ed è intatto.
