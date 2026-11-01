# Textual syntax T2a: the parser (first slice of T2, after P-2026-11-01-2355 hit the context ceiling)

Prompt-ID: P-2026-11-02-0024
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: fast (new code inside `frontend/src/codegen/textual/` only, no UI)
Depends: P-2026-11-01-2355 (hard-stop after discovery, RC-51; nothing written); T1 on the trunk
Worktree: ~/jjodel-w-textt2, branch textual-t2 (the same tree, at the commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · RC-51 and RC-52: T2 is split into slices, one per session (T2a parser, T2b textual entry and tab, T2c New model from text)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textt2` on
`textual-t2`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0024 · session <id>]`.
No subagents, no background tasks. Read only: `docs/prompts/claude_2026-11-01_2355_prompt_textual_t2_parser_new_model.md`
(item 1 is this lane), `~/.jjodel-lanes/P-2026-11-01-2355/handoff.md` (the parser part), the module
`frontend/src/codegen/textual/` and `~/.jjodel-lanes/P-2026-11-01-2232/probe/parser.mjs`. Keep context low: print only
what a decision needs.

## COSA

The hand-written interpreter of T1's concrete grammar (C-like style), with recovery (R-TXT-21 (1)), producing the input
shape T1's printer takes (`{id, cls, slots}`; references by name or path resolved after the parse, R-TXT-4/11; the top
level admits every concrete class, R-TXT-24 (a); single containment as `f { T }`, R-TXT-24 (b)). Errors with line and
column and a readable message. Recovered objects are marked as recovered and never offered as applicable (R-TXT-21 (8)).
Exported API: `parseText(text, concreteGrammar) -> { objects, errors, recovered }`.

## DOVE

New files in `frontend/src/codegen/textual/` and tests in its `__tests__/`; check new names with a global search. No
other file. The module must stay loadable on demand only (R-GEN-2, `npm run check:codegen-lazy`).

## COME

Tests first: on T1's corpus, print then parse then print gives the same text; error positions on five broken inputs
(wrong type, missing brace, unknown keyword, unresolved reference, duplicate name where a name must be unique); one bad
line costs only that line; a missing `}` is reported and its objects are recovered, not applicable. Mutation check on a
few parser rules.

## Lane discipline

`git add <specific files>` only. Commit `feat(codegen): textual parser with recovery (P-2026-11-02-0024)`. Gates:
`npx tsc --noEmit` (baseline), `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`,
`npm run check:codegen-lazy`. Visual check not applicable. Log entry in `docs/log-inbox/codegen.md` and the `Status:`
flips of this prompt and of 2355 (`Status: in corso · split by RC-52: T2a P-2026-11-02-0024, T2b and T2c to follow`)
in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso»,
`Outcome: done | hard-stop | question | blocked`.
