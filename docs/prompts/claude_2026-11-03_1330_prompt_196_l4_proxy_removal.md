# #196 L4: AI proxy Worker removal, the code part

Prompt-ID: P-2026-11-03-1330
Chat: C-2026-11-03-1227
Front: ai-provider
Lane: full
Depends: P-2026-11-03-1226
Status: eseguito 2026-11-03 · lane feat/196-l4-proxy-removal · d0d305e0d
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-03, «riparti con il compito 196-ai-provider-refactor.md»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 60 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none. No file of DOVE is a row of the root `CLAUDE.md` §3.1 or one of the six files of §3.2; no Layer
Impact Report owed. Rule 19 is confirmed by Juri for this lane (R-AI-20).

Worktree: `/Users/juridirocco/development/jjodel-196-l4`, branch `feat/196-l4-proxy-removal`, from `staging`
`99b380f6f` (L3 merged at `c35ce731e`); `frontend/node_modules` is a symlink to the main tree's (P14: do not remove it,
and **never run `npm install` in this worktree**: npm replaces the symlink with a real directory, measured 2026-11-02).
Before anything else: `pwd`, branch, `git log -3 --oneline` (HEAD is the commit that adds this file; under it
`8570951d7`, R-AI-20..21 in `docs/decisions.md`; then `99b380f6f`), `git status --short` empty,
`test -L frontend/node_modules`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-03-1330 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1): read by ranges, builds
and tests through `node scripts/run-quiet.mjs`. Keep `~/.jjodel-lanes/P-2026-11-03-1330/handoff.md` current after each
commit (RC-51).

## Context (read, do not trust: re-read the real files, P3)

- Spec `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md` §7 «L4» (its line numbers are of `288425992`:
  re-find them). Decisions: R-AI-4, R-AI-13 (the real-key gates, both met), **R-AI-20** (this lane's shape: code only,
  the `cloudflare-worker/` folder is NOT this lane's), **R-AI-21** (the whole dead fetch path of `aiModelCatalog.ts`).
- The chat measured on `99b380f6f` (re-measure, P3): `AI.getEndpoint()` (`types/jodie.ts:246`) has no caller outside
  tests; `getProxyBase` (`:173`) is called only by it; `AI.proxy` is declared at `:211` and set only at `:419`
  (`AI.Claude.proxy = '/v1/anthropic/messages'`). In `services/aiModelCatalog.ts`, `fetchCatalog` (`:339`) and
  `fetchAnthropicCatalog` (`:372`), the only users of `proxyPath` (`:296`, `:307`, `:324`), are imported only by
  `services/__tests__/aiModelCatalog.test.ts`. Live importers of `aiModelCatalog.ts`: `types/jodie.ts:12-13`
  (`CATALOG_PROVIDERS`, `cachedModelsFor`, `capabilitiesFor`, types `CatalogFailure`, `CatalogModel`),
  `components/common/ProviderModelSelector.tsx:8-9` (`cachedModelsFor`, type `CatalogProvider`),
  `components/settings/AISettingsContent.tsx:10` (type `CatalogFailure`). `src/services/ai/` has its own copies of the
  cache and the ordering (`catalog/catalogCache.ts`, the providers); it does not import `aiModelCatalog.ts` (one
  comment names it, `BaseProvider.ts:10`).
- The block comment from about `types/jodie.ts:1232` (`providerNeedsProxy`, `PROVIDER_ENDPOINTS`) is commented-out
  code. It stays: rule 8, and the file dies at L6.
- The notifications Worker (`components/NotificationWidget/NotificationWidget.tsx`, host
  `jjodel-notifications.alfonso99.workers.dev`) is a different service: it is not touched and the bundle keeps its host.

## COSA

1. **Measure** (P3, P12). For every export of `services/aiModelCatalog.ts`, for `getProxyBase`, `proxy` on `AI`, and
   `getEndpoint`: importer search over `frontend/src` (static imports, `import(` dynamic imports, and the name as a
   string), with a positive control that comes back non-empty in the same command form. Write the table (name → live
   importers → fate) in the handoff. Build the base once (`npm run build` through the quiet runner) and count the files
   of `frontend/dist` that contain `jjodel-ai-proxy` (expected: at least one). That count is the baseline of item 5.
   A live importer of something R-AI-21 would delete → HARD STOP.
2. **`types/jodie.ts`**: delete `getProxyBase` with its doc comment, the `proxy?:` field of `AI` with its comment, the
   `AI.Claude.proxy = …` assignment, and the proxy branch of `getEndpoint`. `getEndpoint()` stays and returns
   `this.endpoint` (the file dies at L6; no other edit to it).
3. **`services/aiModelCatalog.ts`** (R-AI-21): delete every export whose only importer is its own test, the private
   helpers and constants only they use, and the `proxyPath` field. Keep every export of item 1 that has a live
   importer, and whatever those exports need. Fix the file's header comment where it describes what was deleted.
4. **Tests**: delete `types/__tests__/aiProxyEndpoint.test.ts`. In `services/__tests__/aiModelCatalog.test.ts` delete
   the cases of the deleted functions, the Worker-fallback case included. Keep and run the cases of the surviving
   exports. If a surviving export loses its last test, say so in the handoff (do not write a new one unless it is a
   one-liner on behaviour that already exists).
5. **Smoke without the Worker** (spec §7 L4 (a), R-AI-20):
   - Build again: the count of `frontend/dist` files containing `jjodel-ai-proxy` is **0**. The count of
     `jjodel-notifications` stays what it was on the base (positive control: measure it on both builds).
   - Copy `frontend/scripts/smoke/_tmp_196_l3_probe.ts` (gitignored, already in this tree) to `_tmp_196_l4_probe.ts`
     and add one context route on `**/jjodel-ai-proxy.alfonso99.workers.dev/**` that records every request and
     aborts it. The final arm asserts **zero** recorded requests. Run it from the tree root with
     `node frontend/scripts/lane-run.mjs probe /Users/juridirocco/development/jjodel-196-l4
     frontend/scripts/smoke/_tmp_196_l4_probe.ts --port 3196 --id P-2026-11-03-1330`, with
     `SMOKE_URL=http://localhost:3196` in the environment: `states.ts` reads `SMOKE_URL`, and
     without it `createProject` goes to port 3000 (measured by the chat on the L3 merge). Every arm green.
6. **Gates**: `npm run typecheck` exit 0, no `error TS` line; `npm run build` exit 0; full `npm run test` with only
   the nine known reds of `CLAUDE.md` §17; `npm run check:docs` green.
7. **Commits**: code and tests in one `refactor(ai): …, #196 L4` commit (pathspec on the commit, P13). Then the
   closure, docs only: one entry in `docs/log-inbox/196-ai-refactor.md` in the P9 format (the `log-entry` skill), at
   the END of the file (that inbox is chronological). It names the item 1 table in one line, the two dist counts, the
   probe score, and that `cloudflare-worker/` is still owed (R-AI-20). Edit this prompt's `Status:` line **by hand**
   to `eseguito <date> · lane feat/196-l4-proxy-removal · <code commit>`. End with `Outcome: done`.

## DOVE

- `frontend/src/types/jodie.ts` (item 2 only)
- `frontend/src/services/aiModelCatalog.ts`
- `frontend/src/services/__tests__/aiModelCatalog.test.ts`
- delete: `frontend/src/types/__tests__/aiProxyEndpoint.test.ts`
- closure: `docs/log-inbox/196-ai-refactor.md`, this prompt's `Status:` line
- gitignored, not committed: `frontend/scripts/smoke/_tmp_196_l4_probe.ts`

## HARD STOP

- Item 1 finds a live importer (outside `aiModelCatalog.test.ts` and `aiProxyEndpoint.test.ts`) of something items 2
  and 3 would delete.
- A deletion needs an edit to a file outside DOVE in order to typecheck.
- The dist count of `jjodel-ai-proxy` after item 2 and 3 is not 0, and the remaining hit is outside DOVE.
- A measured fact contradicts the spec or an R-AI row in a way that changes what this lane builds.

## NON FARE

No edit to `cloudflare-worker/`, `.gitignore`, `docs/CODEBASE-MAP.md` (R-AI-20: after Alfonso), `src/services/ai/`,
`ProviderModelSelector.tsx`, `AISettingsContent.tsx`, the commented-out block of `types/jodie.ts`. No deletion of
`types/jodie.ts` or of `aiModelCatalog.ts` as files (L6). No new dependency, no `npm install`. No network call to a
real provider or to the Worker, nothing read from `~/.jjodel-lanes/keys196.env`. No vite on 3001. No merge, no push, no
issue comment. No hardcoded event string (rule 25), no emoji, no `console.log` left in code.
