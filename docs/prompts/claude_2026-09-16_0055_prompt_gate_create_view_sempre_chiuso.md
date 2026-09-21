# The "Create View" gate is always closed: three dead entry points

Date: 2026-09-16 00:55 (Europe/Rome)
Type: fix
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: high
Two-phase: NO. The census below was measured in chat before this prompt was written. If the code
contradicts it, STOP and say so instead of adapting.

## Il difetto

`lastEditedViewpointId` is a module-level variable in `utils/lastViewpoint.ts:15`. Its only writer
is `setLastEditedViewpoint` (`:18`), and a census of the whole `frontend/src` shows that function
has NO caller. `getLastEditedViewpointId()` therefore returns `null` always, and every gate built on
it is permanently closed:

- `TreeViewContent.tsx:661-674`, the classifier context menu of the tree: the single entry always
  renders disabled and labelled `Create View — open a viewpoint first`, even with a viewpoint open
  and active.
- `ContextMenu.tsx:486-491`, the canvas context menu on `DModel` / `DClass` / `DPackage` in Advanced
  mode: same, `Create View — open a viewpoint first`, always disabled.
- `ContextMenu.tsx:531-537`, the canvas `Add view` on M2 elements including `DAttribute` and
  `DReference`: same, always disabled.

The third one is the expensive one: `addViewInstances` on a `DReference` is what seeds an EDGE view
and on a `DAttribute` what seeds a ROW view (`view/viewElement/view.tsx:469-491`). With that entry
disabled there is today no way at all, from the UI, to create an edge view or a row view. The
perimeter note of the previous prompt said those paths were still alive: they are alive in the code
and unreachable in the interface.

`resolveParentViewpoint` (`lastViewpoint.ts:135-142`) also lists the tracker as its priority 1, so
that branch never fires and the resolution always falls through to priority 2, the active viewpoint.

## COSA

Make the gate ask what actually answers the question, «is there a viewpoint these views can be
created into», instead of a variable nobody writes.

1. Add one exported predicate to `utils/lastViewpoint.ts`, next to the resolver it mirrors:
   it returns true when the project has an active viewpoint that is NOT
   `Defaults.Pointer_ViewPointDefault`. That is exactly the condition priority 2 of
   `resolveParentViewpoint` already tests (`:147-148`), so the gate and the resolution agree by
   construction and cannot drift apart. Do not build a second derivation of «active viewpoint».
2. Use it at the three sites above in place of `!!getLastEditedViewpointId()`. The labels stay as
   they are, with one change asked for explicitly: replace the em dash in the three disabled labels
   with a colon (`Create View: open a viewpoint first`, `Add view: open a viewpoint first`). The
   labels become truthful for the first time, because now they really do describe the missing
   condition.
3. Do NOT remove the tracker (`setLastEditedViewpoint`, `getLastEditedViewpointId`,
   `getLastEditedViewpointName`, `clearLastEditedViewpoint`) and do NOT touch priority 1 of
   `resolveParentViewpoint`. Record in the log entry that the tracker has no writer, so a later
   slice can remove it deliberately with this census as its evidence.

## DOVE

- `frontend/src/utils/lastViewpoint.ts`: the new predicate only.
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`: `:661` and the two label strings.
- `frontend/src/components/contextMenu/ContextMenu.tsx`: `:487` and `:531` and their labels.
- `docs/claude-code-log.md`, separate commit, at the end.

Out of scope: `resolveParentViewpoint`, `createViewInWorkbench`, `newDefault`, the new view dialog
of the previous slice, `isAdvancedMode` (the two canvas entries stay Advanced-mode only, as they are
today).

## Criteri di accettazione

1. With a non-system viewpoint active: the tree entry on a class is enabled and creates the view in
   the active viewpoint; the canvas entries are enabled too.
2. With no viewpoint active (Abstract syntax selected in the toolbar): all three stay disabled and
   read `… : open a viewpoint first`.
3. In Advanced mode, on the canvas, `Add view` on a `DReference` creates an EDGE view and on a
   `DAttribute` a ROW view, both with their `ir` (this is the capability the closed gate was
   hiding). Check the created element's `ir.kind`.
4. A view created from the tree context menu is still field by field identical to one created from
   the `+` dialog for the same class, which is the invariant the previous slice established.
5. `npm run typecheck` shows the same 33 pre-existing errors and none in the touched files, vitest
   green, `npm run build` clean.

## Disciplina di corsia

Other sessions may be working in this tree; their dirty files are expected and must not be touched.
Assert the branch before writing. Stage only the files listed in DOVE, one by one, never `git add
.`. Two commits: `fix: gate Create View on the active viewpoint instead of a tracker nobody writes`,
then the log entry.

## Errata (2026-09-16, written after the execution)

**Acceptance criterion 3 is unattainable and is withdrawn.** The census of «Il difetto» is exact —
`setLastEditedViewpoint` has no caller, so the three gates are closed always — but two of the three
entry points cannot open at all, which the gate has nothing to do with:

- `ContextMenu.tsx:487` and `:531` live in `components/contextMenu/ContextMenu.tsx`, mounted only by
  `MetamodelTab.tsx:184` and `ModelTab.tsx:42`, whose popup renders only when `display` is set. Its
  sole writer, `ShowContextMenu` (`:77-88`), walks up the DOM for an ancestor carrying
  `data-nodetype="Graph"`, emitted only by `common/UX.tsx:149` — part of the classic canvas that
  Fase 5a stopped mounting. The archived log entry of 2026-08-13 (§8) already recorded this.
  Measured on the live app: calling `windoww.ShowContextMenu(vertexId, 300, 300)` leaves the node at
  `#ctxhidden`, `display: none`, and a right-click on the v2 canvas opens EditorV2's own menu
  instead (`editor-v2/ContextMenu`, mounted at `EditorV2.tsx:4334`).
- The keyboard escape hatch is dead too. `key_bindings.addView` (Ctrl+Alt+V, `:667`) is registered
  by a jQuery DELEGATED handler on `document` with selector `#root` (`common/U.tsx:3535`), and it
  fires only when the keydown target **is** `#root`. After any real gesture the focus sits on
  `BODY`, and `#root` is a plain div that can never take focus, so the chord never reaches the
  handler: measured, no view created, with an unbound chord as the control.

So the capability the closed gate seemed to hide — `addViewInstances` seeding an EDGE view from a
`DReference` and a ROW view from a `DAttribute` — **exists in the code and has no reachable gesture
today**. Dispatching a `keydown` whose target is `#root` does run it, and it creates exactly those
two kinds (`ir.kind` `edge` and `row`), then throws `closefunc is not a function`. Giving those two
kinds a reachable entry point is a separate slice, not this one.

Criteria 1, 2, 4 and 5 were met by the tree entry, the one reachable site: measured 8 PASS 0 FAIL.
