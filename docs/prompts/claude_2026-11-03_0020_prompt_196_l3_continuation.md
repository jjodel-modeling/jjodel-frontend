# #196 L3, continuation: the rest of the chat cutover and AIProviderService deletion (after P-2026-11-03-0005's context ceiling)

Prompt-ID: P-2026-11-03-0020
Chat: C-2026-11-03-0001
Front: ai-provider
Lane: full
Depends: P-2026-11-03-0005
Status: eseguito 2026-11-03 · lane feat/196-l3-chat-cutover · 24db6dcc8 · continued in P-2026-11-03-1201
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-03, «riparti con il compito 196-ai-provider-refactor.md»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 120 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none (as P-2026-11-03-0005). Rule 19 confirmed by Juri for L3 up to 14 entries (R-AI-14, R-AI-18); this
continuation inherits that confirmation for the same list and nothing else.

Worktree: `/Users/juridirocco/development/jjodel-196-l3`, branch `feat/196-l3-chat-cutover`; `frontend/node_modules`
is a symlink to the main tree's (P14; **never `npm install` here**). Before anything else: `pwd`, branch,
`git log -4 --oneline` (HEAD is the commit that adds this file; under it `b73651997 feat(ai): request signal,
earlier-turn attachments, Custom URL, #196 L3`, then `7c0f228bc`, `ad4a72fae`), `git status --short` shows exactly
`frontend/src/components/Jodie/console/providers/jjodieProvider.ts` and `frontend/src/services/DocumentationService.ts`
modified (P-2026-11-03-0005's uncommitted work: keep it, do not reset it), `test -L frontend/node_modules`. Otherwise
stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-03-0020 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks.

**Context budget (the previous lane hit its ceiling in 8 minutes).** Read by narrow ranges only, never whole files of
`AIProviderService.ts`, `DocumentationService.ts`, `types/jodie.ts` or the test logs; builds and tests through
`node scripts/run-quiet.mjs`, and read only the summary it prints; run a single test file with vitest's file filter
while iterating, the full suite only at the gates. Commit as soon as a step is green, and keep
`~/.jjodel-lanes/P-2026-11-03-0020/handoff.md` current after each commit (RC-51).

## Context

- Start from `~/.jjodel-lanes/P-2026-11-03-0005/handoff.md` (its measures, the exact remaining edits, the decisions taken)
  and `~/.jjodel-lanes/P-2026-11-03-0005/handoff.diff`. Re-read the files it cites before editing (P3); do not redo its
  item 1 measures.
- The prompt `docs/prompts/claude_2026-11-03_0005_prompt_196_l3_chat_cutover.md` holds the task: its Context, its
  items 3 to 12, its DOVE (plus `frontend/src/services/ai/BaseProvider.ts`, R-AI-18 only), its HARD STOP and NON FARE
  apply to this lane verbatim, with this Prompt-ID in their place. Decisions R-AI-14..18 in `docs/decisions.md`.
- Unattended decisions of P-2026-11-03-0005 the chat accepts (list them in the log entry's Notes): an earlier turn's
  attachment on a model that does not declare the capability is dropped, the current turn's refused; the `openai` and
  Anthropic streams throw the abort error after their loop so all three families end alike; DocumentationService and
  AIMatcher gate on `registry.enabled()`; their system prompt is `PromptService.getRendered('chat')`, as the old path.
- Not this lane's: the static seeds declare no IMAGES for `gpt-4o`, `pixtral-large-latest`, `pixtral-12b-2409`, in
  `registry.ts` and in `types/jodie.ts` alike (pre-existing, the chat files a ticket). The item 7 image and PDF rows use
  Claude or Gemini, whose live lists declare them.

## COSA

1. Finish phase 1 of P-2026-11-03-0005: item 3 (`AIMatcher.ts`, `ExplainModal.tsx`; the two modified files as they
   stand), gates, commit `feat(ai): chat consumers on src/services/ai, #196 L3`; items 5 (probe), 6 (no-key check),
   7 (checklist for Juri on port **3198**, the keys of R-AI-16: Claude, Gemini, Mistral, Ollama, Custom pointed at
   OpenRouter with a `:free` model, OpenAI up to «no credit»; Kimi expected to fail AUTH, pre-existing, the chat files
   it). End with `Outcome: hard-stop`.
2. After Juri's GO (a resume opening `[P-2026-11-03-0020] GO`): phase 2, items 8 to 12 of P-2026-11-03-0005; the
   closure flips the `Status:` lines of **both** prompts by hand (P-2026-11-03-0005: `eseguito <date> · lane
   feat/196-l3-chat-cutover · <its last code commit b73651997> · continued in P-2026-11-03-0020`; this one: its last
   code commit). End with `Outcome: done`.

## DOVE

As P-2026-11-03-0005 (14 entries with `BaseProvider.ts`), plus this prompt's `Status:` line at closure.
