# Prompt: merge symbolcard-cleanup into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1947
Chat: C-2026-09-29-1826
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1947 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7c2539ae9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `symbolcard-cleanup` into the trunk with one merge commit, `--no-ff`, of the explicit sha `dee8746f7`, in the shape of `2d5a702b2` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `b256abc36`. The branch carries, on top of the base, 4 commits:

- `dee8746f7` docs: closure of the SymbolCard removal, entry and Status (P-2026-09-29-1929)
- `89bed3547` refactor(authoring): remove unused SymbolCard and its styles (P-2026-09-29-1929)
- `959601170` docs: discovery for removing the dead SymbolCard (P-2026-09-29-1929)
- `2f9ca408c` docs: add prompt P-2026-09-29-1929, remove unused SymbolCard

The trunk carries, since the base, 9 commits:

- `7c2539ae9` docs: Status flip and log entry for the sim-random-l1 merge (P-2026-09-29-1933)
- `2d5a702b2` merge: sim-random-l1 into alfonso-frontend-jjtl (P-2026-09-29-1933)
- `70b6d2fc5` docs: add prompt P-2026-09-29-1933, merge sim-random-l1 into alfonso-frontend-jjtl
- `69b370973` docs: R-SIM-100, the demo's list lines, log entry and Status (P-2026-09-29-1840)
- `3cbfbc15b` feat(sim): the Random button right of Cancel on an ε list (P-2026-09-29-1840)
- `25acfefe6` feat(sim): Random on an ε list, the run's seed at Reset (P-2026-09-29-1840)
- `7a00d5af7` feat(sim): the run's seed, draw count and trace in the store (P-2026-09-29-1840)
- `f10af6812` feat(sim): simRandom, the seeded draw among candidates (P-2026-09-29-1840)
- `d1b5d013d` docs(prompts): P-2026-09-29-1840 random choice Part 1, R-SIM-100

Measured by `lane-run merge` at 2026-09-29 19:47, trunk at `7c2539ae9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dee8746f7`: zero conflicts.
- Files changed since the base: 6 on the branch side, 13 on the trunk side; on both sides: none.
- `git diff --name-only b256abc36 dee8746f7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1929_prompt_remove_symbolcard.md` (eseguito 2026-09-29 · lane symbolcard-cleanup · 89bed3547 · verifica visiva passata 2026-09-29 (lane Playwright probe on :3002, before and after: Symbol tab opens the modal, 12 rail tab bars identical and equal to the 1826 measures; crops in frontend/scripts/smoke/_tmp_symcard/, gitignored) · non fuso).
- `git worktree list`: `symbolcard-cleanup` in `/Users/alfonso/jjodel-w-symcard`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1947/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `dee8746f7` is the tip of `symbolcard-cleanup`; the prompt files of the branch read `Status: eseguito` at `dee8746f7`; `git worktree list` shows `symbolcard-cleanup` only in `/Users/alfonso/jjodel-w-symcard`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dee8746f7` (measured above: zero conflicts). `git diff --name-only b256abc36 dee8746f7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only b256abc36 alfonso-frontend-jjtl` with `git diff --name-only b256abc36 dee8746f7` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-100` (trunk); control: `- **R-SIM-101**` none.
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — refactor(authoring): remove the dead SymbolCard and its styles (P-2026-09-29-1929)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: Random on an ε choice, a seeded draw, the minimal trace, R-SIM-100 (P-2026-09-29-1840)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-random-l1 into alfonso-frontend-jjtl (P-2026-09-29-1933)` once (trunk).
4. `git merge --no-ff --no-commit dee8746f7`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: symbolcard-cleanup into alfonso-frontend-jjtl (P-2026-09-29-1947)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `dee8746f7` in `/Users/alfonso/jjodel-w-symcard`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7c2539ae9` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/symbol-editor.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the symbolcard-cleanup merge (P-2026-09-29-1947)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-symcard`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
