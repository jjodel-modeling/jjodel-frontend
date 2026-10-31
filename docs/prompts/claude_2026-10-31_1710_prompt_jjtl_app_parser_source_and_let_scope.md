# JjTL follow-up: the app parses with `source`, and `let` bindings reach nested bodies

Prompt-ID: P-2026-10-31-1710
Chat: C-2026-10-31-1328
Front: release-3-2
Status: da eseguire
Lane: full (app parser switch to the JjEL path, executor scoping; discovery report first, one session)
Depends: P-2026-10-31-1340 (merged, 7227828c4)
Worktree: ~/jjodel-w-jjtlapp, branch jjtl-app-source (from the trunk tip after P-2026-10-31-1702)
Request: none (Alfonso, «ok alle raccomandazioni», 2026-10-31 15:08, on the questions of P-2026-10-31-1340)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlapp` on
`jjtl-app-source`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1710` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1710 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

P-2026-10-31-1340 made the JjTL executor resolve source collections in expressions and keep the rule's alias in
nested bodies, and made a forall `such that` go through the JjEL parser when the parser receives `source`. Two
follow-ups, decided by Alfonso:

1. `useJjtlParser` (the app's parser hook) passes `source`, so `exists p in xs such that ...` and every JjEL form
   work in the app as they do in node. This moves every JjTL expression parsed by the app to the JjEL path: measure
   it. Run the app-level JjTL tests and every transformation fixture the repo has (examples, gallery, tests) through
   both paths before and after, and report any expression whose parse or result changes. If one changes, stop with
   `Outcome: question` and the list; do not adapt fixtures.
2. Variables bound by `let` are invisible inside nested bodies (forall bodies, `-> feature { }` bodies, nested
   creations) for the same reason the alias was: bind them the way P-2026-10-31-1340 binds the alias, at any depth.

## DOVE

Expected: the `useJjtlParser` hook, `frontend/src/jjtl/executor/executor.ts`, tests in
`frontend/src/jjtl/executor/__tests__/` and next to the hook. Out of scope: `ProjectEditor.tsx` materialization,
codegen, Jjodie.

## COME

First `docs/discovery/discovery_2026-10-31_jjtl_app_parser_source_and_let_scope.md`: where the app parses, what
`source` changes, the fixture inventory and the before/after comparison, how `let` is bound today. Commit it. Then
implement. Tests: `exists` in a `such that` parsed by the app hook; `let x := ...` read inside a forall body, a nested
forall body and a `-> feature { }` body; existing JjTL tests unchanged.

Gates: `npx tsc --noEmit`, `npx vitest run src/jjtl`, the hook's tests, `npm run build`, `npm run check:docs`.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1710)`.
Log entry in `docs/log-inbox/` and the `Status: da eseguire` flip in one docs-only commit. No push, no merge into the
trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
