# log-inbox — lane «tack»

Entries written by the Tack lanes on `tack-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: Tack slice 5b, Timeline and Insights views, Sessions fixes
**Prompt**: P-2026-10-19-1520 (code, stopped at the 200k context ceiling, RC-51) and its continuation P-2026-10-19-1555 (run, measure, bench, README, commits): fix three 5a Sessions defects, add Timeline and Insights with dependency-free SVG chart helpers, tests, run the board on port 4710.
**Files touched**: tack/README.md, tack/src/board/{api.mjs,server.mjs,page.html,board.css,board.js,charts.js,timeline.js,insights.js}, tack/src/metrics/{layer1.mjs,select.mjs}, tack/test/{board.test.mjs,charts.test.mjs,helpers/views.mjs} (code commit 90d64d594); docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1520_prompt_tack_s5b_timeline_insights.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-19 14:40 (P-2026-10-19-1440: Sessions defects of 5a, row widths at 1440, KPI ellipsis at 800, hash-named repository)
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no (every file under `tack/**` or listed in DOVE)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (DOM measurements at 1440 and 800 px and the visual check are done by the chat after exit, RC-23)
**Notes**: Tests 112/112 (was 97). Mutation bench on charts.js: 6 mutants, first run 5 of 6 killed, the survivor (non-numeric value in the bar total) was not equivalent, a test assertion was added, then 6 of 6; file restored. The 1555 prompt file is not on tack-s5b (committed on the release branch as 13c70d0fc), so its Status line was not flipped here. Decisions: see the handoff of P-2026-10-19-1520.
**Prompt document name**: 2026-10-19 15:55

Unattended decisions (RC-21/RC-25, from `~/.jjodel-lanes/P-2026-10-19-1520/handoff.md`, ordered by consequence): (1) new endpoint `GET /api/timeline` (epoch ms) instead of new keys on `/api/sessions`, so the 5a shape tests stay as they are; (2) unit id of a session is the unit of the commit nearest its last event within first event to last event + 1 h, a proximity not an authorship, only for repositories with unit ids; column «Unit / branch»; (3) `loadSelection` and `/api/metrics` accept `until`, which 5a ignored on metrics; (4) `cost_per_day` gets `byFamily` (default false: CLI and metrics tests unchanged), families opus, sonnet, haiku, other, unattributed; (5) chart helpers in a separate served `charts.js`, run in a vm by `node --test`; (6) hash-named repository named after the folder that holds it, else `(unnamed) <key8>`; (7) family palette from the dataviz categorical slots 1, 2, 3, 7 plus neutral, validated in light and dark, one contrast WARN on aqua in light relieved by legend and `<title>`; plus the Timeline window, Insights card set and 1,088 px table width recorded in the handoff.

Run on this Mac: `tack board --no-open --port 4710 --store /tmp/tack-s5b/real.db` from `~/jjodel-release` (the 5a board, PID 10945, stopped; store copied from `/tmp/tack-s5a/real.db`), left running, PID in `/tmp/tack-s5b/board.pid`; `git status --porcelain` of `~/jjodel-release` unchanged before and after.

| measure (all repositories) | value |
|---|---|
| /api/sessions | 200, 241,401 B, 135 ms |
| /api/metrics | 200, 121,755 B, 135 ms |
| /api/timeline | 200, 267,940 B, 37 ms |
| page, board.js, charts.js, timeline.js, insights.js, board.css | 4,395 / 12,833 / 11,750 / 12,832 / 9,201 / 14,712 B |
| charts per tab (real data rendered through the views in a vm) | Sessions 0 (table); Timeline 4 svg (Day and Week); Insights 7 svg, 2 small-multiple panels |
| render time in the vm | Timeline 1 to 2 ms; Insights 15 ms |

Not measured here, left to the chat in the browser: table width against the container at 1440 and 800 px, KPI secondary lines at 800 px, load-to-Insights-drawn time, the Unit column showing P-ids for Jjodel, the selector showing «Jjodel Book».

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

## 2026-10-19 — feat: Tack slice 6, layers 2 and 3, Jjodel log importer, lane-run adapter, parity
**Prompt**: P-2026-10-19-1620 (stopped at the 200k context ceiling, RC-51, nothing committed) and its continuation P-2026-10-19-1655: layer-2 identity with the corrected unit-id link, layer-3 metrics, `tack import jjodel-log`, lane-run adapter, chart label fix, `tack parity jjodel --days 14` against the lane board's rules, tests, board on 4710.
**Files touched**: tack/README.md, tack/bin/tack.mjs, tack/src/board/{api,server}.mjs, tack/src/board/{board,charts,insights}.js, tack/src/collectors/{claude-code/collect,git/collect,lane-run/collect,log/collect,layers,units}.mjs, tack/src/importers/jjodel-log.mjs, tack/src/metrics/{index,layer2,layer3,select,stubs}.mjs, tack/src/parity/jjodel.mjs, tack/src/store/{open.mjs,schema-4.sql}, tack/test/{board,charts,importer,infer,lanes,metrics,parity,privacy,units}.test.mjs, tack/test/helpers/{board-parity,layers-fixture}.mjs (code commit 6f0353e74); docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1620_prompt_tack_s6_jjodel_parity.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-19 15:20 (P-2026-10-19-1520: unit id taken from any commit of the repository within the hour; SVG axis labels scaled up and cut on wide charts)
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no (35 files, all under `tack/**` or listed in DOVE; above five, listed in Files touched, RC-11)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (the visual check of the board on 4710 is done by the chat after exit, RC-23)
**Notes**: Tests 160/160 (113 at the start of 1655, 6 red: 5 fixed in the test because schema 4 made the expectation wrong, board.test.mjs x3, infer.test.mjs, metrics.test.mjs stubs, plus the privacy test extended with the lane and log column sources; 1 CLI test kept by keeping its output wording). New tests written by a subagent found 2 src bugs, fixed: a missing --repo path threw ENOENT; the clamped last axis label could sit 47-55 px from the previous one. Decisions and parity: below.
**Prompt document name**: 2026-10-19 16:55

Unattended decisions (RC-21/RC-25), ordered by consequence. From 1620 (`~/.jjodel-lanes/P-2026-10-19-1620/handoff.md`): (1) the prompt-unit rule is widened to a `Prompt-ID: P-...` header line before the first `## ` besides the leading tag, because Jjodel lane prompts open with a title (421 sessions linked by prompt, 424 at the final scan); (2) duplicate units in the import get the contract's suffix `-2`, `-3` instead of `unit-duplicate` rejections, metrics compare by base unit; (3) the importer drops `files` and `notes`; (4) the commit link reads commits reachable from the session's branch ref, a remote ref of that name, or the second parent of a merge whose subject names it, nearest to the last event; no branch, no unit; (5) schema 4 (`sessions.unit/unit_source`, `commits.reverts`, `lanes`, `lane_spend`, `log_entries`), one re-read of main transcripts and repositories; (6) `stubs.mjs` kept with `// TODO: cleanup`. From 1655: (7) reverts counted only between non-merge commits, as the board reads `git log --no-merges`; (8) `sessionsApi` reads `sessions.unit` and always returns the branch, `unitNear` kept unused with `// TODO: cleanup`; (9) charts are drawn twice in the page, the second time by `fit()` at the pixel width of their container, so one viewBox unit is one CSS pixel (axis text 10 px from `board.css`), the last label clamped to W-18 and the labels kept 56 px apart; (10) the missing-path fix is a guard in the importer (`existsSync`), not a change of `git()`, whose throw other collectors may rely on; (11) emoji in the importer and its tests written as `\u` escapes (rule 26); (12) the Status line of P-2026-10-19-1655 is not flipped: its prompt file exists only on the trunk (`927e525e7`), not on `tack-s6`, as for 1555 in slice 5b.

Parity, `tack parity jjodel --days 14 --store /tmp/tack-s6/real.db --repo ~/jjodel-w-tack-s6`, exit 0: spend equal to the cent on every day (tolerance 1%), first-shot 212 of 243 lanes on both sides (1 running), 0 mismatches. The difference the handoff feared on P-2026-10-13-1930 (its correction comes from P-2026-10-17-1945, whose entry the importer rejects as `corrects-unresolved`) cannot arise: neither id has a lane folder, so neither side counts it.

| day | board | tack |
|---|---|---|
| 10-06 | $35.93 | $35.93 |
| 10-07 to 10-09 | $0.00 | $0.00 |
| 10-10 | $487.67 | $487.67 |
| 10-11 | $397.86 | $397.86 |
| 10-12 | $72.74 | $72.74 |
| 10-13 | $0.00 | $0.00 |
| 10-14 | $5.29 | $5.29 |
| 10-15 | $12.65 | $12.65 |
| 10-16 | $20.10 | $20.10 |
| 10-17 | $6.33 | $6.33 |
| 10-18 | $116.40 | $116.40 |
| 10-19 | $113.87 | $113.87 |
| total | $1,268.86 | $1,268.86 |

Importer on the trunk `alfonso-frontend-jjtl`: 1,980 entries read, 1,177 converted (pass `tack check`), rejected 803: unit-required 740 (entries before the `Prompt document name` field), corrects-unresolved 25, field-required 21, cause-required 7, cause-forbidden 6, regressions-enum 4; an `--out` inside the repository is refused (exit 2). Real scan: units by prompt 424, by reachable commit 97, none 85; 584 lane folders; 1,177 log entries. Jjodel since 2026-10-06 in `tack metrics`: first-shot 210 of 240 (87.5%), regression rate 1.4%, out-of-scope rate 12.1%.

Run on this Mac: the 5b board (PID 29050, a `tack` node process) stopped; `tack board --no-open --port 4710 --store /tmp/tack-s6/real.db` started from `~/jjodel-release` with the code of this worktree and `TACK_IMPORTS=/tmp/tack-s6/imports`, left running, PID in `/tmp/tack-s6/board.pid`; `git status --porcelain` of `~/jjodel-release` empty. `/api/sessions` for Jjodel: 537 sessions, all with the branch, 506 with a unit (409 prompt, 97 commit); the `tack-s4` session of 13:34 now shows P-2026-10-19-1335 (by prompt), not P-2026-10-19-1331. `/api/metrics`: all 8 layer-2/3 metrics `computed`; Insights renders 14 svg in a vm, no NaN.

## 2026-10-19 — feat: Tack slice 7, settings, notifications and host load strip (closure)
**Prompt**: Close Phase 2 of P-2026-10-19-1800 after two context-ceiling stops (P-2026-10-19-1800, P-2026-10-19-2140): two red tests, full suite, README, report §0, board on 4710, commits, Status flips
**Files touched**: tack/** (30 files, code commit e0fd6d286); docs/discovery/discovery_2026-10-19_tack_settings_notifications.md (§0 only), docs/log-inbox/tack.md, docs/prompts/claude_2026-10-19_1800_prompt_tack_s7_settings_notifications.md (Status), docs/prompts/claude_2026-10-19_2140_prompt_tack_s7_phase2_continuation.md and claude_2026-10-19_2225_prompt_tack_s7_closure_session.md (added from the trunk, Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (every file under `tack/**` or listed in DOVE)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, board left running on 4710)
**Notes**: Full tack/test suite: 185 tests, 185 pass, 0 fail (TAP counts, slice 6: 160). The twelve unattended decisions are report §6; none awaits Alfonso (§7). Report §0 sits above the existing «0. Hypotheses under test», which was not renumbered (scope §0 only). The 2140 and 2225 prompts were added from the trunk to flip their Status, as slice 4 did.
**Prompt document name**: 2026-10-19 22:25

Board: the s6 board (PID 42412, `node ~/jjodel-w-tack-s6/tack/bin/tack.mjs board`) stopped; `/tmp/tack-s6/real.db` copied to `/tmp/tack-s7/real.db`; started from `~/jjodel-w-tack-s7/tack/bin/tack.mjs board --no-open --port 4710 --store /tmp/tack-s7/real.db` with `TACK_IMPORTS=/tmp/tack-s6/imports` and `TACK_NOTIFY=off`, PID in `/tmp/tack-s7/board.pid`. From this worktree because the slice 7 code exists only on `tack-s7` until the merge. `TACK_NOTIFY=off` (unattended, RC-25) so the board sends no real desktop notification before the merge; the load strip still works from the in-process sampler. `curl`: `/` 200, `/settings` 200, `/api/settings` 200 (9527 B JSON), `/api/load` 200 (samples, threshold 20, 8 cores). `tack check`: the three settings fixtures pass, the invalid one exits 1 with three violations, `valid.jsonl` passes.

## 2026-10-19 — merge: tack-s7 into alfonso-frontend-jjtl (P-2026-10-19-2248)
**Prompt**: `claude_2026-10-19_2248_prompt_merge_tack-s7.md`, a direct merge by `lane-run merge --direct`, no session: `tack-s7` at `022d7109f` into `alfonso-frontend-jjtl`, merge base `bf259570f`, 3 commits on the branch side.
**Files touched**: merge `f694c9ac4`: 33 files from the branch side (`docs/discovery/discovery_2026-10-19_tack_settings_notifications.md`, `docs/log-inbox/tack.md`, `docs/prompts/claude_2026-10-19_1800_prompt_tack_s7_settings_notifications.md`, `tack/README.md`, `tack/bin/tack.mjs`, `tack/contract/v1/README.md`, `tack/contract/v1/settings.json`, `tack/src/board/board.css`, and 25 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f694c9ac4` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9423 tests in 384 files, 9 red at import, hooks 944; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Alfonso checked slice 7 on the 4710 board from the tack-s7 worktree (settings page, themes, load strip, desktop test notification delivered): ok fetta 7, 2026-10-19 22:45; tack code at the merge identical to the checked tip 022d7109f
**Notes**: Rollback tag `pre-tack-s7` on `b3bcc7fba` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-19-2248/result.json`.
**Prompt document name**: 2026-10-19 22:48

## 2026-10-19 — feat: Tack slice 8, the Lanes page (Phase 2)
**Prompt**: Phase 2 of P-2026-10-19-2320: the three commits of report §6 (schema 6 and the collector, /api/lanes with the collect-on-read throttle, the Lanes page as first tab), the ROADMAP entry «Phase ladder per project», full suite, board on 4710, closure
**Files touched**: tack/** (16 files: 923f7d4bf, 736e04b88, 5d2146df9; tack/ROADMAP.md in its own commit), docs/prompts/claude_2026-10-19_2320_prompt_tack_s8_lanes_page_disc.md (Status), docs/log-inbox/tack.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (above five files, every one under `tack/**` or listed in DOVE)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23; board left running on 4710)
**Notes**: Full tack/test suite: 208 tests, 208 pass, 0 fail (slice 7: 185). Eight unattended decisions in the lane handoff (~/.jjodel-lanes/P-2026-10-19-2330/handoff.md). The P-2026-10-19-2330 Status is not flipped: its prompt file is only on the trunk (c9b903250); the flip is owed by the merge or the chat. Session closed at the AM-8 soft ceiling.
**Prompt document name**: 2026-10-19 23:30

## 2026-10-20 — fix: Tack slice 8, the Lanes view registers and polls in a browser
**Prompt**: P-2026-10-20-0018: the Lanes page stayed on «Loading the lanes…» in a browser (`Illegal invocation` at lanes.js:96); default poller timers called setInterval as a method, and the throw preceded the registration of TackViews.lanes
**Files touched**: tack/src/board/lanes.js, tack/test/lanes-view.test.mjs (03d22d7c7), docs/prompts/claude_2026-10-20_0018_prompt_tack_s8_lanes_view_fix.md (Status, copied from the trunk), docs/log-inbox/tack.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-19 23:30
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23; board restarted on 4710 from this worktree, PID in /tmp/tack-s8/board.pid, serving the fixed lanes.js)
**Notes**: Full tack/test suite: 210 tests, 210 pass, 0 fail (208 plus two). Mutation bench: with the old lanes.js both new tests fail and the other six lanes-view tests stay green. The receiver test uses a strict stub that throws for any `this` other than undefined or globalThis. No unattended decisions.
**Prompt document name**: 2026-10-20 00:18

## 2026-10-20 — fix: Tack slice 8, lane closure by any commit mention and prompt Status, whole ids in the table
**Prompt**: P-2026-10-20-0040: the Lanes page listed 14 waiting lanes where the 4700 board showed 1, and the Last 24 hours table cut the Prompt-ID. Finding first: the git collector keeps ONE unit per commit (the Unit trailer or the final «(P-...)» suffix); e0fd6d286 has the suffix P-2026-10-19-2225, so P-2026-10-19-1800 and -2140, named unparenthesised in the same subject, were never stored and the closure join could not see them. Closure now has two sources: any Prompt-ID in a commit subject or body after the lane ended (schema 7 table commit_ids), and the Status: line of the lane's prompt at HEAD starting eseguito or done (lanes.prompt_status)
**Files touched**: tack/src/store/schema-7.sql (new), tack/src/store/open.mjs, tack/src/contract/linkage.mjs, tack/src/collectors/git/collect.mjs, tack/src/collectors/git/run.mjs (comment), tack/src/collectors/lane-run/collect.mjs, tack/src/board/api.mjs, tack/src/board/lanes.js, tack/src/board/board.css, tack/test/lane-closure.test.mjs (new), tack/test/lanes-api.test.mjs, tack/test/lanes-view.test.mjs, tack/test/lanes.test.mjs (schema 7 assertion), docs/prompts/claude_2026-10-20_0040_prompt_tack_s8_lanes_fixes.md (Status, copied from the trunk), docs/log-inbox/tack.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-19 23:30
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23; board restarted on 4710 from this worktree, PID in /tmp/tack-s8/board.pid)
**Notes**: Causa (c): the Q2 rule was ratified without measuring it on the real store, where a commit names several ids and one reaches the unit slot. Out-of-scope: schema 7 and a new test file (under tack/**). 4710: Waiting 14 -> 1 (P-2026-10-20-0015, as 4700). Store kept, upgraded 6 -> 7 in place; first start re-reads git (41-49 s), first status pass about 8 s once, then 0.4 s a minute. A deleted checkout as git cwd threw; handled. 218 tests pass.
**Prompt document name**: 2026-10-20 00:40

## 2026-10-20 — merge: tack-s8 into alfonso-frontend-jjtl (P-2026-10-20-0052)
**Prompt**: `claude_2026-10-20_0052_prompt_merge_tack-s8.md`, a direct merge by `lane-run merge --direct`, no session: `tack-s8` at `e68c140bb` into `alfonso-frontend-jjtl`, merge base `0a200b188`, 12 commits on the branch side.
**Files touched**: merge `56c66ea52`: 23 files from the branch side (`docs/discovery/discovery_2026-10-19_tack_lanes_page.md`, `docs/log-inbox/tack.md`, `docs/prompts/claude_2026-10-19_2320_prompt_tack_s8_lanes_page_disc.md`, `tack/README.md`, `tack/src/board/api.mjs`, `tack/src/board/board.css`, `tack/src/board/board.js`, `tack/src/board/lanes.js`, and 15 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `56c66ea52` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9436 tests in 384 files, 9 red at import, hooks 952; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat checked the Lanes tab on 4710 from the tack-s8 worktree at e68c140bb (renders, Waiting 0 vs 14 before the fix, P-2026-10-19-1800 and 2140 not listed, Prompt-IDs whole, titles wrap, running and last-24h sections populated); tack code at the merge identical to the checked tip; decided under R-TACK-4
**Notes**: Rollback tag `pre-tack-s8` on `87eba6097` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-20-0052/result.json`.
**Prompt document name**: 2026-10-20 00:52

## 2026-10-21 — merge: tack-spec into alfonso-frontend-jjtl (P-2026-10-21-1023)
**Prompt**: `claude_2026-10-21_1023_prompt_merge_tack-spec.md`, a direct merge by `lane-run merge --direct`, no session: `tack-spec` at `d819de505` into `alfonso-frontend-jjtl`, merge base `c3db63f69`, 2 commits on the branch side.
**Files touched**: merge `39b1964ba`: 3 files from the branch side (`docs/discovery/discovery_2026-10-20_tack_monitor_vs_spec.md`, `docs/prompts/claude_2026-10-20_1900_prompt_tack_monitor_vs_spec_disc.md`, `tack/docs/design-monitor-vs-spec.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `39b1964ba` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11423 tests in 397 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: design note and discovery report, docs only; recommendations ratified by Alfonso 2026-10-21 10:19 (R-TACK-7)
**Notes**: Rollback tag `pre-tack-spec` on `ebbaebdb9` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1023/result.json`.
**Prompt document name**: 2026-10-21 10:23

## 2026-10-21 — feat: Tack stops, breakpoint, ceiling and hard-stop classes, auto pill
**Prompt**: P-2026-10-21-1015: a lane that ends `Outcome: hard-stop` is classed breakpoint (the prompt planned it), ceiling (context ceiling, handoff written) or hard-stop (unplanned), and a lane whose resumes all start with `[auto]` gets an auto pill. Measure first, classify in the collector (`stop_kind`, schema 8), show it on the Lanes page, the waiting tile and banner, the Last 24 hours table and the Insights outcome keys.
**Files touched**: tack/src/collectors/lane-run/collect.mjs, tack/src/store/schema-8.sql (new), tack/src/store/open.mjs, tack/src/board/api.mjs, tack/src/board/lanes.js, tack/src/board/board.css, tack/src/board/insights.js, tack/src/metrics/layer3.mjs, tack/README.md, tack/test/stops.test.mjs (new), tack/test/lanes.test.mjs, tack/test/lanes-api.test.mjs, docs/log-inbox/tack.md, docs/prompts/claude_2026-10-21_1015_prompt_tack_breakpoints.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (tack suite 231 of 231 pass; 210 before plus 21 new and adjusted)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23; board restarted on 4710 from this worktree, PID in /tmp/tack-stops/board.pid, store copy /tmp/tack-stops/real.db)
**Notes**: 677 lane folders: 193 hard-stops = 27 breakpoint, 23 ceiling, 143 hard-stop (store of 679: 27, 23, 144). 133 of 159 hard-stops had no readable prompt.txt, so the prompt falls back to input-1.md (breakpoint 11 to 27). Hand check, 10 per class: ceiling 10/10; breakpoint 10/10 plausible; hard-stop 6 right, 4 are planned stops of prompts without a HARD STOP section (the rule says hard-stop). 0 lanes carry [auto] yet. 4710, last 24 h: 12 ceiling, 3 hard-stop.
**Prompt document name**: 2026-10-21 10:15

## 2026-10-21 — feat: Tack slice 9, waiting cards, /api/attention, distinct stop events
**Prompt**: P-2026-10-21-1025 (code, stopped at the 200k context ceiling, RC-51, nothing committed) and its continuation P-2026-10-21-1117 (tests, privacy, 4710, commits): waiting lanes as cards with pill, reason, Recommended: line and linked chat, read from log.jsonl and never stored; the banner scrolls to them or holds the one card; GET /api/attention in the 4700 shape; follow-ups of P-2026-10-21-1015 (no HARD STOP section counts as breakpoint, swatches at 3:1, breakpoint/ceiling/hard-stop events).
**Files touched**: tack/README.md, tack/contract/v1/settings.json, tack/src/board/{api.mjs,board.css,lanes.js,server.mjs,waiting.mjs (new)}, tack/src/collectors/lane-run/collect.mjs, tack/src/notify/notifier.mjs, tack/test/{load,notify,settings,stops,privacy}.test.mjs, tack/test/{swatches,waiting}.test.mjs (new) (code commit 5b7c02c12); docs/log-inbox/tack.md, docs/prompts/claude_2026-10-21_1025_prompt_tack_s9_waiting_cards.md and claude_2026-10-21_1117_prompt_tack_s9_continuation.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (tack suite 252 of 252 pass; waiting.test.mjs 13 new, privacy 1 new; mutation bench: no 2 KB trim, inverted card order, newest adding commit each killed)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23; board restarted on 4710 from this worktree, PID in /tmp/tack-s9/board.pid, store copy /tmp/tack-s9/real.db)
**Notes**: 94 lanes waiting in 14 days: Recommended: 24, a ? 36, Question-for-you 5, planned-stop words 41; chat URL 68 (Request: 41, trailer 27). Rules 2: breakpoint 39, ceiling 26, hard-stop 26 (20 moved). Three fills at 3:1 is the most a 21:1 range allows (four span 27:1): bp, hard-stop, tag; ceiling by outline. 4710: 3 waiting, all ceiling. Detail and 6 decisions: ~/.jjodel-lanes/P-2026-10-21-1025/handoff.md.
**Prompt document name**: 2026-10-21 11:17

## 2026-10-21 — merge: tack-s9 into alfonso-frontend-jjtl (P-2026-10-21-1141)
**Prompt**: `claude_2026-10-21_1141_prompt_merge_tack-s9.md`, a direct merge by `lane-run merge --direct`, no session: `tack-s9` at `24334c432` into `alfonso-frontend-jjtl`, merge base `4ecf3c26f`, 2 commits on the branch side.
**Files touched**: merge `9115d32d7`: 18 files from the branch side (`docs/log-inbox/tack.md`, `docs/prompts/claude_2026-10-21_1025_prompt_tack_s9_waiting_cards.md`, `tack/README.md`, `tack/contract/v1/settings.json`, `tack/src/board/api.mjs`, `tack/src/board/board.css`, `tack/src/board/lanes.js`, `tack/src/board/server.mjs`, and 10 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `9115d32d7` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11423 tests in 397 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat checked 4710 at 11:26 from the tack-s9 worktree: waiting cards (kind pill ACK, answer, GO; reason line; waiting since; chat link), banner 3 lanes waiting, 3 ceilings, /api/attention in the 4700 shape, 1.8 KB
**Notes**: Rollback tag `pre-tack-s9` on `1df2d6037` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1141/result.json`.
**Prompt document name**: 2026-10-21 11:41

## 2026-10-21 — feat: Tack S1, trace-source boundary around lane-run
**Prompt**: P-2026-10-21-1210: an adapter interface in tack/src/collectors/ with lane-run behind it and the Prompt-ID pattern out of contract/, no behaviour change (parity jjodel byte-identical); a two-run guard test; drop the stale lanes.outcome column if nothing outside the collector and the API reads it.
**Files touched**: code commit 3e095ad20: tack/src/collectors/{source.mjs,active.mjs,lane-run/config.mjs,lane-run/source.mjs} (new), tack/src/collectors/{lane-run/collect.mjs,layers.mjs}, tack/src/contract/{validate.mjs,linkage.mjs}, tack/contract/v1/{entry.json,unit.json,README.md}, tack/src/board/server.mjs, tack/src/notify/watch.mjs, tack/bin/tack.mjs, tack/test/source.test.mjs (new); this commit: docs/log-inbox/tack.md, docs/prompts/claude_2026-10-21_1210_prompt_tack_s1_adapter_boundary.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (parity jjodel on a frozen lane and store copy: text and --json cmp identical before and after; tack check on 23 fixtures identical to HEAD; 248 existing tests unchanged plus 5 new, 253 of 253 pass; mutation bench: live false on a last outcome done killed by the two-run test)
**Out-of-scope changes**: no (17 files, all inside DOVE tack/** plus the inbox and the Status line; above five, RC-11, listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23; board restarted on 4710 from this worktree, TACK_NOTIFY=off, store /tmp/tack-s8/real.db)
**Notes**: Item 3 not applied: lanes.outcome is read by metrics/layer3.mjs:62 and :82 (final state of laneFirstShot, which parity jjodel compares, and the outcome metric), so the writer, API field and column stay. Item 2 passed on the first run: lane-run removes exit.txt at launch (lane-run.mjs:532), so the fixture keeps run 1's exit in runs.jsonl. Still importing the collector by path: parity/jjodel.mjs (Jjodel adapter), board/waiting.mjs (lane-folder reader).
**Prompt document name**: 2026-10-21 12:10

## 2026-10-21 — merge: tack-s1a into alfonso-frontend-jjtl (P-2026-10-21-1246)
**Prompt**: `claude_2026-10-21_1246_prompt_merge_tack-s1a.md`, a direct merge by `lane-run merge --direct`, no session: `tack-s1a` at `601b73a7a` into `alfonso-frontend-jjtl`, merge base `be844ba6d`, 2 commits on the branch side.
**Files touched**: merge `8dec8e774`: 17 files from the branch side (`docs/log-inbox/tack.md`, `docs/prompts/claude_2026-10-21_1210_prompt_tack_s1_adapter_boundary.md`, `tack/bin/tack.mjs`, `tack/contract/v1/README.md`, `tack/contract/v1/entry.json`, `tack/contract/v1/unit.json`, `tack/src/board/server.mjs`, `tack/src/collectors/active.mjs`, and 9 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `8dec8e774` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11427 tests in 398 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat checked 4710 at 12:34 from the tack-s1a worktree: board 200, /api/attention in the 4700 shape (3 running), /api/lanes 200; parity jjodel byte-identical per the lane
**Notes**: Rollback tag `pre-tack-s1a` on `99072d5fd` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1246/result.json`.
**Prompt document name**: 2026-10-21 12:46

## 2026-10-21 — feat: Tack v0 closure, v0.1.0, bounded repos output, first run on two foreign repositories
**Prompt**: P-2026-10-21-1330: bound `tack repos` (one line per repository, toplevels truncated with a count, columns capped at 60), a first-run check with a fresh store from the root of `~/harness-book` and `~/harness-exp/sprotty`, an install and first-run section and the v0 Status line in the README, version 0.1.0 with `tack --version`.
**Files touched**: code commit daa7c6077: tack/src/cli/table.mjs (new), tack/test/cli-table.test.mjs (new), tack/bin/tack.mjs, tack/package.json, tack/README.md; this commit: docs/log-inbox/tack.md, docs/prompts/claude_2026-10-21_1330_prompt_tack_v0_closure.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (node --test on tack/test: 257 of 257 pass, 253 existing plus 4 new, privacy tests included; the first-run table below complete for both repositories)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23)
**Notes**: Item 1 was a real defect, not a guard: on the real store Jjodel's row listed 61 toplevels on one line; it now reads `~/jjodel +60 more`. Each run took about 60 s for the full scan (689 sessions, 7216 commits); nothing under ~/.tack changed, and the board exited 0 on SIGTERM. Finding below, filed as a ticket: a repository with no session is not in the store, so the board falls back to all repositories. README now says so.
**Prompt document name**: 2026-10-21 13:30

First run, `TACK_STORE=/tmp/tack-v0/<name>.db node tack/bin/tack.mjs board --no-open --port 4711` from the repository root, API read with `?repo=` set to the preselected key as the page does:

| | ~/harness-book | ~/harness-exp/sprotty |
|---|---|---|
| preselected | f2dc73809657 (harness-book, 1 worktree, 33 commits) | none: «repository: none here, all repositories» |
| sessions of the repository | 1 (link direct, no unit) | 0; the page shows all 689 sessions of 5 repositories |
| cost known / unknown | 1 / 0 | n/a (all repositories: 686 / 3) |
| layer 1 | 9 of 9 computed | computed over all repositories |
| layers 2-3 `not-adopted` | 8 of 8 (commits_per_unit, cost_per_unit, resumes_per_unit, outcome, first_shot, cause_tally, regression_rate, out_of_scope_rate) | n/a: all repositories, computed from Jjodel's data |
| Lanes tab | state `empty`: «No lane-run lanes for this repository» | state `ok`, Jjodel's lanes (no selection) |
| /api/attention | 200, 1220 bytes, the 4700 shape | 200, 1220 bytes |
| `git status --porcelain --ignored` before / after | identical (4 lines) | identical (1 line) |

**Ticket** (medium): repositories are found only from session directories, so a git work tree with no Claude Code session (the Sprotty clone) is not in the store and `tack board` started there preselects nothing and shows every repository's data. A first-run user in a fresh repository sees someone else's work. Candidate for v0.1: register the launching work tree and show «no session yet» for it.

## 2026-10-21 — merge: tack-v0 into alfonso-frontend-jjtl (P-2026-10-21-1438)
**Prompt**: `claude_2026-10-21_1438_prompt_merge_tack-v0.md`, a direct merge by `lane-run merge --direct`, no session: `tack-v0` at `31f34732b` into `alfonso-frontend-jjtl`, merge base `77eba1327`, 2 commits on the branch side.
**Files touched**: merge `61164a7c8`: 7 files from the branch side (`docs/log-inbox/tack.md`, `docs/prompts/claude_2026-10-21_1330_prompt_tack_v0_closure.md`, `tack/README.md`, `tack/bin/tack.mjs`, `tack/package.json`, `tack/src/cli/table.mjs`, `tack/test/cli-table.test.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `61164a7c8` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11427 tests in 398 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat checked the tack-v0 worktree at 13:56: tack --version 0.1.0, README Status line as prescribed, bounded tack repos (~/jjodel +60 more), 4710 200
**Notes**: Rollback tag `pre-tack-v0` on `213243815` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1438/result.json`.
**Prompt document name**: 2026-10-21 14:38

## 2026-10-21 — fix: Tack v0b, preselect the start work tree when it has no session
**Prompt**: P-2026-10-21-1500: when the start directory is a git work tree the store does not hold, preselect it as unrecorded instead of all repositories; one empty-state line on Lanes, Sessions, Timeline and Insights and empty API answers for it; tests; README «Install and first run»; re-run the Sprotty first-run check.
**Files touched**: code commit 82cdc7792: tack/src/board/{api.mjs,server.mjs,board.js}, tack/test/first-run.test.mjs (new), tack/README.md; this commit: docs/log-inbox/tack.md, docs/prompts/claude_2026-10-21_1500_prompt_tack_v0b_first_run.md (Status)
**Outcome**: ✅ completed
**Corregge**: 2026-10-21 13:30 (P-2026-10-21-1330)
**Causa**: (c)
**Regressions**: no (node --test on tack/test: 264 of 264 pass, 257 existing plus 7 new, privacy tests included)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (visual check by the chat after exit, RC-23)
**Notes**: Key of the unrecorded work tree: its lowest root commit, the key identify() would give it, so a later session turns it into the stored row with no URL change (rescan drops `unrecorded`); a work tree with no commit gets a SHA-1 of its toplevel. /api/attention and the notifier's base repository unchanged. README also corrected in the board section and the /api/repos row, same behaviour.
**Prompt document name**: 2026-10-21 15:00

First run, `TACK_STORE=/tmp/tack-v0b/sprotty.db node tack/bin/tack.mjs board --no-open --port 4711` from `~/harness-exp/sprotty`, no flag, API read with `?repo=` set to the preselected key as the page does:

| | ~/harness-exp/sprotty |
|---|---|
| preselected | 36a4e5574719 (sprotty, `unrecorded`); CLI «repository: sprotty, no recorded session» |
| scan | 98 s, 696 sessions, 7241 commits, 5 stored repositories (none of them sprotty) |
| sessions / timeline of the repository | 0 / 0 |
| metrics | sessions 0; 9 computed (layer 1, over no session), 8 `not-adopted` |
| Lanes tab | state `empty`: «No Claude Code sessions recorded for sprotty yet.» |
| keys of the other 5 repositories in the four tab answers | 0 |
| /api/attention | 200, 1145 bytes, the 4700 shape, unchanged route |
| `git status --porcelain --ignored` before / after | identical (1 line) |
| exit on SIGTERM | 0 |

## 2026-10-21 — merge: tack-v0b into alfonso-frontend-jjtl (P-2026-10-21-1558)
**Prompt**: `claude_2026-10-21_1558_prompt_merge_tack-v0b.md`, a direct merge by `lane-run merge --direct`, no session: `tack-v0b` at `9d69c1647` into `alfonso-frontend-jjtl`, merge base `8f3e52ef3`, 2 commits on the branch side.
**Files touched**: merge `f46cec60d`: 7 files from the branch side (`docs/log-inbox/tack.md`, `docs/prompts/claude_2026-10-21_1500_prompt_tack_v0b_first_run.md`, `tack/README.md`, `tack/src/board/api.mjs`, `tack/src/board/board.js`, `tack/src/board/server.mjs`, `tack/test/first-run.test.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f46cec60d` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11507 tests in 400 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat checked v0b at 15:24 from ~/harness-exp/sprotty on 4712: preselected sprotty unrecorded, sessions/lanes/timeline/metrics empty, 0 keys of other repositories, clone git status unchanged
**Notes**: Rollback tag `pre-tack-v0b` on `fcd03e0c0` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1558/result.json`.
**Prompt document name**: 2026-10-21 15:58
