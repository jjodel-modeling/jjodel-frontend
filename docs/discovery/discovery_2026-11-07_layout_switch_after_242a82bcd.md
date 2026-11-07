# Discovery: the layout switch between two exclusive viewpoints after 242a82bcd

Prompt: P-2026-11-07-0106 (lane L0b of the multi-tab front). Measurement by session e9c2f635-8ea3-4208-befd-5536b0b33070,
which stopped at the context ceiling (RC-51) after all runs; the report is written by the project chat
C-2026-11-06-2333 from the lane's handoff (`~/.jjodel-lanes/P-2026-11-07-0106/handoff.md`), its probe logs and the
output of its `summarize.mjs`. No source change on any branch.

## 0. Answer in brief

**Regression confirmed, live since release 3.1.0.** On the trunk (`f4c031b3e`), switching between two exclusive
viewpoints from the toolbar picker leaves every node at the previous viewpoint's positions: 0 of 3 nodes match the new
key, at +4 s and at +10 s, in all three runs. On the parent of `242a82bcd` (`f64458ebb`) the same steps match 3 of 3 in
all runs. `242a82bcd` is contained in the tags `3.1.0` and `3.1.1`.

**Cause [read]**: the incremental sync of `useJjomSync.ts` skips every vertex whose D-object, model and hash are
unchanged (`:1406`, `:1414`) and its dependencies carry no layout key (`:1617`); before `242a82bcd` the workaround
(`prevModel = {}` and `Date.now()` in the deps) re-transformed every vertex on every render, which hid the missing key.
The editor does not remount on a switch (`EditorSwitch.tsx:111-141`). A reload repairs the picture (step 4: 3/3), and
renaming one object moves only that node (step 6: 1/3).

**Smallest fix (R-LAY-18)**, not written: make the layout key an input of the incremental sync (a selector or dep on
`getLayoutKeyOf(state)`) and re-transform every vertex once when it changes (bypass `unchanged` for that run or clear
`prevElementsRef`), keeping the existing patch path. It is critical zone (CLAUDE.md §3.2) and needs a Layer Impact
Report first; scope of the LIR in §5.

**Multi-tab**: the per-tab key of lane L3 must enter the sync as this same dependency, so this fix is the first step of
L3 and should land before it.

**Decisions awaiting Alfonso**: the go-ahead for the critical-zone fix lane, and whether it ships as a 3.2.x patch.

## 1. Hypothesis and objective

Hypothesis (discovery `discovery_2026-11-06_multi_tab_viewpoints.md` §3.4, read, not measured): since `242a82bcd`
(2026-10-21) nothing in the incremental sync re-runs when only the layout key changes, so after a switch the nodes stay
at the previous key's positions instead of `layoutByViewpoint[newKey]`. Objective: measure it on the trunk against the
parent of `242a82bcd` as control, and name the smallest change if confirmed.

## 2. Files read

- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (`:1146-1168`, `:1219-1297`, `:1300-1617`), on `f4c031b3e`
  and on `f64458ebb`
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`:58-59`)
- `frontend/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts` (`:70-79`)
- `frontend/src/components/editor-v2/viewpoint/layout/vertexLayout.ts` (`:66-71`)
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx` (`:111-141`)
- `docs/discovery/discovery_2026-10-21_jjomsync_incremental.md` (open point at `:221-223`)

## 3. Findings

**F1 [read]** The incremental effect's dependencies are `[isJjomMode, elementSnapshots, subElementIds, scheduleFlush,
antiBounceTick]` (`useJjomSync.ts:1617`); the `elementSnapshots` selector (`:1146-1168`) contains no layout key.

**F2 [read]** A vertex is skipped when `const unchanged = prevD === dElement && prevModel === currModel && currHash ===
prevHash;` (`:1406`) holds: `if (unchanged) continue;` (`:1414`).

**F3 [read]** The parent tree has `prevModel = {} as any;` (`:1334`) and `}, [isJjomMode, elementSnapshots,
subElementIds, scheduleFlush, Date.now()]);` (`:1533`): every vertex was re-transformed on every render. HEAD has
neither (grep count 0).

**F4 [read]** `effectiveLayoutOf` reads `getActiveLayoutKey()` (`jjomTransformers.ts:58-59`); `getLayoutKeyOf` reads
`state.viewpoint` and `isExclusiveView` (`vertexLayoutAdapter.ts:70-79`); `readVertexLayout` returns the record when
there is one, else the seed (`vertexLayout.ts:66-71`). The transformer would read the right key; it is just not called.

**F5 [read]** No remount on a switch: both branches of `EditorSwitch.tsx:111-141` render `<EditorV2 modelid=…>` with no
`key`.

## 4. Measurements

Fixture, per run a fresh project built through the app: classes Alpha, Beta, Gamma with one object each; two exclusive
viewpoints ProbeA and ProbeB with one IR view per class; stored positions written by real mouse drags (+160 px x under
ProbeB, +180 px y under ProbeA). Expected position: `readVertexLayout(vertex, getActiveLayoutKey())`. Rendered: the
`style.transform` of the active tab's React Flow nodes, tolerance ±1 px. Switches through the toolbar picker. Three runs
per commit, dev servers on 3197 (HEAD) and 3198 (parent), both stopped. pageErrors 0 in every run; every setup check
PASS. Raw data: `layout-switch-head.json`, `layout-switch-before.json` and the probe logs in the lane folder.

Nodes matching the active key, out of 3, per run, at +4 s | +10 s:

| Step | HEAD `f4c031b3e` | parent `f64458ebb` |
|---|---|---|
| 1 A baseline after drags | 3\|3, 3\|3, 3\|3 | 3\|3, 3\|3, 3\|3 |
| 2 A → B | **0\|0, 0\|0, 0\|0** | 3\|3, 3\|3, 3\|3 |
| 3 B → A | 3\|3, 3\|3, 3\|3 (not discriminating: the nodes never left A) | 3\|3, 3\|3, 3\|3 |
| 4 reload on B | 3\|3, 3\|3, 3\|3 | 3\|3, 3\|3, 3\|3 |
| 5 after reload, B → A | **0\|0, 0\|0, 0\|0** | 3\|3, 3\|3, 3\|3 |
| 6 rename Alpha (one vertex change) | **1\|1, 1\|1, 1\|1** | 3\|3, 3\|3, 3\|3 |

The control discriminates: the parent matches on the two switches that HEAD fails, so the probe reads the right thing
and the regression starts with `242a82bcd`. Step 6 fits F2: only the changed vertex is re-transformed. On HEAD the
fixture itself showed the defect: the ProbeA records' x equal the ProbeB x, because the A drags started from B's
positions.

## 5. Verdict and the fix

**Confirmed.** Live on the trunk and in `3.1.0` and `3.1.1` (`git tag --contains 242a82bcd`).

Smallest change, in `useJjomSync.ts` only: a selector or dependency on `getLayoutKeyOf(state)`; when it differs from the
last run, re-transform every vertex once (bypass `unchanged` for that run, or clear `prevElementsRef`), keeping the
existing patch path, which carries position plus the `patchedNodeSizes` / `measured` removal. The Layer Impact Report
must cover: the sync layer and the v2-flow canvas (positions, sizes, `measured`, handles through the ResizeObserver, the
anti-bounce interplay with `isCanvasUpdated`); the edges, which are not re-patched; `useIRContainment`
`applyContainerLayout`, which reads the key itself; `fitView` and the viewport per key; the D-layer, which receives no
writes. Smoke: A → B → A plus reload with three nodes, and a container viewpoint.

## 6. Risks

- A full re-transform on every switch costs one pass over all vertices; on large models (the 407-instance harness
  model) it may be noticeable. Accepted for a user gesture; to be measured in the fix lane.
- The per-tab key of multi-tab lane L3 enters through the same dependency: L3 must build on this fix, not beside it.

## 7. Open questions

- Q1 Ship the fix as a 3.2.x patch, or only on the trunk? Recommended: on the trunk first, then a patch, since the
  defect has been live since 3.1.0 and every switch shows wrong positions until a reload.

## 8. Decisions taken (unattended)

- The project chat wrote this report from the lane's measured data after the lane stopped at the context ceiling,
  instead of opening a continuation lane while the Mac's load average was above 80.

## 9. Decisions awaiting Alfonso

- Go-ahead for the critical-zone fix lane on `useJjomSync.ts` (RC-26), with the Layer Impact Report first.
- Q1.
