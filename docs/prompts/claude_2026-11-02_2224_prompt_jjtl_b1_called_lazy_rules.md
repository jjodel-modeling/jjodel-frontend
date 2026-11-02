# JjTL B1: called and lazy rules with an environment, in the executor

Prompt-ID: P-2026-11-02-2224
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (JjTL grammar and executor; first lane of slice B, the app's write-back follows as a separate lane)
Depends: P-2026-11-02-2108
Worktree: ~/jjodel-w-jjtlcalled, branch jjtl-called-rules (at the commit that adds this prompt)
Request: none (Alfonso's GO of 2026-11-02 22:21 for slice B; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcalled` on
`jjtl-called-rules`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2224 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as each step's gates are green: this front reaches the context ceiling in minutes. Read only SPEC 5.3, R-JTG-3..7, `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md:268-322`, and sections 4 (Part B) and 5 (Q1, Q2) of `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md`.

## COSA

Implement, in this order, one commit each:

1. Grammar, on both parse paths (the parity test covers them): `rule name(params) -> Type { ... }`, `lazy S -> T { ... }`, `unique lazy S -> T { ... }`. Follow the roadmap sketch; R-JTG-5 governs. Grep before adding keywords: `rule`, `lazy`, `unique` must not break an existing identifier in a saved transformation; if they would, make them contextual.
2. Called rules. Callable from a binding or a `forall` body, creating and returning the target so that it can be placed in a feature. Arguments are visible in body and guard. A called rule takes no part in pass 1.
3. Environment (R-JTG-5, R-JTG-6). Dynamically scoped per rule application, so implicit resolution inside a called rule inherits it down to the leaves; reified as a named parameter of called rules; values are closures, holding the expression and the environment of the binding site, so a substituted expression is lowered where it was written and names are not captured. The trace key becomes (source, rule, environment), using the structure A1 shaped. Errors carry the application stack: rule, source element, environment frames.
4. Lazy rules (R-JTG-7). They never match in pass 1; they create a target only when a resolution or a call reaches the node. `unique`: once per (rule, arguments, environment), memoised.
5. Containment under B (R-JTG-6). A containment resolves (source, rule, caller's environment), creating the entry when absent. A call of a rule not `unique` always creates a fresh subtree, even under an environment seen before, so one expression may be placed twice with the same bindings. The double-claim error applies to implicit resolutions and to `unique` rules only. Placed targets stay marked as they are today (`__nested`, `__placed`).

Non-termination: a recursive call with no progress must end in an error naming the stack, not a browser hang: pick a depth limit, and say which.

## Acceptance

In `frontend/src/jjtl/executor/__tests__/`, on a toy pair: source `Expr` with `Add(left, right)`, `Const(value)`, `Var(name)`, `Bind(expr, bindings)`, `Binding(var, expr)`, plus `Op(name, semantics)` and `Template(each, body)`; target `Add`, `Const`, `Ref(name)`. No inheritance: one rule per concrete class.

(2) `Bind(Add(Var x, Const 1), [x := Var a])` lowers to `Add(Ref a, Const 1)` through a called rule carrying the environment. (3) a template expanding one target per referenced `Op`, each with its semantics lowered and operands bound. Also: one expression placed twice with the same bindings gives two separate subtrees; with different bindings, two different ones; a bound expression that itself contains a variable of the outer scope, testing capture; `unique lazy` created once; lazy rules create no root for unreached nodes; a second claim through an implicit resolution still errors; depth limit. Run the existing suite: nothing else changes.

## DOVE

`frontend/src/jjtl/` (lexer, parser, executor, tests, SPEC.md), `docs/log-inbox/hw-notation.md`, the `Status:` line. Read only: everything else. `frontend/src/components/project/` is B2's: list at the end what the write-back must change, including the map at `ProjectEditor.tsx:1809` (one target per source id) and removing the optional `isPlacedIn` of `nestedMaterialization.ts`. Do not touch `frontend/src/jjel/`: if the grammar needs it, stop with `Outcome: question`. No CLAUDE.md 3.2 file.

## COME

Named paths only. Gates: `frontend/src/jjtl/` tests, full suite, `tsc`, `check:docs`. Do not merge: this branch waits for B2. Close with the list for B2, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
