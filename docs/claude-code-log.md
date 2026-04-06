# Claude Code Session Log

## 2026-04-06 — chore: Rimozione dipendenze inutilizzate
**Prompt**: Verifica e rimozione delle dipendenze con zero import nel codebase.
**Pacchetti rimossi** (4):
- `react-itertools@0.0.6` — zero imports
- `nearley-unparse@1.0.1` — zero imports
- `react-scripts@4.0.3` — legacy CRA, progetto migrato a Vite; solo riferimento in `react-app-env.d.ts` (rimosso)
- `webpack-cli@4.9.1` — zero riferimenti in source e config attivi
**Pacchetti tenuti**:
- `path-data-polyfill` — usato in `joiner/index.ts` via `require()`
- `xml-formatter` — usato in `common/libraries/prj_xml2json.js`
- `jquery` + `jqueryui` — usati in 7+ file (Vertex.tsx, MyRcDock.tsx, index.tsx, ecc.)
**File modificati**: `src/react-app-env.d.ts` (rimosso `/// <reference types='react-scripts' />`)
**node_modules**: 757MB → 531MB (−226MB, −30%), 1604 pacchetti rimossi
**Esito**: build ok

## 2026-04-06 — refactor: Event registry centralizzato
**Prompt**: Creare `src/events/registry.ts` con tutti i custom DOM events come costanti tipizzate, sostituire stringhe hardcoded.
**File creato**: `frontend/src/events/registry.ts` — 5 gruppi (`JjodelEvents`, `JjScriptEvents`, `AIEvents`, `JjodieEvents`, `SystemEvents`), 37 costanti evento, 5 type helpers
**File modificati** (44):
- Dock/DockManager/MyRcDock (3 file) — `jjodel:editor-type-change`, `layout-mode-change`, `active-tab`
- TreeViewContent/TreeViewSidebar (2 file) — `selectNode`, `openMegamodel`, `openTransformation`, `transformations`, `treeview:scroll-to-element`, `selectViewInWorkbench`, `toggle-tree-view`
- EditorV2/Toolbar/ClassNode/useJjomSelection/useClassRemoval (5 file) — `child-context-menu`, `toggle-singletons`, `selectNode`, `open-polymetric`, `help-open`, `explain-open`, `layout-mode-change`, `canvas-element-selected`, `toast`
- Navbar/StatusBar/StatusBarRightZone (3 file) — `active-tab`, `toggle-tree-view`, `toggle-singletons`, `layout-mode-change`, `new-project`, `export-canvas`, `open-polymetric`, `transformations`, `jjtl-statusbar`, `ai-provider-changed`
- ProjectEditor (1 file) — `jjtl-execution-result`, `openTransformation`, `openMegamodel`, `transformations`
- Toast/toastDispatch (2 file) — `toast`, `toast-prefs-changed`, `guard-violation`
- Services: ThemeService, JjodieActionExecutor, PromptService, ActivityLogger (4 file) — `theme-changed`, `jjodie:metamodel-updated`, `prompt-changed`, `activity-logged`
- Contexts: TreeViewPanelContext, FeaturesPanelContext (2 file) — 8 jjscript events + `editor-type-change`, `treeview:scroll-to-element`
- Hooks: useInterfaceMode, usePrompt (2 file) — `interfaceModeChange`, `prompt-changed`
- Jodie/JodieWindow/JjodieWidget (3 file) — `jodie:open`, `ai-settings-changed`, `jjscript:executed/executing/execution-end`
- ScriptBlock (1 file) — 14 jjscript event occurrences
- useMetamodelGeneration (1 file) — `jjscript:executing`, `jjscript:execution-end`
- JjtlDevelopmentEnv (1 file) — `jjtl-execution-result`, `jjtl-statusbar`
- Other: ExplainModal, HelpDrawer, HelpButton, MetamodelTab, ContextMenu, MegamodelGraph-toDelete, PolymetricView, AllProjects, Dashboard, AIAssistantSettings, AppearanceSettings, PropertiesWithTreeView, ViewpointWorkbench, ConformanceGuard, types/jodie.ts (15 file)
**Stringhe sostituite**: ~130 occorrenze
**Residui hardcoded**: 0 (esclusi registry.ts, commenti, non-event class names, shortcut labels)
**Esito**: build ok

## 2026-04-06 — refactor: Rimozione editor V3 (viewpoint-editor panel)
**Prompt**: Rimozione sicura dell'editor V3 (panels/viewpoint-editor/) — mappatura dipendenze, pulizia 5 file esterni, build, rm -rf directory.
**File rimossi**: `frontend/src/components/panels/viewpoint-editor/` (23 file, ~1.5MB incl. bootstrapIconCatalog.ts da 1.3MB)
**File modificati**:
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — rimosso import ViewpointEditorPanel, state sidebarMode, event listeners (openViewpointEditor, closeViewpointEditor), render condizionale V3
- `frontend/src/components/editor-v2/Toolbar.tsx` — rimosso vpEditorState, listener jjodel:viewpoint-editor-state, back button + badge JSX
- `frontend/src/components/project/ProjectEditor.tsx` — handleOpenViewpoint e handleCreateViewpoint ora usano DockManager.openViewpoint() diretto + TODO comment
- `frontend/src/pages/components/Dashboard.tsx` — viewpoint click e Open button ora usano DockManager.openViewpoint() diretto + TODO comment
- `frontend/src/utils/lastViewpoint.ts` — rimosso dispatch jjodel:viewCreated (consumato solo da V3)
**Non toccati**: `components/abstract/DockLayout.tsx` (riferimenti V3 già commentati), `components/editors/viewpoint/` (vecchio workbench — ora unico editor viewpoint), `components/editor-v2/viewpoint/ViewpointRenderer.tsx` (utility V2)
**Custom events rimossi**: jjodel:openViewpointEditor, jjodel:viewpoint-editor-state, jjodel:closeViewpointEditor, jjodel:viewCreated
**Esito**: build ok

## 2026-04-05 — audit: Git history analysis (pre vs post Natale 2025)
**Prompt**: Confronto stato codebase prima del 24 dicembre 2025 vs oggi. Volume cambiamenti, snapshot temporali, feature introdotte, aree cresciute, file eliminati.
**File toccati**: `docs/git-analysis-2026-04-05.md` (nuovo)
**Esito**: completato
**Metriche chiave**:
- 301 commit in ~100 giorni (3/giorno), 76% Alfonso, 22% Damiano
- Codebase 3.6× più grande: 303→959 file, 78K→281K LOC (+262%)
- 3 linguaggi DSL creati da zero (JjTL 26K, JjScript 20K, JjEL 6.5K LOC)
- Editor riscritto 2 volte (v2 + v3), AI system interamente nuovo (8 provider + RAG)
- Solo 1 file eliminato — crescita quasi esclusivamente additiva
- Punto di svolta: gennaio 2026 (101 commit, codebase raddoppiato)

## 2026-04-05 — audit: Censimento completo codebase
**Prompt**: Audit completo del codebase Jjodel — struttura directory, inventario componenti React, model layer, JjTL/JjEL/JjScript, AI/Jjodie, styling, dipendenze, TypeScript health, custom events, TODO/bug, metriche sintetiche, red flags.
**File toccati**: `docs/audit-2026-04-05.md` (nuovo)
**Esito**: completato
**Metriche chiave**:
- 400 .tsx + 376 .ts + 183 .scss = ~281K LOC
- 307 componenti React, 42+ custom DOM events
- 3,672 istanze any/as any/@ts-ignore (strict mode attivo)
- 55 dipendenze runtime (5 probabilmente inutilizzate)
- JjTL: 11 test files, JjEL: 2, JjScript: 0
- 8 AI providers supportati, RAG system con IndexedDB
**Red flags**: build system ibrido (react-scripts+Vite), ~600 inline styles, 50+ classi SCSS duplicate, JjScript senza test, jQuery residuo

## 2026-04-04 — feat: AllProjects page redesign
**Prompt**: redesign visivo AllProjects — sidebar light, card accent bar, activity feed grouping, load more, cyan accents
**File toccati**: `frontend/src/pages/dashboard.scss`, `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/pages/components/project-card.scss`, `frontend/src/pages/components/Project.tsx`, `frontend/src/pages/components/catalog/Catalog.tsx`, `frontend/src/pages/components/catalog/catalog.scss`, `frontend/src/pages/components/RightPanel/RightPanel.tsx`, `frontend/src/pages/components/RightPanel/RightPanel.scss`
**Esito**: ✅ completato
**Note**:
- Sidebar active item: cyan text + icon with subtle border (was slate bg)
- Recently Modified: added colored dots (amber for favorites) + relative timestamps (now/3h/2d/1w)
- Project cards: accent bar moved from left-side to top, colored by type (cyan=public, amber=collab/favorite, neutral=private); version badge de-emphasized from green to neutral slate; actions hidden by default, visible on hover
- Tab bar: replaced segmented-control style with underline tabs, active = cyan border-bottom
- Activity feed: already well-implemented with time grouping, colored dots, load more — no changes needed
- Slider pagination: replaced dot carousel with progressive grid + "Load More" button (same pattern as list view)
- Modified Today stat: cyan highlight background (#e0f2fe) on overview grid cell
**Nome del documento prompt**: 2026-04-04 11:30 allprojects-redesign.md

## 2026-03-26 — Fix: `do...end` block executes only the first command

**Prompt**: In a `do...end` block, only the first command is executed. Subsequent commands are ignored.
**File toccati**: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/commands/forall.ts`, `frontend/src/jjscript/executor/commands/let.ts`, `frontend/src/jjscript/executor/dependencies.ts`, `frontend/src/jjscript/components/ScriptExecutionWindow.tsx`
**Esito**: ✅ completato

**Root cause (3 layers)**:
1. **Parser**: No concept of `do...end` blocks. `parseCommand()` returned a single `CommandNode`. After `do` in forall/let, only one command was parsed.
2. **Executor**: No `'block'` command type existed. Even if multiple commands were parsed, there was no way to execute them sequentially.
3. **Script pipeline**: Both `executeScript()` and `ScriptExecutionWindow` split input by newlines, so multiline `do...end` blocks were broken into individual lines.

**Fix**:
1. Added `BlockArgs` type with `commands: CommandNode[]` and `'block'` to `CommandType`
2. Added `parseBlockBody()` (parses commands until `end`), `parseBlockOrCommand()` (detects block vs single command via `hasEndAhead()`), and standalone `do` handling in `parseCommand()`
3. Updated `parseForAllCommand()` and `parseLetCommand()` to use `parseBlockOrCommand()` for body parsing
4. Added `executeBlock()` method in executor — iterates all commands, stops on first error
5. Updated `resolveVariableInBody()` in forall and `resolveVariablesInBody()` in let to handle block nodes recursively
6. Added `groupBlockCommands()` utility to aggregate multiline `do...end` blocks before batch execution
7. Updated `ScriptExecutionWindow` line parser to group `do...end` blocks into single logical lines
8. Updated `extractDependencies()` to handle block nodes

**Design decisions**:
- `do` and `end` are NOT added to COMMANDS/KEYWORDS — they're recognized contextually by the parser (as IDENTIFIER tokens matched via `checkKeyword()`)
- Single-command forall/let (no `end`) remains backward compatible — `parseBlockOrCommand()` falls back to `parseCommand()` when no `end` is found ahead
- Block execution stops on first error (fail-fast semantics)

---

## 2026-03-26 — Fix: `abstract Person` still gives "Unknown command: abstract" after initial fix

**Prompt**: Previous session added all the pieces (types, executor, parser special case) but `abstract Person` still fails.
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
`abstract` is in BOTH `COMMANDS` and `KEYWORDS` arrays. The lexer checks `COMMANDS` first (lexer.ts:371), so it tokenizes `abstract` as `COMMAND` type. But the parser's special-case check (line 139) only matched `IDENTIFIER` or `KEYWORD` — **not `COMMAND`**. So the special case was skipped, and `abstract` fell through to the main switch statement which had no `case 'abstract'`, hitting `default: throw new Error('Unknown command: abstract')`.

**Fix**:
1. Added `token.type === 'COMMAND'` to the special-case condition for abstract toggle
2. Added `case 'abstract'` to the switch as a safety fallback (handles edge case where abstract reaches the switch)

**Lesson**: When a word appears in multiple token-type lists (`COMMANDS` + `KEYWORDS`), the lexer picks the first match. Parser special cases must account for all possible token types.

---

## 2026-03-26 — Fix: `abstract Person` command returns SUCCESS but has no effect (initial fix)

**Prompt**: `abstract Person` in JjScript Console returns SUCCESS + null, but the class doesn't become abstract. The toggle in Properties panel stays off.
**File toccati**: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/commands/abstract.ts` (new), `frontend/src/jjscript/executor/commands/index.ts`
**Esito**: ✅ ma con bug residuo (vedi entry sopra)

**Root cause**:
`abstract` was tokenized as `KEYWORD` (not `COMMAND`). In `parseCommand()`, the check `if (token.type !== 'COMMAND')` was true, so the entire input `abstract Person` was delegated to JjEL as an eval expression. JjEL evaluated it and returned null — no model mutation occurred.

There was no `abstract` command type, no parser handler, and no executor for it.

**Fix**:
- Added `'abstract'` to `CommandType` union and `COMMANDS` array in `types.ts`
- Created `AbstractArgs` interface with `target: QualifiedName`
- Added special case in `parseCommand()`: when first token is `abstract` and next token is an identifier (not `class`), parse as the `abstract` toggle command
- Created `abstract.ts` executor that resolves the class, reads `element.abstract`, toggles with `SetFieldAction.new(element, 'abstract', !currentValue)`
- Wired in `executor.ts` switch and `index.ts` exports

**Semantics**: `abstract Person` toggles — if concrete, makes abstract; if abstract, makes concrete. Message: "Class 'Person' is now abstract/concrete".

**Note**: `abstract class Person` (with `class` keyword) still routes to `create` command as before — the special case only fires when `abstract` is followed directly by an identifier.

---

## 2026-03-25 — Fix: let binding $variable empty in body (missing metamodel context)

**Prompt**: `let $cls = (forall c in classes: c.name) in $cls` parses correctly but returns "Empty result (0 items)" — the forall works standalone but not inside let.
**File toccati**: `frontend/src/jjscript/executor/commands/let.ts`
**Esito**: ✅ completato

**Root cause**:
`evaluateJjel()` in `let.ts` only passed `context.variables` to `jjelEval()` — it did NOT call `buildEvalContext(context)` to include `classes`, `attributes`, `metamodel`, `project`. So when evaluating the valueExpr `(forall c in classes: c.name)`, the identifier `classes` was undefined and the forall returned an empty array.

Compare with `executeEval` in `eval.ts` which correctly calls `buildEvalContext(context)` first, then overlays `context.variables`.

**Fix**:
- Imported `buildEvalContext` from `./eval` into `let.ts`
- Changed `evaluateJjel()` to call `buildEvalContext(context)` first, then overlay `context.variables` on top (so let bindings can reference earlier bindings AND metamodel context)

---

## 2026-03-25 — Fix: forallExistsDepth counter never fires (token type mismatch)

**Prompt**: The `forallExistsDepth` fix in `collectValueExprRaw()` had no effect — same error persisted.
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
`forall` and `exists` are NOT in the JjScript `KEYWORDS` array (`types.ts:560`), so the lexer tokenizes them as `IDENTIFIER`, not `KEYWORD`. The guard at line 864 checked `token.type === 'KEYWORD'` only, so the `forallExistsDepth` counter was never incremented — the fix was dead code.

**Fix**:
- Changed the check from `token.type === 'KEYWORD'` to `(token.type === 'KEYWORD' || token.type === 'IDENTIFIER')` for forall/exists detection in `collectValueExprRaw()`

---

## 2026-03-25 — Fix (ineffective): ambiguità keyword 'in' nel let binding con espressioni JjEL

**Prompt**: `let $cls = forall c in classes: c.name in $cls` produces `[LET_ERROR] Expected 'in' after variable name` because the parser grabs the first `in` (belonging to `forall`) instead of the outer `in` (belonging to `let`).
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ⚠️ Logic was correct but never executed due to token type mismatch (see fix above)

**Fix**:
- Added `forallExistsDepth` counter alongside the existing `parenDepth`
- When a `forall` or `exists` keyword is encountered, increment `forallExistsDepth`
- When `in` is encountered: if `forallExistsDepth > 0`, decrement it (the `in` belongs to the inner construct); otherwise, if `parenDepth === 0`, break (the `in` belongs to the `let`)
- Comma break also requires `forallExistsDepth === 0`
- Handles arbitrarily nested `forall`/`exists` (e.g., `forall ... exists ... in ... in ... in`)

---

## 2026-03-25 — Fix: let binding delegates entire input to JjEL instead of body only

**Prompt**: `let $attribute = prompt('Attribute', EString) in forall c in classes such that c.name == $attribute` produces `[JJEL_ERROR] Unexpected '='`
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
When `parseCommand()` is called recursively from `parseLetCommand()` to parse the body, and the body is a JjEL expression (e.g. `forall` without `do`, `exists`, `with`, or any non-command identifier), the parser used `this.originalInput.trim()` as the JjEL expression text. `originalInput` is the **entire** input string including the `let $var = expr in` prefix, so JjEL received the full let binding syntax and choked on the `=` assignment operator.

**Fix**:
- Added `remainingInput()` helper method that returns `this.originalInput.substring(currentToken.position).trim()` — only the unparsed portion from the current token forward
- Replaced all 3 occurrences of `this.originalInput.trim()` in `parseCommand()`'s JjEL fallback paths with `this.remainingInput()`
- No changes to JjEL or JjTL

---

## 2026-03-25 — Fix: Titolo progetto troncato nell'header della dashboard

**Prompt**: Il titolo H1 del progetto veniva troncato con ellissi — deve andare a capo liberamente
**File toccati**: `project-editor.scss`
**Esito**: ✅ completato

**Changes**:
- Removed `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`, `max-width: 300px` from `.project-header-compact__title`
- Removed `max-width: 300px` from `__title-input` for consistency
- Added `flex-wrap: wrap` to `__row1` so version badges wrap below the title when space is tight

---

## 2026-03-25 — Fix: Documentation section padding/margin alignment

**Prompt**: Align Documentation section margins/padding with Viewpoints and other sections
**File toccati**: `DocumentationSection.tsx`, `DocumentationSection.scss`
**Esito**: ✅ completato

**Changes**:
- Replaced custom `documentation-section` wrapper with shared `project-section` class
- Wrapped documentation card in `list-card` container for consistent border/radius/spacing
- Replaced custom `doc-icon`/`doc-content` structure with `list-card__icon`/`list-card__content`/`list-card__name`/`list-card__type` — pixel-perfect match with Viewpoints cards
- Simplified `DocumentationSection.scss`: removed ~100 lines of custom card/icon/content styles now handled by shared `list-card` classes
- Kept documentation-specific styles: empty state (dashed border), disabled state, status badges, confidence badges, dark mode overrides

---

## 2026-03-25 — Fix: Docs icon in Section Navigator → lettera "D" con sfondo

**Prompt**: Replace Bootstrap icon with letter "D" on colored square, matching M/m/V/⇄ pattern
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`
**Esito**: ✅ completato

**Changes**:
- Changed Docs section from `iconBootstrap: 'bi-file-earmark-text'` to `iconLetter: 'D'` with `iconClass: 'list-card__icon--docs'`
- Added `&--docs` style: background `#dbeafe` (blue-100), color `#3b82f6` (blue-500)
- Removed unused `section-nav__icon--plain` dark-mode style

---

## 2026-03-25 — Fix: Documentation icon for "not generated" state

**Prompt**: Change empty-state Documentation icon from `bi-file-earmark-plus` to `bi-file-earmark-text`
**File toccati**: `DocumentationSection.tsx`
**Esito**: ✅ completato

**Changes**:
- Changed empty-state icon from `bi-file-earmark-plus` to `bi-file-earmark-text` to better communicate "documentation available but not yet generated"
- Existing CSS (`doc-icon--empty`) already handles grey color (`#94a3b8`) and sizing

---

## 2026-03-25 — UI: Section group visual hierarchy in Project Dashboard

**Prompt**: Create visual groupings to communicate MDE workflow structure (Structure → Transformation → Perspectives)
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **Section groups**: Wrapped dashboard sections into 3 logical groups: Structure (Metamodels + Models), Transformation (Transformations), Perspectives (Viewpoints + Documentation)
- **Group labels**: Discrete uppercase watermark labels ("Structure", "Transformation", "Perspectives") above each group
- **Dashed separators**: `1px dashed #e2e8f0` between groups; reduced intra-group spacing (20px) vs inter-group spacing
- **Sidebar nav dividers**: Added `section-nav__divider` between group boundaries in the section navigator
- **Dark mode**: Full support for group separators (`#334155`), labels (`#475569`), and nav dividers
- **IntersectionObserver**: Still works — `div[id="section-*"]` elements preserved as observer targets inside group wrappers

---

## 2026-03-25 — UI: Standardize section headers and actions in Project Dashboard

**Prompt**: Uniform section header pattern across all dashboard sections
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`, `DocumentationSection.tsx`, `DocumentationSection.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **SectionHeader component**: Inline component with standardized title + count `(N)` always shown + ghost button actions
- **Metamodels**: Uses `SectionHeader` with Import (secondary, ghost xs) + "+ New" (primary, ghost sm)
- **Models**: Uses manual `project-section-header` div (needs ref for dropdown positioning) with count always shown
- **Transformations**: Uses `SectionHeader` with count + "+ New"; added CTA to empty state
- **Viewpoints**: Changed "+ Add" to "+ New" (disabled); count always shown including `(0)`
- **Documentation**: Updated header from `.section-header` to `.project-section-header`; added "Generate" button in header actions
- **New CSS classes**: `.project-section-header`, `.btn--ghost`, `.btn--sm`, `.btn--xs`
- **Dark mode**: Full support for ghost buttons and section header

---

## 2026-03-25 — UI: Sidebar section navigator + compact header for Project Dashboard

**Prompt**: Transform sidebar from action list to section navigator; compact header with actions in ⋮ menu
**File toccati**: `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/project-editor.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **Sidebar**: New section navigator with 5 entries (Metamodels, Models, Transforms, Viewpoints, Docs). Each shows type icon + label + count. Click scrolls to section via `scrollIntoView({ behavior: 'smooth' })`. Active section tracked via `IntersectionObserver`.
- **Header compacted**: From ~120px multi-row layout to ~56px 2-row layout. Row 1: title + version badges + "View Megamodel" (promoted to primary button) + "+ Tags" + ⋮ menu. Row 2: description + author + date + inline tags.
- **⋮ menu**: Download project, Make public/private, Close project. Click-outside to dismiss.
- **Layout**: `project-editor` now uses flex column. Body is flex row with `section-nav` sidebar (180px) + scrollable main content.
- **Section IDs**: Added `id="section-{name}"` to each section div for scroll targeting.
- **Dark mode**: Full support for compact header, sidebar, and dropdown.

---

## 2026-03-25 — Fix: JjEL result rendering and error handling in JjScript Console

**Prompt**: Fix 3 problemi nel rendering dei risultati JjEL nella console JjScript
**File toccati**: `frontend/src/jjscript/components/JjScriptOutput.tsx`, `frontend/src/jjscript/executor/commands/eval.ts`
**Esito**: ✅ completato

**Problema 1 — "Eval" + "element" badge**: eval/forall results went through `parseExecutionResult()` which produced generic "Eval" + "element" badges instead of actual values. The `formatJjelResult()` in eval.ts already produced good messages (`**2** results`, actual values) but they were never displayed.
**Fix**: Added `'eval'` and `'forall'` to `isDisplayCommand` in JjScriptOutput.tsx so they use classic status+message rendering. Added `data.items` rendering block (eval stores array items in `data.items`, but output only rendered `data.elements`).

**Problema 2 — No error on invalid input**: `blablabla` returned success because JjEL evaluator silently returns `null` for undefined identifiers (evaluator.ts:191).
**Fix**: Added `isBareIdentifier()` check in eval.ts — after jjelEval returns `null`, if the expression is a simple identifier not in the variables context, return `UNDEFINED_VARIABLE` error with suggestion. Also propagated `context.variables` (let/forall bindings) into eval context.

**Problema 3 — ForAll display**: forall executor already produced good summary messages ("forall: 2/2 executed successfully") but they were hidden by the badge notification. Fixed by Problem 1's `isDisplayCommand` change.

**TypeScript**: `npx tsc --noEmit` — no new errors in changed files.

---

## 2026-03-25 — Fix: JjScript parser no longer delegates JjEL expressions

**Prompt**: Diagnosi + fix regressione — JjScript non delega a JjEL
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato
**Root cause**: Commit `8e9509e16` added `'forall'` to the `COMMANDS` array in `types.ts`. The lexer then tokenized `forall` as `COMMAND` type, but the JjEL delegation check at `parseCommand()` only matched `IDENTIFIER` or `KEYWORD` — so the forall→JjEL path became dead code. The input fell through to the `switch(command)` which had no `case 'forall':`, hitting `default: throw 'Unknown command'`.
**Fix (3 changes)**:
1. Added `token.type === 'COMMAND'` to the forall token type check (line 116) so `forall`-as-COMMAND still reaches the JjEL/JjScript disambiguation via `isForAllDoCommand()`
2. Replaced the hard error at line 144 (non-COMMAND tokens) with JjEL delegation — arbitrary expressions like `classes.size` now fall through to JjEL instead of erroring
3. Added `case 'forall':` in the parser switch (line 207) as safety net for JjScript `forall...do` commands

---

## 2026-03-25 — Feat: Add "Show Console" to View menu

**Prompt**: Add JjScript console overlay accessible from View menu
**File toccati**: `frontend/src/pages/components/Navbar.tsx`
**Esito**: ✅ completato
**Note**: Added `showConsole` state, "Show Console" toggle item in View menu (with checkmark and filled icon when active), and a fixed-position overlay (560×420px, bottom-right) rendering `<JjScriptConsole />` with a dark header bar and close button. No backdrop — canvas remains interactive. TypeScript clean (`npx tsc --noEmit` — no new errors).

---

## 2026-03-25 — Audit: language documentation vs implementation

**Prompt**: Systematic audit of `docs/jjtl-jjel-paper.tex` against the codebase (JjEL, JjTL, JjModal, JjLet, JjScript)
**File toccati**: `docs/LANGUAGE-DOCS-AUDIT.md` (creato)
**Esito**: ✅ completato
**Note**: 55 punti verificati — 35 allineati, 13 parzialmente disallineati, 7 disallineati, 3 non documentati. Le discrepanze critiche sono: (1) `when` vs `where` keyword mismatch in tutto il documento, (2) short-circuit evaluation dichiarato ma non implementato, (3) `filter()`/`map()` dichiarati rimossi ma ancora presenti, (4) JjScript completamente non documentato nel paper. Vedi report completo per dettagli e priorità di aggiornamento.

---

## 2026-03-25 — Feat: implement `let` command in JjScript (Phase 3 of JjLet)

### Changes
- Added `'let'` to `CommandType` union, `LetArgs` interface, `CommandArgs` union, and `COMMANDS` array in `types.ts`
- Added `parseLetCommand()` in `parser.ts` with helpers: `consumeDollarIdentifier()`, `collectValueExprRaw()`, `matchComma()`, `skipNewlines()`
- Added `$variable` support in `parseValueOrQualified()` — parses `$name` as a QualifiedName for use in set/rename values
- Added optional `contextOverride` parameter to `JjScriptExecutor.executeAST()` for scoped context injection
- Added `case 'let'` in executor switch dispatch
- Created `executor/commands/let.ts` handler with:
  - `executeLet()` — creates child context, evaluates bindings sequentially, resolves variables in body AST, executes body
  - `evaluateBindingValue()` — dispatches to prompt/confirm (UIBridge) or JjEL evaluation
  - `resolveVariablesInBody()` — walks body AST to replace `$variable` references with concrete LiteralValues (handles SetArgs.value, RenameArgs.newName)
- Re-exported `executeLet` from `commands/index.ts` and `jjscript/index.ts`

### Files changed
- `frontend/src/jjscript/types.ts` — `LetArgs`, `CommandType`, `CommandArgs`, `COMMANDS`
- `frontend/src/jjscript/parser/parser.ts` — `parseLetCommand()`, `$variable` in values
- `frontend/src/jjscript/executor/executor.ts` — `contextOverride`, `case 'let'`
- `frontend/src/jjscript/executor/commands/let.ts` — new handler
- `frontend/src/jjscript/index.ts` — re-export

### Type check
- `npx tsc --noEmit` — zero new errors (only pre-existing legacy errors)

---

## 2026-03-25 — Fix: `let` binding expression stops at COMMA and IN

### Bug
`let $name = prompt('Name', EString), $upper = $name.toUpper() in { ... }` failed with "Expected '$identifier' after 'let'" because `expression()` is greedy and consumed the comma/`in` as part of the binding value.

### Fix
In `letStatement()`, replaced `this.expression()` with `this.parseJjELExpression([COMMA, IN, NEWLINE, RBRACE])` (when source string is available) so the expression parser stops at binding separators. Added `skipNewlines()` calls to support multi-line binding lists.

### Files changed
- `frontend/src/jjtl/parser/parser.ts` — boundary-aware expression parsing in `letStatement()`
- `frontend/src/jjtl/__tests__/let-prompt-bug.test.ts` — updated JjEL delegation test expectation, added 4 new test cases (multi-binding, multi-line, newline-before-in, source-string path)

### Tests
- 9/9 let-prompt-bug tests passing
- 232 total JjTL+JjEL tests passing (no regressions)

---

## 2026-03-24 — Feat: implement `let` statement in JjTL (Phase 2 of JjLet)

### Changes
- Added `LET` token type and `DOLLAR_IDENT` token type to JjTL `TokenType` enum and `JJTL_KEYWORDS` map
- Added `$identifier` scanning in JjTL lexer (`case '$'` handler)
- Added `LetStatementAST` interface to AST types; updated `MappingBodyItemAST` union
- Added `letStatement()` parser method with support for multiple bindings and `in { body }` block
- Added `LET` dispatch in `mappingBody()` (before forall/alert/notify)
- Added `LetStatement` handling in all 3 executor body-iteration methods:
  - `executeAttributeMappings()` — delegates to new `executeLetBody()` helper
  - `executeAttributeMappingsWithTrace()` — delegates to new `executeLetBodyWithTrace()` helper
  - `executeObjectCreation()` — inline let body execution on the parent object
- Both helpers support nested `let` statements recursively

### Syntax
```jjtl
let $var = expr (, $var2 = expr2)* in {
    -- body items use $var in JjEL expressions
}
```

### Files changed
- `frontend/src/jjtl/types/tokens.ts` — LET + DOLLAR_IDENT tokens
- `frontend/src/jjtl/types/ast.ts` — LetStatementAST interface
- `frontend/src/jjtl/lexer/lexer.ts` — `$identifier` scanning
- `frontend/src/jjtl/parser/parser.ts` — letStatement() + mappingBody() dispatch
- `frontend/src/jjtl/executor/executor.ts` — LetStatement execution in 3 methods + 2 helpers

### TypeScript
- `npx tsc --noEmit` — zero new errors (all errors are pre-existing legacy)

---

## 2026-03-24 — Feat: add $identifier (DOLLAR_IDENT) token to JjEL lexer/parser

### Changes
- Added `DOLLAR_IDENT` token type to `JjelTokenType` enum in `tokens.ts`
- Modified lexer `case '$'` to recognize `$letter...` sequences as `DOLLAR_IDENT` tokens (bare `$` and `${` behavior unchanged)
- Added `DOLLAR_IDENT` handling in parser `primary()` — produces `Identifier` AST node with `$`-prefixed name (e.g. `$name`)
- Added 4 tests in `parser.test.ts`: simple `$name`, binary expression with `$prefix`, `$my_var2` with mixed chars, bare `$` error

### Files changed
- `frontend/src/jjel/types/tokens.ts`
- `frontend/src/jjel/lexer/lexer.ts`
- `frontend/src/jjel/parser/parser.ts`
- `frontend/src/jjel/__tests__/parser.test.ts`

### Tests
- 176/176 passing (89 parser + 87 evaluator)

---

## 2026-03-24 — Docs: add JjLet chapter to jjtl-jjel-paper.tex

### Changes
- Added `\jjlet` macro to preamble alongside existing `\jjmodal`
- Added `let` keyword to `jjtl` and `jjel` listing language definitions
- Updated Document Structure paragraph in Introduction to reference `\cref{sec:jjmodal}` and `\cref{sec:jjlet}`
- Inserted full JjLet section (§5) after JjModal (§4) and before Comparative Analysis (now §6)
  - Subsections: Motivation, Design Position and Architecture, Variable Sigil, Syntax, Semantics, Usage Examples, Implementation Plan, Design Tensions
- Updated comment section numbers for Examples (→7), Discussion (→8), Conclusion (→9)

### Files changed
- `docs/jjtl-jjel-paper.tex`

---

## 2026-03-24 — Feat: add confirm() to JjTL Monaco autocomplete

### Changes
- `jjtlCompletions.ts`: added `confirm` entry to `INTERACTIVE_FUNCTIONS` array with label, detail, documentation, and snippet insertText

### Files changed
- `frontend/src/jjtl/editor/jjtlCompletions.ts`

---

## 2026-03-24 — Feat: show rule + instance context in prompt() and confirm() dialogs

### Goal
When `prompt()` or `confirm()` is called during a JjTL transformation, the dialog shows a subtitle with execution context: e.g. "Person → Human :: Mario" (rule → source instance name).

### Approach
Added `currentRuleName` and `currentInstanceName` optional fields to `ExecutionContext`. The executor populates them during `executeClassMapping`. A new `buildDialogContext()` helper formats them as a display string and passes it through the UIBridge → ReactUIBridge → DialogManager → dialog component chain.

### Changes
- `executor.ts`: added `currentRuleName`/`currentInstanceName` to `ExecutionContext`, populated in `executeClassMapping` loop, added `buildDialogContext()` helper, passed `executionContext` to `showPrompt`/`showConfirm` calls
- `UIBridge.ts`: added optional `executionContext` parameter to `showPrompt` and `showConfirm` in interface + `NoopUIBridge` + `ConsoleUIBridge`
- `ReactUIBridge.ts`: added `executionContext` to `DialogRequest` prompt/confirm variants, propagated in `showPrompt`/`showConfirm`
- `JjtlDialogManager.tsx`: passes `executionContext` prop to `JjtlPromptDialog` and `JjtlConfirmDialog`
- `JjtlPromptDialog.tsx`: added `executionContext` prop, renders `.jjtl-dialog-context` subtitle
- `JjtlConfirmDialog.tsx`: added `executionContext` prop, renders `.jjtl-dialog-context` subtitle
- `JjtlDialogs.scss`: added `.jjtl-dialog-context` style (11px, slate-500, italic)

### Files changed
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/executor/UIBridge.ts`
- `frontend/src/jjtl/executor/ReactUIBridge.ts`
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlPromptDialog.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlConfirmDialog.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlDialogs.scss`

---

## 2026-03-24 — Feat: implement confirm() command — full stack

### Goal
Add `confirm(label)` — a JjModal command that opens a Yes/No dialog and returns a boolean.

### Changes
- `tokens.ts`: added `CONFIRM` to `TokenType` enum and `JJTL_KEYWORDS`
- `ast.ts`: added `ConfirmExpressionAST` interface and union member in `ExpressionAST`
- `parser.ts`: imported `ConfirmExpressionAST`, added `TokenType.CONFIRM` check in `primary()`, added `confirmExpression()` method
- `UIBridge.ts`: added `showConfirm(message): Promise<boolean>` to interface + `NoopUIBridge` (returns false) + `ConsoleUIBridge` (logs and returns false)
- `ReactUIBridge.ts`: added `{ type: 'confirm' }` variant to `DialogRequest` union + `showConfirm()` implementation
- `executor.ts`: imported `ConfirmExpressionAST`, added to `isUserProvidedExpression()`, added `ConfirmExpression` case in `evaluateExpressionAsync()`
- `JjtlConfirmDialog.tsx`: new component — Yes/No buttons, Enter=Yes, Escape=No, `bi-question-circle` icon
- `JjtlDialogManager.tsx`: imported `JjtlConfirmDialog`, added `'confirm'` case in `renderDialog()`
- `dialogs/index.ts`: exported `JjtlConfirmDialog`

### Files changed
- `frontend/src/jjtl/types/tokens.ts`
- `frontend/src/jjtl/types/ast.ts`
- `frontend/src/jjtl/parser/parser.ts`
- `frontend/src/jjtl/executor/UIBridge.ts`
- `frontend/src/jjtl/executor/ReactUIBridge.ts`
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/components/dialogs/JjtlConfirmDialog.tsx` (new)
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/index.ts`

---

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
