# JjTL: a failing builtin is an error on every path; JjEL is the only parser of a forall collection

Prompt-ID: P-2026-11-03-1135
Chat: C-2026-11-02-1319
Front: maintenance
Status: eseguito 2026-11-03 · lane full · branch jjtl-collection-jjel-only · 9afbe4376 · verifica visiva non applicabile
Lane: full (executor and parser, two-phase in one session)
Depends: none
Worktree: ~/jjodel-w-jjtlonly, branch jjtl-collection-jjel-only (from the trunk tip)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · Alfonso, 2026-11-03 11:32 «decidi tu», see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlonly` on
`jjtl-collection-jjel-only`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1135 · session <id>]`.
No subagents, no background tasks, no load generators. One probe run per tool call. Commit as soon as the gates are green.

## COSA

Read `docs/discovery/discovery_2026-11-03_jjtl_collection_jjel_only.md`. Its recommendation (warn and `null` on both paths) is
rejected: R-FA-11 in `docs/decisions.md` goes the other way, and its question 1 is closed.

1. A builtin that fails inside a JjTL expression stops that mapping with an error on the JjEL path too, as on the legacy path today:
   same error class, message naming the builtin and the expression, reported as the run's errors. Fixture `tests#107` keeps its
   error on both paths. Correct the comment in `evaluateExpression` that says otherwise. A name that resolves to nothing, as distinct
   from a builtin that throws, keeps today's behaviour: say in the report where the line falls.
2. JjEL becomes the only parser of a forall collection when the source text is available: drop the fallback of P-2026-11-02-2345.
   Without the source text the legacy path stays.
3. The three assertions in `forall-multivar.test.ts` (:57, :64, :101) move to the JjEL node shape; say why each changes. No other test
   expectation changes. If another fixture changes its run-time result, stop with `Outcome: question` and a `Recommended:` line.

## DOVE

`frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/parser.ts`, their tests, `frontend/src/jjtl/SPEC.md`. Out of
scope: `frontend/src/jjel/`, and `alert`, `notify`, `prompt`, `confirm`, `input`.

## COME

Phase 1 is the report above; read the code it cites and go on. Tests first. Gates from `frontend/` through
`node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/jjtl src/jjel`, `npm run build`, `npm run check:docs`. Never
paste a long log. Verifica visiva non applicabile.

## Lane discipline

`git add <specific files>` only. Commits in English, one line, suffix `(P-2026-11-03-1135)`. Log entry in
`docs/log-inbox/maintenance.md` and Status flip in one docs-only commit, both yours, edited by hand: never ask Alfonso to flip it. No
push, no merge. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
