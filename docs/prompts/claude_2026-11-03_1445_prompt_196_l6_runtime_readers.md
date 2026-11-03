# #196 L6 lane 1/3: runtime readers of types/jodie.ts onto src/services/ai, bridge deleted

Prompt-ID: P-2026-11-03-1445
Chat: C-2026-11-03-1227
Front: ai-provider
Lane: full
Depends: P-2026-11-03-1430
Status: da eseguire
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-03, «continua a lavorare per chiudere la issue 196»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 90 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none. No file of DOVE is a row of the root `CLAUDE.md` §3.1 or one of the six files of §3.2; no Layer
Impact Report owed. Rule 19 is confirmed by Juri for the three lanes of L6 (R-AI-23).

Worktree: `/Users/juridirocco/development/jjodel-196-l6`, branch `feat/196-l6-consolidation`, from `staging`
`b443faf2b` (L4 code merged at `7816c57ec`); `frontend/node_modules` is a symlink to the main tree's (P14: do not
remove it, and **never run `npm install` in this worktree**). Before anything else: `pwd`, branch,
`git log -3 --oneline` (HEAD is `docs: add prompt P-2026-11-03-1445, lane 1/3 of chain-P-2026-11-03-1445`; under it the
commit of R-AI-22..23 in `docs/decisions.md`, then `b443faf2b`), `git status --short` empty,
`test -L frontend/node_modules`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-03-1445 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1): read by ranges, builds
and tests through `node scripts/run-quiet.mjs`. Keep `~/.jjodel-lanes/P-2026-11-03-1445/handoff.md` current after each
commit (RC-51): lanes 2 and 3 of this chain start from it. Commit early: L2 and L3 hit the context ceiling.

## Context (read, do not trust: re-read the real files, P3)

- Spec `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md` §7 «L6». Decisions: R-AI-1 (no facade, OCL contract
  dead), R-AI-12 (Doc types to `src/types/documentation.ts`, lane 2), **R-AI-23** (this chain, and the measured list
  of runtime readers this lane owns).
- `src/services/ai/index.ts` is the new module's public surface: `PROVIDER_IDS`, `PROVIDER_SPECS`, `SEEDS`,
  `modelDirectory`, `registry`, `ProviderConfigStore`, `FeaturePreferenceStore`, `cachedModels`, `refreshCatalog`,
  `refreshIfStale`… The module imports neither `joiner` nor `types/jodie.ts`; keep it so.
- L2 left the cutover helpers in `components/common/ProviderModelSelector.tsx` (`preferredProviderId`,
  `preferredModelId`, `hasCatalog`, `refreshLiveCatalog`). `refreshLiveCatalog` also copies the live list into the
  in-memory `AI[p].versions` through `applyModelCatalog` (`types/jodie.ts`): that is **the bridge**, and L3 kept it
  because of its live readers (`AISettingsContent.tsx` around `:300`, `AIAssistantSettings.tsx` around `:44`). Its
  comment near `ProviderModelSelector.tsx:72` is stale.
- Baseline behaviour of L1-L3 that Juri accepted: do not change it (log entries in `docs/log-inbox/196-ai-refactor.md`).

## COSA

1. **Measure** (P3, P12). Every value (not type) import of `types/jodie.ts` in `frontend/src` outside `types/jodie.ts`
   itself and tests: file:line, names, and what each use reads (`AI[p].versions`, `.keyPlaceholder`, `.initial`,
   `.color`, `.bgColor`, `.logo`, `.label`, `AIProvider.X`, `ALL_AI_PROVIDERS`, `AI.DOCUMENTATION_STORAGE_PREFIX`,
   `applyModelCatalog`, anything else). Search static imports and `import(`, with a positive control in the same form.
   Expected set (R-AI-23): `AISettingsContent.tsx`, `AIAssistantSettings.tsx`, `ProviderConfigModal.tsx`,
   `ChatMessages.tsx`, `DocumentationService.ts`, `DocumentationTab.tsx`, `Jodie.tsx`, `JodieHeader.tsx`,
   `JodieMinimized.tsx`, `ProviderModelSelector.tsx`. Table in the handoff. A runtime reader outside DOVE → HARD STOP.
2. **`components/common/providerVisuals.ts`** (new): the twelve `addGUIinfo(...)` rows of `types/jodie.ts`, copied
   verbatim (initial, key placeholder, color, background, logo), keyed by provider id, with a typed accessor. No
   import of `types/jodie.ts`. A test that the table answers the same values as `AI[p]` today (that test imports
   `types/jodie.ts`; lane 2 rewrites it to literal values when the file goes).
3. **Move each reader** of item 1 off the runtime values of `types/jodie.ts`:
   - model lists (`AI[p].versions`) → the `services/ai` directory/catalog (`modelDirectory`, `cachedModels`, seeds),
     same order and same labels as shown today;
   - GUI fields → `providerVisuals.ts`;
   - `AIProvider.X` statics and `ALL_AI_PROVIDERS` → `ProviderId` string literals and `PROVIDER_IDS` (Llama and
     Copilot are already gone from the settings list since L2; do not bring them back);
   - `AI.DOCUMENTATION_STORAGE_PREFIX` → a constant beside `DocumentationService` with the **same string**
     (`'jjodie_doc_'`: persisted user data, never renamed);
   - `delete AI[oldName]` and any other write to `AI` in `AISettingsContent.tsx`: measure what it does today and
     keep the user-visible behaviour with the new stores; a write with no reader left goes.
   Type imports (`TAIProvider`, `ChatMessage`, …) stay as they are: lane 2 moves them.
4. **Delete the bridge**: `applyModelCatalog` call and import in `ProviderModelSelector.tsx`, and its stale comment;
   `cachedModelsFor` from `services/aiModelCatalog.ts` → `cachedModels` of `services/ai` if equivalent (measure the
   key and entry format first; it must read the same `jjodel_models_<provider>` entries). Do not delete
   `applyModelCatalog` itself from `types/jodie.ts` (lane 2 deletes the file).
5. **Probes** (gitignored, in this tree): `frontend/scripts/smoke/_tmp_196_l2_probe.ts` (settings, Test connection,
   preference, dock width) and `_tmp_196_l4_probe.ts` (chat consumers, no Worker). Run both on the base before item 2
   and after item 4, from the tree root:
   `SMOKE_URL=http://localhost:3195 node frontend/scripts/lane-run.mjs probe /Users/juridirocco/development/jjodel-196-l6 frontend/scripts/smoke/<probe> --port 3195 --id P-2026-11-03-1445`.
   The L2 probe was written for port 3197 and an older tree: fix what is stale in it (selectors of a moved
   component), never weaken an arm to make it pass; report each change. Same score before and after, or a stated
   reason per arm. Add one arm to a copy `_tmp_196_l6_probe.ts` if needed for what this lane changes (provider avatar
   colors in the settings list and in a Jodie message, the model list of a provider with a cached live catalog).
6. **Gates**: `npm run typecheck` exit 0; `npm run build` exit 0; full `npm run test` with only the nine known reds;
   `npm run check:docs` green.
7. **Commits**: code and tests in one or more `refactor(ai): …, #196 L6 lane 1` commits (pathspec on the commit,
   P13). No log entry and no `Status:` flip in this lane: lane 3 writes one entry for all of L6 and flips the three
   prompts. Handoff final: the item 1 table, what each reader now reads, the probe scores, what lane 2 must know
   (remaining imports of `types/jodie.ts`, all type-only). End with `Outcome: done`.

## DOVE

- new: `frontend/src/components/common/providerVisuals.ts` and its test under `frontend/src/components/common/__tests__/`
- `frontend/src/components/settings/AISettingsContent.tsx`
- `frontend/src/pages/settings/AIAssistantSettings.tsx`
- `frontend/src/pages/settings/ProviderConfigModal.tsx`
- `frontend/src/components/Jodie/ChatMessages.tsx`
- `frontend/src/components/Jodie/Jodie.tsx`, `JodieHeader.tsx`, `JodieMinimized.tsx` (runtime `AIProvider` uses only)
- `frontend/src/components/abstract/tabs/DocumentationTab.tsx`
- `frontend/src/services/DocumentationService.ts`
- `frontend/src/components/common/ProviderModelSelector.tsx`
- tests of the files above, if they exist and break on the move
- gitignored, not committed: `frontend/scripts/smoke/_tmp_196_*`

## HARD STOP

- Item 1 finds a runtime reader outside DOVE.
- A reader needs data that neither `src/services/ai` nor `providerVisuals.ts` can give without changing L1 behaviour.
- A persisted key (localStorage name or format) would change.
- A probe arm that was green on the base goes red and you cannot fix it inside DOVE.

## NON FARE

No deletion of `types/jodie.ts` or `services/aiModelCatalog.ts` (lane 2). No type-import moves (lane 2). No edit to
`src/services/ai/` beyond what an import needs (none expected; if one is needed, say why in the handoff), to
`CLAUDE.md`, `AGENTS.md`, `docs/CODEBASE-MAP.md` (lane 3), to `cloudflare-worker/` (R-AI-22). No new dependency, no
`npm install`. No real key, nothing read from `~/.jjodel-lanes/keys196.env`. No vite on 3001. No merge, no push, no
issue comment. No hardcoded event string (rule 25), no emoji, no `console.log` left in code.
