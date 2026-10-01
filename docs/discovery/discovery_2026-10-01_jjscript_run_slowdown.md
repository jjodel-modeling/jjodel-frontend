# Discovery: JjScript Run slows down run after run — where each dispatch's main-thread time goes

Prompt-ID: P-2026-10-01-2136 · prompt `docs/prompts/claude_2026-10-01_2136_prompt_jjscript_run_slowdown.md` · session `9f3f5ce8-65bd-461c-a7ad-0936be8d7c07`
Tree: `~/jjodel-w-runperf`, branch `jjscript-run-perf`, HEAD `3b045d6bb` · executor: Anthropic Claude Opus 5.5 · Phase 1, measurement only, no production file changed.
This report is a set of hypotheses with evidence. Whoever uses it downstream rereads the real files.

## 0. Answer in brief

1. **Reproduced.** Probe on port 3004, headless Chromium, dev server, `3b045d6bb`. The same 16-line script run 12 times into `metamodel_1`, with the summary closed after each run, takes 1.45 s on run 1 and 9.1 s on run 12. A second baseline gave 12.0 s on run 12. Objects go from 47 to 355. Per command at run 12: `apply` 8 ms, waits overrun 500 ms, a command with no wait takes 400 ms. The chat's run 11 had 5.8 s at 372 objects.
2. **Cost per command at run 12**, in ms of main thread (total ≈ 570). Baseline CPU profile, owner = the nearest frame whose file belongs to a bucket.
   - **Visible editor (H2, active tab): ≈ 470.** 355 is owned by `editor-v2`. About 115 of the 125 that react-dom spends without an owner is the editor's too, since 95% of React render time is in the editor.
   - gc 34; native style, layout and paint 24.
   - **H1 (chat): 8.** Only the running block re-renders (`SyntaxHighlighter` 5 ms). **Past blocks: 0 renders.** Emptying the chat changes nothing measurable: run 12 is 9.3 s with the chat emptied before every run, 9.1 s without.
   - **H3 (tree): 5** of CPU plus 5 of React render. Hidden: run 12 8.9 s, within noise.
   - **H4 (accumulation): 0, falsified.** After save and reload, a fresh page with the same store (91 classes) runs in 11.6 s. The same session took 12.0 s at run 12 and 12.8 s at run 13. That is size, not history.
   - **H5 (RunSummaryDialog): 0.1 when closed.** Left open, it costs 9.5 ms per command directly. Runs are 35–90% slower (run 8: 10.6 s against 5.5 / 7.4).
   - **H2 (hidden tab)**, in the two-metamodel variant, run 12, React render per command: the **hidden** `metamodel_1` editor takes **208 ms**, the visible one 73 ms. rc-dock keeps a visited tab mounted and laid out (`visibility:hidden; height:0`, not `display:none`).
   - **Hidden tab, measured:** with `metamodel_1`'s tab open, runs into the empty `metamodel_2` stay as slow as before the switch (run 7 is 5.67 s, run 6 was 5.75 s). With the tab closed, run 7 takes **2.13 s (−62%)** and run 12 takes **6.96 s against 10.18 s (−32%)**.
3. **Mechanism.** Every dispatched action is its own task (`action.ts:349`), followed by a synchronous re-render of every mounted editor. At run 12 that means about 13 commits per command. Each one re-renders every `ClassNode`, its `DynamicHandles` and its 32 `HandleComponent`s: 240,928 handle renders in one run. The resulting DOM invalidation costs a style recalc of about 17 ms each. `fitPadding()` in render (`EditorV2.tsx:4222`) forces that recalc: 164 ms per command. But **caching it does not lower the wall time** (measured, §4.5): the recalc moves to the frame and native time goes from 24 to 156 ms per command. Waits grow because a created element becomes visible only after several such dispatches.
4. **Recommended fix 1: hidden editor tabs stop re-rendering (H2).** Gate `MetamodelTab`/`ModelTab` updates while their pane is inactive and catch up on activation. Expected gain is the closed-tab ablation, **measured: −62% on the first run into a new metamodel, −32% at run 12.** It is the chat's own scenario, `metamodel_1` inactive from run 14.
5. **Recommended fix 2: stop the node fan-out in the visible editor.** `DynamicHandles` subscribes to every edge (`useEdges()`, `DynamicHandles.tsx:97`). Select only this node's edges, and `memo` `DynamicHandles` and `ClassNode`. Direct share at run 12: about 94 ms per command of React render, plus its part of commit and style. Estimated 30–50% of a single-tab run. Not measured. It touches the handle pipeline (CLAUDE.md §3.1 cross-reference), so it needs a visual check.
6. **Not on its own:** caching `fitPadding` (measured, no gain). Pair it with fix 2.
7. **Out of reach before 2026-10-07:**
   - Batching the per-action dispatch (`action.ts:349`, core, Rule 5).
   - Incremental tree build.
   - Validation per render (`UniquenessProblemSync`, 22 ms per command, `problems/` is in the critical-zone table).
   - Virtualizing nodes.
8. **For the demo, with no code change:** close metamodel tabs not in use, close each Run summary, and demo on a small metamodel. Runs 1–3 take 1.3–2.5 s.
9. **Side finding (ticket proposed, T8).** The R-JS-3 retry of a forward reference with no wait fails under load. Line 14 failed on run 1 of every variant and sporadically later (§4.8).
10. **Decisions taken (unattended):** 8, in §7. **Decisions awaiting Alfonso:** 1, in §8: whether fix 1 may change what a tab switch shows in the demo.

Recommended: Phase 2 = fix 1 (inactive-tab gate in `MetamodelTab`/`ModelTab`) then fix 2 (`DynamicHandles` own-edges selector + memo), probe rerun before/after on `baseline` and `two-mm`.

## 1. Objective and hypotheses

Objective: attribute the main-thread cost of each dispatch during a Run to H1..H5, in ms per dispatch at run 12. Then recommend the top fixes.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Every past `ScriptBlock` and `MarkdownRenderer` re-renders on every dispatch, with a cost proportional to the blocks | **Falsified**, measured. Past blocks commit 0 fibers. The chat costs 8 ms per command, all of it the running block. Emptying the chat does not change the wall time (§4.2) |
| H2 | The inactive editor tab re-renders or re-lays out on every dispatch | **Holds**, measured. Hidden tab 208 ms per command at run 12. Closing it makes runs 32–62% faster (§4.6). It is still laid out: rc-dock `visibility:hidden`. Also, the **active** editor is by far the largest cost in every single-tab variant |
| H3 | The tree panel re-renders whole on every dispatch | **Holds, small.** Every row re-renders (read, §5), but it costs about 5 + 5 ms per command at run 12. Hidden, the wall time does not change beyond noise |
| H4 | An accumulation independent of what is mounted grows the cost | **Falsified**, measured. The same store in a fresh page is as slow (§4.4). `window.jjactions` is unbounded but small: 163 entries at run 12 |
| H5 | `RunSummaryDialog`'s `useSelector`, always mounted, is negligible | **Holds when closed** (0.1 ms per command). **Falsified when the dialogs stay open**: 9.5 ms per command direct, and runs 35–90% slower (§4.3) |

## 2. Files read

Paths are under `/Users/alfonso/jjodel-w-runperf/`.

- **Rules:** `CLAUDE.md` (in full); `docs/PROTOCOL.md` P3, P4, P11, P12, P16; `docs/decisions.md` lines 140–240 (RC-20..29) and 4965–5040 (R-JS-1..6); `frontend/src/jjscript/CLAUDE.md`.
- **Prior work:** `docs/discovery/discovery_2026-10-01_jjscript_requeue.md` (1–120); `docs/log-inbox/jjscript.md`.
- **Probe harness:** `frontend/scripts/smoke/README-probes.md`, `states.ts` (1–260), `frontend/scripts/probe/hug-supplement.ts`, `labelbox.ts` (1–50), `frontend/scripts/lane-run.mjs` (736–880).
- **Chat path:**
  - `frontend/src/jjscript/components/ScriptBlock.tsx` (in full).
  - `RunSummaryDialog.tsx` (1–140).
  - `runFigures.ts` (1–120).
  - `frontend/src/components/Jodie/Jodie.tsx` (in full), `ChatMessages.tsx` (in full), `MarkdownMessage.tsx` (1–80), `JodieHeader.tsx` (113–117).
  - `frontend/src/components/common/MarkdownRenderer.tsx` (in full).
- **Editor:**
  - `frontend/src/components/editor-v2/viewportInset.ts` (in full).
  - `EditorV2.tsx`: grep of `fitPadding`, plus 400–410 and 4218–4226.
  - `components/DynamicHandles.tsx`: 95–100, 180–200, 268–292.
- **Tabs:** `frontend/src/components/abstract/tabs/MetamodelTab.tsx` (190–197), `TabDataMaker.tsx` (18–26), `DockManager.tsx` (grep, 145–150); `frontend/node_modules/rc-dock/es/DockTabPane.js` (28–50), `rc-dock/dist/rc-dock.css` (125–135), rc-dock 3.3.2.
- **Tree and rail:** `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (3116–3119, 3303–3306, 3331–3334), `frontend/src/contexts/TreeViewPanelContext.tsx` (96–104, 300–380), `frontend/src/components/editors/PropertiesWithTreeView.tsx` (966–970).
- **Store and global:** `frontend/src/redux/action/action.ts` (345–351), `frontend/src/redux/reducer/reducer.ts` (76–80, 100–106, 605–618, 1196–1202, 1258–1266), `frontend/src/components/forEndUser/Try.tsx` (285–292), `frontend/src/pages/components/Dashboard.tsx` (600–630).
- **Persistence and project:** `frontend/src/components/topbar/SaveManager.ts` (25–60), `frontend/src/api/persistance/projects.ts` (120–135), `frontend/src/pages/components/LeftBar.tsx` (345–395).

A read-only subagent surveyed the subscriptions of `App.tsx`, `Try.tsx`, `Dock.tsx`, `ContextMenu.tsx`, `ModelTab.tsx`, `EditorSwitch.tsx`, `EditorV2.tsx`, `useJjomSync.ts`, `TreeViewContent.tsx`, `PropertiesWithTreeView.tsx`, `JodieHeader.tsx` and `ObjectNode.tsx`.
- Rechecked by hand: `Try.tsx:289`, `MetamodelTab.tsx:195`, `Dashboard.tsx:612-624`, `reducer.ts:613`, `TreeViewContent.tsx:3117,3305,3333`, `JodieHeader.tsx:115`, `DockTabPane.js:28-50`.
- Not rechecked, cited as the survey's: `Dock.tsx:435`, `ContextMenu.tsx:738`, `ObjectNode.tsx:131-136`, `TreeViewContent.tsx:2612-2616`.

Searches use `git grep` or `command grep` with the exit status read.

## 3. The probe and how to rerun it

`frontend/scripts/probe/jjscript-run-slowdown.ts`, committed as `ea6b53d92`. `bash-guard` refuses docs and code in one commit (P13), so it is in its own commit. What it does:

- It creates a project and `metamodel_1` through the UI, then opens Jjodie.
- For each run n, it injects the 16-line script with prefix `R<n>_` as an assistant reply. The reply carries `jjodieScope = {level:'M2', metamodelId, metamodelName}`. It goes in through the `{messages, isOpen}` state hook of `Jodie` (`queue.dispatch`), the path the chat used. No test hook or dev entry point exists for this: `git grep` of `__jodie` and `window.*jodie.*=` in `src/` returned nothing. The control is that the same search form finds `JODIE_PREFILL_AND_OPEN` in `events/registry.ts`, and that event only prefills the input.
- It then clicks «Run as JjScript», then «Run», waits for `.run-summary`, and closes it.
- The script: 7 classes, 4 attributes, 5 references, and one forward reference (line 14 to line 15).

Instruments. The probe installs them all; none is in the app.

1. The `[JjScript-TIMING]` TEMP-DISCOVERY lines, timestamped in the page.
2. React commits through `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`:
   - It counts components with `PerformedWork` that were visited in this render, using their `selfBaseDuration`.
   - Each one is bucketed by its nearest named ancestor, with the bucket propagated top-down.
   - Editor fibers are split by the `aria-hidden` of their rc-dock pane. No layout is read.
3. A CDP CPU profile of the profiled runs. Each sample gets the owner of the nearest frame, from leaf to root, whose module is in a bucket. A Vite deps chunk is resolved to its npm package from esbuild's `// node_modules/<pkg>/` banners.
4. A counter of the reads of `--jj-canvas-right-inset`.

Profiling overhead is the `probe instrument` bucket: at most 6 ms per command. Runs 1, 6 and 12 are profiled in the baseline, run 12 only in the ablations.

Rerun one variant. It never uses 3001; the JSON goes to `/tmp/runperf-<variant>.json`:

```
RUNPERF_VARIANT=baseline RUNPERF_RELOAD=1 ~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-runperf frontend/scripts/probe/jjscript-run-slowdown.ts --port 3004 --id P-2026-10-01-2136
```

Variants:
- `baseline`.
- `chat-empty`: the chat is emptied before each run.
- `one-tab`: every other tab is closed.
- `tree-hidden`: `localStorage.jjodel_treeview_visible='false'`, which `TreeViewPanelContext.tsx:98` reads.
- `two-mm`: runs 7–12 go into a new `metamodel_2`.
- `two-mm-closed`: the same, with `metamodel_1`'s tab closed.
- `inset-cached`: the inset is answered from a value read once.
- `summary-open`: summaries are never closed.

`RUNPERF_RELOAD=1` adds the two H4 runs.

**Noise, measured:** two baseline runs on the same tree gave 9.1 s and 12.0 s at run 12. Another server was listening on 3003 on the same machine. A wall-time difference under about 30% between variants is not conclusive. The shares inside one profiled run are.

## 4. Measurements

All on `3b045d6bb` plus the probe, headless Chromium, Vite dev server on 3004, 2026-10-01 between 19:47 and 20:25 UTC.

### 4.1 Baseline (first run of the variant)

| run | wall ms | iter sum | wait sum | apply sum | iter, no-wait mean | objects | DOM | heap MB | RF nodes | handles | tree DOM | commits | React render ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1452 | 1441 | 782 | 26.9 | 32 | 47 | 1997 | 331 | 7 | 224 | 216 | 204 | 420 |
| 2 | 1692 | 1652 | 728 | 23.3 | 48 | 75 | 2671 | 580 | 14 | 448 | 356 | 262 | 721 |
| 4 | 2586 | 2517 | 366 | 43.4 | 120 | 131 | 4019 | 519 | 28 | 896 | 636 | 187 | 1239 |
| 6 | 3994 | 3870 | 449 | 45.5 | 211 | 185 | 5313 | 443 | 41 | 1312 | 916 | 200 | 1972 |
| 8 | 5515 | 5357 | 284 | 56.3 | 284 | 243 | 6715 | 577 | 56 | 1792 | 1196 | 193 | 2691 |
| 10 | 8465 | 8301 | 781 | 120.4 | 382 | 299 | 8063 | 658 | 70 | 2240 | 1476 | 209 | 3913 |
| 11 | 8233 | 8042 | 820 | 111.1 | 386 | 327 | 8737 | 580 | 77 | 2464 | 1616 | 206 | 4027 |
| 12 | 9123 | 8936 | 933 | 122.7 | 400 | 355 | 9411 | 670 | 84 | 2688 | 1756 | 207 | 4383 |

Per command (run total / 16), CPU owner in ms:

| owner | run 1 | run 6 | run 12 |
|---|---|---|---|
| H2 editor (visible), `editor-v2` frames | 26.2 | 159.3 | 355.3 |
| react-dom, no app frame on the stack | 11.3 | 55.6 | 124.6 |
| gc | 1.9 | 9.9 | 34.4 |
| native (style, layout, paint) | 9.0 | 9.0 | 24.0 |
| model/joiner | 1.8 | 4.0 | 10.5 |
| H1 chat (Jodie, ScriptBlock, markdown, highlighters) | 6.3 | 6.1 | 7.9 |
| H3 tree | 0.4 | 1.9 | 4.7 |
| probe instrument | 0.6 | 1.8 | 4.8 |
| react-redux / redux core / jjscript executor | 0.5 | 1.2 | 3.1 |
| H5 RunSummaryDialog | 0.0 | 0.1 | 0.1 |
| project tab (Dashboard) | 0.0 | 0.1 | 0.0 |
| idle | 32.6 | 0.1 | 0.0 |

React render per command at run 12, `selfBaseDuration`:

| bucket | ms |
|---|---|
| editor (visible) | 259.6, from 34,114 fibers |
| ScriptBlock | 5.3, from 3 fibers |
| tree | 3.5 |
| project tab | 3.3 |
| rail (properties) | 1.8 |
| RunSummaryDialog | 0.1 |

Top components in run 12, as name: renders / ms:

| component | renders | ms |
|---|---|---|
| `EditorV2Inner` | 94 | 2282 |
| `HandleComponent` | 240,928 | 792 |
| `DynamicHandles` | 7,529 | 403 |
| `UnifiedEdge` | 5,217 | 168 |
| xyflow `Anonymous` | 240,736 | 142 |
| `ClassNode` | 7,529 | 117 |
| `SyntaxHighlighter` (running block) | 22 | 84 |

7,529 = 84 nodes × about 90 of the 94 editor renders: every node re-renders on every editor render.

Self time by function in run 12:
- `getPropertyValue` 2,623 ms (`viewportInset.ts` inclusive, through `EditorV2.tsx`).
- gc 550.
- `get0` (`joiner/proxy.ts`) 423.
- native 384.
- `ReactElement` 362.
- `getBoundingClientRect` 223.

Module inclusive in run 12:
- `EditorV2.tsx` 2,698.
- `@xyflow/react` 1,311.
- `DynamicHandles.tsx` 540.
- `useJjomSync.ts` 382.
- `UniquenessProblemSync.tsx` 354, of which `nameUniqueness.ts` is 331.
- `ClassNode.tsx` 312.
- `jjomTransformers.ts` 264.
- `TreeViewContent.tsx` 75.
- `ScriptBlock.tsx` 43.
- `ChatMessages.tsx` 41.

### 4.2 Chat emptied before each run (H1)

| run | baseline wall | chat-empty wall | chat-empty DOM |
|---|---|---|---|
| 6 | 3994 | 4065 | 4662 |
| 9 | 6765 | 6864 | 6270 |
| 12 | 9123 | 9330 | 7893 |

- CPU H1 at run 12 is 8.1 ms per command, against 7.9 in the baseline.
- The editor is 355.3 in both.
- 1,518 fewer DOM nodes changed nothing measurable.
- Same page, run 13 after emptying the chat (second baseline): 12.8 s, against 12.0 s at run 12.

**The chat's halving on 2026-10-01 (run 17 after emptying) is not reproduced with the summaries closed.** §4.3 is the one condition measured that moves in that direction. Run-to-run noise (§3) is the other candidate.

### 4.3 Summaries left open (H5)

| run | baseline 1 | baseline 2 | summary-open |
|---|---|---|---|
| 4 | 2586 | 3735 | 4196 |
| 6 | 3994 | 5129 | 6860 |
| 8 | 5515 | 7408 | 10606 |
| 12 | 9123 | 12045 | 12462 |

At run 12, per command:
- `RunSummaryDialog` and `runFigures` own 9.5 ms of CPU. That is the `readProjectFigures()` walk of every open dialog's selector (`RunSummaryDialog.tsx:87`).
- The editor owns 487.6, against 355.3. `viewportInset` inclusive is 3,759 against 2,623. With 12 overlays in the DOM, every forced recalc costs more.

### 4.4 H4: same store, fresh page

Second baseline (`RUNPERF_RELOAD=1`):

| state | wall ms | classes before the run | DOM |
|---|---|---|---|
| run 12 | 12045 | 77 | 9396 |
| run 13, same page, chat emptied | 12828 | 84 | 8429 |
| run 14, after `ProjectsApi.save`, reload and reopen | 11639 | 91 | 8940 |

- `window.jjactions` is reset to 3 by the reload. Run 14 is still a run-12 time, not a run-1 time.
- **Persistence:** without a save, the reload loses the metamodels. Measured in the first baseline: `metamodels: []` after reload, matching the chat's 2026-10-01 observation. With `ProjectsApi.save` first (the call `SaveManager.save` makes, `SaveManager.ts:31-34`), the project comes back with its 91 classes. The tabs do not come back; the probe reopens the tab with `DockManager.open2`.
- Heap after a forced GC at the end of the run: 355 MB, against 268 MB at setup.

### 4.5 Inset read once (`inset-cached`)

The variant answers `getPropertyValue('--jj-canvas-right-inset')` from a value read before the run.

| | baseline 1 | baseline 2 | inset-cached |
|---|---|---|---|
| run 12 wall ms | 9123 | 12045 | 10250 |
| run 12, `EditorV2.tsx` inclusive ms | 2698 | n.a. | 103 |
| run 12, native style, layout, paint per command | 24.0 | 24.7 | **156.0** |
| run 12, react-dom without owner per command | 124.6 | 175.4 | 160.4 |

The inset was read 123–196 times per run (`insetReads`, about 10 per command). Each read is a forced recalc. Removing them **moves** the recalc: the browser still has to restyle the DOM that each commit invalidated. **No wall-time gain.** The cost is the amount of invalidated DOM per commit, not the read that forces it.

### 4.6 Two metamodels (H2)

`two-mm`: runs 1–6 go into `metamodel_1`. Then `metamodel_2` is created (`createM2`, the function behind the left-bar entry) and runs 7–12 go into it. `metamodel_1`'s tab stays open and inactive.

| run | target | wall ms | RF nodes in DOM |
|---|---|---|---|
| 6 | metamodel_1 | 5749 | 42 |
| 7 | metamodel_2 (empty before the run) | 5667 | 49 |
| 12 | metamodel_2 | 10177 | 84 |

React render per command at run 12:
- **Hidden tab: 208.1 ms** (17,642 fibers).
- Visible tab: 73.4 ms (15,914 fibers).
- Hidden `EditorV2Inner`: 92 renders, 2,257 ms. It renders first, so it pays the forced recalc for both.

`checkVisibility()` counts all 84 nodes as visible. rc-dock hides an inactive animated pane with `visibility:hidden; height:0; overflow:hidden` (`DockTabPane.js:36-41`), not `display:none`. The hidden editor is still styled and laid out.

`two-mm-closed` (metamodel_1's tab closed after the switch): see §4.6.1. The first attempt stopped at the close button. It is drawn on hover only, so the probe now clicks it through the DOM.

#### 4.6.1 two-mm-closed

Rerun at 20:24 UTC, `close metamodel_1: true`. The tab is closed right after `metamodel_2` is created, before run 7.

| run | target | two-mm wall ms | two-mm-closed wall ms | change |
|---|---|---|---|---|
| 6 | metamodel_1 | 5749 | 5697 | (same state) |
| 7 | metamodel_2 | 5667 | **2125** | −62% |
| 8 | metamodel_2 | 6904 | 2807 | −59% |
| 10 | metamodel_2 | 9236 | 4749 | −49% |
| 12 | metamodel_2 | 10177 | **6955** | −32% |

At run 12, per command:
- Editor CPU is 263.8 ms against 376.6 in `two-mm`.
- React render: only the visible editor remains, at 196.2 ms against 208.1 hidden + 73.4 visible.
- DOM is 6,491 against 8,940.

The gain shrinks as `metamodel_2` grows, because its own visible editor is the next cost: that is fix 2. Run 12 of `two-mm-closed` (41 nodes visible) is slower than run 6 of the baselines (41 nodes; 4.0 and 5.1 s). The tree, which still lists both metamodels (1,781 DOM nodes against 916), and the noise of §3 account for that gap.

### 4.7 Other ablations

- **`tree-hidden`.** `TreeViewContent` is not mounted, checked at setup. Run 12: 8890 ms, against 9123. H3 CPU per command goes from 4.7 to 0.0; the editor is 326.2. Within noise.
- **`one-tab`.** In the single-metamodel layout, the only other tab is the project tab, and it is not closable (`MyRcDock.tsx:220,350` `closable: false`; the probe's close returned `false`). The variant equals the baseline: run 12 is 10,307 ms. That is why `two-mm` and `two-mm-closed` were added.

### 4.8 Side finding: the forward-reference retry under load

Line 14 is `create reference reviews in R<n>_Book type R<n>_Review`. Its target is created on line 15.

It ended as a final error with `Unknown type 'R<n>_Review' for reference 'reviews'`:
- on run 1 of every variant;
- on `tree-hidden` run 5;
- on `inset-cached` runs 5 and 9;
- on `summary-open` run 11.

Read cause, consistent with R-JS-1's note that `type-reference` is `required: false` (`dependencies.ts:205-235`, cited from `docs/decisions.md`):
- Pass 2 retries line 14 with no wait.
- `R<n>_Review` is not yet visible to the resolvers.
- Pass 3 never comes, because pass 2 made no command succeed (R-JS-3).

The heavier each dispatch, the more often it fails. Proposed as ticket T8.

## 5. Code findings (read)

- **One task and one render per action.** `action.ts:349`: `setTimeout(()=>storee.dispatch({...this}), 0); // force action execution to be async`. A command fires several actions, so about 13 commits per command at run 12.
- **Forced style recalc in render.** `EditorV2.tsx:4222`: `fitViewOptions={{ padding: fitPadding(), maxZoom: 1 }}`. Through `viewportInset.ts:13-14`, that is `getComputedStyle(document.body).getPropertyValue('--jj-canvas-right-inset')`.
- **Visited tabs stay mounted.** rc-dock `DockTabPane.js:46-48`: `// when cached == undefined, it will still cache the children ...` and `const isRender = cached === false ? active : this.visited;`. Tabs have no `cached` (`TabDataMaker.tsx:19-25`): `closable: true, content: <MetamodelTab modelid={model.id} key={model.id} />`.
- **The editor re-renders on every dispatch.** `MetamodelTab.tsx:195`: `ret.model = LModel.fromPointer(ownProps.modelid);`. It is a new proxy on every dispatch, so the subtree `EditorSwitch` › `EditorV2` › `EditorV2Inner` re-renders: there is no `memo(` in `editor-v2` (survey; control: the same search finds `MarkdownRenderer.tsx:297`).
- **Every node's handles re-render on any edge change.** `DynamicHandles.tsx:97`: `const edges = useEdges();`.
- **The tree rebuilds whole on every dispatch.** `TreeViewContent.tsx:3117`: `ret.metamodels = metamodels.map((mm) => {`, plus `:3305` `for (const id in lookup) {`. It is connected (`:3333`).
- **The project tab.** `Dashboard.tsx:612-624`: a `useSelector` walks all of `idlookup` and reads `compiled_css` of every view, on every dispatch. Measured cost: 3.3 ms per command of React render at run 12.
- **Every `Try` re-renders.** `Try.tsx:289`: `ret.stateUpdateTime = rendercount++;`. Its children bail out; the measured cost is below 0.1 ms per command.
- **Unbounded action history.** `reducer.ts:613`: `windoww.jjactions.push(action);`, with no limit. The undo stacks are capped: `reducer.ts:79` `const MAX_HISTORY = 100;`.
- **The chat.**
  - `ScriptBlock` holds no store subscription. Its `RunSummaryDialog` holds one: `RunSummaryDialog.tsx:87` `useSelector(() => (isOpen && before ? readAfter() : null), figuresEqual)`. It is cheap when closed and walks the project when open.
  - `ChatMessages.tsx:380` and `JodieHeader.tsx:115` call `store.subscribe` and unsubscribe on unmount.
  - `MarkdownRenderer` is `memo` (`:297`), and its `onJjScriptExecute` stays stable while the metamodel count does not change (`ChatMessages.tsx:72-74`).
  - `Jodie` is not re-rendered by its parent on a dispatch: `App`'s `mapStateToProps` returns primitives, per the survey.

## 6. Risks

- **Environment.** Headless Chromium on a dev server, with the React development build. ProfileMode is on in dev for everyone, because react-refresh installs the DevTools hook. Absolute times differ from the chat's built-in browser: ours are slower, run 11 took 8.2 s against 5.8 s. The shares are what transfers.
- **Noise.** Two identical baselines differ by 32% at run 12, so the ablation walls are indicative only.
- **Fix 1** changes when an inactive editor updates. Activation must catch up before the first paint, or the tab shows stale nodes for a frame. If it is done by unmounting (`cached: false`), a tab switch re-fits the view and loses selection.
- **Fix 2** touches the handle rendering pipeline. Handle positions are measured by `getBoundingClientRect` after a double rAF (`DynamicHandles.tsx:268-292`), so a memo that skips a needed re-render shows stale anchors. Visual check required.
- **Estimates.** The gain of fix 1 is the closed-tab ablation (§4.6.1): a gate that skips updates while hidden should save most of it, but not the hidden subtree's share of layout if it stays mounted with `visibility:hidden`. The gain of fix 2 is an estimate from render shares.

## 7. Decisions taken (unattended)

- **D1.** The baseline follows the prompt: one metamodel, 12 runs. Ablation (b) was a no-op there (§4.7), so the pair `two-mm` / `two-mm-closed` was added to measure the inactive tab the chat saw.
- **D2.** The tree is hidden through its persisted switch (`jjodel_treeview_visible='false'`, the state ⌘B leaves behind), not a click.
- **D3.** "Per dispatch" is reported per command (run total / 16): one command fires several actions, and the TEMP-DISCOVERY lines are per command. The attribute line (line 3) is reported as its own window too (JSON `attr` windows).
- **D4.** H4 is checked with a save before the reload, because without it the reload loses the metamodels. It calls `ProjectsApi.save`, the call `SaveManager.save` makes.
- **D5.** Two variants beyond the three of the prompt: `inset-cached`, which measures a candidate fix without editing the source, and `summary-open`, the open-dialog half of H5.
- **D6.** `metamodel_2` is created with `createM2`, the left-bar entry's own function, because the entry is not in the DOM after the first tab opens.
- **D7.** Profiled runs: 1, 6 and 12 in the baseline, 12 in the ablations. The instrument's cost is reported as its own bucket.
- **D8.** The probe lives at `frontend/scripts/probe/jjscript-run-slowdown.ts`. The name was checked as free first (`ls scripts/probe/jjscript*` matched nothing). The `_tmp_` scout, chain and summarizer files under `scripts/smoke/` are gitignored and not committed.

## 8. Decisions awaiting Alfonso

1. If fix 1 is done by unmounting inactive tabs (`cached: false`) instead of gating their updates, switching to a metamodel tab during the MODELS demo re-fits the view and drops the selection. That changes what the demo shows (RC-26). Recommended: gate updates, keep the tabs mounted; then nothing here waits for Alfonso.
