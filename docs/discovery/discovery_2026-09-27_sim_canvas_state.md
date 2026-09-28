# Discovery — the run state on the canvas (S15, G3 canvas side, R-SIM-33 wave 3c)

- Prompt-ID: `P-2026-09-27-1647` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-27_1647_prompt_discovery_sim_canvas_state.md`
- Session: `e86e301c-c0ad-4b2b-a505-27532b28784e`
- Tree: `~/jjodel-icons`, branch `sim-canvas-state`, HEAD `7b66f879f` (the prompt commit; parent `7a4976853`, the trunk
  with E1 merged). `git status` empty at the start.
- Executor: Opus 5.5 (session banner)
- Phase 1, read-only. No file under `frontend/src` was written. One probe ran on 3018 (§5); its files are
  gitignored `_tmp_canvas_*` and are listed in §13.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[M]** measured in this phase, on HEAD `7b66f879f` (a command run, or the probe of §5);
**[R]** read in a file of HEAD `7b66f879f`, or of the branch named. Line numbers are those of HEAD.

---

## 0. Answer in brief

- **The demo's nodes never reach the IR interpreter.** On the Petri preset all 13 nodes of the M1 tab paint through
  the native branch of `ObjectNode`. No viewpoint is active: `viewpoint: ""`, 0 view elements [M, §5]. A default
  IR object view would also be delegated to the native branch (`irDefaults.ts:337`) [R]. So a channel that ends in
  `viewpoint/ir/` (R-SIM-4's four files, R-SIM-18's `data.[x]`) would show nothing on any demo preset.
- **G3's canvas side reproduces on this tree** [M]. After step 1 the run holds `p1:1, lock:1, p2:2`. The canvas still
  reads `tokens = 2` on `p1` and `tokens = —` on `p2`. The only change a step makes in the node layer is one `class`
  attribute on one node (`sim-active`).
- **A smallest channel that leaves R-SIM-4 untouched exists.** It is option A (§7), a per-node overlay in the
  R-SIM-3 pattern. It is mounted by `ObjectNode` next to `NodeProblemIndicator` and fed by derived selectors in
  `sim/simRunState.ts`.
  - It touches **zero critical-zone files**: `nodes/`, `sim/` and `edges/` are not rows of `CLAUDE.md` §3.1 [M].
  - It amends no ratified row, if R-SIM-33 3c's «critical zone» is read as a forecast. That reading is decision A
    of §12.
  - It covers the native, pill and IR branches alike.
- **The candidates are not in the store** [R]. The engine computes them per input, on demand. The pending choice
  list lives in the panel's `useState`. Computing them costs **1.2 to 8.8 µs** per sweep of every input on the demo
  net [M]. The pending list needs the «second channel» R-SIM-33 3c names.
- **Option B**, the IR read surface, is the R-SIM-4 extension proper.
  - Every file it touches is in the critical zone.
  - It amends R-SIM-4 and changes the exported `ReadCtx`.
  - Its ratified form for σ (`data.[x]`, R-SIM-18) needs JjEL inside the IR (J2), which has not landed: no file
    under `viewpoint/ir/` imports `jjel` [M].
  - Recommended: not now.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | S15 needs the critical zone (`viewpoint/ir/`) | **falsified** for the demo presets | 13/13 nodes `native` on Petri [M, §5]; `nodes/`, `sim/`, `edges/` absent from the §3.1 table (`command grep -E 'sim/\|nodes/\|edges/'` over `CLAUDE.md:160-175`, exit 1; control `viewpoint/ir/` in the same window, 1 hit) [M] |
| H2 | S15 amends R-SIM-4 | **partly** | not under option A (no core, no IR file). Holds for option B: R-SIM-18 «L'estensione alle view tocca i file elencati in R-SIM-4» (`decisions.md:1566-1567`) [R] |
| H3 | Today the canvas reads only `isSimActive` | **holds**, with two readers | `ObjectNode.tsx:40` imports `isSimActive, useSimVersion`, and `:271-272` reads them. The IR reads the same function through `ReadCtx.isMarked`, injected at `irReadCtxLproxy.ts:21` and `:63`. The edges read nothing: `command grep -rn -E 'useSimVersion\|isSimActive\|sim-active\|simRunState' edges/ components/`, exit 1; control on `nodes/`, exit 0 [M] |
| H4 | Marking and σ are readable from the store without new engine code | **holds** | `SimRun.config.state` (`simRunState.ts:33-48`) is `SimState` with `marking`, `attrs`, `presentation`, `derived` (`netTypes.ts:82-92`) [R]; `getSimRun` exported (`simRunState.ts:91`) |
| H5 | The candidate transitions are in the store | **falsified** | computed per input by `candidates(net, cfg, guards)` (`netStep.ts:152`) in the bridge (`simBridge.ts:727`, `:847`), never stored; the pending list is panel state (`SimulationPanel.tsx:452`) [R] |
| H6 | The `'mark'` version covers every change a canvas reader needs | **partly** | Marking, σ and halt: yes. The version rises on Reset, on a `fired` or `halted` step, and on Stop (`simRunState.ts:19-23`, R-SIM-36) [R]. A step consumes its event (`simRunState.ts:35`, `config.event` always `null`), so the candidates of each input depend only on σ. The pending list does not rise it: it is set at `SimulationPanel.tsx:723` [R] |
| H7 | A candidate maps onto something the canvas draws | **holds** on Petri, **read** elsewhere | Petri: `origins` `t1 <- t1`, `t2 <- t2`, `t3 <- t3`, three native Transition nodes [M]. `NetTransition.origin` is «for the label and the canvas (3c)» (`netTypes.ts:182`). IR object-as-edge edges carry `data.irObjectId` (`irEdgeViews.ts:251`) [R] |
| H8 | A new reader costs a new subscription per node | **falsified** | `ObjectNode.tsx:271` `useSimVersion();` is unconditional, so every node already re-renders on every bump [R]. A step's DOM effect in the node layer is one `class` attribute [M] |

---

## 2. Objective

Find what a run-state channel into the canvas needs for S15: token counts and σ on the nodes during a run, and the
candidate transitions (R-SIM-33 3c). Four questions:
- where the marking and the candidates would be read, and which components render them;
- the smallest channel that leaves R-SIM-4's core surface untouched, if one exists;
- at least two options, each with its files, whether it amends R-SIM-4, its critical-zone files, its render cost
  and its tests;
- the draft of the Layer Impact Report a Phase 2 would need.

---

## 3. Sources read

Under `/Users/alfonso/jjodel-icons/` unless a branch is named.

- `CLAUDE.md` (§3.1, §3.2, §5, NON-NEGOTIABLE), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md`
  (P4, P8, P9, P13, P16).
- `docs/decisions.md`:
  - R-SIM rows: R-SIM-1 `:1427`, R-SIM-3 `:1436`, R-SIM-4 `:1440`, R-SIM-18 `:1547`, R-SIM-30 `:1661`,
    R-SIM-33 `:1686`, R-SIM-36 `:1722`, R-SIM-82 `:2127`;
  - the «Rinviato» row at `:1502-1504`;
  - R-J7 `:2225`, R-MK-1..12 `:2243-2360`;
  - RC-22, RC-25..27 and RC-30 at `:165-248`.
- `simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` §0, §1, §4.4, §4.9, §5, §7, §8 (via
  `git show`).
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md:308`, `…_readiness_2.md:160-170`, `:291`, `:333-337`.
- `docs/demo/models_2026_simulator_demo.md:22-45`, `:322-341`.
- `frontend/src/components/editor-v2/sim/simRunState.ts` (whole), `sim/simBridge.ts:520-600`, `:700-865`,
  `sim/SimulationPanel.tsx` (the lines cited), `sim/simulation-panel.scss:885-905`.
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx:1-80`, `:100-125`, `:180-300`, `:725-760`, `:860-1000`,
  `:1120-1345`.
- `frontend/src/components/editor-v2/problems/NodeProblemIndicator.tsx` (whole).
- `frontend/src/components/editor-v2/viewpoint/ir/`:
  - read whole: `irReadCtx.ts`, `irReadCtxLproxy.ts`, `irResolve.ts`, `irCompile.ts`;
  - read in part: `irTypes.ts:20-130`, `:670-760`; `irResolveCore.ts:127-190`; `pathExpr.ts:1-60`;
    `irCrossDeps.ts:1-40`; `IRNodeContent.tsx:1-40` and its `readCtx` sites; `useIRContainment.ts:100-140`;
    `useIRFormView.ts:85-115`; `irDefaults.ts:336-356`; `irEdgeViews.ts` (the lines cited).
- `frontend/src/model/simulation/netTypes.ts:70-330`, `netStep.ts:30-70`, `:140-190`.
- `frontend/src/components/editor-v2/types.ts:210-240`, `frontend/src/examples/RowViewSmoke/index.ts:1-60`,
  `frontend/vitest.config.ts`, `frontend/package.json` (test deps).
- Probe helpers, read only, in another tree: `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_common.ts`,
  `_tmp_demo2_scenario.js`, `_tmp_demo2_petri.ts`, `_tmp_demo2_vite.config.ts`.

---

## 4. The render path, model to pixel

### 4.1 The node

1. **D-layer → ReactFlow node.** `useJjomSync` builds the canvas nodes from `idlookup` (critical zone, §3.1). The node
   carries the vertex id. The run-state is keyed on the DObject id, and `idlookup[vertexId].model` maps one to the
   other (`simRunState.ts:10-12`) [R].
2. **`ObjectNode` picks one of three branches** [R]:
   - **IR**: `if (irResolution && !irDelegated)` (`ObjectNode.tsx:891`). The wrapper carries
     `data-viewid={irResolution.compiled.viewId}` (`:909`), and `IRNodeContent` paints the content.
   - **pill**: a singleton holding nothing (`:1145-1190`).
   - **native**: the rest, including every object delegated by a migrated default view (`:118`
     `isMigratedDefaultView`, and `irDefaults.ts:337`
     `if (compiled.viewId === IR_DEFAULT_OBJECT_VIEW_ID) return true;`). Its wrapper carries
     `data-type-display` (`:1199`). The rows are `.mm-object__slot-label` and `.mm-object__slot-value`
     (`:1299-1310`).
3. **The run state reaches the node twice today** [R]:
   - **The highlight, on all three wrappers.** `ObjectNode.tsx:271-272`:
     `useSimVersion();` then `const isSimActiveNode = typeof simObjectId === 'string' && isSimActive(simObjectId);`.
     The class `sim-active` is appended at `:908`, `:1148` and `:1198`. It is painted by
     `simulation-panel.scss:900` `.mm-node.sim-active {`.
   - **The IR `marked` predicate, IR branch only.**
     - `irCompile.ts:198` `channelSink?.add('mark');` and `:199` `if (!p.path) return (ctx, id) => ctx.isMarked(id);`.
     - The source is injected at `irReadCtxLproxy.ts:21`: `const draw = makeDrawReadCtx(idlookup, isSimActive);`.
     - The resolvers gate the invalidation on the declared channel: `irResolve.ts:96`
       `const markDep = markDeclared ? markVersion : 0;`. The same gate sits in `useIRRowView` (`:186`),
       `useIRContainment.ts:120-125` and `useIRFormView.ts:99-104`.
4. **Pixel.** The native branch paints the M1 slot values. A place's `tokens` row is the model's initial marking
   (R-SIM-9, `NetStc.initialMarking`, `netTypes.ts:120-121`), never the run's.

### 4.2 The edges

- `edges/UnifiedEdge.tsx` reads no run state (H3) [M].
- An M1 object drawn as an edge exists only through an IR object-as-edge view. Its synthetic edge carries
  `irObjectId: objectId` (`irEdgeViews.ts:251`) and is decorated in `useIRContainment` (critical zone) [R].
- With no viewpoint, an edge-class object (a Petri `Arc`, a `ControlFlow`) is an ObjectNode. The 12 ReactFlow edges
  of the Petri M1 are its reference edges [M].

### 4.3 Where run state could enter

| # | Entry | Branches covered | Critical zone | R-SIM-4 |
|---|---|---|---|---|
| E1 | a child of the wrapper, mounted by `ObjectNode` like `NodeProblemIndicator` (`:922`, `:1153`, `:1219`) | IR, pill, native | no | untouched |
| E2 | a class or `data-*` attribute on the wrapper, like `sim-active` today | IR, pill, native | no | untouched |
| E3 | the native row renderer (`:1293-1360`), for the initial-marking row | native | no | untouched |
| E4 | `ReadCtx` plus the IR compiler (a label source or predicate reading counts or σ) | IR only | yes | amended |
| E5 | `UnifiedEdge` via `data.irObjectId`, for candidates drawn as IR edges | IR object-as-edge | no | untouched |
| E6 | `useIRContainment`'s decoration of the synthetic edges | IR object-as-edge | yes | untouched (it reuses `'mark'`) |

---

## 5. Measurements [M]

Probe `_tmp_canvas_petri.ts` on 3018. Vite used the scratch cache `/tmp/canvas1647_scratch`. The run exited 0; vite
was stopped after it, and `lsof` on 3018 exit 1. Setup: the Petri preset of the demo, built by the readiness-2
builder, then profile `petri` and Apply through the panel. Bound was left at the Apply value. One page error kind was
seen: `console: failed to get project {project: null}` ×1, at boot, not investigated.

**Branch.** Before Reset:
- `{"irSig":{"viewpoint":"","viewelements":0},"edges":12, …}`.
- Every one of the 13 nodes reads `"branch":"native"`: `p1`, `p2`, `p3`, `lock` (Place), `t1`, `t2`, `t3`
  (Transition), `a1`..`a5` (Arc), `i1` (InhibitorArc).

**G3 on this tree.**

| Moment | Panel line | `getSimRun` marking | Canvas (`name:branch:sim-active:tokens row`) |
|---|---|---|---|
| after Reset | `Marking: lock, p1 ×2` | `{"p1":2,"lock":1}` | `p1 … tokens = 2`, `lock … tokens = 1`, `p2`/`p3` `tokens = —` |
| after step 1 (`t1 (p1 → p2 ×2)`) | `Marking: lock, p1, p2 ×2` | `{"p1":1,"lock":1,"p2":2}` | `p1:native:A:tokens = 2`, `p2:native:A:tokens = —`, `lock:native:A:tokens = 1` |
| after step 2 (the list's first, `t1 … exceeds bound 2`) | unchanged, status `Halted` | unchanged | unchanged |

**What a step changes in the node layer.** A `MutationObserver` watched the active pane's `.react-flow__nodes`
(`subtree`, `attributes`, `childList`, `characterData`):
- Reset: `{"ER_171:attributes:class":1,"ER_177:attributes:class":1}`, two nodes gaining `sim-active`;
- step 1: `{"ER_173:attributes:class":1}`, `p2` gaining it;
- the halting step 2: `{}`.

**Cost of the candidate sets.** A sweep is `candidates()` for ε and every event on the live run. It ran 500 times,
through the page's own module instances:
- `usPerSweep` 8.8 after Reset (the first, cold), then 1.8, 1.6, 1.4, 1.2;
- the net has 1 input (ε) and 3 transitions;
- `candidates` `ε: t1,t3` after Reset.

**A halted run still has candidates.** After the halting step `candidates()` still returns `ε: t1,t3`. The core
function knows nothing of `run.halt`, and the panel gates on the status. A canvas reader must gate on it too (§10,
risk 1).

**Not measured.** The Flowchart, PEST and ESM presets. That they paint native too is inferred [R] from the same rule:
no viewpoint means `useIRView` returns `null` (`irResolve.ts:102`), so the native branch paints. React render counts
were not measured; the render claims of §7 are [R].

---

## 6. What a canvas reader has to read

| Datum | Where it is | Changes signalled by | Per-node cost |
|---|---|---|---|
| tokens of an object | `run.config.state.marking.get(id) ?? 0` (`netStep.ts:37-39`) | `'mark'` version | one Map lookup |
| is it a place of the net | `run.net.places.has(id)` (`netTypes.ts:214`) | `'mark'` (Reset installs the net) | one Set lookup |
| σ of an object | `state.attrs.get(id)`, `state.presentation.get(id)`, `state.derived?.attrs/presentation.get(id)` (`netTypes.ts:82-92`) | `'mark'` | Map lookups |
| σ of the model (globals) | `state.attrs.get(net.modelId)` | `'mark'` | no node to show it on: it stays in the panel line (`simBridge.ts:538-555`) |
| enabled transitions | `candidates()` for `[null, ...run.alphabet]`, only while the status is `Running` (`netRunStatus`, `netStep.ts:299`) | `'mark'` (H6) | once per version per model, then a Set lookup of `origin` ids |
| the pending choice | `SimulationPanel.tsx:452` `const [pending, setPending] = useState<PendingChoice \| null>(null);` | nothing today | needs a publish and its own counter |
| the initial-marking feature | `NetStc.initialMarking`, a feature pointer (`netTypes.ts:120-121`); not on `SimRun` | Reset | a match of the row's `instanceof` |

---

## 7. The options

### Option A: a per-node overlay in the R-SIM-3 pattern (recommended)

**What.** A component per node, mounted by `ObjectNode` in its three branches next to `NodeProblemIndicator`. It
paints four things while a run exists:
- the node's token count (on every place of the net);
- the node's own σ;
- a candidate mark on the transitions enabled for some input;
- a distinct mark on the transitions of an open choice list.

It reads the singleton through derived selectors, never through the IR. R-SIM-3 prescribes this shape
(`decisions.md:1436-1439`): «Highlight dello stato attivo al wrapper del nodo via hook di versione (pattern problems
overlay), senza toccare l'interprete né il dependency set».

**Files.** Seven in slice A1, with A2 adding up to two. More than 5, so rule 19 applies: the Phase 2 prompt lists
them.

| File | Change | Slice |
|---|---|---|
| `sim/simCanvasState.ts` (new) | pure: `nodeRunState(run, objectId)` → count or `null`, σ rows, candidate state; `enabledOrigins(run)` gated on `Running` | A1 |
| `sim/simRunState.ts` | additive: the per-model derived cache keyed on the version | A1 |
| `sim/simRunState.ts` | additive: `simSetPending` / `useSimChoiceVersion`, a second counter, which is R-SIM-33 3c's «secondo canale» | A2 |
| `sim/SimNodeRunState.tsx` (new) | the overlay; subscribes itself | A1 |
| `sim/simulation-panel.scss` | its styles, beside `.mm-node.sim-active` (`:900`) | A1 |
| `nodes/ObjectNode.tsx` | three mounts; optionally the initial-marking row (E3) | A1 |
| `sim/simBridge.ts` | additive `initialMarking?` on the run at `startRun`, only if the row treatment is chosen | A1 |
| `sim/SimulationPanel.tsx` | publish the pending list at `:723` and clear it at the `setPending(null)` sites | A2 |
| `edges/UnifiedEdge.tsx` | candidate class on IR object-as-edge edges, via `data.irObjectId` | A2, optional |
| `sim/__tests__/simCanvasState.test.ts` (new), `sim/__tests__/simRunState.test.ts` | pure tests and mutation bench | A1, A2 |

**Effects.**
- **R-SIM-4.** Untouched: no `set_state`, no reducer or history, no socket, no IR file.
- **Critical-zone files.** None (H1).
- **Render cost.** `ObjectNode` gains no subscription: `:271` already re-renders every node on every `'mark'` bump.
  - The overlay's per-node work is a few Map and Set lookups.
  - The enabled set is computed once per version per model, 1.2 to 8.8 µs on the demo net [M].
  - A2's choice counter re-renders only the overlays, never `ObjectNode` or an IR resolver. The restrictive clause
    of R-MK-6 and spec §9 holds on the IR side as it is.
- **Tests.**
  - Pure-module tests with a mutation bench: drop the `Running` gate, drop the 0-count places, map `transition`
    instead of `origin`, read another model's run.
  - The overlay itself cannot be rendered in vitest here [M]. The env is `node` (`vitest.config.ts:14`).
    `command grep -c '@testing-library/react' package.json` gives 0, exit 1. `find src -name '*.test.tsx'` gives 0
    files. `command grep -rln` for `@testing-library/react` over `editor-v2` `*.test.tsx` exits 1; the control,
    `describe(` over `sim/` `*.test.ts`, has hits. It is checked by the RC-23 checklist.
- **Covers.** Native, pill and IR nodes, including every demo preset (§5). It does not put counts inside an authored
  notation: dots in a circle, or a count in the view's own label, remain option B's.

### Option B: the IR read surface (the R-SIM-4 extension)

**What.** View authors read counts and σ inside their notation.
- The smallest shape consistent with R-J7 and R-MK-1: a new `intrinsic` prop `tokens` for labels, plus
  `ReadCtx.tokens(id)`. `tokens` would be injected as `isMarked` is (R-MK-4), and would declare the existing
  `'mark'` channel.
- σ in views, in the ratified form (R-SIM-18, `decisions.md:1557`): «Nelle view `data.[x]` e `node.[x]` leggono lo
  stato dell'elemento disegnato». `.[x]` is JjEL grammar.
- The IR still compiles only `PathExpr`. No file under `viewpoint/ir/` imports `jjel`: `command grep -rln` exit 1,
  control `model/simulation/` exit 0 [M]. `STEP_RE` accepts only `$feature | value | values | values[N]`
  (`pathExpr.ts:23`). So σ needs J2 first, or a `TextSource` member that R-J7 admits only by ratification
  (`decisions.md:2225-2230`).
- A candidate would need a new `Predicate` op, a ratification like R-MK-1.

**Files.**
- `viewpoint/ir/`: `irTypes.ts`, `irCompile.ts`, `irReadCtx.ts`, `irReadCtxLproxy.ts`, `irValidate.ts`;
  `pathExpr.ts` and `irCrossDeps.ts` if σ goes through paths; `IRNodeContent.tsx` for anything but a label;
- the authoring panel under `viewpoint/authoring/` (R-MK-9 order: the UI after the interpreter);
- tests in `viewpoint/ir/__tests__/`.

**Effects.**
- **R-SIM-4.** Amended (ratified 2026-08-17); spec §9 too, if a new channel is named.
- **Critical-zone files.** All of the above. Layer Impact Report and the RC-30 go-ahead.
- **Interface.** A mandatory method on the exported `ReadCtx`, a rule 11 derogation declared as R-MK-4 did. The
  persisted IR schema grows, and views have no VersionFixer (R-B9).
- **Render cost.** Gated per index (R-MK-6): zero for a viewpoint that does not declare the channel.
- **Covers.** Only nodes of an authored IR view: **0 of 13** on the demo Petri [M].

### Option C: the run state in ReactFlow node data or in Redux (rejected)

- R-SIM-1 (`decisions.md:1427-1430`): the run-state lives «fuori da Redux … mai nel bag `_state`, mai in azioni».
- The node `data` is built by `useJjomSync` (critical zone). A `setNodes` from the simulator would race the sync
  rebuild, and would reach layout autosave through node changes.
- Rejected on the ratified row alone.

### Option D: a `data-*` attribute on the wrapper and CSS generated content (a subset of A)

- `data-sim-tokens="2"` beside `sim-active` on the three wrappers, painted by `::after { content:
  attr(data-sim-tokens) }`. This is entry E2.
- The smallest diff: three wrapper lines in `ObjectNode.tsx`, a pure `tokensOf`, and a stylesheet rule.
- Counts only:
  - σ does not fit an attribute;
  - generated content has no `title`, and is not reliably in the accessibility tree;
  - candidates would be one more class.
- It is what A1 degenerates to if Alfonso wants counts and nothing else.

### Comparison

| | A overlay | B IR surface | C node data / Redux | D data attribute |
|---|---|---|---|---|
| Files | 7 (A1) + up to 2 (A2) | 7 to 10 | sync layer | 3 |
| Critical-zone files | 0 | all | `useJjomSync` | 0 |
| Amends R-SIM-4 | no | yes | violates R-SIM-1 | no |
| Demo presets covered | all (native) | none | all | all |
| σ | per element | per element, after J2 | per element | no |
| Candidates | yes, and pending in A2 | new op | yes | class only |
| New subscription in `ObjectNode` | none | none (gated) | node data churn | none |
| Unit-testable | pure module | compiler and ReadCtx | no | pure helper |

---

## 8. Recommendation

**Option A, in two slices, Phase 2 after MODELS.**
- **A1:** counts on every place of the net, σ per element, and the enabled transitions while `Running`. It rides
  the `'mark'` version.
- **A2:** the pending choice as a second counter, which touches `SimulationPanel.tsx`, plus the IR object-as-edge
  edges. It queues in the wave-3 panel chain.
- **Option B** stays a lane of its own, opened when an authored notation needs the count or σ inside it, and after
  J2.

The backlog's premise for S15 was «critical zone, amends R-SIM-4, RC-26 three times» (backlog §4.4). Under A only one
of the three stays: the demo change, and it is after MODELS.

---

## 9. Draft Layer Impact Report for Phase 2

The report that goes in `docs/lir/` before the diff (RC-30), for option A.

```
LAYER IMPACT REPORT — S15, option A (draft, P-2026-09-27-1647)

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): ObjectNode mounts a run-state overlay (A1); UnifiedEdge reads
      data.irObjectId for a candidate class (A2, optional)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  (outside the template) the simulator's run-state singleton, sim/simRunState.ts: additive derived selectors and,
  in A2, a second version counter. Module state, outside Redux (R-SIM-1).

Canvas v2-flow:
  - What changes: one child per node wrapper in the IR, pill and native branches, painted only while the node's
    model has a run; optionally the initial-marking row's treatment in the native branch.
  - What does NOT change: node data, handles, sizes computed by the sync layer, the IR interpreter, the dependency
    set and channels of any view, the sim-active class, NodeProblemIndicator.
  - Cross-layer interaction: reads getSimRun through the singleton; writes nothing to Redux, JjOM or the canvas
    state.
  - Side-effect safety: no new subscription in ObjectNode (the one at :271 exists); the overlay subscribes itself.
    No write path, so no undo entry, no autosave, no socket.

Run-state singleton:
  - What changes: a derived cache keyed on the version; in A2 `simSetPending` and its counter.
  - What does NOT change: SimRun's required fields, simReset/simCommit/simClear semantics, the 'mark' bump rules of
    R-SIM-36, isSimActive and ReadCtx.isMarked.
  - Cross-layer interaction: the IR resolvers keep gating on 'mark' only; the choice counter reaches no resolver.

Smoke-test scenarios potentially affected:
  - Petri preset, run: after each step every place of the net shows the count getSimRun holds, 0 included; the
    initial-marking row reads as decided (§12 B).
  - Petri, a conflict: while the choice list is open exactly its transitions carry the pending mark (A2).
  - Halted, Terminated, Deadlock: no candidate mark on any node (risk 1).
  - Stop, or a model edit (R-SIM-34): every overlay disappears in the same frame as sim-active.
  - Open an existing project with no run: the node DOM is unchanged except for an empty mount point.
  - An IR viewpoint with a `marked` conditional: its re-render behaviour is unchanged (the channel gate).
  - Save, then reopen: nothing of the run persists.
  - Two models open, one running: only that model's nodes show counts (R-SIM-13).
```

If Phase 2 took option B instead:
- the same template would tick L-layer (the `ReadCtx` backends) and Persistence (the IR schema of saved views, no
  VersionFixer, R-B9);
- the go-ahead would be RC-30's `--critical-zone-goahead`.

---

## 10. Risks

1. **A halted run still has candidates** [M, §5]. `candidates()` ignores `run.halt`. A reader that does not gate on
   `netRunStatus` shows candidates on a halted run.
2. **Three branches.** `ObjectNode` returns from three places. A mount missed in the pill branch loses the count on a
   singleton place without any error.
3. **The initial-marking row keeps contradicting the badge** unless it is treated. The native `tokens` row is the
   model's M0.
   - Matching the row needs the `initialMarking` feature pointer, which is not on `SimRun`. `SimRun` is exported,
     but an optional field is admitted by rule 11.
   - A row's `feature.id` is the DValue id (`types.ts:211`), so the match goes through `instanceof`.
4. **The model of a node.** `isSimActive` answers with the union of every model's run (`simRunState.ts:59-68`). The
   overlay must read the run of the node's own model, or a place of another model with the same id space would read
   another run. Ids are unique, so the risk is a stale run of a closed tab. The panel clears on unmount
   (`SimulationPanel.tsx:529`).
5. **Collision with the problem dot.** Both children sit in the wrapper. Their corners must be measured, not assumed.
6. **`SimulationPanel.tsx` is the wave-3 bottleneck** (backlog §6 risk 8). A2 queues behind the panel chain; A1 does
   not touch that file.
7. **Colours.** `simulation-panel.scss:900-904` paints `sim-active` with literal hex values. Rules 27 and 28 and
   `frontend/src/styles/CLAUDE.md` decide where the overlay's colours are declared. Phase 2's DOVE may need
   `styles/tokens/`.
8. **Only Petri was measured.** The other three presets are inferred to paint native (§5). Phase 2's checklist
   should measure each.

---

## 11. Decisions taken (unattended)

1. **One probe on 3018.** The prompt allows probes to measure render cost. The same run measured the render branch,
   which step 2 of the COME needed. The files are gitignored, and `git status` was empty after the run.
2. **The probe copies the readiness-2 helpers** from `~/jjodel-sim`, read there and written only in this tree. The
   port is 3018 and the vite cache is in `/tmp`, so no other tree's cache was touched.
3. **Only the Petri preset was measured.** The other presets' branch is stated [R], by the rule that no viewpoint
   means the native branch.
4. **Option D is folded into A** as its degenerate form, not presented as a fourth recommendation.
5. **One commit for the report, the entry and the flip.** Step 5 of the prompt names one docs commit. That is more
   specific than the skill's report-alone commit, and it matches P13's closure commit for a docs-only lane.

---

## 12. Decisions awaiting Alfonso (RC-26)

- **A. R-SIM-33 3c under option A.** 3c (ratified 2026-09-25, `decisions.md:1689-1690`) reads «candidati sul canvas
  come secondo canale accanto a `'mark'`, critical zone, discovery propria». Option A implements the second channel
  outside the critical zone. Recommended: read «critical zone» as the forecast it was, and record that 3c is
  carried by A without amending the row.
- **B. What the canvas shows.** This changes the demo after MODELS and is a perceptual judgement. Recommended:
  - a count on every place of the net, 0 included;
  - the initial-marking row muted during a run, with «initial marking» in its title;
  - a ring on the transitions enabled for some input;
  - a distinct ring for an open choice list;
  - σ as rows under the node, per element; the model's globals stay in the panel line.
- **C. When.** A needs neither the critical zone nor R-SIM-4, so it could merge before the freeze. It changes what
  the demo shows. Recommended: keep Phase 2 after MODELS, as decision D of the backlog report said. The script's §4
  «Say» covers the gap.
- **D. Option B.** Recommended: no amendment of R-SIM-4 now. Reopen it after J2, on a notation that needs it.

---

## 13. Questions for the chat

1. Should A1 and A2 be one Phase 2 lane, or should A2 wait for its slot in the wave-3 panel chain?
2. Should Phase 2 measure the branch on the Flowchart, PEST and ESM presets first, or on its checklist?
3. Does Phase 2's DOVE include `frontend/src/styles/tokens/` for the overlay's colours (risk 7)?

**Probe files** (gitignored, in `frontend/scripts/smoke/`, not committed):
- `_tmp_canvas_common.ts`: a copy of `_tmp_demo2_common.ts`, with the base URL set to 3018;
- `_tmp_canvas_scenario.js`: a verbatim copy of `_tmp_demo2_scenario.js`;
- `_tmp_canvas_vite.config.ts`: port 3018, scratch cache in `/tmp`;
- `_tmp_canvas_petri.ts`: new.

The output is in `/tmp/canvas1647_scratch/probe.log`, 16 lines, exit 0.
