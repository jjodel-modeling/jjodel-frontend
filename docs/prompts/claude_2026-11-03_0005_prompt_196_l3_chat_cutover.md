# #196 L3: chat cutover to src/services/ai and AIProviderService deletion

Prompt-ID: P-2026-11-03-0005
Chat: C-2026-11-03-0001
Front: ai-provider
Lane: full
Depends: P-2026-11-02-1930
Status: eseguito 2026-11-03 · lane feat/196-l3-chat-cutover · b73651997 · continued in P-2026-11-03-0020
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-03, «riparti con il compito 196»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 120 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none. No file of DOVE is a row of the root `CLAUDE.md` §3.1 or one of the six files of §3.2; no Layer
Impact Report owed. Rule 19 is confirmed by Juri for this lane, up to the 13 entries of DOVE, in two phases (R-AI-14).

Worktree: `/Users/juridirocco/development/jjodel-196-l3`, branch `feat/196-l3-chat-cutover`, from `staging`
`fa1546805` (L2 merged at `fe3d6552d`); `frontend/node_modules` is a symlink to the main tree's (P14: do not remove it,
and **never run `npm install` in this worktree**: npm replaces the symlink with a real directory, measured 2026-11-02).
Before anything else: `pwd`, branch, `git log -3 --oneline` (HEAD is the commit that adds this file; under it the
commit of R-AI-14..16 in `docs/decisions.md`, then `fa1546805`), `git status --short` empty,
`test -L frontend/node_modules`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-03-0005 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1): read by ranges, builds
and tests through `node scripts/run-quiet.mjs`. Keep `~/.jjodel-lanes/P-2026-11-03-0005/handoff.md` current after each
commit (what is done, what is next, measures taken) so a continuation lane can pick it up after a context ceiling
(RC-51). The L2 lane hit that ceiling: commit early, keep the handoff short.

## Context (read, do not trust: re-read the real files, P3)

- Spec `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md`: §6 (transport table), §7 «L3» (line numbers are
  of `288425992`: re-find them). Decisions in `docs/decisions.md` «R-AI»: this lane is bound by R-AI-14 (two phases),
  R-AI-15 (`signal`), R-AI-16 (the smoke's keys), and by R-AI-7/8 already built in L1.
- The new module `frontend/src/services/ai/` (`index.ts` is its public surface) and the L1/L2 entries in
  `docs/log-inbox/196-ai-refactor.md`. Baseline decisions of L1/L2 that Juri accepted, do not undo them: 404 is SERVER;
  OpenAI 429 `insufficient_quota` has its own «no credit» message; attachments are gated by declared capability; the
  feature preference keeps `{ providerId, modelId?, updatedAt }`; no SDK retries; Gemini `systemInstruction`; OpenAI
  PDF as a file part.
- L2 left the shared cutover helpers in `components/common/ProviderModelSelector.tsx`, exported until L6 moves them:
  `preferredProviderId(feature)` (was `AIConfig.getPreferred`), `preferredModelId(feature)` (was `getPreferredModel`),
  `hasCatalog`, `refreshLiveCatalog`. The consumers of this lane use them; they do not reimplement them.
- **The L2 bridge** (its log entry names it, L3 deletes it): `refreshLiveCatalog` also copies the live list into the
  in-memory `AI[p].versions` of `types/jodie.ts` (`applyModelCatalog`), because the old chat path resolved models
  against it. L2 measured the old readers: `resolveCurrentModelId` and `isForeignModel` of `types/jodie.ts`, called on
  every `AIProviderService.chat`. Phase 2 deletes the bridge only if no live reader of `AI[p].versions` is left.
- Known risk from L1 (memory of the chat, unmeasured): the `openai` SDK sends `x-stainless-*` headers, which can fail
  the CORS preflight on servers with a narrow allow-list (Ollama, a Custom base URL). The mocks cannot see it; the
  real-key smoke of item 7 can. If you find a way to read the preflight in the probe, say what it shows.

## COSA, phase 1 (cutover, ends at a hard stop)

1. **Measures before edits**, written into the handoff, each with file:line:
   (a) what `AIProviderService.chat` does for its four callers that `BaseProvider.chat` must also do, row by row: key
   coherence, foreign-model guard and its fallback warning (where the warning surfaces today), the history mapping
   (the current user turn last), the system prompt, the image/PDF conversion from `ChatImage`/`ChatDocument` to
   `Attachment`, the error texts the user sees (Jodie bubble, documentation toast, JjTL panel), max tokens. Each row:
   «same in the new module» (name the line) or «gap». A gap that changes what the user sees is filled at the call site
   inside DOVE; if it can only be filled in L1 code beyond R-AI-15, stop (HARD STOP).
   (b) `ExplainModal.tsx`: the providers it streams today (Claude and four OpenAI-compatible ones; the others throw),
   the message it shows when no provider is configured, what closing the modal does to the request.
   (c) where the chat's own preference resolution (`AIConfig.getPreferred`/`getPreferredModel`) and the L2 helpers
   differ, if they do (fallback order, a stored retired id).
2. **R-AI-15**: `signal?: AbortSignal` on `ChatRequest` in `services/ai/types.ts` (optional only, rule 11), forwarded by
   `AnthropicCompatibleProvider`, `GoogleCompatibleProvider`, `OpenAICompatibleProvider` to their SDK for both `chat`
   and `chatStream`. Tests in `services/ai/__tests__/requestShaping.test.ts`, per family: the SDK request carries the
   signal, and an abort mid-stream ends the iteration with an abort error. Prove each test on a mutation bench (drop
   the forwarding, the test dies; restore). Commit: `feat(ai): ChatRequest carries an abort signal, #196 L3`.
3. **The four consumers** (spec §7 «L3»):
   - `components/Jodie/console/providers/jjodieProvider.ts`: `AIProviderService.chat` → `registry.get(id).chat(req)`;
     system prompt and RAG context still assembled at the call site as today.
   - `services/DocumentationService.ts`: provider/model via the L2 helpers, chat via the registry.
   - `jjtl/services/AIMatcher.ts`: same; forward its `signal` (R-AI-15) and remove the TODO that asked for it.
   - `components/ExplainModal.tsx`: delete `streamClaude` and `streamOpenAI`; consume `provider.chatStream(req)` with
     the modal's `AbortController` signal. Every family now streams (decision ③): the «Streaming not supported» branch
     goes; the «no provider configured» message stays as it reads today.
   Only these files and the R-AI-15 ones change in phase 1. `AIProviderService.ts` stays, unused by them.
   Commit: `feat(ai): chat consumers on src/services/ai, #196 L3`.
4. **Gates** after each commit: `npm run typecheck` exit 0 (zero baseline, CLAUDE.md §17); `npm run test` full, only
   the nine known import failures; `npm run build` exit 0. Every count on complete output with its exit status.
5. **Probe** (`lane-run probe`, a gitignored `_tmp_196_l3*` Playwright script, the `__name` shim of
   `scripts/smoke/README-probes.md`, no real key: `page.route` mocks that answer like each provider), one arm per
   consumer, each with a positive control: Jodie chat on one provider per family (assert the request body and the
   rendered answer); an image attachment on a model that declares IMAGES; ExplainModal streams a multi-chunk mocked
   answer that is visible chunk by chunk, and closing the modal mid-stream aborts the request (assert it); documentation
   generation and a JjTL mapping suggestion reach the mocked provider. Find the real gestures first (ExplainModal opens
   on `JjodelEvents.EXPLAIN_OPEN`, dispatched by `ContextMenu.tsx` and `EditorV2.tsx`): a checklist item whose gesture
   does not exist is worse than none.
6. **The no-key check**: with no provider enabled, each of the four consumers shows the same message as on `staging`
   (compare with the base tree, not from memory).
7. **Visual checklist for Juri, then hard stop** (P8): after the last code commit, start nothing yourself on 3001;
   write the checklist in your final message for port **3198** (the chat starts vite from this tree after you exit) and,
   for each item, the gesture, the expected result and the provider. Real keys are Juri's, typed in the UI by him
   (R-AI-16): Claude, Gemini, Ollama (`http://localhost:11434`, a local model), Custom pointed at OpenRouter
   (`https://openrouter.ai/api/v1`, a model OpenRouter lists), OpenAI (expect the «no credit» message), Mistral only if
   Juri has a key. Items at least: a Jodie chat answer per available provider; an image and a PDF on Claude or Gemini;
   ExplainModal visible streamed answer on Claude and on one OpenAI-compatible provider, and closing it mid-answer;
   a documentation generation; a JjTL mapping suggestion; a wrong key on the chat reads as an auth error. End with
   `Outcome: hard-stop`.

## COSA, phase 2 (after Juri's GO, a resume opening `[P-2026-11-03-0005] GO`)

8. **Coverage before deletion**, in the handoff: every `it` of `services/__tests__/AIProviderService.test.ts` and the
   cases of `services/__tests__/aiModelCatalog.test.ts` that import `AIProviderService` (spec: `:160`, `:170`, `:254`,
   `:376`, re-find them) mapped to the L1/L3 test that already pins the same behaviour (file and test name), or marked
   «owed». `resolveChatCompletionsUrl`'s three base-URL forms (spec §6) need a named test in the new module: if L1 has
   none for all three, add it to `requestShaping.test.ts`. Every «owed» row gets its test before the deletion.
9. **Deletion**: zero importers of `services/AIProviderService` first (a search with a positive control, CLAUDE.md §5),
   then delete `services/AIProviderService.ts` and `services/__tests__/AIProviderService.test.ts`; rewrite the
   `aiModelCatalog.test.ts` cases against the new module (or delete a case whose behaviour row 8 maps to a named test,
   and say which). `services/aiModelCatalog.ts` itself stays (L4). Comments elsewhere that still name
   `AIProviderService` stay (rule 8); list them in the handoff for L6.
10. **The bridge**: measure the live readers of `AI[p].versions` (and of `resolveCurrentModelId`, `isForeignModel`)
    after the deletion. None live: remove the bridge from `refreshLiveCatalog` in `ProviderModelSelector.tsx` and nothing
    else in that file. Any live: keep it, name the reader in the log entry for L6.
11. **Gates** as item 4, then rerun the item 5 probe on the final tree. Commit:
    `refactor(ai): delete AIProviderService, #196 L3` (and the bridge in the same commit if it goes).
12. **Closure**: the entry in `docs/log-inbox/196-ai-refactor.md` (skill `log-entry`; Notes name the bridge's fate, the
    signal, the coverage map's «owed» rows), this prompt's `Status:` line edited **by hand** to `eseguito <date> · lane
    feat/196-l3-chat-cutover · <last code commit>`; `npm run check:docs` green; one docs-only commit. End with
    `Outcome: done`.

## DOVE

- `frontend/src/components/Jodie/console/providers/jjodieProvider.ts`
- `frontend/src/services/DocumentationService.ts`
- `frontend/src/jjtl/services/AIMatcher.ts`
- `frontend/src/components/ExplainModal.tsx`
- `frontend/src/services/ai/types.ts` (R-AI-15 only)
- `frontend/src/services/ai/AnthropicCompatibleProvider.ts` (R-AI-15 only)
- `frontend/src/services/ai/GoogleCompatibleProvider.ts` (R-AI-15 only)
- `frontend/src/services/ai/OpenAICompatibleProvider.ts` (R-AI-15 only)
- `frontend/src/services/ai/__tests__/requestShaping.test.ts` (R-AI-15 tests; phase 2 three-form and «owed» tests)
- `frontend/src/services/__tests__/aiModelCatalog.test.ts` (phase 2)
- `frontend/src/components/common/ProviderModelSelector.tsx` (phase 2, the bridge only, item 10)
- delete, phase 2: `frontend/src/services/AIProviderService.ts`, `frontend/src/services/__tests__/AIProviderService.test.ts`
- closure: `docs/log-inbox/196-ai-refactor.md`, this prompt's `Status:` line

## HARD STOP

- A gap of item 1 (a) can only be filled in L1 code beyond R-AI-15, or in a file outside DOVE: report file:line, Juri
  decides.
- A consumer outside DOVE still imports `AIProviderService` at item 9.
- A measured fact contradicts the spec or an R-AI row in a way that changes what this lane builds.
- The typecheck shows an error you cannot fix inside DOVE.
- Item 7: always, for Juri's real-key smoke and GO.

## NON FARE

No edit to `types/jodie.ts`, `services/aiModelCatalog.ts`, `services/PromptService.ts`, the Jodie UI files
(`Jodie.tsx`, `ChatInput.tsx`, `JodieWindow.tsx`, `ChatMessages.tsx`), `cloudflare-worker/` (L4, L6). No deletion in
phase 1. No change to L1 behaviour beyond R-AI-15. No new dependency, no `npm install`. No network call with a real key
from the lane, nothing read from `~/.jjodel-lanes/keys196.env`. No vite on 3001 or 3198. No merge, no push, no issue
comment. No hardcoded event string (rule 25), no emoji, no `console.log` left in code.
