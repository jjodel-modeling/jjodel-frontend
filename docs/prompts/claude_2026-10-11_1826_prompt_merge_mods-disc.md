# Prompt: merge mods-disc into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1826
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1826 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8f012e474`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `mods-disc` into the trunk with one merge commit, `--no-ff`, of the explicit sha `7ad49c552`, in the shape of `30e8e2b5e` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `44395bf59`. The branch carries, on top of the base, 2 commits:

- `7ad49c552` docs: close P-2026-10-11-1745, Status flip and harness inbox entry
- `5bf908b25` docs(discovery): Claude Code mods and the harness (P-2026-10-11-1745)

The trunk carries, since the base, 21 commits:

- `8f012e474` docs: ratify RC-46 and RC-47 (Claude Code mods), add prompt P-2026-10-11-1830
- `f6778253d` docs: add prompt P-2026-10-11-1825 (default registry guard discovery)
- `03111e3ca` docs: Status flip and log entry for the goal tree (P-2026-10-11-1650)
- `896213276` docs: Status flip and log entry for the goal-tree merge (P-2026-10-11-1808)
- `c7575bcf7` docs: add prompt P-2026-10-11-1812 (release 3.1 scope discovery)
- `30e8e2b5e` merge: goal-tree into alfonso-frontend-jjtl (P-2026-10-11-1808)
- `f8ce892ae` docs: session checkpoint of chat C-2026-10-10-0057 (graphVertex, 2026-10-11)
- `7b68b7a97` docs: add prompt P-2026-10-11-1808, merge goal-tree into alfonso-frontend-jjtl
- `58a407501` merge: new-model-instantiate into alfonso-frontend-jjtl (P-2026-10-11-1750)
- `1c19674a5` docs: add prompt P-2026-10-11-1750, merge new-model-instantiate into alfonso-frontend-jjtl
- `c6b060ef1` docs: flip status of P-2026-10-11-1716
- `041cd2d47` docs(goals): goal tree, correlations, hurts (P-2026-10-11-1650)
- `f1b0e485b` merge: new-model-instantiate takes alfonso-frontend-jjtl (P-2026-10-11-1716)
- `adebf2f32` docs: add prompt P-2026-10-11-1716, merge alfonso-frontend-jjtl into new-model-instantiate
- `91a5f2e31` docs: flip status of P-2026-10-11-1135
- `1df16a7a4` docs: inbox entry for new-model-instantiate F1, Phase 2 (P-2026-10-11-1135)
- `c2666b3b2` docs(discovery): new model instantiate, F1 measured addendum (P-2026-10-11-1135)
- `b08c92322` fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)
- `d53d319dc` docs: inbox entry and a ticket for the new-model-instantiate Phase 1 (P-2026-10-11-1135)
- `60e51a4a3` docs(discovery): new model instantiate, not reproduced; stale memo (P-2026-10-11-1135)
- `309245922` chore(probe): every instantiation path on a fresh project (P-2026-10-11-1135)

Measured by `lane-run merge` at 2026-10-11 18:26, trunk at `8f012e474`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7ad49c552`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 22 on the branch side, 32 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 44395bf59 7ad49c552 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `mods-disc` in `/Users/alfonso/jjodel-w-mods`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `7ad49c552` is the tip of `mods-disc`; the prompt files of the branch read `Status: eseguito` at `7ad49c552`; `git worktree list` shows `mods-disc` only in `/Users/alfonso/jjodel-w-mods`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7ad49c552` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 44395bf59 7ad49c552 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 44395bf59 alfonso-frontend-jjtl` with `git diff --name-only 44395bf59 7ad49c552` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-46` (trunk), `RC-47` (trunk); control: `- **RC-48**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — docs(discovery): Claude Code mods and the harness (P-2026-10-11-1745)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: goal-tree into alfonso-frontend-jjtl (P-2026-10-11-1808)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — docs(goals): goal tree, new softgoals, correlations and hurts (P-2026-10-11-1650)` once (trunk).
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — docs(discovery): new model instantiate, not reproduced; stale canvas memo (P-2026-10-11-1135)` once (trunk).
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — ticket: after a page load every user view and viewpoint reads as a system default` once (trunk).
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)` once (trunk).
4. `git merge --no-ff --no-commit 7ad49c552`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: mods-disc into alfonso-frontend-jjtl (P-2026-10-11-1826)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `7ad49c552` in `/Users/alfonso/jjodel-w-mods`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8f012e474` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the mods-disc merge (P-2026-10-11-1826)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mods`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
