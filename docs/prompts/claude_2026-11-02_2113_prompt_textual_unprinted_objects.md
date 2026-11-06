# Textual syntax: report objects a grouped containment does not print (R-TXT-30)

Prompt-ID: P-2026-11-02-2113
Chat: C-2026-11-02-1814
Front: codegen
Status: eseguito 2026-11-02 · lane fast · 09cfca60d · hard-stop at the ceiling, docs closed by the chat · verifica visiva passata con riserva 2026-11-02 (chat, unattended; probe with the enum fill removed)
Lane: fast (printer result, one tab surface, tests)
Depends: none
Worktree: ~/jjodel-w-textunprinted, branch textual-unprinted (from the trunk commit that adds this prompt)
Request: none (Alfonso 2026-11-02 20:47, R-TXT-30 in docs/decisions.md)

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textunprinted` on `textual-unprinted` and clean, stop with `Outcome: blocked`. Every reply opens with
`[P-2026-11-02-2113 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Never `cat` a gate log.
Commit as soon as the gates are green.

## COSA

Implement the first half of R-TXT-30. `printTextModel` already computes which values of a grouped containment no group prints
(`all.filter(v => !grouped.includes(v))` in `printer.ts`). Return them in its result as data: owner, feature, class,
grouping attribute, and whether the value is unset or outside every subset. `TextualTab.tsx` adds one issue per class and
reason to the list under the bar, at warning level: `2 Book not shown: genre unset`. No text change: the printed text stays
byte-identical.

Export one small predicate or field that step T6 will read to refuse an application. T6 itself is out of scope. Do not
change the grammar, and do not print those objects.

Check nested objects: an unprinted object's contained children are also absent, so count what is actually missing, and say in
the issue how you count them. Also state whether «New model from text» is affected (a text it reads has no unprinted objects).

Tests first, in `syntaxRecord.test.ts` on the library fixture: unset attribute, value outside every subset, a child inside an
unprinted object, nothing unprinted (no issue, byte-identical text). Mutation bench in the commit body: unprinted list always
empty; issue dropped by the tab; children not counted.

In-app check with one probe, on a non-hardware metamodel, light theme: the issue under the bar, then gone once the attribute
is set. Crops in `~/.jjodel-lanes/P-2026-11-02-2113/`.

## DOVE

`frontend/src/codegen/textual/printer.ts`, `ui/TextualTab.tsx`, `ui/TextualTab.scss` only if the warning level has no style,
`__tests__/syntaxRecord.test.ts`. Any other file: a question with `Recommended:`.

## Gates and closure

From `frontend/`, through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`,
`npm run check:docs`, `npm run check:codegen-lazy` (both modes). Commit `feat(codegen): report objects the text does not print
(P-2026-11-02-2113)`, trailer `Model:`. Log entry in `docs/log-inbox/codegen.md` and the `Status:` flip in one docs-only commit,
left uncommitted until the visual check per RC-17. No push, no merge. Final message: «Decisions taken (unattended)», «Decisions
awaiting Alfonso», then `Outcome:`.
