# Discovery — S3b: ghost rows and orphan rows (Phase 1)

- Prompt-ID: P-2026-10-21-1910 (chat C-2026-10-21-1405, front `instance-of`, lane full)
- Prompt file: none (the chat has no shareable URL; Alfonso's words are kept with `--request`)
- Session id: `2086a817-98b5-4367-a305-05959f0b458d` (`~/.jjodel-lanes/P-2026-10-21-1910/session.txt`)
- Tree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`, HEAD `329bda77e` (clean at start)
- Executor model: Opus 5.5 (`claude-opus-5-5`), effort xhigh
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

Tags: **[R]** read in a file at HEAD `329bda77e`; **[M]** measured in this phase on the same HEAD (a throwaway vitest
bench, deleted, never committed).

## Objective

Find the narrowest way to draw, on an instance's node in the object diagram, one ghost row per feature of its classifier
with no slot (R-OI-3), to make a ghost row real on its first value in one S2u undo group, and to draw and mark an orphan
slot's row; with the Layer Impact Report and the oracle of Phase 2.

## Hypotheses under test, with verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The object diagram's instance rows are slot-mode rows (the object's own DValues). | **Falsified** [R] | They are `children` rows: the instance's Slot objects, each drawn by a Slot row view (Q1). |
| H2 | Ghost rows need a new source kind in `irTypes.ts` and its compile in `irCompile.ts`. | **Falsified** [R] | The rows can come from the binding and join the existing `children` compartment; a new source would also need every view, the fixture's included, to be re-authored (Q2). |
| H3 | The S2 slot loop can make one slot for one feature with a typed value. | **Holds** [R] | `createSlots` takes any `PlannedSlot[]` (`instantiate.ts:666-696`); only `plannedValue` reads the default instead of a given text (Q3). |
| H4 | Ghost rows need a CLAUDE.md 3.2 file, `reducer.ts`, or a change to the S1 reader's exported interface. | **Falsified** [R] | The read is `slotDiff` as exported; the write is `createInstance` inside the S2u group; the slot-mode edit path that does go through `canvasToJjom.ts` is not used (Q3, Q6). |
| H5 | A ghost row is visible on the instance's node as S2 or the fixture lays it out. | **Falsified** [R], not measured in the DOM | The box is a manual size for exactly the slot rows and the node clips: a ghost row past the last slot row is cut off (Q2, «The box»). |
| H6 | An orphan row can show its lost feature's name. | **Partly** [R] | Yes when the feature still exists but is out of the closure (the row template prints it already); no when the Property was deleted (Q4). |
| H7 | The ghost read costs little per instance at about 200 instances. | **Holds** [M], with one memo | 31.1 µs per instance without it, 9.5 µs with the bindings decode memoized (Q2, cost table). |
| H8 | The late seeding of `definingFeature` makes the materializing row flicker. | **Holds** [R], not measured in the DOM | The slot is listed before its seed lands; without a guard the node shows the ghost row and an empty orphan row for about a second (Q3). |

## Files read (full paths, windows)

- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` 150-189
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` 560-604 (and a grep of `source`)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` 240-400, 748-881 (and greps)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx` 1-37 (whole)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` 205-322
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` 70-95 (and a grep of `ir-row`, `overflow`, `height`)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` greps over 120-200
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/hooks/instantiate.ts` 172-262, 186-350, 349-377, 420-469, 500-560, 560-732 (and a grep of the exports)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts` 1-105
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/model/ontological/bindingReader.ts` 28-67, 150-171
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/problems/instantiationToProblems.ts` 84-128
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/nodes/nodeSizing.ts` 80-96 (and its imports)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/utils/jjomTransformers.ts` 66-83
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` greps only (`IRNodeContent`, `useIRView`)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/components/editor-v2/sync/canvasToJjom.ts` grep only (the two exports)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/scripts/probe/uml-class-object-fixture.ts` 438-469 (and greps)
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/scripts/probe/onto-s3a-slot-problems.ts` greps only
- `/Users/alfonso/jjodel-w-oi-s3b/frontend/src/styles/tokens/_colors-light.scss` greps only
- `/Users/alfonso/jjodel-w-oi-s3b/docs/discovery/discovery_2026-10-20_ontological_instantiation.md` 303-342, 505-578
- `/Users/alfonso/jjodel-w-oi-s3b/docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md` 94-345
- `/Users/alfonso/jjodel-w-oi-s3b/docs/log-inbox/instance-of.md` 99-149

Not read: `EditorV2.tsx`, `LModelElement.tsx` (not needed: no menu entry and no proxy write in this design),
`createAdapter.ts` (its contract is the one S2 and S3a measured).

## Q1 — Where rows come from today [R]

**Two row semantics, kept apart.**
- Slot-mode rows (`attributes`, `references`): the object's own DValues, read by a signature over `dObject.features`
  (`IRNodeContent.tsx:296-321`): `parts.push(\`${kind};${fid};${feat.name ?? ''};${typeObj?.name ?? ''};${feat.type ?? ''};${display}\`);`
  (`:318`). A row is keyed by the DValue id: «DValue (slot) id — NOT the metafeature id» (`:243`).
- `children` rows: «child object ids rendered as inline rows» (`:346`), from `rowRenderedChildren`, which walks the
  host's composition references in D-layer order and keeps a child that passes a compartment's `childFilter`
  (`irContainment.ts:279-302`, `containmentChildren` at `:211-227`). Each is `<IRRow key={childId} childObjectId={childId} />`
  (`IRNodeContent.tsx:772`). The compartment is not drawn when no child passes:
  `if (fc !== firstChildrenCompartment || rowChildIds.length === 0) return null;` (`:760`).

**The object diagram uses the second.** The fixture's instance view:
`fieldCompartments: [{ id: 'slots', title: 'Slots', separator: true, rowFormat: { segments: [{ kind: 'name' }] },`
`source: { from: 'children', filter: kind('Slot') } }]` (`uml-class-object-fixture.ts:452-453`). A slot becomes
`name = value` through three Slot row views, dispatched by predicate and priority, all starting with
`const slotHead = [P('$definingFeature.value.$name.value'), L(' = ')];` (`:445`, `:462-466`): an instance value prints
`$values.values[0].$instance.value.$name.value`, a `LiteralNull` prints `null`, any other literal
`$values.values[0].$value.value`. That first segment is why an orphan reads ` = 978-0441013593`: its
`definingFeature` is empty, so the name segment is empty.

**Where an inline edit writes.**
- A slot-mode row: `syncUpdateFeatureValue(vertexId, editingRow.name, editValue);` (`IRNodeContent.tsx:375`), opened by a
  double-click on the value span (`:870-873`), an `<input className="ir-row__input">` committing on blur and Enter
  (`:845-854`). `syncUpdateFeatureValue` is exported by `sync/canvasToJjom.ts:1600`, a CLAUDE.md 3.2 file.
- A path label: the same function (`:389`); a name label: `syncNodeLabel` (`:396`, `canvasToJjom.ts:733`).
- A `children` row: nowhere. «Read-only (spec R2 P2: no selection, no inline editing — nothing but rendering).»
  (`IRRow.tsx:4`). **Today no slot value can be typed on the object diagram's canvas**, real or not.

**Which viewpoints draw the instance through the IR.** In the fixture, only `UML object diagram` (`VP_OBJECT`,
`uml-class-object-fixture.ts:54`, views `OBJECT_VIEWS` `:446-469`). `UML class diagram` hides `InstanceSpecification`
and `Slot` (`:440-441`, `.map(hidden)`). With no viewpoint in force the native `ObjectNode` branch draws the object; the
IR branch is entered through `useIRView(id, data.instanceOfClassId)` (`ObjectNode.tsx:110`) and mounts `IRNodeContent`
(`:962`).

**The IR reads no binding today.** `command grep -rlE "ontological/|bindingReader|ontoBindings|hooks/instantiate"` over
`components/editor-v2/viewpoint`, `components/editor-v2/nodes` and, as positive control, `hooks/instantiate.ts`: the only
hit is `instantiate.ts` itself, exit 0.

## Q2 — Ghost rows

**Where.** In `IRNodeContent.tsx`, beside `rowChildSig` (`:351-355`): a second string selector that, when the view has a
`children` compartment, asks a pure read of `instantiate.ts` for the host's ghost and orphan rows. No new source kind:
`source` stays the closed union of `irTypes.ts:168`, `irCompile.ts:572-600` is untouched, and every view already drawing
slots as `children` rows gets ghost rows with no re-authoring (H2).

- The read: `modelOf` → `readOntoBindings` → `recordFor` (must be the `object` record, as the S3a detector requires,
  `instantiationToProblems.ts:113-116`) → `slotDiff(view, record, id)` (`bindingReader.ts:155-170`). `missing` are the
  ghost rows, in closure order, each named by its Property; `orphans` are flags on existing rows (Q4).
- The compartment that receives them: the first `children` compartment that renders at least one slot of the host's
  slot container; when it renders none (an instance with no slot left), the first `children` compartment. It is then
  drawn even with `rowChildIds.length === 0` (`:760`).
- Order: the real rows in slot-list order, then the ghost rows in closure order. A ghost has no object, so no Slot row
  view can run on it: its format is fixed, `<name> = ` and the value cell.

**Cost [M].** Throwaway bench on the `uml()` builder of `instantiate.test.ts:13-101`, vitest node env, dune with
`pages : Integer` added to Book and one `definingFeature` cleared, the rest Books with four slots and values; 30 runs
after 5 warm-ups, one pass = the read on every instance:

| instances | idlookup keys | one pass | per instance | one pass, decode memoized | per instance | load (1 min), plain run / memoized run |
|---|---|---|---|---|---|---|
| 4 (library) | 198 | 0.171 ms | 42.8 µs | 0.044 ms | 11.0 µs | 12.13 / 11.13 |
| 200 | 6470 | 6.220 ms | 31.1 µs | 1.907 ms | 9.5 µs | 12.13 / 11.13 |
| 1000 | 32070 | 20.881 ms | 20.9 µs | 9.555 ms | 9.6 µs | 12.13 / 11.13 |

About 70% of the cost is `decodeOntoBindings` on every call (`instantiate.ts:99-104`). A single-entry memo keyed by the
bag string, local to the new read, brings 200 drawn instances to ~1.9 ms per dispatch, inside the S3a budget of 5 ms
per dispatch for a signature (S3a report, Q2 «Budget»). Views with no `children` compartment and models with no bindings
take the fast path (an empty string before any read).

The bench also gave one case worth a unit test: a slot whose `definingFeature` is cleared while its Property still
exists gives both a ghost row (`isbn`) and an orphan row for the same feature
(`dune={"ghosts":[{"feature":"p_Book_isbn",...},{"feature":"p_Book_pages",...}],"orphans":["dune_s_p_Book_isbn"]}`).

**Visual distinction (rule 28: tokens only).** `.ir-row--ghost` in `irStyle.ts`, the module that already holds every
`.ir-row` rule (`irStyle.ts:55-56`, `:173-204`): text `var(--color-node-text-muted)` (`_colors-light.scss:222`), italic,
the value cell empty with the existing `.ir-row__value--editable` hover (`irStyle.ts:183-184`). No variable is defined
outside `styles/tokens/`.

**The box [R], not measured in the DOM.** This is the finding that decides the acceptance.
- S2 lays an instance out at `h = BOX_METRICS.chrome + BOX_METRICS.label * labels + BOX_METRICS.row * rows`
  (`instantiate.ts:373`) with `isResized: true` (`:526`): a manual box. The fixture does the same for the library:
  `add(o, 'InstanceSpecification', o, [x, y], box(300, 2, slots.length))` (`uml-class-object-fixture.ts:275`), with
  `box = (w, labels, rows) => [w, 26 + 20 * labels + 18 * rows]` (`:222`). Dune with four slots: 300 × 138.
- A manual size wins: `if (isResized) return 'manual';` (`nodeSizing.ts:92`); the RF node takes it from
  `manualSizeOf` (`jjomTransformers.ts:73-83`), and content-driven sizing is off: «A manual resize wins and switches the
  derivation off for that vertex» (`useContentSize.ts:129`).
- The node clips: `.ir-node-content { ... width: 100%; height: 100%; ... }` (`irStyle.ts:24`) and `... overflow: hidden; }`
  (`:73`).
- So after `pages` is added, dune's ghost row is a fifth row in a box for four: cut off, and a cut-off row cannot be
  double-clicked. A box that hugs its content (a view with no `defaultSize`: `instanceBoxSize` returns `null`,
  `instantiate.ts:365`, `:370`) shows it with no write.
- Growing the box is a write. S3a grows it only inside a gesture's group, grow-only (D6, `instantiate.ts:537-543`). A
  grow written from a render would land outside any group (one undo entry per instance, per layout, the shallow-merge
  ticket `instance-of.md:120`), and a visible box taller than the RF box reopens the defect `irStyle.ts:74-81` closed:
  «React Flow places the edge handles on the floored .mm-node box → edges miss the visible border». Question 2.

## Q3 — Materialization

**The gesture.** The slot-mode one: double-click on the ghost row's value cell, an `ir-row__input`, Enter or blur
commits, Escape cancels (`IRNodeContent.tsx:845-854`, `:870-873`). Empty text writes nothing, as an edit that changed
nothing marks nothing (`:364-376`). The commit calls a new `materializeSlot(instanceId, featureId, text)` of
`instantiate.ts`, never `syncUpdateFeatureValue`: that writes a DValue by name on the vertex's object
(`IRNodeContent.tsx:375`), not a Slot object, and lives in a 3.2 file.

**Reuse of the S2 loop [R].** `createSlots(createInstance, get, plan, planned, record, result, seeded)`
(`instantiate.ts:666-696`) makes one slot per entry, waits for it in the owner's list (`:682`), then its value in the
slot's holder (`:685-693`). `syncSlots` (`:620-647`) wraps it in `inFlight++`, `beginUndoGroup`, `waitSeeded`, the
grow-only `layoutInstanceNode(..., true)` and `endUndoGroup`. `materializeSlot` is that same wrapper over one
`PlannedSlot`:
- the plan, pure: `materializePlan(get, record, instanceId, featureId, text)` returns the `SlotSyncPlan` shape
  (`:324-346`) with one slot, or an error when `featureId` is no longer in `slotDiff(...).missing` (someone made it
  meanwhile: nothing is written, the row redraws real);
- its value: `plannedValue` (`:244-262`) is split so its body takes the raw text instead of
  `view.attributeValue(feature, binding.defaultValue)` (`:246`); `typedDefault` (`:174-186`) and `valueKindFor`
  (`:230-241`) are unchanged. `300` on `pages : Integer` gives `{ metaclass: 'LiteralInteger', seed: { value: 300 } }`;
  `fiction` on `genre : Genre` an `InstanceValue` of the literal named so (`:255-258`).
- Text that does not parse for the type (`typedDefault` gives `undefined`), or names no literal: Question 3.

**One undo entry, exact restore [R].** The S2u group is opened by `beginUndoGroup` and every write of the same sender
joins it, the first pushing one entry and «the next ones rewrite that entry exactly» (S3a report Q3, `reducer.ts:1283-1289`
as cited there). A group entry has exact `idlookup` contents (S2u). `materializeSlot` adds no reducer change.

**The late seed [R].** `addObject` writes the seed after the create (`instantiate.ts:420-421`: «`addObject` writes the
seed 600 ms after the create»; S3a measured ~990 ms for `definingFeature`). `createSlots` waits only for the listing
before it goes on (`:682`); `waitSeeded` runs at the end (`:637`). In between the read sees a listed slot with no
`definingFeature`: an orphan (`bindingReader.ts:165-167`), while `pages` is still missing. Unguarded, the node goes
ghost `pages =` → ghost plus an empty orphan row ` = ` → ghost plus ` = 300` → one real `pages = 300`. The same window
opens in S2 (a new instance would flash a ghost row per feature not yet made) and in «Sync slots».

**The guard.** A per-instance in-flight record in `instantiate.ts`, set by the three writers around their group, with
the slot ids `createSlots` makes (an optional callback on that private function) and, for `materializeSlot`, the
feature and the typed text:
- while an instance is in flight, its node keeps the ghost and orphan rows it had when the run started (none for a new
  instance), hides the run's slots until their seed has landed (`seedLanded`, `:423-430`), and draws the materializing
  ghost row with the typed text;
- the end of a run is not a store change, so the node subscribes to the record (`useSyncExternalStore`), as the S3a
  producer asks `instantiationInFlight()` (`:568-573`) for the same reason.

## Q4 — Orphan rows

**Drawn** as today, by the Slot row view through `IRRow`; **marked** by an optional prop `orphan?: string` on
`IRRowProps` (an exported interface: rule 11 allows an added optional property). Present, `IRRow` adds
`ir-row--orphan` to `.ir-row` (`IRRow.tsx:28`), a leading text marker span (no emoji, rule 26) and the string as its
tooltip. Colour `var(--color-error)` (`_colors-light.scss:143`), the S3a severity of an orphan (error, S3a D2).

**The lost name.**
- Feature out of the closure (a slot of `issue` on dune): the Property exists, the template's name segment prints
  `issue` already; the tooltip reads «issue is not a feature of Book», the S3a problem's own text (S3a plan, problem
  records).
- Feature deleted: not recoverable from the store. The delete leaves `definingFeature` at `[]` (S3a R1, measured there);
  the Property is gone from `idlookup`; the UML Slot has no field to hold a name: `['Slot', 'definingFeature', 'Property', ...]`,
  `['Slot', 'values', 'ValueSpecification', ...]` (`uml-class-object-fixture.ts:100-101`). A session memo of the last
  name seen would show it until a reload and not after: two answers for one model. Writing a name onto every slot at
  creation changes S2's output and needs an M2 field.
- **Recommended: a generic marker** with the tooltip «Its feature is gone», the S3a description. A persistent name is a
  later option through an optional record role (R-OI-7 style) on an M2 that has a field for it.

## Q5 — Relation with S3a

**Recommended: the missing-slot problem stays when its ghost row is drawn.**
- R-OI-13 (as the prompt states it, trunk only, not on this branch: `npm run decisions` gave «not found: R-OI-13,
  R-OI-14») keeps one problem kind `instantiation` with «Sync slots» per instance; the problem is model-level, the ghost
  row is view-level: the tree, the form and the native branch draw no ghost row, and a view without a `children`
  compartment over the slots draws none either.
- R-OI-3 asks for both and does not make one replace the other: «a feature without a slot shows as a ghost row»; «an
  explicit «sync slots» action aligns them».
- The box (Q2): where the ghost row is cut off, the badge is the only signal on the node.
- The problem's «Sync slots» makes every missing slot at once with defaults; the ghost row makes one with a typed value.
  Both resolve the same problem (`markResolved` on the next debounced run).

## Q6 — Layer Impact Report (`viewpoint/ir/`, `instantiate.ts`)

```
LAYER IMPACT REPORT (Phase 1; owed again before any S3b diff)

Layers touched:
  [x] D-layer (Redux raw data)      — materializeSlot only: one Slot and one value object through createInstance /
                                       addObject (the S2 path), and the grow-only SetFieldAction layout write
  [ ] L-layer (computed proxies)    — read through the existing proxies only (addObject); no proxy changed
  [ ] JjOM (model entities)
  [x] Canvas v2-flow                — IR node rendering: ghost rows, orphan marks, the ghost-row input, hidden in-flight
                                       slot rows; no RF node, edge or size computed differently
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Undo history                  — used, not changed: one S2u group per materialization
  [ ] Problems registry             — read by nobody new; S3a's producer unchanged

What changes:
  - instantiate.ts: instanceRows (pure read: ghosts, orphans with reason, local decode memo); materializePlan (pure);
    materializeSlot (write); plannedValue split to take a raw text; the in-flight record with subscribe; an optional
    created-slot callback on the private createSlots, passed by instantiate, syncSlots and materializeSlot.
  - IRNodeContent.tsx: one selector for the ghost signature; ghost rows after the IRRows of the receiving compartment
    (drawn also with no child); the ghost-row editor; in-flight slots filtered from rowChildIds; orphan strings to IRRow.
  - IRRow.tsx: optional orphan prop → class, marker, tooltip.
  - irStyle.ts: .ir-row--ghost, .ir-row--orphan, the marker, the materializing state; tokens only.
What does NOT change:
  - irTypes.ts, irCompile.ts, irContainment.ts (rowRenderedChildren and computeRowHiddenChildren stay the SSOT of the
    rendered children; the filter of in-flight slots is applied after it, in the renderer only);
  - the slot-mode rows and their write path (syncUpdateFeatureValue), the label edits;
  - bindingReader.ts / bindingCodec.ts (slotDiff used as exported), reducer.ts, createAdapter.ts, problems/;
  - S2's and «Sync slots»'s output: same creates, same order, same box rule, one entry each.
Cross-layer interaction:
  - the read is pure over idlookup and dispatches nothing: no undo entry, no store loop;
  - materializeSlot writes the D-layer in one group; one Cmd+Z removes slot and value, idlookup exact (S2u);
  - the S3a producer defers while the run is in flight (instantiationInFlight, S3a D5), then resolves «No slot for pages».
Side-effect safety vs other layers:
  - no creator inside an outer TRANSACTION (rule 12): createInstance opens its own; the layout write is SetFieldAction
    only (instantiate.ts:548-558);
  - computeRowHiddenChildren still hides the in-flight slots as flow nodes (they are rows of the host), so nothing new
    appears on the canvas during the run.
CLAUDE.md 3.2 trigger files: none touched (useJjomSync.ts, syncState.ts, canvasToJjom.ts, portDistribution.ts,
  useM1ReferenceEdges.ts, VersionFixer.tsx); no DVertex.new / DVoidEdge.new2 / new3 literal added. jjomTransformers.ts
  and nodeSizing.ts are read, not touched, unless Question 2 chooses (d).
Callers of the touched API: IRNodeContent (ObjectNode.tsx:962; the authoring preview mounts it with no provider,
  IRNodeContent.tsx:284-285; irCollapsedRender and irLabelAnchorRender tests import it); IRRow (IRNodeContent only);
  createSlots (instantiate, syncSlots, materializeSlot, all in instantiate.ts).
Risk: low for the read and the marks (additive, fast path for every view without bindings); medium for the editor and
  the in-flight guard (a new subscription on every IR node; a stale freeze if a run never ends — the record is cleared
  in finally, as inFlight is).

Smoke-test scenarios potentially affected:
  - undo-inline-edit.ts unchanged (slot-mode rows only)
  - onto-s2-instantiate.ts unchanged: a new instance shows no ghost row at any time (the freeze starts empty)
  - onto-s3a-slot-problems.ts unchanged: S3-2 now also draws a ghost row; S3-3 counts dune's rows after «Sync slots»,
    when no ghost is left
  - the library's object diagram with no change: no ghost row, no mark (unit test 1, probe S3b-0)
Uncertain about propagation? → Question 2 (the box).
```

`instantiate.ts` statically imports only the codec, the reader, `nodes/nodeSizing` and a type
(`instantiate.ts:47-50`); `nodeSizing.ts` imports a type and `shapeRegistry` (`nodeSizing.ts:6-7`). Importing it from
`IRNodeContent.tsx` makes no cycle and keeps the joiner out of the IR tests (dynamic `import()`, `:576-589`).

## Phase 2 plan (rule 19: seven items, confirmation asked)

Lane A, code and gates:

| # | File | Change |
|---|---|---|
| 1 | `frontend/src/components/editor-v2/hooks/instantiate.ts` | `instanceRows`, `materializePlan`, `materializeSlot`, `plannedValue` split, in-flight record + subscribe, `createSlots` callback |
| 2 | `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | ghost selector and rows, ghost editor, in-flight filter, orphan strings |
| 3 | `frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx` | optional `orphan` prop |
| 4 | `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` | ghost, orphan, marker, materializing rules (tokens) |
| 5 | `frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts` | unit tests below |

Gates: typecheck 0, `instantiate.test.ts` and the IR render tests green, build 0; Layer Impact Report re-stated before
the diff; mutation bench M1-M3.

Lane B, probe and closure:

| # | File | Change |
|---|---|---|
| 6 | `frontend/scripts/probe/onto-s3b-ghost-rows.ts` (new) | acceptance probe; M4 |
| 7 | `docs/discovery/assets/onto-s3b/`, `docs/log-inbox/instance-of.md` | crops, measures, closing entry |

`irTypes.ts` and `irCompile.ts`, listed in plan §8, drop out (H2). If Question 2 chooses (d), the sizing lane comes
first and carries its own report.

## Oracle for Phase 2

**Unit tests** (`instantiate.test.ts`, the `uml()` builder):
1. the library with dune's four slots → `instanceRows` gives no ghost and no orphan;
2. `pages` added to Book → dune: ghost `[pages]` named `pages`, after none; a Magazine instance: none;
3. Property isbn deleted (dune's slot `definingFeature: []`) → one orphan, reason «Its feature is gone»; no ghost isbn;
4. a slot of Magazine's `issue` on dune → one orphan, reason «issue is not a feature of Book»;
5. the cleared pointer with the Property kept → ghost isbn and orphan slot both (the bench case);
6. a model with no bindings, and a link instance → `null`, no read;
7. `materializePlan(dune, pages, '300')` → one slot seeded `{ definingFeature: pages }`, value `LiteralInteger 300`; `''`
   → no plan; `pages` already covered → error; `genre`, `'fiction'` → `InstanceValue` of fiction;
8. an in-flight slot id covers its feature: no ghost, not an orphan.

**Probe** `frontend/scripts/probe/onto-s3b-ghost-rows.ts` (new; the three probes named in the prompt stay unchanged),
the library imported and the bindings written as `onto-s3a-slot-problems.ts` does:
- S3b-0 baseline: no `.ir-row--ghost`, no `.ir-row--orphan` in any node;
- S3b-1 `pages : Integer = 320` added to Book by `createInstance` (as S3-2, `onto-s3a-slot-problems.ts:245`): within 1 s
  dune's node holds a `.ir-row--ghost` whose text is `pages =`; no Slot whose `definingFeature` is pages in `idlookup`;
  the ghost row's DOM box against the node's box recorded (the clip of Question 2);
- S3b-2 double-click the ghost value, type `300`, Enter: within 3 s one new Slot (`definingFeature` pages) and one
  `LiteralInteger` with value 300 (not 320); no `.ir-row--ghost` left; a row reading `pages = 300`; dune's DOM sampled
  every 100 ms during the run shows no `.ir-row--orphan` and never two rows naming pages; undo stack +1;
- S3b-3 one Cmd+Z: both ids gone, `idlookup` key set equal to the one before S3b-2, the ghost row back;
- S3b-4 Property isbn deleted (`onto-s3a-slot-problems.ts:231`): dune's isbn row carries `.ir-row--orphan`, the marker,
  the tooltip «Its feature is gone», and still the value `978-0441013593`; its slot still in `idlookup`;
- S3b-5 page errors `[]`; then `undo-inline-edit.ts`, `onto-s2-instantiate.ts`, `onto-s3a-slot-problems.ts` unchanged,
  all green.

**Mutation bench** (each must turn a check red):
- M1: `instanceRows` returns the whole closure as ghosts (drop the covered set) → unit test 1 red;
- M2: `materializePlan` keeps the default instead of the typed text → unit test 7 red (320, not 300), probe S3b-2 red;
- M3: the in-flight filter dropped → unit test 8 red, probe S3b-2's sampling red;
- M4 (probe only): the orphan prop not passed to `IRRow` → S3b-4 red.

## Dependencies and risks

- **R1 — the box** (Q2): unresolved by S3b alone; Question 2.
- **R2 — real slot rows stay read-only** (`IRRow.tsx:4`): after S3b a ghost row is the only slot row a user can type
  into; `pages = 300` cannot be retyped on the canvas. Question 4.
- **R3 — the 10 s group cap** (`reducer.ts:1282` per the S3a report): one slot and one value, as «Sync slots» for one
  feature; the probe records the duration.
- **R4 — the shallow-merge ticket** (`instance-of.md:120`): a click-born write outside the group may cost a second
  Cmd+Z; the probe focuses and waits for the store idle, as S2's and S3a's do.
- **R5 — the in-flight freeze** must clear in `finally`; a run that throws must not leave a node frozen.

## Decisions taken (unattended)

- D1 — no new IR source: ghost rows come from the binding and join the first `children` compartment that renders a
  slot of the host (or the first one when none does); `irTypes.ts` and `irCompile.ts` untouched.
- D2 — a ghost row's format is fixed, `<name> = ` and the value cell: no Slot row view can run on an object that does not
  exist.
- D3 — the pure read lives in `instantiate.ts` with a local single-entry decode memo; `readOntoBindings` unchanged.
- D4 — the editing gesture is the slot-mode one (double-click, Enter or blur, Escape); empty text writes nothing.
- D5 — the in-flight guard of Q3 covers S2, «Sync slots» and materialization alike.
- D6 — materialization grows the box grow-only inside its group, as «Sync slots» does (S3a D6).
- D7 — orphan rows carry a generic marker; the name only through the template when the feature still exists.
- D8 — the missing-slot problem stays beside the ghost row (Q5).
- D9 — `structure.emptyBehavior: 'hide'` does not apply to ghost rows: it filters slot-mode rows only
  (`IRNodeContent.tsx:336-340`), never `children` rows, and ghost rows are `children` rows.

## Decisions awaiting Alfonso

1. Rule 19: confirm the seven-item file list, in two lanes. Recommended: yes.
2. The box (Q2): (a) S3b grows it only at its own gesture, so a ghost row past an S2-sized box stays cut off until a
   hand resize or «Sync slots», with the badge as the signal; (b) a visible box taller than the RF box: rejected,
   reopens `irStyle.ts:74-81`; (c) a grow written from the render: rejected, undo entries per instance; (d) first a
   sizing lane of its own: an IR box never cuts a `children` row, ghost rows included (`nodeSizing.ts:89-95`,
   `jjomTransformers.ts:73-83`, a change to «a manual resize wins», Layer Impact Report). Recommended: (d) before S3b's
   Phase 2, because with (a) the acceptance «typing 300 into it» cannot be done on dune.
3. Text that does not parse for the feature's type (`abc` on `pages : Integer`), or names no literal: write it as the
   record's `primitive:String` kind, so the write is not refused (R-VAL-4) and S3a's value-type problem reports it.
   Recommended: yes.
4. Real slot rows editable on the canvas (R2): a slice of its own after S3b, on the value object's field. Recommended:
   later, not S3b.
