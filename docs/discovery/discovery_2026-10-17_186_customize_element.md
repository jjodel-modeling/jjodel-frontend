# Discovery — #186 «Customize element»: the per-role presentation of a type (Phase 1)

- **Prompt-ID**: P-2026-10-17-1053 (`docs/prompts/claude_2026-10-17_1053_prompt_186_customize_element.md`), chat `C-2026-10-14-1020`, director Juri.
- **Session**: unknown (not visible to the session). Resumed on 2026-10-20 after the account's spend limit stopped the first run (2026-10-17, 7 minutes, no work lost).
- **Tree**: `/Users/juridirocco/development/jjodel-186c`, branch `feat/186-customize-element`, HEAD `2c1e694e4`, clean; no tracked file under `frontend/` edited. Decisions R-CFG-6..9 read from `26c2814ef` (staging), not on this branch.
- **Executor**: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

R-CFG-3 holds as written. A `DProfile` takes an unknown dictionary field through `SetFieldAction`: one undo entry, the L-proxy reads it as a plain object, and it survives a save, a reload and the stand-alone load. Measured P1-P8 on `2c1e694e4`, probe `_tmp_186c_probe.ts` on 3188: **0 failures, no page error**. Nothing contradicts the plan. Three measures sharpen it:
- **Field CSS on the field box does not reach the control.** An inline style on `.cfg-panel__field` paints the box. Of the text properties, only the font family reaches the label, and nothing reaches the input or select (C1). So the mockup's example (font, weight, colour) would do almost nothing.
- **A «number input» cannot go through `TextWidget`.** `setValue(duration, "45")` writes the string `"45"` into an EInt slot (N1). It has to be `NumberWidget` with its two buttons hidden.
- **A RENDER that uses the role's `read` permission shows no widget.** The read-only branch draws text, not inputs. The preview is the live panel inside an `inert` container. Native `inert` blocks focus and clicks (I1). React's own handling of the attribute is not measured (I2).

Recommendation: Phase 2 in three steps, 14 code files (§9).
- **A**: data and pure helpers: `environmentConfig.ts` and its test, then `classes.ts` after the Layer Impact Report on file.
- **B**: the panel reads the role's presentation.
- **C**: the button in Roles and the popup.

Step A touches no file of lane P-2026-10-20-1123. **B and C rely on panel lines that R-CFG-6 and R-CFG-7 move** (§8), so the GO should have this lane take the trunk after that lane merges, before B.

Decisions awaiting Juri (RC-26 list): **none**. `joiner/classes.ts` gets the one optional field that R-CFG-3 already approves, with its Layer Impact Report on file. Nothing is deleted or migrated, and no exported interface breaks a consumer.

Questions (detail §10):
1. Where the field's CSS lands.
   Recommended: on the field box; each text property the author declares also reaches the title and the control through one scoped rule per property.
2. What «interline» is.
   Recommended: the separators between a component's entries, styled as lines (`border-color`, `border-width`, `border-style`; spacing by `padding`/`margin`).
3. The CSS editor's notation.
   Recommended: CSS declarations (`font-weight: 600; color: #0f172a`), camelCase names accepted.
4. Which elements a type's presentation reaches.
   Recommended: every element of that exact class the panel shows (subject, card, drilled-in), the role's only.
5. The Phase 2 file list (14 code files, rule 19, §9).
   Recommended: confirm as listed.
6. Order with P-2026-10-20-1123.
   Recommended: step A now; take the trunk once that lane is merged, then steps B and C.

## 1. Hypotheses under test

- **H1**: an unknown dictionary field written by `SetFieldAction` on a `DProfile` survives save and reload, as `typePermissions` does. **Holds** (measured P1, P7b, P8).
- **H2**: absent reads as empty, so the field needs no constructor step and no migration. **Holds**: a fresh `DProfile` has no `typePresentation` key (P0). Every reader that treats `undefined` as `{}` is total.
- **H3**: the role's widget vocabulary maps onto widgets the field already renders. **Partly.** Input, stepper and textarea map. «Number input» needs `NumberWidget` without its buttons, not `TextWidget` (N1). The two dropdowns are new.
- **H4**: an inline style on a field reaches what the author means. **Falsified for text properties** (C1). Box properties apply.
- **H5**: the RENDER can be the panel itself under the role's `read` permission. **Falsified**: read-only renders values as text, so the widget choice could not be previewed. `inert` instead (I1).
- **H6**: a modal above the Endpoints window is reachable and can keep Escape for itself. **Holds**: an overlay at `--z-alert` is on top at the pixel (E3). Escape stopped at its root leaves the window open, and the same key unstopped closes it (E4).

## 2. Objective

Phase 1 of P-2026-10-17-1053: measure the data path, the widgets, the CSS landing points, the preview and the stacking on the untouched code; design the button, the popup and the panel's reading; plan Phase 2.

## 3. Files read

- Rules: `CLAUDE.md`, `frontend/src/styles/CLAUDE.md`, `frontend/src/model/CLAUDE.md`, `docs/PROTOCOL.md` (P1-P16), `docs/decisions.md` (RC-17, RC-20, RC-21, RC-25..28, RC-48, R-B9, R-CFG-1..5 on `2c1e694e4`; R-CFG-6..9 on `26c2814ef`).
- Plan and reports: `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md`, `..._187_configurator_panel.md`, `..._186_endpoints.md` (whole); inboxes `docs/log-inbox/endpoints.md`, `configurator-panel.md`; the prompt of the parallel lane, `git show 850d50359:docs/prompts/claude_2026-10-20_1123_prompt_187_tmaog_round1.md` (whole).
- Issue #186 (body), mockups `~/.jjodel-lanes/assets/166/186_2_roles_customize.png`, `186_4_customize_popup.png`, the lane's `request.md`.
- Code, whole: `frontend/src/components/environment/configurator/ConfiguratorPanel.tsx`, `PanelFields.tsx`, `PanelComponents.tsx`, `ComponentPicker.tsx`, `panelModel.ts`, `configuratorPanel.scss`; `components/environment/ConfiguratorTab.tsx`; `components/project/EndpointsWindow.tsx`; `components/envgen/steps/ProfilesStep.tsx`; `joiner/environmentConfig.ts`, `joiner/__tests__/environmentConfig.test.ts`; `editor-v2/viewpoint/ir/useFormWidgets.ts`, `IRFormField.tsx`.
- Code, windows: `joiner/classes.ts` 1320-1352, 3705-3800; `joiner/index.ts` 75-93; `editor-v2/viewpoint/ir/formAutoLayout.ts` 370-448; `jjform/layout.ts` 127-147, 173-174, 270-400; `ir/widgets/index.ts` 1-80, `TextWidget.tsx` 1-80, `GrowTextWidget.tsx` 1-60, `NumberWidget.tsx` 1-133, `SelectWidget.tsx` 1-60; `ir/useIRFormView.ts` 40-143; `ir/formWrite.ts` 1-80 and its exports; `redux/reducer/reducer.ts` 380-480; `editor-v2/hooks/shapeAdapter.ts` 40-70, `useEditorMode.ts` 178-203; `jjform/shape.ts` 92-135; `model/logicWrapper/LModelElement.tsx` 3156-3163; `styles/tokens/_z-index.scss` (the token list); `scripts/smoke/README-probes.md`, `_tmp_187_probe.ts` 1-660 and 870-1012, `_tmp_186_probe.ts` 1-80, 250-440, `states.ts` (exports, `link`).

## 4. Findings (measured, `2c1e694e4`, `_tmp_186c_probe.ts`, `MODE=before`, port 3188)

Fixture MM186C, asserted F0-F5: Scenario { title, notes EString 0..1; duration EInt 1..1; budget EDouble 0..1; active EBoolean 0..1; level Level 0..1 (enum Low/Medium/High); tags EString 0..*; serial EInt isID; goal → Goal 0..1; learners → Learner 0..*; phases ◆ Phase 0..* }, Phase { name EString 1..1, minutes EInt 0..1 }, Goal { description }, Learner { nickname }, Room { capacity }. Instances: Scenario_A (valued, PhA and PhB inside, G1, L1, L2), Scenario_B. Top-level types: Scenario, Goal, Room. Roles: **Edu** (Learner read, Room hidden) and **Guest** (no override). Log: `~/.jjodel-lanes/P-2026-10-17-1053/probe-_tmp_186c_probe.log`; table `186c_before.json` beside it. Run: 0 FAIL, `EXIT=0`, no page error. Console: `init_dash` and the offline notifications fetch, as in #172 and #187.

### 4.1 The data path (P0-P8)

| arm | measure |
|---|---|
| P0 | fresh `DProfile` raw keys: `__readonly, _state, _storePath, _subMaps, className, clonedCounter, derivedMap, father, id, name, parent, pointedBy, typePermissions, zoom`: **no `typePresentation`** |
| P1 | `SetFieldAction.new(prof, 'typePresentation', {<Scenario>: {fields: {...}}, <Goal>: {...}}, '', false)`: the raw value is equal to the written one, nested objects intact |
| P2 | undo stack 0 → 1 for that write, with recording on (`U.userHasInteracted`, `globalcanundostate`, as `_tmp_186_probe.ts` sets them) |
| P3 | `LPointerTargetable.fromPointer(prof).typePresentation`: `typeof` object, JSON equal to the raw, `__raw` equal. `typePermissions` reads the same way (control) |
| P4 | `pointedBy` entries of the Scenario class naming the profile: 0 → **1** after the write |
| P5 | a second write `{<Scenario>: {...}}` **replaces** the dictionary (the Goal key and the Scenario `goal` entry gone): no merge |
| P6 | Guest untouched (`(absent)`), per contrasto with Edu |
| P7 | save → reload: raw `typePresentation` equal to the last write; `typePermissions` still 2 keys (control); Guest still absent. Keys after the reload: `_state, className, clonedCounter, father, id, name, pointedBy, typePermissions, typePresentation` |
| P8 | the stand-alone load (`?profile=` Edu, reload) holds the same raw value |

**Read:** P4 comes from the reducer, which takes an object value's keys and values as pointer candidates. `reducer.ts:399` `else newpointerdestinations = U.ArrayMerge(Object.keys(newVal), Object.values(newVal));`, then `PointedBy.add`/`remove` on the difference (`:408-410`). The scan is shallow: nested objects are not pointers. `typePermissions` is keyed by the same class pointers, so this is the precedent's behaviour, not a new one. A replace removes the entries of the keys that left (`:409`).

**Read, the declaration:** `classes.ts:3772` `typePermissions: Dictionary<Pointer<DClass>, 'hidden' | 'read' | 'edit'> = {};` and the constructor step at `classes.ts:1345` `_this.typePermissions = {};`. The new field needs neither an initialiser nor a constructor line (H2). The project compiles with `target: ES2020` (`frontend/tsconfig.json`), so a `typePresentation?: …;` with no initialiser emits no own property. `DProject.activeLayout?: string;` (`classes.ts:3097`) is the in-file precedent.

### 4.2 What the role's panel renders today (W)

Stand-alone page, Edu, Scenario_A (`W0.left` = Scenario, Goal: Room hidden; `W0.list` = Scenario_A, Scenario_B, creation order):

| field | section | title | kind | control path (from the field) | cell |
|---|---|---|---|---|---|
| name | identity | `name [String]` | input | `div.ir-field > div._inputWrapper… > div._inputContainer… > input._input…` | none |
| title, notes | attributes | `title (Optional, single) [String]` | input | same | span 6, `string` |
| duration | attributes | `duration (Required, single) [Int]` | stepper, 2 buttons | `div.ir-field > div.ir-field__stepper > input.ir-field__stepper-value` | span 3, `number` |
| budget | attributes | `budget (Optional, single) [Double]` | stepper | same | span 3 |
| active | attributes | `active (Optional, single) [Boolean]` | checkbox | `label.ir-field__checkbox > input…` | span 3 |
| level | attributes | `level (Optional, single) [Level]` | select | `div._wrapper… > select._select…` | span 3, `enumShort` |
| tags | attributes | `tags (Zero or more values · 2) [String]` | chip input | — | span 6, `collection` |
| serial | attributes | `serial (Optional, single) [Int]` | read-only | `div.ir-field__readonly` | span 3 |

Components: `goal` one `.cfg-panel__ref-card`; `learners` one `.cfg-panel__ref-list` with 2 `.cfg-panel__ref-row`; `phases` two `.cfg-panel__child`. W3, per contrasto with P8: the profile holds a presentation and nothing renders it («Headline» absent from the panel).

### 4.3 Where a style lands (C)

C1, computed styles before and after `style="color: rgb(200,0,0); font-weight: 800; font-family: serif; font-size: 21px; background-color: rgb(0,0,200)"` on `.cfg-panel__field` (title, duration, level alike):

| element | before | after |
|---|---|---|
| field box | slate-900, Inter Variable, 400, 15px, transparent | **all five applied** |
| `.cfg-panel__label` | slate-600, Inter, 500, 12px | **only the family** (serif); colour, weight, size unchanged |
| `.cfg-panel__type` | slate-400, Inter, 400, 13px | family and weight; colour and size unchanged |
| control (`input`, `select`) | slate-900, Inter, 400, 13px, white | **unchanged** |

C2, the components' cards and separators (computed): goal card `1px solid rgb(226,232,240)`, white; learners list the same; each learners row `border-bottom: 1px solid rgb(226,232,240)`; PhA card (expanded) `1px solid rgb(203,213,225)`, its body `border-top: 1px solid rgb(226,232,240)`. Read at `configuratorPanel.scss:265` (row) and `:342` (child body). An inline `border-bottom-color` on a row recolours its line, and an inline `color` recolours its name (C2.rowInline).

### 4.4 Widgets and writes (N, read)

- N1: `formWrite.setValue(Scenario_A, 'duration', 0, "45", false)` → `{ok: true, changed: true}`, slot `["string:45"]`. Then `setValue(…, 46, false)` → `["number:46"]`. **A typed number through `TextWidget` lands as a string.** `overrideIsCompatible` allows that override, `useFormWidgets.ts:177` `case 'number': return override === 'text';`, so a view author who uses it gets the same.
- `IRFormField.tsx:416` `} else if (editable && field.widget === 'number') {` renders `NumberWidget`, whose two buttons are `className="ir-field__stepper-btn"` (`NumberWidget.tsx:111`, `:121`), `tabIndex={-1}`. Hiding them leaves its numeric parse (`Number`, NaN refused) and its commit intact.
- `IRFormField.tsx:445` `multiline={field.widget === 'textarea'}` is the JjEL box: mono, fixed 44-56px, the «JjEL» hint (`widgets/index.ts` header: «`WidgetKind`'s `textarea`, which is the fixed 44–56px JjEL expression editor»). The growing prose box is the registry's `textarea` (`GrowTextWidget`). It is reached when the layout says `textarea` and the descriptor is not overridden (`formAutoLayout.ts:400` `if (descriptor.widget !== descriptor.derivedWidget) return null;`). The layout says so for a string with the annotation `multiline` (`jjform/layout.ts:360` `if (annotations?.[feature.key]?.multiline === true`), at span 12 (`:173` `text: { span: 12, widget: 'textarea' },`). The panel already passes these annotations (`PanelFields.tsx:237-242`).
- The width map can hand a string field an extended widget (email, url, colour, date, textarea) when the descriptor equals its derived widget. A role's explicit «input» must therefore also set the cell's widget name to `text`, which the registry does not cover.

### 4.5 The Endpoints window and an overlay above it (E)

- E1: role Edu, one group «MM186C», three rows; each `div.envgen-perm-row` = `span.envgen-perm-row__name` + the segmented control, `display: flex; justify-content: space-between; gap: 8px`, 700px wide, segment 225px. E2: no «Customize» button anywhere today.
- Backdrop `position: fixed; z-index: 9999` on `<body>`; the modal `static` inside it (E1). E3: an overlay appended to `<body>` at `z-index: var(--z-alert)` (computed 10000) is first in `elementsFromPoint` at its centre.
- E4: Escape pressed in an input of that overlay, with `stopPropagation` on the overlay root, leaves the window open. Per contrasto, the same key without it closes the window. The window listens on `window`: `EndpointsWindow.tsx:67` `const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };`.

### 4.6 `inert` (I)

- I1: a native `div[inert]` with an input and a button: `focus()` does not take, a mouse click at the button's centre fires nothing. Per contrasto, without the attribute the click lands (0 → 1). `'inert' in HTMLElement.prototype` is true (Chromium of the probe).
- I2: **not measured**. The probe looked for the app's React among the page's resources and found no `.vite/deps` entry, so it could not render through it. Read only: React 18.3.1 does not know `inert`, and passes an unknown attribute with a string value. Phase 2 measures `hasAttribute('inert')` and focus on the real popup.

## 5. The data (R-CFG-3) and the pure helpers

`joiner/environmentConfig.ts`, still with zero imports:

```ts
export type RoleWidget = 'input' | 'textarea' | 'dropdown' | 'stepper' | 'number-input' | 'number-dropdown';
export interface FieldPresentation {
    widget?: RoleWidget;        // absent: what the panel renders today («Default»)
    options?: string[];         // the two dropdowns
    allowOther?: boolean;       // the string dropdown's «Other:» free entry
    label?: string;
    showType?: boolean;         // «isTypeShown»; absent = true
    style?: string;             // CSS declarations, kept ones only (§6)
    cardStyle?: string;         // components only
    lineStyle?: string;         // components only
}
export interface TypePresentation { fields?: Record<string, FieldPresentation> }
```

- `typePresentationOf(profile, classId): TypePresentation | null`. The prompt's `presentationOf` is taken: `command grep -rn presentationOf src` exit 0, `model/simulation/netStep.ts` exports it, imported at `editor-v2/sim/simCanvasState.ts:27`. The name `typePresentationOf` is free (exit 1).
- `widgetChoicesFor({ typeName, isEnum, isMultivalued, isReadOnly? })`. The optional `isReadOnly` is added. Strings (`EString`) → `['input', 'textarea', 'dropdown']`. Numbers (`EInt`, `ELong`, `EShort`, `EByte`, `EFloat`, `EDouble`) → `['stepper', 'number-input', 'number-dropdown']`. Empty for an enum (its select, from the metamodel), a boolean, a multi-valued attribute, a read-only field, and any other datatype (EChar, EDate, custom). An empty list means no widget choice, and the popup prints the fixed widget.
- `sanitizeDeclarations(text) → { style: Record<string, string>; text: string; dropped: Array<{ declaration; reason }> }`, rules in §6.
- `textPropsOf(style)`: the text properties declared, for the bridge of question 1.
- `parseOptionList(text, numeric)`: one option per line, trimmed; empty lines and duplicates dropped; with `numeric`, lines that are not finite numbers dropped and reported.
- `cleanTypePresentation(p)`: drops empty strings, `showType: true`, empty entries and an empty `fields`. A popup closed without a change therefore writes nothing.

Write: «Done» writes **one** `SetFieldAction.new(profile.id, 'typePresentation', next, '', false)`, with the whole dictionary (P5: replace). The edited type's entry is cleaned, and the key is removed when the entry is empty. Then `U.isProjectModified = true`, as `ProfilesStep.tsx:102-108` writes `typePermissions`. No write when the cleaned entry equals the stored one. One undo entry (P2).

`classes.ts`: `typePresentation?: Dictionary<Pointer<DClass>, TypePresentation>;` on `DProfile` and the same type on `LProfile`, a type-only import from `./environmentConfig`. No initialiser, no constructor line, no migration. The `joiner` barrel (`joiner/index.ts:88-92`, explicit names) is not touched: consumers import from `joiner/environmentConfig` directly, as `ConfiguratorTab.tsx:32` does.

### 5.1 Layer Impact Report, draft (on file before the diff of `classes.ts`, `docs/lir/lir_2026-10-17_186_type_presentation.md`)

- **D-layer**: one optional field on `DProfile`. What changes: a key that exists after the first «Done» of the popup. What does not: the constructor, `typePermissions`, `DEnvironmentConfig`, every model element. Cross-layer: the reducer adds `pointedBy` entries on the classes named as keys and removes them on a replace (P4, `reducer.ts:399-410`), as for `typePermissions`. Safety: not a creator, no TRANSACTION, no sync path.
- **L-layer**: `LProfile.typePresentation` typed. The proxy already returns the plain object (P3).
- **JjOM, canvas, sync**: untouched; the profile is outside the model graph.
- **Persistence**: saved and reloaded as is (P7, P8); absent reads as empty, so no VersionFixer.
- **Smoke scenarios**: a project saved before this lane opens with no field and renders as today. After «Done», save and reload, the field is equal. Another role is unaffected.

## 6. The CSS

- **Editor (question 3).** A textarea of CSS declarations, `prop: value;` one per line, with a placeholder from the mockup's own values (`font-weight: 600;` / `color: #0f172a;`). Property names are accepted in kebab-case and camelCase. The mockup's object notation (`{ fontWeight: "bold" }`) is not CSS, and quoted keywords would not parse as CSS values. Under each editor: the declarations dropped, with their reason, live.
- **Stored:** the kept declarations as text (`cleanTypePresentation`). **Rendered:** `sanitizeDeclarations(text).style`, so a hand-edited or imported value is filtered again.
- **Sanitiser rules:**
  - comments stripped; split on `;` outside quotes and parentheses;
  - a property must match `-?[a-zA-Z][a-zA-Z0-9-]*` (camelCase converted to kebab);
  - dropped: custom properties `--*` (they would override the design tokens in the subtree, the spirit of rule 28); `behavior`, `-moz-binding`; any value containing `url(`, `expression(`, `javascript:`, `@`, `\`, `{`, `}`, `<`; `position` other than `static`/`relative` (`fixed` per the prompt, and `absolute` and `sticky` because they too lift a field out of its box);
  - a `!important` suffix is stripped and the declaration kept (an inline style object cannot carry it);
  - caps: 40 declarations and 2000 characters per entry, the rest dropped and reported;
  - output keys in React's camelCase (`-webkit-x` → `WebkitX`, `-ms-x` → `msX`).
- **Tests** (before code), each with the mutation that kills it: kept declaration and camelCase key (M: drop the conversion); `url(` dropped in any case and inside a function (M: case-sensitive test); `expression(`, `javascript:`, `@import`, backslash, braces (M: remove one guard each); `position: fixed`/`absolute` dropped, `relative` kept (M: allow-list inverted); `--x` dropped (M: allow `--`); `;` inside quotes not split (M: naive split); `!important` stripped (M: keep it); the caps (M: off by one); `dropped` reasons (M: empty list); `widgetChoicesFor` per family and the empty cases (M: drop the read-only guard; the enum offering `dropdown`); `parseOptionList` numeric (M: keep NaN); `cleanTypePresentation` (M: keep `showType: true`; keep the empty entry); `typePresentationOf` total on null and malformed input (M: no guard).
- **Where each style lands** (questions 1 and 2, measured C1, C2):
  - field `style`: inline on `.cfg-panel__field`. Recommended: plus a scoped bridge. The panel sets `data-cfg-text="color font-weight …"` from `textPropsOf`, and one rule per text property makes `.cfg-panel__label`, `.cfg-panel__type`, `.cfg-panel__cardinality` and the control (`input`, `select`, `textarea`) `inherit` that property only. Properties: color, font-family, font-size, font-weight, font-style, letter-spacing, text-transform, text-decoration. A field without a style is unchanged, which the regression run of `_tmp_187_probe.ts` measures.
  - component `cardStyle`: inline on the component's card elements, today `.cfg-panel__ref-card`, `.cfg-panel__ref-list` and `.cfg-panel__child`. R-CFG-6 changes this set (§8).
  - component `lineStyle`: inline on the elements that draw the separators, today `.cfg-panel__ref-row` (`border-bottom`) and `.cfg-panel__child-body` (`border-top`). R-CFG-6 changes this set too (§8).

## 7. The panel, the button, the popup

**Widget mapping** (the panel builds a descriptor copy, as it already does for read-only at `PanelFields.tsx:248` `const shown = readOnly ? { ...f, isReadOnly: true } : f;`):

| role widget | renders through | how |
|---|---|---|
| input | `TextWidget` | `widget: 'text'`, and the cell's widget name set to `text` (§4.4) |
| textarea | `GrowTextWidget` (registry `textarea`, span 12) | `multiline: true` in the layout annotations; no «JjEL» hint in the title (`PanelFields.tsx:215-216` reads `widget === 'textarea'`, which stays `text`) |
| dropdown | `PanelDropdown` (new) | `ui/Select` of the options. «(none)» first when the lower bound is 0 (`clearValue`). With `allowOther`, «Other…» shows a `TextWidget` beside it. A stored value not in the list shows as «Other: v» with `allowOther`, else as an extra option «v (not in the list)», so nothing is overwritten. Writes `setValue(…, string, false)` |
| stepper | `NumberWidget` | as today |
| number-input | `NumberWidget` | `cfg-panel__field--number-input` hides `.ir-field__stepper-btn` (N1) |
| number-dropdown | `PanelDropdown`, numeric | options from `parseOptionList(…, true)`; writes a number |

A role widget whose family does not match the descriptor's derived widget renders today's widget instead: `text` for the string ones, `number` for the numeric ones. That covers a feature retyped after the presentation was written, and keeps the render permissive (R-B9-bis's criterion). The order of the cascade for label and widget is role, then the Data Manager view, then the type. `showType: false` drops `[Type]` from `FieldTitle` through a new optional prop. `PanelDropdown` draws the field's own frame and fixed message slot, as the Identity name does (`PanelFields.tsx:291-315`).

**The panel's inputs.** `ConfiguratorPanel` gets two optional props: `presentationOf?: (classId) => TypePresentation | null` and `preview?: boolean`. Both reach `PanelEnv` as optional entries. `ObjectView` reads the presentation of its object's exact class (question 4). `ConfiguratorTab` passes `presentationOf` only with a role (`profile`), so the developer overlay reads none, as it already passes `permissionOf` only then (`ConfiguratorTab.tsx:550`).

**The RENDER.**
- The popup mounts `ConfiguratorPanel` with `preview`: no Save and no Delete, folds ignored.
- It mounts it on the first instance of the type, in the order the Configurator lists them (`modelsForType` + `instancesOfClass`; creation order measured, W0.list). With no instance, it shows «This project has no <Type> yet: create one to preview it.»
- The panel gets the customized role's `permissionOf` and the draft as `presentationOf`.
- The host handlers are no-ops (so «+ Add» and «+ New» show as the role would see them), inside an `inert` wrapper.
- The panel sits in the same palette wrapper as in `ConfiguratorTab.tsx:536-537`.
- Cost: one more panel mount. Each object on screen subscribes through `useIRFormView`, and the panel re-renders on each draft change. The sanitiser is linear in the text.
- Risk: `useIRFormView` clears its cross-deps key `form:<objectId>` on unmount (`useIRFormView.ts:108`). If the Data Manager underneath shows the same instance with an authored view that has cross paths, closing the popup clears that entry until its next signature change. The same holds today between the developer overlay and the Data Manager. Low.

**The button** (task 2, mockup `186_2`). On every `div.envgen-perm-row` of `ProfilesStep.tsx:192-200`, between the name and the segmented control, a «Customize element» button: `envgen-btn envgen-btn--secondary cfg-custom__open` (new prefix `cfg-custom`, `command grep -rn cfg-custom src` exit 1; control `cfg-panel__save` exit 0). `margin-left: auto` puts it beside the segment, since the row is `space-between` (E1). On Hidden it is `disabled`, and a wrapping `span` carries the title «Hidden for this role: nothing to customize». A disabled button gets no pointer events, so the title goes on the wrapper; Phase 2 measures the title under the pointer. The mockup's last row (GeneratedOER, Read only) has no button. The issue's text («for each element») is followed.

**The popup** (task 4, mockup `186_4`). `configurator/CustomizeElementModal.tsx` and `customizeElement.scss`.
- A portal on `<body>` at `z-index: var(--z-alert)` (E3), a scrim, `role="dialog"`, `aria-modal`, `aria-labelledby`.
- Focus: on the first control at open, trapped (Tab and Shift+Tab cycle), given back to the opener at close. Escape is stopped at the root (E4) and acts as Cancel.
- Title «Configure customize CSS». Text: «This panel allows developers to customize the CSS for the selected element. CSS styling is allowed only: the element type itself remains unchanged (for example, an input element always remains an input element). Press «Done» to apply the changes to this role.» This changes the mockup in two ways. There is no em dash (house rule). «Done» applies instead of «saves», because the project is saved by the window's «Done» or Ctrl+S, as `ProfilesStep` already says.
- Left column, from the class's own features (`LClass.allAttributes`, `allReferences`, inherited included; `LModelElement.tsx:3156-3163`), so no model is needed to customize:
  - ATTRIBUTES, per attribute: «name: Type», widget (only `widgetChoicesFor`, «Default» first; the fixed widget printed when the list is empty), options and «Other» for a dropdown, «Label», «Show type», the CSS editor;
  - COMPONENTS, per reference or composition: «Label», «Show type», «Card» CSS, «Interline» CSS (offered where the component has separators: multi-valued, or a composition).
- Right column: RENDER.
- Footer: Cancel (drops the draft), Done (writes, §5).

## 8. What R-CFG-6 and R-CFG-7 move under this design (lane P-2026-10-20-1123, merges first)

Read on `2c1e694e4`. Its prompt names these lines too.

| line this design relies on | what the other lane changes | consequence here |
|---|---|---|
| `PanelComponents.tsx:378` `const inline = via === null && rendersInline(depth);` | R-CFG-6: every element of a component on screen is an extended card, at any depth, references included | the card elements of `cardStyle` change: today `.cfg-panel__ref-card` (`:275`, `:280`), `.cfg-panel__ref-list` (`:291`), `.cfg-panel__child` (`:402`) |
| `PanelComponents.tsx:292-312` (rows of a multi-valued reference) and `:422-426` (`.cfg-panel__child-body`) | R-CFG-6: multi-valued components list rows that expand into cards | the separators of `lineStyle` change (`configuratorPanel.scss:265`, `:342`) |
| `PanelComponents.tsx:279-289` (single reference card), `:299` (`row.actions.includes('remove')`) | R-CFG-7: a × on every single reference card | card header markup; `cardStyle` lands on the same card |
| `PanelComponents.tsx:66-136` (`ObjectView`) | rendered also for referenced elements in their cards | the presentation of their class applies there (question 4): no change in the rule, more places |
| `ConfiguratorPanel.tsx:369-374` (Save) | R-CFG-9: Save's colour by state | `preview` hides Save; a conflict only in the hunk |
| `ConfiguratorPanel.tsx:284-304` (`env`) | maybe new entries for the expansion state | both add optional entries |
| `ConfiguratorTab.tsx:142`, `:538-551` | R-CFG-9: the remembered instance | `presentationOf` is passed at `:550`, near their change |
| `panelModel.ts` and its test, `configuratorPanel.scss` | a pure rule for the single remove, Save's colour | additions on both sides |
| `EndpointsWindow.tsx:64-70` (Escape), the footer | R-CFG-8: Cancel and arrows | the popup stops Escape at its own root and edits nothing there |

So steps B and C re-read these lines on the merged trunk. Step A (`environmentConfig.ts`, its test, `classes.ts`) touches none of them.

## 9. Phase 2 plan

Baseline of the gates before the first diff. Then:

**Step A: data and helpers** (3 code files, then 1 docs file before `classes.ts`):
1. `frontend/src/joiner/__tests__/environmentConfig.test.ts`: the tests of §6, first.
2. `frontend/src/joiner/environmentConfig.ts`: the types and the helpers of §5. Commit `feat(#186): typePresentation helpers and CSS sanitiser`, bench in the body.
3. `docs/lir/lir_2026-10-17_186_type_presentation.md` (§5.1), its own docs commit.
4. `frontend/src/joiner/classes.ts`: the optional field on `DProfile` and `LProfile`, a type-only import. Commit `feat(#186): optional typePresentation on DProfile`.

**Step B: the panel reads it** (after taking the trunk, 7 files):
5. `configurator/panelModel.ts` and `__tests__/panelModel.test.ts`: `roleRendering(roleWidget, derivedWidget)` → `{ widget, cellWidget?, multiline?, numberInput?, dropdown? } | null`, tests first. Bench: family mismatch accepted; textarea routed to the JjEL widget; number-input to `text`.
6. `configurator/PanelFields.tsx`: label, show type, widget, style and bridge, the dropdown branch, `FieldTitle` `showType`.
7. `configurator/PanelComponents.tsx`: label, show type, `cardStyle`, `lineStyle`, on the markup of the merged trunk.
8. `configurator/PanelDropdown.tsx` (new).
9. `configurator/ConfiguratorPanel.tsx`: `presentationOf`, `preview`.
10. `configurator/configuratorPanel.scss`: `cfg-panel__field--number-input`, the `data-cfg-text` bridge, `cfg-panel__dropdown`.
11. `components/environment/ConfiguratorTab.tsx`: `presentationOf` from the active role.
Commit `feat(#186): the Configurator panel reads the role's presentation`.

**Step C: the button and the popup** (3 files):
12. `configurator/CustomizeElementModal.tsx` (new), 13. `configurator/customizeElement.scss` (new), 14. `components/envgen/steps/ProfilesStep.tsx` (the button, the popup's mount). Commit `feat(#186): Customize element in Roles, the popup`.

**Probe arms** (`MODE=after`, 3188, against `186c_before.json`):
- button on every row, disabled on Room (Hidden) with its title under the pointer;
- popup on top at the pixel, focus trapped and returned, Escape = Cancel with the window open;
- ATTRIBUTES lists `widgetChoicesFor` only (none for active, level, tags, serial);
- RENDER changes with the draft before «Done» (label, widget, style) and is `inert` (`hasAttribute`, no focus);
- Cancel writes nothing (raw and undo unchanged);
- «Done» writes one entry, then save, reload, stand-alone Edu: label, widget (textarea a growing box, number-input without buttons, dropdowns writing string and number), style on box, title and control; Guest unchanged;
- `url(` dropped in the DOM;
- developer overlay unchanged;
- regression runs: `_tmp_187_probe.ts` (the panel without a presentation), the Endpoints arms of `_tmp_186_probe.ts` (adapted to that lane's merged window), `_tmp_172_smoke.ts`.

**Gates**: typecheck, test, build, check:docs, check:addonly, check:scripts, complete output with exit status.

**Visual checklist for Juri**: a console setup script `_tmp_186c_setup.js`. The items: the button on the rows and on Hidden; the popup's layout against the mockup (perceptual); a widget change per family; a CSS entry visible in RENDER and then on the stand-alone link; Cancel; another role unchanged.

## 10. Questions

1. Field CSS: box only, or box plus the per-property text bridge of §6? Recommended: box plus the bridge.
2. «Interline»: separators as lines (`border-*`), or line spacing (`gap` of the list)? Recommended: separators.
3. Editor notation: CSS declarations or the mockup's object notation? Recommended: CSS declarations, camelCase names accepted.
4. A type's presentation reaches every element of that exact class in the panel, subclasses not included? Recommended: yes.
5. Confirm the 14 code files of §9 (rule 19). Recommended: confirm.
6. Step A before P-2026-10-20-1123 merges, B and C after taking the trunk? Recommended: yes.

## 11. Dependencies and risks

- **P-2026-10-20-1123** changes the panel's components (R-CFG-6, R-CFG-7), Save and the remembered instance (R-CFG-9), and the Endpoints window (R-CFG-8): §8. The merge order is fixed (that lane first).
- **#167**: the issues chip in RENDER counts what the stand-alone page counts, unchanged.
- **The ticket of 2026-10-15** (two `ir-field-<slotId>` ids when two panels show one instance) also applies to RENDER, when a Data Manager underneath shows the first instance.
- **Components do not import under node** (root rules file §5): the panel, the dropdown, the popup and the step have no unit test, the probe is their measure, and the gap goes in the entry.

## Decisions taken (unattended)

1. `typePresentationOf` instead of `presentationOf` (taken by `model/simulation/netStep.ts`).
2. `TypePresentation = { fields?: Record<featureName, FieldPresentation> }` (the plan's §5.2), room for type-level options later.
3. Styles stored as the kept declarations text, sanitised again at render.
4. The sanitiser's rules of §6, including `position` other than static/relative and custom properties dropped.
5. Vocabulary `input | textarea | dropdown | stepper | number-input | number-dropdown`, absent = «Default».
6. The mapping of §7 (number-input through `NumberWidget`, textarea through the growing box), and no choice for enum, boolean, multi-valued, read-only and other datatypes.
7. A role widget whose family does not match renders today's widget.
8. RENDER: live panel, `inert`, no Save and no Delete, folds ignored, no-op host handlers, the role's permissions, first instance in the Configurator's order.
9. Popup at `--z-alert`, Escape stopped at its root and equal to Cancel, focus trapped and returned; texts in English from the mockup, no em dash, «apply» for «save».
10. The button on every row, disabled on Hidden with the reason on a wrapping span.
11. Popup entries from the class (`allAttributes`, `allReferences`), no model needed; RENDER needs an instance.
12. «Done» writes only a changed, cleaned entry; one `SetFieldAction`, `U.isProjectModified = true`.
13. New prefix `cfg-custom`; new names checked absent: `RoleWidget`, `sanitizeDeclarations`, `textPropsOf`, `parseOptionList`, `cleanTypePresentation`, `roleRendering`, `PanelDropdown`, `cfg-panel__dropdown`, `cfg-panel__field--number-input`, `data-cfg-text` (each `command grep -rn` exit 1; control `cfg-panel__save` exit 0).

## Decisions awaiting Juri

None of the RC-26 list. No critical-zone file is edited: `joiner/classes.ts` is the D-layer, and R-CFG-3 already approves its one optional field, with the Layer Impact Report on file before the diff. No exported interface changes except by an optional property, no ratified row is amended, nothing is deleted or migrated, and the push is not this lane's.
