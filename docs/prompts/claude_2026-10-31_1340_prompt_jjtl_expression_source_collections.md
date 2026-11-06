# JjTL: source collections reached by an expression are unresolved

Prompt-ID: P-2026-10-31-1340
Chat: C-2026-10-31-1328
Front: release-3-2
Status: eseguito 2026-10-31 · lane jjtl-expr-resolve · branch jjtl-expr-resolve · 636d465c0 · verifica visiva non applicabile (executor only)
Lane: full (executor and JjEL evaluation context, cause unknown, two-phase)
Depends: none (P-2026-10-30-1315, nested `-> feature { forall ... }`, is already on the trunk at 6dbd2e3b0)
Worktree: ~/jjodel-w-jjtlexpr, branch jjtl-expr-resolve (from alfonso-frontend-jjtl 5b19ebfc8)
Request: none (typed in the project chat on 2026-10-31; kept locally via --request)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlexpr` on
`jjtl-expr-resolve`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1340` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1340 · session <id>]`.

No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

Found while writing a JjTL transformation between two hardware DSLs (node, executor alone). Inside a rule
`Arbiter -> M { ... }`, with `requirements` a containment of the source holding three `Requirement` objects:

1. `forall p in requirements such that p.kind == "X" -> ...` works: the JjTL forall resolves the elements.
2. In any JjEL expression the same collection holds unresolved references: `requirements.size()` is right,
   but `requirements.first().kind` is `null`, `requirements.map(p => p.kind)` gives `null`s, and
   `requirements.filter(p => p.kind == "X").isNotEmpty()` is `false`. No warning is emitted.
3. A source alias (`Arbiter a -> M`) is visible in `where` and at rule level, but not inside a forall body:
   `a.requirements` there fails with "Cannot access property 'requirements' of null" (a warning).
4. `exists p in requirements such that ...` does not parse inside a `such that` clause.

Why it matters: a guard such as "generate these registers only if the model has a requirement of kind X"
cannot be written, and the failure is silent; the generated model just lacks the elements.

Expected: elements of a source collection resolve the same way in an expression as in a JjTL forall; the
rule's source alias is in scope in every nested body; an unresolved reference read inside an expression is
reported as a warning, never turned into `null` silently. For point 4: establish in discovery whether
`exists` is part of the language (grammar, `docs/jjtl/`, JjEL builtins such as `exists`/`any` on
collections). If it is specified, make it parse; if it is not, do not add syntax: report it as a decision for
Alfonso and make sure the collection form (`requirements.exists(p | ...)` or whatever JjEL already offers)
works after points 2 and 3.

## DOVE

Expected, to confirm in discovery: `frontend/src/jjtl/executor/executor.ts` (instance context, forall
bindings, `createInstanceContext`, conversion of source values to JjEL values), the JjEL value bridge it uses
(`toJjelValue`/`fromJjelValue` or equivalent), and new tests in `frontend/src/jjtl/executor/__tests__/`.
The JjTL parser only if point 4 is in the language. Out of scope: `ProjectEditor.tsx` and the in-app
materialization, the codegen engine, Jjodie.

Stop conditions: a change to the shared JjEL evaluator or value model that changes results for other
consumers (codegen templates, JjScript, Jjodie validation) is an exported behaviour change: describe it in
the report and stop there instead of making it.

## COME

### Phase 1: discovery (read-only)

Write a ten-line vitest probe reproducing points 1 to 4 on a small in-memory source (three `Requirement`s with
`kind`), run it once, keep it as the seed of the Phase 2 test. Then report, with file and line: where the
forall resolves elements and where an expression reads the same feature; why the two differ (proxy, id,
raw `__ref`, lazy resolution); how the alias is bound at rule level and why the forall body loses it; the
status of `exists` in the grammar and the docs; the minimal change for each point and the consumers it can
affect. Grep every new identifier you plan to add.

Save the report as `docs/discovery/discovery_2026-10-31_jjtl_expression_source_collections.md` (objective,
files read with full paths, findings, risks, open questions) and commit it (`git add` that file only).

If every fix stays inside the executor and touches no exported behaviour outside JjTL, continue into Phase 2
in the same session. Otherwise hard stop with `Outcome: hard-stop`.

### Phase 2: implementation

Fix points 2 and 3 (and 4 if specified). Tests in `frontend/src/jjtl/executor/__tests__/`: each form of point 2
returns the resolved values; the alias is readable inside a forall body and a nested forall body; an
unresolved reference read in an expression produces one warning naming the rule and the expression.
Existing executor and JjTL tests unchanged.

Gates: `npx tsc --noEmit`, `npx vitest run src/jjtl`, `npm run build` at the end. Say how many JjTL test files
fail to load in node with "window is not defined" before and after (known environment issue, not to fix).

## RIFERIMENTI

- `frontend/src/jjtl/executor/executor.ts` (`runForAll`, `executeCreationMapping`, `createInstanceContext`)
- `docs/jjtl/` (language reference, DEVELOPMENT-PLAN.md)
- P-2026-10-30-1315 (nested feature creation, same file)

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1340)`.
Log entry in `docs/claude-code-log.md` at the end. Replace `Status: da eseguire` with date, lane, branch and sha
in the same docs-only commit as the log entry. No push, no merge into the trunk. Report closes with «Decisions
taken (unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
