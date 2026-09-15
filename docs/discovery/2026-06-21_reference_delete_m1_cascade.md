# Discovery (READ-ONLY) — M2 reference delete → M1 instance cascade

**Date/time**: 2026-06-21 16:00
**Branch**: `alfonso-frontend-jjtl`
**Editor under test**: v2-flow (React Flow)
**Phase**: 1 of 2 — discovery only. No source modified.
**Type**: discovery / root-cause confirmation

---

## TL;DR — verdict

- **Root cause**: the v2-flow reference-delete path (`syncDeleteEdge`,
  `canvasToJjom.ts:342–350`) removes the M2 DReference with a **raw
  `DeleteElementAction.new(refModel.__raw)`**, which **bypasses the L-proxy
  cascade** (`Dummy.get_delete`). The attribute path (`syncRemoveAttribute`,
  `canvasToJjom.ts:485–505`) calls **`lAttr.delete()`** (cascade). That single
  difference is the whole bug: with no cascade, the M1 `DValue` slots that point
  at the reference (`instanceof === refId`) are never enumerated and never
  deleted.
- **Cascade reach (if it ran)**: `Dummy.get_delete` **does** reach M1 for a
  DReference — `case 'instanceof'` (`Dummy.ts:211–216`) deletes each dependent
  `DValue` slot via `lObj.delete()`. The reach exists; the canvas path just
  never invokes it.
- **Fix shape (v2-flow)**: **slot cleanup + DVoidEdge cleanup**, not slot-only.
  v2-flow M1 reference edges are **materialized** persisted `DVoidEdge`s
  (`useM1ReferenceEdges` → `DVoidEdge.new2`), and the existing reconcile/delete
  pass in that hook **cannot** remove them once the DReference is gone (its
  `isManagedM1RefEdge` guard requires `lookup[se.model].className === 'DReference'`,
  which becomes `undefined` after the ref is deleted). So merely cleaning the
  slots leaves the materialized M1 edges behind as model-less zombies.
- **Distinct from 2026-06-17**: the class-delete cascade (`Dummy.ts` `case 'type'`
  → `lObj.delete()`, commit `9a0f85488`) is a **different entry point** from this
  direct-reference-delete (`syncDeleteEdge`, raw). No collision. But they share
  the same latent M1-edge-reconcile gap (see Q6).

---

## Working-tree note (landscape changed since the last discovery)

The prior reference-cascade discovery (`2026-06-17_incoming_ref_delete_m1_cleanup.md`)
and the 2026-06-19 "Part 2 BLOCKED" log entry described a tree where Part 1 / Part 2
were **not** present. They have since **landed** as commits on this branch:

```
9a0f85488 fix(core): delete incoming DReference when its target class is deleted   (= "Part 1": case 'type' split)
125fd48f6 feat(editor-v2): reconcile and delete stale M1 reference edges            (= "Part 2": useM1ReferenceEdges add→reconcile)
ab6401a75 feat(editor): render classic-editor M1 reference edges via DerivedReferenceEdge
```

All findings below are read against the **current** working tree, not those older reports.

---

## Q1 — M2 reference delete entry point

**There is no `syncRemoveReference`.** In v2-flow the reference is deleted through the
**edge-delete** path, `syncDeleteEdge(edgeId, isInheritance)`.

Call sites (`EditorV2.tsx`):
- keydown / `deleteSelected` → `syncDeleteEdge(edge.id, edge.type === 'inheritance')` (`EditorV2.tsx:1888`)
- ctx-menu "Delete reference" → `deleteEdge` → `syncDeleteEdge(edgeId, edge.type === 'inheritance')` (`EditorV2.tsx:1940`)

For a reference edge `edge.type === 'reference'` ⇒ `isInheritance === false` ⇒ the **else**
branch runs (`canvasToJjom.ts:342–350`):

```typescript
} else {
    // Delete the reference model element
    const refModel = edgeProxy.model;
    if (refModel) {
        TRANSACTION('EditorV2 delete edge', () => {
            DeleteElementAction.new(refModel.__raw ?? refModel);   // ← RAW delete, no cascade
            DeleteElementAction.new(edgeProxy.__raw ?? edgeProxy);  // ← the clicked M2 DVoidEdge
        });
    }
}
```

**Side-by-side with the attribute path** (`syncRemoveAttribute`, `canvasToJjom.ts:485–505`):

```typescript
export function syncRemoveAttribute(attrId: string, _vertexId: string): void {
    const lAttr: any = LPointerTargetable.fromPointer(attrId);
    if (!lAttr) return;
    captureAttributeOrphanValues(attrId);   // snapshot M1 values BEFORE cascade wipes them
    // "Use lAttr.delete() (not DeleteElementAction direct) so Dummy's cascade fires
    //  and every zombie DValue with instanceof === attrId gets properly removed..."
    lAttr.delete();                          // ← CASCADE (Dummy.get_delete)
}
```

**The divergence (the bug, exactly)**:

| | Attribute delete | Reference delete |
|---|---|---|
| Handler | `syncRemoveAttribute` | `syncDeleteEdge` (else branch) |
| Removal call | `lAttr.delete()` (cascade) | `DeleteElementAction.new(refModel.__raw)` (raw) |
| `Dummy.get_delete` fires? | **yes** | **no** |
| M1 `DValue` slots cleaned? | **yes** (via `case 'instanceof'`) | **no** — they survive |
| Orphan-value capture? | yes (`captureAttributeOrphanValues`) | none |

`DeleteElementAction.new(...)` removes the element from `idlookup` directly; it does **not**
walk `pointedBy` dependencies. The dependency walk lives inside `Dummy.get_delete`, invoked
only by the L-proxy `.delete()` (it is the *last* action of `get_delete`, `Dummy.ts:247`).
So the raw call deletes the DReference and the clicked M2 void edge, and nothing else.

---

## Q2 — Cascade reach for DReference

The cascade **would** reach M1 for a DReference — the reach is not missing, it is simply
never invoked by the canvas path. Proof in `Dummy.get_delete`'s `pointedBy` switch:

`case 'instanceof'` (`Dummy.ts:211–216`):
```typescript
case 'instanceof': // orphan DObject instances (C.3); delete other instanceof dependents (DValue slots)
    if (dObj.className === 'DObject')
        SetFieldAction.new(dObj.id, 'instanceof', '', '', true);  // orphan: clear, do not delete
    else
        lObj.delete();   // ← DValue slots (instanceof === refId) get deleted here
    break;
```

Every M1 reference slot is a `DValue` whose `instanceof` points at the DReference being
deleted, so each surfaces in `ref.pointedBy` with `field === 'instanceof'`, falls into the
`else` branch (`dObj.className === 'DValue'`, not `'DObject'`), and is recursively
`.delete()`- d. This is the same branch that cleans attribute slots — it is feature-agnostic
(attribute vs reference): it keys on the *dependent's* className (`DObject` → orphan, else →
delete), not on the deleted element's type.

Other relevant `pointedBy` cases for a DReference (for completeness):
- `case 'type'` (`Dummy.ts:158–173`): fires on the **reverse** relation (a DReference whose
  *type* is the deleted element). Not relevant when the DReference itself is the deleted element.
- `case 'opposite'` (`Dummy.ts:175–180`): clears a sibling DReference's dangling `opposite`
  pointer — `lObj.opposite = undefined`. Correct M2 hygiene; does not touch M1.
- `case 'model'` (`Dummy.ts:217–225`): **a no-op** — the body is fully commented out and falls
  through to `case 'father'` (`:226`) → `break`. This is why the **M2** DVoidEdge (whose
  `model` is the DReference) is *not* removed by the cascade and must be deleted explicitly
  (current code does, `canvasToJjom.ts:348`). **It is also why the M1 DVoidEdges are never
  removed by the cascade** — they too point at the ref via `model`, and `case 'model'` is a
  no-op. (See Q4.)

**Conclusion**: for the slot/model layer the cascade is sufficient (`case 'instanceof'`
deletes the M1 DValues); for the **canvas-edge** layer the cascade is structurally a no-op
(`case 'model'`). So even a hypothetical `refModel.delete()` cleans the slots but leaves the
materialized M1 DVoidEdges.

---

## Q3 — M1 reference instance storage

An M1 reference instance is a **`DValue` slot on the source `DObject`**:

- `DObject.features` → array of `DValue` ids.
- Each `DValue` (the slot) has `instanceof === <DReference id>` — this is the field that links
  the M1 slot back to its M2 DReference.
- The target pointer(s) live in `DValue.values` (array of target `DObject` ids).

Canonical evidence — the v2-flow M1 edge enumerator (`useM1ReferenceEdges.ts:59–72` and the
mirror at `:116–137`):
```typescript
for (const objId of rawModel.objects) {
    const dObj = lookup[objId];
    for (const featId of dObj.features) {
        const dFeat = lookup[featId];                       // the DValue slot
        const meta = lookup[dFeat.instanceof];              // ← slot.instanceof = the DReference
        if (meta?.className !== 'DReference') continue;
        for (const tgtId of (dFeat.values ?? [])) {         // ← values = target DObject ids
            parts.push(`${objId}:${dFeat.instanceof}:${tgtId}`);
        }
    }
}
```
The attribute capture path uses the identical link field (`elem.instanceof !== attrId`,
`useOrphanFeatures.ts:108`), confirming attributes and references store M1 values the same way
(`DValue.instanceof` = the feature id). **To find all slots to delete by `refId`**: iterate
`idlookup` for `className === 'DValue' && instanceof === refId` (mirror of
`captureAttributeOrphanValues`, `useOrphanFeatures.ts:105–113`).

**className caveat (CLAUDE.md §3.13)**: L-proxies report the **D-layer** className. A guard must
test `=== 'DValue'`, never `'LValue'` (the latter is always false → silently dead). The existing
code reads the raw `idlookup` entries (`elem.className === 'DValue'`), which is correct.

---

## Q4 — Edge derivation: derived vs persisted (decides the fix shape)

**Two different architectures, by editor:**

- **v2-flow (editor under test) → MATERIALIZED.** M1 reference edges are persisted
  `DVoidEdge`s in `graph.subElements`, created by `useM1ReferenceEdges` via
  `DVoidEdge.new2(refMetaId, graphId, graphId, undefined, srcV, tgtV, d => d.isReference = true)`
  (`useM1ReferenceEdges.ts:152–163`). `jjomEdgeToRFEdge` (`jjomTransformers.ts:447–482`) merely
  *renders* whatever DVoidEdges already exist; it does not derive them from slots. Deleting the
  slot therefore does **not** make the DVoidEdge vanish — the DVoidEdge is an independent
  persisted entity.

- **classic / default-view (DV.tsx) → DERIVED.** `!data.isMetamodel && refEdges.map(se =>
  <DerivedReferenceEdge .../>)` (`DV.tsx:1243`, `:1281`) renders M1 reference edges live at
  render time, label `se.start.name`. `DerivedReferenceEdge` (`edges/derived/DerivedReferenceEdge.tsx`)
  computes routing on the fly and returns `null` if endpoints don't resolve. (The exact source
  of `refEdges` — slot-derived vs subElement-derived — was **not** traced; it is out of the
  v2-flow scope of this discovery. Flagged so a future classic-editor fix re-verifies it.)

**Why the existing v2-flow reconcile does NOT save us.** `useM1ReferenceEdges` was upgraded
(commit `125fd48f6`) from add-only to add+reconcile. The reconcile (`useM1ReferenceEdges.ts:140–182`)
deletes a managed M1 edge whose vertex-pair has no live backing slot tuple:
```typescript
const toDelete = managedM1Edges.filter(e => !validPairs.has(`${e.start}→${e.end}`));
```
But `managedM1Edges` is gated by `isManagedM1RefEdge` (`useM1ReferenceEdges.ts:37–45`), whose
third clause is:
```typescript
if (typeof se.model !== 'string' || lookup[se.model]?.className !== 'DReference') return false;
```
**Once the DReference is deleted, `lookup[se.model]` is `undefined`** ⇒ `isManagedM1RefEdge`
returns `false` ⇒ the M1 edges are **not** collected into `managedM1Edges` ⇒ they can **never**
enter `toDelete`. The reconcile only handles the *slot-cleared-but-ref-still-alive* case (user
edits/clears a slot via the Slots panel). It is structurally unable to handle
*ref-deleted-slot-survives* (this bug) **and** *ref-deleted-slot-also-deleted* (the would-be fix).

**How a materialized M1 DVoidEdge is keyed/found** (for a fix that removes it explicitly):
- Pair key in `syncState`: `${srcVertexId}→${tgtVertexId}` (`markCanvasEdgePair` /
  `hasCanvasEdgePair` / `clearCanvasEdgePair`, `syncState.ts`). `→` is U+2192; directional.
- In the graph: a `subElements` entry with `className` including `'Edge'`, `model === refId`,
  and both endpoints' vertices over `DObject`s (exactly the `isManagedM1RefEdge` predicate) —
  but this match **must be taken while the ref still resolves**, i.e. *before* the DReference is
  deleted, since the predicate depends on `lookup[se.model]`.

**Explicit answer: slot cleanup + DVoidEdge cleanup.** For v2-flow, slot-only is insufficient.

---

## Q5 — Label resolution (zombie mechanism confirmed)

The M1 edge label resolves from the **M2 DReference name**, while the edge's existence/geometry
is driven by the **surviving DVoidEdge + surviving source DObject vertex**. `jjomEdgeToRFEdge`,
M1 branch (`jjomTransformers.ts:447–482`):
```typescript
const sourceModel = startVertex?.model;
const sourceClassName = sourceModel?.className ?? sourceModel?.__raw?.className;
if (sourceClassName === 'DObject') {           // ← M1 branch keyed on the SOURCE DObject (a1), still alive
    const refModel = edge.model;               // ← the DReference (now deleted ⇒ unresolved)
    const refName = refModel?.name ?? '';      // ← '' once the ref is gone  → label disappears
    const refId  = refModel?.id ?? edge.id;
    ...
    return { ..., type: 'instanceRef', label: refName, data: { referenceName: refName, referenceId: refId } };
}
```
After the raw delete:
- `startVertex.model` (the source `DObject` `a1`) still resolves ⇒ `sourceClassName === 'DObject'`
  ⇒ the M1 branch is taken ⇒ **the edge is still produced and rendered** (it is *not* dropped).
- `edge.model` (the DReference) no longer resolves ⇒ `refName = ''` ⇒ **the label vanishes**, and
  `referenceId` falls back to `edge.id`.

This is exactly the reported symptom: both edges stay, the `r` label disappears. It also confirms
the corollary: **once the M1 slot *and* the DVoidEdge are removed, the edge disappears entirely**
(no DVoidEdge ⇒ nothing for `jjomEdgeToRFEdge` to render). (For comparison, the M2 reference edge
label is `refModel?.name ?? ''` at `jjomTransformers.ts:536`, same dependency on the DReference.)

---

## Q6 — Relationship to the 2026-06-17 class-delete cascade

**Distinct entry points — no collision:**

| | Class-delete (2026-06-17) | Direct reference-delete (this bug) |
|---|---|---|
| Trigger | delete class B | delete reference edge `r` |
| Entry | `syncDeleteVertex` → `modelElement.delete()` (`canvasToJjom.ts:303–304`) | `syncDeleteEdge` else branch (`canvasToJjom.ts:342–350`) |
| Ref removal | cascade: `case 'type'` → `lObj.delete()` (`Dummy.ts:162–166`) | **raw** `DeleteElementAction.new(refModel)` |
| Cascade fires? | **yes** | **no** |

The `2a` seam swap (v2-flow class delete → `.delete()`, `canvasToJjom.ts:303–304`) and the `2b`
`case 'opposite'` (`Dummy.ts:175–180`) live on the **class-delete** path. A Phase-2 fix to
`syncDeleteEdge` does not touch them.

**Shared latent gap (worth flagging, not for action here):** both paths, once they delete a
DReference, rely on the M1-edge reconcile in `useM1ReferenceEdges` to drop the now-stale M1
DVoidEdges — and that reconcile cannot fire for a *deleted* ref (Q4). So the class-delete path
likely leaves the same model-less M1 edge zombies (consistent with the 2026-06-17 discovery's
"observation 7"). A fix that adds explicit M1-DVoidEdge cleanup keyed by `refId` would close
**both** paths if shared (e.g. a helper invoked from the cascade or from both sync sites);
designing that is Phase 2.

---

## Critical-zone files a Phase 2 fix would touch (gate the Phase-2 prompt on a Layer Impact Report)

| File | Why it would change | §3.1 critical zone |
|---|---|---|
| `components/editor-v2/sync/canvasToJjom.ts` | `syncDeleteEdge` else branch: route ref removal through `refModel.delete()` and/or add explicit M1 DVoidEdge cleanup | **yes** |
| `components/editor-v2/hooks/useM1ReferenceEdges.ts` | option: extend `isManagedM1RefEdge` / reconcile to treat model-less M1 edges as stale | **yes** |
| `components/editor-v2/sync/syncState.ts` | if explicit per-edge cleanup is added: `clearCanvasEdgePair(src,tgt)` per removed edge | **yes** |
| `common/Dummy.ts` | only if the fix extends the cascade itself (e.g. make `case 'model'` delete M1 ref edges) — higher blast radius | core cascade |

Read-only this session; flagged for the Phase-2 LIR.

### Hazards to carry into Phase 2 (CLAUDE.md, not for action here)

- **§3.3 TRANSACTION nesting.** `refModel.delete()` opens its own internal TRANSACTION
  (`Dummy.ts:252`). It must **not** be wrapped in the current `TRANSACTION('EditorV2 delete edge', …)`
  block (coordinate loss / dropped `SetFieldAction`s). Mirror `syncRemoveAttribute`, which calls
  `lAttr.delete()` with **no** outer wrapper. The clicked M2 DVoidEdge (`edgeProxy`) — currently
  deleted inside that same TRANSACTION — would need to be re-sequenced (it is *not* removed by the
  cascade because `case 'model'` is a no-op, Q2).
- **§3.4 DVoidEdge pair guard.** Any explicit M1 edge removal must `clearCanvasEdgePair(src,tgt)`
  for each removed edge (the `useM1ReferenceEdges` reconcile already does this at `:179`), else a
  later re-add is suppressed by a stale `hasCanvasEdgePair`.
- **Ordering.** If the fix removes M1 DVoidEdges explicitly, do it **while the DReference still
  resolves** (so the `model === refId` match works) — i.e. enumerate edges *before* `refModel.delete()`.
- **§5.1 reproduce-before-fix.** This report is static analysis of the current tree. Reproduce the
  zombie state live in v2-flow (delete `r:A→B` with two M1 instances; confirm both M1 edges persist,
  label empty, `DValue` slots survive in `windoww.store.getState().idlookup`) before building Phase 2.

---

## Evidence index (file : line)

- `canvasToJjom.ts:321–355` — `syncDeleteEdge` (ref else branch `:342–350`, raw delete `:347`)
- `canvasToJjom.ts:485–505` — `syncRemoveAttribute` (`lAttr.delete()` `:501`)
- `canvasToJjom.ts:303–304` — class delete via `modelElement.delete()` (2a)
- `Dummy.ts:211–216` — `case 'instanceof'` (DValue slot → `lObj.delete()`)
- `Dummy.ts:158–173` — `case 'type'` (DReference → `lObj.delete()`, line 165)
- `Dummy.ts:175–180` — `case 'opposite'`
- `Dummy.ts:217–227` — `case 'model'` (no-op) → `case 'father'` break
- `Dummy.ts:247`, `:252` — cascade's terminal `DeleteElementAction`; `.delete()`'s own TRANSACTION
- `useM1ReferenceEdges.ts:37–45` — `isManagedM1RefEdge` (model-must-resolve guard `:40`)
- `useM1ReferenceEdges.ts:140–182` — reconcile/delete pass (`toDelete` `:143`; `clearCanvasEdgePair` `:179`)
- `useM1ReferenceEdges.ts:152–163` — `DVoidEdge.new2` materialization
- `jjomTransformers.ts:447–482` — M1 edge transform (label `refName` `:451/:462/:477`)
- `jjomTransformers.ts:536` — M2 edge label
- `useOrphanFeatures.ts:86–130` — `captureAttributeOrphanValues` (find-by-`instanceof` template `:105–113`)
- `EditorV2.tsx:1888`, `:1940` — `syncDeleteEdge` call sites
- `DV.tsx:1243`, `:1281` — classic derived `<DerivedReferenceEdge>` (M1)

---

**End of discovery. HARD STOP — no fix, no commit.**
