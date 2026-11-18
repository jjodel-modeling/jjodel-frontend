# #196 L1, lane 2 of 2: the persistent half of the new AI module (stores, catalog cache, registry, index, gates)

Prompt-ID: P-2026-11-02-1321
Chat: C-2026-11-02-1311
Front: ai-provider
Lane: full
Depends: P-2026-11-02-1320
Status: eseguito 2026-11-02 · lane feat/196-l1-ai-module · 6609dffa1
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-02; his words are `request.md` in the chain folder, RC-43)
Model: claude-opus-5-5
Limite: 90 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 non si applica (motivo: nothing renders; no file of the app imports the new module, and item 7 proves the
built app identical to the base).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest), Juri decides for this lane.

Critical zone: none. Every file of this lane is new under `frontend/src/services/ai/`; no row of the root `CLAUDE.md`
§3.1, no Layer Impact Report owed. Rule 5 approved by R-AI-3; rule 19 (ten files) confirmed by Juri in chat
C-2026-11-02-1311 on 2026-11-02 for the file list of DOVE exactly.

Worktree: `/Users/juridirocco/development/jjodel-196-l1`, branch `feat/196-l1-ai-module`; `frontend/node_modules` is a
symlink to the main tree's (P14: do not remove it). Second of two lanes run by `lane-run chain` in this worktree.
Before anything else: `pwd` is that worktree, the branch is `feat/196-l1-ai-module`, `git log -1` is the commit that
adds this file (subject `docs: add prompt P-2026-11-02-1321, lane 2/2 of chain-P-2026-11-02-1320`), its parent is the
closure of lane 1 (P-2026-11-02-1320), `git log --oneline a8f58436b..HEAD` shows lane 1's pin commit and code commit,
`git status --short` is empty; otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-02-1321 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1): read by ranges, builds
and tests through `node scripts/run-quiet.mjs`. Every commit of this lane is made before the final message.

## Context (read, do not trust: re-read the real files, P3)

Spec `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md` (`ad209a6ad`): read §4, §5 (localStorage keys), §6
(transport table), §7 «L1», by ranges. Decisions R-AI-1..13 in `docs/decisions.md`; this lane is bound by R-AI-2 (the
chunk gate), R-AI-6 (key precedence), R-AI-9 (`dockWidth` preserved). Lane 1 built `types.ts`, `BaseProvider.ts` and the
three provider classes: read them first, and its log entry in `docs/log-inbox/196-ai-refactor.md`. A provider takes its
configuration from outside; this lane supplies it.

The module stays pure: no import of `../../joiner` or `../../types/jodie.ts` from any file of `src/services/ai/` outside
`__tests__/`. Importing `../../events/registry.ts` is allowed (it imports nothing). Seeds, legacy maps and migration
logic are **copied** from `types/jodie.ts`; the old code stays until L2/L6.

## COSA

1. **Measure R-AI-6 first.** API keys are stored twice: `jjodie_provider_<name lowercase>` and the `providers` of the
   `jjodie-credentials` blob (spec §5). Write `__tests__/legacyKeyPrecedence.test.ts`, a characterization test **of
   today's code** (`types/jodie.ts`, mocking `../../joiner` the way `services/__tests__/AIProviderService.test.ts` does):
   seed the two copies with different keys and record which one the app reads after `JodieConfig.load`, and what a
   save writes into each. Whatever it measures is the rule the new store follows. This file may import
   `types/jodie.ts`: it is a test, deleted with that file at L6 (say so in a header comment).
2. **`config/ProviderConfigStore.ts`**: per-provider apiKey/baseUrl/model/enabled on the existing keys of spec §5,
   **zero data migration**. Load honours the precedence of item 1; save writes **both** copies (R-AI-6). The
   `jjodie-credentials` blob round-trips every field it does not own unchanged, `dockWidth`, `position`, `size`,
   `appVersion` included (R-AI-9: `dockWidth` moves out at L2, not here). Fires `AIEvents.SETTINGS_CHANGED` /
   `AIEvents.PROVIDER_CHANGED` where today's code fires them (`types/jodie.ts` around `:610`, `:841`, `:855`), same
   detail.
3. **`config/FeaturePreferenceStore.ts`**: feature → `{provider, modelId}` on `jjodel_provider_<feature>`, features
   `documentation, chat, scriptblock, mappings, explain`. The four migrations of spec §6, copied with the **same
   sentinels**: `migrateLegacyModelIds` (`jjodel_migration:legacy_model_ids_v1`), `sanitizeForeignFeatureModels`,
   `retireModels` (no sentinel, runs on every load, as today), `migrateGlobalDefaultToPerFeature`
   (`jjodel_migration:global_to_per_feature`, reads `jjodel_default_provider`, does not delete it). Same order as
   `JodieConfig.load` runs them today.
4. **`catalog/catalogCache.ts`**: `jjodel_models_<provider>`, 24 h TTL, keyed to the FNV-1a hash of the API key
   (`services/aiModelCatalog.ts` `hashKey`, `CATALOG_TTL_MS`), **direct fetch only, no Worker branch**; a refresh calls
   the provider's `retrieveAvailableModels()` and fires `AIEvents.MODELS_UPDATED` with today's detail.
5. **`registry.ts`**: providerId → configured instance built from the stores; `enabled()`, `all()`; the static seed
   model lists and the legacy-id maps copied from `types/jodie.ts` (`AI.Claude` …, `claudeLegacyIdMap`), every provider
   of today, Custom and Ollama included. **`index.ts`**: the public surface (types, registry, stores, catalog), nothing
   else.
6. **Tests**, in `src/services/ai/__tests__/`, with a `Map`-backed `localStorage` and a stubbed `window` for events, as
   `aiModelCatalog.test.ts` does:
   - `stores.test.ts`: round-trip on every key of spec §5 the stores own; both key copies written; unknown blob fields
     preserved (assert `dockWidth` by value); the two events, name and detail.
   - `migrations.test.ts`: each of the four migrations, the sentinels set and honoured (a second load is a no-op),
     `jjodel_default_provider` left in place, `retireModels` re-running.
   - `catalogCache.test.ts`: fresh hit, TTL expiry, key change invalidates, `MODELS_UPDATED` fired, no proxy URL ever
     requested (assert on the fetch mock).
   - `registry.test.ts`: every provider of today present with its family; seeds match `types/jodie.ts` (compare by value
     in this test file, which may import it like item 1); `enabled()` follows the stores.
7. **Gates.**
   - `npm run typecheck` exit 0, no `error TS`; `npm run test` on the new folder exit 0 and a full run with only the nine
     known import failures of CLAUDE.md §17; `npm run build` exit 0.
   - **App unchanged**: build the app at this lane's tip and at `a8f58436b` (a temporary detached worktree under the
     scratchpad or `/tmp`, with its own `frontend/node_modules` symlink to the main tree's, removed afterwards, P14);
     compare the sha256 of every file of the build output. Expected identical. Print **every** differing file before
     concluding anything; a difference you cannot explain is a hard stop.
   - **SDK laziness** (R-AI-2): a throwaway gitignored `_tmp_196_lazy*` entry and vite config under `frontend/` that
     import `src/services/ai/index.ts` statically and call one provider method; build it; show that the entry chunk
     contains none of the three SDKs (a marker string per SDK, with a positive control that the marker is found in the
     chunk that should hold it) and that each SDK lands in a chunk of its own loaded by dynamic import. Report the
     chunk names and gzip sizes. Delete the `_tmp_` files before the final message or leave them untracked, and run
     `npm run check:scripts` if any sits under `frontend/scripts/`.
8. **Mutation bench** (CLAUDE.md §5): at least four, each reverted: invert the R-AI-6 precedence; drop an unknown blob
   field on save; skip the `legacy_model_ids_v1` sentinel check; make the cache ignore the key hash. Each must turn a
   named test red; record which in the commit message.
9. Code commit: `feat(ai): persistent half of src/services/ai, #196 L1` (Prompt-ID in the body, the precedence measured
   in item 1, the two gates of item 7 with their numbers, the bench, `Model:` trailer). Closure commit, docs only (P13):
   the entry in `docs/log-inbox/196-ai-refactor.md` (skill `log-entry`), one entry for this lane that also says L1 is
   complete; this prompt's `Status:` line edited **by hand** to
   `eseguito 2026-11-02 · lane feat/196-l1-ai-module · <code commit short hash>`. `npm run check:docs` green.

## DOVE

- `frontend/src/services/ai/config/ProviderConfigStore.ts` (new)
- `frontend/src/services/ai/config/FeaturePreferenceStore.ts` (new)
- `frontend/src/services/ai/catalog/catalogCache.ts` (new)
- `frontend/src/services/ai/registry.ts` (new)
- `frontend/src/services/ai/index.ts` (new)
- `frontend/src/services/ai/__tests__/stores.test.ts` (new)
- `frontend/src/services/ai/__tests__/migrations.test.ts` (new)
- `frontend/src/services/ai/__tests__/catalogCache.test.ts` (new)
- `frontend/src/services/ai/__tests__/registry.test.ts` (new)
- `frontend/src/services/ai/__tests__/legacyKeyPrecedence.test.ts` (new)
- lane 1's files under `frontend/src/services/ai/` only for a missing export or a typed field this half needs (name it
  in the log entry; a behaviour change there is a hard stop)
- closure: `docs/log-inbox/196-ai-refactor.md`, this prompt's `Status:` line

## HARD STOP

- Item 1 cannot measure a single winner (the two copies are read in different places for different purposes): stop
  and report what each reader reads, file:line; Juri decides.
- The app build at the tip differs from the base in a way you cannot explain, or an SDK lands in the entry chunk.
- A behaviour of spec §5/§6 for this half needs `joiner` or `types/jodie.ts` outside `__tests__/`.
- A file outside DOVE needs to change.

## NON FARE

No edit to any existing file under `frontend/src/` outside `services/ai/`. No consumer wired to the module (that is
L2). No new dependency, no `package.json` change. No network call, no real key. No merge, no push, no issue comment. No
hardcoded event string (rule 25), no emoji, no `console.log` left in code.
