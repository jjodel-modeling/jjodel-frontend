# Prompt: merge lane-cost into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-18-2010
Chat: C-2026-10-18-1750
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-18 · lane merge · 93a62b806 · verifica visiva passata 2026-10-18 (scripts-only merge (lane-board.mjs, its README and test); Alfonso checked the Cost column and the day totals on the 4711 board of the lane at 20:03 and approved; after the merge restartBoard restarted io.jjodel.lane-board in 8.1 s and 4700/api serves spendByDay (today 71.56))

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-18-2010 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8f68dcbb5`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-cost` into the trunk with one merge commit, `--no-ff`, of the explicit sha `2a0a78ebf`, in the shape of `d4f3e02d1` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `062a05434`. The branch carries, on top of the base, 2 commits:

- `2a0a78ebf` docs: log P-2026-10-18-1750 (lane board cost), Status flip
- `3a015d9ea` feat(harness): lane board Cost column and spend per day (P-2026-10-18-1750)

The trunk carries, since the base, 14 commits:

- `8f68dcbb5` fix(auth): send NewsletterEnabled=false on register (P-2026-10-18-1720)
- `d4f3e02d1` merge: register-compact into alfonso-frontend-jjtl (P-2026-10-18-1720)
- `07cc1941e` docs: Status, report and log entry for the compact register view (P-2026-10-18-1720)
- `02a909708` docs: Status flip and log entry for the board-kickstart merge (P-2026-10-18-1859)
- `0c7d850ba` merge: board-kickstart into alfonso-frontend-jjtl (P-2026-10-18-1859)
- `a3afd7f18` docs: add prompt P-2026-10-18-1859, merge board-kickstart into alfonso-frontend-jjtl
- `0357e7360` docs: Status flip and log entry for the board restart (P-2026-10-18-1752)
- `e4eaba0f1` feat(harness): merges into trunk restart the lane board (P-2026-10-18-1752)
- `56b54365e` docs: add prompts P-2026-10-18-1800 (gallery S1+S2) and 1801 (seal predicate S3)
- `aa5abade4` docs: Status flip and log entry for the notation-library-disc merge (P-2026-10-18-1753)
- `19564fe5b` merge: notation-library-disc into alfonso-frontend-jjtl (P-2026-10-18-1753)
- `a0f09fbec` docs: add prompt P-2026-10-18-1753, merge notation-library-disc into alfonso-frontend-jjtl
- `1672611e4` docs: notation library discovery, inbox entry, Status (P-2026-10-18-1735)
- `1d17792d9` feat(auth): compact register view, legal links, no newsletter opt-in (P-2026-10-18-1720)

Measured by `lane-run merge` at 2026-10-18 20:10, trunk at `8f68dcbb5`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2a0a78ebf`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 5 on the branch side, 17 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 062a05434 2a0a78ebf -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `lane-cost` in `/Users/alfonso/jjodel-w-lanecost`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-18-2010/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `2a0a78ebf` is the tip of `lane-cost`; the prompt files of the branch read `Status: eseguito` at `2a0a78ebf`; `git worktree list` shows `lane-cost` only in `/Users/alfonso/jjodel-w-lanecost`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2a0a78ebf` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 062a05434 2a0a78ebf -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 062a05434 alfonso-frontend-jjtl` with `git diff --name-only 062a05434 2a0a78ebf` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): lane board Cost column and spend per day by turn (P-2026-10-18-1750)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): merges into trunk restart the lane board (P-2026-10-18-1752)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: board-kickstart into alfonso-frontend-jjtl (P-2026-10-18-1859)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat(auth): compact register view, legal links, no newsletter opt-in (P-2026-10-18-1720)` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — discovery: notation library and gallery, seal, provenance, clone, packaging (P-2026-10-18-1735)` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — merge: notation-library-disc into alfonso-frontend-jjtl (P-2026-10-18-1753)` once (trunk).
4. `git merge --no-ff --no-commit 2a0a78ebf`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-cost into alfonso-frontend-jjtl (P-2026-10-18-2010)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `2a0a78ebf` in `/Users/alfonso/jjodel-w-lanecost`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-lanecost`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8f68dcbb5` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 8f68dcbb5 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-cost merge (P-2026-10-18-2010)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-lanecost`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
