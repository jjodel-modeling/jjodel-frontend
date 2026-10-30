# Jjodie: a Claude reply whose first block is not text crashes the editor

Prompt-ID: P-2026-10-30-1215
Chat: C-2026-10-30-1207
Lane: fast (two files plus one test, outside the critical zone, no exported interface changes)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: fast lane, the preliminary check goes inline in the log entry, max ten lines).

Worktree: `~/jjodel-w-jjodiereply`, branch `jjodie-non-text-reply`, created from `alfonso-frontend-jjtl` at
the trunk commit whose subject starts with `docs(prompts): P-2026-10-30-1215` (code identical to `3addb64cf`).
Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-30-1215 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi)

Since about 2026-10-28 Alfonso sees the `Try` boundary fallback (`components/forEndUser/Try.tsx:201-203`) with
`ut:<n>, Cannot read properties of undefined (reading 'match')`, last time right after sending a long JjScript
request to Jjodie on a metamodel. `ut:` is the boundary's `stateUpdateTime`, not a file. The frontend code on the
trunk has not changed since 2026-10-25 10:51, so the trigger is in the data, not in a recent commit.

Hypothesis from the chat, to be confirmed before fixing:

1. `services/AIProviderService.ts:259` returns `data.content[0].text`. When the Messages API answers with a first
   block that is not `type: 'text'` (a `thinking` or `redacted_thinking` block, or any other non-text block), the
   method returns `undefined` without an error.
2. That `undefined` becomes the `content` of an assistant `ChatMessage` and reaches
   `components/Jodie/ChatMessages.tsx:114` (`extractFirstCodeBlock(message.content)`, which calls `text.match` at
   line 50) and line 425 (`hasScriptCardBlock(chat.content)`, `text.matchAll` at line 68), both during render. The
   error escapes to the `Try` boundary and takes down the panel.
3. If the conversation is persisted, every later render of the panel throws again, which would explain why the
   error showed up "in other circumstances" over the last days.
4. Same latent shape on the OpenAI path, `AIProviderService.ts:201`: `choices[0].message.content` is `null` for a
   refusal or a tool-call-only reply.

## COSA

1. Preliminary check (inline, max ten lines in the log entry). Confirm or refute points 1-3 with code reading and a
   unit test that feeds the Claude path a response whose `content` is `[{type:'thinking', ...}, {type:'text',
   text:'...'}]`. Also state whether Jjodie conversations are persisted and where (file:line). If the hypothesis is
   refuted, stop with `Outcome: question` and what you found instead; do not fix something else.
2. `AIProviderService.ts`, Claude path: return the concatenation of the `text` of every block with
   `type === 'text'`, in order. If there is none, throw an `Error` that names `stop_reason` and the block types
   received, so the chat shows the failure as an error message through the existing error path. Keep the
   `max_tokens` warning.
3. `AIProviderService.ts`, OpenAI path (line 201): same rule. A `null` or non-string content throws an `Error` naming
   `finish_reason` (and `refusal` when present).
4. `ChatMessages.tsx`: `extractFirstCodeBlock` and `hasScriptCardBlock` accept `string | null | undefined` and
   return `null` / `false` for a non-string. This is the guard that keeps an already persisted bad message from
   crashing the panel; it does not change behaviour for string content.
5. Tests: the thinking-first case and the no-text case on the Claude path, the null-content case on the OpenAI path,
   and one render-level test (or a direct call) showing that a message with `content: undefined` no longer throws.

## HARD STOP

- After the preliminary check, if the hypothesis is refuted.
- At the end: visual check due. Do not commit the log entry and the Status flip before the GO (RC-17).

## NON FARE

- Do not touch the Gemini path or any other provider beyond the two lines above.
- Do not change `CHAT_MAX_OUTPUT_TOKENS`, the request body, the model catalog or the `Try` boundary.
- Do not add a migration or a cleanup of persisted conversations.
- No refactoring of `AIProviderService.ts` beyond the two return sites.

## Gate

`npm run typecheck` at baseline, `npx vitest run` on the touched suites, `npm run build`.

## Visual checklist (for the chat, RC-23)

Open a metamodel, send Jjodie a JjScript request with the Claude provider and the model Alfonso uses today: the
reply renders, or a readable error appears in the conversation; no `Try` fallback; console free of
`reading 'match'`.

## RIFERIMENTI

- `frontend/src/services/AIProviderService.ts:201`, `:259`
- `frontend/src/components/Jodie/ChatMessages.tsx:49-56`, `:67-72`, `:114`, `:425`
- `frontend/src/components/forEndUser/Try.tsx:195-205`
