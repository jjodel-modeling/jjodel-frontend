# Discovery (READ-ONLY) — the real instance-rename write path
**Date**: 2026-06-18
**Branch**: alfonso-frontend-jjtl
**Mode**: read-only static trace. No edits outside this document; `set_name` left as-is.
**Goal**: find where an M1 instance rename actually writes `DObject.name`, to pick the
correct Direction-A injection point.

> **Note on the "accepted fact".** The brief says "do not re-litigate: `set_name` is not
> invoked by the box-title rename," based on a temp log that didn't fire. The static
> trace below shows the box-title rename **does** reach `set_name` — but the **`LObject`
> override** (`LModelElement.tsx:6060`), **not** the base `LPointerTargetable.set_name`
> (`classes.ts:2136`). `LObject` reimplements `set_name` **without `super`**, so a log or
> fix placed in the *base* never runs for instances. The accepted fact is therefore true
> *as stated about the base* (the first attempt's file) and is fully consistent with this
> trace — it just needs the base-vs-override distinction. This is not re-litigation; it
> identifies which of the two `set_name`s is live. See §Convergence + §Recommendation.

---

## Entry point 1 — v2-flow box title (double-click)

Chain, link by link:

1. `ObjectNode.tsx:188` `handleDoubleClick` → `setEditing(true)`.
2. Commit on blur/Enter: `ObjectNode.tsx:206` `handleBlur` → `commitName`; `:210-219`
   `handleKeyDown` (Enter) → `commitName`.
3. `ObjectNode.tsx:192-204` `commitName`:
   - `:199` updates the **ReactFlow local** node `data.label` (visual only — NOT `DObject.name`);
   - `:202` `syncNodeLabel(id, name)` — `id` = the ReactFlow node id = the **DVertex** id.
4. `canvasToJjom.ts:355-366` `syncNodeLabel(vertexId, newName)`:
   - `:358` `vertexProxy = LPointerTargetable.fromPointer(vertexId)` → the **LVertex**;
   - `:359` `model = vertexProxy?.model` → `LVertex.get_model` (`GraphDataElements.tsx:880-884`)
     = `LPointerTargetable.from(data.model)`; for an object vertex `data.model` is the
     **DObject** (see `useJjomSync.ts:480` "vertex.model → DObject"), so `model` = the **LObject**;
   - `:361` `model.name = newName` → proxy SET trap → **`set_name`**.
5. Because `model` is an **LObject**, the trap resolves to **`LObject.set_name`**
   (`LModelElement.tsx:6060`), which writes `DObject.name` via `SetFieldAction.new(c.data,
   'name', name, '', false)` (currently `:6091`). There is **no** `LVertex.set_name`
   override (`GraphDataElements.tsx` has none), so it is not intercepted at the vertex level.

**Write site:** `LObject.set_name` (`LModelElement.tsx:6060`) → direct `SetFieldAction` on
`'name'`. **The base `classes.ts:2136` is never reached.**

---

## Entry point 2 — v2-flow M1 Properties panel (name field)

1. `M1PropertiesPanel.tsx:63` name input `onBlur={commitName}`.
2. `M1PropertiesPanel.tsx:31-36` `commitName`: `:33` `onNodeChange(..., {label})` (local),
   `:34` `syncNodeLabel(selectedNode.id, name)`.
3. → same `syncNodeLabel` chain as Entry point 1 → **`LObject.set_name`**.

**Write site:** identical to Entry point 1 — funnels through `syncNodeLabel` → `LObject.set_name`.

---

## Entry point 3 — classic editor box title

Template `CLASSIC_OBJECT_VIEW_JSX` (`utils/defaultViewTemplate.ts:158-160`):

```jsx
{data.$name ?
    <Input data={data.$name} field={'value'} … /> :   // slot path
    <Input data={data}       field={'name'}  … /> }    // name path
```

Two sub-cases:
- **`$name` exists** → `<Input data={data.$name} field='value'>` → on commit
  `data.$name['value'] = newValue` → `LValue.set_value` → `LValue.setValueAtPosition`
  (`LModelElement.tsx:7396`) → writes the **slot**, and `DObject.name` follows via the
  **Direction-B** direct write at `:7493`. **`set_name` is NOT involved** here, and slot+name
  stay in sync because the slot is the source.
- **`$name` absent** → `<Input data={data} field='name'>` → `data['name'] = newValue` →
  proxy SET trap → **`LObject.set_name`** (write site = `:6060`, same as Entry point 1).

**Write site:** slot-first via `setValueAtPosition` when a slot exists (name follows at
`:7493`); otherwise `LObject.set_name`.

---

## Entry point 4 — classic editor Properties panel (Info.tsx)

1. `Info.tsx:310-316` `builder.named` → `<Input data={data} field={'name'}>`.
2. On commit `data['name'] = serializeValue(value)` → proxy SET trap → **`LObject.set_name`**
   (`:6060`).

**Write site:** `LObject.set_name`.

---

## Entry point 5 — sidebar / model-tree

`TreeViewContent.tsx` exposes `submitRenameView` / `handleRenameKeyDown` (`:867`, `:1279`)
— these rename **`LViewElement`** only (`lView.name = …`). No M1-instance rename path exists
in the tree. **Not a Direction-A write site.** (Matches `2026-06-17_name_slot_sync.md` §6.)

---

## Entry point 6 — tab rename

Tab rename targets **`LModel`** (`LModel.set_name`, `LModelElement.tsx:5360`, also updates the
DOM tab title). There is no per-instance (DObject) tab, so no instance rename here.
**Not a Direction-A write site.**

---

## Convergence

**Q1 — single shared write site, or scattered?**
For instance renames that write `DObject.name` directly, there is a **single L-layer
convergence point: `LObject.set_name` (`LModelElement.tsx:6060`).** Entry points 1, 2, 4 and
the `$name`-absent branch of 3 all funnel into it (via `syncNodeLabel → model.name`, or
`Input → data.name`). The **only** path that does not is Entry point 3 **with an existing
slot**, which edits the slot via `setValueAtPosition` and lets `DObject.name` follow through
the Direction-B write at `:7493` — that path already keeps slot and name in sync, so
Direction A is moot there.

The full set of `SetFieldAction`-on-`'name'` sites (from grep), classified:
- `LModelElement.tsx:6091` — `LObject.set_name` (← **the instance convergence point**).
- `LModelElement.tsx:7493` — Direction-B reverse (slot→name). **Excluded** (must stay).
- `classes.ts:2158` — base `LPointerTargetable.set_name` (**dead for instances**; overridden).
- `classes.ts:2825` / `:3232` — `LUser` / `LProject.set_name` (not instances).
- `LModelElement.tsx:5370` — `LModel.set_name` (models, not instances).
- `jjscript/.../rename.ts:98`, `instance.ts:400` — JjScript commands (programmatic, not UI).

**Q2 — existing shared rename helper?**
Yes, partially: **`syncNodeLabel` (`canvasToJjom.ts:355`)** is the shared helper for **both
v2-flow entry points** (box title + M1 Properties panel); it routes to `LObject.set_name`.
There is no single helper spanning classic + v2, but **all UI rename paths converge on
`LObject.set_name`** at the L-layer (the classic-slot path being the one intentional
exception that doesn't need Direction A).

---

## Recommendation — single best injection point

**`LObject.set_name` (`LModelElement.tsx:6060`).** It is the convergence point for every
instance-rename path that writes `DObject.name` directly (v2-flow box title, v2-flow M1
Properties, classic Properties, classic box title without a slot). The classic-box-title
path *with* a slot does not need it (it edits the slot directly; name follows via `:7493`).

This is exactly where the **current uncommitted fix already sits**. The previous attempt's
failure is explained by the **base-vs-override** distinction, not a wrong layer: a fix/log in
`LPointerTargetable.set_name` (`classes.ts:2136`) is dead code for instances because
`LObject` overrides `set_name` without `super`.

**Decisive empirical test (recommended next, before any further code move):** put a temp log
**inside `LObject.set_name` (`LModelElement.tsx:6060`)** — not the base — and rename from the
box title. The static trace predicts it **will** fire. If it fires, the injection point is
confirmed correct and any remaining "slot doesn't follow" symptom is **downstream** of
`set_name` (candidates: the `addValue` slot-create nested in `set_name`'s TRANSACTION, or the
v2-flow display not re-reading the slot after the write), to be investigated separately. If it
does **not** fire, only then is there a genuinely different path to hunt — re-examine whether
`syncNodeLabel`'s `model` resolves (`vertexProxy.model` non-null) at runtime.

---

## Caveat

This is a **static** trace (read-only; the app was not run). The chain
`commitName → syncNodeLabel → model.name = X → LObject.set_name` is solid by code reading,
but the single point that only runtime can confirm is whether `vertexProxy.model` is non-null
for the renamed vertex at commit time (if it were null, `syncNodeLabel`'s `if (model)` guard
would skip the write and only the ReactFlow `data.label` would change — a visual-only rename).
The recommended temp-log-in-`LObject.set_name` test settles this in one rename.
