# Layer Impact Report: compartment rows with no value hidden (Q9a of P-2026-10-03-1304)

- Prompt-ID: `P-2026-10-03-1304` (chat `C-2026-10-01-1725`), Phase 2, the second critical-zone item
- Tree: `~/jjodel-w-dnotC`, branch `derived-notations-edges`, HEAD `171aca4d8` at the start (the trunk `9ff95bede`
  merged in `09c094ec4`; the newer trunk tip `aefaddcf5` is not taken, as the chat asked)
- Go-ahead: the chat's resume text of 2026-10-03, «GO Q9a, RC-30 go-ahead for this one critical item only»
- Source: `docs/discovery/discovery_2026-10-03_derived_notations_edges.md` §3.9 (a) and §6

Committed before the first code edit, as RC-30 asks.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | a slot compartment (`attributes` or `references` source) leaves out the rows whose value is empty when the view's `structure.emptyBehavior` is `'hide'`; the existing «no row, no compartment» check then drops a compartment left empty |
| `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` | Statechart (UML): a state document that keeps an attribute compartment also carries `structure: { emptyBehavior: 'hide' }` (not critical zone: the derive half) |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irEmptyRows.test.ts` (new) | the rendering, with and without the key |
| `frontend/src/components/editor-v2/viewpoint/derive/__tests__/` (the file that covers Statechart documents) | the derived state document carries the key; any digest pinning the ESM Statechart documents retaken only after proving the key is its only change |

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): the rows of an IR node's slot compartment
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence: the derived Statechart documents created from now on carry an existing optional IR key

Canvas v2-flow:
  - What changes: under `structure.emptyBehavior: 'hide'`, a row whose slot holds no value is not drawn in an
    `attributes` or `references` compartment; a compartment with no row left is not drawn (the check that already
    drops a compartment whose every slot is excluded).
  - What does NOT change: every view without the key, or with 'dash' or 'collapse' (the IR compartment draws today's
    dash for both: 'collapse' stays a native-row behaviour of ObjectNode.tsx, not in this item); `children`
    compartments; the native rows of ObjectNode.tsx, which already honour the key; the row markup of a row that is
    drawn.
  - Cross-layer interaction: reads `compiled.ir.structure`, written by no code but the derivation and the Structure
    authoring group (`StructureGroups.tsx`), which already offers the three values.
  - Side-effect safety: fewer rows make a smaller node; the size path measures it as on any content change
    (useContentSize, the bounded writes of P-2026-10-01-1655). No write, no event.
Persistence:
  - What changes: a Statechart (UML) viewpoint derived after this commit stores `structure: { emptyBehavior: 'hide' }`
    on its state documents that have a compartment.
  - What does NOT change: `irVersion`, VersionFixer, the IR vocabulary (the key and its three values exist since
    2026-08-29, R-B9), every viewpoint already derived (it keeps what it saved: the dash, as R-VP-25 accepted for the
    arrowheads).

Smoke-test scenarios potentially affected:
  - DemoESM derived as Statechart (UML): `locked` and `unlocked` lose the row `entry =` with the dash (their `entry`
    slots are empty), 57 px high before.
  - DemoPEST as Statechart (UML): no compartment before or after.
  - The four default scenes (default viewpoint, native rows): identical at 0.01 px.
```
