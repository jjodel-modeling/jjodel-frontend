# Discovery — #168 R, a containment move takes the object off the model root (Phase 1)

**Prompt-ID**: P-2026-10-02-0740
**Prompt file**: `docs/prompts/claude_2026-10-02_0740_prompt_168_r_reparent_from_root.md`
**Session**: b228cdc1-c489-4ca5-81ca-7cca9f8fac1c
**Tree / HEAD**: `/Users/juridirocco/development/jjodel-168-reparent`, branch `168-reparent`, `a78d614b7` ("docs(#168): lane prompt R, a containment move leaves the model root")
**Executor**: Anthropic Claude Opus 5.5
**Stato**: Fase 1, read-only on the code. No tracked file under `frontend/` modified. Probe `frontend/scripts/smoke/_tmp_168_r_baseline.ts` (gitignored, not committed), run with `node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_r_baseline.ts --port 3044 --id P-2026-10-02-0740`, log `~/.jjodel-lanes/P-2026-10-02-0740/probe-_tmp_168_r_baseline.log` (third run: 25/25 non-FAIL, 0 page errors, 4 console errors all from the `#/allProjects` boot, `init_dash` and `wrong project setup in navbar`, before any project opens).

This report is a set of hypotheses with evidence, not a definitive reference. A reader acting on it rereads the real files and, where a number matters, reruns the probe. MEAS = measured in this phase on `a78d614b7`; READ = code reading only.

---

## 0. Answer in brief

- **Defect reproduced on the current code** (MEAS A1): after JjScript `set s1.competencies = c1`, `c1.father` is the `competencies` slot, the slot lists `c1`, and `c1` is still in `model.objects` and `LModel.objects`.
- **The premise "copy `set_father`" does not hold** (MEAS A2, GC). The base `set_father` (`LModelElement.tsx:754-769`) maintains no collection at all: it calls `getCollection(c.data.className, oldD.className)` with class-name strings, and `getCollection` returns `''` for any string that is not a pointer (`classes.ts:2654`, `:2660`). It would also remove the wrong id (`val` is the NEW father, not the moved element). Measured after `c3.father = slot`: father slot, still in `objects`, NOT in the slot's `values`. The fix therefore uses the constructor's action shape, by value (`classes.ts:788`), not `set_father`'s lookup. Diff in §6.
- **The fixed state is the addObject nested form** (MEAS A3, FR): father slot, in the slot's `values`, not in `objects`. That is what `addObject` already produces for every child it creates.
- **Callers that start from a root object today** (§4): JjScript `set`, the developer canvas **connect** and **add-child** gestures (both through `syncCreateCompositionLink`, MEAS CL1/CL2: the child is re-fathered to the slot and stays in `objects`), the IR form single-reference picker (`setSlotValue`), the classic Properties panel (`Info.tsx`), and JjTL output reference seeding (`ProjectEditor.tsx:2222`). The Data Manager create-and-link and the Configurator do NOT use the branch: they use a raw `'+='` (`appendValue`), which re-fathers nothing.
- **Developer canvas, measured with the fixed state simulated** (CV2, FR): the moved object keeps its vertex if it had one. But its OWN outgoing reference edges are deleted from the graph by the reconcile pass of `useM1ReferenceEdges` (sources = `rawModel.objects`, `:131`). In the probe, `K1->P` was removed from `subElements`, and React Flow still painted a D-less edge 4 s later. On a canvas opened after the move, the object gets no vertex and no edges, exactly like an addObject child.
- **Other consequences of the same fact** (an object leaves the roots): a later JjScript run cannot find it by name (MEAS A1b today succeeds only through the stale entry; READ `instance.ts:117-120`). Conformance stops visiting it (READ `ConformanceValidator.ts:35`, the CRUD3 F2 perimeter). Evicting a root-born child from the slot now leaves an orphan, as it already does for addObject children (MEAS A7, A7b). Aggregation references re-father too (MEAS A6), so the fix applies to them.
- Ctrl+Z of a containment set restores the father today in one press (MEAS A8). The added action goes in the same TRANSACTION, so it is expected in the same history entry. This is a Phase 2 measure.

Questions (§9 has the detail):

1. The fix strips the outgoing edges of every object a developer nests by canvas gesture. Proceed, hold, or widen?
   Recommended: run Phase 2 as approved, and merge R only with (after) a critical-zone lane that makes `useM1ReferenceEdges.ts:131` and `m1EdgeSweep.ts:81` take their sources from the graph's object vertices.
2. After the fix, a later JjScript run cannot address a moved object by name.
   Recommended: carry "name lookup over the containment tree" into J4's prompt (`jjscript/**` is outside R).
3. Eviction from a composition slot leaves an orphan (father DModel, not in `objects`) for root-born objects too.
   Recommended: ticket the eviction half (`_clearValueAtPosition`) as its own lane, not in R.
4. Aggregation: apply the root removal wherever the branch re-fathers (`composition || aggregation`, shapeless included)?
   Recommended: yes, uniform; ticket separately whether aggregation should re-father at all.
5. Diff form: literal `'objects'` with `'-='` by value, or `getCollection(dObj, dModel)`?
   Recommended: literal `'objects'`, the constructor's own action, with a one-line comment on why not `set_father`'s lookup.

---

## 1. Hypotheses under test

1. **H1** (M0 Q4, prompt §Contesto): "the containment branch re-fathers but leaves the object in `model.objects` when it came from the root". **HOLDS** on `a78d614b7` (MEAS A1, §5.1).
2. **H2** (prompt §Contesto): "`set_father` is the canonical path and does `SetFieldAction.new(oldD, oldCollection, val, '-=', true)` on the old father's collection". **FALSIFIED as a behaviour**: the line is there, but it never acts, and if it did act it would remove the wrong id (MEAS A2, GC; §5.2).
3. **H3** (prompt Fase 1 step 4): "the state the fix produces is the state `set_father` already produces". **FALSIFIED**. `set_father` leaves the object in `objects` and out of the slot's `values` (MEAS A2, CV3). The fixed state equals the **addObject** nested form instead (MEAS A3, FR; §5.3).
4. **H4** (prompt §COSA): "nothing else changes: slot-to-slot move, non-containment reference, enum, primitive, addObject". **HOLDS for the D-layer of those arms** (MEAS A3, A4, A5; enum and primitive READ: they never reach the `lval.className === DObject.cname` branch). **PARTLY FALSIFIED downstream**: the readers of `model.objects` change behaviour for the moved object: canvas edges, JjScript lookup, conformance perimeter, eviction (§5.4-5.7).
5. **H5** (`irContainment.ts:78-79`): "an object created by the canvas keeps `father = DModel`" while the composition slot lists it. **FALSIFIED for the composition-link gestures**. After `syncCreateCompositionLink` the child's father is the slot (MEAS CL1, CL2). The comment holds only for the moment between `syncCreateObject` and the link (MEAS CL2 `cl2pre`).

## 2. Files read

- `CLAUDE.md` (root, in full as loaded), `docs/PROTOCOL.md` (P1-P16 in full), `docs/decisions.md` (in full), `frontend/src/model/CLAUDE.md` (in full), `frontend/src/components/editor-v2/CLAUDE.md` (in full).
- `docs/discovery/discovery_2026-10-01_168_m0_measures.md` (in full), `docs/discovery/2026-06-12_jjscript_m1_coverage.md` (G7, Q3 and OQ-1 by grep: lines 17-18, 68-80, 148, 157), `frontend/scripts/smoke/README-probes.md:161-320`.
- `/Users/juridirocco/development/jjodel-168-measures/frontend/scripts/smoke/_tmp_168_m0_measures.ts` (in full, read-only; the base of this lane's probe).
- `frontend/src/model/logicWrapper/LModelElement.tsx`: `:730-770` (base `set_father`), `:4060-4100` and `:4202` (`LReference` containment getters), `:5688-5770` (`LModel` children, `objects`, `roots`), `:6490-6532` (`LObject.set_father`), `:7255-7300` (`get_addObject` head), `:7440-7451` (`LValue.get_containment`), `:7825-8076` (`_clearValueAtPosition`, `get_setValueAtPosition`, `set_values`, `set_value`).
- `frontend/src/joiner/classes.ts`: `:632-640` (`setExternalPtr`), `:770-796` (`DObject` constructor collections), `:2651-2678` (`getCollection`).
- `frontend/src/redux/reducer/reducer.ts:100-345` (`+=`/`-=` semantics), `frontend/src/redux/action/action.ts:330-360, 440-485`.
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts:295-320, 620-800` (read-only; Step 2bis), `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts:55-200`, `frontend/src/components/editor-v2/sync/m1EdgeSweep.ts:1-140`.
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts:1385-1424, 1540-1720`, `frontend/src/components/editor-v2/EditorV2.tsx:1860-1890, 1960-1990, 2885-2920`.
- `frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts:100-420`, `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts:70-100, 200-230`.
- `frontend/src/jjscript/executor/commands/instance.ts:55-260` (read-only), `frontend/src/jjscript/executor/handleRegistry.ts` (by grep: `:33`, `:38`, `:74`, `:80`).
- `frontend/src/model/conformance/ConformanceValidator.ts:20-75, 436-600`, `frontend/src/components/abstract/tabs/instanceManagerModel.ts:40-140`, `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:2848-2870, 3060-3080`, `frontend/src/services/export/JsonModelService.ts:355-400`, `frontend/src/components/project/ProjectEditor.tsx:1780-1860, 1960-2110, 2180-2240`, `frontend/src/common/DV.tsx` (by grep, see §5.8).

## 3. Fixture (built by the probe, port 3044)

Metamodel `RMM`, package `default`, classes `Scenario` (`title`), `Competency` (`label`), `Person`. References are `Scenario.competencies → Competency` (composition, `*`), `Scenario.lead → Person` (plain, `0..1`), `Scenario.team → Person` (aggregation, `*`) and `Competency.mentor → Person` (plain, `0..1`). Three M1 models: `r_model` (D-layer arms), `r_canvas` (canvas open before the moves) and `r_fresh` (canvas opened after the moves). All three were added in **one** `project.models` write and asserted present. The first run added them in three writes, which raced on the deferred dispatch (`action.ts:349`) and dropped `r_model` from `project.models`. That was a probe fault (README-probes "the index is the caller's"), fixed, and is not evidence.

## 4. Callers of the containment branch (`get_setValueAtPosition`, `info.isContainment` true, target a `DObject`)

| caller | write | can start from a root today? | evidence |
|---|---|---|---|
| JjScript `set <inst>.<ref> = <inst>` | `refProxy.values = [...meaningful, targetInstance.id]` (`instance.ts:841`) → `set_values` → branch | **yes**, every `create instance` makes a root | MEAS A1 |
| Canvas **connect** M1 composition edge | `EditorV2.tsx:1881` → `syncCreateCompositionLink` → `refProxy.values = [...meaningful, childObject.id]` (`canvasToJjom.ts:1627`) | **yes**, canvas objects are roots (`canvasToJjom.ts:1409` "fatherType — MUST be DModel") | MEAS CL1 |
| Canvas **add child** | `EditorV2.tsx:2912`: `syncCreateObject` (root) then `syncCreateCompositionLink` | **yes**, always | MEAS CL2 |
| Canvas object-as-edge endpoints | `EditorV2.tsx:1980` `slot.values = [...meaningful, objId]` | yes if the endpoint reference is a composition (unusual) | READ |
| Canvas Properties reference select | `canvasToJjom.ts:1570/1572` `slot.values = ...` | yes on a composition reference | READ |
| IR form / Data Manager detail, single-valued reference picker | `setSlotValue` → `fresh.setValueAtPosition(index, value, { isPtr })` (`formWrite.ts:150`); `ReferenceWidget.tsx:5` | yes, if the picker offers roots for a 0..1 composition | READ |
| IR form clear `x` | `formWrite.ts:199` `setValueAtPosition(index, undefined, …)` → `_clearValueAtPosition` (eviction, §5.6) | n/a (eviction) | MEAS A7 |
| Data Manager create-and-link, Configurator link | `appendValue` → `SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr)` (`formWrite.ts:268`; callers `InstanceManagerTab.tsx:2319`, `ConfiguratorTab.tsx:221`) | **does not reach the branch**: no re-father, the object stays a root that a slot lists | READ |
| Classic Properties panel | `Info.tsx:772`, `:777`, `:940` `setValueAtPosition(…, { isPtr: true })` | yes | READ |
| Classic context menu | `ContextMenu.tsx:395` `l.values = [...(l.values as LObject[]), child]` | depends on how `child` was made | READ |
| JjTL output seeding | `ProjectEditor.tsx:2222` `feature.setValueAtPosition(ri, targetRealId, { isPtr: true })`, targets resolved among roots | **yes**, every `forall` output is a root with an explicit vertex | READ |
| JjTL nested output | `ProjectEditor.tsx:2005` `slot.addObject(...)` | no (born nested) | READ |
| `createAdapter` | `createAdapter.ts:357` `setValueAtPosition(i, ids[i], { isContainment: false })` | never: the branch is disabled by the flag | READ |

## 5. Findings

### 5.1 The defect (H1), MEAS

- Branch, `LModelElement.tsx:7915-7929`:
  ```
  let oldContainer: LValue | LModel = lvalo.father;
  let oldContainerValue: LValue = (oldContainer.className === DModel.cname) ? undefined as any : (oldContainer as LValue);
  // detach contaied object from old parent
  if (oldContainerValue && oldContainerValue.id !== c.data.id) outactions.clear.push(()=>{
  ...
  outactions.set.push(()=> {
      SetFieldAction.new(val as Pointer<DObject>, "father", c.data.id, undefined, true)
  });
  ```
  When `oldContainer` is the `DModel`, nothing leaves `objects`.
- A1-pre: `{"fatherClass":"DModel","inModelObjects":true,"objectsCount":2}`. A1 after the set: `{"fatherClass":"DValue","fatherSlot":"competencies","owner":"s1","inModelObjects":true,"inFatherValues":true,"lmodelObjectsHas":true}`.
- A4b (root-born `c1` moved again, s1 → s2): owner `s2`, s1's slot becomes `[null,null]` (holes), `c1` still in `objects`. A state that is already incoherent stays incoherent. The fix acts only when the current father is the `DModel`, so it does **not** heal projects saved with the stale entry.

### 5.2 `set_father` is not a working reference (H2), MEAS + READ

- `LModelElement.tsx:763-766`:
  ```
  let oldCollection = oldD ? LPointerTargetable.getCollection(c.data.className, oldD.className) : '';
  let newCollection = LPointerTargetable.getCollection(c.data.className, newD.className);
  if (oldD && Array.isArray((oldD)[oldCollection])) SetFieldAction.new(oldD, oldCollection as any, val, '-=', true);
  if (newD && Array.isArray((newD)[newCollection])) SetFieldAction.new(newD, newCollection as any, val, '+=', true);
  ```
- `classes.ts:2654`: `if (typeof data === 'string') cname = (Pointers.isPointer(data) ? (d = D.fromPointer(data))?.className : '') || '';`, and `:2660` `case '': return '';`. A class name is not a pointer, so `cname` is `''`.
- MEAS GC: `getCollection('DObject','DModel')` = `''`; `getCollection('DObject','DValue')` = `''`; `getCollection(dObj, dModel)` = `'objects'`; `getCollection(objPtr, modelPtr)` = `'objects'`; `getCollection(dObj, dSlot)` = `'values'`.
- Second defect, READ: `val` in `set_father` is the new father pointer, so even a working lookup would `'-='` / `'+='` the new father's id, not the element's.
- MEAS A2 (`c3.father = s1.competencies` slot): `{"fatherClass":"DValue","inModelObjects":true,"inFatherValues":false}`, slot values `["…USER_29"]` (only `c1`), `slotListsItself: false`. In short: father moved, collections untouched. MEAS CV3 is the same on the canvas: no `S->K2` edge, because the slot does not list `K2`.

### 5.3 The target state is the addObject nested form (H3), MEAS

- `classes.ts:786-792`: a `DObject` fathered by the `DModel` is registered with `setExternalPtr(thiss.father, "objects", "+=")`. Otherwise it goes in `"values"` (comment: "object containing object is not in any direct child collection. access through values"). `setExternalPtr` (`:636`) issues `SetFieldAction.create(target, property, val, accessModifier, true)` with `val = this.thiss.id`.
- MEAS A3 (`s1.$competencies.addObject({label:'x'}, 'Competency')`): `{"fatherClass":"DValue","inModelObjects":false,"inFatherValues":true}`.
- MEAS A4 (addObject child moved s1 → s2 through `values = [c4]`): owner `s2`, not in `objects`, objects count unchanged (4 → 4), and s1's slot no longer lists it.
- The readers already document this invariant. `TreeViewContent.tsx:2853-2858` says "`LModel.objects` contiene i soli oggetti il cui `father` e' il DModel" and calls the double listing "uno stato incoerente". `ConformanceValidator.ts:556` says "Existence is NOT membership of `model.objects`. That collection holds the ROOTS only". `instanceManagerModel.ts:50` says "`model.objects` holds ROOT objects only".

### 5.4 Developer canvas (H4 downstream), MEAS on `r_canvas` and `r_fresh`

- **CV0**, canvas opened on `r_canvas`: vertices `S, P, K1, K2`; edges `K1->P`, `K2->P`; DOM shows 2 RF edges.
- **CV1**, today's code, JjScript `set S.competencies = K1` with the canvas open: an `S->K1` edge is added; `K1->P` stays; K1 stays in `objects`.
- **CV2**, fixed state simulated by the one action the fix adds (`SetFieldAction.new(r_canvas, 'objects', K1, '-=', true)`), after 4 s: the K1 vertex stays; the store edges are `K2->P, S->K1`, so **`K1->P` was deleted**. The DOM still lists 3 RF edges, one of which has no D-edge (`noD:…0872_USER_83`). That is a stale RF edge still painted after its D-edge was deleted.
  - Cause, READ. `useM1ReferenceEdges.ts:131` builds `validPairs` from `for (const objId of (rawModel.objects ?? []))`, and `:158` `const toDelete = managedM1Edges.filter(e => !validPairs.has(...))` deletes every managed edge whose source is not a root.
  - `m1EdgeSweep.ts:81` and `:100` apply the same rule from the delete paths.
- **CL1** (connect path, `syncCreateCompositionLink(S, K3)`) and **CL2** (add-child path, `syncCreateObject` then link): today the child ends `{"fatherClass":"DValue","inModelObjects":true,"inFatherValues":true}`. So after the fix both gestures produce exactly the CV2 situation for the child's own outgoing edges. CL2 `cl2pre` confirms the child is born a root.
- **FR**, canvas opened after `K9` left `objects` (simulated fix), with `K10` an addObject child that has `mentor = P9`: vertices `P9, S9` only, no edges. The S9 node body reads `competencies[2] K9 K10`. A moved object and an addObject child render identically.
- Not measured: the classic canvas (`DV.tsx`). The M1 children of a model are `allSubObjects` (`LModelElement.tsx:5699`), not `objects`. `command grep -c -E "objects|roots" frontend/src/common/DV.tsx` returns 0, with the positive control `command grep -c "model"` returning 31 on the same file. The classic default view therefore does not read `objects` directly; whether it draws a nested object twice today was not measured.

### 5.5 JjScript name resolution, MEAS (today) + READ (after)

- `instance.ts:117-120`: `findInstanceByName` filters `model.objects`. The handle registry is cleared at every run, `handleRegistry.ts:80` `window.addEventListener(JjScriptEvents.EXECUTION_START, clearHandles);`.
- MEAS A1b: a later run `set c1.label = "L1"` → `{"success":true}`, resolved only because `c1` is still (stale) in `objects`. After the fix the same call takes the `matches.length === 0` path → `INSTANCE_NOT_FOUND`. That is a projection from the code, to be measured in Phase 2. It is the same situation every addObject child is already in.

### 5.6 Eviction from a composition slot, MEAS

- `_clearValueAtPosition`, `LModelElement.tsx:7855-7856`: `if (info.isContainment && oldTarget?.className === "DObject") { SetFieldAction.new(oldVal as Pointer<DObject>, "father", context.proxyObject.model.id, undefined, true); }`. The object is re-fathered to the model, with no `'+='` on `objects`.
- A7 (root-born `c5`, today): after `formWrite.clearValue(s3, 'competencies', 0)`, `{"fatherClass":"DModel","inModelObjects":true}`. It is a coherent root, but only because it never left `objects`.
- A7b (addObject child `c6`, today): `{"fatherClass":"DModel","inModelObjects":false}`. The object becomes an orphan.
- After the fix, A7 behaves like A7b. That is the one D-layer path where a root-born object ends worse than today.

### 5.7 Aggregation, conformance, Data Manager, undo

- A6, MEAS: `set s1.team = p2` (aggregation) → `{"fatherClass":"DValue","fatherSlot":"team","inModelObjects":true}`. The branch's containment test is `LReference.get_containment` = `context.data.composition || context.data.aggregation` (`LModelElement.tsx:4202`). For a shapeless slot it is `true` (`:7449-7450`, `if (!iof) return true; // shapeless`). The fix inherits exactly that notion.
- CONF, MEAS: `validateConformance(r_model)` → `conformant`, 0 violations. Today `c1` is visited as a root. After the fix it is not visited, because the loop is `model.objects` (`ConformanceValidator.ts:35`). It stays a resolved target of CHECK 6 through `resolvedOnGraph` (`:441`), so it raises no `dangling_reference`.
- DM-rows, MEAS: `instancesOfClass` gives `["c1(contained)","c3(contained)","c4(contained)","c5","c6"]`. It walks `father` (`instanceManagerModel.ts:114` `isContained: idlookup[d.father]?.className === 'DValue'`) and never reads `objects`, so it is unaffected by the fix.
- A8, MEAS, with `U.userHasInteracted = true`: history 1 → 2 after the set. One Ctrl+Z → 1, and `c7` is back to `{"fatherClass":"DModel","inModelObjects":true}`.

### 5.8 Searches behind claims of absence

- "No `'objects', x, '-='` removal exists today": `command grep -rn "'objects', *[a-zA-Z_.]*, *'-='" frontend/src` returned nothing. The pattern has no positive control of its own, so this is a soft claim. It is not load-bearing.
- "DV.tsx does not read `objects`/`roots`": `command grep -c -E "objects|roots"` returned 0 with exit 1, against `command grep -c "model"` returning 31 on the same file (§5.4).
- "The Data Manager and Configurator links do not reach the branch": the two call sites (`InstanceManagerTab.tsx:2319`, `ConfiguratorTab.tsx:221`) call `appendValue`, which is `SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr)` (`formWrite.ts:268`). READ, not exercised in this phase.

## 6. Proposed diff (text, NOT applied)

One method, `LValue.get_setValueAtPosition`, containment branch, `LModelElement.tsx` after `:7926`:

```diff
                             if (oldContainerValue && oldContainerValue.id !== c.data.id) outactions.clear.push(()=>{
                                 ...
                             });
+                            // a root leaves the root list, as the DObject constructor registered it (joiner/classes.ts:788);
+                            // not set_father's lookup: getCollection() on class names returns '' (#168 R discovery §5.2)
+                            if (!oldContainerValue) outactions.set.push(()=> {
+                                SetFieldAction.new(oldContainer.id as Pointer<DModel>, 'objects', val as Pointer<DObject>, '-=', true)
+                            });
                             outactions.set.push(()=> {
                                 SetFieldAction.new(val as Pointer<DObject>, "father", c.data.id, undefined, true)
                             });
```

- `oldContainerValue` is `undefined` exactly when `oldContainer.className === DModel.cname` (`:7916`).
- `val` is the moved object's pointer here (`:7882` `val = tmpval_id`), unlike in `set_father`.
- `'-='` with a value removes every occurrence by value and is a no-op when the value is absent (`reducer.ts`, `isArrayRemove`, `Uarr.findAllIndexes`, `gotChanged = !!indexes.length`).
- `isPointer: true` mirrors the constructor's `'+='` (`classes.ts:636`), so `pointedBy` is kept symmetric.
- The action joins `outactions.set`, the same list and the same TRANSACTION as the father write. Both paths, `set_values` (`:8023-8024`) and `immediatefire` (`:7960-7962`), run it inside the TRANSACTION opened at `:7948` or `:8012`.
- No creator is involved, so Rule 12 does not apply.

## 7. Layer Impact Report (CLAUDE.md §3.2)

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)
  [x] L-layer (computed proxies)
  [x] JjOM (model entities)              (indirect: the root set of an M1 model)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   (indirect, no code change; measured CV2/FR)
  [ ] Canvas classic                     (not measured; DV.tsx reads allSubObjects, not objects)
  [x] Sync layer (useJjomSync hooks)     (indirect, no code change; useM1ReferenceEdges / m1EdgeSweep read objects)
  [ ] Persistence (VersionFixer / jsxString)

D-layer
  - What changes: one more SetFieldAction, DModel.objects '-=' <moved DObject id> (isPointer true),
    only when a DObject whose father is the DModel is written into a containment slot.
  - What does NOT change: father write, slot values write, old-slot detach, isMirage, name-slot
    propagation, the early returns (identical assignment, containment loop), primitives and enums.
  - Cross-layer: DModel.objects shrinks, so every reader of it sees one root fewer.
  - Side-effect safety: '-=' by value is idempotent. It runs in the same TRANSACTION, so Ctrl+Z is
    expected to restore it with the father (A8 baseline; measured in Phase 2).
L-layer
  - What changes: LModel.objects / roots / root no longer list the moved object.
    LValue.get_setValueAtPosition is the only edited method.
  - What does NOT change: LModel.allSubObjects, LModel.$name (deep lookup), LObject.father.
  - Cross-layer: aligns L with the documented invariant (TreeViewContent.tsx:2853, ConformanceValidator.ts:556).
JjOM
  - What changes: a moved object becomes a nested instance, the same as an addObject child (A3 = FR).
  - Cross-layer: JjScript name lookup (instance.ts:117) and conformance (ConformanceValidator.ts:35)
    walk roots only, so the object leaves both perimeters (§5.5, §5.7).
Canvas v2-flow / Sync
  - What changes (no code change): an open canvas keeps the moved object's vertex, but
    useM1ReferenceEdges' reconcile (:131, :158) and m1EdgeSweep (:81, :100) delete its outgoing reference
    edges. RF kept painting the deleted edge (CV2). A canvas opened later gives it no vertex (FR).
    Step 2bis (useJjomSync.ts:739) only creates and never deletes, so no vertex is lost.
  - What does NOT change: edges INTO the moved object from a root (S->K1 kept), vertices of roots.
  - Side-effect safety: the reaping is a DeleteElementAction batch, which Ctrl+Z restores only as part of
    its own history entry. Not measured.
Persistence
  - No migration. Projects saved with the stale double listing stay as they are (A4b).

Smoke-test scenarios potentially affected:
  - JjScript create + containment set → objects shrinks, father slot (Phase 2 probe).
  - M1 canvas: connect a composition edge between two root objects, the child having its own reference
    edges → the child's edges are reaped (CV2 class).
  - M1 canvas: add child → same.
  - JjTL transformation whose output sets a containment reference to a forall-created object
    → the target leaves the roots and its outgoing edges are reaped.
  - Save → reopen → the moved object is drawn as a vertex only if the graph already persisted one.
  - Import Families.ecore → 8 edges Family↔Member (M2, not affected; no M1 code path).

Uncertain about propagation? → yes, on the canvas: questions 1 and 4 in §9.
```

## 8. Dependencies and risks

- §5.4 is the risk that Rule 3 names. Today a developer who draws a composition edge between two root objects on the M1 canvas keeps the child's other edges. After the fix those edges disappear on the next reconcile. This holds for every caller in §4 marked "yes", not only Jodie.
- The fix changes no exported interface and touches no §3.1 file. The consequences land in two §3.1 files (`useM1ReferenceEdges.ts`) and a `sync/` file (`m1EdgeSweep.ts`) through data, not code.
- §5.5 means the #168 consumer flow itself loses something. After the fix, Jodie cannot address an instance it nested in an earlier run by name. Today it can, through the stale entry.
- The probe simulated the fix with the very action of §6, issued from the page. The Phase 2 probe must re-measure CV2/FR through the real diff, with no simulation.
- The fixture measured one composition reference with no `lowerBound`, and one aggregation. A class composed by two references was not measured.

## 9. Questions

### Decisions taken (unattended, inside the lane perimeter)

- None applied. The diff form (question 5) and the aggregation scope (question 4) are inside the method and could be adopted as recommended. They are listed below because the GO carries them.

### Decisions awaiting Juri (RC-26: they change committed behaviour outside the edited method, or require a critical-zone edit)

1. **Canvas edges.** The fix makes `useM1ReferenceEdges` / `m1EdgeSweep` reap the outgoing edges of an object that a developer nests by canvas gesture (CL1/CL2 + CV2). There are four options:
   - (a) Phase 2 as approved, and accept the loss.
   - (b) Phase 2 as approved, with the merge gated on a critical-zone lane that makes `useM1ReferenceEdges.ts:131` (and its signature at `:69`) and `m1EdgeSweep.ts:81` take sources from the graph's object vertices.
   - (c) Widen R to those two files now (LIR §7 above, RC-30 go-ahead).
   - (d) Hold R.

   Recommended: (b), Phase 2 now, merge after the sync-sources lane.
2. **JjScript lookup.** After the fix, a later run cannot address a moved object by name (§5.5). Recommended: carry "resolve instances over the containment tree (`allSubObjects`), not `objects`" into J4's prompt. `jjscript/**` is excluded from R.
3. **Eviction.** Evicting a root-born child now leaves an orphan, as addObject children already do (§5.6). Recommended: ticket the eviction half (`_clearValueAtPosition` should put the evicted object back in `objects`, deduplicated) as its own lane. It is excluded from R ("altri metodi").
4. **Aggregation and shapeless.** Recommended: uniform, follow `info.isContainment` as the father write already does (A6). Ticket whether aggregation should re-father at all.
5. **Diff form.** Recommended: literal `'objects'` as in §6, not `getCollection`.
6. **Tickets to file at closure** (no decision needed; recorded so they are not lost):
   - Base `set_father` collection maintenance is dead and would use the wrong id (§5.2).
   - `irContainment.ts:78-79`'s claim that canvas objects keep `father = DModel` is stale for the composition-link gestures (H5).
   - React Flow keeps painting an edge whose D-edge was deleted by the reconcile (CV2, `noD:` edge).
