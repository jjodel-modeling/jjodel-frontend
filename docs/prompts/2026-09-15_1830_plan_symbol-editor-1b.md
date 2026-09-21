# Execution plan: Symbol Editor 1b, five slices

Generated 2026-09-15, from `handoff/decisions-symbol-editor-1b.md` (version 3) and
`handoff/02-coder-spec.md`.

## What "independent" means, and what it does not

`02-coder-spec.md` calls the slices independent. That is true in the sense that none of them needs
another one's outcome to be designed. It is **not** true in the sense of running them concurrently
on one working tree. The file overlap, measured on `alfonso-frontend-jjtl`:

| file | slice 1 | slice 2 | slice 3 | slice 4 | slice 5 |
|---|---|---|---|---|---|
| `ui/ConditionalEditor/*` | yes | | | | |
| `ir/irTypes.ts` | | border | cornerRadius | ShapeForm | |
| `ir/irCompile.ts` | | yes | | | `matchIndexOf` |
| `ir/IRNodeContent.tsx` | | lines 333-371 | same region | | |
| `ir/shapeRegistry.ts` | | | `roundedPolygonPath` | `cloud` | |
| `ir/notationCatalog.ts` | | `applyPresetToShape` | | same function | |
| `ir/symbolRecognition.ts` | | yes | must stay out | | |
| `authoring/VertexAuthoringPanel.tsx` | Fill, Marker | Border | Shape | `FORM_OPTIONS` | |
| `authoring/SymbolEditorModal.tsx` | | `currentAxesPreset` | | shell | preview |
| `authoring/SymbolBoxPreview.tsx` | | yes | yes | | yes |

Slices 2 and 3 collide inside the same function bodies of `IRNodeContent.tsx`, and the `double`
border overdraw has to follow the rounded path, so they are also semantically coupled. Slices 2 and
4 collide inside `applyPresetToShape`.

## Waves

**Wave A, genuinely parallel: slice 1 and slice 3.** They share only `VertexAuthoringPanel.tsx`,
in different FormSections (Fill and Marker against Shape), which merges cleanly. Two Claude Code
sessions, or two git worktrees, no coordination needed beyond the final merge.

**Wave B: slice 2**, alone, after wave A is merged.

**Wave C: slice 4**, after slice 2 (it extends `applyPresetToShape`) and after slice 3 (it edits
`shapeRegistry.ts` and `FORM_OPTIONS`).

**Wave D: slice 5**, after slice 1 (it needs `formatPredicate`) and after slice 2 (border captions).

If you want more parallelism than this, the way to get it is git worktrees plus a declared merge
order, accepting one integration pass on `IRNodeContent.tsx`, `applyPresetToShape` and
`VertexAuthoringPanel.tsx`. It buys wall-clock time and costs a merge that nobody has visually
verified until the end, which is the opposite of the hard-stop-per-commit discipline this project
runs on. My recommendation is the four waves above.

## Visual verification

Each slice ends with a hard stop for the visual GO on the running app. That check is not delegable
and it is what the wave boundaries are for.
