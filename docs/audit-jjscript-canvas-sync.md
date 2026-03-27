# Audit: JjScript Commands ↔ Canvas Sync Coverage

**Date:** 2026-03-27
**Context:** After fixing the `create reference` bug (references not appearing on canvas because `useJjomSync`'s auto-populate effect didn't re-run), this audit checks whether other JjScript commands have the same latent bug.

---

## Phase 1 — Inventory of JjScript Commands

### Creation Commands (`create.ts`)

| Command | Element Created | Parent | Redux Effect |
|---------|----------------|--------|-------------|
| `create class` | `DClass` | DPackage (via `father` param) | Adds to `pkg.classes` |
| `create abstract class` | `DClass` (abstract=true) | DPackage | Adds to `pkg.classes` |
| `create interface` | `DClass` (interface=true) | DPackage | Adds to `pkg.classes` |
| `create attribute` | `DAttribute` | DClass | Adds to `cls.attributes` |
| `create reference` | `DReference` | DClass | Adds to `cls.references` |
| `create containment` | `DReference` (composition=true) | DClass | Adds to `cls.references` |
| `create operation` | `DOperation` | DClass | Adds to `cls.operations` |
| `create parameter` | `DParameter` | DOperation | Adds to `op.parameters` |
| `create package` | `DPackage` | DModel/DPackage | Adds to `model.packages` or `pkg.subpackages` |
| `create enum` | `DEnumerator` | DPackage | Adds to `pkg.enumerators` |
| `create literal` | `DEnumLiteral` | DEnumerator | Adds to `enum.literals` |

### Mutation Commands

| Command | File | What it does |
|---------|------|-------------|
| `extends` | `extends.ts` | Adds parent class ID to `child.extends` array (`+=`) |
| `set` | `set.ts` | Sets arbitrary property on any element via `SetFieldAction` |
| `rename` | `rename.ts` | Sets `element.name` via `SetFieldAction` |
| `abstract` | `abstract.ts` | Toggles `class.abstract` boolean |
| `delete` | `delete.ts` | Calls `DeleteElementAction.new(element)` — removes from Redux |
| `remove` | `remove.ts` | Removes element from parent collection (`-=`) or clears `extends` |
| `copy` | `copy.ts` | Deep-copies elements using `.new()` + `CreateElementAction` |
| `move` | `move.ts` | Changes `element.parent` pointer |
| `add` | `add.ts` | Delegates to `create` with explicit parent |

### Read-only Commands (no visual impact)

| Command | File | Notes |
|---------|------|-------|
| `list` | `list.ts` | Lists elements — no mutation |
| `show` | `show.ts` | Shows element details — no mutation |
| `validate` | `validate.ts` | Validates model — no mutation |
| `help` | `help.ts` | Prints help — no mutation |
| `eval` | `eval.ts` | Evaluates JjEL expression — no mutation |
| `forall` | `forall.ts` | Iterator over elements — delegates to other commands |
| `let` | `let.ts` | Variable binding — no mutation |
| `clear` | `clear.ts` | Clears console — no model mutation |
| `undoredo` | `undoredo.ts` | Undo/redo — triggers through Redux, not JjScript-specific |

---

## Phase 2 — Dependency Array Analysis

The auto-populate effect at `useJjomSync.ts:269` has this dependency array (line 500):

```typescript
[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount]
```

### What triggers each dependency

| Dependency | Selector location | Changes when... |
|-----------|-------------------|----------------|
| `modelid` | Hook parameter | Tab switches to different model (never changes within a session for same tab) |
| `hasGraph` | `graphInfo !== null` | v2-flow DGraph is created/deleted for this model |
| `subElementIds.length` | `graphInfo.subElements` | DVertex or DVoidEdge added/removed from `graph.subElements` |
| `modelClassCount` | Lines 233-244 | Sum of `pkg.classes.length + pkg.enumerators.length` changes across all packages |
| `modelRefCount` | Lines 248-263 | Sum of `cls.references.length` changes across all classes in all packages |

### What the auto-populate effect creates (lines 296-491)

1. **Vertices** for `DClass` and `DEnumerator` — iterates packages recursively, collects classifiers, creates `DVertex` for any missing.
2. **Inheritance edges** — for each `DClass`, iterates `extends` array, creates `DVoidEdge` (isExtend=true) for missing pairs.
3. **Reference edges** — for each `DClass`, iterates `references` array, creates `DVoidEdge` (isReference=true) for missing pairs.

**NOT handled by auto-populate:**
- DAttribute — no vertex or edge (rendered inside class node)
- DOperation — no vertex or edge (rendered inside class node)
- DParameter — no vertex or edge (rendered inside operation)
- DPackage — **no vertex created** (but could theoretically need one for package visualization)
- DEnumLiteral — no vertex or edge (rendered inside enum node)

---

## Phase 3 — Coverage Matrix

### Creation Commands

| Command | Element | Needs vertex? | Needs edge? | Dependency triggered | Covered? | Notes |
|---------|---------|--------------|-------------|---------------------|----------|-------|
| `create class` | DClass | **YES** | No | `modelClassCount` (+1) | **YES** | Effect creates DVertex |
| `create abstract class` | DClass | **YES** | No | `modelClassCount` (+1) | **YES** | Same as class |
| `create interface` | DClass | **YES** | No | `modelClassCount` (+1) | **YES** | Same as class |
| `create attribute` | DAttribute | No | No | None* | **N/A** | Rendered inside class node; update handled by `elementSnapshots` hash |
| `create reference` | DReference | No | **YES** | `modelRefCount` (+1) | **YES** (fixed) | Effect creates DVoidEdge |
| `create containment` | DReference | No | **YES** | `modelRefCount` (+1) | **YES** (fixed) | Same as reference |
| `create operation` | DOperation | No | No | None* | **N/A** | Rendered inside class node; update handled by `elementSnapshots` hash |
| `create parameter` | DParameter | No | No | None* | **N/A** | Rendered inside operation (inside class node) |
| `create package` | DPackage | No** | No | None | **N/A** | Packages don't have vertices in current implementation |
| `create enum` | DEnumerator | **YES** | No | `modelClassCount` (+1) | **YES** | `modelClassCount` counts `pkg.enumerators.length` too |
| `create literal` | DEnumLiteral | No | No | None* | **N/A** | Rendered inside enum node; update handled by `elementSnapshots` hash |

\* These elements don't need their own vertex/edge. They're rendered as part of their parent node. The incremental sync effect (line 674) detects property changes via `elementSnapshots` hash, which includes `attributes`, `references`, `operations`, `literals` arrays (line 523). So node data updates when children are added.

\** Packages don't get vertices currently. If package visualization is needed in the future, a new dependency would be needed.

### Mutation Commands

| Command | What changes | Visual impact | Dependency triggered | Covered? | Notes |
|---------|-------------|--------------|---------------------|----------|-------|
| `extends` | `child.extends += parentId` | **New inheritance edge needed** | **NONE** | **BUG** | See analysis below |
| `set` (abstract) | `cls.abstract = true` | Node style changes | `elementSnapshots` hash | **YES** | Hash includes `child.abstract` (line 541) |
| `set` (type) | `ref.type = classId` | Edge target may change | `elementSnapshots` hash | **PARTIAL** | Existing edge data updates, but if ref had no type before → new edge needed → **BUG** (same as reference) |
| `set` (name) | `element.name = x` | Label changes | `elementSnapshots` hash | **YES** | Hash includes `child.name` (line 531) |
| `set` (bounds) | `ref.lowerBound = x` | Label changes | `elementSnapshots` hash | **YES** | Hash includes bounds (lines 539-540) |
| `rename` | `element.name = newName` | Label changes | `elementSnapshots` hash | **YES** | Same mechanism as `set name` |
| `abstract` | `cls.abstract = !current` | Node style changes | `elementSnapshots` hash | **YES** | |
| `delete` (class) | Removes DClass | Vertex+edges removed | `modelClassCount` (-1), then `subElementIds.length` (-N) | **YES** | Effect + incremental sync handle removal |
| `delete` (enum) | Removes DEnumerator | Vertex removed | `modelClassCount` (-1) | **YES** | |
| `delete` (reference) | Removes DReference | Edge should be removed | `modelRefCount` (-1) | **PARTIAL** | Auto-populate re-runs but doesn't remove edges — it only creates. Edge removal depends on the DVoidEdge being deleted from graph.subElements too. |
| `remove extends` | `child.extends = []` | Inheritance edges should disappear | **NONE** | **BUG** | Edges are not removed; no dependency triggers cleanup |
| `copy` (class) | New DClass | **YES** | `modelClassCount` (+1) | **YES** | |
| `copy` (enum) | New DEnumerator | **YES** | `modelClassCount` (+1) | **YES** | |
| `copy` (reference) | New DReference | **YES** (edge) | `modelRefCount` (+1) | **YES** | |
| `move` (class to different package) | `cls.parent = newPkgId` | Vertex stays, node data may change | `elementSnapshots` hash | **YES** | |
| `move` (reference to different class) | `ref.parent = newClsId` | Edge source changes | `modelRefCount` (unchanged) | **BUG** | Count doesn't change (removed from one class, added to another), so effect doesn't re-run. Edge source vertex is wrong. |

---

## Phase 4 — Confirmed Bugs

### BUG 1: `extends` command — inheritance edge not created

**Severity: HIGH** — user-visible, common operation

**Command:** `ChildClass extends ParentClass`

**What happens:** `SetFieldAction.new(child, 'extends', parent.id, '+=', true)` adds the parent ID to the child's `extends` array. No DVoidEdge is created, and no dependency in the auto-populate effect changes:

- `modelClassCount` — unchanged (no class added/removed)
- `modelRefCount` — unchanged (extends is not a reference)
- `subElementIds.length` — unchanged (no graph element added)

**Impact:** The inheritance arrow does not appear on the canvas until the user reloads the tab or another action triggers the auto-populate effect.

**Fix needed:** Add a new dependency `modelExtendsCount` that sums `cls.extends.length` across all classes, analogous to `modelRefCount`.

### BUG 2: `remove extends` — inheritance edge not removed

**Severity: HIGH** — user-visible

**Command:** `remove extends from ChildClass`

**What happens:** The `extends` array is cleared, but:
1. The auto-populate effect doesn't re-run (no dependency changes — extends count going to 0 would trigger it IF we add `modelExtendsCount`).
2. Even if the effect re-runs, it only **creates** missing edges — it never **removes** stale edges (edges whose corresponding `extends` entry no longer exists).

**Impact:** Stale inheritance arrows remain on the canvas.

**Fix needed:** Two-part fix:
1. Add `modelExtendsCount` dependency (same as BUG 1).
2. Add a **removal pass** in the auto-populate effect that checks existing inheritance edges against current `extends` arrays and removes orphaned DVoidEdges.

### BUG 3: `set type` on reference with no prior type — edge not created

**Severity: MEDIUM** — less common operation

**Command:** `set MyRef type TargetClass` (where MyRef previously had no type)

**What happens:** A DReference that was created without a type (no target class) has no edge. When the type is later set via `set`, the reference count doesn't change (the reference already existed), so `modelRefCount` is unchanged. The auto-populate effect doesn't re-run.

**Impact:** The reference edge doesn't appear until something else triggers the effect.

**Fix needed:** The `modelRefCount` selector should also hash the type pointers, not just count references. Or add a separate selector that tracks the sum of "references with non-null type" count.

### BUG 4: `move reference` to different class — edge not updated

**Severity: LOW** — rare operation

**Command:** `move myRef to OtherClass`

**What happens:** The reference's parent changes from ClassA to ClassB, but `modelRefCount` stays the same (same total count). The edge's source vertex is still ClassA's vertex. The auto-populate effect doesn't re-run.

**Impact:** Edge appears connected to the wrong class.

**Fix needed:** Same as BUG 3 — make the selector sensitive to reference parent changes, not just count.

### BUG 5: `delete reference` — edge orphaned (stale)

**Severity: MEDIUM** — common operation

**Command:** `delete myRef`

**What happens:** `DeleteElementAction` removes the DReference from Redux and from the parent class's `references` array. `modelRefCount` decreases, so the auto-populate effect re-runs. However, the auto-populate effect only **creates** edges, it doesn't **remove** orphaned edges (DVoidEdges whose `model` pointer references a deleted DReference).

**Note:** The `DVoidEdge` still exists in `graph.subElements` and `DeleteElementAction` may or may not cascade to remove it. If it doesn't, a stale edge remains visible.

**Partial mitigation:** The incremental sync effect (line 674) handles removals from `subElementIds`. If `DeleteElementAction` properly removes the DVoidEdge from graph.subElements, this is covered. **Needs verification** of whether `DeleteElementAction` cascades to graph elements.

---

## Phase 5 — Elements Without Visual Representation

These elements are rendered **inside** their parent node (not as separate vertices or edges):

| Element | Rendered in | How updates propagate |
|---------|------------|----------------------|
| DAttribute | Class node body (attributes section) | `elementSnapshots` hash changes → incremental sync patches node data |
| DOperation | Class node body (operations section) | Same as above |
| DParameter | Inside operation display | Same (transitively via operation hash) |
| DEnumLiteral | Enum node body (literals section) | Same as above |
| DPackage | Not visualized as a node | N/A in current implementation |

For these, the `elementSnapshots` hash (lines 522-555) includes the element's `name`, `type`, `lowerBound`, `upperBound`, `abstract`, `composition`, and `values`. When any of these change, the hash changes, the `mapReferenceEqual` comparator returns `false`, and the incremental sync effect re-transforms the parent vertex → patching the node data. This mechanism works correctly for all property-change scenarios.

---

## Phase 6 — How Manual (Canvas) Flow Handles These Cases

### Manual inheritance creation
In the canvas, when user drags an inheritance edge:
1. `EditorV2.tsx:handleEdgeTypeSelected` calls `canvasToJjom.ts:syncInheritanceEdge()`
2. This creates both the semantic change (`SetFieldAction += extends`) AND the diagrammatic change (`DVoidEdge.new2()`) in one go.

### Manual reference creation
Same pattern: `syncReferenceEdge()` creates both DReference and DVoidEdge.

### Manual deletion (canvas)
When user deletes from canvas:
1. `EditorV2.tsx:handleDelete` or `onEdgesDelete` is called
2. Both the DVertex/DVoidEdge and the semantic element are deleted
3. Graph.subElements updates → `subElementIds.length` changes → incremental sync handles removal

---

## Recommendations

### Option A: Add `modelExtendsCount` dependency (Minimal, same pattern as `modelRefCount`)

```typescript
const modelExtendsCount = useSelector((state: DState) => {
    if (!modelid) return 0;
    const rawModel = state.idlookup?.[modelid] as any;
    if (!rawModel) return 0;
    let count = 0;
    for (const pkgId of (rawModel.packages ?? [])) {
        const pkg = state.idlookup?.[pkgId] as any;
        if (!pkg) continue;
        for (const clsId of (pkg.classes ?? [])) {
            const cls = state.idlookup?.[clsId] as any;
            if (!cls) continue;
            count += (cls.extends ?? []).length;
        }
    }
    return count;
});
```

Add to dependency array: `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelExtendsCount]`

**Fixes:** BUG 1 (extends not appearing), BUG 2 (partially — triggers re-run on removal)

**Doesn't fix:** BUG 2 (stale edge removal), BUG 3 (set type), BUG 4 (move reference)

### Option B: Model version counter (Comprehensive)

Instead of adding individual count selectors, add a single comprehensive hash/version that changes whenever **any** structural property changes:

```typescript
const modelStructureVersion = useSelector((state: DState) => {
    if (!modelid) return 0;
    const rawModel = state.idlookup?.[modelid] as any;
    if (!rawModel) return 0;
    let hash = 0;
    for (const pkgId of (rawModel.packages ?? [])) {
        const pkg = state.idlookup?.[pkgId] as any;
        if (!pkg) continue;
        for (const clsId of (pkg.classes ?? [])) {
            const cls = state.idlookup?.[clsId] as any;
            if (!cls) continue;
            // Count references + hash their type pointers
            for (const refId of (cls.references ?? [])) {
                const ref = state.idlookup?.[refId] as any;
                hash = (hash * 31 + (typeof ref?.type === 'string' ? ref.type.length : 0)) | 0;
            }
            hash = (hash * 31 + (cls.references ?? []).length) | 0;
            // Count extends
            hash = (hash * 31 + (cls.extends ?? []).length) | 0;
            // Hash extends targets
            for (const extId of (cls.extends ?? [])) {
                if (typeof extId === 'string') {
                    for (let i = 0; i < Math.min(extId.length, 8); i++) {
                        hash = ((hash << 5) - hash + extId.charCodeAt(i)) | 0;
                    }
                }
            }
        }
        // Count enumerators
        hash = (hash * 31 + (pkg.enumerators ?? []).length) | 0;
    }
    return hash;
});
```

Replace `modelClassCount` + `modelRefCount` with single `modelStructureVersion`.

**Fixes:** BUG 1, BUG 3, BUG 4. Partially BUG 2 (triggers re-run, but needs removal logic).

### Option C: Add edge removal pass to auto-populate (Required for BUG 2 & 5)

Regardless of Option A or B, the auto-populate effect needs a **removal pass** for stale edges. After creating missing edges, add:

```typescript
// Step 4: Remove stale edges
const freshLookup2 = store.getState()?.idlookup;
if (freshLookup2 && graphId) {
    const freshGraph2 = freshLookup2[graphId] as any;
    for (const seId of (freshGraph2?.subElements ?? [])) {
        const se = freshLookup2[seId] as any;
        if (!se?.className?.includes('Edge')) continue;

        if (se.isExtend) {
            // Check if the extends relationship still exists
            const srcVertex = se.start;
            const srcModelId = /* resolve vertex → model ID */;
            const tgtVertex = se.end;
            const tgtModelId = /* resolve vertex → model ID */;
            const srcClass = freshLookup2[srcModelId] as any;
            if (srcClass && !(srcClass.extends ?? []).includes(tgtModelId)) {
                // Stale inheritance edge — remove
                DeleteElementAction.new(seId);
            }
        }

        if (se.isReference && se.model) {
            // Check if the DReference still exists
            if (!freshLookup2[se.model]) {
                // Reference was deleted — remove edge
                DeleteElementAction.new(seId);
            }
        }
    }
}
```

### Recommended approach

**Option A + Option C** (incremental, low-risk):

1. Add `modelExtendsCount` selector — fixes BUG 1 (most impactful bug, `extends` is common)
2. Add edge removal pass — fixes BUG 2 and BUG 5
3. Enhance `modelRefCount` to hash type pointers — fixes BUG 3

BUG 4 (`move reference`) is rare enough to defer.

Alternatively, **Option B + Option C** is more future-proof but higher risk (single hash may have false negatives from hash collisions, though extremely unlikely in practice).

---

## Summary Table

| Bug | Command | Severity | Fix Complexity | Proposed Fix |
|-----|---------|----------|---------------|-------------|
| **BUG 1** | `extends` | HIGH | Low | Add `modelExtendsCount` dependency |
| **BUG 2** | `remove extends` | HIGH | Medium | `modelExtendsCount` + edge removal pass |
| **BUG 3** | `set type` (on ref) | MEDIUM | Low | Hash ref type pointers in selector |
| **BUG 4** | `move reference` | LOW | Medium | Model structure hash (Option B) |
| **BUG 5** | `delete reference` | MEDIUM | Medium | Edge removal pass + verify `DeleteElementAction` cascade |
