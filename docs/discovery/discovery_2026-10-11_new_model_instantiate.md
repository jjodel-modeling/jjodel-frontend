# Discovery 2026-10-11: a new project, its model, and the metaclasses that cannot be instantiated

- Prompt-ID: P-2026-10-11-1135, prompt file `docs/prompts/claude_2026-10-11_1135_prompt_new_model_instantiate.md`
- Chat: C-2026-10-10-0057. Session: `23bec087-732b-40a4-974c-5411358cd056`.
- Tree: `~/jjodel-w-newinst`, branch `new-model-instantiate`, HEAD `be556435b` (the commit that adds the prompt, equal to the trunk tip `alfonso-frontend-jjtl`; checked clean before reading).
- Executor: Anthropic Claude Opus 5.5 (session banner).
- Phase 1, read-only on sources. Tags: **[M]** measured in this phase by `frontend/scripts/probe/new-model-instantiate.ts`, headless Chromium 1600×1000, light, a fresh browser context per scenario, a project created from the dashboard; the commit of each measure is named. **[R]** read in code at `be556435b`.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

**Not reproduced as reported. On a fresh project every user path instantiates, on the trunk and on the code 3080 serves. The one failure found needs the metamodel's containment to change while the model tab is open.**

1. [M] In a project created from the dashboard, with two concrete classes dragged into a new metamodel and a model from «+ New», every instantiation path a user has creates the object in **5 of 5 scenarios**:
   - palette drag;
   - Data manager «+ New» and outline «+»;
   - canvas menu «Add …» (once the canvas sees the containment: item 3);
   - JjScript `create instance of`.

   The 5 scenarios: Advanced from the card, Advanced after a page load, Basic after a page load, a user viewpoint with views from the card, and after a page load. Same table on the trunk tip `be556435b`, on `pre-ir-graphvertex` `294a29084`, and on `aa9fd6701`, the tree the 3080 server runs. No path logs a console or page error.
2. [M+R] **A click on a palette entry creates nothing (0 of 5).** That is by design:
   - the entry is drag-only, `PalettePanel.tsx:140-148`;
   - its hint reads «drag … to canvas for root instances», `:237-238`.

   Clicking it is the likeliest way to read «I cannot instantiate». F3, question 3.
3. [M+R] **The canvas does not see containment changes made while the model tab is open (F1).**
   - The memo of `useEditorMode` is keyed on a signature without `composition`, `aggregation`, the reference type, bounds, `interface` or `extends` (`useEditorMode.ts:182`).
   - Containment switched **off** under an open model: the metamodel says `NewClass1` is a root. The palette and the drop gate keep it out, even after a round trip through the metamodel tab. **0 of 5 created, on all three commits.**
   - Containment switched **on**: the node menu has no «Add …» until something the signature carries changes.
   - The Data manager is fresh.
   - The omission dates from `45a83df9a` (2026-03-10): not a regression.
4. [M+R] **The two candidates of the prompt are real, but neither blocks instantiation (F2).**
   - A project opened by a page load has no `Pointer_ViewPointDefault` in `idlookup`.
   - With it missing, the guard `reducer.ts:1110` never closes. It registers every user view and viewpoint as a system default, so `Defaults.check` answers `true`, and `ViewData.tsx:58` makes them read-only. This is S4's finding; the trigger is the page load.
   - No creation path reads `Defaults.check` or the maps (grep, 16 lines in 15 files, none on a creation path).
   - Every path creates with read-only views in the active viewpoint.
5. **Regression: none.** The 35 cells match on the three commits, and on `pre-relayout-on-open` `52ffbe5db` for the failing path (§2b). No bisect owed.

**Recommendation: F1 as Phase 2 (3 files, not §3.2).** F2 is its own lane: core, rule 5. F3 is a UX call. Above all, question 1: how Alfonso tried.

**Questions** (§7)
1. Which path did you use: click, drag, Data manager, canvas menu, JjScript? Did you edit the metamodel with the model open? Recommended: say which; F1 or F3 answers it.
2. F1 as Phase 2 of this lane? Recommended: yes.
3. Palette click: create at the viewport centre? Recommended: yes.
4. F2 as its own core lane, after F1? Recommended: yes.

## 1. Hypotheses under test and verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | In a project just created from the dashboard, with a two-class metamodel built the way a user does, a model of it cannot instantiate its metaclasses through at least one user path. | **Falsified for a fresh project** [M]: `palette-drag`, `dm-new`, `dm-outline`, `ctx-child` and `jjscript` create in 25 of 25 cells on each of three commits; `palette-click` creates nothing, by design (drag-only). **Holds** only for the case of H5: `uncontain` 0 of 5, and `ctx-child` only after the rename. |
| H2 | The cause is the read-only views of a new project (`reducer.ts:1109`, S4's finding). | **Falsified as a cause of instantiation, confirmed as a defect.** The views are read-only after a page load [M], but no creation path reads the guard [R], and every path creates with read-only views in the active viewpoint [M, scenario `vp-reload`]. §3.2. |
| H3 | The cause is the missing `Pointer_ViewPointDefault` in new projects (the older ticket). | **Falsified as a cause of instantiation, confirmed as the trigger of H2.** Absent from `idlookup` after a page load [M]; it is what keeps the reducer guard open. No creation path reads it [R]. §3.2. |
| H4 | The failure is a regression of the graphVertex merge (`eb5600dbb`) or of the days before it. | **Falsified** [M]: identical tables on `be556435b` (trunk), `294a29084` (`pre-ir-graphvertex`) and `aa9fd6701` (3080); `52ffbe5db` (`pre-relayout-on-open`) gives the same on the failing path. The F1 cause dates from 2026-03-10 [R]. |
| H5 | Some user path offers a class it then refuses, or refuses one the metamodel allows. | **Holds, for the canvas only, when the metamodel changes under an open model tab.** Containment switched off → the class stays out of the palette and the drop gate; switched on → the canvas menu has no «Add …». The Data manager is fresh. §3.1. |

## 2. How the probe reproduces the user

`frontend/scripts/probe/new-model-instantiate.ts`, run by `lane-run probe` on ports 3092, 3093, 3094, 3096 (never 3000, 3001, 3003, 3080). Per scenario, in a fresh browser context, with the user's clicks:

1. Dashboard «New Project», a name, «Create Project».
2. The project opened: from its card (`*-card`) or by a page load of its URL (`*-reload`, and `adv-reload` also saves and reloads once more after the model exists, then reopens `model_1` from the left bar).
3. Project page «Create Your First Metamodel»; two classes dragged from the M2 palette «Class» onto the canvas: `NewClass`, `NewClass1`, concrete, no references.
4. Project page, Models «+ New» → `model_1`, opened in editor-v2.
5. `vp-*` only: left bar «New viewpoint», the dialog filled `VP_Test`, «Create Viewpoint»; one view per class through `createViewInWorkbench` (the call of the tree's «Add view»); `VP_Test` activated from the model's toolbar picker.

Then, on the model, one path at a time, each recording the DObjects created (at once and after 3 s), the console and page errors in its window, the Redux action trail (`store.dispatch` wrapped, `CompositeAction` unfolded), and a screenshot:

| Path | What the probe does |
|---|---|
| `palette-drag` | `NewClass` from `.editor-v2-palette--m1 .palette-instances__item`, HTML5 drag onto the pane |
| `palette-click` | a click on the `NewClass1` palette entry |
| `dm-new` | toolbar picker «Data manager», the `NewClass1` row, «+ New NewClass1», the draft's «Create» |
| `dm-outline` | Data manager outline, the model's «+», «New NewClass», «Create» |
| `ctx-child` | a containment reference `NewClass.children: NewClass1` added through the L-API with the model tab open, right-click on `NewClass_0`, the menu read; then the reference renamed `kids`, the menu read again, «Add NewClass1 (kids)» |
| `uncontain` | the containment switched off again, the palette read, a round trip through the metamodel tab, the palette read again, then a drag of `NewClass1` |
| `jjscript` | Jjodie launcher, Cmd+J to `jjscript>`, `create instance of NewClass "viaScript"`, Enter |

Scenarios: `adv-card`, `adv-reload`, `basic-reload` (interface mode Basic), `vp-card`, `vp-reload`. JSON per run in `~/.jjodel-lanes/P-2026-10-11-1135/probe_<tag>.json`, screenshots in `shots/<tag>/`, the console in `probe-new-model-instantiate.log`. Copies of the four JSONs, the log and one screenshot (`trunk_adv-card_uncontain.png`: the palette with `NewClass` only, after `uncontain`) in `docs/discovery/assets/new-model-instantiate/`.

What the probe does not do: it does not reproduce Alfonso's own steps, which are not known (the prompt: «He did not say how he tried»); it builds the metamodel's classes by palette drag, not by the properties panel «+ Add» nor by an `.ecore` import; the containment of `ctx-child` and `uncontain` is written through the L-API, not through the M2 properties panel.

## 2b. Results [M]

Objects created 3 s after each path, in how many of the 5 scenarios (`lane-run probe … --id P-2026-10-11-1135`, all exits 0):

| Path | trunk `be556435b` (3092) | `pre-ir-graphvertex` `294a29084` (3093) | 3080 tree `aa9fd6701` (3094) | `pre-relayout-on-open` `52ffbe5db` (3096, `adv-card` only) |
|---|---|---|---|---|
| `palette-drag` | 5/5 | 5/5 | 5/5 | 1/1 |
| `palette-click` | **0/5** | **0/5** | **0/5** | — |
| `dm-new` | 5/5 | 5/5 | 5/5 | — |
| `dm-outline` | 5/5 | 5/5 | 5/5 | — |
| `ctx-child` | 5/5, **only after the rename**: before it the menu has no «Add» in 5/5 | same | same | same, 1/1 |
| `uncontain` | **0/5**: palette `["NewClass"]` while the metamodel's rootable list is `["NewClass","NewClass1"]` | same | same | same, 1/1 |
| `jjscript` | 5/5 | 5/5 | 5/5 | — |

- Console and page errors in the path windows: **0** on every run. Setup windows: `init_dash` once per scenario, and on the two scenarios that reopen a saved project `wrong project setup in navbar {projectid: …}` once (a reopen artefact, not on a path).
- Redux trail (trunk, `adv-card`):
  - `palette-drag`: one `COMPOSITE_ACTION` with `CREATE_ELEMENT` of the DObject and of its vertex;
  - `dm-new`: two (object, then vertex);
  - `jjscript`: three (object, vertex from the sync, then `SET_ROOT_FIELD _lastSelected` from the probe's closing click);
  - `palette-click`: **none**;
  - `uncontain`: one composite with the flag's `SET_ME_FIELD … .composition` and a `SET_ME_FIELD … .father` on the child `ctx-child` created. The drag dispatches nothing.

State facts per scenario, the same on the three full runs:

| Scenario | `idlookup['Pointer_ViewPointDefault']` | `defaultViewPointsMap[…]` | `state.viewpoints` | user views / `Defaults.check` true |
|---|---|---|---|---|
| `adv-card` | object | object | `["Pointer_ViewPointDefault"]` | 0 / 0 |
| `adv-reload` | **undefined** | **boolean** | `[]` | 0 / 0 |
| `basic-reload` | **undefined** | **boolean** | `[]` | 0 / 0 |
| `vp-card` | object | object | Default + `VP_Test` | 2 / **0** |
| `vp-reload` | **undefined** | **boolean** | `VP_Test` | 2 / **2** (`defaultViewsMap` 20 → 22) |

## 3. Findings

### 3.1 F1 — the canvas's metaclass info does not see containment (H5) [M+R]

The canvas reads the metamodel through `useEditorMode`, a `useMemo` keyed on a signature string:

- `frontend/src/components/editor-v2/hooks/useEditorMode.ts:182`: `parts.push(\`${id}:${cls.name}:${cls.abstract}:${cls.isSingleton}:${refCount}:${refNames}:${attrNames}\`);`
- `:226`: `}, [modelId, explicitMode, metamodelRefFromStore, metamodelClassSignature]);`

What the memo computes from the same classes, and the signature does not carry:

- `:421` `containment: !!(ref.composition),` and `:422` `aggregation: !!(ref.aggregation),`, plus `targetClassId` (`:419`, from `ref.type`), `lowerBound`, `upperBound`;
- `:443` `isAbstract: !!(cls.abstract || cls.interface),` (the signature has `abstract`, not `interface`);
- the `extends` map (`:429-438`), which feeds `concreteSubclasses`;
- `:511-513` `const rootableClasses = rawClasses.filter(` / `c => !c.isAbstract && !c.isSingleton && !compositionTargetIds.has(c.id)`, where `compositionTargetIds` is built from `ref.containment` (`:495-509`).

So a change of containment, aggregation, reference type, bounds, `interface` or `extends` leaves the open canvas on the old `allClasses` / `rootableClasses` until something the signature does carry changes (a class added, a name changed, a reference added or removed), or the tab remounts.

Measured on the trunk (`be556435b`) and on the two other commits (table above), every scenario:

- **Switch containment on** (`ctx-child`): `getMetaclassInfo` (non-hook, recomputed per call) answers `children:true:NewClass1`, rootable `["NewClass"]`; the right-click menu on `NewClass_0` reads `["Edit","Duplicate","Delete","Up","Down","Disable auto-sizing","Help","Explain this"]`: no «Add». After a rename of the reference (which the signature carries) the menu reads `["Add NewClass1 (kids)", …]` and the click creates a `NewClass1` inside.
- **Switch it off** (`uncontain`): the metamodel answers rootable `["NewClass","NewClass1"]`; the palette reads `["NewClass"]`, and still `["NewClass"]` after a round trip through the metamodel tab. `NewClass1` cannot be dropped: the drop gate reads the same memo, `EditorV2.tsx:2411-2412` `const isRootable = mi.rootableClasses.some(c => c.id === metaclassId);` / `if (!isRootable) return; // non-rootable → use context menu instead` (and `onDragOver` at `:2552` the same list, for the drop cursor), and the context menu offers no container for it either, since the containment is off.

This is the one way the probe found to make a class the metamodel allows impossible to instantiate on the canvas. It needs the model tab to be open while the metamodel's containment is edited, which is the ordinary way to iterate on a metamodel and its model side by side.

The Data manager does not have it: `abstract/tabs/InstanceManagerTab.tsx:1633` `const shapeCtx = useMemo(() => makeShapeCtx(modelid), [modelid, idlookup]);`, a rebuild on every `idlookup` identity [R]; `dm-new` creates `NewClass1_0` in every scenario [M].

Age: `git blame -L 165,182` on `useEditorMode.ts` gives `45a83df9a5` (2026-03-10, 5 lines), `83d2bb3fa2` (2026-07-28, 12 lines: names added to the signature for renames) and `c824dc237c` (2026-08-26, 1 line). The omission is as old as the signature: not a regression of October.

### 3.2 F2 — a new project's views are read-only after a page load (H2, H3) [M+R]

Mechanism, in four steps:

1. The `Default` viewpoint exists only in the store seeded at boot: `redux/store.tsx:247` `const viewpoint = projectMissingFromBatch() ? undefined : DViewPoint.newVP('Default', (vp)=>{`, closed at `:324` `}, true, Defaults.Pointer_ViewPointDefault);` [R].
2. A project opened by a page load of its URL does not carry it. [M] `adv-reload`, `basic-reload`, `vp-reload`: `typeof idlookup['Pointer_ViewPointDefault']` = `undefined`, `state.viewpoints` = `[]`. `adv-card` (opened from its card in the same session): `object`, `["Pointer_ViewPointDefault"]`.
3. The default maps start with `true`, not with the records: `common/Defaults.ts:91` `static defaultViewsMap: Dictionary<Pointer, DViewElement> = Defaults.views.reduce((acc, val) => { acc[val] = true; return acc; }, {});`, `:93` the same for `defaultViewPointsMap`. The reducer replaces them only once the `Default` record is in `idlookup`, and until then it registers **every** view and viewpoint it finds: `redux/reducer/reducer.ts:1110-1117` `if (typeof Defaults.defaultViewPointsMap[Defaults.Pointer_ViewPointDefault] !== 'object') {` … `if (v.className.includes('DViewPoint')) Defaults.defaultViewPointsMap[k] = v;` / `if (v.className.includes('DViewElement')) Defaults.defaultViewsMap[k] = v;`. [M] after a page load `typeof Defaults.defaultViewPointsMap['Pointer_ViewPointDefault']` = `boolean`; on `adv-card` = `object`.
4. `Defaults.check` reads those maps (`Defaults.ts:108-110` `return !!(Defaults.defaultViewsMap[id] || Defaults.defaultViewPointsMap[id] || Defaults.defaultTypesMap[id]);`), and the view editors read it as read-only: `components/editors/views/ViewData.tsx:58` `const readOnly = !debug && Defaults.check(view.id);`. [M] `vp-reload`: the two views created in `VP_Test` answer `Defaults.check` = `true` right after creation; `defaultViewsMap` grows from 20 to 22 keys.

This is S4's «every view reads read-only» (`docs/log-inbox/ir-graphvertex-s4.md`), now with its trigger: not «a new project» but «a project opened by a page load», which on a new project is the second visit. `decisions.md` R-IRN-12 (2026-08-18) predicted it: «la guardia di `redux/reducer/reducer.ts:1104` si sblocca solo quando `Pointer_ViewPointDefault` diventa un oggetto, quindi senza seed non si sblocca mai e `Defaults.check()` cambia risposta in silenzio».

It does not block instantiation. Search: `command grep -rn "Defaults.check(" src --include='*.ts' --include='*.tsx'` (tests excluded) returns 16 lines in 15 files (the positive control is `ViewData.tsx:58` among them): language editors, `forEndUser` inputs, `view.tsx:655,988`, `lastViewpoint.ts:98`, `Project.tsx:176`, and `utils/globalCssAudit.ts`, which grep calls binary; `grep -a` shows its hit at `:40` is a doc comment. None in `editor-v2/` creation, `jjform/create.ts`, `hooks/createAdapter.ts`, `jjscript/executor/commands/instance.ts`. A grep for `defaultViewsMap|defaultViewPointsMap` returns the five sites above and `classes.ts:3468-3469`, `view.tsx:2007`: none on a creation path. [M] `vp-reload` creates through every path with both views read-only and `VP_Test` active.

Side effects measured or read, for the lane that fixes it, not for this one: the user's views and viewpoint become `isDefault` in `lastViewpoint.ts:98` (the global-CSS warning's descriptor) and undeletable in `view.tsx:655` `if (Defaults.check(c.data.id)) return true; // cannot delete or "demote" …` [R].

### 3.3 F3 — a click on a palette entry does nothing (by design) [M+R]

`editor-v2/panels/PalettePanel.tsx:140-148`: the entry is `draggable` with `onDragStart={(e) => onDragStart(e, 'objectNode', cls.id)}` and `onDragEnd`; no `onClick`. The palette's own hint, `:237-238`, says `drag` / `to canvas for root instances`. [M] `palette-click` creates nothing and dispatches nothing (empty trail) in every scenario. A user who clicks, as on the Data manager's «+ New», reads it as «cannot instantiate». A UX decision, not a defect: question 3.

### 3.4 What works, measured

All [M], on the three full runs:

- Palette drag of a rootable class, with or without a user viewpoint active, with views read-only or not. The drop goes through `EditorV2.tsx:2299` `onDrop` → `syncCreateObject` (`sync/canvasToJjom.ts:1491`) [R].
- Data manager:
  - opened from the toolbar picker's «Data manager», present in Basic as in Advanced;
  - «+ New NewClass1» on the empty class, then «Create» in the draft;
  - the outline «+» on the model offers `["New NewClass","New NewClass1"]`.
- Canvas menu «Add NewClass1 (kids)» on an object whose class contains `NewClass1`, once `modeInfo` is fresh.
- JjScript `create instance of NewClass "viaScript"` from Jjodie in `jjscript>` mode. The executor creates the DObject and the sync adds its vertex.
- Basic mode changes none of the above.

## 4. Fix proposals

**F1 (recommended, this lane's Phase 2).** Carry in the signature what `resolveM1Info` reads:

- per class: `interface`, the ids of `extends`;
- per reference: `name`, `type`, `composition`, `aggregation`, `lowerBound`, `upperBound` (today only names and count).

To make it testable, move the signature into a pure module that takes `(idlookup, metamodelId)` and imports nothing from `joiner` (the barrel does not import under vitest: `window is not defined`, CLAUDE.md §5, the `nameLookup.ts` precedent); the selector at `useEditorMode.ts:120` calls it.

Files:

1. `frontend/src/components/editor-v2/hooks/useEditorMode.ts`: the selector body replaced by the call (≈60 lines become ≈3).
2. `frontend/src/components/editor-v2/hooks/metamodelSignature.ts` (new): the pure function.
3. `frontend/src/components/editor-v2/hooks/__tests__/metamodelSignature.test.ts` (new): one test per carried field (the signature changes when it changes and stays when nothing does), with a mutation bench that drops each field in turn.

Acceptance: this probe, `ctx-child` with the menu read **before** the rename carrying «Add NewClass1 (children)», and `uncontain` with `NewClass1` back in the palette and created by the drag; the other paths unchanged.

No file of CLAUDE.md §3.1 or §3.2: `useEditorMode.ts` is under `editor-v2/hooks/`, but neither the table of §3.1 nor the list of §3.2 names it. No Layer Impact Report owed. Risk: a wider signature recomputes `resolveM1Info` more often (one pass over the metamodel's classes per relevant M2 edit, as a rename already does today); the hook's consumers (`EditorV2.tsx:607`, the palette, the drop gate, the canvas menu, the IR palette at `:1710-1723`) receive fresh objects on those edits.

**F2 (separate lane, core: rule 5, approval owed).** Close the reducer guard without the seed record. Two candidates, not chosen here:

- (a) replace the `typeof … !== 'object'` test with a dedicated one-shot flag set after the first pass (not `Defaults.freshViewsInitialized`, `Defaults.ts:106`, which `:155-162` already use for the fresh copies); the maps keep `true` for the system ids, which is all `Defaults.check` needs;
- (b) seed the `Default` viewpoint record on project load when missing, which `decisions.md` R-IRN-12/R-IRN-15 moved away from.

Files: `frontend/src/redux/reducer/reducer.ts` (and `common/Defaults.ts` for (a)). Not in §3.2's list, but reducer is core (rule 5) and the guard decides `Defaults.check` everywhere: a full lane with its own discovery of the 15 consuming sites. It also needs a decision on views already saved while the guard was open (none is persisted as default: the maps are module state, rebuilt per session [R]).

**F3 (UX, Alfonso's call).** Click-to-create on the palette entry (at the viewport centre) or a stronger hint. One file, `PalettePanel.tsx`, plus the creation call shared with the drop.

## 5. Files read

- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (97-238, 380-470, 495-514)
- `frontend/src/components/editor-v2/EditorV2.tsx` (2299-2420, 2984-3010, 3290-3340, 1705-1725)
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (75-95, 136-170, 232-240)
- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (160-200)
- `frontend/src/components/editor-v2/hooks/shapeAdapter.ts` (55-124)
- `frontend/src/components/editor-v2/utils/compositionCompat.ts` (110-150)
- `frontend/src/components/editor-v2/Toolbar.tsx` (330-350)
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (490-502, 1030-1052, 1630-1634, 2132-2146, 2368-2392, 2596-2612, 2836-2850)
- `frontend/src/components/abstract/DockManager.tsx` (168-200)
- `frontend/src/components/Jodie/Jodie.tsx` (355-380, 466-500), `ChatInput.tsx` (740-760)
- `frontend/src/redux/reducer/reducer.ts` (1085-1120), `frontend/src/redux/store.tsx` (247, 300-330), `frontend/src/redux/VersionFixer.tsx` (1180-1200)
- `frontend/src/common/Defaults.ts` (27, 45, 91-110)
- `frontend/src/utils/lastViewpoint.ts` (85-110, 140-150), `frontend/src/view/viewElement/view.tsx` (975-1000)
- `frontend/src/pages/components/Navbar.tsx` (100-122), `frontend/src/components/project/ProjectEditor.tsx` (1120-1170), `frontend/src/pages/components/LeftBar.tsx` (437-470), `frontend/src/pages/components/Project.tsx` (165-180)
- `frontend/src/components/environment/ConfiguratorTab.tsx` (251-258)
- A read-only sweep of the instantiation paths by a sub-agent (palette, tree, canvas menu, classic, JjScript, Data manager), whose citations the sections above re-read before quoting.
- `docs/log-inbox/ir-graphvertex-s4.md`, `docs/decisions.md` (1060-1135), `docs/PROTOCOL.md` P14, `frontend/scripts/lane-run.mjs` (probe, 95-115 and 1199-1340), `frontend/scripts/probe/bpmn-lanes-fixture.ts` (195-330), `frontend/scripts/smoke/states.ts` (179-208).

## 6. Dependencies and risks

- The probe's runs on the other commits used temporary detached worktrees, each with a temporary `frontend/node_modules` symlink, removed after the runs (P14): `/tmp/nmi-pregv` (`294a29084`), `/tmp/nmi-3080` (`aa9fd6701`), `/tmp/nmi-prerelayout` (`52ffbe5db`). Neither the 3080 server nor its tree `~/jjodel-w-graphvertex` was touched. Port 3095 was in use by another tree and was skipped.
- The probe adds the containment through the L-API (`addReference`, then `composition = true`), not through the M2 properties panel. The staleness depends on what reaches the D-layer, not on the panel, but the panel path was not driven.
- F1 widens what re-derives `modeInfo`; its consumers in `EditorV2.tsx` (the IR palette at `:1710-1723`, the drop gate, the canvas menu) see a new identity on more M2 edits. `useJjomSync.ts` does not read it (`grep -n "modeInfo\|useEditorMode"` on it: no hit; positive control, the same grep on `EditorV2.tsx` hits `:607`). No sync file changes.

## 7. Questions

1. How did you try to instantiate? Click on a palette entry, drag, the Data manager, the canvas menu, JjScript? Recommended: tell me the path; if it was a click, F3 answers it, if it was after a containment edit with the model open, F1.
2. Open F1 as Phase 2 of this lane (3 files, not §3.2)? Recommended: yes.
3. Palette click: create at the viewport centre, or keep drag-only with a clearer hint? Recommended: click-to-create, the Data manager already creates on a click.
4. F2 (read-only views after a page load) as its own lane, core, with a discovery of the 15 `Defaults.check` sites? Recommended: yes, separate, after F1.

## 8. Addendum 2026-10-11 — Phase 2, F1 measured (GO of the chat, scope F1 only)

Code `b08c92322` on top of `d53d319dc`. It touches three files, as §4 proposed, none in CLAUDE.md §3.1 or §3.2:
- `hooks/metamodelSignature.ts`, new;
- `hooks/useEditorMode.ts`, where the selector now calls it;
- `hooks/__tests__/metamodelSignature.test.ts`, new.

The signature keeps its old prefix and appends, per class, `interface` and the supertype ids, and per reference `type/composition/aggregation/lowerBound/upperBound`. F2 and F3 are untouched: `PalettePanel.tsx`, `reducer.ts` and `Defaults.ts` are unchanged.

`modeInfo` consumers [R]: `useEditorMode(` has one caller, `EditorV2.tsx:607`. `modeInfo` reaches:
- the palette props (`:4844-4848`);
- the IR palette memo (`:1710-1723`);
- the memo at `:810-827`;
- the canvas menu (`:3300-3306`);
- the handlers, through `modeInfoRef`.

`useJjomSync(` (`:573`) and `useM1ReferenceEdges(` (`:601`) do not receive it.

Gates:
- the new test, 22 of 22;
- `editor-v2/hooks`, 10 files, 197 tests;
- typecheck 14, the baseline by file and code;
- build exit 0 (chunk-size warning only);
- `check:scripts` PASS.

Mutation bench: 11 mutants, 11 killed (listed in the commit body).

Probe, the same file `309245922`, `lane-run probe … --port 3092`, tag `f1-worktree` (the tree equal to `b08c92322`), JSON `assets/new-model-instantiate/probe_f1-b08c92322.json`:

| Path | trunk `be556435b` | F1 `b08c92322` |
|---|---|---|
| `palette-drag` | 5/5 | 5/5 |
| `palette-click` | 0/5 | 0/5 (unchanged, F3 out of scope) |
| `dm-new` | 5/5 | 5/5 |
| `dm-outline` | 5/5 | 5/5 |
| `ctx-child` | 5/5, «Add» only after a rename | **5/5, «Add NewClass1 (children)» on the first right-click** |
| `uncontain` | **0/5**, palette `["NewClass"]` | **5/5**, palette `["NewClass","NewClass1"]` before and after the tab round trip |
| `jjscript` | 5/5 | 5/5 |

Path-window errors: 0. Setup errors and state facts are identical to Phase 1 (the F2 rows of §2b unchanged, as expected). Screenshot `assets/new-model-instantiate/f1_adv-card_uncontain.png`: the palette shows both classes, and `NewClass1_2` was created by the drag.

Not measured: the containment edited through the M2 properties panel instead of the L-API (§6). The visual GO is Alfonso's.
