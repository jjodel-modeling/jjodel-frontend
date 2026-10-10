# log-inbox — lane «dark-theme»

Entries written by the dark theme removal lane on `dark-theme-removal` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — discovery: dark theme removal, Phase 1 (P-2026-10-10-0910)
**Prompt**: `claude_2026-10-10_0910_prompt_dark_theme_removal.md`, read-only on `~/jjodel-w-nodark`, branch `dark-theme-removal`: inventory of the app theme (A), persisted state (B), tokens (C), exported interfaces (D), Phase 2 plan (E), falsifying «delete the dark sources, collapse to light, no visible change, no migration».
**Files touched**: `docs/discovery/discovery_2026-10-10_dark_theme_removal.md` (new), `docs/log-inbox/dark-theme.md` (new, this entry), one docs commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Light is two states (A no attribute, B `data-theme=light`), 23 root custom properties apart; R1 keeps both. 0 of 2078 dark selector parts match in light on the dashboard and the four scenes, A and B; 0 dark-only tokens; no theme in project state. One critical-zone item awaits Alfonso (StructureGroups.scss). One early grep wrote to /tmp, removed at once. Report: `docs/discovery/discovery_2026-10-10_dark_theme_removal.md`.
**Prompt document name**: 2026-10-10 09:10

## 2026-10-10 — refactor(theme): dark theme removed, light states A and B kept (P-2026-10-10-0910)
**Prompt**: GO Phase 2 of `claude_2026-10-10_0910_prompt_dark_theme_removal.md`: the plan of the report's §7 (S0 tests and before-probe red on the base, S1-S4 code, S5 docs), R1 and the unattended decisions 1-9 adopted, no critical-zone go-ahead (StructureGroups.scss left), no rebase on the trunk.
**Files touched**: `e88f1a22e` S1 (14: index.html, AppearanceSettings, EditorV2, DocumentationTab, TokenPreview, palette hook, derivePalette, registry, states.ts, ThemeService deleted, 3 new tests, the probe); `21ed32054` S2 (9, _colors-dark.scss deleted); `09c40bf1e` S3 (82 style files); `0099539d2` S4 (4 tests); `2bb18dcd9` probe fix; `7b75cb5d5` S5 docs (tokens README, ResizeHandle README, styles/CLAUDE.md, styles/AGENTS.md). This entry, in the closure commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes — 113 files over six commits, listed in the report's §7 (RC-11); beyond that list: `dataManagerSection.test.ts` (a dark-coverage case the report classed light-only) and the probe's own fix commit.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, probe 62/62 (P-2026-10-10-0910)
**Notes**: StructureGroups.scss:82-84 left in place pending Alfonso's critical-zone go-ahead: one inert dark rule. Build CSS: base 19693 rules − 1703 dark − 3 OS-dark − 24 chooser = 17963 = after, rule by rule. Probe: A and B identical to the base on dashboard and four scenes, a stored 'dark' renders as A, Settings 0 radios. tsc 14 (same set), vitest 9 known reds, 7661 passed, build 0. First smoke timed out on a cold vite (g). Report: `docs/discovery/discovery_2026-10-10_dark_theme_removal.md`.
**Prompt document name**: 2026-10-10 09:10
