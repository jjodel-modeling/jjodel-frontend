# Discovery: Symbol Editor S6, `underline` axis and rule-driven `cornerRadius`

Prompt-ID: P-2026-09-21-1455 · Phase 1, read-only, hard stop on this report (P4)
Prompt: `docs/prompts/claude_2026-09-21_1455_prompt_symbol_editor_s6_underline_corner_rules.md`
Tree: `~/jjodel-release`, `alfonso-frontend-jjtl`, HEAD `c8098d50c` at start. Executor: Sonnet 5 (the trailer says so, P6; CLAUDE.md §0 names Opus 5, the `/model` switch of this chat overrode it).

## 1. Hypothesis under test and objective

The prompt carries four ratified decisions, to be confirmed against the code (D-S6-1..4). Each is a hypothesis:

- H1 (D-S6-1): `underline` is one more `AxisRow<boolean>` of `TextStyleEditor`, and nothing else is needed.
- H2 (D-S6-2): `cornerRadius` enters "the rules table" as a fourth axis beside color, width and style, in `borderOverrides.ts`, the row component and the panel.
- H3 (D-S6-3): the strip and the two thumbnails can resolve a rule-driven radius without changing `SymbolBoxPreview`'s props.
- H4 (D-S6-4): no `validateIR` change is needed.

Objective: answer (a) to (f) of the prompt with evidence, and scope Phase 2. Verdict up front:

| | Verdict |
|---|---|
| H1 | Holds for the row itself. Two findings the prompt did not foresee: the Symbol-text mount cannot honestly offer `Off` (section 4.2, measured on pixels), and the trigger summary is blind to `underline` (4.3). Both need a decision, and the second needs a file outside the DOVE list. |
| H2 | **Premise wrong as written.** The table the prompt calls "the rules table" is a read-back with no write path; the editable rules table is `ConditionalEditor` with `rulesTable`, one per axis. Two designs, sized in section 5.4. Alfonso decides (the prompt's own stop condition fires for the literal reading). |
| H3 | Holds. `SymbolBoxPreview` already takes `cornerRadius?: number`; the strip needs no prop change (section 6). |
| H4 | Holds, executed: `validateIR` accepts every form of `underline` (section 4.1). |

## 2. Preconditions (COME)

- `git worktree list`: `/Users/alfonso/jjodel-release  c8098d50c [alfonso-frontend-jjtl]`, plus `~/jjodel` on `validation-skeleton` and `~/jjodel-sim` on `simulation-engine`.
- No `MERGE_HEAD` in `~/jjodel/.git/worktrees/jjodel-release/` (`ls MERGE_HEAD`: "No such file"; the listing of the same directory shows `HEAD index logs ORIG_HEAD ...`, so the path is the right one). `git status --short` empty at start and at the end of the phase.
- `git log -3`: `c8098d50c` (15:14, the prompt commit) and `1387967a0` (14:49) carry session `019j6kW9…`, `68d299d83` (14:31) carries `01CsANn…`. This chat's own session id is not visible to me, so "a session id other than this chat's" cannot be checked mechanically. What can be said: the tip is 3 minutes older than the start of this session, the tree was clean, nothing else wrote to it during the phase.
- P14 symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules` created for the executed probes and removed before the commit. `git status` stayed empty with it in place (ignored).
- `~/.local/bin/node` v26.8.1 on the PATH.

## 3. Files read (whole, full paths)

Under `frontend/src/components/editor-v2/viewpoint/authoring/`: `TextStyleEditor.tsx`, `TextStyleField.tsx`, `borderOverrides.ts`, `previewInstances.ts`, `SymbolBoxPreview.tsx`, `SymbolEditorModal.tsx`, `VertexAuthoringPanel.tsx`; and `LabelEntryEditor.tsx`, `FieldCompartmentListEditor.tsx`, `RowAuthoringPanel.tsx` at the mount sites; tests `__tests__/symbolBoxPreview.test.ts`, `previewInstances.test.ts`, `borderOverrides.test.ts`.
Under `.../viewpoint/ir/`: `irTypes.ts` (89-100, 185-215, 636-645), `irCompile.ts` (285-330, 355-356), `IRNodeContent.tsx` (95-140, 415-430), `irDefaults.ts` (30-60), `irValidate.ts` (55-145), `shapeRegistry.ts` (440-520), `irStyle.ts` (grep by rule).
Under `frontend/src/components/ui/`: `ConditionalEditor/ConditionalEditor.tsx`, `ConditionalEditor/conditional.ts`, `Select/Select.tsx`. Also `frontend/vitest.config.ts`, `frontend/src/styles/components/_form-system.scss` (1025-1063).
Docs: `docs/decisions.md` (R-IRN-3, -30, -31, -35, -36), `docs/handoff/decisions-symbol-editor-1b.md` (D2, D5), `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` (7), `docs/discovery/discovery_2026-09-17_slice5_preview_instances.md` (5), `docs/PROTOCOL.md` (P4, P6), CLAUDE.md, `docs/claude-code-log.md` (top 12 entries), `docs/log-inbox/` listing.

## 4. Findings: the `underline` axis (COSA a, b)

### 4.1 (a) `setAxis`, the row, and what a boolean row needs

- `TextStyleEditor.tsx:40-47`:
  ```
  if (patch[k] === undefined) delete base[k];
  else (base as Record<string, unknown>)[k] = patch[k];
  ...
  return Object.keys(base).length === 0 ? undefined : base;
  ```
  Only `undefined` drops a key. `false` is kept. So `Default` (unset) drops `underline`, `Off` persists `underline: false`, and a style whose last axis is dropped collapses to `undefined` (the key `style` then disappears from the label).
- `AxisRow` (`:72-133`) is generic in `T`. Its two `??` chains keep `false`: `onChange(r.rules[0]?.then ?? r.default ?? axisDefault)` (`:92`) and `const base = (value as T | undefined) ?? axisDefault;` (`:94`). A boolean row needs nothing beyond a new `<AxisRow<boolean> ...>` block and an options constant. Grep for the names I would introduce, `command grep -rn` over `frontend/src`: `UNDERLINE_OPTIONS` 0, `BOOLEAN_OPTIONS` 0, `TEXT_STYLE_AXES` 0, `hideUnderline` 0; positive control on the same command, `resolveCompiledCornerRadius`, 25 hits. Free.
- Two adapters are unavoidable because `SelectOption.value` is `string` (`Select.tsx:7`): `bare === undefined ? '' : bare ? 'true' : 'false'` in, and `'' -> undefined`, `'true'/'false' -> boolean` out. `Select` always prepends `<option value="">{placeholder}</option>` (`Select.tsx:111`), also in the branch renderer; the existing branch renderers cast `e.target.value as X`, so picking the empty option would write `''`. For a boolean the branch handler must map `''` to a boolean explicitly. (Precedent for a boolean branch control: `LabelEntryEditor.tsx:84-90` uses `Toggle` in `renderValue`; D-S6-1 chose `Select`, both work.)
- `setAxis` is module-local (`function setAxis`, not exported). The vitest glob is `src/**/__tests__/**/*.test.ts` (`vitest.config.ts:14`, `.ts` only, `environment: 'node'`). `TextStyleEditor.tsx` loads under vitest (section 8), so the Phase 2 test needs either `export function setAxis` (an added export, nothing renamed) or `renderToStaticMarkup` from a `.ts` test through `React.createElement`. The first is smaller.
- Compile path: `irCompile.ts:313` `if (style.underline !== undefined) out.underline = compileConditional<boolean>(style.underline, false, deps);`. `IRNodeContent.tsx:137` `if (cs.underline) { const v = cs.underline(ctx, id); if (v) { s.textDecoration = 'underline'; s.textUnderlineOffset = '3px'; } }`. **`false` and absent render identically** (nothing emitted). `Off` is persisted intent, not a rendering override.
- **H4, executed** (probe, then removed): `validateIR` on the object default view with `labels[0].style.underline` set to `true`, `false`, `{when,then}`, `{rules,default:false}` and `{rules:[],default:false}`: all six `{"ok":true}`, also `shape.text.underline: false`. `compileView` on `underline: false` yields a function returning `false`. Why: `findUnknownPredicateOp` (`irValidate.ts:60-68`) is "Generic over the ir's JSON rather than a walk targeted per field", so no key list can be missing `underline`. D-S6-4 does not fire; `irValidate.ts` stays untouched.
- No test pins the `underline` compile: `command grep -n underline` over `ir/__tests__/ir.test.ts` gives only the comment at `:1392-1393`. Gap declared, out of the Phase 2 file list.

### 4.2 (b) Mount sites, and what an author sees

`TextStyleEditor` is never mounted directly: its only parent is `TextStyleField.tsx:181` (`<TextStyleEditor value onChange features featuresHint classNames />`), mounted at four sites (`command grep -rn "TextStyleField\|TextStyleEditor"` over `frontend/src`, exit 0, the rest are comments):

| Site | Edits | Label the author sees |
|---|---|---|
| `VertexAuthoringPanel.tsx:903` | `shape.text` | section "Symbol text", trigger "Style" |
| `LabelEntryEditor.tsx:94` (via `LabelListEditor.tsx:61,63`, `VertexAuthoringPanel.tsx:915`) | `label.style` | "Label #N" (`itemLabel`), trigger "Style". No object or class name reaches it. |
| `FieldCompartmentListEditor.tsx:268` | `comp.rowFormat.style` | "Row style" |
| `RowAuthoringPanel.tsx:453` | `draft.style` of a row view | section "Row style" |

No caller filters axes; `TextStyleEditorProps` (`:23-31`) has no axes prop. `EdgeAuthoringPanel.tsx` mounts none (edge label style is TS3 of the addendum, not wired). Badges have no text style editor.

**Cascade hazard at the Symbol-text mount (measured).** `IRNodeContent.tsx:427` applies `compiled.text` inline on the box root: `Object.assign(inlineStyle, resolveTextStyle(compiled.text, readCtx, objectId));`, with the comment "a label's own style, inline on its span, still wins". For `text-decoration` that is false: it propagates to in-flow descendants and a descendant cannot cancel it. Pixel measurement (headless Chromium 1234, macOS, structure of `.ir-node-content`: flex column, an in-flow `position: relative` label, an in-flow row, an absolutely positioned badge; the number is the longest run of dark pixels in one pixel row of the element's box; the unstyled case gives 8, glyph strokes only):

| Case | label | row | badge (abs) |
|---|---|---|---|
| no decoration | 8 | 8 | 7 |
| box `underline` | 69 | 62 | 7 |
| box `underline`, child `text-decoration: none` | **69** | 62 | 7 |
| child-only `underline` | 69 | 8 | 7 |

Positive control: the child-only row shows the underline where the "none" row shows none. So `shape.text.underline: true` underlines every label and every compartment row of the symbol (not the absolute badges), and neither `Off` on a label (which emits nothing anyway) nor `text-decoration: none` removes it. The help text under Symbol text (`VertexAuthoringPanel.tsx:910`) says "A label's own style overrides it."; for this axis that is untrue. This is the case the prompt anticipated as "a caller that must hide the axis". The fix would be one optional prop on `TextStyleEditor`, forwarded by `TextStyleField` (the only parent), passed by the Symbol-text mount: `TextStyleField.tsx` is not in DOVE.
Row style at compartment level (`IRNodeContent.tsx:586,601`) and at row level (`IRRow.tsx:28`) underline exactly what they style: no hazard there.

Question Q1 in section 9.

### 4.3 The trigger summary does not know `underline`

`TextStyleField.tsx:36-68` `summarizeTextStyle` lists font, size, weight, italic and color. `:37` `if (!style || Object.keys(style).length === 0) return { isDefault: true, segments: [] };`, `:68` `if (segments.length === 0 && !swatch) segments.push({ conditional: false, text: 'Custom' });`. Consequences once the row exists: a style whose only authored axis is `underline` reads "Custom"; the seeded object label (`irDefaults.ts:46`, `{ fontSize: 14, color: ..., underline: true }`) reads "14px" plus swatch and never mentions the underline; a conditional underline shows no lightning glyph. `Reset to default` (`:174`) is unaffected (it keys on `isDefault`, which counts keys).
One added segment (`Underline`, with the lightning glyph when conditional) would close it. `TextStyleField.tsx` is not in DOVE: Q2.

### 4.4 Seeds and popover

- `flip` on an unset row writes `{ when: { op: 'literal', value: true }, then: axisDefault }` (`:95`). With `axisDefault` `true` (D-S6-1) the flip underlines every instance until the author edits the predicate; the `else` toggle of `ConditionalEditor` seeds `else` with the same `axisDefault` (`ConditionalEditor.tsx:180`), so a new else branch reads `On` too and the author must set it to `Off`. One of the two seeds is always the pointless one for a boolean; `true` is the better of the two. Kept as D-S6-1 says, noted.
- A sixth row costs no SCSS: `.jj-textstyle-popover` has `overflow-y: auto` (`_form-system.scss:1028`), rows are generic (`.jj-textstyle-row`), `computePopoverStyle` caps the height. Header comment at `TextStyleEditor.tsx:137` ("Five always-visible rows") becomes stale; not touched by rule 8 unless Alfonso says.

## 5. Findings: the radius and "the rules table" (COSA c)

### 5.1 What exists

`borderOverrides.ts` whole (75 lines). Verbatim: `export const BORDER_AXES = ['color', 'width', 'style'] as const;` (`:23`), `export type BorderAxis = typeof BORDER_AXES[number];` (`:24`), `BorderOverrideRow { whenText: string; axes: BorderAxis[] }` (`:26-31`), `borderOverrideRows(border: VertexViewIR['shape']['border'])` (`:47-49`), `divergent` (`:71-73`).

Consumers of the three names, `command grep -rn` over `frontend/src` excluding tests, complete output: `borderOverrideRows` at `VertexAuthoringPanel.tsx:409` and `SymbolEditorModal.tsx:366`; `BORDER_AXES` at `previewInstances.ts:28,91,152`; `BorderAxis` and `BorderOverrideRow` nowhere outside `borderOverrides.ts`.

**There is no row component and no write path.** The rows are rendered inline at `VertexAuthoringPanel.tsx:771-799` as `WHEN | OVERRIDES` with one `jj-chip` per axis name (`:786-788`). It is a read-back of what the three border `ConditionalEditor`s wrote. The three editors (`:719-761`) are the actual rules tables, `ConditionalEditor` with `rulesTable={{ subjectName, valueNoun: 'border color' }}` and `allowConditional={advanced}`, writing through `patchBorderAxis` (`:431-439`, `delete nextBorder[axis]` on `undefined`). The Shape axis (`:634-644`) and Fill (`:693-703`) and Marker (`:830-840`) use the same editor and appear in no read-back.

The radius today (`:653-685`): a `NumberInput` inside a `Reset`/`default` block, `disabled={radiusIgnored || cornerRuleDriven}` (`:665`), the label `rule-driven` (`:670`), glyphs hidden when rule-driven (`:678`). It lives in the **Shape** section, i.e. under the nav entry **Symbol** (`sec('symbol')`, `:595`), not under Border. R-IRN-35: "S6 deve mettere il raggio nella tabella delle regole come ogni altro asse, quindi uno scalare sarebbe l'unico asse fuori dal meccanismo": "the mechanism" is the per-axis `rulesTable` editor, which form, fill, marker and the three border axes already use. The words "beside color, width and style" in D-S6-2 are the prompt's, not the decision's.

### 5.2 Facts the design must respect

- `ConditionalEditor` with `rulesTable` (`RulesModeEditor`, `ConditionalEditor.tsx:239-510`): mode `Fixed | Conditional` (plus `None` only with a `noneValue`). Fixed mode is `renderValue((value as T | undefined) ?? noneValue ?? defaultValue, writeScalar)` (`:405`): the displayed value is the fallback, **nothing is written until the control changes**, which is D2 for free. Entering Conditional writes `{rules: [], default: <current or defaultValue>}` (`:324-325`); leaving it writes the first rule's value, else the default, else `defaultValue` (`:317`). With no `noneValue`, `fromRules` returns the fallback, never `undefined` (`conditional.ts` `fromRules`), so the editor cannot ask for the key to be dropped.
- `renderValue` is called for the Fixed value, for every rule's `then` and for the `Otherwise` value. A closure that renders `default`/`Reset`/glyphs can tell the cases apart only through outer state (`cornerRuleDriven`), which the panel already computes (`:417`).
- Basic mode: `allowConditional={advanced}` false renders a plain `renderValue(value ?? defaultValue, onChange)` for a scalar and the chip `conditional (edit in Advanced mode)` for a conditional (`ConditionalEditor.tsx:102-111`). That chip replaces the disabled `rule-driven` stepper with no extra code.
- **Reset does not use `patchShape({ cornerRadius: undefined })`.** The prompt says "`patchShape({ cornerRadius })` keeps writing `undefined` on Reset". The code says otherwise: `resetCornerRadius` (`:448-451`) uses rest/spread, and the comment `:441-447` records the measured defect ("left the KEY in the ir holding `undefined`"). Phase 2 must keep `resetCornerRadius` as it is.
- `radiusIgnored` (`:478`, `!honorsCornerRadius(scalarForm)`) is `false` for a conditional form, by design.

### 5.3 Two designs

**Y, the radius as a peer rules axis (like form, fill, marker).** In the Shape block, replace the bare `NumberInput` by `<ConditionalEditor<number> rulesTable={{ subjectName: featureInfo.targetName ?? undefined, valueNoun: 'corner radius' }} allowConditional={advanced} defaultValue={baseCornerRadius(scalarForm)} value={shape.cornerRadius} onChange={...} renderValue={...}>`. `renderValue` renders today's stepper block (opacity when absent, `default` label, `Reset`, glyphs) when `!cornerRuleDriven`, and a plain `NumberInput min={0}` inside the rules. `onChange(undefined)` maps to `resetCornerRadius()` (never reached today, defensive), any other value to `patchShape({ cornerRadius: next })`. `rule-driven` label and disabled state go away, replaced by the table.
- Files: `VertexAuthoringPanel.tsx` only. No change to `borderOverrides.ts`, `BORDER_AXES`, `BorderOverrideRow`, the OVERRIDES table, the Border nav badge, `previewInstances.ts` border logic.
- Behaviour: absent or scalar, Basic or Advanced: pixel-identical to today (stepper, `default`, `Reset`, glyphs). Advanced adds the `Fixed | Conditional` switch. Conditional to Fixed writes a number (the first rule's value, else the default, else the base radius), so a `Reset` is one click away, not automatic.
- Nav: the Symbol entry keeps no badge. `badgeOf` (`SymbolEditorModal.tsx:363-368`) counts fill, marker and border only, and the Shape axis rules are uncounted already; adding radius alone would make the badge count one of two Symbol-section tables. Left as is, noted.
- Executable test: none for the panel change (it does not load under vitest, section 8): declared gap, no source-text test (CLAUDE.md §5).

**X, the radius also in the OVERRIDES read-back (literal D-S6-2).** `borderOverrideRows` must know a value that does not live on `shape.border`.
- `borderOverrides.ts`: a second optional parameter `cornerRadius?: Conditional<number>`. `BORDER_AXES` and `BorderAxis` are **not** widened: widening would type `border?.[axis]` wrongly and break `borderOverrides.test.ts:81` (`expect(rows[0].axes).toEqual([...BORDER_AXES])`, which writes three axes). The row needs to say "radius" somewhere: `axes: BorderAxis[]` cannot hold it without widening an exported type (rule 11: only optional additions), so either an optional `radius?: true` on `BorderOverrideRow` or a rule-11 exception for `axes: (BorderAxis | 'radius')[]`. Nothing outside the file reads the type, so the compile risk is nil.
- `divergent` when only the radius carries a predicate: `keysPerAxis` gets one entry (`:52,69`), `keysPerAxis.length > 1` is false, so `divergent` is `false`, same as a lone `width` axis (comment "One axis cannot disagree with itself", `borderOverrides.test.ts:54`). With the radius on predicate P and border color on Q it is `true` and the note "These axes override on different conditions, so each one is listed on its own row." (`VertexAuthoringPanel.tsx:794-796`) renders, generic enough to stay true.
- What a row shows for an axis with no value under a predicate: nothing. A row is a predicate and the subset of axes that carry a rule under it; an axis without one simply has no chip. There is no `—` cell and no value cell at all: the table never shows the `then` values, nor the `otherwise`.
- `when` ticket (`BorderOverrideRow` carries `whenText`, not `when`; accepted as a ticket on 2026-09-18, `docs/discovery/discovery_2026-09-17_slice5_preview_instances.md` §5, log entry of 2026-09-17): unchanged by X as a decision, worse as a cost. The predicate list is re-derived in `previewInstances.ts:88-101` (`borderRowPredicates`) and tied to the rows by one executed test (`previewInstances.test.ts:194-209`, fixture without a radius). With a fourth source there are two derivations to keep in lockstep and the fixture must gain a radius case. Adding the optional `when` would retire the duplicate, but that is a refactor across two files and a ticket of its own: not proposed here.
- Files X needs beyond `borderOverrides.ts` and the panel: `SymbolEditorModal.tsx:366` (`borderOverrideRows(ir.shape.border)` must receive the radius, else the badge count and the table drift, which is the failure `borderOverrides.ts:13-14` names), and `previewInstances.ts` (`borderRowPredicates` and the `anyConditional` test at `:152`, else the Border caption names a row the table does not show). Both are in DOVE but the prompt's own stop condition ("more than `borderOverrides.ts`, the row component and the panel") fires. And an editor that lives in Symbol while a `radius` chip shows in Border's OVERRIDES is an author who sees an override they cannot edit in that section: X only makes sense with the radius control moved into the Border section, which moves the D5 help text and glyphs and is a visible reorganisation the prompt does not ask for ("the scalar stepper stays").

Recommendation: **Y**, X as a separate slice if Alfonso wants the read-back to carry the radius. Q3 in section 9.

## 6. Findings: the preview (COSA d)

- The strip: `SymbolEditorModal.tsx:521-532` passes `cornerRadius={cornerRadius}` to every tile, the modal-wide `authoredCornerRadius(ir.shape.cornerRadius)` of `:341` (`undefined` for a non-number, `shapeRegistry.ts:446-448`). `SymbolBoxPreview.tsx:85-89` already declares `cornerRadius?: number` "Authored `ShapeSpec.cornerRadius`, px", and `:143-147` passes it through `resolveCornerRadius(v.form, cornerRadius, box)`, whose first line is `const r = authoredCornerRadius(authored);` (`shapeRegistry.ts:492`): the guard is already inside. So a per-tile value needs **no prop change**: `cornerRadius={t.cornerRadius}` with one new resolved field. `SymbolBoxPreview.tsx` is not touched.
- `instanceAxesPreset` (`SymbolEditorModal.tsx:175-188`) builds `values: { form, border, marker, fill }`: the radius is not a preset axis (`SymbolBoxPreview.tsx:84-89`), so it keeps travelling beside the preset.
- `resolvePreviewInstances` (`previewInstances.ts:174-193`) resolves `form`, `fill`, the three border axes and `marker` through `resolveConditional` (`:70-75`), which reads `matchIndexOf` and `toRules(c).default`, the same rule order as the canvas. The radius is one more line there: `cornerRadius: authoredCornerRadius(resolveConditional<number>(shape.cornerRadius, ctx, id))`, guarded like the canvas (`resolveCompiledCornerRadius`, `shapeRegistry.ts:513-519`, `authoredCornerRadius(compiled.cornerRadius(ctx, elementId))`), `undefined` when absent (`irCompile.ts:355-356` compiles it with fallback `undefined`, never 0). `ResolvedPreviewInstance` (`:49-58`) gains `readonly cornerRadius?: number`: an added optional property, rule 11 allows it. Name grep: no `cornerRadius` in `previewInstances.ts` today, `thumbnailCornerRadius` 0 hits (section 4.1, same control).
- The thumbnails (`SymbolEditorModal.tsx:451`, `:538`) take `SymbolPreview.cornerRadius?: number` (`SymbolPreview.tsx:99`, guarded at `:104`). The three cases of D-S6-3 are one expression: `authoredCornerRadius(toRules(shape.cornerRadius).default)`: `toRules(8).default` is `8` (scalar becomes `default`, `conditional.ts` `toRules`), `{rules, default}` and `{when, then, else}` give the `otherwise`/`else`, absent gives no `default`. It is the idiom `currentAxesPreset` already uses for the form (`:152`, `toRules(shape.form).default ?? 'rect'`). It must live in a module that loads under vitest, because `SymbolEditorModal.tsx` does not (section 8): `previewInstances.ts`, which is in DOVE.
- Captions: `axisOfSection` (`previewInstances.ts:109-117`) knows form, fill, marker; the Symbol section caption stays the form's. No caption for the radius under Y; not requested.

## 7. Existing tests (COSA f)

Positive control for every grep below: `borderOverrides.test.ts` hits on `BORDER_AXES`.

- `borderOverrides.test.ts` (142 lines): pins `BORDER_AXES` order (`:81`), `divergent`, the three spellings. **Unchanged under Y. Under X** `:81` stays green only if `BORDER_AXES` is not widened, and a radius case is added.
- `previewInstances.test.ts` (255 lines): `resolvePreviewInstances` uses `toMatchObject` (`:225`), `toBeUndefined` per axis (`:242-250`), `toEqual([])` for no instance (`:253`): **adding a field breaks none**. The equivalence test `:194-209` stays under Y; X adds a radius fixture there.
- `symbolBoxPreview.test.ts` (54 lines): `fitScale` and `captionForBox` only, no radius assertion; **stays**, `SymbolBoxPreview.tsx` is not changed.
- `formAuthoring.test.ts` (516 lines): the prompt lists it; `command grep -n "cornerRadius\|underline\|setAxis\|TextStyleEditor"` over it: no match. It covers the Form tab (`rowsForMetaclass`, `deriveAuthoringWidget`, `offeredOverrides`), not this area. Not affected.
- `ir/__tests__/shapeRegistry.test.ts:683-` (`resolveCompiledCornerRadius`), `irValidate.test.ts:225-293` (literal radius guard, negative radius), `ir.test.ts:138-209` (conditional radius compile, `0` distinct from absent): **stay**, none of the touched code changes what they pin.
- No test exists for `TextStyleEditor`, `setAxis`, the `underline` compile, `TextStyleField.summarizeTextStyle`, `previewInstances` with a radius.

Full baseline, this tree, this session (P14 symlink, node v26.8.1): `npx vitest run`: see section 10.

## 8. Which modules load under vitest (COSA e)

Probe: one temporary test file dynamically importing each module inside `try/catch`, result appended to a file (a first attempt through `console.log` printed nothing under the filter and was discarded); the file was removed, `git status` empty afterwards.

| Module | Loads |
|---|---|
| `authoring/TextStyleEditor.tsx` | yes |
| `authoring/TextStyleField.tsx` | yes |
| `authoring/previewInstances.ts` | yes |
| `authoring/SymbolBoxPreview.tsx` | yes |
| `authoring/SymbolPreview.tsx` | yes |
| `authoring/borderOverrides.ts` | yes |
| `ir/shapeRegistry.ts` | yes |
| `ui/ConditionalEditor/ConditionalEditor.tsx`, `conditional.ts` | yes |
| `authoring/VertexAuthoringPanel.tsx` | **no**, `ReferenceError: window is not defined` |
| `authoring/SymbolEditorModal.tsx` | **no**, same |
| `ir/IRNodeContent.tsx` | **no**, same |

The two "no" rows agree with the prompt and the log (known, 21/9) and serve as the negative control of the probe. Phase 2 test plan is set by this table: `TextStyleEditor` (export `setAxis` or render to markup), `previewInstances` (the per-instance radius and the thumbnail function), `borderOverrides` only under X. The panel and the modal have no executable test; the gap is declared in the log entry, no source-text test fills it.

## 9. Open questions for Alfonso

- **Q1. Symbol text and `Off`.** The Symbol-text underline cannot be undone by any label (section 4.2). Options: (A) hide the `Underline` row at that mount through one optional prop on `TextStyleEditor`, forwarded by `TextStyleField`, passed by the panel (3 code files, `TextStyleField.tsx` outside DOVE); (B) show it there and fix the help text at `VertexAuthoringPanel.tsx:910`; (C) show it, say nothing. Recommendation: **A**. `IRNodeContent` is out of DOVE and cannot make `Off` real without a layout trick.
- **Q2. `TextStyleField.tsx`, out of DOVE.** Add an `Underline` segment to the trigger summary (and the pass-through prop of Q1). Recommendation: **yes**, one file, both needs. Without it an underline-only style reads "Custom".
- **Q3. Radius: Y or X.** Recommendation **Y** (one file, no change to the border derivations, the disabled stepper goes away, D2 states unchanged). X (four files, radius chip in the Border read-back) only together with moving the radius control to Border, which the prompt does not ask for.
- **Q4. Symbol nav badge** for radius rules under Y: none (recommended), or count form and radius rules together.
- **Q5. Citations in the prompt to correct in the log entry, not in code.** "R-IRN-3 (authoring signals an ignored axis)": R-IRN-3 (`decisions.md:717`) is the placeholder for unrecognised custom views; the ignored-axis warning is in R-IRN-31 (`decisions.md:1144`, "l'avviso in authoring per questo caso resta dovuto (S5, non implementato in questo giro)"), owed to S5 and, for the radius, already present as `radiusIgnored` help text (`VertexAuthoringPanel.tsx:681-683`). "Addendum §7 (seed of new views versus default of saved views)": §7 is "Persistenza e migration", additive, no `VersionFixer`; the seed-versus-saved-view wording is not in it.

## 9b. Proposed Phase 2, if Q1 A, Q2 yes, Q3 Y, Q4 none

Three commits, one lane, code only, docs entry after the visual GO (P13):
1. `feat(ir-authoring): underline axis in TextStyleEditor (S6, D-S6-1)`: `TextStyleEditor.tsx` (`UNDERLINE_OPTIONS`, the row after `Style`, `export` on `setAxis`, optional prop for Q1), `TextStyleField.tsx` (summary segment, prop pass-through), `VertexAuthoringPanel.tsx` (one line at the Symbol-text mount), new `authoring/__tests__/textStyleEditor.test.ts`. 3 code files plus the test, under rule 19 (5), all named here; `TextStyleField.tsx` is the one outside DOVE.
2. `feat(ir-authoring): corner radius as a rules axis (S6, D-S6-2)`: `VertexAuthoringPanel.tsx` only.
3. `feat(ir-authoring): preview resolves a rule-driven corner radius (S6, D-S6-3)`: `previewInstances.ts` (field, one guard, `thumbnailCornerRadius`), `SymbolEditorModal.tsx` (`:341`, `:451`, `:528`, `:538`), tests in `previewInstances.test.ts`.
Mutants to run per new test, planned not run: drop the guard `!== undefined` to a falsy check in `setAxis` (dies on `underline: false` kept); drop the collapse (dies on the `undefined` case); resolve the radius from `default` only (dies on two instances with different radii); `?? 0` on absent (dies on absent stays `undefined`); drop `authoredCornerRadius` (dies on a negative scalar); thumbnail takes `rules[0].then` instead of `default` (dies on the three-case table); thumbnail returns `0` for absent.
Visual check as in the prompt, plus two items this report adds: the Symbol-text mount shows no `Underline` row (Q1 A) and a label underline set to `On` reads `Underline` in the trigger; and a rules table on the radius shows its rows in the panel and two different radii in the strip.

## 10. Baselines and method

- `npx vitest run` from `frontend/`, node v26.8.1, while `npm run typecheck` ran at the same time: **10 failed files, 168 passed (178); 1 failed test, 3961 passed (3962)**. Nine files red at import, the trunk's known set: `jjscript/__tests__/context-binding`, `jjtl/__tests__/{abstract-target,ai-prompt-sanitization,circular-refs,executor-bridge,executor-llayer,forall-mapping,source-alias}`, `utils/__tests__/UDComparator`. The tenth is `services/__tests__/AIProviderService.test.ts`, one test "sends the configured model after selecting the Custom registry entry" timing out at 5000ms (`Duration 155s`, CPU shared with `tsc`). Re-run alone afterwards, tsc finished: 1 file, **7 of 7 passed**, exit 0. So the baseline is the log's 3962 passed, 0 failed, with the nine files red at import, reconstructed from two runs; a single clean full run was not repeated.
- `npm run typecheck` (`tsc --noEmit`), complete output, **exit 2, 14 errors**, none in the six files of this lane: `api/data.ts` 3, `common/Dummy.ts` 1, `EditorV2.tsx` 1, `forEndUser/Measurable.tsx` 6, `Jodie/ChatMessages.tsx` 1, `project/ProjectEditor.tsx` 1, `pages/components/Dashboard.tsx` 1. That is the "14 scattered" set of CLAUDE.md §17 without the 19 casing errors, the trunk's 14 of the merge entry. (The prompt says 33 on macOS; this tree measured 14.) `npm run build` not run: Phase 1 changes no source.
- Scripts and raw logs of the probes (import probe, `validateIR`/`compileView` probe, pixel probe of the decoration cascade) were run from the session scratchpad and are not committed; every temporary test file was removed and `git status --short` was empty afterwards, with and without the symlink.
- Method note for §5 of CLAUDE.md: the pixel probe measures painted pixels (longest dark run per pixel row), not computed style, because computed `text-decoration` on the child reads `none` while the ancestor's line is painted across it.

Phase 2 gates therefore start from: typecheck 14, vitest 3962 passed and 0 failed with nine files red at import, and every new test adds to 3962.
