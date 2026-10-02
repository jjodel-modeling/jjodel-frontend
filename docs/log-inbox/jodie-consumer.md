# log-inbox — lane «jodie-consumer» (#168)

Entries written by the #168 lanes (Jodie for the stand-alone consumer of #157) while sessions
share the trunk `feat/168-jodie-consumer` (P9, parallel lanes). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The
active log is not touched by these lanes.

---

## 2026-10-01 — docs(#168): discovery M0, measures for J4 (annullamento, «Unsaved», riferimenti, contenimento)
**Prompt**: `claude_2026-10-01_2300_prompt_168_m0_measures.md` (P-2026-10-01-2300) — misurare nel browser reale, sul codice di oggi, ciò che la lane J4 dovrà promettere o correggere: Ctrl+Z su uno script JjScript eseguito come Jodie, l'indicatore «Unsaved», la semantica di `set` su riferimento singolo vs multiplo, il contenimento via JjScript, uno spostamento fallito, la reattività del Configurator.
**Files touched**: `58adb6728`: `docs/discovery/discovery_2026-10-01_168_m0_measures.md` (nuovo). Sonda `frontend/scripts/smoke/_tmp_168_m0_measures.ts`, non committata (`_tmp_*`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: non applicabile — lane di sola misura, nessun file sotto `frontend/` tracciato toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessuna modifica; la sonda osserva `useJjomSync`/`LModelElement.tsx`/`ConfiguratorTab.tsx` senza scriverli.
**Smoke visivo**: non applicabile — lane di discovery, nessuna modifica UI.
**Notes**: Trovato un gate non previsto dal prompt: `U.userHasInteracted` (mai alzato fuori da EditorV2/MetamodelTab) rende Ctrl+Z un no-op totale in consumer puro — azzera la premessa di Q1. G4 confermato; trovata in aggiunta una race di perdita dati su due `set` consecutivi sullo stesso riferimento senza pausa (stesso meccanismo ENG1, ora raggiungibile da JjScript). Dettagli e raccomandazioni per J4 nel referto, §0 e §7.
**Prompt document name**: 2026-10-01 23:00

## 2026-10-02 — merge: 168-measures into feat/168-jodie-consumer
**Prompt**: `claude_2026-10-02_0728_prompt_merge_168-measures.md` (P-2026-10-02-0728) — merge diretto (`lane-run merge --direct`) della lane M0 nel trunk #168, ordine fissato al lancio M0 → B → A.
**Files touched**: merge `6a9a45b69` (2 commit di M0: referto `58adb6728`, chiusura `ff8a28553`; 3 file docs, zero conflitti); tag `pre-168-measures` su `8961023e1`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gate del worker sul merge: typecheck 14 (insieme della punta ricevente), typecheck:scripts, vitest (5467 test, 9 rossi all'import noti), build, check:agents, check:scripts verdi.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo docs.
**Smoke visivo**: non applicabile — merge di soli docs.
**Notes**: Il worker ha chiuso `blocked` solo per `check:docs` exit 1, che è rosso già sulla baseline del trunk (`98ebb132e`): FAIL B sulle entry `docs/claude-code-log.md:245` e `:267`, FAIL D 74 entry su 40. Output confrontato riga per riga: identico, nessun errore nuovo dall'entry M0. Chiusura scritta a mano dall'orchestratore perché `go` rifiuta un merge bloccato.
**Prompt document name**: 2026-10-02 07:28
