# JjTL on the JjEL path: prompt, confirm, input and multi-line if/else, then switch the app parser

Prompt-ID: P-2026-10-31-1910
Chat: C-2026-10-31-1328
Front: release-3-2
Status: da eseguire
Lane: full (JjTL parser and executor, app parser hook and editor; discovery report first, one session)
Depends: P-2026-10-31-1710 (jjtl-app-source, merged into the trunk)
Worktree: ~/jjodel-w-jjtlparity, branch jjtl-jjel-parity (from the trunk tip after the jjtl-app-source merge)
Request: none (Alfonso, «ok alle raccomandazioni», 2026-10-31 17:49, on question 2 of the 17:45 digest)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlparity` on
`jjtl-jjel-parity`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1910` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1910 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

P-2026-10-31-1710 measured that switching the app's JjTL parser (`useJjtlParser`) to the JjEL path, by passing
`source`, would regress two things: the interactive builtins `prompt`, `confirm` and `input` do not work there, and an
`if/else` after `:=` cannot continue on the next line. Its discovery report
(`docs/discovery/discovery_2026-10-31_jjtl_app_parser_source_and_let_scope.md`) has the measurements and the
fixture inventory; read it first.

Decided: make the JjEL path do both, then switch `useJjtlParser` and `JjtlEditor.tsx:57` together, so that the app
and node parse every JjTL expression the same way and `exists ... such that` works in the app. Also fix SPEC §13
example 5 (`prompt(msg, source.category)`), which does not parse today: make it parse, do not rewrite the example.

Stop conditions: a change in the shared JjEL parser or evaluator that changes results for other consumers (codegen
templates, JjScript, Jjodie) is an exported behaviour change: stop with `Outcome: question` and the list. If, after
the two fixes, any fixture expression still parses or evaluates differently on the two paths, stop with
`Outcome: question` and the list instead of switching.

## DOVE

Expected: the JjTL parser and executor under `frontend/src/jjtl/`, the JjEL parts they reach for the interactive
builtins and line continuation, the `useJjtlParser` hook, `frontend/src/components/.../JjtlEditor.tsx` (confirm the
path), tests next to each. Out of scope: `ProjectEditor.tsx` materialization, codegen, Jjodie.

## COME

First `docs/discovery/discovery_2026-10-31_jjtl_jjel_path_parity.md`: where `prompt`, `confirm`, `input` are handled on
the legacy path and why the JjEL path misses them; the grammar point that stops a multi-line `if/else` after `:=`;
the plan and the consumers each change can affect; the before/after comparison on every fixture. Commit it. Then
implement, then switch the hook and the editor in one commit.

Tests: each interactive builtin on the JjEL path (with the prompt host mocked as the existing tests do); a
multi-line `if/else` after `:=`; SPEC §13 example 5 parses; `exists p in xs such that ...` parsed by the app hook;
the fixture comparison as a test (every fixture, same parse result and same output on both paths).

Gates: `npx tsc --noEmit`, `npx vitest run src/jjtl src/jjel`, the hook's tests, `npm run build`,
`npm run check:docs`.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1910)`.
Log entry in `docs/log-inbox/` and the `Status: da eseguire` flip in one docs-only commit. No push, no merge into the
trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
