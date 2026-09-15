# Discovery — composition filled-diamond marker in native Classic edges

**Date**: 2026-06-08
**Type**: discovery (read-only)
**Scope**: map how the composition filled diamond is produced, so it can later be removed surgically. No code changed.

---

## TL;DR

- The diamond is **parametric**, not a hardcoded `<polygon>`/`<marker>` in the `jsxString` and not chosen in `markers.ts`. It is the **`tail` palette value** (`EdgeHead.Tail_composition`, a closed quadratic-curve path) of the `Pointer_ViewEdgeComposition` view, drawn by CSS `.tail { d: path(var(--tail)) }` and filled with `var(--fill) = #6A6A6A`.
- The diamond **geometry is shared with aggregation** (`Tail_aggregation = EdgeHead.Tail_composition`); the only difference is fill (`#6A6A6A` filled vs `#fff` hollow). It is **not** shared with arrowheads (`Head_reference`) or the inheritance triangle (`Head_extend`).
- **Minimal removal**: one line — `DV.tsx:676`, composition case `tailPath = EdgeHead.Tail_composition` → `tailPath = ''`. Composition-only; the shared constant stays intact for aggregation + the palette dropdown.
- **Propagation correction**: the Manhattan bump **`2.220 -> 2.221` is already COMMITTED** (HEAD contains it, `VersionFixer.tsx` is clean, `highestVersion = 2.221`). It is **not pending**, so the diamond removal **cannot ride on it**. A **new bump `2.221 -> 2.222` is required** — both to re-fire `updateDefaultView` for untouched views and to carry an explicit palette-tail rewrite for user-touched views.
- **No side effects / no guard**: emptying a marker path is an already-proven state (Association's tail and every head are already `""`). `computeHeadPosition` reads `edgeTailSize` (the size), never the path, and returns a safe zero-size object if the size is absent — `segments.tail` is never `undefined`. The edge `d`/`dpart` geometry is independent of the marker, so there is no gap.

---

## Q1 — What renders the composition filled diamond?

**Answer: (a) a parametric `tail` field on the edge view's palette + a `fill`.** Full chain:

1. View creation: `makeEdgeView("Composition", EdgeHead.composition, undefined, size2, false)` — `store.tsx:514` → `DV.edgeView(EdgeHead.composition, …, name="Composition")` — `store.tsx:505`, builds the `DViewElement` id `Pointer_ViewEdgeComposition` (`DV.tsx:1065`).
2. Inside `edgeView` (`DV.tsx:661`):
   - `case EdgeHead.composition: … tailPath = EdgeHead.Tail_composition;` — **`DV.tsx:676`**.
   - `case EdgeHead.composition: fill = '#6A6A6A';` — **`DV.tsx:665`**.
   - palette entries `'tail': {type:'path', value: tailPath, …}` — `DV.tsx:693`; `'fill': U.hexToPalette(fill)` — `DV.tsx:694`; persisted via `v.palette = palette` — `DV.tsx:1061`.
3. Diamond geometry literal: `static Tail_composition = "M8.5776-.9085c…z"` — **`DV.tsx:1134`** (a filled closed path, quadratic curves).
4. Markup: `svgHeadTail("tail", …)` emits `<path className={"tail Composition preview"} style={transform}>` with **no `d` attribute** — `DV.tsx:606-607,654`; embedded into the view `jsxString` at `DV.tsx:867`. The shape comes entirely from CSS:
   - `path { &.tail { d: path(var(--tail)); } }` — **`DV.tsx:794`**
   - `path.tail, path.head { fill: var(--fill); }` — **`DV.tsx:801-802`**
   - `--tail` / `--fill` are derived from the palette `tail` / `fill` values.

So: **the diamond = palette `tail` value (`Tail_composition`) + `fill #6A6A6A`**, not a literal SVG block in the jsxString, not a shape switch in `markers.ts`.

## Q2 — Is the diamond shared with aggregation / arrowheads / triangle?

- **Shared with aggregation (yes):** `static Tail_aggregation = EdgeHead.Tail_composition;` — **`DV.tsx:1137`**. Aggregation view `makeEdgeView("Aggregation", EdgeHead.aggregation, undefined, size2, false)` — `store.tsx:513`; its `edgeView` aggregation case reads `tailPath = EdgeHead.Tail_aggregation` (`DV.tsx:675`) with `fill = '#fff'` (`DV.tsx:666-667`). **Same geometry, hollow vs filled by fill only.**
- **Also referenced by the palette dropdown options:** `headdict[EdgeHead.agglabel] = EdgeHead.Tail_aggregation` — `DV.tsx:1183` → `predefinedPaths` — `DV.tsx:1194` (the user-pickable marker list).
- **Arrowheads (association/dependency):** `Head_reference` — `DV.tsx:1139` (open arrow on the head; tail empty). Separate path.
- **Inheritance triangle:** `Head_extend = "M 0 0 L x y/2 L 0 y Z"` — `DV.tsx:1142` (head triangle; tail empty). Separate path.

**Consequence:** removing only the composition diamond must **not** alter the constant `Tail_composition` (that would also blank aggregation and the dropdown option). It must target the **composition view's `tail` specifically**.

## Q3 — Minimal surgical edit

**`DV.tsx:676`**, composition branch:

```ts
// case EdgeHead.composition: headPath = EdgeHead.Head_composition; tailPath = EdgeHead.Tail_composition; break;
   case EdgeHead.composition: headPath = EdgeHead.Head_composition; tailPath = '';                       break;
```

- One line, composition-only (the `case` runs only when building `Pointer_ViewEdgeComposition`). Head is already `""`.
- Result: composition palette `tail` value = `''` → `--tail` empty → `d: path("")` → no diamond. The `<path className="tail …">` element stays in the jsxString and renders nothing.
- `fill #6A6A6A` becomes inert (no shape) — leave it; no need to touch it.
- This is the "set the tip to none" form. The constant `Tail_composition` and aggregation/dropdown are untouched.

## Q4 — Propagation (CORRECTED)

**Prompt premise was that `2.220 -> 2.221` is *pending*. It is not.**

- `VersionFixer.tsx` working tree is **clean** (== HEAD); `git show HEAD` contains the `2.220 -> 2.221` method; it is the **last** method in the chain → `highestVersion = 2.221` (`VersionFixer.tsx:849`, def at `:28/:99`).
- `2.220 -> 2.221` (`VersionFixer.tsx:849`) only flips `bendingMode` Line→Manhattan; it does **not** touch markers/palette.

How regeneration fires (`VersionFixer.update`, `VersionFixer.tsx:105`):
- Migration loop runs only while `currVer !== highestVersion` (`:113`).
- After it, for each view: `if (v.className.includes("View") && v.version !== highestVersion && !v.clonedCounter) updateDefaultView(v, s)` — **`VersionFixer.tsx:137-138`**.
- `updateDefaultView` (`view.tsx:1739`) **replaces the whole view** `s.idlookup[v.id] = newView` from `Defaults.defaultViewsMap[v.id]`, merging only `pointedBy`/`subViews` — so it **carries the regenerated palette** (and therefore the diamond-or-not).
- `Defaults.defaultViewsMap` is populated from the generated defaults: `Defaults.defaultViewsMap[k] = v` — `reducer.ts:1098`, fed by `makeDefaultGraphViews` (`store.tsx:366`) → `makeEdgeView` → `DV.edgeView`. **So the `DV.tsx:676` change flows into `defaultViewsMap`.**

Therefore, with `2.221` already consumed:

- A project **already at 2.221** has all views at `version == highestVersion` → `updateDefaultView` is **skipped** → the diamond would **stay**.
- **A new bump `2.221 -> 2.222` is required** to:
  1. Raise `highestVersion` to 2.222 → re-fire `updateDefaultView` for every **untouched** default edge view → regenerate it with the diamond-less palette (works because `defaultViewsMap` now reflects the `DV.tsx` change).
  2. In the `2.221 -> 2.222` method **body**, add an explicit signature migration for **touched** (`clonedCounter`) composition views — `updateDefaultView` skips those (`:137`, `!v.clonedCounter`). Rewrite their persisted palette `tail` value to `''`. Signature (mirror of the `2.221` method): `className === 'DViewElement'` && `id.startsWith('Pointer_ViewEdge')` && `appliableTo === 'Edge'`, restricted to the composition one (`id === 'Pointer_ViewEdgeComposition'`, or detect `palette.tail.value === EdgeHead.Tail_composition` with a filled `#6A6A6A` fill). During implementation, confirm the persisted palette serialization shape before writing the rewrite.

**Deploy-state nuance:** if the committed `2.221` build has not yet reached users (no project migrated to 2.221 in the wild), one *could* fold the diamond change so the first `2.221` run picks up the new `edgeView`. This is fragile (any project already opened under the committed 2.221 build is stranded) and not recommended — prefer the explicit `2.222` bump.

## Q5 — Side effects (marker absence)

**None; no guard needed.**

- `computeHeadPosition` (`markers.ts:11`) reads the marker **size** `headSize0 || edgeTailSize` (`:19`), **never the palette tail path**. If the size is missing/zero it returns a **valid zero-size** `GraphSize` with `rad=0` (`:20-25`) — so `segments.tail` is **never `undefined`**. Emptying the path is invisible to this function.
- The edge geometry `edge.d` / per-segment `dpart` is produced by `computePoints` + `snapSegmentsToBorders` (border-cut), **independent of the marker** → **no gap** appears where the diamond was.
- **Already proven safe**: Association's tail (`Tail_reference = ""`, `DV.tsx:1140`) and every edge head of composition/aggregation (`Head_composition`/`Head_aggregation = ""`, `:1133/:1136`) are empty marker paths that render fine today. Emptying composition's tail is the same state.
- The earlier "`segments.head` undefined crash" was a **degenerate-geometry** failure inside `computeHeadPosition` (the `if (!secondIntersection) return Log.exDevv(...)` path `:74-75`, and the short/vertical-stub blowup fixed at `:63-71`). It is **unrelated** to an empty marker path and cannot be triggered by removing the diamond.

## Q6 — Layer impact (for the future implementation)

| File | Zone | Change |
|---|---|---|
| `common/DV.tsx` | critical | `:676` composition `tailPath = ''` (default-view source). |
| `redux/VersionFixer.tsx` | critical | new `2.221 -> 2.222`: bump (re-fires `updateDefaultView` for untouched) + explicit palette-`tail` rewrite for touched composition views. |
| `edges/routing/classic/markers.ts` | non-critical | **no change** (size-driven, path-agnostic). |
| `redux/store.tsx` | — | **no change** needed (minimal edit lives in `DV.tsx`). |
| `GraphDataElements.tsx`, `edges/routing/classic/*` | non-critical | **no change**. |
| view `jsxString` | — | **no change** (the `<path className="tail …">` element stays; it renders empty). |

---

## Hard stop

Read-only. No edits to `DV.tsx`, `VersionFixer.tsx`, `markers.ts`, `store.tsx`, or any source file. No build, no commit. Awaiting the scoped implementation prompt.
