# Discovery — «Instances of» rail section and binding declaration from the UI

- Prompt-ID: P-2026-11-08-0049 (`docs/prompts/claude_2026-11-08_0049_prompt_onto_rail_binding_discovery.md`)
- Chat: C-2026-10-25-2159, front `instance-of`, lane discovery (read-only)
- Session: b749132a-8c55-42e0-af6f-a1dee6efd5de
- Tree: `~/jjodel-w-oi-rail`, branch `oi-rail`, HEAD `2e71bf482` at the start (the prompt's `docs:` commit; the session
  banner listed it as `50081dd49`, the same subject, before its `Claude-Session:` trailer was added). Clean status.
- Executor: Opus 5.5 (`claude-opus-5-5`), effort xhigh
- Every line number below was read on `2e71bf482`.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the
real files.

## 1. Objective

The prompt asks for one slice in two parts:

1. **Rail.** A second section, «Instances of», in the left rail of an M1 model. It lists the classifiers each binding
   record makes instantiable. A drag or a click runs the pane menu's `instantiate()` path.
2. **Declaration.** A binding editor for the metamodel: «Detect», a role table the user can correct, and Confirm. Confirm
   writes `ontoBindings` through the codec in one undo step.

This report answers the seven COSA questions and proposes the implementation lanes.

## 2. Hypotheses under test, and verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A second rail section fits without touching the linguistic creation path. | **Holds** (read, §3.1) |
| H2 | A function already lists a model's classifiers that can be instantiated under a record. | **Holds**: `creationOptions`. It is not reactive (read, §3.2) |
| H3 | `instantiate()` accepts a canvas point from a drop, and a drop handler can be reused. | **Partly**. The point is accepted through `runInstantiate`, but `onDrop` cannot be reused as it stands (read, §3.3) |
| H4 | The metamodel's `_state` is written in one undo step with no core change. | **Holds** (read, §3.4). The undo of a first declaration is not measured |
| H5 | `bindingCheck.ts` already gives the editor its errors. | **Partly**. It covers the shape rules but has no app consumer, and the probe's own `link` record fails it (measured, §3.5) |
| H6 | No §3.1 file has to change, and neither does `reducer.ts` or an exported interface. | **Holds** for the plan in §5 (read, §3.6) |
| H7 | The `uml-s3b` export does not contain the binding. | **Holds** (measured, §3.7) |
| H8 | The probe's setup is a name heuristic «Detect» can generalize. | **Partly**. It is a fixed UML name table matched on (class, feature) pairs. Feature names alone are ambiguous (measured, §3.5) |

## 3. Findings

### 3.1 The left rail (COSA 1)

- The rail is `PalettePanel`. EditorV2 mounts it for M1 and M2 alike, always: `frontend/src/components/editor-v2/EditorV2.tsx:5241`
  `<PalettePanel` with `editorMode={modeInfo.mode}`, `rootableClasses={irPalette.classes}` and `onItemActivate={onPaletteActivate}`.
- In M1 it takes its own branch: `panels/PalettePanel.tsx:141` `if (editorMode === 'model') {`, then `:143` `<aside className={`editor-v2-palette editor-v2-palette--m1...`.
  The first block is `:145-146` `<div className="palette-instances">` / `<div className="palette-instances__title">Instances</div>`.
  M2 uses a separate `return` (`:272-313`, explorer). An M1-only section cannot leak into M2.
- **The linguistic list.** `hooks/useEditorMode.ts` builds it through `resolveM1Info`:
  - The classes are `container.classes ?? container.classifiers` (`:228`).
  - Rootable is `!c.isAbstract && !c.isSingleton && !compositionTargetIds.has(c.id)` (`:450-452`).
  - It is reactive through `metamodelSignature(state.idlookup, mmId)` (`:106`, `:123`; `hooks/metamodelSignature.ts:67-90`).
  - The list is of **M2 metaclasses**, and nothing in it subscribes to M1 objects (explorer, lines read by it).
  - The «Instances of» list is of **M1 objects**: the UML `Class` objects of the model. It needs its own selector.
- **The structure.** The M1 branch is a flat list of sibling blocks: `.palette-instances`, then `.palette-info-cards`
  (`:195`), then `.palette-hints` (`:254`). There is no sections array and nothing collapsible.
  - A new sibling `<div>` after the `.palette-instances` block closes (`:192`) and before `{/* Read-only info cards */}` (`:194`) leaves
    `onDragStart` (`:87-96`), `onItemActivate` and `rootableClasses` unchanged.
  - `PalettePanelProps` (`:60`) is not exported: `interface PalettePanelProps {`. Adding optional props is not an interface change under rule 11.
- **The drag payload** (`:88-95`, read): `event.dataTransfer.setData('application/reactflow', type);`. With a class it also sets
  `'metaclassId'` and `'application/jjodel-classic'`, and calls `setDraggedMetaclassId(metaclassId)`. `onDragEnd` resets it (`:100-101`).
- **No mime registry.** The keys are string literals, in `PalettePanel.tsx:88-94`, `EditorV2.tsx:2737,2740` and `nodes/ClassNode.tsx:384,393`
  (explorer). `events/registry.ts` holds no `application/` key.
- **SCSS.** `EditorV2.scss` alone defines the palette, as flat `palette-*` names:
  - `.editor-v2-palette` (`:1271`, 200 px wide, `overflow-y: auto` `:1279`), `--m1` (`:1393`).
  - Inside `--m1`: `.palette-instances__{title,list,item,...}`, `.palette-card`, `.palette-ref`, `.palette-hint`.
- **Collisions** (measured, `command grep -rlF -- <name> .` from `frontend/src`, files / occurrences):

  | Name | Files | Occurrences |
  |---|---|---|
  | `palette-onto` | 0 | 0 |
  | `onto-binding` | 0 | 0 |
  | `OntoBindingModal` | 0 | 0 |
  | `bindingDetect` | 0 | 0 |
  | `detectOntoBindings` | 0 | 0 |
  | `ontoRailSections` | 0 | 0 |
  | `editor-v2-palette` (positive control) | 5 | 16 |

  The explorer also measured `palette-panel__instances`, `onto-rail`, `instances-of` and `onto-palette` at 0 / 0.
  `palette-instances` is taken: 2 files, 10 occurrences, the existing block.
- **Wording.** The existing M1 block is already titled «Instances». A sibling titled «Instances of» reads close to it
  (question 4).

### 3.2 The set of classifiers that can be instantiated (COSA 2)

- The pane menu builds the set at its opening. `EditorV2.tsx:3230` `const record = objectRecord(get, modelid);` and `:3236`
  `pane: { record, options: creationOptions(get, record, modelid) },`.
- `hooks/instantiate.ts:142` `export function creationOptions(get: DGet, binding: OntoBinding, modelId: string): CreationOption[] {`
  is `instantiableClassifiers(ontoReadView(get), binding, modelObjectIds(get, modelId))`, sorted by name (`:143-146`).
- **Abstract classes.** `model/ontological/bindingReader.ts:114` `return !(abstractFlag !== undefined && isTrue(view.attributeValue(id, abstractFlag)));`.
  This reads the record's `abstractFlag` attribute (UML `Classifier.isAbstract`) on the M1 object, not the M2 `abstract` flag.
- **Generalization.** The set is not filtered by it. A subclass is listed in its own right, because eligibility is
  `view.conformsTo(meta, owner)` over the M2 `extends` (`bindingReader.ts:113`; `instantiate.ts:83-94`). Generalization
  only feeds `featureClosure`, which gives the slots.
- **The objects scanned.** `modelObjectIds` (`instantiate.ts:118-134`) is the roots, then breadth-first every contained
  object. A `Class` nested in a `Package` object is therefore found.
- **Links.** The same function with the `link` record lists the associations. `bindingReader.ts:17`
  `instantiableClassifiers`: «the M1 objects whose metaclass conforms to the owner of the feature container». It is
  pinned by `model/ontological/__tests__/bindingReader.test.ts:225` `it('the link record offers the associations', ...)`.
  No app code reads a `link` record. Measured with `grep -rn "LINK_RECORD\|name === 'link'\|'link' record\|link record"`
  over `src/components/editor-v2` and `src/model/ontological`: only test hits. The positive control, `OBJECT_RECORD` through
  the same command, hit `instantiate.ts:56,108,114` and `problems/instantiationToProblems.ts:24,86,115`.
- **Reaction to edits.** There is none. The options are computed once per right click and live in `contextMenu.pane`
  (`EditorV2.tsx:3236`, `:3952`). The rail needs a selector that recomputes on every relevant store change.
  - Precedent 1: `problems/InstantiationProblemSync.tsx:44-50`, `instantiationSignature(lookup, modelid)`. It returns `''` when there are no bindings,
    then the bag string and `o${id}=${r.instanceof}` for each DObject.
  - Precedent 2: `memoBindings` (`instantiate.ts:376-386`), «a single-entry memo of the last bag decoded: the read runs on every node at every dispatch».

### 3.3 The drop entry (COSA 3)

- **The canvas point is accepted.** `runInstantiate` takes a point in client coordinates and converts it
  (`EditorV2.tsx:3248-3250`): `const runInstantiate = useCallback((classifierId: string, record: OntoBinding, click?: { x: number; y: number }) => {` /
  `const activeKey = tabLayoutKey();` / `const clickAt = click ? screenToFlowPosition(click) : null;`.
  - The click point goes only to the tab's layout key (`:3255` `if (layoutKey === activeKey && clickAt) return clickAt;`), as R-MT and P-2026-11-07-1620 require.
  - Every other layout gets the centre of its stored viewport (`:3257`).
  - The tab's viewpoint is passed on (`:3259` `void instantiate(classifierId, record, placeAt, viewpointIdRef.current)`).
  - A drop's `{x: event.clientX, y: event.clientY}` is therefore the same input as the pane menu's click.
- `tabLayoutKey` (`:601-603`): `viewpointIdRef.current === undefined ? getActiveLayoutKey() : getLayoutKeyFor(store.getState(), viewpointIdRef.current)`.
- **Queue, deadline and undo come free.** `instantiate()` (`hooks/instantiate.ts:779-783`) is `queued(() => instantiateNow(...))`. `instantiateNow` opens
  `history.beginUndoGroup()` with the 8 s `INSTANTIATE_DEADLINE_MS` (`:797-798`, `:591`) and closes it in `finally` (`:805`).
  Any new caller of `runInstantiate` inherits all three.
- **The existing `onDrop` cannot be reused as it is.** `EditorV2.tsx:2737-2738` `const rawType = event.dataTransfer.getData('application/reactflow');` /
  `if (!rawType) return;`, then `createFromPalette(...)` (`:2740`), the linguistic path (`syncCreateObject` → `DObject.new`, explorer).
  - A rail drag must carry its own key: `application/reactflow` would route it into `createFromPalette` and into the
    ClassNode/EnumNode drop handlers.
  - `onDrop` then needs one branch ahead of `:2737` that reads that key and calls `runInstantiate`.
  - The record is best re-read at the drop (`objectRecord(get, modelid)`, or by name), not carried in the payload: a
    binding edit between drag start and drop then cannot run a stale record.
- **`onDragOver` needs no branch** (`:2757-2782`). It tests `getDraggedMetaclassId()` only. A rail drag must **not** call
  `setDraggedMetaclassId`: the id would be an M1 object id, and the M1 branch (`:2763-2777`) would show `none` over the
  empty canvas.
- **Click.** The linguistic click drops at the centre of the visible canvas, the right overlay excluded (`:2751`
  `createFromPalette(type, metaclassId, clientCentre(canvas.getBoundingClientRect(), getCanvasRightInset()));`).
  `runInstantiate` with no click uses `viewCentre` over the whole pane (`:3253-3257`). A rail click that passes
  `clientCentre(...)` as `click` places both palettes the same way.
- **Placement differs from the linguistic drop.** `createFromPalette` subtracts half of a 140×40 default box
  (`:2504-2507`, explorer). `instantiate` writes the point as the node's `x, y` (`instantiate.ts:657`), as the pane menu does.

### 3.4 The metamodel properties panel and `_state` writes (COSA 4)

- **The panel.** It is `Info.tsx`, rendered by `PropertiesWithTreeView` (`components/editors/PropertiesWithTreeView.tsx:1113`, explorer).
  - It dispatches on the selection's D class: `case 'DModel': jsx = builder.model(...)` (`components/editors/Info.tsx:1565-1566`).
  - The metamodel sections (`Info.tsx:517-527`, read): `<CollapsibleSection title="General">`, then
    `{l.isMetamodel && advanced && <CollapsibleSection title="Semantic type class">` / `<SimulationToggle modelId={l.id} />`, then «Dependencies».
  - The «Semantic type class» section is already the Advanced home of a metamodel-level semantic setting. A binding
    entry fits there.
  - `advanced` is `ret.advanced = state.advanced` (`:1785`, explorer). This is progressive disclosure: Basic hides the section.
- **How `_state` is written.** The pattern is `LPointerTargetable.fromPointer(id).state = patch`. `set_state` (`joiner/classes.ts:2357`)
  merges the patch, and ends in one TRANSACTION (`:2399-2402`, read): `TRANSACTION(this.get_name(c)+'.state', ()=>{` /
  `if (Object.keys(newState)) SetFieldAction.new(c.data, "_state", newState, '+=', false);` / `... removedState as any, '-=' ...`.
  It is one undo entry, with no `beginUndoGroup` and no reducer change.
- **Precedent for one step.** `Info.tsx:327-328`: «write: `state = { simEnabled }`, one TRANSACTION and one undo step;
  off writes `false`, not a removal, since the undo of a removed `_state` key does not restore it». For a binding editor:
  - «Remove» writes `{"v":1,"bindings":[]}`, never `undefined`.
  - An empty list already reads as «no binding» everywhere: `objectRecord` is `null`, the pane menu does not open
    (`EditorV2.tsx:3231`), and `instantiationSignature` returns `''`.
- **The role-table editor to copy is `SimRolesModal`** (`components/editor-v2/sim/SimRolesModal.tsx`, explorer).
  - It keeps a local draft and writes nothing before Apply.
  - Apply (`:661-672`, read): `const result = draftApply(input, lookup, ...)`, then `if (result.kind === 'refused') { setError(...); return; }`, then `lmm.state = result.patch;`.
  - It is portaled to `document.body` and stops key and pointer events at its root (`:37-42`, read): «the editor's own
    onKeyDown (Backspace deletes the selection, EditorV2.tsx) would otherwise receive them».
  - Its pure layer is `sim/simRolesDraft.ts` (`draftProposals :193`, `draftPatch :210`, `draftApply :239`, explorer).
  - The binding editor copies the shell, not the role binder: `roleCatalog.ts:26-27` says instance-of is not a Simulation role (explorer).
- **Input for Detect.** `sim/metamodelSketch.ts:22` `export function sketchOfMetamodel(lookup: Record<string, any>, modelId: string): MetamodelSketch {`.
  It is pure and gives the class name, `abstract`, `supers`, and each feature's `owner` and `type`. These are what
  `bindingCheck.ts` judges (`import type { MetamodelSketch } from '../simulation/profileBinder';`, `bindingCheck.ts:22`).
- **`Info.tsx` already imports from editor-v2.** `Info.tsx:38` `import { simEnabledPatch, simulationEnabled } from '../editor-v2/sim/simRoleStatus';`.
  A modal under `components/editor-v2/` adds no new direction of dependency.

### 3.5 Detection, validation, and change or removal (COSA 5)

- **The codec's roles.**
  - Required: `name` and `typeReference` (`model/ontological/bindingCodec.ts:134-135`).
  - Single-id roles (`:80`): `const ID_ROLES = ['featureContainer', 'slotContainer', 'definingFeature', 'valueHolder', 'abstractFlag', 'featureType', 'defaultValue'] as const;`.
  - Structured roles: `generalization`, `{via, general}` or `{direct}` (`:25-27`); `valueKinds`, a list of `{when, create, field}` (`:30-38`);
    `featureSources`, a list of `{path}` (`:41-45`).
  - Unknown keys are kept on the root and on each record (`:14`, `:154`, `:181`). An unknown `v` is refused (`:172`).
  - Any defect makes the whole key unreadable (`:158-159`): «Any defect makes the whole key unreadable, with every defect listed».
- **The probe's setup** (`frontend/scripts/probe/onto-s2-instantiate.ts:233-254`, read):
  - Classes are looked up by exact name inside the metamodel (`:236`).
  - Each role is `F(c, n)`: the feature named `n` among the **own** attributes and references of the class named `c`
    (`:239` `const id = k && [...(k.attributes || []), ...(k.references || [])].find((f) => idl[f] && idl[f].name === n);`).
  - The table has 15 (class, feature) pairs, plus 4 literal classes for `valueKinds`:
    - `InstanceSpecification.classifier`, `InstanceSpecification.slots`
    - `Slot.definingFeature`, `Slot.values`
    - `Class.ownedAttributes`
    - `Classifier.generalizations` with `Generalization.general`
    - `Classifier.isAbstract`, `TypedElement.type`, `Property.defaultValue`
    - `LiteralBoolean` / `LiteralString` / `LiteralInteger.value`, `InstanceValue.instance`
    - `Association.memberEnds` (`link`)
  - A missing name aborts the setup (`:253`).
  - The write is `w.LPointerTargetable.fromPointer(mm).state = { ontoBindings: JSON.stringify({ v: 1, bindings: [object, link] }) };` (`:254`).
  - This is a UML name table, not a general heuristic (H8). For another metamodel, Detect proposes nothing, and the
    corrected table is the declaration.
- **Measured on `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`.** The store was decompressed with `async-lz-string`, as
  `codegen/examples/__tests__/importable.test.ts:41` does.
  - All 15 pairs resolve on the named class itself: «probe pairs found on the named class itself: 15 / 15 missing: none».
  - Feature names are ambiguous across classes: «feature names held by >1 feature: type×2, visibility×2, value×3».
  - Detect must therefore match on (owner class, feature name), never on the feature name alone.
- **What `bindingCheck.ts` already validates** (`:5-15`, read):
  - Every id exists and has the sort its role needs.
  - The type reference and the slot container share their owner (`:85-86`).
  - The defining feature is owned by the slot metaclass (`:89-90`).
  - The four slot roles come together or not at all (`:40`, `:77-81`).
  - The `featureSources` hops chain correctly.
  - A name is held only once (`:131-133`).
  - Defects are data: `role`, `message` per record (`:25-31`). The editor can show them per row.
  - **It has no app consumer.** `grep -rln "checkBindings\|checkBinding\b"` over `frontend/src` returned only `bindingCheck.ts` and its test.
- **Measured: the probe's `link` record fails `checkBindings`.** It carries three of the four slot roles (`:252`
  `{ name: 'link', ...shared, featureContainer: ... }`, with `shared` at `:241-242`) and no `valueKinds`. Running
  `checkBindings` on that shape over a five-class sketch (Node type stripping, a `/tmp` script since deleted) gave:
  `{"ok":false,"defects":[{"binding":"link","role":"slotRoles","message":"The slot roles come together or not at all; missing: valueKinds."}]}`.
  The test fixture's `link` carries no slot roles at all (`__tests__/bindingCheck.test.ts:46`), so the suite stays green.
  A Detect that copies the probe would propose a defective `link` record (question 3).
- **Changing or removing a binding never touches existing instances.** Every consumer derives its result from the bag
  at read time:
  - Ghost and orphan rows: `instanceRows` returns `null` when `bindings.length === 0` (`instantiate.ts:398`).
  - Problems: `instantiationToProblems.ts:87` `if (!objectRecord) return [];`. `InstantiationProblemSync` re-signs on the bag string (`:46`).
  - The DCN producer: `problems/dcnToProblems.ts:128` `decodeOntoBindings(raw[ONTO_BINDINGS_KEY])`, and `:155`, the bag inside its signature.
  - The pane menu: `EditorV2.tsx:3231`.
  - What follows:
    - The `InstanceSpecification` objects, slots and values stay as plain M1 objects. Nothing is deleted (R-OI-3).
    - A removed binding hides the rows and clears the findings.
    - A changed `featureContainer` or `definingFeature` can turn every slot into an orphan error at once (R-OI-13).
    - A metamodel shared with the DCN client sees its DCN findings recomputed too.
  - Read, not measured.
- **The binding and undo.** The S2-3 probe already hedges for the case where a Cmd+Z reaches the binding write
  (`onto-s2-instantiate.ts:373-375` «The undo took the binding: write it again»). The undo of a first declaration (a key
  added by `+=`) is therefore not proven to remove it cleanly. It is owed as a probe check in lane B.

### 3.6 Critical zone and core (COSA 6)

- **Candidate files outside the §3.1 table:** `EditorV2.tsx`, `panels/PalettePanel.tsx`, `EditorV2.scss`, `hooks/instantiate.ts`, `components/editors/Info.tsx`,
  `sim/metamodelSketch.ts` (imported only) and the new files of §5. The §3.2 list (`useJjomSync`, `syncState`,
  `canvasToJjom`, `portDistribution`, `useM1ReferenceEdges`, `VersionFixer`) is not touched.
- **In the critical zone, imported only:** `problems/` (`InstantiationProblemSync.tsx`, if its signature is reused). The plan keeps
  `bindingCheck` defects inside the editor and adds no problem kind, so nothing under `problems/` changes.
- **Core:**
  - `reducer.ts` does not change. The rail rides `instantiate()`'s existing group, and the declaration rides `set_state`'s one TRANSACTION.
  - No exported interface changes. `OntoBinding` and `CreationOption` are read as they are. `PalettePanelProps` is not exported.
  - New optional props only.
- **Rule 12 holds.** No creator is wrapped: the rail calls `runInstantiate`, and the declaration is a pure
  `SetFieldAction` TRANSACTION.
- **Rule 14 does not apply.** No default-view source is touched.
- **A Layer Impact Report is owed** by the lane that adds the `onDrop` branch, because a new creation surface reaches the
  D-layer through `createInstance`. Lane B's write is a `_state` bag write, not near the sync layer. Its report can be
  `not-required`, declared.

### 3.7 The fixture (input to COSA 7)

- Measured: `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel` and `~/jjodel-demo-exports/uml/uml-class-object.jjodel`
  both give «metamodel UML _state keys: (none)», «DClass records: 38 ontoBindings in store text: 0».
- The positive control is the 38 classes and the metamodel name, read through the same decompression.
- A raw `grep -c ontoBindings` on the file gives 0 whatever the content (`state` is lz-compressed UTF-16). It proves nothing alone.

## 4. Dependencies and risks

1. **Cost of the reactive list.** `modelObjectIds` is a BFS over every object and its slots, run per dispatch if the
   selector calls `creationOptions` directly. The S3a producer already pays a similar scan, measured at 3.9 ms for
   200 instances (R-OI-13). The rail lane measures its own cost on `uml-s3b`, and memoizes on a signature if needed.
2. **Links from the rail have no ends.** A drop gives one point and no two instances. `instantiate(assocId, linkRecord)`
   would make an `InstanceSpecification` classified by the Association with no end values. R-OI-5 wants the link menu to
   offer «only the associations whose ends accept the types of the two instances it connects», and S4 is not built.
3. **Defective `link` record.** A Detect that mirrors the probe produces a `link` record with a `slotRoles` defect (§3.5).
4. **Undecodable bag.** If the bag does not decode, the editor has nothing to edit. Overwriting it with Detect's
   proposal loses the stored records, DCN records included (`dcnToProblems.ts:128`).
5. **Other records.** The editor must keep the records it does not edit (a DCN metamodel's `featureSources` records)
   and the unknown keys. Encoding the decoded value with only the edited records replaced does that (codec `:154`, `:181`).
6. **Undo of a first declaration** is not measured (§3.5).
7. **Rule 19.** Lane A as planned touches 5 or 6 files (the probe is the sixth). It pauses for confirmation if the probe
   joins the scope.
8. **Shared stash and concurrent lanes** (P13). Lanes A and B both touch `EditorV2.tsx` or `PalettePanel.tsx` only if B wires
   «Declare binding…». The plan keeps that wiring in lane A, so the two lanes do not edit the same file.

## 5. Lane plan

Proposed order: **B, then A, then C.** B gives A's «Declare binding…» something to open, and C needs both.

### Lane B — the binding editor (declaration)

- **Files** (5):
  - new `frontend/src/model/ontological/bindingDetect.ts`: pure. `detectOntoBindings(sketch, existing?)` returns the
    `object` and `link` proposals from the UML name table of §3.5. It matches on (owner class, feature name) and also
    searches inherited features. Each row is marked `found` or `missing`.
  - new `frontend/src/model/ontological/__tests__/bindingDetect.test.ts`
  - new `frontend/src/components/editor-v2/onto/OntoBindingModal.tsx`, on the `SimRolesModal` shell:
    - It shows the draft as a role table per record. Each row is a role and a select over the sketch's features of the
      sort `bindingCheck` expects.
    - Detect fills the draft. `checkBindings` defects are shown on their rows.
    - Confirm writes `lmm.state = { ontoBindings: encodeOntoBindings(...) }`, the other records and unknown keys kept.
      Remove writes an empty list.
  - its styles, in `EditorV2.scss` or a new `onto-binding-modal.scss` under the prefix `onto-binding` (0 hits, §3.1)
  - `frontend/src/components/editors/Info.tsx`: one row, «Ontological binding…», in «Semantic type class» (`:521-523`), Advanced only.
- **Tests:**
  - Detect over a sketch built from the fixture's names finds 15/15, and on a non-UML sketch proposes nothing.
  - An ambiguous name (`value`) is resolved by its owner.
  - The proposed `link` passes `checkBindings` (question 3).
  - Encoding keeps a foreign record and an unknown root key.
  - Remove gives `{"v":1,"bindings":[]}`.
  - A mutation bench on the owner match and the record-keeping.
- **Probe checks** (new `scripts/probe/onto-binding-editor.ts`, or a block in `onto-s2-instantiate.ts`):
  - Open the editor on `uml-s3b`, Detect, Confirm.
  - The bag decodes and equals the probe's table, and the undo history shows +1 entry.
  - One Cmd+Z restores the previous bag; measure whether the key goes or stays.
  - The pane menu then opens with the same options as the console setup.
- **Crops for Alfonso:**
  - the editor after Detect (both records, all rows found)
  - a row corrected by hand with its defect message
  - the «Semantic type class» section in Advanced, and its absence in Basic

### Lane A — the «Instances of» rail section

- **Files** (5, plus the probe):
  - `frontend/src/components/editor-v2/hooks/instantiate.ts`: a pure `ontoRailSections(get, modelId)` returns
    `[{ record, options }]` for the `object` record, and `link` per question 1. It also returns a string signature for
    the selector.
  - `frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts`
  - `frontend/src/components/editor-v2/panels/PalettePanel.tsx`:
    - optional `ontoSections`, `onOntoActivate` and `onDeclareBinding`
    - the sibling block between `:192` and `:194`
    - a drag that sets only the new key (no `setDraggedMetaclassId`)
  - `frontend/src/components/editor-v2/EditorV2.tsx`:
    - a `useSelector` on the signature
    - one `onDrop` branch ahead of `:2737`, which re-reads the record by name and calls `runInstantiate`
    - an `onOntoActivate` that passes `clientCentre(...)`
    - the props at `:5241`
  - `frontend/src/components/editor-v2/EditorV2.scss`: `.palette-onto*` (0 hits), existing tokens only (rule 28)
- **The new drag key** is a module constant, for example `ONTO_DRAG_MIME` in `instantiate.ts`. It is not an event, so
  `events/registry.ts` does not apply.
- **Tests:**
  - `ontoRailSections` lists the same ids as `creationOptions`.
  - The signature changes on a new Class, a rename, and `isAbstract` true.
  - No binding gives an empty section.
  - Bench: drop the abstract filter, drop the re-read of the record.
- **Probe checks** in `onto-s2-instantiate.ts`:
  - S2-R0: with no bag, the section shows «Declare binding…».
  - S2-R1: a drag from the rail drops one instance at the drop point under the tab's layout: one undo entry, one Cmd+Z.
  - S2-R2: a click places it at the visible centre.
  - S2-R3: a Class added to the model appears in the rail without reopening the tab.
  - S2-R4: the linguistic «Instances» drag still creates its object (regression).
  - Plus the S3a and S3b regressions.
- **Layer Impact Report:** produced. The new creation surface reaches the D-layer through `createInstance`.
- **Crops for Alfonso:**
  - the rail on `uml-s3b` with the binding (both blocks, the gap between them)
  - the empty state with «Declare binding…»
  - the canvas after a drop, the node at the cursor
- **Decision row owed:** R-OI-18, the rail as a creation surface beside R-OI-10's pane menu.

### Lane C — the fixture with the binding

- **Files:** none in the repo. One new export, `~/jjodel-demo-exports/uml-s3c/uml-class-object.jjodel`, made from `uml-s3b` by
  declaring the binding through lane B's editor and exporting. Its `_state` is checked with the decompression of §3.7.
- **Probes:** the three onto probes re-run on it, with the console setup skipped when the bag is already there
  (`onto-s2-instantiate.ts:222`, `bag0` already branches on it).
- **Crop:** the rail and the pane menu on the fresh import.

## 6. Open questions

1. Should the `link` group show in the rail before S4? Recommended: list the associations, disabled, with the tooltip
   «a link is drawn between two instances (S4)»; a drop of an unconnected link breaks R-OI-5.
2. Should «Instances of» show in Basic mode when the metamodel has no binding? Recommended: show it in Basic only when a
   binding is declared, and the empty state with «Declare binding…» in Advanced only (§8.8).
3. Should Detect's `link` record carry the four slot roles or none? Recommended: the four, `valueKinds` shared with
   `object`, so it passes `checkBindings` and a link gets its end slots.
4. What should the section be called, next to the existing «Instances»? Recommended: «Instances of», with the linguistic
   block renamed «Elements» only if Alfonso wants it; the rename is out of this slice (rule 2).
5. Where should the editor open from? Recommended: one modal opened from `Info.tsx`'s «Semantic type class» row and from
   the rail's «Declare binding…», not an inline table in the properties rail.
6. What should Detect do on an undecodable bag? Recommended: show the decode errors and offer «Replace with detected»
   behind a confirmation, never a silent overwrite.
7. What is the lane order? Recommended: B, A, C.
8. Should the new fixture replace `uml-s3b` or sit beside it? Recommended: a new `uml-s3c` folder, since the S3b probe and
   its log entries name `uml-s3b`.

## 7. Files read

All under `/Users/alfonso/jjodel-w-oi-rail/`. Windows or greps unless noted.

- `CLAUDE.md`
- `frontend/src/model/CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md` (loaded)
- `docs/decisions.md:6570-6667` (R-OI-1..17), `:7755-7805` (R-MT-1..15)
- `docs/log-inbox/instance-of.md:195-249`
- `frontend/src/model/ontological/bindingCodec.ts` (whole), `bindingCheck.ts` (whole), `bindingReader.ts` (whole),
  `__tests__/bindingCheck.test.ts:20-75`
- `frontend/src/components/editor-v2/hooks/instantiate.ts`: `1-172`, `272-311`, `374-431`, `496-575`, `620-835`
- `frontend/src/components/editor-v2/EditorV2.tsx`: `596-607`, `2733-2782`, `3222-3263`, `3946-3967`, `5238-5252`, plus greps
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx`: `86-101`, `141-147`, `188-196`, plus greps
- `frontend/src/components/editor-v2/problems/dcnToProblems.ts:124-157`, `problems/InstantiationProblemSync.tsx:40-50`,
  `problems/instantiationToProblems.ts` (grep)
- `frontend/src/components/editor-v2/sim/metamodelSketch.ts:1-40`, `sim/SimRolesModal.tsx:37-42` and `:661-672`
- `frontend/src/model/simulation/profileBinder.ts:30-59`
- `frontend/src/components/editors/Info.tsx`: `325-336`, `515-527`, `38`
- `frontend/src/joiner/classes.ts:2357-2362`, `:2396-2404`
- `frontend/src/components/editor-v2/utils/dragState.ts` (grep)
- `frontend/scripts/probe/onto-s2-instantiate.ts:230-259`, `:348-377`
- `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel` and `~/jjodel-demo-exports/uml/uml-class-object.jjodel`
  (decompressed and read, not modified)

The two `explorer` subagents read the following. Their claims are cited above as «explorer»; the lines quoted here as
read were re-read by this session.

- `frontend/src/components/editor-v2/`: `EditorV2.scss`, `hooks/useEditorMode.ts`, `hooks/metamodelSignature.ts`,
  `sync/canvasToJjom.ts`, `sim/simRolesDraft.ts`
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx`
- `frontend/src/components/editors/PropertiesWithTreeView.tsx`
