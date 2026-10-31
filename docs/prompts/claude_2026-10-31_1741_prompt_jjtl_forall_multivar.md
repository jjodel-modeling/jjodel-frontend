# JjTL: `forall` over several variables

Prompt-ID: P-2026-10-31-1741
Chat: C-2026-10-31-1732
Front: hw-notation
Status: da eseguire
Lane: full (JjTL grammar and executor bindings, two-phase in one session)
Depends: P-2026-10-31-1710 (another chat; `let` bindings in nested bodies, same executor scoping) merged into the trunk
Worktree: ~/jjodel-w-jjtlmultivar, branch jjtl-forall-multivar (from the trunk tip after the merge of P-2026-10-31-1710; the sha is in the launch message)
Request: Alfonso, 2026-10-31 17:32, brief `P-2026-10-31-1735-jjtl-multivar-forall-and-jjel-range.md`, item 1 (hardware generator prototype). Item 2 of the same brief is P-2026-10-31-1740.

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlmultivar` on
`jjtl-forall-multivar`, stop with `Outcome: blocked`. Check that `git log --oneline -30` contains the merge of
P-2026-10-31-1710; if not, stop with `Outcome: blocked`. Check that `P-2026-10-31-1741` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1741 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

### The case

A transformation of the hardware generator prototype lowers the requirement "no two grants at the same time" of an
arbiter with requesters cpu, dma, io into one property: the conjunction, over every pair of requesters, of
`!(grant_q & grant_r)`. The expected low-level expression (textual syntax of the target DSL) is one flat conjunction:

```
!(grant_cpu_r & grant_dma_r) & !(grant_cpu_r & grant_io_r) & !(grant_dma_r & grant_io_r)
```

Today a `forall` binds one variable and its body must create an object
(`forAllMapping = "forall" IDENTIFIER "in" expression ("such" "that" expression)? "->" targetType mappingBody`), so
ranging over pairs takes two nested foralls, which builds a tree: one `Conj` per requester holding one `Neg` per
requester of higher priority. Correct but degenerate:

```
(!(grant_cpu_r & grant_dma_r) & !(grant_cpu_r & grant_io_r)) & and(!(grant_dma_r & grant_io_r)) & and()
```

an inner conjunction with one operand, and an empty one for the requester of lowest priority. The same shape appears
in three more places of that transformation (priority property, round-robin selection).

### Required

A `forall` with several variables, each ranging over its own expression, iterated as the cartesian product in the
order written (first variable outermost), every variable bound in the `such that` and in the body, together with the
variables of any enclosing forall and the `let` bindings in scope (P-2026-10-31-1710):

```jjtl
-> ops {
    forall q in requesters, r in requesters such that r.priority > q.priority -> Neg {
        -> op { -> Conj { -> ops {
            forall s in requesters such that s.name == q.name or s.name == r.name -> Ref { name := "grant_" + s.name + "_r" }
        } } }
    }
}
```

Accepted wherever a single-variable `forall` is accepted today: rule level and inside a feature of a created object.
An empty product creates nothing, without a warning. The parser rejects a repeated variable name in the same `forall`.
A later variable's expression may read an earlier variable of the same `forall` (`forall q in xs, r in q.children`):
say in the report whether you support it; if you do, test it.

Precedent: ATL matched rules with several source pattern elements and a filter
(`from q : A!Requester, r : A!Requester (r.priority > q.priority)`), QVT-Relations domains with several variables. Here
it is narrower: only the `forall` of an object creation, no new rule form.

### Also check: the JjEL route

P-2026-10-31-1340 (merged) made source collections reached by an expression resolve. So the pairs can now also be
built in JjEL: `forall pr in requesters.flatMap(q => requesters.filter(r => r.priority > q.priority).map(r => { hi: q, lo: r }))`.
Check that iterating over a list of object literals works and that `pr.hi.name` resolves; add one test showing that
both routes give the same result. If the JjEL route fails, report why with file and line; fix it only if the fix is
local to the executor.

### Acceptance

Tests in `frontend/src/jjtl/executor/__tests__/` (and the parser tests in `frontend/src/jjtl/parser/__tests__/`): two
variables over the same collection with a filter relating them (the pairs, in order, as a flat list in the feature);
variables of an enclosing forall visible in the `such that` and in the body; a `let` binding visible in the body; an
empty product; three variables; the repeated-name rejection. On the case above, with three requesters the property's
expression is one `Conj` with three `Neg` operands. (With two requesters the `Conj` has one operand: flattening is not
this lane's concern.) Existing tests unchanged.

## DOVE

Expected, to confirm in discovery: `frontend/src/jjtl/parser/parser.ts` (the `forall` rule and its AST node),
`frontend/src/jjtl/types/` (AST type of the forall: add the variable list without breaking the readers of the current
single-variable field, or change all readers inside JjTL and list them), `frontend/src/jjtl/executor/executor.ts`
(`runForAll`, bindings), the `useJjtlParser` hook if it parses `forall` on its own path, `frontend/src/jjtl/SPEC.md` and
`docs/jjtl/` for the grammar. Out of scope: `ProjectEditor.tsx`, the codegen engine, Jjodie, the JjEL evaluator.

Stop conditions: a change to an exported type read outside `frontend/src/jjtl/` is an exported interface change:
describe it in the report and stop there with `Outcome: question` and a `Recommended:` line.

## COME

### Phase 1: discovery (read-only)

A short vitest probe on the arbiter case (three requesters with priorities), run once, kept as the seed of the Phase 2
test. Then report, with file and line: the forall grammar and AST, every reader of the forall's variable field, how
bindings are pushed for a forall body after P-2026-10-31-1710, how the iteration over a JjEL value works (object
literals included), the plan for the product iteration and the parser change, and the consumers it can affect. Grep
every new identifier you plan to add.

Save the report as `docs/discovery/discovery_2026-10-31_jjtl_forall_multivar.md` (objective, files read with full paths,
findings, risks, open questions) and commit it (`git add` that file only). If every change stays inside
`frontend/src/jjtl/` and no exported type read outside it changes, continue into Phase 2 in the same session. Otherwise
hard stop with `Outcome: hard-stop`.

### Phase 2: implementation

Tests first, then the parser, the AST type and the executor. Update the grammar in `frontend/src/jjtl/SPEC.md` (and in
`docs/jjtl/` if the grammar is written there) with one example.

Gates: `npx tsc --noEmit` (compare with the baseline count), `npx vitest run src/jjtl src/jjel`, `npm run build` at the
end. Say how many JjTL test files fail to load in node with "window is not defined" before and after (known environment
issue, not to fix). Verifica visiva non applicabile (parser and executor only).

## RIFERIMENTI

- `frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/parser/__tests__/forall-and-value-mappings.test.ts`
- `frontend/src/jjtl/executor/executor.ts` (`runForAll`, `executeCreationMapping`, `createInstanceContext`)
- P-2026-10-30-1315 (nested `-> feature { forall ... }`), P-2026-10-31-1340 (source collections), P-2026-10-31-1710 (`let` scoping)
- `frontend/src/jjtl/SPEC.md`, `docs/jjtl/`

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1741)`.
Log entry in `docs/claude-code-log.md` at the end. Replace `Status: da eseguire` with date, lane, branch and sha in the
same docs-only commit as the log entry. No push, no merge into the trunk. Report closes with «Decisions taken
(unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
