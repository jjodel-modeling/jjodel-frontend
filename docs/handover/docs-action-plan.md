# Jjodel UI/UX Redesign - Action Plan

**Last Updated**: January 27, 2026  
**Overall Progress**: ~70-75%

---

## 📊 Phase Overview

| Phase | Component | Status | Priority |
|-------|-----------|--------|----------|
| 1 | Design Tokens | ✅ Complete | - |
| 2 | Dashboard | ✅ Complete | - |
| 3 | Login Page | ✅ 95% | Low |
| 4 | Properties Panel | ✅ Complete | - |
| 5 | Viewpoints System | ✅ 95% | Low |
| 6 | View Editor Tabs | 🔄 80% | **High** |
| 7 | Console | 🔄 70% | Medium |
| 8 | Node Tab | ⏳ 50% | Low |
| 9 | Dialogs/Modals | ✅ 90% | Low |
| 10 | Final Polish | ⏳ 0% | Medium |

---

## 🎯 Immediate Actions (This Week)

### Priority 1: Options Tab Fix
**Status**: 60% → Target 100%

- [ ] Add toggle switches for all boolean options
- [ ] Fix "Appliable to" layout (inline, not centered)
- [ ] Reduce dropdown width to max 200px
- [ ] Add section styling consistent with other tabs

**Files**: `ViewOptions.tsx`, `view-options.scss`

### Priority 2: Console Improvements
**Status**: 70% → Target 90%

- [ ] Reverse chronological order (newest first)
- [ ] Add timestamp (HH:MM) to each entry
- [ ] Fix monospace font for input
- [ ] Test keyboard shortcuts

**Files**: `Console.tsx`, `console-tab.scss`

### Priority 3: Events Tab - Custom Names
**Status**: 85% → Target 95%

- [ ] Display custom event names (not just "JS Editor")
- [ ] Add editable name field
- [ ] Consistent with DEFAULT EVENTS display

**Files**: `ViewEvents.tsx`

---

## 📋 Detailed Task List

### View Editor Tabs

#### Apply to Tab ✅ (90%)
- [x] Vertical form layout
- [x] Toggle switch for "Is Exclusive"
- [x] Section headers UPPERCASE
- [ ] Minor alignment polish

#### Template Tab ✅ (85%)
- [x] Breadcrumb with type badges
- [x] Monaco editors integration
- [x] Fullscreen modal
- [ ] Fix field proportions (35%/65%)
- [ ] Remove unwanted background above breadcrumb

#### Style Tab ✅ (90%)
- [x] Style Variables section
- [x] Unified "+ Add" dropdown
- [x] Palette rows with swatches
- [x] Color popover with variants
- [x] Numeric slider styling
- [x] Row gap in popover (10px)
- [x] Slate color for Add button

#### Events Tab 🔄 (85%)
- [x] Default Events section
- [x] Custom Events section
- [x] Collapsible editors
- [ ] **Custom event names display**

#### Options Tab 🔄 (60%)
- [x] Section headers
- [ ] **Toggle switches for booleans**
- [ ] **Fix Appliable to layout**
- [ ] Proper spacing

#### Permissions Tab ⏳ (0%)
- [ ] Not started
- [ ] Design TBD

### Console 🔄 (70%)
- [x] Input styling
- [x] Empty state
- [x] Context keys section
- [x] Code shortcuts
- [ ] **Reverse order (newest first)**
- [ ] **Timestamps (HH:MM)**
- [ ] Monospace font fix

### Viewpoints ✅ (95%)
- [x] Box layout
- [x] Radio/checkbox in header
- [x] View tree
- [x] Priority field
- [x] Feature badges
- [x] Responsive progressive hiding
- [ ] Fine-tune breakpoints if needed

### Monaco Editors ✅ (90%)
- [x] Fullscreen modal
- [x] Toolbar integration
- [ ] Line highlight (background vs border)
- [ ] Loading state improvements

---

## 🔧 Technical Debt

### CSS Issues
1. **Responsive scope contamination** - Fixed with container scoping
2. **Z-index conflicts** - Using token system
3. **!important overuse** - Refactor where possible

### Component Issues
1. **Monaco layout calculations** - Needs review
2. **Color popover positioning** - Fixed with `position: fixed`
3. **Toggle component reuse** - Create shared component

---

## 📅 Timeline Estimate

| Task | Effort | Target |
|------|--------|--------|
| Options Tab complete | 2-3 hours | This week |
| Console improvements | 2-3 hours | This week |
| Events tab names | 1-2 hours | This week |
| Permissions Tab | 3-4 hours | Next week |
| Node Tab alignment | 2 hours | Next week |
| Final polish | 4-5 hours | Next week |
| Dark mode testing | 3 hours | Next week |

**Estimated completion**: ~2 weeks for 100%

---

## ✅ Recently Completed (January 2026)

- [x] Style tab complete redesign
- [x] Color popover with variant sections
- [x] Numeric slider with slate theme
- [x] Viewpoints responsive hiding (container queries)
- [x] Warning badge color (raspberry red)
- [x] Add button slate styling
- [x] Popover row gap adjustment
- [x] Monaco line highlight (background)

---

## 📝 Design Decisions Log

### January 27, 2026
- **Options Tab**: Toggle switches mandatory for all booleans
- **Console**: Reverse chronological with timestamps
- **Responsive**: Container queries preferred, scoped to viewpoints list only
- **Color Popover**: Position fixed, 240px width, 20px swatches

### January 26, 2026
- **Style Variables**: Unified dropdown replaces 4 separate buttons
- **Warning Badge**: Raspberry red (#e11d48) instead of amber
- **Slider**: 16px thumb, 6px track, slate-600 solid fill

---

## 🚀 Post-Redesign Roadmap

1. **Performance audit** - Lazy loading, code splitting
2. **Accessibility audit** - WCAG AA compliance
3. **User testing** - Gather feedback from researchers
4. **Documentation** - Update user manual
5. **Tutorial videos** - Record new UI walkthroughs
