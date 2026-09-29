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

## 2026-09-29 — fix(tree): «Derive viewpoint» only on metamodel rows (P-2026-09-29-0305)
**Prompt**: `claude_2026-09-29_0305_prompt_derive_viewpoint_m2_only.md`, fast lane on `~/jjodel-w-derivem1` branch `derive-viewpoint-m2-only`: show the tree menu's «Derive viewpoint» only when the row is a metamodel, by the test `createDerivedViewpoint` uses, and let `menuHeight` follow it.
**Files touched**: code `f2e5b086e`: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (`isDerivableMetamodel`, additive export), `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts` (one describe, 4 tests), `frontend/src/utils/deriveViewpoint.ts` (the inline guard calls the export), `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (`canDerive` in the menu state, `store` added to the joiner import). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-29 01:35
**Causa**: (c)
**Regressions**: unknown — gates on `f2e5b086e`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run` on `editor-v2/viewpoint`, `TreeViewSidebar`, `utils` 1035 passed, 1 file red at import (`UDComparator`, on the known list); `npm run build` exit 0; `check:docs` 4/4; `check:addonly` 0 rewrites. Red first: 4 failed, 37 passed, then 41 passed. Mutation bench on the predicate 4/4 killed (drop isMetamodel, drop className, drop null guard, invert). The tree hook was not run.
**Out-of-scope changes**: yes — `viewpointDerivation.ts` and its test are not in the prompt's DOVE: `deriveViewpoint.ts` does not import in the bench (monaco, `window is not defined`, measured), so an export there could not be executed; CLAUDE.md §5 says move the pure logic to a module the bench imports. 4 files, under Rule 19.
**Layer Impact Report**: not-required (no §3.1 file touched)
**Smoke visivo**: pending — chat, Advanced mode: right-click a metamodel row shows Create View and Derive viewpoint; a class or package row shows Create View only; an M1 model row opens no menu.
**Notes**: Read, not reproduced: the prompt says M1 rows show the item, but `MetamodelNode` (fed by `state.m2models`) is the only `'DModel'` caller of the hook and `ModelNode` has no menu. No M1 path found, so a metamodel row shows what it showed; «click does nothing» is unexplained.
**Prompt document name**: 2026-09-29 03:05

## 2026-09-29 — merge: derive-viewpoint-m2-only into alfonso-frontend-jjtl (P-2026-09-29-0315)
**Prompt**: `claude_2026-09-29_0315_prompt_merge_derive-viewpoint-m2-only.md`, a direct merge by `lane-run merge --direct`, no session: `derive-viewpoint-m2-only` at `dfed9ea9f` into `alfonso-frontend-jjtl`, merge base `76c7b4f7f`, 3 commits on the branch side.
**Files touched**: merge `79c3bd83c`: 6 files from the branch side (`docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_0305_prompt_derive_viewpoint_m2_only.md`, `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`, `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`, `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `frontend/src/utils/deriveViewpoint.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `79c3bd83c` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5668 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: tree menu: Derive viewpoint only on metamodel rows, shared predicate with createDerivedViewpoint; demo scenes untouched
**Notes**: Rollback tag `pre-derive-viewpoint-m2-only` on `76c7b4f7f` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0315/result.json`.
**Prompt document name**: 2026-09-29 03:15

## 2026-09-29 — docs(views): discovery, the classic Petri net notation in the derived viewpoint (P-2026-09-29-0925)
**Prompt**: `claude_2026-09-29_0925_prompt_discovery_petri_notation.md`, read-only discovery on `~/jjodel-w-petrinot` branch `petri-notation-disc`. Question: what the view IR and the renderer can already express of the textbook Petri notation that «Derive viewpoint» should produce (places, transition bars, arcs, the inhibitor, tokens), and a Phase 2 plan.
**Files touched**: this commit only: `docs/discovery/discovery_2026-09-29_petri_notation.md` (new), this entry, the prompt's Status line. Probes gitignored under `frontend/scripts/smoke/_tmp_petrinot_*`, data in `/tmp/petrinot/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no product code written; `git status` shows only the three docs files.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — read-only; no §3.1 file written
**Smoke visivo**: non applicabile
**Notes**: DemoPetri derived today matches 4/19 reference traits with roles, 1/19 without (validateIR 8/8). The derivation alone reaches ink stroke and line, filled arrowhead, straight arcs, italics, 1-dot tokens; outside name, serif, thin bar and the inhibitor circle need additive IR changes in §3.1 files. Plan: four lanes, two before the freeze. Two decisions and five questions for Alfonso in report §0. Sizes inferred, no dev server.
**Prompt document name**: 2026-09-29 09:25

## 2026-09-29 — feat(views): the Petri notation in the derived viewpoint, lane 1 (P-2026-09-29-0939)
**Prompt**: `claude_2026-09-29_0939_prompt_petri_notation_l1.md`, lane 1 of the Petri notation plan (discovery P-2026-09-29-0925 §6), `Lane: full`, on `~/jjodel-w-petri1` branch `petri-notation-l1`: under the Petri roles, place border and arcs in `var(--color-inode-name)`, italic place names, the initial marking as dots up to 4 and a number from 5, straight arcs, the filled arrowhead on arcs; markers `dots-2..4`; no role, today's boxes. One R-VP row for both lanes. Tests first.
**Files touched**: code `1cee1e7e4`: `frontend/src/components/editor-v2/viewpoint/ir/markerRegistry.ts` (rows `dots-2`, `dots-3`, `dots-4`), `frontend/src/components/editor-v2/viewpoint/ir/__tests__/markerRegistry.test.ts`. `3a1753b73`: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`. This commit: `docs/decisions.md` (R-VP-15), this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `3a1753b73`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run` 5709 passed, 0 failed, the 9 known files red at import (`window is not defined`); touched folders 716 passed (702 + 14); `npm run build` exit 0. Red first: 10 failed on the untouched code. Mutation bench 20/20 killed (6 registry, 14 derivation), lists in the two commits. Documents outside the Petri roles byte-equal to `e5010856c` by 13 pinned sha256 digests.
**Out-of-scope changes**: no — 7 files, all in the prompt's DOVE: the four of report §6 lane 1, `docs/decisions.md`, this inbox, the prompt's Status. Above five, declared (RC-11).
**Layer Impact Report**: not-required (no §3.2 file; the one §3.1 file, `viewpoint/ir/markerRegistry.ts`, is three data rows under Alfonso's go-ahead)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3048 (`_tmp_petri1_probe.ts`, gitignored), light: 11/11 checks, traits 11/19 measured; demo run with the derived view on, RUN 1-4 and FINAL equal to the trunk's; walk 12/12 trunk readings identical; crops `docs/discovery/harness/_tmp_petri1_canvas.png`, `_tmp_petri1_canvas_midrun.png` (gitignored)
**Notes**: Unattended: DemoPetri built by the demo's builder (the probe kit's scenario), not imported from the export file, same objects; commit type feat. With the marking bound the derived Place reads «Custom» in the Symbol Editor: a conditional marker matches no preset (symbolRecognition.ts), asserted instead with the marking unbound. Mid-run the dots keep the initial marking beside the run badge, as ratified. Other three demo scenes not re-run.
**Prompt document name**: 2026-09-29 09:39

**Ticket** (low, observations for lanes 2 and 3, not tickets of their own): (1) with every arc straight, `i1` (lock → t2) crosses the bar `t1` on the demo layout, measured `M 120,383 L 886,378` through t1's box; routing is per view, so no per-arc detour. (2) On `lock` the single `dot` (radius 16 of 100, 22..42 px on a 64 px circle) touches the inside name label (top at 38 px); the outside label of lane 2 removes the overlap. (3) The transition measures 198×40 and the place 64×64, as the discovery inferred.

## 2026-09-29 — merge: petri-notation-l1 into alfonso-frontend-jjtl (P-2026-09-29-1006)
**Prompt**: `claude_2026-09-29_1006_prompt_merge_petri-notation-l1.md`, a direct merge by `lane-run merge --direct`, no session: `petri-notation-l1` at `a6372cdf7` into `alfonso-frontend-jjtl`, merge base `385807485`, 6 commits on the branch side.
**Files touched**: merge `0fbb550ea`: 9 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-29_petri_notation.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_0925_prompt_discovery_petri_notation.md`, `docs/prompts/claude_2026-09-29_0939_prompt_petri_notation_l1.md`, `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`, `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/markerRegistry.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0fbb550ea` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5709 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: four demo scenes re-run on 0fbb550ea port 3045: 73 readings identical to 09-29b; derived DemoPetri 11/19 traits (lane probe)
**Notes**: Rollback tag `pre-petri-notation-l1` on `385807485` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1006/result.json`.
**Prompt document name**: 2026-09-29 10:06

## 2026-09-29 — feat(views): the Petri notation revised, no token marks, centred names, bar, Manhattan (P-2026-09-29-1021)
**Prompt**: `claude_2026-09-29_1021_prompt_petri_notation_l2b.md`, lane 2 revised by Alfonso (R-VP-16, amending R-VP-15), `Lane: full`, on `~/jjodel-w-petri2b` branch `petri-notation-l2b`: in the derived Petri views no token marks, names always centred and never clipped, a much smaller transition, Manhattan arcs. Tests first.
**Files touched**: code `449c583b6`: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`ShapeForm 'bar'`), `.../ir/shapeRegistry.ts` (`BAR_SIZE`, the `bar` descriptor), `.../ir/irStyle.ts` (four bar rules appended), `.../ir/structureCapabilities.ts` (the two rows the type requires), `.../ir/__tests__/shapeRegistry.test.ts`, `.../authoring/__tests__/structureCapabilities.test.ts`. `7a254a52f`: `.../viewpoint/derive/viewpointDerivation.ts` and its test. This commit: `docs/decisions.md` (R-VP-16), this entry and a ticket, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-29 09:39 (lane 1, P-2026-09-29-0939)
**Causa**: (f)
**Regressions**: no — on `7a254a52f`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; touched folder `src/components/editor-v2/viewpoint` 41 files, 1007 passed (1001 before); full `npx vitest run` 5712 passed, the 9 known files red at import, plus `scripts/hooks/__tests__/laneRun.test.ts` 3 tests timed out at 5 s under load (load average ~17), 84/84 when run alone; `npm run build` exit 0. Red first: 18 failed on the untouched code. Mutation bench 28/28 killed (16 IR, 12 derivation), lists in the two commits. Documents without roles byte-equal to `e5010856c` (13 digests); the injected CSS before the bar block byte-equal to `22efe0670`.
**Out-of-scope changes**: no — 11 files, all in the DOVE: the derivation and its test, the §3.1 files point 3 needs and their tests (listed in chat before the first edit), `docs/decisions.md`, this inbox, the prompt's Status. Above five, declared (RC-11).
**Layer Impact Report**: not-required (no §3.2 file; the §3.1 files are under `viewpoint/ir/`, Alfonso's go-ahead of 2026-09-29)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3048 (`_tmp_petri2b_probe.ts`, gitignored), light: 21/21. Bar 48×12 (node box 50×14) against a place 64×64 (66×66). Name ink centre against shape centre: places dx 0 to -0.01, dy -0.44 px; bars dx 0, dy -0.45 px; no clipping ancestor, no ellipsis. Arcs 6/6 orthogonal (`MLALAL`, no diagonal piece). Demo run RUN 1-4 and FINAL equal to the trunk's. Crops `docs/discovery/harness/_tmp_petri2b_canvas.png`, `_tmp_petri2b_bar.png`, `_tmp_petri2b_canvas_midrun.png` (gitignored)
**Notes**: Unattended: bar 48×12; the transition name in `var(--color-inode-name)` with a halo in `var(--color-inode-surface)`, since inverse text would vanish off the bar; names in regular weight (the centre position is bold by class); `boundAttribute` kept, `// TODO: cleanup`; lane 1's probe kit was gone, rebuilt from `~/.jjodel-lanes/probe-kit/`. The place name keeps the default text colour, as in lane 1. Other three demo scenes not re-run.
**Prompt document name**: 2026-09-29 10:21

## 2026-09-29 — ticket: a `bar` view in the Symbol Editor reads «Custom» and has no Shape option
**Ticket**: `ShapeForm 'bar'` (`449c583b6`) has no row in `notationCatalog.ts` and no entry in `FORM_OPTIONS` (`VertexAuthoringPanel.tsx`), both left out as authoring surfaces outside R-VP-16. A derived Petri Transition opened in the Symbol Editor is recognized as no preset («Custom»), and its Shape select has no `bar` option (what it displays instead was not measured); picking a form there rewrites the bar. Discovery §6 lane 3 proposed the row `petri-transition-bar`; with it, `NOTATION_CATALOG` goes from 56 to 57 and the Petri section test changes.
**Priority**: low
**Found in**: P-2026-09-29-1021

## 2026-09-29 — merge: petri-notation-l2b into alfonso-frontend-jjtl (P-2026-09-29-1103)
**Prompt**: `claude_2026-09-29_1103_prompt_merge_petri-notation-l2b.md`, a direct merge by `lane-run merge --direct`, no session: `petri-notation-l2b` at `59b4245c0` into `alfonso-frontend-jjtl`, merge base `0fbb550ea`, 4 commits on the branch side.
**Files touched**: merge `faa3cd66f`: 11 files from the branch side (`docs/decisions.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_1021_prompt_petri_notation_l2b.md`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/structureCapabilities.test.ts`, `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`, `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/shapeRegistry.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`, and 3 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `faa3cd66f` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5717 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: four demo scenes re-run on faa3cd66f port 3045: 73 readings identical to 09-29c; derived DemoPetri: no token marks, centred names, 48x12 bar, orthogonal arcs
**Notes**: Rollback tag `pre-petri-notation-l2b` on `cd2b5fec9` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1103/result.json`.
**Prompt document name**: 2026-09-29 11:03

## 2026-09-29 — docs(views): discovery, how far the concrete syntax can improve visually (P-2026-09-29-1227)
**Prompt**: `claude_2026-09-29_1227_prompt_discovery_visual_concrete_syntax.md`, read-only discovery on `~/jjodel-w-visual` branch `visual-syntax-disc`: a measured picture of the visual quality of the default M2/M1 notation and of the derived viewpoints of the four demo scenes (state machine, ESM, activity, Petri), trait tables against the textbook, and a ranked list of improvements by cost and kind (IR data, renderer, IR change).
**Files touched**: this commit only: `docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md` (new), this entry, the prompt's Status line. Probes gitignored under `frontend/scripts/smoke/_tmp_visual_*`, crops under `docs/discovery/harness/_tmp_visual_*.png`, data in `/tmp/visual/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no product code written; `git status` shows only the three docs files.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — read-only; no §3.1 file written
**Smoke visivo**: non applicabile — read-only; the lane probe on 3053 (light, 1600×1000) is the measurement, `EXIT=0` on all five runs
**Notes**: Derived today: SM 4.5/10, ESM 5/11, activity 4.5/10; M2 4/9, M1 1.5/5. 0 of 18 derived transitions labelled; contrast fails on M2 headers (2.4:1), edges (2.34:1), M1 quiet text (1.48:1); generalization paints as a downward V; M1 underline not painted. V1 (derivation only) projected to 7/10 before the freeze. Four decisions, three questions in report §0. Scenes built by the kit's builder, not imported.
**Prompt document name**: 2026-09-29 12:27

## 2026-09-29 — merge: visual-syntax-disc into alfonso-frontend-jjtl (P-2026-09-29-1359)
**Prompt**: `claude_2026-09-29_1359_prompt_merge_visual-syntax-disc.md`, a direct merge by `lane-run merge --direct`, no session: `visual-syntax-disc` at `b612fae6b` into `alfonso-frontend-jjtl`, merge base `12ac29f74`, 2 commits on the branch side.
**Files touched**: merge `b4d817c22`: 3 files from the branch side (`docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_1227_prompt_discovery_visual_concrete_syntax.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `b4d817c22` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5740 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only, the visual concrete syntax discovery
**Notes**: Rollback tag `pre-visual-syntax-disc` on `1d940e825` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1359/result.json`.
**Prompt document name**: 2026-09-29 13:59

## 2026-09-29 — feat(views): control-flow notation in the derived viewpoint, lane V1 (P-2026-09-29-1331)
**Prompt**: `claude_2026-09-29_1331_prompt_visual_v1.md`, lane V1 of the visual concrete syntax discovery (§5), `Lane: full`, on `~/jjodel-w-v1` branch `visual-v1`: the derived state machine, ESM and activity views closer to the textbook, IR data only, tests first; the row R-VP-17.
**Files touched**: code `b2f3548a0`: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`. This commit: `docs/decisions.md` (R-VP-17), this entry, the Status line of the prompt file. Probes `frontend/scripts/smoke/_tmp_v1_*` and crops `docs/discovery/harness/_tmp_v1_*.png` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `b2f3548a0`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; derive folder 70 passed (53 before; 14 red first); full `npx vitest run` 5755 passed, 2 failed, 10 files red: the 9 known import reds and `laneRun.test.ts` (two 5 s timeouts under load), 84/84 alone; `npm run build` exit 0, Sass deprecations and the chunk-size warning only; `check:docs` 4/4. Mutation bench 22/22 killed. Structure-only and Petri documents byte-equal (digests).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no §3.1 file: `viewpoint/derive/` is outside `viewpoint/ir/` and `viewpoint/authoring/`)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3054 (light, 1600×1000) EXIT=0, crops `docs/discovery/harness/_tmp_v1_{sm,esm,flowB}_derived.png`
**Notes**: Measured: on the lproxy backend `$event.value` is the event's L proxy, printed as its DObject name (coin, push, stop); used as is. Re-scored: SM 7/10, ESM 7/11, activity 7/10 (was 4.5, 5, 4.5). Not reached: a small dot and bull's-eye (64 px), `[guard] / effect`, Events as nodes, the diamond, routing (t5, ts cross `unlocked`). An empty guard mounts a transparent 12×4 label box. One docs commit as the prompt asks, not the inbox alone.
**Prompt document name**: 2026-09-29 13:31
