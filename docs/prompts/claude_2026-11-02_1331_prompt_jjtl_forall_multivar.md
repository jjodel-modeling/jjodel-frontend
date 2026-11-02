# JjTL: `forall` over several variables, on the JjEL forms

Prompt-ID: P-2026-11-02-1331
Chat: C-2026-11-02-1319
Front: maintenance
Status: da eseguire
Lane: full (JjTL grammar and executor bindings, two-phase in one session)
Depends: none
Worktree: ~/jjodel-w-jjtlforallmv, branch jjtl-forall-multivar (from the trunk commit that adds this prompt)
Request: Alfonso, 2026-11-02 13:19 (project chat), see request.md of this lane; brief item from P-2026-10-31-1741

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlforallmv` on
`jjtl-forall-multivar`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1331 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

Execute `docs/prompts/claude_2026-10-31_1741_prompt_jjtl_forall_multivar.md`, which this prompt supersedes and which
never ran: read its The case, Required, Also check and Acceptance sections as the specification of this lane, its
worktree, branch and depends lines do not apply. Its dependency (P-2026-10-31-1710) is merged.

Two changes to it, from R-FA-1 and R-FA-7 of `docs/decisions.md`:

1. Both spellings are accepted and mixable: `forall q, r in requesters ...` and `forall q in requesters, r in others ...`.
2. A later collection may read an earlier variable of the same forall: this is required, not optional, and tested.

The JjEL route check of that prompt stays: it must not depend on JjEL `forall x, y` (lane P-2026-11-02-1330 runs in
parallel and is not on your branch), and it stays out of `frontend/src/jjel/`.

## DOVE

`frontend/src/jjtl/parser/parser.ts` (`forAllMapping`, about line 490), the `useJjtlParser` hook if it parses `forall` on
its own path, `frontend/src/jjtl/types/ast.ts` (`ForAllMappingAST`), `frontend/src/jjtl/executor/executor.ts`
(`runForAll` and the readers of the variable field), `frontend/src/jjtl/SPEC.md` and `docs/jjtl/`. Out of scope:
`ProjectEditor.tsx`, the codegen engine, Jjodie, `frontend/src/jjel/`.

Stop with `Outcome: question` and a `Recommended:` line if an exported type read outside `frontend/src/jjtl/` must change.

## COME

As in the superseded prompt: Phase 1 read-only with one probe, report at
`docs/discovery/discovery_2026-11-02_jjtl_forall_multivar.md` committed alone, then Phase 2 in the same session: tests
first, parser, AST, executor, grammar with one example per spelling. Gates: `npx tsc --noEmit` against the baseline,
`npx vitest run src/jjtl src/jjel`, `npm run build` at the end. Say how many JjTL test files fail to load in node with
window is not defined, before and after. Never paste a long log. Verifica visiva non applicabile.

## RIFERIMENTI

P-2026-10-31-1741, `docs/decisions.md` R-FA, P-2026-10-30-1315, P-2026-10-31-1340, P-2026-10-31-1710.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-11-02-1331)`. Log
entry per P9. Replace the Status line with date, lane, branch and sha in the same docs-only commit as the entry. No push,
no merge into the trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
