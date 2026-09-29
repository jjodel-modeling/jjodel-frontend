# Prompt: merge sim-random-disc into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1832
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1832 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7d1b0da4f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-random-disc` into the trunk with one merge commit, `--no-ff`, of the explicit sha `70176c95c`, in the shape of `7d1b0da4f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `8f972410f`. The branch carries, on top of the base, 2 commits:

- `70176c95c` docs(discovery): random resolution of nondeterminism, plan (P-2026-09-29-1700)
- `5d18f1581` docs(prompts): P-2026-09-29-1700 discovery, random resolution of nondeterminism

The trunk carries, since the base, 11 commits:

- `7d1b0da4f` merge: label-outside-pos into alfonso-frontend-jjtl (P-2026-09-29-1827)
- `00496cad6` docs: add prompt P-2026-09-29-1827, merge label-outside-pos into alfonso-frontend-jjtl
- `e3d96cb9c` docs: Status flip and log entry for vertex labels outside (P-2026-09-29-1245)
- `9cca484ae` feat(editor-v2): vertex labels outside the symbol box (P-2026-09-29-1245)
- `ca59e317e` merge: symbol-default-size into label-outside-pos (base for P-2026-09-29-1245 Phase 2)
- `21c0d6ede` docs: discovery for vertex labels outside the box (P-2026-09-29-1245)
- `90e9aa17e` docs: Status flip and log entry for the symbol default size (P-2026-09-29-1230)
- `34c0ac422` feat(editor-v2): default width and height of a vertex view (P-2026-09-29-1230)
- `62a3b8e79` docs: add prompt P-2026-09-29-1245, vertex labels outside the symbol box
- `6955e5c6d` docs: discovery for the symbol default size, derivation recommended (P-2026-09-29-1230)
- `61e601236` docs: add prompt P-2026-09-29-1230, symbol default size in the Sizing section

Measured by `lane-run merge` at 2026-09-29 18:32, trunk at `7d1b0da4f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 70176c95c`: zero conflicts.
- Files changed since the base: 3 on the branch side, 24 on the trunk side; on both sides: none.
- `git diff --name-only 8f972410f 70176c95c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1700_prompt_discovery_sim_random_choice.md` (eseguito 2026-09-29 · lane discovery sim-random-disc · report docs/discovery/discovery_2026-09-29_sim_random_choice.md, measured on 5d18f1581 · hard-stop, four decisions and three answered questions for Alfonso in §0).
- `git worktree list`: `sim-random-disc` in `/Users/alfonso/jjodel-w-randdisc`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1832/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `70176c95c` is the tip of `sim-random-disc`; the prompt files of the branch read `Status: eseguito` at `70176c95c`; `git worktree list` shows `sim-random-disc` only in `/Users/alfonso/jjodel-w-randdisc`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 70176c95c` (measured above: zero conflicts). `git diff --name-only 8f972410f 70176c95c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 8f972410f alfonso-frontend-jjtl` with `git diff --name-only 8f972410f 70176c95c` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: random resolution of nondeterminism, Random button and Ask | Random policy (P-2026-09-29-1700)` once (branch).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — feat(editor-v2): default width and height of a vertex view (P-2026-09-29-1230)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — feat(editor-v2): vertex labels outside the symbol box (P-2026-09-29-1245)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: outside label anchors are cardinal only, no diagonals` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: IR selection ring reads clipped by the node wrapper` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: Symbol Editor previews ignore the inside label positions` once (trunk).
4. `git merge --no-ff --no-commit 70176c95c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-random-disc into alfonso-frontend-jjtl (P-2026-09-29-1832)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `70176c95c` in `/Users/alfonso/jjodel-w-randdisc`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7d1b0da4f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-random-disc merge (P-2026-09-29-1832)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-randdisc`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
