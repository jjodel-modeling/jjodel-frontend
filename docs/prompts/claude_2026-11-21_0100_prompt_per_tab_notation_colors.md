# Notation and colors stored per tab, next to the viewpoint

Prompt-ID: P-2026-11-21-0100
Chat: C-2026-11-20-2310
Status: da eseguire
Lane: full (discovery then Phase 2 in cascade; editor-v2 state, no critical zone)
Depends: P-2026-11-20-2310 (merged, cbbae0da3)
Request: none (open question 2 of the 2026-11-21 checkpoint, «ok alle raccomandazioni» by Alfonso 2026-11-21 00:59)
Front: multi-tab

## COSA

After R-MT-39 the syntax chip of each editor group shows notation (Structured, Simplified, Compact, Wireframe, ER) and the View › Colors choice for that group. The live value belongs to each canvas, but both are persisted under one shared `localStorage` key each and read when a canvas opens (`EditorV2.tsx`, around lines 1178-1239 at defd1fc19; re-locate on the current trunk). The viewpoint, instead, is persisted per tab. After a reload every group shows the last notation and colors chosen anywhere, not its own.

Target behaviour:

1. Notation and colors are persisted per tab, with the same key scheme and the same lifetime as the per-tab viewpoint (same store, same project scoping, same cleanup when a tab is closed).
2. Reading order when a canvas opens: the tab's own value; if absent, the current global key (last value chosen anywhere); if absent, the current default. This is the migration: existing users keep what they see today, and a new tab inherits the last choice.
3. Writing: a choice from the chip or from View › Syntax / View › Colors writes the tab's value and also updates the global key (so 2 keeps meaning «last used»).
4. Palette choices (the Palette submenu) follow the same rule as colors.
5. No change to the UI, to R-MT-39's entries, or to what the chip and menus show for the active group.

## DOVE

Expected area: `EditorV2.tsx` (persistence of notation and colors), the per-tab viewpoint persistence it already uses, `canvasViewChoices.ts` if the registry needs the tab id for writes, `ColorSchemeSelector.tsx` only if the palette write path lives there. Nothing in the critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`); if the persistence is wired through one of them, stop with `Outcome: question`. Do not touch splitter code (`ui-vsplit` lane in flight from another chat) or the right rail toggle (`~/jjodel-w-railtoggle`); check overlaps with `git diff alfonso-frontend-jjtl...<branch> --stat` and record them.

## COME

### Phase 1, discovery (read-only)

- Locate the two global keys, their read and write sites, and the per-tab viewpoint persistence (key scheme, project scoping, cleanup on tab close, persistence of editor groups from R-MT-33).
- List every reader of the two global keys outside the canvas (export, print, dashboard, tests).
- Grep every new identifier or key before introducing it.
- Save the report to `docs/discovery/discovery_2026-11-21_per_tab_notation_colors.md` (objective, files read with full paths, findings, risks, open questions each with a `Recommended:` answer), commit it alone. The phase is not complete until the file is written.
- Continue to Phase 2 in the same session if the change stays in the expected area (cascade, RC-21/RC-25). Stop only for RC-26 items.

### Phase 2, implementation

- Implement points 1 to 4 reusing the existing per-tab persistence; no second store.
- Unit test for the reading order (tab value, global fallback, default) and for the double write.
- `npm run build`, typecheck and the touched test suites must pass.

### Visual check (lane port, never 3001)

Two groups after Split Right on the same metamodel: set Compact + Monochrome in the left group and ER + Default in the right; reload; each group keeps its own pair (read the chip text and the canvas class from the DOM). Open a third tab: it starts with the last pair chosen. Close a tab and reload: no stale entry left (read the store). Crops in the lane folder.

## Lane discipline

- No subagents, no background tasks. One probe run per tool call.
- Commit as soon as the gates are green: `git add <specific files>` only.
- Commit message: `fix(editor-v2): persist notation and colors per tab (P-2026-11-21-0100)`
- Entry in `docs/log-inbox/multi-tab.md`; flip `Status` in this file in the same docs-only commit. If a decision row is needed, copy the header shape of R-MT-39 exactly (the register parser rejects nested parentheses).
- Final line: `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- R-MT-39 (canvas bar, syntax chip, View › Syntax and View › Colors), R-MT-33 (editor groups persist per user and project).
- Checkpoint `docs/sessioni/sessione_2026-11-21_toolbar.md`, open question 2.
- Discovery `docs/discovery/discovery_2026-11-20_canvas_toolbar_rationalization.md` §5 (storage scopes).
