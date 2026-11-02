# #196 L2: settings and catalog UI cutover to src/services/ai

Prompt-ID: P-2026-11-02-1916
Chat: C-2026-11-02-1311
Front: ai-provider
Lane: full
Depends: P-2026-11-02-1321
Status: da eseguire
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-02, «riprendi»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 120 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none. No file of DOVE is a row of the root `CLAUDE.md` §3.1 or one of the six files of §3.2; no Layer
Impact Report owed. `JodieWindow.tsx` is in the active areas table (§2.5, «Jodie UI»): explore its local constraints
before editing. Rule 19 (13 files) is confirmed by Juri for this lane as one lane (R-AI-10).

Worktree: `/Users/juridirocco/development/jjodel-196-l2`, branch `feat/196-l2-settings-cutover`, from `staging`
`4ecb408bb` (L1 merged at `d2cd747a0`); `frontend/node_modules` is a symlink to the main tree's, which already holds the
three SDKs (P14: do not remove it, and **never run `npm install` in this worktree**: npm replaces the symlink with a real
directory, measured 2026-11-02). Before anything else: `pwd`, branch, `git log -2 --oneline` (HEAD is the commit that
adds this file, its parent `4ecb408bb`), `git status --short` empty, `test -L frontend/node_modules`. Otherwise stop with
`Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-02-1916 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1): read by ranges, builds
and tests through `node scripts/run-quiet.mjs`. 13 files is a large lane: commit by group (item 6) so that a context
ceiling leaves a coherent, green tree behind, and keep `~/.jjodel-lanes/P-2026-11-02-1916/handoff.md` current after each
group (what is done, what is next, measures taken) so a continuation lane can pick it up (RC-51).

## Context (read, do not trust: re-read the real files, P3)

- Spec `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md`: §5 (keys), §6 (transport table), §7 «L2» (the 13
  files and their changes, with line numbers of `288425992`: re-find them). Decisions in `docs/decisions.md` «R-AI»:
  this lane is bound by R-AI-9 (`dockWidth`), R-AI-10 (one lane), R-AI-11 (`getStatus`), R-AI-13 (the Claude live
  catalog works without the Worker for a valid key).
- The new module `frontend/src/services/ai/` (`index.ts` is its public surface) and the two L1 entries in
  `docs/log-inbox/196-ai-refactor.md`. The lanes took decisions unattended that Juri did not veto and that become
  visible from this lane on; they are the baseline, do not undo them: `test()` is one tiny generation call for every
  family (Claude `max_tokens` 1 on `/v1/messages`), so the old «selected model not offered» warning of Test connection
  is gone; a 404 is SERVER; OpenAI 429 `insufficient_quota` has its own «no credit» message; attachments are gated by
  declared capability; the feature preference keeps today's `{ providerId, modelId?, updatedAt }` shape.
- Measured by lane 2 of L1 (R-AI-6): `JodieConfig.load` reads only `jjodie_provider_<name>`; `AIConfig.save` writes both
  copies, `AIConfig.update` only the provider key. And: today the blob's `dockWidth` is never restored at load and the
  next save drops it. Re-measure the second fact in the running app before building R-AI-9 on it (CLAUDE.md §5,
  fixtures from another session).

**Coexistence until L3 (the risk of this lane).** After this lane the settings write through the new stores, but the
chat, documentation, JjTL matcher and `ExplainModal` still run on `AIProviderService` and the in-memory `AI.*` /
`AIConfig` objects of `types/jodie.ts` until L3. A key, model, base URL or enabled flag saved in the new settings must
reach those old paths **without a page reload**, and a preference set by an old path must show in the new settings.
Measure first how the old paths read (in-memory object loaded once vs localStorage at each call), then choose the
smallest bridge that holds it, inside the files of DOVE (for example: a consumer that saves through the new store also
calls the existing old reload/update entry point, which DOVE files may still import until L6). The new module itself
must still import neither `joiner` nor `types/jodie.ts`. Name the bridge in the log entry: L3 deletes it.

## COSA

1. **Measures before edits**, written into the handoff: (a) R-AI-11: a test that pins what `AIConfig.getStatus`
   (`types/jodie.ts`) returns for a configured and an unconfigured provider; if the label is inverted, the new home fixes
   it and the log entry says so, otherwise it moves as is; the test lives in a new file under
   `frontend/src/services/ai/__tests__/` and runs against today's code (the precedent is
   `legacyKeyPrecedence.test.ts`). (b) the read path of each old consumer that stays until L3 (in-memory vs storage),
   file:line. (c) where `dockWidth` is read and written today and whether it survives a reload.
2. **Settings surfaces**: `ProviderModelSelector.tsx`, `AISettingsContent.tsx`, `ProviderConfigModal.tsx`,
   `AIAssistantSettings.tsx`, `AIDisclaimer.tsx`, as spec §7 «L2» says: registry, stores, `provider.models()`,
   `provider.test()`, the catalog cache for the live list and «show older models».
3. **Jodie and status surfaces**: `Jodie.tsx`, `ChatInput.tsx`, `JodieWindow.tsx`, `ChatMessages.tsx`,
   `StatusBarRightZone.tsx`. `dockWidth` (R-AI-9): a localStorage key of its own, name it in the log entry; the old blob
   value is read once when the new key is absent, so a width the user has today is kept where one exists.
4. **Feature consumers**: `MappingSuggestionService.ts`, `DocumentationTab.tsx`, `SuggestedMappingsPanel.tsx`: their
   registry/config/preference **reads** move; their chat calls stay on the old path until L3.
5. **Gates** after each group and at the end: `npm run typecheck` exit 0 (zero baseline, CLAUDE.md §17); `npm run test`
   full, only the nine known import failures; `npm run build` exit 0. Every count on complete output with its exit status.
   Then a probe (`lane-run probe`, a gitignored `_tmp_196_l2*` Playwright script, fixtures of `scripts/smoke/` style, no
   real key: a mock that answers like the provider) that drives the settings: save a key, Test connection green and
   red-auth through a mocked response, a preference survives reload, the dock width survives reload, and the coexistence
   check: a key saved in the new settings is the one the old chat path sends, without reload (assert on the request).
6. **Commits**, `git commit -- <paths>`, each green on its own: `feat(ai): settings surfaces on src/services/ai, #196 L2`;
   `feat(ai): Jodie and status bar on src/services/ai, #196 L2`; `feat(ai): feature consumers read src/services/ai, #196
   L2` (Prompt-ID in the body, `Model:` trailer). The `getStatus` test goes with the group that moves `getStatus`.
7. **Visual checklist for Juri, then hard stop** (P8): after the last code commit, start nothing yourself on 3001; write
   the checklist in your final message with the port the chat will serve (it starts vite from this tree after you exit)
   and, for each item, the gesture, the expected result and the provider. Real keys are Juri's, typed in the UI by him:
   Gemini, OpenAI (no credit: expect the «no credit» RATE message, R-AI-8), Anthropic. Items at least: Test connection
   green per available family and red with a wrong key (Claude must read AUTH, not network); live model list for Claude
   and Gemini, «show older models»; per-feature model choice survives reload; Jodie dock width survives reload; the
   status bar and Jodie window see a provider enabled right after saving it; a chat message sent right after saving a
   new key uses that key (no reload). End with `Outcome: hard-stop`.
8. Closure, after Juri's GO (a resume): the entry in `docs/log-inbox/196-ai-refactor.md` (skill `log-entry`) and this
   prompt's `Status:` line edited **by hand** to `eseguito 2026-11-02 · lane feat/196-l2-settings-cutover · <last code
   commit>`; `npm run check:docs` green; one docs-only commit.

## DOVE

- `frontend/src/components/common/ProviderModelSelector.tsx`
- `frontend/src/components/settings/AISettingsContent.tsx`
- `frontend/src/pages/settings/ProviderConfigModal.tsx`
- `frontend/src/pages/settings/AIAssistantSettings.tsx`
- `frontend/src/components/common/AIDisclaimer.tsx`
- `frontend/src/components/Jodie/Jodie.tsx`
- `frontend/src/components/Jodie/ChatInput.tsx`
- `frontend/src/components/Jodie/JodieWindow.tsx`
- `frontend/src/components/StatusBarRightZone.tsx`
- `frontend/src/components/Jodie/ChatMessages.tsx`
- `frontend/src/jjtl/services/MappingSuggestionService.ts`
- `frontend/src/components/abstract/tabs/DocumentationTab.tsx`
- `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx`
- `frontend/src/services/ai/` only for: the R-AI-11 test file (new), a missing export, the `dockWidth` key constant if it
  belongs there; a behaviour change of L1 code is a hard stop
- closure: `docs/log-inbox/196-ai-refactor.md`, this prompt's `Status:` line

## HARD STOP

- The coexistence of the Context section cannot be held inside DOVE (the old path keeps a stale key after a save and the
  only fix is in `types/jodie.ts`, `AIProviderService.ts` or another file outside DOVE): stop, report file:line, Juri
  decides.
- `ScriptBlock.tsx` or `InferredMappingsPanel.tsx` (consumers of `AIDisclaimer`) would need to change.
- A measured fact contradicts the spec or an R-AI row in a way that changes what this lane builds.
- The typecheck shows an error you cannot fix inside DOVE.
- Item 7: always, for Juri's visual GO.

## NON FARE

No edit to `types/jodie.ts`, `services/AIProviderService.ts`, `services/aiModelCatalog.ts`, `ExplainModal.tsx`,
`DocumentationService.ts`, `AIMatcher.ts`, the console providers (L3/L4/L6). No deletion of files. No new dependency, no
`npm install`. No network call with a real key from the lane, nothing read from `~/.jjodel-lanes/keys196.env`. No vite on
3001. No merge, no push, no issue comment. No hardcoded event string (rule 25), no emoji, no CSS variable in a component
(rule 28), no `console.log` left in code.
