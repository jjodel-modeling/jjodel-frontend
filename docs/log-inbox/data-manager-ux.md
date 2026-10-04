# log-inbox — lane «data-manager-ux» (#158)

Entries written by the #158 Data Manager UX lane while sessions share this tree (P9, parallel
lanes). Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this
order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-28 — feat(#158): Data Manager, Back, side panes, reference sections and summaries, closable neighborhood
**Prompt**: chat di Juri: branch per la issue #158 (field-test @tmaog, 5 punti sul Data Manager), piano e risoluzione in dettaglio. Referto: `discovery_2026-09-28_158_data_manager_ux.md` (`69cdf6586`).
**Files touched**: `frontend/src/components/abstract/tabs/`: `InstanceManagerTab.tsx` e `instanceManagerTab.scss` (`c25eb749d` P1, `f8c682f81` P2, `5c3384fef` P3, `9d3d559f4` P4, `a510b26d5` P5); `instanceTable.ts` e `__tests__/instanceTable.test.ts` (`9d3d559f4`); `__tests__/instanceManagerFl6.test.ts` e `__tests__/instanceManager10c.test.ts` (`a510b26d5`). Docs: il referto, questa inbox.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14**, l'insieme di §17, dopo ogni commit; vitest `src/components/abstract/tabs` + `src/jjform` 789 passati (776 + 13); `npm run build` exit 0. UI non esercitata a runtime.
**Out-of-scope changes**: yes — 6 file di codice, sopra la soglia di 5 (RC-11): i 5 del referto più `instanceManager10c.test.ts`, copia di non-regressione dell'asserto FL6 che P5 cambia, non elencata nel referto.
**Layer Impact Report**: not-required — nessun file di §3.2; `viewpoint/ir/` solo letto (`resolveIRView`, `resolveFormSpec`).
**Smoke visivo**: non eseguito — Playwright assente da `node_modules` di questo checkout; checklist in 7 passi nel referto §6.
**Notes**: Partial su P4: il riassunto sta nella sezione dei riferimenti (host), non dentro il campo di selezione, che è critical zone (`viewpoint/ir/widgets/`) e attende go-ahead (referto §7). Configurazione = `FormSpec.basic` del target, nessun flag nel metamodello. Banchi di mutazione: `referenceSummary` 9/10 (1 equivalente), asserti FL6 3/3. Il toggle del vicinato non è eseguito da nessun test (il tab non importa sotto node).
**Prompt document name**: 2026-09-28 (chat)

## 2026-10-01 — fix(#158): Back torna alla form che era a schermo; il click sulla riga selezionata apre e chiude il vicinato
**Prompt**: chat di Juri: i due seguiti chiesti da @tmaog nella verifica del 2026-09-29 (P3: Back da Antonio deve tornare a Scenario; P5: tutta la riga, non solo il chevron). Referto: `discovery_2026-10-01_157_158_tmaog_retest_followups.md` (`8ec6bf30a`), corsia C.
**Files touched**: `a48ac55c0`: `jjform/nav.ts`, `jjform/index.ts`, `jjform/__tests__/nav.test.ts`, `abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/InstanceManagerTab.tsx`, `abstract/tabs/__tests__/instanceManagerFl6.test.ts`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-28 17:05 (chat, corsia data-manager-ux)
**Causa**: (a)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14**, insieme della baseline; vitest `src/components/abstract/tabs` + `src/jjform` 796 passati; `npm run build` exit 0. UI non esercitata a runtime.
**Out-of-scope changes**: no — i 6 file dichiarati nel referto §4 e confermati prima di scrivere.
**Layer Impact Report**: not-required — nessun file di §3.1; `jjform/nav.ts` è puro, `NavStep` guadagna solo una proprietà opzionale (Rule 11).
**Smoke visivo**: non eseguito — né Playwright né Puppeteer in `node_modules`, nessun dev server; checklist consegnata in chat.
**Notes**: Il figlio inline entra nel path come passo attraversato (`passThrough`): il breadcrumb lo nomina, `backOf` lo salta; cliccato nel breadcrumb diventa una form (`standOn`). Banchi: `backOf` senza ciclo 1 rosso, `standOn` senza clear 2 rossi, `clickRow` ridotto a `selectOnly` 1 rosso (test a testo sorgente aggiornato). Causa (a): P3 del 2026-09-28 aveva scelto l'opposto.
**Prompt document name**: 2026-10-01 (chat)

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
