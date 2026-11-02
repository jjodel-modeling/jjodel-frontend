# #196 L0: AI-layer inventory, SDK spike, frozen spec

Prompt-ID: P-2026-11-02-1020
Chat: C-2026-11-02-1016
Front: ai-provider
Lane: full (two-phase, docs only in the repo; spike outside the repo)
Depends: none
Status: da eseguire
Corregge: —
Request: Juri, 2026-11-02, in chat («riparti con il compito 196»; spike with real keys, line `staging`)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/development/jjodel-196`, branch `docs/196-l0-spec`, cut from `staging` at `58ac7a61d` plus the commit
that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Context

Issue #196 («Enhanced JJODIE») holds a Jjodie architecture report and a seven-lane plan to rebuild the AI provider
layer (L0 spec and discovery, L1 new `src/services/ai/` module on three SDKs, L2 settings cutover, L3 chat cutover and
`AIProviderService` deletion, L4 proxy removal, L5 orphan sweep, L6 `types/jodie.ts` deletion). A copy of the issue
body, as of 2026-11-02, is at `~/.jjodel-lanes/spike196/issue196.md`: read its second half («Jjodie AI-layer
refactoring plan», line 160 on) in full, the first half by ranges as you need it. The plan was written on 2026-10-21;
its line numbers are hypotheses about that tree (CLAUDE.md §5, fixtures from memory).

L5 is done: merge `b524fa1da` on `staging` deleted 34 orphan files (`components/JjodieWidget/`, `jjodie-integration/`,
the old action system, the `services/JodieConfig.ts` tombstone, ten superseded `components/Jodie/` components) and two
barrel re-exports. Any file in the plan that L5 deleted is gone on purpose.

This lane is L0. It writes no code in the repo. Its job is to turn the draft plan into a frozen spec that L1 can be
written from, and to measure the three things the plan assumes and nobody has measured: who still reads the AI layer,
whether the three SDKs work from a browser origin without the Worker, and what they cost in bundle.

## COSA

Two phases (P3). Phase 1 ends at a hard stop with the discovery report committed; phase 2 starts only on a resume
message that opens `[P-2026-11-02-1020] GO`.

### Phase 1: discovery

**A. Inventory**, every search with a positive control through the same tool and its exit status recorded (CLAUDE.md
§5; use `command grep` when `--include` or ignored paths carry the meaning). Paths relative to `frontend/`.

1. Every importer of `src/types/jodie.ts` (static, dynamic, `export ... from`), with the symbols each one imports. Classify
   each symbol as AI-layer (registry, config, models, enums) or chat/console (`ChatMessage`, `ConsoleEntry`,
   `JjodieScope`, ...). This table is L6's input.
2. Every reader of `getAICompany`, `companymap`, `aimap`.
3. The OCL contract (gate of decision ④). Where `AI`, `AIConfig`, `JodieConfig` are registered with
   `@RuntimeAccessible` (`types/jodie.ts:180` and `:507` today), every code path that resolves a runtime-accessible class
   by name, and every occurrence of those three names as identifiers inside persisted or shipped content in the repo:
   default views and `jsxString` templates, `public/`, examples and sample projects, test fixtures, JjEL / JjScript /
   OCL snippets in docs. User projects on the server are out of reach: say so as a gap, do not guess.
4. Verify the plan's file lists against today's tree. Every line the plan cites (`ExplainModal.tsx:34`,
   `aiModelCatalog.ts:309`, `AIProviderService.ts:23/~115/~159/240/~980`, `types/jodie.ts:216/662-824`,
   `events/registry.ts:111`, `console/providers/jjodieProvider.ts:53`, `DocumentationService.ts:614`,
   `jjtl/services/AIMatcher.ts:52`, `DocumentationTab.tsx:583`, `SuggestedMappingsPanel.tsx:262`, `aiModelCatalog.test.ts:100`):
   still there, moved, or gone. Then every consumer of `AIProviderService`, `AIConfig`, `AI`, `JodieConfig` (the class in
   `types/jodie.ts`) and `aiModelCatalog` that the L2/L3/L6 lists miss. Three misses are already known:
   `StatusBarRightZone.tsx`, `jjtl/services/MappingSuggestionService.ts`, `pages/settings/AIAssistantSettings.tsx`;
   confirm or refute each and look for more. Say whether `useAIProviderPreference` (CLAUDE.md §16) exists.
5. The exact localStorage keys the AI config reads and writes today, with file:line. L1's stores must reuse them.
6. The behaviour-transport table (§4 of the plan): for each row, where the behaviour lives today, file:line, and the
   test that pins it, or «no test».
7. The tests that cover the AI layer today: files and test counts, run through the quiet runner.
8. The Worker: what `cloudflare-worker/` contains, which origins and routes it serves, and every place in `src/` that
   can still send a request to it.

**B. Spike, outside the repo**, in `~/.jjodel-lanes/spike196/` (its own `package.json`; nothing under the worktree).

1. Install the current stable `openai`, `@anthropic-ai/sdk` and `@google/genai` there. Record exact version, licence,
   number of transitive dependencies, and whether each one has a browser ESM entry.
2. Bundle size: one esbuild entry per SDK (browser platform, ESM, minified) that imports what the provider will use
   (client, chat, streaming, models list). Raw and gzip bytes per SDK. Use the esbuild in the worktree's
   `frontend/node_modules`.
3. Browser calls. Serve one static page from the spike folder on a free port in 3010..3019 (check with `lsof`; other
   lanes may run) at `http://localhost:<port>`, load the three bundles, and drive it with Chromium through Playwright
   (absolute import from the worktree's `frontend/node_modules/@playwright/test`). Per family:
   - **Anthropic**: `models.list`; `messages.create` with `max_tokens` 16 on the cheapest current model; a streamed
     `messages.stream` of a few tokens (decision ③, `ExplainModal`). Record what the SDK needs to run in a browser
     (`dangerouslyAllowBrowser`, the `anthropic-dangerous-direct-browser-access` header).
   - **Gemini**: `models.list`; `generateContent` with a short prompt; one `inlineData` PDF of a single page made in the
     spike, if the key allows it.
   - **OpenAI-compatible**: whichever of Groq, Kimi, DeepSeek, Mistral, OpenAI has a key: `models.list`,
     `chat.completions.create` with `max_tokens` 16, one streamed call. Record the SDK's browser flag.
   - **Every family, invalid key**: the error class the SDK throws, the HTTP status, and whether the browser could read
     the response (a readable 401 proves CORS without the Worker). This maps to `FailureCatalog.AUTH`.
   - Record status, latency, and the shape of the answer (model count, first three model ids, characters returned).
     At most 20 calls in all, `max_tokens` never above 32.
4. **Keys.** Juri writes them in `~/.jjodel-lanes/keys196.env` (lines `ANTHROPIC_API_KEY=`, `GEMINI_API_KEY=`, and
   one or more of `GROQ_API_KEY=`, `KIMI_API_KEY=`, `DEEPSEEK_API_KEY=`, `MISTRAL_API_KEY=`, `OPENAI_API_KEY=`). Read the
   file only from the Playwright driver and pass each key to the page at run time. No key, and no fragment of a key,
   goes to stdout, to a file under the worktree, to the discovery report, to the log, to a commit or to a message: print
   key presence as `set` / `absent`. If the file is missing or lacks a family, run that family's invalid-key arm only and
   report the real-key arm as skipped with the reason.

**C. Version freeze proposal**: exact version per SDK, with the reason (browser support, ESM entry, size), and the
`package.json` lines L1 would add. Do not touch `package.json` (rule 4).

**Phase 1 output**: `docs/discovery/discovery_2026-11-02_196_l0_ai_layer.md` (skill `discovery-report`), committed
alone with subject `docs: #196 L0 discovery, AI layer inventory and SDK spike`. It ends with a section «Questions for
Juri», one per item, each with `Recommended:`:
- decision ④ (OCL contract on `AI` / `AIConfig` / `JodieConfig` declared dead), with the count from A3;
- rule-4 approval of the three dependencies at the frozen versions;
- decision ⑤ (abstract class `BaseProvider`, module `src/services/ai/`), confirm or rename;
- decision ⑥ (delete `cloudflare-worker/` after the Cloudflare deployment is removed; the account is Alfonso's), with
  what A8 found;
- every correction of the L1..L6 file lists that A4 produced, as one list.

Then `Outcome: hard-stop`.

### Phase 2: frozen spec (only after `[P-2026-11-02-1020] GO`)

The GO message carries Juri's answers; the chat will have committed the decision rows (`R-AI-n`) in
`docs/decisions.md` on this branch before the resume. Write `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md`:
the plan of the issue (second half of `issue196.md`), with the file lists corrected by A4, the transport table with
today's file:line and tests from A6, the localStorage keys from A5, the pinned versions from C, the spike measures that
justify the SDK strategy (B), and the decisions as ratified, each citing its `R-AI-n` row. Mark L5 as done (`b524fa1da`).
Status line: «frozen 2026-11-02». Commit it alone: `docs: #196 L0 frozen spec, AI provider refactor`.

## DOVE

Writes in the repo, nothing else:
- `docs/discovery/discovery_2026-11-02_196_l0_ai_layer.md` (phase 1)
- `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md` (phase 2)
- `docs/log-inbox/196-ai-refactor.md` (log entry, skill `log-entry`)
- the `Status:` line of this prompt (skill `status-flip`)

Writes outside the repo: `~/.jjodel-lanes/spike196/` only.

## HARD STOP

- End of phase 1, always (above).
- Any search that would need a file outside the list above to be modified.
- A3 finds the three names used as identifiers in shipped content (a default view, a template, a sample project):
  report it as the first finding of the report, still at the phase-1 stop.

## NON FARE

No code change in `frontend/`, no `package.json` or lockfile change, no `npm install` in the worktree. No write to
`docs/decisions.md` (the chat writes the rows). No change to `cloudflare-worker/`, no `wrangler` command. No key
material anywhere but in memory of the driver process. No merge, no push, no issue comment.

## Lane discipline

Every reply opens with `[P-2026-11-02-1020 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list and the phase-1 stop. Critical-zone files are not authorised (and not needed: read
only). Time limit: 90 minutes per phase. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1): read by
ranges, build and test output through the quiet runner. Subject lines without `(P-...)` suffix, Prompt-ID in the body,
`Model:` trailer. Stop the static server at the end of the spike.
