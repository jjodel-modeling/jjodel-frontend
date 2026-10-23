# Discovery — #187, the Configurator panel and the consumer chrome (Phase 1)

- **Prompt-ID**: P-2026-10-14-1100 (`docs/prompts/claude_2026-10-14_1100_prompt_187_configurator_panel.md`), chat `C-2026-10-14-1020`, director Juri.
- **Session**: 69133870-b2c6-4959-adc4-04b16905a83c (resumed once after the account session limit, no work lost).
- **Tree**: `/Users/juridirocco/development/jjodel-187`, branch `feat/187-configurator-panel`, HEAD `304266fd6`, clean; no tracked file under `frontend/` edited.
- **Executor**: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

The panel of #187 can be built as the plan's §5.1 says, with **no edit of a critical-zone file**. Attributes keep today's widgets
by mounting `IRFormField` itself (an import) inside an `.ir-form` root, with the panel's own title row above it and the field's
label row hidden by one scoped rule; references and compositions are drawn by the panel from the `jjform` rules already exported
(`refSlotControls`, `addChildReason`, `newInstanceReason`, the `nav` module) and written through `formWrite`, as `InstanceDetail`
does. `ReferencePicker` cannot hold «+ New» (§5): the panel needs a small picker of its own. The Data Manager is not touched.

Probe `_tmp_187_probe.ts` `MODE=before` through the launcher on 3187: **15/15 PASS, 62 MEAS, 0 page errors**, one console error at
the fixture (`init_dash`, as in #172). The BEFORE table (16 snapshots, 23 gestures with the slot's raw `values`) is
`~/.jjodel-lanes/P-2026-10-14-1100/187_before.json`.

Measures that correct or sharpen the Context (none changes the design):
- `saveProjectWithFeedback` is in `common/libraries/saveProject.tsx:60` (`.tsx`, not `.ts`).
- The app bar's right side has **three** separators (`appbar__sep` ×3): in consumer mode all three are orphaned once Save, the
  last-saved label and Basic/Advanced go, so the consumer's bar keeps Help and the user menu only (§4.6).
- On Scenario_0 the Configurator mounts **four** `IRForm`s (subject + 3 inline children): 4 «PROPERTIES», 4 Basic/Advanced, 4 «No
  issues», 4 identity rows (§4.2). A composition renders **three times**: a form field in «Children», the inline forms, the «Add» bar.
- Today's read gate is pointer-only: **4 tabbable, enabled controls** inside the gate of a `read` element (Assess_0 inline; L1 after
  a drill-in). A keyboard write through it was not measured (declared, §4.5).
- Probe trap: «Add Phase» names the new child `Phase_2` while another `Phase_2` exists (names are unique per container, not per
  model). Phase 2 renames the fixture instances and repeats BEFORE on the untouched code before the first diff (§9).

Recommendation: Phase 2 in three commits (§9): step 1 the consumer chrome (3 files); step 2a `panelModel.ts` and its test; step 2b
the panel's new files and the mount in `ConfiguratorTab` (8 files, rule 19 list in §9).

Decisions awaiting Juri (RC-26 list): **none** — no critical-zone edit, no exported interface changed, no ratified row amended
(R-CFG-2 already moves the Configurator off R-REF-3's menu), nothing deleted. The questions below are within the lane (RC-21).

Questions (detail in §8):
1. Two gestures of today's composition field are not in #187: pick an EXISTING element into a composition slot (measured C25, it
   moves the element in) and the × that evicts a child to the model root (C27). Recommended: drop both, as #187 task 9 says; a child card deletes through the host's `openDelete`.
2. The mockup puts a trash on a reference row, whose gesture unlinks. Recommended: `bi-x-lg` «Remove from the list» on reference rows (unlink), the trash only on composition cards (delete).
3. The `*` «in the accent colour»: `--color-accent` is slate-700, the title's own colour; the mockup's is blue. Recommended: `--color-form-dirty-text` (sky-600), the token of the fields' «Modified, not saved».
4. «+ New» in the picker of a FILLED single reference: today blocked («Slot full»), and the host's `createAndLink` appends (a second target in a 0..1 slot, the ticket of 2026-10-12). Recommended: `createAndLink` takes an optional raw index; the panel sets the new target at the row's index (replace, the old one unlinked, never deleted).
5. The issues chip of the header counts what. Recommended: the element on screen plus its inline cards, summed; a click scrolls to the first field that carries the severity, in screen order.

## 1. Hypotheses under test

- **H1** — The panel can render every attribute shape without editing a widget, `IRForm`, `IRFormField` or `InstanceDetail`.
  **Holds**, by mounting `IRFormField` (§6).
- **H2** — The panel can keep every behaviour of `InstanceDetail` in the Configurator. **Holds with two exceptions**, the two
  composition gestures #187 task 9 removes (§8 Q1), and one behaviour it improves (the read gate, §4.5).
- **H3** — `ReferencePicker` can serve the mockup's dropdown (search, results, «+ New»). **Falsified** (§7).
- **H4** — Step 1 is three files. **Holds** (`Navbar.tsx`, `ConfiguratorTab.tsx`, `configuratorTab.scss`).

## 2. Objective

Phase 1 of P-2026-10-14-1100: measure what the Configurator shows and does today, census what the panel replaces, design the panel's
attributes, pickers, markup and pure module, and plan Phase 2 in steps.

## 3. Files read

- Rules: `CLAUDE.md`, `frontend/src/styles/CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (P1-P16),
  `docs/decisions.md` (RC-17, RC-21, RC-25, RC-26, RC-48, R-NEST-2..9, R-REF-1..7, R-CFG-1..4), the memo
  `docs/ratifiche/claude_2026-10-14_memo_166_configurator.md`, the plan `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md`
  (whole), `docs/log-inbox/standalone-environment.md`, `docs/log-inbox/data-manager-ux.md` (last entries).
- Issues #187 (body, 14 criteria) and #166 (body and comments, the cardinality labels of 2026-10-07); mockups
  `~/.jjodel-lanes/assets/166/187_1..3*.png`, `166_cardinality_today.png`, `166_cardinality_proposal.png`.
- Code, whole: `frontend/src/components/environment/ConfiguratorTab.tsx`, `configuratorTab.scss`, `consumerMode.ts`;
  `frontend/src/components/abstract/tabs/InstanceDetail.tsx`; `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx`,
  `IRFormField.tsx`, `useFormWidgets.ts`, `formWrite.ts`, `formPermissions.ts`, `formDiagnostics.ts`, `formHosts.ts`, `formSections.ts`,
  `useIRFormView.ts`; `frontend/src/jjform/refSlot.ts`, `nav.ts`, `shape.ts`, `index.ts`; `widgets/ReferencePicker.tsx`, `widgets/index.ts`.
- Code, the sections cited: `jjform/create.ts` (`addChildReason`, `newInstanceReason`, `newDraft`), `abstract/tabs/instanceTable.ts`
  (`referenceSummary` 698-735), `editor-v2/hooks/shapeAdapter.ts` (40-139), `shapeDraw.ts` (100-245), `multiDraw.ts` (`navStepOf`,
  `childrenIn`), `createAdapter.ts` (`childSlotCount`), `formAutoLayout.ts` (exports, `extendedWidgetFor` 395-408), widgets `TextWidget`,
  `NumberWidget`, `CheckboxWidget`, `SelectWidget`, `ChipsWidget`, `ChipInputWidget`, `ListWidget` (props and classes),
  `irFormStyle.scss` (1-75 and the selector map), `instanceManagerTab.scss` (2270-2292), `styles/tokens/_colors-light.scss`,
  `styles/tokens/_form-palettes.scss` (30-60), `pages/components/Navbar.tsx` (575-600, 1825-1845, 1986-2030), `common/libraries/saveProject.tsx`,
  `common/libraries/lastSaved.ts` (80-121), `components/topbar/LastSavedIndicator.tsx`, `problems/useNodeProblems.ts`,
  `editor-v2/components/InlineObjectSelect.tsx` (`computeListStyle` 42-52), `vitest.config.ts`.
- Probes used as models: `scripts/smoke/_tmp_172_probe.ts`, `_tmp_172_setup.js`, `_tmp_157_b_verify.ts`, `_tmp_157_b_setup.js`,
  `_tmp_173_verify.ts`, `_tmp_172_smoke.ts`, `README-probes.md`, `states.ts` (`seed`, `link`).

## 4. Findings (measured, BEFORE, `_tmp_187_probe.ts` on 3187)

Fixture MM187 (asserted, F0-F6): Scenario { title EString 0..1, duration EInt 1..1, budget EDouble 0..1, active EBoolean 0..1,
level Level 0..1 (enum Low/Medium/High), tags EString 0..*, serial EInt isID; goal 1..1, teacher 0..1, learners 1..*, rooms 0..2,
frozen 0..1 changeable=false, vault 0..1, topic 0..1 → Topic (abstract); assessment ◆ Assessment 0..1, phases ◆ Phase 0..* },
Phase { name EString 1..1, minutes EInt 0..1; mentor 0..1; steps ◆ Step 0..* }. Profile «Edu»: Learner read, Assessment read,
Vault hidden. Scenario has no `name` attribute (identity row), Phase has one (name slot).

### 4.1 Where each feature renders today (A1.where, B2.where, D2.where)

Data Manager and Configurator overlay, Scenario_0, identical:

| feature | today |
|---|---|
| title, budget | field «Attributes», text / number (stepper), `0..1` |
| duration | field «Attributes», number, `1..1`, required dot |
| active / level | checkbox / native select |
| tags | extended chip input (`chips`), `0..*` |
| serial (isID EInt) | read-only value with lock |
| goal, teacher, learners, rooms, frozen, vault, topic | reference sections with `[n/m]` chips (R-REF-1) |
| assessment, phases | form field «Children» (ref picker / list) + inline child forms + «Add» bar row |

Profile page: identical but `vault` **absent** and `assessment` a **read-only** field (Assessment is `read`).

### 4.2 The chrome today (B0, B1, B2.chrome, D1, D2.chrome)

- Detail of Scenario_0: `eyebrows` = 4 × «PROPERTIES», `modeControls` = 4, `modes` = 4 × `advanced` (seeded advanced), `summaries`
  = 4 × «No issues», identity rows «OScenario_0Scenario», «OAssess_0Assessment», «OPhase_0Phase», «OPhase_1Phase».
- Header: overlay title at x 32-147, chip «No profile — full access» at 1196-1373 in `configurator__header-right`, close at 1381-1408;
  page title 273-388, chip «Edu» at 1347-1407, tooltip «Active profile from the ?profile= URL parameter», no close.
- App bar, developer: `appbar-last-saved` «Saved just now», `appbar-save`, sep, `appbar-mode-switch`, sep, sep, Help, user menu.
  Consumer: the same minus the last-saved label (nothing saved in that session yet), so Save, sep, mode switch, sep, sep, Help, user.

### 4.3 The gestures (the oracle, raw `values` before → after)

| id | gesture (overlay, no profile) | before → after |
|---|---|---|
| C1 | goal 1..1, menu «Change…», G2 (offered G1, G2) | [G1] → [G2] |
| C2 | teacher 0..1, «Remove from the list» | [T1] → [HOLE] |
| C3 | teacher, «Link existing Teacher», T2 | [HOLE] → [T2] |
| C4 | learners, remove L2 | [L1,L2,L3] → [L1,HOLE,L3] |
| C5 | learners, link L4 (offered L2, L4) | → [L1,HOLE,L3,L4] |
| C6 | rooms 0..2, link R2; then the foot reads «Slot full [2/2]» | [R1] → [R1,R2] |
| C9 | learners, «New Learner & link» | → […, Learner_0] (created at root) |
| C10-C15 | title, duration, budget, active, level, tags | Intro→Intro2, 90→91, 12.5→13.25, true→false, Medium→High, +gamma |
| C16, C17 | inline Phase_0: mentor «Change…» T1 (offered (none), T1, T2); minutes 30→45 | [T2]→[T1], [30]→[45] |
| C18 | «Add Phase» | [Phase_0,Phase_1] → [+Phase_2] |
| C19-C22 | drill Phase_0, Step_0, Back ×2; T1 opened from inline Phase_0 | crumbs as expected; scroll 845 → 845; Back from T1 → Scenario_0 |
| C23 | drill Phase_1, header Delete, confirm | Phase_1 gone; the detail is back on Scenario_0 |
| C24 | rename Scenario_1 through the identity row | DObject.name «Scenario_one» |
| C25 | empty `assessment` field picker offers (none), Assess_free, Assess_0; pick Assess_free | [] → [Assess_free], moved in (DValue) |
| C27 | × on Phase_2 in Scenario_2's `phases` list | [Phase_2] → [HOLE], Phase_2 back at the model root |

Profile «Edu»: D3 «Link existing Learner» offers [L2] (plain reference to a `read` type: offered); «New Learner & link» reads «Not
editable with this profile»; D4 goal «Change…» offers G1, G2; the «Add» bar has «Add Phase» and, for `assessment`, «Not editable
with this profile».

### 4.4 Empty instance (B3, Scenario_1, canvas mounted)

Summary «1 error2 warnings»; duration's message «Object "Scenario_1" is missing required attribute "duration"»; every reference
section «No <T> linked yet.», with «Link existing» and «New … & link», except frozen («Read-only reference») and topic («Abstract
metaclass — it has no direct instances», no «New»); «Add» bar offers Add Assessment and Add Phase.

### 4.5 The read gate (D2.children, D5)

`ReadOnlyGate` (`InstanceDetail.tsx:675-686`) is `pointer-events: none; opacity: .75` (`instanceManagerTab.scss:2289-2292`) and its
note reads «Read only for this profile». Inside the gate of Assess_0 and of L1: `gateFocusables` = [4] each, enabled and tabbable.
The panel renders a `read` element without inputs (§6), which closes this whatever the keyboard does.

### 4.6 The app bar code (`Navbar.tsx:1986-2030`)

`{project && <LastSavedIndicator />}`, `{project && <button className="appbar-save">}`, `{project && <div className="appbar__sep" />}`,
the mode switch, an unconditional `appbar__sep`, `{project && <div className="appbar__sep" />}`, Help. `consumer` exists at `:590`
(`isConsumerMode()`, re-read on `hashchange`). Ctrl/Cmd+S stays for the consumer (`:1874`).

## 5. Census: what `InstanceDetail` does in the Configurator, and how the panel keeps it

| # | behaviour | where today | in the panel |
|---|---|---|---|
| 1 | drill-in, pass-through step from an inline child | `InstanceDetail.tsx:817-832` | same code over `jjform/nav` (`navFor`, `drillInto`); C19-C22 are its oracle |
| 2 | breadcrumb, a click truncates | `:1049-1085` | same, new classes |
| 3 | Back and its scroll restore per depth | `:802-848`, `:864-870` | same (refs per depth, layout effect) |
| 4 | survivor after a delete | `:856-862` (`survivorOf`) | same |
| 5 | read gate | `:675-686`, `:1132`, `:1168` | **improved**: descriptors set `isReadOnly`, no input rendered; «Read only for this role» note |
| 6 | hidden: features, sections, children, child slots, rows, navigation | IRForm `withoutHiddenFeatures`; `:1014`, `:910`, `:884`, `:534`, `:818` | same filters, same functions |
| 7 | candidates for the profile | `:770-775` (`offerForProfile`) | same |
| 8 | locked value in a containment slot | `:148-161` (`isLockedValue`), IRForm `isLocked` | same: no remove/change on a locked reference row, no delete on a locked child card |
| 9 | in-flight create guard (#173) | `ConfiguratorTab.createIn` | the host's, unchanged |
| 10 | create and link | `ConfiguratorTab.createAndLink` | the host's, plus the optional index of Q4 |
| 11 | summaries of a target | `:941-949` | same calls (`resolveIRView`, `resolveFormSpec(…,'manager')`, `referenceSummary`), also for composition cards (task 10) |
| 12 | the view: labels, order, hidden, widgets | IRForm (`describeSlots`, `orderFields`), `:982-1016` | same, through `describeSlots` and `orderFields`; compartments' titles and the view's theme preset **dropped** (the three sections are #187's) |
| 13 | per-field diagnostics and the summary chip | IRForm `:426-475`, `:552-582`; sections `:362-366`, `:519-531` | `collectFormDiagnostics` per object; IRFormField keeps its message slot; components get the same message line; the chip in the header (Q5) |
| 14 | refusal messages | IRFormField; `:391-400`; IRForm `:457` | same: IRFormField's own, the panel's `consume`, the identity's copy |
| 15 | dirty marks | IRForm `:442-451`; `:374-378` | per field (IRFormField `dirty`), per component, and `*` in the header |
| 16 | broken pointer rows | `refSlotControls` `broken`; `:545-556` | a muted card with a warning glyph, removable |
| 17 | references the view author hides (R-REF-6) | `:992-1012` | same filter: rows that open, «+ New», nothing else |
| 18 | read-only and derived features | IRFormField read-only branch; `lockedBy` | same; the title prints «derived» |
| 19 | auto-id attributes | `useFormWidgets.ts:329-330` | same descriptor (serial measured read-only with lock) |
| 20 | singleton and abstract targets | `:1007` (`newInstanceReason`), `addChildReason` | same reasons, on a disabled «+ New» / «+ Add» |
| 21 | header Delete under the instance's permission | `:1041`, `:1117-1129` | the header band's Delete |
| 22 | identity: name slot or `setObjectName` | IRForm `:521`, `:585-647` | Identity section: the `name` field via IRFormField, else TextWidget + `setObjectName` |
| 23 | the «Add» bar | `:1255-1284` | «+ Add <Type>» under each multi composition, «+ New» on an empty single one, same gate |
| 24 | the row menu and its shield (R-REF-3/6/7) | `:176-295` | replaced by card icons (R-CFG-2); the double-click hazard the shield covered is covered by ignoring the second click of a double click on remove |
| 25 | composition form field: pick existing, × evict | IRForm «Children» (`ReferenceWidget`, `ListWidget`) | **dropped** (#187 task 9): Q1 |
| 26 | Basic/Advanced, «PROPERTIES», identity badge row | IRForm `:532-547` | **dropped** (#187 tasks 1, 4): every feature shown, as Advanced |
| 27 | the Data Manager palette | `ConfiguratorTab.tsx:526` (`data-palette`) | kept: the panel sits in the same wrapper |

## 6. Attribute shapes

`IRFormField`'s dispatch (`IRFormField.tsx:320-460`), measured in B2.fields: text (TextWidget, `ui/Input`), number with stepper
(NumberWidget; EInt step 1, EDouble 0.01), checkbox, native select (enum, literal pointer), the extended chip input for a multi-valued
EString (FL4 `chips`), read-only value with lock (isID EInt, derived, `changeable=false`, a locked single). Extended widgets (date,
datetime, duration, colour, email, url, growing textarea, rich text) come from the FL1 width map through `layout.widget`, the author's
`FormSpec.widgets` override wins (`overrideIsCompatible`).

The panel mounts `IRFormField` per attribute, with `layout` from `autoLayoutRows(inputFromDescriptor…)`, `offer`, `diagnostics`,
`dirty`, `onCommitted` and `isLocked`, exactly as `IRForm.tsx:686-706` does. Conditions measured in the code:
- the widgets read their scale from custom properties declared on `.ir-form` (`irFormStyle.scss:27-73`) and several rules are scoped
  under it (stepper value, chip input, focus): the attribute area is a `div.ir-form.ir-form--plain` with `themeVars(resolveFormTheme())`;
- the label row prints `0..1` (`IRFormField.tsx:492-494`): the panel prints its own title row and hides `.ir-field__labelrow` with
  one rule under its own root (no class renamed); the title is `<label for="ir-field-<slotId>">`, the id the field gives its control
  (`:167`); every widget already carries `aria-label={field.name}`; the «JjEL» hint of an authored textarea moves to the title;
- a `read` element: each descriptor is passed as `{ ...field, isReadOnly: true }`, so the dispatch takes its read-only branches; no
  widget, no `IRFormField` edit.
No shape is left without a widget: H1 holds.

## 7. The pickers

`ReferencePicker` cannot serve the mockup's dropdown: it has no foot for «+ New», and it closes on any `mousedown` outside its own box
(`ReferencePicker.tsx:106-113`), so a «+ New» drawn beside it is closed before its click lands. It may not be edited.

Recommendation: `configurator/ComponentPicker.tsx`, a portal on `document.body` placed by `computeListStyle(anchor)` (imported, as
`RefRowMenu` does): a search field, the candidates grouped as `groupTargets` groups them (`useFormWidgets.ts:210-221`), «(none)» when
the row may be removed and the slot is single, a foot with «+ New <Type>» or the reason it is not offered. Keyboard: focus in the
search on open, ArrowUp/ArrowDown, Enter picks, Escape and Tab close and give the focus back to the opener; it closes on an outside
`mousedown`, a scroll outside it, a resize. Candidates asked at open (S5), filtered by `offerForProfile`, the slot's targets not
offered on a multi-valued slot (`assignableOptions`).

## 8. Questions (each with its recommendation)

1. **Composition: pick existing and evict.** Today the composition field offers both (C25: Assess_free moved into Scenario_one's
   `assessment`; C27: Phase_2 evicted to the model root, R-NEST-4). #187 task 9: «creation only, no select»; the prompt's §COSA 7:
   delete through the host. An evicted child lands at the model root, where the Configurator lists only top-level types.
   Recommended: drop both, as #187 task 9 says; a child card deletes through the host's `openDelete`.
2. **Reference row glyph.** Mockup: trash on reference rows; R-CFG-2: remove unlinks, never deletes. A trash reads as delete.
   Recommended: `bi-x-lg` «Remove from the list» on reference rows (unlink), the trash only on composition cards (delete).
3. **The `*`.** `--color-accent` = slate-700 (`_colors-light.scss:118`), the title's colour; the mockup's asterisk is blue.
   Recommended: `--color-form-dirty-text` (sky-600, `_colors-light.scss:419`), the token of the fields' «Modified, not saved».
4. **«+ New» on a filled single reference.** The mockup offers it in the dropdown of a filled card. Today the section blocks it
   («Slot full [1/1]», B2.sections) and `ConfiguratorTab.createAndLink` (`:310-316`) appends, which on a 0..1 slot is the defect
   ticketed on 2026-10-12. Recommended: `createAndLink` takes an optional raw index; the panel sets the new target at the row's index (replace, the old one unlinked, never deleted).
5. **The header's issues chip.** Today one chip per form (4 on Scenario_0); the mockup draws one, by the title. Recommended: the element on screen plus its inline cards, summed; a click scrolls to the first field that carries the severity, in screen order.

## 9. Phase 2 plan

Step 0 (no commit): the probe's fixture renames the instances whose names the app also generates (`Phase_0..2` → `PhA`, `PhB`,
`PhC`, `PhFree`; `Step_0` → `StepA`; `Assess_0`/`Assess_free` → `AsA`/`AsFree`), fixes the tag-chip reader (`ir-chipinput__chip-text`),
and BEFORE is run again on the untouched tree, with the gates' baseline.

**Step 1 — consumer chrome** (3 files): `pages/components/Navbar.tsx` (`!consumer` around the last-saved label, Save, the mode switch
and the three separators; the developer's bar unchanged); `components/environment/ConfiguratorTab.tsx` (the chip moves into a title
group right after «Configurator»; «No role — full access»; tooltips «Role: <name>, from the ?profile= URL parameter» / «No role in the
URL: full access (developer)»; close stays right); `configuratorTab.scss` (the title group). Probe arms: developer bar kids equal to
BEFORE; consumer bar = Help, user menu, no `appbar__sep`; chip text, tooltip with «Role», chip left edge within 16 px of the title's
right edge, close at the right. Commit `feat(#187): consumer chrome, role chip beside the title (P-2026-10-14-1100)`.

**Step 2a — `panelModel.ts`** (2 new files): `configurator/panelModel.ts`, `configurator/__tests__/panelModel.test.ts`, tests first.
Signatures (pure, no `joiner`, no React; type-only imports):
- `cardinalityLabel(lower, upper)`: `'Optional, single' | 'Required, single' | 'Zero or more values' | 'Required, multiple'`
  (lower < 1 / ≥ 1 × upper = 1 / ≠ 1);
- `cardinalityText({ lower, upper, derived?, count? })`: «derived», or the label, plus « · n» when multi-valued (@tmaog's «[3]»);
- `typeLabel(typeName)`: the Ecore primitives without their `E` (EString → String, EInt → Int, as the mockup), others as they are;
- `partitionFields(fields)`: `{ identity, attributes, components }` — identity the `name` attribute when the class has one,
  references and compositions together in components, in the incoming (view) order;
- `componentKind(f)`: `'composition' | 'reference'` (`isComposition`, aggregation counted as a reference, as `shape.refs`);
- `foldKey(classId)` = `jjodel.cfgPanel.folds.<classId>` (prefix checked absent: `command grep -rn cfgPanel src/` exit 1, control
  `jjodel.formPrefs` found); `parseFolds(raw)` / `serializeFolds(set)` (corrupt or unknown keys dropped);
- `createControl({ slotEditable, typeEditable, reason, full })`: `'enabled' | 'disabled' | 'hidden'` with its reason — hidden when the
  role forbids, disabled at the upper bound or on a `newInstanceReason`/`addChildReason`, enabled otherwise;
- `issuesText(errors, warnings)`: «No issues», «1 error», «2 errors, 1 warning»; `saveStatus(dirty)`: «Unsaved» / «Saved».
Tests: the four labels and two bounded uppers (0..5, 2..5), derived, the count; the primitives and a class named `Event`; partition
with and without a name slot and with a reference named `name`; folds round trip and corrupt input; the three create states; plurals.
Mutation bench (in the commit message): `lower < 1` → `lower <= 1`; `upper !== 1` → `upper === -1`; strip any leading `E`; drop the
`isReference` guard on identity; keep unknown fold keys; swap hidden and disabled; singular for 2.
Commit `feat(#187): panelModel, pure rules of the Configurator panel (P-2026-10-14-1100)`.

**Step 2b — the panel and its mount** (8 files, rule 19):
- `configurator/ConfiguratorPanel.tsx` (new): header band («<Type>» + `*` + « properties», issues chip, «Unsaved»/«Saved», Save
  through `saveProjectWithFeedback`, Delete through `openDelete`), breadcrumb and Back, the three sections of the element on screen;
  holds nav helpers, folds, dirty marks, diagnostics;
- `configurator/PanelFields.tsx` (new): Identity and Attributes of one object (`useIRFormView` + `describeSlots` + `IRFormField`);
- `configurator/PanelComponents.tsx` (new): reference cards and rows, composition cards (inline: Identity and Attributes editable,
  components simplified; past it: name + summary), «+ Add <Type>», «+ New»;
- `configurator/ComponentPicker.tsx` (new): §7;
- `configurator/configuratorPanel.scss` (new): prefix `cfg-panel` (absent: `command grep -rn "cfg-panel\|configurator-panel" src/`
  exit 1; control `configurator__header` found, exit 0), tokens only (rules 27, 28);
- `components/environment/ConfiguratorTab.tsx`: mounts `ConfiguratorPanel` in place of `InstanceDetail` in the same wrapper, same
  handlers; `createAndLink` takes the optional index (Q4);
- `components/environment/configuratorTab.scss`: only if the wrapper's layout needs it;
- the scss of step 1 is the same file.
Probe arms, the 14 criteria read from the DOM: (1) no `[aria-label="Form detail level"]`, no mode switch for the consumer; (2) Save
and status in the band, an edit turns «Saved» into «Unsaved» and `*`, Save changes `lastModified` and clears both; (3) chip by the
title; (4) band «Scenario properties», no instance name; (5) issues chip by the title, Scenario_1 «1 error, 2 warnings» and the click
lands on duration; (6) sections Identity / Attributes / Components in order, Identity holds name only; (7) each heading a button with
`aria-expanded`, a fold survives a reload; (8) titles such as «duration (Required, single) [Int]», «tags (Zero or more values · 3)
[String]»; (9) no «References» / «Children» group, no `.instance-manager__refs`; (10) reference picker with search, candidates and
«+ New», raw `values` of C1-C6, C9, D3, D4 equal the BEFORE table; (11) compositions: no picker, «+ Add Phase» disabled at the upper
bound, C18 equal; (12) StepA inside PhA's card is name + summary, no input; (13) instance list and type bar unchanged, C19-C23 crumbs,
Back, scroll and survivor equal; (14) L1 (read) after a drill-in has no enabled input and no Delete, Assessment's card no input and no
delete, vault absent, candidates equal D3/D4. Plus: the Data Manager's `renderSig` (text and class census) equal to BEFORE on Scenario_0
and on Phase_0. `_tmp_157_b_verify.ts` adapted (its selectors move from `.ir-ref`/`.ir-list` to the panel's cards).
Commits: `feat(#187): the Configurator panel's components (P-2026-10-14-1100)` for the new files, then
`feat(#187): ConfiguratorTab mounts the panel (P-2026-10-14-1100)`; the intermediate state is unused files, nothing worse.

Gates per step, foreground, complete output: `npm run typecheck` (exit 0), `npm run test` (the nine files of §17 red at import, nothing
else), `npm run build`, `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`, the smoke through `_tmp_172_smoke.ts`.

Visual checklist for Juri (prepared at the closure): the page with «Edu» (edit, read and hidden types); the developer overlay; a nested
composition (PhA with StepA); a multi-valued reference (learners: rows, remove, «+ Add target»); Save and the status.

## 10. Dependencies and risks

- **#167**: «No issues» is not computed for a consumer whose page mounts no canvas (the producers live in the editor, #167 body).
  Not measured here: B3's counts came with the model's canvas mounted, and D2's Scenario_0 has no issue in the overlay either. The
  chip moves next to the title, as the mockup asks; #167 is the fix.
- **Two surfaces**: after step 2b the Configurator and the Data Manager are two (R-CFG-2). The panel imports the same pure rules, so a
  rule change still reaches both; a markup change does not.
- **Cross-deps key**: `useIRFormView` publishes under `form:<objectId>` and clears it on unmount; the panel calls it once per object
  on screen, as `IRForm` did.
- **`IRFormField`'s hidden label row**: a scoped rule; if `IRFormField` changes its label row the panel's rule may need to follow.
  The probe reads the title from the panel's own element, not from the field.

## Decisions taken (unattended)

Within the lane's perimeter, each to be reviewed at the visual check:
1. Attributes through `IRFormField` mounted by the panel, its label row hidden by a rule under `.cfg-panel` (§6).
2. A `read` element renders through descriptors with `isReadOnly: true` (no input), note «Read only for this role» (§4.5).
3. Basic/Advanced removed means every feature is shown (as Advanced); `FormSpec.basic` is not read by the panel.
4. The view's compartment titles and theme preset do not apply (three fixed sections); its labels, order, hidden and widgets do; a
   composition the author hides keeps its cards and its create, as `InstanceDetail` keeps them today.
5. The Data Manager's palette wrapper (`instance-manager configurator__dm` with `data-palette`) stays around the panel.
6. Type names in titles drop the Ecore `E` of primitives (mockup «[String]», «[Int]»); Identity's title has no cardinality (mockup).
7. A multi-valued title adds « · n», the number of values held.
8. Dirty marks per object, kept until the save (not reset when another instance is picked), so `*` is true on return.
9. «+ Add <Type>» is disabled with its reason at the upper bound or on an abstract target, absent when the role forbids the create.
10. The consumer's app bar loses all three separators; Ctrl/Cmd+S stays.
11. A second click of a double click on a remove glyph is ignored (the hazard `MenuShield` covered).
12. Components in a two-column grid, as the mockup; attributes keep the 12-column auto-layout of the form.
13. New class prefix `cfg-panel`, fold key `jjodel.cfgPanel.folds.<classId>`, own picker `ComponentPicker`.

## Decisions awaiting Juri

None of the RC-26 list: no critical-zone file is edited, no exported interface changes, no ratified R- row is amended, nothing is
deleted, the push is not this lane's. The questions of §8 carry their recommendations (RC-21).
