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

## 2026-10-01 — feat(#168): JjScript rifiuta ciò che il profilo non consente (J5, lane B)
**Prompt**: P-2026-10-01-2302, #168 B (J5): nello stand-alone (`?profile=`) l'esecutore JjScript rifiuta per comando ciò che il profilo vieta (comandi M2, create/set/rename/delete su tipi non `edit`, link verso tipi `hidden`), con un modulo puro testato che legge `resolveTypePermission`; in developer mode esecuzione identica.
**Files touched**: `frontend/src/jjscript/executor/permissionGuard.ts` (nuovo), `frontend/src/jjscript/executor/__tests__/permissionGuard.test.ts` (nuovo), `frontend/src/jjscript/executor/executor.ts` — `b3b9fcb9d`; `docs/discovery/discovery_2026-10-01_168_b_guard.md` — `f1992b96a`; `docs/log-inbox/jodie-consumer.md` e la riga Status del prompt nel commit di chiusura.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — tsc 14, stesso insieme della baseline; build exit 0; vitest `src/jjscript` 492/492 (rosso solo il noto `context-binding.test.ts`); sonda 3043 17/17, con D1-D3 in developer mode.
**Out-of-scope changes**: no — 3 file di codice, il DOVE ristretto dal GO.
**Layer Impact Report**: not-required — nessun file di §3.1; `instance.ts` non toccato.
**Smoke visivo**: non applicabile — lane senza interfaccia; sonda `_tmp_168_b_guard.ts` su 3043, 17/17.
**Notes**: Le sette raccomandazioni del referto adottate da Juri nel GO. Profilo letto dal vivo in executeAST (JjodieAPIImpl chiama executeCommand senza il servizio), quindi types.ts e JjScriptService.ts intatti. Banco: 16/16 mutazioni uccise sul modulo puro (corpo di b3b9fcb9d); una sull'adattatore, link hidden non controllato, uccisa dalla sonda (C5). Developer mode per contrasto, non confronto con il codice pre-modifica. Due ticket sotto.
**Prompt document name**: 2026-10-01 23:02

## 2026-10-01 — ticket: in consumer le letture JjScript nominano istanze di tipi hidden
**Ticket**: Il guard di J5 consente `list`, `show`, `eval` e `validate` in consumer mode perché non scrivono il modello, ma il loro output può nominare istanze (e tipi) che il profilo marca `hidden`: nella console di Jodie o in una risposta eseguita il fruitore vede ciò che il Configurator gli nasconde. Va deciso con J2 (contesto filtrato dal profilo) se filtrare l'output o rifiutare le letture su tipi `hidden`. Soft gate come tutto #157 (D1).
**Priority**: medium
**Found in**: P-2026-10-01-2302
**Detail**: docs/discovery/discovery_2026-10-01_168_b_guard.md

## 2026-10-01 — ticket: delete a cascata e link di contenimento toccano elementi read o hidden
**Ticket**: Il permesso è della classe esatta dell'istanza, come nel Configurator (`InstanceDetail.tsx:474`). Due scritture vanno oltre: `delete instance x` di un tipo `edit` cancella a cascata i figli contenuti anche se di tipo `read` o `hidden` (`instance.ts:495`, canonical cascade), e `set a.parte = b` su un riferimento di contenimento può spostare `b` anche se è di tipo `read`. Né il guard di J5 né il Configurator lo controllano. Da decidere in J4, con la misura M0 sul contenimento.
**Priority**: medium
**Found in**: P-2026-10-01-2302
**Detail**: docs/discovery/discovery_2026-10-01_168_b_guard.md

## 2026-10-02 — merge: 168-guard into feat/168-jodie-consumer
**Prompt**: `claude_2026-10-02_0732_prompt_merge_168-guard.md` (P-2026-10-02-0732) — merge diretto (`lane-run merge --direct`) della lane B (J5, controllo dei permessi in JjScript) nel trunk #168, secondo nell'ordine M0 → B → A.
**Files touched**: merge `ae61c823b` (3 commit di B: referto `f1992b96a`, codice `b3b9fcb9d`, chiusura `8ea1e68c4`); conflitto su `docs/log-inbox/jodie-consumer.md` risolto per unione (due inserimenti); tag `pre-168-guard` su `ab102f3ce`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gate del worker sul merge: typecheck 14 (insieme della punta ricevente), typecheck:scripts, vitest (5505 test, +38 rispetto al merge M0, 9 rossi all'import noti), build, check:agents, check:scripts verdi.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — `executor.ts` e il modulo puro `permissionGuard.ts`, nessun file di §3.1.
**Smoke visivo**: non applicabile — nessuna interfaccia cambiata; la lane B ha verificato con la sua sonda sulla porta 3043.
**Notes**: Il worker ha chiuso `blocked` solo per `check:docs` exit 1: stessi 5 errori della baseline del trunk (FAIL B sulle entry `docs/claude-code-log.md:245` e `:267`, FAIL D 74 entry su 40), nessuno dalle entry o dai ticket di B. Chiusura scritta a mano dall'orchestratore perché `go` rifiuta un merge bloccato.
**Prompt document name**: 2026-10-02 07:32

## 2026-10-02 — docs(#168): discovery R, contenimento e radice del modello (sospesa, opzione d)
**Prompt**: `claude_2026-10-02_0740_prompt_168_r_reparent_from_root.md` (P-2026-10-02-0740) — correzione nel core: uno spostamento per contenimento da un oggetto con padre il modello lo toglie da `model.objects` (ramo di contenimento di `get_setValueAtPosition`). Fase 1 di verifica e Layer Impact Report, Fase 2 dopo il GO.
**Files touched**: `3a5ae1084`: `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md` (nuovo); commit di chiusura: `docs/log-inbox/jodie-consumer.md`, la riga Status del prompt. Nessun file di codice. Sonda `frontend/scripts/smoke/_tmp_168_r_baseline.ts`, non committata (`_tmp_*`).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no — nessun file di codice modificato.
**Out-of-scope changes**: no
**Layer Impact Report**: produced — referto §7.
**Smoke visivo**: non applicabile — sospesa dopo la Fase 1, nessuna modifica.
**Notes**: Sospesa per decisione di Juri (opzione d). La premessa «copiare set_father» non reggeva: getCollection() su nomi di classe restituisce '' e set_father non tocca collezioni. La voce del figlio ri-padrato in model.objects è portante: la producono i gesti connect e add-child del canvas, la leggono gli archi M1, la ricerca per nome di JjScript e la conformità. Sonda 3044, 25/25, stato corretto simulato. Tre ticket sotto.
**Prompt document name**: 2026-10-02 07:40

**Ticket** (minori, senza voce propria; referto §9.6): il `set_father` di base non mantiene alcuna collezione e passerebbe l'id sbagliato (`LModelElement.tsx:763-766`, referto §5.2); il commento di `irContainment.ts:78-79` («an object created by the canvas keeps `father = DModel`») non vale dopo `syncCreateCompositionLink`; React Flow continua a dipingere un arco il cui DEdge è stato cancellato dalla riconciliazione (referto §5.4, CV2).

## 2026-10-02 — ticket: due forme di annidamento nel core, e consumatori che leggono solo model.objects
**Ticket**: Un figlio scritto in uno slot di composizione da `get_setValueAtPosition` (JjScript `set`, gesti connect e add-child del canvas, picker del form IR, output JjTL) ha `father` = slot ma resta in `model.objects`. Un figlio di `addObject` ha `father` = slot ed è fuori da `objects`. I consumatori che leggono solo `model.objects` trattano le due forme in modo diverso: archi di riferimento M1 (`useM1ReferenceEdges.ts:131`, `m1EdgeSweep.ts:81`, che eliminano gli archi uscenti di un figlio fuori da `objects`, misurato), ricerca per nome di JjScript (`instance.ts:117-120`), conformità (`ConformanceValidator.ts:35`). Unificare le due forme richiede lane in critical zone fuori dal perimetro di #168.
**Priority**: medium
**Found in**: P-2026-10-02-0740
**Detail**: docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md

## 2026-10-02 — ticket: l'espulsione da uno slot di composizione lascia un orfano
**Ticket**: `_clearValueAtPosition` (`LModelElement.tsx:7855-7856`) ri-padra al modello l'oggetto espulso da uno slot di composizione senza rimetterlo in `model.objects`. Misurato su un figlio di `addObject` espulso con `formWrite.clearValue`: `father` = DModel, fuori da `objects`, quindi invisibile alle letture che partono dalle radici. Un figlio nato alla radice oggi resta coerente solo perché non ha mai lasciato `objects`.
**Priority**: low
**Found in**: P-2026-10-02-0740
**Detail**: docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md

## 2026-10-02 — ticket: se un riferimento di aggregazione debba ri-padrare l'oggetto
**Ticket**: `LReference.get_containment` restituisce `composition || aggregation` (`LModelElement.tsx:4202`), quindi `set s.team = p` su un riferimento di aggregazione sposta `p` nello slot. Misurato: `father` = slot `team`, `p` ancora in `model.objects`. Da decidere se un'aggregazione (condivisa, non proprietaria) debba ri-padrare l'oggetto come una composizione.
**Priority**: low
**Found in**: P-2026-10-02-0740
**Detail**: docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md
