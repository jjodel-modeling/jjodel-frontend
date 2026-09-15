# Discovery (read-only) — Stato UI dei pannelli di authoring IR: cosa sopravvive a un cambio di tab

**Documento prompt**: 2026-08-05 13:19
**Task**: 1.2 del backlog. Prerequisito della partizione dei tab (1.5).

> Fase 1 di un two-phase. **Read-only: nessun edit al codice.** L'unico file che puoi scrivere è il discovery report. Al termine, HARD STOP: la decisione la prende Alfonso in chat.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto

La barra dei tab per le view IR-authored è ratificata (`Applies to · Structure · Appearance · Text · Source`, ratifiche del 2026-08-04). Oggi ogni pannello di authoring è **un componente solo** con un draft solo, `dirtyRef`, validazione via `validateIR` e commit debounced a 300 ms. Partizionarlo in tab significa che una parte del form non è montata mentre l'autore lavora sull'altra.

Il rischio non è il draft, che vive nel pannello e non si tocca. Il rischio è lo **stato UI locale dei sotto-editor**, quello che esiste prima che una modifica diventi draft. Il caso noto è `sourceExpr`/`targetExpr` in `EdgeAuthoringPanel`: i due capi si accumulano in stato locale e vengono scritti nell'IR **insieme** (`applyEndpoints`, ratifica R-1 di E-obj). Se il tab si smonta con un capo solo impostato, quello stato sparisce senza che nulla lo dichiari.

**Questa discovery misura il costo, non lo risolve.** È l'unico punto in cui la partizione può richiedere di riscrivere codice già verificato, cioè i rami E-ref ed E-obj, e serve a decidere fra due strade che hanno costi molto diversi.

## OBIETTIVO

Rispondere alle OQ con `file:riga` verificati a HEAD, in modo che dopo la lettura si possa scrivere il prompt di implementazione senza altre esplorazioni.

### Area 1 — Censimento dello stato locale

**OQ-1**. Per **ciascuno** di questi componenti, elencare ogni `useState`/`useRef`/`useMemo` che tiene stato **non ancora committato nel draft**: `VertexAuthoringPanel`, `RowAuthoringPanel`, `EdgeAuthoringPanel`, `MatchingSection`, `FieldCompartmentListEditor`, `LabelListEditor`, `LabelEntryEditor`, `BadgeListEditor`, `TextSourceEditor`, `FieldSegmentEditor`, `TextStyleField`, `TextStyleEditor`, `ConditionalEditor`, `PredicateBuilder`, `PathBuilder`, `ListEditor`, `EnableIRPanel`.

Per ogni voce: cosa contiene, quando viene seminata, quando viene resettata, e **cosa si perde se il componente si smonta in quel momento**. Distinguere tre categorie:

- **a) stato che diventa draft immediatamente** (il classico onChange → patch): smontare non perde nulla;
- **b) stato di presentazione** (accordion aperto, popover, indice selezionato, scroll): smontare perde comodità, non dati;
- **c) stato che è dato non ancora scritto**: smontare perde lavoro dell'autore. È la categoria che decide il costo.

Il caso `sourceExpr`/`targetExpr` va in (c). **Cercare gli altri**: non assumere che sia l'unico.

**OQ-2**. La macchina di draft e commit di ciascun pannello: dove nasce il seed, come è gatato il reset al cambio di view, dov'è `dirtyRef`, dove il debounce, cosa succede se il pannello si smonta con `dirty` vero **prima** che il debounce scatti. Il commit pendente si perde o c'è un flush su unmount? Se non c'è flush, dirlo esplicitamente: è un bug latente che la partizione moltiplicherebbe.

### Area 2 — Il bivio: sollevare lo stato oppure non smontare

**OQ-3**. La strada A è sollevare nel pannello gli stati di categoria (c) e passarli ai sotto-editor. Costo reale da misurare: quali file, quante props nuove, e soprattutto **quante righe del ramo E-ref ed E-obj vanno riscritte** (`9bd8cad9a` e `d1dc55649`, entrambi verificati a video). La regola di progetto vieta i rinomini di identificatori esistenti: dire se la strada A può stare dentro quel vincolo.

**OQ-4**. La strada B è **non smontare**: la barra rende tutti i pannelli e nasconde gli inattivi via CSS, oppure li tiene montati fuori dal flusso. Costo da misurare: quanti nodi DOM in più nel caso peggiore (una vertex view con molti compartimenti, label e badge), se ci sono effetti collaterali noti su focus, `scrollIntoView`, popover in portal (`TextStyleField`), e se qualche `useEffect` dei sotto-editor farebbe lavoro inutile stando montato e invisibile. Con la strada B il costo di sollevamento è **zero** e nessuna riga di E-ref o E-obj viene toccata: se regge, è la strada da preferire, e il report deve dire con evidenza se regge.

**OQ-5**. Esiste una strada C in casa? Verificare come si comportano i **tab già esistenti** di `ViewData.tsx`: montano e smontano il contenuto, oppure lo tengono montato? Se il pattern di casa è già uno dei due, riusarlo vale più di sceglierne uno nuovo. `file:riga` del punto in cui si decide.

### Area 3 — Validazione e segnalazione cross-tab

**OQ-6**. `validateIR` è chiamata in un `useEffect` del pannello: con la partizione resta lì e i tab la riflettono. Verificare dove oggi vengono renderizzati `ErrorText` e `HelpText` di errore in ciascun pannello, e se esiste già in casa un pattern di **badge di errore su un header di tab** o di striscia di errore a livello di pannello. Se non esiste, dirlo: va progettato, ed è la parte di UI nuova della partizione.

**OQ-7**. Le tre dipendenze che con la partizione diventano cross-tab: PathBuilder disabilitato per assenza di metaclasse; wildcard più natura object; ambiguità di metaclasse fra metamodelli. Per ciascuna, dire dove nasce il dato, dove si manifesta l'effetto, e in quale dei cinque tab cadrebbero i due estremi.

### Area 4 — Vincoli da non rompere

**OQ-8**. Elencare, con `file:riga`, i punti che la partizione **non deve** toccare e che il prompt di implementazione dovrà citare come invarianti: la scrittura atomica dei capi, la convenzione del drop della chiave, il round-trip verbatim dei campi non autorati, il memo `featureInfo` di `VertexAuthoringPanel`, la guardia anti-reseed di `EnableIRPanel`.

**OQ-9**. Verificare se qualche sotto-editor ha **test** che ne dipendono dalla forma attuale delle props (`rowAuthoring.test.ts`, `edgeAuthoring.test.ts`, e gli altri sotto `authoring/__tests__/`). Il vincolo noto è che i test non possono importare i componenti: dire quali helper puri sono importati e quali sono rispecchiati per copia, perché una strada A che cambia le firme li tocca.

## Report OBBLIGATORIO

Salva il report in:

```
docs/discovery/discovery_<data-di-esecuzione>_panel_state_lifting.md
```

con `<data-di-esecuzione>` in formato `YYYY-MM-DD`. Crea `docs/discovery/` se non esiste.

Contenuto minimo: obiettivo, file letti con path completi, i findings per area con `file:riga`, la **tabella del censimento** (OQ-1) con la categoria a/b/c per ogni stato, il **confronto di costo fra strada A e strada B** con numeri e non aggettivi, i rischi ordinati per gravità, le domande aperte per Alfonso.

Sezione finale **"Opzioni"**: A, B, l'eventuale C di casa, e per ciascuna cosa richiederebbe toccare e quale rischio introduce. **Non raccomandare una vincente**: la scelta è di Alfonso.

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice, nessun refactoring, nessun rename, nessun sollevamento di stato "di prova".

Il report puoi committarlo da solo: `git add` del **solo** file del report (mai `git add .`, mai `git commit -a`), messaggio `docs: discovery on authoring panel state lifting for the tab partition`, più l'entry in `docs/claude-code-log.md` nella forma prescritta. Nota: il gate `check:docs` ha 4 errori noti sulle due entry malformate del 2026-08-03 e un bug proprio di risoluzione dei `Corregge` (`check-docs.ts:268` contro `:313`); la tua entry deve comunque essere conforme, ma non ti è chiesto di far tornare verde il gate.

## COME

- Solo lettura. Grep sui nomi degli hook, dei componenti, delle props.
- Numeri, non aggettivi: "12 props nuove su 4 file" batte "costo contenuto".
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState`).
- I `file:riga` citati qui vengono da letture del 2026-08-04 e possono essere sfasati: ri-ancorati via grep sui nomi, mai sui numeri di riga.

## RIFERIMENTI

- Ratifiche che vincolano il lavoro: `claude/ratifiche_2026-08-04_tab_partizione.md` (in particolare la sezione "Invarianti implementative").
- Inventario dei parametri: `claude/mappa_parametri_tab_ir.md`.
- Scrittura atomica dei capi: `claude/ratifiche_2026-08-02_eobj_object_as_edge.md`, R-1.
- Commit dei rami da non regredire: E-ref `9bd8cad9a`, E-obj `d1dc55649`.
- Discovery recenti come modello di formato: `discovery_2026-08-02_eobj_object_as_edge_authoring.md`.
