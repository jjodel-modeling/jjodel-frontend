# The rules table on the Shape axis

Date: 2026-09-17 10:48 (Europe/Rome)
Type: feat (authoring UI)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: high
Two-phase: NO, and the preconditions are already measured (below).

## La decisione

`SHAPE` gets the same rules table that `FILL`, `MARKER` and the three border axes already have.
Alfonso decided it looking at the two sections side by side: a single `when/then/else` on the form is
not enough for the case the axis exists for, a state machine that wants the circle for the initial
state, the double circle for the final one and the rectangle for the rest.

The criterion behind it, to be recorded in the log entry so the remaining asymmetry reads as
deliberate: **the rules table goes to the axes with more than two values; boolean axes keep the
single predicate**. On a boolean (`visible` and its kind) a list of rules assigning true or false
plus a default is the same condition written longer, so the table would be ceremony without
expressiveness.

## Perché è piccola: tutto il resto c'è già

Measured on this branch, so do not re-derive it, just check it still holds:

- The model does not distinguish: `Conditional<T>` (`irTypes.ts:50-53`) admits the scalar, the
  `{when, then, else}` and the `{rules, default}` for every axis.
- The engine already resolves the multi-rule form on THIS axis: `compileConditional`
  (`irCompile.ts:246-257`) handles both object shapes, and `shape.form` goes through it at `:305`.
- The editor already normalizes: `toRules` (`ui/ConditionalEditor/conditional.ts:33-49`) accepts all
  three shapes, and the comment at `ConditionalEditor.tsx:235-237` states the contract that matters
  here, an old `{when, then, else}` is rewritten only on the first real edit, never on open.

So what is missing is one prop. `VertexAuthoringPanel` passes `rulesTable` at five call sites
(`:677` fill, `:703`/`:717`/`:735` border, `:814` marker) and not at the form's `ConditionalEditor`
in the Shape section.

## COSA

Pass `rulesTable` to the form axis, shaped like the border ones rather than like fill: a form always
has a value, so no `noneValue` and no `fixedLabel` override. `valueNoun: 'shape'`, `subjectName` as
its neighbours read it. Nothing else in the section moves: the corner radius stepper is not
conditional and stays exactly as it is.

Files: `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` and its
tests, plus the log entry in `docs/log-inbox/symbol-editor.md`.

Out of scope: every other axis (in particular the booleans, by the criterion above), the popover, the
nav and the badges of 4b, and `notationCatalog`.

## Criteri di accettazione

1. On a view whose form is scalar, switching to Conditional shows the empty rules table with «Add
   first rule» and the «Otherwise» row, like FILL.
2. Two rules on the form draw per instance on the canvas: different shapes for instances that
   satisfy different predicates, the default for the rest.
3. **The one that checks the contract**: open a view saved with a single `{when, then, else}` on the
   form. The table must show it as one rule plus the Otherwise, and simply opening and closing the
   modal must NOT touch the stored value: check in the rail's Source tab that it is still
   `{when, then, else}` and becomes `{rules, default}` only after a real edit.
4. A form axis with rules must match no catalog preset, through the existing `scalarOf` sentinel,
   exactly as slice 2 established for style and width. If it does not, stop: that is the mutation
   that makes the modal title lie.
5. Usual gates: typecheck at the same baseline with none in the touched file, vitest green, build
   clean.

## Disciplina di corsia

Log entry in `docs/log-inbox/symbol-editor.md`, never the active log. Assert the branch before
writing, stage only your own files one by one, never `git add .`, docs and code in separate commits.
Visual verification is Alfonso's: list what he has to look at and leave `Regressions` at `unknown`.
