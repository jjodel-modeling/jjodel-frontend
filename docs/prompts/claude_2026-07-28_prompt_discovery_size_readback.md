# Discovery (read-only): read-back della size degli object node IR (persistenza resize al reload)

> **Fase 1 di un two-phase. Read-only: nessun edit al codice di feature.** L'unico file che puoi
> scrivere è il discovery report. Al termine, **HARD STOP**.
> **Nome del documento prompt**: 2026-07-28 20:56

Leggi `CLAUDE.md`. Se un punto contraddice `CLAUDE.md`, segnala il conflitto. Leggi
`docs/claude-code-log.md` per il contesto recente. Branch: `alfonso-frontend-jjtl`.

## Contesto (già acquisito, NON reimplementare)

Filone resize object node IR. **Landati/in-corso in questa sessione**: fix edge-gap (Commit 1: floor
su `.ir-node-content` così il bordo visibile riempie il box misurato) e fix collapse (Commit 2: marker
`ir-sized` emesso da `ObjectNode` quando il nodo ha una **size esplicita top-level**, letta con
`useStore(s => s.nodeLookup.get(id)?.width != null && ...height != null)`; il neutralizer
`.mm-node` passa da `.ir-resizable` a `.ir-sized`).

**Gap osservato da Alfonso**: ridimensiona un box, `resizable` on, salva il modello, reload → la size
NON torna. Causa nota: `objectVertexToRFNode` (`utils/jjomTransformers.ts`) legge **solo x/y** e non
emette mai width/height, quindi la size scritta su `DVertex.w/h` (via `syncSizeToJjom`) è persistita
nel modello ma **mai riletta** al load. Obiettivo Fase 2 (NON implementare ora): far rileggere la size
al reload **senza rompere il content-hug** dei box mai ridimensionati.

## Insight da verificare (cambia il peso della fetta)

La discovery del 27/07 assumeva di emettere `style.width/height` dal transformer (come
`packageVertexToRFNode`), cosa che risveglierebbe il gate `sizeChanged` di `useJjomSync`
(`~:1356-1377`, confronta `rfNode.style.width/height`) → critical zone + LIR.

Ma il marker `ir-sized` appena introdotto legge la size **top-level** (`nodeLookup.get(id).width/height`),
non `style`. Quindi l'ipotesi migliore ora è: **emettere la size come `width`/`height` TOP-LEVEL sul
nodo RF** (come fanno NodeResizer e la propagazione), non come `style`. Se regge, questo:
- (a) fa **comporre** il read-back con `ir-sized`: al load il nodo ha width/height top-level →
  `ir-sized` si attiva → il neutralizer riempie → il box rende alla size salvata;
- (b) **NON risveglia** il gate `sizeChanged` (che guarda `style.width/height`, che gli object node
  continuano a non emettere) → **niente critical zone, niente LIR**.

**Confermare o smentire (a) e (b) è l'obiettivo n.1 di questa discovery.** Se (b) è vera, la fetta è
leggera; se falsa, torna critical zone + LIR.

## COSA mappare (rispondi a OGNI punto con `file:riga` e citazioni verbatim)

### Q1 — Discriminante content-hug vs persistito
Sul `DVertex`, `w`/`h` esistono **sempre** o solo dopo un resize? Un object node mai ridimensionato ha
`raw.w/raw.h` `number` o `undefined`/assenti? Cita `file:riga` della definizione D-layer e di dove
`objectVertexToRFNode` legge `raw.x/raw.y` (~:324-326 dal report precedente), così la Fase 2 può
leggere `raw.w/raw.h` dallo stesso punto ed **emettere width/height SOLO quando presenti** (assenti →
niente emissione → content-hug preservato). Conferma il comportamento di `packageVertexToRFNode`
(default 400/300) per contrasto: per gli object node "assente" deve significare **non emettere**, non
un fallback numerico.

### Q2 — Emissione TOP-LEVEL e composizione con `ir-sized`
Traccia: se `objectVertexToRFNode` emette `width`/`height` **top-level** sul nodo RF (non `style`),
al load `nodeLookup.get(id).width/height` diventa non-null → `hasExplicitSize` in `ObjectNode`
(`useStore`) diventa true → `ir-sized` → neutralizer `.mm-node.ir-sized` riempie + azzera il floor
Commit-1. Conferma che questa catena regge (React Flow rispetta `width`/`height` top-level di un nodo
come dimensione, e le espone in `nodeLookup`). Riporta `file:riga` di dove `objectVertexToRFNode`
costruisce il nodo RF e come RF popola `nodeLookup.width/height` da un nodo con width/height esplicite.

### Q3 — Risveglio del gate `useJjomSync` (il verdetto critico)
`useJjomSync.ts` è **critical zone: sola lettura.** Il gate `sizeChanged` (`~:1356-1377`) confronta
`rfNode.style.width/height`. Se il transformer emette **top-level** width/height (non `style`), il
gate resta dormiente (gli object node non emettono `style`)? Oppure c'è un punto che deriva `style` da
top-level, o che confronta la size top-level, o un `updateNodeInternals`/reconcile che rimisura e
ripatcha? Traccia l'ordine degli eventi al load e a un successivo resize manuale. **Verdetto**: emettere
top-level width/height risveglia qualche reconcile/loop? Sì/no/condizionato, con `file:riga`.

### Q4 — Preservazione del content-hug + interazione con Commit 1/2
Verifica che emettere la size solo-se-persistita non rompa: (a) i box a compartimenti mai
ridimensionati (no `raw.w/h` → no emit → content-hug, con il floor Commit-1 su `.ir-node-content`);
(b) gli altri object node auto-misurati. Verifica l'interazione con Commit 1
(`.ir-node-content { min:140/40 }`) e Commit 2 (`.mm-node.ir-sized .ir-node-content { min:0 }`): un
nodo ricaricato con size < 40px deve poter rendere sotto il floor (ir-sized azzera il min). Riporta
come `nodeSizing.ts` (`adaptWidth/adaptHeight`, `isNodeResizable`) convive con una width/height
esplicita sul nodo.

### Q5 — Persistenza end-to-end
Conferma il flusso: resize → `syncSizeToJjom` scrive `DVertex.w/h` → `useLayoutAutosave` (o il full
project save) serializza → reload → `objectVertexToRFNode` (dopo il fix) rilegge `raw.w/h` → render.
Verifica che `w/h` siano davvero nel payload persistito e rileggibili al load. `file:riga` della
serializzazione e del punto di rilettura.

### Q6 — Gate `resizable` nel read-back
La size va riletta per **qualunque** object node con `w/h` persistiti, o **solo** per le view
`resizable`? (Un box reso `resizable:false`/undefined ma con un vecchio `w/h` sul DVertex: va onorato
o ignorato?) Il transformer conosce la view risolta / il flag `resizable`, o la risoluzione IR avviene
dopo in `ObjectNode`? Se il transformer non ce l'ha, indica dove applicare l'eventuale gate. Proponi
ma non decidere.

### Q7 — Verdetto perimetro + critical-zone
Elenca i file che la Fase 2 dovrà toccare (proposta), con marcatura critical-zone. Se Q3 conferma che
l'emissione top-level NON risveglia il gate, il perimetro atteso è il solo `utils/jjomTransformers.ts`
(`objectVertexToRFNode`) → **niente LIR**. Se invece qualcosa si risveglia, `hooks/useJjomSync.ts`
entra in gioco → **LIR obbligatorio**. Dai il verdetto motivato.

## Discovery report (OBBLIGATORIO)

Salva in `docs/discovery/discovery_2026-07-28_size_readback.md` (crea la cartella se manca). Naming
`discovery_<data>_<descrizione>.md`. Contenuto minimo: obiettivo; file letti con path completi;
findings Q1..Q7 con `file:riga` e citazioni; **verdetto (a)/(b)** dell'insight (top-level compone con
ir-sized? evita il gate?); **verdetto critical-zone/LIR**; strategia content-hug; file che la Fase 2
dovrà toccare; rischi; domande aperte. L'hard stop non è completo finché il report non è scritto.

## HARD STOP

Dopo il report, **FERMATI**. Nessun edit al codice, nessun commit, nessun `git add`. Restituisci in
chat la sintesi Q1..Q7, il verdetto sull'insight top-level, il verdetto critical-zone, e la lista file
per la Fase 2, così scrivo il prompt di implementazione (con LIR solo se serve).

## RIFERIMENTI (hint, numeri da confermare)

- Transformer: `utils/jjomTransformers.ts` (`objectVertexToRFNode` legge x/y ~:324-326, non emette
  width/height/style; `packageVertexToRFNode` default 400/300 ~:221-231; `computeOptimalHandles`).
- Marker/size esplicita già landati: `nodes/ObjectNode.tsx` (`useStore` su `nodeLookup.get(id).width/height`,
  emissione `ir-sized`), `viewpoint/ir/irStyle.ts` (`.mm-node.ir-sized` neutralizer,
  `.mm-node.ir-sized .ir-node-content { min:0 }`, floor `.ir-node-content` di Commit 1).
- Gate (critical zone, sola lettura): `hooks/useJjomSync.ts` (`sizeChanged` ~:1356-1377 su
  `style.width/height`). Write size: `sync/canvasToJjom.ts` (`syncSizeToJjom` ~:72-78).
- Resize/propagazione (setter top-level esistenti): `EditorV2.tsx` (`n.width/height` ~:993-995,
  `resetNodeSize` ~:2316). Persistenza: `hooks/useLayoutAutosave.ts`.
- Sizing: `nodes/nodeSizing.ts` (`NODE_SIZING_DEFAULTS.objectNode`, `isNodeResizable`, `SHAPE_MIN_SIZE`).
