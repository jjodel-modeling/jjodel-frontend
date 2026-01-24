# JJODEL DOCUMENTATION CHANGELOG

All notable changes to the Jjodel documentation will be tracked in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.1] - 2026-01-24

### Fixed

#### Tab Icon Persistence
- Fixed issue where tab icon ("M" badge for metamodel/model) would disappear during name editing
- **Root Cause**: `LModel.set_name()` method used `innerHTML = val` to update tab title, which overwrote the entire content including the icon
- **Solution**: Two-part fix:
  1. Changed `innerHTML` to `textContent` in `LModelElement.tsx` to preserve CSS pseudo-elements
  2. Implemented CSS-only icon approach using `::before` pseudo-element (doesn't depend on DOM content)
- **Technical Details**:
  - CSS `::before` renders icon via CSS rules, unaffected by `textContent` changes
  - `data-type` attribute determines icon style (metamodel vs model)
  - No React component needed for icon - pure CSS solution is more stable
- **Files Modified**:
  - `/frontend/src/model/logicWrapper/LModelElement.tsx` (line 5323)
  - `/frontend/src/components/abstract/tabs/TabDataMaker.tsx`
  - `/frontend/src/components/abstract/tabs/tab-title.scss` (new file)
- **Impact**: Improved user experience when editing metamodel/model names in tabs

#### Benefits
- ✅ Icon visible when tab first opens
- ✅ Icon remains visible during name editing
- ✅ Icon persists after name change
- ✅ Works for both metamodel and model tabs
- ✅ No console errors or warnings
- ✅ CSS-only approach is more performant than React components

### Technical Implementation

**The Bug (LModelElement.tsx:5323):**
```typescript
// This was destroying the icon:
if (tab) tab.innerHTML = val;

// Fixed to:
if (tab) tab.textContent = val;
```

**CSS-Only Icon (tab-title.scss):**
```scss
.tab-title[data-type="metamodel"]::before {
    content: "M";
    background-color: #8b5cf6;
    // ... badge styling
}
```

**Tab Title Structure:**
```typescript
title: <div className="tab-title active-on-mouseenter" data-type="metamodel">{model.name}</div>
```

---

## [2.0.0] - 2026-01-24

### Added

#### UI Component Library
- Complete design system implementation with reusable components
- Design tokens file (`/frontend/src/styles/tokens.css`) with CSS custom properties
- 10 production-ready UI components:
  - Button (outline-style only, 4 variants, 3 sizes, loading state, icon support)
  - Input (sizes, left/right icons, error states, full-width option)
  - Select (custom Bootstrap Icons chevron, option groups, placeholders)
  - Textarea (character counter, max length validation, resize control)
  - Toggle (custom CSS switch, 3 sizes, NOT checkbox)
  - Label (required asterisk, htmlFor association)
  - HelpText (secondary color, small font)
  - ErrorText (red color, icon support)
  - Field (wrapper combining label + input + help/error)
  - FormSection (uppercase title, divider, consistent spacing)
- Barrel export file (`/frontend/src/components/ui/index.ts`) for clean imports
- FormExample component demonstrating all components in realistic form
- Global import of tokens in App.tsx

#### Documentation
- New handover document: `HANDOVER-UI-REDESIGN-2026-01-24.md`
- Complete documentation of all 5 changes made on January 24, 2026
- Technical notes on design system adherence
- Accessibility compliance documentation (WCAG AA)
- TypeScript strictness guidelines
- Comprehensive testing checklist

#### Console Empty State Enhancement
- Interactive quick-start examples (4 clickable buttons)
- Keyboard shortcuts visual guide (Enter, ↑↓, Tab)
- Better UX with "Ready to explore" friendly messaging
- New `onExecuteCode` prop for executing example code

### Changed

#### Button Standardization
- Fixed Properties Panel ACTIONS buttons to use outline-style
- Replaced inline-styled filled buttons with Button component
- All buttons now auto-width (not full-width)
- Consistent hover/focus states across app

#### Input Field Optimization
- Made numeric inputs more compact (24px height instead of 32px)
- Fixed input widths (90px typical) instead of full-width
- Uniformed font across all inputs (13px, normal weight)
- Added override for bold styles from GenericInput/SizeInput components
- Improved layout with flex-wrap for better responsiveness

#### NodeEditor
- Fixed export issue (added named export)
- Removed unused `children` parameter
- Component now imports correctly in Dock.tsx

### Fixed
- NodeEditor import/export error: "does not provide an export named 'NodeEditor'"
- Button design rule violation in Properties Panel (filled backgrounds)
- Inconsistent font styling in numeric inputs (bold vs normal)
- Input width issues (full-width when should be auto)

---

## [1.0.0] - 2025-01-23

### Added

#### CLAUDE_DEVELOPMENT_GUIDE.md
- Complete AI agent development guide created
- Project overview and context
- Tech stack documentation (React 18, TypeScript, Vite, Bootstrap Icons)
- Comprehensive design system:
  - Color palette (Slate base, semantic colors)
  - Typography scale and font families
  - Spacing scale (4px - 48px)
  - Border radius and shadows
  - Transitions
- Form Design System with strict compliance rules:
  - Form hierarchy structure
  - Section headers (uppercase, 11px, gray)
  - Field labels (required asterisk styling)
  - Input dimensions (40px height, 14px 16px padding)
  - Toggle switches (custom, 44x24px)
  - Validation and error messages
  - Spacing requirements
- Component patterns:
  - File structure guidelines
  - Naming conventions
  - Component template
  - Button, badge, and metric card patterns
- Progressive disclosure pattern:
  - Basic/Advanced mode implementation
  - When to use guidelines
  - Code examples
- Accessibility requirements (WCAG AA):
  - Keyboard navigation
  - ARIA attributes
  - Semantic HTML
  - Color contrast
  - Focus management
- Code quality standards:
  - TypeScript best practices
  - React patterns (functional components only)
  - Performance optimization
  - Error handling
- Workflow and communication guidelines
- "What to Avoid" section:
  - No new dependencies without approval
  - Bootstrap Icons ONLY
  - No breaking changes without discussion
  - No over-engineering
- Common tasks reference
- Bootstrap Icons usage guide with reference table
- Quick reference checklist
- Common mistakes to avoid

#### Supporting Documentation Structure
- Created `docs/` directory for all documentation
- Created `docs/ai-agents/` directory for AI-specific documentation
- Created `.github/` directory for GitHub templates

### Changed
- N/A (Initial release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## Template for Future Changes

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature documentation
- New section in guide
- New code examples

### Changed
- Updated section X with new information
- Revised guidelines for Y
- Improved clarity in Z section

### Deprecated
- Marked X as deprecated
- Y will be removed in version Z

### Removed
- Removed outdated section X
- Deleted deprecated guideline Y

### Fixed
- Corrected typo in section X
- Fixed broken link to Y
- Updated outdated example in Z

### Security
- Added security guideline for X
- Updated authentication documentation
```

---

## Notes

### Version Numbering

- **MAJOR** version: Significant restructuring or complete rewrites
- **MINOR** version: New sections, substantial additions
- **PATCH** version: Corrections, clarifications, small updates

### Changelog Guidelines

1. Group changes by type (Added, Changed, Deprecated, Removed, Fixed, Security)
2. Use present tense ("Add feature" not "Added feature")
3. Reference specific sections or files changed
4. Include rationale for significant changes
5. Link to related issues or pull requests when applicable

### Review Process

- All documentation changes should be reviewed before merging
- Update this changelog with every documentation commit
- Tag releases when major documentation milestones are reached
- Keep entries concise but descriptive

---

**Last Updated:** 2025-01-23
**Maintained By:** Development Team
