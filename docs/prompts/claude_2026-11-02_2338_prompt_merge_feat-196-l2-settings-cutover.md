# Prompt: merge feat/196-l2-settings-cutover into staging

Prompt-ID: P-2026-11-02-2338
Chat: C-2026-11-02-1311
Request: none (rendered by lane-run, no chat URL known for C-2026-11-02-1311)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2338 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4ecb408bb`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `feat/196-l2-settings-cutover` into the trunk with one merge commit, `--no-ff`, of the explicit sha `4fb91f1db`, in the shape of `d2cd747a0` (the last merge commit on `staging`; read its body first). Merge base `4ecb408bb`. The branch carries, on top of the base, 7 commits:

- `4fb91f1db` docs: log entry and Status flips for #196 L2 (P-2026-11-02-1930)
- `2d9f347d9` feat(ai): feature consumers read src/services/ai, #196 L2
- `1d100d6d7` feat(ai): Jodie and status bar on src/services/ai, #196 L2
- `83fa06083` fix(ai): Test connection on the chat's model again, #196 L2 (#179)
- `d2479a1b0` docs: add prompt P-2026-11-02-1930, #196 L2 continuation
- `6a58c8bef` feat(ai): settings surfaces on src/services/ai, #196 L2
- `7a3f22ac1` docs: add prompt P-2026-11-02-1916, #196 L2 settings cutover

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-02 23:38, trunk at `4ecb408bb`:

- `git merge-tree --write-tree --name-only staging 4fb91f1db`: zero conflicts.
- Files changed since the base: 20 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 4ecb408bb 4fb91f1db -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_1916_prompt_196_l2_settings_cutover.md` (eseguito 2026-11-02 · lane feat/196-l2-settings-cutover · 6a58c8bef · continued in P-2026-11-02-1930), `claude_2026-11-02_1930_prompt_196_l2_continuation.md` (eseguito 2026-11-02 · lane feat/196-l2-settings-cutover · 2d9f347d9).
- `git worktree list`: `feat/196-l2-settings-cutover` in `/Users/juridirocco/development/jjodel-196-l2`; `staging` in `/Users/juridirocco/development/jjodel`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/juridirocco/.jjodel-lanes/P-2026-11-02-2338/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `4fb91f1db` is the tip of `feat/196-l2-settings-cutover`; the prompt files of the branch read `Status: eseguito` at `4fb91f1db`; `git worktree list` shows `feat/196-l2-settings-cutover` only in `/Users/juridirocco/development/jjodel-196-l2`.
2. Measure again. `git merge-tree --write-tree --name-only staging 4fb91f1db` (measured above: zero conflicts). `git diff --name-only 4ecb408bb 4fb91f1db -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4ecb408bb staging` with `git diff --name-only 4ecb408bb 4fb91f1db` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/196-ai-refactor.md`: the heading `## 2026-11-02 — feat: #196 L2, settings, Jodie and feature consumers on src/services/ai (P-2026-11-02-1916, P-2026-11-02-1930)` once (branch).
4. `git merge --no-ff --no-commit 4fb91f1db`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: feat/196-l2-settings-cutover into staging (P-2026-11-02-2338)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `4fb91f1db` in `/Users/juridirocco/development/jjodel-196-l2`, read-only, `node /Users/juridirocco/development/jjodel/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/juridirocco/development/jjodel-196-l2`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4ecb408bb` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 4ecb408bb HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/196-ai-refactor.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the feat/196-l2-settings-cutover merge (P-2026-11-02-2338)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-196-l2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
