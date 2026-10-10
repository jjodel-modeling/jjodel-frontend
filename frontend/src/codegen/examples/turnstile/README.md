# Turnstile: from a state machine to a JavaScript program, checked by the simulator

This example is the turnstile of the lecture (the DemoESM project, scene 3). The model has three states: `locked`
(initial), `unlocked` and `off` (terminal). It has three events, `coin`, `push` and `stop`, and four transitions:

| Transition | From → to | Event | Guard | Action |
|---|---|---|---|---|
| `tc` | locked → locked | coin | | `model.[coins] := model.[coins] + 1` |
| `tp` | locked → unlocked | push | `model.[paid]` | `model.[coins] := 0` |
| `tu` | unlocked → locked | push | | |
| `ts` | locked → off | stop | | |

The model's data has two attributes. `coins` is a number from 0 to 3, starting at 0. `paid` is derived:
`paid = model.[coins] >= 2`. The metamodel is bound to the **Extended state machine** profile.

A set of templates turns the model into a JavaScript module. Two parts of Jjodel then run the same scenario: the
simulator, and the generated program. An **oracle** compares the two runs step by step.

## What is in the fixture

`turnstile.json` holds:

- `lookup`: the metamodel `MM` and the model `M`, under readable ids. The metamodel's `_state` holds the simulation
  roles and the templates (`genTemplates`). The model's `_state` holds the two data declarations.
- `scenario`: seven steps from Reset:
  1. push (nothing fires, a *discard*: `paid` is false);
  2. coin;
  3. coin;
  4. push (fires `tp`);
  5. push (fires `tu`);
  6. coin;
  7. stop (fires `ts`).

  The final condition is `model.[coins] == 1`.
- `mutation`: the change the oracle must catch. Change the target of `tu` from `locked` to `unlocked`, and the
  oracle reports step 5.

## The templates

The program exports four functions:

- `initial()`;
- `step(state, event, selector, inputs)`, which returns `{kind, next, reason?}`;
- `observe(state)`;
- `main()`, which is what «Run» calls.

`step` takes the simulator's own step (`model/simulation/netStep.ts`) and writes it in JavaScript. A step:

1. computes the **candidates**: the transitions the event triggers whose source is marked and whose guard holds;
2. checks the **selector**: the transition chosen, or `null` when there is none;
3. moves the **marking**;
4. runs the **actions** of the transition as one parallel assignment;
5. recomputes the **derived** values.

| Template | What it writes |
|---|---|
| `main` | The whole module: a header, the printer's runtime (`target.runtime`), the model tables, `initial()`, then `engine()` |
| `transition(t)` | One entry of the transition table, with a comment `tc: locked --coin--> locked` |
| `entry(t, c, comment)` | The entry itself: id, arcs, triggers, the guard of each guard site, the actions of each action site |
| `site(s)` | The actions of one site, as the printer prints them (`target.actions(s)`) |
| `declaration(d)`, `derived(d)`, `event(e)` | One row of the data, derived-value and event tables |
| `ids(xs)`, `names(xs)`, `transitionName(t)` | Small helpers: a list of ids as a JavaScript array, names joined, a name |
| `engine()` | The part that does not depend on the model: candidates, `step`, `observe`, `main` |

Guards, actions and derived values are not translated by the templates. They are printed by the **JavaScript target
profile**, `target` in a template, and run with the simulator's semantics: `and` and `or` evaluate both sides,
division by zero gives `null`, and actions are parallel. For example, the guard of `tp`, `model.[paid]`, becomes
`$guard(() => ($read(state, "M", "paid")))`. A guard or an action the printer cannot translate is a generation
error, and «Run» is off until it is fixed.

### The roles the templates read (R-GEN-7)

The templates name no metaclass. They read the simulation roles, so they apply to every metamodel bound to a
state machine profile that has these roles:

- `stc.nodes`: the **Node** role, for the list of states in the header;
- `stc.events`: the **Event** role, derived from the **Trigger** reference;
- `stc.source(t)`, `stc.target(t)`, `stc.trigger(t)`: the **Owned transitions** (or **Source**), **Next state** and
  **Trigger** roles, for the comment of each transition;
- `target.net` and `target.initial`: the net the simulator compiles from all the roles. That covers **Initial**,
  **Terminal**, the state attributes, the transitions with their arcs, and the sites of the **Guard**, **Action** and
  **Entry** roles;
- `target.guard(site)`, `target.actions(site)`, `target.equation(d)`: the **Guard**, **Action** and **Entry** roles,
  and the derived attributes, printed in JavaScript.

## Running it in Jjodel

1. Settings → Advanced → turn on **Code generation** (experimental).
2. Import the DemoESM project. In the metamodel, open the Simulation panel and apply **Extended state machine**. In
   the model's Data, declare the two attributes above:
   - `coins`, range 0..3, initial 0;
   - `paid`, boolean, equation `model.[coins] >= 2`.
3. Put the templates on the metamodel. Either type them in the **Templates** tab of the Code panel, or write the
   stored list in one go. To write it in one go, open the browser console, find the metamodel's id, and run
   `LPointerTargetable.fromPointer('<metamodel id>').state = { genTemplates: <the string in lookup.MM._state.genTemplates> }`.
4. Open the model, press **Code**, then **Output**. The program is generated. Hover any underlined text to see the
   model element it came from, and click it to select that element on the canvas.
5. Press **Run**: `main()` fires the first candidate of the first input, up to five times, and shows each state by
   name. On
   the dev server, the first run loads the worker. Give it a longer timeout (10000 ms) if it times out.

## Running the oracle

The oracle is not on a button yet. To run it:

- **In the app.** Record the scenario in the Simulation panel's Scenarios: press the events in the order above and
  save. Then, with the Code panel open once (that loads the oracle), run in the console
  `await __jjodelOracle.run({ modelId: '<model id>' })`. It reads the first scenario stored on the model.
  - The result is `{ ok: true }` when every step agrees.
  - Otherwise it reports the first step that differs, what differs (`kind` or `observe`, with a `path` such as
    `marking.<state>`), the transition the simulator fired there, and the generated line whose origin is that
    transition.
- **In the tests.** `npx vitest run src/codegen/oracle` runs this example end to end in node, including the mutation.
- **In the browser probe.** `frontend/scripts/probe/codegen-oracle.ts` does all of the above in the app, from the
  import of the scene to the mutation.

The oracle compares, at the start and after every step, the step's kind (`fired`, `discard`, `quiescence`, `halted`)
and `observe(next)`. The projection holds:

- the marking, without its zeros;
- the data attributes;
- the derived values.

Layout and colours (presentation) are left out. The scenario's final condition is not part of the comparison: it
stays the simulator's own check.

## Limits of this template set

- **Input variables.** The program reads none: `inputs` is accepted and ignored. A model with input variables
  diverges, and the oracle says so.
- **Presentation.** The program holds no presentation state. An action that assigns `node.[x]` is refused at
  generation.
