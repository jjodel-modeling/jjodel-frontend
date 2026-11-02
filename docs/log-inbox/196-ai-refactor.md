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
