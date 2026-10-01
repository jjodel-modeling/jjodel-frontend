# Slice 4a: the Goal family and the cloud form, split off from the 2h shell

Date: 2026-09-16 12:42 (Europe/Rome)
Type: feat (symbol catalog)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: NO. The spec is `docs/handoff/02-coder-spec.md`, slice 4, and this prompt only says which
half of it is in and which is out.

## Perché una 4a

Slice 4 as specified bundles two things that do not depend on each other: the CATALOG (a new family,
a new form, two markers) and the SHELL (the 2h popover, the section nav with its badges, D7's
`applyPresetToShape` with `keepRules`). The shell has to wait for slice 2, because the Border badge
of the section nav is defined as the number of distinct OVERRIDES rows, which is exactly the data
model slice 2 introduces. The catalog waits for nothing. It is split so the Goal symbols can land
now, in parallel with slice 2, and the shell follows as 4b once slice 2 is in.

## COSA, e nient'altro

Follow slice 4 of the spec for these points only:

- `ir/irTypes.ts`: `ShapeForm` += `'cloud'`.
- `ir/shapeRegistry.ts`: the COMPLETE `cloud` descriptor, not just the painter: `svgPath` painter (a
  path, like the cylinder, not a polygon), `insetFractionAt`, `sizing`, resize policy, content rect
  inset about 18% on every side. Extend the equivalence test in `ir/__tests__/shapeRegistry.test.ts`.
- `ir/markerRegistry.ts`: `bar-top` `M30,22 L70,22`, `bar-bottom` `M30,78 L70,78`.
- `ir/notationCatalog.ts`: `CatalogFamily` += `'Goal'`, appended to `CATALOG_FAMILIES` (that order is
  the order of the sections), with the nine presets the spec lists, `notation` among `'i*' | 'KAOS' |
  'GRL'`. Keep the spec's reason for the Obstacle being a parallelogram and not a diamond: a diamond
  with a plain border is already the ER relationship, and the modal titles with `matches[0]` (D6).
- `editor-v2/nodes/nodeSizing.ts`: `defaultResizableForForm` treats cloud like ellipse.

One contended line, and it decides itself. `authoring/VertexAuthoringPanel.tsx` `FORM_OPTIONS` +=
Cloud is inside the file that slice 2 owns exclusively. Before writing it, check whether that file is
being touched by another lane right now (dirty in the tree, or a commit of theirs on it since this
prompt's date). If it is free, write the line and say so in the log. If it is not, SKIP it, and
record in the log that it is the one deferred piece, to be added by the lane that holds the panel.
Everything else in this slice is unaffected: the Goal presets already set the form through the
catalog, so Cloud is reachable without that dropdown entry.

## Fuori perimetro, esplicitamente

The whole shell half of slice 4: `SymbolCatalogPicker` `variant='popover'`, the 1b header with the
chip and «Change…», the section nav with its badges, the footer with «Revert to preset» and «Done»,
and `applyPresetToShape(..., {keepRules})` with D7. Preset application keeps today's behaviour.
Also out: `SymbolEditorModal.tsx` in general, slice 2's border work, slice 5.

## Criteri di accettazione

1. The catalog counts 56 presets and 5 families; `catalogFamilySections` returns Goal with 9.
2. The cloud renders as itself in the three places a form has to survive: the catalog tile, the
   preview in the modal, and a node on the canvas. Its content rect keeps the label inside the
   drawing at small and large sizes.
3. Agent and Role differ from Actor by the bar marker, top and bottom respectively.
4. The equivalence test in `shapeRegistry.test.ts` covers cloud and is green.
5. `npm run typecheck` at the same baseline with none in the touched files, vitest green, build
   clean.

## Disciplina di corsia

Three lanes are working in this tree. Assert the branch before writing, stage only your own files one
by one, never `git add .`, docs and code in separate commits, and the log entry goes to
`docs/log-inbox/symbol-editor.md` (create it if it is not there), never the active log.
