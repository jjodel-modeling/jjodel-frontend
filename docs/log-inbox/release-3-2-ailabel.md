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
