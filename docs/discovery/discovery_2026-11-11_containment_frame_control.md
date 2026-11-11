# Discovery — Containment panel: a «Frame» control for `containment.layout.frame` (hull / self)

- Prompt-ID: P-2026-11-11-1110 (`docs/prompts/claude_2026-11-11_1110_prompt_containment_frame_control.md`)
- Session: 749997a6-30d7-42ed-9545-f32d675ab029
- Tree: `~/jjodel-w-gvframe`, branch `gv-frame-control`, HEAD `1f6829e18`
- Executor: Anthropic Claude Opus 5.5
- Phase 1, read-only. This report is a set of hypotheses with evidence, not a definitive reference: whoever uses it
  downstream re-reads the real files.

Every claim below is **read** (source or docs at HEAD `1f6829e18`) unless tagged **measured**. Nothing was run in this
phase apart from the greps named in the text.

## Goal

Find where the Containment section of the graphVertex Structure tab reads and writes `containment.layout`, confirm
that the engine honours `frame: 'self'`, and fix the exact Phase 2 touch list for a «Frame» row (Around children /
This node), visible on Free only, one gesture one undo entry, `frame` removed when the layout becomes Partitions.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `ContainmentSection.tsx` has no `frame` control. | Holds (F1, F5) |
| H2 | The engine honours `frame: 'self'` end to end: compile, presentation pass, ELK, hull skip. | Holds (F2) |
| H3 | `frame` is in the IR type and in spec addendum §11. | Holds (F2) |
| H4 | The existing layout writer can carry `frame` as is. | **Falsified** (F1.3): `normalLayout` drops a layout whose only non-default key is `frame` |
| H5 | `separator` has a panel pattern the new row can mirror. | **Falsified** (F3): there is no separator UI; the pattern to mirror is the Stacking (axis) row |
| H6 | Switching Free to Partitions removes `frame` today. | **Falsified** (F4): it is kept, and `validateIR` then refuses the draft |
| H7 | The prompt's hull hint («A frame is drawn around this node and its children.») describes every Free state. | **Partly** (F2.5): true only when no band and no padding are set |

## Files read

- `frontend/src/components/editor-v2/viewpoint/authoring/ContainmentSection.tsx` (whole, 408 lines)
- `frontend/src/components/editor-v2/viewpoint/authoring/graphVertexAuthoring.ts` (whole, 351 lines)
- `frontend/src/components/editor-v2/viewpoint/authoring/GraphVertexAuthoringPanel.tsx` (lines 70-204)
- `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/containmentSection.test.ts` (lines 1-91, plus the `describe`/`it` index)
- `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/graphVertexAuthoring.test.ts` (the `describe`/`withLayoutMode` index only)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (lines 596-620, 1136-1150)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (lines 426-450, 634-645)
- `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` (lines 628-657, 720-730, grep for `layout`)
- `frontend/src/components/editor-v2/viewpoint/ir/IRContainmentHulls.tsx` (lines 36-48)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (lines 316-350)
- `frontend/src/components/editor-v2/viewpoint/ir/irCreationSeed.ts` (lines 40-60)
- `frontend/src/components/editor-v2/utils/elkContainers.ts` (lines 190-215)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irValidate.test.ts` (lines 705-710), `ir.test.ts` (lines 2599-2603)
- `docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md` (outline, grep for `frame`)
- `frontend/scripts/probe/statechart-fixture.ts` (grep for `frame`)

## Findings

### F1 — The Containment section and its write path (question 1)

1. Component: `ContainmentSection` in `ContainmentSection.tsx`, mounted by `GraphVertexAuthoringPanel.tsx:293`. The
   «Layout» row is in the Basic block, «Header band» and «Padding» in the Advanced block:
   - `ContainmentSection.tsx:208-215`: `<div className="jj-field" data-testid="gv-layout-mode">` … `<SegmentedControl<ContainmentLayoutMode>` … `onChange={(v) => patch(withLayoutMode(draft, v))}`
   - `ContainmentSection.tsx:216-218`: `<HelpText icon={false}>{layoutMode === 'partitions' ? 'The children are stacked and fill the container, like the lanes of a pool.' : 'The children keep the positions they have.'}</HelpText>`
   - `ContainmentSection.tsx:233`: `{advanced && (`
   - `ContainmentSection.tsx:275`: `onChange={(v) => patch(withHeaderSide(draft, v))}`
   - `ContainmentSection.tsx:288`: `<NumberInput value={c.layout?.padding ?? 0} min={0} onChange={(n) => patch(withLayoutPadding(draft, n))} />`
2. Writers: pure functions of `graphVertexAuthoring.ts`, one per row, each routed through `withLayoutOf`:
   - `graphVertexAuthoring.ts:181`: `const layoutOf = (ir: GraphVertexViewIR): ContainmentLayout => ir.containment.layout ?? { mode: 'free' };`
   - `graphVertexAuthoring.ts:183-184`: `const withLayoutOf = (ir, next) => withContainmentOf(ir, setKey(ir.containment, 'layout', normalLayout(next)));`
   - `graphVertexAuthoring.ts:190-195`: `export function withLayoutMode(ir, mode) { const { axis, ...rest } = layoutOf(ir); return withLayoutOf(ir, mode === 'partitions' ? { ...rest, mode, axis: axis ?? 'vertical' } : { ...rest, mode }); }`
   - The module's idiom, `graphVertexAuthoring.ts:9-11`: «a default is the ABSENCE of the key, written by rest/spread, never as `key: undefined`; a group whose last key goes away goes away with it».
3. **`normalLayout` ignores `frame` and `separator`** (H4 falsified):
   - `graphVertexAuthoring.ts:175-179`: `function normalLayout(layout) { const { mode, axis, header, padding } = layout; if (mode === 'free' && axis === undefined && header === undefined && padding === undefined) return undefined; return layout; }`
   - Consequence: `{ mode: 'free', frame: 'self' }` normalizes to `undefined`, so a writer that sets only `frame: 'self'` on a
     view with no band and no padding writes nothing. The same function silently drops an existing `frame: 'self'`
     (statechart fixture, `statechart-fixture.ts:111`: `layout: { mode: 'free', frame: 'self', header: BAND, padding: PAD }`)
     when the author clears both the band and the padding. Phase 2 must add `frame` to this check; `separator` is never
     reached there (`mode === 'partitions'` never normalizes away), adding it too is harmless and keeps the function
     honest.
4. Undo grouping: one gesture calls `patch` once, which replaces the draft; a debounced effect validates and commits
   the whole IR in one assignment.
   - `GraphVertexAuthoringPanel.tsx:196-199`: `const patch = (next) => { dirtyRef.current = true; setDraft(withMetaclassPins(draft, next, pinCtx)); };`
   - `GraphVertexAuthoringPanel.tsx:127-131`: `const v = validateIR(view.id, draft); setError(v.ok ? null : v.error); if (!v.ok) return; const t = setTimeout(() => { (view as any).ir = draft;`
   - `GraphVertexAuthoringPanel.tsx:53`: `const COMMIT_DEBOUNCE_MS = 300;`
   - So a change made inside one pure writer (mode switch plus dropping `frame`) lands in the same `view.ir = draft`
     write. Not measured: that one `view.ir` assignment is one undo entry (read from the panel's doc,
     `GraphVertexAuthoringPanel.tsx:73-74`, «committed after a debounce through the L-proxy `view.ir = draft` (whole-object replace)»).
     Two gestures within 300 ms coalesce into one commit, as for every neighbouring row.

### F2 — `frame` in the type, the spec and the renderer (question 2)

1. IR type, `irTypes.ts:614-616`: `/** \`free\` only. Absent = 'hull' (today's). \`self\`: the node is the box of its visible children, plus \`padding\` and the band (S2b, spec addendum §11). Partitions are always their own frame. */ frame?: ContainerFrame;` and `irTypes.ts:602`: `export type ContainerFrame = 'hull' | 'self';`. `separator?: PartitionSeparator` at `irTypes.ts:618`. No type change is needed.
2. Spec addendum §11, `claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md:183`: `frame?: ContainerFrame;          // free only; absent = 'hull'`.
3. Renderer read sites (search: `command grep -rn "\.frame\b\|frame ===\|frame:"` over `components/editor-v2`, tests excluded):
   - `irCompile.ts:447`: `if (out.mode === 'free' && r.frame === 'self') out.frame = 'self';`
   - `irContainment.ts:726`: `return l?.mode === 'free' && l.frame === 'self';` (the `isSelf` of the presentation pass)
   - `elkContainers.ts:202`: `if (layout.frame === 'self') {`
   - `IRContainmentHulls.tsx:42-43`: `// A container that declares a layout (R-GV-5) is its own frame, header band included: no hull around it.` / `if (info.layout) continue;` (no `frame` read: the hull is skipped for any declared layout, `self` included).
4. Positive control, same search widened to `layout.header` / `layout.padding`: `elkContainers.ts:197` `const band = layout.header;`, `elkContainers.ts:204` `padding: layout.padding`, `irContainment.ts:827-828`, `irValidate.ts:326` and `:333`. The search reaches the renderer files.
5. **What «absent = hull» draws** (H7 partly): spec §11 point 2, addendum line 189: «`frame: 'hull'` (absent) keeps
   today's drawing, unchanged: a container with no `layout` is drawn with the hull around it; one with a `layout` is
   its own box at its stored size, with no hull (S2, decision 4).» The compiled layout exists for any object
   (`irCompile.ts:434-435`, undefined only when not an object) and is attached at `irContainment.ts:403`
   `if (cv.containment.layout) info.layout = cv.containment.layout;`, which `IRContainmentHulls.tsx:43` skips. With
   the panel's normalization, Free with no band and no padding writes no `layout` key, so the hull is drawn; Free with
   a band or a padding writes `{ mode: 'free', … }`, so no hull is drawn and the node keeps its stored size. The
   prompt's hull hint is accurate in the first case only (question 1 below).
6. The engine tests the prompt cites exist as described: `ir.test.ts:2599-2603` (`gv_f1`..`gv_f4`) and
   `irValidate.test.ts:705-710` (`f_ok1`..`f_e2`, `f_e1` asserts `'containment.layout.frame applies to free only'`).

### F3 — How `separator` is handled in the panel (question 3)

- It is not handled: no control reads or writes it. Search `command grep -rn "separator\|frame" authoring/*.ts*`
  returns only `FieldCompartmentListEditor.tsx:111,278,280,281` (the compartment's own `separator` flag) and
  `VertexAuthoringPanel.tsx:121,128-130` (a local `frame(...)` glyph helper): neither is `containment.layout`. Those
  two unrelated hits are the positive control of the same search.
- The mode-dependent pattern that exists is the Stacking row, partitions only:
  `ContainmentSection.tsx:257`: `{layoutMode === 'partitions' && (` … `data-testid="gv-layout-axis"` … `onChange={(v) => patch(withLayoutAxis(draft, v))}`, and its key is dropped on the switch to Free in `withLayoutMode` (`graphVertexAuthoring.ts:191`, `const { axis, ...rest } = layoutOf(ir);`). The Frame row mirrors this pattern: `layoutMode === 'free' &&`, and `frame` dropped on the switch to Partitions.
- Opposite direction, today: Partitions to Free keeps `separator` through `...rest` (`graphVertexAuthoring.ts:194`),
  and `validateIR` refuses it, `irValidate.ts:343`: `` return `[ir] containment.layout.separator applies to partitions only, read on ${readOf(layout.mode)}`; ``. The panel shows the error and never commits (`GraphVertexAuthoringPanel.tsx:128-129`), and the author has no control to clear the key. Not changed in Phase 2 unless Alfonso says so (question 3).

### F4 — An existing `frame` on the switch Free to Partitions (question 4)

- `withLayoutMode(ir, 'partitions')` keeps every key but `axis` (`graphVertexAuthoring.ts:191-193`), so a draft
  `{ mode: 'free', frame: 'self' }` becomes `{ mode: 'partitions', axis: 'vertical', frame: 'self' }`.
- `validateIR` refuses it, `irValidate.ts:339`: `` if (layout.mode !== 'free') return `[ir] containment.layout.frame applies to free only (partitions are their own frame), read on ${readOf(layout.mode)}`; ``.
- The draft stays uncommitted with the error shown, and today no panel control can remove `frame`: the author is
  stuck until switching back to Free. Today a `frame` reaches a view only from outside the panel (the statechart
  fixture, an imported project), since the Source tab is read-only (prompt, COSA).

### F5 — `validateIR` and the seed (question 5)

- `validateIR` checks `frame` and `separator`: `irValidate.ts:337-345`, quoted in F3 and F4 (vocabulary `hull | self`,
  refused off `free`; `solid | dashed`, refused off `partitions`). The layout's own error message still lists
  `{ mode, axis?, header?, padding? }` (`irValidate.ts:320`); cosmetic, out of scope.
- The seed does not mention `frame`: `irCreationSeed.ts:43-55` read whole, `containment: {},` at line 53;
  `command grep -n "frame\|separator" ir/irCreationSeed.ts` returns nothing, consistent with the full read of the
  function. No seed change, no VersionFixer bump (prompt, COME).

### F6 — Identifiers for Phase 2 (measured)

`command grep -rl -- <id> frontend/src frontend/scripts | wc -l`: `gv-frame` 0, `FRAME_OPTIONS` 0, `withLayoutFrame` 0,
`FRAME_HINT` 0; positive control `gv-layout-mode` 2. No new CSS class is needed: the row reuses `jj-field`,
`jj-field-label`, `SegmentedControl` and `HelpText`.

## Phase 2 design (proposal)

- `graphVertexAuthoring.ts`:
  - `normalLayout` counts `frame` (and `separator`) as a non-default key, so `{ mode: 'free', frame: 'self' }` survives
    and clearing the band and the padding no longer drops an existing `frame`.
  - New `withLayoutFrame(ir, frame: ContainerFrame)`: `'self'` writes `frame: 'self'`, `'hull'` drops the key (rest/spread).
  - `withLayoutMode(ir, 'partitions')` also drops `frame`; `'free'` keeps it (clicking the active Free option is a no-op).
- `ContainmentSection.tsx`: a «Frame» row right after «Layout» (Basic block), shown only when `layoutMode === 'free'`,
  `data-testid="gv-frame"`, `SegmentedControl<ContainerFrame>` with `FRAME_OPTIONS` «Around children» (`hull`) and
  «This node» (`self`), value `c.layout?.frame ?? 'hull'`, `onChange={(v) => patch(withLayoutFrame(draft, v))}`, one
  hint line per state (wording per question 1).
- Tests: `graphVertexAuthoring.test.ts` (the panel's write path, module doc lines 5-7): «This node» writes
  `frame: 'self'` on the seed and on a banded layout; «Around children» removes the key, and the layout with it when
  nothing else is left; Partitions drops `frame` and the result passes `validateIR`; clearing band and padding keeps
  `frame`. `containmentSection.test.ts` (static render, no interaction possible): `gv-frame` shown on Free, absent on
  Partitions, the hint of each state.
- Undo: every case above is one pure write, so one `patch`, one draft, one `view.ir = draft` (F1.4).

## Phase 2 touch list (question 6)

1. `frontend/src/components/editor-v2/viewpoint/authoring/graphVertexAuthoring.ts`
2. `frontend/src/components/editor-v2/viewpoint/authoring/ContainmentSection.tsx`
3. `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/graphVertexAuthoring.test.ts`
4. `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/containmentSection.test.ts`
5. `docs/log-inbox/graphvertex.md` (closing entry)

Not touched: `irTypes.ts`, `irValidate.ts`, the seed, the renderer, the critical zone. Five files, within rule 19.

## Dependencies and risks

- The `normalLayout` change alters what an existing writer returns for a layout holding `frame`: today it drops it,
  after it keeps it. Only views that already carry `frame` (fixture, imports) see the difference, and it is the
  correct one; no existing test asserts the drop (to be confirmed by running the suite in Phase 2).
- The visual check of the prompt sets Header band and Padding, which are Advanced-only (`ContainmentSection.tsx:233`):
  the check must run with Advanced on.
- The existing test name «Basic shows the channel, the layout mode and the channel edges, and nothing else»
  (`containmentSection.test.ts:66`) becomes inaccurate with a Basic Frame row; its body asserts only the listed
  ids, so it stays green. Phase 2 adds `gv-frame` to its expectations and names it.

## Open questions

1. Hull hint: with a band or a padding set and no `frame`, no hull is drawn (F2.5); keep the prompt's line in every hull state, or show it only when the layout has no band and no padding, and «This node keeps its own size; no frame is drawn around its children.» otherwise?
2. Placement: the Frame row in Basic, right after Layout, as the prompt says, although the self hint names Padding, which is Advanced only?
3. Separator: drop `separator` in `withLayoutMode(ir, 'free')`, in the same undo entry, so that the switch Partitions to Free is no longer refused by `validateIR` (F3)?
