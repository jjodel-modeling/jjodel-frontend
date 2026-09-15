# GO Fase 2, undo in editor-v2: risposte al report `e0cc02959` e cambio di design

**Prevale sul prompt delle 18:45 dove diverge, e diverge nel design.** Riferimento:
`docs/discovery/discovery_2026-08-24_undo_editor_v2_layout.md`. Effort xhigh. Nessun file in
critical zone; `Navbar.tsx` e il reducer non si toccano.

## Cosa ha stabilito la Fase 1, e perché cambia il design

Il prompt poggiava su un'ipotesi falsa: che ⌘Z raggiungesse la storia di sessione di editor-v2.
Non la raggiunge e non può raggiungerla: `Navbar.tsx:1278-1279` ascolta in **cattura su
`window`** e per `'Z'` chiama `stopImmediatePropagation()` (`:962-964`) prima di ogni logica di
contesto. L'`onKeyDown` di `EditorV2.tsx:2511` non gira mai per ⌘Z, quindi «snapshot a inizio
gesto più write-back» avrebbe riparato un undo che la tastiera non usa. La storia di sessione è
raggiungibile solo dai due pulsanti della toolbar.

Quello che ⌘Z raggiunge è l'undo del D-layer, e quello è rotto per una causa diversa da quella
scritta nel prompt: `reducer.ts:1210` non c'entra (gli array di primo livello cambiano solo
quando un vertice nasce o muore); a decidere è `isRelevantChangeCheck` (`:1277`), che apre con
`if (!U.userHasInteracted) return false`, e `U.userHasInteracted` ha **un solo scrittore** in
tutto `frontend/src`, il drop sulla tela classica (`MetamodelTab.tsx:164`), che il percorso di
editor-v2 non attraversa. Il flag resta falso, ogni delta si fonde nel primo, e un ⌘Z riporta il
progetto all'inizio della sessione. Lettura statica; la prova 0 sotto la conferma a schermo.

La conseguenza è che il rimedio giusto non è il quarto sistema di undo ma il primo: far
funzionare in editor-v2 quello che ⌘Z già usa. È anche il più corto.

## Le risposte

**A. Né A1, né A2, né A3: A4.** Un solo sistema di undo in modalità JjOM, quello del D-layer.
Editor-v2 alza `U.userHasInteracted` come fa il classico, e i pulsanti della toolbar passano da
`UndoAction`/`RedoAction` invece che dalla storia di sessione. Snapshot a inizio gesto, write-back
e `clear()` **decadono**: il D-layer ha già la granularità giusta (transazioni, con i tick del
drag a 30 fps coalescenti entro `mergeTolerance = U.UpdatingTimer * 1.5 = 450 ms`), ripristina
`layoutByViewpoint` per intero (snapshot del dizionario a `reducer.ts:242`, R-LAY-16), e la tela
lo segue da sola per R-LAY-18 (posizioni e taglie) e per la sync di nodi e archi. Due sistemi di
undo che divergono sono il problema, non la soluzione. La storia di sessione resta com'è per la
modalità non JjOM.

**B. Decade** con A4: non c'è più una storia di sessione da azzerare. L'undo del D-layer
attraversa un cambio di layout in modo coerente per costruzione: può ripristinare un record di
una chiave non in forza (invisibile finché non si torna a quella chiave) e la tela mostra sempre
la chiave in forza. Dichiarato, non un difetto.

**C. Decade** con A4: nessun write-back. Se A4 fallisse alla prova 0 (cioè se alzare il flag non
bastasse) si torna al design del prompt, e allora il filtro su `idlookup` è autorizzato e §3 e
§4 sono un blocco unico, come dici.

**D. Sì, a registro**, con una serie nuova R-UNDO, tre righe candidate in coda. Editor-v2 ora
dipende da un flag del core e da un listener in cattura di `Navbar`: sono vincoli, non
dettagli.

**Test di `useHistory.clear()`**: decade; nessuna dipendenza nuova.

**Il ramo redo con `'Z'` maiuscola** (`:2517`): non si corregge. È codice morto per ⌘⇧Z in ogni
contesto (la cattura di `Navbar` precede il controllo di contesto), e con A4 i due rami
undo/redo dell'`onKeyDown` restano morti per costruzione. Entrano nel censimento R-DEAD, non in
questo diff.

## FASE 2

### Misure preliminari (read-only, addendum al report, senza secondo hard stop se confermano)

1. **Dove alzare il flag.** Il gesto simmetrico al drop classico è la prima scrittura di
   editor-v2 sul D-layer, ma le scritture sono sparse; la sede proposta è il callback di
   «tela pronta» della sync iniziale (`EditorV2.tsx:417-438`, dopo il ramo `autoLayout`), con
   `U.userHasInteracted = true` accanto al pattern di `MetamodelTab.tsx:164` (non toccare
   `isProjectModified`, che ha il suo ciclo). Misurare quali scritture sul D-layer avvengono
   **dopo** quel callback senza gesto dell'utente (materializzazione asincrona degli archi M1 di
   `useM1ReferenceEdges`, le esecuzioni dell'adapter al boot): se esistono, diventano passi di
   undo, e si dichiara (il classico convive con lo stesso effetto dopo il primo drop). Se la
   misura mostra che rendono inutilizzabile il primo ⌘Z, il flag si alza al primo
   `onNodeDragStart` o alla prima `dimensions` con `resizing: true`, e si dichiara che un
   attributo editato prima di ogni gesto sulla tela non è undoable.
2. **Persistenza dopo ⌘Z.** Il percorso `Navbar` non chiama `scheduleLayoutSave`. Misurare se
   un `UndoAction` produce un salvataggio per altra via; se no, editor-v2 osserva
   `state.action_title` (`reducer.ts:1143` scrive `undone N steps` / `redone N steps`) in un
   `useSelector` e chiama `scheduleLayoutSave()` quando cambia con quel prefisso. Se anche
   questo non è praticabile, si dichiara che l'undo persiste al salvataggio successivo.
3. **Stack vuoto.** Cosa fa `doUndoRedo` (`reducer.ts:1118`) con `undoable` vuoto: se lancia,
   i pulsanti devono guardare `statehistory[user]?.undoable.length` prima di dispatchare;
   `undoredocomponent.tsx:85,115` è il precedente da copiare.
4. **Il contesto di `Navbar`** (aggiunta dopo la prova 0 del 2026-08-24, 19:30). A schermo ⌘Z
   non fa **niente**, non riporta all'inizio della sessione: con il flag falso il delta non
   viene né fuso (manca un `pastDelta`, `reducer.ts:1211`) né spinto, quindi lo stack è sempre
   vuoto e `UndoAction` è un no-op. Questo spiega l'osservazione, ma non esclude una seconda
   causa concorrente: `detectCurrentContext()` (`utils/keyboardShortcuts.ts`) potrebbe non
   riconoscere editor-v2 come `METAMODEL_EDITOR`/`PROJECT_EDITOR`, e allora `UndoAction` non
   parte affatto (`Navbar.tsx:1190`). Misurare leggendo `detectCurrentContext` e, se serve, con
   un `console.log` temporaneo nel ramo di `:1190` da togliere prima del commit. Se il contesto
   non è riconosciuto, il rimedio sta in `detectCurrentContext`, non in `Navbar`: dichiararlo e
   fermarsi, perché è un secondo file fuori da editor-v2 e vuole un GO suo.

### Diff (un file: `EditorV2.tsx`; Regola 19 se ne emergono altri)

- Flag alzato secondo la misura 1.
- `handleUndo`/`handleRedo`: in `isJjomMode`, `UndoAction.new(1, DUser.getUser()?.id,
  false).commit()` (rispettivamente `RedoAction`), guardia sullo stack secondo la misura 3,
  poi `scheduleLayoutSave()`; `return` prima del ramo esistente, che resta intatto per la
  modalità non JjOM. `canUndo`/`canRedo` dei pulsanti in JjOM leggono la lunghezza dello stack
  del D-layer, non della storia di sessione.
- Il salvataggio dopo ⌘Z secondo la misura 2.
- Nessuna riga tolta: i due rami morti dell'`onKeyDown` restano, censiti in R-DEAD.

### Non-obiettivi (dichiarati)

`Navbar.tsx` e la sua cattura su `window`; il reducer (`isRelevantChangeCheck`, la regola di
`:1210`, `mergeTolerance`); la storia di sessione in modalità non JjOM; il ramo redo con `'Z'`;
il ⌘Z che vuole il fuoco nella tela; il renderer classico (che beneficia del flag solo se il
fronte è suo).

### Gate

`tsc` byte-identico (33), vitest 1349 passed con le stesse 9 suite rosse, build exit 0,
`check:docs`. Nessun test nuovo: il diff è cablaggio di store e toolbar, dichiarato non
testabile senza DOM.

### Verifica visiva (Alfonso, hard refresh)

0. **Eseguita il 2026-08-24 alle 19:30, prima del diff.** Esito: rinomina, ⌘Z: niente, icona
   spenta; spostamento, ⌘Z: niente; click sull'icona: il nodo resta dov'è e si seleziona. Non
   «inizio della sessione» ma «stack sempre vuoto» (vedi misura 4): la causa del report regge,
   l'effetto previsto no. A4 confermata, con la misura 4 aggiunta.
1. Dopo il diff: sposta un nodo, ⌘Z: torna dov'era, e basta. ⌘⇧Z: torna spostato.
2. Rinomina un attributo, sposta un nodo, ⌘Z: si disfa solo lo spostamento; secondo ⌘Z: si
   disfa la rinomina.
3. Ridimensiona un nodo, ⌘Z: taglia di prima; reload: persiste (misura 2).
4. Multi-selezione: sposta tre nodi, ⌘Z: tornano tutti e tre in un colpo (coalescenza a 450 ms).
5. Sotto `A` sposta un nodo, passa a `B`, ⌘Z: `B` non cambia a schermo; torna ad `A`: il nodo è
   tornato dov'era (il dizionario è stato ripristinato per intero).
6. I due pulsanti della toolbar fanno esattamente quello che fa ⌘Z, abilitazione compresa.
7. Regressione: apri un progetto, non toccare nulla, ⌘Z: non succede niente di visibile.

### Righe candidate per il registro (serie nuova R-UNDO, da ratificare in chat)

- **R-UNDO-1**: in modalità JjOM editor-v2 ha un solo sistema di undo, quello del D-layer
  (`UndoAction`/`RedoAction`, `statehistory`); la storia di sessione (`useHistory.ts`) vale solo
  in modalità non JjOM. ⌘Z e ⌘⇧Z sono catturati da `Navbar.tsx` su `window` in cattura con
  `stopImmediatePropagation` e non raggiungono mai editor-v2: i rami undo/redo dell'`onKeyDown`
  del pannello sono morti (R-DEAD).
- **R-UNDO-2**: `U.userHasInteracted` è il gate dell'undo del D-layer (`isRelevantChangeCheck`,
  `reducer.ts:1277`); finché è falso ogni delta si fonde nel primo e un undo riporta all'inizio
  della sessione. Editor-v2 lo alza alla sede fissata dalla misura 1; il classico lo alza al
  primo drop (`MetamodelTab.tsx:164`). Vincolo del core, dichiarato.
- **R-UNDO-3**: l'undo attraversa un cambio di layout in modo coerente per costruzione: può
  ripristinare un record di una chiave non in forza, invisibile finché non si torna a quella
  chiave. Non è un difetto.

### Chiusura

Addendum al report con le tre misure; entry nel log dopo la verifica visiva; commit
`fix(editor-v2): route undo/redo to the D-layer in JjOM mode` con `git add` dei soli file
toccati.
