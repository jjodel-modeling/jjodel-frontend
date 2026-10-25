# Code generation 3.3: beside the canvas, the generator's tab lives in the app bar, the split holds content only

Prompt-ID: P-2026-10-25-1510
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (codegen panel chrome and the app bar's tab list; no critical-zone file)
Depends: P-2026-10-25-1441
Status: da eseguire
Corregge: P-2026-10-25-1045, P-2026-10-25-1310
Request: Alfonso, 2026-10-25 15:05-15:06, in the project chat: «il meccanismo di resize non deve comprendere il tab»; confirmed «Esatto» on the chat's reading: the tab belongs in the top bar with «Turnstile» and «demoESM», like every other tab, and beside the canvas only the generator's content remains, resizable, with no second tab bar

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (Alfonso's screenshot and confirmation). P8 replaced: the chat runs the visual check on the crops
(RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `df26ad2c9`. Before anything else: `pwd`, branch,
`git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev
server runs on 3131 from this worktree: never touch it; yours on 3133, stopped before the close. Run any mutation
bench in a temporary detached worktree, as 1355 did.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-25-1510 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit the code as
soon as typecheck and the codegen tests are green, before the probe. Never print a diff, a whole file or a whole log;
one probe run per tool call; no probe while the 1-minute load is above 20.

## The finding

Beside the canvas (1310), the generator panel carries its own rc-dock tab bar («Default · DemoESM ×» plus a maximize
icon, group `codegen` from 1045), and that bar is part of the panel the divider resizes. Alfonso wants one tab bar
only: the app bar at the top (`frontend/src/pages/components/Navbar.tsx`), where the project and model tabs live and
where the generator tab already appears when no canvas is docked (1200).

## COSA

1. **Beside: no panel tab bar.** The generator panel beside the canvas shows its content only (generator column,
   editor, Preview/Run/Check), with no rc-dock tab bar and no maximize control; the divider (7 px grab area, 1355)
   resizes content against canvas. Hide the bar at the narrowest scope (the `codegen` group or the panel's
   `dock-style-codegen` class).
2. **Beside: the tab is in the app bar.** While the generator sits beside a canvas, the app bar lists its tab
   (`bi-code-slash`, `<generator> · <metamodel>`, close control) next to the canvas tab, both shown as visible/active
   (the canvas tab active as today, the generator tab with the same active style or a clear «shown beside» style;
   pick the one that reads as two tabs on screen at once, and say which in the log). Clicking the generator's app-bar
   tab while it is beside keeps the layout and moves focus to the generator; its close control removes the split and
   gives the canvas the full width (and restores the Properties rail, 0925).
3. **Unchanged**: with no canvas docked the generator is a main-panel app-bar tab (1200); the pill and fragment clicks
   move it beside (1310); SELECT_NODE reveal (1441); Properties auto-collapse (0925). No ghost or duplicate entries in
   the app bar when the tab moves between the two placements.
4. Tests (kills named): beside, the panel renders no tab bar (kills: bar shown); beside, the app bar lists the
   generator tab (kills: ghost filter for beside); closing from the app bar removes the split (kills: only the entry
   removed); moving between placements leaves exactly one entry (kills: duplicate). Probe: Alfonso's sequence (model
   canvas, Code pill), assert no `.dock-tab` bar in the codegen panel, the app-bar entry present, a divider drag
   resizing content only, the app-bar close. Crops under `~/.jjodel-lanes/P-2026-10-25-1510/crops/`: canvas and
   generator content side by side with both tabs in the app bar; after the app-bar close (canvas full width).

## DOVE

`frontend/src/pages/components/Navbar.tsx` and its SCSS only for the tab list and the beside style,
`frontend/src/codegen/ui/` (`openTemplateEditor.ts`, `generatorTabs.ts`, `TemplateEditorTab.tsx` and `.scss`), their
tests, `frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this prompt's `Status:` line.
Rule 19 for anything else; `DockManager.tsx` and the critical zone stay untouched.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on` (Navbar.tsx is eager: string prefix only, no generator import); the probe green;
bench killed/total.

## Close

`fix(codegen): beside the canvas the generator tab is in the app bar, the split holds content only
(P-2026-10-25-1510)` (shorten to 72 characters as the hook requires), then the docs commit with the log entry and the
`Status:` flip `eseguito 2026-10-25 · lane codegen · <fix sha> · <bench k/n> · crops in the lane folder`.
`Outcome: done`.

## NON FARE

No new dependency. No push, no merge (R-GEN-39).
