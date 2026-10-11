# log-inbox — lane «standalone-environment» (#157)

Entries written by the #157 stand-alone/environment lane while sessions share this tree (P9,
parallel lanes). Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and
in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-04 — fix(#157): difetti di chiusura, shell senza ricarica, delete e spostamenti secondo il profilo (passo A)
**Prompt**: chat di Juri: «Risolvi i difetti trovati durante 157, dopodiché chiudi 157»; GO sul passo A (8 file, regola 19), passo B (form IR, critical zone) dopo, con GO a parte. Referto: `discovery_2026-10-04_157_closing_defects.md` (`c6975a8af`).
**Files touched**: `c6975a8af` (referto); `04d04e100`: `pages/components/Dashboard.tsx`, `components/StatusBar.tsx`, `environment/ConfiguratorTab.tsx`, `joiner/environmentConfig.ts`, `joiner/__tests__/environmentConfig.test.ts`, `jjscript/executor/permissionGuard.ts`, `jjscript/executor/executor.ts`, `jjscript/executor/__tests__/permissionGuard.test.ts`. Fuori dal repo: commento #166 (permessi per campo), issue #170 e #171.
**Outcome**: ✅ completed
**Corregge**: 2026-10-01 23:02
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` **14**, stesso insieme di prima; build exit 0; vitest 92/92; banco delle mutazioni 11/11 uccise; sonda 20/20 due volte (rossa su `705502f0f`); sonda R5 R0-R10 PASS.
**Out-of-scope changes**: no — 8 file, sopra la soglia di 5, elencati e approvati da Juri prima del codice (regola 19).
**Layer Impact Report**: not-required — nessun file di §3.1; il form IR non è toccato (passo B).
**Smoke visivo**: passato — `npm run smoke` GREEN 12/12; sonda Playwright `_tmp_157_close_verify.ts` 20/20 con screenshot; verifica visiva di Juri non eseguita.
**Notes**: Corregge anche R5 (2026-10-01, chat): misurato solo developer→consumer con ricarica. Fuori da #157 e aperta come #171: il delete JjScript lascia i contenuti con un father inesistente (`LValue` non ha figli). La sonda R5 fallisce F3 per lo shim `__name` mancante, non per il codice. Resta il passo B: form IR (picker su tipi hidden, picker di contenimento che sposta elementi read, campi tipati da classi hidden), poi #157 si chiude.
**Prompt document name**: 2026-10-04 (chat)

## 2026-10-04 — ticket: «Reassign all to» e «Clear the references» scrivono nei referrer read
**Ticket**: Nel Configurator con un profilo, la conferma di cancellazione toglie dalle liste e dal piano i referrer di tipo hidden (`restrictDeleteForProfile`, `04d04e100`), ma un referrer di tipo `read` resta: «Reassign all to» gli scrive il nuovo bersaglio e «Clear the references» gli lascia un buco nello slot. Sono modifiche a un elemento che il profilo non può cambiare, fatte da una scelta esplicita del fruitore. Da decidere se offrire le due opzioni solo quando ogni referrer è `edit`. Il delete semplice toglie comunque il puntatore (integrità del core, R-DEL-4).
**Priority**: low
**Found in**: C-2026-10-04-0605
**Detail**: docs/discovery/discovery_2026-10-04_157_closing_defects.md

## 2026-10-06 — fix(#157): il form IR segue il profilo stand-alone (passo B)
**Prompt**: chat di Juri: passo B dei difetti di chiusura di #157, GO sulla Fase 2 il 2026-10-04 (6 file, regola 19); il 2026-10-06 «commita gli step completati ed integrali nello stage». Referto: `discovery_2026-10-04_157_step_b_ir_form_profile.md` (`5c4b7565b`).
**Files touched**: `a15298e79`: `editor-v2/viewpoint/ir/formPermissions.ts` (nuovo), `ir/__tests__/formPermissions.test.ts` (nuovo), `ir/IRForm.tsx`, `ir/IRFormField.tsx`, `ir/widgets/ListWidget.tsx`, `abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/__tests__/instanceManager10c.test.ts`, `abstract/tabs/__tests__/instanceManagerOutline.test.ts`, `environment/ConfiguratorTab.tsx`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` output completo **14**, stesso insieme della baseline; build exit 0; vitest 42 file / 1169 test; banco delle mutazioni 8/9 uccise; sonda `_tmp_157_b_verify.ts` 17/17, con i controlli developer (C.D2.2, C.D3d, C.D3e) invariati.
**Out-of-scope changes**: yes — 9 file, sopra la soglia di 5: i 6 del piano (referto §6) più i letterali dei test sorgente 10c e Outline e `ConfiguratorTab.tsx` (senza, il Configurator developer perdeva i candidati bound: C.D3d rosso). Dichiarati il 2026-10-04, committati su richiesta di Juri del 2026-10-06.
**Layer Impact Report**: produced — in chat il 2026-10-04, con la richiesta di GO: view in critical zone (`viewpoint/ir/`), nessun D-layer, L-layer, sync o persistenza.
**Smoke visivo**: passato — `npm run smoke` GREEN 12/12; sonda Playwright `_tmp_157_b_verify.ts` 17/17; verifica visiva di Juri non eseguita (script `_tmp_157_b_setup.js` pronto).
**Notes**: Il form IR prende un `permissionOf` opzionale: niente campi tipati da classi hidden, nessun candidato hidden, nei contenimenti solo elementi `edit` liberi, valori non `edit` in un contenimento bloccati. Senza profilo restituisce l'input per identità. M9 (guardia `''`) sopravvive: intento dichiarato. Residuo non misurato: un valore di sottotipo hidden in un riferimento tipato da un supertipo visibile mostra ancora il nome.
**Prompt document name**: 2026-10-04 14:53
