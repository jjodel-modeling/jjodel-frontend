# JjTL: a many-valued source feature always reaches the rules as a collection (#473)

Prompt-ID: P-2026-11-03-0539
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (source serialisation of the JjTL run; behaviour that is committed changes)
Depends: P-2026-11-03-0121
Worktree: ~/jjodel-w-jjtlmany, branch jjtl-many-valued (from the trunk commit that adds this prompt)
Request: none (Alfonso's ok of 2026-11-03 05:37; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlmany` on
`jjtl-many-valued`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-0539 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Keep context low.

## COSA

Ticket #473 of jjodel-lanes: a many-valued reference holding one value reaches the rules as a single value (`ProjectEditor.tsx:1556-1574`, confirm the lines), so `b.bindings.map` fails with `Unknown method 'map' for type Binding`. A transformation that works on two values breaks on one.

1. Confirm with a failing test or probe first, and find the root cause. Check many-valued attributes and containments as well as references, and an empty feature: all of them must arrive by the feature's declared upper bound, a collection when it is many-valued, whatever the number of values.
2. Inventory before changing: which existing tests, templates and saved transformations rely on the single value, for instance `x := ref` or a resolve on a many-valued feature with one value. Include `~/Downloads/micron-proto/transformation/`. If anything does beyond a test fixture, stop with `Outcome: question`, naming each case. Alfonso answers that one.
3. Fix it, with tests on both parse paths. Read #474 (the same pointer listed twice reaches the rules once): if it has the same cause and the fix is local, fix it in the same commit; otherwise leave it and say why.
4. Restore the original scenarios: rerun `~/.jjodel-lanes/P-2026-11-02-2338/probe/b2-writeback.v1.ts` on a free port, the version before the scenarios were edited around these two tickets, and the current `b2-writeback.ts`. Probe files in `~/.jjodel-lanes/P-2026-11-03-0539/`, one fresh tab per scenario.
5. Add the test Alfonso's ruling needs: a bound value's matched descendants resolve through the trace, so one placed twice raises the double-claim error, and the same tree written with lazy rules places twice. It was reasoned from the code and never tested. If the code does otherwise, stop with `Outcome: question`.
6. Add to the R-JTG section of `docs/decisions.md`, after R-JTG-9, ratified by Alfonso 2026-11-03 (evidence: the lanes of slice B; reversible: trunk):
   - **R-JTG-10**: the delegating rule form `= expression` is part of JjTL: it creates no target of its own and returns what the expression lowers to.
   - **R-JTG-11**: `extendEnv`, `envHas`, `envLookup` are builtins, reserved for called rules.
   - **R-JTG-12**: a bound value's matched descendants resolve through the trace; what must be lowered several times is written with lazy rules.
   - **R-JTG-13**: `resolve()`, `resolveAll()` and `{__ref}` find matched targets only, never a lazy node.
   Check the rows against `parseRows` of `scripts/gates/docs-digest.ts`. Mark R-JTG-5 unchanged: this extends it.

## DOVE

`frontend/src/components/project/ProjectEditor.tsx` (the JjTL source read only), its helpers and tests, `frontend/src/jjtl/` (tests, SPEC.md), `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. No CLAUDE.md 3.2 file: if one proves necessary, stop with `Outcome: question`. A Layer Impact Report for the write path if you touch one.

## COME

Named paths only, code and SPEC apart from docs. Gates: `frontend/src/jjtl/` and `components/project` tests, full suite, `tsc`, build, `check:docs`. Do not merge. Close with the inventory, the figures, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
