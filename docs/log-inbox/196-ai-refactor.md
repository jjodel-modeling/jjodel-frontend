# log-inbox — lane «196-ai-refactor»

Entries written by the lanes of the #196 AI provider refactor (front `ai-provider`, chat C-2026-11-02-1016), from L0 on.
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this
file. The active log is not touched by these lanes.

---

## 2026-11-02 — chore: #196, remove orphaned ProviderSelector and ProviderSettings (C-2026-11-02-1016)
**Prompt**: Juri in chat: delete `components/common/ProviderSelector.tsx` and `components/settings/ProviderSettings.tsx` (no importers, R-AI-5); `ProviderSettings.css` added on his yes. Also recorded: R-AI-6..12 (open items of the spec) and R-AI-13 (real-key Anthropic gate of L4 met, O-7 answered).
**Files touched**: the three deleted files (`41aeca1c7`); `docs/decisions.md` (`88d54aea7`, `bab041c50`); `docs/harness/fronts.json` (`d250586c3`, milestone 17); this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: `ProviderSettings.css` was outside the named files (asked, approved). `ProviderSelector.scss` stays: the live `ProviderModelSelector.tsx` imports it. Importer search with positive control; typecheck and build exit 0. `fronts.json` fix: f5f6cb510 opened the front without a milestone and turned laneTracking.test.ts red (caught by merge P-2026-11-02-1059). CLAUDE.md §16 still cites `<ProviderSelector>`; L6 rewrites §16.
**Prompt document name**: —

## 2026-11-02 — docs: #196 L0, AI layer discovery, SDK spike and frozen spec (P-2026-11-02-1020, P-2026-11-02-1055)
**Prompt**: #196 L0 in two lanes. P-2026-11-02-1020 phase 1: inventory of the AI layer (importers of `types/jodie.ts`, the ④ OCL contract, the plan's file lists) and a browser spike of the three SDKs; it stopped at the AM-8 ceiling after the GO (RC-51). P-2026-11-02-1055 phase 2, from its handoff: the frozen spec with corrections, transport table, keys, pins, measures and R-AI-1..5.
**Files touched**: `docs/discovery/discovery_2026-11-02_196_l0_ai_layer.md` (new, `712aae6dd`; «Answer in brief» added in the closure commit); `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md` (new, `ad209a6ad`); this inbox (new); the `Status:` lines of both prompts. `docs/decisions.md` R-AI-1..5 (`cc252b1ca`) is the chat's, not the lanes'.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Docs only, nothing in `frontend/`. Key-material scan of the spec: 0 hits over 2 values (positive control on the env file: 2). Q6 (Anthropic key, OpenAI credit) is a precondition of L4, not of L1. The spec records eight open items (O-1..O-8) for L1, L2 and L6. The phase 2 lane could not invoke `status-flip` (user-only skill).
**Prompt document name**: 2026-11-02 10:55

## 2026-11-02 — feat: #196 L1 lane 1/2, provider half of src/services/ai (P-2026-11-02-1320)
**Prompt**: #196 L1, lane 1 of chain-P-2026-11-02-1320: pin the three SDKs (R-AI-2), then `types.ts`, abstract `BaseProvider`, the OpenAI/Anthropic/Google providers (lazy SDK imports, Claude `test()` on `/v1/messages` max_tokens 1, `insufficient_quota` message), their tests and a four-mutation bench.
**Files touched**: `frontend/package.json`, `frontend/package-lock.json` (`d6c8a43d4`); `frontend/src/services/ai/` `types.ts`, `BaseProvider.ts`, `OpenAICompatibleProvider.ts`, `AnthropicCompatibleProvider.ts`, `GoogleCompatibleProvider.ts`, `__tests__/requestShaping.test.ts`, `__tests__/connectionTest.test.ts`, `__tests__/baseProvider.test.ts` (`d011234cf`); this inbox; the prompt's `Status:` line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Item 1 hard-stopped: npm install replaced the node_modules symlink with a real dir (now /tmp/nm196-l1-real-install, left to the chat). On Juri's GO: --package-lock-only here, shared node_modules filled --no-save from the main tree. Lock: 42 new, 2 changed (root, ws 8.22.1). Gap: vitest runs in node, so @google/genai loads its node export; browser wire is the L3 smoke. Ten files, rule 19 confirmed. Decisions (404 SERVER) and bench: d011234cf.
**Prompt document name**: 2026-11-02 13:20

## 2026-11-02 — feat: #196 L1 lane 2/2, persistent half of src/services/ai; L1 complete (P-2026-11-02-1321)
**Prompt**: #196 L1, lane 2 of chain-P-2026-11-02-1320: measure the R-AI-6 key precedence on today's code, then `ProviderConfigStore`, `FeaturePreferenceStore` (four migrations, same sentinels), `catalogCache` (24 h, key hash, direct fetch), `registry`, `index`, their tests, the app-unchanged and SDK-laziness gates and a four-mutation bench.
**Files touched**: `frontend/src/services/ai/` `config/ProviderConfigStore.ts`, `config/FeaturePreferenceStore.ts`, `catalog/catalogCache.ts`, `registry.ts`, `index.ts`, `__tests__/stores.test.ts`, `__tests__/migrations.test.ts`, `__tests__/catalogCache.test.ts`, `__tests__/registry.test.ts`, `__tests__/legacyKeyPrecedence.test.ts` (`6609dffa1`); this inbox; the prompt's `Status:` line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: L1 complete (lanes 1/2 and 2/2). R-AI-6: jjodie_provider_<name> is the only copy read; the blob is never adopted at load (object providers fail Array.isArray), so today dockWidth is lost on the next save: input for R-AI-9 at L2. Build tip vs a8f58436b: 19 of 3515 files differ, from the git defines only (control build identical). SDKs lazy, entry 8.25 kB gzip. Ten files, rule 19 confirmed. Lane 1 files untouched. Decisions, numbers, bench: 6609dffa1.
**Prompt document name**: 2026-11-02 13:21

## 2026-11-02 — merge: feat/196-l1-ai-module into staging (P-2026-11-02-1646)
**Prompt**: `claude_2026-11-02_1646_prompt_merge_feat-196-l1-ai-module.md`, a direct merge by `lane-run merge --direct`, no session: `feat/196-l1-ai-module` at `625d1214f` into `staging`, merge base `a8f58436b`, 7 commits on the branch side.
**Files touched**: merge `d2cd747a0`: 23 files from the branch side (`docs/log-inbox/196-ai-refactor.md`, `docs/prompts/claude_2026-11-02_1320_prompt_196_l1a_ai_providers.md`, `docs/prompts/claude_2026-11-02_1321_prompt_196_l1b_ai_stores_registry.md`, `frontend/package-lock.json`, `frontend/package.json`, `frontend/src/services/ai/AnthropicCompatibleProvider.ts`, `frontend/src/services/ai/BaseProvider.ts`, `frontend/src/services/ai/GoogleCompatibleProvider.ts`, and 15 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d2cd747a0` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12264 tests in 455 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no visual smoke: L1 is additive, no app file imports src/services/ai; merge gates 8/8 green (typecheck 0, vitest 12264 tests, 9 known import reds, build, check:docs/agents/scripts/addonly); lane 2 measured the app build identical to a8f58436b once the embedded git hash is neutralised; merge approved by Juri in chat C-2026-11-02-1311
**Notes**: Rollback tag `pre-feat/196-l1-ai-module` on `a8f58436b` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-1646/result.json`.
**Prompt document name**: 2026-11-02 16:46

## 2026-11-02 — feat: #196 L2, settings, Jodie and feature consumers on src/services/ai (P-2026-11-02-1916, P-2026-11-02-1930)
**Prompt**: #196 L2, one lane of 13 files (R-AI-10): settings surfaces, Jodie and status bar, feature consumers read registry, stores and catalog of src/services/ai; the old chat paths stay until L3. P-2026-11-02-1916 measured and committed group 1, then stopped at the context ceiling (RC-51); P-2026-11-02-1930 continued from its handoff, with the #179 correction, groups 2 and 3, gates, Playwright probe and the visual hard stop.
**Files touched**: `6a58c8bef` AIDisclaimer.tsx, ProviderModelSelector.tsx, AISettingsContent.tsx, AIAssistantSettings.tsx, ProviderConfigModal.tsx, services/ai/index.ts, services/ai/registry.ts, services/ai/__tests__/providerStatus.test.ts; `83fa06083` services/ai/BaseProvider.ts, services/ai/__tests__/connectionTest.test.ts, AISettingsContent.tsx, ProviderConfigModal.tsx; `1d100d6d7` Jodie.tsx, ChatInput.tsx, JodieWindow.tsx, StatusBarRightZone.tsx; `2d9f347d9` MappingSuggestionService.ts, DocumentationTab.tsx, SuggestedMappingsPanel.tsx; this inbox; the `Status:` lines of both prompts.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on each commit: typecheck exit 0, build exit 0, full vitest with the nine known import reds (on 83fa06083 and 1d100d6d7 two more each, load timeouts: laneRun/laneRunDirect and irCollapsedRender/irSelectionRing, all green alone); on 2d9f347d9 exactly the nine, 12273 tests passed. Probe `_tmp_196_l2_probe.ts` on 3197: 14/14, 0 page errors.
**Out-of-scope changes**: no. 17 files, above five: rule 19 confirmed by Juri for L2 as one lane (R-AI-10); BaseProvider.ts and connectionTest.test.ts named by P-2026-11-02-1930.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Juri's visual GO on port 3197 (chat C-2026-11-02-1311), overall on the 10-item checklist
**Notes**: Juri's yes covers the 9-row provider list (Llama, Copilot gone) and three unattended decisions: attachments follow the chat's model; ChatMessages.tsx unchanged (presentation, L6); mapping export label from the registry. Bridge, L3 deletes it: refreshLiveCatalog copies the live list into AI[p].versions. #179: test(modelId?) is on the chat's model again (1916 had it on the configured one). Dock width key jjodie_dock_width. R-AI-11 label was inverted, fixed.
**Prompt document name**: 2026-11-02 19:30

## 2026-11-02 — merge: feat/196-l2-settings-cutover into staging (P-2026-11-02-2338)
**Prompt**: `claude_2026-11-02_2338_prompt_merge_feat-196-l2-settings-cutover.md`, a direct merge by `lane-run merge --direct`, no session: `feat/196-l2-settings-cutover` at `4fb91f1db` into `staging`, merge base `4ecb408bb`, 7 commits on the branch side.
**Files touched**: merge `fe3d6552d`: 20 files from the branch side (`docs/log-inbox/196-ai-refactor.md`, `docs/prompts/claude_2026-11-02_1916_prompt_196_l2_settings_cutover.md`, `docs/prompts/claude_2026-11-02_1930_prompt_196_l2_continuation.md`, `frontend/src/components/Jodie/ChatInput.tsx`, `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/components/Jodie/JodieWindow.tsx`, `frontend/src/components/StatusBarRightZone.tsx`, `frontend/src/components/abstract/tabs/DocumentationTab.tsx`, and 12 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `fe3d6552d` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12273 tests in 456 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: visual GO by Juri on port 3197 (lane tree of feat/196-l2-settings-cutover, 10-item checklist, chat C-2026-11-02-1311); lane probe 14/14 with mocked providers; merge gates 8/8 green
**Notes**: Rollback tag `pre-feat/196-l2-settings-cutover` on `4ecb408bb` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-2338/result.json`.
**Prompt document name**: 2026-11-02 23:38

## 2026-11-03 — feat: #196 L3, chat consumers on src/services/ai, AIProviderService deleted (P-2026-11-03-0005, P-2026-11-03-0020, P-2026-11-03-1201)
**Prompt**: #196 L3, one lane in two phases (R-AI-14): phase 1 moves the four chat consumers onto src/services/ai and stops for Juri's real-key smoke; phase 2, after his GO, deletes `AIProviderService.ts` and its test and rewrites the catalog test. P-2026-11-03-0005 and P-2026-11-03-0020 each stopped at the context ceiling (RC-51); P-2026-11-03-1201 closed phase 2 from the handoff.
**Files touched**: `b73651997` services/ai/types.ts, AnthropicCompatibleProvider.ts, GoogleCompatibleProvider.ts, OpenAICompatibleProvider.ts, BaseProvider.ts, ai/__tests__/requestShaping.test.ts; `cc78e8e3f` ExplainModal.tsx, jjodieProvider.ts, AIMatcher.ts, DocumentationService.ts; `24db6dcc8` OpenAICompatibleProvider.ts, requestShaping.test.ts; `f68935ecd` requestShaping.test.ts; `9ae6c479f` aiModelCatalog.test.ts, deleted AIProviderService.ts and AIProviderService.test.ts; this inbox; the `Status:` lines of the three prompts.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `9ae6c479f`: typecheck exit 0; vitest 446 files passed, 9 red at import (the nine known), 12263 tests passed; build exit 0. Probe `_tmp_196_l3_probe.ts` under `lane-run probe` on 3199: 28/28 (also 28/28 on 24db6dcc8).
**Out-of-scope changes**: no. 13 code files, above five: rule 19 confirmed by Juri for L3 (R-AI-14, R-AI-18); OpenAICompatibleProvider.ts beyond R-AI-15 under R-AI-19.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Juri's visual GO on port 3198 and the chat's real-key run (chat C-2026-11-03-0001)
**Notes**: R-AI-15 signal to the SDKs; R-AI-16 smoke keys; R-AI-17 earlier-turn attachments; R-AI-18 Custom Base URL in BaseProvider.prepare; R-AI-19 no X-Stainless headers. Bridge kept: AI[p].versions read live by AISettingsContent.tsx:300 (L6). failureDisablesProvider: live copy untested (L6). Unattended decisions, coverage map, and Juri's Gemini «Unreachable» (a 503 read as network, gemini-3.7-flash overloaded; to verify): handoffs of P-2026-11-03-0020 and P-2026-11-03-1201.
**Prompt document name**: 2026-11-03 12:01

## 2026-11-03 — merge: feat/196-l3-chat-cutover into staging (P-2026-11-03-1226)
**Prompt**: `claude_2026-11-03_1226_prompt_merge_feat-196-l3-chat-cutover.md`, a direct merge by `lane-run merge --direct`, no session: `feat/196-l3-chat-cutover` at `eac1a989d` into `staging`, merge base `fa1546805`, 13 commits on the branch side.
**Files touched**: merge `c35ce731e`: 18 files from the branch side (`docs/decisions.md`, `docs/log-inbox/196-ai-refactor.md`, `docs/prompts/claude_2026-11-03_0005_prompt_196_l3_chat_cutover.md`, `docs/prompts/claude_2026-11-03_0020_prompt_196_l3_continuation.md`, `docs/prompts/claude_2026-11-03_1201_prompt_196_l3_phase2_continuation.md`, `frontend/src/components/ExplainModal.tsx`, `frontend/src/components/Jodie/console/providers/jjodieProvider.ts`, `frontend/src/jjtl/services/AIMatcher.ts`, and 10 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c35ce731e` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12263 tests in 455 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: merged staging c35ce731e: L3 mock probe 28/28 on port 3190 (lane-run probe, SMOKE_URL set), 0 page errors; Juri's visual GO on the L3 tree 2026-11-03
**Notes**: Rollback tag `pre-feat/196-l3-chat-cutover` on `fa1546805` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1226/result.json`.
**Prompt document name**: 2026-11-03 12:26

## 2026-11-03 — ticket: Kimi keys from platform.moonshot.ai always fail, the endpoint is hardcoded to api.moonshot.cn
**Ticket**: `frontend/src/services/ai/registry.ts:142` sends every Kimi request to `https://api.moonshot.cn/v1/chat/completions`. A key made on the international console (`platform.moonshot.ai`) is valid only on `api.moonshot.ai` and gets 401 on `.cn`, so the user reads «Invalid key» for a good key. The Base URL field is shown only for keyless providers, so the user cannot point Kimi elsewhere. Pre-existing: the old `types/jodie.ts` path hardcoded the same host. Measured in the chat's real-key run of #196 L3: one `.ai` key, 401 on `.cn`, a readable answer on `.ai` (that account was then suspended for no balance).
**Priority**: low
**Found in**: C-2026-11-03-0001

## 2026-11-03 — ticket: the GPT-4o and Pixtral seeds declare no image input
**Ticket**: `frontend/src/services/ai/registry.ts:41-43` (`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`) and `:74-75` (`pixtral-large-latest`, `pixtral-12b-2409`) set `vision` to false, though these models accept images. The attach-image button follows the chat model's capabilities (L2), so it stays hidden for them. Pre-existing: L1 copied the `.add(...)` rows of `types/jodie.ts` verbatim (static seeds). `BaseProvider.ts:51` already declares `gpt-4o` as `vision: true` for prefix matching, so the two tables disagree.
**Priority**: low
**Found in**: C-2026-11-03-0001

## 2026-11-03 — ticket: a Gemini 503 (model overloaded) shows as «Unreachable» in AI settings
**Ticket**: In Juri's visual check of #196 L3, Test connection on Gemini with the default `gemini-3.7-flash` showed «Unreachable» (NETWORK). The chat's Node run got a readable 503 «high demand» from the same model at the same time. `BaseProvider.classify` (`frontend/src/services/ai/BaseProvider.ts:290`) maps 5xx to SERVER («Provider error») and only a missing status to NETWORK. So in the browser, either `statusOf` (`:98`) does not find the status on the `@google/genai` error, or the 503 answer carries no CORS header and the fetch fails with no status. Not measured: run the Gemini test() in a browser against a 503 (real or routed) and read the thrown error's shape before choosing a fix.
**Priority**: low
**Found in**: P-2026-11-03-0020

## 2026-11-03 — refactor: #196 L4, AI proxy Worker surface deleted from the code (P-2026-11-03-1330)
**Prompt**: #196 L4, code part only (R-AI-20, R-AI-21): delete `getProxyBase`, `AI.proxy` and the proxy branch of `getEndpoint` in `types/jodie.ts`, the dead fetch path of `services/aiModelCatalog.ts` and their tests; prove the bundle no longer names the Worker host; probe with the Worker host routed and aborted.
**Files touched**: `d0d305e0d` types/jodie.ts, services/aiModelCatalog.ts, services/__tests__/aiModelCatalog.test.ts, deleted types/__tests__/aiProxyEndpoint.test.ts; this inbox; the `Status:` line of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d0d305e0d`: typecheck exit 0; build exit 0; vitest 445 files passed, 9 red at import (the nine known), 12241 tests passed (12263 - 22 deleted cases); dist files naming `jjodel-ai-proxy` 1 -> 0, `jjodel-notifications` 1 -> 1 (control).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe `_tmp_196_l4_probe.ts` under `lane-run probe` on 3196 (SMOKE_URL set): 30/30, 0 page errors, Worker route control 1 hit, 0 app requests to the Worker
**Notes**: Item 1 table (name -> live importers -> fate, search with a positive control, no live importer of a deleted name) in `~/.jjodel-lanes/P-2026-11-03-1330/handoff.md`. Kept: CATALOG_PROVIDERS, cachedModelsFor, capabilitiesFor, the three types and what cachedModelsFor reads. Registry cases now seed the cache via hashKey and catalogStorageKey. Still owed (R-AI-20): `cloudflare-worker/`, the `.gitignore` line and the CODEBASE-MAP paragraph, after Alfonso removes the deployment; branch unmerged.
**Prompt document name**: 2026-11-03 13:30

## 2026-11-03 — merge: feat/196-l4-proxy-removal into staging (P-2026-11-03-1430)
**Prompt**: `claude_2026-11-03_1430_prompt_merge_feat-196-l4-proxy-removal.md`, a direct merge by `lane-run merge --direct`, no session: `feat/196-l4-proxy-removal` at `74653f9a7` into `staging`, merge base `99b380f6f`, 4 commits on the branch side.
**Files touched**: merge `7816c57ec`: 7 files from the branch side (`docs/decisions.md`, `docs/log-inbox/196-ai-refactor.md`, `docs/prompts/claude_2026-11-03_1330_prompt_196_l4_proxy_removal.md`, `frontend/src/services/__tests__/aiModelCatalog.test.ts`, `frontend/src/services/aiModelCatalog.ts`, `frontend/src/types/__tests__/aiProxyEndpoint.test.ts`, `frontend/src/types/jodie.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7816c57ec` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12241 tests in 454 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: merged staging 7816c57ec: L4 probe 30/30 on port 3190 (SMOKE_URL set), 0 page errors, 0 requests to the AI proxy Worker; Juri chose to merge the code part now, Worker and folder removal later
**Notes**: Rollback tag `pre-feat/196-l4-proxy-removal` on `99b380f6f` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1430/result.json`.
**Prompt document name**: 2026-11-03 14:30

## 2026-11-04 — refactor: #196 L6, types/jodie.ts gone, AI layer consolidated in src/services/ai (P-2026-11-03-1445, P-2026-11-03-1446, P-2026-11-03-1447)
**Prompt**: #196 L6 in three chained lanes on `feat/196-l6-consolidation` (R-AI-23). Lane 1 (P-2026-11-03-1445): runtime readers of `types/jodie.ts` onto `src/services/ai` and the new UI-side `providerVisuals.ts`, L2 bridge deleted. Lane 2 (P-2026-11-03-1446): types to `components/Jodie/types.ts` and `types/documentation.ts`, `types/jodie.ts` and `services/aiModelCatalog.ts` deleted, tests carried, CHANGELOG. Lane 3 (P-2026-11-03-1447): `CLAUDE.md` §16, `docs/CODEBASE-MAP.md` §19, closure.
**Files touched**: lane 1 `e658131be` (providerVisuals.ts + its test), `5865308ef` (10 readers: AISettingsContent, AIAssistantSettings, ProviderConfigModal, ChatMessages, DocumentationService, DocumentationTab, Jodie, JodieHeader, JodieMinimized, ProviderModelSelector); lane 2 `8fa7e2f87` (25 files: 2 new, 4 deleted incl. types/jodie.ts and services/aiModelCatalog.ts, 19 modified), `3fe99ffc3` CHANGELOG.md; lane 3 `f0764c4f1` CLAUDE.md + AGENTS.md (root only regenerated), `cb0d2d77c` docs/CODEBASE-MAP.md §19.6; this inbox and the `Status:` lines of the three prompts.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Lane 1 on `5865308ef`: typecheck 0, build 0, vitest 12245 tests, 446/455 files (nine known import reds). Lane 2 on `8fa7e2f87`/`3fe99ffc3`: typecheck 0, build 0, vitest 12232 tests, 444/453 files (same nine; -13 tests explained in the handoff), dist files naming AIConfig/JodieConfig 1 -> 0. Lane 3: typecheck exit 0 (sanity, unchanged code), check:agents PASS, check:docs exit 0.
**Out-of-scope changes**: no. Above five files (45 across the chain: 12 + 26 + 7), all in the DOVE lists; rule 19 confirmed by Juri for L6 (R-AI-23). List in Files touched.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probes on port 3195 (SMOKE_URL set), 0 page errors: L2 14/14, L4 30/30, L6 13/13 on both lanes; L6b startup migrations 5/5 (mutant without `registry.load()` 2/5). Juri's visual check (lane 2 checklist, 9 items) still owed before the merge
**Notes**: Handoffs: `~/.jjodel-lanes/P-2026-11-03-1445/handoff.md`, `.../P-2026-11-03-1446/handoff.md`. Key unattended choice: `registry.load()` at module scope of Jodie.tsx keeps the four startup preference migrations once types/jodie.ts is gone. CHANGELOG [Unreleased]/Changed: AI runtime names unregistered from OCL/JjEL. Still owed: Juri's visual check, the Worker removal (R-AI-22), the merge into staging.
**Prompt document name**: 2026-11-03 14:47

## 2026-11-04 — merge: feat/196-l6-consolidation into staging (P-2026-11-04-1602)
**Prompt**: `claude_2026-11-04_1602_prompt_merge_feat-196-l6-consolidation.md`, a merge lane by `lane-run merge`: `feat/196-l6-consolidation` at `e7eacab7f` into `staging`, `--no-ff` of the explicit sha, merge base `b443faf2b`, 11 commits on the branch side, 0 on the trunk side besides the prompt `3948e41e0`.
**Files touched**: merge `c0e1e70dc`: 42 files from the branch side (AI layer consolidation of #196 L6: `types/jodie.ts` and `services/aiModelCatalog.ts` deleted, `components/Jodie/types.ts`, `types/documentation.ts`, `components/common/providerVisuals.ts` added, readers moved; `CLAUDE.md`, `AGENTS.md`, `docs/CODEBASE-MAP.md`, `docs/decisions.md`, `CHANGELOG.md`, this inbox, three prompts); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c0e1e70dc`: typecheck exit 0, no error; typecheck:scripts exit 0; vitest 12232 tests, 444/453 files, the nine known import reds (stated before the merge: trunk 12241/454, branch -9 tests and -1 file); hooks 967/21; build exit 0; check:docs 5/5; check:agents PASS; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Juri's visual GO on the l6 tree (lane 2's 9-item checklist, port 3195); chat probes on `464398d4e` via lane-run probe, port 3190: _tmp_196_l2 14/14, _tmp_196_l4 30/30, _tmp_196_l6 13/13, _tmp_196_l6b 5/5, 0 page errors
**Notes**: Zero conflicts, no union; probes R-AI-22/23 once, R-AI-24 absent. The governance yes for CLAUDE.md/AGENTS.md was Juri's, director of #196, not Alfonso's as the merge body says. The push was Juri's (`464398d4e`, origin/staging with release 3.1.1 `9dc6e3906` pulled in), not the lane's. Ticket owed: `9dc6e3906` moved the welcome key to `jjodel_welcome_3_1_1_seen`, `frontend/scripts/smoke/states.ts` sets only `_3_` and `_3_1_`; the l4 probe needed it set by hand.
**Prompt document name**: 2026-11-04 16:02
