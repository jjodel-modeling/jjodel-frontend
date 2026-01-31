# JJODEL COMPONENT ANALYSIS
## Frontend Structure & Styling Deep Dive

**Version:** 1.0
**Created:** January 2026
**Purpose:** Detailed analysis of existing components for redesign planning

---

## EXECUTIVE SUMMARY

### Current Architecture

```
Stack: React + Redux + SCSS + SVG
Styling: Component-scoped SCSS + Global variables
UI Library: Custom components (no external UI lib)
Theme: Light only (no dark mode)
```

### Key Findings

✅ **Strengths:**
- Modular component structure
- CSS variables already in use
- Consistent file organization
- SVG-based canvas rendering

⚠️ **Critical Issues:**
- **Color inconsistency** - Multiple conflicting color definitions across files
- **No design system** - Variables scattered, no single source of truth
- **Light theme only** - No dark mode infrastructure
- **Native form controls** - Browser default styling with minimal customization
- **Hardcoded values** - Many spacing/sizing values not tokenized
- **No typography scale** - Font sizes defined ad-hoc

---

## 1. FILE STRUCTURE

### SCSS Organization

```
/frontend/src/
├── styles/                          ← GLOBAL STYLES
│   ├── variables.scss               ← Design tokens (MESSY - needs cleanup)
│   ├── style.scss                   ← Global component styles
│   └── view.scss                    ← View/canvas specific styles
│
├── App.scss                         ← Root app styles, animations
├── index.scss                       ← CSS reset, root setup
├── mixins.scss                      ← SCSS mixins (barely used)
│
├── components/
│   ├── abstract/
│   │   ├── style.scss               ← Dock/tab system (MASSIVE - 828 lines)
│   │   ├── style_ap.scss            ← Additional panel styles
│   │   └── docking.scss             ← Docking behavior
│   │
│   ├── editors/
│   │   ├── editors.scss             ← Editor common styles
│   │   ├── console.scss             ← Console panel
│   │   ├── node-editor.scss         ← Node property editor
│   │   └── info.scss, mtm.scss, skeleton.scss
│   │
│   ├── alert/style.scss             ← Modals/dialogs
│   ├── contextMenu/style.scss       ← Context menus
│   ├── tooltip/mytooltip.scss       ← Tooltips
│   ├── metrics/metrics.scss         ← Metrics panel
│   └── logger/logger.scss           ← Logger component
│
├── pages/
│   └── components/
│       ├── style.scss               ← Page-level styles (navbar, footer)
│       └── navbar.scss              ← Navbar specific
│
└── graph/
    └── graphElement/graphElement.scss  ← Canvas nodes/edges
```

---

## 2. DESIGN TOKENS AUDIT

### 2.1 Color Variables - CHAOS REPORT

**Problem:** Colors defined in MULTIPLE places with DIFFERENT values:

#### Primary Color Definitions

| Variable | File | Value | Usage |
|----------|------|-------|-------|
| `--color` | variables.scss | `#2D4E62` | Primary teal |
| `--color` | style_ap.scss | `#233d4d` | Different dark teal! |
| `--color` | style.scss (pages) | `#233d4d` | Different again! |
| `--default-color` | variables.scss | `#233d4d` | Yet another |
| `--model-color` | variables.scss | `#233d4d` (CSS) + `purple` (SCSS) | Conflict! |

**Result:** 🔥 **NO SINGLE SOURCE OF TRUTH** 🔥

#### Accent Color Definitions

| Variable | File | Value | Notes |
|----------|------|-------|-------|
| `--accent` | variables.scss | `#2D4E62` | Same as primary?! |
| `--accent` | style_ap.scss | `#048BA8` | Bright teal |
| `--accent` | pages/style.scss | `#087E8B` | Different teal |
| `--secondary` | variables.scss | `#087e8b` | Lowercase variant |
| `--accent-secondary` | variables.scss | `#f3b700` | Yellow |

**Result:** 🔥 **EVERY FILE HAS DIFFERENT ACCENT COLORS** 🔥

#### Background Layers

Defined consistently across files, but overused:

```scss
--bg-1: white         // Main background
--bg-1-1: #fefefe     // Barely different
--bg-1-3: #fcfcfc     // Barely different
--bg-1-5: #f8f8f8     // Barely different
--bg-2: #f5f5f5       // Secondary bg
--bg-2-5: #EBEBEB     // Yet another gray
--bg-3: #e2e2e1       // Tertiary
--bg-3-1: #c3c3c1     // Border?
--bg-4: #8f908e       // Disabled
--bg-5: #525251       // Dark gray
```

**Too many levels** - Distinction between bg-1, bg-1-1, bg-1-3, bg-1-5 is **IMPERCEPTIBLE**.

#### Semantic Colors

Consistent across files:

```scss
--danger / --failure / --delete: #ed474a  (red)
--success: #3ddc97                        (green)
```

No `--warning` or `--info` in variables.scss (but used in alert.scss).

### 2.2 Typography - NO SYSTEM

#### Font Families

```scss
// Defined in variables.scss
--h1-size, --h2-size, --h3-size, --text-lg-size, etc.
```

But **NO font-family variables**! Fonts hardcoded:

- Mentioned: `Inter`, `Inter Tight`, `JetBrains Mono`, `Lekton`, `Anton`
- No central definition
- No font loading strategy visible

#### Font Scale - Inconsistent

```scss
--h1-size: 1.2em
--h1-lg-size: 1.4rem!important  // !important is a code smell
--h2-size: 1.2em                // Same as h1??
--h3-size: 1.1em
--text-lg-size: 1.1em           // Same as h3??
--text-md-size: 1em
--text-sm-size: 0.8em
--text-xs-size: 0.6875rem       // Only this one in view.scss
```

**Problems:**
- H1 and H2 same size
- H3 and text-lg same size
- Mix of `em` and `rem`
- No consistent scale

### 2.3 Spacing - HARDCODED EVERYWHERE

#### Variables Defined

```scss
--side-padding: 31px           // Used inconsistently
--sep-padding: 4em
--tab-sep: 8px
--tab-margin: 0.75rem
--space-1 through --space-16   // Only in view.scss, not in variables.scss
```

But **most spacing is hardcoded**:
- `padding: 0.3em`, `margin: 10px`, etc. everywhere
- No systematic scale

### 2.4 Border Radius

```scss
--radius: 4px
--tab-radius: 4px
--model-radius: var(--radius)
--btn-radius: 4px
```

**Good:** Consistent 4px radius
**Bad:** Redundant definitions

### 2.5 Shadows

**Only in App.scss:**

```scss
--smart-elevation-0 through --smart-elevation-24
```

Material Design shadow system, but **NOT USED IN MOST COMPONENTS**.

Most components use inline shadows:
```scss
box-shadow: 0 0 10px gray;  // alert.scss
box-shadow: 0 0 4px #aaaaaa;  // style_ap.scss
```

---

## 3. COMPONENT INVENTORY

### 3.1 Authentication (Auth.tsx + style.scss)

**Location:** `/pages/Auth.tsx` + `/styles/style.scss` (`.login` section)

#### Current Styling

```scss
.login {
  overflow: scroll;
  position: absolute;

  & form {
    position: relative;
    top: 20%!important;
    width: 500px;
    min-height: 350px;
  }

  & input {
    outline: 1px solid var(--secondary);  // Teal border
    padding: 2px 8px;
    border: none;
    height: var(--input-height);  // 26px
  }

  & input:focus {
    outline: 2px solid var(--secondary);  // Thicker on focus
  }

  & .login-button {
    background-color: var(--secondary);
    padding: 10px 20px!important;
    border: none;
  }
}

.login.bg {
  background-image: url('../static/img/101.jpg');  // Chicago skyline
  background-size: cover;

  & form {
    opacity: 0.9;  // Semi-transparent form
  }
}
```

#### Issues

- ❌ Background image too busy
- ❌ Form semi-transparent (opacity 0.9) - accessibility issue
- ❌ Input height only 26px - too small
- ❌ Button small and not prominent
- ❌ No dark mode variant

#### Components

- Login form (`action: 'login'`)
- Register form (`action: 'register'`)
- Password recovery (`action: 'retrieve-password'`)

---

### 3.2 Alerts & Dialogs (Alert.tsx + alert/style.scss)

**Location:** `/components/alert/Alert.tsx` + `/components/alert/style.scss`

#### Current Styling

```scss
.alert-container, .dialog-container {
  position: absolute;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.3);  // Dark overlay
  z-index: 9999;
}

.alert-card, .dialog-card {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 20px;
  width: 450px;
  height: 280px;
  background-color: whitesmoke;  // Hardcoded!
  border-radius: calc(var(--radius) * 3);  // 12px
  box-shadow: 0 0 10px gray;  // Inline shadow

  h1 {
    font-weight: 600;
    font-size: 1.5em;
    color: var(--accent)!important;
    text-align: center;
  }
}

.alert-header {
  margin: 20px auto;
  width: 80px;
  height: 80px;
  padding: 10px 10px;
  border-radius: 50px;
  background-color: #E1FAF2;  // Success green bg (hardcoded)

  & .alert-sign-inner::before {
    content: '\F26B';  // Bootstrap icon checkmark
    font-family: bootstrap-icons;
    font-size: 32px;
    color: #31C79B;  // Hardcoded green
  }
}

.alert-card.error {
  .alert-header {
    background-color: #FCEDF2;  // Error red bg

    .alert-sign-inner::before {
      content: '\F333';  // X icon
      color: #DF4376;  // Hardcoded red
    }
  }
}
```

#### Issues

- ❌ **Hardcoded colors** everywhere (whitesmoke, #E1FAF2, #31C79B, etc.)
- ❌ **Large icon with radial glow** - too prominent
- ❌ **Fixed size** (450x280px) - not responsive
- ❌ No dark mode
- ⚠️ Uses Bootstrap Icons via font (unicode)

#### Variants

- Success (green checkmark)
- Error (red X)
- Warning/Dialog (orange question mark)

---

### 3.3 Context Menu (contextMenu/style.scss)

**Location:** `/components/contextMenu/style.scss`

#### Current Styling

```scss
.context-menu {
  position: absolute;
  z-index: 1001;
  width: 230px;
  border-radius: 6px!important;
  border: 1px solid #233d4d;  // Hardcoded dark teal
  color: white;
  background: #233d4d;  // Dark background
  padding: 8px;

  .name {
    font-size: 0.9rem;
    font-weight: bold;
  }

  .item {
    cursor: pointer;
    padding: 3px 8px;
    font-weight: 200;
    font-size: 0.75rem;
    display: flex;

    &:hover {
      background-color: var(--accent);  // Teal on hover
      border-radius: var(--radius);
    }

    i.bi {
      color: white !important;
      font-size: 1.2em;
      width: 1.5ic;
    }
  }
}
```

#### Issues

- ✅ **Good:** Dark background works well
- ❌ **Hardcoded dark color** (`#233d4d`) instead of using variable
- ❌ **Fixed width** (230px)
- ❌ **Small font** (0.75rem for items)
- ⚠️ Submenu positioning complex (`.submenu-holder.hoverable>.content`)

---

### 3.4 Edit Panel / Property Editor (contextMenu/style.scss)

**Location:** `/components/contextMenu/style.scss` (`.edit-panel-container`)

#### Current Styling

```scss
.edit-panel-container {
  position: absolute;
  z-index: 9999;
  border-radius: 6px !important;
  min-width: 350px;
  min-height: 160px;
  color: var(--color) !important;
  max-width: 600px;
  background-color: rgba(255, 255, 255, 0.75);  // Semi-transparent
  backdrop-filter: blur(10px);  // Glassmorphism
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 0.5px solid rgba(0, 0, 0, 0.5);

  &>.dialog-footer {
    width: 100%;
    height: 50px;
    padding: 10px;
    background-color: var(--bg-2-5);  // #EBEBEB
    display: flex;
    align-items: center;
    justify-content: flex-end;

    &>button {
      font-size: 0.8rem;
      border: 2px solid transparent;
      color: white;
      background-color: var(--color);
      padding: 1px 5px;
      border-radius: 3px;

      &:hover {
        border: 2px solid var(--color);
        background-color: transparent;
        color: var(--color);
      }
    }
  }
}
```

#### Issues

- ⚠️ **Glassmorphism effect** - might not work well on all backgrounds
- ❌ **Button too small** (padding: 1px 5px)
- ❌ Footer background hardcoded
- ✅ **Good:** Modern backdrop-filter usage

---

### 3.5 Dock System (abstract/style.scss)

**Location:** `/components/abstract/style.scss`

**Size:** 828 lines (!!)

#### Current Styling

This is the **LARGEST SCSS FILE** in the project, implementing a custom dock/tab system.

```scss
.dock-tab {
  box-sizing: border-box;
  position: relative;
  display: block;
  min-width: 30px;
  padding: 0px;
  font-weight: 400;
  margin-top: 6px;
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
  border: 1px solid var(--bg-3);
  border-top: 3px solid var(--bg-3);
  cursor: pointer;
  float: left;
  margin-right: 10px;
  background: var(--dock-bg);
  top: 3px;
  transition: top 0.3s;

  &:hover {
    color: var(--accent-50);  // Gray on hover
    border-top: 3px solid var(--accent-50);
    top: 0px;  // Lifts up on hover
  }

  &.dock-tab-active {
    border-top: 3px solid var(--terziary)!important;  // Pink/red
    color: var(--terziary);
    top: 0px;
  }
}

.dock-divider {
  flex: 0 0 4px;
  background: var(--bg-2-5);
  border-left: 1px solid var(--bg-1);
  border-right: 2px solid var(--bg-1);
  z-index: 1;

  &:hover {
    background-color: var(--accent);  // Teal on hover
  }
}
```

#### Issues

- ❌ **Huge file** - should be split into smaller modules
- ❌ **Active tab color** (`--terziary: #EE4266` pink) - inconsistent with brand
- ⚠️ Hover animation (tab lifts up) - nice but might be too playful
- ✅ **Good:** Comprehensive drag-and-drop system

---

### 3.6 Navbar & Footer (pages/components/style.scss)

**Location:** `/pages/components/style.scss`

#### Footer

```scss
.footer {
  width: 100%;
  display: flex;
  bottom: 0;
  font-weight: 200;
  background: var(--color);  // Dark teal
  color: var(--bg-3);  // Light gray text
  z-index: 1000;
  border-top: 1px solid var(--color);

  label {
    color: silver!important;
    border-right: 1px solid var(--bg-5);
    padding: 0.25em 2em 0.25em 2em;
    font-family: Anton;  // Special font for footer
  }

  .jjodel {
    font-family: Anton;  // Brand name in Anton
    transition: color 0.3s!important;

    &:hover {
      color: white!important;
    }
  }
}
```

#### Issues

- ❌ **Special font** (Anton) only for footer - inconsistent
- ❌ **Dark background** - doesn't match light UI
- ⚠️ Many absolute-positioned elements

---

### 3.7 Form Controls (styles/style.scss)

#### Input

```scss
.input {
  width: 70%;
  outline: none;
  font-size: 0.9rem;
  appearance: none;
  height: min-content;
  border-radius: $radius;  // 4px
  border: 1px solid $border-color;  // #0000005c

  &:focus {
    border: 1px dashed $border-color;
  }
}
```

#### Checkbox (Custom Toggle)

```scss
.input[type='checkbox'] {
  background-image: url("../static/svg/toggle-off.svg");
  background-repeat: no-repeat;
  background-size: cover;
  cursor: pointer;
  width: 1lh;  // Line-height unit
  height: 1lh;
  background-color: transparent;
  border: none;

  &:checked {
    background-image: url("../static/svg/toggle-on.svg");
  }
}
```

#### Select

```scss
.select {
  width: 50%;
  outline: none;
  font-size: 0.9rem;
  height: min-content;
  border-radius: $radius;
  border: 1px solid $border-color;

  &:focus {
    border: 1px dashed $border-color;
  }
}
```

#### Issues

- ❌ **Dashed border on focus** - unusual choice
- ❌ **Percentage widths** (70%, 50%) - not flexible
- ✅ **Good:** Custom toggle SVGs
- ❌ **No disabled states** properly styled

---

### 3.8 Buttons (styles/style.scss)

#### Generic Button

```scss
.btn {
  padding: 0.3em;
  height: min-content;
  width: fit-content;
  margin-top: auto;
  margin-bottom: auto;
  line-height: normal;
  border-radius: 0.4em;
}
```

#### Add Button

```scss
.button-add {
  background: var(--background-color-add);  // Green
  border-color: var(--border-color-1);
  color: var(--palette-w);  // White

  &:hover {
    color: var(--palette-w-hover);
    background: var(--palette-1);  // Dark teal on hover
  }
}
```

#### Delete Button

```scss
.btn-delete {
  color: var(--palette-w);
  background: var(--palette-g);  // Gray

  &:hover {
    color: var(--palette-w-hover);
    background: var(--palette-r);  // Red on hover
  }

  border: none;
  padding: 0;
  width: 1.9em;
  height: 1.9em;
  border-radius: 0.4rem;
  font-size: 1rem;
}
```

#### Issues

- ❌ **Too small** (padding: 0.3em)
- ❌ **Icon buttons fixed size** (1.9em) - should scale
- ❌ **Color variables confusing** (`--palette-1`, `--palette-w`, etc.)
- ⚠️ Add button changes color completely on hover (green → teal)

---

## 4. CANVAS & NODES

### 4.1 Node Styling

**Location:** Not directly visible in provided files, likely in `/graph/` or viewpoint system

**From variables.scss:**

```scss
--model-color: rgb(45, 78, 98)!important;  // Dark teal
--model-accent: #087E8B;
--model-accent-secondary: #f3b700;  // Yellow
--model-background: white;
--model-radius: var(--radius);
--model-shadow: 0 0 6px silver;
```

### 4.2 Edge Styling

**From App.scss:**

```scss
[data-nodetype="Edge"] {
  path {
    transition: all 400ms;  // Smooth path updates
  }
}

.Edge, .VoidEdge {
  left: calc(-1 * var(--left)) !important;
  top: calc(-1 * var(--top)) !important;
}
```

#### Issues

- ❌ **Shadow too soft** (0 0 6px silver) - low contrast
- ❌ **Edge transitions** might lag on large graphs

---

## 5. PAIN POINTS SUMMARY

### 5.1 Critical Issues

| ID | Issue | Severity | Effort to Fix |
|----|-------|----------|---------------|
| **P01** | Color variable chaos - no single source of truth | 🔴 **CRITICAL** | Medium |
| **P02** | No dark mode infrastructure | 🔴 **HIGH** | High |
| **P03** | Too many near-identical background shades | 🟡 **MEDIUM** | Low |
| **P04** | Typography not systematized | 🔴 **HIGH** | Medium |
| **P05** | Hardcoded spacing everywhere | 🟡 **MEDIUM** | High |
| **P06** | Form controls too small | 🟡 **MEDIUM** | Low |
| **P07** | Alert/dialog hardcoded colors | 🟡 **MEDIUM** | Low |
| **P08** | Dock tab active color (pink) inconsistent | 🟡 **MEDIUM** | Low |
| **P09** | No consistent shadow system | 🟢 **LOW** | Medium |
| **P10** | Mix of em/rem/px units | 🟢 **LOW** | High |

### 5.2 Architectural Issues

- **No UI component library** - Everything custom-built
- **SCSS variables vs CSS variables** - Mix of both, inconsistent usage
- **File organization** - Some components have dedicated SCSS, others inline
- **No theming system** - Would need to refactor for dark mode
- **Responsive design** - Mostly fixed sizes, few breakpoints

---

## 6. MIGRATION STRATEGY

### Phase 1: Design Tokens (CRITICAL)

**Goal:** Create single source of truth for all design values

**Tasks:**
1. Create `/styles/tokens/` directory
2. Define color system:
   - `colors-base.scss` - Primitive colors
   - `colors-semantic.scss` - Semantic mapping
   - `colors-dark.scss` - Dark theme overrides
3. Define typography:
   - `typography.scss` - Font families, sizes, weights
4. Define spacing:
   - `spacing.scss` - Systematic scale (4px base)
5. Define shadows, radius, transitions

**Files to create:**
```
/styles/tokens/
├── index.scss          ← Imports all tokens
├── colors.scss         ← All color definitions
├── typography.scss     ← Font system
├── spacing.scss        ← Spacing scale
├── shadows.scss        ← Shadow system
├── radius.scss         ← Border radius
└── transitions.scss    ← Animation timings
```

**Files to deprecate:**
- `/styles/variables.scss` (replace with tokens)

### Phase 2: Component Refactor

**Priority order:**

1. **Form controls** (input, select, checkbox) - Most visible
2. **Buttons** (all variants)
3. **Alerts/Dialogs** - High impact
4. **Context menus**
5. **Dock system** - Largest file, needs splitting

### Phase 3: Dark Theme

**Approach:**
- Use CSS custom properties with `[data-theme="dark"]` selector
- Keep SCSS for build-time variables
- Leverage existing `--bg-*` pattern, redefine for dark

### Phase 4: Polish

- Micro-animations
- Focus states
- Loading states
- Hover effects

---

## 7. RECOMMENDED APPROACH

### Option A: Conservative (Recommended)

**Keep existing structure, improve systematically**

✅ Pros:
- Lower risk of breaking existing components
- Can be done incrementally
- Team familiar with structure

❌ Cons:
- Still stuck with some legacy decisions
- SCSS file size issues remain

**Steps:**
1. Create token system alongside existing variables
2. Migrate components one-by-one to use tokens
3. Deprecate old variables when all refs removed

### Option B: Aggressive

**Introduce UI component library (e.g., Radix, Headless UI)**

✅ Pros:
- Modern components out of the box
- Accessibility built-in
- Less custom CSS to maintain

❌ Cons:
- **HIGH RISK** - requires rewriting many components
- Learning curve for team
- May conflict with existing canvas/graph system

**Not recommended given "conservative approach" requirement.**

---

## 8. NEXT STEPS

### Immediate Actions

1. ✅ **Create design token system** (Section 5 of requirements doc)
2. **Audit all color usages** - Find/replace all hardcoded colors
3. **Create component checklist** - Which components need restyling
4. **Set up dark theme infrastructure** - Even if not fully implemented yet

### Questions to Answer

1. **Font Loading:** Should we load Inter/IBM Plex Mono via CDN or self-host?
2. **Button Variants:** How many button variants do we need? (primary, secondary, danger, ghost, etc.)
3. **Input Sizes:** Should inputs have size variants (sm, md, lg)?
4. **Icon Strategy:** Continue with Bootstrap Icons font, or switch to SVG sprite?
5. **Transition Speed:** Should all transitions be same speed or vary by component?

---

## APPENDIX A: File-by-File Color Audit

### variables.scss

```scss
--color: #2D4E62
--accent: #2D4E62
--accent-secondary: #f3b700
--secondary: #087e8b
--terziary: #EE4266
--danger: #ed474a
--success: #3ddc97
```

### abstract/style_ap.scss

```scss
--color: #233d4d        // DIFFERENT from variables.scss!
--accent: #048BA8       // DIFFERENT!
--secondary: #048BA8
--terziary: #5F0F40     // DIFFERENT!
```

### pages/components/style.scss

```scss
--color: #233d4d
--accent: #087E8B       // DIFFERENT from both above!
--secondary: #087e8b
```

**Recommendation:** Delete all per-file color definitions, use only tokens.

---

## APPENDIX B: Typography Usage

### Font Families Found

- `Inter` - Modern sans-serif (mentioned but not loaded?)
- `Inter Tight` - Condensed variant
- `JetBrains Mono` - Monospace for code
- `Lekton` - Alternative monospace
- `Anton` - Display font (only in footer!)
- `-apple-system, BlinkMacSystemFont` - System fallbacks

### Font Loading Issues

No `@font-face` declarations found in SCSS. Fonts likely loaded via HTML or external CSS not in scope.

**Recommendation:** Add explicit font loading in token system.

---

## APPENDIX C: Component Complexity Matrix

| Component | Lines of SCSS | Complexity | Refactor Priority |
|-----------|---------------|------------|-------------------|
| Dock System | 828 | Very High | Medium (risky) |
| Auth/Login | ~150 | Medium | High |
| Alerts/Dialogs | ~185 | Medium | High |
| Context Menu | ~150 | Medium | High |
| Form Controls | ~100 | Low | **HIGHEST** |
| Buttons | ~80 | Low | **HIGHEST** |
| Footer | ~200 | Medium | Low |
| Canvas/Nodes | Unknown | High | Medium |

**Strategy:** Start with low-complexity, high-impact (form controls, buttons).

---

**END OF ANALYSIS**

*This document should be used alongside jjodel-requirements.md and jjodel-ui-documentation.md for implementation planning.*
