# JjTL: `input` keeps its default, and the SPEC stops saying prompt and input return null

Prompt-ID: P-2026-10-31-2245
Chat: C-2026-10-31-1328
Front: release-3-2
Status: eseguito 2026-10-31 · lane jjtl-input-default · branch jjtl-input-default · fix 8b0ab9d28, SPEC e7d38f515 · verifica visiva non applicabile (host mocked; dialog pre-fill on 3001 unverified)
Lane: fast (one executor fix plus a test, then a separate docs commit on the SPEC)
Depends: P-2026-10-31-2025 (merge P-2026-10-31-2230)
Worktree: ~/jjodel-w-inputdefault, branch jjtl-input-default (from the trunk tip after P-2026-10-31-2230)
Request: none (Alfonso, «ok alle raccomandazioni», 2026-10-31 22:30, on the questions of P-2026-10-31-2025)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-inputdefault` on
`jjtl-input-default`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-31-2245 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

1. Fix: the executor drops the default of `input(message, kind, default)`; it passes `undefined` to `showInput`
   (`frontend/src/jjtl/executor/executor.ts` around 2686-2691, as found by P-2026-10-31-2025). Pass the evaluated
   default through, on both parse paths if they reach different code. Test: with the input host mocked as the
   existing interactive tests do (`jjel-path-interactive.test.ts`), `input("Size?", EInt, 4)` reaches `showInput`
   with default 4, and accepting it yields 4; the existing interactive tests unchanged.
2. Docs, separate commit: the status notes in SPEC §3.5 and §8.3 that say `prompt` and `input` "return null" are out
   of date since the executor runs them; rewrite them to say what happens now (they open the host dialog and return
   the value, or null when the dialog is cancelled; check the executor and say exactly that). Fix the stale Appendix A
   comment `PromptExpressionAST // prompt("message", default)` to the documented form. Decided and unchanged:
   `prompt(message)` without a second argument stays illegal; the warning label `(JjelExpression)` stays.

## Lane discipline

`git add <specific files>` only. Commits: `fix(jjtl): ...` for the code and test, `docs(jjtl): ...` for the SPEC, suffix
`(P-2026-10-31-2245)`. Gates: `npx tsc --noEmit`, `npx vitest run src/jjtl`, `npm run build`, `npm run check:docs`.
Log entry in `docs/log-inbox/` and the `Status: da eseguire` flip in one docs-only commit. No push, no merge. End with
«Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
