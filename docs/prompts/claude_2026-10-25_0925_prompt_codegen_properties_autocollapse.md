# Code generation 3.3: the Properties panel collapses while a generator tab sits beside the canvas

Prompt-ID: P-2026-10-25-0925
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (small; codegen tab and the Properties panel's collapse state, no critical-zone file)
Depends: P-2026-10-24-1516
Status: eseguito 2026-10-25 · lane codegen · dd1b87b96 · bench 9/9 · crops in the lane folder
Corregge: P-2026-10-24-1515
Request: Alfonso, 2026-10-25 09:21, in the project chat: «chiusura automatica» (chosen over a narrower split)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (the chat's RC-23 check of the 1630 crops `beside_selection.png`, `rail_beside.png`). P8 replaced:
the chat runs the visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev server runs on
3131 from this worktree: never touch it; yours on 3133.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-25-0925 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Commit as soon as
the gates are green. Never print a diff, a whole file or a whole log; filter gate and probe output to summary lines;
one probe run per tool call (the last three codegen UI lanes hit the context ceiling).

## The finding

With the generator tab docked beside the canvas (P-2026-10-24-1515/1630), on a 1600 px viewport the canvas panel is
about 880 px wide and the Properties/Tree panel (400 px, now anchored to the canvas panel's right edge,
`PropertiesWithTreeView.tsx`) covers most of it: after a fragment click the selected element is not visible.

## COSA

1. When a generator tab is visible in a dock panel beside the canvas panel, the Properties/Tree panel collapses, the
   same way its own collapse control collapses it (find that state; do not add a second mechanism). When the last
   visible generator tab beside the canvas closes or moves into the canvas panel, the panel returns to the state it
   had before the auto-collapse.
2. The user wins: if the user reopens the panel while a generator tab is beside the canvas, it stays open until they
   close it; the auto-collapse fires again only on the next opening of a generator tab. Nothing is persisted.
3. With no generator tab, behaviour is unchanged (the one-panel measurements of 1630 must still hold:
   overlay x 1200, 400×877, `--jj-canvas-right-inset` 408px on the Turnstile model).
4. Tests (kills named): opening a generator tab beside the canvas collapses the panel (kills: no collapse); closing
   it restores the previous state, open or closed (kills: always reopened); a manual reopen is kept (kills: re-collapse
   on every render). Probe: extend `scripts/probe/codegen-generator-tab.ts`: open from the pill, assert the panel is
   collapsed and the selected vertex after a fragment click lies inside the visible canvas area; close the tab, assert
   the panel is back. Crops under `~/.jjodel-lanes/P-2026-10-25-0925/crops/`: canvas and tab side by side with the
   selected element visible after a fragment click; the layout after closing the tab.

## DOVE

`frontend/src/components/editors/PropertiesWithTreeView.tsx` (its collapse state only; scope already extended to this
file by the chat on 2026-10-24), `frontend/src/codegen/ui/openTemplateEditor.ts`, `TemplateEditorTab.tsx`,
`generatorTabs.ts`, their tests, `frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this
prompt's `Status:` line. Rule 19 for anything else.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on`; the probe green; bench killed/total.

## Close

`fix(codegen): Properties collapses while a generator tab sits beside the canvas (P-2026-10-25-0925)`, then the docs
commit with the log entry (Layer Impact note on `PropertiesWithTreeView.tsx`) and the `Status:` flip
`eseguito 2026-10-25 · lane codegen · <fix sha> · <bench k/n> · crops in the lane folder`. `Outcome: done`.

## NON FARE

No change to the panel's width, position or insets. Nothing in the critical zone. No push, no merge (R-GEN-39).
