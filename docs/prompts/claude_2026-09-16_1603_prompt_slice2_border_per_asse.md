# Slice 2: the border becomes conditional per axis

Date: 2026-09-16 16:03 (Europe/Rome)
Type: feat (IR + authoring)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: NO. The spec is `docs/handoff/02-coder-spec.md`, slice 2, and it is detailed enough to
implement from. This prompt adds the two layout decisions taken today and the perimeter rules; it
does not restate the spec. Read that section first, and if the code contradicts it, STOP and say so.

## Le due decisioni di oggi

1. **The three axes keep their own Fixed/Conditional control, all three visible.** No single switch
   on the border that reveals the axes underneath: a single switch would say that the border has one
   conditional, which is exactly what D1 rejected when it chose per axis over
   `Conditional<BorderSpec>`. The section is consistent with Shape and Fill, which already carry one
   each.
2. **The modal does not get wider. The Border section spans both columns of the anatomy grid.**
   Measured: the modal is 1040px with a 264px catalog column and the appearance body is a two-column
   grid (`SymbolEditorModal.scss:461`), so each column is around 350px. Two options in a segmented
   fit in 350px; what the three axes plus the OVERRIDES table need is vertical room and horizontal
   space for the table, and widening the modal gives neither. The rule already exists in that file
   for the identity section (`> section:first-child { grid-column: 1 / -1; }`): give Border the same
   treatment. Expect the pairing to shift (Shape next to Fill, Border alone across, then Padding next
   to Marker, Sizing last), which is the right weighting since Border becomes the heaviest section.
   Slice 4b rebuilds this shell anyway and the catalog column disappears there, so nothing done here
   should try to anticipate it.

## Perimetro

The files are the ones the spec names, and no others. This slice OWNS `VertexAuthoringPanel.tsx`
(slice 4a's one line has already landed, so the file is free) and `SymbolEditorModal.scss` for the
span rule.

Out of scope, explicitly: the 2h shell and the popover, `applyPresetToShape` with `keepRules` (slice
4), the preview caption `base` / predicate (slice 5), `irStyle.ts` (it does not read the IR border),
the views lane's files.

## Attenzione ai due punti in cui si sbaglia in silenzio

- `symbolRecognition.ts`: a conditional axis must mean NO preset match, through the existing
  `scalarOf` sentinel, and recognition must never look at the `default`. Getting this wrong makes the
  modal title lie instead of failing.
- The OVERRIDES row is a predicate plus the subset of axes it overrides, written as one rule in each
  of those axes. It is not a complete BorderSpec with a chip filter above it. On read, group the axes
  by structural equality of `when`, and when the predicates do not coincide across axes, show one row
  per axis and say so in the panel (D1).

## Criteri di accettazione

The spec's three, unchanged: the ER preset «Weak entity» is still recognized; a view saved with a
scalar border before this change opens identical; a border with a conditional `width` matches no
preset and draws per instance.

Plus, from the decisions above: the three segmented controls are all visible in the Border section;
the Border section spans the full width of the anatomy grid, and the other sections re-pair without
overlapping or leaving a hole; the modal keeps its current width.

Plus the usual gates: `npm run typecheck` at the same baseline with none in the touched files,
vitest green, `npm run build` clean.

Persistence: additive, no `irVersion` bump, no VersionFixer. If you find yourself needing either,
stop: it means the shape drifted from the spec.

## Disciplina di corsia

Log entry in `docs/log-inbox/symbol-editor.md`, never the active log. Assert the branch before
writing, stage only your own files one by one, never `git add .`, docs and code in separate commits.
The visual verification is Alfonso's: when the slice is ready, list what he has to look at, in
order, and leave `Regressions` at `unknown` until he answers.
