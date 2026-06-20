# Discovery (read-only) — native edge mechanism coupling to `DVoidEdge`

**Date**: 2026-06-13
**Type**: docs/discovery
**Scope**: READ ONLY. No source edited. Maps how the native edge pipeline (template + routing
engine + handles + selection) is coupled to a persisted `DVoidEdge` and to `state.idlookup`, to
decide how isEdge edges can render through the **native mechanism** without minting a `DVoidEdge`
("native mechanism, derived persistence"). Decision context is fixed and NOT re-litigated here.

> Native applies ONLY when both endpoints resolve to real vertices. Cross-MM (ghostTargets) and
> unresolved endpoints keep the current `EdgeFallbackCard` / ghostTarget rendering.

All claims are cited `path:line` against the working tree. Where a fact could not be established by
reading, it is flagged explicitly. A handful of citations sourced from sub-agent sweeps (not
re-opened line-by-line by me) are marked **[swept]**.

---

## 1. READ path — how an edge obtains `segments` / `d` / `midPoints`

**The geometry engine is ALREADY a near-pure function, not a method bound to the D-object.**

The routing entry point is a free function:

```
frontend/src/edges/routing/classic/segments.ts:20
  export function computeRouting(input: RoutingInput): RoutingOutput
```

Its input is a plain struct (`frontend/src/edges/routing/classic/types.ts:31-46`):

```ts
interface RoutingInput {
  allNodes: LGraphElement[];            // [start, ...midnodes, end]
  edge: LVoidEdge;                      // used only shallowly — see below
  edgeId: Pointer<DVoidEdge>;
  view: LViewElement;
  innermostGraph: LGraph; rootGraph: LGraph;
  anchorStart / anchorEnd: string | {x,y} | undefined;
  longestLabel; labels;                 // label inputs
  isFollowingCoords; startFollow; endFollow;
  outer: boolean;
}
```

**How coupled is `computeRouting` to the edge being a real D-object? Shallowly.** Inside the body the
`edge` arg (`l`) is touched in only three places, none of which is geometry:

- `segments.ts:41` — `windoww.edge = l;` (debug side-effect, comment says "TODO REMOVE").
- `segments.ts:122` — `let _longestLabelData = (l as any).__raw?.longestLabel; void _longestLabelData;`
  (a preserved dead read — assigned, never used).
- `segments.ts:124` — `setLabels(ret, allNodes, longestLabel, labels, l, edgeId);` (label placement).

The actual point geometry is computed by `computePoints` (`segments.ts:42`), which is also a free
function taking no `DVoidEdge`:

```
frontend/src/edges/routing/classic/points.ts:21
  export function computePoints(allNodes, outer, edgeId, innermost, root,
                                anchorStart, anchorEnd, isFollowingCoords, startFollow, endFollow)
```

`computePoints` reads geometry exclusively from the **endpoint/midnode L-proxies** (`allNodes`):
`ge.outerSize`/`ge.innerSize` (`points.ts:35`), `ge.view` (`points.ts:40`), `ge.__raw.anchors`
(`points.ts:48-50, 60, 67, 84, 91`), and the view offsets `view.edgeStartOffset` /
`edgeStartOffset_isPercentage` (`points.ts:74, 97`). It does **not** dereference the edge D-object for
geometry. `edgeId` is forwarded but only used by the follow-coords branch and labels.

Head/tail are computed at the end of routing and are likewise pure:

```
frontend/src/edges/routing/classic/segments.ts:138-139
  rett.head = computeHeadPosition(true,  v, zoom, rett.segments[last], v.edgeHeadSize);
  rett.tail = computeHeadPosition(false, v, zoom, rett.segments[0],   v.edgeTailSize);
```

**Where the coupling actually lives: the caller, not the engine.** `computeRouting` is invoked from
the `LVoidEdge` getter machinery, which derives every input from the proxy/D-object:

```
frontend/src/model/dataStructure/GraphDataElements.tsx:2403-2422  (get_segments_impl)
  const l = c.proxyObject as LVoidEdge;
  const routed = computeRouting({
    allNodes: l.allNodes,                 // = [start, ...midnodes, end]  (get_allNodes, :2261)
    edge: l, edgeId: c.data.id,
    view: this.get_view(c),
    anchorStart: c.data.anchorStart, anchorEnd: c.data.anchorEnd,   // :2412-2413
    ...
  });
  return this.applySegmentOffsets(routed, c);   // :2421
```

- `edge.d` is `get_d` (`GraphDataElements.tsx:2369-2377`) → joins `segments.all[].d`, then
  `LVoidEdge.roundManhattanCorners` (delegates to the shared pure `round.ts`, `:2390-2391`).
- `edge.segments` is `get_segments` → `get_segments_outer` → `get_segments_impl` (`:2398-2422`).
- `edge.midPoints` is `get_midPoints` → `c.data.midPoints` (`:2265`). The bends become routing
  `allNodes` via `get_midnodes` + `get_allNodes` (`:2261`, `:2497` region) as **DEdgePoint** L-proxies.
- `applySegmentOffsets` (`:2434-2465`) post-processes the routed legs using `c.data.segmentOffsets`
  (classic draggable-leg offsets).

**Conclusion (Q1).** The READ side is essentially already
`(startVertexGeom, endVertexGeom, viewConfig, anchors, bends[]) → { d, segments, head, tail }`. The
only thing tying it to a real D-object is the *getter that assembles `RoutingInput`*
(`get_segments_impl` / `get_d` / `get_allNodes`) plus a debug line and the label path. A derived
isEdge could reuse `computeRouting`/`computePoints`/`computeHeadPosition`/`round` unchanged provided
something builds the `RoutingInput` (chiefly `allNodes` for the bends and `anchorStart/End`).

---

## 2. WRITE path — THE CRUX (drag bend / add bend / retarget)

All persisted geometry writes are **L-proxy setters keyed on the `DVoidEdge` id (`c.data.id`) via
`SetFieldAction` inside a per-setter `TRANSACTION`**. None of the user-driven geometry writes route
through `useJjomSync`/`canvasToJjom`; they are direct Redux actions on the edge D-object. There is no
generic `c.data.id` for a derived edge, so for isEdge every one of these call sites is the redirect
point.

### (a) Drag an existing bend / segment handle

There are **two** distinct drag mechanisms; both must be accounted for.

**(a1) Classic Manhattan segment-handle drag → `segmentOffsets`.** A `<circle>` handle rendered for
the selected Manhattan edge:

```
frontend/src/graph/damedges/damedge.tsx:160-196   renderSegmentHandles()  (reads node.segments, node.segmentOffsets)
frontend/src/graph/damedges/damedge.tsx:198        onSegmentHandleDown(...)  (mousedown handler)
frontend/src/graph/damedges/damedge.tsx:230        node.segmentOffsets = next;   // <-- THE WRITE (L setter)
```

`node.segmentOffsets = …` hits the proxy setter:

```
frontend/src/model/dataStructure/GraphDataElements.tsx:2267-2275  set_segmentOffsets
  TRANSACTION(... '.segmentOffsets', () => {
    SetFieldAction.new(id, "segmentOffsets", val || [], undefined, false);   // :2272  → DVoidEdge.segmentOffsets
  });
```

**(a2) EdgePoint (midPoint) drag → DEdgePoint vertex position.** Each bend is a **real `DEdgePoint`
vertex** rendered by the standard vertex pipeline:

```
frontend/src/common/DV.tsx:925
  edge.midPoints.map( m => <EdgePoint data={edge.father.model.id} initialSize={m} key={m.id} view={"EdgePoint"} /> )
frontend/src/graph/vertex/Vertex.tsx:531   export const EdgePoint = ... isEdgePoint={true}  [swept]
```

Dragging an EdgePoint moves the `DEdgePoint` vertex through the **generic GraphElement vertex-drag
write** (position/size on the DEdgePoint). I did **not** trace that vertex-drag write site to an exact
line in this pass — flagged. This is the mechanism most deeply tied to a real D-object (each bend is
itself an idlookup entity).

### (b) Add a new bend

Double-click on the edge SVG creates a midPoint:

```
frontend/src/common/DV.tsx:871
  <svg ... onDoubleClick={() => setTimeout(edge.addMidPoint(edge.start.size.tl().add(edge.end.size.tl()).divide(2)), 150)}>
```

`edge.addMidPoint` resolves to:

```
frontend/src/model/dataStructure/GraphDataElements.tsx:2292-2301
  get_addEdgePoint → impl_addMidPoints(...) :
    TRANSACTION(... ' add midpoints', () => {
      SetFieldAction.new(c.data.id, "midPoints", val, '+='+(index??''), false);   // :2298  → DVoidEdge.midPoints (append)
    });
```

The whole-array writer is `set_midPoints` (`GraphDataElements.tsx:2278-2291`,
`SetFieldAction.new(c.data.id, "midPoints", val, undefined, false)` `:2288`).

### (c) Retarget an endpoint to a different node

**Not supported as a user drag in the classic native edge.** The anchor circles only toggle a
"follow cursor" flag:

```
frontend/src/common/DV.tsx:914   onMouseDown={()=> edge.startFollow=true}
frontend/src/common/DV.tsx:919   onMouseDown={()=> edge.endFollow=true}
```

…and dropping onto a node calls `assignEdgeAnchor`, which **explicitly refuses to change the target
node** and only reassigns an anchor *within the existing endpoint*:

```
frontend/src/model/dataStructure/GraphDataElements.tsx:888-907  get_assignEdgeAnchor
  if (de.start !== c.data.id) return;  // :893  "cannot change edge targets, only an anchor within the current targets"
  le.anchorStart = anchorName;         // :895  → DVoidEdge.anchorStart  (proxy setter → SetFieldAction)
  ...
  if (de.end !== c.data.id) return;    // :901
  le.anchorEnd = anchorName;           // :903  → DVoidEdge.anchorEnd
```

The genuine endpoint setters exist but are **not wired to any drag UI**:

```
frontend/src/model/dataStructure/GraphDataElements.tsx:2189-2198  set_start  → SetFieldAction.new(c.data.id,'start',ptr,'',true)
frontend/src/model/dataStructure/GraphDataElements.tsx:2202-2211  set_end    → SetFieldAction.new(c.data.id,'end',ptr,'',true)
```

The only programmatic retarget is in the sync layer during M2-reference reconciliation
(`useJjomSync.ts`, reconcile block around `:852-864` writing `'end'` + `edgesIn` ±) **[swept]** — a
sync-time reconciliation, not a user interaction, and out of the isEdge user-drag scope.

### WRITE-path redirect list (primary output)

For isEdge to use the native mechanism with a **derived store** keyed by the M1 object id, these are
the exact call sites that must be redirected away from `SetFieldAction(DVoidEdge…)`:

| # | Interaction | Writer (redirect here) | Triggered from | D-field today |
|---|---|---|---|---|
| 1 | drag Manhattan leg | `GraphDataElements.tsx:2267-2275` `set_segmentOffsets` | `damedge.tsx:230` | `DVoidEdge.segmentOffsets` |
| 2 | add bend | `GraphDataElements.tsx:2295-2301` `impl_addMidPoints` | `DV.tsx:871` | `DVoidEdge.midPoints` (`+=`) |
| 2b | set bend array | `GraphDataElements.tsx:2278-2291` `set_midPoints` | programmatic | `DVoidEdge.midPoints` |
| 3 | drag a bend point | generic DEdgePoint vertex-drag write **(exact site not traced — flagged)** | `EdgePoint` (`DV.tsx:925`) | `DEdgePoint` position/size |
| 4 | reassign anchor | `GraphDataElements.tsx:888-907` `assignEdgeAnchor` | `DV.tsx:914/919` follow + drop | `DVoidEdge.anchorStart/anchorEnd` |
| 5 | retarget endpoint | `GraphDataElements.tsx:2189-2211` `set_start`/`set_end` | *not wired to a drag today* | `DVoidEdge.start/end` |

Items 1, 2, 2b, 4 are the live user-driven geometry writers. Item 3 (bend-as-vertex) is the one that
does **not** carry over cleanly, because a derived isEdge has no `DEdgePoint` children. Item 5 is
latent.

---

## 3. ANCHORING — auto vs persisted

**Mostly auto-computed each render, but there IS a persisted per-edge anchor selection.**

Auto path: `getAnchorOffset(size, offset, isPercentage)` returns `size.tl().add(offset)` computed
fresh each render (`points.ts:14-19`). When no explicit anchor is set, the code falls back to the
node's default anchor or the **view-level** offset:

```
frontend/src/edges/routing/classic/points.ts:67   if (!anchor) anchor = dge.anchors[0] || dge.anchors[Object.keys(dge.anchors)[0]];
frontend/src/edges/routing/classic/points.ts:74   rete.pt = getAnchorOffset(rete.size, rete.view.edgeStartOffset, rete.view.edgeStartOffset_isPercentage);
frontend/src/edges/routing/classic/points.ts:91-97 (mirror for the start side)
```

`edgeStartOffset` / `edgeEndOffset` (and `_isPercentage`) are read from the **view**, not the edge,
so 50%-center anchoring is a view default, not per-edge state.

Persisted per-edge path: `anchorStart` / `anchorEnd` live on the **edge D-object** and can be either a
named node anchor (`string`) or an explicit `{x,y}`:

```
frontend/src/edges/routing/classic/points.ts:59-68   end-side resolution of anchorEnd (string name → dge.anchors[name]; or {x,y} object)
frontend/src/edges/routing/classic/points.ts:83-92   start-side resolution of anchorStart
```

They are read into routing from `c.data.anchorStart` / `c.data.anchorEnd`
(`GraphDataElements.tsx:2412-2413`) and **written** by the user via `assignEdgeAnchor`
(`:895/903`, see §2c). Field declarations: `DVoidEdge.anchorStart` / `anchorEnd`
(`GraphDataElements.tsx:~1859-1860`) **[swept]**.

**Conclusion (Q3).** Anchoring is auto by default (50%-center from view offsets), so a derived isEdge
that never lets the user move the anchor needs **no persisted anchor state**. But the moment we want
to preserve "user dropped the endpoint on a specific side/anchor", `anchorStart`/`anchorEnd` must
also live in the **derived store** (they are genuine per-edge persisted state today). The derived
path would feed them into `RoutingInput.anchorStart/anchorEnd` instead of `c.data.anchorStart`.

---

## 4. HEAD — native size/shape, no hand-rolling

**Confirmed.** An isEdge driven by the native `EdgeAssociation` view gets the native head for free.

- **Size** from the view: `view.edgeHeadSize` (`segments.ts:138`, `markers.ts:19`). Default
  `edgeHeadSize = GraphPoint(20,20)` (`joiner/classes.ts:~1195`) **[swept]** — so 20×20 for
  Association.
- **Shape** baked into the template by `DV.svgHeadTail("head", modename)`
  (`DV.tsx:867-868`, definition `DV.tsx:602-660`), selecting an `EdgeHead.Head_*` path
  (`Head_reference` for Association, `DV.tsx:~675/1140`) **[swept]**.
- **Position/orientation** from `computeHeadPosition` (`markers.ts:11-92`), surfaced as
  `segments.head` / `segments.tail` (`segments.ts:138-139`); the template reads
  `segments.head.{x,y,rad,w,h}` via the `style` transform that `svgHeadTail` emits
  (`DV.tsx:604-607`).

So routing an isEdge through the native `EdgeAssociation` view yields the native 20×20 head,
positioned by the box-intersection recentering in `computeHeadPosition`, with **no hand-rolled
size** — exactly the parity the retired 12×12 overlay head was approximating.

---

## 5. `idlookup` coupling — what a render-only edge breaks

A render-only edge (id NOT in `state.idlookup`) breaks four classes of machinery. The **geometry math
does not need idlookup**; the **render/selection/proxy pipeline does**.

1. **L-proxy creation requires the D-object in idlookup.** `LPointerTargetable.fromPointer` →
   `wrap` → `DPointerTargetable.from(data, state)` returns `undefined` when the id is not in
   `state.idlookup` (`joiner/classes.ts:254-276`, the `from` call at `:259`) **[swept]**. So an edge
   id absent from idlookup cannot become an `LVoidEdge` at all — and the whole getter machinery in §1
   (`get_segments_impl`, `get_d`, `get_allNodes`) runs on that proxy.
   - Note: the **endpoint** proxies are fine — `get_start`/`get_end` resolve
     `LPointerTargetable.fromPointer(c.data.start/end)` (`GraphDataElements.tsx:2188, 2201`) and the
     endpoints are real vertices already in idlookup. It is the **edge itself** that's the problem.
2. **`useJjomSync` enumerates edges from idlookup.** The sync scans `for (const eid in idlookup)`
   and resolves `graph.subElements` via `idlookup[seId]` to find/classify edges
   (`useJjomSync.ts:~469-524`, incl. `isM2ReferenceEdge(se, idlookup)` `:~483`) **[swept]**. A
   render-only isEdge is invisible to this scan — which is *desirable* (we explicitly do not want sync
   to mint/manage it) but confirms it is outside the sync contract.
3. **Selection / refEdge enumeration is id-keyed.** Selection state stores pointers and resolves
   them back through idlookup; `SelectorOutput.getRefEdges` maps `state.idlookup[ptr]`
   (`redux/selectors/selectors.ts:160-164`) **[swept]**. Standard edge selection assumes the edge is
   resolvable from its id.
4. **The native render pipeline is id/transient-keyed.** The GraphElement/`damedge` path resolves the
   node from idlookup (`damedge.tsx:244-254` `mapStateToProps`) and the view machinery keys transient
   state by id (`transientProperties.node[c.data.id]`, e.g. `GraphDataElements.tsx:2217, 2222, 909`).
   A duck-typed edge that is not in idlookup cannot flow through this pipeline without faking all of
   it.

**Conclusion (Q5).** Rendering geometry can be produced for an off-idlookup edge (the engine is
pure), but **selection, L-proxy resolution, sync enumeration, and the GraphElement render pipeline
all assume idlookup residency.** Any "native mechanism, derived persistence" design must supply
those four behaviors through an adapter rather than rely on the edge living in idlookup.

---

## 6. CONCLUSION & seam map

### Recommendation: **Decouple the pipeline behind a "geometry source" interface** (not a fully ephemeral duck-typed edge).

Justification from §1–§5:

- **The READ engine is already decoupled.** `computeRouting`/`computePoints`/`computeHeadPosition`/
  `round` take structs and vertex geometry, not a `DVoidEdge` (§1, §4). Only the *assembler*
  (`get_segments_impl`/`get_d`/`get_allNodes`) and a debug/label tail tie them to the proxy.
- **The WRITE seams are few and localized** — four live setters keyed on the edge id (§2 table). They
  are natural redirect points for a derived store.
- **The deep coupling is the render/selection/proxy machinery**, which is fundamentally
  idlookup/`transientProperties`-driven (§5). A *fully* ephemeral duck-typed edge would have to fake
  `LVoidEdge` proxy creation, `transientProperties.node[id]`, selection, and the GraphElement
  component path — i.e. reconstruct the very pipeline we want to "reuse natively." That is the
  opposite of cheap, and the codebase has already shown the alternative direction: the retired isEdge
  overlay consumed the **pure** routing functions directly (`EdgeOverlay` as a read-only consumer of
  `computeHeadPosition`/`roundManhattanCorners`), and Phase 2B extracted `routing/classic/` precisely
  so both paths can share one body.

Therefore: formalize a **`EdgeGeometrySource`** seam that both a real `LVoidEdge` and a derived
isEdge satisfy — endpoints = resolved real vertices, bends + anchors = derived store keyed by the M1
object id — and (i) drive the existing pure routing from it (almost done) and (ii) redirect the
handful of write setters to the derived store when the source is derived. This avoids both minting a
`DVoidEdge` and faking idlookup residency.

A genuinely ephemeral duck-typed object is still the right tool for the **handle/selection adapter
layer** (the thin React parts in `damedge.tsx` already read `node.segments`/`node.segmentOffsets` and
write `node.segmentOffsets` — they only need `node` to satisfy the interface). The recommendation is
thus a hybrid in emphasis: *decoupled geometry-source interface for read+write, with a lightweight
in-component edge-shaped adapter feeding the existing thin handle layer.*

### Seam map — concrete functions / call-sites the chosen strategy touches

**READ (mostly satisfied; minimal change):**
- `edges/routing/classic/segments.ts:20` `computeRouting` — already struct-based. Tidy the
  edge-coupled tail: debug `windoww.edge = l` (`:41`), dead `longestLabel` read (`:122`), and ensure
  `setLabels(... l, edgeId)` (`:124`) has a derived-safe label source. No signature change required.
- `edges/routing/classic/points.ts:21` `computePoints` — pure over `allNodes`/anchors/view; **no
  change**, but the derived path must supply bend geometry as `segmentmaker`/`LGraphElement`-like
  entries (today these are `DEdgePoint` proxies).
- `edges/routing/classic/markers.ts:11` `computeHeadPosition`, `round.ts` `roundManhattanCorners` —
  already pure/shared; **no change**.
- `GraphDataElements.tsx:2403-2422` `get_segments_impl` (+ `get_d` `:2369`, `get_allNodes` `:2261`) —
  **primary READ seam.** Provide a derived assembler that builds `RoutingInput` from the
  geometry-source: real start/end vertex proxies, synthesized bend geometry, `view`, and
  `anchorStart/End` from the derived store (replacing `c.data.anchorStart/End` `:2412-2413`).

**WRITE (redirect to derived store when source is derived):**
- `GraphDataElements.tsx:2267-2275` `set_segmentOffsets` (driven by `damedge.tsx:230`).
- `GraphDataElements.tsx:2295-2301` `impl_addMidPoints` + `:2278-2291` `set_midPoints`
  (driven by `DV.tsx:871`).
- `GraphDataElements.tsx:888-907` `assignEdgeAnchor` (driven by `DV.tsx:914/919`) — derived
  `anchorStart/End`.
- `GraphDataElements.tsx:2189-2211` `set_start`/`set_end` — only if endpoint retarget is ever wired
  (latent today).
- **Bend handle (the real new work):** the `EdgePoint`-as-`DEdgePoint`-vertex mechanism
  (`DV.tsx:925`, drag via the generic vertex pipeline — exact write site not traced) does NOT carry
  over to a derived edge. Replace it with a derived-bend handle: either reuse the thin
  `damedge.tsx`-style `<circle>` handles reading/writing the geometry source, or synthesize ephemeral
  EdgePoint geometry that never enters idlookup.

**ANCHOR seam:**
- `GraphDataElements.tsx:2412-2413` — feed `RoutingInput.anchorStart/anchorEnd` from the derived store
  for derived edges.

**idlookup / SELECTION adapter (the cost both strategies pay; decouple localizes it):**
- The geometry-source adapter must provide selection/hover and proxy-shaped access without idlookup
  residency, since L-proxy creation (`joiner/classes.ts:259`), sync enumeration
  (`useJjomSync.ts:~469-524`), and selection/refEdge resolution (`selectors.ts:160-164`) all assume
  the edge is in idlookup (§5). For isEdge this is intentional: sync must NOT see the derived edge;
  selection must come through the adapter.

### Open items flagged (could not be fully established by reading in this pass)
- Exact write site of the **EdgePoint (DEdgePoint) vertex drag** (item 3 in §2) — only the render
  (`DV.tsx:925`) and component (`Vertex.tsx:531`) were located; the position/size write goes through
  the generic vertex-drag pipeline, not traced here.
- `useJjomSync` retarget line numbers (`:852-864`) and a few `[swept]` citations
  (`joiner/classes.ts:259/1195`, `selectors.ts:160-164`, `useJjomSync.ts:469-524`) come from
  sub-agent sweeps; ranges are reliable, exact lines should be re-confirmed before any edit.

---

**HARD STOP.** No implementation proposed or started beyond this map, per brief.
