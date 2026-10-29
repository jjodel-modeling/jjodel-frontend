# Prompt: merge shell-ui-s6 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-19-1841
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/shell-ui.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-19-1841 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `fb99d89e2`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `shell-ui-s6` into the trunk with one merge commit, `--no-ff`, of the explicit sha `3ca5d50c8`, in the shape of `fb99d89e2` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `0a6195258`. The branch carries, on top of the base, 2 commits:

- `3ca5d50c8` docs: log shell S6 rail surfaces, flip prompt Status (P-2026-10-19-1742)
- `89f524305` feat(shell): rail surfaces on the shell tokens (P-2026-10-19-1742)

The trunk carries, since the base, 22 commits:

- `fb99d89e2` merge: shell-ui-s4 into alfonso-frontend-jjtl (P-2026-10-19-1834)
- `92ac80ae0` docs: add prompt P-2026-10-19-1834, merge shell-ui-s4 into alfonso-frontend-jjtl
- `a2341d870` docs(sessioni): checkpoint of chat C-2026-10-19-1722 (menu cleanup)
- `bf259570f` merge: shell-ui-s3 into alfonso-frontend-jjtl (P-2026-10-19-1816)
- `f1fba8f53` docs: Status flip and log entry for the menu-cleanup merge (P-2026-10-19-1806)
- `a9ffc1bea` docs: add prompt P-2026-10-19-1816, merge shell-ui-s3 into alfonso-frontend-jjtl
- `70791e30d` docs: log shell S4 editor chrome, flip prompt Status (P-2026-10-19-1741)
- `5a082c73a` merge: menu-cleanup into alfonso-frontend-jjtl (P-2026-10-19-1806)
- `56819d674` docs: Status flip of P-2026-10-19-1733 (merge shell-ui-s1), closed by hand
- `296467ca5` docs: R-SHELL-1..5 headers back in the register vocabulary
- `4dc7590aa` docs(prompts): add host load meter to tack slice 7 (P-2026-10-19-1800)
- `0cff47f30` docs: add prompt P-2026-10-19-1806, merge menu-cleanup into alfonso-frontend-jjtl
- `36f94e3fb` docs: Status flip and log entry for the s4d-sweep merge (P-2026-10-19-1716)
- `cefede853` feat(shell): editor toolbar and left palette on shell tokens (P-2026-10-19-1741)
- `ff01668cf` docs: log shell S3 status bar, flip prompt Status (P-2026-10-19-1740)
- `b34dbd121` docs(prompts): tack slice 7, settings and notifications (P-2026-10-19-1800)
- `b9d279e96` feat(shell): status bar on shell tokens, Inter, 24px targets (P-2026-10-19-1740)
- `ae0c814c9` docs: log entry and status flip for the menu cleanup (P-2026-10-19-1745)
- `2794a2537` fix(menu): drop debug and empty Tools entries, guard small polymetric (P-2026-10-19-1745)
- `7a9d1610e` docs: R-SHELL-1..5 and front milestones for tack and shell-ui
- `19a52a30a` docs(prompts): 1745 on the maintenance front
- `303fb21c0` docs(prompts): main menu cleanup lane (P-2026-10-19-1745)

Measured by `lane-run merge` at 2026-10-19 18:41, trunk at `fb99d89e2`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3ca5d50c8`: 1 conflict: `docs/log-inbox/shell-ui.md`.
- Files changed since the base: 4 on the branch side, 21 on the trunk side; on both sides: `docs/log-inbox/shell-ui.md`.
- `git diff --name-only 0a6195258 3ca5d50c8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `shell-ui-s6` in `/Users/alfonso/jjodel-w-shellui-s6`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-19-1841/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `3ca5d50c8` is the tip of `shell-ui-s6`; the prompt files of the branch read `Status: eseguito` at `3ca5d50c8`; `git worktree list` shows `shell-ui-s6` only in `/Users/alfonso/jjodel-w-shellui-s6`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3ca5d50c8` (measured above: 1 conflict: `docs/log-inbox/shell-ui.md`). `git diff --name-only 0a6195258 3ca5d50c8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 0a6195258 alfonso-frontend-jjtl` with `git diff --name-only 0a6195258 3ca5d50c8` (measured above: `docs/log-inbox/shell-ui.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SHELL-1` (trunk), `R-SHELL-2` (trunk), `R-SHELL-3` (trunk), `R-SHELL-4` (trunk), `R-SHELL-5` (trunk); control: `- **R-SHELL-6**` none.
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: shell rail surfaces (S6)` once (branch).
   - `docs/decisions.md`: the heading `## R-SHELL — shell visual consolidation (decisions 2026-10-19)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: s4d-sweep into alfonso-frontend-jjtl (P-2026-10-19-1716)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-19 — fix(menu): debug and empty Tools entries out, small-metamodel guard on Polymetric View, Help 404 out (P-2026-10-19-1745)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-19 — merge: menu-cleanup into alfonso-frontend-jjtl (P-2026-10-19-1806)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: status bar on shell tokens, Inter, 24px targets (S3)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: editor toolbar and left palette on shell tokens (S4)` once (trunk).
4. `git merge --no-ff --no-commit 3ca5d50c8`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: shell-ui-s6 into alfonso-frontend-jjtl (P-2026-10-19-1841)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `3ca5d50c8` in `/Users/alfonso/jjodel-w-shellui-s6`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-shellui-s6`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fb99d89e2` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only fb99d89e2 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/shell-ui.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the shell-ui-s6 merge (P-2026-10-19-1841)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-shellui-s6`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
