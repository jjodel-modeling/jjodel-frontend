# Spec: AI provider layer refactor (#196)

- **Status**: frozen 2026-11-02
- **Issue**: #196, front `ai-provider`
- **Prompt-ID**: P-2026-11-02-1055 (L0 phase 2), continuing P-2026-11-02-1020 (L0 phase 1); chat C-2026-11-02-1016
- **Base plan**: second half of issue #196, «Jjodie AI-layer refactoring plan» (2026-10-21), copy at
  `~/.jjodel-lanes/spike196/issue196.md:160-420`
- **Evidence**: `docs/discovery/discovery_2026-11-02_196_l0_ai_layer.md` (`712aae6dd`), measured on HEAD `288425992`
  (`staging` `58ac7a61d` + the prompt commit). Section references below (§A1..§C) point into that report.
- **Decisions**: R-AI-1..5 in `docs/decisions.md` (`cc252b1ca`)

Paths are relative to `frontend/` unless they start with `cloudflare-worker/`, `docs/` or `~`. Line numbers are those of HEAD
`288425992`; every lane re-reads the real files before editing (P3).

This document replaces the plan's L0 output (`docs/spec/ai-provider-refactor.md` plus «decisions entries for ④ and ⑥»): the
spec lives here, and the decisions are the R-AI rows.

---

## 1. Scope

The AI provider subsystem behind Jjodie: provider registry, config, model catalog, chat/stream calls, connection test, plus
the AI-proxy removal. The Jodie chat feature layer (modes, scope stamping, reserved-identifier gate, RAG, console providers)
is out of scope except where it imports the AI layer.

Today the layer is spread across `types/jodie.ts` (registry + config, 1264 lines, 42 exports per the TS parser, §A1),
`services/AIProviderService.ts` (hand-rolled HTTP per provider), `services/aiModelCatalog.ts` (catalog fetch with a Worker
fallback), and the Cloudflare Worker `cloudflare-worker/` (deployed as `jjodel-ai-proxy`, §A8).

## 2. Rationale, as corrected by L0

The plan's claim «the proxy is removable, the codebase already proves it» holds with one narrowing (§A8, §B3):

- `components/ExplainModal.tsx:34` streams Claude directly from the browser with `anthropic-dangerous-direct-browser-access`.
- `services/aiModelCatalog.ts:309-310` tries the direct call first; the Worker is a fallback on a rejected `fetch`
  (`:362-364`), pinned by `services/__tests__/aiModelCatalog.test.ts:99-101` (direct) and `:104` (fallback).
- `services/AIProviderService.ts:240` sends the header in `chatClaude`, which posts to `AI.Claude.endpoint` (`:234`).
- **Correction**: Gemini does not use `?key=`. Today's model-list call sends `x-goog-api-key` (`AIProviderService.test.ts:198`),
  and so does `@google/genai` (§B3, `queryHasKey: false`).
- The Worker has **one** live path left: the model-catalog fallback for Claude and Gemini (`AIProviderService.ts:821`
  → `aiModelCatalog.ts:362-364`). `AI.getEndpoint()` has no caller for Claude (§A8 item 2).
- **What the Worker still buys** (§B3): with an invalid Claude key, `models.list` from the browser is CORS-blocked, so the
  failure reads NETWORK instead of AUTH. Whether a valid key's 200 on `/v1/models` carries ACAO is not measured. This is why
  L4 is gated (R-AI-4, §7 L4).

## 3. Decisions

| Plan # | Decision | Row |
|---|---|---|
| ① | Gemini SDK is `@google/genai`, not the legacy `@google/generative-ai` | plan, unchanged |
| ② | Delete `AIProviderService`; consumers call the provider registry directly | plan, unchanged |
| ③ | `ExplainModal` adopts `chatStream`; its `streamClaude` (`:27`) and `streamOpenAI` (`:79`) are deleted | plan, unchanged |
| ④ | The runtime contract on `AI`, `AIConfig`, `JodieConfig` is dead; no facade; the `@RuntimeAccessible` registrations (`types/jodie.ts:180`, `:507`, `:905`) go with the file at L6; the new classes are not registered; CHANGELOG at L6 | **R-AI-1** |
| rule 4 | `openai` 7.47.0, `@anthropic-ai/sdk` 1.3.0, `@google/genai` 2.32.0, exact-pinned, dynamically imported; a different version is a new decision | **R-AI-2** |
| ⑤ | Abstract class `BaseProvider`, module `src/services/ai/` | **R-AI-3** |
| ⑥ | `cloudflare-worker/` is deleted, but L4 is gated on a real-key Anthropic spike run and on the Claude `test()` moved to `/v1/messages`; Alfonso removes the deployment; the notifications Worker stays | **R-AI-4** |
| — | The fifteen file-list corrections of the report are adopted (§8 here); the two orphan deletions wait for Alfonso | **R-AI-5** |

R-AI-1's residual risk (§A3): user projects on the server and in browsers are unmeasured. Three runtime channels make the
names reachable from user content today: the view evaluation context (`redux/reducer/reducer.ts:1571`,
`view/viewElement/view.tsx:1566`), the OCL type registry (`ocl/ocl.tsx:98`, `:137`), and the `window` globals
(`joiner/classes.ts:466`). The failure after L6 would be an undefined identifier at evaluation, not a load failure.

## 4. Target model

```
src/services/ai/
  types.ts                         # AIModel, ChatRequest, Attachment, HistoryMessage,
                                   # AIFeature, ProviderId, ECapabilities, EAuthScheme,
                                   # FailureCatalog, ConnectionTestResult,
                                   # DEFAULT_MAX_OUTPUT_TOKENS (= 8192)
  BaseProvider.ts                  # abstract:
                                   #   name, family, baseUrl, apiKey, authScheme, requiresKey
                                   #   enabled()            (Ollama: baseUrl instead of key, §6)
                                   #   models()             (static seed ∪ live catalog)
                                   #   resolveModel()       (foreign-model guard + legacy mapping)
                                   #   validateKey()        (prefixes sk-ant-, sk-, gsk_, §6)
                                   #   chat(req)            → Promise<string>
                                   #   chatStream?(req)     → AsyncIterable<string>
                                   #   retrieveAvailableModels()
                                   #   test()               → Promise<ConnectionTestResult>
  OpenAICompatibleProvider.ts      # `openai`: GPT, DeepSeek, Groq, Mistral, Kimi, Ollama, Custom
  GoogleCompatibleProvider.ts      # `@google/genai`: Gemini
  AnthropicCompatibleProvider.ts   # `@anthropic-ai/sdk`: Claude
  registry.ts                      # providerId → configured instance; enabled(); all()
  config/ProviderConfigStore.ts    # per-provider apiKey/baseUrl/model/enabled
  config/FeaturePreferenceStore.ts # feature → provider/model (documentation, chat, scriptblock, mappings, explain)
  catalog/catalogCache.ts          # key-hash + 24 h TTL cache, direct fetch only
  index.ts                         # public surface
  __tests__/                       # see L1
```

### Core types

```ts
class AIModel {
    apiName: string
    displayName: string
    capabilities: ECapabilities[]   // [] | [IMAGES] | [DOCUMENTS] | [IMAGES, DOCUMENTS]
    contextWindow?: number
}

interface ChatRequest {
    system?: string                  // rendered by PromptService at the call site
    history: { role: 'user' | 'assistant'; content: string }[]
    model?: string
    images?: Attachment[]            // base64, requires capability IMAGES
    documents?: Attachment[]         // base64 PDF, requires DOCUMENTS
    maxOutputTokens?: number         // default DEFAULT_MAX_OUTPUT_TOKENS
}

enum ECapabilities  { IMAGES, DOCUMENTS }
enum EAuthScheme    { BEARER, X_API_KEY, QUERY_KEY, NONE }
enum FailureCatalog { AUTH, RATE, NETWORK, SERVER }

interface ConnectionTestResult {
    success: boolean
    error?: string
    failure?: FailureCatalog
    warning?: string
}
```

### SDK strategy, as measured (§B1, §B3)

| Family | Package | Browser requirements and observed wire |
|---|---|---|
| OpenAI-compatible (7) | `openai` 7.47.0 | `dangerouslyAllowBrowser: true` (else it throws, `client.mjs:233-234`); `Authorization: Bearer`; `new OpenAI({ apiKey, baseURL })` covers Ollama/Custom/Kimi; fetch-based universal ESM, 0 transitive deps |
| Anthropic | `@anthropic-ai/sdk` 1.3.0 | `dangerouslyAllowBrowser: true` (`client.mjs:144-145`), with which it adds `anthropic-dangerous-direct-browser-access: true` itself (`:969-970`); sends **`Authorization: Bearer`, not `x-api-key`** (`:452`), and **`anthropic-version: 2026-10-21`** (`:971`), where today's code sends `2023-06-01` (`aiModelCatalog.ts:309`) |
| Gemini | `@google/genai` 2.32.0 | no browser flag; dedicated `browser` export (`dist/web/index.mjs`); key sent as `x-goog-api-key`; `models.list`, `generateContent` with `inlineData` PDF proven |

**Bundle rule** (R-AI-2): SDKs are imported dynamically inside provider methods (`await import('openai')`, …) so they land in
lazy chunks. L1's `vite build` chunk diff proves the initial bundle does not grow.

## 5. localStorage keys the L1 stores reuse (§A5)

Zero data migration means the stores read and write exactly these keys. Line numbers in `types/jodie.ts` unless noted.

| Key | Content | Read / write today |
|---|---|---|
| `jjodie_provider_<name lowercase>` (e.g. `jjodie_provider_claude`) | per-provider `AIConfig` JSON: apiKey, model, baseUrl, enabled, … | built `:229`; read `:488`, `:553`, `:692`, `:784`; written `:700`, `:795`, `:837`, `:853`; pinned by `AIProviderService.test.ts:240`, `:243` |
| `jjodel_provider_<feature>` (`AI.STORAGE_PREFIX`, `:199`) | per-feature `ProviderPreference` `{provider, modelId}`; feature ∈ `documentation, chat, scriptblock, mappings, explain` (`:82`) | read `:570`, `:623`, `:674`, `:729`, `:764`; written `:608`, `:683`, `:738`, `:775`, `:815`; removed `:829` |
| `jjodel_default_provider` (`AI.GLOBAL_DEFAULT_KEY`, `:198`) | legacy global default, read once by the migration, not deleted | `:807` |
| `jjodie-credentials` (`AI.STORAGE_GLOBAL_CONFIG`, `:200`) | whole `JodieConfig` JSON: `providers` (a **second copy of every API key**), `dockWidth`, legacy `position`/`size`, `appVersion` | written `:930`; read `:954` |
| `jjodel_migration:legacy_model_ids_v1` | sentinel | `:666`, `:668`, `:705` |
| `jjodel_migration:global_to_per_feature` | sentinel | `:804`, `:806`, `:819` |
| `jjodel_models_<provider>` (`CATALOG_STORAGE_PREFIX`) | live catalog cache, 24 h, keyed to an FNV-1a hash of the API key | `services/aiModelCatalog.ts:47`; read `:73`; write `:85` |
| `jjodie_doc_<projectId>` (`AI.DOCUMENTATION_STORAGE_PREFIX`, `:197`) | generated documentation, not AI config; not owned by the new stores | `services/DocumentationService.ts:163`, `:174`, `:181` |
| `jjodel_jodie_window` (`AI.WINDOW_STATE_KEY`, `:195`) | declared, no reader or writer | none |

`retireModels` (`:756`) has no sentinel and runs on every `JodieConfig.load` (`:951`).

## 6. Behaviour-transport table (must move, not disappear)

«Lives today» and «Pinned by» are from §A6. «Test owed at L1» is what the new module must cover with a named test; a row whose
behaviour has no test today gets one before its old home is deleted.

| Behaviour | Lives today | Pinned by today | Goes to | Test owed at L1 |
|---|---|---|---|---|
| Key-prefix coherence | `AIProviderService.ts:987-1005` `validateKeyCoherence` (called `:68`); tables `DISTINCTIVE_KEY_PREFIXES` `:957-961`, `EXPECTED_KEY_PREFIX` `:967-973`. **`AIza` is commented out** (`:959`, `:970`): live prefixes are `sk-ant-` (Claude), `sk-` (GPT, DeepSeek), `gsk_` (Groq). testConnection repeats them at `:734`, `:785`, `:903` | `aiModelCatalog.test.ts:372` (testConnection copy); chat-side: **none** | `BaseProvider.validateKey()`, per-family prefixes, **without `AIza`** (adding it changes behaviour) | yes, both the chat path and `test()` |
| Foreign-model guard + fallback with warning | `AIProviderService.ts:115-138` (`:132`; Custom exempt); `isForeignModel` `types/jodie.ts:162` | `AIProviderService.test.ts:73`, `:291`; `aiModelCatalog.test.ts:161`; the discard branch itself: **none** | `BaseProvider.resolveModel()` | yes, the discard branch |
| Legacy/retired model migration | `types/jodie.ts:665` `migrateLegacyModelIds`, `:723` `sanitizeForeignFeatureModels`, `:756` `retireModels`, `:803` `migrateGlobalDefaultToPerFeature`; `claudeLegacyIdMap` `:100`; called from `JodieConfig.load` (`:940`) at `:945-951` | `retireModels`: `AIProviderService.test.ts:174`, `:183`, `:219`, `:229`, `:238`, `:286`, `:299`; the other three: **none** | `ProviderConfigStore.load()` / `FeaturePreferenceStore.load()`, same sentinels | yes, all four, sentinels included |
| `CHAT_MAX_OUTPUT_TOKENS = 8192` | `AIProviderService.ts:21` | **none** | `DEFAULT_MAX_OUTPUT_TOKENS` in `ai/types.ts` | yes, per family request shape |
| Per-provider `authScheme` | `types/jodie.ts:216`, values `:434-442`; applied `AIProviderService.ts:184` | indirect: `aiModelCatalog.test.ts:101`, `AIProviderService.test.ts:198` | `EAuthScheme` on `BaseProvider`; the SDKs set the header themselves (§4), so the field drives only non-SDK paths | yes; the `x-api-key` assertion does not carry over (Anthropic SDK sends Bearer) |
| Ollama / Custom «configured» | `types/jodie.ts:882-889` `isConfigured`: Custom `!!(baseUrl \|\| apiKey)`, others `!!(requiresKey ? apiKey : baseUrl)`; `AI.Ollama.requiresKey = false` `:314`; default config gives Ollama no `baseUrl` (`:921`), so it starts unconfigured | **none** | `BaseProvider.enabled()` override. Ollama is enabled by a `baseUrl`, not «without key» as the plan wrote | yes, Ollama, Custom, a keyed provider |
| Anthropic direct-browser header | `AIProviderService.ts:240`, `aiModelCatalog.ts:310`, `ExplainModal.tsx:34` | `aiModelCatalog.test.ts:92`, `:101`, `:104` | `@anthropic-ai/sdk` with `dangerouslyAllowBrowser` (§B3: header observed on every request) | yes, on the request the SDK builds |
| OpenAI-compatible base-URL normalisation (3 forms) | `AIProviderService.ts:159` `resolveChatCompletionsUrl` | `AIProviderService.test.ts:39` (`:49`), `:54`, `:60`: one form of three | `OpenAICompatibleProvider` (SDK `baseURL`) | yes, all three forms, dedicated test (L3 deletes the old one) |
| `AIEvents.*` names | `events/registry.ts:122-127`; fired: `SETTINGS_CHANGED` `types/jodie.ts:610`, `PROVIDER_CHANGED` `:841`, `:855`, `MODELS_UPDATED` `AIProviderService.ts:826`, `PROMPT_CHANGED` `services/PromptService.ts:160`, `:172`, `:215`, `:227` | **none** | `SETTINGS_CHANGED`, `PROVIDER_CHANGED` from the stores; `MODELS_UPDATED` from the catalog refresh; `PROMPT_CHANGED` stays in `PromptService`. Names unchanged | yes, the three the module fires |
| Catalog 24 h TTL, key-hash cache | `services/aiModelCatalog.ts:47`, `:73`, `:85` (`hashKey`, `CATALOG_TTL_MS`) | `aiModelCatalog.test.ts:77`, `:148`, `:206` | `ai/catalog/catalogCache.ts`, proxy branch dropped | yes, TTL and key-hash invalidation |
| Jodie feature layer (scope, offer cards, reserved gate, RAG) | `components/Jodie/*`, `services/JjodieRagService.ts` | `components/Jodie/__tests__/reservedIdentifierGate.test.ts` and others | **untouched** | no |

Also observed, not judged (§A6): `AIConfig.getStatus` (`types/jodie.ts:876`) returns «Not configured» when `isConfigured()` is
true. The condition looks inverted. L2 decides whether the status label moves as-is (O-5).

## 7. Phase plan

Every lane is gated by `npm run typecheck` (zero baseline), `npm run build`, `npm run test` for the touched areas. One concern
per lane, one commit theme per lane. A lane whose list exceeds five files pauses for confirmation (CLAUDE.md rule 19).

### L0: spec and discovery (docs only), **done**

- Phase 1, P-2026-11-02-1020: discovery report `712aae6dd`; inventory with positive controls, spike in
  `~/.jjodel-lanes/spike196/`.
- Decisions R-AI-1..5, `cc252b1ca`.
- Phase 2, P-2026-11-02-1055: this spec.

### L1: new module, additive (nothing consumes it yet)

**Create**: the files of §4, plus `__tests__/` covering:
- base-provider request shaping (fetch mock), per family, including `max_tokens`/`maxOutputTokens` = 8192 by default;
- `test()` failure classification (AUTH / RATE / NETWORK / SERVER), with the measured shapes of §B: OpenAI 401
  `AuthenticationError` → AUTH, 404 `NotFoundError`, 429 `RateLimitError` → RATE; Anthropic 401 `AuthenticationError` → AUTH,
  CORS block `APIConnectionError` («Connection error.») → NETWORK; Gemini `ApiError` status **400** with reason
  `API_KEY_INVALID` → AUTH (as `AIProviderService.test.ts:246` reads it today);
- store round-trips on the **existing** keys of §5: `jjodie_provider_<name lowercase>`, `jjodel_provider_<feature>`,
  `jjodel_default_provider`, `jjodie-credentials` (with `dockWidth` and the second key copy preserved), the two migration
  sentinels, `jjodel_models_<provider>`;
- the rows of §6 marked «yes»;
- catalog TTL and key-hash invalidation;
- capability gating (image/PDF accepted only when the model declares it).

**Modify**: `package.json`, the three exact pins of R-AI-2:

```json
"@anthropic-ai/sdk": "1.3.0",
"@google/genai": "2.32.0",
"openai": "7.47.0",
```

**Gate**: typecheck, build **with a chunk diff proving SDK laziness**, test. App behaviour byte-identical (nothing imports
the module yet). Q6 (§10) does not block L1.

### L2: settings and catalog UI cutover

**Modify (13 files)**:

| File | Change |
|---|---|
| `components/common/ProviderModelSelector.tsx` | data sources → `registry` + stores + `provider.models()` / `provider.test()`; its `AIProviderService` call (`:15`) moves |
| `components/settings/AISettingsContent.tsx` | `testConnection` → `provider.test()`; model label via preference store; its `AIProviderService` call (`:9`) moves |
| `pages/settings/ProviderConfigModal.tsx` | `AIConfig` writes → `ProviderConfigStore`; its `AIProviderService` call (`:78`) moves |
| `pages/settings/AIAssistantSettings.tsx` | registry/config reads (`TAIProvider, AI, ALL_AI_PROVIDERS, AIConfig`, `:7`); live via `pages/settings/index.ts:1` → `GlobalDrawer/SettingsDrawerContent.tsx:8` → `App.tsx:52`; sole importer of `ProviderConfigModal` (`:8`) |
| `components/common/AIDisclaimer.tsx` | `AI[provider]` → `registry.get(...)`; props unchanged (consumers `jjscript/components/ScriptBlock.tsx:21`, `jjtl/views/InferredMappingsPanel.tsx:7` are touched only if they change) |
| `components/Jodie/Jodie.tsx` | `AIConfig.getPreferred/setPreferred('chat')`, `JodieConfig.getEnabledProviders()`, `AI.getActiveVersion` → stores + `registry` |
| `components/Jodie/ChatInput.tsx` | enabled-provider reads → `registry.enabled()` |
| `components/Jodie/JodieWindow.tsx` | `JodieConfig.hasEnabledProviders()` (`:144`) → `registry.enabled()`; `dockWidth` read/write (`:208-209`) → its new home (O-2) |
| `components/Jodie/ChatMessages.tsx` | `AI[message.provider]` runtime read (`:85`) → `registry.get(...)` |
| `components/StatusBarRightZone.tsx` | `JodieConfig.hasEnabledProviders()` (`:28`, `:34`) → `registry.enabled()`; live through `components/StatusBar.tsx:24`, `jjtl/components/JjtlStatusBar.tsx:7` |
| `jjtl/services/MappingSuggestionService.ts` | `JodieConfig.hasEnabledProviders()` (`:58`) → `registry.enabled()` |
| `components/abstract/tabs/DocumentationTab.tsx` | preference read `:583` **and** `AI`, `JodieConfig`, `ALL_AI_PROVIDERS` reads (`:22`, `:24`) |
| `jjtl/views/SuggestedMappingsPanel.tsx` | preference read `:262` **and** `AI`, `JodieConfig` reads (`:30`) |

Removed from the plan's list: `components/common/ProviderSelector.tsx` and `components/settings/ProviderSettings.tsx`, both with
zero importers (§A4). They are deleted in a dedicated sweep, not migrated, once Alfonso approves (R-AI-5, RC-26).

**Gate**: typecheck/build/test + smoke: add key → Test connection (green + red-auth) for one provider per family; per-feature
preference survives reload; live catalog + «show older models»; Jodie dock width survives reload.

### L3: chat cutover and `AIProviderService` death (highest risk)

**Modify (5 files)**:

| File | Change |
|---|---|
| `components/Jodie/console/providers/jjodieProvider.ts:53` | `AIProviderService.chat` → `registry.get(id).chat(req)`; system prompt still rendered by `PromptService` at the call site |
| `services/DocumentationService.ts:614` | provider/model resolution + chat call → registry/stores |
| `jjtl/services/AIMatcher.ts:52` | same |
| `components/ExplainModal.tsx` | delete `streamClaude` / `streamOpenAI`; consume `provider.chatStream(req)` (decision ③); preference reads `:129`, `:137` → store |
| `services/__tests__/aiModelCatalog.test.ts` | rewrite the cases that import `AIProviderService` dynamically (`:160`, `:170`, `:254`, `:376`) against the new module |

The catalog refresh that fires `AIEvents.MODELS_UPDATED` (`AIProviderService.ts:826`) moves with it to the new catalog.
`getAICompany`'s only outside reader (`AIProviderService.ts:977`, §A2) dies here.

**Delete (2 files)**: `services/AIProviderService.ts` (after all consumers, L2 included, have moved);
`services/__tests__/AIProviderService.test.ts` (its behaviours re-covered by L1, `resolveChatCompletionsUrl` by the dedicated
three-form test).

**Gate**: typecheck/build/test + smoke matrix: chat per family (GPT, DeepSeek or Groq, Claude, Gemini, Mistral, Ollama,
Custom); vision attachment (Mistral/GPT), PDF attachment (Claude/Gemini); **ExplainModal visible streamed answer** before the
adapters are deleted; documentation generation (Jjodie path); JjTL mapping suggestion. Only after this smoke is green does L4
exist.

### L4: proxy deletion

**Preconditions** (R-AI-4 and Q6):
1. A real-key Anthropic run of the spike: `models.list`, `messages`, stream, from a browser origin. It answers whether a valid
   key's 200 on `/v1/models` carries ACAO (§B3, unmeasured). It needs an Anthropic key in `~/.jjodel-lanes/keys196.env`
   (Q6); optional OpenAI credit lets the chat arm return 200 instead of 429.
2. The Claude connection `test()` runs on `/v1/messages`, where an invalid key's 401 is readable (§B3), not on `models.list`.

**Modify**: `services/aiModelCatalog.ts`, proxy fallback deleted (`proxyPath` `:296`, `:307`, `:324`, retry `:362-364`);
direct-path logic, `hashKey` and the cache absorbed into `src/services/ai/catalog/`. `services/__tests__/aiModelCatalog.test.ts`
follows (the Worker-fallback case `:104` goes).

**Delete, in this order**:
1. The **live** proxy surface of `types/jodie.ts`: `getProxyBase` (`:173`), `AI.proxy` (`:211`, set for Claude only at `:419`),
   the proxy branch of `AI.getEndpoint` (`:246-254`). `providerNeedsProxy`, `PROVIDER_ENDPOINTS` and the rest from `:1232` are
   already inside a block comment (§A4); removing them is comment cleanup, not behaviour. The file itself dies at L6.
2. `types/__tests__/aiProxyEndpoint.test.ts`.
3. `cloudflare-worker/` (repo root), in sequence: (a) direct-path smoke from `localhost:3000` and from a production origin with
   the Worker not running; (b) Alfonso removes the `jjodel-ai-proxy` deployment on his Cloudflare account; (c) a dedicated
   commit removes the folder (git history is the backup). The notifications Worker
   (`components/NotificationWidget/NotificationWidget.tsx:24`, `jjodel-notifications.alfonso99.workers.dev`, no source in the
   repo) is not touched.

**Gate**: `npm run check:docs`, smoke as above.

### L5: orphan sweep, **done**

Merged into `staging` at `b524fa1da` (`merge: chore/196-orphan-sweep into staging`, C-2026-11-02-0842). Not swept, and not part
of L5: `components/common/ProviderSelector.tsx` and `components/settings/ProviderSettings.tsx` (§A4, found by L0), whose
deletion waits for Alfonso (R-AI-5).

### L6: consolidation

- Migrate the remaining `types/jodie.ts` importers (the full list with lanes is §A1) to:
  - `src/services/ai/types.ts`: AI types (`AIModel`, `ChatRequest`, enums, `ConnectionTestResult`, `Attachment`, `AIFeature`,
    `ProviderId`);
  - a new `src/components/Jodie/types.ts`: chat/console types (`ChatMessage`, `ChatImage`, `ChatDocument`, `ChatState`,
    `ConsoleEntry`, `CodeEntry`, `CodeWarning`, `ConsoleMode`, `ConsoleModeSwitchVia`, `CodeFlavor`, `CONSOLE_MODES`,
    `CONSOLE_MODE_LABELS`, `JjodieScope`, guards `isChatEntry`/`isCodeEntry`);
  - a destination for the Doc group (`DocumentationSectionType`, `DocumentationSection`, `DocumentationStatus`,
    `ProjectDocumentation`, `types/jodie.ts:1204-1224`), which the plan did not name (O-4).
- The L6 type importers, corrected: `components/Jodie/JodieWindow.tsx`, `ChatMessages.tsx`, **`JodieMinimized.tsx`** (the plan
  spelled it `JjodieMinimized`), **`JodieHeader.tsx`**, `console/types.ts`, `console/providers/jjelProvider.ts`,
  `jjscriptProvider.ts`, `jjodieProvider.ts`, `ProviderModelSelector`, `AIDisclaimer`, **`services/JjodieContext.ts`** (Doc
  type), `components/abstract/tabs/DocumentationTab.tsx` (`DocumentationStatus`), and the surviving tests. Dropped from the
  plan's list: `MarkdownMessage.tsx` (does not import `types/jodie`) and `Jjie…` (matches no file).
- **Delete `src/types/jodie.ts`**: no compat facade (R-AI-1). The `@RuntimeAccessible` registrations for `AI` / `AIConfig` /
  `JodieConfig` disappear with it; the `BaseProvider` classes are not registered in the OCL type registry. The CHANGELOG
  announces the break.
- Docs: `CLAUDE.md` §16 is stale in two places (§A4): `useAIProviderPreference` does not exist (the real pattern is
  `AIConfig.getPreferred(feature)` / `getPreferredModel(feature)`), and `<ProviderSelector feature="chat" compact />` names an
  orphan. Rewrite §16 for the new module, then `npm run gen:agents` + `npm run check:agents`; `docs/CODEBASE-MAP.md` §19 key
  files.
- **Gate**: full `typecheck` (zero baseline), `build`, full `test`, `check:agents`, `check:docs`, full app smoke.

## 8. The fifteen corrections (R-AI-5), and where each landed

| # | Correction (report «Corrections to the L1..L6 file lists») | Here |
|---|---|---|
| 1 | L1 per-provider key is `jjodie_provider_<name lowercase>`; round-trip `jjodie-credentials`, the two sentinels, `jjodel_models_<provider>` | §5, L1 tests |
| 2 | L1 `validateKey()` prefixes `sk-ant-`, `sk-`, `gsk_`; `AIza` is commented out | §6 row 1, §4 |
| 3 | L1 Ollama is enabled by `baseUrl`, not «without key» | §6 row 6, §4 |
| 4 | L1 Anthropic SDK sends Bearer and `anthropic-version: 2026-10-21`; the `x-api-key` assertion does not carry over | §4 SDK table, §6 row 5 |
| 5 | L2 drops the two orphans; their deletion goes to a sweep (RC-26) | L2, L5 |
| 6 | L2 adds `StatusBarRightZone`, `MappingSuggestionService`, `AIAssistantSettings`, `JodieWindow`, `ChatMessages` | L2 table |
| 7 | L2 `DocumentationTab` and `SuggestedMappingsPanel` are more than preference reads | L2 table |
| 8 | L2/L3: `ProviderConfigModal:78`, `AISettingsContent:9`, `ProviderModelSelector:15` call `AIProviderService`; L3's deletion depends on them | L2 table, L3 delete |
| 9 | L3 adds `aiModelCatalog.test.ts` | L3 table |
| 10 | L3 moves `MODELS_UPDATED` with the catalog refresh; `PROMPT_CHANGED` stays in `PromptService` | §6 events row, L3 |
| 11 | L4 live proxy surface is `getProxyBase`, `AI.proxy`, `getEndpoint`, the catalog `proxyPath`s, `AIProviderService.ts:821`; `providerNeedsProxy` is a comment | L4 delete 1 (`:821` dies with the file at L3) |
| 12 | L4/⑥ loses AUTH classification for a bad Claude key on `models.list`; needs `test()` on `/v1/messages` or the real-key measure first | L4 preconditions (R-AI-4 requires both) |
| 13 | L6 adds `JodieHeader.tsx`, `JjodieContext.ts`; drops `MarkdownMessage.tsx`; `JodieMinimized.tsx`; `Jjie…` matches nothing | L6 |
| 14 | L6 Doc types need a destination | L6, O-4 |
| 15 | L6 docs: CLAUDE.md §16 `useAIProviderPreference` and `<ProviderSelector …>` are stale | L6 docs |

## 9. Spike measures (§B)

### Packages (§B1, installed `--save-exact`, Node v22.22.2, dist-tags of 2026-11-02)

| Package | Version (published) | Licence | Prod transitive deps | Browser ESM entry |
|---|---|---|---|---|
| `openai` | 7.47.0 (2026-10-31) | Apache-2.0 | 0 (7 optional peers) | universal `index.mjs`, fetch-based; `engines.node >=22` |
| `@anthropic-ai/sdk` | 1.3.0 (2026-10-23) | Apache-2.0 | 7 | universal `index.mjs`; `browser` field swaps `internal/node.*` |
| `@google/genai` | 2.32.0 (2026-10-29) | Apache-2.0 | 40, mostly Node-side | explicit `browser` condition, `dist/web/index.mjs`; `engines.node >=20` |

The build images are `node:22-alpine` (`Dockerfile:2`, `Dockerfile.microservices:2`).

### Bundle size (§B2, esbuild 0.27.7, browser ESM, minified, gzip -9, one entry per SDK)

| SDK | Raw bytes | Gzip bytes |
|---|---|---|
| `@anthropic-ai/sdk` 1.3.0 | 347 950 | 77 941 |
| `@google/genai` 2.32.0 | 415 721 | 77 748 |
| `openai` 7.47.0 | 389 180 | 85 938 |
| **total** | 1 152 851 | 241 627 |

### Browser calls (§B3, Chromium via Playwright, origin `http://localhost:3010`, 18 calls)

| Family / arm | Op | Result |
|---|---|---|
| Anthropic / real key | all | **not run**: no key (Q6) |
| Anthropic / invalid | `models.list` | **CORS-blocked**, no status; SDK reports «Connection error.» |
| Anthropic / invalid | `messages.create`, `messages.stream` | 401 readable, ACAO `*`, `authentication_error` |
| Anthropic / preflight | `OPTIONS /v1/models`, `/v1/messages` | 200, ACAO `*`, ACAH includes the browser header and `x-stainless-*` |
| Gemini / real | `models.list` | 200, 60 models |
| Gemini / real | `generateContent` `gemini-2.5-flash-lite` | 404, «no longer available to new users» (still listed) |
| Gemini / real | `generateContent` `gemini-3.5-flash-lite`, plain / with `inlineData` PDF | 200 / 200 (15 015 ms / 22 825 ms, one sample each) |
| Gemini / invalid | `models.list` | **400**, `API_KEY_INVALID` |
| OpenAI / real | `models.list` | 200, 136 models |
| OpenAI / real | chat and stream `gpt-4.1-nano` | 404, deprecated |
| OpenAI / real | chat and stream `gpt-4o-mini` | **429**, «You have no credits remaining» |
| OpenAI / invalid | `models.list` | 401 readable, ACAO `*` |

Consequences carried into this spec: the Anthropic gate of L4 (§7 L4); RATE vs «no credits» (O-3); `models.list` is not a
guarantee that a model answers, which `resolveModel()` must tolerate (`types/jodie.ts:350` already seeds
`gemini-3.5-flash-lite`).

## 10. Preconditions and open items

**Q6, precondition of L4, not of L1**: Juri adds an Anthropic key to `~/.jjodel-lanes/keys196.env` (and, optionally, credit on
the OpenAI account) for a short real-key re-run of the spike before L4. It does not block L1, L2 or L3.

Open items, facts that neither the report nor the plan settles. Each lane that meets one decides it in its prompt.

- **O-1 (L1), which API-key copy wins at load.** Keys are stored twice: `jjodie_provider_<name>` and
  `jjodie-credentials.providers` (§5). The precedence today is not measured; L1 pins it in a test before the stores replace
  both.
- **O-2 (L1/L2), a home for `dockWidth`.** It is panel UI state inside the credentials blob (`JodieWindow.tsx:208-209`,
  R-JJD-1). A store rewrite that drops unknown fields loses it; L1 preserves the field on round-trip, L2 decides where
  `JodieWindow` reads it.
- **O-3 (L1), OpenAI empty balance.** A 429 for no credits is a `RateLimitError` like a real rate limit; mapped to RATE it reads
  «retry later». The classifier needs the error code if the message should say «no credits».
- **O-4 (L6), the Doc types' destination.** The report suggests `services/DocumentationService.ts` or a
  `types/documentation.ts`; not decided.
- **O-5 (L2), `AIConfig.getStatus` (`types/jodie.ts:876`).** The condition looks inverted; L2 decides whether the label moves
  as-is or is fixed, and says which.
- **O-6 (L1/L2), when the Claude `test()` moves to `/v1/messages`.** R-AI-4 requires it before L4. L2 already routes Test
  connection through `provider.test()`, and the new catalog is direct-only, so a Claude `test()` built on `models.list` would
  read a bad key as NETWORK from L2 onward. Building it on `/v1/messages` in L1 avoids that window; the L1 prompt confirms.
- **O-7 (L2), the Claude live catalog without the Worker.** Until the real-key run (Q6), a valid key's `models.list` from the
  browser is unmeasured. If it is CORS-blocked, the Claude model list falls back to the static seed from L2 onward, where today
  the Worker retry serves it. L2's smoke «live catalog» states which it observed for Claude.
- **O-8 (L2), lane size.** L2 grows from 8 to 13 files with corrections 6-8; rule 19 applies, and the L2 prompt may split it
  (settings surfaces vs Jodie/status surfaces).
