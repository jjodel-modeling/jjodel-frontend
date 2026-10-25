# log-inbox — lane «jjodie-ui-gin»

Entries written by the M2 ghost preview lane (front jjodie-ui, branch `jjp-gin`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-25 — feat: M2 ghosts inside their class, new classes in free space, no palette beside
**Prompt**: P-2026-10-25-0110: on the real metamodel canvas an added feature is a row inside its class, a removed one struck on its row, a new class in free space clear of nodes, edge labels, edges and ghosts, and the target palette collapsed while the Refactoring tab previews beside it.
**Files touched**: `frontend/src/components/editor-v2/preview/previewPlacement.ts` (new: free-spot search with 24 px clearance, compartment and strike boxes) and `__tests__/previewPlacement.test.ts` (new); `previewElements.ts` (compartment under the owner, strike on the measured row, `obstacles`, DOM row and obstacle measurement); `__tests__/scriptPreview.test.ts`; `PreviewBar.scss`; `frontend/src/components/editor-v2/EditorV2.tsx` (obstacles, one more layout pass, `collapsed` to the palette); `EditorV2.scss` (collapsed palette); `panels/PalettePanel.tsx` (optional `collapsed` prop); probe `refactoring-side-by-side.ts`; this file; the Status of the prompt.
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 16:00
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: No critical-zone file: rows measured from the DOM, ClassNode untouched. Out of scope: EditorV2.tsx/.scss, PalettePanel.tsx; 9 files (rule 19). Probe scene: compartment top 614 = State bottom 554+60, same x/w; strike y 591 h 20 = row; RsbNew 180x48, 0 edge samples/labels/ghosts within 12 px; palette 0 px previewing, 200 after Discard and Apply. Bench 5/5 killed. Vitest 12048 + 9 known; crop gin_previewing.png in ~/.jjodel-lanes/P-2026-10-25-0110.
**Prompt document name**: 2026-10-25 01:10
