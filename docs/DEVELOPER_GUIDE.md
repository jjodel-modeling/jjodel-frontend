# Jjodel Developer Guide

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [UI Component Library](#ui-component-library)
  - [Design Tokens](#design-tokens)
  - [Available Components](#available-components)
  - [Usage Examples](#usage-examples)
  - [Component Guidelines](#component-guidelines)
- [Console Implementation](#console-implementation)
  - [Component Structure](#component-structure)
  - [State Management](#state-management)
  - [Code Execution](#code-execution)
  - [Adding Custom Context Keys](#adding-custom-context-keys)
  - [Extending Autocomplete](#extending-autocomplete)
- [Styling Guidelines](#styling-guidelines)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Architecture Overview

Jjodel is built with:
- **React** for UI components
- **Redux** for global state management
- **TypeScript** for type safety
- **SCSS** for styling with design tokens
- **SVG** for canvas rendering

---

## UI Component Library

**Added**: January 24, 2026

Jjodel includes a comprehensive UI component library following a strict design system. All components are production-ready, fully typed, and WCAG AA accessible.

### Design Tokens

All styling uses CSS custom properties from `/frontend/src/styles/tokens.css`:

```css
/* Import in App.tsx */
import './styles/tokens.css';

/* Usage in components */
.myComponent {
  color: var(--color-slate-700);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}
```

**Key token categories:**
- **Colors**: `--color-slate-*`, `--color-cyan-*`, `--color-red-*`, `--color-green-*`
- **Spacing**: `--spacing-1` (4px) to `--spacing-16` (64px)
- **Typography**: `--font-family-base`, `--font-size-*`, `--font-weight-*`
- **Form**: `--input-height-*`, `--input-border-color-*`, `--toggle-width-*`
- **Radius**: `--radius-sm` to `--radius-full`
- **Transitions**: `--transition-fast`, `--transition-base`, `--transition-slow`

### Available Components

#### Core Form Components

**Button** (`/frontend/src/components/ui/Button/`)
- **Variants**: `primary`, `secondary`, `danger`, `ghost`
- **Sizes**: `sm`, `md`, `lg`
- **Features**: Icons (left/right), loading state, disabled state
- **CRITICAL**: ALL variants use outline-style (transparent background + border)

```tsx
import { Button } from '../ui';

<Button variant="primary" size="md" icon={<i className="bi bi-plus" />}>
  New Project
</Button>
```

**Input** (`/frontend/src/components/ui/Input/`)
- **Sizes**: `sm`, `md`, `lg`
- **Features**: Left/right icons, error states, full-width option
- **Types**: text, number, email, password

```tsx
<Input
  size="md"
  placeholder="Search..."
  leftIcon={<i className="bi bi-search" />}
  error={!!errors.search}
  fullWidth
/>
```

**Select** (`/frontend/src/components/ui/Select/`)
- **Features**: Custom chevron (Bootstrap Icons), option groups, placeholders
- **Sizes**: `sm`, `md`, `lg`

```tsx
<Select
  options={[
    { value: 'model1', label: 'Model 1' },
    { value: 'model2', label: 'Model 2' },
  ]}
  placeholder="Select model..."
  fullWidth
/>
```

**Textarea** (`/frontend/src/components/ui/Textarea/`)
- **Features**: Character counter, max length, resize control, error states

```tsx
<Textarea
  placeholder="Description..."
  rows={3}
  maxLength={500}
  showCharCount
  fullWidth
/>
```

**Toggle** (`/frontend/src/components/ui/Toggle/`)
- **NOT a checkbox** - Custom CSS-based switch
- **Sizes**: `sm`, `md`, `lg`
- **Features**: Label, description, disabled state

```tsx
<Toggle
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Read-only"
  description="Prevent modifications"
  size="md"
/>
```

#### Supporting Components

**Label** - Form labels with required asterisk
**HelpText** - Secondary guidance text (#6B7280, 12px)
**ErrorText** - Validation error messages (red, icon support)

**Field** - Wrapper combining Label + Input + HelpText/ErrorText
```tsx
<Field
  label="Email"
  htmlFor="email"
  required
  error={errors.email}
  helpText="We'll never share your email"
>
  <Input id="email" type="email" error={!!errors.email} />
</Field>
```

**FormSection** - Section grouping with title and divider
```tsx
<FormSection title="DETAILS" divider>
  {/* form fields */}
</FormSection>
```

### Usage Examples

**Complete form example:**
```tsx
import { Button, Input, Select, Textarea, Toggle, Field, FormSection } from '../ui';

function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    readOnly: false,
  });

  return (
    <form>
      <FormSection title="DETAILS" divider>
        <Field
          label="Name"
          htmlFor="name"
          required
          error={errors.name}
          helpText="Must be unique"
        >
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            fullWidth
          />
        </Field>

        <Field label="Type" htmlFor="type">
          <Select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={typeOptions}
            fullWidth
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            maxLength={500}
            showCharCount
            fullWidth
          />
        </Field>

        <Toggle
          checked={formData.readOnly}
          onChange={(checked) => setFormData({ ...formData, readOnly: checked })}
          label="Read-only"
          description="Prevent modifications"
        />
      </FormSection>

      <FormSection title="ACTIONS" divider>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="primary" type="submit">
            Save
          </Button>
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
```

See `/frontend/src/components/ui/examples/FormExample.tsx` for complete working example.

### Component Guidelines

#### Design Rules (CRITICAL)

1. **ALL buttons MUST be outline-style** (transparent background + border)
   - NEVER use filled buttons
   - Use `variant="primary"` for main actions (cyan border)
   - Use `variant="danger"` for destructive actions (red border)

2. **Bootstrap Icons ONLY**
   - NO Font Awesome, Material Icons, or Heroicons
   - Use `<i className="bi bi-icon-name" />`

3. **Toggle switches for booleans**
   - NEVER use native checkbox for boolean states
   - Use custom Toggle component

4. **Design system colors**
   - Slate base: `#475569`
   - Cyan accent: `#06b6d4`
   - Use tokens: `var(--color-slate-600)`, `var(--color-cyan-500)`

5. **Spacing system**
   - Use multiples of 8px: `8px`, `16px`, `24px`, `32px`
   - Use tokens: `var(--spacing-2)`, `var(--spacing-4)`, etc.

#### TypeScript

All components use strict TypeScript:
```tsx
interface MyComponentProps {
  /** The component's label */
  label: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  label,
  onClick,
  disabled = false
}) => {
  // Component implementation
};
```

#### CSS Modules

All component styles use CSS Modules:
```tsx
// MyComponent.module.css
.button {
  background: transparent;
  border: 1.5px solid var(--color-cyan-500);
  color: var(--color-cyan-500);
}

.button:hover {
  background: var(--color-cyan-50);
}

// MyComponent.tsx
import styles from './MyComponent.module.css';

<button className={styles.button}>Click</button>
```

#### Accessibility

All components must be WCAG AA compliant:
- **Keyboard navigation**: Tab, Enter, Space, Arrow keys
- **ARIA attributes**: `aria-invalid`, `aria-describedby`, `aria-checked`, etc.
- **Focus indicators**: Cyan ring with `box-shadow: 0 0 0 2px var(--color-cyan-100)`
- **Screen readers**: Proper labels and descriptions
- **Color contrast**: Text meets 4.5:1 ratio minimum

#### File Structure

Components follow this pattern:
```
/frontend/src/components/ui/
├── ComponentName/
│   ├── ComponentName.tsx         # Main component
│   ├── ComponentName.module.css  # Scoped styles
│   └── index.ts                  # Export
└── index.ts                      # Barrel export
```

#### Import Pattern

Use barrel exports for clean imports:
```tsx
// ✅ Good
import { Button, Input, Select } from '../ui';

// ❌ Avoid
import { Button } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';
```

---

## Console Implementation

The Console tab provides a JavaScript REPL for runtime querying and debugging. It was redesigned in January 2026 to improve UX with better history management, autocomplete, and collapsible results.

### Component Structure

The Console is split into modular sub-components for maintainability:

```
/frontend/src/components/editors/Console/
├── Console.tsx              # Main container (Redux-connected)
├── ConsoleInput.tsx         # Input field with autocomplete
├── ConsoleHistory.tsx       # History display container
├── ConsoleEntry.tsx         # Individual command/result entry
├── ConsoleToolbar.tsx       # Action buttons (Clear, Copy, etc.)
├── CollapsibleContextKeys.tsx  # Context keys section
├── CollapsibleShortcuts.tsx    # Code snippets (Advanced mode)
├── index.tsx                # Component exports
└── console-tab.scss         # Styles
```

#### Console.tsx (Main Component)

The main `ConsoleComponent` class:
- **Connected to Redux** via `mapStateToProps` / `mapDispatchToProps`
- **Manages state**:
  - `expression`: Current input value
  - `expressionHistory`: Array of previously executed commands
  - `expressionIndex`: Current position in history
  - `entries`: Array of `ConsoleEntryData` (commands + results)
- **Handles execution** via `handleExecute()`
- **Updates context** via `updateContext()` to provide eval scope

#### ConsoleInput.tsx

Handles user input with advanced features:
- **Autocomplete**: Suggests context keys, JavaScript keywords, and methods
- **History navigation**: `↑`/`↓` keys to navigate previous commands
- **Multi-line support**: `Shift+Enter` for new lines, `Enter` to execute
- **Auto-resize**: Textarea grows/shrinks based on content
- **Keyboard shortcuts**: `Tab` for autocomplete, `Escape` to close suggestions

**Key props:**
```typescript
interface ConsoleInputProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (code: string) => void;
  history: string[];
  contextKeys: string[];
  placeholder?: string;
}
```

#### ConsoleHistory.tsx & ConsoleEntry.tsx

Display command history and results:
- **ConsoleHistory**: Container that maps over `entries` array
- **ConsoleEntry**: Renders individual command or result
- **Features**:
  - Collapsible results (click header to toggle)
  - Copy button per entry
  - Delete button per entry
  - Syntax highlighting for JSON output
  - Error vs success styling

**Entry data structure:**
```typescript
interface ConsoleEntryData {
  id: string;
  type: 'command' | 'result' | 'error';
  timestamp: Date;
  content: string;
  input?: string;  // Original command (for results)
  collapsed?: boolean;
}
```

#### ConsoleToolbar.tsx

Toolbar with actions:
- **Clear**: Remove all console entries
- **Copy All**: Copy all result outputs
- **History count**: Display number of commands executed
- **Keyboard shortcuts help**: Shows tooltip with shortcuts

#### CollapsibleContextKeys.tsx

Displays available context keys:
- Shows first 8 keys by default
- "Show more" button to expand
- Click key to insert into input
- Collapsible section to save space

#### CollapsibleShortcuts.tsx

Pre-defined code snippets (Advanced mode only):
- Common operations (get classes, filter, count, etc.)
- Click to insert into input
- Editable before execution
- Helps users learn JavaScript patterns

### State Management

#### Local Component State

```typescript
class ThisState {
  expression: string = '';             // Current input value
  output: any = null;                  // Legacy (kept for compatibility)
  expressionIndex: number = 0;         // Position in history
  expressionHistory: string[] = [''];  // Command history
  initialState: boolean = true;        // Initialization flag
  time: number = 0;                    // Timestamp for history
  entries: ConsoleEntryData[] = [];    // New: array of entries
}
```

#### Redux State (via Props)

```typescript
interface StateProps {
  data: LModelElement | null;   // Current metamodel/model
  node: LGraphElement | null;   // Selected node
  view: LViewElement | null;    // Current view
  advanced: boolean;             // Advanced mode flag
}
```

### Code Execution

When the user executes code:

1. **Context is prepared** (`updateContext()`):
   ```typescript
   private updateContext(): void {
     const nid = this.props.node?.id;
     const tn = transientProperties.node[nid as string];
     if (nid && tn) {
       this._context = {...tn.viewScores[tn.mainView.id].evalContext};
       this._context.fromcomponent = true;
     } else {
       this._context = {...this.props, props: this.props};
     }
   }
   ```

2. **Code is evaluated** (`handleExecute()`):
   ```typescript
   const expression = code.trim() === 'this' ? 'data' : code;
   output = U.evalInContextAndScope(expression, this._context, this._context);
   ```

3. **Output is processed**:
   - Wrapped with `fixproxy()` to handle L-singletons
   - Converted to string via `JSON.stringify()` or custom formatting
   - Stored as a `ConsoleEntryData` with type `'result'` or `'error'`

4. **Entries are updated**:
   ```typescript
   this.setState(prevState => ({
     entries: [...prevState.entries, commandEntry, resultEntry],
     expression: '',
     expressionHistory: [...prevState.expressionHistory, code],
     expressionIndex: prevState.expressionHistory.length
   }));
   ```

5. **Debug variables are set**:
   ```typescript
   windoww.context = context;
   windoww.data = context.data;
   windoww.node = context.node;
   windoww.output = output;
   ```

### Adding Custom Context Keys

To add new context keys available in the console:

1. **Update the eval context** in `updateContext()` or wherever the context is built:

```typescript
private updateContext(): void {
  // ... existing code ...

  // Add custom keys
  this._context.myCustomKey = someValue;
  this._context.helperFunction = () => {
    // Custom helper logic
  };
}
```

2. **Update context keys detection** in `render()`:

```typescript
if (this.state.expression.trim() === "") {
  contextkeysarr = ["data", "node", "view", "component", "myCustomKey"];
} else {
  // Existing logic
}
```

3. **Add documentation** in USER_GUIDE.md under "Available Context Keys".

### Extending Autocomplete

Autocomplete is handled in `ConsoleInput.tsx` via `getAutocompleteSuggestions()`:

```typescript
const getAutocompleteSuggestions = (
  input: string,
  contextKeys: string[]
): string[] => {
  const lastToken = input.split(/[\s.,;(){}[\]]/).pop() || '';

  if (!lastToken || lastToken.length < 2) return [];

  // 1. Match context keys
  const matchingKeys = contextKeys.filter(key =>
    key.toLowerCase().startsWith(lastToken.toLowerCase())
  );

  // 2. Match JavaScript keywords
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else'];
  const matchingKeywords = keywords.filter(kw =>
    kw.startsWith(lastToken.toLowerCase())
  );

  // 3. Match common methods
  const methods = ['console.log', 'JSON.stringify', 'JSON.parse'];
  const matchingMethods = methods.filter(m =>
    m.toLowerCase().includes(lastToken.toLowerCase())
  );

  return [...matchingKeys, ...matchingKeywords, ...matchingMethods].slice(0, 5);
};
```

**To add custom suggestions:**

1. Add a new array of suggestions (e.g., `domainSpecificMethods`)
2. Filter them based on `lastToken`
3. Include in the return statement

**Example:**

```typescript
// Add custom domain-specific suggestions
const domainMethods = ['getClassHierarchy()', 'findDependencies()', 'validateModel()'];
const matchingDomainMethods = domainMethods.filter(m =>
  m.toLowerCase().startsWith(lastToken.toLowerCase())
);

return [
  ...matchingKeys,
  ...matchingKeywords,
  ...matchingMethods,
  ...matchingDomainMethods // Add here
].slice(0, 5);
```

---

## Styling Guidelines

Console styles follow the Jjodel design system defined in `CLAUDE.md`.

### Design Tokens

Located in `console-tab.scss`:

```scss
// Colors
$color-accent: #475569;        // Slate for primary actions
$color-accent-hover: #334155;
$color-text-primary: #111418;
$color-text-secondary: #6B7280;
$color-bg-primary: #ffffff;
$color-bg-secondary: #f8fafc;
$color-border: #e2e4e8;

// Typography
$font-family: 'Inter Variable', 'Inter', sans-serif;
$font-family-mono: 'IBM Plex Mono', 'Monaco', 'Menlo', 'Consolas', monospace;

// Spacing
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;

// Radius
$radius-sm: 4px;
$radius-md: 6px;
$radius-lg: 8px;
```

### Component Classes

- `.console-tab-v2` - Main container
- `.console-header` - Header with title and subtitle
- `.console-toolbar` - Action buttons bar
- `.console-body` - Scrollable history area
- `.console-input-wrapper` - Input container
- `.console-footer` - Collapsible sections area

### Dark Mode

All components support dark mode via `@media (prefers-color-scheme: dark)`:

```scss
@media (prefers-color-scheme: dark) {
  .console-tab-v2 {
    background: #0f172a;
  }

  .console-input {
    background: #1e293b;
    border-color: #334155;

    &__field {
      color: #f1f5f9;
    }
  }
}
```

### Adding New Styles

1. **Follow design tokens** - Use variables, not hard-coded colors
2. **Add dark mode support** - Every style should have a dark mode variant
3. **Use transitions** - Apply `transition: all $transition-fast` for hover states
4. **Follow naming convention** - Use BEM (Block Element Modifier):
   - `.block`
   - `.block__element`
   - `.block--modifier`

---

## Testing

### Manual Testing Checklist

#### Input & Execution
- [ ] Typing in input field works
- [ ] Placeholder text visible when empty
- [ ] Enter executes single-line command
- [ ] Shift+Enter adds new line
- [ ] Multi-line commands execute correctly
- [ ] Input clears after execution

#### Command History
- [ ] ↑ navigates to previous command
- [ ] ↓ navigates to next command
- [ ] History persists during session
- [ ] Can edit historical command before re-executing
- [ ] Empty input when at end of history

#### Autocomplete
- [ ] Suggestions appear while typing
- [ ] Context keys suggested
- [ ] JavaScript keywords suggested
- [ ] Tab accepts first suggestion
- [ ] Suggestions disappear when not applicable
- [ ] Click on suggestion inserts it

#### Results Display
- [ ] Command appears in history
- [ ] Result appears below command
- [ ] Errors shown in red
- [ ] Results are syntax highlighted
- [ ] Long results are scrollable

#### Collapsible Results
- [ ] Result headers are clickable
- [ ] Results collapse/expand smoothly
- [ ] Chevron icon rotates correctly
- [ ] State persists during session

#### Toolbar Actions
- [ ] Clear button removes all entries
- [ ] Copy All copies all output
- [ ] History count displays correctly
- [ ] Shortcuts help shows tooltip

#### Context Keys
- [ ] Section is collapsible
- [ ] Shows count of available keys
- [ ] Keys are clickable
- [ ] Clicking key inserts it at cursor
- [ ] "Show more" expands full list

#### Keyboard Shortcuts
- [ ] Ctrl/Cmd+L clears console
- [ ] Tab accepts autocomplete
- [ ] All shortcuts work as documented

#### Visual & Dark Mode
- [ ] Light mode colors correct
- [ ] Dark mode colors correct
- [ ] Syntax highlighting readable
- [ ] Hover states work
- [ ] Focus states visible
- [ ] Animations smooth

### Unit Testing (Future)

To add unit tests:

```typescript
// Example test structure
describe('ConsoleInput', () => {
  it('should execute command on Enter', () => {
    const onExecute = jest.fn();
    const { getByPlaceholderText } = render(
      <ConsoleInput
        value="data.classes"
        onChange={() => {}}
        onExecute={onExecute}
        history={[]}
        contextKeys={[]}
      />
    );

    const input = getByPlaceholderText(/Type JavaScript/);
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onExecute).toHaveBeenCalledWith('data.classes');
  });

  it('should add new line on Shift+Enter', () => {
    // Test implementation
  });
});
```

---

## Contributing

### Code Style

- **TypeScript** - Use TypeScript for type safety
- **Functional components preferred** - Use hooks where possible
- **PureComponent for class components** - Avoid unnecessary re-renders
- **PropTypes** - Define interfaces for all props
- **Comments** - Add JSDoc comments for public methods

### Git Workflow

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Test thoroughly (manual + automated)
4. Create PR with description
5. Address review comments
6. Merge after approval

### Commit Messages

Follow conventional commits:

```
feat(console): add autocomplete suggestions
fix(console): correct history navigation bug
docs(console): update USER_GUIDE with examples
style(console): improve dark mode contrast
refactor(console): extract ConsoleInput component
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] All checklist items passed
- [ ] Dark mode tested
- [ ] Keyboard shortcuts tested

## Screenshots (if UI changes)
[Add screenshots]

## Related Issues
Closes #123
```

---

## Troubleshooting

### Issue: Autocomplete not triggering

**Cause**: Need at least 2 characters or context hasn't updated.

**Solution**:
1. Check `contextKeys` prop is being passed correctly
2. Verify `getAutocompleteSuggestions()` is being called
3. Check browser console for errors

### Issue: Results not displaying

**Cause**: Entry data structure incorrect or rendering error.

**Solution**:
1. Check `ConsoleEntryData` structure matches interface
2. Verify `content` field is a string
3. Check for errors in `ConsoleEntry` component

### Issue: Styles not applying

**Cause**: SCSS not imported or class names incorrect.

**Solution**:
1. Verify `console-tab.scss` is imported in `Console.tsx`
2. Check class names match between JSX and SCSS
3. Clear build cache and restart dev server

---

## Future Improvements

### Planned Features

1. **Persist history to localStorage**
   - Save command history between sessions
   - Limit to last 100 commands

2. **Export history to file**
   - Export all commands and results as JSON
   - Export formatted as markdown

3. **Code snippets library**
   - User-defined shortcuts
   - Import/export snippets

4. **Performance profiling**
   - Measure query execution time
   - Show performance metrics per command

5. **Syntax highlighting in input**
   - Real-time highlighting as you type
   - Use Prism.js or similar

6. **Variable assignment**
   - Allow `const x = data.classes`
   - Persist variables across commands

### Known Limitations

- History is not persisted (resets on page reload)
- No multi-statement support (can't do `const x = 1; x + 2`)
- Autocomplete is basic (doesn't understand chained methods)
- No code formatting (no Prettier integration)

---

## Resources

- [React Documentation](https://react.dev/)
- [Redux Documentation](https://redux.js.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SCSS Guide](https://sass-lang.com/guide)
- [Jjodel Design System](../CLAUDE.md)

---

*Last updated: January 2026*
