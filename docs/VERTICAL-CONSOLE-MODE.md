# Vertical Console Mode - Implementation Guide

## Overview

A new layout mode has been implemented that allows you to have the **Canvas at the top** and the **Console at the bottom**, with a **resizable handle** between them.

## Features

✅ **Vertical Layout**: Canvas (top) + Console (bottom)
✅ **Smooth Resizing**: Drag the handle to adjust Console height
✅ **Persistent Height**: Console height is saved to localStorage
✅ **Min/Max Constraints**: Console height between 200px and 600px
✅ **Visual Feedback**: Handle indicator changes color during drag

---

## How to Activate

### Method 1: Browser Console (For Testing)

1. Open your browser's Developer Console (`F12` or `Cmd+Option+I`)
2. Run this command:
   ```javascript
   window.setVerticalConsoleMode()
   ```
3. Refresh the page (`F5` or `Cmd+R`)

### Method 2: Switch Back to Horizontal Split

To return to the standard horizontal layout:

```javascript
window.setSplitMode()
```

---

## Implementation Details

### File Modified

- **`frontend/src/components/abstract/Dock.tsx`**
  - Added `'vertical-console'` to `LayoutMode` type
  - Added state management for console height
  - Implemented conditional vertical layout rendering
  - Added SimpleResizeHandle integration
  - Added localStorage persistence

### New Layout Structure

When in `vertical-console` mode:

```
┌─────────────────────────────────────────┐
│                                         │
│           CANVAS / MODELS               │
│         (ModelsSummaryTab)              │
│                                         │
│              (dynamic height)           │
│                                         │
├═════════════════════════════════════════┤  ← Resize Handle
│                                         │
│              CONSOLE                    │
│                                         │
│         (200px - 600px height)          │
│                                         │
└─────────────────────────────────────────┘
```

### Resize Handle Behavior

- **Visual**: Gray indicator (40px wide, 4px tall)
- **Hover**: Cursor changes to `ns-resize`
- **Drag**: Indicator turns blue, console resizes in real-time
- **Release**: Height is saved to localStorage (`jjodel_vertical_console_height`)

---

## Future Integration

### Adding to Navbar

To make this mode accessible from the UI, add a toggle button in the Navbar component:

**File**: `frontend/src/pages/components/Navbar.tsx`

```tsx
// Add layout mode button
<button
  onClick={() => {
    window.dispatchEvent(new CustomEvent('jjodel:layout-mode-change', {
      detail: { mode: 'vertical-console' }
    }));
  }}
  title="Vertical Console Layout"
>
  <i className="bi bi-layout-split" />
</button>
```

### Layout Mode Options

The layout system now supports 4 modes:

| Mode | Canvas | Properties Panel | Console |
|------|--------|------------------|---------|
| `split` | Left 50% | Right 50% (tabs) | Tab in right panel |
| `sidebar` | Left 70% | Right 30% (tabs) | Tab in right panel |
| `canvas-only` | Full width | Hidden | Hidden |
| `vertical-console` | Top dynamic | Hidden | Bottom resizable |

---

## Testing Checklist

- [x] Console appears at the bottom
- [x] Canvas appears at the top
- [x] Resize handle is visible between them
- [x] Handle shows gray indicator
- [x] Dragging handle resizes console smoothly
- [x] Console height is clamped between 200-600px
- [x] Console height persists on page reload
- [x] No TypeScript errors
- [x] No console errors in browser

---

## Troubleshooting

### Handle not visible
- Check browser console for errors
- Verify `SimpleResizeHandle` component is imported
- Ensure you're in `vertical-console` mode

### Console not resizing
- Check that `consoleHeight` state is updating
- Verify localStorage key `jjodel_vertical_console_height` is being set
- Try clearing localStorage and refreshing

### Canvas not showing
- Verify `ModelsSummaryTab` component is rendering correctly
- Check Redux state and ensure project is loaded

---

## Code References

### Key Functions

- **`activateVerticalConsoleMode()`**: Programmatically activate vertical mode
- **`handleConsoleHeightChange(height)`**: Update console height and persist
- **`getSavedLayoutMode()`**: Get current layout mode from localStorage
- **`saveLayoutMode(mode)`**: Save layout mode to localStorage

### localStorage Keys

- `jjodel_layout_mode`: Current layout mode ('vertical-console', 'split', etc.)
- `jjodel_vertical_console_height`: Console height in pixels (200-600)

---

## Next Steps

1. **Add UI Toggle**: Add button to Navbar for easy mode switching
2. **Keyboard Shortcut**: Add `Ctrl+Shift+V` to toggle vertical console
3. **Mode Indicator**: Show current layout mode in UI
4. **Preset Heights**: Add quick height presets (small, medium, large)
5. **Advanced Settings**: Allow customizing min/max heights

---

*Last updated: 2026-01-23*
*Implementation: Vertical Console Mode with Resize Handle*
