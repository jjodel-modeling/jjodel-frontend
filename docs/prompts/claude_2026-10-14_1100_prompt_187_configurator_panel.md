# Prompt: #187, the Configurator panel (Identity, Attributes, Components) and the consumer chrome

Prompt-ID: P-2026-10-14-1100
Chat: C-2026-10-14-1020
Lane: full (more than three files; a visual check)
Depends: none
Front: standalone-editor
Request: https://github.com/jjodel-modeling/jjodel-frontend/issues/187 (Juri's words in chat are `request.md` in the lane folder, RC-43)
Status: da eseguire
Limite: 60 minuti per la Fase 1, 90 minuti per ogni passo della Fase 2

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the visual GO), Juri decides for this lane.

Critical zone: **none is edited.** The panel imports from `components/editor-v2/viewpoint/ir/` (a row of the
root rules file §3.1) and from `components/abstract/tabs/InstanceDetail.tsx`; importing is not editing. An
edit to any file under `viewpoint/ir/`, to `InstanceDetail.tsx`, to `jjform/` or to the core is a
`question`, never a step (R-CFG-2). No Layer Impact Report is owed while that holds.

Worktree: `/Users/juridirocco/development/jjodel-187`, branch `feat/187-configurator-panel`, cut from
`staging` at `358a91da3`; `frontend/node_modules` is a symlink to the main tree's (P14: do not remove it).
Before anything else: `pwd` is that worktree, the branch is `feat/187-configurator-panel`, `git log -1` is the
commit that adds this file (subject `docs: add prompt P-2026-10-14-1100, #187 Configurator panel`),
`git status` is empty; otherwise stop with `Outcome: blocked`.

A parallel lane runs on `feat/186-endpoints` (`P-2026-10-14-1101`, the project page's Endpoints section). The
DOVE lists are disjoint (RC-22). Merge order fixed at launch: this lane first.

Two phases (P4): Phase 1 read-only on tracked code, the report, `Outcome: hard-stop`; Phase 2 only after a
message `[P-2026-10-14-1100] GO` that carries the decisions and the confirmed file list.

## Lane discipline

Every reply of this session opens with `[P-2026-10-14-1100 · session <id>]` (`session unknown` if you cannot
see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one
line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).

## Context (read by the chat on `e8fd99c58`: verify, do not trust; re-measure where a number counts)

**The plan** is `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md` (`da72802e7`): read it
whole, §4.2, §4.3, §5.1 and §7 above all. **The decisions** are R-CFG-1..4 in `docs/decisions.md`, memo
`docs/ratifiche/claude_2026-10-14_memo_166_configurator.md`. This lane is steps 1 and 2 of the plan's §6.

**The issue** is #187 (`gh issue view 187 --repo jjodel-modeling/jjodel-frontend`): ten tasks, fourteen
acceptance criteria. **The mockups** are outside every tree, in `~/.jjodel-lanes/assets/166/`: look at
`187_1_basic_advanced_removed.png`, `187_2_header_save_role.png`, `187_3_panel_sections_components.png`
(the main one: read its blue notes), and `166_cardinality_today.png` / `166_cardinality_proposal.png`.
Colours in the mockups: GREEN new, ORANGE moved or changed, RED removed, BLUE a note.

What the Configurator shows today, read by the chat (plan §4.2): `ConfiguratorTab.tsx:528` mounts
`InstanceDetail` (the Data Manager's panel), whose header prints name and class (`InstanceDetail.tsx:1106`);
inside it `IRForm` prints «PROPERTIES» (`IRForm.tsx:533`), a Basic/Advanced control (`:539`), an identity row
and «No issues» (`:556`); references are sections (R-REF-1) with a `[n/m]` chip (`InstanceDetail.tsx:515`),
children are inline forms plus an «Add» bar; the field label prints `0..1` (`IRFormField.tsx:492-494`). The app
bar shows Save (`Navbar.tsx:2003`), the last-saved label (`:1994`) and Basic/Advanced (`:2015`) to developer
and consumer alike.

## COSA

### Step 1, consumer chrome (#187 tasks 1 and 3; the app-bar half of task 2)

- In consumer mode (`isConsumerMode()`, `components/environment/consumerMode.ts`) the app bar renders no
  Save, no last-saved label and no Basic/Advanced, nor the separators left orphaned. The developer's app bar
  is unchanged.
- The Configurator header: the title «Configurator» with the role chip right after it, on the left (mockup
  `187_2`). Without a role (the developer) the chip reads «No role — full access». The chip's tooltip says
  «role». The overlay's close button stays on the right.

### Step 2, the panel (#187 tasks 2, 4 to 10)

A new component, `components/environment/configurator/ConfiguratorPanel.tsx`, that `ConfiguratorTab` mounts
in place of `InstanceDetail`, page and developer overlay alike, with the same host handlers it passes today
(`openDelete`, `onCreate` with the #173 in-flight guard, `onCreateAndLink`, `permissionOf`, `nav`/`setNav`,
`scrollRef`). The plan's §5.1 is the design; in short:

1. **Header band**: «<Type> properties», the type being the class of the instance on screen, with `*` in the
   accent colour while this panel has written since the last save; the issues chip next to the title (no
   issues / n errors / n warnings, a click scrolls to the first field that carries it); on the right the save
   status («Unsaved» / «Saved»), **Save** (`saveProjectWithFeedback`, `common/libraries/saveProject.ts:60`) and
   **Delete** (the host's `openDelete`, under the instance's permission as today). The instance name is not in
   the header (the mockup's note: it repeats the name field).
2. **Breadcrumb and Back** as `InstanceDetail` has them (the `jjform` navigation), drill-in included.
3. **Three sections**, Identity / Attributes / Components, each with a chevron button (`aria-expanded`) that
   folds it; the fold remembered per metaclass in `localStorage` (try/catch: a convenience).
   - **Identity**: the name only.
   - **Attributes**: every attribute but the name.
   - **Components**: every reference and every composition, in one section (task 9).
4. **Field title**: `<label> (<cardinality>) [<Type>]` (task 7, mockup `187_3`), the cardinality in a smaller
   type. Labels (task 8): lower 0 / upper 1 → «Optional, single»; 1/1 → «Required, single»; 0/many →
   «Zero or more values»; ≥1/many → «Required, multiple»; a multi-valued feature also shows how many values it
   holds (@tmaog's «[3]» in #166, 2026-10-07). Derived reads «derived».
5. **The Data Manager view still applies**: the per-class view of the Data Manager viewpoint
   (`resolveIRView` + `resolveFormSpec(…, 'manager')`, as `InstanceDetail.summaryOf` resolves it) gives the
   labels, the order, the hidden features and the widget overrides (`overrideIsCompatible`). Nothing a
   developer authored there is lost.
6. **References** (non-containment, `shape.refs`): single → a card with the target's name, a one-line summary
   of its first attributes (`referenceSummary`), an «open» icon (drill-in) and a chevron that opens a picker
   with search, the candidates and «+ New» (create and link); empty → «(none selected)» with the same picker.
   Multi → one row per target (name, type, summary) with remove (unlink at the row's raw index, never delete,
   R-REF-3/R-REF-4 semantics) and open, then «+ Add target» (a picker of the assignable candidates, disabled at
   the upper bound). Candidates filtered for the role as today (`offerForProfile`).
7. **Compositions** (`shape.children`): creation only, no select (task 9). Each child is a nested card with
   delete (the host's `openDelete`, its confirmation) and open (drill-in). At the inline level (`rendersInline`)
   the card holds the child's own Identity and Attributes, editable, and its Components simplified; past it,
   and for the grandchildren inside a card, a card is the child's name plus its first attributes (task 10).
   A multi-valued composition lists its children collapsed, each expandable («extend», the mockup's note), then
   «+ Add <Type>», disabled at the upper bound. An empty single composition reads «(none added)» with «+ New».
8. **Role** (#187 «Usability note»): a type the role reads renders without inputs and with no create, delete,
   link or unlink; a type it hides is not shown, not offered, not reachable by navigation; a locked value in a
   containment slot stays locked; the profile's delete restriction stays the host's (`restrictDeleteForProfile`).
   Everything #157 step B measured stays true (`frontend/scripts/smoke/_tmp_157_b_verify.ts`).

Acceptance: the fourteen criteria of #187, each read from the DOM by the probe, plus: the Data Manager renders
exactly as on `staging` (the probe compares it BEFORE/AFTER).

Nothing delivered gets worse (rule 3): a behaviour of `InstanceDetail` in the Configurator that the panel
cannot keep is a question, not an omission.

## Phase 1: discovery (read-only on tracked code)

1. Read the root rules file (rules 1-11, 19, 20; §3.1, §5, §6, §8, §17, §21), `frontend/src/styles/CLAUDE.md`,
   `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (P4, P6, P8, P9, P11, P12, P13, P16),
   `docs/decisions.md` (RC-17, RC-21, RC-25, RC-26, RC-48; R-NEST-2, R-NEST-9; R-REF-1..7; R-CFG-1..4), the
   chat's plan whole, `docs/log-inbox/standalone-environment.md` and `docs/log-inbox/data-manager-ux.md` (last
   entries), and the whole of `ConfiguratorTab.tsx`, `InstanceDetail.tsx`, `IRForm.tsx`, `IRFormField.tsx`,
   `useFormWidgets.ts`, `formWrite.ts`, `formPermissions.ts`, `formDiagnostics.ts`, `formHosts.ts`,
   `jjform/refSlot.ts`, the `jjform` navigation module, `abstract/tabs/instanceTable.ts` (`referenceSummary`,
   `tableRow`), the widgets under `viewpoint/ir/widgets/` the panel would use, and `pages/components/Navbar.tsx`
   around the app bar's right side.
2. **The probe**, `frontend/scripts/smoke/_tmp_187_probe.ts` (gitignored). Models, copied by the chat into
   this worktree: `_tmp_172_probe.ts` with `_tmp_172_setup.js` (boot, the MM172 fixture, both hosts, helpers),
   `_tmp_157_b_verify.ts` with `_tmp_157_b_setup.js` (a profile with edit, read and hidden types),
   `_tmp_173_verify.ts` (Configurator gestures), `_tmp_172_smoke.ts` (the committed smoke through a wrapper);
   `README-probes.md`. One fixture: a class with attributes of types EString, EInt, EDouble, EBoolean, an
   enum and one multi-valued EString; references 1..1, 0..1, 1..\*, 0..2 and one read-only or derived; a
   composition 0..1 and one 0..\* whose child class has an attribute, a reference and a composition of its
   own; a profile with an `edit`, a `read` and a `hidden` type. `MODE=before` measures on the untouched
   code, in the Configurator page (`?profile=`) and overlay and in the Data Manager: per feature what renders
   (field, section, inline child, «Add» bar), the Basic/Advanced controls, «PROPERTIES», «No issues», the
   app bar's controls in consumer mode; and for every gesture available today (pick, change, unlink, link
   existing, add child, new & link, delete a child) the slot's raw `values`. That table is the oracle of
   Phase 2. Run it only through the launcher, in the foreground:
   `node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_187_probe.ts --port 3187 --id P-2026-10-14-1100`.
   Count failures with `const r = await …; failures += r;` (`npm run check:scripts`). The probe gotchas of
   the lane harness hold (dismiss `.donation-banner`, wait after a save, scroll then click).
3. **Census of what the panel replaces.** One row per behaviour of `InstanceDetail` as the Configurator hosts
   it (at least: drill-in, breadcrumb, Back and its scroll restore, the survivor after a delete, the read gate,
   hidden filtering of features, rows, children and candidates, `offerForProfile`, `isLockedValue`, the
   in-flight create guard, create-and-link, summaries, the view's labels/order/hidden/widgets, per-field
   diagnostics and the summary chip, refusal messages, dirty marks, broken-pointer rows, references the view
   author hides (R-REF-6), read-only and derived features, auto-id attributes, singleton and abstract targets
   (`newInstanceReason`)): where it is in the code, how the panel keeps it, or «dropped» with the reason.
4. **Attribute shapes.** What `IRFormField` renders for each attribute shape (single primitive per type,
   multi-valued, enum, the extended widgets of `formAutoLayout.extendedWidgetFor`, read-only, auto-id) and how
   the panel renders it, with the widget components it imports. A shape the panel cannot render with the
   existing widgets is a question.
5. **The pickers.** The reference picker with search, candidates and «+ New»: can `ReferencePicker` serve as it
   is (it may not be edited), or does the panel need its own small picker (anchored as `RefRowMenu` is, through
   `computeListStyle`)? Recommendation.
6. **Markup and styles.** The DOM per section and per card, the class names (one new prefix, checked absent
   with `command grep` and a positive control, P2; no existing class renamed), the tokens from
   `styles/tokens/` (rules 27 and 28), keyboard order, `aria-label` of every icon button, the icons (`bi-*`
   already in use). Texts in English.
7. **The pure module** `components/environment/configurator/panelModel.ts`, importable under node (no
   `joiner`, no React): at least the cardinality label, the partition into identity / attributes / components,
   the composition-vs-reference split, the fold key. Signatures, the test list, the mutation bench you will
   run (root rules file §5).
8. **Phase 2 plan in steps**, in an order that leaves no intermediate state worse than today (the panel can be
   built and tested before `ConfiguratorTab` mounts it). Per step: files (rule 19: more than five, each with
   what changes in it), tests with their bench, probe arms, gates, items of the visual checklist.
9. Write `docs/discovery/discovery_2026-10-14_187_configurator_panel.md`: it opens with
   `## 0. Answer in brief` (at most 40 lines: the answer, the recommendation, the decisions awaiting Juri, the
   questions each with its `Recommended:` line) and closes with «Decisions taken (unattended)» and «Decisions
   awaiting Juri» (items of the RC-26 list only). Do not write rows in `docs/decisions.md`: the chat writes them.
10. Commit the report alone: `docs(#187): Phase 1 report on the Configurator panel (P-2026-10-14-1100)`.
    `Outcome: hard-stop`.

## Phase 2: implementation (after `[P-2026-10-14-1100] GO`)

The GO carries the decisions, the approved steps and the confirmed file list. For each step:

1. Baseline of the gates on your tree before the first diff.
2. Tests before code for `panelModel.ts`; the panel itself does not import under node, so no source-text test
   (root rules file §5): the probe is its measure and the gap goes in the entry. The mutation bench of the
   tests you write goes in the commit message.
3. The probe, `MODE=after`, on port 3187, against the BEFORE table: the fourteen criteria, the gestures' raw
   `values`, the Data Manager unchanged, the step B behaviours (`_tmp_157_b_verify.ts` adapted to the panel,
   through the launcher).
4. Gates, all in the foreground, from `frontend/`, each read on its **complete** output with its exit status:
   `npm run typecheck` (exit 0, no `error TS`: the baseline is zero, RC-48), `npm run test` (the nine files red
   at import of the root rules file §17, nothing else red), `npm run build` (exit 0), `npm run check:docs`,
   `npm run check:addonly`, `npm run check:scripts`; the committed smoke through `_tmp_172_smoke.ts`.
5. One code commit per step, `feat(#187): <step> (P-2026-10-14-1100)`, the pathspec on the commit itself.
6. After the last step: the closure prepared and **not committed** (RC-17): the entry in
   `docs/log-inbox/configurator-panel.md` (a new inbox; the `log-entry` skill) and this prompt's `Status` line;
   then the final message with the shas, the BEFORE/AFTER table, the gates with their numbers, the diff of the
   touched files, «Decisions taken (unattended)», «Decisions awaiting Juri», a numbered visual checklist for
   Juri (page with a role that has edit, read and hidden types; the developer overlay; a nested composition;
   a multi-valued reference; Save) saying what the probe already covers, and `Outcome: hard-stop`.
7. On a message `[P-2026-10-14-1100] GO` after the visual check: one commit,
   `docs(#187): lane closure, entry and Status (P-2026-10-14-1100)`, then `Outcome: done`. Do not merge.

## DOVE

Phase 1:

- `docs/discovery/discovery_2026-10-14_187_configurator_panel.md`
- not committed: `frontend/scripts/smoke/_tmp_187_*.ts`; port **3187** only.

Phase 2, candidates the GO confirms or narrows (a file outside the confirmed list is a question):

- `frontend/src/pages/components/Navbar.tsx` (step 1 only: the consumer branch of the app bar's right side)
- `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/components/environment/configuratorTab.scss`
- `frontend/src/components/environment/configurator/` : new files only (the panel and its parts, its stylesheet,
  `panelModel.ts`, `__tests__/panelModel.test.ts`)
- `docs/log-inbox/configurator-panel.md`, this prompt's `Status` line.

Commits with the pathspec on the commit itself (`git commit -- <paths>`), the `Model:` trailer of P6 (the model
your session banner shows) and the tooling's `Co-Authored-By` line; the subject within 72 characters without the
`(P-…)` suffix. Docs and code never in one commit (P13).

## HARD STOP

- End of Phase 1: the report committed, `Outcome: hard-stop`.
- A measure of Phase 1 that contradicts the plan or the Context in a point that changes the design: written in the
  report, not worked around.
- In Phase 2: a step that worsens a behaviour measured in Phase 1, a new red gate, a file outside the confirmed
  list, an edit of a widget, of `IRForm.tsx`, `IRFormField.tsx`, `InstanceDetail.tsx` or `jjform/` that turns out
  to be needed: `Outcome: question`.

## NON FARE

- No edit to a tracked file under `frontend/` in Phase 1.
- No edit under `components/editor-v2/`, of `InstanceDetail.tsx`, `InstanceManagerTab.tsx`, `jjform/`,
  `joiner/`, the core, the reducer; nothing of the canvas sync; no VersionFixer migration; no change to a saved
  `FormSpec`; no new dependency; no renamed or removed identifier, CSS classes included; no exported interface
  changed except by an optional property.
- Not this lane: the project page and the wizard (`P-2026-10-14-1101`), the per-role presentation and the
  «Customize element» popup (R-CFG-3, a later lane), #188, field-level permissions, #167's validation.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`, `git clean`,
  `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree is read-only for
  this lane), a port other than 3187, a real call to an AI provider, a comment on an issue, a background gate.

## RIFERIMENTI

- Issues #166 (body and the comments of 2026-10-07 on cardinalities), #187, #172, #173, #157 (step B).
- `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md`; R-CFG-1..4; R-REF-1..7;
  `docs/discovery/discovery_2026-10-10_172_references_once.md`; `docs/discovery/discovery_2026-10-04_157_step_b_ir_form_profile.md`.
- `ConfiguratorTab.tsx:287-316, 518-547`; `InstanceDetail.tsx:343-671, 688-1287`; `IRForm.tsx:212-728`;
  `IRFormField.tsx:300-537`; `useFormWidgets.ts:168-187, 279-437`; `formPermissions.ts`; `formWrite.ts`;
  `Navbar.tsx:1986-2030`; `common/libraries/saveProject.ts:60`; `common/libraries/lastSaved.ts:105-111`.
- Mockups: `~/.jjodel-lanes/assets/166/187_*.png`, `166_cardinality_*.png`.
