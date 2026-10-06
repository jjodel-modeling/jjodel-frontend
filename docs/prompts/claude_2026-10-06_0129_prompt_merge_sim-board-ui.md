# Prompt: merge sim-board-ui into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-06-0129
Chat: C-2026-10-05-1110
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-10-06 · lane merge · 3c194ff85 · verifica visiva passata 2026-10-06 (RC-23 della lane 0100 passata sui crop, merge senza altre differenze visive)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-06-0129 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8af770a29`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-board-ui` into the trunk with one merge commit, `--no-ff`, of the explicit sha `0341a4f87`, in the shape of `5244ee5cb` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `a9cc16bc7`. The branch carries, on top of the base, 5 commits:

- `0341a4f87` docs: Status flip for P-2026-10-06-0100 after the visual check
- `2a2899ffe` docs: log entry for the board editor's layout (P-2026-10-06-0100)
- `f8bf48a5f` feat(sim): the board editor's layout of R-SIM-143 (P-2026-10-06-0100)
- `e9b878cde` test(sim): the board editor's layout, red at the base (P-2026-10-06-0100)
- `a2b6fcd15` docs: R-SIM-143 board editor layout and prompt P-2026-10-06-0100

The trunk carries, since the base, 14 commits:

- `8af770a29` docs: Status flip and log entry for the sim-verif merge (P-2026-10-06-0106)
- `5244ee5cb` merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-06-0106)
- `3eaae0aff` docs: add prompt P-2026-10-06-0106, merge sim-verif into alfonso-frontend-jjtl
- `c53647bb3` docs: Status flip and log entry for the board-turns merge (P-2026-10-06-0059)
- `913c22c89` docs: Status flip of lane 2b (timeline slider) after the chat visual GO (P-2026-10-05-2350)
- `db8c29fe3` merge: board-turns into alfonso-frontend-jjtl (P-2026-10-06-0059)
- `400e93a5c` docs: add prompt P-2026-10-06-0059, merge board-turns into alfonso-frontend-jjtl
- `62c2e4858` docs: Status flip and log entry for the lane board turn pairing (P-2026-10-06-0049)
- `c2ecea5e9` fix(harness): the lane board pairs each turn with its own result (P-2026-10-06-0049)
- `dea7d5ec7` docs: add prompt P-2026-10-06-0049, the lane board pairs each turn with its own result
- `8fd3cd58c` docs: log entry of lane 2b, the timeline slider (P-2026-10-05-2350)
- `6a771cfee` feat(sim): a timeline slider under the transport row (P-2026-10-05-2350)
- `7a9ea6f9a` test(sim): the timeline slider, red at the base (P-2026-10-05-2350)
- `81cc13111` docs: R-SIM-142 timeline slider and prompt P-2026-10-05-2350 (lane 2b)

Measured by `lane-run merge` at 2026-10-06 01:29, trunk at `8af770a29`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0341a4f87`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 7 on the branch side, 12 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only a9cc16bc7 0341a4f87 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-06_0100_prompt_sim_board_editor_layout.md` (eseguito 2026-10-06 · lane sim-board-ui · f8bf48a5f · verifica visiva passata 2026-10-06).
- `git worktree list`: `sim-board-ui` in `/Users/alfonso/jjodel-w-boardui`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-06-0129/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `0341a4f87` is the tip of `sim-board-ui`; the prompt files of the branch read `Status: eseguito` at `0341a4f87`; `git worktree list` shows `sim-board-ui` only in `/Users/alfonso/jjodel-w-boardui`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0341a4f87` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only a9cc16bc7 0341a4f87 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only a9cc16bc7 alfonso-frontend-jjtl` with `git diff --name-only a9cc16bc7 0341a4f87` (measured above: `docs/decisions.md`, `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-143` (branch), `R-SIM-142` (trunk); control: `- **R-SIM-144**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-10-06: the board editor layout (R-SIM-143)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — feat: the board editor's layout of R-SIM-143, lane sim-board-ui (P-2026-10-06-0100)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-05: watches, step back, scenarios, coverage and the timeline slider (R-SIM-137..142)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-06 — fix: the lane board pairs each turn with its own result (P-2026-10-06-0049)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-06 — merge: board-turns into alfonso-frontend-jjtl (P-2026-10-06-0059)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — feat: a timeline slider in the simulator, lane 2b (P-2026-10-05-2350)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-06 — merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-06-0106)` once (trunk).
4. `git merge --no-ff --no-commit 0341a4f87`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-board-ui into alfonso-frontend-jjtl (P-2026-10-06-0129)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `0341a4f87` in `/Users/alfonso/jjodel-w-boardui`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8af770a29` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-board-ui merge (P-2026-10-06-0129)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardui`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
