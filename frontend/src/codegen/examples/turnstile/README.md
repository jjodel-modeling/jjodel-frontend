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
| `main` | The whole module: a header, the table of element ids (`target.ids`), the printer's runtime (`target.runtime`), the model tables, `initial()`, then `engine()` |
| `transition(t)` | One entry of the transition table, with a comment `tc: locked --coin--> locked` |
| `entry(t, c, comment)` | The entry itself: id, arcs, triggers, the guard of each guard site, the actions of each action site |
| `site(s)` | The actions of one site, as the printer prints them (`target.actions(s)`) |
| `declaration(d)`, `derived(d)`, `event(e)` | One row of the data, derived-value and event tables |
| `ids(xs)`, `arcList(list)`, `names(xs)`, `transitionName(t)` | Small helpers: a list of elements as a JavaScript array, arcs as `[{ place: $ID.locked, weight: 1 }]`, names joined, a name |
| `engine()` | The part that does not depend on the model: candidates, `step`, `observe`, `main` |

The program names elements, not ids (R-GEN-17). Every element id appears once, in a frozen table near the top:

```js
const $ID = Object.freeze({
  demoESM: 'M',
  locked: 'locked',
  ...
});
```

Everywhere else the program writes `$ID.locked`, `$ID.tc`, `$ID.demoESM`. The name is the element's name, made a
valid JavaScript name and unique (`locked_2` for a second `locked`); an element without a name is
`<metaclass>_<n>`. The values are still the ids, so the program computes the same thing. The templates write the
table with `target.ids` and an element with `target.ref(element)`; `initial()` returns
`{ marking: { [$ID.locked]: 1 }, attrs: { [$ID.demoESM]: { coins: 0 } }, … }`.

Guards, actions and derived values are not translated by the templates. They are printed by the **JavaScript target
profile**, `target` in a template, and run with the simulator's semantics: `and` and `or` evaluate both sides,
division by zero gives `null`, and actions are parallel. For example, the guard of `tp`, `model.[paid]`, becomes
`$guard(() => ($read(state, $ID.demoESM, "paid")))`. A guard or an action the printer cannot translate is a
generation error, and «Run» is off until it is fixed.

### The roles the templates read (R-GEN-7)

The templates name no metaclass. They read the simulation roles, so they apply to every metamodel bound to a
state machine profile that has these roles:

- `stc.nodes`: the **Node** role, for the list of states in the header;
- `stc.events`: the **Event** role, derived from the **Trigger** reference;
- `stc.source(t)`, `stc.target(t)`, `stc.trigger(t)`: the **Owned transitions** (or **Source**), **Next state** and
  **Trigger** roles, for the comment of each transition;
- `target.ids` and `target.ref(element)`: the table of element ids, and the name of one element in it;
- `target.net` and `target.initial`: the net the simulator compiles from all the roles. That covers **Initial**,
  **Terminal**, the state attributes, the transitions with their arcs, and the sites of the **Guard**, **Action** and
  **Entry** roles;
- `target.guard(site)`, `target.actions(site)`, `target.equation(d)`: the **Guard**, **Action** and **Entry** roles,
  and the derived attributes, printed in JavaScript.

## Running it in Jjodel

You need no console and no JjScript: the example is a Jjodel project, ready to import.

1. **Get the file.** Download `turnstile.jjodel` from the Jjodel site, at `/examples/codegen/turnstile.jjodel` (for
   example `https://<the Jjodel site>/examples/codegen/turnstile.jjodel`). In the repository it is
   `frontend/public/examples/codegen/turnstile.jjodel`.
2. **Import it.** On the Projects page press **Import** and drop the file on the page, or use **File → Import
   Project** and choose it. The project shows up as **Turnstile copy**: Jjodel adds `copy` to every imported project.
   Importing the file again gives **Turnstile copy2**, a separate project with its own ids.
3. **Open the model.** Open the project, then the model **demoESM**. The metamodel already has the **Extended state
   machine** profile, the templates and the two data attributes; the model already has the scenario.
4. **Turn on the Code panel**, once per browser: Settings (the avatar at the top right, then **Settings**, or Ctrl+,)
   → **Advanced** → **Experimental** → check **Code generation**.
5. **Generate.** In the model's editor press **Code**, open the **Output** tab and press **Generate**. Hover any
   underlined text to see the model element it came from; click it to select that element on the canvas.
6. **Run.** Press **Run**: `main()` fires the first candidate of the first input, up to five times, and the panel
   shows what it returned.
7. **Check.** The select next to **Check** holds the stored scenario, **Pay twice, pass, stop**. Press **Check**. The
   line under the buttons reads `Agrees with the simulator on 7 steps · Pay twice, pass, stop`: the program and the
   simulator agree on every step.

### Trying the mutation

Break the program on purpose and watch the oracle catch it. The mutation sends `tu` to `unlocked` instead of
`locked`, in the generated program only.

1. Open the **Templates** tab and select `main`. Its body ends with `${engine()}"`.
2. Add this line after `${engine()}`, before the closing `"`, and press **Save**:

   ```js
   for (const t of TRANSITIONS) if (t.id === $ID.tu) t.postset = t.postset.map(a => (a.place === $ID.locked ? { place: $ID.unlocked, weight: a.weight } : a));
   ```

3. Back in **Output**, press **Generate**, then **Check**. The result reads `Diverges at step 5 · tu`, with
   `place locked` and `place unlocked`, the value the simulator expected and the one the program computed. The link
   `tu` selects the transition on the canvas.
4. Delete the line, **Save**, **Generate**: **Check** agrees again.

## What the oracle compares

At the start and after every step, the oracle compares the step's kind (`fired`, `discard`, `quiescence`, `halted`)
and `observe(next)`. The projection holds:

- the marking, without its zeros;
- the data attributes;
- the derived values.

Layout and colours (presentation) are left out. The scenario's final condition is not part of the comparison: it
stays the simulator's own check. A different scenario is recorded in the Simulation panel's **Scenarios** and then
shows up in the select next to **Check**.

### For developers

- **Rebuilding the file.** `frontend/scripts/examples/build-codegen-examples.ts` builds this example from
  `turnstile.json` in a running app and saves the app's own export (File → Download Project). Rerun it when the
  fixture or the project format changes.
- **In the tests.** `npx vitest run src/codegen/oracle src/codegen/examples` runs this example end to end in node,
  including the mutation, and checks the project file.
- **In the browser probes.** `frontend/scripts/probe/codegen-examples.ts` imports the file as a student does;
  `codegen-oracle.ts` and `codegen-check.ts` build the example from the fixture.
- **From the console.** With the Code panel opened once, `await __jjodelOracle.run({ modelId: '<model id>' })` runs
  the oracle on the first stored scenario, and
  `LPointerTargetable.fromPointer('<metamodel id>').state = { genTemplates: <the string in lookup.MM._state.genTemplates> }`
  writes the templates in one go.

## Limits of this template set

- **Input variables.** The program reads none: `inputs` is accepted and ignored. A model with input variables
  diverges, and the oracle says so.
- **Presentation.** The program holds no presentation state. An action that assigns `node.[x]` is refused at
  generation.
