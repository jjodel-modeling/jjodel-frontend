# JJODEL UI REDESIGN - ACTION PLAN
## Roadmap from Current State to v3.0

**Version:** 1.0
**Created:** January 2026
**Status:** Ready for Implementation

---

## EXECUTIVE SUMMARY

### Current State
- ✅ Functional React/Redux/SCSS application
- ❌ **Color chaos** - Multiple conflicting definitions across files
- ❌ **No design system** - Hardcoded values everywhere
- ❌ **Light theme only** - No dark mode
- ❌ **Typography inconsistent** - No systematic font scale

### Target State (v3.0)
- ✅ Unified design token system
- ✅ Dark + Light themes
- ✅ Professional, enterprise-grade appearance
- ✅ Consistent typography and spacing
- ✅ Modern component styling
- ✅ Maintained functionality (no breaking changes)

---

## PHASE BREAKDOWN

### 🎯 PHASE 1: DESIGN TOKENS (Week 1-2)
**Status:** Ready to start
**Priority:** 🔴 **CRITICAL**

Create single source of truth for all design values.

#### Deliverables

```
/frontend/src/styles/tokens/
├── index.scss              ← Master import
├── colors-light.scss       ← Light theme palette
├── colors-dark.scss        ← Dark theme palette
├── colors-semantic.scss    ← Semantic color mapping
├── typography.scss         ← Font system
├── spacing.scss            ← Spacing scale
├── shadows.scss            ← Shadow system
├── radius.scss             ← Border radius
├── transitions.scss        ← Animation timings
└── z-index.scss            ← Z-index scale
```

#### Tasks

**1.1 Create Token Structure**
- [ ] Create `/styles/tokens/` directory
- [ ] Set up `index.scss` to import all token files
- [ ] Update `App.scss` to import tokens instead of old variables

**1.2 Define Color System**
- [ ] Create `colors-light.scss` with palette from jjodel-ui-documentation.md
- [ ] Create `colors-dark.scss` with dark theme palette
- [ ] Create `colors-semantic.scss` for semantic mapping (success, error, etc.)
- [ ] Add theme switcher infrastructure (`[data-theme="dark"]`)

**1.3 Define Typography**
- [ ] Add Inter font loading (Google Fonts or self-hosted)
- [ ] Add IBM Plex Mono font loading
- [ ] Create typography scale (--text-xs through --text-xl)
- [ ] Define font weights (--font-normal, --font-medium, --font-semibold)
- [ ] Set line heights and letter spacing

**1.4 Define Spacing**
- [ ] Create spacing scale (--space-1 through --space-16)
- [ ] Document spacing usage guidelines

**1.5 Define Other Tokens**
- [ ] Border radius scale (--radius-sm, --radius-md, --radius-lg)
- [ ] Shadow scale (--shadow-sm through --shadow-xl)
- [ ] Transition timings (--transition-fast, --transition-normal, --transition-slow)
- [ ] Z-index scale (--z-dropdown, --z-modal, --z-tooltip, etc.)

**1.6 Migration Prep**
- [ ] Create deprecation list for old variables
- [ ] Document token usage in README or design-tokens.md
- [ ] Set up Figma tokens (optional, for design-dev sync)

#### Success Criteria
- ✅ All tokens defined in one place
- ✅ Dark and light themes working (switchable)
- ✅ Zero color/spacing hardcoded values in token files
- ✅ Documentation for token usage

---

### 🎨 PHASE 2: CORE COMPONENTS (Week 3-5)
**Status:** Pending Phase 1
**Priority:** 🔴 **HIGH**

Restyle most-used components for maximum visual impact.

#### Component Priority Order

**2.1 Form Controls (Week 3)**

Highest impact, lowest complexity.

- [ ] **Input** - Text, email, password variants
  - Height: 40px (up from 26px)
  - Padding: 0 12px
  - Focus state: Accent color ring (not dashed border)
  - Disabled state
  - Error state

- [ ] **Select** - Dropdown
  - Custom chevron icon (no native arrow)
  - Consistent with input styling
  - Hover/focus states

- [ ] **Checkbox** - Already has custom SVGs, update colors
  - Use token colors instead of hardcoded
  - Focus ring

- [ ] **Toggle Switch** - Create new component
  - 44x24px
  - Smooth animation
  - Accent color when active

**Files to modify:**
- `/styles/style.scss` (`.input`, `.select`, etc.)
- Create `/components/common/Input.tsx` if needed
- Create `/components/common/Select.tsx` if needed

**2.2 Buttons (Week 3)**

- [ ] **Primary Button**
  - Height: 36px
  - Padding: 0 16px
  - Background: `var(--color-accent)`
  - Border-radius: `var(--radius-md)`
  - Hover state with smooth transition

- [ ] **Secondary Button**
  - Outlined style
  - Border: 1px solid
  - Background transparent → hover fill

- [ ] **Icon Button**
  - 32x32px
  - Circular or square variants
  - Hover background

- [ ] **Danger Button**
  - Red variant for destructive actions

**Files to modify:**
- `/styles/style.scss` (`.btn`, `.button-add`, `.btn-delete`, etc.)
- Consolidate button styles

**2.3 Alerts & Dialogs (Week 4)**

- [ ] **Alert Component** (success/error/warning)
  - Remove large icon with glow (too prominent)
  - Simpler, more subtle design
  - Use token colors
  - Compact size
  - Backdrop blur

- [ ] **Dialog Component**
  - Modal with overlay
  - Consistent header/footer
  - Max-width: 480px
  - Rounded corners (--radius-xl)

**Files to modify:**
- `/components/alert/style.scss`
- `/components/alert/Alert.tsx`
- `/components/alert/Dialog.tsx`

**2.4 Context Menu (Week 4)**

- [ ] Update colors to use tokens
- [ ] Increase font size (0.75rem → 0.8125rem)
- [ ] Add subtle shadow
- [ ] Improve submenu positioning

**Files to modify:**
- `/components/contextMenu/style.scss`

**2.5 Tooltips (Week 5)**

- [ ] Consistent with context menu styling
- [ ] Small font (--text-xs)
- [ ] Dark background
- [ ] Arrow pointer

**Files to modify:**
- `/components/tooltip/mytooltip.scss`

#### Success Criteria
- ✅ All core components use design tokens
- ✅ No hardcoded colors in component SCSS
- ✅ Dark theme works on all components
- ✅ Consistent sizing and spacing

---

### 🏗️ PHASE 3: LAYOUT COMPONENTS (Week 6-7)
**Status:** Pending Phase 2
**Priority:** 🟡 **MEDIUM**

Restyle navigation, panels, and structural elements.

#### Components

**3.1 Authentication Screens (Week 6)**

- [ ] Remove busy background image
- [ ] Solid color or subtle gradient background
- [ ] Opaque form card (no transparency)
- [ ] Larger inputs (40px height)
- [ ] Prominent CTA button
- [ ] Monochrome logo

**Files to modify:**
- `/pages/Auth.tsx`
- `/styles/style.scss` (`.login` section)
- `/pages/auth.scss`

**3.2 Dashboard (Week 6)**

- [ ] Unify action button colors (no 4 different colors)
- [ ] Add visual differentiation to project cards
- [ ] Improve information density
- [ ] Update right panel illustration

**Files to modify:**
- `/pages/AllProjects.tsx`
- `/pages/components/Dashboard.tsx`
- `/pages/components/Cards.tsx`
- Related SCSS files

**3.3 Navbar (Week 6)**

- [ ] Update colors to use tokens
- [ ] Consistent hover states
- [ ] Logo sizing
- [ ] Menu items spacing

**Files to modify:**
- `/pages/components/Navbar.tsx`
- `/pages/components/navbar.scss`

**3.4 Footer (Week 7)**

- [ ] Reduce prominence (currently dark teal, very visible)
- [ ] Remove special font (Anton)
- [ ] Simplify layout
- [ ] Update colors

**Files to modify:**
- `/pages/components/style.scss` (`.footer` section)

**3.5 Dock/Tab System (Week 7)**

**WARNING:** This is the most complex component (828 lines of SCSS).

Approach: **Conservative refactor only**
- [ ] Update colors to use tokens
- [ ] Keep existing structure
- [ ] Fix active tab color (pink → accent color)
- [ ] Consider splitting into smaller files (optional)

**Files to modify:**
- `/components/abstract/style.scss`
- `/components/abstract/style_ap.scss`

#### Success Criteria
- ✅ All layout components themed
- ✅ Consistent navigation experience
- ✅ Reduced visual noise
- ✅ Professional appearance

---

### 🎨 PHASE 4: CANVAS & NODES (Week 8-9)
**Status:** Pending Phase 3
**Priority:** 🟡 **MEDIUM**

Update canvas elements (nodes, edges, panels).

#### Components

**4.1 Canvas Nodes (Week 8)**

- [ ] Enhanced node styling
  - Refined borders (1px → 1.5px)
  - Better shadows (use shadow tokens)
  - Improved hover states
  - Selection ring (accent color)

- [ ] Node headers
  - Update background color
  - Better typography
  - Icon spacing

**Files to modify:**
- Files in `/graph/graphElement/`
- Viewpoint templates (JSX-based, might need careful changes)

**4.2 Edges/Connections (Week 8)**

- [ ] Update stroke colors
- [ ] Improve hover states
- [ ] Optimize transitions (might affect performance)

**4.3 Floating Panels (Week 9)**

- [ ] Update panel styling
- [ ] Consistent with dock system
- [ ] Better drag handles
- [ ] Close button styling

**Files to modify:**
- Component-specific SCSS files

**4.4 Right Panel (Inspector) (Week 9)**

**Tabs:**
- Properties
- Tree View
- Viewpoints
- Node
- Console
- **🆕 AI** (new tab, Phase 2 of requirements)

Tasks:
- [ ] Update tab bar styling
- [ ] Improve tab active state
- [ ] Better badge colors (M, C, V, etc.)
- [ ] Console syntax highlighting colors
- [ ] Prepare for AI tab addition (don't implement yet)

**Files to modify:**
- `/components/editors/` files
- Panel-specific SCSS

#### Success Criteria
- ✅ Canvas nodes look modern and polished
- ✅ No performance regression
- ✅ Consistent with overall design system
- ✅ Selection/hover states clear

---

### ✨ PHASE 5: POLISH & QA (Week 10-11)
**Status:** Pending Phase 4
**Priority:** 🟢 **LOW**

Final refinements and quality assurance.

#### Tasks

**5.1 Micro-interactions (Week 10)**

- [ ] Button hover/press animations
- [ ] Input focus animations
- [ ] Modal enter/exit transitions
- [ ] Tooltip fade-in
- [ ] Loading spinners
- [ ] Toast notifications

**5.2 Focus States (Week 10)**

- [ ] All interactive elements have visible focus ring
- [ ] Keyboard navigation works
- [ ] Tab order logical

**5.3 Dark Theme Refinement (Week 11)**

- [ ] Audit all components in dark mode
- [ ] Fix contrast issues
- [ ] Adjust shadows for dark backgrounds
- [ ] Test theme switching

**5.4 Accessibility Audit (Week 11)**

- [ ] Color contrast checker (WCAG AA)
- [ ] Screen reader compatibility (basic)
- [ ] Keyboard-only navigation test
- [ ] Form validation error messages

**5.5 Cross-browser Testing (Week 11)**

- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**5.6 Performance Testing (Week 11)**

- [ ] Canvas with 500+ nodes (benchmark)
- [ ] CSS file size check
- [ ] Animation performance (60fps)

**5.7 Documentation (Week 11)**

- [ ] Update design system documentation
- [ ] Component usage guide
- [ ] Token reference
- [ ] Migration notes for future developers

#### Success Criteria
- ✅ All interactions smooth (60fps)
- ✅ Dark/light themes fully functional
- ✅ WCAG AA contrast compliance
- ✅ Works on all target browsers
- ✅ Documentation complete

---

## TIMELINE SUMMARY

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 1: Design Tokens** | 2 weeks | None |
| **Phase 2: Core Components** | 3 weeks | Phase 1 |
| **Phase 3: Layout Components** | 2 weeks | Phase 2 |
| **Phase 4: Canvas & Nodes** | 2 weeks | Phase 3 |
| **Phase 5: Polish & QA** | 2 weeks | Phase 4 |
| **TOTAL** | **11 weeks** | Sequential |

**Target Completion:** ~3 months from start

---

## RISK MITIGATION

### High-Risk Areas

| Risk | Mitigation |
|------|------------|
| **Dock system refactor breaks functionality** | Conservative approach: only update colors/tokens, don't restructure |
| **Canvas performance regression** | Benchmark before/after, optimize transitions |
| **Dark theme reveals hidden bugs** | Incremental testing, component-by-component |
| **Breaking existing user customizations** | Maintain backward compatibility with old CSS variable names during transition |

### Rollback Plan

Each phase should be:
1. Developed in a feature branch
2. Merged to main only after QA
3. Deployable independently (if possible)

**Git Strategy:**
```
main
├── feature/design-tokens     (Phase 1)
├── feature/core-components   (Phase 2)
├── feature/layout-components (Phase 3)
├── feature/canvas-nodes      (Phase 4)
└── feature/polish            (Phase 5)
```

---

## SUCCESS METRICS

### Qualitative

- [ ] **Visual consistency** - No component looks out of place
- [ ] **Professional appearance** - Inspires trust
- [ ] **Reduced cognitive load** - Simpler, cleaner UI
- [ ] **Dark mode quality** - Not an afterthought

### Quantitative

- [ ] **Color tokens** - 100% of colors from token system (0 hardcoded)
- [ ] **Spacing tokens** - 95%+ of spacing from token system
- [ ] **WCAG contrast** - 100% AA compliance
- [ ] **Performance** - 500 nodes at 60fps
- [ ] **Browser support** - Works on Chrome, Firefox, Safari, Edge

---

## DEPENDENCIES

### External

- **Fonts:** Inter, IBM Plex Mono (need to decide: CDN or self-hosted)
- **Icons:** Bootstrap Icons (currently via font, consider SVG sprite)

### Internal

- **State management:** Redux (no changes needed)
- **Canvas rendering:** SVG (no changes needed)
- **Build system:** (need to verify - Webpack? Vite?)

---

## TEAM ROLES

Assuming small team:

| Role | Responsibilities |
|------|-----------------|
| **Design System Lead** | Create token system, define standards |
| **Component Developer** | Implement component styling |
| **QA/Tester** | Cross-browser testing, accessibility audit |
| **Reviewer** | Code review, design review |

---

## DELIVERABLES PER PHASE

### Phase 1
- ✅ Token system implemented
- ✅ Dark/light theme switching infrastructure
- ✅ Documentation: design-tokens.md

### Phase 2
- ✅ All core components restyled
- ✅ Component library documentation

### Phase 3
- ✅ All layout components restyled
- ✅ Authentication flow redesigned

### Phase 4
- ✅ Canvas/node styling updated
- ✅ Right panel redesigned

### Phase 5
- ✅ All polish tasks complete
- ✅ QA report
- ✅ Final documentation

---

## NEXT IMMEDIATE ACTIONS

### This Week

1. **Review this action plan** with team
2. **Approve Phase 1 scope**
3. **Decide on font loading strategy** (CDN vs self-hosted)
4. **Set up feature branch** for design tokens
5. **Create first token file** (colors-light.scss)

### Questions to Answer Before Starting

- [ ] Which font CDN to use? (Google Fonts, Adobe Fonts, self-hosted)
- [ ] Should we use CSS-in-JS for theming or stick with SCSS?
- [ ] Do we want a theme preview/switcher in the UI now or later?
- [ ] Should we set up Storybook for component development?
- [ ] What's the deployment strategy? (Can we deploy incrementally?)

---

## APPENDIX: FILE CHANGE ESTIMATE

### Files to Create (~10)
- `/styles/tokens/` (9 new files)
- `/docs/redesign/design-tokens.md`

### Files to Modify (~30)
- `/styles/variables.scss` (deprecate)
- `/styles/style.scss` (refactor)
- `/components/*/style.scss` (~15 files)
- `/pages/*/style.scss` (~5 files)
- Component React files as needed (~10 files)

### Files to Delete (~1)
- `/styles/variables.scss` (after full migration)

**Total estimated changes:** ~40 files

---

**END OF ACTION PLAN**

*Ready to begin Phase 1: Design Tokens*
