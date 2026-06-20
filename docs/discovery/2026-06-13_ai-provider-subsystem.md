# AI Provider Subsystem — Discovery (2026-06-13)

> Phase 1 / read-only. No source modified. All paths verified by grep on the working
> tree (branch `alfonso-frontend-jjtl`). File:line references are accurate as of this
> session; line numbers can drift on later edits.

---

## A. Architecture overview

- **Central service**: `frontend/src/services/AIProviderService.ts` (1128 lines).
  Public surface (all `static`):
  - `chat(message: string, provider: TAIProvider, conversationHistory: ChatMessage[] = [], projectContext?: string, images?: ChatImage[], documents?: ChatDocument[], model?: string): Promise<string>` — `:22`
  - `testConnection(provider: TAIProvider): Promise<{ success: boolean; error?: string }>` — `:619`
  - Everything else is `private`: per-provider `chatClaude/chatOpenAI/chatDeepSeek/chatGemini/chatMistral/chatGroq/chatKimi/chatOllama` (`:94…:614`), per-provider `testClaude…testOllama` (`:661…:1069`), `buildClaudeContent/buildOpenAIContent/buildGeminiParts/buildMistralContent`, and the credential-coherence helpers `DISTINCTIVE_KEY_PREFIXES` / `EXPECTED_KEY_PREFIX` / `providerLabel` / `validateKeyCoherence` (`:1077…:1125`).

- **How `chat()` picks endpoint / headers / auth** (`:31-89`):
  1. `config = AIConfig.get(provider)`; throw if missing / `!config.isConfigured()`.
  2. `validateKeyCoherence(provider, config)` — pre-send, no network (see §C).
  3. Resolve `effectiveModel`: `model` param → `config.model`, run through `resolveLegacyModelId`, then guard with `isForeignModel` (falls back to provider's own model, else first registry key).
  4. `systemPrompt = PromptService.getRendered('chat', context)`.
  5. `switch (provider)` dispatches to the per-provider `chatXxx` method.
  - **Note**: `AIProvider.Custom` has **no case** in the `chat()` switch (nor in `testConnection()`), so a configured Custom provider hits `default: throw "Unsupported provider"`. Custom is effectively non-functional for chat today.

- **Per-provider endpoint / auth in `chat()`** (endpoints declared in `types/jodie.ts:369-376`, proxy in `:366-367`):

  | Provider | `chat()` fetch target | Auth | Routed via proxy? |
  |---|---|---|---|
  | Claude | `AI.Claude.endpoint` = `https://api.anthropic.com/v1/messages` (`:121`) | `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true` | **No** — direct (relies on the dangerous-direct-browser header) |
  | GPT | `AI.GPT.getEndpoint()` (`:220`) | `Authorization: Bearer` | **No** — `AI.GPT.proxy` is never set, so `getEndpoint()` returns the direct `https://api.openai.com/v1/chat/completions`. The inline comment "use proxy when configured" is aspirational; no proxy is configured. |
  | DeepSeek | `AI.DeepSeek.endpoint` (`:286`) | Bearer | No — direct |
  | Gemini | `` `${AI.Gemini.getEndpoint()}/${model}/generateContent?key=${apiKey}` `` (`:352`) | key in query string | **Yes** — `AI.Gemini.proxy = '/v1/gemini'` |
  | Mistral | `AI.Mistral.endpoint` (`:445`) | Bearer | No — direct |
  | Groq | `AI.Groq.endpoint` (`:509`) | Bearer | No — direct |
  | Kimi | `AI.Kimi.endpoint` (`:551`) | Bearer | No — direct |
  | Ollama | `baseUrl ? \`${baseUrl}/v1/chat/completions\` : AI.Ollama.endpoint` (`:593`) | none | No — local |

- **Backend proxy**: a Cloudflare Worker, base URL hardcoded in `AI.getEndpoint()` (`types/jodie.ts:202-214`): prod `https://jjodel-ai-proxy.alfonso99.workers.dev`, localhost `http://localhost:8787`. `getEndpoint()` returns `base + this.proxy` only when `this.proxy` is set, else `this.endpoint`. **Only `AI.Claude.proxy` and `AI.Gemini.proxy` are assigned** (`:366-367`).
  - **Inconsistency worth flagging**: Claude's *chat* path goes **direct** (`AI.Claude.endpoint`, `:121`) but Claude's *test* path goes **through the proxy** (`AI.Claude.getEndpoint()`, `:672`). Gemini uses the proxy in both chat and test. So "is there a backend proxy?" → yes, but it is wired inconsistently: Gemini fully, Claude test-only, everyone else not at all (browser-direct).

---

## B. Provider registry

- **Where declared**: `frontend/src/types/jodie.ts` (1032 lines) — single source of truth for provider/company identity, endpoints, model versions, and GUI metadata.
  - Provider IDs: `class AIProvider` (`:23-38`): `Claude, GPT, DeepSeek, Gemini, Mistral, Groq, Ollama, Llama, Copilot, Kimi, Custom`.
  - Company IDs: `class AICompany` (`:40-52`): `Anthropic, OpenAI, DeepSeek, Google, Mistral, Groq, Ollama, Meta, Microsoft, Moonshot, Custom`.
  - `aimap` (company→provider, `:54-66`) and derived `companymap` (provider→company, `:67-68`); `getAICompany` / `getAIProvider` (`:70-71`).
  - `ALL_AI_PROVIDERS` / `ALL_AI_COMPANIES` (`:77-78`) drive declaration order in all UIs.
  - Instances created via `new AI(name, company, keyUrl)` (`:256-266`), GUI via `addGUIinfo(...)` (`:270-280`), endpoints assigned (`:369-376`), proxies (`:366-367`), bootstrap icons (`:378-386`).

- **Providers currently supported (id → display/company)** — all 11 are declared, but capability differs:
  - `GPT` (OpenAI), `Claude` (Anthropic), `Gemini` (Google), `DeepSeek`, `Mistral`, `Groq`, `Kimi` (Moonshot), `Ollama` — **fully wired** (have a `chatXxx` + `testXxx`).
  - `Llama` (Meta), `Copilot` (Microsoft) — declared with model lists/`keyUrl='?'` but **no `chat()`/`test()` case** → non-functional.
  - `Custom` — declared, configurable in UI, but **no `chat()`/`test()` case** → non-functional for chat (see §A).

- **Shape per provider** (the `AI` class, `:142-234`):
  - `name`, `company`, `keyUrl`, `storageKey` (`= "jjodie_provider_" + name.toLowerCase()`, `:185`), `versions: Dictionary<string, AIVersion>`, `endpoint`, optional `proxy`, `requiresKey` (default `true`; `AI.Ollama.requiresKey = false` `:267`), GUI fields (`color`, `bgColor`, `keyPlaceholder`, `initial`, `logo`, `bi_icon`).
  - Auth scheme is **not** a registry field — it is hardcoded per-provider inside each `chatXxx`/`testXxx` method in the service (header for OpenAI-family/Anthropic, query-string for Gemini).

- **Single source of truth?** The *registry* (identity + endpoints + models) is single-source in `types/jodie.ts`. The *request construction* (headers/auth/body) is **duplicated** across 8 `chatXxx` + 8 `testXxx` methods in `AIProviderService.ts`, six of which (GPT/DeepSeek/Mistral/Groq/Kimi/Ollama) are near-identical OpenAI-compatible bodies. There is also a **stale duplicate mapping** `SETTINGS_TO_PROVIDER` in `AISettingsContent.tsx:42-51` (maps lowercase `'openai'/'anthropic'/…` strings that are not valid `TAIProvider` values; unused by the render path).

---

## C. Key validation / detection

- **Location**: `AIProviderService.validateKeyCoherence` (`:1107-1125`), backed by two tables:
  - `DISTINCTIVE_KEY_PREFIXES` (`:1077-1081`): `sk-ant-`→Claude, `AIza`→Gemini, `gsk_`→Groq.
  - `EXPECTED_KEY_PREFIX` (`:1087-1093`): Claude `sk-ant-`, GPT `sk-`, Gemini `AIza`, Groq `gsk_`, DeepSeek `sk-`.
- **Logic**:
  - Branch A — if the key starts with a *distinctive* prefix belonging to a **different** provider than the active one → emit the mismatch error.
  - Branch B — else if the active provider has an *expected* prefix the key does not match → emit a "should start with …" error.
  - Skips providers with `!requiresKey` (Ollama) and `Custom` (`:1109`); skips empty keys (`:1111`).
- **Screenshot error string** — confirmed verbatim at `AIProviderService.ts:1116`:
  > `This looks like a ${providerLabel(d.provider)} API key, but the active provider is ${providerLabel(provider)}. Enter the ${providerLabel(provider)} key, or switch the provider in Settings.`

  With `AIza`→Gemini distinctive and active=GPT, `providerLabel` renders "Google (Gemini)" and "OpenAI (GPT)" (`providerLabel` `:1096-1099` uses `getAICompany`), reproducing the reported message exactly.
- **Coverage gaps**:
  - **DeepSeek vs GPT** both use `sk-` → indistinguishable by prefix; a DeepSeek key under GPT (and vice-versa) passes validation silently.
  - **Mistral, Kimi** have neither a distinctive nor an expected prefix → keys are never validated for those providers (any string passes coherence).
  - **Ollama, Custom** intentionally skipped.
  - Branch B can produce a *false positive* for modern OpenAI keys only if their prefix ever diverges from `sk-` (today `sk-`/`sk-proj-` both satisfy `startsWith('sk-')`, so fine).

---

## D. Model lists (current, hardcoded)

- **Where defined**: `types/jodie.ts`, via chained `.add(id, label, pdf, vision, deprecated?, contextWindow?)` calls populating `AI[provider].versions` (`AIVersion`, `:236-254`). Blocks:
  - GPT `:282-287`: `gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-3.5-turbo`
  - Claude `:288-296`: `claude-opus-4-7, claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001` (+ legacy/deprecated `claude-3-5-sonnet-latest, claude-3-opus-latest, claude-3-haiku-20240307`)
  - DeepSeek `:297-299`: `deepseek-chat, deepseek-coder`
  - Gemini `:300-304`: `gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash, gemini-pro (deprecated)`
  - Mistral `:305-311`: `mistral-large-latest, mistral-small-latest, pixtral-large-latest, pixtral-12b-2409, codestral-latest, ministral-8b-latest`
  - Llama `:312-317`: `llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, llava-v1.5-7b-4096-preview, gemma2-9b-it`
  - Kimi `:320-323`: `moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k`
  - Ollama `:324-331`: `llama3.2, llama3.2:1b, llama3.1, mistral, codellama, llava, qwen2.5`
  - Groq `:333-358`: a large mixed set (`groq/compound`, `groq/compound-mini`, `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `meta-llama/llama-4-scout-17b-16e-instruct`, `meta-llama/llama-prompt-guard-2-22m`, `…-86m`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `openai/gpt-oss-safeguard-20b`, `whisper-large-v3`, `whisper-large-v3-turbo`, `moonshotai/kimi-k2-instruct-0905`, `qwen/qwen3-32b`, `canopylabs/orpheus-v1-english`)
- **Legacy ID migration**: `claudeLegacyIdMap` (`:98-104`), `legacyIdMaps` (`:108-110`, only Claude), `resolveLegacyModelId` (`:116-121`). `isModelOfProvider` (`:126-128`), `isForeignModel` (`:136-140`).
- **Consumers of `AI[provider].versions`**:
  - `ProviderModelSelector.tsx:64-71` — `popoverModels` from `Object.keys(llm.versions)`, split into `nonLegacy`/`legacy` by `.deprecated`. **(live picker)**
  - `AISettingsContent.tsx:129-137` — `description` (first 3 non-deprecated labels) + `availableModels`.
  - `ProviderConfigModal.tsx:219-221` — model `<select>` from `Object.entries(llm.versions)`.
  - `types/jodie.ts` — `isModelOfProvider`/`isForeignModel`/`getActiveVersion` (`:231-233`), `hasVision`/`hasPdf`/`hasAttachments` (`:215-229`).
- **Dead/commented helpers**: the lower third of `types/jodie.ts` (`:904-1033`) is **inside a block comment** — `supportsVision`, `supportsPDF`, `supportsAttachments`, `PROVIDER_ENDPOINTS`, `providerNeedsProxy`, `getModelInfo`, `getModelCapabilities`, `ModelCapabilities` are all commented out (the `/* … */` opens at `:906` and the file ends mid-comment). They reference a non-existent `PROVIDER_MODELS`. Not live — do not rely on them.

---

## E. UI selectors

| File | Status | Consumers |
|---|---|---|
| `components/common/ProviderModelSelector.tsx` (211 ln) | **LIVE** — the canonical two-level provider→model picker | `Jodie/JodieHeader.tsx:182` (`feature="chat"`), `jjtl/views/SuggestedMappingsPanel.tsx:570` (`feature="mappings"`), `abstract/tabs/DocumentationTab.tsx:967` (`feature="documentation"`) |
| `components/common/ProviderSelector.tsx` (153 ln) | **DEAD (legacy)** — provider-only dropdown | **Zero** `<ProviderSelector …>` JSX and **zero** imports anywhere. Only appears in its own file + one comment reference (`SuggestedMappingsPanel.tsx:257`). |
| `components/Jodie/ProviderSelector.tsx` (76 ln) | **DEAD** — re-exported but never rendered | Re-exported by `components/Jodie/index.ts:9`, but that barrel is consumed only as `import { Jodie }` (`App.tsx:44`). No `<ProviderSelector>` render site exists. |
| `components/Settings/ProviderSettings.tsx` (253 ln) | **DEAD** — not in scope brief, found incidentally | **Zero** references (no import, no JSX). |

- **Verdict on dead code** (report only — do **not** delete now): `common/ProviderSelector.tsx`, `Jodie/ProviderSelector.tsx`, and `components/Settings/ProviderSettings.tsx` are all unreferenced render-wise. CLAUDE.md §16's documented `<ProviderSelector feature="chat" compact />` usage is **stale** — the live component is `ProviderModelSelector`. Recommend a separate cleanup commit, not part of this effort.

---

## F. Preferences

- **`useAIProviderPreference` hook and `AIProviderPreferences` service are GONE.** Both files are 28-byte tombstones containing only `export const deleted = true;`:
  - `frontend/src/hooks/useAIProviderPreference.ts`
  - `frontend/src/services/AIProviderPreferences.ts`
  - The only residual reference is a commented-out call in `DocumentationTab.tsx:583` (`// useAIProviderPreference('documentation')`). **CLAUDE.md §16's `useAIProviderPreference(...)` usage is stale.**
- **Live preference API** lives on `AIConfig` (static methods in `types/jodie.ts`):
  - `getPreferred(feature): TAIProvider` (`:441-455`) — reads per-feature override, else first-enabled provider.
  - `getPreferredModel(feature): string | undefined` (`:494-509`) — reads per-feature modelId, resolves legacy, drops foreign.
  - `setPreferred(feature, providerId, modelId?)` (`:468-487`) — persists + dispatches `AIEvents.SETTINGS_CHANGED`.
  - `resolveFeatureSelection(feature)` (`:516-521`), `resetPreference(feature)` (`:647-649`).
  - `AIFeature` union (`:80`): `'documentation' | 'chat' | 'scriptblock' | 'mappings' | 'explain'`.
- **Global vs per-feature**: selection is **per-feature** (no global default any more; `getPreferred` falls back to first-enabled provider, `getFirstEnabledProvider` `:462-466`). A one-shot migration `migrateGlobalDefaultToPerFeature` (`:622-642`) copies the legacy global default into each feature.
- **localStorage keys (verbatim)**:
  - **Per-feature preference**: `` `${AI.STORAGE_PREFIX}${feature}` `` where `STORAGE_PREFIX = 'jjodel_provider_'` (`:161`) → e.g. `jjodel_provider_chat`, `jjodel_provider_documentation`. Value = `ProviderPreference {providerId, modelId?, updatedAt}`. **No API keys here.**
  - **Per-provider credentials**: `AI[provider].storageKey = 'jjodie_provider_' + name.toLowerCase()` (`:185`) → `jjodie_provider_gpt`, `jjodie_provider_claude`, `jjodie_provider_gemini`, `jjodie_provider_deepseek`, `jjodie_provider_mistral`, `jjodie_provider_groq`, `jjodie_provider_kimi`, `jjodie_provider_ollama`, `jjodie_provider_custom`. Value = serialized `AIConfig` (contains `apiKey`, `baseUrl`, `model`, `enabled`, `lastTested`).
  - **Global credentials blob**: `jjodie-credentials` (`STORAGE_GLOBAL_CONFIG`, `:162`) = `JodieConfig { providers: { <Name>: AIConfig } }`.
  - Others: `jjodie_active_provider` (`:156`), `jjodel_default_provider` (legacy, `:160`), `jjodel_jodie_window` (`:157`), `jjodie-settings` (legacy, `:158`), `jjodie_doc_*` (`:159`), migration sentinels `jjodel_migration:legacy_model_ids_v1` (`:539`) and `jjodel_migration:global_to_per_feature` (`:623`).
  - **⚠ Easy-to-confuse dual prefix**: credentials use **`jjodie_provider_`** (company name "Jjodie", `…ie`); per-feature prefs use **`jjodel_provider_`** (app name "Jjodel", `…el`).

---

## G. Settings (providers section)

There are **two parallel, both-reachable** provider-configuration UIs:

1. **Primary / documented path** — `openSettings('providers')`:
   `SettingsModalContext.tsx:78` renders `UnifiedSettingsModal` → `UnifiedSettingsModal.tsx:133` `<ProvidersSection/>` → `ProvidersSection.tsx:28` `<AISettingsContent showHeader={false} …/>`.
   - This is what every selector, `StatusBarRightZone.tsx:54`, `Jodie.tsx:562`, and `SuggestedMappingsPanel.tsx:480` open.
   - **Key entry/storage** (`AISettingsContent.tsx:217-243`): one `<input type=password>` per provider; on change it mutates `config.apiKey/model/baseUrl` directly and calls `config.save()` (which writes localStorage + dispatches `AIEvents.PROVIDER_CHANGED`). Model selection was intentionally removed here (`:214-216` comment) — moved to the app-level `ProviderModelSelector`.
   - **Test Connection is FAKE** (`AISettingsContent.tsx:94-115`): `handleTestConnection` just `setTimeout(1000)` then sets `'success'`. It does **not** call `AIProviderService.testConnection`. Explicit `// TODO: Implement real connection test` at `:101`. So in the primary settings UI the green "Connected" is meaningless.
   - There is **no explicit provider "switch"** here — the active provider per feature is changed elsewhere (the selectors via `AIConfig.setPreferred`). "Enabled" is derived from `isConfigured()` (has a key).

2. **Secondary path** — route `/settings` (`App.tsx:149` `<SettingsPage/>`) and the GlobalDrawer (`GlobalDrawer/SettingsDrawerContent.tsx:26`) both render `AIAssistantSettings` (`pages/settings/AIAssistantSettings.tsx`) → clicking a card opens `ProviderConfigModal` (`pages/settings/ProviderConfigModal.tsx`).
   - **Test Connection is REAL** here (`ProviderConfigModal.tsx:62-99`): calls `AIProviderService.testConnection(provider)`, sets `config.lastTested`, flips `config.enabled` on success/failure, `config.save()`.
   - Key/model entry write directly to `config` + `config.save()` on each keystroke (`:189-216`).

- **Persistence across reload**: yes for credentials. `config.save()` (`types/jodie.ts:666-679`) writes `localStorage[jjodie_provider_<name>]` and cascades to `jjodie-credentials`; `JodieConfig.load()` (`:757-796`) re-reads on boot and runs the three one-shot migrations. Provider/model *selection* persists via the per-feature `jjodel_provider_<feature>` keys. **Caveat**: the two UIs share the same storage, but their *test* semantics diverge (fake vs real) — a provider can read "Connected" in one UI and "Ready/Not tested" in the other.

---

## H. CORS probe (browser-console snippet — for Alfonso to run, NOT executed here)

Run on `http://localhost:3001/` (or wherever the app is served with keys in localStorage).
The snippet reads keys from the `jjodie_provider_<name>` entries, falling back to the
`jjodie-credentials` blob, then GETs each provider's *list-models* endpoint and reports
`{provider, status, ok, corsBlocked, sampleModelIds}`. A `corsBlocked: true` with
`status: 0` is the signature of a browser CORS rejection (the fetch throws `TypeError:
Failed to fetch`); a real HTTP status (401/403/200) means CORS *allowed* the response
through (even if auth failed).

```js
(async () => {
  // --- 1. Harvest API keys from localStorage (credentials live under jjodie_provider_<name>) ---
  const names = ['gpt','claude','gemini','deepseek','mistral','groq','kimi','ollama'];
  const keyByName = {};
  for (const n of names) {
    try {
      const raw = localStorage.getItem('jjodie_provider_' + n);
      if (raw) { const c = JSON.parse(raw); keyByName[n] = { apiKey: c.apiKey || '', baseUrl: c.baseUrl || '' }; }
    } catch {}
  }
  // Fallback: the global jjodie-credentials blob ({ providers: { GPT: {...}, Claude: {...} } })
  try {
    const blob = JSON.parse(localStorage.getItem('jjodie-credentials') || '{}');
    const providers = blob.providers || {};
    for (const [pname, cfg] of Object.entries(providers)) {
      const n = String(pname).toLowerCase();
      if (!keyByName[n] && cfg) keyByName[n] = { apiKey: cfg.apiKey || '', baseUrl: cfg.baseUrl || '' };
    }
  } catch {}

  // --- 2. list-models endpoint per provider ---
  const targets = [
    { provider: 'OpenAI (GPT)', name: 'gpt',     url: 'https://api.openai.com/v1/models',                                   headers: k => ({ Authorization: 'Bearer ' + k }) },
    { provider: 'Anthropic',    name: 'claude',  url: 'https://api.anthropic.com/v1/models',                                headers: k => ({ 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }) },
    { provider: 'Google Gemini',name: 'gemini',  url: k => 'https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(k), headers: () => ({}) },
    { provider: 'DeepSeek',     name: 'deepseek',url: 'https://api.deepseek.com/v1/models',                                 headers: k => ({ Authorization: 'Bearer ' + k }) },
    { provider: 'Mistral',      name: 'mistral', url: 'https://api.mistral.ai/v1/models',                                   headers: k => ({ Authorization: 'Bearer ' + k }) },
    { provider: 'Groq',         name: 'groq',    url: 'https://api.groq.com/openai/v1/models',                              headers: k => ({ Authorization: 'Bearer ' + k }) },
    { provider: 'Kimi (Moonshot)',name:'kimi',   url: 'https://api.moonshot.cn/v1/models',                                  headers: k => ({ Authorization: 'Bearer ' + k }) },
    { provider: 'Ollama (local)',name: 'ollama', url: 'http://localhost:11434/api/tags',                                    headers: () => ({}), noKey: true },
  ];

  const results = [];
  for (const t of targets) {
    const entry = keyByName[t.name] || {};
    const apiKey = entry.apiKey || '';
    if (!t.noKey && !apiKey) { results.push({ provider: t.provider, status: '—', ok: false, corsBlocked: false, note: 'no key in localStorage', sampleModelIds: [] }); continue; }
    const url = typeof t.url === 'function' ? t.url(apiKey) : t.url;
    try {
      const res = await fetch(url, { method: 'GET', headers: t.headers(apiKey) });
      let sampleModelIds = [];
      try {
        const j = await res.clone().json();
        const arr = j.data || j.models || j.models?.models || [];
        sampleModelIds = (Array.isArray(arr) ? arr : []).slice(0, 5).map(m => m.id || m.name || m.model).filter(Boolean);
      } catch {}
      results.push({ provider: t.provider, status: res.status, ok: res.ok, corsBlocked: false, sampleModelIds });
    } catch (e) {
      // A thrown TypeError here is the CORS / network signature in the browser.
      results.push({ provider: t.provider, status: 0, ok: false, corsBlocked: true, note: String(e && e.message || e), sampleModelIds: [] });
    }
  }
  console.table(results);
  console.log('Full results:', results);
  return results;
})();
```

> Interpretation guide for the paste-back:
> - `corsBlocked: true` → browser CORS (or network) blocked it; dynamic listing for that provider needs the proxy.
> - `status: 401/403` (ok:false, corsBlocked:false) → CORS *allowed*; only the key/permission failed — listing is feasible browser-direct with a valid key.
> - `status: 200` with `sampleModelIds` → fully feasible browser-direct.

---

## I. Known debt (confirmed against current code)

- **`chat()` network cancellation**: still **UI-only**. `AIProviderService.chat()` and every `chatXxx`/`testXxx` accept **no `AbortSignal`** and create **no `AbortController`** (`rg signal|AbortSignal services/AIProviderService.ts` → none). Confirmation marker: `components/Jodie/ChatInput.tsx:594` — `// TODO: real abort wired to AbortController in AIProviderService — currently UI-only`. So "stop generation" updates the UI but the in-flight `fetch` is not aborted; its eventual response is simply discarded.
- **Fake test in primary Settings UI**: `AISettingsContent.tsx:94-115` simulates success; `// TODO: Implement real connection test` (`:101`). Divergent from `ProviderConfigModal`'s real test.
- **`Custom`/`Llama`/`Copilot` non-functional**: declared in the registry but absent from the `chat()`/`testConnection()` switches → `default: throw "Unsupported provider"`.
- **Stale references in CLAUDE.md §16**: `useAIProviderPreference(...)` (deleted, §F) and `<ProviderSelector …>` (dead, §E) — the live equivalents are `AIConfig.getPreferred/getPreferredModel` and `ProviderModelSelector`.
- **Other TODO/FIXME in scope** (verbatim): `types/jodie.ts:530` — "TODO: remove the key read + the `AI.GLOBAL_DEFAULT_KEY` constant in the next release once migration has run on all installs."
- **Commented-out capability helpers**: `types/jodie.ts:904-1033` is dead (inside a block comment, references non-existent `PROVIDER_MODELS`).
- **Stale duplicate map**: `SETTINGS_TO_PROVIDER` (`AISettingsContent.tsx:42-51`) — lowercase string keys not matching `TAIProvider`; unused.

---

## J. Feasibility notes for goals 2 & 3 (factual, no decisions)

### Goal 2 — adding new providers

- **Registry/UI side is already uniform and would absorb a new provider cleanly**: declare in `AIProvider`/`AICompany` + `aimap`, `new AI(...)`, assign `endpoint` (+ optional `proxy`), `addGUIinfo`, `.add(...)` models, `bi_icon`. All UIs (`AISettingsContent`, `ProviderConfigModal`, `ProviderModelSelector`) iterate `ALL_AI_PROVIDERS` / `AI[provider].versions` generically, so they need **no change**.
- **The non-uniform part is request construction**: `chat()` and `testConnection()` use hardcoded `switch` statements, and six providers (GPT/DeepSeek/Mistral/Groq/Kimi/Ollama) carry **near-duplicate OpenAI-compatible** method bodies. A generic **"OpenAI-compatible (base_url + key)"** provider type would slot in structurally — the `Custom` provider already models the data (baseUrl + apiKey + model). What would have to change:
  1. Add a single shared `chatOpenAICompatible(endpoint, apiKey, model, …)` and route the OpenAI-family `switch` cases (incl. a new `Custom` case) through it — collapses the duplication and makes new OpenAI-compatible providers a registry-only addition.
  2. Give `Custom`/`Llama`/`Copilot` real `chat()`/`test()` routing (today they throw).
  3. Auth scheme is implicit in the method today; a generic type would need an explicit `authScheme: 'bearer' | 'x-api-key' | 'query-key'` field on `AI` to stay registry-driven.
- Net: the seam exists; the work is consolidating the duplicated methods + wiring `Custom`, not reshaping the registry.

### Goal 3 — dynamic model lists (without touching `chat()`)

- Model lists are read from `AI[provider].versions` by three consumers (§D). The minimal seam:
  1. Add a service method, e.g. `AIProviderService.listModels(provider): Promise<string[]>`, that GETs the provider's list-models endpoint (Bearer / `x-api-key` / `?key=`) **via `AI[provider].getEndpoint()` so it inherits the proxy** for providers that need it (Claude/Gemini today; extend per the §H probe results).
  2. Merge results into the registry — either mutate `AI[provider].versions` or keep a parallel `dynamicVersions` map and have `ProviderModelSelector` read the union. `ProviderModelSelector.tsx:14-17` already anticipates exactly this ("Pattern C: dynamic model discovery would merge provider-endpoint responses with this static registry … keep the `ModelEntry` shape narrow"). Its `tick`/`useMemo` re-read pattern (`:41,45-46,64-68`) makes a refresh-on-fetch trivial.
  3. Apply `resolveLegacyModelId` as a pre-filter on the fetched IDs (note already present at `types/jodie.ts:94-97`) so a rollback never strands a user on a name the endpoint dropped.
- **`chat()` needs no change** — it only consumes `effectiveModel` + the registry for foreign-model guards; a richer `versions` map is backward-compatible.
- **The blocker is exactly the §H CORS question**: list-models is browser-direct for the OpenAI-compatible providers today. If the probe shows `corsBlocked` for a provider, dynamic listing for it must go through the Cloudflare Worker proxy (which currently only proxies Claude/Gemini and only the `/messages` + `/gemini` paths — a `/models` route would need adding to the Worker, out of repo scope).

---

## Appendix — file inventory (scope)

| File | Lines | Role | Status |
|---|---|---|---|
| `services/AIProviderService.ts` | 1128 | central service (`chat`, `testConnection`, key coherence) | LIVE |
| `types/jodie.ts` | 1032 | registry: `AIProvider`/`AICompany`/`AI`/`AIVersion`/`AIConfig`/`JodieConfig`, prefs API, legacy maps | LIVE |
| `components/common/ProviderModelSelector.tsx` | 211 | two-level provider→model picker | LIVE |
| `components/common/ProviderSelector.tsx` | 153 | provider-only dropdown | DEAD |
| `components/Jodie/ProviderSelector.tsx` | 76 | Jodie provider dropdown | DEAD (re-exported, unrendered) |
| `components/Settings/ProviderSettings.tsx` | 253 | provider settings panel | DEAD |
| `components/Settings/AISettingsContent.tsx` | 318 | primary settings UI (fake test) | LIVE |
| `components/Settings/UnifiedSettingsModal/sections/ProvidersSection.tsx` | 33 | wraps AISettingsContent | LIVE |
| `pages/settings/AIAssistantSettings.tsx` | 104 | secondary settings UI (cards) | LIVE (route `/settings` + GlobalDrawer) |
| `pages/settings/ProviderConfigModal.tsx` | 274 | per-provider config modal (real test) | LIVE |
| `hooks/useAIProviderPreference.ts` | 1 | `export const deleted = true` | TOMBSTONE |
| `services/AIProviderPreferences.ts` | 1 | `export const deleted = true` | TOMBSTONE |

**Hard stop. No Phase 2.**
