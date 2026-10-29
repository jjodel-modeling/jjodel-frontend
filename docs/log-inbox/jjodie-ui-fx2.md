# log-inbox — lane «jjodie-ui-fx2»

Entries written by the Jjodie fix-after-integration lane (front jjodie-ui, branch `jjp-fx2`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — ticket: megamodel edge path is NaN when its two ports share an x
**Ticket**: `buildRoundedPath` (frontend/src/components/megamodel/MegamodelEdge.ts:186-224, unchanged since 85b33c57d, 2026-03-13) divides by the length of a zero-length segment: when the two ports of a vertical edge share an x, `routePoints` returns two equal middle points, so `dxNext / lenNext` is 0/0 and the path reads `Q150,220 NaN,NaN LNaN,NaN`. Measured with the S6b probe on scene_1_DemoPEST: the error is logged at megamodel open with no script (demoSM at 40,270 under DemoPEST at 40,40), and once more when a script node sits under its model (40,440). Not an S6b or S6c defect; S6b's row placement only adds an instance. Fix: skip zero-length segments (or a zero radius corner) in buildRoundedPath, with a unit test.
**Priority**: low
**Found in**: P-2026-10-24-0505

## 2026-10-24 — test: jjodie S2 probe to the S5 actions, megamodel NaN paths traced
**Prompt**: P-2026-10-24-0505: update the stale S2 probe assertion (Edit script and Open as file enabled since S5) and re-run it; find the cause of the two NaN SVG path errors at megamodel open (S6c ticket), fix it only if it lies in the S6b or S6c changes, else ticket.
**Files touched**: frontend/scripts/probe/jjodie-s2-script-card.ts (99702d7ea), frontend/scripts/probe/jjodie-s6b-scripts-listing.ts (00cee2db9); docs/log-inbox/jjodie-ui-fx2.md (new), docs/prompts/claude_2026-10-24_0505_prompt_jjodie_fix_after_integration.md, docs/prompts/claude_2026-10-24_0431_prompt_jjodie_integration_check.md (this commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 03:10
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: S2 probe on 3010: 26/26. NaN paths: cause in MegamodelEdge.ts buildRoundedPath (pre-existing), not in S6b/S6c, so no fix (ticket above). S6b probe gained per-phase console-error MEAS, no new check; 17/17 on 3010. S6c probe not re-run (no product change). Gates: typecheck 0; vitest 11915 pass + the 9 known; build ok; check:scripts PASS 128.
**Prompt document name**: 2026-10-24 05:05
