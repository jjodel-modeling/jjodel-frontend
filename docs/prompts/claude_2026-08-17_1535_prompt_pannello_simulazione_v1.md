# Pannello di simulazione v1 — simRunState, pannello connesso, highlight

> **Nome del documento prompt**: 2026-08-17 15:35

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili (tutte, salvo deroga sotto).
Corsia: **veloce** — nessun file di critical zone §3.1; niente discovery report separato, la
verifica preventiva va riportata in massimo dieci righe nell'entry di log.

Leggi `CLAUDE.md`. Branch: `alfonso-frontend-jjtl`.
Vincoli ratificati: serie **R-SIM-1..6** in `docs/decisions.md`; memo
`docs/ratifiche/claude_2026-08-17_memo_ratifica_pannello_simulazione.md`. Se questo prompt li
contraddice, segnala e fermati.

## Contesto (non rifare l'analisi)

Report: `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md` (+ addendum A1..A4).
Split ratificato: configurazione dei ruoli nel bag `data.state` del modello M2 (persistita);
run-state (flag attivi su istanze M1) fuori Redux in un singleton stile
`viewpoint/ir/irCollapseState.ts`. Punti già verificati sul codice, da non riscoprire:

- mapping nodo→oggetto: `idlookup[vertexId].model` è il DObject id (`viewpoint/ir/irResolve.ts:55,83`);
- `ObjectNode.tsx` ha due rami radice, entrambi con `hlClass` nel className (`:394` IR, `:449` nativo);
- montaggio: zona portali di `EditorV2.tsx`, precedente `PolymetricView` (`~:4047`,
  `{modelid && createPortal(..., document.body)}`; `isModelMode` è in scope, `:4054`);
- semantica prototipo: `forEndUser/Control.tsx:236-373` (lettura ruoli via
  `model.instanceof.state[...]`, navigazione `o['$'+ruolo].values` / `t['$'+ruolo].value`);
- scrittura bag: `lproxy.state = {chiave: valore}` è un patch shallow che deduplica gli
  invariati; i pointer salvati tornano proxy in lettura (report Q3, A3, R2).

## COSA

Cinque file, nessun altro.

1. **`frontend/src/components/editor-v2/sim/simRunState.ts`** (nuovo) — singleton di modulo,
   stessa forma di `irCollapseState.ts`: `Set<string>` di DObject id attivi + version counter +
   listeners. API: `isSimActive(id)`, `getSimActiveIds()`, `simReset(activeIds: string[])`
   (sostituisce l'intero Set, un bump), `simApplyStep(deactivate: string[], activate: string[])`
   (un bump), `simClear()`, `useSimVersion()` (hook `useSyncExternalStore`). Niente Redux,
   niente persistenza, niente azioni (R-SIM-1).

2. **`frontend/src/components/editor-v2/sim/SimulationPanel.tsx`** (nuovo) — componente
   `connect`-ato (precedente: `editors/MetaData.tsx`). Props: `modelid`, `isModelMode`.
   `mapStateToProps` espone il bag `_state` del modello di configurazione, così i cambi di
   ruolo ri-renderizzano dal ciclo Redux ordinario.
   - **Faccia M2** (`!isModelMode`): sezione «Simulation roles» con sei select:
     `simNode`, `simInitial`, `simTerminal`, `simTransition` sulle classi del modello;
     `simOwnedTransitions`, `simNextState` sulle reference. Scrittura:
     `lmm.state = {<chiave>: <id>}` (pointer, mai proxy; chiavi piatte, R-SIM-2); opzione
     vuota che scrive `undefined` per rimuovere.
   - **Faccia M1** (`isModelMode`): ruoli letti da `lmodel.instanceof.state` (pattern
     Control). Ruoli incompleti → riga «Configure simulation roles on the metamodel», niente
     bottoni. Ruoli completi → Reset / Step / Stop (icone `bi`) + riga di stato derivata, mai
     memorizzata: `Not started` (nessun attivo), `Running`, `Terminated` (≥1 istanza di
     simTerminal attiva), `Deadlock` (≥1 attivo non-terminale senza transizioni uscenti e
     nessun terminale attivo).
   - **Semantica** (dal memo, vincolante): `reset` → `simReset(istanze di simInitial)`;
     `stop` → `simClear()`; `step` → se un terminale è attivo, no-op con stato `Terminated`;
     altrimenti per ogni istanza attiva: le transizioni uscenti via
     `o['$'+ownedTransitions].values`, i target via `t['$'+nextState].value` si attivano, la
     sorgente si disattiva; un attivo senza transizioni uscenti resta attivo (deadlock
     visibile). Un solo `simApplyStep` per l'intero passo. **Nessuna scrittura sul modello né
     sul bag M1** (invariante del prototipo, R-SIM-6).
   - Al cambio di `modelid` e allo smontaggio: `simClear()` (R-SIM-5).

3. **`frontend/src/components/editor-v2/sim/simulation-panel.scss`** (nuovo) — pannello
   flottante chiuso a chip (progressive disclosure), design system §7: griglia 8px, bottoni
   slate, icone `bi`, token esistenti via `var(--color-*)`; nessuna variabile CSS definita qui
   (regola 28). Qui anche `.mm-node.sim-active` (outline/shadow cyan `#0ea5e9`, indicatore di
   attivo consentito da §7.1).

4. **`frontend/src/components/editor-v2/EditorV2.tsx`** — solo il montaggio, accanto a
   `PolymetricView`: `{modelid && <SimulationPanel modelid={modelid} isModelMode={isModelMode} />}`
   in portal su `document.body`. Import in coda al blocco import interni. Nient'altro.

5. **`frontend/src/components/editor-v2/nodes/ObjectNode.tsx`** — `useSimVersion()` +
   DObject id del nodo (`useSelector`: `s.idlookup[id]?.model`); appendi ` sim-active` al
   className radice di **entrambi** i rami (`:394` e `:449`) quando `isSimActive(objectId)`.
   Nient'altro in questo file.

## HARD STOP

Prima del commit: diff completa dei cinque file in chat; grep di collisione sui nuovi
identificatori (`simRunState`, `SimulationPanel`, `useSimVersion`, `sim-active`,
`simulation-panel`, chiavi `sim*` nel bag) con controllo positivo; gate `npm run typecheck`
(baseline: non aumentare) e `npm run build`. Commit solo dopo go-ahead di Alfonso, `git add`
dei soli cinque file. Entry di log a fine task (formato §21.2, verifica preventiva inline).

## NON FARE

- Non toccare `IRNodeContent.tsx`, `pathExpr.ts`, `irReadCtx.ts`, `irCrossDeps.ts`, hook di
  sync, reducer, `set_state`, canale collaborativo (R-SIM-4).
- Non scrivere run-state nel bag `_state`, né flag `active` su M1 (R-SIM-1).
- Non importare componenti da `forEndUser/` (scope jsx spento): il prototipo si legge, non si
  riusa (R-SIM-6).
- Non introdurre sotto-oggetti nel bag (`sim: {...}` vietato, R-SIM-2), né eventi
  `jjodel:` hardcoded, né dipendenze nuove.

## RIFERIMENTI

`irCollapseState.ts` (forma del singleton), `MetaData.tsx` (connect + bag), `Control.tsx`
(navigazione ruoli), `irResolve.ts:55` (vertex→object), `EditorV2.tsx:4047` (portale),
`ObjectNode.tsx:394,449` (className radice), memo R-SIM per ogni dubbio di semantica.
