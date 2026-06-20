# Discovery — Metaclass deletion vs DReference cleanup in the JOM (Phase 1, read-only)

**Date/time**: 2026-06-17 15:30
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery — read-only. No source modified. Report is the only artifact.
**Bug family**: "graph-side ↔ model-side reconcile after non-canvas write paths" (B.X / B.Y backlog).

---

## Summary

- **Owned references survive** when a `DClass` is deleted **in the v2-flow editor** and **in JjScript `delete class X` (without the `cascade` keyword)**. So do owned `DAttribute`s and `DOperation`s — the symptom is most visible on references because they render as edges. Root cause: both paths delete the class with the raw, non-cascading `DeleteElementAction.new(...)` instead of the L-proxy `.delete()` that fires `Dummy.get_delete`'s children cascade.
- **The classic editor is NOT affected**: its delete (`ContextMenu.tsx` → `ldata.delete()`) routes through the cascade and removes owned children correctly. The divergence is v2-flow / JjScript vs classic — a textbook reconcile-family signature (explicit graph-side edge cleanup, missing model-side cascade).
- The owned-reference fix is **surgical and well-localized**: a single call site in `canvasToJjom.ts:syncDeleteVertex` (and, separately, the JjScript `delete.ts` default branch). The precedent already exists in the same file — `syncRemoveAttribute` uses `lAttr.delete()` precisely so the cascade fires.
- **Caveat**: routing the class delete through `.delete()` is "all-or-nothing" — the same cascade also re-points **incoming** references' `type` to the deleted class's father package (classic-editor behavior), which overlaps with the parked Cluster-2 work. And it surfaces a pre-existing **dangling-`opposite`** gap (B.Y). Both are flagged under Open questions.

---

## Q1 — Entry points that delete a `DClass`

Three distinct deletion surfaces, **not** sharing a handler:

| Surface | Code path | Delete primitive | Cascade? |
|---|---|---|---|
| **v2-flow** (canvas Delete key, context-menu delete, single-node delete) | `EditorV2.tsx:1855` `deleteSelected` → `1867-1868` `handleClassRemoval(cn.id)`; also `EditorV2.tsx:1910` `deleteNode` → `1916` `handleClassRemoval`. Both funnel into `useClassRemoval.ts:231` → `useClassRemoval.ts:268` `syncDeleteVertex(nodeId)` | `canvasToJjom.ts:299` `DeleteElementAction.new(modelElement.__raw ?? modelElement)` | **NO** |
| **Classic editor** (Ctrl+Backspace / context menu) | `ContextMenu.tsx:683-690` `key_bindings.delete` → `ldata.delete()` (the selected modelElement's L-proxy) | `classes.ts:2520-2523` base `get_delete` → `Dummy.get_delete` | **YES** |
| **JjScript** `delete class X [cascade\|force]` | `jjscript/executor/commands/delete.ts:26` `executeDelete` → `delete.ts:95` `DeleteElementAction.new(element)` | `DeleteElementAction.new` (raw); children only if `cascade` keyword (`delete.ts:90-92,154-198`) | **NO** (shallow only with `cascade`) |

- v2-flow's `useClassRemoval` does its own co-evolution (collapse hierarchy `useClassRemoval.ts:93-182`, orphan M1 instances `197-208`, RF edge filtering `247-250`, RF node removal `265`) and then hands the model-side delete to `syncDeleteVertex`.
- Property panel / TreeView: no separate **metaclass** delete found. `TreeViewContent.tsx` / `NestedView.tsx` `.delete()` calls target **views/viewpoints**, not classes. (The B.X "delete-reference-from-tree/panel" backlog concerns reference-level deletes, not class deletes.)

## Q2 — Cascade chain (what a `DClass` delete cleans today)

The cascade only exists inside **`Dummy.get_delete`** (`Dummy.ts:50-242`), reachable **only** via L-proxy `.delete()`:

- `Dummy.ts:84-87` — `for (let child of lDeleted.children) child?.delete();` — recursively deletes every child. For a class, `children` = owned attributes + references + operations (confirmed at `LModelElement.tsx:3047-3052` `LClass.get_children_idlist` = `...attributes, ...references, ...operations`; child collections also listed in `classes.ts:1385-1400 childKeys`). Each child's own `.delete()` recurses, so a deleted `DReference`/`DAttribute` cleans its M1 `DValue`s (via `case 'instanceof'` at `Dummy.ts:199-201`).
- `Dummy.ts:99-102` — `case 'DClass'` → `Dummy.dclass(...)` reassigns subclasses' `extends` to the deleted class's superclasses (D-layer hierarchy collapse).
- `Dummy.ts:118-223` — `pointedBy`/dependencies loop reconciles every element pointing **at** the deleted class.
- `Dummy.ts:232` — final `DeleteElementAction.new(dDeleted.id)` removes the class entry itself.

Therefore, via the **cascade** path (classic editor), per category:

| Category | Cleaned by cascade? | Where |
|---|---|---|
| Owned `DReference`s (source/father = deleted class) | ✅ yes | `Dummy.ts:84-87` children loop |
| Owned `DAttribute`s | ✅ yes | same |
| Owned `DOperation`s (+ parameters) | ✅ yes | same |
| `DValue`s of owned features | ✅ yes | child recursion → `case 'instanceof'` `Dummy.ts:199-201` |
| M1 `DObject` instances of the class | ⚠️ deleted by cascade (`case 'instanceof'` `Dummy.ts:199-201`) — **but** v2-flow deliberately keeps them as **orphans** (clears `instanceof` first, `useClassRemoval.ts:197-208`), per C.3. Not a bug. | — |

Via the **raw** path (`DeleteElementAction.new`, used by v2-flow + JjScript-no-cascade): the reducer's `ELEMENT_DELETED` handler (`reducer.ts:661-675`) only does `DViewElement` transient cleanup — **no DClass child cascade at all**. So nothing above is cleaned; only the class entry is removed.

## Q3 — Owned-references survival (authoritative)

**They survive** after a v2-flow class delete. Evidence:

- `canvasToJjom.ts:295-301` deletes only the class: `DeleteElementAction.new(modelElement.__raw ?? modelElement)` inside `TRANSACTION('EditorV2 delete node')`. No iteration over the class's `references`/`attributes`/`operations`.
- `DeleteElementAction` is a low-level raw action (`action.ts:760-770`, `extends SetFieldAction`) — it removes the target element from the store and does not cascade.
- The reducer applies no compensating cascade (`reducer.ts:661-675`).

**Authoritative inspection method**: scan the raw D-layer (`windoww.store.getState().idlookup`) for `className === 'DReference'` with `father === <deletedClassId>` — these entries remain after the delete. For type resolution use the L-proxy (`get_type`), since cross-metamodel pointers can be lost in mono-metamodel lookups (see RIFERIMENTI). Snippet in Q8.

## Q4 — Incoming-references survival (characterize only)

**They survive** in every path; what differs is their `type`:

- **v2-flow / JjScript-no-cascade (raw delete)**: the incoming `DReference` keeps `type` pointing at the **now-deleted class id** → genuinely **dangling target**. The class id is gone from `idlookup` but still referenced by `incomingRef.type`.
- **Classic editor (cascade)**: `Dummy.ts:158-168` `case 'type'` re-points each incoming `DReference`/`DOperation`'s `type` to `lDeleted.father` (the owning package) — not deleted, not dangling. (`DAttribute`/`DParameter` types reset to `Pointer_ESTRING`.)

So today, the user-reported v2-flow path leaves incoming references **dangling**, whereas the cascade path would re-home them to the package. This is **Cluster 2 (`OrphanReferenceStore`)** territory — characterized here, no fix planned (see "Incoming references" section).

## Q5 — Editor-side edge removal mechanism

**Explicit cleanup on the graph/canvas side, missing on the model side** — the reconcile-family signature.

- v2-flow removes edges **explicitly**: `useClassRemoval.ts:247-250` filters connected edges out of ReactFlow state, and `syncDeleteVertex` (`canvasToJjom.ts:268-293`) explicitly deletes connected `DEdge`/`DVoidEdge` **graph** entities via `DeleteElementAction.new(edge.__raw)` (also fixing `extends` arrays for inheritance edges).
- The model-side `DReference` entities are **not** part of that explicit cleanup, and the class delete (`canvasToJjom.ts:295-301`) doesn't cascade — so they survive. The edges "disappear" because the canvas representation (RF edges + graph DEdges) was removed directly, decoupled from the surviving model entities.
- This is the canonical signature: graph side reconciled explicitly, model side not. **Confirmed: yes, this is the reconcile family.**

## Q6 — eOpposite / `opposite`

The field is `opposite` (jjodel naming), a pointer on `DReference` (`LModelElement.tsx:3804` `opposite?: Pointer<DReference>`; setter `4068-4074`; listed in `classes.ts:1830` pointer keys).

- **Dangling-opposite risk: YES** (backlog B.Y). `Dummy.get_delete`'s dependency switch (`Dummy.ts:137-213`) has **no `case 'opposite'`** — an inbound `pointedBy` on field `opposite` falls into `default` (`Dummy.ts:139-141`) which only logs `"Unexpected case in delete"` and clears nothing. So if a deleted class owns reference A and another class owns B with `B.opposite = A`, deleting A (via cascade) leaves `B.opposite` pointing at the now-deleted A.
- Note: in the **current** buggy v2-flow path, A is never deleted, so `B.opposite` stays valid — the dangling-opposite only **emerges once the cascade fix is adopted**. Flag for Phase 2.

## Q7 — Both editors?

**Divergence is v2-flow (and JjScript-no-cascade) only; classic editor is correct.**

- Classic: `ContextMenu.tsx:688` `ldata.delete()` → `Dummy.get_delete` cascade → owned children removed; edges vanish as a recompute/`nodes` side-effect (`Dummy.ts:226`). Determinable statically — the path is a single `.delete()` call on the selected modelElement.
- v2-flow: raw `DeleteElementAction.new` (no cascade) — owned references survive. Confirmed statically.

---

## Owned-reference cascade — proposed fix site (Phase 2, no code here)

**Primary seam**: `frontend/src/components/editor-v2/sync/canvasToJjom.ts`, function **`syncDeleteVertex`**, the model-element deletion at **lines 295-301**.

Today:
```
const modelElement = vertexProxy?.model;
if (modelElement) {
    TRANSACTION('EditorV2 delete node', () => {
        DeleteElementAction.new(modelElement.__raw ?? modelElement);
    });
}
```

**Why this is the right seam**:
- It is the single model-side write for class deletion in v2-flow; both v2 entry points (`deleteSelected`, `deleteNode`) funnel through `useClassRemoval` → here.
- The fix mirrors an **already-verified precedent in the same file**: `syncRemoveAttribute` (`canvasToJjom.ts:476-496`) deliberately uses `lAttr.delete()` (not a raw action) "so Dummy's cascade fires" (its comment, `488-491`). The class-delete should follow the same discipline: `modelElement.delete()`.
- **Critical-zone constraint (§3.3)**: `.delete()` opens its **own** TRANSACTION (`Dummy.ts:237`). The outer `TRANSACTION('EditorV2 delete node')` wrapper must be **removed** when switching to `.delete()` — exactly as `syncRemoveAttribute` does ("wraps its own TRANSACTION internally, so no outer wrapper here", `491`). Any Phase-2 diff touching this file requires a Layer Impact Report first (sync-adjacent).

**Secondary seam (separate, optional)**: `frontend/src/jjscript/executor/commands/delete.ts:82-105`. `delete class X` (no `cascade`) uses raw `DeleteElementAction.new(element)` (`95`) and only shallow-deletes children when `cascade` is passed (`90-92` → `deleteChildren` `154-198`, itself raw per-child). Aligning this with the cascade is a separate decision (it changes JjScript semantics — see Open questions).

---

## Incoming references (Cluster 2 — no plan here)

- **What survives**: incoming `DReference`s (in other classes) whose `type` targets the deleted class. In the buggy v2-flow path they remain with a **dangling** `type` (points at a removed id). In the cascade path they'd be **re-homed** to the deleted class's father package (`Dummy.ts:158-168`).
- This is squarely the parked **`OrphanReferenceStore`** design (Cluster 2). **No fix proposed here.** The only Phase-2 interaction worth noting: adopting `.delete()` for the owned-reference fix would *also* trigger the incoming-ref re-typing — see Open questions.

---

## Runtime inspection recipe (Q8) — read-only

Paste into the browser console on `localhost:3001` after deleting a class. Pass the class **name**. Read-only: it only reads `idlookup` and resolves L-proxies; it mutates nothing.

```js
// READ-ONLY: enumerate owned + incoming DReferences of a class and check JOM survival.
(function inspectClassRefs(className) {
  const state = windoww.store.getState();          // double-w global (§3.11)
  const idlookup = state.idlookup || {};
  const norm = p => (p && typeof p === 'object' ? p.id : p);  // Pointer | {id} -> id

  // Resolve the class id by name (may already be gone from idlookup after delete).
  const cls = Object.values(idlookup).find(d => d && d.className === 'DClass' && d.name === className);
  const classId = cls ? cls.id : '(not in idlookup — already deleted?)';
  console.log('class:', className, 'id:', classId, 'classStillInJOM:', !!cls);

  const refs = Object.values(idlookup).filter(d => d && d.className === 'DReference');

  // OWNED: father === classId. Survival = the DReference entry still present.
  const owned = refs.filter(r => norm(r.father) === norm(classId));
  console.log(`OWNED references (${owned.length}):`);
  owned.forEach(r => {
    const lr = windoww.L && windoww.L.fromPointer ? windoww.L.fromPointer(r.id) : null;
    console.log('  •', r.name, 'id:', r.id,
      'survivesInJOM:', !!idlookup[r.id],
      'type(L.get_type):', (lr && lr.type && (lr.type.name || lr.type.id)) ?? norm(r.type));
  });

  // INCOMING: type targets classId, owned by another class. Survival + dangling check.
  const incoming = refs.filter(r => norm(r.type) === norm(classId) && norm(r.father) !== norm(classId));
  console.log(`INCOMING references (${incoming.length}):`);
  incoming.forEach(r => {
    console.log('  •', r.name, 'id:', r.id,
      'owner(father):', norm(r.father),
      'survivesInJOM:', !!idlookup[r.id],
      'typeStillPointsAtDeletedClass(dangling):', norm(r.type) === norm(classId) && !idlookup[norm(r.type)]);
  });

  return { classId, owned: owned.map(r => r.id), incoming: incoming.map(r => r.id) };
})('PASTE_CLASS_NAME_HERE');
```

Expected today, post-delete in v2-flow: `classStillInJOM:false`, OWNED refs with `survivesInJOM:true` (the bug), INCOMING refs with `dangling:true`. (If `windoww.L` is unavailable in console, drop the `get_type` line — owned/incoming survival still resolves from `idlookup` alone.)

---

## Open questions / risks (need Alfonso's decision before Phase 2)

1. **`.delete()` is all-or-nothing.** Routing `syncDeleteVertex`'s class delete through `modelElement.delete()` fixes owned references (in scope) but **also** re-points incoming references' `type` to the father package (`Dummy.ts:158-168`) — i.e. it partially does Cluster-2 work as a side effect, changing it from "dangling" to "re-homed-to-package". Options: (a) accept it (matches classic editor, arguably better than dangling); or (b) implement a narrower owned-only cascade and keep incoming for Cluster 2 (more code, diverges from the verified classic path, and reimplements deep cleanup poorly).
2. **Dangling `opposite` (B.Y) surfaces only after the fix.** Once owned references are actually deleted, any `opposite` pointing at them dangles, because `Dummy.get_delete` has no `case 'opposite'`. Decide whether B.Y must be fixed in the same Phase 2 or tracked separately.
3. **Outer TRANSACTION must be dropped** at the fix site (§3.3) — `.delete()` self-wraps. The connected-edge cleanup block above it (`canvasToJjom.ts:268-293`) keeps its own TRANSACTION; verify ordering/no double-delete (the "already deleted → no-op" guards should cover overlap, but confirm in Phase 2 with a Layer Impact Report).
4. **JjScript semantics.** Should `delete class X` (no `cascade`) start cascading owned children to match the editors, or is the explicit `cascade` keyword the intended contract? This is a user-facing behavior change; decide before touching `delete.ts`.

---

**Phase 1 complete — read-only. No code changed. HARD STOP.**
