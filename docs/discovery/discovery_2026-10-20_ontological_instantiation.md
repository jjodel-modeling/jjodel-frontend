# Discovery — ontological instantiation in one model: declaration, creation menu, slot synthesis, links

Prompt-ID: P-2026-10-20-1835 · prompt `docs/prompts/claude_2026-10-20_1835_prompt_ontological_instantiation_discovery.md`
Session: c8c6d443-6c92-4775-a91a-0cec352898e0 · tree `~/jjodel-w-oidisc`, branch `oi-discovery`, HEAD `5f1f3d0bd`
Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), effort xhigh · Front: instance-of · Phase 1, read-only

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.
Tags: **[M]** measured in this phase, on `5f1f3d0bd`, by the throwaway probe of §2; **[R]** read. The reads were done
by me and by five read-only explorer subagents of this session; the citations they returned that carry a
recommendation were re-read by me (list in §9).

## 0. Answer in brief

1. **Declaration (Q1).** Recommend a **named binding list in the metamodel's `_state` bag** under a key that does not
   start with `sim` (say `ontoBindings`), with a versioned JSON codec, as the Simulation roles and the codegen templates
   do. A second application (links, a third level) is a second named record; the first is not touched. [M] the bag and
   annotations both survive the project export; neither reaches the Ecore export; eAnnotations in an imported `.ecore`
   come back on the EClass and the EReference.
2. **Links are a second application of the same relation**, not a separate mechanism: same type reference
   (`InstanceSpecification.classifier`), feature container `Association.memberEnds` instead of `Class.ownedAttributes`.
   The binding is chosen by the metaclass of the classifier. Enumerations and associations fall out of the object menu
   by construction (O1).
3. **Creation menu (Q2).** 14 creation paths, 10 live, no shared funnel, and no surface lists M1 objects as creation
   options. Put «New instance of ▸ <Class>» on a new pane context menu of the editor-v2 canvas (none exists today), and
   «New instance» on the node menu of a class node. It lists the M1 objects whose metaclass conforms to the owner of the
   feature container, minus those whose abstract flag is true.
4. **Slot synthesis (Q3).** Outside the critical zone it is a new service that calls `createInstance`
   (`createAdapter.ts:491`). **It is not one undo step today** [M]: one instance plus 3 slots adds 5 undo entries and
   needs **9 Cmd+Z** to undo. One step needs a core change (`get_addObject` or undo grouping, rule 5).
   `Property.defaultValue` is an M1 value of the Property object, so the binding needs a value mapping
   (primitive type → literal metaclass).
5. **Ghost rows, orphans (Q4).** The IR cannot show a row without a child object (`irTypes.ts:168`, a closed union). It
   needs a new row source, and the problems registry needs a working quick fix (`'custom'` has no handler). Both are in
   the §3.1 critical-zone table, so a Layer Impact Report is owed.
6. **Conformance (Q5).** As user rules today, read and not run: O1, O3, O4 (error half) and O8. O2, O5, O6 and O7 need a
   closure over the generalization, which JjEL lacks (`SPEC.md:648`, a proposal). Recommend built-in checks from the
   relation's own closure.
7. **Links on the canvas (Q6).** Drawing between two instances finds 0 references and 0 connect rules today (read). It
   needs a new branch in `onConnectEnd` that offers the associations whose ends accept the two classifiers.
8. **Genericity (Q7).** No tracked non-UML metamodel has the full split. FTG+PM binds the type reference only (twice),
   which shows the feature/slot roles must be optional as a group.

**Decisions awaiting Alfonso:** questions 1-4 below. **Phase 2:** S1, S2, S2u, S3a, S3b, S4, S5 (§8).

**Questions** (§7)
1. Declaration in the metamodel bag, not in annotations? Recommended: yes, `ontoBindings`; Ecore mirror in a later slice.
2. Ratify optional roles beyond R-OI-2's six (abstract flag, default value, feature type, value mapping)? Recommended: yes.
3. Links as a second binding of the same relation? Recommended: yes.
4. One Cmd+Z per instantiation: S2 requirement or a core lane after it? Recommended: core lane S2u after S2.
5. «Sync slots» creates missing slots only; orphan removal a separate confirmed action? Recommended: yes.
6. Canvas pane menu plus class-node entry in S2, the Data manager later? Recommended: yes.
7. O2-O5 as built-in checks now, JjEL `closure` in its own lane? Recommended: yes.

## 1. Hypotheses under test and verdicts

- **H1** Jjodel already stores annotations on metaclasses and references, and they round-trip through Ecore.
  **Partly falsified** [M+R]: they live in the store and in the project export, but the Ecore export drops them. The
  import keeps them (§3.1).
- **H2** A project-level role binding like the Simulation roles exists and is reusable. **Partly** [R+M]: it lives on
  the **metamodel** `_state` bag, not on the project. It is closed to Simulation (`ROLE_IDS`), but its pattern (bag,
  codec, compatibility judge) is reusable. [M] the bag survives the project export (§3.1).
- **H3** The creation paths converge on one funnel where a service can hook. **Falsified** [R]: 14 paths, 3 families
  (§3.2).
- **H4** Creating an instance and its slots model-first is one undo step, outside the critical zone. **Half falsified**
  [M]: it is outside the critical zone, but costs 5 undo entries and 9 Cmd+Z (§3.3).
- **H5** The IR can already draw a row for a feature without a slot. **Falsified** [R] (§3.4).
- **H6** O1-O8 run as user-defined rules today. **Partly** [R]: 4 of 8, not run (§3.5).
- **H7** Drawing an edge between two instances can route to a link. **Falsified today** [R], extension point found
  (§3.6).
- **H8** A non-UML metamodel in the repository carries the same split. **Falsified** [R]: FTG+PM is partial (§3.7).

## 2. The probe [M]

`frontend/scripts/smoke/_tmp_oi_probe.ts`, gitignored (`.gitignore:68` `frontend/scripts/smoke/_tmp_*`), not committed.
Run three times. The last run, the one quoted here, exits 0:

```
GV_OUT=/tmp/oi-probe ~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-oidisc \
  frontend/scripts/smoke/_tmp_oi_probe.ts --port 3093 --id P-2026-10-20-1835
log: ~/.jjodel-lanes/P-2026-10-20-1835/probe-_tmp_oi_probe.log   (third run block, EXIT=0, end=2026-10-20T16:58:08Z)
```

The scene, built in the real app through the dashboard and the L-API:

- a UML subset metamodel of 9 classes and 8 references: NamedElement, Classifier (`isAbstract`, `generalizations`),
  Class (`ownedAttributes`), Generalization (`general`), Property (`defaultValue`, `type`), InstanceSpecification
  (`classifier`, `slots`), Slot (`definingFeature`, `values`), ValueSpecification, LiteralString (`value`);
- one M1 model with a Class `Book` (canvas create) and three Properties in `ownedAttributes`, made through
  `createInstance`.

The first two runs were blind, and that is part of the record (P12):

- Run 1 never opened the project.
- Run 2 counted the annotations in the export **text**, but `state` is LZ-compressed. The positive control
  `InstanceSpecification` was also 0, so the zero meant nothing. It also read the undo stack with
  `U.userHasInteracted` false (`EditorV2.tsx:1176-1181`), so nothing was recorded.
- Run 3 decompresses `state` (`U.decompressState`), with control = 1, and arms the gate with a pointerdown on the pane.

| Measure (run 3) | Value |
|---|---|
| annotations on DClass / DReference, in store | `["jjodel/onto.instance=default"]` / `["jjodel/onto.typeReference=default"]` |
| project export JSON (decompressed, 100906 chars, control `InstanceSpecification` = 1) | annotations 2, `ontoBindings` 1 |
| `EcoreService.exportToXML(mm, {includeAnnotations:true})` (2623 chars) | onto annotations 0, `ontoBindings` 0 |
| exported XML + hand-added `<eAnnotations source="jjodel"><details key="onto.instance" …/>` on EClass and EReference, `importFromXML` | `ok:true`; imported class `ann:["jjodel/onto.instance=default"]`, reference `[["jjodel/onto.typeReference=default"]]` |
| slot synthesis: `createInstance(InstanceSpecification,{name,classifier})`, then 3 × `createInstance(Slot, inst, 'slots', {definingFeature})`, 900 ms apart | undo depth `[0,2,3,4,5]`: 5 entries added |
| Cmd+Z presses until the model's objects equal the state before | **9**. Presses 1-8 strip the three `definingFeature` seeds one by one, with blank presses between; press 9 removes the instance and its 3 slots together |
| canvas nodes after the synthesis, default view | `["Book","title","year","isbn","dune","Slot_0","Slot_1","Slot_2"]`: every Property and Slot is a node |
| page errors | `[]` |

## 3. Findings

### 3.1 Q1 — where the relation is declared

**Annotations** [R]
- `annotations: Pointer<DAnnotation,0,'N'>` sits on `DModelElement` (`frontend/src/model/logicWrapper/LModelElement.tsx:166`).
  It is re-declared on DClass `:2721`, DReference `:3977`, DAttribute `:4347`, DPackage `:1815` and others. DObject has
  `never[]` (`:6043`).
- `DAnnotationDetail` is an empty todo class (`:194-198`), so a pair is flattened into `source` as `jjodel/key=value`.
- The importer writes that form, `api/data.ts:734`:
  `generated.push(DAnnotation.new(source ? source + '/' + key + '=' + value : key + '=' + value, [], parent.id));`
- `parseDAnnotation` is called from `parseDClass:826` and `parseDReference:989`.
- The only editor is for DAttribute (`components/editors/Info.tsx:625` → `DisplayAnnotations.tsx`). There is none for a
  class or a reference.
- The export emits only one annotation, the jjodel type mark, at `services/export/EcoreService.ts:327`:
  `<eStructuralFeatures ${parts.join(' ')}><eAnnotations source="jjodel">`.
- The option `includeAnnotations?: boolean` (`:43`) is never read. One grep, and its other hit is a comment
  (`components/editor-v2/nodes/rowViewAnnotations.ts:47`).
- `:514` says: `Coverage parziale; split instanceTypeName (EMF 2.x) e eAnnotations rimandati a W5/W4.`
- [M] §2: in store yes, project export yes, Ecore export no, Ecore import yes.

**The metamodel bag (Simulation roles)** [R]
- `_state: GObject = {};` (`frontend/src/joiner/classes.ts:1477`).
- `set_state` merges in one TRANSACTION of SetFieldActions only (`classes.ts:2397-2400`):
  `SetFieldAction.new(c.data, "_state", newState, '+=', false);`. It is safe near the sync layer (editor-v2
  `CLAUDE.md` §3.3, «SAFE — pure-action TRANSACTION»).
- The roles modal writes it with `lmm.state = result.patch;` (`components/editor-v2/sim/SimRolesModal.tsx:661`).
- The role list is closed (`model/simulation/roleCatalog.ts:24-31`). Values are D-ids: a plain id, or a JSON array string.
- Every `sim*` key enters the run signature:
  `for (const key of Object.keys(bag).filter(k => k.startsWith('sim')).sort()) sig += …` (`sim/simBridge.ts:821`).
  The codec tests pin that the other bag keys do not start with `sim`:
  `expect(RUN_WATCHES_KEY.startsWith('sim')).toBe(false);` (`model/simulation/__tests__/watchCodec.test.ts:21`).
- Compatibility judge: `model/simulation/bindingCompat.ts:1-50`, over a `MetamodelSketch` (`sim/metamodelSketch.ts:21-60`).
- Codec precedents: `codegen/engine/templateCodec.ts:31` (unknown keys survive, no VersionFixer), `scenarioCodec.ts:43`,
  `watchCodec.ts:35`, `boardCodec.ts:66`.
- [M] §2: the bag reaches the project export (`ontoBindings` = 1), not the Ecore export. 0 hits for `_state` in
  `EcoreService.ts`, `XMIService.ts` and `JsonModelService.ts` [R].

**`type-reference` of JjScript** [R]
- `jjscript/executor/dependencies.ts:33`: a label on a parse-time dependency of a command (`type X` on create/add,
  `:207-213`), always `required:false`.
- It is read by `elementWaiter.ts` and `scopeGuard.ts:45`. **No relation to the ontological relation**, so it is not a
  candidate.

**Others** [R]
- `DViewElement.appliableToClasses` / `oclCondition` bind a view, not semantics (`classes.ts:1163-1186`).
- The identity slot is a heuristic, not a declaration (`LModelElement.tsx:3232-3250`).
- There are no stereotypes or profiles.
- 0 hits for `definingFeature|ontological|instanceSpecification` in `frontend/src`.

**Recommendation.** Use the bag, key `ontoBindings`, shape `{ v: 1, bindings: [ <record>, … ] }`. Every id is an M2
D-id of the metamodel:

```
{ name: 'object',
  typeReference:    <DReference InstanceSpecification.classifier>   // owner = the instance metaclass
  featureContainer: <DReference Class.ownedAttributes>              // owner = the instantiable classifier metaclass
  generalization?:  { via: <DReference Classifier.generalizations>, general: <DReference Generalization.general> }
                    | { direct: <DReference …> }                     // optional; closure, cycles reported
  slotContainer:    <DReference InstanceSpecification.slots>
  definingFeature:  <DReference Slot.definingFeature>
  valueHolder:      <DReference Slot.values> | <DAttribute Slot.value>
  // optional, question 2:
  abstractFlag?:    <DAttribute Classifier.isAbstract>
  featureType?:     <DReference Property.type>
  defaultValue?:    <DAttribute Property.defaultValue>
  valueKinds?:      [{ when: 'primitive:String', create: <DClass LiteralString>, field: <DAttribute value> }, …,
                     { when: 'instance', create: <DClass InstanceValue>, field: <DReference InstanceValue.instance> }] }
```

Why the bag over annotations:

- One record, read and validated in one place, which is the `bindingCompat` pattern. Annotations would scatter six
  marks over six elements, with no editor for a class or a reference.
- Two applications are two named records. With annotations it would be a naming convention inside `source`.
- No core change. A pure codec module is importable in the vitest bench, the `model/nameLookup.ts` case.

The cost: an Ecore round trip loses the declaration, exactly as it loses the Simulation roles today. A later slice can
mirror the bag into one `eAnnotations source="jjodel/onto"` on the EPackage. The import path for eAnnotations already
works [M].

**A second application, without changing the first.** Add another record:
- **Links (R-OI-5):** `name: 'link'`, the same `typeReference`, `featureContainer = Association.memberEnds`. Not a
  containment: the role only needs a class-to-property reference.
- **A third ontological level:** a record whose instance metaclass is the first record's classifier metaclass (`Class`
  typed by a `Metaclass` through its own type reference).

The reader picks the record of an instance by the metaclass of its classifier: Class → `object`, Association → `link`.
Potency or deep instantiation can later be an optional field of a record. Readers of `v:1` ignore unknown keys, the
`templateCodec` precedent.

### 3.2 Q2 — the creation menu

**Paths** [R]: 14 by gesture, 10 live, in three families, with nothing shared across them (`createAdapter.ts:26-30`):

| Path | Surface | Call |
|---|---|---|
| P1 | palette drag | `PalettePanel.tsx:139-150` → `EditorV2.tsx:2432` `syncCreateObject` → `sync/canvasToJjom.ts:1520` `DObject.new` + bare `DVertex.new` |
| P2 | drag onto an IR container | `EditorV2.tsx:2374` `syncCreateObject` + `applyMembershipOps` |
| P3 | node right-click «Add X (ref)», drop on a container | `EditorV2.tsx:3333,3346` → `createCompositionChild` (`:3118`) |
| P4 | connect gesture, object-as-edge | `EditorV2.tsx:2126` `syncCreateObject` |
| P5 | Data manager catalogue «New X», outline «+», «Add X», «New X & link», Configurator | `openCreate` → `commitDraft` (`InstanceManagerTab.tsx:2304`) → `applyCreate` (`createAdapter.ts:571`) → `createInstance` (`:491`) → `addObject` |
| P6 | JjScript `create instance`, Jodie included | `jjscript/executor/commands/instance.ts:604` `DObject.new` |
| P7-P9 | XMI import, JSON import, JjTL output | `XMIService.ts:657,681`, `api/data.ts:613`, `ProjectEditor.tsx:1775,2008` |
| P10 | singleton seeding, repair | `classes.ts:1017`, `LModelElement.tsx:3048`, `EditorV2.tsx:918` |

Dormant: the classic drop (`EditorV2.tsx:2604`), the classic `ContextMenu.tsx:381,394`, `WriteCtx.create`, the debug bench.

**Not creation surfaces** [R]:
- The tree view menu offers «Add View» only (`TreeViewContent.tsx:611-704`).
- Keyboard: delete, undo, copy, paste, select (`EditorV2.tsx:2941-2990`).
- **There is no pane context menu**: `onPaneContextMenu` has 0 hits in `components/editor-v2`, against the control
  `onNodeContextMenu` at `EditorV2.tsx:2999,4761`.

**Class lists** [R]: every surface lists **M2 metaclasses**.
- `getMetaclassInfo` (`useEditorMode.ts:178`), with `concreteSubclasses` (`:406-430`) and `rootableClasses`.
- `compositionCompat.ts:167-174`: `if (!targetClass.isAbstract && !targetClass.isSingleton) { concreteOptions.push(targetClass); }` …
  `for (const sub of targetClass.concreteSubclasses) {`.

No surface lists M1 objects as creation options, so the menu is new.

**Recommendation.**
- **Where:** a pane context menu on the editor-v2 canvas («New instance of ▸ <Class>», at the click point), plus a flat
  «New instance» entry on the node menu of a class node, beside «Add reference» (`EditorV2.tsx:3360`).
- **The cascade:** the live menu item has no children field (`components/editor-v2/ContextMenu.tsx:3-17`, the fields
  `label … header`). It needs an optional `children?`, which rule 11 allows. The classic cascade
  (`components/contextMenu/ContextMenu.tsx:188-232,328-405`) is the visual precedent to port, not to wire.
- **What it lists:** the M1 objects of the model whose metaclass is the owner of the binding's `featureContainer`
  (Class) or one of its subclasses (`allSubClasses`, `LModelElement.tsx:3791`), minus those whose `abstractFlag` value
  is true, sorted by name.
  - On the library of the notation file §6 that gives Book, Magazine, Library, Member. Publication is abstract.
  - The generalization does not widen the list: every concrete class is listed in its own right. The closure is for the
    slots (§3.3).
- **O1 by construction:**
  - Enumeration (`: DataType : Classifier`) and Association (`: Classifier`) do not conform to Class, so they never
    appear.
  - Associations are offered only by the `link` record and only between two instances (§3.6).
  - Enumeration literals are made on the class side, in `ownedLiterals`.
- **What it creates:** the `typeReference` owner metaclass (InstanceSpecification) with `typeReference = <Class>`.

### 3.3 Q3 — slot synthesis

**Trace** [R]
- `LModel.addObject` is a stub (`LModelElement.tsx:5463`). The body is `get_addObject` (`:7277-7459`).
- `:7402` `TRANSACTION(this.get_name(c as any)+'.addObject()', () => {`, then
  `:7403` `let dobj = DObject.new3(constructorPointers, () => { }, isDModel?DModel:DValue, true);`.
- `Constructors.persist` fires `CreateElementAction` (`classes.ts:655-685`).
- The DValues, one per feature, come from the `instanceof` side effect (`LModelElement.tsx:6690-6742`).
- The seeds go in a **second** TRANSACTION, deferred:
  `:7421` `setTimeout(()=>TRANSACTION(this.get_name(c as any)+'.addObject() initializing values', ()=>{`.
  The reason, at `:7420`: `because at current time Constructor.setPtr actions are not executed yet. so dobject.features is empty`.
- The live app flushes on a timer: `documentEventsIntervalId = setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);`
  (`redux/reducer/reducer.ts:1449`).
- The undo stack records one delta per dispatch and merges deltas under 450 ms, or deltas that touch vertices
  (`reducer.ts:1214-1226,1280-1292`).

**[M]** §2: five entries, nine Cmd+Z. The four creations come back as one (press 9); the deferred reference seeds do not.

**The narrowest point** where creation and slots are one step is `get_addObject` itself, or the history. Two ways:
- Seed the slots inside the create composite, as `requiredBooleanInitialValues` does at birth (`LModelElement.tsx:4481-4487`).
- Group the history: the disabled `// case CombineHistoryAction.type: return combineHistory(oldState); break;`
  (`reducer.ts:1165`; `action.ts:705-707`).

Both are **core** (rule 5). Neither file is in the §3.1 table. `get_addObject` is a D-layer creator path, though, which
RC-15 (2) reads as a §3.2 trigger, so the Layer Impact Report draft is in §6.

**The alternative that avoids both** [R]: a new service module beside `createAdapter.ts`, for instance
`frontend/src/components/editor-v2/hooks/instantiate.ts`.
- It calls only `createInstance` (`createAdapter.ts:491`), which already says
  `// No outer TRANSACTION: addObject opens its own around DObject.new3.` (`:531`), and `syncCreateObject` for the
  position. It writes no creator literal and edits no §3.1 file.
- Its order:
  1. the instance, `{name, <typeReference>: [classId]}`;
  2. after the slots resolve, one Slot per feature of the closure, `createInstance(slotMetaclass, inst, <slotContainer>, {<definingFeature>: [featureId]})`;
  3. the default value objects.
- It costs N undo steps, measured. S2u is the core lane that makes them one.

**Default value** [R]
- Jjodel's own `defaultValue` / `defaultValueLiteral` on a DAttribute (`LModelElement.tsx:4360,4374`) is **not applied**
  at M1 creation. Only `requiredBooleanInitialValues` is (`:4481-4487`).
- It is not the relevant field anyway. In this design `Property.defaultValue` is an **M1 attribute value** of the
  Property object (`EString`, notation §2). The service reads `property.$defaultValue.value` through the binding's
  `defaultValue` role.
- The value object's type comes from `featureType` + `valueKinds`, by primitive type name: String → LiteralString,
  Integer → LiteralInteger, Boolean → LiteralBoolean.
- An enumeration type gives an InstanceValue on the literal of that name. A class type gives no default.
- When `valueHolder` is an attribute, the default is written straight into it.
- With an empty default the slot is born empty: O4 warns, never blocks (R-VAL-4).

**Canvas** [M]: under the default view every Property and every Slot is a node (§2). The object diagram depends on a
viewpoint that hides Slot (`visible:false`) or shows the slots as a `children` compartment. That compartment hides its
children from the canvas, `computeRowHiddenChildren` (`viewpoint/ir/irContainment.ts:322`).

### 3.4 Q4 — reconciliation, ghost rows, orphans

**IR** [R]
- `source: { from: 'attributes'; exclude?: string[] } | { from: 'references' } | { from: 'children'; filter?: Predicate };`
  (`components/editor-v2/viewpoint/ir/irTypes.ts:168`). This is a closed union: no path, no expression, no derived source.
- Slot-mode rows are the object's own DValues, mapped through `instanceof` (`IRNodeContent.tsx:296-333`).
- `children` rows are the values of the object's own composition references (`irContainment.ts:211-227`). They render as
  `<IRRow childObjectId>` (`IRNodeContent.tsx:755-775`) and are read-only (`IRRow.tsx:4`).
- `useIRRowView(childObjectId)` needs a real DObject id (`irResolve.ts:155-197`). A ghost row has none.
- A path yields one value, never a row collection (`viewpoint/ir/pathExpr.ts:25-62`, `irReadCtx.ts:104`).

**What a ghost row needs.** A new additive source, `{ from: 'instantiation'; binding?: string }`:
- one row per feature of the classifier's closure, keyed `ghost:<instanceId>:<featureId>` when no slot has that
  `definingFeature`, and by the slot id when one does;
- a slot whose feature is out of the closure as an orphan row, still drawn, never dropped;
- a first write into a ghost row that calls the service's `materializeSlot(instanceId, featureId, value)`: create the
  Slot with its `definingFeature`, then the value object. Never a write into a slot that does not exist; today the form
  refuses that case with «not on this object any more» (`viewpoint/ir/formWrite.ts:335-337`).

**Problems** [R]
- `export type NodeProblemKind = 'duplicate-name' | 'conformance' | 'validation' | 'classifier-kind' | 'simulation' | 'containment';`
  (`components/editor-v2/problems/registry.ts:55`). An `orphan-slot` kind, or a wider `instantiation` kind, is a union
  widening.
- `type: 'focus-node' | 'scroll-to-node' | 'custom';` (`registry.ts:59`). `'custom'` has no producer and no handler:
  `onAction` returns unless `targetNodeId` is set (`NodeProblemOverlay.tsx:158-167`). A real quick fix needs an
  optional `run?: () => void` (rule 11) and its branch.
- Producers to copy:
  - `ConformanceProblemSync.tsx:54`, anchored on the DObject and the DVertex (`:95-101`);
  - `UniquenessProblemSync.tsx:238`.
  - They are mounted at `EditorV2.tsx:4881-4884`.
- Anchor: a Slot drawn as a `children` row has no vertex. Its problem goes on the instance's vertex and on the Slot id,
  for the tree (`TreeViewContent.tsx:1093`) and the form (`IRForm.tsx:426`).
- **«Sync slots»** lives as a node-menu entry on an instance node, beside the «Add X (ref)» entries
  (`EditorV2.tsx:3312-3350`), and as the quick fix of the orphan or missing-slot problem. Both call the same service
  function.

### 3.5 Q5 — conformance

R-VAL today [R]:
- `DValidationRule` has `name`, `context` (one M2 class), `body` (JjEL), `message` and `enabled`
  (`model/validation/validationTypes.ts:163-196`).
- Rules run only on the explicit Validate command (`Toolbar.tsx:722-751`).
- Every violation is an error: `severity: 'error',   // nello scheletro ogni violazione e' un error`
  (`problems/validationToProblems.ts:104`).
- Rules on a superclass apply to subclasses (`validationEvaluator.ts:280`).
- The closure is absent. `jjel/SPEC.md:648`:
  `**Proposal:** Move to virtual property registration or implement a generic `closure` method (like EOL)`.
  `allSuperclasses` walks M2 supertypes only (`jjel/evaluator/evaluator.ts:488-526`). There is no `let`, no recursion.

Rules, read and not run:

| Rule | As a user rule today | Needs the relation |
|---|---|---|
| O1 | yes, branch on `self.instanceOf` (EnumerationLiteral is a subclass) | no |
| O2 | no | yes: ancestors of the classifier |
| O3 | yes, `self.slots.distinctBy(s => s.definingFeature.id).size == self.slots.size` | no |
| O4 | error half yes; the warning needs severity and ancestors | warning half |
| O5 | partly: literals by name; «the type or a descendant» needs the closure | yes |
| O6 | partly: the count; the end-type conformance needs the closure | yes |
| O7 | partly, same reason, cost objects × links × slots | yes |
| O8 | yes, nested `count`/`any` over `InstanceSpecification.instances` | no |

**Recommendation.**
- O2 is the orphan test of §3.4, and O3, O4 and O5 come out of the same closure the service computes. Make them
  **built-in checks** of the relation, live, at the right severity, in the producer of S3a.
- O6-O8 go with S4.
- A JjEL `closure` builtin is its own lane (under `frontend/src/jjel`), so that users can write the rest. It does not
  block this front.
- R-VAL-4 and R-OI-4 hold: every check publishes, none refuses a write.

### 3.6 Q6 — links

**Today** [R]
- `onConnectEnd` (`EditorV2.tsx:1761`) needs two `objectNode`s (`:1782`).
- It takes `getCompatibleReferences(` (`:1789`) and `matchConnectRules(` (`:1797`). With none of either it returns
  (`:1804`). With one of one kind it creates directly (`:1808`, `:1814`). Otherwise it opens `M1ReferencePopup`
  (`:1821`).
- The filter is on metaclass ids (`compositionCompat.ts:100-126`).
- Between two InstanceSpecifications:
  - No reference matches, because `classifier` → Classifier and `slots` → Slot.
  - The connect rule of an object-as-edge link view keeps only the first feature of each path (`irInteraction.ts:47-51`).
    For a link that is `slots`, whose type Slot rejects an InstanceSpecification end (`:141`).
  - The gesture is dropped. This is inferred from the code, not run.

**Extension point**
- A branch at `EditorV2.tsx:1788-1827`, taken when both ends are instances under a binding. It computes the M1 objects
  of the `link` record's classifier metaclass (Association) whose two member ends have `featureType` conforming to the
  two classifiers, under the generalization closure, in either order.
- It offers them as a third list in `M1ReferencePopup` (props at `EditorV2.tsx:4846-4852`): «New link: Holdings».
- The creation is the same service: a link instance, one slot per member end, one InstanceValue per slot.
- Drawing the link as an edge depends on the IR paths `slots[i].values[0].instance`, which the fixture lane measures
  (notation file §4, «Link»).

### 3.7 Q7 — genericity

**Search** [R]
- `git ls-files | grep -iE '\.(ecore|jjodel|xmi)$'` gives 29 files. The 9 `.jjodel` files were decoded in `/tmp`.
- Name greps were run for `SequenceFlow|EntityType|ComponentType|PlaceType|definingFeature|ontological|potency`.
- Controls: `ROLE_IDS`, `potency` (`decisions.md:6344`) and `SequenceFlow` all hit.

**No tracked user metamodel has the full split.**
- Petri: `Place.tokens`, `Arc.src/tgt`, no PlaceType.
- The state machines, ER (`Entity` with no population), BPMN, Families and the library catalogue (15 planned entries,
  no files) have none either.

**The nearest is FTG+PM** (`harness_FTG_PM.xmi`, repo root): `activityTypedBy="T_author"` (`:108`) and
`objectTypedBy="L_brief"` (`:144`). Activities are typed by Transformations, Objects by Languages. Its binding would be
two records with a type reference only:
`{ name:'activity', typeReference: Activity.activityTypedBy }`, `{ name:'object', typeReference: Object.objectTypedBy }`.

What follows:
- The menu works: «New Activity of ▸ <Transformation>».
- Slot synthesis has nothing to do.
- So `featureContainer`, `slotContainer`, `definingFeature` and `valueHolder` must be **optional as a group**: all four
  or none. The codec enforces it.

JjOM is the built-in instance of the pattern one level up:

| Role | JjOM |
|---|---|
| type reference | `DObject.instanceof` |
| slot container | `DObject.features` |
| defining feature | `DValue.instanceof` |
| value holder | `DValue.values` |
| generalization | `DClass.extends` (`model/simulation/objectSlots.ts:1-8`) |

## 4. Dependencies and risks

- **The fixture lane P-2026-10-14-1955** builds the UML project. The ghost-row, link-path and acceptance numbers of S2-S4
  are stated against its library. If its IR fallbacks change the object view, S3b changes.
- **The undo cost** (§3.3) holds for every multi-object creation, not just this one. Fixing it is core (S2u) and touches
  the undo of every path.
- **Clutter:** without a viewpoint, every Slot and value object is a node [M]. S2's acceptance runs under the UML object
  viewpoint.
- **R-NEST-1:** nested objects are in `DModel.objects`, so they get vertices. The comment at `createAdapter.ts:544-545`,
  «A CONTAINED child only: a root already gets its vertex … sees roots and only roots», predates it. Rule 9: left
  alone, noted.
- **The closure over a user-modelled generalization** is new code with a cycle guard (C1). It must be pure and tested
  on a mutation bench: drop the cycle guard, drop an inherited feature.
- **Union widenings** in `irTypes.ts` and `registry.ts`: exported types, additive only (rule 11). `irVersion` is not
  bumped for an additive source; to confirm in S3b.
- **Ecore:** a project exported to `.ecore` and back loses the binding [M], like the Simulation roles today.
- **Release 3.2:** nothing of this front enters it (freeze 2026-10-23).

## 5. Layer impact per slice

| Slice | §3.1 files edited | §3.2 trigger | Layer Impact Report |
|---|---|---|---|
| S1 | none | no | not required |
| S2 | none: calls `createInstance` and `syncCreateObject` only | no creator literal | not required; a reviewer greps the diff for `.new(` |
| S2u | none in the table; `get_addObject` or `reducer.ts` is core | D-layer creator path (RC-15 (2)) | **required**, draft in §6 |
| S3a | `problems/registry.ts`, `NodeProblemOverlay.tsx`, a new `*ProblemSync.tsx` | no | required (the `problems/` row of the table) |
| S3b | `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `IRRow.tsx` | no | required (the `viewpoint/ir/` row) |
| S4 | none if it calls the existing `canvasToJjom` exports; `EditorV2.tsx` is not in the table | no | not required |
| S5 | none | no | not required |

## 6. Layer Impact Report — draft for S2u (core alternative of Q3)

```
LAYER IMPACT REPORT (draft, Phase 1; owed again before any S2u diff)

Layers touched:
  [x] D-layer (Redux raw data)      — only if seeding moves into the create composite (get_addObject)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Undo history (reducer.ts statehistory) — if grouping is chosen instead

What changes: either (a) the history merges the entries recorded between two marks into one (re-enabling
  CombineHistoryAction, reducer.ts:1165, action.ts:705), or (b) get_addObject writes its seeds in the creation
  composite instead of the 2×UpdatingTimer deferral (LModelElement.tsx:7421).
What does NOT change: vertex/edge creators, sync Steps, canvasToJjom, the position of a created node.
Cross-layer interaction: (a) one Cmd+Z restores vertices and objects together; the 450 ms / vertex merge rule
  (reducer.ts:1214-1226) must not swallow the group's boundary. (b) touches every addObject caller (P5, P8, P9).
Side-effect safety: (b) is the riskier one: the deferral exists because the slots are not in the store yet (:7420).
Smoke-test scenarios potentially affected:
  - undo-inline-edit probe cases (row, label, direct, proxy, object, rename) unchanged
  - Data manager «+ New» with seeds, then one Cmd+Z: the object gone
  - this report's probe: 1 instance + 3 slots → 1 entry, 1 Cmd+Z
Uncertain about propagation? → STOP and ask.
```

Recommendation: (a), not (b).

## 7. Questions for Alfonso

1. Declare the relation in the metamodel bag (`ontoBindings`, a named record list), not in annotations? Recommended:
   yes; the Ecore mirror as a later slice.
2. Ratify optional roles beyond R-OI-2's six: abstract flag, feature type, default value, value mapping
   (primitive → literal metaclass)? Recommended: yes, optional, the four slot roles all-or-none.
3. Links as a second record of the same relation (`featureContainer = Association.memberEnds`)? Recommended: yes.
4. One Cmd+Z per instantiation: an S2 requirement, or the core lane S2u after S2 with the count declared? Recommended:
   S2u after S2, option (a).
5. «Sync slots» creates the missing slots only, and removing orphans is a separate action with a confirmation?
   Recommended: yes (R-OI-3, nothing deleted silently).
6. S2 surfaces: a new pane context menu with the cascade, plus «New instance» on a class node; the Data manager later?
   Recommended: yes.
7. O2-O5 as built-in live checks of the relation, and JjEL `closure` as its own lane? Recommended: yes.

## 8. Phase 2 plan, in slices

Each slice is one session (RC-52) and starts from the committed result of the slice before.

**S1 — declaration and reader.**
- Files: new `frontend/src/model/ontological/bindingCodec.ts`, `bindingReader.ts` (roles → ids, record per instance,
  generalization closure with cycles reported), `bindingCheck.ts` (a `bindingCompat`-style judge), and their
  `__tests__`.
- A declaration surface is the open point: a minimal modal on the metamodel modelled on `SimRolesModal.tsx`, or none in
  S1 with the binding written by the fixture through `mm.state`. Recommended: none in S1.
- Critical zone: no. Files: 3 + tests.
- Acceptance:
  - the codec round-trips and keeps unknown keys;
  - the reader on the library gives Book's closure `title, year, isbn, genre`;
  - a cycle Publication ⇄ Book is reported, not followed;
  - a record missing one of the four slot roles is refused;
  - mutation bench: drop the cycle guard, drop the inherited hop, both red.

**S2 — creation menu and slot synthesis.**
- Files: new `components/editor-v2/hooks/instantiate.ts`; `EditorV2.tsx` (pane menu and class-node entry);
  `components/editor-v2/ContextMenu.tsx` (optional `children?`); its stylesheet if the cascade needs one (tokens only,
  rule 28). 4 files.
- Critical zone: no.
- Acceptance [M], probe on the fixture's library:
  - the pane menu lists exactly Book, Magazine, Library, Member;
  - «New instance of ▸ Book» gives an instance with `classifier = Book` and 4 slots, `title, year, isbn, genre`, in
    closure order;
  - «Member» gives `active` with a LiteralBoolean `true` from `defaultValue`;
  - no Enumeration and no Association is offered;
  - the undo count is declared.

**S2u — one undo step (core, rule 5, Layer Impact Report).**
- Files: `redux/reducer/reducer.ts`, `redux/action/action.ts`, `instantiate.ts`.
- Acceptance [M]:
  - this report's probe gives 1 entry and 1 Cmd+Z;
  - the cases of `undo-inline-edit.ts` are unchanged.

**S3a — orphan and missing slots as problems, «sync slots».**
- Files: `problems/registry.ts` (kind and optional `run`), `problems/NodeProblemOverlay.tsx` (handler), a new
  `problems/InstantiationProblemSync.tsx`, `EditorV2.tsx` (mount and node entry), `instantiate.ts`. 5 files.
- Critical zone: yes (`problems/`), Layer Impact Report.
- Acceptance:
  - deleting the Property `isbn` leaves dune's slot in place as an orphan problem;
  - adding `pages` to Book shows a missing-slot problem on dune;
  - «Sync slots» creates the `pages` slot and deletes nothing;
  - O3 (a duplicate slot) and O5 (`year` as a LiteralString) are reported live, and the write that made them is not
    refused.

**S3b — ghost rows.**
- Files: `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `IRRow.tsx`, `instantiate.ts`. More than 5
  with a test: rule 19 pause.
- Critical zone: yes (`viewpoint/ir/`), Layer Impact Report.
- Acceptance [M], DOM:
  - after «Add attribute pages» on Book, dune shows a `pages =` ghost row with no Slot object in the store;
  - typing 300 into it creates one Slot and one value object and the row turns real;
  - an orphan row is drawn and marked.

**S4 — links.**
- Files: `EditorV2.tsx` (the `onConnectEnd` branch), `M1ReferencePopup`, `instantiate.ts`, `bindingReader.ts` (end
  conformance).
- Critical zone: no.
- Acceptance [M]:
  - a drag from alice to dune offers only «Borrowing»;
  - cityLib to dune offers «Holdings» only;
  - the link created has 2 slots in `memberEnds` order, each with one InstanceValue;
  - O6 holds on it.

**S5 — the rest of conformance.**
- Files: `InstantiationProblemSync.tsx` (O4 warning, O6-O8), and an example R-VAL rule set (O1, O3, O8) as a doc.
- JjEL `closure` is not here: it is its own lane.
- Acceptance: the five seeded violations of the fixture prompt (O1, O5, O7, C1, C7) are caught by the object rules
  through the registry, each by its own rule only.

## 9. Files read (full paths)

Read by me, re-read where the agents' citations carry a recommendation:
- `/Users/alfonso/jjodel-w-oidisc/docs/decisions.md` (6335-6362, R-OI)
- `/Users/alfonso/jjodel-w-oidisc/docs/PROTOCOL.md` (P4, P9, P16)
- `/Users/alfonso/jjodel-w-oidisc/docs/archivio/claude_2026-10-14_uml_class_object_notation.md` (whole)
- `/Users/alfonso/jjodel-w-oidisc/docs/prompts/claude_2026-10-14_1955_prompt_uml_class_object_fixture.md` (whole)
- `/Users/alfonso/jjodel-w-oidisc/docs/discovery/discovery_2026-10-11_new_model_instantiate.md` (§0, §3)
- `/Users/alfonso/jjodel-w-oidisc/frontend/scripts/probe/bpmn-lanes-fixture.ts` (1-54, 184-333, 344-362, 420-439, tail)
- `/Users/alfonso/jjodel-w-oidisc/frontend/scripts/probe/undo-inline-edit.ts` (1-41, 60-119, 230-269)
- `/Users/alfonso/jjodel-w-oidisc/frontend/scripts/probe/new-model-instantiate.ts`, `jjscript-m1-containment.ts` (headers)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/components/editor-v2/hooks/createAdapter.ts` (485-556)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/api/data.ts` (723-741)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/joiner/classes.ts` (1475-1479, 2356-2402)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/components/editor-v2/sim/SimRolesModal.tsx` (652-663); `sim/simBridge.ts` (202, 821)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/services/export/EcoreService.ts` (36-50, 94-224 outline, 327-328, 514)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/model/megamodelPersistence.ts` (97-106); `common/U.tsx` (426-429)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (166-169); `IRNodeContent.tsx` (296-307)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/components/editor-v2/problems/registry.ts` (55-61); `validationToProblems.ts` (104)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/model/logicWrapper/LModelElement.tsx` (7402-7403, 7420-7421, 546-550)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/redux/reducer/reducer.ts` (1165, 1449); `redux/action/action.ts` (705-707)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/components/editor-v2/utils/compositionCompat.ts` (167-174)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/components/editor-v2/ContextMenu.tsx` (3-17); `EditorV2.tsx` (1172-1184, 1782-1821, 2999, 4761)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/jjel/SPEC.md` (646-651)
- `/Users/alfonso/jjodel-w-oidisc/frontend/src/components/editor-v2/CLAUDE.md` (§3.3-§3.5)
- `/Users/alfonso/jjodel-w-oidisc/harness_FTG_PM.xmi` (108, 144)

Read by the explorer subagents (citations in §3, not all re-read):
- `frontend/src/model/logicWrapper/LModelElement.tsx` (annotations, `get_addObject`, the hierarchy getters)
- `frontend/src/components/editors/Info.tsx`; `editor-v2/nodes/rowViewAnnotations*.ts`, `DisplayAnnotations.tsx`
- `frontend/src/pages/components/Project.tsx`; `api/persistance/projects.ts`
- `frontend/src/model/simulation/roleCatalog.ts`, `bindingCompat.ts`, `profileCodec.ts`, `objectSlots.ts`;
  `editor-v2/sim/metamodelSketch.ts`, `simRolesDraft.ts`
- `frontend/src/jjscript/executor/dependencies.ts`, `commands/instance.ts`, `commands/create.ts`
- `frontend/src/components/editor-v2/EditorV2.tsx` (creation, menus, connect)
- `editor-v2/panels/PalettePanel.tsx`; `abstract/tabs/InstanceManagerTab.tsx`, `InstanceDetail.tsx`;
  `environment/ConfiguratorTab.tsx`; `jjform/outline.ts`, `create.ts`, `shape.ts`; `editor-v2/hooks/useEditorMode.ts`
- `frontend/src/components/contextMenu/ContextMenu.tsx`; `TreeViewSidebar/TreeViewContent.tsx`
- `frontend/src/redux/action/action.ts`, `redux/reducer/reducer.ts`; `editor-v2/sync/canvasToJjom.ts` (read only)
- `editor-v2/viewpoint/ir/irCompile.ts`, `irResolve.ts`, `irContainment.ts`, `IRRow.tsx`, `pathExpr.ts`, `irReadCtx.ts`,
  `irInteraction.ts`, `formWrite.ts`, `IRForm.tsx`, `irEdgeViews.ts`, `edgeEndpoints.ts`
- `editor-v2/problems/*` (registry, overlay, the four `*ProblemSync.tsx`, `containmentToProblems.ts`,
  `validationToProblems.ts`)
- `frontend/src/model/validation/validationTypes.ts`, `validationEvaluator.ts`, `validationContext.ts`;
  `frontend/src/jjel/evaluator/evaluator.ts`, `builtins/collections.ts`, `context.ts`; `jjscript/executor/commands/eval.ts`
- `docs/spec/claude_spec_2026-09-08_user_defined_validation.md`; `docs/decisions.md` (R-VAL)
- the 29 tracked `.ecore`/`.jjodel`/`.xmi` files (§3.7)
