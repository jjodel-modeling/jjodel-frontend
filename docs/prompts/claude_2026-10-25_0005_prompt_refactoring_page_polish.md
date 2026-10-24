# Refactoring page polish: one Preview label, no empty editor gutter, Jjodie launcher in the header

Prompt-ID: P-2026-10-25-0005
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: fast (three visual fixes on the refactoring tab)
Depends: P-2026-10-24-2340
Status: eseguito 2026-10-25 · lane jjodie-ui-rfp · code faeaf255b · gates green · probe 36/36 · done
Corregge: 2026-10-24 23:40
Request: Alfonso, 2026-10-24 ~23:58 («per le tre imperfezioni procedi con una lane veloce»)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by the measures in the log entry. No core change, no critical-zone file.

Worktree: `~/jjodel-w-jjp-rfp`, branch `jjp-rfp`, cut from the trunk at the commit that adds this prompt (the refactoring page is on the trunk since `749f70283`, R-JJD-15). Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-0005 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. No subagents, no background tasks. Commit as soon as the gates are green. Never read a file over 200 lines whole; outputs through `tail -20` or `grep`. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-rfp.md`. Nothing merges anywhere: the chat merges.

## COSA

Three defects seen on the crops of P-2026-10-24-2340 (`~/.jjodel-lanes/P-2026-10-24-2340/rfa_tab.png`):

1. **Two «Preview».** The right pane's header shows a cyan «Preview» label next to the metamodel name, besides the `Preview` button in the tab header. Remove the pane label; while a preview is active the pane header says it in muted text after the name («metamodel_1 · preview»), and nothing when idle.
2. **Empty gutter right of the editor.** About 70 px of empty column between the code and the split handle, with a full-height blue focus border. Find the cause (Monaco minimap or overview ruler space, or a container width) by measuring; the code area must reach the split handle (no empty column, ±2 px) and the focus border must not draw a full-height blue line on the split.
3. **Floating Jjodie launcher over the preview pane.** On the Refactoring tab the round floating launcher sits over the pane's bottom-right corner, next to Apply. Replace it there with an icon button (robot icon, `aria-label="Open Jjodie"`, 28 px) at the right end of the tab header, after `Preview`, that opens the docked panel (R-JJD-1); the floating launcher is hidden on this tab only (the rule of R-JJD-15 is replaced, other tabs unchanged: measure the launcher on another tab before and after).

Measures in the log: the pane header text idle and previewing; the right edge of the code area against the split handle x; computed border of the editor container when focused; launcher present on another tab (x, y) and absent on the Refactoring tab; the header button opens the dock. Re-run `frontend/scripts/probe/refactoring-split-preview.ts`. Two crops into `~/.jjodel-lanes/P-2026-10-25-0005/` (idle, previewing).

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build.

## DOVE

`frontend/src/components/abstract/tabs/ScriptTab.tsx` and `ScriptTab.scss`, `frontend/src/components/scripts/RefactoringPreviewPane.tsx` and its `.scss`, the launcher rule in `frontend/src/components/Jodie/JodieWindow.css`, the probe if a selector changes, `docs/log-inbox/jjodie-ui-rfp.md`, Status of this prompt.

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`.

## NON FARE

No critical-zone file, no planner change, no other Jodie component. No merge, no push.
