# Discovery — Why the class-delete cascade deletes M1 instances instead of orphaning them

**Date/time**: 2026-06-17 17:30
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery — read-only. No source modified. Report is the only artifact.
**Blocking**: Fix 2a (working tree, uncommitted) must NOT be committed until this is resolved.

---

## Summary

Root cause is **(b): the `instanceof`-clear is queued but not committed/visible when the cascade computes its dependencies** — a timing bug, not a wrong-field or wrong-path bug. `TRANSACTION` is **async** (`action.ts:210`) and commits only after `await func()` resolves (continuation runs in a microtask; `FINAL_END` fires only at depth 0, `action.ts:150,153-182`). `handleClassRemoval` calls `orphanInstances()` and then `syncDeleteVertex()` **synchronously, without awaiting** (`useClassRemoval.ts:253,268`), so the whole sequence runs inside one still-open, uncommitted transaction batch. When 2a's `.delete()` cascade runs, `Dummy.get_delete` computes `get__jjdependencies` **synchronously** against `store.getState()` (`Dummy.ts:53`, `classes.ts:2077`) — which still shows `instanceof === classId` because the clear is merely pending — so the instance is included and `case 'instanceof'` deletes it (`Dummy.ts:199-201`).

**Recommended fix: option B (core), discriminated** — make `case 'instanceof'` in `Dummy.get_delete` **orphan `DObject` dependents** (clear their `instanceof`) while still **deleting `DValue` dependents**. This makes C.3 a structural property of the cascade for every caller, independent of the async-transaction timing, and is the only option that is robust against the real cause. It touches the core (`Dummy.ts`), one `case`.

---

## Q1 — What the `useClassRemoval` instance step does

`orphanInstances` (`useClassRemoval.ts:189-208`) clears `instanceof` on each M1 `DObject` of the class:
```
TRANSACTION('Co-evolution: orphan instances', () => {
    for (const objectId of instanceObjectIds)
        SetFieldAction.new(objectId, 'instanceof', '', '', true);   // line 200
});
```
- **Mechanism**: a **raw** `SetFieldAction` (not the L-proxy `set_instanceof` setter). Args resolve correctly to `(me=objectId, field='instanceof', val='', accessModifier='', isPointer=true)` per the `SetFieldAction.new` signature (`action.ts:560-570`). So it sets `obj.instanceof = ''`.
- **Note (incomplete vs the setter)**: the L-setter `set_instanceof` (`LModelElement.tsx:5345-5354`) maintains a *bidirectional* pair — it also removes the object from `class.instances` (`-=`). The raw clear does **not** touch `class.instances`. This is not the cause of the bug (see Q3) but it leaves `class.instances` momentarily stale (moot, since the class is being deleted).
- **Transaction context**: its **own** `TRANSACTION` (line 197), opened and—critically—**not awaited** by the caller.

The instance set is computed earlier in `analyzeClassRemoval` (`useClassRemoval.ts:62-77`): a live `idlookup` scan for `d.className === 'DObject' && d.instanceof === classModelId`, where `classModelId = vertexProxy.model.id`. This is correct and populated (the same `vertexProxy.model` is what 2a successfully deletes).

## Q2 — Ordering and commit

`orphanInstances` (Step 4, `useClassRemoval.ts:253`) **is** called before `syncDeleteVertex` (Step 5b, `:268`). But its `instanceof`-clear is **NOT committed/visible** when `.delete()` runs, because:
- `TRANSACTION` is `async function … { BEGIN(); … await func(); … END(); }` (`action.ts:210-217`). `func()` runs synchronously and **queues** the `SetFieldAction`s into `t.pendingActions`, but `await func()` suspends and schedules the continuation (the `END()` → `FINAL_END()` commit) as a **microtask**. The actual store mutation (`CompositeAction.fire()`) happens only in `FINAL_END`, and only when `transactionDepthLevel` returns to 0 (`action.ts:143,150,153-182`).
- `handleClassRemoval` does **not** `await` `orphanInstances` (it returns a number synchronously) and proceeds straight to `syncDeleteVertex` (`useClassRemoval.ts:253→268`). Because every `TRANSACTION` in the flow defers its `END`, `transactionDepthLevel` stays ≥ 1 across the whole synchronous `handleClassRemoval` body — the clears, the edge deletes, and the `.delete()` cascade all accumulate in **one uncommitted batch** that commits together after the synchronous stack unwinds.
- Net: the clear's `SetFieldAction` is **pending**, not applied to `store.getState()`, at the moment the cascade reads dependencies.

## Q3 — How the cascade reaches instances (live store vs snapshot)

- The cascade reaches instances via the **`pointedBy` dependency loop**, field `instanceof` → `case 'instanceof'` at `Dummy.ts:199-201` (`lObj.delete()`). Instances are **not** children of the class (`LClass.get_children_idlist` = attributes+references+operations, `LModelElement.tsx:3047-3052`; `class.instances` is a forward collection the cascade does not traverse), so `instanceof` is the only path.
- `get__jjdependencies` reads the **live** store: `let s = store.getState()` (`classes.ts:2077`), `U.followPath(s, pathArr)` (`:2090`), with two guards that *would* protect a genuinely-cleared instance: `if (!lastVal) continue` (`:2100`, and `''` is falsy) and `if (v !== context.data.id) continue` (`:2114-2116`).
- **But** `dependencies` is computed at `Dummy.ts:53` (when `get_delete` builds the deleter), synchronously, **before** the pending clear is committed. So `s.idlookup[objId].instanceof` is still `classId` → the guards pass → the instance is added as a dependency.
- **Therefore**: it reads the live store, but the clear is not yet in it. Had `instanceof` been genuinely cleared **and committed** first, `:2100` would skip the instance and it would survive. This confirms the protection logic is sound; only the *timing* defeats it.

## Q4 — What `case 'instanceof'` does

`Dummy.ts:199-201`:
```
case 'instanceof': // all elements being instance of a removed element are also removed
    lObj.delete();
    break;
```
It **deletes** the dependent (`lObj` = the element pointing via `instanceof`). It serves **double duty**:
- deleting a **DClass** → dependents are **DObject** instances (should be *orphaned* per C.3);
- deleting a **DAttribute/DReference** → dependents are **DValue** slots (should be *deleted* — this cleanup is explicitly relied upon: `useOrphanFeatures.ts:77`, `canvasToJjom.ts:491`).

So it **could** orphan instead of delete, but only for `DObject` dependents — a blanket change would break DValue cleanup. The reason it deletes today: a single `case` was written for the DValue-cleanup semantics, with no discrimination for the DObject (C.3) case.

## Q5 — Root-cause classification

**(b)** — the step *does* clear `instanceof` (correct field, correct objects), but the clear is **not committed/visible before the cascade computes the class's dependencies**, due to async `TRANSACTION` deferral combined with non-awaited synchronous calls in `handleClassRemoval`. Not (a) (the field/objects are right) and not (c) (the path is `instanceof`, which clearing *would* protect if committed).

This also explains the pre-2a behavior: the old raw `DeleteElementAction.new(class)` did **not** cascade, so the class's `instanceof` dependents were never traversed; the pending clears then committed in the batch and the instances survived as orphans. 2a added a synchronous cascade that reads the store *before* those clears land — flipping orphan into delete.

---

## Fix options (ranked) — Q6

### ★ Option B (recommended) — core: orphan `DObject` in `case 'instanceof'`
**Seam**: `Dummy.ts:199-201`, the `case 'instanceof'`. Discriminate on the dependent's class: if `lObj.className === 'DObject'`, **clear its `instanceof`** (orphan) instead of `lObj.delete()`; otherwise keep `lObj.delete()` (DValue / DModel unchanged).
**Why**: it fixes the *cause* (makes C.3 hold regardless of whether any caller pre-clears, and regardless of async-transaction timing). Works for every deletion surface (v2-flow, classic, JjScript). Makes `useClassRemoval.orphanInstances` redundant-but-harmless (it pre-clears the same field for the toast count).
**Blast radius**: only `DObject` dependents change (orphan instead of delete); `DValue` cleanup and `DModel`-instanceof deletion are untouched (they fall to the `else`). Minor: the orphaned `DObject`'s `pointedBy` `instances` entry to the now-deleted class dangles — same residue `orphanInstances` already leaves; acceptable (the object is orphan anyway).
**Touches core**: yes (`Dummy.ts`, one `case`).

### Option A — local: commit the clear before the cascade
**Seam**: `useClassRemoval.ts` (Step 4 vs Step 5b ordering) and/or `syncDeleteVertex`.
**Why not preferred**: defeated by the async `TRANSACTION` design. Because `TRANSACTION` defers commit to a microtask and `handleClassRemoval` is a synchronous `useCallback`, you cannot simply "commit first" without either (i) making `handleClassRemoval` async and `await`-ing `orphanInstances` (then awaiting `syncDeleteVertex` too) — which ripples into its synchronous callers `deleteSelected`/`deleteNode` (`EditorV2.tsx:1867-1868,1916`), or (ii) force-flushing via `COMMIT()` (`action.ts:120`) mid-flow — fragile and easy to regress. It only fixes the v2-flow path, leaving the cascade itself still able to delete instances for any future caller.

### Option C — local: pre-clear outside any transaction
**Seam**: `orphanInstances`. Fire the `SetFieldAction`s with no `TRANSACTION` wrapper so each dispatches immediately.
**Why not**: ineffective here — `transactionDepthLevel` is already ≥ 1 (earlier deferred `TRANSACTION`s in the same synchronous flow haven't committed), so the "un-wrapped" actions still queue into the open batch rather than committing synchronously. Same timing trap.

**Recommendation**: **Option B**. It is the only option that addresses the actual cause (async-deferred clear vs synchronous dependency read) and guarantees C.3 structurally. It is a one-`case`, core-local change in `Dummy.ts`.

---

## Open questions / risks (need Alfonso's decision before the fix)

1. **Discrimination key**: confirm `lObj.className === 'DObject'` is the right discriminator (vs `dObj.className`, the raw view at `Dummy.ts:133`). Both should be `'DObject'` for an instance; the raw `dObj.className` is the safer read (no proxy recompute).
2. **Clear mechanism inside the cascade**: prefer a **raw** `SetFieldAction.new(dObj.id, 'instanceof', '', '', true)` over the L-setter `lObj.instanceof = undefined` — the L-setter (`set_instanceof`) also issues `class.instances -= obj` against the class that is mid-deletion (`LModelElement.tsx:5352-5353`); the raw clear avoids touching the dying class. (Mirror of how `orphanInstances` already clears it.)
3. **`orphanInstances` redundancy**: with Option B the hook's clear is redundant. Leave it (it sets the toast count and is harmless) or remove in a follow-up — do **not** bundle that into the fix commit.
4. **Other `instanceof` dependents**: confirmed double-duty is DObject (orphan) vs DValue (delete). Verify there is no third `instanceof`-pointing type that must keep deleting (DModel→DModel metamodel instances fall to `else` → delete, unchanged — confirm that is desired).
5. **C.3 scope**: Option B makes M1 instances orphan on *every* class delete including the classic editor. Since classic metamodel editing is currently disabled, no immediate behavior change there, but it is the correct invariant.

---

**Read-only. Report only. HARD STOP. Fix 2a remains uncommitted pending this decision.**
