# log-inbox — lane «jjodie-ui-s4p»

Entries written by the Jjodie S4b probe lane (front jjodie-ui, branch `jjp-s4p`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — probe: jjodie S4b ghost preview, DOM measures and marker fix
**Prompt**: P-2026-10-24-0255, visual probe of S4b (R-JJD-2): fire the preview event with a three-create, two-reference, one-unknown-feature M1 script on scene_1_DemoPEST and measure ghosts, marker, bar, inertness, overlap, Discard, Apply, console; fix inside the S4b files if a measure fails.
**Files touched**: frontend/src/components/editor-v2/preview/previewElements.ts, frontend/src/components/editor-v2/preview/__tests__/scriptPreview.test.ts, frontend/src/components/editor-v2/EditorV2.tsx (5adbb82c5); frontend/scripts/probe/jjodie-s4b-ghost-preview.ts (790efc32c); docs/log-inbox/jjodie-ui-s4p.md, docs/prompts/claude_2026-10-24_0225_prompt_jjodie_s4b_ghost_preview.md, docs/prompts/claude_2026-10-24_0255_prompt_jjodie_s4b_probe.md (this commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 02:25
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Final run 22/22 on 3012 (light). One real failure: an UNKNOWN_PROPERTY line plans no effect, so no ghost got the amber dot; previewElements now reads the warned script line and marks the owner it writes (`set X.f`, `remove … from X.f`). Bench: loop disabled, new test dies. The first click failure was the probe (it clicked the tree sidebar over the ghost). Gates: typecheck 0, vitest 11832 + 9 known, build ok. Crops and JSON in ~/.jjodel-lanes/P-2026-10-24-0255/.
**Prompt document name**: 2026-10-24 02:55

**Ticket** (S4b cosmetics, not in the spec): the two ghost edges GhostA→GhostB and GhostC→GhostB run on one vertical line through the ghost column, crossing GhostB's label (React Flow's first-handle fallback, top/bottom). A drag on a ghost pans the viewport (non-draggable nodes let the pane pan); the flow position is unchanged, as the spec asks. Environmental: after HMR of EditorV2 the dev server stopped opening model tabs (`open2`, no error) until restarted; three runs lost to it.

## 2026-10-24 — ticket: ghost preview column opens under the right sidebar
**Ticket**: On scene_1_DemoPEST at 1600x1000, the three ghost nodes are placed one column right of the drawn nodes and land under the tree/properties sidebar: hit test at their centre returns `tree-row`, not the ghost (`ghostsVisibleAsOpened: [false, false, false]`). `.react-flow` extends beneath the sidebar, so the bar says `+3 objects` while nothing is visible until the user pans. Candidates for the chat: fit the view to the preview on show, or place the column inside the visible pane.
**Priority**: medium
**Found in**: P-2026-10-24-0255
**Detail**: ~/.jjodel-lanes/P-2026-10-24-0255/probe_s4b_ghost_preview.json
