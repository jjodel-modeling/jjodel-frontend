# Prompt: merge per-tab-view-prefs into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-21-0127
Chat: C-2026-11-20-2310
Request: none (rendered by lane-run, no chat URL known for C-2026-11-20-2310)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-21 · lane merge · 1ca31c62c · verifica visiva passata 2026-11-21 (Chat check 2026-11-21 01:38 (RC-23, unattended): 3001 answers 200 and serves the trunk; the UI is unchanged by this merge and the behaviour was verified by the lane probe on 3141 (11/11 DOM steps, saved-record check). Alfonso in the morning digest.)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-21-0127 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `bacae8815`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `per-tab-view-prefs` into the trunk with one merge commit, `--no-ff`, of the explicit sha `7d8077241`, in the shape of `cbbae0da3` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `bacae8815`. The branch carries, on top of the base, 4 commits:

- `7d8077241` docs: log entry, R-MT-40, Status of per-tab notation and colors (P-2026-11-21-0100)
- `0c342c802` fix(editor-v2): persist notation and colors per tab (P-2026-11-21-0100)
- `bb0ebf6d9` docs: discovery, notation and colors per tab (P-2026-11-21-0100)
- `621d54d61` docs: add per-tab notation and colors prompt (P-2026-11-21-0100)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-21 01:27, trunk at `bacae8815`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7d8077241`: zero conflicts.
- Files changed since the base: 8 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only bacae8815 7d8077241 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-21_0100_prompt_per_tab_notation_colors.md` (eseguito 2026-11-21 · lane tabprefs · 0c342c802 · probe 11/11 on 3141, visual check pending (chat, RC-23)).
- `git worktree list`: `per-tab-view-prefs` in `/Users/alfonso/jjodel-w-tabprefs`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-21-0127/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `7d8077241` is the tip of `per-tab-view-prefs`; the prompt files of the branch read `Status: eseguito` at `7d8077241`; `git worktree list` shows `per-tab-view-prefs` only in `/Users/alfonso/jjodel-w-tabprefs`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7d8077241` (measured above: zero conflicts). `git diff --name-only bacae8815 7d8077241 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only bacae8815 alfonso-frontend-jjtl` with `git diff --name-only bacae8815 7d8077241` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-MT-40` (branch); control: `- **R-MT-41**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-21 — fix: notation and colors persisted per tab (P-2026-11-21-0100)` once (branch).
4. `git merge --no-ff --no-commit 7d8077241`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: per-tab-view-prefs into alfonso-frontend-jjtl (P-2026-11-21-0127)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `7d8077241` in `/Users/alfonso/jjodel-w-tabprefs`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-tabprefs`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard bacae8815` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only bacae8815 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the per-tab-view-prefs merge (P-2026-11-21-0127)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-tabprefs`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
