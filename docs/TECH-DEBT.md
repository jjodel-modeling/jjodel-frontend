# Tech Debt — jjodel

Registro dei debiti tecnici noti. Ogni entry deve indicare: data, origine, stato attuale, fix strutturale raccomandato, effort stimato, riferimenti.

---

## Dual undo-system (editor-v2 RF history vs Redux state-delta)

**Registrato:** 2026-04-23
**Origine:** fix interim bug "undo/attr_0" tramite disabilitazione rename branch in `reconcileJjomAfterUndoRedo` (`frontend/src/components/editor-v2/sync/canvasToJjom.ts`).
**Stato attuale:** Opzione 4 applicata. Rename branch per `DAttribute` disabilitato (codice commentato, non rimosso). Ctrl+Z non revoca più rename inline di attributi (regressione minore accettata). Info-panel rename non viene più corrotto da undo successivi.
**Fix strutturale raccomandato:** Opzione 3 del report — estendere `useHistory` per catturare uno snapshot Redux ID-keyed (subset di `idlookup`) assieme al RF snapshot, applicare restore atomico di entrambi al undo/redo, rimuovere `reconcileJjomAfterUndoRedo` del tutto. Alternative in ordine di completezza:
- Opzione 1 (interim più chirurgico): integrare `editorContext?.takeSnapshot()` dentro `Info.tsx` quando è aperto su un nodo editor-v2, mantenendo l'architettura attuale.
- Opzione 2: sostituire `useHistory` con `UndoAction.new` / `RedoAction.new` di Redux come single source of truth. Rischio regressioni perché Redux cattura anche transient view state.
**Effort stimato:** 2-3 giorni per Opzione 3 (prompt dedicato futuro).
**Riferimenti:**
- `docs/reports/2026-04-23-undo-attr-zero-analysis.md`
- `docs/reports/2026-04-23-attribute-coevolution-analysis.md`
- Commit di disabilitazione branch: [da inserire dopo commit]

---

## Unificazione delle palette entity pannello/tree

**Registrato:** 2026-08-10
**Origine:** passo 3 dell'arco rail destro (R-RAIL-25). Il consumo dei token `--color-entity-*` nel badge del pannello proprietà è stato tentato e fermato al confronto dei valori.
**Stato attuale:** il pannello colora i badge da `frontend/src/styles/components/_form-system.scss:1251-1259` (nove modificatori `.jj-type-badge--*`, esadecimali inline), il tree da `frontend/src/common/entityMeta.ts`, ora tokenizzato in `--color-entity-*` dal commit `4d215ff0e`. In light **nessuno dei quattro kind di C9.1 coincide** e **attribute ed enum sono invertiti**: l'ambra che nel pannello significa «attributo» è il token di `enum`, lo smeraldo che significa «enum» è il token di `attribute`. Le altre due divergono di famiglia (reference rosa vs ciano, operation violetto vs indaco).
**Fix strutturale raccomandato:** è una **decisione di design**, non una migrazione di sorgente: va scelta quale delle due palette è quella giusta per l'app, e poi allineata l'altra. Il raggio d'azione è l'app e non il rail — `_form-system.scss` è importato globalmente da `styles/style.scss:2` e `.jj-type-badge` è vivo anche in `frontend/src/components/editors/views/ViewData.tsx:221` — quindi non è un intervento che possa entrare di straforo in un arco di redesign di un pannello.
**Priorità:** media.
**Effort stimato:** mezza giornata per l'allineamento meccanico una volta presa la decisione; la decisione è la parte cara.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-25, R-RAIL-9 (annotazione), R-RAIL-26
- `docs/discovery/discovery_2026-08-10_rail_fase0.md` — nota sulle tre palette entity
