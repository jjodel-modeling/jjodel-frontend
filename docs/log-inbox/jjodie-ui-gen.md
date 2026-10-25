# log-inbox — lane «jjodie-ui-gen»

Entries written by the ghost generalization edges lane (front jjodie-ui, branch `jjp-gen`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-25 — fix: ghost edges orthogonal on facing sides, no curve under the class
**Prompt**: P-2026-10-25-1005: M2 ghost edges (generalization and reference) take the orthogonal path of real edges, dashed cyan, hollow triangle for generalization, ends on the facing sides, never through the ghost or the target box, around other nodes when a free route with at most two bends exists; placement prefers a straight route (tie-break only).
**Files touched**: af2309645: `frontend/src/components/editor-v2/preview/previewRoute.ts` (new, pure route) and `__tests__/previewRoute.test.ts` (new); `preview/PreviewEdge.tsx` (new, edge type `preview`); `previewElements.ts` (route per ghost edge); `previewPlacement.ts` (tie-break `facesAcross`) and its test; `__tests__/scriptPreview.test.ts`; `PreviewBar.scss` (triangle); `EditorV2.tsx` (one `edgeTypes` entry). 7445bc4f4: probe `refactoring-side-by-side.ts`. This file; the Status of the prompt.
**Outcome**: ✅ completed
**Corregge**: 2026-10-25 01:10
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Out of scope: EditorV2.tsx (edgeTypes entry), PreviewEdge.tsx, PreviewBar.scss; 10 files (rule 19), ratified as recommended, unattended. No critical-zone file. Probe scene: d "M 64 360 L 144 360", 0 bends, ghost right side to State left side (the facing ones), no segment through either rect; probe 33 PASS ALL GREEN, jjodie-m2-preview ALL PASS. Typecheck exit 0; build exit 0; vitest 12058 passed + 9 known. Crop gen_previewing.png in ~/.jjodel-lanes/P-2026-10-25-1005.
**Prompt document name**: 2026-10-25 10:05
