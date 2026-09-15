# Prompt 2b' — Edge label/cardinality: per-edge anchoring (role → arc-length midpoint, cardinality → target-extremity corner clearance)

> Branch: `alfonso-frontend-jjtl`. Area: v2-flow edge rendering. **NOT** critical-zone.
> Design source (read both before starting):
> - `docs/2026-05-31_edge_label_cardinality_spec.md` (approved spec)
> - `docs/discovery/2026-05-31_edge_label_anchoring.md` (Phase-1 read-only discovery)
> This is the **first** of two prompts. The second (`docs/2026-05-31_phase2c_edge_label_deoverlap.md`)
> adds cross-edge de-overlap; **do not** implement 2c here.

---

## 0. What this prompt changes (one line)

Stop drawing the role label on the *longest segment* midpoint and stop anchoring the
cardinality from the path; instead put the **role at the arc-length midpoint** of the
edge (with a small perpendicular nudge off the line) and the **cardinality just
outside the target box** at the entry handle, anchored per side so it never overlaps
the rectangle. Role and cardinality stay **two separate elements** — they are not
merged into a group.

## 1. Baseline assumption + STOP guard (read first)

This prompt is written against **committed HEAD**. A previous, now-**abandoned**
exploration ("unified role+cardinality group pinned at the target box") may still be
present in the working tree. The approved spec explicitly supersedes it
(see the spec's "Cosa questo supera").

**Discovery guard — before editing, verify the baseline (per CLAUDE.md §5):**

```bash
grep -rn "edge-label-group\|computeLabelGroupTransform\|LABEL_BOX_GAP" frontend/src/components/editor-v2/
```

- If these symbols **exist** in the working tree, the baseline is the abandoned
  approach, **not** clean HEAD. **STOP** and report — do not build on top of it. The
  owner will reset these files to HEAD first.
- If the grep returns **nothing**, you are on clean HEAD. Proceed.

Also confirm the HEAD shape you will edit (these must match before you change them):

```bash
grep -n "computeLabelPosition\|computeCardinalityPosition" frontend/src/components/editor-v2/utils/edgeUtils.ts
grep -n "labelPos\|labelOffset\|cardinalityPos\|cardinalityOffset\|targetSide" frontend/src/components/editor-v2/edges/UnifiedEdge.tsx
```

Expected at HEAD: `computeLabelPosition` returns the *longest-segment* midpoint
(`edgeUtils.ts:~792-814`); `computeCardinalityPosition` returns a near-target inset
point (`edgeUtils.ts:~824-844`); `UnifiedEdge.tsx` has `labelPos`/`labelOffset`
useMemos (~280-313), `cardinalityPos`/`cardinalityOffset` useMemos (~316-342),
`targetSide = getSideFromHandle(targetHandleId)` (~175), and renders two sibling
`<div>`s (`.edge-label` ~667-692, `.edge-cardinality` ~695-706). If line numbers
drift slightly that's fine; the symbols must match.

## 2. Scope — touch ONLY these files

1. `frontend/src/components/editor-v2/utils/edgeUtils.ts`
2. `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`
3. `frontend/src/components/editor-v2/EditorV2.scss` (only if a layout tweak is needed; likely no change)

**Do NOT touch** (per spec + discovery — the side/position of the target handle
already reaches the component): `portDistribution.ts`, `useJjomSync.ts`,
`useM1ReferenceEdges.ts`, `handlePosition.ts`, `canvasToJjom.ts`,
`jjomTransformers.ts`, `VersionFixer.tsx`. **No VersionFixer migration is needed** —
these are ephemeral render-time props, not persisted `jsxString`.

If you find you must touch any other file, **STOP and ask** (CLAUDE.md §1, §4.1).

## 3. Guardrails (CLAUDE.md)

- **Non critical-zone**, so no Layer Impact Report is required. But the no-rename and
  preservation rules still apply.
- **Do not rename** existing identifiers: CSS classes (`edge-label`, `edge-label__text`,
  `edge-label__input`, `edge-cardinality`, `--m1-hover`, `selected`, `hl-c*`),
  functions, props, exported names. CSS class names are public API (§2, §4.2).
- **Do not delete** `computeLabelPosition` / `computeCardinalityPosition`. You will
  *change* `computeLabelPosition`'s algorithm in place (directed by the spec) and
  *keep* `computeCardinalityPosition` (still used by the self-loop fallback). If a
  helper ends up unused, mark it `// TODO: cleanup` — do not remove it.
- **Self-loop and ISA/inheritance branches must stay byte-identical in behavior.**
  Only the non-self-loop, non-inheritance reference/composition path changes.
- Before adding any new identifier (new constant, new function), `grep` it globally
  first (§4.3). Suggested new names below — verify they don't collide.
- Build must stay green: `npm run typecheck` (or `npx tsc --noEmit`) and `npm run build`.
- No `console.log` left behind. No `git add .`. Show the diff before any commit and
  wait for approval (§6.3). Append a `docs/claude-code-log.md` entry at the end (§21).

## 4. Acceptance criteria (mechanically checkable — §5.1)

After this prompt, on a UML-notation metamodel:

1. **Role at arc-length midpoint.** For a reference edge with an L- or Z-shaped
   orthogonal path, the role label sits at the point that is 50% of the *total path
   length* from the source, not at the midpoint of the single longest segment. Verify
   by routing an edge whose longest segment is at one end: the role no longer jumps to
   that end, it sits in the geometric middle of the run.
2. **Role off the line.** The role text does not sit directly on top of the edge
   stroke; it is nudged a few px perpendicular to the segment it lands on.
3. **Cardinality just outside the target box.** The cardinality (`0..*`, `1`, …) sits
   immediately outside the target node's border at the entry handle, on the entry
   side, and **never overlaps the rectangle** regardless of text length or which of
   the 4 sides the edge enters.
4. **Role and cardinality are separate** (two DOM elements, two transforms). There is
   **no** merged `.edge-label-group` wrapper.
5. **Unchanged:** self-loop role+cardinality (dedicated loop-corner anchor),
   inheritance "ISA" label, M1 hover-visibility, highlight classes, inline role
   editing (double-click → input → commit).
6. `npm run typecheck` and `npm run build` pass.

**Explicitly deferred to 2c (do NOT do here):** any de-overlap between parallel
"bundle" edges (same source/target pair) or between multiple cardinalities on the same
target side. After 2b' alone, two parallel bundle edges will draw their roles at the
**same** midpoint (they overlap) — this is expected and is resolved by 2c
(role slide-along-edge). Do not reintroduce the old handle-index perpendicular
stacking to paper over it; the spec relocates that mechanism to 2c. See §6.

## 5. Implementation

### 5.1 `edgeUtils.ts` — role anchor becomes the arc-length midpoint

Change `computeLabelPosition` so it returns the point at **half the total arc length**
of the polyline, and also reports the orientation of the segment that midpoint lands
on (needed for the perpendicular nudge). Extending the return shape with one extra
field is additive — the only other caller is the self-loop one-frame fallback, which
reads `.x`/`.y` only.

Replace the body of `computeLabelPosition` (keep the exported name; update the
JSDoc to describe "arc-length midpoint"):

```ts
export function computeLabelPosition(
    path: string,
): { x: number; y: number; isHorizontal: boolean } {
    const points = parsePathPoints(path);
    if (points.length < 2) return { x: 0, y: 0, isHorizontal: true };

    const segLen: number[] = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segLen.push(len);
        total += len;
    }
    if (total === 0) return { x: points[0].x, y: points[0].y, isHorizontal: true };

    let remaining = total / 2;
    for (let i = 0; i < segLen.length; i++) {
        if (remaining <= segLen[i] || i === segLen.length - 1) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const t = segLen[i] === 0 ? 0 : Math.min(1, remaining / segLen[i]);
            const isHorizontal = Math.abs(p2.y - p1.y) < Math.abs(p2.x - p1.x);
            return {
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t,
                isHorizontal,
            };
        }
        remaining -= segLen[i];
    }
    const mid = points[Math.floor(points.length / 2)];
    return { x: mid.x, y: mid.y, isHorizontal: true };
}
```

> Note for 2c: 2c will add an optional `arcOffset` parameter to this function to slide
> the role along the path for bundle de-overlap. Do **not** add it now — keep the
> single-parameter signature.

### 5.2 `edgeUtils.ts` — cardinality anchor helper (corner clearance)

Add a small helper that produces the cardinality's CSS transform from the **target
handle position + side**, so the text sits just outside the box and the box edge is
always cleared (the per-side translate origin makes the text extend *away* from the
box). `Side` is already exported (`edgeUtils.ts:21`).

```ts
// Distance from the target node border to the cardinality, just outside the box.
export const CARD_BOX_GAP = 8;

/**
 * CSS transform that anchors the cardinality just outside the target box at the
 * entry handle, with a per-side transform origin so the text always extends away
 * from the rectangle (no text measurement, no overlap with the box). `depthShift`
 * pushes it further out along the entry axis — 0 here; 2c uses it for de-overlap.
 */
export function computeCardinalityAnchor(
    targetX: number,
    targetY: number,
    targetSide: Side,
    boxGap: number,
    depthShift: number = 0,
): string {
    const gap = boxGap + depthShift;
    switch (targetSide) {
        case 'top':    return `translate(-50%, -100%) translate(${targetX}px, ${targetY - gap}px)`;
        case 'bottom': return `translate(-50%, 0%) translate(${targetX}px, ${targetY + gap}px)`;
        case 'left':   return `translate(-100%, -50%) translate(${targetX - gap}px, ${targetY}px)`;
        case 'right':
        default:       return `translate(0%, -50%) translate(${targetX + gap}px, ${targetY}px)`;
    }
}
```

> `grep -rn "CARD_BOX_GAP\|computeCardinalityAnchor" frontend/src/` first — both should
> be new (no collision).

### 5.3 `UnifiedEdge.tsx` — role position + nudge

Add the role line-gap constant near the other label constants (`LABEL_SPREAD_PX` is
at the top, ~line 42). `grep -rn "ROLE_LINE_GAP" frontend/src/` first.

```ts
const ROLE_LINE_GAP = 10; // px, perpendicular nudge so the role text is off the line
```

Rewrite the `labelPos` useMemo so its result always carries `isHorizontal` (uniform
type, avoids a union with the self-loop point), and replace the `labelOffset` useMemo
with the small perpendicular nudge — **dropping** the longest-segment recomputation
and the handle-index stacking (the latter moves to 2c):

```ts
// ─── Role label positioning (reference / composition edges) ───
const labelPos = useMemo(() => {
    if (isSelfLoop) {
        const p = selfLoopGeom?.labelPoint ?? computeLabelPosition(spreadPath);
        return { x: p.x, y: p.y, isHorizontal: true };
    }
    return computeLabelPosition(spreadPath); // arc-length midpoint + orientation
}, [spreadPath, isSelfLoop, selfLoopGeom]);

// Small perpendicular nudge off the line. No cross-edge de-overlap here (see 2c).
const labelOffset = useMemo(() => {
    if (isSelfLoop) return { x: 0, y: 0 };
    return labelPos.isHorizontal ? { x: 0, y: -ROLE_LINE_GAP } : { x: ROLE_LINE_GAP, y: 0 };
}, [isSelfLoop, labelPos]);
```

The existing role `<div>` render at ~667-692 already uses
`translate(${labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)` — leave
that line as-is. The `getHandleIndex`, `LABEL_SPREAD_PX`, `MAX_HANDLES_PER_SIDE`,
`source`/`target` references that were only used by the old `labelOffset` may now be
unused **by the role**; they are still used elsewhere (bundle path spread, cardinality
old offset until you remove it). Verify with the typechecker; remove an import only if
the compiler flags it as unused, otherwise leave it (2c re-introduces `getHandleIndex`
for the role slide).

### 5.4 `UnifiedEdge.tsx` — cardinality transform

Replace the `cardinalityPos` + `cardinalityOffset` useMemos (~316-342) with a single
`cardinalityTransform` useMemo. Self-loop keeps its path-based point; non-self-loop
uses the new handle-anchored corner clearance:

```ts
// ─── Cardinality positioning ───
const cardinalityTransform = useMemo(() => {
    if (isSelfLoop) {
        const p = selfLoopGeom?.cardinalityPoint ?? computeCardinalityPosition(spreadPath);
        return `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
    }
    // Just outside the target box at the entry handle, per-side corner clearance.
    return computeCardinalityAnchor(targetX, targetY, targetSide, CARD_BOX_GAP);
}, [isSelfLoop, selfLoopGeom, spreadPath, targetX, targetY, targetSide]);
```

Update the cardinality `<div>` render (~695-706) to use it. The div currently builds
its transform from `cardinalityPos`/`cardinalityOffset`; change the `transform` line to:

```tsx
transform: cardinalityTransform,
```

Leave everything else on that div (the `className`, `hlClass`, `pointerEvents:'none'`,
the `{cardinality}` child) unchanged. Add the new imports from `edgeUtils`:
`computeCardinalityAnchor`, `CARD_BOX_GAP` (the import block is at the top, ~lines
12-28; `computeLabelPosition`/`computeCardinalityPosition`/`getSideFromHandle` are
already imported).

### 5.5 `EditorV2.scss` — likely no change

`.edge-label` and `.edge-cardinality` stay separate elements; their existing rules
(~2052-2130) still apply. Only add a rule if a visual regression appears (e.g.
`.edge-cardinality` needs `position: absolute` to honor the transform — check; the
HEAD render already sets `position:'absolute'` inline, so likely nothing is needed).
If you do add a rule, do not rename or alter the existing selectors.

## 6. Why removing the handle-index stacking here is correct (not a regression)

CLAUDE.md §2/§3 say "never degrade committed behavior." The committed behavior spreads
parallel-bundle labels via a perpendicular handle-index offset. The approved spec
(`docs/2026-05-31_edge_label_cardinality_spec.md`) **intentionally relocates** bundle
de-overlap: roles slide **along** the edge and cardinalities stagger in **depth**, both
in prompt 2c. Removing the old perpendicular stacking here is a required, directed step
of that redesign — not an accidental degradation. The immediately-following 2c restores
separation via the spec's chosen mechanism. Recommend running 2b' and 2c back-to-back
before judging the visual result on bundles.

## 7. Validation (visual, UML notation — from the spec)

- **library model**: every cardinality at its own target extremity; every role at mid-edge;
  no role↔cardinality overlap.
- **stress model** (class A with edges entering from B/C/D/NewClass on one small side):
  the 4 cardinalities readable just outside A on the entry side (they may still be a bit
  tight — 2c staggers them); the 4 `newAssociation` roles at their midpoints. Parallel
  bundle roles between the *same* pair may overlap until 2c — expected.
- Generalization shows no role/cardinality; composition shows its source diamond intact;
  self-loop identical; inline role editing works.

## 8. Hard stops (pause and report — do not guess)

- The §1 grep finds the abandoned group approach in the working tree → STOP.
- A path/symbol cited above does not exist after grep → STOP (§5/§7 of CLAUDE.md).
- The change forces an edit outside the 3 scoped files → STOP.
- You are tempted to touch `portDistribution.ts` / `useJjomSync.ts` / `handlePosition.ts`
  to make a label sit right → STOP; that's the structural lever explicitly deferred
  (spec "Casi residui" #4).

## 9. Done checklist

- [ ] §1 baseline guard ran clean.
- [ ] `computeLabelPosition` returns arc-length midpoint + `isHorizontal`.
- [ ] `computeCardinalityAnchor` + `CARD_BOX_GAP` added; `computeCardinalityPosition` kept.
- [ ] Role uses arc-length midpoint + `ROLE_LINE_GAP` nudge; no handle-index stacking.
- [ ] Cardinality uses per-side corner-clearance transform; self-loop branch unchanged.
- [ ] Inheritance/ISA, M1 hover, highlight, inline editing all unchanged.
- [ ] `npm run typecheck` + `npm run build` green.
- [ ] Diff shown to owner before commit; `docs/claude-code-log.md` entry appended.
