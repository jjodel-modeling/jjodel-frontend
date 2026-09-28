# Discovery — the lost route to edge and row views

Date: 2026-09-16
Prompt: `docs/prompts/claude_2026-09-16_0951_prompt_menu_v2_viewpoint_e_rotta_archi_righe.md`, Fase B
Branch: `validation-skeleton`, HEAD `cd7794ae1` (Fase A committed in `86f822d50`)
Read-only: no file under `frontend/src` was modified in this phase.

## 0. One premise of the prompt is contradicted, and it matters

The prompt states that `key_bindings` «is a table NOTHING dispatches: there is no `keydown` listener
in that file». The table **is** dispatched, by `ContextMenu.tsx:711`:

```ts
Keystrokes.register('#root', 'ctxmenu', Object.values(key_bindings));
```

`Keystrokes.register` (`common/U.tsx:3439`) installs a jQuery **delegated** handler on the document
(`:3535`): `$doc.off('keydown.'+src, selector, keydown).on('keydown.'+src, selector, keydown)`. The
listener is not in `ContextMenu.tsx`, which is why a grep of that file finds none, but the table is
its payload.

Measured last night (`_tmp_gate_keybind.ts`, reported in the 00:55 Errata): a `keydown` carrying
`ctrlKey`, `altKey` and `key: 'v'` **whose target is `#root` itself** runs `addViewKeybind` and
creates a view; the identical event dispatched on a tree row does not; after any real gesture
`document.activeElement` is `BODY`. So the accurate statement is: **the table is alive, registered
and unreachable**, because `#root` is a plain div that never takes focus. The distinction decides
what a later slice does — reviving a dispatcher would be the wrong fix, since the dispatcher exists.

## 1. What the seeding needs from a caller (Q1)

`DViewElement.newDefault(forData?: DModelElement | DGraphElement, forSelf: boolean = false)`
(`view/viewElement/view.tsx:400`).

| What it needs | Where | Detail |
|---|---|---|
| the **D** element, not the L proxy | `:408-422`, `:457` | it switches on `forData.className` and embeds `forData.id` in the OCL string; both callers pass `D.fromPointer(id)` (`ContextMenu.tsx:615,625`) |
| `forSelf === false` | `:457` | the seed block is `if (forData && !forSelf)`; with `forSelf` true the view targets that one element by id and is left unseeded, deliberately |
| nothing else | — | name and parent viewpoint are computed inside |

What it produces for the two kinds:

- `DAttribute` → `computeCreationSeed({ kind: 'row' })` (`:467-471`), **with no metaclass at all**:
  a row is born unbound by construction and the author picks the metaclass in `RowAuthoringPanel`.
- `DReference` → `computeCreationSeed({ kind: 'edge', metaclassName, metaclassId })` (`:472-493`),
  where the metaclass is the reference's **owner class**, read as `l.father` and accepted only when
  `owner.className === 'DClass'` (the D-layer name, CLAUDE.md §3.13); if it does not resolve, the
  edge is seeded without metaclass rather than refused.

**Can it be told which viewpoint?** No. It resolves its own (`:427-436`): the active viewpoint
unless that is `Pointer_ViewPointDefault`, otherwise the Default itself. There is no parameter, and
the name computation just below (`:438-443`) reads `parentView.subViews`, so the viewpoint is needed
before the name. Handing it an explicit viewpoint requires **a new parameter**, not just a different
call.

The other creator, `createViewInWorkbench(elementId, elementName, className, viewpointId?)`
(`utils/lastViewpoint.ts:234`), is the mirror image: it **does** take the viewpoint (4th argument,
used by three call sites today) but its switch covers `DClass`, `DEnumerator`, `DModel`, `DPackage`
only; `DAttribute` and `DReference` fall into `default:` (`:299-303`), which raises
«Cannot create view for …» and returns `null`.

**So the gap is one function short on each side**: the creator that knows the two kinds cannot be
told where to put the view, and the creator that can be told where has no branch for the two kinds.

## 2. Where the two entries could live (Q2)

### The v2 canvas menu — the cheap one, by the code

The per-feature channel **already exists end to end**:

- `ClassNode.tsx` dispatches on right-click of an attribute row (`:759`), a cross-metamodel
  reference chip (`:697`) and an operation (`:836`):
  `new CustomEvent(JjodelEvents.CHILD_CONTEXT_MENU, { detail: { childId, childKind: 'attr'|'ref'|'op', nodeId, x, y } })`.
- `EditorV2.tsx:2836-2848` listens and stores `{x, y, nodeId, childId, childKind}` as the context
  menu state (the field is typed at `:331`).
- `getContextMenuItems` already branches on it: `childKind === 'ref'` returns «Delete reference»
  (`:2959-2987`), the other child kinds return «Delete Attribute/Operation» (`:2989+`).

In hand at that point: **the DAttribute / DReference id** (`childId`), the owning node id, and the
active viewpoint through the same `hasCreatableViewpoint()` / `resolveParentViewpoint()` pair the
sibling entry uses since `86f822d50`. Missing: only the creator of §1. Caveat to verify before
building: the `ref` branch is fed by the **ghost-target chip** (cross-metamodel references); whether
plain reference rows dispatch the same event was not established here.

### The tree, on the feature rows — needs one more mount

`StructuralFeatureRow` (`TreeViewContent.tsx:1264`, mounted at `:1385` and `:1395`) receives
`feature: TreeStructuralFeatureData` — `{id, name, typeName, multiplicity}` — plus
`kind: 'attribute' | 'reference'`. So it has **an id, a name and the kind, not the D element**; the
D element is one `DPointerTargetable.from(feature.id)` away, the same line the viewpoint row already
runs.

What is missing is the menu itself: `useClassifierContextMenu(elementId, name, className)` (`:616`)
is mounted on class (`:1341`), package (`:1438`) and metamodel (`:1608`) rows, and **not** on feature
rows. Mounting it there is mechanical, but its single entry calls `createViewInWorkbench`, i.e. the
creator without the two branches — the same missing piece, plus one extra mount.

**Verdict asked for**: the v2 canvas is cheaper. Event, listener, per-kind branch and id already
exist and the menu is reachable; the tree would need a new context-menu mount and lands on the same
creator gap anyway.

## 3. `key_bindings` and `closefunc` (Q3)

### `key_bindings` (`ContextMenu.tsx:656-700`, 8 entries)

Two consumers, both inside that file:

1. **The classic menu's own items**, which use `key_bindings.<x>.function` as their onClick:
   `delete` (`:432`), `up` (`:437`), `down` (`:438`), `extend` (`:523`), `metrics` (`:527`).
   Dead while the popup cannot open.
2. **The keystroke registration** at `:711`, which is a real dispatcher (§0). `addView`
   (Ctrl+Alt+V), `metrics` (Ctrl+Alt+B), `close` (Escape), `asize`, `extend`, `delete`, `up`,
   `down` all hang from it. Alive, never reached by a user gesture.

No other file in `frontend/src` mentions `key_bindings` or `KeyBind` (measured; the only matches are
in `ContextMenu.tsx` itself).

### `closefunc` (`ContextMenu.tsx:239`)

Declared `let closefunc: (panelClick?: boolean)=>void = null as any` and assigned **only** at `:300`,
inside `ContextMenuComponentInner`, i.e. only when the classic popup renders. Read at:

- `:212` and `:215`, the wrapper every `ContextEntry` onClick goes through;
- `key_bindings.close.function()` (`:669`), called at the tail of `addViewSelf` (`:621`),
  `addViewInstances` (`:631`) and `addViewToWorkbench` (`:642`).

That tail is the measured `closefunc is not a function`: the view is created first, the throw lands
on closing a menu that never opened. Anything that calls those three functions from outside the
classic popup inherits the same throw.

## 4. Who else depends on priority 3 of `resolveParentViewpoint` (Q4, census only)

Priority 3 is `utils/lastViewpoint.ts:157-162`, the `Pointer_ViewPointDefault` fallback. **It is
reachable only through `createViewInWorkbench` called without its 4th argument** (the function
resolves on its own) or through a direct call for a label:

| Call site | Passes a viewpoint? | Can reach priority 3 today |
|---|---|---|
| `ContextMenu.tsx:641` (`addViewToWorkbench`) | no | yes in code, no in fact: the popup cannot open |
| `TreeViewContent.tsx:657` (tree classifier menu) | no | **yes** — gated at render by `hasCreatableViewpoint()` (`:661`), but the creator re-resolves at click: the same double resolution Fase A removed from the v2 menu still lives here |
| `EditorV2.tsx:3274` (v2 classifier menu) | yes, since `86f822d50` | no |
| `EditorV2.tsx:3323` (views-editor entry) | yes (`index.viewpointId`) | no |
| `TreeViewContent.tsx:1950` (`+` dialog, class branch) | yes (`vp.id`) | no |

**The same policy is duplicated in three places outside the chain**, which is the part that decides
whether removing priority 3 would mean anything:

- `DViewElement.newDefault` (`view.tsx:429`, `:436`) carries its own copy — active viewpoint unless
  it is the Default, else the Default. Callers: the two classic functions only.
- `DViewElement.new2` (`view.tsx:394`): `father0 || DPointerTargetable.from(Defaults.viewpoints[0])`
  — any caller that passes no father parents the view in the Default.
- `Constructors.DViewElement` (`joiner/classes.ts:1250`):
  `if (!vp) vp = LProject.getProject()?.activeViewpoint?.id || Defaults.viewpoints[0]` — the
  constructor-level fallback for the `viewpoint` pointer itself.

So «a view can never be born inside `Default`» does **not** follow from removing priority 3: four
sites implement the fallback, three of them outside `resolveParentViewpoint`.

For completeness, the readers that depend on the Default viewpoint **existing** (not on the
fallback), and that a removal would have to be checked against: `Toolbar.tsx:281,304`
(system-viewpoint filter), `selectors.ts:557` (`VP_Default` scoring step), `Dashboard.tsx:502`
(delete disabled), `MegamodelView.tsx:157`, `reducer.ts:1104`, `store.tsx:323` (the seed itself),
`VersionFixer.tsx:1185`, `joiner/classes.ts:3477`.

## 5. Open questions for Alfonso

1. **Which host** for the two entries: the v2 child menu (cheaper, measured above) or the tree rows?
2. **Which creator** gains the missing capability: `createViewInWorkbench` gaining `DAttribute` and
   `DReference` branches (it already takes the viewpoint and already seeds through
   `computeCreationSeed`), or `newDefault` gaining an explicit viewpoint parameter?
3. **The tree classifier menu still resolves twice** (`TreeViewContent.tsx:657`). Fase A fixed only
   the v2 menu, because that was the declared perimeter. Worth its own slice?
4. **The four Default fallbacks**: converge them before deciding anything about priority 3, or leave
   the duplication and keep gating upstream?
