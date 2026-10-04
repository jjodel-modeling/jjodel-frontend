# Discovery 2026-10-04 — #157 closing defects: dev→consumer without reload, hidden names, cascade and containment on read/hidden types

- Request: Juri in chat, 2026-10-04 («Risolvi i difetti trovati durante 157, dopodiché chiudi 157»). No prompt file; this session names the request `C-2026-10-04-0605` for tickets.
- Session: `fa3f8dc7-0696-4d9d-b907-75c13b36b2ba` (from the scratchpad path) · tree `/Users/juridirocco/development/jjodel`, branch `feat/157-environment-config`, HEAD `705502f0f`
- Executor: Anthropic Claude Opus 5.5 (session banner)
- Phase 1, read-only on tracked files. Probe `frontend/scripts/smoke/_tmp_157_close_measure.ts` (untracked, `_tmp_*`), run three times against Juri's vite on 3000 (pid 93518, serving this tree since 2026-10-01), identical results each time, zero page errors. Logs in the session scratchpad (`measure1.log` … `measure3.log`).
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## 0. Answer in brief

The three defects ticketed during #168 reproduce on `705502f0f`, and the measures find **two more in the IR form** (critical zone) and **one in the core** (outside #157).

- **D1, developer → `&profile=` without reload** (measured): the Properties+Tree rail stays painted with the metamodel tree (Vault, a hidden type, included); `.dashboard-container` keeps `hide-leftbar`, so the Configurator page drops into a second grid row: the `Scenario_0` row sits at y=984 in a 900px viewport and `elementFromPoint` finds nothing; the status bar reads «ScenarioMM · 4 classes … › Scenario». After a reload none of the three: rail absent, row at y=166 and hit, status bar empty.
- **D2, hidden names in the consumer detail** (measured): `vault_alpha` (type Vault, hidden) is painted twice on `Scenario_0` — by the IR form's reference control (`span.ir-ref__name`) and by the reference section (`span.instance-manager__ref-name`); the word «Vault» three times (section header, the locked label, the child bar `secrets Vault`). The IR form also offers a `guard` picker «Select a Vault» that lists `vault_alpha`. The delete dialog names hidden descendants (`vault_beta : Vault · .secrets`).
- **D3, cascade and containment on read/hidden types** (measured): the Configurator deletes `Scenario_2` together with `Phase_2` (read) and `vault_beta` (hidden), no warning; JjScript `delete instance Scenario_3` succeeds; JjScript `set Scenario_1.pathway = Phase_s` moves a read element (father DModel → DValue, «Linked»); the IR form's single-valued containment picker `lead` lists root and **bound** Phase elements and moves `Phase_r` (read) into the slot. Per contrasto, the guard runs in the same page: `create instance of Phase` and a link to a hidden Vault are refused.
- **Outside #157, core** (measured + read): JjScript `delete instance` of a container does **not** delete what it contains: `Phase_3` survives with a dangling `father` and stays in `model.objects`. `LValue` has no `get_children_idlist` override, so the canonical cascade (`Dummy.ts:84`) reaches the slots, not their values. The Configurator is not affected: its plan deletes each descendant by id.

**Recommendation: two steps.**
- **Step A, outside the critical zone, 8 files (Rule 19, list in §6):** D1 (Dashboard, StatusBar), the Configurator's delete (blocked when the cascade holds a read/hidden element, hidden names out of the dialog), and the JjScript guard (refuse a delete whose containment subtree holds a non-`edit` element, and a link into a containment slot whose target is not `edit`). Pure parts tested, probe re-run.
- **Step B, critical zone (`editor-v2/viewpoint/ir/`), its own GO and Layer Impact Report:** the IR form learns the profile (an optional `permissionOf` prop, additive): no field typed by a hidden class, no hidden candidate in a picker, no non-`edit` candidate in a containment picker; with it, `InstanceDetail` drops the locked label of a hidden target (D2 whole). Visual check by Juri.

**Decisions awaiting Juri:** none of RC-26 class. **Questions:** 5, §8, each with `Recommended:`.

---

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Developer → consumer without reload leaves the right rail on the metamodel and the Configurator rows under the LeftBar (ticket of P-2026-10-01-2301) | **holds, wider** | measured D1.1: rail visible with Vault; rows not under the LeftBar but below the viewport (y=984 of 900), no hit; status bar on the metamodel. D1.2 reload: none |
| H2 | The consumer detail names a hidden referenced element only in `InstanceDetail` (`:139-151`) | **falsified** | measured D2.1: also in the IR form (`span.ir-ref__name`); D2.2 the IR picker lists it; D3a.1 the delete dialog names hidden descendants |
| H3 | A Configurator delete takes read/hidden contained elements with it | **holds** | measured D3a: `Phase_2` (read) and `vault_beta` (hidden) deleted with `Scenario_2` |
| H4 | JjScript `delete instance` of an `edit` element deletes read contained elements (ticket of P-2026-10-01-2302) | **partly** | measured D3b: the delete succeeds and touches the read child, but leaves it alive with a dangling father (core, §4.7) |
| H5 | JjScript `set` on a containment reference moves a read element | **holds** | measured D3c: `Phase_s` father DModel → DValue, «Linked Scenario_1.pathway → Phase_s» |
| H6 | The Configurator has no gesture that moves an existing element into a containment slot | **falsified** | measured D3d: the IR `lead` picker (0..1 composition) lists `Phase_r` (Free) and `Phase_0`, `Phase_s` (Bound) and moves `Phase_r` |
| H7 | Contained types are always `edit` for a profile, so H3-H6 are unreachable from the wizard | **falsified** | read: `get_rootable` returns `c.data.rootable` when set (`LModelElement.tsx` `get_rootable`), `get_isComposedBy` lists only references typed exactly on the class; a subclass of a composed type, an aggregation target and a class with explicit `rootable` are markable, so they can be `read`/`hidden` and still sit in a containment slot. The probe uses explicit `rootable` |

## 2. Files read

`CLAUDE.md`; `docs/PROTOCOL.md` (whole); `docs/claude-code-log.md` (head); `docs/decisions.md` (Processo, head); `frontend/src/components/editor-v2/CLAUDE.md` (§3.3, §3.4); `frontend/scripts/smoke/README-probes.md` (whole); `docs/log-inbox/jodie-consumer.md` (tickets); `docs/discovery/discovery_2026-10-01_168_a_context.md` (whole), `discovery_2026-10-01_168_b_guard.md` (§3.5, lines 210-235), `discovery_2026-10-02_168_r_reparent_from_root.md` (grep windows), `discovery_2026-09-24_157_fase4_profile_link_assignment.md` (1-80), `discovery_2026-09-23_157_standalone_configurator.md` (236-262).
Code: `frontend/src/components/environment/consumerMode.ts` (whole); `frontend/src/joiner/environmentConfig.ts` (whole); `frontend/src/pages/components/Dashboard.tsx` (560-680); `frontend/src/pages/dashboard.scss` (380-400); `frontend/src/components/abstract/Dock.tsx` (235-290); `frontend/src/components/abstract/style.scss` (1105-1180); `frontend/src/components/editors/PropertiesWithTreeView.tsx` (440-470, 690-780, 1085-1130); `frontend/src/components/StatusBar.tsx` (1-30, 285-400); `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (whole); `frontend/src/components/environment/ConfiguratorTab.tsx` (225-300, 510-541, grep); `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (`DeleteDialog`, whole); `frontend/src/components/editor-v2/hooks/deleteAdapter.ts` (100-140); `frontend/src/components/editor-v2/hooks/deleteDraw.ts` (`descendantsOf`); `frontend/src/jjform/delete.ts` (143-165, grep); `frontend/src/jjscript/executor/permissionGuard.ts` (whole); `frontend/src/jjscript/executor/executor.ts` (70-180, 340-470); `frontend/src/jjscript/executor/commands/instance.ts` (470-540); `frontend/src/common/Dummy.ts` (50-160); `frontend/src/model/logicWrapper/LModelElement.tsx` (760-800, 3076-3100, 4202, 6210-6275, 6740-6752, 7262-7282, 7355-7375, 7440-7460, grep of the `LValue` class 6825-8700); `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (76-116), `IRFormField.tsx` (36-115, 285-300), `formAutoLayout.ts` (398-412), `widgets/ListWidget.tsx` (grep), `widgets/ReferenceWidget.tsx` and `ReferencePicker.tsx` (class names only). Partial reads are windows, as listed.

## 3. Measures

### 3.1 Fixture and method

Built by the probe through the L API on a project created by `states.createProject`, every step asserted (F0-F5, all PASS). Metamodel `ScenarioMM`: `Scenario ◇pathway→ Phase[*]`, `Scenario ◇lead→ Phase[0..1]`, `Scenario ◇secrets→ Vault[*]`, `Scenario guard→ Vault[0..1]`, `Phase learners→ Learner[*]`; `Phase` and `Vault` made rootable by the metamodel (`DClass.rootable = true`). Model `scen_a`: `Scenario_0` (pathway `Phase_0`, guard `vault_alpha`), `Scenario_1`, `Scenario_2` (pathway `Phase_2`, secrets `vault_beta`), `Scenario_3` (pathway `Phase_3`), roots `Phase_r`, `Phase_s`, `Antonio`. Containment links by `states.link` (father = DValue asserted). Config: four top-level types; profile `Edu` = Scenario edit (default), Phase read, Learner read, Vault hidden. Saved (stored `lastModified` sentinel).

### 3.2 Results (run 3; runs 1-2 identical on every value below)

| Id | Scenario | Measured |
|---|---|---|
| D1.0 | developer, ScenarioMM opened from the summary card (per contrasto) | rail present and visible, with Vault; `hide-leftbar` true; `data-editor-type` metamodel; status «ScenarioMM · 4 classes · … · 5 references · › Scenario» |
| D1.1 | then `&profile=` by `location.hash`, no reload | rail present, visible, with Vault; `hide-leftbar` true; editor type metamodel; status unchanged; row `Scenario_0` at `[17, 984, 299×36]`, viewport 900, `elementFromPoint` → nothing |
| D1.2 | same URL after a reload (per contrasto) | rail absent; `hide-leftbar` false; editor type summary; status empty; row at `[257, 166, 299×36]`, hit = the row |
| D2.1 | consumer detail of `Scenario_0` | `vault_alpha` ×2: `span.ir-ref__name` (IR form) and `span.instance-manager__ref-name` (section); «Vault» ×3: section eyebrow, locked label, child bar row |
| D2.0 | developer overlay, same element (per contrasto) | `vault_alpha` ×2 at the same two sites: the instrument has signal |
| D2.2 | consumer, `Scenario_1.guard` picker | candidates `(none)`, `vault_alpha` |
| D3a | consumer, Delete on `Scenario_2` | Delete offered; dialog «Containment cascades: its 2 contained elements will be deleted too. Phase_2 : Phase · .pathway, vault_beta : Vault · .secrets»; after confirming, `Scenario_2`, `Phase_2`, `vault_beta` all gone |
| D3.0 | consumer, JjScript controls (per contrasto) | `create instance of Phase "zz"` → `PROFILE_TYPE_LOCKED`; `set Scenario_1.guard = vault_alpha` → `PROFILE_HIDDEN_TARGET` |
| D3b | consumer, `delete instance Scenario_3` | success, «Deleted instance 'Scenario_3'»; `Phase_3` alive, `father` = an id absent from `idlookup`, still in `scen_a.objects` |
| D3c | consumer, `set Scenario_1.pathway = Phase_s` | success, «Linked Scenario_1.pathway → Phase_s»; father DModel → DValue |
| D3d | consumer, `Scenario_1.lead` picker | pickers on the form: «Select a Vault», «Select a Phase»; `lead` rows: `Phase_r` (Free Objects), `Phase_0`, `Phase_s` (Bound Objects); picking `Phase_r` → father DModel → DValue |

Screenshots: `_tmp_157_close_D1_noreload.png` (rail with the ScenarioMM tree, body empty), `_tmp_157_close_D1_fresh.png`, `_tmp_157_close_D2_consumer.png`, `_tmp_157_close_D3d.png` (the Scenario_1 form: `guard` «Select a Vault», `secrets` «No values», `pathway` Phase_s with a remove ×, `lead` «Select a Phase»). The × was seen on the screenshot only; the probe's DOM selector for it found 0 controls, so its presence is not a measure.

## 4. Findings (read)

**4.1 The rail is a portal to `<body>`, so R5's `visibility` does not reach it.** `Dashboard.tsx:656` «`<Try><PropertiesWithTreeView mode={'floating'} /></Try>`», inside the wrapper R5 hides; `PropertiesWithTreeView.tsx:1100` «`? (railMounted && createPortal(`», with the overlay shown when `PropertiesWithTreeView.tsx:719` «`const overlayActive = activeEditorType === 'model' || activeEditorType === 'metamodel';`». `activeEditorType` comes from `useTreeViewPanel()` (`:458`), a context above the component, so not mounting the rail in consumer loses no state; F3-A already re-broadcasts the editor type on consumer → developer (`Dock.tsx:263-277`).

**4.2 `hide-leftbar` survives the consumer.** `Dashboard.tsx:649` «`<div className={`dashboard-container two-column${hideLeftBar ? ' hide-leftbar' : ''}`}>`», while R5 renders the LeftBar in consumer whatever `hideLeftBar` says (`:650` «`(consumer || !hideLeftBar) && <LeftBar …`»); `dashboard.scss:389` «`&.hide-leftbar {`» sets one column, so the wrapper falls into an implicit second row (D1.1 y=984).

**4.3 The status bar follows the Dock's active tab.** `StatusBar.tsx:312` «`const showEditor = context === 'editor' && activeModel;`», `context` set from `ACTIVE_TAB` (`:288-305`). Nothing reads the profile. `StatusBar` is a child of `ProjectDashboard`, which re-renders on `hashchange` (R5).

**4.4 The reference section keeps a hidden target on purpose, because the form shows it too.** `InstanceDetail.tsx:139` «`if (isHidden?.(targetId)) {`» renders a locked label; the doc comment above `RefSlotsSection`: «a target of a type the profile hides stays LISTED — the form's own chips already name it, and a list that disagreed with them would read as a bug». The chip is the IR form's (`span.ir-ref__name`, D2.1). The child bar keeps a hidden-typed slot with its reason: `:377` «`? NOT_EDITABLE`», and the ref sections keep a slot with targets (`:451` «`.filter(s => s.targets.length > 0 || s.createReason === null)`»).

**4.5 The IR form knows nothing of the profile.** `IRFormProps` (`IRForm.tsx:76-87`) has `objectId`, `defaultTheme`, `host`. A single-valued containment is a reference control with a picker; the offer is filtered for containment loops only: `IRFormField.tsx:102` «`the containment-loop filter behind the offer (R-FORM-13)`». A containment list has no Add (`ListWidget.tsx:8` «`CONTAINMENT children get no Add in this slice.`») but, per the screenshot, a remove ×.

**4.6 The Configurator checks only the deleted instance's own type.** `InstanceDetail.tsx:474` «`const canDelete = !!openDelete && permOfInstance(subjectId) === 'edit';`»; `ConfiguratorTab.tsx:250` «`const pre = preflightFor(mid, makeShapeCtx(mid).shape(), instanceId);`», shown as is. The preflight's cascade is `descendantsOf`, which follows compositions only: `deleteDraw.ts:82` «`if (!feature || feature.composition !== true) continue;`». `DeleteDialog` hides every option when `pre.blocked` is set and shows `{pre.blocked ?? pre.message}`, so a `blocked` reason is the existing way to refuse.

**4.7 Core: the canonical cascade does not reach contained values.** `Dummy.ts:84` «`for (let child of lDeleted.children) {`», with the comment «`if a m1-dvalue which conforms to a m2-reference with "containment" is deleted, the target is also deleted because is a "children" of it.`». `LObject.children` are its DValues (`LModelElement.tsx:6259-6260`), and `LValue` overrides neither `get_children_idlist` nor `get_delete` (grep over the class, 6825-8700; positive control: the same grep finds `get_containment` at 7448), so it inherits `LModelElement.tsx:772` «`return context.data.annotations ? [...context.data.annotations] : [];`». D3b is the measured consequence. JjScript reaches it through `instance.ts:537` «`(lObject as any).delete();`». Not #157: ticket.

**4.8 The JjScript guard checks the subject and a hidden link target only.** `permissionGuard.ts:145` «`if (resolveTypePermission(env.profile, subject.id) !== 'edit') {`», `:152` «`if (resolveTypePermission(env.profile, target.id) === 'hidden') {`»: a `read` target passes, and nothing is asked about containment or about what a delete takes. The adapter computes whether the `set` links (`executor.ts:400` «`const links = isReference && (!isLiteral || value.kind === 'string');`»), not whether the reference is a containment. L-layer containment is `composition || aggregation` (`LModelElement.tsx:4202`).

## 5. Dependencies and risks

- **#168 consumers of the guard's codes.** C2's proposal reads `errors[0].code`. The new refusals reuse `PROFILE_TYPE_LOCKED`, so no member is added to the exported union `PermissionRefusalCode` (Rule 11).
- **A refusal must not name a hidden type.** A delete refused for a hidden descendant says «elements you can't change», without the type.
- **Aggregation.** The Configurator's cascade follows compositions only (`deleteDraw.ts:82`); the L-layer's containment includes aggregation. Step A uses each actor's own notion: the Configurator checks what its plan deletes, the guard checks the L-layer containment. The divergence stays as ticketed by R (aggregation re-father).
- **Developer paths unchanged.** Every change is behind `isConsumerMode()` or a profile; with no profile the guard returns `null` first (`permissionGuard.ts` top), and `InstanceDetail`/IR take an optional prop that is absent in the Data Manager.
- **Step B is critical zone** (`editor-v2/viewpoint/ir/`, CLAUDE.md §3.1): P5 asks an explicit go-ahead and a Layer Impact Report; the IR form is mounted by the canvas rail and the Data Manager too, so the prop must be inert when absent.
- **Environment.** The probe runs on Juri's vite on 3000; a save of a source file mid-run would void it (README-probes, boots).

## 6. Plan

### Step A — outside the critical zone (8 files, Rule 19)

1. `frontend/src/pages/components/Dashboard.tsx` — in consumer: no `hide-leftbar` class; the floating rail not mounted.
2. `frontend/src/components/StatusBar.tsx` — in consumer, empty left zone (what a fresh consumer load shows, D1.2).
3. `frontend/src/components/environment/ConfiguratorTab.tsx` — `openDelete` in consumer: `blocked` when a descendant is not `edit`; hidden descendants and hidden referrers left out of the dialog's lists.
4. `frontend/src/joiner/environmentConfig.ts` — a pure helper for 3 (refusal reason + filtered lists from the preflight and a permission per instance), zero imports kept.
5. `frontend/src/joiner/__tests__/environmentConfig.test.ts` — its tests.
6. `frontend/src/jjscript/executor/permissionGuard.ts` — `GuardCommand` gains two optional fields: `cascade` (the types of every element in the containment subtree of a `delete`) and `linkIsContainment`; a delete with a non-`edit` element in the subtree, and a containment link to a non-`edit` target, are refused (`PROFILE_TYPE_LOCKED`, no hidden name).
7. `frontend/src/jjscript/executor/executor.ts` — `describeForGuard` fills them (subtree through the slots' L `containment`, the reference's `containment`).
8. `frontend/src/jjscript/executor/__tests__/permissionGuard.test.ts` — the new rules, with the mutation bench (drop the cascade check, drop the containment check, name the hidden type).

Gates: `npx tsc --noEmit` complete (baseline 14), `npm run build`, vitest on the two test files, the probe turned into a verifier (D1, D3a-c green, D3d and D2 still red until step B, declared), developer controls unchanged, `npm run smoke`.

### Step B — critical zone, after A, own GO

`IRForm.tsx` + the field/offer path (`IRFormField.tsx`, `useFormWidgets.ts`, to be confirmed by a short discovery of the offer) and `InstanceDetail.tsx`: optional `permissionOf` on `IRForm`; fields typed by a hidden class not rendered; hidden candidates out of every picker; non-`edit` and bound candidates out of a containment picker; no remove on a non-`edit` contained value; `InstanceDetail` passes the prop and drops the locked label and the hidden-typed slots. Layer Impact Report before the diff; Juri's visual check.

## 7. Tickets to open at closure

- Core: JjScript `delete instance` of a container leaves its contained elements with a dangling `father`, still in `model.objects` (D3b, §4.7). Priority high: silent corruption, in developer too (same handler, not measured in developer).
- Configurator delete: «Reassign all to» and «Clear the references» write into referrers whatever their type's permission.

## 8. Questions

1. GO for step A with the 8 files of §6? Recommended: yes.
2. Step B (IR form, critical zone) as a separate step after A, with Layer Impact Report and your visual check? Recommended: yes, separate; #157 closes after B.
3. A consumer delete whose cascade holds a read/hidden element: block it, or allow it? Recommended: block, with the reason «contains elements you can't change with this profile».
4. Referrers of read/hidden types in the delete dialog (their pointer is cleared by any delete; reassign/clear write into them): what now? Recommended: hidden names left out of the lists in step A; reassign/clear by permission as a ticket (§7).
5. The core cascade defect (D3b) is outside #157: ticket only? Recommended: yes, a GitHub issue with the measure, not fixed here.
