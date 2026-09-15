# Discovery — segmentOffsets gesture pipeline: full reconciliation + fix design

**Date**: 2026-06-10 · **Type**: deep discovery, strictly READ-ONLY (no edits, no logs, no staging, no commit)
**Branch**: `alfonso-frontend-jjtl`

Files consulted (all read-only): `graph/damedges/damedge.tsx`, `graph/graphElement/graphElement.tsx`,
`model/dataStructure/GraphDataElements.tsx`, `utils/UDComparator.ts`, `redux/defaults/views.ts`,
`common/DV.tsx`, `redux/store.tsx`, `graph/vertex/Vertex.tsx`, `common/UX.tsx`, `redux/reducer/reducer.ts`,
`redux/VersionFixer.tsx`, `package.json`.

---

## A. Gesture pipeline, end to end

### A.1 Handle mounting — React owns the `<circle>`

`getTemplate3_` runs the compiled view function and returns a **real React element tree**:
```ts
// graphElement.tsx:760
let ret = tnv.jsxOutput = (tv.JSXFunction ? tv.JSXFunction.call(context, context) : null);
```
`JSXFunction` is the jsxString compiled to `React.createElement` (`UX.tsx`: `JSXT.fromString(jsxString, {factory:'React.createElement'})`). `EdgeComponent.render` then injects the handle into that tree:
```ts
// damedge.tsx:138-139
const out: ReactNode = super.render(nodeType, styleoverride, classesoverride);
return this.injectSegmentHandles(out);
// :152-157 injectSegmentHandles → appendIntoFirstSvg(out, handles)
// :44-62 appendIntoFirstSvg walks the React tree, React.cloneElement-s the first <svg> to append the <circle>
```
The `<circle>` carries a **React synthetic** `onMouseDown` (`:194`). So React owns it → the handler fires. This is consistent with the verified fact that `[segDrag] onDown fired` logs. There is **no** `dangerouslySetInnerHTML` and the portal branch is dead (`graphElement.tsx:1545 if (false && …)`).

### A.2 `onSegmentHandleDown` — every path from entry to `addEventListener`

```ts
// damedge.tsx:198-234
private onSegmentHandleDown(e, edgeId, segmentIndex, horizontal, baseX, baseY, existingOffset): void {
    if ((window as any).__segDragDebug) { …console.log('[segDrag] onDown fired'…) }   // :200  (entry — fires)
    e.preventDefault();                                                                // :201
    e.stopPropagation();                                                               // :202
    const graph = (this.props.node) && (this.props.node).graph;                        // :203  proxy getter
    const zoom  = (graph && (graph.cumulativeZoom || graph.zoom)) || {x:1,y:1};         // :204  proxy getter
    const zx = zoom.x||1, zy = zoom.y||1;                                               // :205
    const startX = e.clientX, startY = e.clientY;                                       // :206
    const target = e.currentTarget as SVGElement;                                       // :207
    const delta = (me) => horizontal ? (me.clientY-startY)/zy : (me.clientX-startX)/zx; // :208
    const onMove = (me) => { … target.style.transform = … };                           // :209-214 (def only)
    const onUp   = (me) => { …removeEventListener…; …'[segDrag] onUp fired'…; …write… };// :215-231 (def only)
    document.addEventListener('mousemove', onMove);                                     // :232
    document.addEventListener('mouseup',  onUp);                                        // :233
}
```
**There is no conditional `return` between `:200` and `:232`.** The only statements that can abort the function are the proxy getter reads at **`:203` (`node.graph`)** and **`:204` (`graph.cumulativeZoom`)**. If either threw, `:232-233` would never run → no listeners → frozen preview + no `onUp` + no write (exactly the symptom). However, `get_graph` → `get_innerGraph` (`GraphDataElements.tsx:214`) and `get_cumulativeZoom` (`:298-303`) are the **same getters exercised during the edge's own routing/render** (`computeRouting` consumes `innermostGraph`/`rootGraph`); the edge visibly rendered (handle is shown only when selected and routed, `renderSegmentHandles` `:160-177`), so these getters are healthy → **a throw here is unlikely** (but not impossible — settle with the console check in §D).

### A.3 Listener mechanics

`onMove`/`onUp` are attached to **`document`** with **default (bubble) phase, no options** (`:232-233`). `removeEventListener` is symmetric and only inside `onUp` (`:216-217`); nothing else removes them, no `once`, no `capture`. No cleanup effect detaches them (this is imperative, not a React effect).

### A.4 Event environment — who else listens

- **No competing native `mouseup`/`mousemove` listener exists in the classic-editor path.** A global sweep of `addEventListener('mouseup'|'mousemove'|'pointer*')` returns only `damedge.tsx` itself plus *unrelated* surfaces (editor-v2/flow `EndpointHandles`/`SegmentHandles`/`EditorV2`, resize handles, `JodieWindow`, color picker, drawers) — none active during a classic edge-handle drag.
- **No capture-phase `mouseup`/`mousemove` listener anywhere.** The only capture listeners are `mousedown` (App debug `:82`, Toolbar/ColorScheme click-outside, NodeProblemOverlay) — irrelevant to release.
- **The React handlers install no document listeners**: `onMouseDown` (`graphElement.tsx:821-837`) just sets `mousedownComponent` and `e.stopPropagation()`; `GraphDragManager.startPanning` is **commented out** (`:835`); `onMouseMove` is a **no-op** (`:860-862`).
- **CONFIRMED competitor — `this.onMouseUp` calls `stopPropagation`:**
  ```ts
  // graphElement.tsx:866-873
  onMouseUp(e, frommousemove=false): void {
      e.stopPropagation();                 // <-- :867
      TRANSACTION('Vertex click-events', ()=>{ … this.doOnClick(e); })
  }
  ```
  This is wired onto **every** GraphElement root (`:1471 onMouseUp: this.onMouseUp`).

### A.5 The React-18 root-delegation interaction (the load-bearing mechanism)

`package.json`: **`react`/`react-dom` `^18.3.1`**. React 17+ delegates synthetic events to the **root container** (not `document`). When a React handler calls `e.stopPropagation()`, React also calls `e.nativeEvent.stopPropagation()` — and it does so while processing at the **root container, which sits below `document`**. The native event therefore **does not continue bubbling to `document`/`window`**.

Consequence: on mouse release **anywhere over the rendered diagram**, the native `mouseup` bubbles up, some GraphElement's `onMouseUp` fires and calls `e.stopPropagation()` (`:867`) at the root → the native `mouseup` **never reaches our `document`-level `onUp`** (`:233`). This robustly explains **`onUp` never fires → no `write set_segmentOffsets`**, regardless of where the user releases. (`onSegmentHandleDown`'s own `e.stopPropagation()` at `:202` does not block `onDown`, because the target handler runs before propagation is stopped.)

`onMove` is different: `onMouseMove` is a **no-op without `stopPropagation`** (`:860-862`), so a bubbling `mousemove` is **not** stopped at the root → it *should* reach our `document` `onMove`. So the **frozen-preview** symptom is **not** explained by A.5. Note: there is currently **no `[segDrag]` log inside `onMove`**, so its firing is *unobserved*, not *disproven* — the only evidence is the visual.

### A.6 Verdict A (ranked)

1. **Write-path death (no `onUp`, no write) — CONFIRMED:** React-18 root delegation + `this.onMouseUp`'s `e.stopPropagation()` (`graphElement.tsx:867`) stops the native `mouseup` at the React root, below `document`, so the document-level `onUp` (`damedge.tsx:233`) never runs. Code + React-version confirmed. High confidence.
2. **Single-cause alternative that would also explain the frozen preview — listeners never attached** (throw at `damedge.tsx:203-204`). Explains all three symptoms with one cause, but the implicated getters are healthy at render time → **lower confidence**; falsifiable by the console check in §D (uncaught error right after `onDown`?).
3. **Frozen preview, if listeners *are* attached — UNEXPLAINED statically.** `onMouseMove` is a no-op so `onMove` ought to fire and move the circle imperatively (no re-render reverts it, since the press's `stopPropagation` at `:202` blocks selection → no dispatch). Needs the runtime check in §D (temporary `onMove` log).

INFERENCE: the most economical reading is that **both** defects are real and compounding — hypothesis 1 is the certain blocker of the write, and the preview anomaly is a second, still-unconfirmed issue. The capture-phase fix in §D neutralizes hypothesis 1 outright and makes the preview directly observable.

---

## B. Persistence path (stale-offsets hypothesis)

1. **Field & serialization.** `segmentOffsets` is a plain D-layer field on the graph element:
   ```ts
   // GraphDataElements.tsx:1862 (DVoidEdge)   and  :2133 (typings)
   segmentOffsets?: { segmentIndex: number, offset: number }[];
   ```
   As a normal declared field it lives in Redux `idlookup` and is serialized wholesale by `compressedState` and restored by `LoadAction` (the project-state save/load path; established in `docs/discovery/2026-06-10_segmentoffsets_reactivity_and_factor.md` and the ghost-offset discovery). It is included in the saved project JSON.
2. **Writers / migrations.** Global grep: the **only** writer of the L value is `set_segmentOffsets` (`GraphDataElements.tsx:2266`, invoked by `damedge.tsx:230 node.segmentOffsets = next`). Readers: `applySegmentOffsets` (`:2491`), `renderSegmentHandles` (`damedge.tsx:170`), `get_segmentOffsets` (`:2265`). **No `VersionFixer` migration references the field** (the working-tree `2.221 -> 2.222` migration is the unrelated marker work). So nothing rewrites or scrubs stale offsets.
3. **Console one-liners (read-only) to confirm/refute stale data:**
   ```js
   // one edge:
   windoww.store.getState().idlookup['<edgeId>'].segmentOffsets
   // all edges currently carrying offsets:
   Object.values(windoww.store.getState().idlookup)
     .filter(e => e && e.segmentOffsets && e.segmentOffsets.length)
     .map(e => ({ id: e.id, segmentOffsets: e.segmentOffsets }))
   ```

**Verdict B.** The reload displacement is **persisted `DVoidEdge.segmentOffsets`** applied at load by `applySegmentOffsets`; since today's drags never reach `set_segmentOffsets` (Verdict A), any movement on reopen must be **pre-existing data from sessions before the write path broke** — fully consistent with "moves to positions unrelated to today's release." The one-liners settle it directly; the double-reload-without-dragging check should show **no change between reloads** (offsets are static; `applySegmentOffsets` is idempotent per §C/Q4). High confidence.

---

## C. The ~1.1× factor (render-scale composition)

Committed divisor:
```ts
// damedge.tsx:203-204
const zoom = (graph && (graph.cumulativeZoom || graph.zoom)) || {x:1,y:1};   // graph = node.graph
const zx = zoom.x||1, zy = zoom.y||1;     // delta divided by this (:208)
```
`get_cumulativeZoom` **includes the graph's own zoom** (`GraphDataElements.tsx:298-303`, `ancestors = [c.proxyObject, ...]`). Render-scale application:
```ts
// graphElement.tsx:1187-1192   --zoom-x = transformZoom = ownZoom
// store.tsx:287                .mainView.not-scrollable, .scrollable { transform: scale(var(--zoom-x), var(--zoom-y)); }
// GraphDataElements.tsx:313    edge.ownZoom (non-graph) === its graph.ownZoom
```
Each graph scales its `.scrollable`/`.mainView.not-scrollable` content by **its own** `--zoom-x` (=`ownZoom`); nested graphs compose to `cumulativeZoom`. The edge root is itself a `[data-nodetype].mainView` whose `--zoom-x = ownZoom = graph.ownZoom`; **if** the edge's own mainView is additionally matched by `transform: scale(var(--zoom-x))`, the edge's coordinate space is scaled by `graph.ownZoom` **on top of** the graph's scaling of its content → effective edge-space→screen ≈ `cumulativeZoom × ownZoom`, i.e. the committed divisor (`cumulativeZoom`) is **one `ownZoom` short**, producing the observed ~1.1× overshoot at 110%.

INFERENCE: this double-application is the leading explanation and matches fact 5 (~1.1× at 110%, constant). It is **not statically certain** — it depends on which DOM nodes actually carry `.scrollable`/`.not-scrollable` at runtime and how the `--zoom-x` CSS variable resolves through the nesting (CSS custom-property inheritance). Hypothesis B (accumulation) is already dead: `computeRouting` allocates fresh `GraphPoint`s every call and `get_segments` is unmemoized (prior discovery Q4), so `applySegmentOffsets` cannot accumulate.

**Verdict C.** Divisor is **probably one `ownZoom` short** (edge SVG double-scaled). The single decisive measurement (only valid once the write path works): **drag the same on-screen distance at zoom 100% then 125%** — exact at 100% and ~1.25× overshoot at 125% ⟹ confirmed, fix = divide by the edge's *true composed* scale (`cumulativeZoom × ownZoom`, or read the rendered scale from `getBoundingClientRect`). If 125% is also exact ⟹ divisor already correct and fact 5 was stale-data noise. Medium confidence; needs the measurement.

---

## D. Reconciliation + fix design

### D.1 Reconciliation table

| Symptom | Mechanism | Confidence |
|---|---|---|
| `[segDrag] onDown fired` logs (once per press) | `<circle>` is React-owned (A.1); `onMouseDown` synthetic handler runs before its own `stopPropagation` takes effect | CONFIRMED |
| `onUp` never fires; `write set_segmentOffsets` never fires | React-18 root delegation + `this.onMouseUp` `e.stopPropagation()` (`graphElement.tsx:867`) stops native `mouseup` at the root, below `document` → `document` `onUp` (`damedge.tsx:233`) never runs (A.5) | CONFIRMED (code + React 18.3.1) |
| Drag preview does not move | `onMouseMove` is a no-op so `onMove` *should* fire ⇒ either listeners not attached (throw at `:203-204`, unlikely) or onMove fires but doesn't paint | **UNEXPLAINED** — needs runtime check D.4 |
| Reload moves leg to positions unrelated to release | Persisted (pre-breakage) `DVoidEdge.segmentOffsets` applied at load by `applySegmentOffsets`; today's drags never write (B) | CONFIRMED (settle with B one-liner) |
| Historical ~1.1× at 110% zoom (constant) | Edge SVG double-scaled (`scale(var(--zoom-x))`, edge.ownZoom = graph.ownZoom) → divisor one `ownZoom` short (C) | INFERENCE — needs 100%/125% test |

### D.2 Cheapest runtime checks (this round is read-only — these are for the next pass)
- **D.4a** After `[segDrag] onDown fired`, is there an **uncaught error** in the console? Yes ⟹ Verdict A hypothesis 2 (throw at `:203-204`, listeners not attached). No ⟹ listeners attached, A.5 is the write blocker.
- **D.4b** Add a temporary gated `console.log('[segDrag] onMove fired')` as the first line of `onMove`: fires ⟹ preview-paint bug; never fires (with no error) ⟹ listeners not attached.
- **D.4c** B one-liner to dump current `segmentOffsets`; double-reload-without-drag to confirm they are static.
- **D.4d** C: drag-distance test at 100% vs 125%.

### D.3 Fix design (DESIGN ONLY — for go-ahead)

**(i) Make the gesture work — attach the move/up listeners in the CAPTURE phase.**
File `damedge.tsx`, `:232-233`:
```ts
document.addEventListener('mousemove', onMove, true);   // capture
document.addEventListener('mouseup',  onUp,  true);     // capture
```
and the matching removals inside `onUp` (`:216-217`) with `true`. Rationale: capture-phase document listeners fire on the way **down** (window→document→…→target), **before** any bubble-phase React root handler runs, so `this.onMouseUp`'s `stopPropagation` (`:867`) can no longer suppress them. This is the minimal surgical fix for the CONFIRMED write blocker (Verdict A.1) and is robust to release location. (Alternative — `setPointerCapture` + pointer events on the `<circle>` — is larger; not recommended.) Pending D.4a/D.4b: if the throw hypothesis is confirmed instead, also guard `:203-204` — but capture-phase alone is expected to fix the write path.

**(ii) Remove the `setTimeout(updateNode)` hack** in `set_segmentOffsets` (`GraphDataElements.tsx:2279` region, the working-tree `setTimeout(() => transientProperties.updateNode(id, true), 0)` and its explanatory comment). With the comparator fix in place (round 4), once the write fires, `ret.segments`'s changed leg-`d` strings make the edge's UD differ → natural re-render (prior discovery Q1). Keep Step 1b corner-dedup in `applySegmentOffsets` (verified correct).

**(iii) Divisor correction** — conditional on D.4d. If 125% overshoots: in `damedge.tsx:203-204`, divide by the edge's true composed scale (`graph.cumulativeZoom × node.ownZoom`, or the measured rendered scale) instead of `graph.cumulativeZoom` alone. If 125% is exact: no change.

**(iv) Strip ALL diagnostic instrumentation** (per CLAUDE.md §2 — dedicated cleanup commit, after the fix is confirmed):
- `damedge.tsx`: `[segDrag] onDown` (`:200`), `onUp fired` (`:219`), `onUp next` (`:229`).
- `GraphDataElements.tsx`: `[segDrag] write set_segmentOffsets` (`:2269`), the `setTimeout` block's `[segDrag] timeout/updateNode returned` logs, `[segDrag] applySegmentOffsets`.
- `graphElement.tsx`: `[segDrag] SCU` (`:533` area), `[segDrag] render REUSED/RE-EVALUATED` (getTemplate3_), `[scuStorm] SCU true before UD compare` + the `stormSubviewVid` debug var.
- `reducer.ts`: `[scuStorm] action` (`:598` area).

### D.4 Proposed atomic commits
1. **`fix(render): normalize functions in UD comparator`** — `UDComparator.ts` reorder (storm/broadcast). *Already applied in the working tree (round 4); commit standalone.*
2. **`fix(edges): capture-phase listeners for segment-handle drag`** — `damedge.tsx` (i) + remove `setTimeout(updateNode)` hack in `GraphDataElements.tsx` (ii); keep Step 1b. *(Land after D.4a/b confirm the mechanism.)*
3. **`fix(edges): correct segment-offset zoom divisor`** — `damedge.tsx` (iii). *Conditional on D.4d; skip if 125% exact.*
4. **`chore(edges): remove segDrag/scuStorm diagnostics`** — strip all logs (iv), across the four files. *Last, after the fix is visually confirmed.*
5. **Independent — `feat(edges): composition/aggregation markers (2.221→2.222)`** — `DV.tsx` + `VersionFixer.tsx` marker work already in the tree; unrelated, commit on its own track.

> Commit 2 will require `git add -p` inside `GraphDataElements.tsx` (the file interleaves the `setTimeout` hack removal with Step 1b to keep and with logs to strip in commit 4).

**Verdict D.** The write path is broken by a **single confirmed cause** (React-18 root delegation × `onMouseUp` `stopPropagation`), fixed minimally by **capture-phase** document listeners. The frozen-preview and the ~1.1× factor each need one cheap runtime check before their (small) fixes are finalized. No code touched this round.

## Hard stop
Read-only. No edits, no logs, no staging, no commit. Handing back.
