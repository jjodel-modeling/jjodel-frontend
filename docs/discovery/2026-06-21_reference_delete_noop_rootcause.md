# Discovery (READ-ONLY) — why `.delete()` on a DReference appears to no-op

**Date/time**: 2026-06-21 21:00
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery / root-cause. **HARD STOP — no fix, no commit, no log entry.**
**Predecessor**: `docs/discovery/2026-06-21_reference_delete_m1_cascade.md` (16:00, same day).
The 16:00 doc analysed a tree where the v2-flow ref-delete still used a **raw**
`DeleteElementAction`. The call site has since been switched to `.delete()`
(canvasToJjom.ts:384-389); this report reads that switched code.

---

## TL;DR — verdict (it is NOT a reference-specific early return)

**There is no reference-specific delete code, and therefore no reference-specific
guard to abort.** `LReference`, `LStructuralFeature`, and `LModelElement` define
**no** `get_delete` override. References, attributes, and classes all run the
**identical** `Dummy.get_delete` body. The only `get_delete` overrides in the whole
codebase are `LObject` (M1 instances — singleton guard) and `LProject`; neither is on
the reference path. So the premise "references abort because of `<some ref-specific
condition>`" has no code to back it.

Within the shared `Dummy.get_delete` body the **only** two early returns are
`Dummy.ts:58` (`__readonly`) and `:59` (`Pointer_View`). A reference id never contains
`'Pointer_View'`, so the only early return a reference can hit is `__readonly`.

But the observed symptom (`ref alive` + `slots alive`, no thrown exception) is **more
simply and more likely** explained by a **measurement artifact**, not an early return:

> **`.delete()` commits asynchronously.** `TRANSACTION` is an `async` function
> (action.ts:210) and `.delete()` fires it **without awaiting**
> (classes.ts:2522, Dummy.ts:252, canvasToJjom.ts:389). The store mutation
> (`FINAL_END → ca.fire()`) runs on a later microtask. The `[B3-DIAG]` post-delete
> block (canvasToJjom.ts:395-404) reads `store.getState()` **synchronously**, i.e.
> **before the commit**. So "ref alive / slots alive immediately after `.delete()`" is
> the expected reading for a delete that is merely *deferred*, not aborted.

A second, genuinely-silent mechanism that produces the same symptom is a
**whole-transaction ABORT** (a throw caught inside `TRANSACTION`, or a proxy `set`
on a `__readonly` object). Both swallow the exception and discard **all** pending
actions, so nothing is deleted and no error is thrown to the caller.

The current diagnostic **cannot distinguish** "aborted" from "deferred" because it
samples a synchronous snapshot of an asynchronous write. See "How to disambiguate".

---

## Step 1 — the generic `delete()` path, verbatim

### 1a. How `.delete()` reaches the implementation

`.delete()` is a proxy-resolved getter. Base class (`joiner/classes.ts:2520-2523`):

```typescript
public delete(): void {}
protected get_delete(c: Context): () => void {
    return ()=>TRANSACTION('delete '+this.get_name(c), Dummy.get_delete(this, c));
}
```

The proxy `get` trap prefers `get_<key>` over a same-named literal method
(`joiner/proxy.ts:399-401`):

```typescript
if (propKey in this.l || propKey in this.d || (this.l as GObject)[this.g + (propKey as string)]) {
    if (typeof propKey !== 'symbol' && this.g + propKey in this.lg) return this.lg[this.g + propKey](logicContext);
```

So `lproxy.delete` returns the `get_delete` closure (the empty `public delete(){}` is
"only for correct signature", per the LProject comment at classes.ts:3513). `this.lg`
for a `DReference` resolves up `LReference → LStructuralFeature → LModelElement →
LPointerTargetable`, landing on the **base** `get_delete` above — same as an attribute.

Note the **double** TRANSACTION wrap: the base `get_delete` wraps in `TRANSACTION`, and
`Dummy.get_delete`'s returned closure (below, Dummy.ts:250-256) wraps **again**.

### 1b. `Dummy.get_delete` — full body (`common/Dummy.ts:50-257`)

```typescript
static get_delete(thiss: L, context: any): () => void {
    const lDeleted: L & GObject = context.proxyObject;
    const dDeleted = context.data;
    const dependencies = thiss.get__jjdependencies(context);

    const ret = () => {
        const deletedID = dDeleted.id as any;
        if (dDeleted.__readonly) return;                                   // ← EARLY RETURN #1
        if (deletedID.indexOf('Pointer_View') !== -1 ) return;             // ← EARLY RETURN #2 (cannot fire for a ref id)

        if (dDeleted.className === 'DModel') { /* ActivityLogger ... */ }   // not a ref

        SetRootFieldAction.new('_lastSelected', undefined, '');

        for (let child of lDeleted.children) {                             // children cascade
            child?.delete();
        }

        switch (dDeleted.className) {                                       // className switch
            case 'DViewElement': ...; break;
            case 'DViewPoint':   ...; break;
            case 'DClass':       this.dclass(context, thiss); break;       // ← DClass-only extra
            // NB: NO 'DReference' and NO 'DAttribute' case → both fall through (identical handling)
        }

        if (dDeleted.father) {                                             // father safety net
            const fatherField = dDeleted.className === 'DObject' ? 'objects'
                : dDeleted.className === 'DValue' ? 'features'
                : null;                                                    // ← null for DReference AND DAttribute
            if (fatherField) SetFieldAction.new(dDeleted.father as any, fatherField, deletedID, '-=', true);
        }

        for (let dependency of dependencies) {                             // pointedBy cascade
            const root = dependency.firstKey;
            if (root !== 'idlookup') { SetRootFieldAction.new(root, deletedID, '-=', false); continue; }
            const pointer = dependency.obj;
            if (!pointer) { ...; continue; }
            const field = dependency.lastKey;
            const lObj = L.wrap(pointer);
            if (!lObj) continue;
            const dObj = lObj.__raw;
            switch (field as string) {
                default: Log.eDevv('Unexpected case in delete: '+field, ...); break;
                case 'end': case 'start': break;
                case 'extends': case 'extendedBy': break;                  // handled in this.dclass()
                case 'type':
                    switch (dObj.className) {
                        case 'DParameter': case 'DAttribute': lObj.type = 'Pointer_ESTRING'; break;
                        case 'DReference': lObj.delete(); break;           // (reverse dir; not relevant when the ref itself is deleted)
                        case 'DOperation': lObj.type = lDeleted.father; break;
                    }
                    break;
                case 'opposite': lObj.opposite = undefined; break;         // ← proxy SET on sibling ref (see ABORT note)
                case 'subElements': case 'values': /* ... */ case 'references': /* ... */ case 'objects': /* ... */
                    SetFieldAction.new(dObj.id, field, deletedID, '-=', true);   // ← OWNER-COLLECTION CLEANUP (see Step 4)
                    break;
                case 'instanceof':
                    if (dObj.className === 'DObject') SetFieldAction.new(dObj.id, 'instanceof', '', '', true);
                    else lObj.delete();                                    // ← M1 DValue slot cleanup (attr + ref identical)
                    break;
                case 'model': case 'father': break;                        // no-op
            }
        }

        if (lDeleted.nodes) lDeleted.nodes.map((node: any) => node.delete());
        SetRootFieldAction.new('ELEMENT_DELETED', deletedID, '+=', false);
        DeleteElementAction.new(dDeleted.id);                              // ← terminal removal (Step: see below)
    };
    return () => {
        TRANSACTION('delete ' + (thiss as any).get_name(context), ()=>{   // ← inner async TRANSACTION
            ret();
        })
    }
}
```

**Every guard / early-exit on the reference path, exhaustively:**
- `Dummy.ts:58` `if (dDeleted.__readonly) return;` — the only early return a reference can reach.
- `Dummy.ts:59` `if (deletedID.indexOf('Pointer_View') !== -1) return;` — never matches a ref id.
- No `father`/`isExclusive`/reentrancy/containment guard exists in this body.
- The `className` switch has **no** `DReference` case and **no** `DAttribute` case — references and attributes are handled **identically** (both fall straight through). The only class-specific extra is `case 'DClass' → this.dclass()`.

`DeleteElementAction.new(dDeleted.id)` (line 247) accepts a **bare id** (`Pointers.from`
handles id-or-element; LProject deletes with `data.id`, classes.ts:3520, and works). So
line 247 is **not** the "bare id is a silent no-op" the canvasToJjom.ts:408 comment warns
about — that comment is about a different call passing a proxy where `__raw` is needed.

---

## Step 2 — reference-specific `get_delete` override?

**None.** Full grep of `get_delete` across `frontend/src`:

| Location | Class | Body |
|---|---|---|
| `joiner/classes.ts:2521` | `LPointerTargetable` (base) | `TRANSACTION(..., Dummy.get_delete(this,c))` |
| `joiner/classes.ts:3515` | `LProject` | project-specific (not on ref path) |
| `model/dataStructure/GraphDataElements.tsx:1654` | graph element (`DVertex`'s neighbour) | `return super.get_delete(context)` |
| `model/logicWrapper/LModelElement.tsx:6339` | **`LObject`** (M1 instance) | singleton guard, then `super.get_delete()()` |

Class hierarchy confirmed (LModelElement.tsx): `LReference`(3836) → `LStructuralFeature`(2110)
→ `LModelElement`(159) → `LPointerTargetable`. `LAttribute`(4193) → `LStructuralFeature` →
same. Neither `LReference`, `LAttribute`, `LStructuralFeature`, nor `LModelElement` defines
`get_delete`. The `LObject` singleton guard (`if (c?.isSingleton) { Log.ww(...); return; }`,
LModelElement.tsx:6342-6344) is on the **M1-instance** branch (`LNamedElement`), never reached
by a reference.

**Conclusion**: references and attributes share one delete implementation, byte for byte.

---

## Step 3 — the condition that differs

There is **no code-level condition that distinguishes a `DReference` from a `DAttribute`
in the delete path.** Asked to name "the single property the guard keys on to abort": the
honest answer is **there is no such guard**. Two possibilities remain, both *data*- or
*timing*-driven, not code-structural:

1. **Timing (most likely given the evidence is the synchronous `[B3-DIAG]`).**
   `TRANSACTION` is `async` (`redux/action/action.ts:210`):
   ```typescript
   export async function TRANSACTION(name:string, func: ()=> void, ...): Promise<boolean> {
       BEGIN();
       let e: Error = null as any;
       try { if (lenient || !t.hasAborted) await func(); }   // ← await ⇒ END() runs on a later microtask
       catch (err: any) { e = err; ABORT(); }                // ← throw is swallowed here
       if (t.hasAborted) { if (e) Log.ee('Transaction failed:', e, ...); else Log.ee('Transaction aborted.', ...); }
       return END([]);                                       // ← FINAL_END → ca.fire() commits HERE, deferred
   }
   ```
   `.delete()` fires this **without `await`** (classes.ts:2522, Dummy.ts:252) and
   `syncDeleteEdge` is a **synchronous** function that calls `lRef.delete()` then immediately
   reads `store.getState()` (canvasToJjom.ts:389 → 395-404). The commit
   (`END → FINAL_END → ca.fire()`) has not run yet at the moment of that read. So the diag
   prints pre-commit state — `ref alive`, `slots alive` — **even for a delete that will
   succeed one microtask later**. This matches the symptom exactly and requires no abort.

2. **Whole-transaction ABORT (genuinely silent).** If, during `ret()`, either
   (a) any line throws — caught at action.ts:218, sets `e`, calls `ABORT()`; or
   (b) any proxy `set` targets a `__readonly` object — `proxy.ts:459-465`:
      ```typescript
      if ((this.d as GObject).__readonly && propKey !== '__readonly') {
          if (ABORT()){ Log.ee('Transaction aborted because an object is readonly:', this.d); }
          return true;   // ← no throw
      }
      ```
   then `t.hasAborted` (a flat flag shared across nesting depth) makes `FINAL_END` discard
   **all** pending actions (`redux/action/action.ts:156-160`):
      ```typescript
      if (t.hasAborted) { t.pendingActions = []; t.hasAborted = false; ...; return false; }
      ```
   Result: ref + slots + owner cleanup all rolled back, **no exception reaches the caller**
   (only a `Log.ee('Transaction failed:'/'…aborted.'/'…readonly:')`). Candidate triggers on
   the ref path that the attribute path lacks: `case 'opposite'` doing `lObj.opposite =
   undefined` on a `__readonly` sibling reference; or `dDeleted.__readonly` itself being set
   (Dummy.ts:58 early-returns; that alone is a clean no-op, not an abort).

If a true early-return is in play (rather than timing or abort), it is `Dummy.ts:58`:
**"the DReference would abort because `dDeleted.__readonly` is truthy"** — and it differs
from the tested class/attribute only because *that specific reference* (or an ancestor it
inherited the flag from via the cascade at classes.ts:2027-2031) carries `__readonly`,
not because references are special in code.

---

## Step 4 — does the generic delete do owner-collection cleanup?

**Yes.** The owning class points at the reference via its `references` array; that surfaces
in the ref's `pointedBy` with `field === 'references'`, hitting the subcollection case
(Dummy.ts:182-209) which fires `SetFieldAction.new(dObj.id, 'references', deletedID, '-=',
true)` — removing the ref pointer from the class. A **raw** `DeleteElementAction.new(refId)`
would skip this and leave a dangling pointer in `class.references`. (The `father` safety net
at Dummy.ts:109-116 does **not** help here — `fatherField` is `null` for `DReference`.)

---

## Step 5 — is per-slot `DValue.delete()` a safe alternative for M1 cleanup?

**Yes, for the slots.** `case 'instanceof'` (Dummy.ts:211-216) already deletes each M1 slot
via `lObj.delete()` — and `DValue` has no `get_delete` override, so a direct
`DValue.delete()` runs the same `Dummy.get_delete`, including the `father` cleanup
(`fatherField === 'features'`, Dummy.ts:111/114) that removes the slot from its owner
`DObject.features`. This is exactly the mechanism the attribute path relies on. Enumerate
slots as `idlookup` entries with `className === 'DValue' && instanceof === refId` (mirror of
`captureAttributeOrphanValues`, useOrphanFeatures.ts:105-113; D-layer className per §3.13).

**Caveat**: per-slot `DValue.delete()` cleans only the M1 slots. It does **not** remove the
M2 `DReference` nor clean the owner class's `references` array (Step 4) nor remove the
materialized M1 `DVoidEdge`s (case `'model'` is a no-op — see the 16:00 doc Q2/Q4). A
fallback teardown must still handle those three explicitly.

---

## How to disambiguate (the current diagnostic cannot)

The `[B3-DIAG]` post-delete block samples a **synchronous** snapshot of an **asynchronous**
write, so it can report a working delete as a no-op. To tell the three mechanisms apart:

1. **Timing vs real abort** — re-read `store.getState().idlookup` on a later tick:
   `await Promise.resolve()` (or `setTimeout(()=>{...},0)`) after `lRef.delete()`. If ref +
   slots are **gone** then → it was deferred, the delete works, the "no-op" is an artifact.
2. **Abort path** — check the console for `Transaction failed:`, `Transaction aborted.`, or
   `Transaction aborted because an object is readonly:` (action.ts:220/222, proxy.ts:462).
   Presence ⇒ mechanism (2); the cascade ran then rolled back.
3. **`__readonly` early return** — log `lookup[refId].__readonly` (and the ref's ancestors)
   right before `lRef.delete()`. Truthy ⇒ Dummy.ts:58 fired (clean early return, no abort
   log). The existing diag does **not** capture this.

Per CLAUDE.md §5.1 ("verify the measurement", "reproduce before fixing"): resolve which of
the three is real **before** designing a fix. The fix shape differs completely — a timing
artifact needs no model change (only correct observation / awaiting), an abort needs the
`__readonly`/throw source removed, an early return needs the `__readonly` flag cleared.

---

## Evidence index (file : line)

- `joiner/classes.ts:2520-2523` — base `delete()` / `get_delete` → `Dummy.get_delete`
- `joiner/classes.ts:3515-3528` — `LProject.get_delete` (off-path); `:3520` deletes via bare id
- `joiner/classes.ts:2027-2031` — `set_readOnly` cascades `__readonly` to children/annotations
- `joiner/proxy.ts:399-401` — `.delete` → `get_delete` resolution
- `joiner/proxy.ts:459-465` — proxy `set` on `__readonly` → silent `ABORT()`
- `common/Dummy.ts:50-257` — `get_delete` body; early returns `:58` (`__readonly`), `:59` (`Pointer_View`); `case 'instanceof'` `:211-216`; subcollection/owner cleanup `:182-209`; terminal `DeleteElementAction` `:247`; inner async `TRANSACTION` `:252`
- `redux/action/action.ts:210-226` — `async` `TRANSACTION`, throw swallowed `:218`, abort log `:220/222`
- `redux/action/action.ts:112-117` — `ABORT()` sets flat `hasAborted`, no throw
- `redux/action/action.ts:153-181` — `FINAL_END`; aborted ⇒ discard all pending `:156-160`
- `redux/action/action.ts:760-769` — `DeleteElementAction.new` accepts id-or-element via `Pointers.from`
- `model/logicWrapper/LModelElement.tsx:6339-6348` — `LObject.get_delete` (singleton guard; M1-only)
- `model/logicWrapper/LModelElement.tsx:2110/3836/4193` — `LStructuralFeature`/`LReference`/`LAttribute` (no `get_delete`)
- `components/editor-v2/sync/canvasToJjom.ts:384-404` — `lRef.delete()` (not awaited) + synchronous post-delete `[B3-DIAG]`
- `components/editor-v2/hooks/useOrphanFeatures.ts:105-113` — find-slots-by-`instanceof` template

---

**End of discovery. HARD STOP — no fix, no commit, no log entry.** Awaiting decision on
which of the three mechanisms (deferred-commit artifact / transaction abort / `__readonly`
early return) to confirm via the disambiguation steps before any Phase-2 fix.
