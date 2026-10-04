# Prompt: an implicit Clock on the I/O board (auto-start with the run, idle ticks are not steps)

Prompt-ID: P-2026-10-04-1625
Chat: C-2026-10-04-1126
Lane: full (the Clock's lifecycle moves from the board card to the run; codec field; one amended decision; tests first; probe; visual, RC-23 by the chat). Tier: heavy (RC-32). Model: the default of `.claude/settings.json`, no deviation.
Status: eseguito 2026-10-04 · lane sim-clock-auto · report c106cb329, feat 3a71b2a21, test 7aa9e4889 · R-SIM-134..136 · typecheck 14, the §17 set; vitest 7458/7458 in 301 files, the 9 known suites red at import; build exit 0, chunk-size warning only; tests first, 27 red at the base; mutation bench 33/35 (simBoardClock.ts 18, simBoardFace.ts 6, boardCodec.ts 8, simBoard.ts 3), two equivalent survivors (arming a run not Running, arm after dispose); check:scripts exit 0 · lane probe on 3085 (frontend/scripts/smoke/_tmp_clockauto_probe.ts, gitignored): microwave 20/20 (Reset arms the auto clock; 5.2 s idle, step 0 and 5 idle in the title; plus ×3, start, 5 s: 01:25, step 9 = 4 presses + 5 ticks; board closed 3 s, 3 steps more; hand pause holds 2 s; Reset re-arms, Idle, step 0; collapse switches it off, said so; the editor's Auto-start on, on for a new clock; no page error), the four demo scenes 50/50 base and after, 0 differing paths, header and board card included, positive control told apart; crops light in ~/.jjodel-lanes/P-2026-10-04-1625/ · RC-23 by the chat C-2026-10-04-1126 on the six crops: pass with one fix, the Clock's keycap over its counter on Variant B; fix 836d36936 (SimBoard.scss: on Variant B the Clock's keycap 9 px above its corner; the probe on the four themes and Variant A: no keycap over a counter, period, name, switch or another device, every cell, face, counter and switch box as before), accepted by the chat on the after crops; gates after the fix: typecheck 14, the §17 set; vitest 7458/7458 in 301 files, the 9 known suites red at import; build exit 0, chunk-size warning only
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: the Phase 1 hard stop of P4 does not apply (motivo: Alfonso asked for this lane in lane auto, 2026-10-04 16:20, RC-11). The discovery report is still written and committed first, then Phase 2 starts. Stop with `Outcome: question` instead, before any code, if the discovery finds an RC-26 item or contradicts a decision below.

Worktree: `~/jjodel-w-clockauto`, branch `sim-clock-auto`, cut by the chat from the trunk `alfonso-frontend-jjtl` at `0022fe5c3`, `frontend/node_modules` symlinked as P14 allows. Before anything else: `pwd`, branch, `git log -1` (the docs commit that added this prompt) and `git status` (clean) are as stated here. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-04-1625 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi)

The Clock (R-SIM-122, `simBoardClock.ts`) presses its bound event every period, but only after a hand switch-on, only while the board card is mounted (`createClocks` lives in `simBoardDevices.tsx`, disposed with the card), and every tick that enables nothing is discarded as a hand press is, which counts as a step at unchanged state. Alfonso asked (2026-10-04) whether the clock can be implicit. The chat's analysis, accepted by Alfonso («vai in lane auto»): switching on by hand is only needed today because idle ticks become steps (a microwave idle in Idle would add one empty step per second to the counter, the trace and the 1000 kept configurations). Remove that cost and the clock can start with the run.

## Decisions (rows written by this lane in `docs/decisions.md`, Simulator series after R-SIM-133)

Provisional, unattended, adopted by the chat C-2026-10-04-1126 under RC-25; decision 3 amends decision 3 of R-SIM-122, which was provisional; Alfonso keeps the veto.

1. **R-SIM-134, auto-start.** The clock record gains an optional boolean `autoStart`, in the codec's canonical order; absent means false, so every board saved today encodes byte for byte as before (test it). The editor creates new Clock devices with `autoStart: true` and shows the switch (Auto-start) in the clock's inspector. An auto-start clock switches itself on when its model's run becomes Running (after Reset or the first step, as the discovery finds the run's start) and goes off on the same conditions as today (Reset re-arms it, Stop, end of run, model edit). The hand switch still pauses and resumes it; a paused auto clock stays paused until the next Reset.
2. **R-SIM-135, the clocks belong to the run, not to the card.** The clocks of a model live as long as its simulation panel is mounted and its run is Running, board open or closed. Move the owner of `createClocks` from the card to the panel (or to a module singleton per model beside `simRunState.ts`, whichever the discovery shows is smaller and keeps `simBoardClock.ts` pure); the card only shows and toggles. The panel unmounting (collapsed, model switched, tab closed) disposes them as the card does today. A manual clock (no `autoStart`) keeps today's behaviour, board open included, unless the discovery shows that sharing one owner makes it simpler to free it from the card too: then say so and do it.
3. **R-SIM-136, a clock tick that enables nothing is not a step. Amends decision 3 of R-SIM-122.** Before pressing, the clock asks the run whether its bound event enables any transition from the current configuration (the same test the panel uses to grey a Button). If not, the tick is skipped: no press, no step, no trace entry, no configuration kept; the face counts it as idle in its title. Reason: the environment may always not produce an event, so a tick nobody listens to equals no tick (nuXmv reading). Hand presses are unchanged: an unaccepted hand press stays a step at unchanged state. Dropped ticks during a waiting dialog (decision 7 of R-SIM-122) are unchanged.

If the code shows that one of these cannot hold as written, stop with `Outcome: question` and a `Recommended:` line.

## COSA

1. Phase 1, read-only, short: read `simBoardClock.ts`, `simBoardDevices.tsx` (the card's clocks), `SimulationPanel.tsx` (the panel's lifecycle, `fire`, Play's timer, the run's state changes), `simRunState.ts`, `simBridge.ts` (`playPress`), `boardCodec.ts`, `SimBoardEditor.tsx` (the clock inspector), the enabledness test the Button uses, R-SIM-110..133 and `docs/discovery/discovery_2026-10-04_sim_io_clock.md`. Write `docs/discovery/discovery_2026-10-04_sim_clock_auto.md` (P4 content; naming `discovery_<YYYY-MM-DD>_<slug>.md`) with the exact files Phase 2 touches, where the clocks' owner moves, how the run's start is observed, and how enabledness is read without a press. Commit it alone (`docs:`).
2. Phase 2: the three decisions above, rows R-SIM-134..136.

## DOVE

Under `frontend/src/model/simulation/` and `frontend/src/components/editor-v2/sim/` only, plus their `__tests__/`, `docs/decisions.md`, the discovery report, this prompt's Status and `docs/log-inbox/simulation.md`. The report names the exact files; Phase 2 touches only those. A file outside: stop with `Outcome: question`. No critical-zone file. No change to the engine's step, the trace format or the STC. Never touch other worktrees. Grep every new identifier first.

## COME

1. Read `CLAUDE.md` (sections 5, 6, 17, 21.2), P16, RC-17, RC-21, RC-23, RC-25, RC-26, D-UI-15, D-UI-16.
2. Tests first, red, with fake timers: an auto clock starts with the run and not before; it ticks with the board closed; Reset re-arms it; the hand switch pauses it until Reset; an idle tick adds no step, no trace entry, no kept configuration and counts as idle; a tick that enables a transition is a step as today; a manual clock behaves as today; codec: absent `autoStart` encodes byte-identical, true round-trips; the editor creates new clocks with `autoStart: true`.
3. Implement. Gates in the foreground: `npm run typecheck` (no new errors over 14), full vitest, `npm run build` exit 0, mutation bench on the clock module and the enabledness check.
4. Lane probe (`lane-run probe`, port 3085, never 3000, 3001 or 3003), 1600 by 1000, light app theme. A small microwave scene built in the probe (states Idle and Cooking, events `plus`, `start`, `tick`, attribute `secs`, a Text display on `model.[secs]`, an auto clock on `tick` at 1000 ms): after Reset and 5 s idle, the step count is still 0; `plus` three times and `start`, then about 5 s, the display reads `01:25` or `01:26` and the step count equals the presses plus the ticks that fired; close the board and the countdown continues; Reset stops it and re-arms it. Crops of the clock's face (on, paused, idle count in the title) and of the inspector with Auto-start, at most 600 px each (`sips -Z 600`), in `~/.jjodel-lanes/P-2026-10-04-1625/`. The four demo scenes: every panel reading and the board card identical to the base commit.
5. Commits `feat:` and `test:`, then the closure docs commit (Status flip with lane, shas, gates, probe; R-SIM-134..136; inbox entry); stage by explicit path. The report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Stop with `Outcome: hard-stop` for the chat's visual check. Do not merge.

## HARD STOP

After the closure commit. Also before any code if an RC-26 item appears.

## NON FARE

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, removing the `frontend/node_modules` link, a new dependency. No change to how a hand press that enables nothing is counted.

## RIFERIMENTI

R-SIM-88, R-SIM-100, R-SIM-106, R-SIM-110..133; the Clock lane P-2026-10-04-0150 and its merge `6704563a8`; the front panel merge `19b29dc2b`.
