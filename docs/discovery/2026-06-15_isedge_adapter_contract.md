# Discovery (read-only) — isEdge derived-edge ADAPTER CONTRACT

**Date**: 2026-06-15
**Type**: docs/discovery
**Branch**: alfonso-frontend-jjtl
**Mode**: READ ONLY. No source edited. Report only.

Completes the part the 2026-06-13 coupling discovery (`2026-06-13_native-edge-mechanism-coupling.md`)
left open: the exact **duck-type contract** an off-idlookup derived edge must satisfy to render and be
selected through the native pipeline, plus the anchor-drag follow loop. Bends / midPoints /
segmentOffsets / endpoint-retarget are OUT OF SCOPE per the fixed decisions and are marked
**[dropped]** where they appear.

Every claim is cited `path:line` against the working tree on `alfonso-frontend-jjtl`. Citations that a
sub-agent swept rather than I re-opened are marked **[swept]**; here almost everything was read
line-by-line, so [swept] is rare.

> **Terminology trap resolved up front (load-bearing).** There are TWO unrelated things called "edge"
> in this code:
> 1. **The native `Edge` component** — `damedge.tsx`'s `EdgeComponent`, instantiated by the `Edge`
>    factory (`damedge.tsx:285`) with `isEdge={true}` *ownProp*, backed by a `DEdge`/`DVoidEdge`, and
>    rendering the **`EdgeAssociation` jsxString** built by `DV.edgeView` (`DV.tsx:662`). **This is the
>    "native mechanism" this discovery targets.**
> 2. **The `v.isEdge === true` *view flag*** — a model-element view (DValue/DReference) rendered AS an
>    edge with no `DVoidEdge`. Its render path (`graphElement.tsx:1408-1412`) bypasses the jsxString
>    entirely and emits `null` (overlay draws it) or an `EdgeFallbackCard`. **This is the retired
>    overlay / cross-MM fallback the fixed decisions say to keep — NOT the path under design here.**
>
> The whole contract below is about path (1).

---

## 0. How the native edge gets its object today (the spine)

Read the spine before the surfaces; every section refers back to it.

The native edge is a Redux-`connect`ed component (`damedge.tsx:280-283`). It never receives a ready
edge object as a prop. Its `node`/`edge` is (re)derived every `mapStateToProps`:

```
damedge.mapStateToProps (damedge.tsx:244-268)
  └─ GraphElementComponent.mapStateToProps(state, ownProps, DEdge, ret)   damedge.tsx:254
       └─ mapLGraphElementStuff(state, ownProps, ret, DEdge)              graphElement.tsx:378
            nodeid = ownProps.nodeid                                       graphElement.tsx:261
            dnode  = DPointerTargetable.from(nodeid, state)   // idlookup  graphElement.tsx:287
            if (!dnode && class===DEdge)  dge = DEdge.new2(...)  // MINT    graphElement.tsx:302-338
                          ret.node = ret.edge = MyProxyHandler.wrap(dge)   graphElement.tsx:339
            else          ret.node = MyProxyHandler.wrap(dnode)            graphElement.tsx:352
                          ret.edge = ret.node                              graphElement.tsx:353
```

Two facts that drive everything:

- **The edge L-proxy is always `MyProxyHandler.wrap(<D-object>)`** (`graphElement.tsx:339/352`). All
  edge members the template/routing read are **getters on the `LVoidEdge` class** that operate on a
  `LogicContext c` whose `c.data` IS that D-object (e.g. `get_segments_impl` reads `c.proxyObject`,
  `c.data.id`, `c.data.anchorStart` — `GraphDataElements.tsx:2403-2422`). There is no plain-POJO edge
  anywhere in the live path.
- **If the `nodeid` is absent from idlookup, the pipeline MINTS a `DEdge` into idlookup**
  (`graphElement.tsx:290-340`, `DEdge.new2` at `:321`). The current M2 reference edges rely on exactly
  this: they are instantiated with a **synthetic** `nodeid` like `se.id + '_with_label'`
  (`DV.tsx:1236`, `:1260`), so on first render each one mints a `DEdge` that then lives in idlookup.
  **This is precisely the mint a derived isEdge must avoid** — and it happens by default unless the
  resolution at `:287/:290` is intercepted.

`MyProxyHandler.wrap` itself does **not** require idlookup *when handed an object*: `wrap(obj)` builds a
`Proxy` over any value carrying `.className` (`joiner/classes.ts:257, 272, 274-275`). It only hits
idlookup when handed a **string pointer** (`joiner/classes.ts:258-263`, `DPointerTargetable.from` at
`:259` → `undefined` if absent). The coupling is therefore at the *resolver* (`graphElement.tsx:287`,
which passes the string `nodeid`), not at the wrapper.

---

## 1. `damedge.tsx` read surface

Every edge/`node`/`props` access in the file, grouped by function. **NEEDED** = required for a
render+select+anchor-drag-only edge. **[dropped]** = belongs to a feature out of scope (Manhattan
segment-leg drag → `segmentOffsets`).

### 1.1 `render()` (`:95-140`) — NEEDED
| Access | line | note |
|---|---|---|
| `this.props.__skipRender` | 113 | guard (dead `if(false)` branch) |
| `this.props.start?.html` | 119 | missing-start guard → error card |
| `this.props.end?.html` | 123 | missing-end guard → error card |
| `this.props.node` | 113, 120, 124, 128, 129, 131 | missing-node guard |
| `this.props.view` / `this.props.viewid` / `this.props.data` | 120, 124, 129 | only inside `Log.ee` diagnostics |
| `super.render(nodeType, styleoverride, classesoverride)` | 138 | runs the base render (executes the jsxString — see §3) |
| `this.injectSegmentHandles(out)` | 139 | wraps output to host segment handles **[dropped]** |

So the *component's own* render needs only: `start.html`, `end.html`, `node` truthy. Everything visual
comes from `super.render` → the jsxString (§3).

### 1.2 `renderSegmentHandles()` (`:160-196`) — **[dropped]** (Manhattan leg drag)
`this.props.node` (`:161`), `this.props.view` (`:162`), `view.bendingMode` (`:164`),
`node.isSelected()` (`:166`), `node.segments.segments` (`:168`), `node.segmentOffsets` (`:170`),
`node.id` (`:171`). Reads `seg.start.pt`/`seg.end.pt` off the legs (`:178`).

### 1.3 `onSegmentHandleDown()` (`:198-234`) — **[dropped]**
`this.props.node` (`:203, 218`), `node.graph` + `graph.cumulativeZoom||graph.zoom` (`:203-204`),
`node.segmentOffsets` read (`:222`), **write** `node.segmentOffsets = next` (`:230`).

### 1.4 `mapStateToProps()` (`:244-268`) — NEEDED (spine)
| Access | line | note |
|---|---|---|
| `ownProps.data`, `ownProps.start`, `ownProps.end` | 248 | early `__skipRender` if no endpoints |
| `LPointerTargetable.from(ownProps.start)` → `ret.start` | 250-251, 263 | endpoint = real vertex L-proxy |
| `GraphElementComponent.mapStateToProps(state, ownProps, DEdge, ret)` | 254 | **resolves/mints `ret.node`/`ret.edge`** (§0) |
| `state.isEdgePending.{user,source}` | 257-260 | vertex-pending overlay, not edge geometry |
| `LPointerTargetable.from(ownProps.end)` → `ret.end` | 264 | |
| `!ret.start || !ret.end` → `__skipRender` | 267 | |

`Edge` factory (`:285-291`) forwards ownProps to `EdgeConnected` with
`isEdge={true} isField={false} ...`.

**Takeaway:** damedge.tsx reads the edge object only via `this.props.node` (truthy + `isSelected()` for
the dropped handles). The geometry-bearing reads all live in the base render + the jsxString (§3) and
on `start`/`end`, which are **real vertices already in idlookup** and need no adaptation.

---

## 2. Render entry / injection feasibility

**How the edge is obtained:** exclusively through `mapStateToProps` → `mapLGraphElementStuff`
(§0). `EdgeOwnProps` (`sharedTypes.tsx:119-141`) carries only *inputs* — `data`, `start`, `end`,
`nodeid` (as `id`), `view`, `anchorStart`, `anchorEnd`, `label`, `labels`, `isReference`, `isValue`,
`isExtend`, `isEdge`. **There is no `node` / `edge` object prop.** `EdgeStateProps.node`/`.edge`
(`sharedTypes.tsx:143-145`) are *outputs* the mapper fills.

**Is there any path where the edge is passed as a prop instead of resolved from idlookup?**
No. The only object inputs are `data`/`start`/`end` (resolved to real vertices/model-elements). The
edge L-proxy is always `MyProxyHandler.wrap(<D-object resolved-or-minted by nodeid>)`
(`graphElement.tsx:287, 339, 352`). The synthetic-nodeid pattern (`DV.tsx:1236/1260`) confirms the
"derived id" idea already exists — but today it resolves to a **minted DEdge in idlookup**, not to an
off-idlookup object.

**Concretely (report only, no design):** a duck-typed edge cannot be fed to the existing
`EdgeComponent` as-is, because:
1. the component is `connect()`-wrapped and rebuilds `node` from `nodeid` every render
   (`graphElement.tsx:287`);
2. a `nodeid` not in idlookup triggers the **mint** branch (`graphElement.tsx:290-340`), which is the
   exact behavior to avoid;
3. all geometry/selection members are `LVoidEdge` getters reading `c.data` (the D-object), so the
   object must either *be* a wrappable D-like object **or** the getters must be bypassed.

What the code *does* allow without faking idlookup:
- `MyProxyHandler.wrap(obj)` accepts a synthetic object with `.className` (`joiner/classes.ts:274`),
  i.e. a wrappable adapter object is constructible **if** something hands it in at `:287/:339/:352`
  instead of `DPointerTargetable.from(nodeid)`.
- `transientProperties.node[nodeid]` is **auto-created on miss**, never a hard fault
  (`graphElement.tsx:266, 331, 345`), so a synthetic nodeid can carry transient state (§5).

Therefore the only injection points the code permits are: (a) intercept the resolver at
`graphElement.tsx:287/290` to return a synthetic node for derived ids, or (b) a **parallel render
entry** that calls the base render with an adapter `node`. Both are interceptions of the existing
component, not an existing prop path. *(Statement of what the code allows; no recommendation made.)*

---

## 3. View-template read surface (`EdgeAssociation`, `DV.tsx`)

The jsxString is executed by the base render via `getTemplate3` (`graphElement.tsx:1413`) — reached
because the `EdgeAssociation` view's `isEdge` flag is **not** `true` (no `view.isEdge=true` assignment
for it exists; `grep` empty — see §8), so it skips the `EdgeFallbackCard` branch (`:1408-1412`).

**Eval-context bindings** (what names the template can reference): `getJSXContext`
(`graphElement.tsx:679`) spreads `{...this.props, ...constants, ...usageDeclarations}`, and render sets
`context.decorators = otherViews` (`graphElement.tsx:1401`). The usageDeclarations
(`DV.tsx:950-1051`) add:
- `ret.start = edge.start` (`DV.tsx:1045`), `ret.end = edge.end` (`:1046`)
- `ret.segments = edge.segments` (`:1047`)
- `ret.position = ret.getPosition()` (`:1048`) → reads `ret.segments.all` (`:960-1027`)
- `ret.sPos` / `ret.ePos` (`:1049-1050`)
- `ret.edgeview = edge.view.id` (`:953`), `ret.view = view` (`:954`)

So inside the template `edge`/`node` = the LEdge proxy; `segments` = `edge.segments`; `view`,`data`,
`props`,`decorators`,`sPos`,`ePos` as above.

### 3.1 Members our edge NEEDS (in-scope)
| Template access | line(s) | resolves to |
|---|---|---|
| `this.edge.d` | 880, 881, 882 | `get_d` (`GraphDataElements.tsx:2369`) |
| `edge.segments` (`segments`) | UD 1047; used 899, 913, 918 | `get_segments`→`get_segments_impl` (`GraphDataElements.tsx:2398-2422`) |
| `segments.all[]` | 899 | array of legs |
| `segments.all[i].dpart` | 900 | per-leg path |
| `segments.all[i].start.pt.{x,y}` | 901, 913 | leg endpoint coords |
| `segments.all[i].end.pt.{x,y}` | 901, 918 | leg endpoint coords |
| `segments.all[i].label`, `.radLabels` | 901, 903 | segment labels |
| `segments.head.{x,y,rad,w,h}` | svgHeadTail 605-606 | `computeHeadPosition` (`segments.ts:138`) |
| `segments.tail.{x,y,rad,w,h}` | svgHeadTail 605-606 | `computeHeadPosition` (`segments.ts:139`) |
| `edge.start` (`start`) | UD 1045; 912 | `get_start` (`GraphDataElements.tsx:2188`) |
| `edge.end` (`end`) | UD 1046; 917 | `get_end` (`GraphDataElements.tsx:2201`) |
| `edge.view.id` | UD 953 | `get_view` |
| `edge.startFollow = true` | 914 | **setter** `set_startFollow` (`GraphDataElements.tsx:2527`) |
| `edge.endFollow = true` | 919 | **setter** `set_endFollow` (`GraphDataElements.tsx:2526`) |
| `props.slabel` / `props.elabel` | 886, 893 | ownProps (labels, see §8) |
| `sPos.{x,y,align}` / `ePos.{x,y,align}` | 887-888, 894-895 | derived from `segments.all` in UD |
| `decorators` | 927 | `otherViews` (`graphElement.tsx:1401`) |

`start`/`end` are real vertices (in idlookup) — no adaptation. Everything else is computed by the pure
routing engine from endpoint geometry + view + anchors (prior discovery §1), so the derived edge needs
to make `edge.segments` / `edge.d` *resolvable* — not to store them.

### 3.2 Members we are NOT rendering (bends) — **[dropped]**
| Template access | line | why dropped |
|---|---|---|
| `edge.addMidPoint(edge.start.size.tl().add(edge.end.size.tl()).divide(2))` | 871 | add-bend (no route editing). **Note:** the arg is evaluated *eagerly* at render — `edge.start.size.tl()` / `edge.end.size.tl()` are read every render even though `addMidPoint` is dropped. A derived edge must still answer `start.size`/`end.size`, or this expression must be neutralized. |
| `edge.midPoints.map(m => <EdgePoint data={edge.father.model.id} initialSize={m} .../>)` | 925 | renders bend vertices; reads `edge.midPoints`, `m.id`, `edge.father.model.id`. Dropped. |

---

## 4. Selection contract

Selection is **id-keyed and persisted as a D-field**, not local UI state.

**State:** `isSelected: Dictionary<Pointer<DUser>, boolean>` on the graph-element D-object
(`GraphDataElements.tsx:90` and the per-class redeclarations `:2726, :2770, :2815`).

**Read (selected styling at render):** the base render reads the RAW field directly and pushes CSS
classes — it does NOT go through the getter:
```
graphElement.tsx:1316  let isSelected = this.props.node.__raw.isSelected;
graphElement.tsx:1319  classes.push('selected-by-me');
graphElement.tsx:1320-1321  classes.push('selected-by-others');
```
So the contract needs `node.__raw.isSelected` to be a readable dictionary (or absent → unselected).

**Read (predicate):** `node.isSelected(user)` → `c.data.isSelected[forUser]`
(`GraphDataElements.tsx:992-997`). Consumed by the dropped segment handles (`damedge.tsx:166`) and by
toggling.

**Write (click-select):** the base mousedown handler (`graphElement.tsx:984-1004`):
```
TRANSACTION('select', () => {
  this.props.node.toggleSelected(DUser.current);          // :985
  SetRootFieldAction.new('_lastSelected', {node: nodeid, view:'', modelElement: data.id});  // :986-992
  // sibling deselect:
  let allNodes = this.props.node.graph.allSubElements;     // :996
  for (node of allNodes) if (node.id !== nid) node.deselect(DUser.current);  // :999-1002
});
```
`toggleSelected`→`select`/`deselect` write `SetFieldAction.new(c.data.id, "isSelected", map, '+='/'-=')`
inside a TRANSACTION (`GraphDataElements.tsx:958, 975`). All keyed on **`c.data.id`** (the edge id in
idlookup).

**Hover:** `onMouseEnter: this.onEnter` (`graphElement.tsx:1488`); the visible highlight is CSS-driven
via the `.hoverable` / `.clickable` / `.content` classes baked into the template (`DV.tsx:870, 900,
912, 917`). Hover is therefore **not idlookup-coupled**.

**`getRefEdges` refinement (vs prior §5.3):** `selectors.ts:160-165` (`getRefEdges`) reads
`state.refEdges` + `state.idlookup[ptr]`, but a project-wide `grep` finds **no callers in app code**
(only the definition). It is a console/JjScript helper and is **not** part of single-edge
selection/hover. The real selection coupling is the four id-keyed touches above
(`node.__raw.isSelected` read, `SetFieldAction(c.data.id,'isSelected')` write, `_lastSelected` by
nodeid, sibling deselect via `graph.allSubElements`).

**Minimal selection behaviors and where each is keyed:**
| Behavior | Mechanism | Keyed on |
|---|---|---|
| click-select | `toggleSelected` → `SetFieldAction(id,'isSelected')` | edge id (idlookup) |
| selected styling | `node.__raw.isSelected` → CSS class | edge `__raw` |
| last-selected tracking | `SetRootFieldAction('_lastSelected', {node:nodeid,...})` | nodeid |
| sibling auto-deselect | `node.graph.allSubElements` → `deselect()` | graph membership |
| hover highlight | `.hoverable`/`.clickable` CSS | none (CSS only) |

An adapter that wants selection without idlookup residency must supply `__raw.isSelected` for the read
path and redirect the `SetFieldAction`/`_lastSelected`/sibling-deselect writes — or own selection
locally. (Reported; no design.)

---

## 5. Follow / anchor-drag loop

Full trace of the in-scope draggable behavior (anchor reassignment on a fixed node). Every
idlookup-/static-/transient-keyed touch is listed.

### 5.1 The loop, end to end
1. **mousedown on the edge's anchor circle** (`DV.tsx:914` start / `:919` end):
   `edge.startFollow = true` / `edge.endFollow = true` → setter `set_startFollow`/`set_endFollow`
   (`GraphDataElements.tsx:2526-2527`) → `_set_start_endFollow` (`:2528`):
   - sets the **static** `LVoidEdge.startFollow = c.data.id` / `endFollow = c.data.id`
     (`:2532-2533`; statics declared `:2569-2570`, typed `Pointer<DVoidEdge>|undefined`);
   - attaches `mousemove_pendingEdge` + `onKeyDown_pendingEdge` listeners, sets `LVoidEdge.following`,
     `LVoidEdge.followingContext = c`, calls `showAnchors()` (`:2534-2546`).
2. **mousemove** → `mousemove_pendingEdge` (`:2609`) sets the **static**
   `DVoidEdge.isFollowingCoords = gcursorpos` (`:2622`) and force-updates the followed edge's component
   via `GraphElementComponent.map[(LVoidEdge.startFollow||endFollow)]` (`:2624`).
3. **re-render** → `get_segments_impl` (`GraphDataElements.tsx:2403-2422`) feeds routing
   `isFollowingCoords` / `startFollow` / `endFollow` (`:2416-2418`) → `computeRouting`
   (`segments.ts:42-53`) → `computePoints`. There the followed endpoint's `pt` is replaced by the
   cursor, keyed by **edge id == static pointer**:
   ```
   points.ts:106  if (isFollowingCoords){
   points.ts:107    if (edgeId === endFollow)   seg.pt = isFollowingCoords;
   points.ts:112    if (edgeId === startFollow) seg.pt = isFollowingCoords;
   ```
4. **drop onto an anchor of a node** → the target node's Anchor view fires `assignAnchor`:
   - anchor element: `onMouseUp={()=>node.events.assignAnchor(k)}` with `data-anchorName`/`data-anchorKey`
     (`DV.tsx:anchorJSX`, the element line — `common/DV.tsx:584` block, mouseup wiring confirmed via
     `redux/defaults/views.ts:804-806`).
   - `assignAnchor` → `node.assignEdgeAnchor(anchorName)` (`views.ts:805`).
   - `get_assignEdgeAnchor` (`GraphDataElements.tsx:888-907`): resolves the **following edge** from the
     static pointer `de = DPointerTargetable.fromPointer(LVoidEdge.startFollow)` (`:892`) /
     `endFollow` (`:900`); guards `de.start !== c.data.id` (`:893`) / `de.end !== c.data.id` (`:901`)
     (the NODE's id — a real vertex); then **writes** `le.anchorStart = anchorName` (`:895`) /
     `le.anchorEnd = anchorName` (`:903`) and `le.startFollow = false` / `le.endFollow = false`
     (`:896, :904`).
5. **mouseup on the anchor circle** (`DV.tsx:915` `edge.startfollow=false` / `:920`
   `edge.endfollow=false`) — **lowercase**; see §8 (dead write, the real reset is step 4 or Esc).

### 5.2 What the adapter must carry / redirect
| Touch | site | key | role |
|---|---|---|---|
| set `startFollow`/`endFollow` true | `DV.tsx:914/919` → `GraphDataElements.tsx:2528-2546` | static `LVoidEdge.startFollow` ← `c.data.id` | the follow loop identifies the edge **only** by this id |
| get `startFollow`/`endFollow` | `GraphDataElements.tsx:2523-2524` | `c.data.id === static` | render-time follow state |
| cursor coords | `GraphDataElements.tsx:2622`; consumed `points.ts:106-114` | static `isFollowingCoords`; `edgeId===startFollow/endFollow` | overrides endpoint pt |
| resolve following edge on drop | `GraphDataElements.tsx:892/900` | `DPointerTargetable.fromPointer(LVoidEdge.startFollow)` | **requires the followed-edge id to be resolvable from idlookup** — NEW id-coupling specific to anchor-drag (not in prior §5) |
| **the single persisted write** | `GraphDataElements.tsx:895/903` `le.anchorStart/anchorEnd = anchorName` | edge L-proxy setter → `SetFieldAction(c.data.id,…)` | **the one write to redirect into the derived store** |
| routing reads anchors | `GraphDataElements.tsx:2412-2413` → `points.ts:48-92` | `c.data.anchorStart/anchorEnd` | derived store feeds these |
| anchor field declarations | data: `GraphDataElements.tsx:1859-1860`; L-info: `:2511-2515` | `string \| {x,y}` | the two geometry fields the derived store holds |
| target-node anchors | `GraphDataElements.tsx:890` `c.data.anchors`; `showAnchors` `:2596-2604` | NODE (real vertex) | unchanged — endpoints stay real |

**The crux for the redirect:** the loop is driven by the **static** `LVoidEdge.startFollow/endFollow`
holding an **id**, and the drop resolves that id via `DPointerTargetable.fromPointer` (`:892/:900`) to
get an L-proxy on which it sets `anchorStart/anchorEnd`. For a derived edge whose id is not in
idlookup, that `fromPointer` returns `undefined` (`joiner/classes.ts:259-263`) and the write never
lands. So anchor-drag needs **either** the static pointer to resolve to the adapter, **or**
`assignEdgeAnchor`'s write (`:895/:903`) redirected to the derived store. This is the only
geometry write in scope.

---

## 6. DUCK-TYPE CONTRACT (primary deliverable)

The derived edge object is what becomes `this.props.node` / `this.props.edge` (the `LEdge`). Below is
the exact shape its consumers touch. **Kind**: `read` value · `getter` (computed by `LVoidEdge`, today
from `c.data`/routing) · `setter` · `raw` (read off `.__raw`). **Scope**: IN (render+select+anchor-drag)
or **[dropped]**.

> Reality check: in the live code these are NOT POJO fields — they are `LVoidEdge` getters bound to a
> `LogicContext` whose `c.data` is the idlookup D-object. The contract can be satisfied two ways:
> **(A)** a wrappable adapter object whose getters compute these (reusing the pure routing for
> `segments`/`d`), or **(B)** a precomputed POJO answering each value, with the setters/static-follow
> loop redirected. Either way the *surface* below is the invariant.

### 6.1 Render surface
| Member | Kind | Scope | Consumer(s) `path:line` |
|---|---|---|---|
| `node` truthy | read | IN | `damedge.tsx:128` |
| `start` (LVertex) | getter | IN | UD `DV.tsx:1045`; `damedge.tsx:119`; `GraphDataElements.tsx:2188` |
| `end` (LVertex) | getter | IN | UD `DV.tsx:1046`; `damedge.tsx:123`; `GraphDataElements.tsx:2201` |
| `start.html`, `end.html` | read | IN | `damedge.tsx:119, 123` |
| `start.size` / `end.size` (`.tl()`) | getter | IN* | `DV.tsx:871` (eager arg of dropped `addMidPoint` — still evaluated) |
| `d` (string) | getter | IN | `DV.tsx:880-882`; impl `GraphDataElements.tsx:2369` |
| `segments` ({all,segments,head,tail}) | getter | IN | UD `DV.tsx:1047`; impl `GraphDataElements.tsx:2398-2422` |
| `segments.all[].{dpart,d}` | read | IN | `DV.tsx:900`; `GraphDataElements.tsx:2370` |
| `segments.all[].start.pt.{x,y}` | read | IN | `DV.tsx:901, 913` |
| `segments.all[].end.pt.{x,y}` | read | IN | `DV.tsx:901, 918` |
| `segments.all[].{label,radLabels}` | read | IN | `DV.tsx:901, 903` |
| `segments.head.{x,y,rad,w,h}` | read | IN | `DV.tsx:605-606`; `segments.ts:138` |
| `segments.tail.{x,y,rad,w,h}` | read | IN | `DV.tsx:605-606`; `segments.ts:139` |
| `view` (LViewElement) | getter | IN | UD `DV.tsx:953-954`; base render |
| `view.{id,bendingMode,edgeHeadSize,edgeTailSize,edgeGapMode,edgeStartOffset,edgeStartOffset_isPercentage}` | read | IN | `DV.tsx:953`; routing `segments.ts:56-57,138-139`, `points.ts:74,97` |
| `__raw.isSelected` (dict) | raw | IN | `graphElement.tsx:1316` |
| `graph` (+ `graph.allSubElements`, `graph.zoom`) | getter | IN | `graphElement.tsx:996`; (`damedge.tsx:203-204` [dropped]) |
| `id` | read | IN | base render map `graphElement.tsx:1212`; (`damedge.tsx:171` [dropped]) |
| `addMidPoint` (callable) | getter | **[dropped]** | `DV.tsx:871` |
| `midPoints` | getter | **[dropped]** | `DV.tsx:925` |
| `father.model.id` | getter | **[dropped]** | `DV.tsx:925` |
| `segmentOffsets` (r/w) | getter/setter | **[dropped]** | `damedge.tsx:170,222,230`; `GraphDataElements.tsx:2266-2275` |

\* `start.size`/`end.size` are needed only because the dropped `addMidPoint` argument is evaluated
eagerly at render (`DV.tsx:871`); they are otherwise free since `start`/`end` are real vertices.

### 6.2 Selection surface
| Member | Kind | Scope | Consumer(s) `path:line` |
|---|---|---|---|
| `__raw.isSelected` | raw | IN | `graphElement.tsx:1316` |
| `isSelected(user)` | getter→fn | IN | `GraphDataElements.tsx:992-997`; `damedge.tsx:166` [dropped use] |
| `toggleSelected(user)` | getter→fn | IN | `graphElement.tsx:985` |
| `select(user)` / `deselect(user)` | getter→fn (writes `SetFieldAction(id,'isSelected')`) | IN | `GraphDataElements.tsx:948-978`; called `graphElement.tsx:1001` |
| `graph.allSubElements` | getter | IN | `graphElement.tsx:996` (sibling deselect) |
| (root) `_lastSelected={node:nodeid,…}` | write | IN | `graphElement.tsx:986-992` |

### 6.3 Anchor-drag surface
| Member | Kind | Scope | Consumer(s) `path:line` |
|---|---|---|---|
| `startFollow` (set true) | setter | IN | `DV.tsx:914` → `GraphDataElements.tsx:2527-2546` |
| `endFollow` (set true) | setter | IN | `DV.tsx:919` → `GraphDataElements.tsx:2526-2546` |
| `startFollow` / `endFollow` (read bool) | getter | IN | `GraphDataElements.tsx:2523-2524` |
| `anchorStart` / `anchorEnd` (`string \| {x,y}`) | value (derived store) | IN | read `GraphDataElements.tsx:2412-2413`→`points.ts:48-92`; **write** `:895/:903` |
| static `LVoidEdge.startFollow/endFollow` (id) | static | IN | set `:2532-2533`; resolve `:892/:900`; routing `points.ts:107/112` |
| static `DVoidEdge.isFollowingCoords` | static | IN | set `:2622`; routing `points.ts:106-114` |
| `startfollow`/`endfollow` (lowercase set false) | setter (MISSING) | IN(bug) | `DV.tsx:915/920` — see §8 |

### 6.4 Transient surface (auto-created, shadowable — see §5/§0)
`transientProperties.node[nodeid]` — `.longestLabel` (`GraphDataElements.tsx:2217`), `.labels`
(`:2222`), `.mainView`/`.stackViews`/`.viewScores`/`.evalContext` (`:909-917`), `.onDelete`. Created on
miss (`graphElement.tsx:266, 331, 345`); component registry `GraphElementComponent.map[nodeid]`
(`graphElement.tsx:1212`) drives `forceUpdate` (`classes.ts:4184/4188`) and follow re-render
(`GraphDataElements.tsx:2624`). **A synthetic nodeid can own this without idlookup** (no hard fault on
miss).

---

## 7. §5 reconciliation (prior discovery's four idlookup couplings, re-checked for render+select+anchor-drag)

| Prior §5 item | Verdict against the reduced feature set |
|---|---|
| **1. L-proxy creation needs D in idlookup** (`joiner/classes.ts:259`) | **CONFIRMED & refined.** True for `wrap(stringPointer)` (`:258-263`). But `wrap(object)` builds a Proxy over any `.className`-bearing object with **no idlookup check** (`:272-275`). The coupling is the *resolver* `DPointerTargetable.from(nodeid)` at `graphElement.tsx:287` (string id), and the **mint** fallback at `:290-340`. A direct adapter object is wrappable. |
| **2. `useJjomSync` enumerates from idlookup** | Out of the render/select/anchor path; not re-traced. Intentionally invisible to a derived edge (desired). Unchanged from prior. |
| **3. selection/refEdge enumeration id-keyed** (`selectors.ts:160-164`) | **REFINED.** `getRefEdges` (`:160-165`) has **no app callers** — not part of single-edge selection. The real selection coupling is `node.__raw.isSelected` read (`graphElement.tsx:1316`) + `SetFieldAction(c.data.id,'isSelected')` (`GraphDataElements.tsx:958/975`) + `_lastSelected` by nodeid (`graphElement.tsx:986`) + sibling deselect via `graph.allSubElements` (`:996`). |
| **4. render pipeline id/transient-keyed** (`damedge.tsx:244-254`; `transientProperties.node[id]`) | **CONFIRMED & refined.** Real resolution/mint is `graphElement.tsx:287/290-340/339/352` (damedge:254 only delegates). Transient is **auto-created on miss** (`:266/331/345`), so it does NOT hard-fault — it is shadowable by a synthetic nodeid. Component registry keyed by nodeid (`:1212`). |

**Additional id-coupling found in this pass (not in prior §5):** the anchor-drop write resolves the
followed edge by `DPointerTargetable.fromPointer(LVoidEdge.startFollow)` (`GraphDataElements.tsx:892`,
mirror `:900`). This requires the derived edge's id to be resolvable from idlookup, OR the
`assignEdgeAnchor` write (`:895/:903`) must be redirected. This is the single live geometry write in
scope (§5.2).

**No other idlookup-keyed edge reads** affect render+select+anchor-drag: routing/head/`d`/segments are
pure over endpoint geometry (prior §1, re-confirmed `segments.ts:20-141`, `points.ts:14-114`); hover is
CSS-only; the dropped features (segmentOffsets/midPoints/EdgePoint vertices) are the only other id-keyed
edge writes and are out of scope.

**Swept ranges from the prior doc, re-confirmed where in scope here:**
- `selectors.ts:160-164` → exact **`:160-165`**; **no callers**.
- `anchorStart/anchorEnd` decls `~1859-1860` → exact **`GraphDataElements.tsx:1859-1860`** (D fields)
  + **`:2511-2515`** (L-proxy `__info_of__`).
- `DV.tsx:914/919` follow, `:871` addMidPoint, `:925` midPoints → all exact.
- `assignEdgeAnchor` `888-907` → exact.
- `useJjomSync` retarget `~852-864` → NOT re-opened (out of scope, sync-time reconciliation).

---

## 8. Open items / flags

1. **Lowercase `edge.startfollow` / `edge.endfollow` mouseup writes** (`DV.tsx:915, 920`) have **no
   matching setter** — only capital `set_startFollow`/`set_endFollow` exist
   (`GraphDataElements.tsx:2526-2527`). These are dead writes; the real follow reset is
   `assignEdgeAnchor` (`:896/:904`) on drop, or Esc via `onKeyDown_pendingEdge` (`:2585-2586`). An
   adapter need not implement the lowercase variants, but should be aware the on-circle mouseup does
   **not** cancel a follow.
2. **`EdgeAssociation` view `isEdge` flag.** I found no assignment setting the EdgeAssociation view's
   `isEdge=true` (project `grep` for `.isEdge =` near view construction empty), which is why it renders
   via the jsxString (`graphElement.tsx:1413`) rather than `EdgeFallbackCard` (`:1408-1412`). Worth a
   one-line runtime confirmation that `transientProperties.view[<EdgeAssociation>].isEdge` is falsy,
   since the whole contract assumes the jsxString path.
3. **`props.slabel`/`props.elabel`/labels source** for a derived M1 edge. For M2 they are passed as
   ownProps (`DV.tsx:1241/1265`). The label transient (`transientProperties.node[nodeid].labels`,
   `GraphDataElements.tsx:2222`) is auto-created; how the derived edge supplies M1 labels is a design
   question, not establishable by reading.
4. **`graph` resolution for a derived edge.** Selection sibling-deselect (`graphElement.tsx:996`) and
   the dropped segment-handle zoom (`damedge.tsx:203`) read `node.graph`. For a derived edge the
   "graph" is the containing `LGraph` of its endpoints; whether `get_graph` resolves correctly for an
   off-idlookup node was not traced (the getter reads `c.data` ancestry). Flag for the adapter.
5. **Satisfaction mode (A vs B)** in §6 is a design decision and deliberately not chosen here.

---

**HARD STOP.** Report only. No source edited, no design proposed, no implementation started.
