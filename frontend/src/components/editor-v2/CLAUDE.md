# editor-v2 — sync layer working rules

Loaded only when working under `frontend/src/components/editor-v2/`. Moved verbatim out of the
root `CLAUDE.md` (§3.3, §3.4, §3.5, §3.10, §3.11) on 2026-09-18 (P-2026-09-18-1930 Phase 1): these
five subsections are sync-layer mechanics that only matter once work is already under this
directory. §3.1 (the critical-zone file table) and §3.2 (the Layer Impact Report template) stay in
the root `CLAUDE.md` — an agent must see them *before* deciding to act, and therefore before this
module could have loaded.

---

### 3.3 TRANSACTION rules near the sync layer

`DVertex.new`, `DVoidEdge.new2`, and `DVoidEdge.new3` each open an internal
TRANSACTION. Wrapping them in an outer TRANSACTION causes coordinate loss and
dropped `SetFieldAction`s (nested writes are merged out).

**WRONG — coordinate loss**
```typescript
TRANSACTION('create vertices', () => {
    for (const node of nodes) {
        DVertex.new(node.id, modelId);   // ← nested TRANSACTION dropped
    }
});
```

**RIGHT — bare loop mirroring useJjomSync**
```typescript
for (const node of nodes) {
    DVertex.new(node.id, modelId);
}
```

**SAFE — pure-action TRANSACTION (no creators)**
TRANSACTIONs that contain only `SetFieldAction`, `SetRootFieldAction`, or
`DeleteElementAction` (no `.new()` / `.new2()` / `.new3()` calls) are safe
even in sync-adjacent code. This pattern is used for:
- Tagging a newly created graph (`SetFieldAction` + `SetRootFieldAction`)
- Deleting stale edges after a D-first `extends` removal (`DeleteElementAction`)
- Reconciling reference endpoints (`SetFieldAction` + `DeleteElementAction`)

The hazard is specifically the nesting of creator calls, not the presence of
a TRANSACTION per se.

### 3.4 DVoidEdge race-window guard

The guard strategy depends on the edge type (M1 instance vs M2 reference).

**M1 reference edges** (populated by `useM1ReferenceEdges.ts`)
- Key: pair-based `${srcVId}→${tgtVId}`
- Guard: `hasCanvasEdgePair(ek)` + `existingKeys.has(ek)`
- Semantics: one edge per vertex pair for a given M1 reference value

**M2 reference edges** (populated by `useJjomSync.ts` Step 3)
- Key: composite `${refId}:${srcVertex}→${tgtVertex}`
- Guard: `existingEdgeKeys.has(ek)` after an `idlookup` scan of the graph's
  subElements and the RF edge cache
- Semantics: multiple sibling references between the same vertex pair are
  preserved (e.g. Family→Member: father, mother, sons, daughters)
- `hasCanvasEdgePair` is NOT used here — it would incorrectly block siblings

**Inheritance edges**
- Key: pair-based `${src}→${tgt}`
- Guard: `existingEdgeKeys.has(ek) || hasCanvasEdgePair(ek)`
- Semantics: a class extends another at most once

Key format uses directional arrow `→` (U+2192). It is **not symmetric** —
`A→B` and `B→A` are distinct.

### 3.5 Step 4 dependency limitation + useM1ReferenceEdges

`useJjomSync.ts` Step 4 has these deps:
```typescript
[modelid, hasGraph, subElementIds.length, modelClassCount,
 modelRefCount, modelRefTypeSig, modelExtendsSig, modelObjectCount]
```

`modelRefCount` counts **M2 DReferences only**. Step 4 does **not** re-fire on `SetFieldAction` over `DValue.values` (M1 slot population). This means: when M1 reference values arrive after the initial mount (post-load, post-transformation), Step 4 misses them.

**Do not "fix" Step 4 deps to include M1 value counters**. That breaks other invariants.

**Workaround**: use `useM1ReferenceEdges` — a separate hook downstream that listens to M1 value changes and creates the missing edges with the same guards.

Path: `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts`.

### 3.10 Role-aware bucket keys in portDistribution

> **Note (2026-05-27)**: the role-keyed bucketing described in this section governs `portDistribution.ts`'s `edgeHandles` output, which assigns handleIds. The actual positioning of anchors on the screen is currently driven by `handlePosition.ts:computeSidePositions` and `DynamicHandles.tsx`, **not** by `portDistribution.ts`'s `nodeHandles` field (discarded by `EditorV2.tsx`). The overflow-protection trade-off described below is still relevant for handleId assignment, but its visual implications depend on `computeSidePositions`. Re-evaluate this section after the anchor ordering fix (tracked in `docs/discovery/2026-05-27_anchor_ordering_inversion.md`) is merged.

When a pair of nodes can have fan-in and fan-out simultaneously (e.g., bidirectional references between two classes), bucket keys for port distribution must include the role:

```typescript
const sourceKey = `${edge.source}:${sourceSide}:source`;
const targetKey = `${edge.target}:${targetSide}:target`;
```

Without the role suffix, source and target collide on the same slot, leading to handle index overflow beyond `MAX_HANDLES_PER_SIDE` and missing edges.

STEP 4 of `portDistribution.ts` unions source/target buckets per `(nodeId, side)` and dedups by handleId. STEP 5 recomputes uniform positions on the merged total. Do not bypass these steps.

### 3.11 Runtime store access

See §15.4 for the `windoww.store` (double-`w`) global — exposed for console/DevTools debugging; application code imports the store directly. Console: `windoww.store.getState().idlookup`.
