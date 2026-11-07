# Layer Impact Report 2026-10-21: the intrinsic measure batched across nodes, the canvas inset read out of the render

- Prompt-ID: P-2026-10-21-1010. Chat: C-2026-10-20-0839.
- Tree: `~/jjodel-w-perfround3`, branch `perf-round3`, HEAD `7c18c2fab`.
- Critical-zone go-ahead: Alfonso, 2026-10-21 10:07 («procedi»), fixes 1-3 of
  `docs/discovery/discovery_2026-10-21_large_model_round3.md` §5; lane started with
  `--critical-zone-goahead P-2026-10-21-1010` (RC-30).
- Written before any code diff (CLAUDE.md §3.2). Every claim is read in code at that HEAD unless marked measured.

## 0. Verdict

**Two forced style/layout reads leave the hot path; what is drawn does not change.** `useContentDrivenSize` stops
measuring inside its own layout effect: it registers its element with a coordinator that measures every registered
node in one pass (all writes, one layout, all reads, all restores) and then runs the same decision and the same
`setNodes` write the effect runs today. `fitViewOptions` stops calling `getComputedStyle(document.body)` in the
`EditorV2Inner` render: it reads a cached inset that the publisher's own write refreshes. Layers touched: canvas
v2-flow (React Flow node `width`/`height`, session only, the channel the hook already uses) and IR rendering. No
D-layer, L-layer, JjOM, sync or persistence file is edited.

## 1. Facts the design rests on

1. **Today's measure is one forced layout per node per commit** (`useContentSize.ts:54-75`, called at :242 from the
   layout effect with no deps at :187). Each call writes five inline styles, reads `offsetWidth/offsetHeight`, and
   restores; the next node's writes invalidate the layout the previous read forced. Measured in the round 3 report
   §3.4: 431 ms self time per production drag, 107-111 per click, 496 per open.
2. **React Flow nodes are DOM siblings.** Every node is rendered flat under `.react-flow__nodes`, absolutely
   positioned, whatever its `parentId`; the hook has one call site (`IRNodeContent.tsx:291`), on the content of an RF
   node. Two registered elements are therefore never nested, and putting all of them at `max-content` at once leaves
   each one's `offsetWidth/offsetHeight` what it is when it alone is at `max-content`. The border and padding
   (`chromeX/chromeY`) are read before any write, in the restored state, as today.
3. **React Flow's `setNodes` is a React state update.** `@xyflow/react` 12.10.2, `useQueue` (`index.mjs:887-915`):
   `setNodes` pushes onto a queue and calls a `useState` setter; the queue is applied in that provider's layout
   effect. From a layout effect (today) the update is a sync-lane update, flushed before the browser paints. From a
   microtask outside React it would get the default lane, rendered by the Scheduler in a later task, with a paint
   possible in between. The coordinator therefore runs the callbacks inside `flushSync`, which keeps today's order:
   the size is written and committed before the frame is painted.
4. **The termination guards stay.** `MAX_UNACCEPTED_WRITES` per hook instance is unchanged. The per-cascade cap
   (`MAX_WRITES_PER_CASCADE`, cleared "the first moment after the cascade") is cleared by a microtask that now waits
   while a pass is pending: a write in pass N commits under `flushSync`, the commit registers the node again, and
   pass N+1 is part of the same cascade. Without the wait the clear would run between the two passes and a host that
   remounts on every commit would write forever in microtasks, with no React nested-update limit to stop it.
5. **React Flow reads `fitViewOptions` beyond the first fit.** `StoreUpdater` (`index.mjs:290-317`) copies the prop
   into the store on every render in which its reference changes, and the store's value is consumed whenever a fit is
   queued (`resolveFitView`, :3224-3236; consumed and cleared at :3277-3283 and :3320-3322). The queue is set by the
   `fitView` prop (`fitView` → `fitViewQueued`, :314-315), which `EditorV2.tsx:4772` derives from
   `!isJjomMode && nodes.length > 0 && !restoredViewportRef.current` and which can turn true after the mount. So
   "computed once on mount" is not equivalent; a cached value kept current is. Today the store holds the inset read
   at the last `EditorV2Inner` render; with the cache it holds the cached inset at the last render, the same value
   whenever the cache is current.
6. **The inset has one writer, inline on `<body>`.** `PropertiesWithTreeView.tsx:650-661` sets
   `--jj-canvas-right-inset` with `document.body.style.setProperty` and removes it on cleanup; no stylesheet defines
   it (grep of the definition form `--jj-canvas-right-inset:` over `src/`: no match; the SCSS files only read it with
   a fallback). That file is outside this prompt's scope, so the cache is refreshed by a `MutationObserver` on the
   body's `style` attribute, which fires on exactly that write. The observer reads the inline declaration first (no
   style recalc) and recomputes only when it changed; other body style writes (a cursor during a drag) cost a string
   compare.

## 2. Layers

| Layer | Touched | What changes | What does not |
|---|---|---|---|
| D-layer (Redux raw data) | no | — | no action is dispatched by either change |
| L-layer (computed proxies) | no | — | `isResized` is still read through `readVertexLayout` |
| JjOM | no | — | — |
| Canvas v2-flow | yes | when the derived size is measured and written: in a pass after the commit's layout effects, before the paint, instead of inside each node's effect; the `fitViewOptions` object is stable between renders | the values written, the write channel (`width/height` with `measured` reset), the ownership rules (manual size, resize drag, missing node), the budgets |
| Canvas classic | no | — | — |
| Sync layer | no | — | `syncSizeToJjom` is still never reached by a derived size |
| Persistence | no | — | nothing is written to the project |

Cross-layer interaction: none new. The derived size stays session-only (the persistence filter in EditorV2 keys on
`resizing !== undefined`, which a programmatic write never sets).

## 3. Risks and how each is held

- **A frame with the old size.** Held by `flushSync` in the pass and by the pass being a microtask of the task that
  committed: the browser paints after microtasks.
- **A node unmounted between its registration and the pass, or during the pass.** The unmount cleanup removes its
  job; the pass skips a job removed or whose element left the document before the callback phase.
- **Termination.** §1.4; the existing loop benches (`useContentSizeLoop.test.ts`) run against the batched hook.
- **Stale `fitViewOptions`.** Only in the microtask between the publisher's write and the observer's callback, and
  only for a render that falls inside it; the next render corrects it. Today has the same class of staleness (the
  store keeps the value of the last render).

## 4. Smoke scenarios potentially affected

- BPMN viewpoint of the harness project: 48 nodes, 42 edges; `offsetWidth/offsetHeight` of three nodes equal before
  and after (probe acceptance).
- A content change in a derived-size node (rename a vertex): the box follows in the same frame.
- Fit view with the Properties+Tree rail open and closed: the right padding follows the rail.
- Open, click, drag, viewpoint switch on the large model: no white canvas, no «size written too often» warning.
