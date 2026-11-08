# log-inbox — lane «notices»

Entries written by the notices lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-11-08 — docs: notices and tips discovery, Phase 1 (P-2026-11-08-2230)
**Prompt**: `claude_2026-11-08_2230_prompt_notices_tips_discovery.md`: locate the notification card, its data path, seen state, consumers and geometry, read-only, as Phase 1 of the split into an announcement banner and a tips card
**Files touched**: `docs/discovery/discovery_2026-11-08_notices_and_tips.md` (`4e200c093`). No product file
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only; `git status` clean after every run
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no sync or D-L path; F8 of the report)
**Smoke visivo**: non applicabile
**Notes**: One card, one mount. The second edge is the React Flow minimap. Tips return because seen expires after 14 days and the pause yields as soon as one tip is not recently seen. Six questions for Alfonso, answered by R-NT-1..5. Closed by P-2026-11-08-2340, item 1.
**Prompt document name**: 2026-11-08 22:30
