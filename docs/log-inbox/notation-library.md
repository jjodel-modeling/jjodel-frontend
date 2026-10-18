# log-inbox — lane «notation-library»

Entries written by the notation-library lanes on `notation-library-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-18 — discovery: notation library and gallery, seal, provenance, clone, packaging (P-2026-10-18-1735)
**Prompt**: Phase 1 read-only discovery of R-LIB: hiding of the default syntax, every M2 write path and its choke point, project shape, read-only mode, client-side gallery clone, Ecore gallery build, sealed package format, slices
**Files touched**: docs/discovery/discovery_2026-10-18_notation_library.md (new), docs/log-inbox/notation-library.md (new), docs/prompts/claude_2026-10-18_1735_prompt_discovery_notation_library.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Read only, nothing run. Choke point: reducer.ts:541-549 (core, S6 in critical zone); LoadAction outside it, undo covered by induction. Default hiding is a fixed-id allowlist, so the seal needs a _state marker. The gallery clone is client-only via importFromText. The Ecore build needs Playwright, Families/Persons.ecore missing. 8 slices, S1 and S2 clear of the zone. 5 decisions await Alfonso (report §0).
**Prompt document name**: 2026-10-18 17:35
