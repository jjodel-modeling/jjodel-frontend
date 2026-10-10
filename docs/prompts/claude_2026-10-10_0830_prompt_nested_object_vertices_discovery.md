# Vertices for nested objects (father = DValue): Phase 1 discovery

Prompt-ID: P-2026-10-10-0830
Chat: C-2026-10-10-0057
Lane: full (sync layer, `useJjomSync.ts` Step 2bis: critical zone)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-nestedvtx`, branch `nested-vertices`, created from the trunk commit that adds this file.
Before anything else, check four things: `pwd` is the worktree, the branch is `nested-vertices`, `git status` is clean, and
`git log -1 --format=%H` equals `git log -1 --format=%H -- docs/prompts/claude_2026-10-10_0830_prompt_nested_object_vertices_discovery.md`.
Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0830 · session <id>]`. Every final message ends with
`Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt.

## Context (do not redo the analysis)

The graphVertex discovery (`docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md` §B7, on branch
`ir-graphvertex`, commit `f17ca6da8`; read it with `git show f17ca6da8:<path>`) found this. Objects nested by
containment with `father = DValue` get no DVertex, because `useJjomSync.ts` Step 2bis
(`:736-743`) iterates only `DModel.objects`, and so do Step 4 and `useM1ReferenceEdges`. Two producers create the
nested form: XMI import (`XMIService.ts:1067`) and JjScript `create ... in` (`instance.ts:517`). The Data
Manager path gives its nested child a vertex explicitly (`createAdapter.ts:465`). The canvas creates roots only
(`canvasToJjom.ts:1515`). Consequence: an imported containment-heavy model (an OMG BPMN, but equally any
.xmi with nested objects) draws only its roots. Alfonso ratified on 2026-10-10 that this is fixed only after a
discovery of its own, because it changes what every existing M1 canvas with nested objects shows.

Hypothesis to falsify:

> Walking the composition tree from `DModel.objects` in Step 2bis, and giving every reached object a DVertex,
> fixes the defect. The rest of the sync then works unchanged: Step 4, `useM1ReferenceEdges`, `m1EdgeGate.ts`,
> per-viewpoint layout and the IR containment model. The only new risks are where the new vertices are placed and
> the one-time appearance of many nodes in existing projects.

## COSA

A read-only discovery that produces one report. Every finding carries `file:line` and a verbatim quote.

**A. Where the nested form arises.** List every producer of `father = DValue` objects: XMI import, JjScript,
Data Manager, JjTL output, paste, VersionFixer, backend load. For each one, record whether it also creates a
DVertex. Check whether `DModel.objects` is ever meant to hold nested objects, and what the D-layer invariant is.

**B. Every consumer that assumes roots.** List every iteration over `DModel.objects` (or an equivalent) in sync,
hooks, IR, layout, export and the Data Manager, and what each would do if nested objects gained vertices. Cover
Step 2bis, Step 3 and Step 4 of `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `m1EdgeGate.ts`, `syncState.ts`
(canvas edge pair guard), `irContainment.ts` (the nested-form comment at `:78-83`), ELK and `vertexLayout.ts`.

**C. Composition edges.** Today a composition between two roots is drawn as an edge. What would be drawn for a
nested object: a composition edge from its father's owner, a hull, or nothing. Check how that interacts with the
IR containment channel and with lift-to-ancestor.

**D. Placement.** Where a newly created vertex for an existing nested object would land: default coordinates,
any auto-place, per-viewpoint records (R-LAY-14). Determine whether a mass first appearance should go through ELK.

**E. Exposure.** Which shipped examples, seeds, fixtures, test projects and demo projects contain nested
objects, and how many per project. Find the repo-side evidence (examples, seeds, `docs/`, tests). If a project
store can only be measured at runtime, state that it was not measured. List the MODELS demo projects if
identifiable. The demo is over, so this is about users' existing projects.

**F. Draft Layer Impact Report** (CLAUDE.md §3, read-only assessment) for the Step 2bis change. Include the
TRANSACTION rules (§3.3-3.5), the M1 edge pair guard, the auto-populate dependency list (§3.5: do not add M1
value counters), and an idempotence argument: re-running Step 2bis must not duplicate vertices.

**G. Verdict and Phase 2 plan.** State whether the hypothesis is confirmed, refuted or reshaped. Give a slice plan
with file sets, critical-zone status and one mechanical acceptance criterion per slice (for example: import a
given .xmi, count `.react-flow__node` before and after). Close with the RC-26 lists «Decisions taken
(unattended)» and «Decisions awaiting Alfonso». Opt-in versus automatic appearance for existing projects belongs
in the second list.

## Report

Path and name, mandatory: `docs/discovery/discovery_2026-10-10_nested_object_vertices.md`. Content per P4, with
a `## 0. Answer in brief` section first (P16). Write the log entry with the `log-entry` skill into
`docs/log-inbox/nested-vertices.md`. Commit the report and the inbox entry together, docs only, with an explicit
pathspec, subject `docs(discovery): vertices for nested objects`, and the `Model:` trailer (P6).

## HARD STOP

After the docs commit, stop with `Outcome: hard-stop`.

## NON FARE

- Edit no source file, test, spec, `docs/decisions.md` or `CLAUDE.md`.
- Assert no absence without the supporting search and a positive control in the same invocation, with quoted
  globs (R-RAIL-28, R-RAIL-31).
- No `git stash`, no `git add .`, no push. Do not touch the `Status` line.
- Stay off the graphVertex work running in parallel on `ir-graphvertex` (P-2026-10-10-0105, files under
  `viewpoint/ir/`).

## RIFERIMENTI

- `CLAUDE.md` §3 (critical zone, LIR), §21 (log entry). `docs/PROTOCOL.md` P4, P13, P16.
- `docs/decisions.md`: R-LAY series, R-B13..R-B16, RC-30.
- The graphVertex report above, §B7, §D4, §F1.
