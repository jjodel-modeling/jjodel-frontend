# Discovery — `ghost-target-stub`: the real click target for M2 cross-MM references

**Branch**: `alfonso-frontend-jjtl`
**Mode**: READ-ONLY. No edits to source, no build, no commit. (Only this report written.)
**Date**: 2026-06-21
**Supersedes the target of**: `docs/discovery/2026-06-21_crossref_edge_hittarget.md` /
`_crossref_edge_selection.md` (those investigated the RF reference *edge*; the user's actual
click target in the failing view is a node-internal **stub**, not an edge).

---

## TL;DR

- The visible "cross-reference" (`refName cardinality` label over a dashed `targetName /
  metamodel` chip) is **not** an edge. It is an in-node overlay rendered by `ClassNode.tsx`
  for **cross-metamodel** references only (`ghostTargets`). There is **no** RF edge and **no**
  `DVoidEdge` behind it — the self-loop edge is suppressed at the transformer
  (`jjomTransformers.ts:128`).
- The stub carries the `DReference` id directly: `gt.refId = ref.id`
  (`jjomTransformers.ts:143`). That id is exactly what the panel needs as
  `_lastSelected.modelElement` to render the reference editor.
- Current click behavior: the `__label` inherits `pointer-events:none`, the click falls through
  to the `.mm-node.mm-class` body → RF `onNodeClick` → `selectElement(classId)` → **parent class
  selected** (the bug). The `__chip` is `pointer-events:auto` but is only a drag handle (no
  `onClick`); a click on it also bubbles to `onNodeClick` → same parent-class selection.
- **The `selectEdge(edgeId)` seam from the prior fix is NOT reusable here** — the stub maps to a
  *model element* (`DReference`), not a *graph element*; `selectEdge → onEdgeClick →
  selectElement(refId)` would read `LReference.model` and land the **model**, not the reference.
- **Recommended routing**: reuse the existing **`selectChildElement(gt.refId)`** seam — the exact
  path attributes/operations already use (`ClassNode.tsx:330-332`). It sets
  `_lastSelected.modelElement = refId` after the node click (via `requestAnimationFrame`,
  `EditorV2.tsx:3172`), keeps the highlight/assign guard centralized in `onNodeClick`, needs **no
  new context seam**, and touches only safe-zone files.

---

## 1. Component & JSX

**Renderer**: `frontend/src/components/editor-v2/nodes/ClassNode.tsx` — there is **no** dedicated
`GhostTargetStub` component; the stub is rendered inline inside `ClassNode`, gated on
`ghostTargets.length > 0`.

- Data source: `const ghostTargets = data.ghostTargets ?? []` (`ClassNode.tsx:41`).
- Stub block: `ClassNode.tsx:530-665`. DOM nesting (matches the runtime ancestry in the prompt):

```
.ghost-target-stub                       ClassNode.tsx:531   (outer wrapper, one per node)
  └ .ghost-target-stub__item             ClassNode.tsx:612   (one per reference, .map key)
      ├ svg.ghost-target-stub__connector ClassNode.tsx:623   (the drawn line + arrowhead/diamond)
      └ .ghost-target-stub__draggable.nodrag  ClassNode.tsx:641   (label+chip move together)
          ├ span.ghost-target-stub__label     ClassNode.tsx:644   "{refName} {cardinality}"
          └ .ghost-target-stub__chip          ClassNode.tsx:650   dashed box (drag handle)
              ├ span.ghost-target-stub__name  ClassNode.tsx:657   targetName
              └ span.ghost-target-stub__mm    ClassNode.tsx:658   targetMetamodel
```

This exactly matches the prompt's confirmed runtime ancestry
(`__label → __draggable.nodrag → __item → .ghost-target-stub → .mm-node.mm-class`). The
`.mm-node.mm-class` root is `ClassNode.tsx:460-466` (`ref={rootRef}`).

**Prop shape** — `GhostTargetInfo` (`frontend/src/components/editor-v2/types.ts:107-114`):

```ts
export interface GhostTargetInfo {
    refName: string;          // :108
    targetName: string;       // :109
    targetMetamodel: string;  // :110
    cardinality: string;      // :111  e.g. "0..*"
    targetFullname?: string;  // (title tooltip)
    refId?: string;           // :113  ← the DReference id (key for selection)
    offset?: {dx,dy};         // in-session drag offset (persisted as ghostOffsets by refId)
}
```
Carried on the node as `data.ghostTargets?: GhostTargetInfo[]` (`types.ts:127`).

---

## 2. Stub → `DReference` mapping  (the crux)

The stub holds the reference id directly. Construction in
`frontend/src/components/editor-v2/utils/jjomTransformers.ts:131-148`:

```ts
for (const ref of (lClass?.references ?? [])) {        // :132  ref = LReference proxy
    const t = ref?.type;
    if (t?.model && t.model.id !== lClass.model.id) {  // :134  cross-MM only
        ghostTargets.push({
            refName: ref.name ?? '',                   // :138
            ...
            refId: ref.id,                             // :143  ← DReference id
            offset: ghostOffsetsRaw?.[ref.id],         // :144
        });
    }
}
```

- `gt.refId` is the **M2 `DReference` id** (`ref.id` of an `LReference` on the metaclass). It is a
  *model element* id — exactly the type `_lastSelected.modelElement` expects.
- **No 1:1 RF edge / `DVoidEdge`.** Ghost targets exist *only* for cross-metamodel references
  (`t.model.id !== lClass.model.id`, `:134`). For those, the comment at `jjomTransformers.ts:126-128`
  states there is **no real edge** — "the leftover self-loop edge is suppressed in
  `jjomEdgeToRFEdge`" (suppression logic referenced at `jjomTransformers.ts:491-494`). The line you
  see is drawn **inside the stub's own SVG** (`ClassNode.tsx:618-637`), not by the edge layer.
- Therefore **there is no RF edge id reachable from a stub.** The only identifier on the stub is
  `gt.refId` (a `DReference`/model-element id). This is the decisive fact for §4.

Confirmation that `refId` is the right panel key: it is the same kind of id that the tree-view
`StructuralFeatureRow` writes for a reference feature (`TreeViewContent.tsx:489-493`,
`modelElement: feature.id`) and that the "Add reference" context-menu action writes
(`EditorV2.tsx:2469`, `modelElement: refId`) — both already make the panel show the reference.

---

## 3. Current interaction & pointer-events (per layer)

SCSS: `frontend/src/components/editor-v2/EditorV2.scss:1421-1514`.

| Layer | `pointer-events` | Handlers (JSX) |
|---|---|---|
| `.ghost-target-stub` (wrapper) | **none** (`EditorV2.scss:1431`) | none |
| `.ghost-target-stub__item` | inherits none (no override) | none |
| `svg.ghost-target-stub__connector` | **none** (`:1483`) | none (`aria-hidden`) |
| `.ghost-target-stub__draggable` | **none** (`:1457`) | none (only inline `transform`, `ClassNode.tsx:642`) |
| `span.ghost-target-stub__label` | inherits **none** (no override) | **none** |
| `.ghost-target-stub__chip` | **auto** (`:1495`), `cursor:grab` (`:1496`) | `onPointerDown` / `onPointerMove` / `onPointerUp` / `onDoubleClick` (`ClassNode.tsx:652-655`) — **no `onClick`** |

**Drag gesture (must preserve)** — the chip is a per-chip *reposition* handle (declutter),
**not** a create/re-target gesture, and the offset is in-session local state (not a D-write of the
reference itself):
- `onGhostPointerDown` (`ClassNode.tsx:91-96`): `e.stopPropagation()` (so the press does **not**
  start a node drag / pan), `setPointerCapture`, seed `ghostDragRef`.
- `onGhostPointerMove` (`:98-105`): updates `ghostOffsets[refName]` (screen→flow px via zoom).
- `onGhostPointerUp` (`:107-119`): commits the offset + `persistGhostOffsets` (a `SetFieldAction`
  on the *vertex* `ghostOffsets` map keyed by `refId`, `:82-89` — **not** a write to the reference).
- `onDoubleClick → onGhostReset` (`:122-128`): clears the offset back to anchored.
- `.nodrag` (class on `__draggable`, `ClassNode.tsx:641`) tells ReactFlow not to pan/drag the node
  from that subtree.

**Which ancestor currently catches the click and selects the class.** The stub layers above are
all `pointer-events:none` except the chip. So:
- Click on the **label / connector / gaps** → falls through (pe:none) to the `.mm-node.mm-class`
  body (`ClassNode.tsx:460`), whose click is delegated to ReactFlow's **`onNodeClick`**
  (`useJjomSelection.ts:217-224`) → `selectElement(node.id, modelid)` (`useJjomSelection.ts:96`,
  sets `_lastSelected.modelElement = lElement.model.id` = the **DClass**). → **parent class
  selected.** This is the reported bug.
- Click on the **chip**: `onPointerDown` stops the *pointerdown* (no node-drag) but the separate
  `click` event still bubbles to `onNodeClick` → same `selectElement(classId)`. (The chip has no
  `onClick` of its own, so a no-move click does nothing but bubble.)

So the `stopPropagation` target for the fix is the **`click` event on the stub**, to keep it from
reaching `onNodeClick` *if* we want to suppress the parent-class selection (see §4 trade-off).

The highlight/assign guard lives at `useJjomSelection.ts:222` inside `onNodeClick`
(`if (highlightActive && onAssign) { onAssign(node.id); return; }`) — i.e. it is reached via the
same bubbling path.

---

## 4. Selection-routing options for "select this `DReference`"

Goal: land `_lastSelected.modelElement = gt.refId` (a `DReference` id) so the existing panel
renders the reference (`editors/Info.tsx` imports `DReference` at `:3` and dispatches the
reference editor off `_lastSelected.modelElement`; reached through `PropertiesWithTreeView.tsx:212`).

**(a) `selectChildElement(gt.refId)` — RECOMMENDED.** Defined `EditorV2.tsx:3172-3182`, exposed on
the context (`EditorContext.tsx:12`), already consumed by `ClassNode` for attrs/ops
(`ClassNode.tsx:330-332`). It does:
```ts
requestAnimationFrame(() => {
    const currentNode = store.getState()._lastSelected?.node ?? '';
    SetRootFieldAction.new('_lastSelected', { node: currentNode, view: '', modelElement: childId });
});
```
→ sets **only** `modelElement` (panel-only), preserving whatever graph `node` selection exists, and
the `rAF` deliberately runs **after** `onNodeClick`'s `selectElement` (`EditorV2.tsx:3170-3171`
comment). So a click that bubbles to `onNodeClick` (selects the class node + sets
`modelElement=classId`) is then overwritten to `modelElement=refId`. Identical mechanics to an
attribute click. **No new seam, no critical-zone write, highlight guard stays centralized in
`onNodeClick`.**

**(b) Tree-view direct write** — `StructuralFeatureRow.handleClick` (`TreeViewContent.tsx:487-494`):
`e.stopPropagation(); SetRootFieldAction.new('_lastSelected', {node:'', view:'', modelElement:
feature.id}, '', false)`. Reusable in spirit, but would require either inlining
`SetRootFieldAction` into `ClassNode` (it currently imports only `SetFieldAction`/`TRANSACTION`
from `joiner`, `ClassNode.tsx:18`) or a new seam. With `stopPropagation` it suppresses the
parent-class graph ring **but bypasses the highlight/assign guard** for the stub (click never
reaches `onNodeClick`). More invasive than (a) and weaker on the "keep the guard intact" criterion.

**(c) `selectEdge(edgeId)` seam (the prior fix)** — `EditorContext.tsx:14`, impl `EditorV2.tsx:2223`.
**NOT reusable here.** It routes through `jjomSelection.onEdgeClick → selectElement(edgeId)`
(`EditorV2.tsx:2227-2230`), which treats the argument as a **graph element** and sets
`modelElement = LPointerTargetable.fromPointer(edgeId).model.id` (`useJjomSelection.ts:124-129`).
For `gt.refId` (an `LReference`), `.model` resolves to the **containing model**, not the reference
→ wrong `modelElement`. And the stub has no RF edge id anyway (§2). Do not use.

**(d) New `selectReference?(refId)` context seam** — feasible (thin wrapper around the tree
pattern in `EditorV2.tsx` safe zone), but **unnecessary**: (a) already lands `modelElement = refId`
with zero new surface. Only add (d) if Alfonso wants the parent-class graph ring suppressed
*and* a reusable named seam.

**Recommendation: (a).** Least-invasive, consistent with the in-canvas attribute/operation
selection already shipping, keeps the highlight/assign-mode guard intact (it stays in
`onNodeClick`), and requires no context-interface or critical-zone change.

> Decision point for the fix prompt: (a) leaves the parent class with its `.selected` ring (the
> panel correctly shows the reference). If Alfonso wants **no** parent-class ring, add
> `e.stopPropagation()` on the stub click and switch to a direct `_lastSelected` write (option b/d),
> at the cost of bypassing the highlight guard for the stub. The reported symptom is "the *panel*
> shows the parent class", which (a) fixes; the ring is cosmetic and already accepted for attrs.

---

## 5. Fate of the prior (uncommitted) edge changes

Working tree (uncommitted, `git status`): `UnifiedEdge.tsx`, `EditorContext.tsx`, `EditorV2.tsx`,
`EditorV2.scss` all `M` (the prior session's edge fix per the 2026-06-21 log entry).

- `.edge-label__text` **is a real, user-facing label** — but for **same-metamodel** reference
  edges, which *do* render as real `UnifiedEdge` RF edges with a `pointer-events:all` label (per
  the 2026-06-21 log entry; `UnifiedEdge.tsx`). It is **not** the cross-MM ghost stub's label
  (that is `.ghost-target-stub__label`, §1). So the prior `onClick`/`cursor:pointer` change is
  **harmless and useful** for the same-MM case — it is simply **orthogonal** to this bug, not a
  failed attempt at the same target.
- **Keep** the `selectEdge` seam (`EditorContext.tsx:14`, `EditorV2.tsx:2223`): it is the correct
  routing for **real reference edges** (same-MM), which *are* graph elements. It is **not**
  reusable for the ghost stub (§4c), but that is not a reason to revert it.
- Net: the prior changes fix selection of **same-MM** reference edges; this task fixes **cross-MM**
  ghost stubs. Both are needed and non-overlapping. **Do not revert the prior changes.**

> Caveat: I did not runtime-verify that the same-MM reference edge selection actually works
> end-to-end (read-only task). The claim that `.edge-label__text` renders for same-MM refs rests on
> the 2026-06-21 log entry + `UnifiedEdge.tsx`; reconfirm in the app if it matters before relying
> on it.

---

## Fix shape (proposed, NOT implemented)

**Element to attach the click→select on**: the two visible, hittable parts of each stub —
1. `.ghost-target-stub__chip` (`ClassNode.tsx:650`, already `pointer-events:auto`) — add `onClick`.
2. `span.ghost-target-stub__label` (`ClassNode.tsx:644`) — make it hittable (it currently inherits
   `pointer-events:none`) and add `onClick`.

**Routing chosen (§4a)**: `editorContext?.selectChildElement?.(gt.refId)` (already imported and used
at `ClassNode.tsx:331`). Lands `_lastSelected.modelElement = gt.refId` after the node click; panel
renders the `DReference`. No new seam.

**`stopPropagation` point (§3)**: *do not* `stopPropagation` on the click (recommended (a)) — let it
bubble to `onNodeClick` so the highlight/assign guard (`useJjomSelection.ts:222`) stays centralized,
exactly as attribute clicks do; `selectChildElement`'s `rAF` overwrites `modelElement` afterward.
(If Alfonso instead wants the parent-class ring suppressed, switch to `e.stopPropagation()` + a
direct `_lastSelected` write — see §4 decision point.)

**Drag gesture to preserve (§3)**: the chip's `onPointerDown/Move/Up` reposition drag
(`ClassNode.tsx:652-654`) and the `onDoubleClick` reset (`:655`). To avoid "select after a real
drag", add a **moved flag**: reset it in `onGhostPointerDown`, set it in `onGhostPointerMove` once
movement exceeds a small threshold, and in the new `onClick` **skip the select if it moved**. Also
guard against the double-click reset firing a select on its two constituent clicks (acceptable to
ignore, or debounce). The chip keeps `cursor:grab` (it is draggable); selection-on-tap coexists.

**`pointer-events` / `cursor` change needed (CSS)**: `EditorV2.scss` —
`.ghost-target-stub__label { pointer-events: auto; cursor: pointer; }` (currently inherits
`pointer-events:none` from `:1431/:1457`; `cursor` for discoverability). The chip's
`pointer-events:auto` (`:1495`) is already sufficient; leave its `cursor:grab`.

**Files the fix would touch (all SAFE-ZONE; no critical-zone write)**:
- `frontend/src/components/editor-v2/nodes/ClassNode.tsx` — add `onClick` to chip + label, add the
  moved-flag to the existing ghost pointer handlers, call `selectChildElement(gt.refId)`.
- `frontend/src/components/editor-v2/EditorV2.scss` — `.ghost-target-stub__label`
  `pointer-events:auto; cursor:pointer`.

**No** change to `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
`useM1ReferenceEdges.ts`, `VersionFixer.tsx`, `jjomTransformers.ts`, or `useJjomSelection.ts`. No
context-interface change (reuses existing `selectChildElement`). **No critical-zone write — no
Layer Impact Report required for the proposed fix.**

> ⚠️ Working-tree caution for the fix commit: `EditorV2.scss` and `EditorV2.tsx` already carry the
> prior session's **uncommitted** edge-fix hunks (§5) plus pre-existing unrelated streams (a
> `setZoom`/`handleActiveResetZoom` zoom-controller stream, a `.toolbar-btn` change ~`:545` per the
> 2026-06-21 log). The fix only needs a *new* SCSS hunk in `EditorV2.scss`; stage it with
> `git add -p` to avoid bundling the prior hunks (CLAUDE.md §6.1/§6.4).

---

## Uncertainties flagged

1. **Exact `case 'DReference'` line** in the panel was not pinpointed (the prompt cited
   `Info.tsx:~1229`). `editors/Info.tsx` imports `DReference` (`:3`) and is the panel mounted via
   `PropertiesWithTreeView.tsx:212`; the reference-render path is *proven by precedent* (tree-view
   `StructuralFeatureRow` and the add-reference action both set `modelElement=<refId>` and the
   panel shows the reference), not by reading the switch arm. Reconfirm the line if the fix prompt
   needs it.
2. **Click-vs-drag** suppression after a real drag depends on browser `click`-after-pointer-drag
   behavior; the proposed moved-flag makes it deterministic — verify in-app.
3. **Same-MM edge selection** (§5) is asserted from the prior log entry, not runtime-verified here.
4. This was read-only; the bad state ("clicking the stub selects the parent class") was **not**
   reproduced live (CLAUDE.md §5.1 sub-rule) — it is inferred from the pe:none fall-through chain in
   §3. Reproduce on current code before building the fix.

---

## HARD STOP
Report written. No source modified, no build, no commit. The fix (re-targeted onto the stub) is the
next prompt.
