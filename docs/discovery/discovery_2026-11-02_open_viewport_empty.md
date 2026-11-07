# Discovery 2026-11-02 — a large model opens on an empty area of the canvas (ticket #419)

- Prompt-ID: P-2026-11-02-0646 (`docs/prompts/claude_2026-11-02_0646_prompt_open_viewport_empty.md`), Phase 1, read-only
- Session: `c2086908-f73d-47ad-ac5f-1428b3574796`
- Tree: `~/jjodel-w-openvp`, branch `open-viewport-empty`, HEAD `246edb1bc` (cut from `alfonso-frontend-jjtl` at `aa68ad049`)
- Executor: claude-opus-5-5, effort xhigh
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

## 1. Objective

Find where the viewport at model open is decided, explain in numbers why the harness model opens on an empty
area, and propose the smallest fix that guarantees at least one node in view at open, deterministically for the
same file.

## 2. Hypotheses under test, and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | On a fresh profile the open viewport is a fit run from the initial-sync callback, not a restore | holds (measured) | §4.1, §5 |
| H2 | The fit is clamped by `minZoom` 0.5 and the bounding-box centre it lands on holds no node | holds for abstract syntax (measured) | §5.1 |
| H3 | The open viewport is nondeterministic across runs (the ticket's two transforms) | falsified on this tree (measured) | §5.3 |
| H4 | Under the BPMN viewpoint the canvas also opens on an empty area | falsified (measured, DOM and pixels) | §5.2 |
| H5 | The fit runs over a node set that depends on measurement timing | partly: true of the code (read), not a cause in any of the 9 measured fits | §4.2, §5.3 |
| H6 | The toolbar zoom button resets to 100% and does not fit | holds (read) | §4.4 |

## 3. Files read

Full paths; windows, not whole files, unless stated.

- `/Users/alfonso/jjodel-w-openvp/frontend/src/components/editor-v2/EditorV2.tsx`: 160-191, 560-619, 758-768, 3776-3836, 3860-3871, 3922-3929, 4040-4141, 4880-4920
- `/Users/alfonso/jjodel-w-openvp/frontend/src/components/editor-v2/viewportInset.ts`: the whole file (80 lines)
- `/Users/alfonso/jjodel-w-openvp/frontend/src/components/editor-v2/utils/autoLayoutOnOpen.ts`: 1-60
- `/Users/alfonso/jjodel-w-openvp/frontend/src/components/editor-v2/hooks/useJjomSync.ts`: 1155-1175, and line 315 through a grep
- `/Users/alfonso/jjodel-w-openvp/frontend/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts`: 40-69
- `/Users/alfonso/jjodel-w-openvp/frontend/src/components/editor-v2/Toolbar.tsx`: 1185-1200, and 43-67, 1221-1249 through a grep
- `/Users/alfonso/jjodel/frontend/node_modules/@xyflow/react/dist/esm/index.mjs` (12.10.2, the worktree's `node_modules` is a symlink to it): 960-975, 1195-1206, 3222-3325, and 267, 3132, 3598 through a grep
- `/Users/alfonso/jjodel/frontend/node_modules/@xyflow/system/dist/esm/index.mjs`: 405-450, 652-700, 740-766
- `/Users/alfonso/jjodel-w-openvp/frontend/scripts/probe/large-model-click-profile.ts`: 1-103, 240-628; and the diff of `604f578ed` (`CLICK_FIT`, branch `only-visible-conditional`)
- `/Users/alfonso/jjodel-w-openvp/docs/decisions.md:3395` (R-LAY-18, an excerpt through a grep)
- `/Users/alfonso/jjodel-w-openvp/docs/log-inbox/maintenance.md`: 326-338, 390-402
- `~/.jjodel-lanes/P-2026-11-02-0233/log.jsonl`: the `CLICK_FIT` results only, through a grep

## 4. Where the open viewport is decided (read, HEAD `246edb1bc`)

### 4.1 The four sites

1. The stored viewport, read once at mount. `EditorV2.tsx:578-581`:
   > `const restoredViewportRef = useRef<{ x: number; y: number; zoom: number } | null | undefined>(undefined);`
   > `if (restoredViewportRef.current === undefined) {`
   > `    restoredViewportRef.current = readStoredViewport(modelid, getActiveLayoutKey());`

   The key is `jjodel.viewport.<modelid>.<layoutKey>` in localStorage (`EditorV2.tsx:167`, `:172`), written on every
   `onMoveEnd` and at unmount (`EditorV2.tsx:3812-3822`, `:4901`).
2. The ReactFlow props. `EditorV2.tsx:4902-4904`:
   > `fitView={!isJjomMode && nodes.length > 0 && !restoredViewportRef.current}`
   > `fitViewOptions={fitViewOptions}`
   > `defaultViewport={restoredViewportRef.current ?? { x: 0, y: 0, zoom: 1 }}`

   The `fitView` prop is false for a model canvas: `isJjomMode = !!modelid && hasGraph` (`useJjomSync.ts:315`).
   No `minZoom` prop is passed, so React Flow's default applies: `minZoom = 0.5, maxZoom = 2`
   (`@xyflow/react/dist/esm/index.mjs:3598`).
3. The initial-sync callback, the site that decides on a fresh profile. `EditorV2.tsx:606-609`:
   > `// Restore-if-present, fit otherwise. A stored viewport already came in`
   > `// through \`defaultViewport\`, so there is nothing to re-apply here — the`
   > `// only thing to do is NOT fit over it (R-LAY-18: no new fitView sites).`
   > `if (!restoredViewportRef.current) fitViewRef.current?.();`

   with `EditorV2.tsx:766`:
   > `fitViewRef.current = () => fitView({ padding: fitPadding(), maxZoom: 1 });`

   The callback runs on a `requestAnimationFrame` after the first `setNodes` (`useJjomSync.ts:1167-1169`) plus a
   `setTimeout(..., 50)` (`EditorV2.tsx:592`, `:616`).
4. The open-time auto-layout, which replaces (3) only on a graph with no layout record (`EditorV2.tsx:597-604`,
   `utils/autoLayoutOnOpen.ts`), and fits after ELK with `duration: 300` (`EditorV2.tsx:4086`, `:4138`). The harness
   fixture has layout records: no 300 ms fit was observed in any open (§5).

### 4.2 What the fit does with a large model (read, xyflow 12.10.2)

`fitView()` only queues: `store.setState({ fitViewQueued: true, fitViewOptions: options, fitViewResolver });`
(`@xyflow/react/dist/esm/index.mjs:1203`). The queued fit runs at the next `setNodes` with `nodesInitialized`
(`:3277-3278`) or at the next `updateNodeInternals`, the ResizeObserver path, whatever is measured by then
(`:3320-3321`). It fits only measured nodes. `@xyflow/system/dist/esm/index.mjs:418`:
> `const isVisible = n.measured.width && n.measured.height && (options?.includeHiddenNodes || !n.hidden);`

The zoom is clamped and the box centre is kept, whether or not the box fits. `@xyflow/system/dist/esm/index.mjs:746-751`:
> `const zoom = Math.min(xZoom, yZoom);`
> `const clampedZoom = clamp(zoom, minZoom, maxZoom);`
> `const boundsCenterX = bounds.x + bounds.width / 2;`
> `const boundsCenterY = bounds.y + bounds.height / 2;`
> `const x = width / 2 - boundsCenterX * clampedZoom;`
> `const y = height / 2 - boundsCenterY * clampedZoom;`

When the box overflows the pane on both sides, the padding offset of `:753-764` reduces to `p.left - p.right` on x
and to 0 on y (symmetric relative padding). Relative padding 0.2 resolves to `Math.floor((viewport - viewport / (1 + padding)) * 0.5)`
(`:654`); `fitPadding()` gives the right side `${inset + 20}px` when the overlay is open (`viewportInset.ts:38-39`).

### 4.3 R-LAY-18 on fit sites (read)

`docs/decisions.md:3395`: "`fitView` scatta solo nel callback della sync iniziale e sui gesti espliciti, mai su
`nodesInitialized`, quindi non ri-adatta la vista." The fix must stay inside the initial-sync callback and the
explicit gestures; it adds no fit site.

### 4.4 The toolbar zoom button (read)

The prompt cites `Toolbar.tsx:1192-1194`; on this HEAD the button is at `Toolbar.tsx:1232-1233`
(`onClick={onResetZoom}`, `title="Reset zoom to 100%"`), wired at `EditorV2.tsx:5051`
(`onResetZoom={activeController ? handleActiveResetZoom : undefined}`), and `EditorV2.tsx:3926-3929`:
> `// Reset the active editor to 100% via an absolute setter — no fit-view,`
> `// no recentering (resetZoom on the flow controller would fit-to-view).`
> `activeController?.setZoom?.(1);`

The fit button left the bar on 2026-08-26 (`Toolbar.tsx:1246-1249`). The flow zoom controller's own `resetZoom`
does fit (`EditorV2.tsx:3791-3793`) and would land on the same clamped centre; no toolbar control reaches it.

## 5. What the user sees, in numbers (measured)

Probe: `frontend/scripts/smoke/_tmp_open_viewport.ts` (gitignored, not committed), run twice through
`lane-run probe` on dev port 3073 against HEAD `246edb1bc`. Each open is a fresh browser context (1440×900,
`seed`), an import of `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`, an open of
the model tab, then a sampler on the React Flow store: every `panZoom.setViewport` call, every transform change,
and after settle the node rects, the transform, and the nodes intersecting the pane in the store and in the DOM.
Run 1: 3 opens per viewpoint plus one reload-and-reopen each, 8 opens, exit 0. Run 2: 1 open per viewpoint with a
screenshot of the pane and a preview of the fix, 2 opens, exit 0 (an earlier attempt of run 2 failed at a
`SyntaxError` in the probe's page script before any measure and was rerun). Logs and JSON:
`.agent-logs/openvp-probe-1.log`, `.agent-logs/openvp-probe-2.log`, `.agent-logs/openvp-1.json` (repo root, untracked).

Common to every open: React Flow pane 1238×776 at (201, 91); `minZoom` 0.5 in the store; overlay inset `368px`, so
the fit pads 103 px left, 388 px right, 64 px top and bottom.

### 5.1 No viewpoint (abstract syntax)

- 407 nodes, 407 measured, all roots. Box with sizes [48, 48] to [6182, 40712], 6134 × 40664; box of positions
  [48, 48] to [5872, 40550].
- Shape: 360 of the 407 nodes have x < 1000 (a column on the left), spread evenly over y from 0 to 40712 (16 to 40
  nodes per 2000 px band); the other 47 sit at x 1000 to 6182.
- Fit zoom wanted: min((1238 - 491) / 6134, (776 - 128) / 40664) = min(0.122, 0.016) = 0.016, clamped to 0.5.
- Centre (3115, 20380). x = 619 - 3115 × 0.5 - (388 - 103) = -1223.5; y = 388 - 20380 × 0.5 = -9802.
  Resulting transform `translate(-1223.5px, -9802px) scale(0.5)`, the ticket's first transform.
- The view in flow coordinates is x 2447 to 4923, y 19604 to 21156: right of the column (the nearest node's right
  edge is at x 1659) and between the scattered nodes. Nodes in view: 0 in the store, 0 in the DOM. The nearest node is
  1502 flow px from the centre (rect 890, 20750, 769 × 479). The screenshot shows only long vertical edge segments
  and the dot grid, no node (`frontend/.vite-cache/openvp-abstract-1-1.png`, untracked).
- One `setViewport` call per fresh open, at 3.6 to 4.3 s, with every node measured (`m = 407`), no duration: the
  callback fit of §4.1 (3). The caller frames were lost across the async queue; the site is inferred from the
  missing duration (the auto-layout fit has 300 ms, the gestures 150 to 300 ms) and from the absence of a stored
  viewport at mount.
- The fit's `onMoveEnd` stores the empty viewport: `jjodel.viewport.<model>.__abstract__ = {"x":-1223.5,"y":-9802,"zoom":0.5}`.

### 5.2 Under «Harness / Lane process (BPMN)»

- 48 visible nodes (359 hidden), all roots. Box [48, 48] to [6078, 5932]: the pool node alone is 6030 × 5884 at
  (48, 48).
- Fit zoom wanted 0.110, clamped to 0.5; centre (3063, 2990); transform `translate(-1197.5px, -1107px) scale(0.5)`,
  the ticket's second transform.
- Nodes in view: 11 in the store, 11 in the DOM: the pool, two lanes (1134 × 5854, 1737 × 5854), three tasks
  (190 × 56) and five events or gateways (50 × 50). The screenshot shows gateways, two tasks and labelled flows
  (`frontend/.vite-cache/openvp-bpmn-1-1.png`). The BPMN open is clamped but not empty.

### 5.3 Determinism

- Four fresh opens per viewpoint (run 1 three, run 2 one): the same transform every time, `(-1223.5, -9802, 0.5)`
  without a viewpoint and `(-1197.5, -1107, 0.5)` under BPMN. The ticket's two transforms are the two viewpoints,
  not two outcomes of a race: H3 falsified on this HEAD.
- The measurement race of §4.2 is real in the code and was seen in progress (one sampler tick at 2.0 s showed 48 of
  407 nodes measured), but in every open that fitted (9 of 10: the BPMN reload restored instead) the queued fit ran after every visible node was measured. It is a latent
  cause, most of all on a build that measures only the visible nodes (`only-visible-conditional`), not the cause of
  the ticket.
- Reload and reopen: under BPMN the stored viewport was restored (initial transform equal to the stored one, no
  fit call). Without a viewpoint it was not: the initial transform was the identity and one fit ran, landing on the
  same empty transform. Why the abstract-syntax restore did not apply after a reload was not established (§8, Q4).

## 6. Proposed fix

### 6.1 Recommended: keep the fit, and move off it only when it shows no node

In the initial-sync callback the fit runs as today; when its promise resolves (`fitView` returns one,
`@xyflow/react/dist/esm/index.mjs:1205`), a pure check over the node rects asks whether any visible node intersects
the padded pane. If none does, `setViewport` once on the node nearest the box centre (distance from the centre to
the node rect, ties by id), at the same zoom, its centre at the centre of the padded pane.

- A model that fits at zoom 0.5 or more always shows its nodes: no change. BPMN on the harness: 11 nodes in view,
  no change. Only the empty case moves, by the shortest distance from where the fit put it.
- Preview on the harness, no viewpoint (run 2, positions only): the node nearest the centre is at (890, 20150), the
  viewport becomes (32, -9687, 0.5), and 20 nodes are in view.
- Deterministic for the same file: the fit was identical over 8 opens, and the fallback depends only on the node
  rects and the pane. Positions are D-layer data; sizes are those of nodes already measured when the fit resolved
  (all of them in every measured open).
- Shape: a new pure module `frontend/src/components/editor-v2/openViewport.ts` (`anyNodeInView`,
  `nearestToCentreViewport`, the padding resolution of `fitPadding()` in px as xyflow does it) with a vitest bench,
  and in `EditorV2.tsx` the callback fit of §4.1 (3) through it. The two auto-layout fits (`:4086`, `:4138`) reach the
  open only on a graph never laid out, and also serve the toolbar layout button; including them is Q1.
- Optional extension (Q2): apply the same check to a restored viewport at `EditorV2.tsx:609`, so that a viewport
  already stored by this bug (§5.1, last item) is not restored empty on every reopen.

### 6.2 Alternatives, and why each is not recommended

- A. Anchor the top-left instead: in the empty case, place the node nearest the box top-left at the padded top-left
  (harness: node at (48, 48), viewport (79, 40, 0.5), 20 nodes in view). Equally deterministic, and shows where the
  model starts; it moves the view far from where the fit put it. A fair choice if the chat prefers it (Q3).
- B. Lower `minZoom` for the open fit only: the harness would need zoom 0.016 (the 769 × 479 node of §5.1 becomes
  12 × 8 px); React Flow's scale extent stays [0.5, 2], so the first wheel or pinch jumps back to 0.5. Unreadable, then a
  jump.
- C. Lower the `minZoom` prop for the whole canvas: the harness would still clamp at any usable value (0.1 is six
  times too large), and every zoom gesture changes. Does not fix the case.
- D. Decide before the fit, from positions only (the `CLICK_FIT` method of `604f578ed`): deterministic even on an
  only-visible build, but the clamp test then ignores sizes and the BPMN open (clamped, 11 nodes in view) would move
  away from today's view. It changes a case that works.
- E. Wait for every node to be measured, then fit: near what React Flow already does here, and on an only-visible
  build the wait never ends; it also moves the fit towards the `nodesInitialized` trigger that R-LAY-18 rules out.

### 6.3 Critical zone and interfaces

`EditorV2.tsx` and a new `editor-v2/openViewport.ts` are not in the `CLAUDE.md` §3.1 table; the change writes no
D-layer data, touches no sync file and no `VersionFixer`. The §3.2 trigger is not met. Layers: canvas v2-flow (the
viewport) and the per-browser localStorage viewport key, which is UI state, not project state. No exported
interface changes; the new module only adds exports. Phase 2 files: `openViewport.ts` (new), its test (new),
`EditorV2.tsx`, and, for the DOM check, a committed probe if the chat wants one (the gitignored probe of §5 is the
draft): 3 or 4 code files.

## 7. Dependencies and risks

- The fallback runs after the fit resolves: one frame may paint the empty view before the move. Phase 2 measures it.
- If the restore check (Q2) is taken, a user who left the canvas on an empty area on purpose gets a fit on reopen.
- The acceptance "a node in view" should count the region not covered by the overlay (the pane is 1238 wide, the
  overlay covers its right 368 px): the recommended centring uses the padded pane, so the anchor node lands inside it.
- Measured on HEAD `246edb1bc` with the overlay open and a 1440×900 window; another window size gives other
  numbers, not another mechanism.

## 8. Open questions

1. Should the two auto-layout fits (`EditorV2.tsx:4086`, `:4138`, shared with the toolbar layout button) go through the same check?
2. Should a restored viewport that shows no node be replaced by the open fit (§6.1, optional extension)?
3. Anchor in the empty case: the node nearest the box centre (recommended) or the node nearest the box top-left (6.2 A)?
4. Without a viewpoint, a reload did not restore the stored viewport while BPMN did (§5.3): a separate ticket?
5. Phase 2 DOM check: commit a probe (`frontend/scripts/probe/open-viewport.ts`, from the draft of §5) or keep it gitignored?
