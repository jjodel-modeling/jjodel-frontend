# Prompt: merge lane-board-tokens into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-18-1116
Chat: C-2026-10-17-1757
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-18 · lane merge · f9373461c · verifica visiva passata 2026-10-18 (no UI change in the app: lane board scripts, tests and docs only (0 files under frontend/src); board checked after the launchd restart via /api fields; decided by chat C-2026-10-17-1757 under RC-25)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-18-1116 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `9c6859ecc`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-board-tokens` into the trunk with one merge commit, `--no-ff`, of the explicit sha `90b483944`, in the shape of `c5dd7b416` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `95291946a`. The branch carries, on top of the base, 3 commits:

- `90b483944` docs: log entry and Status flip for B3b board tokens (P-2026-10-18-1045)
- `db3236f43` docs(harness): lane board README, the token columns and their cache (P-2026-10-18-1045)
- `65f5f9236` feat(harness): lane board shows tokens in/out/total and ctx max per lane (P-2026-10-18-1045)

The trunk carries, since the base, 5 commits:

- `9c6859ecc` docs: Status flip and log entry for the selective-reads merge (P-2026-10-18-1108)
- `c5dd7b416` merge: selective-reads into alfonso-frontend-jjtl (P-2026-10-18-1108)
- `595ba8a90` docs: add prompt P-2026-10-18-1108, merge selective-reads into alfonso-frontend-jjtl
- `663c0944d` docs: B2 log entry, parseRows ticket and Status flip (P-2026-10-18-0945)
- `7d0be0298` feat(harness): decisions and log:find read the register and log by ID (P-2026-10-18-0945)

Measured by `lane-run merge` at 2026-10-18 11:16, trunk at `9c6859ecc`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 90b483944`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 7 on the branch side, 8 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 95291946a 90b483944 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `lane-board-tokens` in `/Users/alfonso/jjodel-w-boardtokens`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-18-1116/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `90b483944` is the tip of `lane-board-tokens`; the prompt files of the branch read `Status: eseguito` at `90b483944`; `git worktree list` shows `lane-board-tokens` only in `/Users/alfonso/jjodel-w-boardtokens`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 90b483944` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 95291946a 90b483944 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 95291946a alfonso-frontend-jjtl` with `git diff --name-only 95291946a 90b483944` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B3b, lane board shows tokens in, out, total and context max per lane (P-2026-10-18-1045)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B2, decisions and log:find read the register and the log by ID (P-2026-10-18-0945)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: parseRows does not read paragraph-form rows of the register` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: selective-reads into alfonso-frontend-jjtl (P-2026-10-18-1108)` once (trunk).
4. `git merge --no-ff --no-commit 90b483944`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-board-tokens into alfonso-frontend-jjtl (P-2026-10-18-1116)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `90b483944` in `/Users/alfonso/jjodel-w-boardtokens`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-boardtokens`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9c6859ecc` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-board-tokens merge (P-2026-10-18-1116)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardtokens`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
