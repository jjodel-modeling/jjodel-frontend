# Discovery: AI proxy Worker back in the trunk, configurable proxy URL, dynamic model lists

- Prompt-ID: P-2026-10-18-1146 (`docs/prompts/claude_2026-10-18_1146_prompt_discovery_ai_proxy_dynamic_models.md`)
- Chat: C-2026-10-17-1518, front maintenance, lane full (discovery, read-only)
- Session: `ai-models-discovery`, tree `~/jjodel-w-aimodels`, branch `ai-models-discovery`, HEAD `1e9e616fa`
- Executor: Claude Opus 5.5 (`claude-opus-5-5`), effort high
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

Tags: **[measured]** = run in this phase on 2026-10-18 against HEAD `1e9e616fa` or the network; **[read]** = read from a file or a doc.

## 0. Summary

1. **The Worker is used by one call today: Claude's connection test.** Claude chat goes direct to Anthropic, with `anthropic-dangerous-direct-browser-access`. Gemini has gone direct since `9220e286a` (2026-08-07), which commented out `AI.Gemini.proxy`. Context item 1 of the prompt ("Claude and Gemini go through a Cloudflare Worker") holds only for `testClaude`.
2. **All three `/models` endpoints answer a browser preflight from `http://localhost:3000`** [measured]. Anthropic needs the `anthropic-dangerous-direct-browser-access` header; without it the preflight answers 400. Error responses (401 and 403) carry `Access-Control-Allow-Origin` too, so the browser can read them. The Worker's `models` routes, which Alfonso has already decided on, are therefore not needed for CORS. I record this and do not reopen the decision (§9, item 1).
3. **The Worker has an origin-check hole** [measured]: `Origin: https://localhost.evil.example` passes (`origin.includes('localhost')`). `http://127.0.0.1:3000` is refused. A refused origin gets `403` with `Access-Control-Allow-Origin: https://jjodel.io`, so the browser shows a CORS failure, never the 403. The `403` hint in `testClaude` can never be reached from the browser.
4. **Dev breakage has a known cause**: `9220e286a` changed `getEndpoint()` from "localhost → direct" to "localhost → `http://localhost:8787`" [read].
5. **Dynamic lists can be added without breaking the synchronous consumers.** The cached list has to be merged into `AI[p].versions` synchronously at module load, before `JodieConfig` and `retireModels` run, and a refresh event has to reach the two `useMemo` consumers that would otherwise never recompute.
6. **The current Gemini behaviour (#179) conflicts with Alfonso's rule "flagged, never silently swapped".** `resolveCurrentModelId` plus `retireModels` swap a retired Gemini model at load and leave a Settings notice. For dynamic providers this has to become flag-only (§3.6).

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The restored Worker equals `73827f97b^:cloudflare-worker` except for deps and origins | **Holds** [measured]. `src/index.ts`, `README.md` and `tsconfig.json` are identical. `package.json` differs only in the versions of `@cloudflare/workers-types` and `wrangler`. `wrangler.toml` differs only in `ALLOWED_ORIGINS`. |
| H2 | Claude and Gemini traffic goes through the Worker | **Partly falsified** [read]. Only `testClaude` uses the Worker (§2.1). |
| H3 | The `/models` endpoints need the Worker because of CORS | **Falsified** [measured] (§4.1). |
| H4 | The Worker already accepts `localhost:3000` and `:5173` | **Holds, and is wider than intended**: any origin containing `localhost`, on any port and any host [measured]. |
| H5 | `versions` can become async without consumer changes | **Falsified** [read]. Module-load defaults, migrations and two `useMemo`s depend on it (§3.2). |
| H6 | A worker folder in the repo would be picked up by a gate | **Falsified** [read] for both locations. Only a `CLAUDE.md` inside it would be picked up (§1.3). |
| H7 | The `.gitignore` or a cleanup rule caused `73827f97b` | **Falsified** [read]. No such rule exists. The commit was a manual cleanup "related to issue #54" (§1.2). |

## Files read

- `frontend/src/types/jodie.ts` (lines 90-260, 262-421, 676-730; the explorer agent read it whole)
- `frontend/src/services/AIProviderService.ts` (lines 695-965; grep over the whole file for endpoints and fetches)
- `frontend/src/components/common/ProviderModelSelector.tsx` (lines 52-100; grep for `legacy`)
- `frontend/src/components/settings/AISettingsContent.tsx` (lines 155-180, 225-235)
- `frontend/src/codegen/setting.ts:28-34`, `frontend/src/events/registry.ts:111-115`
- Explorer-agent reads, with conclusions cited below: `Jodie/Jodie.tsx`, `Jodie/SettingsModal.tsx`, `Jodie/ProviderSelector.tsx`, `pages/settings/ProviderConfigModal.tsx`, `pages/settings/AIAssistantSettings.tsx`, `settings/ProviderSettings.tsx`, `jjtl/views/SuggestedMappingsPanel.tsx`, `services/__tests__/AIProviderService.test.ts`, `redux/reducer/reducer.ts`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `scripts/tsconfig.json`, `package.json`, `.env.development`, `.env.production`, `.env.staging`, root `.gitignore`, `scripts/generate-agents.mjs`, `scripts/gates/check-scripts.ts`, `scripts/gates/check-addonly.ts`, `scripts/lane-run.mjs`, `scripts/smoke/states.ts`
- `~/jjodel-proxy/cloudflare-worker/{src/index.ts, wrangler.toml, package.json, tsconfig.json, README.md}` (read-only, outside the tree)
- `Dockerfile`, `Dockerfile.microservices`, `.github/workflows/*.yml` (grep)
- Earlier reports: `docs/handover/2026-02-03-cloudflare-worker-anthropic-proxy.md`, `docs/discovery/2026-06-13_ai-provider-subsystem.md` (grep), `docs/discovery/discovery_2026-09-03_ai_surfaces_inventory.md` (grep), `docs/discovery/discovery_2026-09-18_custom_provider_model.md`, `docs/audit-ai-system.md` (grep)
- Commits: `73827f97b`, `9220e286a`, `5fff49b29`

## COSA 1: the Worker in the trunk

### 1.1 Diff of the restored copy against `73827f97b^:cloudflare-worker` [measured]

Each file was compared with `diff` against `git show 73827f97b^:cloudflare-worker/<f>`:
- `src/index.ts` (264 lines), `README.md` and `tsconfig.json` are identical.
- `package.json`: `"@cloudflare/workers-types": "^4.20240129.0"` became `"^5.20261018.1"`, and `"wrangler": "^3.28.0"` became `"^4.151.1"`.
- `wrangler.toml`: `ALLOWED_ORIGINS` gained `https://app.jjodel.io,https://beta.jjodel.io`. It now holds **six** origins, not the five the prompt says: `jjodel.io`, `www.jjodel.io`, `app.jjodel.io`, `beta.jjodel.io`, `localhost:3000` and `localhost:5173`.
- `compatibility_date = "2024-01-29"` was not changed.
- The restored folder also holds `node_modules/`, `.wrangler/` (`state`, `tmp`) and a `package-lock.json` regenerated for the new versions. `~/jjodel-proxy` is not a git repo.

### 1.2 Why it was removed [read]

- `73827f97b` (Juri Di Rocco, 2026-04-27), message «fix: remove unwanted files and folders related to issue #54».
- It touched 1671 files, 1657 of them under `cloudflare-worker/`, almost all of those in `cloudflare-worker/node_modules`. Besides the six source files it deleted the root `package-lock.json` and `scripts/extract-bi-paths.js`, and moved stray root `.md` files into `docs/`.
- Reading: the folder went out together with its committed `node_modules` in a root cleanup. No `.gitignore` rule or script caused the removal.
- `.gitignore:60` `/cloudflare-worker/node_modules` dates from `5fff49b29` (2026-03-02) and is still there. It did not untrack the `node_modules` that had already been committed.
- Issue #54 itself could not be read: `gh` is not authenticated in this shell («To get started with GitHub CLI, please run: gh auth login»). Searching `docs/` for `#54` returns only this prompt.

### 1.3 What the trunk copy must contain, and where

Contents:
- `package.json` (as restored)
- `package-lock.json` (as restored)
- `tsconfig.json`
- `wrangler.toml` with the six origins
- `src/index.ts`
- `README.md`, rewritten in English. The current one is the February one. It should say why the folder exists (browser-side calls to Anthropic need it for the connection test, and as a CORS fallback), deploy with `npx wrangler login` and `npm run deploy`, run locally with `npm run dev` on `:8787` plus the opt-in env var of §2, the `/health` check, and a warning: "do not delete: the deployed Worker has no other source; it vanished once (NXDOMAIN, 2026-10-18)".
- A folder-local `.gitignore` with `node_modules/`, `.wrangler/` and `.dev.vars`. Today only `node_modules` is covered, by root `.gitignore:60`. A search of `.gitignore` for `worker`, `wrangler` and `cloudflare` finds only that line, and the positive control is that same line.

Not to commit: `node_modules/`, `.wrangler/`.

Location: **root `cloudflare-worker/`** (recommended). Reasons [read]:
- Root `.gitignore:60` already anticipates that path.
- `Dockerfile:8` and `Dockerfile.microservices:8` run `COPY frontend/ .`, so a folder under `frontend/` would enter the image build stage. At the root it stays out.
- Gates, all of which ignore both locations:
  - `typecheck`: `frontend/tsconfig.json` includes `src` only.
  - `typecheck:scripts`: `smoke/**`, `gates/**`.
  - `vitest` includes `src/**/__tests__`, `scripts/gates/__tests__`, `scripts/hooks/__tests__` (`frontend/vitest.config.ts:15`).
  - `check:scripts` walks `frontend/scripts` only (`gates/check-scripts.ts:30`).
  - `check:addonly` covers log files only (`gates/check-addonly.ts:6-7`).
  - `build` is reachable only through imports.
  - There is no lint script.
- Exception: `scripts/generate-agents.mjs:62-68` walks the whole repo for `CLAUDE.md`. So: **no `CLAUDE.md` in the worker folder**, a README only.
- CI workflows run `npm i` and `build` with `working-directory: ./frontend` (`staging_test-jjodel(staging).yml:27`), so a root folder is not built there.

Keeping it from being removed again:
- The README warning.
- A line in `docs/CODEBASE-MAP.md` §18.
- The local `.gitignore`, so `node_modules` can never be committed again. That was the actual reason for the cleanup.

### 1.4 Worker defects found [measured on the deployed Worker, keyless requests]

| Request | Answer | Consequence |
|---|---|---|
| `POST /v1/anthropic/messages`, `Origin: https://localhost.evil.example` | `401 {"error":"Missing x-api-key header"}`, ACAO `https://localhost.evil.example` | The origin check passes for any host containing `localhost`. Source: `src/index.ts:37` and `:52`, `(allowed.includes('localhost') && origin.includes('localhost'))`. |
| `POST`, `Origin: http://127.0.0.1:3000` | `403 {"error":"Origin not allowed"}`, ACAO `https://jjodel.io` | A 127.0.0.1 dev session is refused. |
| `POST`, `Origin: https://evil.example` | `403`, ACAO `https://jjodel.io` | In a browser this is a CORS failure (`TypeError: Failed to fetch`), not a readable 403. So `AIProviderService.ts:818-819` («Access denied. Origin not allowed by proxy.») cannot be reached, and the user reads «Network error. The proxy service may be unavailable.» (`:833`). |
| No `Origin` | allowed (`src/index.ts:50` `if (!origin) return true;`) | Anyone can use it as an open relay from curl. The impact is limited: they bring their own key and only spend the free-tier quota. |
| `GET /v1/anthropic/models` | `404 {"error":"Not found","availableRoutes":[...]}` | The route does not exist yet, as expected. |

Fix for slice (a): parse `new URL(origin)` and accept `hostname === 'localhost' || hostname === '127.0.0.1'` on any port, plus the exact listed origins. On a refused origin, send no ACAO (or the requesting origin with a 403) so the client can tell the cases apart. Add `GET` routes. `Access-Control-Allow-Headers` (`src/index.ts:43`) must keep `x-api-key`, `anthropic-version` and `x-goog-api-key`. It does not need `anthropic-dangerous-direct-browser-access`, because the Worker does not forward it.

## COSA 2: proxy URL

### 2.1 Readers [read]

- `getEndpoint()` is at `types/jodie.ts:228-240`. The constants are function-local and not exported: `:231` `const PROXY_URL = 'https://jjodel-ai-proxy.alfonso99.workers.dev';` and `:232` `const PROXY_LOCAL_URL = 'http://localhost:8787';`. Selection at `:239`: `return (window.location.hostname === 'localhost' ? PROXY_LOCAL_URL : PROXY_URL) + this.proxy;`.
- Only Claude has a proxy: `:398` `AI.Claude.proxy = '/v1/anthropic/messages';` and `:399` `//AI.Gemini.proxy = '/v1/gemini';` (commented out by `9220e286a`, Riccardo Belliato, 2026-08-07, «Fixed Gemini calls and Custom endpoint»).
- So `getEndpoint()` returns the direct endpoint for every caller except Claude. The callers are all in `AIProviderService.ts`, at lines 322, 377, 431, 528, 581, 612, 720, 725, 727, 731, 735, 778 and 847.
- Only `:778` (`testClaude`) reaches the Worker.
- `chatClaude` does not use it. At `:220` it calls `fetch(AI.Claude.endpoint, {` with `:226` `'anthropic-dangerous-direct-browser-access': 'true',`.
- There are no other readers in `frontend/src` or `frontend/scripts`. The explorer ran `command grep` for `getEndpoint`, `jjodel-ai-proxy` and `localhost:8787`. The positive control is the `jodie.ts` hits.
- Origin of the dev breakage (`9220e286a`, diff of `jodie.ts`): `- if (!this.proxy || window.location.hostname === 'localhost') return this.endpoint;` became `+ if (!this.proxy) return this.endpoint;` plus the localhost branch to `:8787`.
- Hostname rule: `127.0.0.1`, a LAN IP and `[::1]` all get the production Worker. Of those, only localhost is accepted by the Worker (§1.4).

### 2.2 Env variables today [read]

- `import.meta.env` is read for `VITE_CODEGEN` at `codegen/setting.ts:31`, with the idiom `// @ts-ignore -- env is not on ImportMeta ... if (import.meta.env.VITE_CODEGEN !== 'true')`. Also `EditorV2.tsx:418` and `AdvancedSettings.tsx:12`.
- `.DEV` is read at `portDistribution.ts:284` and `SmokeBoot.tsx:35`.
- `redux/reducer/reducer.ts:1477-1481` copies the whole env into `windoww.process.env` and mirrors `VITE_X` to `JODEL_X`. Any `VITE_*` value is therefore public in the bundle, which is fine for a URL.
- There is no `ImportMetaEnv` typing: `vite-env.d.ts` declares asset modules only. `vite.config.ts:95-100` has `define` and no `envPrefix`.
- `.env.development`, `.env.production` and `.env.staging` under `frontend/` are tracked. `.gitignore:15-18` ignores `.env.local`, `.env.development.local`, `.env.test.local` and `.env.production.local`.

### 2.3 Proposal

- Add `VITE_AI_PROXY_URL`, read once in `jodie.ts` with the `codegen/setting.ts` idiom.
- Default when the variable is unset, in every mode: `https://jjodel-ai-proxy.alfonso99.workers.dev`. No `.env*` change is needed.
- Opt-in for a local Worker: `VITE_AI_PROXY_URL=http://localhost:8787` in `frontend/.env.development.local` (gitignored), documented in the Worker README.
- Remove the `hostname === 'localhost'` branch. This restores "dev works with no `wrangler dev`".
- Tracked `.env.*` files are not touched, so production and staging builds keep the default.

### 2.4 Ports [read]

- Vite: `server.port: 3000` (`vite.config.ts:53`).
- 3001: the trunk dev server, refused by probes (`lane-run.mjs:1261`, `smoke/states.ts:17`).
- 3003: refused by `build-codegen-examples.ts:28`.
- Lane probes use an arbitrary `--port` (3173 and 3190 appear in the log).
- The lane monitor uses 3008.
- 5173 is not used by Jjodel. It is only in `ALLOWED_ORIGINS`.
- Every one of these is a `localhost` origin, so the current Worker accepts them all, and the fixed check of §1.4 must keep accepting any port.

## COSA 3: consumers of the model registry

### 3.1 Shape [read]

- `AIVersion` is at `jodie.ts:262-280`, with `label`, `capabilities: {pdf, vision}`, `deprecated` and `contextWindow?`.
- `add(name, label, pdf=false, vision=false, deprecated=false, contextWindow?)` is at `:223-227`.
- `versions: Dictionary<string, AIVersion> = {}` is at `:190`. It is insertion-ordered, and **its order is semantic: the first key is the default model**.
- `AI.version` does not exist (`:191` is commented out). The selection lives in `AIConfig.model` (`:441`) and in the per-feature `modelId`.

### 3.2 Consumers and what an async fill breaks [read, explorer agent]

| Consumer | Read | If `versions` starts empty and fills later |
|---|---|---|
| `jodie.ts:844` `JodieConfig` ctor | `Object.keys(llm.versions)[0]` at module load | A fresh install stores `model: undefined` |
| `jodie.ts:868-874` `load()` migrations (`migrateLegacyModelIds`, `sanitizeForeignFeatureModels`, `retireModels`) | `versions` at module load | `isForeignModel` sees nothing, and Gemini retirement either does nothing or, with a partial list, retires valid ids |
| `jodie.ts:137-143` `resolveCurrentModelId` | `versions`, `deprecated` | Gemini: an unlisted id moves to the first non-deprecated key |
| `jodie.ts:148-162` `isModelOfProvider`, `isForeignModel` (the mismatch guard) | `versions` of every provider | A mismatch passes while lists are empty. With live lists it gets stronger: a new Claude id becomes "of Claude" |
| `AIProviderService.ts:112,118-120` `effectiveModel` | the guards above; fallback `Object.keys(versions)[0]` | `''` → «No model selected» (`:59-61`) |
| `ProviderModelSelector.tsx:82-90` | `useMemo(..., [popoverProvider])`, split on `.deprecated` | Not recomputed on fill: an empty popover and «Select a model» until the provider changes |
| `Jodie.tsx:191` `getActiveVersion`, `useMemo([activeProvider])` → `:937-938` | `capabilities` | Stays null: attachments are disabled for the session |
| `AISettingsContent.tsx:213,223,231` | labels, summary | Raw id. It re-renders on `PROVIDER_CHANGED` (`:126`) |
| `SettingsModal.tsx:44,127-128`, `ProviderConfigModal.tsx:219-220` (`disabled={v.deprecated}`), `ProviderSettings.tsx:193`, `Jodie/ProviderSelector.tsx:60`, `AIAssistantSettings.tsx:43`, `SuggestedMappingsPanel.tsx:519` | render or click time | Empty select or raw id |

- `contextWindow` has no reader outside its declaration; the search for `contextWindow` returned only that.
- `hasVision`, `hasPdf` and `hasAttachments` have no callers outside `jodie.ts`.
- Conclusion:
  - At module load, after the static `.add` chains and before `JodieConfig`, merge the cached list from `localStorage` into `AI[p].versions` synchronously.
  - Refresh asynchronously afterwards and dispatch a new `AIEvents.MODELS_UPDATED` (adding a key to `events/registry.ts:111-115`).
  - Add a tick on that event to the two `useMemo`s (`ProviderModelSelector.tsx:83`, `Jodie.tsx:191`).
  - Every other consumer re-renders on the existing events, or only reads at call time.

### 3.3 Storage [read]

- Per provider: `jjodie_provider_<name lowercase>` (`jodie.ts:211`). It holds `apiKey`, `model`, `baseUrl`, `enabled`, `lastTested`, `lastTestOk` and `replacedModel`, and is written by `AIConfig.save`/`update` (`:762`, `:778`), which dispatch `AIEvents.PROVIDER_CHANGED`.
- Aggregate: `jjodie-credentials` (`:184`).
- Per feature: `jjodel_provider_<feature>` = `{providerId, modelId, updatedAt}`, written by `setPreferred` (`:519-538`), which dispatches `SETTINGS_CHANGED`.
- Proposed cache key: `jjodel_models_<provider lowercase>` = `{fetchedAt, keyHash, models: [...]}`.
  - `keyHash` is a short non-reversible hash of the key (for example the first 8 hex characters of SHA-256 via `crypto.subtle`). It detects "the key changed" on the `PROVIDER_CHANGED` path without storing the key twice.
  - Expiry is 24 h, as Alfonso decided.
- `data/storage.ts:42-48` (the preserve-on-logout list) should include the cache keys, or exclude them on purpose: a decision for slice (c), recommended "preserve".

### 3.4 Fields the `/models` responses do not give [read: provider documentation, not measured with a key]

Documented shapes (Alfonso's key is not available to the lane: re-measure in Phase 2):

- Anthropic `GET /v1/models`:
  - Response: `{data:[{type:"model", id, display_name, created_at}], has_more, first_id, last_id}`.
  - Pagination: `limit` (default 20, max 1000) and `after_id`.
  - Missing: pdf, vision, context window.
- OpenAI `GET /v1/models`:
  - Response: `{object:"list", data:[{id, object:"model", created /*unix s*/, owned_by}]}`, unpaginated.
  - It includes embeddings, audio, image, moderation, realtime and similar models.
  - Missing: every capability and any display name.
- Gemini `GET /v1beta/models`:
  - Response: `{models:[{name:"models/<id>", version, displayName, description, inputTokenLimit, outputTokenLimit, supportedGenerationMethods, ...}], nextPageToken}`.
  - Pagination: `pageSize` (default 50, max 1000).
  - It gives the context window (`inputTokenLimit`) and **no release date**.

Keeping `pdf` and `vision`:
- A static capability table, a list of `{prefix, pdf, vision, contextWindow?}` matched by longest id prefix (for example `claude-` → `{pdf:true, vision:true}`, `gemini-` → `{pdf:true, vision:true}`, `gpt-4o`/`gpt-4.1`/`gpt-5` → `{pdf:true, vision:true}`).
- Conservative default `{pdf:false, vision:false}`: an unknown model loses attachments; it never sends a PDF to a model that rejects it.
- A static `.add` entry with the same id keeps its own flags.

### 3.5 Tests that pin the static lists [read]

- `services/__tests__/AIProviderService.test.ts` pins `AI.Gemini.versions['gemini-2.0-flash-exp'].deprecated` (`:127`), the first non-deprecated Gemini key as the retirement target (`:118,128-130`), `resolveCurrentModelId` cases (`:136-138`) and `replacedModel` (`:169,180`).
- The static seed stays, so these keep passing, unless slice (d) changes Gemini retirement (§3.6), in which case `:118-180` must be rewritten in the same slice.

### 3.6 Conflict with #179 [read]

- `RETIRING_PROVIDERS = ['Gemini']` (`jodie.ts:130`). `retireModels` (`:681-726`) moves a retired Gemini id to the first non-deprecated entry and stores `replacedModel`.
- Settings then shows «`<label>` is no longer available, so Gemini now uses `<current>`.» (`AISettingsContent.tsx:228-231`).
- That is a swap with a notice. Alfonso's rule for dynamic lists is "flag, never swap".
- Proposal for dynamic providers:
  - A model missing from the live list is kept, and gets `unavailable: true` and a warning badge in the picker and in Settings.
  - The chat sends it unchanged; the provider's 404 is reported as such.
  - `RETIRING_PROVIDERS` stops applying once a live list exists.
  - The static deprecated rows keep today's behaviour while there is no key.
- This changes #179's behaviour for Gemini. It is not an R- row in `docs/decisions.md` (`command grep -c '#179\|retire\|RETIRING' docs/decisions.md` → 0, exit 1; positive control, the same command with `RC-26` added to the pattern → 16).

## COSA 4: family and "newest" rule

The rules are data-driven: a new generation needs no code change, and a new family name creates its own group.

- **Anthropic**:
  - Family = the first all-letter token of the id after `claude-`. `claude-opus-4-7` → `opus`; `claude-3-5-sonnet-20241022` → `sonnet`; `claude-haiku-4-5-20251001` → `haiku`.
  - Newest = max `created_at` within the family.
  - Default view: one per family. Everything else goes behind «Show older models».
  - Label = `display_name`.
- **OpenAI**:
  - Keep `id` matching `^(gpt-|o\d|chatgpt-)`. Drop ids containing any of `audio|realtime|transcribe|tts|image|search|embedding|moderation|instruct|whisper|dall-e`; this deny list is data.
  - Family = `line:tier`, where `line` = `gpt` or `o`, and `tier` = the trailing token among `mini|nano|pro`, else `base`. So `gpt-5` and `gpt-4.1` are both `gpt:base`; `gpt-5-mini` is `gpt:mini`; `o3`/`o4` are `o:base`; `o4-mini` is `o:mini`.
  - Dated snapshots (`-\d{4}-\d{2}-\d{2}$`) never head a family.
  - Newest = max `created`.
  - Label = id. There is no display name in the API.
- **Gemini**:
  - Keep models whose `supportedGenerationMethods` includes `generateContent`. Drop ids containing `embedding|aqa|imagen|veo|tts|image|live|audio`.
  - Strip `models/` from `name`.
  - Family = the tier after the version: `gemini-<ver>-<tier>[-preview|-exp…|-NNN]` → `pro`, `flash`, `flash-lite`.
  - Newest = highest numeric `<ver>`, because the API has no date. On a tie, stable beats preview/exp, and preview/exp beat `-NNN` pins.
  - Aliases (`*-latest`) never head a family.
  - Label = `displayName`; `contextWindow` = `inputTokenLimit`.

These rules come from the documented id conventions and not from a real response. A unit test on a recorded fixture is part of slices (c) and (d).

## COSA 5: connection test

- New design: `GET` the provider's models endpoint, with no fixed model id.
  - Success fills the cache and dispatches `MODELS_UPDATED`.
  - Then check whether the selected model is in the list; if not, the test reports success with a warning: «key OK; selected model X is not offered to this key».
- Endpoints:
  - Anthropic: direct `https://api.anthropic.com/v1/models` with `x-api-key`, `anthropic-version` and `anthropic-dangerous-direct-browser-access: true`, the same posture as `chatClaude`. Alternative: the Worker route (§9, item 1).
  - OpenAI: direct, `Authorization: Bearer`.
  - Gemini: direct, `x-goog-api-key` header, not `?key=`, which keeps the key out of URLs and logs. The preflight accepts the header [measured].
- Measured keyless answers, all readable by the browser:
  - Anthropic: `401 {"type":"error","error":{"type":"authentication_error","message":"x-api-key header is required"}}`, or `"invalid x-api-key"` with a bad key, ACAO `*`.
  - OpenAI: `401 {"error":{"message":"Missing bearer authentication in header",...}}`, ACAO `*`.
  - Gemini without a key: `403 PERMISSION_DENIED` (a bad key answers 400 `API_KEY_INVALID` per the docs, not measured), ACAO echoes the origin.

| Case | Detected by | UI (Settings row and Jodie toast) | `config.enabled` |
|---|---|---|---|
| 401 / Gemini 400 `API_KEY_INVALID` / Gemini 403 | status + body | «Invalid API key» + key URL | false |
| 403 (Anthropic `permission_error`) | status | «Key lacks permission to list models» | false |
| 403 from the Worker (origin) | only if the Worker's fix sends a readable 403 | «This site's origin is not allowed by the Jjodel proxy» | unchanged |
| 429 | status, `retry-after` | «Rate limited, retry in N s» | **unchanged** |
| Network or CORS (`TypeError`) | catch | «Cannot reach `<host>`» + the host. CORS and offline cannot be told apart in the browser; say both | **unchanged** |
| 5xx | status | «Provider error N» | unchanged |

- Today every failure sets `config.enabled = false` (`AISettingsContent.tsx:173-176`): a transient 429 or offline moment disables the provider. Proposal: only auth failures disable.

## COSA 6: slices for Phase 2

None of them touches the critical zone (§3.1 of `CLAUDE.md`).

- **(a) Worker into the trunk.**
  - DOVE: `cloudflare-worker/` (six source files plus `.gitignore`), `docs/CODEBASE-MAP.md`.
  - That is more than 5 files, but all new and outside `frontend/` (rule 19: list and confirm).
  - Changes: `GET /v1/anthropic/models` (with `limit`/`after_id` passthrough), `GET /v1/gemini/models`, the origin fix of §1.4, and `/health` listing routes.
  - Gates: `npx tsc --noEmit` inside the folder, `npm run check:docs`.
  - Tests: none in vitest, since the folder is outside its include; a `curl` script in the README.
  - The redeploy (`npm run deploy`) is Alfonso's. No exported interface changes.
- **(b) Configurable proxy URL.**
  - DOVE: `frontend/src/types/jodie.ts` (`getEndpoint`), `cloudflare-worker/README.md`.
  - Gates: typecheck, build, vitest `AIProviderService.test.ts`.
  - Test: `getEndpoint()` with and without the env var.
  - No exported interface changes.
- **(c) Dynamic list and test for Anthropic.**
  - DOVE: a new `frontend/src/services/aiModelCatalog.ts` (fetch, cache, family rule, capability table, merge), `types/jodie.ts` (sync merge at load, optional `AIVersion` fields `family?`, `createdAt?`, `source?`, `unavailable?`), `services/AIProviderService.ts` (`testClaude` → GET models).
  - Follow-on in the same slice or (c2): `ProviderModelSelector.tsx` (one per family + «Show older models», `MODELS_UPDATED` tick), `events/registry.ts`, `Jodie.tsx:191` (the tick), `AISettingsContent.tsx` (`enabled` only on auth failure, the static-fallback marker).
  - That is more than 3 files, so split it as (c1) catalog, jodie and service, then (c2) UI.
  - Tests: the family and newest rule on a recorded Anthropic fixture, cache expiry and key change, merge order (the first key stays a current model), and the missing-model flag.
  - Interface: optional additions only (rule 11). `AIEvents` gains a key.
- **(d) OpenAI and Gemini.**
  - DOVE: `aiModelCatalog.ts`, `AIProviderService.ts` (`testGemini`, GPT test), `types/jodie.ts` (`RETIRING_PROVIDERS` once a live list exists) plus `AIProviderService.test.ts:118-180`.
  - Tests: fixtures for both rules, plus the rewritten #179 tests.
- **(e) Hardcoded hosts** (§7), optional and docs-plus-one-file.

## COSA 7: hardcoded workers.dev hosts [read, explorer agent]

- Code, two hits only (searched `frontend/`, root `scripts/`, `.github/`, Dockerfiles and nginx confs, excluding `node_modules`; the control is the `jodie.ts` hit itself):
  - `frontend/src/types/jodie.ts:231`: `jjodel-ai-proxy.alfonso99.workers.dev`
  - `frontend/src/components/NotificationWidget/NotificationWidget.tsx:22`: `jjodel-notifications.alfonso-pierantonio.workers.dev`. This is the old subdomain, fixed separately by P-2026-10-18-1145.
- Docs, count of lines:
  - `jjodel-notifications.alfonso-pierantonio.workers.dev`: 12
  - `jjodel-ai-proxy.alfonso99.workers.dev`: 6
  - `jjodel-notifications.alfonso99.workers.dev`: 2
  - bare `workers.dev`: 8
  - The heaviest files are the 1145 prompt (5), the handover (4), `reports/quick-tips-discovery-2026-04-26.md` (3), `audit-ai-system.md`, `discovery_2026-10-02_168_d_voice.md` and `redesign/JJODEL-UI-MASTER-SPEC.md` (2 each).
  - Docs are historical records and are left as they are.
- One place for the subdomain: there are only two `VITE_*` URLs, `VITE_AI_PROXY_URL` (§2.3) and `VITE_NOTIFICATIONS_URL`, each defaulting in code to the full URL. A shared `VITE_WORKERS_SUBDOMAIN` composed in code would save one string and couple two independent Workers. Recommended: two full-URL variables, with the defaults declared next to each other in one small module (`frontend/src/config/workerHosts.ts`), so a subdomain rename is one file.

## Risks

1. **Responses-only models.** `chat/completions` callers may get OpenAI models that only work with the Responses API (`*-pro`, `codex`). The GET test does not catch this, so add these to the deny list as data and report a chat 400 with the model's name.
2. **Pagination.** The Anthropic default `limit` of 20 truncates; use `limit=1000` and follow `has_more`. For Gemini, follow `nextPageToken`.
3. **Order is the default.** Merging live entries in front changes `Object.keys(versions)[0]`, the default for a fresh install. Keep the static first entry first until a live list exists, then put the newest of the first family first.
4. **The mismatch guard gets wider.** A live id that appears in two providers' lists (for example a Groq-hosted `openai/gpt-oss-*` against OpenAI) does not trip `isForeignModel`, because it is "of" both. No regression, noted.
5. **Hash cost.** `keyHash` via `crypto.subtle` is async. Compute it on save, not at module load: the sync merge compares against the stored hash only after the first refresh.
6. **CORS from other origins.** The direct browser calls depend on the providers' CORS posture, measured today, which can change. The Worker routes of slice (a) are the fallback (§9, item 1).

## Decisions taken (unattended)

1. Worker location: root `cloudflare-worker/`, no `CLAUDE.md` inside (§1.3).
2. Env var: `VITE_AI_PROXY_URL`, default the production Worker in every mode, local Worker opt-in through `.env.development.local` (§2.3).
3. Sync merge of the cached list at module load plus a `MODELS_UPDATED` event, instead of making `versions` async (§3.2).
4. Capability table by longest id prefix, default `{pdf:false, vision:false}` (§3.4).
5. Only auth failures set `enabled = false`; 429, network and 5xx leave it as it is (§5).
6. A dynamic provider's missing model is flagged and kept, and `RETIRING_PROVIDERS` stops applying to it (§3.6). This follows Alfonso's rule; it is not a new choice.
7. Gemini key in the `x-goog-api-key` header for the models call (§5).
8. The report, the inbox entry and the Status flip go in one docs commit, as the prompt says. The `discovery-report` skill's "a commit of its own" yields to the prompt.

## Decisions awaiting Alfonso

These are the RC-26 items only.

1. **Direct calls or Worker for `GET models`.** Measured: all three providers answer the browser directly, and Claude chat already does (`AIProviderService.ts:226`). The decision on the Worker routes stands, and slice (a) adds them. The open point is which path the frontend calls first. This changes what the deployed Worker (an outward-facing service) is used for, and its deploy is Alfonso's.
   Recommended: call direct by default, with the Worker routes as a fallback on network or CORS failure; Alfonso redeploys after slice (a).
2. **Redeploy of the Worker with the origin fix** (outward-facing).
   Recommended: redeploy after slice (a) merges; it is low risk, since only the origin parsing and two GET routes change.

No push, merge or deploy was performed by this lane.
