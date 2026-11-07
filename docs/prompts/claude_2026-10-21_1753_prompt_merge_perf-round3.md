# Prompt: merge perf-round3 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-21-1753
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-21 · lane merge · 460d77437 · verifica visiva passata 2026-10-21 (Built-in browser (dev, zoom 60%), Jjodel harness after merge 460d77437: BPMN 48 nodes 42 edges; selection click 0.4 s of long tasks (145/129/121), ring in 745 ms by rAF polling under dev load; drag of about 80 px 0.69 s of long tasks including the drop, dragged back; node sizes unchanged on screen)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-1753 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `b0a5ec435`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `perf-round3` into the trunk with one merge commit, `--no-ff`, of the explicit sha `23c49ad70`, in the shape of `f46cec60d` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d46ad0632`. The branch carries, on top of the base, 5 commits:

- `23c49ad70` docs: Status and log entry of the intrinsic measure cache (P-2026-10-21-1535)
- `1a54325f2` fix(editor-v2): intrinsic measure cache with inherited-CSS invalidation (P-2026-10-21-1535)
- `5bc4d4f69` Merge branch 'alfonso-frontend-jjtl' into perf-round3
- `6c4044ec6` Merge branch 'alfonso-frontend-jjtl' into perf-round3
- `e42b8e120` docs(lir): intrinsic measure cache with inherited-CSS invalidation (P-2026-10-21-1240)

The trunk carries, since the base, 8 commits:

- `b0a5ec435` docs: Status of P-2026-10-21-1635, S3a gates and bench
- `f5402d3ac` docs: S3a continuation prompts P-2026-10-21-1635 and 1636
- `392a85811` docs: Status flip and log entry for the tack-v0b merge (P-2026-10-21-1558)
- `f46cec60d` merge: tack-v0b into alfonso-frontend-jjtl (P-2026-10-21-1558)
- `2487210b6` docs: add prompt P-2026-10-21-1558, merge tack-v0b into alfonso-frontend-jjtl
- `fcd03e0c0` docs: S3a Phase 1 closed, R-OI-13..14, prompt P-2026-10-21-1600
- `9d69c1647` docs: Status flip and log entry for Tack v0b (P-2026-10-21-1500)
- `82cdc7792` fix(tack): preselect the start work tree when it has no session (P-2026-10-21-1500)

Measured by `lane-run merge` at 2026-10-21 17:53, trunk at `b0a5ec435`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 23c49ad70`: zero conflicts.
- Files changed since the base: 9 on the branch side, 13 on the trunk side; on both sides: none.
- `git diff --name-only d46ad0632 23c49ad70 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `perf-round3` in `/Users/alfonso/jjodel-w-perfround3`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-1753/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `23c49ad70` is the tip of `perf-round3`; the prompt files of the branch read `Status: eseguito` at `23c49ad70`; `git worktree list` shows `perf-round3` only in `/Users/alfonso/jjodel-w-perfround3`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 23c49ad70` (measured above: zero conflicts). `git diff --name-only d46ad0632 23c49ad70 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d46ad0632 alfonso-frontend-jjtl` with `git diff --name-only d46ad0632 23c49ad70` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-OI-13` (trunk), `R-OI-14` (trunk); control: `- **R-OI-15**` none.
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(editor-v2): intrinsic measure cache with inherited-CSS invalidation (P-2026-10-21-1535)` once (branch).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — fix: Tack v0b, preselect the start work tree when it has no session` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-v0b into alfonso-frontend-jjtl (P-2026-10-21-1558)` once (trunk).
4. `git merge --no-ff --no-commit 23c49ad70`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1753)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `23c49ad70` in `/Users/alfonso/jjodel-w-perfround3`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-perfround3`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard b0a5ec435` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only b0a5ec435 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the perf-round3 merge (P-2026-10-21-1753)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-perfround3`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
