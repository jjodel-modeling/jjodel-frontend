# Prompt: the simulator's I/O board, Lane 2 (the board, its two skins, the panel wiring)

Prompt-ID: P-2026-10-03-2000
Chat: C-2026-10-03-1610
Lane: full (implementation from a ratified discovery; visual, RC-23 by the chat). Tier: heavy (RC-32). Model: the default of `.claude/settings.json`, no deviation.
Status: da eseguire

Worktree: `~/jjodel-w-ioskins`, branch `sim-io-board-skins`, cut by the chat from `sim-io-board` at `11b4df6ce` (Lane 1 of P-2026-10-03-1845, not merged), `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Lane 2 of the I/O board, as §8 «Lane 2: sim-io-board-skins» of `docs/discovery/discovery_2026-10-03_sim_io_board.md` describes it (read §0, §1, §5, §8, §10 and the addendum, and rows R-SIM-110..121 in `docs/decisions.md`). Lane 1 (`879b591ef`..`11b4df6ce`) gave the model: `boardCodec.ts` (key `ioBoard`), `boardOutputs.ts`, `simBoard.ts`, `SimBoardEditor.tsx`, `SimRun.snapshot`, the input-title helpers in `simBridge.ts`. This lane makes the board visible:

1. `SimBoard.tsx` and `SimBoard.scss`: the card in the 584/400 slot, one card at a time with the inspector (R-SIM decision 4 of §0). Variant A: outputs above, inputs below, the binding caption under each device, the status foot with the viewed step and «Back to live». Variant B: the front-panel skin of the same devices with a «Show bindings» toggle. The skin switch sits in the header; «Edit…» opens Lane 1's editor.
2. `simBoardDevices.tsx`: the nine device faces, one per skin; `simBoardFace.ts` and its test: what each device shows from the run, the view and the resolution (lit, value, `Err` for out of domain or defect, off with its reason in the title, the viewed step).
3. `SimulationPanel.tsx`: the board button in the header; `boardOpen`, exclusive with `inspectorOpen`; `fire` and `view` passed to the board; `AskingInputs.given`; the title helper at its two call sites.
4. `simViewerPrefs.ts` and its test: `boardSkin` (default `'board'`) and `showBindings` (default `false`) on the prefs channel, never on `'mark'`.

The chat noted on Lane 1's crops one wording to fix while here: the editor footer reads «a configuration display the marking»; make it a correct sentence (for example «A Pulse LED reads the trace and a configuration display shows the marking; neither is exported.»), editing only that string in `SimBoardEditor.tsx`.

Alfonso decides whether the board merges before the MODELS demo; this lane does not merge.

## DOVE

Exactly the Lane 2 files of §8: new `frontend/src/components/editor-v2/sim/SimBoard.tsx`, `SimBoard.scss`, `simBoardDevices.tsx`, `simBoardFace.ts`, `__tests__/simBoardFace.test.ts`; touched `SimulationPanel.tsx`, `simViewerPrefs.ts`, `__tests__/simViewerPrefs.test.ts`; plus the one string in `SimBoardEditor.tsx`. The DOVE of this prompt confirms these files (rule 19). Grep every new identifier and CSS class first. A file outside `editor-v2/sim/`: stop with `Outcome: question`. No critical-zone file. Lane P-2026-10-03-1920 (another lane of this chat) works under `viewpoint/`, `edges/`, `utils/`: never touch those. Plus the closure docs: this prompt's Status and `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (sections 5, 6, 17, 21.2), P16, RC-17, RC-21, RC-23, RC-25, R-SIM-99..121, the report sections above, Lane 1's files and `docs/demo/models_2026_simulator_demo.md` §2.
2. Tests first, red: `simViewerPrefs.test.ts` (defaults and channel), `simBoardFace.test.ts` (each device face from run, view and resolution).
3. Implement. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the full vitest suite, `npm run build` exit 0; mutation bench on `simBoardFace.ts`.
4. Lane probe (`lane-run probe`, port 3081, never 3000, 3001 or 3003), 1600×1000, light and dark: DemoESM with a board of a Button per event, an LED per state, a 7-segment on `model.[coins]` and a Pulse on `tc`; run the demo script's ten presses from the board and compare the panel's lines with the hand run; Variant A and Variant B crops, «Show bindings» on and off, a viewed past step, the board and the inspector never open together. Crops in `~/.jjodel-lanes/P-2026-10-03-2000/`. The four demo scenes without a board record: every panel reading of the script, Step's top at 854.5 px, the State dialog, the inspector (400/372 px) and the canvas layer identical to the trunk; the only allowed difference is the header icon.
5. Commits `feat:` and `test:`, then the closure docs commit (Status flip with lane, shas, gates and probe outcome; inbox entry); stage by explicit path. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Stop with `Outcome: hard-stop`. Do not merge.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, removing the `frontend/node_modules` link.

## RIFERIMENTI

R-SIM-110..121; discovery and Lane 1 of P-2026-10-03-1845 (`bf8ed5b78`, `879b591ef`..`11b4df6ce`); the design canvas «Simulator UI and state data», row «I/O board: the machine's environment», Variants A and B.
