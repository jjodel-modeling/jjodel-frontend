# log-inbox — lane «release-3-2-ailabel» (P-2026-10-18-1525)

Entries written by the AI settings row lane (front release-3-2) on branch `ai-row-label`, worktree
`jjodel-w-ailabel`. Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim
and in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-18 — feat(settings): AI rows show the model, the failure kind on the dot (P-2026-10-18-1525)
**Prompt**: Settings > AI rows: always show the active model, status on the dot only, a tooltip naming the failure kind persisted as `lastTestFailure`; every OpenAI-compatible test failure classified; drop the grey catalog summary.
**Files touched**: `frontend/src/components/settings/AISettingsContent.tsx`, `frontend/src/services/AIProviderService.ts`, `frontend/src/types/jodie.ts`, `frontend/src/services/aiModelCatalog.ts`, `frontend/src/services/__tests__/AIProviderService.test.ts` (edaccffb0)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Out of scope: `export` on `failureFromStatus` in aiModelCatalog.ts, so the prompt's reuse was possible. testGemini already set `failure` (via testWithCatalog). Row state gets inline `marginLeft: auto`: the removed models span was the flex spacer. Non-auth failures of DeepSeek/Mistral/Groq/Kimi/Ollama/Custom no longer disable the provider. Visual check owed to Alfonso before the merge (P8). Typecheck, build, 53/53 tests green.
**Prompt document name**: 2026-10-18 15:25

## 2026-10-18 — fix(settings): AI rows show the connection state, no model (P-2026-10-18-1525)
**Prompt**: Alfonso's correction after the visual check (16:45): no model name on the row head, it is chosen per feature; the right slot shows Connected / the failure kind / Not tested, text plus dot; drop the tooltip.
**Files touched**: `frontend/src/components/settings/AISettingsContent.tsx` (e8a6423b1)
**Outcome**: ✅ completed
**Corregge**: 2026-10-18 15:25
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Item 3 of the prompt asked for the model on the row; the visual check showed that a provider-level model misleads. activeModelLabel stays (replaced-model notice). Tooltip dropped: no persisted error message exists. FAILURE_TITLES (this lane's) renamed FAILURE_LABELS. Pre-existing: ProviderConfigModal sets lastTested on success without lastTestOk, so a stale false stays red. Visual check owed to Alfonso before the merge. Typecheck, build, 53/53 green.
**Prompt document name**: 2026-10-18 15:25
