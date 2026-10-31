# Prompt: merge jjtl-input-default into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-01-0049
Chat: C-2026-10-31-1328
Request: none (rendered by lane-run, no chat URL known for C-2026-10-31-1328)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-0049 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `052746160`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-input-default` into the trunk with one merge commit, `--no-ff`, of the explicit sha `45ad4cb3d`, in the shape of `4ac40a8ef` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `0ff38d4c5`. The branch carries, on top of the base, 4 commits:

- `45ad4cb3d` docs: Status flip and log entry for the jjtl input default (P-2026-10-31-2245)
- `e7d38f515` docs(jjtl): SPEC says what prompt and input do now (P-2026-10-31-2245)
- `8b0ab9d28` fix(jjtl): input(message, kind, default) passes the default to the host (P-2026-10-31-2245)
- `09fe31a86` docs(prompts): add P-2026-10-31-2245

The trunk carries, since the base, 8 commits:

- `052746160` docs: prompt for the only-visible render loop on containers
- `3ac88f23c` docs: prompt for render only visible canvas elements
- `21c04bc16` docs: Status flip and log entry for the plugin-discovery merge (P-2026-10-31-2254)
- `4ac40a8ef` merge: plugin-discovery into alfonso-frontend-jjtl (P-2026-10-31-2254)
- `c97fccffc` docs: log entry and status of plugin discovery (P-2026-10-31-1800)
- `1ea149576` docs(discovery): plugin mechanism census and sandbox probe (P-2026-10-31-1800)
- `6980be947` docs(discovery): plugin sandbox harness (P-2026-10-31-1800)
- `a298231e0` test(probe): plugin sandbox probe (P-2026-10-31-1800)

Measured by `lane-run merge` at 2026-11-01 00:49, trunk at `052746160`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 45ad4cb3d`: zero conflicts.
- Files changed since the base: 5 on the branch side, 11 on the trunk side; on both sides: none.
- `git diff --name-only 0ff38d4c5 45ad4cb3d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-31_2245_prompt_jjtl_input_default_and_stale_notes.md` (eseguito 2026-10-31 · lane jjtl-input-default · branch jjtl-input-default · fix 8b0ab9d28, SPEC e7d38f515 · verifica visiva non applicabile (host mocked; dialog pre-fill on 3001 unverified)).
- `git worktree list`: `jjtl-input-default` in `/Users/alfonso/jjodel-w-inputdefault`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `45ad4cb3d` is the tip of `jjtl-input-default`; the prompt files of the branch read `Status: eseguito` at `45ad4cb3d`; `git worktree list` shows `jjtl-input-default` only in `/Users/alfonso/jjodel-w-inputdefault`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 45ad4cb3d` (measured above: zero conflicts). `git diff --name-only 0ff38d4c5 45ad4cb3d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 0ff38d4c5 alfonso-frontend-jjtl` with `git diff --name-only 0ff38d4c5 45ad4cb3d` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/jjtl-input-default.md`: the heading `## 2026-10-31 — fix(jjtl): input(message, kind, default) passes the default; SPEC status notes (P-2026-10-31-2245)` once (branch).
   - `docs/log-inbox/plugins.md`: the heading `## 2026-10-31 — discovery: plugin mechanism census and sandbox probe` once (trunk).
   - `docs/log-inbox/plugins.md`: the heading `## 2026-10-31 — merge: plugin-discovery into alfonso-frontend-jjtl (P-2026-10-31-2254)` once (trunk).
4. `git merge --no-ff --no-commit 45ad4cb3d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-input-default into alfonso-frontend-jjtl (P-2026-11-01-0049)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `45ad4cb3d` in `/Users/alfonso/jjodel-w-inputdefault`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-inputdefault`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 052746160` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 052746160 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/jjtl-input-default.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-input-default merge (P-2026-11-01-0049)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-inputdefault`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
