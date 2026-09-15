# The viewpoint "+" asks what the view is for, then creates it with an IR

Date: 2026-09-16 00:27 (Europe/Rome)
Type: feat (view creation)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: NO new discovery. Fase 1 of
`docs/prompts/claude_2026-09-16_0011_prompt_plus_crea_view_ir.md` is the measurement this slice
stands on (`docs/discovery/discovery_2026-09-15_plus_view_ir_seed.md`, commit `b0b70bd54`). If
anything in the code contradicts that report, STOP and say so instead of adapting.

## Perché questa forma e non il seme secco

Fase 1 established that a blank IR view cannot be neutral. Seeded with the wildcard it matches every
object at minimum specificity, so on the ACTIVE viewpoint a single click on `+` repaints the canvas
(and turns off the tree's «not rendered» dimming and the palette filter); seeded with `metaclasses:
[]` every node goes neutral instead, which is worse. The defect is therefore not the seed: it is
that `+` creates a view without knowing what the view is for, and with the IR that question cannot
be postponed any more. So `+` asks it, in one dialog with one question, and the view is born bound.

## COSA

1. `+` on a viewpoint row no longer creates anything on the spot. It opens a small dialog, «New
   view», with ONE question: what does this view apply to.
   - a class of the project, picked from a list. This is the default choice.
   - «All classes (default view)», with a hint below it saying, verbatim:
     `Applies to every object with no more specific view. Choosing it changes how the canvas renders.`
   - Confirm creates the view; Cancel and Escape create nothing.
   - When the project has no class at all, the list is not shown: the dialog says
     `No classes in this project yet.` and only the default-view choice remains.
2. The view is born with its IR, so `ViewData` opens on the IR tabs (`ViewData.tsx:104-107` switches
   the whole tab set on `irKind`; nothing in `ViewData` is touched by this slice).
3. The inline rename still starts on the new row, in BOTH branches, as it does today.

### The invariant that makes this small

A node view created from `+` FOR A CLASS must be indistinguishable from one created from that
class's own context menu. Do not reimplement the seeding: call the existing creator.

- class chosen: `createViewInWorkbench(classId, className, 'DClass', dVp.id)`
  (`utils/lastViewpoint.ts:234`). It already takes the viewpoint as its fourth argument, already
  seeds the vertex IR with name and id (so `pinFor` gets both), already writes `oclCondition`,
  `appliableTo` and `appliableToClasses`, and already passes `''` as the jsx. It returns the new
  view's id or `null`.
- «All classes» chosen: `createBlankViewInViewpoint` (`:191`) gains the seed,
  `computeCreationSeed({ kind: 'vertex', label: <the unique name it already computes> })`, plus
  `d.appliableTo = 'Vertex'` written in the `new2` callback. NO `oclCondition`: it defaults to `''`
  and with no metaclass there is no query to build (Fase 1, Q2). The jsx stays `''`, which that
  function already passes. The unique-name loop and the returned `DViewElement` stay as they are.

`'Vertex'` as a literal, as `createViewInWorkbench` and the Data Manager already write it. Do not
export the helper `newDefault` uses from `view/viewElement/view.tsx` into `utils/`: it is out of
scope and risks an import cycle for a constant.

## DOVE

- `frontend/src/components/project/NewViewDialog.tsx` (new). Model it on `NewViewpointDialog.tsx`,
  same `create-project-dialog.scss` classes, same overlay and Escape handling, same Button.
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`: only `handleAddView` and the local
  state that opens the dialog, in the viewpoint row component around `:1911`.
- `frontend/src/utils/lastViewpoint.ts`: only `createBlankViewInViewpoint`.
- `docs/claude-code-log.md`, separate commit, at the end.

Out of scope, do not touch: `ViewData.tsx`, `irCreationSeed.ts`, `irResolveCore.ts`, `newDefault`,
`MatchingSection` (the 300 ms save of `metaclasses: []` when the wildcard is switched off is a
PRE-EXISTING hazard: record it in the log as a todo, do not fix it here), the stale comment at
`ObjectNode.tsx:108-110` (its own commit, another time), and the choice of kind: edge and row views
keep being born from a `DReference` and a `DAttribute` (`view.tsx:469-491`). A kind selector in this
dialog is a later decision, because Fase 1 measured the vertex semantics and only those.

## COME

- The class list comes from whatever source the tree already uses to enumerate the project's
  classes. Do not build a second derivation of it; name the source you reused in the log entry.
- The inline rename of the class branch starts from the id `createViewInWorkbench` returns, reading
  the name back from the D element rather than recomposing it, so the row shows what was really
  written. Note that the function does NOT uniquify its name (`'View for ' + elementName`,
  `:261`), which is pre-existing and is exactly why the rename must start.
- `createViewInWorkbench` returns `null` on failure and already raises its own toast. On `null`,
  close the dialog and create nothing: no second error message.
- Mount the dialog locally in the row component. If the overlay comes out clipped or mispositioned
  inside the sidebar (a transformed or overflow-hidden ancestor breaks `position: fixed`), portal it
  with `createPortal(..., document.body)` and say in the log that you had to.

## Criteri di accettazione

1. `+` opens the dialog and creates nothing until Confirm. Cancel and Escape leave the project
   unchanged (check the viewpoint's subViews count before and after).
2. Class chosen: the created view is field by field the same as one created from that class's
   context menu, modulo id and name. Compare `ir`, `appliableTo`, `appliableToClasses`,
   `oclCondition` and the empty jsx on the two D elements.
3. Its editor opens on the IR tabs, with no Apply to, Template, Style, Events, Options and no OCL
   editor.
4. «All classes» chosen: the view carries the wildcard `ir`, `appliableTo: 'Vertex'`, no
   `oclCondition`, and the canvas of the active viewpoint changes exactly as rows 1 and 2 of the
   Fase 1 table predict. If it changes in some other way, stop and report.
5. The inline rename starts in both branches.
6. Reload the project: both views come back with their `ir`, persisted in one action.
7. `npm run typecheck` shows the same 33 pre-existing errors and none in the touched files, vitest
   green, `npm run build` clean.

## Disciplina di corsia

Other sessions may be working in this tree; their dirty files are expected and must not be touched.
Assert the branch before writing. Stage only the files listed in DOVE, one by one, never `git add
.`. Two commits: `feat: the viewpoint + asks what the view applies to and seeds its IR`, then the
log entry.
