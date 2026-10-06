# Discovery: the corners of an IR rect symbol on an M1 node are clipped at rest

Prompt-ID: P-2026-10-01-2336 · prompt: `docs/prompts/claude_2026-10-01_2336_prompt_ir_corner_clip.md`
Session: `aad61dac-f8eb-48e8-8d82-cad1aebaeed1` · tree `~/jjodel-w-irclip`, branch `ir-corner-clip`, HEAD `acd377629`
(code identical to the trunk `4b9bc5836`: `git diff --stat 4b9bc5836 acd377629` is the one prompt file)
Executor: Anthropic Claude Sonnet 5.5 (`claude-sonnet-5-5`, tier light)
This report is a set of hypotheses with evidence, not a definitive reference: whoever uses it downstream rereads the real files.
Tags: **[measured]** a run of this phase, on the tree above; **[read]** a file or document.

## 0. Answer in brief

The reading is confirmed, with three corrections. Cause: the wrapper `.mm-node.mm-object` keeps `overflow: hidden` with a
7px padding-box clip at rest, and the IR shape inside it (radius 4, or an authored 0 to 6) draws its stroke outside that arc.
Selection lifts the clip, which is why the corners come back.

Measured on 19 nodes (light, DPR 2, port 3077), each at rest, at rest with the clip lifted by a probe style, and selected:

| form (radius painted)            | corner pixels lost to the clip (delta >= 40, inside the shape, top-left crop) | resting shadow rows lit (of 28), rest -> clip lifted |
|----------------------------------|-----|-----|
| rect base (4), rect 4, rect 0    | 25, 25, 36 (about 4x per node) | 0 -> 27, 27, 28 |
| Activity action rewritten as rect (4) | 25, 20 | 0 -> 27 |
| rect 7                           | 0 (8 antialiasing px outside the shape) | 0 -> 27 |
| rounded (10), stadium, ellipse, circle, Activity action (14) | 0 | 0 -> 24..27 |
| parallelogram, hexagon, diamond (SVG) | 0 at top-left; 38 px at the parallelogram vertices, sub-strong on the others | 0 -> 0 (`box-shadow: none`) |
| bar (Fork, Join)                 | 0 (wrapper already `overflow: visible`) | 20 -> 20 |

Corrections to the prompt's reading:
1. **There is no M2 IR node.** `IRNodeContent` is rendered by `ObjectNode.tsx` only, always inside `.mm-node.mm-object`
   (ObjectNode.tsx:937, :952). The comparison "same as an M2 IR node" has no subject. The real precedent is inside the
   same stylesheet: the `bar` form, the outside label and the entry mark already lift the wrapper's clip at rest (irStyle.ts:214, :229, :243),
   and the Fork/Join bars show their resting shadow today (20 rows lit).
2. The Activity action at 14px does not lose corner pixels, but it does lose its resting shadow (0 -> 27 rows). Alfonso's
   `Action_0` with the `rect` symbol is the radius-4 case (25 and 20 px lost inside the shape in the replica).
3. Radius 7 escapes the cut in the shape (0 px inside); 8 px per corner differ outside it, the antialiasing of two arcs of equal radius.

Recommendation: the one-rule change of the prompt, `&:has(> .ir-node-content) { overflow: visible; }` at (0,3,0) over the
base (0,2,0), comment rewritten. Visible effect beyond the corners: every IR node with a CSS-painted box gets its resting shadow
on M1, like the bars.

Not yet measured, and measured before the fix is committed (Phase 2 step 5): a DOM census of descendants of the wrapper that extend past its
box (the stop condition of the prompt). Reading so far: none expected (the shape fills the padding box and clips its own content).

Decisions awaiting Alfonso: none.
Questions: Q1 below (one line, with `Recommended:`).

## 1. Hypotheses under test, and the verdicts

- H1. The wrapper clips at rest. **Holds** [measured]: all 17 non-bar nodes, computed `overflow: hidden`, `border-radius: 8px`,
  `border: 1px solid rgba(0, 0, 0, 0)`; selected: `overflow: visible`.
- H2. `.ir-node-content` fills the padding box with a smaller radius. **Holds** [measured]: forms_rect shape `[252,142,198,40]` in card
  `[251,141,200,42]`, shape radius `4px`.
- H3. A radius under 7px is cut, 7 or more escapes. **Holds, with the 8 antialiasing px at 7** [measured] (table above).
- H4. Polygon forms with a vertex on the box edge are cut the same way. **Partly**: the parallelogram loses 38 px of at least 40/255 in the node crop, none at its
  top-left; the hexagon and the diamond differ by sub-strong amounts only (0.5px of stroke at the vertices on the edge).
- H5. The resting shadow never shows at rest on M1 IR nodes. **Holds** [measured]: 0 of 28 rows lit at rest for every CSS-painted form, 24 to 28 with the clip lifted.
- H6. M2 IR nodes show the shadow at rest. **Falsified as stated**: no M2 node renders IR (finding F5).
- H7. The Symbol Editor preview shows the same defect. **Not evidenced** [read only]: finding F6.

## 2. Files read (full paths)

- `/Users/alfonso/jjodel-w-irclip/CLAUDE.md` (section 3.1, 5, 6), `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/CLAUDE.md`, `/Users/alfonso/jjodel-w-irclip/docs/PROTOCOL.md` (P6, P16), `/Users/alfonso/jjodel-w-irclip/docs/decisions.md` (head), `/Users/alfonso/jjodel-w-irclip/docs/claude-code-log.md` (head), `/Users/alfonso/jjodel-w-irclip/docs/log-inbox/views.md` (head)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/nodes/instanceNode.scss` (lines 1-60, 660-710)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (lines 50-170, 200-245)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (lines 440-530)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (lines 430-640)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts` (lines 1-160)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (class-name lines only: grep, 937 and 1236 and 952)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/nodes/__tests__/nodeSizing.test.ts` (lines 100-235: the Activity (UML) sizes)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/sim/simNodeRunState.scss` (lines 120-170)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/viewpoint/authoring/SymbolBoxPreview.tsx` (lines 170-215), `.../SymbolEditorModal.scss` (lines 594-625)
- `/Users/alfonso/jjodel-w-irclip/frontend/src/components/editor-v2/EditorV2.scss` (lines 1665-1700; 2340-2385 for `overflow` only)
- Probe method, copied read-only from `~/jjodel-w-selring/frontend/scripts/smoke/_tmp_selring_*.{ts,js}` and `~/jjodel-w-sizeleak/.../_tmp_sizeleak_probe.ts`

## 3. Findings

**F1. The clip [read, then measured].** `instanceNode.scss:22-28`:
`.mm-node.mm-object {` ... `overflow: hidden;` `border-radius: 8px;   // NOT the 12px card radius: 12 reads too soft at diagram scale`, with the
`1px solid var(--color-inode-border)` border at :30. For an IR node `irStyle.ts:65` makes that border transparent:
`.mm-node:has(> .ir-node-content) { background: transparent; border-color: transparent; box-shadow: none; }`. The clip is the padding box, radius 7.

**F2. The shape [read, measured].** `irStyle.ts:73`: `.ir-node-content { box-sizing: border-box; ... border: 1px solid var(--border-default); border-radius: 4px; box-shadow: 0 1px 3px var(--node-shadow), 0 4px 12px var(--node-shadow-deep, rgba(0, 0, 0, 0.08)); overflow: hidden; }`;
`:83` `.ir-node-content.ir-shape--rounded { border-radius: 10px; }`; `shapeRegistry.ts:477-478` `export function baseCornerRadius(form: ShapeForm | undefined): number {` / `if (form === 'rect' || form === undefined) return 4;`.
Measured computed radii: rect 4px, authored 0 -> 0px, authored 4 -> 4px, authored 7 -> 7px, rounded 10px, stadium 999px, ellipse 50%, derived action 14px.

**F3. The selection lift [read, measured].** `instanceNode.scss:682-690`: `// An IR-rendered node wears this wrapper too, but paints its ring and band on` ... `// above cut every ring pixel. The IR branch mounts no accent bar, so there is` `// nothing to clip. Lifted only while selected: idle, the clip still holds the` `// shape's resting shadow and corners exactly as before. (0,4,0) beats (0,2,0).` `&.selected:has(> .ir-node-content) {` `overflow: visible;`.
Measured: wrapper `overflow` is `hidden` at rest and `visible` selected on every node except the bars.

**F4. The measurement [measured, 4b9bc5836 code, probe `_tmp_irclip_probe.ts`, port 3077, light theme, DPR 2].** For each node: a 25x25 css px crop
at its top-left corner (5px outside the box), a 24px-margin crop of the whole node, the same two crops with the wrapper's clip lifted by an injected
`.mm-node.mm-object:has(> .ir-node-content) { overflow: visible !important; }` (the state the fix produces, no ring or band involved), and the selected crop.
Counting differing pixels at a channel delta of 40/255 or more (a cut stroke, `#334155` on `#f8fafc`, is about 200; a shadow edge is under 22). Full table, `forms_*` and `derived_flowB_*`
(top-left crop: `any` = any delta, `strong` = 40 or more, `strong in` = of those, inside the shape's own rounded box; node = strong in the whole-node crop, four corners):
```
node                            any    strong  strong in   node strong   shadow rows rest->lifted
forms_rect (4)                  881    33      25          136           0->27
forms_rect0 (0)                 910    36      36          146           0->28
forms_rect4 (4)                 881    34      25          68            0->27
forms_rect7 (7)                 859    8       0           35            0->27
forms_rounded (10)              826    0       0           0             0->27
forms_stadium (999)             590    0       0           0             0->27
forms_ellipse (50%)             246    0       0           0             0->26
forms_para / hex / diamond      64/57/0  0     0           38/0/0        0->0 (box-shadow none)
derived i0 (circle)             1256   0       0           0             0->24
derived work, left (action 14)  744/739 0      0           0             0->27
derived d1 (diamond)            106    0       0           0             0->0
derived fin (circle)            863    0       0           0             0->24
derived fk, jn (bar)            0      0       0           0             20->20 (wrapper already visible)
work as rect, no radius         881    34      25          131           0->27
left as rect, no radius         879    27      20          132           0->27
```
Crops (4x, `sips -Z 600`, gitignored): `frontend/scripts/smoke/_tmp_irclip_crops/ic_before_triptych_<label>_600.png`, tiles
[rest | rest with the clip lifted | selected]. Read by eye on `forms_rect0` and `derived_flowB_work_asRect`: at rest the corner of the stroke is cut diagonally
(rect 0) or thinned (rect 4) and there is no shadow; with the clip lifted the corner is whole and the shadow is there; selected carries the ring and band.
The probe's own log: `~/.jjodel-lanes/P-2026-10-01-2336/probe-_tmp_irclip_probe.log` (last run, 49/49, exit 0), copy in `frontend/scripts/smoke/_tmp_irclip_before.log` (gitignored).
Caveat on the method: 5 earlier attempts are in the same log. Two died in the test page before any measurement (a navigation during the scenario, a failed dynamic import on a cold dev server);
one lost the form nodes because their label path was empty; one crashed on the tenth node, below a 1000px viewport. All four were probe defects, fixed in the probe; none touched the app.

**F5. IR content has one consumer on the canvas [read, search with positive control].** `grep -rn "<IRNodeContent" src` outside tests: `ObjectNode.tsx:952` `<IRNodeContent`; the wrapper
at `ObjectNode.tsx:937` `className={`mm-node mm-object ${selected ? 'selected' : ''}...ir-view-${irResolution.compiled.viewId}...`}`. The same search with
`command grep` (the interactive `grep` skips ignored paths, CLAUDE.md section 5) found the two consumers of `ir-node-content` as a class name: `IRNodeContent.tsx:523` and `SymbolBoxPreview.tsx:199`.
Positive control: the same command returned `ObjectNode.tsx` for `IRNodeContent`, which is known to be present.

**F6. The Symbol Editor preview [read only, not measured].** `SymbolBoxPreview.tsx:199` `<div className={`ir-node-content ir-shape--${v.form}`} style={replicaStyle}>` is a direct
child of `.symbol-box-preview__stage`, which `SymbolEditorModal.scss:~608` styles `&__stage { position: relative; }`. There is no `.mm-node.mm-object` around it, so the 7px clip does not exist there by construction.
Not measured: an ancestor of the strip may clip; nothing in the two files read says so.

**F7. Precedent for lifting the wrapper's clip at rest [read].** `irStyle.ts:214` `.mm-node:has(> .ir-node-content.ir-shape--bar) { min-width: 0; min-height: 0; overflow: visible; }`;
`:229` `.mm-node:has(> .ir-node-content > .ir-label--outside) { overflow: visible; }`; `:243` `.mm-node:has(> .ir-node-content > .ir-entry-svg) { overflow: visible; }`.
Measured: the derived Fork and Join (bar) draw the resting shadow today, 20 rows lit.

**F8. The Activity (UML) derived views [measured].** Views of the derived viewpoint, `[name, metaclasses, form, radius]`: `["View for InitialNode",["InitialNode"],"circle",null]`,
`["View for Activity",["Activity"],"rounded",14]`, `["View for Decision",["Decision"],"diamond",null]`, `["View for Fork",["Fork"],"bar",null]`, `["View for Join",["Join"],"bar",null]`,
`["View for FinalNode",["FinalNode"],"circle",null]`, `["View for ActivityNode",["ActivityNode"],"rounded",14]`. No derived view draws a `rect`: Alfonso's `Action_0` is a symbol he set to `rect`; the replica (view rewritten to `rect`, radius removed) reproduces the loss (25 and 20 px inside the shape).

## 4. Dependencies and risks

- R1. **Spill at rest (the stop condition).** With the clip lifted, any descendant of the wrapper that extends past its padding box would now show. Evidence so far, indirect: the rest-versus-lifted node crops differ by 40 or more only at the corners
  of the rect family and the parallelogram, and by shadow elsewhere. A direct census (descendants whose rect exceeds the card's) is **not yet measured**; Phase 2 step 5 measures it on the fixed tree before the fix is committed. A spill stops the lane with `Outcome: question`.
- R2. **Visible change beyond the corners:** the resting shadow appears on every M1 IR node with a CSS-painted box (rect, rounded, stadium, ellipse, circle). Intended by the prompt, matches the bars; changes saved derived and authored viewpoints at rest.
- R3. **Specificity:** `.mm-node.mm-object:has(> .ir-node-content)` is (0,3,0) over `.mm-node.mm-object` (0,2,0). `--orphan`, `--not-rendered` (EditorV2.scss:2347, :2365) set no `overflow` in the lines read. The `&.selected:has(...)` rule at (0,4,0) is subsumed by the new one; the prompt asks to turn it into the unselected form, not to keep both.
- R4. **Sim run state:** `.mm-node.sim-active--derived:not(.selected) > .ir-node-content { outline: 2px solid #0ea5e9; outline-offset: -2px; }` (simNodeRunState.scss:149-152) is an inset outline on the shape: unaffected, and its corners are no longer cut for radius under 7 [read].
- R5. Non-IR M1 nodes (classic `.mm-object` with accent bar) keep the clip: the new selector needs a direct `.ir-node-content` child, which they lack [read, `ObjectNode.tsx:1236` has none]. Verified in Phase 2 by the default-scene pixel diff.
- R6. The critical-zone list (section 3.1) names `viewpoint/ir/` and `viewpoint/authoring/`; `instanceNode.scss` is in neither. No Layer Impact Report is owed; the change touches no D, L, JjOM, sync or persistence layer.

## 5. Open questions

1. The Symbol Editor preview does not show the defect by construction (F6, read only). Record it as a ticket? (the prompt says: only if it shows the same defect)
   Recommended: no ticket; note F6 in the closing log entry.

## 6. Addendum, 2026-10-02: Phase 2, the fix and what the fixed tree measured

Written after the fix, `0070222d8` (code), on the same tree and the same probe as section 3 (`_tmp_irclip_probe.ts`, port 3077, light, DPR 2, run tag `after`, 103/103, exit 0).
Tags as above: [measured] a run of this phase, [read] a file.

**The change [read, diff].** `instanceNode.scss`, one rule and its comment: `&.selected:has(> .ir-node-content) {` becomes `&:has(> .ir-node-content) {`, `overflow: visible;`, at (0,3,0) over `.mm-node.mm-object` (0,2,0). The comment now says why:
the shape inside carries its own radius, clip and shadow, and the wrapper's `overflow: hidden` cut the corners of a shape under the 7px arc and its resting shadow, as well as the ring and band.

**A1. The R1 spill census is measured now [measured].** For each of 20 nodes (the ten forms, a content node with an attribute compartment and three badges, the derived Activity (UML) nodes, and the two Activity nodes rewritten as rect) at rest: descendants of the wrapper whose box extends past the wrapper's border box by more than 0.5 px and are drawn
(opacity above 0 and visibility not hidden): **0 on all 20**. Descendants past the box that are not drawn at rest: 32 per node (30 on the diamond), all `react-flow__handle` anchors, opacity 0. The stop condition of the prompt (something drawn past the box at rest) does not fire.

**A2. Rest after the fix equals rest with the clip lifted [measured].** The probe's lifted state is now the natural one: top-left crop, rest versus rest with the clip lifted by a style, 0 differing pixels on every node; resting shadow rows lit, rest/lifted:
`rect 27/27, rect0 28/28, rect4 27/27, rect7 27/27, rounded 27/27, stadium 27/27, ellipse 26/26, rich 27/27, circle i0 24/24, action 14 27/27, circle fin 24/24, bar fork and join 20/20, parallelogram, hexagon, diamond 0/0 (box-shadow none)`.
Before the fix the same rows were 0 on every node but the bars (section 3, F4).
Rest before versus rest after, whole-node crop: the counts equal the rest-versus-lifted counts of the before run to the pixel (rect 19417, rect0 20593, rect4 10428, rect7 19183, rounded 18882, stadium 9337, ellipse 5819, para 461, hex 379, diamond 176, action 13772, i0 2834, d1 280, fin 3276, bars 0).

**A3. The default scenes [measured].** The four demo scenes in the default viewpoint (sm, petri, esm, flowB M1) and the two metamodel tabs (sm, flowB M2): the `.react-flow` shot, after against before, **0 px on all six** (the 431 pixels of the Jodie launcher masked, the same count in all six). Non-IR M1 nodes (the classic `.mm-object` with accent bar) and M2 class nodes are among them.

**A4. The derived pane [measured].** Derived Activity (UML) viewpoint, before against after: 44297 differing pixels (47197 with the Activity view rewritten as rect), every one within 30 css px of a node card except the 431 of the Jodie launcher; per node 13772 (work), 13773 (left), 9931 (right), 2834 (i0), 3276 (fin), 280 (d1), 0 for the two bars. Those are the corner and shadow pixels, listed by node, and nothing else.

**A5. The hover state, a consequence the prompt did not name [measured].** On an unselected IR node the connected anchors draw on hover (EditorV2.scss:1718-1722, `.react-flow__node:hover .mm-anchor.mm-anchor--connected { opacity: 1 }`), the two of the `work` node 4 px past the box on the left and the right. Under the old clip (forced back by a style) they draw as half circles, now whole, as they already did selected and as they do on M2 nodes. The two crops differ below a channel delta of 40 in the anchors (light grey on the canvas); the visible change is the shadow and the corners. The chat accepted it (ratified answer to Q1).

**A6. The red test, and the answer to Q1 [measured, read].** `irSelectionRing.test.ts:183-186`, `expect(rgb).toEqual(CANVAS)` for an unselected IR node 4 px above its top edge, passed 5/5 without the fix and failed with it: `expected [ 240, 244, 248 ] to deeply equal [ 241, 245, 249 ]`, the resting shadow arriving. The lane stopped with `Outcome: question` (the file was outside the prompt's scope); the chat ratified the recommendation. The test is now `an unselected IR node paints no ring or band outside its shape, only its resting shadow`: every channel at most 3 under the canvas and blue minus red at most 10. Mutation bench: the same test with the unselected node rendered selected fails on the first assertion (`rgb 139,214,248`); the four ring tests are untouched.

**A7. Gates [measured].** typecheck exit 2, 14 errors, the section 17 set by file and code (compared to the first run, identical); `npx vitest run src/components/editor-v2` 105 files, 2559 tests, exit 0; `npm run build` exit 0. A first vitest run at load average 28 timed out four Chromium-laid-out files (hook 10 s, test 15 s: `irCollapsedRender`, `irSelectionRing`, `irActivityRender`, `irC2Render`), none an assertion; the rerun at load 5 was green.

**A8. Crops (gitignored, `frontend/scripts/smoke/_tmp_irclip_crops/`, `sips -Z 600`).**
`ic_triptych_<label>_600.png`, tiles [before rest | after rest | after selected], top-left corner at 4x, labels `forms_rect`, `forms_rect0`, `forms_rect4`, `forms_rect7`, `forms_rounded`, `forms_para`, `forms_hex`, `forms_diamond`, `forms_stadium`, `forms_ellipse`, `derived_flowB_{i0,work,left,d1,fk,jn,fin}`, `derived_flowB_work_asRect`, `derived_flowB_left_asRect`;
`ic_before_triptych_<label>_600.png`, tiles [rest | rest with the clip lifted | selected], the defect as it was;
`ic_after_hover_derived_flowB_work_r14_600.png` and `..._work_asRect_600.png`, tiles [old clip forced back | tree], the hover anchors;
panes `ic_{before,after}_flowB_derived_pane.png`, `..._derived_asRect_pane.png`, `ic_{before,after}_<scene>_default.png`.
Probe, scenario, logs: `frontend/scripts/smoke/_tmp_irclip_{probe.ts,scenario.js,common.ts,celldiff.ts,before.log,after.log}`; the lane folder `~/.jjodel-lanes/P-2026-10-01-2336/` holds `probe-_tmp_irclip_probe.log`.

**Open.** The Symbol Editor preview (F6) stays read-only evidence, no ticket (the recommendation of Q1 of section 5). Visual check owed to the chat: the corners and shadow of an IR rect node, whole at rest; selection now differs from rest by the ring and band only; anchors whole on hover.
