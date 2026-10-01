# log-inbox — lane «standalone-environment» (#157)

Entries written by the #157 stand-alone/environment lane while sessions share this tree (P9,
parallel lanes). Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and
in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-28 — fix(#157): empty state del Configurator, New nascosto su read-only, raggruppamento per metamodello (R2/R4/R6)
**Prompt**: lavorare le corsie del piano di triage che non dipendono dalle risposte di @tmaog.
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/components/environment/configuratorTab.scss`, `frontend/src/components/envgen/steps/MetaclassesStep.tsx`, `frontend/src/components/envgen/steps/ProfilesStep.tsx`, `frontend/src/components/envgen/EnvGenWizardModal.scss`. Codice in commit separato (§6.4/P13); questa entry in inbox di corsia.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (d)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 5 file, tutti nel perimetro R2/R4/R6.
**Layer Impact Report**: not-required — nessun file di §3.1; solo view/shell + SCSS, nessun D/L, sync o persistenza.
**Smoke visivo**: non eseguito — fa parte di ciò che @tmaog ri-testerà.
**Notes**: R2: i casi «niente da mostrare» sono distinti (nessuna config / nessuna metaclasse marcata / profilo che nasconde tutto), e un `?profile=` che non risolve un profilo ora lo **dice** con un banner: era il caso silenzioso che faceva sembrare «hidden non nasconde». R4: sui read-only il New non è più renderizzato. R6: metaclassi e permessi raggruppati per metamodello. Fail-open del profilo non risolto reso visibile, non cambiato. Referto: discovery_2026-09-28_157_triage_feedback_tmaog.md.
**Prompt document name**: 2026-09-28 (chat)

## 2026-09-29 — feat(#157): stand-alone e Data Manager condividono il pannello di dettaglio (InstanceDetail)
**Prompt**: chat di Juri (2026-09-28), due screenshot di `Arco_0`: rendere consistenti lo stand-alone e il Data Manager e far navigare gli elementi nello stand-alone come nel Data Manager. Tre decisioni di Juri in chat: merge 158 in 157, `resolveTypePermission` com'è, Delete sui tipi `edit`. Referto: `discovery_2026-09-28_157_158_shared_instance_detail.md` (`53fbd30d4`).
**Files touched**: merge `ae2347d4c` (feat/158 in feat/157, log per unione). `1447e5860`: `abstract/tabs/InstanceDetail.tsx` (nuovo), `InstanceManagerTab.tsx`, `instanceManagerTab.scss`, `__tests__/instanceManager10c`, `10k`, `Fl6`, `Outline`. `2b212dd99`: `environment/ConfiguratorTab.tsx`, `configuratorTab.scss`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** (insieme §17); vitest tabs + jjform + environmentConfig 811 passati; `npm run build` exit 0. UI non esercitata a runtime.
**Out-of-scope changes**: yes — 9 file di codice, sopra la soglia di 5 (RC-11), dichiarati nel referto §2: l'estrazione tocca il tab, il suo foglio e i 4 test che ne leggono il sorgente.
**Layer Impact Report**: not-required — nessun file di §3.2; creazioni e cancellazioni via `applyCreate`, `appendValue`, `applyDelete`, già usati.
**Smoke visivo**: non eseguito — Playwright assente in questo checkout; checklist in 5 passi nel referto §4.
**Notes**: Pannello estratto verbatim, controllato (la navigazione resta all'host), eventi invece di dialoghi, `permissionOf` opzionale. Lo stand-alone passa a `IRForm host="manager"` e alla palette del Data Manager. Nuovo asserto FL6: il tab monta davvero il pannello (banco 3/3). Il Configurator non ha test che lo eseguano.
**Prompt document name**: 2026-09-28 (chat)

## 2026-10-01 — fix(#157): New per tipo nel modello del suo metamodello; il wizard dichiara il progetto non salvato e Done salva
**Prompt**: chat di Juri: stato di #157/#158 dopo il re-test di @tmaog del 2026-09-29, poi «implementiamo le modifiche segnalate». Decisioni in chat (referto §7): messaggio + «Create model» solo developer, Done salva, Save in topbar per tutti. Referto: `discovery_2026-10-01_157_158_tmaog_retest_followups.md` (`8ec6bf30a`).
**Files touched**: `6b7891bae`: `joiner/environmentConfig.ts`, `joiner/__tests__/environmentConfig.test.ts`, `environment/ConfiguratorTab.tsx`, `environment/configuratorTab.scss`. `dd5fc3663`: `envgen/steps/MetaclassesStep.tsx`, `envgen/steps/ProfilesStep.tsx`, `envgen/EnvGenWizardModal.tsx`, `pages/components/Navbar.tsx`, `pages/components/navbar.scss`, `common/libraries/__tests__/saveProject.test.ts`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (c)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14**, lo stesso insieme della baseline (diff vuoto); vitest environmentConfig 26, saveProject/lastSaved/projectsSaveDirty 46 passati; `npm run build` exit 0 dopo ogni commit. UI non esercitata a runtime.
**Out-of-scope changes**: yes — 10 file in due corsie; `saveProject.test.ts` non era nel referto §4: conta i chiamanti di `saveProjectWithFeedback` in Navbar, da 3 a 4.
**Layer Impact Report**: not-required — nessun file di §3.1 modificato; `createAdapter`, `deleteAdapter` e `createM1` solo chiamati.
**Smoke visivo**: non eseguito — né Playwright né Puppeteer in `node_modules`, nessun dev server; checklist consegnata in chat.
**Notes**: Causa del New inerte: `models[0]` per tutti i tipi, non R3. `modelsForType` risolve per metamodello; lista su tutti i modelli del tipo, New nel primo. Banco: senza il filtro `instanceof` 2/5 test nuovi rossi. Causa (c) anche per B: il copy «saved immediately» e nessuna scrittura del wizard accendeva `U.isProjectModified`.
**Prompt document name**: 2026-10-01 (chat)
