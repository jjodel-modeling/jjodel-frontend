# Code generation 3.3: empty state for a generator with no templates, and the range reveal crop

Prompt-ID: P-2026-10-24-0310
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (small fix in the generator tab's right pane, no critical-zone file)
Depends: P-2026-10-24-0004
Status: da eseguire
Corregge: P-2026-10-24-0003
Request: Alfonso, 2026-10-24 03:05, in the project chat: «Ok alle raccomandazioni» (fix the empty generator's error state)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (the chat's RC-23 check of the G4 crop `tab_from_leftbar.png`). P8 replaced: the chat runs the
visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `10be255fd`. Before anything else: `pwd`, branch,
`git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-0310 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. No subagents, no background tasks. Commit as soon as
the gates are green. One probe run per tool call. Never print a diff, a whole file or a whole log. Dev server:
`npm start -- --port 3131 --strictPort`, stopped before the close.

## The defect

A generator just created from «+ New generator» has no templates. Its tab's right pane shows, in Preview, the red
error line `main 1:1 No template named 'main'` over an empty code view (G4 crop
`~/.jjodel-lanes/P-2026-10-24-0004/crops/tab_from_leftbar.png`). An empty generator is not an error.

## COSA

1. In the generator tab's right pane (`frontend/src/codegen/ui/GeneratorPane.tsx`), when the generator's template
   list is empty, Preview, Run and Check show one neutral empty state instead of generating: «No templates yet.
   «New template» on the left adds the first one.» styled as the other neutral messages of the tab, no red, no
   gutter. No generation runs. When the list is not empty and the declared root names a missing template, the
   error stays as today: that is a real error.
2. Tests (kill named): empty list shows the empty state and calls no generation (kills: generate called on an empty
   list); non-empty list with a missing root still reports the error (kills: the error hidden for every missing
   root).
3. Probe: extend `scripts/probe/codegen-generator-tab.ts` with the empty generator case. Crops under
   `~/.jjodel-lanes/P-2026-10-24-0310/crops/`: the empty generator's tab; and, on the default Turnstile generator, the
   editor right after an Alt+click on a model fragment of Preview, showing the producing template selected **and its
   range revealed and highlighted in the editor** (the G3 crop showed only the list selection). If the reveal does
   not happen, say so in the report and fix it within `TemplateEditorTab.tsx` if the map gives the range; if the
   map does not give it, report that and change nothing.

## DOVE

`frontend/src/codegen/ui/GeneratorPane.tsx` and its SCSS rule if needed, `frontend/src/codegen/ui/TemplateEditorTab.tsx`
(only for the reveal of item 3), their tests under `frontend/src/codegen/ui/__tests__/`,
`frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, this prompt's `Status:` line.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on`; the probe green; bench killed/total.

## Close

`fix(codegen): empty state for a generator with no templates (P-2026-10-24-0310)` (and, if item 3 needed a fix, a
second `fix(codegen)` commit), then the docs commit with the log entry and the `Status:` flip
`eseguito 2026-10-24 · lane codegen · <fix sha> · <bench k/n> · crops in the lane folder`. `Outcome: done`.

## NON FARE

No other change. Nothing in the critical zone. No new dependency. No push, no merge (R-GEN-39).
