# Levels lane 3 continuation: run the S4 probe, regressions, mutants, docs

Prompt-ID: P-2026-11-08-2041
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full, critical zone go-ahead carried from P-2026-11-08-2012 (Alfonso 2026-11-08 20:11); continuation after the context ceiling
Status: eseguito 2026-11-08 · lane full · 2bed6cb5c
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 20:11: «1 yes» to lane 3 and its critical zone; «2 drawing it from the source to the target object»)
Depends: P-2026-11-08-2012
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `d9b1912f9`
(lane 3's code). **Expected state**: one untracked file, `frontend/scripts/probe/onto-s4-links.ts`; anything else
uncommitted means stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs from
this worktree on port 3005: do not stop it; probe ports outside 3000, 3001, 3005, 3015; probe assets never under `docs/`.

## Lane discipline

Every reply opens with `[P-2026-11-08-2041 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 80 minutes.

- Context economy: windows of at most 40 lines; never a whole probe log (grep PASS/FAIL and the summary); never a whole
  product file or diff. Commit each finished step at once. At the ceiling, `handoff.md` and `Outcome: hard-stop`.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; one probe run per call.
  Keep each mutant run short: Alfonso's server on 3005 serves it.
- Product code changes allowed only (a) for a defect the probe proves in lane 3's code, under 15 lines in lane 3's files,
  and (b) for the placement below; anything else: `Outcome: question`.
- No push, no merge. No edit to `reducer.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `canvasToJjom.ts`, a §3.2
  file, or an exported interface.

## Source

`~/.jjodel-lanes/P-2026-11-08-2012/handoff.md` (decisions, evidence, the exact remaining steps; the probe's first launch
failed on a wrong path), `handoff.diff`, and the lane 3 prompt `docs/prompts/claude_2026-11-08_2012_prompt_onto_s4_links.md`
steps 2, 4, 5, 6.

## Decisions by the chat on lane 3's open points

- **Placement**: a new link goes where the fixture's links live (`packagedElements` of the model's Package), by the
  container rule R-OI-22, not the model root. Fix it in lane 3's files if it is under 15 lines; else report it.
- The popup header «Link Reference» stays (out of scope; ticket). A second link between the same pair is allowed (UML
  allows it unless the association is unique; ticket).
- R-OI-25 and R-OI-26 only if the probe shows they are needed.

## COSA

1. Run `onto-s4-links.ts` (fix its path): the drag, the menu limited by R-OI-5, one undo entry, one new edge drawn at
   once, Cmd+Z removes link, slots and edge, save and reload keep the edge, a pair with no association writes nothing,
   the class tab's drag unchanged; the Q6 block (`nature`). Commit the probe (`chore(probe)`).
2. Regression, one run each: the S2 suite with the level block (52/52), `onto-s3a-slot-problems.ts`,
   `onto-s3b-ghost-rows.ts` (`uml-s3b`), `onto-binding-editor.ts`. Crops to `~/.jjodel-lanes/P-2026-11-08-2041/crops/`:
   the drag with the menu (or the auto-selected link), the new edge, the link's properties panel.
3. Mutants, each red and reverted, to `bench.txt` in this lane folder: closure dropped from the end check; ends swapped;
   the link written outside the queue.
4. Docs commit: R-OI-24 (gesture, menu, one undo entry, placement), R-OI-25/26 only if needed, 2026-11-08, provisional,
   Alfonso's go-ahead recorded, reversible: branch; `parseRows` reads them. One entry in `docs/log-inbox/instance-of.md`
   for 2012 and this lane (Layer Impact Report summary: `useIRContainment.ts` and `irEdgeViews.ts` unchanged; Q6 result;
   the tickets above); flip `Status:` of both prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated, or on a regression in the class tab or
another notation's canvas.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-2012/handoff.md`; `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` §6, §8 lane 3, §13.
