# Discovery 2026-10-04 — an implicit Clock on the I/O board (Phase 1)

Prompt-ID: P-2026-10-04-1625 · prompt `docs/prompts/claude_2026-10-04_1625_prompt_sim_clock_auto.md` · session `c739f547` · tree `~/jjodel-w-clockauto`, branch `sim-clock-auto`, HEAD `aa17dc715` · executor Claude Opus 5.5 (`claude-opus-5-5`).
This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files. Every claim is **[R]** read on `aa17dc715`; nothing was run in this phase but searches.

## 0. Answer in brief

- **All three decisions hold as written.** No RC-26 item, no contradiction: Phase 2 starts (the prompt's deroga of the P4 hard stop).
- **Owner: the panel, not a singleton.** `SimulationPanel` already owns everything a tick needs, `fire`, `asking`/`pending`, Reset, Stop and the interruption, and re-renders after each of them; a module singleton would add a subscription channel for the card and still need the panel's `fire`. `createClocks` moves to the panel (one instance per `modelid`); `simBoardClock.ts` stays pure and gains the arming and the idle test. The card receives the clocks and only shows and toggles them.
- **Manual clocks leave the card too.** With one owner, keeping a manual clock tied to the card would need a board-close stop that the auto ones skip; freeing it is the smaller code. Decision 2 allows it: done, and said here.
- **The run's start is Reset.** `onReset` installs a run with a new compiled `net` (`simReset`, `SimulationPanel.tsx:561`) and re-renders the panel; there is no separate start at the first step. The panel observes it as a new `run.net`, as the card's clocks already tell Reset apart today.
- **Enabledness without a press:** `panelInputs(runStatus(run), structuralInputs(run.net, run.config.state)).events.has(event)`, exactly what greys the panel's button and the board's Button (`simBoardFace.ts:176`). It is structural: a tick the test passes but whose guards all refuse is still pressed and is a discard step, as a hand press on a lit button.
- **Collapse does not unmount the panel** (`SimulationPanel.tsx:764`, an early return inside a mounted component). Decision 2 lists it as an unmount, so Phase 2 switches the clocks off on collapse explicitly, with a reason of its own; Play is not stopped by a collapse today and stays so.
- **Arming is once per run.** An auto clock switches itself on the first time the panel sees its run Running; after that only Reset re-arms it. So the hand pause holds until Reset, as decision 1 asks, and the same rule makes an edit of the board and a collapse leave the clocks off until Reset or the hand.
- **Codec:** `autoStart` written after `period`, only when true; absent, false or not boolean decodes to absent (not boolean with a field defect), so today's boards keep their bytes.
- Phase 2 touches eleven code and test files, listed in §6 (rule 19: the DOVE names the folders and asks this list, taken as the confirmation, as the earlier simulator lanes did).

Recommended: proceed with Phase 2 as listed in §6.

Decisions awaiting Alfonso: none (RC-26 list empty, §8).

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | The panel can own the clocks without a new channel to the card. | **Holds, with one narrow channel [R].** Ticks, `waiting`, `fire` and the run's lifecycle are the panel's (§2). The held values a tick's asks may need are the card's state (`simBoardDevices.tsx:629-635`), so the card leaves them in a ref the panel passes; with the board closed there are none, as there are no held devices. |
| H2 | The run's start is observable without touching `simRunState.ts`. | **Holds [R].** `onReset` calls `simReset(modelid, started.run)` then `setTick` (`SimulationPanel.tsx:561`); every Reset compiles a new net, which `simBoardClock.ts:99` already reads as Reset (`if (run.net !== net) return 'reset';`). |
| H3 | The Button's grey test can be read without a press. | **Holds [R].** It is pure: `panelInputs(status, structuralInputs(r.net, r.config.state))` (`SimulationPanel.tsx:475`), `panelInputs` returning the structural set while Running (`simBridge.ts:1080`). |
| H4 | An idle tick can be skipped without touching the engine, the trace or the store. | **Holds [R].** The skip happens before `deps.press` in `tick` (`simBoardClock.ts:130-143`); no press, no `simCommit`, so no trace entry and no kept configuration (`simRunState.ts:379-381` is never reached). |
| H5 | Collapsing the panel unmounts it, as decision 2 says. | **Falsified [R].** `if (!open) {` (`SimulationPanel.tsx:764`) returns the chip from the mounted component; hooks and Play's timer stay. The decision still holds: Phase 2 switches the clocks off on `open` going false. |
| H6 | `autoStart` can join the record without moving any stored byte. | **Holds [R].** `encodeBoard` writes clock fields by kind (`boardCodec.ts:372`); a field written only when true leaves `BASE_ALL` (`boardCodec.test.ts:220`) as it is. |
| H7 | A new identifier collides. | **Falsified [R].** `command grep -rn -E 'autoStart\|setAutoStart\|autoClocks\|clockEnables\|clockHeld\|AutoClock\b\|AUTO_START' src scripts` exit 1; control `command grep -c createClocks simBoardDevices.tsx` gives 2, exit 0. |
| H8 | The clock's exported types reach outside `sim/`. | **Falsified [R].** `command grep -rln -E 'simBoardClock\|ClockState\|ClockOff\|SimBoardProps\|clockFire' src scripts` lists only files under `sim/` and its tests (control: the same search finds `simBoardClock.ts` itself). |

## Files read

`frontend/src/components/editor-v2/sim/simBoardClock.ts` (whole), `.../sim/simBoardDevices.tsx` (1-100, 270-320, 440-700), `.../sim/SimulationPanel.tsx` (1-140, 277-330, 380-860, 1100-1220), `.../sim/simRunState.ts` (1-135, 270-300, 360-400, 460-508), `.../sim/simBridge.ts` (1060-1130, 1200-1538), `.../sim/simBoardFace.ts` (1-155, 174-260, 260-413), `.../sim/simBoard.ts` (156-202, 261-290, 336-356, 440-452), `.../sim/SimBoardEditor.tsx` (1-40, 170-200, 285-300, 690-773), `frontend/src/model/simulation/boardCodec.ts` (300-511 and the clock constants), `frontend/src/model/simulation/netStep.ts` (136-140, 358-368), the tests `.../sim/__tests__/simBoardClock.test.ts` (whole), `simBoardCard.test.ts` (1-80), the clock rows of `simBoard.test.ts`, `simBoardFace.test.ts`, `boardCodec.test.ts`; `docs/decisions.md` R-SIM-110..133, RC-17, RC-21, RC-23, RC-25, RC-26, D-UI-15, D-UI-16; `docs/discovery/discovery_2026-10-04_sim_io_clock.md` (§0, §5-§8 and the addendum); `docs/PROTOCOL.md` P4, P6, P11, P12, P16.

## 1. The clocks today [R]

- Owned by the card: `const clocks = createClocks({` in an effect on `[modelId]`, `return () => { clocks.dispose(); clocksRef.current = null; };` (`simBoardDevices.tsx:548-555`); `useEffect(() => { clocksRef.current?.check(); }, [run]);` (`:558`); `useEffect(() => { clocksRef.current?.stopAll('board'); }, [boardRaw]);` (`:560`).
- A tick is the board's press: `latest.current = { waiting: waiting ?? false, tick: event => (clockFire ? send(event, [], clockFire) : send(event)) };` (`:635`), `send` planning with the held values, `planPress(getSimRun(modelId), event, [...first, ...heldInputs(decoded.devices, ctx, held)])` (`:630`).
- The panel feeds it: `clockFire={(event, values) => fire(event, undefined, values, undefined, true)}` and `waiting={asking !== null || pending !== null}` (`SimulationPanel.tsx:1184`, `:1186`).
- The tick presses whatever the event enables: `states.set(id, { ...s, ticks: s.ticks + 1 }); deps.press(ticking.get(id)!.event);` (`simBoardClock.ts:139-140`); a discard is committed and traced (`simRunState.ts:379-381`).

## 2. The panel's lifecycle [R]

- `fire` (`SimulationPanel.tsx:621`) leaves Play running with `keepPlay`; `askInputs` and `labelOf` are defined before the early return, so a tick can reach them while collapsed.
- The input dialog and the choice list render only in the open branch: `{pending && run && head && (` (`:975`), `{asking && run && (` (`:1014`), after `if (!open) {` (`:764`). A tick that asks while collapsed would wait unseen: the reason to switch the clocks off on collapse.
- The collapse button: `onClick={() => { setOpen(false); if (inspectorOpen) closeInspector(); if (boardOpen) closeBoard(); }}` (`:830`).
- Play's timer is an effect on `[playing, modelid, show]` (`:653`), not on `open`: Play goes on collapsed.
- Model switch and unmount: `useEffect(() => () => { simSetPending(modelid, null); simClear(modelid); }, [modelid]);` (`:394`).
- `run` is read at every render, `const run = isModelMode ? getSimRun(modelid) : undefined;` (`:430`), and every path that changes the run through the panel ends in `setTick` (Reset, Stop, the interruption, `show`).

## 3. Enabledness without a press [R]

- The panel: `const inputs = panelInputs(status, structuralInputs(r.net, r.config.state));` (`SimulationPanel.tsx:475`), passed to the card as `eventsOn: view.inputs.events` (`:1180`); the Button: `const on = v.eventsOn.has(event);` (`simBoardFace.ts:176`).
- `structuralInputs` reads the preset only: `if (!presetEnabled(t, state)) continue;` (`netStep.ts:363`), `presetEnabled` being `t.preset.every(a => tokens(state, a.place) >= a.weight)` (`:139`). Guards are the candidates' business (R-SIM-60's «No candidate»).
- Phase 2: `clockEnables(run, event)` in `simBoardClock.ts`, the same two calls; the tick asks it after the waiting check, so decision 7's dropped ticks are unchanged.

## 4. The codec, the board model, the editor [R]

- Clock fields today: `...(d.kind === 'clock' ? { period: d.period ?? CLOCK_PERIOD_DEFAULT } : {}),` (`boardCodec.ts:372`); decode `? { id: d.id, kind, cell, label, binding, period: ... }` (`:464`).
- New clocks: `? { id, kind, cell, label: '', binding: null, period: CLOCK_PERIOD_DEFAULT }` (`simBoard.ts:348`); the editor's add calls `addDevice` (`SimBoardEditor.tsx:181`).
- The editor's checkbox vocabulary exists: `<label className="sim-board-editor__check">` (`SimBoardEditor.tsx:290`); no SCSS change needed.

## 5. Decisions taken in this phase (unattended, RC-25)

1. Owner: `SimulationPanel`, one `createClocks` per `modelid`, disposed on model switch and unmount; the card gets the clocks as a prop and keeps its toggle and faces.
2. Manual clocks are freed from the card too (decision 2's allowance): one owner, no board-close stop.
3. Arming once per run (`Clocks.arm`): the first time the run is seen Running, every auto clock bound to an event of the run's alphabet switches on; Reset (a new net) re-arms. The hand's off, an edit of the board (`stopAll('board')`, kept from R-SIM-122) and a collapse leave the clocks off until Reset or the hand.
4. Collapse switches every clock off with a new reason `panel`, «the panel was collapsed»: the decision's «disposes» read as «no timer survives», the arming memory kept so a hand pause still lasts until Reset.
5. Idle: `ClockState` gains the optional `idle`, counted in the face's title, never on the counter: the counter and the Variant B lamp stay the presses (the probe's «step count = presses + ticks that fired»).
6. Held values: the card writes what it holds into a ref the panel passes (`clockHeld`), cleared at its unmount; the tick plans with it as the card's `send` did.
7. `SimBoardProps.clockFire` and `waiting` become unread: kept with `// TODO: cleanup` (rules 9 and 11).
8. Codec: `autoStart` after `period`, written only when true on a clock; on another kind ignored as `period` is; not boolean on a clock is a field defect (`field: 'autoStart'`), the device kept.
9. Face: an auto clock's off title adds that Reset switches it on; nothing else in the faces changes.

## 6. Phase 2 files (exact)

Code: `frontend/src/model/simulation/boardCodec.ts`, `frontend/src/components/editor-v2/sim/simBoard.ts`, `.../sim/simBoardClock.ts`, `.../sim/simBoardFace.ts`, `.../sim/simBoardDevices.tsx`, `.../sim/SimulationPanel.tsx`, `.../sim/SimBoardEditor.tsx`.
Tests: `frontend/src/model/simulation/__tests__/boardCodec.test.ts`, `.../sim/__tests__/simBoard.test.ts`, `.../sim/__tests__/simBoardClock.test.ts`, `.../sim/__tests__/simBoardFace.test.ts`.
Closure: `docs/decisions.md` (R-SIM-134..136), this report's addendum, the prompt's Status, `docs/log-inbox/simulation.md`. Probe: a gitignored `frontend/scripts/smoke/_tmp_clockauto_probe.ts`, crops in `~/.jjodel-lanes/P-2026-10-04-1625/`.

## 7. Risks and dependencies

- **R1, the test gap (as R-SIM-122's R3).** The panel does not import under the node bench (`window is not defined` through the joiner), so «ticks with the board closed», «collapse stops», «Reset re-arms in the app» are tested at the owner (`createClocks` with the panel's press, no card) and measured in the probe.
- **R2, render rate.** An idle tick announces a change so the title's count moves: one panel render per idle tick, as a press costs today (at 100 ms, ten a second, measured acceptable by the Clock lane).
- **R3, a guard-blocked tick.** Structural enabledness lets a tick through whose guards all refuse: a discard step, as decision 3 writes it. A model that greys `tick` by guard only will still count those steps.
- **R4, a hidden dock tab.** It hides the panel without collapsing it; the clocks, like Play, go on there. Not changed.

## 8. Questions

None open. Decisions awaiting Alfonso: none; decision 3 of R-SIM-122 is provisional, so its amendment is not an RC-26 item.
