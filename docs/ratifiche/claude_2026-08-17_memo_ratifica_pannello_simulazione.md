# Memo di ratifica — Pannello di simulazione: dove vive lo stato (state attributes)

**Data**: 2026-08-17
**Branch**: `alfonso-frontend-jjtl`
**Commit di riferimento**: `77d468c99` (solo docs oltre `3a6436ff6`; codice invariato)
**Report di riferimento**: `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md`,
incluso l'addendum A1..A4 prodotto in questa analisi
**Ratificato da**: Alfonso, 2026-08-17, in chat di progetto (analisi rifatta con verifica
indipendente delle evidenze su clone di origin)

## La decisione

Il pannello di controllo della simulazione (caso d'uso: state machine con State/Transition/Event)
separa i due strati che il bag `_state` oggi fonde, e li colloca in meccanismi diversi:

1. **Configurazione (ruoli M2)** — quale metaclasse gioca `node`, `initial`, `terminal`,
   `transition`; quale containment è `ownedTransitions`; quale reference è `nextState` — vive nel
   bag `data.state` del modello M2. Persistita col progetto, annullabile con Ctrl+Z, condivisa in
   collaborativo: tutti comportamenti voluti, perché è authoring del language fragment.
2. **Run-state (esecuzione su M1)** — il flag `active` sulle istanze — vive **fuori da Redux**, in
   un singleton di modulo sul modello di `irCollapseState.ts` (Set di elementId attivi + version
   counter + `useSyncExternalStore`). Per costruzione: non persistito, mai nella undo history, mai
   sul socket collaborativo.
3. **Il pannello è fuori dall'IR**: componente React `connect`-ato nella forma di `MetaData.tsx`
   (`mapStateToProps` su `_lastSelected` → proxy L), montato nella UI di editor-v2, mai nello
   scope dei template. I bottoni reset/step/stop sono onClick React ordinari: il «canale di
   esecuzione degli eventi» (R9 del report) per questo pannello è React stesso.
4. **L'highlight dello stato attivo sul canvas** non estende l'interprete IR: classe CSS al
   wrapper del nodo quando l'elementId è nel Set del singleton, con hook di versione, sul pattern
   dell'overlay dei problems. `IRNodeContent.tsx` e il dependency set non si toccano.

Le tre domande bloccanti del report ricevono così risposta:

- **Persistenza (domanda 1)**: voluta per la configurazione, esclusa per costruzione per il
  run-state. Nessun progetto che riapre a metà simulazione.
- **Undo (domanda 2)**: la simulazione non entra mai nella history; la configurazione sì, ed è
  giusto così (è authoring). Nessuna modifica a reducer o a `set_state`.
- **Collaborativo (domanda 3)**: la simulazione è locale nella v1. La configurazione viaggia col
  modello, correttamente (authoring a bassa frequenza).

## Contratto

- Chiavi di configurazione nel bag: **piatte e prefissate** — `simNode`, `simInitial`,
  `simTerminal`, `simTransition`, `simOwnedTransitions`, `simNextState`. Valori salvati come
  pointer, mai proxy (`__sanitizeValue` converte in scrittura, `attemptWrap` risolve in lettura:
  è il comportamento su cui il prototipo già conta). Vietato il sotto-oggetto `sim: {...}`: con
  la copia shallow di R3 sarebbe esattamente il punto in cui le mutazioni annidate scappano dal
  macchinario.
- Il singleton di run-state **si azzera al cambio di progetto/modello**; senza reset i flag
  sopravvivono fra progetti nella stessa sessione.
- Il version counter globale del singleton re-renderizza tutti i sottoscrittori a ogni step:
  accettato per la v1 (simulazione guidata a mano); da rivalutare solo per run automatici ad
  alta frequenza.
- Di `Control.tsx` si recupera la semantica (ruoli, reset/step/stop, invariante «la simulazione
  non tocca il modello», già rispettata dal prototipo) e si riscrive il codice come pannello
  connesso. La spec del pannello deve definire due comportamenti che il prototipo lascia
  indefiniti: lo stato attivo senza transizioni uscenti (in `step()` resta attivo per sempre,
  `Control.tsx:288-295`) e il criterio di terminazione (oggi: almeno un terminale attivo).

## Razionale

- **A1**: `U.throttle` è un gate di debug (`U.tsx:2859-2861`): ogni azione parte subito sul
  socket, senza batching. Il costo collaborativo di una simulazione via azioni è per passo per
  oggetto.
- **A2**: la history fonde i delta entro 450ms nell'entry precedente (`reducer.ts:1250,1278`).
  Tenere il run-state nel ciclo delle azioni contaminerebbe le entry di undo degli edit di
  modello; ed esclude `isRelevantChangeCheck` come leva di opt-out (fonde, non scarta).
- **A3**: `set_state` deduplica le scritture invariate (`classes.ts:2230,2236`): il costo in
  transazioni della configurazione è trascurabile.
- Il precedente di design più recente per stato non-modello (`irCollapseState.ts`) ha scelto
  deliberatamente il singleton fuori Redux; qui il caso è più semplice, perché manca perfino la
  parte da persistere che il collasso aveva (`DVertex.irCollapsed`).
- `MetaData.tsx` dimostra in produzione la forma «pannello connect-ato che legge e scrive il bag
  con reattività dal ciclo Redux ordinario»: la parte di configurazione non richiede nulla di
  nuovo.

## Alternative scartate

1. **Run-state nel bag `_state`.** Richiederebbe quattro interventi core o quasi-core: plumbing
   di `skipCollaborative` in `set_state` (`joiner/classes.ts`); esclusione dalla history con
   filtro del campo nel calcolo del delta (`reducer.ts:1199`, con la trappola A2); pulizia dello
   stato di simulazione alla riapertura del progetto; disciplina di namespacing su un bag piatto
   già affollato (R1). Quattro modifiche delicate contro zero.
2. **Pannello dentro l'IR** (namespace `state` nelle espressioni). Tocca `pathExpr.ts` (STEP_RE
   non ammette `state`), `irReadCtx.ts` (ReadCtx non espone il bag), `irCrossDeps.ts` e le firme
   in `IRNodeContent.tsx`, più l'emendamento della spec §9 che oggi vieta il re-render fuori dal
   dependency set. Quattro file di critical zone e una spec normativa: non è la v1. Resta
   possibile come estensione futura con ratifica dedicata.
3. **Simulazione condivisa via azioni di modello.** Costi A1 (una emissione per passo),
   persistenza spuria, `statehistory.all` inquinata (con l'anomalia A4 sull'indice incrociato in
   collaborativo). Se la feature servirà, il canale giusto è un evento socket dedicato che
   trasporta il run-state del singleton.

## Prossimo passo

Prompt di implementazione della v1, corsia veloce (nessun file di critical zone): modulo
`simRunState.ts` (singleton + hook + reset al cambio progetto), pannello connesso
(configurazione M2 + reset/step/stop su M1), highlight al wrapper del nodo. La spec del pannello
fissa deadlock e terminazione prima del codice.
