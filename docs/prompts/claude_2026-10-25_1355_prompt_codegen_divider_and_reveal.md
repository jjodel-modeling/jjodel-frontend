# Code generation 3.3: resizable divider beside the canvas, and a fragment click that shows its element

Prompt-ID: P-2026-10-25-1355
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (codegen UI; dock divider CSS at the narrowest scope; no critical-zone file)
Depends: P-2026-10-25-1310
Status: eseguito 2026-10-25 · lane codegen · f141bb614 · item 2 completed by P-2026-10-25-1441
Corregge: P-2026-10-25-1310, P-2026-10-24-1515
Request: Alfonso, 2026-10-25 13:52, in the project chat: «adesso si apre affiancato il canvas, la separazione tra canvas e il resto non è resizable, inoltre quando clicco su un elemento non si seleziona l'elemento nel canvas»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 replaced by item 0 (measured diagnosis in the log entry). P8 replaced: the chat runs the visual check on
the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `827818efc`. Before anything else: `pwd`, branch,
`git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev
server runs on 3131 from this worktree: never touch it; yours on 3133, stopped before the close.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-25-1355 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit each item's
code as soon as typecheck and the codegen tests are green, before the probe. Never print a diff, a whole file or a
whole log; one probe run per tool call; no probe while the 1-minute load is above 20.

## Alfonso's findings (13:52, after 1310)

A. The generator now opens beside the canvas, but the boundary between the canvas panel and the generator panel cannot
   be dragged. Known lead (1045 handoff): `DockManagerStyles.scss:322` hides the dock divider when the first panel has
   one tab.
B. «When I click on an element the element is not selected on the canvas.» The 1310 probe saw the selection
   (`coin : Event` highlighted) after a fragment click, so the defect is in a case the probe does not cover. Leading
   hypothesis to test first: the selection happens but the node lies outside the narrowed canvas viewport, so nothing
   visible changes. Other cases to check: fragments of the `$ID` table (`locked: 'Pointer…'`), of `EVENTS`, of the
   transition entries; a click right after the tab moved beside (focus or stale canvas reference); a model tab opened
   by the click itself.

## COSA

0. **Diagnose (15 minutes at most)** on 3133 with the cloned Turnstile gallery project, Alfonso's sequence (model
   canvas open, Code pill, generator beside): (a) can the canvas/generator boundary be dragged, which rule hides or
   disables it; (b) click a fragment in each of the four groups above and record, per click, whether the node is
   selected in the store and whether it is inside the visible canvas viewport. Two lines each in the log entry.
1. **Resizable boundary.** The divider between the canvas panel and the generator panel is visible and draggable, with
   rc-dock's own divider. Fix at the narrowest scope: a selector that matches only a box containing the generator panel
   (for example `:has(> .dock-style-codegen)`), in `TemplateEditorTab.scss`. If the rule cannot be overridden from
   there, `DockManagerStyles.scss` may change with a selector limited to that case; measure that a box without a
   generator panel still hides its divider exactly as today.
2. **A click shows its element.** A click on a model fragment selects the node **and brings it into view** on the
   canvas (center or scroll it into the visible area, with React Flow's own API, without changing the zoom unless the
   node does not fit), in every group of item 0. Fix whatever other case item 0 finds failing.
3. Tests (kills named): the divider rule applies only to a box with a generator panel (kills: every divider shown);
   a selection outside the viewport triggers the reveal (kills: no reveal); a selection already visible does not move
   the canvas (kills: reveal on every click). Probe: Alfonso's sequence, a drag of the boundary (width changes), a click
   on a fragment whose node starts off-screen. Crops under `~/.jjodel-lanes/P-2026-10-25-1355/crops/`: before and after
   dragging the boundary; a click on an off-screen element, revealed and selected.

## DOVE

`frontend/src/codegen/ui/` (`canvasSelection.ts`, `GeneratorPane.tsx`, `TemplateEditorTab.scss`, `generatorTabs.ts`),
their tests, `frontend/src/components/abstract/DockManagerStyles.scss` only as item 1 allows,
`frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this prompt's `Status:` line. The
critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`,
`DV.tsx`, `VersionFixer.tsx`) stays untouched: the reveal goes through React Flow's instance from codegen code; if it
cannot, stop with `Outcome: question`.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on`; the probe green; bench killed/total.

## Close

One `fix(codegen)` commit per item, then the docs commit with the log entry (item 0's diagnosis) and the `Status:`
flip `eseguito 2026-10-25 · lane codegen · <last fix sha> · <bench k/n> · crops in the lane folder`. `Outcome: done`.

## NON FARE

No change to `DockManager.tsx`. No new dependency. No push, no merge (R-GEN-39).
