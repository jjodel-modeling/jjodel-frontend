# JjTL: a helper parameter named like another helper reads as that helper (silent)

Prompt-ID: P-2026-11-06-2226
Chat: C-2026-11-07-1609
Front: hw-notation
Status: eseguito 2026-11-07 · lane fast · db2c1be10 (code), 9410651fd (SPEC) · scoped shadowing, plain JjEL unchanged
Lane: fast (one executor change, its test and a SPEC note; unattended)
Depends: none
Worktree: ~/jjodel-w-jjtlshadow, branch jjtl-helper-param-shadow
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlshadow` on `jjtl-helper-param-shadow`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-06-2226 · session <id>]`. No subagents, no background tasks. Print only summary lines of suites. Commit as soon as the gates are green. The repo is public: name no partner company, cite no path outside this tree in anything committed.

Note on the id: the prompt was written as P-2026-11-06-2225, an id already taken by an instance-of lane; renumbered to the next free minute.

## Observation

In a JjTL helper, a parameter whose name is also the name of a helper of the same transformation evaluates to the helper (a function object), not to the argument passed. No warning, no error: the run reports success. Found in the hardware prototype's single transformation, where a helper `section` and a String parameter `section` in a caller silently selected the wrong branch, so every pattern's properties were also emitted as registers and wires.

Minimal reproduction (any source model with a root of class Brief; target SyncRTL):

    transformation Rep
    from Brief
    to SyncRTL
    helper pick(x: Any, which: String) -> String { if which == "a" then "A" else "B" }
    helper call(cx: Any, s: String) -> String { pick(cx, s) }
    helper echo(cx: Any, pick: String) -> String { pick }
    Brief b -> Module {
        name := call(b, "a") + "/" + echo(b, "a")
    }

Measured on alfonso-frontend-jjtl at 0fa6e4414 in node (executor only): `name` is `A/[object Object]`; expected `A/a`. With `helper call(cx: Any, pick: String) -> String { pick(cx, pick) }` the result is `B`: the argument `pick` passes the helper, not the string.

## COSA

1. A failing executor test with the reproduction above (both forms: the parameter read alone, and passed on). Use minimal in-test metamodels; the test must fail on the current code before the fix.
2. The fix: a parameter shadows a helper of the same name inside the helper's body (lexical scoping, as in JjEL lambdas), while a call `pick(...)` still resolves to the helper when no parameter of that name is a function. If the language prefers to forbid the clash instead, then a parse-time error naming the parameter and the helper, never a silent substitution. State which was chosen and why in the log entry. Find where helper bodies bind their parameters and where helpers are registered as builtins (SPEC §3.4 and the "Register helpers" step); fix it in the smallest place.
3. A note in `frontend/src/jjtl/SPEC.md` (§3.4 Helper Functions, scoping) with the rule.

Gates: typecheck (against the §17 baseline), the JjTL and JjEL suites, `check:docs`. No app probe. Docs and code in separate commits.

## Not asked

No change to the hardware prototype's files; it has been renamed around the clash (`part(p, which)`). No decision row.

## DOVE

Written: `frontend/src/jjtl/executor/executor.ts` (or the JjEL evaluator file where call resolution happens, if the binding lives there), a test under `frontend/src/jjtl/executor/__tests__/`, `frontend/src/jjtl/SPEC.md` §3.4, `docs/log-inbox/hw-notation.md`, the `Status:` line of this prompt. Stop with `Outcome: question` if the fix needs a change to an exported interface that breaks outside `jjtl/` or `jjel/`, or if JjEL call resolution outside JjTL changes behaviour for existing JjEL tests.

## COME

Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
