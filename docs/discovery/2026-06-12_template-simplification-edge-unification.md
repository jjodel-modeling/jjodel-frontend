# Discovery — Default template simplification (W1) + isEdge routing unification (W2) + migration sequencing (W3)

**Type**: discovery (Phase 1, read-only). No code produced. No file modified except this report.
**Date**: 2026-06-12
**Branch**: `alfonso-frontend-jjtl`
**HEAD**: `043f21af1 docs: M1 jjscript end-to-end + prompt-render discoveries and session log` (2026-06-12 23:10:15 +0200)

> Methodology note (§5.1): every load-bearing claim below was verified by reading the
> current file on disk. Line numbers are current as of HEAD. Where a prompt-supplied path or
> line number was wrong, the correction is called out explicitly. Three questions (Q9 behavior,
> the visual parity goal of W2, runtime reproduction of any bad state) cannot be fully closed
> without running the app; these are flagged inline, not guessed.

---

## Phase 0 — Working-tree safety check (verbatim)

```
$ git status --short
 M frontend/src/components/editors/info.scss

$ git stash list
stash@{0}: On alfonso-frontend-jjtl: abandoned unified-group edge-label WIP (pre-2b')
stash@{1}: On alfonso-frontend-jjtl: Step 2.5 isolation A/B test (2026-05-01)
stash@{2}: WIP on alfonso-frontend-dev: c89c64aa2 Jjodie
```

Nothing was staged, stashed, checked out, or otherwise touched.

### ⚠️ MAJOR CORRECTION to the prompt's Phase-0 premise

The prompt states the working tree "contains THREE uncommitted streams (segment-drag fix,
composition/aggregation marker work incl. a drafted `2.221 -> 2.222` migration, EMSE artifacts)"
and instructs me to dual-report HEAD vs working-tree for `DV.tsx` and `VersionFixer.tsx`.

**This is no longer true.** As of HEAD the working tree is clean except for one unrelated file
(`frontend/src/components/editors/info.scss`). Verified:

```
$ git diff --stat HEAD -- frontend/src/common/DV.tsx frontend/src/redux/VersionFixer.tsx \
    frontend/src/utils/defaultViewTemplate.ts frontend/src/edges/routing/classic/ \
    frontend/src/model/dataStructure/GraphDataElements.tsx
   (empty — no diff)
```

All three streams the prompt expected to be uncommitted **have already landed**:

- The drafted `2.221 -> 2.222` migration is **committed and complete** (not a draft).
- A further `2.222 -> 2.223` migration (classic M1 view parity) is **also committed**.
- `DV.tsx`, `VersionFixer.tsx`, `defaultViewTemplate.ts`, `edges/routing/classic/*`,
  `GraphDataElements.tsx` are **byte-identical to HEAD** — no working-tree edits to dual-report.

**Consequence for W3**: `highestVersion` is **2.223**, not 2.221 as the prompt anticipated. The
"next free slot" is `2.223 -> 2.224`. See Q10.

`info.scss` (the one dirty file) is unrelated to this discovery and was left untouched.

---

## Path corrections (discovery-before-action, §5/§7 of CLAUDE.md)

| Prompt-supplied path | Actual path on disk |
|---|---|
| `frontend/src/components/abstract/graphElement.tsx` | **`frontend/src/graph/graphElement/graphElement.tsx`** (the prompt's path holds Dock/DockManager/tabs only) |
| `frontend/src/components/.../EdgeOverlay.tsx` (locate) | **`frontend/src/components/edgeOverlay/EdgeOverlay.tsx`** |
| `frontend/src/utils/edgeExpressionEval.ts` | correct: `frontend/src/utils/edgeExpressionEval.ts` (the function is `evalEdgeExpression`) |
| `frontend/src/joiner/markers.ts` (locate `computeHeadPosition`) | **`frontend/src/edges/routing/classic/markers.ts`** (no `joiner/markers.ts` exists) |
| `frontend/src/components/viewsEditor/DV.tsx` | **`frontend/src/common/DV.tsx`** (per CLAUDE.md §19.1); damedge edge host is `frontend/src/graph/damedges/damedge.tsx` |

---

# W1 — Template simplification

## Q1 — Interception point

**Eval pipeline (vertex, edge, and graph all share it):**

```
GraphElementComponent.render()            graphElement.tsx (entry)
  → renderView(props, v, …)               graphElement.tsx:1375   ← COMMON ANCESTOR
      → getJSXContext(vid)                 graphElement.tsx:1397   (builds `context`)
      → getTemplate3(vid, v, context)      graphElement.tsx:1401
          → getTemplate3_(…)              graphElement.tsx:747
              → tv.JSXFunction.call(context, context)   graphElement.tsx:760   ← actual eval
      → UX.ReactNodeAsElement(rnode)        graphElement.tsx:1408
      → React.cloneElement(rawRElement, injectProps)   graphElement.tsx:1512   ← wrapper injects interaction props
```

- The jsxString is compiled once into `tv.JSXFunction` in the reducer (`new Function(paramStr, body)`),
  then invoked at **`graphElement.tsx:760`**:
  `let ret = tnv.jsxOutput = (tv.JSXFunction ? tv.JSXFunction.call(context, context) : null);`

**Single code path, not several.** `renderView` (line 1375) is the one common ancestor for vertex,
edge, and graph. `EdgeComponent` (`damedge.tsx`) overrides `render()` to append segment handles but
**does not** override the jsxString eval — it reuses the parent `renderView`/`getTemplate3_`. So a
pre-eval `isEdge` interception needs to be placed in **exactly one location** and covers all element
types.

**The single best interception point: inside `renderView`, between line 1397 and line 1401**, i.e.
after `context` is built and before `getTemplate3(vid, v, context)` is called. At that point both
operands the prompt requires are simultaneously in scope:

| Operand | Variable | Site |
|---|---|---|
| `LViewElement` (the DV with `isEdge`/`edgeSource`/`edgeTarget`) | **`v`** (param of `renderView`); raw at `dv = v.__raw` | graphElement.tsx:1375, 1377 |
| `data` / `LObject` (M1 instance) | **`props.data`** (aliased `const me = props.data` at 1446) | graphElement.tsx:1375, 1446 |

The "top-level null handling" the prompt references is the existing behavior at:

- **graphElement.tsx:760** — if `tv.JSXFunction` is falsy, `rnode` is `null`.
- **graphElement.tsx:1408** — `rawRElement = UX.ReactNodeAsElement(rnode)`; a `null` rnode yields a
  `null` rawRElement.
- **graphElement.tsx:1427** — `if (addprops && rawRElement && fiximport) { …cloneElement… }`. When
  `rawRElement` is null the whole prop-injection / `cloneElement` block is **skipped**, so the node
  renders **no DOM card**. This is precisely the W1 "both edge expressions resolve → render `null`,
  EdgeOverlay draws" path, and it already works today (the current default template returns
  `… ? null : <View>…`, see Q3/Q5).

> The prompt's cited lines **1376 / 1395 / 1526 drifted**. Current reality:
> - `1376` → part of the `renderView` signature continuation (the method opens at 1375). ✔ close.
> - `1395` → `isMainView` computed at 1396; the null path is really 1408 + the 1427 guard.
> - `1526` → an *error*-view fallback inside the inject-props `catch` (1521–1533), **not** a
>   top-level-null handler. The real top-level-null skip is the **1427 guard**, not 1526.

**Interception design that fits this pipeline (for Phase 2, not implemented here):** inside
`renderView`, before line 1401, when `v.isEdge === true`:
resolve `evalEdgeExpression(props.data, v.edgeSource)` and `…(props.data, v.edgeTarget)`;
- both resolve → set `rnode = null` (fall straight to 1408; the 1427 guard skips the card; EdgeOverlay draws);
- at least one unresolved → set `rnode = <EdgeFallbackCard …/>` (a native React element; it flows through
  1408 → 1427 → `cloneElement`, inheriting selection/drag/props — see Q4);
- not an edge view → unchanged: call `getTemplate3` and evaluate the user template as today.

This removes every `view.isEdge` branch and the `length === 2` heuristic from the jsxString.

**`isEdge`/`edgeSource`/`edgeTarget` are not referenced in graphElement.tsx today** — they are plain
`DViewElement` fields (defaults set in the DViewElement constructor: `isEdge=false`,
`edgeSource=''`, `edgeTarget=''`, `edgeRouting='manhattan-rounded'`), exposed on the L-proxy `v` via
the generic `get_` trap, and currently read only inside the jsxString and inside EdgeOverlay.

---

## Q2 — `evalEdgeExpression` reusability

- **File**: `frontend/src/utils/edgeExpressionEval.ts`.
- **Export**: `export function evalEdgeExpression(data: any, expr: string): any | null` (line 64). Also
  registered globally as `windoww.evalEdgeExpression` at `frontend/src/joiner/ExecuteOnRead.ts:129`
  (imported there at line 17). The jsxString uses the `windoww.` form; TS code can import the symbol directly.
- **Signature / contract**: `(data, expr) → LObject-shaped value | null`. Supports dot access
  (`$source.value`), single numeric bracket access (`values[0]`), multi-level navigation. Returns
  `null` for unsupported syntax, primitives, or any failure. Output guard: returns the value only if
  `result && typeof result === 'object' && result.id && result.className`.
- **Purity**: fully pure — no React hooks, no side effects, **never throws** (documented and verified;
  the function body is a single guarded loop). Safe to call inside `renderView`.
- **Circular-import risk: NONE.** The file has **zero `import` statements** (verified: `grep -c '^import'`
  = 0). It imports nothing from `graphElement.tsx` or its dependency graph, so importing it at the
  Q1 interception point cannot create a cycle.

---

## Q3 — Overlay / template coordination today

`EdgeOverlay.tsx` decides whether to draw an arc for an isEdge instance in its Redux selector
`buildSelectorResult` (lines 217–258):

```ts
const sourceL = safeEval(evalFn, lObj, view.edgeSource);   // EdgeOverlay.tsx:229
const targetL = safeEval(evalFn, lObj, view.edgeTarget);   // :230
if (!sourceL || !targetL) continue;                        // :231  ← skip drawing if either unresolved
```

This **exactly duplicates the template guard**. The current jsxString gate (defaultViewTemplate.ts:93–100):

```js
var src = windoww.evalEdgeExpression(data, view.edgeSource);
var tgt = windoww.evalEdgeExpression(data, view.edgeTarget);
return src && tgt ? true : false;   // true → template returns null → overlay draws
```

Both compute `evalEdgeExpression(data, edgeSource)` and `…(edgeTarget)` and gate on "both truthy".
Today they run **independently** (once in the template, once in the overlay selector). After W1, the
single TS check in `renderView` (Q1) produces the resolution result; the overlay's lines 229–231 are
the consumer that should read the **same** result.

**Where the overlay consumes the resolution downstream:** after lines 229–231 it converts both
endpoints to rectangles (`getNodeRect`, line 233–234), reads the per-view stroke/label fields
(`view.edgeStrokeColor/Width/Style`, `view.edgeLabel`, `view.edgeRouting`, lines 238–255), and pushes
an `EdgeData {id, srcRect, tgtRect, routing, strokeColor, strokeWidth, strokeStyle, labelText}` (line
257). The rect computation needs the L-node geometry of `sourceL`/`targetL`, which the overlay
resolves from L-layer position (`getNodeRect`, lines 527–577). So the shared output the two systems
agree on is just the **pair of resolved endpoint LObjects** (`sourceL`, `targetL`); the overlay still
needs its own rect/style derivation after that.

---

## Q4 — Fallback card feasibility (wrapper vs template responsibilities)

The wrapper (`GraphElementComponent` in graphElement.tsx; node measurement via
`MeasurableComponent`, `frontend/src/components/forEndUser/Measurable.tsx:39`) owns **all** of
selection, drag, and the properties-panel link. The template content owns none of it. Confirmed:

- **Selection** is read from Redux by the wrapper and injected as a className on the template root:
  `isSelected = this.props.node.__raw.isSelected` → pushes `selected-by-me` / `selected-by-others`
  into `classes` (graphElement.tsx ~1314–1320), then `className: classes.join(' ')` is applied via
  `cloneElement` (1467 + 1512). Native content gets the same class.
- **Drag** handlers are injected by the wrapper onto the root in `injectProps`:
  `onMouseDown: this.onMouseDown` (and onMouseUp/Move/Click/Wheel) at graphElement.tsx:1468–1477;
  position is driven by `--top`/`--left` CSS vars the wrapper sets (`styleoverride['--top'/'--left']`,
  ~1240–1241). jQuery-UI draggable is attached to the rendered root element, not to template JSX.
- **Properties-panel link**: wrapper-owned. `onMouseUp → doOnClick` toggles selection and dispatches
  `SetRootFieldAction.new('_lastSelected', {node, view, modelElement: props.data?.id})` (~985–989).
  No template involvement.
- **Root class-name assumption**: the wrapper requires the template to return **a single valid React
  element** (it calls `React.cloneElement(rawRElement, injectProps)` at 1512 and adds
  `mainView`, the model className, etc. via `classes.push("mainView", dv.id)` at 1450). It does **not**
  require any specific incoming className like `root`. A native `EdgeFallbackCard` therefore must be:
  one root element, accepting an injected `className`/`style`/event-handler props (i.e. spread them
  onto its outermost element). Returning a Fragment would break `cloneElement`.

So `EdgeFallbackCard` rendered as native React (instead of compiled-jsxString output) remains
**selectable, draggable, and properties-panel-linked**, because those live in the wrapper.

**Reusable `default-view.scss` rules** (`frontend/src/styles/default-view.scss`):

```scss
&--edge-fallback {                          // ~168–182
    border-style: dashed;
    border-color: #06b6d4;
    background: #ecfeff;
    .jjodel-default-view__edge-preview { display: block; color: #0e7490; font-style: italic; }
    .jjodel-default-view__hint { display: none; }
}
&--edge-like {                              // ~134–159
    min-width: 140px; padding: 8px 10px;
    .jjodel-default-view__header { margin-bottom: 6px; }
    .jjodel-default-view__name { font-size: 12px; }
    .jjodel-default-view__type { font-size: 10px; padding: 1px 6px; }
    .jjodel-default-view__edge-preview { display: block; }
    .jjodel-default-view__hint { display: none; }
}
```

An `EdgeFallbackCard` reusing classes `.jjodel-default-view.jjodel-default-view--edge-like.jjodel-default-view--edge-fallback`
plus the `__header / __name / __type / __edge-preview` sub-structure inherits these as-is.
(Exact line numbers should be re-confirmed against the file before Phase 2 edits — the SCSS block
was located by an agent read, not hand-verified line-by-line.)

---

## Q5 — Template variants in the wild

`DEFAULT_VIEW_JSX_STRING` (the **vertex/edge-like** default; distinct from the classic Object/Value/
Singleton templates, see below). History per `git log -- defaultViewTemplate.ts` + the file's own
header comments and the migrations that consume it:

| Revision | Introduced / rewritten by | Stable, collision-free marker | Notes |
|---|---|---|---|
| pre-redesign placeholder | (before 2.211) | `LEGACY_PLACEHOLDER_MARKER = 'To add information here,'` (defaultViewTemplate.ts:143) | matched + replaced by migration `2.211 -> 2.212` (VersionFixer.tsx:625–627) |
| v4 redesign ("minimal clean", 2.2) | migration `2.211 -> 2.212` (VersionFixer.tsx:627) | `V2_2_TO_V2_3_DETECT_MARKER = 'Customize this view'` (defaultViewTemplate.ts:155) **but** disambiguated by the **absence of `view.isEdge`** | the hint phrase alone is ambiguous (kept across versions) |
| v2.3 (current, L2 isEdge) | migration `2.213 -> 2.214` (VersionFixer.tsx:678–681) | `'Customize this view'` **plus presence of `view.isEdge`** | the current `DEFAULT_VIEW_JSX_STRING` (defaultViewTemplate.ts:93–133): top-level `(IIFE)? null : <View …>`, edge-preview IIFE, `length === 2` heuristic |

Migration mechanics for the marker pair (verified, VersionFixer.tsx:625 and :678):
`2.211 -> 2.212` rewrites only jsxStrings containing `LEGACY_PLACEHOLDER_MARKER`;
`2.213 -> 2.214` rewrites only jsxStrings containing `V2_2_TO_V2_3_DETECT_MARKER` **and not**
`view.isEdge`. Both overwrite with the **current** `DEFAULT_VIEW_JSX_STRING` constant.

**Implication for W1**: because both old migrations point `e.jsxString = DEFAULT_VIEW_JSX_STRING`, the
moment W1 simplifies that constant, those two migrations will (correctly) emit the simplified template
for ancient stale views. But **no existing migration rewrites the current v2.3 template** — those
projects sit at `highestVersion` already and are untouched by 2.211/2.213. A **new** migration is
required to rewrite the live v2.3 jsxStrings to the simplified form, and it needs a **new marker that
is present in v2.3 but absent from the simplified template**. Candidates that are stable and unique to
v2.3: the substring **`jjodel-default-view--edge-like`** combined with **`view.isEdge`** /
`references.length === 2` (all of which the simplified template removes). The simplified template will
presumably keep the `'Customize this view'` hint, so the new marker must NOT rely on that phrase alone.

**Rule (confirmed)**: migrations must rewrite only jsxStrings still byte-/marker-matching a known
default; the `2.211`/`2.213` predicates already enforce this (marker `includes` + the absence guard).
User-customized views (which don't contain the exact marker pattern, or which carry `clonedCounter`)
are never rewritten. Preserve this discipline for the W1 migration.

> Note: the prompt's "2.212 redesign (v4)" and "2.214 template (v2.3)" naming maps to the table above.
> `git log -- defaultViewTemplate.ts` shows no *intermediate* revision between v2.2 and v2.3 that a
> migration missed — the only two consumers that rewrite to `DEFAULT_VIEW_JSX_STRING` are 2.211 and 2.213.

**Separate template family (do not conflate):** the classic **Object/Value/Singleton** M1 templates
(`CLASSIC_OBJECT_VIEW_JSX` / `CLASSIC_VALUE_VIEW_JSX` / `CLASSIC_SINGLETON_VIEW_JSX`,
defaultViewTemplate.ts:188–234) with markers `CLASSIC_OBJECT_VIEW_MARKER='jjodel-classic-object v3'`
(and value/singleton equivalents, :184–186), rewritten by migration `2.222 -> 2.223`. These are
node-content templates, **not** the isEdge default, and are out of W1's scope — but they share the
file and the VersionFixer, so the W1 migration must coexist with `2.222 -> 2.223` (see Q10).

---

# W2 — Routing unification (interpretation A)

## Q6 — Classic router API surface

Module `frontend/src/edges/routing/classic/` (re-exported via `index.ts`):

| Function | Signature | Purity / inputs |
|---|---|---|
| `computeRouting(input: RoutingInput): RoutingOutput` (`segments.ts:20`) | takes `RoutingInput` (see below) | **NOT pure** — needs full live L-layer. Drives `computePoints` → corner insertion → `EdgeSegment[]` → `snapSegmentsToBorders` → `setLabels` → `makeD` → `computeHeadPosition`. Has a debug side-effect `windoww.edge = l` (segments.ts:41). |
| `computePoints(allNodes, outer, edgeId, innermost, root, anchorStart, anchorEnd, isFollowingCoords, startFollow, endFollow): segmentmaker[]` (`points.ts:21`) | — | **NOT pure** — reads `ge.__raw`, `ge.outerSize/innerSize`, `ge.view`, `dge.anchors`, `view.edgeStartOffset`, `innermost.translateSize`. Requires L proxies. |
| **`chooseManhattanSidesAndWaypoints(aSrc: GraphPoint, sizeSrc: GraphSize, aTgt: GraphPoint, sizeTgt: GraphSize): GraphPoint[]`** (`points.ts:257`) | pure geometry | **PURE** — documented "reads only the two points and sizes, no store/proxy access" (points.ts:254–255). Returns the ordered interior Manhattan corner waypoints between two attachments (stub-exit + port-route around boxes; `MANHATTAN_STUB = 16`). **This is the reusable core.** |
| `computeHeadPosition(isHead, view: LViewElement, zoom: GraphPoint, segment: EdgeSegment, headSize0?: GraphPoint): HeadPosition` (`markers.ts:11`) | — | Needs an `LViewElement` (for `edgeHeadSize`/`edgeTailSize`) and a built `EdgeSegment` (reads `.start.pt`, `.end.pt`, `.bezier`, `.m`). Returns `{x,y,w,h,rad}` — **position + rotation only, not the arrowhead shape**. |
| `snapSegmentsToBorders(v: LViewElement, ret, fillSegments): void` (`snap.ts:12`) | — | Needs `LViewElement` (gap mode, cut flags) + `EdgeSegment[]` carrying `.size`. |
| `setLabels(segments, allNodes: LGraphElement[], longestLabel, labels, edgeProxy: LVoidEdge, edgeId): void` (`labels.ts:50`) | — | Needs `LGraphElement[]`, `LVoidEdge`. |
| `svgLetterSize(mode, addM, doublingMidPoints): {first, others}` (`stride.ts:3`) | pure | **PURE** — switch on `EdgeBendingMode`. |

`RoutingInput` (types.ts:31–46) demands: `allNodes: LGraphElement[]`, `edge: LVoidEdge`,
`edgeId: Pointer<DVoidEdge>`, `view: LViewElement`, `innermostGraph: LGraph`, `rootGraph: LGraph`,
anchors, follow coords, labels, `outer: boolean`.

**Key answer (the crux of W2):** `computeRouting` operates on **live `LVoidEdge` / `LGraphElement` /
`LViewElement` / `LGraph` proxies and a real `DVoidEdge` pointer** — none of which exist for an isEdge
instance (the binding architectural constraint is that isEdge does **not** create a `DVoidEdge`/`DEdge`,
and `useJjomSync` is untouchable). Therefore **`computeRouting` cannot be called as-is to route an
overlay arc.** The minimal pure input set to route between two arbitrary bounding boxes with no DEdge
in state is satisfied **only** by `chooseManhattanSidesAndWaypoints(GraphPoint, GraphSize, GraphPoint,
GraphSize) → GraphPoint[]` (plus `GraphPoint`/`GraphSize`, both constructable standalone from `joiner`).

**Can `EdgeSegment` be constructed standalone?** (`GraphDataElements.tsx:1909`, ctor at `:1939`):
`new EdgeSegment(start: segmentmaker, mid: segmentmaker[], end: segmentmaker, svgLetter, gapMode,
index, prevSegment)`. The `segmentmaker` type (`:2116`) is
`{size: GraphSize, view: LViewElement, ge: LGraphElement, pt: GraphPoint, uncutPt: GraphPoint}` — so the
type **demands** `view` (LViewElement) and `ge` (LGraphElement). **However**, for `EdgeBendingMode.Line`
the constructor reads neither: it only stores fields and validates `bezier.length` (the `addBezierPoint`
path that touches `.pt`/`.uncutPt` runs only for `Bezier_QT`/`Bezier_CS`). And **`makeD` (`:2002`) reads
only `this.start.pt`, `this.end.pt`, `this.bezier[].pt/.uncutPt`, `this.svgLetter`** — never `.view`,
`.ge`, or `.size`. So an `EdgeSegment` can be built standalone for Line mode by casting dummy/undefined
`view`/`ge`/`size` into the `segmentmaker` shape; `makeD` then yields a correct `d`. This is workable but
type-hostile (you fight the `segmentmaker` interface). It is **not** required if the overlay instead
reuses `chooseManhattanSidesAndWaypoints` + its own path emitter — which is the cleaner route.

## Q7 — Overlay pipeline mapping

Overlay geometry today (all in `EdgeOverlay.tsx`, computed **per-edge inside `EdgeRenderItem`**,
lines 361–437):

| Overlay function | In/out | Classic-router equivalent | Gap |
|---|---|---|---|
| `chooseSides(srcBbox, tgtBbox)` (:598) | bbox pair → `{srcSide, tgtSide}` (always same-axis, hysteresis 1.05) | `manhattanSideOf` (points.ts:138, **private**) | different model: classic derives side from the anchor's *relative position inside the node* + center-faces-other; overlay derives from the *dominant gap axis*. Not a drop-in. |
| `sideMidpoint(bbox, side)` (:625) | bbox+side → point on side center | `manhattanBorderPoint` (points.ts:154, **private**) | classic projects the anchor onto the border (keeps along-side coord); overlay always uses side *center*. |
| `buildPathFromSides(srcPt, srcSide, tgtPt, tgtSide)` (:644) | → `M…L…` 2-/3-segment polyline | `manhattanCompactConnector` / `manhattanPortRoute` (points.ts:201/220, **private**), surfaced via `chooseManhattanSidesAndWaypoints` (:257, **exported, pure**) | classic guarantees the path never enters either node interior (port router around boxes); overlay's 3-segment Z does not. **`chooseManhattanSidesAndWaypoints` is the public entry to replace `chooseSides`+`sideMidpoint`+`buildPathFromSides` wholesale.** |
| `roundManhattanPath(rawPath, 8)` (:396, imported from `editor-v2/utils/edgeUtils:512`) | path → rounded path, **radius 8** | classic rounding is **`LVoidEdge.roundManhattanCorners(d, R=5)`** (`GraphDataElements.tsx:2385`, **private static**, quadratic `Q` fillet, R=5) — **not in `edges/routing/classic/`** | radius differs (overlay **8** vs native **5**); the classic fillet is a private static in GraphDataElements, **not currently importable**. To unify it must be exported/extracted into the classic module. |
| `bezierPath(...)` (:449) | bezier mode | classic Bezier path via `EdgeSegment.makeD` (svgLetter C/Q) | different parameterization. |
| `clipToRect(...)` (:701) | — | — | **DEAD — not called** (documented :695). |

**Corner-radius values (both systems), verified:**
- **Native classic edges**: `roundManhattanCorners(d, R = 5)` — `GraphDataElements.tsx:2385`. `get_d`
  (`:2368–2376`) applies it only when `bendingMode === Manhattan`; the per-segment `dpart` stays sharp.
- **EdgeOverlay**: `roundManhattanPath(rawPath, 8)` — `EdgeOverlay.tsx:396` (the `editor-v2/utils/edgeUtils`
  function's own default is **4**, `:512`; flow callers use 4, e.g. `:713`, `CORNER_RADIUS=4` at `:1153`).

So "visually identical to native edges" (the W2 goal) implies changing the overlay from **radius-8
`roundManhattanPath`** to the **radius-5 `roundManhattanCorners`** fillet, AND swapping its side/path
logic to `chooseManhattanSidesAndWaypoints`. The prompt's "pending corner-radius prompt" reducing the
classic radius would move R=5 lower; track that value before locking the overlay to it.

> ⚠️ Cannot be closed without running the app: whether, after this swap, overlay arcs are *pixel*-
> identical to native edges. The two systems differ in (a) where they attach on the node (border
> projection vs side center) and (b) interior-avoidance routing. They will be *closer*, but
> "identical" is an empirical claim that needs a side-by-side render (§5.1 sub-rule: validate the
> output, not the comparator). Flagged, not asserted.

## Q8 — Markers reusability

- `computeHeadPosition` (markers.ts:11) computes **position + rotation** of a head/tail:
  `HeadPosition = GraphSize & {rad}` = `{x, y, w, h, rad}`. It needs an `LViewElement` (only for
  `edgeHeadSize`/`edgeTailSize`, both bypassable via the `headSize0` arg) and a built `EdgeSegment`
  (reads `.end.pt`, `.start.pt`, `.bezier`, `.m`). It does **not** draw the arrowhead.
- **The arrowhead *shape* is not in `edges/routing/classic/`.** The visual marker palette (the
  `EdgeHead.*` path constants, e.g. `EdgeHead.Head_reference`, `EdgeHead.Tail_composition`) is consumed
  by the native edge view jsxString in **`DV.tsx`** and by migration `2.221 -> 2.222` (VersionFixer).
  markers.ts gives you only *where* and *at what angle* to place a head.
- So an overlay arrowhead minimally needs: **terminal segment direction** (last segment's
  `start.pt`/`end.pt`), a **size**, and a **shape+fill** (a small SVG `<path>`/`<polygon>` the overlay
  renders itself, oriented by `rad`). Reusing `computeHeadPosition` is *possible* — feed it a fabricated
  Line-mode `EdgeSegment` + `headSize0` — but it returns geometry, not a renderable head, and the
  isEdge L2 views carry `edgeStrokeColor/Width/Style/edgeLabel/edgeRouting`, **not** the native
  `edgeHeadSize/edgeTailSize/palette` fields, so `headSize0` would have to be supplied by the overlay.
- **Dependency on the (now committed) marker work in `DV.tsx`**: the composition/aggregation head/tail
  changes are committed (migration `2.221 -> 2.222`); no uncommitted marker edits remain (Phase 0). If
  the overlay wants true visual parity including arrowheads, it must replicate or import the `EdgeHead.*`
  shape constants — locate where they live (`EdgeHead` enum/const; referenced from `VersionFixer.tsx`
  and `DV.tsx`) before Phase 2. **This was not exhaustively traced in this read-only pass** — flagged.

## Q9 — Overlay memoization status

**The L2-session memoization fix IS applied** in current code:

- The Redux subscription uses a **custom equality comparator**: `useSelector(state =>
  buildSelectorResult(state, graphid), selectorResultEqual)` (EdgeOverlay.tsx:110–113). `selectorResultEqual`
  (:284) compares the 4 transform numbers + per-edge `{id, routing, stroke*, labelText, srcRect, tgtRect}`,
  so irrelevant dispatches become no-ops at the selector layer.
- Each edge renders through **`React.memo(EdgeRenderItem, edgePropsEqual)`** (:361/:426/:428). Path `d`
  is computed **inside `EdgeRenderItem`** (chooseSides/sideMidpoint/buildPathFromSides/roundManhattanPath,
  lines 382–397), so during pan only the parent `<g transform>` (:130) changes and every child memo-hits.

**Where the classic-router calls would go without reintroducing per-dispatch recompute:** keep the
selector (`buildSelectorResult`) doing only resolution + rect/style extraction (cheap, it already runs
every dispatch but commits via the custom equality); put the routing/rounding (the would-be
`chooseManhattanSidesAndWaypoints` + `roundManhattanCorners`) **inside `EdgeRenderItem`** (replacing
lines 382–397), where memoization already caches it per-edge. Do **not** move routing into the selector
body — that runs on every dispatch for every edge.

---

# W3 — Migration inventory & sequencing

## Q10 — Migration chain and sequencing

- **`highestVersion` is auto-derived** from method names (VersionFixer.tsx:30, computed in `setup()` at
  :82–101: `Math.max(highestVersion, to)`). **Current value: `2.223`** (NOT 2.221 as the prompt
  assumed — see Phase 0). Migration methods from 2.218 onward (verbatim, with lines):

  ```
  836  private ['2.218 -> 2.219'](s): DState { return s; }         // no-op
  841  private ['2.219 -> 2.220'](s): DState { return s; }         // no-op
  851  private ['2.220 -> 2.221'](s): DState { … }                 // edge views Line→Manhattan (bendingMode flip; NO jsxString)
  880  private ['2.221 -> 2.222'](s): DState { … }                 // composition/aggregation head/tail/fill palette (NO jsxString)
  926  private ['2.222 -> 2.223'](s): DState { … }                 // classic Object/Value/Singleton jsxString rewrite (REWRITES jsxString)
  ```

- **The "uncommitted `2.221 -> 2.222` draft" the prompt references is committed and complete**
  (VersionFixer.tsx:880–924): it adds a target arrow to composition & aggregation default edge views,
  drops composition's tail diamond, switches its fill `#6A6A6A → #fff0`, keyed on stable ids
  `Pointer_ViewEdgeComposition` / `Pointer_ViewEdgeAggregation`, per-slot conditional + idempotent, sets
  `css_MUST_RECOMPILE`. It does **not** touch jsxString. Not a stub.

- **`updateDefaultView` interplay (the load-bearing sequencing fact):**
  `LViewElement.updateDefaultView(v, state)` (`view/viewElement/view.tsx:1739–1757`) replaces a default
  view wholesale from the in-memory `Defaults.defaultViewsMap[v.id]` (sourced from `DV.tsx` at boot).
  VersionFixer calls it (VersionFixer.tsx ~139–141) for **every** view where
  `v.version !== highestVersion && !v.clonedCounter`. So **at ANY version bump**, every *untouched*
  default view (clonedCounter undefined) is regenerated from current source; only *touched*
  (clonedCounter set) defaults are skipped and require an explicit migration to rewrite their jsxString.

  **What this implies for a view still carrying the OLD template when the bump fires:**
  - *Untouched* old-template views → regenerated **automatically** from `DV.tsx`/the constants on bump.
    If W1's simplified template is wired into the `Defaults` map (via DV.tsx / `newDefault`), these get
    the new template **for free** at the next bump — no per-view migration logic needed for them.
  - *Touched* old-template views (clonedCounter set, i.e. the user opened/edited the default) → **not**
    regenerated; they keep the old jsxString **unless the new migration explicitly rewrites them** by
    marker match (the Q5 marker discipline). This is exactly why migrations `2.220/2.221/2.222`/`2.223`
    each say "additionally covers the touched (clonedCounter) defaults updateDefaultView skips."

- **Sequencing options for the W1 template migration (reported, not decided):**
  1. **Separate new bump `2.223 -> 2.224`** — cleanest; W1 lands as its own migration after the
     committed markers/parity work. Detection marker = a substring present in v2.3 but absent from the
     simplified template (Q5). `updateDefaultView` regenerates untouched defaults; the migration covers
     touched ones.
  2. **Consolidate into an existing un-released bump** — not applicable: `2.221→2.222` and `2.222→2.223`
     are already committed/released, so they must not be edited retroactively (would silently change
     migration semantics for projects mid-chain). → Option 1 is the only technically safe choice.
  - **Constraint favoring Option 1**: because `updateDefaultView` fires at the bump and regenerates
    untouched defaults from `DV.tsx`, W1 **must also update the `Defaults`-map source** (the constant the
    map reads) in the same change — otherwise untouched views regenerate to the *old* template while
    touched views migrate to the *new* one, producing a split-brain. The migration + the source constant
    + (if W1 introduces native `EdgeFallbackCard` rendering instead of a jsxString) the `renderView`
    interception must ship together. This is the §3.9 trigger: touching `defaultViewTemplate.ts`/`DV.tsx`
    ⇒ add a VersionFixer migration.

---

## Layer Impact Report (Phase-2 consumers — required, critical-zone files)

Listing every consumer/import site the planned Phase-2 W1/W2 changes would touch, and the layers.

### `frontend/src/utils/defaultViewTemplate.ts` (W1)
Consumers of `DEFAULT_VIEW_JSX_STRING` (verified by grep):
- `utils/lastViewpoint.ts:10` (import), `:192` — `createViewInWorkbench` seeds new views with it (every
  newly created Default view).
- `view/viewElement/view.tsx:49` (import), `:309` — `DViewElement.newDefault` seeds the jsxString;
  feeds the `Defaults.defaultViewsMap` that `updateDefaultView` regenerates from.
- `redux/VersionFixer.tsx:17` (import), `:627` (migration `2.211→2.212`), `:681` (migration `2.213→2.214`)
  — rewrite stale jsxStrings to this constant.

Markers `LEGACY_PLACEHOLDER_MARKER` / `V2_2_TO_V2_3_DETECT_MARKER` consumed only by VersionFixer
(`:625`, `:678`). **Layers affected**: view runtime (jsxString text) + persistence (Redux project
state) + migration. A simplified constant propagates to all three consumers automatically — that is the
intended leverage, but it means the migration and the constant must change together (Q10).

### `frontend/src/redux/VersionFixer.tsx` (W1 + W3)
- New migration method `2.223 -> 2.224` (the only safe slot). Auto-bumps `highestVersion`.
- Must coexist with committed `2.220→2.221`, `2.221→2.222`, `2.222→2.223`.
- **Layers**: persistence / Redux serialization (rewrites `e.jsxString` on `DViewElement` in
  `s.idlookup`). No D/L proxy or sync-layer involvement.

### `frontend/src/common/DV.tsx` (W1 source-of-truth + W2 markers)
- The `Defaults`-map source for default views; `updateDefaultView` reads from here at every bump. If W1
  changes the default *template* (vs. moving logic to native React), the DV.tsx source backing the
  `Defaults` map must change in lockstep (Q10 constraint). If W2 wants arrowhead parity, the `EdgeHead.*`
  shape palette referenced here is the source to replicate/import (Q8).
- **Layers**: view runtime. Touching it is a §3.9 migration trigger.

### Files NOT in the prompt's DOVE that Phase 2 would nonetheless touch (flagged per §1/§4.1):
- **`frontend/src/graph/graphElement/graphElement.tsx`** — W1's single interception point lives in
  `renderView` (Q1). This is the most consequential Phase-2 edit and was **not** in the read list under
  its real path (the prompt listed it under a wrong path). It is in the rendering layer (not sync/D-L),
  but it is a large, shared, hot file (`render` for every node/edge). Touching it needs its own scope
  call-out.
- **`frontend/src/components/edgeOverlay/EdgeOverlay.tsx`** — W2's routing swap. Mounted at
  `components/abstract/tabs/ModelTab.tsx:47` (`<EdgeOverlay graphid={graphid} />`) — single mount site.
- **`frontend/src/edges/routing/classic/`** (likely `points.ts` / a new export, or extracting
  `roundManhattanCorners` out of `GraphDataElements.tsx`) — W2 needs `chooseManhattanSidesAndWaypoints`
  (already exported) and, for rounding parity, an **exported** fillet function (today it's a private
  static in GraphDataElements:2385). Currently `edges/routing/classic` is imported by **only**
  `GraphDataElements.tsx`; EdgeOverlay would be the second consumer.

### Dependency-direction / cycle check for W2 (per the June "no coupling con editor-v2" constraint)
- `edges/routing/classic/*` imports **nothing** from `editor-v2` (verified: grep = none). The June rule
  (classic router must not import FROM editor-v2) is intact.
- The W2 direction is the **opposite**: `EdgeOverlay` (components) importing FROM `edges/routing/classic`.
  Nothing in `joiner/`, `model/`, or `edges/` imports `edgeOverlay` (verified: grep = none), so this
  introduces **no import cycle**. (There is a pre-existing, tolerated cycle between
  `GraphDataElements.tsx` ↔ `edges/routing/classic` — they import each other via type-only + runtime
  function imports; W2 does not add to it as long as the overlay pulls the *pure* `points.ts` export and
  avoids dragging in `computeRouting`/`EdgeSegment` from GraphDataElements.)
- **Caveat**: `EdgeOverlay` already imports `roundManhattanPath` from `editor-v2/utils/edgeUtils`
  (`:4`). W2 interpretation A *removes* that editor-v2 dependency in favor of the classic module — a
  net reduction in cross-package coupling, consistent with the constraint.

---

## Open items that require running the app (not guessed)
1. Pixel-identity of overlay arcs vs native edges after the W2 swap (Q7) — needs a side-by-side render.
2. Exhaustive trace of the `EdgeHead.*` shape palette and its current location (Q8) — not fully traced
   in this read-only pass.
3. Re-confirm `default-view.scss` `--edge-fallback`/`--edge-like` line numbers against the file before
   Phase 2 (Q4 numbers came from an agent read).

## Hard stop
Analysis only. No source modified, nothing staged/stashed/committed. Phase-2 implementation deferred to
the project chat per the two-phase discipline.
