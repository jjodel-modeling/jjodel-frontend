# log-inbox — lane «jjodie-ui-prb»

Entries written by the Jjodie probes lane (front jjodie-ui, branch `jjp-prb`) in a file of its own, so parallel lanes do not collide (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-25 — test: S2 and S6b probes follow M2 cards and Refactoring labels
**Prompt**: P-2026-10-25-1120: bring the stale S2 and S6b Jjodie probes up to the trunk: S2 reads the M1 and the M2 card separately with their own chips; S6b reads «Refactorings» and «Refactoring» (R-JJD-14); behaviour checks kept; run both.
**Files touched**: frontend/scripts/probe/jjodie-s2-script-card.ts, frontend/scripts/probe/jjodie-s6b-scripts-listing.ts (d846c423f); docs/log-inbox/jjodie-ui-prb.md (new), docs/prompts/claude_2026-10-25_1120_prompt_jjodie_probes_s2_s6b_update.md (Status, this commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 03:10 (also 2026-10-24 03:55)
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (S2 on 3015: 30/30 ALL GREEN; S6b on 3017: 18/18, failures=0; light theme)
**Notes**: S2 picks each card by its reply text: the M2 card was cards[0], so the old reads hit it and the re-preview click opened the M2 preview. One check replaced: «jjscript in an M2 reply keeps the open block and Run» is no longer intended (M2 preview lanes); now no open jjscript block, plus 3 M2-card checks. M2 chips read «+1 Class» for class + attribute, as the planner does. First two runs died on host load ~866, then a Mac restart; no edit under frontend/src.
**Prompt document name**: 2026-10-25 11:20
