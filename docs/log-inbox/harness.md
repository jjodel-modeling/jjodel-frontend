# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---


## 2026-10-16 — docs(harness): lean context and model routing discovery and ratification (P-2026-10-15-1725)
**Prompt**: `claude_2026-10-15_1725_prompt_lean_context_model_routing.md`, `Lane: full`, Phase 1 read-only: current harness behaviour, a baseline of 20 lanes, probes of the three 5.5 models, a Phase 2 plan. Then the ACK of 2026-10-16: record Alfonso's RC-26 ratification in report §7 and in decisions, propose AM-8 (context ceiling) and AM-9 (one slice per session), close.
**Files touched**: `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` (`0dd7ed3b5`, §7 in the closure commit); `docs/decisions.md` (RC-49, appended); the prompt's Status line; this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Three probes, one per model: all three IDs are served, and `--resume --model` switches the model in-session. Of total input (D), 98% is cache reads. Largest shares: tool output 35.7% (estimated), subagents 25.3%, initial context 19.4%. AM-8 and AM-9 await ratification. No config, runner, hook or skill changed. Detail is in the report, §0 and §7.
**Prompt document name**: 2026-10-15 17:25

**Ticket** (P-2026-10-15-1725): `output-budget.mjs` is committed but not registered in `.claude/settings.json`, so it denies nothing. The uncommitted CLAUDE.md §0.1 says otherwise. Covered by B0. RC-46 and RC-47 are not implemented on this branch.
