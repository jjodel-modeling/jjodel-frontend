# L2 Fase 3 — Canvas overlay discovery report

**Date**: 2026-05-04
**HEAD**: `7482f9359d5c6b1d62ab73310e9c66bc9ac5d0c2`
**Branch**: `alfonso-frontend-jjtl`
**Scope**: discovery read-only, no code edits

---

## Section A — Classic editor canvas DOM anatomy

The canvas wrapper class is `.GraphContainer`, applied as a React `className` at three known sites: `MetamodelTab.tsx:190`, `ModelTab.tsx:45`, `WorkbenchCanvas.tsx:188`. Inside the wrapper, the `Measurable` component injects a fixed two-layer scaffold: an outer `panning-handle` (jQuery UI draggable, holds the pan offset) wrapping a `panning-content` (actual children). Pan and zoom are NOT applied as a single transform on the wrapper — pan uses CSS variables (`--offset-x`, `--offset-y`) on `.panning-content`, zoom uses `--total-zoom-x` / `--total-zoom-y` on `.scrollable`. Each individual node receives its own `--left` / `--top` CSS variables. There is NO existing SVG layer in the classic canvas DOM.

### Files examined
- `frontend/src/components/abstract/tabs/MetamodelTab.tsx:190` (className declaration)
- `frontend/src/components/abstract/tabs/ModelTab.tsx:45` (className declaration)
- `frontend/src/components/editors/viewpoint/WorkbenchCanvas.tsx:188` (className declaration)
- `frontend/src/components/forEndUser/Measurable.tsx:466-498` (Measurable render method, panning-handle injection)
- `frontend/src/components/forEndUser/Measurable.scss:1-44` (pan/zoom CSS vars)
- `frontend/src/styles/diagram.scss:878-921` (`.GraphContainer` rules)
- `frontend/src/styles/style.scss:107` (legacy `.GraphContainer` rule, mostly moved out)
- `frontend/src/App.scss:401, 413-419` (overflow rule + `[data-nodetype]` position rule)
- `frontend/src/graph/graph/graphContainer.tsx` (102 lines — almost entirely commented-out experiments; the actual rendering happens via `props.children`)

### Findings (raw)
- DOM tree (canonical, simplified):
  ```
  .dock-tabpane
   └─ div.GraphContainer.h-100.w-100             (MetamodelTab/ModelTab/WorkbenchCanvas)
       └─ div.scrollable                         (Measurable wrapper, sets total-zoom-x/y)
           └─ div.panning-handle                 (jQuery UI draggable target)
               └─ div.panning-content            (sets --offset-x/--offset-y, holds children)
                   └─ <Graph>...                 (per-graph React subtree)
                       └─ [data-nodetype]        (Vertex/Edge nodes, --left/--top)
  ```
- `Measurable.scss:11-13`: `.ui-draggable.panning-handle { overflow: visible; border: none; }`.
- `Measurable.scss:16-19`: `.panning-handle, .panning-content { width: 100%; height: 100%; }`.
- `Measurable.scss:25-29`: `.panning-content { position: relative; left: var(--offset-x); top: var(--offset-y); }`.
- `Measurable.scss:20-23`: `.scrollable, .not-zoomed { width: calc(100% / var(--total-zoom-x)); height: calc(100% / var(--total-zoom-y)); }`.
- `App.scss:413-419`:
  ```scss
  [data-nodetype] {
    --zoom-x: 1; --zoom-y: 1;
    left: var(--left) !important;
    top: var(--top) !important;
  }
  ```
- `diagram.scss:889`: `.GraphContainer .scrollable[graph='DGraph'] > .panning-handle { overflow: hidden; }` (overrides Measurable rule for the root graph).
- `graph/graph/graphContainer.tsx:19-50` (`GraphsContainerComponent`): the function body is mostly historical comments. The real wrapper React component is the `Measurable` injected by `Measurable.tsx:466-498`.

### Open questions
- The graph module exposes `GraphsContainer` and `GraphsContainerComponent` (`graphContainer.tsx:90-102`) but the live class `.GraphContainer` is set by tab components, not by `GraphsContainerComponent`. The naming overlap is misleading; there is no single React component that owns the `.GraphContainer` class.
- It was not determined in this discovery whether the `<Graph>` subtree is rendered inside a Redux-connected component or a portal. Tracing `<Graph>` itself was deferred (it appears only in the commented-out section of `graphContainer.tsx`); if Fase 3 needs the React-tree mount point with high precision, a follow-up discovery on the path "MetamodelTab → renders → Graph component" is recommended.

---

## Section B — Runtime lookup of a DVertex position

A DVertex position lives on Redux state as part of `DGraphElement.size: GraphSize` (`{x, y, w, h}`), with computed getters that fall back to `view.defaultVSize`. At render time, the position is applied to each node via the CSS variables `--left` and `--top` set on the `[data-nodetype]` element (`App.scss:413-419`). The drag pipeline is: jQuery UI `start/drag/stop` callbacks → throttled at ~30fps via `rafThrottle` → wrapped in `TRANSACTION` → calls `setSize({x, y})` → re-render via Redux. Reading the position runtime should therefore happen via the L-proxy (`lvertex.size` or `lvertex.x`) or directly via `state.idlookup[<id>].size`, NOT by parsing the inline style — DOM read works but invites layout thrashing if read during drag.

### Files examined
- `frontend/src/model/dataStructure/GraphDataElements.tsx:96-100, 177, 469-505, 538-572` (DGraphElement size schema + getters)
- `frontend/src/graph/vertex/Vertex.tsx:107-220` (jQuery UI draggable setup + drag callbacks)
- `frontend/src/App.scss:413-419` (CSS variables for runtime position)
- `frontend/src/joiner/classes.ts:1083-1199` (Constructors.DViewElement — sets `defaultVSize` etc.)

### Findings (raw)
- `GraphDataElements.tsx:177`: `size!: GraphSize;` on `DGraphElement` (the persisted position+size).
- `GraphDataElements.tsx:96`: `zIndex: number = 100;` on `DGraphElement` (default z-index, separate from CSS).
- `GraphDataElements.tsx:469`: `get_sizeold(context: Context): this["size"] { return new GraphSize(context.data.x, context.data.y, context.data.w, context.data.h); }` — historical version reading `x/y/w/h` directly from D.
- `GraphDataElements.tsx:498-505`: `get_size(c, canTriggerSet, outer)` — current API. Falls back through `innerSize` → `outerSize` → `view.defaultVSize` (lines 568-572).
- `Vertex.tsx:212`: `$measurable.draggable(this.draggableOptions);` — jQuery UI plugin call.
- `Vertex.tsx:156-211`: drag callbacks. Notable:
  - `start` (line 156): caches `cumulativeZoom`, fires `EMeasurableEvents.onDragStart` per applicable view, sets `windoww.dragging_vertex_size_tmp`.
  - `drag` (line 169): zoom-correct position; throttle via `rafThrottle(dragThrottleKey, ..., 32 /* ms */)` → wraps `setSize({x, y})` + `EMeasurableEvents.whileDragging` per view in TRANSACTION.
  - `stop` (line 194): cancels throttle, applies final `setSize({x:ui.position.left, y:ui.position.top})`, fires `EMeasurableEvents.onDragEnd`.
- No direct utility `getNodePosition(id)` was found by the suggested grep. The canonical read paths are L-proxy (`lvertex.size`) or D state (`state.idlookup[id].size`).

### Open questions
- The exact code path that writes `--left` / `--top` CSS variables onto the `[data-nodetype]` element was not traced (the rule consumes them but the writer was not located in this discovery). Hypothesis: written by `Vertex.tsx` `componentDidUpdate` or by a `style={{ '--left': x+'px', ... }}` inline declaration upstream. Fase 3 likely doesn't need to write them, only to read positions for path endpoints.

---

## Section C — Iterating DObjects visible under the active viewpoint

The codebase already resolves "which view applies to a given node" per-node via the transient store. `graphElement.tsx:182,214` calls `Selectors.getViewByIDOrNameD(idorname, state)`. Per-node transient state holds `tn.mainView` (the exclusive view) and `tn.stackViews` (decorations stacked on top). Multi-match resolution is folded into a sorted scoring system: a per-node `validMainViews` array, with the first valid one promoted to `mainView`. Fallback when no view applies: `Defaults.Pointer_ViewFallback` (`graphElement.tsx:184`). For overlay iteration, the natural seed is therefore "for each `[data-nodetype]` with a resolved `tn.mainView`, ask whether `tn.mainView.isEdge` is true" — that single transient key is the index of the active edge views.

### Files examined
- `frontend/src/graph/graphElement/graphElement.tsx:180-228, 1295-1340` (view stack resolution + render orchestration)
- `frontend/src/joiner/classes.ts:3975-4093` (TransientProperties shape: `viewScores`, `mainView`, `stackViews`, etc.)

### Findings (raw)
- `graphElement.tsx:182`: `let view: LViewElement = LPointerTargetable.fromD(Selectors.getViewByIDOrNameD(idorname, state) as DViewElement);` — primary lookup-by-name selector.
- `graphElement.tsx:184`: `ret.view = tn.mainView = view ? view : LPointerTargetable.fromPointer(Defaults.Pointer_ViewFallback) as LViewElement;` — fallback to a hardcoded default view.
- `graphElement.tsx:194-196`: `if (tn.mainView?.id && (!tn.validMainViews?.[0] || tn.validMainViews[0].id !== tn.mainView?.id)) tn.validMainViews = [tn.mainView, ...(tn.validMainViews || [])];` — multi-match list, mainView is first.
- `graphElement.tsx:1300-1306`: render-time loop that selects a single `mainView` from `props.views`.
- `classes.ts:3984`: `viewScores: Dictionary<Pointer<DViewElement>, ViewScore> = {} as any;` (per-node score map).
- `classes.ts:4001`: `static sort(tn, pv, state0) {...}` (TransientProperties sorter).
- `classes.ts:4072-4093`: `TransientPropertiesByGraphTab` includes `sorted: Pointer<DViewElement>[]` — pre-computed sorted view list per graph.
- "First-match-wins" is essentially the existing default for `mainView`: the highest-scoring valid view is promoted; ties resolved by sort order.

### Open questions
- The full signature of `Selectors.getViewByIDOrNameD` (location, parameters) was not read in detail; usage suggests `(idOrName, state) => DViewElement | undefined`. Confirm in implementation phase by reading `joiner/classes.ts` near the Selectors block (or wherever Selectors is defined).
- Whether iterating `state.idlookup` and filtering by L-proxy `mainView.isEdge` is acceptable performance-wise for large models was not measured. For Fase 3a static rendering it is presumably fine; Fase 3b drag may want a precomputed cache (mirrored from `transientProperties.node[*].mainView` reads).

---

## Section D — z-index map and panning-handle interference

⚠️ **Discrepancy with prompt assumption**: a literal grep for `panning-handle.*z-index` and `z-index.*panning-handle` returned no matches anywhere in `frontend/src`. The `.ui-draggable.panning-handle` rule in `Measurable.scss:11-13` declares only `overflow: visible; border: none;` — no `z-index`. The `.GraphContainer` override in `diagram.scss:889` declares only `overflow: hidden`. The CLAIM that the panning-handle has `z-index: 100` could not be confirmed by static code reading; if true, it must be set by an inline style somewhere in the React tree (not searched exhaustively). The DGraphElement default `zIndex = 100` (`GraphDataElements.tsx:96`) is a separate concept — it is the z-index of each node, not of the panning-handle. For overlay placement the safer default is to mount the SVG layer as a sibling of `.panning-content` (or directly inside `.panning-handle` after `.panning-content`) and assign it an explicit `z-index` after a runtime check of the panning-handle's computed z-index.

### Files examined
- `frontend/src/components/forEndUser/Measurable.scss:1-44` (full file)
- `frontend/src/styles/diagram.scss:878-921` (`.GraphContainer` block)
- `frontend/src/components/forEndUser/Measurable.tsx:460-498` (panning-handle injection)
- `frontend/src/App.scss:401, 413-419`
- `frontend/src/model/dataStructure/GraphDataElements.tsx:96` (`zIndex: number = 100;`)

### Findings (raw)
- `Measurable.tsx:492-494`:
  ```jsx
  <div className="panning-handle">
      <div className="panning-content">{this.props.children}</div>
  </div>
  ```
  No inline `style` setting z-index on the panning-handle.
- `Measurable.scss:11-13`:
  ```scss
  .ui-draggable.panning-handle{ overflow: visible; border: none; }
  ```
- `diagram.scss:913`: only z-index found in canvas-adjacent SCSS is `z-index: 1;` on `.css-1nmdiq5-menu` (react-select dropdown), unrelated to overlay.
- `App.scss:413-419` confirms `[data-nodetype]` does not set inline z-index from SCSS — relies on jQuery UI's `position: absolute !important` (`Measurable.scss:3`).
- No explicit `pointer-events` declarations were found around the panning-handle (none in the searched SCSS files).

### Open questions
- If the panning-handle does indeed have a runtime z-index of 100 (jQuery UI sometimes sets z-index inline during drag), the overlay needs to be either (a) z-index ≥ 101, (b) DOM-positioned **after** the panning-handle subtree, or (c) outside the panning-handle but inside `.scrollable`. Recommendation: confirm at runtime via DevTools Computed style on `.panning-handle` before deciding.
- jQuery UI's draggable adds the class `.ui-draggable-dragging` during drag (`App.scss:210-214`), which only sets `visibility: hidden` for the dragHelper. No z-index implications.

---

## Section E — React mount point for the overlay

The classic editor is one of three modes (`flow` | `classic` | `split`) controlled by a local React state in `EditorSwitch` (`abstract/tabs/EditorSwitch.tsx:9-30`). The toggle is shown only when an active viewpoint is set (`hasViewpoint` derived from `state.viewpoint` selector, line 27-28). For metamodels and viewpoint-less models the editor stays on `flow` only. The `classicSlot` prop forwarded into `EditorV2` (line 57) is the actual classic React subtree; presumably it eventually contains the `.GraphContainer` div from `MetamodelTab` / `ModelTab` / `WorkbenchCanvas`. The natural mount point for the overlay is therefore inside the classic subtree, as a sibling of `.panning-content` (or a child of it) — a single mount that becomes hidden whenever `editorMode === 'flow'`. Conditional mount on "at least one DViewElement has isEdge" is a future optimization; for Fase 3a it is safe to always mount and let the overlay render zero `<path>` elements when no edges apply.

### Files examined
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx:1-68` (full file)
- `frontend/src/components/abstract/Dock.tsx:63, 228, 254-257, 373` (`EDITOR_TYPE_CHANGE` event wiring)
- `frontend/src/components/abstract/DockManager.tsx:110, 140, 162, 222, 326, 351`

### Findings (raw)
- `EditorSwitch.tsx:9`: `type EditorViewMode = 'flow' | 'classic' | 'split';`.
- `EditorSwitch.tsx:30`: `const [editorMode, setEditorMode] = useState<EditorViewMode>('flow');`.
- `EditorSwitch.tsx:35-37`: viewpoint change resets to 'flow' (default mode). Implication: overlay subscription should re-mount or refresh when viewpoint changes.
- `EditorSwitch.tsx:55-61`: `<EditorV2 modelid editorMode hasViewpoint onEditorModeChange classicSlot={children} />` — classic React tree is `children`, passed in from upstream tab component.
- `JjodelEvents.EDITOR_TYPE_CHANGE` at `events/registry.ts:10` (= `'jjodel:editor-type-change'`). Used by Dock + DockManager + jjscript executor (`jjscript/executor/utils.ts:16`).
- No grep result for `JjodelEvents.LAYOUT_MODE_CHANGE` in EditorSwitch directly; it is dispatched in `Dock.tsx:63` and listened in `Dock.tsx:228` (separate concept: full-tab layout vs editor mode).

### Open questions
- The full subtree from `<EditorV2>` down to `.GraphContainer` was not traced. There may be intermediate React components that inject the panning-handle. For an overlay PR, the right mount point depends on whether the classic subtree is portaled elsewhere or rendered in-place.
- For `'split'` mode the classic and flow editors render side-by-side; the overlay must respect the layout boundaries (i.e., overlay only inside the classic half). This is likely automatic if the overlay is mounted inside `.GraphContainer` (which is itself inside the split half).

---

## Section F — Drag system overview

jQuery UI draggable is confirmed as the active drag system in the classic canvas. `Vertex.tsx:212` calls `$measurable.draggable(this.draggableOptions)` with a custom `options` object containing `start`/`drag`/`stop` callbacks (lines 156-211). Position updates are throttled at ~30fps via `rafThrottle` (`Vertex.tsx:179-192`) and each frame wraps the position write in a Redux `TRANSACTION`. Drag dispatches **view-internal** events: `EMeasurableEvents.onDragStart` / `whileDragging` / `onDragEnd` (`types.ts:145-160`), iterated over the view stack `for (let vid of allviews) doMeasurableEvent(...)`. There is **no** standardized `JjodelEvents.NODE_DRAG_*` for cross-component subscription; the event registry (`events/registry.ts:7-54`) lists `CLASSIC_NODE_MOUNTED` / `CLASSIC_NODE_UNMOUNTED` / `CANVAS_ELEMENT_SELECTED` / `SELECT_NODE` but no drag events. For the overlay (Fase 3b), the cleanest hook is therefore: (a) read the L-proxy `node.size` for each frame's path recompute, OR (b) subscribe to Redux store changes (since each drag tick fires a TRANSACTION). Option (b) is preferable — it is generic, works for programmatic moves too, and avoids monkey-patching jQuery UI options.

### Files examined
- `frontend/src/graph/vertex/Vertex.tsx:100-220` (draggable setup + start/drag/stop callbacks)
- `frontend/src/joiner/types.ts:145-160` (`EMeasurableEvents` enum)
- `frontend/src/events/registry.ts:1-105` (full event registry)
- `frontend/src/utils/DragThrottle.ts` (referenced via `rafThrottle`, not opened)
- `frontend/src/common/U.tsx:2417` (single ref to `$measurable.draggable('disable')`)

### Findings (raw)
- jQuery UI plugin: `Vertex.tsx:124,127,212,379` all use `$measurable.draggable(...)` API. `App.scss:210-214` styles the `.ui-draggable-dragging` helper. `common/libraries/jqui-types.ts:485-488` declares the typings.
- `Vertex.tsx:140-143`: `disabled: !(isDraggable), distance: 5, helper: () => {...}` — drag helper (ghost) is custom-sized to the node's `size`.
- `Vertex.tsx:179-192`: `rafThrottle(dragThrottleKey, callback, 32)` — 32ms throttle ≈ 30fps. Each tick: `TRANSACTION('Vertex dragging ...', () => setSize + doMeasurableEvent(whileDragging))`.
- `EMeasurableEvents` (types.ts:145):
  ```ts
  enum EMeasurableEvents {
      onDataUpdate = "onDataUpdate",
      onDragStart = "onDragStart", onDragEnd = "onDragEnd", whileDragging = "whileDragging",
      onResizeStart = "onResizeStart", onResizeEnd = "onResizeEnd", whileResizing = "whileResizing",
      onRotationStart = "onRotationStart", onRotationEnd = "onRotationEnd", whileRotating = "whileRotating",
  }
  ```
  These are KEYS into `DViewElement.onDragStart` etc. (string fields holding JS source) — not DOM events. Wired by `doMeasurableEvent(eventName, viewId)` (call site Vertex.tsx:165, 187, 208).
- `JjodelEvents` (registry.ts:7-54) — full canvas list:
  - `CANVAS_ELEMENT_SELECTED`, `SELECT_NODE`, `SELECT_VIEW_IN_WORKBENCH`, `POLYMETRIC_NODE_SELECTED`, `CHILD_CONTEXT_MENU`, `CLASSIC_NODE_MOUNTED`, `CLASSIC_NODE_UNMOUNTED`. No drag events.
- `requestAnimationFrame` direct uses: not exhaustively grepped; `rafThrottle` confirms rAF-based pacing exists.

### Open questions
- The actual implementation of `rafThrottle` (`utils/DragThrottle.ts`) was not opened. If Fase 3b needs a custom throttle for path recomputation, reading that file is recommended.
- Whether subscribing to the Redux store via `store.subscribe(...)` causes re-renders of the overlay at the same ~30fps cadence as drag is unverified. If the overlay mounts as a Redux-connected component, re-render is automatic but could be heavier. A `useSyncExternalStore` selector with a position-only subscription is likely the right primitive.

---

## Section G — Selecting a DVertex via Redux

The selection mechanism is straightforward and reusable from outside the canvas. `graphElement.tsx:920-970` (`doOnClick`) handles a node click: calls `this.props.node.toggleSelected(DUser.current)` (an L-proxy method on `LVoidVertex` / `LVertex`) inside a `TRANSACTION`, then updates `_lastSelected` via `SetRootFieldAction.new('_lastSelected', { node, view, modelElement })`. The L-proxy method handles the actual Redux mutation. For the overlay, mimicking this means: on `<path>` click, retrieve the node via `LPointerTargetable.fromPointer(vertexId)` and call `.toggleSelected(DUser.current)` + the same `SetRootFieldAction`.

### Files examined
- `frontend/src/graph/graphElement/graphElement.tsx:788-970, 1280-1290, 1431` (mousedown, doOnClick, isSelected rendering)
- `frontend/src/joiner/classes.ts:1038` (`thiss.isSelected = {};` initialization)
- `frontend/src/components/editor-v2/hooks/useJjomSelection.ts:1-110` (flow editor selection hook — different domain, do NOT touch per L2 constraints)

### Findings (raw)
- `graphElement.tsx:789`: `onMouseDown(e: React.MouseEvent): void { ... GraphElementComponent.mousedownComponent = this; ... }` — bound at `1438: onMouseDown: this.onMouseDown`.
- `graphElement.tsx:920-970` (`doOnClick`):
  - line 950-958:
    ```ts
    TRANSACTION('select', ()=>{
        this.props.node.toggleSelected(DUser.current);
        if (state._lastSelected?.node !== this.props.nodeid) {
            SetRootFieldAction.new('_lastSelected', {
                node: this.props.nodeid, view: '', modelElement: this.props.data?.id
            });
        }
    });
    ```
- `graphElement.tsx:1282-1287`: classes pushed based on `isSelected: Dictionary<Pointer<DUser>, boolean>`. CSS classes: `selected-by-me`, `selected-by-others`.
- `graphElement.tsx:1431`: `data-userselecting={JSON.stringify(props.node?.isSelected || {})}` — selection state exposed as a DOM attribute for CSS.
- `joiner/classes.ts:1038`: `thiss.isSelected = {};` — initialized empty Dictionary on construction.
- `EditorV2.tsx:683`: comment "Listen for jjodel:selectNode events from the TreeView to select nodes on canvas" — confirms `JjodelEvents.SELECT_NODE` is the cross-component selection event for the **flow** editor; the classic editor uses the direct toggleSelected API instead.

### Open questions
- The exact signature of `LVoidVertex.prototype.toggleSelected` was not opened; assumed `toggleSelected(userId: Pointer<DUser>): void` based on call site. Worth confirming during implementation.
- Whether the overlay click should preempt mousedown on the underlying node or allow event-bubbling depends on z-index resolution (Section D) and `pointer-events` policy. For Fase 3a static rendering this is moot; for Fase 3c interactive selection it must be decided.

---

## Section H — Pre-existing edge geometry: schema rich, renderer dormant

⚠️ **Critical finding**: the schema fields `edgeStartOffset`, `edgeEndOffset`, `edgeHeadSize`, `edgeTailSize`, `edgeGapMode`, `edgePointCoordMode`, `bendingMode`, `edgeStartStopAtBoundaries`, `edgeEndStopAtBoundaries`, `edgeStartOffset_isPercentage`, `edgeEndOffset_isPercentage` are present and initialized in `Constructors.DViewElement` (`joiner/classes.ts:1179-1193`). The `EdgeBendingMode` enum (`types.ts:125-135`) supports 6 values: `Line` (`L`), `Bezier_quadratic` (`Q`), `Bezier_cubic` (`C`), `Elliptical_arc` (`A`), `Bezier_QT` (`QT`), `Bezier_CS` (`CS`). However, the code that USES these fields to render an SVG `<path>` is **commented out** in `damedge.tsx:49-69` (`path()` and `pathCoords()` methods, both inside `/* */`). The active `EdgeComponent.render()` (`damedge.tsx:71-115`) only validates props and delegates to `super.render(nodeType="Edge", styleoverride, classesoverride)` — `GraphElementComponent.render()` does NOT contain `<path>` or `<svg>` JSX (grep returned zero matches in `graphElement.tsx`). The classic editor renders edges via the view's `jsxString` template, not via a hardcoded SVG path generator. **Verdict**: (c) build the L2 overlay SVG path generator from scratch, but read the existing schema fields (`bendingMode`, `edgeStartOffset`, `edgeHeadSize`, `edgeTailSize`, etc.) for visual coherence with future edge work.

### Files examined
- `frontend/src/joiner/types.ts:125-144` (EdgeBendingMode + EdgeGapMode enums)
- `frontend/src/joiner/classes.ts:1179-1199` (Constructors.DViewElement edge defaults)
- `frontend/src/graph/damedges/damedge.tsx:1-181` (full file, 181 lines)
- `frontend/src/graph/graphElement/graphElement.tsx:1100-1140` (DVoidEdge handling near line 1117 — sets `tn.longestLabel`, `tn.onDelete`, `anchorStart/anchorEnd` based on props)
- `frontend/src/common/DV.tsx:692, 1057-1058` (head path defaults referenced in default views)

### Findings (raw)
- `types.ts:125-135`: `EdgeBendingMode` enum (6 values: L, Q, C, A, QT, CS).
- `types.ts:136-144`: `EdgeGapMode` enum: `gap`, `center`, `average` (plus commented-out `autoFill`, `lineFill`, `arcFill`).
- `damedge.tsx:28-34`: `groupingsize` map declares the number of points per bending mode segment: Line=1, Bezier_quadratic=2, Bezier_cubic=3, Elliptical_arc=2.
- `damedge.tsx:49-69`: `path()` and `pathCoords()` — **both inside `/* ... */`** comment block. Their logic is preserved as documentation but not executed:
  ```ts
  /*
  path(): string {
      let coords = this.pathCoords();
      let svgletter: EdgeBendingMode = (this.props.view.bendingMode || "L");
      let strings: string[] = coords.map(gp => gp.x+" " + gp.y);
      return "M"+strings.join(" " + svgletter); }
  pathCoords(): GraphPoint[] { ... [scoord, ...coords, ecoord] ... }
  pathSegments(): GraphPoint[][]{ return U.pairArrayElements(this.pathCoords(), true); }
  */
  ```
- `damedge.tsx:71-115`: active `render()` method. Only error states and `super.render(nodeType, styleoverride, classesoverride)` with `nodeType = "Edge"`. No `<svg>`, no `<path>`.
- `graphElement.tsx`: grep for `<path|<svg|svgletter|EdgeBendingMode` returned ZERO matches. The parent class `GraphElementComponent.render()` does not generate SVG either.
- `graphContainer.tsx:24-37`: only `<svg>` references in graph module — **all inside `/* */` comment blocks** (commented-out experiments).
- `joiner/classes.ts:1179-1193` (live in `Constructors.DViewElement`):
  ```ts
  thiss.edgeStartOffset = new GraphPoint(50, 50);
  thiss.edgeEndOffset = new GraphPoint(50, 50);
  thiss.edgeStartOffset_isPercentage = true;
  thiss.edgeEndOffset_isPercentage = true;
  thiss.edgeStartStopAtBoundaries = true;
  thiss.edgeEndStopAtBoundaries = true;
  thiss.bendingMode = EdgeBendingMode.Bezier_quadratic;   // default Q
  thiss.edgeGapMode = EdgeGapMode.center;
  thiss.edgePointCoordMode = CoordinateMode.relativeOffset;
  thiss.edgeHeadSize = new GraphPoint(20, 20);
  thiss.edgeTailSize = new GraphPoint(20, 20);
  ```
- `common/DV.tsx:1057`: `v.bendingMode = EdgeBendingMode.Line;` — default-view template uses `Line` for some preset.

### Open questions
- Where does the classic editor currently render arrowheads / paths for "real" DEdges that exist via metamodels? It must be somewhere — likely via the view's `jsxString` template containing SVG markup (e.g., `<svg><path d=... /></svg>` as a string), not via a code-side generator. Confirming this by inspecting the default views (e.g., `Pointer_ViewAnchors`, default for DEdge) is a follow-up. If true, it strengthens verdict (c): there is no shared rendering pipeline to extend; L2 must build one.
- The signature of the parent `GraphElementComponent.render(nodeType, style, classes)` was not opened in detail. If it does emit a `<svg>` wrapper for `nodeType === 'Edge'`, the verdict shifts toward (b). Brief follow-up read recommended (single function body) before locking the Fase 3 plan.

---

## Final synthesis

**Splitting verdict — Fase 3 should be split into 3a/3b/3c.** The unknowns are in different layers and pollute each other if bundled: 3a (static `<path>` rendering against current state) is well-scoped given Sections A/B/C; 3b (drag interactivity) blocks on the open question in F (Redux subscription vs jQuery UI hook) and the unverified rAF behavior; 3c (selection click handling) blocks on Section D's z-index/pointer-events resolution. Doing 3a first lets us validate the geometry pipeline against the real canvas before committing to a drag strategy.

**Reusability verdict — (c) build from scratch, mimic schema.** The legacy renderer in `damedge.tsx:49-69` is fully commented out; `graphElement.tsx` does not emit SVG; `graphContainer.tsx`'s `<svg>` snippets are also commented. The schema (`bendingMode`, `edgeStartOffset`, `edgeHeadSize`, etc.) is alive in `Constructors.DViewElement` but unused at render time. L2 should write a fresh `EdgeOverlay.tsx` that READS those schema fields (so future "real" DEdge work can share visual language with L2 overlay edges) but does not depend on or extend the dormant `EdgeComponent`.

**Two confirmation reads recommended before the Fase 3a prompt**: (1) `frontend/src/graph/graphElement/graphElement.tsx` `render()` body — confirm it does NOT emit `<svg>` for `nodeType === 'Edge'`; (2) the default DEdge view's `jsxString` (one of the `Pointer_View*` constants in `common/DV.tsx`) — confirm the legacy SVG markup lives in the template, not in code. Both are sub-50-line reads.

**Discrepancy with prompt assumption (Section D)** — the panning-handle's `z-index: 100` could not be confirmed by static SCSS reading. Must be verified at runtime via DevTools before committing to an overlay z-index.
