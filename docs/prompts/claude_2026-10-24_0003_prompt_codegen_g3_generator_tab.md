# Code generation 3.3, slice G3: the generator tab, the panel as a launcher, two-way provenance

Prompt-ID: P-2026-10-24-0003
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (implementation; codegen UI and the pill site in EditorV2.tsx, no critical-zone file)
Depends: P-2026-10-24-0002
Status: eseguito 2026-10-24 · lane codegen · e4be12d09 · completed by P-2026-10-24-0045
Corregge: none
Request: Alfonso, 2026-10-23 23:54, in the project chat (kept locally in the chain folder as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_generator_viewpoint.md` and
`docs/discovery/discovery_2026-10-23_codegen_authoring.md`). P8 replaced: the chat runs the visual check on the
crops (RC-23); Alfonso checks the branch in the morning.

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-0003 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 110 minutes. No subagents, no background tasks. Commit as soon as
each step's gates are green (two or three `feat` commits are fine). One probe run per tool call. Dev server for
your own checks: `npm start -- --port 3131 --strictPort`, stopped before the close.

## Read first, and only this

R-GEN-36, R-GEN-39..R-GEN-43 in `docs/decisions.md` (they are the specification). The viewpoint report §6. The G1
and G2 commits on this branch. Then the files in DOVE, by ranges.

## COSA

1. **Generator tab.** `TemplateEditorTab.tsx` becomes the tab of one generator: id `codegen_tpl_<metamodelId>` for
   the default, `codegen_tpl_<metamodelId>_<generatorId>` for others; title `<generator name> · <metamodel>`.
   Left: the generator's templates (today's list) and, above it, a generator selector with New, Rename, Delete
   (Delete refuses the default; deleting a generator is a user gesture writing one patch, not an RC-26 item).
   Middle: today's editor with the S4 completion. Saves go through `generatorsPatch` (G1): one `state` set, one
   undo step. `openTemplateEditor(metamodelId, name, template, generatorId?)` and `selectInTemplateTab` gain the
   optional generator id.
2. **Right pane.** Today's preview pane grows into three modes, Preview, Run, Check, over the conforming model
   chosen there (`ui/conformingModels.ts`). Preview is today's live preview, now from `generateGenerator` (G2),
   with one sub-tab per declared file. Run and Check move here from `CodePanel.tsx` with today's behaviour (worker,
   budget, oracle); Check is enabled only when the generator's target is `js` (R-GEN-35). Move code, do not copy
   it: shared pieces go to small modules under `ui/` with their tests.
3. **Two-way provenance (R-GEN-41)**, in all three modes: a fragment from a model element selects it on the canvas
   (today's `selectOnCanvas`); on a metamodel canvas, where the element is not shown, the click opens the model's
   tab first, then selects. Every fragment with a template name also offers «go to template»: Alt+click, or a
   small gutter control on hover, selects that template in the tab's list and reveals the producing range if the
   map gives it. Hover highlights the fragment as in the 3.2 panel.
4. **Launcher.** `CodePanel.tsx` stops being an editor: the pill opens the generator tab of the generator last used
   on that metamodel (kept in memory per session, not persisted), else the default; on a model canvas (M1) the tab
   opens with that model chosen in the right pane. If more than one generator exists, the pill shows a small menu
   to pick one. Keep the lazy split (EditorV2 imports nothing new statically).
5. **Tests**: tab id per generator (kills: one id for all generators); Save in generator B leaves `genTemplates`
   bytes (kills: default rewritten); Check disabled on target `none` (kills: condition dropped); the pill opens the
   last-used generator (kills: always default); «go to template» selects the right template (kills: first
   template selected). Extend `scripts/probe/codegen-panel.ts` (or add `codegen-generator-tab.ts`) to drive the
   cloned Turnstile gallery project: open the tab from the pill, create a second generator, Preview, Run, Check,
   click a model fragment, Alt+click a fragment.
6. **Crops for the chat**, saved under `~/.jjodel-lanes/P-2026-10-24-0003/crops/`: the tab on the default generator
   with Preview; the generator selector with two generators; Run output; Check result; the canvas selection after a
   fragment click; the template selected after «go to template»; the pill menu with two generators.

## DOVE

`frontend/src/codegen/ui/` (TemplateEditorTab.tsx and .scss, openTemplateEditor.ts, CodePanel.tsx and .scss,
templateDrafts.ts, conformingModels.ts, new small modules and their tests),
`frontend/src/components/editor-v2/EditorV2.tsx` (the `CodegenSlot` and the pill site only),
`frontend/scripts/probe/codegen-panel.ts` or a new probe beside it, `docs/log-inbox/codegen.md`, this prompt's
`Status:` line. Rule 19: if a step needs a file outside this list, stop with `Outcome: question`.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen src/jjel
src/components/editor-v2`; `npm run check:codegen-lazy -- --on`; the probe green; mutation bench killed/total.

## Close

The `feat(codegen)` commits, then the docs commit with the log entry and the `Status:` flip
`eseguito 2026-10-24 · lane codegen · <last feat sha> · <bench k/n> · crops in the lane folder`. `Outcome: done`.

## NON FARE

Nothing in the critical zone. No change to the engine beyond imports. No new dependency. No change to what the
3.2 trunk ships (this branch is not merged before the 3.2 tag, R-GEN-39). No push, no merge.
