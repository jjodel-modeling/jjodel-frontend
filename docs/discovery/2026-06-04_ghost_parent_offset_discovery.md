# Discovery — Ghost-parent chip: current state for draggable + persistent offset

**Date**: 2026-06-04
**Mode**: READ-ONLY (no source file edited). Maps the current working tree.
**Goal**: map the current state of the ghost-**parent** (inheritance / super-type) chip so a
later prompt can mirror the ghost-**target** offset persistence (draggable + D-layer persisted +
double-click reset) as closely as possible.

**Path corrections vs the prompt** (verified on disk):
- `ClassNode.tsx` is at `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (prompt said
  `editor-v2/ClassNode.tsx`).
- `jjomTransformers.ts` is at `frontend/src/components/editor-v2/utils/jjomTransformers.ts`
  (prompt said `editor-v2/sync/jjomTransformers.ts`).
- Parent-chip SCSS lives in `frontend/src/components/editor-v2/EditorV2.scss` (no separate file).
- `git status` is **clean**: the ghost-target offset persistence WIP is committed locally
  (read from disk as instructed). No uncommitted diff present.

Line numbers below are from the current on-disk files.

---

## Q1 — Parent chip rendering

**Location**: `ClassNode.tsx:399-414`, gated by `const ghost = data.ghostParents?.[0];` (line `39`).

It reads **only the first** parent — `data.ghostParents?.[0]` — not the whole array. The JSX:

```tsx
{ghost && (
    <div
        className="ghost-parent-stub"
        data-ghost-parent-id={ghost.id}
        title={ghost.fullname}
    >
        <div className="ghost-parent-stub__chip">
            <span className="ghost-parent-stub__name">{ghost.name}</span>
            <span className="ghost-parent-stub__mm">{ghost.metamodelName}</span>
        </div>
        <svg className="ghost-parent-stub__connector" viewBox="0 0 12 18" aria-hidden="true">
            <polygon points="6,1 2,8 10,8" fill="none" stroke="var(--color-canvas-accent)" strokeWidth="1.2" strokeLinejoin="round" />
            <line x1="6" y1="8" x2="6" y2="18" stroke="var(--color-canvas-accent)" strokeWidth="1.2" />
        </svg>
    </div>
)}
```

- **What it reads**: `data.ghostParents?.[0]` → `ghost.id`, `ghost.fullname`, `ghost.name`,
  `ghost.metamodelName`.
- **Wrapping element / className**: outer `<div className="ghost-parent-stub">`; inner chip is
  `<div className="ghost-parent-stub__chip">` with `__name` and `__mm` spans; the connector is an
  inline `<svg className="ghost-parent-stub__connector">` drawing a UML generalization arc
  (hollow triangle `polygon` + vertical `line`).
- **React `key`**: **none**. It is a single conditional render (`{ghost && (...)}`), not a `.map`,
  so there is no `key` and at most **one** parent chip is ever rendered. (Contrast: ghost-target
  is a `.map` with `key={`${gt.refName}-${i}`}` at `ClassNode.tsx:504`.)

---

## Q2 — Is the parent chip draggable today?

**Answer: (a) fully static, no drag.**

- No parent-specific pointer handlers exist. `grep` for `onGhostParent`, `ghostParentDragRef`,
  any parent offset `useState` → **zero matches**. The `.ghost-parent-stub` div and its chip wire
  **no** `onPointerDown` / `onPointerMove` / `onPointerUp` / `onDoubleClick`.
- The drag machinery in `ClassNode.tsx` (`onGhostPointerDown` / `Move` / `Up` / `onGhostReset`,
  `ghostOffsets`, `ghostDragRef`, `persistGhostOffsets`) is bound **exclusively** to the
  ghost-**target** chip (`ClassNode.tsx:544-547`), keyed by `gt.refName`. None of it is shared
  with the parent chip.
- CSS: `.ghost-parent-stub` is `pointer-events: auto` (`EditorV2.scss:1366`) so it is hit-testable
  (for the `title` tooltip), but no JS drag handler is attached and the chip has no `cursor: grab`
  / `touch-action: none` / `user-select: none`.

There is **no** parent offset state to report (no shape, no key, no handler set, no re-sync effect)
because none exists yet.

---

## Q3 — `GhostParentInfo` shape

**`types.ts:64-69`** (verbatim):

```ts
export interface GhostParentInfo {
    id: string;
    name: string;
    metamodelName: string;
    fullname: string;
}
```

**Semantics of `id`** — resolved at the construction site `jjomTransformers.ts:111-118`:

```ts
for (const p of (lClass?.extends ?? [])) {
    if (p?.model && p.model.id !== lClass.model.id) {
        ghostParents.push({
            id: p.id,
            name: p.name,
            metamodelName: p.model.name,
            fullname: p.fullname,
        });
    }
}
```

`p` iterates `lClass.extends` — i.e. each **super-type class** (an L-proxy of an `LClass`). Therefore
`GhostParentInfo.id === p.id` is the **super-type `DClass` id**. It is **not** an inheritance-edge
id and **not** a synthetic id — it is the foreign class's own pointer id. The cross-metamodel guard
is `p.model.id !== lClass.model.id` (super-type lives in a different metamodel).

**`ClassNodeData.ghostParents` declaration** — `types.ts:91`:

```ts
    ghostParents?: GhostParentInfo[];
```

---

## Q4 — Transformer construction site

**ghostParents loop**: `jjomTransformers.ts:109-121` (declaration `const ghostParents: GhostParentInfo[] = []` at line `109`; loop body `110-121`). It reads `lClass?.extends` and, per cross-metamodel parent, `p.id / p.name / p.model.name / p.fullname` (quoted in Q3).

**Position relative to `const raw = vertex.__raw ?? vertex`** (lines `149-151`):

The parent loop (`109-121`) sits **above** the `const raw` declaration (`149`). So **`raw` is NOT in
scope at the parent loop** — reading `(vertex.__raw ?? vertex).ghostOffsets` there **requires a
separate local const before the loop**, exactly as the ghost-target case already does.

For ghost-target, that separate const already exists:

```ts
// jjomTransformers.ts:127  (between the parent loop @109-121 and `const raw` @149)
const ghostOffsetsRaw = (vertex.__raw ?? vertex).ghostOffsets;
```

`ghostOffsetsRaw` is declared at line `127`, which is **after** the parent loop. So as the file
stands today it is **not** in scope for the parent loop either. The minimal mirror for parents is
to either (a) **hoist** `ghostOffsetsRaw` above the parent loop (line ~108, before line `109`) and
reuse the same const for both loops, or (b) introduce a new dedicated const before the parent loop.
Reusing/hoisting the single `ghostOffsetsRaw` is the smaller diff and keeps one read of
`vertex.__raw.ghostOffsets`.

(Note: whether parent offsets should share the **same** `ghostOffsets` map field on `DVertex`
as the ghost-target offsets, or live in a separate field, is a design decision — see Deltas #9.)

---

## Q5 — Mirror source: ghost-target drag code (verbatim, current on-disk state)

> The prompt's Q5 (`~:62-100`, "in-session offset only, confirm no re-sync effect") describes an
> earlier version. The on-disk code is **further along**: it already implements all three target
> capabilities — drag, **D-layer persistence**, and double-click reset — plus a **seed-from-data**
> lazy initializer. This is the full mirror the implementation should copy. Lines `63-128`:

```tsx
// === Ghost-target drag (in-session offset only; NOT persisted) ===  [comment is now stale]
// ... seeds once at mount from data.ghostTargets[].offset, mapped refName→offset ...
const [ghostOffsets, setGhostOffsets] = useState<Record<string, { dx: number; dy: number }>>(
    () => {
        const init: Record<string, { dx: number; dy: number }> = {};
        (data.ghostTargets ?? []).forEach(gt => { if (gt.offset) init[gt.refName] = gt.offset; });
        return init;
    }
);
const ghostDragRef = useRef<{ refName: string; startX: number; startY: number; baseDx: number; baseDy: number } | null>(null);

// Persist the by-refName offsets to the source DVertex as a by-refId map.
const persistGhostOffsets = useCallback((byRefName: Record<string, { dx: number; dy: number }>) => {
    const map: { [refId: string]: { dx: number; dy: number } } = {};
    for (const [refName, off] of Object.entries(byRefName)) {
        const refId = data.ghostTargets?.find(gt => gt.refName === refName)?.refId;
        if (refId) map[refId] = off;
    }
    TRANSACTION('persist ghost offset', () => { SetFieldAction.new(id as any, 'ghostOffsets' as any, map, undefined, false); });
}, [id, data.ghostTargets]);

const onGhostPointerDown = useCallback((e: React.PointerEvent, refName: string) => {
    e.stopPropagation();   // do not let the press start a node drag / pan
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
    const cur = ghostOffsets[refName] ?? { dx: 0, dy: 0 };
    ghostDragRef.current = { refName, startX: e.clientX, startY: e.clientY, baseDx: cur.dx, baseDy: cur.dy };
}, [ghostOffsets]);

const onGhostPointerMove = useCallback((e: React.PointerEvent) => {
    const d = ghostDragRef.current;
    if (!d) return;
    const zoom = getViewport().zoom || 1;   // screen px -> flow px
    const dx = d.baseDx + (e.clientX - d.startX) / zoom;
    const dy = d.baseDy + (e.clientY - d.startY) / zoom;
    setGhostOffsets(prev => ({ ...prev, [d.refName]: { dx, dy } }));
}, [getViewport]);

const onGhostPointerUp = useCallback((e: React.PointerEvent) => {
    const d = ghostDragRef.current;
    if (d) {
        const zoom = getViewport().zoom || 1;
        const dx = d.baseDx + (e.clientX - d.startX) / zoom;
        const dy = d.baseDy + (e.clientY - d.startY) / zoom;
        const next = { ...ghostOffsets, [d.refName]: { dx, dy } };
        setGhostOffsets(next);
        persistGhostOffsets(next);
    }
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    ghostDragRef.current = null;
}, [ghostOffsets, getViewport, persistGhostOffsets]);

// Double-click resets a chip to its default anchored position.
const onGhostReset = useCallback((refName: string) => {
    if (!ghostOffsets[refName]) return;
    const next = { ...ghostOffsets };
    delete next[refName];
    setGhostOffsets(next);
    persistGhostOffsets(next);
}, [ghostOffsets, persistGhostOffsets]);
```

**Re-sync effect on `ghostOffsets`: still NONE.** Confirmed by inspecting every effect in the file:
`useEffect` at `181-186` (re-syncs `data.label` only), `useEffect` at `189-196` (`data.autoEdit`),
and `useLayoutEffect` at `147-178` (measures `ghostOriginY` / `ghostChipSize`, keyed on `ghostSig`).
None reads or writes `ghostOffsets`. The state is seeded **once** by the lazy `useState` initializer
(lines `72-76`) and thereafter mutated only by the drag handlers. The comment at `ClassNode.tsx:70`
is explicit: *"State stays keyed by refName; do NOT add an effect that re-syncs from data."*

**Persist plumbing the parent must also mirror**: `ClassNode.tsx:18` imports
`{ TRANSACTION, SetFieldAction }` from `'../../../joiner'`; `persistGhostOffsets` writes
`SetFieldAction.new(id, 'ghostOffsets', map, undefined, false)` inside a `TRANSACTION`, using the
node `id` (= source `DVertex` id) as the target pointer.

---

## Q6 — DOM / stacking

**Parent chip DOM nesting**: the `<div className="ghost-parent-stub">` is rendered inside the
`ClassNode` return as a **direct child of the node root** `<div className="mm-node mm-class …">`
(`ClassNode.tsx:380-414`), a sibling of `<DynamicHandles>` and the header. So it lives **inside the
source node's stacking context** — the same arrangement as the ghost-target stub (also a child of
the node root), and the same `z-index` ceiling (**both are `z-index: 4`**: parent at
`EditorV2.scss:1365`, target at `EditorV2.scss:1407`). No runtime DOM inspection is needed for these
structural facts; they are read directly from JSX + SCSS.

**Parent chip CSS positioning** (`EditorV2.scss:1357-1394`):

```scss
.ghost-parent-stub {
    position: absolute;
    bottom: 100%;            // anchored to the node TOP, grows upward
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 4;
    pointer-events: auto;
    &__connector { width: 12px; height: 18px; display: block; }   // STATIC fixed-size SVG
}
```

**Existing `transform` that a drag would conflict with**: **YES** — `.ghost-parent-stub` already
carries `transform: translateX(-50%)` (line `1361`) for horizontal centering above the node. A drag
`translate(dx, dy)` applied to this same element would **overwrite** the centering. The implementation
must either **compose** it (e.g. `transform: translate(calc(-50% + ${dx}px), ${dy}px)`) or move the
drag transform to an **inner wrapper** (mirroring ghost-target's `&__draggable` inner div, which has
no base transform and so receives the inline `translate(endX, endY)` cleanly —
`ClassNode.tsx:532-535`, `EditorV2.scss:1429-1436`).

**Connector**: the parent connector is a **static, fixed 12×18 SVG** placed by the flex column
**below** the chip; it does not re-aim. The ghost-target connector is an **absolute SVG with computed
start/end geometry** that follows the dragged chip (`ClassNode.tsx:505-529`,
`EditorV2.scss:1454-1461`). Making the parent connector follow a dragged chip is a structural rework,
not a parameter change (see Deltas #5).

---

## Q7 — Keying decision input

The parent chip is **identified by ID**, and the ID is already present:

- `data-ghost-parent-id={ghost.id}` — `ClassNode.tsx:402` (the super-type `DClass` id, per Q3).
- Display text uses `ghost.name` / `ghost.metamodelName` — `ClassNode.tsx:406-407` (cosmetic only;
  not used as an identity key).
- There is **no React `key`** today because the chip is a single `[0]` render, not a `.map` (Q1).
- The id originates at `jjomTransformers.ts:114` (`id: p.id`).

**Decision input**: new drag state can be keyed **directly by parent `id`** (the super-type DClass
id) with **no name↔id bridge**. This is *strictly simpler* than the ghost-target case, which keys
in-component state by `refName` and must look up `refId` at persist time
(`persistGhostOffsets`, `ClassNode.tsx:84-87`). For parents, both the in-component state map and the
persisted by-id map can use `ghost.id` as the key, eliminating the bridge entirely. Nothing in the
current rendering is keyed by parent **name**, so there is no already-stabilized name-keyed render to
preserve.

---

## Known facts to confirm or correct (seeded from prior discovery)

| Seeded fact | Verdict |
|---|---|
| `ClassNode.tsx` is **not** `React.memo` (`~:724`) | **CONFIRMED** (no `memo` wrapper; `export default ClassNode` at `:752` — the `~:724` line ref is stale, file grew). |
| Registered as `classNode` in `EditorV2.tsx` (`~:95`) | **CONFIRMED exactly** — `EditorV2.tsx:95` `classNode: ClassNode,`. |
| Accesses **only** `props.data` / `props.id` plus RF hooks/context — no `LPointerTargetable` / `fromPointer` / `__raw` | **PARTIALLY OUTDATED.** Still no `LPointerTargetable` / `fromPointer` / `__raw` (grep = 0). **But** it now imports `{ TRANSACTION, SetFieldAction }` from `'../../../joiner'` (`:18`) and performs a **D-layer write** in `persistGhostOffsets` (`:88`, `SetFieldAction.new(id, 'ghostOffsets', …)`), using `props.id` as a `DVertex` pointer. So "reads props only" no longer holds — it writes the D-layer via the node id. |
| `GhostParentInfo` (`~:64-69`) **has `id`** | **CONFIRMED** — `types.ts:64-69`, `id: string` at `:65`. |
| `GhostTargetInfo` (`~:72-78`) does **not** have `id` | **OUTDATED.** `GhostTargetInfo` is now `types.ts:72-80` and **does** carry `refId?: string` (`:78`) and `offset?: { dx; dy }` (`:79`), added by the ghost-target offset WIP. |
| Adding optional fields to these types is additive and safe | **CONFIRMED** — both interfaces are open (`[key: string]: unknown` on `ClassNodeData`); no consumer does an exhaustive shape check. Adding `offset?` to `GhostParentInfo` is safe. |

---

## Deltas vs ghost-target

Every point where the parent chip differs from the ghost-target chip and would therefore need
**different** (not mirrored) handling:

1. **Identity is simpler (advantage).** Parent already has a stable `ghost.id` (super-type DClass
   id). Drag state + persisted map can both be keyed by `ghost.id` — **no `name`↔`id` bridge**, unlike
   ghost-target's `refName`-keyed state + `refId` lookup in `persistGhostOffsets`
   (`ClassNode.tsx:84-87`).

2. **Multiplicity.** Parent renders only `[0]` (single chip, no `.map`, no React key —
   `ClassNode.tsx:39`); ghost-target maps **all** entries. Decision for the implementer: keep
   single-parent drag (offset map with one entry), or first extend the render to `.map` all parents
   and then key drag by `id`. The mirror assumes the latter is natural but it is **not** how the chip
   renders today.

3. **Pre-existing CSS transform (conflict).** `.ghost-parent-stub` already uses
   `transform: translateX(-50%)` for centering (`EditorV2.scss:1361`). A drag `translate(dx, dy)`
   must **compose** with it (`translate(calc(-50% + dx), dy)`) or be applied to a new inner wrapper.
   Ghost-target's `&__draggable` wrapper had **no** base transform, so the inline `translate` was
   clean (`ClassNode.tsx:534`).

4. **Anchor direction + default geometry.** Parent stub is anchored to the node **top**, grows
   **upward** (`bottom:100%; left:50%`). Ghost-target is anchored to the node **right**, grows
   **rightward** (`top:0; left:100%`). The default-gap constant (`GHOST_TARGET_DEFAULT_GAP = 24`,
   `ClassNode.tsx:29`) and all connector start/end math are oriented for the right-side case; the
   parent equivalent needs vertical-up geometry. The dx/dy bookkeeping (screen→flow via `zoom`) is
   identical; only the default rest-position and connector origin differ.

5. **Connector model.** Parent connector is a **static fixed 12×18 SVG** (`EditorV2.scss:1389-1393`)
   positioned by flex below the chip — it does not follow a moved chip. Ghost-target's connector is an
   **absolute SVG with computed ray/rect-clipped geometry** that re-aims at the dragged chip
   (`ClassNode.tsx:505-529`). To make the parent connector follow the drag, it must be converted to
   the absolute+computed model (significant rework), or the design must accept a non-following
   connector.

6. **`pointer-events` model.** `.ghost-parent-stub` is `pointer-events: auto` on the **whole** stub
   (`EditorV2.scss:1366`). Ghost-target sets `pointer-events: none` on the outer container and `auto`
   only on the chip (so the chip is the sole drag handle and the rest doesn't block right-side
   handles — `EditorV2.scss:1408, 1434, 1472`). To make the parent chip a clean drag handle, it would
   need the same split plus `cursor: grab`, `touch-action: none`, `user-select: none` on
   `&__chip` (currently absent on the parent chip).

7. **Transformer offset read position.** The ghostParents loop (`jjomTransformers.ts:109-121`)
   precedes both `const raw` (`:149`) and `const ghostOffsetsRaw` (`:127`), so reading offsets there
   needs the `ghostOffsetsRaw` const **hoisted above the parent loop** (or a new const introduced
   before it). For ghost-target, `ghostOffsetsRaw` is already positioned correctly for its loop.

8. **Type field to add.** `GhostParentInfo` needs an additive `offset?: { dx; dy }` field
   (mirroring `GhostTargetInfo.offset`, `types.ts:79`), and the transformer must populate it from
   `ghostOffsetsRaw?.[p.id]` (keyed by parent id, vs ghost-target's `ghostOffsetsRaw?.[ref.id]`).

9. **Persisted-field namespace decision.** Ghost-target persists to `DVertex.ghostOffsets` keyed by
   `refId`. Parent offsets keyed by super-type `DClass` id could share the **same** `ghostOffsets`
   map (refIds and class ids are distinct pointer namespaces → low collision risk) or use a
   **separate** field (e.g. `ghostParentOffsets`) for clarity. This is an open design decision; it
   also bears on whether the future `'2.218 -> 2.219'` migration / D-field work (out of scope per the
   prompt) provisions one field or two.

---

*End of discovery. No source files were modified. No implementation performed.*
