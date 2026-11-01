# JjTL: nested interactive calls warn on both paths, and the SPEC names input kinds as the parser does

Prompt-ID: P-2026-11-01-0110
Chat: C-2026-10-31-1328
Front: release-3-2
Status: eseguito 2026-11-01 · lane jjtl-nested-interactive · branch jjtl-nested-interactive · fix 8ee42b697, SPEC eaa44fad0 · verifica visiva non applicabile (host mocked; nested calls open no dialog)
Lane: fast (one executor change plus a test, then a separate SPEC commit)
Depends: P-2026-10-31-2245 (merge P-2026-11-01-0049)
Worktree: ~/jjodel-w-nestedinteractive, branch jjtl-nested-interactive (from the trunk tip after P-2026-11-01-0049)
Request: none (Alfonso, «Ok alle raccomandazioni», 2026-11-01 00:49, on the questions of P-2026-10-31-2245)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-nestedinteractive`
on `jjtl-nested-interactive`, stop with `Outcome: blocked`. Every reply opens with
`[P-2026-11-01-0110 · session <id>]`. No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

1. An interactive call (`prompt`, `confirm`, `input`) nested inside another expression returns `null` silently on the
   legacy path, while the JjEL path returns `null` with a warning (found by P-2026-10-31-2245). Decided: the legacy
   path emits the same warning, same text and same rule/expression naming as the JjEL path; nothing is awaited. Test:
   the same nested source on both paths yields `null` and one identical warning; existing interactive tests unchanged.
2. SPEC, separate commit: §8.3 and the Appendix A comment for `input` call the kind `text`, but both parsers accept
   only `string` (and the other kinds the parser lists: copy the list from the parser, with file and line in the
   commit body). Change the SPEC, not the parser. Remove Prompt/Input execution from the «Not Tested» list, citing
   the tests that now cover it (`jjel-path-interactive.test.ts` and the 2245 test).

## Lane discipline

`git add <specific files>` only. Commits `fix(jjtl): ...` and `docs(jjtl): ...`, suffix `(P-2026-11-01-0110)`. Gates:
`npx tsc --noEmit`, `npx vitest run src/jjtl`, `npm run build`, `npm run check:docs`. Log entry in `docs/log-inbox/`
and the `Status: da eseguire` flip in one docs-only commit. No push, no merge. End with «Decisions taken
(unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
