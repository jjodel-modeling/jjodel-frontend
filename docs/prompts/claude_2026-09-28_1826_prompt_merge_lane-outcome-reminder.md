# Prompt: merge lane-outcome-reminder into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-1826
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-28 · lane merge · ef8356005 · verifica visiva passata 2026-09-28 (scripts-only merge, no UI change; gates green on the merge)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-1826 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `df0487f94`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-outcome-reminder` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ca1862b1f`, in the shape of `19f8ae493` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `df0487f94`. The branch carries, on top of the base, 3 commits:

- `ca1862b1f` docs: Status flip and log entry for the RC-20 reminder lane (P-2026-09-28-1545)
- `c24a91000` feat(harness): lane-run appends the RC-20 closing line to every input (P-2026-09-28-1545)
- `2161d7ac0` docs: add prompt P-2026-09-28-1545, lane-run appends the RC-20 closing line

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-09-28 18:26, trunk at `df0487f94`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ca1862b1f`: zero conflicts.
- Files changed since the base: 4 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only df0487f94 ca1862b1f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_1545_prompt_lane_outcome_reminder.md` (eseguito 2026-09-28 · lane harness · c24a91000).
- `git worktree list`: `lane-outcome-reminder` in `/Users/alfonso/jjodel-w-outcome`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-28-1826/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ca1862b1f` is the tip of `lane-outcome-reminder`; the prompt files of the branch read `Status: eseguito` at `ca1862b1f`; `git worktree list` shows `lane-outcome-reminder` only in `/Users/alfonso/jjodel-w-outcome`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ca1862b1f` (measured above: zero conflicts). `git diff --name-only df0487f94 ca1862b1f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only df0487f94 alfonso-frontend-jjtl` with `git diff --name-only df0487f94 ca1862b1f` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat(harness): lane-run appends the RC-20 closing line to every input (P-2026-09-28-1545)` once (branch).
4. `git merge --no-ff --no-commit ca1862b1f`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-outcome-reminder into alfonso-frontend-jjtl (P-2026-09-28-1826)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ca1862b1f` in `/Users/alfonso/jjodel-w-outcome`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-outcome-reminder merge (P-2026-09-28-1826)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-outcome`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
