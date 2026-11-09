# Discovery: dashboard drop import (Phase 1)

- Prompt-ID: P-2026-11-08-1845
- Prompt file: `docs/prompts/claude_2026-11-08_1845_prompt_dashboard_drop_import.md`
- Session: f9f6dfce-24de-4e16-bf91-4ef790c120cd
- Tree: `~/jjodel-w-dropimport`, branch `dashboard-drop-import`, HEAD `89ad4e5fb`
- Executor model: Claude Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

## Objective

Establish the facts the Phase 2 lanes need for the drop import designed in Claude Design. No source, style, test or config was edited.

## How the measures were taken

Tag **[measured]** is a run in this phase; **[read]** is a reading of a file at HEAD `89ad4e5fb`.

- Dev server from this tree: Vite on port 3055, stopped at the end. `frontend/node_modules` was already a symlink at the start of the lane; the lane neither created nor removed it. `git status` was empty before and after.
- Three throwaway Playwright scripts in `/tmp/jjodel-probe-P-2026-11-08-1845/`, uncommitted, outside the repo.
- Chromium 151.0.7922.34 (full browser, headless), Playwright 1.62.1, viewport 1440x900, offline user seeded as `frontend/scripts/smoke/states.ts:105` does, `data-theme="light"` read from the DOM (D-UI-15).
- Drags are real browser input: CDP `Input.dispatchDragEvent` with `data.files` (mask 1, copy, unless stated). Events were recorded by capture listeners on `window`; `defaultPrevented` was read after dispatch.
- Valid fixtures: `frontend/public/examples/codegen/turnstile.jjodel` and `petri-producer-consumer.jjodel`.
- Run 1 is discarded except where cited: its fixture came from a never-saved project (empty `state`), and `goto` to a hash on the same document does not reload. Run 2 reloads through `about:blank`.

**Limits of these measures.** Offline mode only: the online path (`Online.import`) is read, not run. Chromium only. CDP `dragCancel` is not a real Esc (see Q8). The probe did not run in the desktop app's built-in browser; it used DOM and console as Q4 asks.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A `.jjodel` is imported only from the dashboard's Import modal (prompt, Contesto) | **Falsified.** Four entry points, one of them an existing dashboard-wide drop (Q1) |
| H2 | The import logic is a function, not wired in the component | **Partly.** Parse and load are one function; reading the file is written three times (Q1) |
| H3 | The `(1)`, `(2)` suffix is applied on import | **Falsified.** Import uses ` copy`, ` copy2`, ` copy3` (Q2) |
| H4 | A file that fails is reported as a failure | **Partly.** Only a non-JSON file on the dashboard; `{}` and an empty state report success (Q2) |
| H5 | A toast system exists | **Holds**, with gaps against the design (Q3) |
| H6 | A file dropped on `#/allProjects` makes the browser navigate away | **Falsified** (Q4) |
| H7 | The modal renders in a portal | **Falsified** (Q5) |
| H8 | The list refreshes after an import without a reload | **Holds** (Q6) |
| H9 | `importFromText` returns the id "Open project" needs | **Falsified**, except on the gallery-clone path (Q6) |
| H10 | Every design value maps to an existing token | **Partly**: one gap (Q7) |

## Q1. Import path

**The modal** is inline JSX in `frontend/src/pages/AllProjects.tsx:101-114`, not a component. `:105`: `<div className={'body'}>Drop the file to import a .Jjodel project</div>`; `:107`: `<button className={'dark'} onClick={ProjectsApi.import}>select project</button>`. It opens only from the Import button, `:126`: `onClick={() => setDropping(true)}`. [read]

**Parse and load** are one function, `frontend/src/api/persistance/projects.ts:263`: `static async importFromText(content: string, name: string = '', date: number = Date.now(), clone?: { clonedFrom: string }): Promise<DProject['id']>`. `:264` is the parse: `const json = JSON.parse(content) as Record<string, unknown>;`. [read]

**Callers** (`command grep -rn` over `frontend/src`, five hits, the search being its own control): [read]

| Site | Files | Reads with | Extension filter | Failure handling |
|---|---|---|---|---|
| `pages/AllProjects.tsx:62-77` modal drop | all, loop | `FileReader` | none | none: not awaited, no `catch` |
| `pages/components/Dashboard.tsx:290-310` page drop | `files[0]` only | `FileReader` | `file.name.endsWith('.jjodel')`, case-sensitive | `try/catch`, `U.alert` |
| `api/persistance/projects.ts:311-329` `ProjectsApi.import` | `files[0]` | `U.fileRead`, detached input | `['.jjodel']` as picker filter | `try/catch`, `U.alert` |
| `pages/Templates.tsx:103` gallery clone | n/a (text already fetched) | n/a | n/a | not read beyond the call |

`ProjectsApi.import` is used by the modal (`AllProjects.tsx:107`) and by the navbar, `pages/components/Navbar.tsx:1485`: `isProject ? null : {name: 'Import Project', function: ProjectsApi.import, icon: <i className="bi bi-upload" />},`.

`components/common/ImportDropZone.tsx` handles `.ecore` and `.xmi` only and has no consumer: every `ImportDropZone` hit in `frontend/src` is its own `.tsx` or `.scss`. It holds the only drag-counter pattern (`:28`). [read]

## Q2. Collisions and failures

**Collision** [measured, valid fixture, offline, `#/allProjects`]: the same file dropped three times gives `Turnstile copy`, `Turnstile copy2`, `Turnstile copy3`. Every import takes a new id. The file name is not used for the project name.

Code [read]: `pages/components/Project.tsx:144`: `if (project.name.indexOf('copy') === -1) project.name += ' copy';` then `:157`: `project.name = U.increaseEndingNumber(project.name, false, false, (str)=> { return !!projectNames[str]; })`. The `(1)`, `(2)` form exists only for gallery clones, `api/persistance/projects.ts:346`: ``for (let i = 1; taken.has(unique); i++) unique = `${base} (${i})`;``. The Replace/Duplicate dialog is disabled, `:282`: `let dialogDuplicate: boolean = false;`.

**Duplicate names off the Projects page** [measured]. `duplicateProject` takes names from the store. On `#/archive` the store does not hold the list: `reducer.ts:1628` `let isDashboardPage = windoww.location.hash.indexOf('#/allProjects') === 0;` gates `ProjectsApi.getAll()` at `:1712-1713`. A drop on `#/archive` with `Turnstile copy` already in localStorage added a second `Turnstile copy`.

**Failures** [measured unless marked]:

| File | Dropped on | Toast | Projects added | Console |
|---|---|---|---|---|
| Not JSON (`bad.jjodel`) | dashboard | error "Import failed" | 0 | none |
| `{}` | dashboard | **info "Project imported"** | 0 | `Transaction failed` |
| Valid JSON, `state: ''` | dashboard | **info "Project imported"** | 0 | `Transaction failed` |
| `.pdf` | dashboard | warning "Invalid file type" | 0 | none |
| `.pdf` then `.jjodel` in one drop | dashboard | warning "Invalid file type" | 0 (the `.jjodel` is skipped) | none |
| `UP.JJODEL` | dashboard | warning "Invalid file type" | 0 | none |
| `.pdf` | modal area | none | 0 | uncaught `SyntaxError` as unhandled rejection |
| Valid `.jjodel` | modal area | none (silent success) | 1 | none |

A valid import after the two false successes still worked (`Producer-consumer copy2` added), so the failed transactions did not wedge the store.

Why the false success [read]: outside the clone path the transaction is not awaited, `projects.ts:306`: `if (clone) await done;`, and `TRANSACTION` swallows the error, `redux/action/action.ts:222`: `} catch (err: any) { e = err; ABORT(); }`. Only the synchronous `JSON.parse` can reject to the caller.

Online failure [read, not run]: `projects.ts:602` alerts `'Cannot import project!'`, returns normally, and `:304` `CreateElementAction.new(project);` still runs.

Unexplained: failing transactions log `{depth: 2}` on a single import. Not investigated. `END` returns `false` at depth above 0 (`action.ts:155`), so the return value of `done` cannot be assumed to mean failure without measuring it.

## Q3. Notifications

A toast system exists, so this lane does not end with `Outcome: question` on this ground.

Mount: `App.tsx:122` `<ToastProvider>`; API: `toast.success(...)` etc. from `components/Toast` (`toastDispatch.ts:71`), usable with no React context. `U.alert` is a deprecated facade over the same event (`common/U.tsx:387`), and it is what the three import sites use. [read]

Rendered [measured]: container portaled to `<body>`, rect `[1104, 769.6, 320, 82.4]` at bottom-right; `.jj-toast` has `role="alert"` and `aria-live="polite"`; buttons in DOM order `["Dismiss", "Open project"]`.

Gaps against the design:

- **No persistent live region.** The container has no `aria-live` [measured: `null`] and is unmounted when empty, `ToastContainer.tsx:18`: `if (toasts.length === 0) return null;`. Every toast, success included, is `role="alert"` (`Toast.tsx:104`). The design wants a polite region and `role="alert"` only on errors. Both are shared by every toast in the app.
- **One action only.** `ToastAction` is a single `{label, onClick}` (`toastTypes.ts:7`). "Dismiss" exists as the icon button (`Toast.tsx:117`: `aria-label="Dismiss"`), not as a text button.
- **User preferences can suppress it.** `ToastContext.tsx:126`: `if (typePref && !typePref.enabled) return;` applies to every type on the event channel.
- **Durations.** Success defaults to 3000 ms (`toastTypes.ts:38`): "Open project" needs `duration` or `dismiss: 'manual'`.
- **Cap.** `MAX_TOASTS = 5` (`ToastContext.tsx:38`), so per-file toasts on a larger drop lose the oldest.

## Q4. Current drop behaviour

Handlers [read]: React handlers on `.dashboard-container` (`Dashboard.tsx:324-326`), on the modal (`AllProjects.tsx:102-103`), on the canvas (`EditorV2.tsx:5114-5115`, `5305-5306`, `5316-5317`), plus palette and view handlers (`MetamodelTab.tsx`, `DV.tsx`, `PalettePanel.tsx`, `FeaturesPalette.tsx`, `jjtl/views/*`, `ClassNode.tsx`, `EnumNode.tsx`).

No listener for a drag event on `window` or `document`: `command grep -rnE "addEventListener\(\s*['\"](drop|dragover|dragenter|dragleave|dragend)['\"]"` over `frontend/src`, exit 1, 0 lines; the same command with `keydown`, exit 0, 83 lines.

Measured:

| Where | File | `dragover` prevented | `drop` fired | Result |
|---|---|---|---|---|
| `#/allProjects`, `.dash-content` | `.jjodel` | yes | yes, prevented | imported, URL unchanged |
| `#/allProjects`, `.dash-content` | `.pdf` | yes | yes, prevented | warning toast, URL unchanged |
| `#/allProjects`, `.leftbar` | `.jjodel` | yes | yes, prevented | imported |
| `#/allProjects`, two `.jjodel` | both | yes | yes (`files` = 2) | first only |
| `#/archive` | `.jjodel` | yes | yes, prevented | imported |
| Editor, no tab | `.jjodel`, `.pdf` | **no** | **no** | nothing; URL unchanged, no navigation event |
| Editor canvas, mask copy | `.jjodel` | yes | no (`dropEffect = 'move'`, `dragleave` instead) | nothing |
| Editor canvas, mask copy+link+move | `.pdf` | yes | yes, prevented | nothing (`EditorV2.tsx:2744`: `if (!rawType) return;`) |
| Modal backdrop | `.jjodel` | yes | no (`dropEffect = 'none'`) | nothing, modal stays open |

The editor's no-navigation result is what this harness showed; it does not prove that a real OS drag on a desktop browser behaves the same where `dragover` is not prevented. Phase 2 does not touch the editor.

`files.length` is 0 during `dragover` [measured]; the file list is available only on `drop`. A text drag shows no overlay [measured, `items[0].kind` is `string`].

## Q5. Mounting

Page: `AllProjectsComponent`, `pages/AllProjects.tsx:19`, route `App.tsx:142`, inside `Dashboard` → `GenericDashboard` (`pages/components/Dashboard.tsx:258`), which every dashboard page shares.

DOM [measured]: `.dashboard-container` has two children, `.leftbar` `[0, 45, 240, 823]` and `.dash-content.projects-view` `[240, 45, 1200, 823]`. **The main content area is `.dash-content`.** `.dashboard-main-content` is only as tall as its content (370 px with an empty list). An earlier run in a different browser build read y=50, h=818 for the same element; the overlay's rect must be computed at verification, not hardcoded.

`.dash-content` scrolls: `overflow-y: auto`, `position: static`, `clientHeight` 823, `scrollHeight` 1019 with 18 projects. An absolute child anchored to it would scroll with the content. `.dashboard-container` is also `position: static`.

Modal [measured]: no portal. `.project-dropping-container` is a child of `.router-wrapper`, a sibling of `.dashboard-container`, `position: absolute`, rect `[0, 0, 1440, 900]`.

**One import per drop today**: a drop on the modal cannot bubble to the dashboard handler because the dashboard is not its ancestor. Measured: exactly 1 project added, no dashboard toast, no dashboard overlay. A listener on `window` would still see the event in capture, as the probe's did, so the import must stay on a React handler of the dashboard tree, or check that the modal is closed.

Two modal behaviours Phase 2 inherits [read]:

- `AllProjects.tsx:102`: `onClick={mouseleave}` on the container, with no `stopPropagation` on the area: **any click inside the modal closes it.** A `<label>` wrapping an `<input type="file">` would unmount the input before its `change` fires. Today's picker survives only because `myFileReader` creates a detached input (`common/U.tsx:2991`).
- The picker reads `files[0]` even when more are chosen (`projects.ts:325`).

## Q6. List and opening

**Refresh** [measured]: after an import the store's `projects` grows and the new name is in the DOM, no reload. `CreateElementAction.new(project)` (`projects.ts:304`) → `mapStateToProps`, `AllProjects.tsx:171`: `ret.projects = LProject.fromArr(state.projects);`.

**Open** [read]: `pages/components/Project.tsx:195`: ``R.navigate(`/project?id=${data.id}`+(repair ? '&repair=1' : ''), true);``.

**The id is not available today** [measured, `ProjectsApi.importFromText(text)` with no clone]: the promise resolves with the **file's original id**, with 0 projects added at that moment; about 3 s later 1 project exists with a **new** id and the returned id is not in storage. Code [read], `projects.ts:306-307`: `if (clone) await done;` / `return project.id;`. `project` is reassigned only after the `await` inside the transaction (`:292`).

So "Open project", the marker and real sequential import all need the transaction awaited on the non-clone path. `pages/AllProjects.tsx:72` runs imports concurrently today; two at once both landed [measured], but one run-1 case logged `Transaction aborted. {depth: 2}` with an invalid fixture.

**Card marker** [measured]: the default view is `Slider view` and renders `article.gallery-card` (`Project.tsx:582`, via `Catalog.tsx:503` `mode="gallery"`); `.project-card` count is 0. The other `Project` site in `Catalog.tsx` is `:111` `mode="list"`. No project element carries a `data-id` [measured]. `.project-card__accent` (`Project.tsx:328`) belongs to a variant `Catalog.tsx` does not render; a search of `Project.tsx` for a gallery accent found only `:582` (`.scss` not searched).

## Q7. Tokens

Computed values [measured, `:root`, light]:

| Design value | Token | Computed |
|---|---|---|
| slate-700 | `--color-slate-700`; semantic `--color-accent`, `--color-brand`, `--color-text-secondary` | `#334155` |
| slate-100 | `--color-slate-100`; semantic `--color-bg-tertiary` | `#f1f5f9` |
| 16px modal radius | `--radius-modal` (→ `--radius-xl`) | `16px` |
| 8px button radius | `--radius-button` (→ `--radius-md`) | `8px` |
| Success for accent bar | `--color-success`; `--color-success-hover` | `#22c55e`; `#16a34a` |
| 16px inset | `--space-4` | `1rem` |

**Gap:** no token for `rgba(241,245,249,0.94)`. `command grep -rn "241, *245, *249" styles/tokens`, exit 1; control `34, *197, *94` on the same path, exit 0, 2 lines. No token added here.

`--color-slate-*` definition site not located: a search of `styles/tokens/` for `--color-slate-(100|700):` found none (the same command matched `--space-4:`), yet the variable resolves. `--z-modal` computes to 1050 (`styles/tokens.css:216`), not the 9999 of `styles/tokens/_z-index.scss:31`. `.drop-overlay` uses a literal `z-index: 1000`, below it.

## Q8. Proposal for Phase 2

Rule 19 caps a lane at five files without confirmation, so C is split.

**Lane A: shared function, filter, tests.** New pure module for the extension filter and partition of a `FileList`; `importJjodelFile`, with the importer injectable; `projects.ts` (await the non-clone transaction, return the new id, detect a failed transaction by whether the new id is in `store.getState().projects`, not by `done`'s boolean); `Dashboard.tsx:290-310`, `AllProjects.tsx:57-80` and `ProjectsApi.import` delegate. `projects.ts` does not load in node (`library/__tests__/gallery.test.ts:15`), so the bench exercises the module with a stub importer. Tests: filter table including `UP.JJODEL`; order kept; at most one import in flight; a failing file does not stop the next; a failed transaction is a failure. Visible change only if open question 3 is answered yes.

**Lane B: modal and empty state.** `AllProjects.tsx`, `dashboard.scss`, `EmptyDashboard.tsx` (optional prop), `empty-dashboard.scss`, `Catalog.tsx`. Clicks inside the panel must stop reaching the container's `onClick`. Existing classes stay (Rule 2).

**Lane C1: hook and overlay.** Drag state, `.dashboard-container` handlers, overlay. `dataTransfer.types.includes('Files')` decides during `dragover`, not `items[0]`.

**Lane C2: progress panel, toasts, marker, crops.**

| Element | Current | Expected | DOM measure |
|---|---|---|---|
| Overlay | `.drop-overlay` fixed, `[0,0,1440,900]`, `rgba(71,85,105,0.8)`, covers sidebar and navbar | Over `.dash-content` only, inset 16 | Rect equals `.dash-content` rect minus 16 per side, also with `scrollTop > 0`; no intersection with `.leftbar`; computed `border` 2px dashed `rgb(51,65,85)`, radius 16px, `pointer-events: none`, `aria-hidden="true"` |
| Progress panel | Absent (`command grep -rnE "Importing [0-9N{\$]\|importing-panel\|ImportProgress"`, exit 1; control `Importing`, exit 0, 12 lines) | Bottom-right, title "Importing N project(s)", one row per file | Row count equals `.jjodel` count; rect does not intersect `.jj-toast-container` (same corner by default) |
| Toasts | Info "Project imported"; no action; `role="alert"` on all | Success with "Open project"; error `role="alert"`; polite region | `.jj-toast--success .jj-toast__action` text; click reaches `#/project?id=<new id>`; region present before the first toast |
| Card marker | None on `.gallery-card` | Top accent bar and "Imported" badge for a few seconds, in gallery and list | Marker present on exactly the new card, absent after the timeout; reachable in both view modes |
| Modal drop area | `.project-dropping-area` 800x350, buttons | Per design, multiple, value reset | `input[type=file]` has `accept=".jjodel"`, `multiple`; `value === ''` after a selection; clicking the label leaves the modal mounted; a drop adds exactly one project per file |

**Drag tracking and resets.** The existing leave condition is usable [measured]: a `dragleave` with `relatedTarget === null` clears the overlay; one towards a child keeps it.

- `drop`: clear in the handler, before the import starts. Measured today.
- `dragleave` with `relatedTarget === null`: clear. Measured today, synthetic event.
- Window `dragend`: no handler today; a synthetic `dragend` left the overlay on. **Not sufficient on its own**: no `dragend` was observed in any file drop of this probe, as the drag source is outside the document. Add it, but do not rely on it.
- Cancel: CDP `dragCancel` delivered no `dragleave` to the page and left the overlay on. Whether a real Esc behaves that way cannot be measured here: an item for Alfonso's GO (RC-23).

Test cases, on a pure transition function importable in the bench: `drop` clears; `dragend` clears; `dragleave` with null related clears; `dragleave` to a descendant keeps; `dragleave` to an outside element clears; `dragover` without `Files` does not raise; route other than `All` does not raise; modal open does not raise. Mutation bench per `CLAUDE.md` §5.

## Dependencies and risks

- `projects.ts` change alters when three existing callers resolve. Not sync layer (§3.2 not triggered), but it is the persistence path: report under Rule 20.
- Toast accessibility changes affect every toast in the app.
- Removing the handler from other dashboard pages also removes `preventDefault` there, leaving the browser default on those pages.
- `/\.jjodel$/i` accepts `UP.JJODEL`, rejected today on the dashboard and unfiltered on the modal.
- Safari and Firefox `dragleave` behaviour not measured.

## Open questions

1. Drop import exists today on every dashboard page, yet the design says `#/allProjects` only: restrict it? Recommended: import only when `active === 'All'`, keep `preventDefault` on the other pages so a drop never leaves the app.
2. The prompt says collisions stay unchanged, and the real convention is ` copy`, ` copy2`, not `(1)`: keep it? Recommended: keep it.
3. `{}` and empty-state files report "Project imported" today, but item 3 wants per-file failures: report them as failures despite "failure behaviour unchanged"? Recommended: yes, in lane A.
4. May lane A await the transaction on the non-clone path, which every feature in the design needs? Recommended: yes, as the gallery path already does.
5. May C2 change the shared toast (persistent polite region, `role="alert"` only on errors and warnings)? Recommended: yes, small and declared in scope.
6. Is the existing icon button labelled "Dismiss" enough, or is a text "Dismiss" button required? Recommended: keep the icon button.
7. Should user toast preferences be able to suppress import toasts? Recommended: yes, the progress panel still shows the outcome.
8. Which anchor for the overlay, given that `.dash-content` scrolls and is static? Recommended: `position: fixed` with the rect of `.dash-content` read at drag start and on resize, touching no shared layout.
9. Should the navbar "Import Project" go through the shared function, keeping one file? Recommended: yes, through `ProjectsApi.import` in lane A.

## Files read

Whole: `frontend/src/pages/AllProjects.tsx`, `frontend/src/components/common/ImportDropZone.tsx`, `frontend/src/components/EmptyDashboard/EmptyDashboard.tsx`, `frontend/src/components/Toast/Toast.tsx`, `frontend/src/components/Toast/ToastContainer.tsx`, `frontend/src/components/Toast/toastTypes.ts`, `frontend/src/components/Toast/toastDispatch.ts`.

Windows only: `frontend/src/pages/components/Dashboard.tsx:225-359`, `frontend/src/api/persistance/projects.ts:60-72, 255-373, 455-484, 590-613`, `frontend/src/components/Toast/ToastContext.tsx:1-140`, `frontend/src/common/U.tsx:380-419, 1353-1371, 1500-1522, 2991-3004`, `frontend/src/redux/action/action.ts:146-168, 205-254`, `frontend/src/redux/reducer/reducer.ts:449-452, 544-550, 1705-1718`, `frontend/src/pages/components/Project.tsx:128-199, 315-332, 632-677`, `frontend/src/pages/components/catalog/Catalog.tsx:100-128, 426-430, 496-512, 652-667`, `frontend/src/pages/dashboard.scss:168-327, 449-470, 520-534`, `frontend/src/pages/components/project-card.scss:97-105`, `frontend/src/components/Toast/toast.scss:6-30`, `frontend/src/components/editor-v2/EditorV2.tsx:2739-2788`, `frontend/scripts/smoke/states.ts:96-255`, `frontend/scripts/smoke/README-probes.md:1-70`, `docs/PROTOCOL.md` P4 and P14 (`:336-351`).

Searches only: `frontend/src/styles/tokens/` (`_colors-light.scss`, `_radius.scss`, `_spacing.scss`, `_z-index.scss`), `frontend/src/styles/tokens.css`, `frontend/src/App.tsx`, `frontend/src/pages/components/Navbar.tsx`, `frontend/src/pages/Templates.tsx`, `frontend/src/events/registry.ts`.
