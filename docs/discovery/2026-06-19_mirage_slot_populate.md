# Discovery (READ-ONLY) — why the create branch skips; how Direction B populates an empty slot
**Date**: 2026-06-19
**Branch**: alfonso-frontend-jjtl
**Mode**: read-only. No fix, no edits outside this report.

---

## Headline — it is NOT a mirage/attachment problem

The create branch skips (`hasSlot: false`) for a reason unrelated to mirages or attachment:
the guard `slot.className === 'LValue'` is **always false**, because **L-layer proxies report
the D-layer className** (`'DValue'`), not `'LValue'`. The slot `USER_200` is fully resolved
and attached — the raw-slot diag reads it fine; it just never checks `className`. So the
correction in the prompt's premise ("USER_200 is a detached mirage not attached as a real
slot") is itself off: the slot is attached; the comparison string is wrong.

**This same typo (`'LValue'`) is why Direction A never worked at all** — the overwrite branch
and the original inline `$name` write are gated on the same always-false condition.

---

## 1. `hasSlot`: what it tests, and why it is false while the diag resolves the slot

Both reads use the **same** `slot = lobj['$' + identAttrName]`. The difference is only the
`className` test:

| | code | reads | result for USER_200 |
|---|---|---|---|
| raw-slot diag | `slot?.id ?? slot?.__raw?.id`, `slot?.__raw?.values`, `slot?.value` | id / `__raw` / value — **never** `className` | resolves: `slotId: USER_200`, `rawValues: []` |
| create `hasSlot` | `isLValueSlot = !!slot && slot.className === 'LValue'` (`LModelElement.tsx:6127`) | `slot.className` | **false** — `className !== 'LValue'` |

So `slot` is truthy and has `__raw` (it is a real, resolved L-proxy), but `slot.className`
is **not** `'LValue'`.

**What `className` returns on an L-proxy:** the **D-layer** name. Evidence:
- `LModelElement.tsx:7447` checks `oldTarget?.className === "DObject"` where `oldTarget =
  LObject.fromPointer(...)` — an L-proxy compared against the **D**-name.
- `proxy.ts:373` `if (ret.className === "DValue")`.
- Codebase convention: **31** `className === 'DValue'|'DObject'` checks vs **3**
  `=== 'LValue'` — and all three `'LValue'` checks are in the identity/`set_name` code
  (`classes.ts:2129`, `classes.ts:2155`, `LModelElement.tsx:6127`). Everywhere else uses the
  D-name.

⇒ For the identity slot, `slot.className === 'DValue'`. The guard `=== 'LValue'` can never be
true, so `isLValueSlot` is always false → overwrite and create both fall through to the
skip → `hasSlot: false`. This is the whole bug.

## 2. Mirage shape of USER_200

- **Cannot be confirmed from the current runtime logs:** the `isMirageBefore/After` log lives
  *inside* the create branch, which never executes (it's gated by the broken `isLValueSlot`).
  The raw-slot diag does not log `isMirage`. So we don't yet have its mirage flag at runtime.
- **It is attached regardless.** Mirage placeholders are produced by `_forceConformity`
  (`LModelElement.tsx:6291-6295`) via `context.proxyObject.addValue(undefined, id, [], true)`
  → `DValue.new(name=undefined, instanceof=id, values=[], father=<object>, persist=true,
  isMirage=true)` (`:6221`/`:6365`). `father` is the instance and `persist=true`, so the
  mirage `DValue` lands in `idlookup` **and** is linked into the instance's features. An
  instance references its name slot **by feature name** through the `$name` accessor (resolves
  over its `features`/`children`); the fact that `lobj['$name']` resolves to `USER_200` in the
  diag **proves it is attached**, mirage or not. `truechildren` (`:5830`) filters mirages out
  of the "real shape", but they remain present in `children`/`features` and resolvable via `$`.

## 3. Direction B's populate path (the proven sequence)

When the user populates an empty/mirage `name` slot in the UI:
1. **Add** (`Info.tsx:638` `add()`): `SetFieldAction.new(slot.id, 'values', U.initializeValue(type), '+=', false)`
   — the `'+='` append (`reducer.ts:176-183` `isArrayAppend`) creates position 0.
2. **Set** (`Info.tsx:667` `changeDValue` → `value.setValueAtPosition(index, inputValue)`):
   writes `values.0` (`:7482`) **and** clears the mirage: `SetFieldAction.new(c.data,
   'isMirage', false, '', false)` (`:7486`).
3. **No separate attach step.** `setValueAtPosition` operates on `c.data` (the existing slot
   `DValue`, already in `features`); it never re-parents or re-links the slot. Direction B
   relies entirely on the slot already being attached.

So B = **append + set value + clear isMirage**, on the already-attached slot. It runs
top-level (its own UI `TRANSACTION`) on committed state — which is why it succeeds.

## 4. Orphan risk

**None for the create branch as written.** The slot `DValue` is already attached (father +
in features; `$name` resolves it). Appending a value to it does **not** orphan it. The
create branch must **not** attach anything — and must **not** `addValue`/mint a new `DValue`
(that was the original corruption: a *second*, mid-dispatch `DValue` whose `PointedBy` links
couldn't resolve). The current create logic (`'+='` append to `slot.id` + `isMirage=false`,
on the re-resolved existing slot) is structurally the same as B step 1+2 and needs no
attachment.

---

## Recommended create-branch sequence (mirror B exactly)

The create logic is **already correct**; it is gated out by the wrong className string. The
fix is one comparison:

1. **Change the guard `'LValue'` → `'DValue'`** in `LModelElement.tsx:6127`
   (`const isLValueSlot = !!slot && slot.className === 'DValue';`). This single change
   re-enables **both** the overwrite branch and the create branch (both were dead for the
   same reason).
2. With the guard fixed, the existing create body already mirrors Direction B:
   - `SetFieldAction.new(slot.id, 'values', newName, '+=', false)` (append = B step 1, with the real value);
   - `SetFieldAction.new(slot.id, 'isMirage', false, '', false)` (clear mirage = B step 2's `:7486`);
   - on the already-attached, re-resolved slot, post-commit (top-level) — B's success conditions.
   No attach step, no `addValue`.
3. **Separately (dead code, out of this scope):** the same `'LValue'` typo sits in the base
   `LPointerTargetable.set_name`/`get_name` (`classes.ts:2129`, `:2155`). Those are dead for
   instances (LObject overrides), but the strings should be corrected/removed for consistency
   in a dedicated cleanup.

### To confirm at runtime after the guard fix
- Whether `USER_200` was a mirage (`isMirageBefore` will finally log, since the branch will
  run) — decides whether the `isMirage=false` write is doing real work or is a no-op.
- That append + clear populate the slot cleanly post-commit (no `PendingPointedByPaths`, no
  rollback) — expected, since it's B's proven path on committed state.

---

## Caveat

Static + the prior runtime logs. The className conclusion is high-confidence (empirical
`:7447` + `proxy.ts:373` + 31-vs-3 convention). The mirage flag of `USER_200` is the one
fact not yet observed (its log is in the skipped branch) — it does not affect the guard fix
or the recommended sequence.
