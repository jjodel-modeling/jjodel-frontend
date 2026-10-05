# Discovery: two console errors on the demo scenes (P-2026-10-04-1025)

Prompt `docs/prompts/claude_2026-10-04_1025_prompt_console_errors_discovery.md`, chat C-2026-10-03-1610, branch
`console-errors-disc` cut from `alfonso-frontend-jjtl` at `5b4d6c887`. Read-only on `frontend/src/`. Probe
`frontend/scripts/probe/console-errors-demo.ts`, run through `lane-run probe … --port 3084 --id P-2026-10-04-1025`,
headless Chromium, 1600×1000, light theme (no `data-theme` attribute, the default). [M] measured by the probe,
[R] read in the code.

## 0. Answer in brief

**Neither error can hurt the MODELS demo:** console-only, no lost write, save and the user's exports intact, nothing
on screen (only toast `Project Saved!`, no error boundary, Reset 18.2–41.2 ms) [M]. **Recommended: leave both until after Málaga.**

**E1 «Invalid action path 0».**
- **When:** only on an in-page (hash) open from the dashboard, 20 of 20; on fresh-document opens 0 of 20 [M]. The
  demo opens through the card or the recents, which reload (`R.navigate`).
- **Who:** `PathChecker.tsx:14` → `U.resetState` → `DState.init_editor` «init jodel state» (`store.tsx:245`) →
  `DViewPoint.newVP` → `setExternalPtr` (`classes.ts:636`): `SetFieldAction` `idlookup.<opened project>.viewpoints
  += Pointer_ViewPointDefault` on the reset's empty state, which holds no project.
- **Consequence:** `reducer.ts:545-546` rolls back the 56-action batch (empty LOAD, Default viewpoint, primitive
  types); the project's LOAD follows, and the store equals a fresh open's by name, 20 of 20 [M]. A no-op.

**E2 «Cannot serialize in ecore, found loop».**
- **No cycle:** `LModel.get_roots` returns every object (its `isRoot` filter is commented out,
  `LModelElement.tsx:5759`), so the M1 serializer (`:5212`) meets `t1` (PEST) or `tc` (ESM) again as a «root»
  after writing it inside `State.transitions`. Non-containment references are never followed.
- **Who:** `wrapSelectedElement` (`eval.ts:937`) reads the six deep `ecore` aliases of the selected M1 model, via
  `buildEvalContext` ← `startRun` ← Reset (`SimulationPanel.tsx:551`), and on ESM also ← the model tab's sim-check
  sync (`SimCheckProblemSync.tsx:58`). The proxy returns a `MyError` object.
- **When [M], 5 of 5 pages:** 6 per Reset on PEST and ESM, plus 6 per model-tab open on ESM; 0 on Petri and FlowB
  (no composition); 0 at open, presses, board and save.
- **Consequence:** the save round trip is identical; `.ecore` and `.xmi` match the store field by field, 0
  mismatches. Only the legacy Ecore JSON of an M1 model is broken, and no UI path calls it.

**Smallest fixes** (§5): E2, one line at `LModelElement.tsx:5212` skipping `!obj.isRoot`; E1, in `U.resetState` or
`DState.init_editor`. None in the critical zone, no reducer change (R-UNDO-7/8 untouched), all core files (rule 5).

**Decisions taken (unattended).** The card and recents reload, so the demo's open is the fresh one (§2.1). The model
tab is opened by `DockManager.open2`: the scenes open with only the metamodel's tab (§1).

**Decisions awaiting Alfonso.**
1. Fix before the 2026-10-07 freeze or after Málaga (the prompt reserves the choice to him; both fixes touch core).
   Recommended: after Málaga, E2 first; nothing the audience sees changes, and a freeze-window merge costs more than
   the noise.

## 1. Method

**The probe** is `console-errors-demo.ts`. Before the app boots, an init script hooks `console.error`, `window`
`error` and `unhandledrejection`, and raises `Error.stackTraceLimit` to 60 so that `Action.stack` reaches its
origin. That stack is a string the app already keeps on every action; nothing else changes.

**What each record holds.**
- For E1: the action (type, class, `field`, access modifier, value), its creation stack, whether its target id is in
  the reduced state and in the live state, and the batch it rolls back. The batch is the last entry of
  `window.jjactions`, which `reducer.ts:619` keeps. 2.5 s later the probe reads every write of that batch in the
  live state.
- For E2: the call stack, the element where the check fires, and the visited set in insertion order.

**Stacks** are mapped to source lines through the inline source maps of the dev server. **Duplicate lines:** every
E2 prints two console lines, and the line whose stack holds `new MyError` is counted as a duplicate (`dup`). The
counts below are occurrences, duplicates excluded.

**Two open modes, five fresh browser contexts per scene in each, four scenes: 40 pages.**
- **load:** import the fixture on the dashboard, then open `/#/project?id=` as a new document: a deep link, a reload,
  or the card click after its reload. Then the demo's steps (§2 and §3 of `docs/demo/models_2026_simulator_demo.md`):
  - configure, in the page, as the panel's Apply writes it (`profileBindings`, `profilePatch`, the model's globals
    for ESM and FlowB), the route `io-board-lane1.ts` uses;
  - the model tab;
  - the `Simulation` chip;
  - Reset;
  - the script's presses, clicked on the panel's buttons, the Petri choice list included;
  - the I/O board, opened and closed;
  - Cmd+S.

  On rep 1 of PEST and ESM it also compares the exports with the store, reads the legacy getters, runs a walker
  that mirrors the M1 serializer, and does the save round trip.
- **hash:** import, then `page.goto('#/project?id=')` from `/#/allProjects` in the same document, the earlier probes'
  route. Open only.

**Fixtures:** `frontend/scripts/probe/fixtures/scene_{1..4}_*.jjodel`, byte copies of `~/jjodel-demo-exports/`
(`cmp` identical) and unmodified.

**Positive controls, all PASS.** Every load run reaches the script's last step on the panel (for example
`Last step: stop: t5 (locked → off) fired` on PEST). Cmd+S saved every run (`lastModified` moved, toast
`Project Saved!`). The I/O board opened in every run.

**Logs:** `~/.jjodel-lanes/P-2026-10-04-1025/probe-console-errors-demo.log` holds two smoke runs and parts 1
(PEST, Petri) and 2 (ESM, FlowB), each ending `EXIT=0`. JSON in `frontend/scripts/smoke/_tmp_console-errors-demo_{1,2}.json`
(gitignored).

**Not covered.** The M2 face's clicks (toggle, `Configure…`, kind, Continue, Apply) ran as the in-page Apply. The
probe's own legacy-getter reads (step `export (probe-induced)`) are excluded from the demo counts.

## 1.1 Counts

Each cell reads E1 · E2. An entry `n (k/5)` means n occurrences over k of the 5 pages; duplicates are excluded. The «step» column covers all the script's presses. «reload» is the round trip on rep 1.

| Mode | Scene | Pages | boot | open | configure | model tab | panel | reset | step | board | save | reload |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| load | PEST | 5 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 30 (5/5) | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 |
| load | Petri | 5 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | — |
| load | ESM | 5 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 30 (5/5) | 0 · 0 | 0 · 30 (5/5) | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 |
| load | FlowB | 5 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 | — |
| hash | PEST | 5 | 0 · 0 | 5 (5/5) · 0 | | | | | | | | |
| hash | Petri | 5 | 0 · 0 | 5 (5/5) · 0 | | | | | | | | |
| hash | ESM | 5 | 0 · 0 | 5 (5/5) · 0 | | | | | | | | |
| hash | FlowB | 5 | 0 · 0 | 5 (5/5) · 0 | | | | | | | | |

**Intermittency, which was not reproduced.** E1 fired on 20 of 20 hash opens, 5.0–5.9 s after the dashboard booted, and on 0 of 20 fresh opens. E2 fired on 10 of 10 Resets of PEST and ESM and on 5 of 5 ESM model-tab opens, and on 0 Resets of Petri and FlowB.

**What explains the «intermittent» of the earlier tickets.** Each earlier probe opened a scene either way. E2 also depends on the selection, §3.1.

**Other console errors.** One other kind appeared: `init_dash` (`store.tsx` `init_dashboard`, a bare `console.error`), once per dashboard boot, 40 of 40. No uncaught error and no unhandled rejection was seen.

## 2. E1, «Invalid action path 0»

### 2.1 Who dispatches it

The action and its creation stack, identical in all 20 hash opens apart from the project id [M]:

```
SetFieldAction  field idlookup.<project id>.viewpoints  am "+="  value "Pointer_ViewPointDefault"  isPointer true
  SetFieldAction.create          redux/action/action.ts:525
  Constructors.setExternalPtr    joiner/classes.ts:636
  Constructors.DViewPoint        joiner/classes.ts:1286
  DViewPoint.newVP               view/viewPoint/viewpoint.ts:135
  TRANSACTION «init jodel state» redux/store.tsx:245-246
  DState.init                    redux/store.tsx:236
  stateInitializer               redux/reducer/reducer.ts:1509
  U.resetState                   common/U.tsx:452
  PathChecker effect             components/pathChecker/PathChecker.tsx:14
```

**The throw site.** `deepCopyButOnlyFollowingPath` (`reducer.ts:101`) is reached from `CompositeActionReducer`
(`:545`). The key `<project id>` is in neither the reduced state nor the live state at that moment. The reduced
state's `idlookup` has 1 entry and no `DProject`.

**The project id is the imported project the page is opening.** `DUser.current`'s project already points at it, and
the reset's fresh `DState` does not hold it.

**When PathChecker resets.** It does so on a change of `openKey(pathname, search)` after its first render
(`PathChecker.tsx:12-16`), so only an in-page navigation fires the reset. A fresh document skips the first effect,
and its `stateInitializer` runs from `App.tsx` (the hash-change report's map, rows 1, 4 and 7). In a fresh document
the probe measured no E1 at boot, at open, or at any later step: 0 in 20 load runs.

**The demo's own open.** The dashboard card (`pages/components/Project.tsx:194-196`) and the left-bar recents call
`R.navigate`, which sets the hash and reloads. That is the fresh-document case. The in-page route is reached by:
- editing the address bar;
- Back or Forward between the dashboard and a project in one document;
- probes.

### 2.2 Consequence

**What the reducer drops.** `CompositeActionReducer` returns `oldState` (`reducer.ts:546`). It drops the batch:
- 1 LOAD of the reset's empty state;
- the Default viewpoint's creation;
- the `viewpoints +=` write;
- 13 primitive types, each with its `ClassNameChanged` and `ELEMENT_CREATED` writes.

The state stays as it was until `SaveManager.load` dispatches the project's LOAD.

**The store after a hash open matches a fresh open, 20 of 20 [M].** The probe compared it, name by name, with the
store after a fresh open of the same scene: projects, metamodels, models, the viewpoint names, the classes with their
attributes and references, every object with its class, father and slots, both bags, the view elements, the
primitive types, the vertices with their geometry, the edge count, and the count of every `className` in
`idlookup`. Read 2.5 s later, the batch's own writes are present in the live state: `viewpoints` holds
`Pointer_ViewPointDefault`, and `primitiveTypes` holds the 13 types. They come from the project's saved state.

**Verdict: a harmless no-op.** The rolled-back writes would have built an empty editor state that the project's LOAD
overwrites. One residual: if the project's LOAD never came (a failed open), the page would keep the dashboard's state
instead of an empty one. The open-failure guard of P-2026-09-25-0030 (`ProjectsApi.loadError`) already covers save in
that case.

## 3. E2, «Cannot serialize in ecore, found loop»

### 3.1 Who calls it

**The Reset chain**, the same in every load run with E2 at Reset [M]:

```
Log.exx                               common/Log.ts:184 (and MyError's constructor, joiner/classes.ts:3806)
LObject.generateEcoreJson_impl        model/logicWrapper/LModelElement.tsx:6620   at DObject:t1 (PEST)
LModel.generateEcoreJson_impl         LModelElement.tsx:5212   the M1 root loop: for (obj of roots)
LModel.get_deepCrossEcore             LModelElement.tsx:523    (also via get_eCore :507, get_ecore :506, …)
TargetableProxyHandler.get            joiner/proxy.ts:284, :401
wrapSelectedElement                   jjscript/executor/commands/eval.ts:937   me[key] for every own key
buildEvalContext                      eval.ts:331   variables['data'] for _lastSelected.modelElement
startRun                              components/editor-v2/sim/simBridge.ts:616
onReset                               components/editor-v2/sim/SimulationPanel.tsx:551
```

**The selected element at Reset** was the M1 model in every load run (`DModel:demoSM`, `DModel:demoNet`, and so on)
[M]. `DockManager.open2` selects the model when it opens the tab.

**Why six per Reset.** `wrapSelectedElement` reads six deep aliases, and each fails: `ecore`, `eCore`, `crossEcore`,
`ownEcore`, `deepCrossEcore`, `deepOwnEcore`. The shallow aliases serialize no features and pass. Each failure prints
two console lines, which makes the I/O board probe's «24 plus 24 stack lines».

**That report's «around save» is a misattribution.** Its probe calls `startRun` twice and `buildEvalContext` twice
directly: 4 × 6 = 24 [R, `io-board-outputs.ts` START]. The save step itself has 0 E2 here, in every run [M].

**The second caller, on ESM only: the model tab [M].** When the model tab opens, the same chain runs from
`SimCheckProblemSync.tsx:58` → `reconcileSimCheckProblems` (`problems/simCheckToProblems.ts:174`) → `startRun`, which gives
6 more per page, 5 of 5. Where E2 fires is the same in both cases. A Reset with an object selected, rather than the
model, gives `data` = an `LObject`. Its serializer follows containment only, with no root loop, so it does not fire
[R]. This is why the earlier tickets read E2 as intermittent.

### 3.2 The «loop»: a revisit, not a cycle

**The visited set when the check fires on PEST [M], 25 entries in insertion order.** It starts `DModel:demoSM`,
`DObject:locked`, `DValue:transitions`, `DObject:t1`, … and ends `… DObject:off`, `DValue:transitions`,
`DObject:coin`, `DObject:push`, `DObject:stop`. The check then fires `at DObject:t1`.

**What the walker shows.** The probe's walker mirrors the serializer: the root loop over `m1.roots`, the features,
and the containment values only. It gives:
- `roots` = locked, unlocked, off, coin, push, stop, **t1, t2, t3, t4, t5**;
- `isRoot` true only for the first six;
- the first revisit is `t1`, through the root loop, with father `DValue:transitions`, first visited as contained in
  `locked.transitions`.

**The two causes.** `LModel.get_roots` (`LModelElement.tsx:5758-5760`) is `return this.get_objects(context,
includeCross);//.filter( o => o.isRoot);`. And `LObject.get_isRoot` (`:6597`) is `father.className === DModel.cname`.

**Which models fire it.** Every M1 model whose metamodel has a composition fails the first time the serializer
reaches a contained object as a «root». A model without composition never does. In the four scenes [M], only DemoPEST and DemoESM have a containment reference, `State.transitions`. DemoPetri and DemoFlowB have none, and they give 0 E2.

**Non-containment references are not followed.** `LValue.generateEcoreJson_impl` (`:8161-8183`) pushes a value
that is not a proxy as it is. The visited set never holds an object after a `DValue:nextState` or `DValue:event`.
The walker's 10 non-containment slots on PEST (`t1.nextState -> unlocked`, `t1.event -> coin`, …) take no part in
the failure.

### 3.3 Consequence

- **Save round trip [M].** On PEST and ESM: Cmd+S, then reload the page, then compare name by name with the state
  before save (the same fields as §2.2). The result is **identical**: 0 differences. PEST has 11 objects, 1 view, 16 vertices and 20 edges before and after; ESM has 10, 1, 15 and 17. The bags hold the preset written before save, and ESM's `simStateAttributes`. Save serializes the state (`U.compressedState`,
  `projects.ts:157`) and never calls the Ecore JSON.
- **User exports [M].**
  - `EcoreService.exportToXML(metamodel)`: on PEST 5 of 5 classes and 3 of 3 references; on ESM 5 of 5 classes and 7 of 7 features; abstract flags, supertypes, eType, containment and upperBound all match; 0 mismatches, 0 parse errors.
  - `XMIService.exportToXML(model)`: on PEST 11 of 11 objects and 12 of 12 non-empty slots; on ESM 10 of 10 objects and 16 of 16 slots; containment written as children, references as ids; 0 mismatches.
  - Neither calls `generateEcoreJson`.
- **Legacy Ecore JSON [M].** On the metamodel, all eight getters return JSON (PEST 1233 bytes). On the M1 model the
  six deep getters return `{"className":"MyError"}` (23 bytes, 1.4–2.8 ms each), because the proxy catches the throw
  and hands back the error. `SaveManager.exportEcore(M1)` returns the same. Callers [R]:
  - `SaveManager.exportEcore_click` (`SaveManager.ts:62`) has no caller in `src/`;
  - the `eCore/JSON` language of `DV.tsx:400-419` is reachable only through a user's `M2T(...)` script, since the
    `Languages` tab is no longer built (`Dock.tsx:348`).
- **In the run [M].** `data.ecore` in the JjEL context of a run is a `MyError` object, read by no guard of the demo
  scenes. The scripts' guards read `model.[…]` and `X.[marked]`.

## 4. Visibility

**Nothing the audience sees [M].** Across the 20 load runs:
- the only toast is `Project Saved!` after Cmd+S;
- the error-boundary count is 0;
- every run reaches the script's last line on the panel;
- the I/O board opens.

**Reset is not slower.** The Reset click handler takes 18.2–41.2 ms across the four scenes. On PEST it runs the six
failed serializations, about 10 ms of it. Petri, without E2, takes 18.7–28.6 ms.

**E1 is not visible either.** It fires about 5 s after the dashboard boots, in the 0.3 s hash open, before the
canvas renders. Only DevTools shows either error.

## 5. Smallest fixes

| | Fix | File | Critical zone (prompt's list, CLAUDE.md §3.1) | Reducer / R-UNDO-7, R-UNDO-8 |
|---|---|---|---|---|
| E2 | In the M1 branch of `LModel.generateEcoreJson_impl`, skip `obj` when `!obj.isRoot` (one line at `:5212`) | `model/logicWrapper/LModelElement.tsx` | no | not touched |
| E2, optional | `wrapSelectedElement` skips the eight `ecore` aliases (a JjEL context does not need a whole Ecore JSON of the selection; removes ~10 ms per Reset) | `jjscript/executor/commands/eval.ts` | no | not touched |
| E1 | In the reset path: either `U.resetState` lets the empty LOAD land before `stateInitializer` (the E3 emulation of `discovery_2026-09-25_hash_change_open.md`), or `DState.init_editor` does not add the Default viewpoint to a project the state does not hold | `common/U.tsx` or `redux/store.tsx` (`joiner/classes.ts` if the guard goes in `setExternalPtr`) | no | not touched: the reducer's rollback is correct, the action is wrong |

**Rejected alternatives.**
- **Un-commenting `.filter(o => o.isRoot)` in `get_roots`.** It changes every reader of `roots`: JjEL, XMI, the
  tree. That is a wider change than the one-line skip in the serializer.
- **Making `deepCopyButOnlyFollowingPath` skip the bad action instead of rolling back.** That edits the reducer's
  transaction semantics, the ground of R-UNDO-8. It would also commit a half-batch: the empty LOAD without its
  viewpoint.

**What a fix needs.** All three files are core (rule 5) and none is in the prompt's critical-zone list. A Layer
Impact Report is not required (§3.2 lists none of them), but each fix touches the L-layer (E2) or the load path (E1).
A fix lane should measure:
- E2: the save round trip and the M1 `ecore` on PEST and ESM;
- E1: the 20-of-20 open equality, again.

## 6. Recommendation and risk

| Option | Risk |
|---|---|
| **Leave both until after Málaga (recommended)** | None for the audience: console only, measured over 40 pages. The probe gate «the scenes open with no console error» (P-2026-10-03-1630) stays red on hash opens (E1) and on Reset with the model selected (E2); probes should count them as known. |
| Fix E2 before the freeze | A core L-layer change in the freeze window, to remove six console lines per Reset. Low code risk (one line), but it adds a merge and a re-run of the readiness probes for nothing the audience sees. |
| Fix E1 before the freeze | Touches the load path during the freeze for a route the demo does not take. Not recommended. |

**Ticket for after Málaga:** E2's fix, plus a check that the `.ecore` of an M1 model is complete. E1, low.
