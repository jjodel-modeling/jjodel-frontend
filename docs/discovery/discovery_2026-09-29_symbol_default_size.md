# Discovery 2026-09-29 — Symbol Editor, Sizing: a default width and height for the instances of a view

Prompt-ID: P-2026-09-29-1230 (Phase 1, read-only) · prompt `docs/prompts/claude_2026-09-29_1230_prompt_symbol_default_size.md`
Session: `511097c1-71d8-41ae-a1e9-cd31346b2e40` · tree `~/jjodel-w-symsize`, branch `symbol-default-size`, HEAD `61e601236`
Model: Anthropic Claude Opus 5.5 · Tags: [M] measured in this phase, [R] read. A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

- **Recommended: (b) derivation.** A vertex with **no manual size under the layout in force** renders at the view's `defaultSize` instead of the content-derived box; a missing axis stays derived. Session-only write on the React Flow node, the same channel the content derivation already uses. No D-layer write, no critical-zone file.
- **(a) creation-time seed needs the critical zone.** Every object-creation gesture of editor-v2 reaches `createVertexForObject` (`canvasToJjom.ts:1340`), and objects created elsewhere (JjScript, tree, JjTL) get their vertex from `useJjomSync.ts:753`. Seeding at a single point means editing one of those two files; seeding at the 4 `syncCreateObject` sites in `EditorV2.tsx` plus `createAdapter.ts:465` misses the second group and is still a `SetFieldAction` write near sync (LIR, §3.2). Under RC-26 that is Alfonso's, so (a) is parked unless he picks it.
- **Semantic difference, stated plainly.** Under (b) the default also applies to existing instances that nobody resized by hand. Nothing is rewritten in the D-layer, but they redraw at the default size, and changing the default later moves them again. That is how every other view property already behaves (fill, border). Under (a) the size is fixed at birth, and «Reset size» goes back to the content size, not to the default. (b) gives «Reset size», «Propagate size» (unchanged) and the manual-wins rule of slice 1c a consistent meaning. The legacy engine already reads the view's `defaultVSize` as a fallback when a vertex has no size of its own (`GraphDataElements.tsx:568-571`).
- **Correction to the prompt's clamp.** `minBoxWidth`/`minBoxHeight` are floors for the content derivation (rect 140×40), and `.mm-node.ir-sized` neutralizes them for any explicit size (`irStyle.ts:145`). The floor for an explicit size is `SHAPE_MIN_SIZE` = 24, the NodeResizer floor (`ObjectNode.tsx:925-926`). **Recommended:** clamp the default at render to 24 per axis, and square it on `keepAspectRatio` forms (circle), as a manual resize does. `irValidate` rejects non-finite values and values ≤ 0, and does not clamp: the form can be Conditional per instance, so no single minimum exists at authoring time.
- **IR field.** `defaultSize?: { width?: number; height?: number }` on `VertexViewIR` [M: `grep defaultSize` in `frontend/src` hits only `JodieWindow.tsx` and a comment in `GraphDataElements.tsx`; positive control `resizable` hits `irTypes.ts:472`]. The axes are optional because the prompt allows one set and one empty. When both are empty the key is dropped (rest/spread, the `omitForm` idiom), so the IR round-trips byte-identical. `irHash` is `JSON.stringify(ir)` (`irCompile.ts:319-320`), so the edit recompiles without other wiring.
- **A gap Phase 2 has to close.** When the hook goes inactive it only resets its own refs (`useContentSize.ts`: `if (!active) { written.current = null; … return; }`). If the author clears the default, non-resized nodes keep the default size for the session. Fix: on deactivation, drop the session width/height only when the last write came from a default and `isResized` is false. The existing supplement-shape path stays as it is.

**Phase 2 files (b), 8 source files plus tests, over the rule-19 threshold of 5, listed here for the GO:**
1. `viewpoint/ir/irTypes.ts`: one optional field.
2. `viewpoint/ir/irValidate.ts`: numeric rule, same pattern as `cornerRadius`.
3. `viewpoint/authoring/VertexAuthoringPanel.tsx`: Width and Height on one row, `Input type="number"`, empty means unset, `patch({ ...draft, … })`.
4. `nodes/nodeSizing.ts`: pure `defaultBoxFor(defaultSize, derived, keepAspect)` with the 24 floor.
5. `viewpoint/ir/useContentSize.ts`: active when a supplement or a default applies, minus a manual size; the deactivation clear.
6. `viewpoint/ir/IRNodeContent.tsx`: passes `compiled.ir.defaultSize` (one line).
7. `viewpoint/authoring/SymbolBoxPreview.tsx`: `captionForBox` gains a `'default'` source.
8. `viewpoint/authoring/SymbolEditorModal.tsx`: picks `'default'` when an instance is not manual and the view has a default. Today it would say «derived from ink (D8)», which is false.

Tests: `ir/__tests__/irValidate.test.ts` (unset, both, one, ≤0/NaN/string rejected), `ir/__tests__/ir.test.ts` (round-trip and key drop), new `nodes/__tests__/nodeSizing.test.ts` (who owns the size: manual kept, default applied, one axis derived, below-24 clamp, circle squared), `authoring/__tests__/symbolBoxPreview.test.ts` (caption).
Gates: typecheck baseline **14** [M: `npm run typecheck`, EXIT=2, the 14 of CLAUDE.md §17 by file and code], build, vitest on the touched files.

**Decisions taken (unattended):** (b) over (a); the 24 floor instead of minBox; `width`/`height` optional per axis; the caption word `default`.
**Decisions awaiting Alfonso:** only if he wants (a), the creation-time seed: a critical-zone edit (`canvasToJjom.ts` or `useJjomSync.ts`) with a Layer Impact Report (RC-26).

Recommended: implement (b), derivation with the 24-px floor, on the 8 files above.

## 1. Hypotheses under test

1. *A creation-time seed can be done without the critical zone.* **Partly falsified.** [R] Object creation in editor-v2 goes through `syncCreateObject` → `createVertexForObject` (`canvasToJjom.ts:1385-1419`, `:1340-1350`) at `EditorV2.tsx:798` (singleton fallback), `:1965` (object-as-edge), `:2219` (palette drop), `:2899` (containment drop), and through `createAdapter.ts:465` (form/data manager). Objects created outside the canvas get their vertex in `useJjomSync.ts:753`, `const dv = DVertex.new(0, objId, graphId, graphId, undefined, size);`. The single chokepoint is critical zone. The non-critical alternative covers 5 sites and still misses the `useJjomSync` group.
2. *A seeded size needs `isResized`.* **Holds.** [R] `jjomTransformers.ts:79`, `if (!eff.isResized) return {};`. A seed w/h alone (`createVertexForObject` already passes 200×80) is ignored. The seed would have to raise the flag, which makes a fresh instance read as «manual size» (`SymbolEditorModal.tsx:313-317`) and sends «Reset size» back to the content size.
3. *The derivation can host a default without a D-layer write.* **Holds.** [R] `useContentSize.ts:83-92`: «The size is written in session only … Nothing reaches the D-layer». `useContentSize.ts:116`: `const active = hasSizeSupplement(desc) && !isResized;`. The manual size is read per layout (slice 1c, `:96-103`), so «manual wins» carries over unchanged. On a non-supplement form a session width/height raises `ir-sized` (`ObjectNode.tsx:102-105`), and `.mm-node.ir-sized { min-width: 0; min-height: 0; width: 100%; height: 100%; }` (`irStyle.ts:145`) makes the box fill it. Rect works without CSS changes.
4. *«Propagate size» keeps working.* **Holds under (b).** [R] `EditorV2.tsx:1146-1150` writes top-level width/height and `syncSizeBatchToJjom`, which raises `isResized` (`canvasToJjom.ts:156-163`), so the derivation switches off for those vertices exactly as today.
5. *minBox is the right clamp.* **Falsified**, see §0. [R] `shapeRegistry.ts:273`, `const BOX_SIZING: ShapeSizing = { heightFactor: 1, minBoxWidth: 140, minBoxHeight: 40, minAspect: 0 };`, documented as «Reproduces the CSS content-hug floor» (`:90`). `ObjectNode.tsx:925-926`, `minWidth={SHAPE_MIN_SIZE}` / `minHeight={SHAPE_MIN_SIZE}`.

## 2. Files read

`frontend/src/components/editor-v2/`: `viewpoint/authoring/VertexAuthoringPanel.tsx` (380-460, 840-890), `SymbolEditorModal.tsx` (grep windows), `SymbolBoxPreview.tsx:68-71`, `useCanvasNodeBox.ts` (whole); `viewpoint/ir/irTypes.ts` (440-500), `irValidate.ts` (whole), `irCreationSeed.ts` (1-80: it seeds *views*, not instances, so not a creation hook for vertices), `irCompile.ts:319-329`, `shapeRegistry.ts` (75-100, 265-300, 600-640, 800-840), `useContentSize.ts` (whole), `irStyle.ts` (120-175), `IRNodeContent.tsx` (195-235); `nodes/nodeSizing.ts` (whole), `nodes/ObjectNode.tsx` (85-135, 880-945); `EditorV2.tsx` (770-830, 1100-1155, 2143-2270); `sync/canvasToJjom.ts` (100-175, 1334-1422 via grep); `utils/jjomTransformers.ts` (50-140); `viewpoint/layout/vertexLayout.ts` (1-120); `hooks/useJjomSync.ts` (grep only). Legacy: `joiner/classes.ts:1373-1405`, `model/dataStructure/GraphDataElements.tsx:568-571` (grep windows). Docs: `docs/handoff/decisions-symbol-editor-1b.md` (2f Sizing, 275-345).

## 3. Risks

- Content overflow: a default smaller than the ink clips as a manual resize does today. That is accepted as the same behaviour.
- The D-layer w/h of non-resized vertices stay at the seed (200×80), as they already do for content-derived shapes, so nothing new reaches edge geometry.
- The `sizing` nav badge and `StructureGroups` are not affected [R: the section is a `FormSection` with a Toggle and a Button only].

## 4. Questions

1. (b) derivation or (a) creation seed? Recommended: (b). Choosing (a) goes to Alfonso (critical zone).
2. Floor 24 (explicit-size floor) or minBox (derivation floor)? Recommended: 24.
