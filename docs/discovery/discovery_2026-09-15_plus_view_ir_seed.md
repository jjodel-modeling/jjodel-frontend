# Discovery — the viewpoint «+» seeding a vertex IR

Date: 2026-09-16 (file name as the prompt fixes it, `2026-09-15`)
Prompt: `docs/prompts/claude_2026-09-16_0011_prompt_plus_crea_view_ir.md`, Fase 1
Branch: `validation-skeleton`, HEAD `d0e920323`
Probe: `docs/discovery/harness/probe_2026-09-16_plus_view_ir_seed.mts`, 26 PASS 0 FAIL, exit 0

## 0. Hypotheses this discovery tries to falsify

- **H1**: a wildcard vertex view born inside the active viewpoint is a harmless click. The canvas
  looks the same before and after.
- **H2**: an IR view with no `appliableTo` and no `oclCondition` is incomplete. Some consumer
  still needs them.
- **H3**: the wildcard can be narrowed from the UI afterwards, so the «+» does not only make
  default views.

Verdict: **H1 is false** (§2). **H2 is false** for the readers, with one exception: the
2026-08-16 invariant that `ir.kind` alone writes `appliableTo` (§3). **H3 holds**, with one
transient hazard (§4).

## 1. Objective and method

The objective is to answer the prompt's three questions from the resolution path, before any
code changes. Nothing was written to a project. The probe executes the subject (P11): the exact
seed call Fase 2 would make, then `getIRIndex` + `resolveIRView` (the canvas),
`renderedMetaclassNames` (the tree scope), `deriveIRInteraction` (the palette) and
`isMigratedDefaultView` (ObjectNode's delegation test). They run on synthetic states with the
store's shape (`viewpoint`, `viewelements`, `idlookup`). The positive control (P12) files the
same seeded view under a non-active viewpoint. The index must stay null there, and it does
(`Cc1`).

Not executable under node, so declared rather than mirrored: ObjectNode's `notRendered` flag and
the React authoring panels. Their consumers are cited by file:line below.

Run: `cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-16_plus_view_ir_seed.mts`.
Also run: `npx vitest run .../irCreationSeed.test.ts .../irValidate.test.ts`, 2 files 44
passed, exit 0.

## 2. Files read (full paths)

- `/Users/alfonso/jjodel/frontend/src/utils/lastViewpoint.ts`
- `/Users/alfonso/jjodel/frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (180-228, 640-680, 1864-1935, 2400-2420, 2570-2712)
- `/Users/alfonso/jjodel/frontend/src/components/TreeViewSidebar/treeViewScope.ts` (85-140)
- `/Users/alfonso/jjodel/frontend/src/components/editors/views/ViewData.tsx` (60-182)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irCreationSeed.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (19-70, 136-151)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (95-140, plus a grep of the whole file)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (1-100, 180-240)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (55-140)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (110-135)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` (100-160)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (125-131, 405-420)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/__tests__/irIndexViewpoint.test.ts` (1-80)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (140-440)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (95-160)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (55-70)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (95-295, 725-775, 885-930, 1194-1380)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.tsx` (195-215, 1098-1120, 3265-3290)
- `/Users/alfonso/jjodel/frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (1500-1545)
- `/Users/alfonso/jjodel/frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` (150-180)
- `/Users/alfonso/jjodel/frontend/src/components/forEndUser/Tree.tsx` (228-242)
- `/Users/alfonso/jjodel/frontend/src/view/viewElement/view.tsx` (160-200, 375-532, 636-670)
- `/Users/alfonso/jjodel/frontend/src/view/viewPoint/viewpoint.ts` (85-110)
- `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` (685-697, 1157-1180, 1236-1262)
- `/Users/alfonso/jjodel/docs/decisions.md` (690-760)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-08-13_view_creation_sites_ir_native.md` (123, 295-330)

## 3. Q1 — what a wildcard vertex view does to the active canvas

### 3.1 The seed

`irCreationSeed.ts:112-117`:

```ts
const vertex: VertexViewIR = {
    ...defaultObjectViewIR(),
    metaclasses: metaclassName ? [metaclassName] : '*',
    ...(pins ? { authoringMetaclassPins: pins } : {}),
    ...(label ? { label } : {}),
};
```

`defaultObjectViewIR()` (`irDefaults.ts:30-53`) gives `priority: 0` and `exclusive: true`. It
also gives `shape: { form: 'rect', labels: [{ position: 'top', source: { from: 'intrinsic',
prop: 'qualifiedName' } }] }` and one `fieldCompartments` entry with `source: { from:
'attributes' }` and row format `name = value`. Probe A1-A6: the seed is not null, `metaclasses`
is the string `'*'`, there is no pin, `label` is the unique name, and `validateIR` accepts it.

### 3.2 When it reaches the canvas

The view reaches the index only when its `viewpoint` is `state.viewpoint`.
`irResolveCore.ts:130`: `if (!d || d.viewpoint !== vp) continue;`. `new2` sets `viewpoint` from
the father (`view.tsx:394-397`, `let vp = father.viewpoint || Defaults.viewpoints[0]`, then
`classes.ts:1255` `this.setPtr('viewpoint', vp)`). That is the same path `createViewInWorkbench`
already takes. The «+» is mounted on every `ViewpointNode` (`TreeViewContent.tsx:1864`), and
those are mounted under Syntax (`:2582`), Validation (`:2676`) and the unfiled bucket (`:2703`).
**A click on a non-active viewpoint does not touch the canvas** (probe `Cc1`). Everything below
is about the active one.

### 3.3 Resolution, measured

The wildcard entry is a candidate for every object at specificity 0
(`irResolveCore.ts:298`, `for (const e of index.wildcard) { ... specificity: 0 }`). The order is
priority, then specificity, then declaration order (`:63-65`).

| Active viewpoint before the click | Before | After | Probe |
|---|---|---|---|
| **No IR view at all** | `getIRIndex` → `null` (`:252`, `if (viewIds.length === 0) return null`) | index present, `wildcard.length === 1`, **every object resolves to the new view** | B1, C1-C3 |
| **IR views for some metaclasses** (e.g. `State`) | `State`, `SubState` → their view; `Transition` → `null` | `State`, `SubState` unchanged (specificity 2/1 beat 0); **`Transition` → the new view** | D1, E1 |
| **Already holds a wildcard vertex view** | every unmatched object → the old wildcard | unchanged: the new view loses on declaration order and draws nothing | F1 |

### 3.4 How ObjectNode renders each outcome

`ObjectNode.tsx:107` `useIRView`, `:111` `useIRViewpointActive` (true iff the index is non-null,
`irResolve.ts:137-143`), `:116` `irDelegated`, `:737`:

```ts
const notRendered = irViewpointActive && !irResolution && !isOrphan;
```

- **No index** (case 1, before): native branch (`:1194-1380`). The header carries the
  name and type; slot rows cover attributes **and** references (`:621`
  `const isRef = f.featureKind === 'reference'`); lazy placeholders come from
  `missingAttributes` (`:213-241`); a singleton holding nothing gets the pill (`:744`).
- **Resolved, not delegated**: IR branch (`:889` `if (irResolution && !irDelegated)`, JSX
  `:905-929`, content by `IRNodeContent`). The seed is **not** delegated. `isMigratedDefaultView`
  (`irDefaults.ts:136-151`) is true only for `IR_DEFAULT_OBJECT_VIEW_ID` or
  `migratedFrom === 'classic-default'` with a factory-identical hash. The seed has neither
  (probe C4 → `false`).
- **Index present, object unresolved** (case 2 before, `Transition`): neutral node, header only
  (`:1375` `{(!hasFeatures || notRendered) && <div className="mm-node__empty" />}`).

**So `defaultObjectViewIR()` does NOT render like «no view matches».** Measured transitions:

1. **Viewpoint with no IR views** (the common case for a fresh viewpoint): every object moves
   from the native node to the IR default object. A rect with a `qualifiedName` label on top and
   one compartment of `attribute = value` rows. Reference slots leave the node body, because
   `'attributes'` and `'references'` are distinct compartment sources (`irTypes.ts:130`). The
   pill and the lazy placeholders are native-only. The M1 reference edges are untouched:
   `decorateReferenceEdges` returns `edges` as-is when the index has no edge view
   (`irEdgeViews.ts:126`).
2. **Viewpoint with specific views**: the objects the viewpoint deliberately left neutral stop
   being neutral and render as the IR default object. The objects it already styled are
   untouched.
3. **Viewpoint with a wildcard already**: nothing on the canvas.

Two side effects that go with 1 and 2 and are not on the canvas nodes:

- **Tree scope dimming switches off.** `renderedMetaclassNames` returns `null` as soon as any
  wildcard bucket is non-empty (`irInteraction.ts:228`), and `computeTreeViewScope` returns
  `null` with it (`treeViewScope.ts:105-106`). Probe D2 → `['State']`, E2 → `null`.
- **Palette restriction switches off.** `irInteraction.ts:83-85`:
  `paletteMetaclasses: !hasWildcardNodeView && palette.size > 0 ? Array.from(palette) : null`.
  Probe D3 → `['State']`, E3 → `null`.

Out of reach of the «+»: the Data Manager index reads its own singleton
(`InstanceManagerTab.tsx:1532-1536`, `computeIRSignature(state, DATA_MANAGER_VIEWPOINT_ID)`).
The singleton has no `ViewpointNode` row: it is listed under its own section
(`TreeViewContent.tsx:2612-2640`, `DataManagerClassNode`) and removed from the three buckets
(`:2405-2408`).

A stale comment was found and not touched: `ObjectNode.tsx:108-110` says «with no IR
viewpoint, or a wildcard one, the object keeps rendering in full». That holds for a delegated
migrated default. A non-delegated wildcard renders through the IR branch (probe C4).

### 3.5 Answer

The «+» is **not** a harmless click on the active viewpoint. It is visible on the canvas in
cases 1 and 2 (§3.3), and it turns off the tree dimming and the palette filter. On a non-active
viewpoint, or on one that already has a wildcard vertex view, it is inert on the canvas.

## 4. Q2 — `appliableTo` and `oclCondition`

### 4.1 The IR pipeline reads neither

`irResolve.ts:6-9`: «The resolver operates ONLY on views carrying the `ir` field: it never calls
getAppliedViewsNew». The probe's view records carry **no** `appliableTo` and **no**
`oclCondition`, yet they index and resolve (C1-C3, E1, G4).

### 4.2 Every reader of `appliableTo`

Measured with `command grep -rln "appliableTo[^C]\|appliableTo$"` over `frontend/src`, exit 0,
excluding tests. Non-example hits:

| File | Nature | Relevant to an IR vertex view? |
|---|---|---|
| `joiner/classes.ts:1169` | constructor default `'Any'` | the value a blank view has today |
| `view/viewElement/view.tsx:181-188, 517, 656` | `appliableToForIRKind`, the derivation in `newDefault` and `set_ir` | **the invariant, see 4.3** |
| `redux/VersionFixer.tsx:859, 889` | `if (e.appliableTo !== 'Edge') continue;`, edge migrations | no |
| `components/editors/views/data/GenericNodeData.tsx:26`, `FieldData.tsx:18-38` | the legacy Options tab (`ViewData.tsx:173-179`) | no: the legacy bar is replaced when `irKind` is set (`ViewData.tsx:106-114`) |
| `redux/selectors/selectors.ts:450, 479, 550` | comments only | no |
| `common/DV.tsx:1057`, `redux/defaults/views.ts`, `DataManagerViewpointPanel.tsx:173`, `irDemoFixture.ts:133,139` | writers | no |
| `irKindConvert.ts:7`, `irTabs.tsx:132` | comments pointing at `set_ir` | no |
| `components/forEndUser/Tree.tsx:238-240` | reads `appliableToClasses`, not `appliableTo` | no |

Tree and megamodel: the tree's kind column is derived from `ir.kind`
(`TreeViewContent.tsx:189-197`, `SUBVIEW_KIND_LABEL['vertex'] = 'Vertex'` at `:221`). A blank
view today has no label (`'unknown'` → `null`, `:225`); the seeded one will read `Vertex`. No
megamodel file appears among the readers.

### 4.3 What does require `appliableTo: 'Vertex'`: the ratified invariant, not a reader

`view.tsx:168-173`: «`appliableTo` derivato da `ir.kind` (ratifica 2026-08-16). Il campo legacy
non è ritirabile [...] Resta quindi scritto, ma da un writer solo: il kind dell'ir.» `set_ir`
(`view.tsx:647-657`) writes both fields in one TRANSACTION «così non esiste uno stato intermedio
in cui il discriminatore legacy contraddice l'ir». `newDefault` repeats the derivation inside the
`new2` callback (`view.tsx:511-518`), because a seed written on the D object bypasses `set_ir`.
The other two seeding paths also write `'Vertex'` next to a vertex `ir`:
`createViewInWorkbench` (`lastViewpoint.ts:318`) and `createClassView`
(`DataManagerViewpointPanel.tsx:173`).

A seeded blank view left at the constructor's `'Any'` would be the only IR view in the product
whose legacy discriminator contradicts its kind. No reader breaks today, but it would break the
invariant.

**Conclusion Q2**: write `d.appliableTo = 'Vertex'` in the `new2` callback. The reason is the
2026-08-16 invariant, not a consumer. `appliableToForIRKind` is module-private in `view.tsx`
(`function`, not `export`), and `view.tsx` is out of scope. The literal `'Vertex'` is therefore
what `createViewInWorkbench` already writes at `:318`.

**`oclCondition`: do not write it.** The constructor default is `''` (`classes.ts:1180`,
`thiss.oclCondition = oclCondition || ''`). Its readers are the classic machinery and the legacy
Apply-to surfaces: `selectors.ts`, `ocl/ocl.tsx`, `utils/LazyOCL.ts`, `Ocl.tsx`, `InfoData.tsx`,
`edgeCandidate.ts`. None of them is reached by an IR view. With no metaclass there is also no
query to build: `createViewInWorkbench`'s queries all embed an `elementId`
(`lastViewpoint.ts:264-297`), which the «+» does not have.

### 4.4 Persistence in one action

`classes.ts:688`, `if (simpledatacallback) simpledatacallback(this.thiss, this);`, runs before
`:693`, `Constructors.persist(this.thiss);`. Writing `ir` and `appliableTo` in the callback
persists the view with both on it, as at `lastViewpoint.ts:321-324`.

## 5. Q3 — one-way door?

- **`validateIR` accepts the wildcard.** Probe A6. `irValidate.ts` has no metaclass rule:
  `command grep -c "metaclass"` returns 0, with a positive control of `kind` → 4 on the same file.
  The existing test `irCreationSeed.test.ts:47-52` («senza metaclasse: wildcard STRINGA, non
  ["*"]») is green.
- **The author can narrow it.** `MatchingSection` is mounted in the `Applies to` tab body
  (`VertexAuthoringPanel.tsx:405-421`), «reachable in Basic too since the partition (R-3)».
  `ir-applies-to` is the first vertex tab (`irTabs.tsx:64-68`). The section offers the toggle
  «All metaclasses (*)» (`MatchingSection.tsx:151-153`). `setWildcard(false)` writes
  `metaclasses: []` (`:111-112`). The picker, shown only `{!isWildcard && ...}`, appends the name
  and its pin (`:118-125`). Probe G3-G5: the narrowed shape validates, leaves the wildcard bucket,
  and brings back the tree and palette restrictions.
- **R-IRN-4 already allows it**: `decisions.md:710-711`, «A3 (blank dal «+»): [...] la metaclasse
  può restare wildcard e stringersi dopo».

**Answer Q3**: not a one-way door.

**Transient hazard found on the way**: the narrowing goes through an intermediate
`metaclasses: []`. That shape passes `validateIR` (probe G1), so the panel commits it after the
300 ms debounce (`VertexAuthoringPanel.tsx:147-160`, `:72` `COMMIT_DEBOUNCE_MS = 300`). With `[]`
the view still enters `viewIds` (`irResolveCore.ts:249`), so the index is non-null. It matches
nothing, though. On a viewpoint whose only IR view is this one, **every object becomes a neutral
node** until a metaclass is picked (probe G2). This is not introduced by the «+». Any vertex view
toggled off the wildcard does it today. It becomes more reachable, because the «+» makes a
wildcard view the starting point of every blank view.

## 6. Risks

- **R1 (canvas, Q1)**: a click on «+» on the active viewpoint restyles the canvas right away.
  Either every object moves from the native node to the IR default object (viewpoint with no IR
  views), or the neutral nodes become IR default objects (viewpoint with specific views). Undo
  (deleting the view) restores it. Acceptance criterion 4 must be read against §3.3, not as
  «unchanged».
- **R2 (tree, palette)**: on those same viewpoints the tree's `not rendered` dimming and the
  palette's IR restriction switch off until the view is narrowed.
- **R3 (silent shadowing)**: on a viewpoint that already has a wildcard vertex view, the new
  view draws nothing and no surface says why (F1).
- **R4 (transient all-neutral)**: §5, the `[]` intermediate state.
- **R5 (label)**: `label` is the unique name at creation. The inline rename that follows
  (`TreeViewContent.tsx:1920`) renames the view, and the `ir.label` keeps «New view». The same
  already happens on `createViewInWorkbench` («View for X» as label). No render reader of
  `label` was traced in this discovery.

## 7. What Fase 2 would write, if the go-ahead confirms §4

In `createBlankViewInViewpoint` only:

```ts
const seed = computeCreationSeed({ kind: 'vertex', label: candidate });
const newView = DViewElement.new2(candidate, '', dVp, (d) => {
    if (seed) {
        (d as any).ir = seed;
        d.appliableTo = 'Vertex' as any;
    }
}, true);
```

`oclCondition` is not written, and neither are `appliableToClasses` or `css_MUST_RECOMPILE`.
The unique-name loop and the return value are unchanged. If `computeCreationSeed` returns `null`
(a rejected seed), the view is born as today, which is the same degradation
`createViewInWorkbench` has. No critical-zone file: `lastViewpoint.ts` is not in §3.1, and `new2`
opens no outer TRANSACTION here (§3.3).

## 8. Open questions for Alfonso

1. **R1 is the price of criterion 1.** Is it acceptable that «+» on the active viewpoint
   immediately draws every unmatched object with the IR default object? The alternatives
   change the seed or the gesture, and both are outside this prompt:
   (a) seed `metaclasses: []`. The view is born inert on the canvas, but on a viewpoint with no
   other IR view it makes every node neutral (G2), which is worse.
   (b) the kind/metaclass choice in the gesture, which R-IRN-4 A3 anticipates and the prompt's
   *Nota di perimetro* defers.
2. **R3**: should a shadowed wildcard be signalled (tree badge, panel note)? That would be a
   separate slice.
3. **R4**: should the toggle-off in `MatchingSection` avoid committing `[]` (e.g. commit only
   once a metaclass is picked)? That is outside the files in scope.
4. **`appliableTo`**: confirm the literal `'Vertex'` in `lastViewpoint.ts` (§4.3) rather than
   exporting `appliableToForIRKind` from `view.tsx`, which is out of scope.
