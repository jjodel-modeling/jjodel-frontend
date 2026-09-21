# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-19 — feat: corner radius is a Conditional axis, aligned to R-IRN-35 before the merge (P-2026-09-19-1730)
**Prompt**: `P-2026-09-19-1730`, pre-merge alignment. The branch's scalar `ShapeSpec.cornerRadius` (D5) takes the trunk's type and compile path (`Conditional<number>`, `CompiledView.cornerRadius`, fallback `undefined`, never 0) and keeps its own rendering (polygons through `roundedPolygonPath`, clamp at render, absent is not zero). Two-phase: discovery report, GO with two answers (Q1 option B: stepper disabled with the label `rule-driven`; Q2 a pure helper `resolveCompiledCornerRadius` in `shapeRegistry.ts`, called by `IRNodeContent`), commit type asked under P6 and answered `feat(ir)`.
**Files touched**: discovery `83229edbd` (`docs/discovery/discovery_2026-09-19_corner_radius_alignment.md`, plus a Phase 2 addendum in the docs commit). Code `f5ec4b5fe`, 9 files: `ir/irTypes.ts`, `ir/irCompile.ts`, `ir/shapeRegistry.ts`, `ir/IRNodeContent.tsx`, `ir/irValidate.ts`, `authoring/VertexAuthoringPanel.tsx`, `ir/__tests__/ir.test.ts`, `ir/__tests__/shapeRegistry.test.ts`, `ir/__tests__/irValidate.test.ts`. This entry in its own docs commit, which also carries the addendum. Inbox: `views.md`, the one the prompt names; `symbol-editor.md` was the other candidate.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0** in the touched files; control `Measurable` → 6. `npx vitest run` from `frontend/`: **3911 passed, 0 failed** (3900 + 11 new), the identical set of 9 files red at import. `npm run build` exit 0. The 11 new tests were red on the pre-change source (run before any source edit); a bench of 10 mutants on the new code, each killed by a named test, none survived (commit message of `f5ec4b5fe`).
**Out-of-scope changes**: no. The helper in `shapeRegistry.ts` and the panel guard are the GO's answers to Q2 and Q1; `previewInstances.ts` and the four other readers untouched. Nine files, above the P6 threshold of five: listed in the commit and in the addendum, no separate pause because the GO named them.
**Layer Impact Report**: not-required — `viewpoint/ir/` and `viewpoint/authoring/` are §3.1 rows, but no §3.2 file (`useJjomSync`, `syncState`, `canvasToJjom`, `portDistribution`, `useM1ReferenceEdges`, `VersionFixer`) and no D-layer creator was touched.
**Smoke visivo**: non applicabile — the prompt sets the hard stop before Alfonso's visual check, which comes with the merged tree. Not executed here: the `IRNodeContent` call of the helper and the panel guard (both import `joiner`, no bench).
**Notes**: Merge after `f5ec4b5fe`: irTypes 1 hunk, irCompile 2, IRNodeContent 1, all take-branch (border axes; the render region, where the separatorColorStyle rebuild is R-IRN-36); merge-tree: the same 11 conflicted files. ShapeSpec.cornerRadius is DUPLICATED in the auto-merged irTypes.ts with no marker (lines 198, 208): P-2026-09-19-1740 deletes one, TS2300 finds it. Numbers: discovery addendum, section 8.
**Prompt document name**: 2026-09-19 17:30

