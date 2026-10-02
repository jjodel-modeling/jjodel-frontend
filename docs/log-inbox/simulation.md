# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---


## 2026-10-02 — discovery: the simulator's state UI, R-SIM-102..107 and 109 (P-2026-10-02-2340)
**Prompt**: `claude_2026-10-02_2340_prompt_discovery_sim_state_ui.md`, heavy tier, read-only on `~/jjodel-w-simstate`, branch `sim-state-disc`: where the inspector docks, the `.smv` preview, «Written by»/«Read by», kept configurations, viewer preferences, the «Data» label, the demo per lane; a Phase 2 plan of at most three lanes.
**Files touched**: `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (new), the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (docs only; the benches are gitignored `_tmp_*` under `frontend/scripts/smoke/`)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Benches on the four demo exports reproduce the script's readings word for word. Kept configurations about 100 B each (100 KiB for 1000), 3.2 KB on a 62-global σ; replay 3-13 µs a step, equal to live 4/4; the trace lacks input values. Inspector: a floating card beside the panel. Preview dropped. Lanes A ∥ B, then C. Report §0, §8.
**Prompt document name**: 2026-10-02 23:40
