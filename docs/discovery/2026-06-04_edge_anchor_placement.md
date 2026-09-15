# Discovery (read-only) — Edge anchor point placement

**Date**: 2026-06-04
**Type**: discovery / read-only (no code changes)
**Author**: Claude Code (Opus 4.8)
**Scope**: map how edge anchor points (handle sides + intra-side distribution + physical
position) are selected, positioned and routed today. Strict read-only.

> Conflict check vs CLAUDE.md: none. The §3.10 note ("`portDistribution.nodeHandles` is
> discarded; positioning is driven by `handlePosition.computeSidePositions` +
> `DynamicHandles`") is **confirmed** by this investigation — see D2 / "verify consumers".
> Line numbers in CLAUDE.md §3.10 (`EditorV2.tsx:792`) have drifted; the live discard is at
> `EditorV2.tsx:836` (destructures only `{ edgeHandles }`).

---

## 0. TL;DR

- **Side selection** (which of top/right/bottom/left) and **intra-side index** are two
  *separate* stages, owned by *separate* modules.
- **Side** is chosen by the auto-anchor layer (`useAutoAnchor.ts`) at create-time and on
  node-drag, and by `jjomTransformers.computeOptimalHandles` at load/sync time. ReactFlow
  never picks the side — an explicit `sourceHandle`/`targetHandle` is always set.
- **Index within a side** is chosen by `portDistribution.computePortDistribution`.
- **Physical fraction along the side** is chosen by `handlePosition.computeSidePositions`,
  rendered by `DynamicHandles`, then measured by ReactFlow into `sourceX/Y`,`targetX/Y`.
- **Path string** is built by `edgeUtils.computeManhattanPath`, then mutated by
  `UnifiedEdge.applyBundleSpread` and `edgeUtils.buildFinalPath` (crossing bridges).
- **D2 verdict — PER NODE, not per pair.** Every stage distributes a *node's* side
  independently. There is **no** code that aligns the source-anchor and the target-anchor of
  the *same* edge onto a common routing axis. This absence is the crux behind defects 2 & 3.

---

## 1. Data-flow map (model → rendered path)

Each hop names the function and `file:line`.

```
DEdge (L-proxy)
   │
   │  (1) JjOM → ReactFlow edge
   ▼
jjomEdgeToRFEdge                         utils/jjomTransformers.ts:425
   │    └─ computeOptimalHandles         utils/jjomTransformers.ts:373-419
   │         → picks SIDE by dominant axis; inheritance forced top/bottom;
   │           always returns index 0  ("side-0")
   │    └─ writes edge.sourceHandle / edge.targetHandle
   │           (e.g. :458-459, :472-473, :530-531, :547-548, :558-559)
   ▼
RF edge { source, target, sourceHandle:'side-0', targetHandle:'side-0', type }
   │
   │  (2a) create-time side (re)selection — user draws an edge
   ▼
useAutoAnchor.getOptimalAnchors          hooks/useAutoAnchor.ts:624-652
   └─ computeBestAnchorsWithContext      hooks/useAutoAnchor.ts:475-614   (occupancy scoring)
       (called EditorV2.tsx:1299, :1448)
   │
   │  (2b) node-drag / reactive side reselection
   ▼
computeAnchorsWithHysteresis             hooks/useAutoAnchor.ts:274-439
   ├─ computeBestAnchorsWithContext      (per-edge geometric+occupancy score)
   └─ deconflictBidirectionalEdges       hooks/useAutoAnchor.ts:47-120  (PAIR-aware, SAME-side)
       (called EditorV2.tsx:2858, :3024 → resets handle to `${side}-0` at :2873-2874)
   │
   │  (3) intra-side INDEX assignment (per node:side:role)
   ▼
applyDistribution                        EditorV2.tsx:831-904
   └─ computePortDistribution            utils/portDistribution.ts:61-238
        STEP1 bucket `${node}:${side}:${role}`  :78, :111   (PER NODE)
        STEP2 spatial sort by opposite centroid :142-157
        STEP3 assign `${side}-${index}`         :159-178
        → returns edgeHandles  (nodeHandles is COMPUTED but DISCARDED — :836 destructure)
   │
   │  (4) physical FRACTION along the side (per node:side)
   ▼
DynamicHandles                           components/DynamicHandles.tsx:34
   └─ computeSideEndpoints                utils/handlePosition.ts:124-146
   └─ computeSidePositions                utils/handlePosition.ts:177-251   (PER NODE)
        references ordered by opposite centroid :210-215; uniform (k+1)/(N+1) :231
   └─ renders Handle pool, CSS top/left %  :241-242, :266-267, :286-305
   │
   │  (5) ReactFlow measures DOM handle rects → feeds UnifiedEdge
   ▼
UnifiedEdge (sourceX,sourceY,targetX,targetY,sourceHandleId,targetHandleId)
                                          edges/UnifiedEdge.tsx:120
   └─ getSideFromHandle                   utils/edgeUtils.ts:26 → sourceSide/targetSide
   └─ computeManhattanPath                utils/edgeUtils.ts:92-135   (base orthogonal path)
   └─ applyBundleSpread                   edges/UnifiedEdge.tsx:64-103 (shift Z middle corridor)
   └─ buildFinalPath / roundManhattanPath utils/edgeUtils.ts:1449 / :512  (bridges + rounding)
   ▼
SVG <path d=…>                            edges/UnifiedEdge.tsx:603-609
```

---

## 2. Answers D1–D5

### D1 — Side selection

**Computed at runtime, not declared statically.** Three entry points, all writing an explicit
`sourceHandle`/`targetHandle`; ReactFlow itself never auto-picks a side.

1. **Load / JjOM sync** — `computeOptimalHandles` (`jjomTransformers.ts:373-419`):
   dominant-axis rule — `if (|dy| >= |dx|)` vertical (`top`/`bottom`) else horizontal
   (`left`/`right`) (`:406-418`); **inheritance forced** `top→bottom` (`:399-402`). Always
   emits index 0 (`'top-0'`, `'left-0'`, …). The result is written onto every edge variant
   (`:458-459`, `:472-473`, `:530-531`, `:547-548`, `:558-559`).

2. **User draws an edge** — `useAutoAnchor.getOptimalAnchors` (`useAutoAnchor.ts:624-652`)
   → `computeBestAnchorsWithContext` (`:475-614`): scores the 6 candidate side-pairs
   (4 opposing Z-shapes + 2 same-side U-shapes, `:563-572`) by *geometric fitness*
   (`:583-587`) minus *occupancy* (`:589-592`) minus *mixed-type* (`:594-597`) minus
   *same-side* penalty (`:599-600`) plus a tie-break (`:602-603`). Called at
   `EditorV2.tsx:1299` and `:1448`.

3. **Node drag / reactive recompute** — `computeAnchorsWithHysteresis`
   (`useAutoAnchor.ts:274-439`), called at `EditorV2.tsx:2858` and `:3024`. Rules in order:
   self-ref fixed `right/top` (`:304-313`); pinned anchors freeze the edge (`:318-326`);
   inheritance forced `top/bottom` (`:334-343`); else `computeBestAnchorsWithContext`
   with a **30°–60° angular dead-zone** that *retains* the current side to avoid flip-flop
   (`:389-395`, thresholds `DEG_30`/`DEG_60` `:123-124`). After the per-edge pass it runs
   **`deconflictBidirectionalEdges`** (`:409`, see D5). On apply it resets the handle to
   `${side}-0` (`EditorV2.tsx:2873-2874`) and then re-indexes via `applyDistribution`.

**Rule summary**: side ≈ "facing geometry by dominant axis / angular sector", overridden by
(a) inheritance convention, (b) pinned anchors, (c) dead-zone hysteresis, (d) bidirectional
same-side deconfliction. **`sourceHandle`/`targetHandle` are set by the transformer/hooks**,
never left for ReactFlow.

### D2 — Port distribution (the crux)

`computePortDistribution` (`portDistribution.ts:61-238`):

- **Inputs**: `edges` (id/source/target/sourceHandle/targetHandle/type), `nodeIds`, optional
  `nodePositions` (centroids).
- **Outputs**: `edgeHandles: Map<edgeId,{sourceHandle,targetHandle}>` (the only consumed
  output) and `nodeHandles` (**discarded** — `EditorV2.tsx:836` destructures `{ edgeHandles }`
  only; confirms CLAUDE.md §3.10 and the prior discovery
  `discovery_2026-05-20_nodehandles_consumers.md`).

**It operates PER NODE.** STEP 1 keys buckets as `${edge.source}:${sourceSide}:source`
(`:78`) and `${edge.target}:${targetSide}:target` (`:111`) — a node's side-role bucket.
STEP 2 sorts groups within one bucket by the *opposite* node's centroid (`:142-157`).
STEP 3 stamps `${side}-${index}` per bucket (`:159-178`).

**Is the same edge's source-anchor and target-anchor ever aligned?** **No.** An edge's
source index is decided inside the *source node's* `:source` bucket; its target index inside
the *target node's* `:target` bucket. The two buckets are sized and ordered independently. The
physical fraction (`handlePosition.computeSidePositions`, `:177-251`) is likewise computed per
node-per-side: on node A's side the references are ordered by their opposite centroid and laid
out `(k+1)/(N+1)` over A's count; on node B's side the same happens over B's (possibly
different) count. So edge e's source-Y on A and target-Y on B are derived from two unrelated
distributions and generally differ.

**Searched for any per-pair alignment and found none.** The only pair-keyed code is:
- `deconflictBidirectionalEdges` (`useAutoAnchor.ts:47-120`) — chooses a *side*, not aligned
  coordinates (and chooses *same-side*, see D5);
- `applyDistribution` role/cardinality stagger (`EditorV2.tsx:849-883`) — keyed by the
  unordered `{source,target}` pair but only slides **labels/cardinality badges**, never the
  anchor coordinates.

**Verdict D2: per-node, independent. No mechanism aligns a single edge's two anchors on a
common routing axis.** This is the structural gap behind defects 2 & 3.

### D3 — Path building

Base path: `computeManhattanPath` (`edgeUtils.ts:92-135`) → `categorizeSidePair`
(`:137-142`) → one of:
- `opposite-horizontal` (`routeOppositeH :144-184`) / `opposite-vertical`
  (`routeOppositeV :186-226`):
  - *target in front & aligned within `SNAP=8`* → **straight 2-pt line** (`:154-156`,
    `:196-198`). This is the prompt's "`|dy|<5` ⇒ straight" rule (the actual snap is 8 px,
    not 5).
  - *target in front, not aligned* → **Z-shape**, bend at the midpoint of the routing axis
    (`:158-165` bend at `midX`; `:200-207` bend at `midY`). **← the "mid-route jog".**
  - *target behind* → **U-detour**, 5 segments using `DETOUR_PADDING=30` (`:166-183`,
    `:208-225`). **← one source of the "loop/curl near source".**
- `same` (`routeSameSide :228-251`): always a **U-shape** out-and-back using
  `DETOUR_PADDING=30`. **← the dominant "loop/curl near source".**
- `adjacent` (`routeAdjacent :253-331`): L-shape (2 seg) or Z-fallback (3 seg).

Post-processing in `UnifiedEdge`:
- `applyBundleSpread` (`UnifiedEdge.tsx:64-103`): only on a **4-point Z** with empty
  waypoints, non-inheritance, non-self-loop (gated `:217-220`). Shifts the *middle corridor*
  perpendicular by `directionSign * (sourceIndex + targetIndex + 1) * BUNDLE_SPREAD_PX/2`
  (`:79`, `BUNDLE_SPREAD_PX=12` `:43`); `directionSign = source<target ? 1 : -1` (`:75`) so
  the two directions of a pair shift to **opposite** sides. **← amplifies / creates the
  "mid-route jog" for bundled near-parallel edges.**
- `buildFinalPath` (`edgeUtils.ts:1449`): inserts small **bridge arcs** at detected crossings
  (semicircular hops, `:1471-1475`); these are hops, not sideways steps.
- `roundManhattanPath` (`:512`): corner rounding only.

So both artifacts are **side-effects of the anchors, not deliberate offsets**:
- the **loop/curl** appears whenever the chosen side pair is *same-side* or *backward*
  (`routeSameSide` / U-detour) — which happens for bidirectional pairs via deconfliction
  (D5);
- the **jog** appears whenever an opposite-side pair has *misaligned* endpoints on the routing
  axis (Z-branch), then is widened by `applyBundleSpread`. Aligned endpoints would hit the
  `SNAP` straight-line branch instead.

### D4 — Handle inventory

`ClassNode` declares **no** static `<Handle>` — it renders `<DynamicHandles nodeId={id} />`
(`ClassNode.tsx:420`, `:475`). `DynamicHandles` (`components/DynamicHandles.tsx:34`) renders a
**pre-allocated pool**: for each of the 4 sides, `MAX_HANDLES_PER_SIDE = 4`
(`portDistribution.ts:258`) indices, and for **each index both a `type="target"` and a
`type="source"` Handle** (`:286-305`). IDs are fixed and stable: `${side}-${index}`
(`:221`), e.g. `left-0…left-3`. That is 4 sides × 4 slots × 2 roles = **32 Handle elements per
node**, all always in the DOM (pool pattern, `:24-33`). Inactive slots are measurable-but-
hidden (`:252-261`); the first inactive slot per side becomes a hover "ghost" (`:227-237`).

**Implication**: coordinated per-pair distribution is **feasible with the existing handles** —
up to 4 distinct slots per side already exist with known IDs and measured positions; no new
handle declarations are required.

### D5 — Bidirectional pairs

Two mechanisms *recognise* the unordered pair `{A,B}`, neither produces a shared facing
channel:

1. **`deconflictBidirectionalEdges`** (`useAutoAnchor.ts:47-120`): groups edges by
   `[source,target].sort()` (`:56`), finds forward/reverse pairs (`:68-77`), then forces them
   onto **the same side** — `top/top` + `bottom/bottom` when the pair is horizontally
   dominant (`:91-102`), `left/left` + `right/right` when vertically dominant (`:103-115`).
   This deliberately makes each directed edge a **same-side U-shape** rather than a facing
   `right→left`/`left→right` channel.

2. **`applyDistribution` role arc-slide** (`EditorV2.tsx:867-883`): groups by the unordered
   pair key (`:868-869`) only to slide **role labels** apart — no effect on anchors.

`computePortDistribution` itself is *pair-blind*: it buckets per node-side-role, so the two
directed edges of a pair land in unrelated buckets on each node. There is **no shared bucket**
and **no axis alignment** for a pair.

---

## 3. Defect-origin table

| # | Defect (observed) | Desired | Primary origin (`file:line`) | Mechanism | Confidence |
|---|---|---|---|---|---|
| 1 | **Loan↔Member (borrower/loans)** edges exit Loan's **top** and loop near the source | facing sides (Loan right / Member left), distributed in height | `deconflictBidirectionalEdges` `useAutoAnchor.ts:91-115` → `routeSameSide` `edgeUtils.ts:228-251` | bidirectional pair forced to same-side (top/top + bottom/bottom) ⇒ `same` side-pair ⇒ U-shape loop with `DETOUR_PADDING=30` | High |
| 2 | **Loan↔BookCopy (copy/loans, refs)** two anchors coincide on Loan's **bottom**, curl at source | two distinct anchors on Loan bottom, two on BookCopy top, parallel horizontals | (root) no per-pair alignment — D2; `computeSidePositions` `handlePosition.ts:177-251` per node; possibly `deconflict…` same-side bottom/bottom `useAutoAnchor.ts:91-102` | each endpoint's fraction computed on its own node's side; source-Y on Loan and target-Y on BookCopy not tied ⇒ near-coincidence + curl | Hypothesis — **reproduce first** (see note) |
| 3 | **Book↔Author (authors/books, refs)** near-parallel verticals **jog** sideways mid-route | straight parallel verticals on distributed anchors | `routeOppositeV` Z-branch `edgeUtils.ts:200-207` + `applyBundleSpread` `UnifiedEdge.tsx:64-103` (root: D2 misalignment) | source-X ≠ target-X ⇒ Z midpoint bend; `applyBundleSpread` then shifts the two directions to opposite sides ⇒ visible jog | High |

**Common root.** Defect 1 is a *side-selection* policy issue (same-side deconfliction → loop).
Defects 2 & 3 are *distribution* issues: the per-node, pair-blind anchoring of D2 leaves each
edge's two endpoints unaligned, so the router either lands them nearly on top of each other
(2) or bends/jogs to connect mismatched coordinates (3). Implementing R2 (coordinated per-pair
distribution with aligned source/target anchors) would let the existing `SNAP` straight-line
branch (`edgeUtils.ts:154`, `:196`) fire for the parallel cases, and removing/limiting same-
side deconfliction would fix the loop.

> Per CLAUDE.md §5.1 sub-rules: defect 2's "coincident" cause is a **hypothesis** about
> distribution/side interaction. Before any fix, reproduce on the current branch and capture
> the actual `sourceHandle`/`targetHandle`, the `computeSidePositions` fractions, and the
> measured `sourceX/Y`,`targetX/Y` for both edges — the description ("same point") must be
> confirmed against live numbers, not assumed. Likewise validate any distribution change by
> executing it end-to-end (input → rendered `<path>`), not by reading the comparator.

---

## 4. D2 verdict (restated, with evidence)

**Per node, independent — there is no per-pair coordination of a single edge's two anchors.**

Evidence:
- bucket keys are per node-side-role: `portDistribution.ts:78` (`${source}:${side}:source`)
  and `:111` (`${target}:${side}:target`);
- physical fraction is per node-side: `handlePosition.computeSidePositions` takes only one
  node's side endpoints (`DynamicHandles.tsx:112` calls it once per side of one node);
- the only pair-keyed code (`deconflictBidirectionalEdges` `useAutoAnchor.ts:56`;
  `applyDistribution` role/card stagger `EditorV2.tsx:849-883`) affects *side choice* and
  *label position*, never the anchor coordinates;
- `nodeHandles` (the per-node positions `portDistribution` computes) is **discarded**
  (`EditorV2.tsx:836`), so even that output never reaches rendering — positioning is
  re-derived per node by `computeSidePositions`.

Therefore the source-anchor of edge *e* and the target-anchor of the *same* edge *e* are never
guaranteed to share an X (vertical route) or Y (horizontal route). R2 would add exactly this
missing coordination.

---

## 5. Hard stop

Read-only investigation complete. No source file modified, no build, no commit. Awaiting
instructions before any fix (R1–R4).
