# Prompt: merge board-progress-core into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-2053
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-2053 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c0727487e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `board-progress-core` into the trunk with one merge commit, `--no-ff`, of the explicit sha `567909061`, in the shape of `6a8065809` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c22fc0ec5`. The branch carries, on top of the base, 2 commits:

- `567909061` docs: Status flip and log entry for the board progress core (P-2026-10-10-2021)
- `40b64be63` feat(harness): lane board shows progress in Phase and resolved outcome (P-2026-10-10-2021)

The trunk carries, since the base, 19 commits:

- `c0727487e` docs: Status flip and log entry for the lane-run-resolve merge (P-2026-10-10-2042)
- `dc8ea2a05` docs: R-GEN-16, templates reach the target profile through `target`
- `6a8065809` merge: lane-run-resolve into alfonso-frontend-jjtl (P-2026-10-10-2042)
- `ea2c78cb5` docs: add prompt P-2026-10-10-2042, merge lane-run-resolve into alfonso-frontend-jjtl
- `2cc5af89a` docs: Status flip and log entry for the req-trace-port merge (P-2026-10-10-2034)
- `16e70f5e8` merge: req-trace-port into alfonso-frontend-jjtl (P-2026-10-10-2034)
- `712220764` docs: add prompt P-2026-10-10-2034, merge req-trace-port into alfonso-frontend-jjtl
- `0933ebe92` docs: Status flip and log entry for lane-run resolve (P-2026-10-10-2020)
- `c60ff807b` docs: Status flip and log entry for the req-trace port (P-2026-10-10-2022)
- `5dc52f23f` docs(harness): lane-run resolve beside lane-run track (P-2026-10-10-2020)
- `a335abd21` feat(harness): lane-run resolve marks a blocked lane, re-projects card (P-2026-10-10-2020)
- `f4c91bd71` docs: Status flip and log entry for the codegen-panel merge (P-2026-10-10-2018)
- `14461b2bd` feat(harness): req-trace builds the requirements index (P-2026-10-10-2022)
- `601ec1379` merge: codegen-panel into alfonso-frontend-jjtl (P-2026-10-10-2018)
- `05035419a` docs(ratifiche): memo proposing the guard core of JjEL and guard error policy (input to R-SIM-145)
- `715e7bee6` docs: Status flip for the codegen S5 panel lane (P-2026-10-10-1825)
- `7b83066e0` docs: log entry and ticket for the codegen panel slice (P-2026-10-10-1825)
- `f95d0a44f` feat(codegen): setting, lazy Code panel, navigable origin, lazy gate (P-2026-10-10-1825)
- `d7ac77f87` docs(prompts): code generation S5 panel (P-2026-10-10-1825)

Measured by `lane-run merge` at 2026-10-10 20:53, trunk at `c0727487e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 567909061`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 10 on the branch side, 28 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only c22fc0ec5 567909061 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `board-progress-core` in `/Users/alfonso/jjodel-w-boardcore`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-2053/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `567909061` is the tip of `board-progress-core`; the prompt files of the branch read `Status: eseguito` at `567909061`; `git worktree list` shows `board-progress-core` only in `/Users/alfonso/jjodel-w-boardcore`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 567909061` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only c22fc0ec5 567909061 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c22fc0ec5 alfonso-frontend-jjtl` with `git diff --name-only c22fc0ec5 567909061` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GEN-16` (trunk); control: `- **R-GEN-17**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat: lane board progress in the Phase cell and the resolved outcome (P-2026-10-10-2021)` once (branch).
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — feat(codegen): experimental setting, lazy Code panel, navigable origin (P-2026-10-10-1825)` once (trunk).
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — ticket: EditorV2's onKeyDown deletes the selection on Backspace typed in a TEXTAREA` once (trunk).
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — merge: codegen-panel into alfonso-frontend-jjtl (P-2026-10-10-2018)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): req-trace on the trunk, verbatim from harness-req-tab (P-2026-10-10-2022)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: req-trace-port into alfonso-frontend-jjtl (P-2026-10-10-2034)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat: lane-run resolve and the resolved outcome, with card projection (P-2026-10-10-2020)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-resolve into alfonso-frontend-jjtl (P-2026-10-10-2042)` once (trunk).
4. `git merge --no-ff --no-commit 567909061`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: board-progress-core into alfonso-frontend-jjtl (P-2026-10-10-2053)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `567909061` in `/Users/alfonso/jjodel-w-boardcore`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c0727487e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the board-progress-core merge (P-2026-10-10-2053)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardcore`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
