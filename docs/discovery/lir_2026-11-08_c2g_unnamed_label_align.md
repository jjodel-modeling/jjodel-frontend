# Layer Impact Report: one label for unnamed reference targets (C2g)

Prompt: P-2026-11-08-1239. Written before any code (CLAUDE.md §3.2). Decision: R-TXT-59, amends
R-TXT-47 D5 and D6. Follows `lir_2026-11-08_nameless_reference_labels.md` (C2f).

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)        read only: name, instanceof.name, as today
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   display string of a reference pill only
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Not in the template: the IR form (chips, read-only rows), display only
```

## What changes

`namelessTargetLabel` returns `<Class> (unnamed)` instead of `: <Class>`. Same contract: a string
for a nameless target, `undefined` for a named or missing one, so neither call site changes.

| Call site | What it renders | Today | After |
|-----------|-----------------|-------|-------|
| `jjomTransformers.ts:379`, default view (D5) | `refTargets[].label`, and `values` / `value` of the row | `: Port` | `Port (unnamed)` |
| `IRFormField.tsx:155`, `displayValue` (D6) | chip text and title, read-only value and rows | `: Port` | `Port (unnamed)` |

`unnamedTargetLabels` reuses `namelessTargetLabel` for the base text, so the two cannot drift.

## What does NOT change

- `name` stays `''`, and the memory of names is fed `''` (R-TXT-46).
- `ObjectNode.tsx:554` and `:644` read `t.name`, not the label.
- The broken-chip test `displayValue(v) === v` (`IRFormField.tsx:286`): a label never equals a pointer.
- `DV.tsx`, `defaultViewTemplate.ts`, every jsxString: no VersionFixer migration applies (Rule 14).
- The index stays in `unnamedTargetLabels` alone. See risk 1.

## Who reads the string

Searches ran with `command grep` (BSD); each exit status and positive control is noted.

| Reader | Use | Parses it? |
|--------|-----|------------|
| `RowValue.tsx:324,333,337` | pill text and `Go to …` title | no |
| `ObjectNode.tsx` slot `value` / `values` → `detectValueRenderer` | `isReference` decides `refPill` first (`valueRenderer.ts:538`) | no |
| `EditorV2.tsx:3775` | `f.value` handed to the Explain panel as a property | no, free text |
| `IRFormField.tsx:283,360` | chip label, read-only value | no |

- **Code that parses a leading `: `**: `startsWith|indexOf|split|lastIndexOf(': ')` and `/^: ` over
  `frontend/src`, exit 0, one hit: `codegen/textual/syntaxForm.ts:463`, which slices `checkStyle`
  messages, not labels. Control with `'.'` under the same flags: 37 files.
- **JjEL, JjTL, JjScript, export, codegen, model, redux**: none imports `namelessTargetLabel` or
  calls `jjomTransformers`. The two hits, `ConformanceValidator.ts:490` and its test, are a comment
  citing a line range. Control on `LPointerTargetable` under the same flags: 55 files.
- **Tests**: only `utils/__tests__/namelessRefTarget.test.ts` pins the label. The `: Port` in
  `portLine.test.ts`, `instanceTable.test.ts` and `jjform/nav.ts` (`p2: Port`) is another string.
- **Snapshots**: 0 tracked `.snap` files. **Probes** under `frontend/scripts`: no hit.

## Risk

1. **No index on these two surfaces.** Both call sites label one target at a time, so three unnamed
   Ports in one row or chip input read `Port (unnamed)` three times, as they read `: Port` three
   times today. R-TXT-59 places the index "where two would read the same in one list (C2f)", that
   is, the C2f widgets. Indexing here would change both call sites, which the prompt leaves alone.
   Same form, then: chips can read `Port (unnamed)` twice beside a list reading `Port (unnamed)`
   and `Port (unnamed) 2`.
2. **Width.** The label is 8 characters longer than `: Port`. Pills and chips truncate; the app
   check measures it.
3. **The target's own header** is not a reference label and is not changed, so "as its own header
   reads", the reason D5 gave, no longer holds. The app check measures the header.
4. **Two comments go stale**: `jjomTransformers.ts:369` and `IRFormField.tsx:153-154` still say
   `: <Class>`. The prompt allows only `IRFormField.tsx:155` in the critical zone, so they stay and
   are reported.

## Smoke-test scenarios potentially affected

- Default view, object with a reference to an unnamed target: the pill reads `Port (unnamed)`.
- IR form, chips and read-only rows of an unnamed target: `Port (unnamed)`, not broken.
- Controls: named targets, a dangling chip, the C2f field, list and picker.
- Import Families.ecore, open an existing project, save and reopen: no code path of theirs is touched.

Propagation: no open uncertainty.
