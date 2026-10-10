# log-inbox — lane «ir-graphvertex»

Entries written by the ir-graphvertex lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — docs(discovery): graphVertex for OMG-faithful BPMN lanes (P-2026-10-10-0105)
**Prompt**: `claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`, full lane, Phase 1 read-only on `~/jjodel-w-graphvertex` (branch `ir-graphvertex`): falsify the four-capability hypothesis for graphVertex (children channel, arrangement, membership edit, container size), hand-write the OMG BPMN metamodel fragment and its IR, plan Phase 2.
**Files touched**: `docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md` (new), this inbox file (new); both in this commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Hypothesis reshaped: hull not container; nested objects get no vertex; channel edges drawn; PathExpr cannot fan out; creation owner missing. A draft LIR for the membership slice is in the report §D6 (read-only, no edit). All claims read, none measured. Four helper agents stalled or failed with no output; their topics were read in session. Report and entry in one commit, as the prompt asks (the skills say separate commits).
**Prompt document name**: 2026-10-10 01:05

## 2026-10-10 — feat(ir): graphVertex containment keys, spec addendum and R-GV rows, S0 and S1 (P-2026-10-10-0105)
**Prompt**: Phase 2 GO of `claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md` in the same session, slices S0 and S1 of the report §I, non-visual, after Alfonso's «ratifico tutto» (2026-10-10 08:27): spec addendum and R-GV series; then schema, compile, validate, channel resolution, single visual parent and partition geometry in `viewpoint/ir/`, pure code, hard stop after S1.
**Files touched**: S0 `b7d131729`: `docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md` (new), `docs/decisions.md` (R-GV-1..14, 72 lines added). S1 `c64b9bfaf`: `frontend/src/components/editor-v2/viewpoint/ir/` `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irContainment.ts`, `irPartitions.ts` (new), `__tests__/ir.test.ts`, `__tests__/irValidate.test.ts`, `__tests__/irPartitions.test.ts` (new). This commit: this inbox entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (ten files over two commits, above five (rule 19), each named by the GO's COSA and DOVE)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates: tsc 14 = baseline; viewpoint/ir 49 files 1103 tests; full suite 7722 pass, only the 9 known import failures; build exit 0. Invariant test green before the change. Bench 43 mutants: 38 then 43 killed (5 survivors, one test each). LIR not required: §3.2 lists none of these files. Correction: `LValue.setValueAtPosition` auto-moves, a reparent primitive the Phase 1 §D4 missed; recorded in R-GV-8 and spec §6.
**Prompt document name**: 2026-10-10 01:05

## 2026-10-10 — feat(ir): graphVertex partitions, header bands and channel edges rendered, S2 (P-2026-10-10-0105)
**Prompt**: Phase 2 GO of `claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`, slice S2 (visual): BPMN fixture as oracle, partitions applied in the presentation pass, header band and vertical label, channel-edge suppression, D-c rows win, graphVertex `visible`, black-box pool, channel-slot memo signature, containment problems; measurements before/after, hard stop.
**Files touched**: `6e22f4a9b` (13): `viewpoint/ir/` irContainment, useIRContainment, IRContainmentHulls, IRNodeContent, irStyle; `nodes/ObjectNode.tsx`; `problems/` registry, containmentToProblems (new); tests ir, shapeRegistry, irContainerLayout (new), irHeaderBandRender (new), containmentToProblems (new). `b7e061436`: `frontend/scripts/probe/bpmn-lanes-fixture.ts` (new). This commit: `docs/discovery/assets/graphvertex-s2/` and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (fourteen code files over two commits, above five (rule 19), each in the GO's DOVE; no CLAUDE.md §3.2 file, no EditorV2.tsx)
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Probe 2/12 before (pre-S2 tree), 12/12 after; hull scenes byte-identical. Gates: tsc 14 = baseline; full suite 7760 pass, 9 known import failures; build 0. Bench 31 mutants: 23/26 then 30/31, E3 equivalent. Spec §5 says the won claim; code hides every claim's channel edge (decision, amendment owed). Lanes dragged by hand snap back; tasks do not follow a pool drag (S3). Correction from P-2026-10-10-0830 noted in chat.
**Prompt document name**: 2026-10-10 01:05

## 2026-10-10 — feat(editor-v2): graphVertex gestures and membership, S3 (P-2026-10-10-0105)
**Prompt**: `claude_2026-10-10_0105_fase2_graphvertex_s3.md`, Phase 2 GO slice S3: LIR first, then membership on drag end (none, forbid, reference, reparent), pool drag carrying its descendants, paired lane resize, creation owner for the palette drop and the connect gesture; BPMN fixture criteria measured on port 3071, light theme; gates, mutation bench, hard stop.
**Files touched**: `d08cf5665`: `docs/lir/lir_2026-10-10_graphvertex_s3.md` (new). `ab22e962a` (5): `viewpoint/ir/` irMembership (new), irContainment; tests irMembership (new), irContainerLayout, ir. `38e7a6006`: `EditorV2.tsx`. `d174cf607`: `frontend/scripts/probe/bpmn-lanes-fixture.ts`. `aa6d4b670`: the LIR §4, `docs/discovery/assets/graphvertex-s3/` (10 files). This commit: this inbox file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes (every file is in the GO's DOVE, seven code files over three commits, above five; but EditorV2 also gains, outside the three named regions, the imports, a containment ref and the slot-write helper next to useIRContainment)
**Layer Impact Report**: produced
**Smoke visivo**: passato
**Notes**: Probe 7/13 before (pre-S3 tree), 13/13 after; hull control scenes unchanged. tsc 14 = baseline; editor-v2 3575; full 7852, 9 known import failures; build 0. Bench 37 mutants: 34 then 37 killed; S2 edge mutants 7/8, E3 equivalent. LIR §4: removal by value, replay-safe drag-end updaters, stale channel edges dropped (narrows R-GV-4, decision owed). Regressions unknown: the replay-safe change covers every canvas drag end, only BPMN and hull measured.
**Prompt document name**: 2026-10-10 01:05

**Ticket** (lane, decision owed): a selected layout container covers its own lanes. React Flow lifts a selected node by 1000 (elevateNodesOnSelect), so after a pool is clicked or dragged its lanes sit under it until it is deselected: a click on a lane selects the pool (measured on the S3 fixture after the pool drag; the fixture now clicks the pane first). Options: elevateNodesOnSelect off on the canvas, or children of a layout container lifted with it.

## 2026-10-10 — ticket: useJjomSync keeps the RF edge of a deleted M1 reference edge
**Ticket**: after a slot edit, useM1ReferenceEdges deletes the stale DVoidEdge (delete-only TRANSACTION, gone from the graph's subElements), but the React Flow edge stays in the canvas state (measured 4.5 s later, BPMN fixture, lane-to-lane move of Ship). The incremental removal of useJjomSync, keyed on rfEdgeCache, does not drop it. Each round trip adds one; hidden or not, they take handle slots. S3 drops them in its presentation pass for declared channels only (LIR §4.3).
**Priority**: medium
**Found in**: P-2026-10-10-0105
**Detail**: docs/lir/lir_2026-10-10_graphvertex_s3.md

## 2026-10-10 — ticket: a state updater replayed by React loops the canvas to the update depth limit
**Ticket**: EditorV2 subscribes to React Flow's nodes (useAutoAnchor's useNodes), and the object-as-edge synthesis returns a new node array on every presentation pass. When an update of lower priority waits in the edges queue (useJjomSync's patch flushed in a frame), React replays the later updaters on each render; one that builds new arrays makes new edges, new nodes, StoreUpdater.setNodes, a synchronous re-render, and so on: 52 replays, then "Maximum update depth exceeded". S3 made its two drag-end updaters replay-safe; the amplifier stays.
**Priority**: medium
**Found in**: P-2026-10-10-0105
**Detail**: docs/lir/lir_2026-10-10_graphvertex_s3.md

## 2026-10-10 — ticket: under the pointer the target ghost handle covers the source ghost
**Ticket**: DynamicHandles draws the target and source ghost of a free slot at the same point. elementFromPoint returns the source ghost before the pointer reaches it and the target ghost once it hovers there; a target handle cannot start a connection (isConnectableStart false), so a press on a free side's ghost started no connection in the S3 fixture until the mousedown was dispatched on the source ghost. Not yet tried by hand.
**Priority**: low
**Found in**: P-2026-10-10-0105
**Detail**: frontend/scripts/probe/bpmn-lanes-fixture.ts

## 2026-10-10 — feat(ir): graphVertex self-framing containers for UML statecharts, S2b (P-2026-10-10-0105)
**Prompt**: Phase 2 GO slice S2b (chat C-2026-10-10-0057; no prompt file under `docs/prompts/` at the time), visual: `containment.layout.frame: 'self'` (a composite state as the box of its substates) and `separator: 'dashed'` (orthogonal regions), a UML statechart fixture on its own port in the light theme, a new addendum section and one R-GV row; BPMN S2/S3 and the S1 hull scenes kept; gates, frame-geometry bench, hard stop.
**Files touched**: `d2f169781` (12): `viewpoint/ir/` irTypes, irCompile, irValidate, irFrame (new), irContainment, useIRContainment, irStyle; tests irFrame (new), irContainerLayout, ir, irValidate, shapeRegistry. `7b0aa3a46`: `frontend/scripts/probe/statechart-fixture.ts` (new). `3858e8cf2`: spec addendum §11, `docs/decisions.md` R-GV-15, `docs/discovery/assets/graphvertex-s2b/` (9 files). This commit: this inbox file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes (`irContainment.ts` is not in the GO's DOVE: the layout pass `useIRContainment` calls lives there, and frames, drag offsets and the selection rule needed it; twelve code files in one commit, above five)
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Statechart 3/7 before (pre-S2b tree), 7/7 after; BPMN S2+S3 25/25 and hull scenes byte-identical on the S2b tree. tsc 14 = baseline; editor-v2 3599; full 7876, 9 known import failures; build 0. Bench 31 mutants, all killed after tests for C6, C7. Fixed in-lane: a collapsed frame jumped to its record; a selected composite hid its regions, and that fix then hid a lane's resize line (S3-7). Regressions unknown: the lift and selection rules reach derived viewpoints, unmeasured.
**Prompt document name**: 2026-10-10 01:05

**Ticket** (lane): the collapse chip of a layout container lies under the edges. The container's z-index is below them, so an edge crossing the chip takes the pointer (measured on the statechart fixture: Running's chip is covered by a transition's 20 px interaction path; the fixture dispatches the click). Options: draw the chip in the header band, or lift the chip out of the node.

## 2026-10-10 — ticket: an IR view cannot hide a reference edge, nor a predicate reach an object's owner
**Ticket**: to tell a region of a two-region state from the only region of a state, the statechart fixture adds UML's `Region.state` and tests `$state.value.$regions.values[1]`: a predicate has no way to climb to the owner (`father`), and the edge that back-reference draws can only be styled clear (`line.color: transparent`), since an edge view has no `visible`. Either key would remove the workaround.
**Priority**: low
**Found in**: P-2026-10-10-0105
**Detail**: docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md
