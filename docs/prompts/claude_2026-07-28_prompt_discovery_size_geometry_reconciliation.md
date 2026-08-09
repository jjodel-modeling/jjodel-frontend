# Discovery (read-only): riconciliazione size ↔ geometria degli object node IR

> **Fase 1 di un two-phase. Read-only: nessun edit al codice di feature.** L'unico file che puoi
> scrivere è il discovery report (vedi sezione dedicata). Al termine, **HARD STOP**.
> **Nome del documento prompt**: 2026-07-28 15:04

Leggi `CLAUDE.md` prima di iniziare. Se un punto di questo prompt contraddice `CLAUDE.md`, segnala il
conflitto invece di eseguirlo. Leggi `docs/claude-code-log.md` per il contesto recente (filone
resize/shape 23–27/07).

Branch di lavoro: `alfonso-frontend-jjtl`.

Nota importante sui numeri di riga: la working tree è ahead of origin e non pushata; **tutti i
`file:riga` qui sotto vengono da prompt precedenti e possono essere shiftati.** Confermali leggendo i
file reali. Non fidarti dei numeri, fidati dei simboli.

## Stato del filone (contesto già acquisito, NON reimplementare)

Sono già landati (due commit tematici):
- **flag `resizable`** su `VertexViewIR` (`resizable?: boolean`): gate `canResize = resolvedResizable
  ?? hasGeometricShape`, marker CSS `ir-resizable`, neutralizer in `irStyle.ts`, checkbox nel
  `VertexAuthoringPanel`.
- **propagazione size** per-istanza (bottone "Propaga dimensione", `syncSizeBatchToJjom`, listener
  `PROPAGATE_VIEW_SIZE` in `EditorV2`).

Sono stati **solo progettati e discussi, MAI eseguiti** (nessun report in `docs/discovery/`, nessun
codice): la **size read-back** (far rileggere `DVertex.w/h` al transformer così la size sopravvive al
reload) e la **size default-lock** (campo `size?: {w,h}` su `VertexViewIR`, box fisso alla size di
default quando `resizable:false`). Questa discovery **non** assume che esistano; li cita solo come
modello ratificato da cui la Fase 2 attingerà.

Modello dei tre stati di `resizable` già ratificato da Alfonso (ti serve come cornice, non come cosa
da implementare):
- `undefined` → segue la forma (content-hug), comportamento storico.
- `true` → maniglie di resize, size per-istanza.
- `false` (bloccato) → niente maniglie, box fisso a una size di default della view.

## Le due anomalie osservate (obiettivo della discovery)

Alfonso ha osservato, su una view IR di uno **State** (shape `rounded`, la pill "S1"/"S2"):

**Anomalia A — collapse all'attivazione del resize.** Spuntando "Resizable" (`resizable:true`) su una
view mai ridimensionata, il box **collassa** a una pill minuscola invece di conservare la dimensione
di partenza. Deselezionando torna alla dimensione content-hug originale. Comportamento voluto:
abilitare il resize deve **conservare la size corrente (content-hug misurato) come dimensione
iniziale**, poi lasciar trascinare le maniglie; non collassare.

**Anomalia B — edge che non raggiungono il bordo.** Con "Resizable" **disabilitato** (stato
content-hug, la pill grande renderizzata correttamente), gli edge (transizioni) che entrano/escono
dallo State **non toccano il bordo**: c'è un gap tra la terminazione dell'edge e il bordo visibile
del box.

## RCA di partenza (ipotesi da confermare o smentire, NON da dare per vere)

Queste sono le ipotesi emerse in chat. La discovery deve **verificarle con `file:riga`**, non
assumerle. Se i fatti le smentiscono, riportalo: è il risultato più prezioso.

- **Anomalia A** nasce dal neutralizer CSS `.mm-node.ir-resizable { min-width:0; min-height:0;
  width:100%; height:100% }`: emesso quando `canResize`, azzera il floor 140×40 e mette il box a
  `width/height:100%`; ma il nodo React Flow non ha una width/height esplicita (il transformer
  `objectVertexToRFNode` non le emette e non c'è stato resize manuale), quindi il box riempie un
  genitore senza dimensione fissa e collassa al min-content.
- **Anomalia B** nasce dal disallineamento tra due sorgenti di size: `computeOptimalHandles` ancora
  l'edge sulla geometria letta da `raw.w/raw.h` (DVertex), mentre il box content-hug renderizza a una
  size **misurata** da RF. Le due divergono, quindi l'ancora cade a una posizione diversa dal bordo
  visibile. Pista alternativa da **escludere esplicitamente**: il rendering edge IR-driven (E0) o un
  refactor edge/anchor rimasto WIP non committato in `EditorV2.tsx`.

Le due anomalie sono probabilmente **due sintomi di un'unica causa strutturale**: l'object node IR non
ha un'unica sorgente di size autorevole usata sia dal render sia dalla geometria degli edge. Oggi
coesistono almeno: (1) size **misurata** content-hug, (2) `width/height` **top-level** sul nodo RF
(scritte da NodeResizer/propagazione, solo in-sessione), (3) `DVertex.raw.w/raw.h` (lette da
`computeOptimalHandles` per gli edge, **non** rilette dal transformer per il render), (4) il
neutralizer che forza `100%`. La Fase 2 dovrà riconciliarle. La discovery mappa il terreno.

## COSA mappare (rispondi a OGNI punto con `file:riga` e citazioni verbatim)

### Gruppo A — Anomalia collapse (attivazione resize)

**QA1 — Meccanismo del collapse.** In `nodes/ObjectNode.tsx` ramo IR, cita verbatim le righe di
`shapeForm`, `hasGeometricShape`, `resolvedResizable`, `canResize`, l'emissione del marker
`ir-resizable` (su quale elemento: `.mm-node`? `.ir-node-content`?) e il `<NodeResizer>`. In
`viewpoint/ir/irStyle.ts` cita verbatim la regola `.mm-node.ir-resizable` (o la variante `:has` se il
marker è su `.ir-node-content`) e la regola base di `.mm-node` con il **floor 140×40**. Conferma o
smentisci: con `resizable:true`, nessuna `width/height` esplicita sul nodo RF e nessun resize
precedente, a quale size collassa il box e perché (min-content? il floor sparisce davvero?).

**QA2 — Size misurata disponibile a render-time.** L'incognita per il "seed". A render, `ObjectNode`
ha accesso alla size **misurata** del proprio nodo (RF `useNodeId` + `useStore(node.measured)`, oppure
`data`, oppure props width/height)? Serve a valutare se il seed si può fare **render-side** (fallback
inline-style alla size misurata quando `canResize` e nessuna size esplicita) senza scrivere stato.
Cita `file:riga` di come `ObjectNode` accede (o non accede) a `measured`/`width`/`height`.

**QA3 — Chi conosce la size misurata imperativamente.** In alternativa al seed render-side, il seed si
può fare al momento del toggle (come la propagazione): quando la checkbox passa a `true`, qualcuno
legge la size del nodo sorgente e la fissa. Mappa il pattern **già usato** dalla propagazione in
`EditorV2.tsx`: lettura `measured?.width ?? width` (cita `file:riga`, ~:948-949 / ~:1780-1781), il
listener `PROPAGATE_VIEW_SIZE` (~:893-910 modello `handleSelectNode`), `resetNodeSize` (~:2258-2263).
Riporta come la propagazione scrive la size sul nodo RF (`setNodes` width/height top-level + reset di
`measured`) e se lo stesso wiring servirebbe al seed. Cita il seed/commit del pannello in
`viewpoint/authoring/VertexAuthoringPanel.tsx` (draft, `:48`, commit debounced `:65-77`, `patch`,
riga checkbox ~:258-265, `canResize` ~:260).

**QA4 — Un px esplicito vince sul neutralizer?** Se in Fase 2 seminassimo una size esplicita in px
(inline-style sul `.mm-node`, oppure `width/height` top-level sul nodo RF), quel valore **vince** sul
`width/height:100%` del neutralizer e sul floor 140×40? Ragiona sulla cascata CSS (specificità
inline-style vs regola `irStyle.ts`; ruolo di `min-width:0`) e sul modo in cui RF applica
`width/height` top-level vs `style.width/height`. Concludi: il neutralizer va **mantenuto**, cambiato
di condizione, o affiancato da un marker distinto (es. `ir-sized`) per lo stato "size esplicita"?
Cita `file:riga` di marker e regola.

### Gruppo B — Anomalia edge che non toccano il bordo (content-hug)

**QB1 — Sorgente di size di `computeOptimalHandles`.** In `utils/jjomTransformers.ts` cita verbatim
`computeOptimalHandles` (~:385-390) e **esattamente** quale size usa per la geometria dell'ancora:
`raw.w/raw.h`? un default di fallback quando assenti? Riporta la forma del campo su `DVertex`
(definizione D-layer di `w`/`h`) e, punto cruciale, **che valore hanno `raw.w/raw.h` per un object
node content-hug mai ridimensionato**: `number`? `undefined`/assenti? un default migrato? Questo dice
se la geometria edge usa una size diversa dal render.

**QB2 — Size renderizzata vs size di geometria.** Per una view State content-hug (`rounded`,
resizable off/undefined), cosa determina l'**altezza renderizzata reale** della pill: il floor
`.mm-node` (140×40)? il contenuto? padding/border? C'è un `box-shadow`/`outline`/`border` doppio o un
`margin` su `.mm-node` o `.ir-node-content` che estende il bordo **visibile** oltre il box di layout
che RF misura (nello screenshot la pill ha un aspetto a doppio bordo)? Riporta la catena DOM `.mm-node
→ .ir-node-content` con il CSS rilevante (`padding`, `border`, `box-shadow`, floor) e `file:riga`.
Obiettivo: quantificare di quanto e in che direzione l'ancora edge (da geometria) diverge dal bordo
visibile (da render).

**QB3 — Quali edge e da dove nascono i loro estremi.** Identifica cosa sono i due edge dello
screenshot (transizioni fra State?) e dove vengono calcolati i loro estremi source/target. Localizza
nel repo il componente edge reale: sono resi dal path edge **guidato dall'IR** (rendering edge
IR-driven introdotto di recente) o dal path edge classico? Cita il componente e il punto in cui
l'ancora/estremo viene posizionato. Poi **escludi o conferma la pista alternativa**: esegui `git
status` e `git stash list`; c'è un refactor edge/anchor in `EditorV2.tsx` rimasto **non committato**
che tocca il calcolo dell'ancora? Se sì, riportane gli hunk rilevanti (read-only, non toccarli).
Questo distingue "gap di read-back geometrico" da "regressione del rendering edge / refactor WIP".

**QB4 — L'anomalia B è specifica del content-hug?** Ragiona dal codice: se ridimensioni manualmente
lo State (resizable on) o dopo la propagazione, gli edge tornano ad agganciarsi al bordo? Cioè: il
resize manuale scrive `DVertex.w/h` via `syncSizeToJjom` (`sync/canvasToJjom.ts` ~:72-78), quindi
`raw.w/raw.h` si allineano al render e il gap si chiude; mentre su un content-hug mai ridimensionato
`raw.w/raw.h` sono assenti/stantii e il gap appare. Conferma o smentisci con `file:riga`. Questo
determina se il fix giusto è "far leggere alla geometria la size misurata/renderizzata" oppure "dare
all'object node IR un'unica size esplicita condivisa da render e geometria".

### Gruppo C — Convergenza, critical-zone, preservazione content-hug

**QC1 — Una riconciliazione unica per entrambi i sintomi?** Valuta, con `file:riga`, blast radius e
tradeoff, le opzioni per dare all'object node IR **una sola** sorgente di size usata sia dal render
sia dalla geometria edge:
- **(R) read-back**: `objectVertexToRFNode` emette `width/height` (o `style.width/height`) da
  `raw.w/raw.h`, ma **solo** quando persistite (preservando il content-hug per i box mai toccati).
  Nota: non copre da solo il content-hug mai ridimensionato dell'anomalia B, a meno di un fallback.
- **(M) geometria sulla size misurata**: `computeOptimalHandles` usa la size **misurata**
  (`node.measured`/`width`) invece di `raw.w/raw.h` per gli object node, allineando geometria e render
  anche in content-hug.
- **(S) size in `view.ir`**: campo `size?: {w,h}` (modello default-lock) come size autorevole quando
  definita, che guida il render (inline-style) e, se serve, la geometria.
Per ciascuna: cosa risolve (A, B, o entrambi), cosa NON risolve, e il costo.

**QC2 — Verdetto critical-zone + LIR.** Per ciascuna opzione di QC1, dì se la Fase 2 toccherebbe la
critical zone e richiederebbe un **Layer Impact Report**. In particolare: il gate `sizeChanged` di
`hooks/useJjomSync.ts` (~:1364-1376, confronta `style.width/height`) oggi è dormiente per gli object
node; l'opzione (R) lo risveglierebbe? `portDistribution.ts` è coinvolto? `sync/canvasToJjom.ts`?
`useJjomSync.ts` e `portDistribution.ts` sono **critical zone: sola lettura in questa discovery.**
Riporta il gate e il verdetto.

**QC3 — Preservazione del content-hug (vincolo trasversale).** Per ogni opzione, verifica che NON si
rompa il content-hug dei box a compartimenti (class diagram) mai ridimensionati né degli altri object
node auto-misurati. Mappa come `nodes/nodeSizing.ts` (`NODE_SIZING_DEFAULTS.objectNode =
{adaptWidth:true, adaptHeight:true}`, `isNodeResizable`, `SHAPE_MIN_SIZE=24`, `defaultResizableForForm`)
interagisce con una `width/height` esplicita: la size esplicita disattiva l'adapt, o convivono?
`file:riga`.

## Domande aperte per Alfonso (da porre nel report, NON decidere qui)

Elenca queste come questioni di design che la chat deciderà a valle del report; per ognuna, mappa solo
i **fatti** che servono a scegliere:
1. Il seed dell'anomalia A: **render-side** (inline-style alla size misurata, zero stato) o
   **imperativo al toggle** (setNodes come la propagazione)? E la size iniziale del resize è
   **per-istanza** o diventa il **default di view** (`view.ir.size`)?
2. La size autorevole per la geometria edge: **misurata** (opzione M) o **persistita `raw.w/raw.h`**
   (opzione R)? Cioè: la Fase 2 fa una fetta sola che risolve entrambi, o due fette (M per gli edge,
   seed per il collapse)?
3. Se serve un marker distinto `ir-sized` o basta rileggere la condizione di `ir-resizable`.

## Discovery report (OBBLIGATORIO)

Al termine, salva il report in
**`docs/discovery/discovery_2026-07-28_size_geometry_reconciliation.md`** (crea la cartella
`docs/discovery/` se manca). Naming: `discovery_<data>_<descrizione>.md` con data `YYYY-MM-DD`.
Contenuto minimo: obiettivo della discovery; file letti/analizzati con path completi; findings per
QA1..QA4, QB1..QB4, QC1..QC3 con `file:riga` e citazioni verbatim; il **verdetto RCA** per ciascuna
anomalia (ipotesi confermata / smentita / condizionata, con la causa reale); il **verdetto
critical-zone** (LIR in Fase 2: sì/no e perché, per opzione); la raccomandazione fetta-unica vs
fette-separate; le domande aperte per Alfonso; rischi; e la lista dei file che la Fase 2 dovrà toccare
(proposta, con marcatura critical-zone). L'hard stop non è completo finché il report non è scritto:
l'analisi in chat parte dal report salvato, non dalla memoria della sessione.

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice di feature, nessun commit, nessun
`git add`, nessun tocco al WIP non committato. Restituisci in chat: la sintesi QA/QB/QC con i
`file:riga` chiave, il verdetto RCA delle due anomalie, il verdetto critical-zone, e la lista file
che la Fase 2 dovrà toccare, così scrivo il prompt di implementazione.

## RIFERIMENTI (hint, numeri da confermare)

- Gate/render resize: `nodes/ObjectNode.tsx` (ramo IR: `shapeForm`, `hasGeometricShape`,
  `resolvedResizable`, `canResize`, marker `ir-resizable`, `<NodeResizer>` ~:373-389),
  `nodes/nodeSizing.ts` (`isNodeResizable`, `NODE_SIZING_DEFAULTS.objectNode`, `SHAPE_MIN_SIZE=24`,
  `defaultResizableForForm`), `viewpoint/ir/irStyle.ts` (`.mm-node.ir-resizable`, floor `.mm-node`).
- Schema/read IR: `viewpoint/ir/irTypes.ts` (`VertexViewIR` ~:100-111 con `resizable?`, `ShapeForm`
  ~:38, `CompiledView.ir` ~:281), `viewpoint/ir/irResolve.ts` (`IRViewResolution`).
- Transformer e geometria edge: `utils/jjomTransformers.ts` (`objectVertexToRFNode` ~:243-339, legge
  solo x/y ~:324-326, non emette width/height/style; `packageVertexToRFNode` ~:221-231 default
  400/300; `computeOptimalHandles` legge `raw.w/raw.h` ~:385-390).
- Sync/critical zone (sola lettura): `hooks/useJjomSync.ts` (gate `sizeChanged` ~:1364-1376 su
  `style.width/height`), `sync/canvasToJjom.ts` (`syncSizeToJjom` ~:72-78, `syncSizeBatchToJjom`,
  `syncPositionBatchToJjom` ~:54-63, `markCanvasUpdated`), `portDistribution.ts`.
- Pannello e wiring propagazione (modello per il seed imperativo): `viewpoint/authoring/VertexAuthoringPanel.tsx`
  (checkbox Resizable ~:258-265, `canResize` ~:260, seed `:48`, commit debounced `:65-77`),
  `EditorV2.tsx` (`handleSelectNode` ~:893-910, listener `PROPAGATE_VIEW_SIZE`, `resetNodeSize`
  ~:2258-2263, lettura `measured ?? width/height` ~:948-949 / ~:1780-1781, call `syncSizeToJjom`
  ~:3543-3552), `events/registry.ts` (`PROPAGATE_VIEW_SIZE`).
- Edge IR-driven (pista alternativa anomalia B): il rendering edge guidato dall'IR introdotto di
  recente; localizza nel repo il componente edge e il punto di calcolo degli estremi.
- Modello ratificato per la Fase 2 (NON eseguito, cornice): read-back del transformer; `size?: {w,h}`
  su `VertexViewIR` (default-lock).
