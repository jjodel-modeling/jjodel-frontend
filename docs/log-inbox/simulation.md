# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---


## 2026-10-20 — feat(sim): compile defect trigger-position for triggers dropped by fork or join fusion (P-2026-10-20-0031)
**Prompt**: ticket of P-2026-10-10-1630 (discovery §11 item 2): a trigger on an out edge of a fork, or an in edge of a join, is dropped silently by fusion; report it at Reset as defect `trigger-position` beside `event` and `event-feature`, run and nuXmv spec unchanged, row R-SIM-147.
**Files touched**: `024dfb142` (red): `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`. `c341ffbd3`: `frontend/src/model/simulation/stcChecks.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`. Docs commit: `docs/decisions.md` (R-SIM-147), `docs/prompts/claude_2026-10-20_0031_prompt_sim_trigger_position.md` (Status), this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — vitest src/model/simulation + editor-v2/sim 1489/1489, editor-v2/problems 101/101, typecheck exit 0, build exit 0
**Out-of-scope changes**: no — seven files over three commits, all in DOVE (RC-11: above five, listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Role `guard` for the defect: `problems/simCheckToProblems.ts` (critical zone, untouched) maps only guard/action, so the registry title reads `Guard: trigger ignored by fork F`; the defects line says `e2 trigger`. Feat subject shortened from the prompt's (86 > 72, CLAUDE.md 6.2). Mutation bench: choice edge reported, join read as fork, fork-and-join judged, each killed. R-SIM-147 provisional, unattended (RC-25).
**Prompt document name**: 2026-10-20 00:31
