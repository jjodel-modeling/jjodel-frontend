# Discovery 2026-11-19 — multi-tab: editor groups as in VS Code (Split Right)

Prompt: P-2026-11-19-1330 · Chat: C-2026-11-18-2337 · Branch: `multi-tab-groups` (worktree `~/jjodel-w-mtgroups`) · Base: ec4ea037e
Lane: full, discovery, read-only on source.

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the real files. Tags: **[read]**
by reading, **[measured]** by a command or a probe whose output is quoted. Line numbers are of ec4ea037e.

## 0. Goal

Alfonso (2026-11-19 13:23-13:26): the split must behave exactly as VS Code's editor groups, Split Right only (G1..G8 of
the prompt). This phase answers, on the current code: what rc-dock already gives for groups, what Jjodel must add,
whether L4c must precede, how to persist groups as a user preference, the width rule, the base branch, and the Phase 2
file list.

Hypotheses under test:

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | rc-dock 3.3 panels are editor groups: split right, drag between panels, save/load are native | **holds**, with three Jjodel additions (§2.4) |
| H2 | Each group already has its own tab strip | **falsified**: the rc-dock strip is hidden, the app bar is one strip for the whole dock (§2.3) |
| H3 | "Active group" is a notion the code already has | **falsified**: 29 code lines read `dockbox.children[0]` as the panel (§2.6) |
| H4 | The L6c/L6d active-pane machinery fits groups unchanged | **holds** on the trunk version, which reads dock rows (§3.2) |
| H5 | Closing the last tab of model A clears model B's sync registries | **holds, measured** (§4.2) |
| H6 | rc-dock's layout serialization is enough for G7 | **partly**: tabs, order, active tab, sizes yes; viewpoint and active group no (§5) |
| H7 | G9 (text as one more entry of the tab's picker) moves no data | **holds** by reading; three UI hazards found: the canvas lookup of the caret selection, the rail without a canvas, the lazy-bundle gate (§8.3) |

Sections 5 to 10 and this answer were written by P-2026-11-19-1350 (finish of the ceiling-stopped P-2026-11-19-1330),
from the parent's handoff and the reads listed in §1 under "Added by P-2026-11-19-1350".

### 0.1 Answer in brief

1. **rc-dock 3.3.2 panels are the groups.** Split right, drag between panels, closing an empty panel and save/load are
   native; Jjodel adds a `splitRight`, a `dockMove` veto for every other direction, and one active-group accessor that
   replaces 29 `children[0]` readers (§2).
2. **Strips:** the rc-dock per-panel strip is hidden and the app bar is one strip for the whole dock; showing a strip
   per group is the largest UI choice (Q1).
3. **L4c first:** closing model A's last tab clears model B's sync registries, measured (8 edges, 5 registered → 0, §4.2).
   With groups that is ordinary use. LIR in §4.4.
4. **Persistence (G7):** rc-dock `saveLayout` with `saveTab`/`loadTab` carrying model and viewpoint per tab, plus the
   active group, in `localStorage` under `jjodel.editorGroups.<userId|anon>.<projectId>`, shaped as `splitPersistence.ts` (§5).
5. **Width:** minimum group width **400 px**, together with a narrow-toolbar rule below 502 px. That gives two groups at
   1600 and at 1280. The 480 px minimum in the handoff would forbid any split at 1280 (§6).
6. **Base:** a fresh branch from the trunk `alfonso-frontend-jjtl`, which already has the dock-level split. This branch's
   L6f/N-pane work (14 files, +1135 −36) is not carried; `splitPersistence.ts` is reused as a shape (§7).
7. **Lane order:** L4c, groups core (2a, 2b), persistence, G9, width, the remaining readers. G10 is a later front (§8).
8. **G9:** the textual entry becomes a value of the tab's own viewpoint. `EditorSwitch` renders the Text editor in place
   of `EditorV2`, Split Right gives text beside the diagram, and nothing moves in the data. For a diagram change while
   the text holds an edit that does not parse, the recommendation is today's rule: the text is kept and not applied,
   and a Reprint button is offered (§8.3, Q9).

## 1. Files read

Under `/Users/alfonso/jjodel-w-mtgroups/`:

- Docs: `CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md` (loaded); `docs/PROTOCOL.md` P1-P13 (lines 18-225);
  `docs/decisions.md` R-MT-1..R-MT-28 (7999-8098); `docs/claude-code-log.md` headings 1-131;
  `docs/log-inbox/multi-tab.md` headings and the entries injected by lane-run;
  `docs/discovery/discovery_2026-11-08_l6e_split_toggle.md` 1-125;
  `docs/discovery/discovery_2026-11-18_multi_tab_split_n.md` §0 (17-50), §3.3 (121-150), §5 (240-302);
  `~/.jjodel-lanes/P-2026-11-19-1330/request.md`.
- Whole: `frontend/src/components/abstract/tabs/TabDataMaker.tsx`, `.../tabs/modelTabId.ts`,
  `.../tabs/splitPersistence.ts`, `frontend/src/components/editor-v2/sync/syncState.ts` 1-215.
- Windows: `frontend/src/components/abstract/DockManager.tsx` 1-400; `.../abstract/tabs/EditorSwitch.tsx` 14-305;
  `.../abstract/Dock.tsx` 270-427; `frontend/src/components/dock/MyRcDock.tsx` 560-745;
  `frontend/src/pages/components/Navbar.tsx` 1730-1769, 1836-1935; `frontend/src/pages/components/navbar.scss`
  2118-2130; `frontend/src/components/editor-v2/hooks/useJjomSync.ts` 1640-1669.
- By grep only (line hits): `splitTabs.ts` and `canvasSplit.ts` exports; every `dockbox.children[0]` reader in
  `frontend/src`; `.dock-bar` rules in SCSS; `useJjomSync.ts` registry clears.
- From git: `git diff alfonso-frontend-jjtl...HEAD -- frontend/src` (stat), and its `EditorV2.tsx` hunk in full;
  `git show alfonso-frontend-jjtl:` of `Toolbar.tsx` and `EditorV2.tsx` by grep.
- rc-dock (`frontend/node_modules/rc-dock`, a symlink to `/Users/alfonso/jjodel/frontend/node_modules`):
  `package.json` version; `lib/DockData.d.ts` 1-319; `lib/DockLayout.d.ts` by grep; `lib/Serializer.d.ts` 6-8;
  `lib/DockPanel.js` 73-93, 278-325; `lib/DockDropLayer.js` 95-135; `lib/DockDropEdge.js` 85-125;
  `lib/DockTabs.js` 76-175.
- Added by P-2026-11-19-1350 (line numbers of c23fcde84, same source as ec4ea037e): `docs/prompts/claude_2026-11-19_1330_prompt_multi-tab-editor-groups-discovery.md`;
  `~/.jjodel-lanes/P-2026-11-19-1330/handoff.md`; `~/.jjodel-lanes/P-2026-11-19-1350/request.md`;
  `docs/discovery/discovery_2026-11-18_multi_tab_split_n.md` 43-45; `frontend/src/components/editor-v2/Toolbar.tsx`
  360-519; `frontend/src/codegen/textual/ui/openTextualTab.tsx` 1-130; `frontend/src/codegen/textual/ui/TextualTab.tsx`
  350-409, 1035-1046, 1188-1207, 1286-1300, 1720-1749, 2028-2072; `frontend/src/components/abstract/tabs/EditorSwitch.tsx`
  280-303; `frontend/src/codegen/ui/canvasSelection.ts` 34-36, 45-48, 76-117. By grep only: `dataManagerOption.ts`
  (textual entry, 51-83), `EditorV2.tsx` palette slot (5543-5557) and `paneUnderRail` (623), `Navbar.tsx` textual badge
  (1805, 1967, 1981), `DockManager.tsx` `openViewpoint` (444), `LeftBar.tsx` viewpoints section (689), the
  `codegen/textual/` file list, `markCanvasUpdated(`/`markCanvasUpdatedBatch(` call sites.

## 2. The dock today (step 2)

### 2.1 rc-dock version and the layout tree

**[read]** `frontend/package.json:55` declares `"rc-dock": "^3.3.0"`; the installed one is **3.3.2**
(`node_modules/rc-dock/package.json`). The layout is built once per project open, `Dock.tsx:339-346`:

```
const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
layout.dockbox.children.push({tabs: [ModelsSummary], size: leftSize});
```

One horizontal dockbox, one panel of group `models` (`Dock.tsx:286`, `{floatable: true, maximizable: false}`), holding
the project summary tab (`closable: false`). Every model, metamodel, manager, script and documentation tab is docked into
`children[0]` with `'middle'` (`DockManager.tsx:185-186`, also `:417-419`, `:644-646`). Tab ids are unique across the
dock: the first tab of a model is the bare model id, a further one `<modelId>~tab<N>` (`modelTabId.ts:18-24`).

### 2.2 How a model tab is created and named

`TabDataMaker.model` (`TabDataMaker.tsx:44-52`): id `options?.tabId ?? model.id`, title
`<div className="tab-title ..." data-type="model">{model.name}<ConformanceIndicator .../></div>`, content `ModelStage`,
which on this branch is a `SplitStage` of `ModelTab` panes (`:18-21`). The title that the user sees is not this one: see
§2.3.

### 2.3 The tab strip is the app bar, one for the whole dock

**[read]** rc-dock's own per-panel strip is hidden for the models group, `navbar.scss:2118-2124`:

```
// Tabs are now rendered in the app bar
.not-strip .dock-panel.dock-style-models .dock-bar {
  display: none !important;
}
```

The app bar (`Navbar.tsx:1733-1916`) builds **one** list: the tabs of `dockbox.children[0]` (`:1738-1742`), then the
model tabs of every other panel, flattened with `beside: true` (`:1849-1868`), refreshed on `ACTIVE_TAB` and every 1 s
(`:1903-1909`). The `<model> · <viewpoint>` titles exist already, read from each tab pane's picker label (`:1870-1879`).
A click activates by `updateTab(tabId, null, true)` (`:1933-1935`). So G1 (a strip per group) is not built: H2 is
falsified. This is the largest UI decision of the lane (Q1).

### 2.4 What rc-dock gives natively for G1..G4, G7

| Need | rc-dock 3.3.2 | Jjodel must add |
|---|---|---|
| G1 a strip per group | each `PanelData` has its own tab bar (`DockTabs`) | un-hide it for model panels, or draw per-group strips in the app bar (Q1) |
| G2 split right | `dockMove(tab, panel, 'right')` inserts a sibling right of `panel` in a horizontal box and halves it; already used, `DockManager.tsx:301-302` | a `splitRight(tabId)` that makes a `~tabN` copy on the same viewpoint and targets the **active** group |
| G2 no other direction | no "allowed directions" option | a veto: override `dockMove` in `PinnableDock` (a `DockLayout` subclass, `MyRcDock.tsx:436`; the commented stub is at `:645`) to refuse `left`/`top`/`bottom`/`float`/`new-window`/`maximize` for `models` tabs except from `splitRight` |
| G4 drag between groups | tab-bar drop: `DockTabs.js:111-123`, `after-tab`/`before-tab` into any panel of the same group | nothing; set `tabLocked: true` and `floatable: false` on `models` |
| G4 no new group by drop | `tabLocked`: `DockPanel.js:311`, «`if (!dropFromGroup.tabLocked \|\| DragState.getData('tab', dockId) == null)`», hides the drop layer (edges, float, middle) while a **tab** is dragged | a **whole panel** drag (empty strip area, `DockPanel.js:73-93`) still shows the edge squares under `tabLocked`; the `dockMove` veto above covers it |
| G4 last tab closes group | rc-dock removes an empty panel unless `panelLock` (`DockData.d.ts:123-127`) | do not set `panelLock`; keep at least one group (the summary tab is not closable) |
| G7 save/load | `saveLayout()`, `loadLayout()`, `saveTab`/`loadTab`, `afterPanelSaved`/`afterPanelLoaded` (`DockLayout.d.ts:39-58, 159-164`) | the tab's viewpoint and the active group, validation of stale ids, a storage key (§5) |

**[read]** The comment at `Dock.tsx:287`, «tabLocked=true disables drag-and-drop reordering», does not match
`DockTabs.js:117-121`: tab-bar drops between tabs of the same group are accepted whatever `tabLocked` says; only the
drop layer is suppressed. To be confirmed at the app (Phase 2 acceptance), since a CSS rule could still hide the bar.

**[measured]** A legacy save/load of the whole layout exists (`MyRcDock.tsx:676-745`, `PinnableDock.save/load` into
`DUser.layout` or `LProject.layout`) and has no caller: `command grep -rnE 'PinnableDock\.(save|load|toggleAutosave|isAutosave)\(' src`
returns one hit, inside the class itself (`:716`); the control `PinnableDock\.instance` returns 15. It writes project
or user data, which G7 excludes, so it is not reused (left as is, Rule 9).

### 2.5 The dock-level split of L6b..L6d (the trunk)

**[read]** On the trunk there is no split icon (`git show alfonso-frontend-jjtl:.../Toolbar.tsx`, grep `split`: only the
classic mode enum and comments). A second group appears only through «Open beside ▸ <viewpoint>» on the Tree View model
row (R-MT-24, R-MT-25): `openModelTabBeside` (`DockManager.tsx:336-343`) calls `openBeside` (`:275-321`), which
`dockMove`s the tab `'right'` of `children[0]`'s active tab and then resizes by `ratio` with `changeLayout`. L6c and L6d
added on top: the active pane (`DockManager.canvasSplit`, read from the dock rows `.not-strip > .dock-layout > .dock-hbox
> .dock-panel.dock-style-models`, `:75-80`), one palette, the inactive pane's disabled toolbar and first-click-only
activation (`canvasSplit.ts` `paneEventVerdict`). That is already an editor-group model, two panels each with its own
tabs; what it lacks is G1's strips, the active group as the target of opening (G3), and the readers below.

### 2.6 "The active tab" means `children[0]`'s, in 29 places

**[measured]** `command grep -rnE 'dockbox\??\.children\??\.\[0\]|dockbox\.children\[(0|index)\]' src` (tests and
`//` lines excluded), exit 0, 30 hits, of which one is a doc comment (`EditorSwitch.tsx:44`): 29 code lines in 13 files.
`DockManager.tsx` 186, 339, 417, 419, 644, 646; `EditorSwitch.tsx` 51 (`isActiveDockTab`); `Dock.tsx` 196, 216, 361 (`handleLayoutChange`, the only `ACTIVE_TAB` and
`EDITOR_TYPE_CHANGE` source on a layout change); `MyRcDock.tsx` 275, 577 (`_detectActiveTabChange`);
`Navbar.tsx` 702, 1738, 1922, 1925, 2074; `TabsOverflowMenu.tsx` 69; `BottomToolbar.tsx` 26, 29; `Dashboard.tsx` 598;
`Console.tsx` 844, 1056; `navigationUtils.ts` 26, 63; `jjscript/executor/utils.ts` 101, 144;
`codegen/ui/openTemplateEditor.ts` 84; `codegen/ui/canvasSelection.ts` 129.

So with two groups a tab activated in the second one fires no `ACTIVE_TAB` (`Dock.tsx:361-363` returns when
`children[0]`'s `activeId` did not change), `isActiveDockTab` is false for it, and R-MT-16's restore and the Q7 focus
write skip it. H3 is falsified. The fix is one accessor, `activeGroup(layout)` (a new bench-safe module next to
`modelTabId.ts`), that every reader goes through, plus an active-group id held by `DockManager` and set on pointer-down
or focus in a group (the L6c `activateCanvasPane` path). Not every reader moves in the first lane: the ones that only
need "some open tab" (Console, JjScript, navigation) can follow.

## 3. Tabs and editors (step 3)

### 3.1 How an `EditorV2` binds to its tab

**[read]** `ModelTab` renders `EditorSwitch` with `modelid`, `tabId`, `initialViewpointId` (`TabDataMaker.tsx:20`).
`EditorSwitch` owns the tab's viewpoint as React state (`EditorSwitch.tsx:155-156`, R-MT-5), exposed to `EditorV2` as the
`viewpointId` prop (`:294-298`); the picker writes it through `onViewpointChange`. The layout key is the pair (model,
viewpoint) (R-MT-1, R-LAY), so two copies on the same viewpoint share the layout (R-MT-4), as G2 asks. Focus means
`isActiveDockTab(ownTabId)` (`:49-54`) and the `ACTIVE_TAB` listener (`:212-222`); in a split also the active pane
(`:142-147`, `SplitPaneContext`).

### 3.2 Active pane, palette, rail

**[read]** Today the active pane is `DockManager.canvasSplit` (`DockManager.tsx:44-88`): on this branch it first looks
for `.dock-tabpane-active .split-stage--two` (L6f, `:64-74`), else reads the dock rows (L6c, `:75-80`). `EditorV2`
reads it through `useCanvasSplit(paneEl)`; one palette, of the active pane, is portalled into the first pane's slot
(trunk `EditorV2.tsx:5524-5525`); the rail covers only the last pane (`paneUnderRail`, `:606`); an inactive pane's
toolbar is a disabled fieldset and its first press only activates (`paneIsInactive`, `paneEventVerdict`).

With groups, "active pane" becomes "the active group's active tab". The dock-row reading of L6c is that already: each
row is a group, `.dock-tabpane-active .editor-v2` its active tab's canvas. So H4 holds on the **trunk** version; the
L6f branch of `refreshCanvasSplit` goes. What must change: `refreshCanvasSplit` must also run on a tab switch inside a
non-first group (today it is driven from `children[0]` changes), and the active group must become the target of G3.
Palette: the slot of the first row stays the single Instances palette, which follows the active group (G6). A group
whose active tab is not a canvas (manager, script, documentation) makes the row list incomplete
(`shown.every(...)`, `:79`) and today disables the whole split; with groups it must count as a group without a canvas
(Q6).

### 3.3 What G8 removes and keeps

Branch over trunk, **[measured]** `git diff --stat alfonso-frontend-jjtl...HEAD -- frontend/src`: 14 files,
+1135 −36.

| File | Fate |
|---|---|
| `SplitStage.tsx` | removed; `TabDataMaker` returns `ModelTab` / `MetamodelTab` again (the trunk's shape) |
| `splitTabs.ts` + test | removed (pane list, weights, 280 px rule); `MIN_PANE_WIDTH` and `roomForPane` move to the group width rule (§6) |
| `splitPersistence.ts` + test | **kept in shape**: key `jjodel.<name>.<userId\|anon>.<projectId>`, versioned record, `SplitCheck` validation, never-throws write; the record becomes the groups layout (§5) |
| `canvasSplit.ts` + test | kept; drop the L6f-only additions except `nextPaneContent` (unused once G2 copies the viewpoint: `// TODO: cleanup`) |
| `EditorV2.tsx` | the split-icon wiring (`toggleSplit`, `splitOpen`, `SplitPaneContext`) becomes `onSplitRight → DockManager.splitRight(tabId)`; `isSplitControl` stays |
| `Toolbar.tsx` | the split icon stays, one action (Split Right); the close-pane cross goes (closing is the tab's ×) |
| `EditorSwitch.tsx` | `SplitPaneContext`, `isActivePane`, `recordTabPaneContent` go; the viewpoint is recorded per tab id for §5 |
| `EditorSwitch.scss`, `EditorV2.scss` | the `.split-stage` rules go; the `:not(:last-child)` rail rule is restated on dock rows (trunk L6b rules) |
| `DockManager.tsx` | the L6f branch of `refreshCanvasSplit` and the split persister go; `splitRight`, the active group, the layout persister come |

## 4. Sync and L4c (step 4)

### 4.1 By reading

**[read]** `syncState.ts` holds six module-level registries keyed by element id, not by model: `syncModes` (:14),
`dropCreatedIds` (:37), `edgeRefIds` (:59), `canvasUpdatedIds` (:81), `canvasEdgePairs` (:129),
`suppressedSingletonIds` (:159). Only the populate owner is per model (`populateInstances`, :194). On unmount,
`useJjomSync.ts:1655-1660`:

```
if (heldModel === undefined || releasePopulateOwner(heldModel, populateTokenRef.current)) {
    clearAllCanvasUpdated();
    clearSyncModes();
    clearDropCreated();
    clearEdgeRefIds();
    clearCanvasEdgePairs();
```

`releasePopulateOwner` is true when **that** model has no instance left (:203-211), and the five clears are global. So
the last tab of model A empties the entries of every other model on screen.

### 4.2 Measured on the dev server

**[measured]** Probe `~/.jjodel-lanes/P-2026-11-19-1330/probe-l4c.mjs` (read-only on the tree, throwaway Chromium
profile, dev server `http://localhost:3071` on ec4ea037e, output `probe-l4c.json` beside it). Fixture: the multi-tab demo
(`~/.jjodel-lanes/P-2026-11-08-1729/1730/jjodel-multitab-demo.jjodel`), imported by drop. Scene: model Apartment (A) and a
second tab on it in group 1; its metamodel SmartBuilding (MM) in a group right of it (`DockManager.openBeside`, the
trunk's dock-level split, returned `true`; 2 model panels in the dock row). Subject: of MM's rendered edges, how many
`getEdgeRefId` still maps (imported in the page from `/src/components/editor-v2/sync/syncState.ts`, the module the app
uses; the non-zero sentinel proves it is the same instance).

| Reading | MM edges | registered |
|---|---|---|
| r0, before any close (sentinel, must be > 0) | 8 | 5 |
| r1, after closing A's second tab (control: A keeps an instance) | 8 | 5 |
| r2, 400 ms after closing A's last tab (subject) | 8 | **0** |
| r3, +6 s, no gesture | 8 | **0** |

Page errors: 0. The control discriminates (r1 unchanged, r2 drops), and the entries do not come back by themselves.
**H5 holds**: the L4c hazard is real on the current code.

### 4.3 What it costs today, by reading

- `edgeRefIds`: its only live reader, `EditorV2.tsx:2590`, reads `edge.data.jjomRefId` first and the registry as the
  fallback; a label edit on an MM edge whose data lost `jjomRefId` would find no reference. Narrow.
- `canvasEdgePairs`: the race-window guard of Rule 13 (`editor-v2/CLAUDE.md` §3.4) for M1 and inheritance edges of the
  other model; a clear during its populate window can mint a duplicate `DVoidEdge`.
- `canvasUpdatedIds` (300 ms anti-bounce) and `dropCreatedIds`: transient, a clear in the window costs one re-render or
  one re-population of a just-dropped node.
- `syncModes`: **[measured]** `command grep -rn '\bsetSyncMode(' src` outside `syncState.ts` and tests: 0 calls (control:
  `markDropCreated(` 8 calls in `EditorV2.tsx`). Never written, so its clear is inert (`// TODO: cleanup` candidate,
  not touched).

With groups, two models on screen is the normal case, so the windows above are hit by ordinary use. L4c goes first.

### 4.4 Layer Impact Report, L4c (registries keyed by model), a lane of its own before groups (R-MT-26 (4))

```
LAYER IMPACT REPORT — L4c

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   — callers pass their model id
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)            — syncState.ts registries, the unmount clear
  [ ] Persistence (VersionFixer / jsxString)

Sync layer
  - What changes: each registry entry records the model that wrote it (a Map<modelId, ...> per registry, or a
    parallel id -> modelId map); the unmount clear becomes clear<X>(heldModel) for the released model only; the
    readers (isCanvasUpdated, hasCanvasEdgePair, getEdgeRefId, consumeDropCreated) keep their signatures and look
    across models, so no reader site changes.
  - What does NOT change: populate ownership (L4, R-MT-17), BOUNCE_WINDOW_MS, key formats (src→tgt pair key,
    refId:src→tgt composite, Rule 13), Step 4 deps (§3.5), any TRANSACTION.
  - Cross-layer interaction: the writers must know the model: markCanvasUpdated (9 calls, canvasToJjom.ts),
    markCanvasUpdatedBatch (5 line hits: canvasToJjom.ts 2, useJjomSelection.ts 3; corrected by P-2026-11-19-1350,
    `command grep -rnE '\bmarkCanvasUpdatedBatch\(' src`, tests and syncState.ts excluded), markCanvasEdgePair / clearCanvasEdgePair
    (canvasToJjom.ts, useJjomSync.ts, useM1ReferenceEdges.ts, m1EdgeSweep.ts), markDropCreated (EditorV2.tsx 8),
    setEdgeRefId (jjomTransformers.ts:684). An optional trailing modelId parameter keeps every existing call legal;
    a call without it files under a shared bucket cleared as today (fallback, no behaviour change for it).
  - Side-effect safety: an entry filed under the wrong model survives one release longer than today (a stale
    anti-bounce entry expires by its own 300 ms rule; a stale pair blocks a re-mint of the same pair, which
    clearCanvasEdgePair already reconciles in useM1ReferenceEdges).

Smoke-test scenarios potentially affected:
  - the probe above inverted: r2 and r3 keep 5 registered on MM after A's last tab closes
  - import Families.ecore → 8 edges Family↔Member, then open / close an M1 tab: still 8 (Rule 13 siblings)
  - drop a class / an object on a canvas while another model's tab closes: one node, no duplicate DVoidEdge
  - drag a node on B while A's last tab closes: the position is kept (anti-bounce)
  - save → reopen → identical state

Uncertain about propagation: none found by reading; the lane's own discovery re-reads every writer call site.
```

Files of the L4c lane (critical zone marked ★): `syncState.ts` ★, `useJjomSync.ts` ★, `canvasToJjom.ts` ★,
`useM1ReferenceEdges.ts` ★, `m1EdgeSweep.ts`, `jjomTransformers.ts`, `useJjomSelection.ts`, `EditorV2.tsx`, a test of
`syncState.ts`, the probe. Over five: Rule 19 applies in that lane.

## 5. Persistence (step 5)

### 5.1 What rc-dock stores and what is added

**[read]** `DockLayout.saveLayout(): LayoutBase` and `loadLayout(savedLayout: LayoutBase)` (`DockLayout.d.ts:39-58`)
walk the tree and keep, per panel, its tab ids in order, `activeId` and `size`. The tab's content is not kept. The
hooks `saveTab(tab) => TabBase` and `loadTab(saved) => TabData` (`DockLayout.d.ts:159-164`) carry each tab's own
record, and `afterPanelSaved` / `afterPanelLoaded` carry each panel's. Native: the groups, their order, the tabs of
each group in order, the active tab of each group, the group widths. Added by Jjodel:

| Item | Where | Note |
|---|---|---|
| model id and viewpoint id per tab | `saveTab` returns `{ id, modelId, viewpointId }`; `loadTab` rebuilds the `TabData` through `TabDataMaker` (model, metamodel, manager) with `initialViewpointId` | `viewpointId` may be `'@textual'` once G9 lands (§8.3); the record treats it as an opaque value |
| the viewpoint a tab shows now | a module map `tabId → viewpointId`, written by `EditorSwitch` when its state changes | replaces `recordTabPaneContent` of this branch (G8) |
| the active group | `activeGroup: <panel index>` next to the layout | not in rc-dock's layout |
| non-model tabs (doc_, jjtl_, jjs_, txt_new_, generator tabs) | not persisted in v1, dropped by `saveTab` | they are rebuilt from their own stores; to be extended per kind if Alfonso wants them |

### 5.2 Storage key and record

The shape of `splitPersistence.ts`, which is reused as a pattern and not as a file: key
`jjodel.editorGroups.<userId|anon>.<projectId>`, value `{ v: 1, layout, activeGroup }`, a write that never throws
(quota, private mode), and a `SplitCheck`-style validation that refuses the whole record on any structural defect.
The record is a user preference in `localStorage`, never in the project file or in `DUser`/`LProject` (G7). The legacy
`PinnableDock.save/load` (§2.4) writes there and stays unused.

### 5.3 Restore and stale ids

The restore runs once, at project open, after `idlookup` holds the project's models. Today `Dock.tsx:339` builds the
default layout there, with only the summary. Before `loadLayout` the record is pruned:

- a tab whose model is gone is dropped;
- a panel left with no tab is dropped, and `activeGroup` is clamped to the panels left;
- an unknown viewpoint id becomes the abstract syntax (R-MT-7). `'@textual'` also becomes the abstract syntax when the
  textual entry is unavailable (codegen off or not in Advanced mode, R-GEN-2);
- the summary tab is put back in group 1 if the record lacks it (Q4);
- a record that fails validation is ignored as a whole, and the project opens as today.

### 5.4 Tab ids across sessions, and the relation with `editorPrefs`

`~tabN` ids are persisted as they are. They are stable inside the record, and `nextModelTabId` (`modelTabId.ts`)
already avoids a collision with ids present in the dock. `jjodel.editorPrefs.<modelid>` keeps its role: the default
viewpoint of a **newly** opened tab of that model. A restored tab carries its own viewpoint through
`initialViewpointId`, which already skips the editorPrefs restore (`EditorSwitch.tsx:154`). The ticket «editorPrefs
keyed by model only» (`docs/log-inbox/multi-tab.md:399`) is unaffected: the groups record is keyed by project.

## 6. Width (step 6)

**[read, from the 2026-11-18 report §0 item 10, not re-measured]** In split mode the pane row is about 1185 px at
1600 and about 910 px at 1280. The rail column is already outside that row. The toolbar's content is 479 to 502 px
wide (P-2026-11-19-0155).

Split Right halves the active group (Q2). Counts, starting from one group:

| Minimum group width | 1600 (row 1185) | 1280 (row 910) |
|---|---|---|
| 480 px (the handoff's figure) | 1185 → 592 + 592; a third split needs ≥ 960: **2 groups** | 910 → 455 < 480: **no split** |
| **400 px (recommended)** | 1185 → 592 + 592; 592 → 296 refused: **2 groups** | 910 → 455 + 455; 455 → 227 refused: **2 groups** |
| 360 px | 2 groups (296 < 360) | 2 groups (227 < 360) |

The 480 px minimum alone makes the feature absent on a 1280 screen, so it is not proposed. The recommended rule has
two parts:

1. **Minimum group width 400 px.** Split Right is disabled, with a title that says why, when the active group's width
   / 2 < 400. The same 400 px is set as the models panels' `minWidth`, so a sash drag cannot squeeze a group below it
   either. The `PanelData`/`BoxData` `minWidth` field is to be confirmed in `DockData.d.ts` in Phase 2: this lane did
   not read it. A group can still be widened by dragging the sash and then split (≥ 800 px).
2. **Narrow toolbar under 502 px.** A container query on the toolbar's own width (no viewport media query: groups
   differ). Below 502 px the viewpoint picker stays first and visible, and the commands after it go into one overflow
   menu `…`. The Split Right icon stays visible as long as it is enabled. At 1280 both groups (455 px) use it. At 1600
   (592 px) neither does. The Text editor's header (G9) gets the same rule, since it also carries the picker.

## 7. Base for Phase 2 (step 7)

**[measured]** `git log -1 alfonso-frontend-jjtl`: `2f9277a66` (2026-11-19 13:20). Merge base with this branch:
`99d00399c`. The trunk is 1 commit past it, `frontend/src/components/editors/PropertiesWithTreeView.tsx` only (+4 −1).

| Choice | What it starts from | Files touched before any group work |
|---|---|---|
| this branch (`multi-tab-groups`) | trunk + L6f in-tab split + N-pane (P-2026-11-19-0110/0155) | the 14 files of §3.3 (+1135 −36) to remove or revert, in their own commit, with the risk of keeping L6f residue in `refreshCanvasSplit`, `EditorV2`, `EditorSwitch` |
| **a fresh branch from the trunk (recommended)** | the dock-level split of L6b..L6d: dock rows, active pane, one palette, inactive-pane guard, which is the group model of §3.2 | none. Two things are taken from this branch by hand, not by merge: the shape of `splitPersistence.ts` (§5.2) and the Toolbar split icon of `1d24711c0`/`d2bd7a930`, if Alfonso wants that glyph |

Consequence: `multi-tab-split-n`, `multi-tab-l6f` and `multi-tab-groups` stay unmerged, and Phase 2 records R-MT-29,
which supersedes L6e, R-MT-27's automatic different viewpoint and R-MT-28 (provisional). This report goes to the
trunk with the Phase 2 branch (docs commits cherry-picked, P14).

## 8. Phase 2 file list and lane order (step 8)

### 8.1 Lane order

| # | Lane | Why here |
|---|---|---|
| 1 | **L4c**, registries keyed by model (LIR §4.4, R-MT-26 go-ahead) | measured hazard (§4.2), which groups turn into ordinary use |
| 2a | **groups core**: `dockGroups.ts` (active group accessor), `DockManager.splitRight`, the `dockMove` veto, `tabLocked`/`floatable: false` on `models`, G3 opening into the active group, `refreshCanvasSplit` on a tab change in any group, the readers that drive focus (`Dock.tsx`, `MyRcDock.tsx`, `EditorSwitch.tsx`, `DockManager.tsx`) | everything after reads the active group |
| 2b | **group strips** (per Q1) and the app bar readers (`Navbar.tsx`, `TabsOverflowMenu.tsx`, `BottomToolbar.tsx`, `Dashboard.tsx`) | G1, G5 titles; needs 2a's accessor |
| 3 | **persistence G7** (`groupPersistence.ts`) | needs the final group model; stores `viewpointId` as an opaque value, so G9 needs no change of the record |
| 4 | **G9**, text as an entry of the tab's picker (§8.3) | needs Split Right (2a) for text beside the diagram, and touches `EditorSwitch.tsx`/`Toolbar.tsx`/`EditorV2.tsx` after 2a and 2b release them |
| 5 | **width rule** (§6) | the narrow toolbar applies to the canvas toolbar and to G9's header, so it comes after G9 |
| 6 | **the remaining `children[0]` readers**: `Console.tsx`, `navigationUtils.ts`, `jjscript/executor/utils.ts`, `codegen/ui/openTemplateEditor.ts`, `codegen/ui/canvasSelection.ts` | they only need "some open tab" and work, approximately, until moved |
| later | **G10**, a later front (§8.4) | same files as G9 |

### 8.2 Files per lane (Rule 19)

No file of the groups lanes is in the CLAUDE.md §3.1 critical zone; the critical-zone files (★) are all in L4c (§4.4).
Every lane is above five files except 3 and 6 (five each), so Rule 19 applies to the others: list confirmed before editing.

| Lane | Files | Count |
|---|---|---|
| 1 L4c | `syncState.ts` ★, `useJjomSync.ts` ★, `canvasToJjom.ts` ★, `useM1ReferenceEdges.ts` ★, `m1EdgeSweep.ts`, `jjomTransformers.ts`, `useJjomSelection.ts`, `EditorV2.tsx`, `syncState` test, the probe | 10 |
| 2a groups core | `DockManager.tsx`, `Dock.tsx`, `MyRcDock.tsx`, `EditorSwitch.tsx`, `EditorV2.tsx` (split icon → `splitRight`), `Toolbar.tsx`, new `tabs/dockGroups.ts` + test, `docs/decisions.md` (R-MT-29) | 9 |
| 2b strips | `Navbar.tsx`, `navbar.scss`, `TabsOverflowMenu.tsx`, `BottomToolbar.tsx`, `Dashboard.tsx`, `DockManagerStyles.scss` (if Q1 = per-panel strip) | 6 |
| 3 persistence | new `tabs/groupPersistence.ts` + test, `Dock.tsx` (restore at open), `DockManager.tsx` (`saveTab`/`loadTab`, the persister), `EditorSwitch.tsx` (viewpoint per tab map) | 5 |
| 4 G9 | `EditorSwitch.tsx`, `Toolbar.tsx`, `dataManagerOption.ts`, `codegen/textual/ui/TextualTab.tsx`, `codegen/textual/ui/openTextualTab.tsx`, `codegen/ui/canvasSelection.ts`, `EditorV2.tsx` (palette collapse), `Navbar.tsx` (badge of a model tab on text), a test of the picker's textual branch (`textualPicker.test.ts` exists) | 9 |
| 5 width | `Toolbar.tsx`, its SCSS, `TextualTab.scss`, `DockManager.tsx` (Split Right enablement, `minWidth`), `dockGroups.ts` (`roomForGroup` + test) | 6 |
| 6 readers | `Console.tsx`, `navigationUtils.ts`, `jjscript/executor/utils.ts`, `codegen/ui/openTemplateEditor.ts`, `codegen/ui/canvasSelection.ts` | 5 |

Paths are under `frontend/src/`: `components/abstract/` (DockManager, Dock, tabs/), `components/dock/MyRcDock.tsx`,
`components/editor-v2/` (EditorV2, Toolbar, dataManagerOption, sync/, hooks/), `pages/components/` (Navbar, navbar.scss),
`codegen/`. Phase 2 re-greps each before touching it (Rule 15).

### 8.3 G9 — the textual syntax as an entry of the tab's viewpoint selector

**Today [read].** The picker carries a synthetic textual entry `'@textual'` (`dataManagerOption.ts:59`), shown only with
codegen on and in Advanced mode (`Toolbar.tsx:365-368`, R-GEN-2). Picking it does not change the tab: it opens a
separate dock tab `txt_<modelId>` through `openTextualTab` (`Toolbar.tsx:409-415`, a dynamic import, the lazy-bundle
rule of R-GEN-2). That tab docks in a split right of the canvas's panel when the canvas is shown (E9, R-TXT-54:
`dockBeside`, `openTextualTab.tsx:112-115`), and otherwise opens in the first panel. One Text tab per model: a second
pick activates it. The picker then snaps back to the canvas's viewpoint (`Toolbar.tsx:391-395`).

**With G9.** The textual entry becomes a value of the tab's own viewpoint, as a real viewpoint is:

- Picking it sets `EditorSwitch`'s tab viewpoint to `'@textual'`. It never reaches the root `state.viewpoint`: the
  sentinel rule of the Data manager is kept, `activateViewpoint` is skipped, and the root keeps the tab's last diagram
  viewpoint. `saveViewpointPreference` is skipped too, so a new tab of the model still opens on a diagram (Q11).
  `EditorSwitch` renders the Text editor in place of `EditorV2` for that value, and back when a diagram viewpoint is
  picked. `TextualTab` lives in `src/codegen/`, so `EditorSwitch` (eager) reaches it by `React.lazy`/dynamic import, never
  by a static import, or `scripts/gates/check-codegen-lazy.ts` fails.
- The Text editor's header carries the same picker (the Toolbar's listbox, extracted or reused), so the tab can go back
  to a diagram. Text and diagram side by side = Split Right (G2) on a text tab or on a diagram tab, then pick the other
  entry in the new group. This replaces E9's automatic `dockBeside` and the L6h textual pane. The separate `txt_<modelId>`
  tab is retired for existing models. `txt_new_<metamodelId>` («New model from text», `openTextualTab.tsx:136`) stays
  as it is, since it is a tab with no model yet (Q10).
- Tab title and app bar: the model tab keeps its id (bare or `~tabN`) and shows `<model> · <language label>` with the
  textual badge (`Navbar.tsx:1967`, today keyed by `data-type="textual"`; with G9 by the tab's viewpoint).
- Two text tabs on one model become possible, in two groups, each with its own pending edit. The current rule covers
  it: the second tab sees the first one's application as a model change and is kept stale (below).

**Palette.** No `EditorV2` is mounted in a text tab, so there is nothing to drop into. When the active group's active
tab is a text tab, the single Instances palette is shown collapsed: its header stays, it does not disappear, and it
expands again when a canvas group becomes active. `DockManager.canvasSplit` counts a text group as a group without
canvas (Q6).

**Rail.** The rail follows `_lastSelected`. The caret of the Text editor already selects the object of the innermost
span at the caret, through origins (R-TXT-18, R-TXT-22), with a short pause (`selectOnCanvas`, `TextualTab.tsx:1729-1742`).
**[read] Two hazards:** (1) the `_lastSelected` write happens only when a canvas of the model is on screen and draws
the element (the early returns of `:1734` and `:1738`), so on a text tab alone the rail does not follow; (2) the canvas
is found by `modelPane(modelId)` (`canvasSelection.ts:34-36`), the tabpanel whose id **ends with the bare model id**,
so a `~tabN` canvas is never found, and with G9 the bare-id tab may be the text tab itself. Fix in the G9 lane: write
`_lastSelected` from the span's origin whenever it resolves, independent of any canvas; send `SELECT_NODE` to every
visible canvas pane of the model (every tab id of the model whose pane holds `.react-flow`, through `dockGroups.ts`),
none when there is none. The reverse direction (canvas selection highlighted on the spans, E2b) is unchanged.

**Sync rule, a diagram change while the text holds an edit that does not parse [read].** Today: `onModelPrint`
(`TextualTab.tsx:357-360`) reprints when the editor holds the agreed text, otherwise keeps it and sets `stale`. A stale
text is never applied (`editDecision`, `:405`), and the header says «The model changed: your text is kept, not
applied» with a **Reprint** button (`:2064-2072`). With text and diagram side by side this case is no longer rare.
Three options:

| Option | Effect | Verdict |
|---|---|---|
| **A. keep the current rule (recommended)** | the typed text is never lost; the diagram's change is never undone unasked; the user picks Reprint or keeps editing and reprints later | matches R-TXT-26 (apply only a text that parses, never unasked) and R-TXT-20 |
| B. reprint the spans of the changed objects into the broken text | impossible on a text that does not parse: R-TXT-20's span rewrite (`reprintChanged`) needs the concrete syntax tree of a parse | rejected |
| C. reprint, discarding the edit | loses typing; the editor's own undo would have to restore it | rejected |

A addition, recommended: once the stale text parses again, the banner offers **Apply anyway** next to Reprint. It
applies the plan as one undo step on the current model, still under every R-TXT-26 condition (no uncertain match, no
referenced deletion), so a long edit is not lost to a single diagram change. Q9.

### 8.4 G10 — the syntax definition as a viewpoint of the metamodel (later front)

Only the placement moves. The syntax annotations stay on the metamodel elements, in the metamodel's `_state` under
`TEXTUAL_SYNTAX_KEY` (`dataManagerOption.ts:83`, R-TXT-16 (3), R-TXT-41, R-TXT-21 (2)), and `writeTextualSyntax`
(`openTextualTab.tsx:63-69`) stays the only write. Files it would touch:

- `codegen/textual/ui/TextualTab.tsx`: the EBNF mode (editable literals, R-TXT-48/49) and the Syntax mode (R-TXT-40
  D6), and the style picker, move out; the model's text tab keeps only Text;
- `codegen/textual/ui/SyntaxForm.tsx`, `useSyntaxDraft.ts`: hosted by the new metamodel view instead of the Text tab;
- `codegen/textual/ui/openTextualTab.tsx`: a sibling opener for the metamodel's syntax view;
- `components/editor-v2/dataManagerOption.ts`, `Toolbar.tsx`: a synthetic «Textual syntax» entry on **metamodel** tabs
  (today `isMetamodel` shows only «Abstract syntax», `Toolbar.tsx:461-462`);
- `pages/components/LeftBar.tsx` (viewpoints section, `:689`) and `components/abstract/DockManager.tsx` `openViewpoint`
  (`:444`) or `TabDataMaker.tsx`: the entry in the viewpoint list and its authoring area;
- `components/abstract/tabs/EditorSwitch.tsx`: if the syntax view is a picker value of the metamodel tab, as G9's text is.

Why after the groups lane: G9 and G10 both edit `TextualTab.tsx`, `openTextualTab.tsx`, `Toolbar.tsx`,
`dataManagerOption.ts` and `EditorSwitch.tsx`, the files 2a, 4 and 5 hold. G10 also needs G9's split: the model's
text tab goes back to Text only once the EBNF and Syntax modes have a home.

Consequence of the annotations being on the metamodel: **one textual syntax per metamodel**. Every model of a
metamodel prints in the same notation, and the viewpoint list of a metamodel shows at most one «Textual syntax»
entry. Several notations for one metamodel would need the record to become a list keyed by syntax name, which is a
data move and is out of what Alfonso asked (13:49). Q13.

## 9. Risks and dependencies

1. **L4c hazard (measured, §4.2).** If groups land before L4c, two models on screen is normal, and closing one clears
   the other's registries: lost `jjomRefId` fallbacks and a possible duplicate `DVoidEdge` (Rule 13). Dependency: L4c first.
2. **29 `children[0]` readers (§2.6).** A reader left on `children[0]` acts on group 1 while the user works in group 2.
   Lane 6 is the remainder. Until it lands, Console, JjScript, navigation and codegen may target the wrong tab.
3. **The `dockMove` veto vs internal callers.** `openBeside` (`DockManager.tsx:275-321`), `dockBeside` (generator tabs,
   `canvasSelection.ts:76`) and E9's Text placement all `dockMove(..., 'right')`. The veto must allow internal right
   moves and refuse only user drops. Generator tabs then still create groups on their own (Q12).
4. **`tabLocked` semantics.** The comment at `Dock.tsx:287` contradicts `DockTabs.js:117-121` (§2.4). Phase 2's
   acceptance confirms in the app that a tab drags within and between groups, and that a whole-panel drag shows no edge.
5. **rc-dock internals.** The veto and `tabLocked` rely on 3.3.2 behaviour read from `lib/*.js`. `^3.3.0` in
   `package.json` allows a minor upgrade that could change it. Pinning is a dependency change and needs approval (Rule 4).
   A test of the veto catches a change.
6. **Restore timing (§5.3).** Restoring before `idlookup` holds the models drops every tab as stale. The restore needs
   a "models loaded" signal, not a timer.
7. **Width at 1280 (§6).** Groups of 455 px are below the toolbar's 479-502 px. Without lane 5 the toolbar overflows
   between lanes 2a and 5, a known transient state to declare in lane 2a's closing report.
8. **G9 lazy bundle.** A static import of `TextualTab` from `EditorSwitch` pulls `src/codegen` into the eager bundle and
   fails `check-codegen-lazy.ts` (R-GEN-2).
9. **G9 selection hazards (§8.3).** `modelPane` finds only the bare-id tab. If unfixed, the caret selection silently does
   nothing in a split of the same model, and the rail does not follow on a text tab.
10. **G9 undo keys.** Each Text editor sets the context key that sends Cmd/Ctrl+Z to the app's undo when it holds no
    pending edit (`TextualTab.tsx:1102-1105`). With two text tabs, the focused one decides, as Monaco does per editor.
    To be checked at acceptance.
11. **Branch.** The L6f/N-pane branches are abandoned. Anything Alfonso still wants from R-MT-28 must be named before
    lane 2a (§7).

## 10. Open questions for Alfonso

1. **Q1. Where the group strips live.** (a) rc-dock's own per-panel tab bar, un-hidden on model panels, with the app
   bar's tab list retired; (b) the app bar split into one segment per group. **Recommended: (a)**, exactly VS Code.
   It is native, drag between strips is rc-dock's, and the app bar keeps the project-level items.
2. **Q2. Widths after Split Right.** Halve the active group (VS Code) or equalise all groups (R-MT-28).
   **Recommended: halve**, as VS Code. The §6 counts assume it.
3. **Q3. G3 for non-model tabs** (doc_, jjtl_, jjs_, manager, other unique ids). Focus the tab where it is open, or move
   it to the active group. **Recommended: focus where open**, as VS Code does for a file already open in another group
   when "reveal if open" is on. Model tabs follow G3 strictly.
4. **Q4. The project summary tab.** **Recommended: it stays in group 1, not closable and not draggable**, so there is
   always one group.
5. **Q5. Base.** **Recommended: a fresh branch from the trunk** `alfonso-frontend-jjtl` (§7).
6. **Q6. A group whose active tab is not a canvas** (manager, script, documentation, text). **Recommended: it counts as
   a group without canvas.** The palette follows the last active canvas group and shows collapsed while a non-canvas
   group is active (§8.3).
7. **Q7. L4c before groups.** **Recommended: yes**, measured hazard (§4.2, §9.1).
8. **Q8. The Tree View «Open beside ▸ <viewpoint>» items** (R-MT-24/25). **Recommended: keep them, mapped to Split
   Right of the model's tab with the chosen viewpoint.** One code path, and the menu stays a shortcut.
9. **Q9. G9, a diagram change while the text holds an edit that does not parse.** **Recommended: option A** of §8.3,
   keep and do not apply, with Reprint, plus **Apply anyway** once the stale text parses again.
10. **Q10. The separate Text tab.** Retire `txt_<modelId>` and E9's automatic beside placement in favour of G9, keeping
    only `txt_new_<metamodelId>` for «New model from text». **Recommended: yes.** When «Create model» succeeds, that
    tab is replaced by the new model's tab on the textual entry.
11. **Q11. Is the textual entry saved as the model's default viewpoint** (`jjodel.editorPrefs.<modelid>`)?
    **Recommended: no.** A new tab opens on a diagram, and a restored tab (§5) keeps its own `'@textual'`.
12. **Q12. Generator tabs and other codegen tabs that open beside a canvas** (`dockBeside`). Keep creating a group on
    their own, or open in the active group like any artifact (G3). **Recommended: open in the active group (G3).**
    Split Right is the only way to make a group, which is what Alfonso asked (13:26). This is decided in lane 2a, and
    touches `canvasSelection.ts` there or in lane 6.
13. **Q13. G10's consequence: one textual syntax per metamodel.** **Recommended: accept it for G10.** Several notations
    per metamodel would move data (a list of records), which Alfonso excluded at 13:49. It can be a later decision.
14. **Q14. Minimum group width.** **Recommended: 400 px with the narrow-toolbar rule** (§6), not 480 px, which forbids
    Split Right at 1280.

## 11. L4c as implemented

Added by P-2026-11-19-1530 (branch `multi-tab-l4c`, code commit `2837e117d`), decision R-MT-29. The design of §4.4 is
followed as written; this section records the writers re-read before editing and the numbers of the probe.

### 11.1 Shape

**[read]** Each registry of `syncState.ts` stores, per key, the bucket of the model that wrote it (`syncModes`,
`edgeRefIds`, `canvasUpdatedIds` as `{ value, bucket }`; `dropCreatedIds`, `canvasEdgePairs` as `Map<key, bucket>`). A
writer called without a `modelId` files under a shared bucket (a module-private symbol). `clear<X>(modelId)` deletes the
entries of `modelId` and of the shared bucket; `clear<X>()` clears everything, as before. Readers and single-key clears
(`clearCanvasEdgePair`, `clearCanvasUpdated`, `consumeDropCreated`) do not look at buckets. A key written by two models
belongs to the last writer. `suppressedSingletonIds` and the populate owner are untouched (neither was cleared on unmount).

The unmount clear in `useJjomSync.ts` passes `heldModel`. When `heldModel` is `undefined` (an instance that never held a
model) the call is `clear<X>(undefined)`, which clears every model, exactly as before L4c. Not changed here: that path
holds no keyed entry of its own, and narrowing it is a behaviour change outside the design.

### 11.2 Writer call sites, re-read

**[read]** `command grep -rnE` over `src` for every writer, tests and `syncState.ts` excluded, at `c4c17628e`:

| Writer | Site | Model id passed |
|---|---|---|
| `markCanvasUpdated` | `canvasToJjom.ts` `syncPositionToJjom`, `syncSizeToJjom`, `syncSizeResetToJjom`, `syncInheritanceEdge`, `syncReferenceEdge`, `syncCreateCompositionLink`, `syncCreateReferenceLink` (8 lines) | new trailing `modelId` of the function |
| `markCanvasUpdated` | `canvasToJjom.ts` `createCompositionEdgeForObjects` (1 line) | none: its callers are `ContextMenu.tsx` and `createAdapter.ts`, outside the file list; shared bucket |
| `markCanvasUpdatedBatch` | `canvasToJjom.ts` `syncPositionBatchToJjom`, `syncSizeBatchToJjom` (2) | new trailing `modelId` |
| `markCanvasUpdatedBatch` | `useJjomSelection.ts` `selectElement`, `deselectAll` (2; the third line hit of §4.4 is the header comment, :12) | their `modelid` parameter |
| `markCanvasEdgePair` | `useJjomSync.ts` Step 4 (3), `useM1ReferenceEdges.ts` (1) | `modelid` (in the deps of both effects) |
| `markCanvasEdgePair` | `canvasToJjom.ts` `syncInheritanceEdge`, `syncReferenceEdge` (2) | new trailing `modelId` |
| `clearCanvasEdgePair` | `useJjomSync.ts` (1), `useM1ReferenceEdges.ts` (1), `m1EdgeSweep.ts` (1), `canvasToJjom.ts` (3) | none needed: a single-key clear removes the pair whatever model wrote it; `m1EdgeSweep.ts` unchanged |
| `markDropCreated` | `EditorV2.tsx` (8) | `modelidRef.current` |
| `setEdgeRefId` | `jjomTransformers.ts:684`, inside `jjomEdgeToRFEdge` | new trailing `modelId` of `jjomEdgeToRFEdge`, given by `useJjomSync.ts` (3 calls) as `heldModelRef.current`; `transformJjomGraph` (only caller `useJjomData-toDelete.ts`) left on the shared bucket |
| `setSyncMode` | none outside tests (§4.3) | the parameter exists, no caller |

`EditorV2.tsx` passes `modelidRef.current` (the ref of :4229, read at call time) to its 16 calls of the `canvasToJjom.ts`
writers, so no callback deps changed; the calls that relied on a default `layoutKey` pass `undefined` for it. Callers
outside the file list (`ContextMenu.tsx`, `createAdapter.ts`) are unchanged and still legal.

### 11.3 Gates

Typecheck 0 errors. Vitest: 628 files passed, 3 failed at import (the known `window is not defined` three, §17); the new
`sync/__tests__/syncStateByModel.test.ts` has 8 cases. Build ok (the chunk-size and dynamic-import warnings only).
`npm run check:docs` ok.

### 11.4 Probe

**[measured]** `~/.jjodel-lanes/P-2026-11-19-1530/probe-l4c.mjs` (base: the probe of §4.2, original untouched), dev
server `http://localhost:3074` on `2837e117d`'s tree, throwaway Chromium profile, output `probe-l4c.json` beside it.
Fixture: the multi-tab demo of §4.2, plus `frontend/scripts/library/gallery/families-persons/Families.ecore` imported by
`EcoreService.importFromXML` into the same project. Two groups are made as the parent discovery did, with
`DockManager.openBeside`, the trunk's dock-level split (L6c/L6d): returned `true` both times, 2 model panels in the row.
Page errors: 0.

| Scenario | Reading | Result |
|---|---|---|
| S1, the inverted measurement (MM edges / registered) | r0 before 8/5; r1 after A's second tab closes 8/5; r2 400 ms after A's last tab closes 8/**5**; r3 +6 s 8/**5** | pass (§4.2 on `ec4ea037e`: 8/5, 8/5, 8/0, 8/0) |
| S2, Families Family↔Member D-edges, with an M1 tab (A) opened beside it and closed | 8, 8, 8, 8 (rendered 8, duplicate keys 0, at each reading) | pass |
| S3, drag a Families node, A's last tab closes right after the drag end | before (50, 290); at pointer-up (128, 352); +0.4 s (128, 352); +3.4 s (128, 352); A closed | pass |
| S4, drop a class on Families while A's last tab closes | classes 2→3, nodes 2→3, D-edges 8→8, duplicate keys 0, Family↔Member 8 | pass |
| S5, save, reload | MM 7 classes / 8 vertices / 8 edges, Families 3 / 3 / 8, A 19 vertices / 29 edges: identical fingerprints (class names, vertex ids with their `x`/`y` fields, edge keys) | pass |

S3 was run three times. The first run asserted a displacement of exactly 90/60 px, but the node settled at +78/+62 and
stayed there (snap, drag threshold), so the check was rewritten to compare against the position at pointer-up. The
second run used a bubble `mouseup` listener to close A, but that listener never fired, so A was not closed. The third
run closes A from a capture-phase `pointerup` listener through `setTimeout(0)`, which is queued before the drag-end
handler queues the store dispatch (action.ts), so the release of A runs between the canvas mark and the delivery of the
position write. That ordering comes from reading the code. The probe did not instrument it.

Not measured: a trunk control run of S2 to S5 (only S1 has a before figure, §4.2), and S4 for an object dropped on an
M1 canvas.
