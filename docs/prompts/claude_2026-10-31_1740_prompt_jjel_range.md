# JjEL: `range(n)` and `range(a, b)`

Prompt-ID: P-2026-10-31-1740
Chat: C-2026-10-31-1732
Front: hw-notation
Status: da eseguire
Lane: fast (one additive JjEL builtin with tests; stop if the JjTL forall needs more than a local change)
Depends: none
Worktree: ~/jjodel-w-jjelrange, branch jjel-range (from alfonso-frontend-jjtl e94541c13)
Request: Alfonso, 2026-10-31 17:32, brief `P-2026-10-31-1735-jjtl-multivar-forall-and-jjel-range.md`, item 2 (hardware generator prototype). Item 1 of the same brief is P-2026-10-31-1741.

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjelrange` on
`jjel-range`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1740` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1740 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

The next case of the hardware generator prototype is a small RISC-V core. Its transformation iterates over numbers,
not over model elements: the registers of the register file (x0 to x7), the bits of an instruction field, the stages
of a pipeline. JjEL has no way to write "the integers from 0 to n-1".

Required:

- `range(n)`: the list `[0, 1, ..., n-1]`, empty when `n <= 0`.
- `range(a, b)`: `[a, ..., b-1]`, empty when `b <= a`.
- Integers only. A non-integer argument (a fraction, a string, null, a bit-vector) is an error naming the function,
  never a silent truncation or conversion. Wrong arity is an error too.
- Usable everywhere JjEL is: in particular as the collection of a JjTL `forall`
  (`forall i in range(nregs) -> Register { name := "x" + i }`) and in code generator templates.

Global function or method on numbers: your choice, consistent with the existing builtins. If global, it behaves like
`bits`/`sbits` (`frontend/src/jjel/SPEC.md`, around line 535): it shadows a context variable with the same bare name,
so a model feature called `range` is read as `self.range`. Before deciding, grep the fixtures, the sample projects and
the tests for a feature or variable named `range` read bare, and report the count. If a global `range` would change
the result of any existing test or fixture, stop with `Outcome: question` and a `Recommended:` line.

## DOVE

`frontend/src/jjel/evaluator/builtins/` (`numbers.ts` or `collections.ts`, and `index.ts`), `frontend/src/jjel/SPEC.md`
where the builtins are listed, tests in `frontend/src/jjel/__tests__/`, one JjTL test in
`frontend/src/jjtl/executor/__tests__/`. Grep for every other list of builtin or reserved names (editor completion,
analyzers, lexers) and add `range` where the other globals are listed; name each file in the report.

If a JjTL `forall` over a list of numbers does not work today (the executor expecting model elements), a local fix in
`frontend/src/jjtl/executor/executor.ts` binding the value as the loop variable is in scope; anything larger is a hard
stop with `Outcome: question`. Lane P-2026-10-31-1710 (another chat) is editing the scoping of forall bodies in the
same file: keep the diff there minimal.

Out of scope: the JjTL grammar, the codegen engine, Jjodie, `ProjectEditor.tsx`.

## COME

Tests first: `range(4)`, `range(0)`, `range(-2)`, `range(2, 5)`, `range(5, 2)`, `range(2, 2)`, the errors (`range(1.5)`,
`range("3")`, `range()`, `range(1, 2, 3)`) with the function named in the message; one JjTL test creating one object
per element of `range(4)`, each with its index in an attribute (`index` 0..3 in order). Then implement.

Gates: `npx tsc --noEmit` (compare with the baseline count before your change), `npx vitest run src/jjel src/jjtl`,
`npm run build`. Say how many test files fail to load in node with "window is not defined" before and after (known
environment issue, not to fix). Verifica visiva non applicabile (evaluator only).

## RIFERIMENTI

- `frontend/src/jjel/SPEC.md` (builtins, `bits`/`sbits` shadowing rule)
- `frontend/src/jjel/evaluator/builtins/`
- `frontend/src/jjtl/executor/executor.ts` (`runForAll`)
- P-2026-10-31-1340 (source collections in expressions, merged)

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1740)`.
Log entry in `docs/claude-code-log.md` at the end. Replace `Status: da eseguire` with date, lane, branch and sha in the
same docs-only commit as the log entry. No push, no merge into the trunk. Report closes with «Decisions taken
(unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
