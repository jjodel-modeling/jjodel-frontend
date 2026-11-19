# log-inbox — lane «220-validate-metamodel»

Entries written by the 220-validate-metamodel lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-11-19 — fix(#220): Validate evaluates the model's instances when its metamodel is not the project's first
**Prompt**: Chat C-2026-11-19-1530: solve issue #220. Validate on an M1 model read `1 rule over 0 instances` and `No violations` when the model's metamodel was not `metamodels[0]`; secondary defect, skipped instances reached no counter.
**Files touched**: `frontend/src/model/validation/validationContext.ts`, `frontend/src/components/editor-v2/problems/ValidationResultsModal.tsx` (7fcbb4c14, on staging); this inbox (docs commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Cause confirmed: no targetMetamodelId, the M1 tab makes getActiveMetamodel decide null, getTargetMetamodel falls to metamodels[0]. Fix names lmodel.instanceof (as JjScriptService does); skippedInstanceCount (optional) reaches the modal, which shows a neutral incomplete state, not green. Typecheck 0, build ok, vitest src/model/validation 57/57. Scratchpad Playwright probe: 6/6 on the fix, 2 FAIL on HEAD (0 instances).
**Prompt document name**: 2026-11-19 15:30

**Ticket** (follow-up, not done): the toolbar freshness badge (`Toolbar.tsx`, R-VAL-18) still reads a green «No violations» when `skippedInstanceCount > 0`; after this fix that needs a model whose `instanceof` does not resolve, so it was left out of scope.
