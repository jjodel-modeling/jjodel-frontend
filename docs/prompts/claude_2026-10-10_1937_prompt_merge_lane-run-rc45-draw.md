# Prompt: merge lane-run-rc45-draw into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1937
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1937 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `9d41d0bce`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-run-rc45-draw` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d63a4e8e6`, in the shape of `2ad7460d0` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `9d41d0bce`. The branch carries, on top of the base, 10 commits:

- `d63a4e8e6` docs: Status flip and log entry, lane-run-rc45-draw took the trunk (P-2026-10-10-1923)
- `2913eced0` merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)
- `fc06723e8` docs: add prompt P-2026-10-10-1923, merge alfonso-frontend-jjtl into lane-run-rc45-draw
- `600eff1e1` docs: Status flip and log entry, lane-run-rc45-draw took the trunk (P-2026-10-10-1848)
- `995d7cb18` merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1848)
- `c97fe9b29` docs: add prompt P-2026-10-10-1848, merge alfonso-frontend-jjtl into lane-run-rc45-draw
- `b4f9ceb83` fix(harness): drawn view of the model card names the random tier (P-2026-10-10-1757)
- `1ab2d5a49` docs: board README and log entry for the RC-45 draw (P-2026-10-10-1757)
- `8a1068660` feat(harness): lane-run draws the tier of eligible lanes (RC-45) (P-2026-10-10-1757)
- `758c62cc1` docs: discovery for the RC-45 tier draw in lane-run (P-2026-10-10-1757)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-10 19:37, trunk at `9d41d0bce`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d63a4e8e6`: zero conflicts.
- Files changed since the base: 9 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 9d41d0bce d63a4e8e6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_1848_prompt_lane-run-rc45-draw_take_trunk.md` (eseguito 2026-10-10 · lane lane-run-rc45-draw · 995d7cb18 · verifica visiva passata 2026-10-10 (chat, unattended; Alfonso in the morning digest)), `claude_2026-10-10_1923_prompt_lane-run-rc45-draw_take_trunk.md` (eseguito 2026-10-10 · lane lane-run-rc45-draw · 2913eced0 · verifica visiva passata 2026-10-10 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `lane-run-rc45-draw` in `/Users/alfonso/jjodel-w-rc45draw`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1937/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d63a4e8e6` is the tip of `lane-run-rc45-draw`; the prompt files of the branch read `Status: eseguito` at `d63a4e8e6`; `git worktree list` shows `lane-run-rc45-draw` only in `/Users/alfonso/jjodel-w-rc45draw`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d63a4e8e6` (measured above: zero conflicts). `git diff --name-only 9d41d0bce d63a4e8e6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 9d41d0bce alfonso-frontend-jjtl` with `git diff --name-only 9d41d0bce d63a4e8e6` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run draws the tier of eligible lanes, RC-45 (P-2026-10-10-1757)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1848)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)` once (branch).
4. `git merge --no-ff --no-commit d63a4e8e6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-run-rc45-draw into alfonso-frontend-jjtl (P-2026-10-10-1937)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d63a4e8e6` in `/Users/alfonso/jjodel-w-rc45draw`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9d41d0bce` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-run-rc45-draw merge (P-2026-10-10-1937)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-rc45draw`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
