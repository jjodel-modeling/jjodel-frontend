# Discovery (read-only) — Q8: EdgeHead palette & arrowhead parity for the isEdge overlay

**Date/time**: 2026-06-13 10:15
**Type**: discovery (read-only) — no source edits, no git ops
**Phase**: 2C prerequisite (arrowhead/marker parity for isEdge arcs in `EdgeOverlay`)
**Branch**: `alfonso-frontend-jjtl`

This artifact answers **Q1–Q4** about `EdgeHead` and the minimal input the `EdgeOverlay` needs to draw a native-looking arrowhead on the already-unified (post-2B) geometry. **It makes no decisions** — Q3 (Option A vs B) and Q4 (Scope-1 vs Scope-2) are left for chat, presented as neutral pros/cons tables at the end.

---

## Q1 — Where `EdgeHead` lives and its exact form

### Answer (facts)

**Definition site**: `frontend/src/common/DV.tsx:1122` — `export class EdgeHead { ... }` (ends at `:1197`).

It is a **TS `class` used as a namespace of `static` string members** — not an `enum`, not a string-union `type`, not a record. There are three kinds of members:

**(a) Discriminant / display strings** (the `type: EdgeHead` "modename" values consumed by the `switch` in `DV.edgeView`/`DV.svgHeadTail`). These are human-readable strings, **not** ids:

```ts
// DV.tsx:1123-1132
static composition = "Composition";
static aggregation = "Aggregation";
static reference   = "Association";     // note: "reference" → display "Association"
static extend      = "Extension";
static zero = "exactly zero / not present";
static one = "exactly one, required";
static many = "zero or many, optional, unbounded";
static zeroOrOne = "zero or one, optional";
static zeroOrMany = "zero or many, optional, unbounded";
static oneOrMany = "one or many, at least one";
```

**(b) `Head_*` / `Tail_*` members — SVG path `d` strings** (or `""` = "no shape"). These are the actual geometry:

```ts
// DV.tsx:1134-1162
static Head_composition = "";
static Tail_composition = "M8.5776-.9085c.6316-.522 1.6553-.522 2.2869 0l7.0948 5.8644c.6316.522.6316 1.3671 0 1.8882L10.8645 12.7085c-.6316.522-1.6542.522-2.2847 0L1.4827 6.845a1.6117 1.332 0 010-1.8882z"; // filled diamond
static Head_aggregation = "";
static Tail_aggregation = EdgeHead.Tail_composition;
static Head_reference   = "M11.354 5.646a.5.5 90 010 .708l-6.035 6.089a.5.5 90 01-.156-.116L11.375 5.999l-6.406-6.211a.5.5 90 01.208-.115z"; // open chevron ">"
static Tail_reference   = "";
static Head_extend      = "M 0 0   L x y/2   L 0 y   Z"; // <-- literal x / y tokens (template, see below)
static Tail_extend      = "";
static Head_zero        = "M-11.985 5.981A1 1 0 000 6 1 1 0 00-12 6";
static Head_one         = "M0 0V12";
static Head_many        = "M12 1 0 6 12 11H12M12 6H0";
static Head_zeroOrOne   = "M-11.985 5.981A1 1 0 000 6 1 1 0 00-12 6M6 0V12";
static Head_zeroOrMany  = "M-11.985 5.981A1 1 0 000 6 1 1 0 00-12 6M6 0M12 1 0 6 12 11H12M12 6H0";
static Head_oneOrMany   = "M0 0V12M12 1 0 6 12 11H12M12 6H0";
// all Tail_zero..Tail_oneOrMany = ""
```

**(c) Palette-dropdown label/dict members** (`uml`, `agglabel`, `asslabel`, `headdict`, `predefinedPaths`, …) — used only to build the head/tail dropdown in the Style/Palette UI (`DV.tsx:1180-1195`). `predefinedPaths` is `{k,v}[]` derived from `headdict`. **Not relevant to the overlay's render path.**

**Critical sub-fact — two of the path members are *templates*, not literal `d`:** `Head_extend = "M 0 0 L x y/2 L 0 y Z"` and the cardinality heads contain literal `x`/`y` tokens that are substituted from `view.edgeHeadSize.x/y` during palette→CSS compilation (the palette entry binds them: `x:'view.edgeHeadSize.x', y:'view.edgeHeadSize.y'`, `DV.tsx:693`). **`Head_reference` is NOT a template** — it is a fixed-coordinate chevron drawn in a ~0..12 box; `edgeHeadSize` does not scale it (it only feeds positioning/centering, see Q2/Q3).

### How it is imported

- **`DV.tsx`** — `EdgeHead` is **defined here** (`:1122`). Not imported; same-file references.
- **`VersionFixer.tsx`** — `frontend/src/redux/VersionFixer.tsx:6`: `import { DV, DPackage, DObject, EdgeBendingMode, EdgeHead } from "../joiner";` (re-exported by `frontend/src/joiner/index.ts:128`: `export {DV, EdgeHead} from '../common/DV';`).
- The same `joiner` barrel is the ground-truth import path for any future consumer (incl. the overlay): `import { EdgeHead } from '../../joiner';`.

### Implications for 2C

- The only members 2C cares about are the **`Head_*` path strings** (specifically `EdgeHead.Head_reference` for the default non-composition arrow — see Q4). They are plain importable string constants; no instance, no context.
- `EdgeHead` being a class (not an enum) means a member access like `EdgeHead.Head_reference` is a value, importable from `../../joiner` exactly like the routing helpers the overlay already imports.
- Watch the template members: if 2C ever wired `Head_extend`/cardinality heads, it would have to perform the `x`/`y` token substitution itself (the CSS pipeline that does it natively is not available to the overlay). `Head_reference` sidesteps this entirely.

---

## Q2 — Separability of the head shapes from the `DV.tsx` jsxString

### Answer (facts)

**How the native edge actually paints its arrowhead.** It is **NOT** an SVG `<marker>` / `marker-end`. It is an **inline `<path>` pair** emitted by `DV.svgHeadTail()` (`DV.tsx:602-660`) and spliced literally into the edge jsxString (`DV.tsx:867-868` build the strings; `:907-910` inject them inside the edge `<svg>`):

```ts
// DV.tsx:867-868
let head = DV.svgHeadTail("head", modename) || '';
let tail = DV.svgHeadTail("tail", modename) || '';
// DV.tsx:907-910 (inside the jsx template literal)
{ /* edge head */ }  ` + head + `
{ /* edge tail */ }  ` + tail + `
```

`svgHeadTail` returns a **JSX *string*** (two `<path>` elements: `.preview` + `.clickable content`), with **only** class + inline transform — no `d` attribute:

```ts
// DV.tsx:604-608
let headstr = head === "head" ? "segments.head" : "segments.tail";
let styleTranslateRotate = 'transform:`translate(${'+headstr+'.x}px, ${'+headstr+'.y}px) rotate(${'+headstr+'.rad}rad)`,'
    + ' transformOrigin:`${'+headstr+'.w/2}px ${'+headstr+'.h/2}px`';
let attrs = `style={{`+styleTranslateRotate+`}} className={"`+head+` `+type+` preview"}`;
// DV.tsx:655
ret = `<path ${attrs} />\n\t\t\t<path ${hoverAttrs} />`;
```

The geometry (`d`) is supplied **via CSS**, not on the element. The per-view compiled CSS binds it to a custom property `--head`/`--tail`:

```css
/* DV.tsx:788-804 (the css template literal of the edge view) */
path{ fill:none; stroke-dasharray: var(--dashing);
  &.head{ d: path(var(--head)); }   /* <-- d comes from --head */
  &.tail{ d: path(var(--tail)); }
}
path.edge.full, path.tail, path.head{ stroke: var(--stroke-color); stroke-width: var(--stroke-width); }
path.tail, path.head{ fill: var(--fill); }
```

`--head` is set from the **palette** entry `head` whose `value` is the `EdgeHead.Head_*` string (`DV.tsx:693`):

```ts
// DV.tsx:693-694
'head': {type:'path', value:headPath, options: EdgeHead.predefinedPaths, x:'view.edgeHeadSize.x', y:'view.edgeHeadSize.y'},
'tail': {type:'path', value:tailPath, options: EdgeHead.predefinedPaths, x:'view.edgeTailSize.x', y:'view.edgeTailSize.y'},
```

And position/rotation come from `segments.head` — a **template-local variable** = the `HeadPosition` `{x,y,w,h,rad}` produced by the edge's own routing (`computeHeadPosition`, see Q3), which in the native template is derived from the `LVoidEdge` + `LViewElement`.

So the native head is entangled with the template in **two** places:
1. **`d`** lives in a per-view compiled CSS custom property (`--head`), only present inside the native edge view's `<style>`.
2. **position/rotation** (`segments.head.{x,y,w,h,rad}`) is a runtime value of the native edge, needing an `LVoidEdge`/`LViewElement`.

**Is each `EdgeHead` member a reusable, context-free artifact?** The **path `d` strings are pure constants** (`Head_reference` is a fixed-coordinate chevron in a ~0..12 box; renderable given only `{x, y, rad, size, fill, stroke}`). The **rendering machinery around them is NOT reusable**: `svgHeadTail` returns a JSX string tied to template compilation and the `var(--head)` CSS variable; it cannot be called to get a React element.

**Is there an existing reusable renderer (shape + position → SVG)?** **No.**
- `svgHeadTail(head, type) → string` returns template text, not SVG/React, and references `segments.head` by name (only valid inside the compiled edge component).
- `computeHeadPosition(...) → {x,y,w,h,rad}` (`markers.ts:11`) returns **position + rotation only — not the shape**.
- There is no function/component with signature `(shapePath, pos, size, fill, stroke) → SVGElement`.

Therefore the overlay would have to **reimplement the `<path>` wrapper itself**, e.g. conceptually:
`<path d={EdgeHead.Head_reference} fill="none|transparent" stroke=… strokeWidth=… transform={`translate(x,y) rotate(rad)`} style={{transformOrigin:'center'}} />`
— matching the native transform convention (`translate(headPos.x,headPos.y) rotate(headPos.rad)`, `transformOrigin = w/2,h/2`).

**Reference-head geometry the overlay must match** (so 2C can replicate it): the `Head_reference` `d` is authored in an ~`0..12 × 0..12` user-space box (so at the native head size `size1 = 12×12` no scaling is needed); native fill for the non-composition default is `#fff0` (transparent → open outline), stroke `#777`, width `1` (see Q4 for exact values).

### Implications for 2C

- The overlay **can** draw a standalone head: import the path constant (`EdgeHead.Head_reference`) and build its own `<path>`. It **cannot** reuse `svgHeadTail` or the `var(--head)` CSS mechanism.
- 2C must reproduce the native transform contract exactly: `translate(pos.x, pos.y) rotate(pos.rad)` with `transformOrigin` at the head-box center. Where `pos` comes from is the subject of Q3.
- No migration is implied: the head is render-time only, and the constraint list (no `DVoidEdge`, no `useJjomSync`, no `graphElement.tsx`, no 2A files) is respected by reading a constant + drawing an SVG `<path>` inside `EdgeOverlay`.

---

## Q3 — Minimal input to orient a head (comparison only, no decision)

### Answer (facts)

**`computeHeadPosition` exact signature** (`frontend/src/edges/routing/classic/markers.ts:11-17`):

```ts
export function computeHeadPosition(
    isHead: boolean,
    view: LViewElement,
    zoom: GraphPoint,
    segment: EdgeSegment,
    headSize0?: GraphPoint,
): HeadPosition
```

`HeadPosition = GraphSize & { rad: number }` (`edges/routing/classic/types.ts:21`) → an object with **`{x, y, w, h, rad}`** (GraphSize supplies x,y,w,h; `rad` added). Confirms the session note. The returned `{x,y}` is the **top-left** of the head box; `{w,h}` = head size; `rad` = rotation (radians).

**What it reads off the `EdgeSegment`.** `useBezierPoints` is hard-coded `true` (`markers.ts:30`), so the active branch reads only (`markers.ts:34-41`):

```ts
if (isHead) { start = segment.end.pt;   end = (segment.bezier[segment.bezier.length-1] || segment.start).pt; }
else        { start = segment.start.pt; end = (segment.bezier[0] || segment.end).pt; }
m = GraphPoint.getM(start, end);
```

→ it touches `segment.start.pt`, `segment.end.pt`, and `segment.bezier[]` (an **empty `bezier` array is fine** — it falls back to `start`/`end`). `segment.m` is **NOT used** in the bezier branch. `view` is used **only** at `markers.ts:19`: `let tmp = headSize0 || (isHead ? view.edgeHeadSize : view.edgeTailSize);` and `zoom` is **explicitly unused** (`markers.ts:26-28`: `void _zoom`).

**Is `EdgeSegment` a discriminated union with a Line mode?** Not in the TS sense — `EdgeSegment` is a **class** (`GraphDataElements.tsx:1909-1988`) with fields `start: segmentmaker`, `bezier: segmentmaker[]`, `end: segmentmaker`, `m`, `rad`, `svgLetter: EdgeBendingMode`, … "Line mode" = `svgLetter === EdgeBendingMode.Line` (`"L"`, `types.ts:126`) with `bezier` empty. **`computeHeadPosition` never inspects `svgLetter`**, so the fabricated object does not even need it for head positioning.

`segmentmaker` (`GraphDataElements.tsx:2117`):
```ts
export type segmentmaker = {size: GraphSize, view: LViewElement, ge: LGraphElement, pt: GraphPoint, uncutPt: GraphPoint};
```
…but `computeHeadPosition` reads only `.pt` from `start`/`end`/`bezier[i]`. **Minimal fabrication** (no `DVoidEdge`, no real `segmentmaker`):
```
{ start: { pt: <GraphPoint of the leg's far end> },
  end:   { pt: <GraphPoint of the terminal point> },
  bezier: [] }  as unknown as EdgeSegment
```
(For a head, `start = segment.end.pt` is the terminal/target point and `end` is the previous waypoint; the overlay already holds both — see below.)

**`headSize0` — what it is and where defined.** It is the **5th parameter** of `computeHeadPosition` (`markers.ts:16`), an optional `GraphPoint` that, when provided, **fully bypasses the `view.edgeHeadSize`/`edgeTailSize` dependency** (`markers.ts:19`, `headSize0 || …`). There is **no global constant literally named `headSize0`**. The native head size for the non-composition default edge is `size1 = new GraphPoint(12, 12)` (`redux/store.tsx:486`, passed at `:510` for "Association"). (The `DViewElement` field default `edgeHeadSize = GraphPoint(20,20)` at `classes.ts:1195` / `view.tsx:259` is overridden per-view by `makeEdgeView`'s `size1`.) So an explicit `new GraphPoint(12,12)` reproduces Association's head size and removes the `view` dependency.

**What the overlay already holds for the terminal leg.** In the manhattan branch the routed array is `pts = [srcBorder, ...waypoints, tgtBorder]` (`EdgeOverlay.tsx:412`). The terminal leg toward the target is `pts[pts.length-2] → tgtBorder`. For `straight`, it is `srcPoint → tgtPoint` (`:392-393`). For `bezier`, the path is a cubic whose end tangent is the entry-side normal, **not** the chord of the last two control anchors (`:394-395`) — relevant to Option B accuracy.

**Native angle convention** (must be matched by either option): `Geom.mToRad(m, start, end)` (`common/Geom.ts:1212-1220`) — vertical-segment special cases (`start.x === end.x → 3π/2` or `π/2`) and a `+π` term when `start.x <= end.x`. `computeHeadPosition` additionally **re-centers** the head via a box-intersection (`markers.ts:51-79`) so the head box is centered where the leg crosses a 2×size box around the terminal point, then sets `{x,y}` to the top-left (`tmp - w/2, tmp - h/2`). A naive endpoint-anchored placement is not identical to this centering.

### Option A vs Option B (facts only)

| | **Option A — reuse `computeHeadPosition` with a fabricated Line segment** | **Option B — orient directly from the last leg (`atan2`)** |
|---|---|---|
| Inputs the overlay already has | terminal point + previous waypoint (`pts[len-2]`, `tgtBorder`) | same two points |
| Must fabricate | a `Line`-mode `EdgeSegment`-shaped object `{start:{pt},end:{pt},bezier:[]}` cast `as EdgeSegment`; a dummy `view` (or pass `headSize0` so `view` is never read — but TS still needs a value, e.g. `null as any`); `zoom = GraphPoint(1,1)` (unused); explicit `headSize0 = GraphPoint(12,12)` | nothing; compute `rad = Geom.mToRad(GraphPoint.getM(start,end), start, end)` (or `atan2`) and the head box center itself |
| New coupling | imports `computeHeadPosition` from `edges/routing/classic/markers` (same dir family the overlay already imports `points`/`round` from — allowed post-2B; no `editor-v2` import) | imports only the path constant `EdgeHead.Head_reference` from `../../joiner`; optionally `Geom.mToRad` from `../../joiner` to match the convention |
| Output | `{x,y,w,h,rad}` ready to feed the `<path>` transform exactly as the native template does | overlay computes its own `{x,y,rad}`; must replicate the box-recentering (`markers.ts:51-79`) to match native placement, or accept a sub-pixel offset |
| Pixel-parity risk | **Low** — identical math/centering as native (same function); risk limited to fabricating a correct minimal segment + a `view`/typing cast | **Medium** — must re-derive `Geom.mToRad` special cases AND the box-intersection recentering to match; easy to land "close but offset by ~half a head" |
| Bezier-mode correctness | inherits whatever segment is fabricated (overlay would fabricate from last two waypoints; for `bezier` routing the true end-tangent differs) | same bezier caveat; would need the entry-side normal, not the chord |
| Reuse / drift | shares the exact native positioning code → stays in sync if `computeHeadPosition` changes | independent reimplementation → can silently drift from native |

*(No recommendation. The deciding facts: whether 2C wants pixel-identical placement "for free" at the cost of a typing/`view` cast and importing `markers.ts` (A), versus zero routing-layer coupling at the cost of reimplementing the angle + recentering math (B).)*

### Implications for 2C

- Either option needs **no `DVoidEdge`** and **no migration** — both consume points the overlay already computes.
- The head `<path>` transform contract is the same regardless: `translate(x,y) rotate(rad)`, `transformOrigin` at box center; only the *source* of `{x,y,rad}` differs.
- `bezier` routing is a known weak spot for orientation in both options (terminal tangent ≠ last-two-waypoints chord). Default routing is `manhattan-rounded`, where the terminal leg is axis-aligned and both options are well-behaved.

---

## Q4 — L2 isEdge view fields and the default marker (report only, no decision)

### Answer (facts)

**Exact marker-relevant field set on L2 isEdge views.** Declared on `DViewElement` in `frontend/src/view/viewElement/view.tsx:276-286` (defaults in `joiner/classes.ts:1200-1210`):

```ts
// view.tsx:276-286
isEdge!: boolean;
edgeSource!: string;
edgeTarget!: string;
edgeRouting!: 'straight' | 'manhattan-rounded' | 'bezier';
edgeLabel!: string;
edgeStrokeColor!: string;          // 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted'
edgeStrokeWidth!: number;          // clamped [0.5,10]
edgeStrokeStyle!: 'solid' | 'dashed' | 'dotted';
```

The overlay reads exactly these (`EdgeOverlay.tsx:240-253`): `edgeRouting`, `edgeStrokeColor`, `edgeStrokeWidth`, `edgeStrokeStyle`, `edgeLabel` (plus `isEdge`/`edgeSource`/`edgeTarget` for resolution).

**Absence of native marker fields confirmed.** `edgeHeadSize` and `edgeTailSize` **do exist on `DViewElement`** (`view.tsx:259-260`, default `GraphPoint(20,20)` at `classes.ts:1195-1196`) — but they belong to the **native classic-edge** machinery, are **not** part of the L2 isEdge field group, and are **not read by `EdgeOverlay`**. There is **no head-shape / palette / marker-type selector field for isEdge** anywhere in the `isEdge!…edgeStrokeStyle!` block. The isEdge surface has **zero** marker fields today.

**What the native non-composition default edge draws as its head** (the parity target). Built by `makeEdgeView("Association", EdgeHead.reference, size1, …)` (`redux/store.tsx:510`) → `DV.edgeView(EdgeHead.reference, …)`:
- **shape**: `headPath = EdgeHead.Head_reference` (the open chevron `>`), `tailPath = EdgeHead.Tail_reference = ""` (no tail) — `DV.tsx:675`.
- **fill**: `EdgeHead.reference → fill = '#fff0'` (transparent ⇒ **open outline, not a filled triangle**) — `DV.tsx:665`, applied via `path.head{ fill: var(--fill) }`.
- **stroke**: palette `'stroke-color': U.hexToPalette('#777')`, `'stroke-width': {value:1}` — `DV.tsx:689-690`, applied via `path.head{ stroke: var(--stroke-color); stroke-width: var(--stroke-width); }`.
- **size**: `size1 = GraphPoint(12,12)` (`store.tsx:486`) → head box `12×12`, and `Head_reference` is authored in a ~0..12 box so it renders at native scale (no scaling).

So the single default head the overlay should match = **open `#777` chevron (`Head_reference`), ~1px stroke, transparent fill, 12×12 box**.

**Could any existing isEdge field drive head-type selection?** **No** — none of the eight isEdge fields encodes head shape/type. `edgeStrokeColor` is a *semantic token* (`default/accent/…`), not a head selector; the overlay maps it to a `var(--color-…)` (`EdgeOverlay.tsx:69-83`). Driving the head color off `edgeStrokeColor` (so the arrow matches the line) is possible **without** a new field; driving the head *shape/type* is not.

### Implications for 2C

- **Scope-1 (single fixed default head)** needs **no view-field change**: hard-code `EdgeHead.Head_reference`, transparent fill, stroke = the already-resolved overlay stroke color/width, size literal `12×12`. Fully inside the overlay; no migration; respects all 2C constraints. The only open detail is whether to color the head with the overlay's `resolveStrokeColorVar(strokeColor)` (line color) or the native fixed `#777`.
- **Scope-2 (new head-type field)** means adding a field to the `isEdge` group in `view.tsx` + default in `classes.ts` + Style-tab UI + a `VersionFixer` migration (new persisted field on existing instances) + likely a `predefinedPaths`-style selector. That touches the critical-zone view-field surface and persistence — materially larger, and it pulls in `VersionFixer`/`view.tsx`/`classes.ts`, none of which Scope-1 requires.
- **Critical-zone note for any future edit (not needed by Scope-1):** `view.tsx` (typed field surface), `classes.ts` (`Constructors.DViewElement` defaults), and `VersionFixer.tsx` are all critical-zone view-system files. Scope-2 would require the standard `jsxString`/field migration discipline (§3.9) and a Layer Impact Report; Scope-1 touches none of them.

---

## Open decisions for chat

### Q3 — Option A vs Option B (how to orient/position the head)

| | **Option A — reuse `computeHeadPosition`** | **Option B — direct `atan2` from last leg** |
|---|---|---|
| Pros | Pixel-identical to native (same code path, same box-recentering); returns `{x,y,w,h,rad}` ready to use; stays in sync if native math changes | Zero coupling to `markers.ts`/routing layer; trivial inputs (two points); no `EdgeSegment`/`view` fabrication or casts |
| Cons | Must fabricate a minimal `EdgeSegment`-shaped object + a `view`/`zoom` value (typing casts, even though `view` is unread when `headSize0` is passed); imports from `edges/routing/classic/markers` | Must reimplement `Geom.mToRad` special cases **and** the box-recentering (`markers.ts:51-79`) to match native, else a ~half-head offset; independent code can drift from native |
| Same for both | No `DVoidEdge`; no migration; consumes points the overlay already has; identical `<path>` transform contract; `bezier` routing is the weak case for orientation |

### Q4 — Scope-1 vs Scope-2 (how much surface 2C touches)

| | **Scope-1 — single fixed default head** | **Scope-2 — new head-type view field** |
|---|---|---|
| Pros | No new field; no migration; entirely inside `EdgeOverlay`; matches the prevalent native default (Association chevron); minimal risk; honors all 2C constraints | User-selectable head per isEdge view (parity with native edge palette); extensible to composition/cardinality heads |
| Cons | One head type only; not user-configurable; head color/shape decisions are hard-coded | Touches critical-zone view-field surface (`view.tsx` + `classes.ts`), Style-tab UI, and **requires a `VersionFixer` migration** for the new persisted field; larger blast radius + Layer Impact Report |
| Open detail | head color = native fixed `#777` vs the overlay's resolved `edgeStrokeColor` (line color) | which heads to expose; default value; selector UI shape |

---

**End of artifact. No source modified, no git operations performed.**
