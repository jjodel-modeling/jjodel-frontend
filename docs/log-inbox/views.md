# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-27 — fix(editor-v2): the Properties rail opens on the model (P-2026-09-27-0110)
**Prompt**: `claude_2026-09-27_0110_prompt_properties_rail_shows_model.md`, fast lane on `~/jjodel-release`. With no selection (tab open, pane click, `deselectAll`) the rail showed the root package or the first class: `findModelElement` walked `rawModel.packages`. Decision RC-25 of the prompt: it returns the model id in every case, signature kept, walk removed.
**Files touched**: code `cc2550779`: `frontend/src/components/editor-v2/hooks/useJjomSelection.ts` (`findModelElement` body and doc comment; its three callers unchanged). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates green on `cc2550779`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; `npx vitest run src/components/editor-v2` 74 files, 1634 passed; `npm run build` exit 0, 51 warning lines as the baseline. No test covers the hook; the rail is verified only by the chat's visual check.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no §3.2 file touched)
**Smoke visivo**: chat, localhost:3001 (pending: new metamodel, pane click after adding a class, class click, existing metamodel with classes)
**Notes**: Consumers read by body, all accept a DModel id: `selectors.ts:64,75`; `PalettePanel.tsx:103-107`; Jodie via `jjscript/executor/utils.ts:83,156` and `activeArtifact.ts:77`; `SaveManager.ts:63`; `PropertiesWithTreeView.tsx:536-548`; `Info.tsx:1592,1650-1668`. HEAD moved mid-session: the chat's `2124b64fe`, one prompt file, disjoint. Status flipped at the code commit as the prompt asks, not at the visual GO as P13 says.
**Prompt document name**: 2026-09-27 01:10

## 2026-09-27 — feat(editor-v2): metamodel canvas refuses connections to non-class nodes (P-2026-09-27-0120)
**Prompt**: `claude_2026-09-27_0120_fase2_enum_edge_guard_canvas.md`, Phase 2 step C1 of the enum edge guard, `Lane: full`, on `~/jjodel-open` branch `enum-edge-guard`. Option A of report `4e5dff7ad` (R-EDGE-1): in a metamodel a canvas connection is valid only when both ends are class nodes; in a model nothing changes.
**Files touched**: code `5dc09a4ce`: `frontend/src/components/editor-v2/utils/connectionValidity.ts` (new), `frontend/src/components/editor-v2/utils/__tests__/connectionValidity.test.ts` (new), `frontend/src/components/editor-v2/EditorV2.tsx` (`isValidConnection` on `<ReactFlow>`, `getNode`, the import), `frontend/src/components/editor-v2/EditorV2.scss` (one rule, `--color-error`). This commit: this entry, two tickets, the Status lines of the Phase 1 and Phase 2 prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `5dc09a4ce`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4936 passed (4889 + 47, stated before the run), 0 failed, the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: the test failed at collection. Mutation bench 6/6 killed, table in `5dc09a4ce` (mutant 5 by the browser probe). Probe on 3004: 51/51 in light and in dark.
**Out-of-scope changes**: no — the four files of the prompt's DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required (no `CLAUDE.md` §3.1 file touched)
**Smoke visivo**: passato — chat, unattended, 51/51 (Alfonso in the morning digest)
**Notes**: Declared at the hard stop: the prompt commit's parent is `931943f29` (the R-EDGE rows, docs only), not `90722c375`; subject cut to 72 (the prompt's was 76); port 3004, 3003 held by another server; the discovery's probe was gone, a new one written. The class node type is a literal typed by `ClassNodeType`: the registry cannot be imported. The first turn ended with gates in the background and no Outcome; resumed. Screenshots: `~/.jjodel-lanes/P-2026-09-27-0120/shots/`.
**Prompt document name**: 2026-09-27 01:20

**Ticket** (observations, low, not tickets of their own): (1) releasing a gesture exactly on an anchor's centre can hit its source twin, which has no `connectableend`, and xyflow refuses it before `isValidConnection` runs: measured on a reconnect at 100% with and without this lane (mutant-5 run), and on a connect at zoom 0.8. (2) In the dark L1 screenshot a node at x=1091 paints over the right panel's tree header; not in light; not investigated.

## 2026-09-27 — ticket: saved metamodels may hold the edges the canvas now refuses
**Ticket**: The canvas guard of `5dc09a4ce` stops new ones only. Projects saved before it may hold three shapes, each measured by the discovery to load, render and survive save and reload: S1, a `DReference` typed by a `DEnumerator` with its `isReference` DEdge (it also round-trips through the Ecore export and import); S5b, a raw `extends` on a `DEnumerator` with its `isExtend` DEdge (dropped silently by the export); S6, a `DReference` typed by a `DPackage` (its export does not re-import). Two options (R-EDGE-3): an M2 well-formedness producer in the problems registry (shows, repairs nothing; a new `NodeProblemKind` changes an exported union), or a VersionFixer migration that retypes to `EObject` and deletes the orphan DEdges and `DEnumerator.extends` (a migration and a deletion of persisted data: RC-26, Alfonso). The producer decision is taken at the closure of step C2, no later than 2026-10-04.
**Priority**: medium
**Found in**: P-2026-09-27-0035
**Detail**: docs/discovery/discovery_2026-09-27_enum_edge_guard.md (§3.3, §4 «which covers saved projects»)

## 2026-09-27 — ticket: step C2, the model layer and the Ecore import refuse a non-class type or supertype
**Ticket**: The canvas guard (C1, `5dc09a4ce`) leaves every other writer open: console and L API, custom view code, the Ecore import. Report §4 B: `LTypedElement.set_type` refuses, for a `DReference`, a pointer whose D object is not a `DClass`; `_canExtend` refuses a non-class superclass with a reason instead of dying on `.map`; the data types get a refusing `set_extends`, so `_defaultSetter` stops writing a raw `extends`; the rule lives in a pure module (the `nameLookup.ts` pattern). The import check: `LinkAllNamesToIDs` in `api/data.ts` retypes an `EReference` whose `eType` is an `EEnum` to `EObject` with a `Log.ww` (R-EDGE-2), next to the `extends` check at `:360-363`. A core change (Rule 5). The review's warning, a precondition of its Phase 2: a guard in `set_type` must not run on load, undo/redo or VersionFixer replay, or saved projects stop opening; measure those paths first.
**Priority**: medium
**Found in**: C-2026-09-26-1702
**Detail**: docs/discovery/discovery_2026-09-27_enum_edge_guard.md (§4 B, §5, §8 decision 1)

## 2026-09-27 — docs(views): enum step B discovery, load, undo/redo and replay against the guarded setters (P-2026-09-27-1645)
**Prompt**: `claude_2026-09-27_1645_prompt_discovery_enum_step_b.md`, Phase 1 of S23, `Lane: full`, on `~/jjodel-gate` branch `enum-step-b`, read-only: measure whether load, undo/redo and VersionFixer replay pass through the setters R-EDGE-2 would guard, and give decision G (S24) its measurements.
**Files touched**: this commit: `docs/discovery/discovery_2026-09-27_enum_step_b.md` (new), this entry, the Status line of the prompt file. No file under `frontend/` tracked by git; probes `frontend/scripts/smoke/_tmp_enumb_*` gitignored, left on disk.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only; `git status --porcelain` empty before and after the probes; Vite on 3017 started and stopped by this session.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (read-only; critical-zone files read, none edited)
**Smoke visivo**: non applicabile
**Notes**: Load, tab open, undo/redo (14+14), VersionFixer replay from 8 start versions, «Check integrity» and the Ecore import: 0 guarded-setter calls, 0 refusals with the candidate guard live, positive controls fired on every page. A data-type set_extends must allow removals (report §3.6). One commit for report, entry and flip as the prompt asks, so the Status line cannot carry its own sha: the hard stop does.
**Prompt document name**: 2026-09-27 16:45

**Ticket** (medium, found here, report §3.7): a saved metamodel holding S5b (`DEnumerator.extends = [C]`) cannot take a new attribute or reference on `C`: `Constructors.DStructuralFeature` iterates `extendedBy` of the enum (`joiner/classes.ts:739`) and throws `ltarget.extendedBy is not iterable`; `LReference.duplicate` on `C` fails with it. Unlinking the S5b edge on the canvas repairs it. Proposed as B5 of step B's Phase 2.

## 2026-09-27 — feat(model): enum step B Phase 2, model guards, B5 and the classifier-kind producer (P-2026-09-27-1806)
**Prompt**: `claude_2026-09-27_1806_prompt_enum_step_b_phase2.md`, Phase 2 of the discovery P-2026-09-27-1645, `Lane: full` (critical zone, RC-30 go-ahead), on `~/jjodel-gate` branch `enum-step-b`: B1-B3 with the additions-only data-type guard, B5, and the S24 producer (decision G). Resumed once: `registry.ts` passed to this lane for the `classifier-kind` literal.
**Files touched**: docs `2f4ae0e66` (`docs/discovery/lir_2026-09-27_enum_step_b.md`, new). Code `8939401a0`: `frontend/src/model/classifierKindRules.ts` (new), `frontend/src/model/__tests__/classifierKindRules.test.ts` (new), `frontend/src/model/logicWrapper/LModelElement.tsx` (`set_type`, `_canExtend`, `set_extends` filter, new `LDataType.set_extends`). `c185ae373`: `frontend/src/joiner/classes.ts` (B5). `a64bf5755`: `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (both sync creators refuse a non-class end). `90ae1d75b`: `classifierKindRules.ts` (detector), its test, `frontend/src/components/editor-v2/problems/registry.ts` (one literal), `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` (second effect), `frontend/src/components/editor-v2/problems/__tests__/classifierKindProblems.test.ts` (new). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — after each slice `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; vitest on the touched folders green (last: `src/model` + `src/components/editor-v2` + `src/components/TreeViewSidebar` 2560 passed); `npm run build` exit 0, 51 warning lines; `check:scripts` PASS, `check:docs` 4/4. Mutation benches: rules 6/6 killed plus 1 equivalent, detector and producer 14/14. Browser probe on 3017 (`_tmp_enumb2_probe.ts`, gitignored): 24/24, every refusal paired with a passing class control, cold load of a saved S1/S6/S5b project with 0 refusals logged.
**Out-of-scope changes**: yes — three new files outside the ownership map: `classifierKindRules.ts` and its test (named by the report, §4 B1), and `problems/__tests__/classifierKindProblems.test.ts`, a new file under the sim-checker-gap glob, written after its P2a closed; `UniquenessProblemSync.test.ts` untouched.
**Layer Impact Report**: produced
**Smoke visivo**: pending — chat, RC-23; lane probe 24/24, crops of the Person tree row with the error triangle in `~/.jjodel-lanes/shots_enum-step-b/` (light, dark, hover)
**Notes**: First turn passed the 90-minute limit: one build took 71 min at load average ~199. Unattended: `LClass.set_extends` filtered on the reason objects and never dropped a refused pointer, fixed with `invalidPtrs` (B2 holds only with it); a missing type is detected as its own verdict and not published; entries anchored on the element and on the class row (the tree lists classes only). Not done: B4, `api/data.ts` is outside the ownership map. Dark crop: tree background stays light, pre-existing.
**Prompt document name**: 2026-09-27 18:06
