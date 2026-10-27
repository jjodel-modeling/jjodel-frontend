# Discovery — AI providers: false-negative connection test and live model lists

Prompt-ID: P-2026-10-18-0045 · Chat: C-2026-10-18-0035 · Front: release-3-2 · Phase 1, read-only.
Worktree `~/jjodel-w-aiproviders`, branch `ai-providers`, tip `149d3b633`, tree clean at start.
Executor: Anthropic Claude Opus 5.5, session `46fcd61c-e416-41f0-a4c4-ece9ffc5e9e7`.

## 0. Hypotheses under test, goal

- **A.** The four hypotheses H1-H4 of the prompt on the Anthropic false negative ("Test connection"
  always fails, real Jodie calls with the same key sometimes work).
- **C.** The chat's direction: the connection test becomes a call to the listing endpoint, and test
  and model refresh become one operation, browser-direct.

Goal: name the root cause with evidence, map the model registry and its consumers, and say for each
of Anthropic, OpenAI and Ollama whether a live list is feasible from the browser. Phase 2 plan in §D;
decisions stay with the chat.

**Result in one line.** None of H1-H4 is the cause. The test does not call Anthropic at all: it
calls a Cloudflare proxy whose host does not resolve (NXDOMAIN on 2026-10-18), or `localhost:8787`
when the app runs on localhost. The fetch throws whatever the key is, and the row shows "Invalid
key". H2 is confirmed as a second, latent defect: pointing the test at Anthropic directly without
adding the header would still fail, this time on CORS.

Note on scope: the prompt names `src/ai/` as a starting point. That directory does not exist
(`ls frontend/src/ai` → "No such file or directory"). The prompt marks it "not a constraint", so I
went on from `services/AIProviderService.ts` and `types/jodie.ts`, the only files outside the
settings UI that reference `api.anthropic.com`.

## 1. Files read (full paths)

- `/Users/alfonso/jjodel-w-aiproviders/CLAUDE.md`, `docs/PROTOCOL.md` (P1-P13), `docs/decisions.md` (RC-40..RC-49 by grep), `docs/claude-code-log.md` (head)
- `frontend/src/services/AIProviderService.ts` (1-260, 680-1012)
- `frontend/src/types/jodie.ts` (60-570, 750-922)
- `frontend/src/components/settings/AISettingsContent.tsx` (150-409)
- `frontend/src/components/ExplainModal.tsx` (15-50)
- `frontend/src/components/common/ProviderModelSelector.tsx` (grep: 1-113, 167-186)
- `frontend/src/services/__tests__/AIProviderService.test.ts` (grep)
- `docs/discovery/2026-06-13_ai-provider-subsystem.md` (140-280)
- `docs/handover/2026-02-03-cloudflare-worker-anthropic-proxy.md` (20-130)
- `cloudflare-worker/src/index.ts` and `cloudflare-worker/wrangler.toml` from `73827f97b^`, read with `git show` because the directory was removed in `73827f97b` (2026-04-27, "remove unwanted files and folders related to issue #54")
- commit `e197edff0` (#179, "test and chat call the same current model"), an ancestor of HEAD
- Anthropic model facts: the `claude-api` skill reference (`shared/models.md`, cached 2026-10-06)

Probe: `frontend/scripts/smoke/_tmp_aiprov_probe.mjs`, gitignored (`.gitignore:68`, confirmed with
`git check-ignore -v`), not committed. It sends no real key: either a dummy `sk-ant-probe-not-a-key`
or none. Node `fetch` does not enforce CORS, so the probe records the `Access-Control-*` headers a
browser would judge. It is header evidence, not a browser run (P11): the proxy finding below does not
depend on that distinction, but the CORS verdicts do, and a one-line browser check in Phase 2 closes
them.

## A. Root cause of the Anthropic false negative

### A.0 The two paths, side by side

| | Real chat call | Test connection |
|---|---|---|
| Entry | `AIProviderService.chat` → `chatClaude` (`AIProviderService.ts:71`) | `testConnection` → `testClaude` (`AIProviderService.ts:716`) |
| Model | `this.effectiveModel(provider, model)` (`:58`) | `this.chatModel(provider)` (`:709`) → `effectiveModel` (`:134`) |
| URL | `fetch(AI.Claude.endpoint, …)` (`:220`) = `https://api.anthropic.com/v1/messages` (`jodie.ts:402`) | `const proxyUrl = AI.Claude.getEndpoint();` (`:778`) |
| Headers | `x-api-key`, `anthropic-version`, `'anthropic-dangerous-direct-browser-access': 'true'` (`:224-226`) | `x-api-key`, `anthropic-version` only (`:784-785`) |
| Response | `return data.content[0].text;` (`:245`) | `await response.json(); return { success: true };` (`:825-826`) |

`getEndpoint()` (`jodie.ts:228-240`):

```ts
const PROXY_URL = 'https://jjodel-ai-proxy.alfonso99.workers.dev';
const PROXY_LOCAL_URL = 'http://localhost:8787';
if (!this.proxy) return this.endpoint;
...
return (window.location.hostname === 'localhost' ? PROXY_LOCAL_URL : PROXY_URL) + this.proxy;
```

with `AI.Claude.proxy = '/v1/anthropic/messages';` (`jodie.ts:398`). Claude is the only provider
with a proxy: `//AI.Gemini.proxy = '/v1/gemini';` (`jodie.ts:399`) is commented out.

The inconsistency was already recorded on 2026-06-13: "Claude's *chat* path goes **direct** … but
Claude's *test* path goes **through the proxy**" (`docs/discovery/2026-06-13_ai-provider-subsystem.md:39`).
It was not fixed, and the proxy has since disappeared.

### A.1 The real cause (H0): the test calls a proxy that does not exist

Measured 2026-10-18:

```
dig jjodel-ai-proxy.alfonso99.workers.dev  → status: NXDOMAIN, ANSWER: 0
dig alfonso99.workers.dev                  → (empty)
dig api.anthropic.com                      → 160.79.104.10      (positive control)
dig workers.dev                            → 104.18.12.15 …     (positive control)
probe: proxy GET /health                   → status 0, ENOTFOUND
probe: proxy POST /v1/anthropic/messages   → status 0, ENOTFOUND (for each of 3 origins)
probe: local proxy :8787 /health           → status 0, ECONNREFUSED
```

In the same run, api.anthropic.com, api.openai.com and localhost:11434 all answered, so the network
path works and the silence is about the proxy host (§5 "assertion of absence"). The worker's source
left the repo in `73827f97b`. Nothing in the tree deploys it, and `docs/handover/2026-02-03-…md:138-139`
says to "update the subdomain after deploying".

So, on every origin, for every key, valid or not:

- on `localhost` (dev on 3000 and every lane port): `fetch('http://localhost:8787/v1/anthropic/messages')` → connection refused, unless `wrangler dev` happens to be running;
- anywhere else (jjodel.io, the release tree): `fetch('https://jjodel-ai-proxy.alfonso99.workers.dev/…')` → DNS failure.

Both throw `TypeError: Failed to fetch`, which `testClaude` turns into this (`AIProviderService.ts:830-834`):

```ts
if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return { success: false, error: 'Network error. The proxy service may be unavailable.' };
```

`AISettingsContent.handleTestConnection` then records the failure as a key verdict
(`AISettingsContent.tsx:174-177`):

```ts
config.lastTested = Date.now();
config.lastTestOk = false;
config.enabled = false;
config.save();
```

and the row shows it as `keyInvalid` (`:258`, `const keyInvalid = isConfigured && config.lastTested != null && config.lastTestOk === false;`),
rendered `{keyInvalid ? 'Invalid key' : activeModelLabel(name)}` (`:327`). The actual error text
reaches the user only as the hover `title` of the "Failed" button (`:397`).

**Why the chat still works.** `config.enabled = false` gates nothing on the chat path.
`JodieConfig.getEnabledProviders` filters on `isConfigured()`, not on `enabled`
(`jodie.ts:908-914`: `return !!config?.isConfigured();`), and `chat()` checks only `config.isConfigured()` (`AIProviderService.ts:47`).
The chat therefore goes straight to api.anthropic.com with the header and succeeds whenever key and
model are good. The failed test is purely cosmetic, which matches the report: "key accepted, test
always fails, real calls work".

Expected tooltip text for Alfonso to confirm: "Network error. The proxy service may be unavailable."
If he sees anything else, this finding does not explain his case.

### A.2 Verdicts on H1-H4

- **H1, fixed model in the test: refuted.** Since #179 (`e197edff0`, an ancestor of HEAD) the test
  sends `const model = this.chatModel(provider);` (`AIProviderService.ts:709`), which resolves
  through the same `effectiveModel` as `chat()` (`:58`, `:101-125`). No model ID is hard-coded on
  the test path. Residual gap: `chatModel` uses the **chat** feature's pick (`:133`). The other
  features (`documentation`, `mappings`, `explain`, `scriptblock`) keep their own per-feature model,
  so a test can still disagree with them. That is not the reported symptom.
- **H2, missing header: confirmed, latent.** The test omits `anthropic-dangerous-direct-browser-access`
  (`:782-786`), while the chat sends it (`:226`). Probe, preflight from `Origin: http://localhost:3000`:

  ```
  OPTIONS /v1/messages, request-headers content-type,x-api-key,anthropic-version
      → 400, ACAO null, body "Disallowed CORS origin"
  OPTIONS /v1/messages, same + anthropic-dangerous-direct-browser-access
      → 200, ACAO "*"
  POST /v1/messages dummy key, no header   → 401, ACAO null   (a browser blocks the read)
  POST /v1/messages dummy key, header      → 401, ACAO "*"    (a browser reads the 401)
  ```

  Today H2 is masked by H0: the request never reaches Anthropic. It becomes the cause the moment
  the URL is switched to direct without the header.
- **H3, wrong response shape: refuted.** On 2xx the test does not read the body's shape:
  `await response.json(); return { success: true };` (`:825-826`). `choices` appears only in the
  OpenAI-compatible transport (`:184-187`).
- **H4, transient errors read as a bad key: confirmed for the UI, not the cause of "always".** Every
  non-2xx and every thrown fetch ends in `success: false`. Only 401, 429, 400 and 403 get a hint
  (`:812-820`); 529, 500 and 503 come out as `API Error (529)` plus the body. Whatever the status,
  the row then says "Invalid key" (`AISettingsContent.tsx:258`, `:327`). No timeout exists: neither
  `testClaude` nor `chatClaude` passes an `AbortSignal`, so a hung request leaves "Testing..." up
  indefinitely. A 529 explains a failure *sometimes*, not *always*.

### A.3 "Real calls sometimes work": not determinable from code; two candidates

1. **A retired model in the registry.** `AI.Claude` still offers `claude-3-5-sonnet-latest`,
   `claude-3-opus-latest` and `claude-3-haiku-20240307` (`jodie.ts:320-322`, marked deprecated but
   selectable). Claude Sonnet 3.5 retired on 2025-10-28 and Claude Opus 3 on 2026-01-05; Claude
   Haiku 3's announced retirement was 2026-04-19 (`claude-api` skill, `shared/models.md:104-114`).
   Claude is not in `RETIRING_PROVIDERS` (`jodie.ts:130`, `['Gemini']`), so a persisted retired
   Claude ID is sent unchanged and gets a 404. `claudeLegacyIdMap` even maps
   `'claude-3-5-sonnet-20241022'` to `'claude-3-5-sonnet-latest'` (`jodie.ts:102`), retired onto
   retired. A user whose chat or other feature points at one of these sees failures on that feature
   only.
2. **Transient 529/429** on `chatClaude`, reported as `Claude API error: 529 - …` (`:238`).

To tell them apart I would need the failing call's error text. Open question Q1.

## B. Current model registry

### B.1 Where the lists live, who reads them, where the choice is persisted

- **Shape.** `AI.versions: Dictionary<string, AIVersion> = {};` (`jodie.ts:190`), filled by
  `add(name, label, pdf, vision, deprecated, contextWindow)` (`:223-227`). `AIVersion` is an exported
  class `{ label; capabilities: {pdf, vision}; deprecated; contextWindow? }` (`:262-280`). The static
  lists are `jodie.ts:308-390`: GPT 5 entries (`gpt-4o` … `gpt-3.5-turbo`), Claude 7 (4 current,
  3 deprecated), Ollama 7 tags (`llama3.2` … `qwen2.5`), and the other providers.
- **Persistence, two places, both `localStorage`:**
  - per provider: `AIConfig.model` in `jjodie_provider_<name lowercased>` (`storageKey`, `jodie.ts:211`),
    written by `save()` (`:772-783`), which also cascades the whole `JodieConfig` into
    `jjodie-credentials` (`AI.STORAGE_GLOBAL_CONFIG`, `:184`);
  - per feature: `ProviderPreference { providerId; modelId?; updatedAt }` (`:81-87`) in
    `jjodel_provider_<feature>` (`AI.STORAGE_PREFIX`, `:183`), written by `setPreferred` (`:532-533`).
  Resolution: the per-feature `modelId`, else `AIConfig.model` (`resolveFeatureSelection`, `:568-570`;
  `effectiveModel`, `:112`).

### B.2 When the persisted model is not in the list

- **Call path.** For Claude, OpenAI and Ollama the unlisted ID is **kept and sent**:
  `resolveCurrentModelId` only moves IDs for providers in `RETIRING_PROVIDERS` (`jodie.ts:139`,
  `if (!id || !RETIRING_PROVIDERS.includes(provider)) return id;`). The one exception is an ID found
  in **another** provider's registry, which `effectiveModel` discards for the provider's own
  (`AIProviderService.ts:118-123`, with a `console.warn`). Gemini alone is moved silently at load
  by `retireModels` (`jodie.ts:681`), which keeps `replacedModel` (`:449-451`) for a notice
  (`AISettingsContent.tsx:228-233`).
- **Picker.** `ProviderModelSelector` shows `'Select a model'` when the selected ID has no registry
  entry (`ProviderModelSelector.tsx:100`, `if (!selectedModelId || !selectedVersion) return 'Select a model';`),
  even though the call is made with that ID. Settings shows the raw ID instead
  (`AISettingsContent.tsx:223`, `AI[name].versions[model]?.label || model`).
- So today a model that disappears is neither flagged nor blocked. The call fails at the provider,
  except on Gemini, where the model is replaced at load with a notice.

### B.3 Every consumer of the provider/model types

Gathered with `command grep -rl` over `frontend/src`. Positive control: the same command finds
`getPreferredModel` in 9 files.

| Symbol | Files |
|---|---|
| `AI[…].versions` | `types/jodie.ts`, `services/AIProviderService.ts`, `components/settings/AISettingsContent.tsx`, `components/settings/ProviderSettings.tsx`, `components/common/ProviderModelSelector.tsx`, `components/Jodie/ProviderSelector.tsx`, `components/Jodie/SettingsModal.tsx`, `jjtl/views/SuggestedMappingsPanel.tsx`, `pages/settings/AIAssistantSettings.tsx`, `pages/settings/ProviderConfigModal.tsx`, `services/__tests__/AIProviderService.test.ts` |
| `AIVersion` | `types/jodie.ts`, `AISettingsContent.tsx`, `ProviderModelSelector.tsx` |
| `AI.getActiveVersion` | `components/Jodie/Jodie.tsx:191` |
| `testConnection` | `AISettingsContent.tsx:162` (primary Settings), `pages/settings/ProviderConfigModal.tsx:78` (route `/settings`), `components/Jodie/SettingsModal.tsx:60` (exported from `components/Jodie/index.ts:12`, not rendered anywhere: no `<SettingsModal` in `src`, control `<ProviderConfigModal` found), the test file |
| `getPreferredModel` / `setPreferred` | `jodie.ts`, `AIProviderService.ts`, `ProviderModelSelector.tsx`, `ExplainModal.tsx`, `jjtl/views/SuggestedMappingsPanel.tsx`, `jjtl/services/AIMatcher.ts`, `services/DocumentationService.ts`, `components/Jodie/console/providers/jjodieProvider.ts`, the test file |
| `ProviderPreference` | `jodie.ts`, `components/abstract/tabs/DocumentationTab.tsx` |
| `isModelOfProvider` / `isForeignModel` / `resolveCurrentModelId` | `jodie.ts`, `AIProviderService.ts`, the test file |
| `lastTested` / `lastTestOk` | `jodie.ts`, `AISettingsContent.tsx`, `AIAssistantSettings.tsx`, `ProviderConfigModal.tsx` |
| `retireModels` / `replacedModel` | `jodie.ts`, `AISettingsContent.tsx`, the test file |

Other Anthropic call sites: `ExplainModal.tsx:28-34` streams straight to `AI.Claude.endpoint` with
the header. No Claude call except the test uses `getEndpoint()`.

### B.4 What can be reused

- **Optional fields on `AIConfig`.** `lastTested`, `lastTestOk` and `replacedModel` (`jodie.ts:445-451`)
  are the precedent for persisting per-provider state in `jjodie_provider_<name>` without a
  migration: `U.toInstanceOf` restores them as-is (`:481`).
- **Re-read on change.** `ProviderModelSelector` already re-reads on `AIEvents.SETTINGS_CHANGED` and
  `AIEvents.PROVIDER_CHANGED` (`:58-59`, `tick`, `useMemo`), and `save()` dispatches
  `PROVIDER_CHANGED` (`jodie.ts:779-781`). A refreshed list reaches the picker with no new event.
- **Designed for this.** `ProviderModelSelector.tsx:15-17` carries a "NOTE(future — Pattern C): dynamic model
  discovery would merge provider-endpoint responses with this static registry", and `jodie.ts:94-97`
  says the legacy maps should pre-filter fetched IDs.
- **"Last updated".** `ProviderPreference.updatedAt` (epoch ms) and `AIConfig.lastTested` (epoch ms)
  give the convention. No cache layer with a TTL exists for network data: the TTLs in the tree are
  `utils/LazyOCL.ts:49` (OCL, 2 s) and `editor-v2/problems/registry.ts:133`, both unrelated.
- **Names checked as free** (`command grep -rl`, 0 files each, control above): `listModels`,
  `liveModels`, `modelsFetchedAt`, `modelsEndpoint`, `ModelListResult`, `jjodel_models_`.
  **Taken, avoid:** `getModelInfo`, both in `components/editor-v2/sync/canvasToJjom.ts:1387`
  (critical zone, unrelated) and in `types/jodie.ts:1177`; `PROVIDER_ENDPOINTS` (`jodie.ts:1155`,
  empty).
- **Save moment.** None exists. Settings writes the key on every keystroke
  (`AISettingsContent.tsx:352-375`, `config.apiKey = val; … config.save();`), so "fetch at key save"
  needs a trigger Phase 2 defines (§D, R4).

## C. Feasibility of the live lists (browser, current headers)

| Provider | Endpoint | CORS from `http://localhost:3000` | Pagination | Filter needed |
|---|---|---|---|---|
| Anthropic | `GET https://api.anthropic.com/v1/models` | **Yes, with the header the chat already sends.** Preflight with `anthropic-dangerous-direct-browser-access` → 200, ACAO `*`; without it → 400 "Disallowed CORS origin". 401 on a dummy key carries ACAO `*` when the header is present. | Cursor: `limit` (default 20, max 1000), `after_id`/`before_id`, response `has_more`/`first_id`/`last_id` (shape documented in the `claude-api` skill reference; not executable without a key). One call with `limit=1000` covers today's catalogue. | None for family: every entry is a Claude model. Fields: `id`, `display_name`, `created_at`, `max_input_tokens`, `max_tokens`, `capabilities`, so `vision`/`pdf` can come from the API instead of the static table. |
| OpenAI | `GET https://api.openai.com/v1/models` | **Yes.** Preflight → 200, ACAO `*`, allow `authorization`; GET without a key → 401, ACAO `*`, `"Missing bearer authentication in header"`. | None: one `{object:"list", data:[…]}`. | **Required.** The list mixes chat, embedding, audio, image, moderation and realtime models, with only `id`, `created`, `owned_by`. **Prefixes returned today: not observable without a key.** Models served only by the Responses API would fail on the `/v1/chat/completions` transport Jodie uses (`jodie.ts:401`); which ones are in the list is equally unobservable here. |
| Ollama | `GET <host>/api/tags` (or `/v1/models`) | **Yes from localhost.** `/api/tags` → 200, ACAO `http://localhost:3000` (origin echoed); OPTIONS → 204. From a non-local origin (jjodel.io) it depends on `OLLAMA_ORIGINS` on the user's machine: not measured. | None. | Light. The local list included cloud-proxied tags (`glm-5.2:cloud`, with `remote_host: https://ollama.com:443`) alongside local ones (`qwen3.5:9b`). Embedding-only models would need `/api/show` capabilities to exclude. The host must come from `config.baseUrl`, which may be a full chat URL (`resolveChatCompletionsUrl`, `AIProviderService.ts:145-150`), so the root has to be derived. |

The probe needed no proxy for any of the three. The proxy is not a dependency of the live lists.

A risk for the test-by-listing direction: a listing 200 proves the key **authenticates**, not that it
can **generate**. An Anthropic key with no credit balance, or an OpenAI key without access to the
chosen model, lists fine and then fails on chat. #179 aimed for "a green test means the chat
works"; listing gets close to that only when the selected model is also checked against the
returned list (§D step 2). Not measurable without a real key.

## D. Proposal for Phase 2 (decisions stay with the chat)

**Step 0, a hotfix that can ship alone (fast lane, before the feature).** In `testClaude`: call
`AI.Claude.endpoint` instead of `AI.Claude.getEndpoint()` (`:778`) and add the header (`:786`), plus
one test in `AIProviderService.test.ts` on the URL and headers. Two lines plus a test, and the false
negative is gone for 3.1.x. `AI.Claude.proxy` and `getEndpoint` stay (Rule 9, `// TODO: cleanup`).
Mutation bench: restore the proxy URL, then drop the header; each must turn the test red.

**Feature, in order** (more than 5 files: rule 19 applies at Phase 2 start; no critical-zone file):

1. `frontend/src/types/jodie.ts`: per-provider listing descriptor (URL builder, auth, parser,
   filter) next to the registry; optional `AIVersion` fields for live entries (Rule 11); the cache
   shape and its storage key; merging the cached live entries into `AI[p].versions` at load, with
   the static entries as fallback.
2. `frontend/src/services/AIProviderService.ts`: `listModels(provider)` with an `AbortSignal`
   timeout, returning one of `ok` (models) / `invalid-key` (401, 403) / `unreachable` (network,
   DNS, timeout, 5xx) / `overloaded` (529, 429). `testConnection` for Claude, GPT and Ollama
   delegates to it, so test and refresh are one operation. `{ success, error? }` gains an optional
   outcome field (Rule 11). The selected model is checked against the list (step 5).
3. `frontend/src/components/settings/AISettingsContent.tsx`: three distinct row states replacing the
   blanket "Invalid key" (`:258`, `:327`); a refresh button with "updated <relative time>"; fetch on
   key commit (R4).
4. Background refresh when the cache is older than 24 h (R6), silent on failure: the cached or
   static list stays.
5. `frontend/src/components/common/ProviderModelSelector.tsx`: a selected model absent from the live
   list is shown by its ID with a warning, never `'Select a model'` and never swapped. Settings shows
   the same flag.
6. `frontend/src/pages/settings/ProviderConfigModal.tsx`: secondary UI, same outcomes (or leave it,
   R8). `components/Jodie/SettingsModal.tsx` is not rendered: leave it.
7. Tests: `services/__tests__/AIProviderService.test.ts` (fetch is already stubbed there, `:21`),
   with a mutation bench on each outcome mapping and on the filter.

Open choices:

- **R1, OpenAI filter: prefix rule or allowlist of families.**
  Recommended: an include-prefix rule (`gpt-`, `o<digit>`, `chatgpt-`) with an exclude list of substrings (`embedding`, `audio`, `realtime`, `transcribe`, `tts`, `image`, `search`, `instruct`, `moderation`), both data constants in `jodie.ts`, because an allowlist of families goes stale exactly like today's list.
- **R2, Claude test transport.**
  Recommended: direct to api.anthropic.com with the header, as chat and ExplainModal already do; do not revive the proxy.
- **R3, where the cache lives.**
  Recommended: a separate `localStorage` key per provider (`jjodel_models_<provider>`, verified free) holding `{ fetchedAt, models }`, so the credentials blob `jjodie-credentials` and its export stay free of catalogue data.
- **R4, the "key saved" trigger** (none exists today, §B.4).
  Recommended: fetch on the key field's blur and on the Test/Refresh button, never per keystroke.
- **R5, green or red when the key lists fine but the selected model is not in the list.**
  Recommended: key green, model amber ("<id> is not offered by this key"), and the chat still sends the user's choice.
- **R6, when the background refresh runs.**
  Recommended: at most once per session, on first mount of the model picker or of Jodie, if `fetchedAt` is older than 24 h; not in `JodieConfig.load`, which runs at boot for every user.
- **R7, Ollama cloud tags.**
  Recommended: keep them, labelled "cloud", since the user pulled them.
- **R8, scope for 3.2.0.**
  Recommended: Claude, GPT and Ollama as asked, plus `ProviderConfigModal` for parity; the descriptor stays generic so Mistral, Groq, DeepSeek and Kimi (all with `/v1/models`) are a registry addition later.
- **R9, retired Claude entries in the static fallback** (`jodie.ts:320-322`, §A.3).
  Recommended: once live lists exist, the fallback drops the three retired IDs and the flag of step 5 covers users still on them; this needs a decision because it changes what the static picker shows.

## E. Dependencies and risks

- The live CORS verdicts are inferred from headers (§1). One browser check in Phase 2 on the dev
  server (direct `fetch` of `/v1/models` with a dummy key, expect a readable 401) closes it.
- Listing proves authentication, not generation (§C, last paragraph).
- OpenAI filter correctness cannot be measured without a key: the static list remains the fallback,
  and a wrong filter shows up as a missing or extra model, never as a broken chat.
- Any change to `testConnection` touches all three settings UIs. Only two are mounted.
- The worker URL is still hard-coded in `getEndpoint` (`jodie.ts:231`). Once the proxy is gone the
  constant is dead for Claude, but per Rule 9 it is not removed.
- No critical-zone file (CLAUDE.md §3.1) is involved anywhere in §D.

## F. Open questions

- **Q1.** When the chat fails for Alfonso, what is the error text: `404 … not_found_error` (retired
  model, §A.3.1) or `529 overloaded_error` / `429` (transient)? And does the "Failed" tooltip read
  "Network error. The proxy service may be unavailable."? Recommended: Alfonso hovers "Failed" once and copies the next chat error; both are one line.
- **Q2.** Is the Cloudflare worker meant to come back for any provider (Gemini was routed through it
  once)? Recommended: no; every provider in scope works browser-direct, and the hotfix removes the last caller.
- **Q3.** Ship Step 0 as a separate 3.1.x fast lane before the feature? Recommended: yes; it removes the user-visible false negative today, with a two-line diff.
- **Q4.** The prompt says the report is the only file written, so no `docs/log-inbox/` entry was
  added for this lane (P9 / rule 16 would ask for one). Recommended: the closing lane of Phase 2 writes the entry for both phases, citing this report.
