# JJODEL UI DOCUMENTATION
## Version 2.x → 3.0 Redesign Reference

**Document Version:** 1.0  
**Created:** January 2026  
**Purpose:** UI/UX inventory, critique, and redesign specifications for Jjodel metamodeling tool  
**Target Display:** Apple Studio Display 27" (5K Retina)

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Screenshot Inventory](#2-screenshot-inventory)
3. [UI Critique by Area](#3-ui-critique-by-area)
4. [Recurring Patterns](#4-recurring-patterns)
5. [Design System v3.0](#5-design-system-v30)
6. [Component Specifications](#6-component-specifications)
7. [Implementation Notes](#7-implementation-notes)
8. [Mockups Reference](#8-mockups-reference)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Current State Assessment

Jjodel v2.x is a functional metamodeling tool with a comprehensive feature set. However, the UI presents several opportunities for improvement to achieve a more professional, enterprise-grade appearance.

### Key Strengths
- Comprehensive feature set (metamodeling, viewpoints, simulation)
- Flexible layout (resizable panels, collapsible sections)
- Monaco Editor integration for code editing
- Multi-level modeling support (M2 → M1 → M0)
- Console with REPL-style interaction

### Key Areas for Improvement
- Visual consistency across components
- Color palette refinement (currently too saturated)
- Form controls using browser defaults
- Modal/dialog styling inconsistency
- Typography hierarchy
- Spacing and density optimization

## 1.2 Design Goals for v3.0

1. **Professional & Enterprise-grade** — Inspire trust and confidence
2. **Slick & Minimal** — Clean without being sterile
3. **Elegant** — Refined details, thoughtful interactions
4. **Robust feel** — Convey stability and maturity
5. **Consistent** — Unified design language throughout

---

# 2. SCREENSHOT INVENTORY

## BATCH 1: Authentication Flow

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 1.1 | Login | Login form (assumed, image showed Registration) | — |
| 1.2 | Registration | Create account form with fields: First Name, Last Name, Nickname, Affiliation, Country, Email, Password | `image_1768553235326.png` |
| 1.3 | Password Recovery | "Retrieve your Password" with email input | `image_1768553344438.png` |

**Visual Characteristics:**
- Background: Chicago skyline photograph at sunset
- Card: White with slight transparency/blur
- Logo: Multicolor "Jjodel" at bottom of card
- Inputs: Teal border on focus
- Button: Small teal "Create" / "Retrieve"

---

## BATCH 2: Dashboard & Navigation

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 2.1 | Workspace Dashboard | Grid of all projects with action buttons | `image_1768553493810.png` |
| 2.2 | User Profile | Profile form + password change section | `image_1768553567333.png` |
| 2.3 | Menu: Jjodel | About, Roadmap, Project Settings, Logout | `image_1768553678735.png` |
| 2.4 | Menu: File | Recent Projects submenu with project list | `image_1768553702330.png` |
| 2.5 | Menu: Help | What's New, Homepage, Learn Jjodel, Getting Started, Video Tutorials, User Guide, Glossary, FAQ, Support | `image_1768553806086.png` |

**Visual Characteristics:**
- Sidebar: Left panel with Starred, Recently modified, Support sections
- Action buttons: 4 colored CTAs (teal, orange, gray, pink)
- Project cards: Uniform grid, minimal differentiation
- Right panel: "Your projects" summary with illustration

---

## BATCH 3: Project Management

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 3.1 | New Project (empty) | Project view with only default viewpoints | `image_1768554157205.png` |
| 3.2 | Project with content | List of metamodels, models, viewpoints | `image_1768554193781.png` |
| 3.3 | Dialog: Success | "The project is public" notification | `image_1768554236518.png` |
| 3.4 | Dialog: Warning | "Close without saving?" confirmation | `image_1768554267762.png` |

**Visual Characteristics:**
- Table: Simple with Name, Type, Operation columns
- Badges: M (green), V (blue) for type indication
- CTA buttons: Colored (teal, dark blue, orange)
- Dialogs: Large icon with radial glow, footer button area

---

## BATCH 4: Metamodel Editor - Core

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 4.1 | Editor Overview | Full editor with complex diagram | `image_1768554157205.png` |
| 4.2 | Features Panel | Floating panel: Package, Class, Enumerator | `image_1768554193781.png` |
| 4.3 | Structure Panel | Extended panel with Features section | `image_1768554236518.png` |
| 4.4 | Workbench Options | Bottom bar with Detail level, Grid, Snap | `image_1768554267762.png` |
| 4.5 | Context Menu (canvas) | Model actions: Edit, Delete, Up, Down, etc. | `image_1768554297776.png` |
| 4.6 | Context Menu (node) | Class actions: Edit, AI Suggest, Extend, Highlight, etc. | `image_1768554357846.png` |
| 4.7 | Property Dialog | Edit dialog for Class "Concept 1" | `image_1768554404468.png` |

**Visual Characteristics:**
- Canvas: White background with nodes and connections
- Nodes: Teal header, white body, dropdown fields
- Floating panels: Dark teal header, draggable
- Context menus: Dark background, keyboard shortcuts visible
- Property dialog: White, form-based, inconsistent with menus

---

## BATCH 5: Right Panel Tabs

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 5.1 | Tab: Properties | Name, Readonly, Dependencies, State | `image_1768554864639.png` |
| 5.2 | Tab: Tree View | Hierarchical model structure with colored badges | `image_1768554942087.png` |
| 5.3 | Tab: Viewpoints | Complete viewpoint tree with OCL/EX indicators | `image_1768555303110.png` |
| 5.4 | Tab: Node | Technical info: Zoom, Offset, Sub elements, Anchors | `image_1768555466778.png` |
| 5.5 | Tab: Console (empty) | REPL prompt with context keys | `image_1768555731363.png` |
| 5.6 | Tab: Console (with results) | Query results + shortcuts pills | `image_1768555764295.png` |

**Visual Characteristics:**
- Tabs: Pill-style, teal when active
- Tree View: Colored badges (M=teal, C=red, etc.)
- Console: Syntax highlighted JSON, clickable shortcuts
- Node: Anchor visualization as circular grid

---

## BATCH 6: Editor Layouts

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 6.1 | 50-50 Split | Equal canvas and panel | `image_1768555884492.png` |
| 6.2 | Full Page | Panel collapsed, canvas maximized | `image_1768555911140.png` |
| 6.3 | 70-30 Split | Canvas dominant, panel accessible | `image_1768555945285.png` |

**Visual Characteristics:**
- Resizable panels (implicit drag handle)
- Zoom controls relocate when panel collapses
- Tab bar remains visible even when narrow

---

## BATCH 7: Viewpoint Editor (Sub-tabs)

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 7.1 | Apply to | View configuration: Name, Exclusive, Priority, OCL | `image_1768556048673.png` |
| 7.2 | Template | Monaco editor with JSX, observed properties table | `image_1768556067846.png` |
| 7.3 | Style | Color pickers, CSS editor, CSS variables | `image_1768556088317.png` |
| 7.4 | Events | Event handlers: onDataUpdate, onDrag*, onResize* | `image_1768556114964.png` |
| 7.5 | Options | (Image not loaded) | `image_1768556129603.png` |

**Visual Characteristics:**
- Monaco Editor integration for code
- Color palette with visual swatches
- Collapsible sections
- Property binding tables

---

## BATCH 8: Project Example (DC - Dynamic Classification)

| ID | Screen | Description | File Reference |
|----|--------|-------------|----------------|
| 8.1 | Project Dashboard | DC v6.5 with metamodels, models, viewpoints | `image_1768556933560.png` |
| 8.2 | Class Diagram Metamodel | UML-like meta-metamodel | `image_1768556961121.png` |
| 8.3 | Drone CD | Class diagram with state machines, enums | `image_1768557004777.png` |
| 8.4 | Object Diagram + Simulation | Live instances with editable values | `image_1768557104023.png` |

**Visual Characteristics:**
- State machines embedded in class nodes
- Simulation panel with live values
- Instance inspector with state selection
- Multi-tab workflow (metamodel → model → instance)

---

# 3. UI CRITIQUE BY AREA

## 3.1 Authentication Screens

### Issues
1. **Background image too busy** — Distracts from form, competes for attention
2. **Logo multicolor** — Playful style conflicts with enterprise positioning
3. **Form card** — Transparency effect doesn't add value
4. **Input fields** — Teal border too saturated on focus
5. **Button** — Small, not prominent enough for primary action
6. **Spacing** — Dense field stacking, little breathing room

### Recommendations
- Solid or subtle gradient background
- Monochrome logo version
- Opaque card with subtle shadow
- Refined focus states
- Larger, more prominent CTA
- Increased vertical spacing between fields

---

## 3.2 Workspace Dashboard

### Issues
1. **Action buttons** — 4 different colors breaks visual hierarchy
2. **Project grid** — All cards identical, hard to scan
3. **Information density** — Too much at once
4. **Right panel illustration** — Takes space, adds little utility
5. **Footer** — Magenta/pink bar very prominent, distracting

### Recommendations
- Unify action buttons (primary + secondary styling)
- Add visual differentiation to project cards (icons, colors by type)
- Consider list/grid toggle
- Reduce footer prominence
- Add filtering/search capabilities

---

## 3.3 Metamodel Editor

### Issues
1. **Node styling** — Functional but lacks polish; borders too thin
2. **Connection lines** — Basic, could have more presence
3. **Floating panels** — Good concept but styling dated
4. **Property panel** — Very empty when collapsed, sparse when open
5. **Dialog inconsistency** — White dialog vs dark context menus

### Recommendations
- Enhanced node styling with shadows, better borders
- Curved connections with gradient strokes
- Modernized floating panels
- Richer property panel with contextual info
- Unified modal/popup styling

---

## 3.4 Context Menus & Dialogs

### Issues
1. **Style mismatch** — Dark menus vs white dialogs
2. **Property dialog** — Basic form, feels dated
3. **Dialog size** — Very tall, could be more compact
4. **Checkboxes** — Using native browser styling

### Recommendations
- Choose one style (recommend dark for menus, light for dialogs)
- Modern form controls throughout
- Compact dialogs with better density
- Custom checkbox/toggle components

---

## 3.5 Right Panel (Inspector)

### Issues
1. **Tab bar** — Crowded with 5 tabs
2. **Properties tab** — Very sparse, lots of empty space
3. **Tree View** — Badge colors arbitrary
4. **Node tab** — Very technical, unclear audience
5. **Console** — Powerful but overwhelming shortcut list

### Recommendations
- Consider grouping tabs or using icons
- Enrich Properties with more contextual data
- Systematize badge color coding
- Hide Node tab behind "Advanced" toggle
- Organize Console shortcuts by category

---

# 4. RECURRING PATTERNS

## 4.1 Color Usage

| Context | Current Color | Usage |
|---------|---------------|-------|
| Primary | #0d9488 (Teal) | Headers, links, active states |
| Secondary | #1e3a5f (Dark blue) | Some buttons, panel headers |
| Accent | #f97316 (Orange) | Alerts, warnings, CTAs |
| Danger | #dc2626 (Red) | Delete, error states |
| Success | #10b981 (Green) | Confirmations |

**Issue:** Colors are very saturated; teal especially feels "young" rather than enterprise.

## 4.2 Typography

- **Primary font:** Appears to be system default or basic sans-serif
- **Code font:** Monaco Editor default (Menlo/Consolas)
- **Hierarchy:** Limited — mostly size-based differentiation

## 4.3 Spacing

- Inconsistent padding in cards, panels
- Dense forms with limited breathing room
- Button padding inconsistent

## 4.4 Component Patterns

| Component | Style |
|-----------|-------|
| Buttons | Small, pill-shaped, various colors |
| Inputs | Outlined, teal focus border |
| Dropdowns | Native browser selects |
| Modals | Large icon + title + form |
| Menus | Dark background, white text |
| Panels | White with subtle borders |
| Tabs | Pill-style with active highlight |

## 4.5 Layout Patterns

- **Header:** Fixed, logo center, menu left, avatar right
- **Sidebar:** Collapsible tree navigation
- **Canvas:** Center, resizable
- **Inspector:** Right panel, tabbed interface
- **Footer:** Persistent status bar

---

# 5. DESIGN SYSTEM v3.0

## 5.1 Color Palette

### Dark Theme (Primary)

```css
:root[data-theme="dark"] {
  /* Base */
  --color-bg-primary: #08090a;
  --color-bg-secondary: #0f1012;
  --color-bg-tertiary: #16181a;
  --color-bg-elevated: rgba(255, 255, 255, 0.04);
  --color-bg-hover: rgba(255, 255, 255, 0.06);
  
  /* Borders */
  --color-border-primary: rgba(255, 255, 255, 0.08);
  --color-border-secondary: rgba(255, 255, 255, 0.04);
  --color-border-hover: rgba(255, 255, 255, 0.12);
  
  /* Text */
  --color-text-primary: #f0f0f0;
  --color-text-secondary: #a0a0a0;
  --color-text-tertiary: #606060;
  --color-text-inverse: #08090a;
  
  /* Accent - Refined Teal */
  --color-accent: #4fd1c5;
  --color-accent-hover: #5dddd1;
  --color-accent-muted: rgba(79, 209, 197, 0.15);
  --color-accent-subtle: rgba(79, 209, 197, 0.08);
  
  /* Semantic */
  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-error: #f87171;
  --color-info: #60a5fa;
}
```

### Light Theme

```css
:root[data-theme="light"] {
  /* Base */
  --color-bg-primary: #f8f9fa;
  --color-bg-secondary: #ffffff;
  --color-bg-tertiary: #f0f1f2;
  --color-bg-elevated: #ffffff;
  --color-bg-hover: #f0f1f2;
  
  /* Borders */
  --color-border-primary: #e2e4e8;
  --color-border-secondary: #eceef0;
  --color-border-hover: #d0d3d8;
  
  /* Text */
  --color-text-primary: #111418;
  --color-text-secondary: #5c6370;
  --color-text-tertiary: #9ca3af;
  --color-text-inverse: #ffffff;
  
  /* Accent - Deeper Teal for contrast */
  --color-accent: #0d9488;
  --color-accent-hover: #0f766e;
  --color-accent-muted: rgba(13, 148, 136, 0.12);
  --color-accent-subtle: rgba(13, 148, 136, 0.06);
  
  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

## 5.2 Typography

```css
:root {
  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'IBM Plex Mono', 'JetBrains Mono', monospace;
  
  /* Font Sizes */
  --text-xs: 0.6875rem;   /* 11px */
  --text-sm: 0.8125rem;   /* 13px */
  --text-base: 0.9375rem; /* 15px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.5rem;      /* 24px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Letter Spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
}
```

## 5.3 Spacing Scale

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

## 5.4 Border Radius

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

## 5.5 Shadows

```css
:root[data-theme="dark"] {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--color-accent-muted);
}

:root[data-theme="light"] {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-glow: 0 0 20px var(--color-accent-muted);
}
```

## 5.6 Transitions

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

# 6. COMPONENT SPECIFICATIONS

## 6.1 Buttons

### Primary Button
```css
.btn-primary {
  height: 36px;
  padding: 0 16px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}
```

### Secondary Button
```css
.btn-secondary {
  height: 36px;
  padding: 0 16px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
}
```

### Icon Button
```css
.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
}
```

## 6.2 Form Inputs

### Text Input
```css
.input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
}

.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}
```

### Select
```css
.select {
  width: 100%;
  height: 40px;
  padding: 0 36px 0 12px;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  outline: none;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,..."); /* Chevron */
  background-repeat: no-repeat;
  background-position: right 12px center;
}
```

### Toggle Switch
```css
.toggle {
  width: 44px;
  height: 24px;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-full);
  padding: 2px;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.toggle.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.toggle-thumb {
  width: 18px;
  height: 18px;
  background: var(--color-text-primary);
  border-radius: 50%;
  transition: transform var(--transition-normal);
}

.toggle.active .toggle-thumb {
  transform: translateX(20px);
}
```

## 6.3 Canvas Nodes

### Class Node
```css
.node {
  position: absolute;
  min-width: 180px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.node:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.node.selected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-muted), var(--shadow-lg);
}

.node-header {
  padding: 10px 14px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-accent);
  background: var(--color-accent-muted);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.node-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.node-body {
  padding: 12px 14px;
}
```

### Connection Point
```css
.connection-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-accent);
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}
```

## 6.4 Panels

### Floating Panel
```css
.floating-panel {
  position: absolute;
  min-width: 180px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.floating-panel-header {
  padding: 12px 14px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
}

.floating-panel-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}
```

### Right Inspector Panel
```css
.inspector-panel {
  width: 320px;
  height: 100%;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
}

.inspector-tabs {
  display: flex;
  gap: 4px;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-primary);
}

.inspector-tab {
  padding: 8px 14px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.inspector-tab:hover {
  color: var(--color-text-secondary);
  background: var(--color-bg-hover);
}

.inspector-tab.active {
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-sm);
}
```

## 6.5 Context Menu

```css
.context-menu {
  min-width: 220px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: 6px;
  box-shadow: var(--shadow-lg);
}

.context-menu-header {
  padding: 10px 12px;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-secondary);
  margin-bottom: 6px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.context-menu-item:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.context-menu-item.highlighted {
  color: var(--color-accent);
  background: var(--color-accent-subtle);
}

.context-menu-shortcut {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text-tertiary);
}
```

## 6.6 Dialogs

```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.dialog {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-secondary);
}

.dialog-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.dialog-body {
  padding: 24px;
}

.dialog-footer {
  padding: 16px 24px;
  background: var(--color-bg-tertiary);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

---

# 7. IMPLEMENTATION NOTES

## 7.1 Technology Assumptions

Based on the UI, the likely stack is:
- **Framework:** React (JSX in viewpoint templates)
- **Styling:** CSS (possibly CSS modules or styled-components)
- **Code Editor:** Monaco Editor
- **State Management:** Unknown (Redux? Context?)
- **Canvas Rendering:** Custom or library (possibly D3, Konva, or custom SVG)

## 7.2 Migration Strategy

### Phase 1: Design Tokens
1. Create CSS variables file with all tokens
2. Update existing components to use variables
3. Implement theme toggle (dark/light)

### Phase 2: Core Components
1. Buttons (primary, secondary, icon)
2. Form controls (input, select, toggle, checkbox)
3. Typography (headings, body, labels, code)

### Phase 3: Layout Components
1. Header redesign
2. Sidebar modernization
3. Panel system refinement
4. Footer simplification

### Phase 4: Canvas & Nodes
1. Node component redesign
2. Connection styling
3. Canvas background (dot grid)
4. Floating panels

### Phase 5: Dialogs & Menus
1. Unified context menu styling
2. Dialog component standardization
3. Toast/notification system

## 7.3 Files to Modify (Likely Targets)

```
/src
├── /styles
│   ├── variables.css      ← Design tokens
│   ├── reset.css          ← Base reset
│   └── themes.css         ← Theme definitions
├── /components
│   ├── /common
│   │   ├── Button.jsx     ← Button variants
│   │   ├── Input.jsx      ← Form inputs
│   │   ├── Select.jsx     ← Custom select
│   │   └── Toggle.jsx     ← Toggle switch
│   ├── /layout
│   │   ├── Header.jsx     ← Top bar
│   │   ├── Sidebar.jsx    ← Left navigation
│   │   └── Inspector.jsx  ← Right panel
│   ├── /canvas
│   │   ├── Node.jsx       ← Class/node component
│   │   ├── Connection.jsx ← Edge/arrow component
│   │   └── Canvas.jsx     ← Main canvas
│   └── /dialogs
│       ├── Modal.jsx      ← Base modal
│       └── ContextMenu.jsx ← Context menu
```

## 7.4 Testing Considerations

- Visual regression testing for component changes
- Cross-browser testing (Chrome, Firefox, Safari)
- Dark/light theme verification
- Accessibility audit (contrast, focus states)
- Performance testing for canvas with many nodes

---

# 8. MOCKUPS REFERENCE

## 8.1 Created Mockups

During this session, the following mockup files were created:

| File | Description |
|------|-------------|
| `jjodel-redesign.jsx` | Dark theme redesign concept |
| `jjodel-redesign-light.jsx` | Light theme version |
| `jjodel-advanced.jsx` | Advanced version with theme toggle |

## 8.2 Mockup Features Demonstrated

- **Color scheme:** Refined teal palette (dark: #4fd1c5, light: #0d9488)
- **Typography:** Inter + IBM Plex Mono
- **Nodes:** Glassmorphism effect, refined borders, connection points
- **Panels:** Modern floating panels with drag handles
- **Theme toggle:** Animated switcher with icon transitions
- **Canvas:** Dot grid pattern with subtle gradient overlay
- **Minimap:** Preview widget in corner
- **Footer:** Simplified, integrated with color scheme

## 8.3 Key Design Decisions

1. **Dark-first approach** — Better for extended use, professional feel
2. **Desaturated accent color** — More enterprise-appropriate teal
3. **Consistent shadows** — Layered depth system
4. **Micro-interactions** — Hover states, transitions on all interactive elements
5. **Information density** — Balanced, not cramped
6. **Typography hierarchy** — Clear distinction between labels, values, titles

---

# APPENDIX A: Color Mapping (v2 → v3)

| Element | v2.x Color | v3.0 Dark | v3.0 Light |
|---------|-----------|-----------|------------|
| Primary accent | #0d9488 | #4fd1c5 | #0d9488 |
| Background | #ffffff | #08090a | #f8f9fa |
| Panel headers | #1e3a5f | transparent | transparent |
| Borders | various | rgba(255,255,255,0.08) | #e2e4e8 |
| Text primary | #000000 | #f0f0f0 | #111418 |
| Text secondary | #666666 | #a0a0a0 | #5c6370 |

---

# APPENDIX B: Badge Color System

Proposed systematic badge colors for Tree View and Viewpoints:

| Element Type | Badge | Color (Dark) | Color (Light) |
|--------------|-------|--------------|---------------|
| Metamodel | M | #4fd1c5 (teal) | #0d9488 |
| Model | M | #60a5fa (blue) | #3b82f6 |
| Package | P | #a78bfa (purple) | #8b5cf6 |
| Class | C | #f87171 (red) | #ef4444 |
| Attribute | A | #fb923c (orange) | #f97316 |
| Reference | R | #facc15 (yellow) | #eab308 |
| Operation | O | #4ade80 (green) | #22c55e |
| Viewpoint | V | #c084fc (violet) | #a855f7 |
| Enum | E | #f472b6 (pink) | #ec4899 |

---

# APPENDIX C: Keyboard Shortcuts Reference

Current shortcuts observed (to preserve in v3):

| Action | Shortcut |
|--------|----------|
| Delete | ⌫ |
| Move up | ⌘ ↑ |
| Move down | ⌘ ↓ |
| Toggle auto-sizing | ⌘ T |
| Analytics | ⌘ A |
| Add View | ⌥ ⌘ A |
| Extend | ⌘ E |

---

**END OF DOCUMENT**

*This document should be saved and provided in future sessions along with repository access for implementation work.*
