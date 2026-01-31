# Jjodel Design System

**Version**: 2.0  
**Last Updated**: January 27, 2026

---

## 🎨 Color System

### Base Palette (Slate)

The primary neutral palette used throughout the application.

| Token | Hex | Usage |
|-------|-----|-------|
| `slate-50` | `#f8fafc` | Section backgrounds, subtle fills |
| `slate-100` | `#f1f5f9` | Hover states, alternating rows |
| `slate-200` | `#e2e8f0` | Borders, dividers |
| `slate-300` | `#cbd5e1` | Disabled states, toggle OFF |
| `slate-400` | `#94a3b8` | Muted text, placeholders |
| `slate-500` | `#64748b` | Section headers, icons |
| `slate-600` | `#475569` | Secondary text, labels |
| `slate-700` | `#334155` | Primary text |
| `slate-800` | `#1e293b` | Dark backgrounds, popovers |
| `slate-900` | `#0f172a` | Darkest backgrounds |

### Accent (Cyan)

Brand accent color for interactive elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `cyan-400` | `#22d3ee` | Light accent |
| `cyan-500` | `#0ea5e9` | Primary accent, toggle ON, focus rings |
| `cyan-600` | `#0284c7` | Hover state |
| `cyan-700` | `#0369a1` | Active/pressed state |

### Semantic Colors

| Category | Default | Hover | Muted |
|----------|---------|-------|-------|
| Success | `#10b981` | `#059669` | `rgba(16, 185, 129, 0.12)` |
| Warning | `#f59e0b` | `#d97706` | `rgba(245, 158, 11, 0.12)` |
| Error | `#ef4444` | `#dc2626` | `rgba(239, 68, 68, 0.12)` |
| Info | `#3b82f6` | `#2563eb` | `rgba(59, 130, 246, 0.12)` |

### Special Colors

| Purpose | Color | Hex |
|---------|-------|-----|
| Warning Badge (Caution) | Rose | `#e11d48` |
| Exclusive VP Badge | Cyan | `#0ea5e9` |
| Overlay VP Badge | Amber | `#f59e0b` |

---

## 📝 Typography

### Font Families

```scss
// Sans-serif (primary)
--font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

// Monospace (code, console)
--font-mono: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', monospace;
```

### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 11px | 1.4 | Badges, timestamps |
| `text-sm` | 12px | 1.4 | Section headers, captions |
| `text-base` | 13px | 1.5 | Body text, inputs |
| `text-md` | 14px | 1.5 | Default UI text |
| `text-lg` | 16px | 1.5 | Subheadings |
| `text-xl` | 18px | 1.4 | Headings |
| `text-2xl` | 20px | 1.3 | Page titles |
| `text-3xl` | 24px | 1.2 | Large titles |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, buttons |
| `font-semibold` | 600 | Headings, emphasis |
| `font-bold` | 700 | Strong emphasis |

---

## 📐 Spacing

Based on 4px grid system.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Component padding |
| `space-3` | 12px | Section gaps |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Large gaps |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Page margins |
| `space-10` | 40px | Large sections |

---

## 🔲 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Badges, small elements |
| `radius-md` | 6px | Buttons, inputs |
| `radius-lg` | 8px | Cards, panels |
| `radius-xl` | 12px | Modals, large cards |
| `radius-full` | 9999px | Pills, avatars |

---

## 🌫️ Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Prominent elements |

---

## 🎭 Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `transition-fast` | `150ms ease` | Micro-interactions |
| `transition-normal` | `200ms ease` | Standard transitions |
| `transition-slow` | `300ms ease` | Larger animations |

---

## 🧩 Components

### Toggle Switch

```scss
.toggle-switch {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  
  // OFF state
  background: #cbd5e1;  // slate-300
  
  // ON state
  &.active {
    background: #0ea5e9;  // cyan-500
  }
  
  // Knob
  &::after {
    width: 16px;
    height: 16px;
    background: #ffffff;
    border-radius: 50%;
    transition: transform 200ms ease;
  }
}
```

### Section Header

```scss
.section-header {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;           // slate-500
  padding: 10px 16px;
  background: #f8fafc;      // slate-50
  border-bottom: 1px solid #e2e8f0;
}
```

### Form Field

```scss
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: #475569;         // slate-600
  }
  
  .field-input {
    height: 28-36px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    
    &:focus {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
  }
}
```

### Button Variants

```scss
// Primary (Slate gradient)
.btn-primary {
  background: linear-gradient(180deg, #475569, #334155);
  color: #ffffff;
  border: none;
  
  &:hover {
    background: linear-gradient(180deg, #334155, #1e293b);
  }
}

// Secondary (Outlined)
.btn-secondary {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  
  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
}

// Destructive
.btn-destructive {
  background: #ef4444;
  color: #ffffff;
  
  &:hover {
    background: #dc2626;
  }
}
```

### Badge

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  
  &.badge-cyan {
    background: rgba(14, 165, 233, 0.15);
    color: #0284c7;
  }
  
  &.badge-amber {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
  }
}
```

### Color Swatch

```scss
.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 150ms ease;
  
  &:hover {
    transform: scale(1.15);
  }
}
```

### Numeric Slider

```scss
.numeric-slider {
  height: 6px;
  background: #475569;      // slate-600
  border-radius: 3px;
  
  &::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
    background: #ffffff;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    margin-top: -5px;
  }
}
```

---

## 📱 Responsive Patterns

### Container Queries (Preferred)

```scss
// Define container
.panel {
  container-type: inline-size;
  container-name: panel;
}

// Responsive rules
@container panel (max-width: 400px) {
  .priority-field { display: none; }
}

@container panel (max-width: 300px) {
  .badges { display: none; }
}
```

### Progressive Hiding

Order of element removal as space decreases:
1. Priority field (least important)
2. Feature badges (OCL, JS, EX)
3. Action buttons
4. Secondary text

### Transitions for Hiding

```scss
.hideable-element {
  transition: opacity 0.3s ease,
              visibility 0.3s ease,
              max-width 0.3s ease;
              
  &.hidden {
    opacity: 0;
    visibility: hidden;
    max-width: 0;
    overflow: hidden;
  }
}
```

---

## ♿ Accessibility

### Focus States

All interactive elements must have visible focus:

```scss
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #ffffff,
              0 0 0 4px #0ea5e9;
}
```

### Color Contrast

- Text on light: minimum 4.5:1 ratio
- Text on dark: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio

### Keyboard Navigation

- All interactive elements focusable via Tab
- Enter/Space to activate buttons
- Arrow keys for navigation in lists
- Escape to close modals/popovers

---

## 📋 Checklist for New Components

- [ ] Uses design tokens (no hardcoded values)
- [ ] Works in light and dark mode
- [ ] Has proper focus states
- [ ] Keyboard accessible
- [ ] Follows 4px spacing grid
- [ ] Uses appropriate typography scale
- [ ] Has hover/active states
- [ ] Transitions are smooth (150-300ms)
- [ ] Mobile/responsive considered
