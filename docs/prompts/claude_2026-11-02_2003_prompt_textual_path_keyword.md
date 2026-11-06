# Textual syntax: paths follow the printed class keyword (R-TXT-28)

Prompt-ID: P-2026-11-02-2003
Chat: C-2026-11-02-1814
Front: codegen
Status: eseguito 2026-11-02 · lane fast · e141ed7b1 · verifica visiva non applicabile
Lane: fast (two source files and their tests, no UI)
Depends: none
Worktree: ~/jjodel-w-textpathkw, branch textual-path-keyword (from the trunk commit that adds this prompt)
Request: none (Alfonso 2026-11-02 19:54, R-TXT-28 in docs/decisions.md)

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textpathkw` on `textual-path-keyword` and clean, stop with `Outcome: blocked`. Every reply opens with
`[P-2026-11-02-2003 · session <id>]`. No subagents, no background tasks. Never `cat` a gate log. Commit as soon as the gates
are green.

## COSA

Implement R-TXT-28. Today `printer.ts` builds a path's first segment with its local `keyword()` (class name plus case) and
`parser.ts` `follow` resolves that segment as a class. With an annotated class keyword the object prints as `machine { }`
but references print `Initial[0]`. Make both use the printed keyword, falling back to the class name when the keyword is
dropped. Find the keyword in the concrete grammar; do not duplicate the annotation lookup.

Check three cases and test them: two classes where one's keyword equals the other's class name (must resolve to the
object printed with that word, or be refused by the style check with a reason, never silently the wrong one); a dropped
keyword; a text using the old class-name path on a renamed class (an error naming the expected keyword, since no such text
was ever released on a stored record). Measure, do not change, whether a renamed feature keyword has the same mismatch in
later segments, and report it.

Tests first this time, on a small non-hardware metamodel, reusing the library fixture of `syntaxRecord.test.ts`: print,
parse, reprint equal, reference resolved to the same object. No record: byte-identical output, existing tests green.
Mutation bench in the commit body: printer keeps the class name; parser keeps the class name.

## DOVE

`frontend/src/codegen/textual/printer.ts`, `parser.ts`, `styleCheck.ts` only if the clash needs refusing, their tests, and
the comments that state the path form. Any other file: a question with `Recommended:`.

## Gates and closure

From `frontend/`, through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`,
`npm run check:docs`, `npm run check:codegen-lazy` (both modes). Commit `feat(codegen): text paths follow the class keyword
(P-2026-11-02-2003)`, trailer `Model:`. Visual check not applicable. Log entry in `docs/log-inbox/codegen.md` and the
`Status:` flip in one docs-only commit. No push, no merge. Final message: «Decisions taken (unattended)», «Decisions
awaiting Alfonso», then `Outcome:`.
