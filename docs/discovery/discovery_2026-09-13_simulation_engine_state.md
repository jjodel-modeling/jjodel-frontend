# Discovery 2026-09-13 — The simulation engine as it stands, against the computational model

**Type**: read-only discovery (Phase 1 of two-phase). No code changes.
**Prompt**: `docs/prompts/claude_2026-09-13_0030_prompt_discovery_simulation_engine.md`.
**Design under assessment**: `docs/spec/claude_spec_2026-09-13_computational_model.md` (read in full).
**Base**: branch `validation-skeleton`, HEAD `d87273a1d`. Dirty files of other lanes at start:
`components/validation/ValidationRulesModal.tsx/.scss`; during the session the jjscript files
`executor/resolvers.ts`, `executor/commands/{create,delete,list,rename}.ts`,
`executor/__tests__/resolvers.test.ts` appeared dirty as well (another lane). None touched.
**Parallel lane**: `claude_2026-09-13_0100_prompt_discovery_jjel_eval_context.md`. This report does
not read `frontend/src/jjel/`.

Every statement is tagged **[M]** measured (path:line, quoted or grep result), **[D]** deduced
from measured code without running it, **[Q]** open question for Alfonso. All paths below are
relative to `frontend/src/` unless they start with `docs/`.

---

## 0. Hypotheses this discovery falsifies

- H1: the engine is confined to `components/editor-v2/sim/`. **False** — it reaches the IR
  interpreter (critical zone §3.1) through the `marked` predicate (§5).
- H2: a notion of STC / fitting morphism exists in code under some name. **False as a
  first-class notion** — there is a hard-coded role set stored as six flat keys in the M2 bag (§2).
- H3: the "state attributes" are the run-state. **False** — the run-state is a module singleton
  outside Redux; the `_state` bag (the historical "state attributes") holds only the role
  configuration (§3).
- H4: the step chooses among candidates. **False** — it fires every outgoing transition of every
  active instance at once (§4).

---

## Summary in eight lines

1. Three files are the engine (`sim/`); four IR modules and `ObjectNode.tsx` consume the run-state;
   `EditorV2.tsx` mounts the panel. The legacy prototype `forEndUser/Control.tsx` is still in tree,
   template-scope only.
2. The "fitting" is six flat keys `simNode`, `simInitial`, `simTerminal`, `simTransition`,
   `simOwnedTransitions`, `simNextState` in `DPointerTargetable._state` of the **M2** `DModel`:
   per metamodel, persisted, undoable, collaborative. Only four are read by the engine.
3. The run-state is `const active = new Set<string>()` of DObject ids in `sim/simRunState.ts`: a
   boolean, per-element marking, global to the session, never in Redux, never persisted, never
   through a TRANSACTION.
4. The step has no events, no guards, no candidates, no selector: all transitions of all active
   instances fire in one `simApplyStep`; activation wins over deactivation.
5. The concrete syntax reads the marking two ways: CSS class `sim-active` on `ObjectNode`, and the
   IR predicate `{ op: 'marked' }` via `ReadCtx.isMarked`, invalidated by the declared channel `'mark'`.
6. No simulation identifier in `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `syncState.ts`,
   `canvasToJjom.ts`, `portDistribution.ts`, `handlePosition.ts`, `VersionFixer.tsx`, nor in the
   `editor-v2/hooks/` adapters. The IR side (`editor-v2/viewpoint/ir/`) **is** critical zone and is touched.
7. `sim/` is byte-identical between `alfonso-frontend-jjtl` and `validation-skeleton`; of the other
   engine-adjacent files only `EditorV2.tsx`, `joiner/classes.ts` and `LModelElement.tsx` differ,
   for reasons unrelated to simulation.
8. The largest distance to the design is step 3: marking domain (boolean Set → valued map),
   the step cycle (fire-all → candidates/selector/progress), and the boolean `isMarked` contract
   that the IR already depends on.

---

## Files read

Whole files:
- `components/editor-v2/sim/SimulationPanel.tsx` (442 lines)
- `components/editor-v2/sim/simRunState.ts` (90)
- `components/editor-v2/sim/simulation-panel.scss` (297)
- `components/forEndUser/Control.tsx` (672)
- `components/editor-v2/viewpoint/ir/irReadCtx.ts` (190)
- `components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts` (64)
- `components/editor-v2/viewpoint/ir/irResolve.ts` (209)
- `docs/spec/claude_spec_2026-09-13_computational_model.md`
- `docs/ratifiche/claude_2026-08-17_memo_ratifica_pannello_simulazione.md`
- `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md`

Ranges (declared as such; claims below are limited to these windows):
- `components/editor-v2/viewpoint/ir/irTypes.ts` :1-90
- `components/editor-v2/viewpoint/ir/irCompile.ts` :76-95, :180-232
- `components/editor-v2/viewpoint/ir/useIRContainment.ts` :110-132
- `components/editor-v2/viewpoint/ir/useIRFormView.ts` :92-112
- `components/editor-v2/nodes/ObjectNode.tsx` :255-275, :880-905, :1128-1152, :1170-1196 + grep of every sim identifier
- `components/editor-v2/EditorV2.tsx` :4340-4362 + grep `isModelMode`, `SimulationPanel`
- `joiner/classes.ts` :2300-2381 (`clearState`, `_state` doc, `get_state`, `set_state`, `__sanitizeValue`)
- `redux/action/action.ts` :60-359 (`TransactionStatus`, `BEGIN`, `COMMIT`, `END`, `FINAL_END`, `TRANSACTION`, `Action.fire`)
- `redux/reducer/reducer.ts` :1420-1475 (`setDocumentEvents`)
- `common/U.tsx` :427-441 (`compressedState`)
- `components/abstract/tabs/InstanceManagerTab.tsx` :18-32
- `docs/decisions.md` :1100-1300 (series R-SIM, R-J, R-MK)
- `docs/discovery/discovery_2026-08-17_sim_slice1_fondamenta.md` :1-60

Search method: `command grep` (BSD grep, honours `--include`), never the `ugrep` wrapper
(CLAUDE.md §5). Every zero-hit below carries its exit status and a positive control.

---

## 1. Where the engine lives

### 1.1 Grep census (`command grep -rc --include=*.ts --include=*.tsx --include=*.scss` over `frontend/src`)

| Pattern | Files with hits (count) | Relevant? |
|---|---|---|
| `simulation` | `InstanceManagerTab.tsx`:3, `ObjectNode.tsx`:1, `SimulationPanel.tsx`:5, `simRunState.ts`:3, `simulation-panel.scss`:1, `irTypes.ts`:1, `JjodieWidget.tsx`:1, `Control.tsx`:1, `examples/conflictsimulation.ts`:1, `debugtools/debug.tsx`:1, `jjform/__tests__/delete.test.ts`:1, `jjform/create.ts`:2 | engine files + consumers; `jjform/*`, `InstanceManagerTab` copy refer to «CRUD Manager Simulation.dc.html» (a design mock), `JjodieWidget` to «keyword-based AI simulation», `debug.tsx` a comment, `conflictsimulation.ts` a JSON fixture name — **unrelated** |
| `simRun` | `ObjectNode.tsx`, `SimulationPanel.tsx`, `simRunState.ts`, `useIRContainment.ts`, `irResolve.ts`, `irReadCtx.ts`, `useIRFormView.ts`, `irReadCtxLproxy.ts`, `InstanceManagerTab.tsx` (comment) | all relevant |
| `fitting` | `EditorV2.tsx`:1 (`:464` «before fitting» = fitView), `forEndUser/ContextMenu.tsx`:1 (`:76` «a cname fitting»), `examples/RowViewSmoke/index.ts`:1 | **zero relevant hits** (exit 0, all unrelated) |
| `Fitting`, `stateAttr`, `StateAttr`, `finalNode`, `semanticType`, `SemanticType` | — | **zero hits, exit 1** |
| `initialNode` | `EditorV2.tsx`:2 (`:217 const initialNodes: Node[]`, ReactFlow demo nodes), `repro/ReproHarness.tsx`:3 | **zero relevant hits** |
| `morphism` | `services/export/XMIService.ts`:3 | unrelated |
| `isSimActive` | `ObjectNode.tsx`:5, `simRunState.ts`:1, `irReadCtx.ts`:1 (comment), `irReadCtxLproxy.ts`:3 | relevant |
| `useSimVersion` | `ObjectNode.tsx`:2, `SimulationPanel.tsx`:2, `simRunState.ts`:1, `useIRContainment.ts`:2, `irResolve.ts`:3, `useIRFormView.ts`:2 | relevant |
| `sim-active` | `ObjectNode.tsx`:4, `simulation-panel.scss`:1 | relevant |
| `SimulationPanel` | `EditorV2.tsx`:2, `SimulationPanel.tsx`:5 | relevant |
| `simTerminal` (and every `sim*` role key) | `SimulationPanel.tsx` only | relevant |
| `R-SIM` | `ObjectNode.tsx`, `SimulationPanel.tsx`, `simRunState.ts`, `simulation-panel.scss`, `irReadCtx.ts` | comments |

Positive control for the zero hits: the same command form returns 7 lines for `SimulationPanel`
and 24 for `sim-panel` in the first pass. **[M]**

### 1.2 The participating files **[M]**

| File | Role | Evidence |
|---|---|---|
| `components/editor-v2/sim/simRunState.ts` | run-state singleton | `:17 const active = new Set<string>();` `:18 let version = 0;` |
| `components/editor-v2/sim/SimulationPanel.tsx` | panel: M2 role authoring + M1 Reset/Step/Stop | `:1-23` header comment |
| `components/editor-v2/sim/simulation-panel.scss` | panel styles + `.mm-node.sim-active` | `:293-297` |
| `components/editor-v2/EditorV2.tsx` | mount point, portaled to `<body>` | `:110 import SimulationPanel from './sim/SimulationPanel';` `:4355 <SimulationPanel modelid={modelid} isModelMode={isModelMode} />,` `:496 const isModelMode = modeInfo.mode === 'model';` |
| `components/editor-v2/nodes/ObjectNode.tsx` | highlight on the M1 node wrapper (abstract and concrete syntax) | `:40`, `:265`, `:269`, `:270`, `:906`, `:1146`, `:1196` |
| `components/editor-v2/viewpoint/ir/irTypes.ts` | predicate `{ op: 'marked'; path?: PathExpr }` | `:47` |
| `components/editor-v2/viewpoint/ir/irCompile.ts` | compiles `marked`, deposits channel `'mark'` | `:82 let channelSink`, `:193-222` |
| `components/editor-v2/viewpoint/ir/irReadCtx.ts` | `ReadCtx.isMarked(elementId): boolean` | `:42`, injected default `:152 isMarked: (elementId: string) => boolean = () => false,` |
| `components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts` | the single injection of `isSimActive` | `:10`, `:21`, `:52`, `:63` |
| `components/editor-v2/viewpoint/ir/irResolveCore.ts` | aggregates `channelsInUse` per index | `:99 channelsInUse?: ReadonlySet<string>;` `:167`, `:183`, `:214`, `:238`, `:265` (grep lines) |
| `components/editor-v2/viewpoint/ir/irResolve.ts` | `useIRView`, `useIRRowView` gate on `'mark'` | `:89-96`, `:179-186`, memo deps `:120`, `:208` |
| `components/editor-v2/viewpoint/ir/useIRContainment.ts` | edge decoration gate on `'mark'` | `:120-124` |
| `components/editor-v2/viewpoint/ir/useIRFormView.ts` | form view gate on `'mark'` (consumed by `IRForm.tsx`, `useFormWidgets.ts`, `widgets/ReferenceWidget.tsx`, `InstanceManagerTab.tsx`) | `:99-105` |
| `components/editor-v2/viewpoint/ir/__tests__/irMarked.test.ts` | the only test touching the marking | grep, 30+ lines |
| `components/forEndUser/Control.tsx` | legacy prototype (template scope only) | `:236-373` `PanelComponent`; exported by `joiner/components.tsx:41` |

### 1.3 Zero-hit places the prompt named **[M]**

- **Context menu**: `command grep -n -iE 'simul|simRun|sim-|isSim|SimulationPanel' components/editor-v2/ContextMenu.tsx` → exit 1;
  control `command grep -c 'onClick'` on the same file → 4. The simulation has no context-menu entry.
  `forEndUser/ContextMenu.tsx:76` only matches `fitting` in an unrelated comment.
- **Authoring UI for `marked`**: `command grep -rn "marked" components/editor-v2/viewpoint/authoring` → exit 1;
  control `isKind` → hits in 9 files. The R-MK-9 step M2 (a «È marcato» entry in the predicate builder)
  has not landed: `marked` is authorable only by hand-written IR.
- **Events, guards, priority, seed** in `sim/`: `command grep -n -iE 'event|guard|trigger|priority|seed|random'`
  → 3 lines, all prose (`simRunState.ts:38` «`changed` guard», `SimulationPanel.tsx:90` «proven»,
  `:273` «the prototype's termination guard»). No code-level notion. Control: `role` → 31 lines.
- **Tests / smoke on the engine**: no test imports `simRunState` or `SimulationPanel`. The only smoke
  hit is `scripts/smoke/_tmp_uiO_recon.ts:9`, a selector list containing `.sim-panel__collapse`.

### 1.4 Abstract vs concrete syntax **[M]/[D]**

`ObjectNode.tsx` has three render returns, each appending `sim-active` when the node's DObject is
active: the IR path (`:889 if (irResolution && !irDelegated)`, class at `:906`), the singleton pill
(`:1143 if (isPill)`, class at `:1146`), and the default path (class at `:1196`). **[M]** The abstract
syntax (no IR viewpoint) therefore gets only the CSS outline; the concrete syntax gets the outline
**plus** whatever `marked` conditionals its IR views author. **[D]** Edges are never outlined:
`sim-active` exists only on `ObjectNode`; an object-as-edge view can colour its line through
`marked` (`useIRContainment.ts:114-119` comment, test `irMarked.test.ts:184`). **[M]**

---

## 2. The interface (STC) and the fitting morphism

### 2.1 What exists **[M]**

No identifier `STC`, `fitting`, `morphism`, `semanticType` exists (§1.1). The mapping is:

```ts
// SimulationPanel.tsx:36-42
type RoleKey =
    | 'simNode'
    | 'simInitial'
    | 'simTerminal'
    | 'simTransition'
    | 'simOwnedTransitions'
    | 'simNextState';
```

```ts
// SimulationPanel.tsx:53-60
const ROLE_SPECS: RoleSpec[] = [
    { key: 'simNode', label: 'Node', kind: 'class', ... },
    { key: 'simInitial', label: 'Initial', kind: 'class', ... },
    { key: 'simTerminal', label: 'Terminal', kind: 'class', ... },
    { key: 'simTransition', label: 'Transition', kind: 'class', ... },
    { key: 'simOwnedTransitions', label: 'Owned transitions', kind: 'composition', ... },
    { key: 'simNextState', label: 'Next state', kind: 'reference', ... },
];
```

- **Holder**: `DPointerTargetable._state` (`joiner/classes.ts:1450 _state: GObject = {};`, grep),
  on the **M2** `DModel`. Values are pointers (ids of `DClass` / `DReference`). Decided by R-SIM-2
  (`docs/decisions.md:1112-1116`).
- **Per metamodel**, not per model: the M1 face resolves `configModelId` as `dModel.instanceof`
  (`SimulationPanel.tsx:410-412`) and reads `lookup[configModelId]?._state` (`:414`).
- **Edited by** the M2 face of the panel: one `<select>` per `ROLE_SPECS` entry
  (`SimulationPanel.tsx:336-350`), writing through `writeRole` (`:225-233`):
  `lmm.state = { [key]: value === '' ? undefined : value };`.
- **Options** come from `collectMetaOptions` (`:93-141`): concrete classes only
  (`:112 if (!dClass.abstract)`), references split into `compositions` (`dRef.composition`) and
  `references` (`!dRef.aggregation`), labelled `Class.ref`. **Attributes are not collected.**
- **Engine-read subset**: `ENGINE_ROLE_KEYS = ['simInitial', 'simTerminal', 'simOwnedTransitions', 'simNextState']`
  (`:73`). `simNode` and `simTransition` are stored and never read (`:64-72` comment).
- **Run controls gated** on those four: `rolesComplete = ENGINE_ROLE_KEYS.every(k => !!roles[k])`
  (`:223`); otherwise the M1 face shows «Configure simulation roles on the metamodel» (`:353`).
- **Persistence**: `_state` is a plain field of every D-object, and `U.compressedState`
  (`common/U.tsx:427-441`) serialises `idlookup` object by object (`:431-435`: `isSelected` reset,
other `DProject`s skipped, every other object copied as is, `_state` included).
  Measured on the code; not measured by a save/reopen run.
- **No validation of coherence**: `writeRole` accepts any option id; nothing checks that
  `simNextState` belongs to `simTransition`, that `simOwnedTransitions` is owned by `simNode`, or
  that `simInitial`/`simTerminal` relate to `simNode`. **[M]** (no such code in the file)
- **No migration** exists or is needed for these keys: `simInitial` has hits only in
  `SimulationPanel.tsx` (§1.1), zero in `redux/VersionFixer.tsx`. **[M]**

### 2.2 The legacy prototype keys **[M]**

`forEndUser/Control.tsx` reads unprefixed keys from `props.data.instanceof.state`:
`'initial'`, `'terminal'`, `'node'`, `'ownedTransitions'`, `'nextState'` (`:244-248`), and writes them
through `MetaElementPicker` (`:351-358`, setter `:420 props.data.state={[props.name]: value}`), plus
`'transition'` (`:356`). It is exported to the template scope (`joiner/components.tsx:41`) and, per
`discovery_2026-08-17_state_attributes_data_node.md` Q6, not mounted anywhere — not re-measured here.
A project saved with the prototype keys is **not** read by `SimulationPanel` (different key names). **[D]**

### 2.3 Distance to spec §3.1 **[D]**

| Spec role (§3.1) | Today | Gap |
|---|---|---|
| node metaclass | `simNode` (stored, unread) | engine never filters by it |
| edge metaclass | `simTransition` (stored, unread) | same |
| edge **source** reference | absent — the source is implicit: the owner of `simOwnedTransitions` | design needs an explicit source (Petri: many input places) |
| edge **target** reference | `simNextState` (single-valued read via `.value`, `:188`) | multi-target not expressible |
| initial node | `simInitial` is a **metaclass** (every instance of it is initial) | spec says «initial node» — see Q1 |
| final node | `simTerminal`, a **metaclass** | same |
| event metaclass / trigger / identifier feature | absent | new |
| guard / assignment holders | absent; `collectMetaOptions` offers no attributes | new |
| STC as a data structure (kind, state components, laws) | absent; `ROLE_SPECS` is a compile-time const | new |

---

## 3. The state mechanism

### 3.1 Two layers, two mechanisms **[M]**

The "state attributes" of 2026-08-17 are split by R-SIM-1/R-SIM-2 (`docs/decisions.md:1108-1116`):

| | Configuration (roles) | Run-state (marking) |
|---|---|---|
| Where | `_state` bag of the M2 `DModel` | `simRunState.ts:17 const active = new Set<string>();` |
| Keyed on | role name | DObject id (`simRunState.ts:10-12`: «keyed on the DObject id (the M1 instance), NOT on the ReactFlow vertex id») |
| Value | pointer string | membership (boolean) |
| Redux / undo / persistence / collaborative | yes / yes / yes / yes | no / no / no / no (`simRunState.ts:4-8`) |
| Written by | `LPointerTargetable.set_state` → `TRANSACTION` | `simReset`, `simApplyStep`, `simClear` — synchronous Set mutation + `bump()` |
| Read by | `mapStateToProps` (`SimulationPanel.tsx:407-430`) on raw `idlookup` | `isSimActive`, `getSimActiveIds`, `useSimVersion` |

### 3.2 The configuration write and the always-open transaction **[M]/[D]**

`set_state` (`joiner/classes.ts:2337-2381`) computes `newState` / `removedState`, returns early when
nothing changed (`:2377 if (!changed) return true;`), then:

```ts
// joiner/classes.ts:2379-2382
TRANSACTION(this.get_name(c)+'.state', ()=>{
    if (Object.keys(newState)) SetFieldAction.new(c.data, "_state", newState, '+=', false);
    if (Object.keys(removedState)) SetFieldAction.new(c.data, "_state", removedState as any, '-=', false);
})
```

The always-open transaction: `reducer.ts:1443`
`documentEventsIntervalId = setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);`
with `U.UpdatingTimer = 300` (`common/U.tsx:176`). `COMMIT(undefined, false)` calls `END()` then
`BEGIN()` (`action.ts:133`, `:137`), so after every tick `transactionDepthLevel` is back to 1 and
`hasBegun` is true. **[M]**

Consequence **[D]** (traced, not run): the `TRANSACTION` in `set_state` goes 1→2→1, never reaches
`FINAL_END` (`action.ts:150`), and its actions sit in `t.pendingActions` (`Action.fire`,
`action.ts:329-330`) until the next tick; `FINAL_END` then fires a `CompositeAction` whose dispatch is
itself deferred by `setTimeout(..., 0)` (`action.ts:349`). A role write is visible up to ~300 ms
later — the P12 trap. The run-state never passes through any of this: `simApplyStep` mutates the Set
and notifies listeners synchronously (`simRunState.ts:21-24`, `:64-69`).

### 3.3 Element level vs global **[M]**

The marking is per element (one membership per DObject id) but **one global Set per session**:
no model key, no graph key, no viewpoint key. Isolation between models is procedural —
`SimulationPanel.tsx:221 useEffect(() => () => { simClear(); }, [modelid]);`. Nothing stores any
value other than membership; there is no global component (counter, flag).

**[D]** Every `EditorV2` with a `modelid` portals its own `SimulationPanel` (`EditorV2.tsx:4354-4357`),
all sharing the singleton: if two editors are mounted, unmounting or switching one clears the
other's run. Whether two editors can be mounted today is not measured here → Q7.

### 3.4 How the concrete syntax reads it **[M]**

- `ObjectNode.tsx:265 const simObjectId = useSelector((state: any) => state.idlookup?.[id]?.model ?? null);`
  `:269 useSimVersion();` `:270 const isSimActiveNode = typeof simObjectId === 'string' && isSimActive(simObjectId);`
  Every `ObjectNode` subscribes to the global version, whether or not a simulation runs.
- IR: `irCompile.ts:193-199` — `channelSink?.add('mark'); if (!p.path) return (ctx, id) => ctx.isMarked(id);`
  with a single-hop `path` variant (`:200-221`) that navigates by `ctx.getRef`.
- `ReadCtx.isMarked` is supplied only by `makeReadCtx` / `makeLproxyReadCtx`
  (`irReadCtxLproxy.ts:21 makeDrawReadCtx(idlookup, isSimActive)`, `:52 isMarked: draw.isMarked`,
  `:63`). `irReadCtx.ts` stays import-free (`:142-149`).
- Invalidation: the four hooks subscribe unconditionally to `useSimVersion()` and pass the value to
  their memo only if `index?.channelsInUse?.has('mark')` (`irResolve.ts:89-96`, `:179-186`;
  `useIRContainment.ts:120-124`; `useIRFormView.ts:99-105`).

### 3.5 What a map-valued marking would require **[D]**

Consumers whose contract is boolean membership, with exact call sites:

| Contract | Declared at | Consumed at |
|---|---|---|
| `isSimActive(objectId: string): boolean` | `simRunState.ts:26-28` | `ObjectNode.tsx:270`; `irReadCtxLproxy.ts:21`, `:63` |
| `ReadCtx.isMarked(elementId: string): boolean` (exported interface, «TOTAL by contract») | `irReadCtx.ts:32-42` | `irCompile.ts:199`, `:220`; `irMarked.test.ts` |
| `{ op: 'marked'; path?: PathExpr }` — boolean by construction (R-MK-1) | `irTypes.ts:31-47` | `irCompile.ts:193-222`; saved IR (no VersionFixer, R-B9) |
| `getSimActiveIds(): string[]` | `simRunState.ts:31-33` | `SimulationPanel.tsx:238`, `:272` |
| `simReset(activeIds: string[])` | `:41-51` | `SimulationPanel.tsx:256` |
| `simApplyStep(deactivate: string[], activate: string[])` — deactivate then activate, «activation wins» | `:53-69` | `SimulationPanel.tsx:287` |
| one global `version` | `:18`, `:78-90` | 4 IR hooks + `ObjectNode` + panel |

A map-valued σ therefore needs: (a) a new store shape (e.g. component name → element id → value,
plus globals) replacing the `Set`; (b) **additive** readers beside `isSimActive`, because rule 11
forbids changing `ReadCtx.isMarked`'s type — the boolean can survive as a derived view (e.g. "value
≠ domain default"), which is a semantic choice (Q3); (c) replacing `simApplyStep`, whose
"activation wins" rule is correct only for a boolean domain and wrong for token counts
(consume/produce must be arithmetic); (d) an IR reading path for non-boolean values, which R-J7 says
must enter through the JjEL profile, not as a new predicate beside `marked` — and R-MK-3 already
reserves `mark?: string` for named markings (`irTypes.ts:43-45`). (b) and (d) are in the critical zone.

---

## 4. The step today

All in `SimulationPanel.tsx` unless stated. **[M]** unless tagged.

- **Start = Reset** (`:250-257`): collects the model's DObjects via `collectModelObjectIds`
  (`:148-162`, a full `idlookup` scan walking `father` up to the `DModel`), keeps those with
  `lookup[id]?.instanceof === initialId` (exact metaclass id: **no subclass matching**), calls
  `simReset(ids)`. Every instance of the initial metaclass is marked.
- **Step** (`:270-288`):
  1. `activeIds = getSimActiveIds().filter(id => !!lookup[id])`.
  2. If any active instance has `instanceof === roles.simTerminal` → return (no-op; the button is
     also disabled, `:365`).
  3. For each active id: `outgoingTransitions(id, ownedTransitionsName)` = values of the slot
     `'$' + name` on the L proxy (`:170-182`). If empty → `continue` (the instance stays active).
     Otherwise every transition's target `t['$' + nextStateName]?.value` (`:185-194`) is pushed to
     `activate` if it exists in `idlookup`, and the source is pushed to `deactivate` — even when all
     targets are dangling (`:261-269` comment: «a dangling transition … shows up as a token that vanishes»).
  4. One `simApplyStep(deactivate, activate)`.
- **Stop** (`:259`): `simClear()`.
- **Status** (`:235-248`), derived at render, never stored: `'Not started'` if empty; `'Terminated'`
  if **any** active is terminal; `'Deadlock'` if **any** active has no outgoing transition; else `'Running'`.
- **Feature names** of the two navigated roles are resolved from the pointers in `mapStateToProps`
  (`:427-428`), then slots are matched by name.

Answers to the prompt:

- *How the next element is chosen*: it is not chosen. All outgoing transitions of all active
  instances fire in one step. **[M]**
- *Guards*: none. **[M]** (§1.3)
- *More than one enabled candidate*: all fire; targets are unioned into the Set, so a fork produces
  several active instances and a join collapses them into one (boolean domain). **[D]**
- *Event notion*: none. **[M]** (§1.3; confirmed by `discovery_2026-08-17_sim_slice1_fondamenta.md` summary item 2)

Deduced side effects **[D]**:
- `'Deadlock'` is reported while other tokens can still progress, and Step keeps firing them:
  the status is "some token is stuck", not "no progress possible".
- `'Terminated'` on any terminal token freezes all other tokens.
- `runStatus`'s memo deps (`:248`) do not include model changes: editing the M1 model during a run
  refreshes the status only at the next `simVersion` bump.
- The run-state survives model edits that delete an active object only as a filtered read
  (`filter(id => !!lookup[id])`); the Set itself is not pruned.

Distance to spec §4 **[D]**: no candidate set, no selector, no `none`/progress, no discard, no
label, no parallel-assignment effect, no order exit/transition/entry. The single piece that
survives as-is is the "structural effect" of a boolean state machine, and even that is applied to
*all* sources at once (a step semantics that spec §10 explicitly excludes: «interleaving only»).

---

## 5. Interactions with the critical zone

**[M]** `command grep -rn -E 'simRunState|isSimActive|useSimVersion|getSimVersion|getSimActiveIds|simReset|simApplyStep|simClear|SimulationPanel|sim-active|simInitial|simTerminal|simOwnedTransitions|simNextState|simNode|simTransition|marked|isMarked'`
over `components/editor-v2/hooks`, `components/editor-v2/sync`, `utils/portDistribution.ts`,
`utils/handlePosition.ts`, `redux/VersionFixer.tsx`, `utils/defaultViewTemplate.ts`, `common/DV.tsx`:
the only hits are the English word *marked* in `VersionFixer.tsx:1008-1050` (`markedLegacy`, IR
inverse migration) and a comment in `defaultViewTemplate.ts:156`. **No simulation identifier.**
Positive control on the same paths: `TRANSACTION` → 12 in `useJjomSync.ts`, 49 in `canvasToJjom.ts`.

- `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
  and the D-graph adapters in `editor-v2/hooks/` (`createAdapter.ts`, `deleteAdapter.ts`,
  `multiAdapter.ts`, `neighborhoodAdapter.ts`, `shapeAdapter.ts`, `writeCtxLproxy.ts`, …): **not touched**.
- **Touched** — `editor-v2/viewpoint/ir/` is critical zone per CLAUDE.md §3.1 («IR execution
  rendering»). Call sites:
  `irReadCtxLproxy.ts:10` (import), `:21`, `:52`, `:63`;
  `irReadCtx.ts:42`, `:152`, `:187`;
  `irCompile.ts:82`, `:198-199`, `:220`;
  `irTypes.ts:47`;
  `irResolveCore.ts:99`, `:167`, `:183`, `:214`, `:238`, `:265`;
  `irResolve.ts:14`, `:89-96`, `:120`, `:179-186`, `:208`;
  `useIRContainment.ts:15`, `:120-124`;
  `useIRFormView.ts:25`, `:99-105`.
- Outside §3.1 but load-bearing: `ObjectNode.tsx:40`, `:265-270`, `:906`, `:1146`, `:1196`;
  `EditorV2.tsx:110`, `:4354-4357`.

The panel writes the model only through `set_state` on the M2 bag (a pure-action TRANSACTION, safe
under §3.3); the M1 face writes nothing (R-SIM-6). **[M]**

---

## 6. Branch situation

```
git diff alfonso-frontend-jjtl validation-skeleton --stat -- frontend/src/components/editor-v2/sim/
→ (empty), exit 0
```

Positive control: the same command without pathspec lists **76 files changed, 14012 insertions,
541 deletions** — the diff machinery does see differences. **[M]**

Other engine-adjacent files, same command:

| File | Differs? | Content of the difference |
|---|---|---|
| `components/editor-v2/nodes/ObjectNode.tsx` | no | — |
| `components/editor-v2/viewpoint/ir/{irTypes,irReadCtx,irReadCtxLproxy,irResolve,irResolveCore,irCompile,useIRContainment,useIRFormView,IRForm}.ts(x)`, `__tests__/irMarked.test.ts` | no | — |
| `components/forEndUser/{Control,ContextMenu}.tsx`, `components/editor-v2/ContextMenu.tsx` | no | — |
| `redux/reducer/reducer.ts`, `redux/action/action.ts`, `common/U.tsx` | no | — |
| `components/abstract/tabs/InstanceManagerTab.tsx` | no | — |
| `components/editor-v2/EditorV2.tsx` | yes, +3 | `ValidationFreshnessSync` import and mount, `graphId={graphId}` prop on the toolbar — validation lane |
| `joiner/classes.ts` | yes, +33 | `DPointerTargetable.uniqueModelName` — lane A3 |
| `model/logicWrapper/LModelElement.tsx` | yes, +35/−5 | model-name guard on `DModel.new/new2/new3` — lanes A3/A3b |

Topology: merge-base `7d145f110` («docs: phase 2 prompt for the validation skeleton»);
`validation-skeleton` is 72 commits ahead and 23 behind `alfonso-frontend-jjtl`. **[M]**
Engine history (`git log -- sim/`): `1b67b65fa` (2026-08-17, panel v1), `f6794dc81` (glyphs),
`c0fe8e33f` (2026-08-18, `marked` M1a), `7092b30dd` (2026-08-18, channel M1b), `a37a8e37a`,
`85c4398f6` (styling). **[M]**

**[D]** The engine can be developed on either branch without a merge conflict on its own files;
`EditorV2.tsx` is the only shared file that differs, around the mount region (`:4223`, `:4267` vs
the panel at `:4355`).

---

## 7. The six steps of the plan against the code

For each step: files, what it builds on, what it would break, unknowns. All **[D]** unless noted.

### Step 1 — Events

- **Files**: `sim/SimulationPanel.tsx` (roles, M1 events section, step), `sim/simRunState.ts`
  (current event as part of the configuration), possibly `sim/simulation-panel.scss`.
- **Builds on**: `RoleKey` / `ROLE_SPECS` / `ENGINE_ROLE_KEYS` (`:36-73`); flat-key convention of
  R-SIM-2 in the M2 bag; `collectMetaOptions` for the event metaclass and the trigger reference.
- **Breaks**: `rolesComplete` (`:223`) — if event roles join `ENGINE_ROLE_KEYS`, every metamodel
  configured today hides its run controls; event roles must be optional (flowcharts have none).
  `collectMetaOptions` offers no attributes, so the *identifier feature* has no option list yet.
  Firing all transitions (§4) is incompatible with "trigger accepts e": step 1 already forces a
  candidate notion, i.e. part of step 3.
- **Unknown**: Q4 (where the event enumeration comes from); whether the current event is session
  state (singleton) or panel React state.

### Step 2 — Evaluation context (engine side only; JjEL side in the parallel report)

- **Files**: a new context builder next to `sim/`; `sim/simRunState.ts` read API.
- **Builds on**: nothing engine-side — today there is no configuration value, only a Set and role
  strings. The nearest lazy context is the IR `ReadCtx` (`irReadCtx.ts:17-43`), which R-J5 keeps
  away from `buildEvalContext`.
- **Breaks**: nothing if additive.
- **Unknown**: whether the three roots (`self`, state, event) reuse `ReadCtx` or are a separate
  object; where read-only exposure of M is enforced (spec §11, decided on the JjEL discovery).

### Step 3 — Condition/assignment roles, unified cycle

- **Files**: `sim/simRunState.ts` (σ shape), `sim/SimulationPanel.tsx` (roles, candidates, selector,
  status), `nodes/ObjectNode.tsx` (highlight of marked vs candidate), and — if the IR must see
  values or candidates — `viewpoint/ir/irReadCtx.ts`, `irReadCtxLproxy.ts`, `irTypes.ts`,
  `irCompile.ts` (critical zone, Layer Impact Report).
- **Builds on**: per-element keying by DObject id; `useSyncExternalStore` subscription; the `'mark'`
  channel and its gates; the reserved `mark?: string` (R-MK-3) for named markings.
- **Breaks**: the committed "fire-all" step (rule 3: a semantic change of verified behaviour, needs
  ratification); the four `runStatus` values; `simApplyStep`'s activation-wins rule (§3.5 c); the
  boolean `isMarked` contract if not kept as a derived view; R-MK-6 granularity (one global version
  re-renders every `marked` consumer at every step); `sim-active` on all three `ObjectNode` paths.
- **Unknown**: Q2 (edge source role), Q3 (meaning of `marked` on a non-boolean domain), Q5 (candidate
  highlighting as a second channel or not), whether laws are checked in the singleton or the panel.

### Step 4 — Snapshots for step-back

- **Files**: `sim/simRunState.ts`, `sim/SimulationPanel.tsx`.
- **Builds on**: `getSimActiveIds()` already returns a copy (`:30-33`); `simReset(activeIds)` already
  replaces the whole set with one bump (`:41-51`) — a restore primitive for the boolean case.
- **Breaks**: nothing if additive; R-SIM-1 holds (snapshots stay outside Redux and undo).
- **Unknown**: whether a snapshot holds the label (§4.5 of the spec) or only σ and e.

### Between 4 and 5 — Petri nets; `.smv` exporter

- **Petri**: needs roles the current set cannot express — transitions with several input and output
  places. `simOwnedTransitions` (composition on the source) + `simNextState` (single target read via
  `.value`, `:188`) model exactly one source and one target. Needs integer marking (step 3).
- **Exporter**: a pure function of model + STC; the STC must first exist as data (today `ROLE_SPECS`
  is a const and the binding is six bag keys). `collectModelObjectIds` (`:148-162`) and
  `collectMetaOptions` (`:93-141`) are reusable raw-`idlookup` readers; both are file-private today.

### Step 5 — Trace and scenarios

- **Files**: new; `sim/` panel.
- **Builds on**: nothing — no trace, no RNG, no seed, no run mode exist (§1.3).
- **Breaks**: R-SIM-1 if scenarios are stored in Redux; scenarios are authoring, not run-state, so
  their home is a new decision (Q6).
- **Unknown**: persistence format and owner (M1 model bag, a separate artifact, a file).

### Step 6 — Verification

- **Files**: none in the frontend engine beyond the exporter and scenario replay.
- **Builds on**: steps 3–5.
- **Unknown**: the service (spec §8: not redistributable with the frontend).

---

## 8. Dependencies and risks

- **R1 — The IR already depends on the boolean marking.** Saved viewpoints may contain
  `{ op: 'marked' }`; IR has no VersionFixer (R-B9). Any change to what "marked" means is a change
  to persisted user content. **[M]** for the dependency, **[D]** for the risk.
- **R2 — Global singleton, global version.** Every `ObjectNode` and every IR hook subscribes to one
  counter (§3.4). Automatic run mode (spec §6) multiplies re-renders; the memo of 2026-08-17 accepted
  this only for manual stepping (`memo…pannello_simulazione.md:51-53`). **[M]**
- **R3 — Exact-metaclass matching.** `instanceof === roles.simInitial` / `simTerminal` ignores
  inheritance; the IR side uses `isKindOf` with ancestry (`irReadCtx.ts:179-183`). Two notions of
  "is a" in the same feature. **[M]**
- **R4 — Role bag is shared authoring.** Adding keys is additive and needs no migration; renaming or
  reshaping them (e.g. into an STC object) hits R3 of the 2026-08-17 discovery (nested objects escape
  the action machinery) and would need a VersionFixer pass on `_state`. **[D]**
- **R5 — Reading after a role write.** A role write lands after the next 300 ms tick (§3.2); any
  engine code that writes roles and reads them back in the same tick reads the old value. **[D]**

---

## 9. Open questions for Alfonso

1. **Initial / final: metaclass or element?** Today `simInitial` and `simTerminal` are metaclasses
   (every instance qualifies). Spec §3.1 says «initial node; final node». Keep the metaclass reading,
   or bind to a feature (e.g. a boolean `isInitial`) or to specific M1 elements?
2. **Edge source.** Today the source is the owner of the `simOwnedTransitions` composition. The spec
   names «source and target references». Is containment-as-source an admissible fitting, or does
   the STC require an explicit source reference (as Petri nets will)?
3. **`marked` on a valued domain.** When the marking becomes `0..n`, should the IR predicate `marked`
   mean "value ≠ default", be restricted to boolean components, or grow the reserved `mark?: string`?
4. **Event enumeration source.** Instances of the event metaclass in the M1 model, or literals
   declared on the M2 side?
5. **Candidates on canvas.** Is candidate highlighting a second channel beside `'mark'`, or a
   panel-only list in step 1?
6. **Scenarios' home.** R-SIM-1 keeps run-state out of Redux; scenarios are saved and replayed. Where
   do they persist?
7. **Several editors.** Can two `EditorV2` instances with a `modelid` be mounted at once today (dock
   tabs, split)? If yes, the shared singleton plus per-panel `simClear` on unmount is already a
   defect, before any design change.
8. **The fire-all step.** Step 3 replaces committed, verified behaviour. Is a ratification line
   (R-SIM-7 or a new series) expected before the implementation prompt, as rule 3 suggests?
