# Textual syntax: path segments follow the printed feature keyword (R-TXT-29)

Prompt-ID: P-2026-11-02-2029
Chat: C-2026-11-02-1814
Front: codegen
Status: da eseguire
Lane: fast (two source files and their tests, no UI)
Depends: none
Worktree: ~/jjodel-w-textpathfeat, branch textual-path-feature (from the trunk commit that adds this prompt)
Request: none (Alfonso 2026-11-02 20:28, R-TXT-29 in docs/decisions.md)

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textpathfeat` on `textual-path-feature` and clean, stop with `Outcome: blocked`. Every reply opens with
`[P-2026-11-02-2029 · session <id>]`. No subagents, no background tasks. Never `cat` a gate log. Commit as soon as the gates
are green.

## COSA

Implement R-TXT-29, the follow-up of R-TXT-28 (P-2026-11-02-2003). With `members` printed as `patrons` a path reads
`shelf[0].members[1]`, and `shelf[0].patrons[1]` is refused. Make the printer and `follow` in the parser use the printed
keyword of a containment, and the feature's name when none is printed (keyword dropped, or `inline`). Read the keyword from
the concrete grammar, as 2003 did for classes.

Tests first, in `syntaxRecord.test.ts`, on the library fixture: print, parse, reprint equal, reference resolved to the same
object, for a renamed feature, a dropped keyword, an inline feature and a grouped feature. A segment that uses the old name
of a renamed feature is an error naming the expected keyword. Two containments of one class with the same printed keyword:
state what happens today; it must be refused with a reason, never resolved silently. Measure whether a grouped feature's
index still means the position in the feature when the print order differs (groups in subset order), and report it: a path
must keep resolving to the same object after a reprint. No record: byte-identical output, existing tests green.

Mutation bench in the commit body: printer keeps the feature name; parser keeps the feature name; inline fallback removed.

## DOVE

`frontend/src/codegen/textual/printer.ts`, `parser.ts`, `styleCheck.ts` only if the clash needs refusing, their tests, and
the comments that state the path form. Any other file: a question with `Recommended:`.

## Gates and closure

From `frontend/`, through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`,
`npm run check:docs`, `npm run check:codegen-lazy` (both modes). Commit `feat(codegen): text paths follow feature keywords
(P-2026-11-02-2029)`, trailer `Model:`. Visual check not applicable. Log entry in `docs/log-inbox/codegen.md` and the
`Status:` flip in one docs-only commit. No push, no merge. Final message: «Decisions taken (unattended)», «Decisions
awaiting Alfonso», then `Outcome:`.
