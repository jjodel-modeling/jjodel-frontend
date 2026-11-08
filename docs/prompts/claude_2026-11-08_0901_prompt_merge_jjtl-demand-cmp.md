# Prompt: merge jjtl-demand-cmp into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0901
Chat: C-2026-11-03-1202
Request: https://claude.ai/code/session_01DQt9R5EJe1reXq5Xut2Jif (merge of jjtl-demand-cmp launched by chat C-2026-11-03-1202)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-08 · lane merge · 6fde8bad1 · verifica visiva passata 2026-11-08 (comparison and method call on a demand stop the run, full suite green)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0901 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `e1f06117c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-demand-cmp` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e48d462c9`, in the shape of `9e2d896b9` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `65c095682`. The branch carries, on top of the base, 7 commits:

- `e48d462c9` docs: log entry of the demand comparison lane (P-2026-11-08-0835)
- `6d753475c` fix(jjtl): word the demand property read as measured (P-2026-11-08-0835)
- `05c0e8632` docs: Status flip of the demand comparison lane (P-2026-11-08-0835)
- `0da9a8a2e` docs: R-JTG-30, a demand compared or called stops the run (P-2026-11-08-0835)
- `5e10ad449` docs(jjtl): SPEC §10, a demand compared or called (P-2026-11-08-0835)
- `d2fabcef7` fix(jjtl): a demand called as a method's receiver stops the run (P-2026-11-08-0835)
- `a03053a53` docs: add prompt P-2026-11-08-0835, a demand compared or called stops the run

The trunk carries, since the base, 5 commits:

- `e1f06117c` docs: Status flip and log entry for the textual-t8d-calibration merge (P-2026-11-08-0845)
- `9e2d896b9` merge: textual-t8d-calibration into alfonso-frontend-jjtl (P-2026-11-08-0845)
- `3cddca7d3` docs: T8d calibration log entry and Status flip (P-2026-11-08-0831)
- `b6b40a7fd` test(codegen): T8d calibration bench of the match cascade (P-2026-11-08-0831)
- `4094e7b48` docs: add prompt P-2026-11-08-0831, T8d calibration bench

Measured by `lane-run merge` at 2026-11-08 09:01, trunk at `e1f06117c`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e48d462c9`: zero conflicts.
- Files changed since the base: 6 on the branch side, 4 on the trunk side; on both sides: none.
- `git diff --name-only 65c095682 e48d462c9 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0835_prompt_jjtl_demand_comparison_and_method.md` (eseguito 2026-11-08 · lane fast · d2fabcef7 (executor and tests), 5e10ad449 (SPEC), 0da9a8a2e (R-JTG-30)).
- `git worktree list`: `jjtl-demand-cmp` in `/Users/alfonso/jjodel-w-demandcmp`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-0901/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e48d462c9` is the tip of `jjtl-demand-cmp`; the prompt files of the branch read `Status: eseguito` at `e48d462c9`; `git worktree list` shows `jjtl-demand-cmp` only in `/Users/alfonso/jjodel-w-demandcmp`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e48d462c9` (measured above: zero conflicts). `git diff --name-only 65c095682 e48d462c9 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 65c095682 alfonso-frontend-jjtl` with `git diff --name-only 65c095682 e48d462c9` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-30` (branch); control: `- **R-JTG-31**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): a demand compared or called stops the run (P-2026-11-08-0835)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — test(codegen): T8d, calibration bench of the match thresholds (P-2026-11-08-0831)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8d-calibration into alfonso-frontend-jjtl (P-2026-11-08-0845)` once (trunk).
4. `git merge --no-ff --no-commit e48d462c9`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-demand-cmp into alfonso-frontend-jjtl (P-2026-11-08-0901)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e48d462c9` in `/Users/alfonso/jjodel-w-demandcmp`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-demandcmp`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e1f06117c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only e1f06117c HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-demand-cmp merge (P-2026-11-08-0901)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-demandcmp`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
