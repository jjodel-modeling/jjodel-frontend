# Changelog

All notable changes to the Jjodel project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

Planned as 3.1.0. The entries below cover the trunk `alfonso-frontend-jjtl` since `3.0.0`; work still on branches or on `staging` is added when it lands.

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

#### Viewpoints and notation
- «Derive viewpoint» on a metamodel row: one IR view per class, with a control-flow notation and a Petri notation.
- Symbol Editor 1b: conditional border per axis, `cornerRadius` as a conditional axis with a rules table, the Goal family with the cloud form, a three-instance preview, the Underline row.
- Vertex labels outside the symbol box (left, right, top, bottom); default width and height of a vertex view.
- Edge views and row views created from the v2 canvas menus; the viewpoint `+` asks what the new view applies to and seeds its IR.
- IR forms: the bar form, token markers, declared collapsed form, fill and badge.

#### Validation
- User-defined validation, first cut: validation viewpoints, minimal rule authoring, the «Validate» command, violation dots on instances (R-VAL).

#### Data Manager and environments
- Reference editor in the canvas rail with drill-in, inline edit and create-and-link for references (#142).
- Environment configuration and Configurator screen with role profiles and a restricted consumer shell (#157).

### Changed
- Model format: migration `2.229` introduces the `Expression` and `Action` types. Projects saved by 3.0 are migrated on load.
- The default notation of M2 and M1 canvases is more legible in the light theme (contrast of headers, edges and quiet text).
- The metamodel canvas refuses references and supertypes whose type is not a class.
- The authoring Form tab is labelled Layout; the Symbol tab opens the Symbol Editor directly.

### Fixed
- Cmd+S saves the live project; a view IR never stores an L-proxy.
- A project that cannot be opened shows an error screen; a change of project id in the URL opens that project.
- JjScript: forward references refused, superclasses resolved before creating a class, enum types resolved, exact-case homonyms reported as ambiguous.
- Export embeds externally referenced M1 objects in JSON (#128).
- Custom AI provider accepts a free-text model name (#147).
- Two metaclasses with the same name in different metamodels are distinct for views (R-MCID).
- Default object view fill and chrome match the native view.

### Known issues
- The dark theme is not maintained in this release.

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
