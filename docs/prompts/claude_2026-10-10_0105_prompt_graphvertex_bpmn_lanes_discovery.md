# graphVertex for OMG-faithful BPMN pools and lanes: Phase 1 discovery

Prompt-ID: P-2026-10-10-0105
Chat: C-2026-10-10-0057
Lane: full (IR schema extension; Phase 2 will touch canvas sync and the critical zone)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-graphvertex`, branch `ir-graphvertex`, created from the trunk commit that adds this
file. Before anything else: `pwd` is the worktree, the branch is `ir-graphvertex`, `git status` is clean,
and `git log -1 --format=%H` equals `git log -1 --format=%H -- docs/prompts/claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`.
Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0105 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the project chat flips it.

## Context (do not redo the analysis)

So far the concrete syntax has been authored with three node kinds in practice: vertex, row and edge.
Alfonso now wants the container kind, `graphVertex`: a vertex that holds other nodes inside it. The
benchmark is BPMN pools and lanes, and he chose the **most expressive case**: BPMN faithful to the OMG
BPMN 2.0 metamodel, not a teaching simplification.

That choice matters because in OMG BPMN visual containment and model containment do not coincide:

- `Process.flowElements` contains the flow nodes and sequence flows.
- `Process.laneSets` contains `LaneSet`, whose `lanes` contains `Lane`; a lane can nest a `childLaneSet`.
- `Lane.flowNodeRefs` **references** the flow nodes it holds. It is a non-containment reference.
- A pool is a `Participant` in a `Collaboration`; it points to its process through `processRef`
  (non-containment). Message flows live in the collaboration and connect participants or their nodes.

So the nodes drawn inside a lane are reached through a non-containment reference, a node may be claimed by
two lanes or by none, and dragging a task from lane A to lane B is an edit of two `flowNodeRefs` lists,
not a move of the object.

What the chat already knows, to be verified in the code, not assumed:

- `graphVertex` is in the IR schema since v1.1 (`docs/spec/spec_2026-06-08_ir_schema_v1_1.md`),
  kept in v1.2 (`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`, §7 for lift-to-ancestor and
  collapse) and named by the FormSpec addendum (`docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`).
- A chat of 2026-08-14 simulated BPMN on the kind taxonomy and found: no authoring panel for graphVertex
  (console only), no seed in the picker, `layout.mode: 'horizontal'` only best effort, lane label rotated
  on the left side not expressible in `LabelSpec`, boundary events out of scope (a bordered-node
  capability, not a kind). Three decisions were raised and, as far as the chat knows, never ratified:
  D-a (seed shape), D-b (one adaptive view or two views for the simple/composite duality), D-c
  (disjunction between the containment channel and row compartments when both claim the same children).
- The size-from-content contract lives in `shapeRegistry.ts` (`contentRect`, `boxForContent`,
  `boxForContentNumeric`, `boxFromIntrinsic`, `hasSizeSupplement`) with the single consumer
  `viewpoint/ir/useContentSize.ts`; `isResized` is the only marker of a human-chosen size and wins.
- Automatic layout uses ELK; Alfonso believes it is misconfigured rather than inadequate.

The chat's working hypothesis, which this discovery must try to **falsify**:

> To express OMG-faithful pools and lanes, the IR needs four additive capabilities on `graphVertex`,
> orthogonal to each other: (1) a **children channel** given by an arbitrary PathExpr, containment or
> not, with a rule for a single visual parent; (2) an **arrangement** beyond free placement (stacked
> partitions that fill the container, with a side label); (3) a declared **membership edit** semantics
> (what dragging across a container boundary does to the model: reparent through containment, edit a
> reference, or forbidden); (4) a **container size** rule that composes with `contentRect` and
> `isResized`. The read-only rendering of (1) and (2) needs no change in the critical zone; (3) does.

## COSA

A read-only discovery. Produce one report, nothing else. Sections A to I below are the report's
skeleton; every finding carries `file:line` and a verbatim quote.

**A. State of graphVertex today.** The `graphVertex` kind in `irTypes.ts` and every capability it can
carry (containment, `childFilter`, `layout.mode`, `collapsible`, `collapsed.*`, `fieldCompartments`,
`formSpec`). Where the interpreter resolves and renders it, and how children become React Flow nodes
(`parentId`, `extent`, coordinate frame). Whether an authoring panel, a seed, `irValidate` rules and
tests exist. `git log --format='%h %ad %s' --date=short -S graphVertex` on the trunk since 2026-08-14,
to list what landed after the BPMN simulation. Whether any derived viewpoint (`Derive viewpoint`
notations, statechart composite states in particular) emits a graphVertex.

**B. Children channel.** How children are selected today (containment only, or a PathExpr). What happens
when a node is reachable from two containers, and when it is reachable from none. Whether a node that
is a child of a container is also rendered at top level, and what suppresses it (compare with row
dispatch suppression, `docs/spec/claude_spec_2026-07-25_ir_row_dispatch_addendum.md`). Whether D-c
was ever settled anywhere (`docs/decisions.md`, `docs/ratifiche/`, `docs/discovery/`).

**C. Arrangement.** Every value of `layout.mode` and what the code does with it. ELK configuration for
nested graphs (`hierarchyHandling`, partitioning options, where the options are set). Per-viewpoint
layout storage (R-LAY series) and how a nested node's position is persisted: relative to the parent or
absolute. `LabelSpec` positions and the gap for a rotated side label.

**D. Membership edit.** What dragging a node into, out of, or across a container does today, step by
step, through the canvas-to-model path. Which critical-zone files would have to change for each of the
three semantics in the hypothesis (reparent through containment, edit a non-containment reference,
forbid). Write a **draft Layer Impact Report** for that change (CLAUDE.md §3), as a read-only
assessment: no edit. Include the TRANSACTION rules (§3.3-3.5) and the canvas edge pair guard where
they apply.

**E. Container size.** How a container's box is computed today with children inside (hull or
otherwise), and how that composes with `contentRect`, `useContentSize` and `isResized`. What a lane
needs: fill the pool's width, lanes share the pool's height, resizing a lane moves the border with its
neighbour.

**F. Edges across boundaries.** Sequence flows between nodes in different lanes, message flows between
pools or between nodes of different pools. Confirm or refute that lift-to-ancestor fires only on a
collapsed container. Whether `portDistribution.ts` and `handlePosition.ts` see nested nodes in the
right coordinate frame.

**G. The hand-written IR.** This is the main deliverable. Check whether a BPMN metamodel already exists
in the repo (seeds, examples, fixtures). Then, in the report only, write:

1. A minimal OMG-faithful metamodel fragment as a table (metaclass, features, containment yes/no):
   `Collaboration`, `Participant` (`processRef`), `MessageFlow`, `Process` (`flowElements`,
   `laneSets`), `LaneSet` (`lanes`), `Lane` (`flowNodeRefs`, `childLaneSet`), `FlowNode` with `Task`,
   `StartEvent`, `EndEvent`, `ExclusiveGateway`, and `SequenceFlow` (`sourceRef`, `targetRef`).
2. The complete IR, as JSON in the report, for the views Pool (on `Participant`), Lane, Task,
   StartEvent, ExclusiveGateway, SequenceFlow and MessageFlow, written **as if the authoring panel
   existed**, using only the current schema wherever it suffices.
3. For every field the current schema lacks, a proposed **additive** extension: name, type, default
   when absent, what `irValidate` checks, and whether it needs a schema version bump and a VersionFixer
   migration (the chat expects none, since absent fields keep today's behaviour; confirm or refute).

**H. The four capabilities against the evidence.** For each of the four capabilities in the hypothesis:
confirmed, refuted, or reshaped, with the evidence. Name anything the hypothesis missed. Boundary
events stay out of scope; say so in one line.

**I. Phase 2 plan.** Slices in order, each with its file set, whether it touches the critical zone,
which slices can run in parallel (disjoint file sets, RC-22), and for each visual slice the three
points of `template-task-visivi` (what is seen now, with numbers; what it must become; one mechanical
acceptance criterion). Close with the two lists of RC-26: «Decisions taken (unattended)», each with its
recommendation and reason, and «Decisions awaiting Alfonso» (critical zone, exported interfaces,
amendments to a ratified R-, deletions). D-a, D-b and D-c belong in one of the two lists.

## Report

Path and name, mandatory: `docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md`. Content per
P4: the hypothesis being falsified, the objective, the files read with full paths, findings with
`file:line` and verbatim quotes, dependencies and risks, open questions. The hard stop is not reached
until the file is written; if a report already exists at that path, follow R-E/E-1 (read it, append an
addendum).

Write the log entry with the `log-entry` skill into `docs/log-inbox/ir-graphvertex.md`. Commit the
report and the inbox entry together, docs only, with an explicit pathspec, conventional subject
`docs(discovery): graphVertex for OMG-faithful BPMN lanes`, and the `Model:` trailer (P6).

## HARD STOP

After the docs commit, stop and exit with `Outcome: hard-stop`. Phase 2 comes as a new message in this
same session after the chat has read the report.

## NON FARE

- No edit to any source file, test, spec, `docs/decisions.md` or `CLAUDE.md`. The only files written are
  the report and the inbox entry.
- No code-level prototype of the BPMN metamodel or the IR; both live in the report as tables and JSON.
- No assertion of absence without the search that supports it and a positive control in the same
  invocation, with quoted globs (R-RAIL-28, R-RAIL-31).
- No `git stash`, no `git add .`, no push.
- Do not touch the `Status` line of this prompt.

## RIFERIMENTI

- `CLAUDE.md` §3 (critical zone, Layer Impact Report), §21 (log entry).
- `docs/PROTOCOL.md` P4 (discovery report), P13 (lanes), P16 (orchestrated lanes).
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` §5, §7, §9, §10, §11.
- `docs/spec/spec_2026-06-08_ir_schema_v1_1.md` (graphVertex as introduced; lowering sections).
- `docs/spec/claude_spec_2026-07-25_ir_row_dispatch_addendum.md`, `..._2026-07-26_ir_edge_authoring_addendum.md`,
  `..._2026-08-28_ir_formspec_addendum.md`.
- Size contract: `docs/ratifiche/claude_2026-08-15_memo_contratto_contentrect_nel_registry.md`,
  `docs/discovery/discovery_2026-08-15_cablaggio_taglia_da_contenuto.md`.
- Template IR authoring (Project Knowledge): explore `editor-v2/problems/`, `useJjomSync.ts` Step 3/4,
  `useM1ReferenceEdges.ts`, `syncState.ts`, `portDistribution.ts`, `handlePosition.ts` before concluding.
