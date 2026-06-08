# Discovery — Edge routing: anchor spacing & global segment lane separation

> **Phase 1 — READ-ONLY.** No source code modified. This document + the log entry are the
> only writes. Hard stop after the report; Phase 2 needs explicit go-ahead.

**Branch**: `alfonso-frontend-jjtl` · **HEAD**: `b2dd853b2` · **Date**: 2026-06-06
**Working tree**: no `editor-v2` files modified vs HEAD (routing code is at its committed state).

## Pre-flight findings

- **June-5 work IS present in the tree** (verified, not assumed):
  - Pair-stable edge-id tiebreak in `computeSidePositions` → `handlePosition.ts:223-235` (`byPairStable`/`byGeometry`), committed `f8fe3e2eb` (2026-06-05 16:14, *"fix: align paired edge anchors via pair-stable tiebreak"*). The comment at `:217-219` explicitly names it the fix for "the diagonal jog (defects 2 & 3)".
  - `deconflictBidirectionalEdges` generalized beyond A↔B pairs → `useAutoAnchor.ts:56-116` (comment `:50-51`: *"Name retained for historical continuity even though the scope is no longer limited to bidirectional pairs"*). Present.
- No conflict with `CLAUDE.md`. `handlePosition.ts` and `portDistribution.ts` are critical-zone and were **read only**, never edited.

---

## Answers

### D1 — Orthogonal path construction

**Where.** The orthogonal path is **not** built in `UnifiedEdge.tsx`; it is built in the pure
module **`components/editor-v2/utils/edgeUtils.ts`**, function **`computeManhattanPath`**
(`edgeUtils.ts:92-135`). `UnifiedEdge.tsx` only *calls* it at `:201-204`:

```ts
const rawPath = useMemo(
  () => computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide),
  [sourceX, sourceY, sourceSide, targetX, targetY, targetSide]);
```

**Custom builder, not ReactFlow.** Global grep for `getSmoothStepPath` / `getStepPath` /
`getBezierPath` / `getSimpleBezierPath` / `getStraightPath` returns **zero hits** anywhere in
`frontend/src`. The router is hand-written:

- `computeManhattanPath` classifies the side pair (`categorizeSidePair`, `:137-142`) and
  dispatches to `routeOppositeH` / `routeOppositeV` / `routeSameSide` / `routeAdjacent`
  (`:144-331`), producing a **point array** of 2–6 points (straight / Z / L / U-detour).
- `ensureOrthogonalEndpoints` (`:389-444`) + `buildOrthogonalPath` (`:351-376`) force the
  first/last segments perpendicular to the node side, inserting stub points
  (`STUB_LENGTH = 20`).
- `cleanPoints` (`:38-75`) dedups/de-collinearizes, then `pointsToPath` (`:1036-1043`)
  serializes to the `M…L…` string.

**Waypoints ARE exposed as a manipulable point array** — and this is the most important D1
finding for lever 2. Inside `UnifiedEdge` the path is processed as an explicit point list
before serialization (`UnifiedEdge.tsx:206-221`):

```
rawPath ──parsePathPoints──▶ rawPoints[]  ──applyWaypoints──▶ adjustedPoints[]
        ──applyBundleSpread──▶ spreadPoints[]  ──pointsToPath──▶ spreadPath (string)
```

So at `spreadPoints` we have a real `{x,y}[]` that downstream code already mutates
(`applyWaypoints`, `applyBundleSpread`). There are two distinct "waypoint" notions:

1. **`EdgeWaypoint` = `{ segmentIndex, offset }`** (`types.ts:123-126`), stored in
   `edge.data.waypoints`, authored by the user via `SegmentHandles`, applied by
   `applyWaypoints` (`edgeUtils.ts:941-973`). Manipulable, persisted per edge.
2. **The transient `spreadPoints[]`** computed per render — manipulable but ephemeral.

**Per-edge scope.** The computation is **strictly per-edge**: its only inputs are that edge's
own `sourceX/Y/targetX/Y`, `sourceSide/targetSide`, its own `data.waypoints`, and its own
handle indices (for `applyBundleSpread`). It receives **nothing about other edges** at path-
build time — *except* through the module-level crossing registry (see D5): each edge
publishes its `spreadPoints` to `edgePathRegistry` and reads every other edge's points back
for bridge-arc detection. That registry is the only place the full set of final segment
geometries coexists today, but it is a render-time side-effect, not a pre-render pass.

### D2 — Is there an orchestrator with the full edge list?

**Yes — three places see "all edges", at three different abstraction levels. None of them
does cross-pair lane separation today.**

| Site | File:line | Sees | Geometry available | Produces |
|------|-----------|------|--------------------|----------|
| `applyDistribution` | `EditorV2.tsx:831-904` | full `edgeList` | node **center** positions (`buildNodePositions`) + handle assignments | indexed handles + per-edge `cardinalityShift`/`roleArcShift` |
| `computeAnchorsWithHysteresis` | `useAutoAnchor.ts:270-435` | edges to recalc + `contextEdges` (all) | `nodeRects` (pos+size, **no** anchor coords) | per-edge **side** choice |
| `edgePathRegistry` | `edgeUtils.ts:1300` | all rendered edges' final points | exact final `{x,y}[]` (RF-measured) | crossings → bridge arcs |

- **`applyDistribution`** is the natural global orchestration point. It already (a) runs
  `computePortDistribution` over the whole list (`:836`), (b) groups edges by target-side for
  the cardinality stagger (`:849-865`) and by unordered pair for the role arc-slide
  (`:867-883`), and (c) writes per-edge de-overlap fields into `edge.data`. **But the geometry
  it holds is node centers + handle indices — it does NOT hold resolved anchor screen
  coordinates or per-edge waypoints.** Those are produced later, per-edge, inside `UnifiedEdge`
  from ReactFlow's measured handle positions (`sourceX/targetX` props). To get true segment
  geometry here, the pass would have to reconstruct it (node rect + side + along-side percent
  → anchor coord, then `computeManhattanPath`). Feasible (all inputs are pure/importable) but
  it is a reconstruction, not the exact RF-measured path.
- **`computeAnchorsWithHysteresis`** sees all edges but operates one level too early — it picks
  *sides*, before indices and positions exist. Wrong altitude for segment lanes.
- **`edgePathRegistry`** is the only carrier of exact, post-everything segment geometry for all
  edges, but it is assembled incrementally during render and consumed per-edge.

**`deconflictBidirectionalEdges`** — `useAutoAnchor.ts:56-116`.
- **Input**: `edges[] {id,source,target,sourceHandle,targetHandle,type}` + `nodeRects` map.
- **Output**: `Map<edgeId,{sourceHandle,targetHandle}>` (bare **side** names only).
- **Scope**: groups by **unordered node pair** (`[source,target].sort().join('::')`, `:65`) and
  acts on any group with **≥2 routable references** (`routable.length < 2 → continue`, `:79`).
  So it already handles groups of ≥2 (not just A↔B), forcing them all onto the facing side-pair
  by dominant axis (`:91-102`). **It addresses Cat. 1 only (same-pair); it has no notion of
  different node pairs, so Cat. 2 is entirely outside its scope.**

### D3 — Same-side anchor spacing (`portDistribution.ts` vs `handlePosition.ts`)

**Two functions compute along-side positions; only one reaches the screen.**

- **`portDistribution.ts` STEP 5** (`:228-235`) sets `port.position = n===1 ? 0.5 :
  (i+1)/(n+1)` — squeezed uniform. **This output (`nodeHandles`) is DISCARDED**: `applyDistribution`
  destructures only `{ edgeHandles }` (`EditorV2.tsx:836`), confirming `CLAUDE.md §3.10`.
- **`handlePosition.ts` `computeSidePositions`** (`:184-271`) is what **actually positions
  anchors on screen** (consumed by `DynamicHandles.tsx:241-242,266-267` → CSS `top/left`
  percent). Its spacing:
  - No inheritance on the side → **plain uniform `(k+1)/(N+1)`** (`:251`).
  - With inheritance → inheritance pinned at center (`0.5 + (i-(M-1)/2)·step`, `:266-268`),
    references take the R outermost grid slots (`:255-262`). Grid step `= 1/(N+1)` (`:244`).

**There is NO minimum guaranteed gap in pixels anywhere.** Spacing is purely fractional
`1/(N+1)` of the side length. As N grows (Cat. 3 fan-out: 4 anchors on `BookStore.right`),
adjacent anchors converge — on an 80px side, 4 anchors sit at 16px steps; the cap
`MAX_HANDLES_PER_SIDE = 4` (`portDistribution.ts:258`) bounds N but does not enforce a gap.
**This is the Cat. 3 root cause: no `MIN_ANCHOR_GAP` constant exists.**

**Order along the side** (`computeSidePositions`):
- references sorted by `byGeometry` (`:230-235`) = opposite-node centroid coordinate first
  (Y for left/right, X for top/bottom), then `byPairStable` edge-id tiebreak (`:223-226`);
- inheritance sorted by `bySortKey` (role, then handle index), pinned center.
The handle **index** itself is assigned earlier by `portDistribution` STEP 2-3 (`:142-178`),
spatially sorted by opposite-node centroid to minimize crossings.

**Division of responsibility:**
| Concern | Owner | File:line |
|---------|-------|-----------|
| Which **side** an endpoint uses | `useAutoAnchor` (`computeBestAnchorsWithContext` + `computeAnchorsWithHysteresis` + `deconflictBidirectionalEdges`) | `useAutoAnchor.ts:138,270,471` |
| Which **handle index** on that side | `portDistribution.computePortDistribution` STEP 2-3 | `portDistribution.ts:142-178` |
| **Position along the side** (rendered) | `handlePosition.computeSidePositions` | `handlePosition.ts:184` |
| Anchor screen coord from percent | `DynamicHandles` CSS percent → RF measures | `DynamicHandles.tsx:266-267` |

### D4 — Routing constants (verbatim)

**`edgeUtils.ts`**
| Const | Value | Line | Role |
|-------|-------|------|------|
| `DETOUR_PADDING` | `30` | 16 | same-side / backward U-detour offset |
| `STUB_LENGTH` | `20` | 19 | perpendicular endpoint stub |
| `SELF_LOOP_INSET` | `16` | 626 | self-loop endpoint inset from corner |
| `SELF_LOOP_SIZE` | `24` | 627 | self-loop protrusion |
| `SELF_LOOP_RING_STEP` | `14` | 628 | concentric self-loop increment |
| `SELF_LOOP_LABEL_OFFSET` | `10` | 629 | self-loop label offset |
| `SELF_LOOP_CARD_OFFSET` | `14` | 630 | self-loop cardinality offset |
| `SELF_LOOP_CARD_T` | `0.28` | 631 | fraction along entry segment |
| `CARD_BOX_GAP` | `8` | 866 | cardinality distance outside target box |
| `CARD_LINE_GAP` | `4` | 868 | cardinality lateral offset off the entry line |
| `BAR_OBSTACLE_MARGIN` | `8` | 1185 | inheritance bar clearance margin |
| `BAR_Y_SEARCH_STEP` | `10` | 1186 | inheritance bar search step |
| (corner radius arg) | `4` | 512,713,1452 | `roundManhattanPath`/`buildFinalPath` default |
| (bridge radius arg) | `6` | 1453 | bridge-arc radius |

**`UnifiedEdge.tsx`**
| Const | Value | Line | Role | Status |
|-------|-------|------|------|--------|
| `BUNDLE_SPREAD_PX` | `12` | 43 | perpendicular spread of bundled Z-paths' mid-corridor | **used** (`:79`) |
| `LABEL_SPREAD_PX` | `18` | 44 | — | **dead** (no reference) |
| `ROLE_LINE_GAP` | `10` | 45 | — | **dead** (no reference; superseded by `_PX`/`_PY`) |
| `ROLE_LINE_GAP_PX` | `10` | 46 | role-label horizontal nudge off line | used (`:302`) |
| `ROLE_LINE_GAP_PY` | `10` | 47 | role-label vertical nudge off line | used (`:302`) |

**`EditorV2.tsx`**
| Const | Value | Line | Role |
|-------|-------|------|------|
| `CARD_STAGGER_STEP` | `11` | 103 | depth per extra cardinality on same target side |
| `ROLE_ARC_STEP` | `22` | 104 | arc-length separation between bundled roles |

**`ROLE_VGAP` / `ROLE_HGAP` do not exist** (grep = 0). The "pending split of `ROLE_LINE_GAP`"
referenced in the prompt is **partially already done but mislabeled**: the split exists as
`ROLE_LINE_GAP_PX` / `ROLE_LINE_GAP_PY` (both `10`), and the original `ROLE_LINE_GAP` is now
dead. **Critically, all of these govern LABEL placement, not segment lanes.** There is **no
constant anywhere for transverse spacing between collinear edge segments** — the lever-2 gap.

### D5 — Line-jumps / bumps

- **The bump where two lines cross is a custom feature, not ReactFlow.** Grep for `pathOptions`
  / `jump` / `crossing` against RF config returns nothing from ReactFlow. It is implemented in
  `edgeUtils.ts`: `getEdgeCrossings` (`:1334-1443`) finds H×V crossings against the module-level
  `edgePathRegistry`, and `buildFinalPath` (`:1449-1552`) + `emitLineWithBridges` (`:1580-1623`)
  draw a semicircular bridge arc (`bridgeRadius = 6`) on the **horizontal** segment hopping over
  the vertical one. Wired in `UnifiedEdge.tsx:239-243,280-281`. Consumers: `edgeUtils.ts`,
  `useTreeLayout.ts`, `UnifiedEdge.tsx`.
- **The curl/bump near an anchor is an artifact of the stub geometry**, not RF. When a path's
  endpoint segment is not already perpendicular, `ensureOrthogonalEndpoints` /
  `buildOrthogonalPath` (`:351-444`) inject a `STUB_LENGTH = 20` stub + connector; if the
  connector turns back toward the node, a small loop appears at the anchor. The legacy bezier
  `computeSelfLoopPath` (`:605-623`) is a separate fallback used only for the one frame before
  the node is in `allNodes` (`UnifiedEdge.tsx:255-261`). No ReactFlow `pathOptions`/`jump` flag
  participates.

---

## Routing pipeline (edge data → SVG `d`)

```
                       ┌─────────────────── FULL EDGE LIST IN SCOPE ────────────────────┐
                       │                                                                │
 ① SIDE RESOLUTION     useAutoAnchor.ts                                                  │ geom: nodeRects
   (which side)        ├─ computeBestAnchorsWithContext  (creation)   :471               │ (pos+size),
                       ├─ computeAnchorsWithHysteresis   (drag)        :270  ◀── all edges │ NO anchor coords
                       └─ deconflictBidirectionalEdges  (same-pair → facing) :56          │ Cat.1 only
                       │        produces: bare side names 'right'/'left'/'top'/'bottom'   │
                       ▼                                                                  │
 ② INDEX + DE-OVERLAP  EditorV2.applyDistribution  :831  ◀────────────────── all edges ──┤ geom: node CENTERS
   (which slot)        ├─ computePortDistribution → edgeHandles 'right-1' :836            │ + handle indices.
                       ├─ cardGroups → cardinalityShift (CARD_STAGGER_STEP=11) :849       │ nodeHandles DISCARDED.
                       └─ roleGroups → roleArcShift     (ROLE_ARC_STEP=22)     :867       │ writes edge.data.*
                       │        produces: indexed handles + label de-overlap fields       │
                       ▼                                                                  │
 ③ POSITION ALONG SIDE handlePosition.computeSidePositions  :184                          │ geom: node centroids
   (rendered)          │  uniform (k+1)/(N+1); inheritance pinned center; NO min-gap      │ (for ordering)
                       │  consumed by DynamicHandles.tsx:266-267 → CSS top/left %          │
                       ▼  ReactFlow measures handle DOM → sourceX/Y, targetX/Y props      │
                       └────────────────────────────────────────────────────────────────┘
                       ▼
 ④ PER-EDGE PATH       UnifiedEdge.tsx  (per edge, NO cross-edge view except registry)
   (waypoints → d)     ├─ computeManhattanPath(sX,sY,sSide,tX,tY,tSide)  edgeUtils.ts:92
                       ├─ parsePathPoints → rawPoints[]                   :207
                       ├─ applyWaypoints(rawPoints, data.waypoints)       :208   ← user waypoints
                       ├─ applyBundleSpread(BUNDLE_SPREAD_PX=12, 4-pt Z)  :217   ← only same-pair
                       │     spreadPoints[]  ◀── manipulable {x,y}[] here
                       ├─ registerEdgePath(id, spreadPoints) ───────────▶ edgePathRegistry  ┐ ONLY place all
                       ├─ getEdgeCrossings(id, spreadPoints) ◀───────────┘ (cross-edge!)    │ final segments
                       └─ buildFinalPath / roundManhattanPath → SVG `d`   :276              ┘ coexist (D5)
```

**Where the full edge list is available**: stages ① (sides), ② (indices + label de-overlap),
and the ④ `edgePathRegistry` (final geometry). **Where it is NOT**: the actual `computeManhattanPath`
path build (④) runs per-edge with only its own endpoints. The transverse lane decision needs
*both* the full list *and* final segment geometry — that intersection exists only in the
`edgePathRegistry`, and partially-reconstructable in `applyDistribution`.

---

## Recommended hook point for lever 2 (global segment lane-separation)

**Primary recommendation: a new global pass co-located with `applyDistribution`
(`EditorV2.tsx:831`), writing a per-edge `laneOffset` field into `edge.data`, consumed by
`UnifiedEdge`'s existing spread pipeline.**

Rationale:
1. **It is the single point that already owns the full edge list AND already writes per-edge
   de-overlap fields** (`cardinalityShift`, `roleArcShift`) into `edge.data` — adding a third
   field `laneOffset` (or `laneOffsets: EdgeWaypoint[]` for per-segment) is the established,
   convention-matching mechanism. `types.ts` `ReferenceEdgeData` already carries exactly this
   kind of "set by applyDistribution, consumed by UnifiedEdge" field.
2. **It is outside the critical zone.** `EditorV2.applyDistribution` is *not* one of the
   TRANSACTION-forbidden / D-L sync files. `portDistribution.ts` and `handlePosition.ts` stay
   read-only — the pass *imports* their pure functions (`computeSidePositions`,
   `computePortDistribution`) without editing them. No `VersionFixer` migration (these are
   ephemeral render fields, not `jsxString`).
3. **It can deterministically reconstruct segment geometry up-front**, avoiding the two-phase
   render the registry would require: from `buildNodePositions` (node rects) + `edgeHandles`
   (assigned sides+indices) + `computeSidePositions` (along-side percent) it can derive each
   anchor's absolute coordinate, run `computeManhattanPath` per edge, group collinear segments
   (same orientation, transverse coordinate within a threshold, overlapping longitudinal range),
   and assign lane offsets — a true synchronous global pass.

Geometric data available at this hook: node rects (position + size via `getNodes()`/
`buildNodePositions`), per-edge resolved sides + handle indices (`edgeHandles`), and — by
importing `computeSidePositions` — the along-side percent → **full reconstructed anchor
coordinates and waypoints for every edge, simultaneously**.

Signature sketch (illustration only — no implementation in this phase):
```ts
// new pure helper, e.g. utils/laneSeparation.ts
function computeLaneOffsets(
  edges: { id; source; target; sourceHandle; targetHandle }[],
  nodeRects: Map<string, Rect>,
): Map<string /*edgeId*/, number /*transverse px*/>
// called inside applyDistribution; result merged into edge.data.laneOffset
// applied in UnifiedEdge AFTER applyBundleSpread, mutating spreadPoints' mid-corridor
```

**Alternative (exact-geometry, higher cost): reuse the `edgePathRegistry` pattern.** A
lane-grouping function reading the same module registry that `getEdgeCrossings` already reads
(`edgeUtils.ts:1300`) would operate on RF-*measured* points (exact, not reconstructed) and
naturally sit beside the crossing system. Trade-off: like crossings, it is render-time and
incremental, so it needs the same convergence handling (registry change → re-render via the
`allEdges` dep) and is harder to make deterministic/race-free than the `applyDistribution`
reconstruction. Recommend only if center-based reconstruction proves visually insufficient.

**Consumer site for whichever offset is produced**: `UnifiedEdge.tsx:217` `spreadPoints` memo,
immediately after `applyBundleSpread` — the established place where the per-edge `{x,y}[]` is
mutated before `pointsToPath`. `applyBundleSpread` (`:64-103`) is the structural template for an
`applyLaneOffset` that nudges the middle corridor by the computed transverse amount.

---

## Explicit gaps (things that do NOT exist today)

1. **No minimum anchor gap.** Spacing is fractional `1/(N+1)` (`handlePosition.ts:244,251`); no
   `MIN_ANCHOR_GAP` pixel constant. Cat. 3 (same-side fan-out) has no spacing floor. (`portDistribution`'s
   own `(i+1)/(n+1)` in STEP 5 is *discarded*.)
2. **No cross-pair awareness.** `deconflictBidirectionalEdges` groups by node pair and never
   compares different pairs (`useAutoAnchor.ts:63-69`). Cat. 2 (cross-pair parallel transit) is
   unaddressed by any code.
3. **No transverse-lane / segment-separation pass.** Nothing groups collinear segments across
   edges and spreads them. `applyBundleSpread` (`UnifiedEdge.tsx:64`) only spreads edges of the
   **same** node pair (`source<target` sign), 4-point Z-shapes only — it is *intra*-bundle, not
   *inter*-edge.
4. **No transverse-spacing constant.** All gap constants (D4) govern labels, stubs, detours, or
   bridge radius. `ROLE_VGAP`/`ROLE_HGAP` do not exist; `LABEL_SPREAD_PX` and `ROLE_LINE_GAP`
   are dead. Lever 2 introduces the first true lane-gap constant.
5. **No single pre-render structure holding the full edge list + final segment geometry.** The
   full list lives at the side/index stages (no geometry); the final geometry lives in the
   per-edge registry (assembled incrementally at render). Lever 2 must bridge them (the
   `applyDistribution` reconstruction is the proposed bridge).
6. **`nodeHandles` from `portDistribution` is dead output** (`EditorV2.tsx:836` discards it);
   `CLAUDE.md §3.10` is confirmed — its STEP 5 positions never reach the screen.

## HARD STOP

Report complete. No source files modified. Awaiting explicit go-ahead before any Phase 2
implementation (the `applyDistribution` lane pass + `UnifiedEdge` consumer + a `MIN_ANCHOR_GAP`
in `handlePosition.ts` would each require a Layer Impact Report and approval, since two of the
three touch critical-zone files).
