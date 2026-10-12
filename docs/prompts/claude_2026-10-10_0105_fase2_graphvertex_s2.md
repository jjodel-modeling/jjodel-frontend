[P-2026-10-10-0105] Phase 2 GO: slice S2 (render). Visual. Hard stop after S2 with measurements.

Prompt-ID: P-2026-10-10-0105
Chat: C-2026-10-10-0057
Lane: full (§3.1 zone `viewpoint/ir/` and `nodes/`, go-ahead granted 2026-10-10)

## Accepted from S0/S1

Commits `b7d131729`, `c64b9bfaf` and `1f02e06f7` are accepted. So are your ten unattended decisions, including `membership.create` only with `reference`, the shortest-claim-path definition of «innermost», and `warnings` on a successful validation. Your correction on the reparent primitive (`LValue.setValueAtPosition`) also stands.

The parallel discovery P-2026-10-10-0830 (branch `nested-vertices`, commit `6b13fbd8c`) corrects §B7 of your Phase 1 report. XMI import lists every nested child in `DModel.objects` as well as in its slot (`XMIService.ts:1074`). An imported BPMN therefore gets a vertex for every element. Vertex-less nested objects come only from JjScript `create … in`, JjTL nested write-back and graph-less Data Manager creates. S2's scope does not change. Do not edit the Phase 1 report; mention the correction in your closing message.

## COSA

**Fixture.** Write `frontend/scripts/probe/bpmn-lanes-fixture.ts`, runnable with `lane-run probe`. It builds the §G1 metamodel, the §G2 viewpoint and the §I model in root form:

- pool `Customer` with no lanes and 2 tasks;
- pool `Shop` with lane `Sales` (StartEvent, Task `Check order`, ExclusiveGateway) and lane `Warehouse` (Task `Ship`, EndEvent);
- 4 SequenceFlows and 1 MessageFlow;
- one extra black-box Participant without `processRef`.

Place each flow node inside its lane's computed box. The fixture is the S2 oracle and the S3 starting point.

**Render** (presentation pass only; nothing reaches the D-layer):

- Partitions. For a graphVertex with `layout.mode: 'partitions'`, compute the partition boxes with `irPartitions.ts` from the container's box. Apply them to the partition children's RF nodes in the presentation pass. Derived boxes stay in session (R-LAY-4). An `isResized` lane keeps its stored size.
- Header band. Draw the header band on the declared side, with the `header` label and `orientation: 'vertical'`. A `header` label without a band falls back to `top` (spec §2.3).
- Channel edges. Suppress them when `containment.edges: 'hide'`: no Lane→Task edge is drawn. Do it in the same pass that already hides row and collapsed children, never by removing ids.
- D-c. When a row compartment and the containment channel claim the same child, the row wins.
- graphVertex `visible: false` is honoured.
- Black-box pool. A pool without `processRef` draws as a thin band, height ≤ 48 px, full container width. This was ratified as open question 2.
- Memo signature. `useIRContainment` adds the slot ids a non-composition channel reads, so a membership edit re-renders.
- Problems. Multiply-claimed and unclaimed objects are listed in `problems/` with their claimants.

Drag behaviour does not change in S2 (that is S3). A lane dragged by hand may drift until S3; say so in the report.

## DOVE

`viewpoint/ir/`: `useIRContainment.ts`, `IRContainmentHulls.tsx` (or a sibling `IRPartitions.tsx`), `IRNodeContent.tsx`, `irStyle.ts`, `irContainment.ts` if needed, and their tests. Also `nodes/ObjectNode.tsx`, the `problems/` files that host IR diagnostics, and `frontend/scripts/probe/bpmn-lanes-fixture.ts` (new).

`EditorV2.tsx` only if a new overlay must be mounted. In that case one line, reported. No file of CLAUDE.md §3.2. If one becomes necessary, stop with `Outcome: question`.

## COME

- Measure before you style. Run the fixture on a dev server port of your own (check `lane-run` ports; not 3000) in the light theme. Read the boxes from the DOM.
- Acceptance criterion (mechanical, from §I S2):
  - for every lane L of `Shop`: `L.x == Shop.x + 30` and `L.w == Shop.w - 30` (±1 px);
  - consecutive lanes share a border: `L1.y + L1.h == L2.y` (±1 px);
  - every Task box is inside its lane box;
  - 0 RF edges have a Lane vertex as source;
  - the black-box pool's height is ≤ 48 px;
  - every existing graphVertex view outside the fixture renders identically. Use the S1 fixtures plus one pre-existing project with a hull, and take a before/after screenshot.
- Save the measures as JSON and the screenshots (before/after, light theme) under `docs/discovery/assets/graphvertex-s2/`. Reference them in the closing message. The chat repeats the checklist in its own browser (RC-23).
- Gates: `npx tsc --noEmit` (no new error beyond the 14 of the baseline), the `viewpoint/ir` suite, the full suite, `npm run build`. Then run a mutation bench on the partition application and the channel-edge suppression.
- Commits with an explicit pathspec and the `Model:` trailer: `feat(ir)` for the render, `test(ir)` or `chore(probe)` for the fixture if you split them. Add one inbox entry with `log-entry`.
- Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## NON FARE

- No D-layer write, no drag or resize gesture change, no creation-owner logic (S3).
- No authoring panel and no seed (S4).
- No change to `sync/` or `hooks/useJjomSync.ts`.
- Do not touch the `Status` line of the prompt.

## HARD STOP

After the S2 commits, with green gates and the measurements saved, stop with `Outcome: hard-stop`.
