# Prompt: merge sim-board-icon into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-05-1444
Chat: C-2026-10-05-1110
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-05-1444 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `d92e5419e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-board-icon` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c62e0afea`, in the shape of `0e77734a2` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `0e77734a2`. The branch carries, on top of the base, 6 commits:

- `c62e0afea` docs: Status flip for P-2026-10-05-1110 after Alfonso GO
- `d4a22cef8` docs: log entry covers the card header icon (P-2026-10-05-1110)
- `de42ebe4a` fix(sim): match the I/O board card header icon to its button (P-2026-10-05-1110)
- `504e7b6a4` docs: log entry for the I/O board button icon (P-2026-10-05-1110)
- `5d5579bd7` fix(sim): clearer icon for the I/O board button (P-2026-10-05-1110)
- `766d78d6c` docs: add prompt P-2026-10-05-1110, sim board icon

The trunk carries, since the base, 1 commit:

- `d92e5419e` docs: Status flip and log entry for the jjscript-m1 merge (P-2026-10-04-2147)

Measured by `lane-run merge` at 2026-10-05 14:44, trunk at `d92e5419e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c62e0afea`: zero conflicts.
- Files changed since the base: 6 on the branch side, 2 on the trunk side; on both sides: none.
- `git diff --name-only 0e77734a2 c62e0afea -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-05_1110_prompt_sim_board_icon.md` (eseguito 2026-10-05 · lane sim-board-icon · de42ebe4a · verifica visiva passata 2026-10-05).
- `git worktree list`: `sim-board-icon` in `/Users/alfonso/jjodel-w-boardicon`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-05-1444/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c62e0afea` is the tip of `sim-board-icon`; the prompt files of the branch read `Status: eseguito` at `c62e0afea`; `git worktree list` shows `sim-board-icon` only in `/Users/alfonso/jjodel-w-boardicon`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c62e0afea` (measured above: zero conflicts). `git diff --name-only 0e77734a2 c62e0afea -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 0e77734a2 alfonso-frontend-jjtl` with `git diff --name-only 0e77734a2 c62e0afea` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — fix: clearer icon for the I/O board button (P-2026-10-05-1110)` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-05 — merge: jjscript-m1 into alfonso-frontend-jjtl (P-2026-10-04-2147)` once (trunk).
4. `git merge --no-ff --no-commit c62e0afea`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-board-icon into alfonso-frontend-jjtl (P-2026-10-05-1444)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c62e0afea` in `/Users/alfonso/jjodel-w-boardicon`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard d92e5419e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-board-icon merge (P-2026-10-05-1444)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardicon`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
