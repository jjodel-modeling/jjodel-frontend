# log-inbox — lane «jjscript»

Entries written by the JjScript lane while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-01 — perf(jjscript): Run slowdown, attribution and two of three fixes (P-2026-10-01-2136)
**Prompt**: `claude_2026-10-01_2136_prompt_jjscript_run_slowdown.md`, full lane on `~/jjodel-w-runperf`, branch `jjscript-run-perf`. Each Run from Jjodie got slower in a session. Phase 1 measured where each dispatch's main-thread time goes; the GO named three fixes: T8 (R-JS-7), an inactive-tab gate, own-edges handles.
**Files touched**: `ea6b53d92`, `56db69c32`: `frontend/scripts/probe/jjscript-run-slowdown.ts` (new). `30eb9136a`: `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md` (new). `4bbf7e640`: `frontend/src/jjscript/executor/runPasses.ts`, `elementWaiter.ts`, `executor/__tests__/retryPassWait.test.ts` (new). `a17444e9d`: `frontend/src/components/editor-v2/components/DynamicHandles.tsx`, `nodes/ClassNode.tsx`, `utils/__tests__/dynamicHandlesOwnEdges.test.ts` (new). Closure commit: `docs/decisions.md` (R-JS-7), the report's Phase 2 addendum, this file, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: unknown. typecheck 14, the known set, at each commit; build exit 0; vitest `src/jjscript`, `src/components/editor-v2`, `src/components/abstract/tabs`: 3467 in 138 of 139 files before (inferred), 3488 in 141 of 142 after, `context-binding` red at import (known). Demo scenes: nodes and handles identical, 18 edge paths within 0.0001 px. The memo comparisons have no executing test.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non eseguito — to the chat: Run in Jjodie on a demo scene, handles and edge ends unchanged, a forward reference resolves on retry
**Notes**: Fix 1 not committed: its in-app check could not complete, load averages 200-380 from 20:55 UTC; parked in gitignored `_tmp_fix1_*`. Found: a pre-existing render loop, about 60 Hz, in a hidden editor holding a reference, not redux-driven (report addendum). Probe, baseline run 12: 11.5 s before, 9.8 s after T8, 6.6 s after fix 2. Ticket T8 closed by `4bbf7e640`.
**Prompt document name**: 2026-10-01 21:36

**Ticket** (T9, high): a hidden metamodel editor that holds a reference re-renders about 60 times a second with no dispatch: `useNodesState` and `useEdgesState` are set on every render (scout on `4bbf7e640`, both fixes off). It costs CPU between Runs and is the likely main share of the hidden-tab cost. The inactive-tab gate cannot stop it. Report addendum.

## 2026-10-02 — merge: jjscript-run-perf into alfonso-frontend-jjtl (P-2026-10-02-1445)
**Prompt**: `claude_2026-10-02_1445_prompt_merge_jjscript-run-perf.md`, a merge in a session (`lane-run merge --direct` fell back: a union hunk edits a base section of `docs/log-inbox/jjscript.md`): `jjscript-run-perf` at `7bd293e37` into `alfonso-frontend-jjtl`, merge base `ac3890b7e`, 7 commits on the branch side.
**Files touched**: merge `c3a9c9ffd`: 11 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md`, `docs/log-inbox/jjscript.md`, `docs/prompts/claude_2026-10-01_2136_prompt_jjscript_run_slowdown.md`, `frontend/scripts/probe/jjscript-run-slowdown.ts`, `frontend/src/components/editor-v2/components/DynamicHandles.tsx`, `nodes/ClassNode.tsx`, `utils/__tests__/dynamicHandlesOwnEdges.test.ts`, `frontend/src/jjscript/executor/elementWaiter.ts`, `runPasses.ts`, `executor/__tests__/retryPassWait.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c3a9c9ffd`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6457 in 260 files (the trunk tip's 6442 in 258 plus the branch's 15 in 2 new files), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 11 files, above Rule 19's five: all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: 12-run check on the branch tip 7bd293e37 (localhost:3002): runs 1-9 at 2.1-2.7 s, runs 10-12 at 3.0-5.5 s against 9-12 s on the trunk at run 12; edges attached on the visible canvas; four demo scenes identical per the lane dumps; the check ran on the branch tip, and the merge shares no code file with the trunk side
**Notes**: Union in `docs/log-inbox/jjscript.md`: the trunk's preamble, then the branch's entry P-2026-10-01-2136 and ticket T9; the base's two entries, folded by `d2eb5fb83` and byte-identical in the active log, not carried back; accepted by the chat at the GO. No rollback tag: the prompt names none, pre-merge tip `9449073e4`. The tip then moved by another chat's merge of ir-corner-clip (`eaead2d71`, `3db161e62`), no file shared with this one.
**Prompt document name**: 2026-10-02 14:45

## 2026-10-03 — fix(editor-v2): T9, the idle render loop of every editor holding an edge (P-2026-10-02-1450)
**Prompt**: `claude_2026-10-02_1450_prompt_hidden_tab_render_loop.md`, full lane on `~/jjodel-w-hiddenloop`, branch `hidden-tab-loop`. T9: a hidden metamodel editor re-rendered at ~60 Hz with nothing dispatched. Phase 1 found the loop in every editor holding an edge, hidden or visible, demo scenes included. The GO named fix B. The chat then extended the scope to the line jumps (RC-21) and asked for a scripted interaction smoke.
**Files touched**: `a114b7bf9`, `5921a6c06`, `4afbb321a`: `frontend/scripts/probe/hidden-tab-loop.ts` (new). `c99cb758b`: `frontend/src/components/editor-v2/utils/syncPatchIdentity.ts` (new), `utils/__tests__/syncPatchIdentity.test.ts` (new). `c7380822c`: `hooks/useJjomSync.ts`. `334a7e444`: `utils/edgeUtils.ts`, `edges/UnifiedEdge.tsx`, `hooks/useTreeLayout.ts`, `utils/__tests__/edgePathRegistry.test.ts` (new). Docs: `docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md` (report and addenda). Merges of the trunk: `ec57a268d`, `1b40b2a03`. Closure commit: this file, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Everything measured is identical to the trunk tip: four scene dumps, and the 16-step interaction smoke on Petri and FlowB, with line jumps checked geometrically. typecheck 14, the known set; vitest editor-v2 120 files / 2938 tests; build; check:docs, agents, scripts, addonly green on `1b40b2a03`. No demo case crosses a tree connector, so that wiring is unmeasured.
**Out-of-scope changes**: no. Every file was declared before it was touched, by the report or by the chat's extension (RC-21). The before servers ran from temporary detached worktrees in /tmp, removed afterwards.
**Layer Impact Report**: produced
**Smoke visivo**: passato — lane, scripted interaction smoke and scene dumps against the trunk tip (16/16 identical), crops md5-checked by the chat; Alfonso's own check pending in the morning digest
**Notes**: Idle renders/s per editor: 120 → 0 hidden and visible; demo scenes 99.6-100% → 0.9-4.2% busy. two-mm run 12: 7839 → 3529 ms. Mutation benches: 16/16, 3/3 (hook, through the probe), 15/16 (one equivalent), wiring 1/1. Fix B alone made 2 line jumps stale; the first registry version looped (Maximum update depth); both fixed and measured. Report addenda.
**Prompt document name**: 2026-10-02 14:50

## 2026-10-03 — ticket: a selected edge keeps half of T9's loop running until a pane click
**Ticket**: After fix B, an edge selected by a click still re-renders its editor at 60/s, hidden or visible, until a click on the pane. EditorV2's `setEdges` wrapper re-adds `selected` to every edge while `selectedEdgeIdRef` is set, and the sync merge never carries it, so the merged edge never equals the current one. Keeping `selected` through the merge stops it. It would also keep edges box-selected by React Flow highlighted, which today the next patch clears: Alfonso's decision (RC-26).
**Priority**: medium
**Found in**: P-2026-10-02-1450
**Detail**: docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md

## 2026-10-03 — ticket: adding then deleting a reference leaves a handle slot on its target class
**Ticket**: On the M2 canvas, `create class X` + `create reference r in X type C`, then `delete class X`, leaves C's handles distributed for one more edge (Petri: bottom slots at 20/40/60% instead of 25/50/75%), and two edges stay routed to the shifted ports. It is identical on the trunk tip and on the T9 branch, so it predates T9.
**Priority**: low
**Found in**: P-2026-10-02-1450
**Detail**: docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md

## 2026-10-03 — merge: hidden-tab-loop into alfonso-frontend-jjtl (P-2026-10-03-0308)
**Prompt**: `claude_2026-10-03_0308_prompt_merge_hidden-tab-loop.md`, a merge session started by `lane-run`: `hidden-tab-loop` at `08f442052` into `alfonso-frontend-jjtl`, `--no-ff` of the explicit sha, merge base `ff93dc482`, 17 commits on the branch side, zero conflicts measured.
**Files touched**: merge `cd348df03`: 11 files from the branch side (`docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md`, `docs/log-inbox/jjscript.md`, `docs/prompts/claude_2026-10-02_1450_prompt_hidden_tab_render_loop.md`, `frontend/scripts/probe/hidden-tab-loop.ts`, `editor-v2/edges/UnifiedEdge.tsx`, `editor-v2/hooks/useJjomSync.ts`, `editor-v2/hooks/useTreeLayout.ts`, `editor-v2/utils/edgeUtils.ts`, `editor-v2/utils/syncPatchIdentity.ts`, and two new tests); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `cd348df03` in this session: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6883 tests in 275 files (trunk tip 6847 in 273, plus the branch's 36 in two new files), 0 failed, the same 9 red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts, check:addonly exit 0.
**Out-of-scope changes**: no. 11 files, above Rule 19's five: all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: interact probe on port 3014 from the trunk `cd348df03` against the branch's after2 dumps, ALL GREEN on every phase (scenes 2 and 4: rest, drag, resize, rename, tabs, m2-rest, m2-added, m2-deleted; max path delta 3e-5). Two FAILs of «delete restored the pane» (scenes 2 and 4), nodes and edges equal to rest, dumps identical to after2: the residual handle slot, the Low ticket of P-2026-10-02-1450, pre-existing. `npm run smoke` targets localhost:3000 (down): its RED does not count. Alfonso in the morning digest.
**Notes**: No rollback tag at the merge: the prompt named none (lane-run tags only in `--direct` mode), pre-merge tip `69265f7fb`. Tag `pre-hidden-tab-loop` created on `69265f7fb` after the chat's GO (RC-31). No union resolution. Probes on the merge-tree in `docs/log-inbox/jjscript.md`, each once: the T9 fix entry and its two tickets. Expected vitest total stated before the merge, measured read-only on `08f442052` in `~/jjodel-w-hiddenloop`.
**Prompt document name**: 2026-10-03 03:08

## 2026-10-03 — chore(probe): tree-connector crossings follow the edge path registry (P-2026-10-03-1002)
**Prompt**: `claude_2026-10-03_1002_prompt_tree_crossing_scene.md`, full lane on `~/jjodel-w-treecross`, branch `tree-crossing-scene`. The `useTreeLayout` side of the registry version (P-2026-10-02-1450) was wired but unmeasured: build a scene where an edge crosses a tree connector, probe it, verdict with numbers. GO: close with the probe and fixture as acceptance, no app code.
**Files touched**: `9c9fd905c`: `frontend/scripts/probe/tree-crossing.ts` (new), `frontend/scripts/probe/fixtures/tree-crossing.jjodel` (new). `71a45088f`: `docs/discovery/discovery_2026-10-03_tree_crossing_scene.md` (new). Closure commit: the report's Phase 2 addendum, this file, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. No `src` file changed (`git diff fba1549ee` empty under `frontend` outside the probe). typecheck 14, the §17 set; typecheck:scripts and check:scripts exit 0; vitest `src/components/editor-v2` 120 files / 2938 tests passed (probe folder: no tests); build exit 0; demo scenes 8/8 panes identical across two dumps, interact 16/16 identical to the trunk dump at `cd348df03`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3017, unattended: seed 62/62, fixture 59/59; the chat's visual check is its own
**Notes**: Verdict yes: 11 states (6 pointer, 4 keyboard), drawn bus arcs = registry oracle = geometry; 0 editor and edge renders/s at rest. Bench: `mut-bar` killed 6/11 (keyboard moves, re-anchoring releases), `mut-trunk` equivalent (trunk horizontal at most 4 px). Corregge is a dash: this measures P-2026-10-02-1450's declared gap, it fixes no result. Report and addendum.
**Prompt document name**: 2026-10-03 10:02

## 2026-10-03 — ticket: the DemoFlowB metamodel loses its edge lanes after an M1 session
**Ticket**: In `scene_4_DemoFlowB`, the metamodel pane draws the two references that end on one class's right side, at (194,64) and (194,78), in separate lanes when dumped right after opening (verticals x=218 and 222.5, horizontals y=617.5 and 622), but on one line (x=218, y=622, about 400 px and 300 px of overlap) after M1 is opened and worked and the M2 tab is brought back (interact `m2-rest`). Deterministic both ways; the trunk dump at `cd348df03` shows the overlap too. The step that drops the lanes is not isolated.
**Priority**: medium
**Found in**: P-2026-10-03-1002
**Detail**: docs/discovery/discovery_2026-10-03_tree_crossing_scene.md

## 2026-10-03 — merge: tree-crossing-scene into alfonso-frontend-jjtl (P-2026-10-03-1052)
**Prompt**: `claude_2026-10-03_1052_prompt_merge_tree-crossing-scene.md`, a direct merge by `lane-run merge --direct`, no session: `tree-crossing-scene` at `9a752d000` into `alfonso-frontend-jjtl`, merge base `fba1549ee`, 4 commits on the branch side.
**Files touched**: merge `c927f4be1`: 5 files from the branch side (`docs/discovery/discovery_2026-10-03_tree_crossing_scene.md`, `docs/log-inbox/jjscript.md`, `docs/prompts/claude_2026-10-03_1002_prompt_tree_crossing_scene.md`, `frontend/scripts/probe/fixtures/tree-crossing.jjodel`, `frontend/scripts/probe/tree-crossing.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c927f4be1` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6883 tests in 275 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: probe and docs merge; gates green; no app code; no demo scene affected
**Notes**: Rollback tag `pre-tree-crossing-scene` on `ffae7072a` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1052/result.json`.
**Prompt document name**: 2026-10-03 10:52

## 2026-10-04 — feat(jjscript): M1 Run defers forward references, instances born in their container (P-2026-10-04-0946)
**Prompt**: `claude_2026-10-04_0946_prompt_jjscript_m1_containment.md`, full lane on `~/jjodel-w-jjsm1`, branch `jjscript-m1`. A generated microwave state machine left its 4 `Transition` at the M1 root with 8 failed lines. Phase 1 measured why (report `8f84740c6`); the GO adopted D1-D4, Q3, Q5 as R-JS-8..11 and sent D5 to tickets.
**Files touched**: probe `4cd1fce10`, `ffb23e6dd`: `frontend/scripts/probe/jjscript-m1-containment.ts`, `fixtures/jjscript-m1-esm.jjodel` (new). `602f64413`: `jjscript/executor/runPasses.ts`, `__tests__/runPasses.test.ts`. `9916cefce`: `jjscript/parser/parser.ts`, `executor/commands/instance.ts`, `executor/handleRegistry.ts`, `executor/dependencies.ts`, `executor/elementWaiter.ts`, `__tests__/parser.test.ts`, `executor/__tests__/m1Containment.test.ts` (new). `9163f0b28`: `constants/defaultPrompts.ts`, `jjodie-integration/jjscriptGenerationPrompt.ts`. Docs: the report, `docs/decisions.md`, this file, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Typecheck 14, the §17 set; vitest 7330 passed, 0 failed, the 9 §17 files red at import; build exit 0. Every M2 test unchanged and green. Unknown because the legacy `set +=` script now succeeds on retry into the pre-existing hybrid and lost-update states (tickets below) where it used to fail loudly.
**Out-of-scope changes**: no. 13 files above Rule 19's five, all listed in report §5 and adopted by the GO.
**Layer Impact Report**: not-required
**Smoke visivo**: non eseguito — to the chat: crops after_E1/E2 tree and canvas, 600 px, in ~/.jjodel-lanes/P-2026-10-04-0946/crops/; lane probe on 3096 all PASS
**Notes**: Probe after: the microwave with `in` 0 errors, every Transition in its State's slot and not in model.objects, tree nested; the original script, no `not found` after the retries. Bench 28/28 (dedupe-removal not run: loops on the cycle test). Commit types chosen from lane precedent, the prompt names none (P6). Console error «Invalid action path 0» on every fixture import, before and after, not investigated. Report addendum.
**Prompt document name**: 2026-10-04 09:46

## 2026-10-04 — ticket: `set <parent>.<containment> += <child>` leaves an incoherent containment
**Ticket**: On a root child the M1 link sets its father to the slot but never removes it from `model.objects` (`LModelElement.tsx:7916`, no detach from a DModel); a second `+=` lists it twice (the dedupe at `:8010` returns true on both branches); `=` appends like `+=` (`instance.ts` link branch); a `State` is accepted into a `Transition` slot (type check commented out at `:7910`). Probable cause of the canvas defect that draws a contained Transition as a node after a reparent (the canvas shows it as node and chip). R-JS-8 makes legacy scripts reach it on retry. L-layer core: no change without approval.
**Priority**: medium
**Found in**: P-2026-10-04-0946
**Detail**: docs/discovery/discovery_2026-10-04_jjscript_m1_containment.md

## 2026-10-04 — ticket: two M1 links into one slot 20 ms apart keep only the second
**Ticket**: The M1 link reads the slot's committed values and writes them back plus one id; a link reaches the store 84-89 ms after its command returns, so `set s.transitions += b` then `set s.transitions += c` through Run leave `[a, c]`, with `b` pointing at the slot but absent from it. Measured identical on `8f84740c6` and on the lane tip: pre-existing. `create instance … in` is not affected (the constructor appends).
**Priority**: medium
**Found in**: P-2026-10-04-0946
**Detail**: docs/discovery/discovery_2026-10-04_jjscript_m1_containment.md

## 2026-10-04 — ticket: the Run summary miscounts and does not flag M1 instances by containment
**Ticket**: The `instances` figure of the summary is `model.objects.length` (`runFigures.ts:100`, as `StatusBar.tsx:173-175`), so instances born in a slot are not counted: the microwave with `in` shows +8 for 12. And an instance a Run leaves at the root while its class is reachable only through a composition is not flagged; `topLevelReason` (`joiner/environmentConfig.ts:149`) already answers «created inside State». Amends R-JS-6: a decision of its own.
**Priority**: medium
**Found in**: P-2026-10-04-0946
**Detail**: docs/discovery/discovery_2026-10-04_jjscript_m1_containment.md

## 2026-10-05 — merge: jjscript-m1 into alfonso-frontend-jjtl (P-2026-10-04-2147)
**Prompt**: `claude_2026-10-04_2147_prompt_merge_jjscript-m1.md`, a direct merge by `lane-run merge --direct`, no session: `jjscript-m1` at `05bf04ce8` into `alfonso-frontend-jjtl`, merge base `d6bd5c5f6`, 8 commits on the branch side.
**Files touched**: merge `0e77734a2`: 17 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-04_jjscript_m1_containment.md`, `docs/log-inbox/jjscript.md`, `docs/prompts/claude_2026-10-04_0946_prompt_jjscript_m1_containment.md`, `frontend/scripts/probe/fixtures/jjscript-m1-esm.jjodel`, `frontend/scripts/probe/jjscript-m1-containment.ts`, `frontend/src/constants/defaultPrompts.ts`, `frontend/src/jjodie-integration/jjscriptGenerationPrompt.ts`, and 9 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0e77734a2` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7499 tests in 302 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat check RC-23 on the lane probe from the DOM (E1, E2, E2b, E3, E4 all PASS: microwave with `in` has 0 errors, every Transition in the transitions slot of its source State and not in model.objects, tree nested; original script leaves no not-found after the retry passes); canvas edge rendering not measured, out of scope
**Notes**: Rollback tag `pre-jjscript-m1` on `c34a03ddb` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-04-2147/result.json`.
**Prompt document name**: 2026-10-04 21:47
