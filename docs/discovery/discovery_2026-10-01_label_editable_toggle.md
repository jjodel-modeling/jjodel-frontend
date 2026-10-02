# Discovery 2026-10-01 — the «Editable» toggle of a Symbol label has no visible effect

Prompt-ID: P-2026-10-01-2349 (Phase 1, read-only) · prompt `docs/prompts/claude_2026-10-01_2349_prompt_label_editable_toggle.md`
Session: started by `lane-run`, session id not exposed to the session · tree `~/jjodel-w-labeledit`, branch `label-editable-toggle`, HEAD `abb0fa9a8`, merge-base with `alfonso-frontend-jjtl` `4b9bc5836`
Model: Claude Sonnet 5.5 (`claude-sonnet-5-5`, as the session banner shows it) · Tags: [R] read, [M] measured in this phase. A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

- **The chat's reading holds, all three points, by reading** [R]. The toggle draws `editable === true` while the compile and the runtime treat absent as editable (`!== false`). Every seeded and derived label carries no `editable`, so the toggle reads OFF while double-click renames, and ON changes nothing. For a literal, path or `metaclassName` source `editsName` is always false, so the toggle has no effect either way. `editable: false` on an intrinsic name label is respected by the runtime. Point 3 is by reading only: `IRNodeContent.tsx` does not import in vitest, so the half that works is confirmed in Phase 2 by the compiled `editsName` and by the probe.
- **No writer of `editable` exists outside the toggle** [M: grep with control]. No seed, derivation or default writes the key on a label; the only non-test hit of `editable: false` is a comment. So every persisted label reads «absent», and only a user who touched the toggle ever stored `true` or `false`.
- **One caller.** `LabelEntryEditor` is rendered by `LabelListEditor` only, and `LabelListEditor` by the Symbol editor's Text tab only (`VertexAuthoringPanel.tsx:980-981`). The change is right for it. Edge labels have their own panel and do not use it.
- **Plan.** A new pure module `ir/irLabelEdit.ts` with two functions: `labelCanRename(source)` (the source can edit the name: intrinsic `name` or `qualifiedName`) and `labelEditsName(label)` (the former and `editable !== false`). `irCompile.ts` calls the second for `editsName`. `LabelEntryEditor.tsx` draws `checked = labelEditsName(label)`, `disabled = !labelCanRename(source)`, and writes through a new exported mapper `applyLabelEditable(label, checked)`: OFF writes `editable: false`, ON removes the key.
- **Sibling bug, a ticket, not done here.** `FieldSegmentEditor.tsx:57` has the same inverted default for the `value` segment of a field row: `checked={valueEditable === true}` against the runtime's `(seg as any).editable !== false` (`IRNodeContent.tsx:706`). Out of the scope of this prompt (Rule 1).
- **Path-label ticket, cost.** Making a single-attribute `path` label editable on the canvas needs: a compiled field on `CompiledLabel` (the feature name of a one-feature path), a second editing state and commit in `IRNodeContent.tsx` that reuses `syncUpdateFeatureValue` (as `commitRowEdit` does, `:342-350`), and a widening of the predicate; about 4 source files plus the key lists pinned in `ir.test.ts:2002` and `:2129`. A separate prompt.
- **Decision row.** Next free id is `R-IRN-38`: no local branch has a row above 37 [M, §5].
- **Phase 2 files: 3 source + 2 tests = 5**, under rule 19's limit (§6). All inside the prompt's list.

**Decisions taken (unattended):** two predicates, not one (the toggle needs «can this source edit» separately from «does it edit», to disable and show OFF); the predicate module is new, `irLabelEdit.ts`, so `irCompile.ts` changes by one import and the `editsName` expression only; the widget-object variant `editable: { widget }` counts as editable on a name label (it did, `!== false`), so the compile does not change for it.
**Decisions awaiting Alfonso:** none on the recommended path. Question 2 below (the sibling ticket) is his to prioritise.

**Questions** (numbered, one line each):
1. Hint wording for the disabled toggle: the prompt's «Only a name label can be renamed on the canvas.» **Recommended:** use it verbatim.
2. File the `FieldSegmentEditor` toggle as a ticket in the Symbol-editor inbox, not fix it here? **Recommended:** yes, a ticket entry (priority low).

---

## 1. Hypotheses under test, with verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The toggle draws `editable === true` while the IR default is the opposite, so it reads OFF on every seeded label. | Holds [R], §2.1 |
| H2 | On a `literal`, `path` or `intrinsic metaclassName` source `editsName` is always false, so the toggle is live and inert. | Holds [R], §2.2 |
| H3 | `editable: false` on an intrinsic name label is respected by the runtime. | Holds by reading [R]; the execution half is Phase 2 (§2.3) |
| H4 | Every seeded and derived label is intrinsic with `editable` absent. | Holds [M: grep with control], §2.4 |
| H5 | `LabelEntryEditor` has callers other than the Symbol Text section. | Falsified [M], §3 |

## 2. Findings

### 2.1 The toggle [R]

`frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx:80-81`:

```
    const editable = label.editable;
    const editableIsWidget = editable !== null && typeof editable === 'object';
```

`:105-111`:

```
                <label className="jj-field-label">Editable</label>
                {editableIsWidget
                    ? <span style={PRESERVED_CHIP}>editable: advanced widget</span>
                    : <Toggle
                        checked={editable === true}
                        onChange={(c) => onChange({ ...label, editable: c })}
                        size="xs"
                    />}
```

The prompt cites `:105-112`; the toggle block is `:105-111`. `irTypes.ts:123-124`:

```
    /** spec v1.2 sez. 5 — absent = default: intrinsic name labels are editable. */
    editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' };
```

`irCompile.ts:476-478`:

```
        const editsName = l.source.from === 'intrinsic'
            && (l.source.prop === 'name' || l.source.prop === 'qualifiedName')
            && l.editable !== false;
```

So `editable` absent: toggle OFF, compile `editsName` true. Turning the toggle ON writes `editable: true`, which compiles to the same `editsName` true: no change on the canvas. This is the reported symptom.

The widget-object variant: `editable: { widget }` is not `=== false`, so on an intrinsic name label it compiles `editsName: true`, and the panel shows the chip. The predicate keeps both (§4).

### 2.2 A source that cannot edit [R]

The same expression, `irCompile.ts:476-478`: `editsName` needs `source.from === 'intrinsic'` and `prop` `name` or `qualifiedName`. A `literal`, a `path` or `intrinsic metaclassName` label compiles `editsName: false` whatever `editable` says. `TextSource` is exactly these three forms (`irTypes.ts:83-86`):

```
export type TextSource =
    | { from: 'path'; expr: PathExpr }
    | { from: 'literal'; text: string }
    | { from: 'intrinsic'; prop: 'name' | 'metaclassName' | 'qualifiedName' };
```

### 2.3 The runtime [R]

`IRNodeContent.tsx:614`: `if (l.editsName && editingLabel === i) {` renders the input; `:638`: `onDoubleClick={l.editsName ? () => {` sets the editing state. `CompiledLabel.editsName` (`irTypes.ts:944-945`) is read in these two places only [M: `command grep -rn editsName src`, 7 hits: the type, the compile (two lines), the two reads, the two key lists in `ir.test.ts`]. The IR wrapper in `nodes/ObjectNode.tsx:952` mounts `<IRNodeContent ... />` and adds no double-click of its own on the IR branch (the `onDoubleClick={handleDoubleClick}` at `:1183` and `:1276` are on the pill and later branches, after the IR branch's `</>` at about `:988`; the prompt cites `ObjectNode.tsx:935-952`, the real path is `nodes/ObjectNode.tsx`). So with `editable: false` on an intrinsic name label, `editsName` is false and nothing opens. `IRNodeContent.tsx` does not import in the vitest bench (`window is not defined` through `joiner`, recorded in the log entries of 2026-09-29), so this half rests on the compile test plus the Phase 2 probe, not on a unit test of the component.

### 2.4 No writer of the key outside the toggle [M]

`grep -rnE "editable: *(true|false)" src --include='*.ts' --include='*.tsx'` (through `command grep`, bypassing the ugrep wrapper) returns two lines: the comment `IRNodeContent.tsx:8` and the test `labelEntryEditor.test.ts:39`. That the search runs is the positive control: it finds those two. So no seed (`irDefaults.ts`, `irCreationSeed.ts`, `irKindConvert.ts`, `EnableIRPanel.tsx`) and no derivation (`viewpointDerivation.ts:389` and the `NAME_SOURCE()` labels `:569`, `:627`, `:934`, `:963`) writes `editable`. The intrinsic labels they produce are `name` or `qualifiedName`, `editable` absent. `irValidate.ts` and `irPrune.ts` do not mention the key (searched, `\beditable\b` in those files: no hit; same tool, control above).

## 3. Callers of `LabelEntryEditor` [M]

`command grep -rn "LabelEntryEditor" src`: `LabelListEditor.tsx:3` imports it and `:63` renders it; the other hits are comments and its own test. `command grep -rn "LabelListEditor" src`: `VertexAuthoringPanel.tsx:19` and `:981`. The panel section is the Text tab, `<FormSection title="Labels" divider={false}>` (`:980`). The Symbol editor modal (`SymbolEditorModal.tsx`) hosts the panel. `EdgeAuthoringPanel.tsx` does not use it. **One caller; the change is right for every use.** `LabelListEditor.newLabel` (`:6-7`) creates a `literal` label with no `editable`: under the new rule its toggle is disabled and OFF with the hint, which is the intended reading.

## 4. The predicate

New module `frontend/src/components/editor-v2/viewpoint/ir/irLabelEdit.ts`, types only as imports, no React, so it loads in the node bench. Name checked: `command grep -rn "labelEditsName\|labelCanRename" src` finds nothing; the control in the same tree is `labelEditable` (`UnifiedEdge.tsx:168`, an unrelated edge flag), found by the same search.

```
labelCanRename(source: TextSource): boolean
    source.from === 'intrinsic' && (prop === 'name' || prop === 'qualifiedName')
labelEditsName(label: Pick<LabelSpec, 'source' | 'editable'>): boolean
    labelCanRename(label.source) && label.editable !== false
```

The five sources are `path`, `literal`, `intrinsic name`, `intrinsic qualifiedName`, `intrinsic metaclassName`; the four `editable` values are absent, `true`, `false`, `{ widget }`. Expected: true only for `name` or `qualifiedName` with absent, `true` or `{ widget }`.

The toggle:
- `checked = labelEditsName(label)` for the boolean case; `disabled = !labelCanRename(label.source)`; the widget chip stays as is.
- `applyLabelEditable(label, checked)` (exported, pure, next to `applyLabelPositionValue`): OFF returns `{ ...label, editable: false }`; ON returns the label without the `editable` key (a rest destructure, the idiom of `applyLabelPositionValue`).
- A disabled toggle shows OFF and a `HelpText` with the one-line hint; nothing is written on render.

## 5. Tests that pin the current behaviour [R]

- `authoring/__tests__/labelEntryEditor.test.ts`: position mappers and the rendered select. It pins no toggle state. Its only mention of `editable` is `:39`, `base({ position: 'top', editable: false })`, an input of `applyLabelPositionValue` that must keep its key order; unaffected.
- `ir/__tests__/ir.test.ts:2002` and `:2129` pin the key list of a compiled label, `['editsName', 'position', 'style', 'text', 'visible']`. The change adds no key; it must stay green.
- No test asserts `editsName`'s value (grep `editsName` over `*.test.ts`: only the two key lists). The compile has no test today for `editable: false`.

Phase 2 renders the editor with `renderToStaticMarkup` for `aria-checked` and `disabled` (the `Toggle` emits `role="switch"`, `aria-checked`, `disabled`, `Toggle.tsx:121-123`), and calls the function component directly (it has no hooks) to find the `Toggle` element and invoke its `onChange`, so the wiring is executed, not read.

## 6. Phase 2 files (rule 19: 5 files, listed before the go)

Source, under `frontend/src/components/editor-v2/viewpoint/`:
1. `ir/irLabelEdit.ts` — new, the two predicates.
2. `ir/irCompile.ts` — one import line and the `editsName` expression (`:476-478`) call `labelEditsName`. The import line is the only addition beyond the expression the prompt named.
3. `authoring/LabelEntryEditor.tsx` — the toggle, `applyLabelEditable`, the hint.

Tests, under `__tests__/`:
4. `ir/__tests__/irLabelEdit.test.ts` — new: the predicate over 5 × 4, and `compileView(...).labels[0].editsName` agreeing with it for every combination.
5. `authoring/__tests__/labelEntryEditor.test.ts` — extended: ON at rest for an intrinsic name label with `editable` absent, OFF writes `false`, ON removes the key, disabled for literal, path and `metaclassName`, the hint, the widget chip unchanged.

Docs: this report, one row in `docs/decisions.md`, a log entry and two tickets in `docs/log-inbox/symbol-editor.md`, the prompt's Status.

## 7. Decision id [M]

The decisions file ends at R-IRN-37 on the trunk. For every local branch I read `docs/decisions.md` at its tip and took the highest `R-IRN-<n>`: 102 branches carry rows, the maxima are 28 (1 branch), 36 (78), 37 (23), none at 38 or above. `git grep -l "R-IRN-38"` over every local branch under `docs/`: no hit. The first attempt filtered the numbers through a `tail` that cut the high end; it was redone with the number as a plain integer test (`-ge 38`), exit clean, which is the run this section reports. **R-IRN-38 is free.** Remote branches were not searched: the worktree branches that can collide are local.

## 8. Risks and dependencies

- `irCompile.ts` is on the 2.5 hot list (IR / Execution) but not a §3.1 critical-zone file; no sync-layer file, no D-layer write, no VersionFixer change (nothing persisted changes shape: ON removes a key whose absence already reads editable).
- A persisted `editable: true` keeps compiling to `editsName` true and reads ON.
- The compiled label keys do not change and `irHash` (`irCompile.ts:397`) is not touched, so the compile cache keys of an unchanged IR stay as they are. Phase 2 runs the existing `ir.test.ts` hash tests to confirm.
- Lane P-2026-10-01-2336 (`~/jjodel-w-irclip`, SCSS only) touches none of the five files.

---

## 9. Phase 2 addendum (2026-10-02, same session)

Code `20c843f14`, five files as §6, no deviation. Questions 1 and 2 adopted with their `Recommended:`: the hint is the prompt's sentence verbatim; the `FieldSegmentEditor` toggle is a ticket, not a fix.

- **Tests first.** Before the change `irLabelEdit.test.ts` failed at import and 7 of the new toggle tests failed; after, 49 passed across the two files [M].
- **Mutation bench, 17 of 17 killed, none void** [M]: predicate (drop `!== false`, drop `qualifiedName`, accept `metaclassName`, any intrinsic prop, any source, `labelCanRename` ignored, `editable: false` ignored), compile (a `qualifiedName` drift, constant true), editor (checked back to `=== true`, never disabled, ON writes `true`, OFF writes nothing, hint never shown, hint on name labels, toggle bypasses the mapper, widget draws a toggle). Each mutation was applied in place and restored in `finally`.
- **Gates** [M]: typecheck exit 2, 14 errors, the baseline set by file and code; build exit 0; full vitest 9 failed files (exactly the nine at-import files of `CLAUDE.md` §17) and 6450 of 6450 tests passed. A first full run under load average 87 also failed `scripts/hooks/__tests__/laneRun.test.ts` and `laneRunDirect.test.ts` (15 s timeouts, `expected null to be +0`); both files pass at low load, 108 tests, so those reds were load, not the code.
- **Probe on 3091, light, 1600x1000, DPR 2** [M], 23 of 23: the four demo scenes (sm, petri, esm, flowB) 0 px from a run with the base `irCompile.ts` swapped in (Jodie launcher masked, 525 px in both); a user Symbol view with an intrinsic name label and `editable` absent: toggle ON at rest, no hint, opening the section writes nothing, double-click opens the input; toggle OFF writes `editable: false` and double-click opens nothing, per contrasto with the first; ON again removes the key (`keys` `["position","source"]`), double-click opens the input and the rename lands and shows on the canvas; a literal label: toggle disabled and OFF, hint visible, a forced click writes nothing. Crops (`sips -Z 600`) in `frontend/scripts/smoke/_tmp_labeledit_crops/`: `labeledit_text_rest_toggle_600.png`, `labeledit_disabled_hint_600.png`, `labeledit_disabled_main_600.png`.
- **A finding outside the scope, measured on the base too** [M]. With the first scenario (class `Thing` without a `name` attribute) the rename landed in the store (`DObject.name` and the L-proxy `name` both `thing1_renamed`) but the IR node kept drawing `thing1` for 5 s and after a tab round trip. The same diagnostic with the base `irCompile.ts` swapped in printed the same lines, so it predates this lane. Cause read in `irResolve.ts:49-72`: the `useIRView` selector snapshots the viewpoint signature, the object's id, class and DValue slot values, and the cross deps, not `dObject.name`, and the memo that builds `readCtx` keys on that signature. With a `name` attribute on the class (the identity slot, `model/CLAUDE.md` §3.12) the rename changes a DValue and the label refreshes (the final probe). Not touched: Rule 1 and Rule 20, a ticket in the inbox.
- **Environment.** Two of the first four `lane-run probe` attempts on the real code died on `net::ERR_NETWORK_CHANGED` from the browser (the machine's network flapped; no vite error). The final probe ran against a vite started by hand on 3091 with the lane's scratch config, then stopped.
- **Tickets filed** (inbox `symbol-editor`): the stale IR label after a rename (medium), the `FieldSegmentEditor` toggle with the same inverted default (`FieldSegmentEditor.tsx:57` against `IRNodeContent.tsx:706`, low), the single-attribute path label (cost in §0, low).
