# Discovery: the 60 Hz render loop of a metamodel editor that holds an edge (T9)

Prompt-ID: P-2026-10-02-1450 · prompt `docs/prompts/claude_2026-10-02_1450_prompt_hidden_tab_render_loop.md` · session `f4e9d464-9abc-4c0c-a455-fe103461c33b` · chat C-2026-10-01-1725
Tree: `~/jjodel-w-hiddenloop`, branch `hidden-tab-loop`, HEAD `788d3659d` (code as `7bd293e37`) · executor: Anthropic Claude Opus 5.5 · Phase 1, measurement only, no production file changed.
This report is a set of hypotheses with evidence. Whoever uses it downstream rereads the real files.

## 0. Answer in brief

1. **Reproduced, and it is not hidden-only.** `metamodel_1` holds classes A and B and the reference `r: A -> B`. With nothing dispatched (0 store notifications), its editor renders **120 times a second hidden and 120 visible**: two per frame, 180 commits/s page-wide. The same editor with classes only renders 0 times. With the tab closed, 0. An edge alone (`B extends A`) gives 60 (§4.1).
2. **The demo build has it.** All four demo scenes loop, idle, in the hidden M2 editor and the visible M1 editor alike: 49-93 renders/s each, and the main thread **99.8-100% busy** (headless dev build, §4.5). At 42 classes (`lib6`) a single editor does the same (§4.6).
3. **Driver, measured by React's own update hooks (§4.2):** every update comes from the rAF flush of `useJjomSync.ts:249`. It runs `setNodes` (`:254`) and `setEdges` (`:257`), and the commit diffs (§4.3) show it storing objects whose content is identical to what they replace.
4. **Why it never settles (read, confirmed by counterfactuals, §4.4, §5.1).**
   - `Date.now()` in the dependencies (`useJjomSync.ts:1549`) re-runs the incremental-sync effect after every render.
   - `prevModel = {}` (`:1330`) makes every element «changed».
   - A vertex whose `data` nests an object (a class's `references[i].type`, `jjomTransformers.ts:127`; an M1 object's `features`) fails the two-level `shallowDataEqual` (`:1384`).
   - Every edge is patched with no comparison at all (`:1398`).
   - The patches are flushed in the next frame with new objects, the editor re-renders, and the effect runs again.
5. **Not** the store, not ResizeObserver (0 callbacks), not a 0-height pane (816 px), not edge routing. That is why the parked inactive-tab gate could not stop it (§5.4).
6. **Trunk and since when:** `alfonso-frontend-jjtl` at `c3a9c9ffd` has the same lines. The loop dates from `6d205bc9f` (2026-05-21), which added `Date.now()` to fix #67 (singleton) (§5.3).
7. **Recommended fix (B): a patch that changes nothing keeps identity** (§6.2).
   - The vertex test also accepts structural equality.
   - The edge merge returns the same edge when nothing changes, the same array when no edge moved, and dedup returns its input.
   - `Date.now()` and `prevModel = {}` stay, so #67 is untouched.
   - Stand-in measured: 120 to **0 renders/s**, busy to 0.0-0.1% (`ref`); `lib6` to 0 renders/s, 0.1% busy. The demo scenes go to **0 renders/s**, busy 1.0-6.8%.
   - **Critical zone: yes**, `useJjomSync.ts` (RC-30 go-ahead given at launch; Layer Impact Report first), plus a new pure module and its test.
8. **What the user sees differently: nothing intended.** Only patches equal in content are dropped. Risk R1 (§7): a view that was right only because it was redrawn every frame. The scene dumps and the chat's visual check with edges cover it.
9. **Rejected:** dropping `Date.now()` (fix A) also measures 0, but can reopen #67.
10. **Decisions taken (unattended):** 8, §8. **Decisions awaiting Alfonso:** none for fix B (§9).

Recommended: Phase 2 = fix B in `useJjomSync.ts` plus a pure `syncPatchIdentity.ts` with a vitest suite and mutation bench. Acceptance: this probe at 0 renders/s idle (hidden and visible, `ref`/`extends`/`selfref`/`lib6`/`scenes`), run-slowdown `two-mm` run 12 before and after, demo scene dumps identical.

## 1. Objective and hypotheses

Objective: find the component and the line that set state on every frame in a hidden metamodel editor with nothing dispatched, say why it never settles, whether the visible editor does it too, and the smallest fix that stops it without changing what a tab shows.

| # | Hypothesis (prompt) | Verdict |
|---|---|---|
| H-a | A `useEffect` or ResizeObserver callback sets nodes, edges or a measured size every time; a hidden pane measures 0 height and never converges | **Partly.** A `useEffect` drives it, `useJjomSync.ts:1224-1549`. ResizeObserver: **falsified**, 0 callbacks in every 5 s sample (§4.1). The hidden pane is not 0 high: it measures 816 px, the canvas 1238x776, in both states (§4.1). Size plays no part |
| H-b | A `requestAnimationFrame` loop not stopped when the pane is hidden | **Holds, as the carrier, not the cause.** One rAF per frame, scheduled by `scheduleFlush` (`useJjomSync.ts:249`) from the effect above. It is not a free-running loop: each rAF is scheduled by the render the previous one caused. It runs hidden and visible alike |
| H-c | React Flow's `onNodesChange`/dimension updates fed back into props rebuilt each render | **Falsified as the driver.** No `setNodes` comes from `onNodesChange` (every scheduled update has the stack of §4.2). React Flow's store follows: `EditorV2Inner`'s uSES hook #246 and `MiniMap`'s uSES #4 re-render after each `setNodes`, with JSON-identical values (§4.3) |
| H-d | Edge routing recomputes and stores paths each frame | **Falsified.** Every update scheduled in the samples comes from `useJjomSync.ts:254` or `:257` (§4.2); no edge-routing module is on any stack |
| T9 | Hidden only | **Falsified.** The visible editor loops at the same rate (§4.1) |
| ref | A tab with classes only does not loop | **Holds.** 0 renders per second; the loop needs an edge (§4.1) |

## 2. Files read

Paths are under `/Users/alfonso/jjodel-w-hiddenloop/` unless stated.

- **Rules:** `CLAUDE.md` (whole, as loaded); `frontend/src/components/editor-v2/CLAUDE.md` (whole); `docs/PROTOCOL.md` (whole, P1-P16); `docs/decisions.md` 140-260 (RC-20..RC-31).
- **Prior work:** `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md` (whole, with the Phase 2 addendum); `docs/discovery/discovery_2026-10-01_update_depth_loop.md` (1-80); `docs/claude-code-log.md` (1-60); `docs/log-inbox/jjscript.md` (whole).
- **Parked gate, read only, in `~/jjodel-w-runperf/frontend/scripts/smoke/`:** `_tmp_fix1_inactiveTabGate.ts` and `_tmp_fix1_wiring.patch` (whole), `_tmp_gate_scout.ts` (whole: the scout of hidden-editor renders under the gate). `_tmp_fix1_inactiveTabGate.test.ts` was not read.
- **Probe harness:** `frontend/scripts/probe/jjscript-run-slowdown.ts` (whole), `frontend/scripts/lane-run.mjs` (736-880), `frontend/scripts/smoke/states.ts` (177-189), `frontend/scripts/tsconfig.json`.
- **Subject:**
  - `frontend/src/components/editor-v2/hooks/useJjomSync.ts`: 95-270 and 1055-1568.
  - `frontend/src/components/editor-v2/utils/jjomTransformers.ts`: 105-150, 175-225, 440-490, 562-731.
  - `frontend/src/components/editor-v2/EditorV2.tsx`: 340-540.
  - `frontend/node_modules/react-dom/cjs/react-dom.development.js` 18.3.1: 151 (`enableSchedulingProfiler = true`), 4778-4809 (`injectInternals` passes `injectProfilingHooks`), 4947-4949, 5113-5132, 16755-16764 (`markUpdateInDevTools`).
- **History:** `git blame` of `useJjomSync.ts` 247-260, 1327-1334, 1384-1399, 1545-1550 and `jjomTransformers.ts` 120-128; `git show` of `6d205bc9f`, `22a123a01`, `8fad3db6c`; `git log --grep '#67'`; the trunk through `git show alfonso-frontend-jjtl:<path>`, no checkout.

Searches use `command grep` or `git grep` with the exit status read.

## 3. The probe and how to rerun it

`frontend/scripts/probe/hidden-tab-loop.ts`, committed as `a114b7bf9` (new; the name was free: `ls frontend/scripts/probe/` listed four other files). It drives the real app on its own Vite, headless Chromium, 1440x900:

- a fresh project, `metamodel_1` from the left-bar entry, its classes written line by line through `JjScriptService.execute` (the path of the parked scout);
- five phases, each sampled with nothing dispatched by the probe: `mm1-visible`; `mm1-hidden` (`metamodel_2` created with `createM2` and active); `mm1-visible-again` (tab clicked); `mm1-hidden-again`; `mm1-closed` (close button clicked through the DOM).

Instruments, none in the app:

1. React commits through `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`: commits; `EditorV2Inner` renders by model id and pane state; the components where each update enters the tree; their state, reducer and uSES hooks whose identity changed, with a shallow diff of the two values.
2. **React's profiling hooks.** The development build calls `injectedProfilingHooks.markStateUpdateScheduled(fiber, lane)` on every `setState` (`react-dom.development.js:16759-16762`). The probe's hook receives `injectProfilingHooks` from `inject` and records the stack of each scheduled update. Stacks are mapped to source lines through the inline source map Vite serves (`@jridgewell/trace-mapping`, already in `node_modules`; no new dependency).
3. Counts and scheduling stacks of `requestAnimationFrame` and `setTimeout`, ResizeObserver callbacks, Redux store notifications (the "nothing dispatched" control: 0 in every sample).
4. Main-thread busy time: CDP `Performance.getMetrics`, `TaskDuration` over the sample's wall time.

**Counterfactuals without touching the tree.** `LOOP_PATCH` rewrites the served `useJjomSync.ts` through a Playwright route, and FAILs if a rewrite did not match exactly once. Each patch matched once (`PASS ... patch <name> matched once`).

- `nodate` drops `Date.now()` from the dependencies of the incremental-sync effect.
- `nodeguard` replaces the vertex test `!shallowDataEqual(existing.data, rfNode.data)` with a JSON comparison.
- `edgeguard` skips `patchedEdges.set` when the cached edge and the new one are JSON-equal.
- `both` applies the two guards.

The JSON comparisons are probe-only stand-ins for a structural equality, not the proposed code.

Rerun, never on 3001 (JSON in `LOOP_OUT`, default `/tmp/hidden-tab-loop.json`):

```
LOOP_VARIANTS=ref,classes ~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-hiddenloop frontend/scripts/probe/hidden-tab-loop.ts --port 3014 --id P-2026-10-02-1450
LOOP_VARIANTS=ref LOOP_PATCH=both LOOP_SAMPLE_MS=3000 ... (same command)
LOOP_VARIANTS=scenes ... (the four demo exports, read only)
```

Variants: `ref` (A, B, `r: A -> B`), `classes` (A, B), `selfref` (A, `next: A -> A`), `extends` (A, B, `B extends A`), `lib6` (the run-slowdown script six times: 42 classes, 30 references), `scenes`.

## 4. Measurements

All on `788d3659d` (code `7bd293e37`), headless Chromium, Vite dev server on 3014, 2026-10-02 between 12:52 and 13:31 UTC. Samples: 5 s, 3 s for the counterfactuals.

### 4.1 Who loops

`EditorV2Inner` renders per second of `metamodel_1`'s editor, with nothing dispatched (store notifications 0 in every sample). Page-wide commits per second and main-thread busy are in brackets.

| variant | `mm1-visible` | `mm1-hidden` | `mm1-visible-again` | `mm1-hidden-again` | `mm1-closed` |
|---|---|---|---|---|---|
| `ref` (A, B, `r: A -> B`) | 119.9 (179.9; 24.8%) | **120** (179.9; 30.3%) | 119.9 (179.9; 28.3%) | **120** (180.3; 24.1%) | 0 (0; 0.1%) |
| `classes` (A, B) | 0 (0) | 0 (0.2) | 0 (0.2) | 0 (0) | 0 (0) |
| `selfref` (A, `next: A -> A`) | 120 (179.9; 23.5%) | 120 (180.2; 20.8%) | 120 (180.1; 21.7%) | 120 (180; 21.7%) | 0 (0; 1.4%) |
| `extends` (A, B, `B extends A`) | 60 (120; 12.9%) | 60 (120.2; 14.4%) | 60 (120.2; 13%) | 60 (120; 13.4%) | 0 (0; 1.1%) |
| `lib6` (42 classes, 26-29 references) | 43.1 (64.7; 99.9%) | **43.6** (65.3; 99.9%) | 43.8 (65.7; 100%) | **51.5** (77.2; 99.9%) | 0 (0.3; 0.2%) |

- **Hidden and visible loop at the same rate.** 120 renders per second is two per frame: the `setState` of the flush, then React Flow's store through uSES (§4.3). The rAF count is 300 in 5 s, one per frame, in every looping phase.
- **ResizeObserver: 0 callbacks** in every sample. Every pane, hidden or active, measured 816 px high, and every canvas 1238x776 (`getBoundingClientRect`).
- `ref` is the final run (13:28 UTC). An earlier run without the busy instrument gave the same rates: 120, 120, 120, 119.6, 0.
- The `mm1-closed` rows say the loop dies with the tab. They also say the empty `metamodel_2` editor does not loop.
- **`lib6`** saturates the main thread, so the frame rate falls and the editor renders once per frame it gets.
- `lib6`'s setup check FAILs in all three of its runs. 1 to 3 `create reference` lines out of 96 were refused because they ran 250 ms after their target class was created (lines 91; 31 and 43; 31, 47 and 63). That leaves 26 to 29 references instead of 30. It is setup only, the loop needs one.

### 4.2 What schedules each update

`ref`, `mm1-hidden`, 5 s: every update scheduled anywhere in the page, by component, pane and source line. The same in every looping phase, hidden or visible.

| updates | component | stack, mapped to source |
|---|---|---|
| 300 | `EditorV2Inner` [hidden] | `useJjomSync.ts:254` `setNodes(prev => nodeFns.reduce((acc, fn) => fn(acc), prev));` |
| 300 | `EditorV2Inner` [hidden] | `EditorV2.tsx:433` `setEdgesRaw((currentEdges) => {` ‹ `useJjomSync.ts:257` `setEdges(prev => edgeFns.reduce((acc, fn) => fn(acc), prev));` |
| 1+1 | `LastSavedIndicator` | `lastSaved.ts:116-117`, its own timer |

`requestAnimationFrame`: 300 in 5 s, all from `useJjomSync.ts:249` `rafIdRef.current = requestAnimationFrame(() => {`, called by `useJjomSync.ts:1486` `scheduleFlush();` (the node patch; with `extends` it is `:1547`, the edge patch). `setTimeout`: 1, the probe's own. ResizeObserver: 0. Store notifications: 0.

`extends` schedules only the `setEdges` row; `selfref` and `ref` both rows.

### 4.3 What the state alternates between

The diffs the commit hook recorded between the previous and the current committed value (`ref`, every looping phase):

- **Nodes, `EditorV2Inner` hook #0** (`useNodesState`, `EditorV2.tsx:405`): `Array(2)` and `Array(2)`. Node B (no reference) is the same object (`same: 1`). Node A is a new object, and only its `data` key differs, with **identical JSON**: `{"label":"A","isAbstract":false,"isSingleton":false,"attributes":[],"references":[{"id":"Pointer…_22","name":"r","kind":"as…`.
- **Edges, hook #2** (`useEdgesState`, `EditorV2.tsx:407`): `Array(1)` and `Array(1)`. The edge is a new object, and `data` differs with **identical JSON**: `{"reference":{"id":"Pointer…_22","name":"r","kind":"association","targetClassId":…`.
- **React Flow follows:** `EditorV2Inner` uSES hook #246 receives the same new node array. `MiniMap` uSES hook #4 gets `viewBB` and `boundingRect` as new objects with identical values `{"x":0,"y":0,"width":1238,"height":776}`.

So the loop alternates between values that are equal in content and different in identity.

### 4.4 Counterfactuals (served-module rewrites, `ref`)

| patch | renders/s, `mm1-visible` | `mm1-hidden` | `mm1-visible-again` | `mm1-hidden-again` | rAF in 3 s | busy |
|---|---|---|---|---|---|---|
| none (5 s samples) | 120 | 120 | 120 | 119.6 | 300 in 5 s | — |
| `nodate` | 0 | 0 | 0 | 0 | 0 | 0.0-0.2% |
| `nodeguard` | 60 | 60 | 60.3 | 60 | 180 | 21-26% |
| `edgeguard` | 119.9 | 119.9 | 120 | 119.3 | 180 | 24-27% |
| `both` | 0 | 0 | 0 | 0 | 0 | 0.0-0.1% |

Each guard alone leaves the other half looping. The node half alone gives 120 renders/s, because React Flow's node store re-renders the editor a second time. The edge half alone gives 60, as in `extends`. The two guards together stop the loop, and so does the dependency alone.

### 4.5 The demo scenes

The four exports of `~/jjodel-demo-exports/` (read only), each imported into a fresh page. Both model tabs are opened (M2, then M1), so the M2 tab is hidden and the M1 tab active. Then 3 s are sampled with nothing dispatched.

| scene | panes (nodes/edges) | renders/s, hidden M2 | renders/s, visible M1 | commits/s | busy | with `both` |
|---|---|---|---|---|---|---|
| `scene_1_DemoPEST` | M2 5/5, M1 11/15 | 88.5 | 88.5 | 132.7 | **99.8%** | 0 renders/s, 0.3 c/s, 1.0% |
| `scene_2_DemoPetri` | M2 5/5, M1 13/12 | 65.7 | 65.7 | 98.6 | **99.9%** | 0, 0.3, 2.3% |
| `scene_3_DemoESM` | M2 5/5, M1 10/12 | 49.4 | 49.4 | 74.1 | **99.9%** | 0, 0.3, 2.3% |
| `scene_4_DemoFlowB` | M2 8/8, M1 17/18 | 69 | 69 | 103.4 | **99.9%** | 0, 0.3, 6.8% |

- Every demo scene loops, in **both** editors, with nothing dispatched. The main thread is saturated, so the frame rate falls below 60 and both editors render once per frame they get.
- The scheduling stacks are those of §4.2 (`useJjomSync.ts:254` and `:257`, for hidden and visible alike).
- The M1 diffs show the same pattern as M2. Object nodes change identity with JSON-identical `data`: `features` rows hold nested values the two-level test does not reach. M1 edges (`instanceRef`, `composition`) are new objects with JSON-identical `data` (`{"referenceName":"transitions","referenceId":…}`).
- No page error in either run. Absolute figures are a headless dev build (§7 R5).
- Repeated in the final run (13:28 UTC), unguarded: 91, 92.9, 50.1 and 62.2 renders/s per editor, busy 99.8-100%.

### 4.6 Size: `lib6`, and the two counterfactuals on it

`lib6`, 3 s samples, renders/s of `metamodel_1`'s editor, hidden and visible phases:

| patch | `mm1-visible` | `mm1-hidden` | `mm1-visible-again` | `mm1-hidden-again` | busy |
|---|---|---|---|---|---|
| none | 43.1 | 43.6 | 43.8 | 51.5 | 99.9-100% |
| `both` | 0 | 0 | 0 | 0 | 0.1% |
| `nodate` | 0 | 0 | 0 | 0 | 0.1% |

At 42 classes, one idle editor holding references takes the whole main thread of this dev build, hidden or visible.

### 4.7 What a plain-data equality could not compare

For fix B (§6), every value in the node and edge state that changed during a sample was walked: up to depth 8, the first 50 elements of each array. The walk looked for functions and objects whose prototype is neither `Object.prototype` nor `null`. Run at 13:28 UTC, `ref` and the four scenes, no patch.

- **Found: none**, over 3,245 objects (`ref`) and 15,482-29,897 objects (scenes) per sample.
- **Positive control**, through the same function after each sample: `{data:{features:[{value: new Map()}]}}`. It was reported every time (`control.data.features[].value : Map`), so the walk has signal.
- So a structural equality over plain data reaches every value the demo canvases hold. R2 (§7) does not bite on the demo content.

## 5. Findings (read, then confirmed by §4)

### 5.1 The cycle

1. `useJjomSync.ts:1549` `}, [isJjomMode, elementSnapshots, subElementIds, scheduleFlush, Date.now()]);` — `Date.now()` differs on every render, so the incremental-sync effect (`:1224`) runs after **every** commit of `EditorV2Inner`, not only when the store changes. The comment at `:1550` says so: `// todo: remove Date.now() from dependencies, it forces update to fix singleton issue but it's sub-optimal`.
2. `useJjomSync.ts:1330` `prevModel = {} as any;` — so `:1334` `if (prevD === dElement && prevModel === currModel && currHash === prevHash) continue;` never skips: every existing vertex and edge is re-transformed on every run (only the drag anti-bounce ids are left out, `:1322`).
3. **Vertex.** The fresh `rfNode` is compared with the cached one by `:1384` `if (!existing || !shallowDataEqual(existing.data, rfNode.data)) {`. `shallowDataEqual` (`:139-185`) goes two levels deep, and at the second level accepts only identical values or arrays of primitives. A class with a reference has `data.references[i].type`, built new on every call by `jjomTransformers.ts:127` `type: ref.type ? { id: ref.type.id, name: ref.type.name } : undefined,`: a plain object at the third level, so the test is always «changed» and the vertex goes into `patchedNodeData`.
4. **Edge.** `:1398` `patchedEdges.set(id, rfEdge);` runs for every re-transformed edge, with no comparison at all. The flush then builds `:1505` `const merged = { ...newEdge };` for each, and `:1545` `return deduplicateInheritanceEdges(result);` returns a new array (`:209` `return edges.filter(e => {`).
5. Both patches go in the pending queues (`:1440`, `:1494`) and `scheduleFlush()` (`:1486`, `:1547`) asks for one frame. In it, `setNodes` (`:254`) and `setEdges` (`:257`) store the new objects. React re-renders `EditorV2Inner` (setState, then React Flow's store through uSES: 2 renders per frame). Back to step 1.

Classes only: step 3 finds `data` equal (`attributes: []` is an array of primitives), and step 4 has no edge, so nothing is pushed. The effect still runs once per render and stops. That is why the reference matters, and why `extends` alone (an edge, no `references` in `data`) loops at half the rate.

### 5.2 Why hidden and visible are the same

rc-dock keeps a visited pane mounted (run-slowdown report §5). Here it measured 816 px high, active or not (`getBoundingClientRect`, §4.1), with its canvas at 1238x776. **Measured:** the hidden editor's frame callback ran 300 times in 5 s, like the visible one's. **Read:** browsers throttle `requestAnimationFrame` for a hidden document, not for a hidden element. Nothing in the cycle reads layout.

### 5.3 Since when, and the trunk

- `Date.now()` came in with `6d205bc9f` (Damiano Di Vincenzo, 2026-05-21 16:01, «missed a change to fix #67»), and `prevModel = {}` with `22a123a01` (same author and day). PR #79 and #82 close «67-singleton-attribute-not-applied-on-class».
- The unconditional edge patch is older: `92e15903c` (2026-02-25). So are the two-level `shallowDataEqual` (`b4ad00bb0`, 2026-03-25) and the `type` object (`79e0df08e`, 2026-02-25). Before `6d205bc9f`, the effect ran only when the store changed, so these produced one extra frame per dispatch and no loop. **Read, not measured** on a pre-May build.
- **Trunk:** `alfonso-frontend-jjtl` at `c3a9c9ffd` has the same lines: `git show alfonso-frontend-jjtl:<path> | command grep` found `:1330`, `:1398`, `:1545`, `:1549` and `jjomTransformers.ts:127`. `git diff --stat alfonso-frontend-jjtl hidden-tab-loop -- <the two files>` is empty, exit 0. Control: the same command on this lane's prompt file prints `46 insertions`. And `6d205bc9f` is an ancestor of the trunk (`git merge-base --is-ancestor`). **The demo build has the loop.**

### 5.4 Why the inactive-tab gate could not stop it

The parked gate pauses the react-redux store seen by the hidden subtree. The cycle uses no store: `storeNotes` is 0 in every sample. It runs on `useState` (`useNodesState`, `useEdgesState`) and `requestAnimationFrame`.

## 6. The fix

### 6.1 Options

| | Change | Measured with the served-module stand-in | What a tab shows | Critical zone |
|---|---|---|---|---|
| **A** | Drop `Date.now()` from the dependencies, `useJjomSync.ts:1549` | `nodate`: 0 renders/s in every phase | **May change**: `Date.now()` is the second half of the #67 fix («singleton attribute not applied on class»). That scenario is not reproduced here, so A can reopen it | yes |
| **B** | A patch that changes nothing keeps the identity of what it patches | `both`: 0 renders/s in every phase; the four demo scenes 0 renders/s, busy 1.0-6.8% (§4.5) | **Nothing, by construction**: only patches equal in content to the current state are dropped. `Date.now()` and `prevModel = {}` stay, so #67 is untouched | yes |
| C | The parked inactive-tab gate | — | — | no; cannot reach the cycle (§5.4) |

**Recommended: B.**

### 6.2 B in detail, for Phase 2

1. A new pure module, `frontend/src/components/editor-v2/utils/syncPatchIdentity.ts` (name to be grepped free), exporting two functions.
   - `samePlainData(a, b)`: structural equality over primitives, arrays and plain objects (prototype `Object.prototype` or `null`), with a depth bound. Anything else (function, proxy, class instance, too deep) compares by identity only, so where it cannot tell it answers «changed», which is today's behaviour.
   - `mergeSyncedEdge(current, incoming)`: the merge of `useJjomSync.ts:1505-1535`, moved verbatim. It returns `current` itself when the merged edge is `samePlainData`-equal to it.
2. `useJjomSync.ts`, three edits.
   - `:1384` becomes `if (!existing || !(shallowDataEqual(existing.data, rfNode.data) || samePlainData(existing.data, rfNode.data))) {`. The old test stays as the fast path.
   - The edge map of the flush (`:1502-1538`) calls `mergeSyncedEdge`, and keeps the `result` array when no edge changed.
   - `deduplicateInheritanceEdges` (`:207-216`) returns its input when it drops nothing.
   When nothing changed, no node patch is queued, so `setNodes` is not called. The edge patch's updater returns its input, so React bails out without a render (read, to be measured). EditorV2's wrapper already keeps the array when nothing moves (`EditorV2.tsx:440-453`, P-2026-10-01-1655).
3. Not touched: `Date.now()`, `prevModel = {}`, `jjomTransformers.ts`, `shallowDataEqual`.
4. **Tests first** (vitest, `utils/__tests__/`), with a mutation bench:
   - `samePlainData`: plain, array and depth cases; a proxy or class instance compares by identity.
   - `mergeSyncedEdge`: today's merge, including the preserved waypoints, anchors, `jjomRefId` and the kind override; and the identity return.
   The hook itself does not import under vitest (joiner, `window`). Its wiring is measured by this probe, and the gap is declared, as in P-2026-10-01-1655 and P-2026-10-01-2136.
5. **Acceptance**, on this probe:
   - `ref`, `selfref`, `extends`, `lib6`, `scenes`: 0 renders/s with nothing dispatched, hidden and visible.
   - The run-slowdown probe's `two-mm` at run 12, before and after.
   - The four demo scenes dumped before and after: nodes, handles, edge paths identical.

**Expected effect.** Idle CPU of a mounted editor with an edge drops to the `both` row: 0 renders/s and 0.0-0.2% busy. Today that is 13-30% busy for 2 classes, 99.9% for `lib6`, and 99.8-100% on every demo scene (§4.5, §4.6). The per-dispatch cost does not move: each render still re-transforms every element (§7 R3).

## 7. Risks

- **R1, things correct only because they were redrawn every frame.** Since 2026-05-21, every editor holding an edge has re-rendered at the display rate. A view that is right only because it is redrawn (a handle or a label measured late, an edge end after a node resize, `DynamicHandles`' double-rAF measurement) would show stale once the loop stops. Exposure is limited to canvases with edges: class-only canvases never looped, and their node behaviour is what users already see. Checks: the scene dumps, and the chat's visual list with edges (drag a node, resize it, rename a reference, add one, switch tabs).
- **R2, values the structural equality cannot compare.** A function or a non-plain object inside node or edge state compares by identity under B, so that kind would keep looping (no regression, not fixed either). §4.7: the demo data holds none.
- **R3, the per-render resync stays.** With `Date.now()` and `prevModel = {}` kept, every render of `EditorV2Inner` still re-transforms every element, and queues an edge patch and a frame. B changes the fixed point, not that cost. The per-dispatch share belongs to the run-slowdown fixes (fix 1, fix 2).
- **R4, #67.** B leaves its two lines alone. A drops one of them and needs a #67 test first. None exists: `git log --grep '#67'` shows only the fix commits and their merges.
- **R5, environment.** The figures come from headless Chromium on a dev build with the React development renderer. Absolute busy percentages are higher than a production build in Edge. The shares and the 0-against-120 contrast transfer.
  - rAF follows the display, so on a 120 Hz panel the loop would run at 120 Hz. **Read, not measured.**
  - A browser tab in the background stops rAF, and with it the loop. A foreground window with Jjodel visible does not.
- **R6, the Edge renderer at 120% CPU on 2026-10-01 23:53.** It is consistent with this loop: any project with an editor holding an edge, in a foreground window. It is not attributed. During this lane, at 2026-10-02 13:16 UTC, `ps` showed an Edge renderer (pid 22611, up 4 h 16 min) at 115% CPU. The page it renders is not known, and no browser of Alfonso's was touched.

## 8. Decisions taken (unattended)

- **D1.** A new probe, `hidden-tab-loop.ts`, instead of extending `jjscript-run-slowdown.ts`. The subject is an idle loop and needs no Run; it needs other instruments (profiling hooks, hook diffs). The run-slowdown probe stays the Phase 2 measure at run 12.
- **D2.** Classes are written with `JjScriptService.execute`, the path of the parked scout, not through the chat. The loop happens with nothing dispatched, and the `classes` control uses the same path.
- **D3.** Counterfactuals are served-module rewrites through a Playwright route, not edits of the tree, because Phase 1 is read-only. Each rewrite must match exactly once or the run FAILs.
- **D4.** Four variants beyond the prompt's three:
  - `selfref` (the prompt's «one class with a reference», literally);
  - `extends` (an edge with no `references` in node data, to separate the two halves);
  - `lib6` (size);
  - `scenes` (the demo build's own content).
- **D5.** «Commits per second per editor» is reported as `EditorV2Inner` renders per second per editor, plus page-wide commits. A commit is page-wide, and two editors share it. Hidden or visible is read from the rc-dock pane's `dock-tabpane-active` class.
- **D6.** The «first tab visible» control is taken twice: before `metamodel_2` exists (`mm1-visible`), and after clicking back to it (`mm1-visible-again`).
- **D7.** The run-slowdown `two-mm` variant was not rerun in Phase 1. It measures a fix, and is Phase 2's acceptance.
- **D8.** The JSON comparisons in the probe's patches are stand-ins for the structural equality, not the code proposed for Phase 2.

## 9. Decisions awaiting Alfonso

None for fix B: the chat gave the critical-zone go-ahead at launch (RC-30, `goahead.txt` in the lane folder), the Layer Impact Report is Phase 2's first step, and B changes nothing a tab shows.

If the chat chooses fix A instead, one item waits for Alfonso (RC-26, «anything that changes what the MODELS demo shows»): A can reopen #67, so a class marked singleton may stop showing it. Recommended: B, so nothing waits.

## Addendum 2026-10-03, Phase 2 (GO of the chat: fix B only)

Tree: `hidden-tab-loop`. The trunk was merged in first, `ec57a268d` (`07bca00e2`, 154 commits, no conflict). `useJjomSync.ts`, `jjomTransformers.ts` and `EditorV2.tsx` came out unchanged by it.

### Layer Impact Report

Written in the session's reply before the diff, as the GO asked; summary here. Layers touched: Canvas v2-flow (the identity of node and edge objects) and the sync layer (`useJjomSync.ts`). D-layer, L-layer, JjOM, classic canvas and persistence are not touched: no action, no TRANSACTION, no transformer change. `Date.now()` and `prevModel = {}` (#67) stay.

### Commits

- `c99cb758b`, the pure module `frontend/src/components/editor-v2/utils/syncPatchIdentity.ts` and its test `utils/__tests__/syncPatchIdentity.test.ts`.
  - 24 tests, red at import before the module existed.
  - Mutation bench: **16/16 killed**, listed in the commit body.
- `c7380822c`, `useJjomSync.ts`:
  - the vertex test gets a structural fallback (`:1391`);
  - the edge patch goes through `mergeSyncedEdge` and keeps the array when no edge changed;
  - `deduplicateInheritanceEdges` returns its input when it drops nothing.
- `5921a6c06`, the probe: edge-selection phases (`LOOP_EDGE_PHASES=1`) and the three hook mutations below.

### Measurements, before (merged tree, unfixed) and after

| measure | before | after |
|---|---|---|
| `ref`, renders/s, visible / hidden (×2 each) | 119.9 / 119.3 / 119.9 / 120 | **0 / 0 / 0 / 0** |
| `extends` | 60 ×4 | **0 ×4** |
| `selfref` | 119.9-120 ×4 | **0 ×4** |
| `classes` | 0 | 0 |
| demo scenes, renders/s per editor (busy) | 107.5, 66.5, 53.2, 67.4 (99.6-100%) | **0** (1.8-4.1%) |
| two-mm, run 12 wall | 7839 ms | **2684 ms** |
| two-mm, run 12 React render, hidden / visible editor | 3302 / 376 ms | 403 / 258 ms |
| two-mm, run 12 editor CPU | 5482 ms | 1248 ms |
| two-mm, walls run 1-12 | 1364 … 4048 (6) … 7839 | 1367 … 1806 (6) … 2684 |

- The after demo-scene row comes from a run with a fresh Vite. In the first after run, the model panes never opened, so its 0 counted nothing. The cause is a long-lived Vite serving the edited module's importers with `?t=` stamps: the probe's `import('/src/components/abstract/DockManager.tsx')` got a second, uninitialised module instance, and `open2` failed silently. The rerun had both panes in every scene.
- Hook mutations through the probe (served-module rewrites of the fixed source, each matched once), `ref`, renders/s per phase. **3/3 killed**:
  - `mut-nodeguard` (structural fallback removed): 120 in all four phases;
  - `mut-edgekeep` (array always replaced): 0, then 60 ×3;
  - `mut-dedupe` (dedupe always copies): 0, then 60 ×3.
  - The first 0 of the last two is the cycle not yet started: it needs one render to start, then sustains itself.
- Gates:
  - typecheck 14, the known set, before and after;
  - vitest `src/components/editor-v2`: 114 files / 2770 tests before, 115 / 2794 after, all green;
  - `npm run build` exit 0.
- The two-mm tab check FAILs «the viewport had moved before the switch» before and after alike. The wheel did not move the viewport. It is a check for the parked fix 1, not for this one.
- Before and after two-mm ran against a Vite started by hand with the lane's `_tmp_lane_vite_3014.config.ts`, warmed by one page load. Under load 14-17, a cold Vite on the merged tree takes 78 s to the first page, over the run-slowdown probe's 30 s `goto` timeout. Two `lane-run probe` attempts died there.

### Demo scene dumps: two regressions in line jumps

Before and after are paired by position: both dumps are id-sorted, and an import allocates ids in the same order. `_tmp_hl_scene_diff2.mjs` (gitignored) does the pairing; its control (one transform and one path edited) is reported.

- **Nodes and connected handles: identical**, 74 nodes, 152 handles.
- **78 of 80 edge paths: same shape**, numbers within 0.0004 px.
- **2 edges differ in shape**, both in `scene_4_DemoFlowB` / `demoFlowB`, and both are line-jump arcs (`A 6 6`). The final geometry is the same before and after. Against it:
  - edge #3's horizontal at y=83.3 is crossed by edge #4's vertical (x=620.2, y 71..946). Before, #3 drew that hop; **after, it is missing**.
  - after, edge #2 draws a hop at x≈256.6, y=75, where **no** vertical crosses: **spurious**.
- A second after-dump agrees with the first on every shape (0 shape differences), so this is deterministic.

**Cause (read).**
- `UnifiedEdge.tsx:423-427` memoises the crossings on `[id, drawnPoints, allEdges]`. The comment reads «Recompute triggers: own path (spreadPoints) and any edges-array change (allEdges)».
- `:409-415` registers the edge's path in an effect, after the render.
- So an edge computes its hops from the paths registered in the previous commit. With the loop, the edges array changed every frame, and every edge recomputed against the final routes. Without it, the hops computed in the commit that changes routes (layout, lanes) stay stale.
- This is R1 of §7. Fix B is the trigger, and the staleness is in the line-jump code.

### Selected edge

`LOOP_EDGE_PHASES=1`, after fix B. Once an edge is selected by a click, the edge half still loops at **60 renders/s**, visible (27.1% busy) and hidden (21.8%), until a pane click brings it to 0. `ref` and `extends` alike.

The cause, measured by the commit diff and the stacks:
- EditorV2's `setEdges` wrapper (`EditorV2.tsx:443-452`) re-adds `selected` to every edge while `selectedEdgeIdRef` is set.
- The merge, moved verbatim, never carries `selected` (test M8 pins it).
- So the merged edge never equals the current one.

Before fix B this case looped too, inside the 120/s idle loop.

### Decisions taken (unattended)

- D9. The trunk merge used plain `git merge --no-ff`, since the merge was conflict-free.
- D10. Fix B is committed on the branch with both known issues declared in its body. P6: the visual check blocks the merge, not the commit. One revert undoes it.
- D11. The selection semantics of the merge are left as they were. Carrying `selected` would change what box-selected edges show (§ below).
- D12. The log entry and the Status flip wait for the lane's closure (P13), after the question is answered and the visual check runs.

### Decisions awaiting Alfonso

1. **Selected edge** (RC-26, what the demo shows). Ignoring `selected` in `mergeSyncedEdge`'s comparison would stop the residual loop. But edges box-selected by React Flow (shift-drag, no click) would then stay selected, where today the next sync patch clears them.
   - Recommended: yes, as a separate lane after the demo; for the demo, a pane click ends it.

### Question for the chat

Fix the line-jump staleness in this lane before the visual check? It needs files outside the report's list:
- `frontend/src/components/editor-v2/utils/edgeUtils.ts`: the registry gets a version, bumped when an edge's registered points change in content, plus `subscribe`/`getVersion`;
- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`: subscribes through `useSyncExternalStore` and adds the version to the crossings memo;
- possibly `hooks/useTreeLayout.ts`, which registers tree segments through the same API;
- a test of the registry.

Neither file is in the critical-zone table, and the new exports only add. The acceptance is the same scene dumps: the 2 hops back to the before shapes, 0 renders/s idle unchanged.

## Addendum 2026-10-03, Phase 2 extension (the chat's answer: fix the line jumps)

Scope added by the chat (RC-21): `edgeUtils.ts`, `UnifiedEdge.tsx`, and `useTreeLayout.ts` if needed, plus a test.

`useTreeLayout.ts` was needed: its two crossings memos (`:203-217`, `:219-242`) depend on `allEdges` too, and its tree segments register in an effect (`:170-194`). Commit `334a7e444`.

### What it does

- `edgeUtils.ts` gives the path registry a version and two new exports, `subscribeEdgePaths` and `getEdgePathsVersion`. `registerEdgePath` and `unregisterEdgePath` keep their signatures.
- `UnifiedEdge` and `useTreeLayout` read the version through `useSyncExternalStore` and add it to their crossings memos. The server snapshot is the same getter, so server-rendered markup is unchanged: the IR render tests that compare markup byte for byte stay green.

### The first version looped, and why

The first version moved the version synchronously on every call. That ended in **«Maximum update depth exceeded»** on demo scenes 3 and 4: one pane empty in each.

A scout logged every content-changing registration through a served-module rewrite. Edge `…_28` of `scene_4_DemoFlowB` registered the same five points 51 times, with `prev` null each time. Its `drawnPoints` gets a new identity on every render, so its effect unregisters and re-registers on every render. Each call moved the version, and React Flow's store subscription re-rendered the edges inside the passive-effect flush.

The version now moves **once per burst** (`setTimeout 0`), and **only on a net change**. An unregister followed by a re-registration of the same content cancels out.

### Tests and benches

- `utils/__tests__/edgePathRegistry.test.ts`, 12 tests. R1 and R10 (the cancelling re-registration) were red on the per-call version. R9 pins that crossings read the latest path.
- Mutation bench: **15/16 killed**. The survivor drops the «flush already pending» guard, and it is **equivalent**: the extra timers find nothing changed and notify nobody.
- Wiring mutation: the crossings memo of `UnifiedEdge` without the version brings back the same 2 stale arcs in `demoFlowB`. **Killed.** No demo scene has a tree-connector crossing, so the `useTreeLayout` wiring has no measured kill: **declared gap**.

### Measurements, with fix B and the jump fix together

| measure | before T9 | fix B alone | fix B + jumps |
|---|---|---|---|
| scene dumps: path shapes differing from before | — | 2 of 80 | **0 of 80** (nodes, handles identical; max 0.00016 px) |
| `ref` / `extends` / `selfref` idle, renders/s, hidden and visible | 120 / 60 / 120 | 0 | **0**, ~0 commits/s, ≤0.2% busy |
| demo scenes idle (both panes mounted) | 53-108 per editor, 99.6-100% | 0 | **0**, 0.3 commits/s, 0.9-2.6% |
| selected edge, until a pane click | (inside the 120/s loop) | 60/s | 60/s, unchanged (Alfonso's item) |
| two-mm, run 12 wall | 7839 ms | 2684 ms | **3529 ms** |
| two-mm, run 12 React render, hidden / visible | 3302 / 376 ms | 403 / 258 ms | 638 / 488 ms |

- The jump fix costs part of fix B's gain during a Run. Every command changes some path, and each changed burst re-renders every mounted edge once, the hidden tab's too. Two identical baselines of this probe differed by 32% at run 12 (§3 of the run-slowdown report), so the 2684-to-3529 gap is within noise and is not claimed as a measure.
- A narrower signal is possible: a per-edge snapshot that changes only when that edge's crossings do. It is not done here.

### Gates

- typecheck: 14, the known set, unchanged.
- vitest `src/components/editor-v2`: 116 files / 2806 tests, all green.
- `npm run build`: exit 0. The last edit before the commit was a doc comment, and the registry tests were rerun after it (12/12).

### Not done, still listed

- **The selected-edge residual stays Alfonso's** (RC-26, the chat's answer): keeping `selected` through the merge would change what box-selected edges show. Not implemented.

### Decisions taken (unattended)

- D13. `useTreeLayout.ts` is included, for the reason above, under «only if needed».
- D14. The version moves once per burst and only on a net change. That is the chat's design, version plus subscription, with the timing the measured loop required.
- D15. The equivalent survivor V7 stays in the code. The guard saves redundant timers and has no observable effect.
