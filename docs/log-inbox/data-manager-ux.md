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
