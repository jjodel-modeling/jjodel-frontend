# Prompt: merge lanemon-tray into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-21-1114
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-1114 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `32d45172d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lanemon-tray` into the trunk with one merge commit, `--no-ff`, of the explicit sha `88cdf30c4`, in the shape of `11ee4bfe1` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4ecf3c26f`. The branch carries, on top of the base, 2 commits:

- `88cdf30c4` docs: log entry and Status for the tray counts (P-2026-10-21-1020)
- `c42a2abd5` feat(lane-monitor-app): tray title shows waiting and running counts (P-2026-10-21-1020)

The trunk carries, since the base, 3 commits:

- `32d45172d` docs(prompts): renumber the slice 9 continuation to P-2026-10-21-1117 (1115 taken by another chat)
- `c70eefd83` docs(prompts): Tack slice 9 continuation (P-2026-10-21-1115)
- `cce5ce378` docs: add prompt P-2026-10-21-1115, finish the batched intrinsic measure and the inset fix

Measured by `lane-run merge` at 2026-10-21 11:14, trunk at `32d45172d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 88cdf30c4`: zero conflicts.
- Files changed since the base: 4 on the branch side, 2 on the trunk side; on both sides: none.
- `git diff --name-only 4ecf3c26f 88cdf30c4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `lanemon-tray` in `/Users/alfonso/jjodel-w-lanemon-tray`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-1114/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `88cdf30c4` is the tip of `lanemon-tray`; the prompt files of the branch read `Status: eseguito` at `88cdf30c4`; `git worktree list` shows `lanemon-tray` only in `/Users/alfonso/jjodel-w-lanemon-tray`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 88cdf30c4` (measured above: zero conflicts). `git diff --name-only 4ecf3c26f 88cdf30c4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4ecf3c26f alfonso-frontend-jjtl` with `git diff --name-only 4ecf3c26f 88cdf30c4` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — feat(lane-monitor-app): the tray title shows waiting and running counts (P-2026-10-21-1020)` once (branch).
4. `git merge --no-ff --no-commit 88cdf30c4`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lanemon-tray into alfonso-frontend-jjtl (P-2026-10-21-1114)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `88cdf30c4` in `/Users/alfonso/jjodel-w-lanemon-tray`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-lanemon-tray`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 32d45172d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 32d45172d HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lanemon-tray merge (P-2026-10-21-1114)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-lanemon-tray`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
