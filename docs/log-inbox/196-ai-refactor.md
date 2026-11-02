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
