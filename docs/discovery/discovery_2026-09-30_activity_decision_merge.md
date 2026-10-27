# Phase 1 report: Activity (UML) with explicit decision and merge, bracketed guards, the token inside the node
Prompt-ID P-2026-09-30-1935 · `docs/prompts/claude_2026-09-30_1935_prompt_activity_decision_merge.md` · Chat C-2026-09-30-1932 · session `9e8487e5-a8f4-4280-9315-6a083e5f514d` · tree `~/jjodel-w-actdec`, branch `activity-decision-merge`, HEAD `17a70f2ad` (code of `30f3d8a81`) · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference. [M] measured in this phase on `17a70f2ad`, [R] read.

## 0. Answer in brief
- **The precondition holds** [R]: a plain edge is one transition with its source as the whole preset (`netCompile.ts:325-330`), and a
  step fires the one transition its selector names (`netStep.ts:274`). Several outgoing edges of a plain node are a choice, several
  incoming ones a merge; fork and join are the only synchronisation (`netCompile.ts:356-368`). The diamond states the behaviour.
- **On DemoFlowB the decision already is a diamond** [M]: `d1` is a `Decision`, drawn by the notation's `decision` role, 36×36. The
  one plain action with 2+ incoming flows is `work` (`f1`, `f3`): it gets the only synthetic diamond, a merge. No action has 2+
  outgoing flows; the target's decision is `d1` itself. The case the prompt describes (an action with two guarded exits) is DemoFlowB
  derived with Decision → Action in the dialog's table; Phase 2 measures it on the probe.
- **Pure rendering is possible, no React Flow node, no IR key** [R]: `synthesizeObjectAsEdges` sees every control flow at once and
  sets their handles (`irEdgeViews.ts:188-313`); a shared handle id is one slot (`handlePosition.ts:140-142`); `UnifiedEdge` already
  draws N edges as one trunk from a primary (the inheritance tree, `UnifiedEdge.tsx:600-714`). Which views are Activity's is read
  from their provenance, `ir.generated` (`notation: 'activityUml'`, roles `node`, `transition`), so viewpoints already derived get it.
- **«2» binds to nothing** [M]: in five run states no element label reads 2; the only «2»s are the two guard labels, overlapping each
  other 12 px right of `work` (boxes 824-943 and 885-996 px). No derivation change; the overlap stays the layout ticket.
- **The token today** [M] is a sky-500 pill «● 1» at the node's top-left (−10, −10), a grey «0» on every empty place, and a 2 px
  cyan outline 2 px outside with a halo (`simNodeRunState.scss:33-49`, `simulation-panel.scss:979-983`). No orange dot exists.
- **Action border, bars, axis** [M]: actions paint 1 px `rgb(15, 23, 42)`, as edges and bars; fork and join are identical at rest,
  the join's «light border» is the run's dashed enabled ring (state E); the off-axis nodes come from stored top-left positions.

Recommended: proceed to Phase 2 in cascade; every question has one recommendation, the default viewpoint does not change (question 5).

**Decisions taken (unattended)**: questions 1-10, each as recommended, rows R-VP-32.. in Phase 2.
**Decisions awaiting Alfonso** (RC-26): none new. What the derived Activity view shows changes by the prompt's mandate («ok su tutto,
procedi»); a critical-zone edit (`viewpoint/ir/`) with the Layer Impact Report below and the RC-30 go-ahead of the launch.

**Questions** (one line each, Recommended adopted)
1. Diamond size. Recommended: 28 px across (the target's polygon, half-diagonal 14), not a 28 px side turned 45° (39.6 across).
2. Diamond and trunk ink. Recommended: the edge's own stroke and width (`var(--color-inode-name)`, 1 px): «equal to the edge stroke».
3. Action border. Recommended: unchanged; it already paints the edge ink at the edge width; `#334155` would make it lighter than arrows.
4. Fork and join. Recommended: unchanged; identical at rest; the dashed enabled ring (S15) stays a run reading.
5. Token scope. Recommended: the new token only on nodes a derived view draws (`ir.generated`); default and user views keep the pill.
6. Counts. Recommended: nothing at 0, the dot at 1, the dot and the count beside it from 2 (derived Petri), inside the node.
7. Colours. Recommended: amber `#f59e0b` dot, cyan `#0ea5e9` border, hard-coded as `.sim-active` is; the ring `--color-inode-surface`.
8. Guards. Recommended: mono 11.5 px normal in `var(--color-text-secondary)` (slate-700) in the document, on a white patch drawn by the edge.
9. Mechanism. Recommended: keyed on `ir.generated` (notation, roles); no IR key; old Activity viewpoints get diamonds and the patch.
10. Grouping. Recommended: the trunk on the members' majority side (tie: the first in model order); no self-loops; anchors on the junction end not honoured.

## 1. Layer Impact Report (written before the first source edit)

Base: R-B9, R-IRN-32, R-VP-21 (4) (`ir.generated`), R-VP-25, R-VP-26, R-SIM-7, R-SIM-21, S15 (the run overlay). Read: `irEdgeViews.ts`
whole, `UnifiedEdge.tsx` whole, `useIRContainment.ts:120-240`, `irResolveCore.ts:270-402`, `handlePosition.ts:132-172`, `DynamicHandles.tsx:97-175`
(grep), `SimNodeRunState.tsx` and `simNodeRunState.scss` whole, `simulation-panel.scss:960-983`, `ObjectNode.tsx:255-300` and the three
`sim-active` sites, `IRNodeContent.tsx:25-60, 500-540`, `irStyle.ts` (grep of `selected`, border), `netCompile.ts:1-60, 220-400`, `netStep.ts:156-300`.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   -- synthetic edge data and handles, session only; one wrapper class
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)   -- the guard label style of the Activity documents, new derivations only
```

**Canvas v2-flow.**
- What changes: in a viewpoint whose control-flow views carry `generated.notation === 'activityUml'` and `role === 'transition'`, the
  synthetic edges (`irobj_*`) get `irActivityFlow` and, when a plain action (`role === 'node'`) has 2+ incoming (outgoing) of them, a
  junction record and one shared handle on that node; `UnifiedEdge` ends (starts) each member at a vertex of the diamond, and the first
  member by id draws the trunk and the diamond in its own SVG group. A node a derived view draws gets `sim-active--derived` beside
  `sim-active`, and the overlay its inside placement.
- What does NOT change: nodes (no RF node is added: the node array leaves the pass as it entered), every edge without the flag (not an
  object-as-edge, or its view not Activity's), the default viewpoint and user views (no `generated`), the handle ids of non-members,
  selection styling (`irStyle.ts:149-164`), the enabled ring and the σ card.
- Cross-layer: none. No `SetFieldAction`, no write to the D-layer: handles and data live in the RF edge objects the memo returns
  (`useIRContainment.ts:175-190`); anchor overrides and waypoints are read as before.
- Side effects: a member's user anchor on its junction end is overridden by the shared handle (a limit, question 10).

**Persistence.** New Activity documents write the guard label `style` `{ fontFamily: 'mono', fontSize: 11.5, fontWeight: 'normal', color:
'var(--color-text-secondary)' }` (existing keys, R-VP-20); viewpoints already derived keep theirs. No IR key, no `irVersion` bump, no
VersionFixer, no `jsxString`. The eight other notations' documents unchanged (measured in Phase 2).

Smoke-test scenarios potentially affected:
- the four demo scenes in the default viewpoint, 0 px from `30f3d8a81` (base shots of that code, `_tmp_actdec_base/`);
- DemoFlowB as Activity (UML): one merge diamond before `work`; none on `i0`, `d1`, `fk`, `jn`, `fin`, `left`, `right`;
- DemoFlowB as Activity with Decision → Action: a decision diamond after `d1`, the two guards on its branches;
- a run on DemoFlowB in the Activity view: the dot inside the marked node, the cyan border; the default view's pill unchanged;
- undo/redo and save/load: model JSON identical, no undo entry from rendering.

## 2. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Several outgoing flows of a plain node fire one at a time | **holds** [R] | `for (const e of plain) { … transitions.push(make(e.id, [e.id], e.sources, e.targets, …)) }` (`netCompile.ts:327-329`): one transition per edge, preset its source; `const t = transitionsById(net).get(selector) as NetTransition;` (`netStep.ts:274`): one transition per step (R-SIM-7) |
| H2 | Several incoming flows synchronise | **falsified** [R] | the same: each edge its own transition, postset its target; synchronisation only where a join fuses its ins (`netCompile.ts:363-368`, `sourcesOf(ins)`); a second token on a boolean place halts `unsafe` (`netStep.ts:167-171`), it never waits |
| H3 | DemoFlowB has an action with 2+ guarded exits | **falsified** [M] | the export: `d1 Decision`, `f3 d1 → work [model.[count] < 2]`, `f4 d1 → fk [model.[count] >= 2]`; the derived views: `View for Decision … decision diamond` (probe `_tmp_actdec_facts.ts`, `views`) |
| H4 | The grouping needs a React Flow node | **falsified** [R] | the synthesis holds every synthetic edge and sets `sourceHandle`/`targetHandle` (`irEdgeViews.ts:290-313`); the memo's edges go to React Flow as they are (`EditorV2.tsx:4155-4156`); `const key = \`${handleId}:${role}\`;` (`handlePosition.ts:140`) makes a shared id one slot |
| H5 | Activity views can be told apart without a new key | **holds** [R] | `generated?: GeneratedProvenance;` on vertex and edge views (`irTypes.ts:527`, `:575`), `{ by, notation: choice.notation, …role, hash }` (`notations.ts:324`); both compiled views carry `ir` (`irTypes.ts:785`, `:860`) |
| H6 | «2» is an element's label or a value | **falsified** [M] | every painted text of the pane in states A-E (rest; Reset with 3 defects; token on `work`; `d1` with count 2; `left, right`): the only canvas texts with a 2 are `[model.[count] < 2]` at 885-996 px and `[model.[count] >= 2]` at 824-943 px, `work` ending at 812; no problem dot in any state |
| H7 | The token is an orange dot on the top-right | **falsified** [M] | `.sim-node-run__tokens { top: -10px; left: -10px; … background: var(--color-sim-token-bg)` (`simNodeRunState.scss:33-45`), sky-500 `#0ea5e9` (`_colors-light.scss:497`); measured box 32×20 at (−10, −10), «1», and «0» grey on every empty place; orange top-right is the problem dot (`NodeProblemIndicator.scss:3-4`, `--warning { background: #f59e0b; }`) |
| H8 | Actions paint a light grey border | **falsified** at rest, light [M] | computed `1px solid rgb(15, 23, 42)` on `work`, `left`, `right`; the full-size crop shows the ink; `border: ink()` in the document (`viewpointDerivation.ts:845`) |
| H9 | Fork and join draw differently | **falsified** at rest [M] | both `1px solid rgb(15, 23, 42)`, fill ink, painted 3×118; in state D `fk`, in state E `jn` carries `.sim-node-run__ring` `2px dashed rgb(14, 165, 233)`, 15×130 |
| H10 | The derivation lays nodes out | **falsified** [R] | `command grep -n -E 'DVertex|SetFieldAction|\.x =|\.y ='` over `viewpointDerivation.ts` and `notations.ts`: exit 1 (control: `IR_VERSION` in the same file, 2 hits); stored positions `i0 (50,50)`, `work (470,50)`, `fk (50,350)`, `left (470,350)` [M, export]: tops aligned, so a 20 px disc and a 44 px box differ by 12 px at their centres, a 120 px bar and a 44 px box by 38 |
| H11 | The guard is already bracketed | **holds** [M] | labels `[model.[count] < 2]`, `[model.[count] >= 2]`, class `edge-label__text--halo`, 12 px 500 quiet (R-VP-26); `template: [ '[', path(guard), ']' ]` (`viewpointDerivation.ts:820`) |

## 3. Design for Phase 2

**Grouping** (`viewpoint/ir/irJunctions.ts`, new, pure; called at the end of `synthesizeObjectAsEdges`). Members: synthetic edges with
`irActivityFlow`, not self-loops. The node's role from `resolveIRView` on its object: a group only on `generated.notation === 'activityUml'`
and `role === 'node'`. Incoming 2+ is a merge, outgoing 2+ a decision. The side: the members' geometric sides on that node by majority,
a tie to the first member's; a decision on a node with a merge takes another side. Every member's handle on that node becomes one id,
`${side}-${k}`, `k` the first index no other edge of the node uses on that side. Data: `irJunctionTarget` / `irJunctionSource` =
`{ kind, side, primary }`, `primary` the first member by id.

**Geometry** (same module): anchor A the shared handle point React Flow passes; n the side's normal; the near vertex at A + 40·n, the centre
at A + 54·n, half-diagonal 14. A branch uses the vertex facing the other end's node centre (far, then the two sides, far first on a tie),
routed by today's Manhattan router with that vertex's side as the side of its end. The trunk A ↔ near vertex, the arrowhead where a
flow enters: at A for a merge, at the near vertex for a decision; each branch keeps its own arrowhead. Fill `var(--color-inode-surface)`,
stroke and width the edge's. Bundle spread skipped for members (it fans pairs of nodes, not branches).

**Label patch**: an Activity flow's halo label takes `background: var(--color-edge-label-bg)`, padding 1px 4px, no text shadow (inline).

**Token** (`SimNodeRunState` `placement: 'inside'`, from the IR branch of `ObjectNode` when the view has `generated`): 0 nothing; ≥ 1 a
13.5 px disc (12 px circle and a 1.5 px ring in `--color-inode-surface`) centred 18 px from the left edge, vertically centred, amber, no
shadow; ≥ 2 the count beside it. The marked node: `outline: 2px solid #0ea5e9; outline-offset: -2px` on `.ir-node-content` (covers the 1 px
border, no layout shift), `stroke` 2 px on the painted polygon of an SVG form; the wrapper's outline and halo off; not while selected.

**Files** (Rule 19: 7 source, 3 tests; in the prompt's DOVE, `viewpoint/ir/` in the critical zone):
1. `frontend/src/components/editor-v2/viewpoint/ir/irJunctions.ts` (new), 2. `viewpoint/ir/irEdgeViews.ts`, 3. `edges/UnifiedEdge.tsx`,
4. `viewpoint/derive/viewpointDerivation.ts` (guard style), 5. `sim/SimNodeRunState.tsx`, 6. `sim/simNodeRunState.scss`, 7. `nodes/ObjectNode.tsx`;
tests `viewpoint/ir/__tests__/irJunctions.test.ts` (new), `viewpoint/ir/__tests__/irActivityRender.test.ts` (new), `viewpoint/derive/__tests__/activityUml.test.ts`.
No token file: the hex values follow `.sim-active` (`simulation-panel.scss:980`) and the run dots (`:966-969`).

## 4. Out of scope, reported
- Action widths: 142 px for one-word names (`BOX_SIZING`, R-VP-19). The guard overlap: the router runs `f3` and `f4` side by side between
  `work` and `d1` (the layout ticket). The explicit decision is 36 px, the synthetic 28: two sizes of one symbol (a later alignment).
- The default viewpoint's run overlay (pill, outline) and every non-derived view: unchanged by question 5.

## 5. Files read (under `/Users/alfonso/jjodel-w-actdec/` unless noted)
`CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `frontend/src/styles/CLAUDE.md` §7.1-7.2, `docs/PROTOCOL.md` P16, `docs/decisions.md`
RC-20..34, R-VP-15..26, R-SIM-7..12, R-SIM-16..21, `docs/discovery/discovery_2026-09-30_activity_uml_notation.md` and `…_activity_sizes.md` whole,
`docs/demo/models_2026_simulator_demo.md` §2.4, `docs/design/activity_uml_target_2026-09-30.svg`; the windows of §1;
`frontend/src/components/editor-v2/problems/NodeProblemIndicator.tsx`, `.scss:1-60`, `simCheckToProblems.ts:1-80`;
`viewpoint/derive/viewpointDerivation.ts:216-460, 745-890`, `notations.ts` (grep of roles and provenance);
`viewpoint/ir/__tests__/irA2Render.test.ts:1-140`, `viewpoint/derive/__tests__/activityUml.test.ts:1-120`; the probe kit of
`~/jjodel-w-notations/frontend/scripts/smoke/` (`_tmp_c1_scenario.js`, `_tmp_c1_common.ts`, `_tmp_actsize_probe2.ts`, read and copied).
Measures: `frontend/scripts/smoke/_tmp_actdec_facts.ts` (gitignored) through `lane-run probe` on 3093, light, 1600×1000, DPR 2, log
`~/.jjodel-lanes/P-2026-09-30-1935/probe-_tmp_actdec_facts.log`, crops `frontend/scripts/smoke/_tmp_actdec_crops/actdec_facts_*.png`; no page error.

## 6. Addendum 2026-09-30, Phase 2 (measured on `d2e4e7959`)
- **Adopted as recommended** (RC-21, unattended): questions 1-10 of §0, as written, rows R-VP-32..35. One lane choice beyond §3:
  the dot is centred on a diamond too, not only on a circle (the 36 px decision would sit 1 px off-centre) [M].
- **Code** `d2e4e7959`: the seven source files of §3 and three test files; no other file. The ring is a 1.5 px spread shadow on a
  10.5 px disc: a 1.5 px border computed as 1 px on the probe (first run), so the drawn circle matches the target's `r=6`, stroke 1.5.
- **Tests first** [M]: on `17a70f2ad` 8 red and `irJunctions.test.ts` at import (`_tmp_actdec_red.log`); the eight markup pins of
  `irActivityRender.test.ts` (an edge without the new keys, the overlay's corner placement) taken there and green after.
- **Documents** [M] (`_tmp_actdec_dump.ts`, the 81 lists of the nine notations on the seven decoded exports): the base byte-identical to
  the sizes lane's dump; after, 79 identical, the 2 Activity lists with a guard equal with the guard style substituted.
- **Gates** [M]: typecheck exit 2, the 14 errors of §17 by file and code; `npx vitest run` (go-ahead variable unset) 6245 tests,
  6244 passed, the 9 known files red at import, and under the load of the full run 2 more files, `traceMonitor.test.ts` (a CLI
  spawn returned `status: null`) and `irCollapsedRender.test.ts` (Chromium `afterAll` timeout, as in the Activity lane's §6), both
  green alone (`_tmp_actdec_vitest3.log`, 2/2 files), neither touched here; the first full run, before the last tests, had only the
  9; `npm run build` exit 0 (twice).
- **Mutation bench** [M] (`_tmp_actdec_bench.mjs`, 50 mutants, 5 test files, controls 227/227 before and after): 43/50 on the first
  run; four tests added (the approach side of a branch, the grips on the vertices, an edge that is a member at both ends, another
  edge on the shared side through the synthesis) and one for the arc guard; **48/50**, the survivors `derived-ignored` and
  `placement-dropped` in `ObjectNode.tsx`, which the bench cannot import (the joiner barrel, §5 of `CLAUDE.md`): the lane probe's
  run checks cover them (the dot inside `work`, the derived class; the default view's pill).
- **Lane probe** [M] (`lane-run probe`, 3093, light, 1600×1000, DPR 2; `_tmp_actdec_probe.ts`, log
  `~/.jjodel-lanes/P-2026-09-30-1935/probe-_tmp_actdec_probe.log`, third run **31/31**; the first two stopped on the probe's own
  coordinate spaces, row locator and undo sequencing, and on the ring above):
  - Default scenes `first`: sm, petri, esm, flowB 0 px left of the rail from the sizes lane's shots (code of `30f3d8a81`), 431 px each
    inside the animated Jodie launcher, masked as before; control 348100 px.
  - DemoFlowB as Activity (UML), flow px: one `polygon.ir-junction`, drawn by `f1`, 28×28, white, `rgb(15, 23, 42)` 1 px, its centre
    59 px left of `work`'s painted edge on its axis; one trunk `M 426 72 L 466 72` with the open arrowhead; `f1` ends at the far vertex
    (398, 72), `f3` at the top vertex (412, 58), each with its arrowhead; 8 nodes drawn, as before; the guards `IBM Plex Mono` 11.5 px 400
    `rgb(51, 65, 85)` on `rgba(255, 255, 255, 0.9)`; M1 and M2 JSON identical (counts DModel 2, DClass 8, DObject 17, DValue 36);
    activating the viewpoint is one undo step of its own, rendering none.
  - The run, Activity view: token on `work`, a 10.5 px disc with a 1.5 px white ring, 12.75 px from the painted left edge, vertically
    centred, `rgb(245, 158, 11)`; `work`'s outline `2px rgb(14, 165, 233)` at −2 px, the wrapper's none, its border pixels cyan; no other
    node marked. `d1` marked: its polygon stroked cyan 2 px, the dot at its centre. `i0` marked: the dot at the circle's centre. The
    default view in the same run: the pill «1», the wrapper outline and halo, no dot.
  - Decision read as an Action: two diamonds (the merge, the decision after `d1`), `f3` and `f4` leaving from its vertices, the trunk
    with the arrowhead into it; the diamond on its trunk's line, 6 px below `d1`'s axis (the trunk shares the left side with `f2`).
  - Undo/redo of that derivation: one undo removes it, one redo restores it, DemoFlowB identical. Save/load (`SaveManager.load` of the
    serialised state, 859150 bytes): DemoFlowB identical, the merge diamond and the patched guards drawn again. No page error.
  - Crops (`frontend/scripts/smoke/_tmp_actdec_crops/`, gitignored): `actdec_flowB_activityUml_600.png` (at rest),
    `actdec_flowB_activityUml_run_work_600.png`, `actdec_flowB_activityUml_run_work_close.png`, `actdec_flowB_activityUml_run_d1_600.png`,
    `actdec_flowB_activityUml_decision_as_action_600.png`, `actdec_flowB_side_by_side_target_600.png` (beside the target SVG).
- **Read on the crops, not measured**: `f3` loops over `work` into the merge's top vertex; the two guards of `d1` still overlap each
  other between `work` and `d1` (the layout ticket), the lower one's patch covering part of the upper one.
