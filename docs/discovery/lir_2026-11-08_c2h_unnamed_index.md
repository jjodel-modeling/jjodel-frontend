# Layer Impact Report: an index on unnamed homonym labels (C2h)

Prompt: P-2026-11-08-1626. Written before any code (CLAUDE.md §3.2). Decision: R-TXT-59. Follows
`lir_2026-11-08_c2g_unnamed_label_align.md` (C2g), whose risk 1 this lane closes.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)        read only: id, name, instanceof.name, as today
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   display string of a reference pill only
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Not in the template: the IR form (chips only), display only
```

## What one list means at each site

| Site | One list is | Why |
|------|-------------|-----|
| Default view, `jjomTransformers.ts:366-411` | the values of ONE reference slot of ONE object (`fv`) | `refTargets`, `values` and `value` are built per slot, and `RowValue.tsx:324-337` paints them side by side in one row. |
| IR chips, `IRFormField.tsx:277-298` | the values of ONE multi-valued reference field (`field.values`) | `chips` is built per field and handed to one chip input. |

Decided for the default view: **neither the node nor the edge set**. Two reference rows of one node
are two lists and number independently, as the C2f `ListWidget` does per field. Edges carry no such
label: `namelessTargetLabel` and `unnamedTargetLabels` are not called from `jjomEdgeToRFEdge` or any
edge code (their importers are `jjomTransformers.ts`, `IRFormField.tsx`, `ReferenceWidget.tsx`).

## What changes

`jjomTransformers.ts`, the reference branch: the resolving targets of the slot are collected, then
labelled once by `unnamedTargetLabels`, instead of one `namelessTargetLabel` per target. The output
shape is the same: `labels` maps id to label, and `:385-407` reads it unchanged.

| Row of one slot | Today | After |
|-----------------|-------|-------|
| two different unnamed Ports | `Port (unnamed)`, `Port (unnamed)` | `Port (unnamed)`, `Port (unnamed) 2` |
| one unnamed Port | `Port (unnamed)` | unchanged |
| unnamed Port and unnamed Gate | no index | unchanged |
| the same unnamed target twice | one label | unchanged, the helper keys on the id |
| named targets, broken pointers | as today | unchanged |

## The chips

The prompt allowed `IRFormField.tsx` around `:150-160` only, the body of `displayValue`. That function
receives one value and the chips call it one at a time at `:283`, so the lane stopped and asked. The
scope was widened by the chat on 2026-11-08, under Alfonso's go-ahead of 16:23: the import at `:84` and
the chip builder at `:277-298`.

`unnamedReferenceLabels(field.values)` (`ReferenceWidget.tsx:75`, the C2f helper over
`unnamedTargetLabels`) runs once per field inside that `useMemo`, and `:283` reads
`unnamed[i] ?? displayValue(v)`. The labels are positional over the raw values, so a hole in
`field.values` does not disturb them. `:286` stays right: a label never equals a pointer, and a
dangling pointer has no label, so it still falls through to `displayValue` and reads broken.

| Chips of one field | Today | After |
|--------------------|-------|-------|
| two different unnamed Ports | `Port (unnamed)`, `Port (unnamed)` | `Port (unnamed)`, `Port (unnamed) 2` |
| one unnamed Port | `Port (unnamed)` | unchanged |
| named targets, broken pointers | as today | unchanged, not counted |

Not changed, outside the widened range: the rows of a read-only multi-valued field (`:217`) and the
read-only single value (`:360`) still call `displayValue` one value at a time, so the rows of a
read-only field can read alike.

## What does NOT change

- `name` stays `''`, and the memory of names is fed `''` (R-TXT-46): `rememberRefTargetName(id, name)`.
- `ObjectNode.tsx:554` and `:644` read `t.id` and `t.name`, not the label.
- A target whose proxy throws costs only what it costs today: the targets read before it keep their
  entries, because the labelling runs after the reading loop and in its own guard.
- `DV.tsx`, `defaultViewTemplate.ts`, every jsxString: no VersionFixer migration applies (Rule 14).

## Who reads the string

Searches ran with `command grep` (BSD), exit status noted.

| Reader | Use | Parses it? |
|--------|-----|------------|
| `RowValue.tsx:324,333,337` | pill text and `Go to …` title | no |
| `ObjectNode.tsx` slot `value` / `values` → `detectValueRenderer` | `isReference` decides `refPill` first | no |
| `EditorV2.tsx:3775` | `f.value` handed to the Explain panel as a property | no, free text |
| `ChipInputWidget.tsx:122,127` | chip text, title and `Remove …` aria-label | no; removal goes by chip position and `chipIndex` |

- **Code that parses `(unnamed)`**: `(endsWith|indexOf|includes|split|match|replace)\(.{0,3}\(unnamed`
  over `frontend/src`, exit 1, no hit. Control with `Pointer` in place of `\(unnamed` under the same
  flags: 12 files.
- **Other `(unnamed)` strings**: `codegen/textual/ui/TextConfirmPanel.tsx`, `TextualTab.tsx`,
  `textFile.ts` and `services/export/XMIService.ts:42,52` are their own strings and import neither
  helper.
- **Tests**: `utils/__tests__/namelessRefTarget.test.ts` pins the row of three unnamed Ports reading
  alike. That is the behaviour this lane changes, so the test changes with it.

## Risk

1. **A row can shift its numbers.** The index follows the order of the slot, so removing the first
   of two unnamed Ports makes the survivor read `Port (unnamed)`. It is a position in the list, not
   an identity, as on the C2f list.
2. **Order.** The labels are computed over `fv.values` and painted in the order of `__raw.values`.
   They agree only if the proxy keeps the raw order; the app check measures it from the DOM.
3. **Width.** ` 2` adds two characters to a pill that already truncates.
4. **Read-only rows do not number** (`IRFormField.tsx:217`): a frozen field reads alike where the
   editable one numbers. Outside the widened range.
5. **Stale comment left**: the header of `unnamedTargetLabels` lists only the three C2f widgets.
   `namelessTargetLabel.ts` is in scope only if a helper is missing, so it stays and is reported.

## Smoke-test scenarios potentially affected

- Default view and IR chips, a reference with two unnamed Ports: `Port (unnamed)`, `Port (unnamed) 2`.
- Controls: one unnamed target, named targets, a dangling pointer, the C2f list.
- Import Families.ecore, open an existing project, save and reopen: no code path of theirs is touched.

Propagation: no open uncertainty.
