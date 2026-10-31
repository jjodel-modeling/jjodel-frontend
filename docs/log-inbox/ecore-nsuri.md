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

## 2026-10-31 — merge: ecore-nsuri into alfonso-frontend-jjtl (P-2026-10-31-1839)
**Prompt**: Bring `ecore-nsuri` at `10e73040e` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit ff05fd79d (5 files from the branch: `frontend/src/services/export/EcoreService.ts`, `ecoreNsURI.ts`, `__tests__/ecore-nsuri-collision.test.ts`, prompt 1711 and this inbox file); `docs/prompts/claude_2026-10-31_1839_prompt_merge_ecore-nsuri.md` Status line; `docs/log-inbox/ecore-nsuri.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (GO from the chat on the gates and the 8 unit tests of the guard; no visual re-check)
**Notes**: Trunk at 2ecc6c99f, base e94541c13. Merge-tree: zero conflicts, tree 134d018e2 equal to the merge's index; 5 branch files, 19 trunk files, none on both sides, no governance file; six probes once each; no union. Gates on ff05fd79d: typecheck 0, typecheck:scripts 0; vitest 12410 (12402 + 8), 467 files, 9 known red at import; hooks 967; build 0; check:docs 5/5; agents, scripts, addonly PASS. Lane board untouched; 3001 up, not restarted.
**Prompt document name**: 2026-10-31 18:39
