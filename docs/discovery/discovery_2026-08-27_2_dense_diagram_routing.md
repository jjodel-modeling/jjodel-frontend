# Diagramma denso — inclinazioni, corsie sovrapposte, maniglie mancanti

> 2026-08-27, secondo report della giornata. Fase 1 read-only sul prompt dei cinque
> difetti osservati sul metamodello StateMachine (Heater, ~10 nodi).
> **Nessuna modifica al sorgente.** Sonda vitest usa-e-getta creata e cancellata dentro
> la fase; tutte le cifre qui sotto sono sue, non letture del codice.
>
> Segue `discovery_2026-08-27_reference_edge_routing.md` e ne misura una **regressione**
> (difetto 5, §5 qui sotto).

---

## 1. Ipotesi che questa fase falsifica

| # | Ipotesi | Esito |
|---|---|---|
| H1 | I segmenti inclinati vengono da ancore calcolate su bounding box diversi | **Falsa nella causa, vera nell'effetto.** Le ancore sono frazionarie, ma il router le tratta correttamente: l'inclinazione la introduce **solo** `avoidNodeRects` (§2) |
| H2 | Lo stub orfano è una sporgenza disegnata dopo il cambio di lato | **Non riprodotta.** Zero spur sulla pipeline pura in 720 archi (§3). Serve evidenza dal DOM |
| H3 | Le corsie sovrapposte sono un difetto di `applyBundleSpread` | **Falsa.** `applyBundleSpread` distanzia solo archi della **stessa coppia** di nodi; fra coppie diverse non esiste alcuna assegnazione di corsia (§4) |
| H4 | Le maniglie mancano su alcuni archi | **Vera e più grave del previsto**: mancano sul **57%** degli archi, contro l'1,9% prima del commit di stamattina (§5) |

---

## 2. Difetto 1 — l'inclinazione nasce in `avoidNodeRects`, e in nessun altro punto

Misura per stadio della pipeline, 40 scene da 10 nodi e 18 archi (720 archi in tutto),
lati scelti dal minimizzatore, ancore da `computeHandlePositionForNode`, indici da
`computePortDistribution` — cioè la catena vera:

| stadio | archi con almeno un segmento non assiale |
|---|---|
| dopo `computeManhattanPath` | **0** |
| dopo `applyBundleSpread` | **0** |
| dopo `avoidNodeRects` | **113** |

Dei 157 archi che `avoidNodeRects` ri-instrada, **113 (72%) escono inclinati**.

Il meccanismo è in una riga, `edgeUtils.ts:2109`:

```typescript
const uniq = (v: number[]) => Array.from(new Set(v.map((n) => Math.round(n * 2) / 2))).sort((a, b) => a - b);
```

La griglia delle corsie quantizza al **mezzo pixel**. Le ancore invece sono frazioni
`(k+1)/(N+1)` dell'altezza del nodo (`handlePosition.ts:285-290`): su un nodo alto 64
con due ancore, `y = nodeY + 64/3 = …,3333`. Poi `routeAroundRects` chiude con
`cleanPoints([S, ...back, T])`, che **rimette gli estremi veri**. Il raccordo fra
l'estremo vero e la prima corsia della griglia resta scostato fino a 0,25px.

Esempi misurati, primo segmento di un arco:

```
(771, 430.3333…) -> (783, 430.5)     dx = 12.00   dy = 0.17
(999, 596.3333…) -> (987, 596.5)     dx = 12.00   dy = 0.17
(513.5, 242)     -> (513.3333…, 196) dx =  0.17   dy = 46.00
```

Sono esattamente i «pochi px» del prompt. Da notare: `cleanPoints` ha tolleranza 0,5px
sia sui duplicati sia sulla collinearità, quindi **non se ne accorge**, e
`ensureOrthogonalEndpoints` considera `startOK` con `<= 0.5` di scarto: nemmeno lui
inserisce lo stub che raddrizzerebbe il tratto.

**Conseguenza per il fix**: quantizzare *a valle di tutto* (come chiede il prompt) è
corretto ma va fatto sapendo che gli estremi sono i punti d'aggancio veri. Se si
arrotonda l'estremo, l'arco si stacca dall'ancora; se si arrotonda solo la corsia,
resta lo scarto. La forma sana è **portare gli estremi nella stessa griglia della
corsia** dentro `routeAroundRects`, e in più una passata finale che, trovato un
segmento con uno scarto sotto 1px su un asse, lo appiattisce sull'altro.

---

## 3. Difetto 2 — non riprodotto: non ho una causa da dichiarare

Sulla pipeline pura, 720 archi, cercando un ritorno sullo stesso asse maggiore di 2px
(la forma che disegnerebbe una L staccata): **zero occorrenze**. Il primo giro di sonda
ne segnalava 84, ma erano il difetto 1 travestito — la soglia era a 0px e catturava
l'oscillazione sub-pixel.

Escluse per misura o per lettura:

- **Non è il connettore d'ereditarietà**: il fixture non ha `eSuperTypes` (verificato
  con controllo positivo sullo stesso comando: `eSuperTypes` → 0 occorrenze, exit 1;
  `eStructuralFeatures` → 17, exit 0).
- **Non sono gli archi-ponte**: `emitLineWithBridges` emette solo `L` e `A`, mai un
  `M`, e `filterCrossingsForSegment` scarta gli incroci fuori dai limiti del segmento
  (`edgeUtils.ts:1904-1912`).
- **Non sono le maniglie**: `SegmentHandles` ed `EndpointHandles` disegnano `div`
  tondi da 10px, non tratti.

Restano da guardare, e serve il DOM per farlo:

1. **Trabocco del pool di handle.** `portDistribution` clampa l'indice a
   `MAX_HANDLES_PER_SIDE`; il commento a `portDistribution.ts:85` dice che un indice
   oltre il pool «points at a handle React Flow never measured, and the edge vanishes».
   Con Heater che porta 7 composizioni su un nodo solo, il trabocco è plausibile: un
   arco con `sourceX/sourceY` non misurati disegnerebbe un frammento corto vicino
   all'origine del nodo. **È il candidato che spiegherebbe sia la posizione (angolo del
   nodo) sia la lunghezza (~20px, cioè `STUB_LENGTH`).**
2. Un `<path>` con `d` stantio rispetto alle ancore correnti (memo non invalidata).

**Non propongo un fix per questo difetto finché non lo vedo nel DOM.** Serve o uno
screenshot con l'elemento selezionato nell'ispettore, o una sonda che importi il
fixture e dumpi ogni `d` — vedi §7.

---

## 4. Difetti 3 e 4 — non esiste alcuna assegnazione di corsia fra archi diversi

`applyBundleSpread` (`edges/bundleSpread.ts`) distanzia il corridoio centrale degli
archi **paralleli della stessa coppia di nodi**, ordinati per posizione fisica
dell'ancora. Fra archi di coppie diverse che finiscono nello stesso corridoio non c'è
nulla.

Misura, stesse 40 scene, coppie di segmenti paralleli di archi **diversi** con
sovrapposizione di almeno 8px lungo il proprio asse:

| criterio | occorrenze |
|---|---|
| distanza < 8px | **198** (circa 5 per scena) |
| di cui < 2px | **98** |
| di cui con almeno un segmento **terminale** (il tratto d'approccio) | **90** |

Esempi:

```
e0 vs e3 : gap = 0.00px, sovrapposizione = 179px
e0 vs e3 : gap = 0.00px, sovrapposizione = 272px
e0 vs e15: gap = 3.00px, sovrapposizione = 208px
e1 vs e16: gap = 0.33px, sovrapposizione =  20px   (uno è terminale)
```

I 90 casi con segmento terminale sono il difetto 4 del prompt: l'approccio
all'arrowhead che corre dentro la corsia di un altro arco. Il difetto 4 **non è una
seconda funzione** ma un caso del 3, a patto che l'assegnazione di corsia includa i
segmenti terminali invece di fermarsi a quelli interni.

Le due leve che il prompt nomina esistono entrambe e sono indipendenti:

- **offset di corsia** — nuovo, non c'è nulla da riusare oltre alla forma di
  `applyBundleSpread`, che però lavora per coppia e non per corridoio;
- **spostare l'ancora lungo il lato** — esiste già: `computeSidePositions` distribuisce
  a `(k+1)/(N+1)` ordinando per centroide dell'altro capo
  (`handlePosition.ts:183-251`). Oggi però ordina solo gli endpoint **di quel nodo**,
  senza sapere se due archi che partono da lati diversi finiranno affiancati.

---

## 5. Difetto 5 — è una regressione del commit di stamattina, e la misuro

`SegmentHandles` monta una maniglia per ogni segmento **interno**, e ne servono almeno
tre in tutto (`SegmentHandles.tsx:30-33`):

```typescript
const internalSegments = useMemo(() => {
    if (segments.length < 3) return [];
    return segments.slice(1, -1);
}, [segments]);
```

Una L ha due segmenti, entrambi terminali: **zero maniglie**. Una Z ne ha tre: una
maniglia. Il commit `aabf292a2` ha reso la L la forma preferita sulle diagonali —
è la decisione A, «svolte prima della lunghezza», presa e ratificata stamattina.

Stesse 40 scene, stessa catena, cambiando **solo** la regola di scelta dei lati:

| regola dei lati | archi senza maniglie intermedie |
|---|---|
| asse dominante (prima di `aabf292a2`) | **14 / 720** (1,9%) |
| minimo di svolte (dopo) | **412 / 720** (57%), di cui 396 sono L a due segmenti |

**Ventinove volte tanto.** Il criterio nuovo produce tracciati più puliti e, con lo
stesso gesto, toglie all'utente il modo di correggerli a mano. È esattamente quello che
il prompt riporta: «sugli edge con routing lungo/errato mancano gli handle intermedi».

Secondo difetto, indipendente dal primo e preesistente: `SegmentHandles` riceve
`adjustedPath` (`UnifiedEdge.tsx:885`), cioè la polilinea **dopo i waypoint ma
prima** di `applyBundleSpread` e di `avoidNodeRects`. Su un arco ri-instradato attorno a
un corpo — 157 su 720 nella misura — le maniglie stanno su una linea che non è quella
disegnata.

---

## 6. Dipendenze e rischi

1. **La forma dei waypoint è legata all'indice di segmento.** `EdgeWaypoint` è
   `{segmentIndex, offset}` e `applyWaypoints` **salta il primo e l'ultimo segmento**
   (`edgeUtils.ts` `applyWaypoints`, «Skip first/last segments — anchor endpoints must
   stay fixed»). Mettere una maniglia sulla L significa decidere cosa fa: o si ammette
   l'offset sui segmenti terminali (e allora l'ancora si sposta lungo il lato, che è
   anche la leva del difetto 4), oppure la maniglia sulla L **spezza** il tracciato in
   una Z introducendo un segmento interno. Sono due semantiche diverse e vanno scelte.
2. **`segmentIndex` non è stabile** se il numero di segmenti cambia: un waypoint
   persistito su `DVertex.irEdgeLayout` (R-B10) punterebbe a un altro segmento. Oggi il
   problema è mascherato perché il cambio di lato azzera i waypoint
   (`EditorV2.tsx:3810`); qualunque intervento sulle maniglie deve dichiarare cosa
   succede al pregresso.
3. **R-B12**: gli archi non ortogonali non registrano nulla per gli incroci. Una
   assegnazione di corsia che leggesse il registro li ignorerebbe — coerente, da
   dichiarare.
4. **Costo**: l'assegnazione di corsia è globale sul canvas, mentre oggi ogni
   `UnifiedEdge` calcola il proprio tracciato in isolamento. O si accetta una passata
   in `EditorV2.applyDistribution` (dove i dati ci sono già), oppure si passa dal
   registro dei tracciati (`registerEdgePath`), che però è popolato **dopo** il render.
   È la decisione architetturale del §7.
5. **La quantizzazione tocca `avoidNodeRects`**, che ha cinque prove
   (`nodeAvoidance.test.ts`) e la garanzia «stesso riferimento se non c'è violazione».
   Quella garanzia va preservata.

---

## 7. Domande aperte

**A. Il difetto 2 lo chiudo o lo rimando?** Non l'ho riprodotto e non ho una causa.
Due strade: (i) costruisco una sonda che importa `StateMachine.ecore` +
`sample-StateMachine.xmi` e dumpa ogni `d` con i rect — mezz'ora di lavoro, e chiude il
punto con evidenza; (ii) me lo dici tu ispezionando l'elemento nel browser (tasto destro
sul frammento → Ispeziona: mi serve il `d` e la classe del `<path>`). Se nessuna delle
due, lo lascio aperto e dichiarato invece di inventare un fix.

**B. La maniglia sulla L: sposta l'ancora o spezza il tracciato?** È la decisione del
rischio 6.1. Sposta l'ancora = la leva che serve anche al difetto 4, ma cambia la
semantica di `EdgeWaypoint`. Spezza = più conservativo, ma un arco a 1 svolta diventa a
2 appena lo tocchi.

**C. Dove vive l'assegnazione di corsia?** In `EditorV2.applyDistribution`, che vede
tutti gli archi e già scrive `roleArcShift`/`cardinalityShift` sui dati dell'arco
(quindi un `laneShift` sarebbe lo stesso pattern); oppure dentro `UnifiedEdge` leggendo
il registro dei tracciati, che però è popolato dopo il render e darebbe un frame di
ritardo. **Raccomando `applyDistribution`.**

**D. Ordine e taglio.** I cinque difetti non hanno lo stesso peso. Il 5 è una
regressione mia di stamattina e il 1 è una riga; il 3 e il 4 sono una funzionalità
nuova. Propongo due fette: **fetta 1** difetti 1 e 5 (più il 2 se rispondi ad A),
**fetta 2** difetti 3 e 4 con la loro ratifica. Se preferisci tutto insieme lo dico
subito: sono sopra i 5 file e serve conferma comunque.

---

## 8. Perimetro previsto

**Fetta 1** — `utils/edgeUtils.ts` (quantizzazione in `routeAroundRects` e passata
finale di appiattimento), `edges/SegmentHandles.tsx` (maniglie anche sulla L, secondo
la risposta a B), `edges/UnifiedEdge.tsx` (passare alle maniglie la polilinea
disegnata, non `adjustedPath`), più i due file di test già esistenti.

**Fetta 2** — un modulo nuovo per le corsie, `EditorV2.tsx` (`applyDistribution`),
`edges/UnifiedEdge.tsx` (consumo del `laneShift`), test propri.

Fuori perimetro in entrambe: `portDistribution.ts` e `handlePosition.ts` — a meno che
la risposta a B sia «sposta l'ancora», nel qual caso `handlePosition.ts` entra e con
esso la critical zone di CLAUDE.md §3.1, quindi Layer Impact Report.

---

# Fase 2, fetta 1 — difetti 1 e 5 (2026-08-27)

GO di Alfonso: sonda che importa il fixture per il difetto 2; maniglia sulla L che
**spezza in Z** (decisione B, `EdgeWaypoint` invariato, l'ancora non si muove); due
fette, prima 1+5+2.

## 9. La sonda: `scripts/smoke/_tmp_dense.ts`

La macchina Heater ricostruita in pagina con le API pubbliche — dieci oggetti,
diciotto archi — e cinque criteri sul `d` letto dal DOM. Gitignorata come tutte le
`_tmp_`.

**Due correzioni di metodo, entrambe misurate e entrambe decisive.**

1. **La selezione va verificata prima di leggere le maniglie.** La prima corsa
   dichiarava «0 maniglie» su un arco a 11 segmenti. Con la verifica aggiunta si e'
   visto che il click cadeva su un **altro** arco (`selezionato=false`, ma un arco
   selezionato in pagina c'era): una selezione mancata e un difetto delle maniglie
   producono lo stesso silenzio. La sonda ora misura **l'arco che risulta davvero
   selezionato**, non quello mirato.
2. **La tolleranza di ortogonalita' era troppo larga.** Con 0,5px la sonda dichiarava
   verde un tratto di 12px inclinato di 0,19px — che a schermo si vede. Il criterio del
   prompt e' `x1 === x2 oppure y1 === y2`: portata a 0,01px, con i raccordi esclusi per
   lunghezza (sopra 8px, cioe' sopra ogni raggio in uso).

Con la tolleranza giusta il difetto 1 si e' riprodotto sul canvas: **5 archi su 18**,
tutti sul tratto d'approccio da 12px (`AVOID_STUB_OUT`):

```
(210.859375, 71.1875)   -> (223, 71)        dx = 12.1  dy = 0.19
(874, 60.5)             -> (886, 60.59375)  dx = 12    dy = 0.09
(89.203125, 107)        -> (89, 119)        dx = 0.20  dy = 12
```

Ancora frazionaria da una parte (`(k+1)/(N+1)` dell'altezza), corsia a mezzo pixel
dall'altra.

## 10. Difetto 1 — corretto

**`routeAroundRects`**: la griglia arrotonda al mezzo pixel le corsie **degli
ostacoli**, e lascia esatte le coordinate degli **stub**. Prima entravano
nell'arrotondamento anche loro, e `cleanPoints` rimetteva l'estremo vero: restava lo
scarto.

**`snapAxial`** (nuova, esportata): cintura a valle che appiattisce sugli assi uno
scarto sotto 1px **senza mai muovere i due estremi** — il primo segmento si allinea al
primo punto, l'ultimo all'ultimo. Torna lo stesso riferimento quando non c'e' nulla da
correggere, quindi un caso sano resta byte-identico.

Verifica: sul canvas D1 passa, 18 archi su 18. In unita', quattro prove nuove in
`nodeAvoidance.test.ts`, e la prima e' passata dal **controllo negativo**: rimettendo
l'arrotondamento sugli stub fallisce (1 failed / 8 passed), con la correzione passa.

## 11. Difetto 5 — corretto, e la causa non era quella che avevo scritto in §5

La misura sul canvas ha corretto la mia diagnosi. Non erano solo le L a due segmenti:
archi con **sei e sette segmenti resi** mostravano **zero** maniglie. La causa vera e'
che `SegmentHandles` riceveva `adjustedPath`, la polilinea **prima** dell'evitamento
degli ostacoli: su un arco ri-instradato quella ha meno di tre segmenti, e sotto i tre
non compariva niente. La L a due segmenti e' un caso particolare dello stesso difetto,
non la sua causa.

Tre cambiamenti:

1. **I waypoint chiudono la catena.** Erano applicati subito dopo il router; ora dopo
   lo spread e l'evitamento. Il loro indice di segmento si riferisce cosi' alla
   polilinea che l'utente vede. `applyBundleSpread` conserva il numero di punti (agisce
   solo su polilinee a quattro), quindi **gli indici gia' persistiti restano validi**.
   L'evitamento resta saltato quando ci sono waypoint: R-B10 invariata.
2. **`applyWaypointsWithMap`** (nuova) ritorna anche la corrispondenza fra i segmenti
   in ingresso e quelli in uscita. Le maniglie si **contano** sulla polilinea del router
   e si **disegnano** su quella resa: senza la mappa i due riferimenti divergono appena
   un waypoint terminale inserisce un punto.
3. **Maniglie su ogni segmento, terminali compresi.** Trascinare un terminale non
   sposta l'ancora: inserisce una gomitata che conserva il tratto perpendicolare, e la
   L diventa una Z (decisione B). Il segmento interno mantiene la semantica di sempre —
   due punti spostati, nessuno inserito — e una prova lo confronta con la vecchia firma.

Verifica sul canvas, stessi archi di prima:

| arco | prima | dopo |
|---|---|---|
| 7 segmenti | 0 maniglie | **4** |
| 6 segmenti | 0 maniglie | **4** |
| 5 segmenti | 1 maniglia | **5** |

## 12. Difetto 2 — non riprodotto nemmeno sul canvas

D2a (nessun `d` con piu' di un `M`) e D2b (ogni capo d'arco su un handle) passano su
tutti e diciotto gli archi, prima e dopo la fetta. Il frammento a L non si vede in
questa scena.

Cosa vuol dire, e cosa no: la sonda ricostruisce la macchina Heater **con una
disposizione scelta da me**, non quella dello screenshot, e senza passare
dall'importazione da file. Non e' la riproduzione dello stato di Alfonso, e il difetto
resta aperto. Il candidato del §3 — trabocco del pool di handle — non e' escluso: con
320 handle nel pool e sette composizioni su Heater la scena non arriva a saturare.
**Serve la disposizione vera**: lo screenshot con l'elemento ispezionato, oppure le
coordinate dei nodi come stanno nel progetto di Alfonso.

## 13. Verifica della fetta 1

| gate | esito |
|---|---|
| `npx tsc --noEmit` | **33**, baseline invariata |
| `npm run build` | verde, solo l'avviso preesistente sui chunk |
| vitest `editor-v2` | **628/628** su 31 file (+10 prove) |
| vitest intero | **1525** passate |
| `npm run smoke` | 12 passate, 0 fallite, 3 saltate |
| sonda `_tmp_dense.ts` | **9/10**: D1, D2a, D2b, D4 e tutti i D5 verdi; resta rosso il solo D3 |

D3 resta rosso per costruzione: e' la fetta 2. Misura invariata, 44 coppie di segmenti
paralleli sotto gli 8px su 95 segmenti, con minimi a 0,00px.

## 14. Cambiamenti di comportamento dichiarati

1. **`applyBundleSpread` ora si applica anche agli archi con waypoint**, prima saltati.
   Conserva il numero di punti, quindi nessun indice persistito si sposta; l'effetto
   visivo e' che un arco con waypoint dentro un fascio ora prende anche lo scostamento
   di corridoio.
2. **Le maniglie compaiono su ogni segmento**, terminali inclusi. Un arco a una svolta
   passa da zero maniglie a due.
3. **Registrazione degli incroci e rilevazione** ora leggono la polilinea **resa** (dopo
   i waypoint) invece di quella pre-waypoint: gli archi-ponte finiscono dove la linea
   passa davvero.
