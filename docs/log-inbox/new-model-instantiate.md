# log-inbox — lane «new-model-instantiate»

Entries written by the new-model-instantiate lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — docs(discovery): new model instantiate, not reproduced; stale canvas memo (P-2026-10-11-1135)
**Prompt**: `claude_2026-10-11_1135_prompt_new_model_instantiate.md`, full lane, Phase 1 on `~/jjodel-w-newinst` (branch `new-model-instantiate`): reproduce «a new project's model cannot instantiate its metaclasses» with a probe over every user path, check trunk / `pre-ir-graphvertex` / `pre-relayout-on-open`, root cause, fix proposal, hard stop.
**Files touched**: `309245922`: `frontend/scripts/probe/new-model-instantiate.ts` (new). `60e51a4a3`: `docs/discovery/discovery_2026-10-11_new_model_instantiate.md` (new), `docs/discovery/assets/new-model-instantiate/` (6 files: the probe log, four run JSONs, one screenshot). This commit: this inbox file (new).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: yes — the assets folder and this inbox are not named by the prompt; 9 files over three commits, above five (rule 19, RC-11); no file under `frontend/src/`
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Not reproduced: on a fresh project every path creates, 5 of 5 scenarios, on be556435b, 294a29084 and aa9fd6701 (3080); palette click is drag-only by design. Found F1: useEditorMode's signature lacks composition, so a containment switched off under an open model keeps its class out of palette and drop (0 of 5, since 2026-03-10). Read-only views after a page load confirmed, not blocking (ticket below). Partial: Alfonso's own steps unknown.
**Prompt document name**: 2026-10-11 11:35

## 2026-10-11 — ticket: after a page load every user view and viewpoint reads as a system default
**Ticket**: A project opened by a page load has no `Pointer_ViewPointDefault` in `idlookup` (the record lives only in the boot seed, `store.tsx:247`). The guard at `reducer.ts:1110` then never closes and copies every DViewElement and DViewPoint into the `Defaults` maps: `Defaults.check` answers true, `ViewData.tsx:58` makes the views read-only, `view.tsx:655` refuses to delete them. This is the S4 finding «every view reads read-only in a new project», measured with its trigger. The fix is in the reducer (core, rule 5).
**Priority**: high
**Found in**: P-2026-10-11-1135
**Detail**: `docs/discovery/discovery_2026-10-11_new_model_instantiate.md` §3.2, §4 F2

## 2026-10-11 — fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)
**Prompt**: GO of the chat for Phase 2 of `claude_2026-10-11_1135_prompt_new_model_instantiate.md`, scope F1 only: the key of `useEditorMode`'s memo carries containment and the other fields `resolveM1Info` reads, in a pure module with a unit test and a mutation bench; F2 and F3 out; gates; the probe rerun; hard stop for Alfonso's visual GO, no merge.
**Files touched**: `b08c92322`: `frontend/src/components/editor-v2/hooks/metamodelSignature.ts` (new), `hooks/useEditorMode.ts`, `hooks/__tests__/metamodelSignature.test.ts` (new). `c2666b3b2`: the report's addendum §8 and 3 assets. This commit: this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes — the report addendum and its assets are not named by the GO; the entry goes to this inbox, not to `docs/claude-code-log.md` (P9, parallel lanes); 8 files over three commits, above five (rule 19, RC-11); code is the three declared files
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe, unattended, 5 scenarios: uncontain 0/5 to 5/5, canvas Add on the first right-click 5/5, other rows unchanged; Alfonso's visual GO pending
**Notes**: Gates: new test 22/22; editor-v2/hooks 10 files 197 tests; tsc 14 = baseline; build 0; check:scripts PASS. Bench 11 mutants, 11 killed (composition, aggregation, type, bounds, interface, supertypes, all reference shapes, object pointers, subpackages, pointedBy). modeInfo reaches EditorV2 only; useJjomSync and useM1ReferenceEdges do not receive it. Not driven: containment set from the M2 properties panel (the probe uses the L-API).
**Prompt document name**: 2026-10-11 11:35
