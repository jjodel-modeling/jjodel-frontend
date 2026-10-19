# Discovery: Templates, Notations and File › New (L-A, Phase 1, read-only)

- Prompt-ID: P-2026-10-19-1510 (`docs/prompts/claude_2026-10-19_1510_prompt_templates_notations_discovery.md`), chat C-2026-10-19-1501
- Session: 826ae067-7498-4479-a7df-ead7c25aec0b
- Tree: `~/jjodel-w-tplui-disc`, branch `tplui-disc`, HEAD `e4192a3d7` (base `library-gallery` `e1bb5db65` + the handoff and prompt commits)
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- Input: `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md` (read whole), R-LIB-1..19 and D-UI-15 read from `alfonso-frontend-jjtl:docs/decisions.md` (this branch's `decisions.md` has no R-LIB row).

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

Tags: **measured** = run in this phase on this tree (HEAD `e4192a3d7`); **read** = read from a file. Reads went through `rg` and Read with offset/limit, partly through four read-only subagents whose citations were spot-checked (Navbar.tsx:102-118, :386-392, :437-447, :1365-1378; LeftBar.tsx:527-530, :556-560; NotificationWidget.tsx:137; Templates.tsx:14-26, :42, :121-122, :164; ProjectEditor.tsx:1124-1145).

## 0. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The Templates page, its card, clone chain and catalog read are local to `pages/Templates.tsx` | holds (§1) |
| H2 | The sidebar can hide FILTERS per page and marks the active item | falsified: no hook for either (§1.4) |
| H3 | The quick tip is a local string that a page can suppress | partly: the text is remote, the widget has a route check that can be extended (§1.5) |
| H4 | The File menu renders a cascade with section labels | partly: recursive nesting yes, section labels no (§2) |
| H5 | A model can be created from a built-in notation in 3.2 | falsified: no sealed package exists on any branch, R-LIB-7 keeps them out (§3.3) |
| H6 | A viewpoint can be rendered to an image without a user's tab | holds, measured: headless Chromium against a dev server, 7/7 entries (§4) |
| H7 | The handoff's SVG output is usable as the stored preview | falsified, measured: html-to-image SVG is 1.4–6.8 MB per diagram; PNG 12–55 KB (§4) |
| H8 | The categorical palette lives in `tokens/entities.css` | falsified: no such file; `styles/tokens/_colors-light.scss:327-353` (§5) |
| H9 | The handoff's §2.5 concept table matches the packages | partly: one wrong tag (families-persons has no transformation), several missing (§6) |

## 1. Templates page

### 1.1 Page and route (read)

- `TemplatePage` in `frontend/src/pages/Templates.tsx` (209 lines) and `Templates.scss` (138 lines); exported at `frontend/src/pages/index.ts:11`.
- Routes `frontend/src/App.tsx:164-165`: `path={'templates'}` and `path={'templates/:ref'}`, both `<TemplatePage/>`; `ref` read with `useParams` at `Templates.tsx:110`.
- Trunk (`alfonso-frontend-jjtl:frontend/src/pages/Templates.tsx`): a ~25-line stub, `<Dashboard active={'Templates'}>` around a `ComingSoonPlaceholder`, no SCSS. This branch adds the catalog fetch, two tier sections (`TIERS`, `Templates.tsx:29`), the inline cards, `CloneDialog` and the `#/templates/<id>@<n>` deep link (`git diff alfonso-frontend-jjtl --stat`: +204/−10 TSX, +138 SCSS).

### 1.2 Card and clone chain (read)

- The card is a local function `card` (`Templates.tsx:147-170`), keyed by `data-gallery-id`; `CloneDialog` at `:52`.
- Chain: button `Templates.tsx:164` `<Button variant="primary" size="sm" onClick={() => setCloning({entry: e, version})}>` → `<CloneDialog>` at `:197` (also opened by the deep link, `useEffect` `:140-145` via `resolveGalleryRef`) → form `onSubmit={clone}` `:86`, `clone` `:60` → text from `info.text` or `fetch('/' + version.file)` `:66` → `ProjectsApi.importFromText(text, name.trim(), Date.now(), {clonedFrom: galleryRefOf(entry.id, version.n)})` `:67` (`api/persistance/projects.ts:263`) → `R.navigate(`/project?id=${id}`, true)` `:68`.

### 1.3 Catalog (read)

- Runtime read: `Templates.tsx:42` `const CATALOG_URL = '/library/catalog.json';`, `:121` fetch cast to `{entries: GalleryEntry[]}`, `:122` filters `e.kind === 'galleryProject' && e.status === 'available' && !!currentVersion(e)`.
- Type: `export interface GalleryEntry` `Templates.tsx:14-26` (`id, kind, label, status, package?, description?, tier?, version?, versions?`); `GalleryVersion`, `VersionedEntry` exported from `frontend/src/library/galleryRef.ts:9,18`. Three more local `Entry` types re-declare the shape: `scripts/library/build-gallery.ts:49`, `scripts/probe/library-gallery-clone.ts:43`, `src/library/__tests__/gallery.test.ts:33`.
- Other readers: `scripts/library/copy-catalog.mjs:13-14` (copies docs → public, run as `prebuild`, `package.json:92`); `gallery.test.ts:130-131` asserts the docs file and `frontend/public/library/catalog.json` are identical.
- Fields (catalog `"version": 2`). Every gallery entry: `id, kind, tier, label, status, publisher, version, versions[{n, file, published, sha256, notes}], description, source[], notes`. Sealed entries: `id, kind, label, status, publisher, family, notes`. Verbatim, `library`: `"kind":"galleryProject"`, `"tier":"template"`, `"status":"available"`, `"publisher":"jjodel"`, `"version":1`, `"description":"Libraries, books, writers and members: containment, inheritance and cross references."`.
- Entries: tier `template`: `library, families-persons, state-machine, graph, shapes`; tier `example`: `turnstile, petri-producer-consumer`; plus 10 `sealedNotation` entries (measured: `rg -c '"kind": *"sealedNotation"'` = 10), nine `planned`, `dcn` `deferred`, none with a package (`rg -c '"package"' docs/library/catalog.json` → exit 1, no match; control: the same `rg` finds 10 `sealedNotation`).
- `kind` is already taken by `galleryProject | sealedNotation`; the handoff's `kind: template | example` is the catalog's `tier`. R-LIB-19 already reads it so; confirmed.

### 1.4 Sidebar (read)

- `LeftBar` in `frontend/src/pages/components/LeftBar.tsx` (606 lines), rendered by `Dashboard.tsx:327` for every dashboard page (AllProjects, Templates, Explore, Notes, Account, Settings, …). The project page uses another branch of it (`LeftBar.tsx:386`).
- FILTERS: `LeftBar.tsx:527-543`, `<Menu title={'Filters'} mode={'collapsable'}>` with Private, Public, Collaborative. BROWSE: `:556-560`, `<Item action={'templates'} …>Templates</Item>` and `<Item action={'explore'} …>Explore</Item>`.
- Active state: `Item` (`:53-73`) adds class `active` when its `active` prop is true (`:62`); only the three FILTERS items pass it, from `searchParams.get('filter')` (`:113`). Templates, Explore and All projects never pass `active`, so none is ever highlighted. Style `pages/dashboard.scss:875-885` (`.item.active`, brand cyan `#0ea5e9`). No `aria-current` under `frontend/src/pages` (`rg -l 'aria-current' frontend/src/pages` → exit 1; control: the same search over `frontend/src` lists `SymbolEditorModal.tsx`, `UnifiedSettingsModal.tsx`, `SimInspector.tsx`).
- Hiding FILTERS: no prop, no route check today. `LeftBar` already has `useLocation()` (`:109`, used at `:122` `pathname === '/allProjects'`), and receives `active` from Dashboard, so a per-page condition is a local change.

### 1.5 Quick tip (read)

- The text «Right-click on elements for more options» is not in the code: `rg -l 'Right-click on elements' frontend/src frontend/public docs/reports` → only `docs/reports/quick-tips-discovery-2026-04-26.md` (control: `rg -l 'Clone to my workspace' frontend/src` → `pages/Templates.tsx`). It comes from the remote worker (`NotificationWidget.tsx:23`, `API_URL = 'https://jjodel-notifications.alfonso99.workers.dev'`).
- Widget: `frontend/src/components/NotificationWidget/NotificationWidget.tsx` (260 lines), mounted at `App.tsx:178` inside the HashRouter. Seen state `localStorage['jjodel-quick-tips-state']` (`:29`), 14-day window (`:25`, `:162`), hidden in consumer mode (`:122`). The only route check: `:137` `if (window.location.hash.includes('auth')) return null;`.
- Suppression per page: extend `:137` (or a `useLocation` check beside it) and mirror it in `hasTipToShow` (`:122`) so the `data-notification-visible` body flag stays right.

### 1.6 Basic/Advanced accessor (read)

- Redux `state.advanced` (`redux/store.tsx:215`, default false), read by Navbar as `props.advanced` (`Navbar.tsx:2123-2124`).
- `frontend/src/hooks/useInterfaceMode.ts` (108 lines): `STORAGE_KEY = 'jjodel.interfaceMode'` (`:17`), `getInterfaceMode()` (`:22`), `isAdvancedMode()` (`:43`), hook `useInterfaceMode()` (`:57`). The Navbar toggles (`Navbar.tsx:871-875`, `:885-889`) write Redux, `windoww.advanced` and localStorage but do not dispatch `INTERFACE_MODE_CHANGE` (only the hook does, `useInterfaceMode.ts:87,96`), so the hook does not re-render on a same-tab Navbar toggle (also stated at `EditorV2.tsx:616`).
- The open ticket (`docs/log-inbox/notation-library.md:53`): Redux `advanced` drops to false after leaving All Projects while localStorage stays `advanced`; the restore effect `Navbar.tsx:919-925` runs once per mount and only upwards. The writer that resets it was not found (search over `redux`, `api`, `joiner`, `common`).
- For R-LIB-15: no accessor is both right and reactive today. Recommended for L-B: `useSelector(s => s.advanced) || isAdvancedMode()`: the value follows localStorage (immune to the reset), the Redux subscription re-renders on a Navbar toggle. Residual gap: a toggle to Basic while Redux already reads false does not re-render until the next render.

## 2. File menu (read)

- Defined in `frontend/src/pages/components/Navbar.tsx` (2146 lines): `{name: 'File', subItems: [...]}` at `:1365-1433` inside `items` (`:1345`); rendered by `MainMenu` (`:463`) → `Submenu` (`:450`) → `makeEntry` (`:370`).
- Capabilities: nesting is recursive (`makeEntry` calls itself on `i.subItems`, `:407-415`), unbounded depth; today's deepest is three levels, File › New › Model › `<metamodel>`. Separators: entries named `'divisor'` → `<li className='divisor'><hr /></li>` (`:386-391`). Disabled: `className="highlight disabled"` (`:400`); a disabled parent drops its submenu and forces its children disabled (`:396`, `:402`, `:411`). **No section label**: `type MenuEntry` (`:437-447`, not exported) has only `id, name, jsx, icon, function, keystroke, shortcutPills, subItems, disabled`; a heading row can only be faked as a disabled entry (as at `:1529`). Styles: `pages/components/navbar.scss`, `pages/components/menu/menu.scss`.
- Current File items in order: `New Project` (`:1367-1371`, Alt+Cmd+N, hidden in consumer mode) · `New ›` (`:1373`, `isDashboard ? null`) with `Metamodel` (`:1375`, `createM2(project)`, Alt+Cmd+M) and `Model ›` (`:1376`, built `:1321-1338`: one entry per metamodel calling `createM1(project, m2)`, disabled with no project or no metamodel) · `Recent Projects ›` (`:1379`, up to 7) · `Import Project` (`:1382`, hidden in a project) · divider · `Save Project` (`:1386`, Cmd+S) · `Download Project` (`:1394`) · `Export Canvas ›` (`:1402`: PNG, JPEG, SVG, divider, Copy to Clipboard) · divider · `Close Project` (`:1414`, Alt+Cmd+W) · `Delete Project` (`:1431`, always disabled).
- Mode gating: by `props.advanced`, entries replaced with `null` (`:1479`, `:1513-1514`; the whole Tools menu at `:1526`). **The File menu has no Advanced gate today.**
- Project open: `user?.project` → `isDashboard = !project`, `isProject = !!project` (`:567-568`, `:1341-1342`); metamodels from `state.m2models` (`:2121`).
- Side finding (read, not measured): `NEW_PROJECT` is listened to only by `pages/AllProjects.tsx:51`; File › New Project from inside a project dispatches an event no mounted component handles. L-E checks it in the browser before relying on it.

## 3. Creation paths (read)

### 3.1 Functions and call sites

| Creates | Function | UI call sites |
|---|---|---|
| project | `ProjectsApi.create(type, name?, m2=[], m1=[], otherProjects?)` `api/persistance/projects.ts:46` | `AllProjects.tsx:38` (dialog), `RightPanel.tsx:51`; the menu dispatches `NEW_PROJECT` (`Navbar.tsx:1368`) |
| metamodel | `createM2(project: LProject, name0?: string)` `Navbar.tsx:74` (auto name `metamodel_N`) | `Navbar.tsx:1032, 1180, 1375, 228`; `LeftBar.tsx:406`; `Dashboard.tsx:542`; `ProjectEditor.tsx:906, 1119` |
| model | `createM1(project: LProject, metamodel: LModel, open: boolean = true)` `Navbar.tsx:102`: `DModel.new(name, metamodel.id, false, true)` with auto name `model_N`, returns nothing | `Navbar.tsx:1099, 1328, 232, 334`; `ProjectEditor.tsx:1131, 1142` (`handleNewModelClick` `:1124`: one metamodel → create, several → picker); `ConfiguratorTab.tsx:338`; rail `+` → `CREATE_MODEL` (`LeftBar.tsx:437`, listener `ProjectEditor.tsx:1166`) |
| viewpoint | `handleCreateViewpoint({name, type})` `ProjectEditor.tsx:1205` → `DViewPoint.newVP` (`view/viewPoint/viewpoint.ts:129`) via `NewViewpointDialog` (`:3126`) | `CREATE_VIEWPOINT` (`LeftBar.tsx:468`, listener `ProjectEditor.tsx:451`) |
| transformation | `handleCreateTransformation(name, sourceId?, targetId?, description?)` `ProjectEditor.tsx:1232` → `createTransformation` (`jjtl/types/transformation.ts:42`) via `NewTransformationDialog` (`:3112`) | `OPEN_NEW_TRANSFORMATION_DIALOG` (`LeftBar.tsx:460`, `Navbar.tsx:235`, listener `ProjectEditor.tsx:444`) |

There is no New model dialog today: only the metamodel picker; no name is asked. The CLAUDE.md rule 21 against `createM1()` targets transformation outputs, not UI-created models.

### 3.2 «Metamodel in this project» tab

Calls `createM1(project, metamodel, open)`. It takes no name: a Model name field needs an optional `name0?` parameter mirroring `createM2(project, name0?)` (`Navbar.tsx:74`), an addition to an exported function (rule 11 permits optional additions). Metamodels of the project: `project.metamodels` (`LeftBar.tsx:316`, `ProjectEditor.tsx:206`) or `state.m2models`; clash check against `metamodel.models` (`Navbar.tsx:104`).

### 3.3 «Built-in notation» tab and the Notations page

- `library-seal`: only `frontend/src/model/librarySeal.ts` (135 lines, `sealDecision`, keys `libraryNotation`, `libraryNotationVersion`, `librarySeal` at `:20-26`; header: «Nothing calls it yet») and its test. No package, no instantiate function.
- `library-seal-guard`: `redux/reducer/librarySealGuard.ts`, a 2-line report-only hook in `reducer.ts`, the seal files, a probe. No package.
- Trunk: no `frontend/public/library`, no `frontend/src/library`; only `docs/library/catalog.json`.
- This branch: `frontend/public/library/` holds `catalog.json` and `gallery/` only (measured, `ls`); the 10 sealed entries are `planned`/`deferred` with no package (§1.3).
- Plan: S4 builds the first sealed package in `public/library/notations/<id>/<id>.jjodel`, S5 the New-from-notation flow, which per §8.3 of `docs/discovery/discovery_2026-10-18_notation_library.md:206` is «Dashboard New Project → From a notation» through `importFromText`, i.e. a whole new project, not a model inside an existing project.
- Not honest substitutes: derived notations (`DERIVED_NOTATIONS`, `components/editor-v2/viewpoint/derive/notations.ts:89-114`, via `createDerivedViewpoint`, `utils/deriveViewpoint.ts:55`) derive a viewpoint for the user's own metamodel, which R-LIB-1 calls «a third, independent thing … not part of the library»; `NOTATION_CATALOG` (`viewpoint/ir/notationCatalog.ts:61`) holds shape presets, not metamodels.

**Plainly: no user can create a model from a built-in notation in 3.2.** R-LIB-7: «The sealed notations (S4 onwards), the S3 seal predicate and the S6 reducer guard are not part of this row», and R-LIB-10 repeats «no sealed notation and no seal guard in 3.2». The smallest honest content if they shipped before the notations: the Notations page is **not shipped** (a page of nine planned cards with nothing to create is a placeholder), and the New model dialog ships with the **«Metamodel in this project» tab only**; the Built-in tab, the BROWSE item and the Basic Model › notation entries arrive with S4/S5.

## 4. Offscreen snapshot of a viewpoint (measured)

### 4.1 What exists (read)

- `html-to-image` `^1.11.13` (`frontend/package.json:37`), `@playwright/test` `^1.62.1` (`:170`), Chromium headless shells installed in `~/Library/Caches/ms-playwright` (`chromium_headless_shell-1228`, `-1234`). No Puppeteer, no resvg/sharp/jsdom in `package.json` (`rg` over it, control: the same `rg` finds `@xyflow/react` at `:27`).
- `frontend/src/services/CanvasExportService.ts` (457 lines): `renderTarget` (`:322-357`) fits the `.react-flow__viewport` to the diagram at zoom 1 («the canvas background, the dot grid and the minimap stay out», `:318-319`), `generateDataUrl` (`:390-413`) → `toSvg`/`toPng`/`toJpeg`; public `export`, `exportAsBlob`, `copyToClipboard`. Used by File › Export Canvas (`hooks/useCanvasExport.ts`, `components/export/ExportImageMenu.tsx`).
- `frontend/scripts/library/build-gallery.ts` (484 lines) already drives headless Chromium (`:37`, `chromium.launch()` `:476`) against a dev server (`PROBE_URL`, default `:3097`, `:42`), opens each model editor through `DockManager.open2` (`:438`) and downloads the package. It can host a snapshot step as is.
- The PNGs under `docs/discovery/assets/library-gallery/` are full-page `page.screenshot` captures at 1440×900 by `scripts/probe/library-gallery-clone.ts` (`:165`, `:186`, `:472`, `:511`), not diagram exports.

### 4.2 Probe (measured, `/tmp/tplui-probe/snap.ts`, not committed)

Dev server `npm start -- --port 3096 --strictPort` (stopped at the end, port verified free). For each of the seven packaged `frontend/public/library/gallery/<id>/1.jjodel`: fresh context 1440×900 seeded as `scripts/smoke/states.ts` `seed(ctx, true)`, the file stored in `localStorage.projects` with its own ids (the `STORE` pattern of `build-gallery.ts:355-361`), project opened by `?open=<id>#/project?id=<id>`, each metamodel and model editor opened with `DockManager.open2`, 4.5 s settle (the 3 s re-layout watcher), then `CanvasExportService.renderTarget` + `generateDataUrl` for SVG and PNG at pixelRatio 1.

| entry | diagram | size (px) | RF nodes/edges | SVG bytes | PNG bytes | export ms (svg/png) |
|---|---|---|---|---|---|---|
| library | M2 Library | 838×829 | 6/7 | 5 490 349 | 50 758 | 586/427 |
| library | M1 sample-Library | 612×374 | 8/5 | 3 887 116 | 40 533 | 232/305 |
| shapes | M2 Shapes | 468×588 | 4/3 | 3 420 396 | 25 485 | 377/296 |
| shapes | M1 sample-Shapes | 392×180 | 4/0 | 1 431 816 | 11 766 | 137/155 |
| graph | M2 Graph | 279×588 | 3/4 | 2 772 565 | 19 393 | 353/256 |
| graph | M1 sample-Graph | 512×352 | 4/6 | 1 972 074 | 34 521 | 166/216 |
| state-machine | M2 statemachine | 575×709 | 4/6 | 6 809 085 | 55 304 | 539/561 |
| state-machine | M1 sample-StateMachine | 418×316 | 6/3 | 3 416 472 | 22 342 | 172/238 |
| families-persons | M2 Families | 233×348 | 2/8 | 3 904 588 | 19 885 | 419/338 |
| families-persons | M2 Persons | 468×330 | 3/2 | 1 647 702 | 13 436 | 151/180 |
| families-persons | M1 sample-Families | 450×396 | 11/0 | 3 100 415 | 26 021 | 226/273 |
| families-persons | M1 sample-Persons | 648×378 | 9/0 | 3 783 842 | 26 482 | 261/329 |
| turnstile | M2 DemoESM | 1029×473 | 5/5 | 4 086 737 | 36 915 | 413/331 |
| turnstile | M1 demoESM | 554×323 | 3/4 | 2 940 142 | 28 169 | 172/249 |
| petri-producer-consumer | M2 DemoPetri | 1029×497 | 5/5 | 3 674 743 | 32 557 | 915/307 |
| petri-producer-consumer | M1 demoNet | 562×233 | 7/6 | 3 745 729 | 25 470 | 210/327 |
| petri-producer-consumer | M1 producerConsumer | 568×255 | 9/10 | 3 459 539 | 40 221 | 276/350 |

- Time per entry: 15.5–16.3 s for two diagrams, 21.8 s for three, 27.0 s for four (boot ~4.5 s once Vite is warm; each diagram ~5 s, of which 4.5 s is the fixed settle wait; the export itself 0.14–0.92 s). The first run's boot was 24 s (cold Vite compile). Zero page errors in 7/7.
- The SVG renders standalone as an `<img>` on a blank page, 7/7 (`complete: true`, natural size equal to the export).
- **The SVG is not usable as a stored preview**: html-to-image writes HTML inside a `foreignObject`, with every computed style inlined (library M2: 4 573 799 bytes of `style="…"` over 182 elements) and 31 embedded `@font-face` (7 `data:application/font-woff`, 24 `data:font/woff`). PNG at 1× is 12–55 KB.
- Visual (screenshots under `/tmp/tplui-probe/out/`, read): the M1 diagrams of the examples (Turnstile statechart, Petri net) already look close to variant D (white rounded nodes, slate edges). The M2 diagrams are the metamodel editor's look (blue class headers, purple enum header), not variant D's white nodes with slate hairline.
- Aspect: card preview 136 px high, ~2.2:1; several M2 diagrams are taller than wide (graph 279×588, state-machine 575×709, library 838×829): fitted into 136 px the library M2 lands at ~16 % scale. The handoff's variant C threshold (>8 classes) never fires on the seven entries (max 6 classes, §6).

### 4.3 Recommended pipeline (for L-C, not built)

- A new script `frontend/scripts/library/snap-gallery.ts`, sibling of `build-gallery.ts` and reusing its pattern (seed, `STORE`, `DockManager.open2`, settle), run through `lane-run probe` against a dev server. Separate from `build-gallery.ts` because that script refuses an existing version (R-LIB-9: «a published version is never rewritten»), and the previews of `@1` do not change the package bytes.
- Output PNG at pixelRatio 2, transparent background (the card paints the dot grid in CSS), to `frontend/public/library/gallery/<id>/<n>.preview.png`, next to the package; the catalog `preview` points at it.
- Which diagram: a template shows its metamodel (the mockup draws class diagrams), an example its model in the notation (handoff §3: Turnstile `demoESM`, Petri `producerConsumer`, the model with the scenario). Families and Persons has two metamodels: L-C decides between the first one and a side-by-side composition.
- Variant D for M2: a capture-only stylesheet injected by the script (`page.addStyleTag`) over the metamodel editor's class names, so no source file changes; it is brittle to editor class renames and needs a visual check.
- Not recommended: a pure SVG writer from the IR and the stored layout. Edge routes are computed by the editor's router at render time (`utils/orthogonal-router.js`), and the metamodel layout is re-run on open (the 3 s watcher), so a writer would re-implement the renderer and still drift from what the clone shows.
- Files L-C would touch: `frontend/scripts/library/snap-gallery.ts` (new), `frontend/public/library/gallery/<id>/1.preview.png` ×7 (new binaries), optionally `gallery.test.ts` (asserts each preview exists). Estimated run: ~2.5 min for the seven, plus a cold Vite compile.

## 5. Tokens and components (read)

- No `tokens/entities.css` (`find frontend/src/styles -name 'entities*'` → empty, exit 0; control: the same `find` returns `styles/tokens/_typography.scss` for `_typography*`). Token homes: `frontend/src/styles/tokens/` (`_colors-light`, `_form-palettes`, `_gradients`, `_layout`, `_radius`, `_shadows`, `_spacing`, `_transitions`, `_typography`, `_z-index`, `index.scss`) and `frontend/src/styles/tokens.css` (imported `App.tsx:8`; «tokens.css wins», `_colors-light.scss:400`).
- Categorical palette: `styles/tokens/_colors-light.scss:327-353` «ENTITY CATEGORICAL PALETTE», `--color-entity-<kind>-bg/-fg` (container, class, object, enum, literal, attribute, parameter, reference, operation); `--color-entity-model-bg: #F3E8D3`, `-fg: #6B5110`. The handoff's M/m pair (`#534ab7`/`#eeedfe`, `#854f0b`/`#faeeda`) is not a token: hardcoded in `components/common/element-badge.scss:23-24, 29-30`, `components/megamodel/MegamodelView.scss:251-267, 457, 462`, `components/project/project-editor.scss:662-663, 793-794`. Reuse `ElementBadge` (`components/common/ElementBadge.tsx`) rather than new hex.
- IBM Plex Mono: `--font-mono: 'IBM Plex Mono', …` (`_typography.scss:16`), `--font-family-mono` (`tokens.css:147`); loaded from Google Fonts (`_typography.scss:88`, weights 400/500/600), no `@font-face`, no fontsource.
- Grades: `tokens.css` has `--color-slate-50..900` (slate-100 `:28`, -300 `:30`, -500 `:32`, -600 `:33`, -700 `:34`), `--color-green-*` (100 `:89`, 700 `:95`), `--color-blue-*` (100 `:103`, 700 `:109`), `--color-red-*`, `--color-yellow-*`. **Missing**: any violet grade (`--color-auto-resolved-text: #6d28d9` `_colors-light.scss:184` is purpose-named), amber 100/700 (`--color-warning-text: #b45309` `:430` is amber-700 by value; SCSS `$amber-50/500/600` only, `:52-54`). Level tokens would be new; collision-free names: `--level-*` and `--color-level*` have 0 hits.
- Focus: `--color-border-focus: #{$slate-600}` = `#475569` (`_colors-light.scss:93`) matches the handoff; `tokens.css:278` `--focus-outline: 2px solid var(--color-cyan-500)` does not. Two sources disagree; L-B uses `--color-border-focus`.
- Components: `components/common/Button/Button.tsx:3` `ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'` (already used by Templates, `:96-97`); a second `components/ui/Button/Button.tsx` (CSS modules); global `.btn-*` in `styles/components/_buttons.scss`. Badge: `components/common/Badge/Badge.tsx`. No generic Chip, Tabs, SearchField or Modal: dialogs use `.dialog-overlay`/`.dialog-content` (`components/CreateProjectDialog/create-project-dialog.scss:6, 48`), size variants as modifiers (`:369`); tabs ad hoc (`codegen/ui/CodePanel.tsx:418-422`); `ui/SegmentedControl` for single choice; `aria-pressed` used in 10 files (e.g. `TreeViewSidebar/TreeViewScopeBar.tsx:57`).
- Collision list (`rg -l` under `frontend/src`): free — `level-badge`, `--level-`, `--color-level`, `notation-card`, `NotationsPage`, `Notations.tsx`, `NewModelDialog`, `start-here`, `filter-chip`; taken — `LevelBadge` (comment only, `Navbar.tsx:606`), `new-model` (`components/project/project-editor.scss`), `chip` (111 files, incl. `pages/components/catalog/catalog.scss`), `Chip` (36), `concept` (18), `preview` (pages: `TokenPreview.tsx`, `tokenPreview.scss`, `dashboard.scss`; 0 in `Templates.*`). A page-scoped prefix (e.g. `tpl-`) avoids them.

## 6. Catalog content against the handoff's §2.5 (measured)

Method: each `.jjodel` is JSON whose `state` is lz-compressed; decompressed with `async-lz-string` as `gallery.test.ts:77` does, then `state.idlookup` walked: classes from `DPackage.classes` (primitives excluded), enums from `DPackage.enumerators`, references split by `composition`, inheritance from `DClass.extends`, models by `instanceof`, viewpoints from `DViewPoint` and their `DViewElement`s, transformations from `transformations` and `megamodel.edges`, codegen and simulation from `_state.genTemplates`, `_state.sim*`, `_state.runScenarios`. Probe scripts `/tmp/tplui-probe/{decode,analyze,mult}.js`.

| entry | metamodel: classes / abstract / enums / attrs | containment | non-containment | inheritance | models (objects) | VPs (hand-written) | codegen | simulation |
|---|---|---|---|---|---|---|---|---|
| library@1 | Library 6 / LibraryItem / 0 / 6 | items, members, writers | borrowedBy [0..1], authors [0..*] | Book, Magazine → LibraryItem | sample-Library (9) | Library | — | — |
| shapes@1 | Shapes 4 / Shape / 0 / 4 | shapes Canvas→Shape | — | Circle, Square → Shape | sample-Shapes (4) | Shapes | — | — |
| graph@1 | Graph 3 / — / 0 / 1 | nodes, edges | source, target Edge→Node | — | sample-Graph (11) | Graph | — | — |
| state-machine@1 | statemachine 3 / — / 1 `StateKind{initial, normal, final}` / 11 | states, transitions, substates State→State | outgoing [0..5], source, target [1..1] | — | sample-StateMachine (10) | StateMachine | — | — |
| families-persons@1 | Families 2 / — / 0 / 2; Persons 3 / Person / 0 / 1 | father, mother, sons, daughters | four opposites Member→Family | Male, Female → Person | sample-Families (11), sample-Persons (9) | Families, Persons | — | — |
| turnstile@1 | DemoESM 5 / — / 0 / 4 | transitions | nextState, event | Initial, Terminal → State | demoESM (10) | Turnstile statechart | 12 templates | `extendedStateMachine`, 1 scenario (7 steps) |
| petri-producer-consumer@1 | DemoPetri 5 / PNode / 0 / 3 | **none** | src, tgt Arc→PNode | Place, Transition → PNode; InhibitorArc → Arc | demoNet (13), producerConsumer (19) | Petri net | 13 templates | `petri` bound 4, 1 scenario on producerConsumer (8 steps) |

- Every entry also carries the `Default` viewpoint. No transformation in any file (`transformations: []`, `megamodel.edges: []`). No stored validation rule in any file (no `DValidation*`; the Petri `rules` key is an IR marker rule).
- **StateMachine carries one error on purpose, from the built-in conformance check**, not a stored rule: `StateMachine.ecore:46-47` declares `kind` `lowerBound="1"`; `sample-StateMachine.xmi:34-35` «no `kind`: the [1..1] violation this fixture exists to produce»; the packaged `Broken.kind` is `[]`; `ConformanceValidator.ts:163-197` reports `missing_required_attr` with severity `error`; `gallery.test.ts:271` guards it. A static re-implementation of multiplicity, required-attribute and abstract checks over the seven finds that one error and no other (approximation, not a browser run).
- Stale number: `discovery_2026-10-18_notation_library.md:268` gives the Graph model 10 objects; the package has 11.

Concepts beside the handoff (input for Q3, not a decision):

| id | handoff | shown by the package | gap |
|---|---|---|---|
| library@1 | containment, inheritance, references | + abstract class | none wrong |
| shapes@1 | inheritance | + containment, abstract class | containment missing |
| graph@1 | references | + containment | containment missing |
| state-machine@1 | enumerations, containment, validation | + references, recursive containment (substates) | «validation» is a conformance error, not a user rule |
| families-persons@1 | transformation, containment, inheritance | containment, inheritance, references (opposites), two metamodels | **«transformation» is wrong**: none stored; the handoff's own copy says «The transformation is yours to write» |
| turnstile@1 | code generation | + simulation, inheritance, containment, references | simulation missing |
| petri-producer-consumer@1 | code generation, references | + simulation, inheritance, abstract class, two models | simulation missing; **no containment** |

The concept vocabulary lacks «simulation» and «multiple metamodels», the two concepts that set the examples and Families and Persons apart.

## 7. Lane split

File sets (each from §1–§6; new files marked *new*):

- **L-B1, Templates page and catalog fields** (from `library-gallery`): `frontend/src/pages/Templates.tsx`, `frontend/src/pages/Templates.scss`, `docs/library/catalog.json`, `frontend/public/library/catalog.json` (copy, kept identical by `gallery.test.ts:130-131`), `frontend/src/library/__tests__/gallery.test.ts`, `frontend/src/styles/tokens.css` (level tokens). Six files: rule 19 pause expected. `GalleryEntry` (exported, `Templates.tsx:14`) gains optional fields only (rule 11). The card renders `preview` when present and nothing (or variant C) when the asset is missing, so it does not wait for L-C.
- **L-B2, dashboard shell for Templates** (from `library-gallery`): `frontend/src/pages/components/LeftBar.tsx` (hide FILTERS on `templates`, active state, `aria-current`), `frontend/src/pages/dashboard.scss` (`.item.active` restyle), `frontend/src/components/NotificationWidget/NotificationWidget.tsx` (no tip on `#/templates`). The active state applies to every dashboard page that uses `Item`: a visible change beyond Templates.
- **L-C, preview snapshot pipeline** (from `library-gallery`): `frontend/scripts/library/snap-gallery.ts` *new*, `frontend/public/library/gallery/<id>/1.preview.png` ×7 *new*. The catalog `preview` values are written by L-B1 at the conventional path (`<id>/<n>.preview.png`), so L-C does not touch the catalog. `check:scripts` applies.
- **L-D, New model dialog, «Metamodel in this project» tab only in 3.2** (from `library-gallery` or the trunk after merge): `frontend/src/components/NewModelDialog/NewModelDialog.tsx` *new* and `.scss` *new*, `frontend/src/components/project/ProjectEditor.tsx` (`handleNewModelClick` `:1124` and the `CREATE_MODEL` listener `:1166` open the dialog; a new open event's listener), `frontend/src/events/registry.ts` (an `OPEN_NEW_MODEL_DIALOG` constant), `frontend/src/pages/components/Navbar.tsx` (`createM1` gains `name0?`, `:102`). Notations page, route and BROWSE item: after S4/S5.
- **L-E, File › New, 3.2 structure** (after L-D): `frontend/src/pages/components/Navbar.tsx` (File items; `MenuEntry` gains a section-label form, local type, not exported), `frontend/src/pages/components/menu/menu.scss` or `navbar.scss` (label row). Items: Project…, Metamodel, Model › CONFORMING TO + metamodels (above 5: recent + More… → dialog), Viewpoint (`CREATE_VIEWPOINT`), Transformation (`OPEN_NEW_TRANSFORMATION_DIALOG`), From template… (`#/templates`). No Built-in section, no Browse notations….

Overlap matrix (✗ = shared file):

| | L-B1 | L-B2 | L-C | L-D | L-E |
|---|---|---|---|---|---|
| L-B1 | | — | — (preview path by convention) | — | — |
| L-B2 | | | — | — | — |
| L-C | | | | — | — |
| L-D | | | | | ✗ `Navbar.tsx`; L-E dispatches L-D's event |
| L-E | | | | | |

- Critical zone (CLAUDE.md §3.1/§3.2): no lane touches a §3.1 file. Risk for L-D: `createM1` contains `DModel.new`, a D-layer creator in a non-test source under `frontend/src`, which the RC-15 hooks read as a §3.2 write path; the change is an optional name, but the hook may ask for a Layer Impact Report.
- Parallel (RC-22): L-B1, L-B2, L-C and L-D have disjoint DOVE lists and no shared exported interface; each needs its own worktree. L-E queues after L-D (shared `Navbar.tsx`, and «More…» opens L-D's dialog). Visual checks: L-B1, L-B2, L-C, L-D, L-E all change pixels; RC-22's shape («one lane with a visual check plus as many without») suggests L-C and L-B1 first (L-C's PNGs are checked as files, L-B1 in the browser), then L-B2 and L-D, then L-E.
- Branch: L-B1, L-B2, L-C need `library-gallery` (the Templates page and the packages are not on the trunk); L-D and L-E can start from the trunk but would conflict with nothing on `library-gallery` nothing: measured, `git diff --stat alfonso-frontend-jjtl...tplui-disc` over `Navbar.tsx`, `ProjectEditor.tsx`, `events/registry.ts`, `LeftBar.tsx` is empty (exit 0), while the same command without paths reports 61 files changed. Simplest: all from `library-gallery`, merged before it reaches the trunk, or all after its merge.

**Proposed 3.2 cut**: L-B1, L-B2, L-C, L-D (metamodel tab only), L-E (Advanced and Basic without built-in notations). Out of 3.2: the Notations page, the Built-in tab, Basic's Model › <notation> list, Browse notations…, Q1 and Q2 (all wait for S4/S5 and, for the seal, S3/S6 after 3.2), Collections (§8).

## 8. Risks

1. **The handoff's Basic File › New is built on notations that do not exist in 3.2.** Without them, Basic's Model submenu would be empty; the 3.2 cut keeps «Conforming to» in Basic too.
2. **Variant D vs the real diagram.** A snapshot of the M2 editor is not variant D; restyling it at capture time is brittle to class renames; not restyling breaks Alfonso's chosen style.
3. **Preview legibility.** Tall metamodels fit into 136 px at ~16–25 % scale; the 8-class threshold never fires on today's seven entries. L-C has to measure a readability rule (scale or aspect, not class count).
4. **Mode reactivity.** R-LIB-15 depends on an accessor that is either stale on reset (Redux) or non-reactive (localStorage); the open ticket's root cause was not found.
5. **`createM1` and the critical-zone hook** (§7): an optional parameter may trigger an `ask` and a Layer Impact Report.
6. **`NEW_PROJECT` from inside a project** may be a dead event (§2, read only); File › New › Project… inherits it.
7. **Sidebar active state is global** to the dashboard: L-B2 changes All projects, Explore and the others, not only Templates.
8. **Two focus tokens disagree** (`--color-border-focus` slate vs `--focus-outline` cyan); picking one in L-B leaves the other in place.

## 9. Decisions taken (unattended)

1. The 3.2 cut of §7 (Notations page, Built-in tab and Basic notation entries deferred to S4/S5) — recommended as the reading of ratified R-LIB-7; listed again below because it moves a handoff item out of the release.
2. Previews are PNG at pixelRatio 2, not SVG (measured: 1.4–6.8 MB per html-to-image SVG).
3. Previews come from headless Chromium against a dev server in a new `snap-gallery.ts`, not from a pure SVG writer and not from `build-gallery.ts`.
4. A preview for an existing `@1` is added beside its package without a new version: the package bytes and sha256 do not change, so R-LIB-9's «never rewritten» holds; the handoff's «`@n` is the regeneration trigger» applies from `@2` on.
5. Template previews show the metamodel, example previews the model with the scenario; the catalog `preview` path is conventional (`<id>/<n>.preview.png`), written by L-B1.
6. The Advanced-only id reads `useSelector(s => s.advanced) || isAdvancedMode()`.
7. The concept vocabulary gets «simulation» and «multiple metamodels» as candidates for Q3 (proposal only, the table stays Alfonso's).
8. Variant D vs the real diagram for metamodel previews (Alfonso chose variant D; the handoff also asks the preview to match what the clone shows): capture the real diagram with a capture-only stylesheet that approximates variant D (white header, slate-300 hairline, 600 names), checked visually in L-C, dropped if it proves brittle. Not an RC-26 item; vetoable in the digest (RC-25).

## 10. Decisions awaiting Alfonso (RC-26)

1. **Handoff vs R-LIB-7 (ratified): the Notations page, the Built-in notation tab and File › New › Model › <notation> in 3.2.** The handoff says «Release: 3.2, consistent with R-LIB-7», but R-LIB-7 and R-LIB-10 keep every sealed notation out of 3.2, and nothing exists to create from (§3.3). Recommended: defer all three to the S4/S5 release; ship the New model dialog with the metamodel tab only and File › New without a Built-in section.
2. **Handoff Q1 (BPMN card link to the gallery example) and Q2 (Model › <notation> outside a project)** have no object in 3.2 under the cut above. Recommended: park both with the Notations page.
3. **Handoff Q3, level and concepts** (§6): `families-persons` has no transformation and the tag is wrong as written. Recommended: replace «transformation» with «multiple metamodels» (or a «transformation-ready» note in the callout), add «simulation» to both examples, add «containment» to Shapes and Graph, remove nothing else.
4. **Handoff Q4, Collections**: no finding changes it. Recommended: out of 3.2 (handoff §8 already defers it).

Items 2–4 are the handoff's own closed list (§10), reported here with the evidence; item 1 is the only conflict with a ratified row. No conflict was found with R-LIB-1..6, R-LIB-8..10 or D-UI-15 (the handoff excludes the dark theme, §1).
