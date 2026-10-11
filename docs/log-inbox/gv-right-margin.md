# log-inbox — lane «gv-right-margin»

Entries written by the gv-right-margin lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — fix(ir): partitions keep their content margin on the right (P-2026-10-11-0040)
**Prompt**: `claude_2026-10-11_0040_prompt_graphvertex_right_margin.md`, fast lane, unattended, on `~/jjodel-w-gvmargin` (branch `gv-right-margin`): Alfonso's «lascia un po' di padding a destra di Processing prima del bordo»; a framing container keeps at least 16 px between its children and its right border, the frame grows, the children stay; red test first, gates, DOM probe after Auto layout and reload, crops, hard stop.
**Files touched**: `aea222c46`: `viewpoint/ir/irContainment.ts`, `viewpoint/ir/__tests__/irContainerLayout.test.ts`. `dfa6f07ce`: `frontend/scripts/probe/gv-right-margin.ts` (new), `frontend/scripts/probe/statechart-fixture.ts` (`export` on `buildStatechartScene`). This commit: this inbox file (new).
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 01:05 (`claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`, slice S2: a partition sized by its children's span)
**Causa**: (c)
**Regressions**: no. tsc 14 = the §17 set; typecheck:scripts 0; vitest 8390 passed, only the 9 known import failures; build 0; check:scripts 77 files. Unit: 4 new tests, 5 expectations updated (each pinned a right edge cutting a child). Bench 10 mutants, 10 killed. Probe on 3087: before (pre-fix irContainment) 3/5, after 10/10, no left, top or bottom gap smaller.
**Out-of-scope changes**: yes (`statechart-fixture.ts`, not named by the prompt: one `export` so the probe can build the S2b scene)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe 10/10 on 3087, node box; crops in `~/.jjodel-lanes/P-2026-10-11-0040/`; the chat's visual check is pending (RC-23)
**Notes**: Cause: needOf (irContainment.ts:730-741 before) gave a partition its children's span + 2×16 across, but layoutPartitions (irPartitions.ts:100-109) starts it at the region start, not 16 before them: 27 px in left 5 on the right. specOf now reaches 16 past their far edge from crossFromOf. Premise not reproduced: fresh S2b + Auto layout is 16/16; i1 dragged 16 px gave R0, now R16. Painted gaps run 2 px under the node box (wrapper and content borders), on every side.
**Prompt document name**: 2026-10-11 00:40

## 2026-10-11 — ticket: Auto layout writes a grown pool's size with its old position
**Ticket**: when the S6 Auto layout writes a pool's grown size (R-GV-16), the pool's record keeps its pre-layout position: on the BPMN fixture Shop's record stays at (100, 100, 1632×360, sized by hand) while its lanes' records put it near (48, 568). In session the pool is drawn where ELK put it; after save and reload it is drawn at its record, and Sales sits 484 px above its own flow nodes (top gap 484, bottom −364). Measured identically on the pre-fix and the fixed code; the write lives at the S6 call site in `EditorV2.tsx`, outside this lane.
**Priority**: high
**Found in**: P-2026-10-11-0040
**Detail**: frontend/scripts/probe/gv-right-margin.ts

## 2026-10-11 — ticket: a stacked partition loses its bottom margin as it lost the right one
**Ticket**: on the main axis a partition not sized by hand still takes its children's span plus two margins from where the stack puts it, so a child more than 16 px below a lane's top takes the excess off its bottom (the unit fixture of irContainerLayout.test.ts pins t1 at 160..220 in a Sales drawn 100..192). Not fixed with the right side: growing a partition along the stack moves the next one past its own children, against «the children do not move».
**Priority**: medium
**Found in**: P-2026-10-11-0040
