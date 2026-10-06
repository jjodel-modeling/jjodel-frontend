# Discovery 2026-09-29: freezes while authoring IR viewpoints, collapsed graphVertex, StructureSpec

Prompt `P-2026-09-29-1935`, chat `C-2026-09-29-1840`, branch `ir-freeze-disc` at `9b08350d0`. Read-only.
Evidence: [M] measured by a probe on the lane's dev server (3056, this tree), [R] read in code or docs.

## 0. Answer in brief

- **Freeze: not reproduced from the four circumstances; one mechanism reproduces the symptom.** (a)–(d) replayed 28 times (12 on a fixture whose children have canvas vertices, as right-click "add child" makes), plus 21 live `view.ir` rewrites and 3 reload-from-storage rounds: 0 freezes, 0 node mutations at rest in any viewpoint, max event-loop lag 28 ms [M].
- **Best-supported cause (H1): an L-proxy nested in a value written through `view.ir = draft`.** `Action.fire` refuses only a top-level proxy (`redux/action/action.ts:321`); a nested one is stored as-is (`storedIsProxy: true`) [M]. `JSON.stringify` then walks the lazily-built L graph: 0.8 s to 62.5 s on one synchronous task, ending in «Converting circular structure» [M]. Cmd+S (`U.compressedState`, `common/U.tsx:439`) left the page unresponsive from 5.5 s to 232.7 s; the id control stayed responsive [M]. The compile path (`irHash`, `viewpoint/ir/irCompile.ts:335-336`) gave an 820 ms task and the view was silently skipped [M]. Product writers store ids, so only a hand-written draft can bring the proxy in [R]. A driver that stringifies an L object returned by a snippet does the same: `JSON.stringify(LClass)` ran past 60 s [M]. CDP by-value return is safe (~50 ms, `{}`) [M].
- **Ranked alternatives.** H2: two HMR bursts reached 3001 inside the chat's window, at 19:26:19 and 19:34:43 (`/private/tmp/s3/vite3001.log:3355-3398`). At 18:28:43 three `page reload`s also landed (`:3346-3349`) [M]. This explains at most two of the four freezes. H3: a loop in product code on these paths. It found no support in the replays [M].
- **What would discriminate them.** For H1: the chat's snippets before each freeze, in particular a value that is an L object (`A1` instead of `A1.id`) or a snippet whose last expression is one. For H2: the freeze timestamps against 19:26:19 and 19:34:43.
- **«Request timed out» is not H1's signature.** A save that fails on a proxy shows «Error while Saving Project» [R: `saveProject.tsx:73-75`]. The toast with the data persisted means a *successful* save took over 10 s. On the fixture a save takes 116–472 ms and yields 17 times through `setTimeout(0)` (`async-lz-string`, one yield per 10,000 characters) [M]. The likely cause is a hidden or occluded Chrome tab, where chained timers are throttled to one wake-up per second [R: Chrome policy]; that is 17 s or more for a save. Headless Chrome never reports `hidden`, so this could not be measured here [M]. To discriminate: `document.visibilityState` and a 20× `setTimeout(0)` chain timed in the chat's tab.
- **Point 2: missing implementation** [R+M]. `collapsed.form`, `collapsed.fill` and `collapsed.badge` are compiled (`irCompile.ts:463-465`) and read nowhere; each name has 2 hits, the compile and the type. Collapsed, B keeps `ir-shape--rounded`, the chip reads «4» and `bi-box-seam` appears 0 times [M]. Control: `shape.form = 'cylinder'` does show as `ir-shape--cylinder` [M].
- **Point 3: missing implementation** [R+M]. The node markup is byte-identical with and without `structure` and the compartment `title`; control: moving a label does change the markup [M]. `structure` has 0 readers on the render path (`irTypes.ts:416-419` says the render slice «follows»). `title` is form-only by contract (`irTypes.ts:151-157`).
- **Side finding 1: confirmed, it is data loss** [M]. The Cmd+S handler holds the `LProject` from Navbar's last render (`Navbar.tsx:564`, effect deps `:1300`); Navbar re-renders only on `user`/`m2models`/`advanced`/`debug` (`:2077-2092`). `ProjectsApi.save` copies `project.__raw` (`projects.ts:125`). `compressedState` writes that copy over the live project entry (`U.tsx:437`). Measured: `+ New` then Cmd+S saves `project.viewpoints` with 5 entries against 6 live, and after a reload the viewpoint is in root `viewpoints` (the selector) but not in `project.viewpoints`. Control: a save through a fresh `LProject.getProject()` keeps all 6.
- **Side finding 2: not reproduced.** The cards match `subViews` and fathered views in 8 of 8 readings, live and after a reload; «0 views» appears only on empty viewpoints [M]. Hypothesis: a viewpoint re-created after side finding 1 hid the first one.

**Recommended:** five Phase 2 lanes, in this order (§6):
- F1: deep proxy guard on `set_ir` and a replacer in `irHash`/`compressedState`; critical zone for `irCompile.ts`.
- F2: `save` reads the live project.
- F3: collapsed render; critical zone.
- F4: StructureSpec render; critical zone.
- F5: a save timeout that ignores hidden-tab throttling.

**Decisions taken (unattended):** none.

**Decisions awaiting Alfonso:** the critical-zone go-ahead (RC-30) for F1, F3 and F4, which touch `viewpoint/ir/` (CLAUDE.md §3.1). F1's deep check in `Action.fire` is a core change (Rule 5): the alternative is the local guard in `set_ir` only.

Recommended: open F2 first (data loss, no critical zone), then F1 with the go-ahead.

## 1. Hypotheses falsified and method

- H3, a product loop in (a)–(d): falsified on the fixture.
- H1: reproduced as a mechanism; its presence in the chat's session is unverified.
- H2: timing only.
- Idle loops per viewpoint: falsified.
- Content-size iteration: bounded by a write budget (`useContentSize.ts:81,216-231`); no mutation at rest on the ellipse, diamond, hexagon or circle views [M].

Probes are gitignored in `frontend/scripts/smoke/`. Logs are in `~/.jjodel-lanes/P-2026-09-29-1935/`. The dev server ran on 3056 from this tree and was stopped by this session.

| Probe | What it measures |
|---|---|
| `_tmp_irfreeze_common.ts` | Fixture: the prompt's metamodel. The model is built through `createM1` and `createAdapter.createInstance` (5 vertices, 8 edges). The four viewpoints are created with the tree's `+` and the default class, then `view.ir = draft` with pins set to ids. Watchdog: an evaluate raced against 5 s; on a miss, `Debugger.pause` samples. |
| `_tmp_irfreeze_replay.ts` | (a)–(d): run1–3 (selectors), run4 (4 rounds, no child vertices), run5 (3 rounds, faithful fixture). |
| `_tmp_irfreeze_replay2.ts` | Live rewrites and reload rounds. Declared gap: after a reload the tree `+` is not found, so (a) in variant f did not run. |
| `_tmp_irfreeze_idle.ts` | Rest: 0 mutations and 0 long tasks on all four viewpoints. |
| `_tmp_irfreeze_s1.ts` | The save: 165,549 characters, 352 ms of compression, 17 yields, 472 ms in total. |
| `_tmp_irfreeze_hidden.ts`, `_vis.ts` | Visibility: headless stays `visible`; this arm is void. |
| `_tmp_irfreeze_retval.ts`, `_proxyir.ts`, `_proxysave.ts`, `_proxyact.ts` | H1, each with an id control. |
| `_tmp_irfreeze_render.ts` | Points 2 and 3: 6/6. |
| `_tmp_irfreeze_side.ts` | Side findings: 5/6; the FAIL is the finding. |

## 2. Files read

`frontend/src/`:
- `components/project/NewViewDialog.tsx`
- `utils/lastViewpoint.ts`
- `components/TreeViewSidebar/TreeViewContent.tsx:1903-2070`
- `view/viewElement/view.tsx:170-190,640-668`
- `redux/action/action.ts:312-332`
- `common/libraries/saveProject.tsx`
- `api/persistance/projects.ts:100-230,268-400`
- `common/U.tsx:420-442`
- `data/storage.ts`
- `pages/components/Navbar.tsx:74-120,555-570,945-1300,1860-1885,2077-2095`
- `App.tsx:60-130`
- `components/editor-v2/viewpoint/ir/`: `useContentSize.ts`, `irCompile.ts:325-345`, `irResolveCore.ts:205-245`, `irReadCtx.ts:100-130`, `shapeRegistry.ts:740-775`, `irTypes.ts` (vertex, graphVertex, edge and row types; StructureSpec)
- `components/editor-v2/nodes/ObjectNode.tsx:617-621,905-965`
- `components/editor-v2/hooks/createAdapter.ts:415-560`, `components/editor-v2/hooks/useLayoutAutosave.ts`
- `components/editor-v2/EditorV2.tsx:455-490,3575-3600`
- `components/project/ProjectEditor.tsx:1120-1230,2872-2930`

Elsewhere:
- `node_modules/async-lz-string/src/{wait,compressor}.ts`
- `/private/tmp/s3/vite3001.log`
- the `~/jjodel-release` reflog

The subagents read `irContainment.ts`, `IRContainmentHulls.tsx`, `irCollapseState.ts`, `structureCapabilities.ts`, `StructureGroups.tsx` and `joiner/classes.ts:1253-1290`. I re-read the lines cited here. Critical zone: `useJjomSync.ts` and `portDistribution.ts` were not read; the evidence did not lead there.

## 3. The freeze, the evidence

| Arm | Result |
|---|---|
| Replays (a)–(d) | 28 runs, 0 froze. Every save toasted «Project Saved!» only. |
| Nested proxy stored | `idlookup[view].ir.authoringMetaclassPins.A1.__isProxy === true` after `view.ir = draft`. Not refused: the guard at `action.ts:321` reads `this.value.__isProxy`, top level only. |
| `JSON.stringify` | `ir`: 31.8 s. State: 62.5 s. Both throw a circular `TypeError`. Control: 0–1 ms, 177,044 characters. |
| Cmd+S with the proxy | First missed evaluate at 5.5 s, recovered at 232.7 s. Samples: React commit frames (`commitMutationEffectsOnFiber`, `propagateContextChange`); the serialization frames are native and not sampled. Id control: responsive. |
| Activation with the proxy | One 820 ms long task; `[ir] compile failed for view`; A1 falls back from ellipse to the default node. Control: 95 ms and 51 ms tasks, ellipse. |
| HMR on 3001 | Merges into `~/jjodel-release` at 19:26:19 (`irTabs.tsx` invalidated, `SymbolEditorModal`, `VertexAuthoringPanel`, `ViewData`) and at 19:34:43 (`ObjectNode`, `EditorV2`, `SimulationPanel`). 3001 is that tree's Vite dev server, up since 2026-09-25 (pid 61660). |

## 4. Points 2 and 3

**Point 2.** The spec (`claude_spec_2026-07-18_ir_schema_v1_2.md:159-167`) nests `collapsed.shape: Partial<Shape>`; the code flattens it to `form` and `fill`. That divergence needs a decision before the render lane.
- Chip: `ObjectNode.tsx:943-963`. The count ignores `childFilter`.
- Form: `ObjectNode.tsx:912` and `IRNodeContent.tsx:206-207`, neither conditioned on `isCollapsed`.
- Badges: `IRNodeContent.tsx:521`, `shape.badges` only.

**Point 3.** The resolved view is `CompiledView`, which has no `structure` field (`irTypes.ts:753-809`). The native node calls `resolveInstanceNodeStyle()` with no layers (`ObjectNode.tsx:619`). The `emptyBehavior: 'dash'` and `separator: true` of the prompt's fixture equal the defaults (`irCompile.ts:448`), so they could not show a difference either.

## 5. Side findings

**1.** Per contrasto:

| Sequence | Saved `project.viewpoints` against live |
|---|---|
| `+ New`, then Cmd+S on the project page | 5 against 6 |
| The same after switching to the model tab | 7/7 |
| The same after switching to the metamodel tab | 7 against 8 |

After a reload, `projectVps` lacks SideVP3 and `rootVps` has it. VER1 and VER2 (`projects.ts:185-219`) already measured that the proxy detaches. The claim that every production call site takes a fresh proxy does not hold for Navbar's Cmd+S. Every project-level list is exposed the same way: `models`, `metamodels`, `graphs`, `viewpoints`.

**2.** «0 views» was not reproduced (§0).

## 6. Recommended Phase 2 lanes

**F2: save the live project** (fast; no critical zone).
- Files: `api/persistance/projects.ts`; optionally `pages/components/Navbar.tsx`.
- Fix: `save` reads `store.getState().idlookup[project.id]` instead of `project.__raw` at `:125`. The VER2 realignment stays.
- Test: a browser probe (side 5/6 today, expected 6/6) and a vitest over the pure part if it imports; `window` is not defined through `joiner`, so declare the gap per §5.

**F1: no proxy in the D-layer** (full lane; critical zone).
- Files: `view/viewElement/view.tsx` `set_ir`; a pure new `model/unproxy.ts` with its test; `viewpoint/ir/irCompile.ts` `irHash`; `common/U.tsx` `compressedState`.
- Fix:
  - `set_ir` deep-maps nested L objects to their `id` or refuses.
  - `irHash` and `compressedState` stringify with a replacer that maps any `__isProxy` value to its id.
  - Optionally, the deep check in `Action.fire` (core, Rule 5).
- Test: a synthetic lazily-infinite proxy (fresh proxy on every get, a counter that throws at N). Today `irHash` reaches N; after the fix it terminates.
- Layer Impact Report and go-ahead (RC-30).

**F5: save timeout** (fast).
- File: `common/libraries/saveProject.tsx`.
- Fix: the 10 s guard counts only visible time, or restarts on compression progress.
- Test: fake timers with `visibilityState` hidden. Red today: the toast fires.

**F3: collapsed render** (full lane; critical zone).
- Files: `nodes/ObjectNode.tsx:912,943-963`; `viewpoint/ir/IRNodeContent.tsx:206,521`.
- Decision first: the spec's `collapsed.shape` or the code's flat fields.
- Fix: collapsed form, fill and badge; the badge replaces the count chip when declared.
- Test: a render test with collapsed state, red today.

**F4: StructureSpec render** (full lane; critical zone).
- Files: `ObjectNode.tsx:619`, `instanceNodeStyle.ts`, `IRNodeContent.tsx`.
- Fix: the IR view as the viewpoint layer of `resolveInstanceNodeStyle`: header band, top accent, type chip.
- Compartment `title` on the canvas amends the contract at `irTypes.ts:151-157`, so it needs an R- row.
- Test: markup differs with and without `structure`; red today.

## 7. Open questions

For the chat, not for Alfonso:
- The freeze timestamps, to compare with H2.
- The JS of each snippet before a freeze, for H1.
- The visibility of the tab during saves, for the timeout.
