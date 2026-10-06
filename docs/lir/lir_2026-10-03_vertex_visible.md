# Layer Impact Report: a vertex view that is not drawn, `VertexViewIR.visible` (Q7 of P-2026-10-03-1304)

- Prompt-ID: `P-2026-10-03-1304` (chat `C-2026-10-01-1725`), Phase 2, the fourth critical-zone item
- Tree: `~/jjodel-w-dnotC`, branch `derived-notations-edges`, HEAD `dde52ed6d` at the start (trunk `9ff95bede` merged;
  the newer trunk is not taken)
- Go-ahead: the chat's resume text of 2026-10-03, «GO Q7, RC-30 go-ahead for this one critical item only»; Alfonso's
  A3 of the same day (the key, and the Trigger class not drawn in Statechart and State machine)
- Source: `docs/discovery/discovery_2026-10-03_derived_notations_edges.md` §3.7 and §6

Committed before the first code edit, as RC-30 asks.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | `VertexViewIR.visible?: Conditional<boolean>`, optional, absent = drawn (Rule 11: an optional property added to an exported interface); `CompiledView.visible?`, written only when declared |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | `compileView` compiles the key with `compileConditional(…, true)` and writes it only when declared, so a view without it compiles to the key list it had |
| `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` | a value that is neither a boolean nor a Conditional is refused (the render reads it as absent, as the other keys) |
| `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` | a pure `computeViewHidden(nodes, model, index, readCtx, idlookup)`: the objects whose resolved vertex view resolves `visible` false; empty at once when no view of the index declares the key |
| `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` | the set joins the row-hidden one in the existing pass (`decorateNodes` hides the node, `decorateEdges` lifts or drops its edges) |
| `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` | Statechart (UML) (and State machine, drawn as it since P-2026-10-03-1300) writes `visible: false` on the document of the class the Trigger reference is typed by, and of its subclasses (not critical zone: the derive half) |
| tests | `viewpoint/ir/__tests__/irVertexVisible.test.ts` (new); the derive tests, with the Statechart digests retaken only after proving the key is their only change |

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): the hidden flag of a node, the edges lifted or dropped
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence: a new optional IR key inside saved views

Canvas v2-flow:
  - What changes: a node whose object resolves a vertex view with `visible` false is hidden (hidden: true, never
    removed), as a row child is; it leaves the ELK graph (buildElkGraph skips hidden nodes); an edge with an end on it
    is lifted to a drawn ancestor or dropped (decorateEdges, unchanged).
  - What does NOT change: every view without the key; the model; the tree (it lists the model, not the canvas); the
    object-as-edge pass (an object drawn as an edge is hidden by it, as before); the row pass.
  - Cross-layer interaction: reads the IR index and the read context the pass already builds; writes nothing.
  - Side-effect safety: the decoration runs on every pass and is pure; a hidden node keeps its stored position and
    size, and shows again as soon as the key or its value goes.
Persistence:
  - What changes: a Statechart (UML) or State machine viewpoint derived after this commit stores `visible: false`
    on its Trigger class's document. The spelling is permanent once saved (R-B9).
  - What does NOT change: `irVersion`, VersionFixer, every viewpoint already derived (it keeps drawing its event
    boxes until derived again, as R-VP-25 accepted for the arrowheads).

Smoke-test scenarios potentially affected:
  - DemoPEST and DemoESM as Statechart (UML): the three Event boxes (coin, push, stop) not drawn; after Auto layout
    the 280 (288) px they took at the top of a 541 (568) px canvas gone.
  - An Event instance no transition refers to: not drawn either (the view hides the class, not the used instances).
  - The four default scenes: identical at 0.01 px.
```
