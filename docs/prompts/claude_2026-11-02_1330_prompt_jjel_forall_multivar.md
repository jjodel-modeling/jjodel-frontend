# JjEL: `forall` and `exists` over several variables

Prompt-ID: P-2026-11-02-1330
Chat: C-2026-11-02-1319
Front: maintenance
Status: da eseguire
Lane: full (JjEL grammar, every language inherits it; two-phase in one session)
Depends: none
Worktree: ~/jjodel-w-jjelmultivar, branch jjel-forall-multivar (from the trunk commit that adds this prompt)
Request: Alfonso, 2026-11-02 13:19 (project chat), see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjelmultivar` on
`jjel-forall-multivar`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1330 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

Implement R-FA-1..6 of `docs/decisions.md` (read them first; they are provisional, and a measured reason to change one
goes in the report). In short:

```
forall x, y in S such that x.p < y.p : x.name + y.name
forall x in A, y in B : x.name + y.name
forall x, y in A, z in x.children such that P          // no projection: records { x, y, z }
exists x, y in S such that x != y and x.name == y.name
```

Full cartesian product, first variable outermost, one flat result, later collections may read earlier variables.
One-variable expressions keep their AST and behaviour exactly.

Acceptance, as tests in `frontend/src/jjel/__tests__/`: the forms above; order of the results; (a,a) and both orders
present without a filter; three variables; dependent collection; empty product gives `[]` and `false`; a non-array
collection gives `[]` and `false` as today (including when it is not the first binding); no-projection records read as
`p.x.name`; repeated name is a parse error naming the variable; `f(forall x in S, y)` stays two arguments and
`[forall x in S : x, y]` two elements; a `such that` referring to any variable; AST of a one-variable forall unchanged.

Then run the same expressions through each consumer of the parser and say in the report, with a test where the
consumer has a test home, what happens: JjScript `eval`, validation rules (`model/validation/validationEvaluator.ts`),
simulator guards (`model/simulation/subsetChecker.ts`, `guardContext.ts`, `derivedEvaluator.ts`: a rejection with a
clear message is correct, a silent wrong answer is not), codegen templates and the JS printer
(`codegen/target/js/printer.ts`, `codegen/engine/generatorFile.ts`: the generated JavaScript must agree with the
evaluator), `codegen/ui/templateCompletion.ts` and the JjEL autocomplete (variables `x` and `y` both offered).

## DOVE

`frontend/src/jjel/parser/parser.ts` (`forAll`, `exists`), `frontend/src/jjel/SPEC.md` and its grammar, the JjEL tests;
the autocomplete under `frontend/src/jjel/autocomplete/` if variables are not offered. The parser of JjScript and of
JjTL are out of scope (lanes P-2026-11-02-1332 and P-2026-11-02-1331). A fix in a consumer listed above is in scope only
if small and local; otherwise a ticket in the report.

Stop with `Outcome: question` and a `Recommended:` line if R-FA-6 fails and a change to an exported AST type read
outside `frontend/src/jjel/` becomes necessary.

## COME

Phase 1, read-only: a short vitest probe of the desugaring by hand (a nested `flatMap` written in JjEL against the same
cases, non-array collection included), the behaviour of `flatMap` on a non-array and of its lambda on the shadowing of
an outer variable; every reader of the AST listed above. Save `docs/discovery/discovery_2026-11-02_jjel_forall_multivar.md`
(objective, files read with full paths, findings, risks, open questions), commit it (`git add` that file only), and
continue into Phase 2 in the same session unless the stop above applies.

Phase 2: tests first, then the parser, then `SPEC.md` (grammar and one example per form, the desugaring stated).
Gates: `npx tsc --noEmit` against the baseline count, `npx vitest run src/jjel src/jjscript src/jjtl src/codegen
src/model/validation src/model/simulation`, `npm run build` at the end. Never paste a long log: grep the summary lines.
Verifica visiva non applicabile unless the autocomplete changes; then one crop in the console.

## RIFERIMENTI

`docs/decisions.md` R-FA; `frontend/src/jjel/types/ast.ts:255-268`; `evaluator.ts:1112` (`evaluateForAll`).

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-11-02-1330)`. Log
entry per P9. Replace the Status line with date, lane, branch and sha in the same docs-only commit as the entry. No push,
no merge into the trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
