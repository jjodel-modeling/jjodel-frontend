# Discovery (read-only) — Draggable internal-segment handles on CLASSIC editor edges

**Date**: 2026-06-08
**Phase**: discovery only (no code changed). HARD STOP at the end — no implementation until go-ahead.
**Goal**: bring the flow editor's `SegmentHandles.tsx` behaviour (one dot per internal segment of a
Manhattan edge, axis-constrained drag that repositions the segment) to the **classic** editor.

---

## 0. Executive summary (read this first)

The classic editor mounts **two independent edge renderers that draw different edges**:

| Renderer | Draws | Tech | Coordinate space | Has handles today? |
|---|---|---|---|---|
| **Legacy** `EdgeComponent`/`Edge` (`graph/damedges/damedge.tsx`) via `DefaultView.model()` jsxString | **M2 metamodel arcs** — reference / composition / aggregation / inheritance **between class nodes** (the edges styled all session: `.label`, `EdgeHead` markers) | persisted **jsxString** views + `computeRouting` in `edges/routing/classic/` | inside `<DefaultNode>`'s transformed canvas | **YES** — `EdgePoint`/`midPoints` bend points (double-click to add, free 2-D drag), persisted in Redux |
| **`EdgeOverlay`** (`components/edgeOverlay/EdgeOverlay.tsx`) | **M1 instance edges** — `DObject`↔`DObject`, for views with `isEdge===true` | **React** SVG overlay, its own routing (`buildPathFromSides` + `roundManhattanPath`) | own `<g transform>` overlay | **NO** — overlay is passive (`pointerEvents="none"`) |

`edges/routing/classic/{points,segments,markers}.ts` (the files with **uncommitted changes** in the
working tree) feed the **legacy** path only — `GraphDataElements.tsx:2369` (`computeRouting`) and
`:2245` (`computeHeadPosition`). They are **not** used by `EdgeOverlay` (which imports only
`roundManhattanPath` from `edgeUtils.ts`).

**Therefore the single gating decision is: which edges does Alfonso want handles on?**

- **(i) M2 metamodel edges** (most consistent with this whole session): renderer is the **legacy
  jsxString** path. The natural place for per-segment handles is the edge's own SVG (its jsxString),
  which means **a `VersionFixer` migration is mandatory** (§3.9) — but persistence can reuse the
  **existing** `midPoints`/`EdgePoint` write path (Redux `SetFieldAction`, **no critical-zone, no
  extra field**).
- **(ii) M1 instance edges** (`EdgeOverlay`): a **React component → no jsxString migration**, but the
  overlay is currently passive and would need selection-awareness + pointer events + a screen→canvas
  inverse transform + a new `waypoints` field. A Layer Impact Report is advisable (touches the L2
  edge model).

**Recommendation**: confirm the target first (see §7). If **(i)**, accept the jsxString migration and
reuse `midPoints` for persistence (least net-new, no critical-zone). If **(ii)**, no migration, but
more net-new interaction code in `EdgeOverlay`. **Do not assume EdgeOverlay is the target just because
it avoids a migration — it does not draw the metamodel edges this session has been about.**

---

## 1. D1 — Which component actually draws the classic-editor edges at runtime

### Mount picture (`ModelTab.tsx`)

`frontend/src/components/abstract/tabs/ModelTab.tsx:41-53` — the classic subtree is:

```
ModelTab
└─ <EditorSwitch modelid=…>                         (EditorSwitch.tsx — forwards children as classicSlot)
   └─ <div .GraphContainer position:relative>       (:46)
      ├─ <EdgeOverlay graphid={graphid} />          (:47)  ← M1 instance-edge overlay (React, passive)
      └─ <DefaultNode data={model} nodeid graphid/> (:48)  ← legacy graph tree → metamodel + M2 edges
```

`mapStateToProps` selects the non-flow graph: `graph.graphStyle !== 'v2-flow'` (`ModelTab.tsx:68`).

**`EditorSwitch.tsx`** forwards its `children` (the GraphContainer above) to `EditorV2` as
`classicSlot`. Mount conditions (per exploration of `EditorSwitch.tsx` + `EditorV2.tsx`):

| Condition | classicSlot rendered? → EdgeOverlay + legacy edges live? |
|---|---|
| No viewpoint active | NO — flow-only (`<EditorV2 hasViewpoint={false}/>`, classicSlot not passed) |
| Viewpoint active, `editorMode='flow'` | NO |
| Viewpoint active, `editorMode='classic'` | YES |
| Viewpoint active, `editorMode='split'` | YES |

So the classic edges exist only when a viewpoint is active and the mode is `classic` or `split`.

### Renderer A — `EdgeOverlay` (M1 instance edges)

`frontend/src/components/edgeOverlay/EdgeOverlay.tsx`:
- Self-contained SVG: `<svg className="jjodel-edge-overlay" pointerEvents="none">` (`:129`).
- Selector iterates `DViewElement` with **`e.isEdge === true`** (`:194-195`) and `DObject` instances
  (`:221` — `if (obj.className !== 'DObject') continue`). `isEdge` is the **L2-only** schema flag
  (separate from `appliableTo='Edge'`), introduced by VersionFixer `2.212→2.213`/`2.213→2.214`.
- Renders one `<path className="jjodel-edge-overlay__path">` (`~:407`) per qualifying M1 edge, plus a
  label (`~:415`). **Passive** — no `onMouseDown`/`onPointerDown`, `pointerEvents="none"`.
- Imports **only** `roundManhattanPath` from `../editor-v2/utils/edgeUtils` (`:4`). Uses its **own**
  routing (`buildPathFromSides`, `~:635`), **not** `edges/routing/classic`.

### Renderer B — legacy `EdgeComponent` (M2 metamodel arcs)

- `DefaultView.model()` (`frontend/src/common/DV.tsx:1216`) emits
  `<Edge … view={'Edge'+(composition?'Composition':aggregation?'Aggregation':'Association')} …/>`
  at `:1228-1274`, for `level > 1`.
- These are drawn by the legacy `Edge`/`EdgeComponent` (`frontend/src/graph/damedges/damedge.tsx:40,
  :171`) inside the `<DefaultNode>` tree.
- Geometry comes from `LVoidEdge.segments` → **`computeRouting({...})`** at
  `frontend/src/model/dataStructure/GraphDataElements.tsx:2369`, and head/tail placement from
  **`computeHeadPosition(...)`** at `:2245` — both in `edges/routing/classic/`. The marker shapes and
  `.label`/`.label-end` styling are exactly what this session has been editing.

### Verdict for D1

**Both renderers are active simultaneously in classic/split mode, but they draw disjoint edge sets.**
`EdgeOverlay` = M1 `DObject` edges (React, no migration). Legacy `EdgeComponent` = M2 metamodel
reference/composition/inheritance edges (persisted jsxString views; geometry from
`edges/routing/classic`). The "classic editor edges" worked on this session are the **legacy** ones.

---

## 2. D2 — Existing bend mechanism in the classic (legacy) path

Source: `frontend/src/model/dataStructure/GraphDataElements.tsx`, `frontend/src/graph/vertex/Vertex.tsx`,
`frontend/src/common/DV.tsx`.

### Storage
- `DVoidEdge.midPoints: InitialVertexSize[]` (D-layer field, `GraphDataElements.tsx:1853`; L-layer
  `:2128`). Each entry is a light `Partial<{id,index,x,y,w,h}>` used as the **initial position of a
  spawned `DEdgePoint` node**. Initialised `[]` in the `DVoidEdge` constructor.
- `DEdgePoint` (`GraphDataElements.tsx:1433`) is a `DVoidVertex` subclass; per-node Redux record holds
  `x,y,w,h,currentCoordType,father(→edge),graph,model`.
- `get_midnodes` returns `subElements` (`:2405-2407`) — the live bend nodes.

### `EdgeSegment` (computed, NOT persisted) — `GraphDataElements.tsx:1905-2084`
Fields: `index`, `prev`, `start`/`end` (`segmentmaker` with `.pt: GraphPoint`, `.uncutPt`, `.ge`),
`bezier[]`, `d`, `dpart`, `m` (slope), `rad`, `radLabels` (flip-corrected), `isLongest`, `label`,
`svgLetter` (`EdgeBendingMode`), `length`. Re-derived from node positions on every render;
held on `LVoidEdge.segments` (`:2322`).

### Creation
- Public stub `addMidPoint`/`addEdgePoint` (`:2261-2262`) → accessor `get_addMidPoint`/`get_addEdgePoint`
  (`:2277-2279`) → `impl_addMidPoints(val,index,c)` (`:2280-2285`):
  ```ts
  TRANSACTION('Edge: '+name+' add midpoints', () => {
    SetFieldAction.new(c.data.id, "midPoints", val, '+='+(index??''), false);
  });
  ```
  (TRANSACTION is fine here — **not** sync-layer code.)
- Bulk replace: `set_midPoints` (`:2263-2275`) → `SetFieldAction.new(c.data.id,"midPoints",val,undefined,false)`.
- Trigger today: `DV.tsx:870` — the edge `<svg onDoubleClick={() => …edge.addMidPoint(midpt)…}>`.

### Render
- `DV.tsx:924` — `edge.midPoints.map(m => <EdgePoint data={…} initialSize={m} view={"EdgePoint"} />)`.
- `EdgePoint` component: `frontend/src/graph/vertex/Vertex.tsx:531` (wrapper over `VertexConnected`,
  `isEdgePoint=true`). View `Pointer_ViewEdgePoint` (`Defaults.ts:64`,
  `redux/defaults/views.ts:751-760`, JSX from `DV.edgePointView()` at `DV.tsx:591`). First render with
  an unknown nodeid creates the `DEdgePoint` via `graphElement.tsx:~342` (`CreateElementAction`).

### Drag write-path (does NOT touch the sync layer)
- jQuery-UI Draggable configured in `Vertex.tsx:setVertexProperties` (`~:132-210`). On `stop`
  (`~:207`) → `this.setSize({x,y})` (`:422-426` → `this.props.node.size = …`).
- L-proxy `set_size` (`GraphDataElements.tsx:669`, `DEdgePoint` branch with `encodePosCoords` at
  `~:675`) → `TRANSACTION('resize…', () => SetFieldAction.new(DEdgePoint.id,"x",…)+"y")` (`:677-685`).
- **`useJjomSync.ts` is not involved** at any step (grep: zero refs to `EdgePoint`/`midPoints`/
  `midnodes`/`DEdgePoint`). The whole flow is classic Redux → D-layer → jQuery-UI → `SetFieldAction`.

**Net**: legacy classic edges already have a fully working, Redux-persisted, migration-free,
critical-zone-free bend mechanism. It differs from `SegmentHandles` in UX (double-click to add a
free-2-D-draggable node, vs auto one-handle-per-internal-segment with axis-constrained drag).

---

## 3. D3 — Shared segment geometry utilities + flow reference

`frontend/src/components/editor-v2/utils/edgeUtils.ts`:
- `interface SegmentInfo { index; midX; midY; isHorizontal }` (`:904-909`) — exactly those 4 fields.
- `interface EdgeWaypoint { segmentIndex; offset }` (`:899-902`).
- `getPathSegments(path: string): SegmentInfo[]` (`:914-932`) — parses `M`/`L`, one entry per segment,
  `isHorizontal` when `|p2.y-p1.y| < 1`.
- `roundManhattanPath(path: string, radius = 4): string` (`:512`).

**Reusability from classic**: `EdgeOverlay` already imports **only** `roundManhattanPath` (`:4`); it
does **not** import `getPathSegments`/`SegmentInfo`/`EdgeWaypoint`. Note these utils operate on an
**SVG path string**, whereas the legacy classic path exposes a richer **`EdgeSegment[]`** (with
`start/end .pt`, `m`, `length`, `isLongest`) directly on `LVoidEdge.segments` — so for the legacy
target, segment geometry is already available without `edgeUtils` (use `EdgeSegment`; reach for
`getPathSegments` only if working off a path string).

**`SegmentHandles.tsx` rules** (`frontend/src/components/editor-v2/edges/SegmentHandles.tsx`):
- `< 3` segments → no handles: `if (segments.length < 3) return []` (`:30-33`); guard
  `if (!selected || internalSegments.length === 0) return null` (`:35`).
- internal only: `segments.slice(1, -1)` (`:32`).
- axis-constrained drag (`:85-92`): horizontal segment → vertical drag (`midY+dy`, `midX` fixed);
  vertical → horizontal (`midX+dx`, `midY` fixed); cursor `ns-resize`/`ew-resize` (`:154`).
- persistence (`:110-139`): updates `edge.data.waypoints` (`EdgeWaypoint[]`), prunes
  `|offset|<=1`, then `editorCtx.onEdgeDataChange(edgeId,{data:{…,waypoints}})` (primary, `:128`) or
  `setEdges(...)` fallback (`:136-139`). **Does not** call `recalculateAnchors` (`:132`).
- **Important persistence caveat**: the flow's `data.waypoints` live **in-memory only** (ReactFlow
  edge array + `useHistory` ref), preserved across JjOM sync by the merge guard at
  `useJjomSync.ts:~1360-1362`. They are **not** written to Redux/JjOM → flow segment drags do **not**
  survive a reload. (So the classic legacy `midPoints` path is actually *more* persistent.)

---

## 4. D4 — Selection & transform in the classic renderer

### Selection
- `EdgeOverlay.tsx` has **no** selection awareness (only a doc-comment "selected" at `~:635`; no
  `isSelected` read; `EdgeData`/`EdgeRenderItem` carry only geometry/style).
- Real state: `isSelected: Dictionary<Pointer<DUser>, boolean>` on every graph element —
  `DGraphElement` (`GraphDataElements.tsx:89`), `DGraph` (`:1048`), `DVoidEdge` (`:1844`),
  `DEdge` (`:2634`), `DExtEdge` (`:2678`). Accessor `get_isSelected` (`:991-996`):
  `!!context.data.isSelected[forUser ?? DUser.current]`. Mutated by `get_select` (`:957`) /
  `get_deselect` (`:974`) via `SetFieldAction` → `state.idlookup[edgeId].isSelected`.
- To gate handles on selection: read `idlookup[edgeId].isSelected[DUser.current]` in whichever
  renderer hosts the handles.

### Pan/zoom transform (EdgeOverlay)
- `EdgeOverlay.tsx:130` — `<g transform={`scale(${sx},${sy}) translate(${tx},${ty})`}>`.
- Computed `:268-273` from `readPoint(lGraph,'offset')` and `readPoint(lGraph,'cumulativeZoom') ||
  readPoint(lGraph,'zoom') || {x:1,y:1}`; `readPoint` helper `:735-745`.
- Model source: `DGraph.offset` (`GraphDataElements.tsx:1054`), `DGraph.zoom` (`:1053`); `LGraph.offset`
  (`:1111`), `LGraph.zoom` (`:1109`); `LGraphElement.get_zoom`/`get_ownZoom` (`:305-314`).
- SVG applies right-to-left: `screen = (canvas + offset) * zoom`.

### Screen → canvas conversion
- **None exists** in `EdgeOverlay`/`edgeOverlay/` (grep for `getBoundingClientRect`/`clientX`/
  `screenTo`/`toCanvas`/`/ zoom`/`- offset` → 0 hits). Must derive the inverse of `:130`:
  ```
  canvasX = (e.clientX - svgRect.left) / sx - tx
  canvasY = (e.clientY - svgRect.top)  / sy - ty
  ```
  (flow's analogue is ReactFlow `screenToFlowPosition`, `EditorV2.tsx:1643`).
- **Note for the legacy target**: the legacy edges live inside `<DefaultNode>`'s transformed space, not
  EdgeOverlay's `<g transform>`. If handles are rendered *inside the edge's own jsxString SVG* (the
  natural option for legacy edges), they inherit the edge's coordinate space and **no screen→canvas
  conversion is needed** — drag deltas can be applied in the same units as `EdgeSegment.pt`. The
  inverse-transform problem only arises if handles are hosted in a *separate* overlay.

---

## 5. D5 — Where to persist the dragged offset (architectural choice)

### Option (a) — reuse `midPoints`/`addMidPoint` (`DEdge`/`DVoidEdge`)
- Already Redux-persisted (`set_midPoints` `:2263`, `impl_addMidPoints` `:2280` → `SetFieldAction`).
- **Native semantics** = a bend *node* (`DEdgePoint`), spawned by `DV.tsx:924` and routed *through* by
  the segment computation. It is **not** a per-segment scalar offset; `computeRouting`'s `RoutingInput`
  (`edges/routing/classic/types.ts`) has **no** `midPoints` field — midPoints reach geometry only by
  becoming `DEdgePoint` nodes in `allNodes`.
- Touches: `GraphDataElements.tsx` (+ existing `DV.tsx:924` already consumes it). **No migration**
  (field exists, `[]` is valid). **No critical-zone** (classic Redux path; `useJjomSync` ignores it).
- Risk: matching `SegmentHandles`' "move the whole segment" feel via bend-nodes is a UX/geometry
  mismatch — one dragged node adds a waypoint the router bends through, it doesn't translate a segment.

### Option (b) — new `waypoints?` (offset) field on `DVoidEdge`
- Additive optional field mirroring flow's `EdgeWaypoint{segmentIndex,offset}`; write via
  `SetFieldAction.new(edgeId,"waypoints",…)` (same path as `anchorStart`/`anchorEnd`).
- Touches: `GraphDataElements.tsx` (field + L getter/setter + pass into `RoutingInput` at the
  `:2369` call), `edges/routing/classic/types.ts` (`RoutingInput.waypoints?`),
  `edges/routing/classic/points.ts` (`chooseManhattanSidesAndWaypoints`, `~:257` — apply offsets to
  corner points), `edges/routing/classic/segments.ts` (thread it through).
- **Migration**: optional — a `c.data.waypoints ?? []` null-guard makes existing edges safe; a 5-line
  additive `VersionFixer` (style of `2.214→2.215`, `VersionFixer.tsx:695-708`) only if you want an
  explicit `[]`. **No critical-zone.**
- Pro: exact "repositions the segment" semantics, single geometry source (`computeRouting`), no
  spurious `DEdgePoint` nodes.
- Caveat (flagged): the offset→corner mapping inside `chooseManhattanSidesAndWaypoints` is non-trivial
  and must respect the segment-index convention `segments.ts` uses when building `EdgeSegment[]`.

### Persistence recommendation
- If matching flow's *visual* model exactly (one offset per internal segment, axis-constrained,
  "moves the segment") is the priority → **option (b)** (least conceptual mismatch, no migration via
  null-guard, no critical-zone).
- If minimising net-new code and reusing a proven path is the priority → **option (a)** (zero new
  fields, the drag/persist machinery already exists), accepting bend-node semantics.

**The persistence choice is independent of, and secondary to, the renderer-target choice (D1).** The
renderer choice is what determines whether a `VersionFixer` migration is unavoidable.

---

## 6. Rendering-flow diagram (classic, viewpoint active, mode=classic/split)

```
ModelTab (graphStyle!='v2-flow')
└─ EditorSwitch → classicSlot
   └─ .GraphContainer
      ├─ EdgeOverlay  ───────────────► M1 instance edges (DObject, isEdge===true)
      │     <svg pointerEvents=none>          routing: buildPathFromSides + roundManhattanPath
      │     <g transform=scale·translate>     (passive; no handles, no selection)
      │
      └─ DefaultNode (legacy graph tree)
            └─ DefaultView.model() jsxString
               └─ <Edge view='EdgeAssociation|Composition|Aggregation|…'>
                  └─ EdgeComponent (damedge.tsx)
                     ├─ geometry: GraphDataElements.get_segments → computeRouting   (edges/routing/classic)
                     ├─ heads:    computeHeadPosition                               (edges/routing/classic/markers.ts)
                     ├─ labels:   .label / .label-end / .label-start   (diagram.scss — styled this session)
                     └─ bends:    midPoints.map(<EdgePoint>)  ── draggable (jQuery-UI) ── SetFieldAction x/y
                                  (Redux-persisted; useJjomSync NOT involved)
```

---

## 7. Recommendation & decision needed

**Decision (gating, for Alfonso)** — which edges get the handles?

- **(i) Metamodel (M2) edges** — reference/composition/aggregation/inheritance between classes (the
  edges with the labels/markers worked on this session). **Recommended interpretation** given session
  continuity and the uncommitted `edges/routing/classic` changes.
  - Renderer: **legacy jsxString** (`damedge` + `edges/routing/classic`).
  - Handle host: the edge's own SVG inside `DV.edgeView()`'s jsxString (same coordinate space → no
    screen→canvas conversion). → **`VersionFixer` migration is MANDATORY** (§3.9, default-view source).
  - Persistence: **option (a)** `midPoints` reuse (no extra field, no critical-zone) — or option (b)
    `waypoints` if true segment-offset semantics are required.
  - Selection gate: `idlookup[edgeId].isSelected[DUser.current]`.
- **(ii) Model (M1) instance edges** — `DObject`↔`DObject` (`EdgeOverlay`).
  - Renderer: **React `EdgeOverlay`** → **no jsxString migration**.
  - Work needed: make the overlay interactive (drop `pointerEvents="none"` on handles), add selection
    read, derive the screen→canvas inverse transform (§4), add a `waypoints` field on the M1 edge data
    and apply it in `EdgeOverlay`'s own routing.
  - A **Layer Impact Report** is advisable (touches the L2 edge model / overlay selector).

### Layer Impact Report / migration verdict
- **(i)** → LIR recommended; **`VersionFixer` migration required** (jsxString change to
  `DV.edgeView()`); persistence via `midPoints` adds **no** migration and **no** critical-zone.
- **(ii)** → LIR advisable; **no migration** (React component + additive in-data field); no
  critical-zone, but more net-new interaction code.

### Files the implementation would likely touch (NOT modified now)
- **Common to either**: `frontend/src/model/dataStructure/GraphDataElements.tsx` (segments access;
  + `waypoints` field if option (b)); selection read (`isSelected`).
- **Target (i) legacy**: `frontend/src/common/DV.tsx` (`edgeView()` jsxString — handle elements) **+**
  `frontend/src/redux/VersionFixer.tsx` (new migration); `frontend/src/edges/routing/classic/{points,
  segments,types}.ts` (only if option (b)); possibly `frontend/src/styles/diagram.scss` (handle CSS).
- **Target (ii) EdgeOverlay**: `frontend/src/components/edgeOverlay/EdgeOverlay.tsx`
  (+ `.scss`); reuse `frontend/src/components/editor-v2/utils/edgeUtils.ts`
  (`getPathSegments`/`EdgeWaypoint`); the M1 edge data type for `waypoints`.

**HARD STOP — no implementation until Alfonso confirms the target renderer (i vs ii) and the
persistence option (a vs b).**

---

## Appendix — key file:line index
- `ModelTab.tsx:41-53,68` · `EditorSwitch.tsx` (children→classicSlot)
- `EdgeOverlay.tsx:4,129,130,194-195,221,268-273,407,735-745`
- `DV.tsx:591,870,924,1216,1228-1274` · `damedge.tsx:40,171`
- `GraphDataElements.tsx:89,669,677-685,991-996,1433,1844,1853,1905-2084,2128,2245,2261-2285,2369,2405-2407,2634`
- `Vertex.tsx:132-210,422-426,531` · `redux/defaults/views.ts:751-760` · `Defaults.ts:64`
- `edgeUtils.ts:512,899-902,904-909,914-932` · `SegmentHandles.tsx:30-35,85-92,110-139,154`
- `edges/routing/classic/{types,points,segments,markers}.ts` · `useJjomSync.ts:~1360-1362`
- `VersionFixer.tsx:695-708` (edgeRouting migration pattern)

---

# FASE A — feasibility confirmation (2026-06-08, read-only)

Target locked by Alfonso: **legacy M2 edges**, host handles in `damedge.tsx` (React), apply
offsets as a consumer-side post-process, new additive persistence field — **avoiding any jsxString
migration and any edit to `edges/routing/classic/*`**. Three claims confirmed below. **Verdict: all
three YES → the intended scope holds; no do-not-touch file is unavoidable.**

## A1 — Handle host without jsxString migration → **YES**
- `EdgeComponent.render()` (`damedge.tsx:71-115`) composes **no** SVG of its own; it delegates to
  `super.render(nodeType, styleoverride, classesoverride)` (`:114`) →
  `GraphElementComponent.render` → `renderView` (`graphElement.tsx:1343`), which compiles the
  **persisted jsxString** via `getTemplate3` (`:1369`) and returns the edge's **outer
  `<div className="edge … mainView">`** ReactElement (single root; `ref=this.html`, id=nodeid, event
  handlers; `injectProps` at `graphElement.tsx:1423-1455`). `super.render()`'s return value is that
  root element (`mainViewOutput`, `graphElement.tsx:1335-1336`).
- **Injection point**: override `EdgeComponent.render()` to capture `out = super.render(…)` and return
  `React.cloneElement(out, {}, [...React.Children.toArray(out.props.children), handlesNode])`. This
  appends handles **inside** the edge's own outer `<div>` — the same container that already holds the
  `<svg>`, the `{edge.midPoints.map(<EdgePoint/>)}` and `{decorators}` (`DV.tsx:920-926`). **The
  persisted jsxString is never touched → no `VersionFixer` migration.**
- **Coordinate space**: render handles in a sibling `<svg className="clickthrough fullscreen">` and
  position each circle with `transform: translate(${pt.x}px, ${pt.y}px)` — exactly how the existing
  edge anchors (`DV.tsx:911-919`) and segment paths are placed. Both SVGs are `fullscreen` siblings in
  the same outer div → identical coordinate frame → handles align with segments. Handles must carry
  the `clickable` class to opt back into pointer events (the outer div is `clickthrough` =
  `pointer-events:none`; `.clickable{pointer-events:all}` exists in the edge css, `DV.tsx:779-781`).
- **Selection gate** is readable here: `get_isSelected` (`GraphDataElements.tsx:991-996`) returns a
  predicate; in the component read `this.props.node.isSelected(DUser.current)` (or raw
  `idlookup[edgeId].isSelected[DUser.current]`; field at `:1844`).
- **Fase-B verification (not a blocker)**: confirm `super.render()` is a single cloneable element
  (it is) and that appended **plain SVG** handles are ignored by `UX.recursiveMap`/`injectProp`
  (`graphElement.tsx:1462-1468`) — they are not GraphElements, so child-prop injection skips them.

## A2 — Offset as consumer-side post-process → **YES**
- **Single source**: both the **visible line** (`edge.d`, via `get_d` =
  `get_segments(c).all.map(s=>s.d).join(" ")`, `GraphDataElements.tsx:2354-2355`) and the
  **clickable/segment overlay + handle positions** (`segments.all`, each `s.dpart`, rendered at
  `DV.tsx:898-899`) derive from the single consumer `get_segments_impl`
  (`GraphDataElements.tsx:2367-2385`), which calls `computeRouting`. Wrapping the `computeRouting`
  **return value** inside `get_segments_impl` updates line **and** overlay **and** handles
  consistently, because `get_d` itself calls `get_segments`. **All in the consumer
  (`GraphDataElements.tsx`); `edges/routing/classic/*` is not touched.**
- **Segment-index convention**: `segments.all` is the ordered `EdgeSegment[]`; each `EdgeSegment` has
  `index` (`:1907`) and `start`/`end` `segmentmaker`s exposing `.pt: GraphPoint` (`:1909-1911`).
  Internal segments = `all.slice(1, -1)` (mirrors `SegmentHandles.tsx:32`). Stored `segmentIndex`
  maps to `EdgeSegment.index` within `all`. Corners bounding segment *i* are shared:
  `all[i].start.pt == all[i-1].end.pt` and `all[i].end.pt == all[i+1].start.pt`. Translating segment
  *i* perpendicular = move **both** its corners by `offset` (this lengthens/shortens the two adjacent
  segments and preserves orthogonality), then rebuild the affected segments' `d`/`dpart`.
- **Path regeneration** stays in the consumer: reuse the exported, `@RuntimeAccessible`
  `EdgeSegment` constructor (`:1905,:1936`) and/or `edgeUtils.roundManhattanPath` (`edgeUtils.ts:512`)
  — both outside `edges/routing/classic`. **Fase-B complexity to flag**: faithfully reproducing
  computeRouting's rounded-corner `d`/`dpart` style is the non-trivial part; it must match the
  existing look, but is achievable without entering the routing module.

## A3 — Additive persistence field, no migration, no sync layer → **YES**
- **D-layer**: add an optional field on `DVoidEdge`, e.g.
  `segmentOffsets?: { segmentIndex: number; offset: number }[]`, next to `midPoints`/`anchorStart`/
  `anchorEnd` (all additive-optional, `GraphDataElements.tsx:1853-1859`).
- **L-layer**: getter `get_segmentOffsets(c){ return c.data.segmentOffsets ?? [] }` + setter mirroring
  `set_midPoints` (`:2263-2276`): `TRANSACTION(…){ SetFieldAction.new(c.data.id, "segmentOffsets",
  val, undefined, false) }`. Drag commit can also write directly:
  `SetFieldAction.new(edgeId, "segmentOffsets", value, undefined, false)`.
- **No migration**: the `?? []` null-guard (getter + the A2 post-process) makes existing edges
  (`segmentOffsets === undefined`) behave exactly as today.
- **No sync layer**: the write is the standard classic-edge `SetFieldAction` → Redux path.
  `useJjomSync.ts` holds **zero** references to classic-edge geometry fields (`midPoints`/`EdgePoint`/
  `midnodes`/`DEdgePoint`, verified in the main report §2) and does not read `DVoidEdge` geometry →
  the write does **not** traverse the sync layer. `TRANSACTION` is permitted here (this is the classic
  model layer, **not** sync-adjacent; §3.3 forbids TRANSACTION only in the sync zone).
- **Pruning**: offsets whose `segmentIndex >= all.length-1` (segment gone after re-route) are dropped
  in the post-process; near-zero offsets (`|offset| <= 1`) dropped on commit, mirroring
  `SegmentHandles.tsx:110-139`.

## Scope verdict
- Files Fase B will touch: **`graph/damedges/damedge.tsx`** (handles + drag + cloneElement),
  **`model/dataStructure/GraphDataElements.tsx`** (`segmentOffsets` D/L field + getter/setter +
  post-process in `get_segments_impl`), **`styles/diagram.scss`** (handle CSS, optional — inline
  styles also fine).
- **Not touched / confirmed avoidable**: `DV.edgeView()` jsxString & `redux/defaults/views.ts` (→ no
  migration), `edges/routing/classic/*` (dirty working tree — untouched), `VersionFixer.tsx`,
  `EdgeOverlay.tsx`/`editor-v2/*`, and the critical-zone (`useJjomSync`/`canvasToJjom`/
  `jjomTransformers`/`portDistribution`/`handlePosition`).
- **No Layer Impact Report required** (no sync/D-L-proxy critical-zone file modified; `GraphDataElements`
  edge geometry is classic-model, not the sync layer). **No `VersionFixer` migration required.**

**HARD STOP — Fase A complete. Awaiting Alfonso's go-ahead before implementing Fase B.**
