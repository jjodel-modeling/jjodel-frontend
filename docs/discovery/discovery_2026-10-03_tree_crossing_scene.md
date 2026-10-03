# Discovery: the tree-connector crossings follow the edge path registry

Prompt-ID: P-2026-10-03-1002 · prompt `docs/prompts/claude_2026-10-03_1002_prompt_tree_crossing_scene.md` (`68d895fcd`) · session `4828f36d-f070-41de-b0a2-8ae677271050` · chat C-2026-10-01-1725
Tree: `~/jjodel-w-treecross`, branch `tree-crossing-scene`, HEAD `68d895fcd` (app code as the trunk `fba1549ee`) · executor: Anthropic Claude Opus 5.5 · Phase 1, no `src` file changed.
This report is a set of hypotheses with evidence. Whoever uses it downstream rereads the real files.

## 0. Answer in brief

1. **Verdict: yes.** The crossing set that `useTreeLayout` draws on a tree connector follows an edge moved across it, with the editors idle between actions.
2. **Scene** (seeded by the probe, also written as a fixture): P, C1, C2 with `C1 extends P` and `C2 extends P` (one tree connector), and `r: X -> Y`. X sits in the gap between C1 and C2, so the vertical of `r` leaves X's bottom above the bus at y=112 and crosses it.
3. **Numbers** (measured, `lane-run probe` on 3017). There are 11 states: rest, 6 pointer drags, 4 keyboard moves.
   - The drawn bus arcs equal the registry oracle and the geometric expectation in all 11.
   - Crossing x, in action order: 742, none, 742, 694, 742, none, 742, none, 742, 726, 742.
   - Idle: 0 EditorV2Inner and 0 UnifiedEdge renders per second in all 11 samples. The only commit at rest is `LastSavedIndicator`, at most 1 per 3 s.
   - Same result from the fixture: 59 PASS, 0 FAIL.
4. **The wiring is load-bearing, and measured.** The served-module mutation `mut-bar` drops `edgePathsVersion` from the bus memo. It is **killed**: 6 of 11 states red.
   - A ghost arc, a missing arc, or an arc at the old x (846 or 742 instead of 742 or 726).
   - Where: after every keyboard move, and after the two releases that re-anchor `r`.
   - It survives the four plain drags, because the release's nodes update re-runs the memo through `allNodes`.
5. **The trunk memo cannot cross.** `mut-trunk` survives (equivalent). By read: the trunk's horizontal is at most 4 px (`TREE_BUS_CORNER_RADIUS`), and a crossing needs more than 12.
6. **No defect found.** Phase 2 would add no app code: keep the probe and the fixture as the acceptance measure and close.
7. **Decisions taken (unattended):** 6, §7. **Decisions awaiting Alfonso:** none.

Recommended: Phase 2 = close with `frontend/scripts/probe/tree-crossing.ts` and its fixture as the acceptance measure, no app change.

## 1. Objective and hypotheses

Objective: a scene and a probe in which an edge crosses a tree connector. Verdict wanted: does the tree-connector crossing set follow an edge dragged across the connector, with the editors idle between actions? Yes or no, with numbers.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The two crossings memos of `useTreeLayout` recompute when an edge moves across the connector | **Holds, for the bus memo** (measured, §4.1). The trunk memo recomputes too, but its result is always empty (H4) |
| H2 | After an action, at rest, the drawn arcs equal what the registry says | **Holds**, 11/11 states, seed and fixture (§4.1) |
| H3 | No extra render at rest (fix B) | **Holds**: 0 EditorV2Inner/s and 0 UnifiedEdge/s in every idle sample (§4.1) |
| H4 | The version in the deps of both memos is what makes them follow | **Partly.** Bus memo: load-bearing (`mut-bar` killed, §4.2). Trunk memo: unobservable, the trunk never has a horizontal long enough to cross (read §5.3, `mut-trunk` survives) |
| H5 | A pointer drag is enough to show it | **Falsified.** A plain drag does not need the version: the release re-runs the memo through `allNodes`. Only a drag whose release re-anchors the edge, and a keyboard move, discriminate (§4.2, §5.2) |

## 2. Files read

Paths under `/Users/alfonso/jjodel-w-treecross/` unless stated.

- **Rules:** `CLAUDE.md` (whole, as loaded); `docs/PROTOCOL.md` (P1-P16 read: P4, P6-P9, P11-P12, P16 whole); `docs/decisions.md` 1-80 and 140-300 (RC-3..RC-34, with RC-20/21/25/26/30/32); `docs/claude-code-log.md` 1-120.
- **Prior work:** `docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md` (1-95, 142-154, 283-481: §0-§3, §4.4, all Phase 2 addenda).
- **Subject:**
  - `frontend/src/components/editor-v2/hooks/useTreeLayout.ts` (whole, 253 lines).
  - `frontend/src/components/editor-v2/utils/edgeUtils.ts`: 1440-1720 (tree geometry, bar search) and 1720-1960 (registry, version, `getEdgeCrossings`), 2100-2137 (bridge emission).
  - `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`: 225-262, 380-480, 735-900.
  - `frontend/src/components/editor-v2/EditorV2.tsx`: 3959-4130 (`handleNodesChange`), 4344-4345.
- **Library:** `frontend/node_modules/@xyflow/react/dist/esm/index.mjs` 12.10.2: 1641-1675 (`moveSelectedNodes`), 1945-1980, 2180-2210 (node `onKeyDown`), 3335-3360 (`updateNodePositions`).
- **Harness:** `frontend/scripts/probe/hidden-tab-loop.ts` (whole); `frontend/scripts/lane-run.mjs` 736-880 (`probe`); `frontend/scripts/smoke/states.ts` (`seed`); `frontend/scripts/smoke/README-probes.md` 1-60; `frontend/scripts/tsconfig.json`; `frontend/src/api/persistance/projects.ts` 124-160, 257-300, 383-400; `frontend/src/components/project/ProjectEditor.tsx` 545-590.

Searches used `command grep` with the hits shown; no claim of absence below rests on a search.

## 3. What a tree connector is here (read)

- **The group.** Every `inheritance` edge with the same target, unless an anchor is pinned off top/bottom. `useTreeLayout.ts:86-96`: «`if (e.type !== 'inheritance' || e.target !== target) return false;`». It is a tree when the group has more than one edge (`:100`, «`const isGrouped = group.length > 1;`»). The primary edge is the lowest id (`:99`).
- **Rendering.** The primary edge draws the trunk and the bus (`UnifiedEdge.tsx:799` «`d={trunkPathFinal}`», `:808` «`d={barBranchesPathFinal}`»). It also draws two transparent hit paths with the raw geometry (`:789` «`d={treeGeometry.barAndBranchesPath}`»). The other members draw only hit paths (CASE 2).
- **The bus is two halves.** `computeTreeConnectorPath` gives each outer child an L: its vertical, then the bus toward the trunk (`edgeUtils.ts:1606`, «`` `M ${child.childX} ${child.childY} L ${child.childX} ${barY} L ${barJoinX} ${barY}` ``»). In the scene the bus is sub-path 1, `M 960 50 L 960 112 L 124 112` (measured).
- **Registration.** The primary registers `<id>__trunk` and `<id>__tree_<i>` in an effect (`useTreeLayout.ts:170-194`), group `tree_<parent>`. Grouped members register nothing of their own (`UnifiedEdge.tsx:451`, «`if (isInheritance && isGrouped) return;`»). Crossings inside a group are skipped (`edgeUtils.ts:1874`).
- **Who draws an arc.** Only a horizontal of one entry crossing a vertical of another: the horizontal side draws (`edgeUtils.ts:1888` «`// Only process horizontal segments of this edge`», `:1899` «`// Only crosses with vertical segments of the other edge`»).
  - So the tree draws arcs only where its bus crosses another edge's vertical. That is the case this probe builds.
  - Where another edge's horizontal crosses the tree's trunk or branches, the arc belongs to that edge's `UnifiedEdge` memo (`:467-471`). Not measured here (§6).
- **What the memos compare.**
  - `trunkPathFinal` (`useTreeLayout.ts:203-217`) and `barBranchesPathFinal` (`:219-242`) call `getEdgeCrossings` on the raw tree points against the registry, scoped to the canvas's node ids, with no node rects.
  - Both list `edgePathsVersion` (`:200`, uSES on `subscribeEdgePaths`) in their deps: `:217` «`[edgeId, isPrimary, isGrouped, treeGeometry, activeNodeIds, allEdges, edgePathsVersion]`», `:242` «`[edgeId, isPrimary, isGrouped, treeGeometry, allNodes, allEdges, edgePathsVersion]`».

## 4. Measurements

### 4.1 The probe and the baseline

`frontend/scripts/probe/tree-crossing.ts` and its fixture, committed as `9c9fd905c` (new; `ls frontend/scripts/probe/` listed five other files, none of that name). It drives the real app on its own Vite, headless Chromium 1440x900.

- **Seed** (`TC_MODE=seed`): a fresh project, `metamodel_1`, JjScript `create class P`, `C1`, `C2`, `C1 extends P`, `C2 extends P`, `create class X`, `Y`, `create reference r in X type Y` (8/8 succeeded).
  - The default placement puts P (50,50), C1 (470,50), C2 (890,50) on one row, the bus at y=112 from x 124 to 960, X (50,350), Y (470,350).
  - Two pointer drags arrange it: Y to (592,640), X to (672,48), both landed exactly (16 px snap, `EditorV2.tsx:4345`).
  - `r` then runs `M 742 94 L 742 361 … L 662 636`: its vertical crosses the bus at (742,112).
- **Fixture** (`TC_MODE=fixture`): `frontend/scripts/probe/fixtures/tree-crossing.jjodel`, the saved project record (same `DProject` shape as the demo exports, 46708 bytes), written by the seed run with `TC_WRITE_FIXTURE=1`. Imported, it reopens with X and Y at the seeded positions (checked).
- **Read at rest after each action** (1500 ms settle, 3000 ms idle sample):
  - drawn arcs: the `A 6 6` bridges in the two `.inheritance-edge` paths of the primary edge, the memos' output;
  - the oracle: the app's own `getEdgeCrossings`, imported from the served `edgeUtils.ts` and called at rest with the memos' arguments, so it reads the registry after every effect;
  - the geometric expectation: one crossing at X's centre when X's bottom is above the bus, none when it is not;
  - renders at rest: commits, EditorV2Inner and UnifiedEdge renders, through `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`.
- **Controls** (P12):
  - the oracle is the app's instance: version 31 > 0 and one crossing in the first state; a second, unloaded instance would have answered version 0 and no crossing;
  - each action moved X and committed (10-78 commits during the action), so an idle 0 is not a dead counter.

Runs, all through `~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-treecross frontend/scripts/probe/tree-crossing.ts --port 3017 --id P-2026-10-03-1002`, log `~/.jjodel-lanes/P-2026-10-03-1002/probe-tree-crossing.log`:

| run | env | result |
|---|---|---|
| seed | `TC_WRITE_FIXTURE=1` | 62 PASS, 0 FAIL, exit 0 |
| fixture | `TC_MODE=fixture` | 59 PASS, 0 FAIL, exit 0 |
| `mut-bar` | `TC_PATCH=mut-bar` | 6 FAIL, exit 1 (killed) |
| `mut-trunk` | `TC_PATCH=mut-trunk` | 0 FAIL, exit 0 (survives) |
| `mut-both` | `TC_PATCH=mut-both` | 6 FAIL, exit 1 (killed, the same 6) |

Baseline, seed run (the fixture run gives the same x in every state):

| state | X | bus arcs drawn | oracle | expected | idle EditorV2Inner/s, UnifiedEdge/s | commits during the action |
|---|---|---|---|---|---|---|
| rest | 672,48 | 742 | 742 | 742 | 0, 0 | — |
| drag-down (+160) | 672,208 | — | — | — | 0, 0 | 65 |
| drag-up | 672,48 | 742 | 742 | 742 | 0, 0 | 67 |
| drag-left (−48) | 624,48 | 694 | 694 | 694 | 0, 0 | 26 |
| drag-right | 672,48 | 742 | 742 | 742 | 0, 0 | 31 |
| drag-away (to 48,624) | 48,624 | — | — | — | 0, 0 | 78 |
| drag-back | 672,48 | 742 | 742 | 742 | 0, 0 | 78 |
| key-down (Shift+↓, 64) | 672,112 | — | — | — | 0, 0 | 18 |
| key-up | 672,48 | 742 | 742 | 742 | 0, 0 | 19 |
| key-left (←, 16) | 656,48 | 726 | 726 | 726 | 0, 0 | 10 |
| key-right | 672,48 | 742 | 742 | 742 | 0, 0 | 11 |

- Trunk arcs are none, drawn and oracle, in every state of every run.
- The crossing is always on sub-path 1 (the right half of the bus).
- Idle commits are 0 except one `LastSavedIndicator` commit in 1-2 samples per run, from the debounced save indicator. It is not an editor or edge render.

### 4.2 Mutation bench: served-module rewrites of `useTreeLayout.ts`

Same technique as `hidden-tab-loop.ts`: a Playwright route rewrites the served module. The probe FAILs unless each rewrite matched exactly once, and each did.

- `mut-bar`: `allNodes, allEdges, edgePathsVersion]` → `allNodes, allEdges]` (the bus memo, `:242`). **Killed.** The 6 states, drawn vs oracle:

  | state | drawn | oracle |
  |---|---|---|
  | rest (after the arrange drag) | 846 | 742 |
  | drag-back | 846 | 742 |
  | key-down | 742 | — (ghost arc) |
  | key-up | — | 742 (missing arc) |
  | key-left | 742 | 726 |
  | key-right | 726 | 742 |

  - The four plain drags (down, up, left, right) and drag-away stay green.
  - The stale state lasts the whole idle sample and is still there at the next action: at rest nothing re-renders to correct it.
- `mut-trunk`: `activeNodeIds, allEdges, edgePathsVersion]` → `activeNodeIds, allEdges]` (the trunk memo, `:217`). **Survives**, all green. It is equivalent by geometry (§5.3).
- `mut-both`: both rewrites; the same 6 reds as `mut-bar`.

This closes the gap that P-2026-10-02-1450 declared («the `useTreeLayout` wiring has no measured kill: **declared gap**», `discovery_2026-10-02_hidden_tab_render_loop.md`, Phase 2 extension, «Tests and benches»), for the bus memo.

## 5. Findings

### 5.1 Why it follows (read, confirmed by §4.2)

The edge registers its new path in an effect, after the render in which the tree computed its arcs (`UnifiedEdge.tsx:449-456`). The registry then moves its version once per burst, in a timer (`edgeUtils.ts:1780-1784`, «`setTimeout(flushEdgePaths, 0);`»). The bus memo has the version in its deps, so the tree computes its arcs again against the new path. Without it, the arcs keep the path of the previous render until the next change of `allNodes`, `allEdges` or the tree geometry.

### 5.2 Why a plain drag does not need the version, and what does

- **Plain drag.** On release React Flow emits a position change with `dragging: false`. `handleNodesChange` applies it (`EditorV2.tsx:3979`, «`const hasDragEnd = changes.some(`»), so the nodes array changes once more, after the last frame's registration effect. The primary edge subscribes to the nodes (`useTreeLayout.ts:77-79`), and `allNodes` is a dep of the bus memo (`:242`), so the release itself re-runs the memo against the final path.
- **A release that re-anchors.** The same release recomputes the anchors of the moved node's edges (`EditorV2.tsx:4035`, «`computeAnchorsWithHysteresis(edgesToRecalculate, nodeRects, currentEdges)`»). In drag-back the sides of `r` change at release, from X's right to its bottom (`r` in drag-away: `M 192 645 L 386 645 …`). So the path changes in the release render itself, and only the version brings the tree up to date. Under `mut-bar` the tree keeps the last frame's arc at x=846 (§4.2).
- **Keyboard.** A move by arrow key is a single change with `dragging` defaulting to false. In `index.mjs`, `:3335` «`updateNodePositions: (nodeDragItems, dragging = false) => {`», called from `:1675` «`updateNodePositions(nodeUpdates);`». There are no drag frames before it, so the path changes in the only render there is. These are 4 of the 6 kills.

### 5.3 The trunk memo's crossings are always empty (read; measured as `mut-trunk` surviving)

- The trunk is one vertical, or, when the trunk lands on an end of the bus, a horizontal of `trunkElbowRadius` then the vertical (`edgeUtils.ts:1582`).
- That radius is at most `TREE_BUS_CORNER_RADIUS = 4` (`:1443`, `:1570`). The scene's trunk is `M 124 112 L 120 112 L 120 96`, a 4 px horizontal.
- `getEdgeCrossings` takes a crossing only when it lies more than `SEG_INTERIOR_MARGIN = 6` (`:1851`) inside both ends of the horizontal, so a horizontal of 12 px or less never crosses.
- The trunk memo therefore always returns the rounded trunk, and its `edgePathsVersion` dep changes nothing a user can see. It stays as it is (Rule 9): it costs one `getEdgeCrossings` call per recompute.

## 6. Risks and limits

- **R1, module instance.** The oracle imports `edgeUtils.ts` by URL. A long-lived Vite that has served an edited module can hand out a second instance (P-2026-10-02-1450, «Measurements, before and after»). The positive control (version > 0, one crossing at rest) fails in that case, and `lane-run probe` always starts a fresh Vite.
- **R2, fixture schema.** The fixture is today's saved record. A future VersionFixer migration may rewrite it on import; seed mode stays the source.
- **R3, not measured: the reverse direction.** Another edge's horizontal crossing the tree's trunk or branches is that edge's arc, from `UnifiedEdge`'s memo reading the tree's registered segments. That memo is wired and its mutation was killed on `demoFlowB` by P-2026-10-02-1450, but not on a tree segment.
- **R4, not measured: the tree moving under a still edge.** That case goes through `treeGeometry`, a dep of both memos, not through the version.
- **R5, keyboard focus.** The keyboard actions find X already focused after the drags (`clicked: false`); the probe focuses the node itself if it is not. A user tabbing to a node is not exercised.
- Load during the runs: 2.6-5.1 (`uptime` at 10:01).

## 7. Decisions taken (unattended)

- D1. The scene is seeded by the probe (JjScript plus pointer drags) and also written as a fixture. The fixture lives in a new `frontend/scripts/probe/fixtures/`, not in a `_tmp_` file: `_tmp_` is gitignored only under `frontend/scripts/smoke/`, and the prompt asks for the fixture in the commit.
- D2. The oracle is the app's own `getEdgeCrossings`, read at rest from the served module, plus a geometric expectation. It is a debug read with no app change, guarded by the positive control of §4.1.
- D3. «0 renders at rest» counts EditorV2Inner and UnifiedEdge renders. Other commits are reported, not failed: the `LastSavedIndicator` commit is a debounced indicator, not an editor render.
- D4. Keyboard moves and a re-anchoring drag are in the action set, beside the plain drags, because §5.2 says only they can tell the wiring from the release re-render.
- D5. The probe's drag first moves 3 px in the direction of travel. Without it React Flow's drag threshold swallowed the first of the 12 moves, measured 13 to 52 px short of the target before the snap.
- D6. The trunk memo's dead crossing computation is reported and left in place (Rule 9).

## 8. Decisions awaiting Alfonso

None: no app change is proposed.

## 9. Questions

1. Close Phase 2 with the probe and the fixture as the acceptance measure, no app change?
   Recommended: yes; the GO's first option.
2. Measure the reverse direction (R3) in a lane of its own?
   Recommended: no, a ticket at most; that memo already has a kill on a demo scene.
