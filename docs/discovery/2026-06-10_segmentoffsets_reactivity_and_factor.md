# Discovery — segmentOffsets reactivity, multiplicative factor, router-input feasibility

**Date**: 2026-06-10 · **Type**: discovery (strictly read-only) · **Branch**: `alfonso-frontend-jjtl`
**Scope**: answer Q1–Q5. No code changed, no staging, no commit.

---

## 0. Working-tree vs prompt — read this first (load-bearing)

The current working tree has **diverged from the prompt's description**. Verified by `git diff`:

- **`damedge.tsx` is COMMITTED unchanged** (last touch = `e721d5b7f`, the feature commit). It is **not**
  in `git status`. So the drag handler — *including its zoom division* — is committed behaviour, not an
  uncommitted edit.
- **`GraphDataElements.tsx` is the only modified file** (` M`, unstaged). Its working-tree edits are:
  1. `set_segmentOffsets` now does **`setTimeout(() => transientProperties.updateNode(id, true), 0)`**
     (`:2279`). It does **NOT** push `SetRootFieldAction.new("NODES_RECOMPILE_*+=", id)`. The inline
     comment (`:2272-2278`) explicitly says NODES_RECOMPILE was rejected. So the prompt's *"Step 1 =
     NODES_RECOMPILE"* describes a **superseded** state; the tree is now at *setTimeout(updateNode)*.
  2. `applySegmentOffsets` is the Step 1b corner-dedup version (`:2474-2507`).

Consequence for the prompt's premises:
- **Q3's "is zoom applied? if NOT, 1.1×"** — zoom **IS** applied (committed). The "not applied" branch
  does not hold against the current code.
- The symptom *"live still dead"* was observed on the **Step-1 (NODES_RECOMPILE)** version. The
  *setTimeout(updateNode)* now in the tree is a **different** mechanism and is, per static reading, a
  plausible *working* live-fix that has likely **not been re-tested**. Flagged throughout.

All line numbers below are the **current working tree**.

---

## Q1 — UD diff mechanism (CRITICAL)

### Q1.1 — stored keys, computed values, or a declared list?

**The UD diff compares the COMPUTED VALUES of the expressions the view's `usageDeclarations` function
writes into `ret`. Not stored-state keys, not a declared field list.**

The UD is produced by *executing* a compiled function, not by scanning field names:

```ts
// graphElement.tsx:117-128 (computeUsageDeclarations)
if (!view.usageDeclarations) { udret = {data, view, node}; }
else try {
    transientProperties.view[vid].UDFunction.call(UDEvalContext, UDEvalContext, udret); // runs the UD fn
} catch (e) { udret = {data, view, node, __invalidUsageDeclarations: e}; }
transientProperties.node[allProps.nodeid].viewScores[vid].usageDeclarations = udret; // stores the OBJECT
```

For the **edge** view the function body is `edgeUsageDeclarations` (`DV.tsx:949-1050`); its tail is:

```js
// DV.tsx:1044-1049
ret.start = edge.start
ret.end = edge.end
ret.segments = edge.segments          // <-- the whole RoutingOutput {all, segments, fillers, head, tail}
ret.position = ret.getPosition()
ret.sPos = ret.position ? ret.position.start : {...}
ret.ePos = ret.position ? ret.position.end : {...}
```

So `udret` = `{ edgeview, view, getPosition, start, end, segments, position, sPos, ePos }` — **resolved
values**, not field names.

The comparison (`graphElement.tsx:448` for subviews, `:522` for the main view) calls
`compareUsageDeclarations(old_ud, new_ud, skipDeepKeys)` (`UDComparator.ts:168-233`), which runs
`extractComparableValue` on each value and `fastDeepEqual`s the results. Proxies collapse to
`{id, _v: clonedCounter, className, name}` (`:40-49`); plain objects/arrays recurse to depth 4
(`:66-118`); arrays longer than 20 collapse to a `{length, first, mid, last}` sample (`:89-98`).

### Q1.2 — are stored deps of a derived getter registered transitively? Where is the gap?

**No. Only the resolved RESULT of each declared expression is compared; underlying stored fields are not
tracked.** But this is exactly why `segmentOffsets` is *not* the gap:

`ret.segments = edge.segments` flows `get_segments → get_segments_outer → get_segments_impl`
(`GraphDataElements.tsx:2438-2462`), and `get_segments_impl` ends with
`return this.applySegmentOffsets(routed, c)` (`:2461`), which **reads `c.data.segmentOffsets`** (`:2475`)
and, when an offset is present, **regenerates every leg's `d` string** (`:2502-2505`,
`routed.all[i].makeD(...)`). So the *computed* `ret.segments` **already reflects** `segmentOffsets`.

Does the comparator *see* that reflection? Trace `extractComparableValue(ret.segments)`:

- depth 0 `RoutingOutput` → plain object (no `__raw`/`id`/`className`, so **not** treated as a proxy,
  `UDComparator.ts:54-57`) → recurse keys.
- depth 1 `all` / `segments` → arrays. For a Manhattan edge the leg count is small (stub + connector ⇒
  ~3–6 `EdgeSegment`s; well under 20) → each element mapped, **not** sampled.
- depth 2 `EdgeSegment` → also a **plain class**, no `id`/`className`/`__raw`
  (`GraphDataElements.tsx:1909-1987`) → recurse keys.
- depth 3 `EdgeSegment.d` is a **string** (`:1917`) → returned verbatim and deep-compared.

So **the central leg's `d` change IS captured at recursion depth 3.** `compareUsageDeclarations` would
return `{equal:false, changedKeys:['segments','all',…]}`. (`sPos`/`ePos` don't change — they read the
first/last *anchor* points, which a central-leg offset leaves fixed — but `segments` alone is enough.)

**Exact gap, therefore, is NOT in UD content or the comparator.** The gap is upstream: whether
`shouldComponentUpdate` is *invoked at all* with freshly-recomputed segments after a bare
`segmentOffsets` write. `computeUsageDeclarations` only runs *inside* `shouldComponentUpdate`
(`graphElement.tsx:437/:483`); SCU only runs when react-redux delivers new props (or on `forceUpdate`).
The prior discovery's "`segmentOffsets` is not in the edge's UD" is literally true but **not the cause** —
its *effect* on `segments` is in the UD.

### Q1.3 — would an explicit `edge.segmentOffsets` read in the jsxString make the diff catch it?

**No — it would be redundant, and it is not the right lever. Base the decision on SCU invocation, not UD
content.** Two facts from the actual code path:

1. **The jsxString and the `usageDeclarations` function are SEPARATE strings.** The UD is the hand-written
   `edgeUsageDeclarations` (`DV.tsx:949`, assigned at `:1063`); it is *executed* to build `udret`
   (`graphElement.tsx:120`). Adding a read to the jsxString does **not** add anything to the UD unless
   `usageDeclarations` is *also* edited. So "a data-attribute in the jsxString" alone changes nothing in
   the diff.

2. Even if you added `ret.segmentOffsets = edge.segmentOffsets` to the UD function, **the UD already
   carries the offset's full effect via `ret.segments` (the `d` strings, Q1.2).** An explicit
   `segmentOffsets` key is therefore *redundant for detection*.

The thing that actually decides live re-render is **whether SCU runs after the write**:
`LPointerTargetable.wrap` returns a **fresh `new Proxy(...)` every call** (`classes.ts:275`), so
`mapStateToProps` (`graphElement.tsx:367-385`, default `connect` — no custom equality, `damedge.tsx:277`)
returns a new `ret.data`/`ret.start`/`ret.end` reference on **every** dispatch, which by react-redux
`shallowEqual` should re-render the connected edge **every** dispatch → SCU runs → UD recomputes →
`segments.d` change detected → render. The reducer also bumps the edge's `clonedCounter` along the action
path (`reducer.ts:103`).

**i.e. static reading predicts live update SHOULD already work via the normal path.** That conflicts
with the (Step-1-era) observation. The conflict cannot be resolved by static reading; it points to a
runtime gating in the dispatch/subscription wiring, not the UD diff. The working tree's
`setTimeout(updateNode)` sidesteps the whole question by calling `forceUpdate()` (which **bypasses** SCU,
classes.ts:4184) after deleting the cached `jsxOutput`.

> **Runtime probe (one line each):**
> (a) In `EdgeComponent.shouldComponentUpdate` log `{id, changedKeys}`; drag+release a handle and check
> whether SCU fires for that edge and what `changedKeys` says.
> (b) In `get_segments_impl` log `c.data.segmentOffsets` + the central leg's `d`; confirm it re-runs with
> the new offset after release (and how many times per render).

**Verdict (Q1).** The UD diff compares *computed values*; the edge UD's `ret.segments` already encodes
`segmentOffsets` (leg `d` strings, caught at depth 3 for ≤20 legs). Adding an explicit `segmentOffsets`
read to the jsxString/UD is **neither necessary nor sufficient** — not necessary (segments already carry
it), not sufficient (it changes nothing unless SCU runs). The real lever is **SCU invocation / forced
re-render**, which the tree now attempts via `setTimeout(updateNode→forceUpdate)`. Confidence: **high**
on the mechanism; the precise reason the normal path appeared dead needs the runtime probe.

---

## Q2 — Does NODES_RECOMPILE reach edges? (closure)

### Q2.1 — what does a forced recompile actually re-fire?

**Only `NODES_RECOMPILE_labels` and `NODES_RECOMPILE_longestLabel` are consumed, and they re-parse label
*strings into functions* — they do not force any component (node *or* edge) to re-render.**

The reducer's only `NODES_RECOMPILE_*` consumers are two `parseLabel` passes:

```ts
// reducer.ts:764-774
arr = ret.NODES_RECOMPILE_labels;       … parseLabel(id, 'labels', true) …
arr = ret.NODES_RECOMPILE_longestLabel; … parseLabel(id, 'longestLabel', true) …
```

`parseLabel` (`reducer.ts:721-…`) compiles the label expression and stores it in
`transientProperties.node[ptr].labels` / `.longestLabel`. It **does not** call `updateNode`/`forceUpdate`.
The generic `for (sk in ret) if (sk.indexOf('NODES_RECOMPILE')===0) …push(id)` loops (`:705`, `:714`)
only run inside the `VIEWS_RECOMPILE_all`/`resetAllNodes` branch, not for ordinary field writes.

There is **no consumer for an arbitrary `NODES_RECOMPILE_<x>` key**. A push of
`NODES_RECOMPILE_segmentOffsets` (or the `"NODES_RECOMPILE_*+="` form from the prompt's Step 1) appends to
a root-field array that **nothing reads** → inert. **This is why Step 1 never affected live reactivity.**

### Q2.2 — how does set_labels / set_longestLabel actually update the edge visually?

`set_labels`/`set_longestLabel` (`GraphDataElements.tsx:2225-2243`) fire a normal `SetFieldAction` **plus**
`NODES_RECOMPILE_labels/longestLabel`. The recompile's role is to **refresh the parsed label function** in
transient state (because labels are *code* that must be recompiled when the string changes). The actual
visual refresh rides on the **dispatch's normal react-redux propagation** (state changed → connected
components re-evaluate → SCU/UD), consuming the freshly-parsed label on the next render. For an edge the
label is read from `transientProperties.node[id].labels` during routing (`setLabels`,
`segments.ts:124`).

So: NODES_RECOMPILE is a *label-compilation* hook, not a render hook, and there is no segmentOffsets
analogue. Step 1 could not have worked.

**Verdict (Q2).** `NODES_RECOMPILE` reaches edges only for `labels`/`longestLabel`, and only to recompile
those label functions in transient state — it does **not** force a re-render and has **no** path for an
arbitrary field like `segmentOffsets`. The Step-1 approach was inert by construction. Confidence: **high**.

---

## Q3 — Multiplicative factor, hypothesis A (screen-to-canvas coordinates)

### Q3.1 — coordinate space of `delta`

The raw input is **screen/client pixels**, then **divided by zoom** → canvas/graph space:

```ts
// damedge.tsx:205-207, 219  (onSegmentHandleDown / onUp)
const startX = e.clientX, startY = e.clientY;
const delta = (me) => horizontal ? (me.clientY - startY) / zy : (me.clientX - startX) / zx;
…
const newOffset = existingOffset + delta(me);   // persisted onto DVoidEdge.segmentOffsets
```

`applySegmentOffsets` then adds `newOffset` directly to graph-space `GraphPoint`s
(`GraphDataElements.tsx:2497`, `p.y += off` / `p.x += off`).

### Q3.2 — is zoom applied? (quote)

**Yes — committed, not an edit.** `damedge.tsx:203-204`:

```ts
const zoom = (graph && (graph.cumulativeZoom || graph.zoom)) || { x: 1, y: 1 };
const zx = zoom.x || 1, zy = zoom.y || 1;
```

`graph = this.props.node.graph`. `cumulativeZoom` is truthy (`{x:1,y:1}` default), so the `|| graph.zoom`
fallback rarely fires; the divisor is **`graph.cumulativeZoom`**. Crucially, `cumulativeZoom`
**includes the graph's own zoom**:

```ts
// GraphDataElements.tsx:298-303
get_cumulativeZoom(c){ let ancestors = [c.proxyObject, ...this.get_graphAncestors(c)]; // <-- includes self
  let zoom = new GraphPoint(1,1); for (g of ancestors) zoom.multiply(g.ownZoom, false); return zoom; }
```

So for a top-level diagram at 110%, `graph.cumulativeZoom = 1.1`, and `delta` is divided by 1.1.

### Q3.3 — if zoom NOT applied … (premise does not hold)

The prompt's "if zoom is NOT applied → 1.1×" branch is moot: the committed code **does** divide by the
zoom, and `cumulativeZoom` equals the graph→screen scale, so for a single scale level the conversion is
**mathematically correct** and predicts **no** constant factor.

**Where a constant factor still comes from (INFERENCE, leading A-mechanism).** The render scales each node
container by **its own zoom**, composed through nesting:

```ts
// graphElement.tsx:1187-1192   --zoom-x = transformZoom = ownZoom
// store.tsx:287                .mainView.not-scrollable, .scrollable { transform: scale(var(--zoom-x), var(--zoom-y)); }
```

and an **edge's `ownZoom` equals its graph's `ownZoom`** (`GraphDataElements.tsx:313`,
`get_ownZoom` for a non-graph returns `this.get_graph(c).ownZoom`). If the edge's own SVG sits inside its
own `scale(var(--zoom-x))` container *in addition to* the graph scaling its children, the effective
screen scale of the edge's coordinate space is `cumulativeZoom(graph) × graph.ownZoom`, while the drag
handler divides by only `cumulativeZoom(graph)`. The stored offset is then **too large by exactly
`graph.ownZoom` = 1.1**, and on render the leg moves `1.1×` the visual drag — a **constant** factor equal
to the zoom, matching the report. I could not fully confirm the double-scale from the SCSS + DOM nesting
statically (the scale selector is keyed on `.scrollable`/`.mainView.not-scrollable` descendants, and
whether the edge's SVG inherits a second one needs the live DOM).

> **Runtime probe:** at 110%, read `graph.cumulativeZoom` and measure actual screen-pixels-per-graph-unit
> for the selected edge's SVG (`getBoundingClientRect` of two known points). If the ratio ≈ `1.1 ×
> cumulativeZoom`, the divisor is one `ownZoom` short → A confirmed; the fix is to divide by the edge's
> *full* composed scale, not `graph.cumulativeZoom`.

**Verdict (Q3).** Zoom **is** applied (`/ cumulativeZoom`, committed). The conversion is correct for a
single scale level, so the observed **constant** factor is an A-family coordinate issue caused by a
**mismatch between the divisor (`graph.cumulativeZoom`) and the edge SVG's true composed render scale**
(leading hypothesis: a second `scale(var(--zoom-x))` on the edge, where edge.ownZoom = graph.ownZoom).
Confidence: **medium** (mechanism family A is high; the exact double-scale needs the DOM probe).

---

## Q4 — Multiplicative factor, hypothesis B (non-idempotent application)

### Q4.1 — in-place mutation on fresh or surviving instances?

`applySegmentOffsets` **does mutate `GraphPoint`s in place** (`GraphDataElements.tsx:2497`). But the
instances are **freshly allocated on every call**:

- `get_segments_impl` calls `computeRouting({...})` each time, **unmemoized** (proxy memoization is still a
  TODO, `:555`; `get_d`/`get_segments` re-run every render).
- `computeRouting → computePoints` builds each attachment via `getAnchorOffset` =
  `size.tl().add(offset, false)` → **new `GraphPoint`** (`points.ts:14-19`).
- Manhattan corners are all `new GraphPoint(...)` (`points.ts:154-162, 201-241, 257-285`), spliced as
  doubled pairs (`segments.ts:75-83`).

So **no GraphPoint survives between `get_segments_impl` calls.** Each call rebuilds base geometry from
scratch, then applies the offset once. **Cross-render / cross-reload accumulation is impossible.**

### Q4.2 — cold mount: how many runs, base rebuilt each time?

`get_segments_impl` runs **multiple times per render** — at least: once inside
`computeUsageDeclarations` (UD reads `edge.segments`, `DV.tsx:1046`), and again during jsxString
evaluation (`this.edge.d` appears 3× plus `segments.all.flatMap`, `DV.tsx:879-905`, where `edge.d →
get_d → get_segments`). **Each invocation calls `computeRouting`, which allocates fresh points.** Because
the base geometry is rebuilt from scratch every time, **repeated application cannot accumulate** —
**hypothesis B is dead** (it predicts neither a growing nor a constant factor). Exact count per paint is
not statically determinable but is irrelevant given the rebuild.

### Q4.3 — Step 1b corner dedup vs snap de-sync

The dedup-by-identity is **correct** for the central leg. `snap.ts` confirms the de-sync paths:
`gap`/`closest`/default cuts reassign `prev.end.pt`/`curr.start.pt` to *separate* `closestIntersection`
points (`:111-125`); `average`/`center` explicitly `.duplicate()` the shared corner (`:95, :104`). The
Step 1b list `cornerPts = [seg.start, legs[si-1].end, seg.end, legs[si+1].start]`
(`GraphDataElements.tsx:2490`) covers **both** views of each shared corner; the `moved` `Set<GraphPoint>`
(`:2491-2498`) moves a still-shared corner **once** and a de-synced pair **both**, so the central leg
translates parallel to itself — no single-side "zig-zag". Note it also translates `uncutPt` when distinct
from `pt`; that is consistent (the uncut path variant tracks the cut one). Internal central-leg corners
sit far from node borders (tiny `0.01×0.01` corner sizes, `segments.ts:78`) so snap usually leaves them
shared; the code handles either case.

**Verdict (Q4).** Hypothesis B is **dead**: fresh `GraphPoint`s every `computeRouting`, unmemoized
getters, single in-call application per corner. Step 1b's dedup correctly covers shared and de-synced
corners. The factor is **not** accumulation. Confidence: **high**.

### Q3/Q4 combined verdict

The code supports **hypothesis A (a constant, zoom-proportional coordinate factor)** and **rules out B**.
A double-reload should show the factor **constant** (not growing): constant → A (as predicted); a growing
factor would contradict the static analysis and warrant re-checking for a surviving shared GraphPoint.

---

## Q5 — Feasibility: offsets as router input (time-boxed)

### Q5.1 — where waypoints are still a plain point-list (viable injection point?)

In `computeRouting`, the Manhattan branch produces a **plain `GraphPoint[]`** with **no shared/duplicated
points yet**, right here:

```ts
// segments.ts:75   (snap is later, at :121)
let corners = chooseManhattanSidesAndWaypoints(all[i].pt, all[i].size, all[i+1].pt, all[i+1].size);
```

`chooseManhattanSidesAndWaypoints` (`points.ts:257-285`) returns deduped fresh corners. This *is* a clean
pre-snap point-list — **but it is pre-grouping**: there are no `EdgeSegment`s and thus **no
`segmentIndex`** yet. The offset's key (`segmentIndex` into `node.segments.segments`) does not exist at
this stage, so per-leg injection here requires reconstructing which corner pair corresponds to the
handle's central leg.

**Important catch:** box-avoidance (`manhattanPortRoute`) runs **inside**
`chooseManhattanSidesAndWaypoints`, *before* the corners are returned. Shifting a returned corner (at
`segments.ts:75`, pre-snap) is therefore **still post-box-avoidance** — it would *not* fix the
box-avoidance violation that motivates moving offsets into the router. To make box-avoidance *respect* the
offset, it must be injected as **input to `chooseManhattanSidesAndWaypoints` / `manhattanPortRoute`**
(a deeper change), not merely applied to its output.

### Q5.2 — does `segmentIndex` stay stable pre-snap?

Partly. The **count of main segments** is fixed by the grouping loop (`segments.ts:93-108`) **before**
snap; snap only adjusts endpoints and pushes to a *separate* `fillSegments` array (`:120-121`), so the
post-snap `node.segments.segments` index matches the pre-snap `ret` index. **But** offsets injected at the
corner-waypoint stage (`segments.ts:75`) are *pre-grouping*, where the index does not yet exist — the
mapping "central leg `k`" → "which corner waypoints" must be derived. So the index is stable across snap,
but not directly available at the proposed pre-snap injection point.

### Q5.3 — blast radius

Expected files (none in the sync/D-L critical zone):
- `edges/routing/classic/segments.ts` (Manhattan branch / call into the corner builder),
- `edges/routing/classic/points.ts` (`chooseManhattanSidesAndWaypoints` / `manhattanPortRoute` to accept
  per-leg offsets if box-avoidance must respect them),
- `edges/routing/classic/types.ts` (add offsets to `RoutingInput`),
- `GraphDataElements.tsx` `get_segments_impl` (`:2443-2462`) to pass `segmentOffsets` into `computeRouting`
  and **delete** `applySegmentOffsets`.
- Unchanged: `damedge.tsx` (handle drag), `DVoidEdge.segmentOffsets` field, `VersionFixer` (offsets remain
  optional → no migration).

**Verdict (Q5).** Feasible, but with a real catch: a clean pre-snap point-list exists at `segments.ts:75`,
yet box-avoidance has already run by then, so injecting *there* would not fix box-avoidance (same drawback
as today, only earlier). To get the offset to *respect* box-avoidance, it must enter
`chooseManhattanSidesAndWaypoints`/`manhattanPortRoute` as input, and the handle's `segmentIndex` (a
post-snap segment index) must be remapped to pre-grouping corners. Blast radius is contained to
`edges/routing/classic/*` + the one `get_segments_impl` call site; nothing in the critical zone.
Confidence: **medium**.

---

## Summary table

| Q | Verdict | Confidence | Runtime check that remains |
|---|---------|-----------|----------------------------|
| **Q1** UD mechanism | Diff compares **computed values**; edge UD's `ret.segments` already encodes `segmentOffsets` (leg `d` caught at depth 3). Explicit `segmentOffsets` read is **redundant**; real lever is **SCU invocation / forced re-render** (tree now uses `setTimeout(updateNode→forceUpdate)`). | High (mechanism) | Log SCU `changedKeys` + `get_segments_impl` offset/`d` on drag-release: does SCU fire and segments re-run? |
| **Q2** NODES_RECOMPILE | Consumed only for `labels`/`longestLabel` to **re-parse label functions** (not a render hook); **no** consumer for `segmentOffsets` → Step 1 was inert. | High | — (static) |
| **Q3** factor / hyp. A | Zoom **is** divided (`/ cumulativeZoom`, committed); correct for one scale level. A **constant** factor ⇒ divisor vs edge-SVG composed scale **mismatch** (likely a 2nd `scale(--zoom-x)`, edge.ownZoom = graph.ownZoom). | Medium | Measure real px-per-graph-unit for the edge vs `cumulativeZoom`; ratio ≈ 1.1× ⇒ confirmed. |
| **Q4** factor / hyp. B | **Dead.** Fresh `GraphPoint`s every `computeRouting`, unmemoized getters, one in-call move per corner; Step 1b dedup covers shared/de-synced corners. | High | Double-reload: factor must be **constant**, not growing. |
| **Q3/Q4** combined | Code supports **A** (constant), rules out **B**. | High | Double-reload (constant ⇒ A). |
| **Q5** router-input | Feasible; clean pre-snap list at `segments.ts:75` but **post-box-avoidance** — respecting box-avoidance needs injection into `chooseManhattanSidesAndWaypoints`; `segmentIndex` needs remap. Blast radius: `routing/classic/*` + `get_segments_impl`; no critical zone. | Medium | — (feasibility) |

### Cross-cutting note
The working tree has **already moved past** the prompt's "Step 1 (NODES_RECOMPILE)" to
`setTimeout(updateNode)`, and the zoom division the prompt asks about is **committed and present**. Both
the live-reactivity fix and the zoom handling in the tree are therefore **likely untested against the
current code** — the two runtime probes above should be run on the working tree *as is* before any new
fix is designed.

## Hard stop
Read-only. No code edits, no migration, no staging, no commit. Handing back to Alfonso.
