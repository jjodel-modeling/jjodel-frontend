# Layer Impact Report: unnamed targets in the IR reference widgets (C2f)

Prompt: P-2026-11-08-0843. Written before any code (CLAUDE.md §3.2). Finding: P-2026-11-08-0818.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)        read only: name, instanceof.name, id
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Not in the template: the IR form widgets (viewpoint/ir/widgets/), display only
```

## The one touched layer: IR form widgets

**What changes.** A reference target that resolves and has no name reads `<Class> (unnamed)`
in three places, with ` 2`, ` 3`, ... only on the second and later unnamed targets of one class
in one list:

| Site | Today | After |
|------|-------|-------|
| `ReferenceWidget.tsx:51-60` `referenceName` | `''`, so the field paints the "Select a X" placeholder over a slot that holds a value | `Port (unnamed)` with its badge |
| `ListWidget.tsx:89` | raw pointer id, for an unnamed or dangling target | the label; a dangling target reads nothing, as `referenceName` already documents |
| `ReferencePicker.tsx:60` options | raw pointer id: the core's label is `object.name` (`LModelElement.tsx:8182`), and `writeCtxLproxy.ts:120` replaces an empty label with `o.value` | the label, only where the target resolves and is unnamed |

The helper is a new export, `unnamedTargetLabels`, in `editor-v2/utils/namelessTargetLabel.ts`.
It takes the targets of one list and returns their labels in order. The index is taken on the
whole list, so in the picker typing in the search box does not renumber the rows, for the
reason `slots` states at `ReferencePicker.tsx:65-72`.

**What does NOT change.**
- `namelessTargetLabel` and its `: <Class>`. It has two callers outside this lane's scope, the
  default view (`jjomTransformers.ts:379`, R-TXT-47 D5) and the IR chips and read-only rows
  (`IRFormField.tsx:155`, R-TXT-47 D6), and committed tests pin `: Port` in both. Changing its
  output would change those surfaces and overrule a ratified decision that this prompt does
  not cite.
- `name` stays `''` everywhere. The label never reaches the D layer or the memory of names
  (R-TXT-46).
- What a pick writes: `c.value`, the id, as before. Options of named targets keep `o.label`,
  which for a cross reference is the full name.

**Cross-layer interaction.** Read only, through `LPointerTargetable.fromPointer`, the resolution
`referenceName` and `metaclassLetter` already use, in the same render. No new subscription: the
caller's subscription already covers the slot values, and the picker resolves its options once
per open list (`useMemo` on `options`).

**Side-effect safety vs other layers.** No action is dispatched, no TRANSACTION is opened, no
persisted field or jsxString changes, so no VersionFixer migration applies (`DV.tsx` and
`defaultViewTemplate.ts` are not touched).

`ReferencePicker` is shared. Its other mounts get the same labels, which is the intent:
`IRFormField.tsx:506` (the chip input's Add) and `InstanceDetail.tsx:658` (Instance Manager,
«Link existing»). `groupTargets` and `writeCtxLproxy.ts:120` stay as they are.

## Smoke-test scenarios potentially affected

- IR form, single reference holding an unnamed target: field shows badge and label, not the placeholder.
- IR form, list of references or contained children: rows show labels, no raw id.
- Open picker on the IR form and in the Instance Manager: unnamed candidates by label, search matches the label, a pick writes the same id.
- Controls that must not move: named targets, `: Port` on the IR chips and read-only rows, `: Port` on the default view.
- Import Families.ecore, open an existing project, save and reopen: no code path of theirs is touched.

Propagation: no open uncertainty.
