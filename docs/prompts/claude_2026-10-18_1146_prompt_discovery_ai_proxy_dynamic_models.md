# AI providers: proxy Worker back in the trunk, configurable proxy URL, dynamic model lists (discovery)

Prompt-ID: P-2026-10-18-1146
Chat: C-2026-10-17-1518
Front: maintenance
Lane: full (discovery, read-only; heavy, not drawn: discoveries are outside RC-45)
Status: eseguito 2026-10-18 · lane discovery ai-models-discovery · measured on 1e9e616fa; the report is in the commit that carries this line (a commit cannot name its own sha) · Outcome: hard-stop
Request: Alfonso, 2026-10-18 11:43, «la lista dei modelli è statica, è possibile renderla dinamica con tutti i modelli disponibili e quelli legacy su richiesta ?» then «confermo, usa /lane auto»
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-aimodels`, branch `ai-models-discovery`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` match; otherwise stop with `Outcome: blocked`. Runs in parallel with P-2026-10-18-1145 (RC-22): that lane touches only `NotificationWidget.tsx`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1146 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the report under «Decisions taken (unattended)».
Time limit: 60 minutes. Phase 1 only: read-only on `frontend/`; the only writes are the report and the docs commit.
Output discipline (CLAUDE.md §0.1): `types/jodie.ts` (1186 lines) and `services/AIProviderService.ts` (1012 lines) are read with Read and `offset`/`limit` around the lines named below.

## Context (measured by the chat on 2026-10-18, do not redo)
1. Claude and Gemini go through a Cloudflare Worker (`AIProvider.getEndpoint()`, `types/jodie.ts:228-240`): prod `https://jjodel-ai-proxy.alfonso99.workers.dev`, localhost `http://localhost:8787`, chosen by `window.location.hostname === 'localhost'`. Its source was created on 2026-02-03 (`docs/handover/2026-02-03-cloudflare-worker-anthropic-proxy.md`) under `cloudflare-worker/` and removed from the repo by `73827f97b` («remove unwanted files and folders related to issue #54»), which also had a committed `node_modules`. The deployed Worker had disappeared from Cloudflare (NXDOMAIN): Alfonso restored it on 2026-10-18 from `73827f97b^`, in `~/jjodel-proxy/cloudflare-worker/` outside the repo, with wrangler 4.151.1, `@cloudflare/workers-types` latest, `app.jjodel.io` and `beta.jjodel.io` added to `ALLOWED_ORIGINS`, and the account's workers.dev subdomain renamed to `alfonso99`. `/health` answers `{"providers":["anthropic","gemini"]}`; a POST through it with `Origin: https://app.jjodel.io` and model `claude-opus-4-7` answered 200.
2. In development, Claude and Gemini fail unless someone runs `npx wrangler dev` by hand: nothing starts it.
3. The model lists are static `.add(...)` chains in `types/jodie.ts` (OpenAI 309-313, Claude 315-322 with legacy rows flagged `deprecated`, Gemini 327-334, others below), plus a legacy-id mapping at 99-103 and a Gemini default note at 126. `testConnection` (`AIProviderService.ts:699`) dispatches to `testClaude` (767), `testGemini` (844), `testOpenAICompatible` (897); the Claude test sends a 10-token message to a fixed model id.
4. Anthropic `GET /v1/models` (headers `x-api-key`, `anthropic-version`) returns the models the key can use, with `id`, `display_name`, `created_at`, paginated. OpenAI `GET /v1/models` and Gemini `GET /v1beta/models` have equivalents. The Worker today proxies only POST `messages` (and Gemini's path): check the restored source in `~/jjodel-proxy/cloudflare-worker/src/index.ts` (read-only, outside the worktree).
5. Earlier reports to read first: `docs/discovery/2026-06-13_ai-provider-subsystem.md`, `docs/discovery/discovery_2026-09-03_ai_surfaces_inventory.md`, `docs/discovery/discovery_2026-09-18_custom_provider_model.md`, `docs/audit-ai-system.md`.

## Decisions already taken by Alfonso (2026-10-18), not to reopen
Scope of the dynamic lists: Anthropic, OpenAI, Gemini first; the other providers keep the static list in a later slice. Default view per provider: for each family (Opus, Sonnet, Haiku for Anthropic; the analogous grouping for the others, to be proposed) only the newest model by release date; every other model behind a «Show older models» control. Lists cached per provider in `localStorage` with a 24 h expiry, refreshed when the key changes or on Test Connection. The static list stays as an explicit, visibly marked fallback (no key, no network). A selected model that disappears from the list is flagged to the user, never silently swapped. The Worker gains `GET /v1/anthropic/models` and the Gemini equivalent. The connection test becomes a `GET models` call with no fixed model id.

## COSA (measure, do not change code)
1. Worker in the trunk: diff the restored source against `73827f97b^:cloudflare-worker`; list what the trunk copy must contain (no `node_modules`; `package.json`, lockfile, `wrangler.toml` with the five origins, `src/`, a README in English explaining why the folder exists and how to deploy) and where it should live (`cloudflare-worker/` at the root or under `frontend/`), checking that no lint, typecheck, build or `check:*` script would pick it up or reject it. Look for the `.gitignore` or cleanup rule behind `73827f97b` and say how to keep it from being removed again.
2. Proxy URL: every reader of `getEndpoint()` and of the two constants; propose an environment variable (Vite `import.meta.env.VITE_*`, check the existing ones and `.env*` files) whose default in development is the production Worker, with `http://localhost:8787` as opt-in. Say whether the Worker already accepts `http://localhost:3000` and `:5173` (it does per the handover; confirm from the source) and which dev ports Jjodel actually uses (3000, 3001, 3003 per the harness).
3. Model lists: every consumer of `versions`, `version`, the `deprecated` flag, `contextWindow`, `pdf`, `vision` (settings UI: `components/settings/AISettingsContent.tsx`, `components/Jodie/SettingsModal.tsx`, `pages/settings/ProviderConfigModal.tsx`; chat; any validation such as the provider/model mismatch guard at `types/jodie.ts:156`; the legacy mapping at 99-103). For each, what breaks if `versions` becomes async or filled after load. Where the selected model is read and persisted (storage keys). Which per-model fields (`pdf`, `vision`, `contextWindow`) the `/models` responses do not provide, and how to keep them (static capability table keyed by id prefix, with a conservative default).
4. Family and «newest» rule: propose the grouping for Anthropic, OpenAI and Gemini from the ids and fields each API returns, with the rule written so that a new generation needs no code change. Measure against a real response when possible (Alfonso's key is not available to the lane: use the documented response shapes and say so).
5. Test connection: the new design per provider, what it returns on 401, 403 (origin), 429, network error and CORS, and how the UI shows each.
6. Slicing: propose the Phase 2 slices in order, each with its DOVE (≤3 files where possible, RC-3), gates, tests, and whether it changes an exported interface. Expected at least: (a) Worker into the trunk plus the `models` routes plus redeploy note; (b) proxy URL configurable; (c) dynamic lists and connection test for Anthropic; (d) OpenAI and Gemini. Mark any slice that touches the critical zone (none expected).
7. Hardcoded workers.dev hosts: list every one in `frontend/` and docs (the notifications widget is fixed separately by P-2026-10-18-1145) and propose one place for the account subdomain.

## Report
`docs/discovery/discovery_2026-10-18_ai_proxy_dynamic_models.md`: objective, files read with paths, findings per COSA item, risks, the proposed slices, «Decisions taken (unattended)», «Decisions awaiting Alfonso» (numbered, each with `Recommended:`).

## Commits (P13), explicit pathspecs
One docs commit: the report, the log entry in `docs/log-inbox/maintenance.md` (§21.2, `Corregge: —`) and the Status flip of this prompt. `npm run check:docs` must pass. No push, no merge (RC-19).

## HARD STOP
At the end of Phase 1, `Outcome: hard-stop`. No Phase 2 without a GO from the chat.

## NON FARE
No change under `frontend/src`, no edit of `~/jjodel-proxy` (read-only), no deploy, no `wrangler` command that writes, no calls to the providers' APIs with a key.

## RIFERIMENTI
`types/jodie.ts:99-103, 126, 156, 228-240, 309-378`; `services/AIProviderService.ts:99, 699, 767, 844, 897`; `docs/handover/2026-02-03-cloudflare-worker-anthropic-proxy.md`; commit `73827f97b`.
