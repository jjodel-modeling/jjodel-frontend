# Discovery 2026-09-30: the derived size leaks into the default viewpoint

- Prompt-ID: P-2026-09-30-1625 (`docs/prompts/claude_2026-09-30_1625_prompt_derived_size_leak.md`), Phase 1, read-only.
- Session: `c478be13-c097-464a-b138-ec7e095a5b87`, launched by `lane-run` (tier heavy, RC-30 go-ahead `P-2026-09-30-1625`).
- Tree: `~/jjodel-w-sizeleak`, branch `derived-size-leak`, HEAD `ee5cd0792` (the trunk `ecbc0e92c` plus this prompt file, docs only).
- Executor: Claude Opus 5.5 (`claude-opus-5-5`).
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

**Reproduced on the trunk** (probe on 3081, light, isolated profile, `ee5cd0792`): DemoPetri's places are 200×78 in the default
viewpoint; under «DemoPetri (derived)» (R-VP-16) they are 66×66 circles; back in the default viewpoint p1 and p3 stay 66×66,
with an inline `66px` width and height on the React Flow node, on the first return and on the second. DemoFlowB on the trunk
(no ISO diamond here): `i0` and `fin`, drawn as 66×66 circles under its derived viewpoint, stay 66×66 in the default one
instead of 200×50. DemoPEST and DemoESM have no derived viewpoint in the run and do not move.

**Root cause** (read, then measured): `useContentDrivenSize` (`viewpoint/ir/useContentSize.ts:111`) writes the derived box as
top-level `width`/`height` on the React Flow node, a session value with no viewpoint in it, and gives it back only in its own
inactive branch (`useContentSize.ts:153-176`), which runs only while its host is mounted. At a viewpoint change the host goes:
ObjectNode leaves the IR branch (`ObjectNode.tsx:901`, `if (irResolution && !irDelegated)`) for the native card, IRNodeContent
unmounts, and the hook has no unmount cleanup. The sync does not take the size back either: it patches a size only when its
transformer's output moves (`useJjomSync.ts:1369-1378`), and for a vertex not resized by hand that output is `{}` under every
layout (`jjomTransformers.ts:79`), so null against null, no patch. Not `isResized`: nothing reaches the D-layer, the hand size
of `lock` taken under the derived viewpoint does not leak (measured), and p2's hand size of the default layout holds (measured).

**Recommendation**: one unmount-only layout effect in `useContentDrivenSize` that drops the size the hook wrote, on the
conditions of its inactive branch (still ours: the node's width and height equal what it wrote), plus a read of `isResized`
under the layout in force at that moment, so a hand size of the default layout that happens to carry the derived numbers keeps
its precedence. One file and its test; nothing persisted changes; `useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts`
untouched. The file is in the critical zone (`CLAUDE.md` §3.1, `viewpoint/ir/`): the Layer Impact Report is §6.

**Decisions awaiting Alfonso**: none (RC-26: the critical-zone edit carries the RC-30 go-ahead given at launch; no persisted
data, no exported interface, no demo content changes).

**Questions**
1. Fix at the hook's unmount (§5 option A) or at the sync, dropping every non-resized size at a layout change (option C)?
   Recommended: A, the owner of the size gives it back; C writes in `useJjomSync.ts` and fights the hook under IR viewpoints.
2. Read `isResized` of the layout in force inside the cleanup, beyond the equality guard?
   Recommended: yes, two lines; it is the only case the equality guard cannot tell apart (§5, A.2).
3. The ISO diamond of `viewpoint-notations` (A2's second instance) is not on the trunk: verify it here?
   Recommended: no; it goes through the same hook, so the A2 branch re-runs its `after` scenes once it takes the trunk.

## 1. Hypotheses under test

The prompt names three candidates (COSA 1). Verdicts:

| # | Hypothesis | Verdict | Evidence |
|---|------------|---------|----------|
| H1 | The size is stored per node, not per view or viewpoint | **Partly**: false for the D-layer, true for the session carrier | §3.1, §3.3 |
| H2 | The content-size derivation of `useContentSize.ts`, kept in session (R-LAY-4, «la taglia derivata resta in sessione»), is what the default viewpoint reads | **Holds**: root cause | §3.1, §3.2 |
| H3 | `isResized` carries the derived size across | **Falsified** | §3.3 |

## 2. Files read

- `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (whole, 250 lines)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (lines 180-300)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (lines 90-135, 900-1000, 1200-1260)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (lines 1-40)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (lines 55-100)
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (lines 1180-1250, 1300-1490)
- `frontend/src/components/editor-v2/viewpoint/layout/vertexLayout.ts` (lines 49-100)
- `frontend/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts` (lines 1-90)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (lines 124-147), `sync/syncState.ts` (lines 78-115)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useContentSizeDrop.test.ts` (whole)
- `frontend/src/utils/deriveViewpoint.ts` (lines 1-80), `components/TreeViewSidebar/TreeViewContent.tsx` (lines 616-705)
- `docs/decisions.md` R-LAY-1..11 (lines 3040-3070), R-VP-15..17 (lines 4200-4240), RC-20..34 (lines 140-280)
- `docs/spec/spec_attive.md` lines 60-80 (the size contract); A2 report on `viewpoint-notations`
  (`docs/discovery/discovery_2026-09-30_a2_petri_classic_open_arrows.md`, lines 150-165)

## 3. Findings

### 3.1 The writer: session size, one per vertex, given back only while mounted (read)

`useContentSize.ts:84-92`, the contract of the hook:

> `The size is written in session only, on the same channel the size propagation uses (top-level width/height with 'measured' reset). Nothing reaches the D-layer`

The write, `useContentSize.ts:243`, inside `setNodes` (lines 238-250):

> `return { ...n, width: size.w, height: size.h, measured: undefined };`

The only give-back, `useContentSize.ts:153-163`, inside the per-commit effect:

> `if (!active) {` … `const mine = written.current;` … `if (!isResized && mine !== null) {`

That branch runs when the hook is still called and turns inactive (a form without supplement, F3 of P-2026-09-29-2122). It does
not run when the component calling the hook unmounts: the effect has no dependency array and returns no cleanup
(`useContentSize.ts:152`, `useLayoutEffect(() => {` … `});`). Search: `command grep -n "return () =>" useContentSize.ts` returns
the fonts effect only (line 146, `return () => { alive = false; };`), exit 0, the positive control of the same search.

### 3.2 Why the host unmounts at a viewpoint change (read, then measured)

`ObjectNode.tsx:109`, `const irResolution = useIRView(id, data.instanceOfClassId);` and `ObjectNode.tsx:901`,
`if (irResolution && !irDelegated) {`: IRNodeContent (`ObjectNode.tsx:943`) is rendered only in the IR branch. In the default
viewpoint the resolution is null or delegated and the native card renders instead. Measured: in the default viewpoint the node
carries no `.ir-node-content` (the probe's `shape` reads `null`), in the derived one it does (`circle`, `bar`).

### 3.3 Why nothing else takes it back, and why it is not `isResized` (read, then measured)

- `jjomTransformers.ts:79`, `manualSizeOf`: `if (!eff.isResized) return {};`. For p1 the transformer answers `{}` under the
  derived key and under the default one.
- `useJjomSync.ts:1369-1378`: `const topSizeChanged = (newSize === null) !== (oldSize === null)` … `if (topSizeChanged)
  patchedNodeSizes.set(id, newSize);`. Null against null: no patch, so the 66×66 stays on the React Flow node.
- The D-layer is per layout: `vertexLayout.ts:69`, `const record = src.layoutByViewpoint?.[layoutKey];` (R-LAY-1, R-LAY-4).
- Measured, run 2: `lock` resized by hand under the derived viewpoint to 114×114 (`isResized: true` under the derived key),
  200×78 back in the default viewpoint, 114×114 again in the derived one. The sync handles a hand size per layout; the leak
  is only the derived one.
- Measured, run 2: p2 with a hand size of the default layout (260×120, `isResized: true` under `__abstract__`), comes back
  260×120: the sync's patch lands over the leaked 66×66. Precedence of a hand size already holds; only non-resized nodes leak.
- `nodeSizing.ts:12`, `objectNode: { adaptWidth: true, adaptHeight: true },`: the native object card mounts no resizer
  (measured: no resize handle on p2 in the default viewpoint). A hand size under the default layout exists only as data: the
  probe writes it with `syncSizeToJjom` (`canvasToJjom.ts:124`), the writer a NodeResizer drag commits through.

### 3.4 Measures (probe `frontend/scripts/smoke/_tmp_sizeleak_probe.ts`, gitignored; log `~/.jjodel-lanes/P-2026-09-30-1625/`)

Run 2 on `ee5cd0792`, 3081, light, 1600×1000 DPR 2, `RESULT 12/17`, every red one of the leak, no page error. Node boxes in
flow px, `[w, h, inline RF size, IR shape]`:

| DemoPetri | default, first | derived | default, back (1st and 2nd) |
|-----------|----------------|---------|-----------------------------|
| p1, p3 | 200, 78, none | 66, 66, `66px`, circle | **66, 66, `66px`** |
| p2 (hand size 260×120 in default) | 200, 78, none | 66, 66, `66px`, circle | 260, 120, `260px` |
| lock (hand size 114×114 in derived) | 200, 78, none | 114, 114, `114px`, circle | 200, 78, none |
| t1..t3 | 200, 78, none | 50, 14, none, bar | 200, 78, none |

DemoFlowB (flowchart bag, derived from the tree): `i0` and `fin` 200×50 → 66×66 circles → **66×66, `66px`** in the default
viewpoint; the other nodes (rounded, bar) carry no inline size and return to 200×50. DemoPEST, DemoESM: same boxes after as
first. Run 1 (same code, p2's hand size not yet in the probe): p1, p2, p3 all 66×66 back in the default viewpoint, 10/17.
Crops: `frontend/scripts/smoke/_tmp_sizeleak_crops/sl_before_{petri_derived,petri_default_back,flowB_derived}_600.png`.

## 4. Dependencies and risks

- React Flow is controlled in EditorV2 (`EditorV2.tsx:4155-4157`, `nodes=` and `onNodesChange=`): `setNodes` from a node's
  cleanup goes through the same channel the inactive branch already uses (F3), so no new write path.
- A cleanup that ran on every commit would drop and rewrite the size in a loop; it must be mount-only (`[]`), reading refs.
- Tab close: the cleanup calls `setNodes` on a store about to go; the updater matches nothing or the node is gone, `nds`
  returned unchanged (same reference), nothing stored.
- Classic renderer: out of perimeter (R-LAY-9), not touched.

## 5. Options

- **A (recommended).** In `useContentDrivenSize`, an unmount-only `useLayoutEffect(() => () => {…}, [])`: when `written.current`
  is set, and the vertex is not resized under the layout in force at the unmount (A.2, `readVertexLayout(store…, getLayoutKeyOf
  (state)).isResized`), drop `width`, `height`, `measured` from the node whose size still equals the written one, the same keys
  the inactive branch drops. A.2 covers a hand size of the default layout with the derived numbers, patched by the sync before
  the unmount: the equality guard alone would drop it.
- **B.** The native branch of ObjectNode drops any explicit size at mount: rejected, it cannot tell a hand size from a derived
  one and is not the owner.
- **C.** `useJjomSync.ts` patches `null` for every vertex not resized at each layout change: rejected, a critical-zone sync
  change, and under an IR viewpoint it would drop the size the hook is about to write (write, drop, write).

## 6. Layer Impact Report (option A)

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Canvas v2-flow:
  - What changes: when IRNodeContent unmounts, the React Flow node loses the top-level width/height/measured
    that useContentDrivenSize wrote on it, if still unchanged and not a hand size of the layout in force.
  - What does NOT change: the per-commit derivation, its write budget, the inactive branch, the hook's
    signature and its caller; hand sizes (isResized) under any layout; edges.
  - Cross-layer interaction: reads the store (idlookup, viewpoint) through readVertexLayout/getLayoutKeyOf,
    as the hook's own selector does; writes only React Flow state through setNodes.
  - Side-effect safety: the sync patches hand sizes by transformer diff and never saw the derived size,
    so dropping it removes nothing the sync owns; a size the sync patched first differs from the written
    one or is isResized, and is kept.

Sync layer: not touched. useJjomSync.ts, canvasToJjom.ts, portDistribution.ts, syncState.ts unchanged.
Persistence: unchanged; nothing written to the D-layer, no VersionFixer migration, no jsxString.

Smoke-test scenarios potentially affected:
  - DemoPetri: default -> derived -> default: places 200x78 again (today 66x66)
  - DemoFlowB: default -> derived -> default: i0, fin 200x50 again (today 66x66)
  - derived -> default -> derived: circles derived again, lock's hand size of the derived layout kept
  - four demo scenes in the default viewpoint: 0 px from ecbc0e92c
```

## 7. Decisions taken (unattended)

None in Phase 1: the questions of §0 carry their recommendations for the chat (RC-21).

## 8. Decisions awaiting Alfonso

None (RC-26 list checked: critical-zone edit covered by the RC-30 go-ahead of the launch, no persisted data, no exported
interface change, no change to what the MODELS demo shows beyond removing the defect).
