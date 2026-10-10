## 0. Answer in brief

- **Prompt-ID** `P-2026-10-10-1545` (chat `C-2026-10-10-1540`), issue #172, session `b7c8364e-c487-471a-8aa9-19939209897e`, worktree `jjodel-172`, branch `feat/172-references-once`, HEAD `094c82bab`, executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.
- **Answer.** The doubling is reproduced in both hosts, for the subject and for the inline child (probe `MODE=before`, three runs, the last two identical on all 37 gesture lines, exit 0, no page error): every non-containment reference is one form field AND one list section. It can be removed without a new write path: the section calls the three existing `formWrite` functions with the row's RAW index, and one optional prop of `IRForm` takes the reference fields out of the form.
- **Measured BEFORE, beyond the Context.** (1) The list ignores Basic/Advanced, `hidden`, `labels` and `order`: only the field reads them (§3.3). (2) A reference whose target cannot be created here (typed on an abstract class) has a field and no section while empty (§3.1). (3) Diagnostics exist only while the model's canvas is mounted; with a field gone they stay counted in the summary and are printed nowhere, and the summary chip focuses nothing (§3.4). (4) Two defects of today's doubled screen, reached with plain gestures: a 0..1 slot ends with two targets (§3.5), and the chip picker links the same target twice (§3.6).
- **Recommendation.** Option (a) of §5: one optional prop on `IRForm`, `hostReferences`, absent meaning today's form. Three steps (§11): the pure rule in `jjform/`, then the section takes the gestures, then the fields leave the form. Eight code files (rule 19, listed in §11.1). The two host files are not edited.
- **Deliberate differences from the field's oracle, two.** L6: the section does not offer a target the slot already holds. C5: «Change» writes at the row's raw index, so a 0..1 slot never gets a second target. Every other gesture must equal the BEFORE table, holes included (§3.2).

**Decisions awaiting Juri**

- J1. The double button as agreed in the issue; the separate issue was never filed. Proposed: the card stays the Open control as it is today, and one button at its right carries the action of the slot's kind (§9).
  Recommended: confirm two controls per row, Open (the card) and Change (single-valued) or Remove from the list (multi-valued).
- J2. The edit of `IRForm.tsx` (critical zone, `viewpoint/ir/`): the diff of §11.3, 16 lines added and 4 changed, with the Layer Impact Report of §11.4.
  Recommended: go-ahead for the diff as written, the report filed in `docs/lir/` before it.
- J3. R-FRM-1 says the author's `hidden` is the one gesture that removes a field. Option (a) removes fields from the form because the host lists them (#157 step B already does it for a profile, with no row in `docs/decisions.md`).
  Recommended: amend R-FRM-1 with one sentence: a host that renders a feature itself, next to the form, may ask the form not to render it; nothing disappears from the screen.
- J4. Capabilities of the field the section cannot take (§4, rows 15, 19, 24): the Basic/Advanced filter on references, the option colour on the selected value, the fold of the REFERENCES group.
  Recommended: accept the three; the list already ignores Basic/Advanced today, the card has no badge, the sections have no fold.
- J5. The summary chip that scrolls to a reference with a diagnostic (§4, row 12) is kept only by the `focusFirst` half of the prop of J2.
  Recommended: keep it, it is 3 of the 20 lines of the diff; without it a click on «1 warning» does nothing (measured, D6).
- J6. The children (§10): the same prop could take the CHILDREN fields, and the gesture that moves an existing element into a composition would go with them.
  Recommended: nothing in this lane; it is #166's design.

**Questions**

- Q1. A reference the view author hid is listed by today's section (measured, D1). After #172, does it keep exactly today's section (Open and «New … & link», no new gesture), or does `hidden` remove the section too?
  Recommended: keep exactly today's section for a hidden reference; removing it takes away a navigation the user has (rule 3).
- Q2. The heading: print the multiplicity as the field did (`1..1`) next to today's `[1/1]`?
  Recommended: yes, until #166 replaces both with the agreed cardinality labels.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | In the detail every non-containment reference is on screen twice, in both hosts, for the subject and the inline child. | Holds (measured) | A3, A5, E2, E2.child: «field 1 · section 1» for every key |
| H2 | `<IRForm` has two mounts, both in `InstanceDetail.tsx`, both `host="manager"`; `rail` and `nodeForm` have none. | Holds (read, with a control) | §5.1 |
| H3 | A slot is listed only with targets or with a create offered: an empty reference whose target cannot be created is reachable from the field alone. | Holds (measured) | A1: `topic` «field 1 · section 0» |
| H4 | Everything the field does to a reference goes through `formWrite.setValue`, `clearValue`, `appendValue`. | Holds (read and measured) | §4, §3.2 |
| H5 | The list shows a reference the author hides, and one outside Basic in Basic mode. | Holds (measured) | D1, A2, A4 |
| H6 | A diagnostic on a reference with no field is counted and not shown. | Holds (measured) | D5, D6 |
| H7 | The fields can leave the form without an edit under `viewpoint/ir/`. | Falsified (read) | §5: every option edits a file of that directory, or hides by CSS |
| H8 | The five test files of the Context are the only source-text tests on the lines Phase 2 changes. | Partly (measured) | §8: a sixth, `irFormAnnotationSubscription.test.ts`, pins two strings of `IRForm.tsx`; the diff leaves both untouched |

## 2. Files read

Whole files: `CLAUDE.md` (root), `docs/PROTOCOL.md`, `frontend/src/components/editor-v2/CLAUDE.md`,
`frontend/src/styles/CLAUDE.md`, `docs/log-inbox/data-manager-ux.md`,
`frontend/src/components/abstract/tabs/InstanceDetail.tsx`,
`frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx`, `IRFormField.tsx`, `formSections.ts`, `formHosts.ts`,
`formWrite.ts`, `formPermissions.ts`, `formDiagnostics.ts`, `slotValues.ts`, `useFormWidgets.ts`,
`widgets/ReferenceWidget.tsx`, `widgets/ReferencePicker.tsx`,
`frontend/src/components/editor-v2/hooks/shapeAdapter.ts`, `multiDraw.ts`, `writeCtxLproxy.ts`,
`frontend/src/jjform/writeCtx.ts`, `frontend/scripts/smoke/_tmp_173_verify.ts`, `_tmp_157_b_setup.js`.

Windows, reported as windows: `docs/decisions.md` lines 1-40, 118-217, 3818-3852, 3909-3920, 5294-5302, 5796-5867
(of 5867) and a `command grep` for `R-FRM-1`, `#157`, `profile`; `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`
84-171 (of 187); `docs/discovery/discovery_2026-09-28_158_data_manager_ux.md` 60-155 (of 155); `docs/claude-code-log.md`
1-30 and its first twelve headings; `InstanceManagerTab.tsx` 2255-2334 (of 3249) and the grep hits for the detail's
props; `ConfiguratorTab.tsx` 160-329 (of 577); `irResolveCore.ts` 100-329; `instanceTable.ts` 660-729;
`DataManagerViewpointPanel.tsx` 120-209; `widgets/ListWidget.tsx` 1-60; `widgets/ChipInputWidget.tsx` 95-175;
`formAutoLayout.ts` 395-408; `jjform/shape.ts` 71-144; `jjform/create.ts` 165-251; `jjform/index.ts` 250-283;
`instanceManagerTab.scss` 1235-1320, 2028-2156; `_tmp_182_probe.ts` 1-95; `_tmp_157_b_verify.ts` 150-275;
`states.ts` 170-210, 300-420; the four test contexts quoted in §8.

Also windows: `frontend/scripts/smoke/README-probes.md` 24-41 and its headings (of 357).

Not read: the other widgets (`TextWidget`, `NumberWidget`, `CheckboxWidget`, `SelectWidget`, `ChipsWidget`);
`LModelElement.tsx`; the two screenshots of the issue (the chat's reading of them in the prompt was taken as given).

Probe: `frontend/scripts/smoke/_tmp_172_probe.ts` (gitignored, `.gitignore:68`), run three times through
`node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_172_probe.ts --port 3172 --id P-2026-10-10-1545`.
Log `~/.jjodel-lanes/P-2026-10-10-1545/probe-_tmp_172_probe.log` (the three runs appended); oracle
`~/.jjodel-lanes/P-2026-10-10-1545/172_oracle_before.json` (29 gestures, sha256 `8b25bb8f52fc1baa…`). Run 1: exit 1,
three FAIL that were the probe's own (it deleted the authored view with `.delete()`, the form spec stayed applied, and
the Configurator arms looked for a field labelled `goal` that was printed «Objective»). Run 2 and run 3: exit 0, ALL
GREEN, `pageErrors: none`; the 37 gesture lines of the two are identical (`diff` exit 0). Every number below is run 3.

## 3. BEFORE (measured on `094c82bab`, probe `MODE=before`)

Fixture MM172: `Session { goal 1..1 → Goal, teacher 0..1 → Teacher, learners 1..* → Learner, rooms 0..2 → Room,
frozen 0..1 → Goal with changeable=false, topic 0..1 → Topic (abstract; MathTopic extends it), phases ◇→ Phase }`,
`Phase { mentor 0..1 → Teacher, attendees 0..* → Learner }`. Instances `Session_0`, `Session_1`, `Phase_0` (in
`Session_0.phases`), `G1 G2 T1 T2 L1..L4 R1..R3 M1`. Profile «Edu»: Learner `read`, Room `hidden`, Phase `read`. Real
gestures on the form field and on the section (P11); the fixture is built through the store.

### 3.1 The doubling: per reference key, form fields and list sections

| Arm | Host, state, mode | goal | teacher | learners | rooms | frozen | topic |
|---|---|---|---|---|---|---|---|
| A1 | Data Manager, `Session_0` empty, Advanced | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 | **1 · 0** |
| A2 | Data Manager, empty, Basic | 1 · 1 | 0 · 1 | 1 · 1 | 0 · 1 | 0 · 1 | 0 · 0 |
| A3 | Data Manager, filled, Advanced | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 |
| A4 | Data Manager, filled, Basic | 1 · 1 | 0 · 1 | 1 · 1 | 0 · 1 | 0 · 1 | 0 · 1 |
| E2 | Configurator, filled, Advanced | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 |
| F11 | Stand-alone page, profile «Edu» | 1 · 1 | 1 · 1 | 1 · 1 | 0 · 0 | 1 · 1 | 1 · 1 |

Each cell is «fields · sections». Inline child `Phase_0`: `mentor` 1 · 1 and `attendees` 1 · 1 in the Data Manager
empty (A1.child) and filled (A5), in the Configurator (E2.child) and under the profile, where its form is inside the
read-only gate (F12, `gated: true`).

What an empty writable slot shows today (A1.detail): the field («(empty)» or no chips) and the section with
«No Goal linked yet.» and «New Goal & link». `frozen` (read-only, holding `G1`): the field `readonly` with the lock,
and the section with one row and the reason «Read-only reference». `topic` empty: the field alone, because
`newInstanceReason` answers «Abstract metaclass…» and the filter drops the slot:

- `InstanceDetail.tsx:464` — `.filter(s => s.targets.length > 0 || s.createReason === null)`

### 3.2 The oracle: the slot's raw `values` after each gesture of the form field

| Id | Gesture | Raw before | Raw after | Candidates offered |
|---|---|---|---|---|
| G1 | goal 1..1: pick G1 into the empty slot | `[]` | `[G1]` | G1, G2 |
| G2 | goal 1..1: change G1 → G2 | `[G1]` | `[G2]` | G1, G2 |
| G3 | goal 1..1: open the picker, close | `[G2]` | `[G2]` | G1, G2: **no «(none)»** |
| T1 | teacher 0..1: pick T1 into the empty slot | `[]` | `[T1]` | (none), T1, T2 |
| T2 | teacher 0..1: change T1 → T2 | `[T1]` | `[T2]` | (none), T1, T2 |
| T3 | teacher 0..1: unset with «(none)» | `[T2]` | `[HOLE]` | (none), T1, T2 |
| T4 | teacher 0..1: pick T1 after the unset | `[HOLE]` | `[T1]` | (none), T1, T2 |
| L1 | learners 1..*: append L1 | `[]` | `[L1]` | L1, L2, L3, L4 |
| L2 | learners 1..*: append L2 | `[L1]` | `[L1, L2]` | L1, L2, L3, L4 |
| L3 | learners 1..*: append L3 | `[L1, L2]` | `[L1, L2, L3]` | L1, L2, L3, L4 |
| L4 | learners 1..*: remove L2, the middle of three | `[L1, L2, L3]` | `[L1, HOLE, L3]` | |
| L5 | learners 1..*: append L4 after the hole | `[L1, HOLE, L3]` | `[L1, HOLE, L3, L4]` | L1, L2, L3, L4 |
| L6 | learners 1..*: append L1 again | `[L1, HOLE, L3, L4]` | `[L1, HOLE, L3, L4, L1]` | L1, L2, L3, L4 |
| R1 | rooms 0..2: append R1 | `[]` | `[R1]` | R1, R2, R3 |
| R2 | rooms 0..2: append R2 (the upper bound) | `[R1]` | `[R1, R2]` | R1, R2, R3 |
| P1 | topic 0..1 on the abstract Topic: pick M1 | `[]` | `[M1]` | (none), M1 |
| C1 | child `Phase_0`, mentor 0..1: pick T1 | `[]` | `[T1]` | (none), T1, T2 |
| C2 | child `Phase_0`, attendees 0..*: append L1 | `[]` | `[L1]` | L1..L4, Learner_0 |
| C3 | child `Phase_0`, mentor 0..1: unset | `[T1]` | `[HOLE]` | (none), T1, T2 |
| C5 | child `Phase_0`, mentor in the state of §3.5: the FIELD picks T2 | `[HOLE, Teacher_0]` | `[T2, Teacher_0]` | (none), T1, T2, Teacher_0 |
| D4 | `Session_1`, goal (field labelled «Objective»): pick G1 | `[]` | `[G1]` | G1, G2 |
| E3 | Configurator, goal 1..1: change G2 → G1 | `[G2]` | `[G1]` | G1, G2 |
| E4 | Configurator, teacher 0..1: unset | `[T1]` | `[HOLE]` | (none), T1, T2, Teacher_0 |
| E5 | Configurator, learners: remove L3 | `[L1, HOLE, L3, L4, L1, Learner_0]` | `[L1, HOLE, HOLE, L4, L1, Learner_0]` | |
| E6 | Configurator, learners: append L2 | `[L1, HOLE, HOLE, L4, L1, Learner_0]` | `[…, Learner_0, L2]` | L1..L4, Learner_0 |

The section's own gestures today, unchanged by this lane and measured as controls: S1 and E8, a row opens its target
as the form body (`head` reads `G2`, then `G1`); S2, «New Learner & link» in the Data Manager (draft dialog, Create)
appends `Learner_0`; E7, the same in the Configurator (created directly) appends `Learner_1`; C4, on `Phase_0.mentor`.
R3: at the upper bound the field's add control is `disabled` with title «Maximum 2», and the section's foot reads
«Slot full [2/2]».

Positive controls of the probe: G1.ok (the pick landed, so the probe drives the field), L4.hole (R-FORM-7 reproduced:
the removal leaves a hole, raw length 3), D1.ctl and D2 (the authored view reached the form, and left it).

### 3.3 What only the field reads: Basic, `hidden`, `labels`, `order`, the fold

- **Basic/Advanced.** A2 and A4 above: in Basic the fields of `teacher`, `rooms`, `frozen`, `topic` are gone and their
  sections are all there. The list does not follow the mode.
- **`hidden`, `labels`, `order`** (D1, a view of `Session` in the Data Manager viewpoint with
  `form: { features: { teacher: 'hidden', learners: 'hidden' }, labels: { goal: 'Objective' }, order: ['rooms'] }`):
  reference fields in order `rooms, Objective, frozen, topic`; sections in order `goal, teacher, learners, rooms,
  frozen, topic`; `teacher` and `learners` «field 0 · section 1»; the section's heading reads `goal`, not «Objective».
- **The fold** (A6): a click on the heading of the form's REFERENCES group sets `aria-expanded="false"`, the six
  reference fields leave the DOM, the six sections stay, and `jjodel.formPrefs.default` holds
  `{"mode":"advanced","collapsed":["references"]}`.

### 3.4 Diagnostics

- B1, with the model's canvas mounted (`<ConformanceProblemSync>` is mounted by `EditorV2.tsx:4506` and nowhere else):
  the summary reads «2 warnings» and the message `Object "Session_0": reference "goal" has 0 links but min is 1` is
  under the `goal` field, the twin under `learners`. They are warnings, not errors.
- B2: a click on the summary chip puts the focus on the `goal` field's control (`ir-field__control ir-ref`).
- D3 to D6, `Session_1` under the view that hides `learners`: with `goal` set the summary reads «1 warning», no field
  carries a message, the text `reference "learners" has 0 links` is nowhere in the Data Manager (count 0), and a click
  on the chip leaves the focus on the chip (`ir-form__chip ir-form__chip--warning`, `field: null`). This is the state
  every reference diagnostic reaches once its field is gone, unless the section prints it.
- F14, the stand-alone page, `Session_1` with `learners` required and empty: «No issues», no message. No canvas, no
  producer. Out of this lane, noted because the section's diagnostics will be empty there for the same reason.

### 3.5 A 0..1 slot with two targets, in three plain gestures

C3, C4, C5 on `Phase_0.mentor` (0..1): unset from the field leaves `[HOLE]`; «New Teacher & link» from the section
appends, `[HOLE, Teacher_0]`; now the FIELD shows «(empty)» while the SECTION shows `Teacher_0` and «Slot full [1/1]»
(C4.view); a pick in the field writes position 0, `[T2, Teacher_0]`, and the section reads `Teacher [2/1]` with two
rows (C5.view). Causes, read:

- `IRFormField.tsx:168` — `const first = field.values[0];` and `:403` — `onPick={(id) => commitAt(0, id, true)}`
- `multiDraw.ts:39` — `return raw.filter(v => v != null && String(v).trim() !== '');` (the list reads the filled values)
- `ConfiguratorTab.tsx:315` — `if (id) appendValue(sourceId, refKey, id, true);`, the same call at
  `InstanceManagerTab.tsx:2319`

Not the double click of the ticket of 2026-10-04: no click is repeated. With the field gone and the section writing
at the row's raw index this path closes by construction (`[HOLE, Teacher_0]` then Change gives `[HOLE, T2]`).

### 3.6 The chip picker links a target twice

L5.offer and L6: the picker of the chip field offers `L1` and `L3` while the slot holds them, and picking `L1` again
appends it. The section then lists «L1: Learner» twice (A3.detail), on two rows with the same React key
(`InstanceDetail.tsx:150` — `key={targetId}`). The chip path does not filter, the list widget does:

- `IRFormField.tsx:505` — `options={getOptions()}`
- `ListWidget.tsx:74` — `setOpenAddable(assignableOptions(getOptions ? getOptions() : options, values));`

### 3.7 The profile

F11.detail: `rooms` (typed on a `hidden` class) has no field and no section. `learners` (target type `read`, a plain
reference): the field is a full chip input, and F13 its picker offers every Learner; the section's foot reads «Not
editable with this profile». F12: the form of `Phase_0` (a `read` type) is inside the gate, its nested sections are
listed with their reasons. The gate is CSS on the form's wrapper and does not cover the section:

- `instanceManagerTab.scss:2153-2156` — `&__ro-body { pointer-events: none; opacity: 0.75; }`
- `InstanceDetail.tsx:619-636`: `<ReadOnlyGate>` closes before `<RefSlotsSection … nested`

So a control the section gains must check the source's permission itself (§7, `sourceEditable`).

## 4. Census of the field

«Taken» says how the section does it in Phase 2. M = measured in §3, R = read.

| # | Capability of the field | Where | BEFORE | In the section |
|---|---|---|---|---|
| 1 | Pick into an empty single slot | `IRFormField.tsx:403` → `formWrite.ts:341` | M: G1, T1, T4, P1 | Taken: foot «Link existing <Type>», picker, `setValue(id, key, 0, target, true)` |
| 2 | Change the target | same line | M: G2, T2, E3 | Taken: row «Change», picker opened on the current target, `setValue` at the row's raw index |
| 3 | Unset, only when the lower bound is 0 | `IRFormField.tsx:401` `allowNone={field.lowerBound < 1}`, `:404` | M: T3, C3, E4; G3 no «(none)» | Taken: «(none)» in the Change picker, `clearValue` at the row's raw index |
| 4 | Append an existing target | `IRFormField.tsx:347-349`, `:510` → `formWrite.ts:366` | M: L1-L3, L5, R1, R2, C2, E6 | Taken: foot «Link existing <Type>», `appendValue(id, key, target, true)`; a target already held is not offered (§3.6) |
| 5 | Remove one, leaving a hole | `IRFormField.tsx:339-341` → `formWrite.ts:354` | M: L4, E5 | Taken: row «Remove from the list», `clearValue` at the row's raw index; the target is not deleted |
| 6 | Candidates asked when the picker opens (S5) | `IRFormField.tsx:208-211`, `IRForm.tsx:307-313`, `jjform/writeCtx.ts:255` | M: the «offered» column | Taken: `targetOptions(makeWriteCtx(), id, key)` in the click that opens the picker |
| 7 | The upper-bound gate | `useFormWidgets.ts:410-413` | M: R3 | Taken: no «Link existing» at the bound; «Slot full [n/m]» stays |
| 8 | The required dot | `IRFormField.tsx:478-480` | M: `req` in A1.detail | Taken: in the heading |
| 9 | The multiplicity, or «derived» | `IRFormField.tsx:492-494` | M: `1..1`, `0..2` | Taken: in the heading (Q2) |
| 10 | The lock and the read-only rendering | `IRFormField.tsx:481-483`, `:352-359` | M: `frozen[readonly,lock]` | Taken: lock in the heading, rows with Open only. A read-only slot is listed even when empty, or its «empty» would be nowhere |
| 11 | The diagnostics of the feature | `IRForm.tsx:412-417`, `:682`; `IRFormField.tsx:520-532` | M: B1 | Taken: under the heading, from `useNodeProblems(id)` and `collectFormDiagnostics` (imports). The summary count does not change (D5) |
| 12 | The summary chip scrolls to the field | `IRForm.tsx:448-459` | M: B2, D6 | Taken only with `hostReferences.focusFirst` (J5); otherwise lost |
| 13 | The host's refusal of a write | `IRFormField.tsx:189-203` | R | Taken: a message line under the heading, the reason verbatim |
| 14 | The dirty mark | `IRForm.tsx:428-437`, `IRFormField.tsx:468` | M: «Modified, not saved» in A3.detail | Taken: a dot in the heading, the same reset (`U.isProjectModified` false, another subject) |
| 15 | The Basic/Advanced filter | `IRForm.tsx:247`, `:384-387`; `useFormWidgets.ts:397-401` | M: A2, A4 | **Lost for references**: the mode is state inside `IRForm`; the list ignores it today. J4 |
| 16 | `FormSpec.order` | `IRForm.tsx:384`, `formHosts.ts:65` | M: D1 | Taken: `orderFields` on the slots; changes today's section order where an order is authored |
| 17 | `FormSpec.labels` | `useFormWidgets.ts:385`, `IRFormField.tsx:475` | M: D1 | Taken: the heading prints the label |
| 18 | `hidden`, `features: 'hidden'` | `useFormWidgets.ts:428`, `:433` | M: D1, «field 0 · section 1» | Today's section is kept as it is for a hidden reference, with no new gesture (Q1) |
| 19 | The option colour on the selected value | `ReferenceWidget.tsx:114`, `:138`; `IRFormField.tsx:288` | R | **Lost on the row** (the card has no badge); the picker keeps its colours. J4 |
| 20 | Profile: a feature typed on a hidden class | `formPermissions.ts:84-98`, `IRForm.tsx:374-378` | M: `rooms` 0 · 0 | Already the section's (`InstanceDetail.tsx:466`) |
| 21 | Profile: the offer | `formPermissions.ts:101-109`, `IRForm.tsx:307-313` | M: F13 | Taken: `offerForProfile(…, featureAccessIn(…), reads)`; `ProfileReads` is rebuilt as at `IRForm.tsx:287-301` (twelve lines repeated: `formPermissions.ts` is outside the DOVE) |
| 22 | Profile: a locked value (aggregation slots) | `formPermissions.ts:112-116`, `IRForm.tsx:687-689` | R: no aggregation in the fixture | Taken: `isLockedValue` → the row has Open only. To be measured in Phase 2 |
| 23 | Profile: a `read` source | `InstanceDetail.tsx:583`, `:619` | M: F12 | Taken by the rule, not by the gate (§3.7): Open only |
| 24 | The fold of the REFERENCES group | `IRForm.tsx:255-266`, `:653-663` | M: A6 | **Lost**: the sections have no fold. A stored `collapsed: ['references']` matches no section and is inert. J4 |
| 25 | «to X» beside a row | `IRFormField.tsx:243-253`, used at `:368` | R: `ListWidget` only, and the measured fields are chips | Not carried; the card's key fields (#158 P4) say more |
| 26 | A broken pointer, drawn and removable | `IRFormField.tsx:279-288`, `ChipInputWidget.tsx:110` | R: none was produced | Taken by the rule: a broken row with its action and no Open. Today the list drops it (`multiDraw.ts:122-126`) |
| 27 | Widget override, `inline` / `list` | `useFormWidgets.ts:316-317`, `:338-342` | R | Nothing to lose: on a reference `select` is never reached (`IRFormField.tsx:390` precedes `:427`) |
| 28 | The picker's keyboard | `ReferencePicker.tsx:122-130` | R | Same component |

## 5. How the fields leave the form

### 5.1 Who is affected

`command grep -rn '<IRForm' frontend/src` (BSD grep, exit 0): two mounts, `InstanceDetail.tsx:584` and `:620`, both
`host="manager"`; the other hits are five test lines, one comment and `<IRFormField`. Positive control, same tool:
`command grep -rn '<RefSlotsSection' frontend/src` gives its two mounts (`:627`, `:669`). One import of the component
(`InstanceDetail.tsx:39`). So `rail` and `nodeForm` (`formHosts.ts:32`) have no mount today, and the form authoring
preview does not mount `IRForm`. `resolveFormSpec` has two callers: `IRForm.tsx:218` and `InstanceDetail.tsx:417`
(`summaryOf`).

### 5.2 The options

- **(a) An optional prop of `IRForm`**, absent meaning today's form. Files: `IRForm.tsx` (critical zone), the two
  mounts in `InstanceDetail.tsx`. Nobody else is affected: no other mount, `resolveFormSpec` untouched, so `summaryOf`
  and the cards' key fields are as today. R-FRM-1: the spec's rule is about what compartments and `hidden` do; here
  the feature stays on screen, rendered by the host. One sentence of amendment (J3). The removal #157 step B makes
  for a profile has no row: `command grep -c -E '#157|step B' docs/decisions.md` answers 0 (control `R-NEST-9`: 1).
- **(b) A rule of the `manager` host in the spec resolution.** `resolveFormSpec` is pure on the spec and answers
  «Undefined in, undefined out» (`formHosts.ts:40` — `if (!spec) return undefined;`); with no authored view, the
  normal case, there is no spec to carry the rule, and the function does not know the feature names. It would need the
  metaclass, a signature change of an exported function with two callers. And `summaryOf` feeds `referenceSummary`,
  which drops what the spec hides (`instanceTable.ts:705-706` — `!!spec?.hidden?.includes(key) || spec?.features?.[key] === 'hidden'`):
  the cards would lose every reference-valued key field. It also writes the removal into the `hidden` channel, which
  is R-FRM-1 amended at its centre. `formHosts.ts` is under `viewpoint/ir/` as well. Rejected.
- **(b′) `host === 'manager'` read inside `IRForm`, no prop.** One line, and the form of every future mount of that
  host would lose its references without a section to show them. Rejected: implicit.
- **(c) `IRForm` renders a node the host supplies in place of its References group.** The sections would sit inside
  the form's frame, with the group's count and fold. A larger edit of the critical-zone file (the group chrome, the
  nested child). The road if Juri wants the sections inside the form; not recommended.
- **(d) No edit under `viewpoint/ir/`.** Only by CSS (excluded by the prompt) or by a second form component, which
  `instanceManagerFl6.test.ts:77-83` forbids («la form montata e' UNA»).

**Recommendation: (a)**, as the diff of §11.3. It would be falsified by a third mount of `IRForm` that needs the
references gone without a host section, or by a test that pins a line the diff changes (the two strings pinned by
`irFormAnnotationSubscription.test.ts:123` and `:127` are left untouched on purpose, §8).

## 6. Where the writes are called from

**Recommendation: `InstanceDetail` calls them itself, imports only; no host event.** `InstanceManagerTab.tsx` and
`ConfiguratorTab.tsx` are not edited.

- Both hosts already write straight to the store from this panel: the embedded `IRForm` does (`formWrite`, «un commit
  per battuta», `InstanceDetail.tsx:541-550`), and both hosts call `appendValue` for the link (`InstanceManagerTab.tsx:2319`,
  `ConfiguratorTab.tsx:315`). Moving the same three calls from the field to the section adds no path. An event per
  gesture would be three new optional props, implemented twice with the same body.
- Create stays a host event (`onCreateAndLink`): the Data Manager opens its draft, the Configurator creates directly.
- **The profile.** The Configurator passes `permissionOf`; the section builds `ProfileReads` from it as `IRForm.tsx:287-301`
  does and filters the offer with `offerForProfile`. The Data Manager passes none and nothing is filtered.
- **The cardinality at the click** (the ticket of 2026-10-04). Every handler re-reads the slot's raw values from the
  live store (`store.getState().idlookup`, `findFeatureRaw`) and asks the rule of §7 again; a gesture the rule no
  longer offers does nothing. Change, unset and Remove address a RAW index and check that it still holds the value
  the row showed, so a repeated click finds a hole and `clearSlotValue` answers `writeUnchanged()` (`formWrite.ts:195`).
  A pick closes the picker (`ReferencePicker.tsx:116-120`), so two picks take two openings. The probe of Phase 2 has
  a double-click arm on Remove and on a candidate.
- Imports added to `InstanceDetail.tsx`, all read-only uses of modules it or `IRForm` already uses: `setValue`,
  `clearValue`, `appendValue` (`formWrite`), `makeWriteCtx` (`writeCtxLproxy`), `targetOptions` and the rule
  (`jjform`), `groupTargets` (`useFormWidgets`), `assignableOptions` (`slotValues`), `featureAccessIn`,
  `offerForProfile`, `isLockedValue` (`formPermissions`), `ReferencePicker`, `orderFields` (`formHosts`),
  `useNodeProblems`, `collectFormDiagnostics`, `findFeatureRaw`, `store`.

## 7. The rule as a pure function

New module `frontend/src/jjform/refSlot.ts` (zero imports beyond its siblings' types, R-FORM-4), one line in
`jjform/index.ts`, tests in `jjform/__tests__/refSlot.test.ts`. The names `refSlotControls`, `RefSlotControls`,
`RefSlotRow`, `jjform/refSlot` and `hostReferences` have 0 hits in `frontend/src` and `frontend/scripts`
(`command grep -rn`; control `permissionOf`, 37 hits).

```ts
export interface RefSlotRow {
    /** The pointer the row shows. */
    value: string;
    /** Its position in the RAW array: the address of every write on this row (R-FORM-7). */
    index: number;
    /** The pointer does not resolve: no Open, the action stays. */
    broken: boolean;
    action: 'change' | 'remove' | null;
}
export interface RefSlotControls {
    rows: RefSlotRow[];
    /** Why the viewer cannot write the slot, or null. */
    lockedBy: 'derived' | 'readOnly' | 'profile' | null;
    /** The single-valued picker offers «(none)»: lower bound 0. */
    allowNone: boolean;
    /** «Link existing»: null when not offered, a raw index to set (single-valued), 'append' (multi-valued). */
    link: number | 'append' | null;
    full: boolean;
}
export function refSlotControls(
    ref: Pick<RefShape, 'lower' | 'upper' | 'readOnly' | 'derived'>,
    raw: readonly unknown[],
    reads: { resolves: (value: string) => boolean; sourceEditable: boolean; isLocked?: (value: string) => boolean },
): RefSlotControls
```

Rules: a row per filled raw value (a hole is `undefined`, `null` or `''`), with its raw index. Writable when the
source is editable and the reference is neither derived nor read-only. Single-valued (`upper === 1`): the action is
`change`, `link` is `0` when no row exists, `allowNone` is `lower < 1`. Multi-valued: the action is `remove`, `link`
is `'append'` below the upper bound (`-1` never full). A locked value has no action; the slot keeps its `link`.

Tests, each named after the mutation that kills it; the bench is run in Phase 2 and written in the commit message:

1. a row carries the raw index, not its position among the filled (`[null, 'a']` → index 1): kills a re-packed index;
2. «(none)» at lower 0 and not at lower 1: kills `< 1` turned `<= 1`, and the bound dropped;
3. a single slot links at 0 when empty (`[]`, `[null]`) and not when it holds a value: kills a link on a full single slot and an append on a single one;
4. the rows of a multi-valued slot keep their raw indices across holes (`['a', null, 'c']` → 0, 2), action `remove`;
5. below the upper bound `link` is `'append'`, at it `null` with `full`, unbounded never full: kills `>=` turned `>` and the `-1` test dropped;
6. read-only: no action, no link, `lockedBy: 'readOnly'`; derived: `'derived'`: kills either flag dropped;
7. a source the viewer cannot edit: no action, no link, `lockedBy: 'profile'`;
8. a locked value loses its action, its neighbours keep theirs, the link stays: kills the lock ignored and the lock widened to the slot;
9. a broken pointer is a row, `broken: true`, with its action, and counts toward the upper bound;
10. `undefined`, `null` and `''` are three holes and no row;
11. the input array is not mutated (a frozen `raw`).

## 8. The source-text tests

Mutation bench run in memory (a `node -e` that reads the two sources, applies one mutation to the string and
evaluates the assertions as the tests write them; no tracked file was edited). Control M0: all green.

| Assertion, quoted | Dies on | Survives |
|---|---|---|
| `instanceManager10c.test.ts:544` — `expect(TSX).toContain('<IRForm objectId={formSubjectId ?? subjectId} host="manager" permissionOf={permissionOf} />');` | M1 `objectId={subjectId}` (the form stays on the row during a drill-in); M2 `host="rail"` (R-DMV-1); M3 `permissionOf` dropped (#157 step B); **M4 one more prop on the mount, the Phase 2 edit** | M5-M8 |
| `instanceManagerOutline.test.ts:163` — the same string | M1, M2, M3, **M4** | M5-M8 |
| `instanceManagerFl6.test.ts:81` — `expect(TSX.match(/<IRForm objectId=/g)?.length).toBe(2);` | M5 the inline child's mount removed | M1-M4, M6-M8 |
| `instanceManager10k.test.ts:453-454` — `expect(CODE).toContain('<IRForm objectId=');` and `expect(CODE).not.toMatch(/<IRForm[^>]*onAddChild/);` | none of M1-M8 | all |

M6 (child `objectId={formSubjectId}`), M7 (child mount without `permissionOf`) and M8 (child `host="rail"`) survive
all five: the inline child's mount is pinned by nothing but the count.

- `10c:544` and `Outline:163` guard three real properties of the subject's mount and die on the benign M4. Phase 2
  rewrites the literal in both to the new mount; the bench is repeated after the rewrite and must show M1-M3 still
  killed, and the new prop's removal killed too. Nothing is deleted.
- `Fl6:81` and `10k:453-454` do not change: the regexes match the new mounts.
- `consumerJodieContext.test.ts` reads no source file (`command grep -c readFileSync`: 0; the same grep counts 5, 4,
  4 and 4 in the other four). Nothing of it is pinned to these lines.
- **Not in the Context's five:** `editor-v2/viewpoint/ir/__tests__/irFormAnnotationSubscription.test.ts:123` —
  `expect(CODE).toContain('describeSlots(slots, spec, offer)');` and `:127` —
  `expect(CODE).toContain('[slots, spec, resolution, offer, annotationSignature]');` pin the `fields` memo of
  `IRForm.tsx:374-378`. The diff of §11.3 filters AFTER that memo and leaves both strings as they are, so this test
  file, which is outside the DOVE, is not touched.
- Twelve test files read `instanceManagerTab.scss` or `InstanceDetail.tsx` (`command grep -rl`, counted): the four
  above, `instanceManager10d/e/f/h/i/j`, `instanceManagerIconInherit` and `common/libraries/__tests__/saveProject.test.ts`.
  The SCSS of Phase 2 only adds rules and the row's existing button keeps its classes; `npm run test` on the whole
  suite is the measure.
- `InstanceDetail.tsx` does not import under node, so the new behaviour of the section gets no unit test and no
  source-text test (root rules §5): the probe is its measure, and the gap goes in the entry.

## 9. Markup and styles

The row becomes a container; the existing button is not changed and stays the Open control (the whole card, with its
arrow), so `instance-manager__ref-link` remains a `<button>` and every selector on it holds.

```
div.instance-manager__refs[.instance-manager__refs--nested]            (existing)
  div.instance-manager__inline-slot                                    (existing)
    h3.instance-manager__eyebrow                                       (existing)
      span.instance-manager__ref-dirty          new, the dot, aria-hidden, title «Modified, not saved»
      «label or key»
      span.instance-manager__ref-required       new, the dot, title «Required»
      i.bi.bi-lock-fill.instance-manager__ref-lock    new, title «Read-only»
      span.instance-manager__draft-card         existing: «Goal [1/1]»
      span.instance-manager__ref-mult           new: «1..1» or «derived»
    p.instance-manager__ref-diag[--error|--warning]   new, role="alert": the refusal, else the first diagnostic
    div.instance-manager__ref-row               new, one per row, keyed by the raw index
      button.instance-manager__inline-link.instance-manager__ref-link   existing, unchanged; aria-label «Open <name>»
      button.instance-manager__ref-action       new: Change (bi-arrow-left-right) or Remove (bi-x)
    p.instance-manager__note                    existing: «No Goal linked yet.»
    div.instance-manager__ref-foot              new
      button.instance-manager__ref-pick         new: «Link existing Goal» (bi-link-45deg)
      button.instance-manager__add | span.instance-manager__child-reason    existing, as today
```

- New classes, all with 0 hits in `frontend/src` and in the SCSS (`command grep -rn`, control
  `instance-manager__ref-link`: 6 and 2): `__ref-row`, `__ref-action`, `__ref-foot`, `__ref-pick`, `__ref-diag`,
  `__ref-dirty`, `__ref-required`, `__ref-lock`, `__ref-mult`. No existing class is renamed or removed.
- Keyboard order in a row: Open, then the action. `aria-label`: «Open <name>», «Change <label>: <name>»,
  «Remove <name> from <label>», «Link existing <Type> to <label>». The picker takes the focus when it opens and Escape
  closes it (`ReferencePicker.tsx:98`, `:127`). Texts in English.
- Icons already in use: `bi-arrow-left-right`, `bi-x`, `bi-link-45deg`, `bi-lock-fill`, `bi-plus`,
  `bi-exclamation-triangle-fill`, `bi-x-circle-fill`.
- Tokens, all existing in `styles/tokens/` and already used by this stylesheet or by `irFormStyle.scss`:
  `--color-form-border`, `--color-form-muted`, `--color-form-label`, `--color-bg-primary`, `--color-text-primary`,
  `--color-accent`, `--color-border-focus`, `--color-error-text`, `--color-warning-text`, `--text-xs`. No variable is
  defined in the component stylesheet (rules 27, 28). «Link existing» is a bordered button (the card's look); «New …
  & link» keeps the primary look it has. Cyan stays on focus and hover only.
- The picker is the shared `ReferencePicker`, a portal on `document.body` styled by `irFormStyle.scss`, which the
  mounted `IRForm` already loads.

## 10. Children

The prop of option (a) could drop the CHILDREN fields the same way (`f.isComposition`). What would go with them: the
select on a single composition, which is the one gesture that moves an EXISTING element into the slot (a `setValue`
that re-fathers it and evicts it from its container, #174; the append of R-NEST-9 has no gesture, #182 addendum); the
remove of a contained child from its list, which returns it to the model root (R-NEST-4); the lock of a `read` child
(#157 step B, `isLockedValue`); the core's loop refusal printed under the field (R-FORM-13). The inline child form and
the «Add» bar create and edit, they do not move. So the children need «Move an existing <Type> here» and «Take out of
the container» in the host before their fields can leave. That is #166's design; this lane leaves the CHILDREN fields
and the «Add» bar as they are, and names the prop for references only.

## 11. Phase 2 plan

### 11.1 Files (eight of code: rule 19, each with what changes)

| # | File | Step | What changes |
|---|---|---|---|
| 1 | `frontend/src/jjform/refSlot.ts` | 1 | new: `refSlotControls` and its two types |
| 2 | `frontend/src/jjform/index.ts` | 1 | one export block for the new module |
| 3 | `frontend/src/jjform/__tests__/refSlot.test.ts` | 1 | new: the eleven tests of §7 |
| 4 | `frontend/src/components/abstract/tabs/InstanceDetail.tsx` | 2, 3 | step 2: `RefSlot` carries raw rows, label and controls; `refSlotsOf` lists every non-hidden slot in the form's order; `RefSlotsSection` gets the heading marks, the action button, the foot, the picker, diagnostics, dirty and refusal; step 3: the prop on the two `<IRForm>` mounts |
| 5 | `frontend/src/components/abstract/tabs/instanceManagerTab.scss` | 2 | the nine new rules of §9, added after `&__ref-summary-key` |
| 6 | `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` | 3 | the diff of §11.3 (critical zone) |
| 7 | `frontend/src/components/abstract/tabs/__tests__/instanceManager10c.test.ts` | 3 | the literal at `:544` |
| 8 | `frontend/src/components/abstract/tabs/__tests__/instanceManagerOutline.test.ts` | 3 | the literal at `:163` |

Docs, never in a code commit: `docs/lir/lir_2026-10-10_172_fields_leave_form.md` before step 3,
`docs/log-inbox/data-manager-ux.md` and the prompt's `Status` at the closure. Not edited: `InstanceManagerTab.tsx`,
`ConfiguratorTab.tsx`, every widget, `IRFormField.tsx`, `formWrite.ts`, `formPermissions.ts`, `formHosts.ts`.

### 11.2 Steps

No intermediate state is worse than today: after step 2 the references are editable from the field and from the
section (the doubling stands, with more on the section); only step 3 removes the fields.

1. **The rule.** Tests first, then the module; the mutation bench in the commit message. Gates. No screen changes;
   the probe is not re-run. `feat(#172): the rule of a reference slot's controls (P-2026-10-10-1545)`.
2. **The section takes the gestures.** Probe `MODE=after`, part 1: every gesture of §3.2 from the section against the
   oracle, in both hosts, subject and child; the two declared differences (L6: the picker does not offer `L1`; C5:
   `[HOLE, Teacher_0]` then Change gives `[HOLE, T2]`); 1..1 without «(none)»; the bound; the read-only and the
   abstract-typed slot listed while empty, the latter with «Link existing Topic» and its «Abstract…» reason; the
   profile (a `read` source and a locked aggregation value have Open only, `rooms` absent, the offer filtered); the
   diagnostic and the refusal under the heading; label and order from an authored view, a hidden reference as today;
   a double click on Remove and on a candidate (one write); `elementsFromPoint` on the action button (P11); the counts
   still «field 1 · section 1». `feat(#172): the reference section links, changes and removes (P-2026-10-10-1545)`.
3. **The fields leave the form.** Juri's go-ahead quoted in the GO; the Layer Impact Report committed first. Probe
   `MODE=after`, part 2: every key «field 0 · section 1» in the Data Manager and the Configurator, subject and child,
   Basic and Advanced, empty and filled; the gestures again; the summary count unchanged and its chip landing on the
   section; no «No fields to show» in the form of `Phase_0`, whose only fields are references; the CHILDREN field of
   `phases` still there. The two literals, with the bench of §8 repeated.
   `feat(#172): reference fields leave the detail's form (P-2026-10-10-1545)`.

Gates at every step, in the foreground, each on its complete output with its exit status: `npm run typecheck` (the
known 14), `npm run test` (the known nine files red at import), `npm run build`, `npm run check:docs`,
`npm run check:addonly`, `npm run check:scripts` (run in this phase for the probe: exit 0, 61 files).

Visual checklist for Juri (the probe covers presence, texts, raw arrays and the stacking order; these are the
perceptual items): (1) Data Manager, a row with its two controls: are they told apart at a glance; (2) the heading
with the dot, the lock, `[1/1]` and `1..1`; (3) the foot with «Link existing» beside «New … & link»; (4) the picker
opening against the button it belongs to, near the bottom of the pane too; (5) the Configurator, the same; (6) a
profile with a `read` type: the rows of a `read` instance have Open only and nothing looks disabled-but-clickable;
(7) the inline child's nested section inside its frame; (8) the form without its REFERENCES group: does the pane
still read as one detail.

### 11.3 The diff of the `IRForm.tsx` step, as text, NOT applied

```diff
--- a/frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx
+++ b/frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx
@@ export interface IRFormProps {
      * (`formPermissions.ts`). Absent: no profile, and the form is the one without it.
      */
     permissionOf?: PermissionOf;
+    /**
+     * #172: the host lists the non-containment references itself, next to this form (the
+     * reference sections of `InstanceDetail`), so the form renders no field for them and a
+     * reference is on screen once. Their diagnostics stay counted in the summary (the residue
+     * of `formDiagnostics`), and a summary chip that finds no field of its severity in the
+     * form asks the host to show its own (`focusFirst`). Compositions are not concerned: the
+     * CHILDREN fields stay. Absent: every reference is a field, as before.
+     */
+    hostReferences?: { focusFirst: (severity: 'error' | 'warning') => void };
 }
@@
-export function IRForm({ objectId, defaultTheme = 'plain', host = 'rail', permissionOf }: IRFormProps) {
+export function IRForm({ objectId, defaultTheme = 'plain', host = 'rail', permissionOf, hostReferences }: IRFormProps) {
@@
         [slots, spec, resolution, offer, annotationSignature],
     );
 
+    // #172: the references the host lists itself are not fields of this form. After the memo
+    // above and not inside it: `fields` keeps answering `hasNameSlot` on everything the
+    // object has, and `slots` is a new array on every render, so the memo saves nothing here.
+    const listed = hostReferences ? fields.filter(f => !f.isReference) : fields;
+
     // `order` is applied HERE, on the visible fields and before `buildFormSections`,
@@
     const visible = orderFields(
-        mode === 'advanced' ? fields : fields.filter(f => isBasicField(f, spec)),
+        mode === 'advanced' ? listed : listed.filter(f => isBasicField(f, spec)),
         spec,
     );
@@ const focusFirstOf = useCallback((severity: 'error' | 'warning') => {
             (el.querySelector('input, select, textarea, button') as HTMLElement | null)?.focus();
             return;
         }
-    }, [visible, diagnostics]);
+        // #172: no field of this form carries it; a reference the host lists may.
+        hostReferences?.focusFirst(severity);
+    }, [visible, diagnostics, hostReferences]);
@@
-                {sections.length === 0 && hasNameSlot === false && (
+                {sections.length === 0 && hasNameSlot === false && listed.length === fields.length && (
                     <div className="ir-form__placeholder">No fields to show</div>
                 )}
```

Sixteen lines added, four changed (counted on the block above: 20 `+` lines, 4 `-` lines). `f.isReference` is the descriptor's «plain reference or aggregation»
(`useFormWidgets.ts:298-299`, composition wins), the same partition as the form's own References group
(`formSections.ts:80`) and as `shape.refs` (`shapeAdapter.ts:91`, with `useEditorMode.ts:421` —
`containment: !!(ref.composition)`). The last hunk: without it the form of a class whose only features are references
would print «No fields to show» above the sections that list them (read from `IRForm.tsx:701-703`; `Phase` in the
fixture is such a class; to be measured in step 3).

### 11.4 Layer Impact Report for that step (to be filed as `docs/lir/lir_2026-10-10_172_fields_leave_form.md`)

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] View: the form rendering of an M1 object (IRForm), in its `manager` mounts only

For the touched layer:
  - What changes: with `hostReferences` passed, `IRForm` builds no field for a plain reference or
    an aggregation; the summary chip, finding no field of its severity, calls the host; the
    «No fields to show» placeholder is not printed when references were handed to the host.
  - What does NOT change: with the prop absent, every line renders as today. `describeSlots`,
    the `fields` memo and its dependency array, `resolveFormSpec`, `buildFormSections`,
    `collectFormDiagnostics`, `IRFormField`, every widget and `formWrite` are not edited. The
    counts of the summary are the same (a diagnostic with no field is the residue, counted).
    Attributes, the identity field and the CHILDREN fields are rendered as today.
  - Cross-layer interaction: none new. The form writes nothing more; the writes on references
    move to `InstanceDetail`, which calls the same `formWrite.setValue / clearValue / appendValue`
    the field called (D-layer writes through `LValue.setValueAtPosition` and `SetFieldAction`,
    in a TRANSACTION with no creator: rule 12 does not apply). A changed M1 reference value
    reaches the canvas through `useM1ReferenceEdges` when the model's canvas is mounted, as it
    does today from the field.
  - Side-effect safety vs other layers: `IRForm` has two mounts, both in `InstanceDetail.tsx`
    (`command grep -rn '<IRForm' frontend/src`, control `<RefSlotsSection`); the canvas and the
    rail mount none. `localStorage` `jjodel.formPrefs.<viewId>.collapsed` may hold `references`:
    with no such section it is inert, and it is not project persistence.

Smoke-test scenarios potentially affected:
  - Data Manager, select an instance with a 1..1, a 0..1 and a 1..* reference: no REFERENCES
    group in the form, one section per reference, the six gestures of the acceptance criterion.
  - Configurator, the same instance; then the stand-alone page with a profile (a `read` type,
    a `hidden` type).
  - An instance of a class with attributes only: the form is byte for byte today's.
  - An instance with a contained child shown inline: the child's form loses its reference
    fields, keeps its attributes; the CHILDREN field of the parent stays.
  - Open the same model on the canvas: nothing of the form is mounted there; unchanged.

Uncertain about propagation? No. The one unknown is perceptual (the form without its REFERENCES
group), and it is item 8 of the visual checklist.
```

## 12. Dependencies and risks

- **The mode.** After step 3 the reference controls are on screen in Basic too (J4). Before, an optional reference
  could not be changed in Basic and could be opened and created-and-linked.
- **More sections.** Every non-hidden reference is listed, so an empty reference typed on an abstract class and an
  empty read-only one gain a section. A class with many optional references gets a longer pane.
- **The stand-alone page has no diagnostics** (F14): the section's diagnostics will be empty there, as the form's are.
- **`createAndLink` still appends after a hole** on a single-valued slot (`[HOLE, X]`). The section reads the filled
  values and writes at the raw index, so the state is coherent; the double click of the ticket of 2026-10-04 stays as
  it is (not this lane).
- **A slot already holding a duplicate** (§3.6) is drawn as two rows; Phase 2 keys the rows by raw index, and Remove
  on one clears that position only.
- **Twelve lines repeated** to build `ProfileReads` (§4, row 21). Extracting them needs `formPermissions.ts`, outside
  the DOVE.
- **Probe selectors.** The probe reads the key as the first text node of the heading; the dirty dot goes before it, so
  the AFTER probe reads a `data-ref` attribute the section adds, or the dot goes after the label. Decided in step 2.
- **Run 1's lesson, declared:** deleting a view with `.delete()` from the probe did not remove its form spec from the
  detail. Seen through automation only (RC-8): not claimed as a product defect.

## 13. Decisions taken (unattended)

1. The writes are called from `InstanceDetail` by import; no host event; the two host files are not edited (§6).
2. The existing card button is kept as it is and is the Open control; the action is a second button; no class is
   renamed (§9).
3. Every write of a row addresses the RAW index the row carries; an empty single-valued slot links at index 0; a
   multi-valued one appends (§7).
4. «Link existing» does not offer a target the slot already holds, as `ListWidget` does and the chip picker does not
   (§3.6). The first declared difference from the oracle (L6).
5. «Change» on a row writes at that row's index, so the two-target state of §3.5 is not reproduced. The second
   declared difference (C5).
6. The section applies `labels` and `order` of the resolved form spec; both change what today's list prints where a
   view authors them.
7. Every reference not hidden by the profile is listed, empty or not, writable or not; the filter of
   `InstanceDetail.tsx:464` goes.
8. The section does not follow Basic/Advanced, as today's list does not (the capability is J4).
9. The mutation bench of §8 ran on strings in memory, so that no tracked file under `frontend/` was edited in Phase 1.
10. The IRForm filter sits after the `fields` memo, to leave the two strings pinned by
    `irFormAnnotationSubscription.test.ts` untouched and that file out of the lane.
11. Not fixed here, reported: the two-target path (it closes with the field), the duplicate link of the chip picker
    (the chip field leaves the detail; the widget itself is not edited), diagnostics missing on the stand-alone page.

## 14. Decisions awaiting Juri

The six of §0 (J1 the double button; J2 the `IRForm.tsx` edit; J3 the sentence added to R-FRM-1; J4 the three
capabilities lost; J5 the `focusFirst` half of the prop; J6 the children), each with its `Recommended:` line there.
With them, the confirmation rule 19 asks for: the eight code files of §11.1.

Open questions, numbered:

1. Q1 of §0: a reference the author hid keeps today's section, or loses it?
2. Q2 of §0: the multiplicity `1..1` in the heading next to `[1/1]`?
3. Is «Link existing <Type>» the wording, or «Link <Type>»? The mockup of the issue shows no such control.
4. The duplicate link of the chip picker and the two-target path are measured defects of code this lane removes from
   the detail but does not fix at the source (`IRFormField`, the hosts' `createAndLink`): a ticket each, or nothing?
