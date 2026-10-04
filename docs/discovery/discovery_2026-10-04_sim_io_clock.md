# Discovery 2026-10-04 — a Clock input device on the I/O board (Phase 1)

Prompt-ID: P-2026-10-04-0150 · prompt `docs/prompts/claude_2026-10-04_0150_prompt_sim_io_clock.md` · session `065fb26a-741a-40a2-b93f-0846c74c3b6c`
Tree: `~/jjodel-w-ioclock`, branch `sim-io-clock`, HEAD `a454e2576` (the prompt's docs commit over `43685438b`) · executor: Anthropic Claude Opus 5.5
This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream reads the real files again.

## 0. Answer in brief

**Answer.** The seven decisions of the prompt hold as written on the code at `a454e2576`; none is an RC-26 item. One seam is needed: the panel's `fire` stops Play at every press (`SimulationPanel.tsx:623`), so a tick «through `fire`» that «does not stop Play» (decisions 3 and 6) needs `fire` to take a flag that skips that line. Everything else is inside the board's files.
- **Codec.** `clock` joins the input kinds; the binding is the Button's `{ kind: 'event' }`; the record gains `period` after `binding`, clocks only, so every existing board encodes byte-identical.
- **Timer.** A pure driver, `simBoardClock.ts`, testable with fake timers under the node bench (`vitest.config.ts:14`), owned by the board card. The card exists only while the board is open in an open panel (`SimulationPanel.tsx:761`, `:1171`), so its unmount is decision 5's «what is not on screen does not tick» by construction.
- **Off-conditions in one place.** One `check()` reads the live run from the store, as `playPress` does (`simBridge.ts:1469-1470`), before each tick, after each press and on each change of the run in the card: no run (Stop, interruption), a new `net` (Reset), `Terminated`, `Deadlock`, `Halted`.
- **Counts agree.** A discard and a quiescence are appended to the trace (`simRunState.ts:379-381`), so each tick that reaches the machine is one `step n`: the probe's «within one tick» is the period boundary only.

**Recommendation.** Phase 2 as §6 lists it: 13 files, all in the two DOVE folders, tests first.

**Decisions taken (unattended, RC-25), in order of consequence; detail in §5.**
1. A tick presses as the board's Button does (`send`: held values answer, the dialog asks the rest). This reads provisional R-SIM-120's «hand presses only» as «presses from the board».
2. Decision 7 also covers the choice list: a tick while a nondeterministic choice waits is dropped and counted.
3. An out-of-range period drops the device with a `device` defect, the precedent of the off-grid cell (`boardCodec.ts:201`). A missing period reads 1000.
4. `fire(event, selector, values, drawFrom, keepPlay)`: a new optional fifth parameter. The board gets `clockFire` and `waiting` as optional props.
5. The first tick falls one period after switching on (Play's first tick falls at the press). `setInterval`, not a `setTimeout` chain.
6. Reset is recognised by the run's `net` identity: no new field on `SimRun`.

**Decisions awaiting Alfonso (RC-26).** None. No critical-zone file. No exported interface broken outside the lane. No ratified row amended: R-SIM-101's «a hand press stops Play» does not cover a tick. No demo scene has a clock.

**Questions.** None blocking.

---

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A tick can go «through the panel's `fire`» without stopping Play (decisions 3, 6). | **Falsified as the code stands [R].** `fire` opens with `setPlaying(null); setPlayNote(null);` (`SimulationPanel.tsx:623-624`). A flag on `fire` that skips those two lines keeps the tick on `fire`'s path (`pressInput`, `show`) and satisfies both decisions. |
| H2 | The card can own the timer and still be cleared by every condition of decision 5. | **Holds [R].** The card mounts only on `isModelMode && rolesComplete && boardOpen && view` (`:1171`), and only in the open branch (`if (!open) {` at `:761` returns without it). Collapse calls `closeBoard` (`:827`), and a model switch resets `boardOpen` (`:325`). Reset, Stop and the interruption reach the card as a change of `getSimRun` (`simRunState.ts:277`, `:465`). |
| H3 | The tick count and the panel's `step n` agree. | **Holds, within one tick [R].** `step` is `trace.length` (`SimulationPanel.tsx:495`). `simCommit` appends a `discard` and a `quiescence` to the trace as it appends a fired step (`simRunState.ts:372`, `:379-381`). A press that opens the dialog or a list commits nothing (`simBridge.ts:1505-1514`); decision 7 drops the ticks after it. |
| H4 | The period fits the record without moving any existing board's string. | **Holds [R].** `encodeBoard` writes `id, kind, cell, label, binding` per device (`boardCodec.ts:146-148`). A `period` written for clocks only, after `binding`, leaves every other device's bytes unchanged; the decoder already ignores unknown fields (`:31`). |
| H5 | The timer can be unit-tested as decision 5 and the prompt's COME 2 ask. | **Holds [R].** The sim tests run in `environment: 'node'` (`vitest.config.ts:14`). `simBoardFace.test.ts:96-113` starts a real run with `startRun` and presses it with `pressInput`, as the panel does. A pure driver with injected `run`, `waiting` and `press` runs under `vi.useFakeTimers()`, as `layoutAutosaveScheduler.test.ts` already does. |
| H6 | Extending `DeviceKind` breaks a consumer outside the lane. | **Falsified [R].** Search: `command grep -rln -E 'boardCodec\|simBoardFace\|simBoardDevices\|DeviceKind\|DEVICE_KINDS\|BINDING_KINDS\|SimBoard\b' src scripts`, filtered for paths outside the two folders. It returns only `scripts/probe/io-board-lane1.ts`, which imports the codec dynamically (`:328`) and types nothing by `DeviceKind`. Positive control on the same tool: `DEVICE_KINDS` lists `SimBoardEditor.tsx`, `boardCodec.ts` and its test. |

## Files read

- `frontend/src/model/simulation/boardCodec.ts` (all), `boardOutputs.ts` (1-60)
- `frontend/src/components/editor-v2/sim/simBoard.ts` (all), `simBoardFace.ts` (all), `simBoardDevices.tsx` (all), `SimBoardEditor.tsx` (all), `SimBoard.scss` (1-60, grep), `simRunState.ts` (60-210, 270-300, 360-508)
- `SimulationPanel.tsx` (1-130, 280-1364), `simBridge.ts` (1-60, 1295-1538)
- `__tests__/simBoardFace.test.ts` (1-140), `__tests__/simBridge.test.ts` (grep of the guards), `frontend/vitest.config.ts` (grep)
- `docs/decisions.md`: RC-11, RC-16..30, R-SIM-88, R-SIM-99..121
- `docs/PROTOCOL.md` P4, P6, P8, P16
- `docs/discovery/discovery_2026-10-03_sim_io_board.md` §0, hypotheses, §1, §5, the Lane 1 addendum
- `docs/claude-code-log.md` (head), `docs/log-inbox/simulation.md` (head, the Lane 2 entry)

## 1. Play's timer, the pattern [R]

- The pace is fixed: `const PLAY_INTERVAL_MS = 500;` (`SimulationPanel.tsx:109`).
- A `setTimeout` chain in an effect, cleared by its cleanup (`:650-666`). Each tick reads the store, never React state: `const r = playPress(modelid, (store.getState() as any).idlookup ?? {}, playSteps.current);` (`:654`).
- `playPress` reads `getSimRun(modelId)` and `getSimPolicy(modelId)` at each tick (`simBridge.ts:1469-1470`), so «a Stop, a Reset, an interruption or a change of the policy between two ticks is read by the next one» (`:1463-1465`).
- The clock follows the same rule: its `check()` reads `getSimRun` and `runStatus` (`simBridge.ts:1299`) at each tick. `runStatus` keeps a run that waits for an input `Running` (`:1302-1303`), so the clock is not switched off by a pending ask.

## 2. `fire`, `show`, the dialog and the list [R]

- `fire` (`SimulationPanel.tsx:620-631`) stops Play, then presses through `pressRandom`, `pressStep` or `pressInput`, then calls `show`.
- `show` opens the dialog when the press asks: `setAsking({ event, input, asks: pressed.asks });` (`:601`). It opens the list when the press is pending (`:605`).
- The dialog renders on `asking && run` (`:1011`) and the list on `pending && run && head` (`:972`). Both are panel state (`:293-294`), never the store, so the card learns of them only through a prop: `waiting = asking !== null || pending !== null`. The driver reads that prop through a ref at each tick.
- The board's press: `send` (`simBoardDevices.tsx:328-332`) plans the press over the held values (`planPress`, `simBoardFace.ts:354-359`) and calls either `fire` or `ask`. `askInputs` (`SimulationPanel.tsx:751-755`) does not touch Play.

## 3. The card and its lifetime [R]

- `SimBoard` keeps the held values in its own state (`simBoardDevices.tsx:308`). It clears a keypad buffer when the run's snapshot changes: `useEffect(() => { setHeld(...) }, [runSnapshot]);` (`:322`). The clocks' on/off is view state of the same kind (decision 4).
- The card re-renders on the `'mark'` version (`useSimVersion`, `:298`) and after every panel press, through the panel's own `tick`. `run` therefore changes identity on every commit: `simCommit` stores `{ ...run, ... }` (`simRunState.ts:372`). A new `net` arrives only with `startRun` at Reset.

## 4. The codec, the board model and the editor [R]

- Kinds: `export type InputDeviceKind = 'button' | 'switch' | 'slider' | 'keypad';` (`boardCodec.ts:44`); `DEVICE_KINDS` (`:48`); `INPUT_KINDS` (`:50`); `BINDING_KINDS` with `button: ['event']` (`:78-79`).
- A malformed device field drops the device: `` return device(`${d.id}: the cell is off the grid.`); `` (`:201`). An out-of-range period follows the same rule (decision 2: «a board defect, not a clamp»).
- `addDevice` builds `{ id, kind, cell, label: '', binding: null }` (`simBoard.ts:312`): a clock gains `period: 1000` there. `resolveDevice` (`:248-252`) flags a clock whose period is out of range, which only an in-memory draft can carry. `bindingCaption` (`:359-377`) and `nuxmvOf` (`:380-409`) need a clock case. In nuXmv the clock is the Button's `event = <label>`, because a clock-bound event is an ordinary event (decision 3).
- The editor hides the form select when a kind takes one form (`SimBoardEditor.tsx:438`), and the `'event'` fields are the Button's (`:188-191`). The clock reuses both and adds one period field. The palette groups the kinds by `isInputKind` (`:329`), so the clock appears under Inputs once it is an input kind.
- Faces: `FACES` maps every kind to a component (`simBoardDevices.tsx:227-230`), `DEVICE_LABELS` (`simBoard.ts:46-49`) and `KIND_ICON` (`SimBoardEditor.tsx:52-55`) are typed `Record<DeviceKind, …>`, so tsc enforces the clock entry in each.

## 5. Decisions taken in this phase (unattended, RC-25)

1. **A tick presses as the Button does.** The press goes through the card's `send`: held values answer the asks (R-SIM-120), the dialog asks the rest, and the press ends in the panel's `fire` with `keepPlay`. A tick is a press from the board; the alternative, `fire(event)` with no held values, would open the dialog at every tick of a guard that reads a Switch. This reads provisional R-SIM-120's «hand presses only» as «presses from the board», recorded in R-SIM-122.
2. **The choice list waits like the dialog.** A tick while a nondeterministic choice is open would re-press the event and replace the list, committing nothing. It is dropped and counted as dropped instead, so ticks and steps keep agreeing (H3).
3. **The period.** The codec gets `CLOCK_PERIOD_MIN` 100, `CLOCK_PERIOD_MAX` 60000 and `CLOCK_PERIOD_DEFAULT` 1000. A stored clock without `period` reads 1000. A stored `period` that is not an integer in range drops the device with a `device` defect. The editor writes only a valid period, and `setPeriod` refuses any other, as `setBinding` refuses a misfit binding (`simBoard.ts:324-328`).
4. **The flag on `fire`.** `keepPlay?: boolean` is the fifth parameter; a hand press passes nothing, so its behaviour is unchanged. `SimBoardProps` gains two optional props: `waiting` (dialog or list open) and `clockFire` (the press of a tick). Both additions are optional (rule 11).
5. **Pace.** One `setInterval` per running clock. The first tick falls one period after switching on, as a real clock ticks: the microwave reads `01:25` at 5 s, not `01:24`. Ticks are counted from the switch-on and kept on the face after it goes off, until the next switch-on.
6. **Reset recognition.** `check()` compares the live run's `net` with the one the clock started on: a new `net` is Reset, no run is Stop or the interruption. Off reasons on the face: by hand, Reset, «no run» (Stop, or the model changed), and `Terminated`, `Deadlock` or `Halted` named. The card's unmount disposes the timers without a reason, because the face is gone with them.

## 6. Phase 2 files (exact)

| # | File | What changes |
|---|---|---|
| 1 | `frontend/src/model/simulation/boardCodec.ts` | `clock` kind, `BINDING_KINDS.clock`, `period` on the record, the range constants, encode and decode |
| 2 | `frontend/src/model/simulation/__tests__/boardCodec.test.ts` | round trip, default, range, defects, non-clock bytes unchanged |
| 3 | `frontend/src/components/editor-v2/sim/simBoard.ts` | label, `addDevice` period, `setPeriod`, resolution, caption, nuXmv row |
| 4 | `frontend/src/components/editor-v2/sim/__tests__/simBoard.test.ts` | the above |
| 5 | `frontend/src/components/editor-v2/sim/simBoardClock.ts` (new) | the pure driver: start, stop, `check`, tick, drop, dispose; off-reason texts |
| 6 | `frontend/src/components/editor-v2/sim/__tests__/simBoardClock.test.ts` (new) | fake timers: N periods, N presses; each off-condition; a hand press; Play together; dialog and list drops |
| 7 | `frontend/src/components/editor-v2/sim/simBoardFace.ts` | the clock's face from `BoardScene.clocks` (optional) |
| 8 | `frontend/src/components/editor-v2/sim/__tests__/simBoardFace.test.ts` | on, off, period, ticks, dropped, off reason |
| 9 | `frontend/src/components/editor-v2/sim/simBoardDevices.tsx` | `ClockFace` in both skins, the driver owned by `SimBoard`, `send` via `clockFire` |
| 10 | `frontend/src/components/editor-v2/sim/SimBoard.scss` | the clock face, Variant A tokens, Variant B literals |
| 11 | `frontend/src/components/editor-v2/sim/SimBoardEditor.tsx` | palette icon, period field with its range |
| 12 | `frontend/src/components/editor-v2/sim/SimBoardEditor.scss` | only if the period field needs a style the existing classes lack |
| 13 | `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` | `keepPlay` on `fire`; `waiting` and `clockFire` to `SimBoard` |

More than five files (rule 19): the prompt's DOVE names both folders and asks the report to list the files, which is taken as the confirmation, as earlier simulator lanes did. The closure commit adds `docs/decisions.md` (R-SIM-122), this report's addendum, the prompt's Status and `docs/log-inbox/simulation.md`. The lane probe is a gitignored `frontend/scripts/smoke/_tmp_ioclock_probe.ts`, never committed. Its crops go to `~/.jjodel-lanes/P-2026-10-04-0150/`.

## 7. Risks and dependencies

- **R1, a dialog opened by a tick while Play runs.** Play's ticks read the store, not the panel's `asking`, so Play goes on pressing ε while a tick's dialog is open. That is today's behaviour for any dialog Play did not open itself, and nothing in decision 6 changes it.
- **R2, render rate.** Each tick re-renders the panel and recomputes its `view` memo, `inputReason` over every event (`SimulationPanel.tsx:483-491`). At the 100 ms floor that is ten renders a second. It is measured in the probe, not assumed.
- **R3, the test gap.** The panel cannot be imported by the node bench (`window is not defined` through the joiner, CLAUDE.md §5). So «a tick does not stop Play» is checked at the driver level (both presses land in the trace) and in the probe, not as a unit test of `fire`. Declared in the log entry.
- **R4, the identifiers.** Searched before use: `simBoardClock`, `createClocks`, `ClockState`, `CLOCK_(MIN|MAX|DEFAULT)`, `sim-board-device__clock`, `sim-board-editor__period`, `periodText`, `bi-stopwatch` exit 1 on `src`. The positive control is the `clock` search on the same folders, which hits `SimInspector.tsx:376` (`bi-clock-history`).

## 8. Questions

None open. The microwave scene of the probe is attempted within the prompt's 15 minutes; the outcome goes in the Phase 2 addendum.
