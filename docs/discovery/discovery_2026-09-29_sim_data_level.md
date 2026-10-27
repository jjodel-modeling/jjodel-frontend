# Discovery: where the data declarations live (model versus metamodel)

- Prompt-ID `P-2026-09-29-0011`, prompt `docs/prompts/claude_2026-09-29_0011_prompt_discovery_sim_data_level.md`, chat `C-2026-09-28-1936`.
- Session `7d40d20b-1f8c-4a3d-8add-22b35d690bb1`, tree `~/jjodel-w-datalevel`, branch `sim-data-level`, HEAD `516a1e2f5` (trunk `024d95345` plus the prompt).
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`). Read-only; two gitignored probes, no dev server.
- A set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the files. **[M]** measured in this
  phase on `516a1e2f5`, **[R]** read.

## 0. Answer in brief

- **The engine does not care where a declaration is stored [M].** `compileNet` takes a plain list and gives a global to the
  model id (`netCompile.ts:490-491`). Compiled from the M1 model's bag, `count` gives the same σ (`count = 0` on the
  model, no defect, probe S3). `model.[x]` resolves through the model id (`guardContext.ts:142`, `:173`). No expression changes, in any option.
- **Four readers and one signature tie the data to M2 [R, M].** `startRun` reads only the metamodel's bag
  (`simBridge.ts:457-467`). Declared on the M1 bag today, `count` is ignored: the Reset line gives the demo's three
  `undeclared 'count'` defects and the run halts at step 2 (S2). `runSignature` reads only the metamodel's `sim*` keys
  (`simBridge.ts:530-534`): editing an M1 key leaves it unchanged, while its control, an M2 edit, changes it (S5).
- **An M1 model already carries a persisted bag [R, M].** `_state` is a field of every D object (`classes.ts:1477`), and
  `set_state` is generic, one TRANSACTION (`classes.ts:2356-2402`). `generatedBy` is already an M1 key
  (`ProjectEditor.tsx:1723`, read at `:104`). The four demo exports carry `_state` on both models, empty: nothing to migrate.
- **All three demo declarations are globals** (`coins`, `paid`, `count`; script §2.3 l.206, §2.4 l.291). Under B or C
  the declaration steps move to the model tab. The run tables stay as they are (S1 and S3 give the same σ).
- **A naive merge does not give "default + override" [M].** With M2 then M1 records of the same name, M2's record holds and
  compileNet reports `twice` (S4). Shadowing has to be written.

| | A: all at M2 (today) | B: globals in the M1 bag, metaclass-bound at M2 | C: bound `Variable` metaclass, M1 instances |
|---|---|---|---|
| Code | none | 6 files (1 new), 2 test files | about 10 files, 4-6 test files |
| Critical zone, VersionFixer | no | no (`simCheckToProblems.ts` goes through `startRun`) | no |
| Rows amended | none | R-SIM-19, R-SIM-52 (ratified), R-SIM-67 | also R-SIM-47, 48, 54; spec §3 |
| Migration | none | none: M2 globals read as defaults | none; the M2 key stays for metaclass-bound |
| Demo | as is | 2 declaration steps re-measured on the model tab | metamodels, models, canvas, exports rebuilt |
| Risk before the freeze | none | medium: queued behind R-SIM-90 P2 (same 4 files) | high |

Recommended: B, additive: the M1 bag gets its own `simStateAttributes` for globals and the M2 key stays for metaclass-bound records and as the default. Reason: it answers the two-models objection with no critical zone, no migration and no change to the engine.
Recommended: before the freeze, after R-SIM-90 Phase 2 merges; if §2.3 and §2.4 are not re-measured on the model tab by 2026-10-01 noon, the script stays on the M2 path, which B keeps working. Reason: additive, so it cannot break the measured script.

Decisions awaiting Alfonso (each one amends a ratified row, RC-21):
1. Design A, B or C. Recommended: B.
2. What the model may declare. Recommended: globals only, with a model record that names a metaclass as a record defect.
3. The same global in both bags. Recommended: the model's record shadows the metamodel's, by name, with no defect.
4. The M1 face becomes an authoring surface for the model's bag (one undo step; an edit interrupts the run). Recommended: yes.
5. Timing. Recommended: as in the line above.

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The engine is agnostic to where a declaration is stored | holds | `compileNet(stc, view, modelId, ids, decls)` `netCompile.ts:455-458`; `decl.metaclass === null ? [modelId]` `:490-491` [R]; S3 [M] |
| H2 | `model.[x]` and `self.source.[x]` resolve the same wherever the declaration is | holds | `model: Object.freeze({ __type: 'Model', id: model.id, ...})` `guardContext.ts:142`; `ctx = snapshot.base.child({ self, event, model: snapshot.model })` `:173`; the checker reads `scope.net.declared.get(id)?.get(attr)` `stcChecks.ts:164` and `scope.net.attributes` `:140` [R] |
| H3 | Nothing reads a declaration from the M1 bag today | holds | S2 [M]; search in §3 |
| H4 | `runSignature` already covers an M1 bag key | **falsified** | `const raw = configModelId ? lookup[configModelId]?._state` `simBridge.ts:530`, filtered `k.startsWith('sim')` `:534`; S5 `m1Edited_changes: false`, control `true` [M] |
| H5 | An M1 model can carry and persist a bag with the M2 mechanics | holds (read), partly measured | `_state: GObject = {}` `classes.ts:1477`; `set_state` merges keys, one `TRANSACTION` `:2398-2401`; `generatedBy` written `ProjectEditor.tsx:1723`, read `:103-104` [R]; `_state` present on both DModels of all four exports [M]. A non-empty M1 sim key through Save and reload: not measured |
| H6 | Concatenating the M2 and M1 lists gives default and override | **falsified** | S4: `{"code":"twice","message":"declared twice","element":"M"}`, the M2 domain `0..5` held [M]; `first ... continue` `netCompile.ts:497-508` [R] |
| H7 | Saved projects need a migration | **falsified** for B | the four exports: every DModel `_state` has no key (decompressed) [M]; B reads the M2 key as today |
| H8 | B needs a critical-zone edit | **falsified** | `problems/simCheckToProblems.ts` gets both readers through the bridge: `runSignature` `:95`, `startRun` `:174`, and drops declaration defects `if (d.role === 'declaration') continue;` `:138` [R] |
| H9 | A metaclass-bound declaration is language, a global is model data (the chat's reading) | a design reading | the engine reads no declared name itself: the only readers are expressions in M1 slots (guards, actions) and equations [R, `simBridge.ts:177-233`]. The per-DecisionNode input `decision` (`simBridge.test.ts:1588`) reads as language, `coins` as model data. For Alfonso (Q2) |

## 2. Findings per option

**A (today).** No change. Cost [R]: every global goes to every model of the metamodel (`netCompile.ts:490-491`), so a second
DemoESM model with no coins still gets `coins = 0, paid = false` in its `Marking:` line from Reset (`markingLine`, all of σ on
the model). Workaround: declare the union of every model's data at M2. R-SIM-67 stays provisional.

**B (globals in the M1 bag).** Same codec and format (`stateAttributesCodec.ts:35`, `:76-84`) on `lookup[modelId]._state`.
- Engine and checker: nothing changes (H1, H2, H8). The bridge merges the two lists before `compileNet` (`simBridge.ts:466-468`).
- Persistence and undo: `lmodel.state = { simStateAttributes }` is the M2 Apply's own write (`SimRolesModal.tsx:462`,
  `SimulationPanel.tsx:338`), one undo step. Collaborative sync is the same path [R, not measured].
- `runSignature`: one term for the model's `sim*` keys (H4). `simCheckSignature` (`simCheckToProblems.ts:90-96`) inherits it.
- Profile off: `runBag` drops the M2 key when the profile turns `stateAttributes` off (`simBridge.ts:130-133`, R-SIM-78). The M1
  key must follow it: State machine, Petri, DFA, NFA, Moore and Mealy have it off (`simProfiles.ts:140-166`).
- Defect labels: `declarationDefectsOf` names a record `record N` and reads `attributes[d.index]` (`simBridge.ts:397-398`),
  so M1 records need an index offset and a word that says which bag they are in.
- UI: the M1 face has no authoring today ("The simulation NEVER writes to the model nor to any bag", `SimulationPanel.tsx:19`).
  The model's table is the existing `Declarations` (`SimRolesModal.tsx:200`), with the metaclass select (`:270`, `Global`)
  fixed. The M2 hint "Declare the state attributes the actions write" (`simRoleStatus.ts:451`, `:485`) cannot see the models, so it points there.
- Migration: none. An M2 global is still read, as a default. An M1 global of the same name shadows it (Q3).
- Demo: §1 rows l.31-32, the declaration steps §2.3 l.206-221 and §2.4 l.291-296, and §4 (below-the-fold positions)
  are re-measured on the model tab. The walk harness declares on the metamodel tab today (`_tmp_p1025_walk.ts:452-455`,
  `openModel(page, B.mm)`, in `~/jjodel-w-scenes`). Run tables unchanged.

**C (a `Variable` metaclass).** A new role family in `roleCatalog.ts` (the class, plus name, domain, initial, equation and
form features), `NetStc`, `netStcFromRoles`, the binder, `bindingCompat`, the ESM and Flowchart presets (R-SIM-54), and the
modal rows. The bridge reads the Variable instances into `StateAttributeDecl`, and a domain in a string slot needs a new
syntax (`0..3`, `{a, b}`). The instances are DObjects of M: they enter `collectModelObjectIds` (`simBridge.ts:80-94`), the
frozen snapshot and the canvas. `runSignature` covers them free (`:538-545`). An M1 instance cannot point at a metaclass
without a cross-level reference, so metaclass-bound records keep the M2 key: two mechanisms. Every language designer adds a
simulation class to the metamodel, against the spirit of spec §3 (`claude_spec_2026-09-13_computational_model.md:49`:
"external to the metamodel, never a stereotype inside it"). Demo: DemoESM and DemoFlowB gain the class, the models gain
instances on the canvas, and the builder and the four exports are redone. After MODELS only.

## 3. Searches behind the absences

- Readers of the key: `command grep -rn 'simStateAttributes\|STATE_ATTRIBUTES_KEY\|decodeStateAttributes\|encodeStateAttributes\|stateAttributeRows'`
  over `frontend/src`, tests out, exit 0. Positive control: the definition `stateAttributesCodec.ts:35` is in the output.
  The readers `simBridge.ts:466` (the M2 `runBag`), `SimulationPanel.tsx:881`, `simRoleStatus.ts:424` and `SimRolesModal.tsx:396`
  all read the metamodel's bag.
- Bag readers: `command grep -rn '_state\b\|_state\['` over `frontend/src`, exit 0. The simulator's hits
  (`simCheckToProblems.ts:92`, `:134`, `simCanvasState.ts:117`, `SimulationPanel.tsx:860`, `:882`, `simBridge.ts:457`, `:530`) are
  all on `configModelId` or the metamodel. Positive control: the M1 read `ProjectEditor.tsx:103` is in the output.
- Exports: a grep of the raw `.json` sees one `_state`, because the project `state` is compressed. The decompressed read
  (`_tmp_datalevel_exports.mjs`, `decompressFromUTF16`, exit 0) lists both DModels per file with `hasStateField: true` as its
  control, and `stateKeys: []`.

## 4. Probes

`frontend/scripts/smoke/_tmp_datalevel_probe.ts` (`npx tsx`, EXIT=0, log `/tmp/p0011_probe.log`) runs the bridge on the Flow B fixture of `simBridge.test.ts:1433-1466`:
- S1, M2 key (control): `defects: null`, `Marking: i0 · count = 0`, 6 steps, `Terminated`, `Marking: fin · count = 2`, the demo's reading.
- S2, M1 key only: `3 defects: f3 guard (undeclared 'count'); f4 guard (undeclared 'count'); f2 action (undeclared 'count' on demoFlowB).`, `Halted`, `action-defect` at step 2.
- S3, `compileNet` over the M1 records: `owner ["M"]`, `sigma [["count",0]]`, `defects []`.
- S4, M2 (`0..5`) then M1 (`0..3`): the M2 domain held, `twice` on `M`.
- S5, `runSignature`: M1 key edited `false`, M2 key edited (control) `true`.

`git status` stayed empty after both probes (both gitignored).

## 5. Phase 2 plan for B (more than 5 files: the list P6 asks for)

1. `model/simulation/stateAttributesCodec.ts`: `mergeDeclarations(metamodel, model)`, pure. A model global shadows a metamodel global by name. A model record with a metaclass is a record defect (Q2).
2. `components/editor-v2/sim/simBridge.ts`: `startRun` decodes `lookup[modelId]._state.simStateAttributes`, drops it when `stateAttributes` is off, and merges. `declarationDefectsOf` offsets and labels. `runSignature` adds the model's `sim*` keys.
3. `components/editor-v2/sim/SimulationPanel.tsx`: the model's raw key in `mapStateToProps` on the M1 face, a `Data…` entry, and the undeclared names of the Reset line leading to it.
4. `components/editor-v2/sim/SimDataModal.tsx` (new): the model's data dialog, Apply writes `lmodel.state` once. Styles from `SimRolesModal.scss`.
5. `components/editor-v2/sim/SimRolesModal.tsx`: `Declarations` exported (additive) with a `globalsOnly` prop, and the M2 `Global` option labelled as the default.
6. `components/editor-v2/sim/simRoleStatus.ts`: the M2 hint says where globals go.
Tests: `stateAttributesCodec.test.ts` for the merge, shadow and record defect; `simBridge.test.ts` with S2 flipping to S1's reading, S5 moving and S1 unchanged. Mutation bench: drop the M1 read, the shadow, the signature term.
Not touched: `netCompile.ts`, `netStep.ts`, `stcChecks.ts`, `guardContext.ts`, `problems/`, `VersionFixer.tsx`. Exported interfaces: additive only.
Then a docs lane: the demo script §1, §2.3, §2.4 and §4, re-measured through the walk harness with the declaration phase on `B.m1`.

## 6. Risks and dependencies

- RC-22: R-SIM-90 Phase 2 (`P-2026-09-29-0010`, `sim-multi-roles-p2`) edits `simBridge.ts`, `SimulationPanel.tsx`, `SimRolesModal.tsx`
  and `simRoleStatus.ts` (its discovery §4.1, `e052ea399`), so B queues behind it. The outputs faces lane probably shares the dialog too.
- Every [M] of the two declaration steps (9 interactions and 34 keystrokes on ESM, 6 and 10 on Flow B, the 728-760 fold)
  lapses on the model tab. The Run tables hold.
- Not measured: Save and reload of a non-empty M1 sim key, and the collaborative sync of the M1 bag. The §1 Save check covers the first on rehearsal.
- R-SIM-5: `set_state` history merging within 450 ms applies to the M1 bag as it does to the M2 bag.

## 7. Files read

`frontend/src/model/simulation/{stateAttributesCodec,netCompile,netTypes,guardContext,stcChecks,roleCatalog,simProfiles}.ts`;
`frontend/src/components/editor-v2/sim/{simBridge,simRoleStatus,SimRolesModal,SimulationPanel,simCanvasState}.ts(x)` and
`__tests__/simBridge.test.ts`; `frontend/src/components/editor-v2/problems/simCheckToProblems.ts`; `frontend/src/joiner/classes.ts`
(1477, 2330-2420, 3374-3380); `frontend/src/components/project/ProjectEditor.tsx` (95-115, 1705-1740); `docs/decisions.md`
(RC-20, 21, 33; R-SIM-2, 7, 18, 19, 47-55, 67-76, 88-90); `docs/PROTOCOL.md` (P1-P6, P10-P12, P16);
`docs/demo/models_2026_simulator_demo.md`; `docs/discovery/discovery_2026-09-26_sim_state_declarations.md` §3;
`docs/spec/claude_spec_2026-09-13_computational_model.md` §3; `e052ea399:docs/discovery/discovery_2026-09-28_sim_multi_roles.md` §4.1;
`~/jjodel-w-scenes/frontend/scripts/smoke/_tmp_p1025_walk.ts` (440-470); `/Users/alfonso/jjodel-demo-exports/*.json`.

## 8. Phase 2: the declaration steps measured on the model tab (P-2026-09-29-0110)

Appended by the Phase 2 lane (branch `sim-data-level-p2`, code `b4fba8a39`..`812b17cab`); §0 to §7 above are the
discovery as committed in `8db7cf475` on `sim-data-level`, carried here verbatim so this section has a home on the branch.
Lane probe on 3040 (`lane-run probe`, light theme, 1600x1000), walk `frontend/scripts/smoke/_tmp_p0110_walk.ts`
(gitignored, copied from `~/jjodel-w-scenes` `_tmp_p1025_walk.ts`); logs `~/.jjodel-lanes/P-2026-09-29-0110/probe-*.log`.
The roles phase is unchanged (Configure…, the kind, Continue, Apply on the metamodel tab, 4 clicks). Counted as the walk
counts: a click, a select choice, a keystroke (Enter included); every target read in view before its click.

**ESM, route A: the `Data…` entry** (the entry is the first line of the M1 face; no Reset needed first) [M]:

| # | Interaction | Keys | Reading |
|---|---|---|---|
| 1 | click `Data…` | | dialog `Data of demoESM`, Add attribute focused, Apply off (`Nothing to write`) |
| 2 | click `Add attribute` | | row 1 `x1 · Global · stored`, its name focused and selected |
| 3 | type `coins`, Enter | 6 | |
| 4 | select Domain 1 `range` | | min 0, max 1 |
| 5 | click Maximum 1, type `3`, Enter | 2 | |
| 6 | click Initial 1, type `0`, Enter | 2 | row 1 `coins · Global · stored · semantic · range 0..3 · 0` |
| 7 | click `Add attribute` | | row 2 `x1`, focused and selected |
| 8 | type `paid`, Enter | 5 | |
| 9 | select Stored or derived 2 `derived` | | |
| 10 | click Equation 2, type `model.[coins] >= 2`, Enter | 19 | |
| 11 | click `Apply` | | the dialog closes; the model's bag holds the two records; the metamodel's has no `simStateAttributes`; undo stack 1 → 2 |

9 interactions (7 clicks, 2 selects) and 34 keystrokes, the same as the metamodel path, with 0 scrolls (the metamodel
path needs 2 on this screen, the Data fold being below the roles). The metaclass select offers `Global` only.
Run: Reset `Marking: locked · coins = 0, paid = false`, no defect; the ten events of §2.3; step 10
`Halted: coins of demoESM would be 4, outside its domain.`, `Marking: locked · coins = 3, paid = true`: the script's reading.

**Flow B, route B: the Reset line** (Reset first: `3 defects: f3 guard (undeclared 'count'); f4 guard (undeclared
'count'); f2 action (undeclared 'count' on demoFlowB).`, then `Undeclared: count. Declare in Data…`) [M]:

| # | Interaction | Keys | Reading |
|---|---|---|---|
| 1 | click `Declare in Data…` | | dialog `Data of demoFlowB`, row 1 `count · Global · stored · boolean · false` already there, its name focused; Apply on |
| 2 | select Domain 1 `range` | | |
| 3 | click Maximum 1, type `3`, Enter | 2 | |
| 4 | click Initial 1, type `0`, Enter | 2 | |
| 5 | click `Apply` | | the model's bag holds `count`; undo 1 → 2 |

5 interactions (4 clicks, 1 select) and 4 keystrokes, against 6 and 10 on the metamodel path (and 0 scrolls against 1).
Run: Reset `Marking: i0 · count = 0`, no defect; six ▶; `Marking: fin · count = 2`, `Terminated`: the script's reading.
On ESM the same line reads `Undeclared: paid, coins. Declare in Data…` (not walked).

**Interruption and undo** (Flow B, after the run, not counted): `Data…`, Maximum 1 to `4`, Apply: the panel reads
`Run interrupted: the model changed. Reset to run again.`, status `Not started`; one Control+z on the empty canvas puts
the record back to `0..3` (undo 3 → 2).

**The fallback** (the four scenes declared in the metamodel as today, the same walk as `_tmp_p1025_walk.ts`, on this
branch): SM 10 events to `Terminated`, `Marking: off`; Petri 4 ▶ to `Deadlock · ε: t2 false`, `Marking: p2 ×2, p3`;
ESM 10 events to `Halted: coins of demoESM would be 4, outside its domain.`; Flow B 6 ▶ to `Terminated`,
`Marking: fin · count = 2`. Every run logs one console error at load, `failed to get project {project: null}`, the known ticket.

Crops (gitignored, `sips -Z 600`): `docs/discovery/harness/_tmp_datalevel_esm_1_panel_undeclared.png` (the `Data…`
entry and the Reset line), `_tmp_datalevel_esm_2_data_dialog_empty.png`, `_tmp_datalevel_esm_3_data_dialog_declared.png`,
`_tmp_datalevel_flowB_1_panel_undeclared.png`, `_tmp_datalevel_flowB_2_data_dialog_prefilled.png`,
`_tmp_datalevel_esm_4_panel_final.png`.

Not measured: Save and reload of a non-empty model key; the collaborative sync of the model's bag; dark theme.
