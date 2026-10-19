# Discovery 2026-10-19 — shell rail tickets (S9)

- Prompt-ID: P-2026-10-19-2050 (`docs/prompts/` claude_2026-10-19_2050, shell S9 rail tickets)
- Session: 0313bd27-29cb-48f5-aa0f-0e168ecc1242
- Tree: `~/jjodel-w-shellui-s9`, branch `shell-ui-s9`, HEAD `4f562dc86`
- Executor model: Opus 5.5 (claude-opus-5-5)
- This report is a set of hypotheses with evidence, not a reference. Read the real files downstream.

## 1. Hypotheses and goal

Goal: close the three rail tickets of `docs/log-inbox/shell-ui.md` (P-2026-10-19-1742 line 76,
P-2026-10-19-1830 line 91, P-2026-10-19-1930 line 121) inside the rail, without moving the rail,
palette or canvas rects.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The B4 input rule reaches `input.jj-select__input` and gives it 30px and a 1px border | holds (measured) |
| H2 | `.anchor-viz__point-label` is 9px in the rail and 11px fits without collisions | holds (measured) |
| H3 | `.tree-section__header` is 23px and two header toggles' 24px boxes overlap by 1px | holds (measured) |
| H4 | `.jj-contents-add` loses its top 2px of hit box to `.jj-contents-group-header` | falsified on this HEAD (measured) |
| H5 | The first tree toggle's box is covered by `.tree-search`, fixable by stacking without moving layout | first half holds (measured), second half falsified (read + reasoning) |

## 2. Files read

- `frontend/src/components/editors/properties-with-tree-view.scss` (lines 585-660, 1730-1780, 2240-2492)
- `frontend/src/components/editors/node-editor-redesign.scss` (lines 405-555, 740-775)
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (lines 78-102, 925-964; read only, not edited)
- `frontend/src/styles/components/_form-system.scss` (lines 1119-1168; read only)
- `frontend/src/components/ui/JjSelect/JjSelect.tsx` (grep only: lines 50, 176)
- `frontend/src/styles/tokens/_shell.scss` (grep: lines 34, 36, 49), `_typography.scss:29`
- `docs/log-inbox/shell-ui.md` (ticket lines), `docs/decisions.md` (R-SHELL-2, R-SHELL-5, D-UI-11 as injected)
- `~/.jjodel-lanes/P-2026-10-19-1930/handoff.md` (S8 probe method)

## 3. Method

Probe `frontend/scripts/smoke/_tmp_s9_rail.ts` (gitignored, copied from S8's `_tmp_s8_rail.ts`), dev
server on 3019 from this tree, Chromium 1600x1000, DemoPetri (`scene_2_DemoPetri.jjodel`), states model,
class (`Place`), attribute (`tokens`), class with its node and NODE open, Basic and Advanced. Corner test
as S8 (integer cells L..L+23 of the centred 24x24 box), plus a dense test of all 576 cells for
`.jj-contents-add` and section-header toggles whose centre hits themselves. All numbers below: measured
on HEAD `4f562dc86`, probe run `before`.

## 4. Findings

### 4.1 Ticket 1 — react-select inner input (H1 holds)

`properties-with-tree-view.scss:1750-1755`:

```
    .jj-field input:not([type="color"]):not([type="checkbox"]) {
        height: 30px;
        padding: 0 9px;
        font-size: 13px;
        border-radius: 6px;
        border: 1px solid $pc-slate-300 !important;
```

under `.properties-with-tree-view--rail .properties-fields` (0,5,1); the panel rule at `:598-605`
(`border: 1px solid $pc-slate-200 !important; ... background-color: #ffffff;`, padding `11px 14px`)
also matches. JjSelect sets `classNamePrefix={'jj-select'}` (`JjSelect.tsx:176`), so the input carries
`jj-select__input`, inside `.jj-select__input-container`.

Measured, attribute state, both modes: `input.jj-select__input` rect `1320,305,4,30`, border `1px solid`,
height `30px`; control `.jj-select__control` `1309,304,277,30`; field row `1215,304,371,30`. In the model
state the JjSelect is outside `.jj-field` (control 36px) and its input already has border 0: not affected.

Plan: a rail-scoped reset in a new S9 block at the end of PWT,
`.jj-field .jj-select .jj-select__input-container > input.jj-select__input` under the S6 anchor, (0,6,1):
`height: auto; padding: 0; border: 0 !important; background: transparent; box-shadow: none`. It ties
B4's focus rule (0,6,1) and wins by source order; the S6 `:not(:focus)` border-colour rule (0,7,1) still
wins its colour, irrelevant at width 0. Font size untouched (13px today), so the value line does not move.
Chosen over adding `:not(.jj-select__input)` to B4 because that raises B4 to (0,6,1) and changes its
contest with the stepper neutralisation (`:644-660`), and does not cover the `:598` rule anyway.

### 4.2 Ticket 2 — anchor labels (H2 holds)

`node-editor-redesign.scss:537-538`:

```
.anchor-viz__point-label {
    font-size: 9px;
```

The anchor viz renders in the rail (Advanced, class node selected, NODE open): `.anchor-viz`
`1232,575,337,228`, 17 labels at 9px, longest `bbr` 13.9x11 inside a 32x32 point, 0 overflow, 0
collisions. Labels are at most three lowercase letters: at 11px the longest is about 17px wide, inside
the 32px circle. Plan: `font-size: var(--shell-font-size-min)` on that one rule
(`--shell-font-size-min: var(--text-xs)`, `_shell.scss:34`; `--text-xs: 0.6875rem /* 11px */`,
`_typography.scss:29`). The sheet's only consumer is `NodeEditor.tsx` (grep `node-editor-redesign` over
`frontend/src`, two hits: the TSX import and the sheet itself as positive control).

Left alone: `node-editor-redesign.scss:763-765` sets `font-size: 8px` inside `@media (max-width: 400px)`,
a viewport the rail cannot reach at 1600x1000; outside the "one rule" of the prompt.

### 4.3 Ticket 3 — section headers (H3 holds)

`tree-view-sidebar.scss:928-932`: `.tree-section__header { display: flex; align-items: center; gap: 4px;
padding: 4px 8px 4px 0;` with the label at 11px (`:948`) restated to 12px by S7 (PWT `:2398-2403`).
Measured: 8 headers at 23px in every state and mode; tree rows 26 (Basic) / 24 (Advanced). Corner test,
Basic model and class: the first header toggle `1209,135,14,14` misses 72 of 576 cells: rows 0-1 to
`div.tree-search` (48 cells) and rows 22-23 to the next header toggle (24 cells).

Plan: `.tree-section__header { min-height: var(--shell-row-height); }` under the rail anchor. The header is
already a centred flex row, so the label stays vertically centred (measured `labelMid=11.5` of 23 today).

### 4.4 `.jj-contents-add` (H4 falsified on this HEAD)

`_form-system.scss:1129-1133` `.jj-contents-group-header { display: flex; ... padding: 10px 16px; }`,
not positioned; the add button is its child, 22px tall, with S8's `::before` box (PWT `:2428-2445`).
Dense test, after scrolling each into view: Basic model `1521,689`, `1521,764`, `1521,846`; Advanced model
`1521,498`, `1521,658`, `1521,740`, all 49x22: 0 missing cells of 576 each. A grep for
`jj-contents-group-header` in PWT returns nothing while `jj-contents-add` in the same command returns
`:2431` (positive control): no rail rule positions the header. S8 measured its miss in a state with a hovered
tree row and a derived viewpoint, not reproduced here. Plan: no change unless the after-run shows a miss
(CLAUDE.md §5, fixtures from memory).

### 4.5 First toggle under `.tree-search` (H5 partly)

`tree-view-sidebar.scss:82-91`: `.tree-search { position: sticky; top: -4px; z-index: 1; ... height:41px;
... margin: -10px -8px 0 -8px;`; computed z-index in the rail is 5 (measured). Its rect is `1201,91,399,41`,
bottom 132; the first header starts at 130, so the filter covers 2px of the header itself. Raising the
toggle box above the filter needs z-index 6 or more in the same stacking context; rows scroll under the
sticky filter by design, so every header toggle that scrolls under it would then take clicks from the
filter's left edge (its search icon and the first ~24px of the bar). No stacking fix exists that is safe
without moving layout; left as it is.

## 5. Dependencies and risks

- Section headers move the tree by +3px (Basic) / +1px (Advanced) per header: 8 headers, up to 24px / 8px
  lower at the bottom. Accepted by the prompt. The rail rect does not change (the tree scrolls).
- The S8 comment at PWT `:2447-2450` ("Section headers are 23px") becomes historical; not edited (rule 8).
- The anchor-label rule is global: NodeEditor wherever it renders gets 11px labels. Its only host measured is
  the rail.
- The react-select reset is (0,6,1); a later rail rule on `.jj-field input` at (0,7,1) with an `!important`
  border width would beat it. None exists today (read of PWT `:2240-2492`).

## 6. Decisions taken (unattended)

1. React-select fix as a scoped reset, not as `:not()` on B4 (4.1).
2. `.jj-contents-add`: no change, ticket not reproduced (4.4).
3. First toggle vs `.tree-search`: no change (4.5).
4. The 8px `@media (max-width: 400px)` anchor-label rule left alone (4.2).

## 7. Decisions awaiting Alfonso

None (no RC-26 item).

## 8. After-run (same probe, dev server restarted on the edited tree)

- Rail `1200,91,400,877`, palette `1,51,200,916`, canvas `201,91,1398,876`: unchanged in all 8 states.
- Type field: `input.jj-select__input` border 0 / `none`, height 16px (auto), rect `1320,312,4,16`; control
  `1309,304,277,30` and field row `1215,304,371,30` unchanged.
- Section headers 23 -> 26 (Basic) / 24 (Advanced), label centre at 13 / 12.
- Anchor labels 9px -> 11px, 17 of 17; longest `bbr` 17.2x14 inside a 32x32 point; 0 collisions; viz rect
  unchanged.
- First tree toggle: 72 -> 24 missing cells in Basic (sibling overlap gone; row 0 still under `.tree-search`,
  §4.5); Advanced 0. `.jj-contents-add`: 0 missing cells, 6 of 6. NodeEditor's checkbox and relationship link
  (Advanced, NODE open) miss corners before and after: their own layout, outside DOVE.
- Text under 11px in the rail: 17 -> 0. Clipped text 0 -> 0. Console errors: `init_dash` only.
