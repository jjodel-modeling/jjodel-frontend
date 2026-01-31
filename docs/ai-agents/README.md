# AI AGENTS DOCUMENTATION

This directory contains documentation specifically designed for AI development agents (like Claude, GitHub Copilot, or other LLM-based coding assistants) working on the Jjodel project.

---

## QUICK START FOR AI AGENTS

If you're an AI agent tasked with working on Jjodel:

1. **Read this file first** to understand how to use the documentation
2. **Read `../CLAUDE_DEVELOPMENT_GUIDE.md`** for complete development guidelines
3. **Check `../CLAUDE.md`** for UI/UX design system specifics
4. **Reference `../CHANGELOG.md`** for recent documentation updates

---

## DOCUMENTATION STRUCTURE

### Primary Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[CLAUDE_DEVELOPMENT_GUIDE.md](../CLAUDE_DEVELOPMENT_GUIDE.md)** | Comprehensive development guide covering all technical standards, patterns, and workflows | **Read first** before any development work |
| **[CLAUDE.md](../CLAUDE.md)** | UI/UX design system, brand personality, component patterns, page-specific guidelines | When working on UI/UX features |
| **[CHANGELOG.md](../CHANGELOG.md)** | Track of all documentation changes | Check for recent updates |

### Supporting Documents

| Document | Purpose |
|----------|---------|
| **DEVELOPER_GUIDE.md** | Human developer onboarding and setup |
| **USER_GUIDE.md** | End-user documentation |
| **VERTICAL-CONSOLE-MODE.md** | Specific feature documentation |
| **PROPERTIES-TAB-IMPROVEMENTS.md** | Feature-specific improvements |
| **handover/\*.md** | Feature handover documentation |

---

## HOW TO USE THIS DOCUMENTATION

### For New Development Tasks

1. **Read the task requirements** provided by the user
2. **Check CLAUDE_DEVELOPMENT_GUIDE.md** sections relevant to your task:
   - Component Patterns (if creating/modifying components)
   - Form Design System (if working with forms)
   - Design System (for colors, spacing, typography)
   - Accessibility Requirements (always)
3. **Search the codebase** for similar existing implementations
4. **Propose your approach** before implementing (for complex changes)
5. **Implement following the guidelines** exactly
6. **Self-review** using the Quick Reference Checklist

### For Bug Fixes

1. **Identify the issue** and affected components
2. **Check relevant documentation** sections
3. **Understand existing patterns** in the affected code
4. **Make minimal changes** to fix the issue
5. **Ensure no regressions** in existing functionality
6. **Follow accessibility guidelines** if modifying UI

### For Refactoring

1. **Understand the current implementation** fully
2. **Check if the refactor aligns** with documented patterns
3. **Discuss the approach** with the development team
4. **Get approval** before making breaking changes
5. **Update documentation** if patterns change
6. **Ensure backward compatibility** where possible

---

## CRITICAL RULES (ALWAYS FOLLOW)

### 1. Icons

**ONLY USE BOOTSTRAP ICONS**

```jsx
// ✅ CORRECT
<i className="bi bi-trash"></i>

// ❌ WRONG
import { TrashIcon } from 'react-icons/fa';
import { TrashIcon } from '@heroicons/react';
```

### 2. Forms

**Follow the exact form design system:**

- Uppercase section headers (11px, bold, gray, 1px letter-spacing)
- Required fields: red asterisk `*`
- Input height: exactly 40px
- Input padding: 14px 16px
- Toggle switches (NOT checkboxes) for booleans
- Focus color: RED (#ef4444)

### 3. Dependencies

**NEVER add npm packages without explicit approval**

Always ask first if you think a new dependency is needed.

### 4. Accessibility

**Every interactive element must be:**

- Keyboard accessible
- Have proper ARIA attributes
- Meet WCAG AA color contrast
- Support screen readers

### 5. TypeScript

**Strict mode compliance:**

- No implicit `any`
- Explicit types for all props, state, returns
- Use discriminated unions for complex state

### 6. Breaking Changes

**Always discuss before:**

- Modifying shared types/interfaces
- Changing component APIs
- Altering global state structure
- Modifying build configuration

---

## WORKFLOW CHECKLIST

Use this checklist for every task:

### Before Coding

- [ ] Task requirements are clear
- [ ] Relevant documentation sections reviewed
- [ ] Similar patterns identified in codebase
- [ ] Approach discussed (if complex)
- [ ] Files to modify/create identified

### While Coding

- [ ] Following existing code style exactly
- [ ] Using design system values (colors, spacing)
- [ ] Adding meaningful comments (WHY not WHAT)
- [ ] Following component patterns
- [ ] Implementing accessibility properly

### After Coding

- [ ] Self-reviewed all changes
- [ ] Checked Quick Reference Checklist
- [ ] Tested manually in browser
- [ ] Tested keyboard navigation
- [ ] No console.logs or commented code
- [ ] Clear commit message written

---

## DESIGN SYSTEM QUICK REFERENCE

### Colors

```scss
// Base
$color-brand: #374151;        // slate-700
$color-accent: #475569;       // slate-600

// Semantic
$color-error: #dc2626;        // red-600
$color-warning: #eab308;      // yellow-500
$color-success: #16a34a;      // green-600

// Focus
$color-focus: #ef4444;        // RED for inputs
```

### Spacing

```scss
$spacing-sm: 8px;      // compact spacing, label-to-input
$spacing-lg: 16px;     // default block spacing
$spacing-xl: 20px;     // field group separation
$spacing-2xl: 24px;    // component separation
$spacing-3xl: 32px;    // section separation
```

### Typography

```scss
$font-size-sm: 12px;    // captions, metadata
$font-size-base: 13px;  // body text, buttons
$font-size-md: 14px;    // form labels
$font-size-lg: 16px;    // form inputs
```

---

## COMMON PATTERNS

### Component Structure

```tsx
import React from 'react';
import './component-name.scss';

interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
  // Hooks
  const [state, setState] = React.useState('');

  // Event handlers
  const handleClick = () => {
    // Implementation
  };

  // Render
  return <div className="component">{prop1}</div>;
};

export type { ComponentProps };
```

### Form Field

```tsx
<div className="form-field">
  <label htmlFor="name" className="form-label">
    Name <span className="form-label-required">*</span>
  </label>
  <input
    id="name"
    type="text"
    className="form-input"
    aria-required="true"
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? "name-error" : "name-help"}
  />
  {errors.name && (
    <p id="name-error" className="form-error" role="alert">
      <i className="bi bi-exclamation-triangle" />
      {errors.name}
    </p>
  )}
</div>
```

### Toggle Switch

```tsx
<div className="form-toggle-container">
  <div className="form-toggle-header">
    <div className="form-toggle-content">
      <h4 className="form-toggle-title">Read-only</h4>
      <p className="form-toggle-description">Prevent modifications</p>
    </div>
    <label className="toggle-switch">
      <input type="checkbox" checked={value} onChange={handleToggle} />
      <span className="toggle-slider" />
    </label>
  </div>
</div>
```

---

## TROUBLESHOOTING

### Issue: Styles not applying

**Check:**
1. Is the SCSS file imported?
2. Is the class name spelled correctly?
3. Is there a specificity issue? (Fix with better selectors, not `!important`)
4. Is the global stylesheet imported in App.tsx?

### Issue: TypeScript errors

**Check:**
1. Are all props typed?
2. Is strict mode enabled?
3. Are you using `any` anywhere? (Use `unknown` instead and narrow)
4. Are event handlers properly typed?

### Issue: Accessibility warnings

**Check:**
1. Do icon-only buttons have `aria-label`?
2. Do form inputs have associated labels?
3. Are required fields marked with `aria-required`?
4. Do error messages have `role="alert"`?

### Issue: Component not re-rendering

**Check:**
1. Are you mutating state directly? (Use setState or spread)
2. Is the dependency array in useEffect correct?
3. Are you comparing objects/arrays properly?
4. Do you need React.memo or useMemo?

---

## GETTING HELP

### When Stuck

1. **Search the codebase** for similar implementations
2. **Check the documentation** again carefully
3. **Ask specific questions** with context:
   - What you're trying to achieve
   - What you've tried
   - Why it's not working
   - Relevant code snippets

### When Uncertain

1. **Propose multiple approaches** with trade-offs
2. **Ask for clarification** on requirements
3. **Discuss architectural decisions** before implementing
4. **Request code review** for complex changes

---

## DOCUMENTATION UPDATES

If you find:
- **Outdated information** → Report it
- **Missing patterns** → Suggest additions
- **Unclear sections** → Request clarification
- **Errors or typos** → Submit corrections

All documentation updates should:
1. Be discussed before implementation
2. Update CHANGELOG.md
3. Follow the existing documentation style
4. Include clear examples
5. Be reviewed before merging

---

## RESOURCES

### Internal
- [CLAUDE_DEVELOPMENT_GUIDE.md](../CLAUDE_DEVELOPMENT_GUIDE.md) - Complete development guide
- [CLAUDE.md](../CLAUDE.md) - UI/UX design system
- [CHANGELOG.md](../CHANGELOG.md) - Documentation history
- [AGENTIC-CONVERSATIONAL-DEVELOPMENT.md](../AGENTIC-CONVERSATIONAL-DEVELOPMENT.md) - Development methodology

### External
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icon library
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) - TypeScript patterns
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - Accessibility patterns

---

## VERSION

**Current Version:** 1.1.0
**Last Updated:** 2026-01-24

For version history, see [CHANGELOG.md](../CHANGELOG.md)

---

**REMEMBER:** When in doubt, ask. Quality and consistency are more important than speed.
