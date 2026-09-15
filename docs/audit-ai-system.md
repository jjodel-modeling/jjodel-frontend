# AI System Audit — post-merge 1b9dc7d0c

**Date:** 2026-03-27
**Merge:** `1b9dc7d0c` (Merge branch 'staging' into dam_dev)
**Auditor:** Claude Code

---

## Files modified by merge

| File | Changes | Breaking? |
|------|---------|-----------|
| `frontend/src/api/api.ts` | Removed `persistance` static field; replaced `process.env['JODEL_PERSISTANCE']` with `U.env('JODEL_PERSISTANCE')`; changed `console.log` to `console.trace` for API responses; added `U` import | **Compatible** — `U.env()` is the Vite-safe replacement for `process.env` |
| `frontend/src/components/editors/Broker.tsx` | Replaced `IoT.client` direct access with `IoT.init()` lazy initialization; all `IoT.client.*` calls changed to local `client` variable | **Compatible** — same API, safer initialization |
| `frontend/src/types/jodie.ts` | **Not modified** by merge | N/A |
| `frontend/src/ai/` | **Directory does not exist** | N/A |

**Summary:** The merge brought infrastructure fixes (Vite env access, IoT init pattern). No AI-specific changes were introduced by this merge commit.

---

## Components using AI system

### Architecture Overview

All AI calls flow through a centralized pattern:

```
UI Components → Service Layer → AIProviderService → fetch() with AI.endpoint/proxy
                                                    ↑
                                              jodie.ts (AI, AIConfig, JodieConfig)
```

### Component Inventory

| Component | Pattern Used | Aligned? | Notes |
|-----------|-------------|----------|-------|
| `services/AIProviderService.ts` | Direct `fetch()` with `AI.*` endpoints | **YES** | Fixed 2026-03-27: proxy → getEndpoint() |
| `services/DocumentationService.ts` | Delegates to `AIProviderService.chat()` | **YES** | Clean delegation |
| `components/Jodie/Jodie.tsx` | Delegates to `AIProviderService.chat()` | **YES** | Uses `AIConfig.get()`, `JodieConfig.getEnabledProviders()` |
| `components/ExplainModal.tsx` | Direct streaming via `AI.Claude.getEndpoint()` | **YES** | Correctly uses `getEndpoint()` |
| `jjtl/services/AIMatcher.ts` | Delegates to `AIProviderService.chat()` | **YES** | Clean delegation |
| `jjtl/services/MappingSuggestionService.ts` | Delegates to `AIMatcher` | **YES** | No direct AI calls |
| `components/abstract/tabs/DocumentationTab.tsx` | Delegates to `DocumentationService` | **YES** | Uses `AIConfig.getPreferred('documentation')` |
| `components/Jodie/JodieWindow.tsx` | Config management only | **YES** | No AI calls — position/size persistence |
| `components/Jodie/JodieHeader.tsx` | UI only | **YES** | Reads `JodieConfig` for display |
| `components/Jodie/SettingsModal.tsx` | Uses `AIProviderService` for testing | **YES** | Test connection flow |
| `pages/settings/ProviderConfigModal.tsx` | Uses `AIProviderService` for testing | **YES** | Provider config UI |
| `components/Settings/AISettingsContent.tsx` | Config UI only | **YES** | Reads `AIConfig`, `JodieConfig` |
| `components/common/ProviderSelector.tsx` | UI only | **YES** | Uses `AIConfig`, `JodieConfig` |
| `jjtl/views/SuggestedMappingsPanel.tsx` | Delegates to `MappingSuggestionService` | **YES** | No direct AI calls |

**Result:** 14/14 components are correctly aligned. Issues #1 and #2 fixed on 2026-03-27.

---

## Endpoint consistency

### Centralized endpoints (jodie.ts)

All provider endpoints are defined once in `types/jodie.ts`:

| Provider | Endpoint | Proxy? |
|----------|----------|--------|
| GPT | `https://api.openai.com/v1/chat/completions` | No — supports CORS |
| Claude | `https://api.anthropic.com/v1/messages` | Yes — `/v1/anthropic/messages` |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | No |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/models` | Yes — `/v1/gemini` |
| Mistral | `https://api.mistral.ai/v1/chat/completions` | No |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | No |
| Kimi | `https://api.moonshot.cn/v1/chat/completions` | No |
| Ollama | `http://localhost:11434/v1/chat/completions` | No |

### Proxy infrastructure (jodie.ts:148-156)

```
Production: https://jjodel-ai-proxy.alfonso99.workers.dev + proxy path
Local:      http://localhost:8787 + proxy path
```

The `AI.getEndpoint()` method correctly selects based on `window.location.hostname`.

### Files with hardcoded URLs

| File | URL | Via proxy? | Issue? |
|------|-----|-----------|--------|
| `types/jodie.ts:148-149` | Proxy base URLs | N/A — this IS the central config | No |
| `types/jodie.ts:305-312` | All provider endpoints | N/A — central config | No |
| `NotificationWidget.tsx:16` | `https://jjodel-notifications.alfonso-pierantonio.workers.dev` | No | **Separate service** — not AI related |
| `ProviderConfigModal.tsx:176` | `http://localhost:11434` | No | Placeholder text only |
| `AISettingsContent.tsx:299` | `https://api.example.com/...` | No | Placeholder text only |
| `forEndUser/Try.tsx:124` | `https://api.github.com/...` | No | Bug report — not AI related |

**Result:** No hardcoded AI endpoint outside `jodie.ts`. All consumer code references `AI[provider].endpoint` or `AI[provider].getEndpoint()`.

---

## Issues found

### Issue #1 (HIGH) — Claude proxy URL used as raw path suffix — FIXED 2026-03-27

**Location:** `AIProviderService.ts` lines 97, 648

**Fix:** Replaced `AI.Claude.proxy as string` with `AI.Claude.getEndpoint()` in both `chatClaude()` and `testClaude()`.

### Issue #2 (HIGH) — Gemini proxy URL also missing base — FIXED 2026-03-27

**Location:** `AIProviderService.ts` lines 328, 814

**Fix:** Replaced `AI.Gemini.proxy` with `AI.Gemini.getEndpoint()` in both `chatGemini()` and `testGemini()`.

### Issue #3 (LOW) — Inconsistent endpoint resolution patterns

Three different patterns exist in `AIProviderService.ts`:

| Pattern | Used for | Correct? |
|---------|----------|----------|
| `AI.Claude.proxy as string` | Claude | **NO** — missing base URL |
| `` `${AI.Gemini.proxy}/...` `` | Gemini | **NO** — missing base URL |
| `AI[provider].endpoint` | GPT, DeepSeek, Mistral, Groq, Kimi | **YES** — direct endpoints |
| `baseUrl \|\| AI.Ollama.endpoint` | Ollama | **YES** — configurable |

Should standardize to `AI[provider].getEndpoint()` for all providers.

### Issue #4 (INFO) — Commented-out legacy code in jodie.ts

Lines 604-652, 698-732 contain large blocks of commented-out functions (`supportsVision`, `supportsPDF`, `supportsAttachments`, `providerNeedsProxy`, `getModelInfo`, `getModelCapabilities`). These are now methods on `AI` and `AIVersion` classes. Dead code should be removed.

### Issue #5 (INFO) — Duplicate model definitions

`AI.Llama` defines models (e.g., `llama-3.3-70b-versatile`) that are also listed under `AI.Groq`. This is intentional (Groq hosts Llama models) but could cause confusion in UI.

---

## Recommended fixes

### Priority 1 — Fix proxy URL resolution (Issues #1, #2)

**AIProviderService.ts lines 97, 648:** Replace:
```typescript
const proxyUrl = AI.Claude.proxy as string;
```
With:
```typescript
const proxyUrl = AI.Claude.getEndpoint();
```

**AIProviderService.ts lines 328, 814:** Replace:
```typescript
const proxyUrl = `${AI.Gemini.proxy}/${model}/generateContent?key=${apiKey}`;
```
With:
```typescript
const proxyUrl = `${AI.Gemini.getEndpoint()}/${model}/generateContent?key=${apiKey}`;
```

### Priority 2 — Standardize endpoint access

Audit all `AI[provider].endpoint` direct accesses in `AIProviderService.ts` and replace with `AI[provider].getEndpoint()` for consistency. This ensures any future provider that needs proxy routing will work automatically.

### Priority 3 — Remove dead code

Clean up commented-out blocks in `jodie.ts` (lines 604-652, 698-732). These functions have been replaced by class methods.

---

## Appendix: Merge scope

The merge `1b9dc7d0c` brought 80+ commits from staging, primarily:
- Vite migration fixes (`process.env` → `U.env()`)
- IoT client initialization (`IoT.init()`)
- MegamodelView (new React Flow-based view)
- Tab system refactoring
- Properties panel redesign
- JjTL syntax updates (`:=`, `where`, multi-source)
- UI theme unification

**None of these commits modified the AI provider system.** The proxy bugs pre-date this merge.
