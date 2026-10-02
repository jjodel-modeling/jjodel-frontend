# Discovery 2026-10-02 — the «editable inline» toggle of a value segment reads the wrong default

Prompt-ID: P-2026-10-02-1646 (Phase 1, read-only) · prompt `docs/prompts/claude_2026-10-02_1646_prompt_segment_editable_toggle.md`
Session: started by `lane-run`, session id not exposed to the session · tree `~/jjodel-w-segedit`, branch `segment-editable-toggle`, HEAD `6519d3094`, merge-base with `alfonso-frontend-jjtl` `adb5d9731` (the trunk has moved to `cdec5e44d` since; not merged here)
Model: Claude Sonnet 5.5 (`claude-sonnet-5-5`, as the session banner shows it) · Tags: [R] read, [M] measured in this phase. A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

- **The chat's reading holds, by reading** [R]. `FieldSegmentEditor.tsx:57` draws `checked={valueEditable === true}` and `:58` writes `editable: c`; the runtime (`IRNodeContent.tsx:706`) reads `row.editableValue && (seg as any).editable !== false`. A seeded `value` segment has no `editable`, so the toggle reads OFF while the row edits inline, and ON writes `true`, which changes nothing. `IRNodeContent.tsx` does not import in vitest, so the runtime half is read, not run; Phase 2's probe runs it.
- **Nothing writes `editable` on a segment but the toggle** [M: grep with control]. `forKind('value')` returns `{ kind: 'value' }` (`:16`), and every seed (`irDefaults.ts` ×5, `irDemoFixture.ts` ×3, `viewpointDerivation.ts:169`) writes `{ kind: 'value' }` with no key. Persisted data is «absent» unless a user touched the toggle: `true` reads ON before and after, `false` reads OFF before and after. **Only the display of an absent key changes (OFF to ON); the canvas does not, no migration, nothing persisted changes meaning.**
- **One caller.** `FieldSegmentEditor` is rendered by `FieldCompartmentListEditor.tsx:254` only, and that by `VertexAuthoringPanel.tsx:573` only (`FormAuthoringBody.tsx:153` is a comment). The form renderer never reads a segment's `editable` (`IRFormField.tsx:205` derives its own from the field). No test pins the toggle.
- **Disable the toggle where the row cannot edit: no.** The panel knows the compartment source, not the row: `editableValue` is `kind === 'A'` per DValue of the instance (`IRNodeContent.tsx:311`), and one segment format serves every row of the compartment. And in a `references` compartment the same flag `editable !== false` gates the singleton select (`:714`), so the toggle is live there too. Never disabled; the report of Phase 2 says so.
- **Predicate: not worth it, inline** [recommendation]. The runtime (`IRNodeContent.tsx`, read-only here) keeps its own inline `!== false`, so a module would have one consumer and could not be shared with the runtime in this lane, which is what justified `irLabelEdit.ts` (compile and panel share it). The fix is an inline `valueEditable !== false` plus an exported pure mapper `applyValueEditable(segment, checked)` in `FieldSegmentEditor.tsx`, the shape of `applyLabelEditable`.
- **Phase 2 files: 2** (`authoring/FieldSegmentEditor.tsx`, new `authoring/__tests__/fieldSegmentEditor.test.ts`), plus docs. Under rule 19.
- **Layer Impact Report.** `authoring/` is a row of the §3.1 table, but §3.2's trigger list (sync files, VersionFixer, D-layer write paths) does not name it and this change touches none of them. A short report goes in chat before the diff anyway, and the log entry says `produced`.
- **Decision row.** `R-IRN-40` as the prompt assigns: no `R-IRN-39` or `-40` in `docs/decisions.md` at this tip [M, count 0].

**Decisions taken (unattended):** inline expression and an in-file mapper, no new module; the toggle is never disabled; ON removes the key and drops a persisted `true`, as R-IRN-38 does for labels.
**Decisions awaiting Alfonso:** none on the recommended path.

**Questions** (numbered, one line each):
1. Predicate module or inline? **Recommended:** inline, with `applyValueEditable` exported from `FieldSegmentEditor.tsx`.
2. Disable the toggle when the compartment cannot edit its rows? **Recommended:** no; it governs the inline edit on `attributes` and the singleton select on `references`, and the panel does not know the row.

---

## 1. Hypotheses under test, with verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The toggle draws `editable === true` while the runtime treats absent as editable, so a seeded value segment reads OFF while it edits. | Holds [R], §2.1 |
| H2 | No seed or default writes `editable` on a segment: persisted segments read «absent» unless the toggle was used. | Holds [M], §2.2 |
| H3 | `FieldSegmentEditor` has callers other than the compartment list editor. | Falsified [M], §3 |
| H4 | The toggle should be disabled where the row cannot be edited (`row.editableValue` false). | Falsified [R], §2.3: the panel does not know the row, and the flag also gates the reference select |
| H5 | A predicate module next to `irLabelEdit.ts` is worth it. | Falsified [R], §4 |
| H6 | A test pins the current toggle. | Falsified [M], §5 |

## 2. Findings

### 2.1 The toggle against the runtime [R]

`frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx:35-36`:

```
    const valueEditable = segment.kind === 'value' ? segment.editable : undefined;
    const editableIsWidget = valueEditable !== null && typeof valueEditable === 'object';
```

`:53-62`:

```
            {segment.kind === 'value' && (
                editableIsWidget
                    ? <span style={PRESERVED_CHIP}>editable: advanced widget</span>
                    : <Toggle
                        checked={valueEditable === true}
                        onChange={(c) => onChange({ kind: 'value', editable: c })}
                        label="editable inline"
                        size="xs"
                    />
            )}
```

`ir/IRNodeContent.tsx:706`:

```
                                            const editable = row.editableValue && (seg as any).editable !== false;
```

Absent: toggle OFF, `editable` true. ON writes `true`: `editable` true, no change. The type says the same (`irTypes.ts:142`): `| { kind: 'value'; editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' } }`; the prompt cites `FieldSegmentEditor.tsx:52-58`, the toggle block is `:53-62`. The widget-object variant is not `=== false`, so it edits at runtime, and the panel shows the chip; both unchanged by the fix. The runtime reads `editable` at two places, `:706` (the inline input and the double-click) and `:714` (the singleton select, §2.3).

### 2.2 What seeds [M]

`forKind('value')` (`FieldSegmentEditor.tsx:16`): `case 'value': return { kind: 'value' };`, so a kind switch to Value resets to a segment with no `editable`. `command grep -rnE "kind: 'value'" src` (outside tests) returns the seeds `irDefaults.ts:55,153,200,235,269`, `irDemoFixture.ts:49,73,110`, `derive/viewpointDerivation.ts:169`, all `{ kind: 'value' }`, plus the type (`irTypes.ts:142`) and the two lines of the editor. A broader search for writers, `command grep -rnE "editable: *(true|false)|editable *[:=] *[a-z]" src` outside `__tests__`, returns 17 lines: comments, the runtime read, the label editor, the classic `ObjectNode.tsx:1335` (`isRowEditable`, the non-IR node) and `NodeEditor.tsx:301`; the only write on a value segment is `FieldSegmentEditor.tsx:58`. The control is the same search narrowed to `editable: c`, which finds that line. Exit status 0 on both, run with `command grep` (BSD), not the ugrep wrapper. `irValidate.ts` and `irPrune.ts` carry no `editable` (the word search `command grep -rnw "editable"` over `viewpoint/` has no hit in them; the same run lists the known mentions, so it ran).

### 2.3 Where the row cannot edit [R]

`IRNodeContent.tsx:311`: `const row: CompartmentRowData = { key: fid, name, typeName, typeId, value, editableValue: kind === 'A' };`, where `kind` is `feat.className === 'DReference' ? 'R' : 'A'` (`:289`), a property of one DValue of one instance. A segment format belongs to a compartment and serves every row of it, so the panel cannot know it. Nor does the runtime distinguish a derived attribute: any `A` row is editable. The `references` compartment: `:710-714`,

```
                                            const selectable = isReferenceCompartment
                                                && editorCtx?.showSingletons === false
                                                && !!editorCtx.singletonConformTypeIds?.has(row.typeId)
                                                && (seg as any).editable !== false;
```

so `editable: false` on a `references` compartment's value segment also turns off the singleton select; the toggle is live for both `attributes` and `references`. A `children` compartment shows no segment editor (`FieldCompartmentListEditor.tsx:261`, a HelpText instead). So «disabled» has no condition the panel can evaluate: **no**. The label hint of R-IRN-38 has no counterpart here.

## 3. Callers [M]

`command grep -rn "FieldSegmentEditor" src`: the component and its props (`FieldSegmentEditor.tsx`), `FieldCompartmentListEditor.tsx:3` (import) and `:254` (`<FieldSegmentEditor segment={seg} onChange={(s) => replaceSegment(si, s)} />`), and comments in `ui/PredicateBuilder/predicateDefaults.ts`, `ui/ConditionalEditor/conditional.ts`. `command grep -rn "FieldCompartmentListEditor" src`: `VertexAuthoringPanel.tsx:21` and `:573`; `FormAuthoringBody.tsx:153` is a comment. **One caller chain; the change is right for every use.** `IRFormField.tsx:205` (`const editable = !field.isMultivalued && !field.isReadOnly ...`) is the form's own flag, not the segment's.

## 4. The predicate, or not

The two reads of the runtime are inline (`:706`, `:714`) and the file is read-only for this lane, so a module `irSegmentEdit.ts` would have one consumer, the panel, and the drift R-IRN-38 closed (compile against panel) cannot be closed here by a predicate. Recommended: in `FieldSegmentEditor.tsx`,

```
checked = valueEditable !== false   (boolean case; the widget chip stays)
applyValueEditable(segment, checked): OFF -> { ...segment, editable: false }; ON -> segment without the key
```

with the mapper exported and pure (rest destructure, the idiom of `applyLabelEditable`), so the test calls it and the component. A future lane that routes the runtime through a shared predicate would move the inline expression into it in one line.

## 5. Tests that pin the current behaviour [M]

`command grep -rln "FieldSegmentEditor" src --include='*.test.ts' --include='*.test.tsx'`: no hit, exit 1. Control, same tool and shape: `command grep -rln "labelEditsName" src --include='*.test.ts'` finds `irLabelEdit.test.ts`, exit 0. The two test files that name `FieldCompartmentListEditor` (`rowAuthoring.test.ts`, `formAuthoring.test.ts`) import its pure helpers only; `ir.test.ts` pins no segment `editable`. **Nothing to keep green; nothing pins the old reading.** `FieldSegmentEditor` should load in the node bench like `LabelEntryEditor` does (it imports the same `../../../ui` barrel); Phase 2's first test run settles it. The `Toggle` emits `role="switch"` and `aria-checked` (`ui/Toggle/Toggle.tsx:121`), the handle the sibling test uses.

## 6. Phase 2 files (rule 19: 2 files plus docs)

1. `authoring/FieldSegmentEditor.tsx` — the toggle reads `!== false`, `applyValueEditable` exported.
2. `authoring/__tests__/fieldSegmentEditor.test.ts` — new: absent reads ON; `false` OFF; `true` ON; OFF writes `false`; ON removes the key (and a persisted `true`); the widget chip unchanged and no switch; `name`, `type`, `literal` show no switch; the wiring executed by calling the function component and firing the Toggle's `onChange`.

Docs: this report, the row `R-IRN-40`, a log entry in `docs/log-inbox/symbol-editor.md`, the Status of the prompt.

## 7. Risks and dependencies

- `authoring/` is a §3.1 row, not a sync-layer file: no `useJjomSync`, no D-layer write, no VersionFixer (rule 14 concerns `DV.tsx` and the default-view template, untouched). Nothing persisted changes shape: ON removes a key whose absence already reads editable; a persisted `true` keeps editing and reads ON, a persisted `false` keeps not editing and reads OFF.
- A user who set `true` before keeps it until the next click; after the click ON the key goes. `irHash` and the compile are untouched (the component is panel-only).
- The default viewpoint is not touched. The four demo scenes must be 0 px from `adb5d9731` (the probe's check).
- Parallel lane P-2026-10-02-1645 (`~/jjodel-w-labelname`, `irResolve.ts`): disjoint files.
- Decision id: `R-IRN-40`, assigned by the prompt; `command grep -c "R-IRN-39\|R-IRN-40" docs/decisions.md` at this tip returns 0 [M]. The trunk has moved to `cdec5e44d` since this branch was cut; the merge lane reconciles `docs/decisions.md` (a union file).

---

## 8. Phase 2 addendum (2026-10-02, same session)

Code `d8f2e61c3`, two files as §6, no deviation: `authoring/FieldSegmentEditor.tsx` (the toggle reads `editable !== false`, `applyValueEditable` exported, the doc comment updated) and the new `authoring/__tests__/fieldSegmentEditor.test.ts`. Questions 1 and 2 adopted with their `Recommended:` (RC-21): inline expression and an in-file mapper, no predicate module; the toggle never disabled.

- **Tests first** [M]. Before the change 5 of 12 failed (`applyValueEditable is not a function` ×3, the toggle reading OFF at rest, ON writing `true`) and 7 passed, the 7 that pin behaviour that must not move (the widget chip, the other kinds, the label, never disabled, nothing written on render, OFF writes `false`, the kind seed); after, 12 of 12. `FieldSegmentEditor` loads in the node bench, as §5 expected.
- **Mutation bench, 18 of 18 killed, none void, control green** [M]: the read (`=== true`, `!== true`, `!!editable`, constant true, constant false), the write (ON writes `true`, ON leaves `editable: undefined`, OFF writes nothing, OFF writes `true`, mapper inverted, toggle bypasses the mapper, toggle passes the inverse), the widget branch (draws a toggle, always the chip), a disabled toggle, the label wording, the kind gate, the `forKind('value')` seed. Each mutation applied in place and restored in `finally`; the file's hash after the bench equals the one before it. The probe is the gitignored `frontend/scripts/smoke/_tmp_segedit_bench.mjs`.
- **Gates** [M]: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npm run build` exit 0 with the chunk-size warning only; full `npm run test` 9 failed files, exactly the nine at-import files of §17, and 6508 of 6508 tests passed (load average 15 at the start); `check:docs` 4 of 4 passed (5 warnings, none from this lane's files); `check:addonly` clean.
- **Probe on 3092, light, 1600x1000, DPR 2** [M]. Scenario: class `Thing` with `title: EString` and `count: EInt`, one object (`title = hello`, `count = 3`), a user Structure view with an `attributes` compartment, row format `name`, literal ` = `, `value`, the value segment without `editable` (`keys: ["kind"]`). The Properties panel reaches the view through `DockManager.openView` and the Structure tab; the probe reopens it before each toggle click, because a double-click on the canvas selects the node and the panel stops showing the view.
  - **Base** (`FieldSegmentEditor.tsx` of `adb5d9731` swapped in, file restored by hash after), 7 of 7: the two value spans carry `ir-row__value--editable` and a double-click opens the input, **and the toggle reads OFF at rest** (`aria-checked="false"`): the bug, reproduced on the current code, as §5 of `CLAUDE.md` asks before a fix is built on a past session's description.
  - **Fix**, 22 of 22, `EXIT=0`: the four demo scenes (sm, petri, esm, flowB) 0 px from the base run (Jodie launcher masked, 525 px in both); the toggle reads ON at rest and opening the section writes nothing; double-click opens the input and Escape cancels; toggle OFF writes `editable: false` (`keys: ["kind","editable"]`), the two spans lose `ir-row__value--editable` (2 to 0) and a double-click opens nothing, per contrasto with the first; toggle ON again removes the key (`keys: ["kind"]`), the spans come back (2), a double-click opens the input, and an edit to `hello_edited` lands in the slot and in the canvas row.
  - The one page error, `failed to get project {project: null}`, is on the base run too.
  - Crops (`sips -Z 600`) in `frontend/scripts/smoke/_tmp_segedit_crops/` (gitignored): `se_before_structure_rest_600.png` (OFF), `se_after_structure_rest_600.png` (ON), `se_after_structure_off_600.png`, `se_after_structure_on_again_600.png`, and the two `structure_panel_600.png` of the whole tab, base and fix.
- **Environment.** Two early fix runs failed on the probe's own bug (after a canvas click the panel no longer shows the view; fixed in the probe by reopening the tab), the second one after 22 passes and before the last crop. Then three attempts died before any check or on a timeout: the first two on `Failed to fetch dynamically imported module .../Navbar.tsx` with load average 100 to 125, the dev server's log showing `Pre-transform error: The service was stopped` and `write EPIPE` (esbuild killed under load, a second lane's probe on 3171 running at the same time), and one on a 30 s screenshot timeout of the `esm` pane at load 52. A run at load 29 passed in full. The reds were the machine's, not the code's; no probe line was ignored.
- **Decision row** `R-IRN-40` in `docs/decisions.md`. Nothing for Alfonso on the recommended path.
