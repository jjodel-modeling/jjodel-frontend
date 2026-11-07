# Discovery: graphVertex F2 (user views read-only) and F3 (palette click)

- Prompt-ID: P-2026-10-21-1926 (chat C-2026-10-20-0003, front graphvertex, lane full, Phase 1)
- Prompt file: `docs/prompts/claude_2026-10-21_1926_prompt_gv_f2_readonly_views_f3_palette_click.md` (`9da5b4048`)
- Session: 110dad25-8f4e-4c5c-908f-0724dd2ded12
- Tree: `~/jjodel-w-gvf2`, branch `gv-f2-f3`, HEAD `9da5b4048`
- Executor: Opus 5.5 (`claude-opus-5-5`), Claude Code 2.1.302
- Probe: `frontend/scripts/probe/gv-f2-f3.ts`, run through `lane-run probe` on port 3192; outputs in
  `~/.jjodel-lanes/P-2026-10-21-1926/` (`probe_head.json`, `probe_head-url.json`, `probe_s5-card.json`,
  `probe_s5-url.json`, logs `probe-gv-f2-f3*.log`).

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
the real files.

## 1. Objective

F2: reproduce «user views open read-only after a page load» on the current trunk. If it reproduces, trace the
cause to the line, list the readers, and propose the smallest fix with its blast radius. F3: find the palette
click and drag paths, the drop's position logic, and the viewport centre in flow coordinates. Propose a click
that creates the element at the centre of the visible view, on the same path as a drop.

## 2. Hypotheses under test

| # | Hypothesis (from the 2026-10-11 session file, items F2/F3) | Verdict |
|---|---|---|
| H1 | After a page reload `Pointer_ViewPointDefault` is missing from the state. | **Partly.** It is missing from projects whose first open was an in-page navigation, and after a reload it stays missing from their state. A page load does not remove it from a project that has it (§3.1). |
| H2 | The guard at `reducer.ts:1110` never closes when the seeded viewpoint is missing, so every user view counts as built-in. | **Holds, but the guard is not the root cause.** The scan under the guard registers every `DViewPoint`/`DViewElement` in `idlookup`, user records included. The guard only decides when that happens. It also registers user views when the seeded viewpoint is present and the scan first runs on a loaded project (§3.2, run s5-card). |
| H3 | The defect shows «after a page reload». | **Falsified as stated.** A real page load (`page.reload()`) *cures* it for that page session. The defect appears in the page session where a project is opened by in-page hash navigation (§3.1). The 2026-10-11 probe's «reload» was a `page.goto` that changed only the hash, i.e. a same-document navigation, not a page load. |
| H4 | F2 was fixed by a commit after 2026-10-11. | **Falsified.** The guard is unchanged since `7a72b63b7` (2025-07-20, `git log -L1105,1120:frontend/src/redux/reducer/reducer.ts`), and `git log -S defaultViewPointsMap -- frontend/src` ends at `e1b6353e1` (2026-08-19). It reproduces on `9da5b4048`. |
| H5 | A palette click creates nothing today. | **Holds**, measured: `clickCreated: 0` in all four runs (§4.1). |

## 3. F2 findings

### 3.1 Measured on `9da5b4048` (probe, four runs, 0 page errors each)

`check` is `Defaults.check(id)`, the gate of `ViewData.tsx:58`, read in the page from the app's own module
instance. `debug` was `false` throughout, so `check: true` means read-only.

| Run | Step | seeded VP in idlookup | map entry | user VP / user view `check` |
|---|---|---|---|---|
| head-card | opened from card | object | object | - |
| head-card | viewpoint + view authored | object | object | false / false |
| head-card | `page.reload()` | object | object | false / false |
| head-url | opened by hash navigation from the dashboard | **undefined** | boolean (open) | - |
| head-url | viewpoint + view authored | undefined | boolean (open) | **true / true** |
| head-url | `page.reload()` | undefined | object (closed at boot) | false / false |
| s5-card | page load on dashboard, then in-page open of the saved project (which **has** the seeded VP) | object | object | **true / true** |
| s5-url | same, project **without** the seeded VP | undefined | boolean (open) | **true / true** |

In s5-card, `mapVpObjects` reads `["Pointer_ViewPointDefault","Pointer1792603814204_USER_17"]`: the user
viewpoint sits in the built-in map next to the seeded one.

Rule: in a page session, the first reducer pass that sees an object at `Pointer_ViewPointDefault` closes the guard.
Until that pass, every pass registers every view record. If a user project is in the state when the closing pass
runs, its user views stay in the map, and `Defaults.check` is true for them for the rest of the page session.

- A page load on the project URL runs `DState.init()` → `init_editor` on an empty store, which creates the seeded
  viewpoint. The guard closes on that state, before the project's LOAD, so user views stay editable.
- An in-page open (hash change without reload) skips the seed. The guard is still open from the dashboard and
  scans the loaded project.

### 3.2 The line

`frontend/src/redux/reducer/reducer.ts:1109-1118`, verbatim:

```ts
    // initialize default views map
    if (typeof Defaults.defaultViewPointsMap[Defaults.Pointer_ViewPointDefault] !== 'object') {
        for (let k in ret.idlookup) {
            let e = ret.idlookup[k];
            if (!e || typeof e !== 'object') continue;
            let v: DViewElement|DViewPoint = e as any;
            if (v.className.includes('DViewPoint')) Defaults.defaultViewPointsMap[k] = v;
            if (v.className.includes('DViewElement')) Defaults.defaultViewsMap[k] = v;
        }
    }
```

The scan has no id filter. It was written when the first state it saw held only seeded records. Two things made
that assumption false:
- The seed no longer creates the 21 default views (R-IRN-15, `e1b6353e1`).
- The seed is skipped on an in-page open, `store.tsx:246-247`:
  `const viewpoint = projectMissingFromBatch() ? undefined : DViewPoint.newVP('Default', ...`
  (E1, `68e4f312d`, 2026-10-05). Before `68e4f312d`, the whole «init jodel state» batch rolled back on that path
  (per its comment `store.tsx:361-365`), so the seeded viewpoint was missing there before as well (read, not
  measured).

The gate reads both maps through `common/Defaults.ts:108-110`:
`return !!(Defaults.defaultViewsMap[id] || Defaults.defaultViewPointsMap[id] || Defaults.defaultTypesMap[id]);`

The maps start as `{ <seeded id>: true }` (`Defaults.ts:91,93`), so the guard reads `'boolean'` until it closes.

User ids never carry the `Pointer_View` prefix. `joiner/classes.ts:596-597`:
`return "Pointer" + new Date().getTime() + "_" + (isUser ? DUser.current : 'USER') + "_" + (DPointerTargetable.maxID++);`.
The measured user ids match this (`Pointer1792603814204_USER_17`).

### 3.3 Readers

**`Defaults.defaultViewPointsMap` / `defaultViewsMap`, direct readers.** `command grep -rn -m 5` over
`frontend/src`, `*.ts`/`*.tsx`; positive control: the same search returns the declaration at `Defaults.ts:93`.
- `common/Defaults.ts:109`: `check()`.
- `view/viewElement/view.tsx:2007`: `updateDefaultView`. On project load, `VersionFixer.update`
  (`VersionFixer.tsx:145-153`) replaces every view with `version !== highest && !clonedCounter` by the map's
  object. A user view polluted into the map holds a **snapshot of itself from an earlier state** and is a
  candidate for that replacement on a later load in the same page session. This was read, not measured.
- `redux/reducer/reducer.ts:1110,1115`: the guard itself.

**`Defaults.check`, 14 non-test call sites** (same search for `Defaults\.check(`):
- `ViewData.tsx:58`: the view editor, read-only.
- `languages/Javascript.tsx:33`, `Js.tsx:35`, `Ocl.tsx:20`, `Jsx.tsx:18`: code editors read-only.
- `forEndUser/Selector.tsx:17`, `CountryPicker.tsx:17`, `Color.tsx:148`, `MTM.tsx:528`, `MySelect.tsx:18`,
  `Input.tsx:161`: every form field bound to the view, read-only.
- `utils/lastViewpoint.ts:98`: `isDefault` flag in the viewpoint list.
- `view/viewElement/view.tsx:655`: `set_isExclusiveView` becomes a no-op.
- `view/viewElement/view.tsx:988`: `get_compiled_css` stops gating a user exclusive viewpoint's CSS on
  `activeViewpoint`, so a polluted user viewpoint's CSS applies while it is inactive. Read, not measured.
- `pages/components/Project.tsx:176`: project duplicate keeps polluted ids instead of renewing them, so the
  copy shares view ids with the original. Read, not measured.

**`Pointer_ViewPointDefault`, non-test readers.** These are unaffected by the fix, and listed because the prompt
asks for them:
- `common/Defaults.ts:27,45`: declaration.
- `reducer.ts:1110`: the guard.
- `store.tsx:324`: the seed.
- `view.tsx:445,452`: parent of a new view, falls back to the seeded viewpoint.
- `utils/lastViewpoint.ts:145,170`.
- `selectors.ts:557`: `VP_Default` match.
- `VersionFixer.tsx:1277`: comment of 2.228.
- `joiner/classes.ts:3492`, `viewpoint.ts:54`, `vertexLayoutAdapter.ts:27`, `Toolbar.tsx:297`: comments.
- `examples/*.ts`: data.

### 3.4 Proposed fix (Phase 2, core)

Register only system records. The scan keeps its place, its guard and its cost. It skips any id outside the
`Pointer_View` namespace, which is the same convention `Defaults.holdsOnlySystemViews` (`Defaults.ts:146-151`)
already uses, with its rationale at `Defaults.ts:124-137`.

- New pure module `frontend/src/common/defaultViewsRegistry.ts`, no imports so the vitest bench can load it (the
  `nameLookup.ts` pattern, CLAUDE.md §5):
  `registerSystemViews(idlookup, vpMap, viewMap)`. For each `k` that starts with `'Pointer_View'` and has an object
  record whose `className` is `DViewPoint`/`DViewElement`, it writes into the map. Nothing else changes.
- `reducer.ts:1111-1117`: the loop body is replaced by one call to it. The guard condition stays as it is.
- Test `frontend/src/common/__tests__/defaultViewsRegistry.test.ts`:
  1. User viewpoint and view ids are not registered, both with the seeded viewpoint present (s5-card) and absent
     (s5-url).
  2. `Pointer_ViewPointDefault` and a `Pointer_View*` view are registered as objects.
  3. A `clonedCounter` number and a null record are skipped.

  Mutation bench: dropping the prefix test kills (1); dropping the className test kills a case with a
  `Pointer_View*` id on a non-view record; dropping the object guard kills (3).
- Probe acceptance: `gv-f2-f3.ts` with `GVF_OPEN=url` and `card`. `check` is false on the user viewpoint and view
  in every step, including `authored` (head-url) and `reopen` (s5-*). `mapVpObjects` holds only `Pointer_View*`
  ids.

**Blast radius.**
- Not touched: the D-layer state, persistence and migrations. The maps are module-level registries, never
  persisted.
- User records: they stop being treated as built-in in every reader of §3.3, which is the intended effect.
- System records: no change. Every system id already carries the prefix, including retired ones
  (`Pointer_ViewPointValidation`, `Pointer_ViewVoid`).
- Tests that cover the area today: **none**. `command grep -rln 'defaultViewPointsMap\|defaultViewsMap\|Defaults.check'`
  over `*.test.ts(x)` returns no file (positive control: the same tool on `*.ts` finds `reducer.ts`). `reducer.ts`
  does not import under the bench (`window is not defined`, CLAUDE.md §17), hence the extracted module.
- Critical zone: `reducer.ts` is core (rule 5, approval given by this lane's GO), not a §3.1 file. No §3.2 path
  (`DVertex.new`, `SetFieldAction` near sync) is touched, so no Layer Impact Report is required. No §3.9
  VersionFixer change is needed.

**Not proposed.** Seeding the missing `Default` viewpoint into projects that lack it (a migration, or seeding on
in-page open). Without the scan defect, its absence did not make views read-only in any measured step. Its other
readers (`view.tsx:452`, `lastViewpoint.ts`) are a separate question (Q2).

## 4. F3 findings

Paths below are under `frontend/src/components/editor-v2/`. The findings were read by an explorer subagent and
spot-checked by me on the lines marked ✓.

### 4.1 Measured

In all four runs, one Class dragged onto the M2 canvas creates one `DClass`. A click on the same palette entry
then creates none (`m2ClickBefore: 1`, `m2ClickAfter: 1`, `clickCreated: 0`, 3 s after the click). The M1 palette
was not driven by the probe. Its items have the same handler set (read, §4.2).

### 4.2 Read

- **Palette.** `panels/PalettePanel.tsx`.
  - M1 `<aside className="editor-v2-palette editor-v2-palette--m1">` (:126), items :141-146 and :160-163.
  - M2 `<aside className="editor-v2-palette">` (:255), items :261-265.
  - Items are `<div draggable>` with only `onDragStart` (plus `onDragEnd` on M1).
  - `onDragStart` (:82-93 ✓) writes `application/reactflow` = type. For M1 it also writes `metaclassId` and
    `application/jjodel-classic`, and calls `setDraggedMetaclassId`.
  - No `onClick`/`onKeyDown`/`tabIndex`/`role` in the file (`grep -c` = 0). The items are not focusable.
- **Drop.** `EditorV2.tsx`.
  - `onDrop` :2316-2559 ✓, wired at :4761-4762.
  - Position (:2326-2335 ✓):
    `screenToFlowPosition({ x: event.clientX, y: event.clientY })`, then
    `position.x -= defaultNodeWidth / 2; position.y -= defaultNodeHeight / 2;`. The size is 200×120 for a
    package and 140×40 otherwise.
  - **The drop is not snapped.** `snapToGrid={snapEnabled}` / `snapGrid={[16, 16]}` (:4777-4778 ✓) are React
    Flow props that apply to node drags only.
- **Creation chains.**
  - M2: `syncCreateClass` / `syncCreateEnum` / `syncCreatePackage` (`sync/canvasToJjom.ts:1245,1292,1335`)
    → `DClass.new` + `DVertex.new(…, new GraphSize(x,y,140,40))`.
  - M1: `syncCreateObject(graphId, metaclassId, x, y)` (`EditorV2.tsx:2434` → `canvasToJjom.ts:1499`)
    → `DObject.new` + `createVertexForObject` (:1454) → `DVertex.new`.
  - Then `markDropCreated(vertexId)` (:2479) and `setNodes` with `autoEdit: true` (:2487).
  - The creators are bare, with no outer TRANSACTION (`canvasToJjom.ts:1516`: «Do NOT wrap in TRANSACTION»).
- **Drop-target logic (M1 only).**
  - `findIRDropContainerAt(cursorFlow)` (:2206-2229) is a bbox hit test over `getNodes()` for graphVertex
    containers.
  - It picks between a reference-membership create (`appendWhenReady`, a SetField-only TRANSACTION at :2391) and
    the classic containment drop (`performContainmentDrop` :3108, or the chooser `setPendingContainmentDrop`).
  - A non-rootable class is creatable only into a container (:2428-2429).
  - Member types `attribute`/`operation`/`literal` are discarded on the bare canvas (:2324 ✓).
- **Viewport centre.**
  - `PalettePanel` renders at `EditorV2.tsx:4887`, inside `EditorV2Inner`, under `<ReactFlowProvider>` (:5044).
  - `useReactFlow()` is already destructured at :749 (`screenToFlowPosition`, `getViewport`, …).
  - The canvas element is `editorContainerRef` (`.editor-v2__canvas`, :1025).
  - No existing viewport-centre helper. The search was `screenToFlowPosition|getViewport()|getBoundingClientRect|
    setCenter|viewport.?cent` over `components/editor-v2`; its positive control was the hits at `EndpointHandles.tsx:94` and
    `SegmentHandles.tsx:91`.
- **Tests.** None for the palette or `onDrop`. `grep -rl` of `PalettePanel|syncCreateClass|syncCreateObject|
  findIRDropContainerAt|application/reactflow` over `*.test.ts(x)` returns no file.

### 4.3 Proposed change (Phase 2)

1. `EditorV2.tsx`: move the body of `onDrop` after its `dataTransfer` reads into
   `createFromPalette(rawType, metaclassId, client: {x, y})`, a `useCallback` in `EditorV2Inner`. `onDrop` calls it
   with `event.clientX/Y`, so the drop's behaviour is unchanged. One creation path, no new TRANSACTION, no edit to
   `canvasToJjom.ts` or `syncState.ts`.
2. `EditorV2.tsx`: `onPaletteActivate(type, metaclassId?)` takes the centre of
   `editorContainerRef.current.getBoundingClientRect()` in client coordinates and calls `createFromPalette`.
   Because the drop centres the node on its point, the new element's centre lands on the viewport centre.
   Container hit test, rootability and the containment chooser apply exactly as for a drop at that point.
3. `panels/PalettePanel.tsx`: new optional prop `onItemActivate?: (type: string, metaclassId?: string) => void`
   (additive, rule 11).
   - Each item gets `onClick`, plus `role="button"`, `tabIndex={0}` and Enter/Space (WCAG, §20.2).
   - Member types stay inert on click, as on a bare-canvas drop.
   - An HTML5 drag does not fire `click`, so drag and click do not double-create. The Phase 2 probe verifies this.
4. New pure helper `frontend/src/components/editor-v2/utils/canvasCentre.ts`: `clientCentre(rect)`. Test
   `utils/__tests__/canvasCentre.test.ts` covers the centre of an offset rect and of a zero-size rect.
5. Probe: extend `gv-f2-f3.ts` step 2.
   - On M2: `clickCreated: 1`, and the new vertex's centre equals the viewport centre within 1 flow px
     (`getViewport()` + rect).
   - On M1: the same for a rootable class. A non-rootable class creates nothing on a bare centre.
   - A drag still creates exactly one.

Files: `EditorV2.tsx`, `PalettePanel.tsx`, `canvasCentre.ts` (new), its test, the probe. Five files, at the
rule-19 threshold, not above it.

## 5. Risks

- F2 fix: if some code relied on a user view being «default» (for example the duplicate keeping ids, `Project.tsx:176`),
  it now gets the non-default behaviour. Each such reader in §3.3 treats user views as non-default after a card
  open today (measured head-card: `check: false`), so the fix makes the in-page open match the card open.
- F2 fix: the guard stays open forever in a session whose projects lack the seeded viewpoint. It then scans
  `idlookup` on every reduced action, as it does today. That cost is unchanged, and not measured.
- F3: repeated clicks stack new elements on the same point. This is ratified behaviour (centre), noted for the
  visual check.
- F3: the classic editor's drop (`application/jjodel-classic`) is outside editor-v2 and not covered by the change.
- F3: `onDrop` is a 243-line callback with several dependencies. Extracting it must keep its dependency array
  exact, or the drop reads a stale `modeInfoRef`/`irPlanRef` closure. The refs are refs, but the array still
  matters for `graphId`/`isJjomMode`.

## 6. Decisions taken (unattended)

1. F2 is not closed: it reproduces on `9da5b4048`, with the trigger restated (in-page open, not page load). Basis:
   the probe, §3.1.
2. F2 fix scope: id filter on the scan, not re-seeding the missing viewpoint (§3.4 «Not proposed»).
3. F3 position: the click centres the element on the viewport centre with the drop's own centring, and **no
   snap**, because the drop does not snap (§4.2). «Snapped as the drop is» therefore means unsnapped.
4. F3 is editor-v2 only, both palettes (M2 and M1). The classic editor is out.
5. F3 adds keyboard activation (Enter/Space, focusable items) along with the click.

## 7. Decisions awaiting Alfonso

None from the RC-26 list:
- `reducer.ts` is core but not §3.1, and the prompt grants the core touch on GO.
- No exported interface breaks; `PalettePanelProps` gains an optional prop.
- No ratified R- row is amended.
- No file or data is deleted.
- The MODELS demo is not changed.

## 8. Open questions

1. Should repeated palette clicks cascade (+16, +16 per click while the centre is occupied) instead of stacking?
   Recommended: no, keep the ratified centre.
2. Should projects that lack `Pointer_ViewPointDefault` get it back (migration or seed on in-page open)?
   Recommended: a separate ticket, not this lane.
3. Should the F2 Phase 2 run the probe against the MODELS demo projects as well? Recommended: yes, read-only,
   `check` on their user views after an in-page open.

## 9. Files read (full paths)

- `/Users/alfonso/jjodel-w-gvf2/frontend/src/redux/reducer/reducer.ts` (604-660, 1080-1160, 1489-1615)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/common/Defaults.ts` (1-169)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/redux/store.tsx` (225-374)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/redux/VersionFixer.tsx` (110-159, 1265-1300)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/components/editors/views/ViewData.tsx` (45-75)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/view/viewElement/view.tsx` (650-657, 984-992, 1990-2030)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/pages/components/Project.tsx` (160-197)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/pages/Project.tsx` (35-90)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/common/U.tsx` (118-142, 450-453)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/components/pathChecker/PathChecker.tsx` (1-30)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/utils/lastViewpoint.ts` (88-104)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/joiner/classes.ts` (596-606)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/components/forEndUser/MTM.tsx` (525-530), `Input.tsx` (157-163)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/components/editor-v2/EditorV2.tsx` (2316-2340, 4774-4779; the
  rest via the explorer subagent)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/components/editor-v2/panels/PalettePanel.tsx` (80-94; the rest via
  the explorer subagent)
- `/Users/alfonso/jjodel-w-gvf2/frontend/src/redux/__tests__/initEditorProjectGuard.test.ts` (1-40)
- `/Users/alfonso/jjodel-w-gvf2/frontend/scripts/probe/new-model-instantiate.ts` (1-255)
- `/Users/alfonso/jjodel-w-gvf2/docs/sessioni/sessione_2026-10-11_C-2026-10-10-0057.md` (25-62)
- `~/.jjodel-lanes/P-2026-10-11-1135/probe_*.json` (the 2026-10-11 measurements, re-read for H3)
