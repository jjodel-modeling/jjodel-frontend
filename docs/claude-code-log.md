# Claude Code Session Log

## 2026-03-24 — Fix: prompt dialog passes typeRef, renders correct widget, validates by type

### Goal
Fix JjtlPromptDialog so it receives the `typeRef` from the DialogRequest and uses it to:
- Render the appropriate input widget (text, number, date, checkbox)
- Validate input on submit (reject non-numeric for EInt/EFloat)
- Show inline error message without closing the dialog

### Changes
- `JjtlDialogManager.tsx`: pass `typeRef={request.typeRef}` to JjtlPromptDialog
- `JjtlPromptDialog.tsx`: add `typeRef` prop; render `<input type="number">` for EInt/EFloat, `<input type="date">` for EDate, `<input type="checkbox">` for EBoolean, `<input type="text">` for everything else; validate EInt (parseInt) and EFloat (parseFloat) on submit with inline red error; return string values in all cases

### Files changed
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlPromptDialog.tsx`

---

## 2026-03-24 — Feat: trace shows rule name and userProvided flag per binding

### Goal
Enhance trace model and MappingTraceView to:
1. Show `TraceLink.rule` (e.g. "Person -> Human") — already wired, confirmed visible
2. Add `userProvided` flag to `BindingTrace` for prompt()/input() values
3. Show a "user input" badge (cyan, `bi-person-fill` icon) next to user-provided binding values

### Changes
- `traceModel.ts`: added `userProvided?: boolean` to `BindingTrace` interface and `TraceLinkBuilder.addBinding()` parameter
- `executor.ts`: added `isUserProvidedExpression()` helper; passes `userProvided` to `addBinding()` when the top-level expression is `PromptExpression` or `InputExpression`
- `MappingTraceView.tsx`: added `userProvided?: boolean` to `AttributeMapping` interface; renders "user input" badge with `bi-person-fill` icon when `binding.userProvided === true`
- `MappingTraceView.scss`: added `.trace-binding-user-provided` style (cyan badge, 10px font)
- `useJjtlExecutor.ts`: both adapter paths now pass `invertible`, `expression`, and `userProvided` from `BindingTrace` to `AttributeMapping`

### Files changed
- `frontend/src/jjtl/executor/traceModel.ts`
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/views/MappingTraceView.tsx`
- `frontend/src/jjtl/views/MappingTraceView.scss`
- `frontend/src/jjtl/hooks/useJjtlExecutor.ts`

---

## 2026-03-24 — Fix: prompt() shows typeRef as default value in dialog

### Bug
`prompt('Age', EInt)` pre-filled the input field with "EInt" because `ReactUIBridge.showPrompt` had a 2-param signature `(message, defaultValue?)` while `UIBridge` interface had 3 params `(message, typeRef, defaultValue?)`. The executor passed `typeRef` as the second arg, which ReactUIBridge treated as `defaultValue`.

### Fix
- `ReactUIBridge.ts`: added `typeRef` parameter to `showPrompt` signature and to the emitted `DialogRequest`
- `DialogRequest` prompt type: added `typeRef: string` as a separate field from `defaultValue`
- `JjtlPromptDialog` and `JjtlDialogManager` already correctly use only `defaultValue` — no changes needed

### Files changed
- `frontend/src/jjtl/executor/ReactUIBridge.ts`

---

## 2026-03-24 — Feat: wire JjTL interactive commands to executor

### Goal
Connect the 4 interactive AST nodes (AlertStatement, NotifyStatement, PromptExpression, InputExpression) — already parsed but not executed — to the UIBridge so they actually trigger UI dialogs during transformation execution.

### Design decisions
- `evaluateExpression` stays synchronous (JjelFunction.call returns JjelValue, not Promise)
- New `evaluateExpressionAsync` wrapper handles PromptExpression/InputExpression via UIBridge
- Body iteration methods and the execution chain up to `execute()` are now async
- AlertStatement/NotifyStatement handled directly in the 3 body iteration loops
- PromptExpression/InputExpression intercepted at the attribute mapping level via evaluateExpressionAsync

### Changes
- `executor.ts`: added imports for interactive AST types + getUIBridge
- `executor.ts`: added `evaluateExpressionAsync()` — async wrapper that intercepts Prompt/Input, delegates rest to sync evaluateExpression
- `executor.ts`: added AlertStatement + NotifyStatement handling in executeAttributeMappings, executeAttributeMappingsWithTrace, executeObjectCreation
- `executor.ts`: made execution chain async: execute → executeClassMapping → executeMultiSourceClassMapping → executeAttributeMappings/WithTrace → executeAttributeMapping/WithTrace → executeConversion, executeObjectCreation, executeForAllMapping, executeForAllMappingOnObject
- `ProjectEditor.tsx`: added `await` to executeTransformation call (already in async function)

### Files changed
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/components/project/ProjectEditor.tsx` (1 line: added await)

---

## 2026-03-24 — Fix: context menu icon color inherits from text

### Goal
Icon color in context menu items must match text color, not be dimmed independently.

### Change
- Removed hardcoded `color: #64748b` on `.item i.bi` — now uses `color: inherit`
- Removed separate `:hover i.bi` color override (no longer needed)
- Icons now match text color in all states: normal (`#cbd5e1`), danger, muted, hover

### Files changed
- `frontend/src/components/contextMenu/style.scss` — 2 lines removed, 1 changed

---

## 2026-03-24 — Style: unified dark slate floating surfaces

### Goal
Unify all floating surfaces (context menus, edge type popup) to a single dark slate style with consistent design tokens.

### Design tokens applied
- background: `#1e293b`, border: `1px solid #334155`, border-radius: `8px`
- box-shadow: `0 2px 12px rgba(0,0,0,0.2)`
- item: 12px, `#cbd5e1`, padding `5px 8px`, border-radius `4px`
- item icon: `#64748b`, 13px
- hover: `rgba(255,255,255,0.06)`
- active: `#38bdf8` text, `rgba(14,165,233,0.12)` bg
- danger: `#f87171`, hover `rgba(239,68,68,0.12)`
- divider: `0.5px solid rgba(255,255,255,0.08)`
- section label: 10px, `#475569`, uppercase, letter-spacing `.08em`

### Files changed
- `frontend/src/components/editor-v2/_themes.scss` — added `--float-*` CSS variables to both theme-dark and theme-light (identical dark floating surface in both themes, except shadow intensity)
- `frontend/src/components/editor-v2/EditorV2.scss` — editor-v2 `.context-menu` now uses `var(--float-*)` tokens
- `frontend/src/components/editor-v2/components/EdgeTypePopup.scss` — replaced hardcoded dark values with `var(--float-*)` tokens; unified border-radius to 8px, padding to 4px
- `frontend/src/components/contextMenu/style.scss` — legacy context menu updated to dark slate (hardcoded values since it's outside editor-v2 scope)

### Notes
- **FeaturesPalette** is a sidebar panel (not a floating surface) — left unchanged. If "primitives popover" refers to a different component, it should be identified separately.
- **No TSX changes** — all three surfaces use CSS classes (no inline styles for the floating container itself).
- **No class renames** — existing class names preserved.
- Pre-existing TS errors unrelated to this change (GraphDataElements, EcoreService, view.tsx).

---

## 2026-03-24 — Style: context menu visual polish

### Changes
- Reduced border-radius from `var(--radius-lg)` (12px) to 8px for a tighter look
- Reduced `<hr>` separator margin from `var(--space-1)` to 2px to tighten vertical spacing
- Added subtle 0.5px divider before Delete item (targeted via `[data-cannotdelete]` attribute)
- Added subtle 0.5px divider before Help item (targeted via `:has(> .bi-question-circle)`)

### Files changed
- `frontend/src/components/contextMenu/style.scss`

## 2026-03-23 — Fix: white page — U.toHtml() undefined at module load (MyRcDock.tsx)

### Problem
App shows white page with error loop: `MyRcDock.tsx: Cannot read properties of undefined (reading 'toHtml')` — first at line 308 (`dropIndicator`), then at line 419 (`makeAnchorControl` → `anchorControls`).

### Root cause
Two top-level variable initializers called `U.toHtml(...)` at **module scope**:
1. `dropIndicator` (line 308) — dead code, never used elsewhere
2. `anchorControls` array (lines 421-426) — calls `makeAnchorControl()` which uses `U.toHtml()`

`U` is resolved from `windoww.U` at import time (`joiner/index.ts:105`). Due to module load order, `U` can be `undefined` when `MyRcDock.tsx` is first evaluated, crashing the app before any component renders.

### Fix
Deferred both into lazy-init getter functions:
- `getDropIndicator()` — creates `dropIndicator` on first access
- `getAnchorControls()` — creates `anchorControls` array on first access, updated the one call site (line 614)

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/dock/MyRcDock.tsx` | Lazy-init `dropIndicator` and `anchorControls`; updated call site at line 614 |

### Verification
- Vite dev server starts cleanly

---

## 2026-03-23 — Fix: white page regression (ansi-to-html require)

### Problem
After the scoping fix commit, the app showed a white page with error loop:
`MyRcDock.tsx:308: Cannot read properties of undefined (reading 'toHtml')`

### Root cause
`UX.tsx` imported `ansi-to-html` via `require()` (line 23), which returns `{}` in the Vite/browser environment. This could cause module initialization failures cascading to other components. Additionally, `U.objectInspect()` had a typo: it cached the `Convert` instance under `window.ansiconvert` (lowercase) but read from `window.ansiConvert` (uppercase), so the instance was never cached and recreated on every call.

### Fix
1. **UX.tsx**: Removed unused `require('ansi-to-html')` — `Convert` was imported but never referenced in UX.
2. **U.tsx `objectInspect()`**: Fixed cache key typo (`ansiconvert` → `ansiConvert`) and added null-check safety net — if `ansiConvert.toHtml` is not a function, falls back to plain `util.inspect()` without ANSI colors.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/common/UX.tsx` | Removed unused `require('ansi-to-html')` |
| `frontend/src/common/U.tsx` | Fixed `objectInspect()` cache key typo + null-check on `toHtml` |

### Verification
- Vite dev server starts cleanly
- Zero TypeScript errors
- Scoping fix (commit `7bd2bd05f`) untouched — it did not modify UX.tsx, U.tsx, or MyRcDock.tsx

---

## 2026-03-23 — Fix: `classes` scoped to active metamodel tab

### Problem
`forall c in classes : c.name` returned classes from the wrong metamodel (metamodel_1) when the user was viewing metamodel_3 — because both code paths (`getActiveMetamodel()` and Console `getFallbackModel()`) relied on `_lastSelected` which tracks the last clicked element, NOT the currently visible tab.

### Root cause
Two independent code paths build the JjEL evaluation context:
1. **JjScript executor** (`eval.ts` → `buildEvalContext` → `getTargetMetamodel` → `getActiveMetamodel`)
2. **Console component** (`Console.tsx` → `mapStateToProps` + `getFallbackModel` → `jjelEval`)

Both used `state._lastSelected` (stale after tab switch without clicking an element) and fell back to `m2models[0]` / first metamodel.

### Fix
Use **DockManager active tab ID** as primary source of truth (tab IDs = metamodel pointer IDs):

1. `getActiveMetamodel()` now queries `DockManager.dock.getLayout().dockbox.children[0].activeId` first, falling back to `_lastSelected` only when dock is unavailable.
2. Console `getFallbackModel()` similarly uses DockManager active tab before falling back to `m2models[0]`.
3. Console `mapStateToProps` clears stale `_lastSelected.node` when the node belongs to a different metamodel than the active tab.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjscript/executor/utils.ts` | `getActiveMetamodel()` uses DockManager active tab; added helper `getActiveTabMetamodel()` |
| `frontend/src/components/editors/Console.tsx` | `getFallbackModel()` uses DockManager; `mapStateToProps` clears cross-tab stale node |

### Tests
329 tests passing (172 JjEL + 157 JjTL), unchanged.

---

## 2026-03-23 — JjEL: object literals

### What
Added object literal syntax to JjEL: `{key: value, ...}`. Keys can be identifiers or quoted strings. Supports empty objects `{}`, dot access `{name: "x"}.name`, index access `{"my-key": v}["my-key"]`, nesting, and use as forall projections.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjel/types/ast.ts` | Added `ObjectLiteralExpr`, `ObjectLiteralEntry` types to union |
| `frontend/src/jjel/types/tokens.ts` | Added `LBRACE` token type |
| `frontend/src/jjel/lexer/lexer.ts` | Handle `{` → `LBRACE` token |
| `frontend/src/jjel/parser/parser.ts` | Added `objectLiteral()` production in `primary()` |
| `frontend/src/jjel/evaluator/evaluator.ts` | Added `evaluateObjectLiteral()` — produces plain JS objects |
| `frontend/src/jjel/__tests__/parser.test.ts` | 11 new parser tests for object literals |
| `frontend/src/jjel/__tests__/evaluator.test.ts` | 16 new evaluator tests (dot/index access, sortBy, groupBy, forall) |
| `frontend/src/jjel/SPEC.md` | Updated grammar, composite types table, operators |

### Tests
172 JjEL tests passing (was 145), 157 JjTL tests passing (unchanged).

---

## 2026-03-23 — JjEL grammar update: `|` as alias, `:` reserved for projection

### What
Updated JjEL grammar with three changes:
1. **`|` added as alias for `such that`** — works in both `forall` and `exists` filter clauses
2. **`:` removed from `exists`** — `:` is now reserved exclusively for `forall` projections (breaking change)
3. **Nested parenthesized expressions** work correctly: `forall c in classes | (exists a in c.attrs | a.isPublic) : c.name`

### Breaking change
`exists x in S : pred` is no longer valid syntax. Must use `exists x in S such that pred` or `exists x in S | pred`.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjel/types/tokens.ts` | Added `PIPE` token type |
| `frontend/src/jjel/lexer/lexer.ts` | Handle `\|` → `PIPE` token |
| `frontend/src/jjel/parser/parser.ts` | `exists()`: reject `:`, accept `\|`; `forAll()`: accept `\|` as alias |
| `frontend/src/jjel/types/ast.ts` | Updated doc comments |
| `frontend/src/jjel/__tests__/parser.test.ts` | Updated exists tests, added rejection test |
| `frontend/src/jjel/__tests__/evaluator.test.ts` | Changed `exists ... :` → `exists ... such that` |
| `frontend/src/jjtl/__tests__/jjel-delegation.test.ts` | Changed 4 exists expressions |
| `frontend/src/jjel/SPEC.md` | Updated exists syntax, examples, summary table |
| `CLAUDE.md` | Updated core constructs table |
| `docs/jjel-jjtl-audit.md` | Updated exists example |
| `docs/jjtl-jjel-paper.tex` | Updated 3 exists examples + description |
| `docs/claude-code-log.md` | This entry |

---

## 2026-03-22 — JjEL integration in JjScript (forall, exists, with)

### What
Added JjEL expression evaluation support to JjScript. Users can now type `forall`, `exists`, and `with` expressions directly in the JjScript console/chat, and the expression is evaluated against the active metamodel context via JjEL delegation (same pattern as JjTL).

### How it works
1. **Parser detection:** When the first token is `forall`, `exists`, or `with`, the parser captures the entire input as a raw JjEL expression string (no AST construction — JjEL has its own parser).
2. **Executor delegation:** The new `executeEval` command handler builds an `EvaluationContext` from the active metamodel (classes, attributes, metamodel, project), then calls `jjelEval(expression, variables)`.
3. **Context building:** L-layer proxy objects are converted to plain JjelValue objects using shallow conversion to avoid circular reference issues. Available context variables: `classes`, `attributes`, `metamodel`, `project`.
4. **Result display:** Array results are shown as bulleted lists; scalars are shown directly; errors show the JjEL error message with a syntax hint.

### Examples
- `forall c in classes : c.name` → list of class names
- `forall c in classes such that c.isAbstract : c.name` → abstract class names only
- `forall c in classes | (exists a in c.attributes | a.name == "pippo")` → classes with attribute "pippo"
- `eval 2 + 3` → `5` (explicit eval command also supported)

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjscript/types.ts` | Added `'eval'` to `CommandType`, `COMMANDS`, `CommandArgs`; added `EvalArgs` interface |
| `frontend/src/jjscript/parser/parser.ts` | Added JjEL trigger detection (`forall`/`exists`/`with`); added `parseEvalCommand()` for explicit `eval` syntax |
| `frontend/src/jjscript/executor/commands/eval.ts` | Created — `executeEval` with context building and `jjelEval` delegation |
| `frontend/src/jjscript/executor/executor.ts` | Added `case 'eval'` dispatch |
| `frontend/src/jjscript/services/JjScriptService.ts` | Added JjEL trigger detection in `startsWithCommand`; added `formatEvalResult` for chat display |
| `docs/claude-code-log.md` | Updated with this entry |

---

## 2026-03-22 — JjEL delegation architecture exploration (JjTL → JjScript)

### What
Read-only exploration of how JjTL delegates expression evaluation to JjEL, to plan replicating the same mechanism in JjScript.

### Key findings
- **Delegation pattern:** JjTL executor holds a persistent `JjelEvaluator` instance. All expressions pass through `evaluateExpression()` → `toJjelAst()` (bridge) → `jjelEvaluator.evaluate(jjelExpr, ctx)`. The same `EvaluationContext` object is shared by reference.
- **Standalone function calls bypass the bridge** — executor intercepts `FunctionCall` with `Identifier` callee and calls builtins directly via `ctx.getBuiltin()`.
- **JjScript has zero JjEL integration** — no imports, no expression evaluation, no variable bindings. The `ExecutionContext.variables` map exists but is never used.
- **Integration is surgical, not a refactoring** — JjEL's `EvaluationContext.child()` and `JjelEvaluator.evaluate(expr, ctx)` are already designed for external consumers. JjScript can use the JjEL parser directly (no bridge needed). Estimated ~200-300 lines of new code.

### Output
- Created `docs/jjel-delegation-architecture.md` — full report with exact signatures, context flow, gap analysis, and recommended integration approach.

### Files changed
| File | Change |
|------|--------|
| `docs/jjel-delegation-architecture.md` | Created — delegation architecture report |
| `docs/claude-code-log.md` | Updated with this entry |

---

## 2026-03-22 — Singleton instances rendering on M1 canvas (Phase 2)

### What
Connected the View menu "Show singleton instances" toggle to the EditorV2 canvas. When enabled, singleton class instances are created/revealed on the M1 canvas with a diamond badge; when disabled, they are hidden (DVertices persist in Redux for position preservation).

### Architecture
- **syncState.ts**: New `suppressedSingletonIds` Set — module-level coordination between EditorV2 and useJjomSync. When singletons are hidden, their DVertex IDs are added to this set so both init and incremental sync paths skip them.
- **useJjomSync.ts**: Checks `isSingletonSuppressed(id)` in both the full init path (mount/modelid change) and the incremental additions path. Suppressed vertices are skipped entirely.
- **EditorV2.tsx**: Listens for `jjodel:toggle-singletons` custom event. On show: clears suppression, transforms existing DVertices to RF nodes (or creates new DObject+DVertex via `syncCreateObject` for singletons without instances). On hide: suppresses vertex IDs, removes RF nodes. On mount with toggle off: pre-suppresses existing singleton vertices.
- **ObjectNode.tsx**: Reads `isSingleton` flag from metaclass in Redux, renders diamond badge in top-right corner.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/editor-v2/sync/syncState.ts` | Added `suppressedSingletonIds` Set with suppress/unsuppress/clear/get functions |
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | Import `isSingletonSuppressed`, skip suppressed vertices in init + incremental sync |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Added singleton toggle event listener, show/hide logic, initial suppression on mount |
| `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | Read `isSingleton` from Redux metaclass, render diamond badge conditionally |
| `frontend/src/components/editor-v2/EditorV2.scss` | Added `.singleton-badge` styles (16×16px slate badge with white diamond icon) |

### Key decisions
- **DVertices persist when hidden** — positions preserved in Redux store, no localStorage backup needed
- **Suppression set** pattern (not RF node filtering) — integrates cleanly with existing anti-bounce coordination in syncState.ts
- **New instances auto-positioned** — below existing nodes (y = maxY + 60), spaced horizontally (gap 220px)
- **Badge uses same slate style** (#334155) as other UI indicators per design system

---

## 2026-03-22 — "Show singleton instances" toggle in View menu (Phase 1)

### What
Added a per-model toggle "Show singleton instances" to the View menu (between Fullscreen Mode and Debug Mode). The toggle is disabled when the active tab is a metamodel or the dashboard — only enabled for M1 model tabs.

### State management
- **Per-model localStorage**: key `jjodel.showSingletons.<modelId>`
- Syncs on active tab change via `jjodel:active-tab` event
- Dispatches `jjodel:toggle-singletons` custom event with `{ modelId, show }` for canvas consumption
- Console logs `[singleton] show=<bool>, modelId=<id>` for Phase 2 verification

### Files changed
| File | Change |
|------|--------|
| `frontend/src/pages/components/Navbar.tsx` | Added singleton toggle state, `getActiveModelTab()` helper, `toggleShowSingletons()`, menu item with diamond icon and contextual disable |

### Pattern
Follows the TreeView toggle pattern: localStorage-backed `useState` + custom event for cross-component sync. Menu item uses the Debug Mode checkmark pattern (`✓` suffix + filled/outline icon).

---

## 2026-03-22 — Singleton class underline on canvas

### What
Added visual indicator for singleton classes on the editor-v2 canvas: the class name appears underlined when `isSingleton === true`, following UML convention.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/editor-v2/types.ts` | Added optional `isSingleton` to `ClassNodeData` |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | Pass `isSingleton` from LClass proxy to node data |
| `frontend/src/components/editor-v2/nodes/ClassNode.tsx` | Read `isSingleton`, add `singleton` CSS class |
| `frontend/src/components/editor-v2/EditorV2.scss` | `.singleton .mm-node__name { text-decoration: underline }` |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Added `isSingleton: false` to new class node data |

### Pattern
Follows the same pattern as `isAbstract` → `.abstract` → italic name. Singleton uses `.singleton` → underline name.

---

## 2026-03-21 — Surface hierarchy variables in editor-v2 _themes.scss

### What
Added surface hierarchy CSS variables (`--topbar-bg`, `--topbar-border`, `--topbar-text`, `--panel-bg`, `--panel-border`, `--sidebar-bg`, `--sidebar-border`) to both dark and light theme blocks in `_themes.scss`. Also updated light theme canvas: `--canvas-bg` from `#f8fafc` → `#f1f5f9`, `--canvas-dots` from `rgba(0,0,0,0.08)` → `rgba(100,116,139,0.25)` for more visible dot grid.

### Light theme surface values
| Variable | Value | Purpose |
|----------|-------|---------|
| `--topbar-bg` | `#1e293b` | Dark topbar (slate-800) |
| `--topbar-border` | `#334155` | Topbar bottom border |
| `--topbar-text` | `#94a3b8` | Muted topbar text |
| `--panel-bg` | `#ffffff` | White properties panel |
| `--panel-border` | `#e2e8f0` | Panel divider |
| `--sidebar-bg` | `#f8fafc` | Sidebar (slate-50) |
| `--sidebar-border` | `#e2e8f0` | Sidebar divider |

### Dark theme surface values
| Variable | Value |
|----------|-------|
| `--topbar-bg` | `#0f172a` |
| `--topbar-border` | `#1e293b` |
| `--topbar-text` | `#64748b` |
| `--panel-bg` | `#1e293b` |
| `--panel-border` | `rgba(255,255,255,0.08)` |
| `--sidebar-bg` | `#253347` |
| `--sidebar-border` | `rgba(255,255,255,0.06)` |

### STEP 4 note
Grep found no hardcoded panel/sidebar/topbar backgrounds in editor-v2 or abstract SCSS that needed migration — existing rules already use `var(--surface-*)` CSS variables. The new variables are ready for consumption by future component work.

### Files Modified
- `frontend/src/components/editor-v2/_themes.scss` — both theme blocks updated

---

## 2026-03-21 — Remove editor-v3

### What
Removed `src/components/editor-v3/` entirely and cleaned up all external references. Editor V3 was a viewpoint-first architecture experiment; editor-v2 remains the active editor.

### Deleted
- `frontend/src/components/editor-v3/` — entire directory (EditorV3Shell, EditorV3Inner, contexts, hooks, nodes, edges, panels, styles, sync, toolbar, viewpoint, types, constants)

### Modified
| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Removed `EditorV3Shell` import and `editor-v3` route |
| `frontend/src/components/abstract/tabs/EditorSwitch.tsx` | Removed `EditorV3Shell` import, `'v3'` from `EditorMode` type, localStorage v3 override, and v3 render branch |
| `frontend/src/styles/tokens/_colors-dark.scss` | Removed "editor-v3" from comment |
| `frontend/src/styles/tokens/_colors-light.scss` | Removed "editor-v3" from comment |

### Verification
- `npx tsc --noEmit`: no new errors introduced (all errors are pre-existing)

## 2026-03-21 — Editor Surface Hierarchy (visual depth)

### What
Applied visual surface hierarchy to the editor-v3 surfaces: canvas, palette, properties panel, toolbar, tree view, and panel headers. Creates clear visual layering between zones.

### Surface map applied (light theme)

| Zone | Background | Border | Notes |
|------|-----------|--------|-------|
| Canvas | `#f1f5f9` (slate-100) | — | Dot grid: `#cbd5e1` 0.8px / 14px |
| Left sidebar (palette) | `#f8fafc` (slate-50) | right `#e2e8f0` | New `--color-palette-bg` token |
| Properties panel | `#ffffff` | left `#e2e8f0` | Unchanged `--color-panel-bg` |
| Panel headers | `#1e293b` (dark) | bottom `#334155` | Text `#94a3b8` |
| Canvas toolbar | `#f8fafc` (slate-50) | `#e2e8f0` all-around | Plus existing shadow |
| Tree view panel | `#f8fafc` | left `#e2e8f0` | Updated `$color-bg-primary` |
| Nodes on canvas | `#ffffff` | — | Shadow already `rgba(0,0,0,0.06)` ✓ |

### Files modified (SCSS only)

| File | Changes |
|------|---------|
| `styles/tokens/_colors-light.scss` | `--color-canvas-bg` → slate-100, `--color-canvas-grid` → slate-300, `--color-panel-header-bg` → #1e293b (dark), `--color-panel-header-text` → #94a3b8, new `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border`, `--color-toolbar-bg` → slate-50 |
| `styles/tokens/_colors-dark.scss` | Added matching `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border` tokens |
| `editor-v3/styles/editor-v3.scss` | Canvas `.react-flow` now uses `background-color` + `background-image` (radial dot grid) + `background-size` |
| `editor-v3/styles/panels.scss` | `.v3-palette` uses `--color-palette-bg`, header borders use `--color-panel-header-border`, added `.v3-properties__type-badge` styles |
| `editor-v3/styles/toolbar.scss` | Added `border: 1px solid var(--color-toolbar-border)` |
| `TreeViewSidebar/tree-view-sidebar.scss` | `$color-bg-primary` → #f8fafc, `$color-border` → #e2e8f0 |

### TSX notes (not modified per constraints)
- **Entity type badge** (`.v3-properties__type-badge`): CSS class added but needs TSX wiring in `PropertiesPanel.tsx` to render `<span class="v3-properties__type-badge">MODEL</span>` in the header
- Editor-v2 does not use CSS custom properties from the token system — no regression risk

### Build
SCSS compiles cleanly. Pre-existing build error (Vite `import.meta.url` in react-scripts webpack) unchanged.

---

## 2026-03-21 — Centralized Entity Icons & Colors (`entityMeta.ts`)

### What
Created `frontend/src/common/entityMeta.ts` as the single source of truth for entity type icons (Bootstrap Icon names), colors, and badge letters. Migrated three high-priority files to consume it.

### New file: `frontend/src/common/entityMeta.ts`
- `EntityType` union type (15 types: metamodel, model, class, attribute, etc.)
- `ENTITY_META` record with icon, color, badgeBg/badgeText (light+dark), letter per type
- Colors sourced from `docs/DESIGN-SYSTEM.md` §2.2 (artifact types) and `tree-view-sidebar.scss` $color-* variables (sub-entity types)
- `resolveEntityType(raw)` — maps D-prefixed class names, ElementBadge strings, and palette action types to canonical `EntityType`
- Helpers: `entityIcon()`, `entityColor()`, `entityLetter()`, `entityIsAbstract()`

### Files migrated
| File | What changed |
|------|-------------|
| `TreeViewContent.tsx` | Icon letter derivation now uses `resolveEntityType()` + `entityLetter()` instead of `className.slice(1,2)`. Transformation icon uses `entityIcon('transformation')`. |
| `AdaptivePalette.tsx` | All hardcoded `bi-*` icon strings in M2_SECTIONS replaced with `entityIcon()` calls. M1 instance icon also migrated. |
| `ElementBadge.tsx` | Removed `TYPE_LETTERS` record; now uses `resolveEntityType()` + `entityLetter()` from entityMeta. |

### NOT migrated (noted for future)
- **Tree View colors** (`tree-view-sidebar.scss`): uses SCSS $color-* variables and CSS classes (`.tree-DClass`, etc.) — separate SCSS migration needed
- **element-badge.scss**: badge bg/text colors are hardcoded in SCSS, not inline — separate migration to CSS custom properties from `ENTITY_META` needed
- **tab-title.scss**: uses `::before` pseudo-elements with hardcoded colors — SCSS migration
- **Icons.tsx** (`pages/components/icons/`): action icons (undo, redo, delete), not entity types — no migration needed
- **Project.tsx**: project type icons (public/private/collaborative), not entity types — no migration needed

### Build
Zero TypeScript errors in modified files. Pre-existing errors unchanged.

---

## 2026-03-21 — Fix: Restore colored badges in Project Dashboard

### Problem
`ElementBadge` for metamodel, model, and transformation types used muted slate gray in the dashboard. The design system (`docs/DESIGN-SYSTEM.md` §2.2) defines distinct artifact type colors that should be used consistently across the UI.

### Fix (element-badge.scss only)
Updated badge colors to match **DESIGN-SYSTEM.md §2.2** canonical artifact type colors:
- **Metamodel (Violet):** `#EEEDFE` / `#534AB7` (light), `rgba(127,119,221,0.2)` / `#AFA9EC` (dark)
- **Model (Amber):** `#FAEEDA` / `#854F0B` (light), `rgba(186,117,23,0.2)` / `#FAC775` (dark)
- **Transformation (Teal):** `#E1F5EE` / `#0F6E56` (light), `rgba(29,158,117,0.2)` / `#5DCAA5` (dark)
- Viewpoint (Pink) was already correct — no change needed

### Files Modified
- `frontend/src/components/common/element-badge.scss` — updated metamodel, model, transformation/epsilon colors (light + dark mode)

---

## 2026-03-21 — Fix: Context menu missing background/border in Project Dashboard

### Problem
The ⋮ context menu on metamodel/model rows in the project dashboard rendered without background, border, or box-shadow — text was unreadable over the list content.

### Root Cause
CSS specificity collision: `contextMenu/style.scss` defines a generic `.context-menu` using CSS custom properties (`var(--color-bg-elevated)`, etc.) that aren't defined in the project dashboard context. Since both definitions have equal specificity, load order determined the winner, and the generic one (with unresolved variables) won.

### Fix (project-editor.scss only)
Scoped `.context-menu` under `.project-editor` (both light and dark mode blocks) to increase specificity and guarantee the hardcoded project-dashboard styles always win.

### Files Modified
- `frontend/src/components/project/project-editor.scss` — changed `.context-menu` to `.project-editor .context-menu` (lines 535 and 949)

---

## 2026-03-19 — Fix: Properties panel empty when metamodel is empty or nothing selected

### Problem
When a metamodel had no elements (empty) or when clicking the canvas to deselect, the Properties panel showed nothing. `_lastSelected.modelElement` was either `undefined` (deselectAll else branch) or not set at all (useEffect guard skipped when `findModelElement` returned falsy for empty models).

### Root Cause
1. **useEffect:** `findModelElement()` returns a class/package ID, but for empty metamodels there are none. The `if (modelElement)` guard prevented setting `_lastSelected` at all.
2. **deselectAll else branch:** When `findModelElement` returned null/undefined, the code set `_lastSelected` to `undefined`, which meant Info.tsx received no `dataID` and rendered the empty state.

### Fix (useJjomSelection.ts only)
1. **useEffect:** Removed the `if (modelElement)` guard. Now always sets `_lastSelected` with `modelElement ?? modelid` — falls back to the model ID itself.
2. **deselectAll else branch:** Instead of setting `undefined`, sets `modelElement: modelid` — points to the model itself.

### Why it works
`Info.tsx` receives `dataID = modelid`, resolves it via `LModelElement.fromPointer(modelid)` which returns the `LModel` root, and renders `PropertiesOverview` with the metamodel stats.

### Files Modified
- `frontend/src/components/editor-v2/hooks/useJjomSelection.ts` — two changes (useEffect fallback + deselectAll else branch)

### Build Verification
- TypeScript: no new errors (`npx tsc --noEmit`)
- Pre-existing errors in DockManager.ts:237, MetamodelTab.tsx unchanged

---

## 2026-03-19 — Rollback: revert "Properties panel shows model overview" (caused white page)

### What happened
The previous change added a DockManager-based fallback in `mapStateToProps` (Info.tsx) to show the active model's overview when nothing was selected. This caused a white page on load — `LModel.fromPointer(activeId)` likely threw before DockManager was fully initialized, despite the try/catch.

### Rollback
- Removed the `// When nothing is selected` block from `mapStateToProps`
- Removed the `DockManager` import
- `mapStateToProps` restored to its original form (just nodeID/viewID/dataID + topics + advanced)

### Files Modified
- `frontend/src/components/editors/Info.tsx` — reverted to original `mapStateToProps`

---

## 2026-03-19 — UI polish: empty state scrollbar + minimal resize handle

### Fix 1: No scrollbar when "No element selected"
**Problem:** The Properties panel showed a scrollbar even when displaying the empty state (no element selected). The `.properties-panel` rule had `overflow-y: auto` which created a scrollbar when the empty state content was slightly taller than the container.
**Fix:** Added `.properties-panel--empty { overflow: hidden; }` inside `.properties-panel-container` in `properties-with-tree-view.scss`. The `--empty` class is already applied by Info.tsx when no element is selected.

### Fix 2: Minimal resize handle
**Problem:** The resize handle used a 16px grip icon with cyan hover effects — visually heavy and inconsistent with the app's minimal aesthetic.
**Fix:** Replaced with a 1px line design:
- Visually: 1px line in `#e2e8f0` (slate-200), becomes `#94a3b8` (slate-400) on hover
- Hit area: 5px (transparent padding around the line)
- Supports both `horizontal` (row-resize) and `vertical` (col-resize) orientations via `orientation` prop
- No decorative elements (no grip dots, no icon, no shadow)
- Removed debug console.log statements
- Simplified keyboard handling (removed synthetic mouse event hack)

### Files Modified
- `frontend/src/components/editors/properties-with-tree-view.scss` — added `overflow: hidden` for empty state
- `frontend/src/components/ResizeHandle/ResizeHandle.tsx` — simplified to minimal divider with orientation prop
- `frontend/src/components/ResizeHandle/resize-handle.scss` — rewritten: 1px line + 5px hit area

---

## 2026-03-19 — Refactor: remove duplicate editor-type-change dispatch from Dock.tsx

### Problem
`editor-type-change` was dispatched from three places: `DockManager.open2()`, `_detectActiveTabChange()` in MyRcDock.tsx, and `handleLayoutChange` in Dock.tsx. The Dock.tsx dispatch was redundant (and had the same `state[activeId]` bug) now that MyRcDock catches all tab switches via `componentDidUpdate`.

### Changes
- Removed the `editor-type-change` dispatch block from `handleLayoutChange` in Dock.tsx. Kept only `jjodel:active-tab` (StatusBar) and `data-active-tab` (documentation panel hiding).
- Removed the `setTimeout` initial dispatch block — `_detectActiveTabChange()` fires on first `componentDidUpdate` and handles initial detection.
- Removed unused `store` and `LProject` imports.

### Dispatch points after this change
- `DockManager.open2()` — card click opens model/metamodel
- `DockManager.openDocumentation()` — opens documentation tab
- `DockManager.openTransformation()` — opens transformation tab
- `_detectActiveTabChange()` in MyRcDock.tsx — all tab switches (componentDidUpdate)

### Files Modified
- `frontend/src/components/abstract/Dock.tsx` — removed redundant dispatch, cleaned imports

---

## 2026-03-19 — Fix: click on active tab hides panels

### Problem
Clicking the already-active tab caused panels (TreeView, Properties) to disappear. The `_detectActiveTabChange()` method treated `DockComponent_rightbar_*` IDs as real editor switches, dispatching `editorType: 'summary'` which collapsed the panels via CSS.

### Root Cause
When rc-dock internally refocuses the first panel, `activeId` can momentarily resolve to a `DockComponent_rightbar_*` tab. `_detectActiveTabChange()` processed this as a real tab change and dispatched a `summary` editor type, triggering the CSS rules that hide TreeView and Properties panels.

### Fix
Added an early return guard in `_detectActiveTabChange()` to ignore `DockComponent_rightbar_*` IDs entirely — these are internal rc-dock artifacts, not real editor switches.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `DockComponent_rightbar_` guard

---

## 2026-03-19 — Fix: _detectActiveTabChange resolves metamodel/model correctly

### Problem
`_detectActiveTabChange()` in MyRcDock.tsx always resolved model/metamodel tabs as `summary`. When clicking a metamodel tab, the `[DETECT]` log showed `editorType: 'summary'` instead of `editorType: 'metamodel'`.

### Root Cause
The Redux store lookup used `store.getState()[activeId]` which is always `undefined`. Jjodel's Redux store does not store objects as top-level keys — they live under `state.idlookup[id]`.

### Fix
Changed `store.getState()[activeId]` → `store.getState().idlookup[activeId]` in `_detectActiveTabChange()`. This matches the pattern used throughout the codebase (see `DPointerTargetable.from()` in `joiner/classes.ts:1454`).

**Note:** The same bug exists in `Dock.tsx` (lines 267 and 382) but was not fixed per instructions to only modify MyRcDock.tsx.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — fixed `idlookup` access in `_detectActiveTabChange()`

### Build Verification
- TypeScript: no errors (`npx tsc --noEmit`)

---

## 2026-03-19 — Fix: tab click now dispatches jjodel:editor-type-change

### Problem
Clicking an existing rc-dock tab to switch to it bypassed `DockManager` entirely. The `jjodel:editor-type-change` event was only dispatched by `DockManager.open2()` (new tab creation) and the `onLayoutChange` prop in Dock.tsx. However, rc-dock does not always fire `onLayoutChange` for simple tab switches within the same panel (treats them as "silent changes").

### Root Cause
rc-dock's `onLayoutChange` callback fires on structural layout changes (add/remove/move tabs) but may not fire when only the `activeId` changes within a panel. Tab clicks update `activeId` without changing the layout structure.

### Fix
Overrode `componentDidUpdate` in `PinnableDock` (MyRcDock.tsx) to detect active tab changes after every state update:
- Added `_lastActiveId` field to track the previous active tab ID
- Added `_detectActiveTabChange()` method that reads the current layout's `activeId` for the first (models) panel
- Only dispatches `jjodel:editor-type-change` when `activeId` actually changes (prevents redundant dispatches)
- Uses the same editor type detection logic as Dock.tsx: `jjtl_*` → transformation, `doc_*`/`DockComponent_rightbar_*` → summary, otherwise checks Redux store for DModel

### Why `componentDidUpdate` works
`componentDidUpdate` fires after every React state update, including rc-dock's internal `setState` when a tab is clicked. This catches ALL tab changes regardless of whether rc-dock considers them "silent" or not.

### Dispatch deduplication
- `_lastActiveId` prevents duplicate dispatches on re-renders that don't change the active tab
- When `open2()` creates a new tab and dispatches, `componentDidUpdate` may also fire — the double dispatch is harmless (listeners are idempotent)
- The `open2()` dispatch was intentionally kept per user request

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `store` import, `_lastActiveId` field, `_detectActiveTabChange()` method, call in `componentDidUpdate`

### Build Verification
- TypeScript: no new errors from MyRcDock.tsx (`npx tsc --noEmit`)

---

## 2026-03-19 — Rollback: revert tab-switch fix that broke card flow

### What happened
A previous attempt to fix "tab click not updating panels" added:
1. `resolveEditorType()` + dispatch in `DockManager.open()` found branch
2. `currentTabId` fallback in `Dock.tsx handleLayoutChange`
3. Removed debug logs from multiple files

This broke the working card→panel flow.

### Rollback
- **DockManager.ts**: Removed `resolveEditorType()`, removed dispatch in found branch, removed `store` import. Kept Session 1's duplicate tab guard (`updateTab` + early return).
- **Dock.tsx**: Reverted to HEAD (Session 1 debug logs were the only diff; removing them restored HEAD state which already has full `handleLayoutChange` + editor type detection).
- **Dashboard.tsx**: Minor debug log removal kept (functionally identical).
- **TreeViewPanelContext.tsx**: Minor debug log removal kept (functionally identical).

### Current state: card=✅, tab=❌
Card flow works: `open2()` → `open()` (guard or dockMove) → `open2()` dispatches `editor-type-change`.
Tab click flow broken: clicking a tab in rc-dock tab bar doesn't go through `DockManager` — relies on `onLayoutChange` in Dock.tsx which may not fire for tab switches.

### All `editor-type-change` dispatch/listen points
**Dispatchers:**
- `DockManager.ts:102` — `open2()` after opening model/metamodel
- `DockManager.ts:132` — `openDocumentation()` existing tab
- `DockManager.ts:154` — `openDocumentation()` new tab
- `DockManager.ts:237` — `openTransformation()` existing tab
- `DockManager.ts:266` — `openTransformation()` new tab
- `Dock.tsx:273` — initial type detection on mount (setTimeout)
- `Dock.tsx:393` — `handleLayoutChange` (via `onLayoutChange` prop)
- `Dashboard.tsx:259` — GenericDashboard mount (dispatches 'summary')

**Listeners:**
- `Dock.tsx:253` — sets `body[data-editor-type]`
- `TreeViewPanelContext.tsx:186` — auto-opens tree view for modeling editors

---

## 2026-03-19 — Properties Panel & Navbar: duplicate key, visibility, persistence fixes

### Bug 1: Duplicate key warning in Navbar (DockManager.ts)
**Symptom:** `Warning: Encountered two children with the same key` in NavbarComponent when opening metamodels.
**Root Cause:** `DockManager.open()` called `dockMove()` without checking if a tab with the same ID already existed. Opening the same metamodel twice added a duplicate tab to rc-dock. The Navbar syncs tabs from rc-dock and rendered both with the same key.
**Fix:** Added a guard in `DockManager.open()` that checks `dock.find(tab.id)` before adding. If the tab exists, it activates it via `updateTab()` instead. This matches the pattern already used by `openDocumentation()` and `openTransformation()`.

### Bug 2: Properties Panel empty on first metamodel open (PropertiesWithTreeView.tsx)
**Symptom:** Opening a metamodel for the first time showed an empty Properties panel. Second open worked.
**Root Cause:** `PropertiesWithTreeView` had an early return (`return <div className="...--empty" />`) when `activeEditorType` was not `model`/`metamodel`. On first open, the `jjodel:editor-type-change` event hadn't fired yet (async), so the component rendered the empty div. By the second open, the state was already set.
**Fix:** Removed the early-return guard for non-modeling editors. The component now always renders its full content. Right panel visibility for non-modeling contexts is handled at the CSS level (see Bug 3).

### Bug 3: Properties Panel persists on dashboard + aria-hidden error (style.scss)
**Symptom:** Returning to dashboard left the Properties panel visible. Also caused `aria-hidden on element because its descendant retained focus` error.
**Root Cause:** The right panel was always present in the rc-dock layout. Visibility was only controlled by internal conditional rendering (`{isModelingEditor && ...}`), but rc-dock keeps unmounted tab content hidden with `visibility:hidden` — not removed. Focus could remain trapped in the hidden panel.
**Fix:** Added CSS rules for `body[data-editor-type="summary"]` and `body[data-editor-type="transformation"]` that collapse the right panel (width: 0, opacity: 0, pointer-events: none). Same pattern already used for `data-active-tab="documentation"` and `data-layout-mode="canvas-only"`. The `data-editor-type` attribute is already managed by Dock.tsx's `handleLayoutChange` and the Dashboard's mount effect.

### Files Modified
- `frontend/src/components/abstract/DockManager.ts` — duplicate tab guard in `open()`
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — removed empty-div early return, removed unused `activeEditorType`/`isModelingEditor`
- `frontend/src/components/abstract/style.scss` — CSS rules for summary/transformation editor types

### Build Verification
- TypeScript: no new errors in modified files (`npx tsc --noEmit`)
- Pre-existing error in DockManager.ts:237 (`openTransformation` method) unchanged

---

## 2026-03-17 — Documentation Tab UI Fixes

### Changes

**1. Fix toolbar buttons compression (DocumentationTab.scss)**
- Added `flex-shrink: 0`, `flex-wrap: nowrap`, `overflow-x: auto` to `.toolbar-right` — prevents buttons from being squeezed
- Added `white-space: nowrap`, `flex-shrink: 0` to `.toolbar-btn` — prevents label text from wrapping or overlapping icons
- Added `flex-shrink: 0` to button icons (`i` elements)
- Added `flex-shrink: 0` and `white-space: nowrap` to `.provider-selector` and `.provider-btn`

**2. Hide Properties panel when Documentation tab is active (Dock.tsx, style.scss)**
- In `Dock.tsx` `handleLayoutChange`: detect when active tab is a documentation tab (`activeId === 'documentation'` or starts with `doc_`) and set `body[data-active-tab="documentation"]`
- In `style.scss`: added CSS rule for `body[data-active-tab="documentation"]` that hides the right panel (same pattern as `canvas-only` mode)
- Properties panel is only hidden while Documentation is the active tab; switching to any other tab restores it

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — toolbar button spacing fixes
- `frontend/src/components/abstract/Dock.tsx` — active tab detection for documentation
- `frontend/src/components/abstract/style.scss` — CSS rule to hide right panel for documentation

### Build Verification
- TypeScript: no errors in modified files (`npx tsc --noEmit`)
- SCSS: compiles without errors
- Note: `npm run build` fails due to pre-existing Monaco `import.meta.url` / webpack incompatibility (unrelated)

---

## 2026-03-17 — Fix toolbar buttons still compressed (CSS specificity)

### Root Cause
The previous fix added correct properties to `.toolbar-btn` but they were overridden by a **global** `.toolbar-btn` in `EditorV2.scss` (line 225) which sets `width: 28px; height: 28px`, forcing all toolbar buttons to be 28×28px icon-only squares.

Multiple files define global `.toolbar-btn`: `EditorV2.scss`, `catalog.scss`, `console-tab.scss`, `bottomToolbar.scss`, `logger.scss`. CSS load order made one of these win over the DocumentationTab definition.

### Fix
Scoped all toolbar-related selectors (`.toolbar-left`, `.toolbar-right`, `.toolbar-title`, `.toolbar-btn` and variants) **under `.documentation-toolbar`** parent selector. This gives them higher specificity (`.documentation-toolbar .toolbar-btn` beats global `.toolbar-btn`).

Also added explicit `width: auto; height: auto` to reset the 28×28px constraint from EditorV2.

Dark mode overrides for `.toolbar-btn` also scoped under `.documentation-toolbar`.

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — nested toolbar selectors under `.documentation-toolbar`
