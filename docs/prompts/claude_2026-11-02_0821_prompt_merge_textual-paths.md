# Prompt: merge textual-paths into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-02-0821
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0821 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `a54aad3cc`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-paths` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f91c95e22`, in the shape of `34bb2c30c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c03585ae8`. The branch carries, on top of the base, 2 commits:

- `f91c95e22` docs: log entry and Status flip for textual paths, fold, corpus (P-2026-11-02-0652)
- `40b70401d` feat(codegen): unambiguous paths, fold fallback, shared corpus (P-2026-11-02-0652)

The trunk carries, since the base, 16 commits:

- `a54aad3cc` docs: ticket on the reset target in the merge prompt template
- `90350bbef` docs: Status flip and log entry for the criticalzone-test-env merge (P-2026-11-02-0723)
- `34bb2c30c` merge: criticalzone-test-env into alfonso-frontend-jjtl (P-2026-11-02-0723)
- `bce1f3ef5` docs: add prompt P-2026-11-02-0723, merge criticalzone-test-env into alfonso-frontend-jjtl
- `81e0aafdf` docs: Status flip and log entry for the only-visible-conditional merge (P-2026-11-02-0656)
- `7a4094009` merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)
- `dcbd70ed5` docs: add prompt P-2026-11-02-0656, merge only-visible-conditional into alfonso-frontend-jjtl
- `ad09563f7` docs: log entry and Status flip for criticalZone test env (P-2026-11-02-0645)
- `3c54c9d3f` test(hooks): criticalZone spawns drop an inherited go-ahead (P-2026-11-02-0645)
- `bfb6ee654` docs: close P-2026-11-02-0020, 0225, 0233 (visual check passed)
- `aa079a7d5` docs: add prompt P-2026-11-02-0645, criticalZone test env (ticket #393)
- `604f578ed` probe: CLICK_FIT viewport over the node positions (P-2026-11-02-0233)
- `9217e9185` docs: add prompt P-2026-11-02-0233, no-viewpoint drag timing
- `36694dbfb` perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0020)
- `b32858bf1` docs: add prompt P-2026-11-02-0225, conditional only-visible closure
- `e38677b8d` docs: add prompt P-2026-11-02-0020, conditional only-visible rendering

Measured by `lane-run merge` at 2026-11-02 08:21, trunk at `a54aad3cc`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f91c95e22`: zero conflicts.
- Files changed since the base: 14 on the branch side, 13 on the trunk side; on both sides: none.
- `git diff --name-only c03585ae8 f91c95e22 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `textual-paths` in `/Users/alfonso/jjodel-w-textpaths`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-02-0821/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f91c95e22` is the tip of `textual-paths`; the prompt files of the branch read `Status: eseguito` at `f91c95e22`; `git worktree list` shows `textual-paths` only in `/Users/alfonso/jjodel-w-textpaths`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f91c95e22` (measured above: zero conflicts). `git diff --name-only c03585ae8 f91c95e22 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c03585ae8 alfonso-frontend-jjtl` with `git diff --name-only c03585ae8 f91c95e22` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): unambiguous paths, fold fallback, shared corpus (P-2026-11-02-0652)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — test(hooks): criticalZone spawns drop an inherited go-ahead (P-2026-11-02-0645)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — merge: criticalzone-test-env into alfonso-frontend-jjtl (P-2026-11-02-0723)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — ticket: Merge prompt template names the wrong reset target when check:addonly fails` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0225)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)` once (trunk).
4. `git merge --no-ff --no-commit f91c95e22`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-paths into alfonso-frontend-jjtl (P-2026-11-02-0821)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f91c95e22` in `/Users/alfonso/jjodel-w-textpaths`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textpaths`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard a54aad3cc` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only a54aad3cc HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-paths merge (P-2026-11-02-0821)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textpaths`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
