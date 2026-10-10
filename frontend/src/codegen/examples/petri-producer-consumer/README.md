# Producer and consumer: from a Petri net to a JavaScript program, checked by the simulator

This example is a producer and a consumer around a buffer. It is built on the metamodel of the lecture Petri net (the
DemoPetri project, scene 2: `Place` with `tokens`, `Transition` with `guard`, `Arc` with `src`, `tgt` and `weight`),
bound to the **Petri net** profile.

| Places (initial tokens) | Transitions |
|---|---|
| `ready` (1), `produced`, `buffer`, `idle` (1), `busy` | `produce`: ready → produced |
| | `deliver`: produced → ready + buffer, guard `buffer.[tokens] < 2` |
| | `take`: buffer + idle → busy |
| | `consume`: busy → idle |

The guard keeps the buffer at two items at most. Whenever the producer and the consumer can both move, the net has a
**choice**, and the scenario resolves it with its selector.

## What is in the fixture

`petri-producer-consumer.json` holds:

- `lookup`: the metamodel `MM` and the model `M`. The metamodel's `_state` holds the roles and the templates
  (`genTemplates`).
- `jjscript`: the JjScript that builds the model in a new model of DemoPetri, one command per line.
- `scenario`: eight steps, all ε:

  | Step | Fires | Note |
  |---|---|---|
  | 1 | produce | |
  | 2 | deliver | |
  | 3 | produce | chosen over `take` |
  | 4 | deliver | chosen over `take` |
  | 5 | produce | chosen over `take` |
  | 6 | take | the only candidate: the buffer is full, so `deliver`'s guard is false |
  | 7 | deliver | chosen over `consume` |
  | 8 | consume | |

  The final condition is `buffer.[tokens] == 2`.
- `mutation`: change the target of `consume` from `idle` to `ready`. The oracle reports step 8.

## The templates

The program exports `initial()`, `step(state, event, selector, inputs)`, `observe(state)` and `main()`, the same
four functions as the turnstile's. The step is the same too: the simulator's Petri step in JavaScript. It computes
the candidates, checks the selector, applies M' = M − pre + post, and stops when a place would go above the bound.
Only the description of the net differs.

| Template | What it writes |
|---|---|
| `main` | The module: a header listing the places, the printer's runtime, the tables, `initial()`, `engine()` |
| `transition(t)` | One entry per transition of `stc.net`, with a comment `deliver: produced -> ready + buffer` |
| `entry(t, c, comment)` | The entry: id, preset, postset, inhibitor arcs, the printed guard |
| `arcs(list)`, `placeName(p)`, `transitionName(t)` | Arcs written with place names (`x2` for a weight of 2), names by id |
| `ids`, `event`, `declaration`, `derived`, `site`, `engine` | As in the turnstile |

The guard of `deliver` is printed by the JavaScript target profile:
`$guard(() => ($lt($tokens(state, "buffer"), 2)))`.

### The roles the templates read (R-GEN-7)

- `stc.net.places` and `stc.net.transitions`: the net compiled from these roles:
  - **Node** (the places);
  - **Transition**;
  - **Arc**, with **Arc source**, **Arc target** and **Arc weight**;
  - **Inhibitor arc**;
  - **Initial marking**.
- `stc.nodes` and `stc.transitions`: the **Node** and **Transition** roles, for the names.
- `target.guard(site)`: the **Guard** role, printed in JavaScript.
- `target.net` and `target.initial`: the same compile with the state attributes. The bound and the initial
  marking come from here.

Every metamodel bound to the Petri net profile with these roles gets the same program from this set.

## Running it in Jjodel

1. Settings → Advanced → turn on **Code generation** (experimental).
2. Import the DemoPetri project. In the metamodel, open the Simulation panel and apply **Petri net**.
3. Create a new model of DemoPetri. Run the `jjscript` lines of the fixture on it as JjScript at M1 (Jjodie's
   «Run as JjScript», with the new model open). They create the five places, the four transitions and the ten arcs:

   ```
   create instance of Place "ready"
   set ready.tokens = 1
   ...
   create instance of Arc "a1"
   set a1.src = ready
   set a1.tgt = produce
   ...
   ```

4. Put the templates on the metamodel, in the **Templates** tab of the Code panel. Or, in the browser console, run
   `LPointerTargetable.fromPointer('<metamodel id>').state = { genTemplates: <the string in lookup.MM._state.genTemplates> }`.
5. Open the model, press **Code**, then **Output**: the program is generated. **Run** fires up to five steps, the
   first candidate each time, and shows the marking by place name.

## Running the oracle

The oracle runs the same way as for the turnstile:

- **In the app.** Record the scenario in the Simulation panel's Scenarios, choosing each transition as in the table
  above, and save it. Open the Code panel once, then run `await __jjodelOracle.run({ modelId: '<model id>' })` in
  the console.
- **In the tests.** `npx vitest run src/codegen/oracle`.
- **In the browser probe.** `frontend/scripts/probe/codegen-oracle.ts`.

The comparison at every step is the step's kind and the observed state: the marking without its zeros, the data,
and the derived values. The first step that differs is reported, with the transition fired there and the generated
line whose origin is that transition.
