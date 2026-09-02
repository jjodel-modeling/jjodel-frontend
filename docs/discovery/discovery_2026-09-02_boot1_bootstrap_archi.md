# BOOT1 — il gate dello Step 4, e gli archi che il bootstrap non disegnava

Data 2026-09-02. Branch `alfonso-frontend-jjtl`. Perimetro
`components/editor-v2/hooks/useJjomSync.ts` (critical zone, §3.1),
`components/editor-v2/sync/m1EdgeGate.ts` nuovo, e il suo test. Tre file.

**Ipotesi che questa discovery falsifica**: due, e nessuna delle due sopravvive.
«Il grafo non esisteva al momento della create» — falsa, esisteva, ed e' quello giusto.
«L'arco manca perche' `findVertexIdForObject` ritorna `null` e la creazione esce con il
warn» — vera per la *sola* containment, e falsa per la reference `authors`, che di quel
percorso non passa affatto.

## 1. Riprodurre, prima di spiegare

Tre ordini possibili, tutti misurati con la sonda `scripts/smoke/_tmp_boot1_verify*.ts`
(`.gitignore:66`, non committate), guidate dalla UI vera: il Data Manager aperto dalla
rail dei modelli (`LeftBar.tsx:380` -> `DockManager.openManager`), la CTA «Add Edition»
cliccata, la draft compilata e committata. `pageerror` 0 in tutte e tre.

Fixture: `Book --authors*--> Author` (reference), `Book --editions*--> Edition`
(containment). `A : Author` e `Book_0 : Book` radici, `Edition_0 : Edition` creata dalla
CTA dentro lo slot, `Book_0.authors = [A]`.

| | quando nasce il grafo v2-flow | nodi disegnati | archi |
|---|---|---|---|
| **A** mai aperto il canvas | alla prima apertura | `A`, `Book_0` — **Edition_0 assente** | 1 (`authors`) |
| **B** canvas aperto e RESTATO montato | prima delle create | tutti e tre | 2 |
| **C** canvas aperto una volta e **chiuso** | prima delle create | `Edition_0`, `A`, `Book_0` | **0** |

**C e' la schermata di Alfonso**, riga per riga: tre nodi radice nell'ordine DOM
`["Edition_0 : Edition", "A : Author", "Book_0 : Book"]` e `.react-flow__edge` = 0.
A non lo e' — li' `Edition_0` non e' nemmeno disegnata. La premessa del prompt, «progetto
che non ha mai avuto un grafo», e' quindi falsa per lo stato osservato: il grafo c'era.
Nasce alla prima apertura del canvas (`useJjomSync.ts:717`, Step 1) e **sopravvive alla
chiusura della tab** — quello che manca alla seconda apertura non e' il grafo, e' il canvas
montato nel frattempo.

## 2. Le tre domande

### 2.1 Chi ha creato il vertice di `Edition_0`, e contro quale `graphId`

`createAdapter.syncChildToFlow` (`createAdapter.ts:445`), il fix di VIEW1, contro il grafo
**gia' esistente**. Misurato in C, subito dopo la create e prima di riaprire il canvas:

```
Edition_0  father=DValue  inModelObjects=false
           vertice=Pointer…_USER_39  graphOfVertex=Pointer…_USER_25_graph3  x=0  y=0
```

`graphOfVertex` **coincide** con l'unico grafo v2-flow distinto del modello. Delle due
strade che il prompt mette in alternativa vince la **(i)**: il vertice sta nel grafo vero,
non e' agganciato a un `graphId` inesistente e non viene adottato dopo. Non c'e' niente da
riparare qui.

Le coordinate `(0, 0)` sono la firma del difetto, non un caso: `syncChildToFlow` cascata a
destra del vertice del padre e lascia `x = y = 0` quando quel vertice non c'e'
(`createAdapter.ts:459-467`). E' per questo che `Edition_0` finisce **la piu' a sinistra**
della fila — lo Step 2bis dispone da `x = 50` in poi (`useJjomSync.ts:766-770`), e con un
vertice gia' in `subElements` parte da `globalIdx = 1`, misurato: `A` a `(470, 50)`,
`Book_0` a `(890, 50)`.

### 2.2 Perche' nessun arco

Due cause distinte, verificate separatamente. Non e' un difetto solo.

**La containment `editions` — ipotesi del prompt CONFERMATA.** Il warn, verbatim, catturato
durante la create dal manager:

```
[warning] [canvasToJjom] createCompositionEdgeForObjects: vertex(es) not found
  {graphId: Pointer…_USER_25_graph3, parentObjectId: Pointer…_USER_32,
   childObjectId: Pointer…_USER_36, parentVertexId: null, childVertexId: null}
```

E' il warn di `canvasToJjom.ts:1430`. Da notare, e non previsto dal prompt: **`null` sono
tutti e due**. Non solo il padre — anche il vertice del figlio, che
`createVertexForObject` ha appena creato una riga sopra (`createAdapter.ts:474-476`), e che
`findVertexIdForObject` non vede perche' rilegge lo store. E' il regime della transazione
sempre aperta gia' misurato in VER2 (`reducer.ts:1443`): la scrittura non e' ancora
visibile. Quell'arco quindi non poteva nascere li' **in nessun caso**, con o senza il padre.

**La reference `authors` — ipotesi del prompt FALSIFICATA.** Quell'arco non passa da
`createCompositionEdgeForObjects`, non produce alcun warn, e nessun warn compare durante la
riapertura del canvas: il valore dello slot viene scritto quando il canvas e' smontato, e
alla riapertura tocca al bootstrap disegnarlo. Non lo disegna, e in silenzio.

Il punto e' `useJjomSync.ts`, ed e' un **contatore**:

- lo Step 4 (`:1016` prima del fix) e' protetto da `if (missingM1EdgeCount > 0)`;
- quel contatore risolve **entrambi** gli estremi attraverso `vertexIdByModelId`, che a quel
  punto contiene solo i vertici **persistiti** nel grafo, e viene calcolato **prima** che lo
  Step 2/2bis crei i mancanti. Il commento a `:591-592` lo dichiara pure: «check BEFORE
  creating vertices — we need vertex IDs for edges, and some may not exist yet»;
- in C nessuna delle due radici ha un vertice: `srcV` e' `undefined`, il `continue` scatta,
  il contatore esce **0**, e lo Step 4 non gira. Mai piu': nessuna dipendenza dell'effetto
  cambia in modo da riportarcelo.

E la rete di sicurezza non scatta. `useM1ReferenceEdges` ha dipendenze
`[modelid, graphId, m1RefValuesSig]` (`useM1ReferenceEdges.ts:230`): in C il grafo
**pre-esiste** al mount, `graphId` non transisce, la firma degli slot non cambia, quindi
l'effetto parte una volta sola — prima che i vertici esistano — e non torna.

E' esattamente la differenza fra C e A. In A il grafo nasce **a quel mount**, `graphId` fa
`null -> G`, `useM1ReferenceEdges` riparte a vertici gia' fatti, e l'arco `authors` **viene
disegnato** (misurato: 1 arco). Stesso codice, stesso modello, stesso ordine di creazione:
cambia solo quando arriva il grafo. Cio' che decide non e' il modello, e' il gate.

### 2.3 Ordinamento

**Il bootstrap fa gia' due passate**, e la misura lo conferma: Step 2 (`:726`) e Step 2bis
(`:752`) creano **tutti** i vertici, poi Step 3 (`:781`) e Step 4 gli archi, e lo Step 3
rilegge pure lo store a `:783` per raccogliere i vertici appena fatti — lo Step 4 fa lo
stesso a `:1017`. Non procede per oggetto, e la posizione radice di `Edition_0` non viene
dall'ordine ma dalle coordinate `(0,0)` del §2.1.

Il difetto e' altrove, e il prompt chiede di dirlo invece di forzare una delle due
direzioni: **il gate dell'ultima passata e' calcolato sulla fotografia che precede la
prima**. Lo Step 3 non ne soffre perche' il suo ciclo di creazione **non e' protetto** dal
proprio contatore (`for (const entry of classifierEntries)`, `:800`, incondizionato) e gli
archi M2 li disegna comunque. Lo Step 4 e' protetto. **L'asimmetria era il difetto.**

## 3. La direzione scelta, e quella scartata

**Scelta — il gate concorda con la passata che protegge.** Il contatore distingue «questo
estremo non ha un vertice» da «non ce l'ha *ancora*»: un oggetto che lo Step 2bis sta per
disegnare e' una ragione per **far girare** lo Step 4, non per saltarlo. Un estremo pendente
non porta chiave, perche' un arco non puo' essere chiavato su un vertice che non esiste, e
quindi non puo' esistere: manca per costruzione. Costo reale: il contatore puo' solo
crescere, e non puo' produrre duplicati — lo Step 4 chiave su `existingEdgeKeys` e marca
`markCanvasEdgePair`, che e' cio' che `useM1ReferenceEdges` legge per stare alla larga dalla
stessa coppia. Nessun creatore avvolto in un `TRANSACTION` (regola 12 / §3.3): il blocco
cambiato **non scrive nulla**.

**Scartata — archi differiti in coda.** Introdurrebbe uno stato temporaneo, un momento in
cui la coda si svuota e una risposta da inventare per un bersaglio che non arriva mai. Tutte
e tre le domande sono gia' risolte dal codice esistente — la passata c'e', il momento in cui
gli archi si fanno c'e', e uno Step 4 che rigira a vertici pronti trova tutto. Una coda
sarebbe un secondo meccanismo per un problema che ne aveva gia' uno, rotto solo nella
guardia. **Scartata anche «due passate»**, per la ragione opposta: esistono gia', e
aggiungerne una terza avrebbe nascosto il difetto invece di toglierlo.

`m1EdgeGate.ts` e' un modulo nuovo e non un blocco inline per una ragione misurata:
`useJjomSync.ts` non e' raggiungibile sotto vitest (la barrel arriva a monaco, che
dereferenzia `window` all'import — sono i **9** file che non si raccolgono), e il difetto era
un **conteggio**. Un conteggio che non si puo' eseguire in un test si puo' solo leggere, e
leggerlo e' esattamente cio' che non l'ha visto per tutta la sua vita. Stesso taglio, e
stessa ragione, di `refEdgeReconcile.ts` accanto, che ha estratto dall'hook la decisione
dello Step 3.

## 4. Le misure, per oggetto

Variante C, `graphId` = `Pointer…_USER_25_graph3` in ogni riga e in ogni colonna.

| | vertice prima | pos. prima | vertice dopo | pos. dopo | arco entrante prima | arco entrante dopo |
|---|---|---|---|---|---|---|
| `A` | **nessuno** | — | `…USER_41` | (470, 50) | — | `authors` da `Book_0` |
| `Book_0` | **nessuno** | — | `…USER_43` | (890, 50) | — | — |
| `Edition_0` | `…USER_39` | (0, 0) | `…USER_39` | (0, 0) | **nessuno** | `editions` da `Book_0` |

| | prima del fix | dopo |
|---|---|---|
| il grafo v2-flow esiste | PASS | PASS |
| ognuno dei tre ha un vertice | PASS | PASS |
| **l'arco `authors` `Book_0 -> A`** | **FAIL** | PASS |
| **l'arco di containment `editions` `Book_0 -> Edition_0`** | **FAIL** | PASS |
| **`Edition_0` non e' un nodo radice** | **FAIL** | PASS |
| **totale** | **10 PASS / 3 FAIL** | **13 PASS / 0 FAIL** |

Il canvas, misurato sul DOM: 3 nodi e **2** `.react-flow__edge` dopo, 3 nodi e **0** prima.
`pageerror` 0 in entrambe.

**Variante A, controllo di non-regressione**: 12 PASS / 3 FAIL prima *e* dopo, identica. I
suoi tre rossi sono un residuo diverso e dichiarato — vedi §6.

## 5. Test e mutazioni

`sync/__tests__/m1EdgeGate.test.ts`, **9 casi**, verdi. Il fixture e' lo stato misurato in
C, non uno inventato. Le asserzioni sono di **identita'** — quale oggetto, quale
metareference, quale bersaglio, quale vertice — non di sola esistenza: VIEW1 ha mostrato che
un'asserzione di sola esistenza passa anche con una lookup cieca.

Cinque mutazioni, tutte rosse:

| mutazione | esito |
|---|---|
| il fix rimosso: il sorgente pendente torna a essere uno scarto | **3 rossi / 9** |
| la seconda passata annullata: nessun vertice e' mai «in arrivo» | **5 rossi / 9** |
| lookup cieca: ogni bersaglio risolve allo stesso vertice | **4 rossi / 9** |
| guardia di identita' rimossa: la chiave esistente non ferma piu' nulla | **1 rosso / 9** |
| ordine invertito: il bersaglio pendente giudicato prima del sorgente | **1 rosso / 9** |

## 6. Cosa resta aperto

- **Il figlio creato con ZERO grafi** (variante A). `syncChildToFlow` esce senza scrivere, e
  alla prima apertura `useJjomSync` non lo recupera perche' lo Step 2bis itera
  `model.objects` e un annidato non ci sta per costruzione (`joiner/classes.ts:774-784`).
  E' il residuo dichiarato di VIEW1 §6, non toccato: chiuderlo significa uscire dal
  perimetro **ratificato** `model.objects` (CRUD3 F2, `ConformanceValidator.ts:534`), che
  questo giro non fa.
- **Il vertice a `(0, 0)`.** Corretto sul piano degli archi — l'arco ora c'e' — ma la
  posizione resta all'origine finche' un layout non lo sposta. Registrato.
- **`childVertexId: null` nel warn del §2.2.** Il vertice appena creato non e' visibile alla
  rilettura dello store che segue. E' il regime della transazione sempre aperta, corsia sua.
- **Il chip vuoto sotto `Edition_0`: NON riprodotto.** Nel fixture i chip stanno su `Book_0`
  e sono etichettati entrambi (`mm-object__ref-pill` = `"A"` e `"Edition_0"`), e `Edition_0`
  non ne ha alcuno. Registrato e non corretto, come il prompt consente: la misura del punto 1
  non lo spiega.
- **`state.graphs` con id duplicati**: 2 entry, 1 grafo distinto, riconfermato qui. La
  selezione «primo match» ci passa sopra senza inciampare in questo giro.
