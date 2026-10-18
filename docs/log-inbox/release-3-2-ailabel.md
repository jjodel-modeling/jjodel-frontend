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

## 2026-10-18 — merge: ai-row-label into alfonso-frontend-jjtl (P-2026-10-18-1648)
**Prompt**: `claude_2026-10-18_1648_prompt_merge_ai-row-label.md`, a direct merge by `lane-run merge --direct`, no session: `ai-row-label` at `12c75e586` into `alfonso-frontend-jjtl`, merge base `7cb3b9b27`, 4 commits on the branch side.
**Files touched**: merge `e74903e21`: 7 files from the branch side (`docs/log-inbox/release-3-2-ailabel.md`, `docs/prompts/claude_2026-10-18_1525_prompt_ai_settings_row_label.md`, `frontend/src/components/settings/AISettingsContent.tsx`, `frontend/src/services/AIProviderService.ts`, `frontend/src/services/__tests__/AIProviderService.test.ts`, `frontend/src/services/aiModelCatalog.ts`, `frontend/src/types/jodie.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e74903e21` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9364 tests in 382 files, 9 red at import, hooks 885; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Visual GO by Alfonso at 16:48 on the ai-row-label worktree (localhost:3005), same tree as the merge: rows show Connected / failure kind / Not tested / Set up, no model name. Trunk 3001 down, not re-checked.
**Notes**: Rollback tag `pre-ai-row-label` on `d0f4744b9` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-18-1648/result.json`.
**Prompt document name**: 2026-10-18 16:48
