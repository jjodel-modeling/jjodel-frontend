# Prompt 2c — Edge label/cardinality: cross-edge de-overlap (cardinality stagger per (target, side) + role slide-along-edge for bundles)

> Branch: `alfonso-frontend-jjtl`. Area: v2-flow edge rendering. **NOT** critical-zone.
> Design source (read both before starting):
> - `docs/2026-05-31_edge_label_cardinality_spec.md` (approved spec)
> - `docs/discovery/2026-05-31_edge_label_anchoring.md` (Phase-1 discovery)
> **Prerequisite:** prompt `docs/2026-05-31_phase2b_edge_label_per_edge.md` (2b') must be
> applied first. 2c builds directly on the helpers and anchors 2b' introduced.

---

## 0. What this prompt changes (one line)

Add the **cross-edge** de-overlap the spec defers from 2b': (A) **cardinalities** on
the same `(target node, target side)` stagger slightly in **depth** so they don't pile
up under a small box; (B) **roles** of parallel "bundle" edges (same source/target
pair) slide **along their own edge** so they stop landing on the same arc-length
midpoint. Reuse the existing handle index — no new geometry sources, no touching the
sync/distribution layers' internals.

## 1. Baseline assumption + STOP guard (read first)

2c assumes **2b' has been applied**. Verify the 2b' anchors exist before editing:

```bash
grep -rn "computeCardinalityAnchor\|CARD_BOX_GAP\|ROLE_LINE_GAP" frontend/src/components/editor-v2/
grep -n "isHorizontal" frontend/src/components/editor-v2/utils/edgeUtils.ts
```

- If `computeCardinalityAnchor` / `CARD_BOX_GAP` are **missing**, 2b' has not been
  applied. **STOP** — apply 2b' first, do not re-implement it here.
- Confirm `computeLabelPosition` (in `edgeUtils.ts`) currently takes a **single**
  `path` argument and returns `{ x, y, isHorizontal }`. 2c adds the optional second
  argument. If it already has a second argument, STOP and report (2c may already be
  partly applied).

Confirm the `applyDistribution` shape at `EditorV2.tsx` (~826-847): a `useCallback`
that calls `computePortDistribution(...)`, destructures `{ edgeHandles }`, and
`.map`s the edge list returning `{...edge, sourceHandle, targetHandle}` only when the
handles changed. This is the insertion point for the cardinality stagger.

## 2. Scope — touch ONLY these files

1. `frontend/src/components/editor-v2/utils/edgeUtils.ts` — add optional `arcOffset` to `computeLabelPosition`.
2. `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` — role slide + consume `cardinalityShift`.
3. `frontend/src/components/editor-v2/EditorV2.tsx` — compute the per-`(target, side)` stagger in `applyDistribution` (this site is **non** critical-zone; it is a render-handler, not the sync layer).
4. `frontend/src/components/editor-v2/types.ts` — add ONE optional field to an edge-data interface (additive; allowed by CLAUDE.md §2).

This is **4 files** — within the >5-file pause threshold, but list them to the owner
up front and confirm before starting (CLAUDE.md §1).

**Do NOT touch** `portDistribution.ts`, `useJjomSync.ts`, `useM1ReferenceEdges.ts`,
`handlePosition.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `VersionFixer.tsx`. The
spec confirms `applyDistribution` (in `EditorV2.tsx`) is the only assembly-level site
needed, and no migration is required (ephemeral render data, not `jsxString`).

## 3. Guardrails (CLAUDE.md)

- **Non critical-zone** → no Layer Impact Report required. `applyDistribution` lives in
  `EditorV2.tsx` and is a handler that re-derives handle ids on every `setEdges`; it is
  **not** part of `useJjomSync` and does not write the model. Do not wrap anything in
  `TRANSACTION`.
- **No renames** of CSS classes, functions, props, exported names (§2, §4.2).
- `grep` every new identifier globally before introducing it (§4.3).
- `npm run typecheck` + `npm run build` must pass. No `console.log` left behind.
- No `git add .`; show the diff and wait for approval; append a log entry (§6, §21).

## 4. Acceptance criteria (mechanically checkable — §5.1)

1. **Cardinality stagger.** When ≥2 reference edges enter the *same target node on the
   same side* (e.g. the stress model: A receiving 4 edges on one side), their
   cardinalities no longer overlap: each sits a little further out (in depth) than the
   previous, all still just outside the box on the entry side, readable.
2. **Role bundle slide.** Two parallel edges between the *same* source/target pair draw
   their roles at *different* points along their respective paths (one nearer source,
   the other nearer target), not stacked at the identical arc-length midpoint.
3. **Single edges unaffected.** A lone reference edge (no bundle, only one cardinality
   on its target side) renders exactly as after 2b' — shift = 0, midpoint unchanged.
4. **Unchanged:** self-loop, inheritance/ISA (no cardinality → stagger is a no-op for
   it), M1 hover, highlight, inline editing.
5. `npm run typecheck` + `npm run build` pass.

## 5. Implementation

### 5.1 `edgeUtils.ts` — role slide-along-edge via optional `arcOffset`

Extend `computeLabelPosition` with an optional second parameter that shifts the
target arc-length along the path (positive = toward target, negative = toward source),
clamped to stay on the polyline. Default `0` keeps 2b' callers identical.

Change the signature and the `remaining` initialization only:

```ts
export function computeLabelPosition(
    path: string,
    arcOffset: number = 0,
): { x: number; y: number; isHorizontal: boolean } {
    // ... parse points, build segLen[], total (unchanged from 2b') ...
    if (total === 0) return { x: points[0].x, y: points[0].y, isHorizontal: true };

    // Slide the anchor along the path; clamp inside [margin, total - margin] so the
    // role never rides onto an endpoint.
    const margin = Math.min(12, total / 2);
    let remaining = Math.max(margin, Math.min(total - margin, total / 2 + arcOffset));
    // ... walk segLen[] exactly as in 2b' ...
}
```

> Update the JSDoc to mention `arcOffset`. Do not change the walk loop logic.

### 5.2 `UnifiedEdge.tsx` — role slide amount from the handle index

Reintroduce the per-edge handle-index term that 2b' removed, but apply it as an
**arc-length** offset (slide along the edge), not a perpendicular offset. The combined
handle-index formula is the same one HEAD used for the old stacking; `getHandleIndex`,
`LABEL_SPREAD_PX`, `MAX_HANDLES_PER_SIDE`, `source`, `target` are all already in the
file (2b' left them; confirm with a grep, re-add the import only if the typechecker
flagged it unused after 2b').

Update the `labelPos` useMemo to compute the slide and pass it through:

```ts
const labelPos = useMemo(() => {
    if (isSelfLoop) {
        const p = selfLoopGeom?.labelPoint ?? computeLabelPosition(spreadPath);
        return { x: p.x, y: p.y, isHorizontal: true };
    }
    // Slide bundled parallel edges apart along their own path (handle-index driven).
    const sourceIndex = getHandleIndex(sourceHandleId);
    const targetIndex = getHandleIndex(targetHandleId);
    const directionSign = source < target ? 1 : -1;
    const labelIndex = (sourceIndex + targetIndex) / 2 + directionSign * 0.5;
    const arcOffset = (labelIndex - (MAX_HANDLES_PER_SIDE - 1) / 2) * LABEL_SPREAD_PX;
    return computeLabelPosition(spreadPath, arcOffset);
}, [spreadPath, isSelfLoop, selfLoopGeom, sourceHandleId, targetHandleId, source, target]);
```

`labelOffset` (the `ROLE_LINE_GAP` perpendicular nudge from 2b') stays as-is — it still
depends only on `labelPos.isHorizontal`.

### 5.3 `types.ts` — one optional field

Add an optional numeric field to `ReferenceEdgeData` (interface at ~135). Adding an
optional property is explicitly allowed (§2). The interface already has
`[key: string]: unknown`, so this is documentation more than necessity, but add it for
clarity:

```ts
export interface ReferenceEdgeData {
    reference: MetaReference;
    waypoints?: EdgeWaypoint[];
    sourceAnchor?: AnchorConfig;
    targetAnchor?: AnchorConfig;
    /** Depth stagger (px) for the cardinality when several share a target side. Set by applyDistribution. */
    cardinalityShift?: number;
    [key: string]: unknown;
}
```

### 5.4 `EditorV2.tsx` — compute the per-(target, side) stagger in `applyDistribution`

Inside `applyDistribution`, after `const { edgeHandles } = computePortDistribution(...)`,
group edges by `(target node, target side)` using the **assigned** target handle, then
assign an increasing depth shift to the 2nd, 3rd, … edge in each group (ordered by
handle index for determinism). Write it into `edge.data.cardinalityShift`, and return a
new edge object when **either** the handles **or** the shift changed.

Add the import (top of `EditorV2.tsx`, from `./utils/edgeUtils`) — `getSideFromHandle`
is **not** yet imported there:

```ts
import { getSideFromHandle } from './utils/edgeUtils';
// (or add getSideFromHandle to the existing edgeUtils import if one exists)
```

Add a constant near the other module constants (grep `CARD_STAGGER_STEP` first):

```ts
const CARD_STAGGER_STEP = 11; // px of extra depth per extra cardinality on the same side
```

Rewrite the body of `applyDistribution` (keep the `useCallback` signature/deps):

```ts
const { edgeHandles } = computePortDistribution(edgeList, nodeIds, positions);

// Group by (target node, target side) using the assigned target handle, then
// stagger cardinality depth for the 2nd+ edge in each group (ordered by handle idx).
const handleIdx = (h?: string | null) => {
    const m = h?.match(/-(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
};
const groups = new Map<string, string[]>();
for (const edge of edgeList) {
    if (edge.type !== 'reference') continue; // only reference edges show cardinality
    const th = edgeHandles.get(edge.id)?.targetHandle ?? edge.targetHandle ?? null;
    if (!th) continue;
    const key = `${edge.target}:${getSideFromHandle(th)}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(edge.id);
}
const shiftById = new Map<string, number>();
for (const [, ids] of groups) {
    if (ids.length < 2) continue; // single cardinality: no stagger
    ids.sort((a, b) => {
        const ha = edgeHandles.get(a)?.targetHandle ?? null;
        const hb = edgeHandles.get(b)?.targetHandle ?? null;
        return handleIdx(ha) - handleIdx(hb);
    });
    ids.forEach((id, i) => shiftById.set(id, i * CARD_STAGGER_STEP));
}

return edgeList.map(edge => {
    const distributed = edgeHandles.get(edge.id);
    const shift = shiftById.get(edge.id) ?? 0;
    const handlesChanged = !!distributed &&
        (edge.sourceHandle !== distributed.sourceHandle ||
         edge.targetHandle !== distributed.targetHandle);
    const shiftChanged = ((edge.data as { cardinalityShift?: number })?.cardinalityShift ?? 0) !== shift;
    if (!handlesChanged && !shiftChanged) return edge;
    return {
        ...edge,
        ...(distributed
            ? { sourceHandle: distributed.sourceHandle, targetHandle: distributed.targetHandle }
            : {}),
        data: { ...edge.data, cardinalityShift: shift },
    };
});
```

> The `(groups.get(key) ?? groups.set(key, []).get(key)!)` idiom is terse — if it reads
> awkwardly in this file's style, expand it to an explicit `if (!groups.has(key))`
> block. Match the surrounding code.

**Correctness note:** the old code returned `edge` unchanged when handles didn't
change, which kept referential identity and avoided re-renders. Preserve that: only
return a new object when handles **or** shift changed (the sketch does). This keeps
ReactFlow from re-rendering every edge each pass.

### 5.5 `UnifiedEdge.tsx` — feed the shift into the cardinality anchor

Read the shift from edge `data` and pass it as `computeCardinalityAnchor`'s
`depthShift`. `data` is available in the component (it already reads
`data.reference`, etc. — find the existing destructure of `data` / `edgeData`):

```ts
const cardinalityShift = (data as { cardinalityShift?: number })?.cardinalityShift ?? 0;
```

Then in the `cardinalityTransform` useMemo (added by 2b'), pass it through and add it
to the deps:

```ts
const cardinalityTransform = useMemo(() => {
    if (isSelfLoop) {
        const p = selfLoopGeom?.cardinalityPoint ?? computeCardinalityPosition(spreadPath);
        return `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
    }
    return computeCardinalityAnchor(targetX, targetY, targetSide, CARD_BOX_GAP, cardinalityShift);
}, [isSelfLoop, selfLoopGeom, spreadPath, targetX, targetY, targetSide, cardinalityShift]);
```

(Match however `data` is named in the component — it may be `props.data`, a destructured
`data`, or `edgeData`. Use the existing name; do not introduce a new prop.)

## 6. Tuning notes (leave as code comments, not TODO churn)

- `CARD_STAGGER_STEP` (11px) and `LABEL_SPREAD_PX` (18px, reused for the role slide) are
  starting values. The spec calls the cardinality de-overlap "minimo … niente di
  sofisticato" — a flat per-index stagger is intentionally simple. Gating it on actual
  box size / collision is a future refinement (spec "Casi residui"); a one-line
  `// TODO: gate stagger on box size` comment is fine, do not build it here.
- The spec's residual "contesa d'angolo" (cardinality on a side colliding with the
  perpendicular side's cardinality) is accepted with a TODO — do not add a clamp now.

## 7. Validation (visual, UML notation — from the spec)

- **stress model** (A with 4 edges on one small side): the 4 cardinalities now staggered
  in depth and readable; the 4 `newAssociation` roles separated along their edges; no
  garble.
- **library model**: lone edges unchanged from 2b' (shift 0); any same-side pair
  staggered.
- Generalization unaffected (no cardinality); self-loop identical; inline editing works.

## 8. Hard stops (pause and report)

- §1 grep shows 2b' not applied → STOP (apply 2b' first).
- The 4-file scope would have to grow → STOP and list the extra file.
- You feel the need to edit `portDistribution.ts` / `handlePosition.ts` /
  `useJjomSync.ts` to make the stagger work → STOP; the spec confines this to
  `applyDistribution` + the component.
- `applyDistribution` changes cause edge churn / flicker (every edge re-rendering each
  pass) → STOP and re-check the referential-identity rule in §5.4.

## 9. Done checklist

- [ ] 2b' confirmed applied (§1 grep).
- [ ] `computeLabelPosition` gained optional `arcOffset`; default keeps 2b' callers identical.
- [ ] Role slide reads handle index → `arcOffset`; bundles separate along the edge.
- [ ] `ReferenceEdgeData.cardinalityShift?: number` added.
- [ ] `applyDistribution` groups by `(target, side)`, staggers depth, preserves edge identity when nothing changed.
- [ ] `getSideFromHandle` imported in `EditorV2.tsx`; `CARD_STAGGER_STEP` added.
- [ ] Cardinality anchor consumes `cardinalityShift`.
- [ ] Self-loop / inheritance / M1 / highlight / editing unchanged.
- [ ] `npm run typecheck` + `npm run build` green.
- [ ] Diff shown to owner before commit; `docs/claude-code-log.md` entry appended.
