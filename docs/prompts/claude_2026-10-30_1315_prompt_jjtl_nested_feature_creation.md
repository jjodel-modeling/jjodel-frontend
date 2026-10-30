# JjTL executor: `-> feature { ... }` inside a created object, with the enclosing forall variables bound

Prompt-ID: P-2026-10-30-1315
Chat: C-2026-10-30-1253
Front: release-3-2
Lane: fast (one product file plus one new test file, outside the critical zone, no exported interface changes)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: fast lane, the preliminary check goes inline in the log entry, max ten lines).

Worktree: `~/jjodel-w-jjtlpatch`, branch `jjtl-executor-patch`, created from `alfonso-frontend-jjtl` at the trunk commit whose subject starts
with `docs(prompts): P-2026-10-30-1315` (code identical to `a846e595a`).
`frontend/node_modules` is a symlink to `~/jjodel/frontend/node_modules` (P14), remove it at the end of the lane.
Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here. `git status` must show exactly
one modified file, `frontend/src/jjtl/executor/executor.ts` (Alfonso's patch, see below). Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-30-1315 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi)

Alfonso wrote a fix to the JjTL executor and it is already applied, uncommitted, in this worktree. The same diff is
saved at `~/.jjodel-lanes/jjtl_patch_2026-10-30.diff` (9 insertions, 3 deletions, `executor.ts` only).

The defect: inside an object created by a rule (typically inside a `forall`), an attribute mapping of the form
`-> feature { ... }` went through `executeObjectCreation`, the wrapper path. So `-> ops { forall s in ... -> Ref {...} }`
built an object typed `ops` with pluralized sub-lists instead of placing the created objects into the feature `ops`.
The fix (around `executor.ts:1994`) routes that case through `executeCreationMapping`, the same placement used at rule
level (one object, or one per element of each `forall`, into the feature), and threads `extraBindings` through
`executeCreationMapping` into `runForAll` and `executeObjectCreation`, so the variables of the enclosing `forall`
stay bound at any depth.

Measured by the chat: `executor.ts` is byte-identical between the trunk and the branch where the patch was written,
and the patch applies cleanly. `npm run typecheck` is clean with the patch. `npx vitest run src/jjtl` gives 150 passed
and 7 suites that do not collect (`ReferenceError: window is not defined`), identical on the trunk without the patch:
`abstract-target`, `ai-prompt-sanitization`, `circular-refs`, `executor-bridge`, `executor-llayer`, `forall-mapping`,
`source-alias`. Those are exactly the executor suites, so today nothing that runs covers this patch. That is the
reason for this lane.

The case that exposed the defect is a transformation from a confidential project. It must not enter the repo in any
form (names, metamodels, text). Use only the neutral fixture below.

## COSA

1. Preliminary check (inline, max ten lines in the log entry): find why the executor suites do not collect (which
   import chain reaches `window`), and decide how the new test loads the executor. Preferred: a
   `// @vitest-environment jsdom` docblock in the new test file, if `jsdom` is already a dependency. If the executor
   cannot be loaded in vitest by any per-file means, stop with `Outcome: question`, the import chain, and a proposal.
2. New test file `frontend/src/jjtl/__tests__/nested-feature-creation.test.ts` (check the name is free). Build the
   fixture the way the existing executor suites do (read `forall-mapping.test.ts` for the pattern):
   - source metamodel: `Team` (`name: String`, `members: Member[0..*]` containment), `Member` (`name: String`,
     `rank: Integer`);
   - target metamodel: `Plan` (`name: String`, `tasks: Task[0..*]` containment), `Task` (`name: String`,
     `deps: Link[0..*]` containment, `owner: Link[0..1]` containment), `Link` (`name: String`, `via: Link[0..1]`
     containment);
   - source model: one `Team` named `t` with members `a`, `b`, `c`, ranks 1, 2, 3;
   - transformation:

```
transformation Team2Plan
from Team
to Plan

Team -> Plan {
    name := name
    -> tasks {
        forall m in members -> Task {
            name := "task_" + m.name
            -> deps {
                forall o in members such that o.rank < m.rank -> Link {
                    name := m.name + "_after_" + o.name
                    -> via {
                        -> Link { name := "via_" + m.name }
                    }
                }
            }
            -> owner {
                -> Link { name := "own_" + m.name }
            }
        }
    }
}
```

3. Acceptance, one assertion each: three `Task`; `task_a.deps` empty; `task_c.deps` holds exactly two objects of type
   `Link` named `c_after_a` and `c_after_b`; each of them has `via` equal to one `Link` named `via_c`; every `Task` has
   `owner` equal to one `Link` named `own_<member name>`; no object of type `deps`, `via` or `owner` anywhere in the
   output; the executor reports zero warnings.
4. Prove the test discriminates: run it with the patch (green), then `git apply -R ~/.jjodel-lanes/jjtl_patch_2026-10-30.diff`,
   run it again (it must fail, report which assertions), then `git apply ~/.jjodel-lanes/jjtl_patch_2026-10-30.diff`
   and check `git diff -- frontend/src/jjtl/executor/executor.ts` matches the saved diff. Report the three runs in
   the log entry.
5. One code commit with the two files (`executor.ts` and the new test), pathspec after `--`. The fix is Alfonso's:
   say so in the commit body.

## HARD STOP

- After step 1, if the executor cannot be loaded in vitest per file.
- After step 4, if the test is green without the patch: the fixture does not reproduce the defect, report and stop.
- At the end: visual check due. Do not commit the log entry and the Status flip before the GO (RC-17).

## NON FARE

- Do not change `executor.ts` beyond Alfonso's diff. If you think the fix is wrong or incomplete, report it; do not
  amend it.
- Do not repair the seven suites that do not collect, and do not touch vitest config or setup files.
- No `git stash`, no whole-tree restore: the revert in step 4 goes through `git apply -R` on the saved diff only.
- No file outside `frontend/src/jjtl/`, except the log inbox and the prompt's Status line.

## Gate

`npm run typecheck` at baseline, `npx vitest run src/jjtl` (150 plus the new tests passed, the same 7 suites not
collected), `npm run build`.

## Visual checklist (for the chat, RC-23)

The chat starts a dev server from this worktree on a free port, imports Alfonso's local test project (outside the
repo) in the built-in browser, runs its transformation and checks that the nested `ops`, `op`, `left`, `right`
features hold typed objects, with no object typed after a feature name and no executor warning in the console.

## RIFERIMENTI

- `frontend/src/jjtl/executor/executor.ts:1817-1866` (`executeCreationMapping`), `:1994-2002` (the changed branch)
- `frontend/src/jjtl/__tests__/forall-mapping.test.ts` (fixture pattern)
- `~/.jjodel-lanes/jjtl_patch_2026-10-30.diff`
