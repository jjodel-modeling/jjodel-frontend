# Jjodel User Guide

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Console Tab](#console-tab)
  - [Features](#features)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Available Context Keys](#available-context-keys)
  - [Examples](#examples)
- [Advanced Features](#advanced-features)

---

## Overview

Jjodel is a cloud-native metamodeling tool designed for research and education. This guide will help you understand how to use Jjodel's powerful features, with a focus on the Console Tab for runtime querying and debugging.

---

## Getting Started

To get started with Jjodel:

1. Create or open a project
2. Select a metamodel or model from your workspace
3. Use the right panel tabs to explore and manipulate your data:
   - **Properties**: View and edit element properties
   - **Tree View**: Navigate your model hierarchy
   - **Viewpoints**: Customize element visualization
   - **Node**: View node-specific information
   - **Console**: Execute JavaScript queries (covered below)

---

## Console Tab

The Console provides a JavaScript REPL (Read-Eval-Print Loop) for querying and manipulating your metamodel at runtime. It's a powerful tool for exploring data, debugging, and performing complex operations.

### Features

#### 1. **Command History**
- Navigate through previously executed commands using `↑` and `↓` arrow keys
- History persists throughout your session
- Easily re-execute or modify previous commands

#### 2. **Multi-line Input**
- Press `Shift+Enter` to add new lines to your command
- Useful for writing longer, more complex JavaScript expressions
- Execute with `Enter` when ready

#### 3. **Autocomplete**
- Start typing to see intelligent suggestions
- Suggestions include:
  - Context keys (data, node, view, component)
  - JavaScript keywords (const, let, function, return)
  - Common methods (console.log, JSON.stringify)
- Press `Tab` to accept the first suggestion
- Click any suggestion to insert it

#### 4. **Collapsible Results**
- Each command execution creates an entry with its result
- Click result headers to expand/collapse output
- Keeps your console organized and readable
- Delete individual entries with the X button

#### 5. **Context Keys**
- Click on any context key to insert it into the input
- Keys are organized in a collapsible section
- Shows all available variables in the current context
- Hover over keys to see their purpose

#### 6. **Copy Results**
- Click the clipboard icon on any result to copy its output
- Use "Copy All" in the toolbar to copy all results at once
- Useful for sharing debugging information or exporting data

#### 7. **Code Shortcuts** (Advanced Mode Only)
- Pre-defined code snippets for common operations
- Click any shortcut to insert it into the input
- Edit the inserted code before executing
- Available shortcuts:
  - Get all classes
  - Get all packages
  - Find by name
  - Filter abstract classes
  - Count attributes
  - Map class names
  - Pretty print JSON
  - Get node info

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Execute command |
| `Shift+Enter` | Add new line (multi-line input) |
| `↑` (Arrow Up) | Navigate to previous command in history |
| `↓` (Arrow Down) | Navigate to next command in history |
| `Tab` | Accept autocomplete suggestion |
| `Ctrl/Cmd+L` | Clear console (remove all entries) |
| `Escape` | Close autocomplete suggestions |

### Available Context Keys

The console has access to the following context when executing code:

| Key | Type | Description |
|-----|------|-------------|
| `data` | Object | Current metamodel/model data structure |
| `component` | React.Component | The React component instance rendering the element |
| `node` | Object | The currently selected node in the canvas |
| `view` | Object | Current view configuration and settings |

Additional keys depend on the type of object you're querying. For arrays, you'll see array methods. For objects, you'll see their properties.

### Examples

#### Basic Queries

```javascript
// Get all classes
data.classes

// Get all packages
data.packages

// View the current node
node

// Check the current view settings
view
```

#### Finding Elements

```javascript
// Find a specific class by name
data.classes.find(c => c.name === "MyClass")

// Find all abstract classes
data.classes.filter(c => c.abstract)

// Find classes with more than 5 attributes
data.classes.filter(c => c.attributes.length > 5)
```

#### Counting and Aggregation

```javascript
// Count total attributes across all classes
data.classes.reduce((sum, c) => sum + c.attributes.length, 0)

// Count classes by package
data.classes.reduce((acc, c) => {
  acc[c.package] = (acc[c.package] || 0) + 1;
  return acc;
}, {})

// Get average number of attributes per class
data.classes.reduce((sum, c) => sum + c.attributes.length, 0) / data.classes.length
```

#### Mapping and Transformation

```javascript
// Get array of all class names
data.classes.map(c => c.name)

// Get class names with their attribute counts
data.classes.map(c => ({ name: c.name, attrCount: c.attributes.length }))

// Create a lookup table by class name
Object.fromEntries(data.classes.map(c => [c.name, c]))
```

#### Pretty Printing

```javascript
// Format data as readable JSON
JSON.stringify(data, null, 2)

// Format a specific class
JSON.stringify(data.classes[0], null, 2)

// Custom formatting with replacer
JSON.stringify(data, (key, value) => {
  if (key === 'id') return undefined; // Exclude id fields
  return value;
}, 2)
```

#### Complex Queries

```javascript
// Get all classes that inherit from a specific parent
data.classes.filter(c => c.superclass === "BaseClass")

// Find all bidirectional references
data.classes.flatMap(c =>
  c.references.filter(r => r.opposite !== null)
)

// Get class dependency graph
data.classes.map(c => ({
  name: c.name,
  dependencies: c.references.map(r => r.type)
}))
```

---

## Advanced Features

### Working with the Selected Node

```javascript
// Get the selected node's type
node.className

// Get the selected node's model element
node.model

// Check if the node is selected
node.selected

// Get the node's position
{ x: node.x, y: node.y }
```

### Debugging with Console

```javascript
// Log to browser console (visible in DevTools)
console.log("Debug info:", data.classes.length)

// Inspect object structure
console.dir(data.classes[0])

// Create debug snapshots
window.snapshot = JSON.parse(JSON.stringify(data))
```

### Temporary Variables

The console automatically stores results in `window.output` for debugging purposes. You can also create your own temporary variables:

```javascript
// Store a result for later use
window.myClasses = data.classes.filter(c => c.abstract)

// Use it in a later command
window.myClasses.length
```

---

## Tips and Best Practices

### 1. **Start Simple**
Begin with basic queries like `data` or `node` to explore the available structure, then build more complex queries.

### 2. **Use Autocomplete**
Let autocomplete guide you to available methods and properties. Start typing and see what's available.

### 3. **Break Down Complex Queries**
Instead of writing one long expression, break it into steps:

```javascript
// Step 1: Get the classes
data.classes

// Step 2: Filter to abstract only
data.classes.filter(c => c.abstract)

// Step 3: Get their names
data.classes.filter(c => c.abstract).map(c => c.name)
```

### 4. **Use Code Shortcuts**
In Advanced Mode, use the Code Shortcuts section for common patterns. Click a shortcut, modify it if needed, then execute.

### 5. **Collapse Old Results**
Keep your console tidy by collapsing results you've finished reviewing. Click the result header to collapse/expand.

### 6. **Copy Complex Results**
For large or complex output, use the copy button to paste into an external text editor for easier reading.

### 7. **Leverage JavaScript Array Methods**
The console supports all JavaScript array methods:
- `filter()` - Select elements matching criteria
- `map()` - Transform elements
- `reduce()` - Aggregate data
- `find()` - Get first match
- `some()` / `every()` - Boolean checks
- `sort()` - Order elements

---

## Troubleshooting

### Issue: "Cannot read property 'X' of undefined"

**Cause**: Trying to access a property that doesn't exist.

**Solution**: Check if the property exists first:

```javascript
// Instead of:
data.classes[0].attributes[0].type

// Use optional chaining:
data.classes?.[0]?.attributes?.[0]?.type

// Or check existence:
data.classes && data.classes[0] && data.classes[0].attributes
```

### Issue: Autocomplete not showing

**Cause**: Need at least 2 characters to trigger suggestions.

**Solution**: Type at least 2 characters, or press `Escape` and try again.

### Issue: Command not executing

**Cause**: Syntax error in JavaScript code.

**Solution**: Check the error message in the result. Common issues:
- Missing closing brackets/parentheses
- Typos in property names
- Incorrect method usage

### Issue: Result is truncated or hard to read

**Cause**: Large or deeply nested objects.

**Solution**:
- Use JSON.stringify with indentation: `JSON.stringify(data, null, 2)`
- Copy the result and paste into an external editor
- Query specific properties instead of the entire object

---

## Next Steps

- Explore the **Properties Tab** to edit element attributes
- Use the **Tree View** to navigate model hierarchy
- Configure **Viewpoints** to customize visualization
- Check out the **DEVELOPER_GUIDE.md** for advanced console customization

---

*Last updated: January 2026*
