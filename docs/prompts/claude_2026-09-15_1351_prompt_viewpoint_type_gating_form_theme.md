# Viewpoint properties: gate the Type options, drop the Form theme field

Date: 2026-09-15 13:51
Type: feat (UI gating) + chore (dead control removal)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel` (the tree the line numbers below were measured in)
Effort: high

## COSA

Two changes to the viewpoint properties panel of the rail, decided by Alfonso on 2026-09-15.

1. **Only `syntax` and `decoration` remain selectable as viewpoint types.** `validation`,
   `semantics` and `editor_behavior` stay VISIBLE and become DISABLED, in the rail segmented control
   and in the New Viewpoint dialog. They are not removed from the list and not removed from the
   `ViewpointType` union.

   Why disabled and not removed: projects already hold viewpoints typed `validation` or `semantics`,
   and the segmented control renders the current type by matching it against the options. Drop the
   option and such a viewpoint shows a control with nothing selected, so its type becomes
   unreadable on screen. Disabled keeps the legacy value legible and documents the design space.

   Why these three: `validation` viewpoints are a different species today (`DValidationViewpoint`,
   which carries the rules and is authored in its own environment, R-VAL); a `DViewPoint` with
   `isValidation` set from this control is the second, competing species of the same concern, which
   is a known defect. `semantics` and `editor_behavior` have no consumer: every read of the type
   downstream tests `vpType === 'syntax'` and nothing else (`TreeViewContent.tsx:3090-3091`,
   `ProjectEditor.tsx:2894-2895`), and `handleCreateViewpoint` collapses decoration, semantics and
   editor_behavior into one branch (`ProjectEditor.tsx:1216-1219`). They are labels without a
   mechanism, so they must not look choosable.

2. **The Form theme field leaves `ViewpointProperties`.** The theme belongs to the Data Manager
   viewpoint, whose own panel already carries it.

   Why it is safe: the select writes `formTheme` on the selected viewpoint, and the only reader is
   rung 0 of the theme cascade in `IRForm.tsx:232-237`, which resolves the viewpoint through
   `viewpointOfHost(host)` (`IRForm.tsx:190-192`). That function returns the Data Manager singleton
   for `host === 'manager'` and `undefined` (meaning the active viewpoint) for the other two hosts.
   Today `IRForm` is mounted only with `host="manager"`, at `InstanceManagerTab.tsx:3036` and
   `:3070`, the rail Form tab having been removed by R-VP-14. The control is therefore dead UI: it
   writes a field nothing on screen reads.

## DOVE

In scope, and nothing else:

- `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`
- `frontend/src/components/editors/viewpoint/properties/properties.scss`
- `frontend/src/components/project/NewViewpointDialog.tsx`
- `frontend/src/components/editors/viewpoint/properties/__tests__/viewpointThemeHint.test.ts`
- `docs/claude-code-log.md` (separate commit, at the end)

Explicitly OUT of scope, do not touch:

- the `ViewpointType` union and `getViewpointType` in `frontend/src/view/viewPoint/viewpoint.ts`:
  all six values stay, including `dataManager`;
- `handleCreateViewpoint` in `ProjectEditor.tsx` and its switch: types that can no longer be chosen
  can still arrive from saved projects, and the switch stays the one writer of the legacy booleans;
- `DataManagerViewpointPanel.tsx`: its Form theme and palette selects stay exactly as they are;
- the `formTheme` field on `DViewElement` (`view/viewElement/view.tsx:249`), rung 0 of the cascade
  in `formAutoLayout.ts`, `IRForm.tsx`, and the `VersionFixer`. No migration, no version bump.

## COME

Read each file in full before editing.

### ViewpointProperties.tsx

- Extend `typeOptions` (`:24-30`) with two fields, keeping the `ViewpointType` typing of `value`:
  `enabled: boolean` and, for the disabled ones, `reason: string`. Reasons, verbatim:
  - validation: `Validation viewpoints are created in the validation authoring environment.`
  - semantics: `Not available yet.`
  - editor_behavior: `Not available yet.`
- Each option button gets `disabled={readOnly || !opt.enabled}` and `title={opt.reason}` when it has
  one. `handleTypeChange` is unchanged: a disabled button cannot reach it.
- Add ONE hint line under the segmented control, as a `<p className="wp-field__hint">` inside the
  same `wp-field`, text verbatim: `Validation, Semantics and Editor are not selectable yet.` The
  hint exists because a `title` on a disabled button does not open in every browser, so the reason
  has to be readable without hovering.
- Remove the whole Form theme `wp-field` block (`:125-140`) and everything that existed only for it:
  the `FORM_THEME_INHERIT` constant, `currentFormTheme`, `handleFormThemeChange`, the
  `activeViewpointId` / `isActiveViewpoint` selector and its hint, the `jjform` import of
  `FORM_THEME_DEFAULT_NAME` / `FORM_THEME_NAMES` / `FormThemeName`, and the `useSelector` import if
  it has no other use in the file. The long comments that document those slices (STYLE2, UX1) go
  with the code they document; do not leave them orphaned.
- Keep the component's remaining structure, class names and props untouched.

### properties.scss

One line, in `.wp-type-segmented__option` (`:280`): the hover rule must not fire on a disabled
option. `&:hover:not(&--selected)` becomes `&:hover:not(&--selected):not(:disabled)`. The existing
`&:disabled { opacity: 0.5; cursor: not-allowed; }` already gives the disabled look and stays as is.

### NewViewpointDialog.tsx

- Add `enabled: boolean` to `VIEWPOINT_TYPES` (`:6-12`) with the same three disabled entries, and
  render `<option ... disabled={!t.enabled}>` in the select.
- Append the reason to the description of each disabled entry, so the hint under the select says why
  when somebody lands on it with the keyboard.
- The default `vpType` stays `'syntax'`, and `handleSubmit` is unchanged.

### The test

`__tests__/viewpointThemeHint.test.ts` exists to pin the UX1 hint under a field that is being
removed, so its subject is gone. Keep the file and the filename, rewrite its assertions to the
statement that now holds:

- `ViewpointProperties.tsx` contains neither `>Form theme<` nor `(viewpoint as any).formTheme =`;
- `DataManagerViewpointPanel.tsx` still contains its own `>Form theme<` and its palette select.

These are source-text assertions, which CLAUDE.md admits only with a mutation bench behind them. No
bench here: the subject is the presence of a control in a file, not a behavior. Say exactly that in
the log entry rather than dressing the test up as behavioral.

## Criteri di accettazione (verificabili a schermo)

1. A viewpoint of type `syntax` selected in the tree: five options visible, `Syntax` selected and
   dark, `Decoration` clickable, the other three greyed and not clickable, one hint line below.
2. A viewpoint saved with type `validation`: the `Validation` option renders selected (dark, at the
   disabled opacity) and no other option appears selected. Its type is still readable.
3. The `Form theme` select is gone from the viewpoint panel, and still present and working in the
   Data Manager panel: changing it there still restyles the manager form.
4. `npm run typecheck` clean, the vitest suite green, `npm run build` clean (from `frontend/`).

## Disciplina di corsia

Other Claude Code sessions may be working in this tree; their dirty files are expected and must not
be touched. Assert `git rev-parse --abbrev-ref HEAD` before writing. Stage only the files listed in
DOVE, one by one, never `git add .`. Two commits:

1. `feat: gate viewpoint types and drop the viewpoint form theme select` (the three source files plus
   the test)
2. `docs: log entry for the viewpoint type gating`

Report in chat: the four acceptance criteria, and anything found in the files that contradicts the
measurements above (in that case, stop and say so instead of adapting the change).
