# JjTL: SPEC section 12.2 against reality, and undeclared bindings (#445)

Prompt-ID: P-2026-11-03-1402
Chat: C-2026-11-03-1020
Front: hw-notation
Status: eseguito 2026-11-03 · lane full · e784e325d · rows reproduced by tests on both parser paths, double-execution row read only, no app probe (unattended)
Lane: full (executor and parser behaviour, SPEC)
Depends: none
Worktree: ~/jjodel-w-jjtlspec12, branch jjtl-spec-12-review (at the commit that adds this prompt)
Request: none (Alfonso's request of 2026-11-03 10:20, plan for the open JjTL points; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlspec12` on
`jjtl-spec-12-review`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1402 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read `frontend/src/jjtl/SPEC.md` section 12.2, ticket #445, then the code each row names.

## COSA

1. For each row of SPEC 12.2 (`.forAll(...)` never parses; 7 test files fail at import; multiplicity `[*]` always creates 1 instance; number type; duplicate values, B_1 receiving A_0's values; double execution under StrictMode; debug logging; any other): reproduce with a test, and classify real or stale. A stale row is corrected in the SPEC with its evidence (commit or test). A real one with a local fix is fixed here; otherwise it gets one ticket with a priority (`lane-run ticket --front hw-notation --found P-2026-11-03-1402`). The double execution row needs the app, since StrictMode does not show in a unit test: one probe, or say it was only read.
2. #445: confirm the cause (a binding of `name` to the string toy on a class with no declared `name` gives `TToy_0`; the ticket points to `nestedMaterialization.ts`, about line 112, which has moved since). A binding to an undeclared feature produces a warning with rule, line and column, in the form of the unresolved-reference warnings, shown in the output panel. Never a silent drop, never a created feature. Check that no bench or fixture relied on the drop.

Stop and split if this exceeds about five product files: commit what is green, list the rest with `Outcome: question`.

## DOVE

`frontend/src/jjtl/` (executor, parser, lexer, tests, `SPEC.md`), `frontend/src/jjel/lexer/` only if `.forAll` is fixed locally, with its tests, `frontend/src/components/project/nestedMaterialization.ts` and its test, `docs/log-inbox/hw-notation.md`, the `Status:` line. Probes in `~/.jjodel-lanes/P-2026-11-03-1402/`. Not touched: `ProjectEditor.tsx` (branch jjtl-output-tab-late has it open; if the fix needs it, stop with `Outcome: question`), every CLAUDE.md 3.2 file, `joiner/classes.ts`, the reducer. An exported interface that breaks outside the lane, or a change to what JjEL accepts beyond the row: stop and ask. The repo is public: name no partner company.

## COME

Tests first. Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (compare the import-red count with the baseline of 9, and say why if it changes), build, `check:docs`. Update #445, do not close it before the merge. A probe is not a hand run. If context runs short, commit what is green and write the handoff. Do not merge. Close with a table of the rows (row, verdict, evidence, action), «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
