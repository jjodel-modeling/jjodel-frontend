# log-inbox — lane «ecore-nsuri»

Entries written by the Ecore import nsURI-collision lane on `ecore-nsuri` (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — fix(ecore): refuse import of an nsURI already loaded (P-2026-10-31-1711)
**Prompt**: Ecore import whose EPackage nsURI equals a loaded metamodel's: write nothing, show an error naming the metamodel and the nsURI, say to delete or rename it first; same on every entry point; no nsURI or a new one imports as today.
**Files touched**: `frontend/src/services/export/EcoreService.ts`, `frontend/src/services/export/ecoreNsURI.ts` (new), `frontend/src/services/export/__tests__/ecore-nsuri-collision.test.ts` (new) — dad0678a7
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Guard in EcoreService.importFromXML before EcoreParser.parse, so every caller gets it: dashboard Import (ProjectEditor, the only mounted entry), ImportDropZone (mounted nowhere), XMIService embedded metamodel (reached only via ImportDropZone). Compares top-level imported nsURIs with every package (sub-packages too) of state.m2models, on D-layer uri. 8 tests; guard disabled kills 3. Export suite 86/86, tsc, build green. No manual import run.
**Prompt document name**: 2026-10-31 17:11
**Follow-up** (Alfonso, 17:49): the refusal says only to delete the loaded metamodel, not rename it, since a rename keeps the nsURI — 35fca6676.
