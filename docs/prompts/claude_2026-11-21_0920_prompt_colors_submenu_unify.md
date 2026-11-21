# One Colors submenu: no duplicate, no overlap on the parent menu

Prompt-ID: P-2026-11-21-0920
Chat: C-2026-11-21-0920
Status: da eseguire
Lane: full (discovery then Phase 2 in cascade; editor-v2 menus, no critical zone)
Depends: P-2026-11-21-0100 (merged, 542f8a436)
Request: local only (~/.jjodel-lanes/P-2026-11-21-0920/request.md)
Front: multi-tab

## COSA

Hovering View › Colors on 3001 (trunk b8572fb74) opens two colors submenus at the same time, built by two different
components:

- A: two-line items (Default «Theme colors», Monochrome «Uniform grays», Palette, High Contrast «Bold, saturated»,
  Print «No fills, B&W»), Palette submenu with four color swatches per palette and a «+ New palette» footer, check
  in a left column in the nested submenu but on the right of «Palette ✓ ›». It opens to the LEFT, on top of the
  View menu, and hides Zoom-out, Reset, the Colors row itself and «Show singleton instances».
- B: one-line items with the description inline, opens to the right of the Colors row (the expected place), the
  hovered Palette row filled dark (#334155), nested submenu with the same diamond icon on every palette, the check
  appended after the label («Crimson ✓», shifts the text when selection changes), «Manage palettes…» footer.

Likely cause (to confirm): the old toolbar colors dropdown (`ColorSchemeSelector.tsx`) is mounted inside the View menu
or the `⋯` overflow next to the R-MT-39 submenu built from `canvasViewChoices.ts`, so both open on hover; A is
anchored to a stale rect or flipped for lack of room.

Target behaviour (decided by the chat on Alfonso's «ok», 2026-11-21 09:17):

1. One colors submenu component, used everywhere colors are chosen (View › Colors, the `⋯` overflow, the syntax chip
   if it offers colors). The other path is removed from the menus.
2. Placement: a submenu opens to the right of its parent row; it flips to the left only when the right side has no
   room, and it never overlaps its parent menu (flip to the parent's outer left edge). Only one submenu chain is open
   at a time.
3. Content: B's one-line rows with the secondary text inline (keeps the View menu compact); A's swatches instead of
   the repeated diamond icon in the Palette submenu; the check in a fixed-width left column on every level (no layout
   shift); footer with both «New palette» and «Manage palettes…» if both actions exist today, otherwise keep what
   exists and record it.
4. Hover uses the light hover fill of the rest of the View menu, not the dark filled row.
5. Behaviour of the choices (what each item sets, per-tab persistence from R-MT-40) does not change.

## DOVE

Expected area: `frontend/src/components/editor-v2/Toolbar.tsx`, `canvasViewChoices.ts`, `CanvasViewControls.scss`,
`components/ColorSchemeSelector.tsx`, the View menu component and the shared menu/submenu primitive (locate them).
Tests: `__tests__/canvasViewChoices.test.ts` and the menu tests that exist. Nothing in the critical zone
(`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`,
`VersionFixer.tsx`); if the change needs one of them, stop with `Outcome: question`. If the submenu placement lives in
a primitive shared outside editor-v2, change it only if the fix is the same for every caller and list the callers in
the report. Do not rename existing CSS classes; grep every new identifier before introducing it.

## COME

### Phase 1, discovery (read-only)

- Reproduce on the lane port: open View, hover Colors, record which components mount (React tree or DOM) and why two
  submenus open; same for the `⋯` overflow and the chip.
- Locate the submenu positioning code and the flip rule.
- List what «New palette» and «Manage palettes…» do and whether they are the same action.
- Save the report to `docs/discovery/discovery_2026-11-21_colors_submenu_unify.md` (objective, files read with full
  paths, findings, root cause, risks, open questions each with a `Recommended:` answer), commit it alone. The phase is
  not complete until the file is written.
- Continue to Phase 2 in the same session if the change stays in the expected area (cascade, RC-21/RC-25). Stop only
  for RC-26 items.

### Phase 2, implementation

- Implement points 1 to 5; remove the duplicate path, do not leave both behind a flag.
- Unit test: hovering Colors mounts exactly one colors submenu; placement function never returns a rect that
  intersects the parent menu (right, flipped, narrow viewport).
- `npm run build`, typecheck and the touched test suites must pass.

### Visual check (lane port, never 3001)

Viewport 1440x900 and 1000x700. Open View, hover Colors, then Palette: one submenu per level, none overlapping its
parent (compare bounding rects from the DOM), swatches visible, checks aligned in one column, light hover. Select
another palette: the label does not move. Repeat from the `⋯` overflow. Crops in the lane folder.

## Lane discipline

- No subagents, no background tasks. One probe run per tool call.
- Commit as soon as the gates are green: `git add <specific files>` only.
- Commit message: `fix(editor-v2): one colors submenu, never over its parent (P-2026-11-21-0920)`
- Entry in `docs/log-inbox/multi-tab.md`; flip `Status` in
  this file in the same docs-only commit. If a decision row is needed, copy the header shape of R-MT-39 exactly (the
  register parser rejects nested parentheses).
- Final line: `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- R-MT-39 (canvas bar, View › Syntax and View › Colors), R-MT-40 (notation and colors per tab).
- Discovery `docs/discovery/discovery_2026-11-20_canvas_toolbar_rationalization.md`.
- Design system: no layout shifts, 8 px grid, Bootstrap Icons only.
