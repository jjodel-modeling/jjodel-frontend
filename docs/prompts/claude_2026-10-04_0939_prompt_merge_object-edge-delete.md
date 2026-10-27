# Prompt: merge object-edge-delete into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-04-0939
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-04 · lane merge · 1bd0b33c0 · verifica visiva passata 2026-10-04 (chat check RC-23 on the lane probe from the DOM, 17/17 after the fix (menu Delete Transition only, Reset routing with waypoints; DObject removed, not redrawn after two syncs; one Cmd+Z restores slots and ends; Delete key works); four demo default panes identical to the trunk)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-04-0939 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `43685438b`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `object-edge-delete` into the trunk with one merge commit, `--no-ff`, of the explicit sha `cd387ab59`, in the shape of `544fbd19f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `43685438b`. The branch carries, on top of the base, 7 commits:

- `cd387ab59` docs: closure of object-edge-delete, R-B17 provisional (P-2026-10-04-0130)
- `dc489a6b3` probe: crop the open context menu, not an empty one at the origin (P-2026-10-04-0130)
- `04acc1815` probe: object-as-edge delete on DemoESM, menu, Delete key, undo (P-2026-10-04-0130)
- `5d4e8b0b6` test(editor-v2): object-as-edge resolve and delete (P-2026-10-04-0130)
- `5557a714b` fix(editor-v2): an object-as-edge deletes its object (P-2026-10-04-0130)
- `86d15831b` docs: discovery, an object-as-edge cannot be deleted (P-2026-10-04-0130)
- `ae4ea38e6` docs: add prompt P-2026-10-04-0130, object-as-edge delete

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-04 09:39, trunk at `43685438b`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl cd387ab59`: zero conflicts.
- Files changed since the base: 8 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 43685438b cd387ab59 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-04_0130_prompt_object_edge_delete.md` (eseguito 2026-10-04 · lane object-edge-delete · fix 5557a714b, test 5d4e8b0b6, probe 04acc1815, dc489a6b3 · report 86d15831b docs/discovery/discovery_2026-10-04_object_edge_delete.md (§10 D2 revised by measurement, R-B17 provisional) · gates: typecheck 14 (the §17 set), vitest 7289 passed (the §17 nine at import, criticalZone.test.ts green with the go-ahead variable unset), build exit 0 · probe on 3084 17/17 after, 10/10 before (the bug measured), the four default panes identical to the trunk-code run 4/4 · mutation bench 15/15 canvasToJjom.ts, 4/4 EditorV2.tsx · crops in ~/.jjodel-lanes/P-2026-10-04-0130/crops/ · non fuso: hard-stop, verifica visiva alla chat e GO di Alfonso (critical zone)).
- `git worktree list`: `object-edge-delete` in `/Users/alfonso/jjodel-w-objedgedel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-04-0939/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `cd387ab59` is the tip of `object-edge-delete`; the prompt files of the branch read `Status: eseguito` at `cd387ab59`; `git worktree list` shows `object-edge-delete` only in `/Users/alfonso/jjodel-w-objedgedel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl cd387ab59` (measured above: zero conflicts). `git diff --name-only 43685438b cd387ab59 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 43685438b alfonso-frontend-jjtl` with `git diff --name-only 43685438b cd387ab59` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — fix(editor-v2): an object-as-edge deletes its object from its own menu and the Delete key (P-2026-10-04-0130)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: «Reset routing» of a persisted object-as-edge route comes back at reload` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: an object node delete leaves its vertex and link edges as ghosts under an IR viewpoint` once (branch).
4. `git merge --no-ff --no-commit cd387ab59`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: object-edge-delete into alfonso-frontend-jjtl (P-2026-10-04-0939)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `cd387ab59` in `/Users/alfonso/jjodel-w-objedgedel`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 43685438b` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the object-edge-delete merge (P-2026-10-04-0939)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-objedgedel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
