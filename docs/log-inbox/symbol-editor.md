# log-inbox — lane «symbol-editor»

Entries written by the Symbol Editor lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-29 — feat(editor-v2): default width and height of a vertex view (P-2026-09-29-1230)
**Prompt**: `claude_2026-09-29_1230_prompt_symbol_default_size.md`, `Lane: full`, two-phase, on `~/jjodel-w-symsize` branch `symbol-default-size`. Sizing section of the Symbol Editor: Width and Height fields, `defaultSize` on `VertexViewIR`, every instance born at that size. Phase 1 report `6955e5c6d` recommended option (b), derivation at render; the GO (RC-25, unattended) adopted it with the 24 px floor, circle squared, no clamp in `irValidate`, the deactivation clear and the `default` caption.
**Files touched**: report `6955e5c6d`: `docs/discovery/discovery_2026-09-29_symbol_default_size.md`. Code `34c0ac422`, under `frontend/src/components/editor-v2/`: `nodes/nodeSizing.ts` (`usableSizeAxis`, `authoredDefaultSize`, `defaultBoxFor`, `sizeSourceOf`), `viewpoint/ir/irTypes.ts` (one optional field), `viewpoint/ir/irValidate.ts` (numeric rule), `viewpoint/ir/useContentSize.ts` (default box, deactivation clear), `viewpoint/ir/IRNodeContent.tsx` (one argument), `viewpoint/authoring/VertexAuthoringPanel.tsx` (Width and Height row), `viewpoint/authoring/SymbolBoxPreview.tsx` and `SymbolEditorModal.tsx` (`default size` caption); tests `nodes/__tests__/nodeSizing.test.ts` (new), `viewpoint/ir/__tests__/irValidate.test.ts`, `ir.test.ts`, `viewpoint/authoring/__tests__/symbolBoxPreview.test.ts`. This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on `34c0ac422`: `npm run typecheck` exit 2, 14 errors, the same file-and-code set as the baseline taken before the change; `npm run build` exit 0, only the chunk-size warning; vitest on the 4 touched test files plus `shapeRegistry.test.ts` and `irCreationSeed.test.ts`, 6 files, 264 passed. The hook and the panel are not covered by tests; the canvas behaviour waits for the visual check.
**Out-of-scope changes**: no — 12 files (8 source, 4 tests), all in the Phase 2 list of the report and the scope of the GO; above rule 19's 5, declared in the report before the GO (RC-11).
**Layer Impact Report**: not-required (no §3.2 file touched, no D-layer write: the default is a session-only size on the RF node)
**Smoke visivo**: chat, pending: set Width/Height on a rect and an ellipse view, new instance from the palette, a resized instance keeps its size, Reset size returns to the default, clearing both fields returns to content, circle squared, caption `default size`
**Notes**: Under (b) the default also redraws existing instances with no manual size; nothing is rewritten in the D-layer. Mutation bench 6/6 killed, listed in the commit body. The hook and the panel do not import in vitest (`ReferenceError: window is not defined` via `joiner`, measured with a `_tmp_` probe, deleted), so the deactivation clear, the fields row and the caption choice rest on the visual check.
**Prompt document name**: 2026-09-29 12:30

## 2026-09-29 — feat(editor-v2): vertex labels outside the symbol box (P-2026-09-29-1245)
**Prompt**: `claude_2026-09-29_1245_prompt_label_outside_positions.md`, `Lane: full`, two-phase, on `~/jjodel-w-labelout` branch `label-outside-pos`. Four label positions outside the box (above, below, left, right). Phase 1 report `21c0d6ede` corrected the proposed `'outside-*'` values to R-VP-15 (1)'s ratified `'outside'` + `anchor` and recommended strategy A; the GO (RC-25, unattended) adopted it on the base `ca59e317e` (lane 1230 merged in).
**Files touched**: report `21c0d6ede`: `docs/discovery/discovery_2026-09-29_label_outside_positions.md`. Code `9cca484ae`, under `frontend/src/components/editor-v2/viewpoint/`: `ir/irTypes.ts` (`'outside'`, `LabelAnchor`, `LabelSpec.anchor?`, `CompiledLabel.anchor?`), `ir/irCompile.ts` (`LABEL_ANCHORS`, `resolveLabelAnchor`), `ir/irValidate.ts` (`VALID_LABEL_POSITIONS`, label rule), `ir/IRNodeContent.tsx` (anchor class), `ir/irStyle.ts` (appended rules), `authoring/LabelEntryEditor.tsx` (optgroups, mapper), `authoring/SymbolBoxPreview.tsx`, `authoring/SymbolEditorModal.tsx`, `authoring/SymbolEditorModal.scss`; tests `ir/__tests__/irValidate.test.ts`, `ir.test.ts`, `shapeRegistry.test.ts` (bar check bounded, helpers hoisted unchanged), `authoring/__tests__/labelEntryEditor.test.ts` (new), `symbolBoxPreview.test.ts`. This commit: this entry, the report's addendum, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on `9cca484ae`: `npm run typecheck` exit 2, 14 errors, the same file-and-code set as before the change; `npm run build` exit 0, only the chunk-size warning; vitest on the 5 touched test files plus 6 adjacent, 11 files, 380 passed; all of `src/components/editor-v2`, 85 files, 2081 passed. The canvas render waits for the visual check.
**Out-of-scope changes**: no — 14 files (9 source, 5 tests), above rule 19's 5, all in the Phase 2 list of the report and the scope of the GO (RC-11).
**Layer Impact Report**: not-required (no §3.1 file touched, no D-layer write: view IR vocabulary, compile, CSS and authoring UI only)
**Smoke visivo**: chat, pending: the checklist of the closing report (four anchors on rect, circle, bar; old views unchanged; select groups; previews; dark theme)
**Notes**: Mutation bench 14/14 killed, listed in the commit body (one bench mutation was void, `false && A || B`, re-run as a real disable). `IRNodeContent.tsx` does not import in vitest (`ReferenceError: window is not defined`, `_tmp_` probe, deleted): its anchor class rests on the headless probe (report §6) and the visual check.
**Prompt document name**: 2026-09-29 12:45

## 2026-09-29 — ticket: outside label anchors are cardinal only, no diagonals
**Ticket**: `LabelAnchor` is `'n' | 'e' | 's' | 'w'`. R-VP-15 (1) names the Petri Place's label `nw`, which needs `ne/nw/se/sw`: an additive union widening plus four CSS rules, four select options and the vocabulary tests.
**Priority**: low
**Found in**: P-2026-09-29-1245

## 2026-09-29 — ticket: IR selection ring reads clipped by the node wrapper
**Ticket**: in a headless probe with the real `BASE_CSS` and `instanceNode.scss`, the pixel 4px outside a selected IR rect is white under `.mm-node.mm-object { overflow: hidden }` and the ring colour once the wrapper is lifted. Not yet confirmed in the live app. Nodes with an outside label lift the wrapper, so their ring may read fuller than their neighbours'.
**Priority**: low
**Found in**: P-2026-09-29-1245
**Detail**: docs/discovery/discovery_2026-09-29_label_outside_positions.md

## 2026-09-29 — ticket: Symbol Editor previews ignore the inside label positions
**Ticket**: both previews honour only `outside` for the primary label; `top`, `inside` and `bottom` still draw centred, as before this lane. Passing the inside position to the replica is a one-line change, kept out to leave committed preview behaviour untouched.
**Priority**: low
**Found in**: P-2026-09-29-1245

## 2026-09-29 — ticket: Symbol Editor Border swatch paints black for a CSS-variable colour
**Ticket**: with `shape.border.color` = `var(--color-inode-border)` the modal's Border Color field shows the string in its text box but its native swatch falls back to `#000000` (`ColorPicker.tsx:58`, `FULL_HEX_RE` only). The rail card that painted the resolved colour was retired by P-2026-09-29-1826, so the swatch is now the only colour chip for that axis outside the preview strip.
**Priority**: low
**Found in**: P-2026-09-29-1826
**Detail**: docs/discovery/discovery_2026-09-29_symbol_tab_opens_modal.md

## 2026-09-29 — feat(authoring): the Symbol tab opens the Symbol Editor, Form becomes Layout (P-2026-09-29-1826)
**Prompt**: `claude_2026-09-29_1826_prompt_symbol_tab_opens_modal.md`, `Lane: fast`, on `~/jjodel-w-symbol-tab` branch `symbol-tab-modal`. The Symbol tab becomes a trigger for the Symbol Editor modal (no intermediate pane, previous tab kept, arrows inert, dialog icon), and the Form tab reads Layout with a tooltip. Answers (unattended, RC-25): Q1 ticket, Q2 SymbolCard kept (RC-26), rail tab padding 10px to 8px.
**Files touched**: report `8ca549c5d`: `docs/discovery/discovery_2026-09-29_symbol_tab_opens_modal.md`. Code: `f8bd58ae0` `frontend/src/components/editors/views/ViewData.tsx`; `90e41df6a` `ViewData.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`, `frontend/src/components/editor-v2/nodes/RendererInspector.tsx`; `25d350167` `ViewData.tsx` (icon colour); `6e606fa3d` `frontend/src/components/editors/properties-with-tree-view.scss`. This commit: this entry, the Q1 ticket above it, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes, found by the lane probe and fixed in the lane: the icon painted slate-900 through the global `i.bi` (`25d350167`), and the vertex bar in Advanced overflowed the default 400px rail, Source clipped 9.8px (`6e606fa3d`, now 383/383). Typecheck 14 (baseline), build green, vitest 5825/5825 with the 9 known import reds.
**Out-of-scope changes**: yes: `RendererInspector.tsx` (the «Open the Layout tab» link, declared in Phase 1) and `properties-with-tree-view.scss` (added to the DOVE by the ratified answer).
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Playwright probes on :3002: checks a-e, 4 closers, arrows inert with Enter/Space as control; row, edge and legacy view bars 4px narrower per tab, no label cut; crops in `frontend/scripts/smoke/_tmp_symtab/`, gitignored)
**Notes**: At 360px Advanced the vertex bar still overflows: 381/343, Source hidden 29.8px, against 24.2px before the lane. Edge and legacy bars overflow less than before at every width. The hover-colour FAIL of probe2 is the probe's premise: the rail label does not change colour on hover; icon equals label idle and on hover. No tag, no merge.
**Prompt document name**: 2026-09-29 18:26
