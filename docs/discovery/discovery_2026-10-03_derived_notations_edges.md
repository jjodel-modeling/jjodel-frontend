# Discovery: derived notations, edges, anchors and layout (P-2026-10-03-1304, Phase 1)

Prompt-ID: P-2026-10-03-1304. Prompt: `docs/prompts/claude_2026-10-03_1304_prompt_derived_notations_edges.md`.
Session: `7f9b5192-47bb-4cb1-8836-1e0ced86ac19`. Tree: `~/jjodel-w-dnotC`, branch `derived-notations-edges`, HEAD at
measure `ce52e6b46` (code identical to the trunk `c56f4fc63`), probe committed in `b613c6fa3`. Executor: Claude Opus 5.5
(`claude-opus-5-5`), tier heavy. This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads
the files.

## 0. Answer in brief

Measured on the four demo exports (read only) at rest (stored positions) and after one toolbar Auto layout; probe 23/23.

1. **Classic Petri diagonals.** Cause: the classic arcs are `curve: 'arc'` (`viewpointDerivation.ts:921`, R-VP-24 (4)), a chord between handle centres off the router; its profile is `POLYLINE` (`notations.ts:95`), whose route the arc reduces to a chord between the route's ends (`UnifiedEdge.tsx:300`, `314-319`). The line 347 comment is the non-classic Petri's. Rest: 5/6 arcs full diagonals (257 to 481 px); after layout 2 (164, 89 px). Fix: drop the `curve`, profile `ORTHOGONAL` (offline: 0 diagonals). derive/ only, S. Amends R-VP-24 (4).
2. **Bars, long sides only.** Cause: `assignGeometricHandles` (`irEdgeViews.ts:131-137`) picks the side by the dominant axis for every form. Rest: short-side ends classic 3/6, Petri 6/6, Activity 6/6 (three ends within 3 px on a 7 px end); after layout 0/6 drawn, handles still short. Fix: a per-form side rule there (upright bar left/right, lying bar top/bottom). viewpoint/ir/ (critical), S.
3. **Live rotation.** Not expressible in the IR (a Conditional reads the model, not geometry; `defaultSize` is a constant). Host-side, it swaps the RF box (position is persisted) or needs a square box plus handle insets (critical). Stable (centres only, no self-feedback) but every edge of a bar changes side and drops its ELK route. After layout every bar already agrees with its neighbours (ratios 1.5 to infinity). Recommend: defer past the demo. L.
4. **Diamond ends.** After layout ELK treats d1 as a 36 px box: `work->d1` ends at (264,312), `d1->work` starts at (252,312), 6 px each side of the tip, 4.2 px off the outline; the renderer draws ELK's ends as they are (`UnifiedEdge.tsx:300-310`). Fix: one end per diamond vertex: the side rule of 2 for the router, and the ELK route fitted to the vertex (`fitRouteToEnds`). ir/ (critical) plus host, M.
5. **Crossing arcs.** On the exports the "third straight edge" is `locked->off`: one arc running 201 px through `unlocked` and between the bowed pair, 1 crossing at rest, 0 after layout. Cause: an arc is never routed and bows only from opposite-direction edges (`edgeUtils.ts:2514`, `UnifiedEdge.tsx:401`). Fix: bow a chord clear of a node it crosses, and a fan for n edges per pair. host (`edgeUtils.ts`, `UnifiedEdge.tsx`), M.
6. **Unlabelled edges.** Not missing: the "two edges" are `locked->off` cut by `unlocked`, its label `stop` painted under `unlocked` (elementFromPoint). Every transition of both exports has an event (5/5, 4/4 labelled). Gap found: the label is per class (`viewpointDerivation.ts:354`), so a guard is never shown (`tp` reads `push`, not `push [model.[paid]]`). Fix: Q5's fix; optionally `event [guard]` by a priority-1 document. derive/, S.
7. **Event nodes.** No view key hides a vertex today. Events take 280 of 541 px (PEST) and 288 of 568 (ESM) after layout. Fix: `VertexViewIR.visible?: Conditional<boolean>` read in `useIRContainment.ts:150-163` beside the row-hidden set (node hidden, out of ELK, edges suppressed), written `false` on the Trigger class. ir/ (critical) plus derive, M. Fallback chips: derive only, S, still about 100 px.
8. **Layout.** Proved "badly configured": `bk.fixedAlignment: BALANCED` (`elkLayout.ts:352`) pulls `work` 56 px off the Activity spine. On the captured graph: BALANCED 16 bends, spine 4; `NONE` 8, spine 0, centres within 6 px; `favorStraightEdges` and edge straightness change nothing under BK. Statechart slope: chord between unequal handle slots (10.5 and 6.7 px over 640); after layout `locked->off` is a 178 px diagonal chord. Fix: `NONE` (one line, host), snap near-level chords, singles drawn on ELK's route. S plus M.
9. (a) `StructureSpec.emptyBehavior` (`irTypes.ts:496`) exists, honoured by native rows only (`ObjectNode.tsx:735`); the IR compartment filters `exclude` only (`IRNodeContent.tsx:702-706`). Fix: honour `hide` there, Statechart writes it. ir/ (critical), S. (b) The entry head is a filled triangle (`IRNodeContent.tsx:607`, `... Z`, fill ink) beside 5/5 open markers. Fix: an open chevron. ir/ (critical), S.

Not made finished by any fix here: the 4.7 to 6 px offsets ELK leaves on the junction and d1 (Q8), and rotation (Q3, deferred).
Decisions awaiting Alfonso (RC-26): A1 (Q1, amends R-VP-24), A2 (Q3 deferral), A3 (Q7 key and hiding), A4 (Q6 guard label), A5 (Q8, layouts move), A6 (RC-30 go-ahead, §6). Recommended lines in §8.

## 1. Hypotheses under test, and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The classic Petri diagonals come from a curve or routing key, not from the entry points | holds | §3.1, measured |
| H2 | The bar side is chosen by a geometry rule blind to the form | holds | §3.2, measured and read |
| H3 | A derived IR can express a geometry-dependent orientation | falsified | §3.3, read |
| H4 | Two edges share one point on the merge diamond in the exports | partly: not one point, 12 px apart at the tip, off the outline, after layout | §3.4, measured |
| H5 | Three edges between locked and unlocked exist in the exports | falsified: two, plus `locked->off` passing through | §3.5, measured |
| H6 | The two unlabelled edges are transitions without event and guard | falsified on the exports: one edge, its label under a node | §3.6, measured |
| H7 | A view can hide a vertex today | falsified | §3.7, read, positive control |
| H8 | ELK is badly configured, not inadequate | holds for Activity, partly for Statechart | §3.8, measured offline on captured input |
| H9a | The IR has a predicate to drop absent-value rows | partly: the key exists, the IR renderer ignores it | §3.9, read |
| H9b | The entry arrowhead differs from the transition arrowheads | holds | §3.9, measured |

## 2. Method and files read

Probe `frontend/scripts/probe/derived-notations-edges.ts` (`b613c6fa3`), run with `lane-run probe ... --port 3023`
(vite of this worktree), light theme, 1600x1000, DPR 2, a fresh context per scene. Per scene: import the export with
`ProjectsApi.importFromText`, open the M1, write the simulation binding as Apply does (`bindProfile` over the sketch),
derive with `dialogPrefill` and `createDerivedViewpoint` (the dialog's calls), activate, measure; click Auto layout,
measure again. The ELK input of the click is captured by wrapping `layout` on the elkjs instance `elkLayout.ts` imports;
the question 8 variants run offline on it with the same elkjs 0.11.1. Logs:
`~/.jjodel-lanes/P-2026-10-03-1304/probe-derived-notations-edges.log` (EXIT=0, `RESULT 23/23`); JSON
`/tmp/dnotC/probe_all.json`; crops `frontend/scripts/smoke/_tmp_dnotC_crops/` (gitignored). No fixture copied: the probe
reads `~/jjodel-demo-exports/` in place. Positive controls: calibration spread below 1 px on every pane (client to flow
coordinates); a captured ELK call per click (8/8); the side classifier was corrected once during the phase (a point 4 px
past a short side read as the nearest long side) and every number below comes from the corrected run.

Scenes: DemoPetri as Petri net (classic) and Petri net; DemoFlowB as Activity (UML); DemoPEST and DemoESM as Statechart
(UML) (both turnstiles: DemoPEST has `t1..t5`, events without a `name` slot; DemoESM has `tc, tp, tu, ts`, guards and
effects, an `entry` slot on State). The exports' models were also decoded offline (async-lz-string) and listed.

Files read (full paths under `/Users/alfonso/jjodel-w-dnotC/`): `CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`,
`docs/PROTOCOL.md` (P16), `docs/decisions.md` (RC-14, RC-20 to RC-34, R-VP-21 to R-VP-38), `docs/claude-code-log.md` (head),
`docs/log-inbox/views.md` (head), `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (whole),
`.../derive/notations.ts` (whole), `.../viewpoint/ir/irEdgeViews.ts` (whole), `.../ir/edgeEndpoints.ts` (whole),
`.../ir/irJunctions.ts` (whole), `.../ir/irTypes.ts` (120-175, 455-520, 660-760, 770-782), `.../ir/IRNodeContent.tsx`
(120-145, 276-318, 600-612, 696-760), `.../ir/irContainment.ts` (260-300), `.../ir/useIRContainment.ts` (120-175),
`frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (100-660, 1030-1050),
`frontend/src/components/editor-v2/utils/edgeUtils.ts` (2440-2560), `.../utils/handlePosition.ts` (1-330),
`.../utils/elkLayout.ts` (170-556), `frontend/src/components/editor-v2/EditorV2.tsx` (1222-1262, 3625-3780),
`frontend/src/components/editor-v2/nodes/valueRenderer.ts` (370-395), `.../nodes/instanceNodeStyle.ts` (20-70),
`frontend/scripts/probe/hidden-tab-loop.ts` (1-200, 280-300, 489-660). Not read: `shapeRegistry.ts`, `erSignals.ts`,
`portDistribution.ts`, `DynamicHandles.tsx` (the synthetic edges' sides are decided before them, §3.2).

## 3. Findings

### 3.1 Petri net (classic): straight diagonals (measured on `ce52e6b46`)

Read: `viewpointDerivation.ts:918-922`, the classic arc document:
`terminations: { sourceEnd: 'none', targetEnd: role === 'inhibitorArc' ? 'hollowCircle' : 'openArrow' }, line: { color: NAME_INK, width: 1 }, curve: 'arc',`.
`irTypes.ts:704-712`: «`arc` draws the edge between the centres of its two handles, off the Manhattan router: straight when
it is the only edge between its two nodes». The comment at `viewpointDerivation.ts:345-348` («No routing: the default
orthogonal router (R-VP-16)») belongs to `deriveViewpointIRs`, the non-classic Petri, which writes no `curve`.
`notations.ts:94-95`: `layout: { direction: 'RIGHT', edgeRouting: 'POLYLINE', nodePlacement: 'NETWORK_SIMPLEX', ... }`.
`UnifiedEdge.tsx:300`: `const elkRoute = elkRouteAny && elkRouteAny.orthogonal && !isArcIR ? elkRouteAny : null;` and
`314-319`: an arc takes `elkRouteAny.points[0]` and the last point as its chord's ends.

Measured (bends, diagonal length / total length, end sides):

| Arc | classic, rest | classic, after layout | Petri net, rest | Petri net, after layout |
|---|---|---|---|---|
| p1->t1 | diag 481/481 | straight | 2 bends | 0 |
| t1->p2 | diag 257/257, leaves t1's top (short) | straight | 2 bends | 0 |
| p2->t2 | diag 476/476 | diag 164/164 | 2 bends | 0 |
| t2->p3 | diag 257/257, short | straight | 0 | 0 |
| lock->t3 | diag 257/257, enters t3's top (short) | slope 1 px over 60 | 2 bends | 1 |
| lock->t2 | slope 7.3 px over 796, through t1 (10 px) | diag 89/89 | 2 bends | 2 |

Offline, the captured classic graph with `elk.edgeRouting: ORTHOGONAL`: total bends 2 (lock->t2 2, every other 0), no
diagonal segment, size 647x234 against 654x234.

Fix: delete `curve: 'arc'` at `viewpointDerivation.ts:921` and set `edgeRouting: 'ORTHOGONAL'` at `notations.ts:95`.
The arcs then take the router (rest) or ELK's orthogonal route (after layout), as the non-classic Petri does. Trade-off: a
place and a transition joined both ways lose the bow (two parallel Manhattan lines, the bundle spread); DemoPetri has no
such pair. Size S (two lines, the classic tests' expectations). Layer: derive/ only. Risk: low; lane P-2026-10-03-1300
edits the same two files (§7).

### 3.2 Bars: edges on the short sides (measured)

Read: `irEdgeViews.ts:131-137`: `} else if (Math.abs(dx) >= Math.abs(dy)) { sourceSide = dx >= 0 ? 'right' : 'left'; ...`
for every synthetic edge, whatever the end node's form. `handlePosition.ts:248` then only places the ends of a side at
`(k + 1) / (N + 1)`; portDistribution does not assign sides to synthetic edges (they are rebuilt by `useIRContainment`
on every render, `EditorV2.tsx:4318`).

Measured ends on a bar (total, on a short side):

| Scene | rest | after layout (drawn route) |
|---|---|---|
| Petri net (classic), upright 10x44 | 6, 3 short | 6, 0 |
| Petri net, lying 50x14 | 6, 6 short | 6, 0 |
| Activity (UML), lying 120x7 | 6, 6 short | 6, 0 |

At rest on Activity the fork's handles are `t:right-0@(170,352) s:right-0@(170,354) s:right-1@(170,355)`: three ends
within 3 px on the 7 px end (the probe's shared-ends list). After layout the drawn path is ELK's (long sides) while the
handles stay where the rule put them (`fk: s:right-0, s:left-0`, `jn: t:right-0, t:left-0`), visible on hover.

Fix: a pure `endSide(form, box, dx, dy)` used by `assignGeometricHandles`: a `bar` with h >= w takes left/right by the
sign of dx, a lying one top/bottom by the sign of dy; other forms as today. The form comes from the end's resolved vertex
view, resolved once per vertex as `isAction` already does (`irEdgeViews.ts:327-336`). Size S (about 20 lines and tests in
`ir/__tests__`). Layer: viewpoint/ir/ (critical, RC-30). Risk: low; a bar with many edges spreads them on 56 or 120 px.

### 3.3 Bars: automatic rotation (read, and measured inputs)

- The IR cannot express it. `Conditional<T>` resolves over the read context (paths, `isKind`, `exists`, comparisons on
  slots), never over canvas geometry; `defaultSize` is a plain `{ width, height }` per view, not even a Conditional. A
  Conditional "over the neighbours' positions" has nothing to read.
- Host-side options. (a) Swap the RF box's width and height around the centre: the top-left moves, and the position is
  the vertex's persisted position (written on drag, `syncPositionBatchToJjom`), so "nothing persisted" fails unless the
  shift is a render-only transform, which then splits the RF box from the paint (handles, hit box, ELK sizes disagree).
  (b) A square box (56x56) with the bar painted rotated inside: nothing persisted, no shift, but the handles sit on the
  box, 22 px from an upright bar's long side; it needs a per-form handle inset in `DynamicHandles`/`handlePosition`
  (critical). Both are size L.
- Handles: with the rule of §3.2, a rotation moves every edge of the bar to the other pair of sides (`left-0` to
  `top-0`); `isElkRouteValid` compares rects, so each of those edges loses its ELK route and falls back to the router.
- Layout shift: the neighbours do not move; the bar's own box changes, so (a) is a shift of the node, (b) is not.
- Oscillation: the decision reads only the neighbours' centres, which a rotation does not move, so there is no feedback
  from the bar onto itself or between two connected bars. The 20 percent hysteresis matters only during a drag near the
  diagonal; live recomputation during a drag would re-side the edges every frame, so at release only.
- Measured need (sum of |dx| and of |dy| over unit vectors to the neighbours, ratio of the larger to the smaller): after
  layout every bar already agrees: classic t1 infinite, t2 4.04, t3 10.88 (upright, horizontal neighbours); Activity fk
  1.55, jn 1.50 (lying, vertical neighbours). At rest they disagree: classic t1 1.86 and t3 17.65 want lying; Activity
  fk 7.32 and jn 3.15 want upright (DemoFlowB stores its nodes in rows); t2 1.16 sits inside the hysteresis.
- Lane P-2026-10-03-1300 (not merged, read at `79e4caf6d`) defines `PETRI_BAR_LONG = 56`, `PETRI_BAR_SHORT = 12`, the
  classic bar 12x56 upright and the Petri bar 56x12 lying. Expectation for a rotation: the same two constants, swapped.

Recommendation: defer. For the demo, §3.2 plus §3.8 give consistent bars after Auto layout.

### 3.4 Merge diamond: two ends at the tip (measured)

The diamond of the screenshot is `d1`, the Decision / merge node (36x36). After layout ELK gives d1's top side two ports on
the box: `work->d1` ends at (264,312), `d1->work` (the loop-back) starts at (252,312); the tip is (258,312); both 4.2 px
outside the painted outline. At rest d1's left side holds three ends at y 59, 68, 77, 2.8 px outside. The join bar spreads
its two inputs at x 240 and 280 (120 px top side). The view-only merge before `work` (`irJunctions.ts`) keeps its branches on
distinct vertices: after layout `i0->work` ends on the far vertex (319,136), `d1->work` on the left one (305,150).

Read: `UnifiedEdge.tsx:300-310`: `if (!branchEnds) return elkRoute.points;` for every non-junction edge; ELK knows only
rectangles. `handlePosition.ts:248` spreads a side's ends uniformly, whatever the form.

Fix: one end per diamond vertex. (a) Without ELK: the side rule of §3.2 gains `diamond`: a side already holding an end
passes the next end to the free adjacent side nearest its other end, so each side holds one end and that end sits at the
side's centre, the vertex (`(k+1)/(N+1)` with N = 1). (b) With ELK: an end on a diamond is fitted to its handle's vertex
with `fitRouteToEnds` (`elkLayout.ts:492`), as `UnifiedEdge.tsx:303-309` already fits a junction branch. Size M. Layers:
viewpoint/ir/ (a, critical) and `UnifiedEdge.tsx` (b, host). Limit: a diamond with more than four ends keeps sharing.

### 3.5 Arcs between locked and unlocked cross (measured)

On both exports, at rest (states in one row), `locked->off` is an arc with no opposite edge, so a straight chord from
locked's right to off's left; it runs 201 px inside `unlocked`'s box and between the bowed pair. Crossings: DemoPEST 1
(`coin` arc at (273,61)), DemoESM 1 (`push` arc at (282,65)); after layout 0 and 0. The crop of DemoESM at rest shows the
screenshot's picture: the push pair, a straight line from locked into unlocked, a line from unlocked to off.

Read: `edgeUtils.ts:2514`: `if (opposite.length === 0 || len < 1) { return { d: \`M ${pt(start)} L ${pt(end)}\`, ...` and
`UnifiedEdge.tsx:519-520`: the opposite set is `e.source === target && e.target === source` only. `UnifiedEdge.tsx:401`:
`avoidNodeRects` is skipped `|| isArcIR`. So an arc ignores the boxes on its chord, and two arcs in the same direction
between one pair get the same bow (they overlap), the third of three the bow of its same-direction sibling.

Fix: in `computeArcEdgeGeometry`, (i) a fan for the n arcs of one unordered pair, sorted by edge id (the key
`computeSidePositions` already orders the slots by, `handlePosition.ts` byPairStable), the k-th bowed by
`(k - (n-1)/2) * h` on the pair's canonical normal: n = 2 gives today's pair, n = 3 gives -h, 0, +h; (ii) a chord that
crosses a node box other than its ends bows to the side with the smaller intrusion, by the clearance plus 12 px, capped
at `ARC_BOW_MAX`; past the cap it stays straight and is reported by the probe. Size M (edgeUtils plus the node rects
gathered in UnifiedEdge, as `routedPoints` does). Layer: host, not critical.

### 3.6 Statechart: edges without a label (measured and read)

Measured labels per edge: DemoPEST 5/5 (`coin`, `push`, `push`, `coin`, `stop`), DemoESM 4/4. At rest the label `stop` of
`locked->off` sits at the chord's midpoint, inside `unlocked`: `document.elementFromPoint` at its centre returns the
`unlocked` node. The screenshot's two unlabelled edges are the two visible halves of that one edge (§3.5). After layout
`stop` is visible (7 px from its line).

Models (decoded exports): DemoPEST `t1 coin, t2 push, t3 push, t4 coin, t5 stop`, no guard slot; DemoESM `tc coin`
(effect), `tp push` (guard `model.[paid]`, effect), `tu push`, `ts stop`. No transition lacks an event.

Read: `viewpointDerivation.ts:354-355`:
`const labelled = boundReference('simTrigger', c.id) ?? boundAttribute('simGuard', c.id);` once per class. Statechart
keeps it (`viewpointDerivation.ts:653`). Two consequences: a transition with no event shows nothing even when guarded,
and a guard never shows beside an event (`tp` reads `push`). A transition with neither is a UML completion transition,
correctly unlabelled.

Fix: the hidden label is §3.5's. Optional (derive only, S): a second Statechart document per transition class with
`priority: 1` and `predicate: { op: 'exists', path: '$guard.value' }`, labelled by the template
`[$event.value, ' [', $guard.value, ']']` (an empty event drops nothing before it; the guard exists by the predicate),
the pattern of Activity's guard (`viewpointDerivation.ts:830-840`). Effects (`/ action`) stay out. Amends R-VP-22 (2).

### 3.7 Event instances drawn as nodes (read and measured)

Read, absence with its control: `grep -n "hidden\|visible?:\|render?:\|hide" irTypes.ts` returns `visible?:` at lines
122 (LabelSpec), 179 (BadgeSpec), 777 (RowViewIR) and nothing on `VertexViewIR` (the positive control is those three
hits). A node is hidden only by the row pass (`irContainment.ts:273` `decorateNodes`, fed by
`useIRContainment.ts:150-163`) and by object-as-edge (`irEdgeViews.ts:293`). A hidden node leaves ELK
(`elkLayout.ts:266`: `const visible = nodes.filter(n => !n.hidden);`) and `decorateEdges` lifts or drops its edges.

Measured after layout: DemoPEST's events at y 48 to 210, the states from y 328: 280 of the canvas's 541 px; DemoESM 288 of
568. At rest they are a second row 300 px below the states.

Fix: `VertexViewIR.visible?: Conditional<boolean>` (the vocabulary of the three keys above; absent = visible, additive,
no `irVersion` bump, R-B9 permanent name), compiled like a label's `visible`, refused by the validator when not a boolean
Conditional; `useIRContainment.ts` adds the objects whose resolved vertex view resolves `visible` false to the hidden set,
beside `rowHidden`, so `decorateNodes` and `decorateEdges` do the rest; the Statechart (and State machine) derivation writes
`visible: false` on the class bound to the Trigger role. Size M. Layers: viewpoint/ir/ (critical) and derive/. An instance
used by no transition is hidden too: the predicate language has no "referenced by", and Alfonso's decision hides the
class. The tree and the model keep every instance.

Fallback without a key (derive only, S): the Trigger class as a chip (name only, 11 px, about 60x22, no compartment).
Cost: the three chips stay a separate ELK component, about 100 px with `componentComponent: 80`; it does not meet "not
drawn".

### 3.8 Layout alignment (measured offline on the captured ELK input)

Activity (UML), DemoFlowB (spine: J>work, i0>J, work>d1, d1>J loop-back, d1>fk, jn>fin; centres across the flow):

| Variant | total bends | spine bends | centres x (i0, work, d1, fk, jn, fin, J) |
|---|---|---|---|
| current: BK, `fixedAlignment: BALANCED` | 16 | 2, 0, 2, 4, 0, 0 | 259, 315, 259, 259, 259, 259, 259 |
| + `favorStraightEdges` | 16 | same | same |
| + `priority.straightness: 10` on the spine | 16 | same | same |
| NETWORK_SIMPLEX + straightness | 8 | 2, 0, 2, 0, 0, 0 | spread 107 |
| LINEAR_SEGMENTS | 16 | 2, 0, 2, 4, 0, 0 | spread 66 |
| BK, `fixedAlignment: NONE` (or LEFTUP) | 8 | 0, 0, 0, 4, 0, 0 | 310, 315, 309, 309, 309, 309, 310 |

Read: `elkLayout.ts:352`:
`...(placement === 'BRANDES_KOEPF' ? { 'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED' } : {}),`. BALANCED
averages BK's four alignments, and the loop-back's dummies pull `work` 56 px right. The Initial's elbow: the merge diamond
is drawn from work's top handle (x 319) while ELK placed the junction at 259; `i0`'s route is fitted 57 px across. Under
NONE the residual offsets are 4.7 px (ELK attaches J>work off J's centre) and 6 px (d1, two ends on its top, §3.4).
`portAlignment.default: CENTER` changes nothing; `portConstraints: FIXED_SIDE` moves the offsets, not removes them.

Statechart: BALANCED 12 (DemoPEST) and 10 (DemoESM) bends, NONE 10 and 8. The slope: at rest `locked->off` slopes 10.5 px
(DemoPEST) and 6.7 px (DemoESM) over 640: its ends sit on different slots (locked's right side holds 3 ends, off's left 1)
and, in DemoESM, on boxes of different height (57 against 42: the `entry` row, §3.9). After layout it is a 178 px (181 px)
diagonal: the arc's chord between ELK's two ends, which ELK put in different rows with a 2-bend orthogonal route.

Fix: (i) `fixedAlignment: 'NONE'` at `elkLayout.ts:352` (one line; only the BK profiles, Activity and Statechart, move);
(ii) in `computeArcEdgeGeometry` a chord with |dy| <= 12 px over at least 8 times that run is drawn level at the mean;
(iii) an arc with no other edge between its pair draws ELK's orthogonal route when there is one (`UnifiedEdge.tsx:300`
admits it), so a single transition after Auto layout is orthogonal and a pair keeps its bows. Sizes S, S, S. Layer: host.

### 3.9 Smaller items (measured and read)

(a) Read: `IRNodeContent.tsx:702-706`:
`const source = exclude ? slots.filter(r => !exclude.includes(r.name)) : slots; if (source.length === 0) return null;`.
The empty value is `''` in the row (`IRNodeContent.tsx:293-296`) and painted as the dash. `irTypes.ts:463`:
`export type EmptyBehavior = 'dash' | 'collapse' | 'hide';`, `irTypes.ts:496`: `emptyBehavior?: EmptyBehavior;`, authored by
`StructureGroups.tsx`, honoured only by native rows: `ObjectNode.tsx:735`:
`if (style.emptyBehavior === 'hide') return slotRows.filter(r => !r.isEmpty);`. `grep -n structure irCompile.ts` returns
nothing while the same grep hits `ObjectNode.tsx:724` (control). Measured: DemoESM's locked and unlocked draw the row
`entry =` and the dash, 57 px high instead of 42. Fix: in the IR compartment, `compiled.ir.structure?.emptyBehavior ===
'hide'` filters the rows whose value is `''`, and the existing length check drops an all-empty compartment; the Statechart
derivation writes `structure: { emptyBehavior: 'hide' }` on its state documents. No new key. Size S. Layer: viewpoint/ir/
(critical) and derive/.

(b) Measured: the entry mark of `locked` draws `circle`, `M 12 7 H 32` (stroke), `M 32 3 L 40 7 L 32 11 Z` (fill ink);
the five transitions end in `ir-arrow-open-*`, a stroked `M 0 0 L 10 5 L 0 10`, 8x8 (`UnifiedEdge.tsx:1033-1041`). Read:
`IRNodeContent.tsx:607`. Fix: the shaft to `H ${ENTRY_W}` and the head `M 32 3 L 40 7 L 32 11` stroked 1 px, fill none
(the `arrow` entry of the Automaton notation becomes open too, as R-VP-25 asks of every derived arrowhead). Size S.
Layer: viewpoint/ir/ (critical).

### 3.10 Seen beside the nine

After layout, the classic transition names (`outside`, anchor `e`, `viewpointDerivation.ts:971`) are crossed by the
outgoing arc (crop `dne_before_petri_petriClassic_elk_900.png`: `t1`, `t2` struck through). Lane P-2026-10-03-1300 moves
the Petri transition name to anchor `s` at `79e4caf6d`; whether it moves the classic one too is for that lane to say.

## 4. Proposed Phase 2 order

1. derive/ only, after taking the trunk with lane 1300 (RC-14): Q1, Q6 (optional), the derive halves of Q9a and Q7.
2. host, not critical: Q8 (i) `elkLayout.ts`; Q5 and Q8 (ii)(iii) `edgeUtils.ts`, `UnifiedEdge.tsx`; Q4 (b).
3. critical zone, one at a time, each with its go-ahead: Q9b, Q9a, Q2 with Q4 (a) (one helper), Q7.

Probe numbers before and after are the acceptance measure: short bar ends 0 at rest; diamond ends on the outline, one per
vertex; crossings and through-node length 0 at rest on both turnstiles; Activity spine 0 bends; no `entry =` row; open
entry head; no Event node; the four default scenes unchanged.

## 5. Dependencies and risks

- Lane P-2026-10-03-1300 (`~/jjodel-w-dnotA`, not merged) edits `viewpointDerivation.ts` and `notations.ts`, the files of Q1,
  Q6, Q7 and Q9a's derive halves; lane 1302 edits `deriveViewpoint.ts`. Phase 2 takes the trunk first.
- Viewpoints already derived keep their documents (R-VP-25's precedent): Q1, Q6, Q7 and Q9a's derive halves show only on a
  new derivation; the host fixes (Q4 b, Q5, Q8) and Q2, Q9b move every saved derived viewpoint at once.
- Q8 (i) moves the Activity and Statechart auto-layouts of every project; the class view and Flowchart use NETWORK_SIMPLEX
  and do not move.
- Q5 (ii) changes arcs of ER (Chen) and Petri too wherever a chord crosses a node.
- Q7 adds a persisted key (R-B9): the spelling is permanent once a derived viewpoint is saved.
- The probe measures the exports, not Alfonso's copies (`DemoPetri copy2`, `DemoFlowB copy`): the crops match his
  description, the coordinates do not need to.

## 6. Layer Impact Report (CLAUDE.md §3.2), for the proposals touching the critical zone

```
LAYER IMPACT REPORT: Q2 + Q4 (a), irEdgeViews.ts assignGeometricHandles side rule

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Canvas v2-flow:
  - What changes: the sourceHandle/targetHandle side of synthetic object-as-edge edges whose end node is a bar or a diamond.
  - What does NOT change: edges of every other form, reference-as-edge edges, user anchor overrides (they still win,
    irEdgeViews.ts:303-317), junction handles (assignActivityJunctions runs after), portDistribution (not on this path).
  - Cross-layer interaction: reads the resolved vertex view (resolveIRView), as isAction does; writes nothing.
  - Side-effect safety: the edges are rebuilt on every decoration pass; no persisted anchor, no JjOM write.

Smoke-test scenarios potentially affected:
  - DemoPetri classic and Petri at rest: short bar ends 3/6 and 6/6 -> 0.
  - DemoFlowB Activity at rest: 6/6 -> 0; d1 one end per side.
  - The four default scenes (no bar, no derived view): byte-identical.
```

```
LAYER IMPACT REPORT: Q7, VertexViewIR.visible

Layers touched:
  [ ] D-layer   [ ] L-layer   [ ] JjOM
  [x] Canvas v2-flow (node hidden flag, edges lifted/suppressed)
  [ ] Canvas classic   [ ] Sync layer
  [x] Persistence (a new optional IR key inside saved views; no VersionFixer, R-B9 additive)

Canvas v2-flow:
  - What changes: an object whose resolved vertex view has visible false is hidden (hidden: true), out of ELK, its
    reference edges suppressed by decorateEdges.
  - What does NOT change: the model, the tree, the object's existence; views without the key; the row pass.
  - Cross-layer interaction: irTypes (key), irCompile (Conditional), irValidate (vocabulary), useIRContainment (hidden
    set union, the rowHidden pattern), derive (writes the key).
Persistence:
  - What changes: derived Statechart and State machine viewpoints created after the change carry visible: false on the
    Trigger class's view.
  - What does NOT change: irVersion, VersionFixer, every saved view.
  - Side-effect safety: absent = visible; a value outside boolean Conditional renders as absent and is refused by the
    validator.

Smoke-test scenarios potentially affected:
  - DemoPEST and DemoESM Statechart: 3 Event nodes -> 0, height 541 -> about 260 (an estimate: 541 less the 280 px
    the events take, not measured).
  - Default viewpoints: no key, unchanged.
```

```
LAYER IMPACT REPORT: Q9a and Q9b, IRNodeContent.tsx

Layers touched:
  [x] Canvas v2-flow (IR node content only)
  every other layer unchanged

Canvas v2-flow:
  - What changes: (a) under structure.emptyBehavior 'hide', empty rows of an IR compartment are not drawn, an all-empty
    compartment is not drawn; (b) the entry head is an open chevron.
  - What does NOT change: views without the key ('dash' stays the default); native ObjectNode rows; the node's size
    contract except through its content (fewer rows, smaller height, measured by useContentSize as today).
  - Cross-layer interaction: none; reads compiled.ir.
  - Side-effect safety: (a) changes content height, so the size path runs once, as on any content change
    (P-2026-10-01-1655's bounded writes).

Smoke-test scenarios potentially affected:
  - DemoESM Statechart: locked and unlocked 57 -> 42 px, no entry row.
  - Every Statechart and the Automaton entry: open head.
```

## 6b. Decisions taken (unattended)

1. The demo exports stand in for Alfonso's copies (the prompt's own reference); his screenshots were not available here.
2. The probe derives through `dialogPrefill` and `createDerivedViewpoint` with the binding as Apply writes it, not
   through the dialog's DOM (the dialog was measured by earlier lanes).

## 7. Decisions awaiting Alfonso (RC-26)

- A1. Q1 amends R-VP-24 (4) (`curve: 'arc'` on the classic arcs), a row he ratified.
- A2. Q3: no live bar rotation before the demo.
- A3. Q7: the persisted key `VertexViewIR.visible`, and the Event nodes leave the demo's Statechart.
- A4. Q6: the Statechart label becomes `event [guard]` (DemoESM's `tp` reads `push [model.[paid]]`), amending R-VP-22 (2).
- A5. Q8: the Activity and Statechart auto-layouts move (spine straight, `NONE`).
- A6. RC-30 go-ahead for the critical-zone items of §6 (irEdgeViews.ts, irTypes/irCompile/irValidate/useIRContainment,
  IRNodeContent.tsx).

## 8. Questions

1. Q1: classic Petri arcs on the orthogonal router, profile ORTHOGONAL? Recommended: yes.
2. Q3: defer the live rotation past the demo? Recommended: yes, defer.
3. Q7: add `VertexViewIR.visible` and hide the Trigger class in Statechart and State machine? Recommended: yes.
4. Q6: label transitions `event [guard]`? Recommended: yes.
5. Q8: `fixedAlignment: NONE` for the BK profiles, near-level chords snapped, single arcs on ELK's route? Recommended: yes.
6. Q5: fan by edge id and bow clear of crossed nodes, for every arc notation? Recommended: yes.
7. Q4: one end per diamond vertex, router and ELK path? Recommended: yes.

## 9. Addendum 2026-10-03, Phase 2 step 1 (the host items)

GO of the chat: A1 to A5 decided by Alfonso; step 1 is the host items Q8 (i), Q5, Q8 (ii)(iii), Q4 (b); RC-30 one
critical item at a time afterwards. Commits: `0562a2612` (Q8 (i)), `104f2c0cf` (Q5, Q8 (iii)), `52934d83f` (probe).

Measured with the probe on 3023, before (the three source files at `e767c8c24`, put back after, `cmp` identical) and
after (`52934d83f`), 23/23 each:

| Pane | before | after |
|---|---|---|
| DemoPEST, Statechart, at rest | crossings 1, through-node 201 px, 1 label under a node, slope 10.5/640 | 0, 0, 0, none |
| DemoESM, Statechart, at rest | crossings 1, through-node 201 px, 1 label under a node, slope 6.7/640 | 0, 0, 0, none |
| both turnstiles, after Auto layout | locked->off a 178/181 px diagonal chord | ELK's orthogonal route; crossings 0 |
| DemoFlowB, Activity, after Auto layout | main path bends 4 | 0 |
| Petri net (classic), after Auto layout | slopes p2->t2 7/164, lock->t3 1/60 | unchanged (Q1 removes them) |
| the four default scenes | | identical at 0.01 px (below that two runs of one code differ) |

Findings of the step:
- The 8 px grid snap turned legs ELK drew straight into 1 to 7 px jogs; `readElkResult` now keeps them straight (ends
  move along their sides by up to 8 px, nodes stay on the grid). Without it, `fixedAlignment: NONE` alone left the
  Activity spine at 2 bends per leg.
- A single arc bowed only round the box it crossed still crossed the steep `coin` arc near `locked` and, on DemoPEST,
  `unlocked`'s self-loop, and its label landed on the loop's; the bow search now also avoids the other arcs' curves
  and labels.
- Q8 (ii), the level snap, was implemented and taken out: `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irA1Render.test.ts:258-266`,
  «a single edge stays straight, from handle centre to handle centre, whatever the snap would do», pins the opposite
  (R-VP-22, C3 cause 3: the tip on the anchor) under `viewpoint/ir/`. With Q5 and Q8 (iii) no turnstile pane keeps a
  slope; Petri net (classic) keeps two until Q1.
- Q4 (b) was not done: the form of a node is resolved only in `ObjectNode.tsx:924`
  (`const shapeForm = resolveNodeForm(...)`), and neither `UnifiedEdge.tsx` nor `elkLayout.ts` receives it. It can
  ride with Q4 (a): `irEdgeViews.ts` already resolves the vertex view for the side rule and can write the end forms on
  the synthetic edge for `UnifiedEdge.tsx` to read.

## 10. Addendum 2026-10-03, Q3 design (no code), for the chat's approval

Alfonso brought Q3 forward (his answer on DemoFlowB without a layout). Layer Impact Report:
`docs/lir/lir_2026-10-03_bar_orientation.md`. Prototype: `frontend/scripts/probe/bar-orientation-proto.ts`, offline, on
the geometry the probe measured (`d_after`, merged tree at `534698e2f`), no app file touched.

**The rule.** Orientation is the dominant axis of the sum of the unit vectors from the bar's centre to its connected
neighbours, by absolute component: neighbours across (sx > sy) want it upright, along (sy > sx) lying. Hysteresis: an
upright bar turns lying only when sy > 1.2 sx, a lying one upright only when sx > 1.2 sy; the start is the declared
orientation. L = 56, S = 12 for both Petri notations (`PETRI_BAR_LONG`, `PETRI_BAR_SHORT`, on the trunk since lane 1300);
Activity's fork and join are 120 and 7 (R-VP-36).

**Which layer owns it: a host mechanism, not the IR.** A Conditional resolves over the read context (slots, paths,
`isKind`, comparisons); it reads the model, never the canvas, and the compile cache keys on the IR's hash, not on
positions. An orientation from the neighbours' positions has nothing to read there. It lives in the decoration pass,
which already has the nodes, their positions and the synthetic edges (`synthesizeObjectAsEdges`, where the side rule
of Q2 resolves each endpoint's form): one session memo per vertex (the previous orientation, for the hysteresis),
written to the bar's RF node data, read by the paint, the handles, the side rule and ELK.

**How a turn changes the drawing: option B, a square box.** Two ways were weighed.
- A, the RF box swaps width and height. The box's top-left is the vertex's stored position, shared by every viewpoint;
  keeping the centre means moving it by (L - S) / 2 = 22 px at each turn. Written back, that is persisted state and a
  layout shift; held as a view offset, every position write (drag stop, multi-drag, Auto layout, nudges) must remove it
  first, or the stored position drifts by 22 px at each drag of a turned bar.
- B, recommended: every bar has an L x L box (56 x 56 for Petri) and paints its S x L ink centred inside it, upright or
  lying; its handles sit on the painted long sides, inset 22 px, as a diamond's handles are already inset to its
  outline (measured: d1's at x 899 on a box at 890). A turn moves no box and no position, writes nothing, shifts
  nothing. Costs: a larger hit box; the selection outline must follow the ink; ELK must lay out the painted size and
  convert back; the router's obstacle is the box (routes keep 22 px further from a bar); and once, on adoption, the
  ink moves to the box's centre relative to today's S x L box (22 px right for the classic upright bar). For
  Activity's 120 px bars the box would be 120 x 120: either accept it, or leave Activity's fork and join out of the
  rotation (their orientation follows the layout direction already, and after Auto layout they agree with it).

**Handle slots, portDistribution, the side rule.** A turn moves every end of the bar to the other pair of sides
(measured: 1 to 3 ends per bar); the handle ids change (`left-0` to `top-0`) and DynamicHandles re-slots them with
`computeSidePositions`, unchanged. portDistribution is not on the synthetic edges' path. The side rule of Q2 keeps its
long-side logic but reads the orientation from the node data (with B the box is square and cannot tell). The ELK
routes of a turned bar's edges are dropped (their rects did not change, so `isElkRouteValid` alone would keep routes
that end on the old sides).

**What can oscillate.** Nothing feeds back: the decision reads only neighbours' centres, and with B a turn moves no
centre, so a bar never moves its own input; two connected bars do not move each other. The only flicker source is a
neighbour hovering at the diagonal, which the hysteresis takes. Measured on a neighbour shaken by +-3 px at the
diagonal of a one-neighbour bar for 1000 frames: 511 or 512 turns with no hysteresis, 0 with 20 percent.

**Live during a drag, or at release.** Measured cost of one evaluation of every bar of a pane: 0.15 to 0.21
microseconds (2 or 3 bars). A full drag of a neighbour round a bar turns it 4 or 5 times with no hysteresis and 0 to 5
with it (0 where other neighbours anchor the decision). The arithmetic is free; the cost of a turn is the bar's edges
re-slotting and re-routing mid-gesture. Recommended: at drag release, on open and after Auto layout; live as a later
option. The memo holds while any node reports `dragging`.

**No layout shift.** With B: a turn changes no node box and no position; edges re-route, as on any drag.

**Measured on the demos (decision per bar, ratio of the winning axis).**

| Pane | Turns | Stays |
|---|---|---|
| Petri net (classic), no layout | t1 to lying (1.89), t3 to lying (19.13) | t2 upright (1.15, inside the hysteresis) |
| Petri net, no layout | t1, t2, t3 to upright (4.32, 2.23, 2.60) | |
| Activity (UML), no layout (DemoFlowB) | fork and join to upright (7.32, 3.15) | |
| any of the three after Auto layout | none | every bar (2.13 to 40) |

DemoFlowB without a layout is the case Alfonso asked about: its fork and join would turn upright, so their ends face
their row neighbours on the long sides.

**Decisions this design asks for.**
1. Option B (square box) or A (box swap with a view offset). Recommended: B.
2. Activity's fork and join in the rotation with a 120 x 120 box, or out of it. Recommended: in, since DemoFlowB without
   a layout is the case that brought Q3 forward; the alternative leaves that drawing as measured in the Q2 step.
3. At release only, or live too. Recommended: release, on open, after Auto layout.
4. The painted thickness as an IR key on the bar document (the box becomes L x L, the ink needs S): a persisted name
   (R-B9). Recommended: `shape.barThickness?: number`, absent = today's bar filling its box.

## 11. Addendum 2026-10-03, Q3 implemented (option B), measured

Commits `2d967f267` (IR: the rule, the turn, the ink, the handles), `7d7d8e23d` (ELK and the route validity),
`f4d768817` (derive: the square boxes and the thickness), `c8285f5cf` (probe). LIR: `docs/lir/lir_2026-10-03_bar_orientation.md`
§3. Probe runs `q3_before` (merged tree at `4bd9aa66f`) and `q3_after`, 23/23 each; the four default panes identical at
0.01 px (DNE_COMPARE 4/4). Unit gates: 3104 passed, the one known import red (UDComparator); typecheck 14 (baseline);
build green; mutation bench 17/17 killed (listed in the commit messages).

**One deviation from the design text.** The design started from "the declared orientation"; with a square box there is
none to declare, so a bar with no history takes the dominant axis, a tie upright (LIR §3), and the 1.2 hysteresis
applies from there. On these scenes the outcome is the one the design table gave for Petri net (classic); for Petri
net the table's row (all three upright) was taken on another geometry (`d_after`), and on this run's geometry the rule
gives t1 lying (1.90), t2 upright (1.16), t3 lying (59).

**(a) Ring, hover, hit area, port highlight: on the drawn bar.** The ink is `.ir-node-content`, where the selection ring
is drawn; the RF node takes no pointer, the ink does.

| Pane (screen px) | box | ink | hit off the ink | hit on the ink | ghosts off the ink | ghost on a long side | ring |
|---|---|---|---|---|---|---|---|
| Petri (classic), t1 | 31 x 31 | 31 x 7 (lying) | an edge's reconnect grip, not the node | node | 0 | yes, both | on the ink, wrapper none |
| Petri net, t1 | 56 x 56 | 56 x 12 (lying) | an edge's reconnect grip, not the node | node | 0 | yes, both | on the ink, wrapper none |
| Activity, fk | 60 x 60 | 4 x 60 (upright) | the pane | node | 0 | yes, both | on the ink, wrapper none |

**(b) Auto layout spacing: unchanged but for one grid step.** ELK's input is the one of before except the outside-label
gap of the Petri transitions, 6 to 7 px (now measured from the drawn bar ELK lays out; before from the old box, 1 px
outside its drawn bar). Activity (UML): every position, route and bend identical, the ink on the old bar's place
(fork 248,480; join 248,640). Petri net (classic): 556 x 184, bends 2, crossings 0, no label crossed, as before; the bars
where they were, the four places 8 px lower (one grid step, the gap). Petri net: height 746 to 754 (p3 8 px lower), bends 2, crossings 0, the same two labels
crossed. No bar turns after Auto layout (ratios 2.13 to 55.7 for the laid-out orientation), so no route is dropped.

**(c) Saved views.** A viewpoint derived before Q3 keeps its old bar (no `barThickness`), unturned, byte-identical
(irBarInk digest); the turn starts when the viewpoint is derived again.

**(d) Turn, drag, persistence, ends.** At rest: Petri (classic) t1 and t3 lying, t2 upright; Petri net the same; Activity's
fork and join upright. Drag of `lock` round t3: classic upright, upright mid-drag, lying after release; Petri net lying,
lying, upright; the box did not move (screen rect equal before and after) and no vertex field changed (stored fields
equal). Every bar end on a long side of the ink (short ends 0, all panes).

**The cost, at rest (no layout), on the three demo panes.** Measured before and after (crops listed in the closing
report):

| Pane, no layout | crossings | route through a node | labels crossed | hidden labels |
|---|---|---|---|---|
| Petri (classic) | 0 to 1 | 0 to 114 px (p1->t1 through p2, lock->t2 through t1) | 3 to 5 | 0 |
| Petri net | 0 | 0 to 106 px (p1->t1 through p2, lock->t2 through t1) | 2 to 0 | 0 |
| Activity (DemoFlowB) | 7 to 11 | 0 to 447 px (d1->fk, fk->right, right->jn through `left`) | 0 | 0 to 1 (the `>= 2` guard under `left`) |

Two causes, both measured. First, the router's one-bend and straight routes do not avoid nodes: an end that now faces
its row (fork's right side, t1's top) is routed along the row through the node between. Second, the shift the design
named "once, on adoption": the square box grows from the stored top-left, so on positions laid out for the old bar the
ink is drawn (L - T) / 2 further along its thin axis, 22 px for the Petri bars and 56.5 px for Activity's; on DemoFlowB
the fork's centre falls 38 px below its row's. Before Q2 (fork ends on any side, `q2_before`) the same pane measured 4
crossings and 158 px through nodes.

**Decision for Alfonso (RC-26).** The approved design is in and works as specified; the drawing without a layout is
worse on DemoFlowB and mixed on the Petri panes, and identical after Auto layout. Options: keep it as is (the demo shows
DemoFlowB after Auto layout); take Activity's and Flowchart's fork and join out of the turn (their `barThickness` and
square box dropped in the derive, two constants), which restores the measured pre-Q3 pane; or open the router item
(node avoidance on the one-bend routes), which is the cause on all three panes and is not in this lane.
