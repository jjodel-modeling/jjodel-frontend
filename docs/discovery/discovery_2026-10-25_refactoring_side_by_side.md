# Discovery 2026-10-25: the Refactoring tab beside its target's tab

Prompts P-2026-10-25-0020 (stopped at the context ceiling, handoff `~/.jjodel-lanes/P-2026-10-25-0020/handoff.md`)
and P-2026-10-25-0040 (continuation). Branch `jjp-sbs`. This report is the P4 discovery of 0020, completed by 0040.

## Step 1 of 0020 (from its handoff, not re-measured by 0040)

- The main dock is `DockManager.dock`, a `PinnableDock` (`frontend/src/components/dock/MyRcDock.tsx`) created in
  `Dock.tsx:420`. The beside helper therefore lives in `DockManager.tsx` (`openBeside`, `besideRatio`), not in
  `MyRcDock.tsx`, which stays untouched.
- rc-dock 3.3.2 splits a panel in two equal halves (`dockPanelToPanel`, `Algorithm.js:198-210`); its divider changes
  sizes in place (`DockBox.changeSizes`, `DockBox.js:57-68`). `openBeside` sets the 40/60 sizes on a new dockbox
  object and calls `changeLayout(..., 'update')`, as the divider does.
- The canvas ghost preview reads `scriptPreviewStore`; an optional `owner` lets the tab publish its own plan and
  clear it on close (`publishScriptPreview`, `clearOwnedScriptPreview`).

## Why the beside panel was 0 px wide (0040)

Two independent causes, both measured with the probe `refactoring-side-by-side.ts`:

1. `frontend/src/components/dock/DockManagerStyles.scss:590-597`: under `.not-strip > .dock-layout`, every
   `.dock-panel` is `display: none` unless it `:has(.not-pinned)`. `.not-pinned` has one writer, the `TabHeader`
   wrapper (`MyRcDock.tsx:136`; the search returned that line, so it ran), used by the built-in tabs of
   `Dock.tsx:292-307` (`project_summary` among them). A panel holding only canvas tabs is never shown. The DOM box
   of the right panel read x=0, width=0 (display none), not x≈1600, width=0. Fix: `ScriptTab.scss` shows the panels
   of the hbox that holds a beside Refactoring tab.
2. `frontend/src/components/abstract/style.scss`: the legacy blocks for `body[data-editor-type="summary"|
   "transformation"]` hide the last panel and force the first to `flex: 1 !important`; the script tab sets
   `transformation` (`DockManager.openScript`). The default layout mode is `split` (`Dock.tsx:35`), whose block caps
   the last panel at `max-width: 710px` (the 60 % side is 960 px at 1600). The four blocks (split, sidebar, summary,
   transformation) now skip `.dock-hbox:has(> .dock-panel .script-tab--beside)`.

## The `rsbOrg` model beside an M2 Refactoring (0040)

`createProjectRefactoring` opens the tab before the new entry is readable from the store (`openScript` falls back on
the written entry for this reason). On that first render `readTarget(undefined)` is «any level»,
`compatibleModels` lists models first, and `chosen` became the M1 model `rsbOrg`; the placement timer put it beside,
then the entry arrived (M2) and the metamodel was moved into the same panel. A bug of 0020: the placement now waits
for the entry. The probe checks that no M1 tab goes beside an M2 Refactoring.

## Measures

- Transformation tab (JjTL, opened by `DockManager.openTransformation`, 1600×1000), before and after: alone, panel
  `+2` 0..1600; with the metamodel split right of it and the JjTL tab active, `+2` 1599 px and `+22` 0 px (hidden).
  Identical: the legacy rules still apply wherever no Refactoring tab is beside.
- `refactoring-side-by-side.ts`: 25/25; editor 544 px, canvas 815 px (share 0.400), 3 ghost edges, 8 class positions
  unchanged. The first canvas read waited 4 s and found 5 of 8 classes on a loaded machine (the 3 classes added by
  the scene arrived later; all 8 were drawn after the move): the probe now waits for them.

## Decisions taken (unattended)

0020's five (handoff), plus 0040's: the panel-visibility rule lives in `ScriptTab.scss` (scoped to the beside hbox)
rather than in `DockManagerStyles.scss`; the beside placement waits for the tab's entry. Row R-JJD-16 in
`docs/decisions.md`.

## Decisions awaiting Alfonso

R-JJD-16 amends R-JJD-15 (ratified): the Refactoring tab's preview goes to the shared `scriptPreviewStore` and draws
on the real canvas beside it, the class-box pane only as the fallback under 1100 px. 0020's prompt asked for it
(request of 2026-10-25 ~00:12); the row is provisional until acknowledged.
