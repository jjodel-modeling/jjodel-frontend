# Discovery — Manhattan routing for native Classic edges

**Date**: 2026-06-08
**Type**: READ-ONLY discovery (no source edits, no build, no template/SCSS changes).
**Goal of the eventual change (NOT this task)**: switch the native Classic edge line
from straight/diagonal to Manhattan (orthogonal) routing. This report maps where and
how the geometry is built so the real change can be scoped safely.

---

## 0. TL;DR

- The `edge` proxy used by the Classic edge view template is **`LVoidEdge`** in
  `frontend/src/model/dataStructure/GraphDataElements.tsx`.
- `edge.d` and `edge.segments` are **derived getters** on `LVoidEdge`. Both delegate to
  a self-contained routing engine extracted into
  `frontend/src/edges/routing/classic/` (entry point `computeRouting()`).
- **Current routing is NOT a single `M..L..`.** It is a list of `EdgeSegment`s, one per
  group of `allNodes` (start, user midnodes, end). With the default `bendingMode = Line`
  each segment is a single straight `L` between consecutive nodes. Bends come **only**
  from user-supplied `midPoints`/midnodes — there is **no automatic bend logic** and
  **no orthogonal/Manhattan mode** in this pipeline.
- **There is no notion of anchor SIDE (top/right/bottom/left)** in the Classic geometry.
  Attachment points are **raw points**: a percentage offset inside the node bbox
  (default 50%/50% = center), then optionally snapped to the bbox border by ray-casting
  toward the next point. To do Manhattan routing you must introduce a side concept.
- A separate, newer **`EdgeOverlay`** system (`components/edgeOverlay/EdgeOverlay.tsx`,
  mounted in `ModelTab.tsx`) **already** does `manhattan-rounded` routing for a
  *different* class of edges (declarative `view.edgeSource`/`edgeTarget` overlays, not
  `DVoidEdge`). It reuses Manhattan helpers from `editor-v2/utils/edgeUtils.ts`. This is
  documented below as prior art; per the brief, no coupling is proposed.
- **Critical-zone verdict**: the geometry files (`GraphDataElements.tsx`,
  `edges/routing/classic/*`) are **NOT** in the sync/D-L critical-zone list and are
  **NOT** sync-adjacent → no Layer Impact Report needed for them. **BUT** the edge view
  template lives in `common/DV.tsx`, a **default-view source file**: if Phase 2 edits the
  template's `jsxString`, NON-NEGOTIABLE RULE 6 / §3.9 fires (a VersionFixer migration is
  mandatory). The recommended seam (geometry-only) avoids touching `DV.tsx` entirely.

---

## 1. File / line reference map

### 1.1 The `edge` L-proxy and its geometry getters

`frontend/src/model/dataStructure/GraphDataElements.tsx`

| Symbol | Line | Role |
|--------|------|------|
| `class LVoidEdge` | 2114 | Owns the `edge` proxy used by the edge view template. |
| `get_d(c)` | 2354 | `this.get_segments(c).all.map(s => s.d).join(" ")` — merged path string (the `edge.d` observed prop). |
| `segments` field decl | 2322 | `{all, segments, fillers, head, tail}` shape. |
| `get_segments(c)` | 2362 | → `get_segments_outer` → `get_segments_impl`. |
| `get_segments_impl(c, outer)` | 2367 | Builds the routing input object and calls `computeRouting(...)`. |
| `get_points_impl(...)` | 2332 | Thin wrapper over `computePoints(...)` (also used standalone). |
| `headPos_impl(c, isHead, ...)` | 2241 | Marker placement; calls `computeHeadPosition(...)`. |
| `get_startPoint_*` / `get_endPoint_*` | 2308–2321 | Outer/inner edge endpoints via `start.startPoint` / `end.endPoint`. |
| `get_midPoints(c)` | 2260 | Reads `c.data.midPoints` (the logic instructions for midnodes). |
| `addMidPoint` / `addEdgePoint` / `impl_addMidPoints` | 2261–2286 | User-driven bend insertion (`SetFieldAction` on `midPoints`). |
| `get_midnodes(c)` | 2405 | Wraps `subElements` (the realized `LEdgePoint`s). |
| `get_allNodes(c)` | 2256 | `[start, ...midnodes, end]` — the ordered node list fed to routing. |

`class EdgeSegment` (same file)

| Symbol | Line | Role |
|--------|------|------|
| `class EdgeSegment` | 1906 | One path segment. Fields: `start/bezier/end` (`segmentmaker`), `d`, `dpart`, `m`, `rad`, `radLabels`, `label`, `isLongest`, `svgLetter`. |
| `dpart` field | 1915 | Per-segment SVG path string (what the template actually draws). |
| `m` / `rad` / `radLabels` | 1916–1918 | Slope, marker angle, label angle. |
| `makeD(index, gapMode)` | 1999 | Computes `m`, `rad`, `radLabels` and builds `dpart`/`d` from `start.pt`, `bezier[].pt`, `end.pt`. |
| `EdgeFillSegment.makeD` | 2088 | Filler-arc variant (only for gap-fill modes; inert under default `center`). |
| `segmentmaker` type | 2113 | `{size: GraphSize, view, ge, pt: GraphPoint, uncutPt: GraphPoint}` — a point + its node context. |

### 1.2 The routing engine (extracted module)

`frontend/src/edges/routing/classic/` (self-contained, last touched 2026-05-04; `index.ts` re-exports)

| File | Export | Role |
|------|--------|------|
| `segments.ts:19` | `computeRouting(input)` | Orchestrator: points → group into segments → snap → label → `makeD` → head/tail. Returns `{all, segments, fillers, head, tail}`. |
| `points.ts:21` | `computePoints(...)` | Builds the ordered point list (`segmentmaker[]`) — one entry per anchor visit; chooses attachment points. |
| `markers.ts:11` | `computeHeadPosition(isHead, view, zoom, segment, headSize)` | Head/tail marker `{x, y, w, h, rad}` via box-intersection along the first/last segment. |
| `snap.ts:12` | `snapSegmentsToBorders(v, ret, fillSegments)` | Cuts segment endpoints to node bbox borders (`closestIntersection`), per `edgeGapMode`. |
| `labels.ts:50` | `setLabels(...)` | Picks the longest segment, assigns `segment.label` for each segment. |
| `stride.ts:3` | `svgLetterSize(bendingMode,...)` | How many points each segment consumes per bending mode. |
| `types.ts` | `RoutingInput` / `RoutingOutput` | Typed I/O contract. |

### 1.3 The view template (consumer)

`frontend/src/common/DV.tsx` — `DefaultView.edgeView(...)` builds the `DViewElement`.

| Line | What |
|------|------|
| 898–903 | Path + per-segment labels: `segments.all.flatMap((s,i) => [<path d={s.dpart} />, s.label && <foreignObject … radLabels …>])`. **The path is drawn per-segment from `s.dpart`, not from the merged `edge.d`.** |
| 884–895 | Endpoint labels via `sPos`/`ePos`. |
| 910–918 | Source/target anchor circles at `segments.all[0].start.pt` and `segments.all.last().end.pt`. |
| 601–657 (`svgHeadTail`) | Head/tail markers: `<path>` placed by `transform: translate(${segments.head.x}px, ${segments.head.y}px) rotate(${segments.head.rad}rad)`, `transformOrigin: ${w/2}px ${h/2}px`. Markers carry **no `d`** here — the `d` comes from the palette (`headPath`/`tailPath`, lines 670–683); rotation is geometry-driven. |
| 958–1042 | `ret.getPosition = () => {...}` — defined **inside the template's `jsxString`**, not on the proxy. |
| 1047–1049 | `ret.position = ret.getPosition()`, `ret.sPos`, `ret.ePos`. |

---

## 2. Explicit answers

### 2a. Current routing — how is the path built? Where do bends come from?

**A list of segments, not a single `M..L..`.** Pipeline (all in `computeRouting`,
`segments.ts:19`):

1. `computePoints(allNodes, ...)` (`points.ts`) flattens `allNodes = [start, …midnodes, end]`
   into an ordered `segmentmaker[]`. Each interior node contributes **two** entries (an
   *arrival* point `rete` and a *departure* point `rets`) so the line "lands on, then
   departs from" each midnode (`points.ts:54–103`). Start contributes only a departure,
   end only an arrival.
2. The points are grouped into `EdgeSegment`s by `svgLetterSize(bendingMode)`
   (`segments.ts:57–76`). For `bendingMode = Line` the stride is 1 → **one straight
   segment per consecutive node pair**.
3. `snapSegmentsToBorders` (`snap.ts`) trims segment ends to node bbox borders.
4. `setLabels` (`labels.ts`) assigns labels.
5. Each segment's `makeD()` (`GraphDataElements.tsx:1999`) emits
   `dpart = "M sx sy, L ex ey"` for `Line` (general form `M start, <letter> bezier… end`).
6. `edge.d` = `segments.all.map(s => s.d).join(" ")` (`get_d`, line 2354).

**Bends come only from user `midPoints`/midnodes.** There is **no automatic routing
logic** — no obstacle avoidance, no orthogonalization, no auto-waypoints. The default
`bendingMode` for a fresh edge view is `Bezier_quadratic` (`joiner/classes.ts:1188`), but
`DefaultView.edgeView` overrides it to `Line` (`DV.tsx:1057`). `EdgeBendingMode`
(`joiner/types.ts:125–135`) offers only `Line` (L), `Bezier_quadratic` (Q),
`Bezier_cubic` (C), `Elliptical_arc` (A), `Bezier_QT`, `Bezier_CS`. **No Manhattan /
orthogonal member exists.** So with no midpoints, a Line edge is a single diagonal
straight line from source attachment point to target attachment point.

### 2b. Attachment points — bbox-edge intersection, center, or corner? Are sides represented?

**Raw points only; no sides.** In `computePoints` (`points.ts`):

- The base attachment is `getAnchorOffset(size, view.edgeStartOffset, isPercentage)`
  (`points.ts:74, 97`). Default `edgeStartOffset = edgeEndOffset = (50,50)` percentage
  (`joiner/classes.ts:1182–1185`) → **node center**.
- A named/explicit anchor overrides this: `dge.anchors[anchorEnd]` /
  `dge.anchors[anchorStart]` (`points.ts:59–92`); an object `{x,y}` anchor is used
  directly. Anchors are stored as fractional offsets on the D-node and resolved via
  `getAnchorOffset(size, anchor, true, 1)`.
- After grouping, `snapSegmentsToBorders` (`snap.ts:28–132`) replaces the center/anchor
  point with the **bbox-edge intersection** along the ray toward the next point
  (`GraphSize.closestIntersection(size, pt, nextPt, grid)`), gated by
  `view.edgeStartStopAtBoundaries` / `edgeEndStopAtBoundaries` (both default `true`,
  `joiner/classes.ts:1186–1187`). `uncutPt` keeps the pre-snap point.

So the *effective* attachment is "the point where the straight center-to-center (or
anchor-to-anchor) line crosses the bbox border." There is **no top/right/bottom/left side
abstraction** anywhere in this pipeline — only `GraphPoint`s. (Contrast: the v2-flow
editor *does* model sides — `handlePosition.ts`/`portDistribution.ts` — but that is a
separate system.) **Introducing a side concept is the core new work for Manhattan
routing here.**

### 2c. Marker rotation — how are `segments.head.rad` / `segments.tail.rad` computed?

In `computeHeadPosition` (`markers.ts:11`), called from `computeRouting`
(`segments.ts:106–107`): head uses `segments[last]`, tail uses `segments[0]`.

- It takes `start`/`end` reference points from the segment ends (with `useBezierPoints`
  it uses the last/first bezier control point so curved markers align to the tangent;
  `markers.ts:33–46`), computes slope `m = GraphPoint.getM(start, end)`, and sets
  `headPos.rad = Geom.mToRad(m, start, end)` (`markers.ts:75`). The marker box is then
  centered on the bbox-intersection of the segment direction (`closestIntersection`,
  `markers.ts:68–74`).
- So **marker rotation = the angle of the first/last segment** (tangent-aware for
  beziers). Under Manhattan routing the first/last segment would already be axis-aligned,
  so markers would render horizontally/vertically with no special handling — a free win.
- (Note: `EdgeSegment.makeD` also computes `this.rad = Geom.mToRad(...)` per segment at
  line 2001, but the marker uses the dedicated `computeHeadPosition` angle.)

### 2d. Labels — how does `getPosition()` derive `sPos`/`ePos` and per-segment label midpoints?

Two distinct mechanisms:

- **Per-segment labels** (drawn at `DV.tsx:900–903`): anchored at the segment midpoint
  `((s.start.pt.x + s.end.pt.x)/2, (s.start.pt.y + s.end.pt.y)/2)`, with a vertical nudge
  driven by `s.radLabels`. `radLabels = Math.atan(this.m)` (`makeD`, line 2002) — the
  un-flipped slope angle, used so the text never renders upside-down.
- **Endpoint labels `sPos`/`ePos`** (the "source/target multiplicity" labels): produced by
  `ret.getPosition()`, which is **defined entirely inside the template `jsxString`**
  (`DV.tsx:958–1042`), not on the proxy. It:
  1. Reads `ret.segments.all`; takes `p1 = first.start.pt`, `p2 = last.end.pt`.
  2. Computes a **direction sector** (1–64, `π/32` each) of the first/last segment via
     `getSector(...)` (`DV.tsx:962–970`).
  3. Looks the sector up in hardcoded `startRules` / `endRules` tables
     (`DV.tsx:980–1017`) to get a `(dx, dy, align)` offset.
  4. Returns `{start, end}`; the template sets `sPos`/`ePos` (`DV.tsx:1047–1049`) and
     renders `label-text` boxes with `align` (`DV.tsx:884–895`).

Implication for Manhattan: `getPosition` reads `start.pt`/`end.pt` directly, so it would
keep working, but its sector→offset tables were tuned for diagonal segments. The first/
last segments becoming strictly horizontal/vertical means only a handful of sectors
(roughly N/E/S/W) would ever be hit — the label offsets may want re-tuning, but **nothing
breaks**. (Re-tuning `getPosition` *would* be a `jsxString` edit → triggers the migration
rule; see §4.)

---

## 3. Reusable orthogonal / Manhattan helpers already in the repo

All of the following live in the **v2-flow** stack
(`frontend/src/components/editor-v2/utils/`) — recorded as prior art only; per the brief,
no coupling of Classic to v2 is proposed.

`editor-v2/utils/edgeUtils.ts`:
- `computeManhattanPath(...)` (`:92`) — minimum-segment Manhattan router (points → path).
- `roundManhattanPath(path, radius)` (`:512`) — adds rounded corners to an L-path string.
- `buildOrthogonalPath(...)` (`:351`) and `ensureOrthogonalEndpoints(...)` (`:389`) —
  enforce perpendicular stubs at both ends + Manhattan L-turn connector.
- `pointsToPath` / `cleanPoints` (used by the above) — polyline→`d` and degenerate-segment
  cleanup.
- A self-loop / corner-loop builder (`:639+`) and a crossing-aware variant (`:1447+`).

`editor-v2/utils/laneSeparation.ts` — global segment lane separation for orthogonal edges
(imports `computeManhattanPath`; never modifies it).

**Already-wired prior art — `EdgeOverlay` (the closest thing to a working precedent):**
- `frontend/src/components/edgeOverlay/EdgeOverlay.tsx` is a **separate** edge renderer,
  mounted in the Classic model view at `components/abstract/tabs/ModelTab.tsx:47`
  (`<EdgeOverlay graphid={graphid} />`). It draws edges declared by **view-level
  expressions** `view.edgeSource` / `view.edgeTarget` (resolved to node rects), **not** by
  `DVoidEdge`.
- It supports a real routing-mode field: `view.edgeRouting ∈ {'straight',
  'manhattan-rounded', 'bezier'}` (type at `EdgeOverlay.tsx:49`; consumed at `:238`;
  default `'manhattan-rounded'`). For `manhattan-rounded` it runs
  `chooseSides → buildPathFromSides → roundManhattanPath(raw, 8)`
  (`EdgeOverlay.tsx:352, 394–396, 644`), importing `roundManhattanPath` from
  `editor-v2/utils/edgeUtils` (`EdgeOverlay.tsx:4`). Note it **does** model sides
  (`chooseSides`/`buildPathFromSides`) — the abstraction the native pipeline lacks.
- `edgeRouting` plumbing already exists end-to-end: field declared on the view
  (`view/viewElement/view.tsx:915`), defaulted in `joiner/classes.ts:1203`, editable in
  the UI (`components/editors/views/data/InfoData.tsx:217–225`), and migrated in
  `redux/VersionFixer.tsx:702`.

> **Key distinction to carry into Phase 2.** There are *three* independent edge systems:
> (1) **native Classic** = `DVoidEdge` + `LVoidEdge.get_segments` + `edges/routing/classic`
> + the `DV.tsx` edge template — *this report's subject, straight/bezier only*;
> (2) **EdgeOverlay** = declarative `edgeSource/edgeTarget` overlay edges, *already
> Manhattan*; (3) **v2-flow** = ReactFlow `UnifiedEdge` + `edgeUtils`/`portDistribution`.
> `view.bendingMode` drives (1); `view.edgeRouting` drives (2). They do **not** share a
> code path. Do not assume an `edgeRouting`/Manhattan change to a view affects native
> Classic edges — it does not.

---

## 4. Critical-zone check

CLAUDE.md §3.1 critical-zone files: `useJjomSync.ts`, `useM1ReferenceEdges.ts`,
`syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `VersionFixer.tsx`,
`defaultViewTemplate.ts`, `DV.tsx`. Prompt's list adds `jjomTransformers.ts`,
`handlePosition.ts`.

Files that compute native-Classic `d` / `segments`:

| File | In critical-zone? | Sync-adjacent? | Verdict |
|------|-------------------|----------------|---------|
| `model/dataStructure/GraphDataElements.tsx` (`LVoidEdge`, `EdgeSegment`) | No | No | Pure L-layer geometry. No §3.2 Layer Impact Report required. |
| `edges/routing/classic/*.ts` (`computeRouting`, `computePoints`, `computeHeadPosition`, `snap`, `labels`, `stride`) | No | No | Self-contained routing module. Safe seam for a geometry-only change. |
| `common/DV.tsx` (edge view template `jsxString`) | **Yes** (§3.1 default-view runtime) | No | **NON-NEGOTIABLE RULE 6 / §3.9 applies**: any edit to the edge template's `jsxString` (e.g. retuning `getPosition`, changing how `s.dpart` is consumed) **mandates a `VersionFixer` migration** that rewrites `e.jsxString` for existing saved views, plus a detect marker in `defaultViewTemplate.ts`. |

**Net verdict:**
- A **geometry-only** Manhattan implementation — i.e. making the routing engine emit
  orthogonal bend points (either by giving `bendingMode = Line` an orthogonal variant, or
  adding a new `EdgeBendingMode`/routing flag consumed inside `computeRouting`/
  `computePoints`) — touches only `GraphDataElements.tsx` and `edges/routing/classic/*`.
  These are **outside** the sync/D-L critical zone and **not** sync-adjacent, so **no
  Layer Impact Report is required** and **no jsxString migration is needed** (the template
  already renders whatever `segments.all[].dpart` it receives). **This is the recommended
  seam.**
- The migration obligation (§3.9) is triggered **only if** Phase 2 also edits the edge
  **view template** in `DV.tsx` (path/marker/label markup or `getPosition`). Plan to avoid
  that if possible; if unavoidable, budget a `VersionFixer` migration + detect marker.
- A new `EdgeBendingMode` enum value (`joiner/types.ts:125`) would also need
  `svgLetterSize` (`stride.ts`) and the per-segment `makeD` switch
  (`GraphDataElements.tsx:2007`) to handle it — still outside the critical zone, but note
  the SVG-letter machinery assumes one letter per segment; orthogonal routing is better
  expressed as *inserting axis-aligned waypoints into the point list* (so each leg stays a
  plain `L`) than as a new path letter.

---

## HARD STOP

Report written. No source file edited, no build run, no template/SCSS touched.

---

# Phase 0 addendum (2026-06-08)

Micro-discovery for the implementation decision (new `EdgeBendingMode.Manhattan`,
waypoint insertion, migrate default edge views). READ-ONLY; no source edited. Five
questions (Q1–Q5). Line references are to the current working tree.

> **Heads-up for Phase 1 scoping.** Three of the answers below find that the prompt's
> `DOVE` list points at *almost* the right spot but not exactly: the Manhattan→Line
> normalization belongs in the **EdgeSegment constructor**, not `makeD` (Q3); the waypoint
> insertion is cleanest **called from `computeRouting` (segments.ts)**, not inside
> `computePoints` directly, because `computePoints` does not currently receive the edge
> `bendingMode` (Q2); and the explicit migration is **partly redundant** with an existing
> auto-regeneration path (Q4). None of these block the work — they refine where the edits
> land. Flagged here so the scope can be adjusted before go-ahead.

## Q1 — migration criterion: who sets `Line`, and the signature for a DEFAULT edge view

**Only one live site sets `bendingMode = Line`:** `common/DV.tsx:1057`
(`DefaultView.edgeView`). The other apparent setter, `redux/store.tsx:524`
(`ev.bendingMode = EdgeBendingMode.Line`), is **inside a `/* … */` comment block**
(store.tsx:522–526) — dead. `joiner/classes.ts:1188` sets the *base* view default to
`Bezier_quadratic` (not Line). So no view other than `DefaultView.edgeView` sets Line.

**Default edge views have stable, source-assigned IDs.** `DefaultView.edgeView` calls
`DViewElement.new2("Edge"+name, jsx, vp, …, false, 'Pointer_ViewEdge' + name)`
(`DV.tsx:1053, 1065`). The `name`s come from `redux/store.tsx:510–515`
(`makeEdgeView(...)`): `Association`, `Dependency`, `Inheritance`, `Aggregation`,
`Composition`, and `""`. So the persisted default edge views are exactly:

```
Pointer_ViewEdgeAssociation
Pointer_ViewEdgeDependency
Pointer_ViewEdgeInheritance
Pointer_ViewEdgeAggregation
Pointer_ViewEdgeComposition
Pointer_ViewEdge            (empty name)
```

(Confirmed present in serialized fixtures, e.g. `examples/second.ts` `viewelements`.)
All set `appliableTo = 'Edge'` (`DV.tsx:1056`) and `bendingMode = 'L'` (`DV.tsx:1057`).
User-created edge views get timestamp-style generated IDs
(e.g. `1695991481479_Pointer1695991375926_93936`), never `Pointer_ViewEdge*`. **The ID
prefix is therefore the discriminator between default and user-custom edge views** — see
the full predicate in Q5.

## Q2 — waypoint insertion point + snap decision

**Where to insert.** The cleanest seam is **`computeRouting` in `segments.ts`**, calling
a helper exported from `points.ts`, applied to the assembled point list `all[]`
**before** the segment-grouping loop (`segments.ts:61–76`). Reason: the insertion needs
the edge's `bendingMode`, and `computeRouting` already has it (`bm = v.bendingMode`,
`segments.ts:55`). `computePoints` itself does **not** receive `bendingMode` today
(`points.ts:21–32`); putting the logic literally inside `computePoints` (as the prompt's
DOVE #2 implies) would require threading a new `bendingMode`/`view` parameter through
**two** call sites — `segments.ts:41` *and* `GraphDataElements.tsx:2332`
(`get_points_impl`). The latter is outside the Phase-1 "makeD-only" budget for that file.
**Recommendation:** define `chooseManhattanSidesAndWaypoints(...)` in `points.ts` (per the
brief) but **invoke it from `computeRouting`**, not from inside `computePoints`. (The
`get_points_impl` debug path then simply won't show Manhattan, which is fine — it's a
debug-only getter, not the live render path.)

**Critical structural constraint — waypoints must be inserted as DOUBLED pairs.** The
grouping loop advances `i += increase + 1` (`= i += 2` for stride-1/Line, `segments.ts:73`)
because every *interior* node is listed **twice** in `all[]` — once as an arrival point
(`rete`) and once as a departure point (`rets`) at the same coordinate
(`points.ts:54–103`). A naive single-point insertion would be **skipped** by the `+2`
stride and the leg past it would be dropped. So each Manhattan corner must be pushed as a
pair `[corner_arrival, corner_departure]` (same `pt`), exactly mirroring the midnode
convention. Verified by tracing the loop: `all=[s, c, c, e]` (len 4) → segments
`s→c`, `c→e`; a single `c` (`all=[s, c, e]`, len 3) → only `s→c`, the `c→e` leg is lost.

**Snap: NO Manhattan branch needed (recommended), `Line` snap left untouched.** Choose the
side-exit *upstream* by placing the first/last corner **axis-aligned with the source/target
node centers**. The existing `snapSegmentsToBorders` start-cut
(`snap.ts:28–35`: `closestIntersection(ret[0].start.size, ret[0].start.pt,
(ret[0].bezier[0]||ret[0].end).pt)`) and end-cut (`snap.ts:128–132`) ray-cast from the node
center toward the *next* point. If that next point is axis-aligned with the center, the ray
is horizontal/vertical and `closestIntersection` returns the **side-midpoint** — precisely
the orthogonal exit we want — with zero snap changes. The dominant-axis side choice
(`|dx| ≥ |dy|` → left/right, else top/bottom) determines which center-axis the first/last
corner aligns to.
- One caveat to handle in Phase 1: the inserted corners are **coordinate-only** (not real
  nodes). Give them a degenerate size (as the `isFollowingCoords` path already does:
  `new GraphSize(pt.x, pt.y, 0.01, 0.01)`, `points.ts:110/115`) so the default
  `edgeGapMode = center` middle-segment branch (`snap.ts:101–107`, `doStartCut/doEndCut =
  false`) passes them through unchanged and never cuts a corner. If artifacts appear, the
  fallback (option a) is a small Manhattan guard in `snap.ts` that skips cutting
  coordinate-only corners — but option (b) above should suffice.

## Q3 — `makeD` + `svgLetterSize` + markers

**`svgLetterSize` (stride.ts): add `case Manhattan` next to `case Line` → stride
`{first:1, others:1}`.** Confirmed: `svgLetterSize` switches on the raw bending-mode string
(`stride.ts:9–22`); Manhattan must land in the `Line` arm to get one straight leg per
point pair. ✓ (matches DOVE #4).

**`makeD` itself needs NO change — the real edit is the EdgeSegment CONSTRUCTOR.**
`makeD` switches on `this.svgLetter.length` (`GraphDataElements.tsx:2007`), and emits a
plain `L` for `case 1` (`:2013–2019`). But `svgLetter` is resolved in the **constructor**
(`:1948–1983`), not in `makeD`. For a segment built with `bendingMode = Manhattan`
(passed from `computeRouting`, `segments.ts:70`), the constructor falls through to the
`default → case Bezier_QT/Bezier_CS` arm (`:1976–1982`) and hits
`Log.exDevv("this svg letter should not appear here")`, leaving `svgLetter = 'Manhattan'`
(length 9). `makeD` then takes its `default` arm and logs
`"unexpected bending mode length"` — the segment fails to render.
**Required fix:** in the constructor's fix-up switch (`~:1961`), add
`case EdgeBendingMode.Manhattan: this.svgLetter = EdgeBendingMode.Line; break;` so the
segment normalizes to `'L'`. `makeD`'s existing `case 1` (`L`) then handles it with **zero
`makeD` changes**. This is still in `GraphDataElements.tsx` (the allowed file) but in the
constructor, not `makeD` — a small correction to DOVE #5.
- *Even-more-minimal alternative (flag for decision):* pass `EdgeBendingMode.Line` to
  `new EdgeSegment(...)` and to `svgLetterSize(...)` from `computeRouting` when
  `bm === Manhattan` (Manhattan legs *are* straight lines). That would leave
  `GraphDataElements.tsx` **and** `stride.ts` entirely untouched, confining every
  Manhattan-specific edit to `segments.ts` + `points.ts` + the enum + `DV.tsx` +
  `VersionFixer`. Trade-off: the `EdgeSegment` no longer "knows" it is Manhattan (fine for
  sharp-corner MVP; revisit if/when rounded corners need per-segment fillet logic).

**Markers: no change.** `computeHeadPosition` derives `rad` from the first/last segment
direction via `Geom.mToRad(m, start, end)` (`markers.ts:41, 75`). With axis-aligned
first/last legs, `m ∈ {0, ±∞}` → `rad ∈ {0, ±π/2, π}`. Axis-aligned directions already
occur today in `Line` mode (vertically/horizontally aligned nodes) and render correctly,
so the marker math already handles them. ✓

## Q4 — does `updateDefaultView` regenerate `bendingMode`? (the YES/NO decision)

**It regenerates the ENTIRE view from source, preserving only `pointedBy` + `subViews`.**
`LViewElement.updateDefaultView` (`view/viewElement/view.tsx:1739–1757`):
```
let newView = Defaults.defaultViewPointsMap[v.id] || Defaults.defaultViewsMap[v.id];  // :1741
if (!newView) return;                          // not a default view → skip   :1742
newView = {...newView};                        // fresh source view (full copy) :1743
newView.css_MUST_RECOMPILE = true;             // :1744
newView.pointedBy = PointedBy.merge(newView, v);   // preserve refs            :1745
newView.subViews = {...newView.subViews, ...v.subViews};  // merge subviews    :1746
s.idlookup[v.id] = newView;                    // WHOLESALE REPLACE             :1747
```
So **every scalar field — including `bendingMode` — comes from the fresh source view**
(`Defaults.defaultViewsMap[v.id]`), which is built from the bootstrap-generated defaults
(`reducer.ts:1098`; `common/Defaults.ts:89`) i.e. from `DefaultView.edgeView` with the
*new* default. Only `pointedBy` and `subViews` survive from the persisted view.

**`updateDefaultView` fires only for UNTOUCHED defaults, and only on a version bump.**
The caller gate is `VersionFixer.update` (`VersionFixer.tsx:131–140`):
`v.className` is a View AND `v.version !== VersionFixer.highestVersion` AND
**`!v.clonedCounter`** (`:137`). `clonedCounter` is `undefined` for an untouched default
and set once the user edits the view.

**Answer:**
- **YES** for *untouched* default edge views (`clonedCounter` undefined): after changing
  `DV.tsx:1057` to `Manhattan` **and bumping the schema version** (so `version !==
  highestVersion`), `updateDefaultView` replaces them wholesale and they pick up
  `bendingMode = Manhattan` with **no explicit field-setting migration**. Evidence:
  view.tsx:1741–1747 + VersionFixer.tsx:137.
- **NO** for *touched/cloned* default edge views (`clonedCounter` set): `updateDefaultView`
  **skips** them (VersionFixer.tsx:137), so they keep `bendingMode = Line` unless an
  explicit migration sets it.

**Consequence for Phase 1 scope (important):** we **cannot** simply "change `DV.tsx` and do
nothing else" — a schema-version bump is mandatory to trigger regeneration, and a version
bump *is* adding a `VersionFixer` method (even a no-op `'2.220 -> 2.221'(s){ return s }`).
So the choice is really:
- **(A) version-bump-only** (no-op migration): relies on `updateDefaultView`. Covers
  untouched defaults; **leaves touched default edge views diagonal.** Simpler.
- **(B) explicit field migration** `'2.220 -> 2.221'` that sets `bendingMode = Manhattan`
  on the Q5 signature: covers **both** untouched and touched defaults, is idempotent and
  self-documenting, and does not depend on the `clonedCounter`/regeneration timing. For
  untouched views its effect is redundant (the later `updateDefaultView` overwrites them
  with the same Manhattan source anyway), so there's no conflict; its *unique* value is
  flipping the **touched** defaults a user merely recolored/repositioned but never
  deliberately set to `Line`.

**Recommendation: option (B)** — it matches the prompt's stated intent ("existing default
edge views are migrated… user-custom Line views are left untouched") more completely,
because a touched-but-default edge view is still a *default* edge view by ID and the user
never chose `Line` for it. The `bendingMode === Line` guard in the signature is what
preserves any *deliberate* user choice of another mode. Final call is Alfonso's.

> Note: this resolves the apparent tension with CLAUDE.md §3.9. §3.9 mandates a migration
> when touching default-view source precisely because the version bump drives
> `updateDefaultView` (for untouched views) — and the explicit migration additionally
> reaches touched views. Here the field is a scalar (`bendingMode`), so the explicit
> migration **sets a field** rather than rewriting `jsxString`. The `jsxString` markup is
> **not** changed by this work, so no detect-marker / markup rewrite is needed.

## Q5 — predicate: select default EDGE view, EXCLUDE the edgepoint view

Both `Pointer_ViewEdge*` (edge views) and `Pointer_ViewEdgePoint` (edgepoint view) share
the `Pointer_ViewEdge` prefix. The discriminator is **`appliableTo`**:
- Default edge views: `appliableTo === 'Edge'` (`DV.tsx:1056`).
- Edgepoint view (`Pointer_ViewEdgePoint`): `appliableTo === 'EdgePoint'`
  (`redux/defaults/views.ts:752`), and it does **not** set `bendingMode` (so its value is
  the base `Bezier_quadratic`, not `Line`).

**Do NOT key on `isEdge`.** `isEdge` is the **L2 EdgeOverlay** flag (default `false`,
`joiner/classes.ts:1200`; consumed by `EdgeOverlay.tsx:212` and `defaultViewTemplate.ts`),
unrelated to native edge views — `DefaultView.edgeView` never sets it, so it stays `false`
on real edge views and is useless as a discriminator.

**Recommended predicate (for the option-B migration; also a sanity check under option A):**
```js
e &&
typeof e === 'object' &&
e.className === 'DViewElement' &&
typeof e.id === 'string' &&
e.id.startsWith('Pointer_ViewEdge') &&   // default edge views (NOT user-created → timestamp ids)
e.appliableTo === 'Edge' &&              // EXCLUDES Pointer_ViewEdgePoint (appliableTo === 'EdgePoint')
e.bendingMode === EdgeBendingMode.Line   // 'L' — idempotent; preserves any deliberate user-chosen mode
```
This matches the six default edge view IDs from Q1 (including the empty-name
`Pointer_ViewEdge`), excludes `Pointer_ViewEdgePoint`, excludes user-created edge views,
and is idempotent (re-running it finds nothing once they are `Manhattan`).

## HARD STOP (Phase 0)

Addendum written. No source file edited, no build run, no template/SCSS/migration touched.
Awaiting explicit go-ahead before Phase 1.
