# Discovery: cablaggio della taglia da contenuto (D8/D9)

**Data**: 2026-08-15
**Autore**: chat Cowork (clone anonimo di origin + misura in Chromium headless)
**Branch**: `alfonso-frontend-jjtl`, HEAD letto `3f918cd1f` (contratto `contentRect` nel registry)
**Superficie**: la Fase 1 e' stata svolta con il bridge verso il Mac non disponibile, quindi su un
clone anonimo di `origin/alfonso-frontend-jjtl`. Il bridge e' tornato a fine fase e §13 riporta la
verifica sul working tree (`6cf99afa3`), che chiude i punti lasciati aperti in §2.
**Natura**: discovery read-only. Le sezioni sono marcate `[letto]`, `[misurato]` o `[inferito]`.

---

## 1. Obiettivo

Passo 2 della roadmap di fine sessione: *"cablaggio taglia da contenuto (D8/D9): ResizeObserver su
wrapper `width: max-content` in `IRNodeContent` -> `boxForContent`"*. La discovery doveva stabilire
dove agganciare la misura, dove scrivere il numero, e cosa puo' rompersi.

Esito in una riga: **il punto di scrittura e' gia' pronto e non innesca alcun write-back, ma il
primitivo di misura proposto e' sbagliato in due modi indipendenti, e uno dei due produce un loop
divergente, non un artefatto estetico.**

---

## 2. Limiti di questa discovery

- **Non e' stato letto il working tree.** Su origin manca `4b8833928` (assi bordo + marker), che
  tocca `IRNodeContent.tsx` aggiungendo un layer SVG di marker. Il DOM interno di
  `.ir-node-content` va quindi riverificato prima di implementare: le misure di §5 assumono i figli
  `svg` (diamante), `span.ir-label`, `div.ir-compartment`, e il ciclo di misura salta gia' i figli
  `svg`, ma un marker aggiunto come elemento non-svg entrerebbe nel conto.
- **I numeri assoluti in pixel non sono confrontabili con quelli del Mac.** Il container ha font
  diversi. Cio' che e' stato verificato qui e' invarianza, convergenza e contenimento geometrico,
  tutte proprieta' indipendenti dal font.
- **Il CSS del banco di prova e' una trascrizione** delle regole di `irStyle.ts` che pesano sul
  layout, piu' il floor `.mm-node` da `EditorV2.scss:1208`. Non e' l'app in esecuzione. Il codice
  della taglia invece **non e' trascritto**: `shapeRegistry.ts` e' stato transpilato con esbuild e
  importato come modulo, quindi le formule provate sono quelle vere.
- Gli script di misura stanno in `/home/claude/probe/` (`probe.mjs`, `probe2.mjs`, `probe3.mjs`,
  `probe4.mjs`, `probe5.mjs`). Vanno committati con questo report se si vuole poterli rieseguire.

---

## 3. File letti

- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (386 righe, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (315 righe, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (157 righe, integrale)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx:385-425` (ramo IR) e `:49-56`
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (integrale)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts:38-56, 172-254, 346-360`
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts:75-110`
- `frontend/src/components/editor-v2/EditorV2.tsx:954-1008, 2322-2339, 3474-3479, 3617-3633`
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx:114-141, 177-190, 282-295`
- `frontend/src/components/editor-v2/utils/portDistribution.ts`, `utils/handlePosition.ts` (ricerca)
- `frontend/src/model/dataStructure/GraphDataElements.tsx:450-458, 497, 668, 1088, 1339-1341, 1680-1682`
- `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts`, `IRContainmentHulls.tsx`

---

## 4. La catena della taglia oggi `[letto]`

Nel caso normale **nessuno scrive un numero**. `node.width` e `node.height` sono `undefined` e la
taglia nasce dal content-hug CSS, poi React Flow la misura in `node.measured`.

Un numero esplicito esiste solo in tre casi:

1. **Resize manuale.** `NodeResizer` (`ObjectNode.tsx:397-406`, floor `SHAPE_MIN_SIZE` = 24) non ha
   `onResize`; scrive `width`/`height` top-level sul nodo RF e la persistenza intercetta
   `onNodesChange` filtrando su `type === 'dimensions' && resizing` (`EditorV2.tsx:3617-3633`), che
   chiama `syncSizeToJjom` (`canvasToJjom.ts:75-82`): scrive `w`, `h`, **`isResized = true`**.
2. **Propagazione.** `JjodelEvents.PROPAGATE_VIEW_SIZE`, `EditorV2.tsx:957-1008`, scrive via
   `setNodes(... { width, height, measured: undefined })` e poi `syncSizeBatchToJjom`.
3. **Ricarica di un nodo gia' ridimensionato.** `manualSizeOf` (`jjomTransformers.ts:50-56`) emette
   `width`/`height` **solo se `raw.isResized`**. Il gate e' deliberato: ogni `DVertex` nasce con w/h
   di default, restituirli sempre congelerebbe i nodi auto-dimensionati.

Appena `width`/`height` diventano non-null, `hasExplicitSize` (`ObjectNode.tsx:53-56`) alza la
classe `ir-sized` sul `.mm-node` (`:394`) e `irStyle.ts:96-97` azzera i floor 140x40 e porta il box
a `width:100%; height:100%`. **Questo accade da solo**, ed e' anche il motivo per cui la taglia
derivata deve essere gia' giusta al primo colpo: dopo, il content-hug CSS non fa piu' da rete.

Il D-layer ha i campi: `w`, `h`, `isResized` su `DVoidVertex` (`GraphDataElements.tsx:1339-1341`) e
`DVertex` (`:1680-1682`).

`boxForContent`, `boxForContentNumeric` e `contentRect` **non hanno alcun consumatore di
produzione**: ricerca `command grep -rn --include=*.ts --include=*.tsx` su tutto `frontend/src/`,
solo il modulo che le definisce e `__tests__/shapeRegistry.test.ts`. L'affermazione
*"Nothing here is wired to a consumer yet"* (`shapeRegistry.ts:235-236`) e' verificata.

---

## 5. Il primitivo di misura: due candidati bocciati, uno che regge `[misurato]`

### 5.1 Union dei rettangoli di testo (Range sui text node)

E' quello che la testata del contratto prescrive (`shapeRegistry.ts:326-333`: *"the dimensions of the
content's INK (a Range over the text nodes)"*). Su un nodo con una sola label funziona: misurato su
box da 80, 140, 200 e 400 px, l'inchiostro resta **invariante** in 12 casi su 12 (3 forme x 4 label),
e sopravvive al clamp: su box da 80px lo span misura 78, l'inchiostro 255.97, `scrollWidth` 256.
L'ellissi e' un effetto di pittura, il testo continua a impaginarsi alla larghezza naturale.

Su un nodo con piu' parti **cade**, per due ragioni distinte:

- `margin: auto 0` su `.ir-label--center` e `margin-top: auto` su `.ir-label--bottom`
  (`irStyle.ts:27, 29`) distribuiscono lo spazio libero verticale. L'union dei rettangoli di testo
  cresce quindi con l'altezza del box: caso "label centro + bottom" misurato a `49.55`, `86.89`,
  `273.55`, `33.55` px di altezza su quattro box diversi.
- dentro `.ir-row` (`display:flex; gap:4px`, `irStyle.ts:37`) gli span si comprimono con il box,
  quindi anche la larghezza dell'union si muove: caso "label + 1 riga" misurato a `186.19`,
  `208.77`, `408.77`, `146.27`.

**Conseguenza sul loop.** `boxH = max(minBoxHeight, ceil(heightFactor * contentH))`. Se `contentH`
cresce con l'altezza del box, il box cresce a ogni giro e non converge. Non e' un rischio teorico:
l'iterazione a due passi diverge gia' al secondo (`label + 3 righe`, ellisse: `336x88 -> 409x99`).
Il pericolo del ResizeObserver non era quello che ci si aspettava (larghezza), era sull'altezza.

### 5.2 Somma per parte (ink di ogni figlio + suo chrome, altezze sommate)

Risolve i margini auto (caso "label centro + bottom" torna invariante: `58.19x28.59` su tutti e
quattro i box) ma **non** risolve la riga flex: "label + 1 riga" resta variabile
(`202.19`, `210.48`, `210.48`, `162.27`) perche' la larghezza intrinseca di una riga flex non e'
ricostruibile sommando i rettangoli dei figli quando i figli si sono gia' compressi.

### 5.3 Passo intrinseco: `max-content` su `.ir-node-content` stesso

Durante la misura si porta l'elemento alla sua taglia intrinseca (`width` e `height` a `max-content`,
`min-width`/`min-height` a 0, `aspect-ratio` ad `auto` per il cerchio), si legge il **border box**, si
ripristina. Tutto dentro un nodo IR e' `white-space: nowrap`, quindi `max-content` e' ben definito e
non c'e' cascata di reflow.

Risultati:

- **Invarianza**: 75 casi su 75 (3 forme x 5 contenuti x 5 box, da 60x30 a 800x400). Nessuna
  variazione, neppure di un centesimo di pixel.
- **Punto fisso**: 15 casi su 15 convergono in **un solo passo**. Rimisurare sul box calcolato
  restituisce lo stesso box.
- **Contenimento nella banda** (`contentRect` valutata sul box risultante): 15 su 15 `CONTIENE`.
  I margini piu' stretti sono `169.9 <= 170.0` (rect), `291.3 <= 291.4` (ellisse, tre righe).

### 5.4 Il wrapper proposto non va messo

Un wrapper `width: max-content` **attorno ai figli** di `.ir-node-content` romperebbe il layout: i
figli sono flex item con `order` esplicito (label top 0, center 1, inside 2, compartimento 3, bottom
4, `irStyle.ts:26-35`) mentre l'ordine nel DOM segue l'ordine di autoraggio dell'array
`compiled.labels` (`IRNodeContent.tsx:207`). Interponendo un wrapper i figli smettono di essere flex
item del content box, `order` diventa inerte e l'ordine visivo collassa sull'ordine del DOM; in piu'
`margin: auto 0` e `margin-top: auto` perdono il contenitore rispetto a cui centrare. Il
`max-content` va su `.ir-node-content`, non su un elemento nuovo.

---

## 6. Il chrome: `boxForContent` risponde in coordinate del contenuto `[misurato]`

`.ir-node-content` e' `box-sizing: border-box` con `border: 1px` (`irStyle.ts:50`), e i compartimenti
hanno `padding: 4px 8px` (`:35`). Il contratto ragiona sul contenuto, il consumatore scrive un border
box: la differenza sono esattamente i 2px di bordo.

Misura secca, forma `rect`, label lunga: `boxForContent` risponde **170**, il DOM smette di troncare
a **172**. Delta `+2`. Sulle forme geometriche il supplemento assorbe il bordo e il caso non si vede
(ellisse: 174 calcolati contro 172 necessari), ma su `rect` la regola degenera nell'identita' e i 2px
mancano tutti.

La correzione giusta e' **aggiungere il chrome dopo**, non prima: `boxForContent(ink) + chrome`,
perche' sommandolo prima il supplemento geometrico moltiplicherebbe anche il bordo (sul rombo
`k = 2`, quindi 4px invece di 2). Con questa formula i margini misurati diventano `+0` su rect con
label sola, `+1` con una riga, `+2` con tre righe, e restano positivi su tutte e tre le forme.

**Nota sul rombo**: il minimo DOM non e' un oracolo valido per il rombo, perche'
`.ir-shape--diamond` ha `overflow: visible` (`irStyle.ts:84`) e quindi non tronca mai; il testo esce
dal rombo invece di essere tagliato. Per il rombo l'unico criterio e' il contenimento nella banda
(§5.3), che passa. Questo e' anche il bug gia' a registro *"il taglio avviene al box e non al
contorno"*.

---

## 7. Lo zoom di React Flow `[misurato]`

Il viewport di React Flow porta `transform: scale(z)`. `getBoundingClientRect` restituisce quindi
pixel di schermo, non di layout, e una taglia derivata da quella misura seguirebbe lo zoom: si
rimpicciolisce la vista, il nodo si rimpicciolisce, il box calcolato si rimpicciolisce ancora. Loop
divergente pilotato dalla rotella del mouse.

Misurato su un antenato con `scale()`: a zoom 1, 0.5, 0.25, 1.75 e 2, `getBoundingClientRect` da'
`152.97`, `76.48`, `38.24`, `267.7`, `305.94`; `offsetWidth` da' `153` in tutti e cinque i casi.
`offsetWidth`/`offsetHeight` sono metriche di layout e i transform non vi entrano.

Costo: sono interi. `16.3` diventa `16`, cioe' arrotonda **per difetto** sull'altezza, mentre tutta
la catena di `boxForContent` arrotonda per eccesso di proposito (`shapeRegistry.ts:299-301`: *"with
`round` the short-label case lost 0.2px and the content ended up outside the outline"*). Serve un
pixel di franco esplicito sull'altezza, oppure leggere lo zoom dallo store RF e dividere. La prima
strada non ha dipendenze; la seconda e' esatta ma introduce un errore in virgola mobile e un
accoppiamento in piu'.

---

## 8. Dove finisce il numero `[letto]`

Il canale e' gia' in uso: `setNodes(nds => nds.map(n => ({ ...n, width, height, measured: undefined })))`,
esattamente cio' che fa la propagazione a `EditorV2.tsx:1000`, con il commento a `:997-998` che lo
dichiara *"the same channel the NodeResizer uses"*.

**Non innesca il write-back.** Il filtro di persistenza e' `resizing !== undefined`
(`EditorV2.tsx:3477-3479`): una scrittura programmatica genera un cambio `dimensions` con `resizing`
undefined, quindi `syncSizeToJjom` non parte. Il ciclo e' chiuso per costruzione, senza flag di
guardia da inventare.

**Ed e' bene che non parta.** `syncSizeToJjom` alza `isResized = true` (`canvasToJjom.ts:80`), che
renderebbe il nodo indistinguibile da uno ridimensionato a mano e disattiverebbe per sempre
l'auto-sizing al reload attraverso il gate di `manualSizeOf:51`. La taglia da contenuto e' una
funzione del contenuto: va ricalcolata al mount, non persistita.

Il corollario e' anche la regola di precedenza: **la taglia derivata si applica solo quando
`raw.isResized` e' falso.** Un resize manuale vince e disattiva il derivato per quel nodo, che e'
esattamente la semantica che il gate ha gia'.

---

## 9. Critical zone e propagazione ad altri layer `[letto]`

`portDistribution.ts` e `handlePosition.ts` **non leggono la taglia del nodo**: zero occorrenze di
`width`/`height`, con controllo positivo dichiarato sullo stesso comando e file (`computeSidePositions`
5 hit su `handlePosition.ts`, `MAX_HANDLES_PER_SIDE` 3 hit su `portDistribution.ts`). Il
posizionamento degli handle e' in percentuale per scelta esplicita (`DynamicHandles.tsx:282-295`), e
`insetFractionAt` restituisce una frazione proprio per questo (`shapeRegistry.ts:100-104`). **Cambiare
la taglia non richiede di toccare nessuno dei tre file**: gli handle seguono.

`DynamicHandles.tsx:114-118` legge `measured?.width` con fallback 180/80 per i centroidi
dell'ordinamento geometry-aware. E' l'unico punto che vede la taglia, e cambia solo l'ordine degli
endpoint per lato, non la loro posizione.

Nessuno dei file dell'elenco §3.2 di CLAUDE.md viene toccato, quindi il Layer Impact Report non e'
formalmente dovuto. Resta il fatto che `viewpoint/ir/` e' in critical zone per §3.1 e che il
cambiamento propaga alla geometria del canvas: **conviene produrlo lo stesso**, altrimenti il campo
del log resta ambiguo.

---

## 10. Rischi residui

1. **Elementi fuori da `.ir-node-content` non entrano nella misura**: il chip di collapse
   (`ObjectNode.tsx`, dopo `IRNodeContent`), lo stereotipo `«singleton»` e `NodeProblemIndicator`
   sono fratelli, non figli. Su un nodo geometrico stretto il chip puo' sbordare.
2. **Costo**: un passo `max-content` forza un reflow sincrono. Farlo a ogni commit di ogni nodo IR
   e' O(nodi) per ogni cambio di stato del canvas. Va legato a una chiave (firma del contenuto,
   forma, stile del testo) e non al render nudo.
3. **Caricamento dei font**: la prima misura puo' cadere prima che il font sia pronto. Serve un
   `document.fonts.ready` che rimisuri una volta.
4. **Contenitori**: gli hull sono overlay separati (`IRContainmentHulls.tsx`) e i figli restano nodi
   RF top-level, quindi la taglia del contenitore non dipende dai figli. I figli renderizzati come
   righe (`rowRenderedChildren`) invece stanno dentro il box e rientrano nella misura, correttamente.
5. **`GEOMETRIC_MIN_BOX_HEIGHT` vale 64** mentre la verifica visiva a otto casi fu fatta con 48
   (`shapeRegistry.ts:149-159`). I nodi geometrici verranno tutti piu' alti di quanto Alfonso ha
   visto in quella verifica.

---

## 11. Domande aperte

1. **Perimetro.** Solo forme geometriche (ellisse, cerchio, rombo) o anche `rect`/`rounded`? Su
   `rect` la regola degenera nell'identita' con i floor 140x40, cioe' riproduce il content-hug che
   gia' funziona ed e' comportamento verificato; ma cablarlo alza `ir-sized` e toglie la rete CSS.
   Il bug a registro (*"content-hug su forma geometrica"*) e' scoped alle geometriche.
2. **Trigger.** Layout effect su una firma esplicita, oppure ResizeObserver? La misura intrinseca e'
   indipendente dal box, quindi un ResizeObserver sul nodo non aggiunge informazione e spara a ogni
   nostra scrittura.
3. **Sede del codice.** `IRNodeContent` oggi non conosce React Flow. La misura puo' vivere in
   `ObjectNode` (che ha gia' `useStore`) con un ref sul content box, lasciando `IRNodeContent`
   invariato salvo il forward del ref.
4. **Franco verticale.** Un pixel fisso per l'arrotondamento di `offsetHeight`, o lettura dello zoom
   dallo store e divisione?
5. **Altezza minima.** Confermare 64 o riportarla a 48 dopo aver visto i nodi veri.

---

## 12. Cosa NON e' stato verificato

- Il working tree e il commit `4b8833928` (assi + marker) e il loro effetto sul DOM interno.
- Il comportamento nell'app in esecuzione: nessuna misura e' stata presa su `localhost:3001`.
- L'interazione con il `NodeResizer` visibile mentre la taglia derivata cambia sotto.
- Il caso del cerchio con `keepAspectRatio` sotto resize manuale dopo una taglia derivata.
- Le forme del catalogo nuovo (`notationCatalog`, commit `0a691b5fd`) non erano su origin.

---

## 13. Verifica sul working tree, a bridge tornato `[letto]` `[misurato]`

HEAD `6cf99afa3`, working tree pulito salvo i due untracked deliberati. I punti sospesi in §2 sono
chiusi cosi'.

**Il layer marker non entra nella misura.** `4b8833928` aggiunge a `IRNodeContent` un secondo
`<svg class="ir-marker-svg">` e a `irStyle.ts` la regola
`.ir-node-content > .ir-marker-svg { position: absolute; inset: 0; ... }`. Un elemento fuori flusso
non contribuisce alla taglia intrinseca, quindi il primitivo di §5.3 e' immune. Lo stesso vale per
`.ir-diamond-svg`, gia' assoluto.

**Il chrome non e' piu' costante, e va bene cosi'.** Lo stesso commit introduce
`border-style: double`, che sulle forme dipinte in CSS diventa un bordo inline piu' spesso (da 3px
per lato). Leggere il chrome da `getComputedStyle` al momento della misura, invece di scriverlo come
costante, assorbe il caso senza righe dedicate.

**`IRNodeContent` ha un solo consumatore**: `ObjectNode.tsx:416` (ricerca su tutto `frontend/src`,
gli altri riscontri sono commenti). `IRRow` non lo rende. Quindi un hook che chiama `useReactFlow`
dentro `IRNodeContent` e' sempre dentro il provider, e la misura puo' vivere dove il contenuto e'
noto.

**Il gate di build in container va fatto da `git archive`, non da un tar del working tree.** Il
repo ha `frontend/src/components/settings/` in minuscolo nell'albero git, mentre il filesystem di
macOS lo presenta fuso in `Settings/`: un tar del working tree perde il path minuscolo e il build
fallisce su Linux con `Could not resolve "../components/settings/UnifiedSettingsModal"`, e il
typecheck sale da 14 a 17 con tre `Cannot find module` che sembrano regressioni e non lo sono.
Misurato in questa sessione, entrambe le volte, prima e dopo la modifica. E' la stessa famiglia di
errori annotata come «19 di casing» su macOS, vista dall'altro lato.

**Nome del report**: nessuna collisione. In `docs/discovery/` esistono
`discovery_2026-08-15_border_marker_axes.md` e `discovery_2026-08-15_p5_verifica_preset_notazioni.md`.
