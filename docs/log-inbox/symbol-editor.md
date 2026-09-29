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
