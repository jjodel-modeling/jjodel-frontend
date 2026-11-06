# Discovery — Auto layout RangeError on 200 classes, and the varying settled view of b10_8

- Prompt-ID: P-2026-11-04-1443 (fix, `docs/prompts/claude_2026-11-04_1443_prompt_elk_rangeerror.md`), closed by
  P-2026-11-04-1526 (`docs/prompts/claude_2026-11-04_1526_prompt_elk_rangeerror_close.md`)
- Sessions: 2930a070-139d-401c-9d7a-9f86f55eef62 (1443), aae11a44-15ec-40b0-b51a-79c9f81fcbcf (1526)
- Tree: `~/jjodel-w-elkrange`, branch `elk-rangeerror`; fix commit `c4dfabf3b`, report written on HEAD `cb904099f`
- Executor model: Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## 1. Goal

(1) Why the toolbar Auto layout throws `RangeError: Maximum call stack size exceeded` on 200 classes with 400
references, the smallest failing graph, a fix outside the critical zone. (2) Why the settled view of b10_8 varies
between runs (zoom 1 / 4 nodes vs zoom 0.5 / 21 nodes). (3) For the close: that graphs below the budget lay out the
same before and after the fix, and which demos sit above it.

## 2. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The overflow is in ELK, not in our code | holds: stack top `_Fb`, `elk.bundled.js:4759`, network-simplex node placer (measured, 1443) |
| H2 | The driver is the class count | falsified: a path of 200 classes lays out in 107 ms; the driver is long-edge dummies (measured, 1443) |
| H3 | Switching the node placer to BRANDES_KOEPF above a dummy budget removes the crash | holds: ring 200 / 400 refs 3.2 s, 800 refs 11.4 s, no overflow (measured, node, 1443) |
| H4 | A catch-and-retry alone would suffice | falsified: near the threshold NS does not overflow but runs for minutes (ring 88 > 300 s, stopped) (measured, 1443) |
| H5 | Below the budget the fix changes no drawing | holds: 35 canvases, positions, sizes, handles and transform equal; pixel differences are run-to-run noise (measured, 1526, §4.3) |
| H6 | The b10_8 settled view varies because of a race in EditorV2.tsx alone | partly: the race is the onInit fit queued while React Flow holds 1 node; which `setNodes` resolves it depends on the initial push in `useJjomSync.ts` (measured 1443, read 1526; not changed, §5) |

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-elkrange/frontend/src/components/editor-v2/utils/elkLayout.ts`
- `/Users/alfonso/jjodel-w-elkrange/frontend/src/components/editor-v2/utils/__tests__/elkLayout.test.ts`
- `/Users/alfonso/jjodel-w-elkrange/frontend/src/components/editor-v2/EditorV2.tsx` (windows 575-626, 794, 4100-4250)
- `/Users/alfonso/jjodel-w-elkrange/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (window 1140-1171, read only, 1526)
- `/Users/alfonso/jjodel-w-elkrange/frontend/node_modules/elkjs/lib/elk.bundled.js` (stack frame at 4759, 1443)
- `/Users/alfonso/jjodel-w-elkrange/frontend/node_modules/@xyflow/react/dist/esm/index.mjs` (:3277, :3321, cited 1443, reread 1526)
- `/Users/alfonso/jjodel-w-elkrange/frontend/src/components/abstract/DockManager.tsx:146` (`open2`, for the probe)
- `/Users/alfonso/.jjodel-lanes/P-2026-11-04-1443/handoff.md`, `handoff.diff`

## 4. Findings

### 4.1 Root cause of the RangeError (measured on fb09b1445, ELK 0.11.1, 1443)

ELK's network-simplex node placer walks its auxiliary graph by recursion, one frame per auxiliary node, and the
auxiliary graph holds every long-edge dummy. In node, default stack: NS 490 dummies 0.5 s, 980 1.5 s, 2,450 8.6 s,
3,600 27 s, 4,300 overflow. Smallest failing graph: a path of 100 plus 44 edges first->last (about 4,300 dummies, 143
edges). Ring (i->i+1, i->i+N/2): 50 ok 3.3 s, 76 ok 12 s, 88 > 300 s (stopped), 100 overflow in 0.7 s. In the app,
before the fix, route A on and `MODE=trunk` both logged `autolayout: RangeError: Maximum call stack size exceeded`,
transform unchanged (`~/.jjodel-lanes/P-2026-11-04-1443/probe/out/before-branch.log`, `before-trunk.log`).

### 4.2 The fix (read, c4dfabf3b)

`frontend/src/components/editor-v2/utils/elkLayout.ts:341`:
`export const NS_PLACEMENT_MAX_DUMMIES = 1000;`

`elkLayout.ts:349` `export function estimateLongEdgeDummies(graph: ElkNode): number {` — iterative DFS cycle break,
longest-path layering, sources moved against their targets, one dummy per centre label.

`elkLayout.ts:485` (toolbar, containers):
`const placement = wanted === 'NETWORK_SIMPLEX' && estimateLongEdgeDummies({ id: 'root', children, edges: elkEdges }) > NS_PLACEMENT_MAX_DUMMIES`

`elkLayout.ts:121` (open, S4b re-layout):
`const placement = estimateLongEdgeDummies({ id: 'root', children: elkChildren, edges: elkEdges }) > NS_PLACEMENT_MAX_DUMMIES`

`frontend/src/components/editor-v2/EditorV2.tsx:4239-4242`: the toolbar handler catches a failed layout, warns, and
toasts `'Auto layout: this diagram is too large for the layout engine. Nothing was moved.'`. Not unit-tested:
EditorV2 does not import in the bench.

Tests: 7 red before the fix, 69/69 green after (`elkLayout` + `elkContainers`, 1443). Full vitest on cb904099f (1526):
514 files, 3 failed at import (the baseline: `context-binding`, `ai-prompt-sanitization`, `UDComparator`,
`window is not defined`), 511 passed, 13,761 tests passed (`.agent-logs/vitest-full-20261104-152503.log`).

### 4.3 Below the budget nothing changes (measured, 1526)

Method: the dev server of this tree (after, port 3914) and of a temporary detached worktree at `fb09b1445` (before,
port 3916, node_modules symlinked, removed after). Probe `~/.jjodel-lanes/P-2026-11-04-1526/probe/same.ts`: per
project, import into a fresh page, open each metamodel and model, settle, click the toolbar `Auto layout`, settle,
record node positions and measured sizes, edge handles, edge path strings and the viewport transform from the React
Flow props, crop the pane.

Set: a 20-class ring (`next` i->i+1, `far` i->i+10, built by the 1443 probe), the 7 gallery demos
(`frontend/public/library/gallery/*/1.jjodel`), the 2 codegen examples (`frontend/public/examples/codegen/*.jjodel`),
the 6 probe fixtures (`frontend/scripts/probe/fixtures/*.jjodel`), `frontend/src/redux/__tests__/fixtures/save_3_0_0.jjodel`.
35 canvases, 0 page errors on either side.

- Byte compare: all 35 records differ, because element ids are regenerated per import (node ids differ in 35 of 35).
- Id-free compare: viewport transform, node positions and sizes, edge handles equal on 35 of 35. Edge path strings
  equal on 28; on 7 the same commands with coordinates apart by at most 0.000079 px
  (`scene_4_DemoFlowB` M2), e.g. `431` vs `430.99999237060547`.
- Pixels (headless Chromium decode, `probe/pixdiff.ts`): 1 of 35 crops identical, the others differ, up to 17,150 px.
- Control: a second after run on 4 projects (8 canvases). After vs after differs as much as after vs before (e.g.
  `cg-petri demoNet` 13,926 px both); after2 vs before is pixel-identical on 4 of 8. Geometry equal 8/8 both ways.
  The pixel differences are run-to-run noise (text rasterization at zoom < 1, a 47x47 widget at the bottom-left
  corner, end-label stacking near C015 in the ring), not the fix.
- Crops read through the Read tool: `cg-petri demoNet`, `fixture-ring20`, `scene_4_DemoFlowB` M1, before and after:
  the same boxes, routes and framing.

Estimates on the after side (`buildElkGraph` with `CLASS_VIEW_PROFILE`, no labels / every edge with a centre label as
an upper bound): ring20 198 / 458; every demo and fixture at most 6 / 33 (`scene_1_DemoPEST` demoSM).

**Above the budget: no demo.** Only the two 200-class probe fixtures of 1443: the ring (400 refs) 19,998 / 40,598,
and the acyclic chain with chords (299 refs) 9,900 / 20,099. Both laid out with BK, no page error.

### 4.4 The varying settled view of b10_8 (measured on prod build, 1443; not fixed)

4 runs, one fit each, queued by the onInit fit while the React Flow node lookup held 1 node (bounds 50,50,200,112),
resolved when it held 2,559 (bounds 1040x255712): `translate(413.996,-63515) zoom 0.5`, 21 mounted. Zoom 1 did not
reproduce in those 4 runs; the 1204 run A transform `translate(549px,332px) scale(1)` is exactly the fit over the
1-node bounds. `EditorV2.tsx:619`:
`if (!restoredViewportRef.current || viewportShowsNoNodeRef.current?.()) fitViewRef.current?.();`
`EditorV2.tsx:794`: `fitViewRef.current = () => fitView({ padding: fitPadding(), maxZoom: 1 }).then(() => ensureNodeInView());`
React Flow resolves the queued fit on the next node update: `@xyflow/react/dist/esm/index.mjs:3277`
`if (fitViewQueued && nodesInitialized) {` and `:3321` `if (fitViewQueued) {` (read 1526): the rAF re-setNodes of the
1-node list, or the bulk 2,559-node one, whichever comes first (hypothesis of 1443, from the measured bounds). The
initial push is in `useJjomSync.ts:1159` `setNodes(rfNodesToSet);` followed by `:1168`
`requestAnimationFrame(() => onInitialized());` (read 1526, read only): what `rfNodesToSet` holds at that moment was
not measured. Per the 1526 prompt this is not fixed here: lane P-2026-11-04-1500 works on `useJjomSync.ts`.

## 5. Dependencies and risks

- After P-2026-11-04-1500 lands, re-measure on a prod build, b10_8, at least 4 runs: the node-lookup size when the
  onInit fit resolves, the settled transform and the mounted count. If the lookup always holds the graph at resolve
  time, the variance is gone without an EditorV2 change; if it can still hold 1 node, the EditorV2-only fix of the
  1443 handoff (hold the open fit until the canvas holds the vertices, bounded) is the next step.
- Even the good outcome frames 255,712 px at the React Flow minZoom 0.5 floor (21 nodes in view).
- BK is applied only above 1,000 estimated dummies; its drawing on such graphs is not compared with NS (NS cannot
  finish there). Phase 1 §5.1 chose NS for medium graphs; that choice is untouched below the budget.
- The estimate is not ELK's layering (ELK breaks cycles greedily and layers by network simplex); a graph near 1,000
  could fall either side of NS's real cost. Measured margins: 980 dummies 1.5 s, 4,300 overflow.
- The layout width of the 200-ring differs between runs (export 4,553 vs 8,138 px, 1443): read, not traced; likely
  DOM-measured labels at click time.
- The toolbar catch is not unit-tested (EditorV2 does not import in the bench).

## 6. Open questions

1. Is BK with `fixedAlignment NONE` acceptable as the drawing above 1,000 dummies, or should such graphs get a different algorithm?
2. Should a tall layout (200 layers) fit below the minZoom 0.5 floor after auto layout?
3. Is the 1,000-dummy budget the right line, given 1.5 s at 980 on a loaded machine?
4. Should the run-to-run layout width of the 200-ring be traced?
