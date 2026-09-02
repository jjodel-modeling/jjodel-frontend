# Follow-up: il contratto MIN_APPROACH_RUN a valle del router

**Data**: 2026-08-29 18:10
**Corregge**: 2026-08-29 17:10 edge_approach_run (ne rende visibile il criterio, che li' restava fallito)
**File**: `editor-v2/utils/edgeUtils.ts`, `editor-v2/utils/edgeLanes.ts`, piu' i due file di test

## Prompt ricevuto

Portare end-to-end il criterio d'accettazione del fix precedente: sul canvas, il tratto
dritto prima della punta della freccia e dopo l'uscita dal nodo >= 24px quando la
geometria lo consente, misurato sul `d` finale nel DOM.

1. `avoidNodeRects` deve rispettare il contratto sui terminali (`AVOID_STUB` 8 e
   `AVOID_STUB_OUT` 12), con degradazione `min(RUN, spazio/2)`; i punti di deviazione
   interni restano clearance dai corpi. Attenzione all'interazione con `edgeLanes.ts`:
   il vincolo va rispettato **dopo** l'ultima trasformazione che tocca i terminali.
2. `edgeLanes.ts:54` `LANE_APPROACH_RUN = 16`: allineare per import o riscrivere il
   commento, **decidendolo misurando**.
3. Non toccare `MARKER_APPROACH_RUN`, `RoundingPolicy`, il connettore d'ereditarieta',
   self-loop, waypoint espliciti, la banda singolare `dx == 24`.

## Reperto preliminare: la misura del fix precedente era sbagliata di 4px

La sonda `_tmp_approach_run.ts` misurava il primo tratto **retto** del `d`, cioe' la
distanza fra l'ancora e l'inizio dell'arco. Con raggio 4 un approccio da 24px stampa
`L` a 20 e poi l'arco: la misura sotto-riportava di esattamente il raggio.

Il contratto e' sulla posizione della **svolta** — 24px sono punta della freccia (~9)
piu' raggio (4) piu' margine — quindi la sonda ora somma il raggio dell'arco che segue.
I numeri del prompt precedente (`7.5, 12.0, 16.5, 20.3`) erano tutti 4px sotto il vero.
La conclusione non cambia: erano comunque sotto 24, e lo restano corretti
(`11.5, 16, 20.5, 24.3`). Le tabelle qui sotto usano la misura corretta.

## Diagnosi, misurata

Rigiocando la pipeline sugli input veri della scena densa (18 archi, ancore risolte dal
pool di handle, rettangoli dei nodi letti dal DOM):

| stadio | tratti terminali |
|---|---|
| `computeManhattanPath` | 107 – 770px, **mai** sotto 24 |
| dopo `avoidNodeRects` | dodici archi ri-instradati, **tutti e dodici a esattamente 12px** |
| dopo `applyLaneShifts` | 7.5 – 20.3px |

Due cause, non una:

1. **`avoidNodeRects` ricostruisce i terminali** con uno stub fisso da 12px
   (`AVOID_STUB_OUT`). Il router puo' aver dato 316px di approccio: l'evitamento li
   riduce a 12.
2. **La corsia li accorcia ancora**. `collectLaneSegments` marca mobile ogni segmento
   interno, terminali esclusi; ma spostare il segmento 1 lo fa scorrere **lungo l'asse
   del terminale**, che quindi si accorcia. `conflicts` esclude per costruzione le
   coppie dello stesso arco: l'approccio di un arco entra come ostacolo per gli altri,
   mai per se stesso.

## Cosa e' stato fatto

### 1. `AVOID_STUB_OUT` diventa una scala di gradini

```ts
const AVOID_STUB_OUT_STEPS: readonly number[] = [MIN_APPROACH_RUN, MIN_APPROACH_RUN / 2];
```

`routeAroundRects` sceglie il gradino piu' alto che non nasca dentro un corpo, **un
capo alla volta**: il lato libero tiene i 24px anche quando l'altro non ci sta. Sotto
il gradino minimo (12, il valore storico) si torna `null`, cioe' il degrado dichiarato
di sempre — deviare verso un ostacolo sarebbe peggio.

`AVOID_STUB` (8) **non e' stato toccato**: non e' una sporgenza ma la finestra esente
di `pathBlockingRects`, cioe' un criterio di *rilevazione*. Alzarla avrebbe smesso di
segnalare come violazione un tracciato che sfiora un corpo a 20px dall'ancora — meno
deviazioni, non piu' spazio. Il prompt la nomina insieme all'altra; la distinzione e'
la sua stessa («sono clearance dai corpi, non approach run»).

### 2. Le corsie non mangiano l'approccio

`LaneSegment` guadagna due proprieta' opzionali, `minOffset`/`maxOffset`, popolate in
`collectLaneSegments` per i soli segmenti che confinano con un terminale. La soglia e'
`min(LANE_APPROACH_RUN, corsa attuale)`: un terminale gia' corto non si accorcia oltre,
ma non gli si chiede di crescere. `assignLanes` ci strozza lo scostamento del piolo.

**Il prezzo e' dichiarato e provato**: un piolo bloccato puo' finire a meno di
`LANE_MIN_GAP` dal vicino. Costruito apposta in `edgeLanes.test.ts` (tre corridoi
coincidenti con terminali da 30px: separazione 6px invece di 9, terminali 24 invece di
21). Sulla scena densa vera il prezzo non si paga: le coppie D3 sotto 8px passano da
**15 a 13**, cioe' migliorano.

### 3. `LANE_APPROACH_RUN` allineato per import

`export const LANE_APPROACH_RUN = MIN_APPROACH_RUN;` — deciso misurando, come chiesto:
con la sola modifica 1 la scena densa restava a 10/18 archi sotto soglia, e i minimi si
addensavano a 15.5/16, cioe' esattamente il vecchio valore. Allineandolo il conteggio
va a 0/18.

## Misure

### 1. Scena densa Heater, 18 archi, `d` finale dal DOM

| | HEAD | dopo |
|---|---|---|
| archi con un terminale < 24px | **12 / 18** | **0 / 18** |
| minimo misurato | 11.5px | 24.0px |
| distribuzione dei minimi | 11.5 x4, 16 x5, 20.5 x2, 24.3, 91.9, 101, 137.5, 171.5, 172.5, 305.4 | 24 x10, 33, 37.5, 91.9, 101, 137.5, 167, 172.5, 305.4 |

Criteri D del diagramma denso (`_tmp_dense.ts`), HEAD contro dopo:
D1 assialita' PASS/PASS, D2a e D2b PASS/PASS, D5 PASS/PASS.
**D3** coppie parallele sotto 8px: **15 -> 13**. **D4** coppie con un terminale: 3 -> 3.
D3 e D4 erano gia' rossi su HEAD: preesistenti, e la modifica li migliora o li lascia.

### 2. Scena a due nodi, 69 pose

Una sola posa su 69 cambia, ed e' un miglioramento: `sotto x=264` passa da 12/12 a
24/24 — l'unica delle 69 in cui l'evitamento entra in gioco. Le altre 68 sono
byte-identiche.

### 3. Sweep del router: invariato

Rigenerato ora, non ereditato: 362 976 geometrie, tratti terminali sotto 24px
**150 712 su HEAD, 6 528 dopo**. Identico al fix precedente, come dev'essere: questo
lavoro non tocca `computeManhattanPath`.

### 4. Connettore d'ereditarieta'

I sei `d` pinnati nel fix precedente (tronco, barra, tre rami, `buildFinalPath` senza
policy) passano invariati. Byte-identico.

## Scostamenti e cose da sapere

1. **`AVOID_STUB` (8) non toccato**, per la ragione sopra. E' uno scostamento dalla
   lettera del prompt, non dalla sua sostanza.
2. **Un caso degenere cambia forma.** Sulla U-detour fra due nodi sovrapposti
   (`nodeAvoidance.test.ts`, «aggira i due corpi») il tracciato passava sopra-sinistra e
   ora passa sotto-destra: gli stub piu' lunghi spostano i nodi di partenza e d'arrivo
   della griglia A\*, e cambia il paesaggio dei costi. Entrambi rispettano il criterio
   (`pathBlockingRects` vuoto), il nuovo e' ~6% piu' lungo. La prova esistente passa
   senza modifiche perche' asserisce il criterio, non la forma.
3. **Quattro file di codice invece di due.** I due sorgenti sono quelli del prompt; i due
   di test sono `nodeAvoidance.test.ts` ed `edgeLanes.test.ts`, che il prompt chiede
   esplicitamente («Nuove prove su `avoidNodeRects`… Suite esistente: baseline verde»).
   Con i due documenti si arriva a sei: sopra il tetto di cinque della regola 19, ma
   tutti dentro il perimetro dichiarato.
4. **Una prova preesistente fissava 16.** `edgeLanes.test.ts:87` asseriva
   `toBeLessThanOrEqual(16)` sulla lunghezza dell'ostacolo d'approccio: ora cita
   `LANE_APPROACH_RUN`. E' l'unica asserzione riallineata.
5. **File `/tmp` sovrascritti.** `/tmp/sweep-new.txt` del fix precedente conteneva i
   valori di HEAD quando l'ho riletto: il redirect via variabile d'ambiente non era
   arrivato al worker di vitest in una delle due corse. Lo sweep e' stato **rigenerato**
   e riconfrontato, non ereditato. Vale come promemoria: un file in `/tmp` non e' una
   misura, e' un residuo, finche' non lo si riproduce.

## Debiti che restano

- **D3/D4 rossi sulla scena densa** (13 e 3 coppie): preesistenti, fuori perimetro.
- **La banda singolare `dx == STUB_LENGTH`** in `buildOrthogonalPath`: intatta, come
  chiesto.
- **`applyBundleSpread`** non e' stato esaminato: sulla scena densa non risulta fra le
  cause (i 18 archi passano da router e avoid, e i numeri tornano senza di lui), ma non
  ho costruito la scena in cui morde.

## Sonde (non committate)

`frontend/scripts/smoke/_tmp_approach_run.ts` (misura corretta ancora->svolta, piu' il
dump delle ancore e dei rettangoli per il replay offline), `_tmp_two_nodes.ts`,
`_tmp_dense.ts` (preesistente, usato per D1-D5).
