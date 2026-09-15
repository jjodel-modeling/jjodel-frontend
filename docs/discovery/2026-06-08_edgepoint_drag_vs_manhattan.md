# Discovery — EdgePoint drag vs Manhattan candidate router

**Date**: 2026-06-08 · **Type**: discovery (read-only) · **Branch**: `alfonso-frontend-jjtl`
**Scope**: map the drag-that-persists on native Manhattan edges. No code changed.

---

## TL;DR — terminology correction first

The dragged handle in the bug is **not** the classic `EdgePoint`/midnode. It is the **segment-handle**
of the `segmentOffsets` feature added this session (commit `e721d5b7f`, "draggable internal-segment
handles"). The cyan circle that appears on the middle leg of a *selected* Manhattan edge is rendered by
`EdgeComponent.renderSegmentHandles` (`damedge.tsx:160`), not by the `<EdgePoint>` component. Every
symptom matches it exactly:

- live drag moves only the handle, the line doesn't follow → `onMove` is an imperative CSS-transform on
  the handle only (`damedge.tsx:208-213`);
- the position is saved and applied cold with degraded box-avoidance → `onUp` persists
  `DVoidEdge.segmentOffsets` (`:227`), re-applied on mount by `applySegmentOffsets` inside
  `get_segments_impl`, which blindly shifts a leg perpendicular *after* the router has run.

The classic `EdgePoint`/midnode (`edge.midPoints` → `<EdgePoint>`, `DV.tsx:924`) and the start/end
`edge-anchor` circles (`DV.tsx:911-918`) are **separate** mechanisms, not involved in this bug.

---

## Q1 — Where the drag writes

**Handler**: `EdgeComponent.onSegmentHandleDown` in `frontend/src/graph/damedges/damedge.tsx:198-231`.
**Not jQuery UI** — it's a React `onMouseDown` (`:194`) that attaches raw
`document.addEventListener('mousemove'|'mouseup')` (`:229-230`).

- **dragstart** = `onMouseDown` → `onSegmentHandleDown`; `e.stopPropagation()` so it does not start an
  edge drag or change selection (`:200-201`).
- **drag (live)** = `onMove` (`:208-213`): sets only `target.style.transform` on the handle `<circle>`.
  No model write, no React update.
- **dragstop** = `onUp` (`:214-228`): computes `newOffset = existingOffset + delta`, then
  `node.segmentOffsets = next` (`:227`).

**Field written**: `DVoidEdge.segmentOffsets?: { segmentIndex: number, offset: number }[]`
(`GraphDataElements.tsx:1862`). The L setter `set_segmentOffsets` (`:2266-2272`) runs a `TRANSACTION`
that fires `SetFieldAction.new(c.data.id, "segmentOffsets", val || [], undefined, false)` (`:2269`).
(The trailing `false` is the `isPointer` arg of `SetFieldAction.new(me, field, val, accessModifier,
isPointer)`, `action.ts:485-504` — not a render flag.) **The write persists**: a normal field
`SetFieldAction` lands in Redux `idlookup`, so it is serialized by `compressedState` on save.

`segmentIndex` is the index into `node.segments.segments` (the central internal leg,
`k = 1 + Math.floor((legs.length-2)/2)`, `damedge.tsx:175`).

## Q2 — Does the Manhattan router read the stored points?

**The point-list is generated from scratch from the node ports; `segmentOffsets` are NOT router input.**

- Birth of the list: `computeRouting` → `computePoints(allNodes, …)` (`edges/routing/classic/segments.ts:42`),
  where `allNodes = [start, …midnodes, end]` (`GraphDataElements.tsx:2260`).
- Manhattan branch: `segments.ts:67-87` inserts axis-aligned corner waypoints between each consecutive
  attachment via `chooseManhattanSidesAndWaypoints` (`points.ts:257`) — the side-aware **candidate/port
  router** (exit stubs + box-avoiding connector). Corners are computed from node geometry, not stored.
- **Stored midnodes DO enter** as intermediate attachments in `allNodes` (the router routes through and
  box-avoids around them) — that is the legitimate classic-bending input.
- **`segmentOffsets` do NOT enter the router.** They are applied *after* routing by
  `applySegmentOffsets` (`get_segments_impl`, `GraphDataElements.tsx:2397`; body reading
  `c.data.segmentOffsets` at `:2462`), which translates a single internal leg perpendicular by the
  stored offset. This **bypasses the router's box-avoidance** → "segmenti che non rispettano più il
  box-avoidance" when re-applied cold.

## Q3 — Why the live render does NOT recompute on drag, but cold does

Two independent reasons, both confirmed in code:

1. **The live drag never touches the model or React.** `onMove` only mutates the handle's
   `style.transform` imperatively (`damedge.tsx:212`). So during the drag nothing recomputes — by design
   of the (incomplete) preview.

2. **The post-`onUp` write does not re-render the edge.** The edge view re-renders through a
   **usageDeclarations (UD) diff** in `GraphElementComponent.shouldComponentUpdate`
   (`graphElement.tsx:398+`): it re-renders only when a data field the compiled `jsxString` *declares
   using* changes. The edge `jsxString` references `edge.d` and `segments` (derived getters), **never
   `edge.segmentOffsets`** — `segmentOffsets` appears only inside `damedge.tsx` and `GraphDataElements`
   internals (`grep` confirms: no jsxString / `DV.tsx` reference). So `segmentOffsets` is **not in the
   edge's UD**.
   Compounding it, `set_segmentOffsets` fires a **bare `SetFieldAction` with no `NODES_RECOMPILE`**,
   unlike `set_longestLabel`/`set_labels` (`GraphDataElements.tsx:2231,2241`) which push
   `SetRootFieldAction.new("NODES_RECOMPILE_*+=", id)` precisely because those fields are also consumed
   *internally* (not in the UD) and would otherwise not refresh. The reducer turns any `NODES_RECOMPILE*`
   key into a forced recompile (`reducer.ts:705,714`).
   → A `segmentOffsets` change is invisible to the UD diff **and** carries no forced recompile, so the
   edge does not re-render → `get_segments_impl` / `applySegmentOffsets` is not re-run live → the path
   stays put.

3. **Cold mount always recomputes.** `get_d`/`get_segments` are not memoized (proxy memoization is a TODO,
   `GraphDataElements.tsx:555`); the first render after mount/hydration always runs `get_segments_impl`,
   which reads the now-persisted `segmentOffsets` and applies the perpendicular shift → the degraded
   routing appears "a freddo".

**Root cause in one line**: the segment-handle persists a field (`segmentOffsets`) that the edge view
neither declares in its UD nor recompiles on — a half-wired write — so the geometry only updates on a
full remount.

## Q4 — Does the handle have other roles?

**No. The `edge-segment-handle` is a bending affordance only — neutralizing it is side-effect-free.**

- Rendered solely at `damedge.tsx:182-195` (`className="edge-segment-handle clickable content no-drag"`,
  inline style, no SCSS rule — `grep` finds `edge-segment-handle` only here).
- `onMouseDown` does `e.stopPropagation()` (`:201`) → **not** a selection target.
- It is **not** a label anchor, **not** a marker anchor, **not** an edge-anchor. Cardinality/role labels
  come from `segments`/`labels` (`DV.tsx` label blocks); markers from `computeHeadPosition`
  (`markers.ts`); start/end anchors are the separate `edge-anchor` circles with `startFollow`/`endFollow`
  (`DV.tsx:911-918`); user bending is the separate `<EdgePoint>` over `edge.midPoints` (`DV.tsx:924`).
- Its only data consumer is `applySegmentOffsets`. Suppressing the handle (and/or that post-process) in
  Manhattan touches nothing else.

It is also **Manhattan-only** already: `renderSegmentHandles` returns `null` unless
`view.bendingMode === EdgeBendingMode.Manhattan` (`damedge.tsx:164`) and the edge is selected with ≥3
legs (`:167-169`).

## Q5 — Stale manual points already persisted

- **Where**: `DVoidEdge.segmentOffsets` (`GraphDataElements.tsx:1862`), inside `idlookup`, serialized by
  `compressedState` like any edge field.
- **How widespread**: the field was introduced **this session** (commit `e721d5b7f`). Older / production
  projects have **none**. Only projects saved *after* the feature landed (local dev/test) can hold stale
  `segmentOffsets`.
- **Migration need**: **none for correctness.** `applySegmentOffsets` is the *only* consumer
  (`grep`-confirmed). If the fix removes/neutralizes that consumer, any persisted `segmentOffsets`
  becomes **inert dead data** and the degraded routing disappears without a migration. A `VersionFixer`
  pass to clear the field would be **cosmetic only** (dead-data cleanup) — and `VersionFixer` is
  critical-zone, so defer it (separate go-ahead + Layer Impact Report) unless the dead field must be
  scrubbed.
- The classic `midPoints`/`midnodes` (separate, legitimate router input) are out of this bug's scope.

---

## Orientation for the (separate) fix — not implemented here

The most surgical neutralization, consistent with "in Manhattan l'edge non è piegabile a mano", is to
**stop rendering the segment-handle** (make `renderSegmentHandles`/`injectSegmentHandles` a no-op, or
gate it off) so no drag occurs and nothing is persisted — and optionally drop `applySegmentOffsets` so
any already-saved `segmentOffsets` becomes inert. Both sites are **outside critical-zone**
(`damedge.tsx`, `GraphDataElements.tsx`). No `VersionFixer` migration is required (Q5). The
`segmentOffsets` field/getter/setter may be left in place (harmless once unconsumed) or removed in a
follow-up cleanup.

## Hard stop

Read-only. No code edits, no migration, no commit.
