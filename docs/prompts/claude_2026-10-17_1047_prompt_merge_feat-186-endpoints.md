# Prompt: merge feat/186-endpoints into staging

Prompt-ID: P-2026-10-17-1047
Chat: C-2026-10-14-1020
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-17-1047 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `f7d0d1d7c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `feat/186-endpoints` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b39397d2e`, in the shape of `5bf91bf01` (the last merge commit on `staging`; read its body first). Merge base `f7d0d1d7c`. The branch carries, on top of the base, 12 commits:

- `b39397d2e` docs: Status flip and log entry, feat/186-endpoints took the trunk (P-2026-10-17-1032)
- `348deae2a` merge: feat/186-endpoints takes staging (P-2026-10-17-1032)
- `cd8f34c68` docs: add prompt P-2026-10-17-1032, merge staging into feat/186-endpoints
- `790cf6ad0` docs(#186): lane closure, entry and Status (P-2026-10-14-1101)
- `3b84117d7` feat(#186): steps point to the window's «Done» again (P-2026-10-14-1101)
- `896833e2f` feat(#186): Endpoints window opened from an app bar menu (P-2026-10-14-1101)
- `6f8ddaa83` docs(#186): R-CFG-5, Endpoints in a top-bar menu (C-2026-10-14-1020)
- `0179876d5` feat(#186): Endpoints section on the project page (P-2026-10-14-1101)
- `0f90bee15` feat(#186): steps write nothing at mount, Role wording, fold (P-2026-10-14-1101)
- `5d88838f2` feat(#186): fold helper for not selectable metaclasses (P-2026-10-14-1101)
- `68eaecbf6` docs(#186): Phase 1 report on the Endpoints section (P-2026-10-14-1101)
- `2ce07f7fa` docs: add prompt P-2026-10-14-1101, #186 Endpoints section

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-17 10:47, trunk at `f7d0d1d7c`:

- `git merge-tree --write-tree --name-only staging b39397d2e`: zero conflicts.
- Files changed since the base: 13 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only f7d0d1d7c b39397d2e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-14_1101_prompt_186_endpoints.md` (eseguito 2026-10-16 · lane endpoints · 3b84117d7 · verifica visiva passata 2026-10-17 (Juri, port 3186, ScenarioMM fixture; chat probe chat_186b_independent.mts 9/9)), `claude_2026-10-17_1032_prompt_feat-186-endpoints_take_trunk.md` (eseguito 2026-10-17 · lane feat/186-endpoints · 348deae2a · verifica visiva passata 2026-10-17 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `feat/186-endpoints` in `/Users/juridirocco/development/jjodel-186`; `staging` in `/Users/juridirocco/development/jjodel`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/juridirocco/.jjodel-lanes/P-2026-10-17-1047/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b39397d2e` is the tip of `feat/186-endpoints`; the prompt files of the branch read `Status: eseguito` at `b39397d2e`; `git worktree list` shows `feat/186-endpoints` only in `/Users/juridirocco/development/jjodel-186`.
2. Measure again. `git merge-tree --write-tree --name-only staging b39397d2e` (measured above: zero conflicts). `git diff --name-only f7d0d1d7c b39397d2e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f7d0d1d7c staging` with `git diff --name-only f7d0d1d7c b39397d2e` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/endpoints.md`: the heading `## 2026-10-16 — feat(#186): the Endpoints window and its app bar menu` once (branch).
   - `docs/log-inbox/endpoints.md`: the heading `## 2026-10-17 — merge: feat/186-endpoints takes staging (P-2026-10-17-1032)` once (branch).
4. `git merge --no-ff --no-commit b39397d2e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: feat/186-endpoints into staging (P-2026-10-17-1047)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b39397d2e` in `/Users/juridirocco/development/jjodel-186`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f7d0d1d7c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/endpoints.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the feat/186-endpoints merge (P-2026-10-17-1047)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-186`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
