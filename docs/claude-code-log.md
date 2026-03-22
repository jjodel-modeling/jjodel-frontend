# Claude Code Session Log

## 2026-03-21 — Surface hierarchy variables in editor-v2 _themes.scss

### What
Added surface hierarchy CSS variables (`--topbar-bg`, `--topbar-border`, `--topbar-text`, `--panel-bg`, `--panel-border`, `--sidebar-bg`, `--sidebar-border`) to both dark and light theme blocks in `_themes.scss`. Also updated light theme canvas: `--canvas-bg` from `#f8fafc` → `#f1f5f9`, `--canvas-dots` from `rgba(0,0,0,0.08)` → `rgba(100,116,139,0.25)` for more visible dot grid.

### Light theme surface values
| Variable | Value | Purpose |
|----------|-------|---------|
| `--topbar-bg` | `#1e293b` | Dark topbar (slate-800) |
| `--topbar-border` | `#334155` | Topbar bottom border |
| `--topbar-text` | `#94a3b8` | Muted topbar text |
| `--panel-bg` | `#ffffff` | White properties panel |
| `--panel-border` | `#e2e8f0` | Panel divider |
| `--sidebar-bg` | `#f8fafc` | Sidebar (slate-50) |
| `--sidebar-border` | `#e2e8f0` | Sidebar divider |

### Dark theme surface values
| Variable | Value |
|----------|-------|
| `--topbar-bg` | `#0f172a` |
| `--topbar-border` | `#1e293b` |
| `--topbar-text` | `#64748b` |
| `--panel-bg` | `#1e293b` |
| `--panel-border` | `rgba(255,255,255,0.08)` |
| `--sidebar-bg` | `#253347` |
| `--sidebar-border` | `rgba(255,255,255,0.06)` |

### STEP 4 note
Grep found no hardcoded panel/sidebar/topbar backgrounds in editor-v2 or abstract SCSS that needed migration — existing rules already use `var(--surface-*)` CSS variables. The new variables are ready for consumption by future component work.

### Files Modified
- `frontend/src/components/editor-v2/_themes.scss` — both theme blocks updated

---

## 2026-03-21 — Remove editor-v3

### What
Removed `src/components/editor-v3/` entirely and cleaned up all external references. Editor V3 was a viewpoint-first architecture experiment; editor-v2 remains the active editor.

### Deleted
- `frontend/src/components/editor-v3/` — entire directory (EditorV3Shell, EditorV3Inner, contexts, hooks, nodes, edges, panels, styles, sync, toolbar, viewpoint, types, constants)

### Modified
| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Removed `EditorV3Shell` import and `editor-v3` route |
| `frontend/src/components/abstract/tabs/EditorSwitch.tsx` | Removed `EditorV3Shell` import, `'v3'` from `EditorMode` type, localStorage v3 override, and v3 render branch |
| `frontend/src/styles/tokens/_colors-dark.scss` | Removed "editor-v3" from comment |
| `frontend/src/styles/tokens/_colors-light.scss` | Removed "editor-v3" from comment |

### Verification
- `npx tsc --noEmit`: no new errors introduced (all errors are pre-existing)

## 2026-03-21 — Editor Surface Hierarchy (visual depth)

### What
Applied visual surface hierarchy to the editor-v3 surfaces: canvas, palette, properties panel, toolbar, tree view, and panel headers. Creates clear visual layering between zones.

### Surface map applied (light theme)

| Zone | Background | Border | Notes |
|------|-----------|--------|-------|
| Canvas | `#f1f5f9` (slate-100) | — | Dot grid: `#cbd5e1` 0.8px / 14px |
| Left sidebar (palette) | `#f8fafc` (slate-50) | right `#e2e8f0` | New `--color-palette-bg` token |
| Properties panel | `#ffffff` | left `#e2e8f0` | Unchanged `--color-panel-bg` |
| Panel headers | `#1e293b` (dark) | bottom `#334155` | Text `#94a3b8` |
| Canvas toolbar | `#f8fafc` (slate-50) | `#e2e8f0` all-around | Plus existing shadow |
| Tree view panel | `#f8fafc` | left `#e2e8f0` | Updated `$color-bg-primary` |
| Nodes on canvas | `#ffffff` | — | Shadow already `rgba(0,0,0,0.06)` ✓ |

### Files modified (SCSS only)

| File | Changes |
|------|---------|
| `styles/tokens/_colors-light.scss` | `--color-canvas-bg` → slate-100, `--color-canvas-grid` → slate-300, `--color-panel-header-bg` → #1e293b (dark), `--color-panel-header-text` → #94a3b8, new `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border`, `--color-toolbar-bg` → slate-50 |
| `styles/tokens/_colors-dark.scss` | Added matching `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border` tokens |
| `editor-v3/styles/editor-v3.scss` | Canvas `.react-flow` now uses `background-color` + `background-image` (radial dot grid) + `background-size` |
| `editor-v3/styles/panels.scss` | `.v3-palette` uses `--color-palette-bg`, header borders use `--color-panel-header-border`, added `.v3-properties__type-badge` styles |
| `editor-v3/styles/toolbar.scss` | Added `border: 1px solid var(--color-toolbar-border)` |
| `TreeViewSidebar/tree-view-sidebar.scss` | `$color-bg-primary` → #f8fafc, `$color-border` → #e2e8f0 |

### TSX notes (not modified per constraints)
- **Entity type badge** (`.v3-properties__type-badge`): CSS class added but needs TSX wiring in `PropertiesPanel.tsx` to render `<span class="v3-properties__type-badge">MODEL</span>` in the header
- Editor-v2 does not use CSS custom properties from the token system — no regression risk

### Build
SCSS compiles cleanly. Pre-existing build error (Vite `import.meta.url` in react-scripts webpack) unchanged.

---

## 2026-03-21 — Centralized Entity Icons & Colors (`entityMeta.ts`)

### What
Created `frontend/src/common/entityMeta.ts` as the single source of truth for entity type icons (Bootstrap Icon names), colors, and badge letters. Migrated three high-priority files to consume it.

### New file: `frontend/src/common/entityMeta.ts`
- `EntityType` union type (15 types: metamodel, model, class, attribute, etc.)
- `ENTITY_META` record with icon, color, badgeBg/badgeText (light+dark), letter per type
- Colors sourced from `docs/DESIGN-SYSTEM.md` §2.2 (artifact types) and `tree-view-sidebar.scss` $color-* variables (sub-entity types)
- `resolveEntityType(raw)` — maps D-prefixed class names, ElementBadge strings, and palette action types to canonical `EntityType`
- Helpers: `entityIcon()`, `entityColor()`, `entityLetter()`, `entityIsAbstract()`

### Files migrated
| File | What changed |
|------|-------------|
| `TreeViewContent.tsx` | Icon letter derivation now uses `resolveEntityType()` + `entityLetter()` instead of `className.slice(1,2)`. Transformation icon uses `entityIcon('transformation')`. |
| `AdaptivePalette.tsx` | All hardcoded `bi-*` icon strings in M2_SECTIONS replaced with `entityIcon()` calls. M1 instance icon also migrated. |
| `ElementBadge.tsx` | Removed `TYPE_LETTERS` record; now uses `resolveEntityType()` + `entityLetter()` from entityMeta. |

### NOT migrated (noted for future)
- **Tree View colors** (`tree-view-sidebar.scss`): uses SCSS $color-* variables and CSS classes (`.tree-DClass`, etc.) — separate SCSS migration needed
- **element-badge.scss**: badge bg/text colors are hardcoded in SCSS, not inline — separate migration to CSS custom properties from `ENTITY_META` needed
- **tab-title.scss**: uses `::before` pseudo-elements with hardcoded colors — SCSS migration
- **Icons.tsx** (`pages/components/icons/`): action icons (undo, redo, delete), not entity types — no migration needed
- **Project.tsx**: project type icons (public/private/collaborative), not entity types — no migration needed

### Build
Zero TypeScript errors in modified files. Pre-existing errors unchanged.

---

## 2026-03-21 — Fix: Restore colored badges in Project Dashboard

### Problem
`ElementBadge` for metamodel, model, and transformation types used muted slate gray in the dashboard. The design system (`docs/DESIGN-SYSTEM.md` §2.2) defines distinct artifact type colors that should be used consistently across the UI.

### Fix (element-badge.scss only)
Updated badge colors to match **DESIGN-SYSTEM.md §2.2** canonical artifact type colors:
- **Metamodel (Violet):** `#EEEDFE` / `#534AB7` (light), `rgba(127,119,221,0.2)` / `#AFA9EC` (dark)
- **Model (Amber):** `#FAEEDA` / `#854F0B` (light), `rgba(186,117,23,0.2)` / `#FAC775` (dark)
- **Transformation (Teal):** `#E1F5EE` / `#0F6E56` (light), `rgba(29,158,117,0.2)` / `#5DCAA5` (dark)
- Viewpoint (Pink) was already correct — no change needed

### Files Modified
- `frontend/src/components/common/element-badge.scss` — updated metamodel, model, transformation/epsilon colors (light + dark mode)

---

## 2026-03-21 — Fix: Context menu missing background/border in Project Dashboard

### Problem
The ⋮ context menu on metamodel/model rows in the project dashboard rendered without background, border, or box-shadow — text was unreadable over the list content.

### Root Cause
CSS specificity collision: `contextMenu/style.scss` defines a generic `.context-menu` using CSS custom properties (`var(--color-bg-elevated)`, etc.) that aren't defined in the project dashboard context. Since both definitions have equal specificity, load order determined the winner, and the generic one (with unresolved variables) won.

### Fix (project-editor.scss only)
Scoped `.context-menu` under `.project-editor` (both light and dark mode blocks) to increase specificity and guarantee the hardcoded project-dashboard styles always win.

### Files Modified
- `frontend/src/components/project/project-editor.scss` — changed `.context-menu` to `.project-editor .context-menu` (lines 535 and 949)

---

## 2026-03-19 — Fix: Properties panel empty when metamodel is empty or nothing selected

### Problem
When a metamodel had no elements (empty) or when clicking the canvas to deselect, the Properties panel showed nothing. `_lastSelected.modelElement` was either `undefined` (deselectAll else branch) or not set at all (useEffect guard skipped when `findModelElement` returned falsy for empty models).

### Root Cause
1. **useEffect:** `findModelElement()` returns a class/package ID, but for empty metamodels there are none. The `if (modelElement)` guard prevented setting `_lastSelected` at all.
2. **deselectAll else branch:** When `findModelElement` returned null/undefined, the code set `_lastSelected` to `undefined`, which meant Info.tsx received no `dataID` and rendered the empty state.

### Fix (useJjomSelection.ts only)
1. **useEffect:** Removed the `if (modelElement)` guard. Now always sets `_lastSelected` with `modelElement ?? modelid` — falls back to the model ID itself.
2. **deselectAll else branch:** Instead of setting `undefined`, sets `modelElement: modelid` — points to the model itself.

### Why it works
`Info.tsx` receives `dataID = modelid`, resolves it via `LModelElement.fromPointer(modelid)` which returns the `LModel` root, and renders `PropertiesOverview` with the metamodel stats.

### Files Modified
- `frontend/src/components/editor-v2/hooks/useJjomSelection.ts` — two changes (useEffect fallback + deselectAll else branch)

### Build Verification
- TypeScript: no new errors (`npx tsc --noEmit`)
- Pre-existing errors in DockManager.ts:237, MetamodelTab.tsx unchanged

---

## 2026-03-19 — Rollback: revert "Properties panel shows model overview" (caused white page)

### What happened
The previous change added a DockManager-based fallback in `mapStateToProps` (Info.tsx) to show the active model's overview when nothing was selected. This caused a white page on load — `LModel.fromPointer(activeId)` likely threw before DockManager was fully initialized, despite the try/catch.

### Rollback
- Removed the `// When nothing is selected` block from `mapStateToProps`
- Removed the `DockManager` import
- `mapStateToProps` restored to its original form (just nodeID/viewID/dataID + topics + advanced)

### Files Modified
- `frontend/src/components/editors/Info.tsx` — reverted to original `mapStateToProps`

---

## 2026-03-19 — UI polish: empty state scrollbar + minimal resize handle

### Fix 1: No scrollbar when "No element selected"
**Problem:** The Properties panel showed a scrollbar even when displaying the empty state (no element selected). The `.properties-panel` rule had `overflow-y: auto` which created a scrollbar when the empty state content was slightly taller than the container.
**Fix:** Added `.properties-panel--empty { overflow: hidden; }` inside `.properties-panel-container` in `properties-with-tree-view.scss`. The `--empty` class is already applied by Info.tsx when no element is selected.

### Fix 2: Minimal resize handle
**Problem:** The resize handle used a 16px grip icon with cyan hover effects — visually heavy and inconsistent with the app's minimal aesthetic.
**Fix:** Replaced with a 1px line design:
- Visually: 1px line in `#e2e8f0` (slate-200), becomes `#94a3b8` (slate-400) on hover
- Hit area: 5px (transparent padding around the line)
- Supports both `horizontal` (row-resize) and `vertical` (col-resize) orientations via `orientation` prop
- No decorative elements (no grip dots, no icon, no shadow)
- Removed debug console.log statements
- Simplified keyboard handling (removed synthetic mouse event hack)

### Files Modified
- `frontend/src/components/editors/properties-with-tree-view.scss` — added `overflow: hidden` for empty state
- `frontend/src/components/ResizeHandle/ResizeHandle.tsx` — simplified to minimal divider with orientation prop
- `frontend/src/components/ResizeHandle/resize-handle.scss` — rewritten: 1px line + 5px hit area

---

## 2026-03-19 — Refactor: remove duplicate editor-type-change dispatch from Dock.tsx

### Problem
`editor-type-change` was dispatched from three places: `DockManager.open2()`, `_detectActiveTabChange()` in MyRcDock.tsx, and `handleLayoutChange` in Dock.tsx. The Dock.tsx dispatch was redundant (and had the same `state[activeId]` bug) now that MyRcDock catches all tab switches via `componentDidUpdate`.

### Changes
- Removed the `editor-type-change` dispatch block from `handleLayoutChange` in Dock.tsx. Kept only `jjodel:active-tab` (StatusBar) and `data-active-tab` (documentation panel hiding).
- Removed the `setTimeout` initial dispatch block — `_detectActiveTabChange()` fires on first `componentDidUpdate` and handles initial detection.
- Removed unused `store` and `LProject` imports.

### Dispatch points after this change
- `DockManager.open2()` — card click opens model/metamodel
- `DockManager.openDocumentation()` — opens documentation tab
- `DockManager.openTransformation()` — opens transformation tab
- `_detectActiveTabChange()` in MyRcDock.tsx — all tab switches (componentDidUpdate)

### Files Modified
- `frontend/src/components/abstract/Dock.tsx` — removed redundant dispatch, cleaned imports

---

## 2026-03-19 — Fix: click on active tab hides panels

### Problem
Clicking the already-active tab caused panels (TreeView, Properties) to disappear. The `_detectActiveTabChange()` method treated `DockComponent_rightbar_*` IDs as real editor switches, dispatching `editorType: 'summary'` which collapsed the panels via CSS.

### Root Cause
When rc-dock internally refocuses the first panel, `activeId` can momentarily resolve to a `DockComponent_rightbar_*` tab. `_detectActiveTabChange()` processed this as a real tab change and dispatched a `summary` editor type, triggering the CSS rules that hide TreeView and Properties panels.

### Fix
Added an early return guard in `_detectActiveTabChange()` to ignore `DockComponent_rightbar_*` IDs entirely — these are internal rc-dock artifacts, not real editor switches.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `DockComponent_rightbar_` guard

---

## 2026-03-19 — Fix: _detectActiveTabChange resolves metamodel/model correctly

### Problem
`_detectActiveTabChange()` in MyRcDock.tsx always resolved model/metamodel tabs as `summary`. When clicking a metamodel tab, the `[DETECT]` log showed `editorType: 'summary'` instead of `editorType: 'metamodel'`.

### Root Cause
The Redux store lookup used `store.getState()[activeId]` which is always `undefined`. Jjodel's Redux store does not store objects as top-level keys — they live under `state.idlookup[id]`.

### Fix
Changed `store.getState()[activeId]` → `store.getState().idlookup[activeId]` in `_detectActiveTabChange()`. This matches the pattern used throughout the codebase (see `DPointerTargetable.from()` in `joiner/classes.ts:1454`).

**Note:** The same bug exists in `Dock.tsx` (lines 267 and 382) but was not fixed per instructions to only modify MyRcDock.tsx.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — fixed `idlookup` access in `_detectActiveTabChange()`

### Build Verification
- TypeScript: no errors (`npx tsc --noEmit`)

---

## 2026-03-19 — Fix: tab click now dispatches jjodel:editor-type-change

### Problem
Clicking an existing rc-dock tab to switch to it bypassed `DockManager` entirely. The `jjodel:editor-type-change` event was only dispatched by `DockManager.open2()` (new tab creation) and the `onLayoutChange` prop in Dock.tsx. However, rc-dock does not always fire `onLayoutChange` for simple tab switches within the same panel (treats them as "silent changes").

### Root Cause
rc-dock's `onLayoutChange` callback fires on structural layout changes (add/remove/move tabs) but may not fire when only the `activeId` changes within a panel. Tab clicks update `activeId` without changing the layout structure.

### Fix
Overrode `componentDidUpdate` in `PinnableDock` (MyRcDock.tsx) to detect active tab changes after every state update:
- Added `_lastActiveId` field to track the previous active tab ID
- Added `_detectActiveTabChange()` method that reads the current layout's `activeId` for the first (models) panel
- Only dispatches `jjodel:editor-type-change` when `activeId` actually changes (prevents redundant dispatches)
- Uses the same editor type detection logic as Dock.tsx: `jjtl_*` → transformation, `doc_*`/`DockComponent_rightbar_*` → summary, otherwise checks Redux store for DModel

### Why `componentDidUpdate` works
`componentDidUpdate` fires after every React state update, including rc-dock's internal `setState` when a tab is clicked. This catches ALL tab changes regardless of whether rc-dock considers them "silent" or not.

### Dispatch deduplication
- `_lastActiveId` prevents duplicate dispatches on re-renders that don't change the active tab
- When `open2()` creates a new tab and dispatches, `componentDidUpdate` may also fire — the double dispatch is harmless (listeners are idempotent)
- The `open2()` dispatch was intentionally kept per user request

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `store` import, `_lastActiveId` field, `_detectActiveTabChange()` method, call in `componentDidUpdate`

### Build Verification
- TypeScript: no new errors from MyRcDock.tsx (`npx tsc --noEmit`)

---

## 2026-03-19 — Rollback: revert tab-switch fix that broke card flow

### What happened
A previous attempt to fix "tab click not updating panels" added:
1. `resolveEditorType()` + dispatch in `DockManager.open()` found branch
2. `currentTabId` fallback in `Dock.tsx handleLayoutChange`
3. Removed debug logs from multiple files

This broke the working card→panel flow.

### Rollback
- **DockManager.ts**: Removed `resolveEditorType()`, removed dispatch in found branch, removed `store` import. Kept Session 1's duplicate tab guard (`updateTab` + early return).
- **Dock.tsx**: Reverted to HEAD (Session 1 debug logs were the only diff; removing them restored HEAD state which already has full `handleLayoutChange` + editor type detection).
- **Dashboard.tsx**: Minor debug log removal kept (functionally identical).
- **TreeViewPanelContext.tsx**: Minor debug log removal kept (functionally identical).

### Current state: card=✅, tab=❌
Card flow works: `open2()` → `open()` (guard or dockMove) → `open2()` dispatches `editor-type-change`.
Tab click flow broken: clicking a tab in rc-dock tab bar doesn't go through `DockManager` — relies on `onLayoutChange` in Dock.tsx which may not fire for tab switches.

### All `editor-type-change` dispatch/listen points
**Dispatchers:**
- `DockManager.ts:102` — `open2()` after opening model/metamodel
- `DockManager.ts:132` — `openDocumentation()` existing tab
- `DockManager.ts:154` — `openDocumentation()` new tab
- `DockManager.ts:237` — `openTransformation()` existing tab
- `DockManager.ts:266` — `openTransformation()` new tab
- `Dock.tsx:273` — initial type detection on mount (setTimeout)
- `Dock.tsx:393` — `handleLayoutChange` (via `onLayoutChange` prop)
- `Dashboard.tsx:259` — GenericDashboard mount (dispatches 'summary')

**Listeners:**
- `Dock.tsx:253` — sets `body[data-editor-type]`
- `TreeViewPanelContext.tsx:186` — auto-opens tree view for modeling editors

---

## 2026-03-19 — Properties Panel & Navbar: duplicate key, visibility, persistence fixes

### Bug 1: Duplicate key warning in Navbar (DockManager.ts)
**Symptom:** `Warning: Encountered two children with the same key` in NavbarComponent when opening metamodels.
**Root Cause:** `DockManager.open()` called `dockMove()` without checking if a tab with the same ID already existed. Opening the same metamodel twice added a duplicate tab to rc-dock. The Navbar syncs tabs from rc-dock and rendered both with the same key.
**Fix:** Added a guard in `DockManager.open()` that checks `dock.find(tab.id)` before adding. If the tab exists, it activates it via `updateTab()` instead. This matches the pattern already used by `openDocumentation()` and `openTransformation()`.

### Bug 2: Properties Panel empty on first metamodel open (PropertiesWithTreeView.tsx)
**Symptom:** Opening a metamodel for the first time showed an empty Properties panel. Second open worked.
**Root Cause:** `PropertiesWithTreeView` had an early return (`return <div className="...--empty" />`) when `activeEditorType` was not `model`/`metamodel`. On first open, the `jjodel:editor-type-change` event hadn't fired yet (async), so the component rendered the empty div. By the second open, the state was already set.
**Fix:** Removed the early-return guard for non-modeling editors. The component now always renders its full content. Right panel visibility for non-modeling contexts is handled at the CSS level (see Bug 3).

### Bug 3: Properties Panel persists on dashboard + aria-hidden error (style.scss)
**Symptom:** Returning to dashboard left the Properties panel visible. Also caused `aria-hidden on element because its descendant retained focus` error.
**Root Cause:** The right panel was always present in the rc-dock layout. Visibility was only controlled by internal conditional rendering (`{isModelingEditor && ...}`), but rc-dock keeps unmounted tab content hidden with `visibility:hidden` — not removed. Focus could remain trapped in the hidden panel.
**Fix:** Added CSS rules for `body[data-editor-type="summary"]` and `body[data-editor-type="transformation"]` that collapse the right panel (width: 0, opacity: 0, pointer-events: none). Same pattern already used for `data-active-tab="documentation"` and `data-layout-mode="canvas-only"`. The `data-editor-type` attribute is already managed by Dock.tsx's `handleLayoutChange` and the Dashboard's mount effect.

### Files Modified
- `frontend/src/components/abstract/DockManager.ts` — duplicate tab guard in `open()`
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — removed empty-div early return, removed unused `activeEditorType`/`isModelingEditor`
- `frontend/src/components/abstract/style.scss` — CSS rules for summary/transformation editor types

### Build Verification
- TypeScript: no new errors in modified files (`npx tsc --noEmit`)
- Pre-existing error in DockManager.ts:237 (`openTransformation` method) unchanged

---

## 2026-03-17 — Documentation Tab UI Fixes

### Changes

**1. Fix toolbar buttons compression (DocumentationTab.scss)**
- Added `flex-shrink: 0`, `flex-wrap: nowrap`, `overflow-x: auto` to `.toolbar-right` — prevents buttons from being squeezed
- Added `white-space: nowrap`, `flex-shrink: 0` to `.toolbar-btn` — prevents label text from wrapping or overlapping icons
- Added `flex-shrink: 0` to button icons (`i` elements)
- Added `flex-shrink: 0` and `white-space: nowrap` to `.provider-selector` and `.provider-btn`

**2. Hide Properties panel when Documentation tab is active (Dock.tsx, style.scss)**
- In `Dock.tsx` `handleLayoutChange`: detect when active tab is a documentation tab (`activeId === 'documentation'` or starts with `doc_`) and set `body[data-active-tab="documentation"]`
- In `style.scss`: added CSS rule for `body[data-active-tab="documentation"]` that hides the right panel (same pattern as `canvas-only` mode)
- Properties panel is only hidden while Documentation is the active tab; switching to any other tab restores it

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — toolbar button spacing fixes
- `frontend/src/components/abstract/Dock.tsx` — active tab detection for documentation
- `frontend/src/components/abstract/style.scss` — CSS rule to hide right panel for documentation

### Build Verification
- TypeScript: no errors in modified files (`npx tsc --noEmit`)
- SCSS: compiles without errors
- Note: `npm run build` fails due to pre-existing Monaco `import.meta.url` / webpack incompatibility (unrelated)

---

## 2026-03-17 — Fix toolbar buttons still compressed (CSS specificity)

### Root Cause
The previous fix added correct properties to `.toolbar-btn` but they were overridden by a **global** `.toolbar-btn` in `EditorV2.scss` (line 225) which sets `width: 28px; height: 28px`, forcing all toolbar buttons to be 28×28px icon-only squares.

Multiple files define global `.toolbar-btn`: `EditorV2.scss`, `catalog.scss`, `console-tab.scss`, `bottomToolbar.scss`, `logger.scss`. CSS load order made one of these win over the DocumentationTab definition.

### Fix
Scoped all toolbar-related selectors (`.toolbar-left`, `.toolbar-right`, `.toolbar-title`, `.toolbar-btn` and variants) **under `.documentation-toolbar`** parent selector. This gives them higher specificity (`.documentation-toolbar .toolbar-btn` beats global `.toolbar-btn`).

Also added explicit `width: auto; height: auto` to reset the 28×28px constraint from EditorV2.

Dark mode overrides for `.toolbar-btn` also scoped under `.documentation-toolbar`.

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — nested toolbar selectors under `.documentation-toolbar`
