# Discovery — simulation panel, one face per active editor (P-2026-09-24-1005, Phase 1)

- Prompt-ID: `P-2026-09-24-1005`, prompt `docs/prompts/claude_2026-09-24_1005_prompt_sim_panel_faces.md`
- Session: `5e58f4e5-67f4-4c40-9ad4-86898cf92fe9`
- Tree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `ff2c624a1` (clean at start)
- Executor: Anthropic Claude Opus 5.5 (banner). `.claude/settings.json` still pins Opus 5.
- Read-only phase. No repo file was changed; this report is the only file written in the tree.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files.
Tags: **[M]** measured in this phase on `ff2c624a1`, **[R]** read from a file.

## 1. Objective and hypotheses

The rule: the Simulation panel shows the role selects in a **metamodel** editor and the run controls in
a **model** editor, or a message naming the missing roles when the metamodel's configuration is
incomplete. The phase tests the chat's reading of why the rule breaks, and prepares the fix.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | With a metamodel tab and a model tab open, two `.sim-panel` elements sit in `<body>` at the same fixed position, and the one later in DOM order paints on top whatever tab is active. | **Holds [M].** Count 2, same rect `[216,920,107,32]`, the later one on top in every tab, the project summary included; which panel wins depends only on which editor mounted last (§3). |
| H2 | rc-dock keeps inactive tabs mounted and hides them with CSS on the tab pane; a portal escapes it. | **Holds [M][R].** Inactive pane: inline `visibility: hidden; height: 0px; overflow-y: hidden;`, the editor stays mounted; the portaled panel is a child of `<body>`, outside the pane (§4). |
| H3 | The incomplete-configuration hint is a fixed string that does not say which roles are missing. | **Holds [R].** `SimulationPanel.tsx:471`. |
| H4 | `PolymetricView` and the context menu, portaled the same way, are safe because they are gated by `isOpen`/`contextMenu`. | **Falsified for both [M].** The gate is per editor, but the trigger is a window event every mounted editor listens to: one `OPEN_POLYMETRIC` opens two modals, one right-click on a metamodel attribute row opens two context menus (§6). Recorded only; not in this lane's scope. |

## 2. Files read (full paths)

Under `/Users/alfonso/jjodel-sim/frontend/src/`:
`components/editor-v2/sim/SimulationPanel.tsx` (whole), `components/editor-v2/sim/simulation-panel.scss` (whole),
`components/editor-v2/sim/simRunState.ts` (whole), `components/editor-v2/EditorV2.tsx` (367, 480-510, 620-640,
1015-1032, 2745-2772 filtered, 2832-2856, 4255-4428), `components/editor-v2/ActiveEditorContext.tsx` (1-80),
`components/editor-v2/CLAUDE.md` (1-80), `components/editor-v2/ContextMenu.tsx` (25-40),
`components/editor-v2/nodes/ClassNode.tsx` (685-700, 745-765, 820-840),
`components/abstract/tabs/EditorSwitch.tsx` (whole), `components/abstract/tabs/EditorSwitch.scss` (1-7),
`components/abstract/tabs/MetamodelTab.tsx` (whole), `components/abstract/tabs/ModelTab.tsx` (whole),
`components/abstract/tabs/TabDataMaker.tsx` (whole), `components/abstract/Dock.tsx` (whole),
`components/abstract/style.scss` (190-260, 316-345), `components/dock/MyRcDock.tsx` (grep only),
`components/polymetric/PolymetricView.tsx` (grep for `isOpen`/`isVisible`, 214-240), `components/polymetric/polymetric-view.scss` (20-40),
`styles/tokens/_z-index.scss` (whole), `styles/components/_form-system.scss` (645-720),
`model/simulation/stcFromRoles.ts` (whole), `model/simulation/step.ts` (whole), `model/simulation/types.ts` (whole),
`model/simulation/isKindOf.ts` (whole), `model/simulation/__tests__/step.test.ts` and `events.test.ts` (grep for the
terminal role), `examples/RowViewSmoke/index.ts` (60-82, 324), `pages/components/Navbar.tsx:1531-1534`,
`events/registry.ts` (grep).

Under `/Users/alfonso/jjodel/frontend/node_modules/` (the worktree's `node_modules` is a symlink there):
`rc-dock/lib/DockTabPane.js` (whole), `rc-dock/lib/DockTabs.js` (grep), `rc-dock/dist/rc-dock.css` (118-145, 210-220),
`rc-tabs/lib/TabPanelList/index.js` (whole). Versions: rc-dock 3.3.2, rc-tabs 11.16.1.

Docs: `CLAUDE.md`, `docs/PROTOCOL.md` (P1-P13), `docs/decisions.md` (R-SIM-1..17), `docs/log-inbox/simulation.md`,
`docs/claude-code-log.md` (top five entries), `docs/discovery/discovery_2026-09-23_sim_step1_events.md` (grep).

## 3. Item 1 — the measurement

**Setup [M].** Dev server of this worktree on `localhost:3002` (vite with a config in the session scratchpad, own
cache dir; 3000 serves `~/jjodel`, 3001 `~/jjodel-release`). Playwright, Chromium, viewport 1600x1000, offline
user seeded as the smoke does. Project: the `rowviews` smoke fixture (`#/project?id=Pointer_RowViewSmokeProject&smoke=rowviews`),
metamodel `Smoke`, model `smoke_model`, no simulation role set. Each tab opened once from the project sidebar, tabs
switched by a click on the rc-tabs button. The owner of each `.sim-panel` is read from the React fiber
(`memoizedProps.modelid`, `isModelMode` of the nearest `SimulationPanel` props); the top element with
`document.elementFromPoint` at the chip's centre; the chip is clicked with `page.mouse.click` on that pixel, the
user's gesture. Probes: `probe_faces.ts`, `probe_order.ts` in the session scratchpad; nothing written to the model.

**Verbatim, metamodel opened first, then the model** (`probe_faces.out`):

```
MEAS  tabs after opening both  [" Row view smoke","Smoke","smoke_model"]
MEAS  A model tab active, chips closed  {"label":"A","activeTab":"smoke_model","count":2,"panels":[{"domIndex":2435,"parent":"body","cls":"sim-panel sim-panel--closed","modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","isModelMode":false,"rect":[216,920,107,32],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":false,"face":"chip"},{"domIndex":2439,"parent":"body","cls":"sim-panel sim-panel--closed","modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","isModelMode":true,"rect":[216,920,107,32],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":true,"face":"chip"}],"editors":[{"modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","paneId":"Pointer1790237866322_USER_9","paneActive":false,"paneInlineStyle":"visibility: hidden; height: 0px; overflow-y: hidden;","paneVisibility":"hidden","paneHeight":916,"editorRect":[-1597,51,1598,916],"editorVisibility":"hidden"},{"modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","paneId":"Pointer1790237867828_USER_43","paneActive":true,"paneInlineStyle":null,"paneVisibility":"visible","paneHeight":916,"editorRect":[1,51,1598,916],"editorVisibility":"visible"}]}
MEAS  A model tab active, after chip click  {"label":"A-open","activeTab":"smoke_model","count":2,"panels":[{"domIndex":2435,"parent":"body","cls":"sim-panel sim-panel--closed","modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","isModelMode":false,"rect":[216,920,107,32],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":false,"face":"chip"},{"domIndex":2439,"parent":"body","cls":"sim-panel sim-panel--open","modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","isModelMode":true,"rect":[216,869,288,84],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":true,"face":"Configure simulation roles on the metamodel"}],"editors":[{"modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","paneId":"Pointer1790237866322_USER_9","paneActive":false,"paneInlineStyle":"visibility: hidden; height: 0px; overflow-y: hidden;","paneVisibility":"hidden","paneHeight":916,"editorRect":[-1597,51,1598,916],"editorVisibility":"hidden"},{"modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","paneId":"Pointer1790237867828_USER_43","paneActive":true,"paneInlineStyle":null,"paneVisibility":"visible","paneHeight":916,"editorRect":[1,51,1598,916],"editorVisibility":"visible"}]}
MEAS  B metamodel tab active  {"label":"B","activeTab":"Smoke","count":2,"panels":[{"domIndex":2436,"parent":"body","cls":"sim-panel sim-panel--closed","modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","isModelMode":false,"rect":[216,920,107,32],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":false,"face":"chip"},{"domIndex":2440,"parent":"body","cls":"sim-panel sim-panel--open","modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","isModelMode":true,"rect":[216,869,288,84],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":true,"face":"Configure simulation roles on the metamodel"}],"editors":[{"modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","paneId":"Pointer1790237866322_USER_9","paneActive":true,"paneInlineStyle":"","paneVisibility":"visible","paneHeight":916,"editorRect":[1,51,1598,916],"editorVisibility":"visible"},{"modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","paneId":"Pointer1790237867828_USER_43","paneActive":false,"paneInlineStyle":"visibility: hidden; height: 0px; overflow-y: hidden;","paneVisibility":"hidden","paneHeight":916,"editorRect":[1599,51,1598,916],"editorVisibility":"hidden"}]}
MEAS  B metamodel tab active, after chip click  {"label":"B-open","activeTab":"Smoke","count":2,"panels":[{"domIndex":2436,"parent":"body","cls":"sim-panel sim-panel--closed","modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","isModelMode":false,"rect":[216,920,107,32],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":false,"face":"chip"},{"domIndex":2440,"parent":"body","cls":"sim-panel sim-panel--open","modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","isModelMode":true,"rect":[216,869,288,84],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":true,"face":"Configure simulation roles on the metamodel"}],"editors":[{"modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","paneId":"Pointer1790237866322_USER_9","paneActive":true,"paneInlineStyle":"","paneVisibility":"visible","paneHeight":916,"editorRect":[1,51,1598,916],"editorVisibility":"visible"},{"modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","paneId":"Pointer1790237867828_USER_43","paneActive":false,"paneInlineStyle":"visibility: hidden; height: 0px; overflow-y: hidden;","paneVisibility":"hidden","paneHeight":916,"editorRect":[1599,51,1598,916],"editorVisibility":"hidden"}]}
MEAS  C model tab active again  {"label":"C","activeTab":"smoke_model","count":2,"panels":[{"domIndex":2435,"parent":"body","cls":"sim-panel sim-panel--closed","modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","isModelMode":false,"rect":[216,920,107,32],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":false,"face":"chip"},{"domIndex":2439,"parent":"body","cls":"sim-panel sim-panel--open","modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","isModelMode":true,"rect":[216,869,288,84],"visibility":"visible","display":"block","zIndex":"850","position":"fixed","topAtCenterIsThis":true,"face":"Configure simulation roles on the metamodel"}],"editors":[{"modelid":"Pointer1790237866322_USER_9","modelName":"Smoke","paneId":"Pointer1790237866322_USER_9","paneActive":false,"paneInlineStyle":"visibility: hidden; height: 0px; overflow-y: hidden;","paneVisibility":"hidden","paneHeight":916,"editorRect":[-1597,51,1598,916],"editorVisibility":"hidden"},{"modelid":"Pointer1790237867828_USER_43","modelName":"smoke_model","paneId":"Pointer1790237867828_USER_43","paneActive":true,"paneInlineStyle":"","paneVisibility":"visible","paneHeight":916,"editorRect":[1,51,1598,916],"editorVisibility":"visible"}]}
pageerrors: 0
```

Reading: A, count 2, both in `body`, same rect, `smoke_model`'s panel (DOM index 2439) on top of `Smoke`'s (2435).
A-open, the click on the visible chip opens the model's panel, with today's fixed hint. B, the metamodel tab is
active, its editor is visible, the pane of the model is hidden, and the model's open panel still covers
`Smoke`'s chip (`topAtCenterIsThis: false` for `Smoke`). B-open, the probe collapsed both panels and clicked the
chip's pixel on the metamodel tab: what opened is again the **model's** panel (the M1 face) — the metamodel's role
selects are unreachable by the user's gesture. C, back on the model, unchanged.

**Verbatim, reverse order: the model opened first, then the metamodel** (`probe_order.out`):

```
MEAS  reverse order, model tab active  {"activeTab":"smoke_model","domOrder":["smoke_model","Smoke"],"onTop":"Smoke","visible":["visible","visible"]}
MEAS  reverse order, metamodel tab active  {"activeTab":"Smoke","domOrder":["smoke_model","Smoke"],"onTop":"Smoke","visible":["visible","visible"]}
MEAS  reverse order, project summary tab active  {"activeTab":"Row view smoke","domOrder":["smoke_model","Smoke"],"onTop":"Smoke","visible":["visible","visible"]}
pageerrors: 0
```

Reading: the winner is whichever editor mounted last, not the kind of tab. With the model opened first, the
metamodel's panel covers the model's in the model tab ("the configuration in a model"), and in the project summary
tab the chip of a hidden editor still floats over the summary page.

**Why the order [R].** A portal into `document.body` appends its children at mount
(`EditorV2.tsx:4399-4402`, `{modelid && createPortal(<SimulationPanel modelid={modelid} isModelMode={isModelMode} />, document.body,)}`),
and the panel keeps its root element across the chip/open switch (`SimulationPanel.tsx:412-432`, the same `div` type
at the same position), so the DOM order is the mount order for the life of the tabs. Both panels have
`position: fixed; left: calc(200px + 16px); bottom: 48px; z-index: 850` (`simulation-panel.scss:34-40`): same
stacking level, so DOM order decides.

The alternatives the prompt names are not needed to explain the symptom: `isModelMode` is correct on each panel
(`false` on `Smoke`, `true` on `smoke_model`), and each panel's `open` state is its own.

## 4. Item 2 — how rc-dock hides an inactive tab here

**[R]** `rc-dock/lib/DockTabPane.js:59-69`:

```js
if (!active) {
    if (animated) {
        mergedStyle.visibility = 'hidden';
        mergedStyle.height = 0;
        mergedStyle.overflowY = 'hidden';
    }
    else {
        mergedStyle.display = 'none';
    }
}
```

`animated` defaults to true (`rc-dock/lib/DockTabs.js:292-294`, `if (animated == null) { animated = true; }`), and the
`models` group does not set it (`Dock.tsx:267-272`, `'models': {floatable: true, maximizable: false}`). The children
stay mounted after the first visit: `DockTabPane.js:72`, `const isRender = cached === false ? active : this.visited;`,
and `TabDataMaker.tsx:18-36` sets no `cached`. rc-tabs shifts the content strip with an inline margin
(`rc-tabs/lib/TabPanelList/index.js:44`, `marginLeft: "-".concat(activeIndex, "00%")`), the slide transition is
disabled by `components/abstract/style.scss:199-201`.

**[M]** On the hidden pane: inline style `visibility: hidden; height: 0px; overflow-y: hidden;`, computed
visibility `hidden`, but measured height 916, not 0: `styles/components/_form-system.scss:657-660` sets
`.dock-tabpane { background-color: #ffffff !important; height: 100% !important; }`, which beats the inline
`height: 0`. The hidden editor keeps its full size and sits off-screen through the margin (rect `[-1597,51,1598,916]`
or `[1599,51,1598,916]`), with computed `visibility: hidden`, inherited by every descendant that does not reset it.
The portaled panel is not a descendant: it inherits from `<body>`, visible.

So hiding here is `visibility: hidden` plus an off-screen offset, with the tree mounted; not `display: none`, not
unmount.

## 5. Item 3 — fix options

### 5.1 What the portal to `<body>` protects against, measured

**Containing block and clipping [M].** The ancestor chain of the active `.editor-v2` up to `<body>`
(`probe_optA.out`, `chain`): no element has a `transform`, `filter`, `contain`, `will-change`, or `opacity < 1`, and
none creates a stacking context (`position` with a `z-index` other than `auto`). Five of them clip:
`.editor-switch-container` (`overflow: hidden`, `position: relative`), the tab's `div.w-100.h-100`
(`ModelTab.tsx:41` / `MetamodelTab.tsx:183`, inline `overflow: 'hidden'`), `.dock-tabpane`, `.dock.dock-top`,
`.dock-layout`. `.editor-v2` itself computes `position: static` and `overflow: visible`, with the same rect as
`.editor-switch-container`, `[1,51,1598,916]`.

**Stacking [M].** Because no ancestor creates a stacking context, a `z-index: 850` inside the editor competes in the
root context exactly as the portaled panel does today: above the dock (drop layers up to 400), below the Properties
rail overlay (`.properties-tree-overlay`, fixed, z 900, rect `[1200,91,400,877]`, which does not overlap the
panel's corner) and the navbar (950, `_z-index.scss:66`). React Flow's layers stay below: `.react-flow` is
`position: relative; z-index: 0`, its own context, so the minimap and panels (`z-index: 5`) cannot rise above
anything outside it.

**The option simulated [M].** A box of the M2 open face's size (288x363, measured on the real open face) appended
to the active `.editor-v2` with `position:absolute; left:215px; bottom:16px; z-index:850`:

```
MEAS  M2 open face  {"cls":"sim-panel sim-panel--open","rect":[216,589,288,363],"selects":9}
MEAS  option (a) probe, Smoke active  {"rect":[216,588,288,363],"hits":["probe","probe","probe"],"above":[[],[],[]],"hiddenEditorProbe":{"rect":[1814,588,288,363],"visibility":"hidden"}}
MEAS  option (a) probe, smoke_model active  {"rect":[216,588,288,363],"hits":["probe","probe","probe"],"above":[[],[],[]],"hiddenEditorProbe":{"rect":[-1382,588,288,363],"visibility":"hidden"}}
```

`hits` is `elementFromPoint` at three points of the box (top-left, centre, bottom-right), `above` what paints over it
there: the box is on top at all three, nothing above. The same box in the hidden editor sits off-screen with
computed visibility `hidden`. It anchors on `.editor-switch-container`, the nearest positioned ancestor, whose rect
equals the editor's.

**Inherited style [M].** Of fourteen inherited properties, `<body>` and `.editor-v2` differ only in `color`
(`rgb(15, 23, 42)` against `rgb(30, 41, 59)`), which `.sim-panel` sets itself (`simulation-panel.scss:42`). A clone of
the real chip appended to the editor computes the same font, size, line-height, colour, background and box as the
original (`chipSame: true`, `spanSame: true`), 1px higher: rect `[216,919,107,32]` against `[216,920,107,32]`. No
token the panel reads is redefined under `components/editor-v2/` (grep of the thirteen tokens in
`simulation-panel.scss` over `components/editor-v2/**/*.scss`: one hit, a comment in `instanceNode.scss:717`; positive
control, the same grep over `styles/tokens/` finds `--color-bg-hover:` in both colour files). Dark mode was not
measured.

**Events [R].** A React portal already propagates synthetic events through the React tree, so the panel's key and
pointer events reach `.editor-v2`'s `onKeyDown`, `onPointerDownCapture` and `onKeyDownCapture`
(`EditorV2.tsx:4268`) today; mounting it in the DOM subtree does not add a React listener on the path. Native
listeners on the new DOM path (the dock elements between the editor and `<body>`) were not searched and not
measured; `document` and `window` listeners see the events either way.

### 5.2 Option (a) — mount inside the editor, `position: absolute`

The hidden tab hides its panel through the inherited `visibility: hidden` and the off-screen offset, with no state
to keep in sync. Each editor keeps its own panel mounted with its own `open` state across tab switches, and the
run-state is untouched (the cleanup that clears the run, `SimulationPanel.tsx:303`, runs only on unmount, as today).
The summary, documentation and manager tabs have no editor, so no panel shows there.

Diff: `EditorV2.tsx:4399-4402` becomes `{modelid && <SimulationPanel modelid={modelid} isModelMode={isModelMode} />}`
(the `createPortal` import stays, the context menu and PolymetricView still use it).
`simulation-panel.scss:35-39`: `position: fixed` becomes `absolute`; `left: calc(200px + 16px)` stays (216 → 217
against the editor's left edge at 1, a 16px gutter from the palette's right edge at 201); `bottom: 48px` becomes
`16px` (the status bar is outside the editor box now; 952 → 951); `z-index: 850` stays; the header comment about the
portal, the theme variables and the smoke A3 status-bar reasoning is rewritten to match.

Costs and risks:
- **The anchor is `.editor-switch-container`** (`EditorSwitch.scss:1-6`, `position: relative`), not the editor root,
  which is static. EditorV2 gets a `modelid` only from `EditorSwitch` (`EditorSwitch.tsx:116`, `:134`); the
  `/editor-v2` route mounts `<EditorV2/>` without one (`App.tsx:151`) and the panel is gated on `modelid`. The
  coupling is stated in the SCSS comment. The alternative, `position: relative` on `.editor-v2` in
  `EditorV2.scss`, is a file outside the declared scope and re-anchors every absolute descendant that anchors on
  the switch container today (same rect, so no visible change expected, not measured). Question 3.
- **Clipping at small heights.** Five ancestors clip. The M2 open face is 363px tall; it is clipped at the top only
  when the editor is shorter than about 379px (panel plus 16px gutter). Today the fixed panel would extend over the
  toolbar and navbar instead.
- **Smoke A3** (no fixed element intersects the status bar) no longer applies to the panel, which is no longer
  fixed; it stays clear of the bar by construction.
- **Two visible editors side by side.** Not reachable in this build: a `dockMove` of the metamodel tab to the right
  of the model's panel, and a `dockMove` to a float, both left the second editor at rect `[0,0,0,0]` [M]. If a
  future layout shows two editors, (a) gives each its own panel at its own corner.

### 5.3 Option (b) — keep the portal, render only in the active editor

Signals that exist:
- `ActiveEditorProvider` (`EditorSwitch.tsx:113`, `:131`; `ActiveEditorContext.tsx:25-31`): one provider **per
  editor**, and it tracks `'flow' | 'classic'` inside that editor, not which dock tab is active. Not usable.
- The dock's `onLayoutChange` (`Dock.tsx:342-374`): dispatches `JjodelEvents.ACTIVE_TAB` with `{ activeId, tabType }`
  and `EDITOR_TYPE_CHANGE` with `{ editorType, modelId }`, and sets `body[data-editor-type]`. It reads only the first
  dock child: `Dock.tsx:343`, `const panel = newLayout?.dockbox?.children?.[0];`. Measured: after floating the
  metamodel tab, `body[data-editor-type]` stayed `model` while the float's active tab was `Smoke`. It is an event,
  not a state: a panel mounting after the dispatch needs an initial read of `DockManager.dock.getLayout()`.
- rc-dock's own pane state (`.dock-tabpane-active`, `aria-hidden` on the pane, `DockTabPane.js:81`): readable from
  the DOM through `closest('.dock-tabpane')` and a `MutationObserver`, not through React.

Diff: a hook (in `EditorV2.tsx` or a new file) listening to `ACTIVE_TAB` with the initial layout read, and the panel
rendered as `modelid && isActiveTab && createPortal(...)`. Two traps: unmounting the panel on a tab switch runs the
cleanup at `SimulationPanel.tsx:303` (`useEffect(() => () => { simClear(modelid); }, [modelid]);`), which **stops
the run on every tab switch**, so (b) must hide, not unmount (a `hidden` prop that makes the component return `null`
after its hooks); and the signal is wrong for any layout where the first dock child is not the one the user looks
at (floats measured, splits by construction).

### 5.4 Recommendation

**(a).** It has no state to synchronize, the browser already hides the right element, the measured risks (anchor,
clipping below ~379px) are small and local, and it fixes the summary-tab case for free. (b) needs a new signal
with an initial read, a hide-not-unmount rule to protect the run, and is wrong on floats. The measurement confirms
the chat's lean; nothing overturns it.

## 6. The two other portals (recorded, not in scope)

**PolymetricView [M][R].** Mounted in every editor, gated by `isOpen`, but opened by a window event with no
target: `EditorV2.tsx:1023-1029`, `const handlePolymetric = () => { if (modelid) setPolymetricOpen(true); };` on
`JjodelEvents.OPEN_POLYMETRIC`, dispatched by `Navbar.tsx:1534` with no detail. Measured with the metamodel tab
active: one dispatch opens **two** full-screen overlays in `<body>`, `{"modelName":"Smoke","target":"metamodel"}` and
`{"modelName":"smoke_model","target":"model"}`, the model's on top; one backdrop click closes the top one and
reveals the other; one Escape closes both (each listens on `document`, `PolymetricView.tsx:214-218`). Shares the
defect.

**ContextMenu [M][R].** `onNodeContextMenu`/`onEdgeContextMenu` (`EditorV2.tsx:2750`, `:2765`) are per-editor
gestures and cannot fire on a hidden editor. But child rows of a class node dispatch a window event
(`ClassNode.tsx:697`, `:759`, `:836`, `JjodelEvents.CHILD_CONTEXT_MENU`) that every mounted editor turns into its own
menu (`EditorV2.tsx:2836-2849`, no model filter). Measured: one right-click on an attribute row of `Smoke` opens
**two** menus in `<body>`, owners `Smoke` and `smoke_model`, both `["Delete Attribute","Create row view — no viewpoint available","Help"]`;
the hidden model editor's menu is the one on top, so its handler would run on a child id of another editor.
Shares the defect, through the event rather than the portal. Proposed as a ticket.

## 7. Item 4 — incomplete configuration message

**Rule.** On the M1 face, when any engine role is missing, the controls are replaced by one hint naming the
metamodel and the missing roles by their panel labels, in panel order (`ROLE_SPECS`, `SimulationPanel.tsx:63-75`):
`Initial`, `Terminal`, `Owned transitions`, `Next state`. The metamodel name is `idlookup[configModelId].name`,
read in `mapStateToProps` beside `configModelId` (`SimulationPanel.tsx:559-561`), as a primitive prop. An empty name
falls back to `the metamodel`.

Wording, `.sim-panel__hint` (11px):

- `Simulation is not configured on metamodel Smoke. Missing roles: Initial, Terminal, Owned transitions, Next state.`
- `Simulation is not configured on metamodel Smoke. Missing role: Terminal.`
- no metamodel (`configModelId` null): `This model has no metamodel to configure.`

**Half-set event role.** Today, `simEvent` without `simTrigger`, or the reverse, or `simEventIdentifier` alone,
means no event role (`stcFromRoles.ts:38-45`): the run works with the alphabet {ε}, as R-SIM-16 says, and the panel
shows only `Step`, silently. The 1850 discovery proposed an M2-face hint for this case
(`discovery_2026-09-23_sim_step1_events.md:93`, "the M2 face shows a hint. Question 4"); the code has none
(`SimulationPanel.tsx:447-469` renders only `roleError` and `roleWarning`). Recommendation: yes, one line on the
M1 face between the actions row and the status line, in the hint style (not the warning colour: the run is valid),
present or absent for the whole run since the roles cannot change from the model tab, so no shift while running:

- `Events off: Trigger is not set on metamodel Smoke.`
- `Events off: Event is not set on metamodel Smoke.`
- `Events off: Event and Trigger are not set on metamodel Smoke.` (identifier alone)

Optional, question 5: the same fact on the M2 face under the selects, `Event role inactive: set both Event and Trigger.`

"11px secondary text": `.sim-panel__hint` is 11px in `--color-text-tertiary` (`simulation-panel.scss:165-170`).
Assumed that class, unchanged; if the prompt means the `--color-text-secondary` token, it is one declaration in a
modifier. Question 6.

## 8. Item 5 — should `simTerminal` stop being required

What changes, all [R]:
- `model/simulation/stcFromRoles.ts:28`, `if (!initial || !terminal || !ownedTransitions || !nextState) return null;`
  drops `!terminal`, and `:32` sets `terminal` only when present.
- `model/simulation/types.ts:47`, `terminal: string;` becomes `terminal?: string;` in the exported `StcRoles`. That is a
  change to an exported interface, not an added optional property (CLAUDE.md rule 11): it needs approval.
- `model/simulation/step.ts`: the three terminal reads, `:79` (`anyTerminal`), `:110` (the freeze of the step) and
  `:191` (`runStatus`), guard on a missing role; with none, `Terminated` is unreachable, the freeze never happens,
  and a marked instance with no outgoing transition reads `Deadlock` (`step.ts:192`). A statechart with a final state
  but no terminal role would end in `Deadlock`; waiting (a marked state whose transitions all need an event) still
  reads `Running`.
- `model/simulation/__tests__/step.test.ts:323-326` pins `simTerminal` among the required keys
  (`for (const key of ['simInitial', 'simTerminal', 'simOwnedTransitions', 'simNextState']) { expect(stcFromRoles({ ...complete, [key]: undefined })).toBeNull();`).
  `step.test.ts` is the parity oracle of step 1, kept byte-identical by 1850: this change edits it.
- Panel: `ENGINE_ROLE_KEYS` (`SimulationPanel.tsx:88`) drops `simTerminal`, so the message of §7 stops listing it.
- R-SIM-6 anchors the termination criterion in the panel spec, R-SIM-9 keeps the final role a metaclass in the
  boolean kind: making it optional is a line in `docs/decisions.md`, not only code.

It touches `model/simulation/`, out of this lane's scope. **Recommendation:** make it optional, in a lane of its
own after this one (engine files, the interface change and the oracle edit approved there, and a decision line);
this lane keeps it required and the new message names it, so the turnstile case is at least explained on screen. A
panel-only workaround (passing a terminal id that matches nothing) is not recommended: it puts a false role in the
descriptor.

## 9. Item 6 — test plan

The panel imports the joiner and does not load under the node bench, so the rules go into a pure module:
`components/editor-v2/sim/simRoleStatus.ts` (new, no joiner import), holding `ROLE_SPECS`, `RoleKey`, `RoleKind`,
`RoleSpec`, `ENGINE_ROLE_KEYS` and the `Roles` type moved **unchanged** from `SimulationPanel.tsx` (moved, not
renamed; the panel imports them), plus `missingEngineRoles(roles)`, `eventRoleGap(roles)` and the two message
builders. Tests in `components/editor-v2/sim/__tests__/simRoleStatus.test.ts`, inside the vitest include
(`vitest.config.ts:16`, `src/**/__tests__/**/*.test.ts`).

| Rule | Test | Mutation that must kill it |
|---|---|---|
| R1 missing engine roles, panel order | all four missing → the four labels in order; each alone → its label only; complete → `[]`; `''` counts as missing; `Node`, `Transition`, `Event`, `Trigger`, `Event identifier` never listed | drop `simTerminal` from the helper's keys; iterate `ROLE_SPECS` without the engine filter; reverse the order; test `!== undefined` instead of a non-empty string |
| R2 parity with the engine | for each of the 16 subsets of the four keys, `missingEngineRoles(r).length === 0` iff `stcFromRoles(r) !== null` | the helper drops a key (the two copies of the rule, `SimulationPanel.tsx:88` and `stcFromRoles.ts:28`, drift) |
| R3 message | names the metamodel; singular `role` for one, plural for more; fallback `the metamodel` for an empty name | drop the name; always plural |
| R4 event role gap | `{}` and Event+Trigger → none; Event only → `Trigger`; Trigger only → `Event`; identifier only → `Event, Trigger`; none ⇔ `stcFromRoles` carries `roles.event` or no key is set | treat identifier-only as absent; swap the two labels |
| R5 one visible panel per active editor | not unit-testable (DOM, rc-dock): a gitignored Playwright probe replaying §3, asserting in each tab exactly one panel at the chip's pixel, owned by the tab's model, with the right face | restore `createPortal(..., document.body)`: the probe must report two panels at one rect and the wrong face on one tab |

What stays visual: the panel's JSX branch between message and controls (joiner at import, no bench), the geometry
of the chip against the palette, dark mode, and Alfonso's checks (i)-(iv) of Phase 2 item 4.

## 10. Item 7 — baseline gates on `ff2c624a1` [M]

- `npm run typecheck`: exit 2, **14** errors on full output (`grep -c "error TS"` = 14), the expected set:
  `api/data.ts` x3 (868, 868, 1126), `common/Dummy.ts:46`, `components/editor-v2/EditorV2.tsx:3114` (TS2339),
  `forEndUser/Measurable.tsx` x6, `Jodie/ChatMessages.tsx:271`, `project/ProjectEditor.tsx:226`,
  `pages/components/Dashboard.tsx:586`. The `EditorV2.tsx` error is outside the portal site.
- `npx vitest run`: exit 1, **4228 passed, 0 failed**; 9 files red at import (`jjscript/context-binding`, seven
  `jjtl/__tests__` files, `utils/UDComparator`), the same count as the 1850 entry.
- `npm run build`: exit 0, only the chunk-size warning (and the Sass `@import` deprecation lines).

## 11. Open questions for Alfonso

1. **`simTerminal` optional?** Recommended yes, in its own lane under `model/simulation/` (the `StcRoles` interface
   change, the `step.test.ts:323` edit and a decision line on termination); this lane keeps it required and names
   it in the message (§8).
2. **Option (a) or (b)?** Recommended (a), mount inside the editor with `position: absolute` (§5.4).
3. **Anchor of (a):** rely on `.editor-switch-container` (`EditorSwitch.scss`, no change, coupling stated in the
   comment), or add `position: relative` to `.editor-v2` in `EditorV2.scss` (outside the declared scope)?
   Recommended the first.
4. **Two new files:** `sim/simRoleStatus.ts` (with `ROLE_SPECS`, `ENGINE_ROLE_KEYS` and the role types moved from
   the panel) and `sim/__tests__/simRoleStatus.test.ts`. Approve? Phase 2 would then touch five code files.
5. **Half-set event role:** the M1 line under the controls (recommended); the M2 line under the selects too?
6. **"11px secondary text":** the existing hint (`--color-text-tertiary`) or the `--color-text-secondary` token?
7. **PolymetricView and `CHILD_CONTEXT_MENU`** duplicates (§6): open as tickets in the log entry, not fixed here?
8. **Commit type** of the Phase 2 code commit (P6 asks it to be named): `fix:` proposed.

## 12. Proposed Phase 2 diff, in prose

1. `frontend/src/components/editor-v2/sim/simRoleStatus.ts` (new): `RoleKey`, `RoleKind`, `RoleSpec`, `ROLE_SPECS`,
   `ENGINE_ROLE_KEYS`, `Roles` moved verbatim from `SimulationPanel.tsx:43-90`, with their comments; exported
   (`ROLE_KEYS`, `:77`, can move with them or stay in the panel, it is derived);
   `missingEngineRoles(roles): string[]` (labels of the unset engine roles, in `ROLE_SPECS` order);
   `eventRoleGap(roles): string[] | null` (the unset labels among `Event`, `Trigger` when any of the three event
   keys is set but the pair is not complete, else `null`); `incompleteMessage(name, missing)` and
   `eventRoleMessage(name, gap)` with the wording of §7.
2. `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: import the moved identifiers; `rolesComplete` becomes
   `missingEngineRoles(roles).length === 0`; `StateProps` gains `configModelName: string` from `mapStateToProps`;
   the fixed hint at `:471` becomes `incompleteMessage(...)` (or the no-metamodel line); the event-role line goes
   between `.sim-panel__actions` and the Events section/status; the header comment's "portaled to <body>" is
   updated. No other behaviour change: the M2 face, the run handlers and `mapStateToProps`' existing props stay.
3. `frontend/src/components/editor-v2/sim/simulation-panel.scss`: `position: absolute`, `bottom: 16px`, `left` and
   `z-index` unchanged, header comment rewritten (anchor, theme, status bar). No new rule unless question 6 asks
   for a modifier; no variable defined.
4. `frontend/src/components/editor-v2/EditorV2.tsx`: the mount at `:4399-4402` loses `createPortal`/`document.body`,
   one comment line. Nothing else in the file.
5. `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts` (new): R1-R4 of §9, with the mutation
   bench run on copies and reported in the commit message; R5 run as a gitignored probe on 3002 before the hard stop.

Then the gates of Phase 2 item 3, and the hard stop for the visual check on 3002.
