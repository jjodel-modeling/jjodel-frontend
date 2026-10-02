# Prompt: merge path-label-edit into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-02-2157
Chat: C-2026-10-01-2349
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-2157 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `936a1b947`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `path-label-edit` into the trunk with one merge commit, `--no-ff`, of the explicit sha `3aa9dd34f`, in the shape of `fc11b841a` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `936a1b947`. The branch carries, on top of the base, 8 commits:

- `3aa9dd34f` docs: Status flip and log entry, path-label-edit took the trunk (P-2026-10-02-2132)
- `1dff977e4` merge: path-label-edit takes alfonso-frontend-jjtl (P-2026-10-02-2132)
- `641fc9a57` docs: add prompt P-2026-10-02-2132, path-label-edit takes the trunk
- `c0dfec656` docs: Status flip for P-2026-10-02-1647, chat check on the probe measures
- `52271ce80` docs: R-IRN-41, log entry, undo ticket and Status for path label edit (P-2026-10-02-1647)
- `aa04b92fb` feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)
- `ddb7a8c16` docs: discovery report, path label editable on the canvas (P-2026-10-02-1647)
- `7bb901a12` docs: add prompt P-2026-10-02-1647, path label editable on the canvas

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-02 21:57, trunk at `936a1b947`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3aa9dd34f`: zero conflicts.
- Files changed since the base: 12 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 936a1b947 3aa9dd34f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-02_1647_prompt_path_label_edit.md` (eseguito 2026-10-02 · lane path-label-edit · aa04b92fb, 52271ce80 · six Phase 1 recommendations adopted (unattended), R-IRN-41 provisional · verifica della chat sulle misure della probe (35/36; the one failure is undo of an inline write, pre-existing on the trunk for row value edits too, ticket filed, fix in the critical zone), scene and DemoFlowB derived 0 px, no label newly editable, crop non ispezionati a vista · merge senza GO visivo di Alfonso: non cambia la demo (RC-26), su suo «ok» del 2026-10-02), `claude_2026-10-02_2132_prompt_path-label-edit_take_trunk.md` (eseguito 2026-10-02 · lane path-label-edit · 1dff977e4 · verifica visiva passata 2026-10-02 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `path-label-edit` in `/Users/alfonso/jjodel-w-pathlabel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `3aa9dd34f` is the tip of `path-label-edit`; the prompt files of the branch read `Status: eseguito` at `3aa9dd34f`; `git worktree list` shows `path-label-edit` only in `/Users/alfonso/jjodel-w-pathlabel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3aa9dd34f` (measured above: zero conflicts). `git diff --name-only 936a1b947 3aa9dd34f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 936a1b947 alfonso-frontend-jjtl` with `git diff --name-only 936a1b947 3aa9dd34f` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-IRN-41` (branch); control: `- **R-IRN-42**` none.
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)` once (branch).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: one undo does not restore a slot value written by syncUpdateFeatureValue` once (branch).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: path-label-edit takes alfonso-frontend-jjtl, the path label on the trunk before its own merge (P-2026-10-02-2132)` once (branch).
4. `git merge --no-ff --no-commit 3aa9dd34f`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: path-label-edit into alfonso-frontend-jjtl (P-2026-10-02-2157)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `3aa9dd34f` in `/Users/alfonso/jjodel-w-pathlabel`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 936a1b947` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/symbol-editor.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the path-label-edit merge (P-2026-10-02-2157)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-pathlabel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
