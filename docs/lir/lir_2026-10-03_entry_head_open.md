# Layer Impact Report: the open entry head (Q9b of P-2026-10-03-1304)

- Prompt-ID: `P-2026-10-03-1304` (chat `C-2026-10-01-1725`), Phase 2, the first critical-zone item
- Tree: `~/jjodel-w-dnotC`, branch `derived-notations-edges`, HEAD `09c094ec4` at the start (the trunk `9ff95bede` merged
  in, RC-14)
- Go-ahead: the chat's resume text of 2026-10-03, «RC-30 go-ahead for ONE critical item only: Q9b (open entry head in
  IRNodeContent.tsx)»; Alfonso's A6 of the same day grants RC-30 one item at a time. `JJODEL_CRITICAL_ZONE_GOAHEAD` is
  unset in this session: if the hook refuses the edit, the lane stops `blocked` and says so.
- Source: `docs/discovery/discovery_2026-10-03_derived_notations_edges.md` §3.9 (b) and §6

Committed before the first code edit, as RC-30 asks.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | the entry mark's head: the closed filled triangle `M 32 3 L 40 7 L 32 11 Z` becomes the open chevron `M 32 3 L 40 7 L 32 11`, stroked 1 px in the ink, no fill; the shaft runs to the tip (`H ${ENTRY_W}`), as an edge's line runs into its open marker |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irA1Render.test.ts` | the two entry tests that pin the filled head (`dot`, `arrow`) expect the open one; the rest of the file unchanged |

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): the entry mark painted inside an IR node, nothing else
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Canvas v2-flow:
  - What changes: the two paths of the `.ir-entry-svg` layer of a node whose view declares `shape.entry` ('dot',
    the Statechart (UML) Initial; 'arrow', the Automaton notation): the head is an open chevron, the shaft reaches the
    tip.
  - What does NOT change: the layer's box (40 x 14, `right: 100%`, centred on the box's middle), the dot, the colour
    (the border ink, `inkColor`, and the metaclass outside ink when coloured), every node without `shape.entry`, the
    node's size, its handles, the edges.
  - Cross-layer interaction: none. `ShapeSpec.entry` is read, never written; no IR key, no persisted value, no
    `irVersion` bump, no migration.
  - Side-effect safety: the layer is `pointer-events: none` and outside the box; its paint changes, its geometry does
    not, so no size observer and no layout runs differently.

Smoke-test scenarios potentially affected:
  - DemoPEST and DemoESM derived as Statechart (UML): `locked`'s entry head open, as the transitions' heads (5/5 and
    4/4 open markers measured in Phase 1).
  - The four default scenes (no `shape.entry` in the default viewpoint): identical at 0.01 px.
```
