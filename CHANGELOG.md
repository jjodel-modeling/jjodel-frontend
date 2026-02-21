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

## Previous Changes

*Historical changes prior to this changelog are not documented here.*
