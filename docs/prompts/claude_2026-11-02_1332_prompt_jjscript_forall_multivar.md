# JjScript: `forall ... do` over several variables

Prompt-ID: P-2026-11-02-1332
Chat: C-2026-11-02-1319
Front: maintenance
Status: da eseguire
Lane: fast (one parser rule, desugared to nested foralls; the executor unchanged if the probe confirms)
Depends: P-2026-11-02-1330 merged into the trunk
Worktree: ~/jjodel-w-jjsforallmv, branch jjscript-forall-multivar (from the trunk tip after that merge)
Request: Alfonso, 2026-11-02 13:19 (project chat), see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjsforallmv` on
`jjscript-forall-multivar`, stop with `Outcome: blocked`. Check that `git log --oneline -30` contains the merge of
P-2026-11-02-1330; if not, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1332 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

R-FA-7 of `docs/decisions.md`: the JjScript command accepts the JjEL forms.

```
forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + _dup
forall c in classes, x in c.attributes such that x.name == id do delete x
```

The parser desugars to nested `ForAllArgs`, the filter on the innermost, so the planner, the permission guard, the
validator and the executor see only what they already handle. Forward checks: a nested `forall` body works in all
passes (`runPasses.ts`, `effectsPlanner.ts`, `scriptValidator.ts`, `permissionGuard.ts`) or the report says where it does
not; `isForAllDoCommand` routes the multi-variable form with `do` to the command and without `do` to JjEL `eval`.
A repeated name is a parse error. Single-variable `ForAllArgs` unchanged.

Tests in `frontend/src/jjscript/`: both spellings with `do`, dependent collection, filter over both variables, the
effects preview of a two-variable delete, undo as one step (R-RFB-12), and the query form without `do`.

## DOVE

`frontend/src/jjscript/parser/parser.ts` (`isForAllDoCommand`, `parseForAllCommand`), the tests, the JjScript grammar
if written in docs (`docs/spec/concern_languages.md` is not touched), and the forall line of the help text if listed.
`frontend/src/constants/defaultPrompts.ts`: one line so Jjodie knows the form.

## COME

Verifica preventiva inline, at most ten lines in the log entry. Gates: `npx tsc --noEmit` against the baseline,
`npx vitest run src/jjscript src/jjel`, `npm run build`. Never paste a long log. Verifica visiva non applicabile.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-11-02-1332)`. Log
entry per P9. Replace the Status line with date, lane, branch and sha in the same docs-only commit as the entry. No push,
no merge into the trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
