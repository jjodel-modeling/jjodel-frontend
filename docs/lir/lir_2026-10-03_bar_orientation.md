# Layer Impact Report: the automatic orientation of a bar, DESIGN (Q3 of P-2026-10-03-1304)

- Prompt-ID: `P-2026-10-03-1304` (chat `C-2026-10-01-1725`), Phase 2, the design step of the fifth critical-zone item
- Tree: `~/jjodel-w-dnotC`, branch `derived-notations-edges`, HEAD `534698e2f` at the start
- Go-ahead: the chat's resume text of 2026-10-03, «Q3 DESIGN ONLY, RC-30 go-ahead for the design and the LIR, no code»;
  Alfonso brought Q3 forward the same day (his answer to the DemoFlowB no-layout question)
- Design: `docs/discovery/discovery_2026-10-03_derived_notations_edges.md` §10; prototype
  `frontend/scripts/probe/bar-orientation-proto.ts` (offline, on the probe's measured geometry, no app file)

No code in this step. The report below is for the implementation the design proposes (option B of §10), to be
approved before any edit.

## 1. Files the implementation would touch

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/barOrientation.ts` (new) | the pure rule: the sum of the unit vectors to the connected neighbours by absolute component, 20 percent hysteresis on the axis ratio, the declared orientation as the start |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | the synthesis computes each bar's orientation (session memo keyed by vertex id, the previous value for the hysteresis, held while any node is dragged) and writes it on the bar's RF node data (`irBarOrientation`); `endSideFor` reads it instead of width and height |
| `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` | passes the dragging flag and resets the memo on a viewpoint change, as `resetCrossDepsEpoch` |
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` and `shapeRegistry.ts` | the `bar` form painted S x L or L x S, centred in its L x L box, by the node data |
| `frontend/src/components/editor-v2/components/DynamicHandles.tsx` | a bar's handles on the painted long sides, inset (L - S) / 2 from the box, as a diamond's are inset to its outline |
| `frontend/src/components/editor-v2/utils/elkLayout.ts` | ELK lays out the painted bar (S x L or L x S); the position it returns converted to the L x L box's top-left |
| `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` | on a turn, the ELK routes of the bar's edges dropped (their ends were on the other sides) |
| `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` | the bar documents declare the L x L box and the painted thickness (an IR key, decision below) |
| tests | the rule (unit), the synthesis (orientation data, sides), the paint and the handles (render), ELK sizes |

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): the bar's paint and handles inside an unchanged box, the sides of its
      edge ends, the ELK input and routes
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence: the bar documents of newly derived viewpoints (box L x L and a painted thickness)

Canvas v2-flow:
  - What changes: a bar paints upright or lying inside an L x L box by the orientation the decoration computes;
    its handles sit on the painted long sides; its edge ends follow the side rule on that orientation; ELK lays out
    the painted bar.
  - What does NOT change: the node's position and box at a turn (no write, no layout shift); every other form; the
    side rule's diamond and dominant-axis branches; portDistribution (not on the synthetic edges' path).
  - Cross-layer interaction: reads node centres and the synthetic edges in the decoration pass; writes only RF node
    data and the session memo.
  - Side-effect safety: nothing persisted at a turn; the memo is session state, rebuilt on open; a turn drops the
    bar's ELK routes so no route ends on a side the bar no longer offers.
Persistence:
  - What changes: newly derived bar documents (Petri net, Petri net (classic), Activity (UML) fork and join) declare
    an L x L box and the painted thickness; viewpoints already derived keep their S x L bars, unturned.
  - What does NOT change: the model, every vertex position and size, VersionFixer, irVersion.

Smoke-test scenarios potentially affected:
  - DemoFlowB as Activity (UML), no layout: fork and join turn upright (ratios 7.32 and 3.15 measured), their ends
    on the sides facing their row neighbours.
  - DemoPetri as Petri net (classic), no layout: t1 and t3 turn lying (1.89, 19.13), t2 stays (1.15, inside the
    hysteresis); as Petri net, all three turn upright (4.32, 2.23, 2.60).
  - After Auto layout: no bar turns in any of the three (ratios 2.13 to 40 for the declared orientation).
  - The four default scenes: identical (no bar in the default viewpoint).
```
