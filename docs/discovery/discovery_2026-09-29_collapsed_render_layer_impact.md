# Layer Impact Report 2026-09-29: render the collapsed graphVertex as declared (F3)

Prompt `P-2026-09-29-2122`, chat `C-2026-09-29-1840`, branch `ir-collapsed-render` at `8dbb031d1`.
Critical-zone go-ahead (RC-30) given by Alfonso for lane F3 of the discovery
`docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md` (`a50fa6607`, §0 point 2, §6 F3).
Written before the diff (CLAUDE.md §3.2). The prompt names this path; RC-30 names `docs/lir/`,
which does not exist in this tree: the prompt's path is used.

## 0. Answer in brief

- **Layers:** canvas v2-flow only (how the IR node paints). No D-layer, L-layer, JjOM, sync or
  persistence write is added or changed; no schema change, no migration.
- **Files:** `nodes/ObjectNode.tsx` (IR branch: the form it hands to handles and resizer, the chip's
  count), `viewpoint/ir/IRNodeContent.tsx` (form, fill, badge), plus the new test
  `nodes/__tests__/irCollapsedRender.test.ts`.
- **Decisions taken (unattended, inside the perimeter):**
  1. Flat fields `collapsed.form`, `.fill`, `.badge` are the contract (taken by the chat, recorded here).
  2. The declared badge replaces the chip's **count**, not the chip: the chip is the only expand
     path of a collapsed container (below), so removing it would strand the container (Rule 3).
  3. "Collapsed" for painting is the chip's own predicate: a collapsible `graphVertex` with at least
     one child, in the collapsed set. A container with nothing to expand keeps its expanded look.
  4. A collapsed fill that resolves empty (a conditional with no match) falls back to the expanded
     fill, the convention the node already applies to `fill`.
- **Risk to measure in the probe:** the stale derived size on expand (§4).
- **Decisions awaiting Alfonso:** none for this lane. One spec question (§5).

Recommended: proceed with the diff below; measure §4 in the probe and report it rather than touch
`useContentSize.ts`, which is outside the DOVE list.

## 1. Red, recorded before the fix

`frontend/src/components/editor-v2/nodes/__tests__/irCollapsedRender.test.ts` renders `ObjectNode`
on its IR branch (`renderToStaticMarkup`, joiner mocked, `useIRView` mocked to hand a view compiled by
the real `compileView` read through the real `makeDrawReadCtx`). B contains four C through a
composition; the view declares
`collapsed: { form: 'cylinder', fill: '#e2e8f0', badge: { icon: 'bi-box-seam', position: 'tr', visible: true } }`.

Today, B collapsed:

| Reading | Value |
|---|---|
| content class | `ir-node-content ir-shape--rounded` |
| content style | `background:#ffffff` |
| chip inner markup | `<i class="bi bi-chevron-expand"></i>4` |
| `bi-box-seam` hits | 0 |

Suite: 9 tests, 3 failed (declared appearance; fill-only; form-only), 6 passed (the controls:
expanded; no `collapsed`; badge invisible; unmatched conditional fill; no children; not collapsible).
Matches the discovery's measurement (§0 point 2).

## 2. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

**Canvas v2-flow.**
- What changes: on the IR branch of `ObjectNode`, when the node is collapsed (decision 3), the form
  is `containment.collapsedForm` when declared, the fill `containment.collapsedFill` when declared and
  non-empty, and a declared, visible badge with an icon renders as an `ir-badge ir-badge--<position>`
  span inside `.ir-node-content`, the markup the shape badges already use (`IRNodeContent.tsx:521-530`).
  The chip keeps its chevron and its click; it drops the count only when that badge renders. The form
  `ObjectNode` hands to `DynamicHandles`, `NodeResizer` (`keepAspectRatio`) and `ir-resizable` is read
  through the same function as the painted one, so outline, anchors and resizer cannot disagree.
- What does NOT change: an expanded node, a view without `collapsed`, and every non-graphVertex view
  (their `containment` is null, `irCompile.ts:458-472`): identical markup. The hull
  (`IRContainmentHulls.tsx`) is drawn for expanded containers only and is not touched. The hiding and
  the edge lifting of `computeHidden` / `liftEndpoint` (`irContainment.ts:239-270`) are not touched.
  No CSS class is added or renamed; no new CSS rule.
- Cross-layer interaction: none written. Reads only: the compiled view (already in hand), the
  session collapse set (`irCollapseState.ts`), the child count selector already in `ObjectNode`.
- Side-effect safety: the form feeds `useContentDrivenSize` (`IRNodeContent.tsx:223`), which writes
  a session-only React Flow size and never the D-layer (`useContentSize.ts:84-92`: no
  `syncSizeToJjom`, persistence keyed on `resizing`, which a programmatic write never sets). See §4.

**Not touched, stated:** `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts` (the chip still
calls `syncIRCollapsedToJjom` exactly as before), `irCompile.ts`, `irTypes.ts`, the validator,
`docs/spec/`, `docs/decisions.md`.

**Smoke scenarios potentially affected:**
- VP1 Shapes, B collapsible with the declared `collapsed`: expanded unchanged; collapsed paints a
  cylinder, fill `#e2e8f0`, `bi-box-seam` at top right, chip with chevron and no count.
- Control: a collapsed `graphVertex` without `collapsed`: unchanged from today (rounded, «4»).
- Expand after collapse: the node returns to its expanded form and fill (§4 for its size).
- Save, reload: `DVertex.irCollapsed` round-trips as before; the hydrated collapsed node paints the
  declared appearance.

## 3. Where the reading happens

| Site | Today | After |
|---|---|---|
| `IRNodeContent.tsx:206` form | `compiled.form(...)` | collapsed form when collapsed and declared |
| `IRNodeContent.tsx:207` fill | `compiled.fill(...)` | collapsed fill when collapsed, declared, non-empty |
| `IRNodeContent.tsx:521` badges | `compiled.badges` only | plus the collapsed badge when collapsed |
| `ObjectNode.tsx:912` shapeForm | `compiled.form(...)` | same function as the painted form |
| `ObjectNode.tsx:961` chip count | shown when collapsed | shown when collapsed and no collapsed badge renders |

The only expand path of a collapsed container is the node chip: `toggleCollapsed` has two callers,
`ObjectNode.tsx:953` (the chip) and `IRContainmentHulls.tsx:98` (the hull header, drawn for expanded
containers only, `IRContainmentHulls.tsx:41-51`).

## 4. Risk: the derived size on expand

`cylinder` carries a size supplement (`GEOMETRIC_BOX_SIZING`, `minAspect: 0.8`,
`shapeRegistry.ts:292-294,405-417`), so on collapse `useContentDrivenSize` turns active and writes a
session React Flow width and height. `rounded` has none: on expand the hook goes inactive, and its
inactive branch drops a size it wrote only when that size came from `defaultSize`
(`useContentSize.ts:151-175`). A derived size may therefore stay on the expanded node for the session,
with `ir-sized` on the wrapper. The same path is already reachable today by a conditional form that
switches from a supplemented to a plain form; F3 makes it reachable by a click. Nothing is persisted.
The probe measures the node box expanded, collapsed and expanded again; if the size sticks, it is
reported with a one-line fix in `useContentSize.ts` as a ticket, not applied here (outside DOVE,
critical zone, RC-21).

## 5. Question for Alfonso: amend IR spec v1.2 §8

The spec (`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` §8) nests
`collapsed.shape?: Partial<Shape>`; the code, the validator and this lane use flat fields. Proposed
amendment line, not applied:

> `collapsed?: { form?: Conditional<ShapeForm>; fill?: Conditional<string>; badge?: BadgeSpec }` —
> flat fields are the contract (2026-09-29, P-2026-09-29-2122): each falls back to the expanded
> value when absent, and a declared, visible badge replaces the count of the expand chip, which
> stays as the toggle.

Recommended: adopt the line as written.

## 6. After the diff: probe on 3060, 11/12 (added 2026-09-29)

Code commit `04acac227`. Probe `frontend/scripts/smoke/_tmp_p2122_collapsed.ts` (gitignored; fixture copied
from the discovery's `_tmp_irfreeze_common.ts`, plus a `Control` viewpoint: B collapsible without
`collapsed`), run by `lane-run probe --port 3060`; log
`~/.jjodel-lanes/P-2026-09-29-2122/probe-_tmp_p2122_collapsed.log`, crops in
`~/.jjodel-lanes/P-2026-09-29-2122/crops/`. Every item read from the DOM.

| Item | Measured |
|---|---|
| Collapsed B, form | `ir-node-content ir-shape--cylinder` (PASS) |
| Collapsed B, fill | outline path `fill="#e2e8f0"` (PASS) |
| Collapsed B, chip | chevron-expand, no count (PASS); children hidden, 10 → 6 visible nodes, hull gone |
| Collapsed B, wrapper | `ir-resizable` (PASS: handles and resizer follow the cylinder) |
| Collapsed B, badge | one `ir-badge ir-badge--tr` with `bi-box-seam`, **computed `position: relative`, not top right (FAIL)** |
| Expanded again | rounded, `rgb(255, 255, 255)`, no badge, hull back (PASS); **box 54×66 with `ir-sized`, was 200×42** |
| Control collapsed | rounded, chip «4», no badge, fill unchanged (PASS), light and dark |
| Dark | collapsed B cylinder, `#e2e8f0`, badge, no count (PASS) |
| Page errors | none |

**Finding A, badge position: a pre-existing defect of `irStyle.ts`, not of this diff.** The five
SVG-painted forms (diamond, hexagon, parallelogram, cylinder, cloud) carry
`.ir-node-content.ir-shape--<form> > :not(.ir-<form>-svg):not(.ir-marker-svg) { position: relative; z-index: 1; }`
(`irStyle.ts:113,129-132`, specificity 0,4,0). It beats `.ir-node-content .ir-badge { position: absolute }`
(`irStyle.ts:48`, 0,2,0), so any badge becomes a flex item, centred at the top of the column. Control in
the same run: a `shape.badges` entry on a diamond (A2 «gw») computes `position: relative`, not top right; on
an ellipse (A1 «root», a CSS form) `absolute`, top right. The marker had the same collision and was fixed
by its `:not(.ir-marker-svg)` (comment at `irStyle.ts:109-112`). Proposed fix: add `:not(.ir-badge)` to
those five selectors. The comment at `irStyle.ts:105-106` already says badges (z 2) sit above the content.

**Finding B, the derived size on expand (§4): confirmed.** The inactive branch of `useContentDrivenSize`
drops a size it wrote only when that size came from `defaultSize` (`useContentSize.ts:159`,
`if (fromDefault.current && !isResized && mine !== null)`). Collapse makes the cylinder's derived 54×66
the React Flow size, and expand leaves it on the rounded node, for the session, in every viewpoint that
renders the vertex (the Control B read 54×66 too). Nothing persisted. Proposed fix: drop the condition
`fromDefault.current &&`, so a size the hook wrote is dropped whenever it goes inactive and no manual size
owns the vertex (`!isResized`, the size still equal to the one written).

Both fixes are in `viewpoint/ir/` (critical zone, go-ahead given for this lane) but outside the prompt's
DOVE list, so they wait for Alfonso (Rule 1, RC-21).

**Harness note.** Under this lane's go-ahead the full vitest run has 4 failures, all in
`scripts/hooks/__tests__/criticalZone.test.ts`: the session's `JJODEL_CRITICAL_ZONE_GOAHEAD` reaches the
hook tests. With the variable unset, the file is 70/70 and the suite 5877/5877.

## 7. Addendum before the second diff: findings A and B (added 2026-09-29)

Chat answer (RC-21, `[P-2026-09-29-2122]`, 2026-09-29): extend the lane with `irStyle.ts` (`:not(.ir-badge)` on
the five SVG-form child selectors) and `useContentSize.ts:159` (drop `fromDefault.current &&`), one regression
test each, under Alfonso's critical-zone go-ahead of 2026-09-29.

**Finding A: the approved CSS edit is not applied; the badge is fixed inline in `IRNodeContent.tsx`.**
Measured before any edit, in headless Chromium on the CSS `irStyle.ts` injects (`ensureViewCss` through a
stand-in `document`), a badge and an outside label on each of the five SVG forms and on an ellipse
(probe `frontend/scripts/smoke/_tmp_p2122_cascade.ts`, gitignored):

| Variant | Badge on the 5 SVG forms | Outside label on the 5 SVG forms | Ellipse |
|---|---|---|---|
| today | `relative`, z 1, not in its corner | `absolute` | badge `absolute` z 2 in its corner |
| `:not(.ir-badge)` added | `absolute`, z 2, in its corner | **`relative`** | unchanged |
| badge inline `position:absolute; z-index:2` | `absolute`, z 2, in its corner | `absolute` | unchanged |

`:not(.ir-badge)` lifts the in-flow child rule from (0,4,0) to (0,5,0). The outside label of
P-2026-09-29-1245 is written at (0,4,0) to beat exactly that rule (`shapeRegistry.test.ts`, «is written at
(0,4,0), after the rules it must beat»), so it would lose on every SVG form. The edit would also break the
two byte-identity guards of `shapeRegistry.test.ts` (prefix sha at 16743 and at 17954 characters). Rule 3
forbids it. The inline variant reaches the approved behaviour, every badge in its corner on every form,
with no CSS edit: the values are the class rule's own (`irStyle.ts:48`), so on the CSS forms nothing
changes. `irStyle.ts` stays untouched; the lane's files shrink rather than grow. Declared as a deviation from
the chat's instruction, for the digest.

Layers for A: canvas v2-flow only. What changes: every `.ir-badge` span IRNodeContent emits (shape badges
and the collapsed badge) carries `style="position:absolute;z-index:2"`. On the five SVG forms the badge
leaves the flex column for its corner, so it no longer adds a row to the content the derived size measures:
an SVG form with a badge can get a smaller derived box. What does not change: CSS forms (same values as the
class rule), labels, compartments, the marker layer, the outside label.

**Finding B: `useContentSize.ts:159`, applied as approved.** Layers: canvas v2-flow only. What changes:
when the hook goes inactive, it drops the React Flow width and height it wrote, whatever their source
(before: only a `defaultSize` one), under the same two guards: no manual size owns the vertex under the
layout in force (`!isResized`), and the node still carries exactly the size the hook wrote. The keys dropped
are the ones «Reset size» and the default drop already drop (`width`, `height`, `measured`). What does not
change: the D-layer (the hook never calls `syncSizeToJjom`; persistence keys on `resizing`, which a
programmatic write never sets), a manual size (kept by `!isResized`), the active branch.
Scenarios: collapse then expand (the rounded node returns to its CSS box, not 54×66); a conditional form
switching from a supplemented form to a plain one (the same path, also fixed); a manual resize while
collapsed, then expand (kept: `isResized`).
