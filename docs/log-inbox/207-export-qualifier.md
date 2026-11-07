# log-inbox — lane «207-export-qualifier»

Entries written by the 207-export-qualifier lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-11-04 — fix(#207): an object's class always carries its metamodel in the JSON export
**Prompt**: Chat C-2026-11-04-1644: solve #207 for good. In the megamodel export a nested object in `externalObjects` carried `class.metamodel`, the same object in its owner's `objects` did not.
**Files touched**: `frontend/src/services/export/JsonModelService.ts`, `frontend/src/services/export/__tests__/JsonModelService.test.ts` (918749fe0); `docs/json-export-schema.md`, this inbox (docs commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Cause: buildObject qualified the class relative to the document's metamodel, so one object had two shapes. Fix: an Object's class is always qualified; M2 refs unchanged. formatVersion stays 1.0 (Juri's ok), change noted in schema Versioning. Bench: dropping the flag fails only the new test (1/15). typecheck 0, build green. "v2.23" in the issue is data schema 2.230, after the #128 merge 658eb69ab. Light Jodie docs now carry the qualifier too.
**Prompt document name**: 2026-11-04 16:44
