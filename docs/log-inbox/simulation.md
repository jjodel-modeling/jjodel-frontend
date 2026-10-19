# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---


## 2026-10-20 — docs: simulation guide and semantics reference (P-2026-10-20-0015, P-2026-10-20-0035)
**Prompt**: P-2026-10-20-0015 (user guide plus semantics reference for the simulator, with a discovery report), finished by P-2026-10-20-0035 from the 0015 handoff after the AM-8 context ceiling
**Files touched**: docs/discovery/discovery_2026-10-20_sim_semantics_docs.md, docs/help/simulation/simulation-guide.md, docs/help/simulation/simulation-semantics.md, docs/log-inbox/simulation.md, docs/prompts/claude_2026-10-20_0015_prompt_sim_semantics_docs.md, docs/prompts/claude_2026-10-20_0035_prompt_sim_semantics_docs_continue.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Docs commit 45b575dcf, closure in a second commit because the Status sha cannot name its own commit (P13). Twelve findings (spec behind R-SIM rows on R-SIM-18, -20, double assignment, priorities, subset checker, ranges) and four items awaiting Alfonso (A1 profile constraints unenforced, A2 out-of-domain initial applied, A3 scenario expect has no UI, A4 Running on inputs vs R-SIM-29): see the discovery report. No docs/help index exists.
**Prompt document name**: 2026-10-20 00:35
