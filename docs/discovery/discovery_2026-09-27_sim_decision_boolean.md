# Discovery 2026-09-27: a boolean decision on a DecisionNode, and three panel readings

- Prompt-ID: P-2026-09-27-2255, `docs/prompts/claude_2026-09-27_2255_prompt_sim_decision_boolean.md`
- Chat: C-2026-09-27-1437. Session: `b80aa2ab-182d-4a5f-b23c-f385bcb0dc69` (local Claude Code session).
- Tree: `~/jjodel-w-decision`, branch `sim-decision-probe`, HEAD `a3eacdbdd` (the prompt's docs commit; code identical
  to `ff4bc0988`, the trunk that serves 3001). Executor: Opus 5.5 (`claude-opus-5-5`).
- Discovery lane, read-only on the code. Probes in `frontend/scripts/smoke/_tmp_decision_*` (gitignored), dev server of
  this tree on 3027 (`_tmp_decision_vite.config.ts`), headless Chromium, light, 1600x1000, DPR 2. Logs in
  `/tmp/decision_scratch/*.log`, crops in `~/.jjodel-lanes/shots_decision/`. `git status` empty after every run.
- This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.
  Tags: **[M]** measured in this phase on `a3eacdbdd`, **[R]** read in a file at HEAD.

---

## 0. The guards that work (answer first)

Measured end to end to `Terminated` with both values, no ε choice [M]:

| Where the value lives | `Flow_1.condition` | `Flow_2.condition` | Needs |
|---|---|---|---|
| **Data declaration** (recommended) | `self.source.[decision]` | `not self.source.[decision]` (or `else`) | Data row `decision`, metaclass `DecisionNode`, boolean, initial `true`/`false`. No metamodel attribute. |
| Metamodel attribute | `self.source.decision` | `not self.source.decision` (or `else`) | `DecisionNode.decision : EBoolean`, slot set on `DecisionNode_0`. No Data row. |
| Global Data declaration (demo `count` style) | `model.[decision]` | `not model.[decision]` (or `else`) | Data row `decision`, metaclass `Global`, boolean. |

`== true` / `== false` forms also run on both routes [M]. `!` does not parse, a bare `decision` does not resolve (§3.1).

---

## 1. Objective and hypotheses

Answer the four points of the prompt with measurements on Alfonso's model rebuilt in a probe: which guard text reads a
boolean `decision` of the flow's source node, what the cut Marking line holds, why two Flow headers draw without
«: Flow», and what a branch label in the choice list would cost.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A guard on `Flow.condition` can read a boolean of the flow's source node and pick the branch with no ε choice | **holds**, three forms, both values, to `Terminated` (§3) |
| H2 | The engine needs the attribute on the metamodel class | **falsified**: a Data declaration alone suffices, and the metamodel attribute alone suffices; they are two different routes read with two different operators (§3.2) |
| H3 | The cut Marking line is σ, a declared state attribute, and is expected on this model | **holds**: `Marking: DecisionNode_0 · DecisionNode_0.decision = true`, clamped at 262 px of 307 needed (§4) |
| H4 | The two header styles come from a different view, the IR object-as-edge path, or the `branch` value | **falsified** for all three; the typeless, un-underlined header is the node's open **name editor** (§5) |
| H5 | `branch` is bound to no simulation role | **holds** (§6.1) |
| H6 | A branch prefix in the choice list keeps Step in place | **holds** by a DOM-only measurement: the buttons wrap to two lines, the panel grows upward 28.6 px, Step stays at 854.5 (§6.3) |

## 2. Files read

- `CLAUDE.md`; `docs/decisions.md` (R-SIM-30, R-SIM-31, R-SIM-52, R-SIM-53, R-SIM-62, R-SIM-63, R-SIM-64..66, R-SIM-82..85,
  RC-17, RC-25, RC-26); `docs/demo/models_2026_simulator_demo.md` (§1, §2.4, §3); `docs/discovery/discovery_2026-09-27_sim_modal.md`
  (header and outline); `frontend/scripts/smoke/README-probes.md`.
- `frontend/src/components/editor-v2/sim/simBridge.ts` (490-570, 680-700, 805-825), `SimulationPanel.tsx` (620-680, 700-720),
  `SimRolesModal.tsx` (205-345), `simulation-panel.scss` (430-485), `modelMarkings.ts`.
- `frontend/src/model/simulation/guardContext.ts`, `stcFromRoles.ts`, `stateAttributesCodec.ts` (1-120),
  `netCompile.ts` (380-510), `profileBinder.ts` (160-402), `simProfiles.ts` (60-150), `roleCatalog.ts` (1-170),
  `subsetChecker.ts` (1-80, codes), `bindingCompat.ts` (84-96).
- `frontend/src/jjscript/executor/commands/eval.ts` (1-260), `frontend/src/jjel/lexer/lexer.ts` (160-175),
  `frontend/src/model/simulation/__tests__/roleCatalog.test.ts` (48-51).
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (90-125, 270-365, 600-760, 880-935, 1140-1300),
  `nodes/instanceNode.scss` (90-125, 775-795), `EditorV2.scss` (2275-2300), `EditorV2.tsx` (1785-1798, 2215-2226),
  `Toolbar.tsx` (110-140), `components/M1ReferencePopup.tsx` (1-80).
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (1-200), `irEdgeViews.ts` (1-60), `irResolve.ts` (48-90),
  `irDemoFixture.ts` (1-40), `metaclassPin.ts` (1-30), `viewpoint/authoring/EnableIRPanel.tsx` (1-50).
- Probe helpers copied read-only from `~/jjodel-w-demo-modal/frontend/scripts/smoke/_tmp_demomodal_{common.ts,scenario.js,walk.ts}`.

## 2.1 The probe model

`_tmp_decision_scenario.js` builds through the store, bag empty, what the prompt describes [M, BUILT lines of every log]:
metamodel `DecFlow`: `Node` (abstract) ← `StartNode`, `DecisionNode`, `ActionNode`, `EndNode`, `Node.label : EString`;
`Flow { condition : EString, branch : EString, source → Node, target → Node }`. Model `decFlow`: `StartNode_0 -Flow_0->
DecisionNode_0` (label `Yes or No`) `-Flow_1 (branch YES)-> ActionNode_0`, `-Flow_2 (branch NO)-> ActionNode_1`,
`ActionNode_0 -Flow_3-> EndNode_0`; `condition` empty on all four. Variants: `DecisionNode.decision : EBoolean`
(`DEC_MODEL_ATTR=1`) and `ActionNode_1 -Flow_4-> EndNode_0` (`DEC_FLOW4=1`, see §3.4).

Alfonso's metamodel is not in the repo: the superclass, `condition : EString` and `label` are assumptions. The binder
does not care whether the guard is an `Expression` or an `EString` named like a guard:
`frontend/src/model/simulation/profileBinder.ts:305` [R]
`ta.filter(a => a.type === SKETCH_TYPE.string && /guard|cond/.test(lower(a.name))).map(a => a.id),`

The preset is applied through the dialog as the demo does (Configure…, `Flowchart / Activity`, Continue, Apply) [M,
`repro.log`]: `7 of 13 roles matched`, `Checkable`; rows `Node=Node`, `Initial=StartNode`, `Transition=Flow`,
`or Source=Flow.source`, `Next state=Flow.target`, `Terminal=EndNode`, `Guard=Flow.condition`. After Apply:
`Flowchart / Activity · Checkable`, bag keys `simGuard simInitial simNextState simNode simProfile simSource simTerminal
simTransition`. Crop: `repro_1_dialog_roles.png`.

**Alfonso's screen, reproduced** [M, `repro.log`, crop `repro_4_panel_choice.png`, page `repro_5_page_choice.png`]: with
`decision` declared in Data (DecisionNode, boolean, initial `true`), Reset, ▶, ▶ opens `Choose a transition (ε)` with
`Flow_1 (DecisionNode_0 → ActionNode_0)` and `Flow_2 (DecisionNode_0 → ActionNode_1)`; the panel reads
`Marking: DecisionNode_0 · DecisionNode_0.deci…` and `Last step: ε: Flow_0 (StartNode_0 → DecisionNo…`, both clamped.

---

## 3. Question 1: the guard that works today

### 3.1 Measured matrix

`_tmp_decision_walk.ts`, `DEC_PHASE=guards-data`, `DEC_FLOW4=1`. Each row: Flow_1 and Flow_2 conditions written to the
slots, the value set, Reset, ▶ until the run stops. Logs `sigma.log`, `global.log`, `model.log`, `both.log`, `fresh.log`.

**Route A, Data declaration on DecisionNode** (`sigma.log`) [M]:

| Id | `Flow_1` | `Flow_2` | `decision = true` | `decision = false` |
|---|---|---|---|---|
| S1 | `self.source.[decision]` | `not self.source.[decision]` | Flow_0, Flow_1, Flow_3 → **Terminated** | Flow_0, Flow_2, Flow_4 → **Terminated** |
| S2 | `self.source.[decision]` | `else` | **Terminated** via Flow_1 | **Terminated** via Flow_2 |
| S3 | `self.source.[decision] == true` | `self.source.[decision] == false` | **Terminated** via Flow_1 | **Terminated** via Flow_2 |
| S4 | `self.source.[decision]` | `!self.source.[decision]` | Terminated via Flow_1, with `1 defect: Flow_2 guard (parse error 1:1 Unexpected '!'. Use 'not' for logical negation.).` | **Deadlock** at step 1: `Flow_1 false; Flow_2 defect, parse error 1:1 …` |
| S5 | `decision` | `not decision` | **Deadlock**: `Flow_1 defect, 'decision' does not exist; Flow_2 defect, 'decision' does not exist` | same |
| S6 | `self.source.decision` | `not self.source.decision` | **Deadlock**, same `'decision' does not exist` (no metamodel attribute) | same |

The end-state lines of S1 [M]: `Marking: EndNode_0 · DecisionNode_0.decision = true`, `Last step: ε: Flow_3 (ActionNode_0 →
EndNode_0) fired`, `Terminated`; and `Marking: EndNode_0 · DecisionNode_0.decision = false`, `Last step: ε: Flow_4
(ActionNode_1 → EndNode_0) fired`, `Terminated`. Crops `sigma_S1_true_end.png`, `sigma_S1_false_end.png`, and the same for S2, S3.

The `!` refusal is the lexer's [R] `frontend/src/jjel/lexer/lexer.ts:171`
``this.error(`Unexpected '!'. Use 'not' for logical negation.`);``

**Route A', Global declaration** (`global.log`, metaclass `Global`) [M]: G1 `model.[decision]` / `else` and G2
`model.[decision]` / `not model.[decision]` both reach Terminated via Flow_1 (true) and via Flow_2 (false). The marking
line then reads `Marking: EndNode_0 · decision = true` (a global prints without an element). Crops `global_G*_end.png`.

**Route B, metamodel attribute `DecisionNode.decision : EBoolean`, no Data row** (`model.log`, `fresh.log`) [M]:

| Id | `Flow_1` | `Flow_2` | slot `true` | slot `false` | slot never set (`values: []`) |
|---|---|---|---|---|---|
| M1 | `self.source.decision` | `not self.source.decision` | Terminated via Flow_1 | Terminated via Flow_2 | **Terminated via Flow_2, silently** |
| M2 | `self.source.decision` | `else` | Terminated via Flow_1 | Terminated via Flow_2 | **Deadlock**: `Flow_1 defect, returns null; Flow_2 else, Flow_1 is defective` |
| M3 | `self.source.decision == true` | `self.source.decision == false` | Terminated via Flow_1 | Terminated via Flow_2 | **Deadlock**: `Flow_1 false; Flow_2 false` |

On Route B the marking line carries no σ: `Marking: DecisionNode_0` [M]; the value is visible only on the canvas slot.

**Both routes at once** (`both.log`: metamodel attribute and Data row, slot and initial set to opposite values) [M]:
slot `true` with initial `false`: M1 takes Flow_1, S1 takes Flow_2; slot `false` with initial `true`: M1 takes Flow_2,
S1 takes Flow_1. `self.source.decision` reads the model slot, `self.source.[decision]` reads σ; the name does not clash
and no defect is reported.

### 3.2 Which the engine needs, and where the value is set

- Route A needs **only the Data declaration** with metaclass `DecisionNode` [M, S1 has no metamodel attribute]. Its
  value is the declaration's `initial`, one for **every** instance of the metaclass: the compiler writes the same literal
  on each owner [R] `frontend/src/model/simulation/netCompile.ts:470` `for (const e of owners) {` … `:490`
  `values.set(decl.name, decl.initial);`. Changing it means the dialog, Data, the initial cell, Apply, then Reset on the
  model tab. Two DecisionNodes cannot start with different values on this route.
- Route B needs **only the metamodel attribute** [M, M1-M3 have no Data row]. The value is the slot of each
  DecisionNode instance, set on the canvas. It is read from the model frozen at Reset (`freezeSnapshot`,
  `guardContext.ts`), so an edit during a run stops it [M, `model.log` MIDRUN]: after one ▶ the slot written to `false`
  gives `Not started` and `Run interrupted: the model changed. Reset to run again.` (crop `model_midrun_edit.png`).
- The roots a guard sees are `self` (the Flow), `event`, `model` [R] `frontend/src/model/simulation/guardContext.ts:173`
  `const ctx = snapshot.base.child({ self, event, model: snapshot.model });`, so a node's value is reached through
  `self.source`; a bare name never resolves (S5).

### 3.3 Unset

- Route A, declaration removed: Reset runs, the first ▶ fires Flow_0, then **Deadlock** with reason `ε: Flow_1 defect,
  'decision' is not a state attribute of DecisionNode_0; Flow_2 defect, …` (S1, S3) or `…; Flow_2 else, Flow_1 is
  defective` (S2) [M]. Declaration with an empty initial: Reset shows `1 defect: decision (initial not a JjEL
  literal).` above the buttons, then the same Deadlock [M].
- Route B, slot never set: M1 **takes the NO branch with no defect on screen** (the Flow_1 guard is null, a defect not
  shown while the run proceeds; `not null` is true), M2 and M3 deadlock with the reasons above [M, `fresh.log`,
  crops `fresh_M*_fresh_end.png`]. Probe note: writing `values = []` over a set boolean slot left `[false]` [M,
  `model.log`: `slot DecisionNode_0.decision [false]`], so the `model_M*_unset_end.png` crops are a `false` run; the
  never-set case is the `fresh` run only. Whether the canvas can return a boolean slot to empty was not measured.

### 3.4 One model point outside the guards

As described, the model has one flow into `EndNode_0` (`Flow_3`, built from `ActionNode_0`). The `false` branch then
ends on `ActionNode_1` with no outgoing flow, which is not `Terminated`. Every run above used `Flow_4: ActionNode_1 →
EndNode_0` (`DEC_FLOW4=1`) to reach Terminated on both values. The no-Flow_4 run of the false branch was not measured.

### 3.5 Which form for the demo-script style

The script's Flowchart scene writes σ guards with `.[x]` and an explicit complement [R]
`docs/demo/models_2026_simulator_demo.md:265` ``| `f4` | `d1` | `fk` | `model.[count] >= 2` | |`` and `:328` «`FinalNode` and
the explicit complement are the script's model». The same style, per node, is **Route A with S1**:
`Flow_1`: `self.source.[decision]`, `Flow_2`: `not self.source.[decision]`. `else` (S2) is the measured equivalent. The
global form `model.[decision]` matches `model.[count]` literally but binds the value to the model, not to DecisionNode.

---

## 4. Question 2: the cut Marking line

Full text [M, `repro.log`, title and line identical]: **`Marking: DecisionNode_0 · DecisionNode_0.decision = true`**
(the value is the declared initial; `false` with initial `false`). It needs 307 px in a 262 px line, so it is clamped;
the `title` holds it whole. Crop, the panel widened by an injected style for the crop only: `repro_6_marking_widened.png`.

Source: the stored semantic state attributes of σ, one per element, printed `element.attr = value` [R]
`frontend/src/components/editor-v2/sim/simBridge.ts:553`
``const line = `Marking: ${places.length === 0 ? '∅' : places.join(', ')}${sigma.length === 0 ? '' : ` · ${sigma.join(', ')}`}`;``
rendered at `SimulationPanel.tsx:664` with `title={view.marking.title}`. It is a **declared** attribute (a Data row), not a
derived one: `run.attrs = {"DecisionNode_0":{"decision":true}}`, `derived: null` [M]. Expected on this model: yes,
exactly when `decision` is declared in Data; on Route B the line is `Marking: DecisionNode_0` alone [M]. So Alfonso's
3001 project has a Data row `decision` on DecisionNode, whatever else it has.

The cut `Last step` line is the same mechanism (R-SIM-63): `Last step: ε: Flow_0 (StartNode_0 → DecisionNode_0) fired`,
305 px in 262 [M].

---

## 5. Question 3: the two header styles

**Finding.** A header that reads «Flow_1» with no «: Flow» and no underline is the object node's **name editor**: the
header is swapped for an `<input class="mm-node__input">` holding the name [M, `palette.log`: `{"value":"Flow_4",
"cls":"mm-node__input", …, "focused":true, "underline":"none", "parent":"mm-node__header mm-object__header"}`]
[R] `frontend/src/components/editor-v2/nodes/ObjectNode.tsx:1242` `className="mm-node__input"`, in the `editing ?`
branch; the type and its separator exist only in the other branch, `:1275` `<span className="mm-object__separator"> : </span>`.

What opens it [M, `palette.log`]:
- a drop from the INSTANCES palette: the node is created with `autoEdit: true` [R] `EditorV2.tsx:2223`, and the node
  turns it into the editor [R] `ObjectNode.tsx:320` `if (data.autoEdit) {`. Crops `headers_after_dup_drag.png`
  (`Flow_4`, the dropped node) and `headers_palette_page.png`;
- a click on the header of an already selected node [R] `ObjectNode.tsx:1238`
  `onClick={() => { if (selected && !editing) setEditing(true); }}`; two clicks on Flow_1's header open it (crop
  `headers_flow1_editor_open.png`).

What closes it [M]: Enter, Tab, a click on the empty pane, switching the dock tab and back, and a second palette drop
(which moves the focus to the new node's editor). All go through `handleBlur` → `commitName` (`ObjectNode.tsx:348`).

**Not reproduced: two editors open at once.** In every gesture measured, at most one editor is open. Alfonso's
screenshot shows two (Flow_1 and Flow_2). The look matches the editor. How a second one stays open is an open question
(§9, Q2).

**Ruled out, measured on the store-built model** (`headers.log`, `repro.log`) [M]: all four Flow headers render natively
`Flow_n : Flow`, separator present, `.mm-object__name` computed `underline/solid`, `data-viewid` absent (no IR path), no
pill, the same with `branch` YES/NO set or empty, with DecisionNode_0 or Flow_1 selected, at 120 px width, in Basic mode,
after the toolbar duplicate, and during the run at the choice. The IR object-as-edge path draws a synthetic edge, not a
header, and needs an IR edge view (`irEdgeViews.ts:13-22`) the probe project does not have.

**Demo presets** [M, `presets.log`, `_tmp_decision_presets.ts`, the demo builder's four models]: Petri 13 headers, Flow B
17, SM 11, ESM 10; every one native with the separator, `typeless: []` on each. The editor opens on a preset only
through the two gestures above; the demo drops nothing from the palette.

Underline caveat: `.mm-object__name` computes `text-decoration-line: underline` [R] `EditorV2.scss:2291`, but the crops
at DPR 2 (`headers_flow1_rest.png`) show no visible line under the native name. A style and a pixel disagree here; the
pixel is the measure (CLAUDE.md §5). Not chased: outside the four questions.

---

## 6. Question 4: a branch label in the choice list (cost only, nothing implemented)

### 6.1 Where the label is built, and `branch` today

The choice button text is one call [R] `SimulationPanel.tsx:646`
`<span>{candidateLabel(run.net, c.transition, lookupNow)}</span>`, and the text is [R] `simBridge.ts:522-527`
``return `${own} (${arcsText(t.preset, lookup)} → ${arcsText(t.postset, lookup)})`;``. `candidateLabel` has three
other callers: the evaluation details `simBridge.ts:692` and `Last step` `simBridge.ts:818`, `:820`.

`branch` is bound to no role [M+R]: the dialog's 16 rows name no `Flow.branch` (§2.1), the bag after Apply has 8 keys
none of which is the branch feature [M]; `command grep -rn "branch" frontend/src/model/simulation
frontend/src/components/editor-v2/sim` (tests excluded) returns one line, `subsetChecker.ts:316` `e.elseBranch`, which
is the positive control that the search reached the files [M]. No role in the catalog reads a transition label [R]
`frontend/src/model/simulation/roleCatalog.ts:19-25` (`ROLE_IDS`: 28 ids; `transitionOutput` is the Mealy output,
`eventIdentifier` names events).

### 6.2 What it would take

A new optional role, e.g. `transitionLabel` (key `simTransitionLabel`, kind `attribute`, owner `transition`):
- `roleCatalog.ts`: `ROLE_IDS` +1, `DESCRIPTORS` +4 lines; `roleCatalog.test.ts:51` `expect(ROLE_IDS).toHaveLength(28);` moves to 29.
- `simProfiles.ts:143`: `flowchart` `active` +1 (and any other profile that wants it).
- `profileBinder.ts` `dataRoles` (~296-320): +5 lines, an `EString` of the transition class named `branch|label`.
- `bindingCompat.ts:88-95` `OWNER`: `transitionLabel: 'transition'`.
- `SimulationPanel.tsx:646`: read the slot (`objectSlotValues(lookup, own, bag.simTransitionLabel)[0]`) and prefix it,
  ~4 lines; or `candidateLabel` gains an optional third argument (additive, rule 11).
- No persistence change: a new bag key is additive (R-SIM-55); no VersionFixer.

Only the choice list should change: `candidateLabel` also names transitions in `Last step` and in the details, where
R-SIM-62 fixes the form `name (S → D)` (`docs/decisions.md:1938`), and the demo script quotes those lines verbatim.

Demo impact: the Flowchart profile would gain an edit role, so the dialog's `10 of 13 roles matched` on Flow B
(`models_2026_simulator_demo.md:274`) becomes `… of 14`. On the four presets no transition class has an `EString` named
`branch` or `label` [R, the demo builder `_tmp_demomodal_scenario.js`], so the binder would bind nothing there, but the count line changes. That is
«changes what the MODELS demo shows» (RC-26): it waits for Alfonso, and after 2026-10-04 it does not.

### 6.3 The no-layout-shift rule

Measured by editing the DOM text of the two buttons only (no source change) [M, `repro2.log`]:

| Label | Button height | Panel top | Panel height | Step top |
|---|---|---|---|---|
| today, `Flow_1 (DecisionNode_0 → ActionNode_0)` | 24.3 | 677.4 | 273.6 | **854.5** |
| `YES · Flow_1 (…)` | 38.6 (two lines) | 648.8 | 302.2 | **854.5** |
| `YES, the order is accepted · Flow_1 (…)` | 38.6 | 648.8 | 302.2 | **854.5** |

The buttons wrap (`simulation-panel.scss:453` `overflow-wrap: anywhere;`), the list sits above the buttons (R-SIM-82),
the panel grows upward by 28.6 px, Step does not move: the rule holds. Crops `repro_7_choice_prefix_{short,long}_domonly.png`
(DOM-only, not a rendering of any code).

---

## 7. Runtime input

Out of scope. Nothing measured asks for `decision` during the run: the value comes from the Data initial or from the
model slot, both fixed at Reset.

## 8. Risks

1. **Route B, unset, negation form**: M1 on a never-set slot takes NO with no line on screen [M]. The pair `== true` /
   `== false` (M3) or `else` (M2) deadlocks visibly instead.
2. **Route A is per metaclass**: one initial for every DecisionNode [R `netCompile.ts:490`]; a second decision node
   with the other value needs Route B, or a per-node design that does not exist.
3. **Both routes on one model** read different stores under nearly the same text (`.decision` vs `.[decision]`) [M,
   `both.log`]; a slot and an initial that disagree give opposite branches with no warning.
4. **The screenshot's model may end on ActionNode_1** with no flow to EndNode_0 (§3.4): not `Terminated` on NO.
5. **§5 is not a full reproduction**: the second open editor is unexplained.
6. Probe console errors: `failed to get project {project: null}` once per page (seed project, every run), and
   `proxy.ts:357 identical assignment` when the probe wrote a slot to the value it already held. Neither from the
   simulator.

## 9. Decisions taken (unattended)

1. The model was rebuilt with an abstract `Node` and `condition : EString`; the binder is indifferent (§2.1).
2. `Flow_4` was added to run the false branch to `Terminated` (§3.4).
3. The declaration initial was changed through the L setter the dialog uses (`lmm.state = patch`,
   `SimRolesModal.tsx:450`) after the first declaration went through the dialog; the model slots through the L proxy.

## 10. Decisions awaiting Alfonso

1. The branch label in the choice list (§6): a new role changes the dialog's roles count on the demo's Flow B (RC-26).

## 11. Open questions for Alfonso

1. Route A (Data, one value for all DecisionNodes, shown in the Marking line) or Route B (a slot per node, not shown in the panel)?
2. On 3001, does a click on the empty canvas turn both `Flow_1` and `Flow_2` headers back into `Flow_n : Flow`? If yes, both were open name editors.
3. Does your `Flow_3` start at `ActionNode_0` or `ActionNode_1`, and is there a flow from the other ActionNode to `EndNode_0`?
