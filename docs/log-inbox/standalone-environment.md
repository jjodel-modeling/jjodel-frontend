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
