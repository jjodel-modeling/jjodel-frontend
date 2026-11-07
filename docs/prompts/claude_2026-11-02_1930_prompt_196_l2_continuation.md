# #196 L2, continuation: Jodie, status bar and feature consumers on src/services/ai (after P-2026-11-02-1916's context ceiling)

Prompt-ID: P-2026-11-02-1930
Chat: C-2026-11-02-1311
Front: ai-provider
Lane: full
Depends: P-2026-11-02-1916
Status: eseguito 2026-11-02 · lane feat/196-l2-settings-cutover · 2d9f347d9
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-02, «riprendi»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 120 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none (as P-2026-11-02-1916). Rule 19 confirmed by Juri for L2 as one lane (R-AI-10); this continuation
inherits that confirmation for the same file list plus the one L1 file named in item 1.

Worktree: `/Users/juridirocco/development/jjodel-196-l2`, branch `feat/196-l2-settings-cutover`; `frontend/node_modules`
is a symlink to the main tree's (P14; **never `npm install` here**). Before anything else: `pwd`, branch,
`git log -3 --oneline` (HEAD is the commit that adds this file; under it `6a58c8bef feat(ai): settings surfaces on
src/services/ai, #196 L2`, then `7a3f22ac1`), `git status --short` empty except the gitignored `_tmp_196_l2_measure.ts`,
`test -L frontend/node_modules`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-02-1930 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1). Keep
`~/.jjodel-lanes/P-2026-11-02-1930/handoff.md` current after each commit (RC-51).

## Context

Lane P-2026-11-02-1916 is your task and scope: read its prompt
(`docs/prompts/claude_2026-11-02_1916_prompt_196_l2_settings_cutover.md`) and **its handoff
`~/.jjodel-lanes/P-2026-11-02-1916/handoff.md` in full, first**. It committed group 1 (settings surfaces) at
`6a58c8bef`, took the three measures (old paths read keys/model/baseUrl from localStorage at every call, so no key
bridge is needed; the one bridge is the live model list copied into `AI[p].versions`; `getStatus` was inverted and is
fixed in `providerStatus`; `dockWidth` is never restored today), and stopped at the context ceiling. Do not redo the
measures; do not read `handoff.diff` whole (read the files it touches by ranges instead).

**One correction by the chat, binding (rule 3, #179).** The handoff's decision 7 records that Test connection now tests
the provider's configured model, while the settings row labels the model the chat calls it with
(`AISettingsContent.tsx` `activeModelLabel`, chat preference first). That reopens #179, whose fix was «test and chat on
the same current model». Fix it here: `BaseProvider.test()` takes an optional model id (`test(modelId?: string)`),
resolved through `resolveModel(modelId)` exactly as the chat resolves it; callers in `AISettingsContent.tsx` and
`ProviderConfigModal.tsx` pass the same id `activeModelLabel` resolves. Additive, no other behaviour of L1 code changes.
Add the test that pins it in `frontend/src/services/ai/__tests__/connectionTest.test.ts`, and a mutation (drop the
argument) that turns it red.

## COSA

1. The #179 correction above (code in `services/ai/BaseProvider.ts`, its test, the two callers). Commit:
   `fix(ai): Test connection on the chat's model again, #196 L2 (#179)`.
2. Group 2 of P-2026-11-02-1916 item 3: `Jodie.tsx`, `ChatInput.tsx`, `JodieWindow.tsx`, `ChatMessages.tsx`,
   `StatusBarRightZone.tsx`; `dockWidth` in a key of its own (the handoff says the constant lives in `JodieWindow.tsx`),
   old blob value read once when the new key is absent. Commit:
   `feat(ai): Jodie and status bar on src/services/ai, #196 L2`.
3. Group 3, item 4 of that prompt: `MappingSuggestionService.ts`, `DocumentationTab.tsx`, `SuggestedMappingsPanel.tsx`
   (reads only; their chat calls stay on the old path until L3). Commit:
   `feat(ai): feature consumers read src/services/ai, #196 L2`.
4. Gates after each commit: typecheck exit 0; full `npm run test` with only the nine known import failures; build exit 0.
   Then the probe of item 5 of P-2026-11-02-1916, extended with: Test connection sends the chat-preference model
   (assert on the mocked request body). Every count on complete output with its exit status.
5. Visual checklist for Juri, then `Outcome: hard-stop` (item 7 of P-2026-11-02-1916, plus): the settings list 9
   providers (Llama and Copilot gone, handoff decision 2: Juri accepts or not); Test connection on a provider whose
   chat-preferred model differs from its configured one tests the chat's model. Stop any vite you started; leave ports
   free; name the port the chat should serve.
6. Closure, after Juri's GO (a resume): one entry in `docs/log-inbox/196-ai-refactor.md` (skill `log-entry`) for L2,
   naming both Prompt-IDs, the bridge (L3 deletes it), the #179 correction, the 9-row list; the `Status:` lines edited by
   hand: P-2026-11-02-1916 `eseguito 2026-11-02 · lane feat/196-l2-settings-cutover · 6a58c8bef · continued in
   P-2026-11-02-1930`, this one at the last code commit. `npm run check:docs` green; one docs-only commit.

## DOVE

The DOVE of P-2026-11-02-1916, plus `frontend/src/services/ai/BaseProvider.ts` and
`frontend/src/services/ai/__tests__/connectionTest.test.ts` for item 1 only; closure: the log inbox and the two
`Status:` lines.

## HARD STOP

Those of P-2026-11-02-1916; plus: the #179 correction needs a change to L1 code beyond the optional argument.

## NON FARE

Those of P-2026-11-02-1916. No redo of group 1 beyond the two `test()` call sites.
