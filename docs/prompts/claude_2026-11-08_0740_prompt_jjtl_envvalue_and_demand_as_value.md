# JjTL: envValue returns a bound value, and a demand used as a value stops the run (slices S1 and S2)

Prompt-ID: P-2026-11-08-0740
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-08 · lane full · a35b54454 (S1), 93cf9f04b (S2), 0fbc6a015 (SPEC), 1f163a4d8 (R-JTG-23..29) · Brief hashes unchanged
Lane: full (unattended; tests first, then the smallest change)
Depends: P-2026-11-08-0125
Worktree: ~/jjodel-w-envvalue, branch jjtl-envvalue
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-envvalue` on `jjtl-envvalue`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0740 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines of suites and probes. Commit as soon as the gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

Read `docs/discovery/discovery_2026-11-08_jjtl_kernel_gaps.md`, sections 0, 3 and 9 to 10. Alfonso ratified all its recommendations on 2026-11-08 07:34 («Ok alle raccomandazioni»).

1. Register them in `docs/decisions.md` after the last R-JTG row, one row each, all `ratified by Alfonso 2026-11-08 07:34, registered by P-2026-11-08-0740, evidence: measured, verified: none, reversible: trunk`, checked with `scripts/gates/docs-digest.ts` before the commit: (a) `envValue(name[, env])` returns the bound value as bound, never a demand; (b) an unbound name in `envValue` stops the run as R-FA-11 asks, `envHas` is the test; (c) a demand used as a value in an expression stops the run; (d) several source models start as several models of one metamodel, their objects united in pass 1, typed `from A, B` later; (e) the run dialog keeps a primary model plus an «also include» list; (f) matching on supertypes follows R-JTG-3: the most specific rule wins, equal specificity is an error; (g) the dynamic visibility of a caller's variables in a helper is to be closed, after a lane measures what relies on it. Only (a), (b) and (c) are implemented here.

2. S1, `envValue`: failing tests first, in a called rule, a helper body, a guard and a `forall` collection, on both parser paths; a string, an integer and a source element bound by `extendEnv`; the unbound case. Then the builtin, beside `envLookup` (R-JTG-11), unchanged otherwise.

3. S2: failing tests first for cases A and C of the report (a demand concatenated to a string, used in arithmetic), then the error, worded like R-FA-12 (rule and source element). A demand that a binding places stays legal. List every existing test whose expectation changes.

4. Run the full vitest suite, not only the JjTL and JjEL suites: the last two lanes of this front missed a caller outside `jjtl/`. Then the node baseline of the report on the two Briefs in `~/.jjodel-lanes/pending/kgaps-inputs/`, with its probe copied under `frontend/src/jjtl/executor/__tests__/` and removed after: both outputs must keep the SHA-256 prefixes of §0 (arbiter `5c0d9731c4bb9632`, core `2a34b97ab348ce64`).

## DOVE

Written: `frontend/src/jjtl/executor/executor.ts`, tests under `frontend/src/jjtl/executor/__tests__/`, `frontend/src/jjtl/SPEC.md` §5.3.3 and §10, `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. Stop with `Outcome: question` if S2 breaks a transformation fixture that places a demand legally, if a change is needed outside `jjtl/`, or for a critical-zone file.

## COME

Typecheck, full vitest, build, `check:docs`. Atomic commits, named paths, docs and code never in one commit. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
