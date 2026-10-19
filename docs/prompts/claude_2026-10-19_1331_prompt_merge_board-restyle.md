# Prompt: merge board-restyle into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-19-1331
Chat: C-2026-10-18-2225
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-19-1331 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `5f2746e70`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `board-restyle` into the trunk with one merge commit, `--no-ff`, of the explicit sha `913256099`, in the shape of `5f2746e70` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4bf78f079`. The branch carries, on top of the base, 6 commits:

- `913256099` docs: Status flips and log entry for the board restyle, slice 2 (P-2026-10-19-1215)
- `696025936` feat(lane-board): Timeline, Insights, Requirements in the design (P-2026-10-19-1215)
- `f4df0b8d6` docs(prompts): board restyle slice 2 continuation (P-2026-10-19-1215)
- `ef7e088fa` docs(prompts): lane board restyle slice 2 (P-2026-10-19-1157)
- `21a629b9f` docs: Status flip and log entry for the board restyle, slice 1 (P-2026-10-19-1130)
- `c40dee260` feat(lane-board): sidebar shell and Lanes tab in the agreed design (P-2026-10-19-1130)

The trunk carries, since the base, 22 commits:

- `5f2746e70` merge: tack-s3, Tack slice 3 git collector and repository identity (P-2026-10-19-1305)
- `210afb7f4` docs: Status flip and log entry for Tack slice 3 (P-2026-10-19-1305)
- `68ac2ccdd` feat(tack): git collector and repository identity (P-2026-10-19-1305)
- `254c4fc85` docs: add prompt P-2026-10-19-1305, Tack slice 3 git collector
- `7979c1d03` merge: tack-s2, Tack slice 2 event store and Claude Code collector (P-2026-10-19-1225)
- `66b2f2d2a` docs: close the menubar-settings merge (P-2026-10-19-1213)
- `098c37121` docs: Status flip and log entry for Tack slice 2 (P-2026-10-19-1225)
- `2c0d567f3` feat(tack): event store and Claude Code collector (P-2026-10-19-1225)
- `7f22ba536` docs: add prompt P-2026-10-19-1225, Tack slice 2 store and Claude Code collector
- `ce76964a1` merge: tack-s1, Tack slice 1 skeleton, contract v1 and tack check (P-2026-10-19-1200)
- `ac0e174b9` merge: menubar-settings into alfonso-frontend-jjtl (P-2026-10-19-1213)
- `ce5bb72ff` docs: add prompt P-2026-10-19-1213, merge menubar-settings into alfonso-frontend-jjtl
- `0c38a26d4` docs: add session checkpoint 2026-10-06 (C-2026-10-05-1110)
- `d6e77e264` docs: Status flip and log entry for Tack slice 1 (P-2026-10-19-1200)
- `b47906cf6` feat(tack): skeleton, contract v1 and tack check (P-2026-10-19-1200)
- `730d121f4` docs: add prompt P-2026-10-19-1200, Tack slice 1 skeleton and contract
- `974f331fc` docs(harness): Status flips and entries for the lane monitor settings (P-2026-10-19-1148)
- `dcb1b3dcb` feat(lane-monitor-app): rounded popover, settings, light and dark, Quit (P-2026-10-19-1125)
- `95d9ba01b` docs(discovery): Tack v0, resolutions of the five open questions (P-2026-10-19-1100)
- `6023168f0` merge: tack-disc, Tack v0 extraction discovery (P-2026-10-19-1100)
- `5a3ad834c` docs: add prompt P-2026-10-19-1148 (lane monitor settings, continuation)
- `c3fb4d218` docs(discovery): Tack v0 extraction inventory (P-2026-10-19-1100)

Measured by `lane-run merge` at 2026-10-19 13:31, trunk at `5f2746e70`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 913256099`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 9 on the branch side, 68 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 4bf78f079 913256099 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-19_1157_prompt_lane_board_restyle_s2.md` (eseguito 2026-10-19 via P-2026-10-19-1215 (stopped at the RC-51 context ceiling, code uncommitted; checked and committed by the continuation) · lane board-restyle · 696025936 · verifica visiva passata 2026-10-19 (chat: built-in browser on 4714, four tabs at 1440 dark, theme switched to Light without reload, 800 light 800/800 px)), `claude_2026-10-19_1215_prompt_lane_board_restyle_s2_cont.md` (eseguito 2026-10-19 · lane board-restyle · 696025936 · verifica visiva passata 2026-10-19 (chat: built-in browser on 4714, four tabs at 1440 dark, theme switched to Light without reload, 800 light 800/800 px)).
- `git worktree list`: `board-restyle` in `/Users/alfonso/jjodel-w-boardstyle`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-19-1331/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `913256099` is the tip of `board-restyle`; the prompt files of the branch read `Status: eseguito` at `913256099`; `git worktree list` shows `board-restyle` only in `/Users/alfonso/jjodel-w-boardstyle`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 913256099` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 4bf78f079 913256099 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4bf78f079 alfonso-frontend-jjtl` with `git diff --name-only 4bf78f079 913256099` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-board): sidebar shell and Lanes tab in the agreed design (P-2026-10-19-1130)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — ticket: laneTracking test red on the tack front's milestone` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-board): Timeline, Insights, Requirements in the design (P-2026-10-19-1215)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): rounded popover, settings view, light and dark theme (P-2026-10-19-1125)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): Quit in the popover, Cmd+Q, settings spacing and path line (P-2026-10-19-1148)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: menubar-settings into alfonso-frontend-jjtl (P-2026-10-19-1213)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 3, git collector and repository identity` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 2, event store and Claude Code collector` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 1, skeleton, contract v1 and tack check` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — discovery: Tack v0 extraction inventory (Phase 1)` once (trunk).
4. `git merge --no-ff --no-commit 913256099`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: board-restyle into alfonso-frontend-jjtl (P-2026-10-19-1331)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `913256099` in `/Users/alfonso/jjodel-w-boardstyle`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-boardstyle`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 5f2746e70` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 5f2746e70 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the board-restyle merge (P-2026-10-19-1331)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardstyle`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
