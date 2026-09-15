# Discovery — Ghost-parent connector does not follow the dragged chip

**Date**: 2026-06-04
**Mode**: READ-ONLY (no source file edited). Maps the current working tree.
**Goal**: capture the exact mechanism of the working ghost-**target** connector (mirror source) and
the current state of the ghost-**parent** connector, so a later prompt can implement a computed,
chip-following parent connector (step 7).

**Files inspected** (current on-disk line numbers):
- `frontend/src/components/editor-v2/nodes/ClassNode.tsx`
- `frontend/src/components/editor-v2/EditorV2.scss`

---

## Q1 — Current parent connector state

**Verdict: (a) — hard-stopped at step 6.** The parent connector is the **original static fixed
12×18 SVG**, unchanged in geometry. The previous task additionally wrapped the chip in a new
`.ghost-parent-stub__draggable` div that carries the drag `transform`; the connector was left
**outside** that wrapper. The code comment states this explicitly.

**Current parent render (JSX), `ClassNode.tsx:461-491`** (verbatim):

```tsx
            {ghost && (
                <div
                    className="ghost-parent-stub"
                    data-ghost-parent-id={ghost.id}
                    title={ghost.fullname}
                >
                    {/* Draggable unit: the chip moves via an inline transform; the
                        connector below stays static for now (computed/following
                        connector deferred — see 2026-06-04 log). `nodrag` stops
                        ReactFlow from panning the node on press. */}
                    <div
                        className="ghost-parent-stub__draggable nodrag"
                        style={{ transform: `translate(${ghostParentOffsets[ghost.id]?.dx ?? 0}px, ${ghostParentOffsets[ghost.id]?.dy ?? 0}px)` }}
                    >
                        <div
                            className="ghost-parent-stub__chip"
                            title={ghost.fullname}
                            onPointerDown={(e) => onGhostParentPointerDown(e, ghost.id)}
                            onPointerMove={onGhostParentPointerMove}
                            onPointerUp={onGhostParentPointerUp}
                            onDoubleClick={() => onGhostParentReset(ghost.id)}
                        >
                            <span className="ghost-parent-stub__name">{ghost.name}</span>
                            <span className="ghost-parent-stub__mm">{ghost.metamodelName}</span>
                        </div>
                    </div>
                    <svg className="ghost-parent-stub__connector" viewBox="0 0 12 18" aria-hidden="true">
                        <polygon points="6,1 2,8 10,8" fill="none" stroke="var(--color-canvas-accent)" strokeWidth="1.2" strokeLinejoin="round" />
                        <line x1="6" y1="8" x2="6" y2="18" stroke="var(--color-canvas-accent)" strokeWidth="1.2" />
                    </svg>
                </div>
            )}
```

**Current parent connector SCSS, `EditorV2.scss:1408-1412`** (verbatim):

```scss
    &__connector {
        width: 12px;
        height: 18px;
        display: block;
    }
```

(The `.ghost-parent-stub` container is `EditorV2.scss:1357-1366`: `position:absolute; bottom:100%;
left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center;
z-index:4; pointer-events:none`. The new `&__draggable` wrapper is `EditorV2.scss:1370-1377`:
`position:relative; display:flex; flex-direction:column; align-items:center; pointer-events:none;
will-change:transform`.)

**Current DOM nesting** — the connector is **OUTSIDE** the `.ghost-parent-stub__draggable` wrapper:

```
.ghost-parent-stub            (position:absolute; bottom:100%; left:50%; translateX(-50%);
│                              flex column, align center)   ← anchored to node top, centered
├── .ghost-parent-stub__draggable   [style transform: translate(dx, dy)]   ← MOVES with drag
│   └── .ghost-parent-stub__chip     (name + mm)                            ← the chip
└── <svg.ghost-parent-stub__connector viewBox="0 0 12 18">                  ← STATIC, does NOT move
        <polygon .../> <line .../>
```

The drag `transform: translate(dx, dy)` sits on `.ghost-parent-stub__draggable`, which contains
**only the chip**. The connector `<svg>` is a **flex sibling below** the draggable wrapper, a direct
child of `.ghost-parent-stub`, and receives **no** transform. **This is the root cause**: the chip is
translated while the connector stays fixed in its flex slot, so the two visually detach the moment the
chip is dragged.

---

## Q2 — Target connector, verbatim

The target connector is a single absolute `<svg>` whose geometry is fully computed per render inside
the `ghostTargets.map(...)` body. The one named constant it references is the default gap.

**Constant, `ClassNode.tsx:25-29`** (verbatim):

```tsx
// Default horizontal gap (flow px) between the node right edge and a ghost-target
// chip when its drag offset is zero. Single source of truth for both the chip
// transform and the connector geometry. Mirrors the connector length the stub
// had before it became draggable.
const GHOST_TARGET_DEFAULT_GAP = 24;
```

**Full computed geometry block, `ClassNode.tsx:502-580`** (verbatim):

```tsx
                        const off = ghostOffsets[gt.refName] ?? { dx: 0, dy: 0 };
                        const endX = GHOST_TARGET_DEFAULT_GAP + off.dx;   // chip left edge, x
                        const endY = off.dy;                              // chip vertical center, y
                        // The connector origin (0,0) sits on the node right edge at the
                        // chip-row level (CSS left:0; top:50% of the item) — NOT the node
                        // mid-height. ghostOriginY[refName] is the measured distance (flow
                        // px) from the node top down to that origin (per stacked stub);
                        // fall back to H/2 (origin ≈ node center) until measured.
                        const W = width ?? 180;
                        const H = height ?? 80;
                        const dY = ghostOriginY[gt.refName] ?? (H / 2);
                        // Node box in connector-local coords. Center (cx,cy): cy = H/2 − Δ
                        // because the origin sits at the chip-row level, not the node
                        // mid-height (Δ measured per stub).
                        const cx = -W / 2;
                        const cy = H / 2 - dY;
                        const nhw = W / 2;
                        const nhh = H / 2;
                        // Chip box. (endX,endY) is the chip LEFT-CENTER (endX = left edge,
                        // endY = vertical center), so the chip center is +chipW/2 in x.
                        // chipW/chipH are measured per stub; until measured they are 0 and
                        // the chip-border clip is skipped (the arrowhead falls back to the
                        // left-center anchor — the pre-part-2 behaviour).
                        const chip = ghostChipSize[gt.refName];
                        const chipW = chip?.w ?? 0;
                        const chipH = chip?.h ?? 0;
                        const chw = chipW / 2;
                        const chh = chipH / 2;
                        const chipCx = endX + chw;
                        const chipCy = endY;
                        // Axis node-center → chip-center. Both endpoints are clipped to
                        // their box border along this axis (closed-form ray/rect), so the
                        // line leaves the node border facing the chip and the arrowhead
                        // lands on the chip border facing the node — from any drag position.
                        const dx = chipCx - cx;
                        const dy = chipCy - cy;
                        const degenerate = dx === 0 && dy === 0;
                        // Node border (toward the chip): clamp ≤1 so start never overshoots.
                        const sDen = Math.max(Math.abs(dx) / nhw, Math.abs(dy) / nhh);
                        const sScale = sDen > 0 ? Math.min(1, 1 / sDen) : 0;
                        const startX = cx + sScale * dx;
                        const startY = cy + sScale * dy;
                        // Chip border (toward the node, direction −d): only when measured.
                        const tDen = (chw > 0 && chh > 0) ? Math.max(Math.abs(dx) / chw, Math.abs(dy) / chh) : 0;
                        const tScale = tDen > 0 ? Math.min(1, 1 / tDen) : 0;
                        const endBorderX = chipCx - tScale * dx;
                        const endBorderY = chipCy - tScale * dy;
                        // Arrowhead at the chip border, pointing along the axis into the chip.
                        const ang = Math.atan2(dy, dx);
                        const AL = 6, AW = 4;
                        const cos = Math.cos(ang), sin = Math.sin(ang);
                        const blx = (endBorderX - AL * cos + AW * sin).toFixed(1);
                        const bly = (endBorderY - AL * sin - AW * cos).toFixed(1);
                        const brx = (endBorderX - AL * cos - AW * sin).toFixed(1);
                        const bry = (endBorderY - AL * sin + AW * cos).toFixed(1);
                        // Source-side UML marker by reference kind. The kind is read
                        // from the matching MetaReference already in props
                        // (data.references carries `kind`, keyed by name — the cross-MM
                        // ref appears there too), so no transformer/types change is needed.
                        // composition → filled diamond, aggregation → hollow diamond,
                        // association → none. The target arrowhead is unchanged in all cases.
                        const refKind = data.references?.find((r) => r.name === gt.refName)?.kind ?? 'association';
                        const hasDiamond = refKind === 'composition' || refKind === 'aggregation';
                        // Rhombus along the axis at the node border (B = startX,startY):
                        // T toward the chip, S1/S2 the side vertices. Same 3:2 proportions
                        // as the same-MM edge markers (UnifiedEdge). For comp/agg the line
                        // starts at T so it never shows through the (hollow) diamond.
                        const DL = 12, DW = 8;            // diamond length / width (flow px)
                        const perpX = -sin, perpY = cos;  // axis perpendicular
                        const dTx = startX + cos * DL, dTy = startY + sin * DL;
                        const dS1x = startX + cos * (DL / 2) + perpX * (DW / 2);
                        const dS1y = startY + sin * (DL / 2) + perpY * (DW / 2);
                        const dS2x = startX + cos * (DL / 2) - perpX * (DW / 2);
                        const dS2y = startY + sin * (DL / 2) - perpY * (DW / 2);
                        const diamondPoints = `${startX.toFixed(1)},${startY.toFixed(1)} ${dS1x.toFixed(1)},${dS1y.toFixed(1)} ${dTx.toFixed(1)},${dTy.toFixed(1)} ${dS2x.toFixed(1)},${dS2y.toFixed(1)}`;
                        const diamondFill = refKind === 'composition' ? 'var(--color-canvas-accent)' : 'var(--color-canvas-bg)';
                        const lineStartX = hasDiamond ? dTx : startX;
                        const lineStartY = hasDiamond ? dTy : startY;
```

**The connector SVG JSX, `ClassNode.tsx:588-607`** (verbatim):

```tsx
                                <svg
                                    ref={(el) => {
                                        if (el) ghostConnectorRefs.current.set(gt.refName, el);
                                        else ghostConnectorRefs.current.delete(gt.refName);
                                    }}
                                    className="ghost-target-stub__connector"
                                    width={Math.max(endX + 8, 1)}
                                    height={Math.max(Math.abs(endY) + 8, 1)}
                                    aria-hidden="true"
                                >
                                    {!degenerate && (
                                        <>
                                            <line x1={lineStartX.toFixed(1)} y1={lineStartY.toFixed(1)} x2={endBorderX.toFixed(1)} y2={endBorderY.toFixed(1)} stroke="var(--color-canvas-accent)" strokeWidth="1.2" />
                                            <polyline points={`${blx},${bly} ${endBorderX.toFixed(1)},${endBorderY.toFixed(1)} ${brx},${bry}`} fill="none" stroke="var(--color-canvas-accent)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
                                            {hasDiamond && (
                                                <polygon points={diamondPoints} fill={diamondFill} stroke="var(--color-canvas-accent)" strokeWidth="1.2" strokeLinejoin="round" />
                                            )}
                                        </>
                                    )}
                                </svg>
```

**Target connector SCSS, `EditorV2.scss:1470-1480`** (verbatim):

```scss
    // Connector: y=0 sits at the chip's default vertical center (top:50%).
    // Width/height come from SVG attributes (depend on the drag offset);
    // overflow:visible keeps the line drawn when the chip is dragged up/left.
    &__connector {
        position: absolute;
        left: 0;
        top: 50%;
        display: block;
        overflow: visible;
        pointer-events: none;
    }
```

**Item / draggable context SCSS, `EditorV2.scss:1431-1455`** (the connector's positioning parents):

```scss
    &__item {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    ...
    &__draggable {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        will-change: transform;
    }
```

**Key structural fact**: the target connector `<svg>` (`ClassNode.tsx:588-607`) is rendered as a
**sibling of** the `.ghost-target-stub__draggable` wrapper inside `.ghost-target-stub__item`
(`ClassNode.tsx:582`), and is **absolutely positioned** at `left:0; top:50%` of that item. It does
**not** inherit the chip's `translate(endX, endY)`; instead it **re-draws its line** to the chip every
render because its endpoints are computed from the same `off` offset. This is exactly the model the
parent must adopt.

---

## Q3 — How the target connector tracks the chip

The target connector geometry has **three classes of input**, all read per render:

**1. Offset `{dx,dy}` from `ghostOffsets` state** — `ClassNode.tsx:503-505`:
```tsx
const off = ghostOffsets[gt.refName] ?? { dx: 0, dy: 0 };
const endX = GHOST_TARGET_DEFAULT_GAP + off.dx;   // chip left edge, x
const endY = off.dy;                              // chip vertical center, y
```
The same `(endX, endY)` drives **both** the chip transform (`ClassNode.tsx:612`,
`transform: translate(${endX}px, ${endY}px)`) and the connector's chip-side endpoint. This single
shared source is why they stay locked together.

**2. Measured DOM values from the `useLayoutEffect` at `ClassNode.tsx:209-239`:**
- `ghostOriginY[gt.refName]` — `ClassNode.tsx:513`: `const dY = ghostOriginY[gt.refName] ?? (H / 2);`
  Feeds the node-side vertical center `cy = H / 2 - dY` (`:518`). Measured at `:218`
  (`(svg.getBoundingClientRect().top - nodeTop) / zoom`).
- `ghostChipSize[gt.refName]` — `ClassNode.tsx:526-530`: feeds `chw/chh`, the chip half-extents used
  to clip the arrowhead to the chip border (`tDen`/`tScale`, `:546-547`). Measured at `:221-222`
  (`r.width / zoom`, `r.height / zoom`).

**3. Node width/height (RF node props)** — `ClassNode.tsx:511-512`:
```tsx
const W = width ?? 180;
const H = height ?? 80;
```
Feed the node half-extents `nhw = W/2`, `nhh = H/2` (`:519-520`) and the node center
`cx = -W/2` (`:517`), used to clip the **start** point to the node border.

**Start point (node-side anchor), `ClassNode.tsx:537-544`** (clipped to node border along the
center→chip ray):
```tsx
const dx = chipCx - cx;
const dy = chipCy - cy;
const degenerate = dx === 0 && dy === 0;
// Node border (toward the chip): clamp ≤1 so start never overshoots.
const sDen = Math.max(Math.abs(dx) / nhw, Math.abs(dy) / nhh);
const sScale = sDen > 0 ? Math.min(1, 1 / sDen) : 0;
const startX = cx + sScale * dx;
const startY = cy + sScale * dy;
```

**End point (chip-side), `ClassNode.tsx:531-532` + clip `:546-549`:**
```tsx
const chipCx = endX + chw;
const chipCy = endY;
...
const tDen = (chw > 0 && chh > 0) ? Math.max(Math.abs(dx) / chw, Math.abs(dy) / chh) : 0;
const tScale = tDen > 0 ? Math.min(1, 1 / tDen) : 0;
const endBorderX = chipCx - tScale * dx;
const endBorderY = chipCy - tScale * dy;
```

**Summary**: reads the offset state (yes), measured DOM values (yes — both `ghostOriginY` and
`ghostChipSize`), and node width/height (yes).

---

## Q4 — Node-side anchor + scope

**Target node-side anchor**: the connector's local origin `(0,0)` sits on the **node right edge at
the chip-row level** — established by SCSS `left:0; top:50%` of `.ghost-target-stub__item`
(`EditorV2.scss:1474-1476`) plus the per-stub measured `ghostOriginY` correction
(`cy = H/2 - dY`, `:518`). In connector-local coords the node box spans `x ∈ [-W, 0]` (right edge at
x=0) and the **start** point is the intersection of the center→chip ray with that box border
(`:541-544`). So for a rightward chip the line leaves the node near its right edge at the chip's row.

**Coordinate space**: **flow px** (node-local CSS px inside the node's RF-zoom-transformed subtree;
the SVG lives inside the node, so its user units are flow px). Every measured value is divided by
`zoom` to land in flow px (`:218`, `:222`), and the offset is divided by `zoom` in the move handler
(`:102-103`). So all three input classes are consistently flow px.

**Parent analog anchor**: **node top-center** (the chip grows upward from the node top, centered —
`.ghost-parent-stub` is `bottom:100%; left:50%; translateX(-50%)`).

**What is already in scope on the parent path** (`ClassNode` function body):
- **Node `width` / `height`** — ✓ in scope. Destructured at `ClassNode.tsx:31`
  (`function ClassNode({ id, data, selected, width, height }: ...)`); the target reads them at
  `:511-512`.
- **Parent offset `{dx,dy}`** — ✓ in scope as `ghostParentOffsets[ghost.id]` (state declared
  `:137-143`; already consumed by the chip transform at `:473`).
- **`getViewport().zoom`** — ✓ in scope (used in the parent handlers `:163`, `:172`).
- **`ghostOriginY` / `ghostChipSize`** — ✗ **TARGET-ONLY.** The `useLayoutEffect` that populates them
  (`:209-239`) iterates **`ghostTargets`** and keys by `gt.refName`; the backing refs
  `ghostConnectorRefs` / `ghostChipRefs` (`:196-197`) are set **only** in the target render
  (`:589-592`, `:616-619`). There is **no** parent measurement: the parent has no measured chip size
  and no measured connector origin.

**Implication**: the parent does **not** need `ghostOriginY` (its anchor is a single fixed
node-top-center point, not a per-stub stacked origin) and does **not** strictly need `ghostChipSize`
(it can anchor the marker to the chip's known translate position rather than clip to a measured chip
border). The parent computed connector can be built from `width/height` (only if it wants node-border
clipping) + the parent offset + a default-gap constant — all already in scope.

---

## Q5 — The arrow marker

**Target**: the marker is placed by the **same computed geometry** and therefore **tracks the chip**.
The target arrowhead is a `<polyline>` whose three points (`blx,bly` / `endBorderX,endBorderY` /
`brx,bry`) are derived from the axis angle `ang = Math.atan2(dy, dx)` and the chip-border endpoint
(`ClassNode.tsx:550-557`), then rendered at `:601`. The optional source-side diamond
(composition/aggregation) is likewise computed along the same axis (`:566-580`) and rendered at
`:603`. There is **no** static/separate marker element — every marker vertex is recomputed each render
from the live offset, so the arrowhead always lands on the chip border facing the node, and rotates to
follow the axis.

**Parent**: the marker is a **hollow UML generalization triangle**, currently a **static** polygon in
the fixed viewBox (`ClassNode.tsx:488`: `<polygon points="6,1 2,8 10,8" fill="none" ...>` — apex up at
y=1, base at y=8). It must sit at the **chip end** of the computed line. To mirror the target, the
parent should build the triangle's three points from the connector's chip-end point (the chip's
translated position) instead of a fixed viewBox, and render it as a `<polygon fill="none">`. Per
step 7's allowance, the parent triangle may stay **axis-aligned (apex pointing up)** — it does **not**
need the target's `atan2` rotation; only its **position** must follow the chip.

---

## Q6 — Unit consistency (likely bug source)

**Parent chip transform unit** — `ClassNode.tsx:473`:
```tsx
style={{ transform: `translate(${ghostParentOffsets[ghost.id]?.dx ?? 0}px, ${ghostParentOffsets[ghost.id]?.dy ?? 0}px)` }}
```
`dx,dy` originate in `onGhostParentPointerMove` — `ClassNode.tsx:163-165`:
```tsx
const zoom = getViewport().zoom || 1;   // screen px -> flow px
const dx = d.baseDx + (e.clientX - d.startX) / zoom;
const dy = d.baseDy + (e.clientY - d.startY) / zoom;
```
The screen delta is divided by `zoom`, so the stored `dx,dy` are **flow px**. They are applied as
`translate(...px)` inside the node's RF-zoom-scaled subtree, i.e. flow px → screen px is handled by the
node transform. **Unit = flow px.**

**Target connector geometry unit**: identical. The target offset comes from the same `/zoom` division
(`ClassNode.tsx:102-103`), feeds `endX = GHOST_TARGET_DEFAULT_GAP + off.dx` / `endY = off.dy`
(`:504-505`), and the SVG lives inside the same node subtree → its user units are **flow px**. The
target chip transform uses the very same `(endX, endY)` (`:612`), so chip and connector share one
flow-px coordinate.

**Consistency verdict**: **no mismatch in the existing parent drag path** — the parent chip already
moves in flow px, exactly like the target. The bug is **purely structural** (Q1): the parent connector
is a static SVG that never reads the offset, so it can't follow. **The fix is safe on units as long as
the new parent connector reads the SAME `ghostParentOffsets[ghost.id]` value (flow px) that drives the
chip transform at `:473`** and renders in the node-local (flow px) SVG space. Do **not** re-multiply by
zoom and do **not** use raw `clientX/clientY` deltas — both would desync the connector from the chip at
non-1.0 zoom.

---

## Fix shape (minimal computed parent connector, mirroring the target)

- **Make the connector absolute and move it out of the flex flow.** Change
  `.ghost-parent-stub__connector` (`EditorV2.scss:1408-1412`) to mirror
  `.ghost-target-stub__connector` (`:1473-1480`): `position:absolute; overflow:visible;
  pointer-events:none`, anchored at the **node top-center** (e.g. `left:50%; bottom:0` with its own
  `translateX(-50%)`, so its local origin `(0,0)` is the node top edge midpoint). Keep it a **sibling
  outside** `.ghost-parent-stub__draggable` (it must NOT inherit the chip transform; like the target's
  connector being outside `__draggable`).
- **Read the offset from state, not a ref.** Compute geometry in the JSX from
  `const poff = ghostParentOffsets[ghost.id] ?? { dx: 0, dy: 0 }` — the **same** map that drives the
  chip transform (`:473`). Units are **flow px**; do not touch zoom again (Q6).
- **Introduce a vertical default-gap constant** (e.g. `GHOST_PARENT_DEFAULT_GAP`, flow px) analogous to
  `GHOST_TARGET_DEFAULT_GAP` (`:29`), sized to reproduce today's rest look (chip ≈18 px above the node
  top — the current static connector height). Chip-end point in connector-local coords (origin =
  node-top-center, SVG +y points down, `overflow:visible` lets it draw upward): roughly
  `endX = poff.dx`, `endY = -(GHOST_PARENT_DEFAULT_GAP) + poff.dy`. Node-side start = `(0, 0)`
  (node top-center). **Invariant**: at `poff = (0,0)` the rendered line + triangle must look identical
  to today's static 12×18 SVG.
- **Draw line + hollow triangle at the chip end.** Mirror the target's "marker is computed geometry"
  approach: a `<line>` from the node-top-center start to the triangle base, plus a
  `<polygon fill="none">` generalization triangle positioned at the chip end. Per step 7 the triangle
  may stay **axis-aligned / apex-up** (no `atan2` rotation needed) — only its **position** must follow
  `poff`. Size the SVG `width`/`height` from `Math.abs(endX)+pad` / `Math.abs(endY)+pad` like the
  target (`:594-595`) so it is never clipped.
- **`ghostOriginY` and `ghostChipSize` are target-only and NOT required** (Q4): the parent anchor is a
  single fixed node-top-center point (no per-stub stacked origin), and the triangle can be anchored to
  the chip's known translate position (`poff`) rather than clipped to a measured chip border. Node
  `width`/`height` are only needed if the implementer wants to clip the **start** to the node top
  border; for a single top-centered chip the fixed `(0,0)` start is sufficient. No new
  `useLayoutEffect`, ref map, or measurement is needed.

---

*End of discovery. No source files were modified. No implementation performed.*
