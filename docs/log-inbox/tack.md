# log-inbox — lane «tack»

Entries written by the Tack lanes on `tack-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: Tack slice 2, event store and Claude Code collector
**Prompt**: P-2026-10-19-1225, node:sqlite store (sessions, calls, ingest), incremental metadata-only Claude Code collector, `tack scan` and `tack sessions`, privacy gate, reproduction of report §4.2
**Files touched**: tack/** (code commit 2c0d567f3), docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1225_prompt_tack_s2_store_cc_collector.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Node used: ~/.local/bin/node v26.8.1; tests 49/49; gate exits 2 on v16/18/22/23. Privacy bench: 3 mutations killed. Also reads `<session>/subagents/*.jsonl` (all sidechain calls live there, 0 in main files): unattended. §4.2 reproduced exactly, table below; all 10 transcripts still on disk. Scan 2: 754 unchanged, 0 rows.
**Prompt document name**: 2026-10-19 12:25

§4.2 (report) vs `tack scan` + `tack sessions --cwd` (store /tmp/tack-s2/real.db):

| Metric | tracer-scaffold r / t | sprotty (8 dirs) r / t | harness-book r / t |
|---|---|---|---|
| Sessions | 1 / 1 | 8 / 8 | 1 / 1 |
| Per day | 09-17: 1 / 1 | 09-29: 4, 09-30: 4 / same | 10-07: 1 / 1 |
| Cost USD | 7.79 / 7.79 | 0.76 / 0.7568 | 0.29 / 0.29 |
| Context peak | 167897 / 167897 | max 29295 med 24068 / same | 47216 / 47216 |
| Main-thread calls | 66 / 66 | 57 / 57 | 7 / 7 |
| Span min | 118 / 118 | 0-1 / 0-1 | 1 / 1 |
| Models | claude-opus-5 / same | claude-sonnet-5-5 / same | claude-opus-5-5 / same |

Scan 1: 754 files, 324494 records, 0 malformed, 591 sessions, 42007 calls. Scan 2: 754 unchanged, 0 rows added.

---

## 2026-10-19 — feat: Tack slice 1, skeleton, contract v1 and tack check
**Prompt**: P-2026-10-19-1200, create tack/ with package skeleton, contract v1 schemas (unit, entry) and a dependency-free `tack check` with structural and referential rules
**Files touched**: tack/** (33 new files), docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1200_prompt_tack_s1_skeleton_contract.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tests 31/31 pass; `check` on valid.jsonl: 10 entries, no violations. 22 rules, 22 invalid fixtures. Deviations: package script is `node --test` because `node --test test/` fails on Node 22/23 (directory read as a module, MODULE_NOT_FOUND); added src/contract/linkage.mjs because the entry schema has no linkage field.
**Prompt document name**: 2026-10-19 12:00

---

## 2026-10-19 — discovery: Tack v0 extraction inventory (Phase 1)
**Prompt**: P-2026-10-19-1100, inventory the lane board for Tack v0: data sources, metrics, views, couplings by class, zero-adoption measurement, data contract v1 draft, extraction plan
**Files touched**: docs/discovery/discovery_2026-10-19_tack_v0_extraction.md, docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1100_prompt_tack_v0_extraction_disc.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 501 couplings in 8 code files (harness convention 235, Jjodel 116, platform 93, environment 57). The board never reads ~/.claude/projects. Zero-adoption measured on tracer-scaffold and 8 sprotty clones: cost and context ok, commit link lost for deleted clones, about 30 days of transcripts on disk. check:docs Check E red at HEAD before this lane: front tack not in fronts.json.
**Prompt document name**: 2026-10-19 11:00
