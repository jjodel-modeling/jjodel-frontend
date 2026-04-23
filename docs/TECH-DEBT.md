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
