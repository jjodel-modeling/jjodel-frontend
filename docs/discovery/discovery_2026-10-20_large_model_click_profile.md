# Discovery 2026-10-20 — large model: one selection click blocks the main thread

- Prompt-ID: P-2026-10-20-1830 (chat C-2026-10-20-0839), Phase 1
- Tree: `~/jjodel-w-perfclick`, branch `perf-click-profile`, HEAD `d14a4658d` (all measures on this version)
- Executor: Anthropic Claude Opus 5.5 (session banner)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## 1. Objective

Find, with a CPU profile and not by reading code, why one selection click on a node of the project «Jjodel harness»
(1 metamodel, 1 model of 407 instances, 7 user viewpoints) blocks the main thread for seconds (chat measure: up to
58.7 s), and answer: which functions take the self time; what the cost scales with; which dispatches the click
triggers and how many components re-render; dev vs production.

## 2. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The react-redux «Selector unknown returned a different result» warnings are the cost | **Falsified** for the profiled clicks: 0 such warnings during every recorded click (§4.2). |
| H2 | The cost scales with the views / viewpoints of the project | **Falsified**: 6 of 6 other viewpoints deleted (143 → 24 views), cost unchanged or higher (§4.5). |
| H3 | The cost scales with the instances of the model | **Holds, partly**: per-call cost is an O(n) scan of the 407 objects; with the model deleted a metamodel click costs 0.3 s (§4.5). |
| H4 | The click triggers many store dispatches | **Falsified**: one dispatch, 6-7 ms (§4.2). The time is in the React render that follows. |
| H5 | The cost is the Properties panel computing reference target lists | **Holds**: 4.97-5.66 s of a 6.3-7.1 s click; ablation removes it (§4.3, §4.4). |
| H6 | The cost is present in a production build | **Not measured** (§6). |

## 3. Method and files

Probe `frontend/scripts/probe/large-model-click-profile.ts`, run with `lane-run probe` on port 3047 (dev server,
headless Chromium 1440×900). It imports the fixture
`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel` (read only) through
`window.ProjectsApi.importFromText`, opens the model `jjodel` with `DockManager.open2`, activates the viewpoint with
`activateViewpoint`, waits for the main thread to settle, then per click: `Profiler.start` (CDP, 500 µs sampling),
one mouse click on a node, wait until no long task for 3 s, `Profiler.stop`. Instruments, all in the probe: long-task
observer, `store.dispatch` wrapper, React DevTools hook commit counter (fiber counts need dev's profiling fields),
`console.warn` counter, prototype counters on `LValue.get_validTargets[JSX|Options]`, `LModelElement.get_fullname`,
`LObject.get_name`, an ablation (`CLICK_ABLATE=validTargets`: `validTargetsJSX` returns `[]`), and a micro-benchmark
of single reads. Raw profiles and JSON: `frontend/.vite-cache/perfclick-*.{cpuprofile,json}` (gitignored).

Files read (full paths under `/Users/alfonso/jjodel-w-perfclick/`): `frontend/src/components/editors/Info.tsx`,
`frontend/src/model/logicWrapper/LModelElement.tsx`, `frontend/src/joiner/proxy.ts`,
`frontend/src/joiner/classes.ts`, `frontend/src/joiner/ExecuteOnRead.ts`, `frontend/src/utils/lastViewpoint.ts`,
`frontend/src/components/editor-v2/Toolbar.tsx`, `frontend/src/components/ModeSystem/CollapsibleSection.tsx`,
`frontend/src/pages/components/Dashboard.tsx`, `frontend/src/api/persistance/projects.ts`, `frontend/vite.config.ts`,
`frontend/scripts/lane-run.mjs`, `frontend/scripts/probe/jjscript-run-slowdown.ts`, `frontend/scripts/smoke/states.ts`.

Baseline: `npm run typecheck` exit 0 (`.agent-logs/typecheck-20261020-182652.log`).

## 4. Findings (measured unless tagged «read»)

### 4.1 The click

Viewpoint «Harness / Lane process (BPMN)»: 48 nodes, 42 edges, 10,944 DOM elements. Two clicks per run: an Activity
«write the Phase 2 prompt» (7 slots, 4 non-containment references typed Role, Lane, ArtifactType, ArtifactType) and a
DecisionNode «merge before the Phase 2 prompt» (1 slot, 0 references).

| Run | Activity long tasks (ms) | Activity busy (ms) | Gateway long tasks (ms) | Gateway busy (ms) |
|---|---|---|---|---|
| r1 | 458, 6307 | 7028 | 468, 785 | 1417 |
| r2 | 434, 6395 | 7079 | 486, 768 | 1421 |
| r3 | 532, 6273 | 7060 | 483, 777 | 1454 |
| r4 | 376, 5672 | 6268 | 428, 860 | 1543 |
| **median r1-r3** | **sum 6805** | **7060** | **sum 1254** | **1421** |

### 4.2 Dispatches and re-renders

One store dispatch per click, `COMPOSITE_ACTION` = [`SET_ME_FIELD idlookup.<vertex>.isSelected`,
`SET_ROOT_FIELD _lastSelected`], 6-7 ms inside `dispatch`. Then 8-9 React commits with fibers rendered per commit
`[1103, 1232, 65, 36, 10, 1125, 1115, 231, 1]` (Activity, r1). Components with the most renders in the gateway
click (the floor): `NodeComponentWrapperInner` 1183, `EdgeWrapper` 462, `FeatureRow2` 407, `NodeWrapper` 369,
`EntityRow2` 338, `ObjectNode` 154, `SubViewItem2` 143, `UnifiedEdge` 126 — the tree / rail and canvas, not only the
48 nodes on screen. 0 react-redux selector warnings in every recorded click.

### 4.3 Self time (Activity click, first run)

`get0 @ joiner/proxy.ts` 3784 ms; `get_children @ LModelElement.tsx` 973; `get @ proxy.ts` 818; `wrap @ classes.ts`
437; `(program)` 349; `measureIntrinsic @ viewpoint/ir/useContentSize.ts` 258; `_defaultGetter` 185;
`get_instanceof` 154; `getPropertyValue` (native) 113. Inclusive chain: `InfoComponent` 6620 ms → `object` →
`references` → `LValue.get_validTargetsJSX` → `get_validTargets` → `map` → `get_fullname` → `LObject.get_name`
(5337 ms).

Counters, Activity click: 11 `validTargets` calls = 4973-5662 ms (≈ 0.5 s each); 304 `fullname` reads = 4937-5617 ms
(≈ 16-18 ms each); 130,177 `LObject.name` reads ≈ 4.3-4.7 s. Gateway click: 1 `validTargets` call, 0 ms.

Micro-benchmark on the selected Activity (r4): `o.name` 0.025 ms (1 name read), `o['$name']` 0.025 ms,
`o.father.name` 0.005 ms, `o.fullname` **14.36 ms with 409 `LObject.name` reads** for a 4-segment name
(«jjodel.Jjodel development harness.activities.write the Phase 2 prompt»), `m1.allSubObjects` 2.17 ms (407). The
name read is cheap: the O(n) is inside the `fullname` container walk (`get_containers` / `father` or a container's
`name`), not in `$name`. Not located further.

### 4.4 Ablation

`validTargetsJSX` → `[]`: Activity long tasks 563, 913 (sum 1476, busy 1846) against a median sum of 6805: the target
lists are ≈ 5.3 s of the Activity click. What remains (≈ 1.25-1.5 s, also on the gateway) is the floor of §4.2.

### 4.5 Scaling

- Viewpoints: `CLICK_STRIP=other-vps` (6 of 6 deleted, 8 → 2 viewpoints with the system one, 143 → 24 views):
  Activity 682, 9458 ms; gateway 526, 820 ms. No reduction.
- Instances: `CLICK_STRIP=model` (the model deleted), metamodel tab, click on a class: long tasks 60, 56, 107 ms,
  busy 298 ms.
- Per-call model, from §4.3: cost ≈ (number of `validTargets` evaluations) × (scan of `m1.allSubObjects`, 407) ×
  (`fullname` ≈ 15 ms, itself O(n)) — quadratic in the instances for each reference slot shown.

### 4.6 Code (read)

- `frontend/src/components/editors/Info.tsx:818` — `<CollapsibleSection title="References" defaultOpen={false}>`;
  inside it `{slot.lv.validTargetsJSX}` at `:839` (per existing target row), `:869` (empty single), `:883` (add row).
- `Info.tsx:41-62`, the local `CollapsibleSection`: `const [open, setOpen] = useState(defaultOpen);` … `{open && (
  <div className="props-section__body">{children}</div>)}` — the closed section does not mount its children, but
  the parent has already evaluated them: every option list is built for a section the user does not see.
- `Info.tsx:1004` — `let selectOptions: JSX.Element | JSX.Element[] | null = value.validTargetsJSX;` (slots section).
- `frontend/src/model/logicWrapper/LModelElement.tsx:8168` —
  `let validObjects = (isCrossRef ? m1.allCrossSubObjects : m1.allSubObjects)`; `:8161-8164` the option `map` reads
  `object.fullname` for `title` on every option, and again for `label` on cross-references.
- `LModelElement.tsx:457-461` — `get_fullname` maps `get_containers(context).reverse()` to `c.name`.
- The References section came in with `9625d1372` (2026-09-18, «feat(views): reference editor in canvas rail with
  drill-in (#142)»).

## 5. Dependencies and risks

- The fix in `Info.tsx` is view-layer only, outside the §3.1 critical-zone table. It changes when option lists are
  built, not which options: a regression would show as missing or different options in the References selects.
- The `fullname` O(n) (§4.3) and the `validTargets` scan live in the L-layer (`frontend/src/model/`); they also cost
  wherever else `validTargetsJSX` is read (`Info.tsx:1004`, slots section, open by default).
- The floor (§4.2, ≈ 1.25 s per click, any node) is a separate cause: a selection re-renders ≈ 1100 fibers per
  commit in four commits.

## 6. Not measured, with the reason

- Viewpoint «Harness / Authority» and abstract syntax: the probe found no clickable node (100 and 407 nodes present;
  the hit-test picker and the wheel zoom-out fallback returned 0). Stopped there on the context ceiling; the chat
  then asked not to spend more time on it.
- Production build and preview: not run, same reason.
- The 58.7 s of the chat was not reproduced; the maximum here is 9.5 s. Hypothesis, not measured: an object whose
  multivalued references hold many targets pays one `validTargets` evaluation per target row plus one.

## 7. Recommended fix

1. `Info.references`: build the section body only when it is open (inner component as the child of
   `CollapsibleSection`), and read `validTargetsJSX` once per slot instead of once per row. View layer, `Info.tsx`
   only, no critical zone. Expected: the Activity click falls to the gateway floor.
2. Later, L-layer: the O(n) `fullname` and the per-option `fullname` reads in `LValue.get_validTargets`.
3. Later, the selection floor: what re-renders ≈ 1100 fibers per click.

## 8. Open questions

1. Is the slots section (`Info.tsx:1004`, open by default) worth the same once-per-slot treatment?
2. Should the L-layer `fullname` walk be its own lane, with a probe on the 409-reads count as acceptance?
3. Is the selection floor (≈ 1.25 s, tree / rail re-render) in scope for the maintenance front?
