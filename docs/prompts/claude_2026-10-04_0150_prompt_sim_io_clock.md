# Prompt: a Clock input device on the simulator's I/O board (time as an environment source)

Prompt-ID: P-2026-10-04-0150
Chat: C-2026-10-04-0145
Lane: full (new device kind across the board model, editor, faces and panel wiring; tests first; probe; visual, RC-23 by the chat). Tier: heavy (RC-32). Model: the default of `.claude/settings.json`, no deviation.
Status: eseguito 2026-10-04 · lane sim-io-clock · report 51b074753, feat 52ddd7163, test bed918e5f · R-SIM-122 · typecheck 14, the §17 set; vitest 7310/7310 in 295 files, the 9 known suites red at import; build exit 0, chunk-size warning only; mutation bench 48/48 (simBoardClock.ts 24, boardCodec.ts 11, simBoard.ts 6, simBoardFace.ts 7); check:scripts exit 0 · lane probe on 3083 (frontend/scripts/smoke/_tmp_ioclock_probe.ts, gitignored): clock 22/22 (5 ticks and step 5 at 1000 ms, 21 ticks in 2195 ms at 100 ms, off at Reset, board close, Halted), microwave 8/8 (01:25 after 5 s; Play and the clock together, control without keepPlay fails), the four demo scenes 50/50 base and after, 0 differing paths, header and board card included; crops light and dark in ~/.jjodel-lanes/P-2026-10-04-0150/ · SimBoardEditor.scss untouched · hard-stop for the chat's visual check (RC-23) · non fuso

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: the Phase 1 hard stop of P4 does not apply (motivo: Alfonso asked for this lane in lane auto, 2026-10-04 01:40, and the chat cannot poll this conversation; RC-11). The discovery report is still written and committed first, then Phase 2 starts on this prompt's GO. Stop with `Outcome: question` instead, before any code, if the discovery finds an RC-26 item or contradicts a decision below.

Worktree: `~/jjodel-w-ioclock`, branch `sim-io-clock`, cut by the chat from the trunk `alfonso-frontend-jjtl` at `43685438b`, `frontend/node_modules` symlinked as P14 allows. Before anything else: `pwd`, branch, `git log -1` (the docs commit that added this prompt) and `git status` (clean) are as stated here. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-04-0150 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi)

The simulator has no time by construction (spec `docs/spec/claude_spec_2026-09-13_computational_model.md`, exclusions). Today a countdown (a microwave display, a traffic light) can only advance on ε through the panel's Play, a fixed 500 ms pace (`PLAY_INTERVAL_MS`, `SimulationPanel.tsx`) capped at k steps, or by pressing a `tick` event by hand. Alfonso's case (2026-10-04): a microwave with `+` adding 30 s to `model.[secs]`, `start`, and a display `mm:ss`; the time should go down one second per second once started. The right model is a `tick` event as an environment input; what is missing is something that presses it on its own.

## Decisions (row R-SIM-122, written by this lane in `docs/decisions.md`)

Ratified by Alfonso on 2026-10-04 (principle): a Clock is an environment source, not model time. Provisional, adopted by the chat (details, RC-25), Alfonso keeps the veto:

1. `clock` is a fifth input kind of the board, beside `button`, `switch`, `slider`, `keypad`. It amends R-SIM-111 (the fixed library of the first cut); Alfonso asked for it, so the amendment is authorised.
2. Binding: one event instance (the same `{ kind: 'event' }` the Button takes). The device record also carries a period in milliseconds, integer, 100..60000, default 1000. A record outside the range is a board defect, not a clamp.
3. The engine sees only events. Each tick is exactly a press of the bound event through the panel's `fire`, with the same totality: a tick whose event enables nothing is discarded as a hand press is, and the clock keeps ticking. No change to σ, the STC, the step, the trace format or any future `.smv` export: a clock-bound event is an ordinary event (an `IVAR` value).
4. The clock has an on/off face (start/pause) and shows its period and a tick count since it was switched on. On/off is view state of the board, never written to the model and never an undo step.
5. It ticks only while the run is Running. It switches itself off when the run reaches Terminated, Deadlock or Halted, on Reset, when the model changes, and when the board card closes (what is not on screen does not tick). A hand press does not stop it.
6. Clock and Play may run together; each press is one step, in arrival order. A clock tick does not stop Play and Play does not stop the clock.
7. A tick that arrives while the previous press still waits on the input dialog (R-SIM-88) is dropped and counted as dropped in the face's title, never queued.

If the code shows that one of these cannot hold as written, stop with `Outcome: question` and a `Recommended:` line.

## COSA

1. Phase 1, read-only, short: read `boardCodec.ts`, `simBoard.ts`, `boardOutputs.ts`, `simBoardFace.ts`, `simBoardDevices.tsx`, `SimBoardEditor.tsx`, `SimulationPanel.tsx` (`fire`, Play's timer, `boardOpen`), `simRunState.ts`, R-SIM-99..121 and the discovery `docs/discovery/discovery_2026-10-03_sim_io_board.md` §0, §1, §5. Write the report to `docs/discovery/discovery_2026-10-04_sim_io_clock.md` (P4 content; naming `discovery_<YYYY-MM-DD>_<slug>.md`), with the exact files Phase 2 will touch, and commit it alone (`docs:`).
2. Phase 2: the Clock in the codec (kind, binding, period, defects), in the editor (palette entry, period field with its range, the same binding picker as the Button), in both skins of the card (Variant A and Variant B, light and dark), and the timer wired to `fire` with the rules above. The timer lives where Play's lives or beside it, reading the store at each tick as Play does (`simBridge.ts` `playPress` is the pattern), and is cleared by every condition of decision 5.
3. Row R-SIM-122 in `docs/decisions.md` (Simulator series), text as the decisions above, marked provisional for 2..7.

## DOVE

Under `frontend/src/model/simulation/` and `frontend/src/components/editor-v2/sim/` only, plus their `__tests__/`, `docs/decisions.md`, the discovery report, this prompt's Status and `docs/log-inbox/simulation.md`. The report names the exact files; Phase 2 touches only those. A file outside these two folders: stop with `Outcome: question`. No critical-zone file. Lane P-2026-10-04-0130 (another chat) works in `~/jjodel-w-objedgedel` on the canvas: never touch its tree. Grep every new identifier and CSS class first.

## COME

1. Read `CLAUDE.md` (sections 5, 6, 17, 21.2), P16, RC-17, RC-21, RC-23, RC-25, RC-26.
2. After the report: tests first, red. Codec: a clock record round-trips, period default and range, defects. Face: on, off, period, tick count, dropped count, off with its reason. Timer, with fake timers: N periods give N presses of the bound event through `fire`; off on each condition of decision 5; a hand press leaves it on; with Play on both press; a tick during an open input dialog is dropped.
3. Implement. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline of 14), the full vitest suite, `npm run build` exit 0; mutation bench on the timer module and on the codec changes.
4. Lane probe (`lane-run probe`, port 3083, never 3000, 3001 or 3003), 1600×1000, light and dark. On DemoESM: a board with a Clock bound to one of its events at 1000 ms; switch it on for about 5 s and read the panel's step count and the clock's tick count (they agree within one tick); Reset switches it off; closing the board switches it off. If a small microwave scene (states Idle and Cooking, events `plus`, `start`, `tick`, attribute `secs`, a Text display on `model.[secs]`) can be built inside the probe within about 15 minutes, run it: `plus` three times, `start`, clock on, and after about 5 s the display reads `01:25` or `01:26`; otherwise say so in the report and rely on the unit tests. Crops of the editor and of both skins in `~/.jjodel-lanes/P-2026-10-04-0150/`. The four demo scenes without a clock: every panel reading and the board card identical to the trunk.
5. Commits `feat:` and `test:`, then the closure docs commit (Status flip with lane, shas, gates and probe outcome; R-SIM-122; inbox entry); stage by explicit path. The report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Stop with `Outcome: hard-stop` for the chat's visual check. Do not merge.

## HARD STOP

After the closure commit. Also before any code if an RC-26 item appears.

## NON FARE

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, removing the `frontend/node_modules` link. No change to the engine's step, the trace, the STC, or JjEL. Do not fix the lexer's prototype lookup (`'toString' in OCL_METHOD_MESSAGES`, `jjel/lexer/lexer.ts`): it is a separate ticket; the probe's display uses `'' + n` instead of `toString()`.

## RIFERIMENTI

R-SIM-16, R-SIM-20, R-SIM-88, R-SIM-99..121; discovery and lanes of the board (`bf8ed5b78`, `879b591ef`..`11b4df6ce`, `8c3a0e561`, `734294d19`); merge of the board on the trunk `18926660a`.
