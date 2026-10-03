# Discovery: Petri net (classic) transition name clear of the arcs, outside vertex labels in ELK (P-2026-10-03-1415)

Prompt-ID: P-2026-10-03-1415. Prompt: `docs/prompts/claude_2026-10-03_1415_prompt_petri_transition_name.md`.
Session: unknown (the harness shows no id). Tree: `~/jjodel-w-petriname`, branch `petri-transition-name`, HEAD `4f43eb718`
(the prompt's docs commit on the trunk tip `764e00502`). Executor: Claude Opus 5.5 (`claude-opus-5-5`). This report is a
set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

1. **The anchor is a one-line change, fixed, in the derive folder.** The classic transition name is
   `{ position: 'outside', anchor: 'e', … }` at `viewpointDerivation.ts:1010`. The bar is always upright (12×56, `:925`),
   and the classic profile always runs `RIGHT` (`notations.ts:101`). Lane P-2026-10-03-1304 landed no code: its report
   defers the bar rotation (its Q3), and its branch is not an ancestor of HEAD. So the rule reduces to a fixed anchor `'n'`.
   No `viewpoint/ir/` file and no critical-zone file is needed. Two tests pin `'e'` (in the DOVE list).
2. **ELK reserves outside node labels. Measured on elkjs 0.11.1**, with these option names found in
   `node_modules/elkjs/lib/elk.bundled.js`: `elk.nodeLabels.placement` with `OUTSIDE V_TOP H_CENTER` (`V_BOTTOM`,
   `H_RIGHT V_CENTER` and `H_LEFT V_CENTER` for the other anchors), and `elk.spacing.individual` set to
   `"elk.spacing.labelNode:<gap>"` on the node. The node box comes back unchanged (12×56), so positions stay the box.
   `elk.nodeSize.constraints` is not needed.
3. **Nothing in the app measures outside vertex labels today**, and `elkLayout.ts` measures nothing. Edge labels are
   measured in `EditorV2.tsx:3659-3704` (`handleAutoLayout`) and handed to `computeElkAutoLayout` as `labelsOf`
   (`:3706`). So the vertex labels need the same: a measurement over the canvas DOM plus one more input key, passed at
   `EditorV2.tsx:3706`. **`EditorV2.tsx` is outside the DOVE list:** question 1.
4. **The painted gap is not the CSS 8 px everywhere.** At rest the `e` and `s` labels start 6 px past the React Flow node
   box (measured), against `calc(100% + 8px)` in `irStyle.ts:235,237`. So the measurement reads each label's gap from
   the DOM rects rather than hard-coding 8.
5. **The baseline is reproduced on this tree** (real toolbar auto-layout, probe 17/17). Petri net (classic) has 2
   label-edge collisions (`t1`×`t1->p2`, `t2`×`t2->p3`). The six other scenes are at 0 on every collision metric.
   Rest: two baseline runs, 9/9 shots byte-identical (the noise control, Jodie's avatar hidden).

Decisions taken (unattended): the row id R-VP-53 (free on every branch, §4.6); the gap measured, not constant (§4.4);
the DOM measurement as a helper exported from `elkLayout.ts`, so that `EditorV2.tsx` changes by one call (§5).

Decisions awaiting Alfonso: none from the RC-26 list. The anchor change amends R-VP-24, already ratified by Alfonso in
the prompt («si», 2026-10-03).

Questions:
1. May the lane touch `EditorV2.tsx` with one call at `:3706` (`outsideLabelsOf` measured by the new helper)?
   Recommended: yes; without it the ELK reservation never runs in the app, and the alternative (elkLayout.ts reading `document` itself) is unscoped.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The classic bar has a fixed orientation on the trunk, so a fixed anchor suffices | holds | §4.1, read; 1304 not merged (`git merge-base --is-ancestor derived-notations-edges HEAD` false) |
| H2 | ELK can reserve outside node labels without growing the node box | holds | §4.3, measured in node on elkjs 0.11.1 |
| H3 | Outside vertex labels are already measured somewhere the lane can reuse | falsified | §4.2, read, search with control |
| H4 | `elkLayout.ts` alone can feed ELK the measured labels | falsified | §4.2: the DOM is read in `EditorV2.tsx`, which passes `labelsOf` |
| H5 | Phase 2's Petri collisions persist on this tree (bar 12×56 since P-2026-10-03-1300) | holds | §4.5, measured |

## 2. Objective

Locate the classic transition label and the state of bar size, orientation and profile after lanes P-2026-10-03-1300 and
P-2026-10-03-1304. Find how `elkLayout.ts` receives labels, and whether outside vertex labels are measured anywhere.
Confirm the elkjs option names for outside node labels. Re-measure the Phase 2 baseline on this tree before any code.

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (lines 870-1020, 418)
- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/viewpoint/derive/notations.ts` (lines 39-120, 335-350)
- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/utils/elkLayout.ts` (whole, 555 lines)
- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/utils/__tests__/elkLayout.test.ts` (lines 1-110, 300-343)
- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/EditorV2.tsx` (lines 3620-3770)
- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (lines 216-238), `IRNodeContent.tsx` (lines 615-660), `irCompile.ts` (397-405), `irTypes.ts` (60-63) — read only
- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (lines 930-975)
- `/Users/alfonso/jjodel-w-petriname/frontend/src/components/editor-v2/viewpoint/derive/__tests__/notationsPolishA.test.ts` (295-325), `viewpointDerivation.test.ts` (820-845)
- `/Users/alfonso/jjodel-w-petriname/docs/discovery/discovery_2026-10-01_elk_layout_quality.md` (§0, §10-§12.1), `docs/decisions.md` (RC-20..34, R-VP-24, R-VP-40..52), `docs/PROTOCOL.md` (whole), `frontend/src/components/editor-v2/CLAUDE.md` (whole)
- `derived-notations-edges:docs/discovery/discovery_2026-10-03_derived_notations_edges.md` (§0, §1, lines 129-151, 287-289), by `git show`
- Probe kit of the ELK lane, read-only copies from `~/jjodel-w-elklayout/frontend/scripts/smoke/`: `_tmp_elk_after.ts`, `_tmp_elk_rest.ts`, `_tmp_elk_metrics_lib.mjs`, `_tmp_elk_after_metrics.mjs`, `_tmp_elk_scenario.js`, `_tmp_elk_er.js`

## 4. Findings

### 4.1 The classic transition, its bar and its profile (read)

- `viewpointDerivation.ts:1010` (the prompt's «about line 971», moved by 1300):
  `labels: [{ position: 'outside', anchor: 'e', source: NAME_SOURCE(), style: EDGE_LABEL_STYLE() }],`
- `viewpointDerivation.ts:925`: `const CLASSIC_BAR_SIZE = { width: PETRI_BAR_SHORT, height: PETRI_BAR_LONG } as const;`
  (`:919-920`: 56 and 12; the comment at `:922-923`: «The IR has no orientation, so the bar is upright for every transition»).
- `notations.ts:101`, the classic profile: `layout: { direction: 'RIGHT', edgeRouting: 'POLYLINE', nodePlacement: 'NETWORK_SIMPLEX', spacing: { ...COMPACT } } },`
- The place name: `viewpointDerivation.ts:981`, `anchor: 's'`. The Petri net (non-classic) transition: `:418`, `anchor: 's'` under a flat bar.
- Lane 1304: on its branch only a probe and a report (`git diff --stat HEAD...derived-notations-edges`: 3 files, no source).
  Its §0 item 3: «Live rotation. Not expressible in the IR … Recommend: defer past the demo.»
- Pinned `'e'`: `notationsPolishA.test.ts:313-316` («the name stays outside to the right of the upright bar») and
  `viewpointDerivation.test.ts:826-838`. `command grep -rn "anchor-e" src --include='*.test.*' --include='*.snap'`: no hit;
  control in the same run, `petriClassic` in test files: 11 files.

### 4.2 Where labels reach ELK, and where outside labels are measured (read)

- `elkLayout.ts:308`: `const labels = (input.labelsOf?.(e.id) ?? []).filter(l => l.width > 0 && l.height > 0);` edge
  labels only. The node children carry `{ id, ...realSizeOf(n) }` (`:271`), and nothing else.
- `EditorV2.tsx:3659` `const labelMap = new Map<string, ElkLabelInput[]>();` is filled from the DOM (`:3665-3704`), then
  `:3706` `const result = await computeElkAutoLayout(currentNodes, currentEdges, { profile, roleOf, labelsOf: id => labelMap.get(id) });`
- Outside labels are painted as `span.ir-label.ir-label--outside.ir-label--anchor-<a>`, direct children of
  `.ir-node-content` (`IRNodeContent.tsx:631`, `irStyle.ts:230-237`), absolutely positioned: e.g. `irStyle.ts:234`
  `… ir-label--anchor-n { top: auto; bottom: calc(100% + 8px); left: 50%; … transform: translateX(-50%); …}`. Not in the
  node's measured size.
- Measured nowhere: `command grep -rn "ir-label" frontend/src --include='*.ts' --include='*.tsx'` outside `irStyle.ts`
  and tests returns only `IRNodeContent.tsx:631,640,658` (rendering) and `SymbolBoxPreview.tsx:6,240` (authoring preview).
  The search has signal: it finds the renderer.
- One `IRNodeContent` per `ObjectNode` (`ObjectNode.tsx:952`); contained children are separate React Flow nodes, siblings
  in the DOM. So `.react-flow__node[data-id] .ir-node-content > .ir-label--outside` attributes each label to its node.
- Anchors: `irTypes.ts:63` `export type LabelAnchor = 'n' | 'e' | 's' | 'w';`, default `'s'` (`irCompile.ts:401-405`).

### 4.3 elkjs option names and behaviour (measured, node, elkjs 0.11.1)

- Version: `node_modules/elkjs/package.json` `"version": "0.11.1"`. Counts in `elk.bundled.js` (the file `elkLayout.ts:20`
  imports): `elk.nodeLabels.placement` 1, `elk.spacing.labelNode` 1, `elk.nodeSize.constraints` 1, `elk.spacing.individual`
  1, `V_TOP` 2, `H_RIGHT` 2. In `elk-worker.min.js` also `V_BOTTOM`, `V_CENTER`, `H_LEFT`, `H_CENTER`, `OUTSIDE`. Control
  of absence in the same run: `elk.layered.nodeLabels`, 0.
- A RIGHT graph p1 → t1,t2 → p2 (bars 12×56), labels 60×16 at `OUTSIDE V_TOP H_CENTER`: t2 moves from y 12 to 34
  (16 + 6 reserved above), t1 from x 112 to 136 (the label's overhang), the graph from 236×176 to 284×220. Both
  placement spellings (`OUTSIDE V_TOP H_CENTER`, `[OUTSIDE, V_TOP, H_CENTER]`) give the same result.
- The node box comes back as given: `t1@136,152 12x56`, so positions mapped back stay the node box.
- Label-node gap: root default 5 (label at −21 for 16 px), root `elk.spacing.labelNode: 8` gives −24. As a plain node
  option it is ignored (−22 with root 6). `elk.spacing.individual: "elk.spacing.labelNode:8"` on the node gives −24.
  The form `"spacing.labelNode=8"` gives −22, which makes it the negative control: the override is read only when
  well-formed.
- `n`, `s`, `e`, `w` → `OUTSIDE V_TOP H_CENTER`, `OUTSIDE V_BOTTOM H_CENTER`, `OUTSIDE H_RIGHT V_CENTER`,
  `OUTSIDE H_LEFT V_CENTER`. Each reserves on its side: for `e` the next layer moves from x 46 to 64.

### 4.4 The painted gap (measured, rest probe, light, this tree)

DemoPetri under Petri net (classic), no auto-layout: `t1` (`ir-label--anchor-e`) starts 6 px right of its 12×56 node box
(`dx 18`). `p1` (`anchor-s`) starts 6 px below its 44×44 box (`dy 50`). The CSS says 8 from `.ir-node-content`, which is
smaller than the React Flow box ELK lays out. Hence the gap is read per label from the DOM rects (flow units), not
assumed.

### 4.5 Baseline after a real toolbar auto-layout (measured, this tree, before any code)

The ELK lane's probe, copied read-only as `frontend/scripts/smoke/_tmp_petriname_after.ts` (gitignored), with this
tree's own Vite on 3241 and the ELK wrapper in pass mode (the input is recorded, never changed): 17/17, EXIT=0, no page
error. ELK node labels received: none in 7/7 scenes.

| scene | node-node | edge-node | crossings | edge-edge overlap | label-label | label-node | label-edge | outside labels | off grid | bends mean / max | W×H |
|---|---|---|---|---|---|---|---|---|---|---|---|
| flowB_flowchart | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/8 | 1.11 / 2 | 458×464 |
| flowB_activityUml | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/8 | 1.78 / 5 | 368×680 |
| petri_petriClassic | 0 | 0 | 0 | 0 | 0 | 0 | **2** | 7 | 0/7 | 0 / 0 | 564×179 |
| pest_statechart | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/6 | 4 / 7 | 552×442 |
| er_erChen | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/13 | 0 / 0 | 622×586 |
| class_DemoFlowB | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/8 | 0 / 0 | 1044×394 |
| class_DemoERD | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/4 | 0.5 / 2 | 228×608 |

Petri's two: `t1xt1->p2`, `t2xt2->p3`, the names crossed by their own outgoing arc, as Phase 2 reported on the 10×44 bar.
Rest (`_tmp_petriname_rest.ts`, the ELK lane's rest probe plus DemoPetri classic, Jodie's avatar hidden): run b1 2/2
(served-sources control, no page error), then b2 against b1, 10/10. The four default scenes, the four DemoFlowB derived viewpoints and the Petri classic view are
the same bytes: the comparison has no noise floor. Its control has signal: `measureOutsideLabels` is absent from the
served `elkLayout.ts` today, and a run after the change must find it.

### 4.6 The row id (read)

Per branch, `git show <b>:docs/decisions.md | grep '**R-VP-53**'`: 0 branches. The control, `**R-VP-52**`: 12 branches.
The other `R-VP-53` strings in `docs/` are «control: `- **R-VP-53**` none» lines of merge prompts.

## 5. Plan (inside the DOVE list but for question 1)

- `viewpointDerivation.ts:1010`: `anchor: 'n'`, and the comments that say «to the right» (`:934-935`). Tests: the two pins
  move to `'n'`, with a test named for the rule (vertical bar under RIGHT → `n`).
- `elkLayout.ts`: a new optional `outsideLabelsOf?: (nodeId) => ElkNodeLabelInput[]` on `ElkAutoLayoutInput` (additive,
  Rule 11); `buildElkGraph` puts them on the child as ELK labels, with the placement by anchor and the gap as
  `elk.spacing.individual`. Plus an exported `measureOutsideLabels(container)`: per `.react-flow__node[data-id]`, its
  `.ir-node-content > .ir-label--outside` with `offsetWidth/offsetHeight`, the anchor from the class, and the gap from the
  rects divided by the zoom. `readElkResult` unchanged: positions are ELK's child `x/y`, the box.
- `EditorV2.tsx:3706` (question 1): `outsideLabelsOf: id => outsideMap.get(id)`, with `outsideMap` measured on the same
  `container` as the edge labels. Only the `full` branch, so first open and late-edge re-layout keep `computeElkLayout`.

## 6. Risks

- Every notation with an outside label changes after an auto-layout, not only Petri classic: Petri net (place name `s`,
  transition `s`), and user views with outside labels. That is intended by the decision. At rest nothing moves but the
  classic transition names.
- Stress (ER (Chen)) ignores node labels; ER has no outside labels, so nothing changes there.
- The `sporeOverlap` second pass rebuilds the children without labels (`elkLayout.ts:464`): stress only, harmless.
- A label in edit mode is an `input` with `min-width: 80px` (`irStyle.ts:238`). If an auto-layout runs during an edit,
  that width is the one reserved.

## 7. Questions

1. May the lane touch `EditorV2.tsx`, one call at `:3706` passing the measured outside labels? Recommended: yes.
