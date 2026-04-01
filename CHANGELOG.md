# Changelog

All notable changes to the Jjodel project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

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
