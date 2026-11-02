# JjScript: a `forall` body acts on the element, not on its name

Prompt-ID: P-2026-11-02-2105
Chat: C-2026-11-02-1319
Front: maintenance
Status: da eseguire
Lane: full (executor resolution behind every command, two-phase in one session)
Depends: P-2026-11-02-2030 (merged, 43350d3cd is the base)
Worktree: ~/jjodel-w-jjsforallid, branch jjscript-forall-by-id (from 43350d3cd plus this prompt)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · Alfonso, 2026-11-02 20:48, see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjsforallid` on
`jjscript-forall-by-id`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2105 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

`executor/commands/forall.ts:79-82` replaces the iteration variable in the body with the element's NAME
(`resolveVariableInBody`), and the command then looks that name up. Two elements with one name in one namespace give
«ambiguous», so the case a two-variable forall exists for fails:

```
forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + "_dup"
```

Required: a variable used as a command's target denotes that element, for every command reached through
`resolveVariableInBody`, however many elements share its name. Elements reached from JjEL carry an identity: confirm
in discovery which one (`id`, a pointer, the L proxy) and how the commands' resolver can take it. Prefer one narrow channel
in the shared target resolution (a target that carries the resolved element beside its segments) over a change in each
command. A value in the collection that is not a model element (a string, a number) keeps today's behaviour. Unique names
keep today's behaviour and messages exactly. A body that names a member through the variable (`c.attr`) still works.
When the rename above runs on a pair, the two orders both match: after the first rename the names differ, so say in the
report what the second order does (the filter was evaluated before the loop) and test what happens; do not add a check.

Acceptance, tests in `frontend/src/jjscript/`: the duplicates example at M2 with two classes of one name in one package;
`delete` and `set` through the variable on a duplicate; M1 instances with one name; a qualified `c.attr` target;
strings in the collection; unique names unchanged; `allow`/deny of the permission guard applies to the element as before;
nested `forall`; undo as one step where the test home allows it, stating what is covered.

## DOVE

`frontend/src/jjscript/executor/commands/forall.ts`, `frontend/src/jjscript/types.ts` (`QualifiedName`: optional field
only), the shared target resolution of the commands (find it in discovery), `executor/permissionGuard.ts`,
`executor/effectsPlanner.ts` and `executor/executor.ts:375` if they read the target, the tests. Out of scope: JjEL, JjTL, the
parser unless a test shows a need, the critical zone (`useJjomSync.ts`, `canvasToJjom.ts`).

Stop with `Outcome: question` and a `Recommended:` line if the fix needs a critical-zone file, or an exported type read
outside `frontend/src/jjscript/` must change incompatibly, or if more than the shared resolution plus three commands must
change.

## COME

Phase 1, read-only: a probe reproducing «ambiguous» on the example; the resolver and every command's path through it; which
commands bypass it. Save `docs/discovery/discovery_2026-11-02_jjscript_forall_element_by_id.md` (objective, files read with
full paths, findings, risks, open questions), commit it alone, continue into Phase 2 unless a stop applies.

Phase 2: tests first. Gates from `frontend/` through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`,
`npx vitest run src/jjscript src/jjel`, `npm run build`, `npm run check:docs`. Never paste a long log. Verifica visiva non
applicabile; the chat runs it on 3001 after the merge.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-11-02-2105)`. Log
entry in `docs/log-inbox/maintenance.md`. Replace the Status line with date, lane, branch and sha in the same docs-only
commit as the entry. No push, no merge into the trunk. Report closes with «Decisions taken (unattended)» and «Decisions
awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
