# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---


## 2026-10-03 — feat: auto-intake core for issue-driven unattended lanes (P-2026-10-03-1705)
**Prompt**: `claude_2026-10-03_1705_prompt_auto_intake.md`: Phase 1 discovery (`c5bb487a8`, `docs/discovery/discovery_2026-10-03_auto_intake.md`), then after the GO `frontend/scripts/auto-intake.mjs` (queue, render, cut, admit, guard, ledger, trip; RC-35..RC-39), its configuration and discovery template, and `lane-run start --auto` (RC-36: no GitHub credentials, no web tools, no MCP servers, auto.json kept by a resume).
**Files touched**: `frontend/scripts/auto-intake.mjs`, `frontend/scripts/auto-intake.config.json`, `frontend/scripts/lane-templates/issue-discovery.md`, `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/autoIntake.test.ts`, `frontend/scripts/hooks/__tests__/fixtures/auto-intake-gh.json`, `frontend/scripts/hooks/__tests__/laneRun.test.ts` (`630d82e19`); this commit: the report addendum (COME 5), the prompt's Status and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tests first, 70 red. Mutation bench: lane-run --auto 12/12, auto-intake 83/84, the survivor equivalent (commit body). Provisional, awaiting Alfonso, amends RC-39: shadow prompts render `Lane: discovery` from `laneByMode`, light by `tierRule` (checked on the dry render of #169); live renders `Lane: full`. Dry check: queue empty; admit tonight `deny: pace` (0.54 vs 0.16). `rm -rf` is denied: /tmp/ai-disc, /tmp/ai-bench, /tmp/ai-tier remain. Report addendum: section 12.
**Prompt document name**: 2026-10-03 17:05

## 2026-10-03 — merge: auto-intake into alfonso-frontend-jjtl (P-2026-10-03-1840)
**Prompt**: `claude_2026-10-03_1840_prompt_merge_auto-intake.md`, a direct merge by `lane-run merge --direct`, no session: `auto-intake` at `c5b8279d8` into `alfonso-frontend-jjtl`, merge base `49957d340`, 3 commits on the branch side.
**Files touched**: merge `ef5cb6a6f`: 10 files from the branch side (`docs/discovery/discovery_2026-10-03_auto_intake.md`, `docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-03_1705_prompt_auto_intake.md`, `frontend/scripts/auto-intake.config.json`, `frontend/scripts/auto-intake.mjs`, `frontend/scripts/hooks/__tests__/autoIntake.test.ts`, `frontend/scripts/hooks/__tests__/fixtures/auto-intake-gh.json`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, and 2 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ef5cb6a6f` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7083 tests in 280 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: harness only, no app change: the chat read result.json, all eight gates green on ef5cb6a6f; no visual check needed
**Notes**: Rollback tag `pre-auto-intake` on `7a249ef87` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1840/result.json`.
**Prompt document name**: 2026-10-03 18:40

## 2026-10-05 — feat(harness): lane board in the repo (P-2026-10-05-2340)
**Prompt**: `claude_2026-10-05_2340_prompt_lane_board_repo.md`: copy the read-only lane board of chat `C-2026-10-05-1116` byte for byte from `~/.jjodel-lanes/board/` into `frontend/scripts/lane-board/`, add its README and the `lane-board` npm script, no edit to the copied files, to `~/.jjodel-lanes/` or to the launchd agent.
**Files touched**: `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/timeline.js`, `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/README.md`, `frontend/package.json` (`b5fc46477`); this commit: the Status of the prompt file and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: md5 checked at the source, after the copy and on the committed blobs. Live on 4701 with `LANE_BOARD_CACHE` on a temp file, so `~/.jjodel-lanes/` was not written: four 200s, `/api` 337 rows with an empty error, `/api/timeline` 338 lanes. `typecheck:scripts` does not reach `.mjs`/`.js` (include: smoke, gates). Seven files, as the prompt declares. The launchd agent still runs the `~/.jjodel-lanes/board/` copy until the chat repoints it.
**Prompt document name**: 2026-10-05 23:40

## 2026-10-05 — merge: lane-board into alfonso-frontend-jjtl (P-2026-10-05-2348)
**Prompt**: `claude_2026-10-05_2348_prompt_merge_lane-board.md`, a direct merge by `lane-run merge --direct`, no session: `lane-board` at `edcaebab1` into `alfonso-frontend-jjtl`, merge base `078325ee6`, 3 commits on the branch side.
**Files touched**: merge `441bace3b`: 7 files from the branch side (`docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-05_2340_prompt_lane_board_repo.md`, `frontend/package.json`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/timeline.js`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `441bace3b` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7551 tests in 306 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on the merge (typecheck at the receiving set, vitest, build, check:docs/agents/scripts/addonly); the three board files on the trunk match the deployed md5s; harness-only merge, no visual check
**Notes**: Rollback tag `pre-lane-board` on `078325ee6` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-05-2348/result.json`.
**Prompt document name**: 2026-10-05 23:48

## 2026-10-05 — docs: every prompt declares its dependencies (P-2026-10-05-2341)
**Prompt**: `claude_2026-10-05_2341_prompt_depends_header.md`, fast lane, docs only, on `~/jjodel-w-depends`, branch `depends-header`: a `Depends:` header line for every prompt (P13 bullet), decision row RC-42, and `Depends:` among the header fields of `docs/HARNESS-DOCS.md`, so the lane board draws exact edges instead of inferring them from citations.
**Files touched**: `46aaefc02`: `docs/PROTOCOL.md` (P13, bullet after «Every prompt declares its lane»), `docs/decisions.md` (RC-42 after RC-41), `docs/HARNESS-DOCS.md` (structure note, prompt template, lifecycle figure); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. check:docs, check:agents and check:addonly exit 0 before the commit.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: `CLAUDE.md` and `AGENTS.md` do not enumerate the prompt header fields (searched for `Prompt-ID`, `Lane: `, `Chat: `, `Status: da`; positive control `Outcome: done` matched once in each), so COSA 3 raised no question and neither file was touched. The first commit attempt was refused by the bash-guard hook for a missing `Model:` trailer (P6) and retried with it.
**Prompt document name**: 2026-10-05 23:41

## 2026-10-05 — merge: depends-header into alfonso-frontend-jjtl (P-2026-10-05-2353)
**Prompt**: `claude_2026-10-05_2353_prompt_merge_depends-header.md`, a merge in a `lane-run` session (a06fbb70): `depends-header` at `d12952540` into `alfonso-frontend-jjtl`, `--no-ff` by explicit sha, merge base `078325ee6`, 3 commits on the branch side, 1 conflict measured (`docs/log-inbox/harness.md`).
**Files touched**: merge `c6d8ab56c`: 5 files from the branch side (`docs/HARNESS-DOCS.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-05_2341_prompt_depends_header.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c6d8ab56c`: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 7551 tests in 306 files (expected 7551: trunk 7551 plus 0 new on the branch), 9 red at import, hooks 424; build exit 0; check:docs 4/4; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 2026-10-06: docs-only merge (P13 Depends bullet, RC-42, HARNESS-DOCS header fields, harness inbox union); gates green on c6d8ab56c; no visual check
**Notes**: Union in `docs/log-inbox/harness.md`: the trunk's entries (2340, 2348) first, then the branch's (2341), verbatim; the result is byte-identical to the trunk's file plus the branch's block. `docs/PROTOCOL.md` changed on the branch: merged on Alfonso's go-ahead («procedi con tutte e tre», C-2026-10-05-1116). `git commit -- <paths>` is refused during a merge: the five-file index was committed without pathspec. No rollback tag; pre-merge tip `9ab14dcb0`.
**Prompt document name**: 2026-10-05 23:53

## 2026-10-06 — fix: the lane board pairs each turn with its own result (P-2026-10-06-0049)
**Prompt**: `claude_2026-10-06_0049_prompt_board_turn_pairing.md`: `laneTimeline()` paired turn k with the k-th `result` of `log.jsonl` by position, so a task-notification result (`num_turns` 0, empty, 74 ms) shifted every later turn of `P-2026-10-05-1735` and drew a false same-worktree overlap with `P-2026-10-05-2315`; `results()` now skips non-turn results, a turn is clamped to the next input, cache key `v3` to `v4`.
**Files touched**: `frontend/scripts/lane-board/lane-board.mjs` (`c2ecea5e9`); this commit: the Status of the prompt file and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Old (`HEAD~1`) vs new timelines on all 343 lanes, scratch caches, port 4701: 333 identical, 8 changed (all with a skipped task-notification result), 1 live lane skipped, 1 unexited lane (`P-2026-09-29-1017`) differs by `now` alone.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates: `node --check` 0, `check:scripts` PASS (55). 1735 turns 17:37:00-18:06:49, 22:35:28-23:03:41, 23:06:35-23:07:05; it ends 11 min before 2315 starts. 13 lanes had a skipped task-notification result, 0 a num_turns-0 empty one of another origin, the guard clamped 0 turns. Not investigated: one other same-worktree overlap, in `~/jjodel-release` (`P-2026-10-02-1445` vs `1501`, 933 s). Scratch left in `/tmp` (`lb-*`).
**Prompt document name**: 2026-10-06 00:49

## 2026-10-06 — merge: board-turns into alfonso-frontend-jjtl (P-2026-10-06-0059)
**Prompt**: `claude_2026-10-06_0059_prompt_merge_board-turns.md`, a direct merge by `lane-run merge --direct`, no session: `board-turns` at `62c2e4858` into `alfonso-frontend-jjtl`, merge base `a9cc16bc7`, 3 commits on the branch side.
**Files touched**: merge `db8c29fe3`: 3 files from the branch side (`docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-06_0049_prompt_board_turn_pairing.md`, `frontend/scripts/lane-board/lane-board.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `db8c29fe3` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7598 tests in 308 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: scripts-only merge (frontend/scripts/lane-board/lane-board.mjs): app untouched, no scene to check; board verified on 4701 by lane P-2026-10-06-0049
**Notes**: Rollback tag `pre-board-turns` on `a9cc16bc7` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-06-0059/result.json`.
**Prompt document name**: 2026-10-06 00:59

## 2026-10-10 — fix(harness): lane board lists earlier lanes newest first (P-2026-10-10-0840)
**Prompt**: `claude_2026-10-10_0840_prompt_lane_board_earlier_order.md`: in "Earlier lanes" the rows of each day follow the CLI order (id descending, chains appended), so a chain sat at the bottom of its day. Keep the time on the row and sort each day by time descending, ties by id descending. Fast lane, one file.
**Files touched**: `frontend/scripts/lane-board/lane-board.mjs` (`c8e99fc2c`, 2 lines: `t` on the row in `collect()`, the sort in `renderOlder`); this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` and `check:scripts` pass; `/api` on 4701 returns a numeric `t` on 354 of 354 rows, none 0; the chat's DOM read on 4701 found all 11 earlier days strictly newest first.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, built-in browser on 4701 (RC-23): all 11 earlier days strictly newest first by DOM read; on 2026-10-04 `chain-P-2026-10-04-1130` at index 7 between `1213` and `1025`; board on 4701 stopped.
**Notes**: Measured on 2026-10-04: the chain moves from index 15 of 16 to 7, between `1213` and `1025`; `t` is non-increasing across the day. Board on 4701 (PID 21803) stopped by the chat after the visual check. Port 4700, launchd and `~/.jjodel-lanes/board/` untouched.
**Prompt document name**: 2026-10-10 08:40

## 2026-10-10 — merge: lane-board-order into alfonso-frontend-jjtl (P-2026-10-10-0843)
**Prompt**: `claude_2026-10-10_0843_prompt_merge_lane-board-order.md`, a direct merge by `lane-run merge --direct`, no session: `lane-board-order` at `9a308dc0b` into `alfonso-frontend-jjtl`, merge base `d87d9353b`, 2 commits on the branch side.
**Files touched**: merge `02a7d1857`: 2 files from the branch side (`docs/log-inbox/harness.md`, `frontend/scripts/lane-board/lane-board.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `02a7d1857` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7666 tests in 311 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat, unattended: scripts-only merge (frontend/scripts/lane-board/lane-board.mjs), app untouched; earlier-lanes order verified in the built-in browser on 4701 under P-2026-10-10-0840
**Notes**: Rollback tag `pre-lane-board-order` on `d87d9353b` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-0843/result.json`.
**Prompt document name**: 2026-10-10 08:43

## 2026-10-10 — feat(harness): prompts name the request they answer (P-2026-10-10-1150)
**Prompt**: `claude_2026-10-10_1150_prompt_request_traceability.md`: P13 bullet and row RC-43 (`Request:` header, the words of the request kept outside the repo as `request.md`), `lane-run start --request <file>` with a warning when a prompt names no request, `Request:` in the issue-discovery template, the `request` field of the board's timeline and its block in the lane detail.
**Files touched**: `docs/PROTOCOL.md`, `docs/decisions.md` (`41f62884d`); `frontend/scripts/lane-run.mjs`, `frontend/scripts/lane-templates/issue-discovery.md`, `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/timeline.js` (`79c0307dc`); the closure commit: this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. laneRun, laneRunDirect, autoIntake 188/188; check:scripts, typecheck:scripts, check:addonly, check:docs exit 0; typecheck 14 (baseline); build exit 0.
**Out-of-scope changes**: no — six files over two commits, above five (RC-11, rule 19), each named in the prompt's WHAT; the docs commit is split from the code commit by P13 ("Docs e codice mai nello stesso commit"), as RC-42 was.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, built-in browser on 4701 (RC-23), DOM read of the Timeline detail: 0840 and 1150 show their `request.md` in a blockquote with line breaks, 1150 links its session URL in a new tab, 0810 shows `Request: not recorded`; board on 4701 (PID 29457, cache in `/tmp`) stopped by the chat.
**Notes**: Cache fix: key on the mtime of `request.md` (v5), the smaller change; checked on 4702 over a temp lane root, an exited lane read empty then carried a later `request.md`. Refusals of `--request` (missing, empty, no value) exit 2 before any write; the warning, the copy and the merge exemption checked with a fake `claude` in a temp HOME. `rm -rf` is denied: `/tmp/lr-req-*` remain. `chain` does not forward `--request`: see the closing report.
**Prompt document name**: 2026-10-10 11:50

## 2026-10-10 — merge: prompt-request into alfonso-frontend-jjtl (P-2026-10-10-1204)
**Prompt**: `claude_2026-10-10_1204_prompt_merge_prompt-request.md`, a merge run by a `lane-run` session: `prompt-request` at `dfbba3964` into `alfonso-frontend-jjtl`, `--no-ff` of the explicit sha, merge base `4f059689c`, 3 commits on the branch side.
**Files touched**: merge `49b31da4a`: 7 files from the branch side (`docs/PROTOCOL.md`, `docs/decisions.md`, `docs/log-inbox/harness.md`, `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/timeline.js`, `frontend/scripts/lane-run.mjs`, `frontend/scripts/lane-templates/issue-discovery.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `49b31da4a` in the session: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 7716 tests in 316 files, 9 red at import, as expected (trunk and branch tip both 7716, no new tests), hooks 424; build exit 0; check:docs 4/4; check:agents green; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: scripts and docs only (lane-run, lane board, issue template, PROTOCOL P13, decisions), app untouched, no scene to check on 3001; board verified on 4701 under P-2026-10-10-1150
**Notes**: merge-tree zero conflicts, tree `8ec319011` equal to the merge's index tree. Union: none. Probes: RC-43 1, RC-44 0, 1150 heading 1. Governance: `docs/PROTOCOL.md`, under the go-ahead. No rollback tag (not asked). P-2026-10-10-1150 still reads `Status: da eseguire` on the trunk; the chat flips it. Step 6 names `616344b3c` as the pre-merge tip, the real one was `ca372edea`; not exercised, check:addonly passed.
**Prompt document name**: 2026-10-10 12:04

## 2026-10-10 — feat(harness): chain forwards --request to its lanes (P-2026-10-10-1243)
**Prompt**: `claude_2026-10-10_1243_prompt_chain_request.md`, fast lane on `~/jjodel-w-chainreq`, branch `chain-request`: `lane-run chain` takes `--request <file>`, refused as `start` refuses it before any lane starts, kept as `request.md` in the chain folder and passed to the `start` of every lane; the merge of `--merge-after` gets none (RC-43).
**Files touched**: code `f552d0e00`: `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts`; this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` exit 0; laneRun and laneRunDirect 124/124; check:scripts PASS 57 files; typecheck:scripts exit 0. No real session started.
**Out-of-scope changes**: no — the tests sit in `laneRunDirect.test.ts`, the lane-run test file that holds the `chain` harness (`chainLab`), not in `laneRun.test.ts`.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: harness script only (lane-run chain), no UI to check; tests and gates read from the report
**Notes**: On base `4d00d2634` tests 1-2 red (`unknown option for chain: --request`), test 3 green by design: it pins today's chain without `--request`. 3/3 after. Mutation bench 7/7 killed, listed in the commit body. `chain.json` gains `request` (path or null). The merge lane's exemption holds by construction (merge spawned without `--request`), not tested. `rm -rf` denied: `/tmp/lrbench-7hCl` remains.
**Prompt document name**: 2026-10-10 12:43

## 2026-10-10 — merge: chain-request into alfonso-frontend-jjtl (P-2026-10-10-1250)
**Prompt**: `claude_2026-10-10_1250_prompt_merge_chain-request.md`, a direct merge by `lane-run merge --direct`, no session: `chain-request` at `3a9e87808` into `alfonso-frontend-jjtl`, merge base `4d00d2634`, 2 commits on the branch side.
**Files touched**: merge `829073426`: 3 files from the branch side (`docs/log-inbox/harness.md`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts`, `frontend/scripts/lane-run.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `829073426` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7728 tests in 317 files, 9 red at import, hooks 427; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat, unattended: harness script only (lane-run chain), app untouched, no scene to check on 3001
**Notes**: Rollback tag `pre-chain-request` on `18d9dfb57` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1250/result.json`.
**Prompt document name**: 2026-10-10 12:50

## 2026-10-10 — feat(harness): lane board shows when each lane started and ended (P-2026-10-10-1253)
**Prompt**: `claude_2026-10-10_1253_prompt_lane_board_start_end.md`, fast lane on `~/jjodel-w-boardtimes`, branch `lane-board-times`: each `/api` row gains `start` and `end` (epoch ms) from the turn computation; the Lanes tab gains `Started` (all three tables) and `Ended` (Last 24 hours, Earlier lanes) before `Elapsed`. Second turn, the chat's corrections (RC-25): reference day today, group day in Earlier lanes; Elapsed becomes the working time.
**Files touched**: code `635ddc919` and `b8fa0e1bc`: `frontend/scripts/lane-board/lane-board.mjs`; this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` exit 0; check:scripts PASS 57 files. Board on 4701 (cache in /tmp): 374 rows, all with `start`; P-2026-10-10-1150 11:51 → 12:03, Elapsed 10 min (was 0); running lanes have `end` 0; client table run on real and synthetic rows (yesterday, other group day).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, built-in browser on 4701 (RC-23), DOM read of the Lanes tab: Started in Running, Started and Ended before Elapsed in the other two; 1150 11:51 to 12:03, Elapsed 10 min (was 0); running 0105 start 01:04, 2 h 3 min. Date prefix not on screen (no lane from yesterday in the 24 h window), covered by the lane's client table run
**Notes**: Path: `laneSpan()` reuses `laneTimeline()` and its cache, and returns `work`, the sum of the turns (running turn up to now); a chain takes its lanes' earliest start, latest end once all ended, summed work. `collect()` also writes the timeline cache. `minutes` (lane-run's last run) stays and feeds Left. Elapsed is empty when no turn is known. P-2026-09-29-1017 (no exit.txt, dead pid) shows no end.
**Prompt document name**: 2026-10-10 12:53

## 2026-10-10 — merge: lane-board-times into alfonso-frontend-jjtl (P-2026-10-10-1312)
**Prompt**: `claude_2026-10-10_1312_prompt_merge_lane-board-times.md`, a direct merge by `lane-run merge --direct`, no session: `lane-board-times` at `b31127d58` into `alfonso-frontend-jjtl`, merge base `8acff31ef`, 3 commits on the branch side.
**Files touched**: merge `339959aed`: 2 files from the branch side (`docs/log-inbox/harness.md`, `frontend/scripts/lane-board/lane-board.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `339959aed` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7728 tests in 317 files, 9 red at import, hooks 427; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat, unattended: scripts-only (lane board), app untouched; Lanes tab verified on 4701 under P-2026-10-10-1253
**Notes**: Rollback tag `pre-lane-board-times` on `8acff31ef` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1312/result.json`.
**Prompt document name**: 2026-10-10 13:12

## 2026-10-10 — feat(harness): every prompt names its front, Check E (P-2026-10-10-1500)
**Prompt**: `claude_2026-10-10_1500_prompt_lane_tracking_A_fronts.md`, full lane on `~/jjodel-w-lanetrack`, branch `lane-tracking`, lane A of the discovery P-2026-10-10-1330: the front registry `docs/harness/fronts.json` (seven open fronts, milestones 1..7, board Project 2), `frontend/scripts/lane-tracking.mjs` (`loadFronts`, `parseFrontLine`, `frontProblem`, `FRONT_FROM`), Check E in `check-docs.ts`, the P13 bullet, HARNESS-DOCS §4.1, RC-44. No GitHub call, `lane-run.mjs` untouched.
**Files touched**: code `73af7bbac`: `frontend/scripts/lane-tracking.mjs`, `frontend/scripts/gates/check-docs.ts`, `frontend/scripts/gates/__tests__/checkDocs.test.ts`, `frontend/scripts/hooks/__tests__/laneTracking.test.ts`; docs `8ab16688f`: `docs/harness/fronts.json`, `docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md`, `docs/decisions.md`; this commit: this entry and the Status lines of this prompt and of `claude_2026-10-10_1330_prompt_lane_tracking_github_discovery.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. check:docs 5/5 exit 0, Check E 1 of 816 prompts in scope; a scratch copy of the prompt without `Front:` exit 1, one ERROR line, deleted. check:scripts 59 files, typecheck:scripts exit 0 (allowJs import, positive control TS2305/TS2307), typecheck 14 (baseline set), vitest scripts/gates and scripts/hooks 737/737, build exit 0, check:agents exit 0. Mutation bench 6/6, control 15/15.
**Out-of-scope changes**: yes — eleven files over three commits, above five (RC-11), each named by the prompt's COSA except `checkDocs.test.ts`: its throwaway tree needs `lane-tracking.mjs`, `docs/prompts/` and a registry, and its `4/4` read `5/5`, or every case breaks; it also gained four Check E cases and three mutants.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: P6 asks the commit type of the prompt, which names none: chose feat(harness) and docs, as the earlier harness lanes (RC-11). HARNESS-DOCS §4.1 got two lines, Front in the field list and one template line. Left out, not in scope: §6 (check:docs row) and §7 :430 still lack Check E and Front; the chat updates the KB copy of HARNESS-DOCS (P10). Bench 6/6 in the body of 73af7bbac.
**Prompt document name**: 2026-10-10 15:00

## 2026-10-10 — feat(harness): lane-run projects each lane onto its GitHub card (P-2026-10-10-1532)
**Prompt**: `claude_2026-10-10_1532_prompt_lane_tracking_B_projection.md`, full lane on `~/jjodel-w-lanetrack`, branch `lane-tracking`, lane B of the discovery P-2026-10-10-1330: `projectLane`, `syncCard` and `trackLane` in `lane-tracking.mjs`; the seam in `lane-run.mjs` (the start refusal, one `card:` line from start, resume, status, the chain supervisor and go on a direct merge, `track <id> | --sync [--dry-run]`); fake-gh tests and the bench; one live sync; HARNESS-DOCS §6 and §7.
**Files touched**: code `d52b06c4d`: `frontend/scripts/lane-tracking.mjs`, `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneTracking.test.ts`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/hooks/__tests__/fixtures/fake-gh.cjs` (new); docs `c9d0bb68d`: `docs/HARNESS-DOCS.md`; this commit: this entry, two tickets and the Status of the prompt. Outside the tree: `~/.jjodel-lanes/_tracking/config.json`, the enable switch item 4 asks for.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. check:scripts PASS 60 files; typecheck:scripts exit 0; typecheck 14, the baseline set; vitest scripts/hooks and scripts/gates 781/781 (737 before); check:docs 5/5 exit 0; build exit 0. Mutation bench 17/17 killed, control 59/59 (commit body of `d52b06c4d`).
**Out-of-scope changes**: yes — eight files over three commits, above five (RC-11). COSA 1 to 5 name each one except `fixtures/fake-gh.cjs`, the fake gh of COSA 3, kept as one file so both suites run the same fake. The inbox and the prompt are the closure. `docs/PROTOCOL.md` untouched: `track` went to HARNESS-DOCS §7, the prompt's «P13 or §7».
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Live sync once: issue 1, P-2026-10-10-1500, closed, Done, harness; issue 2, P-2026-10-10-1532, open, In progress, harness (read back with gh). Second sync: 0 gh calls (recording wrapper). P-2026-10-10-1520 and P-2026-10-10-1600 got `none:` and no card (tickets below). A discovery hard stop: the title or file name says discovery and no GO has reached the lane. Tests written after the code; the bench is the evidence.
**Prompt document name**: 2026-10-10 15:32

## 2026-10-10 — ticket: trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge
**Ticket**: Two prompts committed on `alfonso-frontend-jjtl` after lane A's cut-off have no `Front:` line, because the trunk does not carry RC-44 yet: `claude_2026-10-10_1520_prompt_lane_board_model_insights_discovery.md` (P-2026-10-10-1520, chat C-2026-10-10-1512) and `claude_2026-10-10_1600_prompt_stale_m1_edge_discovery.md` (P-2026-10-10-1600, chat C-2026-10-10-0057). Measured: a scratch copy of the second in `~/jjodel-w-lanetrack` turns `npm run check:docs` to exit 1 (Check E, one ERROR), then removed. So the merge of `lane-tracking` into the trunk goes `blocked` on its check:docs gate, and every trunk prompt written before that merge adds to the list. `lane-run track --sync` gives both `none:` and no card. Not amended here (NON FARE: no `Front:` line on past prompts): the chat chooses between adding the lines on the trunk before the merge and moving `FRONT_FROM`.
**Priority**: high
**Found in**: P-2026-10-10-1532

## 2026-10-10 — ticket: issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes
**Ticket**: `frontend/scripts/lane-templates/issue-discovery.md` renders Prompt-ID, Chat, Request, Lane, Tier and Status, and no `Front:`. Once this lane's `lane-run.mjs` is on the trunk, `lane-run start --auto` refuses every auto-intake prompt with a Prompt-ID at or after `P-2026-10-10-1500` (no `Front:` line, P13, RC-44). Report P-2026-10-10-1330 §9 answer 14 puts `Front: maintenance` in the template and its render in `auto-intake.mjs` in lane B; this prompt's COSA does not list them, so they were not touched. A fast lane before the next `/lane auto` night.
**Priority**: medium
**Found in**: P-2026-10-10-1532

## 2026-10-10 — fix(harness): front cut-off to P-2026-10-11-0000, auto-intake renders Front (P-2026-10-10-1612)
**Prompt**: `claude_2026-10-10_1612_prompt_lane_tracking_C_cutoff_intake.md`, full lane on `~/jjodel-w-lanetrack`, branch `lane-tracking`, lane C of the discovery P-2026-10-10-1330: the trunk merged in first (`--no-ff`), `FRONT_FROM` moved to `P-2026-10-11-0000` with the tests and texts that pin it, `Front: <slug>` rendered by the auto-intake template from a new config key, lane B's two tickets closed.
**Files touched**: merge `ab3a04f42` (trunk at `d1449992a`; `docs/decisions.md` resolved, RC-44 then RC-45 verbatim); code `0955ef140`: `frontend/scripts/lane-tracking.mjs`, `frontend/scripts/auto-intake.mjs`, `frontend/scripts/auto-intake.config.json`, `frontend/scripts/lane-templates/issue-discovery.md`, `frontend/scripts/gates/__tests__/checkDocs.test.ts`, `frontend/scripts/hooks/__tests__/autoIntake.test.ts`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/hooks/__tests__/laneTracking.test.ts`; docs `1d94d279a`: `docs/PROTOCOL.md` (P13), `docs/HARNESS-DOCS.md` (§6, Check E row); this commit: this entry, two tickets and the Status of the prompt.
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 15:00 (`claude_2026-10-10_1500_prompt_lane_tracking_A_fronts.md`, its cut-off; ticket 2 is the template lane B left out, 2026-10-10 15:32)
**Causa**: (a)
**Regressions**: no. check:docs 5/5 exit 0; check:scripts PASS 60 files; typecheck:scripts exit 0; vitest scripts/hooks and scripts/gates 782/782 (781 before); typecheck 14, the baseline set; build exit 0; check:addonly and check:agents exit 0.
**Out-of-scope changes**: no — twelve files over three commits plus the merge, above five (RC-11, rule 19), each named by COSA 0 to 3; the new test sits in `autoIntake.test.ts`, describe «auto-intake render».
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Check E after the merge, before item 1: exit 1, red on 1520 and 1600 only. After it: 0 of 820 in scope, so the control was a scratch P-2026-10-11-0001 without Front (exit 1, one ERROR, removed). Bench in the body of 0955ef140: cut-off dropped killed by its named test; auto-intake 6/6; controls 48/48 and 68/68. The template has no Depends: line, so Front sits after Tier, before Status. lane-run.mjs untouched. The bash guard refused an amend of the merge message; it stands.
**Prompt document name**: 2026-10-10 16:12

**Ticket** (closed here): the two tickets of 2026-10-10 found in P-2026-10-10-1532. «trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge» (high) is closed by the cut-off move: Check E no longer reads P-2026-10-10-1520 and -1600. «issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes» (medium) is closed by item 2: a render dated after the cut-off passes `frontProblem` (test in `autoIntake.test.ts`).

## 2026-10-10 — ticket: the moved cut-off leaves this lane's GitHub card open, In progress
**Ticket**: `projectLane` and `track --sync` skip every Prompt-ID below `FRONT_FROM`, now `P-2026-10-11-0000`, so P-2026-10-10-1500, -1532 and -1612 are no longer projected. Cards 1 and 2 are already closed, Done (`~/.jjodel-lanes/_tracking/`); card 3, `jjodel-modeling/jjodel-lanes` issue 3 for P-2026-10-10-1612, was recorded `In progress`, open, and no sync will move it. Not touched here (NON FARE: no GitHub write). The chat closes it by hand, or a lane gives the projection its own cut-off.
**Priority**: low
**Found in**: P-2026-10-10-1612

## 2026-10-10 — ticket: issue-discovery.md renders no Depends: line (RC-42)
**Ticket**: `frontend/scripts/lane-templates/issue-discovery.md` renders Prompt-ID, Chat, Request, Lane, Tier, Front and Status, and no `Depends:`, which P13 asks of every prompt but the merge prompts rendered by `lane-run` (RC-42). No gate enforces `Depends:` today (report P-2026-10-10-1330 §4.3), so nothing refuses the auto-intake prompts; the lane board draws no dependency for them. Likely `Depends: none`. Left out here: the prompt's item 2 asked for `Front:` only.
**Priority**: low
**Found in**: P-2026-10-10-1612

## 2026-10-10 — feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)
**Prompt**: `claude_2026-10-10_1520_prompt_lane_board_model_insights_discovery.md`: Phase 1 discovery (`da062a727`), then the chat's GO with the ten decisions of report §11 (RC-21): `/api/insights` v1, three Insights sections (code areas; model by area and by size with the RC-45 drawn toggle; first-shot by week with model and RC markers), the `header()` and `kindOf` fix, the README path.
**Files touched**: `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/README.md` (`e3590d682`); this commit: this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` on both files; check:scripts PASS (57 files); final outcome from the logs equal to `lane-run status` on 380/380 lanes; headless probe on 4701 of the Lanes, Timeline and Insights tabs, 0 console errors.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe, headless, on 4701: the three new sections, the drawn toggle's empty state and the 7, 30 and all ranges read from the DOM, 0 console errors; the chat's RC-23 check on 4701 is still due.
**Notes**: Cold /api/insights 4.15 s, warm 0.003 s (0.09 s on recompute). Kinds over 382 lanes, before -> after: not recorded 203 -> 5, merge 0 -> 171. Area rows and model tables match report §5.2 and §6.5 except P-2026-09-26-2340, -2350 and P-2026-10-10-1253, now attributed (suffix outside the run windows, Prompt-ID trailer), and P-2026-10-10-0105, running, left out. Board left on 4701. Report: docs/discovery/discovery_2026-10-10_lane_board_model_insights.md.
**Prompt document name**: 2026-10-10 15:20

**Ticket** (report correction): `total_cost_usd` and `modelUsage` are cumulative over a session, a resume restores them (0 decreases in 196 consecutive pairs of results). The report's §2.4 summed them per lane: $3,705 total and an Opus median of $7.92 overstate. The largest value per lane is the lane's cost, $2,218 over 382 lanes; the endpoint uses it. An addendum to the report is owed (not in this lane's DOVE).

## 2026-10-10 — merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)
**Prompt**: `claude_2026-10-10_1635_prompt_lane-board-model-insights_take_trunk.md`, full lane rendered by `lane-run merge --trunk-into`, a lane-run session in `~/jjodel-w-modelinsights` on `lane-board-model-insights`: RC-14, the trunk at the explicit sha `f13f6f489` into the branch with one `--no-ff` merge, base `3bc597b32`, 5 trunk commits (RC-45, the lane board's hard-stop colour and outcome tooltips, two discovery prompts, a ratification memo) against 4 on the branch and this prompt on top; hard stop for the chat's visual GO, then this closure.
**Files touched**: merge `25383392a`: the 7 files of the trunk side (`docs/decisions.md`, `docs/prompts/claude_2026-10-10_1600_prompt_stale_m1_edge_discovery.md`, `docs/prompts/claude_2026-10-10_1630_prompt_sim_event_attributes_discovery.md`, `docs/ratifiche/claude_2026-10-10_memo_proposta_event_attributes.md`, `frontend/scripts/lane-board/insights.js`, `lane-board.mjs`, `timeline.js`); the two lane-board files changed on both sides auto-merged, no hand edit. This commit: the Status of this prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `25383392a`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 7728 passed in 317 files, 0 failed, the 9 known red at import, equal to the trunk tip's count measured read-only in `~/jjodel-release` (the branch adds no test); hooks 427 (trunk 427); build exit 0; check:docs 4/4; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no. The merge carries 7 files, above five (RC-11), all the trunk side's, listed above.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, built-in browser on 4701 restarted on `25383392a` (RC-23), Insights tab, range All: the three new sections render, area and model tables as before, the trunk's legend changes present; the only console errors are connection resets from the restart window.
**Notes**: merge-tree exit 0, zero conflicts, tree `09059c0d3`, the one the commit records. No union: decisions.md, timeline.js, CLAUDE.md, AGENTS.md, PROTOCOL.md and settings.json equal the trunk's; log-inbox the branch's. Probes: `- **RC-45**` once, the 1520 heading once, control RC-46 absent. insights.js and lane-board.mjs read end to end: hunks disjoint, each declaration once, node --check on all three; the branch's new cards use no --warn.
**Prompt document name**: 2026-10-10 16:35

## 2026-10-10 — merge: lane-board-model-insights into alfonso-frontend-jjtl (P-2026-10-10-1708)
**Prompt**: `claude_2026-10-10_1708_prompt_merge_lane-board-model-insights.md`, a direct merge by `lane-run merge --direct`, no session: `lane-board-model-insights` at `4aa8e3b80` into `alfonso-frontend-jjtl`, merge base `f13f6f489`, 7 commits on the branch side.
**Files touched**: merge `549409422`: 6 files from the branch side (`docs/discovery/discovery_2026-10-10_lane_board_model_insights.md`, `docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-10_1635_prompt_lane-board-model-insights_take_trunk.md`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/lane-board.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `549409422` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7795 tests in 318 files, 9 red at import, hooks 487; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: scripts-only (lane board), app untouched; live board on 4700 restarted on 549409422, /api/insights 200 in 2.1 s, Insights tab shows Code areas, Model by area and by size and First-shot over time, no console errors (chat, built-in browser, RC-23)
**Notes**: Rollback tag `pre-lane-board-model-insights` on `c7b5bd751` (RC-31). Union: `docs/log-inbox/harness.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1708/result.json`.
**Prompt document name**: 2026-10-10 17:08

## 2026-10-10 — feat(harness): lane board shows the span beside the working time (P-2026-10-10-1717)
**Prompt**: `claude_2026-10-10_1717_prompt_lane_board_span.md`, fast lane on `~/jjodel-w-boardspan`, branch `lane-board-span`: a `Span` column right after `Elapsed` in the three tables of the Lanes tab, end - start for an exited lane, now - start for a running one, empty when start is 0 or an exited lane's end is 0; `title` tooltips on `Elapsed` and `Span`.
**Files touched**: code `960294cd4`: `frontend/scripts/lane-board/lane-board.mjs`; this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` exit 0; check:scripts PASS 60 files. Board on 4701 (cache in /tmp), the page's own `table()` run in node on the 390 `/api` rows: P-2026-10-10-0045 Elapsed 34 min, Span 7 h 39 min (459 min = end - start); 385 of 386 exited rows carry a span, the empty one has end 0; Elapsed cells equal `work()` on every row; running 1600 21 min worked, 1 h 22 min span.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, built-in browser on 4701 (RC-23), DOM read of the Lanes tab: Span right after Elapsed in Running, Last 24 hours and Earlier lanes, both headers carry their title; 0045 reads Elapsed 34 min, Span 7 h 39 min; 1150 reads 10 min and 11 min; board on 4701 stopped
**Notes**: Running is `r.live`, the flag that already splits the Running table from the others, so a chain row follows it too. The empty exited span is P-2026-09-29-1017 (no exit.txt, dead pid), the row that already shows no Ended. Span uses the browser's clock for now, Elapsed the server's at the last /api read: on a running row the two can differ by up to the cache age.
**Prompt document name**: 2026-10-10 17:17

## 2026-10-10 — merge: lane-tracking into alfonso-frontend-jjtl (P-2026-10-10-1648)
**Prompt**: `claude_2026-10-10_1648_prompt_merge_lane-tracking.md`, a merge session started by `lane-run`: `lane-tracking` at `443e86910` into `alfonso-frontend-jjtl`, `--no-ff` of the sha, merge base `d1449992a`, 14 commits on the branch side; `docs/PROTOCOL.md` changed on the branch, launched under Alfonso's governance go-ahead of 2026-10-10 16:48 (RC-26, recorded in `c3b4d6c11`).
**Files touched**: merge `c7b5bd751`: 21 files from the branch side (`docs/HARNESS-DOCS.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `docs/discovery/discovery_2026-10-10_lane_tracking_github_projects.md`, `docs/harness/fronts.json`, `docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-10_1330_prompt_lane_tracking_github_discovery.md`, `docs/prompts/claude_2026-10-10_1500_prompt_lane_tracking_A_fronts.md`, `docs/prompts/claude_2026-10-10_1532_prompt_lane_tracking_B_projection.md`, `docs/prompts/claude_2026-10-10_1612_prompt_lane_tracking_C_cutoff_intake.md`, `frontend/scripts/auto-intake.config.json`, `frontend/scripts/auto-intake.mjs`, `frontend/scripts/gates/__tests__/checkDocs.test.ts`, `frontend/scripts/gates/check-docs.ts`, `frontend/scripts/hooks/__tests__/autoIntake.test.ts`, `frontend/scripts/hooks/__tests__/fixtures/fake-gh.cjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/hooks/__tests__/laneTracking.test.ts`, `frontend/scripts/lane-run.mjs`, `frontend/scripts/lane-templates/issue-discovery.md`, `frontend/scripts/lane-tracking.mjs`); this commit: this entry, the ticket below and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c7b5bd751`: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 7795 tests in 318 files, 0 failed, the 9 §17 files red at import (expected: trunk tip 7728 in 317 files, plus 67 from the branch); hooks 487 in 7 files (427 plus 60); build exit 0; check:docs 5/5; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. The merge brings 21 files, all the branch side declared in the prompt's COSA and listed above (RC-11).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — chat GO (C-2026-10-10-1256): harness and docs only, nothing under frontend/src changed; gates green on c7b5bd751
**Notes**: Zero conflicts, no union: `docs/decisions.md` auto-merged, the staged tree equal to the probed `ce2bfe3ad`; 11 probes as expected. check:docs is 5/5, not the prompt's 4/4: Check E arrives with this branch. Five merges landed on top of `c7b5bd751` before the GO; the closure waited for the direct merge P-2026-10-10-1737, running in this tree, to reach its hard-stop (`a0289af13`). 3001 up, not restarted.
**Prompt document name**: 2026-10-10 16:48

## 2026-10-10 — ticket: merge-into-trunk.md misreads a governance go-ahead and counts check:docs as 4/4
**Ticket**: Measured on P-2026-10-10-1648. (1) A go-ahead given on the `by hand:` path reaches the commit body only: the prompt's Findings still read `lane-run merge refuses --launch`, because `merge` lifts the governance finding only when `--launch` is passed (`mergeFindings(m, o, Boolean(o.launch && goahead))`), so the session reads a refusal the chat had already lifted. (2) Step 2 of `frontend/scripts/lane-templates/merge-into-trunk.md` says the governance diff "must be empty", with no exception for a go-ahead. (3) Step 6 says `check:docs` 4/4, but since Check E (RC-44) the gate prints 5/5.
**Priority**: low
**Found in**: P-2026-10-10-1648

## 2026-10-10 — merge: lane-board-span into alfonso-frontend-jjtl (P-2026-10-10-1731)
**Prompt**: `claude_2026-10-10_1731_prompt_merge_lane-board-span.md`, a direct merge by `lane-run merge --direct`, no session: `lane-board-span` at `2ee2c2ea6` into `alfonso-frontend-jjtl`, merge base `30be4d558`, 2 commits on the branch side.
**Files touched**: merge `177dc474b`: 2 files from the branch side (`docs/log-inbox/harness.md`, `frontend/scripts/lane-board/lane-board.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `177dc474b` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7798 tests in 318 files, 9 red at import, hooks 487; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat, unattended: scripts-only (lane board), app untouched; Span verified on 4701 under P-2026-10-10-1717 and on 4700 after the kickstart
**Notes**: Rollback tag `pre-lane-board-span` on `bd97bae49` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1731/result.json`.
**Prompt document name**: 2026-10-10 17:31

## 2026-10-10 — ticket: `lane-run resume` cannot carry the critical-zone go-ahead
**Ticket**: `--critical-zone-goahead <Prompt-ID>` exists only on `start` (`lane-run.mjs:10`, `:456-462`), which writes `goahead.txt` in the lane folder; `resume` reads that file but cannot write it. A Phase 2 GO always arrives by `resume`, so a lane started read-only for its discovery (no flag) is denied by the critical-zone hook when its GO grants the go-ahead (`critical-zone.mjs:103-108`). Seen on P-2026-10-10-1600: the first Phase 2 resume stopped with `Outcome: question`; the chat wrote `goahead.txt` by hand after Alfonso's explicit go-ahead and resumed. Fix: accept `--critical-zone-goahead <Prompt-ID>` on `resume` with the same checks as `start` (the value must be the lane's own Prompt-ID), and record it in the lane log.
**Priority**: medium
**Found in**: P-2026-10-10-1600
**Detail**: `~/.jjodel-lanes/P-2026-10-10-1600/log.jsonl` (the resume at 17:40)

## 2026-10-10 — feat(harness): lane board tables with fixed column widths (P-2026-10-10-1742)
**Prompt**: `claude_2026-10-10_1742_prompt_lane_board_fixed_columns.md`, fast lane on `~/jjodel-w-boardcols`, branch `lane-board-columns`: every Lanes-tab table `table-layout: fixed`, width 100%, a `<colgroup>` from one width map keyed by column name; pills never wrap; time and duration cells nowrap and tabular-nums; Worktree and Phase ellipsis with a `title`; no cell overflows into its neighbour.
**Files touched**: code `034811a1f`: `frontend/scripts/lane-board/lane-board.mjs`; this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` exit 0; check:scripts PASS 63 files. Headless Chromium probe on 4701, live data, 13 tables, light theme: at 1280, 1440 and 1920 px every column has one width across all tables and across a `tick()`, Lane's left edge is one value, no non-truncating cell has scrollWidth > clientWidth, no pill wraps, no `.lfx` table in Timeline or Insights.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, built-in browser on 4701 (RC-23), DOM read: table-layout fixed on Running, Last 24 hours and an Earlier day; every column keeps one width across tables; Lane, State, Worktree and Launched by share the same left edge everywhere, the middle columns shift only where the column sets differ; no pill wraps; Worktree truncates with a title; board on 4701 stopped
**Notes**: Widths px: Lane 200, State 92, Kind 124, Started/Ended 96, Elapsed/Span 100, Left 116, Worktree 144, Launched by 128; Phase and Outcome auto (146 and 166 at 1246 px). Ended is fixed beside Started, Outcome absorbs the rest. Horizontal cell padding 8 px in these tables only: at 12 px Phase fell under 90 px. Min-width 1200: below ~1240 px viewport the wrap scrolls and the chain outcome pill (148 px) ends in an ellipsis. Titles wrap at 184 px instead of up to 320.
**Prompt document name**: 2026-10-10 17:42

## 2026-10-10 — merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)
**Prompt**: `claude_2026-10-10_1823_prompt_merge_lane-board-columns.md`, a direct merge by `lane-run merge --direct`, no session: `lane-board-columns` at `3339c11ee` into `alfonso-frontend-jjtl`, merge base `177dc474b`, 4 commits on the branch side.
**Files touched**: merge `fd59eefaa`: 3 files from the branch side (`docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-10_1742_prompt_lane_board_fixed_columns.md`, `frontend/scripts/lane-board/lane-board.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `fd59eefaa` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8052 tests in 330 files, 9 red at import, hooks 487; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat, unattended: scripts-only (lane board), app untouched; Lanes tab verified on 4701 under P-2026-10-10-1742
**Notes**: Rollback tag `pre-lane-board-columns` on `0d2ad8f11` (RC-31). Union: `docs/log-inbox/harness.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1823/result.json`.
**Prompt document name**: 2026-10-10 18:23

## 2026-10-10 — feat(harness): lane board links each lane to its chat (P-2026-10-10-1816)
**Prompt**: `claude_2026-10-10_1816_prompt_lane_board_chat_links.md`, fast lane on `~/jjodel-w-chatlinks`, branch `board-chat-links` (cut from `lane-board-columns`). Every `/api` lane row gets `chatUrl` and `chatUrlFrom`, from the `Request:` header, else the `Claude-Session:` trailer of the commit that added the prompt, else the same `Chat:` id in another lane (claude.ai URLs only). In Launched by, the chat id becomes a link whose `title` names the source.
**Files touched**: code `226fce084`: `frontend/scripts/lane-board/lane-board.mjs`; this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` exit 0; check:scripts PASS 63 files. The board on 4703 (cache in /tmp) serves `/api` with 406 rows and no error. A headless Chromium probe at 1280 and 1920 px found 223 links, each with target, rel and title set. Launched by is 128 px in every table, no link overflows its cell, and the console shows no errors.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, built-in browser on 4703 (RC-23), DOM read of the Lanes tab: 45 claude.ai links in Running and Last 24 hours, all target _blank with noopener; titles name the source (Request header, commit, inferred from a same-chat lane); lane-run merges without a chat stay plain; board on 4703 stopped
**Notes**: Coverage, 405 lanes: Request 18, commit 114, chat id 91, none 182. Last 7 days, 107 lanes: 18, 25, 19, 45. Among the lanes with no URL, 98 are lane-run merge prompts (29 in the last 7 days). A third field, `chatUrlVia`, holds the donor Prompt-ID that the title cites. Four `Claude-Session:` trailers hold a C- id and are rejected. One chat, C-2026-10-01-1725, has two URLs; the latest wins. A lane with `Chat: —` and a URL shows "chat" (5 lanes).
**Prompt document name**: 2026-10-10 18:16

## 2026-10-10 — merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)
**Prompt**: `claude_2026-10-10_1836_prompt_merge_board-chat-links.md`, a direct merge by `lane-run merge --direct`, no session: `board-chat-links` at `6ae97ac36` into `alfonso-frontend-jjtl`, merge base `3339c11ee`, 4 commits on the branch side.
**Files touched**: merge `d77cd0c4e`: 3 files from the branch side (`docs/log-inbox/harness.md`, `docs/prompts/claude_2026-10-10_1816_prompt_board_chat_links.md`, `frontend/scripts/lane-board/lane-board.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d77cd0c4e` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8052 tests in 330 files, 9 red at import, hooks 487; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat, unattended: scripts-only (lane board), app untouched; chat links verified on 4703 under P-2026-10-10-1816
**Notes**: Rollback tag `pre-board-chat-links` on `ffd37e8af` (RC-31). Union: `docs/log-inbox/harness.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1836/result.json`.
**Prompt document name**: 2026-10-10 18:36

## 2026-10-10 — feat(harness): lane board timeline lists the newest lanes first (P-2026-10-10-1744)
**Prompt**: `claude_2026-10-10_1744_prompt_timeline_newest_first.md`, fast lane on `~/jjodel-w-tlorder`, branch `timeline-newest-first`: in the Timeline tab the groups by their most recent lane start, descending, the lanes inside a group by start, descending, ties by Prompt-ID descending; the time axis, the horizontal scroll and every other meaning unchanged.
**Files touched**: code `0ce6f57bb`: `frontend/scripts/lane-board/timeline.js`; this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `node --check` exit 0; check:scripts PASS 63 files. Old and new `render()` run in node on this tree's live `/api/timeline` (396 lanes), 72 cases (3 groupings × 4 ranges × default/all open/all closed × with and without a selection): plot height, row partition, lane x, after-bar labels, overlap count and x/width, arrow x and the detail panel equal in all 72; groups and rows newest first in all 72. Controls: old file 5276 fails, dropped row renumbering 178, open rows unreversed 3292.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, built-in browser on 4702 (RC-23), DOM read of the Timeline: groups ordered by their newest lane (jjodel-release, then tlorder 1744, boardcols 1742, boardspan 1717), rows inside graphvertex run 1716, 1246, 0105; axis unchanged; 135 paths and 68 overlap marks still drawn; board on 4702 (PID 78740) stopped
**Notes**: Inside a group the lanes stay oldest first for packing, overlap pairs and labels; only row numbers are reversed, and a collapsed group's packed rows are numbered by their newest lane, so the packing and the row count are the old ones. Overlap box heights change in collapsed groups (the box spans two permuted rows). Exact-start ties now break by Prompt-ID instead of the API order. Probe: `/tmp/tl-probe.mjs`, not committed.
**Prompt document name**: 2026-10-10 17:44

## 2026-10-10 — feat(harness): lane-run draws the tier of eligible lanes, RC-45 (P-2026-10-10-1757)
**Prompt**: `claude_2026-10-10_1757_prompt_lane_run_rc45_draw.md`: Phase 1 discovery (`758c62cc1`, `docs/discovery/discovery_2026-10-10_lane_run_rc45_draw.md`), then in cascade the RC-45 draw in `lane-run start` and `chain` (eligibility, ledger `~/.jjodel-lanes/rc45-draws.jsonl`, `--no-draw`, reuse of a draw, lock), the board reading the ledger and `tier.txt`, tests red first.
**Files touched**: `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/insights.js` (`8a1068660`); this commit: `frontend/scripts/lane-board/README.md` and this entry. Seven files with the report, all named by the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Adopted under RC-21 the four Recommended lines of the report §0: inline `DOVE:` read when there is no `## DOVE`; a Lane-line draw missing from the ledger is recorded; a chain draws at each lane's start; `--tier` equal to a draw is accepted. Tests first, 13 of 14 red; mutation bench 27 of 28 killed (survivor: the ledger lock, a race). Dry runs under HOME=/tmp/p1757/dry; the real ledger unchanged (sha256 94af6b50).
**Prompt document name**: 2026-10-10 17:57

**Ticket** (RC-45 vs check:docs, P-2026-10-10-1757): the prompt asks for `Corregge: none` (RC-45 (2)), but Check B of `npm run check:docs` refuses it: measured on this entry, `value is neither the sentinel nor a prompt-document name in the prescribed form`. This entry writes the sentinel `—`, which §21.3 defines as "corrects nothing". Either RC-45 (2) reads `—`, or `log-tools.ts` `lintTaskFields` accepts `none`: the chat's call.
