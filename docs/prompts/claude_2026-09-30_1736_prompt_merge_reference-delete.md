# Prompt: merge reference-delete into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-30-1736
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-1736 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c6243eed9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `reference-delete` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e6c1f452a`, in the shape of `f031d4948` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ecbc0e92c`. The branch carries, on top of the base, 4 commits:

- `e6c1f452a` docs: reference delete closure, addendum, inbox entry, Status (P-2026-09-30-1542)
- `c820dbb51` fix(editor-v2): an M1 edge delete removes the link, not the reference (P-2026-09-30-1542)
- `024ded72f` docs: reference delete discovery, M1 links delete the M2 reference (P-2026-09-30-1542)
- `c86664e2c` docs: add prompt P-2026-09-30-1542, references cannot be deleted

The trunk carries, since the base, 14 commits:

- `c6243eed9` docs: Status flip and log entry for the derived-size-leak merge (P-2026-09-30-1658)
- `f031d4948` merge: derived-size-leak into alfonso-frontend-jjtl (P-2026-09-30-1658)
- `5a9c14af8` docs: add prompt P-2026-09-30-1658, merge derived-size-leak into alfonso-frontend-jjtl
- `345759408` docs: log entry and Status flip for the derived size leak (P-2026-09-30-1625)
- `92d0d5f0a` fix(ir): the derived size goes back when its node leaves the IR view (P-2026-09-30-1625)
- `f43fe429e` docs: Status flip and log entry for the empty-state-guard merge (P-2026-09-30-1633)
- `580f75377` docs: derived size leak discovery, the hook drops nothing on unmount (P-2026-09-30-1625)
- `eb5c02928` merge: empty-state-guard into alfonso-frontend-jjtl (P-2026-09-30-1633)
- `d2730362a` docs: add prompt P-2026-09-30-1633, merge empty-state-guard into alfonso-frontend-jjtl
- `693dc86e5` docs: log entry, tickets, addendum and Status for the empty state (P-2026-09-30-1540)
- `28a98534e` fix(persistence): never store an empty state, open it as an error (P-2026-09-30-1540)
- `ee5cd0792` docs: add prompt P-2026-09-30-1625, derived size leak
- `c93ddb0fb` docs: discovery, empty state opens to a white page (P-2026-09-30-1540)
- `0e8307c60` docs: add prompt P-2026-09-30-1540, empty state opens to a white page

Measured by `lane-run merge` at 2026-09-30 17:36, trunk at `c6243eed9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e6c1f452a`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 5 on the branch side, 16 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only ecbc0e92c e6c1f452a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-30_1542_prompt_reference_delete.md` (eseguito 2026-09-30 · lane reference-delete · c820dbb51 · verifica visiva passata 2026-09-30 (GO by the chat C-2026-09-30-1458, RC-23 on the lane probe)).
- `git worktree list`: `reference-delete` in `/Users/alfonso/jjodel-w-refdelete`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-30-1736/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e6c1f452a` is the tip of `reference-delete`; the prompt files of the branch read `Status: eseguito` at `e6c1f452a`; `git worktree list` shows `reference-delete` only in `/Users/alfonso/jjodel-w-refdelete`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e6c1f452a` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only ecbc0e92c e6c1f452a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ecbc0e92c alfonso-frontend-jjtl` with `git diff --name-only ecbc0e92c e6c1f452a` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(editor-v2): an M1 edge delete removes the link, not the reference (P-2026-09-30-1542)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: an M2 edge delete is not undoable in one step, and the undo leaves a partial DEdge` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: a deleted edge stays in graph.subElements on a loaded project, ghost edges on M1 canvases` once (branch).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — fix(persistence): never store an empty state, open it as an error (P-2026-09-30-1540)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — ticket: Online favorite and tags PUT the editor's empty state` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — ticket: the editor's Download exports an empty state` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — ticket: LProject.get_metamodels keeps absent targets` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-30 — merge: empty-state-guard into alfonso-frontend-jjtl (P-2026-09-30-1633)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(ir): the derived size goes back when its node leaves the IR view (P-2026-09-30-1625)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: derived-size-leak into alfonso-frontend-jjtl (P-2026-09-30-1658)` once (trunk).
4. `git merge --no-ff --no-commit e6c1f452a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: reference-delete into alfonso-frontend-jjtl (P-2026-09-30-1736)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e6c1f452a` in `/Users/alfonso/jjodel-w-refdelete`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c6243eed9` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the reference-delete merge (P-2026-09-30-1736)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-refdelete`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
