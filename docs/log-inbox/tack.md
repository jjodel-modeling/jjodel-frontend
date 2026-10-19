# log-inbox — lane «tack»

Entries written by the Tack lanes on `tack-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: Tack slice 4, layer-1 metrics, deleted-worktree links, rename fix
**Prompt**: P-2026-10-19-1335 (code, stopped at the context ceiling RC-51 with tests green and nothing committed) and P-2026-10-19-1405 (cost cross-check, README, commits); `tack metrics`, link inference for path-gone cwds, numstat immune to `diff.renames`, schema 3
**Files touched**: tack/** (code commit 384348c49), docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1335_prompt_tack_s4_metrics.md (Status), docs/prompts/claude_2026-10-19_1405_prompt_tack_s4_continuation.md (added from the trunk, Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tests 86/86 (was 64); mutation bench in the code commit, all killed. Five unattended decisions (1 schema 3 and migration; 2 inference for path-gone only, ambiguity left unlinked; 3 local days, UTC via API; 4 waits over all calls, gap > 5 min; 5 subagent cost split by price-weighted tokens) plus layer 2/3 stubs and the `link` column. The 1405 prompt file is not on this branch's base: its Status flip will conflict on merge (add/add, one line).
**Prompt document name**: 2026-10-19 14:05

Link resolution on this Mac (store /tmp/tack-s4-acc/real.db, scan 1: 756 files, 593 sessions, 280 cwds, 6761 commits), sessions by method and reason:

| link | reason | sessions |
|---|---|---|
| direct | — | 386 |
| branch | — | 142 (all Jjodel) |
| sibling | — | 0 |
| none | no-candidate | 28 (8 sprotty clones under /private/tmp, 20 other /private/tmp probes) |
| none | branch-ambiguous | 21 (/private/tmp sessions on `main`, which exists in 3 repositories) |
| none | sibling-ambiguous | 5 (home-dir lanes whose branch is gone unmerged; the home dir holds work trees of 3 repositories) |
| none | not-a-git-work-tree (not inferred) | 11 |

Scan 2: 0 rows added, 2.3 s.

Cross-check 1, Tack cost per day vs the lane board's `spendByDay`, Jjodel, 2026-10-13..19, local days (TZ=Europe/Rome), after a rescan of a copy of the store:

| day | Tack lanes | board | diff | cause |
|---|---|---|---|---|
| 10-14 | 5.29 | 5.29 | 0% | — |
| 10-15 | 16.32 | 12.65 | +29% | one lane crossing midnight: Tack books it whole on its first day (+3.67), the board splits by turn end |
| 10-16 | 16.43 | 20.10 | -18% | the same 3.67 on the other side; 10-15 + 10-16 equal at 32.75 |
| 10-17 | 6.33 | 6.33 | 0% | — |
| 10-18 | 120.25 | 116.40 | +3.3% | a second midnight-crossing lane (+3.85) |
| 10-19 | 69.55 | 73.40 | -5.2% | the same 3.85 |
| total | 234.17 | 234.17 | 0.0% | — |

Tack also counts 16.08 USD of non-lane sessions (10-13, 10-17, 10-18) that the board does not see. Before the rescan 10-19 read 64.52 (-12.1%): the store had been scanned while this slice's own session was running, so its cost was still unknown (cost null, counted as unknown, never as 0); the rescan filled 5.03 and the lane total matched the board to the cent.

Cross-check 2, context peak vs discovery §4.2: tracer-scaffold 167,897 = slice 2 entry = §4.2; harness-book 47,216 = §4.2.

Jjodel `tack metrics`: 524 sessions, 3,588.89 USD known, 2 unknown; context peak median 204,723, 253 of 500 at or above 200k; subagent share calls 11.6%, cost 8.0%; commit proximity 517 yes, 7 no.

## 2026-10-19 — feat: Tack slice 3, git collector and repository identity
**Prompt**: P-2026-10-19-1305, repository identity per session cwd (root commit key, common dir, missing with reason), metadata-only git collector with incremental tips, commit-within-hour proximity, `tack repos`, acceptance on this Mac
**Files touched**: tack/** (code commit 68ac2ccdd), docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1305_prompt_tack_s3_git_collector.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Node ~/.local/bin/node v26.8.1; tests 64/64. Unattended: clones sharing any root are one repo (key = lowest root); empty repo is missing `no-commits`; proximity computed at query time; schema 1 migrated to 2. Bench: message-in-store and dropped count check killed; --no-renames survives. Scan 1: 46 s, jjodel full log about 38 s.
**Prompt document name**: 2026-10-19 13:05

§4.2 (report) vs `tack scan` + `tack repos` (store /tmp/tack-s3-acc/real.db), r / t:

| Metric | tracer-scaffold | harness-book | this repository (jjodel) | sprotty (8 dirs) |
|---|---|---|---|---|
| Commits, rev-list --all --count / stored | 13 / 13 | 33 / 33 | 6467 / 6467 | missing: path-gone 8 / 8 |
| Unit ids (trailer, suffix) | 0 / 0, 0 | 0 / 0, 0 | — / 3, 1882 | — |
| Claude co-authored | 9 / 9 | 27 / 27 | — / 3336 | — |
| Sessions with commit within hour | 1 of 1 / 1 of 1 | 1 of 1 / 1 of 1 | — / 373 of 381 | unknown 8 / 8 |

Scan 1: 755 files, 592 sessions, 279 cwds; 385 sessions in 5 repos, 196 path-gone, 11 not-a-git-work-tree; 6754 commits. Scan 2: 0 rows added (sessions 0, calls 0, repos 0, links 0, commits 0; 5 repos unchanged).

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

## 2026-10-19 — feat: Tack slice 5a, board server, page shell and Sessions view
**Prompt**: P-2026-10-19-1440: `tack board` (node:http on 127.0.0.1:4710, scan on start, `POST /api/rescan`), preselection by repository, JSON API (repos, sessions, metrics, health), page shell from memory with Sessions view, Timeline/Insights placeholders; tests; run on this Mac and leave it running
**Files touched**: tack/README.md, tack/bin/tack.mjs, tack/src/board/{api.mjs,server.mjs,page.html,board.css,board.js}, tack/test/board.test.mjs (code commit db39b5880); docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1440_prompt_tack_s5a_board_server.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (8 code files, all under `tack/**`, listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tests 97/97 (was 86); mutation bench in the code commit, 7 of 8 killed, the survivor equivalent. Unattended decisions: (1) `--root` flag added, as on `scan`, for tests; (2) preselection by root commit, not toplevel; (3) last scan time kept in memory, no table; (4) Host/Origin checks; (5) `until` added to the date range; (6) Insights placeholder lists layer 2/3 as not adopted. Visual check is the chat's, after exit (RC-23).
**Prompt document name**: 2026-10-19 14:40

Run on this Mac: `tack board --no-open --port 4710 --store /tmp/tack-s5a/real.db` from `~/jjodel-release`, left running, PID in `/tmp/tack-s5a/board.pid`; `git status` of `~/jjodel-release` unchanged before and after. First scan 41.2 s (758 transcripts, 595 sessions, 42,205 calls, 6,766 commits, 5 repositories); a rescan 2.2 s, 0 sessions added. Preselected: the Jjodel repository (166 worktrees).

| endpoint | status | bytes | time |
|---|---|---|---|
| /api/repos | 200 | 1,108 | 6 ms |
| /api/sessions?repo=jjodel | 200 | 208,299 | 70 ms |
| /api/metrics?repo=jjodel | 200 | 106,223 | 117 ms |
| /api/health | 200 | 419 | 1 ms |
| /api/sessions (all) | 200 | 232,634 | 22 ms |
| /api/metrics (all) | 200 | 119,096 | 112 ms |
| POST /api/rescan | 200 | 231 | 2.2 s |
| page, css, js | 200 | 4,592 / 9,674 / 9,623 | < 1 ms |

Summary strip for Jjodel, all dates: 526 sessions (384 direct, 142 by branch); cost 3,594.55 USD known, 2 unknown; context peak median 204,723, max 966,483, 254 of 502 sessions with calls at or above 200k; commit within the hour 518 yes, 8 no, 0 unknown, share 98.5%. Privacy spot check on the saved responses: no `cwd` key, no transcript root, no path below a toplevel; the one `/Users/` path is the repository toplevel in `/api/repos` (positive control found it).
