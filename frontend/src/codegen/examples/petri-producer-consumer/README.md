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
| `main` | The module: a header listing the places, the table of element ids, the printer's runtime, the tables, `initial()`, `engine()` |
| `transition(t)` | One entry per transition of `stc.net`, with a comment `deliver: produced -> ready + buffer` |
| `entry(t, c, comment)` | The entry: id, preset, postset, inhibitor arcs, the printed guard |
| `arcs(list)`, `placeName(p)`, `transitionName(t)` | Arcs written with place names (`x2` for a weight of 2), names by id |
| `ids`, `arcList`, `event`, `declaration`, `derived`, `site`, `engine` | As in the turnstile |

As in the turnstile, the program names elements through the table `$ID` (R-GEN-17): every element id appears once,
in `const $ID = Object.freeze({ producerConsumer: 'M', ready: 'ready', … })`, and the entry of `deliver` reads

```js
id: $ID.deliver, name: 'deliver',
preset: [{ place: $ID.produced, weight: 1 }], postset: [{ place: $ID.ready, weight: 1 }, { place: $ID.buffer, weight: 1 }], inhibitors: [],
```

The guard of `deliver` is printed by the JavaScript target profile:
`$guard(() => ($lt($tokens(state, $ID.buffer), 2)))`.

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
- `target.ids` and `target.ref(element)`: the table of element ids, and the name of one element in it.

Every metamodel bound to the Petri net profile with these roles gets the same program from this set.

## Running it in Jjodel

You need no console and no JjScript: the example is a Jjodel project, ready to import, with the net already built.

1. **Get the file.** Download `petri-producer-consumer.jjodel` from the Jjodel site, at
   `/examples/codegen/petri-producer-consumer.jjodel` (for example
   `https://<the Jjodel site>/examples/codegen/petri-producer-consumer.jjodel`). In the repository it is
   `frontend/public/examples/codegen/petri-producer-consumer.jjodel`.
2. **Import it.** On the Projects page press **Import** and drop the file on the page, or use **File → Import
   Project** and choose it. The project shows up as **Producer-consumer copy**: Jjodel adds `copy` to every imported
   project. Importing the file again gives **Producer-consumer copy2**, a separate project with its own ids.
3. **Open the model.** Open the project, then the model **producerConsumer**. The project also holds `demoNet`, the
   net of the DemoPetri scene, which this example does not use. The metamodel already has the **Petri net** profile
   and the templates; the model already has the scenario.
4. **Turn on the Code panel**, once per browser: Settings (the avatar at the top right, then **Settings**, or Ctrl+,)
   → **Advanced** → **Experimental** → check **Code generation**.
5. **Generate.** In the model's editor press **Code**, open the **Output** tab and press **Generate**.
6. **Run.** Press **Run**: `main()` fires up to five steps, the first candidate each time, and shows the marking by
   place name.
7. **Check.** The select next to **Check** holds the stored scenario, **Fill the buffer, then consume**. Press
   **Check**. The line under the buttons reads
   `Agrees with the simulator on 8 steps · Fill the buffer, then consume`.

### Trying the mutation

The mutation sends `consume`'s token to `ready` instead of `idle`, in the generated program only.

1. Open the **Templates** tab and select `main`. Its body ends with `${engine()}"`.
2. Add this line after `${engine()}`, before the closing `"`, and press **Save**:

   ```js
   for (const t of TRANSITIONS) if (t.id === $ID.consume) t.postset = t.postset.map(a => (a.place === $ID.idle ? { place: $ID.ready, weight: a.weight } : a));
   ```

3. Back in **Output**, press **Generate**, then **Check**. The result reads `Diverges at step 8 · consume`, with
   `place idle` and `place ready`, the value the simulator expected and the one the program computed. The link
   `consume` selects the transition on the canvas.
4. Delete the line, **Save**, **Generate**: **Check** agrees again.

## What the oracle compares

At every step, the step's kind and the observed state: the marking without its zeros, the data, and the derived
values. The first step that differs is reported, with the transition fired there and the generated line whose
origin is that transition.

### For developers

- **Rebuilding the file.** `frontend/scripts/examples/build-codegen-examples.ts` builds this example in a running
  app: it imports the DemoPetri scene, creates a new model, runs the fixture's `jjscript` lines on it, names it
  `producerConsumer`, writes the roles, the templates and the scenario, and saves the app's own export (File →
  Download Project). Rerun it when the fixture or the project format changes.
- **Building the net by hand.** Run the `jjscript` lines of the fixture as JjScript at M1 on a new model of
  DemoPetri (Jjodie's «Run as JjScript», with the new model open). They create the five places, the four transitions
  and the ten arcs.
- **In the tests.** `npx vitest run src/codegen/oracle src/codegen/examples`.
- **In the browser probes.** `frontend/scripts/probe/codegen-examples.ts` imports the file as a student does;
  `codegen-oracle.ts` and `codegen-check.ts` build the example from the fixture.
- **From the console.** With the Code panel opened once, `await __jjodelOracle.run({ modelId: '<model id>' })` runs
  the oracle on the first stored scenario, and
  `LPointerTargetable.fromPointer('<metamodel id>').state = { genTemplates: <the string in lookup.MM._state.genTemplates> }`
  writes the templates in one go.
