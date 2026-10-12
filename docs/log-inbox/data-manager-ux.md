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

## 2026-10-12 — feat(#172): a reference appears once in the instance detail, as its section
**Prompt**: `claude_2026-10-10_1545_prompt_172_references_once.md`, full lane, director Juri (chat `C-2026-10-10-1540`): Phase 1 (report, then addendum A on the row's menu), Juri's decisions of 2026-10-12, Phase 2 in three steps (the pure rule, the section takes the gestures, the fields leave the form).
**Files touched**: Phase 1 `b9a9be322`, `372da459a`: `docs/discovery/discovery_2026-10-10_172_references_once.md`. Step 1 `3a7543c1e`: `frontend/src/jjform/refSlot.ts`, `jjform/index.ts`, `jjform/__tests__/refSlot.test.ts`. Step 2 `7fb4c2fb5`: `components/abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/instanceManagerTab.scss`. `eddc5b2ad`: `docs/lir/lir_2026-10-10_172_fields_leave_form.md`. Step 3 `6cc99ca73`: `components/editor-v2/viewpoint/ir/IRForm.tsx`, `InstanceDetail.tsx`, `abstract/tabs/__tests__/instanceManager10c.test.ts`, `instanceManagerOutline.test.ts`. Docs: this inbox, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-09-18 17:35 (#142: the reference sections were added beside the form's reference fields)
**Causa**: (a)
**Regressions**: unknown — measured clean: probe `MODE=after STEP=3` 92/92 twice, identical, no page error (both hosts, subject and inline child, a profile, an authored view; the 25 gestures of the BEFORE oracle leave the same raw arrays); `tsc` 14, the baseline set; vitest 7992 green, the nine known files red; build exit 0. Not measured: a host refusal under a heading and a broken-pointer row (neither was produced in the browser), the canvas edges after a write from the section (the same `formWrite` calls as the field's).
**Out-of-scope changes**: no — eight code files, above five: the eight of the report's §11.1, confirmed by Juri (rule 19): `refSlot.ts`, `jjform/index.ts`, `refSlot.test.ts`, `InstanceDetail.tsx`, `instanceManagerTab.scss`, `IRForm.tsx`, `instanceManager10c.test.ts`, `instanceManagerOutline.test.ts`. No host file, no widget.
**Layer Impact Report**: produced (`docs/lir/lir_2026-10-10_172_fields_leave_form.md`, `eddc5b2ad`, before the diff of `IRForm.tsx`; go-ahead by Juri, R-REF-2)
**Smoke visivo**: passato — probe `_tmp_172_probe.ts` on this tree's dev server (port 3172) 92/92 twice, read from the DOM; `scripts/smoke/run.ts` on the same server GREEN (12 passed, 0 failed, 3 skipped). Juri ran the nine items of the checklist in his own browser on this tree's server on 2026-10-12 (Data Manager, Configurator, the stand-alone link of profile «Edu»): 9/9, GO in chat `C-2026-10-10-1540`; before it the chat's independent probe, 18/18, no page error.
**Notes**: Decisions R-REF-1..6 (memo claude_2026-10-12_memo_172_references_once.md). Two declared differences from the field's oracle: a held target is not offered (L6); a 0..1 slot never gets a second target (C5). Found by the probe, fixed in step 2: the menu's scroll listener starts one frame late. No unit test of the section (it does not import under node): the probe is its measure. Reported, true: in Basic a form whose only Basic feature was a required reference prints «No fields in Basic».
**Prompt document name**: 2026-10-10 15:45

## 2026-10-12 — ticket: form field, a 0..1 reference ends with two targets after an unset and a «New … & link»
**Ticket**: `IRFormField` reads and writes position 0 of a single-valued reference (`IRFormField.tsx:168`, `:403`), and the hosts' `createAndLink` appends (`ConfiguratorTab.tsx:315`, `InstanceManagerTab.tsx:2319`). After an unset the slot is `[HOLE]`; «New … & link» makes it `[HOLE, X]`; the field then shows «(empty)» and a pick writes `[Y, X]`: two targets in a 0..1 slot with three plain gestures (probe arms C3-C5 of the BEFORE run). #172 takes the reference fields out of the instance detail, whose section writes at the row's raw index, so no mount of the form reaches this today. Not fixed at the source: the field's position 0, and `createAndLink` appending after a hole.
**Priority**: low
**Found in**: P-2026-10-10-1545
**Detail**: docs/discovery/discovery_2026-10-10_172_references_once.md

## 2026-10-12 — ticket: the chip picker of a multi-valued reference offers a target the slot already holds
**Ticket**: the picker `IRFormField` mounts for the chip input takes the candidates unfiltered (`IRFormField.tsx:505`, `options={getOptions()}`), while `ListWidget` filters them with `assignableOptions` (`ListWidget.tsx:74`): picking a target that is already linked appends it a second time (probe arm L6 of the BEFORE run, `[L1, HOLE, L3, L4, L1]`). #172 takes the reference fields out of the instance detail, and its «Link existing» does not offer a held target, so no mount of the form reaches the chip picker for a reference today. The widget path is not fixed.
**Priority**: low
**Found in**: P-2026-10-10-1545
**Detail**: docs/discovery/discovery_2026-10-10_172_references_once.md

## 2026-10-12 — ticket: under a profile, «Link existing <Type>» opens an empty picker when the profile filters every candidate
**Ticket**: in the instance detail the foot of a reference section offers «Link existing <Type>» whenever the slot may take a link, without asking whether a candidate is left. Measured under the profile «Edu» (Badge `read`) on the stand-alone page, on `Session_0.badges`, an aggregation holding `B1` while a second Badge `B2` is free: the control is there and its picker prints «No Badge matches», no candidate. Controls of the same run: with no profile the picker offers `B2`; on the plain reference `learners` (target type `read`) the profile filters nothing and the four Learners are offered. The filter is `offerForProfile` (`formPermissions.ts:101-109`: into a slot that re-fathers, only free elements of an `edit` class). Where the measure is: arms B1, B2, B3 of the lane's probe `_tmp_172_probe.ts` (`ONLY=badges MODE=after`, gitignored), run 17 of `~/.jjodel-lanes/P-2026-10-10-1545/probe-_tmp_172_probe.log`. Read, not measured: before #172 the form field's picker took its candidates through the same filter (`IRForm.tsx`, its `offer`), so it would have opened empty too; the BEFORE fixture had no aggregation. Not changed here.
**Priority**: low
**Found in**: P-2026-10-10-1545
