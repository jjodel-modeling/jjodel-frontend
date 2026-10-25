# Code generation 3.3: a real tab for the generator, and fragment highlight scoped to what was hovered

Prompt-ID: P-2026-10-25-1045
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (codegen UI; two findings of Alfonso's visual check)
Depends: P-2026-10-25-0925
Status: da eseguire
Corregge: P-2026-10-24-1515, P-2026-10-24-1516
Request: Alfonso, 2026-10-25 10:41, in the project chat: «il generator non ha un tab e se seleziono un frammento si seleziona tutto» (screenshot)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by item 0 below (a short measured diagnosis written into the log entry, no separate report).
P8 replaced: the chat runs the visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev server runs on
3131 from this worktree: never touch it; yours on 3133.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-25-1045 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as
each item's gates are green (one commit per item). Never print a diff, a whole file or a whole log; filter gate and
probe output to summary lines; one probe run per tool call (four codegen UI lanes in a row hit the context ceiling).

## Alfonso's findings (screenshot, Turnstile gallery project, 2026-10-25 10:41)

A. **«The generator has no tab.»** Opened from GENERATORS in the left bar while the project page was the active top
   tab, the generator UI fills the whole dock area with no tab header of its own (no «Default · DemoESM» tab, no close
   control), and no canvas is visible. Suspects to measure, not assume: the dock stylesheet rule
   (`DockManagerStyles.scss:594`, `.not-strip`) that hides panels without a pinnable header, and the rule 1515 added in
   `TemplateEditorTab.scss` to lift it for the generator panel (it may show the panel but keep the header hidden);
   and the target panel `openTemplateEditor` picks when no canvas tab is active (it falls back to the first panel).
B. **«If I select a fragment, everything gets selected.»** In Preview, hovering or clicking inside the JS runtime
   (`${target.runtime}`, lines 23-52 and beyond in the screenshot) highlights the whole runtime block, dozens of lines,
   because it is one fragment with one origin.

## COSA

0. **Diagnose first (15 minutes at most)**: reproduce A on 3133 with the cloned Turnstile gallery project (open the
   generator from GENERATORS while the project page is active, then from the pill on the model canvas); report in
   two lines which rule hides the header and which panel is chosen. Reproduce B and report the origin kind and line
   span of the runtime fragment.
1. **A real tab, always.** The generator UI is always a dock tab with its visible header (title `<generator> ·
   <metamodel>`, the close control like other tabs), wherever it is opened from. Placement: if a canvas tab of the
   metamodel or of one of its conforming models is open, dock beside it as today (right split, Properties
   auto-collapse); if none is open, open it as a normal tab in the main panel, beside the project and model tabs,
   not over them. Never hide the header; fix the CSS at its narrowest scope (the generator panel), no change to
   `DockManager.tsx`.
2. **Fragment highlight scoped.** Hover and selection highlight a fragment only when it spans at most 3 lines; for a
   larger fragment highlight only the hovered line and show the fragment's extent as a thin bar in the gutter. A
   click on such a fragment does what its origin allows (model element → canvas; template → Alt+click) and never
   selects the whole text. The text itself is unchanged (no DOM selection of the block).
3. Tests (kills named): a 30-line fragment highlights one line plus a gutter bar (kills: whole block highlighted); a
   2-line fragment highlights both lines (kills: threshold applied to every fragment); opening with no canvas tab
   yields a dock tab whose header is in the DOM and visible (kills: header hidden); opening with the model canvas open
   docks beside it (kills: always main panel).
4. Probe: extend `scripts/probe/codegen-generator-tab.ts` with both openings of item 1 and the hover of item 2.
   Crops under `~/.jjodel-lanes/P-2026-10-25-1045/crops/`: the tab opened from the left bar with the project page
   active (header visible); the tab beside the canvas with its header; a hover inside the runtime block (one line
   highlighted, gutter bar).

## DOVE

`frontend/src/codegen/ui/` (`openTemplateEditor.ts`, `TemplateEditorTab.tsx` and `.scss`, `GeneratorPane.tsx`,
`codeTokens.ts`, `codeLines.ts` only if a field is needed, `generatorTabs.ts`), their tests,
`frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this prompt's `Status:` line. Rule 19
for anything else (`DockManagerStyles.scss` included: if the fix needs it, stop with `Outcome: question`).

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on`; the probe green; bench killed/total.

## Close

One `fix(codegen)` commit per item, then the docs commit with the log entry (item 0's diagnosis, Alfonso's findings)
and the `Status:` flip `eseguito 2026-10-25 · lane codegen · <last fix sha> · <bench k/n> · crops in the lane folder`.
`Outcome: done`.

## NON FARE

Nothing in the critical zone. No change to `DockManager.tsx` or to dock components outside `src/codegen/`. No new
dependency. No push, no merge (R-GEN-39).
