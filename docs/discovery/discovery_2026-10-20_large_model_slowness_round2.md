# Discovery 2026-10-20 — large model: why every interaction stays slow (round 2)

- Prompt-ID: P-2026-10-20-2305 (chat C-2026-10-20-0839), Phase 1, read-only on product code
- Tree: `~/jjodel-w-perfslow`, branch `perf-slow-round2`, HEAD `fb35595fa` (all measures on this version, plus the
  probe of this lane)
- Executor: Anthropic Claude Opus 5.5 (session banner)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
  the real files.

## 1. Objective

After `bfab138ba` (lazy References) Alfonso still feels the large model «Jjodel harness» (1 metamodel, 1 model of
407 objects, 7 user viewpoints) as slow on every interaction. Answer with CPU profiles: (1) production vs dev on the
selection click; (2) drag, typing, opening the model, switching viewpoint; (3) why `fullname` is O(n) and who reads
it; (4) what re-renders per selection and keystroke and why; (5) ranked fixes with savings measured by ablation.

## 2. Method

Probe `frontend/scripts/probe/large-model-click-profile.ts` (extended by this lane, `chore(probe)` commit):
- `CLICK_STEPS=open,drag,type,commit,vp` profiles, besides the two clicks: the model tab opening plus viewpoint
  activation (`open`), one 100 px drag of the Activity node in 10 mouse moves (`drag`), one character typed in the
  Properties name field (`type`), Enter in that field, i.e. the store write of the new name (`commit`), and the switch
  to «Harness / Authority» (`vp`). Each step: CDP profiler at 500 µs, act, wait for 3 s without long tasks, stop.
- Counters on `LModel.get_name` (new) next to the existing ones; `CLICK_STACKS=1` samples the callers of
  `LObject.name` and `LModel.name` (counts only, that run's timings are not used).
- `CLICK_ABLATE=modelname`: `LModel.name` returns `data.name || data.className` without the `$name` scan.
- Bench of one `U.compressedState` (the work of every save and layout autosave).
- Production: `npm run build` (exit 0, 3 m 53 s, only the chunk-size warning) and `npx vite preview --port 3048`;
  `CLICK_PROD=1` reads the classes off `window`. Dev: `lane-run probe … --port 3047`.
- Source ablations for item 5: temporary edits applied by a script, measured in dev, reverted with
  `git checkout --` on the three files (verified clean after each run), never committed.

Long-task sums and CPU busy time are in ms. «median» is r1-r3, taken per column. Raw profiles and JSON:
`frontend/.vite-cache/perfclick-{prod-steps-r1..r3,dev-steps-r1..r3,dev-stacks,dev-abl-*,prod-abl-modelname,
prod-refs-*}.{json,*.cpuprofile}` (gitignored); probe stdout in `.agent-logs/probe-*.log`.

Files read (full paths under `/Users/alfonso/jjodel-w-perfslow/frontend/`):
`src/model/logicWrapper/LModelElement.tsx` (`get_fullname` :457-461, `get_containers` :558, `_defaultGetterM1`
:5313-5335, `get_allSubObjects` :5851, `LValue.get_validTargets` :8161-8179, `LObject.set_name` :6468),
`src/joiner/classes.ts` (:2219-2227 `LPointerTargetable.get_name`), `src/joiner/proxy.ts` (:399-407),
`src/components/editor-v2/hooks/useJjomSync.ts` (:1060-1194, :1226-1370),
`src/components/editor-v2/utils/jjomTransformers.ts` (:298-420), `src/model/logicWrapper/nameUniqueness.ts`
(:300-310), `src/components/editor-v2/problems/UniquenessProblemSync.tsx` (:1-50),
`src/components/TreeViewSidebar/TreeViewContent.tsx` (:3035-3092, :3330-3340),
`src/components/editor-v2/hooks/useLayoutAutosave.ts` (:1-60), `src/common/U.tsx` (:429-445),
`src/components/editors/Info.tsx` (:483), `src/components/forEndUser/Input.tsx` (:457), `vite.config.ts`,
`scripts/lane-run.mjs` (probe usage). Read by the explorer subagent and spot-checked here: `EditorV2.tsx`,
`edges/UnifiedEdge.tsx`, `nodes/ObjectNode.tsx`, `Input.tsx:191-254`.

Baseline: `npm run typecheck` exit 0 (`.agent-logs/typecheck-20261020-230436.log`).

## 3. Findings (measured unless tagged «read»)

### 3.1 Production vs dev (item 1, and item 2)

| Step | prod r1, r2, r3 (long tasks) | prod median lt / busy | dev r1, r2, r3 | dev median lt / busy | dev-only share |
|---|---|---|---|---|---|
| open (tab + viewpoint) | 4803, 4837, 4930 | 4837 / 5039 | 5661, 6279, 8361 | 6279 / 6389 | 23 % |
| click Activity | 681, 731, 738 | 731 / 832 | 829, 868, 1214 | 868 / 1056 | 16 % |
| click gateway | 653, 663, 659 | 659 / 735 | 837, 905, 1165 | 905 / 1037 | 27 % |
| drag 100 px | 3629, 3684, 3643 | 3643 / 3924 | 4182, 4422, 5367 | 4422 / 4790 | 18 % |
| type one character | 0, 0, 0 | 0 / 55 | 0, 0, 0 | 0 / 42 | — |
| commit the name (Enter) | 1897, 1680, 1696 | 1696 / 1889 | 1764, 2000, 1990 | 1990 / 2054 | 15 % |
| switch viewpoint | 1681, 1603, 1611 | 1611 / 2586 | 2020, 3405, 3233 | 3233 / 4564 | 50 % (noisy) |

An earlier click-only prod run (`prod-r1`) gave Activity 905, gateway 832. Dev is 15-27 % slower than production
on every step but the viewpoint switch: the slowness is real in production. Dev runs are noisy (r3 is 30-40 %
slower than r1 on the same steps); production runs agree within 5 %.

Per step, the drag is 16 long tasks of 181-445 ms, one per mouse move or two: about 5 frames per second while
dragging. A keystroke dispatches nothing and re-renders one `InputComponent` (Input.tsx keeps the value in local
state, the write happens on blur or Enter, «read» from `Input.tsx:191-230`). The 1.7-2.0 s is the commit.

### 3.2 Top-10 self time (prod r1; dev r3 names)

Production names are minified only for locals; methods keep their names.
- **click** (busy 778): `get0` (proxy) 202; `measureIntrinsic` (`viewpoint/ir/useContentSize.ts:20`) 93; `(program)`
  90; proxy `get` 41; `getPropertyValue` 40; `parsePathPoints` (`utils/edgeUtils.ts:711`) 22; xyflow 17; GC 16;
  `from` 14; `get_children` 14.
- **drag** (busy 3897): `get0` 1136; `measureIntrinsic` 334; proxy `get` 257; `parsePathPoints` 191; `(program)` 173;
  xyflow `getNodes` 117; `get_children` 99; xyflow 94; `wrapAll` 81; `from` 76.
- **commit** (busy 1968): `get0` 897; `get` 194; `get_children` 112; `wrapAll` 88; `(program)` 75; `from` 53; `wrap`
  43; `TargetableProxyHandler` 39; `_defaultGetter` 32; `parsePathPoints` 28.
- **vp** (busy 2704): `async-lz-string` `loopIteration` 665 (+ 209 in its anonymous helper); `get0` 340; `(program)`
  261; `getPropertyValue` 138; proxy `get` 76; xyflow `shallow` 76, 62, 60; GC 56.
- **open** (busy 5015): `get0` 1786; `get` 464; `measureIntrinsic` 369; `get_children` 205; `wrap` 172; `(program)`
  121; `wrapAll` 119; `_defaultGetter` 104; `parsePathPoints` 82; `get_instanceof` 73.

The proxy getter is the self time everywhere; the inclusive tree (dev r1) says who drives it:

| Inclusive, dev r1 | click (busy 1002) | drag (4499) | commit (1872) | vp (3032) |
|---|---|---|---|---|
| `useJjomSync` incremental effect (`useJjomSync.ts:1228`) → `jjomVertexToRFNode` → `objectVertexToRFNode` | 318 | 2454 | 302 | 605 |
| `LObject.get_name` (all callers) | 199 | 1121 | 1285 | 298 |
| `detectDuplicateNames` via `UniquenessProblemSync` | — | — | 1108 | — |
| `useContentSize` → `measureIntrinsic` | 161 | 546 | — | — |
| `async-lz-string` (save, no app frame on the async stack) | — | — | — | ≈ 1175 samples ≈ 0.6 s |

### 3.3 Who reads `LObject.name`, per interaction (dev, `CLICK_STACKS=1`)

| Caller | per click | per drag | per commit |
|---|---|---|---|
| `objectVertexToRFNode` reference target names (`jjomTransformers.ts:366-376`), from `useJjomSync` | 6102 | 48,816 | 6102 |
| `LModel._defaultGetterM1` `$name` scan (`LModelElement.tsx:5331-5332`) under `LModel.get_name` | 1628 (4 × 407) | 1628 | 1628 |
| `detectDuplicateNames` (`nameUniqueness.ts:308`) | — | — | 29,996 |
| `buildInstanceForest` (`TreeViewContent.tsx`, tree `mapStateToProps`) | 407 | 407 | 407 |
| Info / PropertiesHeader | ≈ 8 | 3 | — |
| **total** (counter) | 8146 | 50,854 | 38,950 |

48,816 = 8 × 6102: the sync effect re-transforms every vertex 8 times during one drag, while the store wrapper saw
one dispatch (the drop). Why it runs 8 times without dispatches was not located (§6).

### 3.4 `fullname` (item 3)

- `get_fullname` (`LModelElement.tsx:457-461`) maps `get_containers(context).reverse()` to `c.name`; the walk itself
  is O(depth) on `father` (`get_containers` :558, `get_father` :751, «read»).
- The O(n) is the last container, the M1 `LModel`. `LModel` has no `get_name`, so it inherits
  `LPointerTargetable.get_name` (`joiner/classes.ts:2220-2226`), which first reads `(c.proxyObject).$name`. On an
  `LModel` a `$`-key falls into `_defaultGetterM1` (`LModelElement.tsx:5313`), whose first branch scans
  `this.get_allSubObjects(c)` reading `subobject.name` for every object (:5331-5332): 407 `LObject.name` reads, plus
  `get_allSubObjects` itself (`_getallSub` :5854, every DObject in the store, measured 2.2-3.1 ms).
- The result is thrown away: `classes.ts:2222` keeps it only if `nameattribute.className === 'LValue'`, and an L proxy
  reports the D className (`frontend/src/model/CLAUDE.md` §3.13), so `model.name` always ends as
  `c.data.name || c.data.className` (:2225) («read»; the ablation returns that and every probe step stays green).
- Measured: one `o.fullname` on the Activity costs 14.4-17.3 ms with 409 `LObject.name` reads; `o.father.name` 0.005
  ms; `o.name` 0.025 ms.
- Reads per interaction: a selection click reads `fullname` 6 times on the Activity (all `LEnumLiteral.get_fullname`
  inside an option `map` of `LModelElement.tsx`, i.e. the enum slot of the slots section), 0 on the gateway; a
  keystroke 0; a commit 0. `LModel.name` is read 15-21 times per dispatch, 4 of them on the M1 model (scan) and the
  rest on the M2 (`_defaultGetterM2`, smaller scan). Callers per dispatch (served dev lines): `Navbar.tsx`
  `mapStateToProps`, `TreeViewContent.tsx` `mapStateToProps` (3 sites), `StatusBar.tsx` selector (2),
  `Info.tsx` `forceConform`, `ProjectEditor.tsx` render (5), `LEnumLiteral.get_fullname` (6 on the Activity).
- References opening (`CLICK_OPEN_REFS=1`, prod): 2674 ms of long tasks → 0 with the ablation (§3.7).

Minimal fix: `LModel.get_name(c) { return c.data.name || c.data.className; }` in `LModelElement.tsx` (core). It
returns exactly what today's getter returns in the end. Risk: (a) the proxy finds getters by `this.g + key in
this.lg` (`proxy.ts:399-401`), so the override is picked up and nothing else in `get0` changes; (b) name-based
lookups `model.$foo` go through `_defaultGetter`, not `get_name`, and are untouched; (c) DObject temporary ids and
the JjOM are not involved, the getter reads only `data.name`; (d) the one behaviour that changes is invisible: a model
containing an object literally named «name» today runs the scan and then discards its result. The `set_name` and
identity-slot write paths (model `CLAUDE.md` §3.12) do not use this getter. A direct parent pointer is not needed:
the container walk is already O(depth).

### 3.5 Re-renders (item 4)

Per selection, dev: 8-9 commits, fibers `[1103, 1232, 65, 36, 10, 1125, 1115, 231]` (4917 in total). By component
(renders / self ms, dev r3 click): xyflow `NodeComponentWrapperInner` 1182 / 4 (the MiniMap node, «read»),
`EdgeWrapper` 462 / 4, `FeatureRow` 407 / 3, `NodeWrapper` 369, `EntityRow` 338, `ObjectNode` 153 / 25, `IRNodeContent`
153, `SubViewItem` 143, `UnifiedEdge` 126 / 18, `EditorV2Inner` 2 / 136, `ProjectEditor` 1 / 21. Per keystroke: 1-2
fibers (`InputComponent`, `LastSavedIndicator`). Per drag: 39,837 fibers in 68 commits (`NodeComponentWrapperInner`
11,666, `NodeWrapper` 5174, `EdgeWrapper` 4824, `UnifiedEdge` 1786, `ObjectNode` 962).

Triggers («read», explorer subagent, spot-checked):
- Tree rows (`FeatureRow`, `EntityRow`, `SubViewItem`, all `memo`): `TreeViewContentConnected` is a `connect` with
  the default shallow compare (`TreeViewContent.tsx:3333-3336`); `mapStateToProps` (:3035) builds new arrays and
  objects on every dispatch (`buildInstanceForest`, viewpoints, data manager), and `FeatureRow` receives `selectedId`
  (from `_lastSelected.modelElement`), which changes on every selection, so the `memo` never holds.
- Canvas: `ObjectNode` and `UnifiedEdge` are not `memo`; `UnifiedEdge` calls `useEdges()` (whole edge array);
  `EditorV2` subscribes to `_lastSelected.modelElement`; the MiniMap re-renders every node whose user-node object
  identity changes.
- Measured weight: the tree ablation (`connect` with a `mapStateToProps` frozen after its first call: no tree work
  at all) removes ≈ 1100 fibers per selection (4917 → 3817) and ≈ 5 `LModel.name` reads, but no measurable time
  (click 1162 vs dev median 868, within dev noise). The fibers are cheap; the time is in effects and selectors, not
  in rendering (component self time per click sums to ≈ 230 ms, of which `EditorV2Inner` 136).

### 3.6 Ablations (item 5), dev, one run each against the dev median r1-r3

| Ablation (temporary, reverted) | open | click A | click G | drag | commit | vp | `LObject.name` per click |
|---|---|---|---|---|---|---|---|
| baseline, dev median | 6279 | 868 | 905 | 4422 | 1990 | 3233 | 8146 |
| `modelname` (in-page) | 7244 | 1151 | 990 | 5698 | 2652 | 3088 | 6518 |
| `sync`: `useJjomSync.ts:1334` `prevModel = {}` commented | 5722 | 710 | 683 | **2297** | 2143 | 2366 | 2055 |
| `tree`: `mapStateToProps` frozen | 7146 | 1162 | 1083 | 5968 | 2375 | 3150 | 6925 |
| `uniq`: `detectDuplicateNames` collision list `[]` | 5074 | 841 | 809 | 4589 | **783** | 2608 | 8146 |
| all four | 4179 | 383 | 505 | 1853 | 359 | 2130 | 20 |
| `modelname`, **prod** (vs prod median) | 4687 (4837) | 686 (731) | 622 (659) | 3624 (3643) | 1651 (1696) | 1570 (1611) | 6518 |

Reading: dev single runs carry ±30 % noise, so only savings above ≈ 0.3 s are signal. `sync` halves the drag
(−2.1 s, 50,854 → 2049 name reads) and trims click, vp and open; `uniq` removes 1.2 s from the rename commit and
from the open; `modelname` saves ≈ 45 ms per dispatch in production (the 4 M1 scans), which is below dev noise;
`tree` saves nothing measurable. All four together: click 0.4-0.5 s, drag 1.85 s, commit 0.36 s in dev.

### 3.7 Save cost and References

- One `U.compressedState` (JSON with `proxyToIdReplacer` plus `async-lz-string`, 422,007 UTF-16 chars) costs 5.6-6.6 s
  wall in dev (bench, two runs) and 6.1-6.9 s in production (§3.7, four runs). The viewpoint switch triggers one (lz-string ≈ 0.9 s of self time inside the vp
  window); the layout autosave after a drag fires after `AUTOSAVE_DEBOUNCE_MS`, outside the 3 s settle window, so the
  drag numbers above do not include it. `useLayoutAutosave.ts:41-58` measured 241 ms per save on a 499-entry state
  on 2026-09-02; this project is ≈ 25 × that.
- References opening on the Activity (`CLICK_OPEN_REFS=1`, prod, one run each): baseline 4 `validTargets` calls
  = 2606 ms, long tasks 2610 + 64; with `modelname` 4 calls = 26 ms, no long task. Bench in the same runs:
  `o.fullname` 32.4 ms with 409 name reads → 0.12 ms with 2. Production save: `U.compressedState` 6069-6883 ms
  wall (four runs, 421-423k chars).

## 4. Dependencies and risks

- `useJjomSync.ts` is critical zone (§3.1 of `CLAUDE.md`, Layer Impact Report mandatory). Line 1334 is a
  deliberate workaround (comment :1331-1333, `22a123a01`, 2026-05-21: «this is wrong. it is sometimes taking
  newElement instead. source of isSingleton bug»): removing it is the measured saving, not the fix. The fix has to
  find why `prevElements` sometimes holds the new model element and compare the right snapshot; regression to
  watch: singleton vertices and nodes not refreshing after an M1 slot edit.
- `nameUniqueness.ts` is under `src/model/` (core by the prompt's definition) and feeds the validation registry
  (`editor-v2/problems/`, active area): a group-by-name `Map` per sibling set keeps the same result in O(n). The
  regression to watch is the badge set (the 2026-08-31 missed-notification fix in `UniquenessProblemSync.tsx:24-47`
  must keep its signature).
- `LModel.get_name` is core (`LModelElement.tsx`); risk in §3.4.
- The save cost touches persistence (`U.compressedState`, autosave scheduler); any change there touches what is
  written to disk.
- The tree and canvas memoization are view-layer only, but measured as not worth it alone.

## 5. Ranked fixes

| # | Fix | Measured saving (ablation) | Layers | Core / critical zone |
|---|---|---|---|---|
| 1 | `useJjomSync` incremental sync: re-transform only the vertices whose snapshot changed (replace the forced `prevModel = {}` with a correct comparison); also find why the effect runs 8 × per drag | drag −2.1 s (dev 4422 → 2297), vp −0.9 s, open −0.6 s, click −0.16 s | sync, canvas | critical zone |
| 2 | `detectDuplicateNames`: group siblings by name once instead of `siblings.filter` per object | rename commit −1.2 s (1990 → 783), open −1.2 s | L-layer, validation | core (`src/model/`) |
| 3 | Save serialization: 6.1-6.9 s per `compressedState` in production on this project, paid by every save, layout autosave and (measured) viewpoint switch | not ablated; ≈ 0.9 s of self time in the vp window | persistence | no (but persistence) |
| 4 | `LModel.get_name` without the `$name` scan | References opening −2.67 s (prod, 2674 → 0 long tasks); `fullname` 32 → 0.12 ms; ≈ 45 ms per dispatch (prod) | L-layer | core |
| 5 | Tree `connect` / `selectedId` and canvas `memo` | ≈ 1100 fibers per selection, no measurable time | view | no |
| — | Residual after 1, 2, 4 and tree: `measureIntrinsic` (`useContentSize.ts:20`, 93-369 ms prod per step), proxy `get0`, edge `parsePathPoints`, xyflow during drag | click 0.4-0.5 s, drag 1.85 s (dev) | | |

## 6. Not measured, with the reason

- Source ablations ran in dev only (one run each): a production measure would need one build per ablation (≈ 4 min
  each); the `modelname` ablation, in-page, ran in both.
- Why the sync effect runs 8 times during a drag with one store dispatch: not located (the drag may write positions
  through a path the probe's `dispatch` wrapper does not see, or `elementSnapshots` changes for another reason).
- The cost of the layout autosave after the drag (outside the settle window) and the save cost in production.
- Opening the model «from the project page» is measured as the tab opening plus viewpoint activation
  (`DockManager.open2` + `activateViewpoint`), not as a UI click on the project page.

## 7. Open questions for Alfonso

1. Fix 1 is critical zone and undoes a workaround whose bug (isSingleton) is only described in a comment: open a
   lane with a Layer Impact Report and a probe acceptance (drag ≤ 2.3 s dev, name reads per drag ≤ 2100), or first a
   discovery on the isSingleton bug?
2. Fix 2 and fix 4 touch `src/model/`: one core lane for both, with the counters of this probe as acceptance
   (commit ≤ 0.8 s dev; References opening without long tasks; `fullname` ≤ 4 `name` reads)?
3. Is the save cost (fix 3, 5-6 s per save on this project) in scope for maintenance, or a lane of its own?
