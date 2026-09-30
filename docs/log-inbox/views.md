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

## 2026-09-29 — merge: visual-v1 into alfonso-frontend-jjtl (P-2026-09-29-1417)
**Prompt**: `claude_2026-09-29_1417_prompt_merge_visual-v1.md`, a direct merge by `lane-run merge --direct`, no session: `visual-v1` at `5eed460a2` into `alfonso-frontend-jjtl`, merge base `afa951c64`, 3 commits on the branch side.
**Files touched**: merge `5ecdaaa89`: 5 files from the branch side (`docs/decisions.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_1331_prompt_visual_v1.md`, `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`, `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `5ecdaaa89` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5757 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: V1 derived control-flow notation, SM 7/10 ESM 7/11 activity 7/10
**Notes**: Rollback tag `pre-visual-v1` on `d0d7b7463` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1417/result.json`.
**Prompt document name**: 2026-09-29 14:17

## 2026-09-29 — fix(editor-v2): the default notation legible, lane V2 (P-2026-09-29-1332)
**Prompt**: `claude_2026-09-29_1332_prompt_visual_v2.md`, lane V2 of the visual concrete syntax discovery (§5), branch `visual-v2`, heavy tier. Five defects of the default M2/M1 notation in the light theme, measured before and after by the lane probe on 3055 on the four demo scenes; R-VP-18.
**Files touched**: `c3b328dc3`: `frontend/src/components/editor-v2/_themes.scss`, `frontend/src/styles/tokens/_colors-light.scss`, `frontend/src/components/editor-v2/nodes/instanceNode.scss`, `frontend/src/components/editor-v2/__tests__/lightThemeLegibility.test.ts` (new). `8d63170e3`: `frontend/src/components/editor-v2/utils/edgeUtils.ts`, `frontend/src/components/editor-v2/hooks/useTreeLayout.ts`, `frontend/src/components/editor-v2/utils/__tests__/treeConnector.test.ts`. This commit: `docs/decisions.md` (R-VP-18), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run src/components/editor-v2` 84 files, 2051 passed before the last two tests; full vitest 5755 passed, the 9 known files red at import; `npm run build` exit 0; walks of the four scenes vs the sim-toggle lane's readings (P-2026-09-29-1225): 68/71 identical, the 3 others (Petri RUN 1-3) only the kit reader's section title, renamed by R-SIM-98 after that reference.
**Out-of-scope changes**: yes: `edgeUtils.ts` and `useTreeLayout.ts` instead of the `UnifiedEdge.tsx` the report named for the marker; one committed test changed, it pinned the defect.
**Layer Impact Report**: not-required (no §3.2 file touched)
**Smoke visivo**: non applicabile (lane probe on 3055, light; the visual GO is the chat's)
**Notes**: Ratios: header 2.35→6.22 and 2.09→7.02; edges 2.34→16.3; quiet 1.48→4.76; underline 0→312-436 px; triangle tip 5 px outside pointing away, 41% hidden → 1 px inside, 0%. Also reached, declared in R-VP-18: derived SM/ESM/activity edges without authored colour, the ESM derived dash, the classic object header. Derived Petri unchanged. The first after-probe missed the FlowB tree once, not reproduced; hardened against a NaN bottom.
**Prompt document name**: 2026-09-29 13:32

## 2026-09-29 — merge: visual-v2 into alfonso-frontend-jjtl (P-2026-09-29-1450)
**Prompt**: `claude_2026-09-29_1450_prompt_merge_visual-v2.md`, a direct merge by `lane-run merge --direct`, no session: `visual-v2` at `ee0b05bdf` into `alfonso-frontend-jjtl`, merge base `afa951c64`, 4 commits on the branch side.
**Files touched**: merge `5b51fbe34`: 10 files from the branch side (`docs/decisions.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_1332_prompt_visual_v2.md`, `frontend/src/components/editor-v2/__tests__/lightThemeLegibility.test.ts`, `frontend/src/components/editor-v2/_themes.scss`, `frontend/src/components/editor-v2/hooks/useTreeLayout.ts`, `frontend/src/components/editor-v2/nodes/instanceNode.scss`, `frontend/src/components/editor-v2/utils/__tests__/treeConnector.test.ts`, and 2 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `5b51fbe34` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5772 tests in 227 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: V2 legible default notation: M2 header 6.22:1, edges 16.3:1, M1 quiet 4.76:1, underline painted, generalization triangle up
**Notes**: Rollback tag `pre-visual-v2` on `96360e0b7` (RC-31). Union: `docs/decisions.md`, `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1450/result.json`.
**Prompt document name**: 2026-09-29 14:50

## 2026-09-29 — fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)
**Prompt**: `claude_2026-09-29_2121_prompt_no_proxy_ir.md`, lane F1 of the discovery `a50fa6607` (H1), `Lane: full`, critical zone `viewpoint/ir/` with the RC-30 go-ahead, on `~/jjodel-w-noproxy` branch `no-proxy-ir`. Local guard only, `Action.fire` untouched: `set_ir` deep-maps a nested L object to its id or refuses; `irHash` and `compressedState` stringify with a replacer that writes a proxy as its id.
**Files touched**: LIR `e2e2195c6`: `docs/discovery/discovery_2026-09-29_no_proxy_ir_layer_impact.md` (new). Code `719703ef6`: `frontend/src/model/unproxy.ts` (new), `frontend/src/model/__tests__/unproxy.test.ts` (new), `frontend/src/view/viewElement/view.tsx` (`set_ir`, one import), `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (`irHash`, one import), `frontend/src/common/U.tsx` (`compressedState`, one import). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `719703ef6`: typecheck exit 2, 14 errors, the §17 set by file and code; typecheck:scripts exit 0; check:scripts PASS; vitest 5883 passed of 5883 (5867 at the tip + 16, stated before the run), the 9 files red at import; build exit 0. Red first: 2 failed of 16 on the tip's `irHash`. Mutation bench 17/17 killed, list in `719703ef6`. Probe on 3059, discovery fixture: 5/10 before, 12/12 after; id control saves in 331 ms before, 346 ms after.
**Out-of-scope changes**: no — eight files across the lane, all in the prompt's DOVE: the five of `719703ef6`, the LIR, this inbox, the prompt file.
**Layer Impact Report**: produced (`e2e2195c6`, committed before the diff)
**Smoke visivo**: non applicabile
**Notes**: No rendering changed; the probe is functional (store, localStorage, toasts). The LIR sits in `docs/discovery/` as the prompt names, not in `docs/lir/` as RC-30 says. The direct D writers of `ir` stay unguarded, listed in LIR §1; the replacer is their backstop. Logs: `~/.jjodel-lanes/P-2026-09-29-2121/probe-noproxy-{prefix,postfix,postfix-refusals}.log`.
**Prompt document name**: 2026-09-29 21:21

## 2026-09-29 — ticket: a critical-zone lane sees four red hook tests in its own vitest run
**Ticket**: `frontend/scripts/hooks/__tests__/criticalZone.test.ts` inherits `JJODEL_CRITICAL_ZONE_GOAHEAD` from a session started with `--critical-zone-goahead`. With the variable set, four tests red: the two «bypass not read» and the two «deny limited to the six files». With it unset, the same file is 70/70. Measured at `361eadedd`: full vitest 4 failed of 5867, then 70/70 with `env -u JJODEL_CRITICAL_ZONE_GOAHEAD`. A lane that reads those reds as its own, or as pre-existing, misreports its gate. Fix: the test deletes the variable from the environment it passes to the hook.
**Priority**: low
**Found in**: P-2026-09-29-2121

## 2026-09-29 — merge: no-proxy-ir into alfonso-frontend-jjtl (P-2026-09-29-2158)
**Prompt**: `claude_2026-09-29_2158_prompt_merge_no-proxy-ir.md`, a direct merge by `lane-run merge --direct`, no session: `no-proxy-ir` at `18ec08e9b` into `alfonso-frontend-jjtl`, merge base `5626b3364`, 4 commits on the branch side.
**Files touched**: merge `3573b0029`: 8 files from the branch side (`docs/discovery/discovery_2026-09-29_no_proxy_ir_layer_impact.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_2121_prompt_no_proxy_ir.md`, `frontend/src/common/U.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, `frontend/src/model/__tests__/unproxy.test.ts`, `frontend/src/model/unproxy.ts`, `frontend/src/view/viewElement/view.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `3573b0029` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5888 tests in 232 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Non-visual fix: set_ir unproxies nested L objects (unproxyDeep) and irHash/compressedState stringify with proxyToIdReplacer. Chat checked result.json: all 8 gates green on 3573b0029 (typecheck 14 at the tip set, vitest 5888 tests 0 failed, build ok, check:docs/agents/scripts/addonly ok), 3001 up. Branch proved by unproxy.test.ts and the save probe on 3059. Unattended GO by the chat under Alfonso critical-zone go-ahead of 2026-09-29 21:15.
**Notes**: Rollback tag `pre-no-proxy-ir` on `591504f57` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-2158/result.json`.
**Prompt document name**: 2026-09-29 21:58

## 2026-09-29 — feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)
**Prompt**: `claude_2026-09-29_2122_prompt_ir_collapsed_render.md`, lane F3 of discovery `a50fa6607`, `Lane: full`, critical-zone go-ahead (RC-30), on `~/jjodel-w-collapsed` branch `ir-collapsed-render`. A collapsed `graphVertex` paints `containment.collapsed.form`, `.fill` and `.badge` when declared (compiled, read nowhere before); the badge replaces the count chip. Resumed once for two defects the probe found.
**Files touched**: code `04acac227`: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/components/editor-v2/nodes/__tests__/irCollapsedRender.test.ts` (new). Code `61a45540e`: `IRNodeContent.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`, `irCollapsedRender.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useContentSizeDrop.test.ts` (new). Docs `d6dff9e78`, `d6e9b8486`, `4784837e3`: `docs/discovery/discovery_2026-09-29_collapsed_render_layer_impact.md`. This commit: this entry, a ticket, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `61a45540e`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `typecheck:scripts` exit 0; `npx vitest run` 5884/5884 passed (5877 + 7, stated before the run), 232 files, the 9 known red at import, with `JJODEL_CRITICAL_ZONE_GOAHEAD` unset (ticket below); `npm run build` exit 0. Red first: 3 of 9, then 2 of 3 and 1 of 4. Mutation benches 13/13 and 6/6 killed, lists in the commit bodies.
**Out-of-scope changes**: yes — eight files over the lane, above five (RC-11): the two DOVE files, `useContentSize.ts` added by the chat's RC-21 answer, three test files (two new), the report, this inbox and the prompt file. `irStyle.ts`, approved, not touched.
**Layer Impact Report**: produced
**Smoke visivo**: passato — lane probe on 3060, 15/15, light and dark, crops in `~/.jjodel-lanes/P-2026-09-29-2122/crops/`; the chat's checklist and Alfonso's GO pending (RC-23)
**Notes**: Chat decisions under RC-21 (2026-09-29): (1) useContentSize.ts:159 drops a derived size too: applied. (2) `:not(.ir-badge)` on irStyle's five SVG-form rules: not applied, measured in Chromium it turns the outside label relative on all five forms (Rule 3); every badge gets inline position:absolute instead, irStyle.ts untouched. Chat: flat collapsed fields. The badge replaces the chip's count, not the chip. Spec §8 amendment: question in the report §5.
**Prompt document name**: 2026-09-29 21:22

## 2026-09-29 — ticket: a critical-zone lane's go-ahead variable reaches the criticalZone hook tests
**Ticket**: `lane-run start --critical-zone-goahead` exports `JJODEL_CRITICAL_ZONE_GOAHEAD` into the session, and a full `npx vitest run` from that session inherits it: four tests of `frontend/scripts/hooks/__tests__/criticalZone.test.ts` («kills "bypass not read"» ×2, «kills "deny limited to the six files"» ×2) fail because the hook they spawn sees a go-ahead. With the variable unset the file is 70/70. Every critical-zone lane reports four reds that are not regressions. Fix: the tests clear the variable from the environment they hand the hook, or the gate runs with it unset.
**Priority**: medium
**Found in**: P-2026-09-29-2122
**Detail**: docs/discovery/discovery_2026-09-29_collapsed_render_layer_impact.md (§6, harness note)

## 2026-09-29 — merge: ir-collapsed-render into alfonso-frontend-jjtl (P-2026-09-29-2243)
**Prompt**: `claude_2026-09-29_2243_prompt_merge_ir-collapsed-render.md`, a direct merge by `lane-run merge --direct`, no session: `ir-collapsed-render` at `f601f70ff` into `alfonso-frontend-jjtl`, merge base `5626b3364`, 7 commits on the branch side.
**Files touched**: merge `889906e43`: 8 files from the branch side (`docs/discovery/discovery_2026-09-29_collapsed_render_layer_impact.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_2122_prompt_ir_collapsed_render.md`, `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editor-v2/nodes/__tests__/irCollapsedRender.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useContentSizeDrop.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `889906e43` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5905 tests in 234 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Visual evidence from the lane itself (P-2026-09-29-2122): 7 crops expanded/collapsed/re-expanded/control in light and dark with DOM measures, tests irCollapsedRender and useContentSizeDrop; merge gates green. Dark-mode contrast of the fixture fill is an authoring colour, not a renderer defect. Merge taken over by chat C-2026-09-29-1826 on Alfonso request.
**Notes**: Rollback tag `pre-ir-collapsed-render` on `cf8c031f6` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-2243/result.json`.
**Prompt document name**: 2026-09-29 22:43

## 2026-09-29 — docs(views): discovery, notation catalogue for derived viewpoints, C, A and B (P-2026-09-29-2320)
**Prompt**: `claude_2026-09-29_2320_prompt_discovery_derived_viewpoint_notations.md`, a read-only heavy lane on `~/jjodel-w-notations`, branch `viewpoint-notations`. Inventory the fifteen mockups (five formalisms × generic C, A, B) against the IR and the renderers, plan the binding dialog, measure variant C on the demo and ERD exports, and plan the Phase 2 slices before 2026-10-07.
**Files touched**: this commit: `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` (new, 89 lines), this entry, the Status line of the prompt file. No tracked file under `frontend/`; probes `frontend/scripts/smoke/_tmp_notations_*` gitignored, left on disk.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only; `git status --porcelain` shows only these three paths
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (read-only; the report's §2 is the LIR the Phase 2 §3.1 slices will need)
**Smoke visivo**: non applicabile
**Notes**: Prototype C on 9 metamodels: 39/39 views pass validateIR, control padding:'huge' fails. One docs commit for report, entry and Status as the prompt asks, against the skills' «commit of its own». Four read-only Explore agents; their key citations re-read. The ~370 px width and the grey dot are not found by reading: slice C3 and the C1 visual step measure them in the DOM.
**Prompt document name**: 2026-09-29 23:20

**Ticket** (observations, low, in the report's §1): `freeHandleIndex` (`irEdgeViews.ts:81-91`) is documented as the first free index and returns a count, a candidate cause of arrowheads on one point, not reproduced; `validateIR` does not check `edge.terminations`, so an unknown value (e.g. `hollowCircle`) passes and draws no marker.

## 2026-09-30 — feat(views): the generic structural notation (variant C) derived with no role bound, slice C1 (P-2026-09-29-2350)
**Prompt**: `claude_2026-09-29_2350_prompt_c1_generic_notation.md`, Phase 2 slice C1 of the notation discovery, heavy, on `~/jjodel-w-notations` branch `viewpoint-notations`: variant C as derivation data with no role bound (rules 1-6), tests first, mutation bench, lane probe, R-VP-19.
**Files touched**: code `3ed86119f`: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, its test `derive/__tests__/viewpointDerivation.test.ts`, `frontend/src/utils/deriveViewpoint.ts`. This commit: `docs/decisions.md` (R-VP-19), this entry, the Status line of the prompt file. Probes `frontend/scripts/smoke/_tmp_c1_*` and crops `_tmp_c1_crops/` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `3ed86119f`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; derive file 107 passed (36 red first); full `npx vitest run` 5942 passed, the 9 known files red at import; `npm run build` exit 0, chunk-size warning only. Role-keyed digests pinned on `58aa78ba9`, structure-only pins unchanged. Mutation bench 42/43, the survivor an equivalent mutant.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no §3.1 file: `viewpoint/derive/` is outside `viewpoint/ir/` and `viewpoint/authoring/`)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3071 (light, 1600×1000) 50/50 EXIT=0, crops `frontend/scripts/smoke/_tmp_c1_crops/c1_{sm,petri,esm,flowB,erd}_derived_600.png`
**Notes**: Turnstile box 198 px: the 200 px floor of `.mm-node.mm-object` (`instanceNode.scss:35`), not `irStyle.ts:82`. The session stopped at 00:25 on ENOTFOUND (network) and was resumed; nothing lost. Default canvas: an empty-viewpoint round-trip leaves it byte-identical; any derived viewpoint round-trip re-routes M1 reference edges, the trunk's boxes too; after C it equals the boxes case byte for byte, 5/5.
**Prompt document name**: 2026-09-29 23:50

**Ticket** (observation, low, not a ticket of its own): visiting a derived viewpoint and returning to the default one re-routes some M1 reference edges of the default canvas (DemoPEST `coin`↔`t1`, `push`↔`t2`), with the trunk's own derived boxes as well; an empty viewpoint does not. Not investigated; a candidate for slice C3's edge-port work.

## 2026-09-30 — feat(ir): text and edge-label IR keys for the generic notation, slice C2 (P-2026-09-30-0150)
**Prompt**: `claude_2026-09-30_0150_prompt_c2_ir_keys.md`, Phase 2 slice C2 of the notation discovery, heavy, critical zone `viewpoint/ir/` (LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: five optional IR keys (letterSpacing, textTransform, the attributes exclude, a literal segment style, the edge label template and style), used by the generic notation; R-VP-20.
**Files touched**: code `2360515f4`: `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `IRNodeContent.tsx`, `irEdgeViews.ts`, `edges/UnifiedEdge.tsx`, `EditorV2.scss`, `viewpoint/derive/viewpointDerivation.ts`; tests `ir.test.ts`, `irValidate.test.ts`, `irC2Render.test.ts` (new), `viewpointDerivation.test.ts`. This commit: `docs/discovery/discovery_2026-09-30_c2_ir_keys.md` (new), `docs/decisions.md` (R-VP-20), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `2360515f4`: typecheck exit 2, 14 errors, the §17 set by file and code; vitest 5990 passed (5942 + 48), the 9 known files red at import; build exit 0. Red first on the C1 tip: 44. Absent-case pins measured there. Mutation bench 43/43. Default viewpoint of the four demos pixel-identical to the C1 tip outside the Jodie launcher, 12/12.
**Out-of-scope changes**: no
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs, as the prompt's commit plan says)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3072 (light, 1600×1000) 46/46 EXIT=0, crops `frontend/scripts/smoke/_tmp_c2_crops/c2_{sm,petri,esm,flowB,erd,erdl}_derived_after2_600.png`
**Notes**: IRRow is in the DOVE and untouched (the literal style is the FieldSegment's). Lane choice, Q1 of the report: a template value that resolves empty takes its caption. Byte identity failed only on the Jodie launcher's animated glyph (report §3). One vitest log went to /tmp, moved into the tree at once.
**Prompt document name**: 2026-09-30 01:50

## 2026-09-30 — feat(views): the Derive viewpoint dialog, notation binding and provenance, slice D (P-2026-09-30-0255)
**Prompt**: `claude_2026-09-30_0255_prompt_d_derive_dialog.md`, Phase 2 slice D of the notation discovery, heavy, one §3.1 key (`ir.generated`, LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: «Derive viewpoint» opens a dialog (notation select, metaclass → role table prefilled by the binder), the binding kept in the derived viewpoint's `_state`, `ir.generated` on every view; R-VP-21.
**Files touched**: code `64ea9f216`: new `viewpoint/derive/notations.ts`, `sim/DeriveViewpointDialog.tsx`, `sim/DeriveViewpointDialog.scss`; `App.tsx`, `events/registry.ts`, `TreeViewSidebar/TreeViewContent.tsx`, `utils/deriveViewpoint.ts`, `viewpoint/derive/viewpointDerivation.ts`, `viewpoint/ir/irTypes.ts`, `viewpoint/ir/irDefaults.ts`; tests `notations.test.ts` (new), `DeriveViewpointDialog.test.ts` (new), `viewpointDerivation.test.ts`, `ir.test.ts`. This commit: `docs/discovery/discovery_2026-09-30_d_dialog.md` (new), `docs/decisions.md` (R-VP-21), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `64ea9f216`: typecheck exit 2, 14 errors, the §17 set; vitest 6049 passed (5990 + 59), the 9 known files red at import; build exit 0. Red first on the C2 tip: 9 failed, 2 files at collection. Role-keyed documents equal the pins of `58aa78ba9` through the dialog's default. Default viewpoint of the four demos byte-identical to the C2 tip, 12/12. Mutation bench 44/45, the survivor equivalent.
**Out-of-scope changes**: no — the 14 files are the prompt's DOVE (the dialog next to the dialogs whose shell it shares, `editor-v2/sim/`).
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3074 (light, 1600×1000) 58/58 EXIT=0, crops `frontend/scripts/smoke/_tmp_d_crops/d_{sm,petri,esm,flowB}_dialog_600.png`, `d_sm_dialog_generic_600.png`, `d_sm_derived_{stateMachine,generic}_600.png`
**Notes**: Rule 19: 14 files, listed in report §4 (9). A first probe run (43/58) failed on the probe's own fixture and undo call, not the code; kept as `probe-_tmp_d_probe.run1.log`. Delete-time console warnings measured as pre-existing by a control (report §3). Two questions with Recommended answers in report §0.
**Prompt document name**: 2026-09-30 02:55

## 2026-09-30 — feat(views): Statechart (UML) and Flowchart (ISO 5807) notations, slices A1 and A3 (P-2026-09-30-0355)
**Prompt**: `claude_2026-09-30_0355_prompt_a1_a3_notations.md`, Phase 2 slices A1 and A3 of the notation discovery, heavy, critical zone (LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: two notations beside State machine and Flowchart, two optional IR keys (`shape.entry`, `edge.curve: 'arc'`), the three C3 edge causes fixed for arc edges only, R-VP-22.
**Files touched**: code `74995f429`: `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irEdgeViews.ts`, `IRNodeContent.tsx`, `irStyle.ts`, `edges/UnifiedEdge.tsx`, `utils/edgeUtils.ts`, `viewpoint/derive/viewpointDerivation.ts`, `notations.ts`; tests `irA1Keys.test.ts`, `irA1Render.test.ts` (new), `notations.test.ts`, `DeriveViewpointDialog.test.ts`, `shapeRegistry.test.ts`. This commit: the report, R-VP-22, this entry, the Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (d)
**Regressions**: no — on `74995f429`: typecheck exit 2, 14 errors, the §17 set; vitest 6093 passed (6049 + 44), the 9 known files red at import; build exit 0. Red first on the D tip, pins read there. Mutation bench 46/46.
**Out-of-scope changes**: no — the DOVE files and their tests; two existing tests changed with the list and the CSS (report §1, §4).
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs)
**Smoke visivo**: fallito (probe 15/23 on 3076: 7 are the procedure, rail and bag, read in report §2; 1 is a tip at 1.01 px against ≤ 1) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_a1a3_crops/a1a3_{sm_statechart,sm_stateMachine,flowB_flowchartIso,flowB_flowchart}_600.png`
**Notes**: Rule 19: 15 files, listed in report §4. Default scenes 0 px from the D tip left of the rail (4 of 4). Arrow tips 1.00-1.01 px from the visible border: the wrapper's transparent 1 px border. `stop` crosses `unlocked` on the demo layout; the ISO diamond is content-sized. No Decision role in the catalogue. Detail in `docs/discovery/discovery_2026-09-30_a1_a3_notations.md`.
**Prompt document name**: 2026-09-30 03:55

## 2026-09-30 — feat(views): the ER (Chen) notation and the edge end labels, slice A4 (P-2026-09-30-0440)
**Prompt**: `claude_2026-09-30_0440_prompt_a4_er_chen.md`, Phase 2 slice A4 of the notation discovery, heavy, critical zone (LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: «ER (Chen)» with no simulation profile, its table prefilled by name and structure signals (new `erSignals.ts`), relationship as a diamond node with plain lines, ellipse attributes with the key underlined, two optional IR keys (`edge.labels.sourceEnd` / `targetEnd`), R-VP-23.
**Files touched**: code `7c2593c85`: `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irEdgeViews.ts`, `edges/UnifiedEdge.tsx`, `viewpoint/derive/viewpointDerivation.ts`, `notations.ts`, `erSignals.ts` (new), `sim/DeriveViewpointDialog.tsx`; tests `erChen.test.ts`, `irA4Keys.test.ts`, `irA4Render.test.ts` (new), `notations.test.ts`, `DeriveViewpointDialog.test.ts`. This commit: the report, R-VP-23, this entry, the Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `7c2593c85`: typecheck exit 2, 14 errors, the §17 set; vitest 6144 passed (6093 + 51), the 9 known files red at import; build exit 0. Red first on the tip (36 of 48). The six other notations: 54 digests identical to the tip on fixtures and on the decoded exports. Mutation bench 56/57, the survivor equivalent.
**Out-of-scope changes**: no — the DOVE files and their tests; the dialog changed by type only (report §0 question 2).
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs)
**Smoke visivo**: passato (lane probe 27/27 on 3078, light; the four demo scenes 0 px from the A1+A3 tip left of the rail) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_a4_crops/a4_{erdl,mde}_{erChen,generic}{,_all}_600.png`
**Notes**: Rule 19: 14 files (report §4). MDE ERD's contained attributes keep the C rows (R-VP-23 (5)). The enum is compared by literal name, as the L-proxy backend reads it. The M1 grid placement makes the lines cross (report §0, question 1). Detail in `docs/discovery/discovery_2026-09-30_a4_er_chen.md`.
**Prompt document name**: 2026-09-30 04:40

## 2026-09-30 — feat(views): Petri net (classic) and open arrowheads in the derived notations, slice A2 (P-2026-09-30-1521)
**Prompt**: `claude_2026-09-30_1521_prompt_a2_petri_classic_open_arrows.md`, Phase 1 then Phase 2 in cascade, heavy, critical zone (LIR first, go-ahead), on `~/jjodel-w-notations` branch `viewpoint-notations`: after Alfonso's review of 2026-09-30, «Petri net (classic)» after mockup A beside R-VP-16 with `EdgeTermination 'hollowCircle'`, DemoPetri preselecting it (R-VP-24); open arrowheads in every derived notation (R-VP-25); the ratification line of R-VP-21.
**Files touched**: docs `618e4e958`: the Phase 1 report. Code `f603f28e8` (12 files): `viewpoint/ir/irTypes.ts`, `irValidate.ts`, `edges/UnifiedEdge.tsx`, `viewpoint/authoring/EdgeAuthoringPanel.tsx`, `viewpoint/derive/viewpointDerivation.ts`, `notations.ts`; tests `irValidate.test.ts`, `irA2Render.test.ts` (new), `notations.test.ts`, `viewpointDerivation.test.ts`, `erChen.test.ts`, `DeriveViewpointDialog.test.ts`. This commit: the report's §6, `docs/decisions.md` (R-VP-24, R-VP-25, the R-VP-21 line), this entry and two tickets, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `f603f28e8`: typecheck exit 2, 14 errors, the §17 set; vitest 6173 (6144 + 29), the 9 known files red at import and 4 hook tests red from the lane's go-ahead variable (70/70 unset, ticket of P-2026-09-29-2122); build exit 0. Red first: 39 of 297. Moved pins predicted on `2cde09984`'s code, 25/25 equal. Mutation bench 36/36.
**Out-of-scope changes**: no — the 12 files of `f603f28e8` are the prompt's DOVE and their tests; `irCompile`, `irEdgeViews` and `DeriveViewpointDialog.tsx` needed no change.
**Layer Impact Report**: produced (report §1, committed in `618e4e958` before the first source edit)
**Smoke visivo**: passato (lane probe 29/31 on 3081, light: the four demo scenes byte-identical to the A4 tip's shots; the 2 FAIL are the default scenes after a derived-viewpoint round trip, the size ticket below) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_a2_crops/a2_{petri_classic,petri_rvp16,sm_statechart,flowB_flowchartIso,esm_generic}_600.png`
**Notes**: The bar draws 24×44, not 10×44: `defaultSize` is floored at 24 (ticket). DemoPEST and DemoFlowB still open on State machine and Flowchart (R-VP-22), not on the notations the demo uses: awaiting Alfonso (report §0). The panel's «Hollow circle» option has no executed test (monaco in the bench). Two logs went to `/tmp`, moved into the tree (report §6). Report, rows, entry and Status in one docs commit, as the prompt asks.
**Prompt document name**: 2026-09-30 15:21

## 2026-09-30 — ticket: a derived viewpoint's node size outlives it on the default canvas
**Ticket**: After a derived viewpoint is shown and the default viewpoint is activated again, the M1 nodes keep the size the derived view's size hook wrote on the React Flow node: DemoPetri's places 66×66 (the R-VP-16 circle) instead of 200×78, DemoFlowB's `d1` 54×66 (the ISO diamond) instead of 200×50; positions, edges and markers unchanged. Measured on 3081 by the A2 probe; both notations predate A2, which changes only their arrowhead. `useContentDrivenSize` (`useContentSize.ts`) drops its size only while its IRNodeContent is mounted, which the default view is not. Visible in the demo when a presenter derives a viewpoint and goes back.
**Priority**: high
**Found in**: P-2026-09-30-1521
**Detail**: docs/discovery/discovery_2026-09-30_a2_petri_classic_open_arrows.md

## 2026-09-30 — ticket: the classic Petri bar draws 24 px wide, the defaultSize floor
**Ticket**: «Petri net (classic)» writes `defaultSize: { width: 10, height: 44 }` on the transition bar (mockup A); `defaultBoxFor` (`nodes/nodeSizing.ts:73`) floors every authored axis at `SHAPE_MIN_SIZE` (24), so the bar draws 24×44 (visible 22×42). A per-form floor (the bar: none) is one line in a file outside A2's DOVE; the IR has no orientation, so every classic bar is upright.
**Priority**: medium
**Found in**: P-2026-09-30-1521
**Detail**: docs/discovery/discovery_2026-09-30_a2_petri_classic_open_arrows.md

## 2026-09-30 — feat(views): the Activity (UML) notation, DemoFlowB and DemoPEST preselection (P-2026-09-30-1552)
**Prompt**: `claude_2026-09-30_1552_prompt_activity_uml_notation.md`, Phase 1 then Phase 2 in cascade, heavy, critical zone possible (LIR first, go-ahead), on `~/jjodel-w-notations` branch `viewpoint-notations`: after Alfonso's review of DemoFlowB, «Activity (UML)» beside the flowcharts (initial dot, rounded action, hollow diamond, bar, bull's-eye, `[guard]`), DemoFlowB opening on it and DemoPEST on Statechart (UML), R-VP-26.
**Files touched**: docs `e63ea6d73`: the Phase 1 report. Code `ca3e41a92` (6 files): `viewpoint/derive/notations.ts`, `viewpointDerivation.ts`; tests `activityUml.test.ts` (new), `notations.test.ts`, `erChen.test.ts`, `sim/__tests__/DeriveViewpointDialog.test.ts`. This commit: the report's §6, `docs/decisions.md` (R-VP-26), this entry and two tickets, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no — on `ca3e41a92`: typecheck exit 2, 14 errors, the §17 set; vitest 6201 (6173 + 28), the 9 known files red at import and 4 hook tests red from the lane's go-ahead variable (70/70 unset); build exit 0. Red first: 35 of 260. The eight other notations: 72/72 lists on the exports identical to the A2 tip. Mutation bench 44/45, the survivor equivalent.
**Out-of-scope changes**: no — the two source files and their tests, in the prompt's DOVE; no IR file, no dialog source.
**Layer Impact Report**: produced (report §1, committed in `e63ea6d73` before the first source edit)
**Smoke visivo**: passato (lane probe 22/22 on 3084, light: the four demo scenes byte-identical to the A2 tip's shots) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_actuml_crops/actuml_flowB_{activityUml,flowchartIso}_600.png`, close-ups `actuml_flowB_activityUml_{decision,bars}.png`
**Notes**: Partial because three sizes miss the spec by render floors outside the DOVE: the bar draws 24×120 (5 asked), the initial 24 (20), the bull's-eye's disc is the registry dot (≈7 px, 14 asked); radius 14 draws 10.5. The two guard labels overlap 796 px² (router). No new IR key. One scratch file went to `/tmp`, deleted (report §6). Detail in `docs/discovery/discovery_2026-09-30_activity_uml_notation.md`.
**Prompt document name**: 2026-09-30 15:52

## 2026-09-30 — ticket: Activity (UML) sizes held by render floors outside the notation
**Ticket**: «Activity (UML)» writes the specified sizes; three draw otherwise. `defaultBoxFor` (`nodes/nodeSizing.ts:73`) floors every authored `defaultSize` axis at `SHAPE_MIN_SIZE` (24): the fork/join bar 5×120 draws 24×120 (visible 22×118, a slab, what Alfonso called «i join sono quelli delle reti di petri»), the initial 20 draws 24. The bull's-eye's inner disc is the registry `dot` (radius 16 of 100, `markerRegistry.ts:83`), about 7 px in a 24 px circle where the mockup has 14. A per-form floor (the bar none, a circle 12) is one line and also fixes the classic Petri bar (the A2 ticket); a larger disc is one registry row. Both change what the demo shows: Alfonso decides (RC-26).
**Priority**: high
**Found in**: P-2026-09-30-1552
**Detail**: docs/discovery/discovery_2026-09-30_activity_uml_notation.md

## 2026-09-30 — ticket: DemoFlowB's two guard labels overlap in Activity (UML)
**Ticket**: Derived as «Activity (UML)» on the demo layout, `[model.[count] < 2]` and `[model.[count] >= 2]` overlap by 796 px², both between `work` and `d1`, where the orthogonal router runs `f3` and the first leg of `f4` side by side around the 36 px diamond (read on the crop). The notation writes the labels right; their placement is the router's. For the layout lane after the freeze, or a label offset per parallel segment.
**Priority**: medium
**Found in**: P-2026-09-30-1552
**Detail**: docs/discovery/discovery_2026-09-30_activity_uml_notation.md

## 2026-09-30 — fix(views): declared sizes unfloored, radius clamp at half, dot-large (P-2026-09-30-1720)
**Prompt**: `claude_2026-09-30_1720_prompt_activity_sizes.md`, Phase 1 and 2 in cascade on `viewpoint-notations`. The three limits the Activity (UML) lane left (R-VP-26): the 24 px floor on declared sizes, the bull's-eye disc, the radius clamp at a quarter.
**Files touched**: report `b65be5594` + §6 in this commit: `docs/discovery/discovery_2026-09-30_activity_sizes.md`. Code `3805796be`: `nodes/nodeSizing.ts`, `viewpoint/ir/shapeRegistry.ts`, `viewpoint/ir/markerRegistry.ts`, their three tests. This commit: the report, this entry, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: 2026-09-30 15:52 claude_2026-09-30_1552_prompt_activity_uml_notation.md
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no — nine files, all in the DOVE: the six of `3805796be`, the report, `docs/log-inbox/views.md`, the prompt file.
**Layer Impact Report**: produced
**Smoke visivo**: lane probe on 3087 19/19, light; the visual GO is the chat's (pending)
**Notes**: Typecheck the known 14; vitest 6209/6213, the 9 known files and 4 criticalZone from the go-ahead variable (70/70 unset); build exit 0; bench 16/16. Partial: the Activity final still names `dot` (6.4 px disc): `dot-large` measured 14 px in session, the switch is `viewpointDerivation.ts:837`, outside the DOVE, asked. Default scenes 0 px from 21345bbba.
**Prompt document name**: 2026-09-30 17:20

**Ticket** (observations, low): (1) the bar paints 3 px at the declared 5: the wrapper's transparent 1 px each side, as every IR node; a painted 5 is `defaultSize` 7. (2) Flows stop 5 px short of every symbol (the router's end offset), more visible on the thin bars. (3) `viewpointDerivation.ts:768`, `:775-777`, `:871-873` still describe the 24 px floor.
