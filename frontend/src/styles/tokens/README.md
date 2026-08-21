# Jjodel Design Tokens

**Single source of truth for all design values in Jjodel.**

This folder contains the complete design token system that powers Jjodel's visual design. All colors, typography, spacing, shadows, and other design values are defined here.

---

## 📁 File Structure

```
/styles/tokens/
├── index.scss              ← Import this file to get all tokens
├── _colors-light.scss      ← Light theme color palette
├── _colors-dark.scss       ← Dark theme color palette
├── _typography.scss        ← Font families, sizes, weights
├── _spacing.scss           ← Spacing scale (4px grid)
├── _shadows.scss           ← Box shadow elevation system
├── _radius.scss            ← Border radius scale
├── _transitions.scss       ← Animation durations and easings
└── _z-index.scss           ← Z-index layering system
```

---

## 🚀 Quick Start

### 1. Import in your component SCSS:

The tokens are already imported globally in `App.scss`, so you can use them anywhere:

```scss
.my-component {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: var(--transition-fast-all);
}
```

### 2. Switch themes:

```javascript
// In your React component or theme toggle
document.documentElement.setAttribute('data-theme', 'dark');
// or
document.documentElement.setAttribute('data-theme', 'light');
```

### 3. View all tokens:

Visit `/test-tokens` route to see all tokens visually with the theme switcher.

---

## 🎨 Token Categories

### Colors

**Background Colors:**
- `--color-bg-primary` - Main app background
- `--color-bg-secondary` - Cards, panels
- `--color-bg-tertiary` - Subtle backgrounds
- `--color-bg-elevated` - Floating elements
- `--color-bg-hover` - Hover states

**Border Colors:**
- `--color-border-primary` - Main borders
- `--color-border-secondary` - Subtle borders
- `--color-border-hover` - Hover borders

**Text Colors:**
- `--color-text-primary` - Headings, main text
- `--color-text-secondary` - Body text
- `--color-text-tertiary` - Labels, captions
- `--color-text-placeholder` - Placeholder text
- `--color-text-disabled` - Disabled text
- `--color-text-inverse` - Text on dark backgrounds

**Accent (Brand Teal):**
- `--color-accent` - Primary brand color
- `--color-accent-hover` - Hover state
- `--color-accent-active` - Pressed state
- `--color-accent-muted` - Backgrounds (12% opacity)
- `--color-accent-subtle` - Very subtle (6% opacity)

**Semantic Colors:**
- `--color-success` / `--color-success-hover` - Green
- `--color-warning` / `--color-warning-hover` - Amber
- `--color-error` / `--color-error-hover` - Red
- `--color-info` / `--color-info-hover` - Blue

Each semantic color also has `-muted` and `-subtle` variants.

---

### Typography

**Font Families:**
- `--font-sans` - Inter (UI text)
- `--font-mono` - IBM Plex Mono (code, console)

**Font Sizes:**
- `--text-xs` - 11px
- `--text-sm` - 13px
- `--text-base` - 15px (default)
- `--text-lg` - 18px
- `--text-xl` - 24px
- `--text-2xl` - 32px

**Font Weights:**
- `--font-normal` - 400 (regular)
- `--font-medium` - 500
- `--font-semibold` - 600
- `--font-bold` - 700

**Line Heights:**
- `--leading-tight` - 1.25 (headings)
- `--leading-normal` - 1.5 (body)
- `--leading-relaxed` - 1.75 (long-form)

---

### Spacing

**Scale (4px base):**
- `--space-0` - 0px
- `--space-1` - 4px
- `--space-2` - 8px
- `--space-3` - 12px
- `--space-4` - 16px
- `--space-5` - 20px
- `--space-6` - 24px
- `--space-8` - 32px
- `--space-10` - 40px
- `--space-12` - 48px
- `--space-16` - 64px
- `--space-20` - 80px
- `--space-24` - 96px

**Component-specific:**
- `--input-height` - 40px
- `--button-padding-x` - 16px
- `--panel-padding` - 24px
- `--gap-sm`, `--gap-md`, `--gap-lg`, `--gap-xl`

---

### Shadows

**Scale:**
- `--shadow-sm` - Subtle
- `--shadow-md` - Medium (default)
- `--shadow-lg` - Large
- `--shadow-xl` - Extra large
- `--shadow-2xl` - Massive
- `--shadow-glow` - Accent color glow
- `--shadow-inner` - Inset shadow

**Component-specific:**
- `--shadow-button`, `--shadow-card`, `--shadow-dropdown`, `--shadow-modal`, etc.

---

### Border Radius

**Scale:**
- `--radius-none` - 0px
- `--radius-sm` - 4px
- `--radius-md` - 8px (default)
- `--radius-lg` - 12px
- `--radius-xl` - 16px
- `--radius-2xl` - 24px
- `--radius-full` - 9999px (pills)

---

### Transitions

**Durations:**
- `--duration-fast` - 150ms
- `--duration-normal` - 250ms
- `--duration-slow` - 400ms

**Easing:**
- `--ease-in-out` - Default
- `--ease-out` - Decelerate
- `--ease-in` - Accelerate

**Combined:**
- `--transition-fast-all`
- `--transition-normal-all`
- `--transition-button`
- `--transition-input`
- `--transition-modal`

---

## 💡 Usage Examples

### Button

```scss
.my-button {
  height: 36px;
  padding: 0 var(--button-padding-x);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-button);

  &:hover {
    background: var(--color-accent-hover);
    box-shadow: var(--shadow-md);
  }
}
```

### Card

```scss
.my-card {
  padding: var(--panel-padding);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Input

```scss
.my-input {
  width: 100%;
  height: var(--input-height);
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  transition: var(--transition-input);

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }
}
```

---

## 🎨 Dark Mode Support

**Automatic theme switching:**

Both light and dark themes are defined. Simply change the `data-theme` attribute:

```javascript
// Light mode (default)
document.documentElement.setAttribute('data-theme', 'light');

// Dark mode
document.documentElement.setAttribute('data-theme', 'dark');
```

**All tokens automatically adjust** - no need to write theme-specific code!

```scss
// This works in both themes automatically:
.my-component {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}
```

---

## 🔄 Migration from Old Variables

**Legacy variables are temporarily mapped for backward compatibility:**

| Old Variable | New Token |
|--------------|-----------|
| `--color` | `--color-accent` |
| `--accent` | `--color-accent` |
| `--bg-1` | `--color-bg-secondary` |
| `--bg-2` | `--color-bg-tertiary` |
| `--danger` | `--color-error` |
| `--success` | `--color-success` |
| `--radius` | `--radius-sm` |

**TODO:** Search and replace these in component files, then remove legacy mappings.

---

## 📚 Resources

- **Visual Reference:** `/test-tokens` route
- **Implementation Guide:** `/docs/redesign/action-plan.md`
- **Component Analysis:** `/docs/redesign/component-analysis.md`
- **Requirements:** `/docs/redesign/jjodel-requirements.md`

---

## ✅ Best Practices

1. **Always use tokens** - Never hardcode colors, spacing, etc.
2. **Use semantic names** - `--color-text-primary` not `--gray-900`
3. **Consistent spacing** - Use the 4px grid (`--space-*`)
4. **Theme-aware** - Test components in both light and dark modes
5. **Performance** - CSS variables have minimal performance impact

---

**Questions?** Check `/docs/redesign/` or ask the team!
