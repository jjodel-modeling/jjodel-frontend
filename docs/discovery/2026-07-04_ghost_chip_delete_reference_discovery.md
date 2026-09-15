# Discovery — "Delete reference" context menu on the cross-metamodel ghost-target chip

> Date: 2026-07-04
> Type: feat — Phase 1 discovery (READ-ONLY, no source modified)
> Follows: co-evolution fix (committed in `2d6ade081`; working tree clean at start)
> Status: **HARD STOP after this report** — no implementation without explicit go-ahead.

All line numbers verified against the current working tree (branch `alfonso-frontend-jjtl`).

---

## TL;DR (read this first)

- **Q4 is already satisfied**: `GhostTargetInfo.refId` exists (`types.ts:113`) and is populated
  in the ghost-target loop (`jjomTransformers.ts:143`). **No change to `types.ts` or
  `jjomTransformers.ts` is needed.**
- **Q3**: the existing "Delete reference" is **immediate — no confirmation dialog**. The chip
  must therefore also delete immediately (no Swal/confirm).
- **Q1**: the context menu is a dumb presentational component (`ContextMenu.tsx`); its **items are
  declarative and are built centrally in `EditorV2.tsx` (`getContextMenuItems`)**, driven by a
  single `contextMenu` state. ClassNode already opens it for attribute/operation rows by
  dispatching the `CHILD_CONTEXT_MENU` custom event. The chip can reuse that exact seam.
- **Q2 — the load-bearing finding**: the canonical "Delete reference" path is
  `syncDeleteEdge(edgeId, false)` (`canvasToJjom.ts:330`), reached via `deleteEdge`
  (`EditorV2.tsx:1932`). **It is keyed on an RF edge id**, from which it derives the `refId`.
  **Cross-MM references have NO RF edge** — the edge is suppressed (`jjomTransformers.ts:500`).
  So the chip has a `refId` but no edge id, and **the canonical path cannot be reused literally.**
  A `refId`-keyed entry point does **not** exist today. → **Phase 2 will need to touch two files
  the prompt did not list: `EditorV2.tsx` and (critical-zone) `canvasToJjom.ts`.** This is the
  decision that requires Alfonso's go-ahead (see §Q2 and §Scope-impact).

---

## Q1 — Context-menu infrastructure in editor-v2

**Component**: `frontend/src/components/editor-v2/ContextMenu.tsx` — a **purely presentational**
component. It takes `{ x, y, items: ContextMenuItem[], onClose }` and renders a positioned
`<div className="context-menu">` with one `<button>` per item (`ContextMenu.tsx:24-58`).
`ContextMenuItem` = `{ label?, icon?, danger?, disabled?, tooltip?, onClick?, divider? }`
(`ContextMenu.tsx:3-11`). It holds no logic and no per-node keying — **the items decide everything.**

**How it opens (state + positioning)**: a single **local** state in `EditorV2.tsx`
(`const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)`, `:502`).
`ContextMenuState` (local, **not exported**, `:225-234`):
```
interface ContextMenuState { x; y; nodeId?; edgeId?; childId?; childKind?: 'attr'|'op';
                             isMultiSelect?; selectedCount?; }
```
It is rendered once via `createPortal` at `EditorV2.tsx:3426-3432`, positioned at `contextMenu.x/y`
(client coords), with `items={getContextMenuItems()}`.

**Openers** — all call `setContextMenu(...)`:
- `onNodeContextMenu` (`:2175`) — RF's node right-click → `{ nodeId, isMultiSelect, selectedCount }`.
- `onEdgeContextMenu` (`:2190`) — RF's edge right-click → `{ edgeId }`.
- pane context menu handler around `:2241`.
- **`CHILD_CONTEXT_MENU` listener (`:2238-2251`)** — a `useEffect` that listens for
  `window`'s `JjodelEvents.CHILD_CONTEXT_MENU` and sets
  `{ x, y, nodeId, childId, childKind }`. **This is the seam for in-node elements.**

**Is it reusable from inside `ClassNode` for an internal element?** **Yes — and there is already a
precedent.** The attribute and operation rows inside ClassNode open the menu **without any RF
node keying** by dispatching the child-menu event:
```
// ClassNode.tsx:735-741 (attribute row) and :812-818 (operation row)
onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent(JjodelEvents.CHILD_CONTEXT_MENU, {
        detail: { childId: attr.id, childKind: 'attr', nodeId: id, x: e.clientX, y: e.clientY }
    }));
}}
```
`getContextMenuItems` then branches on `contextMenu?.nodeId && contextMenu.childId`
(`EditorV2.tsx:2343-2385`) and builds a `Delete Attribute`/`Delete Operation` item that calls
`syncRemoveAttribute` / `syncRemoveOperation`. **The chip can follow this exact pattern** with a new
`childKind: 'ref'` (see Q2 for the delete action it must call). `CHILD_CONTEXT_MENU` is registered:
`registry.ts:28 → 'jjodel:child-context-menu'`.

---

## Q2 — Canonical delete-reference M2 path (the critical finding)

There is **no `syncRemoveReference`** in `canvasToJjom.ts` (grep confirms only
`syncRemoveAttribute`/`syncRemoveOperation`/`syncRemoveEnumLiteral`). The reference-delete
cascade lives inside **`syncDeleteEdge(edgeId, isInheritance)` — `canvasToJjom.ts:330-421`**, the
`else` (reference) branch (`:351-416`).

**Signature / ids required**: `syncDeleteEdge(edgeId: string, isInheritance: boolean)`. It needs an
**RF edge id** (a persisted `DVoidEdge` pointer). From it, it:
1. `edgeProxy = LPointerTargetable.fromPointer(edgeId)` (`:332`);
2. derives the canonical DReference pointer `refId = lookup[edgeId]?.model ?? …` (`:358`);
3. enumerates every persisted edge whose `model === refId` (the clicked M2 edge + M1 instance
   edges) and the M1 `(src,tgt)` pairs to unguard (`:363-373`);
4. **cascade-deletes the DReference via `LPointerTargetable.fromPointer(refId).delete()`**
   (`:380-385`) — its own async TRANSACTION, no outer wrapper;
5. deferred (`setTimeout 0`) removal of the enumerated stale edges + `clearCanvasEdgePair`
   (`:392-402`);
6. **structural M1 sweep** `setTimeout(() => sweepAllM1ReferenceGraphs(), 60)` (`:415`).

**Callers**: (a) `deleteEdge` (`EditorV2.tsx:1932-1943`) → used by the **edge context menu**
"Delete reference" item (`EditorV2.tsx:2643-2646`, `onClick: () => deleteEdge(contextMenu.edgeId!)`)
and by keyboard delete (`deleteSelected`); no PropertiesPanel caller (the panel's reference delete
is a separate classic path and is out of scope here).

**Does it pass through the co-evolution cascade?** **Yes.** `lRef.delete()` drives
`Dummy.get_delete`, whose fixed `case 'model'` deletes Edge dependents and whose `case 'instanceof'`
cleans M1 slots; plus the explicit stale-edge cleanup (5) and `sweepAllM1ReferenceGraphs()` (6) —
i.e. exactly the path the co-evolution fix hardened. `syncRemoveAttribute` (`:551-571`) is the
structural analogue (`captureAttributeOrphanValues` + `lAttr.delete()`), but attributes are simpler:
they have no edge, so their delete is trivially `refId`-shaped. References are not.

### ⚠ The blocker: the chip has a `refId` but no edge id

Cross-MM reference edges are **suppressed** — `jjomEdgeToRFEdge` returns `null` when
`refModel.type.model.id !== sourceModel.model.id` (`jjomTransformers.ts:491-501`, the
`return null` at `:500`; the ClassNode comment at `:128` and `:537-542` restate this). So the
ghost-target reference **has no RF edge**, hence **no `edgeId` to pass to `syncDeleteEdge`.**

`syncDeleteEdge`'s whole reference branch is internally keyed on `refId` (it only *derives* `refId`
from the edge in steps 1-2). The chip already holds the canonical `refId` directly (`gt.refId`).
**But there is no exported function today that runs this cascade from a bare `refId`.** Therefore
"reuse the canonical path *tal quale*" is **not literally possible** without one of:

- **R1 (recommended) — extract a shared `refId`-keyed function.** In `canvasToJjom.ts`, split the
  body of the `else` branch (from `:363` `const staleEdgeIds` onward, parameterised on `refId`) into
  `export function syncDeleteReferenceById(refId: string)`, and have `syncDeleteEdge` call it after
  deriving `refId` (steps 1-2 stay). Both the edge menu and the chip menu then call the **same**
  function → true single source of truth, satisfies "senza logica di delete propria". **Cost**:
  modifies a §3.1 critical-zone file (`canvasToJjom.ts`) and refactors `syncDeleteEdge` →
  **requires a Layer Impact Report** and careful review of the TRANSACTION/timing invariants
  (§3.3, the `setTimeout 0` / `+60ms` sequencing, `.delete()`'s own async TRANSACTION).
- **R2 — thin duplicate.** New `syncDeleteReferenceById(refId)` that re-implements the minimal
  cascade (`fromPointer(refId).delete()` + deferred stale-edge cleanup + sweep). Also touches
  `canvasToJjom.ts`, and **duplicates** the just-hardened cascade (drift risk vs the edge path).
  Not recommended.

Either way, **Phase 2 must touch `canvasToJjom.ts` (critical zone) and `EditorV2.tsx`** (a new
`ref` case in `getContextMenuItems` + a handler + widening `ContextMenuState.childKind`). This is
**broader than the file set the prompt anticipated** (which expected only `ClassNode.tsx` and,
conditionally, the menu component / `types.ts` / `jjomTransformers.ts`). Surfacing this is the
purpose of the HARD STOP — see §Scope-impact and the go-ahead options.

---

## Q3 — Confirmation dialog?

**None.** Grep for `Swal` / `sweetalert` / `window.confirm` / `confirm(` across
`components/editor-v2/` returns nothing. The edge "Delete reference" item calls `deleteEdge`
directly (`EditorV2.tsx:2646`); `deleteEdge` only `takeSnapshot()`s (undo) and syncs — no prompt.
The attribute/operation delete items are likewise immediate.

**⇒ The chip's "Delete reference" must delete immediately, no confirmation** (matching the existing
behavior, per the prompt's requirement 2). Undo remains available via the standard snapshot/undo
already taken by the delete path (the edge path calls `takeSnapshot()` in `deleteEdge`; the Phase-2
handler should mirror that so the chip delete is undoable too).

---

## Q4 — `GhostTargetInfo` shape / `refId`

**`refId` is present and populated — no work needed here.**
- `types.ts:107-115`: `GhostTargetInfo { refName; targetName; targetMetamodel; cardinality;
  targetFullname; refId?: string; offset?; }` — **`refId?: string` at `:113`.**
- Populated in the ghost-target loop `classVertexToRFNode`: `jjomTransformers.ts:137-145`,
  `refId: ref.id` at `:143` (cross-MM discriminator `t.model.id !== lClass.model.id` at `:134`).
- Consumed in ClassNode: select-on-click `gt.refId` (`ClassNode.tsx:669-670`), selected-state class
  (`:679`), and offset persistence name↔id bridge (`:95`).

**⇒ `types.ts` and `jjomTransformers.ts` are NOT touched in Phase 2** (the prompt's conditional
does not trigger).

---

## Q5 — Event collisions on the chip (what happens on right-click today)

The chip's DOM (ClassNode.tsx):
- `.ghost-target-stub__draggable` wrapper (`:653-671`): `onPointerDown={(e)=>e.stopPropagation()}`
  (`:659`) and `onClick` → select the reference via `selectChildElement(gt.refId)` with a
  click-vs-drag guard `ghostMovedRef` (`:660-671`).
- `.ghost-target-stub__chip` inner box (`:674-688`): `onPointerDown={onGhostPointerDown}` (drag G1
  start, `:681`), `onPointerMove`/`onPointerUp` (`:682-683`), `onDoubleClick={onGhostReset}`
  (offset reset, `:684`).
- **Neither element has an `onContextMenu` handler today.**

**What a right-click does now** (no `onContextMenu` anywhere on the chip):
1. `pointerdown` (any button, incl. right) fires `onGhostPointerDown` (`:101-107`) → sets pointer
   capture + a drag ref, and `e.stopPropagation()` stops the press reaching RF (so the node is not
   selected/panned). `pointerup` fires `onGhostPointerUp` (`:120-132`); with no movement it re-writes
   the **same** offset map (idempotent `SetFieldAction`, harmless).
2. The browser then fires a separate **`contextmenu`** event. Nothing on the chip stops it, so it
   **bubbles to the ReactFlow node wrapper → `onNodeContextMenu` (`EditorV2.tsx:2175`)**, which
   `preventDefault()`s and opens the **parent Class node's** context menu at the cursor.

**⇒ Today, right-clicking the chip opens the wrong menu (the parent class's).** To fix it and show
the chip's own menu, add an `onContextMenu` on the chip that:
- `e.preventDefault()` — suppress the native browser menu;
- `e.stopPropagation()` — stop the bubble to `onNodeContextMenu` (otherwise the class menu still
  opens underneath/over it);
- dispatch `CHILD_CONTEXT_MENU` with `{ childId: gt.refId, childKind: 'ref', nodeId: id, x, y }`
  (mirrors the attribute row at `:735-741`).

**Placement recommendation**: put `onContextMenu` on **`.ghost-target-stub__chip`** (`:674`), where
the other chip gestures (drag, double-click) already live, so all chip interactions are colocated
and the target matches the prompt wording ("right-click *sul chip*"). (Alternative: the
`.ghost-target-stub__draggable` wrapper — a larger hit area incl. the label — but that widens the
target beyond "the chip"; not recommended unless Alfonso prefers it.)

**Minor pre-existing side-effect (not required to fix, flagged for honesty)**: right-click still
triggers the pointer-down/up drag pair (idempotent offset re-write). A clean guard would be
`if (e.button !== 0) return;` at the top of `onGhostPointerDown` — but that **modifies an existing
drag handler**, which the prompt says to leave untouched. Recommend leaving it; the new
`onContextMenu` fully solves the menu. If Alfonso wants the pointer side-effect gone too, that guard
is a separate, explicitly-approved one-line change.

**Interference with double-click reset & drag (requirement 3)**: none. `contextmenu` (right button)
and `dblclick`/left-drag are distinct event types on distinct buttons; adding an `onContextMenu` that
`stopPropagation()`s does not touch the pointer/dblclick handlers. Left-click select and left-drag
reposition continue to work through their existing handlers.

---

## Q6 — Naming (collision check)

New identifiers required are **minimal**; grep across `frontend/src/` shows no collisions:
- Menu label `'Delete reference'` — a **display string**, already used by the edge menu
  (`EditorV2.tsx:2643`). Reusing the same label is intentional and correct (not an identifier).
- `childKind: 'ref'` — new union member on the **local, non-exported** `ContextMenuState`
  (`EditorV2.tsx:225`, currently `'attr'|'op'`). No existing `childKind === 'ref'` /
  `childKind: 'ref'` anywhere (grep clean). Widening a local union is low-risk (§4.2 targets
  *exported* interfaces; this one is not exported).
- `onGhostContextMenu` — **not needed**; the handler is inline on the JSX element (matches the
  attr/op inline pattern). Grep for `onGhostContextMenu` is clean regardless.
- `CHILD_CONTEXT_MENU` — reused (registry `:28`); **no new event** to register.
- **No new SCSS class** — the menu reuses `.context-menu` / `.context-menu__item` from
  `ContextMenu.tsx`.

---

## Scope-impact — files Phase 2 will actually touch (vs the prompt's anticipated set)

| File | Prompt anticipated? | Change | Critical zone? |
|------|---------------------|--------|----------------|
| `nodes/ClassNode.tsx` | ✅ yes | add `onContextMenu` on `.ghost-target-stub__chip` (preventDefault + stopPropagation + dispatch `CHILD_CONTEXT_MENU` with `childKind:'ref'`) | no |
| `EditorV2.tsx` | ❌ **not listed** | (a) widen `ContextMenuState.childKind` to `'attr'|'op'|'ref'`; (b) add a `ref` branch in `getContextMenuItems` that builds a single "Delete reference" item; (c) a handler that deletes by `refId` + `takeSnapshot()` | no |
| `sync/canvasToJjom.ts` | ❌ **not listed** | add `syncDeleteReferenceById(refId)` (R1: extract shared cascade from `syncDeleteEdge`; R2: thin duplicate) | **YES (§3.1)** — needs a Layer Impact Report |
| `types.ts` | conditional | **none** — `refId` already present | — |
| `utils/jjomTransformers.ts` | conditional | **none** — `refId` already populated | — |
| `ContextMenu.tsx` | maybe | **none** — dumb component; items are declarative in EditorV2 | — |

**Why the extra two files are unavoidable**: the ghost chip's reference has no RF edge (Q2/§Q5), so
the only reuse of the hardened cascade is a `refId`-keyed entry point, which today does not exist and
must be added in `canvasToJjom.ts`; and the menu items are computed centrally in `EditorV2.tsx`
(`getContextMenuItems`), not in the dumb `ContextMenu.tsx`, so the new item must be declared there.

Per CLAUDE.md §1 (propagation to a layer not mentioned in the prompt → pause and report) and §3.2
(a `canvasToJjom.ts` touch mandates a Layer Impact Report), **this is a HARD STOP**. Phase 2 needs
Alfonso's go-ahead on:

1. **Approve touching `EditorV2.tsx` + `canvasToJjom.ts`** (beyond the prompt's file list).
2. **R1 vs R2** for the `refId`-keyed delete (recommend **R1**: extract shared function, single
   source of truth, no cascade duplication).
3. **Chip vs draggable-wrapper** as the `onContextMenu` target (recommend **chip**, per spec).
4. Whether to also add the `e.button !== 0` guard in `onGhostPointerDown` (recommend **no** — leave
   the drag handler untouched; the pre-existing idempotent offset re-write is harmless).

No source was modified in this phase. Awaiting go-ahead.
