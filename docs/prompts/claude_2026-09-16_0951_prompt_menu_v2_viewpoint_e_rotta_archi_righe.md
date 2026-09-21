# Where views are really created: the v2 menu's viewpoint, and the lost route to edge and row views

Date: 2026-09-16 09:51 (Europe/Rome)
Type: fix (Fase A) + discovery (Fase B)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: YES, and the hard stop is between A and B, not before A.

## Da dove viene

The Errata of `claude_2026-09-16_0055_prompt_gate_create_view_sempre_chiuso.md` closed the gate
question and opened two others, both measured in chat on this branch:

- `key_bindings` (`contextMenu/ContextMenu.tsx:656-669`) is a table NOTHING dispatches: there is no
  `keydown` listener in that file and no reference to `key_bindings` or `KeyBind` anywhere else in
  `frontend/src`. The entries survive only because the classic menu uses
  `key_bindings.<x>.function` as its onClick, and that menu cannot open. So Ctrl+Alt+V has no
  listener at all, which is why it never reaches its handler.
- `closefunc` (`:239`) is `null as any` until `:300` assigns it, and `:300` runs only when the
  classic popup renders. `addViewInstances` and `addViewSelf` both end on
  `key_bindings.close.function()`, which is `() => closefunc()`. That is the
  `closefunc is not a function` the forced run produced: the view IS created, the crash is on the
  close of a menu that was never open.
- `EditorV2.tsx:3244-3265`, the menu that DOES open, resolves the viewpoint TWICE and by a different
  rule than the tree: it calls `resolveParentViewpoint()` for the label, then
  `createViewInWorkbench(classId, ...)` with NO viewpoint argument, so the creator resolves again on
  its own. The chain's priority 3 is `Pointer_ViewPointDefault`, the system viewpoint that
  `Defaults.isSystemViewpoint` hides from the toolbar, the megamodel and the dashboard. That is what
  the label `Create View in "Default"` is telling us: with no active viewpoint, the entry files the
  new view inside a viewpoint the rest of the UI refuses to show.

## Fase A, il menu della v2 (implementa e committa)

Two defects, one file.

1. The entry must not offer to create inside a system viewpoint. Gate it on `hasCreatableViewpoint()`
   (`utils/lastViewpoint.ts:142`, added this morning by `70bcbc5f8`), the same predicate the tree
   entry uses, so the two menus stop disagreeing about what «creatable» means. With no active
   non-system viewpoint the entry stays visible and disabled, with the label it already has for that
   case.
2. Label and destination must come from ONE resolution. Pass the resolved viewpoint id to
   `createViewInWorkbench` as its fourth argument (the parameter exists,
   `utils/lastViewpoint.ts:234`), so the view cannot land somewhere other than the place the label
   promised, not even when the active viewpoint changes between the render and the click.

Files: `frontend/src/components/editor-v2/EditorV2.tsx` only, plus `docs/claude-code-log.md` in its
own commit. Out of scope: `resolveParentViewpoint` and its priority chain (the Default fallback stays
where it is, this slice only stops the menu from reaching it), `createViewInWorkbench`, the tree, the
classic menu.

Acceptance: with a non-system viewpoint active, the entry reads `Create View in "<that viewpoint>"`
and the view is created there, field by field like the tree entry and the `+` dialog for the same
class; with none active it is disabled and creates nothing; no view is ever created inside
`Pointer_ViewPointDefault` from this menu. Typecheck same 33 with 0 in the touched file, vitest
green, build clean.

**Hard stop after the commit.** Report and do not start Fase B.

## Fase B, discovery read-only sulla rotta perduta di archi e righe

No user gesture creates an edge view or a row view today. The seeding exists
(`view/viewElement/view.tsx:469-491`, `DReference` to an edge seed and `DAttribute` to a row seed)
and the only callers are `addViewInstances` and `addViewSelf`, both inside the classic menu that
cannot open. Answer three questions, read-only, and stop.

1. **What does that seeding need from a caller?** `addViewInstances` reaches it through
   `newDefault`, which resolves its own parent viewpoint and its own name. State exactly what a new
   caller would have to pass, and whether `newDefault` can be called with an explicit viewpoint at
   all or whether that would need a parameter it does not have.
2. **Where could the two entries live?** Two candidates, and the report must say which one the code
   makes cheap rather than which one sounds nicer: the tree, on the attribute and reference rows
   (`StructuralFeatureRow` already exists and already renders them), or the v2 canvas menu, next to
   the `Create View` this prompt just fixed. For each, say what the entry would have in hand (the D
   element? only an id?) and what is missing.
3. **What happens to `key_bindings` and `closefunc`?** A table nothing dispatches and a callback
   nothing assigns are not a keyboard shortcut: they are two objects kept alive by the menu that
   cannot open. Say what depends on each today, so a later slice can decide between reviving a
   dispatcher and removing them. Do not remove anything now.

Report to `docs/discovery/`, naming standard,
`discovery_<data>_rotta_archi_righe.md`, then STOP. The Fase B hard stop is not complete until the
report is committed.

## Disciplina di corsia

Two other sessions are working in this tree tonight, one on the Symbol Editor modal and one on the
paper: their dirty files are expected and must not be touched. Assert the branch before writing.
Stage only your own files, one by one, never `git add .`. Commits: `fix: the v2 Create View entry
resolves its viewpoint once and never the system default`, then the log entry, then (Fase B) the
discovery report.
