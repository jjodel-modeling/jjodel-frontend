# Discovery (read-only): propagazione della size a tutte le istanze di una view

> Fase 1 di un two-phase. **Read-only: nessun edit al codice di feature.** L'unico file
> che puoi scrivere e' il discovery report. Al termine, HARD STOP.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente
(in particolare il filone resize/shape del 23-27/07 e il flag `resizable` appena landato).

Branch di lavoro: `alfonso-frontend-jjtl`.

## Contesto e obiettivo finale (NON implementare ora)

Appena aggiunto: flag `resizable` sulle vertex view IR, con maniglie di resize su rect/rounded.
Ora Alfonso vuole, **accanto alla checkbox "Resizable"** nel `VertexAuthoringPanel`, un **pulsante**
che prende la dimensione dell'istanza sorgente (il nodo che ha ridimensionato con le maniglie) e la
**propaga uguale a TUTTE le istanze rese da quella view** nel viewpoint corrente.

Decisioni ratificate da Alfonso (orientano cosa mappare, non rimetterle in discussione):

- **Bersaglio**: tutte le istanze della view nel viewpoint corrente (non solo le selezionate).
  Sovrascrive anche istanze dimensionate a mano: e' il senso di "uguale per tutte".
- **Semantica**: **one-shot** "uniforma ora". Scrittura di **geometria per-istanza** (w/h sui
  DVertex), NON un campo nuovo sull'IR. Le istanze future non seguono. **Nessun cambio di schema IR.**
- **Sorgente**: la size dell'istanza attiva (il nodo selezionato/ridimensionato, quello di cui e'
  aperto il pannello IR). La size e' gia' persistita per-istanza dal resize manuale.

Questa e' **solo la discovery**: mappare dove vive la size per-istanza, come si enumerano le
istanze di una view, con quale primitiva si scrive in bulk, e se il write path e' critical zone.
**Non scrivere codice di feature.**

## COSA mappare (rispondi a OGNI punto con `file:riga` e citazioni verbatim)

### Q1 - Dove vive la size per-istanza e chi la scrive (incognita principale)
In editor-v2, la dimensione (w/h) di un singolo nodo dove viene persistita? Trova il campo esatto
(su `DVertex`? un oggetto `size`? campi `w`/`h`/`width`/`height`?) e chi lo scrive quando l'utente
ridimensiona con il `NodeResizer` (handler `onResize`/`onResizeEnd`/`onResizeStop`). Esiste un
`syncSizeToJjom` speculare a `syncPositionToJjom` (`sync/canvasToJjom.ts` ~:42-46, che scrive x/y
con `SetFieldAction.new(vertexId, 'x'/'y', value, undefined, false)` in `TRANSACTION`)? Cita
`file:riga` della scrittura della size, i nomi esatti dei campi, e la primitiva usata. Conferma se
la size e' **per-DVertex** (per-istanza dentro il viewpoint) o condivisa tra viewpoint.

### Q2 - Come si legge la size della sorgente (nodo attivo)
Come si identifica il nodo sorgente dal contesto e se ne legge la size corrente. La selezione RF e'
accessibile (`useNodes()`, `useStore`, `node.selected`, `node.width/height`)? Il
`VertexAuthoringPanel` conosce l'id del nodo attivo, o solo la view che sta editando? Da dove si
legge la size corrente della sorgente in modo affidabile (RF node vs DVertex vs eventuale
`getSize`)? Riporta `file:riga`.

### Q3 - Come si enumerano tutte le istanze di una view nel viewpoint corrente
Data una view (il suo `viewId` / la `VertexViewIR` che il pannello edita), come si ottengono TUTTI i
nodi/DVertex che quella view rende nel viewpoint attivo? Esiste un mapping view -> istanze, oppure si
filtrano gli RF nodes per la view risolta? Trova il punto dove un RF node (ramo IR) espone la view
risolta a cui appartiene (`data.irViewId`? il `compiled.viewId` da `irResolution`? un altro campo su
`ObjectNodeData`?). **Attenzione**: "istanze della view" = gli oggetti che risolvono a QUESTA view,
non tutti i nodi del canvas ne' tutti gli oggetti della metaclasse. Riporta `file:riga` del campo
discriminante e come si arriva dall'RF node al suo `DVertex.id`.

### Q4 - Primitiva di scrittura in bulk + valutazione critical zone
Per scrivere w/h su N DVertex in un colpo: si puo' riusare la stessa primitiva di
`syncPositionToJjom` (N `SetFieldAction.new(vertexId, <campo>, value, undefined, false)` dentro un
UNICO `TRANSACTION`), oppure la size deve passare da un reconcile di `canvasToJjom`/`useJjomSync`?
Quali effetti collaterali scatena un bulk write di size: re-render, ricalcolo layout, reconcile del
sync, `portDistribution`? **Il write path della size e' critical zone** (`useJjomSync.ts`,
`portDistribution.ts`, `canvasToJjom.ts`)? Se si', la Fase 2 richiedera' go-ahead + **Layer Impact
Report**: **dillo esplicitamente**. Conferma il pattern `TRANSACTION` (safe su `SetFieldAction` di
campo esistente; mai wrappare `.new()`).

### Q5 - Wiring: pulsante nel pannello -> azione sul canvas
Il `VertexAuthoringPanel` ha accesso a selezione canvas / RF nodes / store / viewpoint corrente, o
l'azione va dispatchata a `EditorV2` (che ha `useNodes()` + store) tramite **custom DOM event** (il
pattern del progetto per quando la catena di callback non basta)? Mappa un esempio esistente di
custom event pannello -> EditorV2 (cita nome evento e handler, se c'e'). Indica dove nel pannello va
il bottone (accanto alla checkbox "Resizable") e come otterrebbe `viewId` + riferimento alla
sorgente. Riporta `file:riga`.

### Q6 - Vincoli ed edge case
- Il bottone ha senso solo per view **resizable**? Va disabilitato quando `canResize` e' false
  (propagare una size a una content-hug non-resizable non ha effetto utile)? Riporta come il
  pannello conosce lo stato resizable corrente.
- Cosa succede a un'istanza **content-hug** se riceve w/h espliciti: diventa fixed-size? E' un
  problema o e' coerente col fatto che il bersaglio e' una view resizable?
- La size scritta sopravvive a reload come il resize manuale (gia' verificato per il flag)? Conferma
  che il campo persistito e' lo stesso.
- Edge case: nessuna istanza oltre la sorgente; sorgente ambigua (piu' nodi selezionati); istanze
  fuori dal viewport (montate o no in RF).

## Discovery report (OBBLIGATORIO)

Al termine, salva il report in `docs/discovery/discovery_2026-07-27_size_propagation.md`
(crea la cartella se manca). Naming: `discovery_<data>_<descrizione>.md`, data `YYYY-MM-DD`.
Contenuto minimo: obiettivo; file letti con path completi; findings Q1..Q6 con `file:riga` e
citazioni verbatim; **verdetto critical-zone** (il write della size e' o no critical zone → LIR
richiesto in Fase 2?); primitiva di scrittura proposta; wiring proposto (custom event vs accesso
diretto); rischi; domande aperte per Alfonso. L'hard stop non e' completo finche' il report non e'
scritto.

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice di feature, nessun commit, nessun
`git add`. Restituisci in chat la sintesi Q1..Q6 con i `file:riga` chiave, il verdetto critical-zone,
e la lista dei file che la Fase 2 dovra' toccare (proposta), cosi' scrivo il prompt di
implementazione (con LIR se serve).

## RIFERIMENTI

- Write path geometria: `sync/canvasToJjom.ts` (`syncPositionToJjom` ~:42-46, pattern
  `SetFieldAction.new(vertexId, ...)` in `TRANSACTION`); `sync/jjomTransformers.ts` (transform
  DVertex -> RF node, emissione di width/height/style se presente).
- Critical zone: `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts` (reconcile).
- Resize istanza: `nodes/ObjectNode.tsx` (`<NodeResizer>` ramo IR, handler onResize), `EditorV2.tsx`
  (`useNodes()`, registrazione nodi, eventuali custom event handler).
- Pannello: `viewpoint/authoring/VertexAuthoringPanel.tsx` (checkbox "Resizable" appena aggiunta,
  contesto disponibile al pannello).
- View risolta per istanza (ramo IR): `viewpoint/ir/irResolve.ts` (`IRViewResolution`,
  `compiled.viewId`), `nodes/ObjectNode.tsx` (come il nodo espone la sua view risolta).
- DVertex e primitive: `joiner` (`DVertex`, `GraphSize`, `SetFieldAction`, `TRANSACTION`).
- Feature appena landata: prompt `2026-07-27_prompt_fase2_resizable_flag.md` e report
  `docs/discovery/discovery_2026-07-27_resizable_flag.md` (KB / repo).
