# Prompt: merge jjtl-writeback-time into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-1021
Chat: C-2026-11-03-1020
Request: none (rendered by lane-run, no chat URL known for C-2026-11-03-1020)
Lane: full (merge; 1 conflict: `docs/log-inbox/hw-notation.md` measured)
Status: eseguito 2026-11-03 · lane merge · d04a598b6 · verifica visiva passata 2026-11-03 (docs only (report and log inbox), all gates green on d04a598b6, no visual check made because nothing visible changes)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1021 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6b4f96183`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-writeback-time` into the trunk with one merge commit, `--no-ff`, of the explicit sha `53d543df6`, in the shape of `b7dfcc51e` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `b7dfcc51e`. The branch carries, on top of the base, 4 commits:

- `53d543df6` docs: ticket 5,119 attribute race, log entry, Status flips (P-2026-11-03-1014)
- `f88a79bd8` docs(discovery): where the JjTL write-back time goes (P-2026-11-03-1014)
- `f986a1ff4` docs: add prompt P-2026-11-03-1014, report on the JjTL write-back time
- `eb452ec79` docs: add prompt P-2026-11-03-0703, measure the JjTL write-back time

The trunk carries, since the base, 1 commit:

- `6b4f96183` docs: Status flip and log entry for the jjtl-many-valued merge (P-2026-11-03-0642)

Measured by `lane-run merge` at 2026-11-03 10:21, trunk at `6b4f96183`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 53d543df6`: 1 conflict: `docs/log-inbox/hw-notation.md`.
- Files changed since the base: 4 on the branch side, 2 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`.
- `git diff --name-only b7dfcc51e 53d543df6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_0703_prompt_jjtl_writeback_time.md` (eseguito 2026-11-03 · lane jjtl-writeback-time · report f88a79bd8 · produzione non misurata), `claude_2026-11-03_1014_prompt_jjtl_writeback_time_report.md` (eseguito 2026-11-03 · lane jjtl-writeback-time · report f88a79bd8 · produzione non misurata).
- `git worktree list`: `jjtl-writeback-time` in `/Users/alfonso/jjodel-w-jjtlwbtime`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-03-1021/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `53d543df6` is the tip of `jjtl-writeback-time`; the prompt files of the branch read `Status: eseguito` at `53d543df6`; `git worktree list` shows `jjtl-writeback-time` only in `/Users/alfonso/jjodel-w-jjtlwbtime`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 53d543df6` (measured above: 1 conflict: `docs/log-inbox/hw-notation.md`). `git diff --name-only b7dfcc51e 53d543df6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only b7dfcc51e alfonso-frontend-jjtl` with `git diff --name-only b7dfcc51e 53d543df6` (measured above: `docs/log-inbox/hw-notation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL nested-attribute write can run before the last commit and silently drop num at 5,119 objects` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — discovery: where the JjTL write-back time goes (P-2026-11-03-1014)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-many-valued into alfonso-frontend-jjtl (P-2026-11-03-0642)` once (trunk).
4. `git merge --no-ff --no-commit 53d543df6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-writeback-time into alfonso-frontend-jjtl (P-2026-11-03-1021)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `53d543df6` in `/Users/alfonso/jjodel-w-jjtlwbtime`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtlwbtime`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6b4f96183` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 6b4f96183 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-writeback-time merge (P-2026-11-03-1021)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtlwbtime`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
