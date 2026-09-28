# Discovery: enum step B (S23), load, undo/redo and replay against the setters it would guard, Phase 1

**Prompt-ID**: P-2026-09-27-1645. **Prompt**: `docs/prompts/claude_2026-09-27_1645_prompt_discovery_enum_step_b.md`.
**Chat**: C-2026-09-27-1437. **Session**: `6c6558a9-4ddd-4dd0-8637-e3eff7c88dfe` (launched by `lane-run`, `-p`).
**Tree**: `~/jjodel-gate`, branch `enum-step-b`, HEAD `ce4b28b0a` (parent `bbd9b7142`). **Executor**: Opus 5.5
(`claude-opus-5-5`), as the session banner shows.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the real files.
Tags: **[M]** measured in this phase on the working tree of `ce4b28b0a`, served from disk by Vite on 3017; **[R]** read
from a file at `ce4b28b0a`. Source lines are those of the files; the call stacks the recorder captured carry the line
numbers of Vite's transformed modules, so they are quoted for the function names only.

## 0. Preconditions

`pwd` `/Users/alfonso/jjodel-gate`, branch `enum-step-b`, `git log -1` `ce4b28b0a docs: add prompt P-2026-09-27-1645,
enum step B discovery`, `git status --porcelain` empty at the start and at the end [M]. Read: `CLAUDE.md`,
`frontend/src/model/CLAUDE.md`, `frontend/src/redux/CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`,
`docs/PROTOCOL.md`, `docs/decisions.md` (RC-20..RC-30, R-EDGE-1..3), the top of `docs/claude-code-log.md`,
`docs/log-inbox/views.md`, the backlog report through `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md`
(§0, §4.7, §4.9, §5, §7, §8), and `docs/discovery/discovery_2026-09-27_enum_edge_guard.md` whole [R].

- `frontend/node_modules` is the P14 symlink to `/Users/alfonso/jjodel/frontend/node_modules`, already present
  (created 2026-09-27 01:39, not by this session); left in place.
- Port 3017 was free (`lsof -iTCP:3017 -sTCP:LISTEN`, exit 1). This session started Vite on it with a scratch config
  `frontend/scripts/smoke/_tmp_enumb_vite_3017.config.ts` (cacheDir `/tmp/enumb_scratch/vite-cache`, so no tree's
  `.vite-cache` was written) and stopped it at the end; 3017 free again [M].
- Probes, all gitignored by `.gitignore:67` (`frontend/scripts/smoke/_tmp_*`) and left on disk:
  `_tmp_enumb_rec.js` (the recorder), `_tmp_enumb_probe.ts` (the paths), `_tmp_enumb_migr.ts` (the migration shapes),
  `_tmp_enumb_census.mjs` and `_tmp_enumb_census2.mjs` (the example corpus). Raw results in `/tmp/enumb_scratch/`
  (not committed). No file under `frontend/src` was written.

## 1. Answer in brief

- **Load, undo/redo, VersionFixer replay, «Check integrity», the Ecore import and opening the canvas tab call none of the
  setters step B would guard** [M]. The recorder was live from the first module of each page. It saw 0 calls to
  `set_type`, `LClass.set_extends`, `_canExtend`, `addExtend` or the data-type raw `extends` write on those paths, and
  0 `SetFieldAction` on `type` or `extends`. The positive controls fired on the same pages (§3.1).
- **With the candidate guard live, the same saved project opens, replays and undoes identically**: 0 refusals, the same
  shapes (§3.6). The load-path precondition of R-EDGE-2 is met.
- **Two legitimate paths do reach the guarded setters, both to remove, not to add**: deleting the class a saved enum
  «extends» (`Dummy.dclass`), and deleting the S5b edge from the canvas (`syncDeleteEdge`). A data-type `set_extends`
  that refuses every write leaves a dangling pointer in the first and blocks the only in-app repair in the second.
  Refusing additions only (mode `on-b`) keeps both working (§3.6).
- **New: S5b is not inert.** With `NewEnum.extends = [Person]`, `Person.addReference` and `Person.addAttribute` throw
  `ltarget.extendedBy is not iterable` (`joiner/classes.ts:739`). A saved S5b metamodel cannot take a new feature on
  that class, and `LReference.duplicate` of a Person reference silently fails with it (§3.7).
- **For S24, a raw migration must do four things, measured one by one**: retype, clear `extends`, remove the `pointedBy`
  back-links, delete the orphan D-edges. With the back-links left, the S5b crash survives the migration. With the
  D-edges left, the canvas keeps drawing the removed edges (§3.8).
- **The bundled example corpus holds none of the three shapes**: 0 of 11 blobs, with a planted positive control (§3.9).

## 2. Objective and hypotheses

Objective: measure, before step B's Phase 2, whether load, undo/redo and VersionFixer replay of a metamodel holding the
three R-EDGE-3 shapes pass through the setters R-EDGE-2 would guard, and whether a guard there would reject a
legitimate replay; give decision G (S24, due by 2026-10-04) the measurements it needs.

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Loading a saved project runs no guarded setter | **holds** | §2.1 [R], §3.2 [M] |
| H2 | Undo and redo run no guarded setter | **holds** | §2.2 [R], §3.3 [M] |
| H3 | VersionFixer replay (the migration chain and the default-view refresh) runs no guarded setter | **holds**, over 8 start versions | §2.3 [R], §3.4 [M] |
| H4 | «Check integrity» (autocorrect + LoadAction) and the Ecore import run no guarded setter | **holds** | §2.3, §2.5 [R], §3.5 [M] |
| H5 | A guard in the setters rejects no legitimate replay | **holds for load, undo/redo, replay, repair, import; falsified for a data-type guard that refuses removals** | §3.6 [M] |
| H6 | The saved shapes are inert: they load, render and do nothing else | **falsified for S5b** | §3.7 [M] |
| H7 | A raw migration needs only to retype and clear `extends` | **falsified**: it also needs the back-links and the D-edges | §3.8 [M] |
| H8 | The bundled examples hold at least one of the shapes | **falsified** | §3.9 [M] |

## 2b. What exists [R]

### 2.1 Load

- `redux/reducer/reducer.ts:1597`, `stateInitializer`: `SaveManager.load(state, project);` after
  `JSON.parse(await U.decompressState(project.state))` (`:1585`).
- `components/topbar/SaveManager.ts:56-59`: `save = VersionFixer.update(save);` then
  `store.dispatch({...new LoadAction(save, false)} as any);`.
- `redux/reducer/reducer.ts:519-520`: `case LoadAction.type: newState = action.value;`. The state is replaced whole;
  nothing on this path goes through an L proxy.

### 2.2 Undo and redo

- `redux/reducer/reducer.ts:1158-1159`: `case UndoAction.type: return doUndoRedo(oldState, action, 'undo');` and the redo twin.
- `:1327`, in `undo()`: `let undonestate = Uobj.applyObjectDelta(state, delta, false);`. A stored delta is applied to
  the raw state.
- The canvas's Cmd+Z in JjOM mode, `components/editor-v2/EditorV2.tsx:2553-2557`: `if (isJjomMode) { ...
  UndoAction.new(1, DUser.current, false).commit(); return; }`. The non-JjOM branch below it, with
  `reconcileJjomAfterUndoRedo` (`sync/canvasToJjom.ts:1729`), handles attributes only and is not reached on a metamodel tab.
- `:1211`, the merge rule that shapes the undo steps of §3.3: `if (!shouldMerge && (delta.vertexs || ... ||
  delta.edges || delta.graphs)) shouldMerge = true;`.

### 2.3 VersionFixer

- `redux/VersionFixer.tsx:413`, the rule the migrations follow: `// let ls: LState = LPointerTargetable.from(s); nope,
  avoid L-objects. actions would fire in present state instead of in parameter state`. A search of the file for L-layer
  entry points (`command grep -n -E "\bL[A-Z][A-Za-z]*\.(from|wrap|fromD|fromPointer|updateDefaultView)|\bL\.|proxyObject|\.new\("`)
  returned three lines: `:149` `LViewElement.updateDefaultView(v, s)`, `:352` `LoadAction.new(s)`, `:413` the comment.
- `view/viewElement/view.tsx:1978-2001`, `updateDefaultView` with a state passed: `s.idlookup[v.id] = newView;` then
  `if (state) { ... return; }`. Raw.
- `:158-360`, `autocorrect`: `U.deepReplace` and `removeNullPtrs` on a copy, then `:352`
  `if (canLoadAction) TRANSACTION('project repair', () => { LoadAction.new(s); });`.

### 2.4 Other replays

- `components/collaborative/Collaborative.ts:105-126`: a received action is `fire(ca, session)`d as it arrived, raw.
  Read only; no collaborative server in this phase.
- `model/logicWrapper/LModelElement.tsx:1437-1455`, `get_type` step 2, **calls `set_type` on a read** when the raw type
  is a string: `if (c.data.className !== 'DReference') { ... getEnumByName ... }` then, for anything but an attribute,
  `Selectors.getByName(DClass, rawType, ...)`, then `this.set_type(ptr as any, c);`. For a `DReference` the enum lookup is
  skipped, so the pointer handed to `set_type` is always a `DClass`'s: a class-only guard passes it.

### 2.5 The setters and who reaches them outside a user write

- `LModelElement.tsx:1474-1539`, `LTypedElement.set_type`; `:4146` `LReference.set_type` delegates to it. The last
  check before the write is the composition loop (`:1528`), then `:1536` `SetFieldAction.new(c.data, 'type', ptr, "", true);`.
- `:3508-3535`, `LClass.set_extends`, filtering the added pointers through `_canExtend` (`:3537-3583`), which reads
  `superclass.superclasses` (`:3560`) and `.map`s it (`:3561`) with no kind check.
- `LDataType` / `LEnumerator` have no `set_extends`: the proxy (`joiner/proxy.ts:478`,
  `this.lg[this.s + propKey](value, logicContext)`) finds none and falls to `:495`
  `this.lg._defaultSetter(value, logicContext, propKey)`, which writes the raw field.
- `common/Dummy.ts:295-308`, `Dummy.dclass`, run when a class is deleted: for every `extendedBy` of the deleted class,
  `l.extends = newValues.filter((e) => e && e !== dDeleted.id) as any;`.
- `LModelElement.tsx:3700-3714`, `LClass.get_extendedBy`: every `pointedBy` whose source ends in `extends`, resolved with
  `L.from(arr[1])`, whatever its class. A `DEnumerator` holding `extends` is returned as a subclass.
- `components/editor-v2/sync/canvasToJjom.ts:557-575`, `syncDeleteEdge(edgeId, true)`, and `:404-428`, the
  connected-edge cleanup of `syncDeleteVertex`: both `sourceClass.extends = currentExtends;` (`:574`, `:425`) on the
  edge's source, a `DEnumerator` for S5b.
- `joiner/classes.ts:718-744`, `Constructors.DStructuralFeature`, run by every new attribute or reference: it walks the
  father class and its subclasses, `let ltarget = L.from(target) as LClass; for (let ext of ltarget.extendedBy)
  nextTargets.push(D.from(ext));` (`:738-739`).
- `LModelElement.tsx:4114-4143`, `LReference.duplicate`: `context.proxyObject.father.addReference(context.data.name,
  context.data.type)` then `we.type = context.data.type;` (`:4138`). `get_addReference` (`:3283`) returns `undefined`
  on `m2CreateRefused` for a name already in the class, so a same-class duplicate never reaches `we.type`.
- `api/data.ts:363` `Log.ex(target.className !== DClass.cname, "found a class attempting to extend an object that is not
  a class", ...)`, `:366` `Log.ex(!target, "LinkAllNames() can't find type target:", ...)`, `:368`
  `else dobj[replacekey] = target.id;`. The Ecore linker writes raw.

## 3. Measurements [M]

**Method.** Playwright (chromium headless, 1440x900) against 3017, offline user seeded as `scripts/smoke/states.ts:177-189`
does. The recorder `_tmp_enumb_rec.js` is an init script: before any module runs it traps the window slots that
`RuntimeAccessible` fills when a class is defined (`joiner/classes.ts:464`, `if (!windoww[constructor.cname])
(windoww[constructor.cname] as any) = constructor;`), and wraps, as each class appears:

- `LTypedElement.prototype.set_type`, with R-EDGE-2's rule evaluated on its arguments (`wouldReject`: a `DReference`
  whose new pointer resolves to a D object that is not a `DClass`);
- `LClass.prototype.set_extends`, `_canExtend` (`wouldReject`: a non-class superclass) and `impl_addExtend`;
- the data types' `_defaultSetter` when the key is `extends`;
- the static `SetFieldAction.new` for the fields `type` and `extends`;
- `SaveManager.load`;
- `VersionFixer.update`.

Each phase also counts the reducer's actions from `windoww.jjactions` (`reducer.ts:612-613`). With
`localStorage.__enumbGuard` set, the wrappers become the candidate guard:

- `set_type` and `_canExtend` refuse what `wouldReject` names;
- the data types get a `set_extends` that refuses every write (`on-a`) or only the writes that add a pointer (`on-b`).

**Run 1, guard off.** A project is made through «New Project». A metamodel `EnumB` is made through `createM2`
(`pages/components/Navbar.tsx:73`), with `Person`, `Other` and `NewEnum` through `pkg.addClass`/`addEnumerator`. Undo
history is armed by setting the two flags a first mouseup and a first canvas edit set (`reducer.ts:1439`,
`EditorV2.tsx`). Then:

- **S1**, `syncReferenceEdge(vPerson, vEnum, 'badRef', 'association')`: the write path of the pre-C1 gesture, called
  directly because the C1 predicate now refuses the drag.
- **S6**, `Person.addReference('pkgRef', Other)`, then `.type = <the default package>`.
- Two legitimate controls: `okRef` (Person → Other) and `Other.extends = [Person]`.
- **S5b**, `syncInheritanceEdge(vEnum, vPerson)`.

Then, in order: undo until S1 and S5b are gone, redo as many times, `SaveManager.save()`, and a cold reload of
`#/project?id=…`. After the reload: the tab through `DockManager.open2`, one control write, the replay, «Check
integrity», export and import, the delete cascade, undo and redo of it, the unlink of S5b, and the duplicate.

**Runs 2 and 3**: the same saved project, restored into a fresh context from run 1's `localStorage` dump, with the guard
`on-b` and `on-a`; the run after the save is repeated. The `on-b` run was repeated once: its first attempt died on a
module-URL lookup in the resource-timing buffer, fixed in the probe (buffer enlarged, path fallback) before the rerun; no
measurement changed shape.

### 3.1 Positive controls (P12)

| Page | What must move | Moved |
|---|---|---|
| run 1, build | `set_type` on S1, from `syncReferenceEdge` | `set_type` DReference `badRef` DClass→DEnumerator, `wouldReject: true`; stack `LReference.set_type < proxy.set < canvasToJjom.ts < TRANSACTION < syncReferenceEdge` |
| run 1, build | `set_type` on S6 | `pkgRef` DClass→DPackage, `wouldReject: true` |
| run 1, build | S5b through the raw path | `dataType._defaultSetter.extends` NewEnum → [Person], stack `proxy.set < canvasToJjom.ts < syncInheritanceEdge`, then `SFA.extends` on DEnumerator |
| run 1, build | a legitimate supertype | `LClass.set_extends` Other → [DClass], `_canExtend` `wouldReject: false` |
| every reloaded page | the recorder is live after the load | control write `okRef.type = NewEnum`: `set_type` 1 (run 1: `SFA.type` 1, okRef now typed DEnumerator; `on-a`, `on-b`: `set_type:REFUSED` 1, okRef still typed Other) |
| every reloaded page | the recorder is live before the load | classes patched at 772-848 ms, `SaveManager.load` at 1045-1146 ms after navigation start (run 1: patched@772, load@1045; `on-b`: 846, 1146; `on-a`: 836, 1145) |

### 3.2 Cold load and tab open (H1)

| Run | `boot` (load) | `tab` (open, Step 3/4) | Shapes after tab |
|---|---|---|---|
| off | `SaveManager.load` 1, `VersionFixer.update` 1 (2.229→2.229); no other record; no reducer action with `type`/`extends` | no record; actions: CreateElementAction 1, SetFieldAction 10, SetRootFieldAction 2 | `Person.badRef->NewEnum:DEnumerator`, `Person.pkgRef->default:DPackage`, `NewEnum->[Person:DClass]`, 6 D-edges, 6 RF edges, 3 RF nodes |
| on-b | identical | identical | identical |
| on-a | identical | identical | identical |

The one CreateElementAction on tab open is Step 3 redrawing `ext:Other->Person`, which the sync layer had deleted during
the undo phase: it is absent in the shapes after load and present after tab.

### 3.3 Undo and redo (H2), run 1

14 undos from 9 undoable entries (the sync layer's DeleteElementAction pushes new deltas, `UndoAction` 14 +
`DeleteElementAction` 5), then 14 redos (`RedoAction` 14 + `DeleteElementAction` 1). **0 records of any kind.** The
steps changed the shapes, so the zero is not an empty undo:

| Step | Shape change |
|---|---|
| undo 2 | `Other->[Person]` gone |
| undo 4 | `okRef` gone |
| undo 6 | `pkgRef` back to `Other:DClass`: a type change applied as a delta, no `set_type` |
| undo 10 | `NewEnum->[Person]` gone, `badRef` now `->MISSING` |
| undo 13 | `badRef` gone |
| redo 3 | `badRef->NewEnum:DEnumerator` and `NewEnum->[Person:DClass]` back, 0 `set_type`, 0 extends write |
| redo 7 | `pkgRef->default:DPackage` back |
| redo 13 | the built state back, `ctlRef` included |

A redo **writes the illegal shapes back without a setter**: a guard cannot see it and does not need to, since it
restores a state that existed.

**Observation, pre-existing, not from the shapes**: undo 10 to 12 left `badRef` pointing at a missing object (`MISSING`).
The merge rule of `:1211` folded the enum's creation and later edge deltas into one step, so the enum was undone before
the reference that points at it.

### 3.4 VersionFixer replay (H3)

Saved state version 2.229. In the reloaded page, the saved JSON was decompressed and its `version.n` rewound. The
same `VersionFixer.update` the load calls was then run on a deep copy. Sentinel: `Person.sealed = ['SENTINEL']`, which
`'2.2 -> 2.201'` resets (`VersionFixer.tsx:414-419`).

| Start | Conversions run | Sentinel after | Error | Records | Shapes |
|---|---|---|---|---|---|
| 2.1 | 30 | `[]` (cleared) | none | `VersionFixer.update` 1, nothing else | S1, S5b, S6 unchanged |
| 2.2 | 29 | `[]` | none | same | unchanged |
| 2.205 | 24 | `SENTINEL` | none | same | unchanged |
| 2.215 | 14 | `SENTINEL` | none | same | unchanged |
| 2.22 | 9 | `SENTINEL` | none | same | unchanged |
| 2.225 | 4 | `SENTINEL` | none | same | unchanged |
| 2.228 | 1 | `SENTINEL` | none | same | unchanged |
| 2.229 | 0 | `SENTINEL` | none | same | unchanged |

Identical in `on-a` and `on-b`. The chain runs, and no adapter touches `DReference.type` kinds or `extends`.

### 3.5 «Check integrity» and the Ecore import (H4)

- `VersionFixer.autocorrect(undefined, true, true)` (the Navbar entry, `Navbar.tsx:1552`): one `LoadAction`, 0 records,
  shapes unchanged, in all three runs.
- `EcoreService.exportToXML` then `importFromXML`, all three runs:
  - The full export fails on S6, `Import failed: [Error]LinkAllNames() can't find type target`, as in
    `4e5dff7ad` §3.1.
  - The same XML without `pkgRef` imports as `EnumB2` with `Person.badRef->NewEnum:DEnumerator`.
  - 0 records: CreateElementAction 9, SetRootFieldAction 12, SetFieldAction 16, none on `type`/`extends`.
  - The import never reaches the setters, so R-EDGE-2's import retype has to live in `LinkAllNamesToIDs` (`api/data.ts:366-368`).

### 3.6 The candidate guard live (H5)

| Path | off | on-b (refuse additions) | on-a (refuse all) |
|---|---|---|---|
| load, tab, replay ×8, repair, import | 0 records | 0 records, 0 refusals, same shapes | 0 records, 0 refusals, same shapes |
| control write `okRef.type = NewEnum` | written | refused | refused |
| delete Person (`Dummy.dclass`): the extends rewrites | `LClass.set_extends` Other→[], `_defaultSetter.extends` NewEnum→[] | `LClass.set_extends` Other→[], `dataType.set_extends:ALLOWED` NewEnum→[] | `LClass.set_extends` Other→[], `dataType.set_extends:REFUSED`: **`NewEnum.extends = ['DANGLING:Pointer…_16']`** |
| undo of the delete | Person and `NewEnum.extends=[Person]` back, 0 records | same | same |
| redo of the delete | `[]` | `[]` | dangling again |
| unlink S5b from the canvas (`syncDeleteEdge(edge, true)`) | `_defaultSetter.extends` →[]; edge gone; `Person.addAttribute` then **works** | `ALLOWED`; edge gone; works | `REFUSED`; edge gone, **`NewEnum.extends` still [Person]**, `Person.addAttribute` still throws |
| `LReference.duplicate` of `badRef` | returns nothing, 0 records (same-name gate, §2.5) | same | same |

After Person's deletion, all three runs keep a D-edge `ext:NewEnum(DEnumerator)->?(-)` whose end vertex is gone. Step 3
never looks at an enum source (`useJjomSync.ts:780-781`, cited from `4e5dff7ad` §2.2, not reread).

### 3.7 S5b breaks feature creation on its «supertype» (H6)

Run 1, build, in order: `Person.addAttribute('attrBefore')` **ok**, then S5b, then `Person.addReference('refAfter',
Other)` **throws** `ltarget.extendedBy is not iterable`, `Person.addAttribute('attrAfter')` **throws** the same, and
`Other.addReference('ctlRef', Person)` (control, Other not «extended» by the enum) **ok**.

Mechanism [R]:

- `get_extendedBy` returns NewEnum for Person (§2.5).
- `Constructors.DStructuralFeature` then calls `.extendedBy` on the `LEnumerator`, which has no such getter, and iterates
  `undefined` (`joiner/classes.ts:739`).

The same break measured elsewhere:

- `LReference.duplicate` on Person dies inside its TRANSACTION.
- The migration probe (§3.8, variant A) reproduces it after a reload.
- Unlinking S5b through the canvas repairs it (§3.6).

The prior report did not test a write on Person after S5b; its «load, render, survive save and reload» stands.

### 3.8 What a raw migration must touch (H7), `_tmp_enumb_migr.ts`

The saved state was edited the way a VersionFixer adapter would edit it, as raw JSON with no L proxy, then written
back, cold-loaded, the tab opened, and the model asked two questions. `Defaults.Pointer_EOBJECT` is in the saved state
as a `DClass` (`eobjInSaved: true`).

| Variant | Edit | Load | Canvas after tab | `Person.addAttribute` | Delete NewEnum: `badRef` |
|---|---|---|---|---|---|
| A | `NewEnum.extends=[]`, `badRef.type`, `pkgRef.type` = EObject | ok, 0 records | **still draws** `ext:NewEnum->Person` and `ref:Person->NewEnum` (6 RF edges) | **throws** `extendedBy is not iterable` | survives, typed EObject |
| B | A + remove the back-links `idlookup.<NewEnum>.extends` from Person, `idlookup.<badRef>.type` from NewEnum, `idlookup.<pkgRef>.type` from the package | ok | still draws both | **ok** | survives |
| C | B + delete the two orphan D-edges (idlookup, graph `subElements`, root `edges`, vertices' `pointedBy`) | ok, no console error | both gone, 4 RF edges | ok | survives |

- A and B **measure** what `4e5dff7ad` §4 B inferred: Step 3 does not remove a reference D-edge whose reference was
  retyped to a class with no vertex.
- A second `ref:Person->Other` edge in all variants is an artefact of this probe's S6: typed Other first, retyped by the
  setter. A real S6 gesture ends on the package's vertex (`4e5dff7ad` §3.1).

### 3.9 Census of the bundled corpus (H8)

The 11 `DState` blobs under `frontend/src/examples/`, including copies and the `examples/` subfolder, were parsed
(`_tmp_enumb_census*.mjs`). The template-literal ones (`first.ts`, `second.ts`) were evaluated first. Result: 0
`DReference` typed by a non-class over 33 references (20 unique across the distinct blobs), 0 data types with
`extends`, 0 class supertypes that are not classes. Positive control: the same counters on a copy of `first.ts` with one
reference retyped to its enum `Type` and `Type.extends` planted: `refNonClass` 1, `extOnDataType` 1. The corpus is not
the user base: projects in users' browsers and on the server were not reachable.

## 4. Design options for step B

The load precondition of R-EDGE-2 is met for every path measured. What remains is where each guard sits and what it
must let through.

**B1. `LTypedElement.set_type`, for a `DReference`**: refuse a pointer that resolves to an existing D object that is
not a `DClass`, in the `nameLookup.ts` pattern (rule in `model/classifierKindRules.ts`, wired in `LModelElement.tsx`).
- Let through a string that does not resolve (`:1524` `if (!ptr) ptr = old;`): set-by-name exists by design (`:1424`).
- Safe on load, undo/redo, replay, repair and import (0 calls, §3.2-3.6).
- `get_type`'s autocorrect hands it only class pointers (§2.4). The composition-loop check (`:1528`) is the precedent
  for a refusal in this setter.
- Risk: the refusal must say so. The proxy discards the return value (`proxy.ts:478`), so the caller's only signal is the
  log.

**B2. `_canExtend`**: refuse a non-`DClass` superclass with a reason before `superclass.superclasses` (`:3560`). Today
that read dies on `.map`. Reached only from `set_extends` and `impl_addExtend`. The cascade `Dummy.dclass` passes the
deleted class's own supertypes, classes, so it is unaffected (§3.6).

**B3. The data types' `set_extends`**: **refuse additions, allow removals** (`on-b`).
- Refusing every write (`on-a`) is measured to leave a dangling pointer when the «supertype» is deleted.
- It is also measured to make the canvas unable to remove a saved S5b, which leaves Person unable to take a feature
  (§3.6, §3.7).
- A shrinking write must go through `SetFieldAction` with the pointer flag, as `_defaultSetter` does today, so the
  back-links move with it. §3.8 A shows what a write that leaves them behind costs.

**B4. The Ecore import**: the retype of an `EReference` typed by an `EEnum` goes in `LinkAllNamesToIDs`
(`api/data.ts:366-368`), next to the `extends` check at `:363`. Measured: the import runs no setter, so B1 would not see it.

**B5 (outside the three files named by S23). `Constructors.DStructuralFeature`**, `joiner/classes.ts:739`: tolerate a
non-class in `extendedBy` (skip it). This removes the S5b crash for saved projects whatever S24 decides. Without it,
every saved S5b keeps breaking its «supertype» until the user unlinks the edge. It is a core file (Rule 5) and a
fourth file for step B's Phase 2. Alternative: keep `get_extendedBy` class-only (`LModelElement.tsx:3706-3712`, one
more condition), which also stops `Dummy.dclass` from visiting the enum. That is a behavioural change to the cascade:
the enum's pointer would then dangle, as in `on-a`. So `classes.ts:739` is the narrower change.

**Tests.** `LModelElement.tsx` does not import under vitest (`model/__tests__/getTypeFallback.test.ts:7-14`, cited from
`4e5dff7ad` §4). The rule goes in the pure module with a mutation bench. The wiring is verified by a browser probe:
`_tmp_enumb_probe.ts` with the guard mode replaced by the real code is that probe, and its table §3.6 is the oracle.

## 5. Options for S24 (decision G) and what each needs

**Producer** (`components/editor-v2/problems/`, critical zone §3.1).
- A new `NodeProblemKind` member. `registry.ts:29-37` says adding one is not «adding an optional property» under Rule 11;
  the only file naming the type is `registry.ts` (`command grep -rln NodeProblemKind frontend/src`).
- A pure detector over `idlookup` for: a reference typed by a non-class, a data type with `extends`, a class supertype
  that is not a class. A `MISSING` type is a separate verdict: undo can produce one transiently (§3.3).
- A `*ProblemSync.tsx` mounted beside `UniquenessProblemSync.tsx`, with that file's signature and `hasOwnProperty`
  guard (its header, lines 1-40).
- A Layer Impact Report in `docs/lir/` and the RC-30 go-ahead.
- It shows and repairs nothing. An action on the problem can repair through the setter paths measured here: unlinking
  S5b repairs Person (§3.6); a retype through the setter moves the back-links.
- What it does not cover: the S5b crash stays until the user acts, unless B5 lands.

**Migration** (`'2.229 -> 2.230'` in `VersionFixer.tsx`, raw).
- Measured to need all four of §3.8 C:
  - retype to `Defaults.Pointer_EOBJECT`;
  - clear `extends` on data types;
  - remove the three kinds of back-links;
  - delete the orphan D-edges from idlookup, the graph's `subElements`, the root `edges` and the vertices' `pointedBy`.
- It is a deletion of persisted data (RC-26): the retype drops the enum or package the user drew, and it is silent
  unless it reports.
- Rule 14 does not apply (no default view touched).
- It runs on every load, once. §3.4 shows the chain is safe to extend.

**Evidence for the choice**: 0 occurrences in the bundled corpus (§3.9); the shapes exist only in projects edited with
the canvas before `5dc09a4ce` or through the console. S5b is the only shape with a functional cost beyond display (§3.7).

## 6. Risks

1. **Silent refusals.** The proxy set trap discards the setter's verdict (`proxy.ts:478`). A B1/B3 refusal inside
   `syncInheritanceEdge` or `syncReferenceEdge` still lets them create the D-edge (`canvasToJjom.ts:244-261`, report
   `4e5dff7ad` §4 B). C1 keeps the canvas from getting there; the console and custom views do not.
2. **Orphan edges after a delete.** `ext:NewEnum->?` survives Person's deletion in every mode (§3.6); «Check integrity»
   should remove an edge whose `end` dangles (`VersionFixer.tsx:222-236`) [R, not measured].
3. **The undo merge** (`reducer.ts:1211`) can expose a `MISSING` type between steps (§3.3). It is independent of step B,
   but a producer that fires on every non-class type will light on it.
4. **Recorder coverage.** It wraps the prototypes the proxy resolves through. A setter body copied elsewhere, or a
   future `set_extends` on `LEnumerator` itself, would be outside it. Collaborative replay was read, not measured.
5. **Not measured**: Firefox/Safari; the server persistence path (`Online.save`/`getOne`); an M1 model of such a
   metamodel on load; the S6 shape made by the real gesture (this probe's S6 went through the setter).

## 7. Files read

- `frontend/src/model/logicWrapper/LModelElement.tsx` (1261, 1420-1560, 2771-2775, 3180-3205, 3281-3292, 3495-3660,
  3700-3720, 3885-3890, 4000-4003, 4108-4180, 4369-4372, 4793-4795)
- `frontend/src/joiner/proxy.ts` (233-256, 440-500)
- `frontend/src/joiner/classes.ts` (452-505, 715-760, 2395-2440)
- `frontend/src/redux/reducer/reducer.ts` (420-620, 1110-1450, 1570-1625)
- `frontend/src/redux/VersionFixer.tsx` (1-420, grep of the whole file)
- `frontend/src/redux/action/action.ts` (386-396, 480, 660-705, 772-813, grep)
- `frontend/src/view/viewElement/view.tsx` (1970-2004)
- `frontend/src/components/topbar/SaveManager.ts` (1-140)
- `frontend/src/pages/Project.tsx` (40-80)
- `frontend/src/api/persistance/projects.ts` (85-175, 340-370, 455-500)
- `frontend/src/data/storage.ts` (1-28)
- `frontend/src/common/U.tsx` (425-452)
- `frontend/src/common/Dummy.ts` (285-320)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (200-300, 383-432, 545-580, 1729-1830 by grep)
- `frontend/src/components/editor-v2/EditorV2.tsx` (2535-2605, grep)
- `frontend/src/components/editor-v2/problems/registry.ts` (20-45, grep)
- `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` (1-40)
- `frontend/src/components/collaborative/Collaborative.ts` (105-127)
- `frontend/src/components/devtools/SmokeBoot.tsx` (1-60)
- `frontend/src/components/abstract/DockManager.tsx` (14)
- `frontend/src/pages/components/Navbar.tsx` (73-110)
- `frontend/src/pages/components/LeftBar.tsx` (355-380)
- `frontend/src/services/export/EcoreService.ts` (47-58, 94, 571-628)
- `frontend/src/api/data.ts` (grep: 142-193, 247, 291, 334, 363-368, 482)
- `frontend/src/examples/` (every `.ts`, parsed by the census)
- `frontend/scripts/smoke/states.ts` (1-260)
- `frontend/scripts/lane-run.mjs` (468-620)
- `frontend/vite.config.ts` (grep)
- `.gitignore` (6-80)
- `frontend/scripts/smoke/_tmp_g14_common.ts`, `_tmp_g14_vite.config.ts`, `_tmp_prof_undo.ts` (other lanes' gitignored
  probes on this tree, read as templates, not modified)

Critical-zone files: `canvasToJjom.ts`, `VersionFixer.tsx` and `problems/registry.ts` read only.

## 8. Decisions taken (unattended)

1. **The R-EDGE-2 precondition is met.** Step B's Phase 2 may proceed on the load paths. Recommended: adopt; the chat
   records it in the R-EDGE-2 row as measured by this report.
2. **The data-type `set_extends` refuses additions and allows removals** (B3, mode `on-b`). Refusing all is measured to
   break two legitimate paths. Recommended: adopt as a constraint of step B's Phase 2.
3. **`set_type` lets an unresolved name through** (B1), as today. Only a pointer to an existing non-class is refused.
4. **The import retype stays in `LinkAllNamesToIDs`** (B4). The import runs no setter.
5. **B5 goes with step B's Phase 2 as a fourth file** (`joiner/classes.ts:739`, skip a non-class in `extendedBy`). It is
   the one change that stops saved S5b projects from breaking feature creation whatever S24 decides. Not a critical-zone
   file, not an exported interface, no persisted data touched, so not on RC-26's list. It widens S23's file list (Rule
   1), and the chat records the widening in the Phase 2 prompt. Recommended: adopt.
6. **The producer, if chosen, treats a `MISSING` type as its own verdict**, not as a non-class (risk 3).

## 9. Decisions awaiting Alfonso (RC-26)

1. **G: S24, the saved-states detector, by 2026-10-04.** Producer (critical zone: LIR and RC-30 go-ahead; a new
   `NodeProblemKind` member; repairs nothing by itself) or migration (`2.229 -> 2.230`: four raw edits, measured in §3.8;
   a deletion of persisted data; silent unless it reports). Evidence:
   - 0 occurrences in the bundled corpus;
   - S5b is the only shape with a functional cost, which B5 removes;
   - the measured repair paths go through the setters and keep the back-links.

   Recommended: the producer, with a repair action through those setter paths, after step B's Phase 2 and B5, and after
   MODELS.
