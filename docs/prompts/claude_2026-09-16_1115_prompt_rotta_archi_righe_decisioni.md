# The route to edge and row views: the four decisions, and the small fix that comes first

Date: 2026-09-16 11:15 (Europe/Rome)
Type: fix (Fase 1) + feat (Fase 2)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: the hard stop is after Fase 1, and there is a second one INSIDE Fase 2, before any code.

## Le quattro decisioni

Taken on the Fase B report (`a4ec9313d`), which is the evidence for all four.

1. **Host: the v2 canvas menu.** `ClassNode` already dispatches `CHILD_CONTEXT_MENU` with
   `{childId, childKind}` and `EditorV2` already branches per kind to build «Delete reference» and
   «Delete Attribute». The entry has the feature id in hand and lands beside items people already
   find there. The tree's `StructuralFeatureRow` would need a context menu it does not have, and
   would still hit the same creator gap.
2. **Creator: `createViewInWorkbench` gains the two missing branches.** NOT a new parameter on
   `newDefault`. `createViewInWorkbench` already takes the viewpoint as its 4th argument, already
   writes the query and the appliable fields, already returns an id, and is now the single creator
   behind the `+` dialog, the tree menu and the v2 menu. One creator, one resolution rule.
   `newDefault` resolves its own viewpoint before it computes the name, so a parameter there would
   ripple through a public static.
3. **The tree menu's double resolution is not a slice of its own: it is Fase 1 here**, because it is
   what makes the Default invariant true today. See below.
4. **Nothing converges and nothing is removed of the four Default fallbacks.** The invariant to aim
   for is «no view born from a USER GESTURE lands in `Pointer_ViewPointDefault`», and it is enforced
   at the callers, not by deleting a structural default: `new2` and `Constructors.DViewElement` need
   a father for views created programmatically (fixtures, importers), and `newDefault`'s own
   fallback is reachable only from the dead popup and from a chord no gesture delivers. After Fase 1
   the UI reaches priority 3 nowhere, which is the whole of what the question was asking for.

## Fase 1, la doppia risoluzione del menu dell'albero (implementa e committa)

`TreeViewContent.tsx:657` calls `createViewInWorkbench(elementId, name, className)` with no
viewpoint, while the gate resolves at render: the same defect Fase A removed from the v2 menu, in
the twin site. Fix it the same way: resolve once, pass the resolved viewpoint id as the 4th
argument, keep `hasCreatableViewpoint()` as the gate.

Files: `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` only, plus the log entry in
`docs/log-inbox/views.md`.

Acceptance: the view is created in the viewpoint the enabled entry named, and with a census in the
log showing that no live UI path now calls `createViewInWorkbench` without its 4th argument (the
only remaining one is `ContextMenu.tsx:641`, inside the popup that cannot open). State in the log
that this is what makes «no user gesture creates a view in Default» true, with the four fallbacks
untouched.

**Hard stop. Report, then wait.**

## Fase 2, le due voci nel menu della v2

Two preconditions, both measured BEFORE writing any code, and each of them a reason to stop:

- **Does a plain reference row dispatch `CHILD_CONTEXT_MENU`?** The report flagged that the `ref`
  branch may be fed by the cross-metamodel ghost chip alone. Measure it on the live app. If plain
  rows do not dispatch, STOP: the host decision was taken on that evidence and has to be retaken.
- **What does `appliableTo` become for an edge view and for a row view?** The rule ratified on
  2026-08-16 is that `ir.kind` sets it. Find what `newDefault` writes for the `DReference` and
  `DAttribute` branches and reuse exactly that. If no established mapping exists for either kind,
  STOP and report: do not invent a value.

Then, and only then: two entries in the `CHILD_CONTEXT_MENU` branch of `EditorV2`, «Create edge
view» on a reference and «Create row view» on an attribute, gated on `hasCreatableViewpoint()` and
passing the resolved viewpoint id, exactly as Fase A's entry does. The two new branches of
`createViewInWorkbench` mirror `newDefault`: for a `DReference` the edge seed whose metaclass is the
owner class through `father` (falling back to no metaclass when the owner does not resolve, as
`newDefault` already does), for a `DAttribute` the row seed with no metaclass.

Acceptance: right-clicking a reference row creates a view with `ir.kind === 'edge'`, an attribute
row one with `ir.kind === 'row'`, both in the active viewpoint, both with the jsx empty and the `ir`
in the CREATE payload (the control that must fail if the `ir` is written afterwards, as in the `+`
slice). With no viewpoint active both entries are disabled. Typecheck at the same 33 with none in
the touched files, vitest green, build clean.

## Fuori perimetro, in entrambe le fasi

`newDefault` and its signature, `new2`, `Constructors.DViewElement`, `resolveParentViewpoint` and
its chain, the classic `ContextMenu` (popup, `key_bindings`, `closefunc`: a table registered on
`#root` that no gesture reaches is not a shortcut, and reviving it is not on the table), the tree's
`StructuralFeatureRow`.

## Disciplina di corsia

Log entries go to `docs/log-inbox/views.md`, never to the active log: two other sessions are working
in this tree. Assert the branch before writing, stage only your own files one by one, never `git add
.`, docs and code in separate commits.
