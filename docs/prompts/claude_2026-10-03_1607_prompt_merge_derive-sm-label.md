# Prompt: merge derive-sm-label into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1607
Chat: C-2026-10-02-2340
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1607 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `0612f7790`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `derive-sm-label` into the trunk with one merge commit, `--no-ff`, of the explicit sha `eeb46b175`, in the shape of `ddf22bd2f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ddf22bd2f`. The branch carries, on top of the base, 4 commits:

- `eeb46b175` docs: Status flip for the State machine label fix (P-2026-10-03-1550)
- `1c0bed8b4` docs: log entry for the State machine label fix (P-2026-10-03-1550)
- `8deddcf0d` fix(derive): Statechart notation labelled State machine (UML statechart) (P-2026-10-03-1550)
- `e2f5ea7cc` docs: add prompt P-2026-10-03-1550, Statechart notation labelled State machine (UML statechart)

The trunk carries, since the base, 1 commit:

- `0612f7790` docs: Status flip and log entry for the petri-transition-name merge (P-2026-10-03-1545)

Measured by `lane-run merge` at 2026-10-03 16:07, trunk at `0612f7790`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl eeb46b175`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 6 on the branch side, 2 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only ddf22bd2f eeb46b175 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1550_prompt_derive_state_machine_label.md` (eseguito 2026-10-03 · lane derive-sm-label · 8deddcf0d · verifica visiva passata 2026-10-03).
- `git worktree list`: `derive-sm-label` in `/Users/alfonso/jjodel-w-smlabel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-1607/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `eeb46b175` is the tip of `derive-sm-label`; the prompt files of the branch read `Status: eseguito` at `eeb46b175`; `git worktree list` shows `derive-sm-label` only in `/Users/alfonso/jjodel-w-smlabel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl eeb46b175` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only ddf22bd2f eeb46b175 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ddf22bd2f alfonso-frontend-jjtl` with `git diff --name-only ddf22bd2f eeb46b175` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — fix(derive): Statechart notation labelled State machine (UML statechart) (P-2026-10-03-1550)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — merge: petri-transition-name into alfonso-frontend-jjtl (P-2026-10-03-1545)` once (trunk).
4. `git merge --no-ff --no-commit eeb46b175`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: derive-sm-label into alfonso-frontend-jjtl (P-2026-10-03-1607)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `eeb46b175` in `/Users/alfonso/jjodel-w-smlabel`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 0612f7790` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the derive-sm-label merge (P-2026-10-03-1607)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-smlabel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
