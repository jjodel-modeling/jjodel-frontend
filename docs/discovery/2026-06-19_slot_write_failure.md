# Discovery (READ-ONLY) — why the Direction-A slot write corrupts state
**Date**: 2026-06-19
**Branch**: alfonso-frontend-jjtl
**Mode**: rollback done (Step 0b), then read-only analysis. No new fix.
**Trigger**: activating the name→slot write inside `LObject.set_name` corrupted the pointer
graph on a box-title rename (`Invalid action path 0` + unresolved `PendingPointedByPaths`).

---

## Step 0a — The reverted code (captured verbatim)

The Step-2 block that was inside `LObject.set_name`'s TRANSACTION (`LModelElement.tsx:6060`),
now removed:

```typescript
SetFieldAction.new(c.data, 'name', name, '', false);
// Direction A (CLAUDE.md §3.12): propagate the new name onto the identity slot
// when the class declares one. Runs AFTER the data.name write above, so the
// slot→name echo at setValueAtPosition (the direct SetFieldAction at :7493) sees
// data.name === name and is a no-op (equality-guarded) — no loop. name→slot only;
// never routed back through set_name.
const identityAttr = self.instanceof?.identityAttribute;
if (identityAttr) {
    const slot = (c.proxyObject as any)['$' + identityAttr.name] as LValue | undefined;
    if (slot && slot.className === 'LValue') {
        if (slot.value !== val) slot.value = val;                       // overwrite existing slot value
    } else {
        self.addValue(undefined, identityAttr.id as any, [val], false); // materialize absent slot
    }
}
```

## Step 0b — Revert state (current)

`LObject.set_name`'s TRANSACTION now contains only the scalar write
`SetFieldAction.new(c.data, 'name', name, '', false);` plus a `// TEMP DIAG` marker. The
top-of-method TEMP DIAG log is kept. `classes.ts` base setter untouched. Build green
(typecheck 33 = baseline). Corruption no longer reproduces.

---

## 1. The reverted code's write + why the path is invalid

The block had two branches, both touching the **slot `DValue`**, not a scalar:

- **overwrite**: `slot.value = val` → `LValue.set_value` (`:7585`) →
  `get_setValueAtPosition(0, val)` → `SetFieldAction.new(c.data, 'values.' + index, val, '', isPtr)`
  (`LModelElement.tsx:7482`). Target = the slot `DValue`; field = `values.0`.
- **create** (slot absent): `self.addValue(undefined, identityAttr.id, [val], false)`
  (`:6221`) → `DValue.new(...)` (`:6365`) → constructs a `DValue` **and** links it via
  pointer actions (`+=` into the owner's `features`, plus `instanceof`/`pointedBy` wiring).

The reducer applies each action through `deepCopyButOnlyFollowingPath`
(`reducer.ts:81`): it walks `action.pathArray`, cloning each hop. At a non-final hop, if
`current[key]` is missing/non-object it logs **`Invalid action path 0`** with
`curr: undefined` and **returns `false`** (`:98-101`). The caller then does
**`if (!tmp) return oldState;` — "rollback due to invalid action in transaction"**
(`reducer.ts:539-540`). So one unresolvable action **rolls back the whole rename batch**,
which is exactly the observed corruption (title shows `'wwwww'` from a partial/earlier
update, slot stays `'aaaa'`, state inconsistent).

The reported failing action had `path: Array(3)`, `curr: undefined`, `key: 'wwwww'` — i.e.
the **new-name value appears as a path segment** and the hop before it resolves to
`undefined`. That shape is consistent with a slot/`DValue` (or its container) that is being
created/referenced **within the same uncommitted batch** and is therefore not yet present
in the in-flight cloned state the action is walking. The precise hop cannot be pinned
statically (it needs the runtime `pathArray`), but the failure class is clear: an action
whose path targets pointer state that the batch has not yet committed.

## 2. How Direction B writes the slot correctly

Direction B uses the **same** `setValueAtPosition` (`:7396`, the `values.N` `SetFieldAction`
at `:7482`), but from a **standalone top-level dispatch on an already-committed slot**:

- classic Properties: `Info.tsx:667` `changeDValue` → `TRANSACTION('change value (sidebar)', () => value.setValueAtPosition(...))`.
- v2-flow box body: `ObjectNode.tsx:254` `syncUpdateFeatureValue` → `TRANSACTION(...) → featureProxy.value = X → set_value → setValueAtPosition`.

`TRANSACTION` (`action.ts:210`) batches by depth (`BEGIN()`/`END()`, `t.transactionDepthLevel`),
so a nested `setValueAtPosition` joins the outer batch — meaning Direction B is *also*
"nested" in a sense. **The discriminator is not nesting depth; it is that B's slot `DValue`
already exists and is committed in `idlookup`**, so every hop of the `values.N` path resolves
and no new pointer needs reconciling. The batch is a single coherent slot mutation.

## 3. The pointer cascade (`PendingPointedByPaths`)

`PendingPointedByPaths` (`classes.ts:1745`) holds `PointedBy` `+=`/`-=` actions that cannot
yet be applied. `canBeResolved` (`:1807`) returns `!!state.idlookup[this.holder]` and warns
once `solveAttempts >= 3` — the exact *"pending PointedBy action is not resolved for too
long, some pointer was wrongly set up"* message seen, with `+=` into `.features` /
`.instances` and holders `USER_*`. Those `+=` actions are produced by the **create branch**
(`addValue → DValue.new` linking the new slot into the owner's `features`, and the
instance into its class's `instances`). Their holders are objects created/mutated **inside
the rolled-back batch**, so they never land in `idlookup` → the `PointedBy` actions retry
forever. This strongly implies the **create branch ran** — i.e. inside `set_name`'s dispatch
the `(c.proxyObject)['$' + identityAttr.name]` lookup did **not** resolve to the existing
slot (proxy read against in-flight/uncommitted state), so the code wrongly took the
"materialize absent slot" path and minted a duplicate `DValue` whose pointers then failed.

## 4. Key question — nested vs top-level

The slot write **cannot** run inside `set_name`'s batch. Not because depth > 1, but because
it (a) reads the slot proxy against uncommitted in-flight state (mis-resolving to "absent" →
create), and (b) emits pointer-graph mutations (`DValue` creation, `features`/`instances`/
`pointedBy` links) whose targets are not yet in `idlookup` during the same batch → invalid
action path → **full-batch rollback** (`reducer.ts:540`). The scalar `data.name` write
survives the same nesting because it is a plain field set requiring **no** path beyond an
existing object and **no** pointer reconciliation.

**Conclusion:** the slot write must execute as a **separate top-level dispatch, after the
rename transaction has committed**, against committed state — exactly the conditions under
which Direction B's identical `setValueAtPosition` already succeeds.

## 5. Candidate approaches + recommendation

**(a) Defer the slot write to after `set_name` commits — RECOMMENDED.**
The framework already exposes post-commit hooks: `AFTER_TRANSACTION` (after reducer, before
react; cannot `getState`) and `AFTER_UPDATE` (after react, via `setTimeout`; may `getState`)
— `action.ts:228-239`. From inside `set_name`, register the slot write via `AFTER_UPDATE`,
then in the callback **re-resolve** the object/slot from committed state (per CLAUDE.md §9.2,
proxies captured pre-commit are stale) and call the **existing** `setValueAtPosition` (or
`addValue` if genuinely absent) as a fresh top-level transaction.
  - Pros: one central change covering **all** rename paths (every UI rename reaches
    `LObject.set_name`); reuses the proven write on committed state; no malformed paths,
    no mid-batch pointer creation.
  - Cons: asynchronous — the slot updates ~one tick after the name (acceptable: the slot is
    a derived mirror); the callback must re-resolve (not capture) the slot; guard against
    re-entrancy/duplicate scheduling.

**(b) Move Direction-A to the top-level entry point(s) — alternative.**
Write the slot in `syncNodeLabel` (`canvasToJjom.ts:355`), mirroring the UI, for the
v2-flow paths; handle classic Properties separately (e.g. bind the `Info.tsx` name field to
the slot the way the classic box title already does, `data.$name ? …`).
  - Pros: matches the working UI pattern directly.
  - Cons: fragmented (v2 vs classic handled in different places); and `model.name = X` →
    `set_name` runs its own async `TRANSACTION`, so an immediately-following slot write in
    `syncNodeLabel` can still race/overlap it unless **also** deferred — i.e. (b) tends to
    collapse back into needing (a)'s post-commit deferral anyway.

**(c) Only fix the path construction inside `set_name` — RULED OUT.**
The failure is not a malformed path *string*; it is reconciling pointer-graph state
(slot/`DValue` creation + `PointedBy` links) against an uncommitted in-flight batch, which
rolls the batch back. No path-string tweak makes a mid-batch slot create/overwrite resolve.

**Recommendation:** approach **(a)** — defer the slot propagation out of `set_name`'s
transaction via `AFTER_UPDATE`, re-resolve the slot from committed state in the callback,
and reuse `setValueAtPosition` (overwrite) / `addValue` (only if truly absent). This keeps
`set_name` scalar-only (safe), covers every rename path centrally, and runs the slot write
under the same committed-state, top-level conditions that make Direction B work. The
remaining open risk to verify at runtime is the empty-slot **create** path (does a deferred
top-level `addValue` resolve cleanly), and whether to also guard against the
`identityAttribute` fresh-object selector churn (the `ObjectNode` memoization warning).

---

## Caveat

Static analysis. The exact failing `pathArray` hop and which branch (overwrite vs create)
ran are inferred from the console symptoms + the code; a one-shot runtime log of
`action.pathArray` inside `deepCopyButOnlyFollowingPath` (or of which branch executed) would
confirm the create-branch hypothesis in §3, but does not change the §4 conclusion or the
§5(a) recommendation.
