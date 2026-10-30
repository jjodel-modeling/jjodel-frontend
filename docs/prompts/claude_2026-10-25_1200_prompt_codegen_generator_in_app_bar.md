# Code generation 3.3: the generator tab in the app bar, like the project and model tabs

Prompt-ID: P-2026-10-25-1200
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (codegen tab placement plus the app bar's tab list; no critical-zone file)
Depends: P-2026-10-25-1045
Status: eseguito 2026-10-25 · lane codegen · 93cbd14fd · bench 7/7 · crops in the lane folder
Corregge: P-2026-10-25-1045
Request: Alfonso, 2026-10-25 11:56, in the project chat: «procedi in /lane auto» on the chat's recommendation to put the generator tab in the app bar (his direction of 2026-10-23: «la template come un tab esattamente come tutto il resto»)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (diagnosis in the 1045 log entry of `docs/log-inbox/codegen.md`). P8 replaced: the chat runs the
visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `421c4391a`. Before anything else: `pwd`, branch,
`git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev
server may run on 3131 from this worktree: never touch it; yours on 3133, stopped before the close.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-25-1200 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. **Commit the code as
soon as typecheck and the codegen tests are green, before the probe** (five codegen UI lanes in a row hit the context
ceiling; the last one left a finished tree uncommitted). Never print a diff, a whole file or a whole log; filter gate
and probe output to summary lines; one probe run per tool call. Do not launch the probe when `uptime`'s 1-minute load
is above 20: wait and recheck.

## Context

After 1045, generator tabs live in their own dock group `codegen` with rc-dock's title bar. With a canvas docked they
open in a right split beside it (keep that). With no canvas docked they open in a right split of the project page,
which is narrow (crop `~/.jjodel-lanes/P-2026-10-25-1045/crops/header_leftbar.png`). The app bar
(`frontend/src/pages/components/Navbar.tsx`, `syncTabs`) lists the project and model/metamodel tabs of the first dock
panel and drops `codegen_tpl_*` ids as ghosts.

## COSA

1. **No canvas docked → an app-bar tab.** The generator opens as a tab of the main panel, listed in the app bar
   beside the project and model tabs, with an icon (`bi-code-slash`), its title `<generator> · <metamodel>`, the
   active state and the close control the other app-bar tabs have; selecting it shows the generator full width.
   `syncTabs` learns the `codegen_tpl_` ids instead of dropping them. Change `Navbar.tsx` only as much as that needs.
2. **Canvas docked → beside, unchanged.** The right split beside the canvas of 1515/1045 stays, with its own title
   bar and the Properties auto-collapse of 0925. A generator tab moved between the two placements by the user keeps
   working (no ghost entries in the app bar, no duplicate tabs).
3. **Reload.** If the dock layout is not restored after a reload (known for template tabs, authoring report), say so;
   do not fix it here.
4. Tests (kills named): with no canvas docked the tab is added to the main panel and appears in the app bar's list
   (kills: ghost filter kept); with a canvas docked it opens beside (kills: always main panel); closing it from the app
   bar removes the dock tab (kills: close only hides the entry). Probe: extend `scripts/probe/codegen-generator-tab.ts`
   for both placements and the app-bar close. Crops under `~/.jjodel-lanes/P-2026-10-25-1200/crops/`: the app bar with
   the generator tab active and the generator full width; the app bar with the project tab active again; the beside
   placement unchanged.

## DOVE

`frontend/src/pages/components/Navbar.tsx` (the tab list and its tab rendering only), its SCSS only if the generator
tab needs a rule, `frontend/src/codegen/ui/openTemplateEditor.ts`, `generatorTabs.ts`, `TemplateEditorTab.tsx` and
`.scss`, their tests, `frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this prompt's
`Status:` line. Rule 19 for anything else; `DockManager.tsx` stays untouched.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on` (Navbar.tsx is eager: it may reference the `codegen_tpl_` prefix as a string,
never import a generator module); the probe green; bench killed/total.

## Close

`fix(codegen): generator tab in the app bar when no canvas is docked (P-2026-10-25-1200)` (committed early, see Lane
discipline), a `test(codegen)` commit for the probe if separate, then the docs commit with the log entry (Layer Impact
note on `Navbar.tsx`) and the `Status:` flip `eseguito 2026-10-25 · lane codegen · <fix sha> · <bench k/n> · crops in
the lane folder`. `Outcome: done`.

## NON FARE

Nothing in the critical zone. No change to `DockManager.tsx`. No new dependency. No push, no merge (R-GEN-39).
