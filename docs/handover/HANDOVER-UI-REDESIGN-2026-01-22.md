# JJODEL UI REDESIGN - COMPLETE HANDOVER DOCUMENT

**Date:** January 22, 2026
**Project:** Jjodel Redux - Frontend UI/UX Improvements
**Repository:** `/Users/alfonso/Jjodel Redux`
**Branch:** `alfonso-frontend-dev`

---

## EXECUTIVE SUMMARY

This document details all UI/UX improvements made to the Jjodel frontend application. The changes focus on:

### Phase 1 (January 21, 2026)
1. **Toast Notification System** - Non-blocking notifications
2. **Empty States Redesign** - Simplified, user-friendly empty states
3. **Export Metamodel Feature** - New .jmm file export functionality
4. **Project Loading Screen** - Modern loading screen with spinner
5. **Error Modal Redesign** - User-friendly error display with collapsible technical details
6. **Font Consistency Fixes** - Ensured consistent sans-serif typography

### Phase 2 (January 22, 2026)
7. **ADV Badge Redesign** - Advanced mode indicator with tooltip
8. **DEBUG Badge** - Independent debug mode indicator
9. **Viewpoint Toggle Switch** - Modern toggle replacing checkbox
10. **Colored Icons in Viewpoints Panel** - Type-specific colored backgrounds
11. **Resolution-based Layout System** - Dynamic panel width based on screen size
12. **Layout Controls** - Split/Sidebar view toggle buttons

### Phase 3 (January 22, 2026 - Evening)
13. **Features Palette Sidebar** - New permanent drag & drop sidebar for adding elements
14. **FeaturesModal Removal** - Removed unused floating modal component
15. **ToolBar Simplification** - Commented out redundant toolbar content
16. **Layout Controls Fix** - Fixed to not close open tabs when switching modes

### Phase 4 (January 22, 2026 - Night)
17. **Navbar Menu Icons Uniformization** - All icons now Bootstrap Icons outline style
18. **Adaptive Keyboard Shortcuts** - Shortcuts adapt to OS (⌘ on Mac, Ctrl on Windows)
19. **Menu Styling Consistency** - Uniform hover states, spacing, and shortcut styling

### Phase 5 (January 22, 2026 - Late Night)
20. **Global Keyboard Handler** - Prevents browser from intercepting shortcuts (CMD+S, etc.)
21. **Keyboard Shortcut Pills** - Individual pill buttons for each key (⌘ and S separately)

### Phase 6 (January 22, 2026 - Late Night)
22. **Context-Aware Keyboard Shortcuts** - Shortcuts adapt behavior based on current context (Dashboard, Project, Metamodel, Profile)
23. **Sign-out Menu Item** - Added Sign-out with CMD+Q to Jjodel menu with divider

### Phase 7 (January 22, 2026 - Late Night)
24. **Advanced Mode Tutorial Modal** - First-time tutorial explaining Advanced Mode features
25. **Zoom Controls with Keyboard Shortcuts** - CMD++/-, CMD+0 for zoom in/out/reset
26. **M2 Analytics Modal** - Centered modal with EMF classification gauge and metrics table

### Phase 8 (January 22, 2026 - Night)
27. **Adaptive Tree View Sidebar** - Resolution-adaptive sidebar for metamodel hierarchy navigation with keyboard shortcut (⌘B)

All changes follow the design system defined in `/CLAUDE.md`.

---

## TABLE OF CONTENTS

1. [Design System Reference](#1-design-system-reference)
2. [Toast Notification System](#2-toast-notification-system)
3. [Empty States Redesign](#3-empty-states-redesign)
4. [Export Metamodel Feature](#4-export-metamodel-feature)
5. [Project Loading Screen](#5-project-loading-screen)
6. [Error Modal Redesign](#6-error-modal-redesign)
7. [Font Consistency Fixes](#7-font-consistency-fixes)
8. [ADV Badge Redesign](#8-adv-badge-redesign)
9. [DEBUG Badge](#9-debug-badge)
10. [Viewpoint Toggle Switch](#10-viewpoint-toggle-switch)
11. [Colored Icons in Viewpoints Panel](#11-colored-icons-in-viewpoints-panel)
12. [Resolution-based Layout System](#12-resolution-based-layout-system)
13. [Layout Controls](#13-layout-controls)
14. [Features Palette Sidebar](#14-features-palette-sidebar)
15. [FeaturesModal Removal](#15-featuresmodal-removal)
16. [ToolBar Simplification](#16-toolbar-simplification)
17. [Layout Controls Fix](#17-layout-controls-fix)
18. [Navbar Menu Icons Uniformization](#18-navbar-menu-icons-uniformization)
19. [Adaptive Keyboard Shortcuts](#19-adaptive-keyboard-shortcuts)
20. [Menu Styling Consistency](#20-menu-styling-consistency)
21. [Global Keyboard Handler](#21-global-keyboard-handler)
22. [Keyboard Shortcut Pills](#22-keyboard-shortcut-pills)
23. [Context-Aware Keyboard Shortcuts](#23-context-aware-keyboard-shortcuts)
24. [Sign-out Menu Item](#24-sign-out-menu-item)
25. [Advanced Mode Tutorial Modal](#25-advanced-mode-tutorial-modal)
26. [Zoom Controls with Keyboard Shortcuts](#26-zoom-controls-with-keyboard-shortcuts)
27. [M2 Analytics Modal](#27-m2-analytics-modal)
28. [Adaptive Tree View Sidebar](#28-adaptive-tree-view-sidebar)
29. [File Inventory](#29-file-inventory)
30. [Technical Notes](#30-technical-notes)
31. [Testing Checklist](#31-testing-checklist)

---

## 1. DESIGN SYSTEM REFERENCE

All UI changes follow the design tokens from `/CLAUDE.md`:

### Colors
```scss
// Primary/Accent (Slate)
$color-accent: #475569;
$color-accent-hover: #334155;

// Semantic
$color-success: #10b981;
$color-warning: #f59e0b;
$color-error: #ef4444;
$color-info: #6B7280;

// Text
$color-text-primary: #111418;
$color-text-secondary: #6B7280;

// Backgrounds
$color-bg-primary: #ffffff;
$color-bg-secondary: #f8fafc;
```

### Typography
```scss
$font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
$font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

### Icons
- **ONLY Bootstrap Icons** (`bi-*` classes)
- No emoji, no Font Awesome, no custom SVG icons

---

## 2. TOAST NOTIFICATION SYSTEM

### Purpose
Replace blocking modal alerts with non-blocking toast notifications that auto-dismiss.

### File Modified
`frontend/src/components/alert/style.scss`

### Implementation Details

Added new CSS classes for toast notifications:

```scss
.toast-alert-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.toast-alert {
  // Card styling with shadow
  // Slide-in animation from right
  // Color-coded left border based on type
}
```

### Variants
| Class | Color | Use Case |
|-------|-------|----------|
| `.toast-alert--success` | Green (#10B981) | Success messages |
| `.toast-alert--error` | Red (#EF4444) | Error messages |
| `.toast-alert--warning` | Orange (#F59E0B) | Warnings |
| `.toast-alert--info` | Gray (#6B7280) | Info messages |

### Features
- Auto-dismiss with progress bar animation
- Click to dismiss
- Slide-in/out animations
- Dark mode support
- Hover effect on card

### CSS Structure
```
.toast-alert-container
└── .toast-alert (.toast-alert--{type})
    ├── .toast-alert__icon
    ├── .toast-alert__content
    │   ├── .toast-alert__title
    │   └── .toast-alert__message
    ├── .toast-alert__close
    └── .toast-alert__progress
```

---

## 3. EMPTY STATES REDESIGN

### Purpose
Simplify empty states in the Project Editor to be less overwhelming and more consistent with the app's design language.

### Files Modified
- `frontend/src/components/project/ProjectEditor.tsx`
- `frontend/src/components/project/project-editor.scss`

### Design Decision
The previous implementation had complex action cards with multiple options. User feedback indicated this was:
- Too complex and scattered
- Looked like documentation, not product UI
- Font appeared monospace (wrong)
- Too much vertical space

### New Implementation

#### Metamodels Section (Primary)
- White container with subtle shadow
- Centered icon in circle
- Simple title and description
- Single CTA button: "Create Your First Metamodel"

```tsx
<div className="empty-state">
  <div className="empty-state__icon">
    <i className="bi bi-diagram-3" />
  </div>
  <h3 className="empty-state__title">No metamodels yet</h3>
  <p className="empty-state__description">
    Create a metamodel to define the structure and rules for your domain models.
  </p>
  <button className="btn btn--primary btn--empty-state" onClick={handleCreateMetamodel}>
    Create Your First Metamodel
  </button>
</div>
```

#### Models Section (Secondary)
- Transparent background with dashed border
- Smaller icon
- Conditional text based on metamodel existence
- Blue hint box pointing to Metamodels section

```tsx
<div className="empty-state empty-state--secondary">
  <div className="empty-state__icon empty-state__icon--small">
    <i className="bi bi-box" />
  </div>
  <h3 className="empty-state__title">
    {metamodels.length === 0 ? 'Create a metamodel first' : 'No models yet'}
  </h3>
  <p className="empty-state__description">...</p>
  {metamodels.length === 0 && (
    <div className="empty-state__hint">
      <i className="bi bi-arrow-up" />
      <span>Create your first metamodel in the section above</span>
    </div>
  )}
</div>
```

#### Viewpoints Section (Subtle)
- Minimal inline style
- Just text, no card

```tsx
<div className="empty-state empty-state--subtle">
  <p className="empty-state__text-inline">No viewpoints defined</p>
</div>
```

### CSS Classes

| Class | Background | Border | Use |
|-------|------------|--------|-----|
| `.empty-state` | White + shadow | None | Metamodels |
| `.empty-state--secondary` | Transparent | 2px dashed | Models |
| `.empty-state--subtle` | Transparent | None | Viewpoints |

### Dark Mode
All variants have dark mode styles:
- `.empty-state` → `background: #1e293b`
- `.empty-state--secondary` → `border-color: #475569`
- Text colors adjusted for dark backgrounds

---

## 4. EXPORT METAMODEL FEATURE

### Purpose
Allow users to export metamodels as standalone `.jmm` files for sharing or backup.

### File Modified
`frontend/src/pages/components/LeftBar.tsx`

### Implementation

#### New Function: `exportMetamodel()`

```typescript
const exportMetamodel = async() => {
    // Validate project exists
    if (!project) {
        U.alert('e', 'Error', 'No project open');
        return;
    }

    // Validate metamodel exists
    const metamodels = project.metamodels || [];
    if (metamodels.length === 0) {
        U.alert('w', 'No Metamodel', 'This project does not contain any metamodels to export.');
        return;
    }

    try {
        const metamodel = metamodels[0];

        // Build .jmm file structure
        const jmmData = {
            format_version: '1.0',
            metadata: {
                name: metamodel.name || project.name + '-metamodel',
                version: project.version?.toString() || '1.0.0',
                author: project.author?.name || 'Unknown',
                description: project.description || '',
                exported_at: new Date().toISOString(),
                source_project: project.id,
                jjodel_version: '2.0'
            },
            metamodel: metamodel.__raw || metamodel
        };

        const jsonString = JSON.stringify(jmmData, null, 2);
        const filename = `${metamodel.name || project.name}-metamodel.jmm`;

        U.download(filename, jsonString);
        U.alert('i', 'Exported', `Metamodel exported: ${filename}`);

    } catch (error) {
        console.error('Export metamodel error:', error);
        U.alert('e', 'Export Failed', 'Error exporting metamodel. Please try again.');
    }
}
```

#### Menu Item Added

```tsx
<Menu title={props.project.name ? props.project.name : 'Unnamed Project'} project>
    <Item action={exportProject} icon={icon['download']}>Download</Item>
    <Item action={exportMetamodel} icon={<i className="bi bi-box-arrow-up" />}>Export Metamodel</Item>
    <Item action={toggleFavorite} icon={...}>...</Item>
    <Item action={closeProject} icon={icon['close']}>Close project</Item>
</Menu>
```

### .jmm File Format

```json
{
  "format_version": "1.0",
  "metadata": {
    "name": "MyMetamodel",
    "version": "1.0.0",
    "author": "User Name",
    "description": "Project description",
    "exported_at": "2026-01-21T10:30:00.000Z",
    "source_project": "project-uuid",
    "jjodel_version": "2.0"
  },
  "metamodel": {
    // Raw metamodel data
  }
}
```

---

## 5. PROJECT LOADING SCREEN

### Purpose
Replace the plain text loading screen with a modern, professional loading screen.

### Files Created

| File | Purpose |
|------|---------|
| `frontend/src/components/LoadingScreen/ProjectLoadingScreen.tsx` | React component |
| `frontend/src/components/LoadingScreen/project-loading-screen.scss` | Styles |
| `frontend/src/components/LoadingScreen/index.ts` | Barrel export |

### File Modified
`frontend/src/pages/Project.tsx`

### Before (Old Implementation)
```tsx
if (!user?.project) {
    return (
        <div className={'w-100 h-100 d-flex'}>
            <div className={'m-auto d-flex p-5'} style={{flexFlow: 'column', cursor:'pointer'}}
                 onClick={(e) => R.navigate('/allProjects')}>
                <h4 className={'mx-auto'}>Project loading...</h4>
                <div className={'mx-auto'}>if it takes too long try refreshing the page, or click to go back</div>
            </div>
        </div>
    );
}
```

**Problems:**
- Plain text, no visual feedback
- Panic-inducing message ("if it takes too long...")
- "Click to go back" not a visible button
- Unprofessional appearance

### After (New Implementation)

```tsx
if (!user?.project) {
    return <ProjectLoadingScreen />;
}
```

### Component: ProjectLoadingScreen

```tsx
export const ProjectLoadingScreen: React.FC<ProjectLoadingScreenProps> = ({
  projectName
}) => {
  const navigate = useNavigate();

  return (
    <div className="project-loading-screen">
      <div className="loading-content">
        {/* Animated SVG Spinner */}
        <div className="loading-spinner">
          <svg viewBox="0 0 50 50" className="spinner-svg">
            <circle className="spinner-circle" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
        </div>

        {/* Loading Message */}
        <h2 className="loading-title">
          {projectName ? `Loading "${projectName}"...` : 'Loading Project...'}
        </h2>

        <p className="loading-subtitle">
          This should only take a moment
        </p>

        {/* Back Button */}
        <button className="btn-back" onClick={() => navigate('/allProjects')}>
          <i className="bi bi-arrow-left" />
          <span>Back to Projects</span>
        </button>
      </div>
    </div>
  );
};
```

### Visual Design
```
┌─────────────────────────────────────┐
│                                     │
│          ⟳ (animated spinner)       │
│                                     │
│      Loading Project...             │
│                                     │
│   This should only take a moment    │
│                                     │
│      [← Back to Projects]           │
│                                     │
└─────────────────────────────────────┘
```

### Spinner Animation
- SVG-based spinner with CSS animations
- `rotate` animation: 2s linear infinite
- `dash` animation: 1.5s ease-in-out infinite (creates drawing effect)
- Slate color (#475569)

---

## 6. ERROR MODAL REDESIGN

### Purpose
Replace scary, technical error displays with user-friendly modals that hide technical details by default.

### Files Created

| File | Purpose |
|------|---------|
| `frontend/src/components/ErrorModal/ErrorModal.tsx` | React component |
| `frontend/src/components/ErrorModal/error-modal.scss` | Styles |
| `frontend/src/components/ErrorModal/index.ts` | Barrel export |

### File Modified
`frontend/src/common/error.scss` - Inline error notification styles

### Design Principles

1. **Orange warning, not red panic** - Use #ea580c (orange-600) instead of crimson
2. **User-friendly message first** - "Oops! Something Went Wrong"
3. **Technical details hidden** - Collapsible section for developers
4. **Clear actions** - "Try Again" and "Back to Projects" buttons
5. **Copy functionality** - Easy to copy error for support

### ErrorModal Component

#### Props Interface
```typescript
interface ErrorModalProps {
  isOpen: boolean;
  title?: string;                    // Default: "Oops! Something Went Wrong"
  message?: string;                  // Default: "We encountered an error..."
  technicalDetails?: {
    error: string;
    stackTrace?: string;
    lineNumber?: number;
    columnNumber?: number;
    viewName?: string;
    viewpointName?: string;
  };
  onClose: () => void;
  onRetry?: () => void;
  onReportBug?: () => void;
}
```

#### Features
- Modal backdrop with click-to-close
- Close button (X) in corner
- Orange warning icon (not red)
- Collapsible technical details
- Copy error to clipboard
- Optional "Report Bug" button
- Full dark mode support

### Visual Design

**Collapsed State:**
```
┌───────────────────────────────────┐
│                              [X]  │
│          ⚠️ (orange)              │
│                                   │
│  Oops! Something Went Wrong       │
│                                   │
│  We encountered an error...       │
│  Don't worry, your work is safe.  │
│                                   │
│  [Try Again] [Back to Projects]   │
│                                   │
│  ▼ Technical Details              │
└───────────────────────────────────┘
```

**Expanded State:**
```
┌───────────────────────────────────┐
│                              [X]  │
│          ⚠️ (orange)              │
│                                   │
│  Oops! Something Went Wrong       │
│                                   │
│  [Try Again] [Back to Projects]   │
│                                   │
│  ▲ Technical Details              │
│  ┌─────────────────────────────┐  │
│  │ Error: Cannot read...       │  │
│  │ View: DefaultView           │  │
│  │                             │  │
│  │ ┌─────────────────────────┐ │  │
│  │ │ Stack trace (dark box)  │ │  │
│  │ └─────────────────────────┘ │  │
│  │                             │  │
│  │ 📍 Line 16, Column 35       │  │
│  │                             │  │
│  │ [📋 Copy Error] [🐛 Report] │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
```

### Inline Error Notification (error.scss)

Also updated the inline error notification used on the canvas:

**Before:**
- Crimson red color
- Scary appearance
- Large icon

**After:**
- Orange warning color (#ea580c)
- White card with shadow
- Smaller, friendlier appearance
- Dark monospace box for technical details

---

## 7. FONT CONSISTENCY FIXES

### Issue
The hint text in the Models empty state was displaying in a monospace/code font instead of the standard sans-serif font.

### Files Modified
`frontend/src/components/project/project-editor.scss`

### Fix
Added explicit `font-family` declarations:

```scss
.empty-state {
  // ...other styles
  font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;

  &__hint {
    font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;

    span {
      font-family: inherit;
    }
  }
}
```

---

## 8. ADV BADGE REDESIGN

### Purpose
Create a professional Advanced Mode indicator that shows when the user has enabled advanced features.

### File Modified
`frontend/src/pages/components/Navbar.tsx`
`frontend/src/pages/components/navbar.scss`

### Implementation

#### Component: AdvancedModeBadge

```tsx
const AdvancedModeBadge = () => {
    if (!isAdvanced) return null;

    return (
        <Tooltip
            tooltip="Advanced mode is enabled. Additional features are available in editors."
            inline={true}
            position="bottom"
            offsetY={8}
        >
            <div className="navbar__adv-badge">
                <span className="adv-badge__text">ADV</span>
            </div>
        </Tooltip>
    );
};
```

#### CSS Styles

```scss
.navbar__adv-badge {
    display: flex;
    align-items: center;
    padding: 4px 10px;
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    border-radius: 4px;
    cursor: help;
    transition: all 0.2s ease;

    &:hover {
        background: linear-gradient(135deg, #475569 0%, #334155 100%);
        transform: translateY(-1px);
    }

    .adv-badge__text {
        font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #ffffff;
        text-transform: uppercase;
    }
}
```

### Visual Design
```
┌──────────────────────────────────────────────────────────┐
│ [Logo]  Projects  Templates  Explore    [ADV] [?] [👤]   │
└──────────────────────────────────────────────────────────┘
                                           ↑
                                    Slate gradient badge
                                    Shows tooltip on hover
```

### Features
- Slate gradient background (consistent with primary buttons)
- Uppercase "ADV" text
- Tooltip explains what advanced mode enables
- Hover effect with slight lift
- Only visible when `isAdvanced === true`

---

## 9. DEBUG BADGE

### Purpose
Provide a separate, independent debug mode indicator that operates independently from Advanced mode.

### File Modified
`frontend/src/pages/components/Navbar.tsx`
`frontend/src/pages/components/navbar.scss`

### Implementation

#### Redux State
Debug mode uses its own Redux state (`state.debug`), separate from Advanced mode (`state.advanced`).

```tsx
// In mapStateToProps
ret.debug = state.debug;
```

#### Component: DebugBadge

```tsx
const DebugBadge = () => {
    if (!debug) return null;

    return (
        <Tooltip
            tooltip="Debug mode is enabled. Console logging and debug panels are active."
            inline={true}
            position="bottom"
            offsetY={8}
        >
            <div className="navbar__debug-badge">
                <i className="bi bi-bug debug-badge__icon" />
                <span className="debug-badge__text">DEBUG</span>
            </div>
        </Tooltip>
    );
};
```

#### CSS Styles

```scss
.navbar__debug-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    border-radius: 4px;
    cursor: help;
    transition: all 0.2s ease;

    &:hover {
        background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
        transform: translateY(-1px);
    }

    .debug-badge__icon {
        font-size: 12px;
        color: #ffffff;
    }

    .debug-badge__text {
        font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #ffffff;
        text-transform: uppercase;
    }
}
```

### Visual Design
```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]  Projects  Templates  Explore    [🐛 DEBUG] [ADV] [?] [👤] │
└──────────────────────────────────────────────────────────────────┘
                                           ↑
                                    Orange gradient badge
                                    Bug icon + "DEBUG" text
```

### Features
- Orange gradient background (distinct from ADV badge)
- Bug icon (`bi-bug`) + "DEBUG" text
- Tooltip explains what debug mode enables
- Completely independent from Advanced mode
- Only visible when `debug === true`

### Independence from Advanced Mode

| State | ADV Badge | DEBUG Badge |
|-------|-----------|-------------|
| `advanced: false, debug: false` | Hidden | Hidden |
| `advanced: true, debug: false` | Visible | Hidden |
| `advanced: false, debug: true` | Hidden | Visible |
| `advanced: true, debug: true` | Visible | Visible |

---

## 10. VIEWPOINT TOGGLE SWITCH

### Purpose
Replace the native checkbox for viewpoint visibility with a modern toggle switch component.

### Files Modified
- `frontend/src/components/editors/views/NestedView.tsx`
- `frontend/src/components/editors/views/nestedView.scss`

### Before (Native Checkbox)
```tsx
<input
    type="checkbox"
    checked={viewpoint.show}
    onChange={() => toggleVisibility(viewpoint)}
/>
```

### After (Modern Toggle Switch)

#### Component

```tsx
<div
    className={`viewpoint-toggle ${viewpoint.show ? 'viewpoint-toggle--active' : ''}`}
    onClick={() => toggleVisibility(viewpoint)}
    title={viewpoint.show ? 'Click to hide viewpoint' : 'Click to show viewpoint'}
>
    <div className="viewpoint-toggle__thumb" />
</div>
```

#### CSS Styles

```scss
.viewpoint-toggle {
    width: 36px;
    height: 20px;
    border-radius: 20px;
    background-color: #cbd5e1;
    cursor: pointer;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;

    &:hover {
        background-color: #94a3b8;
    }

    &--active {
        background: linear-gradient(135deg, #64748b 0%, #475569 100%);

        &:hover {
            background: linear-gradient(135deg, #475569 0%, #334155 100%);
        }

        .viewpoint-toggle__thumb {
            transform: translateX(16px);
        }
    }

    &__thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
}
```

### Visual Design

**OFF State:**
```
┌─────────────────────────────────────────────┐
│ [⚫─────] Viewpoint Name                     │
└─────────────────────────────────────────────┘
     ↑
  Gray track, thumb on left
```

**ON State:**
```
┌─────────────────────────────────────────────┐
│ [─────⚫] Viewpoint Name                     │
└─────────────────────────────────────────────┘
     ↑
  Slate gradient track, thumb on right
```

### Features
- Smooth 0.3s cubic-bezier animation
- Slate gradient when active (consistent with design system)
- White thumb with subtle shadow
- Hover states for both active and inactive
- Tooltip on hover

---

## 11. COLORED ICONS IN VIEWPOINTS PANEL

### Purpose
Replace semi-transparent icon backgrounds with solid colored backgrounds that indicate element type.

### File Modified
`frontend/src/components/editors/views/nestedView.scss`

### Color Mapping

| Element Type | Background Color | Description |
|--------------|-----------------|-------------|
| Model | `#8b5cf6` (Violet) | Model instances |
| Package | `#3b82f6` (Blue) | Package containers |
| Class | `#ef4444` (Red) | Class definitions |
| Attribute | `#f59e0b` (Amber) | Attribute fields |
| Reference | `#10b981` (Emerald) | Reference links |
| Operation | `#8b5cf6` (Violet) | Operation methods |
| Enumerator | `#06b6d4` (Cyan) | Enum types |
| Literal | `#ec4899` (Pink) | Literal values |
| Default | `#6b7280` (Gray) | Unknown types |

### CSS Implementation

```scss
// Base icon style
.nested-view-icon {
    width: 22px;
    height: 22px;
    min-width: 22px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #ffffff;
    font-weight: 600;
    text-transform: uppercase;
    margin-right: 8px;
    flex-shrink: 0;
}

// Type-specific colors
.nested-view-icon--model { background-color: #8b5cf6; }
.nested-view-icon--package { background-color: #3b82f6; }
.nested-view-icon--class { background-color: #ef4444; }
.nested-view-icon--attribute { background-color: #f59e0b; }
.nested-view-icon--reference { background-color: #10b981; }
.nested-view-icon--operation { background-color: #8b5cf6; }
.nested-view-icon--enumerator { background-color: #06b6d4; }
.nested-view-icon--literal { background-color: #ec4899; }
.nested-view-icon--default { background-color: #6b7280; }
```

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ Viewpoints                                                  │
├─────────────────────────────────────────────────────────────┤
│ [─────⚫] DefaultViewpoint                                   │
│   ├── [M] University (violet bg, white "M")                 │
│   │   ├── [P] edu.domain (blue bg, white "P")               │
│   │   │   ├── [C] Student (red bg, white "C")               │
│   │   │   │   ├── [A] name (amber bg, white "A")            │
│   │   │   │   └── [R] enrolledIn (emerald bg, white "R")    │
│   │   │   └── [C] Course (red bg, white "C")                │
└─────────────────────────────────────────────────────────────┘
```

### Features
- Solid colored backgrounds (not semi-transparent)
- White text/icon on colored background
- Consistent 22x22px size
- 4px border radius
- Letter abbreviations: M (Model), P (Package), C (Class), A (Attribute), R (Reference), O (Operation), E (Enumerator), L (Literal)

---

## 12. RESOLUTION-BASED LAYOUT SYSTEM

### Purpose
Dynamically adjust the Properties panel width based on screen resolution for optimal space utilization.

### File Modified
`frontend/src/components/abstract/Dock.tsx`

### Breakpoint System

| Breakpoint | Screen Width | Panel Width | Percentage |
|------------|--------------|-------------|------------|
| MONITOR_27 | >= 2560px | 500-800px | 25% |
| DESKTOP | >= 1920px | 500-750px | 35% |
| LAPTOP | >= 1440px | 450-650px | 40% |
| TABLET | < 1440px | 400px+ | 50% |

### Implementation

#### Constants

```typescript
const BREAKPOINTS = {
    MONITOR_27: 2560,  // Monitor 27" or larger (2K/4K)
    DESKTOP: 1920,     // Desktop FHD
    LAPTOP: 1440,      // Laptop
    TABLET: 1024       // Tablet
};
```

#### Layout Mode Type

```typescript
export type LayoutMode = 'split' | 'sidebar' | 'canvas-only';
```

#### Panel Width Calculator

```typescript
export function getInitialPanelWidth(layoutMode: LayoutMode = 'split'): number {
    const screenWidth = window.innerWidth;

    // Canvas-only mode: hide properties panel
    if (layoutMode === 'canvas-only') {
        return 0;
    }

    // Sidebar mode: 30% of screen width (min 350px, max 450px)
    if (layoutMode === 'sidebar') {
        return Math.max(350, Math.min(450, Math.floor(screenWidth * 0.30)));
    }

    // Split mode: percentage based on resolution
    if (screenWidth >= BREAKPOINTS.MONITOR_27) {
        // Monitor 27"+: 25% (min 500px, max 800px)
        return Math.max(500, Math.min(800, Math.floor(screenWidth * 0.25)));
    }

    if (screenWidth >= BREAKPOINTS.DESKTOP) {
        // Desktop FHD: 35% (min 500px, max 750px)
        return Math.max(500, Math.min(750, Math.floor(screenWidth * 0.35)));
    }

    if (screenWidth >= BREAKPOINTS.LAPTOP) {
        // Laptop: 40% (min 450px, max 650px)
        return Math.max(450, Math.min(650, Math.floor(screenWidth * 0.40)));
    }

    // Tablet and smaller: 50% (min 400px)
    return Math.max(400, Math.floor(screenWidth * 0.5));
}
```

#### LocalStorage Persistence

```typescript
export function getSavedLayoutMode(): LayoutMode {
    const saved = localStorage.getItem('jjodel_layout_mode');
    return (saved as LayoutMode) || 'split';
}

export function saveLayoutMode(mode: LayoutMode): void {
    localStorage.setItem('jjodel_layout_mode', mode);
}
```

### Visual Representation

**Split Mode (Default):**
```
┌─────────────────────────────────────┬──────────────────┐
│                                     │                  │
│         CANVAS AREA                 │   PROPERTIES     │
│        (remaining space)            │    (25-50%)      │
│                                     │                  │
└─────────────────────────────────────┴──────────────────┘
```

**Sidebar Mode:**
```
┌────────────────────────────────────────────┬───────────┐
│                                            │           │
│              CANVAS AREA                   │ PROPERTIES│
│             (70% width)                    │   (30%)   │
│                                            │           │
└────────────────────────────────────────────┴───────────┘
```

---

## 13. LAYOUT CONTROLS

### Purpose
Provide toggle buttons in the navbar to switch between Split and Sidebar layout modes.

### Files Modified
- `frontend/src/pages/components/Navbar.tsx`
- `frontend/src/pages/components/navbar.scss`
- `frontend/src/components/abstract/Dock.tsx`
- `frontend/src/components/abstract/style.scss`

### Implementation

#### LayoutControls Component

```tsx
const LayoutControls = () => {
    // Only show when editing metamodels/models
    const isEditingModels = !!project && metamodels.length > 0;
    if (!isEditingModels) return null;

    // Check if we have 2+ tabs open in the dock (not just ModelsSummary)
    const dock = DockManager.dock;
    if (dock) {
        const layout = dock.getLayout();
        const modelsPanel = layout?.dockbox?.children?.[0];
        if (modelsPanel && 'tabs' in modelsPanel) {
            if (modelsPanel.tabs.length <= 1) {
                return null; // Only ModelsSummary tab, hide controls
            }
        }
    }

    return (
        <div className="navbar__layout-controls">
            <Tooltip tooltip="Split view - Canvas and properties side by side" inline={true} position="bottom" offsetY={8}>
                <button
                    className={`layout-btn ${layoutMode === 'split' ? 'layout-btn--active' : ''}`}
                    onClick={() => handleLayoutModeChange('split')}
                    aria-label="Split view"
                >
                    <i className="bi bi-layout-split" />
                </button>
            </Tooltip>
            <Tooltip tooltip="Sidebar view - Compact properties panel (30%)" inline={true} position="bottom" offsetY={8}>
                <button
                    className={`layout-btn ${layoutMode === 'sidebar' ? 'layout-btn--active' : ''}`}
                    onClick={() => handleLayoutModeChange('sidebar')}
                    aria-label="Sidebar view"
                >
                    <i className="bi bi-layout-sidebar-reverse" />
                </button>
            </Tooltip>
        </div>
    );
};
```

#### Custom Event System

When the user clicks a layout button, a custom event is dispatched:

```typescript
const handleLayoutModeChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    saveLayoutMode(mode);

    // Dispatch custom event for Dock to listen
    window.dispatchEvent(new CustomEvent('jjodel:layout-mode-change', {
        detail: { mode }
    }));

    // Update body data attribute for CSS
    document.body.setAttribute('data-layout-mode', mode);
};
```

#### Dock Event Listener

The Dock component listens for the custom event and updates panel width:

```typescript
useEffect(() => {
    const handleLayoutChange = (event: CustomEvent<{ mode: LayoutMode }>) => {
        const newMode = event.detail.mode;
        setLayoutMode(newMode);

        // Update right panel width
        if (DockManager.dock) {
            const newWidth = getInitialPanelWidth(newMode);
            const layout = DockManager.dock.getLayout();

            if (layout?.dockbox?.children?.[1]) {
                const rightPanel = layout.dockbox.children[1];
                if ('size' in rightPanel) {
                    rightPanel.size = newWidth;
                    DockManager.dock.loadLayout(layout);
                }
            }
        }
    };

    window.addEventListener('jjodel:layout-mode-change', handleLayoutChange as EventListener);

    return () => {
        window.removeEventListener('jjodel:layout-mode-change', handleLayoutChange as EventListener);
    };
}, []);
```

#### CSS Styles

```scss
.navbar__layout-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background-color: #f1f5f9;
    border-radius: 6px;
    margin-right: 12px;
}

.layout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 28px;
    border: none;
    background-color: transparent;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #64748b;

    &:hover {
        background-color: #e2e8f0;
        color: #475569;
    }

    &--active {
        background-color: #ffffff;
        color: #1e293b;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

        &:hover {
            background-color: #ffffff;
        }
    }

    i {
        font-size: 16px;
    }
}
```

### Visual Design

**Navbar with Layout Controls:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Logo]  Projects  Templates  Explore   [Split|Sidebar] [DEBUG] [ADV] [?] [👤] │
└────────────────────────────────────────────────────────────────────────────┘
                                          ↑
                                   Layout toggle buttons
                                   (only visible when editing)
```

**Button States:**
```
┌─────────────────┐     ┌─────────────────┐
│ ┌───┬───┐       │     │ ┌───┬───┐       │
│ │ ☑ │ ☐ │       │     │ │ ☐ │ ☑ │       │
│ └───┴───┘       │     │ └───┴───┘       │
│ Split Active    │     │ Sidebar Active  │
└─────────────────┘     └─────────────────┘
```

### Visibility Logic

The layout controls are **ONLY** visible when:
1. A project is open (`!!project`)
2. There are metamodels loaded (`metamodels.length > 0`)
3. There are 2+ tabs in the dock (user is actively editing, not just viewing project overview)

This prevents showing layout controls when:
- On the dashboard
- On project overview (only ModelsSummary tab)
- No metamodels exist

---

## 14. FEATURES PALETTE SIDEBAR

### Purpose
Provide a permanent, collapsible sidebar for dragging and dropping metamodel elements (Package, Class, Enumerator) onto the canvas. Replaces the need for floating menus or toolbar clicks.

### Files Created

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/FeaturesPalette/featureDefinitions.ts` | Feature metadata and helper functions |
| `frontend/src/components/FeaturesPalette/FeaturesPalette.tsx` | Main React component |
| `frontend/src/components/FeaturesPalette/features-palette.scss` | Styles with dark mode support |
| `frontend/src/components/FeaturesPalette/index.ts` | Barrel export |

### File Modified
`frontend/src/components/abstract/tabs/MetamodelTab.tsx`

### Implementation

#### Feature Definitions

```typescript
export interface FeatureDefinition {
    id: string;
    name: string;
    icon: string;           // Bootstrap Icon class (without 'bi-' prefix)
    description: string;
    dragType: string;       // Type used for drag & drop identification
    defaultData?: Record<string, any>;
}

export const featureDefinitions: FeatureDefinition[] = [
    {
        id: 'package',
        name: 'Package',
        icon: 'folder',
        description: 'Container for organizing model elements',
        dragType: 'FEATURE_PACKAGE',
    },
    {
        id: 'class',
        name: 'Class',
        icon: 'diagram-3',
        description: 'Define a class with attributes and operations',
        dragType: 'FEATURE_CLASS',
    },
    {
        id: 'enumerator',
        name: 'Enumerator',
        icon: 'list-ul',
        description: 'Define an enumeration type with literals',
        dragType: 'FEATURE_ENUMERATOR',
    }
];
```

#### FeaturesPalette Component

```tsx
export const FeaturesPalette: React.FC<FeaturesPaletteProps> = ({ className = '' }) => {
    // Initialize collapsed state from localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'true';
    });

    // Handle drag start - set drag data for canvas drop handling
    const handleDragStart = useCallback((e: React.DragEvent, feature: FeatureDefinition) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: feature.dragType,
            featureId: feature.id,
            defaultData: feature.defaultData
        }));
        e.dataTransfer.effectAllowed = 'copy';
    }, []);

    return (
        <div className={`features-palette ${isCollapsed ? 'features-palette--collapsed' : ''}`}>
            <button className="features-palette__toggle" onClick={toggleCollapsed}>
                <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
            </button>

            <div className="features-palette__content">
                <div className="features-palette__header">
                    <span className="features-palette__title">Features</span>
                </div>

                <div className="features-palette__items">
                    {featureDefinitions.map(feature => (
                        <div
                            key={feature.id}
                            className="features-palette__item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, feature)}
                            title={feature.description}
                        >
                            <i className={`bi bi-${feature.icon}`} />
                            <span>{feature.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
```

#### Canvas Drop Handler (MetamodelTab.tsx)

```typescript
// Handle drop on canvas - create element from Features Palette
const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    try {
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        const data = JSON.parse(dataStr);
        const feature = getFeatureByDragType(data.type);

        if (!feature || !model) return;

        // Create the element using model.addChild() - same API as ToolBar
        const createdElement = model.addChild(feature.id);

        // Execute the returned function if it exists
        try {
            if (typeof createdElement === 'function') {
                (createdElement as any)();
            }
        } catch (e) {
            // Element already created directly
        }

        // Mark project as modified
        if (!U.isProjectModified) {
            U.isProjectModified = U.userHasInteracted = true;
        }
    } catch (err) {
        console.error('Failed to handle drop:', err);
    }
}, [model]);
```

### Visual Design

**Expanded State:**
```
┌────────────────────┐
│ [◀] Features       │
├────────────────────┤
│ 📁 Package         │  ← Draggable
│ 📊 Class           │  ← Draggable
│ 📋 Enumerator      │  ← Draggable
└────────────────────┘
```

**Collapsed State:**
```
┌────┐
│ [▶]│
└────┘
```

### CSS Variables

```scss
$palette-width: 180px;
$palette-collapsed-width: 40px;
```

### Features
- **Collapsible**: Toggle button with chevron icon
- **Drag & Drop**: HTML5 drag & drop API with `application/json` data
- **Persistence**: Collapsed state saved to localStorage (`jjodel_features_palette_collapsed`)
- **Dark Mode**: Full support via `@media (prefers-color-scheme: dark)`
- **Tooltips**: Description shown on hover

### LocalStorage Key

| Key | Purpose | Values |
|-----|---------|--------|
| `jjodel_features_palette_collapsed` | Persists collapsed state | `'true'`, `'false'` |

---

## 15. FEATURESMODAL REMOVAL

### Purpose
Remove the unused floating modal component that was created but never integrated.

### Files Deleted

| File Path | Description |
|-----------|-------------|
| `frontend/src/components/FeaturesModal/FeaturesModal.tsx` | Modal component |
| `frontend/src/components/FeaturesModal/features-modal.scss` | Modal styles |
| `frontend/src/components/FeaturesModal/index.ts` | Barrel export |

### Reason for Removal
The `FeaturesModal` component was created as a potential floating menu for adding elements, but:
1. It was **never imported or used** anywhere in the codebase
2. The new `FeaturesPalette` sidebar provides the same functionality in a better UX pattern
3. Permanent sidebar > floating modal for frequent actions

### Verification
```bash
# Before removal
grep -r "FeaturesModal" frontend/src --include="*.tsx"
# Result: Only found in FeaturesModal.tsx itself (no imports)

# After removal
grep -r "FeaturesModal" frontend/src --include="*.tsx"
# Result: No files found
```

---

## 16. TOOLBAR SIMPLIFICATION

### Purpose
The ToolBar component content was commented out as the new FeaturesPalette provides similar functionality.

### File Modified
`frontend/src/components/toolbar/ToolBar.tsx`

### Change
The toolbar content div was commented out:

```tsx
// BEFORE
<div className={"toolbar hoverable" + (pinned ? " pinned" : '')} tabIndex={0}>
    <i className={"content pin bi bi-x-lg"} onClick={() => minimize(htmlref)}/>
    <section className={"content inline w-100"} style={{maxHeight: 'calc(100vh - 120px - 35px - 35px)', overflowY: 'auto'}}>
        {(content as any )?.length ? content : "Select a node."}
    </section>
</div>

// AFTER (commented out)
// <div className={"toolbar hoverable" + (pinned ? " pinned" : '')} tabIndex={0}>
//     <i className={"content pin bi bi-x-lg"} onClick={() => minimize(htmlref)}/>
//     <section className={"content inline w-100"} style={{maxHeight: 'calc(100vh - 120px - 35px - 35px)', overflowY: 'auto'}}>
//         {(content as any )?.length ? content : "Select a node."}
//     </section>
// </div>
```

### Note
The ToolBar component is still imported in `MetamodelTab.tsx` but renders nothing visible. This can be fully removed in a future cleanup if desired.

---

## 17. LAYOUT CONTROLS FIX

### Purpose
Fix the layout controls (Split/Sidebar buttons) so they don't close open tabs when clicked.

### File Modified
`frontend/src/components/abstract/Dock.tsx`

### Problem
Previously, clicking a layout button would call `DockManager.dock.loadLayout(layout)` which reset the entire dock, closing any open metamodel/model tabs.

### Solution
Changed to use CSS-only approach with `body[data-layout-mode]` attribute:

```typescript
// BEFORE (problematic)
const handleLayoutChange = (event: CustomEvent<{ mode: LayoutMode }>) => {
    const newMode = event.detail.mode;
    setLayoutMode(newMode);

    if (DockManager.dock) {
        const newWidth = getInitialPanelWidth(newMode);
        const layout = DockManager.dock.getLayout();
        if (layout?.dockbox?.children?.[1]) {
            rightPanel.size = newWidth;
            DockManager.dock.loadLayout(layout); // ← This closed tabs!
        }
    }
};

// AFTER (fixed)
const handleLayoutChange = (event: CustomEvent<{ mode: LayoutMode }>) => {
    const newMode = event.detail.mode;
    setLayoutMode(newMode);

    // Just trigger resize - CSS handles the actual layout via body[data-layout-mode]
    if (DockManager.dock) {
        window.dispatchEvent(new Event('resize'));
    }
};
```

### CSS Rules (in style.scss)

```scss
body[data-layout-mode="sidebar"] {
    .dock-hbox > .dock-panel:last-child {
        width: 30% !important;
        min-width: 350px;
        max-width: 450px;
    }
}

body[data-layout-mode="canvas-only"] {
    .dock-hbox > .dock-panel:last-child {
        width: 0 !important;
        min-width: 0;
        overflow: hidden;
    }
}
```

### Result
- Layout mode changes are now non-destructive
- Open tabs remain open when switching layouts
- Smooth transition via CSS

---

## 18. NAVBAR MENU ICONS UNIFORMIZATION

### Purpose
Replace inconsistent icons (mix of outline, filled, and custom dotted icons) with uniform Bootstrap Icons outline style across all navbar menus.

### File Modified
`frontend/src/pages/components/Navbar.tsx`

### Icon Mapping Changes

| Menu Item | Old Icon | New Icon |
|-----------|----------|----------|
| New | `bi-plus-circle-dotted` | `bi-plus-circle` |
| Recent Projects | `icon['recent']` | `bi-clock-history` |
| Metamodel | Custom `MetamodelIcon` | `bi-diagram-3` |
| Model | Custom `ModelIcon` | `bi-box` |
| Import Project | `icon['import']` | `bi-upload` |
| Save Project | `icon['save']` | `bi-floppy` |
| Download Project | `icon['download']` | `bi-download` |
| Close Project | `icon['close']` | `bi-x-lg` |
| Delete Project | `icon['delete']` | `bi-trash` |
| About Jjodel | `icon['jjodel']` | `bi-shield` |
| Roadmap | `icon['roadmap']` | `bi-calendar3` |
| Undo | `icon['undo']` | `bi-arrow-counterclockwise` |
| Redo | `icon['redo']` | `bi-arrow-clockwise` |
| Favorites | `icon['favorite']` | `bi-star` / `bi-star-fill` |
| Copy Link | `icon['link']` | `bi-link-45deg` |
| Zoom-in | `icon['zoom-in']` | `bi-zoom-in` |
| Zoom-out | `icon['zoom-out']` | `bi-zoom-out` |
| Save/Load Layout | `bi-columns-gap` | `bi-grid-3x3` |
| Sidebar | `icon['sidebar']` | `bi-layout-sidebar` |
| Toolbar | `icon['toolbar2']` | `bi-menu-button` |
| Fullscreen | `icon['fullscreen']` | `bi-arrows-fullscreen` |
| Live Validation | `icon['validation']` | `bi-check-circle` |
| Validate | `icon['validate']` | `bi-clipboard-check` |
| M2 Analytics | `icon['metrics']` | `bi-graph-up` |
| Debug Mode | `bi-bug-fill` | `bi-bug` (outline when off) |
| Learn Jjodel | `icon['learn']` | `bi-infinity` |
| Getting Started | `icon['getting-started']` | `bi-rocket-takeoff` |
| Video Tutorials | `icon['video']` | `bi-play-circle` |
| FAQ | `icon['faq']` | `bi-chat-left-dots` |
| Support | `icon['support']` | `bi-life-preserver` |
| Report Bug | `icon['report-bug']` | `bi-bug` |
| Contact | `icon['contact']` | `bi-envelope` |

### Design Principle
All icons now use Bootstrap Icons with the `bi-*` class prefix. Filled variants (`bi-*-fill`) are only used for active/selected states (e.g., favorites star when favorited).

---

## 19. ADAPTIVE KEYBOARD SHORTCUTS

### Purpose
Replace hardcoded keyboard shortcuts with OS-adaptive shortcuts that display correctly on Mac (⌘⇧⌥) and Windows/Linux (Ctrl+Shift+Alt).

### File Created
`frontend/src/utils/keyboardShortcuts.ts`

### Implementation

#### Type Definitions

```typescript
export type ModifierKey = 'cmd' | 'ctrl' | 'shift' | 'alt';

export interface ShortcutConfig {
    key: string;
    modifiers: ModifierKey[];
}
```

#### Platform Detection

```typescript
export function isMac(): boolean {
    if (typeof navigator === 'undefined') return false;
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}
```

#### Symbol Mapping

| Modifier | Mac Symbol | Windows/Linux |
|----------|------------|---------------|
| cmd | ⌘ | Ctrl |
| ctrl | ⌃ | Ctrl |
| shift | ⇧ | Shift |
| alt | ⌥ | Alt |

#### Format Function

```typescript
export function formatShortcut(config: ShortcutConfig): string {
    const isMacOS = isMac();
    const modifierSymbols = config.modifiers.map(m => getModifierSymbol(m));

    if (isMacOS) {
        // Mac style: ⌘S (no separator)
        return modifierSymbols.join('') + config.key.toUpperCase();
    } else {
        // Windows/Linux style: Ctrl+S (with +)
        return [...modifierSymbols, config.key.toUpperCase()].join('+');
    }
}
```

#### Predefined Shortcuts

```typescript
export const SHORTCUTS = {
    SAVE: { key: 'S', modifiers: ['cmd'] },
    CLOSE: { key: 'E', modifiers: ['cmd'] },
    NEW_METAMODEL: { key: 'M', modifiers: ['alt', 'cmd'] },
    UNDO: { key: 'Z', modifiers: ['cmd'] },
    REDO_MAC: { key: 'Z', modifiers: ['cmd', 'shift'] },
    REDO_WIN: { key: 'Y', modifiers: ['cmd'] },
    COPY_LINK: { key: 'S', modifiers: ['shift', 'cmd'] },
    ADVANCED_MODE: { key: 'M', modifiers: ['shift', 'cmd'] },
};
```

#### Special Case: Redo

```typescript
export function getRedoShortcut(): string {
    return isMac()
        ? formatShortcut(SHORTCUTS.REDO_MAC)   // ⌘⇧Z
        : formatShortcut(SHORTCUTS.REDO_WIN);  // Ctrl+Y
}
```

### Shortcut Display Examples

| Action | Mac | Windows |
|--------|-----|---------|
| Save | ⌘S | Ctrl+S |
| Close | ⌘E | Ctrl+E |
| New Metamodel | ⌥⌘M | Alt+Ctrl+M |
| Undo | ⌘Z | Ctrl+Z |
| Redo | ⌘⇧Z | Ctrl+Y |
| Copy Link | ⇧⌘S | Shift+Ctrl+S |
| Advanced Mode | ⇧⌘M | Shift+Ctrl+M |

---

## 20. MENU STYLING CONSISTENCY

### Purpose
Ensure uniform styling for menu items including hover states, shortcuts display, icon sizing, and spacing.

### File Modified
`frontend/src/pages/components/navbar.scss`

### Changes

#### New Shortcut Styling

```scss
.keystrokes {
    .keystroke {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
        font-size: 11px;
        font-weight: 500;
        padding: 2px 6px;
        background: rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 4px;
        color: #6b7280;
        white-space: nowrap;
    }
}
```

#### Hover State for Shortcuts

```scss
>li:hover >label {
    .keystrokes .keystroke {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
    }
}
```

#### Dark Mode Support

```scss
[data-theme="dark"] .keystrokes .keystroke,
.dark .keystrokes .keystroke {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #94a3b8;
}
```

#### Uniform Icon Sizing

```scss
.nav-container .content.context-menu ul > li > label {
    .bi {
        font-size: 16px;
        width: 20px;
        min-width: 20px;
        text-align: center;
        margin-right: 10px;
        flex-shrink: 0;
    }

    .icon-expand-submenu {
        font-size: 12px;
        opacity: 0.6;
        margin-left: auto;
    }
}
```

### Visual Design

**Menu Item Structure:**
```
┌─────────────────────────────────────────────────────┐
│ [icon 16px] Menu Item Name          [shortcut] [›]  │
│   20px      flexible                  auto    12px  │
└─────────────────────────────────────────────────────┘
```

**Hover State:**
```
┌─────────────────────────────────────────────────────┐
│ [icon]  Save Project                    ⌘S          │
│         ↓ slate background (#475569)    ↓           │
│         white text                      inverted    │
└─────────────────────────────────────────────────────┘
```

---

## 21. GLOBAL KEYBOARD HANDLER

**Problem Solved:** Browser was intercepting keyboard shortcuts (e.g., CMD+S triggered browser's "Save Page" dialog instead of Jjodel's Save Project).

### Implementation Details

A global keyboard event handler was added to `Navbar.tsx` using `useEffect` with capture phase:

```typescript
useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        // Skip if user is typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // CMD/Ctrl + S - Save Project
        if (matchesShortcut(event, SHORTCUTS.SAVE)) {
            event.preventDefault();
            event.stopPropagation();
            // Trigger save...
        }
        // ... other shortcuts
    };

    window.addEventListener('keydown', handleKeyDown, true); // Capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true);
}, [project]);
```

### Shortcuts Handled:
| Shortcut | Action |
|----------|--------|
| `CMD/Ctrl + S` | Save Project |
| `CMD/Ctrl + E` | Close Project |
| `Alt + CMD/Ctrl + M` | New Metamodel |

### Key Points:
- Uses **capture phase** (`true` as third parameter) to intercept before browser
- Calls `event.preventDefault()` and `event.stopPropagation()`
- Skips when user is typing in inputs/textareas
- Uses `matchesShortcut()` function for OS-adaptive matching

---

## 22. KEYBOARD SHORTCUT PILLS

**Problem Solved:** Keyboard shortcuts were displayed as single text (e.g., "⌘S") instead of individual pill buttons (e.g., ⌘ and S separately).

### Before vs After

**Before (single text):**
```
┌─────────────────────────────┐
│ Save Project        [⌘S]   │
└─────────────────────────────┘
```

**After (individual pills):**
```
┌─────────────────────────────────┐
│ Save Project        [⌘] [S]    │
└─────────────────────────────────┘
```

### Implementation

**New function in `keyboardShortcuts.ts`:**
```typescript
export function formatShortcutPills(config: ShortcutConfig): string[] {
    const modifierSymbols = config.modifiers.map(m => getModifierSymbol(m));
    return [...modifierSymbols, config.key.toUpperCase()];
}
```

**Updated keystroke rendering in `Navbar.tsx`:**
```typescript
function getKeyStrokes(keys?: string[], shortcutPills?: string[]) {
    if (shortcutPills && shortcutPills.length > 0) {
        return <div className="keystrokes">
            {shortcutPills.map((pill, index) => (
                <kbd key={index} className="keystroke-pill">{pill}</kbd>
            ))}
        </div>;
    }
    // ...fallback
}
```

### CSS Styling (navbar.scss)
```scss
.keystroke-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
  font-size: 11px;
  font-weight: 500;
  min-width: 20px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  color: #6b7280;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
}
```

---

## 23. CONTEXT-AWARE KEYBOARD SHORTCUTS

**Problem Solved:** Keyboard shortcuts now adapt their behavior based on the current application context, providing an intuitive workflow where CMD+N always means "New [most logical thing in current context]".

### Context Definitions

| Context | Description | Detection |
|---------|-------------|-----------|
| `DASHBOARD` | All Projects page | URL: `/allProjects`, `/dashboard`, `/` |
| `PROJECT_EDITOR` | Inside project, viewing/editing project | URL: `/project/*` without metamodel canvas |
| `METAMODEL_EDITOR` | Editing a specific metamodel on canvas | URL: `/project/*` with `.graph-container` in DOM |
| `USER_PROFILE` | User profile/settings page | URL: `/account`, `/profile`, `/settings` |

### Context-Aware Shortcuts

| Shortcut | DASHBOARD | PROJECT_EDITOR | METAMODEL_EDITOR | USER_PROFILE |
|----------|-----------|----------------|------------------|--------------|
| CMD+N | New Project | New Metamodel | New Class | - |
| CMD+Shift+N | - | New Model | - | - |
| CMD+S | - | Save Project | Save Project | Save Profile |
| CMD+W | - | Close Project | Close Project | Go Back |
| CMD+Q | Sign Out | Sign Out | Sign Out | Sign Out |

### Implementation

**Context Detection Function:**
```typescript
export function detectCurrentContext(): AppContext {
    const pathname = window.location.pathname;

    if (pathname === '/allProjects' || pathname === '/dashboard' || pathname === '/') {
        return 'DASHBOARD';
    }

    if (pathname.includes('/account') || pathname.includes('/profile')) {
        return 'USER_PROFILE';
    }

    const isMetamodelEditorActive = document.querySelector('.graph-container') !== null;
    if (isMetamodelEditorActive && pathname.includes('/project')) {
        return 'METAMODEL_EDITOR';
    }

    if (pathname.includes('/project')) {
        return 'PROJECT_EDITOR';
    }

    return 'DASHBOARD';
}
```

### Benefits
- Fewer shortcuts to memorize
- More intuitive: "CMD+N = New thing that makes sense here"
- Professional app pattern (Figma, VS Code, Photoshop)
- Fluid workflow without context switching

---

## 24. SIGN-OUT MENU ITEM

**Added:** Sign-out menu item with CMD+Q shortcut to Jjodel menu.

### Menu Structure

```
Jjodel Menu:
├── About Jjodel
├── Roadmap
├── ─────────── (divider)
└── Sign-out         ⌘Q
```

### Implementation

**Menu Item:**
```typescript
{name: 'Jjodel',
    subItems: [
        {name: 'About Jjodel', ...},
        {name: 'Roadmap', ...},
        {name: 'divisor'},
        {name: 'Sign-out',
            function: async () => {
                if (isProjectModified()) {
                    // Confirm dialog if unsaved changes
                } else {
                    await AuthApi.logout();
                    R.navigate('/auth');
                }
            },
            icon: <i className="bi bi-box-arrow-right" />,
            shortcutPills: formatShortcutPills(SHORTCUTS.SIGN_OUT)
        },
    ]
}
```

### Keyboard Handler

CMD+Q (or Ctrl+Q on Windows) triggers sign-out from any context:
```typescript
if (matchesShortcut(event, SHORTCUTS.SIGN_OUT)) {
    event.preventDefault();
    if (isProjectModified()) {
        // Confirm dialog
    } else {
        await AuthApi.logout();
        R.navigate('/auth');
    }
}
```

---

## 25. ADVANCED MODE TUTORIAL MODAL

### Purpose
Provide a first-time tutorial modal that explains what Advanced Mode unlocks when the user enables it for the first time. This helps users understand the powerful features they're activating.

### Files Created

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/AdvancedModeTutorial/AdvancedModeTutorial.tsx` | Tutorial modal component |
| `frontend/src/components/AdvancedModeTutorial/advanced-mode-tutorial.scss` | Modal styles with dark mode |
| `frontend/src/components/AdvancedModeTutorial/index.ts` | Barrel export |

### File Modified
`frontend/src/pages/components/Navbar.tsx`

### Implementation

#### Component Structure

```tsx
export function AdvancedModeTutorial({ isOpen, onClose }: AdvancedModeTutorialProps) {
    return (
        <div className="advanced-mode-tutorial-overlay">
            <div className="advanced-mode-tutorial-modal">
                {/* Header with icon and title */}
                <div className="tutorial-header">
                    <div className="tutorial-header__icon">
                        <i className="bi bi-lightning-charge-fill" />
                    </div>
                    <h2>Advanced Mode Enabled</h2>
                    <p>You now have access to all features and expert tools</p>
                </div>

                {/* Features Grid */}
                <div className="tutorial-features">
                    {features.map(feature => (
                        <div className="tutorial-feature">
                            <i className={`bi bi-${feature.icon}`} />
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Footer buttons */}
                <div className="tutorial-footer">
                    <button onClick={handleDontShowAgain}>Don't show again</button>
                    <button onClick={handleClose}>Got it</button>
                </div>
            </div>
        </div>
    );
}
```

#### Features Explained

| Feature | Icon | Description |
|---------|------|-------------|
| Extended Properties | bi-sliders | Access all element properties including constraints, documentation, and advanced type options |
| Developer Tools | bi-tools | Enable debug mode, loop debugging, and integrity checking for development workflows |
| M2 Analytics | bi-graph-up | View metamodel analytics and metrics to understand your model's structure and complexity |
| OCL Console | bi-code-slash | Write and execute Object Constraint Language queries for model validation |
| JSX Templates | bi-braces | Create custom view templates using JSX for advanced visualization |
| Layout Management | bi-grid-3x3 | Save and load custom layouts, manage layout auto-save settings |

### LocalStorage Key

| Key | Purpose | Values |
|-----|---------|--------|
| `jjodel_advanced_mode_tutorial_seen` | Tracks if user has seen the tutorial | `'true'` |

### Utility Functions

```typescript
// Check if tutorial should be shown
export function shouldShowAdvancedModeTutorial(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
}

// Reset tutorial state (for testing)
export function resetAdvancedModeTutorial(): void {
    localStorage.removeItem(STORAGE_KEY);
}
```

### Integration with Navbar

The tutorial is triggered when Advanced Mode is enabled for the first time:

```typescript
const enableAdvancedMode = (showTutorial: boolean = true) => {
    SetRootFieldAction.new('advanced', true);
    // ... other setup

    // Show tutorial if first time
    if (showTutorial && shouldShowAdvancedModeTutorial()) {
        setShowAdvancedTutorial(true);
    } else {
        U.alert('i', 'Advanced Mode', 'All features and options are now visible');
    }
};
```

### Visual Design

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│               ⚡ (gradient circle)                  │
│                                                     │
│          Advanced Mode Enabled                      │
│   You now have access to all features and           │
│   expert tools                                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐        │
│ │ 🎚️ Extended Props  │ │ 🔧 Developer Tools │        │
│ │ Access all element│ │ Enable debug mode,│        │
│ │ properties...     │ │ loop debugging... │        │
│ └───────────────────┘ └───────────────────┘        │
│ ┌───────────────────┐ ┌───────────────────┐        │
│ │ 📊 M2 Analytics   │ │ 💻 OCL Console    │        │
│ │ View metamodel    │ │ Write and execute │        │
│ │ analytics...      │ │ OCL queries...    │        │
│ └───────────────────┘ └───────────────────┘        │
│ ┌───────────────────┐ ┌───────────────────┐        │
│ │ {} JSX Templates  │ │ 📐 Layout Mgmt    │        │
│ │ Create custom     │ │ Save and load     │        │
│ │ view templates... │ │ custom layouts... │        │
│ └───────────────────┘ └───────────────────┘        │
├─────────────────────────────────────────────────────┤
│                 [Don't show again]  [Got it]        │
└─────────────────────────────────────────────────────┘
```

### Dark Mode Support

Full dark mode support with:
- Dark overlay background (rgba(0, 0, 0, 0.7))
- Dark modal background (#1e2024)
- Adjusted text colors for contrast
- Dark feature cards (#252830)

---

## 26. ZOOM CONTROLS WITH KEYBOARD SHORTCUTS

### Purpose
Add keyboard shortcuts for zoom operations (zoom in, zoom out, reset zoom) that work in editor contexts and prevent browser page zoom.

### Files Modified
- `frontend/src/utils/keyboardShortcuts.ts` - Added zoom shortcuts and matchers
- `frontend/src/pages/components/Navbar.tsx` - Added zoom keyboard handlers and menu items

### Implementation

#### New Shortcuts in keyboardShortcuts.ts

```typescript
export const SHORTCUTS = {
    // ... existing shortcuts ...

    // Zoom shortcuts (editor context only)
    ZOOM_IN: { key: '+', modifiers: ['cmd'] as ModifierKey[] },   // CMD++ / Ctrl++
    ZOOM_OUT: { key: '-', modifiers: ['cmd'] as ModifierKey[] },  // CMD+- / Ctrl+-
    ZOOM_RESET: { key: '0', modifiers: ['cmd'] as ModifierKey[] }, // CMD+0 / Ctrl+0
};
```

#### Special Matchers for Zoom

The plus key (`+`) requires special handling because it's `=` on unshifted keyboards:

```typescript
export function matchesZoomIn(event: KeyboardEvent): boolean {
    const cmdOrCtrl = isMac() ? event.metaKey : event.ctrlKey;
    if (!cmdOrCtrl || event.altKey) return false;
    // Accept '+' or '=' (unshifted plus on US keyboard)
    return event.key === '+' || event.key === '=';
}
```

#### Custom Event System

Zoom actions are dispatched as custom events for the canvas to handle:

```typescript
window.dispatchEvent(new CustomEvent('jjodel:zoom', {
    detail: { action: 'in' | 'out' | 'reset' }
}));
```

#### Context Availability

Zoom shortcuts only work in editor contexts:
- ✅ **METAMODEL_EDITOR** - Primary use case (zooming canvas)
- ✅ **PROJECT_EDITOR** - If canvas/diagrams are present
- ❌ **DASHBOARD** - No zoom needed
- ❌ **USER_PROFILE** - No zoom needed

### Menu Items

View menu now includes:
```
┌─────────────────────────────────┐
│ 🔍 Zoom-in           [⌘] [+]    │
│ 🔍 Zoom-out          [⌘] [-]    │
│ ↺  Reset Zoom        [⌘] [0]    │
└─────────────────────────────────┘
```

### Browser Default Prevention

The keyboard handlers prevent browser defaults:
- **CMD+Plus / Ctrl+Plus** → Prevents browser page zoom in
- **CMD+Minus / Ctrl+Minus** → Prevents browser page zoom out
- **CMD+0 / Ctrl+0** → Prevents browser page zoom reset

### Canvas Integration (TODO)

The canvas component should listen for the `jjodel:zoom` event:

```typescript
useEffect(() => {
    const handleZoom = (event: CustomEvent<{ action: 'in' | 'out' | 'reset' }>) => {
        switch (event.detail.action) {
            case 'in':
                // Increase zoom by 10% or step
                break;
            case 'out':
                // Decrease zoom by 10% or step
                break;
            case 'reset':
                // Set zoom to 100% (1.0)
                break;
        }
    };

    window.addEventListener('jjodel:zoom', handleZoom as EventListener);
    return () => window.removeEventListener('jjodel:zoom', handleZoom as EventListener);
}, []);
```

---

## 27. M2 ANALYTICS MODAL

### Purpose
Provide a centered modal that displays EMF-based metamodel classification and detailed metrics. This modal is only accessible in Advanced Mode and follows the same design pattern as the Advanced Mode Tutorial modal.

### Files Created

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/M2AnalyticsModal/M2AnalyticsModal.tsx` | Modal component with classification gauge and metrics table |
| `frontend/src/components/M2AnalyticsModal/m2-analytics-modal.scss` | Styles with full dark mode support |
| `frontend/src/components/M2AnalyticsModal/index.ts` | Barrel export |

### Files Modified

| File Path | Changes |
|-----------|---------|
| `frontend/src/pages/components/Navbar.tsx` | Added M2AnalyticsModal import, state, and integration |

### Data Structure

```typescript
export interface M2AnalyticsData {
    metamodelName: string;
    classification: {
        score: number;  // 0-100
        category: 'small' | 'medium' | 'large';
    };
    metrics: {
        PKG: number;        // # Packages
        MC: number;         // # Metaclasses
        AMC: number;        // # Abstract Metaclasses
        CMC: number;        // # Concrete Metaclasses
        IFLMC: number;      // # Concrete Featureless Metaclasses
        MCWS: number;       // # Metaclasses with Superclass
        LMC: number | null; // % Isolated Metaclasses (can be NaN)
        SF: number;         // # Structural Features
        ASF: number | null; // Avg # Structural Features (can be NaN)
        EN: number;         // # Enumerations
        LIT: number;        // # Literals
    };
}
```

### Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│ [slate gradient header]                                  │
│ 📊 Metamodel Analytics                           [×]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ℹ️ Metamodel classification as EMF-based            │ │
│ │                                                      │ │
│ │   small          medium           large             │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ [slate] |   [orange]      |     [blue]         │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │      30         50           80                    │ │
│ │ 0                           MyMetamodel            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Metrics                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PKG   # Packages                              1     │ │
│ │ MC    # Metaclasses                           12    │ │
│ │ AMC   # Abstract Metaclasses                  3     │ │
│ │ CMC   # Concrete Metaclasses                  9     │ │
│ │ IFLMC # Concrete Featureless Metaclasses      2     │ │
│ │ MCWS  # Metaclasses with Superclass           5     │ │
│ │ LMC   % Isolated Metaclasses                 16.7%  │ │
│ │ SF    # Structural Features                   24    │ │
│ │ ASF   Avg # Structural Features               2.0   │ │
│ │ EN/LIT # Enumeration/Literals                2/8    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                          [Close]        │
└─────────────────────────────────────────────────────────┘
```

### Classification Gauge

The gauge visualizes metamodel size classification:

| Zone | Range | Color | CSS Variable |
|------|-------|-------|--------------|
| Small | 0-30 | Slate | `$gauge-small: #94a3b8` |
| Medium | 30-80 | Orange | `$gauge-medium: #f59e0b` |
| Large | 80-100 | Blue | `$gauge-large: #3b82f6` |

### Null/NaN Handling

Some metrics can be null or NaN (e.g., when there are 0 metaclasses):

```typescript
const formatValue = (value: number | null): string => {
    if (value === null || (typeof value === 'number' && isNaN(value))) return 'N/A';
    return value.toString();
};

const formatPercentage = (value: number | null): string => {
    if (value === null || (typeof value === 'number' && isNaN(value))) return 'N/A';
    return `${value.toFixed(1)}%`;
};
```

N/A values are styled with orange color (`metrics-row__value--na`).

### Availability

- **Requires:** Advanced Mode enabled
- **Menu Location:** Metamodel → M2 Analytics
- **Disabled When:** On Dashboard OR no metamodels loaded

### Dark Mode Support

Full dark mode support via `[data-theme="dark"]` selectors:

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Modal background | `#ffffff` | `#1e293b` |
| Footer background | `#f8fafc` | `#0f172a` |
| Section background | `#f8fafc` | `#0f172a` |
| Metrics row | `#f8fafc` | `#0f172a` |
| Text primary | `#1e293b` | `#f1f5f9` |
| Marker badge | Dark bg/light text | Light bg/dark text |

---

## 28. ADAPTIVE TREE VIEW SIDEBAR

### Overview

The Tree View has been redesigned as an adaptive sidebar that responds to screen resolution:
- **Monitor (≥2560px)**: Permanent right sidebar, open by default
- **Desktop (1920-2559px)**: Collapsible right sidebar, collapsed by default
- **Laptop (<1920px)**: Floating overlay on demand

### Files Created

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/TreeViewSidebar/TreeViewSidebar.tsx` | Main sidebar component with resolution-adaptive behavior |
| `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` | Tree content component with metamodel hierarchy |
| `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` | Styles for sidebar, overlay, and tree nodes |
| `frontend/src/components/TreeViewSidebar/index.ts` | Barrel export |
| `frontend/src/hooks/useResolution.ts` | Resolution detection hook |

### Files Modified

| File Path | Changes |
|-----------|---------|
| `frontend/src/pages/components/Navbar.tsx` | Added TreeViewToggle button and ⌘B keyboard shortcut handler |
| `frontend/src/pages/components/Dashboard.tsx` | Integrated TreeViewSidebar in ProjectDashboard |
| `frontend/src/utils/keyboardShortcuts.ts` | Added TOGGLE_TREE_VIEW shortcut constant |

### Component: TreeViewSidebar

```tsx
// Resolution-adaptive behavior
const resolution = useResolution(); // 'laptop' | 'desktop' | 'monitor'

// localStorage persistence
const STORAGE_KEY_OPEN = 'jjodel_tree_view_open';
const STORAGE_KEY_WIDTH = 'jjodel_tree_view_width';

// Width constraints
const MIN_WIDTH = 250;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 350;

// Custom event for toggle
window.dispatchEvent(new CustomEvent('jjodel:toggle-tree-view'));
```

### Component: TreeViewContent

Connected to Redux to get metamodels and selection state:

```tsx
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const metamodelPointers = state.m2models || [];
    ret.metamodels = LPointerTargetable.fromPointer(metamodelPointers) || [];
    ret.selectedElementId = state._lastSelected?.modelElement;
    return ret;
}
```

### Hook: useResolution

```tsx
export type Resolution = 'laptop' | 'desktop' | 'monitor';

export const RESOLUTION_BREAKPOINTS = {
    MONITOR: 2560,  // 27" Monitor or larger
    DESKTOP: 1920,  // Desktop FHD
    LAPTOP: 1920    // Below this is laptop
};

export function useResolution(): Resolution {
    // Returns current resolution category
    // Updates on window resize
}
```

### Keyboard Shortcut

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| Toggle Tree View | ⌘B | Ctrl+B | Open/close sidebar |
| Close Overlay | ESC | ESC | Close overlay (laptop mode only) |

### UI Elements

**Sidebar (Desktop/Monitor Mode)**:
- Toggle button with chevron icon
- Resize handle on left edge (drag to resize 250-500px)
- Header with tree icon and "Tree View" title
- Scrollable tree content area

**Overlay (Laptop Mode)**:
- Semi-transparent backdrop (click to close)
- Slide-in panel from right
- Close button in header
- Auto-close on element selection

**Tree Nodes**:
- Expand/collapse toggle
- Type-specific colored icon badges
- Element name with ellipsis overflow
- Class extends info (if applicable)

### Tree Type Colors

| Type | Color | Letter |
|------|-------|--------|
| DModel | Purple (#8b5cf6) | M |
| DPackage | Blue (#3b82f6) | P |
| DClass | Red (#ef4444) | C |
| DAttribute | Green (#10b981) | A |
| DReference | Amber (#f59e0b) | R |
| DEnum | Pink (#ec4899) | E |
| DEnumLiteral | Light Pink | L |
| DOperation | Cyan (#06b6d4) | O |

### NavBar Integration

TreeViewToggle button added near layout controls:

```tsx
const TreeViewToggle = () => {
    const handleToggle = () => {
        window.dispatchEvent(new CustomEvent('jjodel:toggle-tree-view'));
    };

    return (
        <Tooltip tooltip={`Tree View (${shortcutLabel})`}>
            <button
                className={`layout-btn ${isTreeViewOpen ? 'layout-btn--active' : ''}`}
                onClick={handleToggle}
            >
                <i className="bi bi-diagram-2" />
            </button>
        </Tooltip>
    );
};
```

### CSS Architecture

```scss
// Main sidebar container (positioned fixed right)
.tree-view-sidebar {
    position: fixed;
    top: 60px; // Below navbar
    right: 0;
    bottom: 0;
    z-index: 100;
}

// Laptop overlay mode
.tree-view-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.4);
}

// Tree node with type-specific colors
.tree-node__icon {
    &.tree-DClass { background-color: #ef4444; }
    &.tree-DAttribute { background-color: #10b981; }
    // etc.
}
```

### Dark Mode Support

Full dark mode support via `prefers-color-scheme: dark`:

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Sidebar background | `#ffffff` | `#1e1e1e` |
| Border color | `#e2e4e8` | `#333` |
| Node hover | `#f8fafc` | `#2d2d2d` |
| Selected node | `rgba(71, 85, 105, 0.1)` | `rgba(71, 85, 105, 0.3)` |
| Text primary | `#111418` | `#e0e0e0` |

---

## 29. FILE INVENTORY

### New Files Created (Phase 8)

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/TreeViewSidebar/TreeViewSidebar.tsx` | Resolution-adaptive Tree View sidebar |
| `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` | Tree hierarchy content component |
| `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` | Sidebar and tree node styles |
| `frontend/src/components/TreeViewSidebar/index.ts` | Barrel export |
| `frontend/src/hooks/useResolution.ts` | Resolution detection hook |

### New Files Created (Phase 7)

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/AdvancedModeTutorial/AdvancedModeTutorial.tsx` | Tutorial modal component |
| `frontend/src/components/AdvancedModeTutorial/advanced-mode-tutorial.scss` | Modal styles with dark mode |
| `frontend/src/components/AdvancedModeTutorial/index.ts` | Barrel export |
| `frontend/src/components/M2AnalyticsModal/M2AnalyticsModal.tsx` | M2 Analytics modal component |
| `frontend/src/components/M2AnalyticsModal/m2-analytics-modal.scss` | Modal styles with dark mode |
| `frontend/src/components/M2AnalyticsModal/index.ts` | Barrel export |

### New Files Created (Phase 4)

| File Path | Purpose |
|-----------|---------|
| `frontend/src/utils/keyboardShortcuts.ts` | OS-adaptive keyboard shortcuts utility |

### New Files Created (Phase 3)

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/FeaturesPalette/featureDefinitions.ts` | Feature metadata |
| `frontend/src/components/FeaturesPalette/FeaturesPalette.tsx` | Sidebar component |
| `frontend/src/components/FeaturesPalette/features-palette.scss` | Sidebar styles |
| `frontend/src/components/FeaturesPalette/index.ts` | Barrel export |

### Files Deleted (Phase 3)

| File Path | Reason |
|-----------|--------|
| `frontend/src/components/FeaturesModal/FeaturesModal.tsx` | Unused, replaced by FeaturesPalette |
| `frontend/src/components/FeaturesModal/features-modal.scss` | Unused |
| `frontend/src/components/FeaturesModal/index.ts` | Unused |

### New Files Created (Phase 1)

| File Path | Purpose |
|-----------|---------|
| `frontend/src/components/LoadingScreen/ProjectLoadingScreen.tsx` | Loading screen component |
| `frontend/src/components/LoadingScreen/project-loading-screen.scss` | Loading screen styles |
| `frontend/src/components/LoadingScreen/index.ts` | Barrel export |
| `frontend/src/components/ErrorModal/ErrorModal.tsx` | Error modal component |
| `frontend/src/components/ErrorModal/error-modal.scss` | Error modal styles |
| `frontend/src/components/ErrorModal/index.ts` | Barrel export |

### Existing Files Modified (Phase 1)

| File Path | Changes |
|-----------|---------|
| `frontend/src/components/alert/style.scss` | Added toast notification styles |
| `frontend/src/components/project/ProjectEditor.tsx` | Simplified empty states |
| `frontend/src/components/project/project-editor.scss` | Empty state styles, font fixes |
| `frontend/src/pages/components/LeftBar.tsx` | Added Export Metamodel feature |
| `frontend/src/pages/Project.tsx` | Replaced loading screen |
| `frontend/src/common/error.scss` | Redesigned error notification |

### Existing Files Modified (Phase 2)

| File Path | Changes |
|-----------|---------|
| `frontend/src/pages/components/Navbar.tsx` | ADV Badge, DEBUG Badge, Layout Controls |
| `frontend/src/pages/components/navbar.scss` | Badge styles, layout control styles |
| `frontend/src/components/abstract/Dock.tsx` | Layout mode hooks, breakpoints, event listener |
| `frontend/src/components/abstract/style.scss` | Layout mode CSS, sidebar/canvas-only styles |
| `frontend/src/components/editors/views/NestedView.tsx` | Toggle switch for viewpoints |
| `frontend/src/components/editors/views/nestedView.scss` | Toggle switch styles, colored icons |

### Existing Files Modified (Phase 7)

| File Path | Changes |
|-----------|---------|
| `frontend/src/pages/components/Navbar.tsx` | Added AdvancedModeTutorial integration, toggle functions |

### Existing Files Modified (Phase 4)

| File Path | Changes |
|-----------|---------|
| `frontend/src/pages/components/Navbar.tsx` | All icons to Bootstrap Icons, adaptive shortcuts |
| `frontend/src/pages/components/navbar.scss` | Shortcut styling, hover states, dark mode |

### Existing Files Modified (Phase 3)

| File Path | Changes |
|-----------|---------|
| `frontend/src/components/abstract/tabs/MetamodelTab.tsx` | Added FeaturesPalette, drop handler |
| `frontend/src/components/abstract/Dock.tsx` | Fixed layout change to not reset tabs |
| `frontend/src/components/toolbar/ToolBar.tsx` | Commented out toolbar content |

---

## 30. TECHNICAL NOTES

### U.alert() Function

The `U.alert()` function only accepts these type values:
- `'i'` - Info (blue/gray)
- `'w'` - Warning (orange)
- `'e'` - Error (red)

**DO NOT USE:** `'success'`, `'s'`, or any other values.

```typescript
// ✅ Correct
U.alert('i', 'Title', 'Message');
U.alert('w', 'Warning', 'Warning message');
U.alert('e', 'Error', 'Error message');

// ❌ Wrong - will fail
U.alert('success', 'Title', 'Message');
U.alert('s', 'Title', 'Message');
```

### Import Paths

```typescript
// Loading Screen
import { ProjectLoadingScreen } from '../components/LoadingScreen';

// Error Modal
import { ErrorModal } from '../components/ErrorModal';

// Layout Mode utilities
import { LayoutMode, getInitialPanelWidth, getSavedLayoutMode, saveLayoutMode } from '../components/abstract/Dock';

// Features Palette
import { FeaturesPalette, getFeatureByDragType, featureDefinitions } from '../components/FeaturesPalette';

// Keyboard Shortcuts (Phase 4)
import { formatShortcut, getRedoShortcut, SHORTCUTS, isMac } from '../utils/keyboardShortcuts';
```

### Custom Events

**Layout Mode Change Event:**
```typescript
// Dispatch
window.dispatchEvent(new CustomEvent('jjodel:layout-mode-change', {
    detail: { mode: 'split' | 'sidebar' | 'canvas-only' }
}));

// Listen
window.addEventListener('jjodel:layout-mode-change', (event: CustomEvent) => {
    const newMode = event.detail.mode;
});
```

### LocalStorage Keys

| Key | Purpose | Values |
|-----|---------|--------|
| `jjodel_layout_mode` | Persists layout preference | `'split'`, `'sidebar'`, `'canvas-only'` |
| `jjodel_features_palette_collapsed` | Persists sidebar collapsed state | `'true'`, `'false'` |

### Body Data Attributes

```html
<!-- For CSS styling based on layout mode -->
<body data-layout-mode="split">
<body data-layout-mode="sidebar">
<body data-layout-mode="canvas-only">
```

### Dark Mode

All components support dark mode via CSS media query:
```scss
@media (prefers-color-scheme: dark) {
  // Dark mode styles
}
```

### Bootstrap Icons

All icons use Bootstrap Icons. Reference: https://icons.getbootstrap.com/

Common icons used:
- `bi-diagram-3` - Metamodel
- `bi-box` - Model
- `bi-arrow-up` - Point up
- `bi-box-arrow-up` - Export
- `bi-exclamation-triangle` - Warning
- `bi-arrow-left` - Back
- `bi-clipboard` - Copy
- `bi-x-lg` - Close
- `bi-bug` - Debug
- `bi-layout-split` - Split layout
- `bi-layout-sidebar-reverse` - Sidebar layout
- `bi-folder` - Package
- `bi-chevron-left` / `bi-chevron-right` - Collapse toggle

---

## 31. TESTING CHECKLIST

### Toast Notifications
- [ ] Toast appears in top-right corner
- [ ] Auto-dismisses after timeout
- [ ] Click to dismiss works
- [ ] Progress bar animates
- [ ] All variants display correct colors (success, error, warning, info)
- [ ] Dark mode colors correct

### Empty States
- [ ] Metamodels: White container with shadow
- [ ] Models: Dashed border, transparent background
- [ ] Models hint box: Blue background, correct font
- [ ] Viewpoints: Minimal inline style
- [ ] Dark mode: All variants display correctly
- [ ] "Create Your First Metamodel" button works

### Export Metamodel
- [ ] Button appears in project sidebar
- [ ] Exports .jmm file with correct structure
- [ ] Filename includes metamodel name
- [ ] Shows info toast on success
- [ ] Shows warning if no metamodel exists
- [ ] Shows error if export fails

### Loading Screen
- [ ] Spinner animates smoothly
- [ ] "Back to Projects" button navigates correctly
- [ ] Displays when project is loading
- [ ] Dark mode support

### Error Modal
- [ ] Orange warning icon (not red)
- [ ] Technical details hidden by default
- [ ] Expand/collapse works
- [ ] Copy error button copies to clipboard
- [ ] "Copied!" feedback appears
- [ ] Close button works
- [ ] Backdrop click closes modal
- [ ] Dark mode support

### Font Consistency
- [ ] All empty state text uses Inter Variable
- [ ] Hint box text is sans-serif (not monospace)
- [ ] Error details use monospace font

### ADV Badge
- [ ] Only visible when Advanced mode enabled
- [ ] Slate gradient background
- [ ] Tooltip appears on hover
- [ ] Hover effect (slight lift)

### DEBUG Badge
- [ ] Only visible when Debug mode enabled
- [ ] Orange gradient background
- [ ] Bug icon displays correctly
- [ ] Tooltip appears on hover
- [ ] Independent from ADV badge

### Viewpoint Toggle Switch
- [ ] Toggle animates smoothly (0.3s)
- [ ] Slate gradient when ON
- [ ] Gray when OFF
- [ ] Clicking toggles viewpoint visibility
- [ ] Tooltip displays correct state

### Colored Icons
- [ ] Each element type has correct color
- [ ] Model = Violet
- [ ] Package = Blue
- [ ] Class = Red
- [ ] Attribute = Amber
- [ ] Reference = Emerald
- [ ] White text/icon visible
- [ ] 22x22px consistent size

### Resolution-based Layout
- [ ] Panel width adjusts on window resize
- [ ] Split mode: 25-50% based on resolution
- [ ] Sidebar mode: 30% (350-450px)
- [ ] Layout preference persists in localStorage

### Layout Controls
- [ ] Only visible when editing (project open + metamodels + 2+ tabs)
- [ ] Hidden on dashboard
- [ ] Hidden on project overview
- [ ] Split button activates split mode
- [ ] Sidebar button activates sidebar mode
- [ ] Active button has white background + shadow
- [ ] Tooltips display on hover
- [ ] Panel width updates immediately on click
- [ ] **NEW**: Switching layouts does NOT close open tabs

### Features Palette Sidebar (Phase 3)
- [ ] Palette visible in metamodel editor
- [ ] Toggle button collapses/expands sidebar
- [ ] Collapsed state persists in localStorage
- [ ] Package item draggable to canvas
- [ ] Class item draggable to canvas
- [ ] Enumerator item draggable to canvas
- [ ] Dropping creates new element
- [ ] Project marked as modified after drop
- [ ] Dark mode support
- [ ] Tooltip shows description on hover
- [ ] Drag visual feedback (opacity change)

### FeaturesModal Removal (Phase 3)
- [ ] No floating "Features" modal appears
- [ ] No TypeScript errors related to FeaturesModal
- [ ] No imports of FeaturesModal in codebase

### ToolBar Changes (Phase 3)
- [ ] ToolBar content is hidden/commented
- [ ] No errors when opening metamodel
- [ ] FeaturesPalette replaces ToolBar functionality

### Navbar Menu Icons (Phase 4)
- [ ] All icons are Bootstrap Icons outline (bi-*)
- [ ] No custom dotted icons (bi-plus-circle-dotted → bi-plus-circle)
- [ ] No custom SVG icons in menus
- [ ] Icon size uniform 16px
- [ ] Icon width uniform 20px
- [ ] Icons white on hover (slate background)
- [ ] Filled variants only for active states (bi-star-fill for favorited)

### Adaptive Keyboard Shortcuts (Phase 4)
- [ ] On Mac: shows ⌘S, ⌘E, ⌥⌘M, etc.
- [ ] On Windows: shows Ctrl+S, Ctrl+E, Alt+Ctrl+M, etc.
- [ ] Redo on Mac: ⌘⇧Z
- [ ] Redo on Windows: Ctrl+Y
- [ ] Shortcut appears in monospace font
- [ ] Shortcut has subtle background (#f1f5f9)
- [ ] Shortcut border-radius 4px
- [ ] Shortcut inverts on menu item hover

### Menu Styling Consistency (Phase 4)
- [ ] Hover state: slate background (#475569)
- [ ] Hover state: white text
- [ ] Hover state: white icons
- [ ] Hover state: shortcut inverts to light
- [ ] Disabled items: no hover effect
- [ ] Chevron (›) aligned right
- [ ] Spacing consistent across all menus
- [ ] Dark mode: shortcuts visible
- [ ] Dark mode: proper contrast

### Global Keyboard Handler (Phase 5)
- [ ] CMD+S (Mac) / Ctrl+S (Windows) saves project, not browser's "Save Page"
- [ ] CMD+E (Mac) / Ctrl+E (Windows) closes project
- [ ] Alt+CMD+M (Mac) / Alt+Ctrl+M (Windows) creates new metamodel
- [ ] Shortcuts work when focus is NOT in an input/textarea
- [ ] Shortcuts do NOT intercept when typing in input fields
- [ ] Works on both Mac and Windows

### Keyboard Shortcut Pills (Phase 5)
- [ ] Each key displayed as separate pill (⌘ and S separately)
- [ ] Pills have 3px gap between them
- [ ] Pills have subtle border and shadow
- [ ] Pills have min-width 20px for small keys
- [ ] Pills invert to white on hover
- [ ] Dark mode: pills have correct styling

### Context-Aware Keyboard Shortcuts (Phase 6)
- [ ] Context detection correctly identifies DASHBOARD on `/allProjects`
- [ ] Context detection correctly identifies PROJECT_EDITOR in project view
- [ ] Context detection correctly identifies METAMODEL_EDITOR when canvas visible
- [ ] Context detection correctly identifies USER_PROFILE on `/account`
- [ ] CMD+N creates New Project on Dashboard
- [ ] CMD+N creates New Metamodel in Project Editor
- [ ] CMD+N creates New Class in Metamodel Editor (TODO)
- [ ] CMD+Shift+N creates New Model in Project Editor
- [ ] CMD+S saves project in Project/Metamodel Editor
- [ ] CMD+W closes project in Project/Metamodel Editor
- [ ] CMD+W goes back from User Profile
- [ ] CMD+Q triggers sign-out from any context
- [ ] Unsaved changes dialog appears before sign-out if needed
- [ ] Shortcuts do NOT fire when typing in inputs

### Sign-out Menu Item (Phase 6)
- [ ] Divider appears between Roadmap and Sign-out
- [ ] Sign-out item visible in Jjodel menu
- [ ] Sign-out icon: bi-box-arrow-right
- [ ] Sign-out displays CMD+Q / Ctrl+Q shortcut pills
- [ ] Clicking Sign-out triggers logout with unsaved changes check
- [ ] User redirected to /auth after sign-out
- [ ] Session properly cleared on sign-out

### Advanced Mode Tutorial Modal (Phase 7)
- [ ] Tutorial appears when enabling Advanced Mode for the first time
- [ ] Tutorial does NOT appear on subsequent toggles (unless reset)
- [ ] Modal has backdrop with blur effect
- [ ] Lightning icon in gradient circle header
- [ ] 6 feature cards displayed in 2x3 grid
- [ ] Each feature card has icon, title, and description
- [ ] "Don't show again" button marks as seen and closes
- [ ] "Got it" button marks as seen and closes
- [ ] Click outside modal closes it
- [ ] localStorage key `jjodel_advanced_mode_tutorial_seen` is set
- [ ] Dark mode: proper contrast and colors
- [ ] Smooth entrance/exit animations
- [ ] Mobile responsive (single column on small screens)

### Zoom Controls with Keyboard Shortcuts (Phase 7)
- [ ] CMD++ / Ctrl++ dispatches zoom in event (browser page zoom prevented)
- [ ] CMD+= / Ctrl+= also triggers zoom in (unshifted plus key)
- [ ] CMD+- / Ctrl+- dispatches zoom out event (browser page zoom prevented)
- [ ] CMD+0 / Ctrl+0 dispatches zoom reset event (browser page reset prevented)
- [ ] Zoom shortcuts only work in METAMODEL_EDITOR and PROJECT_EDITOR contexts
- [ ] Zoom shortcuts do NOT fire on DASHBOARD
- [ ] Zoom shortcuts do NOT fire on USER_PROFILE
- [ ] Zoom-in menu item shows [⌘] [+] on Mac, [Ctrl] [+] on Windows
- [ ] Zoom-out menu item shows [⌘] [-] on Mac, [Ctrl] [-] on Windows
- [ ] Reset Zoom menu item shows [⌘] [0] on Mac, [Ctrl] [0] on Windows
- [ ] Menu items are disabled on dashboard
- [ ] Clicking menu items dispatches jjodel:zoom events
- [ ] Reset Zoom option present with bi-arrow-counterclockwise icon

### M2 Analytics Modal (Phase 7)
- [ ] Modal opens from Metamodel → M2 Analytics menu item
- [ ] Menu item disabled on Dashboard (no metamodel context)
- [ ] Menu item disabled when no metamodels loaded
- [ ] Modal has slate gradient header with bi-graph-up icon
- [ ] Close button (×) in top-right corner works
- [ ] Clicking backdrop closes modal
- [ ] Clicking modal content does NOT close modal
- [ ] Classification gauge shows small/medium/large zones
- [ ] Gauge marker positioned correctly based on score (0-100)
- [ ] Gauge color zones: slate (0-30), orange (30-80), blue (80-100)
- [ ] Metamodel name displayed below gauge
- [ ] All 10 metrics rows display correctly
- [ ] Metrics with null values show "N/A" in orange
- [ ] LMC (%) shows percentage format (e.g., "16.7%")
- [ ] ASF shows decimal format (e.g., "2.0")
- [ ] EN/LIT shows combined format (e.g., "2/8")
- [ ] Close button in footer works
- [ ] Dark mode: Modal background changes to #1e293b
- [ ] Dark mode: Marker badge inverts (light bg, dark text)
- [ ] Dark mode: Section backgrounds change to #0f172a
- [ ] Smooth entrance/exit animations
- [ ] Mobile responsive (single column on small screens)

### Adaptive Tree View Sidebar (Phase 8)

**Resolution Detection**
- [ ] Monitor (≥2560px): Sidebar visible and open by default
- [ ] Desktop (1920-2559px): Sidebar visible but collapsed by default
- [ ] Laptop (<1920px): No sidebar visible, overlay mode only
- [ ] Resizing window updates resolution category dynamically

**Sidebar Mode (Desktop/Monitor)**
- [ ] Toggle button visible at top-left of sidebar
- [ ] Clicking toggle opens/closes sidebar
- [ ] Collapsed state shows only toggle + icon
- [ ] Open state shows header + tree content
- [ ] Width persisted to localStorage
- [ ] Resize handle visible on left edge when open
- [ ] Dragging resize handle adjusts width (250-500px range)
- [ ] Width clamped within MIN_WIDTH and MAX_WIDTH

**Overlay Mode (Laptop)**
- [ ] Overlay not visible by default
- [ ] Toggle from navbar opens overlay
- [ ] Backdrop covers entire screen with opacity
- [ ] Click on backdrop closes overlay
- [ ] ESC key closes overlay
- [ ] Close button in header closes overlay
- [ ] Element selection auto-closes overlay
- [ ] Smooth slide-in animation from right

**Keyboard Shortcut**
- [ ] ⌘B (Mac) / Ctrl+B (Windows) toggles tree view
- [ ] Shortcut only active in METAMODEL_EDITOR and PROJECT_EDITOR contexts
- [ ] Shortcut does NOT fire when typing in input fields
- [ ] Shortcut prevents browser default (bold text)

**Navbar Integration**
- [ ] TreeViewToggle button visible near layout controls
- [ ] Button shows diagram-2 icon
- [ ] Button has active state when sidebar is open
- [ ] Tooltip shows "Tree View (⌘B)" on Mac
- [ ] Tooltip shows "Tree View (Ctrl+B)" on Windows
- [ ] Button only visible when editing metamodel (not on dashboard)

**Tree Content**
- [ ] Metamodels listed at root level
- [ ] Packages nested under metamodels
- [ ] Classes nested under packages
- [ ] Attributes/References/Operations nested under classes
- [ ] Enum literals nested under enumerators
- [ ] Expand/collapse toggles work correctly
- [ ] First 2 levels auto-expanded on initial render
- [ ] Type-specific colored icon badges visible
- [ ] Abstract classes have outlined icon style
- [ ] Class extends info shows superclass names

**Selection Sync**
- [ ] Clicking tree node selects element in Redux state
- [ ] Selected node has highlight background
- [ ] Selection syncs with canvas (element highlighted)
- [ ] Canvas selection reflected in tree (if visible)

**localStorage Persistence**
- [ ] `jjodel_tree_view_open` stores open/closed state
- [ ] `jjodel_tree_view_width` stores sidebar width
- [ ] State persisted across page refreshes
- [ ] State persisted across sessions

**Dark Mode**
- [ ] Sidebar background changes to dark
- [ ] Borders adapt to dark mode
- [ ] Text colors adapt to dark mode
- [ ] Node hover states visible in dark mode
- [ ] Selected node highlight visible in dark mode

---

## APPENDIX: Related Documentation

- `/CLAUDE.md` - Design system and UI guidelines
- `/docs/redesign/JJODEL-UI-MASTER-SPEC.md` - Master specification
- `/docs/handover/HANDOVER-UI-REDESIGN-2026-01-21.md` - Previous handover (Phase 1)

---

*Document generated: January 22, 2026*
*Last updated: January 22, 2026 (Phase 8 additions - Adaptive Tree View Sidebar)*
*For questions, refer to the git history on branch `alfonso-frontend-dev`*
