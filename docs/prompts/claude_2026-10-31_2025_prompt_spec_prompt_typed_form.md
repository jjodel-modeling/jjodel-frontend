# SPEC §3.5: document `prompt(message, Type [, default])`

Prompt-ID: P-2026-10-31-2025
Chat: C-2026-10-31-1328
Front: release-3-2
Status: da eseguire
Lane: fast (docs only, one SPEC section and the grammar diagram if it has the rule)
Depends: P-2026-10-31-1910 (merge P-2026-10-31-2011)
Worktree: ~/jjodel-w-specprompt, branch spec-prompt-typed (from the trunk tip after P-2026-10-31-2011)
Request: none (Alfonso, «Ok alle raccomandazioni», 2026-10-31 20:11, on the questions of P-2026-10-31-1910)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-specprompt` on
`spec-prompt-typed`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-31-2025 · session <id>]`.
No subagents, no background tasks.

## COSA

Decided by Alfonso: in `prompt(message, name)` a bare name in second position stays a type, as the executor reads
it today; anything else in that position is the default value (P-2026-10-31-1910, decision 1). SPEC §3.5 describes
the second argument as a default value only, so it is wrong for the bare-name case. Rewrite §3.5 to document both
forms, `prompt(message [, default])` and `prompt(message, Type [, default])`, with how the second argument is read
(bare name means a type, any other expression means a default, typed `EString`), one example of each, and the same
for `input` if it shares the rule (check the executor; say so if it does not). Update the grammar diagram only if it
shows the `prompt` arguments. Keep the warning label `(JjelExpression)` untouched (decided). No code changes.

## DOVE

The SPEC file that holds §3.5 (find it: the JjTL spec under `docs/jjtl/` or `frontend/src/jjtl/`, as cited in the
1910 report), and `docs/log-inbox/`.

## Lane discipline

`git add <specific files>` only, one `docs(jjtl):` commit in English, suffix `(P-2026-10-31-2025)`. Gate:
`npm run check:docs`. Log entry and the `Status: da eseguire` flip in the same docs-only commit pattern. No push, no
merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | question | blocked`.
