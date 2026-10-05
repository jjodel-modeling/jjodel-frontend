# Prompt: merge depends-header into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-05-2353
Chat: C-2026-10-05-1116
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-05 · lane merge · c6d8ab56c · verifica visiva passata 2026-10-06 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-05-2353 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `f4a54673e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `depends-header` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d12952540`, in the shape of `441bace3b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `078325ee6`. The branch carries, on top of the base, 3 commits:

- `d12952540` docs: Status flip and log entry for the Depends header (P-2026-10-05-2341)
- `46aaefc02` docs(protocol): every prompt declares its dependencies (RC-42)
- `87cac9a1c` docs: add prompt P-2026-10-05-2341, every prompt declares its dependencies

The trunk carries, since the base, 6 commits:

- `f4a54673e` docs: Status flip and log entry for the lane-board merge (P-2026-10-05-2348)
- `441bace3b` merge: lane-board into alfonso-frontend-jjtl (P-2026-10-05-2348)
- `ada63aaf2` docs: add prompt P-2026-10-05-2348, merge lane-board into alfonso-frontend-jjtl
- `edcaebab1` docs: Status flip and log entry for the lane board (P-2026-10-05-2340)
- `b5fc46477` feat(harness): lane board in the repo (frontend/scripts/lane-board)
- `9aa1f8385` docs: add prompt P-2026-10-05-2340, the lane board moves into the repo

Measured by `lane-run merge` at 2026-10-05 23:53, trunk at `f4a54673e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d12952540`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 5 on the branch side, 8 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 078325ee6 d12952540 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: `docs/PROTOCOL.md`.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-05_2341_prompt_depends_header.md` (eseguito 2026-10-05 · lane depends-header · 46aaefc02).
- `git worktree list`: `depends-header` in `/Users/alfonso/jjodel-w-depends`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** governance files changed on the branch: `docs/PROTOCOL.md`; launch allowed by Alfonso's yes (`--governance-goahead`, 2026-10-05 23:53)

**Direct.** `lane-run merge --direct` fell back:

- governance files changed on the branch: `docs/PROTOCOL.md`

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d12952540` is the tip of `depends-header`; the prompt files of the branch read `Status: eseguito` at `d12952540`; `git worktree list` shows `depends-header` only in `/Users/alfonso/jjodel-w-depends`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d12952540` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 078325ee6 d12952540 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 078325ee6 alfonso-frontend-jjtl` with `git diff --name-only 078325ee6 d12952540` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-42` (branch); control: `- **RC-43**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-05 — docs: every prompt declares its dependencies (P-2026-10-05-2341)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-05 — feat(harness): lane board in the repo (P-2026-10-05-2340)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-05 — merge: lane-board into alfonso-frontend-jjtl (P-2026-10-05-2348)` once (trunk).
4. `git merge --no-ff --no-commit d12952540`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: depends-header into alfonso-frontend-jjtl (P-2026-10-05-2353)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d12952540` in `/Users/alfonso/jjodel-w-depends`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f4a54673e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the depends-header merge (P-2026-10-05-2353)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-depends`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
