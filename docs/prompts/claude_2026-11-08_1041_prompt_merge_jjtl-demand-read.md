# Prompt: merge jjtl-demand-read into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-1041
Chat: C-2026-11-03-1202
Request: https://claude.ai/code/session_01DQt9R5EJe1reXq5Xut2Jif (merge of jjtl-demand-read launched by chat C-2026-11-03-1202)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1041 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `b3b82d861`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-demand-read` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e55692902`, in the shape of `4f5404338` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `b3b82d861`. The branch carries, on top of the base, 5 commits:

- `e55692902` docs: Status flip and log entry for the demand read warning (P-2026-11-08-1025)
- `0264b6d75` docs: R-JTG-32, a property read on a demand warns (P-2026-11-08-1025)
- `1ee641a82` docs(jjtl): SPEC 10, a property read on a demand warns (P-2026-11-08-1025)
- `6555ebdd0` fix(jjtl): a property read on a demand warns (P-2026-11-08-1025)
- `4c7e0882a` docs: add prompt P-2026-11-08-1025, a property read on a demand warns

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-08 10:41, trunk at `b3b82d861`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e55692902`: zero conflicts.
- Files changed since the base: 6 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only b3b82d861 e55692902 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_1025_prompt_jjtl_demand_property_read_warning.md` (eseguito 2026-11-08 · lane fast · 6555ebdd0 (executor and tests), 1ee641a82 (SPEC), 0264b6d75 (R-JTG-32)).
- `git worktree list`: `jjtl-demand-read` in `/Users/alfonso/jjodel-w-demandread`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-1041/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e55692902` is the tip of `jjtl-demand-read`; the prompt files of the branch read `Status: eseguito` at `e55692902`; `git worktree list` shows `jjtl-demand-read` only in `/Users/alfonso/jjodel-w-demandread`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e55692902` (measured above: zero conflicts). `git diff --name-only b3b82d861 e55692902 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only b3b82d861 alfonso-frontend-jjtl` with `git diff --name-only b3b82d861 e55692902` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-32` (branch); control: `- **R-JTG-33**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): a property read on a demand warns (P-2026-11-08-1025)` once (branch).
4. `git merge --no-ff --no-commit e55692902`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-demand-read into alfonso-frontend-jjtl (P-2026-11-08-1041)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e55692902` in `/Users/alfonso/jjodel-w-demandread`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-demandread`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard b3b82d861` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only b3b82d861 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-demand-read merge (P-2026-11-08-1041)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-demandread`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
