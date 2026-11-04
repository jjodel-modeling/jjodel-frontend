# Discovery: React rendering of a large JjTL output canvas (#475, #547)

Prompt-ID: P-2026-11-04-0256
Prompt file: `docs/prompts/claude_2026-11-04_0256_prompt_jjtl_canvas_render_discovery.md`
Chat: C-2026-11-03-2317 · session 7d024427-d1d0-4aa7-859c-5df81d03db3b
Tree: `~/jjodel-w-jjtlrender`, branch `jjtl-canvas-render`, HEAD `7d5eaecbd` (every run measured on this HEAD, with the throwaway patches below applied or not)
Executor model: Opus 5.5 (as the session banner shows it)
Nature: a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

Provenance: **measured** = a run of the probe in this phase, the app on the vite **dev server** (port 3256, `~/.jjodel-lanes/P-2026-11-04-0256/probe/`), one fresh page and project per run, **one run per configuration**, load average recorded per run (it ranged from 4 to 38: other lanes were running). A probe is not a hand run, and nothing here is a production figure. **read** = a line checked in this session on the tree above or in `frontend/node_modules/@xyflow` (react 12.10.2, system 0.0.76). The throwaway patches are diffs in the lane folder (`patchA-skip-forced-render.diff`, `patchB-selectors.diff`); each was applied, measured and reverted. The tree is clean.

## 0. Answer in brief

- **"Render only the visible nodes" is already on** for this canvas (`onlyRenderVisibleElements`, P-2026-11-02-0020). It does not help on open: React Flow mounts **every node it has never measured**, measures it, then unmounts what is off screen. Measured: b10_8 mounts 2,559 node elements then removes 2,558; b11_9 mounts 5,119 then removes 5,118.
- So the cost is **two long tasks**, a mount and a cull, back to back. b10_8 (baseline, four runs): mount 3,167 to 4,347 ms, cull 2,174 to 2,953 ms. b11_9 (baseline, one complete run): mount 7,469 ms, cull 5,117 ms.
- **Route A** (skip the forced first render) removes both tasks. b10_8: longest task 1,571 ms, long-task total 8,311 against 14,329 ms in the baseline run nearest in load; b11_9: neither task present, long-task total 16,073 against 32,270 ms. As patched it breaks two things: edges touching a never-measured node, and `fitView()`, which waits for every node to be measured (section 4).
- **Route B** (cheaper per-node selectors) shortens only the mount. b10_8: 4,248 to 3,178 ms (-25%); b11_9: 7,469 to 4,972 ms (-33%). The cull is unchanged (2,596 to 2,852; 5,117 to 5,157). Part of the gain is a dev-only react-redux warning (182 ms). Low risk, no behaviour change by construction.
- **A plus B** equals A (b10_8 longest 1,610 ms, total 8,150 ms): once nodes are not mounted, B has nothing left to save.
- **Neither route needs the critical zone** if A is done at the React Flow prop boundary in `EditorV2.tsx`. Both touch the handle pipeline that CLAUDE.md §3.1 cross-references (DynamicHandles, handlePosition).
- **A worse freeze turned up**: in one run of nine on b10_8 (load 36-38), the ELK auto-layout on open ran on the main thread for **117,474 ms** over 2,559 nodes. It is intermittent and has no size cap (section 5). It dwarfs both routes.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Rendering only the visible nodes is a new route to build | falsified | already on, `EditorV2.tsx:4952` (read); defeated on open by React Flow's forced first render (measured, section 2) |
| H2 | The longest task is one React commit over all nodes | partly | it is the mount (three commits in one task); the cull right after it is a second long task of comparable size (measured) |
| H3 | Cheaper selectors remove most of the cost | falsified | -25% / -33% of the mount task, 0% of the cull (measured) |
| H4 | Skipping the forced first render removes the cost | holds for the time | both tasks gone at both sizes (measured); not shippable as patched (section 4) |
| H5 | #547's picture (React is the longest task) is stable on this HEAD | partly | 8 of 9 runs on b10_8 yes; 1 run had a 117 s ELK task (measured) |

## 2. Findings

**F1, read.** The prop is on whenever no IR view needs its nodes mounted. `frontend/src/components/editor-v2/EditorV2.tsx:1717`: `if (model.objByVertex.size === 0) return true;`, and `EditorV2.tsx:4952`: `onlyRenderVisibleElements={onlyRenderVisible}`.

**F2, read.** React Flow force-renders a node until its handles have been measured. `frontend/node_modules/@xyflow/system/dist/esm/index.js:373-374`:
`const forceInitialRender = !node.internals.handleBounds;`
`const isVisible = forceInitialRender || partiallyVisible || overlappingArea >= area;`

**F3, measured.** A MutationObserver in the probe counts `.react-flow__node` elements added and removed while recording:

| run | added | removed | peak at (ms after click) | load |
|---|---|---|---|---|
| base-mo b10_8 | 2,559 | 2,558 | 14,603 = end of the 4,347 ms task | 24 |
| base-shot b10_8 | 2,559 | 2,558 | 10,988 = end of the 3,167 ms task | 5-9 |
| base-mo b11_9 | 5,119 | 5,118 | 25,287 = end of the 7,469 ms task | 7 |
| patchA b10_8 | 9 | 8 | 8,466 | 12 |
| patchA b11_9 | 9 | 0 | 18,454 | 5-8 |

The output canvas ends with 1 node element and 0 edge elements in every run, patched or not (the per-pane DOM count `[1, 32, 0]`; the screenshots `base-shot-b10_8-end.png` and `patchA-b10_8-end.png` match).

**F4, measured.** The CPU inside the mount task (b10_8, profiled, 1 ms sampling), baseline `base2` against patch B:

| inclusive in the longest task | base2 (4,248 ms) | patchB (3,178 ms) |
|---|---|---|
| DynamicHandles | 707 | not among the top 40 |
| useSyncExternalStore (store subscriptions) | 509 | 226 |
| ObjectNode | 432 | not among the top 40 |
| console.warn, self | 182 | not among the top 25 self |
| commitRoot | 3,345 | 2,358 |

The cull task is `(program)` 1,638 / 1,842 ms self (DOM removal, native) and is not touched by B.

**F5, read.** Three O(N·E) or O(N²) costs per node, run at mount and on every React Flow store update:
- `components/DynamicHandles.tsx:84`: `return edges.filter(e => e.source === nodeId || e.target === nodeId);`, through the `useStore` at `:175`, once per node over all edges.
- `components/DynamicHandles.tsx:251`: `for (const [id, n] of storeApi.getState().nodeLookup) {`, once per node over all nodes. Only the opposite ends are ever read: `utils/handlePosition.ts:210-211`: `if (!nodePositions || !e.oppositeNodeId) return undefined;` / `const p = nodePositions.get(e.oppositeNodeId);`.
- `nodes/ObjectNode.tsx:261`: `for (const e of s.edges) {` in the `edgeRefSig` store selector, once per node over all edges.

**F6, read.** `nodes/ObjectNode.tsx:136-141` returns a fresh object from `useSelector` (`return { name: dClass?.name ?? null };`), which react-redux 9.2.0 flags in development through its selector stability check: the 182 ms of `console.warn` in F4. This part of B's gain is **dev-only**; production has no such check. Inferred from the library's dev behaviour, not measured in production.

**F7, read.** How React Flow adopts handles a node did not measure: `@xyflow/system/dist/esm/index.js:1570-1573`, `parseHandles`: `if (!userNode.handles) { return !userNode.measured ? undefined : internalNode?.internals.handleBounds; }`. A node passed with a `handles` array therefore has `handleBounds` and is not force-rendered (this is what patch A uses).

**F8, read.** `fitView()` waits for every node to be measured. `@xyflow/react/dist/esm/index.js:3277`: `if (fitViewQueued && nodesInitialized) {`; and `@xyflow/system/dist/esm/index.js:1637-1641` clears `nodesInitialized` for any non-hidden node whose `measured.width` or `measured.height` is undefined.

**F9, read.** Canvas export reads the DOM, so it already exports only mounted elements: `frontend/src/services/CanvasExportService.ts:50`: `const FLOW_PARTS = '.react-flow__node, .react-flow__edge, .react-flow__edgelabel-renderer > *, .react-flow__viewport-portal > *';`, queried at `:330`. Route A does not change what export sees after the first render.

## 3. The two routes

### Route A: visible nodes only, without the forced first render

Throwaway (`patchA-skip-forced-render.diff`, 10 lines in `EditorV2.tsx`): at the `nodes=` prop, a node with neither `measured` nor `handles` goes in as `{ ...n, handles: [], initialWidth: 180, initialHeight: 80 }`. Objects are cached per node, so React Flow's identity check holds.

What a shippable version would change:
- `EditorV2.tsx`: the same decoration at the prop boundary, gated on `onlyRenderVisible`, with **real** handle bounds and an estimated `measured` instead of empty handles.
- `DynamicHandles.tsx`: export the pure geometry it already computes (the pool of `MAX_HANDLES_PER_SIDE` = 4 per side, positions from `computeSidePositions`) as a function of a node's edges and box, so the synthesized bounds equal the bounds the mounted node would measure.
- `ObjectNode.tsx`: none, or an estimated box from `nodeSizing`.
- Critical zone: none of the §3.1 files, if done in `EditorV2.tsx`. Building the handles where the nodes are built (`useJjomSync.ts`) would be critical zone; this report does not propose it.

Gain (measured, one run each): b10_8 longest task 1,571 ms (baseline runs 3,167 to 4,347), long-task total 8,311 ms (base2: 14,329); b11_9 mount and cull gone, total 16,073 ms (base-mo: 32,270). The longest remaining task on b10_8 is Jodie's context build (`Jodie.tsx:155` → `getContextJSON`, 524 ms inclusive), and on b11_9 the walk's reducer (`classes.ts:1409` `add`, 2,679 ms self).

### Route B: cheaper per-node selectors

Throwaway (`patchB-selectors.diff`, 2 files):
- `DynamicHandles.tsx`: `ownEdgesIndexed`, a per-node index of edges built once per `s.edges` array (WeakMap) and shared by every node, used in place of `selectOwnEdges` in the `useStore` at `:175`. `nodePositions` is filled only for the ends of the node's own edges.
- `ObjectNode.tsx`: `edgeRefSig` reads the same index; the metaclass name selector returns a string instead of `{ name }`.
- `EditorV2.tsx`: none. Critical zone: none.

Output-equivalent by construction: the index keeps store order inside each node's list (same order as the filter), a self-loop is listed once (as the filter does), `ownEdgesEqual` is unchanged, and `computeSidePositions` reads only `oppositeNodeId` (F5). Not proven by tests in this phase.

Gain (measured): mount task b10_8 4,248 → 3,178 ms, b11_9 7,469 → 4,972 ms; cull task unchanged. The b11_9 figure is from the one complete patched run (`patchB-mo`); three earlier b11_9 runs ended before the output canvas was populated and are not counted.

## 4. Risks

Route A, for handles and edges of nodes not rendered:
1. **Edges to a never-measured node are not drawn** while it stays unmounted. Measured: 125 `[React Flow]: Couldn't create edge for target handle id` warnings on patch A, 0 on the baseline. In this scenario none of those edges was visible in either case; on a model whose visible nodes reference off-screen ones they would vanish. Synthesized handle bounds (section 3) remove this; empty ones do not.
2. **`fitView()` never resolves** while any node is unmeasured (F8): the open fit, the toolbar fit, and `autoLayout`'s fit chain `.then(() => ensureNodeInView(...))`. Read, not observed: the end screenshots of patch A and the baseline are identical, so this path did not show. An estimated `measured` would let it resolve, on estimated bounds.
3. **Port distribution and side choice** (`applyDistribution`, `computeGeometricAnchorsForAllEdges` via `getNodeRect`) and the ELK layout would read estimated boxes for unmounted nodes, and nothing re-runs them when the real size arrives. DynamicHandles already falls back to 180 x 80 (`DynamicHandles.tsx:253-254`), so the estimate has a precedent.
4. Selection: box selection uses the boxes (estimated); select-all reads the node list (unchanged).
5. Export: already DOM-only today (F9); unchanged.
6. Views that need their nodes mounted (graphVertex, content-driven size) already turn the prop off (`onlyRenderVisible.ts`); A must use the same gate.

Route B: no behaviour change intended. Residual risks: a consumer relying on the exact array instance from `selectOwnEdges` (none found: the only production caller is `DynamicHandles.tsx:175`, and the only other use is the test file `frontend/src/components/editor-v2/utils/__tests__/dynamicHandlesOwnEdges.test.ts` (lines 10, 25-34, 42, 51); `command grep -rn selectOwnEdges frontend/src` exit 0, positive control `onlyRenderVisibleElements` returned its 3 files), and the `selectOwnEdges` unit tests, which stay valid because the function is kept.

## 5. Side finding: ELK auto-layout on open, 117 s on the main thread

Measured, run `base-b10_8` (load 36-38): the longest task was 117,474 ms, 112,217 ms of it self time in `pkg:elkjs_lib_elk__bundled__js`, with no React commit inside. Read: `EditorV2.tsx:603` runs `autoLayoutRef.current()` when `shouldAutoLayoutOnOpen(createdOnOpen, graphId, idlookup)` holds; `utils/autoLayoutOnOpen.ts:49`: `if (!createdOnOpen) return false;`. The layout behind it is `computeElkLayout` (`EditorV2.tsx:4124`). Whether `createdOnOpen` is true depends on whether the populate run of the mount created vertices, a timing matter. It fired in 1 of 9 complete b10_8 runs. One profiled b11_9 run also held the main thread for more than 7 minutes and was stopped; its cause was not captured. No node-count cap was found on this path (read of `EditorV2.tsx:596-609`, a window, not a whole-file count). A ticket is proposed, not filed.

## 6. Files read

- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/components/editor-v2/EditorV2.tsx` (windows 585-624, 1705-1734, 1769-1793, 4085-4144, 4925-4969)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/components/editor-v2/onlyRenderVisible.ts` (1-80)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/components/editor-v2/components/DynamicHandles.tsx` (1-389)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (93-292)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/components/editor-v2/utils/autoLayoutOnOpen.ts` (window around 20-52)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/components/editor-v2/utils/handlePosition.ts` (grep hits 154-297)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/services/CanvasExportService.ts` (grep hits)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/node_modules/@xyflow/system/dist/esm/index.js` (373-374, 777-781, 1570-1598, 1636-1643)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/node_modules/@xyflow/react/dist/esm/index.js` (960-975, 3138-3160, 3277)
- `/Users/alfonso/jjodel-w-jjtlrender/frontend/src/components/editor-v2/CLAUDE.md`
- `docs/log-inbox/hw-notation.md` (845-900, ticket #547)
- `~/.jjodel-lanes/P-2026-11-03-2332/probe/wbtime.ts` and `out/prof-before-b10_8.json` (the #547 probe and profile)

## 7. Runs (all dev server, one run each)

| label | shape | patch | longest ms | long-task total ms | node els added | load (1-min at end) |
|---|---|---|---|---|---|---|
| base | b10_8 | none | 117,474 (ELK) | 134,089 | not counted | 36 |
| base2 | b10_8 | none | 4,248 | 14,329 | not counted | 16 |
| base-np | b10_8 | none | 3,790 | not summed | not counted | 14 |
| base-mo | b10_8 | none | 4,347 | not summed | 2,559 | 24 |
| base-shot | b10_8 | none | 3,167 | not summed | 2,559 | 5 |
| patchB | b10_8 | B | 3,178 | 15,217 | not counted | 21 |
| patchA | b10_8 | A | 1,571 | 8,311 | 9 | 12 |
| patchAB | b10_8 | A+B | 1,610 | 8,150 | 9 | 5 |
| base-mo | b11_9 | none | 7,469 | 32,270 | 5,119 | 7 |
| patchB-mo | b11_9 | B | 5,157 (cull); mount 4,972 | 30,211 | 5,119 | 4 |
| patchA | b11_9 | A | 3,636 (walk, before the tab) | 16,073 | 9 | 5 |

Not counted: three b11_9 runs (`base`, `base-np`, `patchB-np`) ended before the output canvas was populated, and one profiled b11_9 run under patch B was stopped after 7 minutes of a blocked main thread.

## 8. Questions for Alfonso

1. Route B as a small lane on its own (DynamicHandles.tsx, ObjectNode.tsx), with tests for `ownEdgesIndexed` and a mutation bench?
2. Route A with synthesized handle bounds and an estimated `measured`, done in EditorV2.tsx and gated on `onlyRenderVisible`: acceptable, or do you prefer to keep React Flow's forced first render?
3. For route A, should estimated boxes feed port distribution and ELK, or should those wait until a node is measured?
4. Shall the 117 s ELK auto-layout on open be filed as a ticket, and is the direction a node-count cap or running ELK off the main thread?
5. The production figures are not measured: do you want a WB_PROD run of the baseline and of each route before a lane opens?

## Decisions taken (unattended)

- Measured on the dev server only, one run per configuration, under the load of other lanes; load recorded per run.
- Throwaway patches applied to the worktree for each run, saved as diffs in the lane folder, reverted after; vite restarted after each change (a module edited under a running server gives the probe a second module instance and the run hangs).
- Counted only the b11_9 runs where the output canvas was populated.
- Did not dig into the cause of the ELK race beyond the trigger.
