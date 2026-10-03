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

## 2026-10-02 — merge: 168-reparent into feat/168-jodie-consumer
**Prompt**: `claude_2026-10-02_1247_prompt_merge_168-reparent.md` (P-2026-10-02-1247) — merge diretto (`lane-run merge --direct`) della lane R, sospesa dopo la Fase 1 per decisione di Juri (opzione d): entra solo il referto e la chiusura, nessun codice.
**Files touched**: merge `36695c8b3` (2 commit di R: referto `3a5ae1084`, chiusura `20ecaad98`; 3 file docs, zero conflitti); tag `pre-168-reparent` su `a78d614b7`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gate del worker sul merge: typecheck 14 (insieme della punta ricevente), typecheck:scripts, vitest (5505 test, 9 rossi all'import noti), build, check:agents, check:scripts verdi.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo docs; il LIR di R sta nel suo referto.
**Smoke visivo**: non applicabile — merge di soli docs.
**Notes**: Il worker ha chiuso `blocked` solo per `check:docs` exit 1: stessi 5 errori della baseline del trunk (FAIL B su `docs/claude-code-log.md:245` e `:267`, FAIL D 74 entry su 40). Chiusura scritta a mano dall'orchestratore perché `go` rifiuta un merge bloccato.
**Prompt document name**: 2026-10-02 12:47

## 2026-10-02 — feat(#168): Jodie segue la selezione del Configurator e vede solo ciò che il profilo mostra (J1, J2)
**Prompt**: `P-2026-10-01-2301` (#168 A): nello stand-alone l'artefatto di Jodie è la selezione del Configurator (sempre M1) e il contesto è filtrato dal profilo. Fase 1: referto `discovery_2026-10-01_168_a_context.md` (`72dca4dc3`); GO di Juri del 2026-10-02 con le sette raccomandazioni del §0 adottate.
**Files touched**: `39b6b7cde`: `events/registry.ts`, `environment/consumerJodieContext.ts` (nuovo), `environment/ConfiguratorTab.tsx`, `Jodie/Jodie.tsx`, `environment/__tests__/consumerJodieContext.test.ts` (nuovo). Sonde `_tmp_168_a_p0.ts`, `_tmp_168_a_dev.ts`, `_tmp_168_a_verify.ts` non committate.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, insieme di §17 (diff vuoto); build exit 0; vitest 134/134; sonda 17/17; corpo della richiesta developer identico byte per byte alla Fase 1 (sha1 `dc3a1380`).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; solo letture di `idlookup` e un evento nuovo.
**Smoke visivo**: fallito (voci 2-4: la riga «Now looking at» non in corsivo, trattini bassi letterali; misurato da Juri e dall'orchestratore il 2026-10-02) — sonda 17/17 sul contesto; corretto da `491e3a022`.
**Notes**: Misurato prima: al primo caricamento Jodie mandava tutti i metamodelli senza artefatto; dopo una tab di metamodello rimasta aperta timbrava M2; Vault in ogni richiesta. Dopo: M1 sul modello dell'istanza, zero nomi o id nascosti, riga «Now looking at» una per selezione. Classi abbinate per nome (il contesto non ha id di classe). Banco 10/10 mutazioni uccise. RAG spento nel consumer.
**Prompt document name**: 2026-10-01 23:01

## 2026-10-02 — fix(#168): la riga della selezione del fruitore in corsivo; la chiave della dedup si muove solo quando la riga è scritta
**Prompt**: rework di Fase 2 di `P-2026-10-01-2301` dopo la verifica visiva fallita sulle voci 2-4: la riga usciva come testo semplice con i trattini bassi letterali; verificare un percorso in cui la riga di un'istanza non compare.
**Files touched**: `491e3a022`: `Jodie/Jodie.tsx`, `environment/consumerJodieContext.ts`, `environment/__tests__/consumerJodieContext.test.ts`. Sonda `_tmp_168_a_verify.ts` aggiornata, non committata.
**Outcome**: ✅ completed
**Corregge**: 2026-10-01 23:01 (Fase 2, `39b6b7cde`)
**Causa**: (d)
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, insieme di §17; build exit 0; vitest 136/136; sonda 21/21 a clic reali; corpo developer identico byte per byte (sha1 `dc3a1380`).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri del 2026-10-02, voci 1-6 (corsivo confermato da screenshot); sonda Playwright 21/21 su 3045, con `_…_` rimesso 5 rossi (controllo).
**Notes**: Causa: `MarkdownMessage.hasMarkdownSyntax` riconosce il corsivo solo come `*…*`; ora `*…*`, `MarkdownMessage` intatto. La chiave della dedup ora si muove solo alla scrittura (`consumerSelectionLine`, banco 12/12). «Niente dopo Antonio» non riprodotto: la pagina pubblica solo sui cambi, nessuna sequenza di clic trovata che salti una selezione nuova.
**Prompt document name**: 2026-10-01 23:01

## 2026-10-02 — feat(#168): Jodie segue la navigazione dentro il dettaglio del Configurator
**Prompt**: estensione decisa da Juri il 2026-10-02 dentro `P-2026-10-01-2301`: l'elemento a fuoco è il passo corrente del breadcrumb del dettaglio (`NavState`), altrimenti la riga; il tipo nascosto non è mai il fuoco; una riga in chat per fuoco nuovo.
**Files touched**: `800238541`: `environment/consumerJodieContext.ts`, `environment/ConfiguratorTab.tsx`, `environment/__tests__/consumerJodieContext.test.ts`. Sonda `_tmp_168_a_drill.ts`, non committata.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, insieme di §17; build exit 0; vitest 143/143; sonde 23/23 (drill) e 21/21 (precedente); corpo developer identico byte per byte (sha1 `dc3a1380`).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; `NavState` solo letto.
**Smoke visivo**: passato — verifica visiva di Juri del 2026-10-02 su `800238541`, voci 1-6 della checklist sulla navigazione nel dettaglio; sonda Playwright 23/23 su 3045 a clic reali, con il fuoco della sola riga 12 rossi (controllo).
**Notes**: `consumerFocusOf`: il passo più profondo del breadcrumb non nascosto, altrimenti la riga; ignorati gli stati di un commit (riga di altro tipo dopo un cambio di tipo, strada di un'altra riga). Banco 6/6 sulle righe nuove. Il pannello rifiuta già di aprire un elemento nascosto (`InstanceDetail.drillTo`).
**Prompt document name**: 2026-10-01 23:01

**Ticket** (nota, non slot): il dettaglio mostra il riferimento a un elemento di tipo hidden come etichetta bloccata `vault_alpha: Vault` (`InstanceDetail.tsx:139-151`), mentre il contesto di Jodie lo omette (referto §0 Q2, decisione del 2026-10-02: `InstanceDetail` non si tocca qui). A 1440×900 la finestra di Jodie copre i link in basso nel dettaglio (`elementFromPoint` → `div.jodie-messages`, misurato in D3, D6, D8 e D10): per raggiungerli il fruitore chiude Jodie.

## 2026-10-02 — ticket: la testata di Jodie mostra «M2 · <metamodello>» nello stand-alone
**Ticket**: `JodieHeader.tsx:70-90` calcola l'etichetta da `getActiveModel()`, con ripiego sul primo metamodello. Nel consumer legge «M2 · ScenarioMM» anche dopo la lane A, mentre contesto e scope sono M1 sul modello della selezione (misurato V1-V5): gergo e artefatto sbagliato. Assegnato a J7 (linguaggio di Jodie), decisione di Juri del 2026-10-02.
**Priority**: medium
**Found in**: P-2026-10-01-2301
**Detail**: docs/discovery/discovery_2026-10-01_168_a_context.md

## 2026-10-02 — ticket: developer → consumer senza ricarica lascia il rail destro sul metamodello
**Ticket**: Con una tab di metamodello aperta, aggiungere `&profile=` senza ricarica lascia il rail destro sull'albero e sulle Properties del metamodello (tipi hidden compresi) e la status bar su «ScenarioMM 4 classes»; le righe del Configurator finiscono sotto la LeftBar (`elementFromPoint` al centro di `Arco_0` → `.psb-action--danger`), il clic non arriva. Misurato in S3 e V4; #157 R5/R9 nel verso opposto, non corretto in A.
**Priority**: medium
**Found in**: P-2026-10-01-2301
**Detail**: docs/discovery/discovery_2026-10-01_168_a_context.md

## 2026-10-02 — ticket: le righe di avviso di Jodie mostrano il pulsante «Source» del markdown
**Ticket**: ogni riga di avviso in chat («Now looking at: …», e l'avviso developer «Context switched to …») passa per `MarkdownMessage` e mostra sotto di sé il pulsante «Source» del markdown (misurato: `innerText` della riga = «Now looking at: Scenario «Scenario_0»» seguito da «Source»). Per il fruitore è rumore: serve uno stile di avviso dedicato, senza il pulsante. Assegnato a J7 (linguaggio e aspetto di Jodie), richiesta di Juri del 2026-10-02.
**Priority**: low
**Found in**: P-2026-10-01-2301

## 2026-10-02 — merge: 168-context into feat/168-jodie-consumer
**Prompt**: `claude_2026-10-02_2147_prompt_merge_168-context.md` (P-2026-10-02-2147) — merge diretto (`lane-run merge --direct`) della lane A (J1 + J2: Jodie segue la selezione e la navigazione del Configurator, contesto filtrato per profilo) nel trunk #168, terzo nell'ordine M0 → B → A.
**Files touched**: merge `9065643db` (5 commit di A: referto `72dca4dc3`, codice `39b6b7cde`, `491e3a022`, `800238541`, chiusura `a1455999a`); conflitto su `docs/log-inbox/jodie-consumer.md` risolto per unione; tag `pre-168-context` su `a70f54af5`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gate del worker sul merge: typecheck 14 (insieme della punta ricevente), typecheck:scripts, vitest (5531 test, 9 rossi all'import noti), build, check:agents, check:scripts verdi; sonde di A rieseguite sul trunk unito (porta 3045): `_tmp_168_a_verify` 21/21, `_tmp_168_a_drill` 23/23.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri sulla lane (2026-10-02, voci 1-6 del rework e 1-6 della navigazione nel dettaglio); sul trunk unito le sonde della lane, non `npm run smoke` (fisso sulla 3000).
**Notes**: Il worker ha chiuso `blocked` solo per `check:docs` exit 1: stessi 5 errori della baseline del trunk (FAIL B su `docs/claude-code-log.md:245` e `:267`, FAIL D 74 entry su 40). Chiusura scritta a mano dall'orchestratore perché `go` rifiuta un merge bloccato.
**Prompt document name**: 2026-10-02 21:47

## 2026-10-02 — fix(#168): JjScript sostituisce sui riferimenti singoli, = null svuota, prompt v5 (C1)
**Prompt**: `claude_2026-10-02_1255_prompt_168_c1_executor_prompt.md` (P-2026-10-02-1255) — `set` su un riferimento a valore singolo sostituisce, più `set` sullo stesso slot non perdono scritture, prompt di chat v5 (regola (b), contenimento create + set, sezione per il fruitore sul blocco `environment`). Fase 1 di verifica, Fase 2 dopo il GO con le sei raccomandazioni adottate da Juri.
**Files touched**: `327bfedd7`: `docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md` (nuovo); `4d49a28b7`: `frontend/src/jjscript/executor/referenceWrite.ts` (nuovo), `frontend/src/jjscript/executor/__tests__/referenceWrite.test.ts` (nuovo), `frontend/src/jjscript/executor/commands/instance.ts`; `dc8b7f9b5`: `frontend/src/constants/defaultPrompts.ts`; commit di chiusura: `docs/log-inbox/jodie-consumer.md`, la riga Status del prompt. Sonde `_tmp_168_c1_baseline.ts`, `_tmp_168_c1_window.ts`, `_tmp_168_c1_verify.ts`, non committate.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes — intermedia, non committata: l'import statico di `action.ts` in `instance.ts` rompeva `handleRegistry.test.ts` ed `elementWaiter.test.ts`; trovata da vitest e corretta prima del commit. Stato committato: tsc 14 stesso insieme, build exit 0, vitest `src/jjscript` 512 test (rosso solo il noto `context-binding.test.ts`), sonda 3046 24/24.
**Out-of-scope changes**: no — quattro file di codice del DOVE; il ramo di scollegamento di `instance.ts` è entrato per il GO (raccomandazione 2).
**Layer Impact Report**: produced — referto §7; nessun file di §3.1, nessun creatore dentro una TRANSACTION.
**Smoke visivo**: non applicabile — nessuna interfaccia cambiata; sonda `_tmp_168_c1_verify.ts` su 3046, 24/24, zero errori di pagina.
**Notes**: La race era un blocco sempre aperto, committato ogni 300 ms (`reducer.ts:1444`), non un `setTimeout(0)`: colpiva anche Run (20 ms). Correzione: flush prima della lettura e rimozione per valore. Banchi: 14/14 sul modulo puro, 5/5 nel browser; il proxy rinnovato sopravviveva ed è stato tolto. `COMMIT` si importa al momento della chiamata: un avviso Rollup in più (4 → 5). Oggetti dei due commit accorciati sotto 72 (§6.2). Una riga oltre la bozza nel prompt: `currentlyEditing`, dalla nota del GO.
**Prompt document name**: 2026-10-02 12:55

**Ticket** (minore, senza voce propria; referto §6): un `delete instance x` entro 300 ms da un link verso `x` può lasciare un id pendente nello slot, perché la rete di `Dummy.get_delete` non vede il link ancora in coda; solo letto, non misurato, ed è comune a ogni scrittura. Dichiarata anche la guardia sul padre in `removeLinked`, che nessun arm della sonda distingue.

## 2026-10-02 — ticket: JjScript a M1 accetta +=, -=, add e remove senza eseguirli
**Ticket**: `set x.ref -= y` è analizzato (`parser.ts:570-584`) e ignorato da `executeSetInstance`, quindi AGGIUNGE `y` in silenzio e risponde «Linked»; `+=` aggiunge per coincidenza. `remove y from x.ref` e `add` a M1 passano alla risoluzione M2 e falliscono con `ELEMENT_NOT_FOUND`. Il prompt di chat v5 li vieta; l'esecutore dovrebbe rifiutarli a M1 con un codice e una frase propri.
**Priority**: medium
**Found in**: P-2026-10-02-1255
**Detail**: docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md

## 2026-10-02 — merge: 168-exec into feat/168-jodie-consumer
**Prompt**: `claude_2026-10-02_2251_prompt_merge_168-exec.md` (P-2026-10-02-2251) — merge diretto (`lane-run merge --direct`) della lane C1 (esecutore JjScript: sostituzione sui riferimenti singoli, nessuna scrittura persa, `= null` che svuota; prompt di chat v5) nel trunk #168, primo dell'ordine C1 → C2 → D.
**Files touched**: merge `be4260166` (4 commit di C1: referto `327bfedd7`, codice `4d49a28b7` e `dc8b7f9b5`, chiusura `5b8c95b1b`); conflitto su `docs/log-inbox/jodie-consumer.md` risolto per unione; tag `pre-168-exec` su `4e2382f36`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gate del worker sul merge: typecheck 14 (insieme della punta ricevente), typecheck:scripts, vitest (5551 test, 9 rossi all'import noti), build, check:agents, check:scripts verdi; sonda di C1 `_tmp_168_c1_verify` rieseguita sul trunk unito (porta 3046): 24 PASS, exit 0, console con i soli 3 `wrong project setup in navbar` già presenti nella sonda della lane.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; il flush usa il `COMMIT` già esistente, nessun TRANSACTION attorno a creatori (Rule 12, referto C1 §7).
**Smoke visivo**: non applicabile — nessuna interfaccia cambiata.
**Notes**: Il worker ha chiuso `blocked` solo per `check:docs` exit 1: stessi 5 errori della baseline del trunk (FAIL B su `docs/claude-code-log.md:245` e `:267`, FAIL D 74 entry su 40). Chiusura scritta a mano dall'orchestratore perché `go` rifiuta un merge bloccato.
**Prompt document name**: 2026-10-02 22:51

## 2026-10-03 — feat(#168): il fruitore vede la proposta di Jodie e la applica (J4, lane C2)
**Prompt**: `claude_2026-10-02_2215_prompt_168_c2_proposal.md` (P-2026-10-02-2215) — nello stand-alone un blocco `jjscript` di Jodie diventa una proposta leggibile con «Apply» e «Discard» e lo script in «Details»; Apply accende l'annullamento e «Unsaved» e mostra l'elemento nel Configurator; controllo del contenimento prima di Apply; developer invariato.
**Files touched**: `f7fde9973`: `Jodie/consumerProposalModel.ts`, `Jodie/__tests__/consumerProposal.test.ts`, `Jodie/ConsumerProposal.tsx`, `Jodie/ConsumerProposal.scss` (nuovi), `common/MarkdownRenderer.tsx`, `events/registry.ts`, `environment/ConfiguratorTab.tsx`; referto `ae1978693`. Sonde `_tmp_168_c2_verify.ts`, `_tmp_168_c2_raw.ts`, `_tmp_168_c2_console.ts` e righe `_tmp_168_c2_setup.js`, `_tmp_168_c2_mock.js` non committate.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` output completo **14**, insieme di §17; build exit 0; vitest 49/49 sul test nuovo, verdi `consumerJodieContext`, `multiDraw`, `lastSaved`, `formAuthoring`; sonda 3047 19/19 a clic reali, zero errori di pagina, zero chiamate reali; developer: «Run» e `ScriptBlock` come prima (S6).
**Out-of-scope changes**: no — rinomina di un file della lista: `consumerProposal.ts` → `consumerProposalModel.ts` (collisione di maiuscole con `ConsumerProposal.tsx`, TS1149), su risposta dell'orchestratore.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri del 2026-10-03, voci 1-7 della checklist (vite 3047 su `f7fde9973`, fixture `_tmp_168_c2_setup.js`, risposte simulate `_tmp_168_c2_mock.js`, zero chiamate reali); sonda Playwright 19/19 su 3047.
**Notes**: Sette raccomandazioni del referto adottate da Juri. Misurato e corretto: Apply attende U.UpdatingTimer*1.5+150 ms dopo ogni passo. Senza, i passi diventano una sola voce di undo (R-UNDO-5: un Ctrl+Z lasciava l'id di ph1 nello slot di Scenario_0) e il guard rifiuta il set che nomina l'elemento appena creato. Ora 3 Ctrl+Z per 3 passi, stato iniziale ripristinato. Banco 23/23.
**Prompt document name**: 2026-10-02 22:15

## 2026-10-03 — ticket: in consumer il guard rifiuta un set che nomina l'elemento creato dal passo prima
**Ticket**: Con `?profile=`, `create instance of Phase "p"` seguito subito da `set Scenario_0.pathway = p` è rifiutato come `PROFILE_UNRESOLVED` «Cannot resolve metaclass for instance 'p'»: `describeForGuard` (`executor.ts`) legge `instanceof` dell'oggetto appena creato prima che il dispatch differito arrivi nello store. Misurato con `JjScriptService.execute` e lo scope di Jodie: senza pausa rifiutato, con 400 ms passa, in developer (nessun guard) passa. La proposta di C2 lo aggira con una pausa fra i passi (`f7fde9973`); ogni altro esecutore in consumer (console, `ScriptBlock`) lo incontra.
**Priority**: medium
**Found in**: P-2026-10-02-2215

## 2026-10-03 — ticket: i passi di uno script entro 450 ms diventano una voce di undo che non si annulla per intero
**Ticket**: Il reducer fonde un delta nella voce precedente quando arriva entro `U.UpdatingTimer * 1.5` (`isRelevantChangeCheck`), con il merge superficiale first-wins di R-UNDO-5. Misurato su «create ph1, put it inside Scenario_0, link it» senza pausa: una sola voce, un Ctrl+Z toglie ph1 e lascia il suo id nello slot `pathway` di Scenario_0, le pressioni successive non fanno nulla. C2 distanzia i passi; `ScriptBlock` (20 ms fra i comandi) è con ogni probabilità nella stessa condizione, non misurato.
**Priority**: medium
**Found in**: P-2026-10-02-2215

## 2026-10-03 — ticket: una proposta non può cambiare un elemento annidato dal Configurator
**Ticket**: JjScript trova i nomi solo fra le radici del modello (`findInstanceByName`, `instance.ts:117-120`). Un elemento annidato con «Add» del Configurator o del Data Manager (forma `addObject`, fuori da `model.objects`) non è raggiungibile per nome: la proposta lo dice in chiaro («"Phase_0" is inside another element, and changes to it can't be made from here yet.»). Un elemento annidato da un `set` di JjScript resta in `model.objects` (referto R) e quindi è raggiungibile: correzione del referto C2 §3.7, che includeva anche quello.
**Priority**: medium
**Found in**: P-2026-10-02-2215
**Detail**: docs/discovery/discovery_2026-10-02_168_c2_proposal.md

## 2026-10-03 — ticket: due forme del parser JjScript che Jodie deve rispettare
**Ticket**: Misurato sul parser: in `create instance of X nome` un nome senza virgolette sparisce in silenzio e l'elemento prende il nome automatico (`X`, `X2`…), così un `set` successivo che usa `nome` fallisce; `rename instance x to "y"` con le virgolette non si legge (serve `to y`). Il prompt di chat (C1) dovrebbe insegnare il nome tra virgolette nel `create` e senza nel `rename`. La proposta mostra una riga illeggibile come non applicabile.
**Priority**: low
**Found in**: P-2026-10-02-2215
**Detail**: docs/discovery/discovery_2026-10-02_168_c2_proposal.md

## 2026-10-03 — ticket: «Test in console mode» e «Source» sotto un messaggio con una proposta
**Ticket**: Sotto il messaggio che contiene una proposta il fruitore vede «Test in console mode» (`ChatMessages.tsx:182-190`) e «Source» (`MarkdownMessage.tsx:65-72`), che mostra lo script grezzo; l'interruttore smonta e rimonta la proposta (il suo esito resta nello store). Li copre la lane D, che li toglie in consumer (decisione dell'orchestratore nel GO di C2).
**Priority**: low
**Found in**: P-2026-10-02-2215
**Detail**: docs/discovery/discovery_2026-10-02_168_c2_proposal.md

## 2026-10-03 — ticket: un set di contenimento accetta un elemento esistente di un altro tipo
**Ticket**: Misurato in consumer: `set Scenario_0.pathway = Antonio` mette un Learner nello slot `pathway`, che è di tipo Phase, e riesce. Il controllo di C2 prima di «Apply» verifica il tipo solo per gli elementi che la proposta crea; per un elemento esistente decide il core, che non controlla il tipo. La conformità lo segnala solo alla rivalidazione.
**Priority**: low
**Found in**: P-2026-10-02-2215

## 2026-10-03 — merge: 168-proposal into feat/168-jodie-consumer
**Prompt**: `claude_2026-10-03_2348_prompt_merge_168-proposal.md` (P-2026-10-03-2348) — merge diretto (`lane-run merge --direct`) della lane C2 (J4: la proposta di Jodie come elenco leggibile con «Apply» e «Discard» in modalità consumer) nel trunk #168, secondo nell'ordine C1 → C2 → D.
**Files touched**: merge `c23bb0e5c` (3 commit di C2: referto `ae1978693`, codice `f7fde9973`, chiusura `224fc8da8`); conflitto su `docs/log-inbox/jodie-consumer.md` risolto per unione; tag `pre-168-proposal` su `e84d4b80a`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gate del worker sul merge: typecheck 14 (insieme della punta ricevente), typecheck:scripts, vitest (5600 test, 9 rossi all'import noti), build, check:agents, check:scripts verdi; sonda di C2 `_tmp_168_c2_verify` rieseguita sul trunk unito con C1 (porta 3047): 19/19.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri sulla lane (2026-10-03, voci 1-7); sul trunk unito la sonda della lane, non `npm run smoke` (fisso sulla 3000).
**Notes**: Il worker ha chiuso `blocked` solo per `check:docs` exit 1: stessi 5 errori della baseline del trunk (FAIL B su `docs/claude-code-log.md:245` e `:267`, FAIL D 74 entry su 40). Chiusura scritta a mano dall'orchestratore perché `go` rifiuta un merge bloccato.
**Prompt document name**: 2026-10-03 23:48

## 2026-10-02 — feat(#168): Jodie parla al fruitore senza strumenti da developer (J7, lane D)
**Prompt**: `claude_2026-10-02_2216_prompt_168_d_voice.md` (P-2026-10-02-2216) — nello stand-alone Jodie senza modalità di console, senza scheda «Run», senza gergo, senza Quick tip e senza «Source»; invito al provider; developer identico. Fase 1: referto `discovery_2026-10-02_168_d_voice.md` (`bc1d879bf`); GO di Juri del 2026-10-02 con le otto raccomandazioni del §0 adottate e i 9 file di codice confermati (Rule 19).
**Files touched**: `13ea8c0a5`: `Jodie/consumerVoice.ts` (nuovo), `Jodie/__tests__/consumerVoice.test.ts` (nuovo), `Jodie/Jodie.tsx`, `Jodie/JodieWindow.tsx`, `Jodie/JodieHeader.tsx`, `Jodie/ChatInput.tsx`, `Jodie/ChatMessages.tsx`, `Jodie/MarkdownMessage.tsx`, `NotificationWidget/NotificationWidget.tsx`; commit di chiusura: questa entry e la riga Status. Sonde e fixture `_tmp_168_d_*` non committate.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` output completo **14**, stesso insieme della baseline; build exit 0; vitest 45/45; record developer della sonda di Fase 1 identici byte per byte (`dev`, `dev-noprovider`).
**Out-of-scope changes**: no — i 9 file di codice confermati al GO; nessun CSS, `types/jodie.ts` intatto.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri del 2026-10-03 su `13ea8c0a5`, voci 1-7 (vite 3048, fixture `_tmp_168_d_setup.js`); due ritocchi chiesti, corretti da `f4e2254e9`; sonde su 3048: `_tmp_168_d_verify` 31/31, `_tmp_168_d_fixture` 8/8.
**Notes**: Testi in `consumerVoice.ts`, puro, banco 11/11 mutazioni uccise; banco sui componenti attraverso la sonda 4/4 (detect, Source, tip, selettore). Trovati in Fase 1 e inclusi: il backtick che passava a JjEL e «Test in console mode» sotto le risposte con codice. «Source» sparisce sotto ogni messaggio del fruitore, quindi anche sotto la proposta di C2.
**Prompt document name**: 2026-10-02 22:16

## 2026-10-03 — fix(#168): il menu dei provider segue le Impostazioni, l'invito è centrato
**Prompt**: rework di Fase 2 di `P-2026-10-02-2216` dopo la verifica visiva passata di `13ea8c0a5`: due ritocchi chiesti da Juri, il menu dei provider in testata fermo su «Configure a provider» dopo il salvataggio di una chiave con Jodie aperto, e il pulsante «Set up an AI provider» non centrato.
**Files touched**: `f4e2254e9`: `common/ProviderModelSelector.tsx`, `Jodie/JodieWindow.tsx`, `Jodie/ChatInput.tsx`, `Jodie/ChatMessages.tsx`. Sonda `_tmp_168_d_rework.ts`, non committata.
**Outcome**: ✅ completed
**Corregge**: 2026-10-02 22:16 (Fase 2, `13ea8c0a5`)
**Causa**: (d)
**Regressions**: no — `npx tsc --noEmit` output completo **14**, stesso insieme; build exit 0; vitest 45/45; sonde 11/11 (rework), 31/31, 8/8; record developer identici byte per byte alla Fase 1.
**Out-of-scope changes**: yes — `ProviderModelSelector.tsx`, decimo file fuori dalla lista del GO, approvato da Juri per questo rework (Rule 19); il difetto valeva anche per il developer.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri del 2026-10-03 su `f4e2254e9`, le 2 voci del rework (pulsante centrato, menu dei provider che segue le Impostazioni con Jodie aperto; vite 3048); sonda `_tmp_168_d_rework` 11/11 su 3048.
**Notes**: Misurato: salvare una chiave emette ai-provider-changed (17, uno per tasto) e mai ai-settings-changed, quindi l'ascolto del solo SETTINGS_CHANGED chiesto non bastava (mutazione A). Menu, invito, pallino e pulsante di invio ascoltano anche PROVIDER_CHANGED. Pulsante centrato da un `<div>`, nessuna regola CSS. Banco 3/3.
**Prompt document name**: 2026-10-02 22:16

## 2026-10-04 — merge: 168-voice into feat/168-jodie-consumer, e controllo finale del trunk #168
**Prompt**: `claude_2026-10-03_2352_prompt_merge_168-voice.md` (P-2026-10-03-2352) — merge diretto (`lane-run merge --direct`) della lane D (J7: Jodie senza strumenti da developer in modalità consumer) nel trunk #168, ultimo dell'ordine C1 → C2 → D; poi il controllo finale sul trunk completo.
**Files touched**: merge `3638bac6a` (4 commit di D: referto `bc1d879bf`, codice `13ea8c0a5` e `f4e2254e9`, chiusura `6ce5b02f1`); conflitto su `docs/log-inbox/jodie-consumer.md` risolto per unione; tag `pre-168-voice` su `0fdfda531`. Sonde rieseguite non committate (`_tmp_*`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gate del worker sul merge: typecheck 14 (insieme della punta ricevente), typecheck:scripts, vitest (5619 test, 9 rossi all'import noti), build, check:agents, check:scripts verdi. Controllo finale sul trunk completo, sonde di tutte le lane: C1 24/24, C2 19/19, D verify 31/31 e fixture 8/8, A verify 21/21 e drill 23/23 con il filtro delle righe ristretto a «Now looking at».
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri sulla lane D (2026-10-03, voci 1-7 e i due ritocchi); `npm run smoke` non applicabile qui (fisso sulla 3000), da eseguire sull'albero di feat/157 dopo l'integrazione.
**Notes**: Le sonde di A, scritte prima di D, davano 4 rossi sul trunk completo: il loro filtro `/looking at/` contava anche l'help per il fruitore di D («Explain what you are looking at»). Con il filtro ristretto a «Now looking at» 21/21 e 23/23: difetto della sonda, non del prodotto. `check:docs`: stessi 5 errori della baseline; chiusura scritta a mano dall'orchestratore.
**Prompt document name**: 2026-10-03 23:52
