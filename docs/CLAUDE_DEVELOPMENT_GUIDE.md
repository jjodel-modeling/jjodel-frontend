# JJODEL UI/UX REDESIGN - CLAUDE DEVELOPMENT GUIDE

**Version:** 1.0.0
**Last Updated:** 2025-01-23
**Status:** Active Development (40-50% Complete)

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Design System](#design-system)
4. [Form Design System](#form-design-system)
5. [Component Patterns](#component-patterns)
6. [Progressive Disclosure](#progressive-disclosure)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Code Quality Standards](#code-quality-standards)
9. [Workflow & Communication](#workflow--communication)
10. [What to Avoid](#what-to-avoid)
11. [File Structure](#file-structure)
12. [Common Tasks](#common-tasks)
13. [Icons Usage](#icons-usage)

---

## PROJECT OVERVIEW

### What is Jjodel?

Jjodel is an **open-source metamodeling tool** designed for research and education. It's a cloud-native SaaS platform that enables:

- Students to learn metamodeling concepts without being intimidated
- Academics and researchers to use it in courses and research projects
- DSL designers to create and manage domain-specific languages
- Enterprise-grade metamodel design and validation

### Target Users (Priority Order)

1. **Students** - Must not be intimidated by complexity
2. **Academics/Researchers** - Need to adopt it for teaching
3. **DSL Designers** - Power users creating metamodels
4. **Investors** (indirect) - Must appear enterprise-grade

### Current State

- **Progress:** 40-50% through complete UI/UX redesign
- **Focus:** Reducing cognitive load while maintaining full functionality
- **Approach:** Progressive disclosure (basic → advanced modes)
- **Reference Design:** Framer, Figma, Notion patterns

### Brand Personality

- **Friendly** - Simple, approachable interface
- **Modern** - Contemporary aesthetics
- **Authoritative** - Inspires trust and confidence
- **Professional** - Enterprise-grade appearance
- **Innovative** - Feels new and surprising

---

## TECH STACK

### Core Technologies

- **Framework:** React 18.3 with TypeScript 5.8 (strict mode)
- **Build Tool:** Vite (migrated from webpack)
- **Styling:** SCSS with design tokens
- **State Management:** Redux
- **Icons:** Bootstrap Icons **ONLY** (strictly enforced)
- **Testing:** [Check existing setup]

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Key Dependencies

- `react`: 18.3.x
- `typescript`: 5.8.x
- `sass`: Latest
- `bootstrap-icons`: Latest
- `redux`: [Check version]
- `rc-dock`: [For docking layout]

---

## DESIGN SYSTEM

### Color Palette

#### Base Colors (Slate)
```scss
$color-brand: #374151;           // slate-700
$color-brand-light: #4B5563;     // slate-600
$color-brand-lighter: #6B7280;   // slate-500

// Accent (Interactive Elements)
$color-accent: #475569;          // slate-600
$color-accent-hover: #334155;    // slate-700
$color-accent-light: rgba(71, 85, 105, 0.1);
```

#### Semantic Colors
```scss
$color-error: #dc2626;    // red-600
$color-warning: #eab308;  // yellow-500
$color-success: #16a34a;  // green-600 (use sparingly)
$color-info: #3b82f6;     // blue-500

// Danger (destructive actions)
$color-danger: #ef4444;   // red-500
```

#### Text Colors
```scss
$color-text-primary: #111418;
$color-text-secondary: #6B7280;
$color-text-tertiary: #9CA3AF;
$color-text-inverse: #ffffff;
```

#### Background Colors
```scss
$color-bg-primary: #ffffff;
$color-bg-secondary: #f8fafc;   // slate-50
$color-bg-tertiary: #f1f5f9;    // slate-100
```

#### Border Colors
```scss
$color-border: #e2e4e8;
$color-border-light: #f0f1f2;
$color-border-hover: #d0d3d8;
```

### Typography

#### Font Families
```scss
$font-family: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-family-mono: 'IBM Plex Mono', 'Monaco', monospace;
```

#### Font Sizes
```scss
$font-size-xs: 11px;    // Uppercase labels
$font-size-sm: 12px;    // Captions, metadata
$font-size-base: 13px;  // Body text, buttons
$font-size-md: 14px;    // Form labels, headings
$font-size-lg: 16px;    // Form inputs, content
$font-size-xl: 18px;    // Large headings
$font-size-2xl: 24px;   // Page titles
```

#### Font Weights
```scss
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
```

#### Line Heights
```scss
$line-height-tight: 1.2;
$line-height-normal: 1.5;
$line-height-relaxed: 1.6;
```

### Spacing Scale

**CRITICAL:** Use these values consistently throughout the application.

```scss
$spacing-xs: 4px;      // 0.25rem - micro spacing
$spacing-sm: 8px;      // 0.5rem - compact spacing, label-to-input
$spacing-md: 12px;     // 0.75rem - default inline spacing
$spacing-lg: 16px;     // 1rem - default block spacing
$spacing-xl: 20px;     // 1.25rem - field group separation
$spacing-2xl: 24px;    // 1.5rem - component separation
$spacing-3xl: 32px;    // 2rem - section separation
$spacing-4xl: 48px;    // 3rem - major section separation
```

### Border Radius

```scss
$radius-sm: 4px;    // Small elements (badges, pills)
$radius-md: 6px;    // Inputs, buttons, cards (standard)
$radius-lg: 8px;    // Larger containers
$radius-xl: 12px;   // Modals, popovers
$radius-full: 9999px; // Circular elements
```

### Shadows

```scss
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 1px 3px rgba(0, 0, 0, 0.08);
$shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### Transitions

```scss
$transition-fast: 150ms ease;
$transition-normal: 250ms ease;
$transition-slow: 400ms ease;
```

---

## FORM DESIGN SYSTEM

### Form Hierarchy Structure

**STRICT COMPLIANCE REQUIRED**

```
Form Container
  └─ Section (with uppercase header + divider)
      └─ Field Group (20px spacing between groups)
          └─ Field
              ├─ Label (sentence case, red * for required)
              ├─ Input/Select/Textarea (40px height)
              ├─ Help Text (ⓘ icon + gray text, 6px below input)
              └─ Error Text (⚠️ icon + red text, replaces help text)
```

### Section Headers

```tsx
// ✅ CORRECT
<div className="form-section">
  <h3 className="form-section-title">DETAILS</h3>
  <div className="form-section-content">
    {/* Fields */}
  </div>
</div>

// ❌ WRONG
<h3>Details</h3>
<div className="section-title">details</div>
```

**Style Requirements:**
- Font size: 11px
- Font weight: 700 (bold)
- Color: #6b7280 (gray-500)
- Text transform: uppercase
- Letter spacing: 1px
- Margin bottom: 16px

### Field Labels

```tsx
// ✅ CORRECT - Required field
<label htmlFor="model-name" className="form-label">
  Name <span className="form-label-required">*</span>
</label>

// ✅ CORRECT - Optional field (no indicator)
<label htmlFor="model-desc" className="form-label">
  Description
</label>

// ❌ WRONG
<label>NAME *</label>
<label>Description (optional)</label>
```

**Style Requirements:**
- Font size: 14px
- Font weight: 500 (medium)
- Color: #1f2937
- Margin bottom: 6px
- Required asterisk: #ef4444 (red)

### Input Fields

**Standard Dimensions:**
- Height: 40px
- Padding: 14px 16px (vertical horizontal)
- Font size: 16px
- Line height: 1.5
- Border: 1px solid #e5e7eb
- Border radius: 8px

```scss
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  line-height: 1.5;
  color: #1f2937;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: inherit;

  &::placeholder {
    color: #9ca3af;
  }

  &:hover {
    border-color: #d1d5db;
  }

  &:focus {
    outline: none;
    border-color: #ef4444;  // RED focus
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    border-color: #e5e7eb;
  }
}
```

### Select Dropdowns

**Custom Arrow Implementation:**

```scss
.form-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 40px;  // Space for custom arrow
  cursor: pointer;

  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;

  &::-ms-expand {
    display: none;  // Remove IE arrow
  }
}
```

### Toggle Switches

**CRITICAL:** Use custom toggle switches, NEVER native checkboxes for boolean values.

```tsx
// ✅ CORRECT - Custom Toggle Switch
<div className="form-toggle-container">
  <div className="form-toggle-header">
    <div className="form-toggle-content">
      <h4 className="form-toggle-title">Read-only</h4>
      <p className="form-toggle-description">
        Prevent modifications to this element
      </p>
    </div>
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={value}
        onChange={handleToggle}
        aria-label="Toggle read-only mode"
      />
      <span className="toggle-slider" />
    </label>
  </div>
</div>

// ❌ WRONG - Native Checkbox
<input type="checkbox" /> Read-only
```

**Toggle Styles:**

```scss
.form-toggle-container {
  display: flex;
  flex-direction: column;
  padding: 0px 16px;
  height: 74px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.toggle-switch {
  flex-shrink: 0;
  position: relative;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background: #3b82f6;  // Blue when ON

      &::before {
        transform: translateX(20px);
      }
    }

    &:focus + .toggle-slider {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #d1d5db;  // Gray when OFF
  border-radius: 24px;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}
```

### Validation & Error Messages

```tsx
// ✅ CORRECT - Full Accessibility
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
  {!errors.name && (
    <p id="name-help" className="form-hint">
      <i className="bi bi-info-circle" />
      Must be unique. Used as identifier in code generation.
    </p>
  )}
  {errors.name && (
    <p id="name-error" className="form-error" role="alert">
      <i className="bi bi-exclamation-triangle" />
      {errors.name}
    </p>
  )}
</div>
```

**Error Text Styles:**

```scss
.form-error {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: #dc2626;

  i {
    margin-right: 4px;
  }
}
```

### Form Spacing

**STRICT COMPLIANCE:**

- **Label to Input:** 6px
- **Input to Help Text:** 6px
- **Between Field Groups:** 20px
- **Between Sections:** 32px
- **Section header to content:** 16px

### Action Buttons Section

```tsx
// ✅ CORRECT - Actions in dedicated section
<div className="form-section">
  <h3 className="form-section-title">ACTIONS</h3>

  <div className="form-actions">
    <button className="btn btn-primary" onClick={handleEdit}>
      Edit
    </button>
    <button className="btn btn-secondary" onClick={handleDuplicate}>
      Duplicate
    </button>
    <button className="btn btn-danger" onClick={handleDelete}>
      <i className="bi bi-trash" /> Delete
    </button>
  </div>

  <p className="form-hint">
    <i className="bi bi-info-circle" />
    These actions affect the selected element. Changes can be undone with Ctrl+Z.
  </p>
</div>
```

---

## COMPONENT PATTERNS

### File Structure

```
src/
├── components/
│   ├── ui/              # Base UI components (Button, Input)
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components (Sidebar, Panel)
│   ├── common/          # Shared components (Badge, Logo)
│   ├── editors/         # Editor-specific components (Info, Console)
│   ├── forEndUser/      # User-facing components (Input wrapper)
│   └── abstract/        # Abstract/complex components (Tabs, Dock)
├── hooks/               # Custom React hooks
├── contexts/            # React contexts
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── styles/              # Global styles and design tokens
└── constants/           # Constants and enums
```

### Naming Conventions

- **Components:** PascalCase (e.g., `PropertiesPanel.tsx`)
- **Functions:** camelCase (e.g., `handleSubmit`)
- **Types/Interfaces:** PascalCase (e.g., `IPropertiesPanel`, `TModelElement`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_DEPTH_LEVEL`)
- **CSS Classes:** kebab-case (e.g., `.form-input`, `.stat-card`)
- **SCSS Files:** kebab-case (e.g., `forms.scss`, `element-badge.scss`)

### Component Template

```tsx
/**
 * ComponentName - Brief description
 *
 * Detailed explanation of what this component does,
 * when to use it, and any important notes.
 *
 * @example
 * <ComponentName prop1="value" onAction={handler} />
 */

import React from 'react';
import './component-name.scss';

interface ComponentNameProps {
  /** Description of prop1 */
  prop1: string;
  /** Optional prop with default */
  prop2?: number;
  /** Callback when action occurs */
  onAction?: (value: string) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = 0,
  onAction,
}) => {
  // 1. Hooks first
  const [state, setState] = React.useState<string>('');

  // 2. Event handlers
  const handleClick = () => {
    // Implementation
    onAction?.(state);
  };

  // 3. Render
  return (
    <div className="component-name">
      <p>{prop1}</p>
      <button onClick={handleClick}>
        Action
      </button>
    </div>
  );
};

// Export types for consumers
export type { ComponentNameProps };
```

### Button Patterns

```tsx
// Primary Button (main action)
<button className="btn btn-primary" onClick={handleSave}>
  Save
</button>

// Secondary Button (alternative action)
<button className="btn btn-secondary" onClick={handleCancel}>
  Cancel
</button>

// Ghost Button (tertiary action)
<button className="btn btn-ghost" onClick={handleView}>
  View Details
</button>

// Danger Button (destructive action)
<button className="btn btn-danger" onClick={handleDelete}>
  <i className="bi bi-trash" /> Delete
</button>
```

**Button Styles:**

```scss
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  color: white;
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  border: none;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
  }
}

.btn-secondary {
  color: #1f2937;
  background-color: transparent;
  border: 1px solid #e5e7eb;

  &:hover:not(:disabled) {
    background-color: #f8fafc;
    border-color: #d1d5db;
  }
}

.btn-danger {
  color: #dc2626;
  background-color: transparent;
  border: 1px solid #fecaca;

  &:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.05);
  }
}
```

### Badge Patterns

```tsx
// Element Type Badge
<ElementBadge type="metamodel" />
<ElementBadge type="model" />
<ElementBadge type="class" />
<ElementBadge type="attribute" />
```

### Metric Cards

```tsx
// Overview Statistics
<div className="overview-grid">
  <div className="stat-card">
    <div className="stat-circle">
      <i className="bi bi-folder" style={{ fontSize: '18px', color: '#64748b' }} />
    </div>
    <div className="stat-value">5</div>
    <div className="stat-label">Packages</div>
  </div>

  <div className="stat-card">
    <div className="stat-circle">
      <i className="bi bi-box" style={{ fontSize: '18px', color: '#64748b' }} />
    </div>
    <div className="stat-value">12</div>
    <div className="stat-label">Classes</div>
  </div>
</div>
```

---

## PROGRESSIVE DISCLOSURE

### Pattern Definition

**CRITICAL PRINCIPLE:** Jjodel uses progressive disclosure to reduce cognitive load for beginners while providing power features for experts.

### Implementation Strategy

1. **Basic Mode (Default)**
   - Show only essential, commonly-used options
   - Simple language and minimal technical jargon
   - Clear, obvious controls
   - Limited choices to prevent overwhelm

2. **Advanced Mode (Opt-in)**
   - Reveal expert features
   - Show edge cases and technical options
   - Expose configuration details
   - Power user shortcuts and bulk operations

### Code Pattern

```tsx
import React, { useState } from 'react';

interface EditorProps {
  data: ModelElement;
}

export const Editor: React.FC<EditorProps> = ({ data }) => {
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');

  return (
    <div className="editor">
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={mode === 'basic' ? 'active' : ''}
          onClick={() => setMode('basic')}
        >
          Basic
        </button>
        <button
          className={mode === 'advanced' ? 'active' : ''}
          onClick={() => setMode('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Always Visible - Essential Fields */}
      <div className="form-section">
        <h3 className="form-section-title">DETAILS</h3>
        <Input label="Name" field="name" data={data} required />
        <Input label="Description" field="description" data={data} />
      </div>

      {/* Conditionally Visible - Advanced Features */}
      {mode === 'advanced' && (
        <div className="form-section">
          <h3 className="form-section-title">ADVANCED OPTIONS</h3>
          <Input label="Fully Qualified Name" field="fqn" data={data} />
          <Input label="Metadata" field="metadata" data={data} tag="textarea" />
        </div>
      )}
    </div>
  );
};
```

### When to Use Progressive Disclosure

Use when:
- Feature has both basic and expert use cases
- Too many options would overwhelm beginners
- Advanced features are rarely needed
- Clear distinction between essential and optional

Don't use when:
- Only 2-3 simple options exist
- All options are equally important
- Users need to see all choices to make decision

---

## ACCESSIBILITY REQUIREMENTS

### Keyboard Navigation

**MANDATORY:** All interactive elements must be keyboard accessible.

```tsx
// ✅ CORRECT - Keyboard accessible button
<button
  onClick={handleDelete}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDelete();
    }
  }}
  aria-label="Delete model"
>
  <i className="bi bi-trash" aria-hidden="true" />
</button>

// ❌ WRONG - Not keyboard accessible
<div onClick={handleDelete}>
  <i className="bi bi-trash" />
</div>
```

**Tab Order Requirements:**
- Logical flow (left to right, top to bottom)
- Skip links for long navigation
- Focus visible indicators (never `outline: none` without replacement)
- Tab index 0 for interactive elements, -1 for programmatic focus

### ARIA Attributes

```tsx
// Icon-only buttons MUST have aria-label
<button aria-label="Close modal">
  <i className="bi bi-x-lg" aria-hidden="true" />
</button>

// Required fields MUST have aria-required
<input
  aria-required="true"
  aria-label="Model name"
/>

// Invalid fields MUST have aria-invalid
<input
  aria-invalid={!!errors.name}
  aria-describedby="name-error"
/>

// Error messages MUST have role="alert"
<p id="name-error" role="alert">
  Name is required
</p>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Semantic HTML

```tsx
// ✅ CORRECT - Semantic elements
<nav>
  <ul>
    <li><a href="/projects">Projects</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Project Title</h1>
    <section>
      <h2>Details</h2>
    </section>
  </article>
</main>

// ❌ WRONG - Div soup
<div className="nav">
  <div className="link">Projects</div>
</div>

<div className="main">
  <div className="title">Project Title</div>
</div>
```

### Color Contrast

**WCAG AA Standards:**
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px): 3:1 minimum
- UI components: 3:1 minimum

**Never convey information with color alone:**

```tsx
// ✅ CORRECT - Icon + color for error
<p className="form-error">
  <i className="bi bi-exclamation-triangle" /> Name is required
</p>

// ❌ WRONG - Color only
<p className="text-red">Name is required</p>
```

### Focus Management

```tsx
// Modal - trap focus and return on close
const modalRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen) {
    // Save previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element in modal
    modalRef.current?.focus();

    // Return focus on unmount
    return () => {
      previouslyFocused?.focus();
    };
  }
}, [isOpen]);

// Form validation - focus first error
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const errors = validate(formData);

  if (Object.keys(errors).length > 0) {
    // Focus first error field
    const firstErrorField = Object.keys(errors)[0];
    document.getElementById(firstErrorField)?.focus();
  }
};
```

---

## CODE QUALITY STANDARDS

### TypeScript Best Practices

```tsx
// ✅ CORRECT - Explicit types
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  onClick,
  children,
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ❌ WRONG - Implicit any, loose types
interface ButtonProps {
  variant: string;
  size: any;
  onClick: Function;
  children: any;
}
```

### React Best Practices

```tsx
// ✅ CORRECT - Functional component with hooks
export const ModelEditor: React.FC<Props> = ({ modelId }) => {
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModel(modelId).then(setModel).finally(() => setLoading(false));
  }, [modelId]);

  if (loading) return <Spinner />;
  if (!model) return <EmptyState />;

  return <div>{model.name}</div>;
};

// ❌ WRONG - Class component (deprecated)
class ModelEditor extends React.Component {
  // Don't use class components
}
```

### Performance Optimization

```tsx
// Use React.memo for expensive components
export const ExpensiveList = React.memo<ListProps>(({ items }) => {
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
});

// Use useCallback for event handlers passed as props
const handleClick = useCallback((id: string) => {
  deleteItem(id);
}, [deleteItem]);

// Use useMemo for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

### Error Handling

```tsx
// ✅ CORRECT - Proper error handling
const fetchModel = async (id: string) => {
  try {
    const response = await api.getModel(id);
    setModel(response.data);
  } catch (error) {
    console.error('Failed to fetch model:', error);
    setError('Unable to load model. Please try again.');
    // Show user-friendly error in UI
  }
};

// Error boundary for component crashes
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## WORKFLOW & COMMUNICATION

### Before Writing Code

1. **Understand the task completely**
   - Read requirements carefully
   - Ask clarifying questions if anything is unclear
   - Check existing implementations for similar features

2. **Check existing patterns**
   - Search codebase for similar components
   - Review design system documentation
   - Identify reusable patterns

3. **Discuss architecture for complex changes**
   - Propose approach before implementing
   - Consider trade-offs and alternatives
   - Get approval for breaking changes

4. **Identify affected files**
   - List files you'll modify
   - List new files you'll create
   - Check for potential conflicts

### While Writing Code

1. **Make incremental changes**
   - Small, focused modifications
   - One feature/fix per commit
   - Commit frequently

2. **Follow existing conventions**
   - Match code style exactly
   - Use same patterns as surrounding code
   - Respect established architecture

3. **Add meaningful comments**
   - Explain WHY, not WHAT
   - Document non-obvious logic
   - Note edge cases and workarounds

4. **Write tests (if infrastructure exists)**
   - Unit tests for business logic
   - Integration tests for user flows
   - Accessibility tests

### Code Comments Best Practices

```tsx
// ✅ GOOD COMMENT - Explains WHY
// We use a ref here instead of state to avoid re-rendering
// the entire canvas on every mouse move
const positionRef = useRef({ x: 0, y: 0 });

// ✅ GOOD COMMENT - Documents edge case
// Safari doesn't support ResizeObserver on SVG elements,
// so we observe the parent container instead
const observer = new ResizeObserver(() => {
  updateCanvasSize(containerRef.current);
});

// ❌ BAD COMMENT - Explains WHAT (obvious from code)
// Set the position ref to x: 0, y: 0
const positionRef = useRef({ x: 0, y: 0 });

// ❌ BAD COMMENT - Outdated or misleading
// TODO: Fix this later (added 2 years ago)
const hackyFix = true;
```

### After Writing Code

1. **Self-review**
   - Read your changes as if reviewing a PR
   - Check for typos, console.logs, commented code
   - Verify code meets standards

2. **Test manually**
   - Verify functionality in browser
   - Test edge cases
   - Check responsive behavior

3. **Check accessibility**
   - Tab through interactive elements
   - Test with screen reader if possible
   - Verify color contrast

4. **Explain changes**
   - Write clear commit messages
   - Summarize what changed and why
   - Document any decisions made

### Communication Style

**Be explicit and clear:**
- "I modified `PropertiesPanel.tsx` to add a toggle for read-only mode"
- "I used the existing `Toggle` component pattern from `UserProfile.tsx`"

**Show trade-offs:**
- "Approach A is simpler but less performant for large datasets"
- "Approach B requires more code but is more maintainable"

**Ask for input when uncertain:**
- "I'm unsure whether to use Redux or component state here"
- "Should the error message be shown inline or in a modal?"

**Document important decisions:**
- "I chose to use a ref instead of state to avoid re-renders"
- "I added debouncing to prevent excessive API calls"

---

## WHAT TO AVOID

### Dependencies

❌ **NEVER add npm packages without explicit approval**

Check before adding:
1. Does this functionality exist in the codebase?
2. Can it be implemented simply without a library?
3. Is this library actively maintained?
4. What is the bundle size impact?

**Always discuss and get approval first.**

### Icons

❌ **NEVER use icon libraries other than Bootstrap Icons**

**Strictly forbidden:**
- Font Awesome
- Heroicons
- Material Icons
- React Icons (except for legacy `TbHexagonLetterJ` logo)
- Feather Icons
- Custom SVG icons (unless absolutely necessary and approved)

**Only allowed:**
- Bootstrap Icons (`bi-*` classes or imports)

### Breaking Changes

❌ **NEVER make breaking changes without discussion**

Breaking changes include:
- Modifying shared types/interfaces
- Changing component props
- Altering global state structure
- Modifying build configuration
- Changes affecting multiple components

**Always discuss architecture changes first.**

### Over-Engineering

❌ **NEVER over-engineer simple features**

Don't:
- Add abstraction layers for single-use code
- Optimize prematurely
- Create complex state machines for simple booleans
- Build frameworks for one-off solutions

**Keep it simple. Make it work. Then refactor if needed.**

### Styling Anti-Patterns

❌ **NEVER:**
- Use inline styles (except for dynamic values like transforms, colors from data)
- Use `!important` (fix specificity instead)
- Hard-code colors (use design system variables)
- Use magic numbers without comments (explain `z-index: 1000`)
- Create one-off utility classes

### Accessibility Violations

❌ **NEVER:**
- Use `<div>` with `onClick` instead of `<button>`
- Forget `alt` text on images
- Skip keyboard navigation support
- Use color as the only state indicator
- Create focus traps without escape mechanisms
- Hide focusable elements with `display: none` (use `visibility: hidden` or `aria-hidden`)

---

## FILE STRUCTURE

### Current Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── abstract/          # Complex/abstract components
│   │   │   ├── tabs/          # Tab system
│   │   │   └── Dock.tsx       # Docking layout
│   │   ├── common/            # Shared components
│   │   │   ├── ElementBadge.tsx
│   │   │   └── element-badge.scss
│   │   ├── editors/           # Editor panels
│   │   │   ├── Info.tsx       # Properties panel
│   │   │   ├── Console.tsx    # Console panel
│   │   │   └── info-improvements.scss
│   │   ├── forEndUser/        # User-facing components
│   │   │   └── Input.tsx      # Enhanced input wrapper
│   │   ├── ModeSystem/        # Mode selection
│   │   ├── project/           # Project components
│   │   └── ResizeHandle/      # Resize functionality
│   ├── pages/                 # Page components
│   │   ├── AllProjects.tsx
│   │   ├── TokenPreview.tsx
│   │   └── components/        # Page-specific components
│   ├── styles/                # Global styles
│   │   ├── forms.scss         # Form design system
│   │   ├── diagram.scss       # Canvas/diagram styles
│   │   └── tokens/            # Design tokens
│   │       └── _typography.scss
│   ├── hooks/                 # Custom hooks
│   │   ├── useResizableConsole.ts
│   │   └── useResizableFooter.ts
│   ├── model/                 # Data models
│   ├── utils/                 # Utility functions
│   └── App.tsx                # Root component
├── docs/                      # Documentation
│   ├── CLAUDE_DEVELOPMENT_GUIDE.md  # This file
│   ├── DEVELOPER_GUIDE.md
│   ├── USER_GUIDE.md
│   └── handover/
├── package.json
└── vite.config.ts
```

### Where to Put New Files

| File Type | Location | Example |
|-----------|----------|---------|
| Reusable UI component | `src/components/common/` | `Button.tsx` |
| Form-specific component | `src/components/forms/` | `FormField.tsx` |
| Editor panel | `src/components/editors/` | `Analytics.tsx` |
| Page component | `src/pages/` | `ProjectDetails.tsx` |
| Custom hook | `src/hooks/` | `useFormValidation.ts` |
| Utility function | `src/utils/` | `formatDate.ts` |
| Type definition | `src/types/` | `models.ts` |
| Global styles | `src/styles/` | `buttons.scss` |
| Component styles | Same directory as component | `Button.scss` |

---

## COMMON TASKS

### Creating a New Component

1. Choose appropriate directory based on component type
2. Create `.tsx` file with PascalCase name
3. Create `.scss` file (if needed) with kebab-case name
4. Define TypeScript interface for props
5. Implement component with JSDoc comments
6. Export component and types
7. Add to index.ts if creating public API

**Template:**

```tsx
/**
 * ComponentName - Brief description
 *
 * @example
 * <ComponentName prop1="value" />
 */

import React from 'react';
import './component-name.scss';

interface ComponentNameProps {
  /** Prop description */
  prop1: string;
  prop2?: number;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = 0,
}) => {
  return (
    <div className="component-name">
      {prop1}
    </div>
  );
};

export type { ComponentNameProps };
```

### Modifying Existing Component

1. Read existing code carefully
2. Understand current behavior and dependencies
3. Make minimal changes to achieve goal
4. Preserve existing functionality
5. Update types if props change
6. Update tests if they exist
7. Document changes in comments

### Creating a Form

1. Follow Form Design System hierarchy exactly
2. Use uppercase section headers with proper styling
3. Implement proper field labels (required asterisk)
4. Add validation with accessible error messages
5. Include help text where beneficial
6. Create Actions section at bottom
7. Ensure full keyboard navigation
8. Test with Tab key and accessibility tools

**Template:**

```tsx
export const ModelForm: React.FC<Props> = ({ data }) => {
  return (
    <div className="form-container">
      {/* SECTION 1: Details */}
      <div className="form-section">
        <h3 className="form-section-title">DETAILS</h3>

        <div className="form-field">
          <label htmlFor="name" className="form-label">
            Name <span className="form-label-required">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="form-input"
            aria-required="true"
          />
          <p className="form-hint">
            <i className="bi bi-info-circle" />
            Enter a unique name for this model
          </p>
        </div>
      </div>

      {/* SECTION 2: Actions */}
      <div className="form-section">
        <h3 className="form-section-title">ACTIONS</h3>

        <div className="form-actions">
          <button className="btn btn-primary">Save</button>
          <button className="btn btn-danger">
            <i className="bi bi-trash" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Adding Icons

1. Check [Bootstrap Icons](https://icons.getbootstrap.com/) for available icons
2. Use `<i className="bi bi-icon-name" />` syntax
3. Choose appropriate size (14-24px depending on context)
4. Add `aria-hidden="true"` for decorative icons
5. Add `aria-label` for icon-only buttons

**Common Icons:**

| Use Case | Icon | Class |
|----------|------|-------|
| Delete | Trash | `bi-trash` |
| Edit | Pencil | `bi-pencil` |
| Add | Plus | `bi-plus-lg` |
| Close | X | `bi-x-lg` |
| Info | Info circle | `bi-info-circle` |
| Warning | Exclamation triangle | `bi-exclamation-triangle` |
| Success | Check circle | `bi-check-circle` |
| Error | X circle | `bi-x-circle` |
| Folder | Folder | `bi-folder` |
| File | File earmark | `bi-file-earmark` |
| Diagram | Diagram 3 | `bi-diagram-3` |
| Arrow right | Arrow right | `bi-arrow-right` |
| Chevron down | Chevron down | `bi-chevron-down` |

### Implementing Progressive Disclosure

1. Identify basic vs advanced features
2. Create mode state (useState or context)
3. Default to 'basic' mode
4. Add mode toggle UI element
5. Conditionally render advanced sections
6. Ensure advanced features are discoverable
7. Consider persisting preference (localStorage)

**Example:**

```tsx
const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');

return (
  <div>
    <div className="mode-toggle">
      <button onClick={() => setViewMode('basic')}>Basic</button>
      <button onClick={() => setViewMode('advanced')}>Advanced</button>
    </div>

    {/* Always visible */}
    <BasicFields />

    {/* Conditionally visible */}
    {viewMode === 'advanced' && <AdvancedFields />}
  </div>
);
```

---

## ICONS USAGE

### Bootstrap Icons Reference

**Installation:**
```bash
npm install bootstrap-icons
```

**Usage in HTML/JSX:**
```jsx
<i className="bi bi-trash"></i>
<i className="bi bi-pencil"></i>
<i className="bi bi-plus-lg"></i>
```

**Sizing:**
```jsx
<i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
<i className="bi bi-trash" style={{ fontSize: '16px' }}></i>
<i className="bi bi-trash" style={{ fontSize: '20px' }}></i>
<i className="bi bi-trash" style={{ fontSize: '24px' }}></i>
```

**Accessibility:**
```jsx
{/* Decorative icon */}
<i className="bi bi-info-circle" aria-hidden="true"></i>

{/* Icon-only button */}
<button aria-label="Delete item">
  <i className="bi bi-trash" aria-hidden="true"></i>
</button>

{/* Icon with visible text */}
<button>
  <i className="bi bi-trash" aria-hidden="true"></i>
  <span>Delete</span>
</button>
```

### Icon Reference Table

| Category | Icon Name | Class | Size Recommendation |
|----------|-----------|-------|---------------------|
| **Actions** |
| Delete | Trash | `bi-trash` | 16-20px |
| Edit | Pencil | `bi-pencil` | 14-16px |
| Add | Plus | `bi-plus-lg` | 16-20px |
| Close | X | `bi-x-lg` | 16-20px |
| Save | Floppy | `bi-floppy` | 14-16px |
| **Navigation** |
| Arrow Right | Arrow Right | `bi-arrow-right` | 14-16px |
| Arrow Left | Arrow Left | `bi-arrow-left` | 14-16px |
| Chevron Down | Chevron Down | `bi-chevron-down` | 12-14px |
| Chevron Up | Chevron Up | `bi-chevron-up` | 12-14px |
| **UI Elements** |
| Settings | Gear | `bi-gear` | 16-18px |
| Search | Search | `bi-search` | 16-18px |
| Filter | Funnel | `bi-funnel` | 14-16px |
| Sort | Sort Down | `bi-sort-down` | 14-16px |
| **Feedback** |
| Info | Info Circle | `bi-info-circle` | 14-16px |
| Warning | Exclamation Triangle | `bi-exclamation-triangle` | 14-16px |
| Error | X Circle | `bi-x-circle` | 14-16px |
| Success | Check Circle | `bi-check-circle` | 14-16px |
| **Files & Folders** |
| Folder | Folder | `bi-folder` | 16-18px |
| File | File Earmark | `bi-file-earmark` | 16-18px |
| Document | File Text | `bi-file-text` | 16-18px |
| **Model Elements** |
| Diagram | Diagram 3 | `bi-diagram-3` | 18-24px |
| Box | Box | `bi-box` | 16-18px |
| Grid | Grid 3x3 Gap | `bi-grid-3x3-gap` | 16-18px |
| List | List | `bi-list-ul` | 16-18px |
| **Misc** |
| Eye | Eye | `bi-eye` | 16-18px |
| Eye Slash | Eye Slash | `bi-eye-slash` | 16-18px |
| Lock | Lock | `bi-lock` | 14-16px |
| Unlock | Unlock | `bi-unlock` | 14-16px |
| Calendar | Calendar | `bi-calendar` | 14-16px |
| Clock | Clock | `bi-clock` | 14-16px |
| Rocket | Rocket Takeoff | `bi-rocket-takeoff` | 24-36px (empty states) |

---

## APPENDIX

### Quick Reference Checklist

**Before committing code:**

- [ ] Code follows TypeScript strict mode
- [ ] All components use functional components (no classes)
- [ ] Props are properly typed with interfaces
- [ ] Naming conventions followed (PascalCase, camelCase, kebab-case)
- [ ] Design system colors used (no hard-coded colors)
- [ ] Spacing scale followed (8px, 16px, 20px, 32px)
- [ ] Forms follow design system hierarchy
- [ ] Section headers are uppercase with proper styling
- [ ] Required fields marked with red asterisk
- [ ] Toggle switches used instead of checkboxes for booleans
- [ ] Inputs have 40px height, 14px 16px padding
- [ ] Only Bootstrap Icons used (no other icon libraries)
- [ ] All interactive elements keyboard accessible
- [ ] ARIA attributes used where appropriate
- [ ] Color contrast meets WCAG AA standards
- [ ] No `!important` in styles (specificity fixed instead)
- [ ] No inline styles (except dynamic values)
- [ ] Comments explain WHY, not WHAT
- [ ] No console.logs or commented code
- [ ] Self-reviewed changes
- [ ] Manually tested in browser
- [ ] Accessibility tested (keyboard navigation)

### Common Mistakes to Avoid

1. **Using native checkboxes for booleans** → Use custom toggle switches
2. **Adding new dependencies without approval** → Ask first
3. **Using non-Bootstrap icons** → Only Bootstrap Icons allowed
4. **Hard-coding colors** → Use design system variables
5. **Using `!important`** → Fix specificity instead
6. **Div with onClick** → Use `<button>` instead
7. **Missing ARIA labels on icon buttons** → Always add `aria-label`
8. **Not testing keyboard navigation** → Tab through all controls
9. **Making breaking changes without discussion** → Discuss first
10. **Over-engineering simple features** → Keep it simple

### Resources

- **Bootstrap Icons:** https://icons.getbootstrap.com/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **React TypeScript Cheatsheet:** https://react-typescript-cheatsheet.netlify.app/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-23 | Initial comprehensive guide created |

---

**END OF GUIDE**

For questions or clarifications, discuss with the development team before proceeding with implementation.
