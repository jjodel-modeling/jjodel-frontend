# log-inbox — lane «data-manager-ux» (#158)

Entries written by the #158 Data Manager UX lane while sessions share this tree (P9, parallel
lanes). Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this
order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-04 — fix(#173): durante un drill-in testata e Delete agiscono sull'elemento a schermo
**Prompt**: chat di Juri: «fix issue #173» (label `auto`). La issue: durante un drill-in la testata della form nomina la riga selezionata e il suo Delete cancella la riga, non l'elemento a schermo; Data Manager e Configurator (stesso `InstanceDetail`).
**Files touched**: `88b295f6d`: `abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/__tests__/instanceManagerFl6.test.ts`, `jjform/nav.ts`, `jjform/index.ts`, `jjform/__tests__/nav.test.ts`. Docs: questa inbox.
**Outcome**: ✅ completed
**Corregge**: 2026-08-31 19:30 (PROMPT_FL6_manager_layout.md)
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, l'insieme della baseline; vitest `src/jjform` + `src/components/abstract/tabs` + `src/components/environment` 829/829; `npm run build` exit 0; probe Playwright 14/14.
**Out-of-scope changes**: yes — la issue cita solo `InstanceDetail.tsx`; in più `jjform/nav.ts`, `jjform/index.ts`, `jjform/__tests__/nav.test.ts` (la guarigione del breadcrumb come puro testabile, schema di `a48ac55c0`) e `instanceManagerFl6.test.ts` (fissava alla lettera `openDelete(subjectId)`, il difetto). 5 file di codice, alla soglia.
**Layer Impact Report**: not-required — nessun file di §3.1; solo view (`abstract/tabs/`) e un puro in `jjform/nav.ts`; nessun D-layer, sync o persistenza.
**Smoke visivo**: passato — probe `_tmp_173_verify.ts` sul dev server di questo albero (127.0.0.1:3001) 14/14, screenshot del drill-in guardato; `npm run smoke` non eseguito (punta a :3000, spento).
**Notes**: Testata (nome, permesso, Delete) su `formSubjectId`, come il corpo. `survivorOf` (puro): morto l'elemento a schermo, la strada si taglia al primo passo morto e fa Back da li' (salta i pass-through); applicato dallo store perche' i delete arrivano differiti. Banco 7/7. Probe rossa sul codice pre-fix («Delete Scenario_0?» sopra la form di Bruno). L'effetto di guarigione non gira in nessun test unitario (InstanceDetail non importa sotto node): lo copre la sola probe.
**Prompt document name**: 2026-10-04 (chat)

## 2026-10-04 — ticket: Data Manager, durante un drill-in la barra «Add» crea figli nella riga selezionata
**Ticket**: la barra «Add <Child>» sotto la form legge ancora `subjectId` (`childSlots` e `onCreate(child.of, subjectId, child.key)` in `InstanceDetail.tsx`): sulla form di Bruno (Learner, senza figli) compare «pathway Phase [1/*] + Add Phase», e il click creerebbe una Phase dentro Scenario_0. Stessa famiglia di #173, fuori dal suo perimetro (la issue nomina testata e Delete). Visto nello screenshot della probe `_tmp_173_verify.ts`, non cliccato.
**Priority**: medium
**Found in**: C-2026-10-04-1135

## 2026-10-04 — fix(#173): la barra «Add» segue l'elemento a schermo e la sua cardinalita'
**Prompt**: chat di Juri, dopo il primo fix della #173: sulla barra «Add» «se non permesso dalla cardinalità del containment non permettere di aggiungere elementi con il crea»; ok alla pubblicazione in staging; se tutto confermato chiudere la issue con un riepilogo.
**Files touched**: `a1f3cd5ca`: `abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/__tests__/instanceManagerFl6.test.ts`, `abstract/tabs/__tests__/instanceManagerOutline.test.ts`, `environment/ConfiguratorTab.tsx`. Docs: questa inbox.
**Outcome**: ✅ completed
**Corregge**: 2026-08-30 15:00 (PROMPT_12bc_multiselect_recursion.md)
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, l'insieme della baseline; vitest `src/jjform` + `src/components/abstract/tabs` + `src/components/environment` 830/830; `npm run build` exit 0; probe 25/25 due volte, con il per contrasto di uno slot illimitato che prende due create di fila.
**Out-of-scope changes**: yes — `environment/ConfiguratorTab.tsx`, fuori dal testo della #173: il guard delle create in volo sta nell'host che crea diretto; e `instanceManagerOutline.test.ts`, che fissava alla lettera `onCreate(child.of, subjectId, ...)`. 4 file di codice.
**Layer Impact Report**: not-required — nessun file di §3.1; view (`abstract/tabs/`, `environment/`), nessun D-layer, sync o persistenza.
**Smoke visivo**: passato — probe `_tmp_173_verify.ts` sul dev server di questo albero (127.0.0.1:3001) 25/25 due volte, screenshot guardati; `npm run smoke` non eseguito (punta a :3000, spento).
**Notes**: Barra (forma, conteggi, permesso, owner) su `formSubjectId`: il gate `addChildReason` e' la cardinalita' dello slot a schermo. Misurato: il doppio click su uno slot 0..1 del Configurator lasciava [2/1] anche rileggendo lo store al click (lo store e' in ritardo); `createIn` conta le create in volo per `owner:slot` (2 s). DM salvo: dialog modale. Banco 4/4. Il conteggio in volo non gira in nessun test unitario: lo copre la probe.
**Prompt document name**: 2026-10-04 (chat)

## 2026-10-04 — ticket: Configurator, il doppio click su «New … & link» di un riferimento 0..1 collega due target
**Ticket**: nel Configurator `createAndLink` crea il target e appende il puntatore senza ricontrollare la cardinalita' del riferimento: lo store e' in ritardo, quindi un doppio click su «New Learner & link» del riferimento `mentor` (0..1) lascia 2 valori (probe `_tmp_173_verify.ts`, misura M1). Stessa causa del guard `createIn` di `a1f3cd5ca`, ma su un riferimento e non su un contenimento: fuori dal perimetro chiesto. Il Data Manager e' salvo (draft modale).
**Priority**: medium
**Found in**: C-2026-10-04-1135
