# Discovery: level-aware viewpoints, the class diagram rail, S4 links

- **Prompt-ID**: P-2026-11-08-1635, continuation of P-2026-11-08-1605 (cut by its context ceiling, nothing written)
- **Prompt files**: `docs/prompts/claude_2026-11-08_1635_prompt_onto_levels_discovery_continue.md`,
  `docs/prompts/claude_2026-11-08_1605_prompt_onto_levels_discovery.md` (COSA 1 to 6)
- **Session**: 3bb11c6b-3917-43bc-9fff-28e291c06fb1; source handoff from session f45892c6-b373-4be8-ae33-ecfa47b1cc96
- **Tree**: `~/jjodel-w-oi-rail`, branch `oi-rail`, HEAD `2b69e0c4f`. `frontend/` is identical to `33455491b`, the sha the
  1605 reads and its probe ran on (`git diff --stat 33455491b HEAD -- frontend`: 0 lines).
- **Executor**: Opus 5.5
- **Status**: read-only. This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the
  real files.

Tags: **[M]** measured in a run, by the 1605 probe (port 3078, fixture `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`,
assets in `/tmp/p1605/`, not committed) unless the addendum says otherwise. **[R]** read from code, windows of the cited
lines only. Paths are under `frontend/src/components/editor-v2/` unless given in full. No file was read whole.

## 1. Objective

Alfonso's four findings on `oi-rail` (2026-11-08 12:25): class diagrams sit one ontological level above object diagrams;
the class diagram's rail must offer classes, attributes and associations derived from the metamodel and the binding;
«New instance of ▸» must not appear on a class diagram; a relation drawn between two instances shows in the properties
panel but not on the canvas. The decision under design (the chat, on Alfonso's «decidi tu», 16:03): each viewpoint
declares its level, `class` or `instance`; absent, today's behaviour.

## 2. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | The level fits the viewpoint's existing `_state` bag, with no new field | holds | §3, [M] merge and undo |
| H2 | The linguistic block is empty on UML because every concrete class is a composition target | holds | §4, [M] rail, [R] filter and M2 |
| H3 | The instance surfaces show on the class diagram | holds for pane and rail; node menu see addendum | §5 |
| H4 | An edge drag between two object nodes writes nothing | read only; the 1605 measure is invalid; see addendum | §6.2 |
| H5 | The object viewpoint draws a link only from an instance classified by an association with its ends filled | partly: an empty link draws nothing [M], a filled one see addendum | §6.1 |
| H6 | The gesture layer reads the tab's viewpoint | **falsified** for `useIRInteractionPlan` [R] | §3.3 |
| H7 | S4 can reuse the instantiate synthesis | partly: the instance and its slots yes [M], the two InstanceValues no | §6.3 |
| H8 | No `reducer.ts` change and no breaking exported interface | holds so far, by reading only | §7 |

## 3. Where the level lives (COSA 1)

### 3.1 How a viewpoint stores a property

- [R] `DViewPoint` is `frontend/src/view/viewPoint/viewpoint.ts:115`: `export class DViewPoint extends DViewElement {`.
  A viewpoint has no IR record: the IR is per view element, `viewpoint/ir/irResolveCore.ts:135-136`:
  `if (!d || d.viewpoint !== vp) continue;` / `const ir = (d as any).ir;`.
- [M] The export's two viewpoints, «UML class diagram» and «UML object diagram», have `_state {}` and no `ir`.
- [R] Two precedents. The bag, `EditorV2.tsx:4194`:
  `const vpState: Record<string, unknown> = (typeof vpId === 'string' && lookup[vpId]?._state) || {};`. A field through
  the proxy, `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx:65`:
  `(viewpoint as any).viewpointType = newType;`, and `:78` `metaclassColoring`.
- [M] `vp.state = {ontoLevel:'instance'}` then `vp.state = {other:1}` reads back `{"ontoLevel":"instance","other":1}`, a
  merge, with undo positions 4→5→6, one entry per write, on an instance whose class is `DViewPoint`.
- [R] Caveat, `frontend/src/components/editors/Info.tsx:330`: undo of a removed `_state` key does not restore it (ticket
  of P-2026-09-29-1106). The control must write a value and never delete the key, so it needs a third stored value for
  «both», read as absent.

**Recommendation**: `_state.ontoLevel`, values `class | instance | both`, absent reads as `both`. It needs no schema
change and no VersionFixer migration, and an old project behaves as today. Question 1.

### 3.2 How the tab's viewpoint is read

- [R] Prop `viewpointId` (`EditorV2.tsx:504`), `viewpointIdRef` (`:600-601`), `tabLayoutKey` (`:602-604`),
  `EditorContext` (`:5047`). The reading idiom, `:4193`:
  `const vpId: unknown = viewpointIdRef.current === undefined ? state?.viewpoint : viewpointIdRef.current;`.
- [R] `undefined` is no tab, `null` is abstract syntax (`hooks/instantiate.ts:830-831`: «`viewpoint` is the one in force
  in the canvas the call comes from (a tab's, P-2026-11-07-1620), `null` abstract syntax; absent, the root's»). `null`
  has no level, so it reads as `both`.
- [R] R-MT-14 holds R-LAY-19's freeze on new `state.viewpoint` readers «by a check script after lane L5». The script was
  not found: `command grep -rln 'R-LAY-19\|state\.viewpoint' frontend/scripts/gates frontend/scripts/hooks` empty, control
  `command grep -rln decisions frontend/scripts/gates` hit 3 files. So the freeze is held by review only today. The
  level's reader must take the viewpoint id as an argument; the one `state.viewpoint` fallback stays at the existing
  idiom. Rail selector: it needs a reactive value, so it reads the prop `viewpointId`, not the ref.

### 3.3 Trap: the interaction plan follows the root, not the tab

- [R] `viewpoint/ir/useIRContainment.ts:75-76`:
  `export function useIRInteractionPlan(): IRInteractionPlan | null {` /
  `const irSig = useSelector((state: any) => computeIRSignature(state));`. `irResolveCore.ts:127-128`:
  `export function computeIRSignature(state: any, viewpointId?: string): string {` / `const vp = viewpointId ?? state.viewpoint;`.
  The consumer is `EditorV2.tsx:1904`, whose plan reaches the connect branch at `:1986` (`irPlanRef.current`).
- [M] `ids.root` is the viewpoint named «UML class diagram» (`Pointer1794150751506_USER_859`).
- **Consequence**: on the object tab the connect rules are the class diagram's. The level must not ride this hook, and
  lane 3 has to pass the tab's viewpoint (`computeIRSignature` already takes it; whether `getIRIndex`, `:79`, resolves
  the same viewpoint was **not read**). The file is in §3.1 (`viewpoint/ir/`).

### 3.4 UI and fixture

- [R] Section at `ViewpointProperties.tsx:117` (`<h4 ...>Viewpoint</h4>`), type control `:62-69`. The file has no Advanced
  gate (grep `Section|advanced|Advanced`, the only hit is `:117`, so the search ran). The hook to use exists:
  `frontend/src/hooks/useInterfaceMode.ts:57`, used in `frontend/src/components/editors/Info.tsx:105`
  `const { isAdvanced: globalAdvanced } = useInterfaceMode();`.
- Fixture: `uml-s3b` carries no level; a probe writes `.state` on each viewpoint, or a `uml-s3c` export carries it.

## 4. The empty linguistic block (COSA 2)

- [M] Rail text, both tabs: «INSTANCES No rootable classes found INSTANCES OF OBJECTS Book Library Magazine Member LINKS
  Borrowing Holdings Membership …».
- [R] `panels/PalettePanel.tsx:179-180` renders it on `rootableClasses.length === 0`. Filter, `hooks/useEditorMode.ts:450-452`:
  `c => !c.isAbstract && !c.isSingleton && !compositionTargetIds.has(c.id)`.
- [M, decoded M2] `Package.packagedElements → PackageableElement` COMP covers Package, Class, DataType, PrimitiveType,
  Enumeration, Association, InstanceSpecification, EnumerationLiteral; `ownedAttributes`, `ownedOperations`,
  `generalizations`, `ownedLiterals`, `ownedEnds`, `ownedParameters`, `slots`, `Slot.values` cover the rest. Every
  concrete class is a composition target, so the filter is empty by construction, and correctly so for its purpose.
- [M] The model is one Package `LibraryModel` with 22 `packagedElements`; the father of a Class and of an
  InstanceSpecification is that DValue.

### 4.1 What the class-level rail lists, from the binding

Roles are in `frontend/src/model/ontological/bindingDetect.ts:57-77`.

| Group | Source | On UML | Gesture |
|-------|--------|--------|---------|
| Classifiers | concrete conformers of the target of `typeReference` (`InstanceSpecification.classifier → Classifier`) | Class, DataType, PrimitiveType, Enumeration, Association | drop or click |
| Properties | `featureContainer` (`Class.ownedAttributes`), inside the selected classifier | Property | selection (M2 palette shape, `PalettePanel.tsx:19-27`) |
| Generalizations | `generalization.via` + `general` | Generalization | edge drag, as drawn by the class view |
| Literals, operations | not binding roles; only the classifier's composition refs reach them | `Enumeration.ownedLiterals`, `Class.ownedOperations` | selection |

- [R] An Association is drawn as an edge from `$memberEnds.values[0].$type.value` and the connect rule keeps the first
  feature only (`viewpoint/ir/irInteraction.ts:47-51`, `:72-76`): `memberEnds → Property` refuses a Class (`:141-142`).
  So an Association is not creatable by a drag, and one dropped from the rail has no ends and would not draw, the
  situation R-OI-18 Q1 solved for links by listing them disabled. Question 3.

### 4.2 Where a created element goes

- [R] Container is not a binding role. Write: `createInstance(modelId, className, ownerId, childKey, seed)`
  (`hooks/createAdapter.ts:491`), **className is a name**. Root write: `hooks/instantiate.ts:1020`
  `const made = createInstance(plan.modelId, plan.instanceMetaclass, null, null, plan.instanceSeed);` ([M] the father is the
  DModel). `ownerSlotForNewObject` (`viewpoint/ir/irMembership.ts:238`) only climbs visual parents, so a canvas with no
  container node gives null.
- **Proposal, unmeasured**: the composition ref accepting the metaclass, owner the sole instance of the ref's owner in
  the model, else root. On the fixture that owner is the Package `LibraryModel`. Question 4.

## 5. Gating the instance surfaces (COSA 3)

[M] `classTab:paneMenu` reads «New instance of» (finding 3 reproduced), and the rail shows «Instances of» on both tabs.

| Surface | Point | Change at `class` |
|---------|-------|-------------------|
| Pane menu | `EditorV2.tsx:3245-3259`, items `:3990-4005` | `onPaneContextMenu` returns before `event.preventDefault()`, as `:3250` already does with no record |
| Node «New instance» | `:3590-3602` | not pushed |
| «Sync slots» | `:3603` onward | stays: it judges an instance, and repairs at any level |
| Rail section | selector `:666`, memo `:667-670`, props `:5290-5292` | `ontoSections` empty |
| Drop | `:2749-2753` | through `runOntoPayload` below |
| Drop and click, shared | `runOntoPayload` `:3286-3290`, `onOntoActivate` `:3293-3297` | one guard here covers both |

A `class` pane menu shows nothing in lane 1; the class-level content comes with lane 2. Question 2.

Closing the drop at `runOntoPayload` still leaves the rail hidden as the first barrier: a drag cannot start from an
absent section, and the guard covers a drag held across a tab switch.

## 6. The relation between two instances (COSA 4)

### 6.1 What the object viewpoint draws

- [M] The object tab draws 4 `objectNode`s (cityLib, dune, history, alice) and 5 edges, the fixture's 5 links. `nature`
  is absent, not analysed. Question 6.
- [M, decoded view] Vertex predicate `not exists $classifier.value.$memberEnds.values[0]`, edge predicate `exists` of the
  same. Edge source `$slots.values[0].$values.values[0].$instance.value`, target the same on `slots.values[1]`.
- [M] `instantiate(Borrowing, linkRecord, () => null, vp)` is ok: `borrowing2`, father DModel, slots `borrower`, `loans`
  (memberEnds order), values empty; +18 records, one undo entry (2→3), no new node and no new edge; 2 warnings
  `[canvasToJjom] createCompositionEdgeForObjects: vertex(es) not found`.
- [R] A relation held by a **reference slot** draws through nothing today. `hooks/useM1ReferenceEdges.ts:62-85` walks
  `DReference` values; the only DReference on the path, `InstanceValue.instance`, belongs to an object with no vertex,
  and `:134` resolves the source with `vertexByModel.get(objId)`. The IR view has no rule for it.

### 6.2 What an edge drag writes

- [R] `EditorV2.tsx:1970` `if (sourceNode?.type === 'objectNode' && targetNode?.type === 'objectNode') {`, `:1977-1990`
  computes `compatibleRefs` and `connectMatches`, `:1992-1994`:
  `if (compatibleRefs.length === 0 && connectMatches.length === 0) {` / `return; // no compatible refs — ignore`.
- [R] `InstanceSpecification`'s refs are `classifier → Classifier` and `slots → Slot`, so `getCompatibleReferences`
  (`utils/compositionCompat.ts:100`) is empty. The connect rules fail `conformsToRefTarget`
  (`viewpoint/ir/irInteraction.ts:141-142`), whichever viewpoint supplies them: the object view's `{slots, slots}` or, as
  §3.3 says happens on this tab, the class view's `specific/general` and `memberEnds`.
- So by reading the drag is a no-op, and that does **not** explain «shows in the properties panel». Addendum, and §6.4.

### 6.3 What S4 needs (R-OI-5, R-OI-8)

- The synthesis gives the instance and the slots ([M] above). Then two InstanceValues, one per slot.
  `hooks/instantiate.ts:316-319` already builds the `{metaclass, seed}` of an `instance` value, by target name. `object`
  holds `valueKinds`, the `link` record detected does too (`frontend/src/model/ontological/__tests__/bindingDetect.test.ts:55`),
  the `link` written by the 1605 probe has none.
- [R] `handleObjectEdgeSelected` (`EditorV2.tsx:2294-2376`) writes endpoints one hop deep, unusable for slot → value →
  instance. S4 is a new branch at `:1992`, ahead of the `return`.
- End-type check against `memberEnds[i].type` with the generalization closure: `generalsOf` exists
  (`frontend/src/model/ontological/bindingReader.ts:119`, not exported), and `featureClosure` (`:128`) walks it. The
  check needs an exported «classifier conforms to classifier» built on the same walk.
- A reference slot as an edge: an IR edge view on `Slot` looks possible (`irEdgeViews.ts`, `container` token R-B13,
  `walkedObjects` R-B14), **unverified**.

### 6.4 If finding 4 does not reproduce: the candidate gestures

| Gesture | What it writes | Basis |
|---------|---------------|-------|
| Edge drag from a port, object → object | nothing | [R] §6.2; see addendum |
| Ghost row of a reference feature, typing the target's name | a Slot and an InstanceValue with `instance` → the target (`materializeSlot`, `hooks/instantiate.ts:901`; `:316-319`) | [R]; a row and the panel would show it, the canvas has no rule for it (§6.1) |
| `M1PropertiesPanel` | nothing for references: `panels/M1PropertiesPanel.tsx:8` «Reference targets (read-only links)» | [R]; the docked inspector under `components/editors/` was not read |
| Node menu | «New instance» `:3599` and «Sync slots» `:3611` write no relation; «Add reference» `:3672` is gated `node?.type === 'classNode'` and the nodes here are `objectNode` ([M] `classTab:canvas`) | [R] and [M] |

The ghost row is the only gesture found so far that fits «in the properties panel, not on the canvas». Question 5.

## 7. Critical zone and core (COSA 5)

- In CLAUDE.md §3.1: `viewpoint/ir/` (`useIRContainment.ts`, `irInteraction.ts`, `irEdgeViews.ts`), `viewpoint/authoring/`,
  `hooks/useM1ReferenceEdges.ts`, `sync/canvasToJjom.ts`, `utils/portDistribution.ts`.
- Not in §3.1: `EditorV2.tsx`, `panels/PalettePanel.tsx`, `hooks/instantiate.ts`, `ViewpointProperties.tsx`. Lanes 1 and 2
  stay there. Lane 3 needs the Layer Impact Report as soon as it touches `viewpoint/ir/`.
- `portDistribution.ts` and `useM1ReferenceEdges.ts` hold no ontological logic: `command grep -c InstanceSpecification` gives
  0 and 0, control `command grep -c edge utils/portDistribution.ts` gives 78. An IR edge view reaches them as an edge like
  any other, by reading.
- `reducer.ts`: no need seen; `_state` is written through the proxy's setter ([M] §3.1). Exported interfaces: only added
  optional props (`PalettePanel`'s), Rule 11. Neither is closed by a search of all write paths.
- Default-view sources (`DV.tsx`, `defaultViewTemplate.ts`) are not touched, so Rule 14 does not fire.

## 8. Lane plan (COSA 6)

R-OI-19 is the next free id (`grep -o 'R-OI-[0-9]*' docs/decisions.md` tops at R-OI-18).

### Lane 1: level-aware surfaces

- **Files**: `hooks/instantiate.ts` (pure `ontoLevelOf(get, viewpointId)` beside `ontoRailSections`) and its test,
  `EditorV2.tsx` (the five points of §5), `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`
  (select, Advanced gate).
- **Tests**: `ontoLevelOf` on `undefined`, `null`, no key, each value; mutants on each guard.
- **Probe**: `class` tab has no pane menu, no section, no node «New instance», a synthetic drop writes nothing; `instance`
  tab and level absent keep R-OI-18's S2 suite; the control writes one undo entry and undoes cleanly.
- **Crops**: rail and pane menu per level. **Rows**: R-OI-19 (the level in `_state.ontoLevel`, three values), R-OI-20
  (the gating points, amends R-OI-10 and R-OI-18).

**What changes in R-OI-18**: section, drop and click become conditional on the tab's level. At `instance` and `both`
nothing changes. The empty state with «Declare binding…» is hidden at `class` until lane 2 gives it a home there.

### Lane 2: class-level rail from the binding

- **Files**: a pure reader in `frontend/src/model/ontological/` (classifiers, properties, generalizations from the
  record) and its test, `panels/PalettePanel.tsx`, `EditorV2.tsx`, `hooks/instantiate.ts` if the write joins its queue.
- **Tests**: reader on the UML fixture and on a metamodel with no generalization; container rule of §4.2.
- **Probe**: the class tab lists the groups of §4.1, a drop creates a Class under `LibraryModel` with one undo entry, the
  object tab lists none. **Crops**: the rail. **Rows**: R-OI-21 (the groups), R-OI-22 (the container rule), R-OI-23 (the
  `class` pane menu).

### Lane 3: S4 links and their edges (critical zone, Layer Impact Report)

- **Files**: `EditorV2.tsx` (new branch at `:1992`), `hooks/instantiate.ts` (link creation with both InstanceValues),
  `frontend/src/model/ontological/bindingReader.ts` (classifier conformance), `viewpoint/ir/useIRContainment.ts` (the tab's
  viewpoint, §3.3), `viewpoint/ir/irEdgeViews.ts` if the reference slot edge goes there, the UML view's edge rule in the fixture.
- **Tests**: end-type matrix with the closure; both ends in order; a pair with no association opens no menu.
- **Probe**: drag → menu limited by R-OI-5 → one undo entry → one edge; a reference slot draws; save and reopen; the class
  tab's own drags unchanged. **Crops**: the menu and the edge. **Rows**: R-OI-24 (the gesture and its menu), R-OI-25 (the
  plan per tab), R-OI-26 (reference slot as an edge).

## 9. Dependencies and risks

- Lane 2 depends on lane 1 (the level selects the rail). Lane 3 is independent of lane 2 and depends on lane 1 only for
  the tab's level.
- Fixing §3.3 changes which connect rules apply in every non-root tab, a behaviour change beyond the object diagram.
- A level stored as `both` differs in bytes from an absent one: comparisons must go through `ontoLevelOf`.
- Reference slots are written by `.values = [...]`, never `.value = ...` (`frontend/src/model/CLAUDE.md` §9.3): a silent
  failure that a link's two InstanceValues would inherit.

## 10. Measured, read, unmeasured

- **Measured (1605)**: the `_state` merge and undo; rail text on both tabs; the pane menu on both tabs; the 4 nodes and 5
  edges of the object tab; the root viewpoint; the empty link's records, undo and absence of drawing.
- **Read only**: everything tagged [R], including §6.2's no-op and §6.4's table.
- **The 1605 measures that are invalid, not to be cited**: G1 and G2, the edge drags (`connecting:false`: the script cut
  the handle's class to 90 characters before testing `/connectablestart/`, so it grabbed a pool-inactive handle; zero delta
  says nothing about the app, and G2 is the failed positive control); `link:filled` and `link:canvasAfterFill` (the
  InstanceValue class **id** was passed to `createInstance`, which takes a name; no value written);
  `classTab:classNodeMenu` (the pane menu's text; the click did not reach the node's menu).
- **Unmeasured until the addendum**: what a drag writes; whether a filled link draws; the class node's menu.
- **Unmeasured after it in any case**: Alfonso's actual gesture; the 215 DEdge of the export; `getIRIndex` per viewpoint.

## 11. Files read (windows only, except the handoff and the 1605 prompt)

`~/.jjodel-lanes/P-2026-11-08-1605/handoff.md`; `/tmp/p1605/out.json`, `/tmp/p1605/probe.ts`; `docs/decisions.md`
(R-MT-14, R-OI numbering); `docs/log-inbox/instance-of.md`; and, under `frontend/src/`: `view/viewPoint/viewpoint.ts`,
`components/editor-v2/EditorV2.tsx`, `components/editor-v2/viewpoint/ir/irResolveCore.ts`,
`components/editor-v2/viewpoint/ir/useIRContainment.ts`, `components/editor-v2/viewpoint/ir/irInteraction.ts`,
`components/editor-v2/viewpoint/ir/irMembership.ts`, `components/editor-v2/panels/PalettePanel.tsx`,
`components/editor-v2/panels/M1PropertiesPanel.tsx`, `components/editor-v2/hooks/useEditorMode.ts`,
`components/editor-v2/hooks/instantiate.ts`, `components/editor-v2/hooks/createAdapter.ts`,
`components/editor-v2/hooks/useM1ReferenceEdges.ts`, `components/editor-v2/utils/compositionCompat.ts`,
`components/editor-v2/components/DynamicHandles.tsx`, `components/editors/viewpoint/properties/ViewpointProperties.tsx`,
`components/editors/Info.tsx`, `model/ontological/bindingDetect.ts`, `model/ontological/bindingReader.ts`,
`hooks/useInterfaceMode.ts`. The citations of `EditorV2.tsx:504`, `:600-604`, `:1904`, `:5047`, `Info.tsx:330`,
`ViewpointProperties.tsx:117`, `bindingDetect.ts:57-77`, `PalettePanel.tsx:19-27`, `irEdgeViews.ts` and the decoded M2 and
view come from the 1605 handoff and were not re-read here.

## 12. Open questions

1. Where the level is stored. Recommended: `_state.ontoLevel` with `class | instance | both`, the control never deleting the key.
2. What the pane menu shows at `class`. Recommended: nothing in lane 1, «New ▸ <metaclass>» mirroring the rail in lane 2.
3. How an Association is created from the class rail. Recommended: listed disabled in lane 2, created by a lane 3 gesture that synthesizes its two ends.
4. Where a class-level element goes. Recommended: the composition ref accepting the metaclass, owner the sole instance of its owner, else root.
5. Which gesture Alfonso used for finding 4. Recommended: ask, offering the table of §6.4 once the addendum has measured the drag.
6. Why `nature` is missing from the object canvas. Recommended: diagnose it inside lane 3's probe, not as a lane of its own.
7. A drag whose pair matches one association only. Recommended: auto-select as `EditorV2.tsx:1996` does, the menu from two up.
