# Prompt: #172, a reference appears once in the instance detail (Data Manager and Configurator)

Prompt-ID: P-2026-10-10-1545
Chat: C-2026-10-10-1540
Lane: full (a candidate file sits under `viewpoint/ir/`, a row of the §3.1 table; more than three files; a visual check)
Depends: none
Status: eseguito 2026-10-12 · lane feat/172-references-once · 6cc99ca73 · verifica visiva passata 2026-10-12
Limite: 75 minuti per la Fase 1, 90 minuti per ogni passo della Fase 2

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the visual GO), Juri decides for this lane.

Critical zone: `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` is a candidate of Phase 2. It sits
under `viewpoint/ir/`, a row of the table of the root rules file §3.1, and is none of the six files of §3.2,
so no hook go-ahead (RC-30) is passed. It is still a critical-zone edit of the RC-26 list: **no go-ahead is
given by this prompt**. Phase 1 proposes, Juri decides, the GO carries his word; the Layer Impact Report is
owed on file before that diff.

Worktree: `/Users/juridirocco/development/jjodel-172`, branch `feat/172-references-once`, cut from `staging`
at the commit that adds this file; `frontend/node_modules` is a symlink to the main tree's (P14: do not
remove it). Before anything else: `pwd` is that worktree, the branch is `feat/172-references-once`,
`git log -1` is the commit that adds this file, `git status` is empty; otherwise stop with
`Outcome: blocked`.

Two phases (P4): Phase 1 read-only on tracked code, the report, `Outcome: hard-stop`; Phase 2 only after a
message `[P-2026-10-10-1545] GO` that carries the decisions, the confirmed file list and, for `IRForm.tsx`,
Juri's go-ahead.

## Lane discipline

Every reply of this session opens with `[P-2026-10-10-1545 · session <id>]` (`session unknown` if you cannot
see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one
line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).

## Context (read by the chat on `cb5952876`: verify, do not trust; re-measure where a number counts)

**Issue #172** (`gh issue view 172 --comments`). In the detail of an instance every non-containment
reference is on screen twice:

1. as a **field** of the form's REFERENCES section: `goal` (1..1) and `teacher` (0..1) as a dropdown
   (`ReferenceWidget`), `learners` (1..\*) as chips with «+ add target» (`ChipInputWidget`);
2. further down as a **list** per reference (GOAL, TEACHER, LEARNERS): one card per target with name,
   metaclass and up to three key fields (#158 P4), an arrow that opens the target, «Slot full [1/1]» or
   «New … & link» at the foot.

**The direction agreed in the issue** (comments of 2026-10-07, @tmaog and Juri):

- keep the **list only**, and put adding, changing and removing into it. @tmaog's mockup shows the three
  lists alone: on GOAL and TEACHER the control at the right of the row is marked orange, «change the
  selection» (a single-valued reference); on the three LEARNERS rows it is marked red, «remove from the
  list»; «+ New iSQD_Profile & link» stays at the foot of the section;
- Juri: a button that **opens** the element is necessary, so two buttons per row. @tmaog agreed: one to
  open, one for the extra action, which depends on the kind of reference;
- Juri then asked @tmaog for a separate issue on «context menus or double button». **None was filed**
  (issues 173 to 183 read on 2026-10-10). This lane takes the double button as agreed; Phase 1 lists it
  among the decisions awaiting Juri, it does not reopen it.
- the other road of the issue body, the key fields **inside** the selection field, is dropped by this
  direction: `ReferenceWidget`, `ChipInputWidget`, `ListWidget`, `ReferencePicker` and `IRFormField` are
  not edited by this lane.

The two screenshots, if you need to look at them (the description above is the reading the chat made):
`curl -sL -H "Authorization: token $(gh auth token)" -o ~/.jjodel-lanes/P-2026-10-10-1545/172_today.png https://github.com/user-attachments/assets/b1a030e3-6329-42d8-9952-5e819003f14b`
and `…/172_mockup.png https://github.com/user-attachments/assets/eb541ebc-c52f-4889-a334-0e5d53ad8e69`.

**Where the two renderings live** (lines as read on `cb5952876`):

- The detail is one component for two hosts, `frontend/src/components/abstract/tabs/InstanceDetail.tsx`:
  the Data Manager (`InstanceManagerTab.tsx`) and the stand-alone Configurator
  (`environment/ConfiguratorTab.tsx`).
- **The field** is rendered by `IRForm`, mounted at `InstanceDetail.tsx:584` (the subject) and `:620` (each
  inline contained child), both with `host="manager"`. `command grep -rn '<IRForm' frontend/src` gave these
  two mounts and no other: the `rail` and `nodeForm` hosts of `formHosts.ts` have no mount today. Verify it,
  with a positive control. The section comes from `formSections.buildFormSections` (`:74-110`): fields with
  `isReference` go to `references`, with `isComposition` to `children`. `IRForm` computes `fields`
  (`IRForm.tsx:374-378`), `visible` (`:384-387`) and `sections` (`:460-461`).
- **The list** is `RefSlotsSection` (`InstanceDetail.tsx:118-197`) fed by `refSlotsOf` (`:445-467`), which
  scans `shape.refs` (plain references and aggregations: `shapeAdapter.ts:91`). A slot is listed only when
  it has targets **or** a create is offered (`:464`): an empty reference whose target cannot be created
  from here is today reachable from the field alone. The row is ONE `<button>` whose whole surface opens
  the target (`drillTo`); the key fields come from `referenceSummary` (`instanceTable.ts:698`). The same
  section is rendered under each inline child (`nested`, `:627-636`) and under the subject (`:669-677`).
- **What the field does and the list does not**: pick or change the target of a single reference
  (`setValue(objectId, key, 0, id, true)`), unset it, with «(none)» offered only when the lower bound is 0
  (`ReferenceWidget.allowNone`); append an existing target to a multi-valued one (`appendValue`) and remove
  one (`clearValue` on the RAW index: the array has holes, R-FORM-7); the candidates asked when the picker
  opens (`getOptions`, S5) through `targetOptions` (`jjform/writeCtx.ts:255`); the required dot, the
  multiplicity label, the lock of a read-only reference and the «derived» label; the diagnostics of that
  feature under the field, and the summary chip that scrolls to the field (`focusFirstOf`); the dirty
  mark; the Basic / Advanced filter (`isBasicField`), `FormSpec.order`, `labels`, `hidden` and
  `features: 'hidden'`; the option colours; the profile rules of #157 step B (`formPermissions.ts`:
  `withoutHiddenFeatures`, `offerForProfile`, `isLockedValue`). All the writes are in
  `viewpoint/ir/formWrite.ts` (`setValue` `:341`, `clearValue` `:354`, `appendValue` `:366`).
- **R-FRM-1** (`docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` §7, header of `formSections.ts`):
  a form lists every feature, and the one gesture that removes a field is the view author's `hidden`.
  #157 step B already removes fields for a profile. Whether a host that lists the references itself
  amends R-FRM-1 is a question of Phase 1, and an amendment is an RC-26 item.
- Tests that read the source text of these files: `abstract/tabs/__tests__/instanceManagerFl6.test.ts`,
  `instanceManager10k.test.ts`, `instanceManager10c.test.ts`, `instanceManagerOutline.test.ts`, and
  `environment/__tests__/consumerJodieContext.test.ts`. `InstanceDetail.tsx` does not import under node
  (the `joiner` barrel, monaco); the pure logic of the detail lives in `frontend/src/jjform/` (R-FORM-4),
  whose tests run in the bench.
- Styles: `abstract/tabs/instanceManagerTab.scss`, block «Referenced elements (#142)» at `:2070`.
- The same doubling exists for the **contained children** (a select in the form's CHILDREN section, then
  the inline child form and the «Add» bar). It is on the list of #166 and **not** in this lane's COSA.
- Adjacent and open: the ticket of 2026-10-04 in `docs/log-inbox/data-manager-ux.md` (Configurator, a
  double click on «New … & link» of a 0..1 reference links two targets: `createAndLink` does not re-check
  the cardinality, the store lags). Not fixed here; a gesture this lane adds must not repeat it.
- Agreed in #166 and **not** for this lane: the cardinality labels («Optional, single», …).

## COSA

In the detail of an instance, in both hosts, for the subject and for each inline child, **a
non-containment reference is on screen once**: as its section of the list. The REFERENCES fields of the
form are no longer rendered there, and everything the field did is done from the section. The starting
proposal, which Phase 1 confirms or corrects with measures:

- **the row** (one per target): the card as today (name, metaclass, key fields) and two controls:
  **Open** (today's arrow, the drill-in, unchanged) and the action of the slot's kind. Single-valued:
  **Change**, which opens the shared `ReferencePicker` with the candidates asked at that moment, «(none)»
  offered only when the lower bound is 0. Multi-valued: **Remove from the list**, which unlinks the pointer
  and never deletes the target;
- **the foot of the section**: **Link existing <Type>** (picker, then append) on a multi-valued slot below
  its upper bound, and on a single-valued slot that is empty (picker, then set); **New <Type> & link** as
  today, with today's reasons;
- **the heading** carries what the field's label carried: required, cardinality, read-only or derived,
  and the diagnostics of that feature;
- a slot the viewer can write is listed **even when empty**; the profile rules (`read`, `hidden`, a
  locked value) hold as the form applied them;
- every write goes through the existing `formWrite` functions: no new write path, no core, no sync, no
  persistence, no migration.

**Acceptance criterion** (root rules file §5, mechanically checkable): for an instance with a single-valued
and a multi-valued non-containment reference, in the Data Manager and in the Configurator, the detail's DOM
holds each reference key once (its section, and no form field for it); and from the section alone the
probe changes the single target, unsets it where the lower bound is 0 and is refused where it is 1, links
an existing target to the multi-valued one, unlinks one, creates and links, opens a target. After each
gesture the slot's raw `values` array equals the one the same gesture on the form field produced in the
BEFORE run, holes included.

Nothing delivered gets worse (rule 3): a capability of the field that the section cannot take is a
question, not an omission.

## Phase 1: discovery (read-only on tracked code)

1. Read the root rules file (rules 1-11, 19, 20; §3.1, §3.2, §5, §6, §8), `frontend/src/components/editor-v2/CLAUDE.md`,
   `frontend/src/styles/CLAUDE.md`, `docs/PROTOCOL.md` (P4, P5, P6, P8, P9, P11, P12, P13, P16),
   `docs/decisions.md` (RC-17, RC-20, RC-21, RC-23, RC-26, RC-27; the R-FORM series, R-FORM-7 and R-FORM-13
   above all; R-DMV-1; R-NEST-9; search R-FRM-1), `docs/log-inbox/data-manager-ux.md`,
   `docs/discovery/discovery_2026-09-28_158_data_manager_ux.md` (§6 and §8), and the whole of
   `InstanceDetail.tsx`, `IRForm.tsx`, `IRFormField.tsx`, `formSections.ts`, `formHosts.ts`,
   `formWrite.ts`, `formPermissions.ts`, `ReferenceWidget.tsx`, `ReferencePicker.tsx`.
2. **The probe**, `frontend/scripts/smoke/_tmp_172_probe.ts` (gitignored). Models, copied by the chat into
   this worktree: `_tmp_173_verify.ts` (Data Manager and Configurator, drill-in, «New … & link»),
   `_tmp_157_b_verify.ts` with `_tmp_157_b_setup.js` (a profile), `_tmp_182_probe.ts` (boot, `settle`,
   `check`, `meas`, the `page.evaluate` idiom); `frontend/scripts/smoke/README-probes.md`. One fixture
   built by the probe: a class with a 1..1 reference, a 0..1, a 1..\*, a bounded 0..2, a read-only or
   derived one and one typed on an abstract class; a contained child with a reference of its own (the
   inline child). Real gestures (P11). `MODE=before` measures on the untouched code: per reference key the
   number of form fields and of sections in each host (the doubling), and for every gesture of the form
   field (pick, change, unset, append, remove from the middle of three) the slot's raw `values`. That
   table is the oracle of Phase 2. Run it only through the launcher, in the foreground:
   `node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_172_probe.ts --port 3172 --id P-2026-10-10-1545`.
   Count failures with `const r = await …; failures += r;` (`npm run check:scripts`).
3. **Census of the field.** One row per capability of the list in Context (add what you find): where it is
   in the code, how the section takes it, or «lost» with the reason. Measure, do not deduce, at least:
   a reference the view author hides (`features: 'hidden'`) and one outside `basic` in Basic mode (does
   the list show it today?); where a diagnostic on a reference goes once its field is gone
   (`collectFormDiagnostics`, the `residue`); what an empty writable slot shows today.
4. **How the fields leave the form.** The options, each with its files, what is critical zone, who else is
   affected (every mount of `IRForm`, every consumer of `resolveFormSpec`, `summaryOf` at
   `InstanceDetail.tsx:411`, the form authoring preview), and whether it amends R-FRM-1: (a) an optional
   prop of `IRForm`, absent meaning today's form; (b) a rule of the `manager` host in the spec resolution;
   (c) any other you find. A CSS rule that hides mounted fields is not an option. One recommendation, and
   in one line what would falsify it.
5. **Where the writes are called from.** `InstanceDetail` calling `formWrite`, `targetOptions` and
   `ReferencePicker` itself (imports only), or host events as `onCreateAndLink` is. Say what each host
   needs (the Data Manager writes straight to the store from the form already; the Configurator under a
   profile), how the offer is filtered for a profile, and how a gesture re-reads the cardinality at the
   click (the ticket of 2026-10-04). Recommendation.
6. **The rule as a pure function** in `frontend/src/jjform/`: which controls a slot offers, from its
   bounds, count, read-only, derived and the viewer's permission. Signature, the test list, the mutation
   bench you will run (root rules file §5: a test is judged by the mutations it kills).
7. **The source-text tests.** For each of the five files above: the assertions that pin a line Phase 2
   changes, quoted. For each, what a mutation bench says it guards; none is deleted or rewritten without
   that measure.
8. **Markup and styles.** The row becomes a container (a `<button>` cannot hold a second one): the DOM
   you propose, the class names (new ones checked with `command grep` and a positive control, P2; no
   existing class renamed), the tokens from `styles/tokens/` (rules 27 and 28), keyboard order and
   `aria-label` of each control, the icons (`bi-*` already in use). Texts in English.
9. **Children**, in at most ten lines: would the mechanism of step 4 take the CHILDREN fields too, and what
   would be lost (the select on a composition is the one gesture that moves an EXISTING element into the
   slot: #174, R-NEST-9). No design, no implementation: it is #166's.
10. **Phase 2 plan in steps**, in the order that leaves no intermediate state worse than today (the
    section takes the gestures first, the fields leave the form last). Per step: files (rule 19: more than
    five, each with what changes in it), tests with their bench, probe arms, gates, items of the visual
    checklist. The diff of the `IRForm.tsx` step as text, **not applied**, with the Layer Impact Report of
    the root rules file §3.2 filled in.
11. Write `docs/discovery/discovery_2026-10-10_172_references_once.md`: it opens with
    `## 0. Answer in brief` (at most 40 lines: the answer, the recommendation, the decisions awaiting Juri,
    the questions each with its `Recommended:` line) and closes with «Decisions taken (unattended)» and
    «Decisions awaiting Juri». Awaiting Juri, whatever you recommend: the double button as agreed in the
    issue (the separate issue never came); the way the fields leave the form if it edits `IRForm.tsx`;
    an amendment of R-FRM-1 if you find one; a capability «lost»; the children. Do not write rows in
    `docs/decisions.md`: the chat writes them, with the memo, before the GO.
12. Commit the report alone: `docs(#172): Phase 1 report on showing a reference once (P-2026-10-10-1545)`.
    `Outcome: hard-stop`.

## Phase 2: implementation (after `[P-2026-10-10-1545] GO`)

The GO carries the decisions, the approved steps and the confirmed file list. For each step:

1. Baseline of the gates on your tree before the first diff.
2. A step that edits `IRForm.tsx`: only with Juri's go-ahead quoted in the GO, and the Layer Impact Report
   in `docs/lir/lir_2026-10-10_172_<step>.md` before the diff.
3. Tests before code where the subject imports in the bench (`jjform/`); where it does not, no
   source-text test (root rules file §5): the probe is the measure and the gap goes in the entry. The
   mutation bench of the tests you write goes in the commit message.
4. The probe, `MODE=after`, on port 3172, against the BEFORE table.
5. Gates, all in the foreground, from `frontend/`, each read on its **complete** output with its exit
   status: `npm run typecheck` (the known 14, by file and code as the root rules file §17 lists them),
   `npm run test` (the known nine files red at import, nothing else red), `npm run build` (exit 0),
   `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`.
6. One code commit per step, `feat(#172): <step> (P-2026-10-10-1545)`, the pathspec on the commit itself.
7. After the last step: the closure prepared and **not committed** (RC-17), that is the entry in
   `docs/log-inbox/data-manager-ux.md` (the `log-entry` skill) and this prompt's `Status` line; then the
   final message with the shas, the BEFORE/AFTER table, the gates with their numbers, the diff of the
   touched files, «Decisions taken (unattended)», «Decisions awaiting Juri», a numbered visual checklist
   for Juri (both hosts, a profile with a `read` type, the inline child) saying what the probe already
   covers, and `Outcome: hard-stop`.
8. On a message `[P-2026-10-10-1545] GO` after the visual check: one commit,
   `docs(#172): lane closure, entry and Status (P-2026-10-10-1545)`, then `Outcome: done`. Do not merge.

## DOVE

Phase 1:

- `docs/discovery/discovery_2026-10-10_172_references_once.md`
- not committed: `frontend/scripts/smoke/_tmp_172_*.ts`; port **3172** only.

Phase 2, candidates the GO confirms or narrows (a file outside the confirmed list is a question):

- `frontend/src/components/abstract/tabs/InstanceDetail.tsx`
- `frontend/src/components/abstract/tabs/instanceManagerTab.scss`
- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (critical zone, only with Juri's go-ahead)
- `frontend/src/jjform/` : one new pure module, its line in `index.ts`, its test under `__tests__/`
- the five test files named in Context, only where a pinned line changes and the bench allows it
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` and
  `frontend/src/components/environment/ConfiguratorTab.tsx`, only if step 5 of Phase 1 ends on host events
- `docs/lir/lir_2026-10-10_172_*.md`, `docs/log-inbox/data-manager-ux.md`, this prompt's `Status` line.

Commits with the pathspec on the commit itself (`git commit -- <paths>`), the `Model:` trailer of P6 (the
model your session banner shows) and the tooling's `Co-Authored-By` line; the subject within 72 characters
without the `(P-…)` suffix. Docs and code never in one commit (P13).

## HARD STOP

- End of Phase 1: the report committed, `Outcome: hard-stop`.
- A measure of Phase 1 that contradicts the issue or the Context in a point that changes the
  recommendation: it is written in the report, not worked around.
- In Phase 2: a step that worsens a behaviour measured in Phase 1, a new red gate, a file outside the
  confirmed list, an edit of a widget or of `IRFormField.tsx` that turns out to be needed:
  `Outcome: question`.

## NON FARE

- No edit to a tracked file under `frontend/` in Phase 1.
- No edit of `ReferenceWidget.tsx`, `ChipInputWidget.tsx`, `ListWidget.tsx`, `ReferencePicker.tsx`,
  `IRFormField.tsx`, `formWrite.ts`; no core change (`LModelElement.tsx`, the reducer); nothing of the
  canvas sync; no VersionFixer migration; no change to a saved `FormSpec`; no new dependency; no renamed or
  removed identifier, CSS classes included; no exported interface changed except by an optional property.
- Not this lane: the CHILDREN fields and the «Add» bar (#166), the cardinality labels (#166), a context
  menu, the in-flight guard of `createAndLink` (the ticket of 2026-10-04).
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`,
  `git clean`, `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree
  is read-only for this lane), a port other than 3172, a real call to an AI provider, a background gate.

## RIFERIMENTI

- Issue #172 with its five comments; #158 (P3, P4) and #166 (the list of what to remove, the comments of
  2026-10-07 on cardinalities); #173; #182.
- `docs/discovery/discovery_2026-09-28_158_data_manager_ux.md`; `docs/log-inbox/data-manager-ux.md`.
- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (R-FRM-1, §7 and §12); `docs/decisions.md`
  (R-FORM-4, R-FORM-7, R-FORM-13, R-DMV-1, R-NEST-9).
- `InstanceDetail.tsx:95-197, 395-482, 583-677`; `IRForm.tsx:77-96, 370-387, 460-461`;
  `IRFormField.tsx` (`commitAt`, `clearAt`, `appendAt`, the chip picker); `formSections.ts`;
  `formHosts.ts`; `formWrite.ts:341-384`; `formPermissions.ts`; `jjform/writeCtx.ts:255`;
  `widgets/ReferenceWidget.tsx`, `widgets/ReferencePicker.tsx`; `hooks/shapeAdapter.ts:84-118`;
  `abstract/tabs/instanceTable.ts:672-720`; `instanceManagerTab.scss:2070`.
