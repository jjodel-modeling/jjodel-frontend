# Discovery: slice C3, ports of IR edges, reproduced on the derived turnstile (hypothesis falsified)
Prompt-ID P-2026-09-29-2351 · `docs/prompts/claude_2026-09-29_2351_prompt_c3_ir_edge_ports.md` · Chat C-2026-09-29-2230 · session `e49c5757-b4ee-4eae-9dd0-a6d9233c0db4` · tree `~/jjodel-w-irports`, branch `ir-edge-ports`, HEAD `bc1a3f171` · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference. [M] measured in this phase on `bc1a3f171`, [R] read.

## 0. Answer in brief
- **The hypothesis of rows 11 and 12 is false on the turnstile** [M]. `freeHandleIndex` gives the five transitions five distinct (node, side, role, index) handles, the highest index is 2, and all five edges are drawn. The DOM and a headless run of `assignGeometricHandles` on the same geometry agree handle by handle (§2). No two arrowheads end within 1 px of each other.
- **The count reading and the cap are real, but they are latent** [M]. With a hole in the taken indices (a user anchor on `left-1` only), `freeHandleIndex` returns 1, an index already taken. A fifth edge on one (node, side, role) gets index 4, which DynamicHandles never renders, so xyflow drops that edge. The turnstile hits neither case. Per the chat's decision, no code is changed.
- **What the turnstile shows instead has three causes, none of them in `irEdgeViews.ts`'s index** [M]:
  1. **Self-loop corner.** The `push` self-loop is drawn on the corner of the node's bounding box (`UnifiedEdge.tsx:374`), whatever its handles. On the 66 px `locked` circle its arrowhead lands at (317, 157), about 4 px outside the outline and 2.8 px from where `stop` starts (314.4, 158.1). `coin` starts at (320.3, 167.4) and `push` ends at (320.3, 180.6). At 100% that makes four line ends in 24 px on the right of `locked`, which is the likeliest reading of «three arrowheads on one point».
  2. **Phantom self-loop handles.** `assignGeometricHandles` gives the self-loop `right-1` (source) and `left-0` (target). No line touches either, but both count in the uniform (k+1)/(N+1) split. The right side of `locked` spreads 4 endpoints for 3 lines, and its left side holds one endpoint for none.
  3. **Grey dot on `off`.** The dot is the connected target anchor `off.left-0` (8×8, fill `rgb(226, 232, 240)`, 1 px border `rgba(0,0,0,0.2)`). It is shown on hover by design (`EditorV2.scss:1718`) and is `opacity: 0` at rest [M]. It reads as a stray dot because the router's 8 px snap (`edgeUtils.ts:150`, `:222`) straightens `stop` (dy 7.8 px) at the mean y. The arrow tip is at y 158.1 and the anchor at y 162, so neither end of the line sits on its anchor. The same straight `stop` also crosses the `unlocked` box (x 671-871, y 141-183).
- **The four demo scenes in the default viewpoint** are untouched: no file changed.

Recommended: close C3 with no code change and open a slice for causes 1-3. Option: in `irEdgeViews.ts`, give a self-loop the two handles of the corner it is drawn on, top and right for `TR` (§3.1, Layer Impact Report), then fix the snap and the circle corner in `edgeUtils.ts` and `UnifiedEdge.tsx`. Those two files are shared by the default notation, so the four demo scenes must be re-measured.

**Decisions awaiting Alfonso** (RC-26)
1. The follow-up touches `irEdgeViews.ts` (critical zone) and the router shared with the default notation (`edgeUtils.ts`). Any snap change can move edges in the four demo scenes.

**Questions**
1. Close C3 with no code and the latent `freeHandleIndex` defect ticketed, or fix the latent defect now (first free index, capped) although the turnstile does not show it? Recommended: ticket it; it is cheap, but no measured scene exercises it.
2. Open slice C3b (self-loop handles, the self-loop corner on non-rectangular shapes, the snap offset) on this report? Recommended: yes, with its own §5 specification: «on `locked`, no two line ends within 6 px; on `off`, the hovered anchor centred on the arrow tip within 1 px».

## 1. Hypotheses under test
| # | Hypothesis (discovery `ee7206d0c` §1 rows 11, 12) | Verdict | Evidence |
|---|---|---|---|
| H1 | `freeHandleIndex` returns a count, so two turnstile edges share an index and their arrowheads land on one point | falsified on the turnstile; the count reading is true | §2: 5 distinct handles, 0 duplicates, END GROUPS `[]`; control with a hole returns a taken index [M] |
| H2 | `MAX_HANDLES_PER_SIDE = 4` drops a fifth edge on a side | falsified on the turnstile; true for 5 edges on one (node, side, role) | max index 2 on the turnstile; a synthetic fifth edge gets `right-4/left-4` [M]; `for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++)` (`DynamicHandles.tsx:300`); xyflow returns `null` on a missing handle (`@xyflow/system` 0.0.76 `getEdgePosition`, `if (!sourceHandle \|\| !targetHandle) { params.onError?.('008', …); return null; }`) [R] |
| H3 | The grey dot is a handle that no line touches | partly | the dot is the hovered connected anchor of `stop`, which the line misses by 3.9 px after the snap (§3) [M]. The self-loop's untouched handles exist, on `locked`, not on `off` [M] |

## 2. Reproduction [M]
- **Scene.** `_tmp_irports_probe.ts` (gitignored) on vite 3061, started by `lane-run probe`, 1600×1000 at DPR 2, light theme (`editor-v2 theme-light notation-uml`). DemoPEST and demoSM are built by the probe-kit scenario (`~/.jjodel-lanes/probe-kit/_tmp_input_scenario.js`, sm only). The bag is written as Apply writes it (`simProfile: stateMachine`, Node, Initial, Terminal, Transition, Owned transitions, Next state, Trigger). Then `createDerivedViewpoint`, then `activateViewpoint` (`utils/lastViewpoint.ts:49`), then the demoSM tab. Log: `~/.jjodel-lanes/P-2026-09-29-2351/probe-_tmp_irports_probe.log`, EXIT=0, one console error (`failed to get project {project: null}`, the one the V2 lane logged too).
- **Positive control on the activation.** The first run set only `project.activeViewpoint` and drew the default notation: transitions as nodes, `Abstract s...` in the toolbar. Log `probe-run1-default-rendered.log`. So the second run, with `activateViewpoint` (`root: true`), does measure the derived view.
- **Layout.** Screen boxes: `locked` (251, 141) 66×66 circle; `unlocked` (671, 141) 200×42; `off` (1091, 141) 200×42; Events `coin`, `push` and `stop` on the row at y 441. This is the same grid as the demo export `~/jjodel-demo-exports/scene_1_DemoPEST.json` (x 50/470/890, y 50/350), read with the decoded copy in `~/jjodel-w-notations/.../_tmp_notations_data/`.
- **Edges** (RF props read from the edge fiber; ends are `getPointAtLength` in screen px):

| Edge | Handles | Start | End |
|---|---|---|---|
| t1 coin locked→unlocked | `right-0` → `left-0` | (320.3, 167.4) | (667, 151.5) |
| t2 push unlocked→locked | `left-0` → `right-0` | (667, 162) | (320.3, 180.6) |
| t3 push locked→locked | `right-1` → `left-0` | (301, 141) | (317, 157) |
| t4 coin unlocked→unlocked | `right-0` → `left-1` | (855, 141) | (871, 157) |
| t5 stop locked→off | `right-2` → `left-0` | (314.4, 158.1) | (1087, 158.1) |

- **Handles of `locked`** (connected, centres): `right-2/source` (310.4, 154.2), `right-0/source` (316.3, 167.4), `right-0/target` (316.3, 180.6), `right-1/source` (310.4, 193.8), `left-0/target` (251, 174). The last two belong to the self-loop, and its drawn ends are (301, 141) and (317, 157).
- **Headless, same geometry** (`_tmp_irports_unit.ts`, `npx tsx`, EXIT=0). `ASSIGN t1 coin locked.right-0 -> unlocked.left-0` … `ASSIGN t5 stop locked.right-2 -> off.left-0` equals the DOM row by row. `DUPLICATE (node, handle, role): [] max index: 2`. Control: `CONTROL hole: freeHandleIndex(off,left,target) = 1 (left-1 is taken; first free is 0)`; `CAP fifth edge: … right-4/left-4`.
- **Crops** (light, `sips -Z 600`): `frontend/scripts/smoke/_tmp_irports_shots/before_derived_rest_600.png`, `before_derived_hover_off_600.png`. Zooms: `before_zoom_locked.png` (6×), `before_zoom_off_rest.png`, `before_zoom_off_hover.png`.

## 3. The grey dot [M]
- At rest, the only handle within 14 px of the end of `stop` is `off.left-0/target` (`mm-anchor mm-anchor--connected`), at `opacity 0`. With the mouse on `off` the same element is at `opacity 1`, centre (1091, 162). The arrow tip is at (1087, 158.1). `elementsFromPoint` at the tip: `circle.react-flow__edgeupdater`, then the edge path, then the pane. No other painted element is there.
- CSS [R]: `.mm-anchor.mm-anchor--connected { … opacity: 0 !important;` (`EditorV2.scss:1708`), revealed by `.react-flow__node:hover .mm-anchor.mm-anchor--connected,` (`:1718`); fill `background: var(--anchor-bg) !important;` (`:1699`).
- Offset [R]: `const SNAP = 8;` (`edgeUtils.ts:150`); `if (Math.abs(ty - sy) < snap) { const avgY = (sy + ty) / 2; return [{ x: sx, y: avgY }, { x: tx, y: avgY }];` (`edgeUtils.ts:222-224`). The RF ends of `stop` are y 63.2 and 71.0 (flow), a gap of 7.8 px, so the line is drawn at 67.1 (screen 158.1): 3.9 px above `off.left-0` and 3.9 px below `locked.right-2`.

## 4. The self-loop [R, M]
- `const loop = computeSelfLoopCornerPath(rect, ordinal);` (`UnifiedEdge.tsx:374`), on `const rect = getNodeRect(node);`. `const SELF_LOOP_CORNER_ORDER: SelfLoopCorner[] = ['TR', 'BR', 'BL', 'TL'];` (`edgeUtils.ts:781`). The handles do not enter the path.
- `if (Math.abs(dx) >= Math.abs(dy)) { sourceSide = dx >= 0 ? 'right' : 'left'; targetSide = dx >= 0 ? 'left' : 'right';` (`irEdgeViews.ts:104-106`). With dx = dy = 0 a self-loop gets right → left, and both handles enter `computeSidePositions`: `ordered.forEach((e, k) => result.set(key(e), (k + 1) / (N + 1)));` (`handlePosition.ts:248`).

## 5. Layer Impact Report
Not produced: no diff was written. The follow-up slice owes one: `irEdgeViews.ts` (§3.1), Canvas v2-flow only, no D-layer, JjOM, sync or persistence change. Invariants: R-IRN-32 (no migration), the four demo scenes pixel-identical where the default notation is not the target.

## 6. Files read
`CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md` P16; `docs/decisions.md` RC-20..RC-34, R-IRN-32/33, R-VP-15..18; discovery `ee7206d0c` whole. `irEdgeViews.ts` whole; `irContainment.ts:250-340`; `DynamicHandles.tsx:84-418`; `handlePosition.ts:100-270`; `EditorV2.scss:1660-1760`; `edgeUtils.ts:150-226, 781-820`; `UnifiedEdge.tsx:355-380`; `utils/deriveViewpoint.ts`; `utils/lastViewpoint.ts:49-70`; `SimRolesModal.tsx:480-495`; `ir.test.ts:880-1010`; `@xyflow/system` 0.0.76 `getEdgePosition` and `getHandle`; the probe kit (`_tmp_input_common.ts`, `_tmp_input_scenario.js`, `trunk_readings_2026-09-29b.txt`).
