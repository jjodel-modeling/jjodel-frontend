---
title: Simulation guide
description: Make a metamodel simulable in Jjodel and run its models, step by step, with a worked example.
sidebar:
  order: 1
---

This guide takes you from a metamodel with no simulation to a model you can run, step back, record and replay. One example runs through every section: a vending machine that takes coins of 10, 20 and 50 and releases a product once the credit reaches 50.

For the precise rules of a step, read the [simulation semantics](simulation-semantics.md).

## What the simulator does

The simulator runs a model as a machine. You bind the concepts of your metamodel (states, transitions, events, guards) to the roles the engine understands, then press Reset on a model and drive it one step at a time. Each step fires at most one transition. The model itself never changes during a run: the run state lives beside it, in the panel, and is never saved.

What it can run: Petri nets, flowcharts and activity diagrams, state machines with or without data, DFA and NFA, Moore and Mealy machines. What it cannot run: time, hierarchical states, dynamic creation of elements, true concurrency. The [semantics page](simulation-semantics.md#excluded-by-construction) lists the limits.

## Turn simulation on

Simulation is an Advanced feature.

1. Switch the editor to Advanced mode.
2. Open the metamodel's Properties and turn on the **Simulation** toggle.
3. A **Simulation** pill appears in the editor. Click it to open the simulation panel.

The toggle only shows the feature. It changes nothing in the metamodel until you bind roles.

<!-- TODO: screenshot — metamodel Properties with the Simulation toggle on, and the Simulation pill in the editor header -->

## The semantic type class and profiles

A metamodel becomes simulable through a **semantic type class** (STC): a set of roles, each bound to one of your metaclasses or features. "Node" says which metaclass is a state, "Next state" says which reference is the target of a transition, and so on. A role bound to a metaclass also covers its subclasses.

A **profile** is a ready-made choice of which roles are active. Pick the one closest to your language; you can still turn roles on and off afterwards.

| Profile | Use it for | Notable roles |
|---|---|---|
| Petri net (P/T) | Place/transition nets | Arc, Arc weight, Inhibitor arc, Bound, Initial marking |
| Flowchart / Activity | Flowcharts, activity diagrams | Fork, Join, Activity final, Action, Entry |
| State machine | Plain state machines | Trigger, Guard, Terminal |
| Extended state machine | State machines with data | Trigger, Guard, Action, Entry, Exit, state attributes |
| DFA | Deterministic automata | Trigger and Accepting required |
| NFA | Nondeterministic automata | Trigger and Accepting required |
| Moore machine | Outputs on states | Trigger and State output required |
| Mealy machine | Outputs on transitions | Trigger and Transition output required |

Some profiles declare constraints, such as "single token" or "deterministic". Jjodel does not check them today: a DFA with two transitions on the same symbol still runs, as an NFA would.

The vending machine needs data (the credit), so it uses **Extended state machine**. The plain State machine profile has no state attributes.

## The Simulation roles dialog

Open the panel on the metamodel and click **Configure…**. The first time, the dialog asks "What kind of model is this?" with two cards, **Control flow** and **Petri net**, then a short list of profiles. DFA, NFA, Moore and Mealy are in the profile select of the dialog's header.

The dialog has these parts:

- **Header**: the profile select, **Save as…** to keep your changes as a profile of your own, a `modified` tag once you depart from the profile, and the shape (control flow or Petri net).
- **Problems**: what prevents a run, if anything.
- **Required**: the roles a run needs. "Next state", "Source or Owned transitions", "Initial or Initial marking" for control flow.
- **Parameters**: the Bound, the maximum number of tokens on a place.
- **Optional**: the other active roles, folded.
- **N derived · M not used**: roles the profile fills in or turns off. Click an off role to turn it on.
- **State**: the state attributes declared on metaclasses, with **Add attribute**.

Each row shows a badge for what it binds (Class, Ref, Attr, Value). The bar at the bottom reads "N of M roles assigned", with Undo, Redo and a **Match** button. The pill reads **Checkable**, **Checkable with warnings** or **Not checkable**.

**Apply** writes every change at once, as one undo step, and is enabled only when something is pending and nothing is defective. Applying interrupts a run in progress. Cancel or Esc discards.

For the vending machine, write this metamodel first:

- `State` with a `name`; `InitialState` extends `State`.
- `Transition` with references `source : State [1]`, `target : State [1]`, `trigger : Event [0..*]`, and attributes `guard : Expression`, `effect : Action [0..*]`.
- `Event` with a `name` and `amount : EInt`.

Then bind, under Extended state machine:

| Role | Bound to |
|---|---|
| Node | `State` |
| Initial | `InitialState` |
| Transition | `Transition` |
| Source | `Transition.source` |
| Next state | `Transition.target` |
| Trigger | `Transition.trigger` (the Event role follows from its type) |
| Guard | `Transition.guard` |
| Action | `Transition.effect` |

<!-- TODO: screenshot — Simulation roles dialog for VendingMachine, Required section complete, pill Checkable -->

If the roles are incomplete, the panel says `Simulation not configured. Missing on <Metamodel>: …` and Reset refuses with "The simulation roles are incomplete."

## Events and triggers

An event is an instance in your model, not a name typed at run time. The Trigger role is a reference from a transition to the events that fire it; the Event role is whatever type that reference has. A transition with no trigger is an **ε transition**: it fires on Step, with no event.

An event can carry attributes. A guard or an action reads them as `event.amount`. The value is the one stored in the model: Jjodel has no free event parameters. To model `insert_coin(amount)`, make one Event instance per coin value.

For the vending machine, create five events: `coin10`, `coin20`, `coin50` with `amount` 10, 20 and 50, then `select` and `refund`. Their `amount` is unset and never read.

A transition with several triggers fires on any of them. When a run exists, the events are hidden from the canvas: you press them as buttons in the panel.

## Guards and actions

A **guard** decides whether a transition may fire. It is a JjEL expression in a feature of type `Expression` (an `EString` works too). An empty guard is true. A guard reads, never writes:

- `self` is the transition;
- `model.[x]` is the global state attribute `x`;
- `s.[x]` is the state attribute `x` of element `s`; `s.[marked]` and `s.[tokens]` read the marking;
- `event.amount` is an attribute of the event that fired the step, `null` on an ε step;
- `s.name` with a plain dot reads the model, which never changes.

A guard whose text is `else` is true exactly when no sibling guard is: siblings are the transitions leaving the same place on the same triggers.

An **action** changes the state. It is an assignment `<target>.[x] := <expression>` in a feature of type `Action`. The `:=` exists only in actions. All the actions of one step read the state before the step and land together, so their order never matters and assigning the same attribute twice is an error.

A guard that fails to evaluate keeps its transition out of the step and the run goes on; the panel says why. An action that fails halts the run.

For the vending machine, write four transitions:

| Transition | From → to | Triggers | Guard | Effect |
|---|---|---|---|---|
| t1 | Idle → Idle | coin10, coin20, coin50 | `model.[credit] + event.amount < 50` | `model.[credit] := model.[credit] + event.amount` |
| t2 | Idle → Ready | coin10, coin20, coin50 | `else` | `model.[credit] := model.[credit] + event.amount` |
| t3 | Ready → Idle | select | | `model.[credit] := model.[credit] - 50` |
| t4 | Idle → Idle | refund | | `model.[credit] := 0` |

t1 and t2 are siblings, so t2's `else` means "the credit would reach 50". `Idle` is an `InitialState`, `Ready` a `State`.

Some constructs are rejected in guards because a model checker could not translate them: `node`, function calls, `with … do`, `if` without `else`, and `x != null and x.p`, because JjEL evaluates both sides of `and`. Write `if x != null then x.p else false`. The [guard subset](simulation-semantics.md#the-guard-subset) lists the codes.

## State attributes

The state of a run is the marking plus the **state attributes** you declare. Nothing is inferred: an attribute exists only if a declaration says so.

There are two places to declare them:

- On a metaclass, in the **State** page of the Simulation roles dialog. Every instance of the metaclass carries the attribute.
- On the model, as a **global**, through **State…** in the model's simulation panel. A guard reads it as `model.[name]`.

Each declaration has:

- a **space**: semantic (it drives the run) or presentation (`node.[x]`, how an element looks);
- a **domain**, for semantic attributes: boolean, an enumeration of names, or a range of integers min..max;
- a **form**: `stored` with an initial value, `derived` with an equation recomputed after every step, or `input`, a value you give when a step reads it.

A semantic value outside its domain halts the run. An initial value outside its domain is reported at Reset, and the run still starts with it. A presentation attribute has no domain; only `node.[x] := …` assigns it, and a semantic assignment cannot read it.

For the vending machine, open the model's **State…** and add the global `credit`: semantic, stored, range 0..100, initial 0.

## Running a model

Open the panel on a model and press **Reset**. Reset compiles the model, lists the defects it found, and starts the run.

<!-- TODO: screenshot — simulation panel on the vending machine after Reset: status Running, credit 0, event buttons -->

### The controls

| Control | What it does |
|---|---|
| Reset | Starts the run again from the initial configuration. Always on. |
| Step back | Undoes the last step, and clears a halt. On from step 1, in any status. |
| Step | Fires an ε transition. On only when some ε transition is enabled by the marking (with an event role, its title is `Step (ε)`). |
| Event buttons | One per event: fires a transition that accepts it, or discards it. |
| Play / Pause | Repeats Step every 500 ms until something needs you. On only in `Running`. |
| Stop | Ends the run; the panel returns to `Not started`. Always on. |

The event buttons and Step check the marking and the triggers only, not the guards: a button can be on while every guard refuses. Its tooltip says `Fire <event>`, `No candidate. <why>` or `Asks: <inputs>`.

### The five statuses

| Status | Meaning | Step, events, Play |
|---|---|---|
| `Not started` | No run: before Reset, after Stop, or after the model changed | off ("Reset starts the run.") |
| `Running` | Some input can fire a transition, or would once you give an input value | on where enabled |
| `Terminated` | Every marked place is Terminal, or an Activity final is marked | off |
| `Deadlock` | Nothing can fire; the panel says why, for example `ε: t2 guard false` | off |
| `Halted` | A step failed; the reason is shown above the buttons | off |

Reset, Stop and Step back follow the table above in every status. The status row also shows `· accepting` when an accepting place is marked, then `step n · seed s` and what the last step did. Editing the model during a run interrupts it: "Run interrupted: the model changed. Reset to run again."

### Choices and Play

When several transitions can fire on the same press, the panel lists them under **Nondeterministic choice**, each as `name (preset → postset)`, and you pick one. A choice that would exceed the bound is marked `exceeds bound N`.

The **Choices** select sets the policy. **Ask** always shows the list. **Random** draws among ε candidates with the run's seed, shown in the status row; event choices always open the list. **Play step limit** (k, 1 to 1000, default 100) caps a Play. These settings live per model in memory.

Play stops at the first of: the run ends (`Terminated`, `Deadlock`, `Halted`), k steps, a step that needs an input value, no ε transition to fire, a choice under Ask, an invariant or breakpoint hit.

### Step back and the timeline

**Step back** pops the last step and returns to the configuration before it. It also stops Play. The random draws are not rewound.

From step 1 a **timeline** slider appears. Drag it, or use ← → Home End, to view a past step read-only. **Continue from here** steps back to the viewed step. Pressing a control while viewing the past acts on the live run and returns to it. The panel keeps the last 1000 configurations and rebuilds older ones by replay.

### Input values

When a transition that could fire reads an `input` attribute, pressing Step or its event opens a dialog: `<press> reads this value`, with chips for a boolean, a field `min..max` for a range, or a select for an enumeration. The button `Step` or `Fire <event>` is on once every value is valid. Cancel or Esc leaves the run untouched. The value exists for that step only; to keep it, an action must copy it into a stored attribute.

### The run inspector

The header icon **Open the run inspector** shows the whole state and the trace. Each trace step records the event, the transition chosen, the kind of step (fired, discarded, quiescence, halted) and the input values.

### The vending machine, run

1. **Reset**: Idle is marked, `credit` is 0, status `Running`. Step is off: no transition is ε.
2. **coin20**: t1's guard `0 + 20 < 50` holds; t1 fires; `credit` is 20.
3. **coin50**: t1's guard `20 + 50 < 50` is false, so t2's `else` holds; t2 fires; Ready is marked, `credit` is 70.
4. **coin10**: no transition leaves Ready on coin10. The step is a discard: the trace records it and nothing changes.
5. **select**: t3 fires; Idle is marked, `credit` is 20.
6. **Step back** twice undoes select and the discard: the run is back after coin50, with Ready marked and `credit` 70.

## The I/O board and front panel

The **I/O board** (header icon "Open the I/O board: the machine's inputs and outputs") gives the machine a front panel of devices. Click **Edit…** on the board to open the editor; Apply saves the board as one undo step. The board is saved in the model and editing it never interrupts a run.

| Device | Kind | Bound to |
|---|---|---|
| Button | input | an event |
| Switch | input | an input attribute, or events |
| Slider | input | an input attribute |
| Keypad | input | a value, or events |
| Clock | input | an event |
| LED | output | a place's marking, or an expression |
| Pulse LED | output | a transition or an event of the last step |
| 7-segment | output | an integer expression |
| Text | output | the configuration, or an expression |
| Gauge | output | an attribute |
| Buzzer | output | a place's marking, or an expression (muted by default) |
| Silk | panel | nothing: a label |

Output expressions read the model root as `self`; they cannot read `event` or an input. A failing output shows `Err`. The board has two skins, **Board** and **Panel**; Panel has the themes graphite, appliance, instrument and print, and a grid of 4, 6 or 8 columns. While the board has focus, keycaps fire their devices.

The **Clock** presses its event every period, from 100 ms to 60 s (default 1 s), starting one period after it is armed at Reset. It ticks only while the run is `Running`, and skips a tick while a choice or an input dialog waits. A tick with no transition listening is not a step. The clock goes off at Reset, at the end of a run, on a watch hit, when you collapse the panel, edit the board or step by hand. The Clock is the environment pressing a button, not time in the model.

For the vending machine: five Buttons for the events, a 7-segment on `model.[credit]`, an LED on Ready's marking.

<!-- TODO: screenshot — vending machine front panel, Panel skin, credit 70 on the 7-segment and the Ready LED lit -->

## Invariants and breakpoints

In the run inspector, the icon **Invariants and breakpoints** opens a list of named boolean expressions, saved with the model.

- An **invariant** should always hold. It is hit when it becomes false.
- A **breakpoint** marks a configuration you want to stop at. It is hit when it is true.

Both are read after every step that commits, never on the configuration Play starts from. A hit stops Play and the clocks, with a line such as `Invariant <name> false at step N · <firing>`. A step by hand is never refused. A watch that fails to evaluate shows its defect on its row; it is never a run error.

For the vending machine, add the invariant `credit bound` with text `model.[credit] <= 100`.

## Scenarios

A **scenario** is a recorded run you can replay. In the run inspector, **Save as scenario** records the trace from Reset, with the choices you made and the input values you gave, as `Scenario n`. Scenarios are saved with the model and listed under the trace, each with Replay and Delete.

**Replay** starts from Reset and presses the same inputs with the same choices, ignoring the Choices policy and the watches. It ends with `Passed · N step(s)`, or `Diverged at step N: <why>` when the model no longer behaves as recorded, for example because a transition is not enabled any more.

A scenario can carry a final condition, checked at the end of the replay. No control sets it from the UI today.

For the vending machine, save the run of the previous section, change t1's guard to `< 80`, and replay it: at the coin50 step t1 now fires instead of t2, so the replay diverges there.

## Coverage

The **Coverage** switch, at the top right of the canvas while a run exists, shows how many times each place was visited and each transition fired, across all the runs of the model. A badge `×N` sits on each node; nodes never reached are veiled. The summary reads `X/Y places · Z/W transitions`.

Discards, quiescence and halts count nothing. Coverage survives Reset, Stop and Step back. **Clear coverage** empties it. Coverage is kept in memory only.

## Limits

- Runs, traces, seeds, policies, coverage and scenario results live in memory and are lost on reload. Roles, state declarations, the board, watches and scenarios are saved.
- The profile constraints are not checked.
- There is no explicit priority among transitions: you choose, or Random draws.
- There is no exporter to nuXmv yet; the panel uses its vocabulary (`VAR`, `DEFINE`, `IVAR`) to prepare one.
- No time, hierarchy, history, dynamic structure or event queue. See [Excluded by construction](simulation-semantics.md#excluded-by-construction).
