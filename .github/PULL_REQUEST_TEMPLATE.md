# Pull Request

## Description

<!-- Provide a clear and concise description of what this PR does -->

### Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvement without changing functionality)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Style/UI update
- [ ] Accessibility improvement

### Related Issues

<!-- Link to related issues using #issue_number -->

Closes #
Relates to #

---

## Changes Made

<!-- List the main changes made in this PR -->

-
-
-

### Files Modified

<!-- List the key files that were changed -->

- `path/to/file1.tsx`
- `path/to/file2.scss`
-

---

## Compliance Checklist

### Code Quality

- [ ] Code follows TypeScript strict mode (no implicit `any`)
- [ ] All components use functional components (no class components)
- [ ] Props are properly typed with interfaces
- [ ] Naming conventions followed (PascalCase for components, camelCase for functions)
- [ ] No console.logs or commented-out code
- [ ] Comments explain WHY, not WHAT
- [ ] Code is DRY (Don't Repeat Yourself)

### Design System Compliance

- [ ] Design system colors used (no hard-coded colors)
- [ ] Spacing scale followed (8px, 16px, 20px, 32px)
- [ ] Typography scale followed
- [ ] Border radius values from design system
- [ ] No inline styles (except for dynamic values)
- [ ] No `!important` in CSS (specificity fixed instead)

### Form Standards (if applicable)

- [ ] Forms follow design system hierarchy
- [ ] Section headers are uppercase with proper styling (11px, bold, gray)
- [ ] Required fields marked with red asterisk (*)
- [ ] Toggle switches used instead of checkboxes for booleans
- [ ] Input height is 40px with 14px 16px padding
- [ ] Input font-size is 16px with line-height 1.5
- [ ] Error messages include icon and proper styling
- [ ] Help text uses info icon and gray color
- [ ] Form actions in dedicated section at bottom

### Icons

- [ ] **ONLY Bootstrap Icons used** (no Font Awesome, Heroicons, Material Icons, etc.)
- [ ] Icon sizes appropriate for context (14-24px)
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Icon-only buttons have `aria-label`

### Accessibility (WCAG AA)

- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA attributes used (`aria-label`, `aria-required`, `aria-invalid`, `aria-describedby`)
- [ ] Semantic HTML used (`button`, `nav`, `main`, `aside`, etc.)
- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- [ ] Color not used as only indicator of state/error
- [ ] Focus indicators visible
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] Form labels properly associated with inputs

### Performance

- [ ] No unnecessary re-renders
- [ ] Expensive calculations memoized (useMemo, useCallback)
- [ ] Large lists virtualized (if applicable)
- [ ] Images optimized
- [ ] Code splitting implemented (if applicable)

### Testing

- [ ] Changes tested manually in browser
- [ ] Tested in Chrome/Firefox/Safari (if applicable)
- [ ] Tested keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] Tested responsive behavior (desktop/mobile)
- [ ] Edge cases considered and tested
- [ ] Unit tests written/updated (if test infrastructure exists)
- [ ] No regressions in existing functionality

### Dependencies

- [ ] **No new npm packages added** (or explicitly approved)
- [ ] No breaking changes to existing APIs (or discussed and approved)
- [ ] Package.json updated (if dependencies changed)

### Documentation

- [ ] Code is self-documenting with clear variable/function names
- [ ] Complex logic has explanatory comments
- [ ] README updated (if applicable)
- [ ] CHANGELOG updated (if applicable)
- [ ] JSDoc comments added for new components

---

## Screenshots (if applicable)

### Before


### After


---

## Accessibility Testing

<!-- Describe how you tested accessibility -->

- [ ] Tested keyboard navigation
- [ ] Tested with screen reader (specify which):
- [ ] Checked color contrast with tool (specify which):
- [ ] Verified semantic HTML structure

---

## Additional Notes

<!-- Any additional information, context, or trade-offs -->

---

## Reviewer Checklist

<!-- For reviewers -->

- [ ] Code follows project standards and conventions
- [ ] Design system compliance verified
- [ ] Accessibility requirements met
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Breaking changes identified and documented
- [ ] Tests pass (if applicable)
- [ ] Documentation updated (if needed)

---

## Deployment Notes

<!-- Special instructions for deployment, if any -->

---

**By submitting this PR, I confirm that:**

- I have read and followed the [CLAUDE_DEVELOPMENT_GUIDE.md](../docs/CLAUDE_DEVELOPMENT_GUIDE.md)
- I have tested these changes thoroughly
- I have followed all accessibility guidelines
- I have not added any dependencies without approval
- I have only used Bootstrap Icons for any new icons
