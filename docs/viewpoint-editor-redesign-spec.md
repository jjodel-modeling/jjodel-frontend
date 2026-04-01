# Viewpoint Editor — Redesign Specification

## 1. Overview

This document specifies the complete redesign of the Viewpoint Editor in Jjodel. The current implementation suffers from typographic inconsistency with the rest of the application, excessive vertical stacking of editor sections, no progressive disclosure, and a disconnected editing experience (dedicated canvas preview that is often empty).

The new design adopts a **"DevTools" paradigm**: the viewpoint editor becomes a sidebar panel that opens alongside the live model editor. The user edits the notation definition on the right while seeing its effects on real model instances on the left.

### Goals
- Align typography and visual language with the project dashboard design system
- Reduce cognitive load through progressive disclosure (Basic/Expert)
- Eliminate the dedicated canvas preview in favor of live model editing
- Organize content by frequency of use instead of flat tabs
- Maintain full editing power for expert users

### Non-goals (out of scope for this iteration)
- Permissions tab
- Components tab (JSDL library)
- Console drawer implementation (reuse existing pattern)


## 2. Architecture — The DevTools Paradigm

### Before (current)
```
┌──────────────────────────────────────────────────────────────┐
│ Dedicated viewpoint editor page                              │
│ ┌──────┬──────────────────────────────┬────────────────────┐ │
│ │ View │  Canvas preview (often empty) │  Properties        │ │
│ │ Tree │  ─────────────────────────── │  (GENERAL,          │ │
│ │      │  PREDICATE editor            │   BEHAVIOR)         │ │
│ │      │  TEMPLATE editor             │                     │ │
│ │      │  CONSTANTS                   │                     │ │
│ │      │  OBSERVED PROPERTIES         │                     │ │
│ │      │  STYLE editor                │                     │ │
│ └──────┴──────────────────────────────┴────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### After (new)
```
┌──────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────┬─────────────────────┐ │
│ │                                    │ ← Concrete › Model  │ │
│ │  Model editor (fully interactive)  │ › View for State    │ │
│ │                                    │ [Basic] [Expert]    │ │
│ │  Flow editor (Default/Validation)  │─────────────────────│ │
│ │  — or —                            │ Template|Style|Pred │ │
│ │  Classic editor (custom VP)        │─────────────────────│ │
│ │                                    │ ┌─────────────────┐ │ │
│ │  Live preview of notation changes  │ │ Monaco editor    │ │ │
│ │                                    │ │ (JSX/CSS/OCL)    │ │ │
│ │                                    │ │            [⤢]   │ │ │
│ │                                    │ └─────────────────┘ │ │
│ │                                    │ Properties (compact)│ │
│ │                                    │ Configuration   [▸] │ │
│ │                                    │ Behavior        [▸] │ │
│ │                                    │ Constants       [▸] │ │
│ │                                    │ Observed props  [▸] │ │
│ │                                    │ Events          [▸] │ │
│ └────────────────────────────────────┴─────────────────────┘ │
│ [Bottom drawer: Console / Element properties]                │
└──────────────────────────────────────────────────────────────┘
```


## 3. Entry Points and Navigation Flow

### Entry: Dashboard → Viewpoint

**Trigger**: User clicks on a viewpoint card in the project dashboard (e.g., "Concrete", "State Machine Syntax", "Default Validation").

**Behavior**:
1. The right sidebar switches from normal mode (Tree View + Properties) to **viewpoint editor mode**
2. The left canvas loads a model:
   - If models exist → load the first available model conforming to the metamodel
   - If no models exist → show the project dashboard with essential info; user chooses what to open
3. The canvas editor type depends on the viewpoint:
   - **Default** or **Default Validation** → **Flow editor** (abstract syntax)
   - **Any other viewpoint** → **Classic editor** (concrete syntax with the viewpoint applied)

### Exit: Back to normal editor

**Trigger**: User clicks `← model_1` back button in the canvas toolbar area.

**Behavior**:
1. The right sidebar switches back to **normal mode** (Tree View + Properties)
2. The viewpoint **remains active** on the canvas — the model continues to render with the concrete syntax
3. The user can continue editing the model in the standard way

### Model selection

When in viewpoint editor mode, the user can switch which model is displayed on the canvas via a dropdown/selector in the toolbar area (similar to the existing "Preview" selector). This allows testing the notation against different model instances.


## 4. Left Panel — Canvas/Editor

The left panel is a **fully functional model editor**. It is NOT a preview — the user can add instances, edit values, drag elements, create references, etc.

### Key behaviors:
- All standard editor toolbar controls remain available (zoom, pan, grid, etc.)
- The editor type (Flow vs Classic) is determined by the viewpoint being edited (see §3)
- Changes to the viewpoint (template, style, predicate) on the right panel reflect **live** on the canvas
- A toolbar indicator shows the active viewpoint name (e.g., badge `[Concrete]`) and the back button

### When no model is available:
- Show project dashboard summary with:
  - Metamodel list
  - Model list (empty, with "+ New model" CTA)
  - Quick info about the viewpoint being edited
- This serves as a landing page before the user creates or selects a model


## 5. Right Panel — Viewpoint Editor

The right panel replaces both the Tree View and the Properties panel when in viewpoint editor mode. It has **two states**: viewpoint root (no view selected) and single view (editing a specific view).

### 5.1 State: Viewpoint Root

Shown when the user first enters the viewpoint editor, or clicks the back arrow in the breadcrumb to return to the root.

**Content (top to bottom)**:

1. **Header**: Viewpoint name + type badge (Syntax/Validation) + action buttons (+ New view, ⋮ menu)

2. **Tabs**: **Views** | **Style**
   - **Views tab** (default): shows the view tree (see below)
   - **Style tab**: viewpoint-level CSS Variables + CSS/LESS editor (shared across all views in this viewpoint). Same layout as the Style tab in single view editing (§7.2), but scoped to the viewpoint level.

3. **View tree** (inside Views tab): Hierarchical list of all views in the viewpoint
   - Shows viewpoints with VP badge, views with V badge, organized by parent hierarchy
   - Each view row shows: type badge, name, priority, OCL/JS/EX feature badges
   - Click on a view → enters single view editing state
   - Expand/collapse for nested views
   - The currently active viewpoint is highlighted

4. **Viewpoint properties** (below the tree/tabs):
   - Name (text input)
   - Type selector (Syntax / Validation toggle)
   - Is Exclusive (toggle)

5. **Empty state message**: "Select a view to edit its notation" — when no view is selected

### 5.2 State: Single View Selected

Shown when the user clicks on a view in the tree, or when auto-navigated by selecting an element on the canvas.

**Layout (top to bottom)**:

1. **Breadcrumb bar** (fixed, ~36px):
   - `← Concrete › Model › View for State`
   - Clicking `← Concrete` returns to viewpoint root
   - Basic/Expert toggle on the right side

2. **Editor tabs** (fixed, ~36px):
   - **Template** | **Style** | **Predicate**
   - One tab active at a time — the editor below changes accordingly
   - Template is the default/first tab
   - All three tabs visible in BOTH Basic and Expert modes

3. **Editor area** (flex: 1, takes maximum available vertical space):
   - Monaco editor instance for the active tab
   - Editor toolbar above Monaco: language badge (JSX/CSS/OCL), label, refresh button, **fullscreen button (⤢)**
   - The editor area expands/contracts with the panel — no fixed height

4. **Properties & sections** (below editor, scrollable):
   - See §6 for detailed breakdown by Basic/Expert mode


## 6. Progressive Disclosure — Basic vs Expert

### Basic mode (Layer 1 + Layer 2)

**Always visible:**
- Name (text input) + Priority (number input) — compact, one row
- Editor tabs: Template, Style, Predicate (all three always visible)

**Configuration section** (collapsible, expanded by default):
- Exclusive (toggle)
- Preferred appearance (dropdown)
- Appliable to (metaclass selector)
- Parent view (dropdown)

### Expert mode (adds Layer 3 + Layer 4)

**Additional collapsible sections:**

- **Behavior / Vertex** (collapsed by default, summary line when collapsed):
  - Draggable (toggle)
  - Resizable (toggle)
  - Adapt Width (toggle)
  - Adapt Height (toggle)
  - Store Size in View (toggle)
  - Lazy Update (toggle)
  - Collapsed summary: "Draggable ✓  Resizable ✓  Adapt height ✓"

- **Edge** (collapsed by default):
  - BendingMode (dropdown: Bezier_quadratic, Manhattan, etc.)
  - EdgeGapMode (dropdown)
  - EdgeStartOffset x/y (number inputs)
  - EdgeEndOffset x/y (number inputs)
  - EdgeStartOffset_isPercentage (checkbox)
  - EdgeEndOffset_isPercentage (checkbox)
  - EdgeStartStopAtBoundaries (checkbox)
  - EdgeEndStopAtBoundaries (checkbox)
  - EdgeHeadSize x/y (number inputs)
  - EdgeTailSize x/y (number inputs)

- **EdgePoint** (collapsed by default):
  - EdgePointCoordMode (dropdown)

- **Field** (collapsed by default):
  - Appliable to (dropdown: Any, etc.)

- **Constants** (collapsed by default):
  - Count badge showing number of constants
  - Expandable list of key-value pairs
  - + Add button, delete button per entry

- **Observed properties** (collapsed by default):
  - Count badge showing number of observed properties
  - Expandable list with property definitions
  - + Add button, settings icon per entry

- **Events** (collapsed by default):
  - Default Events list (7 items): onDataUpdate, onDragStart, whileDragging, onDragEnd, onResizeStart, whileResizing, onResizeEnd
  - Each expandable to show/edit the event handler code
  - Custom Events section with + Add button


## 7. Editor Tabs — Detailed Specification

### 7.1 Template tab

- **Language**: JSX
- **Monaco language mode**: javascript/jsx
- **Editor toolbar**: `[JSX badge] template [↻ refresh] [⤢ fullscreen]`
- **Content below editor**: none in Basic mode; Constants + Observed Properties sections in Expert mode (these are semantically tied to the template)

### 7.2 Style tab

The Style tab has a **split layout** within the same tab:

**Upper section — CSS Variables:**
- Key-value list with color pickers
- Each row: [color swatch] [variable name input] [color dot(s)] [+ add color stop] [🗑 delete]
- `+ Add new` button at the bottom
- The icon ⚙ indicates the variable has configuration

**Lower section — Local CSS & LESS Editor:**
- Monaco editor instance with CSS/LESS language mode
- Editor toolbar: `[CSS badge] local styles [⤢ fullscreen]`
- The fullscreen button opens ONLY the CSS editor in the modal, not the variables section

### 7.3 Predicate tab (Expert mode only)

- **Language toggle**: OCL | JS | JjEL (three sub-tabs or segmented control)
- **Monaco language mode**: changes based on selected language
- **Editor toolbar**: `[OCL/JS/JjEL badge] predicate [⤢ fullscreen]`
- The predicate defines which model elements this view applies to
- Example OCL: `context DObject inv: self.instanceof.name = 'State'`


## 8. Fullscreen Modal

Triggered by the **⤢ button** on any Monaco editor instance.

### Design
- **Overlay**: semi-transparent dark background (rgba(0,0,0,0.45))
- **Modal card**: centered, max-width ~860px, rounded corners (12px), white background
- **Same visual style as the Settings modal** (see reference screenshot)

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [JSX badge]  Template — View for State   Concrete›Model    [↻] [✕] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Monaco editor (full height, ~500px)                 │
│  with syntax highlighting, line numbers,             │
│  minimap (optional), word wrap (optional)             │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Ln 6, Col 24  ·  UTF-8  ·  JSX          Minimap  Word wrap │
└──────────────────────────────────────────────────────┘
```

### Header
- Language badge (JSX/CSS/OCL with appropriate color)
- Editor type + view name: "Template — View for State"
- Breadcrumb context: "Concrete › Model" (lighter text)
- Refresh button (↻)
- Close button (✕)

### Footer
- Cursor position: "Ln 6, Col 24"
- Encoding: "UTF-8"
- Language mode: "JSX"
- Toggle options: Minimap, Word wrap

### Behavior
- Opens with the same content as the inline editor
- Changes sync bidirectionally — editing in fullscreen updates the inline editor and vice versa
- Close with ✕ button, Escape key, or clicking outside the modal
- Monaco instance is a fresh mount (not the same DOM element moved), synced via shared state


## 9. Interactions

### 9.1 Selecting an element on the canvas

When the user clicks/selects an element on the canvas (left side):

1. **Auto-navigate**: The viewpoint editor (right side) automatically navigates to the **view that renders the selected element**. For example, clicking a State instance navigates to "View for State", showing its Template/Style/Predicate.

2. **Visual feedback**: The selected element on the canvas gets the standard selection highlight. The corresponding view in the breadcrumb updates.

3. **Element data properties**: If the user needs to inspect/edit the element's data (name, attribute values, etc.), they can:
   - Double-click the element, or
   - Use context menu → "Properties"
   - This opens the **bottom drawer** with the element's properties panel
   - The bottom drawer uses the same mechanism as the Console drawer
   - It's temporary and dismissible (click elsewhere, Escape, or close button)

### 9.2 Navigating between views

- **From root**: Click on a view in the tree → enters single view editing
- **From single view**: Click `← Concrete` in breadcrumb → returns to root
- **Between views**: Click on a different element on the canvas → auto-navigates to the corresponding view (no need to go back to root first)
- **Breadcrumb path**: Shows the full hierarchy (Viewpoint › Parent view › Current view), each segment is clickable

### 9.3 Back button — exiting viewpoint editor mode

- **Location**: Canvas toolbar area (not inside the right panel)
- **Label**: `← model_1` (or whatever model name is currently displayed)
- **Behavior**: Switches the right panel back to normal mode (Tree View + Properties). The viewpoint remains active on the canvas.

### 9.4 Model selection

- When in viewpoint editor mode, a dropdown in the toolbar area allows selecting which model to display
- This is equivalent to the existing "Preview: model_1" selector
- Selecting a different model re-renders the canvas with that model using the active viewpoint


## 10. Typography and Design System Alignment

The viewpoint editor MUST follow the design system established in the project dashboard (Image 2 reference).

### Font sizes
- Section headers (CONFIGURATION, BEHAVIOR, etc.): 11px, uppercase, letter-spacing 0.5px, color: text-tertiary — same as dashboard section headers (STRUCTURE, TRANSFORMATION, PERSPECTIVES)
- Form labels: 10-11px, color: text-tertiary
- Form values / inputs: 12-13px, color: text-primary
- Tab labels: 12px, weight 500 when active
- Breadcrumb text: 12px
- Badge text: 10px
- Toggle labels: 11px, color: text-secondary
- Monaco editor: 11.5-12px (font-mono)
- Collapsible section titles: 11px, weight 500, color: text-secondary
- Count badges / summary text: 10px, color: text-tertiary

### Spacing
- 8px base grid
- Section padding: 10-12px horizontal, 8-10px vertical
- Gap between form fields: 6-8px
- Gap between collapsible sections: 0 (separated by 0.5px border)

### Colors
- Borders: 0.5px solid, using border-tertiary (default) or border-secondary (hover/emphasis)
- Active tab indicator: 2px solid #0ea5e9 (cyan accent)
- Toggle on state: #0ea5e9 background
- Toggle off state: background-secondary with border-secondary
- Editor toolbar background: background-secondary
- Badge colors:
  - JSX: background #fef3c7, text #92400e (amber)
  - CSS: background #ede9fe, text #5b21b6 (purple)
  - OCL: background #fee2e2, text #991b1b (red)
  - JS: background #dbeafe, text #1e40af (blue)
  - VP badge: background #f0fdf4, text #166534 (green)
  - V badge: background #ede9fe, text #5b21b6 (purple)
  - Syntax badge: background #dbeafe, text #1e40af (blue)
  - Validation badge: background #fef3c7, text #92400e (amber)

### Component patterns
- Inputs: height 26-28px, border-radius 5px, font-size 12px
- Dropdowns/selects: height 24px, font-size 11px
- Toggles: 30-32px wide, 16-18px tall
- Collapsible sections: click on header row toggles, chevron indicator (▸ collapsed, ▾ expanded)
- Cards/panels: border-radius var(--border-radius-lg), 0.5px border


## 11. Information Architecture — Content Mapping

### Old → New mapping

| Old location | New location |
|---|---|
| Tab "Viewpoints" (tree) | Right panel: viewpoint root state (full tree) |
| Tab "Apply to" (viewpoint root) | Viewpoint root: properties section (Name, Exclusive) |
| Tab "Style" (viewpoint root) | Viewpoint root: Style tab (CSS Variables + CSS editor) |
| Tab "Apply to" (single view) | Properties section + Configuration section + Predicate tab |
| Tab "Template" | Template tab (editor) + Constants/Observed props (Expert sections) |
| Tab "Style" (single view) | Style tab (CSS Variables + CSS editor) |
| Tab "Events" | Events section (Expert mode, collapsible) |
| Tab "Options" | Behavior + Edge + EdgePoint + Field sections (Expert, collapsible) |
| Tab "Permissions" | Deferred (not in scope) |
| Tab "Components" | Deferred (not in scope) |

### Layer system

| Layer | Visibility | Content |
|---|---|---|
| Layer 1 — Core editing | Always | Template tab, Style tab, Predicate tab, Name, Priority |
| Layer 2 — Configuration | Basic mode | Exclusive, Parent view, Appearance, Appliable to |
| Layer 3 — Behavior & rendering | Expert mode | Behavior/Vertex, Edge, EdgePoint, Field, Constants, Observed properties |
| Layer 4 — Events | Expert mode | Default events (7), Custom events |


## 12. Edge Cases and Special States

### No model available
- Left canvas shows project dashboard summary
- Right panel viewpoint editor works normally (tree, view editing)
- User can create a new model from the dashboard view
- Once a model is created/selected, the canvas switches to the model editor

### Empty viewpoint (no views defined)
- Show empty state in the tree area: icon + "No views defined yet" + CTA "Create your first view"
- The empty state follows the same pattern as the Transformations empty state on the dashboard

### View with no template/style/predicate
- Monaco editor shows empty with placeholder comment (e.g., `/* Jjodel Default View */`)
- No error state — empty editors are valid

### Switching between Basic and Expert mode
- The toggle is in the breadcrumb bar
- Switching should NOT cause layout shift in the editor area
- Expert-only sections appear/disappear BELOW the editor, in the scrollable properties area
- The tab bar (Template, Style, Predicate) remains unchanged between modes

### Multiple views rendering the same element
- When an element on the canvas is rendered by a sub-view (e.g., "View for InitialState" which is a child of "View for State"), the auto-navigation should go to the **most specific view** (InitialState, not State)

### Resize behavior
- The right panel width should be resizable (drag handle on the left edge)
- Minimum width: ~300px (below this, content becomes too cramped)
- Maximum width: ~50% of viewport
- The Monaco editor adapts to the panel width automatically


## 13. Implementation Notes

### Relationship to existing code
- The viewpoint editor panel is a NEW mode for the existing right sidebar
- It does NOT replace the existing Properties panel — it's an alternative state
- The sidebar component needs a "mode" concept: "normal" (Tree View + Properties) vs "viewpoint-editor"
- The Canvas/editor component on the left remains unchanged — it already supports both Flow and Classic editors

### Monaco editor instances
- Each tab (Template, Style, Predicate) should have its own Monaco instance
- The Style tab has TWO Monaco instances: one for CSS Variables (may be a custom editor, not Monaco) and one for the CSS/LESS code
- Fullscreen modal creates a NEW Monaco instance synced via shared state (not DOM re-parenting)
- All Monaco instances should use the existing MonacoEditor wrapper/helper already in the codebase

### State management
- The viewpoint editor state (selected view, active tab, Basic/Expert mode) should be managed via React state in the panel component
- The "auto-navigate on canvas selection" requires an event/callback from the canvas to the panel
- Use existing custom DOM events pattern for canvas → panel communication

### CSS/SCSS considerations
- All new styles must use the design system variables and follow the naming conventions in the codebase
- Verify class name uniqueness with global grep before creating new classes
- The fullscreen modal should use the same overlay/modal pattern as the Settings modal

### Files likely to be modified/created
- New: `ViewpointEditorPanel.tsx` (main panel component)
- New: `ViewpointEditorRoot.tsx` (root state with tree)
- New: `ViewpointEditorView.tsx` (single view state with tabs)
- New: `EditorFullscreenModal.tsx` (reusable fullscreen modal)
- New: `viewpoint-editor-panel.scss` (all styles)
- Modified: Right sidebar container (add mode switching logic)
- Modified: Canvas component (add auto-navigate callback)
- Modified: Canvas toolbar (add back button and viewpoint indicator)

### Phased implementation suggestion
- **Phase 1**: Panel shell + breadcrumb + tab bar + mode switching in sidebar
- **Phase 2**: Template tab with Monaco editor + fullscreen modal
- **Phase 3**: Style tab (CSS Variables + CSS editor)
- **Phase 4**: Predicate tab + Basic/Expert toggle
- **Phase 5**: Properties and configuration sections
- **Phase 6**: Expert sections (Behavior, Edge, Constants, Observed props, Events)
- **Phase 7**: Canvas integration (auto-navigate, back button, model selector)
- **Phase 8**: Bottom drawer for element properties
