# Discovery: the simulator's state UI (R-SIM-102..107, R-SIM-109)

Prompt-ID: P-2026-10-02-2340 · prompt `docs/prompts/claude_2026-10-02_2340_prompt_discovery_sim_state_ui.md` · chat C-2026-10-02-2340 · session `3c256d8d-7ebf-475b-8622-5910bcd481dc` · tree `~/jjodel-w-simstate`, branch `sim-state-disc`, HEAD `60b60c31d` · executor Claude Opus 5.5 (`claude-opus-5-5`). A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files. [M] measured in this phase on `60b60c31d`, [R] read.

## 0. Answer in brief

**Answer.** Every row fits the simulator's own files: no critical-zone file, no `EditorV2.tsx` edit, no new dependency. The run already holds what the UI needs; the measured costs are small: about 100 B per kept configuration on the four demo scenes (100 KiB for 1000), 3.2 KB on a 62-global σ; replay 3–13 µs a step, and it rebuilds the live σ exactly (4/4). Three gaps: the trace does not record input values (R-SIM-88), so a step that read one cannot be replayed; «Written by»/«Read by» needs one 10-line AST walk; and viewing a past step changes what `isSimActive` returns, which IR views read.

**Recommendation: three lanes.** Lane A (run model, pure) and Lane B («State» dialog) run in parallel, then Lane C (panel, inspector, canvas). All three merge into an integration branch `sim-state-ui` cut from the trunk; the trunk merge waits for Alfonso (R-SIM-109). Files and tests: §8.
- **A, `sim-state-model`, no visual check:** `simRunState.ts`, `simViewerPrefs.ts` (new), `simBridge.ts`, `simCanvasState.ts`, and four test files (one new). It changes nothing on screen.
- **B, `sim-state-dialog`, visual:** `SimRolesModal.tsx`/`.scss`, `SimDataModal.tsx`, `simRoleStatus.ts`, `simStateUsage.ts` (new), and two test files.
- **C, `sim-state-face`, visual, after A:** `SimulationPanel.tsx`, `simulation-panel.scss`, `SimInspector.tsx`/`.scss` (new), `SimNodeRunState.tsx`, `simNodeRunState.scss`, `SimCanvasLayer.tsx` (new).

**Decisions awaiting Alfonso (RC-26).**
1. What the MODELS demo shows (§7). Lane C changes the M1 face in all four scenes: Marking chips, Events above the buttons in PEST and ESM, one status line, Watch rows in ESM and Flow B. Step's top moves once and then stays put. Lane B renames «Data» to «State» in the ESM and Flow B steps. Lane C also adds a canvas switch, off by default. Recommended: the demo shows Lanes B and C as built; the inspector and the navigable trace stay an optional beat.

**Questions.**
1. Where the inspector docks. Recommended: a floating card mounted by the panel itself, right of it (left 584 px, bottom 16 px), 400 px wide and clamped clear of the MiniMap and the rail. A dock tab hides the canvas the inspector must show; the rail belongs to Properties (§1).
2. The `.smv` Export preview. Recommended: drop it, as R-SIM-103 allows. At M2 it can only print metaclass-level pseudo-VARs, and `DEFINE` needs the deferred exporter's JjEL→nuXmv translation and renaming (§2).
3. «Written by»/«Read by». Recommended: the names come from `compileAction`, `compileGuard` and `compileDerived`, plus one exported StateAccess walk. Match by name, with the root (`model`/`self`/`node`/path) qualifying it. Compute on row selection, never in `mapStateToProps`: 0.009–0.013 ms per full scan [M] (§3).
4. Kept configurations. Recommended: cap 1000 in `simCommit` (`simRunState.ts`); the replay in `simBridge.ts`, from `net.initial` over the recorded selectors, with `inputs?` added to `SimTraceStep`; no checkpoints. The canvas reads a cached viewed record through the existing `getSimNodeState` (§4).
5. Viewer preferences. Recommended: `simViewerPrefs.ts`, per model `{ pins | null, tags, globalsCard, inspectNode }`, with its own version channel, never the `'mark'` one. Lost on reload; kept across Reset, Stop and a model switch. `runSignature` reads only the lookup (§5).
6. The «Data» label. Recommended: rename the six visible strings and leave every identifier and class (rule 2). The probe kit outside the repo reads two of them (§6).
7. The demo, scene by scene: §7. Recommended: Lane A is demo-neutral; prove it with the readings oracle before merge.

Cross-front: R-SIM-108's presentation reader (P-2026-10-02-2345) belongs in `simRunState.ts`, a Lane A file. Recommended: Lane A exports it, reading the viewed configuration, and D2's Phase 2 consumes it (§8.4).

---

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | An rc-dock tab can sit beside the editor and show the inspector with the canvas visible. | **Falsified [R].** `DockManager.open` docks every tab `'middle'` in `children[0]`, the editors' own panel (`DockManager.tsx:114`); an active sibling tab hides the editor (`simulation-panel.scss:3-6`). A split was removed with F2 (`Dock.tsx:293`). |
| H2 | The kept configurations cost too much memory for a cap of 1000. | **Falsified [M].** 71–109 B/config on the demo scenes at N=1000, 83–101 B at N=10000; 3252 B on a 62-global σ (§4). |
| H3 | The seed and the trace are enough to rebuild an older configuration. | **Partly [M][R].** The seed is not needed: the trace records each selector, and replay over them equals the live σ 4/4 [M]. Input values are not recorded (`simBridge.ts:1424` puts them in the title only), so a step that read an input cannot be replayed. |
| H4 | «Written by»/«Read by» need a new walk over guards, actions and equations. | **Partly [M].** Equations: `CompiledEquation.reads` exists (`derivedEvaluator.ts:61`). Writes: `compileAction(...).action.target` is a field. Reads in guards and action values need one exported walk; the two existing ones are private (`stcChecks.ts:69`, `derivedEvaluator.ts:78`). |
| H5 | The viewer preferences can be kept outside `runSignature` by construction. | **Holds [R][M].** `runSignature(lookup, modelId, configModelId)` reads only the lookup (`simBridge.ts:670-715`); a whole run leaves it unchanged in 4/4 scenes [M]. |
| H6 | The demo scenes show a σ card under some node today. | **Falsified [M].** In all four scenes σ holds only globals (owner = the model) or nothing: attrs owners 0, 0, 1, 1, element owners 0 (§4). |

## Files read

`frontend/src/components/editor-v2/sim/`: `SimulationPanel.tsx`, `simulation-panel.scss` (1-120), `SimRolesModal.tsx` (1-520, 880-998), `SimRolesModal.scss` (grep), `SimDataModal.tsx`, `simRunState.ts`, `simBridge.ts` (1-116, 540-720, 820-962, 1137-1436), `simCanvasState.ts`, `SimNodeRunState.tsx`, `simRoleStatus.ts` (grep and 600-625), `modelMarkings.ts` (grep). `frontend/src/model/simulation/`: `netTypes.ts`, `netStep.ts`, `derivedEvaluator.ts` (1-510), `actionEvaluator.ts` (1-110), `stcChecks.ts` (60-135, 280-314), `guardEvaluator.ts` (36-100), `guardContext.ts`. Also: `components/editor-v2/EditorV2.tsx` (4255-4290, 4400-4500), `components/abstract/DockManager.tsx` (1-140), `components/abstract/Dock.tsx` (270-455), `components/dock/DockManagerStyles.scss` (grep), `components/editors/properties-with-tree-view.scss` (1425-1520), `components/editors/PropertiesWithTreeView.tsx` (grep), `styles/tokens/_z-index.scss`, `docs/demo/models_2026_simulator_demo.md` (grep and 255-275, 372-384), `docs/spec/claude_spec_2026-09-13_computational_model.md` (210-240, 290-300), `docs/decisions.md` (the rows cited), the proposal `docs/ratifiche/claude_ratifiche_2026-10-02_sim_state_ui.md`, the probe kit `~/.jjodel-lanes/probe-kit/simgate/_tmp_simgate_{common,walk}.ts` (grep).

Benches (gitignored, `frontend/scripts/smoke/`): `_tmp_simstate_load.ts` (decompresses an export of `~/jjodel-demo-exports/` into a raw idlookup), `_tmp_simstate_bench.ts` (applies each scene's preset as the panel's Apply does, `profilePatch` + `boundEstimate`, declares ESM and Flow B as the script does, runs the script's path under `startRun`/`pressInput`, then measures memory and replay), `_tmp_simstate_usage.ts` (read/write sets). Run with `npx --no-install tsx [--expose-gc]`, exit 0 each.

**Positive control of the bench [M].** The bench's lines reproduce the demo script word for word: PEST's ten rows (`push: t3 (locked → locked) fired` … `stop: t5 (locked → off) fired`, `Terminated`), Petri `Marking: lock, p1 ×2` and then `Deadlock` at `p2 ×2, p3`, ESM from `push: discarded, tp guard false` to `coin: tc (locked → locked) halted the run` at `coins = 3, paid = true`, and Flow B's six steps to `Marking: fin · count = 2`, `Terminated` (script §2.1-§2.4, lines 119-134, 183-198, 297-313, 397-407).

## 1. Where the inspector docks (Q1)

| Option | Mount point | Stacking | Canvas visible while inspecting | Files outside `sim/` | Verdict |
|---|---|---|---|---|---|
| (a) rc-dock tab | `DockManager.open` → `dockMove(tab, …children[0], 'middle')` (`DockManager.tsx:97-114`): a sibling tab of the editor in the same panel | inside `.pinnable-dock-root`, `transform-style: preserve-3d` (`DockManagerStyles.scss:133`) | **no**: rc-dock keeps an inactive pane mounted with `visibility: hidden` (`simulation-panel.scss:3-6`); "beside" would need a `'right'` split, the layout F2 removed (`Dock.tsx:293`: «the Properties tab (`structure`) is gone from the dock») | `DockManager.tsx`, `TabDataMaker.tsx`, `closeTabsForEntity` (tab id per model) | Fails R-SIM-106: choosing a step must show the canvas overlay as it was |
| (b) right rail | `PropertiesWithTreeView mode='floating'`, portaled to `<body>`, one global instance (`pages/components/Dashboard.tsx:656`) | `position: fixed; right: 0; z-index: 900` (`properties-with-tree-view.scss:1469-1486`) | yes | `PropertiesWithTreeView.tsx`, `Info.tsx` (the Properties area) | The rail follows the selection; inspecting the run would evict Properties, and the rail is hidden on the doc and manager tabs (`properties-with-tree-view.scss:1447-1458`) |
| (c) wider floating card | none new: rendered by `SimulationPanel` beside its own root; `EditorV2.tsx:4463` unchanged | the panel's: `position: absolute` in `.editor-switch-container`, `z-index: 850` inside the dock (`simulation-panel.scss:18-24, 55-57`) | yes; hides with its editor's tab, as the panel does | none | **Recommended** |

Geometry of (c), read [R]: the panel sits at `left: calc(200px + 16px + 48px + 16px)` (280), `bottom: 16px`, `width: 288px` (`simulation-panel.scss:55-69`). The MiniMap sits at `right: calc(var(--jj-canvas-right-inset, 0px) + 16px)`, `bottom: 16px` (`EditorV2.tsx:4267`). `--jj-canvas-right-inset` is the rail's width plus 8, set on `<body>` by `PropertiesWithTreeView.tsx:655`; the rail's default width is 400 below a 2200 px viewport (`PropertiesWithTreeView.tsx:59, 92`). At 1600 px with the rail open, the free band runs from x 584 (right of the panel plus 16) to x 976 (left of a 200 px MiniMap): 392 px. Recommended: `left: 584px; bottom: 16px; width: 400px`, `max-width: calc(100% - 584px - var(--jj-canvas-right-inset, 0px) - 232px)`, `max-height: calc(100% - 32px)`. Reading a `var()` in a component SCSS is allowed; defining one is not (rule 28). Lane C measures this on the probe at 1600×1000, with the rail open and collapsed. No lane probe was needed here: the costs are structural.

## 2. The `.smv` Export preview (Q2)

What it would read: the abstract declarations of the dialog's draft (`StateAttributeRecord[]`). What nuXmv needs (spec §8, lines 214-222): `VAR` per state component *per owner*; `IVAR` per owner for an input; `DEFINE` for derived values; `ASSIGN init(x)`. And spec line 233: «The **exporter** (a pure function from model + STC to an `.smv` text, no execution) is due between steps 4 and 5». Spec line 297: «nuXmv reserved words are not a user constraint because the exporter renames».

At M2 there is no model, so the preview can print only metaclass-level pseudo-declarations (`visits : 0..5` for State, not `Locked_visits`), which no `.smv` file contains. A faithful `DEFINE paid := coins >= 2` needs the JjEL→nuXmv expression translation and the renaming, the substantive part of the deferred exporter. A preview without them prints JjEL inside `.smv` syntax, and will disagree with the exporter the day it lands. The only code the two would share is the domain printer, about 20 lines. **Recommended: drop.** R-SIM-103 itself says «the discovery may drop it without touching the rest»; the preview returns as the exporter's own output view in the exporter's lane.

## 3. «Written by» and «Read by» (Q3)

What exists [R]:
- Equations: `CompiledEquation.reads`, «The attribute names its `StateAccess` nodes read, in order, once each» (`derivedEvaluator.ts:58-61`); `compileDerived(decls)` runs without the frozen M (`derivedEvaluator.ts:425`).
- E-NODE: also from `compileDerived`, as a `'subset'` defect: «E-NODE: the semantic equation reads the presentation attribute …» (`derivedEvaluator.ts:467`), or E-NODE from the subset checker. So flagging E-NODE before Apply means running `compileDerived` on the draft rows.
- Writes: `compileAction(source).action.target` is a `StateAccessExpr` with `attribute` and `object` (`actionEvaluator.ts:72-89`).
- Reads in guards and action values: no exported collector. `walk` in `stcChecks.ts:69` and `visit` in `derivedEvaluator.ts:78` are private; `inputReads` (`stcChecks.ts:289`) covers inputs only and needs a frozen scope.
- Precise element resolution (which element's `visits`) needs the frozen M (`fold`, `stcChecks.ts:109`), which exists only during a run. The dialog is authoring, so it matches by name and qualifies the name with the root.
- The texts live on M1 objects, as the values of the bound features (`simGuard`, `simAction`, `simEntry`, `simExit`, decoded by `roleValues`), across the models of the metamodel. `modelsOf` (`modelMarkings.ts:55`) is the precedent for that scan.

Prototype [M] (`_tmp_simstate_usage.ts`, existing parsers plus a 10-line walk):

| Scene | Texts | Written by | Read by | Cost per full scan |
|---|---|---|---|---|
| PEST | 0 (no guard or action role) | — | — | 0 |
| Petri | 1 | — | `p3.[tokens]` by t2 guard (a reserved name, not a declaration) | 0.009 ms |
| ESM | 3 | `model.[coins]` by tc action, by tp action | `model.[coins]` by tc action; `model.[paid]` by tp guard; equation of `paid` reads `coins` | 0.012 ms |
| Flow B | 3 | `model.[count]` by f2 action | `model.[count]` by f2 action, f3 guard, f4 guard | 0.013 ms |

E-NODE on a draft [M]: `compileDerived` on `{heat: presentation; bad: semantic, node.[heat] > 2}` gives «bad: E-NODE: `node` is presentation state: a semantic equation cannot read it (R-SIM-18).»

Render path: compute in a `useMemo` keyed on the selected row and the lookup, read once with `store.getState()` as the dialog already does for the Bound estimate (`SimRolesModal.tsx`, `estimate`). Never in `mapStateToProps`, which runs on every dispatch. «Read by» for a concrete row names equations and actions only until R-SIM-108 lands; the view that draws it comes with D2.

## 4. Keeping configurations (R-SIM-106, Q4)

**Memory [M]** (`_tmp_simstate_bench.ts`, `--expose-gc`). Method: run N committed steps keeping each configuration, then drop the list with everything else still alive, and take the heap difference, median of three. PEST and ESM cycle on their events (coin/push; coin, coin, push, push); Petri and Flow B repeat Reset and the script's path.

| Scene | σ shape | N=1000 | B/config | N=10000 | B/config |
|---|---|---|---|---|---|
| PEST | 3 places, 5 transitions, no attrs | 100.3 KiB | 103 | 810 KiB | 83 |
| Petri | 4 places, 3 transitions, no attrs | 84.8 KiB | 87 | 871 KiB | 89 |
| ESM | 3 places, 4 transitions, 1 owner (the model), 1 derived | 69.2 KiB | 71 | 826 KiB | 85 |
| Flow B | 6 places, 5 transitions, 1 owner (the model) | 106.7 KiB | 109 | 990 KiB | 101 |
| ESM + 40 stored + 20 derived globals | 62 globals, 21 derived | 3176 KiB | 3252 | — | — |

The cost is low because `step` shares σ structurally. The marking is copied per step (`netStep.ts:164`); `applyAll` copies the outer map and only the written owners' inner maps (`netStep.ts:228-244`); a discard, a quiescence or a halt reuses σ (`netStep.ts:268-273`). `derived` is rebuilt in full each step (`netStep.ts:307-318`), which is why the heavy variant costs 3.2 KB. A long Play (k = 1000) on a demo scene keeps about 100 KiB; on the heavy σ, 3.1 MiB.

**Replay [M].** Folding `step(net, {state, event}, selector, run.guards, run.actions, run.derived)` from `net.initial` over the trace gives the live σ in 4/4 scenes, and on the heavy one. The cost is 0.003–0.013 ms per step on the demo scenes (10000 PEST steps in 32 ms) and 0.043 ms per step on the heavy σ (1000 in 43 ms). The seed is not needed: the trace records the resolved selector (`simRunState.ts:192-197`), and a draw is already a selector. Two conditions:
1. **Inputs.** `withInputs` (`simBridge.ts:1180`) holds the values for one press only, and they reach only the title: `const asked = (values ?? []).map(…)` (`simBridge.ts:1424`). `SimTraceStep` needs an optional `inputs?: readonly InputValue[]`, recorded by `press` through `simCommit` (`simBridge.ts:1420`), replayed through `withInputs`. Adding an optional property is allowed (rule 11). R-SIM-106, «rebuilt by replay», requires it. No demo scene uses an input (script line 291).
2. **The oracles** are the run's own closures over the snapshot frozen at Reset (`simRunState.ts:69-73`). A replay never re-freezes M, and a model edit withdraws the run anyway (R-SIM-34).

**Where the cap and the replay live.** `simCommit` (`simRunState.ts:207`) appends the configuration of every committed step to a list capped at the last 1000 (`MAX_PLAY_STEPS` is already 1000, `simRunState.ts:103`; a separate constant is clearer). Step 0 is `net.initial`. `configAt(run, n)` in `simBridge.ts` returns a kept configuration or replays from `net.initial`; it needs `withInputs`, private there. No checkpoints: before a click costs 100 ms a run must pass about 25k demo-scale steps, or about 2.3k heavy steps beyond the cap.

**How the canvas reads a past configuration.** Through the readers it already calls, with no new interface for the overlay. `getSimNodeState` (`simRunState.ts:169`) passes `nodeStateOf` a record `{ ...run, config: viewed, halt: n === live ? run.halt : null }`, created once per (run, n) and cached: `enabledElements` caches per record in a `WeakMap` (`simCanvasState.ts:51`), so a fresh object per call would defeat the cache. `isSimActive` and `getSimActiveIds` (`simRunState.ts:132-155`) read the same viewed configuration. Choosing a step or «Back to live» bumps the `'mark'` version, which costs one step's worth of node re-renders. Any press, Reset, Stop or interruption returns to live.

**Propagation (rule 20).** `isSimActive` feeds `ObjectNode`'s highlight (`ObjectNode.tsx:279`) and the IR's `ReadCtx.isMarked` (`irReadCtxLproxy.ts:21, 63`; `viewpoint/ir/` is in the §3.1 table). While a past step is viewed, IR views draw that step's marking, which is R-SIM-106's intent («the canvas overlay as they were»). No IR file is edited, but the Phase 2 prompt names the propagation.

## 5. Viewer preferences (Q5)

Shape (new `frontend/src/components/editor-v2/sim/simViewerPrefs.ts`, names grepped absent, §9):

```ts
export interface SimAttrRef { readonly metaclass: string | null; readonly name: string; readonly space: 'semantic' | 'presentation' }
export interface SimViewerPrefs {
    readonly pins: readonly SimAttrRef[] | null;  // R-SIM-104, at most 4; null = default: the first four declared, globals first
    readonly tags: readonly SimAttrRef[];         // R-SIM-107, default none; the last step's changes are computed, not stored
    readonly globalsCard: boolean;                // R-SIM-107, default false
    readonly inspectNode: boolean;                // R-SIM-109, default false
}
```

- **Keyed and channelled.** Prefs are per `modelId`, as the policy is (`simRunState.ts:105`). They have their own version channel and hook, read by `SimNodeRunState` and the canvas layer, as the choice channel is (`simRunState.ts:116-124`). Never the `'mark'` channel, which re-renders `ObjectNode` and the IR resolvers (`irResolve.ts:84`, `useIRContainment.ts:120`).
- **Reset rules.** Lost on reload (module memory). Kept across Reset, Stop, an interruption, a model switch and the pill's unmount. A pin or tag naming an attribute no longer declared is skipped at render and kept in the list, so an undo of the declaration brings it back. No primitive of the run touches the prefs, as with the policy (R-SIM-101).
- **Never moves `runSignature`.** `runSignature(lookup, modelId, configModelId)` reads only the lookup (`simBridge.ts:670-715`). The module holds plain `Map`s, imports neither the store nor the joiner, and writes no bag. A full demo run leaves the signature unchanged in 4/4 scenes [M]. Phase 2 test, written first: set every pref, then assert `runSignature` byte-identical, the lookup deep-equal to a `structuredClone` taken before, and the `'mark'` version unchanged.

## 6. The label «Data» (Q6)

Visible strings [R], each with its replacement:
- `SimRolesModal.tsx:917` `Data` (the fold title) → `State`.
- `SimRolesModal.tsx:920` and `simRoleStatus.ts:595`: «(a model's globals go in its Data…)» → `State…`.
- `SimDataModal.tsx:88` `` `Data of ${modelName}` `` / `'Data'` → `State of …` / `State`.
- `SimulationPanel.tsx:777` `<span>Data…</span>` → `State…`.
- `SimulationPanel.tsx:880, 882`: title «Declare them in the model's data.» and the button `Declare in Data…` → «…in the model's state.» and `Declare in State…`.

Tests asserting a string: `simRoleStatus.test.ts:891` (`HINT`). The test names at `simBridge.test.ts:2067-2084` only mention «the Data dialog», with no assertion on the text.

Unchanged (rule 2): classes `sim-roles-modal__data*`, `sim-roles-modal__fold--data`, the prop `openOnData`, the type `MetaOptions` comments, the icon `bi-database` (a choice for Lane B).

Outside the repo: the probe kit clicks `Data… (entry)` and `Declare in Data…` (`_tmp_simgate_walk.ts:769, 780`) and reads `.sim-panel__hint--marking` and the «Last step» line (`_tmp_simgate_common.ts:145-147`). The chat updates it with Lanes B and C. Recommended to Lane C: keep `markingLine(...).line` as the `title` of the Marking row and the `Last step: …` text as the `title` of the status line, so the readers change selectors and not strings.

Demo script lines naming «Data»: 62-63, 70, 234-241, 253-254, 259, 275, 279, 361-362, 371, 375, 385, 390.

## 7. The demo, scene by scene (Q7)

| Lane | DemoPEST | DemoPetri | DemoESM | DemoFlowB |
|---|---|---|---|---|
| A | nothing | nothing | nothing | nothing (demo-neutral: `sigma` keeps its semantic-only meaning, no UI calls the new readers; proof: the readings oracle identical) |
| B | the roles dialog's fold reads «State» (State machine turns the declarations off: the fold shows its off reason) | the fold reads «State» | the model dialog is «State of demoESM», two columns, kind chips `VAR` (coins) / `DEFINE` (paid), access path; steps 1-4 of §2.3 keep their clicks | «State of demoFlowB», `count` row with `VAR`; §2.4 steps keep their clicks |
| C | Events move above the transport row (Step's top moves once); one status line; Marking chips (`locked`); no Watch (no attribute) | Marking chips (`lock`, `p1 ×2`); the choice list unchanged; one status line (Step's top 854.5 moves once) | Watch `coins` (range bar 0..3), `paid` (`DEFINE`); Marking chips; Events above; «State…» entry; `Declare in State…` | Watch `count`; Marking chips (`left`, `right` at step 5); «State…»; `Declare in State…` |
| C, canvas | a switch «Inspect node.[x]» and a globals-card toggle while a run exists, both off; no σ card today in any scene [M, H6] | token badges unchanged | globals card off by default; no node tags (σ is globals only) | same as ESM |

Two geometry consequences of R-SIM-104 as ratified, for Lane C to measure and the script to restate:
- Events today sit under the buttons (`SimulationPanel.tsx:919`, after `sim-panel__actions` at `:892`); above the buttons they lower Step in the event scenes.
- The R-SIM-66 slot (`:944-956`, refused Reset, interruption, «Last step») merges into the one status line, which removes a row from under the buttons in all scenes.

Step stays fixed for the whole run, as R-SIM-104 asks; its absolute top changes once. Recommended: the interruption and a refused Reset take the last-step part of that line, keeping R-SIM-66's «one slot, replaced in place».

## 8. Phase 2 plan

Base: an integration branch `sim-state-ui` from `alfonso-frontend-jjtl`; each lane branches from it and merges back, one at a time; the trunk merge waits for Alfonso (R-SIM-109). Order: **A ∥ B**, then **C** after A (and after B, so the labels agree on screen). RC-22 checks:
- DOVE lists disjoint (below).
- B depends on nothing A changes. C depends on A's exports and so is queued.
- One worktree each.

Shape: A has no visual check (pure, with a mutation bench); B and C each have one.

### 8.1 Lane A, `sim-state-model` (R-SIM-102 kinds, 104 data, 106, 107 data, 109 data)

Files: `frontend/src/components/editor-v2/sim/simRunState.ts`, `…/sim/simViewerPrefs.ts` (new), `…/sim/simBridge.ts`, `…/sim/simCanvasState.ts`, `…/sim/__tests__/simRunState.test.ts`, `…/sim/__tests__/simBridge.test.ts`, `…/sim/__tests__/simCanvasState.test.ts`, `…/sim/__tests__/simViewerPrefs.test.ts` (new). Eight files: rule 19, the prompt's DOVE is the confirmation.

Builds:
- `inputs?` on `SimTraceStep`, recorded by `press`.
- The kept configurations, capped at 1000, in `simCommit`.
- `simSetView(modelId, n | null)` / `getSimView`.
- The viewed reads in `isSimActive`, `getSimActiveIds` and `getSimNodeState`, through the cached viewed record.
- `configAt` (replay).
- Pure builders for the face: Watch rows with kind, domain and before→after; Marking chips; the one status line.
- `stateKindOf(decl)` → `VAR | DEFINE | IVAR`.
- `SimNodeState` extended with presentation rows, kinds and the last step's changes. `sigma` stays semantic-only, so the overlay renders as today.
- `simViewerPrefs.ts` (§5).
- The presentation reader R-SIM-108 needs (§8.4).

Tests first; mutation bench on cap, replay with inputs, viewed reads, default pins and the prefs channel. Gates: the four scenes' readings identical to the trunk's. Demo-script lines: none.

### 8.2 Lane B, `sim-state-dialog` (R-SIM-103, R-SIM-102 in the dialogs)

Files: `…/sim/SimRolesModal.tsx`, `…/sim/SimRolesModal.scss`, `…/sim/SimDataModal.tsx`, `…/sim/simRoleStatus.ts`, `…/sim/simStateUsage.ts` (new: the texts of the bound features over `modelsOf`, the exported StateAccess walk, written and read by name with the root), `…/sim/__tests__/simRoleStatus.test.ts`, `…/sim/__tests__/simStateUsage.test.ts` (new). Seven files.

Builds:
- The «State» section: abstract column (globals, then per metaclass) and concrete column (per metaclass), with the arrow «σ is read one way».
- A kind chip from `declarationForm` (`simInputs.ts`, unchanged).
- The access-path column; E-NODE per row before Apply (`compileDerived` on the draft).
- On row selection, «Written by»/«Read by»; the «State of …» title; the hint text; no Export preview.
- The dialog is 640 px wide (`SimRolesModal.scss:38`): two columns need a wider modifier, measured in the lane.

Tests first (the usage table of §3 as fixtures, mutants: root ignored, action value not walked, equation reads dropped). Demo-script lines: 62-63 (title), 234-241, 259-270 (dialog part), 275-287, 361-362, 375-382, 385-393.

### 8.3 Lane C, `sim-state-face` (R-SIM-104, 105, 106 UI, 107, 109, R-SIM-102 on the face and the canvas, R-SIM-103 entry)

Files: `…/sim/SimulationPanel.tsx`, `…/sim/simulation-panel.scss`, `…/sim/SimInspector.tsx` (new), `…/sim/SimInspector.scss` (new, PascalCase as §8.1 asks of paired SCSS), `…/sim/SimNodeRunState.tsx`, `…/sim/simNodeRunState.scss`, `…/sim/SimCanvasLayer.tsx` (new, the globals card and the switch, mounted by `SimulationPanel`; its rules in `simNodeRunState.scss` or `simulation-panel.scss`). Seven files.

The UI imports the joiner, so it has no node bench: its logic is Lane A's, tested there (CLAUDE.md §5, no source-text tests). Checks: the lane probe at 1600×1000, light and dark:
- Step's top constant through each scene's run.
- The inspector inside the editor, rail open and collapsed.
- The viewed step's overlay and highlight.
- Tags and the switch.
- The four scenes' run readings unchanged.

Demo-script lines: 62-63, 70, 119-137, 183-207, 248-254, 259, 297-321, 370-371, 375, 397-409, 429.

Critical zone: no file of any lane is in §3.1. Points that are Alfonso's: §0, decision 1 only.

### 8.4 Cross-front with P-2026-10-02-2345 (R-SIM-108)

R-SIM-108: «The run-state singleton exports a reader of an element's presentation». The singleton is `simRunState.ts`, a Lane A file. Recommended: Lane A exports `getSimPresentation(objectId)`, stored then derived as `stateAccess` resolves it (`netStep.ts:52-57`), on the viewed configuration, and D2's Phase 2 consumes it. Otherwise D2's Phase 2 is queued after Lane A.

## 9. Identifiers grepped before proposing (P12)

`command grep -rn --include='*.ts' --include='*.tsx' --include='*.scss' -e <name> frontend/src`. Positive controls: `sim-panel__hint` 25 hits, `getSimPolicy` 16. Absent (0 hits): `SimInspector`, `sim-inspector`, `simViewerPrefs`, `SimViewerPrefs`, `simStateUsage`, `SimCanvasLayer`, `sim-canvas-layer`, `sim-panel__watch`, `sim-panel__chips`, `sim-panel__marking-chip`, `sim-panel__expand`, `sim-node-run__tag`, `sim-node-run__tags`, `sim-canvas-globals`, `stateKindOf`, `SimStateKind`, `useSimViewVersion`, `getSimViewerPrefs`, `setSimViewerPrefs`, `simSetView`, `getSimView`, `configAt`, `keptConfigs`, `SIM_KEEP_CONFIGS`, `sim-roles-modal__state`, `sim-roles-modal__usage`, `sim-roles-modal__decl-kind`, `sim-roles-modal__columns`, `sim-roles-modal__arrow`, `sim-state-chip`, `sim-panel__events-row`. **Taken**: `sim-roles-modal__kind` (5 hits, the first-open picker's cards, `SimRolesModal.tsx:762`), so the chip is not named that.

## 10. Decisions taken (unattended)

None in this lane: a discovery decides nothing. The recommendations of §0 are for the chat to adopt under RC-25. The one it adopts that touches a ratified row's text is the `inputs?` field of the trace (R-SIM-100's shape `{ event, selector, kind, origin? }`). It is required by R-SIM-106, also ratified, which «extends R-SIM-100», so it is recorded as an implementation of R-SIM-106, not an amendment.

## 11. Decisions awaiting Alfonso

1. What the MODELS demo shows after Lanes B and C (§7). Recommended: as built, with the inspector and the navigable trace optional.
