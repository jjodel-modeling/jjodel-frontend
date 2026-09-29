# Prompt: merge sim-ui-tickets into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-0425
Chat: C-2026-09-28-1936
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-0425 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1430054fe`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-ui-tickets` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ca0f659f8`, in the shape of `42d7a08dd` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `42d7a08dd`. The branch carries, on top of the base, 6 commits:

- `ca0f659f8` docs(sim): the UI tickets lane entry and Status (P-2026-09-29-0356)
- `287461f8c` fix(navbar): no «wrong project setup» on a page with no project at all (P-2026-09-29-0356)
- `15f4fb1ae` fix(sim): the Data form select is named «Form of state attribute n» (P-2026-09-29-0356)
- `6bedfe1c2` fix(sim): transitions waiting for an input get the enabled ring (P-2026-09-29-0356)
- `bbfc3b54b` fix(sim): the roles pill's title says why it is not checkable (P-2026-09-29-0356)
- `33aa88b19` docs(prompts): P-2026-09-29-0356 sim ui tickets bundle

The trunk carries, since the base, 1 commit:

- `1430054fe` docs: Status flip and log entry for the sim-outputs-faces merge (P-2026-09-29-0348)

Measured by `lane-run merge` at 2026-09-29 04:25, trunk at `1430054fe`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ca0f659f8`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 8 on the branch side, 2 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only 42d7a08dd ca0f659f8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_0356_prompt_sim_ui_tickets.md` (eseguito 2026-09-29 · lane sim-ui-tickets · bbfc3b54b, 6bedfe1c2, 15f4fb1ae, 287461f8c · T4 non fatto: domanda · non fuso: hard-stop, crop in docs/discovery/harness/_tmp_uitickets_*.png (gitignored)).
- `git worktree list`: `sim-ui-tickets` in `/Users/alfonso/jjodel-w-uitickets`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-0425/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ca0f659f8` is the tip of `sim-ui-tickets`; the prompt files of the branch read `Status: eseguito` at `ca0f659f8`; `git worktree list` shows `sim-ui-tickets` only in `/Users/alfonso/jjodel-w-uitickets`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ca0f659f8` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 42d7a08dd ca0f659f8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 42d7a08dd alfonso-frontend-jjtl` with `git diff --name-only 42d7a08dd ca0f659f8` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — fix: the low UI tickets of the simulator, four fixed, one question (P-2026-09-29-0356)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-outputs-faces into alfonso-frontend-jjtl (P-2026-09-29-0348)` once (trunk).
4. `git merge --no-ff --no-commit ca0f659f8`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-ui-tickets into alfonso-frontend-jjtl (P-2026-09-29-0425)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ca0f659f8` in `/Users/alfonso/jjodel-w-uitickets`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 1430054fe` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-ui-tickets merge (P-2026-09-29-0425)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-uitickets`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
