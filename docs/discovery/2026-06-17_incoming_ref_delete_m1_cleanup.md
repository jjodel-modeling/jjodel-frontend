# Discovery (read-only) — Delete incoming `DReference` on target-class delete; verify M1 cleanup is complete

**Date/time**: 2026-06-17 19:30 (authored 2026-06-19)
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery — read-only. No source modified. Report is the only artifact.
**Supersedes**: the parked "incoming reference → OrphanReferenceStore (option 4)" plan. New requirement is **deletion**, not orphan-capture.
**Working tree**: contains committed 2a (`9c013d480`, `canvasToJjom.ts` → `.delete()`), 2c (`097b29f2c`, `Dummy.ts` orphan DObject), 2b (`d2df18bb5`, `case 'opposite'`).

---

## Summary

- **The one-branch change is correct but NOT sufficient.** Splitting `case 'type'` so the `DReference` branch becomes `lObj.delete()` correctly deletes the incoming reference `r` at M2 **and** cleans `r`'s **M1 model links** (the `DValue` slots conforming to `r`, via `case 'instanceof'` → `else` → `lObj.delete()`, the 2c-preserved branch). Verified by tracing `pointedBy`.
- **The M1 *canvas* edges (`DVoidEdge`) are NOT cleaned by the cascade** (Q3 — the key finding). The v2-flow M1 reference edge is a persisted `DVoidEdge` whose `model = r` and whose `start`/`end` are vertices over **DObjects** (the instances). Deleting the M1 `DValue` does not reach the edge (the edge does not point at the `DValue`), and deleting `r` reaches the edge only via `case 'model'`, which is a **no-op fall-through**. `useM1ReferenceEdges` is **add-only by design** and `refEdgeReconcile` explicitly **excludes** M1 edges. So the edge survives as a permanent orphan that re-renders every reload — this is test observation (7).
- **Therefore the fix requires TWO parts**: (1) the `case 'type'` split (Dummy.ts); (2) an **explicit M1-edge reconcile** that removes `DVoidEdge`s whose backing M1 `DValue` tuple no longer exists. The natural seam is **`useM1ReferenceEdges`** — promote it from add-only to add+remove — because it already re-fires on exactly the signal we need (`m1RefValuesSig` changes when the slot is deleted).
- **Nested delete is safe** (Q4 — same recursive-`.delete()` pattern as the children loop; reducer guard covers overlaps). **Opposite is coherent** (Q5 — `case 'opposite'` fires from 2b). **Cross-MM is reached** (Q6 — the dependency walk is D-layer `pointedBy`, metamodel-agnostic; the known cross-MM caveat is about L-proxy `get_type` *display* resolution, not the dependency walk).

---

## Q1 — Inner-switch structure (confirmed)

`case 'type'` body is `Dummy.ts:158-168`, an inner switch on the **dependent's raw class** `dObj.className`:

```ts
// Dummy.ts:158-168
case 'type':
    switch (dObj.className) {
        default: Log.eDevv('unexpected pointer to type:' + dObj.className, {dObj, dDeleted, field}); break;   // 160
        case 'DParameter': case 'DAttribute': lObj.type = 'Pointer_ESTRING'; break;                          // 161
        case 'DReference': case 'DOperation':                                                                // 162
            // would be nice to set dObj.extends[0] instead but i cannot tell if it was deleted too.
            // lData.father instead is safe ...
            lObj.type = lDeleted.father;                                                                     // 165
            break;
    }
    break;
```

- **Bindings at the seam** (the outer `pointedBy` loop): `pointer = dependency.obj` (the element pointing at the deleted class via `type`), `lObj = L.wrap(pointer)` (`Dummy.ts:131`), `dObj = lObj.__raw` (`Dummy.ts:133`). For this case, `dObj`/`lObj` is the **incoming reference `r`** (owned by `A`); `lDeleted`/`dDeleted` is the class **`B`** being deleted. So `lObj.delete()` deletes `r`.
- **Splittable**: yes, cleanly. `DReference` and `DOperation` currently *share* the `case 'DReference': case 'DOperation':` label only to reuse the single `lObj.type = lDeleted.father` body. Splitting them into two separate `case` blocks is mechanical and leaves `DParameter`/`DAttribute` and `default` untouched. Only the `DReference` branch changes to `lObj.delete()`; `DOperation` keeps `lObj.type = lDeleted.father`.

## Q2 — M1 model links (DValue) ARE cleaned by `r.delete()` (confirmed)

When `lObj.delete()` runs for `r`:

1. `r.delete()` computes `dependencies = thiss.get__jjdependencies(context)` (`Dummy.ts:53`) by iterating **`r.pointedBy`** (`classes.ts:2074-2123`, loop at `:2078`).
2. Each M1 `DValue` slot conforming to `r` was created with `instanceof = r`; that pointer write registered a reverse entry `<dvalue>.instanceof` in `r.pointedBy`. So those `DValue`s surface in `r`'s dependency list with `field === 'instanceof'`.
3. `case 'instanceof'` (`Dummy.ts:206-211`, the 2c branch):
   ```ts
   case 'instanceof':
       if (dObj.className === 'DObject')
           SetFieldAction.new(dObj.id, 'instanceof', '', '', true);  // 208 — orphan (only for DObject)
       else
           lObj.delete();                                            // 210 — DValue slot → deleted
   ```
   For a `DValue`, `dObj.className === 'DValue'` → `else` → `lObj.delete()`. ✅ The slot is removed.
4. The deleted `DValue`'s own cascade removes it from its owner instance via the father safety-net (`Dummy.ts:109-116`, `fatherField = 'features'` for `DValue` → `SetFieldAction.new(father, 'features', id, '-=')`). So the source instance `a` loses the slot from `a.features`.

So `r.delete()` cleans the M1 **model** side completely. This is the branch 2c deliberately preserved.

## Q3 — M1 canvas edges are NOT cleaned (the key question)

**How an M1 reference link becomes a canvas edge (v2-flow):** `useM1ReferenceEdges` mints a persisted `DVoidEdge` per `(srcObj, refMeta, tgtObj)` tuple:

```ts
// useM1ReferenceEdges.ts:120-131
DVoidEdge.new2(
    refMetaId,   // arg1 = model   ← = dFeat.instanceof = the M2 DReference r
    graphId,     // arg2 = graph
    graphId,     // arg3 = parentGraph
    undefined,   // arg4 = htmlindex
    srcV,        // arg5 = start  (DVertex over the source DObject a)
    tgtV,        // arg6 = end    (DVertex over the target DObject b)
    (d) => { d.isReference = true; },
);
markCanvasEdgePair(srcV, tgtV);
```

Arg order confirmed against the M2 site `useJjomSync.ts:814-818` (`DVoidEdge.new2(refId, graphId, graphId, undefined, srcVertex, tgtVertex, …)`) and the constructor `classes.ts:996-1030` (sets `start`/`end`/`anchorStart`/`anchorEnd`/`midnodes`; the `model` back-link is arg1). Cross-checked by `refEdgeReconcile.ts:8-12`: *"`model` → id of the `DReference` it represents (set at creation, never mutated)"*.

The surviving `DVoidEdge` renders via the downstream pipeline (its own docstring, `useM1ReferenceEdges.ts:13-14`): *useJjomSync subElements selector → `lGraph.edges` → `jjomEdgeToRFEdge` → `setEdges`*. So as long as the `DVoidEdge` sits in `graph.subElements`, an RF edge renders.

**Is it removed when the M1 `DValue` is deleted? NO. Three independent reasons:**

1. **The edge does not point at the `DValue`.** The M1 `DVoidEdge` carries `model = r`, `start = vertex(a)`, `end = vertex(b)` — no pointer to the slot `DValue`. So the `DValue`'s `pointedBy` does **not** include the edge; deleting the `DValue` never reaches it.
2. **Deleting `r` reaches the edge only via `case 'model'`, which is a no-op.** The edge's `model = r` registered `<edge>.model` in `r.pointedBy`. During `r.delete()` the dependency loop hits `field === 'model'`:
   ```ts
   // Dummy.ts:212-222
   case 'model':
       // pkg.model --> deleted element should delete but i ignore because is already removed through children
       /* ...commented out... */
   case 'father':   // falls through
       break;       // 222 — NO-OP
   ```
   The comment's assumption ("already removed through children") is **false** for the M1 edge: the `DVoidEdge` is a child of the **graph**, not of `r`, so the children loop (`Dummy.ts:84-87`) never deletes it. The edge survives.
3. **`useM1ReferenceEdges` is add-only** (`useM1ReferenceEdges.ts:16-17`: *"Add-only by design … Orphan cleanup when slot values are replaced or cleared is a separate workstream."*). And **`refEdgeReconcile` explicitly excludes M1 edges** — `isM2ReferenceEdge` returns `false` when the start vertex's `model` is not a `DClass` (`refEdgeReconcile.ts:155-158`), i.e. it filters out exactly the M1 instance edges (its own docs, `:26-29`). So no reconcile path touches M1 edges.

**Conclusion**: the cascade leaves the M1 canvas edge stale. This is **test observation (7)** (orphan M1 edges persisting). This is a reconcile-family gap (model-side delete not followed by graph-side edge cleanup).

**Where the M1 edge should be removed (recommended seam): `useM1ReferenceEdges`.**
- Its reactive `m1RefValuesSig` selector (`:36-58`) hashes every live `(objId, refMeta, tgtId)` tuple from `dObj.features → dFeat.values`. When `r.delete()` removes the slot `DValue` (Q2), the slot leaves `a.features`, the tuple disappears, the signature changes, and the effect **re-fires** (`:60`, dep `[modelid, graphId, m1RefValuesSig]`). The exact trigger we need already exists.
- The minimal change: in the effect, after computing `toCreate`, also compute `toDelete` = the persisted M1 reference `DVoidEdge`s (`className includes 'Edge'`, `model` resolves to a `DReference`, endpoints are vertices over **DObjects**) whose `(start→end, model)` tuple is **not** backed by any current slot value, and `DeleteElementAction.new(edge.__raw)` each (mirroring `refEdgeReconcile`'s delete idiom, and `clearCanvasEdgePair` for the pair). This converts the hook from add-only to a full reconcile, symmetric to what `refEdgeReconcile`/Step 3 does for M2.
- **Alternative (not recommended)**: extend `Dummy.ts` `case 'model'` to delete dependent `DVoidEdge`/`DEdge`. Rejected — `case 'model'` is core and shared across every `DGraphElement`; broadening it risks deleting unrelated graph elements and is far harder to reason about than the targeted hook reconcile. Keep the cleanup in the v2-flow sync layer where the mint lives.

> Note (classic editor): the classic M1 reference edges are **derived** (`DerivedReferenceEdge`, no mint, no idlookup residency — see log 2026-06-15) from `suggestedEdges.reference`, which is recomputed from the `DValue`s. There, deleting the slot makes the derived edge disappear automatically. The gap is **v2-flow-only** (the minted-`DVoidEdge` path).

## Q4 — Nested delete safety (confirmed safe)

- **Nested `.delete()` is the established pattern.** `r.delete()` opens its own `TRANSACTION('delete ' + name, …)` (`Dummy.ts:245-251`). It runs nested inside `B`'s delete TRANSACTION — exactly like the children loop, which already calls `child.delete()` recursively (`Dummy.ts:84-87`), each opening its own TRANSACTION. §3.3's coordinate-loss prohibition targets nested **`DVertex.new`/`DVoidEdge.new2`** creators, not nested deletes. No new hazard.
- **`r` removed cleanly from surviving `A`.** `A` is `r`'s father (owner). `A.references` contains `r`, so `r.pointedBy` has `<A>.references`; `r.delete()`'s loop hits `case 'references'` (one of the subcollection labels, `Dummy.ts:177-204`) → `SetFieldAction.new(A.id, 'references', r.id, '-=', true)` (`:200`). `A` is otherwise untouched.
- **No double-delete of `r`.** `B`'s children loop only deletes `B`'s **owned** features; `r` is owned by `A`, so it is reached **once**, via the `type` `pointedBy` path. Within `r`'s own cascade, any incidental re-delete is idempotent: the reducer guard `else if (action.type === DeleteElementAction.type && !(key in current)) { gotChanged = false; }` (`reducer.ts:371`) makes a delete of an already-absent key a no-op.
- **Stale-dependency ordering tolerated.** `B`'s `dependencies` are computed once up-front (`Dummy.ts:53`); if `r.delete()` removes something also in `B`'s list, `B`'s loop later guards with `if (!lObj) continue;` (`Dummy.ts:132`) and `get__jjdependencies` skips already-deleted targets (`classes.ts:2100-2103`, `if (!lastVal) continue`). Idempotent SetFieldActions absorb the rest.

## Q5 — Opposite interaction (coherent)

If `r` has an `opposite` `r'` (so `r'.opposite = r`), then `r.delete()` finds `<r'>.opposite` in `r.pointedBy` → `case 'opposite'` (`Dummy.ts:170-175`, added by 2b) → `lObj.opposite = undefined` clears `r'.opposite`. No dangling opposite. ✅ No new work; just confirms 2b composes with the new path.

## Q6 — Cross-MM (reached by the dependency walk)

- The dependency walk is **D-layer**: `get__jjdependencies` iterates `data.pointedBy` (`classes.ts:2078`). `pointedBy` is a generic reverse-index populated on **every** pointer write, regardless of metamodel boundary. When a cross-MM `r` (in metamodel X) sets `type = B` (B in metamodel Y), `B.pointedBy` gained `<r>.type`. So `B`'s deletion **does** reach a cross-MM `r` via `case 'type'`, and `L.wrap(pointer)` resolves `r`'s proxy regardless of metamodel → `lObj.delete()` fires. ✅
- The known "cross-MM references are second-class" caveat (prior discovery, `2026-06-17_class_delete_reference_cleanup.md` Q3/RIFERIMENTI) is about **L-proxy `get_type` resolution** used for *type display/lookup* in mono-MM contexts — **not** the `pointedBy` dependency computation. The dependency computation does not miss a cross-MM `r`, provided its `type` pointer was written through the normal setter (which registers `pointedBy`).
- **Residual risk to flag**: if any cross-MM `r.type` was ever set by a path that bypassed `pointedBy` registration (raw manipulation / import shortcut), it would be invisible to the walk and survive. This is a latent data-integrity concern, not introduced by this change; worth a runtime spot-check (scan `idlookup` for `DReference.type === Bid` after delete) during verification.

---

## Q7 — Diff lock + completeness

### Part 1 — the `case 'type'` diff (Dummy.ts:158-168)

Split the inner switch so only `DReference` changes:

```ts
case 'type':
    switch (dObj.className) {
        default: Log.eDevv('unexpected pointer to type:' + dObj.className, {dObj, dDeleted, field}); break;
        case 'DParameter': case 'DAttribute': lObj.type = 'Pointer_ESTRING'; break;
        case 'DReference':
            // New requirement: delete the incoming reference at M2 (cascades to its
            // M1 DValue slots via case 'instanceof'). Replaces the old re-home.
            lObj.delete();
            break;
        case 'DOperation':
            // Unchanged: re-home the operation's return type to the package.
            lObj.type = lDeleted.father;
            break;
    }
    break;
```

This is a single-`case` edit in `Dummy.ts` (a core file; pair with a Layer Impact Report — it is a D-layer/JjOM cascade write path). It composes with 2b (`case 'opposite'`) and 2c (`case 'instanceof'`) already in the tree.

### Part 2 — REQUIRED additional M1-edge reconcile

The one-branch change is **not complete**. Q2 shows the M1 *model* links are cleaned, but Q3 shows the M1 *canvas* edges (`DVoidEdge`) go stale. A second, separate change is required:

- **Seam**: `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` — extend from add-only to add+remove. It already re-fires when the slot `DValue` is deleted (`m1RefValuesSig` change), so the trigger is in place; add a `toDelete` pass that removes M1 reference `DVoidEdge`s with no backing slot tuple (raw `DeleteElementAction.new`, no outer TRANSACTION per §3.3 / the file's existing comment at `:85-88`; `clearCanvasEdgePair` the freed pair).
- This is a **second scoped task** with its own Layer Impact Report (sync layer + v2-flow canvas). It mirrors the M2 reconcile (`refEdgeReconcile` + `useJjomSync` Step 3) one level down at M1.

**So: the fix is `case 'type'` split (Part 1) AND an M1-edge reconcile in `useM1ReferenceEdges` (Part 2).** Part 1 alone leaves orphan M1 edges (observation 7).

---

## Open questions / risks (need Alfonso's decision)

1. **Two-part vs one-part scope.** Land Part 1 (`Dummy.ts`) and Part 2 (`useM1ReferenceEdges.ts`) **together** (so the user never sees orphan M1 edges) or **sequentially** with a HARD STOP between (verify Part 1's model-side cleanup first, then add the edge reconcile)? Recommend sequential — Part 1 is the requirement; Part 2 closes observation (7) and is independently testable.
2. **Reconcile placement.** Confirm `useM1ReferenceEdges` (add→reconcile) over the rejected `Dummy.ts case 'model'` broadening. The hook keeps the cleanup adjacent to the mint and avoids touching core cascade semantics.
3. **M2-edge parity check.** When `r` is deleted directly (not via class delete), is its **M2** edge cleaned? In the v2-flow class-delete path it is, via `syncDeleteVertex`'s connected-edge cleanup (`canvasToJjom.ts:268-293`, filter `start/end === B's vertex`, `:289` delete) — `r`'s M2 edge ends at `B`'s deleted vertex. But a *standalone* `r.delete()` (not through `syncDeleteVertex`) hits the same `case 'model'` no-op and would also orphan the M2 edge. Out of this requirement's scope, but worth confirming the only entry point is via class delete.
4. **Cross-MM integrity spot-check** (Q6 residual): verify a cross-MM `r` actually carries the `pointedBy` entry at runtime before relying on the walk to delete it.
5. **Reducer hard-delete from idlookup.** `DeleteElementAction` leaves the entry in `idlookup` unless `newVal === undefined` (`reducer.ts:~384`, the `delete current[key]` branch is gated). Confirm deleted `r`/`DValue`/`DVoidEdge` are pruned (or tombstoned harmlessly) so post-delete `idlookup` scans in verification read clean.

---

**Read-only. Report only. HARD STOP — no implementation.**
