# Prompt: merge board-timer into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-22-1225
Chat: C-2026-10-22-1050
Request: https://claude.ai/code/session_018F8q1ZrKrECfKBBHqcxogb (merge of board-timer launched by chat C-2026-10-22-1050)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-22 · direct merge b636e7161 · blocked on one vitest red before the merge too, resolved 12:42 (test fix 959dcb120); board checked on 4700 by chat C-2026-10-22-1050 after ProcessType Interactive

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-22-1225 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `bae3a2809`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `board-timer` into the trunk with one merge commit, `--no-ff`, of the explicit sha `3500c525c`, in the shape of `2ba77d965` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `3c90455bd`. The branch carries, on top of the base, 3 commits:

- `3500c525c` docs(harness): log entry and Status flip for the board timer (P-2026-10-22-1210)
- `ab4824a83` fix(lane-board): git reads off the event loop, kill on child runtime (P-2026-10-22-1210)
- `612fb994c` docs: add prompt P-2026-10-22-1210, board status timer

The trunk carries, since the base, 7 commits:

- `bae3a2809` docs(templates): RC-23 passed for P-2026-10-22-1150
- `90f117a41` docs(harness): close the notation-library front on its 3.2 cut (R-LIB-23)
- `08446cfea` docs: Status flip and log entry for the tpl-mode merge (P-2026-10-22-1203)
- `2ba77d965` merge: tpl-mode into alfonso-frontend-jjtl (P-2026-10-22-1203)
- `abfa860e6` docs: add prompt P-2026-10-22-1203, merge tpl-mode into alfonso-frontend-jjtl
- `6b1646b40` docs(templates): log entry and Status, Templates mode on entry (P-2026-10-22-1150)
- `a8f9b2115` fix(navbar): restore persisted Advanced after every state reset (P-2026-10-22-1150)

Measured by `lane-run merge` at 2026-10-22 12:25, trunk at `bae3a2809`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3500c525c`: zero conflicts.
- Files changed since the base: 4 on the branch side, 6 on the trunk side; on both sides: none.
- `git diff --name-only 3c90455bd 3500c525c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-22_1210_prompt_board_status_timer.md` (eseguito 2026-10-22 · lane board-timer · ab4824a83).
- `git worktree list`: `board-timer` in `/Users/alfonso/jjodel-w-boardtimer`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-22-1225/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `3500c525c` is the tip of `board-timer`; the prompt files of the branch read `Status: eseguito` at `3500c525c`; `git worktree list` shows `board-timer` only in `/Users/alfonso/jjodel-w-boardtimer`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3500c525c` (measured above: zero conflicts). `git diff --name-only 3c90455bd 3500c525c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 3c90455bd alfonso-frontend-jjtl` with `git diff --name-only 3c90455bd 3500c525c` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-22 — fix(lane-board): git reads off the event loop, status kill on child runtime (P-2026-10-22-1210)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-22 — fix: Templates page keeps the persisted Advanced mode on entry (P-2026-10-22-1150)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-22 — merge: tpl-mode into alfonso-frontend-jjtl (P-2026-10-22-1203)` once (trunk).
4. `git merge --no-ff --no-commit 3500c525c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: board-timer into alfonso-frontend-jjtl (P-2026-10-22-1225)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `3500c525c` in `/Users/alfonso/jjodel-w-boardtimer`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-boardtimer`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard bae3a2809` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only bae3a2809 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the board-timer merge (P-2026-10-22-1225)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardtimer`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
