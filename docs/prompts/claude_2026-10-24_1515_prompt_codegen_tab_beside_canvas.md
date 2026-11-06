# Code generation 3.3: the generator tab beside the canvas, and resizable columns

Prompt-ID: P-2026-10-24-1515
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (codegen UI only; the dock is driven through its public API, no change to DockManager)
Depends: P-2026-10-24-0318
Status: eseguito 2026-10-24 · lane codegen · 826a0f6bc · completed by P-2026-10-24-1630
Corregge: P-2026-10-24-0003
Request: Alfonso, 2026-10-24 15:08, in the project chat, after his visual check of `cg-generators` (kept locally as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (Alfonso's visual check is the finding). P8 replaced: the chat runs the visual check on the crops
(RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev server may be
running on port 3131 from this worktree: leave it alone, use port 3133 for yours.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-1515 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as
the gates are green. One probe run per tool call. Never print a diff, a whole file or a whole log. Dev server:
`npm start -- --port 3133 --strictPort`, stopped before the close.

## Alfonso's findings (2026-10-24, visual check)

1. «There is no way to click on the code and see on the canvas what happens, because the canvas is hidden: either
   the template or the canvas.» The generator tab opens as a tab in the same dock panel as the canvas
   (`openTemplateEditor.ts:63`, `dock.dockMove(tab, target, 'middle')`), so a fragment click that selects on the
   canvas hides the code.
2. «It would be handy to resize horizontally the template area and the generated area.»

## COSA

1. **Beside the canvas.** `openTemplateEditor` docks a new generator tab as a split to the **right** of the panel
   that holds the active canvas (the editor tab of the model or metamodel it was opened from; else the first panel,
   as today), with about 45 % of the width, using rc-dock's own API (`dockMove(tab, panel, 'right')`). An already
   open tab is only activated, wherever the user moved it. Every generator tab of the same metamodel goes to the
   same panel as the first one (tabs, not a new split each time).
2. **Fragment click keeps both visible.** When a click on a model fragment must show a canvas (R-GEN-41) and that
   canvas is a tab of the same dock panel as the generator tab, move the generator tab to a right split of that
   panel first, then select on the canvas. The code must stay on screen after the click. Alt+click to the template
   is unchanged.
3. **Resizable columns.** In the generator tab, a vertical splitter between the editor column and the right pane
   (Preview/Run/Check), draggable with the mouse and with the keyboard (focusable, Left/Right by 16 px), min 280 px
   each side, double-click resets to the default ratio. The ratio is kept per viewer in `localStorage`
   (`jjodel.codegen.tabSplit`), every read and write in try/catch, the default when absent. The template list keeps
   its fixed width. No new dependency.
4. Tests (kills named): the split position is clamped to the minimums (kills: no clamp); a stored ratio is read back
   and a broken value falls back to the default (kills: parse error throws); the dock target is the canvas panel
   with direction `right` (kills: `middle` kept), with rc-dock's `dock` object mocked.
5. Probe: extend `scripts/probe/codegen-generator-tab.ts`: open the tab from the pill on the Turnstile model, assert
   that the canvas and the tab are both visible (two panels, bounding boxes side by side); click a model fragment,
   assert the canvas selection and that the code view is still visible; drag the splitter, reload, assert the
   ratio is kept. Crops under `~/.jjodel-lanes/P-2026-10-24-1515/crops/`: canvas and tab side by side with a
   selected element after a fragment click; the tab before and after a splitter drag.

## DOVE

`frontend/src/codegen/ui/openTemplateEditor.ts`, `TemplateEditorTab.tsx` and `.scss`, `GeneratorPane.tsx` (only the
click path of item 2), `canvasSelection.ts`, a new small `ui/splitter.ts` (or `.tsx`) and tests under
`ui/__tests__/`, `frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this prompt's
`Status:` line. Rule 19: anything outside, stop with `Outcome: question`.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on`; the probe green; bench killed/total.

## Close

`fix(codegen): generator tab beside the canvas, resizable columns (P-2026-10-24-1515)` (two commits if items 1-2 and
3 separate cleanly), then the docs commit with the log entry (it records Alfonso's visual check of 15:08 with these
findings) and the `Status:` flip `eseguito 2026-10-24 · lane codegen · <fix sha> · <bench k/n> · crops in the lane
folder`. `Outcome: done`.

## NON FARE

No change to `DockManager.tsx` or any dock component outside `src/codegen/`. No change to the generated-text
rendering (the next lane does syntax colouring). Nothing in the critical zone. No push, no merge (R-GEN-39).
