# Discovery — S2 plan: creation menu and slot synthesis (ontological instantiation)

- Prompt-ID: P-2026-10-21-0040 (chat C-2026-10-20-1835, front `instance-of`), Phase 1 of S2
- Session: ad02d142-9853-4467-8dcb-66b55fdf1d58
- Tree: `~/jjodel-w-oi-s2`, branch `oi-s2`, HEAD `38590daf8`
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## 1. Objective

Plan S2 of discovery P-2026-10-20-1835 §8: a store adapter implementing `OntoReadView`, the slot synthesis
`instantiate(classifierId, record)`, the pane context menu «New instance of ▸ <Class>» and the class-node entry
«New instance», with no critical-zone file touched. Phase 2 follows in the same session (RC-25).

## 2. Hypotheses under test

1. **H1 — the editor-v2 canvas has no pane context menu.** Holds [M, this phase]: `command grep -rc onPaneContextMenu`
   over `frontend/src/components/editor-v2` returns no file with a non-zero count; the positive control
   `onNodeContextMenu` on the same command returns `EditorV2.tsx:2` and `nodes/ClassNode.tsx:1`.
2. **H2 — `createInstance` is enough to create the instance, its slots and the value objects without a creator
   literal.** Holds [R]. `hooks/createAdapter.ts:491` takes `(modelId, className, ownerId, childKey, seed)`; a root goes
   to `lModel.addObject(json, classId, true)` (`:536`), a contained child to `slot.addObject(json, classId, true)`
   (`:532`) with the comment `// No outer TRANSACTION: addObject opens its own around DObject.new3.` (`:531`).
3. **H3 — a contained create needs the owner's slot DValue to exist first.** Holds [R]: `createInstance` resolves
   `lOwner?.['$' + childKey] ?? (lOwner?.features ?? []).find(...)` (`:525-526`) and returns
   `feature "<key>" is not on this object` when neither resolves (`:529`); the DValues of a new object exist only after
   the constructor actions run (discovery §3.3, `LModelElement.tsx:7420` quoted there: `because at current time
   Constructor.setPtr actions are not executed yet. so dobject.features is empty`). So the synthesis waits for each
   owner slot to resolve before the next create. To be measured in Phase 2.
4. **H4 — a root instance gets a vertex from `useJjomSync` Step 2bis, at a grid position, not at the click point.**
   Holds [R]: `hooks/useJjomSync.ts:743-757` iterates `rawModel.objects`, skips `vertexIdByModelId.has(objId)`, and
   places at `x = 50 + col * COL_W`. A vertex created right after the create through the exported
   `createVertexForObject(graphId, objectId, x, y)` (`sync/canvasToJjom.ts:1454`) is the one Step 2bis sees and skips,
   the same sequence `syncCreateObject` uses (`:1520-1533`: `DObject.new(...)` then `createVertexForObject`).
   `createAdapter.ts:90` already imports it: «Importing them adds a caller; it does NOT modify the sync layer».
5. **H5 — the live `ContextMenu` cannot show a cascade.** Holds [R]: `ContextMenu.tsx:3-17`, the fields are `label`,
   `icon`, `danger`, `disabled`, `tooltip`, `onClick`, `divider`, `header`; no `children`.

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-oi-s2/docs/decisions.md` 6340-6394 (R-OI-1..11)
- `/Users/alfonso/jjodel-w-oi-s2/docs/log-inbox/instance-of.md` (whole)
- `/Users/alfonso/jjodel-w-oi-s2/docs/discovery/discovery_2026-10-20_ontological_instantiation.md` 72-303, 505-578
- `/Users/alfonso/jjodel-w-oi-s2/frontend/src/model/ontological/bindingReader.ts` (whole), `bindingCodec.ts` (whole)
- `/Users/alfonso/jjodel-w-oi-s2/frontend/src/components/editor-v2/hooks/createAdapter.ts` 1-180, 290-602
- `/Users/alfonso/jjodel-w-oi-s2/frontend/src/components/editor-v2/ContextMenu.tsx` (whole)
- `/Users/alfonso/jjodel-w-oi-s2/frontend/src/components/editor-v2/EditorV2.tsx` 196-215, 340-364, 2318-2345,
  2995-3104, 3300-3444, 3676-3700, 4985-5005 (windows, not the file)
- `/Users/alfonso/jjodel-w-oi-s2/frontend/src/components/editor-v2/EditorV2.scss` 4035-4184
- `/Users/alfonso/jjodel-w-oi-s2/frontend/src/components/editor-v2/sync/canvasToJjom.ts` 1440-1550 (read only)
- `/Users/alfonso/jjodel-w-oi-s2/frontend/src/components/editor-v2/hooks/useJjomSync.ts` 730-790 (read only)
- `/Users/alfonso/jjodel-w-oi-s2/frontend/scripts/probe/uml-class-object-fixture.ts` 1-330, 600-729, 910-985

## 4. Design

### 4.1 `hooks/instantiate.ts` (new)

Split as `createAdapter.ts` / `createDraw.ts` are split, inside one file: everything the bench must reach imports
nothing from the joiner (which pulls monaco and fails at import under vitest, CLAUDE.md §17); the store and
`createInstance` are reached by a dynamic `import()` inside the impure functions only.

- `ontoReadView(get: (id) => record | undefined): OntoReadView` over the store's D records (`store.getState().idlookup`
  in the app, a plain object in the tests). `metaclassOf` = `instanceof`; `referenceTargets` = the `values` of the
  object's DValue whose `instanceof` is the feature, string ids only; `attributeValue` = its first value; `ownerOf` =
  the feature's `father`; `conformsTo` = a walk of `extends` over every parent with a visited set (multiple inheritance,
  cycles tolerated). Reads only. Decision: the D records, not the L proxies, so the bench imports it (the
  `createAdapter.ts` `lookup()` precedent, `:100`); see question 1.
- `readOntoBindings(get, modelId)`: the M1 model's `instanceof` is the metamodel; its `_state.ontoBindings` through
  `decodeOntoBindings`. A record named `object` is the menu's (the prompt: «for the record `object`»).
- `modelObjectIds(get, modelId)`: the roots of `model.objects` and, breadth first, every object contained in their
  slots (`father` is the slot), each once.
- `creationOptions(view, get, binding, modelId)`: `instantiableClassifiers` over those ids, sorted by name.
- `synthesisPlan(view, get, binding, classifierId)`: the pure plan: the instance metaclass (owner of `typeReference`),
  the slot metaclass (type of `slotContainer`), and per feature of `featureClosure`, in order, the slot seed and, when
  the feature has a `defaultValue` and `valueKinds` has an entry for its type, the value object (metaclass `create`,
  field `field`, the value typed by the field's type: EBoolean, EInt/numeric, else string; `instance` kind: the M1
  object classified by the type whose name is the default). Names from the D records, because `createInstance` takes
  names.
- `instantiate(classifierId, record, at?)`: async. Creates the instance (`name` = the classifier name, first letter
  lowered, plus the first free integer), places its vertex at `at` with `createVertexForObject`, waits for `$slots`,
  creates the slots one by one in closure order, waits for each slot's value holder and creates the value. Returns the
  ids. No outer TRANSACTION, no creator literal.

### 4.2 `ContextMenu.tsx`

Optional `children?: ContextMenuItem[]` on `ContextMenuItem` (rule 11: an optional property). An item with children
renders a chevron and opens a second `.context-menu` panel beside it on hover or click, positioned from the item's
`getBoundingClientRect()` (fixed, as the root panel), flipped left near the viewport edge. One recursive panel
component; leaf behaviour unchanged.

### 4.3 `EditorV2.tsx` insertion points

- `ContextMenuState` (`:343`, module-local, not exported): add `pane?: boolean` and `flow?: {x, y}`.
- After `onEdgeContextMenu` (`:3014-3024`): `onPaneContextMenu`, which opens the menu only when the M1 model's
  metamodel has an `object` record with at least one option; otherwise it returns without `preventDefault`, so the
  canvas behaves as today.
- `getContextMenuItems` (`:3176`): a pane branch before the final `return []` (`:3679`) with the cascade.
- Node branch (`:3302`): «New instance» before «Add reference» (`:3360`) when the node's object
  (`idlookup[node.id].model`) is in the option list.
- `<ReactFlow` props (`:4761-4765`): `onPaneContextMenu={onPaneContextMenu}`.

### 4.4 Stylesheet

`EditorV2.scss` holds `.context-menu` (`:4043-4146`). The cascade needs a chevron pushed to the right and an open-item
highlight: two rules inside the existing block, existing tokens only (rule 28).

## 5. Risks

1. **Waits on deferred writes.** The synthesis polls for the owner slot (H3) with a bounded timeout; a slow store makes
   a partial instance (instance without some slots). Reported, never thrown; R-OI-3 reconciliation (S3a) mends it.
2. **Undo count.** Each `createInstance` is its own entries; the discovery measured 5 entries and 9 Cmd+Z for 1 + 3.
   Declared, measured in the probe, fixed by S2u (core, awaits Alfonso).
3. **`createVertexForObject` from a non-critical file.** A caller, not an edit; same pattern as `createAdapter.ts:90`.
   If Step 2bis still adds a second vertex, the probe shows two vertices for one object and the design falls back to
   Step 2bis placement.
4. **The fixture project is imported from `~/jjodel-demo-exports/uml/uml-class-object.jjodel`** (347045 bytes,
   2026-10-21 00:20, present [M]), not rebuilt; the probe writes the binding through `mm.state`.
5. **`EditorV2.scss` is a sixth file** only if the cascade needs CSS: the prompt's DOVE names «its stylesheet»; the
   menu's stylesheet is `EditorV2.scss`. Counted in the closing diff.

## 6. Open questions (adopted as recommended, RC-21/RC-25)

1. Read view over the D records rather than the L proxies? Recommended: D records (bench-importable, read only).
2. Instance name? Recommended: the classifier name with the first letter lowered plus the first free integer (`book1`).
3. Where does «New instance» on a class node place the instance? Recommended: to the right of the class node, 80 px.
4. Which record feeds the menu? Recommended: the record named `object` only (links are S4).
