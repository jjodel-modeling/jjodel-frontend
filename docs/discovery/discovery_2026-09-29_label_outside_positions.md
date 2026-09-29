# Discovery 2026-09-29 — vertex labels outside the symbol box (above, below, left, right)

Prompt-ID: P-2026-09-29-1245 (Phase 1, read-only) · prompt `docs/prompts/claude_2026-09-29_1245_prompt_label_outside_positions.md`
Session: `f4a7ce06-b720-42ee-af1f-8c7c121ea8c0` · tree `~/jjodel-w-labelout`, branch `label-outside-pos`, HEAD `62a3b8e79`
Model: Anthropic Claude Opus 5.5 · Tags: [M] measured in this phase, [R] read. A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

- **Today: four positions, all inside the box.** `LabelPosition = 'top' | 'center' | 'inside' | 'bottom'` (`irTypes.ts:58`), the only select that writes it offers Top, Center, Inside, Bottom (`LabelEntryEditor.tsx:7-12`). All four are in-flow flex children of `.ir-node-content`, ordered by `order` (top 0, center 1, inside 2, compartments 3, bottom 4, `irStyle.ts:34-37`, `:53`). There is no left or right: `inside` is the left-aligned body line (`text-align: left`, `irStyle.ts:36`), which is probably the «left» of Alfonso's list. Other position lists exist but are not vertex labels: Structure `name.position` (`header-band | center | below | external`, `irTypes.ts:419`) is authored and read by no renderer [M: grep], the Data Manager form's Above/Left (`FormAuthoringBody.tsx:84-87`), the edge label's auto/above/below.
- **Correction to the proposed values.** R-VP-15 (1), ratified by Alfonso today, already fixed the persisted name of an outside label: «`LabelPosition 'outside'` with `LabelSpec.anchor` (Place `nw`, Transition `e`)» (`decisions.md:4180`). R-VP-16 dropped that lane's implementation, not the name, and reuses another name of the same list (`bar`, `decisions.md:4194`). No code carries either yet [M: grep exit 1]. **Recommended:** `LabelPosition` gains `'outside'`, `LabelSpec.anchor?: LabelAnchor` with `LabelAnchor = 'n' | 'e' | 's' | 'w'`, absent = `'s'` (below). The four flat `'outside-*'` values would amend a ratified R- row (RC-26).
- **Render strategy A, measured.** The outside label stays a child of `.ir-node-content`, `position: absolute`, 8 px from the side, centred on it. Two scoped lifts: `.ir-node-content:has(> .ir-label--outside)` and `.mm-node:has(> .ir-node-content > .ir-label--outside)` get `overflow: visible` (the bar precedent, `irStyle.ts:212-215`). Headless Chromium with the real `BASE_CSS` and the compiled `instanceNode.scss` [M, §3]: gap 8, centre offset 0, the intrinsic size read like `measureIntrinsic` is 28×17 with or without the label, the RF node size is unchanged (200×40), visible under `hl-dimmed`, and the rules win on diamond (0,4,0) and bar (0,3,0). Controls: without the lifts, and with only the inner lift, the label reads clipped.
- **Why not a sibling.** A sibling of `.ir-node-content` escapes the wrapper clip only while `.react-flow__node` is its containing block. Under `.hl-dimmed` (`filter`, `EditorV2.scss:4441-4445`) the wrapper becomes that block and the label is clipped [M]. A sibling of the wrapper (the `SimNodeRunState` pattern the Petri discovery proposed) would not dim with its node [R].
- **What clips today:** `.ir-node-content { overflow: hidden }` (`irStyle.ts:73`) and `.mm-node.mm-object { overflow: hidden }` (`instanceNode.scss:27`), two clips, as the Petri discovery also found. **Cost of lifting them:** only on views with an outside label, in-box content that overflows the box is no longer clipped (rows of an undersized box, a compartment separator past an ellipse's curve). This is a declared limit.
- **Box, edges, layout, export.** The size derivation ignores the label without any code change (absolute boxes do not enter `max-content`). Selection ring, resize handles and edge handles follow the box [M: RF size unchanged; R: `irStyle.ts:149`]. No ELK or routing reservation: ELK spacing is 100/120 px (`elkLayout.ts:57`), so a ticket is filed only if overlaps show. Export is an `html-to-image` DOM snapshot (`CanvasExportService.ts:6`, `:183-186`), so the label is exported like any node text [R].
- **Old IR byte-identical.** Nothing new matches without `'outside'`. The CSS is append-only after today's 17954 characters (sha16 `063ce686b2d24781` [M]). An older build renders an outside label in flow inside the box [M: probe case 1], and its `validateIR` has no label rule (`irValidate.ts`, whole) [R].
- **Previews.** Both previews ignore the position today. `SymbolBoxPreview` hardcodes `ir-label--center` (`SymbolBoxPreview.tsx:206`), and the fallback preview label is an absolute centred overlay (`SymbolEditorModal.scss:487-500`). Phase 2 feeds them `ir.shape.labels[0]`'s position and anchor, and lays an outside label in flow beside the stage so that it reserves its room.
- **Overlap with lane P-2026-09-29-1230** (commit `34c0ac422` on `symbol-default-size`): `irTypes.ts`, `irValidate.ts`, `IRNodeContent.tsx`, `SymbolBoxPreview.tsx`, `SymbolEditorModal.tsx`, plus tests `irValidate.test.ts`, `ir.test.ts` and `symbolBoxPreview.test.ts`. Not `useContentSize.ts`, which this lane does not need.
- **A test that must change.** `shapeRegistry.test.ts:803-812` asserts that every rule after the pre-bar prefix contains `ir-shape--bar`, so appending rules turns it red. Phase 2 bounds it to the bar's section (16743 to 17954).

**Decisions taken (unattended):** the R-VP-15 name (`'outside'` + `anchor`), four cardinal anchors (diagonals such as the Place's `nw` are an additive widening, ticket); strategy A; no layout reservation; the label inherits the node's 13 px (tokens 2026-08-25), regular weight, a halo in the canvas colour (the 11 px rule is for the select); an authoring-time vocabulary in `validateIR` (R-B9-bis), a permissive render (an unknown anchor draws `'s'`); presets untouched (`SymbolPreset.values` has no label axis, `notationCatalog.ts:63-113`); `name.position` left unwired.
**Decisions awaiting Alfonso:** none on the recommended path. Only if he wants the flat `'outside-top|bottom|left|right'` values: that is an amendment of ratified R-VP-15 (1) (RC-26). RC-27 applies to the data-model choice: the chat's `Verified:` line.

**Phase 2 files (rule 19: 9 source files plus 5 tests, listed for the GO).** Source, all under `frontend/src/components/editor-v2/viewpoint/`:
1. `ir/irTypes.ts` — `'outside'`, `LabelAnchor`, `LabelSpec.anchor?`, `CompiledLabel.anchor?`.
2. `ir/irCompile.ts` — resolve the anchor (absent or unknown gives `'s'`).
3. `ir/irValidate.ts` — `VALID_LABEL_POSITIONS`, `VALID_LABEL_ANCHORS`, the rule on `shape.labels[i]`.
4. `ir/IRNodeContent.tsx` — `ir-label--anchor-<a>` on the outside span and its input.
5. `ir/irStyle.ts` — the appended rules of §3.
6. `authoring/LabelEntryEditor.tsx` — «Inside» and «Outside» `<optgroup>`s (`Select` supports them, `Select.tsx:21-27`) and a pure mapper; «Below» writes no anchor, an inside choice drops it.
7. `authoring/SymbolBoxPreview.tsx` — the position and anchor props.
8. `authoring/SymbolEditorModal.tsx` — pass `labels[0]`.
9. `authoring/SymbolEditorModal.scss` — the tile and fallback outside layout.

Tests: `ir/__tests__/irValidate.test.ts` (the old four accepted, `'outside'` with each anchor accepted, an unknown position or anchor rejected), `ir/__tests__/ir.test.ts` (compile per position and anchor, round-trip), `ir/__tests__/shapeRegistry.test.ts` (the bar check bounded; the new rules, the lifts and an append-only prefix, with a mutation bench on each lift), `authoring/__tests__/labelEntryEditor.test.ts` (new: the mapper, both ways), `authoring/__tests__/symbolBoxPreview.test.ts` if a helper is extracted. The layout claim (size ignores the label) cannot run in jsdom; the probe of §3 is its evidence, re-run in Phase 2.

Recommended: implement `'outside'` + `anchor` (n/e/s/w) with strategy A on the 9 files above, after lane 1230's commits.

## 1. Hypotheses under test

1. *The label positions are top, bottom, center, left, right.* **Falsified** [R]. `export type LabelPosition = 'top' | 'center' | 'inside' | 'bottom';` (`irTypes.ts:58`); `{ value: 'inside', label: 'Inside' }` (`LabelEntryEditor.tsx:10`); `.ir-node-content .ir-label--inside { order: 2; text-align: left; padding: 0 var(--ir-pad-x); }` (`irStyle.ts:36`). The vocabulary has one copy only [M: `grep "'top' | 'center' | 'inside'"` over `frontend/src` gives one hit, `irTypes.ts:58`].
2. *The new values can be the four `'outside-*'` literals.* **Falsified as a free choice** [R]. `decisions.md:4179-4180`: «(1) The persisted names, permanent once saved (R-B9): `LabelPosition 'outside'` with `LabelSpec.anchor` (Place `nw`, Transition `e`)». R-VP-16 (`decisions.md:4186-4197`) drops «the planned outside label and serif of lane 2» and keeps using (1)'s names: «a `ShapeForm 'bar'` (the name of R-VP-15 (1) …)». [M] `grep -E "'outside'|anchor\??:|LabelAnchor|'serif'" irTypes.ts` exit 1, `grep anchor irTypes.ts` empty, while the same file answers `'inside'` at `:58`. [M] `grep -F` over `frontend/src` and `frontend/scripts` for `ir-label--outside`, `outside-top/bottom/left/right`, `VALID_LABEL_POSITIONS`, `isOutsideLabelPosition`: only this phase's probe, plus an «outside-click» comment (`TextStyleField.tsx:117`).
3. *An outside label can be excluded from the content-derived size without touching `useContentSize.ts`.* **Holds** [M §3]. `measureIntrinsic` sets `width/height: max-content` on `.ir-node-content` and reads `offsetWidth/offsetHeight` (`useContentSize.ts:52-73`). An absolutely positioned child does not enter it: intrinsic 28×17 with and without the label, 95×42 with today's in-flow bottom label.
4. *The label can escape the clip without lifting any overflow.* **Falsified** [M §3]: a child needs both lifts, and a sibling is clipped under `hl-dimmed`.
5. *Selection, resize handles and edges keep referring to the box.* **Holds** [M+R]. The RF node is 200×40 with or without the label (probe). The ring is `.mm-node.selected > .ir-node-content { outline … }` (`irStyle.ts:149`). The resizer controls are `position: absolute` children of the node (`@xyflow/react/dist/style.css`, `.react-flow__resize-control { position: absolute; }`).

## 2. Files read

`frontend/src/components/editor-v2/viewpoint/ir/`: `irTypes.ts` (40-130, 400-470, 790-840), `irStyle.ts` (1-260), `IRNodeContent.tsx` (1-120, 380-620), `useContentSize.ts` (whole), `irCompile.ts` (378-412), `irValidate.ts` (1-50, 95-200), `structureCapabilities.ts` (95-150), `notationCatalog.ts` (grep), `shapeRegistry.ts` (grep, 312), `__tests__/shapeRegistry.test.ts` (712-830). `viewpoint/authoring/`: `LabelEntryEditor.tsx` (whole), `SymbolBoxPreview.tsx` (60-214), `SymbolEditorModal.tsx` (300-400, 505-560), `SymbolEditorModal.scss` (440-610), `StructureGroups.tsx` (45-60), `__tests__/symbolBoxPreview.test.ts` (1-30). `nodes/ObjectNode.tsx` (92-130, 870-975), `nodes/instanceNode.scss` (1-60, 180-200, 655-700, 786-830), `EditorV2.scss` (1670-1700, 1825-1870, 2255-2290, 4440-4475), `utils/elkLayout.ts` (grep), `components/ui/Select/Select.tsx` (grep), `services/CanvasExportService.ts` (60-200), `@xyflow/react/dist/style.css` (parsed). Docs: `docs/decisions.md` (140-235, 400-435, 4160-4196), `docs/discovery/discovery_2026-09-29_petri_notation.md` (grep), lane 1230's discovery §0 on `symbol-default-size`.

## 3. Measurements (headless Chromium, Playwright 1.62.1, at `62a3b8e79`)

Probe `frontend/scripts/smoke/_tmp_labelout_probe.mjs` (gitignored): the real `BASE_CSS` extracted from `irStyle.ts`, `instanceNode.scss` compiled with sass, and the React Flow and `.mm-node` rules copied verbatim. DOM: `.react-flow__node > .mm-node.mm-object > .ir-node-content`. Visibility is `elementFromPoint` at the label's centre, which respects overflow clipping (hit-testing), with controls that must read false. Candidate rules: the two `:has` lifts, and four anchored rules at (0,4,0), `.ir-node-content > .ir-label.ir-label--outside.ir-label--outside-<side>` (Phase 2 spells the side as `ir-label--anchor-<a>`, same specificity), `top|bottom|left|right: calc(100% + 8px)`, centred by `translate(-50%)`.

| case | label pos / containing block | gap | centre Δ | intrinsic | RF node | visible |
|---|---|---|---|---|---|---|
| rect, no label | — | — | — | 28×17 | 200×40 | — |
| rect, today's in-flow `bottom` | relative / C | — | — | 95×42 | 200×42 | yes |
| outside class, no rules (older build) | relative / C (in flow) | — | — | 79×34 | 200×40 | yes |
| CONTROL rules, no lift | absolute / C | 8 | 0 | 28×17 | 200×40 | **no** |
| CONTROL rules, inner lift only | absolute / C | 8 | 0 | 28×17 | 200×40 | **no** |
| A: rules + both lifts | absolute / C | 8 | 0 | 28×17 | 200×40 | yes |
| A + `hl-dimmed` | absolute / C | 8 | 0 | 28×17 | 200×40 | yes |
| B: absolute sibling, no lift | absolute / RF | 8 | 0 | 28×17 | 200×40 | yes |
| B + `hl-dimmed` | absolute / **W** | 8 | 0 | 28×17 | 200×40 | **no** |
| A circle n / w / e | absolute / C | 8 / 8 / 8 | 0 on the other axis | 28×17 | 28×28 | yes |
| A diamond s, ellipse s | absolute / C | 8 | 0 | 28×17 | 28×17 | yes |
| A bar s / e | absolute / C (bar rule beaten) | 8 / 8 | 0 | 0×0 | 48×12 | yes |

Every label computed `font-size: 13px`, inherited. Injected CSS today [M, `_tmp_labelout_css_len.ts` via `npx tsx`]: 17954 characters, sha16 `063ce686b2d24781`. The first 16743 hash to `a2877becf5934b70`, the constant of `shapeRegistry.test.ts:805-806`, which serves as a positive control. Vitest baseline on `shapeRegistry`, `irValidate`, `ir` and `symbolBoxPreview` tests: 4 files, 225 passed, EXIT 0.

## 4. Risks and dependencies

- **Persisted vocabulary is permanent** (R-B9): `'outside'` and `n/e/s/w` cannot be renamed once saved. Diagonals are an additive widening later.
- **Inverse-coloured labels.** The derivation writes `style: { color: INVERSE_TEXT }` for solid fills (`viewpointDerivation.ts:282`). If such a label is moved outside, it is light text on the canvas. The author's style wins by design, and nothing overrides it.
- **Lifted inner clip** (§0): only on outside-label views; declared, not fixed.
- **Ticket candidate, pre-existing, probe-only:** the IR selection ring reads clipped by the wrapper today. The pixel at +4 px from a selected rect is white with `.mm-node.mm-object { overflow: hidden }` and the ring colour once the wrapper is lifted [M, `_tmp_labelout_ring.mjs`; not confirmed in the live app]. The probe's halo read is void, because its `box-shadow` list uses tokens the probe does not load. Consequence here: an outside-label node, whose wrapper is lifted, would show a fuller ring than its neighbours.
- **Merge order.** Phase 2 edits five files that lane 1230 also edits, so its base must contain `34c0ac422`.

## 5. Questions

1. Keep R-VP-15's `'outside'` + `anchor` rather than the four flat values? Recommended: yes, it is the ratified name.
2. Four anchors now, diagonals later? Recommended: yes, a ticket for `ne/nw/se/sw` (the Petri Place's `nw`).
3. File the ring-clip ticket? Recommended: yes, low, after a live-app check.
