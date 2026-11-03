# JjTL: can JjEL parse every `forall` collection?

Prompt-ID: P-2026-11-03-1016
Chat: C-2026-11-02-1319
Front: maintenance
Status: eseguito 2026-11-03 · lane jjtl-collection-jjel-only · branch jjtl-collection-jjel-only · 1300be2cc (Phase 1; Phase 2 not started, question to the chat)
Lane: full (two-phase in one session; Phase 2 only under the condition below)
Depends: none
Worktree: ~/jjodel-w-jjtlonly, branch jjtl-collection-jjel-only (from the trunk tip)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · Alfonso, 2026-11-03 10:12 «procedi», see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlonly` on
`jjtl-collection-jjel-only`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1016 · session <id>]`.
No subagents, no background tasks, no load generators. One probe run per tool call.

## COSA

P-2026-11-02-2345 left two parsers on one position: the legacy parser first, JjEL as the fallback. Using JjEL always broke two AST
assertions in `forall-multivar.test.ts` and, at run time, fixture `tests#107` (`range() takes integers, got null`). The ticket
is in that lane's log entry.

Phase 1: find out why. Is the difference a defect of the JjEL route (for instance how a name resolves in the JjEL evaluator
under the JjTL context, or a source reference), of the legacy route, or of the fixture? Save
`docs/discovery/discovery_2026-11-03_jjtl_collection_jjel_only.md` (objective, files read with full paths, findings, risks, open
questions) and commit it alone.

Phase 2, only if the cause is a local defect with a small fix inside `frontend/src/jjtl/`, and every existing run-time result stays the
same: make JjEL the only parser of a forall collection when the source text is available, drop the fallback, update the two AST
assertions and say why each changed. Otherwise stop after Phase 1 with `Outcome: question` and a `Recommended:` line. Changing the JjEL
evaluator, or the result of any fixture, is a stop.

## DOVE

`frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/executor/`, their tests, `frontend/src/jjtl/SPEC.md`. Out of scope:
`frontend/src/jjel/`, and the other positions listed by 2345 (`alert`, `notify`, `prompt`, `confirm`, `input`).

## Lane discipline

`git add <specific files>` only. Commits in English, one line, suffix `(P-2026-11-03-1016)`. Gates from `frontend/` through
`node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/jjtl src/jjel`, `npm run build`, `npm run check:docs`. Log entry in
`docs/log-inbox/maintenance.md` and Status flip in one docs-only commit, both yours. No push, no merge. Report closes with
«Decisions taken (unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
