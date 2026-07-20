# Discovery (Phase 2A) — Why reference-edge bodies don't receive clicks in v2-flow

**Date**: 2026-06-21
**Branch**: `alfonso-frontend-jjtl`
**Type**: READ-ONLY discovery. No edits, no build, no commits.
**Status**: complete — hard stop. The fix is Phase 2B.
**Predecessor**: `docs/discovery/2026-06-21_crossref_edge_selection.md` (selection wiring is correct).

---

## ⚠️ Verdict up front: the evidence REFUTES both framed hypotheses (2a and 2b)

The prompt asked me to choose between **2a** (thin/absent edge interaction path) and **2b**
(a container/node body above the edge layer intercepts clicks). Read against the live tree,
**neither holds as defined**:

- **2a is REFUTED.** `UnifiedEdge` renders an explicit **20px-wide transparent hit path**
  with `pointer-events: stroke` for every reference / single-inheritance edge
  (`UnifiedEdge.tsx:591-600`). The interaction path is neither absent nor thin; it uses the
  same geometry (`d={path}`) as the visible stroke, so what the user sees and what is
  clickable coincide. ReactFlow's own `interactionWidth` prop is not used because the edge
  does **not** use `BaseEdge`; this custom hit path replaces it and is wider than RF's 20px
  default.
- **2b is REFUTED.** The runtime fall-through target has **`node:''`**. A click on a node
  body fires ReactFlow's `onNodeClick → jjomSelection.onNodeClick → selectElement(node.id)`,
  which writes `node: <vertexId>` (non-empty, `useJjomSelection.ts:126`). The observed
  `node:''` is the signature of **`onPaneClick`** (`useJjomSelection.ts:238 → deselectAll →
  findModelElement`, `:160`/`:128`), i.e. the click reached the **pane**, *below* the entire
  node+edge layer — not a node. So no node body is intercepting; nothing in the viewport
  captured the click at all.

**What the evidence actually shows:** the click passes through the *whole* React Flow
viewport (edges **and** nodes) and lands on the **pane** (`.react-flow__pane`, z-index 1),
which sits below `.react-flow__viewport` (z-index 2). For that to happen over a visible edge,
the edge's correctly-authored hit path must be **failing to capture the pointer event at
runtime** — a phenomenon static reading says should *not* happen (everything is wired
correctly). Per CLAUDE.md §5.1 I will not force-fit 2a or 2b; the true cause is a
runtime/stacking effect that needs one targeted DOM probe to pin (see §5). The good news:
every candidate remedy is **safe-zone**.

---

## 1. Edge interaction path in `UnifiedEdge.tsx`

- **No `BaseEdge`.** `UnifiedEdge` draws raw `<path>` elements; there is no `BaseEdge`
  import or render, so the ReactFlow `interactionWidth` prop is not in play.
- **Explicit invisible hit path** (CASE 3 — all references + single inheritance,
  `UnifiedEdge.tsx:591-600`):
  ```tsx
  {/* Invisible hit-test path */}
  <path
      d={path}
      fill="none"
      stroke="transparent"
      strokeWidth={20}
      style={{ pointerEvents: 'stroke' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
  />
  ```
  - width **20px**, `pointer-events: stroke` (captures on the stroke region regardless of the
    transparent paint), same `d={path}` as the visible stroke.
  - **It has `onMouseEnter`/`onMouseLeave` but NO `onClick`.** Click selection relies on
    ReactFlow's edge-wrapper delegation (see §below): the event must bubble from this path up
    to the `<g class="react-flow__edge">` whose `onClick` ReactFlow wires.
  - The inheritance/tree branch has equivalent transparent hit paths
    (`pointerEvents: 'stroke'` at `UnifiedEdge.tsx:412`, `:420`, `:488`).
- **Visible path** (`UnifiedEdge.tsx:603-609`): `d={path}`, `className={edgeClassName}`
  (`reference-edge ...` / `inheritance-edge ...`, `:522-523`), no inline pointer-events →
  inherits the group's `visibleStroke` (captures on its ~1px painted stroke).
- **`path` geometry** is the final routed path (`:276-284`: self-loop / bridged-crossings /
  `roundManhattanPath(spreadPath)`); **both** the hit path and the visible path use this same
  variable, so the clickable band is centred on the line the user sees.

**Edge SCSS** (`EditorV2.scss`): `.reference-edge { stroke-width: 1 }` (`:2002-2004`),
`.inheritance-edge { stroke-width: 1 }` (`:2016-2018`). The only `pointer-events: none` near
edges is on `.reference-badge` (the **label**, `:2061`), **not** on the edge paths or the
edge group. No `!important` rule targets edge paths (the `!important` pointer-events rules at
`:1081/1106/1130` are all for `.mm-anchor` handles).

**ReactFlow base CSS** (`@xyflow/react/dist/style.css`):
```css
.react-flow .react-flow__edges svg { pointer-events: none; }      /* :150-153 */
.react-flow__edge       { pointer-events: visibleStroke; }        /* :155-156 */
.react-flow__edge.inactive { pointer-events: none; }              /* :169-170 */
```
The per-edge `<svg>` is `pointer-events:none`; the `<g class="react-flow__edge">` re-enables
with `visibleStroke`; the hit path re-enables with inline `stroke`. The `inactive` class is
added only when `!isSelectable && !onClick` (`index.js:2916`); since `onEdgeClick` **is**
passed, edges are **not** `inactive`. So by the cascade, the hit path *should* capture.

**Conclusion (1):** the interaction path is present, generous (20px), and correctly
configured. **2a does not hold.**

---

## 2. Edge vs node z-order in the ReactFlow config

- **`<ReactFlow>` props** (`EditorV2.tsx:3219-3258`): **no** `elevateEdgesOnSelect`, **no**
  `elevateNodesOnSelect`, **no** `edge/node zIndex` props, **no** `edgesFocusable`/
  `elementsSelectable` overrides → all defaults. `defaultEdgeOptions = { type: 'reference' }`
  only (`:220-222`) — **no `zIndex`**. `deleteKeyCode={null}` (`:3257`), `panOnDrag={[0,1,2]}`
  (`:3250`), `selectionMode=Partial` (`:3249`).
- **Edge zIndex**: `jjomEdgeToRFEdge` sets **no** `zIndex` on edge objects (verified across
  the M2/M1/inheritance branches) → default. RF wraps each edge in `<svg style={{ zIndex }}>`
  (`index.js:2908`) with `zIndex` from `getElevatedEdgeZIndex` (default 0 for unselected).
- **Node zIndex**: only the **package** node is pushed down — `zIndex: -1`
  (`jjomTransformers.ts:229`, and `EditorV2.tsx:123/1729/1789`). **`classNode` sets no
  zIndex** (default 0). RF wraps each node with `zIndex: internals.z` (`index.js:2234`).
- **RF stacking (base CSS)**: `.react-flow__pane { z-index: 1 }` (`style.css:111`) <
  `.react-flow__viewport { z-index: 2 }` (`:124`). Edges and nodes live inside the viewport,
  so the **entire** edge+node layer is above the pane.

**The large container node**: the big box spanning the canvas is the **packageNode**
(`PackageNode.tsx:63`, body `<div className="mm-node__container" />` at `:93`), built at
~400×300+ (`jjomTransformers.ts:221-232`) with **`zIndex: -1`** → it renders **below** the
edge layer. So the package body does **not** sit above the edges and cannot intercept
edge-body clicks. `classNode` (z 0) is at/above edges, but — see §3/§4 — the runtime result
is a **pane** click, not a node click, so node interception is not what is happening.

**Conclusion (2):** the only large container (package) is *below* edges; class nodes are not
intercepting (the fall-through is to the pane, not a node). **2b does not hold.**

---

## 3. The container node component

- **PackageNode** (`nodes/PackageNode.tsx`): outer `<div className="mm-node mm-package ...">`
  (`:63`); title `<div className="mm-node__tab">` (`:75`); body `<div
  className="mm-node__container" />` (`:93`, an empty div forming the dashed box).
  - SCSS: `.mm-package { background: transparent; border: none; box-shadow: none }`
    (`EditorV2.scss:1574-1579`); the visible box is `.mm-node__container`
    (`_notations.scss:54`: `border-style: dashed`, `--package-body-bg: transparent`).
  - **No `pointer-events: none`** is set on `.mm-package` / `.mm-node__container`, and there
    is **no `onClick`** on the package body. Selection of a package would go through RF's node
    wrapper `onSelectNodeHandler` → `onNodeClick`. But because the package wrapper is
    `zIndex:-1` (below edges) **and** its body is fully transparent, clicks over the package
    interior that are not captured by an edge fall through to the pane.
- **ClassNode** (`nodes/ClassNode.tsx`): outer `<div className="mm-node mm-class ...">`
  (`:460`), a filled, click-catching surface; header `onClick` (`:671`) only enters edit mode
  *when already selected* and does not stop propagation, so a class-body click bubbles to RF's
  node wrapper → `onNodeClick` → `selectElement(classId)` (→ `node: classId`, non-empty).

This explains the **observed fall-through targets**: with the package transparent and
`z=-1`, an un-captured click over the diagram interior reaches the pane → `onPaneClick →
deselectAll → findModelElement` → the **first DClass** in the first package (e.g.
`NamedElement`) or, when none resolves, the **DModel** (`model_1`) — both written with
`node:''`.

---

## 4. Background / pane / container click handler (confirming the bypass)

- `onPaneClick` is wired on `<ReactFlow>` (`EditorV2.tsx:3238`) →
  `EditorV2.onPaneClick` (`:2202-2208`, clears RF selection) → `jjomSelection.onPaneClick`
  (`useJjomSelection.ts:238-254`) → `deselectAll(modelid)` (`:141-178`).
- `deselectAll` writes `_lastSelected` with **`node:''`** and
  `modelElement: findModelElement(modelid)` (`:160-166`). `findModelElement`
  (`:37-58`) returns the **first class id** of the first package, else the package id, else
  the **model id**. → exactly the observed `NamedElement` (DClass, `node:''`) /
  `model_1` (DModel, `node:''`).
- This **confirms** the edge is being bypassed: the event target is the pane, not the edge
  `<g>` (which would fire `onEdgeClick`) and not a node wrapper (which would write a non-empty
  `node`).

**ReactFlow click delegation (for reference)**: the edge `<g class="react-flow__edge">`
carries `onClick: onEdgeClick` (`index.js:2908-2920`); RF's internal `onEdgeClick`
(`:2854-2868`) calls `addSelectedEdges([id])` then `onClick(event, edge)` (our wrapper). For
this to fire, a click on the hit path must bubble to that `<g>`. The runtime shows it does
not — i.e. the hit path is not receiving/passing the click.

---

## 5. Verdict + remedy options (no implementation)

**Verdict: neither 2a nor 2b.** The interaction path exists and is generous (20px,
`pointer-events:stroke`, geometry-matched) → **2a refuted**. The fall-through is to the
**pane** (`node:''`), not a node (`node:<id>`) → **2b refuted** (no container/node is above
the edge intercepting; the package container is *below* edges and transparent). The real
situation is: **a correctly-authored edge hit path is not capturing the click at runtime, so
the event traverses the whole viewport and lands on the pane.** Static reading cannot, by
itself, explain *why* a `pointer-events:stroke` 20px path fails to capture — this is a
runtime/stacking/hit-test effect.

### One-step runtime probe to pin the exact cause (do this first in Phase 2B)
With the MM editor open, hover/click a reference-edge body and capture:
1. **Hover test** — does hovering the edge body do anything (it drives `setHovered`, used by
   M1 labels)? If hover state changes, the hit path *is* receiving pointer events and the
   failure is specifically in **click delegation**; if not, the hit path is **not capturing**
   (pointer-events/stacking).
2. `document.elementFromPoint(clientX, clientY)` at the click → which element is topmost? Is
   it the transparent hit `<path>`, the `.mm-node__container`, `.react-flow__pane`, or the
   dot-grid? This names the actual interceptor.
3. `getComputedStyle(hitPathEl).pointerEvents` on the rendered hit path, and
   `hitPathEl.getBoundingClientRect()` vs the click coords → confirms the path is where the
   visible line is and that pointer-events survived the cascade.
4. The per-edge `<svg style="z-index:…">` computed `z-index`, and the package/class node
   wrapper computed `z-index`, at the click region.

### Candidate causes (ranked) and matching remedies — all SAFE-ZONE
- **C-click-delegation** (likely if hover works): the hit path captures but the click is not
  reaching the RF `<g>` onClick. **Remedy R1**: add an explicit `onClick` to the invisible
  hit path (`UnifiedEdge.tsx`) that selects the edge directly — e.g. route through the
  existing `useEditorContextSafe()` (which already carries `onEdgeDataChange`,
  `selectChildElement`, etc.) to call the editor's edge-select path. Self-contained in
  `UnifiedEdge.tsx` (+ a one-line context method in `EditorV2.tsx`). No tradeoff.
- **C-pointer-events / stacking** (likely if hover does NOT work): the hit path is not the
  topmost pointer-events element (e.g. an overlay, a transform/viewBox mismatch on the
  per-edge svg, or a v12 negative-z stacking quirk from the package's `zIndex:-1`).
  **Remedy R2**: ensure the edge sits above the offending surface — try per-edge `zIndex`
  on the RF edge objects or `elevateEdgesOnSelect`, or correct the hit path's
  pointer-events/geometry. *Tradeoff (only for raising z):* edges raised above node bodies
  could begin intercepting clicks intended for node bodies (and for connect-from-handle on
  the node border). Confine any z-raise to the edge interaction path, not the visible layer,
  and re-test node selection + drag + connect.
- **C-overlay**: ruled out for the dot-grid (`.editor-v2__dot-grid { pointer-events: none }`,
  `EditorV2.scss:92`); no other full-canvas overlay is rendered inside `<ReactFlow>`
  (`EditorV2.tsx:3219-3304`). Keep this on the list only if the probe's `elementFromPoint`
  surfaces an unexpected element.

**Recommended minimal remedy**: pending the probe, **R1 (explicit `onClick` on the hit
path)** is the most robust and lowest-risk fix *if* hover confirms the path receives events,
because it removes the dependency on RF's `<g>` click delegation entirely. If hover shows the
path does not receive events, switch to **R2** (stacking/pointer-events).

### Files a Phase-2B fix would touch (all safe-zone)
- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (hit path `onClick`, or
  pointer-events/geometry) — **safe**.
- optionally `frontend/src/components/editor-v2/EditorV2.tsx` (a context method to select an
  edge, or an RF prop like `elevateEdgesOnSelect` / per-edge `zIndex` plumbing) — **safe**.
- optionally `EditorV2.scss` (edge interaction CSS) — **safe**.

**No critical-zone write is implied.** `jjomTransformers.ts`, `syncState.ts`,
`canvasToJjom.ts`, `useJjomSync.ts` are **read-only** for every candidate remedy. (Note: if a
remedy adds a `zIndex` field on the RF edge objects produced by `jjomEdgeToRFEdge`, that
would be a **write in `jjomTransformers.ts` (critical zone)** → **stop and produce a Layer
Impact Report (§3.2) first.** Prefer applying `zIndex` via `defaultEdgeOptions` in
`EditorV2.tsx` (safe) instead, to keep the transformer untouched.)

---

## Uncertainties (flagged)

- **Could not run the app** (read-only). The central conclusion — that the hit path fails to
  capture at runtime despite correct authoring — rests on the prompt's runtime evidence plus
  static analysis. The exact interceptor (pane vs container vs a stacking quirk) is
  **unresolved** and needs the §5 probe before the remedy is finalized.
- Whether **hover** works on M2 reference edges is unknown from the evidence; it is the
  cheapest single discriminator between the click-delegation and pointer-events causes.
- `getElevatedEdgeZIndex` default (`index.js:2836`) was read but its exact output for these
  edges (given the package `zIndex:-1`) was not executed; the §5 probe step 4 captures the
  real computed z-indices.
- The package container's effective click behaviour (`zIndex:-1`, transparent, no
  `pointer-events:none`) is inferred from CSS; confirm with `elementFromPoint` whether a
  package-interior click without an edge truly reaches the pane.
