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
18. [File Inventory](#18-file-inventory)
19. [Technical Notes](#19-technical-notes)
20. [Testing Checklist](#20-testing-checklist)

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

## 18. FILE INVENTORY

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

### Existing Files Modified (Phase 3)

| File Path | Changes |
|-----------|---------|
| `frontend/src/components/abstract/tabs/MetamodelTab.tsx` | Added FeaturesPalette, drop handler |
| `frontend/src/components/abstract/Dock.tsx` | Fixed layout change to not reset tabs |
| `frontend/src/components/toolbar/ToolBar.tsx` | Commented out toolbar content |

---

## 19. TECHNICAL NOTES

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

## 20. TESTING CHECKLIST

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

---

## APPENDIX: Related Documentation

- `/CLAUDE.md` - Design system and UI guidelines
- `/docs/redesign/JJODEL-UI-MASTER-SPEC.md` - Master specification
- `/docs/handover/HANDOVER-UI-REDESIGN-2026-01-21.md` - Previous handover (Phase 1)

---

*Document generated: January 22, 2026*
*Last updated: January 22, 2026 (Phase 3 additions)*
*For questions, refer to the git history on branch `alfonso-frontend-dev`*
