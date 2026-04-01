# Investigation: JjScript References Not Appearing on Canvas

**Date:** 2026-03-27
**Status:** Investigation complete — root cause identified

---

## Executive Summary

When a user creates a reference via drag-and-drop on the canvas, **two things happen**: (1) a semantic `DReference` is created in the model, and (2) a diagrammatic `DVoidEdge` is created in the graph. When JjScript's `create reference` command runs, **only (1) happens**. The edge never appears because `useJjomSync`'s auto-populate effect doesn't re-run — its dependency array (`[modelid, hasGraph, subElementIds.length, modelClassCount]`) is unchanged by adding a reference to an existing class.

---

## Phase 1 — Manual Reference Creation Flow (Canvas Drag)

### Step-by-step

| # | File | Function / Line | What happens |
|---|------|-----------------|--------------|
| 1 | `editor-v2/EditorV2.tsx:875` | `onConnect(connection)` | React Flow fires when user completes a drag between two handles. Stores connection in `pendingConnectionRef`. |
| 2 | `editor-v2/EditorV2.tsx:883` | `onConnectEnd(event)` | Extracts mouse position. For M2 mode: sets `pendingConnection` state → renders `EdgeTypePopup`. For M1 mode: calls `getCompatibleReferences()`, shows `M1ReferencePopup` if >1 option. |
| 3 | `editor-v2/components/EdgeTypePopup.tsx` | `onSelect(choice)` | User picks: association, composition, aggregation, or inheritance. Calls `handleEdgeTypeSelected`. |
| 4 | `editor-v2/EditorV2.tsx:944` | `handleEdgeTypeSelected(choice)` | Takes undo snapshot. Branches by edge type (inheritance vs reference). |
| **5a** | `editor-v2/sync/canvasToJjom.ts:156` | **`syncReferenceEdge(src, tgt, name, kind)`** | **SEMANTIC:** Inside a `TRANSACTION`, calls `sourceClass.addReference(uniqueName, targetClass.id)`, sets `.type`, `.upperBound`, optionally `.composition`/`.aggregation` via `SetFieldAction`. |
| **5b** | `editor-v2/sync/canvasToJjom.ts:231` | **`DVoidEdge.new2(refId, graphId, ...)`** | **DIAGRAMMATIC:** Creates a `DVoidEdge` with `model=refId`, `start=sourceVertexId`, `end=targetVertexId`, `isReference=true`. Adds edge to `graph.subElements`. |
| 6 | `editor-v2/sync/syncState.ts:52` | `setEdgeRefId(edgeId, refId)` | Registers DEdge→DReference association in stable lookup map. |
| 7 | `editor-v2/sync/syncState.ts` | `markCanvasEdgePair(src, tgt)` | Marks this source→target pair so `useJjomSync` won't duplicate it. |
| 8 | `editor-v2/EditorV2.tsx:1050` | `setEdges(eds => [...eds, newEdge])` | Creates React Flow `Edge` object with type, label, data (reference info, anchor config), and pushes to RF state. |
| 9 | `editor-v2/EditorV2.tsx:1065` | `applyDistribution()` + `updateNodeInternals()` | Recalculates port distribution and forces React Flow to re-measure handles. |

### Key observation

The manual flow performs **two separate creations** in sequence:
1. Semantic: `DReference` via `addReference()` inside `TRANSACTION`
2. Diagrammatic: `DVoidEdge` via `DVoidEdge.new2()` **outside** the transaction (because `.new2()` has its own internal `TRANSACTION`)

Both are mandatory for the edge to appear on canvas.

---

## Phase 2 — JjScript `create reference` Flow

### Step-by-step

| # | File | Function / Line | What happens |
|---|------|-----------------|--------------|
| 1 | `jjscript/executor/commands/create.ts:152` | `executeCreate(args)` | Dispatches to `createReference()` when `elementType === 'reference'` or `'containment'`. |
| 2 | `jjscript/executor/commands/create.ts:355` | `createReference(name, parent, options, isContainment)` | Validates parent is a DClass. |
| 3 | `jjscript/executor/commands/create.ts:393` | `DReference.new(name, undefined, parentId, true)` | **SEMANTIC:** Creates DReference, adds to parent class's `references` array via Redux. |
| 4 | `jjscript/executor/commands/create.ts:412` | `SetFieldAction.new(newRef, 'type', targetClass.id, ...)` | Sets target type pointer. |
| 5 | `jjscript/executor/commands/create.ts:421-425` | `SetFieldAction.new(newRef, 'lowerBound'/'upperBound', ...)` | Sets multiplicity bounds. |
| 6 | `jjscript/executor/commands/create.ts:435` | `SetFieldAction.new(newRef, 'composition', true, ...)` | Sets containment flag (if applicable). |
| 7 | — | **NOTHING** | **No `DVoidEdge` is created. No graph element is added.** |

### What JjScript does NOT do

- Does **not** call `DVoidEdge.new2()` or any edge creation function
- Does **not** call `markCanvasEdgePair()` or `setEdgeRefId()`
- Does **not** emit any custom event that the canvas listens to
- Does **not** add anything to `graph.subElements`

This is consistent with other JjScript `create` commands (`createClass`, `createAttribute`) — they all create only semantic elements, relying on `useJjomSync` for visualization.

---

## Phase 3 — Why `useJjomSync` Doesn't Catch It

### The auto-populate effect (line 250)

This effect contains the edge creation code (lines 451-471) that iterates class references and creates missing `DVoidEdge`s. However, its dependency array is:

```typescript
}, [modelid, hasGraph, subElementIds.length, modelClassCount]);
```

When JjScript creates a reference on an existing class:

| Dependency | Changes? | Why |
|-----------|----------|-----|
| `modelid` | No | Same model |
| `hasGraph` | No | Graph already exists |
| `subElementIds.length` | **No** | `subElementIds` = `graph.subElements`. A DReference is a child of DClass, not of DGraph. No new vertex or edge is added to the graph. |
| `modelClassCount` | **No** | No new classes added — only a reference on an existing class |

**Result: The effect never re-runs.** The edge creation code at lines 451-471 is dead code for this scenario.

### The incremental sync effect (line 655)

This effect detects additions/removals in `subElementIds` and property changes via `elementSnapshots`. It could potentially handle new edges, but:

- **Structural additions** (line 674): Only fires for IDs newly present in `subElementIds`. Since no DEdge was created, there's nothing new in `subElementIds`.
- **Property changes** (line 742): The `elementSnapshots` hash *does* include `references` arrays (line 504), so it detects that a class gained a new reference. But this path only updates **existing** node data (`patchedNodeData`) — it doesn't create new edges.

### Summary of the gap

The auto-populate effect has the logic to create edges from references, but it's gated behind dependency checks that only trigger on class count changes or initial graph creation. There is no mechanism to trigger it when a new reference is added to an existing class.

---

## Phase 4 — Edge Data Structure (Minimum Viable Edge)

### DVoidEdge (data layer)

**File:** `model/dataStructure/GraphDataElements.tsx`

```typescript
class DVoidEdge {
    id: Pointer;
    graph: Pointer<DGraph>;         // which graph contains this edge
    model: Pointer<DModelElement>;  // semantic reference (DReference ID)
    start: Pointer<DGraphElement>;  // source vertex ID
    end: Pointer<DGraphElement>;    // target vertex ID
    isExtend: boolean;              // true for inheritance edges
    isReference: boolean;           // true for reference edges
    isValue: boolean;
    isDependency: boolean;
    midnodes?: Pointer<DEdgePoint>[];
    anchorStart?: string | GObject;
    anchorEnd?: string | GObject;
}
```

### Minimum required to create a valid edge

```typescript
DVoidEdge.new2(
    refId,            // DReference ID (stored in edge.model)
    graphId,          // parent graph
    graphId,          // graph containing this edge
    undefined,        // nodeID (auto-generated)
    sourceVertexId,   // start vertex
    targetVertexId,   // end vertex
    (d: DEdge) => {   // callback to set flags
        d.isReference = true;
    }
);
```

This automatically:
- Generates a unique edge ID
- Adds the edge to `graph.subElements` (triggering `subElementIds` change)
- Dispatches Redux action

### React Flow Edge (canvas layer)

Created by `jjomTransformers.ts:jjomEdgeToRFEdge()` from DVoidEdge:

```typescript
{
    id: edgeId,
    source: startVertexId,
    target: endVertexId,
    sourceHandle: string,       // computed from vertex positions
    targetHandle: string,
    type: 'reference',          // or 'inheritance', 'composition', 'instanceRef'
    label: referenceName,
    data: ReferenceEdgeData     // contains MetaReference info + anchor config
}
```

---

## Phase 5 — Existing Reusable Functions

### For creating the DEdge programmatically

| Function | File:Line | What it does |
|----------|-----------|--------------|
| `DVoidEdge.new2(model, graph, graphParent, nodeId, start, end, callback)` | `GraphDataElements.tsx` | Creates DEdge with all required fields. Used by both `canvasToJjom.ts` and `useJjomSync`. |
| `syncReferenceEdge(srcVertex, tgtVertex, name, kind)` | `canvasToJjom.ts:156` | Creates both DReference AND DVoidEdge. Too much — JjScript already created the DReference. |

### For resolving vertex IDs from class IDs

The auto-populate effect at `useJjomSync.ts:310-325` builds `vertexIdByModelId` map from graph subElements. This same logic would be needed to find which vertex corresponds to the source/target classes.

### For transforming DEdge → React Flow Edge

| Function | File | What it does |
|----------|------|--------------|
| `jjomEdgeToRFEdge(edge)` | `jjomTransformers.ts:379` | Converts DVoidEdge LProxy → React Flow Edge object |

---

## Phase 6 — Fix Approaches

### Approach A: Eager — Create DVoidEdge in JjScript `createReference`

**Where to change:** `jjscript/executor/commands/create.ts:createReference()`, after line 436.

**What to add:**
1. Find the graph for the current model (`DGraph` with `graphStyle === 'v2-flow'`)
2. Build `vertexIdByModelId` map from graph's subElements
3. Look up source vertex (from `parentId`) and target vertex (from `targetClass.id`)
4. If both vertices exist, call `DVoidEdge.new2(newRef.id, graphId, graphId, undefined, srcVertex, tgtVertex, d => { d.isReference = true; })`

**Pros:**
- Edge appears immediately, no timing issues
- Consistent with how `syncReferenceEdge` works in the manual flow
- Self-contained — no changes needed in useJjomSync

**Cons:**
- JjScript commands currently don't know about the graph layer — adds coupling
- If the canvas is not open / no v2-flow graph exists, needs graceful fallback
- Need to handle case where source/target class has no vertex yet

**Complexity:** Medium

### Approach B: Reconciliation — Extend `useJjomSync` dependency tracking

**Where to change:** `useJjomSync.ts`, the auto-populate effect (line 250).

**What to add:**
1. Add a new selector or extend `modelClassCount` to also count total references across all classes (a "referenceCount" dependency)
2. When reference count changes, the effect re-runs and the existing edge creation code at lines 451-471 handles everything

**Concrete change:**
```typescript
// New selector
const modelRefCount = useSelector((state: DState) => {
    // count total references across all classes in the model
    let count = 0;
    // ... iterate packages → classes → references.length
    return count;
});

// Updated dependency array
}, [modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount]);
```

**Pros:**
- Minimal code change (add one selector + one dependency)
- Reuses existing edge creation logic (lines 451-471) — already tested
- No coupling between JjScript and graph layer
- Also fixes any other scenario where references are added without edges (e.g., programmatic model manipulation, undo/redo edge cases)

**Cons:**
- Slight delay (React re-render cycle) before edge appears
- The auto-populate effect also creates missing vertices, so it does more work than needed (though it's idempotent)
- Hash-based comparison may miss edge cases with equal reference counts (unlikely — would need exact add+remove in same cycle)

**Complexity:** Low

### Approach C: Event-driven — Custom event after JjScript execution

**Where to change:** JjScript executor (post-execution hook) + `useJjomSync.ts` (event listener).

**What to add:**
1. After JjScript executes, emit a custom event (e.g., `jjscript:model-changed`) with affected element IDs
2. In `useJjomSync`, listen for this event and trigger reconciliation

**Pros:**
- Clean separation of concerns
- Could be extended for other JjScript-triggered visual updates

**Cons:**
- More infrastructure to maintain
- Event timing vs React state timing could cause race conditions
- Over-engineered for this specific problem

**Complexity:** High

---

## Recommendation

**Approach B (Reconciliation)** is the most feasible:

1. **Lowest risk** — reuses existing, tested edge creation code
2. **Smallest change** — one new `useSelector` + one dependency addition
3. **Broadest fix** — catches any future scenario where references are added without edges
4. **No coupling** — JjScript stays pure-semantic, graph sync stays in useJjomSync

If the slight rendering delay (one React cycle, ~16ms) is unacceptable, combine with Approach A for instant feedback, but Approach B alone should be sufficient for most use cases.
