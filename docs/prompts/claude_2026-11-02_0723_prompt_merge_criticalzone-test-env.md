# Prompt: merge criticalzone-test-env into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-02-0723
Chat: C-2026-11-01-1434
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp (merge of criticalzone-test-env launched by chat C-2026-11-01-1434)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0723 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `81e0aafdf`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `criticalzone-test-env` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ad09563f7`, in the shape of `7a4094009` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `aa68ad049`. The branch carries, on top of the base, 3 commits:

- `ad09563f7` docs: log entry and Status flip for criticalZone test env (P-2026-11-02-0645)
- `3c54c9d3f` test(hooks): criticalZone spawns drop an inherited go-ahead (P-2026-11-02-0645)
- `aa079a7d5` docs: add prompt P-2026-11-02-0645, criticalZone test env (ticket #393)

The trunk carries, since the base, 11 commits:

- `81e0aafdf` docs: Status flip and log entry for the only-visible-conditional merge (P-2026-11-02-0656)
- `7a4094009` merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)
- `dcbd70ed5` docs: add prompt P-2026-11-02-0656, merge only-visible-conditional into alfonso-frontend-jjtl
- `bfb6ee654` docs: close P-2026-11-02-0020, 0225, 0233 (visual check passed)
- `c03585ae8` docs: R-TXT-25 and prompts P-2026-11-02-0650..0653
- `f33ea432f` docs: Status flip and log entry for the textual-t2 merge (P-2026-11-02-0637); night section of the session checkpoint
- `604f578ed` probe: CLICK_FIT viewport over the node positions (P-2026-11-02-0233)
- `9217e9185` docs: add prompt P-2026-11-02-0233, no-viewpoint drag timing
- `36694dbfb` perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0020)
- `b32858bf1` docs: add prompt P-2026-11-02-0225, conditional only-visible closure
- `e38677b8d` docs: add prompt P-2026-11-02-0020, conditional only-visible rendering

Measured by `lane-run merge` at 2026-11-02 07:23, trunk at `81e0aafdf`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ad09563f7`: zero conflicts.
- Files changed since the base: 3 on the branch side, 17 on the trunk side; on both sides: none.
- `git diff --name-only aa68ad049 ad09563f7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_0645_prompt_criticalzone_test_env.md` (eseguito 2026-11-02 · lane criticalzone-test-env · 3c54c9d3f).
- `git worktree list`: `criticalzone-test-env` in `/Users/alfonso/jjodel-w-czenv`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ad09563f7` is the tip of `criticalzone-test-env`; the prompt files of the branch read `Status: eseguito` at `ad09563f7`; `git worktree list` shows `criticalzone-test-env` only in `/Users/alfonso/jjodel-w-czenv`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ad09563f7` (measured above: zero conflicts). `git diff --name-only aa68ad049 ad09563f7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only aa68ad049 alfonso-frontend-jjtl` with `git diff --name-only aa68ad049 ad09563f7` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-25` (trunk); control: `- **R-TXT-26**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — test(hooks): criticalZone spawns drop an inherited go-ahead (P-2026-11-02-0645)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-t2 into alfonso-frontend-jjtl (P-2026-11-02-0637)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0225)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)` once (trunk).
4. `git merge --no-ff --no-commit ad09563f7`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: criticalzone-test-env into alfonso-frontend-jjtl (P-2026-11-02-0723)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ad09563f7` in `/Users/alfonso/jjodel-w-czenv`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-czenv`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 81e0aafdf` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 81e0aafdf HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the criticalzone-test-env merge (P-2026-11-02-0723)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-czenv`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
