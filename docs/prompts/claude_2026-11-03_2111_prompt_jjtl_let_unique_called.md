# JjTL: let holds its value (#515), unique on called rules

Prompt-ID: P-2026-11-03-2111
Chat: C-2026-11-03-1020
Front: hw-notation
Status: eseguito 2026-11-03 · lane full · d8c281211 · stopped at the context ceiling (AM-8), closed by P-2026-11-03-2325 · app probe on C2R, output equals the expected schema, same tree after reopen; no visual check by hand (unattended)
Lane: full (language semantics, decided by Alfonso on 2026-11-03)
Depends: none
Worktree: ~/jjodel-w-jjtllet, branch jjtl-let-unique-called (at the commit that adds this prompt)
Request: none (Alfonso's ok of 2026-11-03 21:07; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtllet` on
`jjtl-let-unique-called`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-2111 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read SPEC 5.3.3, R-JTG-5, 6, 12, section 5 of `docs/discovery/discovery_2026-11-03_jjtl_class2relational.md`, the fixture `frontend/src/jjtl/__tests__/fixtures/class2relational.ts`, tickets #515 and #517.

## COSA

Decided by Alfonso:

1. A `let` holds the value of its expression, computed once, at the binding. Using `$id` twice gives the same object. Failing test first: the natural Class2Relational text with `let $id = idColumn(c)`: no extra Column at the root, keys and foreign keys are the table's own columns by identity. #515.
2. `unique` is allowed on called rules: `unique rule f(x)` returns the same target for a second call with the same arguments and environment, as `unique lazy` does. Parser, executor, SPEC. A target created by a called rule can now be referenced twice.
3. Move the natural Class2Relational version forward: remove from the fixture the workarounds these two make needless, keep one test for each decision. Say how many of the 21 edits go away, against the report.

Check that no existing behaviour depended on re-running a `let`: the hardware fixtures and benches, R-JTG-12. A bench that changes its figures is reported with both numbers, not adjusted silently. If a rule that must lower several times relied on it, stop with `Outcome: question`.

Register two rows R-JTG-15 and R-JTG-16 in `docs/decisions.md`, `ratified by Alfonso 2026-11-03`, checked against `parseRows` of `frontend/scripts/gates/docs-digest.ts`.

## DOVE

`frontend/src/jjtl/` (parser, executor, tests, fixture, `SPEC.md`), `docs/decisions.md` (two rows), `docs/log-inbox/hw-notation.md`, the `Status:` line. Probes in `~/.jjodel-lanes/P-2026-11-03-2111/`. Not touched: `ProjectEditor.tsx`, CLAUDE.md 3.2 files. An app probe of the natural text, output read back. The repo is public: name no partner company.

## COME

Tests first. Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (3 files red at import are the baseline), build, `check:docs`. Update #515. A probe is not a hand run. If context runs short, commit what is green and write the handoff. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
