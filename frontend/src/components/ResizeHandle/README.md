# Resizable Console Implementation

This directory contains all components needed to implement a resizable console panel with a draggable divider.

## 📦 Files Created

```
frontend/src/
├── hooks/
│   └── useResizableConsole.ts       # Custom hook for resize logic
└── components/
    └── ResizeHandle/
        ├── ResizeHandle.tsx          # Draggable handle component
        ├── resize-handle.scss        # Handle styles (light + dark mode)
        ├── ResizableLayout.example.tsx  # Example integration
        ├── resizable-layout.example.scss  # Example layout styles
        ├── index.ts                  # Barrel export
        └── README.md                 # This file
```

## 🎯 Features

- ✅ Draggable resize handle with mouse support
- ✅ Visual feedback (hover, dragging states)
- ✅ Persistent height (saved to localStorage)
- ✅ Min/max height constraints (200px - 600px)
- ✅ Double-click to reset to default (400px)
- ✅ Keyboard accessibility support
- ✅ Dark mode support
- ✅ Smooth drag interaction with cursor feedback

## 🚀 Quick Start

### Basic Usage

```tsx
import { useResizableConsole } from '../../hooks/useResizableConsole';
import { ResizeHandle } from './ResizeHandle';

function MyLayout() {
  const { consoleHeight, isDragging, handleMouseDown, resetToDefault } = useResizableConsole();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Canvas Area */}
      <div style={{ height: `calc(100vh - ${consoleHeight}px)` }}>
        <YourCanvasComponent />
      </div>

      {/* Resize Handle */}
      <ResizeHandle
        onMouseDown={handleMouseDown}
        isDragging={isDragging}
        onDoubleClick={resetToDefault}
      />

      {/* Console Area */}
      <div style={{ height: `${consoleHeight}px` }}>
        <Console />
      </div>
    </div>
  );
}
```

## 🔧 Integration Options

### Option 1: Use the Example Component

The quickest way to get started:

```tsx
import { ResizableLayout } from './components/ResizeHandle/ResizableLayout.example';
import { Canvas } from './components/editors/Canvas';
import { Console } from './components/editors/Console';

function App() {
  return (
    <ResizableLayout
      canvasContent={<Canvas />}
      consoleContent={<Console />}
    />
  );
}
```

### Option 2: Integrate into Dock.tsx

Modify the existing `Dock.tsx` to use resizable layout:

```tsx
// In Dock.tsx
import { ResizableLayout } from '../components/ResizeHandle/ResizableLayout.example';

// Replace ModelsSummary tab content with:
const workspaceTab = {
  id: id(),
  title: <TabHeader tid={tid()}>Workspace</TabHeader>,
  group: 'models',
  closable: false,
  content: (
    <TabContent tid={tid()}>
      <ResizableLayout
        canvasContent={<ModelsSummaryTab />}
        consoleContent={<Console />}
      />
    </TabContent>
  )
};

// Then use it in layout:
layout.dockbox.children.push({tabs: [workspaceTab], size: leftSize});
```

### Option 3: Create a Layout Toggle

Add a button to switch between standard and vertical split layouts:

```tsx
const [layoutMode, setLayoutMode] = useState<'standard' | 'vertical-split'>('standard');

// In your navbar or toolbar:
<button onClick={() => setLayoutMode(layoutMode === 'standard' ? 'vertical-split' : 'standard')}>
  <i className="bi bi-layout-split" />
  Toggle Layout
</button>

// In your render:
{layoutMode === 'vertical-split' ? (
  <ResizableLayout canvasContent={...} consoleContent={...} />
) : (
  <StandardDockLayout />
)}
```

## 🎨 Styling

The components follow the Jjodel design system from `CLAUDE.md`:

- Uses slate colors for accents
- Smooth transitions (150ms-250ms)
- Dark mode support via `prefers-color-scheme`
- Consistent spacing and borders

### Customization

You can customize the handle appearance by overriding SCSS variables:

```scss
.resize-handle {
  // Change handle height
  height: 12px; // default: 8px

  &__indicator {
    // Change indicator width
    width: 60px; // default: 40px

    // Change indicator height
    height: 5px; // default: 4px
  }
}
```

## ⌨️ Keyboard Support

The resize handle is keyboard accessible:

| Key | Action |
|-----|--------|
| `Tab` | Focus the handle |
| `Enter` / `Space` | Initiate drag mode |
| `Escape` | Cancel drag |

You can extend with arrow key support (see example in `ResizableLayout.example.tsx`).

## 🔒 Constraints

The hook enforces these constraints:

```typescript
MIN_CONSOLE_HEIGHT = 200px  // Minimum viable console height
MAX_CONSOLE_HEIGHT = 600px  // Maximum to avoid hiding too much canvas
DEFAULT_CONSOLE_HEIGHT = 400px  // Balanced default
```

## 💾 Persistence

Console height is automatically saved to localStorage:

```typescript
localStorage.getItem('jjodel_console_height')  // Get saved height
localStorage.setItem('jjodel_console_height', '450')  // Saved automatically
```

## 🧪 Testing

Test these scenarios:

### Mouse Interaction
- [ ] Handle visible on hover
- [ ] Cursor changes to `ns-resize`
- [ ] Drag up increases console height
- [ ] Drag down decreases console height
- [ ] Respects min height (200px)
- [ ] Respects max height (600px)
- [ ] Smooth dragging (no lag)
- [ ] Release stops dragging
- [ ] Text selection disabled while dragging
- [ ] Double-click resets to default (400px)

### Visual Feedback
- [ ] Handle indicator visible on hover
- [ ] Handle changes color when dragging
- [ ] Canvas resizes smoothly
- [ ] Console resizes smoothly
- [ ] No content jumping

### Persistence
- [ ] Height saved to localStorage
- [ ] Height restored on page load
- [ ] Double-click resets and clears saved value

### Edge Cases
- [ ] Works on window resize
- [ ] Works in fullscreen mode
- [ ] Doesn't break layout switches
- [ ] Dark mode styling correct

## 📝 API Reference

### `useResizableConsole`

Custom hook for managing console resize state.

```typescript
interface UseResizableConsoleReturn {
  consoleHeight: number;           // Current console height in pixels
  isDragging: boolean;             // Whether user is currently dragging
  handleMouseDown: () => void;     // Initiate drag operation
  setConsoleHeight: (height: number) => void;  // Programmatically set height
  resetToDefault: () => void;      // Reset to default height (400px)
}
```

### `ResizeHandle`

Visual draggable handle component.

```typescript
interface ResizeHandleProps {
  onMouseDown: () => void;       // Required: Drag initiation handler
  isDragging: boolean;           // Required: Current drag state
  onDoubleClick?: () => void;    // Optional: Double-click handler (typically resetToDefault)
  className?: string;            // Optional: Additional CSS classes
}
```

### `ResizableLayout`

Pre-built layout component with canvas and console areas.

```typescript
interface ResizableLayoutProps {
  canvasContent?: React.ReactNode;   // Optional: Content for canvas area
  consoleContent?: React.ReactNode;  // Optional: Content for console area
}
```

## 🐛 Troubleshooting

### Handle not visible
- Check if `resize-handle.scss` is imported
- Verify z-index isn't being overridden
- Ensure parent has proper height

### Dragging not working
- Verify `handleMouseDown` is passed correctly
- Check if event propagation is stopped elsewhere
- Ensure global mouse listeners are attached

### Height not persisting
- Check localStorage is enabled
- Verify no errors in console
- Check localStorage key: `jjodel_console_height`

### Layout breaking
- Ensure parent container has defined height
- Check for conflicting CSS (overflow, position)
- Verify calc() expressions are correct

## 🎯 Next Steps

1. Choose an integration option (see above)
2. Import and use the components
3. Test thoroughly (use checklist above)
4. Customize styling if needed
5. Add keyboard controls if desired

## 📚 Additional Resources

- See `ResizableLayout.example.tsx` for more usage examples
- Check `CLAUDE.md` for design system guidelines
- Refer to `Dock.tsx` for existing layout structure

---

**Questions or issues?** Check the implementation files or create an issue.
