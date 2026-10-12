# Palette click creates a root instance at the centre of the view (F3)

Prompt-ID: P-2026-10-11-1828
Chat: C-2026-10-11-1814
Request: Alfonso, 2026-10-11 18:26: «GO su F3» (F3 of `docs/discovery/discovery_2026-10-11_new_model_instantiate.md` §3.3: a click on a palette entry creates nothing, drag only)
Front: maintenance
Lane: short (brief discovery note, implementation, gates, probe, hard stop for Alfonso's visual GO; no merge). May run under `--auto` only if step 1 confirms no file of CLAUDE.md §3.1 or §3.2 is touched; otherwise stop with `Outcome: question`.
Depends: none (runs in parallel with P-2026-10-11-1825, which touches the reducer and `Defaults.ts`, not these files)
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-paletteclick`, branch `palette-click`, created from the trunk commit that adds this file, `frontend/node_modules` symlinked. Before anything else check `pwd`, the branch and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-11-1828 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`. Do not touch the `Status` line.

## Decision (ratified by Alfonso, 2026-10-11 18:26)

In the M1 (model) palette, a click on a class entry creates one instance of that class:

1. **Where.** At the centre of the visible part of the canvas, converted with `screenToFlowPosition` from the centre of the React Flow pane's bounding rectangle, then shifted by half the default node size exactly as `onDrop` does, so the node's centre lands on the view's centre.
2. **No stacking.** If the candidate box overlaps an existing node's box (`getNodes()`, measured width and height, default size when unmeasured), shift by 24 px right and 24 px down and try again, at most 10 steps; after the last step place it anyway.
3. **Always at the root.** The click never enters a container: no `findIRDropContainerAt`, no membership, no containment choice, even when the centre of the view falls inside a graphVertex container or a containment-capable node. Only the drag chooses a target.
4. **Rootable classes only.** The same gate as the drop: `modeInfo.rootableClasses` (unfiltered). A non-rootable entry does nothing on click, as it does on a canvas drop.
5. **Same creation path as the drop.** `syncCreateObject(graphId, metaclassId, x, y)` with the same snapshot (undo), the same immediate React Flow node (`objectNode`, `autoEdit: true`, label read back from the created object), the same follow-up the canvas-root branch of `onDrop` performs after creation (whatever it does below the branch quoted in step 1: snapshot, mark, layout save, selection). The created node is selected as after a drop.
6. **Drag unchanged.** A drag still works exactly as today; a completed drag must not also fire the click.
7. **Hint.** The M1 hint (`PalettePanel.tsx` ~`:237-238`, today «drag» / «to canvas for root instances») reads «Click or drag» / «to canvas for root instances». The M2 hint («**Drag** classifiers to canvas», ~`:287`) is unchanged.

Out of scope: the M2 palette (classes, packages, enums: click stays inert, note it as a ticket in the inbox), keyboard activation, the classic editor's palette handling, any change to the drop semantics.

## Step 1: brief discovery (read-only), then go on

Read `editor-v2/panels/PalettePanel.tsx` (the class entries at ~`:140-165`, the `undeclaredClasses` group included), `editor-v2/EditorV2.tsx` `onDrop` (~`:2299-2541`) and the `<PalettePanel` call site (~`:4870`). Answer, in `docs/discovery/discovery_2026-10-11_palette_click_create.md` (short report: objective, files read with full paths, findings, risks, open questions):

- Is `PalettePanel` rendered anywhere other than `EditorV2.tsx` (search declared, with a positive control)? If yes, the new prop must be optional and a no-op where absent.
- Which statements of the canvas-root branch of `onDrop` must the click share (the tail after `syncCreateObject` included)? Propose the smallest shared helper inside `EditorV2.tsx`, used by both the drop's canvas-root branch and the click, so the two cannot drift. The drop's container branches stay where they are, untouched.
- Is any touched file in CLAUDE.md §3.1 or §3.2? If yes: stop with `Outcome: question`, no edit.
- New identifiers (the prop name, the helper name, any CSS class): grep each before using it.

If no blocker, commit the report and continue to step 2 without waiting.

## Step 2: implementation

Files expected: `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (optional prop, e.g. `onCreateRoot?: (metaclassId: string) => void`, an `onClick` on the class entries, the hint), `frontend/src/components/editor-v2/EditorV2.tsx` (the shared helper, the click handler with centre and cascade, the prop at the call site), and a pure module with its test for the placement (centre plus cascade) so it is testable without `joiner`, e.g. `frontend/src/components/editor-v2/utils/paletteClickPlacement.ts` and `__tests__/paletteClickPlacement.test.ts` (check the folder convention first). More than three files: list them before editing. No other file.

Unit test for the placement: empty canvas gives the centre; one overlapping node gives one step; a chain gives several; ten occupied steps give the tenth; an unmeasured node uses the default size. Mutation bench on the placement: drop the overlap test, drop the step, drop the cap, drop the half-size shift; each must be killed.

## Step 3: gates and probe

Gates: new tests green; `editor-v2` test folders green; `tsc` error count equal to the trunk baseline; build 0; `check:scripts` PASS.

Probe `frontend/scripts/probe/palette-click-create.ts`, run by `lane-run probe` on a port of your own (not 3000, 3001, 3003, 3080). Scenarios: `click-empty` (new project, metamodel with two concrete rootable classes, model, click one entry: one object, node centred on the view within 2 px); `click-thrice` (three clicks on the same entry: three objects, no two boxes overlapping); `click-panned` (pan and zoom the view first: the node lands at the new view centre); `click-over-container` (a graphVertex container, e.g. a BPMN pool from the examples, filling the view centre: the object is created at the root, its membership unchanged, the container's children count unchanged); `click-non-rootable` (nothing created, empty action trail); `drag-unchanged` (a drag onto the canvas and a drag into a container behave as before: one object each, no extra object from a click); `undo` (one undo after a click removes the object). Record created count, position, membership, console errors, and one screenshot per scenario under `docs/discovery/assets/palette-click-create/`.

## Step 4: close

Inbox entry in `docs/log-inbox/palette-click.md` (P9), the M2 ticket in the same inbox. Commit with explicit pathspec and the `Model:` trailer. Stop with `Outcome: hard-stop` for Alfonso's visual GO. No merge.

## NON FARE

- No change to the container branches of `onDrop`, to `syncCreateObject`, to `canvasToJjom.ts` or any §3.2 file.
- No `git stash`, no `git add .` or `-A`, no push, no merge. Do not touch the `Status` line.
- No renaming of existing identifiers or CSS classes; no opportunistic refactoring of `onDrop` beyond the shared helper of the canvas-root branch.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-11_new_model_instantiate.md` §3.3, §4 (F3); CLAUDE.md §3.1, §3.2, §5 (`joiner` under vitest); PROTOCOL P4, P9, P13, P14; R-GV-8 and S3 (membership on drop, which the click deliberately bypasses).
