# #196 L1, lane 1 of 2: the provider half of the new AI module (types, BaseProvider, three families, SDK pins)

Prompt-ID: P-2026-11-02-1320
Chat: C-2026-11-02-1311
Front: ai-provider
Lane: full
Depends: P-2026-11-02-1055
Status: da eseguire
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-02; his words are `request.md` in the chain folder, RC-43)
Model: claude-opus-5-5
Limite: 90 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 non si applica (motivo: nothing renders; no file of the app imports the new module, so the app is unchanged, and lane 2 of this chain proves it on `dist`).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest), Juri decides for this lane.

Critical zone: none. Every file of this lane is new under `frontend/src/services/ai/`, plus the two package files; no
row of the table of the root `CLAUDE.md` §3.1, no Layer Impact Report owed. Rule 4 (new dependencies) is approved by
R-AI-2; rule 5 (core) by R-AI-3; rule 19 (ten files) confirmed by Juri in chat C-2026-11-02-1311 on 2026-11-02 for
the file list of DOVE exactly.

Worktree: `/Users/juridirocco/development/jjodel-196-l1`, branch `feat/196-l1-ai-module`, from `staging` `a8f58436b`;
`frontend/node_modules` is a symlink to the main tree's (P14: do not remove it). This lane is the first of two run by
`lane-run chain` in this worktree. Before anything else: `pwd` is that worktree, the branch is `feat/196-l1-ai-module`,
`git log -1` is the commit that adds this file (subject `docs: add prompt P-2026-11-02-1320, lane 1/2 of
chain-P-2026-11-02-1320`), its parent is `a8f58436b`, `git status --short` is empty; otherwise stop with
`Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-02-1320 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1): read by ranges, builds
and tests through `node scripts/run-quiet.mjs`. The chain starts lane 2 only on `Outcome: done` with a clean tree:
every commit of this lane is made before the final message.

## Context (read, do not trust: re-read the real files, P3)

The frozen spec is `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md` (`ad209a6ad`). Read, in this order and by
ranges: §4 (target model, core types, SDK strategy), §6 (transport table), §7 «L1», §9 (spike measures). The decisions
are R-AI-1..13 in `docs/decisions.md` (section «R-AI»); this lane is bound by R-AI-2, R-AI-3, R-AI-7, R-AI-8, and by
R-AI-13 for the Anthropic wire. Line numbers in the spec are those of `288425992`; the code has not moved in the files
it cites except for the L5 deletions.

L1 is split in two lanes on one branch. **This lane builds everything that is per family**: the types, the abstract
`BaseProvider`, the three provider classes, and the tests of what they send and how they classify a failure. **Lane 2
(P-2026-11-02-1321)** builds what is persistent or wiring: the two config stores, the catalog cache, the registry with
the static seeds copied from `types/jodie.ts`, `index.ts`, the `dist` and chunk gates. So here a provider receives its
configuration (apiKey, baseUrl, model, seed list, legacy-id map) through its constructor or a typed spec object
declared in `types.ts`; it reads no localStorage and fires no event. Tests use fixture seeds.

The module is pure: it imports neither `../../joiner` nor `../../types/jodie.ts` (either one pulls the
`window is not defined` chain, CLAUDE.md §17), so its tests run in vitest's `node` environment without mocks of those
two. Logic that today lives in `types/jodie.ts` or `AIProviderService.ts` (the key-prefix tables, `isForeignModel`,
the base-URL normalisation) is **copied**, not imported; the old copies stay until L3/L6 delete them.

## COSA

1. **Pins.** From the worktree's `frontend/`: `npm install --save-exact openai@7.47.0 @anthropic-ai/sdk@1.3.0
   @google/genai@2.32.0`. Then check: `frontend/package.json` gains exactly those three lines in `dependencies`, no
   other line of it changes; `frontend/node_modules` is still a symlink (`test -L`); the lock diff touches only the
   three packages and their transitive dependencies (count them and report). The install writes into the main tree's
   `node_modules` through the symlink: expected, additive. Commit alone: `build(deps): pin the three AI SDKs, #196 L1`.
2. **`types.ts`**: the core types of spec §4, `DEFAULT_MAX_OUTPUT_TOKENS = 8192`, plus the provider spec shape this
   lane needs (name, family, baseUrl, authScheme, requiresKey, seed models, legacy-id map). Plain TS, no runtime import.
3. **`BaseProvider.ts`**, abstract, the members of spec §4. Behaviour carried from spec §6, each from its live home
   today (read it there): `validateKey()` with the live prefixes `sk-ant-` (Claude), `sk-` (GPT, DeepSeek), `gsk_`
   (Groq), **without `AIza`** (`AIProviderService.ts` `validateKeyCoherence` and its two tables); `resolveModel()`, the
   foreign-model guard with fallback and warning, Custom exempt (`AIProviderService.ts` around `:115-138`,
   `isForeignModel` in `types/jodie.ts`), plus the legacy-id mapping; `enabled()` per `isConfigured` (`types/jodie.ts`
   around `:882-889`): Custom `!!(baseUrl || apiKey)`, others `!!(requiresKey ? apiKey : baseUrl)`; capability gating:
   an image or PDF attachment is refused unless the resolved model declares `IMAGES` / `DOCUMENTS`.
4. **The three families**, each SDK loaded only by `await import('<package>')` inside a method (R-AI-2), never a static
   import, not even of a type the build would keep (use `import type` for types):
   - `OpenAICompatibleProvider.ts` (`openai`): GPT, DeepSeek, Groq, Mistral, Kimi, Ollama, Custom;
     `dangerouslyAllowBrowser: true`; the base-URL normalisation in its three forms (`AIProviderService.ts`
     `resolveChatCompletionsUrl`, and the three cases of `AIProviderService.test.ts` around `:39-60`), expressed as the
     SDK's `baseURL`.
   - `AnthropicCompatibleProvider.ts` (`@anthropic-ai/sdk`): `dangerouslyAllowBrowser: true`. **`test()` is one
     `messages.create` with `max_tokens: 1`** on the configured model (R-AI-7), never `models.list`.
   - `GoogleCompatibleProvider.ts` (`@google/genai`): key as `x-goog-api-key` (the SDK's default), PDF as `inlineData`.
   - Each: `chat(req)`, `chatStream(req)` where the SDK streams, `retrieveAvailableModels()` (the SDK's list, parsed into
     `AIModel`; the parsing and family ordering of `services/aiModelCatalog.ts` is the reference, copied as far as this
     lane needs it), `test()`.
5. **`test()` classification** into `FailureCatalog`, with the shapes measured in spec §9 and §7 «L1»: OpenAI 401
   `AuthenticationError` → AUTH, 429 `RateLimitError` → RATE, and **429 with code `insufficient_quota` → RATE with its
   own message** «no credit left on the account» (R-AI-8; every other 429 keeps today's message); 404 `NotFoundError`
   (say which category you chose and why); Anthropic 401 → AUTH, `APIConnectionError` («Connection error.») → NETWORK;
   Gemini `ApiError` status 400 with reason `API_KEY_INVALID` → AUTH (as `AIProviderService.test.ts` around `:246`
   reads it today); 5xx → SERVER. The key-prefix check runs before any call, in `test()` and in `chat()`.
6. **Tests**, in `src/services/ai/__tests__/`, against a fetch mock passed to the SDK client (each SDK takes a `fetch`
   option, or stub `globalThis.fetch`): 
   - `requestShaping.test.ts`: per family, the request the SDK builds: URL, method, auth header (Anthropic: the
     direct-browser header is present; **the old `x-api-key` assertion does not carry over**, the SDK sends Bearer,
     spec §4), `max_tokens` / `maxOutputTokens` = 8192 by default and the override, system prompt, history, image and
     PDF parts; the three base-URL forms; the Claude `test()` posting to `/v1/messages` with `max_tokens` 1.
   - `connectionTest.test.ts`: every classification of item 5, from responses shaped like the measured ones.
   - `baseProvider.test.ts`: `validateKey` on chat path and `test()` (one accepted, one refused per prefix, `AIza` not
     refused), `resolveModel` (kept, legacy-mapped, foreign discarded with warning, Custom exempt), `enabled` (Ollama
     with and without `baseUrl`, Custom with key only and base URL only, a keyed provider), capability gating.
   vitest runs in `node`: `@google/genai` resolves its node export there, not the `browser` one. State this gap in the
   log entry; the browser wire is the L3 smoke.
7. **Gates**: `npm run typecheck` exit 0 with no `error TS`; `npm run test` exit 0 on the new folder **and** a full run
   with only the nine known import failures of CLAUDE.md §17; `npm run build` exit 0. Every count on complete output
   with the exit status (CLAUDE.md §5).
8. **Mutation bench** (CLAUDE.md §5): at least four mutations, each reverted after: drop the `insufficient_quota`
   branch; send `max_tokens` 1024; add `AIza` to the prefix table; make `enabled()` return true for Ollama without a
   base URL. Each must turn a named test red; record which in the commit message of item 9.
9. Code commit: `feat(ai): provider half of src/services/ai, #196 L1` (Prompt-ID in the body, the bench, `Model:`
   trailer). Then the closure commit, docs only (P13): the entry in `docs/log-inbox/196-ai-refactor.md` (skill
   `log-entry`), and this prompt's `Status:` line edited **by hand** to
   `eseguito 2026-11-02 · lane feat/196-l1-ai-module · <code commit short hash>` (the `status-flip` skill is
   user-only). `npm run check:docs` green through the quiet runner.

## DOVE

- `frontend/package.json`, `frontend/package-lock.json` (item 1 only)
- `frontend/src/services/ai/types.ts` (new)
- `frontend/src/services/ai/BaseProvider.ts` (new)
- `frontend/src/services/ai/OpenAICompatibleProvider.ts` (new)
- `frontend/src/services/ai/GoogleCompatibleProvider.ts` (new)
- `frontend/src/services/ai/AnthropicCompatibleProvider.ts` (new)
- `frontend/src/services/ai/__tests__/requestShaping.test.ts` (new)
- `frontend/src/services/ai/__tests__/connectionTest.test.ts` (new)
- `frontend/src/services/ai/__tests__/baseProvider.test.ts` (new)
- closure: `docs/log-inbox/196-ai-refactor.md`, this prompt's `Status:` line

## HARD STOP

- An SDK cannot be loaded lazily (its type import or its side effects force a static import), or one of the three
  versions does not install as pinned: stop, do not pick another version (R-AI-2: a new decision).
- The install changes a `package.json` line other than the three, or leaves `node_modules` a real directory.
- A behaviour of spec §6 marked «yes» for this half cannot be expressed in the module without importing `joiner` or
  `types/jodie.ts`.
- A file outside DOVE needs to change.

## NON FARE

No edit to any existing file under `frontend/src/` (`types/jodie.ts`, `AIProviderService.ts`, `aiModelCatalog.ts`,
their tests, `events/registry.ts` included). No stores, registry, catalog cache or `index.ts` (lane 2). No network
call, no real key, nothing read from `~/.jjodel-lanes/keys196.env`. No merge, no push, no issue comment. No hardcoded
event string (rule 25), no emoji, no `console.log` left in code.
