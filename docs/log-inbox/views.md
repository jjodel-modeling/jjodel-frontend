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

## 2026-09-27 — merge: enum-step-b into alfonso-frontend-jjtl (P-2026-09-27-2327)
**Prompt**: `claude_2026-09-27_2327_prompt_merge_enum-step-b.md`, merge lane on `alfonso-frontend-jjtl` in `~/jjodel-release`: `--no-ff` of `038ddee4b` (`enum-step-b`, P-2026-09-27-1806), zero conflicts. Resumed on the chat's GO with two additions: the four demo scenes re-run on the merged tree (3029), and the row of Alfonso's 23:26 decision (RC-31).
**Files touched**: merge `c030871ff` (the branch's 11 files, no union resolution); docs, this commit: `docs/decisions.md` (RC-31), the Status of the prompt file, this entry. Probes `frontend/scripts/smoke/_tmp_m2327_*` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `c030871ff`: typecheck exit 2, 14 errors, set identical; vitest 5292 passed across 216 files (5265 + 27, stated before the merge), the nine known red at import; hooks 300; build exit 0; `typecheck:scripts` exit 0; `check:agents`, `check:scripts` PASS; `check:docs` 4/4. The four demo scenes on script.
**Out-of-scope changes**: no — the merge's files are the branch's, declared by the prompt; `docs/decisions.md`, the scenes and this entry were asked by the chat's GO.
**Layer Impact Report**: not-required — the merge adds no change of its own; the branch's 14 lines in `canvasToJjom.ts` are covered by its report `2f4ae0e66`.
**Smoke visivo**: passato — the chat on 3001 (GO, unattended; Alfonso in the morning digest); the four demo scenes on 3029 through the Simulation roles dialog, on script
**Notes**: Probe copied read-only from P-2026-09-27-2105, one fresh page per scene, EXIT=0, one known console error each. SM 10 steps, Terminated. Petri Bound 4 (proposed, stored), 4 steps, Deadlock · ε: t2 false. ESM 10 steps, Halted, `Halted: coins of demoESM would be 4, outside its domain.` whole on 2 rows (41px slot, scroll = client). Flow B 6 steps, Terminated. 3029 stopped, 3001 not restarted. Logs in `~/.jjodel-lanes/P-2026-09-27-2327/`.
**Prompt document name**: 2026-09-27 23:27
**Ticket** (priority low, opened here). `npm run docs:digest -- --date 2026-09-27` exits 2 on R-SIM-85's header: its parenthesis does not close on the header line (pre-existing, not edited here). RC-31 parses.

## 2026-09-29 — feat(views): viewpoint derivation Phase 2, a deterministic viewpoint from a metamodel (P-2026-09-29-0135)
**Prompt**: `claude_2026-09-29_0135_prompt_viewpoint_derivation_p2.md`, Phase 2 of the discovery P-2026-09-29-0111, `Lane: full`, on `~/jjodel-w-viewgen2` branch `viewpoint-derivation-p2`: «Derive viewpoint» in the metamodel's tree menu creates a new viewpoint, one IR view per concrete class, from the structure and the stored role binding; no priority, no provenance key, catalogue ink `#334155` on solid symbols, tests first.
**Files touched**: code `1eb916bba`: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (new), `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts` (new). `9511f745c`: `frontend/src/utils/deriveViewpoint.ts` (new), `frontend/src/view/viewElement/view.tsx` (`appliableToForIRKind` exported). `fead37b48`: `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (the menu item). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `fead37b48`'s code: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run` 5644 passed (5607 + 37), 0 failed, the 9 known files red at import; `npm run build` exit 0, only the Sass deprecations and the chunk-size warning; `check:docs` 4/4, `check:addonly` clean, `check:scripts` PASS. Red first: the test failed at collection. Mutation bench 21/21 killed, list in `1eb916bba`.
**Out-of-scope changes**: no — the four files of the prompt's DOVE and the optional `view.tsx` export it names.
**Layer Impact Report**: not-required (no `CLAUDE.md` §3.1 file touched; `viewpoint/derive/` only imports from `viewpoint/ir/`)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3042 (`_tmp_viewgen2_probe.ts`, gitignored), light theme: 32/32, one known console error; crops `docs/discovery/harness/_tmp_viewgen_DemoPetri.png` and `_tmp_viewgen_DemoFlowB.png` (gitignored)
**Notes**: Undo measured: one derivation adds one history entry; one Cmd+Z removes the viewpoint and its views (Petri 4, FlowB 8), leaves every other view byte-identical and keeps the roles' Apply. Unattended: guards against false edges (a kind of an end, a third reference, its own container), Families, Person and Car as controls; names on solid symbols in `--color-text-inverse`, measured unreadable without it. Commit type `feat` chosen, the prompt names none.
**Prompt document name**: 2026-09-29 01:35

**Ticket** (low, found here): in dark theme `--color-text-inverse` is `#08090a`, so a name on a solid symbol (`#334155`) does not read there. An IR label sits inside the shape at every position, and `StructureSpec.name.position` is declared but not rendered on the IR branch: the fix is an always-light token or an outside label position. Dark theme is out of this phase (decision 4).

## 2026-09-29 — merge: viewpoint-derivation-p2 into alfonso-frontend-jjtl (P-2026-09-29-0233)
**Prompt**: `claude_2026-09-29_0233_prompt_merge_viewpoint-derivation-p2.md`, a direct merge by `lane-run merge --direct`, no session: `viewpoint-derivation-p2` at `5334ffa5c` into `alfonso-frontend-jjtl`, merge base `174f6c58a`, 5 commits on the branch side.
**Files touched**: merge `cf0dc6b8c`: 7 files from the branch side (`docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_0135_prompt_viewpoint_derivation_p2.md`, `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`, `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`, `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `frontend/src/utils/deriveViewpoint.ts`, `frontend/src/view/viewElement/view.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `cf0dc6b8c` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5664 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat: four demo scenes probed on the branch, light theme, port 3044: 71 readings identical to the trunk before R-SIM-94; lane measured one-step undo and default viewpoint untouched; additive feature behind Derive viewpoint in Advanced mode; crops not viewed by the chat
**Notes**: Rollback tag `pre-viewpoint-derivation-p2` on `04c81327d` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0233/result.json`.
**Prompt document name**: 2026-09-29 02:33

## 2026-09-29 — docs(views): discovery, deriving a viewpoint from a metamodel into the view IR (P-2026-09-29-0111)
**Prompt**: `claude_2026-09-29_0111_prompt_discovery_viewpoint_derivation.md`, read-only discovery on `~/jjodel-w-viewgen` branch `viewpoint-derivation`: can a deterministic derivation (metamodel plus role binding into one IR view per concrete class, Phase 2, no Jjodie) be built now, additively, and with which plan.
**Files touched**: this commit only: `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md` (new), this entry, the prompt's Status line. Probes gitignored under `frontend/scripts/smoke/_tmp_viewgen_*`, data in `/tmp/viewgen/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no product code written; `git status` shows only the three docs files.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — read-only; no §3.1 file written
**Smoke visivo**: non applicabile
**Notes**: Prototype on the four demos: 22 views, validateIR 22/22, edges 5/5 by structure alone, 179 deterministic fields with roles (8.1 per view), 53 left to Jjodie. Exports hold no role binding, rebuilt with bindProfile. Hand-written IR views found only in 3 ERD exports of 780. Two decisions for Alfonso and three questions in report §0. The prompt's `frontend/src/ai/` does not exist: Jjodie was read in `services/` and `components/Jodie/`.
**Prompt document name**: 2026-09-29 01:11

## 2026-09-29 — merge: viewpoint-derivation into alfonso-frontend-jjtl (P-2026-09-29-0259)
**Prompt**: `claude_2026-09-29_0259_prompt_merge_viewpoint-derivation.md`, a direct merge by `lane-run merge --direct`, no session: `viewpoint-derivation` at `6c7dc7b33` into `alfonso-frontend-jjtl`, merge base `174f6c58a`, 2 commits on the branch side.
**Files touched**: merge `8a183be5a`: 3 files from the branch side (`docs/discovery/discovery_2026-09-29_viewpoint_derivation.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_0111_prompt_discovery_viewpoint_derivation.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `8a183be5a` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5664 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only, the viewpoint derivation discovery report and its log entry; no code
**Notes**: Rollback tag `pre-viewpoint-derivation` on `1d707831f` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0259/result.json`.
**Prompt document name**: 2026-09-29 02:59
