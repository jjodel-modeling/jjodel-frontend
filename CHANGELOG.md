# Changelog

All notable changes to the Jjodel project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

Draft of 3.2.0. It covers the trunk `alfonso-frontend-jjtl` after the text of `[3.1.0]` was written (2026-10-12): first the work that reached the beta on 2026-10-18 (marked *beta*), then the work merged after it.

### Added

#### Code generation
- Model-to-text code generation ships in this build: a Code panel with templates over the model, a JavaScript target, a Run of the generated code and «Check», which compares a run of the generated code with the Jjodel simulator on the stored scenarios. It is off by default: Settings → Advanced → Experimental → «Code generation» (R-GEN-18).
- Two lecture examples as importable project files: Petri producer-consumer and Turnstile.
- Bit-vector values in code generation and in the Code panel.

#### Templates and gallery
- Templates page under BROWSE: starter projects and worked examples you clone into your workspace, with search, concept and level filters, card previews and, in Advanced mode, a citable gallery id (`<id>@<n>`) with a deep link (R-LIB-9, R-LIB-13, R-LIB-15).
- Seven gallery projects (Library, Families and Persons, StateMachine, Graph, Shapes, Turnstile, Petri producer-consumer), each with hand-written viewpoints.
- File › New in the 3.2 structure: Project, Metamodel, Model, Viewpoint, Transformation and From template; the model entries are enabled only inside a project.
- New model dialog: choose the metamodel the model conforms to, with a name that gets a number when it is already in use.

#### Simulation
- Bit-vector word domains: a register's width is read per element at Reset.
- The IR predicate «sim active», true while a run shows an element's model; the Petri example hides its initial tokens during a run.
- Simulation guide and semantics reference in `docs/help/simulation/`.

#### JjEL
- Fixed-width bit-vector values in the evaluator (R-BV).

#### Data Manager and environments
- References in the Data Manager detail: a reference section that links, changes and removes, following the slot's rule (#172). *beta*

#### AI
- Live model catalogs for Anthropic, OpenAI and Gemini; «Test connection» lists the models; the picker shows the newest model per family and the older ones on demand. *beta*
- Settings rows of the AI providers show the connection state.

### Changed
- The shell (top bar, editor toolbar, left palette, rails, status bar, menus) uses one token layer: denser layout, 24 px targets, muted action icons in Advanced, rail titles in sentence case (R-SHELL-1..5).
- Sign in, registration and password reset have a new layout; registration no longer asks for the newsletter.
- What's new screen for 3.1. *beta*

### Fixed
- Large models: References lists are built only when the section is open, model names without a full scan, the canvas re-transforms only the vertices that changed, the intrinsic size of a node is measured once per content.
- A graphVertex container hides the edges it encloses (R-GV-18).
- The simulator compiles triggers by position, and fuses fork and join.
- A keyword is a valid member name after `.` and `?.` in JjEL.
- The Templates page keeps Advanced mode when you reach it from inside the app.
- A user view stays editable after the project is opened again or the page is reloaded (graphVertex F2).
- A click, Enter or Space on a palette entry creates the instance at the centre of the view (graphVertex F3).
- A reference row shows «Open» once (#172). *beta*

### To check before the tag
- Whether 3.1.0 ships on its own first: then the *beta* items move to `[3.1.0]`.
- The Endpoints section and the Configurator panel (#186, #187) are on the beta and not yet on the trunk: they enter with the alignment of `staging`.
- The graphVertex F2 and F3 lines assume the merge of `gv-f2-f3`.

## [3.1.0] - 2026-10-12

This release covers the trunk `alfonso-frontend-jjtl` since `3.0.0` together with the fixes released on beta (`staging`) in the same period. The code generator is not part of this release.

Projects: 3.1 saves projects in format 2.230 and opens projects saved in formats 2.228 (3.0), 2.229 and 2.230; an older save is migrated when it is opened. A project saved by 3.1 cannot be opened by an earlier version.

### Added

#### Simulation
- Simulation panel driven by a pure core: one step per press, run state on the canvas nodes, per-model run state.
- Events as M1 instances, one button per enabled event, ε for transitions without a trigger.
- Guards and actions: `Expression` and `Action` primitive types, guard evaluation on the run state, parallel assignments per step, state access with `.[x]` in JjEL.
- Petri core: weighted preset and postset, bound `k` with an «unsafe» halt, decision blocks with `else`.
- Five run states (Not started, Running, Terminated, Deadlock, Halted); the deadlock reason names the false guard.
- Simulation roles dialog with system presets and user profiles; roles match metaclasses with ancestry and may bind several attributes.
- DFA, NFA, Moore and Mealy faces: accepting mark, Output line, Mealy output in «Last step».
- State and input declarations: stored or derived attributes, a model's globals declared in its own Data dialog.
- Nondeterministic choice list, Random with a seeded draw, a per-model run policy (Ask or Random) and Play.
- A Simulation toggle in the metamodel's Semantic Type Class section gates the feature.
- State face of the simulator: the semantic state σ and the presentation state `node` shown as two spaces, a State page in the roles dialog, a Watch block with up to four pinned attributes, a run inspector with the whole σ and a navigable trace, an opt-in σ overlay per attribute on the canvas (R-SIM-102..107, R-SIM-109).
- `node.[x]` readable from viewpoints: view expressions read an element's presentation state, read-only (R-SIM-108).
- Event instances are hidden on the canvas while a run is active.
- I/O board: the machine's environment as a board of devices bound to events, inputs and expressions over σ (Button, Switch, Slider, Numeric keypad, LED, Pulse LED, 7-segment, Text display, Gauge), with a Board skin, a front Panel skin and an editor; saved with the model (R-SIM-110..121).
- Clock device on the I/O board: presses a bound event at a fixed period, from 100 ms to 60 s, so a countdown runs in real time without time in the model (R-SIM-122).
- Front panel styles: four themes (Graphite, Appliance, Instrument, Print) with an accent colour, button shapes and colour roles, a Bootstrap icon suggested from the event's name and overridable, display sizes and faces, devices spanning several cells, boards of 4, 6 or 8 columns with a floating window, keyboard shortcuts, silkscreen captions and a buzzer (R-SIM-123..133, D-UI-16).
- Clock auto-start: an auto-start Clock switches on with the run and keeps ticking with the board closed; a tick that no active state listens to is not a step (R-SIM-134..136).
- Step back, and scenarios: a run is recorded as a scenario and replayed from Reset.
- Invariants and breakpoints stop Play and the clocks.
- A timeline slider under the transport row.
- Coverage of the runs drawn on the canvas, behind a Coverage switch.
- Event reads are checked at Reset, and an event attribute left unset is reported.

#### Viewpoints and notation
- «Derive viewpoint» on a metamodel row: one IR view per class in a chosen notation (Generic, State machine (UML statechart), Petri net, Petri net (classic), Flowchart, Flowchart (ISO 5807), Activity (UML), ER (Chen)); the derived viewpoint is named after its notation.
- Activity (UML) and ER (Chen) notations for views: Activity decision and merge nodes and the final node, ER end labels.
- Edge ends: seven end glyphs, conditional ends and end roles on edge views.
- Colour by metaclass: a viewpoint option gives each metaclass its own pastel colour, derived from a base colour, with per-class overrides.
- Containers drawn as frames (graphVertex): partitions with header bands, containers that frame their children with dashed separators, drop targets shown while dragging, a containment section in the authoring panel; a frame follows a child that is dragged.
- Auto layout in the toolbar lays out the whole graph, containers and labels placed outside the symbol included.
- A path label that shows a single attribute is edited on the canvas.
- Symbol Editor 1b: conditional border per axis, `cornerRadius` as a conditional axis with a rules table, the Goal family with the cloud form, a three-instance preview, the Underline row.
- Vertex labels outside the symbol box (left, right, top, bottom); default width and height of a vertex view.
- Edge views and row views created from the v2 canvas menus; the viewpoint `+` asks what the new view applies to and seeds its IR.
- IR forms: the bar form, token markers, declared collapsed form, fill and badge.

#### JjScript and Jodie
- JjScript creates an M1 instance inside its container (`create instance of X "n" in Parent.ref`); Run waits for a line that names an instance created later in the script. Jodie's M1 scripts use the container form.
- Jodie refuses a generated script that uses a reserved word as a name, and says why.

#### Validation
- User-defined validation, first cut: validation viewpoints, minimal rule authoring, the «Validate» command, violation dots on instances (R-VAL).

#### Data Manager and environments
- Reference editor in the canvas rail with drill-in, inline edit and create-and-link for references (#142).
- Environment configuration and Configurator screen with role profiles and a restricted consumer shell (#157).
- Jodie in the Configurator: for the end user it answers without developer tools, follows the selected element, the drill-in and the role profile, and offers proposals the user can apply (#168).

### Changed
- Project format 2.230: every instance, nested ones included, is listed by its model (#174). Format 2.229 introduces the `Expression` and `Action` types. Saves in an older format are migrated when they are opened.
- Deleting a container also deletes what its slots own, and a deleted element's vertices and edges leave the canvas; every open drops canvas elements that no longer show anything (#174).
- JjScript on M1: `=` on a single-valued reference replaces its target and `= null` empties it; `+=` appends while the slot has room and never replaces; `-=` and `remove y from x.ref` take a value out; a link must have the reference's type; `create instance of X name` refuses leftover words, and `rename x to "y"` reads a quoted name (#168, #175).
- Under a role profile JjScript refuses what the profile does not allow, read commands that would name a hidden type (`list`, `show`, `eval`, `validate`) and a `create ... in` whose container is read-only included (#168, #176, #178).
- In the Configurator the IR form, delete and move follow the role profile: hidden types are neither named nor offered, read-only elements cannot be moved or removed, and switching profile needs no reload (#157).
- The default notation of M2 and M1 canvases is more legible in the light theme (contrast of headers, edges and quiet text).
- The metamodel canvas refuses references and supertypes whose type is not a class.
- The authoring Form tab is labelled Layout; the Symbol tab opens the Symbol Editor directly.

### Fixed
- Cmd+S saves the live project; a view IR never stores an L-proxy.
- A project that cannot be opened shows an error screen; a change of project id in the URL opens that project; an empty project state is never saved.
- JjScript: forward references refused, superclasses resolved before creating a class, enum types resolved, exact-case homonyms reported as ambiguous.
- JjScript: `delete instance` also deletes what its containment slots hold (#171); appending to a composition slot moves the element into it (#182); a `do` block whose body is not a command stops instead of freezing, and a `do` without its `end` is an error that names the open block.
- JjEL: names such as `constructor` and `toString` are read as plain identifiers.
- Data Manager and Configurator drill-in: the header, Delete and the «Add» bar act on the element on screen and respect its cardinality (#173).
- Gemini «Test connection» uses the same model as the chat (#179).
- Export embeds externally referenced M1 objects in JSON (#128).
- Custom AI provider accepts a free-text model name (#147).
- Two metaclasses with the same name in different metamodels are distinct for views (R-MCID).
- Default object view fill and chrome match the native view.
- Canvas export works for PNG, JPEG, SVG and the clipboard.
- The canvas no longer enters an update loop on size writes, on a hidden tab or while dragging a node; a loop that still occurs shows a recovery message instead of a blank canvas.
- Opening a model that has to create a vertex no longer re-lays out the nodes the user placed.
- Undo after an inline edit restores the previous value.
- A click on an edge shows the element the edge represents; deleting an M1 edge removes the link, not the reference; deleting an object drawn as an edge deletes the object; a stale M1 reference edge leaves the canvas.
- Drawing a subclass link, or switching a containment, updates the model canvas that is already open (M1 palette, «Add» and connect gestures).
- IR node corners, shadow and selection ring are no longer clipped; the loading overlay sits above the rail.

### Removed
- The dark theme: Settings → Appearance no longer offers it, and a dark theme chosen earlier opens in light.

## [3.0.0] - 2026-09-15

The full list of user-facing changes is at https://docs.jjodel.io/whats-new/. The entries below are partial.

### Added

#### Unified AI Provider System (2026-02-11)

A standardized system for managing AI providers across all features of the application.

**New Components:**
- `ProviderSelector` component (`components/common/ProviderSelector.tsx`) - Reusable dropdown for selecting AI providers with distinctive icons for each provider
- `AIProviderPreferences` service (`services/AIProviderPreferences.ts`) - Centralized persistence for per-feature provider preferences
- `useAIProviderPreference` hook - React hook for accessing and updating provider preferences
- Global default provider setting in the Settings page (Providers section)

**Features Integrated:**
- Documentation generation - with "Local (Instant)" option
- Jjodie Chat assistant
- ScriptBlock AI assistance
- Suggested Mappings (JjTL) - with "Simple (Local)" option

**Provider Icons:**
Each AI provider now has a distinctive Bootstrap icon with brand-appropriate colors:
| Provider | Icon | Color |
|----------|------|-------|
| OpenAI | `bi-circle` | Green (#10a37f) |
| Anthropic | `bi-chat-square-text` | Amber (#d97706) |
| DeepSeek | `bi-search` | Blue (#4d6bfe) |
| Mistral | `bi-wind` | Orange (#ff7000) |
| Gemini | `bi-gem` | Google Blue (#4285f4) |
| Groq | `bi-speedometer2` | Red (#f55036) |
| Kimi | `bi-moon` | Purple (#6366f1) |
| Ollama | `bi-hdd-network` | Green (#10b981) |

**Provider Resolution:**
1. Feature-specific override (if set)
2. Global default (configurable in Settings)
3. First available configured provider

**UX Improvements:**
- "Configure in Settings" links now open the unified Settings page (Providers section)
- Keyboard shortcut `Cmd+,` (Mac) / `Ctrl+,` (Windows) opens Settings
- Compact mode for toolbar integration
- Dark mode support for all components

### Removed

- `AISettingsModal` component - Old overlay modal replaced by unified Settings page
- `AISettingsContext` - Context for old modal, no longer needed
- `AISettingsProvider` wrapper in App.tsx

### Changed

- `ProviderSelector` in Jodie chat now uses `SettingsModalContext` instead of `AISettingsContext`
- `DocumentationTab` now uses `useSettingsModalSafe()` for settings navigation
- `SuggestedMappingsPanel` replaced mode buttons with unified `ProviderSelector`

---

## [Unreleased] - 2026-03-17

### Added

#### MegamodelView — Interactive Project Diagram
- **MegamodelView** — React Flow-based diagram showing all project artifacts (metamodels, models, transformations) as rich node cards with semantic edges
- Rich node cards with 3-zone layout: badge + name, stat pills / preview bars, status dot
- Semantic edge types: structural (conformsTo, inputOf, outputOf), instance-level (generatedBy, sourceOf, instanceInputOf) with distinct colors and dash patterns
- Live artifact stats computed from LModel proxies (classes, attributes, references, instances)
- Context menu on nodes (Open, Rename, Duplicate, Delete, Run transformation) and canvas (New metamodel, New model, Import)
- Double-click node to open in editor tab
- Inline rename via F2, delete with confirmation dialog, keyboard shortcuts (Enter/F2/Del)
- Dagre-based synchronous layered layout (replaced ELK for simplicity)
- Snap-to-grid drag (20px), node position persistence in localStorage
- Legend with clickable edge type toggles (hide/show), persisted per-project
- Light theme default with CSS custom properties, overlay modal layout (92vw×88vh) with backdrop blur
- Auto-arrange button, center at 1:1 zoom on open

#### Properties Panel — Form System
- **Form system components**: `PropertiesToggle` (horizontal switch 36×20px), `NumberInput`, CSS helpers for consistent panel styling
- **CONTENTS section** in Metamodel Properties — clickable child lists (classes, enums, packages) with inline Add buttons
- **LITERALS section** in Enum Properties — clickable literal list with Add button
- Form system applied across Properties panel: toggles for boolean fields, number inputs, badges, field hints

#### UI Components
- Reusable `Badge`, `Button`, and `EmptyState` shared components extracted from duplicated inline implementations (~260 lines of duplicated SCSS removed)
- Branded **Jj icon** and tab styling for project/metamodel tabs
- **StatusBar**: contextual editor stats per type (classes/attributes/references for metamodels, instances/conforming type for models), selected element display
- `StatusBarRightZone` shared component (mode toggle, AI, bell, version)
- `NotificationCenter` and toast dispatch system
- `TreeViewSidebar`: transformations section with open/rename/delete actions
- Dock emits `jjodel:active-tab` event on layout change for StatusBar context
- Design system documentation (`docs/DESIGN-SYSTEM.md`)

### Fixed

- **Domain attributes filtered by system property blacklist** — Replaced blacklist (skip 'id', 'name', 'className') with whitelist built from target metamodel class attributes. Domain attributes named 'id' or 'name' were silently skipped during transformation execution.
- **Transformation lookup** — Use current transformation from closure instead of always picking the first one
- **CSS class conflict** between MegamodelView and EditorV2 (`.mm-node` renamed to `.megamodel-node`)
- **Properties panel width** — Removed `max-width: 1000px` and `margin: 0 auto` so panel fills available space
- **Tab navigation circular reference** — Simplified `handleTabClick` to use `dock.updateTab`, fixing circular ref for all tabs
- **Project tab navigation** — Project tab now navigates to project overview instead of allProjects
- **StatusBar visibility** — Fix StatusBar not reappearing after switching from JjTL transformation tab
- **MegamodelView dagre layout** — Reverse structural edges so metamodels rank at top; NaN/non-finite edge coordinate guard; passive wheel event for scroll-zoom
- **MegamodelView spotlight** — No longer activates when dragging a node

### Styled

- **MultiSelect (react-select) in Properties panel** — Applied design system styling via `classNamePrefix="jj-select"` and SCSS overrides. Consistent slate borders, 32px height, rounded dropdown, hover/selected states, and styled multi-value tags. Applies to DEPENDENCIES and INHERITANCE selects.
- Properties panel revisioned with design system tokens
- Tab styling refinements
- LeftBar and Dashboard layout cleanup

---

## Previous Changes

*Historical changes prior to this changelog are not documented here.*
