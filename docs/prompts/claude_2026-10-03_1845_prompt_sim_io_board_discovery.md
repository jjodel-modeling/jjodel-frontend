# Prompt: the simulator's I/O board, discovery (read-only)

Prompt-ID: P-2026-10-03-1845
Chat: C-2026-10-03-1610
Lane: full (Phase 1 discovery read-only, hard stop; Phase 2 in two later lanes on disjoint files, written by the chat from this report). Tier: heavy (RC-32: a discovery across the simulator modules). Model: the default of `.claude/settings.json`, no deviation.
Status: eseguito 2026-10-03 · lane sim-io-board · discovery, then Phase 2 Lane 1 · probe ba0668d80 (frontend/scripts/probe/io-board-outputs.ts, DemoESM on 3079, ALL GREEN) · report bf8ed5b78 docs/discovery/discovery_2026-10-03_sim_io_board.md, measured on bb20f1a12 · hard-stop, ten decisions taken unattended and one awaiting Alfonso (the MODELS demo) in §0, one question with Recommended, two sequential Phase 2 lanes in §8 · Phase 2 Lane 1 sim-io-board-model on the chat's GO (decisions 1-6 and question 1 adopted): feat 879b591ef, test f03462c33, fix 2b3ea44e9, probe 6b2a1f53c; rows R-SIM-116..121 (116 and 118 verified by an RC-27 agent); typecheck 14, the §17 set; vitest 7077/7077 in 273 files, the 9 known suites red at import; build exit 0, chunk-size warning only; mutation bench 58/58; demo scenes byte-identical to the base (34 rows); editor harness probe on 3079 12/12, crops light and dark in ~/.jjodel-lanes/P-2026-10-03-1845/ · Lane 2 sim-io-board-skins not started · non fuso: merging the board, Lane 1 included, waits for Alfonso

Worktree: `~/jjodel-w-ioboard`, branch `sim-io-board`, cut by the chat from `alfonso-frontend-jjtl` at `7a249ef87`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

The I/O board of the simulator, decided on 2026-10-03 as R-SIM-110..115 in `docs/decisions.md` (read them whole: R-SIM-110 and R-SIM-114 ratified by Alfonso, the others provisional). The board is the machine's environment: input devices (Button, Switch, Slider, Numeric keypad) bind to the events and IVAR a run already has; output devices (LED, Pulse LED, 7-segment, Text display, Gauge) bind to read-only expressions over σ (Pulse LED reads the trace). It adds no VAR, never writes σ or M, and every press is a step in the trace, replayable from the seed. One board, two skins: Variant A, a docked board opened from the run panel like the inspector; Variant B, a front-panel skin of the same board with a «Show bindings» toggle. The board is saved with the model, not in M2.

R-SIM-115 lists what the discovery must settle before any code. Answer each question with file and line, a measurement where one is possible, and a recommendation with its alternatives:

1. **Mount point.** Where the docked board mounts so it opens from the run panel like the inspector (`SimInspector.tsx`, `SimulationPanel.tsx`, the compact panel), and how it coexists with the inspector and the canvas insets (`--jj-canvas-right-inset`). Which component owns open and closed state, and where the viewer preferences of R-SIM-104 (pins) live, since the skin choice sits beside them.
2. **Persistence key.** Where a per-model record lives today (the model's state declarations of R-SIM-94, `stateAttributesCodec.ts`, `simInputs.ts`), what key the board would take, how it round-trips through save, export (`.jjodel`), import and `VersionFixer.tsx` (critical zone: read only, say whether a version bump is needed). Whether old projects without the key open unchanged.
3. **Binding resolution.** How a binding names an event, an IVAR, a state or an expression so that a rename keeps it (ids or names), how a binding that no longer resolves is detected and flagged on its device without breaking the run, and how a device needing state attributes is flagged under a profile without them.
4. **Output evaluation.** Where the run evaluates guard expressions over σ, and whether an output expression can be evaluated there with `event` null after each step, including `X.[marked]` on the State machine profile without state attributes and `.[x]` reads (R-SIM-108). Cost per step with ten outputs (measure on DemoESM if a probe is cheap).
5. **Input machinery reuse.** How the panel fires an event, offers IVAR input (the dialog of R-SIM-88), applies Choices Ask | Random (R-SIM-101), disables an event with a reason, and returns from a viewed past step to live (R-SIM-106). Which functions a device can call as they are, and which need a seam.
6. **Keypad modes.** What R-SIM-112's two modes need from the event model: an event carrying a digit (does an event take a parameter today?), and the buffer in the device versus in σ.
7. **nuXmv mapping.** Where the `.smv` exporter lives, whether outputs map cleanly to DEFINE, and confirm the Pulse LED stays out of the export.
8. **Phase 2 split.** Propose the two lanes R-SIM-115 names (board model and editor; the two skins) as disjoint file sets, with the new files and the touched files of each, the tests first for each, and what the four demo scenes must still show byte-identical.

## DOVE

Read-only on the app. You may add a probe under `frontend/scripts/probe/` (grep the name first) and copy fixtures from `/Users/alfonso/jjodel-demo-exports/` (read-only, never modified) only if a measurement needs one. Write the discovery report `docs/discovery/discovery_2026-10-03_sim_io_board.md` (§0 «Answer in brief» first, at most 40 lines, with «Decisions taken (unattended)» and «Decisions awaiting Alfonso» per RC-26). No change under `frontend/src/`. Critical-zone files (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`, everything under `viewpoint/ir/`) are read only. Plus the closure docs: this prompt's Status and `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (sections 3, 6, 17, 21.2), `docs/PROTOCOL.md` P16, RC-21, RC-25, RC-26, R-SIM-4, R-SIM-6, R-SIM-18, R-SIM-88, R-SIM-94, R-SIM-100..115, the spec `docs/spec/claude_spec_2026-09-13_computational_model.md`, and the simulator files the questions name.
2. Answer the eight questions. Measure where a number decides the answer (a probe through `lane-run probe <worktree> <probe.ts> --port 3079`, never 3000, 3001 or 3003).
3. Commit the probe if any (`probe:`) and the report (`docs:`), then the closure docs commit (Status flip with lane, shas and «discovery only»; inbox entry); stage by explicit path. Stop with `Outcome: hard-stop`, the report's path and its two decision lists.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, any change under `frontend/src/`, removing the `frontend/node_modules` link.

## RIFERIMENTI

R-SIM-110..115 and the design canvas «Simulator UI and state data», row «I/O board: the machine's environment» (Claude Design, 2026-10-03); R-SIM-88, R-SIM-94, R-SIM-100..108; Alfonso's request of 2026-10-03 to start the work now in lane auto (the R-SIM-115 schedule said after MODELS; merging the board before the demo stays his decision).
