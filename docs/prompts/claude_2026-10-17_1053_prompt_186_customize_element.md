# Prompt: #186, «Customize element»: the per-role presentation of a type

Prompt-ID: P-2026-10-17-1053
Chat: C-2026-10-14-1020
Lane: full (more than three files; a D-layer class, `joiner/classes.ts`; a visual check)
Depends: P-2026-10-14-1100, P-2026-10-14-1101
Front: standalone-editor
Request: https://github.com/jjodel-modeling/jjodel-frontend/issues/186 (Juri's words in chat are `request.md` in the lane folder, RC-43)
Status: eseguito 2026-10-29 · lane customize-element · 57c5e8e27 · verifica visiva passata 2026-10-29
Limite: 60 minuti per la Fase 1, 90 minuti per ogni passo della Fase 2

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the visual GO), Juri decides for this lane.

Critical zone: none is edited. `joiner/classes.ts` is not a row of the root rules file §3.1, but it is the
D-layer (rule 20): R-CFG-3 (ratified by Juri) approves ONE optional field on `DProfile` / `LProfile`, and the
Layer Impact Report of §3.2 is written on file, `docs/lir/lir_2026-10-17_186_type_presentation.md`, before that
diff. The panel imports from `viewpoint/ir/`, as P-2026-10-14-1100 did; importing is not editing: an edit under
`components/editor-v2/`, of `InstanceDetail.tsx`, of `jjform/` or of the core is a `question`.

Worktree: `/Users/juridirocco/development/jjodel-186c`, branch `feat/186-customize-element`, cut from `staging`
at `4fe736878` (both lanes of #166 merged and pushed); `frontend/node_modules` is a symlink to the main tree's
(P14: do not remove it). Before anything else: `pwd` is that worktree, the branch is
`feat/186-customize-element`, `git log -1` is the commit that adds this file (subject
`docs: add prompt P-2026-10-17-1053, #186 Customize element`), `git status` is empty; otherwise stop with
`Outcome: blocked`.

Two phases (P4): Phase 1 read-only on tracked code, the report, `Outcome: hard-stop`; Phase 2 only after a
message `[P-2026-10-17-1053] GO` that carries the decisions and the confirmed file list.

## Lane discipline

Every reply of this session opens with `[P-2026-10-17-1053 · session <id>]` (`session unknown` if you cannot
see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one
line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).

## Context (read by the chat on `4fe736878`: verify, do not trust; re-measure where a number counts)

**The plan** is `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md` (§5.2 above all).
**The decisions** are R-CFG-1..5 in `docs/decisions.md`; R-CFG-3 is this lane's: the per-role presentation is an
optional field of `DProfile`, `typePresentation`, keyed by metaclass id, created at first use, absent read as
empty, no migration, with the role's own widget vocabulary (not the IR's `WidgetKind`, R-B9). The name is free:
`command grep -rn typePresentation frontend/src` exit 1 on `4fe736878`, control `typePermissions` found at
`classes.ts:1345, 3772`.

**The issue** is #186, tasks 2 and 4 (`gh issue view 186 --repo jjodel-modeling/jjodel-frontend`):
- task 2: in the Roles tab, per top-level type, a «Customize Element» button that opens the popup; disabled when
  the type's permission is Hidden;
- task 4: the popup «Configure customize CSS»: ATTRIBUTES (per simple field: widget, label, isTypeShown, a CSS
  editor), COMPONENTS (per reference or composition: CSS for the card and the interline), a live RENDER of the
  type, Cancel / Done. First widgets: String = input, textarea, dropdown with a list and an «Other:» free entry;
  Numeric = stepper (− / +), input, dropdown of numbers; Enum = dropdown, as the metamodel defines it. The popup's
  own text: «CSS styling is allowed only — the element type itself remains unchanged (e.g., an input element will
  always remain an input element)».

**The mockups**, outside every tree, in `~/.jjodel-lanes/assets/166/`: `186_2_roles_customize.png` (the button on
the permission rows), `186_4_customize_popup.png` (the popup, read its blue notes). GREEN new, BLUE a note.

**What landed** (read on `4fe736878`):
- the Configurator panel of P-2026-10-14-1100: `components/environment/configurator/ConfiguratorPanel.tsx` (props
  `ConfiguratorPanelProps`, `:61-80`), `PanelFields.tsx` (`PanelEnv` and its context `:48-88`, `FieldTitle`
  `:130`, `useObjectModel` `:195`, `ObjectFields` `:224`), `PanelComponents.tsx` (`ObjectView` `:66`),
  `ComponentPicker.tsx`, `panelModel.ts`, `configuratorPanel.scss`; mounted by `ConfiguratorTab.tsx`, which knows
  the active role (`profile`);
- the Endpoints window of P-2026-10-14-1101: `components/project/EndpointsWindow.tsx`, mounting
  `components/envgen/steps/ProfilesStep.tsx`, whose permission rows are `div.envgen-perm-row` (`:192-200`);
  «Done» saves the project.

## COSA

1. **The data** (R-CFG-3): `typePresentation?: Dictionary<Pointer<DClass>, TypePresentation>` on `DProfile` and
   `LProfile` in `joiner/classes.ts`; the types and the pure helpers in `joiner/environmentConfig.ts` (zero
   imports, testable under node): `TypePresentation` = per feature name a `FieldPresentation` { widget?, options?,
   allowOther?, label?, showType?, style? } plus, for components, cardStyle? and lineStyle?; `presentationOf(profile,
   classId)`, `widgetChoicesFor({ typeName, isEnum, isMultivalued })`, and a CSS sanitiser that turns the
   author's declarations into a style object keeping property declarations only (no `url(`, no `expression(`, no
   `@` rule, no `behavior`, no `position: fixed`; camelCase keys). One `SetFieldAction` on the profile at «Done» of
   the popup, `U.isProjectModified = true`, as `ProfilesStep` writes `typePermissions`.
2. **The panel reads it** for the active role only (no role, the developer overlay: no presentation): label,
   show-type (`[Type]` in the title), widget (input / textarea / stepper / number input map onto the IR widgets the
   field already renders through `FormSpec.widgets` and `overrideIsCompatible`; the two dropdowns are a new
   widget of the panel, writing through `formWrite`), the field's style, the component card's and separator's
   style. Through `PanelEnv` (an optional entry) and the panel's props from `ConfiguratorTab`.
3. **The button** in the Roles tab (task 2): «Customize element» on every permission row, disabled on Hidden with
   a tooltip saying why; it opens the popup for that role and that type.
4. **The popup** (task 4): a modal above the Endpoints window. ATTRIBUTES and COMPONENTS of the type as in the
   mockup, each widget choice offered only from `widgetChoicesFor`; a CSS editor per entry; RENDER: the panel
   itself, read only, on the type's first instance with the draft applied, or a sentence saying the project has
   no instance to preview. Cancel drops the draft; «Done» writes it (point 1). The text of the popup in English,
   from the mockup.

Acceptance, read from the DOM: the button on every row, disabled on Hidden; the popup's RENDER changes when the
draft changes, before «Done»; after «Done» and a save, the stand-alone link of that role shows the label, the
widget and the style chosen, and another role does not; Cancel writes nothing; an `url(` in a CSS entry is dropped;
the Data Manager and the developer overlay unchanged.

## Phase 1: discovery (read-only on tracked code)

1. Read the root rules file (rules 1-11, 19, 20; §3.1, §3.2, §5, §6, §8, §17, §21), `frontend/src/styles/CLAUDE.md`,
   `frontend/src/model/CLAUDE.md`, `docs/PROTOCOL.md` (P4, P5, P6, P8, P9, P11, P12, P13, P16), `docs/decisions.md`
   (RC-17, RC-21, RC-25, RC-26, RC-48, R-CFG-1..5), the chat's plan, the Phase 1 reports of the two lanes
   (`docs/discovery/discovery_2026-10-14_187_configurator_panel.md`, `..._186_endpoints.md`), and the whole of the
   files under «What landed», `joiner/environmentConfig.ts` and its test, the `DProfile` / `LProfile` classes and
   the `DProfile(...)` constructor step in `joiner/classes.ts`, `useFormWidgets.ts` (`overrideIsCompatible`).
2. **The probe**, `frontend/scripts/smoke/_tmp_186c_probe.ts` (gitignored). Models, copied by the chat into this
   worktree: `_tmp_187_probe.ts` (the panel's fixture MM187, its role, its helpers), `_tmp_186_probe.ts` (the
   Endpoints window, its menu gestures), `_tmp_172_setup.js`, `_tmp_157_b_setup.js`, `_tmp_172_smoke.ts`;
   `README-probes.md`. `MODE=before` measures on the untouched code: what a role's stand-alone panel renders for
   each attribute shape (widget, label, title), the cards' computed styles, a profile's raw fields before and after
   a save and a reload (does an unknown dictionary field written by `SetFieldAction` on a `DProfile` survive? the
   `typePermissions` precedent), and the undo entries of a profile write. Run it only through the launcher, in the
   foreground: `node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_186c_probe.ts --port 3188 --id P-2026-10-17-1053`.
   Count failures with `const r = await …; failures += r;` (`npm run check:scripts`).
3. **The data path**: where the field is declared and initialised (and whether it must be: absent = `{}`), how the
   L-proxy reads a dictionary of objects, the persistence round trip, the undo entry; the Layer Impact Report's
   content as a draft (not yet on file).
4. **The widget mapping**: per vocabulary entry, what renders it (an IR widget through the field, or the new
   dropdown widget), what `overrideIsCompatible` allows, and what an enum, a boolean, a multi-valued attribute and a
   read-only field offer (a choice that cannot render is not offered).
5. **The CSS**: the editor's form (declarations text vs the mockup's object notation; recommendation), the
   sanitiser's rules, test list and mutation bench; where each style lands in the panel's DOM (field, card,
   separator), measured on the panel's markup.
6. **The RENDER**: how the panel can render read-only with a draft (a prop of the panel, the role's `read`
   permission, or another way), on which instance, and what it costs; the stacking of a modal above the Endpoints
   window (P11: `elementsFromPoint`).
7. **Markup and styles** of the button and the popup: class names (one new prefix, checked absent with
   `command grep` and a positive control, P2), tokens (rules 27, 28), keyboard and focus (the popup traps focus and
   gives it back), texts.
8. **Phase 2 plan in steps** (data and pure helpers first, then the panel reading it, then the button and the
   popup), per step: files (rule 19: more than five, each with what changes), tests and bench, probe arms, gates,
   visual checklist items.
9. Write `docs/discovery/discovery_2026-10-17_186_customize_element.md`: it opens with `## 0. Answer in brief` (at
   most 40 lines: the answer, the recommendation, the decisions awaiting Juri, the questions each with its
   `Recommended:` line) and closes with «Decisions taken (unattended)» and «Decisions awaiting Juri» (items of the
   RC-26 list only). Do not write rows in `docs/decisions.md`: the chat writes them.
10. Commit the report alone: `docs(#186): Phase 1 report on Customize element (P-2026-10-17-1053)`.
    `Outcome: hard-stop`.

## Phase 2: implementation (after `[P-2026-10-17-1053] GO`)

The GO carries the decisions and the confirmed file list. For each step:

1. Baseline of the gates on your tree before the first diff.
2. The step that edits `joiner/classes.ts`: the Layer Impact Report on file first
   (`docs/lir/lir_2026-10-17_186_type_presentation.md`, its own docs commit), then the diff.
3. Tests before code for the pure helpers (`environmentConfig.ts`, `panelModel.ts` if touched); the components do
   not import under node, so no source-text test (root rules file §5): the probe is their measure and the gap goes
   in the entry. The mutation bench goes in the commit message.
4. The probe, `MODE=after`, on port 3188, against the BEFORE table and the acceptance above; the regression runs of
   `_tmp_187_probe.ts` (the panel without a presentation) and of the Endpoints arms of `_tmp_186_probe.ts`.
5. Gates, all in the foreground, from `frontend/`, each read on its **complete** output with its exit status:
   `npm run typecheck` (exit 0, RC-48), `npm run test` (the nine files red at import of §17, nothing else red),
   `npm run build` (exit 0), `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`; the committed
   smoke through `_tmp_172_smoke.ts`.
6. Code commits `feat(#186): <what> (P-2026-10-17-1053)`, the pathspec on the commit itself.
7. After the last step: the closure prepared and **not committed** (RC-17): the entry in
   `docs/log-inbox/customize-element.md` (a new inbox; the `log-entry` skill) and this prompt's `Status` line; then
   the final message with the shas, the BEFORE/AFTER table, the gates with their numbers, the diff of the touched
   files, «Decisions taken (unattended)», «Decisions awaiting Juri», a numbered visual checklist for Juri (a console
   setup script he can run in a new empty project, as `_tmp_172_setup.js`), and `Outcome: hard-stop`.
8. On a message `[P-2026-10-17-1053] GO` after the visual check: one commit,
   `docs(#186): lane closure, entry and Status (P-2026-10-17-1053)`, then `Outcome: done`. Do not merge.

## DOVE

Phase 1:

- `docs/discovery/discovery_2026-10-17_186_customize_element.md`
- not committed: `frontend/scripts/smoke/_tmp_186c_*.ts` and a `_tmp_186c_setup.js`; port **3188** only.

Phase 2, candidates the GO confirms or narrows (a file outside the confirmed list is a question):

- `frontend/src/joiner/classes.ts` (the optional field on `DProfile` / `LProfile` only), `frontend/src/joiner/environmentConfig.ts`,
  `frontend/src/joiner/__tests__/environmentConfig.test.ts`
- `frontend/src/components/environment/configurator/` (the panel's files; new files: the popup, its stylesheet,
  the dropdown widget)
- `frontend/src/components/environment/ConfiguratorTab.tsx` (passing the role's presentation)
- `frontend/src/components/envgen/steps/ProfilesStep.tsx` (the button and the popup's mount)
- `docs/lir/lir_2026-10-17_186_type_presentation.md`, `docs/log-inbox/customize-element.md`, this prompt's `Status` line.

Commits with the pathspec on the commit itself (`git commit -- <paths>`), the `Model:` trailer of P6 and the
tooling's `Co-Authored-By` line; the subject within 72 characters without the `(P-…)` suffix. Docs and code never
in one commit (P13).

## HARD STOP

- End of Phase 1: the report committed, `Outcome: hard-stop`.
- A measure that contradicts the plan, R-CFG-3 or the Context in a point that changes the design: written in the
  report, not worked around (a profile field that does not survive the save is such a point).
- In Phase 2: a worsened behaviour, a new red gate, a file outside the confirmed list, an edit under
  `components/editor-v2/` or of `jjform/`, a VersionFixer migration that turns out to be needed: `Outcome: question`.

## NON FARE

- No edit to a tracked file under `frontend/` in Phase 1.
- No VersionFixer migration; no edit of `IRForm.tsx`, `IRFormField.tsx`, the widgets under `viewpoint/ir/widgets/`,
  `InstanceDetail.tsx`, `InstanceManagerTab.tsx`, the reducer, the core outside the one optional field; no change
  to a saved `FormSpec`; no new dependency (no CSS parser library); no renamed or removed identifier, CSS classes
  included; no exported interface changed except by an optional property.
- Not this lane: «Manage Profiles (Users)» (#170), #188, field-level permissions, #167's validation.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`, `git clean`,
  `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree is read-only for this
  lane), a port other than 3188, a comment on an issue, a background gate.

## RIFERIMENTI

- Issues #186 (tasks 2 and 4), #166, #187.
- `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md` §5.2; R-CFG-1..5;
  `docs/ratifiche/claude_2026-10-14_memo_166_configurator.md`.
- `joiner/classes.ts:1325-1350, 3715-3800`; `joiner/environmentConfig.ts:79-84`; `ProfilesStep.tsx:103-109, 185-205`;
  `components/environment/configurator/*`; `components/project/EndpointsWindow.tsx`; `useFormWidgets.ts:168-187`.
- Mockups: `~/.jjodel-lanes/assets/166/186_2_roles_customize.png`, `186_4_customize_popup.png`.
