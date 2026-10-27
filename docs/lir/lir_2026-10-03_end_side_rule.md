# Layer Impact Report: the per-form side rule of an edge end (Q2 + Q4 of P-2026-10-03-1304)

- Prompt-ID: `P-2026-10-03-1304` (chat `C-2026-10-01-1725`), Phase 2, the third critical-zone item
- Tree: `~/jjodel-w-dnotC`, branch `derived-notations-edges`, HEAD `d43083244` at the start (trunk `9ff95bede` merged;
  the newer trunk is not taken, as the chat asked)
- Go-ahead: the chat's resume text of 2026-10-03, «GO Q2 + Q4 (a) + Q4 (b), RC-30 go-ahead for this one critical item
  only»
- Source: `docs/discovery/discovery_2026-10-03_derived_notations_edges.md` §3.2, §3.4, §6; the step 1 addendum (§9) for
  why Q4 (b) rides with this item

Committed before the first code edit, as RC-30 asks.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | a pure `endSideFor(form, size, towards, taken)`: a `bar` takes only its two long sides (left/right when upright, top/bottom when lying); a `diamond` takes the side facing the other end that no other end of the node already holds, sharing the best side only when no free side faces it; every other form the dominant axis, as today. `assignGeometricHandles` takes an optional `formOf(vertexId)` and uses it; `synthesizeObjectAsEdges` resolves each endpoint vertex's form once (`resolveIRView`, as `isAction` does for the junctions) and writes `irSourceForm` / `irTargetForm` on a synthetic edge whose end is a bar or a diamond |
| `frontend/src/components/editor-v2/utils/edgeUtils.ts` | a pure `spreadDiamondEnds(rect, ends)`: the ends an ELK route gives a diamond, one per vertex: the end nearest a side's vertex keeps it, the others move to the free adjacent vertex their route turns towards; and `refitRouteEnd(points, end, side)`: a route end moved onto a vertex, on the same side along its axis, on another side through a stub out of that vertex |
| `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` | an edge drawn on its ELK route with an end tagged `diamond` reads the other ELK ends of that node, takes its vertex from `spreadDiamondEnds`, and refits its route (not a junction branch, which keeps its own fit) |
| tests | `viewpoint/ir/__tests__/irEndSide.test.ts` (new), `utils/__tests__/diamondEnds.test.ts` (new); a committed test pinning the old side of a bar or a diamond end, if any, changed and declared |

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): the sides and handles of synthetic object-as-edge edges; the drawn ELK
      route of an edge ending on a diamond
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Canvas v2-flow:
  - What changes: (a) the handle side of a synthetic edge end on a bar (long sides only) or a diamond (one end per side
    where a free side faces the other end); (b) two data keys on such an edge, `irSourceForm` / `irTargetForm`, written
    only for a bar or a diamond end; (c) after an Auto layout, the drawn ends of ELK routes on a diamond: one per
    vertex where a free vertex is adjacent, on the outline.
  - What does NOT change: every end on any other form (the dominant axis, byte for byte); reference-as-edge edges;
    user anchor overrides (they still win, irEdgeViews.ts:303-317); the junction handles of Activity (UML)
    (assignActivityJunctions runs after and rewrites its members, as before); portDistribution (not on this path);
    handlePosition/DynamicHandles (they place what the side rule chose); the ELK graph and its positions.
  - Cross-layer interaction: reads the resolved vertex view (resolveIRView, compiled.form) and the session ELK route
    store; writes nothing outside the decorated edges.
  - Side-effect safety: the synthetic edges are rebuilt on every decoration pass; no persisted anchor, no JjOM write,
    no new state; a node with no bar or diamond end decorates its edges as before.

Smoke-test scenarios potentially affected:
  - DemoPetri as Petri net (classic) and Petri net, DemoFlowB as Activity (UML), at rest: handles on a bar's short
    side 3/6, 6/6, 6/6 measured, expected 0.
  - DemoFlowB after Auto layout: d1's two ends at the top tip, 12 px apart and 4.2 px off the outline, expected on
    distinct vertices, on the outline.
  - The four default scenes (default viewpoint, no synthetic edge): identical at 0.01 px.
```
