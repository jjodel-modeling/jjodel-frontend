# Discovery 2026-10-02 — a Symbol label that shows one attribute, editable on the canvas

Prompt-ID: P-2026-10-02-1647 (Phase 1, read-only) · prompt `docs/prompts/claude_2026-10-02_1647_prompt_path_label_edit.md`
Session: started by `lane-run`, session id not exposed to the session · tree `~/jjodel-w-pathlabel`, branch `path-label-edit`, HEAD `7bb901a12`, branched from the trunk at `adb5d9731`
Model: Claude Opus 5.5 (`claude-opus-5-5`, as the session banner shows it) · Tags: [R] read, [M] measured in this phase. A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

- **Decidability, split in two** [R]. «One step to the object's own feature, read as `.value`» is decidable at compile time from the IR alone (`singleHopOf` in `ir/pathExpr.ts`). «That feature is a single-valued string attribute» is not: `compileView(viewId, ir)` receives no metamodel, and one view may apply to several metaclasses. It is decidable in the panel (the `features` prop carries `type` and `upperBound` per attribute) and on the canvas (the object's slot in `idlookup`). So the compiled label carries the IR half (`editsFeature?: string`), and the type half is one pure function both sides call with the same descriptor.
- **Write path, reusable as is** [R]. The row value commit is `syncUpdateFeatureValue(vertexId, name, editValue)` (`IRNodeContent.tsx:346`); a label commit calls the same function with the label's feature. No new write code, no critical-zone file touched (`canvasToJjom.ts` is called, not edited).
- **«Its undo snapshot» does not exist on the IR branch** [R]. The row commit takes none on purpose (`IRNodeContent.tsx:340`); undo is the D-layer stack (R-UNDO-1, `EditorV2.tsx:1082-1090`), and the `TRANSACTION` inside `syncUpdateFeatureValue` is one undo step. The label inherits exactly that.
- **Types** [R]. Neither the IR row commit nor the native one parses: the raw string goes to the L-layer, whose setter stores any primitive («loose checks ... will cast on get», `LModelElement.tsx:7934`). There is no reusable parse function to lean on, so by decision 2 numbers, booleans, enums and dates stay disabled with a hint; v1 edits `EString` only.
- **Nothing visible changes at rest** [M: grep with control]. No seed, derivation or demo writes `editable`; the vertex path labels in the tree (`viewpointDerivation.ts:940`, the Petri token count; `irDemoFixture.ts:66`, `:95`) carry no `editable`, so under opt-in they stay not editable. Edge labels compile elsewhere and are untouched.
- **Plan** (§6): `irLabelEdit.ts` gains the per-source default, `labelPathFeature`, `labelEditsFeature`, the feature descriptor and its check, and `labelEditBlock` for the toggle; `irCompile.ts` writes `editsFeature` only when set (the pinned compiled-label key lists stay as they are); `IRNodeContent.tsx` opens the same input on double-click after checking the slot at the gesture, and commits through `syncUpdateFeatureValue`; `LabelEntryEditor.tsx` reads the block and the default. Seven files, all in the prompt's DOVE.

**Decisions taken (unattended):** the answers to questions 1-6 below, each with its `Recommended:` line; R-IRN-41 written as provisional (RC-25).
**Decisions awaiting Alfonso:** none. No critical-zone edit, no exported interface changed (one optional field on `CompiledLabel`, additive), no ratified R- row amended (R-IRN-38 is provisional and is amended add-only by R-IRN-41).

**Questions** (numbered, one line each):
1. Does the widget object `editable: { widget }` opt a path label in? **Recommended:** yes, as it already renames a name label whatever the widget kind; nothing writes it but a hand-authored IR.
2. Which path shapes count as «one step»? **Recommended:** `$f` and `$f.value` only; `$f.values`, `$f.values[N]` and every multi-step path are blocked with the single-attribute hint.
3. Which types edit? **Recommended:** `EString` only; any other attribute type is blocked with «Only a string attribute can be edited on the canvas.»
4. Where does the canvas check the type? **Recommended:** at the double-click, reading the slot from `idlookup` through a pure helper, the pattern of `openRowSelect` (`IRNodeContent.tsx:368`); no per-render store read.
5. Hint for a path label that cannot edit? **Recommended:** «Only a single attribute of this object can be edited on the canvas.» (the prompt's example), and the name-label hint unchanged for literal and metaclassName.
6. The panel has no metaclass (`features` null) on a path label? **Recommended:** disabled with the single-attribute hint: the panel cannot know, and an ON it cannot back would mislead.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | «One step, own attribute» is decidable at compile time from the metamodel. | Partly: the step shape is decidable from the IR; the feature kind, type and multiplicity are not, the compile has no metamodel (§2.1) [R] |
| H2 | The row inline write path is reusable for a label without new write code. | Holds (§2.2) [R] |
| H3 | The row write path takes an undo snapshot that the label must take too. | Falsified: no snapshot on the IR branch, undo is the D-layer stack (§2.3) [R] |
| H4 | The row edit parses numbers and booleans through a reusable function. | Falsified: it writes the raw string (§2.4) [M: grep with control] |
| H5 | Some seeded or derived label would become editable. | Falsified (§4) [M] |
| H6 | The R-IRN-38 tests pin the path case. | Holds: the toggle test pins a path label disabled with the name hint; it changes in Phase 2 (§3) [R] |

## 2. Findings

### 2.1 How a path is represented, and what the compile knows [R]

`frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts:83-86`:

```
export type TextSource =
    | { from: 'path'; expr: PathExpr }
    | { from: 'literal'; text: string }
    | { from: 'intrinsic'; prop: 'name' | 'metaclassName' | 'qualifiedName' };
```

A `PathExpr` is a string; `ir/pathExpr.ts` parses it. `singleHopOf` (`pathExpr.ts`, after `parsePathExpr`) returns the one hop or null, non-throwing:

```
export function singleHopOf(expr: string): { feature: string; take: 'value' | 'values' | number } | null {
```

`$f` and `$f.value` give `take: 'value'`; `$f.values` gives `'values'`; `$f.values[2]` gives `2`; two `$` tokens give null.

The compile: `irCompile.ts:407`, `export function compileView(viewId: string, ir: NodeViewIR): CompiledView {`. The label block is `:457-483`; the path case compiles an accessor and adds the feature names to `deps`, no metamodel lookup anywhere in it. The view names its metaclasses by string (`metaclasses: ['State']` in the tests), and the panel resolves them to a class (`VertexAuthoringPanel.tsx:330-370`), not the compile.

The panel's descriptor, `frontend/src/components/ui/PathBuilder/PathBuilder.tsx:13-16`:

```
export interface PathBuilderFeatures {
    attributes: { name: string; type: string; upperBound: number }[];
    references: { name: string; targetClassName: string; upperBound: number }[];
}
```

filled by `VertexAuthoringPanel.tsx:362-367` from `MetaclassInfo.allAttributes`, whose `type` is the type name (`hooks/useEditorMode.ts:65`, `type: string;          // type name (e.g. 'EString')`; `:387`, `type: attr.type?.name ?? 'EString',`).

The canvas: `IRNodeContent.tsx:279-300` reads the slot of each feature from `idlookup` (`feat.className === 'DReference' ? 'R' : 'A'`, `typeObj?.name`), but only when the view has field compartments (`:279`, `if (compiled.fieldCompartments.length === 0) return '';`), and without the upper bound. A label cannot reuse that signature; it reads the slot at the gesture instead.

### 2.2 The row write path [R]

`IRNodeContent.tsx:342-350`:

```
    const commitRowEdit = useCallback(() => {
        if (editingRow) {
            const before = rows.attributes.find(r => r.key === editingRow.key)
                ?? rows.references.find(r => r.key === editingRow.key);
            syncUpdateFeatureValue(vertexId, editingRow.name, editValue);
            if (!before || before.value !== editValue) U.isProjectModified = true;
            setEditingRow(null);
        }
    }, [editingRow, editValue, vertexId, rows]);
```

`syncUpdateFeatureValue` (`sync/canvasToJjom.ts:1532-1559`) opens `TRANSACTION(\`EditorV2 set ${featureName}\`, ...)` and assigns `featureProxy.value = newValue` on `lObject['$' + featureName]`. Keyed by vertex id and feature name, exactly what a label has. The label commit (`:352-360`) has the same shape with `syncNodeLabel`. So the label commit branches on the compiled feature and calls `syncUpdateFeatureValue`; the Escape handling (`editKeys`, `:362-365`) already clears both edit states.

A side effect to know, not to change: `LModelElement.tsx:7955`, `if (index === 0 && lname?.toLowerCase() === 'name' && c.data.father) {` — writing an attribute called `name` also writes `DObject.name`. A `$name` path label therefore renames, as a row edit of `name` does.

### 2.3 Undo [R]

`IRNodeContent.tsx:340`: `// is conditional. No canvas snapshot here on purpose: the canvas history holds`, followed by «React Flow nodes/edges, and a slot value is not in them (see the R12 report)». `EditorV2.tsx:1082-1090`: in JjOM mode «editor-v2 runs NO history of its own: Cmd+Z is swallowed by Navbar ... the keystroke becomes an UndoAction on the D-layer». The native branch's `takeSnapshot` (`nodes/ObjectNode.tsx:420`) belongs to the non-JjOM history. The prompt's «with its undo snapshot» therefore reads as: the same undo the rows have, the `TRANSACTION` as one D-layer step. Phase 2 measures it in the probe (undo restores the value).

### 2.4 Types [M]

`command grep -nE "parseFloat|parseInt|Number\(|=== 'true'" viewpoint/ir/IRNodeContent.tsx`: no hit, exit 1; the control `command grep -cE syncUpdateFeatureValue` on the same file counts 3. The same search on `nodes/ObjectNode.tsx` finds one `parseInt` (`:228`, a lower bound of the placeholder list, not a value); its commits (`:411`, `:438`) pass `editValue` raw. The L-layer accepts it, `LModelElement.tsx:7934`: `// loose checks, i can assign any primitive to any primitive (will cast on get)`. Editing an `EInt` through a label would store the string `"3"`, which renders right and is cast on read, but nothing validates it: a «three» would be stored as well. Decision 2 reads this as «no reusable parse», so v1 is `EString` only.

## 3. Tests that pin the current behaviour [R]

- `ir/__tests__/irLabelEdit.test.ts:14-38`: the 5 × 4 table of `labelEditsName`, path row all false; `:84-99` the compile's `editsName` agrees. The path row stays false (a path label never renames); the file gains the path tables.
- `authoring/__tests__/labelEntryEditor.test.ts:165-172`: «is disabled and OFF with the hint for a literal, a path and a metaclassName», with `HINT = 'Only a name label can be renamed on the canvas.'` and a path `$name.value` with `features: null`. Under the plan a path with `features: null` stays disabled and OFF, with the new hint: the path half of this test changes, the literal and metaclassName halves stay.
- `applyLabelEditable` tests (`:107-126`) use the name source; unchanged.
- `ir/__tests__/ir.test.ts:2002` and `:2129` pin the compiled label keys `['editsName', 'position', 'style', 'text', 'visible']` on literal labels. `editsFeature` is written only when set (the `anchor` idiom, `irCompile.ts:481`), so those lists stay green without an edit.

## 4. Labels that must not change [M]

`command grep -rn "from: 'path'" --include='*.ts' --include='*.tsx' frontend/src`, minus tests: vertex path labels in `irDemoFixture.ts:66`, `:95` (`$name.value`, dev console helper) and `viewpointDerivation.ts:940` (the Petri token count `$simInitialMarking.value`, an integer); the others are edge labels (`:344`, `:355`, `:533`, `:719`, `:826`, `:921`), field row templates (`:433`, `:530`) and a header template (`:558`), none a `LabelSpec`. `command grep -rnE "editable: *(true|false)"` over the same tree, minus tests: three hits, all comments or the toggle's mapper (`irLabelEdit.ts:16`, `IRNodeContent.tsx:8`, `LabelEntryEditor.tsx:54`, `:59`); that the search runs is shown by those hits. So every persisted path label reads «absent», and under opt-in none becomes editable.

## 5. Decision id [M]

For each local branch, `git show <b>:docs/decisions.md | grep -o "R-IRN-4[0-9]\|R-IRN-39"`: no hit on any branch, exit 0; the control `grep -c R-IRN-38` on the trunk's file counts 1. R-IRN-39 and R-IRN-40 are reserved by the prompt for the parallel lanes; R-IRN-41 is this lane's.

## 6. Phase 2 plan and files (rule 19: seven files, all in the prompt's DOVE)

Under `frontend/src/components/editor-v2/viewpoint/`:

1. `ir/irLabelEdit.ts` — add, without touching `labelCanRename` / `labelEditsName`: `labelEditableDefault(source)` (absent edits for every source but a path), `labelPathFeature(source)` (the feature of `$f` / `$f.value`, else null), `labelEditsFeature(label)` (that feature when the label opts in), `LabelFeatureInfo` and `labelFeatureInfoOf(lookup, objectId, feature)` (the slot read from a plain `idlookup`), `labelFeatureEditBlock(info)` and `labelEditBlock(source, info)` (why it cannot edit: `'name-only'`, `'single-attribute'`, `'string-only'`, or null).
2. `ir/irCompile.ts` — the label block sets `compiled.editsFeature` when `labelEditsFeature` returns a name.
3. `ir/irTypes.ts` — `CompiledLabel.editsFeature?: string`, additive.
4. `ir/IRNodeContent.tsx` — the label input opens for `editsName` or `editsFeature`; double-click on a feature label checks the slot (`labelFeatureEditBlock(labelFeatureInfoOf(...)) === null`) and seeds the input with the rendered text; the commit calls `syncUpdateFeatureValue` for a feature label and `syncNodeLabel` otherwise.
5. `authoring/LabelEntryEditor.tsx` — the toggle reads `checked` and `disabled` from `labelEditBlock` and the default, the hint per block; `applyLabelEditable` writes against the per-source default (path: ON writes `true`, OFF removes the key; every other source unchanged); the component builds the descriptor from its `features` prop.
6. `ir/__tests__/irLabelEdit.test.ts` — the predicates over sources × {absent, true, false, widget} × {one-step string attribute, multi-step, reference, multi-valued, non-string}; the slot reader; the compiled `editsFeature` only when the predicate says so.
7. `authoring/__tests__/labelEntryEditor.test.ts` — the path toggle: OFF at rest, ON writes `true`, OFF removes the key, disabled with the right hint per block; the name tests unchanged except the path half of `:165`.

## 7. Risks

- `IRNodeContent.tsx` does not import in the vitest bench (`window is not defined` through `joiner`, R-IRN-38 report §2.3): its half is covered by the pure helpers it calls and by the probe, stated in the log entry.
- The `viewpoint/ir/` and `viewpoint/authoring/` directories are in the §3.1 table but outside the §3.2 trigger that the hook and the Layer Impact Report enforce (`frontend/scripts/hooks/critical-zone.mjs:17-19`); the prompt names them in scope, and no §3.2 file is edited. Layer Impact Report not required.
- Escape after a typed value: the input unmounts with focus, and a blur fired on removal would commit through the old closure. The name label already runs this path; the probe measures Escape on the path label and on the name label.
- Lanes P-2026-10-02-1645 (`irResolve.ts`) and P-2026-10-02-1646 (`FieldSegmentEditor.tsx`) touch none of the seven files.
