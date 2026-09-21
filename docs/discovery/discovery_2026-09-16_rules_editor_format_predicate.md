# Discovery 2026-09-16 — Slice 1: rules editor and formatPredicate

Prompt: `docs/prompts/2026-09-15_1830_slice-1_rules-editor.md` (phase 1, read only).
Branch `validation-skeleton`, HEAD `d0e920323`. No source modified.

## 1. Hypotheses this discovery tries to falsify

- H1. The change can stay inside `ui/ConditionalEditor/*` plus the Fill and Marker call sites, with
  no effect on the other surfaces that mount `ConditionalEditor`.
- H2. `LabelListEditor` already uses a list library that can drag rows, so "drag to reorder"
  costs no dependency.
- H3. `{rules: [{when, then}], default}` compiles exactly like `{when, then, else}`, so rewriting the
  old form on edit is invisible on the canvas.
- H4. `formatPredicate` can be written from the `Predicate` union alone, with no runtime dependency.
- H5. The source documents the prompt cites (handoff, mockup) are available to the coder.

## 2. Goal

Establish what exists, what the three deliverables touch, and what has to be decided before phase 2.

## 3. Files read

- `/Users/alfonso/jjodel/docs/prompts/2026-09-15_1830_slice-1_rules-editor.md`
- `/Users/alfonso/jjodel/docs/prompts/2026-09-15_1830_plan_symbol-editor-1b.md`
- `/Users/alfonso/jjodel/docs/prompts/2026-09-15_1830_slice-3_corner-radius.md` (overlap only)
- `/Users/alfonso/jjodel/docs/prompts/2026-09-15_1830_slice-5_multi-instance-preview.md` (consumer of `formatPredicate`)
- `/Users/alfonso/jjodel/CLAUDE.md`, `/Users/alfonso/jjodel/docs/PROTOCOL.md`
- `/Users/alfonso/jjodel/docs/claude-code-log.md` (first ~30 KB, entries 2026-09-13 to 2026-09-16)
- `/Users/alfonso/jjodel/docs/decisions.md` (U-6 at 229-249, R-MK-11 and R-MK-13 at 1363-1390; grep elsewhere)
- `/Users/alfonso/jjodel/docs/CLAUDE_DEVELOPMENT_GUIDE.md` (table of contents only: it is a design-system
  guide, no section on `editor-v2/viewpoint`, `ConditionalEditor` or `PredicateBuilder`)
- `/Users/alfonso/jjodel/frontend/src/components/ui/ConditionalEditor/conditional.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/ConditionalEditor/ConditionalEditor.module.css` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/ConditionalEditor/index.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/index.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (1-70; grep for the rest)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (150-340)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (grep)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (grep on `fill`)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/symbolRecognition.ts` (48-62, grep)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (grep, 136-156)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/LabelListEditor.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/ListEditor/ListEditor.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/PredicateBuilder/predicateDefaults.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx` (1-60)
- `/Users/alfonso/jjodel/frontend/src/components/ui/ColorPicker/ColorPicker.tsx` (grep)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx` (95-194)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx` (50-139)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (740-790)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (410-435)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (70-100)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx` (55-110)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` (275-305)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (grep 93-103, 188)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss` (grep z-index)
- `/Users/alfonso/jjodel/frontend/src/styles/components/_form-system.scss` (1025-1027)
- `/Users/alfonso/jjodel/frontend/vitest.config.ts` (grep), `/Users/alfonso/jjodel/frontend/package.json` (grep)

## 4. Findings

### F1. H5 falsified: the source documents are not reachable

`handoff/decisions-symbol-editor-1b.md`, `handoff/02-coder-spec.md` and the mockup
`Symbol Editor 1b - All Sections.dc.html` are not in the repo and not under `~` to depth 6
(`find ~ -maxdepth 6 -name "decisions-symbol-editor-1b*" -o -name "02-coder-spec*" -o -name "Symbol Editor 1b*"`:
no output, exit 1 = no match; positive control, same `find` on
`docs/prompts/2026-09-15_1830_slice-1*`, returns the file). Everything the prompt says about the
mockup (copy of 2i, look of the table, suggestion chips, labels of the three modes) is known only
through the prompt's own quotations.

### F2. Branch: the prompt's measurements hold on this branch

The plan says the overlap was "measured on `alfonso-frontend-jjtl`". `git diff --quiet alfonso-frontend-jjtl --`
over `ui/ConditionalEditor`, `ui/PredicateBuilder`, `ui/ListEditor`, `VertexAuthoringPanel.tsx` and
`irCompile.ts` exits 0 (no difference); positive control, same command form on
`NewViewpointDialog.tsx`, which changed today, prints `16 ++++++++--------`. The line numbers match:
Fill FormSection at `VertexAuthoringPanel.tsx:530`, Marker at `:584`.

### F3. Current editor: the `rules` form is a read-only chip, the switch is derived from the value

`ConditionalEditor.tsx:63-71`:

```
const isCond = isConditionalValue(value);
const isRules = isCond && 'rules' in (value as any);
const isWhen = isCond && 'when' in (value as any);
const mode: 'fixed' | 'conditional' = isWhen ? 'conditional' : 'fixed';
// Multi-rule form: not editable this phase — preserved verbatim as a chip.
if (isRules) {
    return <span className={styles.chip}>conditional (multiple rules, not yet editable)</span>;
}
```

The mode is **not** local state: it is read off the value. `switchToFixed` takes `.then`
(`:91`), `switchToConditional` seeds `{ when: { op: 'literal', value: true }, then: base }` (`:96`).
The else branch is a toggle that drops the key (`:135-144`). Basic mode (`allowConditional=false`)
renders `renderValue` bare, or a chip when the value is already conditional (`:76-85`).

`conditional.ts` is 17 lines, one export, one `import type` — importable in the node bench.

### F4. H1 falsified: `ConditionalEditor` has 13 mounts in 8 files, Fill and Marker are 2 of them

`grep -rn ConditionalEditor frontend/src` (excluding its own folder):

| file | axis | `defaultValue` |
|---|---|---|
| `VertexAuthoringPanel.tsx:516` | `shape.form` (slice 3's section) | `'rect'` |
| `VertexAuthoringPanel.tsx:532` | `shape.fill` | `''` |
| `VertexAuthoringPanel.tsx:586` | `shape.marker` (`value={marker ?? ''}`, `'' → undefined`) | `''` |
| `EdgeAuthoringPanel.tsx:750,762,774` | line color, width, style | `''`, `1`, `'solid'` |
| `RowAuthoringPanel.tsx:419` | row `visible` | `true` |
| `LabelEntryEditor.tsx:82` | label `visible` | `true` |
| `BadgeListEditor.tsx:65,92` | badge `icon`, `visible` | `''`, `true` |
| `FieldCompartmentListEditor.tsx:288` | compartment `visible` | `true` |
| `TextStyleEditor.tsx:116` | five typography axes, inside the `TextStyleField` popover | per axis |

Replacing the `{when, then, else}` body with the rules table inside `ConditionalEditor` changes
**all** of them, not only Fill and Marker. The prompt's "every existing call site is unaffected"
is written about the `noneValue` switch only.

### F5. A consumer outside scope reads `.then` directly: `TextStyleEditor.flip`

`TextStyleEditor.tsx:85-92`:

```
const flip = () => {
    if (isCond) {
        // Collapse to the then-branch value (stays authored, not undefined).
        onChange((value as { then: T }).then);
    } else {
        const base = (value as T | undefined) ?? axisDefault;
        onChange({ when: { op: 'literal', value: true }, then: base });
    }
};
```

On a `rules` value `.then` is `undefined`, so the ƒx button would **unset** the axis instead of
collapsing it. Today this is unreachable in practice (the only writer of that axis is this same
file plus `ConditionalEditor`, both writing `when`). If `fromRules` makes every edit write
`rules`, the first edit of a typography conditional followed by ƒx deletes the axis. This is a
regression in a file not listed under DOVE.

No other reader of the `when`/`rules` shape exists in `editor-v2`, `ui`, `utils`, `redux`, `common`,
`model` (`grep -rn -E "'when' in|'rules' in|\.rules\b"`: the only viewpoint hits are
`irCompile.ts:246,250,257` and `ConditionalEditor`; the `model/validation` and
`validationFreshness.ts` hits are the validation viewpoint's own `rules`, unrelated).
`symbolRecognition.ts` and `SymbolEditorModal.currentAxesPreset` (`:102-103`) only test
`typeof === 'string'`, so both forms are equally "not scalar" to them.

### F6. H3 holds: the two forms compile identically

`irCompile.ts:250-262`:

```
if ('when' in (c as any)) {
    ...
    const elseV = cc.else !== undefined ? cc.else : fallback;
    return (ctx, id) => (pred(ctx, id) ? cc.then : elseV);
}
const cr = c as { rules: { when: Predicate; then: T }[]; default?: T };
const compiled = cr.rules.map(r => ({ pred: compilePredicate(r.when, deps), then: r.then }));
const defV = cr.default !== undefined ? cr.default : fallback;
return (ctx, id) => { for (const r of compiled) if (r.pred(ctx, id)) return r.then; return defV; };
```

Same predicate compile, same `deps`, same fallback on an absent `else`/`default`. `{rules: []}`
with no default returns `fallback` for every element, exactly like the absent axis: the prompt's
reason for never persisting it is confirmed. `ir.test.ts:136-156` already compiles a two-rule form
on the draw `ReadCtx` (`makeDrawReadCtx`), which is the harness for the equivalence test. The compile
cache is keyed on `irHash` of the JSON (`:285-297`), so the two forms are two cache entries with the
same behaviour; the test must use `clearCompileCache()` as the existing one does.

`validateIR` walks the whole ir generically for unknown ops (`irValidate.ts:75-105`) and has no
rule on `rules.length`, so `{rules: [], default: X}` validates.

### F7. H2 falsified: there is no drag library to reuse

`LabelListEditor` renders `ListEditor`, whose doc comment says it outright, `ListEditor.tsx:27-29`:

```
 * supplies immutable add/remove/move handlers and a row renderer. Reordering is
 * up/down buttons (no drag-and-drop dependency). Reused for the IR label,
```

`package.json` has no dnd entry (`grep -n -i -E "dnd|sortable|draggable"`: exit 1; positive control
`grep -c react-redux`: 1). "Drag to reorder" and "reuse the list library of `LabelListEditor`, no
dependency" cannot both be satisfied literally. Native HTML5 drag exists as precedent in
`PalettePanel.tsx`, `editor-v2/utils/dragState.ts`, `FeaturesPalette.tsx` (no dependency).

### F8. No popover primitive; the precedent is a portal with an outside-click closer

`ui/` has no Popover. `TextStyleField.tsx:110-130,166-191` portals to `document.body`, `position: fixed`,
`z-index: 10000` (`_form-system.scss:1025-1027`), and closes on any `mousedown` outside
`popoverRef`/`triggerRef` (capture phase). Two consequences for the WHEN popover:

- Inside the Symbol Editor modal (`z-index: var(--z-modal, 9999)`, `SymbolEditorModal.scss:10`) a
  portal needs `z-index` above 9999; 10000 is the precedent. Reachability must be measured with
  `elementsFromPoint` (P11), not inferred from the numbers.
- If the typography axes also get the table (F4), a WHEN popover portaled to `body` from inside the
  `TextStyleField` popover is "outside" for that closer: the first click in the WHEN popover
  closes the typography popover and unmounts both.

### F9. `PredicateBuilder` has no `marked` case (R-MK-13, pre-existing)

`PredicateBuilder.tsx:291-300` pins the `default:` branch to the comparators; `PREDICATE_KIND_OPTIONS`
(`predicateDefaults.ts:20-34`) has 13 kinds and no `marked`. A rule whose `when` is `marked`, opened in
the popover, renders two operand editors on absent `left`/`right`. Same as today for a
`{when: marked}` value; `formatPredicate` will show it correctly, the builder will not. Out of scope.

### F10. The "none" convention of Fill and Marker

- Render: `IRNodeContent.tsx:158` `const fill = compiled.fill ? compiled.fill(readCtx, objectId) : '';`
  and `:331` `if (fill && !svgPainter) inlineStyle.background = fill;`, `:351` `const svgFill = fill || 'var(--node-bg)';`.
  So `''` and an absent fill both mean **theme background**, not transparent. `symbolRecognition.ts:50-53`
  states the same: `'' and undefined both mean "no marker" / "no fill"`.
- `ColorPicker` with `''` shows a black swatch (`ColorPicker.tsx:58`, `FULL_HEX_RE.test(value) ? value : '#000000'`).
- The Marker call site already maps `'' → undefined` (`VertexAuthoringPanel.tsx:588`); the Fill call
  site writes `''` verbatim (`:534`).

### F11. `formatPredicate` inputs (H4 holds)

`irTypes.ts:24-48`: 8 shapes, 13 `op` values plus `marked` = 14 ops. `Literal` is
`{kind: 'string'|'number'|'boolean', value}` (`:19-22`); an operand is a `PathExpr` string or a
`Literal`, discriminated by `isLiteralOperand` (`predicateDefaults.ts:71-73`, pure, same folder
family). Compile semantics relevant to the text: `and` over `[]` is `every` → true, `or` over `[]`
is `some` → false (`irCompile.ts:157-164`). No identifier collision: `grep -rn -E
"formatPredicate|toRules|fromRules|noneValue" frontend/src` exits 1; positive control
`isConditionalValue` → 14 lines.

### F12. Stale copy outside the declared sections

`VertexAuthoringPanel.tsx:423`, Applies to tab: `Multiple rules are not yet editable here. Single
conditional fields (when/then/else) are edited now directly in Basic, next to each field.` After this
slice it is false, but it is not in the Fill or Marker FormSection.

### F13. Tests run in node, `.ts` only

`vitest.config.ts:14,16`: `environment: 'node'`, `include: ['src/**/__tests__/**/*.test.ts']`. The table
and the switch (`.tsx`) cannot be executed in the bench; `conditional.ts` and `irCompile.ts` can.

## 5. Baselines (measured before any edit)

- `npm run typecheck`: exit 2, **33** `error TS` on full output (the §17 baseline); **0** in
  `ConditionalEditor*` and `VertexAuthoringPanel`; control `Measurable` → 6.
- `npx vitest run src/components/ui src/components/editor-v2/viewpoint/ir`: 26 files, **586 passed**.

## 6. Dependencies and risks

- R1 (F4, F5). A global table rewrites the editing UI of 13 mounts and turns every edited
  conditional into the `rules` form, which breaks `TextStyleEditor.flip` (out of DOVE).
- R2 (F8). Nested portal popovers: typography popover closes on the first click in a WHEN popover.
- R3 (F7). Drag reorder with no library: native HTML5 drag is keyboard-inaccessible by itself; it
  needs a keyboard alternative to meet the guide's WCAG line.
- R4 (F3). The mode is derived from the value. "Conditional with no rules and no default" has no
  persistable encoding, so from `None` the switch cannot stay on Conditional unless something is
  written (a default or a first rule).
- R5. Old `{when, then}` values are rewritten to `rules` on the **first edit**, never on open. The
  editor must not call `onChange` on mount, or opening a panel would dirty and commit every view.
- R6 (slice 3 in parallel). `VertexAuthoringPanel.tsx` is shared. If slice 3 runs in **this** working
  tree, `git commit -- VertexAuthoringPanel.tsx` would carry its hunks too (CLAUDE.md §6.4). At the
  time of this report the file is clean (`git status --short` lists only docs).
- R7 (F1). Copy, chip suggestions and layout would be invented without the mockup.

## 7. Proposed shape for phase 2 (subject to the answers in §8)

- `conditional.ts`: `formatPredicate`, `toRules`, `fromRules` (plus a small `RulesForm<T>` type), pure.
- `ConditionalEditor.tsx`: optional props `noneValue?: T` and the table opt-in of Q1; mode derived
  as `none` (value === noneValue), `solid` (scalar), `conditional` (either object form).
- Table: a CSS grid `⋮⋮ | WHEN | → | THEN | ✕`, WHEN = button with `formatPredicate` text opening a
  portal popover with `PredicateBuilder`, THEN = `renderValue`, `Otherwise → renderValue(default)`.
- `ConditionalEditor.module.css`: new local classes only (module-scoped, no new CSS variables).
- `__tests__/conditional.test.ts`: round trips on the three shapes, the three write rules, 14 ops +
  invented op + malformed known op; `irCompile` equivalence of `{when,then,else}` vs one rule + default
  on `makeDrawReadCtx`.
- `VertexAuthoringPanel.tsx`: `noneValue={''}` on Fill and Marker, nothing else.
- `ui/index.ts`: re-export `formatPredicate` (slice 5 needs it from `SymbolEditorModal`).

## 8. Open questions for Alfonso

**Q1. Which mounts get the rules table?** (F4, F5, R1, R2)
(a) opt-in prop, only Fill and Marker in this slice; the other 11 mounts keep today's
`when/then/else` body and chip, nothing else changes. (b) all mounts, which needs a fix to
`TextStyleEditor.flip` (out of DOVE) and a solution for the nested popover.
Recommendation: **(a)**, e.g. the table turns on with `noneValue` or with a separate `rules` flag.

**Q2. Reorder.** (F7, R3) No drag library exists. (a) native HTML5 drag on the `⋮⋮` handle, plus
Alt+ArrowUp/ArrowDown on the focused handle; (b) up/down buttons like `ListEditor`, no `⋮⋮`.
Recommendation: **(a)**, no dependency.

**Q3. None → Conditional.** (R4) Moving `''` into `default` gives `{rules: [], default: ''}`, which
is legal and keeps state 2i on reopen, but persists a default equal to "none". The alternative is
seeding a first rule (`always true → ''`). Recommendation: **`{rules: [], default: noneValue}`**,
it matches the prompt's "Conditional moves the current scalar into default" literally.

**Q4. The Otherwise row when no default is set** (for example an old `{when, then}` without else).
Show the fallback greyed with a "Set default" action, and offer a clear (✕) on a set default?
Recommendation: yes to both, mirroring today's "Include else branch" toggle.

**Q5. Scalar written back when the last rule goes and there is no default.** Recommendation:
`noneValue ?? defaultValue` (Marker then maps `''` to key removal at its call site, as today).

**Q6. Labels.** `None | Solid | Conditional` for both Fill and Marker ("Solid" on a marker)? Axes
without `noneValue` keep `Fixed | Conditional`? And in Basic mode, stays exactly as today (no switch
at all), or shows `None | Solid`? Recommendation: labels as the prompt says, Basic unchanged.

**Q7. Empty state 2i.** The copy "No rules yet, every State uses the default below" names the target
metaclass: `ConditionalEditor` does not know it. OK to add an optional `subjectName?: string` prop,
passed from `featureInfo.targetName` in the panel? And what do the suggestion chips suggest?
Proposal: one chip per boolean attribute of the target (`$attr.value == true`), plus `marked`,
capped at 3; nothing when `features` is null.

**Q8. `formatPredicate` details.** Path verbatim (`$isInitial.value == true`) as the prompt says,
while slice 5's mockup caption reads `isInitial`: verbatim confirmed? Parenthesize every `and`/`or`
child whose op differs from its parent (no reliance on precedence)? `and []` → `always true`,
`or []` → `always false` (compile semantics)? Operators as `==`, `!=`, `<`, `<=`, `>`, `>=`?

**Q9. Handoff documents** (F1). Can you share the path of `handoff/` and of the mockup? Without them
Q6-Q7 are answered from the prompt only.

**Q10. Stale help text** (F12) at `VertexAuthoringPanel.tsx:423`: update it in this slice (one line,
outside the Fill/Marker sections), or leave it for later?

**Q11. Slice 3 in parallel** (R6): same working tree or a separate worktree? If the same tree, I
commit `VertexAuthoringPanel.tsx` only when its diff carries this slice's hunks alone, else I stop.
