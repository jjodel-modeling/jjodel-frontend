# The viewpoint "+" must create an IR view, not a legacy one

Date: 2026-09-16 00:11 (Europe/Rome)
Type: feat (view creation)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: YES. Fase 1 read-only with report, hard stop, then Fase 2 on go-ahead.

## Obiettivo

Clicking the `+` on a viewpoint row of the tree creates a view with no `ir`, so the editor falls
back to the legacy v1 tab set (Apply to, Template, IR, Style, Events, Options, with the OCL editor)
and the author lands in the old world. Every other creation path has been seeding an IR since
R-IRN-4. The `+` must do the same: the view is born with a vertex IR, and the editor opens on the IR
tabs.

Measured before writing this prompt, on this branch:

- `utils/lastViewpoint.ts:191-216`, `createBlankViewInViewpoint` calls
  `DViewElement.new2(candidate, '', dVp, undefined, true)`: no seed, no `appliableTo`, no
  `oclCondition`.
- `TreeViewContent.tsx:1911-1921`, `handleAddView` is the only caller, and it uses the returned
  element to start the inline rename.
- `ViewData.tsx:104-107` switches the WHOLE tab set on `irKind`: with an `ir` the tabs come from
  `irTabsForKind`, without one they are the legacy six. So seeding the view is what moves the editor,
  and nothing in `ViewData` needs to change.
- The two paths that already seed: `createViewInWorkbench` (`lastViewpoint.ts:266-290`) and
  `DViewElement.newDefault` (`view/viewElement/view.tsx:455-495`), both through
  `computeCreationSeed` (`ir/irCreationSeed.ts:91`), both writing `''` as the jsx because a view born
  with an `ir` renders through the interpreter.

## Fase 1, discovery read-only

Three questions and nothing else. No code, no experiment that writes to a project.

1. **`metaclasses`.** `computeCreationSeed({ kind: 'vertex', label })` with no `metaclassName`
   yields `metaclasses: '*'` (`irCreationSeed.ts:114`), which `irResolveCore.ts:72` documents as
   default-view semantics at minimum specificity. Establish, from the resolution path and not by
   guessing, what a wildcard vertex view born inside the ACTIVE viewpoint does to the canvas the
   moment it exists: which objects start resolving to it, and whether `defaultObjectViewIR()`
   renders them differently from how they render today when no view matches them at all. This is the
   question that decides whether the `+` stays a harmless click.
2. **`appliableTo` and `oclCondition`.** `createViewInWorkbench` writes both next to the seed;
   `createBlankViewInViewpoint` writes neither. Establish whether an IR view with neither is
   complete for the IR pipeline, or whether a consumer still reads `appliableTo` (canvas mounting,
   `selectors.ts`, the tree, the megamodel). If the seeded blank view needs `appliableTo: 'Vertex'`,
   say so and name the reader that requires it.
3. **One-way door.** Does `validateIR` accept the seed with no metaclass, and does
   `VertexAuthoringPanel` let the author narrow `metaclasses` afterwards? If the wildcard cannot be
   narrowed from the UI, say it: the `+` would then produce a view that can only ever be the default.

**Report obbligatorio** in `docs/discovery/`, naming standard:
`discovery_2026-09-15_plus_view_ir_seed.md`. Objective, files read with full paths, findings per
question, risks, open questions for Alfonso. The Fase 1 hard stop is not complete until the report is
on disk and committed. Then STOP and report in chat. Do not start Fase 2.

## Fase 2, solo dopo go-ahead esplicito

Seed the IR in `createBlankViewInViewpoint`, and nothing else:

- `computeCreationSeed({ kind: 'vertex', label: <the unique name just computed> })`, the same shape
  `createViewInWorkbench` uses for `DClass`, minus the metaclass it does not have.
- The jsx stays `''`, which this function already passes.
- Anything Fase 1 concludes about `appliableTo` and `oclCondition` is written in the `new2`
  callback, the way `createViewInWorkbench` does it (`lastViewpoint.ts:313-324`): the callback runs
  before persist, so the view is persisted with its `ir` in one action.
- The unique-name loop and the returned `DViewElement` stay as they are: `handleAddView` starts the
  inline rename on the returned element.

Files in scope: `frontend/src/utils/lastViewpoint.ts`, plus `docs/claude-code-log.md` in a separate
commit. Out of scope: `ViewData.tsx`, `irCreationSeed.ts`, `irResolveCore.ts`, `newDefault`,
`TreeViewContent.tsx`, the legacy tab set.

### Criteri di accettazione

1. Clicking `+` on a viewpoint creates a view whose editor opens on the IR tabs, with no Apply to,
   Template, Style, Events, Options and no OCL editor.
2. The inline rename still starts on the new row, as it does today.
3. Reload the project: the view comes back with its `ir` (persisted in one action, not written
   after the fact).
4. The canvas of the active viewpoint before and after the click behaves as Fase 1 predicted. If it
   does not, stop and say so instead of adjusting the seed.
5. `npm run typecheck` shows the same 33 pre-existing errors and none in the touched file, vitest
   green, build clean.

## Nota di perimetro

After this change the `+` can only make VERTEX views. Edge and row views keep being born from a
`DReference` and a `DAttribute` (`view.tsx:469-491`). Whether the `+` should instead open a small
choice of node, edge or row view is a separate decision and is not part of this slice.
