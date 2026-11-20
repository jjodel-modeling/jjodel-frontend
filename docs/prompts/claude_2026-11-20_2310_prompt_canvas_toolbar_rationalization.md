# Canvas toolbar rationalization: syntax and colors move to the View menu, per-group syntax chip, toolbar overflow

Prompt-ID: P-2026-11-20-2310
Chat: C-2026-11-20-2310
Status: eseguito 2026-11-21 · lane toolbar · d8fff434d · verifica visiva passata 2026-11-21 (chat, RC-23)
Lane: full (discovery then Phase 2 in cascade; shell chrome, no critical zone)
Depends: none
Request: none (typed in the project chat, not an issue)
Front: multi-tab

## COSA

The canvas toolbar of each editor pane holds, next to undo/redo, duplicate, delete and the other actions, two dropdowns:

- a presentation dropdown for the abstract syntax: Structured (class diagram like), Simplified (names only), Compact (headers only), Wireframe (blueprint), ER (entity-relationship);
- a colors dropdown: Default (theme colors), Monochrome, Palette (submenu), High Contrast, Print.

With editor groups (Split Right, minimum pane width 280px) the toolbar does not fit and the two dropdowns cost space for choices that are rarely changed. At the same time every tab already has a persistent syntax choice (graphical or textual), so the presentation dropdown is a second place answering the same question ("how do I see this model in this tab?").

Decisions taken in the project chat (Alfonso delegated the choice):

1. **One syntax selector per tab.** The presentation variants are folded into the per-tab syntax choice, as sub-entries of the abstract (graphical) syntax. The textual syntax, when available, stays an entry of the same selector. This is a UI unification only: no data moves, the stored presentation value and the stored per-tab syntax keep their current storage and meaning. If Phase 1 finds that the two are stored at different scopes (for example presentation per model or global, syntax per tab), keep both storages as they are and record the mismatch in the report; do not migrate data.
2. **View menu is the canonical home.** In the topbar View menu add:
   - `Syntax` submenu: the abstract syntax entries (Structured, Simplified, Compact, Wireframe, ER, with their current one-line descriptions and icons) and, separated, the textual syntax when the active model has one. Check mark on the current choice.
   - `Colors` submenu: Default, Monochrome, Palette (nested submenu as today), High Contrast, Print, with the current descriptions. Check mark on the current choice.
   - The visibility toggle now in the toolbar (eye icon, `bi-eye`), if Phase 1 confirms it is a view setting, moves to the View menu as a checkable entry with the same label it has today as tooltip.
   Every entry acts on the active editor group only. On a View menu opened while no canvas is active, the entries are disabled.
3. **Per-group syntax chip.** Each editor group shows the current syntax as a compact text chip (11px, muted, e.g. `Structured`) in the group header, right-aligned in the tab bar row of that group. Click opens the same choices as View › Syntax as a popover anchored to the chip. It has a fixed width per label set (no layout shift when the value changes; use the width of the longest label). Tooltip "Change syntax". If the tab bar row has no room for it in Phase 1's measurements at 280px, place it in the zoom cluster row instead and say so in the report.
4. **Toolbar keeps only per-canvas editing commands**, in this priority order (highest first): undo, redo, grid, auto-layout, delete, duplicate, then the remaining buttons Phase 1 inventories. The two dropdowns and the eye leave the toolbar.
5. **Overflow.** When the pane is too narrow, lowest-priority buttons move into a trailing `bi-three-dots` button that opens a menu listing them with icon and label. Nothing disappears without an overflow entry. Measurement via `ResizeObserver` on the toolbar container; no layout shift beyond the buttons moving into the overflow. Buttons do not hide or show with the selection state (they stay, disabled as today).
6. Keyboard shortcuts, if any exist today for these commands, keep working. Do not add new shortcuts.
7. Same behaviour in Basic and Advanced. In Basic, the View › Syntax and View › Colors entries are visible (they are view settings, not advanced editing).

## DOVE

Lanes in flight near this area, from another chat: `P-2026-11-20-2250` right rail toggle (worktree `~/jjodel-w-railtoggle`, it edits the canvas zoom cluster), `P-2026-11-19-2200` splitters (`~/jjodel-w-vsplit`), editor chrome parity (`~/jjodel-w-edchrome`). Do not touch splitter code or the zoom cluster's `>>` button. In Phase 1 run `git diff alfonso-frontend-jjtl...<branch> --stat` for `right-rail-toggle` (or whatever branch `~/jjodel-w-railtoggle` holds), `ui-vsplit` and the editor chrome parity branch, and record which of the files you plan to touch they also touch. If overlaps exist, keep your hunks away from theirs and list them in the report.

Phase 1 decides the exact file list. Expected area: the canvas toolbar component and its SCSS, the presentation and colors dropdown components, the topbar menu definition (View menu), the editor group header / tab bar, the per-tab syntax selection state. Nothing in the critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`); if Phase 1 finds the presentation or colors state wired through one of them, stop with `Outcome: question`.

## COME

### Phase 1, discovery (read-only)

- Inventory every button and dropdown of the canvas toolbar: icon, tooltip, handler, what state it reads and writes, whether it is per pane or global. Name the ones whose purpose is unclear.
- Locate where the presentation choice and the colors choice are stored, their scope (per tab, per model, per viewpoint, global) and persistence.
- Locate the per-tab syntax choice from the multi-tab front and its selector UI, if any.
- Locate the View menu definition in the topbar and how menu entries are enabled/disabled and checked.
- Measure, in the built-in browser at a 1600px window, the toolbar width in a single pane and in two and three panes after Split Right; and the free width in each group's tab bar row.
- Grep every new class name, identifier, event or context key you plan to introduce before using it.
- Save the report to `docs/discovery/discovery_2026-11-20_canvas_toolbar_rationalization.md` (objective, files read with full paths, findings, toolbar inventory table, storage scopes, overlaps with the lanes above, risks, open questions each with a `Recommended:` answer). The phase is not complete until the file is written and committed (`git add` of that file only).
- If the change stays inside the expected area, touches no exported interface in a breaking way and no critical-zone file, continue to Phase 2 in the same session (cascade, recommended answers adopted unattended per RC-21/RC-25). Stop only for RC-26 items.

### Phase 2, implementation

- Implement points 1 to 7 of COSA, reusing the existing state and setters for presentation, colors, syntax and visibility. No second source of truth.
- The popover of the chip and the View submenus render the same entry list from one shared definition (no duplicated lists).
- Bootstrap Icons only. No new dependencies. No renames of existing classes, props or identifiers. No opportunistic refactoring. Adding optional properties to interfaces is fine.
- `npm run build` must pass, plus the existing test suites touched by the change.

### Visual check (built-in browser, localhost, lane port)

Scenes: (a) one pane, metamodel open; (b) two panes after Split Right; (c) three panes at 1600px; (d) Basic mode, one pane. In each: toolbar without the two dropdowns and the eye; syntax chip in the group header with the current value; View › Syntax and View › Colors with check marks on the current values; choosing an entry from the chip or from the menu changes only the active group; overflow menu present when buttons do not fit and listing exactly the missing buttons; values survive a reload. Measure from the DOM (toolbar width, chip rect before and after a value change to prove no layout shift, overflow contents). Save crops of each scene in the lane folder.

## Lane discipline

- No subagents, no background tasks. One probe run per tool call.
- Commit as soon as the gates are green: `git add <specific files>` only.
- Commit message: `feat(shell): move syntax and colors to View menu, per-group syntax chip, toolbar overflow (P-2026-11-20-2310)`
- Add the entry to `docs/claude-code-log.md`; flip `Status` in this file in the same docs-only commit.
- Final line: `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- Shell-ui front: Linear-style consolidation, tinted rails, muted action icons, higher density in Advanced (approved).
- Multi-tab front: editor groups with independent tab bars, Split Right only, persistent per-tab syntax choice, textual syntax selectable per tab, commands act on the active pane and are disabled on the others, minimum pane width 280px.
- Design system: slate #334155, cyan #0ea5e9, 11px secondary text, 8px grid, no layout shifts.
- VS Code precedent: the language mode of an editor is shown as a clickable status indicator, not as a toolbar dropdown.
