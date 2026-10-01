# Discovery — demo readiness, second measurement on the trunk with R1, R2 and R3 (MODELS 2026-10-04)

- Prompt-ID: `P-2026-09-27-1235` (chat `C-2026-09-27-1140`)
- Prompt file: `docs/prompts/claude_2026-09-27_1235_prompt_discovery_sim_demo_readiness_2.md`
- Session: `aa601490-4580-41d6-a810-07b13572f2ab`
- Tree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `e1cefcfbc` (parent `72177a866`, the Status flip of the
  `sim-r3-face` merge `342707779`). `git log --oneline -30` holds `766b9643c` (R3), `86401f845` (R2), `cda1fdb4e`
  (R1); `7455d0075` (G4) is further down. `git status` was empty apart from gitignored files at the start.
- Executor: Opus 5.5 (session banner)
- Read-only. No source file was edited. A dev server of this tree ran on **3011** (`strictPort`) and was stopped at
  the end.
- First report: `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` (`567dc25da`, measured on `ee1b7bfc8`),
  called «the first report» below. It is not edited: this one refers to it.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[M]** measured in this phase on the working tree of `e1cefcfbc`, by the probes of
§12; **[R]** read in a file or doc of the same HEAD; **[R1]** a reading of the first report, on `ee1b7bfc8`, quoted
for comparison.

---

## 0. Answer in brief

- **Nothing on the demo path is demo-critical any more.** On the trunk, with R1, R2 and R3 merged, the four
  presets run on the first report's scenarios with no gap that the demo script cannot avoid.
  - **State machine (PEST shape):** the event buttons read `coin`, `push`, `stop`. Ten inputs reach `Terminated`,
    and «Last step» names the event (G1 closed).
  - **Petri net (P/T):** Apply proposes `Bound → 2` and binds Guard. Reset is clean, and the M1 face shows
    `Marking: lock, p1 ×2` for the whole run. The choice list opens above the buttons, and Step's top stays at
    854.5 on all five conflicts (G2, G3 panel side, G4, G8, G11 closed).
  - **Extended state machine:** after Apply the summary reads «Declare the state attributes the actions write: Add
    attribute», with the button in view. The marking line carries σ, e.g. `Marking: locked · coins = 2, paid =
    true`. The undeclared-action halt no longer shows `JjelEvaluationError:` (G9, G10 closed).
  - **Flowchart / Activity:** the natural shape with an abstract `ActivityNode` now reads «Checkable» (G5 closed).
    The two engine gaps are still open, as decision E put them after MODELS: `ActivityFinal` ends in `Deadlock ·
    nothing enabled` (G6), and `[else]` into a Fork is a parse-error defect (G7). Flow B still runs to `Terminated`
    in 6 steps.
- **Of the 11 gaps of the first report, 9 are measured closed and 2 are measured open (G6, G7).** Of the 9, G3 is
  closed on the panel side only: the canvas `tokens` slot still shows the model's value, after MODELS by decision.
- **3 new gaps, none demo-critical:**
  - G12: the Bound proposal is a lower bound, so Petri run A halts `unsafe` at step 2 under k = 2.
  - G13: the choice list header paints the input as `Ε`, U+0395, which reads as a Latin E.
  - G14: the Profile select clips «Extended state machine», and it already did on `ee1b7bfc8`.
- **Recommendation: no lane is needed before the freeze.** Five script constraints still hold (§8). G13 and G14
  are a fast polish lane if Alfonso wants them before 2026-10-01 evening (§10).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Every closure the three lanes measured on their own branches reproduces on the trunk, with the first report's probes | **holds** | G1, G2, G5, G8, G9, G10, G11 read the same values as the lane bodies (§4, §5) [M] |
| H2 | R2 and R3, both in `SimulationPanel.tsx`, do not disturb each other or the first report's geometry | **holds** | the M2 hint (R2) and the M1 marking line (R3) render in their faces. Step's top is 854.5 on Petri and Flow and 798.5 on SM and ESM, the first report's values (§4) [M] |
| H3 | Each of the four presets binds a metamodel drawn the natural way with one Apply and reads «Checkable» | **holds** | Petri, SM, ESM, and Flow A (abstract `ActivityNode`): «Checkable» after Apply (§4) [M] |
| H4 | After Apply, Reset gives a clean run with no further configuration | **partly** | clean on SM and Petri. Under k = 2, Petri halts `unsafe` if `t1` fires twice (G12). ESM and Flow need the declarations, which the hint now asks for. Flow A has the `else` defect (G7) (§4) [M] |
| H5 | Ten Steps reach an end state the demo expects | **partly** | SM, Flow B `Terminated`; Petri B `Deadlock · ε: t2 false`; ESM `Halted` on the domain by design; Petri A `Halted: unsafe` (G12); Flow A and C `Deadlock` (G7, G6) (§4) [M] |
| H6 | The texts the audience reads name elements, never ids | **holds** | SM `"events":["coin(off)","push(off)","stop(off)"]`, `Last step: push: t3 (locked → locked) fired` (§4.3) [M] |
| H7 | No panel state moves Step's top during a run | **holds** | 854.5 before the press and while the list is open on all 5 Petri conflicts, list bottom 826 above actions top 850.5 (§4.1). The reasons list, opened by the user, still moves it to 830 [M] |
| H8 | A run shows its state (marking counts, σ) on screen | **partly** | the panel shows it at every step (§4). The canvas does not: in `petri_2_after_run.png` `p1` reads **2** while the marking line reads `Marking: p2 ×2, p3` [M] |
| H9 | One undo reverts Apply on every preset | **holds, with the known focus limits** | with the focus in the editor, Petri and ESM go from 11 keys to 0 and SM goes to `{}`. With the focus on the body, Petri `lenBefore 2, lenAfter 2`. After a node click the undo reverts the selection (§4.5) [M] |

---

## 2. Objective

Measure the four demo scenarios of the first report together, on the trunk, with R1, R2 and R3 merged and
interacting in `SimulationPanel.tsx`. Use the same probes and the same scenarios, with readers extended to what the
lanes changed. Then say, gap by gap, whether each of G1..G11 is closed, open or not re-measurable, and whether
anything remains demo-critical before the freeze of 2026-10-01 evening.

---

## 3. Setup

- **Probes.** The eight `frontend/scripts/smoke/_tmp_demo_*` files of this tree were copied as `_tmp_demo2_*` by one
  `sed` (names, port 3007 → 3011, scratch `/tmp/p1015_scratch` → `/tmp/demo2_scratch`, screenshots →
  `~/.jjodel-lanes/shots_readiness2/`). The scenarios are the first report's §3, unchanged: the builder
  `_tmp_demo2_scenario.js` is a verbatim copy apart from its header, and every click and every input is the same.
  The lanes' `_tmp_r*_` probes were not used.
- **Readers added** (`_tmp_demo2_common.ts`, marked `P-2026-09-27-1235 readers`):
  - `readM1` gains the following:
    - `marking` (text, title, clamped) of `.sim-panel__hint--marking`;
    - `halt` and `lastStep` (text, title);
    - `choiceSection`;
    - `choiceGeom`: list top and bottom, the actions' top, Step's top, `listAboveButtons`;
    - `order`: the classes of the body's children, in DOM order;
    - `choiceSectionPaint`: `text-transform`, the painted text, the input symbol's code point.
  - `readM2` gains the following:
    - `declare`: the hint text and whether its «Add attribute» lies inside the body box;
    - `declAdd`: the same test for the table's own add control;
    - `selectFit`: the shown profile name measured with the select's font, against its content box.
  - The probes log these readings on every step. They also log `stepTopBefore` (Step's top before the press) and
    `SIMBOUND applied` after Apply. They take panel-only screenshots as well (`*_panel.png`).
- **Server.** `_tmp_demo2_vite.config.ts` merges `vite.config.ts` with port 3011, `strictPort`, cache in
  `/tmp/demo2_scratch`. The port was free before the start (`lsof -iTCP -sTCP:LISTEN` listed 3000, 3001, 3003 only).
  It answered 200 on the second try, and `lsof -iTCP:3011 -sTCP:LISTEN` then listed the node listener. At the end,
  the same command exited 1: stopped.
- **Page, builder, driving:** as the first report §3. The page is RowViewSmoke with the `seed`, headless Chromium at
  1600×1000, and every bag starts empty. Build times were 13.7 to 15.9 s.
- **Console.** Each probe run logged one console error, `failed to get project {project: null}`, the known C1
  ticket.

---

## 4. The four scenarios

### 4.1 Petri net (P/T) [M] (`_tmp_demo2_petri.ts`, exit 0)

**Apply.** «Petri net (P/T) · Checkable after Apply», ten proposals (the first report: eight):

```
["Node → Place","Initial marking → Place.tokens","Bound → 2","Transition → Transition","Arc → Arc","Arc source → Arc.src",
 "Arc target → Arc.tgt","Arc weight → Arc.weight","Inhibitor arc → InhibitorArc","Guard → Transition.guard"]
Bound → 2. The largest initial marking on the models of this metamodel        (title)
```

- After Apply the summary reads «Petri net (P/T) · Checkable». The groups fold (`groups: []`, top 793.5, height
  157.5, as in the first report), and `undoable` goes from 0 to 1.
- `SIMBOUND applied {"simBound":"2"}`. The bag holds 11 keys, `simGuard` among them.

**Run A, Reset right after Apply.**

```
A reset {"lines":[{"text":"Marking: lock, p1 ×2",...},{"text":"Last step: Reset",...}],
         "run":{"marking":{"p1":2,"lock":1},"bound":2,"netDefects":[]}}
A STEP 1 choice ["t1 (p1 → p2 ×2)","t3 (lock → ∅)"] → "Marking: lock, p1, p2 ×2", "Last step: ε: t1 (p1 → p2 ×2) fired"
A STEP 2 choice ["t1 (p1 → p2 ×2)exceeds bound 2","t3 (lock → ∅)"] (first candidate taken)
         → "Halted: unsafe. p2 would hold 4 tokens; the bound is 2."
           "Last step: ε: t1 (p1 → p2 ×2) halted the run"; the marking line keeps "Marking: lock, p1, p2 ×2"
A STEP 3..10  Step disabled, the same three lines
```

The first report's `1 defect: p1 (initial marking 2: an integer in 0..1 is required).` is gone. The halt at step 2
is G12 (§5).

**Fixed through the panel.** Two writes: Configure…, then Bound = 4. The probe's third interaction re-selects
`Transition.guard` in Guard (`GUARD options ["=Select an attribute","USER_118=Transition.guard"]`). It writes
nothing: `undoable` is 2 before the undo (§4.5), against 3 in the first report. «M2 fixed» reads `"lines":[]`,
where the first report read «Set but off: Guard.» The M1 face shows «Run interrupted: the model changed. Reset to
run again.» The groups unfold to top 127 and height 824 (the first report: 102.5 and 848.5), with no scroll.

**Run B.** Reset gives `{"p1":2,"lock":1}`, bound 4, `netDefects: []`, and «Marking: lock, p1 ×2».

| Step | choice list (Step's top before → with the list) | marking line after | «Last step» |
|---|---|---|---|
| 1 | `t1 (p1 → p2 ×2)`, `t3 (lock → ∅)` (854.5 → 854.5) | `Marking: lock, p1, p2 ×2` | `ε: t1 (p1 → p2 ×2) fired` |
| 2 | same (854.5 → 854.5) | `Marking: p1, p2 ×2` | `ε: t3 (lock → ∅) fired` |
| 3 | `t1 (p1 → p2 ×2)`, `t2 (p2 ×2 → p3)` (854.5 → 854.5) | `Marking: p1, p3` | `ε: t2 (p2 ×2 → p3) fired` |
| 4 | none | `Marking: p2 ×2, p3` | `ε: t1 (p1 → p2 ×2) fired` → `Deadlock · ε: t2 false`, title `ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]` |
| 5..10 | Step disabled | unchanged | unchanged |

- The marking line equals the run's marking read from `getSimRun` at every step: for example, step 4
  `{"p3":1,"p2":2}`.
- The list's geometry is identical on all five conflicts (A 1-2, B 1-3):
  `{"listTop":747.4,"listBottom":826,"actionsTop":850.5,"stepTop":854.5,"listAboveButtons":true}`.
- The body order with the list open is
  `["section","choices","hint.hint--line.hint--marking[…]","actions","hint.hint--line[Last step: …]","status"]`.
  Before Reset there is no marking line (`"order":["actions","status"]`); the same probe reads it after Reset.
- The list header: `{"textTransform":"uppercase","painted":"CHOOSE A TRANSITION (Ε)","symbol":"Ε","codePoint":"U+0395"}`
  on all five conflicts (G13).
- Opening the reasons list moves Step's top from 854.5 to 830. The first report read the same move; it is started
  by the user.

**Screenshots.**
- `petri_3_choice_open_panel.png` shows the list above the Marking line and the buttons, and the header «CHOOSE A
  TRANSITION (E)».
- `petri_2_after_run.png`: the panel reads «Marking: p2 ×2, p3» and «Deadlock · ε: t2 false», while on the canvas
  `p1 : Place` still shows `tokens 2` and `p2`, `p3` show `—`. This is G3's canvas side.

### 4.2 Flowchart / Activity [M] (`_tmp_demo2_flow.ts`, `FLOW=flowA|flowB|flowC`, exit 0 each)

**A, the natural shape (abstract `ActivityNode`, `ActivityFinal`, `[else]`).**
- Before Apply: «Flowchart / Activity · Checkable after Apply» (the first report: «Not checkable after Apply»,
  «Missing: Node.»). Ten proposals, `Node → ActivityNode` first, with the title «Node → ActivityNode. The type of
  Next state; ActivityNode is abstract: its instances are its subclasses'». `Activity final → ActivityFinal` is
  still among them.
- After Apply the summary reads «Checkable», the groups fold, and the bag has `simActivityFinal` and no
  `simTerminal`.
- The summary line reads «Declare the state attributes the actions write: Add attribute»:
  `"declare":{"top":896,"bodyTop":791,"bodyBottom":950,"inView":true}`.
- The Node select lists `ActivityNode`:
  `["Select a metaclass","Activity","ActivityFinal","ActivityNode","ControlFlow","Decision","Fork","InitialNode","Join"]`.
- Reset without declarations: `2 defects: f4 guard (parse error 1:1 Expected expression); f2 action (undeclared
  'count' on demoFlow).` plus «Marking: i0».
- After the declaration (6 interactions, as in the first report) the hint is gone (`"lines":[]`).
- The run:

```
M1 reset  "1 defect: f4 guard (parse error 1:1 Expected expression)."  "Marking: i0 · count = 0"
STEP 1..3 f1, f2 (count = 1), f3 fired; "Marking: work · count = 0" → "Marking: d1 · count = 1" → "Marking: work · count = 1"
STEP 4    "Deadlock", "· ε: f3 false; f4 defect, parse error 1:1 Expected expression"; "Marking: d1 · count = 2"
```

**B, the workaround.** The same «Checkable after Apply» with ten proposals, `Terminal → FinalNode` among them, and
the bag `final: ["fin"]`. Steps 1..6 are the first report's, now with the marking line:
`… "Marking: left, right · count = 2"` at step 5, then `"Terminated"`, `"Marking: fin · count = 2"`, `"Last step:
ε: jn (left, right → fin) fired"` at step 6.

**C, A with the explicit complement.** Steps 1..5 are as in B. Step 6 gives `"Deadlock"`, `"· nothing enabled"`,
`"Marking: fin · count = 2"`, with `final: null` (G6). Screenshot: `flowC_2_after_run_panel.png`.

In all three variants Step's top stayed at 854.5 before and after every press. Presses took 63 to 76 ms.

### 4.3 State machine, PEST shape [M] (`_tmp_demo2_sm.ts`, exit 0)

- Apply: seven proposals, the first report's. «State machine · Checkable», the groups fold, `undoable` goes from 0
  to 1, and the bag holds 8 keys.
- `M1 open {"events":["coin(off)","push(off)","stop(off)"], "order":["actions","section","events","status"]}` (the
  first report: `"…_136(off)","…_137(off)","…_138(off)"`).
- Reset: «Marking: locked», «Last step: Reset», Step's top 798.5, panel top 724, height 227.
- The ten inputs push, coin, coin, push, coin, push, push, coin, push, stop fire the expected transitions. Each
  «Last step» names the event: `push: t3 (locked → locked) fired`, `coin: t1 (locked → unlocked) fired`, … `stop: t5
  (locked → off) fired`.
- The marking line alternates `Marking: locked` / `Marking: unlocked` and ends `Marking: off`, `Terminated`, every
  button off. Step's top is 798.5 at all eleven readings.
- Screenshot: `sm_2_after_run_panel.png`.

### 4.4 Extended state machine [M] (`_tmp_demo2_esm.ts`, exit 0)

**Apply.** Ten proposals, the first report's. «Checkable», the groups fold, and the bag holds 11 keys. The hint
«Declare the state attributes the actions write: Add attribute» is in view: `"declare":{"top":896,"bodyTop":791,
"bodyBottom":950,"inView":true}`. Screenshot: `esm_1_after_apply_panel.png`.

**Reset before the declarations.** The defects line is unchanged: `2 defects: tc action (undeclared 'coins' on
demoESM); tp action (undeclared 'coins' on demoESM).`. Then coin:

```
"Halted: the transition action of tc failed: 'coins' is not a state attribute of demoESM."
  title: "… demoESM. [model.[coins] := model.[coins] + 1]"
"Last step: coin: tc (locked → locked) halted the run"
```

The first report's line read `… failed: JjelEvaluationError: 'coins' is not …`. The halt line is present in the
same reading, so the prefix's absence is read on a line that exists.

**Declarations (the first report's path, unchanged).** 10 interactions through Configure… With the groups open, the
summary hint stays in view (`"top":210,"bodyTop":105,"inView":true`). The table's own add control is still below the
fold (`ADD button {"addTop":992,"bodyBottom":950,"inView":false}`; the first report read 951 and 950). The probe does
not click the hint's button, since the scenario is unchanged. R2 measured that click on its branch
(`{"addTop":926,"bodyBottom":950,"inView":true}`, body of `86401f845`).

**The run.** Reset gives «Marking: locked · coins = 0, paid = false».

| # | input | marking line after | «Last step» |
|---|---|---|---|
| 1 | push | `Marking: locked · coins = 0, paid = false` | `push: discarded, tp false` |
| 2 | coin | `… coins = 1, paid = false` | `coin: tc (locked → locked) fired` |
| 4 | coin | `Marking: locked · coins = 2, paid = true` | tc fired |
| 5 | push | `Marking: unlocked · coins = 0, paid = false` | `push: tp (locked → unlocked) fired` |
| 6 | push | `Marking: locked · coins = 0, paid = false` | `push: tu (unlocked → locked) fired` |
| 9 | coin | `… coins = 3, paid = true` | tc fired |
| 10 | coin | `Marking: locked · coins = 3, paid = true` (the σ it halted on) | `coin: tc (locked → locked) halted the run`, halt `Halted: coins of demoESM would be 4, outside its domain.` |

- Step's top is 798.5 through all readings.
- The assignments and derived values remain in the «Last step» title as well (`assignments: demoESM.coins = 2` /
  `derived: demoESM.paid = true`).
- Screenshot: `esm_3_sigma_panel.png` (input 4).

### 4.5 Undo [M] (`_tmp_demo2_undo2.ts`, `_tmp_demo2_undo.ts`, exit 0 each)

- **After Apply, focus on the empty pane.**
  - Petri `{"keysApplied":11,"len":1,…,"lenAfterUndo":0,"keysAfterUndo":0}`, and Control+y gives back 11 keys.
  - ESM behaves the same, 11 keys to 0.
  - Meta+z undoes in headless Chromium on both.
  - SM (in `_tmp_demo2_sm.ts`, after a click at 700,500): `BAG after Control+z {}`. The M1 face then reads
    «Simulation not configured. Missing on DemoPEST: Initial or Initial marking, Owned transitions or Source, Next
    state.»
- **Focus on the body.** The Petri probe blurs, then presses Control+z: `{"lenBefore":2,"lenAfter":2,"changed":[]}`.
  The control is the pane-focused undo above, which reverts the same kind of write.
- **After a node click.** `NODE click {"before":0,"after":1}`: the entry is an `isSelected` change titled
  `demoESM.locked.transitions.tc.effect.values`. In `_tmp_demo2_undo.ts`, Control+z after a click that selected a
  node gives `lenBefore 4 → lenAfter 3` and leaves the declaration unchanged. The next Control+z, with the focus on
  the editor, reverts the name write (`coins` → `x1`).
- **One undo after more writes (Flow A, B, C).** It reverts the table's initial value only (`0` → `false`), as in
  the first report.

These are the first report's four behaviours, unchanged.

---

## 5. Gaps

Columns `first report` and `now` are the verdict on `ee1b7bfc8` and on `e1cefcfbc`. `closed by` is the sha of the
commit that closes the gap; «—» means open.

| # | Preset | Gap (first report) | first report | now | closed by | Evidence now [M] |
|---|---|---|---|---|---|---|
| G1 | SM | Event buttons and «Last step» show `…_136` | open, **demo-critical** | **measured-closed** | `cda1fdb4e` | `"events":["coin(off)","push(off)","stop(off)"]`; `Last step: push: t3 (locked → locked) fired`; `objectSlots.ts:74-75` `const name = lookup[objectId]?.name;` / `if (typeof name === 'string' && name.trim()) return name.trim();` |
| G2 | Petri | k stays 1: `initial-over-bound`, `p1` starts empty | open, **demo-critical** | **measured-closed** (see G12) | `86401f845` | `Bound → 2`, `SIMBOUND applied {"simBound":"2"}`; Reset `{"p1":2,"lock":1}`, `"bound":2,"netDefects":[]`; `modelMarkings.ts:27` `export function largestInitialMarking(` |
| G3 | Petri, ESM, Flow | Token counts and σ not on screen | open, **demo-critical** | **measured-closed on the panel**; canvas side open by decision (after MODELS) | `766b9643c` | a marking line at every step of every run, equal to `getSimRun`'s marking; `SimulationPanel.tsx:656` `marking: markingLine(r.config.state, r.net, lookup),`; canvas: `p1` reads `tokens 2` in `petri_2_after_run.png` |
| G4 | Petri | Guard `off` in the preset | closed on the trunk, read, not measured | **measured-closed** | `7455d0075` | `Guard → Transition.guard` among the proposals; `simGuard` in the bag after Apply; «M2 fixed» `"lines":[]`; B STEP 4 title `[p3.[tokens] < 1]`; `simProfiles.ts:140` `active: ['arcWeight', 'inhibitorArc', 'bound', 'terminal', 'guard']` |
| G5 | Flow | An abstract node superclass: «Missing: Node.» | open | **measured-closed** | `86401f845` | Flow A «Checkable after Apply» → «Checkable»; Node select lists `ActivityNode`; `profileBinder.ts:240` `// Control flow: Node and Transition may be abstract (R-SIM-81).` |
| G6 | Flow | `ActivityFinal` → `simActivityFinal`, never read by the engine | open | **measured-open** | — | Flow C STEP 6 `"Deadlock"`, `"· nothing enabled"`, `final: null`; control Flow B `final: ["fin"]` → `Terminated`. `command grep -rn -E 'simActivityFinal\|activityFinal'` over `model/simulation`, `components/editor-v2/sim` (tests excluded), exit 0: hits in `profileBinder.ts:195`, `simProfiles.ts:143`, `roleCatalog.ts` only; control `simTerminal` at `netCompile.ts:48`, `netTypes.ts:214` |
| G7 | Flow | `[else]` into a Fork: parse-error defect, the decision deadlocks | open | **measured-open** | — | Flow A `1 defect: f4 guard (parse error 1:1 Expected expression).`, STEP 4 `Deadlock · ε: f3 false; f4 defect, …`; control Flow B, C STEP 5 `fk (d1 → left, right) fired`; `netCompile.ts:259` `const plain = edges.filter(e => e.pseudoSource === null && e.pseudoTarget === null);` |
| G8 | Petri | The choice list below the buttons moves Step 854.5 → 751.9 | open | **measured-closed** | `766b9643c` | 854.5 before and with the list open, on 5 of 5 conflicts; `"listBottom":826,"actionsTop":850.5,"listAboveButtons":true` |
| G9 | ESM, Flow | «Checkable» with actions and no declarations; «Add attribute» below the fold | open | **measured-closed** (the hint path) | `86401f845` | the hint line after Apply on ESM, Flow A, B, C, its button `inView: true`; gone after the declarations. The click path is R2's reading, not re-run (§4.4); the table's own add control via Configure… is still `inView: false` |
| G10 | ESM | `JjelEvaluationError:` in an action-defect halt | open | **measured-closed** | `766b9643c` | `Halted: the transition action of tc failed: 'coins' is not a state attribute of demoESM.`; `simBridge.ts:465` `.replace(/^JjelEvaluationError: /, '')` |
| G11 | Petri | An empty postset reads `t3 (lock → )` | open | **measured-closed** | `766b9643c` | `t3 (lock → ∅)` in the list, `Last step: ε: t3 (lock → ∅) fired`; `simBridge.ts:513` `if (arcs.length === 0) return '∅';` |

**New gaps.**

Estimates: **fast** = one fast lane (hours); **after** = after MODELS.

| # | Preset | Layer | Gap | Evidence [M] | Fix sketch | Estimate | demo-critical |
|---|---|---|---|---|---|---|---|
| G12 | Petri | binder (Apply) | The Bound proposal is the largest initial marking, a lower bound. On the demo net the ×2 arc puts 4 tokens on `p2`, so with k = 2 the first candidate twice halts the run | A STEP 2 `"t1 (p1 → p2 ×2)exceeds bound 2"` offered, then `Halted: unsafe. p2 would hold 4 tokens; the bound is 2.`; R2's own ticket (log inbox, 2026-09-27 11:10) | a reachability bound (a bounded exploration of the net at Apply), or propose the initial maximum times the largest weight | after | **no**: the list marks the candidate before the press. The script sets Bound = 4 after Apply (Configure…, Bound: 2 interactions, as run B does), or follows t1, t3, t2, t1 (stays within 2 by arithmetic; not measured under k = 2) |
| G13 | Petri (every conflict) | panel style | The choice list header paints `(ε)` uppercased: «CHOOSE A TRANSITION (Ε)», Greek capital epsilon, which reads as a Latin E | `{"textTransform":"uppercase","painted":"CHOOSE A TRANSITION (Ε)","codePoint":"U+0395"}` on 5 of 5 conflicts; `petri_3_choice_open_panel.png`; `simulation-panel.scss:188` `text-transform: uppercase;`; R3's ticket | keep the input out of the transform (a span with `text-transform: none`), or write the header without the input | fast | no: cosmetic, but on screen at every Petri conflict |
| G14 | ESM | panel layout | The Profile select clips «Extended state machine» to «Extended state machin» at 1600×1000. The M3 lane recorded that it fits | `esm_1_after_apply_panel.png` shows «Extended state machin»; the first report's `esm_1_after_apply.png` (`ee1b7bfc8`) shows the same, so R1-R3 did not introduce it; control: «Petri net (P/T)» whole in `petri_1_after_apply.png`. The canvas reader said fit (`textW 125` against content box `137`, select 145 px) because it does not count the native arrow: the pixel is the measurement (CLAUDE.md §5) | a shorter row label or a narrower Apply; or the option text «Extended SM» with the full name in the title | fast | no: the summary line under it reads the full name |

**Counts.** First report: 11 gaps. Measured closed 9 (G1, G2, G3 on the panel, G4, G5, G8, G9, G10, G11); measured
open 2 (G6, G7, both after MODELS by decision E); not re-measurable 0. New 3 (G12, G13, G14), none demo-critical.
Demo-critical open: **0** (the first report: 3 open, G1, G2, G3).

---

## 6. What already works (do not touch before the freeze)

The first report's §6 rows all still hold [M]. Changes and additions:

| Area | Preset | Evidence [M] |
|---|---|---|
| Binder on the natural shapes | all four, Flow with an abstract node too | 10 / 10 / 7 / 10 proposals (Petri, Flow, SM, ESM), each with its `why` in the title |
| Apply is one write and one undo | all | `undoable` 0→1; one Control+z brings 11 keys to 0 (Petri, ESM) or 8 to `{}` (SM); Control+y restores |
| Fold after a Checkable Apply | SM, Petri: 157.5 px at 793.5; ESM, Flow: 198.5 px at 752.5 (the hint line) | the declarations hint adds one row, and the fold is otherwise the same |
| The M1 face for the audience | all | the marking line from Reset to the end of the run, σ after « · », kept through a halt; not clamped at 288 px in any reading (`"clamped":false`) |
| Layout of the lines | all | Step's top constant through Reset, defects, choice list, halt, marking and «Last step» (854.5 or 798.5) |
| Event labels | SM, ESM | by instance name without a `name` attribute (SM) and with one (ESM) |
| Performance | all | Apply 35-52 ms; a press 30-76 ms (handler plus two frames); `runSignature` 0.05 ms on the 278-entry lookup |

---

## 7. Risks

1. **The canvas contradicts the panel on Petri** (G3's canvas side). During the run the `tokens` slots show the
   model's values: in `petri_2_after_run.png` `p1` reads **2** under «Marking: p2 ×2, p3». The presenter should
   point at the panel line. The canvas side is the R-SIM-4 view lane, after MODELS.
2. **k = 2 after Apply** (G12). The demo net needs Bound 4 on screen, or a firing order that stays within 2.
   Otherwise the run halts `unsafe`. The halt is correct, and the list says «exceeds bound 2» first.
3. **Undo.** The first report's risk 4 is unchanged:
   - one Control+z after Apply works with the focus in the editor;
   - with the focus on the page body it does nothing;
   - after a node click it reverts the selection first.
4. **The hint's click path was not re-measured on the trunk.** This lane kept the ESM scenario's Configure… path.
   R2 measured the hint's button on `sim-r2-apply`, and R3 did not touch the M2 face. The residual risk is low, and
   Alfonso's visual check covers it.
5. **Glyphs at 11-12 px.**
   - `∅` in «t3 (lock → ∅)» renders close to `ø` in the panel font (`petri_3_choice_open_panel.png`).
   - `Ε` in the list header (G13).
   Both are for the visual check.
6. **The declarations table below the fold via Configure….** On ESM, `addTop 992 > bodyBottom 950` with the groups
   open. The hint's button is the path to use.
7. **Merge base.** This tree is the trunk after the R3 merge (`342707779`). Every reading here is of that code. A
   later trunk commit to `SimulationPanel.tsx` or `simBridge.ts` needs a re-run of these probes.

---

## 8. Recommendation

**Nothing remains demo-critical before the freeze of 2026-10-01 evening.** No lane is needed. The demo runs on the
four presets with these script constraints, which still hold:

- **Decision E (flowchart):** a flow final named `FinalNode` (or `Final`), not `ActivityFinal` (G6), and an explicit
  complement (`model.[count] >= 2`) instead of `[else]` into a Fork or a Join (G7). An abstract `ActivityNode` is
  now fine (G5 closed).
- **Initial and Final as classes (A4, ratified):** a boolean flag is `none` with its reason.
- **Undo right after Apply,** with the focus in the editor: click the empty canvas first, never a node.
- **Petri: Bound 4 after Apply** (Configure…, Bound; G12), or a firing order that never takes `t1` twice before `t2`.
- **Reset starts the run** (the first report's risk 6): before Reset every input is off.

Optional, not demo-critical: one fast polish lane for G13 (the header's `Ε`) and G14 (the clipped profile name).
It would touch `simulation-panel.scss` and perhaps `SimulationPanel.tsx`, is visual (RC-26), and would require
re-running these probes. It is Alfonso's call (§10).

After MODELS, unchanged from the first report: G6 (R-SIM-53 in the engine), G7 (`else` in fused transitions), G3's
canvas side (R-SIM-4), a reachability Bound (G12), the modal lane.

---

## 9. Decisions taken (unattended)

1. The scenarios are the first report's, byte for byte in the builder. The ESM declarations still go through
   Configure…, not the R2 hint, so G9's click path is R2's reading, not this lane's (§4.4, risk 4).
2. The readers were extended beyond the prompt's list by `choiceSectionPaint` and `selectFit`, to measure G13 and
   G14. That meant a second run of the Petri and ESM probes. The report quotes the second runs, whose readings on
   the first runs' fields are identical (§12).
3. «demo-critical» keeps the first report's test: does the demo, drawn the natural way, run and read correctly
   without a script workaround the presenter cannot absorb? G12 is judged «no» because the halt is correct and
   announced by the list, and one field on screen avoids it.
4. G3 is counted closed: R-SIM-82 scoped it to the panel, and the first report put the canvas side after MODELS.
5. G14 is judged on the pixels, against the canvas reader, following CLAUDE.md §5 («When a style and a pixel
   disagree, the pixel is the measurement»).

---

## 10. Decisions awaiting Alfonso (RC-26: what the demo shows)

- **G. Polish before the freeze:** a fast lane for G13 (the input symbol out of the uppercase header) and G14 (the
  profile name whole in the select)? Recommended: yes, if a slot is free before 2026-10-01 evening. Otherwise the
  demo is not affected.
- **H. Petri Bound on screen:** the script sets Bound = 4 after Apply, which shows the parameter. The alternative is
  a firing order that stays within the proposed 2. Recommended: Bound = 4 on screen.

---

## 11. Questions

1. Should the M1 line read «Marking: locked» on a state machine, or «State: locked»? R-SIM-82 fixed «Marking:» for
   all presets.
2. Should the demo show the canvas and the panel together during a Petri run? If so, risk 1 needs a line in the
   script.

---

## 12. Files and probes

**Read** (full paths under `/Users/alfonso/jjodel-sim/`):

Docs:
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md`: whole.
- `docs/decisions.md`: `:187-232` (RC-25..29), `:2107-2133` (R-SIM-80..82).
- `docs/PROTOCOL.md`: `:368-415` (P16).
- `docs/log-inbox/simulation.md`: whole.
- `docs/claude-code-log.md`: `:1-60`.
- the commit bodies of `cda1fdb4e`, `86401f845`, `766b9643c`.

Panel:
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: `:800-1099`, and grep of `className=` and
  `markingLine(`.
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: `:181-190`, `:281-284`, `:562-574`, and the diff
  `7455d0075..HEAD`.

Engine and helpers:
- `frontend/src/model/simulation/objectSlots.ts`: `:72-77`.
- `frontend/src/model/simulation/simProfiles.ts`: grep.
- `frontend/src/model/simulation/profileBinder.ts`: grep `abstract`, `:205-213`, `:240`.
- `frontend/src/components/editor-v2/sim/modelMarkings.ts`: grep.
- `frontend/src/components/editor-v2/sim/simBridge.ts`: grep `markingLine`, `JjelEvaluationError`, `∅`.
- `frontend/src/components/editor-v2/sim/simRoleStatus.ts`: grep `simBound`, `declareHint`.
- `frontend/src/model/simulation/netCompile.ts`: grep `plain`, `resolveElse`, `simTerminal`.

Rules:
- `frontend/src/components/editor-v2/CLAUDE.md`, loaded on entry.

**Probes.** They are gitignored under `frontend/scripts/smoke/_tmp_demo2_*` and kept on disk. They were run with
`npx tsx` from `frontend/`. Logs and exit files are in `/tmp/demo2_scratch/`.

| Probe | Run | Exit | Log |
|---|---|---|---|
| `_tmp_demo2_petri.ts` | 1st (readers of the prompt), 2nd (+ `choiceSectionPaint`, `selectFit`, panel shots) | 0, 0 | `petri.log` (2nd) |
| `_tmp_demo2_flow.ts` `FLOW=flowA` / `flowB` / `flowC` | once each | 0 / 0 / 0 | `flowA.log`, `flowB.log`, `flowC.log` |
| `_tmp_demo2_sm.ts` | once | 0 | `sm.log` |
| `_tmp_demo2_esm.ts` | 1st, 2nd (+ `selectFit`, panel shots) | 0, 0 | `esm.log` (2nd) |
| `_tmp_demo2_undo2.ts`, `_tmp_demo2_undo.ts` | once each | 0, 0 | `undo2.log`, `undo.log` |

- The Petri runs A and B and the ten ESM inputs read the same statuses, lines and marking in both runs.
- Other files: `_tmp_demo2_common.ts` (the readers), `_tmp_demo2_scenario.js` (the builder, unchanged),
  `_tmp_demo2_vite.config.ts` (3011).
- `/tmp/demo2_scratch/digest.js` prints the per-step readings of a log.

**Screenshots** (`~/.jjodel-lanes/shots_readiness2/`, light, 1600×1000):
- `petri_1_after_apply.png`, `petri_2_after_run.png`, `petri_2_after_run_panel.png`, `petri_3_choice_open.png`,
  `petri_3_choice_open_panel.png`;
- `flow{A,B,C}_1_after_apply{,_panel}.png`, `flow{A,B,C}_2_after_run{,_panel}.png`;
- `sm_1_after_apply.png`, `sm_2_after_run.png`, `sm_2_after_run_panel.png`;
- `esm_1_after_apply.png`, `esm_1_after_apply_panel.png`, `esm_2_after_run.png`, `esm_2_after_run_panel.png`,
  `esm_3_sigma_panel.png`.
