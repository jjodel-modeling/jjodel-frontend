# Discovery 2026-10-21 — large model: the residual delay after the night fixes (round 3)

- Prompt-ID: P-2026-10-21-0905 (chat C-2026-10-20-0839), Phase 1, read-only on product code
- Tree: `~/jjodel-w-perfround3`, branch `perf-round3`, HEAD `e055f15e1` (all measures on this version, plus this
  lane's probe changes)
- Executor: Anthropic Claude Opus 5.5 (session banner)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
  the real files.

## 1. Objective

After the three night merges (`bfab138ba` lazy References, `2e9a4dd6c` core name scans, `d9ea6a486` incremental
sync), Alfonso feels «Jjodel harness» as better but «always a bit delayed». The goal is to find the remaining delay from
what a user feels: (1) the save path; (2) the per-step residual (`measureIntrinsic`, MiniMap, `parsePathPoints`,
`get0`); (3) input latency as felt; (4) dev versus production; (5) ranked fixes.

## 2. Method

The probe is `frontend/scripts/probe/large-model-click-profile.ts`, extended by this lane (`chore(probe)` commit). All
new steps are opt-in:
- every profiled step and click now reports the saves that ran inside it (`U.compressedState` and `ProjectsApi.save`
  wrapped in the page: start, duration, `silent`, caller frames), the long tasks inside a save, and storage writes over
  20,000 chars;
- `idle`: 20 s with nothing done;
- `lat`: profiler off. 10 selection clicks measure pointerdown (`event.timeStamp`) to the first `requestAnimationFrame`
  callback whose DOM shows `.mm-node.selected` on the clicked node. 3 drags of 20 moves measure each pointermove to the
  first rAF in which the node's `transform` moved. Event Timing (`PerformanceEventTiming`, threshold 16 ms) gives the
  longest entry per `interactionId`, which is the INP measure. `CLICK_LAT_DURING_SAVE=1` starts a `compressedState`
  right before each drag;
- `session`: drag 100 px, 3 s, rename (type one character, Enter), 3 s, drag back, profiled over 30 s from the first
  edit plus any save still running. Each long task goes to «save» when it overlaps a `compressedState` call, otherwise to
  the last edit started before it;
- `CLICK_ABLATE=minimap`: `localStorage['jjodel.showMinimap']='false'` before the editor mounts. EditorV2 reads it once,
  at `EditorV2.tsx:776`;
- `benchSave` reports the long tasks of each run and, in dev, `JSON.stringify` with `proxyToIdReplacer` measured on its
  own.

Runs (labels match `frontend/.vite-cache/perfclick-<label>*`, gitignored). Dev runs used
`lane-run probe … --port 3047 --id P-2026-10-21-0905`; their stdout is in
`~/.jjodel-lanes/P-2026-10-21-0905/probe-large-model-click-profile.log`. Production ran on `npm run build` plus
`npx vite preview --port 3048`, with `CLICK_PROD=1`.

| Label | Steps | Build | Time |
|---|---|---|---|
| `dev-r3a-1` | idle, lat, session, vp | dev | 09:25 |
| `dev-r3b-1` | open, lat, drag, (type), commit, vp | dev | 09:29 |
| `prod-r3b-1` | open, lat, drag, (type), commit, vp | prod, clean | 09:35 |
| `prod-r3a-1` | idle, session, vp | prod, clean | 09:37 |
| `prod-r3-latsave` / `prod-r3-latctl` | lat with and without a save running | prod, clean | 09:39 / 09:41 |
| `prod-r3b-minimap` | B steps, MiniMap off | prod, clean | 09:43 |
| `prod-r3b-intrinsic` | B steps | prod, intrinsic-cache ablation | 09:47 |
| `prod-r3b-both`, `prod-r3b-all3` | B steps; all3 adds MiniMap off | prod, intrinsic + inset ablation | 09:52-09:57 |
| `prod-r3b-2`, `prod-r3b-minimap2` | B steps; the second with MiniMap off | prod, clean rebuild | 09:58-10:00 |

**Noise warning.** At 10:00 the machine (8 cores) had a load average of 209 / 93 / 45 (1, 5, 15 min), with `secd`,
Passwords, Microsoft To Do and `rustc` from other sessions using the CPU. At 10:02 it was still 151. Runs after about
09:50 are contaminated: `prod-r3b-minimap2` is worse than both baselines on every step. Every ablation below is one run,
and only the larger effects are reported as signal.

Source ablations were temporary edits made by a script, built into `dist`, then reverted with `git checkout --`
straight after the build. Each revert was checked: `git diff --stat` showed only the probe file. They were never
committed. The final `dist` is a clean rebuild with 0 ablation markers.

Files read (full paths under `/Users/alfonso/jjodel-w-perfround3/frontend/`):
- `src/components/editor-v2/hooks/useLayoutAutosave.ts` (whole file)
- `src/components/editor-v2/hooks/layoutAutosaveScheduler.ts` (1-108)
- `src/api/persistance/projects.ts` (95-204, `save`)
- `src/common/U.tsx` (415-454, `compressedState`)
- `src/components/editor-v2/viewpoint/ir/useContentSize.ts` (whole file)
- `src/components/editor-v2/viewportInset.ts` (1-30)
- `src/components/editor-v2/EditorV2.tsx`: 776-790, 1193-1206, 1268-1280, 1672-1682, 2385-2398, 4440-4572 and
  4805-4830, plus the `scheduleLayoutSave` and `fitPadding` call sites listed by grep
- `src/components/editor-v2/nodes/ObjectNode.tsx` (980-993, plus the `selected` class lines)
- `src/pages/components/Project.tsx` (150-205)
- `node_modules/async-lz-string/src/compressor.ts` (127-151) and `src/wait.ts`

Baseline: `npm run typecheck` exit 0, no `error TS` (`.agent-logs/typecheck-20261021-092039.log`). The worktree had no
`node_modules`, so a temporary symlink to `~/jjodel/frontend/node_modules` was created for the gates and is removed at
the end (P14).

## 3. Findings (measured unless tagged «read»)

### 3.1 The save path (item 1)

When a save runs («read», plus the call stacks the probe captured):
- Only the layout autosave runs during ordinary work. `scheduleLayoutSave` is called on drag end
  (`EditorV2.tsx:4525`), on resize (:4569), after undo or redo (:1204), on collapse (`ObjectNode.tsx:991`), on hull
  edits, and when a vertex is created in a container. It is a silent `ProjectsApi.save` that fires after 15 s of quiet,
  or at the latest 120 s after the first gesture (`useLayoutAutosave.ts:78,91`). It is flushed on `visibilitychange`,
  `pagehide` and unmount.
- A rename commit, a selection click or a viewpoint switch schedules no save (measured: 0 saves in those steps when no
  earlier gesture was pending).
- Round 2 put «the viewpoint switch triggers one» in its notes. That save was the drag's pending autosave firing 15 s
  later, inside the vp window. The B runs reproduce it: a save at +3.65 s in the vp step, with the stack
  `layoutAutosaveScheduler fire < useLayoutAutosave`, not `flush`.
- Idle for 20 s: 0 saves, 0 long tasks, 0 dispatches (dev and prod).

| Measure | dev | prod |
|---|---|---|
| `compressedState` wall (bench, 2 runs each) | 5701, 5608 / 5869, 5590 ms | 5929, 5530 / 5167, 4817 ms |
| the autosave inside the session | 5783 ms, at +25.8 s | 4437 ms, at +23.5 s |
| long tasks inside a save | 0 (one run: one task of 112 ms) | 0 (one run: one task of 53 ms) |
| async-lz-string CPU (self) in the session | 2554 ms | ≈ 1283 ms (`loopIteration` 925 + its caller 358) |
| `JSON.stringify(state, proxyToIdReplacer)` | 25-28 ms, 6,719,890 chars | — |
| the same without the replacer | 17-21 ms | — |
| compressed output | 421k UTF-16 chars | 418-424k |
| `localStorage.setItem('projects')` | 1 ms (422,963 chars) | 1 ms |

How the save works: async-lz-string yields with `setTimeout(0)` every 10,000 input characters
(`compressor.ts:148`), which is 672 yields on this project. Each chunk is short, so **the save produces no long task**
and the stringify step is negligible. The wall time (4.4-5.9 s) is roughly half CPU spread over many small tasks and
half timer gaps. Chrome clamps nested `setTimeout` to at least 4 ms, so 672 yields amount to 2.7 s or more of wall time
by themselves («read», not separated by measure).

What a user feels: in production, drags made while a full save is running move at a p50 of 64-69 ms and a p95 of 117 ms
per move. The same drags with no save running (control) are at 69 ms and 99 ms. The difference is within noise. **The
save is not where the felt delay is.** What it does cost is CPU for about 5 s, 15 s after each burst of gestures, and a
6.7 MB string.

Risk («read», not measured): the `pagehide` flush calls the same 5 s asynchronous save. The comment at
`layoutAutosaveScheduler.ts:81-85` says the offline write «arrives» because `localStorage` is synchronous. But the write
comes after 672 `setTimeout` yields, so on this project a gesture made in the last 15 s before closing the tab is very
likely lost (the «Unsaved changes» prompt remains as a safety net).

A save on unchanged state: the scheduler is only called by gestures that wrote to the D-layer. A save with nothing
changed happens only when a gesture is a no-op, such as a drag back to the start (the session's two drags cancel out,
yet one save still runs). That case was not isolated.

### 3.2 Per-step totals, dev versus production (items 2 and 4)

Long-task sum / CPU busy, in ms. Clean builds, before the load spike.

| Step | dev `dev-r3b-1` | prod `prod-r3b-1` | prod `prod-r3b-2` (under load) | dev-only share |
|---|---|---|---|---|
| open (tab + viewpoint) | 3816 / 4049 | 3345 / 3543 | 3121 / 3375 | 12 % |
| click Activity | 691 / 967 | 441 / 712 | 470 / 735 | 36 % |
| click gateway | 660 / 824 | 367 / 571 | 392 / 652 | 44 % |
| drag 100 px (10 moves) | 1634 / 2056 | 1427 / 1881 | 1400 / 1772 | 13 % |
| commit (Enter) | 666 / 917 | 464 / 704 | 609 / 852 | 30 % |
| switch viewpoint, autosave inside | 1987 / 2973 | 1427 / 2040 | 2023 / 3390 | 28 % |
| switch viewpoint, no save (A runs) | 2210 / 2596 | 977 / 1305 | — | 56 % |

Session over 30 s (drag, 3 s, rename, 3 s, drag back), long tasks by cause:

| Cause | dev `dev-r3a-1` | prod `prod-r3a-1` |
|---|---|---|
| drag 1, until the rename | 12 tasks, 2261 ms (max 818) | 6 tasks, 806 ms (max 302) |
| rename | 4, 506 (max 314) | 3, 338 (max 233) |
| drag 2 | 14, 1651 (max 315) | 3, 457 (max 288) |
| after the last edit | 2, 301 | 1, 120 |
| inside the autosave | 0 | 0 |
| total, first 20 s / whole 30 s | 4609 / 4719 | 1721 / 1721 |

In the 30 s session, production blocks the main thread for 1.7 s, all of it inside the three gestures; the save adds
none. One dev run had a 110 ms task 5 ms after the save ended, next to the storage write; it was not attributed.

### 3.3 Input latency as felt (item 3)

| Measure, ms (p50 / p95) | dev a-1 | dev b-1 | prod b-1 | prod latctl | prod b-2 (load) |
|---|---|---|---|---|---|
| pointerdown to the frame with the selection ring (n=10) | 161 / 218 | 166 / 202 | **107 / 141** | — | 123 / 151 |
| click INP, the longest Event Timing entry (n=10) | 176 / 232 | 192 / 224 | 136 / 160 | — | 144 / 176 |
| pointermove to the frame that moved the node (n=60) | 93 / 184 | 99 / 235 | **81 / 136** | 69 / 99 | 77 / 145 |
| drag INP, pointerdown/up (n=3) | 448 / 512 | 416 / 584 | 376 / 416 | 312 / 320 | 360 / 432 |

How to read it:
- The ring appears in the same frame as React Flow's `.selected` class every time (identical columns). It comes about
  7 frames after the click in production.
- The click keeps the thread busy after that frame. Production click long tasks are `[122, 319]` and `[112, 255]`: the
  ring paints after the first task, then a 255-319 ms task follows. Input arriving in that window, such as a second
  click or the start of a drag, waits for it.
- A drag runs at about 12 frames per second in production (p50 81 ms per move). The release (pointerup) costs 312-416 ms
  INP, which is the 464 ms long task at the end of the drag step (position commit, sync, autosave scheduling). This is
  the «hitch at release», not decomposed by this lane.
- Every movement in the probe's drags was framed (`unframed: 0`).

### 3.4 Residual by function, and ablations (item 2)

Self time (ms) per step from the CPU profiles of the clean runs:

| Function | prod open | prod click | prod drag | prod commit | prod vp | dev drag | dev session |
|---|---|---|---|---|---|---|---|
| `measureIntrinsic` (`useContentSize.ts:54`) | 496 | 107-111 | **431** | 28 | 0 | 607 | 1448 |
| `getPropertyValue` from `getCanvasRightInset` (`viewportInset.ts:14`) | 58 | 43-54 | 0 | 0 | **177** | 0 | — |
| `get0` (`proxy.ts`) | 745 | 32-42 | 27 | 150 | 28 | 16 | 228 |
| edge lanes (`assignLanes` + `corridors` + `conflicts`) | 148 | 0 | 135 | 0 | 0 | 100 | 260 |
| `parsePathPoints` | 14 | 0 | 2 | 0 | 2 | 3 | — |

Two forced style and layout reads explain most of what is attributable to `src/` in a gesture:
- `measureIntrinsic` writes `max-content` styles, reads `offsetWidth/offsetHeight`, then restores, for every IR node,
  in a `useLayoutEffect` with no dependency array (`useContentSize.ts:187`). That is one forced layout per node per
  commit, and the writes in between invalidate it each time (layout thrash). The caller chain confirms it:
  `useContentSize.ts:97 < commitHookEffectListMount`.
- `getCanvasRightInset()` calls `getComputedStyle(document.body).getPropertyValue(...)`. It is called **during the
  `EditorV2Inner` render** through `fitViewOptions={{ padding: fitPadding() }}` (`EditorV2.tsx:4773`), so every render
  of the editor forces a document-wide style recalc. The caller chain confirms it:
  `getCanvasRightInset < fitPadding < EditorV2Inner` (dev vp: 314 ms). This was new in round 3; round 2 did not name
  it.

Ablations, production, one run each. ↓ marks the better side.

| Ablation | open lt | click lt | drag lt / busy | commit lt | ring p50/p95 | move p50/p95 | drag INP p50 |
|---|---|---|---|---|---|---|---|
| baseline `prod-r3b-1` | 3345 | 441, 367 | 1427 / 1881 | 464 | 107 / 141 | 81 / 136 | 376 |
| MiniMap off (`prod-r3b-minimap`, 09:43) | ↓ 2302 | ↓ 320, 292 | ↓ 639 / 1271 | ↓ 396 | ↓ 96 / 105 | ↓ 61 / 104 | ↓ 272 |
| intrinsic cached per element and content key (`prod-r3b-intrinsic`, 09:47) | 3032 | 498, 275 | ↓ **323** / 1188 | 495 | ↓ **78** / 118 | ↓ 68 / **97** | 352 |
| intrinsic + inset cached (`both`, load rising) | 3263 | 366, 198 | 1388 / 1959 * | 616 | 86 / 108 | 71 / 88 | 264 |
| intrinsic + inset + MiniMap off (`all3`, load rising) | 3489 | 576, 475 | 338 / 1514 | 445 | 81 / 109 | 65 / 89 | 288 |
| MiniMap off, rerun (`minimap2`, load 209) | 4031 | 646, 599 | 1899 / 2287 | 698 | 191 / 232 | 109 / 189 | 544 |

\* In `both`, the drag broke into 21 tasks of 51-68 ms. The long-task sum is a thresholded measure and swings with
that split, so per-move latency is the steadier figure.

Reading:
- **Intrinsic cache**: `measureIntrinsic` leaves the top of the drag and click profiles. The drag's long tasks drop
  from 12 (1427 ms) to 2 (323 ms). The ring's p50 goes from 107 to 78 ms and the per-move p95 from 136 to 97 ms. The
  per-move and ring gains held in all three intrinsic runs (78-86 ms, 88-97 ms).
- **The forced recalc moves, it does not vanish.** With the intrinsic cache, the inset read pays the pending style
  recalc: click 1 `getPropertyValue` goes from 54 to 100 ms. The inset fix only pays off together with the intrinsic
  fix, and the combined run was contaminated by load (inconclusive).
- **MiniMap off**: the first run (09:43) gave the largest gains of any single ablation: drag −0.79 s, open −1.0 s,
  ring −11 ms, per-move p50 −20 ms. The rerun at peak load is worse than the baseline everywhere, so the effect is **not
  confirmed**. The ablation was effective in both runs: 52 fewer DOM elements, and 48 React Flow nodes in this
  viewpoint. Round 2 counted 1182 `NodeComponentWrapperInner` renders per click for these 48 nodes, which means the
  MiniMap re-renders every node on each of the about 25 store commits.
- `parsePathPoints` costs ≤ 15 ms per step: not a target.
- `get0` dominates the open (745 ms prod) and is 150 ms of the commit. It is the core proxy, the remaining weight of
  L-layer reads.

## 4. Dependencies and risks

- `useContentSize.ts` sits under `viewpoint/ir/`, which the critical-zone table (`CLAUDE.md` §3.1) lists, but it is not
  a §3.2 trigger file. A cache must invalidate on everything the measure depends on: content, class, inline style,
  fonts (the hook already re-measures on `fonts.ready`), and inherited CSS such as a theme or viewpoint style change. The
  ablation keyed on `className | textContent | childElementCount | style.cssText`. That key misses a change in inherited
  CSS: a node whose font size changes through a parent class would keep a stale box. An alternative with no staleness
  risk is to batch the work: all writes, one read pass, all restores. That needs a coordinator across nodes.
- `viewportInset.ts` and `EditorV2.tsx:4773`: view only. React Flow reads `fitViewOptions` only for the initial
  `fitView`, so computing it once, or keeping it in a ref updated by the overlay's publisher, keeps behaviour
  («read»; not verified that RF ignores later changes of this prop).
- MiniMap: `EditorV2.tsx` view layer. Turning it off by default above N nodes changes what the user sees. Memoising it
  needs a look at why every node re-renders: the inline `nodeColor` arrow and the `style` object are new on every
  `EditorV2Inner` render («read», not measured).
- Save path: persistence. A Web Worker needs the state to be structured-cloned, or the 6.7 MB JSON string to be
  posted, plus the lz code in the worker. `requestIdleCallback` slicing changes nothing felt, because there are no long
  tasks today. A layout-only format changes what is written to disk and needs a VersionFixer-grade migration on load.
- Nothing here touches the sync layer or the D-layer write paths.

## 5. Ranked fixes

| # | Fix | Measured saving (prod, one run) | Layers | Persistence / core / critical zone |
|---|---|---|---|---|
| 1 | `measureIntrinsic`: cache per element and content key, or batch the read/write phases across nodes | drag long tasks 1427 → 323 ms; ring p50 107 → 78; move p95 136 → 97; self time per click ≈ 110, per drag ≈ 430, per open ≈ 500 | view (IR rendering) | no / no / yes (`viewpoint/ir/`, §3.1 table) |
| 2 | MiniMap: off by default above N nodes, or memoised (`nodeColor` and `style` hoisted, node subscription narrowed) | first run: drag −0.79 s, open −1.0 s, click −0.1 s, move p50 −20 ms; **not confirmed** (rerun under load) | view (`EditorV2.tsx`) | no / no / no |
| 3 | `getCanvasRightInset` out of the render: `fitViewOptions` computed once, or the inset cached and updated by its publisher | its self time, 43-54 ms per click, 177 vp, 58 open; only realised together with fix 1 (the recalc moves) | view | no / no / no |
| 4 | The release hitch: the 464 ms task on pointerup (drag INP 312-416 ms) | not decomposed; a discovery of its own (sync after `syncPositionBatchToJjom`, edge lanes 135 ms) | sync, view | — / — / likely (sync) |
| 5 | `get0` on open and commit | 745 ms open, 150 ms commit (self) | L-layer | core |
| 6 | Save: worker, idle slices, skip unchanged, layout-only format | no felt saving measured: 0 long tasks; move latency during a save unchanged within noise | persistence | yes / no / no |
| — | `parsePathPoints` | ≤ 15 ms per step | — | drop |

For the felt delay, fixes 1-3 together target the 255-319 ms task that follows each click and the 12 fps drag. The save
is a background cost and a data-loss risk on `pagehide` (§3.1), not a latency.

## 6. Not measured, with the reason

- Repeats: the load spike from about 09:50 (load average 209 on 8 cores, other processes) made the confirmation runs
  unusable, and the 90-minute window did not allow waiting it out. Every ablation is one run.
- Dev ablations: the source ablations ran in production only, which needed one build each (about 1 min here).
- The inset ablation alone was not run; it ran only combined with the intrinsic cache.
- The release hitch was not broken down by time inside the drag profile.
- A save after a truly no-op gesture (drag and release in place) was not isolated.
- The `pagehide` data-loss risk is read from the code, not reproduced.

## 7. Open questions for Alfonso

1. Fix 1 lives under `viewpoint/ir/` (critical-zone table). Should the lane be a content-keyed cache (cheap, with a
   residual staleness risk on inherited CSS changes) or a batched read/write coordinator (no staleness, more code)? The
   acceptance could be the probe's `lat` step in production: ring p50 ≤ 85 ms, move p95 ≤ 100 ms, drag long tasks
   ≤ 400 ms.
2. MiniMap: re-measure on a quiet machine first (one probe run, `CLICK_ABLATE=minimap`). If confirmed, would you rather
   have it off by default above N nodes (visible behaviour change), or memoised (no visible change, saving unknown
   until measured)?
3. The `pagehide` flush cannot finish a 5 s asynchronous save on this project. Should a ticket be opened for it
   (persistence: a synchronous emergency path, or rely on the «Unsaved changes» prompt)?
4. The release hitch (≈ 0.3-0.46 s on every drag end) is the largest single felt event left after fix 1. Should it get
   a discovery lane of its own?
