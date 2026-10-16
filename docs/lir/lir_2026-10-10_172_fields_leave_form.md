# Layer Impact Report: the reference fields leave the form of the instance detail (#172)

- Prompt-ID: `P-2026-10-10-1545` (chat `C-2026-10-10-1540`), decisions R-REF-1 and R-REF-2
- Tree: `/Users/juridirocco/development/jjodel-172`, branch `feat/172-references-once`, HEAD `7fb4c2fb5` at the start of
  this step (step 2 of the lane: the reference section already links, changes and removes)
- Go-ahead: Juri, 2026-10-12, in chat. Asked «Dai il via libera alla modifica di IRForm.tsx (critical zone) per
  togliere i campi REFERENCES dalla form?», he answered «Sì, come proposto»: the diff of the report's §11.3 as
  written, `focusFirst` included, and nothing more of that file. The file sits under `viewpoint/ir/`, a row of the
  CLAUDE.md §3.1 table and none of the six files of §3.2: no hook go-ahead (RC-30) is needed and none is passed; the
  report is owed on file before the diff, and this is it.
- Evidence: `docs/discovery/discovery_2026-10-10_172_references_once.md` (§3 the BEFORE measures, §5 the options,
  §11.3 the diff, addendum A); the AFTER probe of step 2 (commit `7fb4c2fb5`)

Committed before the first edit of `IRForm.tsx`.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` | the optional prop `hostReferences`; with it, no field for a plain reference or an aggregation; the summary chip asks the host when no field of the form carries its severity; the «No fields to show» placeholder is not printed when references were handed to the host |
| `frontend/src/components/abstract/tabs/InstanceDetail.tsx` | the prop on its two `<IRForm>` mounts, one object per mount, with the `focusFirst` of that mount's reference section |
| `frontend/src/components/abstract/tabs/__tests__/instanceManager10c.test.ts`, `instanceManagerOutline.test.ts` | the literal of the subject's mount, which each of them pins |

No other file under `viewpoint/ir/`: not `IRFormField.tsx`, not a widget, not `formWrite.ts`, `formPermissions.ts`,
`formHosts.ts`, `formSections.ts`, `formDiagnostics.ts`, `useFormWidgets.ts`. No host file, no core file, no migration.

## 2. The rule

`IRFormProps.hostReferences?: { focusFirst: (severity: 'error' | 'warning') => void }`. Absent: every line of the
form renders as today.

With it:

- after the `fields` memo (left untouched, with its dependency array), `listed` is `fields` without the descriptors
  whose `isReference` is true: a `DReference` that is not a composition, so plain references and aggregations, the
  partition of the form's own References group and of `shape.refs`. `visible` is built from `listed`;
- `hasNameSlot` keeps reading `fields`;
- `focusFirstOf(severity)` runs its loop over the form's fields as before and, when no field carries that severity,
  calls `hostReferences.focusFirst(severity)`;
- the placeholder «No fields to show» of the branch without a `name` slot is printed only when no reference was
  handed to the host (`listed.length === fields.length`).

## 3. Report

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
  [x] View: the form rendering of an M1 object (IRForm), in its two `manager` mounts only

View (the IR form)
  - What changes: with `hostReferences` passed, `IRForm` builds no field for a plain reference or an
    aggregation; the summary chip, finding no field of its severity, calls the host; the «No fields to
    show» placeholder is not printed when references were handed to the host.
  - What does NOT change: with the prop absent, every line renders as today. `describeSlots`, the
    `fields` memo and its dependency array, `resolveFormSpec`, `buildFormSections`,
    `collectFormDiagnostics`, `IRFormField`, every widget and `formWrite` are not edited. The counts of
    the summary are the same: a diagnostic with no field is the residue, which is counted. Attributes,
    the identity field and the CHILDREN fields render as today. The second placeholder («No fields in
    Basic. Switch to Advanced.») is not edited.
  - Cross-layer interaction: none new. The form writes nothing more. The writes on references were
    moved to `InstanceDetail` in step 2, through the same `formWrite.setValue / clearValue /
    appendValue` the field called (D-layer writes by `LValue.setValueAtPosition` and `SetFieldAction`,
    in a TRANSACTION with no creator: rule 12 does not apply). A changed M1 reference value reaches the
    canvas through `useM1ReferenceEdges` when the model's canvas is mounted, as it did from the field.
  - Side-effect safety vs other layers: `IRForm` has two mounts, both in `InstanceDetail.tsx`
    (`command grep -rn '<IRForm' frontend/src`, control `<RefSlotsSection`); the canvas and the rail
    mount none. `localStorage` `jjodel.formPrefs.<viewId>.collapsed` may hold `references`: with no
    such section it is inert, and it is not project persistence (R-REF-5).

Smoke-test scenarios potentially affected:
  - Data Manager, an instance with a 1..1, a 0..1 and a 1..* reference: no REFERENCES group in the
    form, one section per reference, the gestures of the acceptance criterion from the section.
  - Configurator, the same instance; then the stand-alone page with a profile (a `read` type, a
    `hidden` type).
  - An instance of a class with attributes only: the form is today's.
  - An instance with a contained child shown inline: the child's form loses its reference fields and
    keeps its attributes; the CHILDREN field of the parent stays.
  - A class whose features are a `name` attribute and references only, in Basic and in Advanced: what
    the form prints once its references are gone (the second placeholder has no line in the diff; a
    text that becomes false is a question to the chat, not an edit).
  - An instance with a diagnostic on a reference: the summary still counts it; a click on the chip
    lands on the section.
  - Open the same model on the canvas: nothing of the form is mounted there; unchanged.

Uncertain about propagation? → No. Two points are measured by the probe of this step and declared
either way: what the form prints for a class with a `name` and references only, and where the focus
lands after the summary chip. The form without its REFERENCES group is a perceptual item of Juri's
visual checklist.
```
