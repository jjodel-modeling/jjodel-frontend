# Prompt: freeze readiness of the trunk after the Simulation roles modal

Prompt-ID: P-2026-09-27-2236
Chat: C-2026-09-27-1437
Lane: discovery (read-only on the code; the report is the only file written)
Status: eseguito 2026-09-28 · lane freeze-readiness · the commit that carries this line (docs-only discovery; its sha is in the hard stop)

Worktree: `~/jjodel-w-freeze`, branch `freeze-readiness` (cut by the chat from `alfonso-frontend-jjtl` at `d88e70e0e`: the modal merge `5eccdd4d2` and the demo script merge `ff5855d74` included; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-freeze`, branch `freeze-readiness`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

The freeze is 2026-10-01 evening and the MODELS demo is 2026-10-04. Today the trunk took a large panel change: `SimulationPanel.tsx` lost 449 lines to the Simulation roles dialog (P-2026-09-27-1740, R-SIM-85). The simulator scenes were walked twice (1740, 2105). Nothing has walked the rest of the app since. This discovery answers one question: is the trunk at `d88e70e0e` ready to freeze, and if not, what exactly stands in the way.

1. Gates, full: typecheck (expected 14 known), the whole vitest suite (expected 5265 across 214 files with the nine known files red at import; say any difference), hook tests, build, `typecheck:scripts`, `check:docs`, `check:agents`, `check:scripts`.
2. A browser walk on port 3026 of what `docs/demo/models_2026_simulator_demo.md` §1 (Setup) and every scene outside the simulator ask the presenter to do, plus the everyday editor flows a demo can hit by accident: open the app, create a project, a metamodel with a class, an attribute, a reference and an enum, a model conforming to it, edit on the canvas, undo and redo, rename, delete, reload the page and find the work, switch light and dark. At 1600x1000 and 1280x800. Record every console error with its first stack frame, and every visible defect with a crop.
3. The simulator panel outside the four scenes: open it on a model with no profile, on a metamodel, with the dialog cancelled, and after Stop; say what shows and whether anything breaks.

Build the probe so it can be re-run unchanged on a later trunk (the chat will re-run it after the halt-line merge): scripts under `frontend/scripts/smoke/_tmp_freeze_*` (gitignored), one command.

## DOVE

- Read anything. Write only `docs/discovery/discovery_2026-09-27_freeze_readiness.md` and the probe files (gitignored). Crops in `~/.jjodel-lanes/shots_freeze/`.
- Port 3026 only.

## COME

1. Read `CLAUDE.md`, the demo script whole, the 1740, 2049, 2105 and 2146 entries in `docs/log-inbox/simulation.md`.
2. Gates, then the walk, then the panel edge cases.
3. The report: objective, files read, gate table with expected vs measured, walk findings each with severity (blocks the demo / visible in the demo / not in the demo), console errors grouped by kind, crops, open questions for Alfonso, and a one-line verdict: ready, ready with the listed caveats, or not ready.
4. One commit: `docs: freeze readiness discovery (P-2026-09-27-2236)`, the report and this prompt's Status flip.
5. `Outcome: hard-stop` with the sha, the verdict, the count of findings by severity and the crop paths.

Stop with `Outcome: question` and a `Recommended:` line only if a gate result makes the walk meaningless (the build fails).

Never: a change to any tracked file other than the report and the Status line, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3026.

## RIFERIMENTI

- `docs/demo/models_2026_simulator_demo.md`; `docs/decisions.md` R-SIM-85; the log entries named above.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-23, RC-25; the discovery report rule of CLAUDE.md.
