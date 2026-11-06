# log-inbox — lane «jjodie-ui-low»

Entries written by the low-priority Jjodie fix lane (front jjodie-ui, branch `jjp-low`) in a file of its own, so parallel lanes do not collide (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — fix: megamodel NaN paths and the preview bar under the Properties rail
**Prompt**: P-2026-10-24-1521: fix the NaN coordinates `buildRoundedPath` emits on zero-length segments (ticket P-2026-10-24-0505), and find why a Playwright click on the preview bar's Discard fails (ticket P-2026-10-24-0310).
**Files touched**: frontend/src/components/megamodel/MegamodelEdge.ts, frontend/src/components/megamodel/__tests__/buildRoundedPath.test.ts (new), frontend/src/components/editor-v2/preview/PreviewBar.scss, frontend/scripts/probe/jjodie-s2-script-card.ts (c6f8a2a28); docs/log-inbox/jjodie-ui-low.md (new), docs/prompts/claude_2026-10-24_1521_prompt_jjodie_lowprio_fixes.md (this commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 05:05
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes — the probe edited is the S2 one (`jjodie-s2-script-card.ts`), where the Discard click failed; the prompt's DOVE names "the S4 probe file", and the S4b/S4c probes already click Discard and Apply with Playwright and passed unchanged.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (S2 probe ALL GREEN on 3015 with a Playwright click on Discard; S4b 19 PASS and S4c 10 PASS, both with Playwright clicks on Discard and Apply; S6b 17/17 and its console errors show only the setup `init_dash`)
**Notes**: NaN: ports sharing an x give two equal middle points, 0/0 in the corner maths; 3 of 6 new tests fail on the old code. Discard: elementFromPoint hit `.tree-search` inside `.properties-tree-overlay` (fixed, z 900, x 740-1140) over the bar's buttons (x 714-843); fixed in PreviewBar.scss with `--jj-rail-width` (buttons now x 514-643). NaN count before not re-measured. Gates green; laneRun/laneTracking time out under the full vitest run, pass alone.
**Prompt document name**: 2026-10-24 15:21
