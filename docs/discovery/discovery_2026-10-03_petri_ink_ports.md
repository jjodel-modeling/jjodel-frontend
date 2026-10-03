# Discovery: glyph ink in dark, outside labels on arrowheads, handles on ELK ports (P-2026-10-03-1920, Phase 1)

Prompt-ID: P-2026-10-03-1920. Prompt: `docs/prompts/claude_2026-10-03_1920_prompt_petri_ink_ports.md`. Chat:
C-2026-10-03-1610. Session: `de764922-ffa8-4b33-9e83-33bc15e5c2f6`. Tree: `~/jjodel-w-petriports`, branch
`petri-ink-ports`, HEAD at measure `517a7fb4d` (code identical to the trunk `106aae181`), probe committed in
`5fda3c12f`. Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), tier heavy. This report is a set of hypotheses
with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

Measured on the four demo exports (read only), light and dark, 1600x1000, DPR 2; probe 63/63 on 3080.
1. **Ink.** Every glyph filled in the catalogue ink `#334155` reads **1.41:1** on the dark canvas `#1e293b` (9.45:1 in
   light): the transition bars of Petri net (classic) and Petri net (3 + 3), and Flowchart's initial disc. Every
   glyph in the name ink reads 12.59:1 or more (Activity's disc and bars, the bull's-eye, the entry dot). Cause: the
   catalogue preset fill (`notationCatalog.ts:59`, `INK = '#334155'`) kept by `viewpointDerivation.ts:390` and copied
   by the classic derive (`:1057`); in dark `#334155` is also the node surface. Fix (S, derive only): a solid preset's
   fill and border take `NAME_INK`. «Color by metaclass» keeps excluding them with no change (`isNotationGlyph`
   already lists that ink, `metaclassPalette.ts:413`); measured on/off equal on every glyph today.
2. **Labels.** Petri net (classic) at rest: p2 and p3's names (anchor `s`) sit under an arrowhead (0 px), lock's is
   crossed by its line; t1 and t3's (anchor `n`) under an arrowhead (0.81, 0 px). After the RIGHT Auto layout all
   clear (22.8 px or more). With the profile turned DOWN: p1, p2, lock crossed by their lines, t1 to t3 under
   arrowheads (0 to 0.26 px). Petri net after its layout: t1, t2 crossed. Cause: the anchor is a constant of the
   view (`viewpointDerivation.ts:1034`, `:1063`), painted as is (`IRNodeContent.tsx:663`); nothing reads where the
   ends are. Fix (M): the decoration pass picks, per outside label, the declared side if no edge end uses it, else
   the opposite, else a perpendicular one (`irEdgeViews.ts`), carried on the node data to `IRNodeContent.tsx` by
   `ObjectNode.tsx` (one prop, outside DOVE); ELK reserves the declared side and re-runs once where a route takes it.
3. **D-B.** P-2026-10-03-1304 already covers the drawing: the drawn end is the route given (0 px) on 66 of 68
   non-junction ends (the 2 others, the diamond refit); no edge draws a bend over ELK's. ELK's raw port moved by its
   node's snap is up to 5 px off: `keepStraight` (`elkLayout.ts:554-560`) removed 1 to 7 px jogs, so "1 px of the raw
   port" would bring them back. Left: the React Flow handles, 34 of 68 ends over 1 px off the drawn end (up to 101
   px), 5 on another side (hover, selection). Fix (M): a routed synthetic edge takes the route's sides
   (`irEdgeViews.ts`); a routed end pins its handle at the route's end (`handlePosition.ts`, and `DynamicHandles.tsx`,
   outside DOVE: its memo is keyed on topology only, `:257`).

Recommendation: Phase 2 in three commits, 1 then 3 then 2 (2 reads the sides 3 aligns). Files: §6.
**Decisions taken (unattended)**: (a) the acceptance of 3 is the drawn end against the route given (0 px) and the
handle against the drawn end (1 px), not the raw port; (b) "both directions of the classic profile" read as RIGHT and
DOWN; (c) the token dots of a classic place are marks of a coloured node (R-VP-30), not glyphs; (d) a saved derived
viewpoint keeps `#334155` until derived again (R-VP-25, R-VP-36).

**Decisions awaiting Alfonso (RC-26)**:
- A1. Item 1 amends R-VP-15 (4) and R-VP-24 (3) («the bar keeps `#334155`»): in light the bars and Flowchart's disc
  go from `#334155` to `#0f172a`, as every other glyph.
- A2. Item 2 amends R-VP-53 (the classic transition's name «a constant here», `n`): the anchor becomes a preference.
- A3. Item 3 amends R-VP-49 («the handles keep their uniform slots»), the lane R-VP-49 itself deferred to.
- A4. The three change what the demo's derived notations show (light ink, label sides, handle dots on hover).

Questions: §9, each with its `Recommended:` line.

## 1. Hypotheses under test, and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The dark bar is the catalogue ink on a canvas of nearly the same luminance | holds: 1.41:1, also Flowchart's initial disc | §3.1, measured |
| H2 | Another glyph of the four scenes falls under 3:1 | falsified: the name-ink glyphs read 12.59:1 to 16.3:1 | §3.1, measured |
| H3 | «Color by metaclass» repaints a glyph | falsified on every glyph of the four scenes, both inks | §3.1, measured |
| H4 | A classic place's name sits on an arrowhead at rest | holds: p2, p3 at 0 px; also the transitions' names | §3.2, measured |
| H5 | The same happens after the toolbar Auto layout | falsified under RIGHT (22.8 px or more); holds under DOWN | §3.2, measured |
| H6 | After Auto layout the drawn ends sit off ELK's ports | partly: off the raw port by up to 5 px (keepStraight), on the route given at 0 px | §3.3, measured |
| H7 | After Auto layout the route gets an extra elbow | falsified: 0 bends drawn over ELK's on every edge | §3.3, measured |
| H8 | The React Flow handles sit off the drawn ends after Auto layout | holds: 34/68 ends over 1 px, up to 101 px, 5 sides differ | §3.3, measured |

## 2. Method and files read

Probe `frontend/scripts/probe/petri-ink-ports.ts` (`5fda3c12f`), run with `lane-run probe ~/jjodel-w-petriports
frontend/scripts/probe/petri-ink-ports.ts --port 3080 --id P-2026-10-03-1920`; log
`~/.jjodel-lanes/P-2026-10-03-1920/probe-petri-ink-ports.log` (`RESULT 63/63`, EXIT=0); JSON
`~/.jjodel-lanes/P-2026-10-03-1920/probe_before.json`; crops `~/.jjodel-lanes/P-2026-10-03-1920/crops/pip_before_*`
(every scene, rest and after layout, light and dark; the classic DOWN layout in light). Per scene, a fresh context:
import the export, open the M1, write the binding as Apply does, derive through `dialogPrefill` and
`createDerivedViewpoint` (the scene/notation pairs of the 1304 probe: DemoPetri as Petri net (classic) and Petri net,
DemoFlowB as Activity (UML) and Flowchart, DemoPEST and DemoESM as Statechart (UML)), activate, fit, measure; click the
toolbar's Auto layout with `layout` wrapped on the elkjs instance `elkLayout.ts` imports (input and output captured);
measure again. For the classic Petri pane the viewpoint's `derivedLayout` is then rewritten with `direction: DOWN` and
the layout clicked again (this probe's project only).

How each number is taken:
- Ink: the viewport screenshot decoded in the page, a 3x3 device-pixel median at each glyph's centre and at eight
  canvas points round its node (the most frequent colour is the canvas), WCAG 2 contrast. The overlays the crops hide
  are hidden for the read; each glyph is hit-tested on screen (all on screen). Controls: the canvas colour differs
  between themes at every glyph, and every token-inked glyph changes colour with the theme (both PASS in every pane).
  «Color by metaclass» set as the Viewpoint panel writes it (`ViewpointProperties.tsx:78`), control: an ordinary node
  changes fill (PASS in every pane).
- Labels: the outside label's rect and each arrowhead's quad (the marker's shape bounds mapped onto the path end by
  `refX`/`refY`, `markerWidth` times the stroke width, `orient`), in flow coordinates; the distance rect to quad, and
  rect to every drawn path.
- Ports: the drawn end (path sampled every 2 px), the route the renderer was given (`getElkRoute`, read from the
  app's own `elkLayout.ts` module), ELK's port (the captured output's section ends plus the node's snap shift, as
  `readElkResult` computes it before `keepStraight`), and the handle the edge is attached to (its `sourceHandle` /
  `targetHandle` from the pane's React Flow store, the DOM handle's centre). Calibration spread below 1 px in every
  pane.

Files read (under `/Users/alfonso/jjodel-w-petriports/`): `CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`,
`docs/PROTOCOL.md` (P1 to P16), `docs/decisions.md` (RC-14, RC-21 to RC-30, R-VP-15, R-VP-16, R-VP-24 to R-VP-26,
R-VP-36, R-VP-40 to R-VP-57), `docs/claude-code-log.md` (head), `docs/log-inbox/views.md` (headings),
`docs/discovery/discovery_2026-10-03_derived_notations_edges.md` (whole), `docs/discovery/discovery_2026-10-01_elk_layout_quality.md`
(0 to 4.8, 9 to 12), `docs/lir/lir_2026-10-03_end_side_rule.md` (format), and under `frontend/src/components/editor-v2/`:
`viewpoint/derive/viewpointDerivation.ts` (120-160, 375-440, 960-1080), `viewpoint/ir/notationCatalog.ts` (50-120),
`viewpoint/ir/irEdgeViews.ts` (whole), `viewpoint/ir/IRNodeContent.tsx` (260-282, 455-700), `viewpoint/ir/irStyle.ts`
(216-241), `viewpoint/ir/shapeRegistry.ts` (354-355, grep), `utils/elkLayout.ts` (1-28, 170-697), `utils/handlePosition.ts`
(whole), `components/DynamicHandles.tsx` (60-80, 185-270, 380-470), `edges/UnifiedEdge.tsx` (255-554, 1140-1200,
1320-1345), `EditorV2.tsx` (3633-3807), `EditorV2.scss` (12-24, 1580-1592, 1706-1744, 2936-2946), `nodes/ObjectNode.tsx`
(939-968, grep); `frontend/src/view/viewPoint/metaclassPalette.ts` (14-40, 250-262, 405-450); `frontend/src/styles/tokens/_colors-light.scss`
and `_colors-dark.scss` (grep of the inode and canvas tokens); `frontend/scripts/probe/derived-notations-edges.ts`
(whole, the model), `frontend/scripts/probe/tree-crossing.ts` (120-175, the store access), `frontend/scripts/smoke/states.ts`
(515-580). The 1304 diff (`git diff 7a249ef87..106aae181`) was read by its stat and through the files above.

## 3. Findings

### 3.1 Item 1, the glyph ink (measured on `517a7fb4d`)

| Pane | glyph | light: painted on canvas | dark: painted on canvas |
|---|---|---|---|
| Petri net (classic) | t1, t2, t3 bars | `#334155` on `#f1f5f9`, 9.45 | `#334155` on `#1e293b`, **1.41** |
| Petri net | t1, t2, t3 bars | 9.45 | **1.41** |
| Flowchart | i0 disc | 9.45 | **1.41** |
| Flowchart, Activity (UML) | fk, jn bars | `#0f172a`, 16.3 | `#edeeef`, 12.59 |
| Activity (UML) | i0 disc | 16.3 | 12.6 |
| Activity (UML), Flowchart | fin bull's-eye dot, on its disc | `#0f172a` on `#ffffff`, 17.85 | `#eff0f1` on `#334155`, 9.07 |
| Statechart (UML), both | locked's entry dot | 16.3 | 12.59 |

Read: `notationCatalog.ts:59`, `const INK = '#334155';`, the fill of `uml-initial-state`, `uml-fork-join` and
`petri-transition` (`:94`, `:100`, `:108`). `viewpointDerivation.ts:390`, `if (preset) shapeSpec = applyPresetToShape(shapeSpec, preset);`
keeps it; `:395-399` overrides it with `NAME_INK` for the fork and join only; the Flowchart initial disc
(`initialDisc`, `:381`) and the Petri transition keep it. The classic transition copies it: `:1057`,
`const ink = v.ir.shape.fill as string;`. In dark the node surface is the same colour: `_colors-dark.scss:341`,
`--color-inode-surface: #334155;`. `NAME_INK` is `var(--color-inode-name)` (`viewpointDerivation.ts:131`), slate-900 in
light, `rgba(255, 255, 255, 0.92)` in dark (`_colors-dark.scss:344`).

«Color by metaclass» on: every glyph painted as off, in every pane (6/6 PASS), the control moving ordinary nodes
(p2, p3 to `rgb(243, 223, 203)`, `work` to `rgb(243, 203, 203)`, ...). Read: `metaclassPalette.ts:413`,
`const GLYPH_INKS: ReadonlySet<unknown> = new Set(['var(--color-inode-name)', '#334155']);` and `:430-431`, a `bar`
always, a `circle` filled in either ink: the name ink keeps every glyph excluded.

The classic place's token dots (p1, lock) paint black with the option on: they are marks inside a coloured place,
which take its WCAG text colour (R-VP-30, `IRNodeContent.tsx:554`, `markerColor = colorOverride ? colorOverride.text`),
17.85:1 and 9.07:1 against the place off. Not a glyph by R-VP-50 (a Conditional marker never matches,
`metaclassPalette.ts:431`).

Fix: in `deriveViewpointIRs`, after `applyPresetToShape`, a preset that declares a fill (`solid`, `:403`) draws fill
and border in `NAME_INK`: the Petri transition of both notations (the classic one copies it), Flowchart's initial disc,
and State machine's named Initial (hidden notation, not in the scenes; its name stays `INVERSE_TEXT`, `#ffffff` light
and `#08090a` dark on the ink). Expected: 16.3:1 light, 12.59:1 dark. Not touched: `IRNodeContent.tsx` (the drawing
reads the IR fill as it is), `metaclassPalette.ts`, the tokens. Saved derived viewpoints keep `#334155` until derived
again, as R-VP-25 and R-VP-36 accepted for the arrowheads and the bar thickness. Layer: derive only. Size S.

### 3.2 Item 2, outside labels and arrowheads (measured)

Distance from each outside label to the nearest arrowhead (and line), px:

| Pane | rest | after Auto layout | profile turned DOWN |
|---|---|---|---|
| classic p1 `s` | 409.5 (34.1) | 71.6 (32) | 69.1 (**line 0**, out bottom) |
| classic p2 `s` | **0** (line 0; in bottom) | 27.8 (31.3) | 50 (**line 0**) |
| classic p3 `s` | **0** (line 0; in bottom) | 27.7 (31.3) | 50 (50) |
| classic lock `s` | 243.1 (**line 0**, out bottom) | 61.4 (22.9) | 69.1 (**line 0**) |
| classic t1 `n` | **0.81** (in top) | 33 (37) | **0** |
| classic t2 `n` | 17.5 (21.4) | 22.8 (26) | **0.26** |
| classic t3 `n` | **0** (in top) | 34 (38) | **0** |
| Petri net t1, t2, t3 `s` | 23, 24.2, 23 | 19 (**line 0**), 19 (**line 0**), 19 | not run |

Read: the anchor is fixed in the view: `viewpointDerivation.ts:1034`, `labels: [{ position: 'outside', anchor: 's', ...`
(place) and `:1063`, `labels: [{ position: 'outside', anchor: 'n', ...` (classic transition), `:418` `anchor: 's'`
(Petri net transition); painted from it alone: `IRNodeContent.tsx:663`,
`const anchorClass = l.anchor ? \` ir-label--anchor-${l.anchor}\` : '';`, placed by `irStyle.ts:234-237`. No code reads
the sides the ends take: `grep -rn "irLabelAnchor\|labelAnchors\|outsideAnchor"` over `frontend/src` finds only
`outsideAnchorOf` of the authoring preview (`SymbolBoxPreview.tsx:76`, the symbol editor's box), nothing on the canvas
path; positive control, the same grep for `irBarOrientation` finds `ObjectNode.tsx` and `elkLayout.ts`.
The ELK reservation reads the anchor as painted: `elkLayout.ts:435`,
`const anchor = (['n', 'e', 's', 'w'] as const).find(a => el.classList.contains(\`ir-label--anchor-${a}\`));`.

Fix:
- `irEdgeViews.ts` (critical): in `synthesizeObjectAsEdges`, after the handles are placed, for each vertex whose
  resolved view has outside labels, the sides its ends hold (`sidesTaken`, `:150`, over reference and synthetic
  edges); a label whose declared side is held moves to the first free of: the opposite side, then the two others
  (`e`, `w` for `n`/`s`; `s`, `n` for `e`/`w`); with none free, the side holding the fewest ends. A pure
  `outsideAnchorFor(declared, taken)`, exported. The moves go on the node data (`irLabelAnchors`, a map declared to
  chosen, written only for a moved label and only where it differs, as `irBarOrientation` is, `:454-460`).
- `ObjectNode.tsx` (outside DOVE, one prop): passes `data.irLabelAnchors` to `IRNodeContent` beside `barOrientation`
  (`:968`).
- `IRNodeContent.tsx` (critical): an optional prop; an outside label paints `labelAnchors[l.anchor] ?? l.anchor`.
  Absent prop, same markup byte for byte.
- `elkLayout.ts`: `buildElkGraph` reserves the declared side (the node data maps the painted anchor back); after the
  layout, a node whose reserved side a route end takes is re-anchored by `outsideAnchorFor` on the routes' sides and
  ELK runs once more (5 to 28 ms warm, ELK report §4.7). After the layout the decoration pass, reading the same sides
  (with item 3's side alignment), picks the same anchor.

Expected: no outside label within 4 px of an arrowhead or crossed by a line at rest, after the RIGHT layout, after the
DOWN one; Petri net's t1, t2 off their outgoing lines. Default views: no outside label on an object-as-edge viewpoint
end, untouched. Size M. Layers: canvas v2-flow (node data, label class), ELK input.

### 3.3 Item 3, D-B: the ends after Auto layout (measured)

Per pane after the toolbar Auto layout (ends of non-self-loop edges; junction ends are Activity's merge branches):

| Pane | ends (junction) | drawn vs route given > 1 px | drawn vs raw ELK port > 1 px (max) | handle vs drawn > 1 px (max) | handle on another side | bends drawn over ELK |
|---|---|---|---|---|---|---|
| Petri net (classic) | 12 | 0 | 4 (3) | 6 (26.6) | 1 (lock->t2 source: drawn right, handle bottom) | 0 |
| same, DOWN | 12 | 0 | 4 (3) | 6 (3) | 0 | 0 |
| Petri net | 12 | 0 | 5 (5) | 6 (5) | 0 | 0 |
| Activity (UML) | 18 (4) | 2 (work->d1, the diamond refit, 6) | 3 (13) | 5 (72.5) | 2 (fk->right, right->jn) | 0 |
| Flowchart | 18 | 0 | 3 (4) | 9 (101) | 2 (fk->left, left->jn) | 0 |
| Statechart, DemoPEST | 6 | 0 | 1 (4.5) | 4 (25.5) | 0 | 0 |
| Statechart, DemoESM | 6 | 0 | 0 | 4 (21) | 0 | 0 |

What P-2026-10-03-1304 and the ELK lane already cover (read): the route's ends are ELK's ports moved with their node's
8 px snap (`elkLayout.ts:547-551`); a leg ELK drew straight stays straight, its ends sliding along their sides by up
to the grid step (`keepStraight`, `:476-491`, applied `:554-560`); a bar end takes a long side, a diamond end a vertex of
its own (`endSideFor`, `irEdgeViews.ts:131-146`; `spreadDiamondEnds` in `UnifiedEdge.tsx:330-362`); a junction branch is
fitted to its diamond (`:363-373`); an arc alone takes the route (`:318-324`). The endpoint grips are on the drawn ends
(`UnifiedEdge.tsx:1338`, `sourceX={arcGeom ? arcGeom.start.x : elkPoints ? elkPoints[0].x : pathSX}`). So the drawn
line meets the route it was given at 0 px on 66 of 68 non-junction ends (the 2 others are work->d1's diamond refit,
6 px; 3 of the 4 junction ends are fitted to their diamond, up to 21.6 px), and draws no elbow over ELK's (the route store holds one more bend than ELK on two junction edges, i0->work and d1->work, which the drawing
does not show).

Against ELK's raw port the drawn end is up to 5 px off: that is `keepStraight`, which P-2026-10-03-1304 §9 measured as
removing the 1 to 7 px jogs the snap made. An end held within 1 px of the raw port would bring them back (an extra
elbow), so the acceptance here is the route given (decision (a) of §0).

What is left: the React Flow handles. Read: synthetic edges get geometric sides on every decoration pass
(`irEdgeViews.ts:163-196`, the dominant axis or `endSideFor`), never the route's; classic edges get the route's side
(`EditorV2.tsx:3736`), but the synthetic ones are rebuilt by the decoration pass. A handle's place along its side is
the uniform slot: `handlePosition.ts:248`, `ordered.forEach((e, k) => result.set(key(e), (k + 1) / (N + 1)));`, in a
memo keyed on the handle ids only: `DynamicHandles.tsx:257`, `}, [edgeTopologyKey, nodeId]);`. The route store is read
by `UnifiedEdge.tsx` only: `grep -rln "getElkRoute\|elkRoutesRevision"` over `frontend/src` lists `elkLayout.ts`, its
test and `UnifiedEdge.tsx` (the control is the same command's hit on `UnifiedEdge.tsx`). Effect: on hover or selection
(`EditorV2.scss:1718-1722`, the connected handles' opacity) the dots sit up to 101 px from the line's end, on another
side for 5 ends; Statechart's arcs end on the route while their handles keep their slots (14 to 25.5 px).

Fix:
- `irEdgeViews.ts` (critical): a synthetic edge whose ELK route is valid (`isElkRouteValid`, on the node rects and the
  bar orientations the pass already has) takes the route's sides; a diamond end keeps `endSideFor` (one end per side,
  slot 0.5 is the vertex); a junction member keeps `assignActivityJunctions`'s.
- `handlePosition.ts` (critical): `SideEndpoint.pin?: number` (optional, Rule 11) and an optional `pinOf` argument of
  `computeSideEndpoints`; `computeSidePositions` places a pinned endpoint at its fraction and the others as today.
- `DynamicHandles.tsx` (outside DOVE): passes `pinOf` from the route store (the route's end as a fraction of the side,
  only while the route is valid) and adds `elkRoutesRevision()` and the node's rect to the memo's keys.
- `portDistribution.ts`, `edgeUtils.ts`, `UnifiedEdge.tsx`: no change.

Expected: after Auto layout every routed non-junction end's handle within 1 px of the drawn end, on its side; at rest
and after any drag (the route dropped) the uniform slots as today. Left as measured: the four Activity junction ends
(the diamond is drawn at the shared handle, `UnifiedEdge.tsx:275-282`; ELK's junction node has no React Flow edge).
Size M.

## 4. What the four demo scenes will show differently

- Default viewpoint (all four, no Auto layout): nothing; the probe's default-pane dump is the byte comparison.
- DemoPetri, both Petri notations: the bars in the name ink, `#0f172a` in light, near-white in dark; classic at rest,
  p2, p3 and lock's names above (their top is free), t1 and t3's below (their bars lie, ends on top); after the RIGHT layout, as today.
- DemoFlowB as Flowchart: the initial disc in the name ink. As Activity (UML): nothing at rest; after layout, the hover
  dots on the line ends.
- DemoPEST, DemoESM as Statechart: after layout, the hover dots on the arcs' ends.

## 5. Dependencies and risks

- Item 2 reads the sides item 3 aligns: without item 3, after Auto layout the decoration pass sees geometric sides
  (5 differ from the drawn ones) and could move a label the drawing does not need moved.
- The ELK second pass can change routes; the probe measures the label distances after it, not the first pass.
- `DynamicHandles.tsx` recomputing on `elkRoutesRevision()` adds one recompute per layout per node, not per drag (the
  route is dropped on the first move, and the memo then falls back to the uniform slots).
- Item 1 does not reach saved derived viewpoints (decision (d)); Alfonso's copies show the fix once derived again.
- No persisted key: `irLabelAnchors` and the pins are session data on React Flow nodes and in the route store.
- Lane P-2026-10-03-1845 works under `editor-v2/sim/` and `model/simulation/`: no file in common.

## 6. Phase 2 files (more than five: P6, rule 19)

| File | Item | Change |
|---|---|---|
| `viewpoint/derive/viewpointDerivation.ts` | 1 | a solid preset's fill and border in `NAME_INK` |
| `viewpoint/derive/__tests__/*.test.ts` | 1 | the pinned `#334155` of the Petri and Flowchart documents, red first |
| `viewpoint/ir/irEdgeViews.ts` | 3, 2 | route sides on a routed synthetic edge; `outsideAnchorFor` and `irLabelAnchors` |
| `utils/handlePosition.ts` | 3 | `SideEndpoint.pin?`, `pinOf` |
| `components/DynamicHandles.tsx` | 3 | `pinOf` from the route store; memo keys (outside DOVE) |
| `viewpoint/ir/IRNodeContent.tsx` | 2 | `labelAnchors` prop on outside labels |
| `nodes/ObjectNode.tsx` | 2 | passes `data.irLabelAnchors` (outside DOVE, one line) |
| `utils/elkLayout.ts` | 2 | declared side reserved; second pass on a taken side |
| tests | all | `ir/__tests__` (side, anchor), `utils/__tests__/handlePosition`, `elkLayout.test.ts` |

Layer Impact Report: `docs/lir/lir_2026-10-03_petri_ink_ports.md`.

## 7. Decisions taken (unattended)

1. (a) Item 3's acceptance: the drawn end against the route given (0 px, the diamond and junction fits excepted) and
   the handle against the drawn end (1 px); the raw port is reported, not gated (§3.3).
2. (b) "Both directions of the classic profile": the profile's RIGHT and the same profile turned DOWN, the case of the
   2026-10-02 sighting (vertical arcs).
3. (c) A classic place's token dots are marks of a coloured node (R-VP-30), reported but not gated as glyphs.
4. (d) Item 1 in the derive only: saved derived viewpoints keep their ink, as R-VP-25 and R-VP-36 accepted.
5. The probe's fit uses the pane's React Flow store (`panZoom.setViewport`): the controls' fit button is hidden
   (`EditorV2.scss:1591`).

## 8. Decisions awaiting Alfonso (RC-26)

- A1. R-VP-15 (4) and R-VP-24 (3) amended: the Petri bars (both notations) and Flowchart's initial disc in the name
  ink, `#0f172a` in light instead of `#334155`.
- A2. R-VP-53 amended: the classic transition's `n` (and every outside label of an object-as-edge viewpoint) is a
  preference, moved to a free side.
- A3. R-VP-49 amended: the handles of a routed edge sit on its ELK ends.
- A4. What the demo's derived notations show changes (§4).

## 9. Questions

1. Item 1 as the name ink (A1), not a new token keeping `#334155` in light? Recommended: yes, the name ink (one
   line in DOVE; a token needs `styles/tokens/` and `metaclassPalette.ts`).
2. Item 2's two files outside DOVE: `ObjectNode.tsx` (one prop)? Recommended: yes, the path `irBarOrientation`
   already takes.
3. Item 3's `DynamicHandles.tsx` (outside DOVE)? Recommended: yes; without it the handle positions cannot follow a
   route (its memo never sees one).
4. The ELK second pass for item 2? Recommended: yes, once, only when a route takes a reserved side.
5. Commit order 1, 3, 2? Recommended: yes.
