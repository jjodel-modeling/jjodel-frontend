# Shell UI: one slim, uniform vertical splitter across the platform

Prompt-ID: P-2026-11-19-2200
Chat: C-2026-11-19-2200
Front: maintenance (the shell-ui front closed on 2026-10-23; later shell work goes to maintenance)
Status: da eseguire
Lane: full (visual change on more than three files, shared component restyle)
Depends: none
Request: https://claude.ai/code/session_01DQt9R6xGnqUtiRzRQbr61k (Alfonso, 2026-11-19 18:20: make all the vertical resizers slicker, slimmer and above all uniform; there are several kinds across the platform)
Branch: `ui-vsplit`, from the tip of `alfonso-frontend-jjtl`, own worktree `~/jjodel-w-vsplit`
Model: default from `.claude/settings.json`; no subagents, no background tasks; one probe run per tool call

Two-phase. Phase 1 is read-only and ends with a saved discovery report and a hard stop. Phase 2 follows in cascade only if the report raises no item from the stop-and-ask list below.

## COSA

Every vertical splitter (a bar between two side-by-side panes, dragged left and right) must look and behave the same everywhere, and weigh less than today. The project chat grepped the trunk at `0008fb4` and found at least eleven different drawings of the same affordance:

| # | Where | Class | Today |
|---|---|---|---|
| 1 | rc-dock panel dividers | `.dock-hbox > .dock-divider` (`components/abstract/style.scss` ~575-612) | `ew-resize`, `scaleX(3)` hit area, cyan 4x40 pill growing to 80px on hover, offset +18px |
| 2 | split of two canvases (P-2026-11-08-2045) | same, `.not-strip > … > .dock-divider` (`style.scss` ~1092) | 6px grey bar visible at rest, 4x32 grip |
| 3 | Properties rail and Instance Manager panes | shared `ResizeHandle` vertical (`components/ResizeHandle/resize-handle.scss`) | 10px strip, 1px hairline, hover-reveal 4x48 pill, slate-50 strip tint on hover, cyan line + 3px glow while dragging |
| 4 | JjTL dev env side and right panels | `.jjtl-side-panel-resize-handle`, `.jjtl-right-panel-resize-handle` (`jjtl/styles/jjtl.scss`) + `.resize-grip-icon-vertical` (`editors/Console/console-tab.scss`) | 12px strip with a `bi-grip-vertical` icon, `ew-resize`, scale on hover |
| 5 | Editor split classic/flow | `.editor-split-divider` (`editor-v2/EditorV2.scss` ~74) | 4px bar, rgba grey, cyan 40% on hover |
| 6 | EditorSwitch panes | `__divider` (`abstract/tabs/EditorSwitch.scss` ~93) | 4px `#e2e8f0` bar, full cyan on hover |
| 7 | Script tab | `.script-tab__handle` (`abstract/tabs/ScriptTab.scss` ~195) | 5px with left border, bg-hover tint |
| 8 | Textual syntax form preview | `.syntax-form__splitter` (`codegen/textual/ui/SyntaxForm.scss` ~404) | 4px with left border, bg-hover tint |
| 9 | Generator tab | `.codegen-tpl__splitter` (`codegen/ui/TemplateEditorTab.scss` ~195, `codegen/ui/splitter.tsx`) | 6px filled bar, focus colour on hover |
| 10 | Jjodie docked window | `.jodie-dock-handle` (`components/Jodie/JodieWindow.css` ~155) | 6px strip, 2px line on hover/drag at the left edge |
| 11 | Languages (MTM) tab | `.separator` (`editors/mtm.scss` ~83) | 1ic wide rounded `#ddd` pill with margins |

Also found, probably dead: `.tree-view-panel-resize-handle` (`editors/properties-with-tree-view.scss` ~824, no TSX renders the class on the trunk), and `components/abstract/style_ap.scss`, which no file imports.

Out of scope: horizontal splitters (row and ns resize: console footer, bottom drawer, JjTL bottom panel, the rail's `.tree-view-panel-vsplit`), and element resize handles on a canvas (`SimBoardEditor` node handles, `SegmentHandles`, `Measurable`). They are not pane splitters. The new rules must be written so the horizontal ones can adopt them later, but this lane does not touch them.

### The target, decided by the project chat (unattended, RC-25)

One visual contract, the VS Code / Linear "sash" model:

- Hit strip: 8px wide, transparent, straddling the seam (4px each side). Where a site needs another geometry to avoid stealing the rc-dock divider (the Properties rail handle does, see its comment), keep that site's geometry and say so in the report; only the drawing is unified.
- At rest: a 1px hairline in `--color-panel-border`, on the seam. Where the seam already paints its own border, no hairline (no doubled 2px seam). No pill, no grip icon, no filled bar, no strip tint, no margins.
- Hover: after a 150ms delay (so a pointer crossing the seam does not flash) the line becomes 2px in `--color-slate-400`, centred on the seam. Nothing else changes.
- Dragging: the line is 2px in `--color-canvas-accent` for the whole drag, no glow. Cyan stays reserved to the drag, as the 2026-08-28 rule in `resize-handle.scss` says.
- Keyboard focus (`:focus-visible`, where the handle is focusable): the same 2px line in `--color-border-focus`, not an outline box.
- Cursor `col-resize` everywhere (no `ew-resize`), on the strip and on `body` during the drag.
- `ResizeHandle` keeps its behaviour: keyboard resize, `aria-*`, the `w NNN` readout chip while dragging, the hover hint. Only its vertical drawing changes; its horizontal drawing is untouched in this lane.

This supersedes two earlier choices, both covered by Alfonso's request quoted above: the hover-reveal pill of the vertical `ResizeHandle` (2026-08-28) and the at-rest grey bar with grip of the canvas split (P-2026-11-08-2045). Record both as amendments in the report and in `docs/decisions.md` (one D-UI row, provisional, unattended).

Single source: one SCSS partial holds the contract as a mixin, used by `resize-handle.scss` and by every bespoke site. The DOM and the drag handlers of each site stay as they are, with one exception: the two JjTL handles drop their `<i class="bi bi-grip-vertical …">` child. Moving bespoke sites onto the `ResizeHandle` component is not part of this lane (pointer vs mouse events, per-site clamping); list in the report which sites could move later and what it would take.

## DOVE

Phase 2 may touch only:

- new partial `frontend/src/styles/components/_vsplit.scss` (name to confirm free with a global grep, together with the mixin name)
- `frontend/src/components/ResizeHandle/resize-handle.scss` (vertical block only)
- `frontend/src/components/abstract/style.scss` (the `.dock-divider` rules for the hbox and the canvas-split rule; vbox dividers untouched)
- `frontend/src/jjtl/styles/jjtl.scss`, `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` (only the two grip `<i>` elements)
- `frontend/src/components/editors/Console/console-tab.scss` (only `.resize-grip-icon-vertical`, if nothing else uses it after the JjTL change; otherwise leave it)
- `frontend/src/components/editor-v2/EditorV2.scss` (`.editor-split-divider` only)
- `frontend/src/components/abstract/tabs/EditorSwitch.scss`, `frontend/src/components/abstract/tabs/ScriptTab.scss`
- `frontend/src/codegen/textual/ui/SyntaxForm.scss`, `frontend/src/codegen/ui/TemplateEditorTab.scss`
- `frontend/src/components/Jodie/JodieWindow.css`, `frontend/src/components/editors/mtm.scss`
- `frontend/src/components/editors/properties-with-tree-view.scss` and `frontend/src/components/abstract/tabs/instanceManagerTab.scss` (only the geometry overrides of their `ResizeHandle`, if the new drawing requires it)
- new probe `frontend/scripts/probe/vsplit-uniform.ts`
- `docs/decisions.md` (one row), `docs/claude-code-log.md`, the discovery report, this prompt's Status line

`DV.tsx`, `VersionFixer.tsx` and every file of the critical zone are out of scope. Dead CSS (`.tree-view-panel-resize-handle`, `style_ap.scss`) is reported, not deleted: deletions wait for Alfonso (RC-26).

## COME

### Phase 1, discovery (read-only)

1. Confirm or correct the inventory above with a global search (`col-resize`, `ew-resize`, `role="separator"` with `aria-orientation="vertical"`, `dock-divider`, `splitter`, `divider`, `resizer`, `resize-handle`), positive control included: the search must find site 3 in `PropertiesWithTreeView.tsx`. Add any site the chat missed.
2. For each site, establish whether it is rendered on the trunk today (TSX path and line, or "dead"), how it is reached in the UI (which tab, which mode, Basic or Advanced), and whether its seam already paints a border.
3. Measure at runtime with a probe in a fresh browser context on the lane's own dev server, port 3006, started by `node frontend/scripts/lane-run.mjs probe ~/jjodel-w-vsplit <probe.ts> --port 3006 --id P-2026-11-19-2200` (never 3001, which is Alfonso's; if 3006 is in use, take the next free port from 3007 up and say which in the report) (Advanced mode; import `frontend/scripts/probe/fixtures/scene_3_DemoESM.jjodel` for the canvas and Properties sites; open JjTL, a generator tab, a syntax form, the Script tab, the Languages tab, Jjodie docked, a two-canvas split): for every reachable splitter, its bounding box, the computed width, background, border and `::before` / `::after` boxes and colours at rest, the cursor, and a 120x200 crop at rest. Save crops under `~/.jjodel-lanes/P-2026-11-19-2200/crops/before/`. The probe becomes `vsplit-uniform.ts` in Phase 2.
4. Check the rc-dock interaction: with the hit strip at 8px and `scaleX(3)` removed, does the divider stay grabbable, and do the Properties rail handle and the dock divider still not steal each other's drag (`properties-with-tree-view.scss` ~159 comment)? Measure, do not reason.
5. Verify the four tokens resolve on the dashboard and inside an editor tab: `--color-panel-border`, `--color-slate-400`, `--color-canvas-accent`, `--color-border-focus`.
6. Save the report to `docs/discovery/discovery_2026-11-19_vertical_splitters_inventory.md` (create `docs/discovery/` if missing). Minimum content: objective, files read with full paths, the confirmed inventory table with the measurements, the geometry exceptions and why, the sites that could later move onto `ResizeHandle`, risks, questions for Alfonso, and the two sections «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

Hard stop after the report is written and committed (docs only).

### Phase 2, implementation

1. Write the partial and the mixin. Every value comes from a token except the 8px strip, the 2px line and the 150ms delay, each commented once in the partial.
2. Apply it site by site, rc-dock and `ResizeHandle` first, then the bespoke sites. Remove from each site what the contract drops (pills, icons, filled bars, tints, margins, `scaleX(3)`), nothing else.
3. Probe `vsplit-uniform.ts`: for every reachable splitter, assert at rest a line of at most 1px (or none where the seam has a border) and a strip of 8px (or the documented exception), on hover after 200ms a 2px slate-400 line, during a real drag a 2px accent line, `col-resize` on strip and body, and that the drag still resizes the pane (width before and after). Crops after, same names, under `crops/after/`. Mutant check: break the mixin's hover colour and see the probe go red, then restore.
4. Gates: the probe green; `npx vitest run` for the suites touching these components (`src/codegen/ui/__tests__/splitter.test.ts` among them) green; typecheck and `npm run build` clean. Commit as soon as the gates are green, one commit for the partial plus `ResizeHandle` plus rc-dock, one for the bespoke sites.
5. Hand the visual check to the project chat (RC-23) with the before/after crop pairs listed in the report.

## Stop and ask

- A site cannot take the contract without changing its DOM or its drag handler (beyond the two JjTL icons).
- Removing `scaleX(3)` or narrowing a strip makes a divider measurably harder to grab, or two handles steal each other's drag, and no geometry exception fixes it inside the DOVE files.
- A token in COME step 5 does not resolve somewhere a splitter lives.
- An exported interface changes (`ResizeHandleProps` included).

## Lane discipline

- `git add <specific files>` only; conventional commits in English, one line, e.g. `style(ui): one slim vertical splitter contract (P-2026-11-19-2200)` and `style(ui): bespoke vertical splitters adopt the contract (P-2026-11-19-2200)`.
- Entry in `docs/claude-code-log.md` at the end, in the standard format.
- At the end replace `Status: da eseguire` in this file with date, lane and shas, in the same docs-only commit as the log entry.
- Close with `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- `frontend/src/components/ResizeHandle/ResizeHandle.tsx`, `resize-handle.scss` (grip-pill restyle, 2026-08-28)
- `frontend/src/components/abstract/style.scss`, rc-dock dividers and the canvas-split rule (P-2026-11-08-2045)
- `frontend/src/components/editors/properties-with-tree-view.scss` ~159-200 (rail handle geometry vs dock divider)
- `frontend/src/components/abstract/tabs/instanceManagerTab.scss` ~145-170 (#158 P2 resizers)
- `frontend/src/codegen/ui/splitter.tsx` and its test (P-2026-10-24-1515)
- `frontend/scripts/probe/jjodie-dock.ts` (pattern for a probe in a fresh context with a fixture)
- shell-ui front (closed 2026-10-23): `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`, R-SHELL-1..5 (shell token layer, `--shell-*` tokens); prefer a `--shell-*` token where one names the role
