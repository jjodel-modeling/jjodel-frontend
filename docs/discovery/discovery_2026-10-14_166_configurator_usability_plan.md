# Discovery — #166 Configurator usability: plan and design for #186, #187, #188

- **Prompt-ID**: none. Chat `C-2026-10-14-1020`, request of Juri in chat (2026-10-14): «cominciamo a lavorare
  una issue complessa […] la issue è la 166 […] Pianifica, progetta e poi implementa. Se hai cose da mostrare a
  tommaso, pusha su staging e chiedi di test a tommaso».
- **Session**: b85cb3e7-51d5-4e4a-b21c-66ad5b86a524
- **Tree**: `/Users/juridirocco/development/jjodel`, branch `staging`, HEAD `e8fd99c58`, clean.
- **Executor**: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
  the real files.

## 0. Answer in brief

#166 now has three sub-issues filed by @tmaog on 2026-10-12 with mockups (all read, §4.1): **#187** the
Configurator panel (end user), **#186** the project page «Endpoints» with roles and a «Customize Element» popup
(developer), **#188** a Configurator homepage with ownership (marked lower priority by @tmaog).

Recommendation, in four steps on one branch `feat/166-configurator-usability` (worktree `~/development/jjodel-166`),
pushed to `staging` for @tmaog after step 2 and after step 4:

1. **Consumer chrome** (#187 tasks 1–3): no Basic/Advanced and no app-bar Save in consumer mode; «Configurator»
   with the role chip beside it. 3 files.
2. **A Configurator panel of its own** (#187 tasks 2, 4–10): «<Type> properties» header with the issues chip,
   Save and its status, Delete; sections Identity / Attributes / Components with chevrons; field titles
   `name (Required, single) [Type]`; references and compositions in one Components section, references with a
   search select and «+ New», compositions create-only, nested elements as simplified cards. A NEW component in
   `components/environment/configurator/`, the Data Manager untouched. ~7 files, no critical-zone file edited.
3. **Endpoints section** (#186 tasks 1–3): the two wizard steps (Editable metaclasses, Roles) inline on the project
   page between Viewpoints and Documentation; «Profile» → «Role» in the UI only; non-selectable metaclasses folded
   away; a «Customize element» button per type, disabled on Hidden. ~6 files.
4. **Customize element** (#186 task 4): per role and per type, widget / label / show type name / CSS per field,
   card CSS per component, live render; stored as an optional field on `DProfile`; read by the panel of step 2.
   ~8 files, one D-layer class touched (Layer Impact Report before the diff).

Not in this round: #186 «Manage Profiles (Users)» and #188 ownership. Both need to know which user is behind a
role, which no entity records today (§4.6): that is #170. #167 decides whether «No issues» is true for a consumer.

Decisions awaiting Juri (questions in §8):
1. Direct work in this chat vs lane harness. Recommended: direct in this chat, on the branch above.
2. New Configurator panel vs a variant of `InstanceDetail` + `IRForm`. Recommended: new panel, Data Manager unchanged.
3. Where the per-role presentation lives. Recommended: optional `typePresentation` on `DProfile`.
4. Endpoints vs the «Configure environment» wizard. Recommended: Endpoints is the one place; the left-bar entry
   scrolls to it, the wizard stays in code (rule 9).

Adopted unless Juri objects (RC-21 style, inside the declared files): §7.1.

## 1. Hypotheses under test

- **H1** — The mockups of #186/#187/#188 can be built on the data the app already has. **Partly.** #187 and #186
  tasks 1–4 yes (§4.2–§4.5); #186 «Manage Profiles (Users)» and #188 ownership no (§4.6).
- **H2** — #187 is a re-skin of the current detail (`InstanceDetail` + `IRForm`). **Falsified.** The mockup moves
  references and compositions into one section with new controls, drops the form header, the identity row and the
  Basic/Advanced toggle, and changes every field title (§4.2). `IRForm` and `IRFormField` sit in the critical zone
  and are shared with the Data Manager and the canvas rail (§4.3).
- **H3** — «String → textarea» per type already exists. **Holds, at the wrong level.** `FormSpec.widgets` exists and is
  read, per view of the Data Manager viewpoint, equal for every role (§4.4). #186 asks for it per role.
- **H4** — The Endpoints section can reuse the wizard steps. **Holds.** `MetaclassesStep` and `ProfilesStep` are
  self-contained (they read and write the store directly) and take no props (§4.5).

## 2. Objective

Plan and design #166 as realised by its sub-issues: what to build, in which order, in which files, with which
decisions, before writing code.

## 3. Files read

- `frontend/src/components/environment/ConfiguratorTab.tsx` (whole, 577 lines)
- `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (whole, 1289 lines)
- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (whole, 730 lines)
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (whole, 443 lines)
- `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx` (lines 1–80 and the grep hits cited)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (lines 322–418)
- `frontend/src/components/envgen/steps/ProfilesStep.tsx`, `MetaclassesStep.tsx`, `EnvGenWizardModal.tsx` (whole)
- `frontend/src/joiner/environmentConfig.ts` (whole); `frontend/src/joiner/classes.ts` (1325–1350, 3715–3800)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (window 6034–6074, `DObject`)
- `frontend/src/components/project/ProjectEditor.tsx` (2860–2975, 3125–3177)
- `frontend/src/pages/components/Navbar.tsx` (1960–2060)
- `frontend/src/components/editor-v2/viewpoint/ir/widgets/NumberWidget.tsx` (lines 1–40)
- `docs/decisions.md` R-NEST-1..9, R-REF-1..7; `docs/PROTOCOL.md`; `CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`
- GitHub: #166 (body and 6 comments), #186, #187, #188, sub-issue links, the board «StandAlone Editor»; the 10
  images and the PDF attached to them, downloaded to the session scratchpad and viewed.

## 4. Findings

### 4.1 The sub-issues (read, GitHub, 2026-10-14)

`gh api repos/jjodel-modeling/jjodel-frontend/issues/166/sub_issues` returns #186, #187, #188, all open, all by
@tmaog on 2026-10-12, board column «Design Ready». #166 itself is «In progress».

- **#187** (Configurator panel, end user). Ten tasks and fourteen acceptance criteria. Remove Basic/Advanced; Save
  and its status inside the element panel; the Role tag next to «Configurator»; panel label «<Type> properties»;
  «No issues» next to it; sections Identity (name only) / Attributes / Components with a chevron; field title
  `name (cardinality) [Type]`; cardinality labels `0..1 → Optional, single`, `1..1 → Required, single`,
  `0..n → Zero or more values`, `1..n → Required, multiple` (the wording Juri proposed in #166 on 2026-10-07 and
  @tmaog accepted); references and children in one Components section, a reference with a search select and
  «+ New», a composition with creation only; nested elements in a list shown simplified (name and first
  attributes). Unchanged: the type column, the instance list, navigation to referenced and child elements.
  «Navigation to a nested element must respect the Configurator's Role».
  Mockup details (image 3): nested composition cards carry a trash and an «open» icon; a reference card carries the
  target's name, a one-line summary, «open» and a chevron that opens a dropdown with Search, results and «+ New»;
  a multi-valued reference lists rows with trash and open plus «+ Add target»; an empty single composition shows
  «(none added)» and «+ New»; «+ Add Phase» under a multi composition, «Disabled if the max number is matched».
  The header reads «Scenario* properties» with the asterisk in the accent colour.
- **#186** (project page, developer). An «ENDPOINTS» section on the project page between VIEWPOINTS and
  DOCUMENTATION, with two tabs «Editable metaclasses» and «Roles»; «Profile» becomes «Role» («As highlighted from
  Alfonso and Antonio»); per type a «Customize Element» button, disabled on Hidden; a «MANAGE PROFILES (Users)»
  list of the users who accessed the Configurator with that role; a short-term filter of non-selectable
  metaclasses; the «Customize Element» popup with ATTRIBUTES (widget, label, isTypeShown, CSS), COMPONENTS (card
  and interline CSS) and a live RENDER; Cancel / Done. First widgets: String = input, textarea, dropdown with a list
  and an «Other:» free entry; Numeric = stepper (−/+), input, dropdown of numbers; Enum = dropdown.
- **#188** (homepage, lower priority by @tmaog). All instances visible to the role, grouped by type, each with
  owner avatar, Delete (owner only), properties, expand, open. Two open questions (can a user modify others'
  instances; show a read-only flag).

### 4.2 What the Configurator shows today (read, `e8fd99c58`)

- Header: `ConfiguratorTab.tsx:367` `<div className="configurator__title"><i className="bi bi-grid-1x2" /> Configurator</div>`,
  the profile chip in the right group (`:369-378`).
- Detail: `ConfiguratorTab.tsx:528` mounts `<InstanceDetail` (the Data Manager's panel) with `permissionOf` (`:540`).
- The detail's header prints the instance name and class: `InstanceDetail.tsx:1106`
  `<span className="instance-manager__form-cls">{subjectStep.cls}</span>`.
- Inside it, `IRForm` prints the «PROPERTIES» eyebrow (`IRForm.tsx:533`), the Basic/Advanced control
  (`IRForm.tsx:539` `ariaLabel="Form detail level"`), an identity row (`:543-547`) and «No issues» (`:556`).
  An inline child mounts a second `IRForm`, hence the second toggle of #187 image 1.
- References are sections of `InstanceDetail` (R-REF-1) with a `[n/m]` chip (`InstanceDetail.tsx:515`
  `{slot.ref.of} [{slot.count}/{slot.ref.upper === -1 ? '*' : slot.ref.upper}]`), children are inline forms
  (`:1148-1206`) plus an «Add» bar (`:1255-1284`). Hence «children twice» (#166) and the two categories #187 merges.
- Raw multiplicity in the field label: `IRFormField.tsx:492-494` `{field.isDerived ? 'derived' : multiplicityLabel(field)}`,
  with `multiplicityLabel` = `` `${field.lowerBound}..${upper}` `` (`useFormWidgets.ts:404-407`).
- App bar, for developer and consumer alike: Save (`Navbar.tsx:2003` `className="appbar-save"`), last-saved label
  (`:1994`), Basic/Advanced (`:2015`).

### 4.3 Why a new panel and not a variant (read)

- `IRForm.tsx`, `IRFormField.tsx` and every file under `viewpoint/ir/` are in the critical zone (CLAUDE.md §3.1,
  «IR execution rendering»). `IRForm` is mounted by the Data Manager, the Configurator and the canvas rail
  (`IRForm.tsx:83-87` `host` = `'rail'` by default; `InstanceDetail.tsx:1133`, `:1169`).
- `InstanceDetail` was extracted on 2026-09-28 so the Data Manager and the Configurator are ONE surface
  (`InstanceDetail.tsx:6-11` «Two hosts, one component: a second copy of this panel would be two surfaces that
  drift at the first change»). #187 asks for exactly that drift: the Configurator becomes the end user's surface,
  the Data Manager stays the developer's.
- The pure pieces the new panel needs are already exported and reusable without editing their files:
  `refSlotControls`, `addChildReason`, `newInstanceReason`, the navigation (`navFor`, `drillInto`, `backOf`,
  `breadcrumbOf`) from `jjform`; `setValue` / `appendValue` / `clearValue` / `setObjectName` from `formWrite`;
  `featureAccessIn` / `isLockedValue` / `offerForProfile` from `formPermissions`; `resolveIRView` +
  `resolveFormSpec(…, 'manager')` for the Data Manager view's labels, order, hidden and widgets; the widgets
  `TextWidget`, `NumberWidget` (already a stepper, `NumberWidget.tsx:2` «value plus two stepper segments»),
  `SelectWidget`, `CheckboxWidget`, `ReferencePicker`.

### 4.4 Presentation config today (read)

- `irTypes.ts:371` `widgets?: Record<string, WidgetKind>;` with `WidgetKind` = `'text' | 'textarea' | 'select' |
  'checkbox' | 'color' | 'number' | 'reference' | 'link'` (`irTypes.ts:335-337`). Persisted IR, definitive once
  written (R-B9, `irTypes.ts:349-350`). No «dropdown of strings» nor «dropdown of numbers» in that vocabulary.
- `overrideIsCompatible` (`useFormWidgets.ts:168-187`) is the type-to-widget compatibility rule (text ↔ textarea,
  number → text, enum select only). #186's per-type widget list has the same shape and can reuse its idea.
- Per role: only `DProfile.typePermissions` (`classes.ts:3772`
  `typePermissions: Dictionary<Pointer<DClass>, 'hidden' | 'read' | 'edit'> = {};`), read by
  `resolveTypePermission` (`environmentConfig.ts:79-84`).

### 4.5 The wizard steps (read)

- `ProfilesStep` and `MetaclassesStep` take no props and write the store directly (`ProfilesStep.tsx:35`
  `export const ProfilesStep: React.FC = () => {`, `MetaclassesStep.tsx:15` likewise); the wizard mounts them at
  `EnvGenWizardModal.tsx:105-108`. They can be mounted by a section of the project page as they are.
- «Profile» wording: `ProfilesStep.tsx:122` `Profiles`, `:133` `placeholder="New profile name"`, `:136`
  `Add profile`. «Permissions per top-level type» at `:185`.
- Non-selectable metaclasses are listed disabled with their reason: `MetaclassesStep.tsx:84`
  `disabled={!!it.reason && !marked}`. #186 image 3 shows how long that list gets.
- The project page sections: Viewpoints `ProjectEditor.tsx:2876-2954`, Documentation `:2956-2959`. The left-bar
  entry is `LeftBar.tsx:502` `<span>Configure environment</span>`.

### 4.6 What is missing for «Manage Profiles (Users)» and #188 (read, with controls)

- No owner on a model element: window `LModelElement.tsx:6034-6074` (`export class DObject`) searched for
  `owner|creator|author`: no hit; positive control in the same window: `father` (line 6042) and `features`
  (6049) found. `joiner/classes.ts` searched for `owner\b|ownerId|createdBy`: no hit (exit 0, empty), control
  `typePermissions` found at 1345 and 3772.
- No record of which user opened a role: `components/environment` and `components/envgen` searched for
  `email|userId|DUser`: no file. The same search has signal elsewhere (`DUser.current` in
  `DocumentationTab.tsx:1167`, `ProfileSection.tsx:470`).
- Both are the subject of #170 (role assigned to a user by email, «My models»), «In progress» on the board.

## 5. Design

### 5.1 The Configurator panel (step 2)

`components/environment/configurator/ConfiguratorPanel.tsx`, mounted by `ConfiguratorTab` in place of
`InstanceDetail` (page and developer overlay alike, so the developer sees what the role sees).

- **Header band**: `<Type>` + `*` when this panel wrote since the last save + « properties», the issues chip
  (`collectFormDiagnostics` over `useNodeProblems`, as `IRForm` counts), then on the right the save status
  («Unsaved» / «Saved»), Save (`saveProjectWithFeedback`) and Delete (the host's `openDelete`, unchanged).
- **Breadcrumb and Back**: the `jjform` navigation, as today; drilling to a type the role hides does nothing; a
  `read` type renders without inputs (the soft gate of D1).
- **Identity**: the name only (`setObjectName`, or the `name` slot when the class has one, CLAUDE.md 3.12).
- **Attributes**: one field per attribute, title `name (cardinality) [Type]`, widget by the cascade
  role presentation (step 4) → Data Manager view `FormSpec` (`hosts.manager` resolved) → type-derived default.
  The Data Manager view's `order`, `labels`, `hidden` stay honoured, so nothing a developer authored is lost.
- **Components**: every reference and composition the role does not hide, in the view's order.
  - Reference (plain or aggregation that does not re-father): single → a card with name, summary line, open, and a
    chevron that opens `ReferencePicker` (search, results) with «+ New» (the host's create-and-link); multi → rows
    with remove (unlink, never delete, as R-REF-3) and open, «+ Add target». Writes at the raw index through
    `formWrite` after re-reading the slot (R-REF-4), candidates through `offerForProfile`.
  - Composition: the children as nested cards (Identity name, Attributes, Components reduced to name + summary),
    each with delete and open; «+ Add <Type>» disabled at the upper bound (the #173 in-flight guard of
    `ConfiguratorTab.createIn` kept); an empty single slot shows «(none added)» and «+ New». No select.
- **Cardinality labels** (pure, tested): lower 0 / upper 1 → «Optional, single»; 1/1 → «Required, single»;
  0/n → «Zero or more values»; ≥1/n → «Required, multiple»; a multi-valued title also shows the count
  (@tmaog's «[3]», #166 comment of 2026-10-07).
- **Sections fold** with a chevron, remembered per type in `localStorage` (try/catch, a convenience).

### 5.2 Per-role presentation (step 4)

Optional field on `DProfile`: `typePresentation?: Dictionary<Pointer<DClass>, TypePresentation>`, created lazily
(absent = `{}`), so no migration (precedent: `DEnvironmentConfig` itself, `classes.ts:3715-3717`).

```
TypePresentation = { fields?: Record<featureName, FieldPresentation> }
FieldPresentation = {
  widget?: 'input' | 'textarea' | 'dropdown' | 'stepper' | 'number-input' | 'number-dropdown';
  options?: string[];     // the dropdown's list
  allowOther?: boolean;   // «Other:» free entry
  label?: string;
  showType?: boolean;     // «isTypeShown», default true
  style?: string;         // CSS declarations for the field
  cardStyle?: string;     // components: the card
  lineStyle?: string;     // components: the separator
}
```

Its own vocabulary, not `WidgetKind`: the IR vocabulary is persisted and definitive (R-B9) and lives in the
critical zone; this one is the role's and lives in `environmentConfig.ts` with pure, tested helpers
(`presentationOf`, `widgetChoicesFor(typeName, isEnum)`, `styleOf(declarations)` that keeps only property
declarations, no `@import`, no `url(`). Enum keeps its dropdown. CSS is applied as inline style on the field and
card elements, so it cannot reach outside the panel.

The popup (`CustomizeElementModal`) edits a draft and writes it with one `SetFieldAction` on Done; its RENDER is
`ConfiguratorPanel` in a read-only preview mode on the type's first instance with the draft applied.

### 5.3 Endpoints (step 3)

`components/project/EndpointsSection.tsx` on the project page after Viewpoints, two tabs mounting
`MetaclassesStep` and `ProfilesStep` as they are. UI wording «Role» (identifiers, the `?profile=` URL parameter and
`DProfile` unchanged, rule 2). `MetaclassesStep` lists the selectable classes and folds the others behind
«Show N not selectable» (a marked one stays visible, so it can be removed). `ProfilesStep` gets «Customize
element» per type, disabled on Hidden.

## 6. Plan and files (rule 19)

| Step | Files | What changes |
|---|---|---|
| 1 | `pages/components/Navbar.tsx` | consumer mode: no Save, no last-saved label, no Basic/Advanced |
| 1 | `components/environment/ConfiguratorTab.tsx`, `configuratorTab.scss` | role chip beside «Configurator» |
| 2 | `components/environment/configurator/ConfiguratorPanel.tsx` (new) | header, sections, navigation, save |
| 2 | `…/configurator/AttributeField.tsx` (new), `ComponentField.tsx` (new) | field title + widget; component cards |
| 2 | `…/configurator/panelModel.ts` (new) + `__tests__/panelModel.test.ts` (new) | pure: cardinality, partition, widget cascade, summary |
| 2 | `…/configurator/configuratorPanel.scss` (new) | styles, existing tokens only (rule 28) |
| 2 | `components/environment/ConfiguratorTab.tsx` | mounts the panel instead of `InstanceDetail` |
| 3 | `components/project/EndpointsSection.tsx` (new) + scss, `ProjectEditor.tsx` | the section |
| 3 | `components/envgen/steps/ProfilesStep.tsx`, `MetaclassesStep.tsx` | Role wording, filter, Customize button |
| 3 | `pages/components/LeftBar.tsx` | «Configure environment» scrolls to Endpoints (if Q4 = recommended) |
| 4 | `joiner/classes.ts` | optional `typePresentation` on `DProfile` / `LProfile` (Layer Impact Report first) |
| 4 | `joiner/environmentConfig.ts` + its test | presentation types and pure helpers |
| 4 | `…/configurator/CustomizeElementModal.tsx` (new) + scss, `DropdownTextWidget.tsx` (new) | the popup, the string dropdown |
| 4 | `…/configurator/ConfiguratorPanel.tsx`, `AttributeField.tsx`, `ProfilesStep.tsx` | read the presentation, open the popup |

Gates per step: `npm run typecheck` 0 errors (RC-48), vitest on the touched tests, `npm run build`, a Playwright
probe in the scratchpad on the stand-alone page (role with edit, read, hidden types; create to the upper bound;
link existing; remove; save), `npm run smoke`, and the #157 step B verifier
`frontend/scripts/smoke/_tmp_157_b_verify.ts` adapted to the new panel. Log entries in
`docs/log-inbox/standalone-environment.md`.

## 7. Dependencies and risks

- **#167**: «No issues» is not computed for a consumer today (the producers live in the editor the consumer never
  mounts, #167 body). Moving the chip next to the title makes that claim more visible. Kept as the mockup asks;
  #167 is the fix.
- **Drift**: after step 2 the Data Manager and the Configurator are two surfaces (§4.3). R-REF-1..7 keep holding for
  the Data Manager; the Configurator follows #187 (icons in the card instead of the row menu of R-REF-3, same
  semantics: remove unlinks, never deletes).
- **Step B behaviours** (#157) must survive the move: hidden-typed features absent, no hidden candidates, locked
  values in containment slots, profile-restricted delete. Covered by reusing `formPermissions` and by the verifier.
- **D-layer** (step 4): one optional field on an entity outside the model graph, no creator in a TRANSACTION, no
  sync path. Layer Impact Report in chat before the diff of `classes.ts`.
- **User CSS**: limited to property declarations applied inline; `url(` and `@` rules dropped.

### 7.1 Adopted unless Juri objects

1. Save sits in the panel header beside Delete (#187 text «inside the element's panel»; image 2 places it in the
   Configurator header row; the text wins, @tmaog corrects at test).
2. The developer's Configurator overlay gets the same panel (it previews the role).
3. In consumer mode the app bar loses Save, the last-saved label and Basic/Advanced; the developer's keeps them.
4. «Manage Profiles (Users)» and #188 wait for #170; field-level permissions (#166 comment of 2026-10-04) and
   «the consumer cannot create a missing model» stay open in #166, not in this round.
5. `0..5`-style bounds read «Zero or more values» / «Required, multiple» plus the count; the upper bound is said by
   the disabled «+ Add» (as the mockup does).

## 8. Questions

1. Run the implementation directly in this chat (branch and worktree above, same gates and logs) or through the lane
   harness? Recommended: directly in this chat.
2. Build a Configurator-only panel and leave the Data Manager's `InstanceDetail` as it is? Recommended: yes, new panel.
3. Store the per-role presentation as an optional `typePresentation` on `DProfile`? Recommended: yes.
4. Make Endpoints the one place (left-bar entry scrolls there, the wizard stays in code unreached)? Recommended: yes.
