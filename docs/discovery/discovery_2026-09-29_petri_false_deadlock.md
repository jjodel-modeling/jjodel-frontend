# Discovery: a reported false deadlock on a DemoPetri-like net

Prompt-ID P-2026-09-29-0955 · `docs/prompts/claude_2026-09-29_0948_prompt_discovery_petri_false_deadlock.md` · Chat C-2026-09-28-1936 · session `59839d00-9efd-4571-87c0-d1ce3c79e32a` · tree `~/jjodel-w-petridl`, branch `petri-deadlock-disc`, HEAD `a6afeb72e` · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference: whoever uses it rereads the files. [M] = measured in this phase on `a6afeb72e`, [R] = read.

## 0. Answer in brief

- **Not a bug: the guard.** The reported symptom appears only when `t2` carries the guard `p3.[tokens] < 1`, which DemoPetri's `t2` has. With the guard and k = 4, the reported run `t1, t1, t3, t2` ends at `(p1,p2,p3,lock) = (0,2,1,0)` in `Deadlock`. The enabled set is `{}`, `t2` is evaluated `false`, and the reason reads `ε: t2 false`, title `ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]`. Without the guard the same run is `Running` at `(0,2,1,0)` with `{t2}` enabled, and `t2` fires to `(0,0,2,0)`, then `Deadlock`, `nothing enabled`. That is what the reporter expected. [M, 12 runs + 2 controls, §2]
- **Discriminating runs.** With k = 4: from `(0,2,0,0)`, `t2` is enabled with or without the guard. From `(0,2,1,0)`, `t2` is enabled without the guard and not with it (`Deadlock` at Reset). [M]
- **The three candidate causes are falsified.** (1) The weight check is `>=` (`netStep.ts:131`): `t2` is enabled at p2 = 2, weight 2. (2) The capacity check on p3 never deadlocks. An unsafe firing stays a candidate, flagged (`netStep.ts:208`), and firing it halts the run (`netStep.ts:276`). Measured: `Halted: unsafe. p3 would hold 3 tokens; the bound is 2.` (3) The enabled set is recomputed after every firing (`netStep.ts:339-342`; the panel memo reruns on `tick`, `SimulationPanel.tsx:393`, `:427`, `:512`). Measured: without the guard, status is `Running` at the same marking. [M, R]
- **The reported net had k ≥ 4.** Steps 1-4 are correct only when p2 may hold 4. At k = 3 the second `t1` halts: `p2 would hold 4 tokens; the bound is 3.` With `simBound` unset (k = 1), p1's initial 2 is the defect `initial-over-bound`, p1 starts empty, and `t1` is refused. DemoPetri's Apply sets 4. [M]
- **DemoPetri export.** `t2.guard = ["p3.[tokens] < 1"]` and the other slots match the demo script's table. The export carries no role bag: both `_state` are `{}` and no `"sim*"` key appears. So the bound 4 comes from Apply (demo script §2.2 step 2), not from the file. [M]

Recommended: not a bug: the guard. Close the report with the reporter by pointing to `t2.guard`. If their net had no guard, ask for the export: this engine does not reproduce the symptom without it.

**Decision awaiting Alfonso**
1. Clarity for a user who forgot the guard. The status line says `ε: t2 false` without saying *what* is false, while an inhibitor says `inhibited by lock` (`simBridge.ts:1011`, `:1029`). The guard's text is only in the hover `title` (R-SIM-62). Changing the word amends the example ratified in R-SIM-58 (`Deadlock · ε: t1 false`) and the demo script text at `:168`.

**Questions**
1. Add the word «guard» to the reason (`ε: t2 guard false`, the source still only in the title, R-SIM-62 kept)? Recommended: yes, one small lane after the demo run. The files are `simBridge.ts` `blocked()`, its tests first (`simBridge.test.ts`), and the demo script `:165-170` re-measured.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H0 | The chat's reading: the reporter's net carries the guard `p3.[tokens] < 1` on `t2`, and the deadlock is correct. | **Holds** under the measured conditions. With the guard, the symptom reproduces byte for byte against the demo script's measured status. Without it, the engine does what the reporter expected. Whether the reporter's net had the guard is not measurable from here (§6). |
| H1 | Strict `>` in the weight check. | **Falsified** [M, R], §3.1 |
| H2 | An output or capacity check on p3 blocks `t2`. | **Falsified** [M, R], §3.2 |
| H3 | The enabled set is not recomputed after a firing. | **Falsified** [M, R], §3.3 |

## 2. Measurements [M]

Probe `frontend/scripts/smoke/_tmp_petri_deadlock.ts` (gitignored, `.gitignore:68`), `npx tsx`, no dev server, `EXIT=0`, 107 lines of output. It builds the reported net as a raw lookup shaped like the store and runs the **bridge** end to end: `startRun`, `simReset`, `pressInput` with the user's selector, `runStatus`, `stopReason`, `markingLine`, `haltMessage`. The bridge in turn runs the real `compileNet`, `candidates`, `step`, `netRunStatus`, `compileGuard` and `evaluateGuard`. The guard context is the synthetic `buildEvalContext` record of `simBridge.test.ts` (`petriRecord`: pool handles, instance names bound at the top).

Net as the demo script's table: `a1 p1→t1`, `a2 t1→p2 w2`, `a3 p2→t2 w2`, `a4 t2→p3`, `a5 lock→t3`, `i1 lock⊸t2` (InhibitorArc extends Arc). `simGuard` is bound in every run; "no guard" means `t2.guard` is empty.

Control on the same files: `npx vitest run` on `netStep.test.ts` and `simBridge.test.ts`: 2 files, 174 tests passed, `EXIT=0`.

Marking vector `(p1,p2,p3,lock)`; "enabled" is the candidate set for ε (guards and inhibitors evaluated); status per `runStatus`.

**k = 4 (`simBound` '4', as DemoPetri's Apply sets it)**

| Run | Guard | Steps: marking → enabled → status |
|---|---|---|
| (a) `t1,t1,t3,t2` | yes | Reset `(2,0,0,1)` {t1,t3} Running → t1 `(1,2,0,1)` {t1,t3}, t2 inhibited(lock) → t1 `(0,4,0,1)` {t3} → t3 `(0,4,0,0)` {t2} → t2 `(0,2,1,0)` **{} t2:false Deadlock**, line `ε: t2 false`, title `ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]` |
| (a) | no | same through t3 → t2 `(0,2,1,0)` **{t2} Running** → t2 `(0,0,2,0)` {} Deadlock, `nothing enabled` |
| (b) `(0,2,0,0)` | yes | Reset {t2} Running → t2 `(0,0,1,0)` {} Deadlock, `nothing enabled` |
| (b) | no | identical to the guarded (b) |
| (c) `(0,2,1,0)` | yes | Reset **{} t2:false Deadlock**, same line and title as (a) |
| (c) | no | Reset **{t2} Running** → t2 `(0,0,2,0)` {} Deadlock |

**k = 1 (`simBound` unset; default at `netCompile.ts:91` `bound: bound ?? 1,`)**, guard and no guard alike:

- (a): `1 defect: p1 (initial marking 2: an integer in 0..1 is required).` Reset `(0,0,0,1)` {t3}. Both `t1` are `inadmissible` (`refused, t1 is not a candidate`). t3 gives `(0,0,0,0)`, Deadlock, `nothing enabled`. Pressing `t2` never happens.
- (b): p2 has the same defect. Reset `(0,0,0,0)`, Deadlock.
- (c): p2 has the same defect. Reset `(0,0,1,0)`, Deadlock, `nothing enabled`.

**Controls**
- (d) Capacity: k = 2, no guard, `(0,2,2,0)`. `t2` is enabled, flagged `[unsafe p3=3]`. Pressing it gives `halted`, status `Halted`, `Halted: unsafe. p3 would hold 3 tokens; the bound is 2.`
- (e) Reported run at k = 3, guard: t1 gives `(1,2,0,1)`, then the second t1 gives `halted`, `Halted: unsafe. p2 would hold 4 tokens; the bound is 3.` Steps 1-4 cannot be "correct" below k = 4.

**DemoPetri export** (`/Users/alfonso/jjodel-demo-exports/scene_2_DemoPetri.json`, read only, `state` decompressed with `async-lz-string` by `_tmp_petri_demo_read.mjs`, `EXIT=0`):
- `Transition | t2 | {"guard":["p3.[tokens] < 1"]}`.
- `Place | p1 | {"tokens":[2]}`, `Place | lock | {"tokens":[1]}`.
- `a2`/`a3` weight `[2]`, `i1` InhibitorArc `lock→t2`.

Absence of a role bag, two reads through the same decompressed state: `DModel DemoPetri instanceof - _state keys []`, `DModel demoNet instanceof DemoPetri _state keys []`, and a regex over the whole state for `"sim…":` returned 0. Positive control for that regex: none inside the file, since no bag exists. The `_state keys` read is the independent check.

## 3. The three candidate causes against the code

### 3.1 Weight comparison: `>=` [R, confirmed by execution]
- `frontend/src/model/simulation/netStep.ts:130-132`:
  ```
  function presetEnabled(t: NetTransition, state: SimState): boolean {
      return t.preset.every(a => tokens(state, a.place) >= a.weight);
  ```
- The inhibitor at `netStep.ts:192`: `const blocker = t.inhibitors.find(a => tokens(state, a.place) >= a.weight);`. It blocks at lock ≥ 1, as R-SIM-30 (`tokens(p) < w`) specifies.
- The bridge's own copy has the same comparisons (`simBridge.ts:1122-1123`, `inputAsks`).
- Executed per CLAUDE.md §5: (b) enables `t2` at p2 = 2 = weight.

### 3.2 Output or capacity check on p3 [R, confirmed by execution]
- `netStep.ts:170`: `if (value > net.bound) { unsafe = { place: a.place, value }; break; }`. This is the only capacity check, over the postset.
- `netStep.ts:208`: `found.push({ transition: t.id, unsafe: fireMarking(net, state.marking, t).unsafe });`. An unsafe firing stays a candidate.
- `netStep.ts:276`: `if (unsafe) return halted({ kind: 'unsafe', ...`.
- So capacity yields `Halted` (R-SIM-23: "il run si ferma e lo segnala, non satura"), never `Deadlock`. Control (d).
- At k = 4, p3 = 2 after the second `t2` is inside the bound anyway.

### 3.3 Recomputation after firing [R, confirmed by execution]
- `netStep.ts:339-342`: `for (const event of [null, ...alphabet]) { if (candidates(net, { state: cfg.state, event }, guards).candidates.length > 0) return 'Running'; } return 'Deadlock';`. The status is computed fresh on the configuration it is given, with no cache.
- `simBridge.ts:1163-1164`: `runStatus` calls `netRunStatus(run.net, run.config, ...)` on the committed run.
- `SimulationPanel.tsx:393`: `const status = runStatus(r);`, inside a memo whose dependencies include `tick` (`:427`). `fire` bumps it after every press (`:512` `setTick(t => t + 1);`).
- `stopReason` recomputes the candidates per input from the run (`simBridge.ts:1077-1097`, R-SIM-59).
- Measured: (a) without the guard is `Running` at `(0,2,1,0)`.
- Not measured: the React memo in a browser. The panel wiring is read, not run.

## 4. Is the reason clear enough for a user who forgot the guard? [R, M]
- The status row reads `Deadlock · ε: t2 false`. The measured `line` is `ε: t2 false`, the same as the demo script at `docs/demo/models_2026_simulator_demo.md:168`.
- The row names the transition but not the guard. The word "false" is the guard outcome (`simBridge.ts:1029` `const short = g.kind === 'defect' ? ... : 'false';`).
- The guard source appears only in the `title` (`[p3.[tokens] < 1]`, R-SIM-62). The click-open list shows `ε: t2 (p2 ×2 → p3) false`, still without the word "guard".
- An inhibitor, by contrast, says what blocks: `inhibited by ${elementName(lookup, out.place)}` (`simBridge.ts:1011`).
- A user who reasons structurally reads "t2 false" next to p2 = 2 and lock = 0, as this reporter did. That supports the question in §0. Adding «guard» does not expose the source, so R-SIM-62 holds. It does change the example text of R-SIM-58 and the measured demo line, which is why it is Alfonso's decision.

## 5. Files read
- `CLAUDE.md` (§5, §6, §3.1)
- `docs/PROTOCOL.md` P16
- `docs/decisions.md`: RC-20, RC-21, RC-33, R-SIM-21..33, R-SIM-58..62
- `docs/demo/models_2026_simulator_demo.md:95-170`
- `frontend/src/model/simulation/netStep.ts` (whole)
- `netTypes.ts` (whole)
- `netCompile.ts:1-200, 375-432, 500-615`
- `guardContext.ts` (whole)
- `guardEvaluator.ts` (whole)
- `frontend/src/components/editor-v2/sim/simBridge.ts:55-100, 140-172, 255-300, 560-642, 954-1100, 1112-1124, 1160-1300`
- `SimulationPanel.tsx:375-427, 476-515`
- `__tests__/netStep.test.ts:1-135`
- `simBridge.test.ts:1-140, 400-475`
- the DemoPetri export (decoded)

## 6. Risks and what is not settled
- Whether the reporter's net had the guard is the reporter's fact, not measurable here. The report's own numbers point to DemoPetri: the same marking `(0,2,1,0)`, k ≥ 4 implied by steps 1-4, the demo's arc weights. The report's run order `t1,t1,t3,t2` differs from the script's `t1,t3,t2,t1` but reaches the same marking.
- Read, not measured: a guard removed after Reset cannot keep blocking a run. The run signature covers the model's slots and interrupts the run on a change (R-SIM-34, `SimulationPanel.tsx:360`).
- No finding touches a §3.1 file. The optional text change (§0 question 1) is in `components/editor-v2/sim/`, outside the critical zone.
