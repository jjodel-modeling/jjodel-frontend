# Discovery: the selection outline missing on IR-rendered nodes (P-2026-09-30-1808, Phase 1)

**Prompt-ID**: P-2026-09-30-1808. **Prompt**: `docs/prompts/claude_2026-09-30_1808_prompt_selection_outline.md`.
**Chat**: C-2026-09-30-1806. **Session**: `ad97f31c-0c23-4b56-a13e-fe882e2a0d07`. **Tree**: `~/jjodel-w-selring`,
branch `selection-outline`, HEAD `c4846df0e` (trunk `c1e0376dc` plus the prompt). **Model**: Claude Opus 5.5.

A set of hypotheses with evidence, not a reference. Line numbers are those of `c4846df0e`. **measured** = a run of this
phase (probe `frontend/scripts/smoke/_tmp_selring_probe.ts`, gitignored, run by `lane-run probe` on 3083, light theme,
DPR 2, log `~/.jjodel-lanes/P-2026-09-30-1808/probe-_tmp_selring_probe.log`, 14/14 checks, `EXIT=0`); **read** = a file read.

## 0. Answer in brief

- **Root cause**: the ring is there but it gets clipped. On a selected IR node the ring and band sit on the shape
  `.ir-node-content` (`viewpoint/ir/irStyle.ts:149`), 0 to 5 px outside its border box. The shape fills the node
  wrapper `.mm-node.mm-object`, and the wrapper clips: `overflow: hidden` (`nodes/instanceNode.scss:27`), a rule
  written to clip the instance card's accent bar, which the IR branch never mounts. Every ring pixel falls outside the
  wrapper's padding box. What survives is a sliver of band at the four corners, where the shape's 10 px radius leaves
  a gap inside the wrapper's 7 px inner clip radius (8 px radius, `instanceNode.scss:28`, minus the 1 px border).
  That sliver is the "faint light blue halo" in the screenshot.
- **Measured** on DemoFlowB `work` in the derived flowchart viewpoint: the computed style of `.ir-node-content` when
  selected is `solid 2px rgba(56, 189, 248, 0.55) off 3px` plus the band `rgba(56, 189, 248, 0.22) 0 0 0 3px`. The
  pixel column above the top edge (css rows 14-23 of the clip) reads `241,245,249` (the canvas) both idle and
  selected. Idle vs selected clip: 432 changed pixels outside the box, all of them the anchor handles and the corner
  slivers. On the native class card `State` the same tokens paint 18021 pixels outside the box.
- **Selection is propagated**: the RF wrapper and `.mm-node` both carry `.selected` (measured). No specificity loss:
  the ring is the computed value on the painted element.
- **The #0ea5e9 premise does not hold for native nodes.** Measured: a selected native class card paints
  `rgba(56, 189, 248, 0.55)` (`_themes.scss:308`, calibrated on screen 2026-08-26 in `ad92b6666`), composited
  `rgb(139, 214, 247)`. A selected native object card paints a `rgb(8, 145, 178)` border with a
  `rgba(6, 182, 212, 0.18)` band (`instanceNode.scss:670-681`). `#0ea5e9` is used for edge selection, `sim-active` and
  the problem highlight, not for a selected node.
- **Smallest fix**: one rule in `nodes/instanceNode.scss`, inside `.mm-node.mm-object`:
  `&.selected:has(> .ir-node-content) { overflow: visible; }` at (0,4,0). It applies only while the node is selected,
  so the idle look stays byte-identical. Native cards have no `.ir-node-content` child, so the selector never matches
  them. The default viewpoint has no IR nodes and does not change. No new class or identifier. Not a critical-zone
  file.
- **Decisions awaiting Alfonso**: none for this fix. Question 1 names the one that would be his: moving the selection
  token to `#0ea5e9`, which would change every native selection.

Questions:
1. Should the IR ring take the native class card's colour (`--node-selection-stroke`) instead of `#0ea5e9`?
   Recommended: yes, keep the calibrated token so IR and native match. A move to `#0ea5e9` is Alfonso's call, in a
   separate lane.
2. With no native node at `#0ea5e9`, what does the visual gate measure? Recommended: the computed ring on the IR shape
   equals the native class card's (`rgba(56, 189, 248, 0.55)`), the ring pixels paint, and the box moves 0 px.
3. The drop-target outline on IR nodes (`irStyle.ts:165`) is clipped the same way. Recommended: record it as a ticket,
   not in this lane.
4. Which file gets the rule, `instanceNode.scss` or `irStyle.ts` `BASE_CSS`? Recommended: `instanceNode.scss`, where
   the clip is declared, which is outside the §3.1 table.

## 1. Hypotheses under test

| # | Hypothesis (from the prompt) | Verdict | Evidence |
|---|---|---|---|
| H1 | The selection state is not propagated to IR-rendered nodes | falsified | measured: `selectedRF: true, cardSelected: true` on `work` (derived); read: `ObjectNode.tsx:928` emits `selected` on the IR wrapper |
| H2 | The IR renderer paints its own border on an inner element that covers or replaces the wrapper outline | partly | read: the wrapper outline is switched off on purpose (`irStyle.ts:71`) and the ring moved to the shape (`irStyle.ts:149`). Nothing covers it: it is clipped (H3) |
| H3 | The selected class sits on a wrapper that clips (`overflow: hidden`) | holds, one level down | measured: `clipChain` `mm-node.mm-object.selected:hidden`, pixels above the edge = canvas; read: `instanceNode.scss:27` |
| H4 | A specificity override from the IR shape's inline style | falsified | measured: the computed outline and box-shadow on `.ir-node-content` are the selection values; the inline style carries fill and border only |
| H5 | A selected native node shows `#0ea5e9` (acceptance criterion of the prompt) | falsified | measured: class card `rgba(56, 189, 248, 0.55)`, object card border `rgb(8, 145, 178)` (§0) |

## 2. Files read

- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (lines 880-975, IR branch; 1225, native branch)
- `frontend/src/components/editor-v2/nodes/instanceNode.scss` (whole)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (whole)
- `frontend/src/components/editor-v2/EditorV2.scss` (1640-1700, 1820-1870, 2160-2400, 2700-2780)
- `frontend/src/components/editor-v2/_themes.scss` (1-20, 140-152, 290-312, 339-365)
- `frontend/src/styles/tokens/_colors-light.scss` (480-492), `_colors-dark.scss` (375-378)
- `frontend/src/components/editor-v2/problems/NodeProblemIndicator.scss` (90-99), `sim/simulation-panel.scss` (975-983)
- `frontend/src/components/editor-v2/nodes/__tests__/irCollapsedRender.test.ts` (whole: the bench for §6)
- `docs/log-inbox/symbol-editor.md` (18-48: the ticket of P-2026-09-29-1245, §5)
- history: `git log -S'node-selection-stroke'`, commits `e3d05c4a5`, `5b6ab5604`, `e8d554b9a`, `ad92b6666`, `a0c005ae4`

## 3. The selection path

### 3.1 Native nodes (read, then measured)

- Class card: `EditorV2.scss:1843-1847`, on the element that carries the shape:
  `&.selected { outline: 2px solid var(--node-selection-stroke); outline-offset: 3px; box-shadow: 0 0 0 3px var(--node-selection-halo), ... }`.
  `.mm-node` sets no overflow (`EditorV2.scss:1832`, `// overflow: hidden;` commented out), so nothing clips it.
  Measured `State`: ring on css rows 19-20 above the edge, `139,214,247`; band on rows 21-23, `197,231,246`.
- Object card (default viewpoint): `instanceNode.scss:670-681`, "Selection — the cyan rule":
  `&.selected { outline: none; border-color: var(--color-inode-selected-border); box-shadow: 0 0 0 3px var(--color-inode-selected-ring), ... }`.
  The box-shadow belongs to the wrapper, and an element's `overflow` does not clip its own shadow. Measured `work`
  (default): border `8,145,178`, band `198,233,242`.
- Light tokens (`_themes.scss:308-309`): `'node-selection-stroke': rgba(56, 189, 248, 0.55)`,
  `'node-selection-halo': rgba(56, 189, 248, 0.22)`. The comment above them: "Lo stroke e' translucido, non pieno ...
  tarati a schermo (2026-08-26)".

### 3.2 IR-rendered nodes (read, then measured)

- The IR branch renders through ObjectNode, so the wrapper is the instance card's (`ObjectNode.tsx:928`):
  ``className={`mm-node mm-object ${selected ? 'selected' : ''}... ir-view-${...}`}``, with `<IRNodeContent>` as a
  direct child that paints the shape.
- `irStyle.ts:65` and `:71` neutralize the wrapper: `.mm-node.selected:has(> .ir-node-content) { border-color: transparent; outline: none; box-shadow: none; }`.
  The comment at `:66-70` says why: "Il wrapper non porta nulla della selezione: anello e banda stanno sulla forma".
- `irStyle.ts:149`: `.mm-node.selected > .ir-node-content { outline: 2px solid var(--node-selection-stroke); outline-offset: 3px; box-shadow: 0 0 0 3px var(--node-selection-halo), 0 1px 3px var(--node-shadow), 0 4px 12px ...; }`.
  These are the same tokens and the same geometry as the class card.
- `instanceNode.scss:22-27`: `.mm-node.mm-object { // The accent bar is the first flex child; \`overflow: hidden\` is what clips it to the node's radius. ... overflow: hidden;`
  and `:28` `border-radius: 8px;`. The IR branch mounts no `.mm-object__accent` (`grep -c accent` over `ObjectNode.tsx:926-975`: 0; positive
  control, the same count over the whole file: 6).
- `irStyle.ts:73`: `.ir-node-content { ... border-radius: 4px; box-shadow: 0 1px 3px ..., 0 4px 12px ...; overflow: hidden; }`,
  `:83` `.ir-node-content.ir-shape--rounded { border-radius: 10px; }`. Measured box: wrapper 200x42, shape 198x40
  (inset by the 1 px transparent border), so the shape fills the wrapper's padding box exactly.
- Precedent for lifting the same clip: `irStyle.ts:214` (bar, `overflow: visible`) and `:229` (outside label), both
  scoped with `:has`.

### 3.3 Root cause, one line

`instanceNode.scss:27` (`overflow: hidden` on `.mm-node.mm-object`) clips the ring and band that `irStyle.ts:149`
draws outside `.ir-node-content`, which fills that wrapper.

## 4. The smallest fix and what else moves

Rule, in `nodes/instanceNode.scss` inside `.mm-node.mm-object`, next to the clip's reason:

```scss
&.selected:has(> .ir-node-content) { overflow: visible; }
```

Specificity (0,4,0) against the clip's (0,2,0): it wins whatever the bundle order.

What moves on a **selected** IR node, and only there:
- the ring and the band of `irStyle.ts:149`, which is the intended look;
- the shape's resting drop shadows, which `irStyle.ts:149` repeats on purpose ("Le ombre di riposo vanno ripetute qui");
- the corners of a `rect` shape (4 px radius), which the 7 px inner clip of the wrapper currently rounds off: selected,
  they show at 4 px, the radius the ring follows;
- on SVG-painted forms, the outer half of `.ir-sel-ring` / `.ir-sel-band` (`irStyle.ts:151-164`), which the wrapper
  currently cuts where the silhouette touches the box.

What does not move:
- the box. `overflow` does not size a block flex container. The wrapper has no `position`, so the anchors and the
  resizer take `.react-flow__node` as their containing block and were never clipped: the right-side handles already
  paint beyond the box in the idle crop (measured). The Phase 2 probe measures 0 px.
- idle IR nodes. The selector requires `.selected`.
- native cards and the default viewpoint. They have no `.ir-node-content` child.
- the outside-label and bar nodes. They are already `overflow: visible`.

Rejected:
- lifting the clip on every IR node: the idle look changes (resting shadows and rect corners);
- moving the ring back to the wrapper: it would lose the silhouette radius, which `e3d05c4a5` and `5b6ab5604` moved
  it off the wrapper to get;
- an inset ring: it would not match the native look;
- `overflow-clip-margin`: the idle shadow would show inside the margin;
- the same rule in `irStyle.ts` `BASE_CSS`: it works the same way, but the file sits under `viewpoint/ir/`, in the
  §3.1 table, and the fix does not need it.

## 5. Prior art

`docs/log-inbox/symbol-editor.md`, ticket of 2026-09-29 (P-2026-09-29-1245): "in a headless probe with the real
`BASE_CSS` and `instanceNode.scss`, the pixel 4px outside a selected IR rect is white under `.mm-node.mm-object
{ overflow: hidden }` and the ring colour once the wrapper is lifted. Not yet confirmed in the live app." This phase
confirms it in the live app (§0). The Phase 2 entry closes that ticket.

## 6. Phase 2 plan (fast lane, ≤ 3 files under `editor-v2/`)

1. Test first: `nodes/__tests__/irSelectionRing.test.ts` (new), on the bench of `irCollapsedRender.test.ts`.
   ObjectNode's IR branch is rendered to markup; the real stylesheets are compiled with `sass` (a dependency already
   in `package.json`, no new entry): `EditorV2.scss`, `instanceNode.scss`, `_colors-light.scss`, plus `BASE_CSS` as
   `irStyle.ts` injects it; headless Chromium lays it out. Assertions on the pixel 4 px outside the shape: a selected
   IR rounded node shows the ring (red before the fix); an unselected IR node shows the canvas; a selected native
   object card keeps its border and band (control); the box is equal selected and idle. Mutation bench in the commit.
2. The rule in `instanceNode.scss`.
3. Gates, probe `after` (the unselected panes 0 px from `before`, the IR ring painted, the box 0 px), crops.

## 7. Dependencies and risks

- `viewpoint-notations` (P-2026-09-30-1720, unmerged) touches `nodeSizing.ts` and `markerRegistry.ts`, not these files.
- Dark theme: the same tokens (`_themes.scss:148-149`) and the same clip, so the same fix applies. The gate runs in
  light, as the prompt asks.
- Stacking: once lifted, a selected node's ring can overlap a neighbour closer than 5 px, as the class card's ring
  already does.

## Addendum 2026-09-30, Phase 2 (`27a6b2d69`)

- **Question 3 corrected.** Its premise is false. Only `ClassNode.tsx:478` and `EnumNode.tsx:154` emit `drop-target`
  (`grep -rn "drop-target"` over `src` `*.ts`/`*.tsx`, tests excluded; positive control: the same search finds those
  two sites and the three lines of `irStyle.ts`). The IR branch of ObjectNode never emits it, so
  `.mm-node.drop-target > .ir-node-content` (`irStyle.ts:165`) never applies on the canvas and nothing there gets
  clipped. It is recorded as a paragraph of the log entry, not as a ticket, and the rule stays (Rule 9).
- **Questions 1, 2 and 4** were taken with their `Recommended:` lines, unattended (RC-21). The fix is the §4 rule in
  `instanceNode.scss`, unchanged.
- **Measured after the fix** (probe `after` on 3083, 24/24): on `work` and `d1`, the computed ring and band on the IR
  shape equal the native class card's (`solid 2px rgba(56, 189, 248, 0.55) off 3px`, `rgba(56, 189, 248, 0.22) 0px 0px
  0px 3px`). The painted ring pixels, css rows 19-20 above the top edge, read `139,214,248`, against the class card's
  `139,214,247` / `138,213,247`. Idle-to-selected changed pixels outside the box: `work` 432 → 18604, `d1` 432 → 10020
  (`d1` ends at the canvas's right edge at this zoom, as the pane crop `sr_after_derived_flowB_work_pane_selected_600.png`
  shows, so the right half of its ring falls outside the clip: corners `tr` and `br` count 0). Node box 0 px on all
  four scenes. The four unselected panes are 0 px from the `before` run.
- A difference that stays, by design of `irStyle.ts:149`: when selected, the IR shape keeps its resting shadows
  (`0 1px 3px`, `0 4px 12px`), while the class card switches to `0 4px 16px`. The ring and the band are the same.
