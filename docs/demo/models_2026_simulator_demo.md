# MODELS 2026 simulator demo script

- Prompt-ID: `P-2026-09-27-1430`. Demo: Málaga, 2026-10-04. Freeze of the demo build: 2026-10-01 evening. After the
  freeze only this script is rehearsed.
- Source of every panel line: `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` (`a41e63496`) §4, its
  logs in `/tmp/demo2_scratch/`, its screenshots in `~/.jjodel-lanes/shots_readiness2/`, and the builder
  `frontend/scripts/smoke/_tmp_demo2_scenario.js`. Measured on `e1cefcfbc`, headless Chromium, light, 1600×1000.
- **[M]** a value measured by those probes, quoted verbatim. **[R]** a label read in
  `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`. Panel text is in `code`. What the presenter says is
  in double quotes after **Say**.
- The G13/G14 polish (`5739b950f`) landed after the report. It changed the choice list header and the Profile
  select only, and its lane measured both. Any later trunk commit to `SimulationPanel.tsx` or `simBridge.ts` needs a
  re-run of the readiness probes before this script holds (report §7, risk 7).

---

## 1. Setup

- **URL.** `http://localhost:3001`, the trunk tree `~/jjodel-release` (checkpoint `sessione_2026-09-27_3.md`, next
  step 2). The measurements ran on 3011, this tree's dev server at `e1cefcfbc`. Under `frontend/src` the trunk
  differs from it by the polish `5739b950f` only (`git diff --stat e1cefcfbc alfonso-frontend-jjtl`, 2 files).
- **Screen.** Light theme. Viewport 1600×1000.
- **Panel.** In each editor tab, click the `Simulation` chip [R]. The panel docks at the bottom of the editor. Every
  scene uses two tabs: the metamodel (M2 face: profile, Apply, Configure…) and the model (M1 face: the run).
- **Projects.** Four projects, one per preset. Each probe built its preset alone, in the RowViewSmoke seed project.

| Preset | Metamodel / model | Prepared before the talk | Live |
|---|---|---|---|
| State machine (PEST) | `DemoPEST` / `demoSM` | metamodel and model, as §2.1 | profile, Apply, the run |
| Petri net (P/T) | `DemoPetri` / `demoNet` | metamodel and model, as §2.2 | profile, Apply, the run |
| Extended state machine | `DemoESM` / `demoESM` | metamodel and model, as §2.3 | profile, Apply, the declarations, the run |
| Flowchart B | `DemoFlowB` / `demoFlowB` | metamodel and model, as §2.4 | profile, Apply, the declaration, the run |

- The builder writes the metamodels and models through the store. No probe drew them on the canvas. Drawing a preset
  live must end in the same names, types, abstract flags and references as §2.
  <!-- not measured: a preset drawn live on the canvas -->
- **Empty bag.** Set no simulation role before Apply. Every measured path starts from an empty bag. On every preset
  the M2 face then reads `Custom · Not checkable` and `Missing: Node, Transition, Next state, Initial or Initial
  marking, Source or Owned transitions.` [M].
- **Reset starts the run: before Reset every input is off.** The M1 face reads `Not started` with every event
  button off, e.g. `coin(off)`, `push(off)`, `stop(off)` [M].
- **Buttons** [R]: ⏮ Reset, ▶ Step, ■ Stop. During a run the M1 face reads, top to bottom: the choice list (Petri,
  on a conflict), the `Marking:` line, the buttons, `Events` (SM, ESM), `Last step:`, the status [M].

---

## 2. Scenes

### 2.1 State machine, PEST shape

**Metamodel `DemoPEST`** (builder).
- `State`. `Initial` and `Terminal` extend `State`.
- `State.transitions` → `Transition`: a composition, upper bound many.
- `Transition.nextState` → `State`. `Transition.event` → `Event`.
- `Event`: no attribute.

**Model `demoSM`.** `locked : Initial`, `unlocked : State`, `off : Terminal`; `coin`, `push`, `stop : Event`.

| Transition | owned by | `nextState` | `event` |
|---|---|---|---|
| `t1` | `locked` | `unlocked` | `coin` |
| `t2` | `unlocked` | `locked` | `push` |
| `t3` | `locked` | `locked` | `push` |
| `t4` | `unlocked` | `unlocked` | `coin` |
| `t5` | `locked` | `off` | `stop` |

**Apply** (tab `DemoPEST`).
1. Click `Configure…` [R]. The dialog `Simulation roles` opens on `What kind of model is this?`, with `Continue` off
   and `Pick a model kind to continue.` [M, P-2026-09-27-2105]. Click `State machine`, then `Continue` [M].
2. The dialog reads `Checkable` and `7 of 10 roles matched` [M, P-2026-09-27-2105]. Required 5 is open: Node
   `State`, Initial `Initial`, Transition `Transition`, Owned transitions `State.transitions`, Next state
   `Transition.nextState`. Optional 4, folded, holds the other two: Terminal `Terminal`, Trigger `Transition.event`
   [M]. Hover titles, e.g. `Proposed: State.transitions. The composition from State to Transition` [M].
   **Say** "I say what kind of model this is. The dialog proposes a binding for every role, each with its reason."
3. Apply, in the dialog. It closes, and the summary reads `State machine · Checkable` [M]. The panel is 157.5 px
   high at top 793.5 [M, P-2026-09-27-2105].
   **Say** "One Apply writes the whole binding. It is one undo step."

Count: 4 clicks, no keystroke; the run below, 11 clicks [M, P-2026-09-27-2105].

**Run** (tab `demoSM`). Before Reset: `Not started`, `coin(off)`, `push(off)`, `stop(off)` [M].

Reset: `Marking: locked`, `Last step: Reset`, `Running`, events `coin`, `push`, `stop` [M]. ▶ stays disabled for
the whole run: every edge has a trigger [M].
**Say** "Reset starts the run. The machine is in locked. The inputs are the events of the model."

| # | Click | `Last step:` line [M] | `Marking:` line [M] | Events off after [M] | Say |
|---|---|---|---|---|---|
| 1 | `push` | `Last step: push: t3 (locked → locked) fired` | `Marking: locked` | none | "push in locked is a self-loop." |
| 2 | `coin` | `Last step: coin: t1 (locked → unlocked) fired` | `Marking: unlocked` | `stop` | "coin unlocks. No stop edge leaves unlocked, so stop is off." |
| 3 | `coin` | `Last step: coin: t4 (unlocked → unlocked) fired` | `Marking: unlocked` | `stop` | |
| 4 | `push` | `Last step: push: t2 (unlocked → locked) fired` | `Marking: locked` | none | |
| 5 | `coin` | `Last step: coin: t1 (locked → unlocked) fired` | `Marking: unlocked` | `stop` | |
| 6 | `push` | `Last step: push: t2 (unlocked → locked) fired` | `Marking: locked` | none | |
| 7 | `push` | `Last step: push: t3 (locked → locked) fired` | `Marking: locked` | none | |
| 8 | `coin` | `Last step: coin: t1 (locked → unlocked) fired` | `Marking: unlocked` | `stop` | |
| 9 | `push` | `Last step: push: t2 (unlocked → locked) fired` | `Marking: locked` | none | |
| 10 | `stop` | `Last step: stop: t5 (locked → off) fired` | `Marking: off` | all | "stop reaches the terminal state." |

After step 10 the status reads `Terminated` [M].
**Say** "Each line names the event and the transition by their names in the model."

**Undo, optional** (tab `DemoPEST`, no write since Apply). Click an empty point of the canvas, then Cmd+Z. The M2
face reads `Custom · Not checkable` [M]; the M1 face reads `Simulation not configured. Missing on DemoPEST:
Initial or Initial marking, Owned transitions or Source, Next state.` [M]. Measured with Control+z in headless
Chromium; Cmd+Z is Alfonso's check on 3001 (first report §4.5).
**Say** "Apply was one step, so one undo takes the binding away."

### 2.2 Petri net (P/T)

**Metamodel `DemoPetri`** (builder).
- `PNode`, abstract. `Place` and `Transition` extend `PNode`.
- `Place.tokens: EInt`. `Transition.guard: Expression`.
- `Arc`: `src` → `PNode`, `tgt` → `PNode`, `weight: EInt`. `InhibitorArc` extends `Arc`.

**Model `demoNet`.** Places `p1` (`tokens` 2), `p2`, `p3`, `lock` (`tokens` 1). Transitions `t1`, `t2`, `t3`.
`t2.guard` = `p3.[tokens] < 1`. Unset slots stay empty: an unset weight counts 1, an unset marking 0 [M].

| Arc | class | `src` | `tgt` | `weight` |
|---|---|---|---|---|
| `a1` | `Arc` | `p1` | `t1` | unset |
| `a2` | `Arc` | `t1` | `p2` | 2 |
| `a3` | `Arc` | `p2` | `t2` | 2 |
| `a4` | `Arc` | `t2` | `p3` | unset |
| `a5` | `Arc` | `lock` | `t3` | unset |
| `i1` | `InhibitorArc` | `lock` | `t2` | unset |

**Apply** (tab `DemoPetri`).
1. Click `Configure…`, then `Petri net (P/T)`, then `Continue` [M, P-2026-09-27-2105]. The dialog reads `Checkable`
   and `9 of 10 roles matched` [M]. Required 6 is open: Node `Place`, Initial marking `Place.tokens`, Transition
   `Transition`, Arc `Arc`, Arc source `Arc.src`, Arc target `Arc.tgt`. Optional 4, folded: Arc weight
   `Arc.weight`, Inhibitor arc `InhibitorArc`, Guard `Transition.guard`, Terminal unset [M].
   **Say** "The binder recognises the net from the shape of the metamodel, the inhibitor and the guard included."
2. Under Parameters, Bound reads `4`, with `Proposed 4. The most tokens a place holds over the 9 reachable markings
   of the models, guards aside.` [M, P-2026-09-27-2105].
   **Say** "The dialog finds the bound by exploring the net."
3. Apply, in the dialog. The summary reads `Petri net (P/T) · Checkable`, the panel 157.5 px at 793.5 [M]. The bag
   holds Bound `4` [M, P-2026-09-27-2105].

Count: 4 clicks, no keystroke; the run below, 8 clicks: Reset, ▶ four times, three choices [M, P-2026-09-27-2105].

**Run** (tab `demoNet`). Before Reset: `Not started`, ▶ disabled, no line [M, P-2026-09-27-1738].

Reset: `Marking: lock, p1 ×2`, `Last step: Reset`, `Running` [M].
**Say** "Two tokens on p1, one on lock. The panel shows the marking of the run."

On a conflict ▶ opens a list above the Marking line, headed `CHOOSE A TRANSITION (ε)` (U+03B5, measured by the
polish lane `5739b950f`), with `Cancel` under it. While it is open, `Last step:` still shows the previous step and
the buttons do not move (Step's top 854.5) [M].

| # | Click | List offered [M] | `Marking:` line after [M] | `Last step:` line [M] | Say |
|---|---|---|---|---|---|
| 1 | ▶, then `t1 (p1 → p2 ×2)` | `t1 (p1 → p2 ×2)`, `t3 (lock → ∅)` | `Marking: lock, p1, p2 ×2` | `Last step: ε: t1 (p1 → p2 ×2) fired` | "Two transitions are enabled, so I choose. t1 puts two tokens on p2." |
| 2 | ▶, then `t3 (lock → ∅)` | the same | `Marking: p1, p2 ×2` | `Last step: ε: t3 (lock → ∅) fired` | "t3 empties lock. The inhibitor arc from lock no longer holds t2." |
| 3 | ▶, then `t2 (p2 ×2 → p3)` | `t1 (p1 → p2 ×2)`, `t2 (p2 ×2 → p3)` | `Marking: p1, p3` | `Last step: ε: t2 (p2 ×2 → p3) fired` | "t2 takes two tokens from p2." |
| 4 | ▶ | none | `Marking: p2 ×2, p3` | `Last step: ε: t1 (p1 → p2 ×2) fired` | "t1 is the only enabled transition. t2 has its tokens, but its guard is false." |

After step 4 the status reads `Deadlock · ε: t2 false`, with the title `ε: t2 (p2 ×2 → p3) false [p3.[tokens] <
1]` [M]. ▶ is disabled [M]. The table and this status read the same line for line after the dialog's Apply
[M, P-2026-09-27-2105].
**Say** "Deadlock. The panel names the transition and the guard that stops it."

Optional: click the status row. The reasons list reads `ε: t2 (p2 ×2 → p3) false` and moves Step's top from 854.5
to 830 [M]. Click it again to close.

### 2.3 Extended state machine

**Metamodel `DemoESM`** (builder). `DemoPEST` of §2.1, plus:
- `Event.name: EString`. The builder keeps it; the labels do not need it since R1 (§2.1 has none) [M].
- `Transition.guard: Expression`. `Transition.effect: Action`, upper bound many.
- `State.entry: Action`, upper bound many.

**Model `demoESM`.** `locked : Initial`, `unlocked : State`, `off : Terminal`; `coin`, `push`, `stop : Event`.

| Transition | owned by | `nextState` | `event` | `guard` | `effect` |
|---|---|---|---|---|---|
| `tc` | `locked` | `locked` | `coin` | | `model.[coins] := model.[coins] + 1` |
| `tp` | `locked` | `unlocked` | `push` | `model.[paid]` | `model.[coins] := 0` |
| `tu` | `unlocked` | `locked` | `push` | | |
| `ts` | `locked` | `off` | `stop` | | |

**Apply** (tab `DemoESM`).
1. Click `Configure…`, then `Extended state machine`, then `Continue` [M, P-2026-09-27-2105]. The dialog reads
   `Checkable` and `10 of 13 roles matched`: the seven of §2.1 plus Guard `Transition.guard`, Action
   `Transition.effect`, Entry `State.entry` [M]. The Data fold reads `Declare the state attributes the actions
   write` [M].
2. Apply, in the dialog, with no declaration. The summary reads `Extended state machine · Checkable` and the line
   `Declare the state attributes the actions write: Add attribute`, its `Add attribute` in view [M]. The panel is
   198.5 px at 752.5 [M, P-2026-09-27-2105].
   **Say** "The binding is complete. The actions write state attributes, and the panel asks me to declare them."

Count: 4 clicks, no keystroke; the optional Reset below, 2 clicks; the declarations, 9 interactions and 34
keystrokes; the run, 11 clicks [M, P-2026-09-27-2105].

**Optional: Reset before declaring** (tab `demoESM`). Reset shows `2 defects: tc action (undeclared 'coins' on
demoESM); tp action (undeclared 'coins' on demoESM).` and `Marking: locked` [M]. `coin` then shows `Halted: the
transition action of tc failed: 'coins' is not a state attribute of demoESM.` and `Last step: coin: tc (locked →
locked) halted the run` [M]. The halt line reads whole on two lines [M, P-2026-09-27-2225]; the defects line is
cut on screen, its title holds the whole text [M, P-2026-09-27-2105].
**Say** "Without the declarations the run names the missing attribute and stops at the first action."

**Declarations** (tab `DemoESM`).
1. Click `Add attribute` in the summary line. The dialog opens on Data, its own `Add attribute` in view and focused
   [M, P-2026-09-27-2105: 645.5-673.5, body 338-735]. The dialog's Apply is off, `Nothing to write` [M].
2. Click `Add attribute`. Row 1 reads `x1`, the name selected: type `coins`, Enter [M]. Scroll the dialog body to
   its end: the row's second line is below the fold [M 728-760, body bottom 735]. Domain `range`: the minimum reads
   `0`, the maximum `1` [M]. Click the maximum, `3`, Enter; click the initial value, `0`, Enter. A click selects the
   cell's text, so typing replaces it [M].
3. Click `Add attribute`. Row 2's name is selected: `paid`, Enter; `derived`. Scroll the dialog body to its end: the
   equation is below the fold [M 743-775 > 735]. Click it, `model.[coins] >= 2`, Enter [M].
4. Apply, in the dialog. The declarations line is gone from the summary [M, P-2026-09-27-2105].

Steps 1 to 4 are 9 interactions: 1 hint, 2 `Add attribute`, 2 select choices (`range`, `derived`), 3 cells
(maximum, initial value, equation), 1 Apply; 34 keystrokes; 2 scrolls; no double-click [M, P-2026-09-27-2105].
The labels `range`, `derived`, `stored` are the options of the dialog's selects [M].
**Say** "coins is stored, with the domain 0 to 3. paid is derived from coins."

**Run** (tab `demoESM`). After the optional Reset above, the M1 face reads `Run interrupted: the model changed.
Reset to run again.` [M].

Reset: `Marking: locked · coins = 0, paid = false`, `Last step: Reset` [M].
**Say** "After the dot, the state attributes: σ."

| # | Click | `Marking:` line after [M] | `Last step:` line [M] | Say |
|---|---|---|---|---|
| 1 | `push` | `Marking: locked · coins = 0, paid = false` | `Last step: push: discarded, tp false` | "push is discarded: the guard of tp reads paid, and paid is false." |
| 2 | `coin` | `Marking: locked · coins = 1, paid = false` | `Last step: coin: tc (locked → locked) fired` | "The action adds one coin." |
| 3 | `push` | `Marking: locked · coins = 1, paid = false` | `Last step: push: discarded, tp false` | |
| 4 | `coin` | `Marking: locked · coins = 2, paid = true` | `Last step: coin: tc (locked → locked) fired` | "Two coins. paid becomes true through its equation." |
| 5 | `push` | `Marking: unlocked · coins = 0, paid = false` | `Last step: push: tp (locked → unlocked) fired` | "tp fires and resets coins." |
| 6 | `push` | `Marking: locked · coins = 0, paid = false` | `Last step: push: tu (unlocked → locked) fired` | |
| 7 | `coin` | `Marking: locked · coins = 1, paid = false` | `Last step: coin: tc (locked → locked) fired` | |
| 8 | `coin` | `Marking: locked · coins = 2, paid = true` | `Last step: coin: tc (locked → locked) fired` | |
| 9 | `coin` | `Marking: locked · coins = 3, paid = true` | `Last step: coin: tc (locked → locked) fired` | |
| 10 | `coin` | `Marking: locked · coins = 3, paid = true` | `Last step: coin: tc (locked → locked) halted the run` | "A fourth coin leaves the domain. The run halts on the last good state." |

- After step 5 only `push` is on: `coin(off)`, `stop(off)` [M].
- After step 10 the halt line reads `Halted: coins of demoESM would be 4, outside its domain.` and every event is
  off [M]. The panel shows it whole on two lines [M, P-2026-09-27-2225]; `Last step:` is cut at `halted the r…`,
  its title is the whole line [M, P-2026-09-27-2105: 264 px of text in 262].
- The hover title of `Last step:` adds the writes, e.g. after step 4 `assignments: demoESM.coins = 2` and
  `derived: demoESM.paid = true` [M].

**Say** "The halt names the attribute, the element and the value."

### 2.4 Flowchart B

**Metamodel `DemoFlowB`** (builder).
- `ActivityNode`, concrete, as measured in Flow B. `InitialNode`, `Activity`, `Decision`, `Fork`, `Join`,
  `FinalNode` extend `ActivityNode`.
- `ControlFlow`: `source` → `ActivityNode`, `target` → `ActivityNode`, `guard: Expression`, `effect: Action`, upper
  bound many.

An abstract `ActivityNode` binds too (G5 closed, Flow A and C), but no run was measured with it and `FinalNode`
together. <!-- not measured: abstract ActivityNode with FinalNode and the explicit complement -->

**Model `demoFlowB`.** `i0 : InitialNode`, `work : Activity`, `d1 : Decision`, `fk : Fork`, `left : Activity`,
`right : Activity`, `jn : Join`, `fin : FinalNode`.

| Flow | `source` | `target` | `guard` | `effect` |
|---|---|---|---|---|
| `f1` | `i0` | `work` | | |
| `f2` | `work` | `d1` | | `model.[count] := model.[count] + 1` |
| `f3` | `d1` | `work` | `model.[count] < 2` | |
| `f4` | `d1` | `fk` | `model.[count] >= 2` | |
| `f5` | `fk` | `left` | | |
| `f6` | `fk` | `right` | | |
| `f7` | `left` | `jn` | | |
| `f8` | `right` | `jn` | | |
| `f9` | `jn` | `fin` | | |

**Apply** (tab `DemoFlowB`).
1. Click `Configure…`, then `Flowchart / Activity`, then `Continue` [M, P-2026-09-27-2105]. The dialog reads
   `Checkable` and `10 of 13 roles matched` [M]: Node `ActivityNode`, Initial `InitialNode`, Transition
   `ControlFlow`, Source `ControlFlow.source`, Next state `ControlFlow.target`; in Optional, folded, Terminal
   `FinalNode`, Fork `Fork`, Join `Join`, Guard `ControlFlow.guard`, Action `ControlFlow.effect` [M].
   **Say** "The same binder, on a control-flow shape: fork and join are roles too."
2. Apply, in the dialog, with no declaration. The summary reads `Flowchart / Activity · Checkable`, the declarations
   line in view [M]. The panel is 198.5 px at 752.5 [M, P-2026-09-27-2105].

Count: 4 clicks, no keystroke; the optional Reset below, 1 click; the declaration, 6 interactions and 10
keystrokes; the run, 7 clicks [M, P-2026-09-27-2105].

**Optional: Reset before declaring** (tab `demoFlowB`): `1 defect: f2 action (undeclared 'count' on demoFlowB).`
and `Marking: i0` [M].

**Declaration** (tab `DemoFlowB`). Click `Add attribute` in the summary line: the dialog opens on Data, its own `Add
attribute` in view and focused [M, P-2026-09-27-2105]. Click it; row 1's name is selected: `count`, Enter. Scroll
the dialog body to its end [M 728-760 > 735]. Domain `range`; click the maximum, `3`, Enter; click the initial
value, `0`, Enter. Apply, in the dialog: the declarations line is gone [M]. 6 interactions: 1 hint, 1 `Add
attribute`, 1 select choice, 2 cells, 1 Apply; 10 keystrokes; 1 scroll [M, P-2026-09-27-2105].
**Say** "count, from 0 to 3, starts at 0."

**Run** (tab `demoFlowB`). Reset: `Marking: i0 · count = 0`, `Last step: Reset` [M]. No choice list opens in this
run [M].

| # | Click | `Last step:` line [M] | `Marking:` line after [M] | Say |
|---|---|---|---|---|
| 1 | ▶ | `Last step: ε: f1 (i0 → work) fired` | `Marking: work · count = 0` | "One token, one step at a time." |
| 2 | ▶ | `Last step: ε: f2 (work → d1) fired` | `Marking: d1 · count = 1` | "The edge action increments count." |
| 3 | ▶ | `Last step: ε: f3 (d1 → work) fired` | `Marking: work · count = 1` | "count is below 2: back to work." |
| 4 | ▶ | `Last step: ε: f2 (work → d1) fired` | `Marking: d1 · count = 2` | |
| 5 | ▶ | `Last step: ε: fk (d1 → left, right) fired` | `Marking: left, right · count = 2` | "The decision edge and the fork fire as one transition. Two tokens." |
| 6 | ▶ | `Last step: ε: jn (left, right → fin) fired` | `Marking: fin · count = 2` | "The join takes both. The token reaches the final node." |

After step 6 the status reads `Terminated` and ▶ is disabled [M]. The hover title of `Last step:` after step 2 adds
`assignments: demoFlowB.count = 1` [M].

**Two variants run the same** [M, P-2026-09-27-1738]. With the final class named `ActivityFinal` (G6, closed by E1),
Apply proposes `Activity final → ActivityFinal` in place of `Terminal → FinalNode`. With `f4` guarded `else` in place
of `model.[count] >= 2` (G7, closed by E1), Reset lists only the `count` defect before the declaration and none after
it. Each variant alone gives the six steps above line for line and `Terminated` at step 6. The script keeps
`FinalNode` and the explicit complement. <!-- not measured: the two variants through the dialog; the lines above are
the panel's Profile and Apply, P-2026-09-27-1738 -->

---

## 3. Script constraints

- **Petri: read `Proposed 4.` under Bound in the dialog before Apply.** The proposal explores every model of
  `DemoPetri` (R-SIM-81(1), amended by E2), and one model that does not close sends it back to the largest initial
  marking, with a reason that says so. The project holds `demoNet` alone, as the builder makes it. If the Bound row
  reads a lower number, type 4 over it before Apply: click the cell, Cmd+A, `4`, 1 click and 2 keystrokes; a click
  alone leaves the caret after the digit, `45` [M, P-2026-09-27-2105, typed with 5 over the stored 4, then Cancel].
  With `Bound → 4`, taking `t1` twice before `t2` reads `Marking: lock, p2 ×4` at step 2 and the run goes on
  to `Deadlock` at step 4, no `unsafe` halt [M, P-2026-09-27-1738]; under Bound 2 the readiness run halted `unsafe`
  at step 2.
- **Flowchart: `FinalNode` and the explicit complement are the script's model, no longer a constraint.** E1 lifted
  decision E: the engine reads the activity final (G6, R-SIM-83) and resolves `[else]` on the edge into a Fork or out
  of a Join (G7, R-SIM-84). `ActivityFinal` and `[else]` into the Fork each run the scene of §2.4 to `Terminated`
  [M, P-2026-09-27-1738]. `[else]` into a Join or out of a Fork is the compile defect `else-position`
  (R-SIM-84). <!-- not measured: [else] out of a Join; else-position in the panel -->
- **Initial and Final as classes.** A4, ratified: a boolean flag binds as `none`, with its reason.
- **Undo right after Apply, with the focus in the editor: click the empty canvas first, never a node.** From the
  first report's risk 4: with the focus on the page body Control+z does nothing, and after a node click it reverts
  the selection first [M].
- **Reset starts the run: before Reset every input is off.** From the first report's risk 6 [M].
- **Each preset as the builder draws it (§2), from an empty bag.** Every other shape or order is unmeasured.

---

## 4. Risks and what to say if they show

- **The canvas contradicts the panel on Petri during a run** (G3, canvas side). The `tokens` slots show the model's
  values: after step 4 `p1 : Place` reads `tokens 2` under `Marking: p2 ×2, p3` [M]. Point at the panel line.
  **Say** "The panel shows the run. The canvas shows the model; the run on the canvas comes after MODELS."
- **`∅` reads like `ø` at 11-12 px** in `t3 (lock → ∅)` [M]. **Say** "t3 has an empty postset."
- **Declaration targets below the dialog body's fold** at 1600×1000: row 1's second line, 728-760 against the
  body's 735, on ESM and Flow B, and row 2's second line, 743-775, on ESM [M, P-2026-09-27-2105]. Scroll the dialog
  body to its end before Domain and before the equation, as §2.3 and §2.4 say. The summary line's `Add attribute`
  brings the dialog's own button into view and focuses it [M].
- **The hint path through the dialog is measured on ESM and on Flow B** by P-2026-09-27-2105 on 3024 (headless,
  1600×1000, one fresh page per scene): every value of §2.3 and §2.4 holds [M]. The RC-23 browser check re-reads the
  below-the-fold positions before the freeze. Rehearse §2.3 and §2.4 on 3001 before the freeze. If a target is out
  of view, scroll the dialog body.

---

## 5. Out of the demo

- The canvas side of G3: token counts and σ on the nodes (the R-SIM-4 view lane).
- The `.smv` exporter.
- The modal lane is no longer out: the demo walks the Simulation roles dialog (R-SIM-85).
- The outputs profiles (Moore, Mealy).
