# Claude Code Session Log

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
