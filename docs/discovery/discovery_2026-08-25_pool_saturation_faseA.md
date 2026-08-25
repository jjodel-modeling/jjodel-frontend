# Saturazione del pool di handle — Fase A: riproduzione e misura

> 2026-08-25. Ultimo fronte archi rinviato dalla board «Jjodel Canvas Redesign».
> **Nessuna modifica al sorgente**: questa fase misura e basta.
> Sonda: `frontend/scripts/smoke/_tmp_pool_saturation.ts` (gitignored, come tutte le `_tmp_`).
> Misure grezze: `_tmp_pool_saturation.json` (scala pura) e `_tmp_pool_mixed.json`
> (ruoli misti), accanto alla sonda. Screenshot `_tmp_pool_F3.png`, `_tmp_pool_MIX.png`,
> `_tmp_pool_MIXA.png`.

---

## 1. Metodo

Fixture costruita dentro la pagina, due classi che esistono solo nella sonda:
M2 `Alpha --out1..out6--> Beta` e `Beta --in1..in3--> Alpha`; M1 con un hub `a1`
(Alpha) e sei foglie `b1..b6` (Beta) a est. Nessun progetto esistente aperto,
nessun literal di metaclasse. Il grado dell'hub cresce **un arco alla volta**, con
una misura dopo ognuno: la scala 2..6 e' quindi una curva, non due punti.

Criterio meccanico **F3**, sul path finale letto dal DOM: per ogni coppia di archi
incidenti sullo stesso lato dello stesso nodo, la distanza fra i punti d'attacco
(primo punto del path per il ruolo source, ultimo per il target) deve essere
>= 6px. Zero coppie sotto soglia = PASS. Ogni stadio riporta anche il numero di
coppie effettivamente confrontate: **una corsa con zero coppie confrontate non e'
un PASS, e' una misura che non ha avuto luogo** (§5, «un'assertion di assenza
richiede la prova che la ricerca sia girata»).

### 1.1 Tre correzioni di metodo, tutte misurate

**Il punto d'attacco va associato al nodo per geometria.** La prima versione
leggeva `dataset.source` / `dataset.target` dai gruppi `.react-flow__edge`, come fa
la sonda del routing. Misurato: in questa configurazione quei dataset sono vuoti,
l'associazione arco→nodo falliva per ogni arco, e la sonda stampava **6/6 verdi con
zero coppie confrontate**. Un criterio che passa senza aver misurato niente.
Sostituito con l'associazione al perimetro del nodo piu' vicino (tolleranza 12px).

**Le coordinate della fixture non sopravvivono all'apertura.** Scritte sul
`DVertex` prima di aprire l'M1, vengono sostituite dalla disposizione a griglia del
canvas: `a1` chiesto a (160,380) risultava a (50,50), e con le foglie sparse su tre
colonne due di esse cadevano *sotto* l'hub — asse dominante verticale, quindi
`bottom` invece di `right`. Con quella geometria il lato destro non arrivava mai a
cinque archi e la saturazione non si riproduceva affatto. I nodi vanno **mossi
trascinandoli**, come nella Fase A del routing.

**Due foglie non si lasciano trascinare** (`b2`, `b5`: la presa finisce fuori
bersaglio, restano a x=890). Non e' un problema: a 890 sono comunque a est
dell'hub con `|dx| > |dy|`, quindi eleggono `right` come le altre. La validita' del
caso si giudica sulla geometria reale misurata, non su quella chiesta.

Geometria effettiva di tutte le corse (nodi 140x53):
`a1(80,400)`, `b1(704,112)`, `b2(890,50)`, `b3(704,336)`, `b4(704,448)`,
`b5(890,350)`, `b6(704,672)`.

---

## 2. Risultati

### 2.1 Scala pura — archi tutti uscenti, stesso lato

| stadio | archi sul lato | passi fra gli attacchi (px) | handle vivi | esito |
|---|---|---|---|---|
| R0-2 | 2 | 17,6 | right-0..1 | PASS |
| R0-3 | 3 | 13,2 / 13,3 | right-0..2 | PASS |
| R0-4 | 4 | 10,6 / 10,6 / 10,6 | right-0..3 | PASS |
| **F3-5** | 5 | 10,6 / 10,6 / 10,6 / **0** | right-0..3 | **FAIL** — 1 coppia a 0px |
| **F3-6** | 6 | 10,6 / 10,6 / 10,6 / **0** / **0** | right-0..3 | **FAIL** — 3 coppie a 0px |

I passi dei casi sani sono esattamente `h/(N+1)` con h = 53: 17,67 / 13,25 / 10,6.
E' la distribuzione uniforme di `computeSidePositions`, confermata sul reso.

Da cinque archi in su gli handle vivi restano **quattro**: il quinto e il sesto
arco condividono `right-3` e partono dallo stesso pixel. Il warn del clamp e'
emesso, testuale:

```
[portDistribution] handle overflow: node "Pointer...USER_49" side "right"
has 5 edges > pool capacity 4; excess share right-3.
```

### 2.2 Ruoli misti puliti — 3 uscenti, poi 3 entranti (`--mixed`)

| stadio | archi sul lato | attacchi (y) | handle vivi (y) | esito |
|---|---|---|---|---|
| MIXA-3out | 3 | 413,3 / 426,5 / 439,8 | src 413,3 / 426,5 / 439,8 | PASS |
| **MIXA-3out+1in** | 4 | 413,3 / **426,5 / 426,5** / 439,8 | src 410,6 / 421,2 / 431,8 — tgt 442,4 | **FAIL** |
| **MIXA-3out+2in** | 5 | 413,3 / **426,5 ×3** / 439,8 | src 408,8 / 417,7 / 426,5 — tgt 435,3 / 444,2 | **FAIL** |
| **MIXA-3out+3in** | 6 | 413,3 / **426,5 ×4** / 439,8 | src 407,6 / 415,1 / 422,7 — tgt 430,3 / 437,8 / 445,4 | **FAIL** |

**Nessun warn del clamp in tutta la corsa.** Sei endpoint distinti, sei handle vivi
a 7,5px l'uno dall'altro — e cio' nonostante i path si accavallano. Rimisurato dopo
altri 4 secondi di assestamento: identico.

### 2.3 Coda a ruoli misti sulla scala pura — 6 uscenti + 3 entranti

| lettura | attacchi su `a1:right` | handle vivi | esito |
|---|---|---|---|
| subito | 9, passi 10,6 / 5,3 / 0 / 0 / 5,3 / 10,6 / 0 / 0 | src right-0..3, tgt right-0..2 | FAIL, 12 coppie |
| +4s | identico | identico | FAIL |
| **dopo un trascinamento dell'hub** | 6, passi **7,5 / 7,6 / 7,6 / 7,5 / 7,6** | src right-0..2, tgt right-0..2 | lato hub **pulito** |

Il trascinamento dell'hub ripara il lato: sei attacchi distinti, coincidenti con le
sei ancore rese, e tre archi migrati su `top` (115 / 150 / 185, passo 35px) — la penalita' di
occupazione di `useAutoAnchor` che redistribuisce. Restano rosse tre coppie **sulle
foglie** (`b4:left`, `b5:left`, `b6:left`, 0px): ogni foglia ha un arco uscente e uno
entrante verso lo stesso hub, e i due condividono il punto d'attacco. Quelle foglie
non sono state trascinate.

---

## 3. Non e' un difetto solo: sono due, e il secondo scatta prima

### 3.1 D1 — il clamp del pool (`portDistribution.ts:181`)

`const handleId = \`${side}-${Math.min(index, MAX_HANDLES_PER_SIDE - 1)}\``.
Dal quinto gruppo in poi sullo stesso `(nodo, lato, ruolo)` l'indice viene tosato e
gli archi in eccesso condividono `side-3`. A valle, `computeSideEndpoints` chiude su
`${handleId}:${role}`: due archi con lo stesso handleId e lo stesso ruolo sono **un
solo endpoint**, quindi `computeSidePositions` ne distribuisce N=4 e non N=6.
La sovrapposizione e' esatta e per costruzione, non un arrotondamento.

Firma riconoscibile nei numeri: gli attacchi restano sulla griglia `h/(N+1)` con
N = 4, e l'ultima posizione e' ripetuta. Confermata in F3-5 e F3-6.

### 3.2 D2 — le posizioni misurate da React Flow restano indietro

E' il difetto piu' interessante, ed e' **indipendente dal cap**: scatta a **4 archi
su un lato**, con il pool riempito a meta' e nessun warn.

In MIXA-3out+3in le sei ancore sono rese in sei punti distinti (407,6 … 445,4,
passo 7,5px: la distribuzione uniforme corretta per N=6), ma i path:

- i **tre uscenti** partono ancora da 413,3 / 426,5 / 439,8 — la griglia `h/(N+1)`
  con **N=3**, cioe' la disposizione congelata di prima che arrivassero gli entranti;
- i **tre entranti** arrivano tutti a **426,5**, che e' esattamente il centro
  verticale del nodo (400 + 53/2) — il fallback `?? 0.5` di chi non ha una posizione
  misurata.

Quindi la linea non parte dal pallino che l'utente vede, e ogni arco entrante finisce
sullo stesso punto centrale. Il fallback a 0,5 e' scritto in `DynamicHandles.tsx:257`
(`sidePositions.get(...) ?? 0.5`), ma qui non e' il rendering a ricadere: le ancore
sono rese giuste. A ricadere e' il consumatore delle **bounds misurate**, cioe'
React Flow, che non rimisura quando cambiano solo le percentuali di posizione.

`DynamicHandles.tsx:201` forza `updateNodeInternals` solo quando cambia
`activeHandlesKey`, cioe' l'**insieme** degli handle attivi. L'aggiunta di un arco
entrante cambia quell'insieme e la rimisura parte — ma riguarda gli handle nuovi;
le percentuali degli handle **gia' attivi** si spostano nello stesso ciclo
(`computeSidePositions` ridistribuisce su N crescente) e per quelli la misura resta
quella vecchia. Il rischio e' gia' documentato nel codice, sette righe di commento
in `EditorV2.scss:1121-1124`: *«React Flow measures handle positions via
getBoundingClientRect, and animating position causes stale measurements (edges
connect at wrong anchor points)»*. Li' la causa era la transizione CSS; qui e' la
ridistribuzione, ma il sintomo e la meccanica sono gli stessi.

**Prova che e' staleness e non un errore di calcolo**: un trascinamento dell'hub —
che forza il ciclo completo di ricalcolo — riallinea i sei attacchi alle sei ancore
(passi 7,5px, §2.3, terza riga). Quattro secondi di attesa, invece, non cambiano
nulla: non e' una corsa contro il tempo, e' un aggiornamento che non viene chiesto.

### 3.3 Quale dei due si vede di piu'

D2. Il clamp richiede **cinque** archi con lo stesso ruolo sullo stesso lato; D2
basta il quarto arco quando i ruoli si mischiano — e il quarto arco su un hub e' una
configurazione ordinaria, non un caso limite. Nella coda §2.3 i due difetti
convivono e producono insieme dodici coppie sotto soglia su nove archi.

---

## 4. Perche' 4

Il cap nasce con il pool stesso: `31bb80b05`, 15 febbraio 2026, *«Rewrite
DynamicHandles with pre-allocated handle pool pattern (4 per side)»*. Il 4 non e'
argomentato nel messaggio ne' in un commento: e' il numero scelto quando gli handle
sono passati da montati-su-richiesta a pre-allocati-sempre. Il costo diretto e'
DOM: `DynamicHandles` rende **due** handle (source e target) per indice per lato,
cioe' `2 x 4 x 4 = 32` elementi per nodo, sempre, attivi o no.

Il secondo commit e' `2ddedca53`, 20 luglio 2026, che aggiunge il clamp. Il suo
messaggio dice cosa succedeva prima: *«edges past the 4th on a (node, side, role)
bucket pointed at unmeasured handles and React Flow dropped them silently»* —
benchmark `rf_edges 986 -> 1500` a scala 1000. Il clamp e' quindi un **ripiego
dichiarato**: ha scambiato archi spariti con archi sovrapposti, ed e' l'unica
ragione per cui oggi la saturazione si vede invece di far sparire il disegno.

**Cosa si rompe alzandolo, nel dettaglio**

`computeSidePositions` distribuisce `(k+1)/(N+1)` su N endpoint qualunque sia N: non
ha un limite. Nemmeno `handlePosition.parseHandleId` ne ha. I due unici punti che
leggono la costante come **capienza** sono `DynamicHandles.tsx:236` (il ciclo di
rendering del pool) e `getNextFreeHandleIndex` (`portDistribution.ts:318`, che
ritorna 0 quando tutti gli slot sono occupati). Un terzo la usa come **soglia**:
`useAutoAnchor.ts:589`, dove la U sullo stesso lato e' ammessa solo sopra il cap.
Un quarto, `computeHandlePercent` (`handlePosition.ts:79`), la usa in una formula —
ma e' `@deprecated` e senza chiamanti.

Quindi alzare il numero non rompe niente di algoritmico. **Rompe la geometria**: il
lato verticale di un nodo e' alto 53px, e il passo e' `53/(N+1)`.

| endpoint sul lato | passo | pallini da 8px |
|---|---|---|
| 4 | 10,6px | staccati |
| 5 | 8,8px | staccati di 0,8px |
| **6** | **7,6px** | **si toccano** |
| 8 | 5,9px | sotto la soglia F3 |
| 12 | 4,1px | illeggibile |

Il pallino d'ancora e' 8x8px (`EditorV2.scss:1107-1108`). Su un nodo alto 53px il
limite fisico e' **sei endpoint per lato verticale**, e a sei si toccano gia'. Sui
lati orizzontali (140px) lo stesso conto da' 16 endpoint prima di scendere a 8px:
il vincolo e' tutto sui lati verticali, e dipende dall'**altezza del nodo**, che non
e' costante — i nodi con piu' slot sono piu' alti.

Portare il cap a 8 raddoppia il DOM a 64 handle per nodo e sposta il problema da
«due archi nello stesso punto» a «otto archi a 5,9px», che il criterio F3 boccia
ugualmente. **Alzare il cap da solo non chiude F3.**

---

## 5. Il bucket role-aware anticipa o ritarda la saturazione?

**La ritarda, sul clamp. La anticipa, sul difetto D2.** Misurato, non dedotto.

La chiave di `portDistribution` STEP 1 e' `${nodo}:${lato}:${ruolo}` (§3.10), quindi
i due ruoli hanno **spazi di indici indipendenti**: sullo stesso lato possono vivere
`right-0..3` come source e `right-0..3` come target, otto handle distinti. Nella coda
§2.3 il lato destro di `a1` porta nove archi con **sette** handle vivi (4 source
clampati + 3 target non clampati): il bucket target non e' mai arrivato al cap
mentre quello source lo aveva gia' superato. Il clamp per il ruolo target sarebbe
scattato al suo quinto arco, cioe' al tredicesimo arco complessivo sul lato.

Ma `computeSidePositions` distribuisce su **tutti** gli endpoint del lato, ruoli
uniti (e' la scelta S7 documentata in `handlePosition.ts`): otto handle su 53px sono
5,9px di passo, sotto la soglia F3 **anche senza nessun clamp**. E il difetto D2
scatta al quarto arco, cioe' molto prima.

Riassunto operativo: il ruolo raddoppia la capienza nominale del pool e non cambia
di un pixel la capienza fisica del lato. Il collo di bottiglia non e' il pool.

Nota per il seguito: `useAutoAnchor.ts:589` conta invece gli archi **senza**
distinguere il ruolo (`sourceSideInfo[side].count++` su entrambi i rami), e li
confronta con `MAX_HANDLES_PER_SIDE`. E' una terza convenzione, disallineata da
entrambe le altre due: dichiara «saturo» a 5 archi complessivi un lato che
`portDistribution` considera saturo a 5 archi **per ruolo** e che la geometria
considera pieno a 6 endpoint. Qualunque intervento sulla capienza deve decidere
quale delle tre e' quella vera.

---

## 6. Perche' la scala pura satura affatto: il caricamento non conosce l'occupazione

Vale la pena registrarlo perche' delimita quando F3 si vede.

`useAutoAnchor` ha una penalita' di occupazione (30 punti per arco,
`useAutoAnchor.ts:628`) che redistribuisce gli archi sugli altri lati: nella coda
§2.3, un solo trascinamento dell'hub sposta tre dei nove archi su `top` e il lato
destro torna sotto capienza. Ma `useAutoAnchor` gira **sui gesti di drag**.

La scelta del lato al caricamento passa da `jjomTransformers.computeOptimalHandles`
(`jjomTransformers.ts:428-479`), che e' **puro asse dominante**: nessuna nozione di
occupazione, nessun accesso agli altri archi. Sei foglie a est dell'hub ricevono sei
volte `right-0`/`left-0`, e la saturazione e' garantita. E' questo il percorso di un
progetto **aperto** o **importato**: il disegno nasce saturo e resta saturo finche'
qualcuno non trascina un nodo. Cioe' esattamente lo stato in cui l'utente lo vede
per primo.

---

## 7. Le opzioni

Nessuna e' fuori dalla critical zone: `portDistribution.ts` e' in §3.1 e la
distribuzione dei bucket role-aware e' §3.10. Ogni opzione qui sotto **tocca la
critical zone** e richiede il Layer Impact Report di §3.2 prima del diff. Le opzioni
(a)…(d) sono ortogonali a (e), che e' una precondizione.

### (e) — precondizione: rimisurare quando cambiano le posizioni, non solo l'insieme

Chiude D2, che e' il difetto che scatta prima. `DynamicHandles.tsx:201` invalida su
`activeHandlesKey`; la chiave deve includere anche le **percentuali** calcolate da
`computeSidePositions`, cosi' che uno spostamento di ancore forzi
`updateNodeInternals` esattamente come una loro comparsa.

- Perimetro: `DynamicHandles.tsx`, un blocco. Non tocca `portDistribution.ts`.
- Costo: piccolo. Rischio: **medio** — la rimisura e' un doppio rAF per nodo, e la
  chiave passerebbe da «cambia raramente» a «cambia a ogni ridistribuzione». Su
  grafi densi va misurato l'effetto sul tempo di assestamento (l'harness di
  `docs/benchmarks/` ha gia' `t_edge_settle_ms` come metrica).
- Nota: non fa nulla per la sovrapposizione a pool saturo, che resta esatta.

### (a) — alzare il cap

Numeri dalla tabella §4: per restare a >= 6px di passo servono <= 7 endpoint su un
lato alto 53px, e i pallini da 8px si toccano gia' a 6. Un cap globale a 8
raddoppia il DOM (64 handle per nodo) senza chiudere F3.

- Costo: minimo (una costante). Rischio: **alto** — sposta il problema, non lo
  risolve, e peggiora il DOM su ogni nodo del grafo, saturo o no.
- Cambia il comportamento sotto i 4 archi? No. Ma cambia la soglia di
  `useAutoAnchor.ts:589`, quindi cambia **quali** archi diventano U: e' una
  modifica alla selezione dei lati mascherata da modifica alla capienza.

### (b) — pool dinamico = N archi reali

Il pool si dimensiona sul grado effettivo del lato, senza cap.

- Costo: medio. `DynamicHandles` deve rendere un numero variabile di handle
  mantenendo **chiavi stabili** (il commento a `DynamicHandles.tsx:221` dice
  esplicitamente «stable keys, never mount/unmount»: e' quella stabilita' a evitare
  la rimisura continua, ed e' proprio quello che l'opzione mette in discussione).
  `getNextFreeHandleIndex` perde il fallback a 0 e va ridefinito.
- Rischio: **alto** sulla critical zone, e non chiude comunque F3: N archi su 53px
  scendono sotto 6px a partire da 8. Va accoppiato a (c) o a un minimo di spaziatura.

### (c) — a pool pieno, spill sul lato adiacente con piu' spazio

E' la sola opzione che affronta la causa fisica: il lato e' finito, gli archi no.
Ed e' gia' meta' implementata — la penalita' di occupazione di `useAutoAnchor` fa
esattamente questo, e la misura §2.3 mostra che funziona (tre archi su nove migrati
su `top` con un solo trascinamento).

- Costo: medio-basso se si riusa il meccanismo esistente invece di scriverne uno
  nuovo. Il buco e' al **caricamento** (§6): `computeOptimalHandles` non conosce
  l'occupazione. Chiuderlo significa dare a quel percorso lo stesso scoring che
  `useAutoAnchor` applica dopo un drag.
- Rischio dichiarato sull'interazione con `useAutoAnchor`: la selezione del lato
  smette di essere una funzione della sola coppia di nodi e diventa **dipendente
  dall'ordine** in cui gli archi sono processati. Due archi identici possono finire
  su lati diversi a seconda di chi arriva primo, e il disegno di un progetto
  riaperto puo' non coincidere con quello lasciato. Serve un ordine canonico
  (per id d'arco, che e' stabile) perche' il risultato sia riproducibile.
- Interazione con l'isteresi: `computeAnchorsWithHysteresis` esiste per evitare che
  gli archi sfarfallino durante un drag. Uno spill al caricamento entra in quel
  meccanismo e va verificato che non produca un secondo assestamento visibile.

### (d) — quello che emerge dal codice: unificare la nozione di «pieno»

Oggi ce ne sono tre e non concordano (§5): `portDistribution` conta per ruolo,
`useAutoAnchor` conta senza ruolo, la geometria conta gli endpoint totali sul lato
e li divide per l'altezza. La nozione utile e' la terza — **capienza = lunghezza del
lato / spaziatura minima** — perche' e' l'unica espressa nell'unita' in cui il
criterio F3 e' scritto, e l'unica che si adatta ai nodi piu' alti invece di trattarli
come quelli bassi. Le altre due diventerebbero derivate.

- Costo: medio, ed e' prevalentemente di **accordo fra i tre siti**, non di
  algoritmo. Tocca `portDistribution.ts`, `useAutoAnchor.ts`, `DynamicHandles.tsx`.
- Rischio: alto per ampiezza (tre file di critical zone), basso per profondita'.
- Non e' alternativa a (c): e' il criterio con cui (c) decide quando fare spill.

---

## 8. Impatto su cio' che non va toccato

**Deconfliction** (`deconflictBidirectionalEdges`, `useAutoAnchor.ts:57`).
Forza ogni gruppo di archi fra la stessa coppia di nodi sui lati frontali, per far
condividere il corridoio. Un'opzione che sposta archi su altri lati (c) puo'
**disfare** quel raggruppamento, che gira dopo la selezione per-arco e la
sovrascrive: l'ordine fra i due va dichiarato prima di scrivere. Nota collegata: le
tre coppie rosse residue in §2.3 sono proprio su coppie deconflittate
(`b4:left`, `b5:left`, `b6:left`, 0px), e non sono spiegate da questa Fase A —
vedi §10.

**Ordinamento cross-role di `handlePosition`** (§3.1, `computeSidePositions`).
E' l'unica funzione che oggi produce posizioni corrette: in ogni misura di questa
sonda le ancore rese sono giuste anche quando i path sono sbagliati. Va lasciata
esattamente com'e'. In particolare il tiebreak stabile per `edgeId` e' cio' che fa
combaciare le frazioni sui due lati affacciati; toccarlo disallinea i path.

**Albero di ereditarieta'** (`useTreeLayout`). Atterra sull'handle assegnato
(`f0f28c58b`) usando lo **stesso** `computeSideEndpoints` + `computeSidePositions`
di `DynamicHandles`, per costruzione. Vale quindi la simmetria: se (e) ripara la
rimisura, l'atterraggio del ramo si ripara insieme; se un'opzione cambia le
posizioni per l'uno e non per l'altro, il connettore si stacca. Nessun caso di
ereditarieta' e' stato misurato in questa Fase A — la fixture e' di sole referenze.

**Waypoint persistiti** (`irEdgeLayout` su `DVertex`, discovery 2026-07-19). Si
persistono i **lati**, mai l'indice dell'handle, che e' dichiarato
sessione-relativo. Un cambio di capienza o di indicizzazione e' quindi
retro-compatibile con quanto e' gia' su disco. Un'opzione che cambia il **lato**
scelto (c) invece interagisce: gli override persistiti vincono sull'idratazione, e
uno spill non deve poter sovrascrivere un lato che l'utente ha fissato a mano.

**R0 — i casi non saturi.** Baseline fissata qui, §2.1: 2/3/4 archi uscenti sullo
stesso lato danno passi 17,6 / 13,25 / 10,6 px, cioe' `h/(N+1)` esatto, con gli
handle `right-0..N-1` vivi e coincidenti con gli attacchi. Nessuna opzione deve
muovere questi numeri. Il file `_tmp_pool_saturation.json` e' lo snapshot da cui
ricontrollarlo.

---

## 9. Raccomandazione

**(e) prima, da sola, e poi rimisurare.** Non e' una scelta fra le opzioni del
prompt: e' che la misura ha trovato un secondo difetto, che scatta **prima** del
cap (4 archi contro 5), che produce la sovrapposizione peggiore (tutti gli archi
entranti nel centro esatto del nodo) e che non ha niente a che vedere con la
capienza — le ancore giuste sono gia' calcolate e gia' rese, e i path le ignorano.
E' anche l'intervento piu' piccolo e l'unico interamente fuori da
`portDistribution.ts`.

Con (e) chiusa, F3 restera' rosso solo nella parte davvero attribuibile al pool
(F3-5, F3-6: due e tre archi sull'ultimo handle), e la scelta fra (a)…(d) si fara'
su un bersaglio pulito. La mia previsione, da confermare con la misura e non prima,
e' **(d) come criterio + (c) come meccanismo**: capienza = altezza del lato divisa
per la spaziatura minima, e spill sul lato adiacente quando quella capienza e'
esaurita, esteso al percorso di caricamento che oggi ne e' privo (§6). Alzare il cap
(a) e' l'unica opzione che consiglio di scartare del tutto: sui lati verticali da
53px non c'e' spazio da comprare, solo da distribuire.

---

## 10. Domande aperte

1. **Le tre coppie a 0px sulle foglie** dopo il trascinamento dell'hub (§2.3,
   `b4:left`, `b5:left`, `b6:left`) non sono attribuite. Sono coppie deconflittate
   (un arco uscente e uno entrante fra le stesse due istanze), le foglie non sono
   state trascinate, quindi il sospetto e' lo stesso D2 — ma non e' misurato: la
   sonda registra le ancore rese solo per l'hub. Va esteso prima di scrivere il fix,
   perche' se fosse invece la deconfliction a far coincidere i due attacchi,
   l'opzione (e) non lo chiuderebbe.
2. **Ereditarieta' e nodi alti**: entrambi assenti dalla fixture. Il conto della
   capienza fisica (§4) e' fatto su 53px, che e' l'altezza del nodo neutro; i nodi
   con slot sono piu' alti e la capienza cresce con loro. Se si sceglie (d), la
   soglia va misurata su almeno due altezze.
3. **Quale delle tre nozioni di «pieno» e' quella vera** (§5). E' una decisione, non
   una misura: senza risposta, (c) e (d) non hanno un criterio con cui decidere.
4. **Costo della rimisura** in (e) su grafi densi: da misurare con
   `t_edge_settle_ms` dell'harness prima di considerarla acquisita.

---

## 11. Riproducibilita'

```bash
npm start   # in una shell separata
cd frontend
node --disable-warning=ExperimentalWarning --experimental-strip-types \
     scripts/smoke/_tmp_pool_saturation.ts            # scala pura 2..6 + coda mista
node --disable-warning=ExperimentalWarning --experimental-strip-types \
     scripts/smoke/_tmp_pool_saturation.ts --mixed    # 3 uscenti + 3 entranti puliti
```

Esito atteso su questo HEAD: `3/6 verdi` la prima, `1/4 verdi` la seconda.

---

## 12. Fase B1 — esito (2026-08-25)

GO ricevuto sulla sola (e). Diff in `DynamicHandles.tsx`, un file, fuori dalla
tabella §3.1: la chiave di invalidazione passa dall'insieme degli handle id alle
**posizioni calcolate** (`sidePositionsBySide`, chiave `handleId:role`), piu' una
coalescenza per frame delle chiamate a `updateNodeInternals`.

**Perche' la chiave vecchia non scattava.** `activeHandles` e' un `Set` di handle
id **senza ruolo**. Un arco entrante che atterra su `right-0`, gia' presente come
source, lascia l'insieme invariato: nessuna rimisura, mentre `computeSidePositions`
aveva appena ridistribuito ogni endpoint del lato su N+1 slot. E il valore 426,5 su
cui cadevano tutti gli entranti (§3.2) e' il 50% con cui React Flow aveva misurato
quell'handle **da inattivo**, l'unica volta che l'ha misurato.

### 12.1 D2 chiuso

| caso | prima | dopo |
|---|---|---|
| `--mixed` (3 uscenti + 3 entranti) | 1/4 verdi, attacchi 413,3 / **426,5 ×4** / 439,8 | **4/4 verdi**, attacchi a passo 7,5 / 7,6 / 7,6 / 7,5 / 7,6 |
| scarto attacco↔ancora, ogni nodo e ogni lato | fino a 19px sull'hub, 0,5 sul centro per gli entranti | **0px ovunque, in ogni stadio di ogni corsa** |

### 12.2 Domanda 1 chiusa: era D2

La sonda ora registra le ancore rese per **tutti** i nodi, non solo per l'hub. Le
tre coppie a 0px su `b4:left`, `b5:left`, `b6:left` **spariscono**: 17,6px di
distanza, due ancore distinte (`left-0` target e `left-0` source), scarto
attacco↔ancora 0px. Non era la deconfliction, che resta intatta e non e' stata
toccata.

### 12.3 R0 invariato al pixel

| archi | prima | dopo |
|---|---|---|
| 2 | ys 417,7 / 435,3 — passo 17,6 | identico |
| 3 | ys 413,3 / 426,5 / 439,8 — passi 13,2 / 13,3 | identico |
| 4 | ys 410,6 / 421,2 / 431,8 / 442,4 — passi 10,6 ×3 | identico |

### 12.4 D1 intatto e ora isolato

`F3-5` e `F3-6` restano rossi con gli stessi numeri di prima (10,6 ×3 poi 0, 0) e il
warn del clamp e' ancora emesso. Nella coda `MIX-6+3` il lato porta sette endpoint
distinti a 6,6px — sopra la soglia — e le uniche tre coppie a 0px sono esattamente
i tre archi tosati su `right-3`. Il bersaglio del prossimo giro e' pulito.

### 12.5 Domanda 4 chiusa: il costo c'era, la coalescenza lo riassorbe

Harness `docs/benchmarks/` a scala 500/1000 (1500 archi), tre run per variante,
mediane. Ambiente: M3, build di produzione su `vite preview`.

| variante | `t_edges_settle_ms` | `commits_open_flow` | `edit_flow.ms` | `commits_edit_flow` |
|---|---|---|---|---|
| prima | 39 492 | 2 010 | 6 406 | 22 |
| (e) senza coalescenza | 50 265 | **2 144** | 8 743 | 26 |
| **(e) con coalescenza** | 41 386 | **1 607** | 7 406 | **22** |

I tempi hanno una dispersione che copre la differenza (prima 32,5–49,2 s di settle,
dopo 14,0–45,1 s): sui millisecondi non si puo' dichiarare nulla, e non lo si
dichiara. I **conteggi di commit** invece non si sovrappongono fra le tre serie, ed
e' li' che si legge il segnale: la chiave piu' fine costava 134 commit in piu'
all'apertura e 4 alla mutazione singola.

**Scelta dichiarata: coalescenza, non debounce.** Ogni nodo programmava il proprio
doppio rAF e la propria `updateNodeInternals` da una voce sola; ora i nodi di uno
stesso flow confluiscono in una `Map` unica, svuotata da un solo doppio rAF
(`updateNodeInternals` accetta gia' una Map). Nessun ritardo aggiunto: la latenza
resta esattamente due frame, come prima. Un debounce l'avrebbe allungata, e su un
aggiornamento che l'utente vede come «l'arco si attacca al pallino» il ritardo e'
proprio la cosa da non introdurre.

Effetto collaterale voluto: la coalescenza raccoglie anche le invalidazioni che
esistevano gia' prima della (e), quindi `commits_open_flow` scende **sotto** la
baseline (1 607 contro 2 010, −20%) e `commits_edit_flow` torna a 22, il valore di
partenza. `rf_edges` resta 1500/1500: la vittoria del clamp (`2ddedca53`) e' intatta.

L'elemento del nodo si risolve al momento dello svuotamento e non a quello della
programmazione: un nodo rimontato nel frattempo sarebbe altrimenti misurato
attraverso un elemento staccato dal documento. Il batch e' indicizzato sull'oggetto
`storeApi`, stabile per `ReactFlowProvider`, cosi' due flow a schermo non si
mescolano.
