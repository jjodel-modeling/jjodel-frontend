# Claude Code Session Log

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
