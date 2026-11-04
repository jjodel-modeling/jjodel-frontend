# #196 L3, phase 2 continuation: AIProviderService deletion and closure (after P-2026-11-03-0020's context ceiling)

Prompt-ID: P-2026-11-03-1201
Chat: C-2026-11-03-0001
Front: ai-provider
Lane: full
Depends: P-2026-11-03-0020
Status: eseguito 2026-11-03 · lane feat/196-l3-chat-cutover · 9ae6c479f
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-03, «riparti con il compito 196-ai-provider-refactor.md», then gave his visual GO on phase 1; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 90 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso», Juri decides.

Critical zone: none. Rule 19 confirmed by Juri for L3 (R-AI-14, R-AI-18); this lane inherits it for the same list.
Juri's visual GO on phase 1 is given (chat C-2026-11-03-0001): this lane runs phase 2 and closes, with no further stop.

Worktree: `/Users/juridirocco/development/jjodel-196-l3`, branch `feat/196-l3-chat-cutover`; `frontend/node_modules` is
a symlink (P14; **never `npm install` here**). Before anything else: `pwd`, branch, `git log -2 --oneline` (HEAD is the
commit that adds this file, under it `ca0f69ac2`), `git status --short` shows exactly
`frontend/src/services/ai/__tests__/requestShaping.test.ts` modified (P-2026-11-03-0020's uncommitted tests: keep
them), `test -L frontend/node_modules`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-03-1201 · session <id>]`. Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. A message with
another Prompt-ID is not acted on (P13). Unattended (RC-21, RC-25) except the RC-26 list. No subagents.

**Context budget: the two previous lanes hit the ceiling within minutes.** Do not re-derive the coverage map: it is in
the handoff, trust it. Read only the line ranges you edit; never read `AIProviderService.ts` or the old test file before
deleting them (`git rm` is enough). Run single test files while iterating, the full suite once at the gate, through
`node scripts/run-quiet.mjs`, and read only its summary. Keep `~/.jjodel-lanes/P-2026-11-03-1201/handoff.md` current
after each commit.

## Context

`~/.jjodel-lanes/P-2026-11-03-0020/handoff.md` holds the coverage map, the remaining steps with line numbers, and what
the log Notes must say. The task text is items 9 to 12 of `docs/prompts/claude_2026-11-03_0005_prompt_196_l3_chat_cutover.md`;
its DOVE, HARD STOP and NON FARE apply, with this Prompt-ID. Decisions R-AI-14..19 in `docs/decisions.md`.

## COSA

1. Commit the four «carried from AIProviderService» tests as they stand:
   `test(ai): behaviours carried from AIProviderService, #196 L3`.
2. Item 9 of P-2026-11-03-0005 as the handoff details it (rewrite `aiModelCatalog.test.ts:156`, delete the describes at
   `:166`, `:252`, `:371`; `git rm` of `frontend/src/services/AIProviderService.ts` and
   `frontend/src/services/__tests__/AIProviderService.test.ts`).
3. Item 10 (the bridge in `ProviderModelSelector.tsx`), item 11 (gates: typecheck 0, full test with only the nine known
   import failures, build 0; rerun `_tmp_196_l3_probe.ts` under `lane-run probe`), commit
   `refactor(ai): delete AIProviderService, #196 L3`.
4. Item 12, closure: one entry in `docs/log-inbox/196-ai-refactor.md` (skill `log-entry`) for L3 as a whole, covering
   P-2026-11-03-0005, P-2026-11-03-0020 and this lane; Notes ≤ 500 characters naming R-AI-15..19, the bridge's fate,
   and pointing to the handoffs for the unattended decisions and Juri's Gemini «Unreachable» observation (a 503 read as
   network while `gemini-3.7-flash` was overloaded: to verify). `Status:` lines edited **by hand**: P-2026-11-03-0005
   `eseguito 2026-11-03 · lane feat/196-l3-chat-cutover · b73651997 · continued in P-2026-11-03-0020`;
   P-2026-11-03-0020 `eseguito 2026-11-03 · lane feat/196-l3-chat-cutover · 24db6dcc8 · continued in P-2026-11-03-1201`;
   this one with its last code commit. `npm run check:docs` green; one docs-only commit. End with `Outcome: done`.

## DOVE

As P-2026-11-03-0005 (14 entries with `BaseProvider.ts`), plus the `Status:` lines of the three L3 prompts at closure.
