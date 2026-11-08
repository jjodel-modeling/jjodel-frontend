# JjTL: several source models in the run dialog (S4)

Prompt: P-2026-11-08-1026. Decisions: R-JTG-26, R-JTG-27, R-JTG-31. Slice S4 of
`docs/discovery/discovery_2026-11-08_jjtl_kernel_gaps.md` (§4.4 is its Layer Impact Report).

## 0. Answer in brief

The run dialog now takes one primary model plus an «Also include» list of the other models of the same metamodel, and
nothing changes when none is checked (measured, §2). The app has no re-run, so reopening the dialog for the same
transformation reads the record back (read, §0.3; decision D1). Two defects found on the first screenshots are fixed:
the rows now hold a real 20px checkbox, and the open list no longer covers a label (measured, §2). Finished by
P-2026-11-08-1120 after the context ceiling of P-2026-11-08-1026.

§0.1 to §0.3 were written before any code and describe the dialog as it was.

### 0.1 Where the dialog picks the source model today (read)

- `frontend/src/jjtl/components/ExecuteTransformationDialog.tsx:58-88`: `compatibleModels` filters `availableModels` with
  `isModelCompatibleWithSource` (identity first, name as fallback). `:106` the first compatible model is preselected,
  whatever the previous run was. `:250-266` one `<select>`, `:161` "await onExecute(sourceModelId, outputModelName.trim());".
- The callback carries one id through three signatures: `JjtlDevelopmentEnv.tsx:298` and `:346`, its prop at `:51-55`,
  `frontend/src/components/abstract/DockManager.tsx:442`.
- `availableModels` is a snapshot taken when the tab is opened (`ProjectEditor.tsx:1315`, `:2453`). Getters exist for
  the metamodels (`getSourceMetamodel`), none for the models or the runs.

### 0.2 How the source is serialized (read)

`frontend/src/components/project/ProjectEditor.tsx`:

- `:1450` "const sourceModel = models.find(m => m.id === sourceModelId);"
- `:1476-1477` `allSubObjects` read once, `:1481` null entries dropped.
- `:1491` one object becomes `{ id, name, className, __type, ...features, _containerId? }`.
- `:1603` "await executeTransformation(ast, sourceModelDataCopy, targetMetamodel);", a flat array.
- `:1606-1609` a failed run: `U.alert('e', 'Transformation Failed', result.errors.join('\n'))`, and the result goes back
  to `JjtlDevelopmentEnv`, which writes `Transformation failed: ...` in the Output tab (`:363`). The S3 error
  (`executor.ts:739-741`, `sharedSourceIdsError`) is in `result.errors`, so it takes this path with no new code.

The executor takes the list as an array of arrays (`executor.ts:259-261`, R-JTG-31). A flat array is a single model.

### 0.3 Where a run is recorded (read)

`ProjectEditor.tsx:1780-1786`: `_state.generatedBy = { transformationId, sourceModelId, timestamp }` on the output
`DModel`. It has two readers, both for the megamodel: `ProjectEditor.tsx:135` and `model/megamodelInference.ts:166-211`
(the edges `generatedBy`, `sourceOf`, `instanceInputOf`).

**There is no re-run in the app.** Searched `re-?run|runAgain|lastRun|retransform|regenerat` over `jjtl`,
`components/project`, `components/abstract` and `model` (exit 0, hits only on unrelated code: React effects, the
documentation tab). Positive control on the same command: `DocumentationTab.tsx` hits for `regenerat`. The only
importers of the executor are `ProjectEditor.tsx` and `jjtl/hooks/useJjtlExecutor.ts`; `TriggerConfig`
(`model/megamodel.ts:53`) is a type with no executor behind it. So the record has nothing to be read back by.

The closest thing to a re-run is opening the dialog again for the same transformation, and that is what this lane
makes read the record (§1, decision D1).

## 1. Decisions

- **D1. Reopening the dialog is the re-run.** `getLastRun` reads the store fresh, because `availableModels` is a snapshot
  from when the tab opened. It restores the primary and the included models only if the latest record has included
  models still compatible, and its primary is too. Otherwise the dialog starts as before. So «unchecked by default»
  holds except right after a run that included models. Awaits Alfonso, with the question of a real re-run.
- **D2. The list floats, closed at every opening, so opening it moves nothing.** When present, the row makes the dialog
  31px taller from the moment it opens, 647 to 678 (measured). With one compatible model there is no row.
- **D3. The row depends on `compatibleModels.length > 1`,** not on the number of others, so emptying the primary cannot
  make it appear.
- **D4. Included ids go in list order,** whatever the order of the clicks. A primary changed to a checked model unchecks it.
- **D5. In `ProjectEditor` the two blocks became local functions in place** (`readSourceObjects`, `serializeSourceObject`);
  the serialization body is unchanged. A stale commented-out `console.log` naming `sourceObjects` stays (Rule 8).
- **D6. The preview shows `+N` after the primary's name.** Not measured with a name long enough to wrap.
- **D7 (P-2026-11-08-1120). The list opens upward, capped at 72px.** Of the three ways the prompt allowed, reserving
  height inside the row leaves up to 72px blank in every closed dialog, and a popover elsewhere still lands on some
  other field. Upward, the list lies over the primary select and its count, which hold no label, and an outside click
  closes it. The cost: the primary select is hidden while the list is open. Whether that reads well is a perceptual
  judgement, left to Alfonso.

Files beyond those the prompt named: `components/sourceSelection.ts` and its test (the pure logic, because `ProjectEditor`
does not import in vitest), `execute-transformation-dialog.scss` (new classes only, none renamed), and
`components/abstract/DockManager.tsx` (a fourth optional callback parameter, `getLastRun`, named in S4 of the kernel-gaps
report).

## 2. Evidence

Gates at the tip of the code, P-2026-11-08-1120 (measured):

| Gate | Result |
|------|--------|
| Typecheck | exit 0 |
| Full vitest | 15328 passed, 3 skipped; 3 files fail at import, the three known ones of `CLAUDE.md` §17 |
| Build | exit 0 |
| `sourceSelection.test.ts` | 20 passed, three of them on the real executor |
| Playwright probe (gitignored, port 3127) | 33 PASS, 0 FAIL, no page error |

The probe, measured on the DOM:

- One compatible model: no row. Two: row closed, `0 of 1 selected`.
- Opening the list leaves the rectangles of output, preview, footer and dialog, and the scroll height (462), unchanged.
- Rows: checkbox 20x20, name beside it, row height 28, one row per model, with one and with four includable models.
- No `label` or `.form-hint` outside the list is touched by it. With four models the list is 72px high and scrolls; its top
  is 394.5, equal to the bottom of the hint's box (the hint's text ends at 382.5).
- None checked: the record has the three keys of before, output `a1`. One included: `includedModelIds` kept, output
  `a1,b1,b2`, output name the dialog's. Reopening reads back `1 of 1`; an older record restores nothing.
- A run error appears as toast and Output line and records nothing.

Cause of the first defect (measured, from `document.styleSheets` on the running dialog): the app-wide `.form-group input`
sets `width: 100%`, computed 414px, and `.form-group label` sets `display: block`, which outranks the single class of the
row. The stylesheet holding that rule was not located.

The UI's run error is `envValue` on an unbound name, not the shared-id error of S3 (read and measured): Jjodel ids are
global and a model cannot be chosen twice, so the app does not produce a shared id. The unit test covers that error on
the real executor; it travels the same `result.errors` path (§0.2).

Bench on `sourceSelection.ts`, run by P-2026-11-08-1026: 10 mutations, 9 killed. The survivor, «older record restored», is
equivalent by reading: an absent list defaulted to `[]` is caught by the later `includedIds.length === 0` guard.

Ticket filed, not fixed: `name := envLookup("x") + "_w"` with `x` unbound ends with `success: true`, no error and no
warning, and three objects named `_w` (measured on the real executor), while `SPEC.md` §10 lists that expression as an
error. `executor.ts:3362` returns `null` rather than a demand for an unbound name (read), so the operator sees no demand.

## 3. Layer impact

No critical-zone file touched. The persisted format gains one optional field, `includedModelIds`, in
`_state.generatedBy`. `model/megamodelInference.ts` is untouched and reads `sourceModelId` only, so included models draw no
`sourceOf` or `instanceInputOf` edge. `ModelArtifact.generatedBy` does not declare the new field; it compiles because the raw
state is `any`. Left alone under Rule 20.
