# Discovery: random resolution of nondeterminism, the Random button and the Ask | Random run policy

**Prompt-ID**: P-2026-09-29-1700. **Prompt**: `docs/prompts/claude_2026-09-29_1700_prompt_discovery_sim_random_choice.md`.
**Chat**: C-2026-09-28-1936. **Session**: `d690112c-f0c1-45a6-bee0-f43462d8960b` (launched by `lane-run`, tier heavy).
**Tree**: `~/jjodel-w-randdisc`, branch `sim-random-disc`, HEAD `5d18f1581` (`alfonso-frontend-jjtl` `8f972410f` plus this prompt).
**Executor**: Opus 5.5 (`claude-opus-5-5`), as the session banner shows. **Claude Code**: 2.1.284.

This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the real files.
Tags: **[M]** measured in this phase on `5d18f1581` (probe `frontend/scripts/smoke/_tmp_p1700_random.ts`, gitignored,
`npx tsx`, EXIT=0, pure core only, no browser, no lane probe), **[R]** read from a file.

## 0. Answer in brief

Three premises of the proposal do not hold today, and the plan follows from them:
- **There is no Play.** The ▶ of the M1 face is Step, one ε press per click (`SimulationPanel.tsx:777-785`, `:515`);
  no timer anywhere under `sim/` [M, §2]. **Q1:** every ε press with 2+ candidates stops and opens the list, by
  construction (`simBridge.ts:1273`). Of the four demo scenes only Petri has an ε choice: its 5 ε paths cross 2 or 3
  choices and all end in `Deadlock` at `p2 ×2, p3` after 4 steps; Flow B has none (6 steps to `Terminated`); SM and
  ESM have no ε candidate (SM [M], ESM [R]: every edge has a trigger). Part 2 adds a Play button; it does not change one.
- **There is no trace.** A step commits its configuration and nothing else (`simRunState.ts:148-167`); the panel
  keeps the last line only (`SimulationPanel.tsx:237`); trace, seeded policy and export are spec step 5, not built
  (spec §6, §9 item 5; R-SIM-35). Part 1 adds the minimal trace the ratification names: optional `seed`, `draws`,
  `trace` (committed steps with `origin`) on `SimRun`. No export exists, so no exporter or reader changes (§5).
- **The pure core never chooses**: `step()` takes the selector (`netStep.ts:20`, `:256-259`, R-SIM-7). The RNG goes
  in a new pure module beside it, `model/simulation/simRandom.ts`: mulberry32 in pure form, draw *i* of seed *s* =
  mix(*s* + (*i*+1)·0x6D2B79F5), so a run stores two numbers and no closure; pick = floor(*u*·*n*). `step()` and its
  callers keep their signatures. Equal to the closure mulberry32 over 10000 draws; χ² 0.09 / 2.02 / 4.15 at
  *n* = 2 / 3 / 5 (df 1 / 2 / 4); no `Math.random` under `model/simulation` or `sim/` today [M, §4].

**Recommended**: two lanes, Part 1 then Part 2, no critical-zone file in either (§8).
- **L1 (R-SIM-100)**, 8 files: `simRandom.ts` (new) + test; `simRunState.ts` + test; `simBridge.ts` + test;
  `SimulationPanel.tsx`; `simulation-panel.scss`. Random sits right of Cancel in the list's last row, same height.
- **L2 (R-SIM-101)**, 6 files: `simRunState.ts`, `simBridge.ts` (pure `playTick`), `SimulationPanel.tsx`, scss, 2 tests.

**Q2** Recommended: k = 100, a number input (1..1000) after a `Choices` select (Ask | Random) in one constant row
above the buttons, so Step does not move (the panel grows upward). k counts the steps of one Play press. At k
Play stops, the run stays `Running`, the status row reads `Running · Play stopped at 100 steps`, Play continues.
**Q3** Recommended: no visible line. The seed goes in the `title` of `Last step:` after a drawn step and in the
Reset line's title (`seed 3141592653`), and in the run's in-memory trace. An export waits for spec step 5.

**Decisions awaiting Alfonso** (RC-26: what the demo shows, the ratified wording):
- A1. Play is a new fourth button, `bi-fast-forward-fill`, between Step and Stop: one ε step every 500 ms, the
  glyph turns `bi-pause-fill` while playing, and Stop keeps today's meaning (it clears the run). Recommended: yes.
- A2. Two stops the ratified list lacks: an ε with no candidate while an event has one (SM at Reset: `Running`, 0 ε
  candidates [M]) and an ε press that asks an input (R-SIM-88). Play stops and never draws an event or an input
  value. Recommended: yes, the status row reads `Running · Play waits for an event`.
- A3. A list opened by an event: the ratification says ε only; no demo scene has one [M]. Recommended: ε only.
- A4. Demo §2.2 keeps its three hand choices and gains one optional beat: Reset, Choices → Random, Play, which
  ends in `Deadlock` at `p2 ×2, p3` in 4 steps whatever the draws [M, 10000 of 10000 seeds]. Recommended: yes.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Play exists and stops at every ε choice | **Falsified** in its premise: no Play; Step stops at every choice by construction (§2) |
| H2 | A trace exists where `origin` and `seed` can be added | **Falsified**: no trace, no export (§5) |
| H3 | The core can take an RNG without changing its call sites' semantics | **Holds**: the choice is outside `step()` (§4) |
| H4 | Random can sit next to Cancel with no layout shift | **Holds on read**; a Phase 2 measurement is owed (§6) |
| H5 | The policy fits the run state per `modelId` | **Holds**, as a separate map next to `runs` (§7) |

## 2. Play, Step, Stop today [R, M]

- `SimulationPanel.tsx:777-785`: `title={inputTitle(eventRole ? 'Step (ε)' : 'Step', null)}`, `onClick={onStep}`,
  `<i className="bi bi-play-fill" />`. `:515`: `const onStep = useCallback((): void => { fire(null); }, [fire]);`.
- Stop: `SimulationPanel.tsx:475-488`, which clears pending, lines and the run (`simClear(modelid)`).
- The choice: `simBridge.ts:1271-1273`: `if (cs.candidates.length > 1) return { pending: cs.candidates, lastStep: null, outcome: null };`
  So a list always holds 2+ candidates, and «at least two» in Part 1 holds for every open list.
- Absence of a loop [M]: `command grep -n 'setInterval\|setTimeout\|requestAnimationFrame'` over `sim/*.ts*` exits 1;
  control on the same file with `useCallback` counts 6.
- The demo script says so too: `docs/demo/models_2026_simulator_demo.md:68`: «**Buttons** [R]: ⏮ Reset, ▶ Step, ■ Stop».

## 3. Measures on the demo nets [M]

Hand copies of the scenes of `~/.jjodel-lanes/probe-kit/simgate/_tmp_simgate_scenario.js:11-23`, run through the
real `candidates`, `step` and `netRunStatus`. Positive control: the Petri copy reproduces the demo table
(`models_2026_simulator_demo.md:191-196`) step by step: offered `[t1, t3]`, `[t1, t3]`, `[t1, t2]`, `[t1]`, then `Deadlock`.

| Scene | ε choices | Play, Ask | Play, Random (seed 2026), k = 100 |
|---|---|---|---|
| Petri | 5 paths, 2 or 3 choices each, all `Deadlock` at `p2x2, p3`, length 4 | stops at step 0, list open | `Deadlock`, 4 steps, 2 draws |
| Flow B | 0 (candidate counts 1 1 1 1 1 1 0) | `Terminated`, 6 steps | `Terminated`, 6 steps, 0 draws |
| SM [M]; ESM [R, scenario:22-23, every edge triggered] | ε never a candidate; status `Running` | waits for an event, 0 steps | the same, 0 draws |
| cyclic `u`,`v`: a→b, `w`: b→a | a choice every 2 steps | stops at step 0 | `k`, 100 steps, 50 draws, 0.6 ms |

Petri over 10000 seeds: 10000 `Deadlock`, same final marking, at most 4 steps and 3 draws; the five paths drawn
2507 / 2495 / 2481 / 1274 / 1243 times (expected 1/4, 1/4, 1/4, 1/8, 1/8). Seed 99 twice: the same path.

## 4. Injection point and RNG [R, M]

- `netStep.ts:20`: «Interleaving (R-SIM-7): one firing per step, chosen by the caller.» `step(net, cfg, selector, …)`
  checks admissibility (`:266`), so a drawn selector goes through the same gate as a clicked one.
- New `model/simulation/simRandom.ts` (≈30 lines): `type SimRng = () => number`; `uniform(seed, i)`;
  `seededRng(seed, from)`; `drawTransition(candidates, rng)` → `null` for 0, the one for 1 (no draw consumed),
  `candidates[floor(rng()·n)]` otherwise. Algorithm: mulberry32 (public domain), 32-bit, state step a Weyl
  increment, so the *i*-th output is a function of (seed, *i*): `SimRun` keeps `seed` and `draws`.
- The seed is drawn once at Reset in the bridge, `crypto.getRandomValues(new Uint32Array(1))[0]`, never by the core.
  Tests inject a stub RNG or a seed: `startRun` gains an optional last parameter.
- Absence of `Math.random` [M]: `command grep -rn 'Math.random' frontend/src/model/simulation frontend/src/components/editor-v2/sim`
  returns nothing; the same command over `frontend/src` finds `types/activity.ts:92` (control).

## 5. Trace fields and readers [R]

- Today a committed step stores `config` (and `halt`) only: `simRunState.ts:148-167`. `SimRun` (`:40-60`) has no
  history. The label (`netTypes` `NetLabel`: event, selector, candidates, evaluated, …) lives for one press.
- R-SIM-35 (`docs/decisions.md:1748-1751`): «Nessuna politica random nella 3b: un run casuale si riproduce solo con
  un seme registrato, e la traccia arriva con il passo 5». R-SIM-100 must say it amends R-SIM-35.
- Proposed, all optional (Rule 11): `SimRun.seed?: number`, `draws?: number`, `trace?: readonly SimTraceStep[]`,
  `SimTraceStep = { event, selector, kind, origin?: 'user' | 'random' }`; `origin` absent on a forced step (0 or 1
  candidate). `simCommit(modelId, outcome, origin?)` appends; `inadmissible` is not recorded, as today it stores nothing.
- Readers: `SimRun` is named in 8 files, all under `sim/` or the simulation tests [M]; its only producer is `startRun`
  (`simBridge.ts:603-614`) and `simCommit`'s only caller is `pressInput` (`simBridge.ts:1279`) [M]. No export exists.
  The harness trace monitor reads docs, never a run (`frontend/scripts/gates/trace-index.ts:11-15`); its row grammar
  accepts `R-SIM-100` (`docs-digest.ts:83`, `\\d+`), and a row citing no prompt or chat is a miss (`trace-index.ts:210`).

## 6. The Random button [R]

- The list: `SimulationPanel.tsx:722-745`; Cancel is the last child of `.sim-panel__choices`, a column flex
  (`simulation-panel.scss:437-442`), `align-self: flex-start`, 11 px text, no padding (`:480-499`).
- Place: wrap Cancel and Random in one row (`sim-panel__choice-actions`, flex, gap 12 px); Random is a text button in
  Cancel's vocabulary with `<i className="bi bi-shuffle" />`, the icon at 11 px, `line-height: 1`. It draws among
  `pending.candidates`, the array the options render (`:727`), unsafe ones included (they halt, R-SIM-23).
- No-layout-shift criterion for L1: the open list stays 123.1 px at step 1 on Petri at 1600×1000 and Step's top 854.5
  (R-SIM-98's measures), open and closed.
- «Last step»: today `${input}: ${candidateLabel} fired` (`simBridge.ts:1235`). Recommended `ε (random): t3 (lock → ∅) fired`:
  the marker after the input, so the clamp (`scss:513-517`, 262 px, 11 px font) cuts `fired`, never the marker. L1 measures the widest, t2's.

## 7. The policy and Play's loop [R]

- State: a second map in `simRunState.ts`, `policies: Map<modelId, { choices: 'ask' | 'random'; k: number }>`, default
  `{ ask, 100 }`. Module singleton, outside Redux (`:4-8`): lost on reload, kept across Reset, Stop, a model switch and
  the pill's unmount (the panel's cleanup clears `runs` only, `SimulationPanel.tsx:318`); `__resetSimRunsForTests` clears it.
- The policy applies to every ε press, Step included: under Random no ε list opens. Events are never drawn (A2, A3).
- Loop: a pure `playTick(run, policy)` in `simBridge.ts` returns `press` or `stop(reason)`; the panel runs it on a
  `setTimeout` chain of 500 ms, reading `getSimRun` each tick, so Stop, Reset and the R-SIM-34 interruption end it;
  the effect's cleanup clears the timer. Stops: `Terminated`, `Deadlock`, `Halted`, k, Stop, a list under Ask, no ε
  candidate, an input ask. Each fired step bumps the `'mark'` version once, as a Step does: no new canvas channel.

## 8. Phase 2 plan

**L1, Part 1, R-SIM-100** (after this report; Rule 19 list before the first edit):
`frontend/src/model/simulation/simRandom.ts` (new), `__tests__/simRandom.test.ts` (new);
`frontend/src/components/editor-v2/sim/simRunState.ts`, `__tests__/simRunState.test.ts`; `sim/simBridge.ts`,
`__tests__/simBridge.test.ts`; `sim/SimulationPanel.tsx`; `sim/simulation-panel.scss`. Tests: stub RNG (0 → first,
0.9999999 → last, 0.5 of 3 → second); pure = closure mulberry32 on fixed vectors; same seed same stream, seed+1
not; a stub cycling *i*/*n* hits each index once; χ² bound on 120000 seeded draws; one candidate consumes no draw;
`origin` recorded, absent on forced steps; an event press never has `random`; two runs with one seed, one trace.
Mutation bench on the pick and the draw counter. Visual: the two measures of §6, light and dark.

**L2, Part 2, R-SIM-101** (after L1 merges): `sim/simRunState.ts`, `sim/simBridge.ts`, `sim/SimulationPanel.tsx`,
`sim/simulation-panel.scss`, `__tests__/simRunState.test.ts`, `__tests__/simBridge.test.ts`. Tests: `playTick` stops
at k (cyclic, exactly k), `Deadlock` (Petri, 4), `Terminated` (Flow B, 6), no ε candidate (SM, 0), an input ask, a
list under Ask; a cleared run stops the next tick; the press is always ε (a spy on `step`'s event); the policy map's
default and per-model scope. Visual: Step's top 854.5 with the Choices row; the panel's top within the editor.

**Critical zone**: none of the files is in `CLAUDE.md` §3.1 (`sim/` is not among its files or its three
directories). No Layer Impact Report. The IR resolvers read the `'mark'` version but are not edited.

**Demo script lines** (`docs/demo/models_2026_simulator_demo.md`): L1: `:184-187` (Random right of Cancel). L2 and A4:
`:68-69` (buttons, the Choices row), after `:199` the optional beat, `:177` (count), `:476-481` §5 (seed entry,
export). Both lanes: `docs/decisions.md` R-SIM-100 / R-SIM-101, each citing its prompt.

## 9. Decisions taken (unattended) and risks

- Taken: mulberry32 pure; seed per run at Reset; `origin` only on chosen steps; the policy applies to Step too; the
  Choices row reuses `sim-panel__row` / `__label` / `__select` (`scss:213-300`); 500 ms per tick; k per Play press.
- Risk: the Choices row adds about 28 px at the top of the M1 face; under `max-height` (`scss:80`) the body scrolls.
- Risk: a timer effect reading React state would act on a stale run; `playTick` reads the store only.

## 10. Files read and searches

`docs/PROTOCOL.md` P4, P16; `docs/decisions.md` RC-20, RC-21, RC-26, RC-33, R-SIM-7, 25, 35, 57, 62, 63, 65, 66, 82,
96-99; `docs/spec/claude_spec_2026-09-13_computational_model.md` §4.2-4.3, §6, §9; `docs/demo/models_2026_simulator_demo.md`
(whole); `frontend/src/model/simulation/netStep.ts` (whole), `netTypes.ts:41-54, 200-203, 278-291`;
`frontend/src/components/editor-v2/sim/simRunState.ts` (whole), `simBridge.ts:560-645, 1170-1294`,
`SimulationPanel.tsx:196-525, 580-869`, `simulation-panel.scss:60-90, 183-212, 328-360, 436-500, 513-517`;
`frontend/scripts/gates/trace-index.ts` and `docs-digest.ts` (the patterns cited). Search for «trace» in
`docs/decisions.md`: 0 hits in English, 11 with `traccia|trace`, control `R-SIM` 259 hits.
