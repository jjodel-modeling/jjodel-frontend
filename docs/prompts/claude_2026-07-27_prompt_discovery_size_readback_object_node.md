# Discovery (read-only): read-back della size per gli object node (persistenza resize al reload)

> **Fase 1 di un two-phase. Read-only: nessun edit al codice di feature.** L'unico file che puoi
> scrivere e' il discovery report. Al termine, HARD STOP.
> **Nome del documento prompt**: 2026-07-27 16:45

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente
(filone resize/shape 23-27/07, flag `resizable` landato, e la discovery di oggi
`docs/discovery/discovery_2026-07-27_size_propagation.md`).

Branch: `alfonso-frontend-jjtl`.

## Contesto e obiettivo (NON implementare ora)

La discovery `discovery_2026-07-27_size_propagation.md` ha stabilito (nota critica Q1) che
`objectVertexToRFNode` (`utils/jjomTransformers.ts:243-339`) legge **solo x/y** e non emette mai
`width/height/style`. Conseguenza: il resize di un object node (manuale, e in futuro la size
propagata) si scrive in D-layer (`DVertex.w/h` via `syncSizeToJjom`) ma **non viene mai riletto**,
quindi si perde al reload/rebuild (gap gia' documentato in
`discovery_2026-07-23_classic_node_resize_sizing.md:162-166`).

Alfonso ha ratificato la sequenza: **prima la persistenza (questo read-back), poi la propagazione**.
Obiettivo finale della Fase 2 (NON implementare ora): far si' che un object node ridimensionato
(w/h persistiti sul DVertex) **rilegga** la size e la mantenga al reload, **senza rompere il
content-hug** dei box mai ridimensionati.

Questa e' **solo la discovery**: mappare come emettere la size senza rompere il content-hug,
riconciliare `style.width/height` vs `width/height` top-level, e valutare il risveglio del gate
`useJjomSync`. **Non scrivere codice di feature.**

## COSA mappare (rispondi a OGNI punto con `file:riga` e citazioni verbatim)

### Q1 - Discriminante content-hug vs fixed (incognita principale)
Sul `DVertex`, i campi `w`/`h` esistono **sempre** o solo dopo un resize esplicito? Un object node
mai ridimensionato ha `raw.w`/`raw.h` come `number` o `undefined`/assenti? Serve per emettere
`width/height` **solo** quando c'e' un resize persistito, preservando il content-hug per i box a
compartimenti mai toccati. Riporta come `packageVertexToRFNode` (`jjomTransformers.ts:221-231`)
gestisce l'assenza (usa default 400/300): per gli object node il "default assente" deve invece
significare **non emettere** (content-hug), non un fallback numerico. Cita `file:riga` della lettura
`raw.w/raw.h` e la forma esatta del campo sul DVertex (D-layer definition).

### Q2 - `style.width/height` vs `width/height` top-level (riconciliazione)
Il NodeResizer scrive `node.width`/`node.height` **top-level** sul nodo RF (report size_propagation
Q1); `packageVertexToRFNode` emette `style.width/height`; il gate `sizeChanged` di
`useJjomSync.ts:1364-1376` confronta `rfNode.style.width/height`. Se `objectVertexToRFNode` emette
`style.width/height` ma il resizer scrive top-level, esistono **due** sorgenti di verita' per la
size. Mappa come React Flow risolve la size di un nodo quando sono presenti sia `style.width/height`
sia `width/height` top-level, e quale delle due leggono il content-hug (`nodeSizing.ts`,
`adaptWidth/adaptHeight`) e il NodeResizer. Concludi quale forma dovrebbe emettere il transformer
per gli object node per essere coerente con cio' che il resizer scrive e con cio' che `useJjomSync`
osserva. Riporta `file:riga`.

### Q3 - Risveglio del gate `useJjomSync` (rischio reconcile/loop)
Con `objectVertexToRFNode` che emette la size, il gate `sizeChanged` (`useJjomSync.ts:1364-1376`),
oggi dormiente per gli object node, si attiva. Mappa il flusso: quando il D-layer `w/h` cambia, il
patch surgico ripatcha la size del nodo; segui l'ordine degli eventi durante un resize manuale
(resizer scrive top-level width/height + `syncSizeToJjom` scrive D-layer -> `useJjomSync` rilegge il
D-layer e ripatcha -> quale campo, `style` o top-level?). C'e' rischio di conflitto tra il valore
scritto dal resizer e quello ripatchato dal sync, o di loop di rimisura? `useJjomSync.ts` e'
**critical zone: sola lettura in questa discovery.** Riporta `file:riga` del gate e del patch, e il
verdetto sul rischio.

### Q4 - Preservazione del content-hug
Verifica che emettere la size solo-quando-persistita non rompa: (a) i box a compartimenti mai
ridimensionati (devono restare content-hug); (b) gli altri object node auto-misurati; (c) i package
(che gia' leggono raw.w/raw.h con default 400/300). Mappa come `nodeSizing.ts`
(`NODE_SIZING_DEFAULTS.objectNode = {adaptWidth, adaptHeight}`, `isNodeResizable`) interagisce con
una `width/height` esplicita sul nodo: la size esplicita disattiva l'adapt, o convivono? Riporta
`file:riga`.

### Q5 - Gate `resizable` nel read-back
La size va riletta per **qualunque** object node con `w/h` persistiti, o **solo** per le view
`resizable`? Il transformer `objectVertexToRFNode` conosce la view risolta (e quindi il flag
`resizable`), o la risoluzione IR avviene dopo (in `ObjectNode` via `useIRView`)? Se il transformer
non ha la view risolta, indica dove il gate `resizable` potrebbe essere applicato (transformer con
lookup, o render-time in ObjectNode) e il costo relativo. Riporta `file:riga` di dove
`objectVertexToRFNode` viene chiamato e cosa ha in scope.

### Q6 - Persistenza e reload end-to-end
Conferma il flusso completo: resize -> `syncSizeToJjom` scrive `DVertex.w/h` in D-layer ->
`useLayoutAutosave` (full project save) serializza -> reload -> `objectVertexToRFNode` (dopo il fix)
rilegge -> render con la size. Verifica che `w/h` siano effettivamente nel payload persistito
(serializzazione del DVertex) e rileggibili al reload. Riporta `file:riga` della serializzazione e
del punto di rilettura.

### Q7 - Verdetto critical-zone + perimetro Fase 2
Conferma quali file tocca la Fase 2: `utils/jjomTransformers.ts` (`objectVertexToRFNode`), e se il
comportamento del gate va adattato, `hooks/useJjomSync.ts` (critical zone). Dai il verdetto:
**LIR obbligatorio in Fase 2** (motiva). Elenca i file che la Fase 2 dovra' toccare (proposta) con,
per ciascuno, se e' critical zone.

## Discovery report (OBBLIGATORIO)

Al termine, salva il report in `docs/discovery/discovery_2026-07-27_size_readback_object_node.md`
(crea la cartella se manca). Naming: `discovery_<data>_<descrizione>.md`, data `YYYY-MM-DD`.
Contenuto minimo: obiettivo; file letti con path completi; findings Q1..Q7 con `file:riga` e
citazioni verbatim; **verdetto critical-zone** (LIR in Fase 2: si'/no e perche'); decisione proposta
su `style` vs top-level (Q2); strategia di preservazione content-hug (Q1/Q4); rischio reconcile
(Q3); file che la Fase 2 dovra' toccare; rischi; domande aperte per Alfonso. L'hard stop non e'
completo finche' il report non e' scritto.

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice di feature, nessun commit, nessun
`git add`. Restituisci in chat la sintesi Q1..Q7 con i `file:riga` chiave, il verdetto
critical-zone, la decisione proposta su `style` vs top-level, e la lista dei file che la Fase 2
dovra' toccare, cosi' scrivo il prompt di implementazione (con LIR).

## RIFERIMENTI

- Nota critica del gap: `docs/discovery/discovery_2026-07-27_size_propagation.md` (Q1, Q6),
  `docs/discovery/discovery_2026-07-23_classic_node_resize_sizing.md:162-166`.
- Transformer: `utils/jjomTransformers.ts` (`objectVertexToRFNode` ~:243-339, lettura x/y ~:324-326;
  `packageVertexToRFNode` ~:221-231; `computeOptimalHandles` legge raw.w/raw.h ~:385-390).
- Gate size sync: `hooks/useJjomSync.ts` (~:1364-1376, `sizeChanged` su `style.width/height`).
- Sizing/adapt: `nodes/nodeSizing.ts` (`NODE_SIZING_DEFAULTS`, `isNodeResizable`, `SHAPE_MIN_SIZE`).
- Write della size: `sync/canvasToJjom.ts` (`syncSizeToJjom` ~:72-78).
- Persistenza layout: `hooks/useLayoutAutosave.ts` (full project save).
- Resize istanza: `EditorV2.tsx` (~:3543-3552 chiamata `syncSizeToJjom`; ~:948-949, ~:1780-1781
  lettura `measured ?? width/height`).
