# Discovery — demo readiness of the four visible presets, end to end (MODELS 2026-10-04)

- Prompt-ID: `P-2026-09-27-1015` (chat `C-2026-09-26-1702`)
- Prompt file: `docs/prompts/claude_2026-09-27_1015_prompt_sim_demo_readiness_discovery.md`
- Session: `6238687b-b32c-431c-bbb3-960c81db1421`
- Tree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `ee1b7bfc8` (parent `0eaf477a8`, which carries C1, C2 and M3
  merged). `git status` was empty apart from gitignored files at the start.
- Executor: Opus 5.5 (session banner)
- Phase 1, read-only. No source file was edited. A dev server of this tree ran on **3007** (3000, 3001, 3003 held
  by other trees; 3002, 3004..3006 used by other lanes; 3007 was the first free port, checked with `lsof`). It was
  stopped at the end.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[R]** read in a file or doc of HEAD `ee1b7bfc8`; **[M]** measured in this phase on the
working tree of `ee1b7bfc8`, by the probes named in §12. Every measurement predates `7455d0075` (P-2026-09-27-0935,
Guard `edit` in the Petri preset), which is on the trunk and not on this branch.

---

## 0. Answer in brief

- **Two presets run end to end on a metamodel drawn the natural way; two need a script workaround or a lane.**
  - **State machine (PEST shape):** Apply proposes 7 roles, «Checkable», one undo. Ten event inputs run to
    `Terminated`. But the event buttons read `…_136`, `…_137`, `…_138` instead of `coin`, `push`, `stop` (G1).
  - **Extended state machine:** Apply proposes 10 roles, Guard, Action and Entry included. One stored and one derived
    declaration go in through the table in 10 interactions. The guard on the derived value gates the transition, and
    the domain halt reads well. It runs cleanly once Event has a `name` attribute.
  - **Flowchart / Activity:** the natural UML shape fails in three places:
    - an abstract `ActivityNode` gives «Not checkable · Missing: Node», with no select to fix it (G5);
    - an `ActivityFinal` is bound to a role the engine ignores, so the run ends in `Deadlock` (G6);
    - an `[else]` edge into a Fork is a parse-error defect, so the decision deadlocks (G7).
    With a concrete node class, a `FinalNode` and an explicit complement, it runs in 6 steps to `Terminated`, fork
    and join included.
  - **Petri net (P/T):** Apply proposes 8 roles, weight and inhibitor included. But k stays 1, so a place with 2
    tokens is a Reset defect and starts empty (G2). The guard was off before `7455d0075` (G4). With Bound 4 and
    Guard bound by hand it runs through three choice lists to `Deadlock · ε: t2 false`. The token counts are
    visible nowhere on screen (G3).
- **11 gaps, 4 demo-critical (G1, G2, G3, G4); G4 is already closed on the trunk by `7455d0075`.** Seven gaps are
  not demo-critical because the demo script can avoid them (G5, G6, G7) or they are polish (G8..G11).
- **Recommendation: three lanes before the freeze.**
  - R1 (fast): event labels fall back to the instance name.
  - R2 (fast): Apply completes the natural shapes: Bound from the models, an abstract Node if Alfonso agrees, and a
    declarations hint.
  - R3 (full, visual, RC-26): the M1 face shows the marking with counts and σ, and the choice list moves above the
    buttons.
  - `simulation-engine` takes the trunk first, for `7455d0075`.
  - Neither the outputs lane (R-SIM-76) nor the enum step B belongs in the list.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Each of the four presets binds a metamodel drawn the natural way with one Apply and reads «Checkable» | **partly** | SM, ESM, Petri: «Checkable» [M]; Flowchart with an abstract node class: «Not checkable · Missing: Node.» (§4.2) [M] |
| H2 | After Apply, Reset gives a clean run with no further configuration | **partly** | SM clean; ESM and Flowchart need the declarations (undeclared-target defect); Petri needs Bound (initial-over-bound) (§4) [M] |
| H3 | Ten Steps reach an end state the demo expects (`Terminated` or a named `Deadlock`) | **partly** | SM and Flowchart B `Terminated`; Petri `Deadlock · ε: t2 false`; ESM `Halted` on a domain bound by design; Flowchart A deadlocks on the `else` defect, Flowchart C on an ignored activity final (§4) [M] |
| H4 | The panel feeds events to a state machine through the Step button | **falsified** | Step is `Step (ε)` and stays disabled when every edge has a trigger. Events go through one button per instance, under «Events» (§4.3) [M] |
| H5 | The texts the audience reads name elements, never ids | **falsified** | event buttons and «Last step» read `…_137` when Event has no `name` attribute (§4.3) [M] |
| H6 | No panel state moves Step's top during a run | **falsified** | the choice list moves it from 854.5 to 751.9 (§4.1) [M]; the defects, halt and «Last step» lines do not (§4) [M] |
| H7 | One undo reverts Apply on every preset | **holds** | undoable 0→1 on Apply in all four; one Control+z empties the bag on SM, Petri, ESM (§4.5) [M]; Cmd+Z on the Mac verified by Alfonso on 3001 this morning (read in the 0935 prompt, not re-run here) |
| H8 | A run shows its state (marking counts, σ) on screen | **falsified** | the canvas has a boolean highlight only; σ is in the «Last step» title only (§4.1, §4.4) [M][R] |

---

## 2. Objective

Measure the four presets of the panel end to end on this tree, the way the MODELS demo would use them:
- the metamodel and model;
- Apply from the panel;
- Reset, ten Steps, the halts and the texts.

Then turn every point where the demo would not run as expected into a costed line, so the chat can decide which lanes
fit before the freeze proposed for 2026-10-01 evening.

---

## 3. Setup

- **Server.** `frontend/scripts/smoke/_tmp_demo_vite.config.ts` merges `vite.config.ts` with port 3007, `strictPort`
  and a cache in `/tmp/p1015_scratch`. It started with `npx vite --config ...` and answered 200.
- **Page.** Every probe opens the RowViewSmoke seed project with the `seed` of `states.ts`, in headless Chromium at
  1600×1000. This is the setup of `~/jjodel-gate` `_tmp_p0225_common.ts`, adapted into `_tmp_demo_common.ts`.
- **Builder.** `_tmp_demo_scenario.js` builds each metamodel and model through the store. It uses `createM2` and
  `createM1` from `Navbar.tsx`, then `addClass`, `addAttribute`, `addReference`, `addObject` and the slots, with the
  helpers of `_tmp_sim3b_scenarios.js`.
  - Every bag starts **empty**: the panel configures it.
  - Build times were 13.7 to 15.9 s per scenario.
- **Driving.** Apply, Reset, Step, the events and the choices are clicked in the DOM. The declarations are typed in
  the panel's table, as the C2 probe does. The run is read from `getSimRun` through the page's own module instance,
  as the M3 probe does.
- **Console.** Each probe run logged one console error, `failed to get project {project: null}`, the known ticket
  of C1.

**The scenarios.**

| Id | Metamodel | M1 |
|---|---|---|
| Petri | `PNode` (abstract) ← `Place{tokens:EInt}`, `Transition{guard:Expression}`; `Arc{src,tgt:PNode, weight:EInt}` ← `InhibitorArc` | `p1`(2) -a1→ `t1` -a2(×2)→ `p2` -a3(×2)→ `t2` -a4→ `p3`; `lock`(1) -a5→ `t3`; `lock` ⊸i1 `t2`; `t2` guard `p3.[tokens] < 1` |
| Flow A (natural) | `ActivityNode` (abstract) ← `InitialNode`, `Activity`, `Decision`, `Fork`, `Join`, `ActivityFinal`; `ControlFlow{source,target:ActivityNode, guard:Expression, effect:Action[0..*]}` | `i0`→`work`→(`count += 1`)`d1`; `d1`→[`count < 2`]`work`; `d1`→[`else`]`fk`; `fk`→`left`,`right`→`jn`→`fin` |
| Flow B (workaround) | as A, `ActivityNode` concrete, `FinalNode` for `ActivityFinal` | as A, the `else` edge written `model.[count] >= 2` |
| Flow C (isolates G6) | as A (abstract, `ActivityFinal`) | as B (explicit complement) |
| SM (PEST) | `State` ← `Initial`, `Terminal`; `State.transitions` (composition) → `Transition{nextState:State, event:Event}`; `Event` | `locked`(Initial), `unlocked`, `off`(Terminal); `coin`, `push`, `stop`; five transitions, two self-loops |
| ESM | SM + `Transition{guard:Expression, effect:Action[0..*]}`, `State{entry:Action[0..*]}`, `Event{name:EString}` | `tc`: locked -coin/`coins += 1`→ locked; `tp`: locked -push [`model.[paid]`]/`coins := 0`→ unlocked; `tu`: unlocked -push→ locked; `ts`: locked -stop→ off. Declarations `coins` (stored, 0..3, 0), `paid` (derived, `model.[coins] >= 2`) |

---

## 4. The four scenarios

### 4.1 Petri net (P/T) [M] (`_tmp_demo_petri.ts`, exit 0)

**Apply.** The select offers the four presets. «Petri net (P/T) · Checkable after Apply», eight proposals:

```
Node → Place · Initial marking → Place.tokens · Transition → Transition · Arc → Arc · Arc source → Arc.src
Arc target → Arc.tgt · Arc weight → Arc.weight · Inhibitor arc → InhibitorArc
```

- After Apply the summary reads «Petri net (P/T) · Checkable», and the groups fold (`groups: []`).
- The bag holds 9 keys, `simProfile: "petri"` included; neither `simGuard` nor `simBound` is among them.
- `undoable` went from 0 to 1.
- The panel's geometry: top 793.5, height 157.5.
- Default slots: the unset `weight` and `tokens` read `[]`, so an unset weight counts as 1 and an unset token count
  as 0. No spurious `bad-weight`.

**Reset right after Apply (run A).**

```
A reset {"status":"Running", "lines":[{"text":"1 defect: p1 (initial marking 2: an integer in 0..1 is required)."}, ...],
         "run":{"marking":{"lock":1}, "bound":1, "netDefects":["p1:initial-over-bound:..."]}}
A STEP 1 {"status":"Deadlock","reason":"· nothing enabled","lines":[..., {"text":"Last step: ε: t3 (lock → ) fired"}]}
```

- k is 1 (`simProfiles.ts:131` `params: { bound: 1, selector: 'list' },`).
- `p1` starts empty (`netCompile.ts:433`).
- The guard is not bound, so `t2` would run unguarded.
- One step fires, then the run is in `Deadlock`.

**Fixed through the panel.** Four interactions: Configure…, Bound = 4, open Data, Guard → `Transition.guard`.

- The summary then reads «Petri net (P/T) · Checkable» and «Set but off: Guard.».
- The M1 face shows «Run interrupted: the model changed. Reset to run again.».
- The groups unfold to top 102.5 and height 848.5, with no scroll.

**Run B.** Reset gives `{"p1":2,"lock":1}` and bound 4, with no defect.

| Step | choice list (Step's top with the list open) | fired | marking after |
|---|---|---|---|
| 1 | `t1 (p1 → p2 ×2)`, `t3 (lock → )` (751.9) | t1 | p1 1, lock 1, p2 2 |
| 2 | same (751.9) | t3 | p1 1, p2 2 |
| 3 | `t1 (p1 → p2 ×2)`, `t2 (p2 ×2 → p3)` (751.9) | t2 | p1 1, p3 1 |
| 4 | none | t1 | p3 1, p2 2 → `Deadlock · ε: t2 false` |
| 5..10 | Step disabled | — | unchanged |

- The weights move 2 tokens each way.
- The inhibitor holds `t2` until `t3` empties `lock`.
- The guard stops `t2` at the end, with the title `ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]`.
- Step's top is 854.5 with no list and **751.9 while the list is open (−102.6 px)**.
- Opening the reasons list moves Step's top to 830. That move is user-initiated.

**Screenshot `petri_2_after_run.png`.**
- `p2` and `p3` carry the `sim-active` highlight.
- Every `tokens` slot still shows the model's value: `p1` reads **2** although the run's marking holds nothing
  on `p1`.
- The run's counts appear nowhere but in the transition labels of the choice list and of «Last step».

### 4.2 Flowchart / Activity [M] (`_tmp_demo_flow.ts`, `FLOW=flowA|flowB|flowC`, exit 0 each)

**A, the natural shape.**

- Before Apply: «Flowchart / Activity · Not checkable after Apply», «Missing: Node.».
- Nine proposals: Initial → InitialNode, **Activity final → ActivityFinal**, Transition → ControlFlow, Source →
  ControlFlow.source, Next state → ControlFlow.target, Fork, Join, Guard → ControlFlow.guard, Action →
  ControlFlow.effect.
- No Terminal is proposed.
- After Apply: «Not checkable · Missing: Node.». The groups stay open (top 102.5, height 848.5), and the bag has
  `simActivityFinal`.
- The Node select lists `Activity, ActivityFinal, ControlFlow, Decision, Fork, InitialNode, Join`: `ActivityNode` is
  absent, so nothing on the panel fixes «Missing: Node».
- Reset before the declaration:
  `2 defects: f4 guard (parse error 1:1 Expected expression); f2 action (undeclared 'count' on demoFlow).`
- The declaration goes in with 5 interactions (Add, name, range, max, initial). Data was already open.
- The run:

```
STEP 1..3  f1 fired, f2 fired (count = 1), f3 fired
STEP 4     Deadlock · ε: f3 false; f4 defect, parse error 1:1 Expected expression
           title: ε: f3 (d1 → work) false [model.[count] < 2]; fk (d1 → left, right): f4 defect, 1:1 Expected expression [else]
```

**B, the workaround.**
- Before Apply: «Checkable after Apply», ten proposals, among them Node → ActivityNode and Terminal → FinalNode.
- After Apply the groups fold.
- The declaration takes 6 interactions: Configure… plus the same five as A.
- The run:

```
STEP 1 f1 · 2 f2 (count = 1) · 3 f3 · 4 f2 (count = 2) · 5 fk (d1 → left, right) fired → {left 1, right 1}
STEP 6 jn (left, right → fin) fired → Terminated, {fin 1}
```

**C, A with the explicit complement.** The run is the same as B up to step 6, which gives
**`Deadlock · nothing enabled`** with `{fin: 1}`: `final` is `null`, because `ActivityFinal` went to
`simActivityFinal`.

In all three variants Step's top stayed at 854.5 through every step. Presses took 65 to 128 ms, handler plus two
frames.

### 4.3 State machine, PEST shape [M] (`_tmp_demo_sm.ts`, exit 0)

**Apply.** Seven proposals:

```
Node → State · Initial → Initial · Terminal → Terminal · Transition → Transition
Owned transitions → State.transitions · Next state → Transition.nextState · Trigger → Transition.event
```

- After Apply the summary reads «State machine · Checkable» and the groups fold.
- The bag holds 8 keys.
- `undoable` went from 0 to 1.

**How the panel feeds an event.**
- Under the Reset / Step / Stop row there is an «Events» section with one button per Event instance. They are sorted
  by label, and each has the title `Fire <label>`.
- A button is enabled when its event triggers an edge out of the marked state. This is structural (R-SIM-16): `stop`
  was `(off)` in `unlocked`.
- The Step button has the title `Step (ε)` and stayed disabled the whole run, because every edge has a trigger.
- Before Reset every button is off. The run starts with the ⏮ (Reset) icon.

**The run.** It took ten event presses: push, coin, coin, push, coin, push, push, coin, push, stop. Each fired the
expected transition, `stop` gave `Terminated` with `{off: 1}`, and Step's top stayed at 798.5 throughout.

**The labels.**

```
M1 open {"events":["…_136(off)","…_137(off)","…_138(off)"], ...}
STEP 1 push {"last":["Last step: …_137: t3 (locked → locked) fired"]}
```

The screenshot `sm_2_after_run.png` shows `coin : Event` on the canvas and `…_136` on the button. The ESM, whose
`Event` has `name: EString`, shows `coin`, `push`, `stop` (§4.4). The cause is `objectSlots.ts:72`
`return shortId(objectId);`. `objectLabel` reads the identifier feature, then a slot of a feature named `name`, then
the short id; it never reads `DObject.name`, the instance name the canvas shows. By contrast, `elementName`
(`simBridge.ts:111-114`) does read `DObject.name`.

### 4.4 Extended state machine [M] (`_tmp_demo_esm.ts`, exit 0)

**Apply.** «Checkable after Apply», ten proposals: the seven of SM, plus Guard → Transition.guard, Action →
Transition.effect and Entry → State.entry. After Apply the summary reads «Checkable», the groups fold, and the bag
holds 11 keys.

**Reset before the declarations.**

```
"2 defects: tc action (undeclared 'coins' on demoESM); tp action (undeclared 'coins' on demoESM)."   (clamped: true)
coin → Halted: the transition action of tc failed: JjelEvaluationError: 'coins' is not a state attribute of demoESM.
```

**Declarations.**
- They took 10 interactions: Configure…, Add, name, domain range, max, initial, Add, name, form derived, equation.
  Data was open by default, because Data keys were set.
- With Configure… open, the panel has top 67 and height 884, and the body scrolls (client 845, scroll 882). The
  «Add attribute» button sat below the fold: `{"addTop":951,"bodyBottom":950,"inView":false}`.
- The header stayed visible (67 > the editor's 51).

**The run.** Reset gives `coins 0`, `paid false`.

| # | input | «Last step» (line) | title adds | σ after |
|---|---|---|---|---|
| 1 | push | `push: discarded, tp false` | — | coins 0, paid false |
| 2 | coin | `coin: tc (locked → locked) fired` | `assignments: demoESM.coins = 1` / `derived: demoESM.paid = false` | 1, false |
| 3 | push | `push: discarded, tp false` | — | 1, false |
| 4 | coin | tc fired | coins = 2 / paid = true | 2, true |
| 5 | push | `push: tp (locked → unlocked) fired` | coins = 0 / paid = false | 0, false |
| 6 | push | tu fired | paid = false | 0, false |
| 7..9 | coin ×3 | tc fired | coins = 1, 2, 3 | 3, true |
| 10 | coin | `coin: tc (locked → locked) halted the run` | — | `Halted: coins of demoESM would be 4, outside its domain.` |

- Step's top stayed at 798.5 through all ten inputs, the halt line included.
- The halt line and «Last step» are clamped; the full text is in the title (R-SIM-63).
- σ is shown only in the title of «Last step» (hover).

### 4.5 Undo [M] (`_tmp_demo_undo.ts`, `_tmp_demo_undo2.ts`, exit 0)

- **After Apply.** With the focus on an empty point of the pane, one Control+z takes the bag from 9 keys to 0 on
  Petri and from 11 to 0 on ESM. Control+y restores it. Meta+z in headless Chromium also undoes. SM: one Control+z
  takes the bag to `{}`, and the M1 face then reads «Simulation not configured. Missing on DemoPEST: …».
- **After more writes.** One undo reverts the last write only: on Flow A, B and C the table's initial value goes from
  `0` back to `false`.
- **Two ways the keyboard undo misses.**
  - A click on a node is an undo entry of its own. `undoable` went from 3 to 4, and the entry is an `isSelected`
    change titled `demoESM.locked.transitions.tc.effect.values`. The next Control+z reverts that entry and leaves
    the bag unchanged; this happened in the first ESM run.
  - With the focus on `BODY`, Control+z does nothing: in the Petri run `undoable` stayed at 3.
- Cmd+Z on the Mac was verified by Alfonso on 3001 this morning («one Cmd+Z back to «Custom · Not checkable»», read in
  the 0935 prompt). It was not re-run here.

---

## 5. Gaps

Estimates: **fast** = one fast lane (hours); **full** = full lane with visual check; **after** = after MODELS.

| # | Preset | Layer | Gap | Evidence | Fix sketch | Estimate | demo-critical |
|---|---|---|---|---|---|---|---|
| G1 | SM (and ESM without `Event.name`) | engine helper read by the bridge | Event buttons and «Last step» show `…_136` instead of the instance name | `"events":["…_136","…_137","…_138"]`; `objectSlots.ts:72` `return shortId(objectId);` | `objectLabel` falls back to `lookup[id].name` before `shortId`; test in the objectSlots/simBridge bench | fast | **yes**: the SM demo's only input buttons are unreadable on the PEST shape |
| G2 | Petri | binder / Apply | k stays 1: a place with 2 tokens is `initial-over-bound`, starts empty, and the run deadlocks after one step | `1 defect: p1 (initial marking 2: an integer in 0..1 is required).`; `A STEP 1 … Deadlock`; `simProfiles.ts:131` | Apply proposes `simBound` = the largest initial marking over the metamodel's M1 models when above 1 (a pure helper on the lookup); at least a defect text that names Bound | fast | **yes**: the first thing a Petri demo shows after Apply is a defect and an empty place |
| G3 | Petri (and ESM, Flowchart) | panel, M1 face; canvas after MODELS | Token counts and σ are not on screen: the canvas has a boolean highlight, the `tokens` slot keeps the model's value, and σ is only in a title | `petri_2_after_run.png` (p1 reads 2, marking has none); `ObjectNode.tsx:272` `isSimActive(simObjectId)`; `command grep -rn "tokens("` over `components/editor-v2/nodes`, `viewpoint/ir`: exit 1, control `isSimActive` 9 hits | one line in the M1 face for the run's lifetime, below the buttons: `Marking: p2 ×2, p3` and `coins = 2 · paid = true`, clamped with the full text in the title. The canvas side (`data.[x]` in views, R-SIM-4 files) comes after MODELS | full (visual, RC-26) | **yes**: a Petri demo cannot show what a weight or a firing did |
| G4 | Petri | catalog | Guard `off` in the preset: Apply does not bind it, the run ignores the guard until it is bound by hand, then «Set but off: Guard.» | `M2 fixed … "lines":["Set but off: Guard."]`; `simProfiles.ts:140` (no `guard`) | **closed on the trunk** by `7455d0075` (P-2026-09-27-0935), read, not measured | done; re-measure after the trunk merge | **yes, closed** |
| G5 | Flowchart | binder, panel | An abstract node superclass (the UML `ActivityNode`) gives «Not checkable · Missing: Node.» for good: the binder refuses it and the select does not list it, while the engine runs | `"lines":["Missing: Node."]`; `NODE options` without `ActivityNode`; `profileBinder.ts:203-204` `return b.status === 'bound' && ix.isAbstract(b.value)`; `SimulationPanel.tsx:125` `if (!dClass.abstract) classes.push(...)` | allow an abstract class for Node and Transition in control flow: `concrete()` off for those roles, their selects list `allClasses`. The overlap check is by sort and does not change (`stcFromRoles.ts:23-28`). Amends the M3 in-lane decision «a class role binds only a concrete class» | fast | no: a script constraint (a concrete node class, like A4) avoids it; decision C |
| G6 | Flowchart | catalog, binder, engine | `ActivityFinal` goes to `simActivityFinal`, which the engine never reads (R-SIM-53 is unimplemented). Terminal stays empty, so the run ends in `Deadlock`, and the key has no select | flowC `STEP 6 … "status":"Deadlock","reason":"· nothing enabled"`, `final: null`; `command grep` of `simActivityFinal\|activityFinal` over `model/simulation` and `components/editor-v2/sim` (tests excluded): hits only in `roleCatalog.ts`, `simProfiles.ts`, `profileBinder.ts`, control `simTerminal` in `netCompile.ts`, `netTypes.ts` | R-SIM-53 in the engine (`netCompile.ts` ROLE_KEYS, `NetStc`, `terminated`), plus a select; or, before that, the binder binds such a class to Terminal when no flow final exists (with one token they coincide) | full (engine, C2 files); binder variant fast | no: naming the final `FinalNode` (Flow B) gives `Terminated` |
| G7 | Flowchart | engine | `[else]` on an edge into a Fork (or a Join) is compiled as an expression: a parse-error defect, and the decision deadlocks | `f4 guard (parse error 1:1 Expected expression)`; `STEP 4 … Deadlock`; `netCompile.ts:259` `const plain = edges.filter(e => e.pseudoSource === null && e.pseudoTarget === null);` then `:266` `resolveElse(transitions, …)` before the fused transitions are pushed (`:287`, `:292`, `:296`) | resolve `else` over the fused transitions too; decide what happens to the other guard sites of a fused `else` (a completion of R-SIM-31 and R-SIM-64) | after (engine, C2 file, semantics) | no: an explicit complement (`model.[count] >= 2`) runs (Flow B, C) |
| G8 | Petri | panel | The choice list sits below the buttons: while it is open Step's top moves from 854.5 to 751.9, and the list lands where the buttons were | `"stepTopWithList":751.9` against `"stepTop":854.5`; `SimulationPanel.tsx:953` actions, `:994` `{pending && run && (` after them | move the list above the buttons, as R-SIM-65 does for the lines that appear | fast (inside R3) | no: the run is correct, but the jump is visible on every conflict (3 of 4 steps here) |
| G9 | ESM, Flowchart | profile summary | «Checkable» with an action bound and no declarations: Reset lists undeclared targets and the first firing halts. The declarations sit behind Configure…, with «Add attribute» below the fold | `M1 reset, no declarations … 2 defects`; `coin → Halted`; `ADD button {"inView":false}`; 10 and 6 interactions | a summary line when Action, Entry or Exit is bound and `simStateAttributes` is empty: «Actions write state attributes: declare them under Configure… › Data». Keep Data open after Apply in that case | fast (inside R2) | no: the presenter declares first |
| G10 | ESM | bridge text | An `action-defect` halt shows `JjelEvaluationError:` in the line | `Halted: the transition action of tc failed: JjelEvaluationError: 'coins' is not a state attribute of demoESM.`; `simBridge.ts:490-491` | strip the prefix in `haltSource` as the `derived` case does | fast (inside R3) | no: only when the declarations are missing |
| G11 | Petri | bridge text | An empty postset reads `t3 (lock → )` | `Last step: ε: t3 (lock → ) fired`; `simBridge.ts:510-511` | `∅` or «nothing» for an empty side | fast (inside R3) | no: cosmetic |

**Counts.** 11 gaps, 4 demo-critical (G1, G2, G3, G4). G4 is closed on the trunk, so 3 are open.

---

## 6. What already works (do not touch before the freeze)

| Area | Preset | Evidence [M] |
|---|---|---|
| Binder on the natural shapes | SM, ESM, Petri, Flowchart with a concrete node | 7 / 10 / 8 / 10 proposals, each with its `why` in the title; no candidates to choose in any scenario |
| Apply is one write and one undo | all | `undoable` 0→1; one Control+z brings 9 or 11 keys back to 0; Control+y restores |
| Fold after a Checkable Apply | SM, ESM, Petri, Flow B | panel at 157.5 px, top 793.5; Configure… unfolds with the header visible (top 67 or 102.5) and the body scrolls (M3's `max-height`) |
| Event-driven run | SM, ESM | structural buttons (`stop` off in `unlocked`), self-loops, `Terminated` on `off` |
| Guards, `else` among plain edges, derived values | ESM, Flowchart | `push: discarded, tp false` (R-SIM-57); the guard on the derived `paid` gates `tp`; a decision with two guards |
| Actions and declarations | ESM, Flowchart | assignments and derived values in the title of «Last step»; the domain halt names attribute, element and value |
| Fork and join | Flow B | `fk (d1 → left, right) fired` → two tokens; `jn (left, right → fin) fired` → `Terminated` |
| Petri core | Petri | weights ×2 both ways, inhibitor, guard, choice list on conflicts, `Deadlock · ε: t2 false` with the guard source in the title |
| Reset defects | all | undeclared targets and initial-over-bound named, the full text in the title |
| Run interruption | ESM, Petri | «Run interrupted: the model changed. Reset to run again.» after an M2 edit |
| Layout of the lines | all | Step's top constant across Reset, defects, halt and «Last step» (798.5 or 854.5), G8 aside |
| Model defaults | Petri | unset `EInt` slots read `[]`: weight 1 and marking 0 by default, no spurious defect |
| Performance | all | Apply 39–57 ms, a Step press 30–128 ms (handler plus two frames); `runSignature` 0.08 ms on the 278-entry lookup (6249 characters) |

---

## 7. Risks

1. **The fold behind Configure… (found on 2026-09-27).** Confirmed on every Checkable Apply: `groups: []` until
   Configure…
   - ESM declarations: 10 interactions, with Data open by default because Data keys are set.
   - Petri Bound: Configure… plus the General group. Before `7455d0075` the Guard also needed the Data group opened
     by hand.
   - G9 and R2 soften it; the fold itself stays as M3 built it.
2. **M3 tickets.**
   - `simActivityFinal` is written by Apply with no select (G6, measured in Flow A and C).
   - «Kept: Node» was not triggered: every scenario started from an empty bag. It only shows when the presenter sets
     a role before Apply.
3. **A failed presentation equation is not surfaced.** Not exercised: none of the four scenarios declares a
   presentation attribute. It is not a risk for a demo that does not use `node.[x]`.
4. **Cmd+Z on the Mac.** Verified by Alfonso on 3001 this morning. Measured here:
   - Control+z and Meta+z undo in headless Chromium when the focus is in the editor.
   - A click on a node is an undo entry of its own (`isSelected`), so Cmd+Z after selecting a node reverts the
     selection first.
   - With the focus on the page body, the key does nothing.
   - The demo should undo right after Apply, or click the empty canvas first.
5. **Ten-step runs.** No slowdown and no drift.
   - The only layout moves are the choice list (G8, −102.6 px) and the reasons list (−24.5 px, opened by the user).
   - The panel is about 288 px wide, so the defects and halt lines are clamped by design: the audience reads them
     only on hover.
6. **The run starts with ⏮.** Before Reset every input is off, and ▶ does nothing. The script should say «Reset starts
   the run».
7. **Binder name tests.** Read only, not measured: `profileBinder.ts:193`
   `{ role: 'terminal', name: /final|end|terminal|stop/, … }` matches a substring. A class named `SendSignal` or
   `Pending` would be proposed as Terminal. Entry and Exit are searched on Node's lineage only, so an `entry` on a
   subclass (`Activity.entry`) is not proposed, though the select offers it.
8. **Merge base.** This tree predates `7455d0075`. Every lane below starts after `simulation-engine` takes the trunk,
   and the Petri scenario is re-measured then (G4).

---

## 8. Recommendation

The order of the lanes before 2026-10-01 evening:

| # | Lane | Files | Touches a C2 file? | Order | What the demo loses if skipped |
|---|---|---|---|---|---|
| 0 | `simulation-engine` takes the trunk (`7455d0075` and the 0935 docs) | — | — | first | Petri Apply leaves Guard unbound; the run ignores the guard |
| R1 | Event labels fall back to the instance name (G1) | `frontend/src/model/simulation/objectSlots.ts`, a test in `model/simulation/__tests__` or `sim/__tests__/simBridge.test.ts` | no C2 engine file (`simBridge.test.ts` was touched by C2, if used) | parallel to R2 | SM buttons read `…_136`, unless the metamodel gives Event a `name` attribute |
| R2 | Apply completes the natural shapes: Bound from the models (G2), an abstract Node and Transition in control flow (G5, if decision C = allow), the declarations hint (G9) | `model/simulation/profileBinder.ts`, `components/editor-v2/sim/simRoleStatus.ts`, `SimulationPanel.tsx`, tests `profileBinder.test.ts`, `simRoleStatus.test.ts` | no engine file; `SimulationPanel.tsx` was touched by C2 and M3 | after 0, before R3 (same panel file) | a Petri defect plus an empty place after Apply; «Not checkable · Missing: Node» on the UML flowchart; the undeclared-action halt |
| R3 | The M1 face for the audience: the marking and σ line (G3), the choice list above the buttons (G8), the texts G10 and G11 | `SimulationPanel.tsx`, `simulation-panel.scss`, `simBridge.ts` (text helpers), `sim/__tests__/simBridge.test.ts` | **yes**: `simBridge.ts` and its test are C2 files | after R2 | token counts and σ invisible; a 102.6 px jump on every Petri conflict |

**After MODELS, not in the list:**
- G6, R-SIM-53 in the engine;
- G7, `else` in fused transitions (`netCompile.ts`);
- the canvas side of G3 (the R-SIM-4 files);
- the modal lane.

**The outputs lane (R-SIM-76): no.** No visible preset needs `simStateOutput` or `simTransitionOutput`: Moore and Mealy
are hidden (A2).

**The enum step B: no.** It is canvas edge refusal (`discovery_2026-09-27_enum_edge_guard.md`) and touches no
simulator file.

**Script constraints that replace a lane before the freeze:**
- a concrete node class (G5, unless R2 takes it);
- a flow final named `FinalNode` or `Final`, not `ActivityFinal` (G6);
- an explicit complement instead of `[else]` into a Fork or Join (G7);
- Initial and Final as classes (A4, ratified);
- undo right after Apply (risk 4).

---

## 9. Decisions taken (unattended)

1. The measurements ran on `ee1b7bfc8`, before `7455d0075`. G4 is recorded as measured before the fix, and read as
   closed on the trunk; it was not re-measured.
2. The bags start empty, so the scenarios measure the demo's path (preset, Apply, fixes through the panel), not a
   pre-configured bag.
3. The flowchart was measured in three variants, to attribute each failure: A is natural, B is the workaround, C
   isolates G6.
4. The ESM's `Event` has a `name` attribute, and the SM's does not. This lets G1 and its workaround be measured in
   the same lane.
5. «demo-critical» was judged against this question: does the four-preset demo, drawn the natural way, run and read
   correctly without a script workaround? Where a workaround measured clean, the verdict is «no», and the choice
   goes to Alfonso (§10).
6. Undo was measured with Control+z, Control+y and Meta+z in headless Chromium, after focusing an empty point of the
   pane. Cmd+Z on the Mac is Alfonso's verification of this morning, not this lane's.

---

## 10. Decisions awaiting Alfonso (RC-26: what the demo shows)

- **A. Event labels:** fix in code (R1) or add `name` to Event in the demo metamodel? Recommended: R1.
- **B. Petri Bound:** Apply proposes Bound from the models (R2), or the presenter sets it on screen («k = 4»)?
  Recommended: R2. Showing the field in the script is still possible.
- **C. Abstract Node:** allow an abstract class for Node and Transition in control flow (R2)? This amends the M3
  in-lane decision «a class role binds only a concrete class». The alternative is a concrete node class as a script
  constraint, like A4. Recommended: allow.
- **D. The M1 face:** one line for the whole run with the marking and its counts, then σ (for example
  `Marking: p2 ×2, p3 · coins = 2, paid = true`), or keep σ in the hover title only? Recommended: the line (R3).
- **E. The flowchart of the demo:** `FinalNode` and an explicit complement, with R-SIM-53 and `else` into Fork/Join
  after MODELS? Recommended: yes.
- **F. Panel layout:** the choice list moves above the buttons, completing R-SIM-65. Recommended: yes (R3).

---

## 11. Questions

1. Is the MODELS demo drawn on the PEST SM of 3001 or on a new metamodel? That decides whether A and C are a code
   lane or a script line.
2. Does the Petri demo need counts on the canvas nodes, not only in the panel? If so, that is the R-SIM-4 view lane,
   in the critical zone, after MODELS.

---

## 12. Files read and probes

**Read** (full paths under `/Users/alfonso/jjodel-sim/`):

Engine:
- `frontend/src/model/simulation/roleCatalog.ts`, `simProfiles.ts`, `profileBinder.ts`: whole.
- `frontend/src/model/simulation/netCompile.ts`: whole.
- `frontend/src/model/simulation/objectSlots.ts`: whole.
- `frontend/src/model/simulation/netStep.ts`: grep of `export function`, `Terminated`, `Deadlock`, `final`.
- `frontend/src/model/simulation/stcFromRoles.ts`: `:23-28`, `:46-100`.

Panel and bridge:
- `frontend/src/components/editor-v2/sim/simRoleStatus.ts`, `metamodelSketch.ts`, `SimulationPanel.tsx`: whole.
- `frontend/src/components/editor-v2/sim/simBridge.ts`: `:60-834`.
- `frontend/src/components/editor-v2/sim/simRunState.ts`: `:25-60`.
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`: `:270-273`, and grep.

Docs:
- `docs/decisions.md`: R-SIM-1..79 (`:1427-2100`).
- `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md`: §0, §1, §3, §5..§9.
- `docs/discovery/discovery_2026-09-26_sim_state_declarations.md`: §8, §9.
- `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md`: §9..§11.
- `docs/discovery/discovery_2026-09-27_enum_edge_guard.md`: `:1-40`.
- `docs/log-inbox/simulation.md`: whole.
- `docs/claude-code-log.md`: `:1-120`.
- `docs/prompts/claude_2026-09-27_0935_prompt_ratifications_petri_guard.md`: grep.
- `git show --stat 7455d0075`.

Rules:
- `frontend/src/model/CLAUDE.md` §3.12.
- `frontend/src/components/editor-v2/CLAUDE.md`, loaded on entry.

Probe templates, read and not modified:
- `~/jjodel-gate/frontend/scripts/smoke/_tmp_p0225_{vite.config,common,scenario,visual}.ts|js`;
- `~/jjodel-icons/frontend/scripts/smoke/_tmp_c2_{scenario.js,0200_probe.ts}`;
- `~/jjodel-sim/frontend/scripts/smoke/_tmp_sim3b_scenarios.js` and `states.ts` (`seed`).

**Probes** (gitignored, `frontend/scripts/smoke/_tmp_demo_*`, kept on disk; logs and screenshots in
`/tmp/p1015_scratch`):
- `_tmp_demo_vite.config.ts`: the 3007 server.
- `_tmp_demo_common.ts`: page, `openModel`, the M2/M1 readers, `runState`, `press` (timed), `clickEmptyPane`.
- `_tmp_demo_scenario.js`: the six builders of §3, one at a time through `__demoOnly`.
- `_tmp_demo_petri.ts`, `_tmp_demo_flow.ts` (`FLOW=flowA|flowB|flowC`), `_tmp_demo_sm.ts`, `_tmp_demo_esm.ts`: §4.1–§4.4.
  `npx tsx`, exit 0 each. The first run of `_tmp_demo_sm.ts` clicked no event: the buttons read `…_136`, which was
  the finding. The second run clicks by label.
- `_tmp_demo_undo.ts`, `_tmp_demo_undo2.ts`: §4.5. The first run of `_tmp_demo_undo2.ts` timed out on its last step
  (a node outside the viewport) after the undo readings. It was re-run for the node click with `SKIP_UNDO=1`, exit 0.
- Screenshots, light: `petri_1_after_apply.png`, `petri_2_after_run.png`, `flowA_1_after_apply.png`,
  `flowA_2_after_run.png`, `flowB_1_after_apply.png`, `flowB_2_after_run.png`, `flowC_*`, `sm_1_after_apply.png`,
  `sm_2_after_run.png`, `esm_1_after_apply.png`, `esm_2_after_run.png`.
