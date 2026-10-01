# Prompt: merge activity-bar-7 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-01-2254
Chat: C-2026-10-01-2220
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-01-2254 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ac3890b7e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `activity-bar-7` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b8cdcc5d7`, in the shape of `a952056bb` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ac3890b7e`. The branch carries, on top of the base, 4 commits:

- `b8cdcc5d7` docs: Activity bar 7 px, addendum, R-VP-36, log entry, Status (P-2026-10-01-2230)
- `c3b0556d6` fix(derive): Activity fork and join bar declared 7 px (P-2026-10-01-2230)
- `690ca002e` docs: Activity bar 7 px, Phase 1 discovery report (P-2026-10-01-2230)
- `ff6c01f57` docs: add prompt P-2026-10-01-2230, Activity fork and join bar at 7 px

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-01 22:54, trunk at `ac3890b7e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b8cdcc5d7`: zero conflicts.
- Files changed since the base: 7 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only ac3890b7e b8cdcc5d7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-01_2230_prompt_activity_bar_7px.md` (eseguito 2026-10-01 · lane activity-bar-7 · 690ca002e, c3b0556d6 · non fuso: hard-stop, the fork and join bar node 7×120 painted 5×118 (was 5×120, 3×118), lane probe on 3090 (light) 17/17 and the base run 8/8, the four default scenes 0 px, mutation bench 16/16, crops in frontend/scripts/smoke/_tmp_forkbar_crops/ (gitignored), R-VP-36, a saved derived viewpoint keeps 5 until derived again, verifica visiva alla chat).
- `git worktree list`: `activity-bar-7` in `/Users/alfonso/jjodel-w-forkbar`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-01-2254/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b8cdcc5d7` is the tip of `activity-bar-7`; the prompt files of the branch read `Status: eseguito` at `b8cdcc5d7`; `git worktree list` shows `activity-bar-7` only in `/Users/alfonso/jjodel-w-forkbar`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b8cdcc5d7` (measured above: zero conflicts). `git diff --name-only ac3890b7e b8cdcc5d7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ac3890b7e alfonso-frontend-jjtl` with `git diff --name-only ac3890b7e b8cdcc5d7` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-36` (branch); control: `- **R-VP-37**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — fix(derive): Activity fork and join bar declared 7 px (P-2026-10-01-2230)` once (branch).
4. `git merge --no-ff --no-commit b8cdcc5d7`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: activity-bar-7 into alfonso-frontend-jjtl (P-2026-10-01-2254)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b8cdcc5d7` in `/Users/alfonso/jjodel-w-forkbar`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ac3890b7e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the activity-bar-7 merge (P-2026-10-01-2254)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-forkbar`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
