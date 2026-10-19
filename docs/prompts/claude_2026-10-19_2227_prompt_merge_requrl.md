# Prompt: merge requrl into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-19-2227
Chat: C-2026-10-19-1747
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-19 · lane merge · f6200c7a3 · verifica visiva passata 2026-10-19 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-19-2227 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4c2f4a2b0`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `requrl` into the trunk with one merge commit, `--no-ff`, of the explicit sha `aa41865ae`, in the shape of `ab5225ccc` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c72869d2e`. The branch carries, on top of the base, 2 commits:

- `aa41865ae` docs: Request URLs for the Tack chats and the P13 sentence (P-2026-10-19-2105)
- `f05b10358` fix(harness): lane-run start refuses a lane with no link to its chat (P-2026-10-19-2105)

The trunk carries, since the base, 9 commits:

- `4c2f4a2b0` docs(prompts): tack slice 7 closure session (P-2026-10-19-2225)
- `ed379c37f` docs(harness): tack front owned by chat C-2026-10-19-1748; P-2026-10-19-2100 becomes slice 8 in its own worktree
- `9533e05b9` docs(prompts): tack slice 7 Phase 2 continuation (P-2026-10-19-2140)
- `91f3436aa` docs: Status flip and log entry for the shell-ui-s9 merge (P-2026-10-19-2128)
- `ab5225ccc` merge: shell-ui-s9 into alfonso-frontend-jjtl (P-2026-10-19-2128)
- `140bd0467` docs: add prompt P-2026-10-19-2128, merge shell-ui-s9 into alfonso-frontend-jjtl
- `7d70a7387` docs: Status flip and log entry for shell S9 rail tickets (P-2026-10-19-2050)
- `de05729ed` fix(rail): select input box, 11px anchor labels, row-height headers (P-2026-10-19-2050)
- `758ec2f34` docs: discovery report for the shell S9 rail tickets (P-2026-10-19-2050)

Measured by `lane-run merge` at 2026-10-19 22:27, trunk at `4c2f4a2b0`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl aa41865ae`: zero conflicts.
- Files changed since the base: 17 on the branch side, 10 on the trunk side; on both sides: none.
- `git diff --name-only c72869d2e aa41865ae -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: `docs/PROTOCOL.md`.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `requrl` in `/Users/alfonso/jjodel-w-requrl`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** governance files changed on the branch: `docs/PROTOCOL.md`; launch allowed by Alfonso's yes (`--governance-goahead`, 2026-10-19 22:27)

**Direct.** `lane-run merge --direct` fell back:

- governance files changed on the branch: `docs/PROTOCOL.md`

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `aa41865ae` is the tip of `requrl`; the prompt files of the branch read `Status: eseguito` at `aa41865ae`; `git worktree list` shows `requrl` only in `/Users/alfonso/jjodel-w-requrl`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl aa41865ae` (measured above: zero conflicts). `git diff --name-only c72869d2e aa41865ae -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c72869d2e alfonso-frontend-jjtl` with `git diff --name-only c72869d2e aa41865ae` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — fix(harness): lane-run start refuses a lane with no link to its chat, Tack Request URLs (P-2026-10-19-2105)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — ticket: the lane board reads Request: from the lane's input copy, never the prompt in the repo` once (branch).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — fix: rail select input, 11px anchor labels, row-height headers (S9)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — merge: shell-ui-s9 into alfonso-frontend-jjtl (P-2026-10-19-2128)` once (trunk).
4. `git merge --no-ff --no-commit aa41865ae`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: requrl into alfonso-frontend-jjtl (P-2026-10-19-2227)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `aa41865ae` in `/Users/alfonso/jjodel-w-requrl`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-requrl`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4c2f4a2b0` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 4c2f4a2b0 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the requrl merge (P-2026-10-19-2227)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-requrl`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
