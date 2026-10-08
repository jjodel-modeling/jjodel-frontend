# Discovery — #174, one nesting has two forms in the store (Phase 1)

**Prompt-ID**: P-2026-10-07-0950 (chat C-2026-10-07-0948)
**Prompt file**: `docs/prompts/claude_2026-10-07_0950_prompt_174_nesting_forms.md`
**Session**: c61de79b-69f8-482a-8c83-935b3b4e8f8a
**Tree / HEAD**: `/Users/juridirocco/development/jjodel-174`, branch `fix/174-nesting-forms`, `e635f8723` ("docs(#174): lane prompt for the two nesting forms")
**Executor**: Anthropic Claude Opus 5.5
**Stato**: Phase 1, read-only on the code. No tracked file under `frontend/` modified (`git status --porcelain` empty at the end). Three probes, gitignored, not committed: `frontend/scripts/smoke/_tmp_174_measure.ts`, `_tmp_174_sweep.ts`, `_tmp_174_conf.ts`, each run with `node frontend/scripts/lane-run.mjs probe "$PWD" <probe> --port 3052 --id P-2026-10-07-0950`; logs in `~/.jjodel-lanes/P-2026-10-07-0950/probe-_tmp_174_*.log`. Final runs: measure 6/6 controls PASS, sweep 6/6, conf 6/6, zero page errors in all three, exit 0. The first run of `_tmp_174_measure.ts` died at the fixture (`LModel.node` undefined); fixed in the probe, not evidence.

This report is a set of hypotheses with evidence, not a definitive reference. A reader acting on it rereads the real files and, where a number matters, reruns the probes. MEAS = measured in this phase on `e635f8723` (vite :3052 of this tree, developer mode); READ = code reading only.

---

## 0. Answer in brief

- **The issue's two forms are reproduced, and there are three.** `set` form (father = slot, still in `model.objects`): JjScript `set`, canvas connect, canvas add-child, IR form picker, classic Properties / JjTL seeding (MEAS A1, A3-A6). `addObject` form (father = slot, not in `objects`): Configurator / Data Manager «Add», JjScript `create … in` (A2, A7). Third form: «New … & link» and the Configurator link on a composition leave a root listed by the slot (A8).
- **New, and it changes R's recommendation: the XMI importer writes the `set` form on purpose.** After an export/import round trip 8 of 8 nested children are in `model.objects` (A9), because `XMIService.ts:1074` pushes them there «for canvas materialisation via useJjomSync Step 2bis» (`:947`). So every project imported from XMI is in the `set` form, and five root readers already filter nested children out of `objects` (§5).
- **The canvas reads `objects` as «every instance to draw», and the two forms already disagree on it today.** The sweep reaps the outgoing reference edge of an «Add» child that has a vertex. The same edge from a `set`-form child survives (W1, control 1/1). The conformance validator visits a `set`-form or imported nested child and never an «Add» child (C1, C2).
- **Nothing normalises on load.** Save → reload left all 13 tracked elements exactly as they were (S1, control PASS). Eviction of an «Add» child still orphans it (U3: father DModel, not in `objects`). The core `.delete()` of a container leaves its children with a dangling father (D1). The composition-only plan leaves an element re-fathered by an aggregation dangling (D2).

**Recommendation.** Decision 1 = **(b)**: `model.objects` holds every instance of the model, and «root» is a filter on `father` (`LModel.roots`). The canvas sync layer then needs no edit (W1 is fixed by data). With (a), `useJjomSync.ts`, `m1EdgeGate.ts` and `XMIService.ts` would have to change, two of them in §3.1 and all three outside the lane's list. Decision 2: an aggregation does not re-father, and the cascade follows composition. Decision 3: a migration `2.229 -> 2.230` (§8). Eviction and #171 (b) as in §9. The Phase 2 plan has four steps (§10).

Decisions awaiting Juri (RC-26 items, detail in §13):
1. Critical-zone edits: `VersionFixer.tsx` (migration). (b) needs no §3.1 sync file.
   Recommended: GO with RC-30 on `VersionFixer.tsx` only.
2. The conformance visit perimeter (amends CRUD3 F2, ratified): every instance, or roots only. Its premise «4 of 5 nested never visited» is false for imported models (C2).
   Recommended: every instance; the Problems panel of «Add»-built models will show new violations.
3. #171 (b) deletes persisted data at a distance: deleting an M2 composition reference, or its class, will also delete the M1 children held in its slots (today they survive with a dangling father).
   Recommended: accept, the children are unreachable today.
4. The migration rewrites `objects` and `father` in every saved project that holds an «Add» child or an aggregation link.
   Recommended: accept, idempotent and a no-op on a coherent state.
5. Rule 19: Phase 2 touches 7 files plus docs (§10.5).
   Recommended: confirm the list; `permissionGuard.ts` is the one file outside the prompt's candidates.

RC-27, what would falsify (b): a reader that needs roots only, reads `model.objects`/`roots` without a father filter and is missing from §5; or a fresh canvas that still draws an imported project's nested children as nodes with the `XMIService.ts:1074` push removed.

---

## 1. Hypotheses under test

| # | Hypothesis (source) | Verdict | Evidence |
|---|---|---|---|
| H1 | The `set` form is produced by JjScript `set`, connect, add-child, IR picker, classic Properties, JjTL output (issue) | **holds** for the five measured; JjTL seeding is the same call as Properties (READ `ProjectEditor.tsx:2222`) | MEAS A1, A3, A4, A5, A6 |
| H2 | The `addObject` form is produced by «Add» and by `create … in` (issue, R-JS-9) | **holds** | MEAS A2, A7 |
| H3 | Only two forms exist (issue) | **falsified**: a third, a root listed by a composition slot (`appendValue`) | MEAS A8, D2 |
| H4 | «The readers already document the invariant `objects` = roots only» (R §5.3, issue) | **partly**: three readers say it; the XMI importer writes the opposite on purpose, and five readers defend against nested entries in `objects` | MEAS A9; READ §5 |
| H5 | A child outside `objects` loses its outgoing edges at the reconcile (R CV2) | **holds for the sweep, today, on the «Add» form** (no core change needed to see it) | MEAS W1 (sweep probe, control PASS) |
| H6 | Conformance visits `model.objects`; nested children are not visited (CRUD3 F2 premise) | **partly**: «Add» children not visited; `set`-form and imported nested children are visited | MEAS C1, C2 |
| H7 | `findInstanceByName` already reads roots and containment slots, once each (R-JS-10) | **holds** (the issue's «name lookup» consumer is closed) | READ `instance.ts:130-141`; #175 MEAS D0-D2 |
| H8 | Eviction orphans an «Add» child; a root-born child stays coherent (issue) | **holds** | MEAS U3 (`u3mid`), E1 |
| H9 | Saved projects contain both forms and nothing normalises them on load (issue, decision 3) | **holds** | MEAS S1 (0 diffs over 13 elements) |
| H10 | A slot → slot move of a root-born child keeps the stale `objects` entry (R A4b) | **holds**; a slot-born child moves cleanly | MEAS M1, M2 |
| H11 | R-JS-12 refuses `-=` of a slot-born child (`WOULD_ORPHAN`) and returns a root-born one to the root | **holds** | MEAS E3 |
| H12 | Core `.delete()` of a container does not cascade into containment slots (#171 b) | **holds**: children survive with an unresolved father | MEAS D1 |
| H13 | Aggregation re-fathers; the cascade (composition only) then leaves that element dangling (#171 ticket, «non misurato») | **holds, now measured** | MEAS G1, D2 |

## 2. Files read

- In full: `CLAUDE.md`, `docs/PROTOCOL.md`, `frontend/src/model/CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `frontend/src/redux/CLAUDE.md`, `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`, `docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md`, `frontend/scripts/smoke/_tmp_175_measure.ts` (main tree, read only).
- By window: `docs/decisions.md` 187-260 (RC-25..31) and 5690-5781 (R-JS-9..15); `docs/claude-code-log.md` 1-145 (the 10 latest entries); `docs/log-inbox/jodie-consumer.md` 55-106 and 248-253; `docs/log-inbox/jjscript-delete-cascade.md` 1-40; `docs/log-inbox/jjscript-m1-operators.md` 1-24; `docs/discovery/discovery_2026-09-01_crud3_edition_dangling.md` 300-530; `frontend/scripts/smoke/README-probes.md` 60-110, 200-357; `/Users/juridirocco/development/jjodel/frontend/scripts/smoke/_tmp_171_verify.ts` 1-80; issues #174 and #171 with comments (`gh issue view`).
- CRUD3 is not in `docs/decisions.md`: `command grep -c "CRUD3" docs/decisions.md` → 0, exit 1; positive control `command grep -c "RC-26"` → 11, exit 0. The F2 ratification is in the CRUD3 report appendix (`:360` «Decisione ratificata: **«vederli», non «visitarli»**.») and in the archived log.
- Code (windows): `frontend/src/model/logicWrapper/LModelElement.tsx` 255-285, 740-785, 4087-4089, 4202, 4270-4271, 5322-5336, 5690-5875, 5895-5900, 6040-6110, 6122-6270, 6490-6765, 6825-7135, 7250-7465, 7780-8100; `frontend/src/joiner/classes.ts` 625-645, 765-800, 1480-1520, 2232-2275; `frontend/src/common/Dummy.ts` 1-290; `frontend/src/redux/reducer/reducer.ts` 268-340; `frontend/src/redux/action/action.ts` 660-710; `frontend/src/redux/VersionFixer.tsx` 1055-1075, 1135-1165, 1199-1260; `frontend/src/components/topbar/SaveManager.ts` 20-80; `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` 1-200; `frontend/src/components/editor-v2/sync/m1EdgeSweep.ts` 1-140; `frontend/src/components/editor-v2/hooks/useJjomSync.ts` 300-320, 630-800, 995-1060; `frontend/src/components/editor-v2/sync/canvasToJjom.ts` 397-470, 540-666, 1440-1720; `frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts` 130-360; `frontend/src/components/editor-v2/hooks/createAdapter.ts` 280-560; `frontend/src/components/editor-v2/hooks/deleteDraw.ts` 1-100; `frontend/src/components/editor-v2/hooks/deleteAdapter.ts` 139-240; `frontend/src/components/editor-v2/hooks/writeCtxLproxy.ts` 50-80; `frontend/src/jjscript/executor/commands/instance.ts` 330-372; `frontend/src/jjscript/executor/permissionGuard.ts` (grep); `frontend/src/services/export/XMIService.ts` 176-200, 393-440, 780-800, 940-955, 1055-1085; `frontend/src/services/export/JsonModelService.ts` 358-392; `frontend/src/api/data.ts` 580-620; `frontend/src/model/conformance/ConformanceValidator.ts` 28-40, 552-570; `frontend/src/model/conformance/ConformanceGuard.ts` 196-214; `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` 2866-2880, 3080-3100; `frontend/src/components/abstract/tabs/instanceManagerModel.ts` 44-56; `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` 76-92, 205-222; `useIRContainment.ts` 86-100; `IRNodeContent.tsx` 408-440; `frontend/src/jjtl/executor/jjodelConverter.ts` 62-140; `frontend/src/components/Jodie/ConsumerProposal.tsx` 70-90; `consumerProposalModel.ts` 20-30, 60-66, 145-160, 312-325; `frontend/src/components/project/ProjectEditor.tsx` 1950-1975, 2985-2993; `frontend/src/redux/__tests__/versionfixer_2229_migration.test.ts` 1-30.

## 3. Fixture and probes

Metamodel `MM174`, package `default`: `Scenario`, `Phase`, `Person`. References, plain ones first (the #171 fixture quirk): `Scenario.lead → Person *` (plain), `Phase.mentor → Person 0..1` (plain), `Scenario.team → Person *` (aggregation), `Scenario.pathway → Phase *` (composition), `Scenario.main → Phase 0..1` (composition). M1 model `m174`, roots `S1..S4`, `P1..P3` and Phase roots per arm. The model graph is made as `useJjomSync` Step 1 makes it (`DGraph.new` bare, then a creator-free TRANSACTION tagging `v2-flow` and adding it to `graphs`), so `createAdapter.syncChildToFlow` finds it as the Configurator would (F3 PASS). Every arm goes through the public function the gesture calls: `JjScriptService.execute`, `canvasToJjom.syncCreateObject` / `syncCreateCompositionLink` / `syncDeleteReferenceById`, `formWrite.setValue` / `clearValue` / `appendValue`, `createAdapter.createInstance`, `XMIService.exportToXML` + `importM1FromFile`, `SaveManager.save`, `UndoAction.new(1, user, false).commit()` (the Navbar Ctrl+Z path, `Navbar.tsx:1214`), `LObject.delete()`, `validateConformance`. The page reads the store through `windoww.store`; `place(name)` returns father class and slot, raw `objects` membership, `LModel.objects`, `allSubObjects`, and every slot that lists the element.

## 4. Measurements (MEAS on `e635f8723`)

### 4.1 Creators

| arm | gesture (public function) | father | in `objects` | listed by |
|---|---|---|---|---|
| A1 | JjScript `set S1.pathway = k1` (k1 a root) | `S1.pathway` | **yes** | `S1.pathway` |
| A2 | JjScript `create instance of Phase "k2" in S1.pathway` | `S1.pathway` | no | `S1.pathway` |
| A3 | canvas connect, `syncCreateCompositionLink(S1, k3c)` | `S1.pathway` | **yes** | `S1.pathway` |
| A4 | canvas add-child, `syncCreateObject` then link (k4pre: father DModel, in objects) | `S1.pathway` | **yes** | `S1.pathway` |
| A5 | IR form single picker, `formWrite.setValue(S1, 'main', 0, k5)` | `S1.main` | **yes** | `S1.main` |
| A6 | classic Properties / JjTL seeding, `$pathway.setValueAtPosition(0, k6, {isPtr:true})` | `S2.pathway` | **yes** | `S2.pathway` |
| A7 | Data Manager / Configurator «Add», `createInstance(m, 'Phase', S1, 'pathway')` | `S1.pathway` | no | `S1.pathway`; vertex created by `syncChildToFlow` |
| A8 | «New … & link», `createInstance` at root then `appendValue(S1, 'pathway', k8)` | **DModel** | yes | `S1.pathway` |
| A9 | XMI round trip, `exportToXML(m174)` → `importM1FromFile` | — | — | imported model: 18 `objects`, 10 roots, **8 nested, 8 of them in `objects`** |

In every arm `allSubObjects` lists the element; `LModel.objects` agrees with the raw collection. A9's `xmlHasK7: false` says only that instance names are not serialised for a class with no `name` attribute: the 8 nested count is the measurement.

READ, the import writer: `XMIService.ts:1067` `const child: DObject = DObject.new(childClass.id, containmentDValue.id, DValue, undefined, true);` and `:1074` `(ctx.dModel.objects as Pointer<DObject>[]).push(child.id);`, documented at `:947` «`dModel.objects.push(child.id)` — for canvas materialisation via useJjomSync Step 2bis». The export side, `:183-187`: «RT8: model.objects contiene TUTTI gli oggetti (anche i figli containment, registrati lì per la materializzazione canvas). Esportare solo le RADICI…».

READ, the `addObject` writer: `joiner/classes.ts:786-792` `if (this.fatherType!.cname === "DModel") { this.setExternalPtr(thiss.father, "objects", "+="); } else { // object containing object is not in any direct child collection. access through values` / `this.setExternalPtr(thiss.father, "values", "+=");`.

READ, the `set` writer: `LModelElement.tsx:7915-7929`, unchanged since R §5.1 (`oldContainer` / `outactions.set.push(()=> { SetFieldAction.new(val as Pointer<DObject>, "father", c.data.id, undefined, true) })`, nothing on `objects`).

READ, the third writer: `formWrite.ts:268` `SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr);` (raw append, no re-father), called by `InstanceManagerTab.tsx:2319` and `ConfiguratorTab.tsx:315`.

### 4.2 Eviction, aggregation, slot → slot

- E1, `formWrite.clearValue(S1.pathway, k1)` on a `set`-form child: father DModel, in `objects`, listed by none. Coherent root.
- U3 (`u3mid`), the same on an «Add» child `u2`: **father DModel, not in `objects`**: the orphan of the issue. `allSubObjects` still lists it (`_getallSub` scans the lookup, `LModelElement.tsx:5851-5873`), `objects` does not.
- E3, JjScript `set S2.pathway -= k6` (set form): «Removed», k6 back to a coherent root. `set S3.pathway -= k2` (slot-born): `WOULD_ORPHAN`, k2 stays in the slot (R-JS-12).
- G1, JjScript `set S1.team = P1` (aggregation): father `S1.team`, still in `objects`. G2, `formWrite.appendValue(S2, 'team', P2)`: father DModel (no re-father).
- M1, `set S3.pathway = k4` (k4 root-born, nested in S1 by the canvas): father `S3.pathway`, **still in `objects`**, S1 no longer lists it. M2, `set S3.pathway = k2` (slot-born): father `S3.pathway`, not in `objects`. The stale entry travels with the element; it is never created by a move.

### 4.3 Ctrl+Z (`U.userHasInteracted = true`, `statehistory.all.undoable.length`)

- U1, JjScript `set S4.pathway = u1`: history 0 → 1 → 0; after one undo u1 is father DModel, in `objects`. Coherent (R A8 confirmed).
- U3, «Add» u2, then `clearValue` of u2, then one undo: history 0 → 1 → 2 → 1; u2 back in `S4.pathway` with father the slot. Coherent.
- U4, canvas connect `S4 → u4`: history **1 → 1** (no new entry), one undo → 0, and u4 ends **father `S4.pathway`, not listed by it**, still in `objects`. Cause not identified (the connect may have merged into an earlier entry; vertices were created 900 ms before). Persisted as is by S1. Ticket, §12.

### 4.4 Save → reload

S0 control PASS: a window marker set before the save is gone after the reload, and `m174` is back with its id. S1: the 13 tracked elements (`k1..k8`, `P1`, `P2`, `u1`, `u2`, `u4`) have **identical** places before the save and after the reload: `diffs: []`. Every form, the orphan-capable «Add» form, the third form, the aggregation re-father and the U4 incoherence persist. READ: the only migration that touches `objects` is `2.226 -> 2.227` FASE B, a dedup (`VersionFixer.tsx:1150-1151`); the latest step is `2.228 -> 2.229` (`:1237`).

### 4.5 Delete

- D1, `S3.delete()` (L proxy, the tree / context-menu / canvas path), S3.pathway holding k4 (set form) and k2 (slot-born): k4 survives with `father: UNRESOLVED(…USER_28)`, still in `objects`; k2 survives dangling, not in `objects` (L1 `dangling: ["P1","k2","k4"]`). `allSubObjects` drops both (its `l.model` walk fails).
- D2, JjScript `delete instance S1` (the `deletePlan` of `deleteAdapter`, composition only): «Deleted instance 'S1' and 4 contained elements»; k3c, k5, k7 **and k8** (the third form, father DModel) are gone; **P1, re-fathered by the aggregation `team`, survives with an unresolved father**, still in `objects`, still listed by `k4.mentor`.

### 4.6 Canvas sweep (W1)

- First attempt (`_tmp_174_measure.ts`): trigger `syncDeleteVertex` of an unrelated object vertex; no edge moved. **Void**: that gesture never runs the sweep. READ `canvasToJjom.ts:462` (DClass branch) `setTimeout(() => { sweepAllM1ReferenceGraphs(); }, 60);` and the DObject branch `:463-470` «No deferred sweep here».
- Second probe (`_tmp_174_sweep.ts`), trigger `syncDeleteReferenceById(spare)` (`:560`), three edges: `k3c→P1` (set form, mentor set), `k7→P2` (k7 «Add», vertex from `syncChildToFlow`, mentor set), and the control `S1→P3` with no slot behind it. Before `[1,1,1]`, after **`[1,0,0]`**. W0 control PASS (the unbacked edge was taken). **The backed edge of the «Add» child was reaped**; the `set`-form child's survived.
- READ cause, `m1EdgeSweep.ts:81` `for (const objId of (rawModel.objects ?? [])) {`: the live pairs are built from `objects` only. `useM1ReferenceEdges.ts:131` is the same loop for the mounted reconcile (R CV2).

### 4.7 Conformance perimeter

`Phase.title : EString [1..1]` left empty everywhere: a visited Phase yields one `missing_required_attr`, an unvisited one none.
- C1 (`m174`): cRoot (root) reported (control C0 PASS), **cSet (set form) reported, cAdd («Add» form) not reported**; total 9 = the 8 Phase roots + cSet.
- C2, the same model after an XMI round trip: total 9 over the 9 imported Phases (8 roots + 1 nested), so the imported nested Phase is visited. The probe's `phasesImported` list mixes in m174's elements (a filter defect) and is not used.
- READ `ConformanceValidator.ts:35` `const objects: LObject[] = model.objects || [];` and `:565` «The VISIT perimeter is unchanged and stays `model.objects` (ratified, CRUD3 F2)».

## 5. Census of the root readers

Searches (P12, §5 of CLAUDE.md): `command grep -rn -E "\.objects\b|\[['\"]objects['\"]\]|'objects'" --include='*.ts' --include='*.tsx' .` under `frontend/src` → exit 0, 172 lines, 117 outside tests; `command grep -rn -E "\.roots\b|\.crossRoots\b|\.root\b"` → exit 0, 26 lines (all but `LModelElement.tsx:5212` and `jjtl/executor/executor.ts:1318` are DOM, AST or simulator roots). Positive control on the same tool: `command grep -rn -c setValueAtPosition` → 21 files. `DState.objects` (`useIRContainment.ts:94`, `selectors.ts:109`) is the project-wide list, not the model's, and is out of the census. Examples (`examples/**`) are fixtures and are out of it too.

Classes: **(R)** wants roots only; **(T)** wants every instance and today reads `objects`; **(D)** would visit an element twice in the double state. «(a)» / «(b)»: what changes under each option.

| reader | quote | class | under (a) | under (b) |
|---|---|---|---|---|
| `useJjomSync.ts:743` Step 2bis | `for (const objId of (rawModel.objects ?? [])) {` → `DVertex.new` | T | nested never get a vertex; imports lose their nested nodes unless rewritten to walk the tree (§3.1) | every instance gets a vertex at mount; «Add» children gain nodes |
| `useJjomSync.ts:1016` Step 4, `:644/:651` gate inputs, `:314` `modelObjectCount` | `objects: rawModel.objects ?? []` | T | rewrite as tree walk | unchanged code, complete data |
| `m1EdgeGate.ts:62`, `:110` | `for (const objId of objects)` | T | rewrite | unchanged |
| `useM1ReferenceEdges.ts:69`, `:131` | `for (const objId of (rawModel.objects ?? [])) {` | T | rewrite (R's plan) | unchanged; W1 fixed by data |
| `m1EdgeSweep.ts:81` | same loop | T | rewrite | unchanged |
| `ConformanceValidator.ts:35` | `const objects: LObject[] = model.objects || [];` | R by ratification, T by its job | imported / set nested stop being visited | «Add» nested start being visited (decision 1b) |
| `ConformanceGuard.ts:200`, `:210` | fallback linear scan after `fromPointer` | T (fallback only) | fallback misses nested | fallback complete |
| `TreeViewContent.tsx:3086-3089` | `const objects: LObject[] = m1.objects || [];` / `objectCount = objects.length;` / `buildInstanceForest(objects, m1.id)` | R, defended (`contained`, comment `:2871-2876`) | count = roots | count = every instance; forest unchanged |
| `XMIService.ts:187` export | RT8 filter on `contained` | R, defended | unchanged | unchanged |
| `JsonModelService.ts:363-376` export | `if (metaFeature.composition || metaFeature.containment) contained.add(target.id);` | R, defended | unchanged | unchanged |
| `LModelElement.tsx:5212` Ecore export | `for (let obj of c.proxyObject.roots) { if (!obj.isRoot) continue;` | R, defended | unchanged | unchanged |
| `instance.ts:141` `findInstanceByName` (R-JS-10) | `const queue: any[] = [...((model as any)?.objects ?? [])];` then slots, each once | T, dedup | unchanged | unchanged |
| `instance.ts:359` `isListedAtRoot` (R-JS-12) | `const objects: any[] = (model as any).__raw?.objects ?? [];` | R | unchanged | true for every nested child: `WOULD_ORPHAN` unreachable |
| `LModelElement.tsx:5758-5763` `roots` / `root` | `return this.get_objects(context, includeCross);//.filter( o => o.isRoot);` | R | already roots | needs the commented filter back |
| `LModelElement.tsx:5899` `LModel.values` | `context.proxyObject.objects.flatMap(o => o.features);` | T | roots only | every instance |
| `LModelElement.tsx:5330` `$name` lookup | `directSubObjects` from `c.data.objects`, then `allSubObjects` | priority hint | unchanged | the «direct child» preference widens |
| `jjtl/executor/jjodelConverter.ts:68` | `const objects = model.objects || model.allObjects || [];`, no recursion (`:83-100`) | T | nested invisible to that `forall` | complete (the main JjTL path, `ProjectEditor.tsx:1438`, already reads `allSubObjects`) |
| `ProjectEditor.tsx:1955`, `:1972` | JjTL targets found by name among `lModel.objects` | R (targets are created at root) | unchanged | wider search, same names |
| `ConsumerProposal.tsx:80` | `const roots = new Set<string>(Array.isArray(model.objects) ? model.objects : []);` | R (stale since R-JS-10) | unchanged | every element «root», which is what R-JS-10 does |
| `IRNodeContent.tsx:434` singleton select | candidates from `lookup[modelId]?.objects` | R (singletons are roots) | unchanged | unchanged in practice |
| counts: `StatusBar.tsx:174`, `Info.tsx:1384`, `runFigures.ts:100`, `show.ts:170`, `polymetricMetrics.ts:47/106`, `ProjectEditor.tsx:2989` | `objects.length` | T | roots | every instance |
| `Dummy.ts:108-116` delete safety net | `const fatherField = dDeleted.className === 'DObject' ? 'objects'` on `dDeleted.father` | R (assumes father = model) | unchanged | a nested child's father is a slot: needs the model (§9) |
| writers: `classes.ts:786-792`, `XMIService.ts:1074`, `api/data.ts:615`, `LModelElement.tsx:7041` (t2m), `:7383` (addObject) | see §4.1 | — | XMI push removed, set branch `-=`, eviction `+=` | addObject / t2m `+=`, eviction guarded `+=`, `api/data.ts` ticket |

Comments that state the root-only invariant and would go stale under (b): `TreeViewContent.tsx:2871`, `ConformanceValidator.ts:556`, `instanceManagerModel.ts:50`, `createAdapter.ts:376-378` and `:545`, `irContainment.ts:78-83` and `:212-214`, `IRNodeContent.tsx:412`, `consumerProposalModel.ts:26` and `:63`, `outlineDraw.ts:19`. Under (a) the stale ones are `XMIService.ts:183-186`, `:789-790`, `:947`.

## 6. Decision 1, (a) against (b)

| | (a) the child leaves `objects` | (b) every instance in `objects` |
|---|---|---|
| core writes | set branch `objects -=` (R §6), eviction guarded `+=` | `addObject` / `t2m` `objects +=`, eviction guarded `+=` |
| other writers | `XMIService.ts:1074` push removed (outside the list) | none required; `api/data.ts:615` parseDObject ticketed |
| sync layer | `useJjomSync.ts` (Step 2bis, Step 4, gate inputs, `modelObjectCount`), `m1EdgeGate.ts`, `useM1ReferenceEdges.ts`, `m1EdgeSweep.ts`: 4 files, 2 in §3.1, 2 outside the list | none |
| §3.1 files | `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx` | `VersionFixer.tsx` |
| exported interfaces | none change type | none change type; `LModel.objects` / `roots` change meaning |
| readers that change behaviour | every (T) row of §5 | (R) rows not defended: `roots`, conformance (by decision), counts, `ConsumerProposal` |
| Ctrl+Z | set gains `objects -=` in its TRANSACTION (to measure) | set unchanged; `addObject` gains `+=` in its own TRANSACTION (U3 shows that entry undoes) |
| saved projects | every XMI-imported / set-form project: nested leave `objects` | every «Add» / `create … in` project: nested join `objects` |
| canvas after the complete plan | every instance a node, only if Step 2bis walks the tree; otherwise new imports lose their nested nodes (READ, rule 3) | every instance a node (READ: Step 2bis over complete `objects`) |
| invariant | matches TreeView / Conformance / instanceManagerModel comments and R | matches the importer and RT8; the root-only comments are amended |
| CRUD3 F2 | imported nested stop being visited | «Add» nested start being visited (or an `isRoot` filter, decision 1b) |

**Recommendation: (b).** The measurement R did not have (A9) moves the balance. The import and the `set` gestures already put nested children in `objects`, the canvas depends on it to draw them (Step 2bis), and five readers already filter roots. Under (a) the canvas sync layer has to be rewritten to keep imported projects as they are. Under (b) that layer stays untouched and the «Add» edge loss of W1 disappears. R's §6 diff is not applied under (b).

## 7. Decision 2, aggregation

- Writers of `aggregation`, by `command grep -rn -E "aggregation\s*=|'aggregation'|\"aggregation\"|aggregation:"` over `jjscript services api components/editor-v2/sync model/logicWrapper` (exit 0; the hits in `services/` are the positive control for the `jjscript/` silence): the M2 canvas edge kind (`canvasToJjom.ts:359-360` `SetFieldAction.new(refId as any, 'aggregation' as any, true, undefined, false);` and `:1066-1067` `lRef.aggregation = true;`), `LReference.set_aggregation` (`LModelElement.tsx:4276`), the constructor default (`classes.ts:768` `thiss.aggregation = false;`). No writer in the JjScript executor and none in the Ecore/XMI importers.
- Ecore: EMF has `containment` true/false only. A non-containment reference never moves its target, and «shared aggregation» is a UML notion with no ownership. The core says the same: `LModelElement.tsx:4003` `aggregation: boolean = false; // exist in uml but not in ecore`.
- Readers that include aggregation in «containment»: `LReference.get_containment` `:4202` `return context.data.composition || context.data.aggregation;` and through it every `.containment` reader (about 30 rows in `command grep -rn -E "\.containment\b|isContainment\b|get_containment|\.aggregation\b"`, 161 lines: PalettePanel, shapeAdapter, EditorV2 edge type, compositionCompat, irInteraction, FormAuthoringBody, consumerProposalModel, Info.tsx, show/list/validate, permissionGuard). Also `LValue.get_containment` `:7448-7451` (shapeless → true), the eviction derivation `:7850`, the set derivation `:7894`, and `permissionGuard.ts:245` `(feature.composition || feature.aggregation)`.
- Readers that exclude it: `deleteDraw.ts:82` `if (!feature || feature.composition !== true) continue;`, `createAdapter.ts:288-318` (the CRUD2 §2.5 diversion: «Only the aggregation branch evicts, so only the aggregation branch is diverted», writes with `{ isContainment: false }`), `useEditorMode.ts:421` (`containment: !!(ref.composition)`), the XMI and JSON exports (`composition || containment`).
- Measured consequence: G1 re-fathers P1 into `S1.team`; D2 leaves P1 with an unresolved father after the container's delete.

**Recommendation: an aggregation does not re-father, and the cascade follows composition (plus shapeless).** The change is in the write path only. `LValue.get_containment` becomes `iof ? !!iof.composition : true`, and the two derivations at `:7850` and `:7894` read `.composition`. `LReference.get_containment` stays as it is for its display readers, and its double meaning is ticketed. `permissionGuard.containedTypes` is aligned with `descendantsOf` (outside the candidate list, decision 5 of §0). Existing aggregation re-fathers are undone by the migration (§8).

## 8. Decision 3, saved projects

Measured S1: nothing normalises on load, so a saved project keeps every form until something rewrites it. Under (b) a migration is needed. Without one, the «Add» children of every saved Configurator project stay outside `objects`: no vertex, outgoing edges reaped (W1), not visited, orphaned on eviction.

`private ['2.229 -> 2.230'](s: DState): DState`, pure on `s.idlookup` (the `2.228 -> 2.229` style):
1. For every `DObject` `o`, resolve its model by walking `father` (DObject → DValue → DObject … → DModel, depth cap 64, as `instanceManagerModel.modelIdOfObject` does). If the walk does not end at a `DModel`, count `o` as dangling and leave it untouched.
2. If `o.father` is a `DValue` whose `instanceof` is a `DReference` with `aggregation === true` and `composition !== true`, set `o.father` to the model id (decision 2). The slot keeps listing `o`.
3. If the model's `objects` does not hold `o.id`, push it, and add to `o.pointedBy` the entry the reducer writes for an `objects '+='` (the format is read from `PointedBy.add` in Phase 2, not invented here).
4. Dedup every `DModel.objects`, keeping the first entry (as FASE B of 2.227).
- Idempotent: a second run finds every resolved object listed and no aggregation-held father. On a state already coherent under (b) it changes nothing. A metamodel (`isMetamodel`) holds no `DObject` and is skipped.
- On the probe's saved project: it would list k2 and k7 and re-father P1. It would leave u4, father a slot that does not list it, still in `objects`, and the dangling k4, k2, P1 of D1/D2 untouched (ticket).
- Current version: `2.229` (the last step is `VersionFixer.tsx:1237`); `highestVersion` is computed from the method names (`redux/CLAUDE.md` §3.9).

## 9. Eviction and #171 (b)

**Eviction.** Under (b), `_clearValueAtPosition` (`LModelElement.tsx:7855-7857`) keeps its father write. After it, it appends `oldVal` to the model's `objects` only when the store read before the TRANSACTION does not list it. On migrated data the guard never fires; it covers the writers left outside (`api/data.ts:615`). Effect on R-JS-12: `isListedAtRoot` (`instance.ts:354-361`) is true for every nested child, so `WOULD_ORPHAN` is never returned, and `-=` of a slot-born child brings it back to the root, as R-JS-12 already does for a root-born one. `instance.ts` is not edited (rule 9); R-JS-12 (provisional) is amended in text.

**#171 (b).** `LValue` gets a `get_children_idlist`: the base list, plus the `DObject` values of a composition slot (slot-based, as `descendantsOf`, so the third form k8 goes with its container in both paths, D2), plus the values of a shapeless slot whose father is the slot. Then `Dummy.ts:84` `for (let child of lDeleted.children) { child?.delete();` reaches them. The `Dummy.ts:108-116` safety net also removes a nested child from its model's `objects` (its father is a slot).

Callers of `.delete()` on objects, slots and models (`command grep -rn "\.delete()"`), and what each sees after:
- Canvas «Delete» of an M1 node, `canvasToJjom.ts:475`: children deleted too, their vertices with them (`Dummy.ts:277` `lDeleted.nodes`). Today they survive dangling (D1).
- Tree / classic context menu `ContextMenu.tsx:689`, `UX.tsx:119`: same.
- Configurator / Data Manager / JjScript through the plan (`deleteAdapter.runDeletes` → `writeCtxLproxy.ts:68`, deepest first, `instance.ts:737`): the children are deleted by the plan **and** by the container's cascade inside the same tick. `deleteInstance` guards on the store at call time (`writeCtxLproxy.ts:64`), which the deferred dispatch has not updated yet. Risk of a double `DeleteElementAction`, to measure in Phase 2. If it errors, the fix is in `deleteAdapter.ts` (outside the list).
- M2 co-evolution: deleting a composition reference (`canvasToJjom.ts:527` `lRef.delete()`) deletes its M1 slots (`Dummy.ts:259` `lObj.delete()`, case `instanceof`). With the new children, it deletes the M1 instances held there too. Today they survive with a dangling father. Same for the class that owns the reference. This is deletion of persisted data (§0, decision 3).
- Model delete, `ProjectEditor.tsx:1182`: `LModel` children are already `allSubObjects` (`:5699`), so nested children are reached twice. Same risk as above, to measure.
- `_removeConformity` (`:6727`): mirage slots hold nothing, no effect.
- Ctrl+Z: the children's deletes run inside the container's TRANSACTION, so one undo is expected to restore all. To measure.

## 10. Phase 2 plan (under (b), decision 2 as recommended)

The order keeps every intermediate commit no worse than today: readers first, then the writes, then the data.

**Step 1 — roots are a filter.** `LModelElement.tsx` `get_roots`/`get_root`: `objects` filtered on `father === model` (the commented `.filter( o => o.isRoot)` at `:5759`). `ConformanceValidator.ts`: under decision 1b «every instance» only the `:556`/`:565` comments change; under «roots» the visit gets the same filter. Probe: C1/C2 re-run; `roots` of m174 after A1 no longer lists k1. Gates as below. Visual checklist: (1) the tree of an imported Families model shows the same forest; (2) Ecore export of a model with a nested child is byte-identical to before.

**Step 2 — the writes.** `LModelElement.tsx`: `get_addObject` and `t2m` add `SetFieldAction.new(modelId, 'objects', dobj.id, '+=', true)` after `DObject.new3` for a `DValue` father, inside the TRANSACTION they already open (no new outer TRANSACTION, rule 12). `_clearValueAtPosition` gets the guarded `+=`. `LValue.get_containment` and the `:7850`/`:7894` derivations follow decision 2. Not testable in the node bench (`LModelElement.tsx` imports the `joiner` barrel and monaco), so the verification is the probe, and the gap is declared in the entry. Probe: A2/A7 in `objects`; U3 eviction coherent; G1 father stays DModel; W1 `[1,1,0]`; U-arms history as Phase 1. Checklist: (3) developer canvas, «Add» in the Data Manager, then open the canvas: the child is a node with its composition edge and its own reference edges; (4) JjScript `create … in` then open the canvas: a node; (5) Configurator Add / remove / Ctrl+Z.

Text diff, not applied (`get_addObject`, after `:7383`):
```diff
                 let dobj = DObject.new3(constructorPointers, () => { }, isDModel?DModel:DValue, true);
+                // Every instance is listed by its model, the nested ones too (#174 decision 1 (b)):
+                // the canvas and the importer read `objects` as «every instance» (XMIService.ts:1074).
+                if (!isDModel && isContainment) SetFieldAction.new(this.get_model(c).id, 'objects', dobj.id, '+=', true);
```
`_clearValueAtPosition`, after `:7856`:
```diff
             SetFieldAction.new(oldVal as Pointer<DObject>, "father", context.proxyObject.model.id, undefined, true);
+            const modelId = context.proxyObject.model.id;
+            if (!((store.getState().idlookup as any)[modelId]?.objects ?? []).includes(oldVal))
+                SetFieldAction.new(modelId, 'objects', oldVal as Pointer<DObject>, '+=', true);
```
`LValue.get_containment` (`:7448-7451`):
```diff
-        return this.get_fromlfeature(iof as LReference, "containment"); }
+        return !!(iof as LReference).composition; } // an aggregation does not own (#174 decision 2)
```
and `:7850` / `:7894` read `(info.instanceof as LReference).composition`.

**Step 3 — the cascade (#171 b).** `LModelElement.tsx` `LValue.get_children_idlist`; `Dummy.ts` safety net for a nested child. Probe: D1 → children deleted, no dangling, `objects` clean; D2 → no dangling, and no double-delete error (console and page errors); M2 composition reference delete → M1 children gone; model delete; one Ctrl+Z after D1 restores all. Checklist: (6) canvas Delete of a container node takes its children's nodes and edges; (7) Data Manager Delete of a container; (8) M2 delete of a composition reference with populated M1 slots.

Text diff (new override in `LValue`):
```diff
+    protected get_children_idlist(context: Context): Pointer<DAnnotation | DObject, 1, 'N'> {
+        // The elements a composition slot owns are its children, so `.delete()` cascades into them
+        // (Dummy.ts:84) for every caller, canvas included (#171 b, #174).
+        const iof = context.proxyObject.instanceof as LReference | undefined;
+        const owned = (context.data.values as any[]).filter((v: any) => typeof v === 'string' && Pointers.isPointer(v)
+            && (iof ? !!iof.composition : (D.fromPointer(v) as any)?.father === context.data.id)
+            && (D.fromPointer(v) as any)?.className === DObject.cname);
+        return [...super.get_children_idlist(context) as any, ...owned];
+    }
```

**Step 4 — the migration** (critical zone, LIR first in `docs/lir/lir_2026-10-07_174_migration.md`). `VersionFixer.tsx` `2.229 -> 2.230` as in §8. Test: `frontend/src/redux/__tests__/versionfixer_2230_migration.test.ts` on the real class with the barrel mocked as `versionfixer_2229_migration.test.ts` does. Cases: «Add» child listed, orphan listed, aggregation re-fathered, dangling untouched, dedup, idempotence, coherent state unchanged. Mutation bench: each of steps 1-4 removed in turn. Probe: a project saved on the Phase 1 forms is re-saved with version `2.229` written into its localStorage copy, then reloaded; expected k2 and k7 listed and P1 fathered to the model. Checklist: (9) open a project saved before the lane: same tree, nested children become nodes on the canvas; (10) Families.xmi import: 8 edges Family↔Member, nested members as before.

**Gates per step**: `npx tsc --noEmit` full output, 14 errors, the §17 set; `npm run build` exit 0; `npm run test` full, the 9 known import reds and no other; `npm run check:docs`. A commit per step `fix(#174): <step> (P-2026-10-07-0950)`.

**10.5 Files (rule 19, more than five).**
1. `frontend/src/model/logicWrapper/LModelElement.tsx`: roots filter, the writes, ownership, `LValue` children (steps 1-3).
2. `frontend/src/model/conformance/ConformanceValidator.ts`: comments, or the filter under 1b «roots» (step 1).
3. `frontend/src/common/Dummy.ts`: the nested safety net (step 3).
4. `frontend/src/redux/VersionFixer.tsx`: `2.229 -> 2.230` (step 4, §3.1).
5. `frontend/src/redux/__tests__/versionfixer_2230_migration.test.ts`: new (step 4).
6. `frontend/src/jjscript/executor/permissionGuard.ts`: `containedTypes` follows composition (decision 2; **outside the prompt's candidates**).
7. `frontend/src/model/conformance/__tests__/ConformanceValidator.test.ts`: only under 1b «roots».
- Docs, separate commits: `docs/lir/lir_2026-10-07_174_*.md`, `docs/log-inbox/core-nesting-forms.md`, `docs/decisions.md` (the rows of the decisions, R-JS-12 amended), the Status line.
- Not touched under (b): `useM1ReferenceEdges.ts`, `m1EdgeSweep.ts`, `instance.ts` (candidates the plan does not need).

## 11. Layer Impact Report (CLAUDE.md §3.2, for the Phase 2 plan of §10)

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)
  [x] L-layer (computed proxies)
  [x] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   (by data, no code change)
  [ ] Canvas classic                           (DV.tsx reads allSubObjects; not measured)
  [x] Sync layer (useJjomSync hooks)           (by data, no code change)
  [x] Persistence (VersionFixer / jsxString)   (state migration, no jsxString)

D-layer
  - What changes: DModel.objects lists every instance of the model (addObject / t2m '+=',
    eviction guarded '+='); an aggregation write no longer moves `father`; a container delete
    cascades into its composition slots; migration 2.229 -> 2.230 rewrites objects / father.
  - What does NOT change: the set branch (already canonical), slot values, pointedBy semantics,
    the reducer, the constructor (joiner/classes.ts), the XMI importer.
  - Cross-layer: every reader of DModel.objects sees the nested instances (§5).
  - Side-effect safety: SetFieldAction only, inside TRANSACTIONs the core already opens; no
    creator wrapped in a new TRANSACTION (rule 12). Undo measured per step.
L-layer
  - What changes: LModel.roots / root filter on father; LValue.containment = composition (or
    shapeless); LValue.children include owned values.
  - What does NOT change: LReference.containment (composition || aggregation) for display
    readers; LModel.objects getter; allSubObjects; findInstanceByName.
JjOM
  - What changes: «root» is a property of father, «instance of the model» is membership of objects.
  - Cross-layer: conformance perimeter (decision 1b); counts rise for «Add»-built models.
Canvas v2-flow / Sync
  - What changes (no code change): Step 2bis gives a vertex to every nested instance at mount
    («Add» / create … in children gain nodes); Step 4, useM1ReferenceEdges and m1EdgeSweep see
    nested sources, so the outgoing edges of an «Add» child stop being reaped (W1).
  - What does NOT change: useJjomSync, useM1ReferenceEdges, m1EdgeSweep, canvasToJjom source.
  - Side-effect safety: imported projects already render this way (A9).
Persistence
  - 2.229 -> 2.230, idempotent, no-op on a coherent state; dangling fathers left untouched.

Smoke-test scenarios potentially affected:
  - import Families.ecore / an M1 XMI → 8 edges Family↔Member, nested members as nodes (unchanged)
  - Data Manager «Add» then canvas → node + composition edge + own reference edges (W1 fixed)
  - JjScript create … in, then canvas → a node (new)
  - open a project saved before → nested children listed, nodes on the canvas (migration)
  - save → reopen → identical state
  - container delete on canvas / Configurator / JjScript → no dangling father, no double delete
  - M2 delete of a composition reference → its M1 children deleted (new, decision 3 of §0)

Uncertain about propagation? → yes: the double delete of §9 and the U4 undo; measured in Phase 2.
```

## 12. Dependencies, risks, tickets

- Risk, step 3: double deletion between the plan and the new core cascade (§9). Mitigation, if measured: the plan stops deleting composition descendants itself (`deleteAdapter.ts`, outside the list).
- Risk, step 2: the `objects '+='` issued after `DObject.new3` inside the same TRANSACTION must land after the create action (pointedBy on an id not yet in the store). The precedent is `set_values` after `new3` at `:7390`; measured in the probe, not assumed.
- Risk, decision 1b: «every instance» puts new violations in the Problems panel of every «Add»-built model with unset required attributes (CRUD3 measured 100% of nested on its fixture). It may change what the MODELS demo shows (RC-26).
- Tickets to file at closure:
  - U4: one Ctrl+Z after a canvas connect leaves the child fathered to a slot that no longer lists it, and the connect added no history entry (§4.3). Cause not identified.
  - Third form: «New … & link» and the Configurator link on a composition keep the target a root that the slot lists, and the cascade deletes it with the container (A8, D2). `formWrite.appendValue` should go through `setValueAtPosition` on a composition.
  - `api/data.ts:612-616` `parseDObject` creates nested children outside `objects` (liveness of that import path not measured).
  - `LReference.get_containment` (composition || aggregation) keeps feeding about 30 display readers after decision 2: one word, two meanings.
  - Dangling fathers left by today's container deletes persist in saved projects; the migration leaves them (D1, D2).
  - `syncChildToFlow` created k7's vertex but no `S1→k7` composition edge in the first probe (A7 / W1 first run, `[…,0]`); VIEW1 measured both. Not investigated.
  - Stale comments of §5 (the root-only invariant), and `irContainment.ts:78-79` (R's H5).

## 13. Decisions

### Decisions taken (unattended)

- Probes run on :3052 through `lane-run probe`, with a local `createProjectAt` on `PROBE_URL` instead of `createProject` of `states.ts` (prompt DOVE).
- W1 re-run with a gesture that reaches the sweep and a planted stale edge as positive control, after the first trigger proved void (§4.6).
- The conformance perimeter measured with a required attribute as the visit sentinel (C0 control).
- Recommendation (b) over R's (a), recorded as a contradiction of R §0 / §9 (1) and of the issue's lean, per the prompt's HARD STOP clause: written here, not worked around.

### Decisions awaiting Juri (RC-26 list only)

1. Critical-zone edit of `VersionFixer.tsx` (step 4), with the Layer Impact Report of §11 and the RC-30 go-ahead. Recommended: GO.
2. Amendment of a ratified rule: the CRUD3 F2 visit perimeter (decision 1b). Recommended: every instance.
3. Deletion of persisted data: #171 (b) deletes the M1 children of a deleted M2 composition reference or class, and the container's children on every caller (§9). Recommended: accept.
4. Rewrite of persisted data by the migration (`objects`, aggregation `father`) in every saved project concerned (§8). Recommended: accept.
5. The file list of §10.5 (rule 19), with `permissionGuard.ts` outside the prompt's candidates. Recommended: confirm.

Decisions 1 (b), 2 (aggregation) and 3 (migration) of the issue are data-model choices. RC-27 asks a second agent to verify (b) before adoption. **What would falsify it:** a reader that needs roots only, reads `model.objects` or `roots` without a father filter and is missing from §5; or a fresh canvas that still draws an imported project's nested children as nodes once the `XMIService.ts:1074` push is removed, which would make (a) cheap.

---

## Addendum 2026-10-08: vertici fantasma

The chat's visual check (C-2026-10-07-0948, 2026-10-08) failed items 6 and 11: after a delete, the v2-flow
vertices of the deleted elements stay in the store («ghost»: a `DVertex` whose `model` no longer exists) and some
stay painted. The rework prompt (input-7 of the lane folder) asks four questions before the fix; MEAS below on
`352758aa2` with `frontend/scripts/smoke/_tmp_174_ghost.ts` (gitignored), the chat's probe rewritten for
`lane-run probe` on :3052 (log `probe-_tmp_174_ghost.log`), same fixture (`p174.fixture()` + `nest()`, then
`set S3.team = P1`, `link('S3','team','P2')`, `open()`) and the same gesture (click the node, press Delete).

### A.1 Where a v2-flow `DVertex` is bound to its element (MEAS DISC)

- The vertex holds the element in `model`; its `father` and `graph` are the `DGraph`; the graph lists it in
  `subElements`. Record keys of S3's vertex: `model`, `father` (a `DGraph`), `graph`, `subElements`, `edgesIn`,
  `edgesOut`, `x`, `y`, `w`, `h`, `pointedBy`, … (`DISC.vertexKeys`).
- The element's `pointedBy` holds `idlookup.<vertex>.model`, the only entry that binds it to the vertex.
- The vertex's own `pointedBy`: `vertexs` (the root collection), `idlookup.<graph>.subElements`, and one
  `idlookup.<edge>.start` (or `.end`) for every edge drawn from (or to) it: S3's two edges, S3→P1 and S3→P2.

### A.2 Why `lDeleted.nodes` does not see it

- `LModelElement.tsx:630-633`: `get_nodes` returns
  `Object.values(transientProperties.modelElement[context.data.id]?.nodes || {}).filter(n=>n&&n.html)`, the
  registry the classic renderer fills for a node it has drawn in HTML. v2-flow draws through React Flow and never
  registers there: MEAS DISC `lNodes: 0`, `nodesTransient: 0` for S3, whose v2-flow vertex is painted.
- So `Dummy.ts:277` (`if (lDeleted.nodes) lDeleted.nodes.map((node: any) => node.delete());`) deletes nothing on
  the developer canvas. `canvasToJjom.ts:463-470` relies on it («every DVertex across graphs (nodes)»).

### A.3 What `Dummy.ts` does with the vertex's entry today

- The element's dependency `idlookup.<vertex>.model` reaches `case 'model'` (`Dummy.ts:256-276`), which deletes an
  edge only: «a graph EDGE whose `model` points at the deleted element … must die with it … Vertices and other
  model-pointing dependents keep the historical no-op (their flows delete them explicitly)»
  (`if (typeof dObj.className === 'string' && dObj.className.includes('Edge')) { lObj.delete(); }`).
- No v2-flow flow deletes them. `syncDeleteVertex` (`canvasToJjom.ts:397-470`, the Delete key on a node) deletes
  the edges of the clicked vertex only (raw `DeleteElementAction`), then `modelElement.delete()`. JjScript and the
  plan (`deleteAdapter`) call `.delete()` alone.
- A vertex that is deleted would leave its edges behind anyway: `case 'end': case 'start':` is a no-op
  (`Dummy.ts:181-183`).

### A.4 What removes the React Flow node

- `useJjomSync.ts:1314-1318`: an id that leaves the graph's `subElements` leaves `rfNodeCache` / `rfEdgeCache`;
  `:1450-1451` filters it out of the nodes (`result.filter(n => !_removedNodeIds.has(n.id))`). A `DVertex` that
  stays in `subElements` stays a node.
- The clicked node disappears anyway, because React Flow removes the node the Delete key acted on from its own state;
  its `DVertex` stays (MEAS M1 `vertexStillInStore: true`, as on `staging` in the chat's probe).

### A.5 Baseline (MEAS, before the fix)

| arm | ghosts | painted | note |
|---|---|---|---|
| M1, Delete on S3 | 2 (S3, P1) | 1 (P1) | 7 delete calls, 0 doubled |
| M1U, one Ctrl+Z | 0 | — | S3 restored but **not painted** (its vertex never left `subElements`, so nothing re-adds the node) |
| M2, Delete on S1 | 4 (S1, x1, x2, x3) | 3 | plus one edge «?->?» between two ghosts |
| M2U, one Ctrl+Z | 4 | 3 | S1 not restored on the canvas; the repeated delete (MR) finds no node to click |
| M3, JjScript `delete instance S2` | 6 | 5 | S2 itself painted |
| SG, a ghost already saved, reloaded and opened | — | **painted** | vertex in the store and in `subElements` |

### A.6 The fix, in `Dummy.ts` (the file is on the list)

- `case 'model'`: a `DVertex` whose `model` is the deleted element is deleted too (`lObj.delete()`), like an edge.
- `case 'end': case 'start':`: when the element being deleted is a `DVertex`, an edge drawn from or to it is
  deleted too. The no-op stays for every other element.
- Composition with the gesture's TRANSACTION: the vertex and edge deletes are `.delete()` calls made inside the
  element's `ret()`, i.e. inside the element's own `TRANSACTION('delete …')`; nested TRANSACTIONs merge, so the
  element, its vertices and their edges land in one history entry, and one Ctrl+Z restores them together. Restoring
  the vertex puts it back in `subElements`, which is what makes the incremental sync paint it again (A.4). No
  creator is involved (rule 12 does not apply).
- Composition with the re-entry guard (`deleteIssued`, step 3): vertex and edge ids enter the Set like any other, so
  a vertex reached twice in one macrotask (a container's cascade and a child's own delete) is deleted once. The raw
  `DeleteElementAction`s of `syncDeleteVertex` (the clicked vertex's edges) bypass `Dummy` and the Set: the cascade
  can issue a second delete for those edges, a no-op in the reducer (`reducer.ts:373`). Measured in the probe
  (`del*.doubled`).
- No critical-zone file: `canvasToJjom.ts`, `useJjomSync.ts`, `syncState.ts` are not touched.
