# Discovery 2026-11-04 — trunk realigned with staging, on a branch

- Prompt-ID: P-2026-11-04-1640 (`docs/prompts/claude_2026-11-04_1640_prompt_staging_realign.md`), chat C-2026-11-04-1615
- Session: 893ddaad-5885-4e28-a853-21eccb90269f
- Tree: `~/jjodel-w-stagingsync`, branch `staging-realign`, HEAD before `d6fc11ebf`, merge `f59fc2371` (parents `d6fc11ebf`, `b619c8300`)
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Readers downstream re-read the real files.

## Hypotheses under test

1. The merge of `b619c8300` conflicts in exactly the four files measured at 16:31. **Holds** (measured): `git merge --no-ff --no-commit b619c8300` reported `docs/decisions.md`, `docs/harness/fronts.json` (content), `frontend/src/services/AIProviderService.ts` and its test (modify/delete), nothing else. Divergence at merge time: 945 trunk-only commits (944 plus the prompt commit `d6fc11ebf`), 81 staging-only, base `ad73e5f39`.
2. No `R-` id exists on both sides with different text. **Holds** (measured; script over stages 1/2/3 of `docs/decisions.md`, every `- **<ID>**` row of every id family): 597 rows trunk, 530 staging, 507 base; 90 new on the trunk, 23 new on staging (all `R-AI-*`); no id new on both sides. One id differs between the sides, `R-GEN-18`, and staging's text equals the base: a trunk-only edit, not a collision.
3. The new layer already carries the behaviour of `8d5b5a1fe`. **Partly** (read on `b619c8300`): `frontend/src/services/ai/AnthropicCompatibleProvider.ts:81` already joined the text blocks, `return message.content.map(block => (block.type === 'text' ? block.text : '')).join('');`, but returned `''` with no text block; `frontend/src/services/ai/OpenAICompatibleProvider.ts:125`, `return completion.choices[0]?.message?.content ?? '';`, returned `''` on a null content. Neither threw.
4. Trunk code written since the base still uses something staging removed. **Falsified** (measured): see the Worker grep and the importer scan below; typecheck 0.

## Conflicts and their resolution

- `docs/decisions.md`: both blocks kept, the trunk's `## R-PLG` (ending with the R-JTG-17 rewrite of P-2026-11-04-1442) and then staging's `## R-AI` section. Markers removed, nothing else edited.
- `docs/harness/fronts.json`: union, `plugins` (milestone 16) then `ai-provider` (milestone 17). Valid JSON; no slug or milestone repeated (measured).
- `AIProviderService.ts` and `__tests__/AIProviderService.test.ts`: kept deleted (`git rm`). The behaviour of `8d5b5a1fe` is carried in the merge commit:
  - `AnthropicCompatibleProvider.ts` `send()`: joins the text blocks; with none, throws `` `${this.name} returned no text (stop_reason=…, blocks: …)` ``.
  - `OpenAICompatibleProvider.ts` `send()`: a non-string content throws `` `${this.name} returned no text (finish_reason=…[, refusal: …])` ``.
  - The five tests, ported to `frontend/src/services/ai/__tests__/requestShaping.test.ts`, block `carried from AIProviderService`. The sixth case of the old file (control: string content unchanged) is already pinned by `requestShaping.test.ts:167`, which asserts `'Hello'`.
  - Mutation bench (measured): with staging's two `send()` bodies, `4 failed | 46 passed (50)`, the four throw tests. The join test passes on both, because staging already joined; no staging test pinned the join (the 5 `thinking` hits under `services/ai/__tests__` are all in the ported block), so it was ported as missing.
  - Callers of `chat()` already pass a rejection on: `components/Jodie/console/providers/jjodieProvider.ts:69`, `jjtl/services/AIMatcher.ts:62-83`, `services/DocumentationService.ts:626`. The ChatMessages guards of `8d5b5a1fe` came through the merge: `components/Jodie/ChatMessages.tsx:52`, `:71`, `if (typeof text !== 'string')`.
- `CLAUDE.md`/`AGENTS.md` §16 merged cleanly with staging's text; the edit above follows its boundary (no import added in `src/services/ai`).

## Silent breakages

- None found. Importer scan (measured, `command grep` over `frontend/src` and `frontend/scripts`): none of the 43 modules the merge deletes (`types/jodie.ts`, `services/aiModelCatalog.ts`, `services/JodieConfig.ts`, `components/*/ProviderSelector.tsx`, `jjodie-integration/*`, …) has an importer left. Positive control in the same run: `BaseProvider` has 7 importers.
- Typecheck on the merged tree: exit 0, 0 `error TS` (complete log, `.agent-logs/typecheck-*`).

## Worker grep

`command grep -rn -E "jjodel-ai-proxy|PROXY_ENDPOINTS|PROXY_BASE_URL|AIProviderService|types/jodie" frontend/src cloudflare-worker` (exit 0, measured on the merged tree):
- `frontend/src`: comments only. `components/Jodie/ChatInput.tsx:688` `// TODO: real abort wired to AbortController in AIProviderService`, `components/Jodie/Jodie.tsx:45,196`, `JodieWindow.tsx:91`, `NotificationWidget/NotificationWidget.tsx:23`, `types/documentation.ts:2`, `components/Jodie/types.ts:2`, `components/common/providerVisuals.ts:5`, `pages/settings/AIAssistantSettings.tsx:14`, `services/ai/{BaseProvider.ts:9-10,types.ts:4,registry.ts:5,34,115,config/FeaturePreferenceStore.ts:5}` and test headers. No `PROXY_ENDPOINTS` or `PROXY_BASE_URL` anywhere.
- `cloudflare-worker/`: its own name (`package.json:2`, `wrangler.toml:1`, `src/index.ts:261`) and a stale `README.md:50` that points at `AI.getEndpoint()` in the deleted `types/jodie.ts`.
- Second search, `workers.dev|alfonso99` over `frontend/src`: only `NotificationWidget.tsx:24`, `const API_URL = 'https://jjodel-notifications.alfonso99.workers.dev';`, a different Worker, not in `cloudflare-worker/` (0 hits for `notification` in its `src/index.ts` and `wrangler.toml`).
- Verdict: no runtime caller of `jjodel-ai-proxy` after the merge. Its deletion is unblocked on the frontend side.

## Gates (frontend/)

- Lockfile: merged `package-lock.json` differs from the trunk's (+502 lines: `@anthropic-ai/sdk` 1.3.0, `@google/genai` 2.32.0, `openai` 7.47.0, staging's R-AI-2). `npm ci` in this worktree: 873 packages. No symlink was made; `node_modules` is a real install, gitignored.
- `npm run typecheck`: exit 0, 0 errors (§17 baseline zero).
- `npx vitest run`, merged tree before the commit (content equal to `f59fc2371`): `Test Files 4 failed | 520 passed (524)`, `Tests 32 failed | 13978 passed | 2 skipped (14012)`. Red: the 3 known import failures of §17, and 32 tests of `scripts/hooks/__tests__/bashGuard.test.ts`. Cause: the guard skips its commit checks while `MERGE_HEAD` exists (`frontend/scripts/hooks/bash-guard.mjs:165-167`). After the commit: `bashGuard.test.ts` `160 passed (160)`.
- Same run on the trunk tip `d6fc11ebf` (temporary worktree, its own `npm ci`, removed): `Test Files 4 failed | 513 passed (517)`, `Tests 13907 passed | 2 skipped`. Red: the 3 known files, plus `irSelectionRing.test.ts` (Chromium layout, suite-level), which passes on the merged tree.
- Two full re-runs on `f59fc2371` were killed at the 600 s limit: load average 228, single tests at ~925 s (`.agent-logs/vitest-post-*`, `vitest-post2-*`). The full-suite number after the commit is therefore not measured; the pre-commit run covers the same tree.
- `npm run build`: exit 0. `npm run check:docs`: 5/5 passed, 97 warnings. `npm run check:agents`: PASS.

## What bringing this branch onto staging would add, by front

No `3.2` tag exists, and the newest tag, `3.1.1`, is an ancestor of neither `d6fc11ebf` nor `b619c8300` (measured, `git merge-base --is-ancestor`), so all 945 trunk commits count as unreleased. Code commits per front (Prompt-ID → `Front:`):
1. codegen (~84 code commits): generators as viewpoints, the Text tab (language service, outline, hover, breadcrumb), editing an existing model from text, Pascal/Ada style catalog, expressions in parser and printer. Behind the `VITE_CODEGEN` build flag and the `jjodel.experimental.codegen` setting (`codegen/setting.ts:19-28`); «New model from text» too (`pages/components/LeftBar.tsx:571`).
2. hw-notation (39): large-canvas work in editor-v2 (no auto-layout above 500 nodes or edges, no network-simplex above 1,000 dummies, skip the forced first mount, size estimate for unmeasured nodes), and JjTL `let` errors. **Behind no flag.**
3. release-3-2 (11): JjTL interactive calls (`input`/`prompt`/`confirm`) on the JjEL path, nested `let` scoping, Ecore refusal of an already loaded nsURI, XMI M1 import skipping unknown/abstract classes. **Behind no flag.**
4. maintenance (17): JjScript console fixes (forall summary, `let` bindings, `create package` father kind), failing JjTL builtins as errors, JjEL-only forall collection. **Behind no flag.**
5. jjodie-ui (1): the empty-reply fix, now carried in `services/ai`. plugins (1): a sandbox probe test only, no runtime code.
6. Docs and harness: 648 docs commits, 102 merges; 100 prompts with no Front (before 2026-10-11) are docs-only on this range.

## Questions

1. Should the merge land on the trunk (`alfonso-frontend-jjtl`) by fast-forward of `staging-realign`, or should it be merged back into staging first?
2. Should the full vitest be re-run on `f59fc2371` when the machine is idle, before that step?
3. Does `cloudflare-worker/` get deleted now that no runtime caller is left, and `README.md:50` with it?
4. Should the hw-notation canvas thresholds (500/1,000) go to staging unflagged, or wait for a flag?
