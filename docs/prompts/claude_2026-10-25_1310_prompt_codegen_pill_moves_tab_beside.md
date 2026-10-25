# Code generation 3.3: from a canvas, an open generator tab moves beside it

Prompt-ID: P-2026-10-25-1310
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (codegen tab placement; no critical-zone file)
Depends: P-2026-10-25-1200
Status: da eseguire
Corregge: P-2026-10-25-1200
Request: Alfonso, 2026-10-25 13:05, in the project chat: «aprendo il canvas con un modello e cliccando su code, riappare il tab del generatore senza affiancare il modello»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (finding below). P8 replaced: the chat runs the visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `0aadc69ef`. Before anything else: `pwd`, branch,
`git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev
server runs on 3131 from this worktree: never touch it; yours on 3133, stopped before the close.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-25-1310 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Commit the code as
soon as typecheck and the codegen tests are green, before the probe. Never print a diff, a whole file or a whole log;
one probe run per tool call; no probe while the 1-minute load is above 20.

## The finding

Alfonso opened the generator from GENERATORS with no canvas docked (it became an app-bar tab, 1200), then opened the
model canvas and pressed the Code pill: the existing generator tab was only activated, as an app-bar tab over the
canvas, instead of moving beside it. The rule «an already open tab is only activated» (1515) defeats the beside
placement whenever the tab was first opened without a canvas.

## COSA

1. **One rule for placement**: whenever the generator is asked for from a canvas (the pill, or a fragment click that
   needs the canvas), and the generator tab is not already beside that canvas, move it beside the canvas (right split,
   ~45 %, the panel of the metamodel's other generator tabs if one exists), activate it and keep the canvas active in
   its panel; the app bar then shows the canvas tab active and no longer lists the generator as a main-panel tab.
   Properties auto-collapse (0925) applies as on any beside opening. A tab already beside the canvas is only activated.
2. **Back to the app bar**: opening from GENERATORS while no canvas is the active main-panel tab keeps today's app-bar
   behaviour (1200), moving the tab back into the main panel if it was beside a canvas that is no longer shown.
3. **Fragment click** in the app-bar placement: the model's canvas opens and the generator moves beside it by rule 1,
   so the code stays visible next to the selection.
4. Tests (kills named): a tab in the main panel moves beside on a pill opening (kills: only activated); a tab already
   beside is not moved (kills: moved every time); a fragment click from the app-bar placement ends with canvas and tab
   side by side (kills: canvas tab activated over the code). Probe: the exact sequence of the finding (GENERATORS with
   the project page active → open the model canvas → Code pill) plus a fragment click; crops under
   `~/.jjodel-lanes/P-2026-10-25-1310/crops/`: after the pill (canvas and tab side by side, app bar with the canvas
   tab active); after a fragment click (selection visible beside the code).

## DOVE

`frontend/src/codegen/ui/openTemplateEditor.ts`, `generatorTabs.ts`, `canvasSelection.ts`, `TemplateEditorTab.tsx`,
their tests, `frontend/src/pages/components/Navbar.tsx` only if the app-bar list needs it (scope as in 1200),
`frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this prompt's `Status:` line.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on`; the probe green; bench killed/total.

## Close

`fix(codegen): from a canvas the generator tab moves beside it (P-2026-10-25-1310)`, then the docs commit with the log
entry and the `Status:` flip `eseguito 2026-10-25 · lane codegen · <fix sha> · <bench k/n> · crops in the lane
folder`. `Outcome: done`.

## NON FARE

Nothing in the critical zone. No change to `DockManager.tsx`. No push, no merge (R-GEN-39).
