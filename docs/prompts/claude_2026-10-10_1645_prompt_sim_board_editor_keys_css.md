# Board editor: old CSS removed, arrows move (R-SIM-146 points 1 to 3)

Prompt-ID: P-2026-10-10-1645
Chat: C-2026-10-10-1620
Request: https://claude.ai/code/session_01CjZSPxRbbXhjGTtAKkf96c
Lane: fast (Phase 2 only, visual; the design is fixed by R-SIM-146, no Phase 1). No critical-zone go-ahead.
Depends: none
Status: eseguito 2026-10-10 · lane sim-board-keys · 0132e7149 · verifica visiva passata 2026-10-10 (RC-23, chat)

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-boardkeys`, branch `sim-board-keys`, created from the trunk commit that adds this file,
`frontend/node_modules` symlinked (P14). Before anything else, check four things. `pwd` is the worktree. The branch is
`sim-board-keys`. `git status` is clean. `git log -1 --format=%H` equals
`git log -1 --format=%H -- docs/prompts/claude_2026-10-10_1645_prompt_sim_board_editor_keys_css.md`. Otherwise stop with
`Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-10-1645 · session <id>]`. Every final message ends with
`Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`.
Do not touch the `Status` line. A parallel lane (P-2026-10-10-1646, branch `sim-coverage-polish`) works on the coverage
files; do not touch them.

## Context

Read R-SIM-146 in `docs/decisions.md` (added by the commit before this prompt's) and the entry of P-2026-10-06-0100 in
`docs/log-inbox/simulation.md`. Alfonso ratified the three points below on 2026-10-10.

## COSA

1. **Delete the old editor's rules.** In `frontend/src/components/editor-v2/sim/SimBoardEditor.scss`, the block that
   opens with the `TODO: cleanup` comment naming the palette, the edit grid's tiles, the nuXmv table and the inspector
   as unused since P-2026-10-06-0100 (about line 34), and every rule it covers. Before deleting, search every `.tsx`, `.ts`
   and `.scss` under `frontend/src/` for each class the block defines (the BEM `&__…` names resolved against the
   block's root class) and list the hits in the log entry. A class with a hit stays, with a one-line note in the entry.
   Only that block: the other `TODO: cleanup` markers of `sim/` are out of scope. This is a deletion Alfonso authorised
   (R-SIM-146 (1), RC-26). If `check:addonly` refuses it, do not bypass the check: stop with `Outcome: question`,
   naming the check's output and its documented way to record an authorised deletion.
2. **Arrows move, Shift and an arrow select.** In `frontend/src/components/editor-v2/sim/simBoardEditorLayout.ts`,
   `editorKeyAction`: an arrow without Shift moves the selected device one cell (today's Shift branch), Shift with an arrow
   selects the neighbouring device (today's plain branch, `neighbourDevice`). An arrow with no device selected selects
   the neighbour of nothing, as the plain arrow does today. Update the module's header comment and any visible hint or
   `title` in `SimBoardEditor.tsx` that names the keys. A move the board refuses changes nothing, as today.
3. **Runtime colours stay.** No change; the log entry records R-SIM-146 (3).

## Tests and gates

Tests first, red at the base: in `frontend/src/components/editor-v2/sim/__tests__/simBoardEditorLayout.test.ts`, the
arrow moves, Shift and the arrow select, the refused move, the no-selection case, a field keeping its keys. A small
mutation bench on `editorKeyAction` (swap the branches back, drop the Shift test, drop the field guard). Then typecheck
(baseline), vitest, build, `check:docs`, `check:addonly`.

## Visual contract

- Now: arrows select, Shift and an arrow move; the stylesheet carries the old editor's dead rules.
- Then: arrows move, Shift and an arrow select; the editor looks exactly as before.
- Probe on a port 3080-3099 (never 3000, 3001, 3003; check `lane-run ports`), lean, at most two retries: open the board
  editor on the Microwave Oven board at 8 columns and on DemoESM's board; the computed styles of the modal, the header,
  the preview and the device list before and after the CSS deletion, 0 differences; select a device, press an arrow, the
  device moves one cell; Shift and an arrow, the selection moves. Crops at 600 px in
  `~/.jjodel-lanes/P-2026-10-10-1645/crops/`: `editor_{base,after}_600.png` for both boards, `editor_moved_600.png`.

## DOVE

`SimBoardEditor.scss`, `simBoardEditorLayout.ts`, `SimBoardEditor.tsx` (key hints only), the test file above, the probe
under `frontend/scripts/probe/`, and one entry in `docs/log-inbox/simulation.md`.

## COME

Commits: `test(sim):`, `refactor(sim):` for the CSS deletion, `feat(sim):` for the keys, `chore(probe):`, then the
closure docs commit with the log entry (`log-entry` skill). Explicit pathspec and the `Model:` trailer on every commit.

## NON FARE

- No file outside the DOVE; in particular none of `SimCanvasLayer.tsx`, `simCoverage.ts` and their styles.
- No edit to `boardCodec.ts`, `simBoard.ts` or the board's runtime faces.
- No `git stash`, no `git add .`, no push, no merge. Do not touch the `Status` line.

## HARD STOP

After the code commits and the probe: `Outcome: hard-stop (visual check due)`. The owner chat checks the crops (RC-23)
and sends the GO for the closure.

## RIFERIMENTI

`CLAUDE.md` §3 and §21. `docs/PROTOCOL.md` P13, P14, P16. R-SIM-143 and R-SIM-146 in `docs/decisions.md`.
