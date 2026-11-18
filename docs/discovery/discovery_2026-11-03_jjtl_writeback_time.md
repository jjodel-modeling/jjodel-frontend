# Discovery: where the time of the JjTL write-back goes

Prompt-ID: P-2026-11-03-1014 (continues P-2026-11-03-0703, ticket #475)
Prompt file: `docs/prompts/claude_2026-11-03_1014_prompt_*` (the one that adds this report); the measuring prompt is `docs/prompts/claude_2026-11-03_0703_prompt_jjtl_writeback_time.md`
Tree: `~/jjodel-w-jjtlwbtime`, branch `jjtl-writeback-time`, HEAD `f986a1ff4` when written
Executor model: Sonnet 5.5 (as the session banner shows it)
Nature: a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

Provenance of the figures: every number tagged **measured** comes from the probe of P-2026-11-03-0703 (`~/.jjodel-lanes/P-2026-11-03-0703/probe/wbtime.ts`, results in `.../probe/out/`), run in the app on the dev server (lane-run, port 3211), machine load 1.4-3.0 during the runs, one fresh page and project per size. This session did not rerun the probe: it wrote the report from the handoff of that lane (`handoff.md`). The code lines tagged **read** were checked in this session on the tree at the HEAD above. Every figure is a dev-server figure; production is **not measured** (section 7).

## 0. Answer in brief

- **Where the time goes** (scenario T, 2,559 lowered objects, output tab open, the real path; measured, 3 unprofiled runs): the executor is not the cost. Click to executor end 0.14-0.18 s. The write-back is: a fixed 1,000 ms timer, then the nested walk (STEP 6c) from 1.15-1.19 s to 8.8-10.2 s, then a second timer that, stretched by long tasks, ends the attribute writes at 14.0-14.4 s; the page is quiet at about 21 s. Profiled wall 21.5 s = **16.2 s busy CPU, 4.5 s idle**.
- **It is work, not polling**, when the tab is open: the 50 ms slot polls account for 1.7 s asleep of 21 s. With the output tab not opened the walk is about 60% asleep (commit cadence plus polls), and in deep trees the sleeping dominates (comb of depth 60, 123 objects: 20.0 s, about 11.7 s asleep).
- **The biggest single cost is the output canvas**: with the tab open, `useJjomSync` auto-populates a DVertex for each nested object (2,573 vertices against 15 without the tab). Ablating the tab opening (`DockManager.open2` no-op) takes the attribute writes from 14.0-14.4 s to 6.0-6.2 s, CPU from 16.2 s to 3.6 s, the UI freeze from 2.7-4.3 s to 0.85 s.
- **Growth** (tab open, attributes written, measured): 511 objects 4.8 s; 1,023 6.6 s; 2,559 14.2 s; 5,119 23.0-23.3 s then a 5.3-5.4 s dispatch of 26,624 actions, more than 41 s to settle. Object creation is linear; the reducer/dispatch and the long tasks are superlinear (about n^1.5). Depth adds a floor of about 300 ms per level (the commit interval).
- **What the user sees** (measured, screenshots): the tab opens at +2 s, the toast says "Created model "out1" with 1 instances" (roots only), the canvas fills during the walk, the status bar says "2559 instances · conforms to Tgt" at +8 s, before the walk ends (10.2 s) and before `num` is written (14.4 s). No lock, no progress indicator (read). The UI freezes up to 2.7-4.3 s at once (T) and 7.9 s (5,119).
- **Critical zone**: yes, the cost sits in it (`useJjomSync.ts` 1.48 s inclusive, `DynamicHandles.tsx` 0.51 s self, in the profile of T). Named, not touched. No TRANSACTION around creators is proposed (NN-12).
- **A silent data loss was found** (section 5, ticket filed): at 5,119 objects the attribute writer can run before the last commit; in two of three runs 2,048 of 2,560 `Const` objects lost `num`, and nothing reports it to the user.
- **Recommendation**: A, then B (section 6). A is one file and removes most of the CPU and the 5,119 loss, but moves the canvas cost to the end instead of removing it; that moved cost is **not measured**.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The executor is the slow part | falsified | executor about 0.1 s; click to executor end 0.14-0.18 s (measured) |
| H2 | The time is polling (sleeping), not CPU | falsified for T with the tab open, holds for deep trees and for the tab-not-open case | 1.7 s asleep of 21 s in T; c60 11.7 s asleep of 20 s (measured) |
| H3 | Cost is linear in the number of objects | partly | `addObject` linear (0.23 / 0.45 / 1.16 / 2.62 s); reducer/dispatch and long tasks superlinear (measured, tab not opened) |
| H4 | The cause is single | falsified | canvas (tab open), commit cadence (300 ms per level), per-action reducer cost, two fixed 1,000 ms timers (measured and read) |
| H5 | The write-back is safe at any size | falsified | attribute race at 5,119 objects (section 5) |

## 2. Files read

- `~/.jjodel-lanes/P-2026-11-03-0703/handoff.md` (whole, 139 lines; the only artefact of the measuring lane read in this session)
- `frontend/src/components/project/ProjectEditor.tsx` lines 2286-2300
- `frontend/src/redux/reducer/reducer.ts` lines 1511-1515
- `frontend/src/redux/action/action.ts` lines 347-351
- `docs/log-inbox/hw-notation.md` lines 265-279 (the three open tickets)
- The other code lines cited below (`nestedMaterialization.ts`, `joiner/classes.ts`, `U.tsx`, `instance.ts`) were read by the measuring lane and are quoted from its handoff; they were **not** reread here.

## 3. The split (measured unless marked)

Scenario T = `b10_8`: 2,559 objects, 11 walk levels, output tab open. Three unprofiled runs.

| Phase | When (from click) | Note |
|---|---|---|
| Executor | 0.14-0.18 s | itself about 0.1 s |
| STEP 6 TRANSACTION + 6b DVertex | about 3 ms | |
| STEP 8 timer, fixed | walk starts at 1.15-1.19 s | `}, 1000); // 1 second delay — generous, ensures everything is propagated` at `ProjectEditor.tsx:2298` (read) |
| Nested walk (STEP 6c) | ends 8.8-10.2 s (7.6-9.0 s long) | `addObject` synchronous total 1.23 s (`DObject.new3` 1.0 s) over 2,558 calls; 32-34 polls of 50 ms (about 1.7 s asleep) |
| Walk end to attributes written | 14.0-14.4 s | the second fixed timer (`}, 1000);` at `ProjectEditor.tsx:2289`, read) stretched to about 4.1 s by long tasks |
| Settled (no long task for 3 s) | about 21 s | long tasks total 14.5-14.8 s, max 2.1-2.4 s; event-loop lag max 2.7-4.3 s; 210-229 React commits |

Profiled T (CDP at 1 ms; phase-window alignment error about 0.1-0.2 s, executor CPU lands in the next window): wall 21.5 s, busy 16.2 s, idle 4.5 s. Windows: step 6 + timer 1.0 s (0.19 busy); walk 9.3 s (7.6 busy, 1.7 idle = the polls); walk to attributes 4.1 s (all busy); after 6.8 s (4.3 busy).

Inclusive: react-dom 6.5 s (synchronous commits and passive effects); (program) 4.5 s (native layout/paint); `redux/action.ts` 4.3 s; reducer 2.5 s; `LModelElement` 2.9 s; `useJjomSync.ts` 1.48 s; react-redux 1.3 s. Self, top: `PointedBy.add` (`joiner/classes.ts:1986`, the idlookup/pointedBy copies in the reducer) 1.83 s; the `Action` constructor (`action.ts:301-313`, `new Error().stack` per action) 1.44 s; proxy `get0` 1.26 s. Dev only: 3,095-5,143 react-redux "Selector unknown returned a different result" warnings per run (the dev stability check runs selectors twice), so part of the React figure is not production.

Ablation `open2` (tab never opens), profiled: walk ends 5.2 s, attributes 6.2 s; busy 3.6 s (against 16.2 s); long tasks 2.9 s (against 14.6 s); lag max 0.85 s; 79 commits; 15 vertices. The walk is 4.0 s = 1.6 busy + 2.4 idle. Remaining CPU: `action.ts` 2.5 s inclusive, reducer 1.6 s, `LModelElement` 1.2 s, `nestedMaterialization` 1.2 s.

## 4. Growth, polling versus CPU, depth

Tab open (measured; attributes-written time from click):

| Objects | Shape (levels) | Walk end | Attributes written | Long tasks |
|---|---|---|---|---|
| 511 | b7_7 (8) | 3.5 s | 4.8 s | 2.7 s |
| 1,023 | b8_8 (9) | 5.0 s | 6.6 s | 5.3 s |
| 2,559 | b10_8 (11) | 8.8 s | 14.2 s | 14.6 s |
| 5,119 | b11_9 (12) | 18.9-19.3 s | 23.0-23.3 s, then a 5.3-5.4 s dispatch (26,624 actions) | 27-35 s, longest 7.1-7.5 s; lag max 7.6-7.9 s; more than 41 s to settle |

Tab not opened (`open2` ablated, measured): attributes at 4.3 / 4.7 / 6.0 / 11.6 s; long tasks 0.44 / 0.88 / 2.9 / 8.7 s; dispatch total 0.22 / 0.48 / 1.58 / 5.64 s; `addObject` synchronous 0.23 / 0.45 / 1.16 / 2.62 s. Per-action reducer cost rises with the batch/store size: 16 us per action at 3,456 actions, 64 us at 21,504, 200 us at 26,624.

Depth against width (tab open, measured): `b5_5` 127 objects, 6 levels: attributes at 3.7 s. `c60` (comb) 123 objects, 61 levels: attributes at 20.0 s, 234 polls (about 11.7 s asleep). Gap between levels min/median/max 224/303/383 ms (`b5_5`) and 109/301/364 ms (`c60`). Depth sets a floor of about 300 ms per level; width costs CPU.

Why about 300 ms per level (read by the measuring lane, not reread here): the app keeps a transaction block open and commits it every `U.UpdatingTimer` = 300 ms (`redux/reducer/reducer.ts:1513`; verified here: `documentEventsIntervalId = setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);`); the commit dispatch is a `setTimeout(0)` (`action.ts:349`; verified here: `setTimeout(()=>storee.dispatch({...this}), 0);`); a new level's slots answer only after that commit; the walk polls every 50 ms (`SLOT_POLL_MS`). Precedent of an explicit flush: `jjscript/executor/commands/instance.ts:410-414`, `settlePendingWrites` (COMMIT(undefined,false) plus `setTimeout` 0).

## 5. What the user sees, and the silent loss

Measured on T with screenshots `ux-b10_8-*.png` (in the probe directory): STEP 7 opens the `out1` tab at +2 s; toast "Transformation Executed — Created model "out1" with 1 instances." (counts roots only); the canvas fills during the walk, all nodes labelled `Add_0 : Add`; the status bar already said "2559 instances · conforms to Tgt" at +8 s, before the walk end (10.2 s) and before `num` (14.4 s); the JjTL output panel says completed right after the executor. No lock or progress indicator (read: nothing in `ProjectEditor` guards edits). Edits during the walk were **not tried** in the UI. Read, not run: a parent deleted mid-walk makes its slot not answer; after 3,000 ms its subtree is reported unplaced (`nestedMaterialization.ts:215-229`).

Silent loss, measured at 5,119 objects (12 levels): the nested-attribute writer (STEP 8, `ProjectEditor.tsx:2165-2189`, 1,000 ms after the walk end) can run before the commit that creates the last level's slots. Result: 2,048 times `[ProjectEditor] Feature "$num" not found`, only 512 of 2,560 `Const` objects keep `num`, still 512 after 10 s (run `grow3`; run `grow` also ended at 512; run `grow2` wrote 2,560). The writer ran at 23,285 ms, the 26,624-action dispatch at 23,296 ms: an 11 ms margin. Two of three runs lost. Not seen at 2,559 (5 of 5 runs complete). The existing runs do not say whether a smaller tree under load can hit it: the margin there was not measured, and no run was made under high load. The window is closed by a fixed timer plus a stretched commit, so a loaded machine is a plausible, **unmeasured**, way to reach it. Ticket filed (section 8).

## 6. Critical zone and candidates

Critical zone (Q4): yes. With the tab open `useJjomSync.ts` auto-populates a DVertex per nested object (2,573 vertices against 15 without the tab; 2,558 made by the auto-population, STEP 6b makes 1): `useJjomSync` 1.48 s inclusive and `GraphDataElements` DVertex 0.53 s in the walk; `DynamicHandles.tsx` (the handle pipeline next to `portDistribution.ts`) 0.51 s self. Named, not touched.

Candidates (gains measured for T on the dev server where stated):

- **A. Open the output tab after the write-back** (move STEP 7 into the `nestedDone` chain). File: `ProjectEditor.tsx` only. Measured by ablation: attributes written 14.0-14.4 s to 6.0-6.2 s; CPU 16.2 to 3.6 s; freeze 2.7-4.3 s to 0.85 s; at 5,119, 23 s+ with data loss to 11.6 s with no loss. Caveat: the canvas cost when the tab opens at the end is **not measured** (probe mode `WB_OPENAFTER` was edited but never applied or run). It is moved, not removed. Unknown too: whether the data-loss race stays closed once the tab is opened later, only that the ablated runs wrote 2,560 of 2,560.
- **B. Flush per level instead of waiting for the 300 ms commit** (the `settlePendingWrites` pattern), and replace the two fixed 1,000 ms timers with a flush plus a wait. Files: `ProjectEditor.tsx`, `nestedMaterialization.ts` (and its test). Gain is **read, not measured**: up to about 250 ms per level (T about 2.5-3 s; c60 about 15 s) plus 1-2 s of fixed timers. Not a TRANSACTION around creators. A flush before the attribute write would also close the 5,119 race by construction.
- **C. Core costs** (needs approval, NN-5): the `Action` constructor stack capture (1.44 s self in T) and the `PointedBy.add` copies (1.83 s self), the superlinear part. Files `joiner/classes.ts`, `redux/action/action.ts`. Not measured as a change.

**Recommendation**: A first (largest effect, one file, closes the loss in the measured runs), then B (removes the sleeping floor and the race by construction). The cause is not single: canvas, commit cadence and per-action reducer cost each need their own step. The unmeasured part of the recommendation is the canvas cost of A once the tab opens at the end: if it is paid in one block it may freeze the UI for as long as the 2.7-4.3 s of today, only later.

## 7. Production: not measured

The production build was made (`npm run build` exit 0, 1m46s, `dist/` 94 MB, gitignored) and the fixtures exported (`fixture-b{8_8,10_8,11_9}.json`), but the run (`WB_PROD=1`) was not made by the measuring lane: the load jumped to 82 after the build. Every figure above is dev server. The React warnings listed in section 3 and part of the React and `Action` costs are dev-mode costs; the production gain of A and B can be smaller or different. (Appended in a second commit if the production run is made in this session; otherwise this section stands.)

## 8. Dependencies, risks, open questions

Risks: A changes when the user sees the output (the tab appears after the write-back; for T that is 6 s later instead of 2 s) and touches only `ProjectEditor.tsx`; B touches the walk, which has tests. Neither touches `useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts` or `VersionFixer.tsx`, but A changes what `useJjomSync` receives and when, so a Layer Impact Report is owed before any diff (CLAUDE.md 3.2).

Open questions:

1. Is a tab opening 6 s later (T) acceptable for the user, or must it open at once and fill? (decides A against B first.)
2. Does a smaller tree under machine load reach the attribute race? (needs a loaded run; not made.)
3. What does the canvas cost when the tab opens after the write-back (`WB_OPENAFTER`)?
4. What do the figures read in production (`WB_PROD=1`)?
5. Edits during the walk (delete, rename of a parent) were not tried in the UI: is a guard wanted?
