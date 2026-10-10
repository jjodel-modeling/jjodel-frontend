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
