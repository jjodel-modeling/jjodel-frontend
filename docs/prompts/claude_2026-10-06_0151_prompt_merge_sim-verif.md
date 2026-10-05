# Prompt: merge sim-verif into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-06-0151
Chat: C-2026-10-05-1110
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-06-0151 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `9cd6ae57e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-verif` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f17ce761a`, in the shape of `3c194ff85` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `913c22c89`. The branch carries, on top of the base, 5 commits:

- `f17ce761a` docs: Status flip for P-2026-10-06-0115 after the visual check
- `75d8e7852` docs: log entry of lane 3, coverage of the runs (P-2026-10-06-0115)
- `42bad725c` feat(sim): coverage of the runs on the canvas (P-2026-10-06-0115)
- `2fc8c8f84` test(sim): coverage of the runs, red at the base (P-2026-10-06-0115)
- `f2c79606c` docs: add prompt P-2026-10-06-0115, simulator coverage (lane 3)

The trunk carries, since the base, 51 commits:

- `9cd6ae57e` docs: Status flip and log entry for the sim-board-ui merge (P-2026-10-06-0129)
- `3c194ff85` merge: sim-board-ui into alfonso-frontend-jjtl (P-2026-10-06-0129)
- `f05eedef2` docs: add prompt P-2026-10-06-0129, merge sim-board-ui into alfonso-frontend-jjtl
- `0341a4f87` docs: Status flip for P-2026-10-06-0100 after the visual check
- `2a2899ffe` docs: log entry for the board editor's layout (P-2026-10-06-0100)
- `f8bf48a5f` feat(sim): the board editor's layout of R-SIM-143 (P-2026-10-06-0100)
- `8af770a29` docs: Status flip and log entry for the sim-verif merge (P-2026-10-06-0106)
- `5244ee5cb` merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-06-0106)
- `3eaae0aff` docs: add prompt P-2026-10-06-0106, merge sim-verif into alfonso-frontend-jjtl
- `e9b878cde` test(sim): the board editor's layout, red at the base (P-2026-10-06-0100)
- `c53647bb3` docs: Status flip and log entry for the board-turns merge (P-2026-10-06-0059)
- `db8c29fe3` merge: board-turns into alfonso-frontend-jjtl (P-2026-10-06-0059)
- `400e93a5c` docs: add prompt P-2026-10-06-0059, merge board-turns into alfonso-frontend-jjtl
- `a2b6fcd15` docs: R-SIM-143 board editor layout and prompt P-2026-10-06-0100
- `62c2e4858` docs: Status flip and log entry for the lane board turn pairing (P-2026-10-06-0049)
- `c2ecea5e9` fix(harness): the lane board pairs each turn with its own result (P-2026-10-06-0049)
- `dea7d5ec7` docs: add prompt P-2026-10-06-0049, the lane board pairs each turn with its own result
- `a9cc16bc7` docs: Status flip and log entry for the sim-verif merge (P-2026-10-06-0011)
- `778eeae4b` merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-06-0011)
- `dce901596` docs: add prompt P-2026-10-06-0011, merge sim-verif into alfonso-frontend-jjtl
- `78b045b8d` docs: Status flip and log entry for the depends-header merge (P-2026-10-05-2353)
- `c6d8ab56c` merge: depends-header into alfonso-frontend-jjtl (P-2026-10-05-2353)
- `9ab14dcb0` docs: add prompt P-2026-10-05-2353, merge depends-header into alfonso-frontend-jjtl
- `f4a54673e` docs: Status flip and log entry for the lane-board merge (P-2026-10-05-2348)
- `441bace3b` merge: lane-board into alfonso-frontend-jjtl (P-2026-10-05-2348)
- `ada63aaf2` docs: add prompt P-2026-10-05-2348, merge lane-board into alfonso-frontend-jjtl
- `edcaebab1` docs: Status flip and log entry for the lane board (P-2026-10-05-2340)
- `b5fc46477` feat(harness): lane board in the repo (frontend/scripts/lane-board)
- `d12952540` docs: Status flip and log entry for the Depends header (P-2026-10-05-2341)
- `46aaefc02` docs(protocol): every prompt declares its dependencies (RC-42)
- `87cac9a1c` docs: add prompt P-2026-10-05-2341, every prompt declares its dependencies
- `9aa1f8385` docs: add prompt P-2026-10-05-2340, the lane board moves into the repo
- `078325ee6` docs: Status flip and log entry for the sim-verif merge (P-2026-10-05-2310)
- `b4fbccd80` merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-05-2310)
- `b282d6e47` docs: add prompt P-2026-10-05-2310, merge sim-verif into alfonso-frontend-jjtl
- `a6fe2cf0d` merge: console-errors-fix into alfonso-frontend-jjtl (P-2026-10-05-2253)
- `8c76d02c9` docs: add prompt P-2026-10-05-2253, merge console-errors-fix into alfonso-frontend-jjtl
- `0eb09ad8f` docs: Status flip and log entry for the harness-goal-model merge (P-2026-10-05-1801)
- `f23297895` merge: harness-goal-model into alfonso-frontend-jjtl (P-2026-10-05-1801)
- `613a13c37` docs: Status flip, log entry and report addendum for E1 and E2 (P-2026-10-05-1648)
- and 11 more: `git log --oneline 913c22c89..9cd6ae57e`

Measured by `lane-run merge` at 2026-10-06 01:51, trunk at `9cd6ae57e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f17ce761a`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 9 on the branch side, 42 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only 913c22c89 f17ce761a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-06_0115_prompt_sim_coverage.md` (eseguito 2026-10-06 · lane sim-verif · 42bad725c · verifica visiva passata 2026-10-06).
- `git worktree list`: `sim-verif` in `/Users/alfonso/jjodel-w-simverif`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-06-0151/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f17ce761a` is the tip of `sim-verif`; the prompt files of the branch read `Status: eseguito` at `f17ce761a`; `git worktree list` shows `sim-verif` only in `/Users/alfonso/jjodel-w-simverif`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f17ce761a` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 913c22c89 f17ce761a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 913c22c89 alfonso-frontend-jjtl` with `git diff --name-only 913c22c89 f17ce761a` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-42` (trunk), `R-SIM-143` (trunk), `R-GOAL-1` (trunk); control: `- **R-GOAL-2**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — feat: coverage of the runs in the simulator, lane sim-coverage (P-2026-10-06-0115)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-06: the board editor layout (R-SIM-143)` once (trunk).
   - `docs/decisions.md`: the heading `## R-GOAL — the goal model of the requirements (decision 2026-10-05)` once (trunk).
   - `docs/log-inbox/goals.md`: the heading `## 2026-10-05 — docs(goals): the requirements' goal model, first draft (P-2026-10-05-1725)` once (trunk).
   - `docs/log-inbox/goals.md`: the heading `## 2026-10-05 — merge: harness-goal-model into alfonso-frontend-jjtl (P-2026-10-05-1801)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-05 — feat(harness): lane board in the repo (P-2026-10-05-2340)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-05 — merge: lane-board into alfonso-frontend-jjtl (P-2026-10-05-2348)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-05 — docs: every prompt declares its dependencies (P-2026-10-05-2341)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-05 — merge: depends-header into alfonso-frontend-jjtl (P-2026-10-05-2353)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-06 — fix: the lane board pairs each turn with its own result (P-2026-10-06-0049)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-06 — merge: board-turns into alfonso-frontend-jjtl (P-2026-10-06-0059)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — discovery: two console errors on the demo scenes (P-2026-10-04-1025)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — fix: no console errors E1 and E2 on the demo scenes (P-2026-10-05-1648)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — ticket: the M1 ecore JSON keeps one root object per class` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-05-2310)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-06-0011)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-06-0106)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — feat: the board editor's layout of R-SIM-143, lane sim-board-ui (P-2026-10-06-0100)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — merge: sim-board-ui into alfonso-frontend-jjtl (P-2026-10-06-0129)` once (trunk).
4. `git merge --no-ff --no-commit f17ce761a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-06-0151)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f17ce761a` in `/Users/alfonso/jjodel-w-simverif`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9cd6ae57e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-verif merge (P-2026-10-06-0151)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simverif`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
