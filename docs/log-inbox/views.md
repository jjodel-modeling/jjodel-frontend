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

## 2026-09-29 — docs(views): discovery, IR authoring freezes, collapsed graphVertex, StructureSpec (P-2026-09-29-1935)
**Prompt**: `claude_2026-09-29_1935_prompt_discovery_ir_authoring_freeze.md`, read-only discovery, heavy tier, branch `ir-freeze-disc` in `~/jjodel-w-irfreeze`: explain the four tab freezes of chat C-2026-09-29-1840, the ignored `collapsed.form`/`badge`, the inert `StructureSpec`, and two side findings; Phase 2 plan.
**Files touched**: this commit: `docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md` (new), this entry, the Status line of the prompt file. No tracked file under `frontend/`; probes `frontend/scripts/smoke/_tmp_irfreeze_*` and `_tmp_lane_vite_3056.config.ts` gitignored, left on disk.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only; `git status --porcelain` empty before and after the probes; Vite on 3056 started from this tree and stopped by this session.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (read-only; no critical-zone file read or edited)
**Smoke visivo**: non applicabile
**Notes**: Freeze not reproduced (28 replays of a-d, 21 live rewrites, 3 reloads: 0). A nested L-proxy in `ir` (unguarded, `action.ts:321`) pins the renderer: Cmd+S unresponsive 5.5-232.7 s, id control fine. Points 2 and 3 are missing renderers, measured per contrasto. Side finding 1 confirmed: Cmd+S saves Navbar's stale `LProject`, dropping a new viewpoint. Headless never reports `hidden`, so the timeout arm is void.
**Prompt document name**: 2026-09-29 19:35

## 2026-09-30 — merge: ir-freeze-disc into alfonso-frontend-jjtl (P-2026-09-30-1104)
**Prompt**: `claude_2026-09-30_1104_prompt_merge_ir-freeze-disc.md`, a direct merge by `lane-run merge --direct`, no session: `ir-freeze-disc` into `alfonso-frontend-jjtl`; the worker stopped `blocked` on one red vitest gate and left the merge commit `d8f7be824`; closed by hand by the chat (P9).
**Files touched**: merge `d8f7be824` from the branch side (`docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md`, the discovery prompt, its entry in this inbox, union-resolved); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d8f7be824` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5905 tests in 234 files, 9 red at import, 8 failed, all in harness script tests (`scripts/hooks/__tests__/laneRun.test.ts`, `laneRunDirect.test.ts`, `bashGuard.test.ts`, `scripts/gates/__tests__/check-addonly.test.ts`, `docsDigest.test.ts`, `traceIndex.test.ts`), 3 of them already red on the receiving tip before the merge; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0. Re-run on `d8f7be824` at 15:04-15:07 with load average 3-5: the six files alone 352 tests, 0 failed; the full suite 5905 tests, 0 failed, the 9 known files red at import (`window is not defined`). The red gate was load-induced.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs only)
**Notes**: Rollback tag `pre-ir-freeze-disc` (RC-31). Worker and gates: `~/.jjodel-lanes/P-2026-09-30-1104/result.json`. Ticket, second occurrence after P-2026-09-29-1239 and despite the vitest-timeout lane: the harness script tests still time out under load in the merge gate; run `scripts/**/__tests__` serially or with a longer timeout in the gate worker.
**Prompt document name**: 2026-09-30 11:04

## 2026-09-30 — docs(views): slice C3, IR edge ports, closed without code (P-2026-09-29-2351)
**Prompt**: `claude_2026-09-29_2351_prompt_c3_ir_edge_ports.md`, Phase 2 slice C3 on `~/jjodel-w-irports` branch `ir-edge-ports`: reproduce rows 11-12 of discovery `ee7206d0c` (arrowheads on one point of `locked`, a grey dot on `off`) on a derived turnstile, and fix `freeHandleIndex` to the first free index with the per-side cap only if the reproduction confirms the hypothesis.
**Files touched**: `f83d6bc81`: `docs/discovery/discovery_2026-09-29_ir_edge_ports.md` (new). This commit: the report's §0 resolution, the Status line of the prompt file, this entry and one ticket. No file under `frontend/` tracked by git; probes `frontend/scripts/smoke/_tmp_irports_*` gitignored, left on disk.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only; `git status --porcelain` clean before and after the probes; vite on 3061 started and stopped by `lane-run probe`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no diff written; the report §5 records the one the follow-up owes)
**Smoke visivo**: non applicabile
**Notes**: DOM probe on 3061 (derived turnstile, light, DPR 2) and a headless `assignGeometricHandles` agree: 5 distinct handles, max index 2, 5 edges drawn, no coincident arrowheads. Seen instead: the self-loop drawn on the bounding-box corner beside the start of `stop`, its two untouched handles, the 8 px snap leaving the hovered anchor 3.9 px off the arrow tip. Chat decision (RC-21): no code, a ticket, those causes to slice A1.
**Prompt document name**: 2026-09-29 23:51

## 2026-09-30 — ticket: freeHandleIndex returns a count, not the first free index, and has no per-side cap
**Ticket**: `freeHandleIndex` (`irEdgeViews.ts:82-91`) is documented «First free handle index for (node, side, role)» but returns how many handles on that side are taken. With a hole in the taken indices it returns a taken one: synthetic control, one assigned edge on `off.left-1` only, `freeHandleIndex('off', 'left', 'target', …) = 1` where the first free index is 0, so two edges share an anchor. It has no cap: five edges on one (node, side, role) get `right-4/left-4` (control `CAP fifth edge`), while DynamicHandles renders indices 0..3 (`MAX_HANDLES_PER_SIDE = 4`, `portDistribution.ts:520`) and xyflow drops an edge whose handle is missing (error 008). Read, not measured: anchor overrides (the reconnect gesture) and `decorateEdges` (`irContainment.ts:328`, counting over a partial `out`) can reach it. The derived turnstile does not: 5 distinct handles, max index 2. Fix when a scene shows it: first free index, capped, a §3.1 edit with its Layer Impact Report.
**Priority**: low
**Found in**: P-2026-09-29-2351
**Detail**: docs/discovery/discovery_2026-09-29_ir_edge_ports.md (§1 H1-H2, §2)

## 2026-09-30 — merge: ir-edge-ports into alfonso-frontend-jjtl (P-2026-09-30-1509)
**Prompt**: `claude_2026-09-30_1509_prompt_merge_ir-edge-ports.md`, a direct merge by `lane-run merge --direct`, no session: `ir-edge-ports` at `fb8944688` into `alfonso-frontend-jjtl`, merge base `62f4ac3fc`, 3 commits on the branch side.
**Files touched**: merge `e7dec63bb`: 3 files from the branch side (`docs/discovery/discovery_2026-09-29_ir_edge_ports.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-29_2351_prompt_c3_ir_edge_ports.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e7dec63bb` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5905 tests in 234 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only, the C3 ir-edge-ports discovery (hypothesis falsified); no code, 8 gates green on e7dec63bb; GO by the chat C-2026-09-30 release-3.1
**Notes**: Rollback tag `pre-ir-edge-ports` on `cab8a535d` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-1509/result.json`.
**Prompt document name**: 2026-09-30 15:09

## 2026-09-30 — fix(ir): the derived size goes back when its node leaves the IR view (P-2026-09-30-1625)
**Prompt**: `claude_2026-09-30_1625_prompt_derived_size_leak.md`, Phase 1 then 2 in cascade on `~/jjodel-w-sizeleak` branch `derived-size-leak` (RC-30 go-ahead). A2's finding: after a derived viewpoint, back in the default one, nodes kept the derived size. Reproduce on the trunk with R-VP-16 Petri, find the cause, fix without touching what is persisted.
**Files touched**: docs `580f75377`: `docs/discovery/discovery_2026-09-30_derived_size_leak.md` (new, Layer Impact Report §6). Code `92d0d5f0a`: `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (unmount-only cleanup, `store` import), `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useContentSizeUnmount.test.ts` (new). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `92d0d5f0a`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; `npx vitest run` 5907 passed, 4 failed, 11 files red: the 9 known at import, `criticalZone.test.ts` (4, reads this session's RC-30 variable; 70/70 with it unset), `irCollapsedRender.test.ts` (`afterAll` Chromium close timed out under load; 13/13 alone); `npm run build` exit 0. Mutation bench 9/9 killed (commit body).
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: pending — chat, RC-23; lane probe on 3081 (light): 12/17 on `ee5cd0792`, the 5 reds the leak, 22/22 after; the four demo scenes 0 px left of the rail; crops `frontend/scripts/smoke/_tmp_sizeleak_crops/sl_{before,after}_*_600.png`
**Notes**: Cause: `useContentDrivenSize` gave the size back only while mounted; the sync never sees a derived size. Adopted as recommended (RC-21), report §0: Q1 option A, Q2 the isResized read in the cleanup, Q3 no ISO-diamond check here. Native object cards mount no resizer, so the default-layout hand size is written as data (`syncSizeToJjom`). Not in `decisions.md`: outside this lane's DOVE.
**Prompt document name**: 2026-09-30 16:25

**Ticket** (low, two observations, not tickets of their own): (1) `scripts/hooks/__tests__/criticalZone.test.ts` reads `JJODEL_CRITICAL_ZONE_GOAHEAD` from the environment, so the full suite run inside a lane launched with the RC-30 go-ahead shows four false reds; the test could unset it. (2) `irCollapsedRender.test.ts`'s `afterAll` (`browser.close()`) has the 10 s default hook timeout, exceeded once under the full suite's load.

## 2026-09-30 — merge: derived-size-leak into alfonso-frontend-jjtl (P-2026-09-30-1658)
**Prompt**: `claude_2026-09-30_1658_prompt_merge_derived-size-leak.md`, a direct merge by `lane-run merge --direct`, no session: `derived-size-leak` at `345759408` into `alfonso-frontend-jjtl`, merge base `ecbc0e92c`, 4 commits on the branch side.
**Files touched**: merge `f031d4948`: 5 files from the branch side (`docs/discovery/discovery_2026-09-30_derived_size_leak.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_1625_prompt_derived_size_leak.md`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useContentSizeUnmount.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f031d4948` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5930 tests in 237 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: derived size released on unmount; lane probe 3081 22/22, DemoPetri p1 p3 and DemoFlowB i0 fin back to 200x78 and 200x50 in default; hand sizes kept; four demo scenes 0 px; 8 gates green on f031d4948; GO by the chat C-2026-09-30-1458, unattended
**Notes**: Rollback tag `pre-derived-size-leak` on `f43fe429e` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-1658/result.json`.
**Prompt document name**: 2026-09-30 16:58

## 2026-09-30 — fix(editor-v2): an M1 edge delete removes the link, not the reference (P-2026-09-30-1542)
**Prompt**: `claude_2026-09-30_1542_prompt_reference_delete.md`, Phase 1 then 2 in cascade, critical zone with the RC-30 go-ahead. Alfonso: «le reference (edge) non si riescono a cancellare». Matrix of delete paths × levels, bisect, fix in one undo step.
**Files touched**: `024ded72f` report `docs/discovery/discovery_2026-09-30_reference_delete.md`. `c820dbb51` `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`deleteM1Link`, called in `syncDeleteEdge`), `frontend/src/components/editor-v2/sync/__tests__/syncDeleteEdge.test.ts` (new). This commit: report addendum §8, this entry, two tickets, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. tsc 14 (the baseline set); vitest 5915 passed, the 9 known red at import, 4 `criticalZone.test.ts` red from this session's `JJODEL_CRITICAL_ZONE_GOAHEAD` (70/70 unset); build exit 0; syncDeleteEdge 14/14, bench 12/12 killed; M2 matrix identical before and after; four demo scenes 8/8 readings identical.
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato — probe, unattended: M1 matrix 24/25 (the rail's untouched undo), DemoPEST 5/5, bisect oracle GOOD, crops `_tmp_refdelete_crops/`; GO by the chat C-2026-09-30-1458 on the lane probe (RC-23)
**Notes**: The four M1 canvas paths deleted the metaclass DReference (`syncDeleteEdge` read the edge's `model`); on loaded projects the other links stayed as unselectable ghosts. Bisect: `3.0.0` and `1b40eacd0` BAD, no first bad commit in range; by reading, since `75fe8f2f5`, with `964344aff` and `91a0e89c8` giving M1 edges the DReference as `model`. Q1, Q2, Q5 adopted as recommended: the `decisions.md` record is the chat's.
**Prompt document name**: 2026-09-30 15:42

**Ticket** (P-2026-09-30-1542, low): the reference's tree row and the Properties rail offer no delete (`TreeViewContent.tsx:1289`, `Info.tsx:1769`); the rail × on an M1 link undoes to the edge without the slot value; a selected edge's segment handle can cover a sibling's label (3 parallel references, `lab2`). Report §2, §5.3.

## 2026-09-30 — ticket: an M2 edge delete is not undoable in one step, and the undo leaves a partial DEdge
**Ticket**: select + Delete (or Backspace, toolbar) on an M2 reference: the delete's delta carries `edges`, which forces a merge into the select step (`reducer.ts:1211`), and `U.objectMergeInPlace` is first-wins on `idlookup` (`U.tsx:896-905`), so one Cmd+Z restores nothing and leaves `idlookup[edge] = {clonedCounter, pointedBy, isSelected}` with `state.edges` and `state.references` listing both ids. Core (Rule 5): needs Alfonso's approval for a reducer lane.
**Priority**: medium
**Found in**: P-2026-09-30-1542
**Detail**: docs/discovery/discovery_2026-09-30_reference_delete.md

## 2026-09-30 — ticket: a deleted edge stays in graph.subElements on a loaded project, ghost edges on M1 canvases
**Ticket**: deleting an M2 reference while its model's canvas is mounted (DemoPEST, `nextState`) leaves the 5 M1 DEdge ids in the graph's `subElements` after they left `idlookup`: `useJjomSync.ts:1310-1315` never evicts them, 5 RF edges stay, not selectable, not deletable. `Dummy.get_delete` removes an edge from `subElements` only through `pointedBy` (`Dummy.ts:205-225`), absent on loaded edges. Core: an edge father net in `get_delete`, the R-DEL-4 shape.
**Priority**: medium
**Found in**: P-2026-09-30-1542
**Detail**: docs/discovery/discovery_2026-09-30_reference_delete.md

## 2026-09-30 — merge: reference-delete into alfonso-frontend-jjtl (P-2026-09-30-1736)
**Prompt**: `claude_2026-09-30_1736_prompt_merge_reference-delete.md`, a direct merge by `lane-run merge --direct`, no session: `reference-delete` at `e6c1f452a` into `alfonso-frontend-jjtl`, merge base `ecbc0e92c`, 4 commits on the branch side.
**Files touched**: merge `6ecf05100`: 5 files from the branch side (`docs/discovery/discovery_2026-09-30_reference_delete.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_1542_prompt_reference_delete.md`, `frontend/src/components/editor-v2/sync/__tests__/syncDeleteEdge.test.ts`, `frontend/src/components/editor-v2/sync/canvasToJjom.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6ecf05100` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5944 tests in 238 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: M1 link delete fix c820dbb51 (canvasToJjom deleteM1Link), 14 tests, mutation 12/12, 8 gates green on 6ecf05100; GO by the chat C-2026-09-30-1458, unattended under the critical-zone standing go-ahead
**Notes**: Rollback tag `pre-reference-delete` on `c6243eed9` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-1736/result.json`.
**Prompt document name**: 2026-09-30 17:36

## 2026-09-30 — feat(views): viewpoint option «Color by metaclass», palette, text contrast, border on/off (P-2026-09-30-1815)
**Prompt**: `claude_2026-09-30_1815_prompt_viewpoint_metaclass_colors.md`, Phase 1 then 2 in cascade on `~/jjodel-w-vpcolor` branch `viewpoint-metaclass-colors` (RC-30 go-ahead). A switch in the viewpoint panel, with Base color and Border; M1 object nodes filled per metaclass from a palette of the base, black or white text by contrast, border shade or none.
**Files touched**: docs `c29280962`: `docs/discovery/discovery_2026-09-30_viewpoint_metaclass_colors.md` (new, Layer Impact Report §6). Code `fa0b20de1`: `frontend/src/view/viewPoint/metaclassPalette.ts` (new), `frontend/src/view/viewPoint/__tests__/metaclassPalette.test.ts` (new), `frontend/src/view/viewElement/view.tsx` (optional field), `ViewpointProperties.tsx`, `properties.scss`, `editor-v2/nodes/ObjectNode.tsx`, `editor-v2/viewpoint/ir/IRNodeContent.tsx`. This commit: `docs/decisions.md` (R-VP-27..31), this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `fa0b20de1`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; `npx vitest run` (GOAHEAD unset) 5974 passed, 0 failed, the 9 known files red at import; `npm run build` exit 0. metaclassPalette 30/30; mutation bench 29/31 killed (commit body). Lane probe on 3091, light: 51/51, the four demo scenes 0 px from the before run on the untouched tree.
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: pending — chat, RC-23; lane probe on 3091 (light) 51/51: DemoESM native and DemoFlowB derived (IR), toggle off/on/#f59e0b/border off, fill, text, stroke per node against the resolver, boxes 0 px, toggle off 0 px; crops `frontend/scripts/smoke/_tmp_vpcolor_crops/vpc_after_*_600.png`
**Notes**: «Fresh viewpoint» tested on a fixture: `Constructors` does not import under vitest (`window is not defined`); the probe runs the live save serializer, JSON.parse and VersionFixer.update. RC-27 second agent: HOLDS (R-VP-28). A selected white-text native node reads its name 1.11:1 on the untouched #e0f7fa selection header (R-VP-30, for the GO). Scratch files in /tmp (gate outputs).
**Prompt document name**: 2026-09-30 18:15

## 2026-09-30 — fix(editor-v2): the selection ring of an IR node is no longer clipped (P-2026-09-30-1808)
**Prompt**: `claude_2026-09-30_1808_prompt_selection_outline.md`, fast lane, Phase 1 then Phase 2 in cascade, on `~/jjodel-w-selring` branch `selection-outline`. A selected IR-rendered node (DemoFlowB `work`, derived viewpoint) showed its handles but no selection outline, only a faint halo.
**Files touched**: report `ca2cfb8a8`: `docs/discovery/discovery_2026-09-30_selection_outline.md`. Code `27a6b2d69`: `frontend/src/components/editor-v2/nodes/instanceNode.scss` (one rule), `frontend/src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts` (new). This commit: this entry, the report's addendum, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `27a6b2d69`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run` 5949 passed, 0 failed, the 9 §17 files red at import; `npm run build` exit 0. Test red 2/5 before the rule, 5/5 after; mutation bench 5/5 killed (commit body). Probe on 3083, light: 24/24, the unselected panes 0 px from the `before` run on `c4846df0e`, node box 0 px.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no §3.1 or §3.2 file touched; `irStyle.ts` read, not edited)
**Smoke visivo**: pending — chat (RC-23); lane probe 24/24, crops in `frontend/scripts/smoke/_tmp_selring_crops/` (gitignored)
**Notes**: Root cause: `instanceNode.scss:27` (`overflow: hidden`) clipped the ring `irStyle.ts:149` draws outside `.ir-node-content`. Adopted unattended (RC-21, report §0): the IR ring takes the class card token, `rgba(56,189,248,0.55)`, not `#0ea5e9`, which no native node paints; moving the token is Alfonso's call. Closes the 2026-09-29 ticket «IR selection ring reads clipped by the node wrapper».
**Prompt document name**: 2026-09-30 18:08

**Ticket** (low, not a ticket of its own): `irStyle.ts:165` (`.mm-node.drop-target > .ir-node-content`) never applies on the canvas, because only `ClassNode.tsx:478` and `EnumNode.tsx:154` emit `drop-target`, and neither mounts `.ir-node-content`. Left in place (Rule 9).

## 2026-09-30 — merge: selection-outline into alfonso-frontend-jjtl (P-2026-09-30-1846)
**Prompt**: `claude_2026-09-30_1846_prompt_merge_selection-outline.md`, a direct merge by `lane-run merge --direct`, no session: `selection-outline` at `a5c9d905f` into `alfonso-frontend-jjtl`, merge base `c1e0376dc`, 5 commits on the branch side.
**Files touched**: merge `7614e7e10`: 5 files from the branch side (`docs/discovery/discovery_2026-09-30_selection_outline.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_1808_prompt_selection_outline.md`, `frontend/src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts`, `frontend/src/components/editor-v2/nodes/instanceNode.scss`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7614e7e10` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5949 tests in 239 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on the lane crops: IR ring painted cyan, box 0 px; Alfonso authorised the merge (fondi)
**Notes**: Rollback tag `pre-selection-outline` on `c1e0376dc` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-1846/result.json`.
**Prompt document name**: 2026-09-30 18:46

## 2026-09-30 — feat(views): «Color by metaclass» rework, analogous palette, coloured selected header (P-2026-09-30-1815)
**Prompt**: resumed lane P-2026-09-30-1815, rework after the hard stop (Alfonso accepted the chat's recommendations, 19:20): merge the trunk (selection-outline), an analogous palette instead of the golden angle, a selected coloured native node keeping its fill, the rows renumbered R-VP-19..23 to R-VP-27..31.
**Files touched**: merge `c76656bbc` (trunk `45ff6c290`; union in `docs/log-inbox/views.md`). Code `390bcaddd`: `frontend/src/view/viewPoint/metaclassPalette.ts`, its test, and the R-VP comments of `ObjectNode.tsx`, `IRNodeContent.tsx`, `ViewpointProperties.tsx`, `properties.scss`, `view.tsx`. `ce5e70027`: this lane's first entry, three references (`Log-Repair`). This commit: `docs/decisions.md` (R-VP-27..31), the report's addendum, this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-30 18:15
**Causa**: (a)
**Regressions**: no — on `390bcaddd`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set; `npx vitest run` (GOAHEAD unset) 5982 passed, the 9 known files red at import; `npm run build` exit 0. metaclassPalette 33/33; mutation bench 37/38 (the unreachable tie). Lane probe 3091, light, 57/57; the four demo scenes identical bytes to the trunk tip `45ff6c290`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (the §6 report of the first pass covers `IRNodeContent.tsx`; this pass changes only its comment)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3091 (light) 57/57: palette with #0ea5e9 and #f59e0b on DemoESM and DemoFlowB, selected white-text node 7.54:1 on its fill, option off 0 px from the trunk tip; crops `frontend/scripts/smoke/_tmp_vpcolor_crops/vpc_after2_*_600.png`
**Notes**: The 15° floor on the palette step is this lane's (R-VP-29): at count 10 the literal 13.3° gave neighbours ΔE76 7.4 apart at equal lightness. The trunk-tip baseline ran on `45ff6c290`'s five files checked out in this tree and restored from HEAD; the tree was clean after. Causa (a): the palette rule was respecified after the first review.
**Prompt document name**: 2026-09-30 18:15

## 2026-09-30 — merge: viewpoint-metaclass-colors into alfonso-frontend-jjtl (P-2026-09-30-2000)
**Prompt**: `claude_2026-09-30_2000_prompt_merge_viewpoint-metaclass-colors.md`, a direct merge by `lane-run merge --direct`, no session: `viewpoint-metaclass-colors` at `728291b21` into `alfonso-frontend-jjtl`, merge base `45ff6c290`, 8 commits on the branch side.
**Files touched**: merge `524bdd3f1`: 11 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-30_viewpoint_metaclass_colors.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_1815_prompt_viewpoint_metaclass_colors.md`, `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`, `frontend/src/components/editors/viewpoint/properties/properties.scss`, and 3 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `524bdd3f1` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5982 tests in 240 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat verification: lane probe 57/57 on 3091, text contrast 5.15-12.19, selected white-text node 7.54:1, 0 px with coloring off, node boxes 0 px, four demo scenes byte-identical to 45ff6c290; GO by Alfonso (ok alle raccomandazioni, 19:24)
**Notes**: Rollback tag `pre-viewpoint-metaclass-colors` on `45ff6c290` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-2000/result.json`.
**Prompt document name**: 2026-09-30 20:00

## 2026-09-30 — fix(editor-v2): an edge click shows the element the edge represents (P-2026-09-30-1940)
**Prompt**: `claude_2026-09-30_1940_prompt_edge_click_properties.md`, full lane, Phase 1 then Phase 2 in cascade on `~/jjodel-w-edgesel` branch `edge-click-properties`. Clicking a canvas edge must show in Properties the reference, the reference slot or the object-as-edge the edge represents, on M2 and M1, native and IR views.
**Files touched**: report `371804cf0`: `docs/discovery/discovery_2026-09-30_edge_click_properties.md`. Code `bb0fd90c9`: `frontend/src/components/editor-v2/utils/edgeSelectionTarget.ts` (new), `utils/__tests__/edgeSelectionTarget.test.ts` (new), `hooks/useJjomSelection.ts`, `EditorV2.tsx` (2 lines). This commit: `docs/decisions.md` (R-ESEL-1..5), this entry and ticket, the report's addendum, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `bb0fd90c9`: typecheck exit 2, 14 errors, the §17 set by file and code, same as before the change; vitest 5960 passed, the 9 §17 files red at import, plus 4 `criticalZone.test.ts` (this session's `JJODEL_CRITICAL_ZONE_GOAHEAD`) and 2 Chromium `beforeAll` timeouts, 88/88 in isolation with the variable unset; build exit 0. Tests 15, red before the module, green after; mutation bench 12/12 killed. Probe on 3097 (light) 50/51; four demo scenes 8/8 panes 0 px from the `before` run; node and pane click Properties text identical before and after.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no §3.1 file touched; the selection TRANSACTION holds no creator and none is added)
**Smoke visivo**: pending — chat (RC-23); lane probe 50/51, crops in `frontend/scripts/smoke/_tmp_edgesel_crops/es_after_*_600.png` (gitignored)
**Notes**: Before: M1 reference and composition edges showed the metamodel's DReference, object-as-edges left the previous selection. After: the M1 slot (DValue), the object. The one probe red is the gesture, not the code: t1's visible line in derived demoSM lies under a sibling's 20 px hit path for its whole length (no point, as in the `before` run); the native object-as-edge route is covered by f2. Decisions R-ESEL-1..5 adopted unattended (RC-25).
**Prompt document name**: 2026-09-30 19:40

## 2026-09-30 — ticket: an inheritance edge click shows the empty panel, a lifted edge click shows nothing
**Ticket**: After R-ESEL-2 an inheritance edge still writes `_lastSelected.modelElement = ''` (the DEdge has no `model`) and the Properties panel reads «No element selected»; an IR-lifted edge `<id>__irlift` (collapsed container) has no D-object behind it and a click changes nothing. Options: inheritance → the subclass (its INHERITANCE section); lifted → the slot of the original source (`data.irSourceObjectId`), first of a deduplicated bundle. Also: an M1 edge is pair-keyed, so two references of one object to the same target show the first slot.
**Priority**: low
**Found in**: P-2026-09-30-1940
**Detail**: docs/discovery/discovery_2026-09-30_edge_click_properties.md

## 2026-09-30 — merge: edge-click-properties into alfonso-frontend-jjtl (P-2026-09-30-2105)
**Prompt**: `claude_2026-09-30_2105_prompt_merge_edge-click-properties.md`, a direct merge by `lane-run merge --direct`, no session: `edge-click-properties` at `1079a9740` into `alfonso-frontend-jjtl`, merge base `45ff6c290`, 4 commits on the branch side.
**Files touched**: merge `35d8c8e89`: 8 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-30_edge_click_properties.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_1940_prompt_edge_click_properties.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/hooks/useJjomSelection.ts`, `frontend/src/components/editor-v2/utils/__tests__/edgeSelectionTarget.test.ts`, `frontend/src/components/editor-v2/utils/edgeSelectionTarget.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `35d8c8e89` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5997 tests in 241 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on lane 1940 DOM measures: M1 ref click shows DValue slot, object-as-edge shows DObject, M2 ref unchanged, 4 demo scenes 0 px; merge gates green
**Notes**: Rollback tag `pre-edge-click-properties` on `31999a630` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-2105/result.json`.
**Prompt document name**: 2026-09-30 21:05

## 2026-09-30 — fix(loader): the save overlay covers the Properties rail (P-2026-09-30-2025)
**Prompt**: `claude_2026-09-30_2025_prompt_loader_over_rail.md`, fast lane, measure then fix, on `~/jjodel-w-loaderz` branch `loader-over-rail`. While saving, the dark loading overlay dimmed canvas, left rail and top bar, but the right Properties rail stayed bright on top of it.
**Files touched**: code `b46af6f27`: `frontend/src/components/loader/Loader.tsx` (portal onto `document.body`). This commit: `docs/discovery/discovery_2026-09-30_loader_over_rail.md` (new), this entry and a ticket, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `b46af6f27`: typecheck exit 2, 14 errors, the §17 set by file and code; build exit 0; vitest 5949 passed, 0 failed, the 9 §17 files red at import plus `irSelectionRing.test.ts`, 5/5 passing, its `afterAll` `browser.close()` timed out at 10 s (load average 110, `Loader.tsx` outside its graph). Probe on 3071: open, navigation, `U.navigating`, rail and user menu unchanged; the four scenes 0 px outside the Jodie glyph box (report §4.4).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: pending — chat (RC-23); lane probe before/after, rail centre `div.jj-conformance-bar` → `div.loader-spinner`, pixel 248,250,252 → 74,75,75; crops in `frontend/scripts/smoke/_tmp_loaderz_crops/` (gitignored)
**Notes**: Root cause: `#root` is `position: fixed` (`index.scss:31`), a stacking context at level 0 of body, and the loader lived inside it while the rail is a body child at 900 (D-UI-14). The save is too fast to catch in the probe (2.1 ms, no `isLoading` transition): the overlay was forced with the flag `saveProject.tsx:63` sets. No z-index, class or rail change.
**Prompt document name**: 2026-09-30 20:25

## 2026-09-30 — ticket: user menu Dashboard throws on Collaborative.client.off when no collaborative session was opened
**Ticket**: user menu > Dashboard runs `Collaborative.client.off('pullAction')` (`Navbar.tsx:2019`), but `Collaborative.client` is assigned only in `Collaborative.connect()` (`Collaborative.ts:55`): on a project that never connected it throws `Cannot read properties of undefined (reading 'off')` and does not navigate. Observed by automation only (probe, offline session, non-collaborative project), not yet reproduced by hand (RC-8).
**Priority**: low
**Found in**: P-2026-09-30-2025
**Detail**: docs/discovery/discovery_2026-09-30_loader_over_rail.md

## 2026-09-30 — merge: loader-over-rail into alfonso-frontend-jjtl (P-2026-09-30-2120)
**Prompt**: `claude_2026-09-30_2120_prompt_merge_loader-over-rail.md`, a direct merge by `lane-run merge --direct`, no session: `loader-over-rail` at `fb6826c1a` into `alfonso-frontend-jjtl`, merge base `45ff6c290`, 3 commits on the branch side.
**Files touched**: merge `f5f9f4f23`: 4 files from the branch side (`docs/discovery/discovery_2026-09-30_loader_over_rail.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_2025_prompt_loader_over_rail.md`, `frontend/src/components/loader/Loader.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f5f9f4f23` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5997 tests in 241 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on lane 2025 measures: with the overlay up the rail centre returns div.loader-spinner and is dimmed (74,75,75); navbar menu above the rail without loader; merge gates green
**Notes**: Rollback tag `pre-loader-over-rail` on `6fddac6b7` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-2120/result.json`.
**Prompt document name**: 2026-09-30 21:20

## 2026-09-30 — fix(export): canvas export works in all four options, M2 and M1 (P-2026-09-30-2035)
**Prompt**: `claude_2026-09-30_2035_prompt_canvas_export_fix.md`, Phase 1 then 2 in cascade, fast lane on `~/jjodel-w-canvasexport` branch `canvas-export-fix`. File > Export Canvas did nothing in any option (PNG, JPEG, SVG, Copy to clipboard): find the cause per option, make each produce the whole diagram on white, the chosen format reaching the service.
**Files touched**: docs `f3ed74cea`: `docs/discovery/discovery_2026-09-30_canvas_export_broken.md` (new). Code `0d6987661`: `frontend/src/services/CanvasExportService.ts`, `frontend/src/components/abstract/tabs/MetamodelTab.tsx`, `frontend/src/services/__tests__/CanvasExportService.test.ts` (new); `078cfb5f8`: the same test, one case. This commit: the report's Phase 2 addendum, this entry, two tickets, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` exit 2, 14 errors, the §17 set by file and code (on `078cfb5f8`); `npx vitest run` 6004 passed, the 9 known files red at import (on `0d6987661`); `npm run build` exit 0. Unit 23/23, red first (18 of 21). Mutation bench 21/22 on `0d6987661`, 26/26 on `078cfb5f8`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: pending — chat, RC-23; lane probe on 3142 (light) 154/154: DemoESM M2, demoESM M1, demoFlowB M1 under its derived IR viewpoint, four options each via the File menu; files `frontend/scripts/smoke/_tmp_canvas_export/phase2/`
**Notes**: Causes: `canvasRef` on no element since `197b6c3d0`; no M1 listener; options dropped since `260e1a0ce`; element export cropped, grey, half-res; html-to-image 1.11.13 leaves SVG children unstyled; SVG background translated (addendum). Adopted as recommended (RC-21): report §0 Q1-Q4. Not in `decisions.md`: outside this lane's DOVE.
**Prompt document name**: 2026-09-30 20:35

## 2026-09-30 — ticket: Copy to clipboard likely refused by Safari after the canvas render
**Ticket**: `CanvasExportService.copyToClipboard` awaits the html-to-image render (1-3 s) before `navigator.clipboard.write`, so the write happens after the click's user activation. Chromium accepts it (measured); Safari's rule refuses such a write (not measured here), and the user gets the alert «Copy Failed ... Use Export as PNG instead». Making Safari work needs a `ClipboardItem` whose value is the blob's Promise, created inside the click.
**Priority**: low
**Found in**: P-2026-09-30-2035
**Detail**: docs/discovery/discovery_2026-09-30_canvas_export_broken.md

## 2026-09-30 — ticket: each canvas export logs two console errors and embeds every font in the SVG
**Ticket**: html-to-image reads `cssRules` of every stylesheet to embed the fonts; the cross-origin Google Fonts sheet throws `SecurityError`, which the library catches and logs: 2 `console.error` per render (measured on 3142, every option). The export succeeds. The same embedding makes the SVG file 3 to 15 MB on the demo models, and the SVG is HTML inside a `foreignObject`: it opens in a browser, not as editable vectors.
**Priority**: low
**Found in**: P-2026-09-30-2035
**Detail**: docs/discovery/discovery_2026-09-30_canvas_export_broken.md

## 2026-09-30 — merge: canvas-export-fix into alfonso-frontend-jjtl (P-2026-09-30-2205)
**Prompt**: `claude_2026-09-30_2205_prompt_merge_canvas-export-fix.md`, a direct merge by `lane-run merge --direct`, no session: `canvas-export-fix` at `3c9a078ce` into `alfonso-frontend-jjtl`, merge base `31999a630`, 5 commits on the branch side.
**Files touched**: merge `088e4c385`: 6 files from the branch side (`docs/discovery/discovery_2026-09-30_canvas_export_broken.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_2035_prompt_canvas_export_fix.md`, `frontend/src/components/abstract/tabs/MetamodelTab.tsx`, `frontend/src/services/CanvasExportService.ts`, `frontend/src/services/__tests__/CanvasExportService.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `088e4c385` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6020 tests in 242 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Checked by the chat: lane probe 154/154 on the four exports (M2, M1, derived IR M1), on-screen canvas 0 px change after the exports, M2 PNG viewed by the chat (nodes, edges, white background). Merge changes the export path only, no demo content.
**Notes**: Rollback tag `pre-canvas-export-fix` on `120d97c01` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-2205/result.json`.
**Prompt document name**: 2026-09-30 22:05

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

## 2026-09-30 — fix(views): the Activity final draws the dot-large disc (P-2026-09-30-1720, resume)
**Prompt**: the chat's resume of P-2026-09-30-1720: question 1 of the hard stop adopted (RC-21), scope extended to `viewpointDerivation.ts` (the Activity final's marker, the stale floor comments) and `activityUml.test.ts`; question 2 (the bar painted 3 px) to Alfonso.
**Files touched**: code `ea4a7ae19`: `viewpoint/derive/viewpointDerivation.ts`, `derive/__tests__/activityUml.test.ts`, `nodes/__tests__/nodeSizing.test.ts`. This commit: the report's §7, this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-09-30 15:52 claude_2026-09-30_1552_prompt_activity_uml_notation.md
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no — the two files the GO added and `nodeSizing.test.ts` of the first DOVE.
**Layer Impact Report**: produced
**Smoke visivo**: lane probe on 3087 19/19, light; the visual GO is the chat's, the bar's 3 px Alfonso's (pending)
**Notes**: Bull's-eye as derived: disc 14 px on the 24 px node. Documents: 78 of 81 lists identical to ca3e41a92, the 3 Activity lists equal with dot -> dot-large. Gates: typecheck 14; vitest 6209/6213 (known 9 + 4 criticalZone, 70/70 unset); build 0; bench 19/19. The earlier entry of this lane stays as written (add-only, RC-34): this one completes it. Report §7.
**Prompt document name**: 2026-09-30 17:20

## 2026-09-30 — feat(views): Activity decision/merge, guard patch, token inside (P-2026-09-30-1935)
**Prompt**: `claude_2026-09-30_1935_prompt_activity_decision_merge.md`, Phase 1 and 2 in cascade on `activity-decision-merge`. Alfonso's review of the Activity (UML) view of DemoFlowB: explicit decision and merge, guards in UML brackets, the token inside the node, action border and bars, the «2», the axis.
**Files touched**: report `d34cded42` + §6 in this commit: `docs/discovery/discovery_2026-09-30_activity_decision_merge.md`. Code `d2e4e7959`: `viewpoint/ir/irJunctions.ts` (new), `viewpoint/ir/irEdgeViews.ts`, `edges/UnifiedEdge.tsx`, `viewpoint/derive/viewpointDerivation.ts`, `sim/SimNodeRunState.tsx`, `sim/simNodeRunState.scss`, `nodes/ObjectNode.tsx`, tests `irJunctions.test.ts` (new), `irActivityRender.test.ts` (new), `activityUml.test.ts`. This commit: the report, `docs/decisions.md` (R-VP-32..35), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-09-30 15:52 claude_2026-09-30_1552_prompt_activity_uml_notation.md
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no — fourteen files, all in the DOVE and named by the report (§3): the ten of `d2e4e7959`, the report, `docs/decisions.md`, `docs/log-inbox/views.md`, the prompt file.
**Layer Impact Report**: produced
**Smoke visivo**: lane probe on 3093 31/31, light; the visual GO is the chat's (pending)
**Notes**: Precondition holds (one transition per plain edge, one per step). Typecheck the known 14; vitest 6244/6245 + the 9 known at import, 2 files red under load green alone; build 0; bench 48/50 (the two ObjectNode mutants, probe-only). Documents 79/81 identical, 2 with the guard style. Default scenes 0 px from 30f3d8a81. Points 4-6 change no code (R-VP-35). Report §6.
**Prompt document name**: 2026-09-30 19:35

**Ticket** (observations, low): (1) a decision whose trunk side is shared with an entry sits on the side's slot, 6 px off the action's axis (DemoFlowB with Decision read as an Action). (2) the explicit decision is 36 px, the synthetic 28. (3) the guard overlap between `work` and `d1` persists (the ticket of P-2026-09-30-1552). (4) `ObjectNode.tsx`'s wiring of the inside token is covered by the probe only: the file does not import in the bench.

## 2026-09-30 — merge: activity-decision-merge takes alfonso-frontend-jjtl (P-2026-09-30-2143)
**Prompt**: `claude_2026-09-30_2143_prompt_activity-decision-merge_take_trunk.md`, full lane rendered by `lane-run merge --trunk-into`: the trunk `alfonso-frontend-jjtl` at `120d97c01` into `activity-decision-merge` at `865f53378`, one `--no-ff` merge commit, merge base `62f4ac3fc`, 72 trunk commits against 36 on the branch (RC-14).
**Files touched**: merge `91333202f`: the 63 files of the trunk side, two of them resolved by union (`docs/decisions.md`, `docs/log-inbox/views.md`). This commit: this entry, the Status of this prompt, and the second Status flip of `claude_2026-09-30_1935_prompt_activity_decision_merge.md` asked by the chat's GO.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `91333202f`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6337 passed in 253 files (trunk 5997 + branch 340), 0 failed, the 9 known red at import; hooks 344 (trunk 344); build exit 0; check:docs 4/4; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: yes — the second Status flip of P-2026-09-30-1935, outside step 9's list, named by the chat's GO.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: the branch probe re-run on `91333202f` (3094), `_tmp_actdec_probe.ts` 31/31, no page errors; visual GO by Alfonso.
**Notes**: Union in the prescribed order: R-VP-27..31 (trunk) before R-VP-19..26 and 32..35 (branch); the branch's 2026-09-29 entry follows the trunk's 2026-09-30 ones. Vitest expectation stated as 6336 from a static count; the run gave 6337: one `it` in `erChen.test.ts` runs over two models, so the branch adds 340 (its record: 6245 - 5905). The merge carries the trunk's `canvasToJjom.ts` as its lane left it, no hand edit. Docs read end to end by a subagent.
**Prompt document name**: 2026-09-30 21:43

## 2026-09-30 — merge: activity-decision-merge into alfonso-frontend-jjtl (P-2026-09-30-2220)
**Prompt**: `claude_2026-09-30_2220_prompt_merge_activity-decision-merge.md`, full lane rendered by `lane-run merge`: `activity-decision-merge` at `ea7702a83` into `alfonso-frontend-jjtl` at `79cf837a7`, one `--no-ff` merge commit, merge base `120d97c01`, 39 commits on the branch side against 9 on the trunk (this prompt's included).
**Files touched**: merge `530c18a7e`: the 84 files of the branch side, one resolved by union (`docs/log-inbox/views.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `530c18a7e`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6360 passed in 254 files, 0 failed, the 9 known red at import (expected 6360: trunk 6020 + branch 340); hooks 344 (trunk 344); build exit 0; check:docs 4/4; check:agents PASS; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat `C-2026-09-30-1932`: Alfonso visual GO on activity-decision-merge; `_tmp_actdec_probe.ts` 31/31 on `91333202f`; merge gates green on `530c18a7e`.
**Notes**: Rollback tag `pre-activity-decision-merge` on `34c4df57a` (RC-31), set by `lane-run`. Union: `docs/log-inbox/views.md`, the trunk's 4 headings then the branch's 16, both sides pure appends. Probes 32/32 once, control R-VP-36 absent. Branch count 6337 in 253 files measured read-only in `jjodel-w-actdec`. The Status parenthetical carries the chat's GO, not the template's morning-digest text: the GO reports Alfonso's visual GO.
**Prompt document name**: 2026-09-30 22:20

## 2026-10-01 — fix(editor-v2): bound size writes, keep edges, catch canvas loops (P-2026-10-01-1655)
**Prompt**: `claude_2026-10-01_1655_prompt_update_depth_loop.md`, Phase 1 then 2, heavy, RC-30 go-ahead. «Maximum update depth exceeded» dragging under a «FlowChart (derived)» viewpoint: reproduce, root cause, fix, a canvas safety net. Stopped by the chat at 120 min; resumed with its order (report first, 20 min to confirm, else close every unbounded path).
**Files touched**: docs `14c343ac4`: `docs/discovery/discovery_2026-10-01_update_depth_loop.md`. Code `140a5d366`: `viewpoint/ir/useContentSize.ts`, `viewpoint/ir/__tests__/useContentSizeLoop.test.ts` (new), `EditorV2.tsx`. This commit: this entry, the report's addendum, the Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: unknown — `npx tsc --noEmit` 14, the §17 set; vitest 6365 passed, 4 red in `criticalZone.test.ts` only under this session's `JJODEL_CRITICAL_ZONE_GOAHEAD` (70/70 unset), the 9 known import reds; build exit 0; mutation bench 6/6; scenes 9/9 byte-identical to the pre-fix code.
**Out-of-scope changes**: no — the files the report names (§5).
**Layer Impact Report**: produced (report §6, committed in `14c343ac4` before the diff)
**Smoke visivo**: passato — probe, unattended: 0/7 fresh-page crashes (before 4/10), 240 drags on four derived viewpoints 0 crashes, nested depth max 3; Alfonso's GO pending (RC-23)
**Notes**: Root cause not confirmed: the loop is a useSyncExternalStore consistency cascade with EditorV2's edges moving on every nested render; the hook wrote 0 times in it. The fix closes the reachable unbounded paths and adds `CanvasErrorBoundary`; the residual risk is in the report §9. EditorV2's two changes are covered by the probe only (the file does not import in the bench).
**Prompt document name**: 2026-10-01 16:55

## 2026-10-01 — ticket: the trigger of the update-depth cascade is still unconfirmed
**Ticket**: The «Maximum update depth exceeded» of P-2026-10-01-1655 was reproduced 4/10 on fresh pages (hand-made FlowChart, Generic derived viewpoint, the third drag) and measured as a useSyncExternalStore consistency cascade (`updateStoreInstance → forceStoreRerender`, 60/60 stacks) with EditorV2's `edges` state moving on every nested render; neither the subscriber nor the edges writer was named before the fix made it unreproducible (0/7). The probe's uSES recorder is ready; re-run it on `4b018b82b` code to name both.
**Priority**: medium
**Found in**: P-2026-10-01-1655
**Detail**: docs/discovery/discovery_2026-10-01_update_depth_loop.md (§3.4, §9)

## 2026-10-01 — ticket: criticalZone.test.ts reads the ambient go-ahead variable
**Ticket**: Four tests of `frontend/scripts/hooks/__tests__/criticalZone.test.ts` (permission_mode, RC-19) fail when the full suite runs inside a lane launched with `--critical-zone-goahead`: `JJODEL_CRITICAL_ZONE_GOAHEAD` leaks from the session into the test. 70/70 with the variable unset. The test should clear it in its own setup.
**Priority**: low
**Found in**: P-2026-10-01-1655

## 2026-10-01 — merge: update-depth-loop into alfonso-frontend-jjtl (P-2026-10-01-2029)
**Prompt**: `claude_2026-10-01_2029_prompt_merge_update-depth-loop.md`, a direct merge by `lane-run merge --direct`, no session: `update-depth-loop` at `347eeb6c1` into `alfonso-frontend-jjtl`, merge base `4b018b82b`, 4 commits on the branch side.
**Files touched**: merge `a952056bb`: 6 files from the branch side (`docs/discovery/discovery_2026-10-01_update_depth_loop.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-01_1655_prompt_update_depth_loop.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useContentSizeLoop.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `a952056bb` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6411 tests in 258 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat smoke on 3001 (Chrome, light): Notation Demo / model_1 loads on the trunk with the fix, 12 nodes and 12 edges rendered, no Maximum update depth, no CanvasErrorBoundary fallback, no console error. The crash itself was verified by the lane probe (0/7 fresh pages, 240 drags, 0 crashes; scenes 9/9 byte-identical). GO.
**Notes**: Rollback tag `pre-update-depth-loop-P-2026-10-01-2029` on `649feda48` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-01-2029/result.json`.
**Prompt document name**: 2026-10-01 20:29
