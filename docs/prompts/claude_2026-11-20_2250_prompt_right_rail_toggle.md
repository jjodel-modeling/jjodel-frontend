# Right rail collapse toggle: move from canvas zoom cluster to the rail

Prompt-ID: P-2026-11-20-2250
Chat: C-2026-11-20-2250
Status: da eseguire
Lane: fast (multi-tab follow-up on shell chrome, no critical zone)
Depends: none
Request: none (typed in the project chat, not an issue)
Front: multi-tab

## COSA

The collapse toggle of the right rail (the `>>` double chevron) currently sits inside the canvas zoom cluster (`- 100% + | >>`) at the top right of the canvas. That placement only makes sense with a single canvas. With editor groups (Split Right) every pane has its own canvas, so the toggle is either duplicated per pane or lives only in the rightmost one: in both cases it reads as a per-canvas command while it controls a shell-level element.

Target behaviour:

1. The zoom cluster (`- 100% +`) stays in each pane, unchanged. It is per canvas. Remove only the `>>` button and its separator from the cluster.
2. The toggle moves into the right rail, in the rail title row, right-aligned. Icon `bi-chevron-double-right`, tooltip "Hide panel", `aria-label` the same.
3. When the rail is collapsed it does not disappear: it becomes a narrow strip with the same tinted rail background, full height, holding a single `bi-chevron-double-left` button (tooltip and `aria-label` "Show panel"). The button sits at the same vertical position the toggle had when the rail was open (no jump for the pointer).
4. Strip width: if the left rail already has a collapsed state, use the same width and the same button component; otherwise 28px. Stay on the 8px grid.
5. Open/closed state keeps the current persistence (whatever stores it today). Any existing keyboard shortcut keeps working and toggles the same state.
6. No layout shift in the panes beyond the rail width change: canvases reflow once, splitters keep their relative proportions.
7. Same behaviour in Basic and Advanced.

## DOVE

Lanes in flight near this area: `ui-vsplit` (splitters, worktree `~/jjodel-w-vsplit`) and P-2026-11-20-1610 editor chrome parity (hard-stop, worktree `~/jjodel-w-edchrome`). Do not touch splitter code. In Phase 1, check with `git diff alfonso-frontend-jjtl...<branch> --stat` whether either branch modifies the files you will touch, and record overlaps in the report.

Phase 1 decides the exact file list. Expected area: the canvas zoom cluster component, the right rail container and its title row, the shell layout that sizes the rail, the SCSS of those components. Nothing in the critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`); if Phase 1 finds the toggle state wired through one of them, stop.

## COME

### Phase 1, discovery (read-only)

- Locate the `>>` button in the zoom cluster, its handler, and where the right rail open/closed state lives (context, store, local state) and how it is persisted.
- Check whether the toggle is rendered once per editor group or only in one pane.
- Check whether the left rail has a collapse affordance and a collapsed strip; record its component, width and classes.
- Grep every new class name or identifier you plan to introduce before using it.
- Save the report to `docs/discovery/discovery_2026-11-20_right_rail_toggle.md` (objective, files read with full paths, findings, risks, open questions). The phase is not complete until the file is written.
- If the change stays inside the expected area and touches no exported interface, continue to Phase 2 in the same session (cascade, recommended answers adopted unattended per RC-21/RC-25). Stop only for RC-26 items.

### Phase 2, implementation

- Remove the button from the zoom cluster; keep the cluster spacing correct without the separator.
- Add the toggle to the rail title row and the collapsed strip with the reopen button.
- Reuse the existing state and setter; do not create a second source of truth.
- Bootstrap Icons only. No new dependencies. No renames of existing classes, props or identifiers. No opportunistic refactoring.
- `npm run build` must pass.

### Visual check (built-in browser, localhost)

Single canvas and two panes after Split Right: zoom cluster present in each pane without `>>`; toggle in the rail title row; collapsing leaves the strip with the reopen button at the same y; reopening restores the rail; state survives a reload; Basic and Advanced. Measure from the DOM (button rects before and after collapse, strip width).

## Lane discipline

- No subagents, no background tasks. One probe run per tool call.
- Commit as soon as the gates are green: `git add <specific files>` only.
- Commit message: `fix(shell): move right rail toggle from canvas zoom cluster to the rail (P-2026-11-20-2250)`
- Add the entry to `docs/claude-code-log.md`; flip `Status` in this file in the same docs-only commit.
- Tag the trunk tip `pre-right-rail-toggle-2026-11-20` before merging.
- Final line: `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- Shell-ui front: tinted rail background, lowercase right rail titles, muted action icons (already approved).
- Multi-tab front: editor groups with independent tab bars, Split Right only.
- Design system: slate #334155, cyan #0ea5e9, 11px secondary text, 8px grid.
