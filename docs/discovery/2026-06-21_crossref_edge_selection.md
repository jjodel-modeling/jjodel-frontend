# Discovery — Cross-reference (M2 DReference) edge selection in v2-flow MM editor

**Date**: 2026-06-21
**Branch**: `alfonso-frontend-jjtl`
**Type**: READ-ONLY discovery. No edits, no build, no commits.
**Status**: complete — hard stop. Implementation is a separate Phase 2.

---

## ⚠️ Headline finding — read before everything else

The premise of the prompt ("there is no edge selection path; clicking an edge selects
the source class; the Properties panel never shows reference fields") is **not confirmed
by the current code**. By static reading of the live tree:

1. An edge-selection path **already exists and predates the bug report**:
   `onEdgeClick → jjomSelection.onEdgeClick → selectElement(edge.id, modelid)`
   (`useJjomSelection.ts:233`, in the tree since commit `c9ccd5ebc`, 2026-05-22).
2. `selectElement(edge.id)` resolves the clicked edge's `.model`, which **is the
   `DReference`** (confirmed independently by `syncDeleteEdge` and `jjomEdgeToRFEdge`),
   and writes it into `_lastSelected.modelElement`.
3. The Properties panel dispatches on `_lastSelected.modelElement.className` and **already
   has a `case 'DReference'` renderer** (`Info.tsx:1229 → builder.reference()`) that shows
   name, type/target, lower/upper bound, composition and aggregation.

So, on paper, **clicking an M2 reference edge already selects the `DReference` and the
panel already renders its fields.** The reported symptom ("selects the source class,
panel never shows reference fields") is **not reproducible by reading the code**.

Per CLAUDE.md §5.1 ("do not trust fixtures from memory across sessions — reproduce the bad
state on the current code"), **the bug must be reproduced on the current tree before any
fix is scoped.** The most plausible *real* causes that static analysis cannot rule out are
hit-target issues (clicks landing on the `ClassNode` / on `pointer-events:none` SVG
markers instead of the thin edge path) — see §B and the Fix-shape section. The likeliest
*genuine* gap is the missing **opposite** field in the panel (see §D).

---

## A. Editor surface confirmation

The screenshot corresponds to the **v2-flow (ReactFlow)** editor, not the classic SVG overlay.

- All four edge variants register to the single `UnifiedEdge` component:
  `EditorV2.tsx:109-114`
  ```ts
  const edgeTypes: EdgeTypes = {
      reference: UnifiedEdge,
      inheritance: UnifiedEdge,
      composition: UnifiedEdge,       // M1: containment edge
      instanceRef: UnifiedEdge,       // M1: non-containment reference
  };
  ```
- `UnifiedEdge` renders the **composition diamond** markers (`reference-marker filled` /
  `hollow`, `UnifiedEdge.tsx:541-567`) and the **`refName <cardinality>` label** (label at
  `:640-660`, cardinality at `:668`). These are the markers in the screenshot.
- M2 references (metaclass→metaclass) take the `edge.isReference` branch in the transformer
  (`jjomTransformers.ts:487`) and emit `type: 'reference'` (`:534`). Composition diamonds on
  M2 references come from `kind = 'composition'` when `refModel.composition` is set
  (`jjomTransformers.ts:504-506`).

In the standard MM editing workflow the user interacts with the **v2-flow** surface.

---

## B. Edge-click pipeline (the "selects the parent class" symptom)

### Every edge-click handler wired to ReactFlow

Only **one** `onEdgeClick` is wired (`EditorV2.tsx:3237 onEdgeClick={onEdgeClick}`). Its definition:

`EditorV2.tsx:2212-2218`
```ts
const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    selectedEdgeIdRef.current = edge.id;  // Preserve selection through Redux patches
    setNodes(nds => nds.map(n => (n.selected ? { ...n, selected: false } : n)));
    setEdges(eds => eds.map(e => ({ ...e, selected: e.id === edge.id })));  // RF visual select
    jjomSelection.onEdgeClick(event, edge);                                  // JjOM selection
}, [setNodes, setEdges, jjomSelection]);
```

It does **two** things: (1) sets ReactFlow's `selected` flag on the clicked edge (the
visual highlight; see §F), and (2) delegates to `jjomSelection.onEdgeClick`.

`useJjomSelection.ts:228-236`
```ts
const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
        _event.stopPropagation();  // prevent pane click deselect race
        if (highlightActive && onAssign) { onAssign(edge.id); return; }   // highlight mode
        if (isJjomMode && modelid) selectElement(edge.id, modelid);        // ← JjOM selection
    },
    [isJjomMode, modelid, highlightActive, onAssign],
);
```

**This is a genuine Jjodel selection, not just the highlight feature.** The RIFERIMENTI
claim "no selection `onEdgeClick` existed before the highlight feature" is **stale**: the
`selectElement(edge.id, modelid)` call has been present since `c9ccd5ebc` (2026-05-22); the
highlight branch (`if (highlightActive && onAssign)`) was *added on top* in `2b9a03827`
(2026-05-29).

### Node-click path (for comparison)

`onNodeClick={jjomSelection.onNodeClick}` (`EditorV2.tsx:3236`, wired directly, no wrapper).

`useJjomSelection.ts:217-226`
```ts
const onNodeClick = useCallback((_event, node) => {
    _event.stopPropagation();
    if (highlightActive && onAssign) { onAssign(node.id); return; }
    if (isJjomMode && modelid) selectElement(node.id, modelid);
}, [isJjomMode, modelid, highlightActive, onAssign]);
```

`selectElement(elementId, modelid)` (`useJjomSelection.ts:96-137`), key lines:
```ts
const lElement = LPointerTargetable.fromPointer(elementId);   // :98
...
try { lElement.select(DUser.current); } catch { }             // :122
const modelElement = lElement.model;                          // :124
SetRootFieldAction.new('_lastSelected', {
    node: elementId,                                          // :126  (vertex OR void-edge id)
    view: '',
    modelElement: modelElement?.id ?? modelElement?.__raw?.id ?? '',  // :128
});
```

For a **node**, `lElement.model` = the `DClass`; for an **edge**, `lElement.model` = the
`DReference` (see §C). The Properties panel keys off `_lastSelected.modelElement` (see §D),
so **the same `selectElement` already produces a `DReference` selection for edges**.

### Why the report says "selects the source class" — assessment

Candidate mechanisms from the prompt:

- **(ii) the highlight `onEdgeClick` resolves to the source class** — **ruled out.** The
  selection path resolves `edge.id`'s `.model` = the `DReference`, never the source class.
- **(iii) ReactFlow default with no edge selection handler** — **ruled out.** A handler
  exists and runs (`:2212`/`:233`), and RF's own delete key is disabled
  (`deleteKeyCode={null}`, `EditorV2.tsx:3257`).
- **(i) the click lands on the `ClassNode` instead of the edge path** — **NOT ruled out, and
  is the most likely real cause.** The diamond/arrow markers are SVG `marker`-style glyphs
  drawn at the edge ends sitting on the *source node's border*; SVG markers are
  `pointer-events:none` by default, so a click that lands on the diamond can pass through to
  the `ClassNode` underneath → `onNodeClick` → `selectElement(sourceClassId)` → source class
  in the panel. The thin edge *body* should still fire `onEdgeClick`. This is a hit-target /
  interaction-width problem, **not** a selection-wiring problem, and would not be fixed by
  changing `selectElement`.

**Conclusion for B:** the wiring is correct and resolves the `DReference`. The "source
class" symptom is consistent with a hit-target issue (i) or a stale report, not with a
broken selection path. **Reproduce on the current tree before fixing** (§5.1).

---

## C. RF edge → DReference mapping (the crux) — SOLVED, multiple redundant carriers

The RF edge `id` is the **`DVoidEdge`/`DEdge` id**, *not* the `DReference` id
(`jjomEdgeToRFEdge` returns `id: edge.id`, `jjomTransformers.ts:529`). The underlying
`DReference` identity is available in **three** independent places:

1. **`edge.data.reference.id`** (M2) — `jjomTransformers.ts:508-518`
   ```ts
   const refData: ReferenceEdgeData = {
       reference: { id: refModel?.id ?? edge.id, name: ..., lowerBound:..., containment:..., opposite:... },
       jjomRefId: refModel?.id,                  // :519
   } as any;
   ```
   Field: `data.reference.id : string` (written at `:510`).

2. **`edge.data.jjomRefId`** (M2) — `jjomTransformers.ts:519`. Field: `data.jjomRefId : string`.
   For M1 edges the analogous carrier is **`edge.data.referenceId`**
   (`jjomTransformers.ts:465` composition / `:480` instanceRef).

3. **Module-level registry** — `jjomTransformers.ts:524-526`
   ```ts
   if (refModel?.id) { setEdgeRefId(edge.id, refModel.id); }
   ```
   Read it with `getEdgeRefId(edge.id)` → `string | undefined`
   (`syncState.ts:61-67`):
   ```ts
   const edgeRefIds = new Map<string, string>();
   export function setEdgeRefId(edgeId, refId) { edgeRefIds.set(edgeId, refId); }
   export function getEdgeRefId(edgeId)        { return edgeRefIds.get(edgeId); }
   ```

4. **Live proxy walk** — `LPointerTargetable.fromPointer(edge.id).model` returns the
   `DReference` directly. Confirmed twice: `jjomEdgeToRFEdge` uses `edge.model` as the
   reference (`jjomTransformers.ts:489`, reads `.composition/.name/.lowerBound/.opposite`),
   and `syncDeleteEdge` uses `edgeProxy.model` as the reference to delete
   (`canvasToJjom.ts:344-347`).

**Net:** recovering the `DReference` from a clicked edge is trivial and already done four
ways. `selectElement` currently uses route (4) implicitly (`lElement.model`). Any explicit
fix could instead read `edge.data.jjomRefId ?? getEdgeRefId(edge.id)` and pass that to
`selectElement`.

---

## D. Properties panel — already renders DReference fields

(Investigated via subagent; verified `file:line` below.)

- **Components**: `frontend/src/components/editors/PropertiesWithTreeView.tsx` (container)
  → `frontend/src/components/editors/Info.tsx` (`Info` content renderer).
- **Selection state the panel reads**: `state._lastSelected.modelElement`.
  `Info.tsx` `mapStateToProps` (~`:1382-1389`):
  ```tsx
  const nodeID = state._lastSelected?.node;
  const dataID = state._lastSelected?.modelElement;
  if (dataID) ret.data = LModelElement.fromPointer(dataID);   // → panel `data` prop
  ```
- **className dispatch**: `Info.tsx:1229`
  ```tsx
  case 'DReference': jsx = builder.reference(data, advanced, useNewDesign); break;
  ```
  (`ddata.className === 'DReference'`; an L-proxy reports the **D**-className per §3.13, so
  this matches the `LReference` proxy returned by `fromPointer`.)
- **Fields rendered by `builder.reference()`** (`Info.tsx:~484`):
  name (`builder.named`), **type/target classifier** (`TypeSelect`), **lowerBound**,
  **upperBound**, **composition** (`PropertiesToggle`), **aggregation** (`PropertiesToggle`),
  plus advanced flags (unique/ordered/changeable/volatile/transient/unsettable/derived/
  allowCrossReference).
- **Missing**: **opposite / eOpposite is NOT rendered** (no field in `builder.reference()`).
  "containment" is surfaced as the **composition** toggle (consistent with §3.8: `composition`
  is the canonical field; `containment` is legacy-comment-only).

**Decisive consequence**: calling `selectElement(<DReference id>)` (which sets
`_lastSelected.modelElement = <DReference id>`) **does** make the panel render the
reference's fields automatically — no panel change needed for name/type/bounds/composition.
Because `selectElement(edge.id)` already sets `modelElement` to `lElement.model.id`
(= the DReference), this is **already wired today**.

- **Tree-view selection (for comparison)**: `TreeViewSidebar/TreeViewContent.tsx`
  selects a feature by writing the *same* root field directly (`StructuralFeatureRow`, ~`:489`):
  ```tsx
  SetRootFieldAction.new('_lastSelected', { node: '', view: '', modelElement: feature.id });
  ```
  i.e. the tree sets `modelElement = <DReference id>` with `node: ''`. The canvas path sets
  `modelElement = <DReference id>` with `node = <DVoidEdge id>`. Both land on the same
  `case 'DReference'` renderer.

---

## E. Reference delete path — canvas-side path exists, is correct, and is already gestured

- **Sync entry**: `canvasToJjom.ts:321 syncDeleteEdge(edgeId, isInheritance)`. Reference branch
  (`:342-351`):
  ```ts
  const refModel = edgeProxy.model;                       // :344  the DReference
  if (refModel) TRANSACTION('EditorV2 delete edge', () => {
      DeleteElementAction.new(refModel.__raw ?? refModel);   // delete the DReference
      DeleteElementAction.new(edgeProxy.__raw ?? edgeProxy); // delete the DVoidEdge
  });
  ```
  It takes the **RF edge id** (= DVoidEdge id), resolves the `DReference` via `.model`, and
  deletes **both** the reference and its void edge. (The `DReference` cascade — `case 'type'`
  / `case 'opposite'` in `Dummy.get_delete` — runs inside `DeleteElementAction`.)

- **UI gestures that already trigger it from the v2-flow canvas:**
  1. **Delete/Backspace** on a selected edge: `onKeyDown` (`EditorV2.tsx:2124-2127`) →
     `deleteSelected()` (`:1855`) → loop over `selectedEdges` →
     `syncDeleteEdge(edge.id, edge.type === 'inheritance')` (`:1888`). The selected set comes
     from RF `e.selected`, which `onEdgeClick` sets (`:2216`).
  2. **Edge context menu → "Delete reference"**: `onEdgeContextMenu` (`:2190-2199`) builds the
     menu; item at `:2630-2634` → `deleteEdge(contextMenu.edgeId)` (`:1932`) →
     `syncDeleteEdge(edgeId, edge.type === 'inheritance')` (`:1940`).
  3. Co-deletion when a node is deleted (same `deleteSelected` path).

- **Backlog B.X relevance**: B.X is about deleting a `DReference` *from the tree/panel*, which
  goes through the model cascade **without** removing the `DVoidEdge` → orphan edge at reload
  (matches discovery `2026-05-24_v2flow_reference_delete.md`). The **canvas** gestures above do
  **not** have this problem because they call `syncDeleteEdge(edge.id)`, which deletes the
  void edge explicitly. **So a canvas-triggered delete is already correct.** B.X only becomes
  relevant if a future fix routes canvas deletion through a non-canvas path (e.g. calling
  `DReference.delete()` directly from the panel after selecting it). Keep canvas delete on
  `syncDeleteEdge`.

`RF deleteKeyCode={null}` (`EditorV2.tsx:3257`) disables ReactFlow's built-in delete so the
custom `onKeyDown` is the sole keyboard path.

---

## F. UnifiedEdge selected visual — already implemented

`UnifiedEdge` consumes ReactFlow's `selected` prop and renders a `.selected` style today:

- destructured prop: `UnifiedEdge.tsx:132 selected,`
- highlight class is **separate**: `:137 const hlClass = useEdgeHighlightClass(id);`
- edge path class composes them independently (`:522-523`):
  ```ts
  ? `inheritance-edge ${selected ? 'selected' : ''} ${hlClass}`
  : `reference-edge ${kind} ${selected ? 'selected' : ''} ${hlClass}`;
  ```
- markers/labels also get `selected` (`:585`, `:640`, `:682`); BaseEdge gets `selected={!!selected}`.

The `selected` prop is driven by `onEdgeClick` setting RF `e.selected` (`EditorV2.tsx:2216`).
**`.selected` and `hl-*` already coexist** as separate class tokens — no collision. So the
selected-stroke visual is already in place and needs no new work (and must not reuse the
reserved names `.selected`, `.highlighted`, `.active`, `hl-*`).

---

## G. Critical-zone map for the eventual fix

| File | Zone | Needed for a fix? |
|------|------|-------------------|
| `EditorV2.tsx` (`onEdgeClick`, `onKeyDown`, context menu) | safe | possibly a 1-line read tweak (resolve refId) — only if §B repro shows wiring is wrong |
| `hooks/useJjomSelection.ts` (`selectElement`/`onEdgeClick`) | safe (self-contained; explicitly not a Phase-3 sync file, see its header) | **read** today; a *write* only if we choose to pass an explicit refId |
| `edges/UnifiedEdge.tsx` (styling, hit area) | safe | a *write* only if the fix is hit-target (interactionWidth / marker `pointer-events`) |
| `editors/Info.tsx` (`builder.reference`) | safe | a *write* only to add the missing **opposite** field |
| `jjomTransformers.ts` (`jjomEdgeToRFEdge`) | **CRITICAL** | **read only** — `edge.data.jjomRefId`/`reference.id` already exist; no write needed |
| `sync/syncState.ts` (`getEdgeRefId`) | **CRITICAL** | **read only** — getter already exists |
| `sync/canvasToJjom.ts` (`syncDeleteEdge`) | **CRITICAL** | **read only** — delete already correct |
| `hooks/useJjomSync.ts` | **CRITICAL** | **untouched** |

**No critical-zone *write* is required for any of the candidate fixes.** Every plausible fix
lands in the safe zone. (A Layer Impact Report is therefore likely *not-required* for Phase 2
unless the chosen fix unexpectedly needs a transformer write — which current evidence says it
does not.)

---

## Fix shape (proposed, NOT implemented)

**Gate everything on a runtime reproduction first** (§B, §5.1). Click (a) the middle of a
reference edge body, (b) a composition edge, (c) directly on a diamond marker, and capture
`store.getState()._lastSelected` after each. Three outcomes:

1. **Edge-body click already selects the `DReference` (panel shows reference fields).**
   Then the selection bug is **already fixed**; the residual problem is hit-target (clicks on
   markers / thin path falling through to the node). Minimal fix = widen the edge interaction
   target and/or set `pointer-events` on markers so marker clicks reach the edge — **safe zone**
   (`UnifiedEdge.tsx` + its SCSS). Optionally add the missing **opposite** field to
   `builder.reference()` (`Info.tsx`, safe zone) if reference editing parity is wanted.

2. **Edge-body click selects nothing useful / model info** (`modelElement` ends up `''`).
   Then `lElement.model` is failing at click time. Minimal fix = make `selectElement`'s edge
   path resolve the reference explicitly:
   `const refId = edge.data?.jjomRefId ?? getEdgeRefId(edge.id);` then
   `selectElement(refId ?? edge.id, modelid)` — entirely within **`useJjomSelection.ts`
   (safe zone)**, reading the already-existing `getEdgeRefId` (critical-zone **read** only).
   For **inheritance** edges there is no `DReference`; leave them selecting the edge id (or
   no-op) — do not synthesize a reference.

3. **Edge-body click selects the source class.** Then `onNodeClick` is firing instead of
   `onEdgeClick` (RF hit-test): same fix as outcome 1 (hit-target), still **safe zone**.

**Files that would take writes (all safe zone), by outcome:**
- Outcome 1/3: `UnifiedEdge.tsx` (+ its `.scss`); optionally `Info.tsx`.
- Outcome 2: `useJjomSelection.ts` only.

**Critical-zone files**: `jjomTransformers.ts`, `syncState.ts`, `canvasToJjom.ts`,
`useJjomSync.ts` — **read-only** for every outcome. If, contrary to this analysis, a Phase-2
fix is found to need a *write* in any of these, **stop and produce a Layer Impact Report
(§3.2) before editing.**

---

## Uncertainties (flagged)

- **Could not run the app** (read-only). The central claim — that edge click already resolves
  the `DReference` and the panel already renders it — is from static reading and **must be
  reproduced** before Phase 2. The bug report is treated as a hypothesis about a past state
  (§5.1), not a fact about the current tree.
- `lElement.model` for the void edge is asserted to be the `DReference` on the strength of two
  consumers (`jjomEdgeToRFEdge:489`, `syncDeleteEdge:344`). Not separately traced into the
  `LVoidEdge.model` getter.
- `Info.tsx` line numbers for `mapStateToProps` (~1382) and `builder.reference` (~484) are from
  the subagent; the `case 'DReference'` dispatch at `:1229` and the field set are reliable, exact
  offsets in that 1400+-line file may drift by a few lines.
- The "missing opposite field" is a real, confirmed gap in `builder.reference()` but is an
  enhancement, not the reported bug.
