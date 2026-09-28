# Discovery: an edge between a class and an enumeration must be refused on the canvas, Phase 1

**Prompt-ID**: P-2026-09-27-0035. **Prompt**: `docs/prompts/claude_2026-09-27_0035_prompt_enum_edge_guard_discovery.md`.
**Chat**: C-2026-09-26-1702. **Session**: `f3886a5c-ffdd-43a3-b12d-bf82b5b49e81` (launched by `lane-run`, `-p`).
**Tree**: `~/jjodel-open`, branch `enum-edge-guard`, HEAD `189e8fc53` (parent `da84b10e5`). **Executor**: Opus 5.5
(`claude-opus-5-5`), as the session banner shows.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the real
files. Tags: **[M]** measured in this phase on the working tree of `189e8fc53` (clean, served from disk by Vite),
**[R]** read from a file at `189e8fc53`.

## 0. Preconditions and one deviation

`pwd` `/Users/alfonso/jjodel-open`, branch `enum-edge-guard`, `git log -1` `189e8fc53 docs: add prompt
P-2026-09-27-0035, enum edge guard discovery`, parent `da84b10e5`, `git status --porcelain` empty [M]. Read:
`CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md` (§3.3-3.5), `frontend/src/model/CLAUDE.md`,
`frontend/src/redux/CLAUDE.md`, `docs/decisions.md` RC-25..RC-29 and the Arco A rows, the top entries of
`docs/claude-code-log.md` [R].

**Deviation, declared: the measurements ran on port 3004, not 3003.** Port 3003 was taken by a Vite server this
session did not start: PID 93117, `node .../jjodel-open/frontend/node_modules/.bin/vite --port 3003 --strictPort`,
started Sat 2026-09-26 12:36, cwd `/Users/alfonso/jjodel-open/frontend` [M, `ps`, `lsof`]. The prompt asks for a
free port and forbids touching a server this session did not start, so it was left alone. This session started
its own server on 3004 from the same tree, through a scratch config
`frontend/scripts/smoke/_tmp_vite_enum_3004.config.ts` (gitignored by `.gitignore:67`) that reuses
`vite.config.ts` and moves `cacheDir` to `/tmp`, so the other server's `.vite-cache` is not shared. Both servers
serve the same files; the numbers below are from 3004. `frontend/node_modules` is the P14 symlink to
`/Users/alfonso/jjodel/frontend/node_modules`, already present (created 2026-09-26 12:32, not by this session).

## 1. Objective and hypotheses

Objective: map where a drop between two nodes is decided and what the model does with it today, so the chat can
ratify one design for refusing class ↔ enumeration connections.

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The canvas does not look at node kinds before the edge-type popup | **holds** | §2.1 [R], §3 S1-S6 [M] |
| H2 | The model layer refuses an enumeration as the type of a reference | **partly**: the constructor refuses, the setter accepts, and the canvas calls both, setter last | §2.3 [R], S1 [M] |
| H3 | The model layer refuses an enumeration in `extends` | **partly, by accident**: class→enum dies on a `TypeError` in `_canExtend`; enum→class is written raw onto the `DEnumerator` | §2.3 [R], S4, S5b [M] |
| H4 | The validator or the problems registry reports a reference typed by an enumeration | **falsified**: nothing reports it, with a positive control | §2.4 [R], §3 [M] |
| H5 | The Ecore export produces a file that Jjodel's own import refuses | **falsified for the enum**: export and re-import round-trip the illegal state. **Holds for a package target** | §2.5 [R], S1, S6 [M] |
| H6 | Saved projects can already hold such edges | **holds**: both bad edges survive save and reload | §3.3 [M] |
| H7 | An M1 model of such a metamodel is affected | **partly**: the slot exists, can never be filled, and conformance calls it conformant | §3.2 [M] |
| H8 | A refusal can be placed without touching a critical-zone file | **holds** for option A | §4 [R] |

## 2. What exists [R]

### 2.1 Where a drop between two nodes is accepted

- No `isValidConnection` anywhere in `frontend/src`. `command grep -rln isValidConnection frontend/src` returned no
  file; the positive control `command grep -rln onConnectEnd frontend/src` returned `EditorV2.tsx`, exit 0 [M].
  The `<ReactFlow>` props at `EditorV2.tsx:4141-4157` are `onConnect={onConnect}`, `onConnectEnd={onConnectEnd}`,
  `onReconnect={handleReconnect}`, `edgesReconnectable={true}`, `connectionMode={ConnectionMode.Loose}`.
- `EditorV2.tsx:1574-1580`, `onConnect` stores any connection:
  `pendingConnectionRef.current = connection;`
- `EditorV2.tsx:1582-1660`, `onConnectEnd`: the M1 branch (`mi.mode === 'model'`, objectNode→objectNode) filters by
  `getCompatibleReferences` and IR connect rules; everything else falls to the M2 branch, which opens the popup
  unconditionally (`:1653-1657`): `// ── M2 flow (existing behavior) ──` / `setPendingConnection({ connection,
  position: ... })`.
- The node kind is available at that moment as the ReactFlow node `type`, registered at `EditorV2.tsx:119-124`
  (`classNode`, `enumNode`, `packageNode`, `objectNode`), readable through `getNodes()` (destructured from
  `useReactFlow()` at `:623`); the mode through `modeInfoRef.current.mode` (`:578-579`,
  `EditorMode = 'metamodel' | 'model'`, `hooks/useEditorMode.ts:30`). All three M2 node kinds render
  `DynamicHandles` (`nodes/ClassNode.tsx:436,493`, `nodes/EnumNode.tsx:169`, `nodes/PackageNode.tsx:72`), so all
  three can start and end a connection.
- `EdgeTypePopup.tsx:4` exports `EdgeTypeChoice = 'association' | 'composition' | 'aggregation' | 'inheritance'`;
  the four options are fixed (`:15-20`), none depends on the ends. No option creates an attribute.
- `EditorV2.tsx:1663-1822`, `handleEdgeTypeSelected`: inheritance direction is decided by **vertical position**, not
  by the drag (`:1687-1690`): `// Source above target means user dragged parent→child; swap.` /
  `if (sourceCenter < targetCenter) { [edgeSource, edgeTarget] = [edgeTarget, edgeSource]; }`. Then
  `syncInheritanceEdge(edgeSource, edgeTarget)` (`:1734`) or `syncReferenceEdge(edgeSource, edgeTarget, refLabel,
  choice)` (`:1742`); on `null` it warns `[EditorV2] Failed to create JjOM edge` and closes the popup.
- **The one existing refusal is on reconnect**, `EditorV2.tsx:2107-2109`:
  `// Spec C — solo EClass: rifiuta enum/package/object` / `if (!rawClass || rawClass.className !== 'DClass') return;`.
  The connect path has no equivalent.
- xyflow semantics, read in the installed `@xyflow/system` 0.0.76 (`@xyflow/react` 12.10.2):
  `node_modules/@xyflow/system/dist/esm/index.mjs:2584` `result.isValid = isValid && isValidConnection(connection);`
  and `:2508-2510` `if ((closestHandle || resultHandleDomNode) && connection && isValid) { onConnect?.(connection); }`,
  then `onConnectEnd` fires in every case. With a refusing `isValidConnection`, `onConnect` never stores the
  connection and `onConnectEnd` takes the existing return at `EditorV2.tsx:1588-1591` (`// Invalid connection
  (dropped on empty canvas) — ignore`). The same `onPointerDown` serves reconnect (`index.mjs:2387`, parameter
  `edgeUpdaterType`), so the predicate is consulted on reconnect too. No CSS in the editor styles an invalid
  connection: `EditorV2.scss:1805-1819` styles `.react-flow__handle-connecting` and `.react-flow__handle-valid` only.

### 2.2 The write path of a canvas edge (critical zone, read only)

- `sync/canvasToJjom.ts:281-374`, `syncReferenceEdge`: takes `targetProxy.model` without checking its kind
  (`:288-296`), then, `:332-338`:
  `const lRef = sourceClass.addReference(uniqueName, targetClass.id);` / `lRef.type = targetClass.id;`
  inside `TRANSACTION('EditorV2 create reference edge', ...)`, then `markCanvasEdgePair(sourceVertexId,
  targetVertexId);` (`:354`) and `DVoidEdge.new2(refId, graphId, graphId, undefined, sourceVertexId,
  targetVertexId, ...)` (`:356-364`) outside it. No TRANSACTION wraps a creator (Rule 12 respected today).
- `sync/canvasToJjom.ts:208-271`, `syncInheritanceEdge`: `sourceClass.extends = [...currentExtends,
  targetClass.id];` in its own TRANSACTION (`:244-246`), then `markCanvasEdgePair` (`:251`) and
  `DVoidEdge.new2(..., (d: DEdge) => { d.isExtend = true; })` (`:253-261`). **The result of the `extends` write is
  never checked** before the edge is created.
- `sync/syncState.ts:131-137`, the edge pair guard as it stands: `canvasEdgePairs.add(\`${src}→${tgt}\`);` /
  `return canvasEdgePairs.has(key);`, a module-level `Set<string>` keyed by the directional pair; cleared by
  `clearCanvasEdgePairs()` and, per pair, `clearCanvasEdgePair()` (`:139-149`). Per
  `editor-v2/CLAUDE.md` §3.4 it guards inheritance and M1 edges; M2 references use the composite
  `refId:src→tgt` key and do not consult it.
- `hooks/useJjomSync.ts:468-481`: vertices exist for `DClass` **and** `DEnumerator` (`elem.className === 'DClass' ||
  elem.className === 'DEnumerator'`), so a reference whose `type` is an enum finds a target vertex. Step 3 draws a
  reference edge to whatever vertex holds the type (`:911-913`, `:919-934`), from any path.
- `hooks/useJjomSync.ts:780-781` and `:600-601`: `if (entry.raw.className !== 'DClass') continue;`. Only classes
  are sources of Step 3, so **the stale-inheritance reconcile (`:794-825`) never looks at an edge that starts at an
  enum vertex.** For a class source it deletes an `isExtend` edge whose end is not in `extends`
  (`:801-805`), in a TRANSACTION with only `DeleteElementAction`.
- Auto-populate deps, `useJjomSync.ts:1055`: `[modelid, hasGraph, subElementIds.length, modelClassCount,
  modelRefCount, modelRefTypeSig, modelExtendsSig, modelObjectCount]`. `modelRefTypeSig` (`:360-389`) and
  `modelExtendsSig` (`:406-432`) walk `pkg.classes` only: a raw `extends` written on a `DEnumerator` changes
  neither.
- `utils/jjomTransformers.ts:623-675`: every `isReference` DEdge becomes a `reference` RF edge with
  `reconnectable: 'target'` (`:671`); `:677-688` every `isExtend` DEdge an `inheritance` edge. Neither looks at the
  end kinds.

### 2.3 The model layer

- **Constructor refuses.** `joiner/classes.ts:922-933`, `Constructors.DTypedElement`: `case 'DDataType': case
  'DEnumerator': switch (thiss.className) { ... case 'DReference': default: type = undefined; break; }`, then
  `:940-941` `Log.ww('DTypedElement: cannot resolve the requested type, falling back', ...)` and `:966-968` the
  fallback `Defaults.Pointer_EOBJECT`. A `DPackage` falls to `default: type = undefined` (`:907`) likewise.
- **Setter accepts.** `model/logicWrapper/LModelElement.tsx:4146`, `LReference.set_type` delegates to
  `LTypedElement.set_type` (`:1474-1539`). For a pointer value its only guard is the composition loop
  (`:1528-1532`), then `SetFieldAction.new(c.data, 'type', ptr, "", true);` (`:1536`). No classifier-kind check.
- `LClass.addReference` (`LModelElement.tsx:3280-3286`) is `DReference.new(name, type, context.data.id, true)`: the
  constructor path. The canvas calls it and then the setter, so the setter's value wins.
- `LClass.set_extends` (`LModelElement.tsx:3508-3535`) filters through `_canExtend` (`:3537-3583`), which has no
  kind check and reads `superclass.superclasses` (`:3560`) and `.map`s it (`:3561-3562`): on an `LEnumerator` that
  is `undefined`, hence the `TypeError` measured in S4. The proxy swallows it, `joiner/proxy.ts:477-481`:
  `try { this.lg[this.s + propKey](value, logicContext); } catch (e) { Log.eDevv('failed to set property', ...); }`.
- `LEnumerator` (`LModelElement.tsx:4794`, `extends LDataType`) has no `set_extends`/`get_extends`; the proxy falls
  to `_defaultSetter` (`joiner/proxy.ts:494-497`, `joiner/classes.ts:2405-2407`), which writes the raw field. That
  is how S5b put `extends` on a `DEnumerator`.
- Other writers of a reference type, all class-only [R, mapped by a sub-agent, spot-checked]:
  `LTypedElement.get_validTargets` `LModelElement.tsx:1342` `case DReference.cname: addClasses = true; break;`
  feeds the property panel `components/editors/Info.tsx:303,316` (`(data as any).type = opt ? opt.value : ''`) and
  the classic reference view `common/DV.tsx:1614` (`<Select data={data} field={'type'} />`). JjScript refuses:
  `jjscript/executor/commands/create.ts:601-608` (`kinds: ['class'], primitives: false`,
  `'A reference cannot point at an enum or a primitive.'`), `commands/set.ts:291`
  (`DReference: { what: 'reference', kinds: ['class'], ...}`), `commands/extends.ts:65,99`
  (`if (!childClassName.includes('Class'))`, `NOT_A_CLASS`). `canvasToJjom.ts:709` `syncUpdateReference` and
  `:870` `syncEdgeRefProperty` are generic `lRef[field] = value` writers with no live caller passing `'type'`.
- `components/editor-v2/components/InlineTypeSelect.tsx:24-33` (the class node's attribute type select) lists
  `E_DATA_TYPES` plus the labels of the canvas's `enumNode`s: an enum-typed attribute is created from the class
  node (palette `Attribute`, "drop on node", then this select), not from a connection.

### 2.4 Validation

- `model/conformance/ConformanceValidator.ts:24-29`: `validateConformance(model: LModel, metamodel: LModel)`, M1
  against M2. Its reference checks (`:486-560`) look at M1 values; nothing checks the M2 reference's own type.
- `components/editor-v2/problems/registry.ts:38`: `NodeProblemKind = 'duplicate-name' | 'conformance' |
  'validation'`. No M2 well-formedness producer.
- Search for a kind check on reference types: `command grep -rn -E "DEnumerator|isEnum|className !== 'DClass'|..."`
  over `ConformanceValidator.ts`, `problems/*.ts*`, `model/validation/*.ts` returned two hits, both unrelated:
  `ConformanceValidator.ts:334` (CHECK 10, enum literals of an **attribute**) and
  `problems/validationFreshness.ts:123` (a signature). Control, same tool: `reference_target_type_mismatch` found 3
  times in `ConformanceValidator.ts` [M].

### 2.5 Ecore export and import

- Export, `services/export/EcoreService.ts:344-354`: `xsi:type="ecore:EReference"` and
  `eType="${this.targetTypePointer(targetType, currentPackage)}"`, which for a user classifier ends in
  `crossPackagePointer` (`:798-812`) whatever its kind. `eSuperTypes` (`:249-253`) is written from `cls.extends`
  of classes only; `exportEnumerator` (`:473`) writes no supertypes, so a raw `extends` on an enum is dropped.
- Import, `api/data.ts:994`: `dObject.type = this.read(json, ECoreReference.eType, ...)`, a raw field write, then
  `LinkAllNamesToIDs` (`:247-370`) resolves `#//Name` by name and writes `dobj[replacekey] = target.id` (`:364-366`),
  raw, no setter. The only kind check is for `extends` (`:360-363`): `Log.ex(target.className !== DClass.cname,
  "found a class attempting to extend an object that is not a class", ...)`. **What an imported `.ecore` cannot
  contain**: an `eSuperTypes` to a non-class, and a `type` whose target is not found (`:365`, `Log.ex(!target,
  "LinkAllNames() can't find type target:" ...)`). **An `EReference` whose `eType` is an `EEnum` imports.**

### 2.6 VersionFixer (read only)

- No migration touches `DReference.type` kinds or `DEnumerator.extends`. `redux/VersionFixer.tsx:280`
  `removeNullPtrs(out, s, lookup, 'DReference', [...common, 'type'])` removes null pointers only. The nearest
  precedent is `'2.205 -> 2.206'` (`:508-517`): a `DParameter` typed by a `DOperation` is retyped to `ESTRING`
  (`if (type && type.className === 'DOperation') e.type = Pointers.ESTRING;`).

## 3. Measurements [M]

Method: Playwright (chromium headless, 1440x900) against 3004, offline user seeded in `localStorage` as
`frontend/scripts/smoke/states.ts:97-190` does; per scenario a **fresh browser context, fresh project, fresh
metamodel** ("New Project", "New metamodel" through the UI); the classifiers created through the L API
(`pkg.addClass`, `pkg.addEnumerator`); the package of S6 through a real palette drop. **The gesture is real**:
hover the source node's side, mouse down on the visible ghost source handle, move 20 steps to the target's facing
side, onto its visible target handle, mouse up; then click the popup option. Read after: raw `idlookup`, the RF
edges in the DOM, `window._jjNodeProblems` (`problems/registry.ts:133`), `EcoreService.exportToXML` and
`importFromXML` of that export (dynamic `import('/src/services/export/EcoreService.ts')`, the same module URL the
app uses). A 100 ms timeline of D-edges and RF edges for 3 s after the click. Scratch probes
`frontend/scripts/smoke/_tmp_enum_edge_*.mts`, gitignored, removed at the end of the session.

### 3.1 The seven gestures

Node rects: class 140x42, enum 120x40, side by side at y=141 unless moved.

| Scenario | Popup | Model after | D-graph / canvas after | Console | Export → re-import |
|---|---|---|---|---|---|
| **S0** control class A → class B, Association | yes | `A.references = [newAssociation → B:DClass]`, 0..-1 | 1 `isReference` DEdge A→B, 1 RF `reference` edge | clean | `eType="#//B"` → imports, `A.newAssociation → B:DClass` |
| **S1** Person → NewEnum, Association (the screenshot) | yes | `Person.references = [newAssociation → NewEnum:DEnumerator]` (raw and proxy), 0..-1 | 1 `isReference` DEdge Person→NewEnum, RF `reference` edge, labels `newAssocia`, `0..*` | warning `DTypedElement: cannot resolve the requested type, falling back {... on: DReference, name: newAssociation}` | `<eStructuralFeatures xsi:type="ecore:EReference" name="newAssociation" eType="#//NewEnum" upperBound="-1"/>` → **imports**, `newAssociation → NewEnum:DEnumerator` |
| **S1b** same, Composition | yes | same, `composition: true` | same | same warning | same, plus `containment="true"` → imports |
| **S2** NewEnum → Person, Association | yes | nothing | nothing | error `Transaction failed: TypeError: sourceClass.addReference is not a function`, warning `[EditorV2] Failed to create JjOM edge` | nothing to export |
| **S3** E1 → E2, Association | yes | nothing | nothing | same two lines as S2 | nothing |
| **S4** Person → NewEnum, Inheritance (Person not above) | yes | `Person.extends = []` | **transient**: RF edge at 7 ms, `isExtend` DEdge at 110 ms, both gone at 416 ms | error `failed to set property {... propKey: extends, e: TypeError: Cannot read properties of undefined (reading 'map') at LClass2._canExtend` | nothing |
| **S4b** same with Person moved 238 px below | yes | same as S4 | transient, gone at 616 ms | same error | nothing |
| **S5** NewEnum → Person, Inheritance, side by side | yes | measured identical to S4: enum center 161 < class center 162, **the swap of `EditorV2.tsx:1688` turned it into Person extends NewEnum** | | | |
| **S5b** NewEnum moved below Person, NewEnum → Person, Inheritance | yes | `Person.extends = []`; **`NewEnum.extends = [Person]`**, a key absent before | **persistent** `isExtend` DEdge NewEnum→Person, RF `inheritance` edge | **nothing logged** | enum exported with no supertype; the field is lost silently |
| **S0b** control A → B, Inheritance | yes | `A.extends = [B:DClass]` | 1 `isExtend` DEdge, RF `inheritance` edge, stable | clean | `eSuperTypes="#//B"` → imports |
| **S6** Person → Package (palette drop), Association | yes | `Person.references = [newAssociation → NewPackage:DPackage]` | `isReference` DEdge Person→NewPackage, RF edge | the same `DTypedElement` warning | `eType="#//NewPackage/NewPackage"` → **re-import fails**: `Import failed: [Error]LinkAllNames() can't find type target` |

In every row the drag reported `react-flow__connection valid` during the move: nothing refuses the connection at
the gesture. In every row `_jjNodeProblems` was an empty Map, the validation pill absent, no toast.

**Positive control of the registry read** (`_tmp_enum_edge_registry_ctrl.mts`): a fresh metamodel, `Dup` and
`Other` created, `Other` renamed to `Dup` by a raw `SetFieldAction` (a second `addClass('Dup')` is refused by the
M2 create gate and was the first, failed, attempt of this control): the same reader returned
`[{kind:"duplicate-name",severity:"warning"}, {kind:"duplicate-name",severity:"warning"}]`, 0 before. The empty
registry of the table is an absence the reader can see.

### 3.2 M1 of a metamodel that holds S1

S1 made by the gesture, then a model created through the same request the left rail's "New model" sends
(`jjodel:createModel`, `LeftBar.tsx:371` → `ProjectEditor.tsx:1151-1165` → `createM1`), then
`lm1.addObject({name: 'p1'}, Person, true)`. The object node reads `p1 : Person newAssociation [0] —`; the slot is a
`DValue` with `instanceof = newAssociation:DReference`, `values: []`. `validateConformance(m1, mm)` called directly
(same function the reactive producer uses): `status: 'conformant'`, no violation; registry empty. The slot can never
be filled from the canvas: `utils/compositionCompat.ts:108-115` keeps a reference only if its `targetClassId` is in
the class list [R]. With `lowerBound >= 1` the slot would be a permanent `multiplicity_below_min`
(`ConformanceValidator.ts:501-510`) [R, not measured].

### 3.3 Save, reload, reopen

S1 then S5b in one metamodel, Cmd+S (toast `Project Saved!`), page reloaded, project reopened, metamodel tab
reopened from its name: `Person.newAssociation → NewEnum:DEnumerator`, `NewEnum.extends = [Person:DClass]`, the
same vertex ids, both DEdges (`isReference` Person→NewEnum, `isExtend` NewEnum→Person) and both RF edges back on
the canvas. Screenshot `/tmp/enum_edge_probe_m1_persist.png` (not committed) shows the inheritance triangle on
Person and the `newAssociation` `0..*` edge into NewEnum.

## 4. Options

Common facts: `EditorV2.tsx`, `EdgeTypePopup.tsx`, `LModelElement.tsx`, `joiner/classes.ts`, `api/data.ts` are
**not** in the critical-zone table of `CLAUDE.md` §3.1; `canvasToJjom.ts`, `useJjomSync.ts`, `syncState.ts`,
`VersionFixer.tsx` are. `EditorV2.tsx` and `LModelElement.tsx` do not import under vitest (`window is not
defined` through the `joiner` barrel, stated in `model/__tests__/getTypeFallback.test.ts:7-14`), so, per §5, the
decision of every option goes in a pure module that the bench can execute.

**A. Refuse at the canvas.** `isValidConnection` on `<ReactFlow>` (`EditorV2.tsx:4141-4157`): in a metamodel
(`modeInfoRef.current.mode !== 'model'`) valid iff both ends are `classNode`; in a model, `true` (the M1 logic of
`onConnectEnd` stays the judge). Decision in a new pure module, e.g.
`components/editor-v2/utils/connectionValidity.ts` (`(mode, sourceType, targetType) => boolean`), node types read
with `getNode`/`getNodes` of `useReactFlow` (O(1) lookup needed: it runs on every pointer move). Files: `EditorV2.tsx`,
the new module, its test (3). Critical zone: none. Exported interfaces: none changed, one new export. Tests:
vitest on the predicate, executed on the node-type matrix (class/enum/package/object × metamodel/model), with a
mutation bench; a browser probe of the gesture as in §3. Feedback: xyflow's own (the line does not snap to the
handle, class `invalid` on `.react-flow__connection`, no popup); the editor has no invalid style today, one CSS rule
in `EditorV2.scss` with its token in `styles/tokens/` if wanted (Rules 27-28). Covers S1, S1b, S2, S3, S4, S4b,
S5b, S6 at the gesture, and the same predicate also runs on reconnect (redundant with `:2107-2109`, consistent).
Does not cover: console/API writes, custom view code, the Ecore import.

**B. Refuse in the model layer.** `LTypedElement.set_type` refuses, for a `DReference`, a pointer whose D object is
not a `DClass`; `_canExtend` refuses a non-`DClass` superclass with a reason instead of dying on `.map`; `LDataType`
(or `LEnumerator`) gets a refusing `set_extends` so `_defaultSetter` stops writing a raw `extends`. Decision in a
pure module (e.g. `model/classifierKindRules.ts`, the `nameLookup.ts` pattern). Files: `LModelElement.tsx`, the new
module, its test (3). Critical zone: none, but it is a **core change** (Rule 5). Exported interfaces: none. Tests:
vitest on the rule; the setter wiring only by browser probe (not importable). **B alone does not fix the canvas**
[R, inference, not measured]: `syncReferenceEdge` would still create the reference (constructor → `EObject`), the
refused `lRef.type = enumId` would leave it typed `EObject`, and `DVoidEdge.new2` would still draw Person→NewEnum
from the vertices; Step 3 skips it (`useJjomSync.ts:913`, no vertex for `EObject`), so the divergence persists.
Likewise S5b: `syncInheritanceEdge` does not check the write (`canvasToJjom.ts:244-253`) and Step 3 never
reconciles an enum source (`:780-781`), so the orphan edge stays. Fixing that inside B means editing
`canvasToJjom.ts`, a critical-zone file. **B does not cover the Ecore import** either: `api/data.ts:364-366` writes
raw; the import needs its own check next to the `extends` one at `:360-363` (one more file, not critical zone).

**C. A plus B.** The canvas is the user-facing guard and never reaches `canvasToJjom.ts` with a non-class end; B
(plus the import check) is the invariant for every other path. Files: 6-7, above Rule 19's five, so two steps are
cleaner: C1 = A (3 files), C2 = B + import (4 files). Critical zone untouched in both.

**D. A plus a conversion.** A with `classNode → enumNode` allowed, and the popup showing one option, e.g.
"Attribute : NewEnum", that runs `lClass.addAttribute(name, enumId)` (the constructor accepts a `DEnumerator` for a
`DAttribute`, `joiner/classes.ts:922-929`). The class node would show a row `newAttribute : NewEnum`; no edge. It
changes the exported `EdgeTypeChoice` union (`EdgeTypePopup.tsx:4`, consumer `EditorV2.tsx` only [R, grep of
`EdgeTypeChoice`: `EditorV2.tsx:58,1664`]) and adds a creation path in `EditorV2.tsx` (or in `canvasToJjom.ts`,
critical zone, if placed there). Discoverability is low: the gesture ends with no line on the canvas, so unless the
popup says what it does it reads as a refusal; the existing way (palette Attribute, then `InlineTypeSelect`, which
already lists enums) stays. It is a convenience on top of A, not a correctness fix.

**Which keeps the critical zone untouched**: A, C (as split above), D if the creation stays in `EditorV2.tsx`. B
alone does not, if it is to fix the canvas.

**Which covers saved projects**: none of A-D. Existing states (§3.3) need one of: nothing (they load, render,
export; the S1 shape even re-imports); a validator rule (an M2 well-formedness producer: shows, repairs nothing; a
new `NodeProblemKind` is an exported union change, R-VAL precedent in `registry.ts:29-37`); or a VersionFixer
migration (retype to `EObject` and delete the now-orphan DEdge, drop `DEnumerator.extends` and its `isExtend`
DEdges: a deletion of persisted data, and a migration, both RC-26 items).

## 5. Risks

1. **Rule 12 and the auto-populate.** A adds no write. B adds refusals inside setters that already open their own
   TRANSACTION; no creator is nested. The Step 4 deps (`useJjomSync.ts:1055`) do not move on a refused write (the
   signatures hash committed state), so nothing re-fires.
2. **Orphan DVoidEdge.** Measured today: S5b persistent (§3.1, §3.3), S4 transient and cleaned by Step 3 in
   0.3-0.6 s. A prevents both by never reaching `syncInheritanceEdge`. B alone would add a new one to S1 (§4 B).
3. **Edge pair guard.** `markCanvasEdgePair` runs before every canvas `DVoidEdge.new2` (`canvasToJjom.ts:251,354`).
   Under A it is never reached for a refused pair; under B alone a Person→NewEnum mark would stay set for the session
   (harmless: no legal edge shares that pair).
4. **M1 of such a metamodel.** An unfillable slot, conformant (§3.2); neither A nor B changes existing references.
5. **The inheritance swap** (`EditorV2.tsx:1688`) decides direction by geometry: a predicate that inspected only
   `connection.source` as "the child" would be wrong for inheritance. A "both ends are classes" predicate is
   direction-free, which avoids it.
6. **Reconnect and M1 share the predicate.** xyflow consults `isValidConnection` during reconnect as well; the M1
   branch and the IR object-as-edge reconnect (`EditorV2.tsx:2045-2084`) must see `true`. The predicate must key on
   the editor mode, not only on node types.
7. **Classic editor.** It shares the model path (`DV.tsx:1614` → `Input.tsx` → `set_type`) with a class-only list;
   it cannot create the state today [R]; B would guard it anyway.
8. **Package targets.** A refuses class → package too (S6). Nothing legal is lost: a reference typed by a package
   has no Ecore meaning, and its export does not re-import.
9. **Not measured**: EMF's behaviour on the S1 export (an `EReference` whose `eType` is an `EEnum`); undo/redo of
   S1; Firefox/Safari.

## 6. Files read

`frontend/src/components/editor-v2/EditorV2.tsx` (58-124, 343, 495-623, 1540-1822, 1995-2135, 4136-4160),
`frontend/src/components/editor-v2/components/EdgeTypePopup.tsx` (1-80, 155-200),
`frontend/src/components/editor-v2/components/DynamicHandles.tsx` (26-32, 190-225, 330-420),
`frontend/src/components/editor-v2/components/InlineTypeSelect.tsx` (22-33),
`frontend/src/components/editor-v2/EditorV2.scss` (1790-1840),
`frontend/src/components/editor-v2/sync/canvasToJjom.ts` (200-384),
`frontend/src/components/editor-v2/sync/syncState.ts` (115-160),
`frontend/src/components/editor-v2/hooks/useJjomSync.ts` (315-440, 455-1055),
`frontend/src/components/editor-v2/utils/jjomTransformers.ts` (560-720),
`frontend/src/components/editor-v2/utils/compositionCompat.ts` (1-30, 100-125),
`frontend/src/components/editor-v2/problems/registry.ts` (1-80, 125-135, 194-297),
`frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` (1-60),
`frontend/src/components/editor-v2/problems/validationFreshness.ts` (115-128),
`frontend/src/model/logicWrapper/LModelElement.tsx` (880-980, 1336-1346, 1420-1560, 3270-3320, 3480-3620,
4001-4175), `frontend/src/joiner/classes.ts` (453-480, 860-975, 2400-2460), `frontend/src/joiner/proxy.ts`
(455-500), `frontend/src/redux/action/action.ts` (205-226),
`frontend/src/model/conformance/ConformanceValidator.ts` (22-30, 330-336, 470-560),
`frontend/src/model/conformance/ConformanceTypes.ts` (1-80),
`frontend/src/services/export/EcoreService.ts` (240-260, 338-375, 571-630, 748-825),
`frontend/src/api/data.ts` (247-370, 825-870, 975-1000, 1180-1235),
`frontend/src/redux/VersionFixer.tsx` (270-285, 500-530),
`frontend/src/components/editors/Info.tsx` (300-318), `frontend/src/common/DV.tsx` (1612-1615),
`frontend/src/jjscript/executor/commands/create.ts` (505-526, 600-609), `.../set.ts` (286-292), `.../extends.ts`
(63-110), `frontend/src/jjscript/executor/resolvers.ts` (29-33), `frontend/src/pages/components/LeftBar.tsx`
(355-385), `frontend/src/components/project/ProjectEditor.tsx` (930-960, 1120-1166),
`frontend/src/pages/components/Navbar.tsx` (1085-1105), `frontend/src/model/__tests__/getTypeFallback.test.ts`
(1-40), `frontend/scripts/smoke/states.ts` (1-300), `frontend/vite.config.ts` (1-60),
`node_modules/@xyflow/system/dist/esm/index.mjs` (2387, 2470-2540, 2584). The property-panel, classic-view and
JjScript citations of §2.3 come from a read-only sub-agent and were spot-checked at the lines given.

## 6b. Hypothesis the chat should know it is not getting

The prompt's COSA names class ↔ enumeration; the measurements show the same defect for class → package (S6) and a
second, silent one for enum → class inheritance (S5b, raw `extends` on the enum). The recommended guard covers all
three because it is stated positively ("both ends are classes"), not as "not an enum".

## 7. Questions

1. Should the refusal also say why (a toast or tooltip on drop), or is xyflow's non-snapping line enough?
2. Is class → package to be refused in the same lane (recommended), or kept out of scope as not named by the prompt?
3. Should the Ecore import refuse an `EReference` typed by an `EEnum` (fail like `extends`) or retype it with a warning?
4. Is a saved-state detector (M2 well-formedness producer) wanted now, or a ticket?

## 8. Decisions taken (unattended)

1. **Option C, in two steps.** C1 = A: `connectionValidity.ts` pure predicate + test, wired as `isValidConnection`
   in `EditorV2.tsx`, metamodel mode only. C2 = B plus the import check: kind rule in a pure module, used by
   `LTypedElement.set_type` (DReference), `_canExtend`, a refusing `set_extends` on the data types, and
   `LinkAllNamesToIDs` for `type`. Recommended answer: adopt. C2 is a core change (CLAUDE.md Rule 5); RC-26 does not
   list it, so the chat adopts it under RC-25 and it travels in the digest.
2. **Package targets refused with enums** (Q2): yes, same predicate; recommended.
3. **Refusal feedback** (Q1): xyflow's native invalid state plus one invalid-line CSS rule; no toast. Recommended.
4. **Import of an EReference to an EEnum** (Q3): retype to `EObject` with a `Log.ww`, not a failed import, so an
   existing file still opens. Recommended.
5. **No migration in this lane; saved states get a ticket** (Q4): the states load and render, the S1 shape
   round-trips; the ticket names S1/S5b/S6 and the two options (validator producer, migration). Recommended. This
   chooses between options with different persistence, so RC-27's second-agent check applies before the chat adopts it.
6. **Option D deferred**: convenience, low discoverability, touches an exported union.

## 9. Decisions awaiting Alfonso

None for the recommended option: no critical-zone edit, no exported interface broken, no migration, no deletion.
A migration of saved projects (retype and delete orphan DEdges, drop `DEnumerator.extends`) would be one, and is not
recommended now.

**Recommended option in two lines**: C, split: first A (`isValidConnection` in `EditorV2.tsx`, both ends must be
classes in a metamodel, pure predicate tested), then B (model setters and the Ecore linker refuse a non-class
reference type or supertype). No critical-zone file, no migration; saved states get a ticket.
