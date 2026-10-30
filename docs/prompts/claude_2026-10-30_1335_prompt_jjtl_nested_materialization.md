# JjTL in the app: nested creations are materialized one level deep only

Prompt-ID: P-2026-10-30-1335
Chat: C-2026-10-30-1253
Front: release-3-2
Lane: full (D-layer write path in `ProjectEditor.tsx`, STEP 6 TRANSACTION rule of CLAUDE.md §3.3)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjtlmat`, branch `jjtl-nested-materialization`, created from `alfonso-frontend-jjtl` at the trunk
commit whose subject starts with `docs(prompts): P-2026-10-30-1335`. That trunk already contains the executor fix of
P-2026-10-30-1315 (`afcecce4d`, nested `-> feature { ... }` placed into the feature, enclosing forall variables bound).
`frontend/node_modules` is a symlink to `~/jjodel/frontend/node_modules` (P14), remove it at the end of the lane.
Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here (clean tree). Otherwise stop.

Critical zone: Alfonso gave the go-ahead (2026-10-30 13:28) for the write path of STEP 6c in
`handleExecuteTransformation`. The go-ahead covers Phase 2 only after the Phase 1 report and its Layer Impact Report
are written and the chat has answered the hard stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-30-1335 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi del sintomo)

A transformation that builds expression trees (root > first-level children > trees up to six levels deep) produces
the complete trees when the executor runs alone in node (vitest). Run in the app, the output model holds every root
object and every first-level child with the right attributes, and nothing below: the features of the first-level
children that should hold created objects are empty in the model editor. No error is shown.

Hypothesis from the chat, to be confirmed in Phase 1 (line numbers checked on the trunk on 2026-10-30):

1. `frontend/src/components/project/ProjectEditor.tsx`, `handleExecuteTransformation`: the collection step
   (around 1810-1860, `pendingNestedCreations.push` at 1857) records nested creations only for the `__nested`
   values found on the instances it iterates, i.e. the root instances.
2. STEP 6c (1965-2045) resolves each parent BY NAME among `lModel.objects`, calls `slot.addObject({ name }, className)`
   for each child, queues the child's attributes (map at 1662, applied at 2138), and stops. The child's own
   `__nested` features are never visited, so every creation at depth 2 or more is dropped silently.

The case that exposed the defect comes from a confidential project. It must not enter the repo in any form (names,
metamodels, text). Tests and probes use only the neutral fixture below; the chat runs the real case by hand.

## COSA, Phase 1 (read-only)

1. Confirm or refute points 1 and 2 with `file:line` and verbatim quotes.
2. Measure, not infer: after `slot.addObject(...)` returns inside STEP 6c, is the created child's `$<feature>` slot
   available synchronously, and does it accept a further `addObject`? A probe in the browser (pattern of
   `frontend/scripts/probe/`) or a vitest with the real store, whichever loads; say which and why.
3. Layer Impact Report (CLAUDE.md §3) for the change below: layers touched, TRANSACTION boundaries, deferred timers,
   undo grouping of a transformation run, what happens to an existing output model on re-run.
4. Test strategy for Phase 2: where a three-level materialization test can run (vitest with the store, or a probe),
   given that the executor suites need `vi.mock('../../joiner')` to load.
5. Write the report at `docs/discovery/discovery_2026-10-30_jjtl_nested_materialization.md` (P4: hypothesis, files
   read, findings with file:line, risks, open questions, each with `Recommended:`), the LIR next to the other LIRs
   with the same naming pattern, commit both (docs only), then HARD STOP with `Outcome: hard-stop`.

## COSA, Phase 2 (after the chat's answer)

1. Materialize nested creations recursively, to any depth: after `addObject` returns the created child, process that
   child's `__nested` features the same way, against the created object.
2. Below the first level, address parents by the id `addObject` returned, never by name: names are not unique inside
   trees (a dozen siblings may share a name) and some classes have no name at all. Name resolution at the root keeps
   its current ambiguity rule (R-S1-5).
3. Keep the constraints already in the code: `addObject` outside the STEP 6 TRANSACTION (§3.3), attributes written on
   the deferred timer. If Phase 1 found the child slots not available synchronously, implement the deferral chosen at
   the hard stop; no depth may be dropped without a warning.
4. Any object that cannot be placed is reported in the transformation output panel (count and path), not only in the
   browser console.
5. Test (neutral fixture): root > child > grandchild > great-grandchild, two siblings sharing a name at depth 3, one
   class with no `name` attribute at depth 2; assert the full tree and the attributes at every depth; prove it fails
   without the Phase 2 change (revert by `git apply -R` of a saved diff, never stash). Existing JjTL and
   ProjectEditor tests stay green.
6. One code commit, pathspec after `--`.

## HARD STOP

- End of Phase 1 (report and LIR committed).
- If Phase 1 refutes the hypothesis: stop with `Outcome: question` and what you found; do not fix something else.
- End of Phase 2: visual check due. Do not commit the log entry and the Status flip before the GO (RC-17).

## NON FARE

- Do not touch `frontend/src/jjtl/executor/` (the executor output is correct; this lane is about materialization).
- No change to the root-level name resolution or to R-S1-5.
- No refactoring of `handleExecuteTransformation` beyond STEP 6c and the collection step it needs.
- No `git stash`, no whole-tree restore.

## Gate

`npm run typecheck` at baseline, `npx vitest run` on the touched suites plus `src/jjtl`, `npm run build`.

## Visual checklist (for the chat, RC-23)

The chat starts a dev server from this worktree on a free port, imports Alfonso's local case (outside the repo) in
the built-in browser, runs the transformation and compares the output model with the node output object by object:
every created object present at every depth, with its attributes, and nothing reported as unplaced.

## RIFERIMENTI

- `frontend/src/components/project/ProjectEditor.tsx:1653-1662`, `:1810-1860`, `:1965-2045`, `:2138`
- CLAUDE.md §3.3 (TRANSACTION), §3 (Layer Impact Report)
- `frontend/src/jjtl/__tests__/nested-feature-creation.test.ts` (fixture style and the `joiner` mock)
