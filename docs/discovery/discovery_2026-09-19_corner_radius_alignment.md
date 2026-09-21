# Discovery: pre-merge alignment of corner radius on `validation-skeleton` (R-IRN-35)

Prompt-ID: P-2026-09-19-1730 (Phase 1, read-only)
Branch `validation-skeleton` at `db43981fd`. Trunk `alfonso-frontend-jjtl` at `1b55d91bf`. Merge-base `4275c5850`.
Trunk side read with `git show alfonso-frontend-jjtl:<path>`; nothing checked out. Frontend paths below are relative to `frontend/src/components/editor-v2/viewpoint/`.

## 1. Hypotheses being falsified

- H1. `Conditional<T>` / `CompiledConditional<T>` differ between the two refs, so the trunk's compile path cannot be mirrored as is.
- H2. Moving `ShapeSpec.cornerRadius` to the trunk's type and position, with the trunk's compile lines, makes the auto-merge of the three IR files free of silent semantic clashes.
- H3. The scalar readers (`authoredCornerRadius` and the four authoring sites) need edits to keep reading a literal radius.
- H4. `irValidate` can keep its numeric guard unchanged once the type is `Conditional<number>`.
- H5. The new render contract can be pinned by executing `IRNodeContent`.

## 2. Files read (full paths)

Branch and trunk, both refs: `ir/irTypes.ts`, `ir/irCompile.ts`, `ir/IRNodeContent.tsx`, `ir/irValidate.ts`, `ir/shapeRegistry.ts` (trunk side by grep only: it has no corner code), `ir/irDefaults.ts` (trunk, for the seed).
Branch only: `authoring/SymbolEditorModal.tsx`, `authoring/SymbolPreview.tsx`, `authoring/SymbolBoxPreview.tsx`, `authoring/VertexAuthoringPanel.tsx`, `authoring/borderOverrides.ts`, `authoring/previewInstances.ts`, `../../ui/ConditionalEditor/conditional.ts` (`frontend/src/components/ui/ConditionalEditor/conditional.ts`), `../../components/DynamicHandles.tsx` (comment only).
Tests: `ir/__tests__/shapeRegistry.test.ts`, `ir/__tests__/irValidate.test.ts`, `ir/__tests__/symbolRecognition.test.ts`, `ir/__tests__/ir.test.ts`.
Docs: `docs/decisions.md` R-IRN-35 and R-IRN-36 (trunk), `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` section 5.6 (trunk), `docs/handoff/decisions-symbol-editor-1b.md` (existence only), `docs/PROTOCOL.md` P6 and P13.
Commits `400095370`, `6ee6efcd5`, `7f16439ff` exist (all 2026-09-19); `400095370` and `6ee6efcd5` are on the trunk only.

## 3. Baselines measured on this branch (full output, exit recorded)

- `npm run typecheck` (from `frontend/`): exit 2, **33** `error TS` lines, the declared baseline: TS1261 x12, TS1149 x7, and 14 scattered (`api/data.ts` 3, `Measurable.tsx` 6, `Dummy.ts`, `EditorV2.tsx`, `ChatMessages.tsx`, `ProjectEditor.tsx`, `Dashboard.tsx`; the 19 casing errors are the `settings/` and `Settings/` files). Errors under `viewpoint/ir/` or `viewpoint/authoring/`: **0**. Control `Measurable`: 6.
- `npx vitest run` (from `frontend/`): exit 1, **3900 passed, 0 failed**, `9 failed | 166 passed (175)` files, the 9 red at import as before (same figures as the log entry of P-2026-09-19-1610).
- The unquoted `--include=*.test.ts` glob failed in zsh (`no matches found`, exit 1) on the first attempt; re-run quoted, with non-empty output. Recorded because that silence looked like "no tests".

## 4. Findings

### 4.1 `Conditional<T>` and `CompiledConditional<T>`: identical (H1 falsified)

Branch `ir/irTypes.ts:50-53`, trunk `ir/irTypes.ts:50-53`, identical (checked with `diff`); a `diff` of lines 28-70 on both refs differs only in the `ShapeForm` union (branch adds `'cloud'`).

```
export type Conditional<T> =
    | T
    | { when: Predicate; then: T; else?: T }
    | { rules: { when: Predicate; then: T }[]; default?: T };
```

`CompiledConditional<T> = (ctx: ReadCtx, elementId: string) => T` at branch `:791`, trunk `:749`, same text. `compileConditional` (branch `irCompile.ts:244-262`, trunk `:244-262`) is identical (checked with `diff` on both ranges), including the fallback rule for `when` and `rules`.

### 4.2 The trunk's three code sites to mirror (exact text)

`ir/irTypes.ts:158-168` and `:731-733` (trunk):
```
    border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' | 'double' };
    /** Corner radius in px (ir-1.3 addendum, asse raggio). Sibling of `border`, ... */
    cornerRadius?: Conditional<number>;
...
    /** Compiled corner radius in px; undefined-returning function or null mean "no
     *  override" (see ShapeSpec.cornerRadius) — kept distinct from 0, a legitimate
     *  authored value (square corner). */
    cornerRadius: CompiledConditional<number | undefined> | null;
```
`ir/irCompile.ts:313-315` and `:431` (trunk):
```
    const cornerRadius = ir.shape.cornerRadius !== undefined
        ? compileConditional<number | undefined>(ir.shape.cornerRadius, undefined, deps)
        : null;
...
        border,
        cornerRadius,
```
`ir/IRNodeContent.tsx:347-350` (trunk):
```
    if (!svgPainter && form !== 'ellipse' && form !== 'circle' && form !== 'stadium') {
        const cr = compiled.cornerRadius ? compiled.cornerRadius(readCtx, objectId) : undefined;
        if (cr !== undefined) inlineStyle.borderRadius = `${cr}px`;
    }
```
The trunk applies `${cr}px` with no validation and no clamp; the branch's `resolveCornerRadius` validates through `authoredCornerRadius` and clamps.

### 4.3 Branch shape today

`ir/irTypes.ts:152` `ShapeSpec`; `border` per axis at `:169-173`; `padding` after `marker`; `cornerRadius?: number` at `:210`, after `padding`, doc block "Scalar like `padding`, never Conditional" (D5). `CompiledView` at `:733`; border axes `borderColor/borderWidth/borderStyle` at `:773-775`; no `cornerRadius` field (the renderer reads the source IR).

Every read site of the scalar on the branch (`git grep -n -i cornerRadius`, non-test):

| site | line | reads |
|---|---|---|
| `ir/IRNodeContent.tsx` | `:23` import, `:399` `authoredCornerRadius((compiled.ir as NodeViewIR).shape?.cornerRadius)`, `:400` `needsCornerBox`, `:402` `resolveCornerRadius(form, authoredRadius, cornerBox)` | source IR, not compiled |
| `ir/irValidate.ts` | `:132-139` | `authoredCornerRadius(cornerRadius) === undefined` rejects |
| `ir/shapeRegistry.ts` | `:424-500` | `honorsCornerRadius` (435), `authoredCornerRadius` (445, takes `unknown`), `baseCornerRadius` (455), `clampCornerRadius` (466), `resolveCornerRadius` (490, takes `unknown`) |
| `authoring/SymbolEditorModal.tsx` | `:341` `authoredCornerRadius(ir.shape.cornerRadius)`; passed to `SymbolPreview` (`:451`, `:538`) and `SymbolBoxPreview` (`:528`) as `number \| undefined` | |
| `authoring/SymbolPreview.tsx` | `:104` `authoredCornerRadius(cornerRadius)` on a prop | prop is already a number |
| `authoring/SymbolBoxPreview.tsx` | `:143` `resolveCornerRadius(v.form, cornerRadius, ...)` on a prop | prop is already a number |
| `authoring/VertexAuthoringPanel.tsx` | `:413` read; `:445` reset; `:659-672` stepper; `:662` `patchShape({ cornerRadius: r })` | |
| `components/DynamicHandles.tsx` | `:355` TODO comment only | see risk R3 |

### 4.4 The scalar readers already accept the literal form (H3 mostly falsified)

`authoredCornerRadius(value: unknown)` and `resolveCornerRadius(form, authored: unknown, box)` take `unknown`; for a plain number of a `Conditional<number>` the runtime value is that number, so `authoredCornerRadius(8) === 8` and every reader behaves as before without an edit. `SymbolPreview` and `SymbolBoxPreview` receive already-narrowed props from the modal. The type change flows through `unknown` parameters: no expected typecheck error from these four files. **Not verified by a run: it is the expectation the Phase 2 typecheck will test.**
For a rule-driven value (`{when,...}` or `{rules,...}`), `authoredCornerRadius` answers `undefined`: the readers see "absent" and draw the base radius.

### 4.5 `irValidate` would reject a valid conditional radius (H4 confirmed)

`ir/irValidate.ts:132-139`:
```
const cornerRadius: unknown = (ir as NodeViewIR).shape?.cornerRadius;
if (cornerRadius !== undefined && authoredCornerRadius(cornerRadius) === undefined) {
    ... error: `[ir] shape.cornerRadius must be a finite number >= 0 (px), ...`
```
An object conditional gives `authoredCornerRadius(obj) === undefined` and is rejected, and the authoring panel gates every commit on `validateIR`. The border axes have no value guard at all: grep of `irValidate.ts` for `border` returns nothing; they are covered only by `findUnknownPredicateOp` (`:76-94`, a recursive walk of the whole IR, which already covers a `when` inside `cornerRadius`) and by the compile-as-validator (`:188-194`). "As it validates the border axes" therefore means: skip the value guard for the object forms, keep it for the literal.
Discriminator: `isConditionalValue` in `components/ui/ConditionalEditor/conditional.ts:13`, pure (types-only import). Precedent for an `ir/` file importing from `ui`: `ir/IRForm.tsx:46`.

### 4.6 How the border axes (D1) are compiled, resolved and shown

- Compile: three `compileConditional` calls, `ir/irCompile.ts:344-349`, fallbacks `''`, `1`, `'solid'`, `null` when the axis is absent; returned at `:464-466`.
- Resolve: per instance, `ir/IRNodeContent.tsx:385-388`.
- Authoring, rule-driven: `VertexAuthoringPanel.tsx:407-408` reads a scalar only with a `typeof` guard (`borderStyleScalar`, `borderWidthScalar`); each axis is a `ConditionalEditor` (`:711-755`) that shows the rules table and cannot overwrite the rules from a scalar control; `borderOverrideRows` (`authoring/borderOverrides.ts:53`) reads the rules back in an OVERRIDES table (`:766-793`).
- Symbol modal, static strip: `SymbolEditorModal.tsx:146-162` `currentAxesPreset` takes the border "scalar or omitted" (`:157-159`), so a conditional axis is left out and the strip shows the baseline. Per-instance tiles: `previewInstances.ts:186-188` resolves each axis with `resolveConditional` (`:70-75`) into `ResolvedPreviewInstance` (`:53-55`), and `SymbolEditorModal.tsx:175-186` builds the tile preset from those.

Where a radius follows this pattern with zero edits: the static strip and `SymbolPreview` (a rule-driven radius reads as absent, the strip shows the base). Where it does not:

- The stepper (`VertexAuthoringPanel.tsx:657-672`) for a rule-driven radius shows the base value and the word `default`, and `onChange` (`:662`) replaces the whole conditional with a scalar: **touching it discards the rules silently**. The border axes cannot do this. Reachable only for a value written outside the panel (JSON, AI, import) until S6.
- The tiles (`SymbolEditorModal.tsx:528`) pass the same scalar `cornerRadius` to every tile; the border pattern resolves per instance in `previewInstances.ts`, a file outside the DOVE list.

### 4.7 Existing tests on corner radius

- `ir/__tests__/shapeRegistry.test.ts:521` `describe('shapeRegistry: raggio degli spigoli')`, tests `:587-680`: honoring set, absent/invalid draws nothing, ignoring forms, `0` is a value on CSS forms, clamp `min(w,h)/4`, polygons without box stay sharp, `roundedPolygonPath` literals. The header (`:516-518`) states the reason for the design: `IRNodeContent` is not importable in the bench (`joiner`), so the decisions are executed in `resolveCornerRadius` and `roundedPolygonPath`.
- `ir/__tests__/irValidate.test.ts:225-268` numeric guard (absent accepted, `NaN`, negatives, strings rejected, `graphVertex`).
- `ir/__tests__/symbolRecognition.test.ts:47-51` radius is not a recognition axis, preserved by `applyPresetToShape`.
- `ir/__tests__/ir.test.ts`: **0** corner-radius tests on the branch. On the trunk the single hit is a comment (`:1156`); the trunk has no corner test either.
- Model for the new compile tests: `ir.test.ts:107-133`, "compiles the three border axes one by one, per instance (slice 2, D1)", using `world()` (`:31`) and `vertexIR` (`:57`): `s1` is a `State`, `s2` a `FinalState` (`isKind` rule discriminates them).
- Bench limit, measured by grep: `IRNodeContent` is imported by no test (`react-dom/server` is used once, `symbolCatalogPopover.test.ts`, on a component that does not pass through `joiner`). The renderer wiring of the new field cannot be executed in the bench (H5 falsified).

### 4.8 The auto-merge today and after the planned edit (measured, scratch copies only, no repo file touched)

`git merge-file -p <branch> <merge-base> <trunk>` per file, and `git merge-tree --write-tree --name-only`:

Today: `irTypes.ts` 1 conflict, `irCompile.ts` 2, `IRNodeContent.tsx` 1 (the same four hunks the gate report counts, section 5.6). The conflict hunks are the border rewrites. **The auto-merge of `irTypes.ts` also holds two `cornerRadius` declarations in `ShapeSpec` with no conflict marker**, `Conditional<number>` (merged line 184, trunk) and `number` (line 221, branch): a duplicate property in one interface body.

Dry run of the planned edit (candidate = branch file with the declaration moved to the trunk's position right after the `border` block, the trunk's `CompiledView` field after `borderStyle`, the trunk's compile lines):

| file | result |
|---|---|
| `irCompile.ts` | 2 conflicts, both the border hunks (branch axes vs the trunk's `const border = ...` / `border,`); `const cornerRadius` x1, shorthand x1 in the output: the trunk's corner lines and the branch's are deduplicated by git. |
| `irTypes.ts`, `CompiledView` | 1 conflict, the border hunk (branch three axes vs trunk `border: {...} \| null`); `cornerRadius: CompiledConditional...` x1. |
| `irTypes.ts`, `ShapeSpec` | **no conflict, and two `cornerRadius?: Conditional<number>` declarations in the output**, both with the doc verbatim from the trunk (variant A) and with a rewritten doc (variant B). The branch rewrites the `border` line that the trunk inserts after, so the two insertions are different hunks to git: both are applied. |
| `IRNodeContent.tsx` | 1 conflict, the same region (border axes + corner block on the branch; `b = compiled.border`, the corner `if`, and `separatorColorStyle` on the trunk). After the merge `separatorColorStyle` is still defined only inside the trunk side and used at merged lines 601 and 616 outside the hunk: R-IRN-36 rebuild, the merge lane's job. |

So the target "every remaining hunk is a take-branch hunk" is reachable: every conflict hunk left is a take-branch hunk (border axes, and the render region). It does **not** remove the duplicate in `ShapeSpec`: no position or doc I tried makes git see one hunk, because the branch's own `border` rewrite sits directly above the trunk's insertion point. With both declarations now `Conditional<number>` the clash is identical-type, but it stays a duplicate property in one interface body (TS2300), found by `npm run typecheck` on the merged tree and not by `merge-tree`. Fix on the merge side: delete one of the two blocks (keep the one with the R-IRN-35 doc). No decision involved.

## 5. Proposed Phase 2 edits (for GO)

1. `ir/irTypes.ts`: `ShapeSpec.cornerRadius?: Conditional<number>` moved to sit right after `border` (trunk's position), its doc rewritten for R-IRN-35 (the trunk's doc says "ignored on SVG-painted shapes", which R-IRN-35 narrows to shapes without corners); `CompiledView.cornerRadius: CompiledConditional<number | undefined> | null` right after `borderStyle`, trunk's doc verbatim.
2. `ir/irCompile.ts`: the trunk's `const cornerRadius` block after `borderStyle`; `cornerRadius,` in the return after `borderStyle,`.
3. `ir/IRNodeContent.tsx`: `const cornerRadiusV = compiled.cornerRadius ? compiled.cornerRadius(readCtx, objectId) : undefined;` then `authoredCornerRadius(cornerRadiusV)` in place of the source-IR read; `NodeViewIR` leaves the type import if no other use remains (line 399 is the only one). Polygon path, clamp, `needsCornerBox`, absent-is-not-zero untouched.
4. `ir/irValidate.ts`: the numeric guard runs only when the value is not a conditional object; the conditional form is left to `findUnknownPredicateOp` and the compile, as for the border axes.
5. `ir/shapeRegistry.ts` and the four authoring files: **no edit expected** (4.4); the typecheck decides.
6. Tests: in `ir/__tests__/ir.test.ts`, modelled on `:107-133`: literal `8` compiles to a resolved 8 and `resolveCornerRadius` on `rect` gives `{kind:'css', px: 8}` and on `diamond` gives `{kind:'path', r: 8, ...}`; absent compiles to `null` and resolves to `{kind:'none'}` (base radius); one rule per instance (`isKind FinalState` -> 12, default 4) resolves 12 on `s2` and 4 on `s1`; `0` compiles to a resolved 0, distinct from `null`, and `resolveCornerRadius('rect', 0, ...)` gives `{kind:'css', px: 0}`. In `irValidate.test.ts`: a conditional radius (with `when`/`rules`) validates `ok`, a literal `-1` still fails. Each one run against the pre-change code, failing run shown in the report. Expected failure modes on the pre-change code: `cv.cornerRadius` is `undefined` (TypeError on the call, `toBeNull` fails); `validateIR` on the conditional returns `ok:false`.

## 6. Risks

- R1. Silent duplicate of `ShapeSpec.cornerRadius` in the merged `irTypes.ts` (4.8). The lane cannot prevent it; it must be in the merge lane's checklist.
- R2. Data loss path in the panel: a rule-driven radius under the stepper is overwritten by a scalar on first touch (4.6). Unreachable through the panel today.
- R3. `DynamicHandles.tsx:355` says: "Revisit if the radius outgrows the clamp or becomes Conditional." The second trigger fires with this lane. The handle inset profile ignores the radius; D5 accepts up to 12px and the clamp bounds it at `min(w, h) / 4`. Per-instance radii mean the same view can place handles on rounded polygons at different offsets. Out of scope (file not in DOVE); a ticket.
- R4. The compile now extends `dependencySet` with the predicates of a conditional radius (through `compileConditional`), which is the intent (per-instance re-render); a scalar added none. The compile cache is keyed on the hash of the whole IR, so a rule edit recompiles.
- R5. The trunk seeds `cornerRadius: 8` (`ir/irDefaults.ts:40`, trunk only). After the merge the default object view draws 8px through the branch's paint path (10px base on `rounded` becomes 8px), the same as the trunk today. R-IRN-35 keeps the seed as is.
- R6. Renderer wiring of `compiled.cornerRadius` cannot be executed in the bench (4.7). A mutation that leaves the renderer reading the source IR is not killed by any test; declared gap (CLAUDE.md section 5), the remaining check is the typecheck plus Alfonso's visual check on the merged tree.
- R7. Session model: the P6 `Model:` trailer records the executor named by the session banner. This session runs as Claude Sonnet 5; `CLAUDE.md` section 0 declares Opus 5 at xhigh. The trailer will say Sonnet 5.

## 7. Open questions (answers change what Phase 2 does)

- Q1. **Authoring surface for a rule-driven radius.** A) nothing: the stepper stays live and shows `default`, the strip shows the base (matches the D1 static strip, zero edits, keeps R2). B) a guard in `VertexAuthoringPanel.tsx` only: stepper `disabled` and the word `rule-driven` instead of `default` when the value is a conditional object, a few lines at `:413` and `:657-672`, no new control (recommended: it removes R2 and adds no control; it is the only "UI" in the lane). C) B plus per-instance radius on the preview tiles, which adds `previewInstances.ts` and `SymbolEditorModal.tsx:528` to the scope.
- Q2. **Renderer wiring test.** Accept the declared gap (R6, recommended), or add a small pure helper in `shapeRegistry.ts` that reads the resolved radius from a compiled view so the wiring is executable in the bench (one new exported identifier, and the renderer line no longer mirrors the trunk's text).

No conflict hunk needs a decision (4.8). Nothing else blocks Phase 2.

## 8. Addendum, Phase 2 (GO of 2026-09-19): what was done and what the merge looks like now

Answers to the open questions: Q1 option B (stepper disabled, label `rule-driven`, `previewInstances.ts` out of scope); Q2 a pure helper in `shapeRegistry.ts`, `resolveCompiledCornerRadius`, called by `IRNodeContent`. Commit type asked (P6) and answered: `feat(ir)`.

Code commit `f5ec4b5fe`, 9 files: `ir/irTypes.ts` (declaration moved after `border`, doc rewritten for R-IRN-35, `CompiledView.cornerRadius` after `borderStyle`), `ir/irCompile.ts` (the trunk's compile lines, `cornerRadius` in the return), `ir/shapeRegistry.ts` (the helper, two type imports), `ir/IRNodeContent.tsx` (calls the helper, `authoredCornerRadius` and `NodeViewIR` leave the imports), `ir/irValidate.ts` (numeric guard only when `!isConditionalValue`), `authoring/VertexAuthoringPanel.tsx` (`cornerRuleDriven`: stepper disabled, label `rule-driven`, glyphs hidden), and three test files (`ir.test.ts`, `shapeRegistry.test.ts`, `irValidate.test.ts`). The four other readers and `previewInstances.ts` are untouched (4.4 held: the typecheck found nothing).

Gates on this branch: `npm run typecheck` exit 2, **33** errors, 0 in `viewpoint/ir` and `viewpoint/authoring`, control `Measurable` 6 (baseline 33); `npx vitest run` **3911 passed, 0 failed** (3900 + 11 new), the same 9 files red at import (identical `FAIL` set, diffed); `npm run build` exit 0.

Mutation proof. Red run first: the 11 new tests were written and run before any source edit, all 11 failed (`box.cornerRadius is not a function`, `expected undefined to be null`, `resolveCompiledCornerRadius is not a function`, `expected [] to include 'isInitial'`, `rules: expected { ok: false, ... } to deeply equal { ok: true }`), the 188 existing tests in the three files passed. Then a bench of 10 mutants on the new code, each applied in place, run on the three files, restored and checked by md5: compile fallback `0` (killed by "one rule resolves per instance"), axis never emitted (4 killed), truthiness gate dropping `0` ("0 is honoured"), deps not extended ("extends the dependency set"), helper without the usable-value guard ("an invalid value reads as absent"), helper reading `0` as absent (2), helper ignoring ctx and element (3), helper never resolving (5), validator guard kept on conditionals (2), validator guard skipped on `null` and other non-objects (the existing "rejects a negative, a non-finite and a non-number" test). 10 of 10 killed, none survived. Not covered by any test, by design: the one-line call of the helper in `IRNodeContent` and the `cornerRuleDriven` guard in the panel (both files import `joiner`).

Merge measurement on `f5ec4b5fe` (`git merge-file -p` branch / merge-base `4275c5850` / trunk, scratch copies; `git merge-tree --write-tree --name-only alfonso-frontend-jjtl validation-skeleton`):

| file | conflicts before | conflicts now | what the remaining hunks are |
|---|---|---|---|
| `irTypes.ts` | 1 | 1 | `CompiledView`: the branch's three border axes vs the trunk's `border: {...} \| null`. Take-branch. The trunk's `cornerRadius` field is no longer in the hunk: git dedupes it against the branch's. |
| `irCompile.ts` | 2 | 2 | the border compile lines vs `const border = ...`, and `borderColor, borderWidth, borderStyle,` vs `border,` in the return. Both take-branch; the trunk's `cornerRadius` lines are deduped (one `const cornerRadius`, one shorthand in the output). |
| `IRNodeContent.tsx` | 1 | 1 | the render region: branch border axes + corner block (now on the helper) vs the trunk's `b = compiled.border`, its corner `if`, and `separatorColorStyle`. Take-branch, except that `separatorColorStyle` (used at two places outside the hunk) must be rebuilt from `borderColorV`: R-IRN-36, the merge lane. |

No hunk in the three files needs a decision. `merge-tree` reports the same 11 conflicted files as before this lane: `docs/PROTOCOL.md`, `docs/archivio/claude_milestone_validazione_scheletro.md` (add/add), `docs/claude-code-log.md`, `docs/decisions.md`, `docs/spec/spec_attive.md`, `SymbolEditorModal.scss`, `SymbolEditorModal.tsx`, `IRNodeContent.tsx`, `irCompile.ts`, `irTypes.ts`, `lastViewpoint.ts`. The two conflicts in `SymbolEditorModal.tsx` (the `useMemo` import and the portal comment, issue #139) do not involve the corner radius.

**Still there, no marker:** `ShapeSpec.cornerRadius?: Conditional<number>` appears twice in the auto-merged `irTypes.ts` (merged lines 198 and 208, both `Conditional<number>`, one from each side), a duplicate property in one interface body. It is what finding 4.8 predicted: the branch rewrites the `border` line the trunk inserts after, so the two insertions are different hunks to git. `merge-tree` does not report it and `npm run typecheck` on the merged tree does (TS2300). It is left to `P-2026-09-19-1740`: delete one of the two blocks, keeping the one with the R-IRN-35 doc (the branch's, line 198).
