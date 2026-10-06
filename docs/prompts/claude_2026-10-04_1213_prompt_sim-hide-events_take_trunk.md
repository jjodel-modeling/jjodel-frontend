# Prompt: sim-hide-events takes the trunk before its own merge

Prompt-ID: P-2026-10-04-1213
Chat: C-2026-10-04-0935
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: eseguito 2026-10-04 · lane sim-hide-events · c53a5a8d1 · verifica visiva passata 2026-10-04 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-simhide`, branch `sim-hide-events`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simhide`, branch `sim-hide-events`, `git log -1` is the commit that adds this file (its parent `94722697c`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-04-1213 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `5b4d6c887` into `sim-hide-events` with one merge commit, `--no-ff`, in the shape of `544fbd19f` (the last merge commit on `sim-hide-events`; read its body first). Merge base `43685438b`. The trunk brings, since the base, 12 commits:

- `5b4d6c887` docs: R-B17 ratified by Alfonso
- `18a861da7` docs: retire the dark theme for good (D-UI-15)
- `d6bd5c5f6` docs: Status flip and log entry for the object-edge-delete merge (P-2026-10-04-0939)
- `1bd0b33c0` merge: object-edge-delete into alfonso-frontend-jjtl (P-2026-10-04-0939)
- `4316c8f9e` docs: add prompt P-2026-10-04-0939, merge object-edge-delete into alfonso-frontend-jjtl
- `cd387ab59` docs: closure of object-edge-delete, R-B17 provisional (P-2026-10-04-0130)
- `dc489a6b3` probe: crop the open context menu, not an empty one at the origin (P-2026-10-04-0130)
- `04acc1815` probe: object-as-edge delete on DemoESM, menu, Delete key, undo (P-2026-10-04-0130)
- `5d4e8b0b6` test(editor-v2): object-as-edge resolve and delete (P-2026-10-04-0130)
- `5557a714b` fix(editor-v2): an object-as-edge deletes its object (P-2026-10-04-0130)
- `86d15831b` docs: discovery, an object-as-edge cannot be deleted (P-2026-10-04-0130)
- `ae4ea38e6` docs: add prompt P-2026-10-04-0130, object-as-edge delete

This branch brings, 3 commits:

- `94722697c` docs: Status flip and log entry for hiding events during a run (P-2026-10-04-0935)
- `8d0021987` feat(sim): hide event nodes and their edges during a run (P-2026-10-04-0935)
- `5e9d4771b` docs: prompt for hiding events on the canvas during a run

Measured by `lane-run merge --trunk-into` at 2026-10-04 12:13, trunk at `5b4d6c887`:

- `git merge-tree --write-tree --name-only sim-hide-events 5b4d6c887`: zero conflicts.
- Files changed since the base: 6 on the branch side, 15 on the trunk side; on both sides: `frontend/src/components/editor-v2/EditorV2.tsx`.
- `git diff --name-only 43685438b 94722697c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-04_0935_prompt_sim_hide_events_during_run.md` (eseguito 2026-10-04 · lane sim-hide-events · 8d0021987 · verifica visiva passata 2026-10-04).
- `git worktree list`: `sim-hide-events` in `/Users/alfonso/jjodel-w-simhide`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `5b4d6c887` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `5b4d6c887` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only sim-hide-events 5b4d6c887` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 5b4d6c887`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-RAIL-44` (trunk); control: `- **R-RAIL-46**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: event nodes and their edges hidden on the canvas during a run (P-2026-10-04-0935)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — fix(editor-v2): an object-as-edge deletes its object from its own menu and the Delete key (P-2026-10-04-0130)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: «Reset routing» of a persisted object-as-edge route comes back at reload` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: an object node delete leaves its vertex and link edges as ghosts under an IR viewpoint` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — merge: object-edge-delete into alfonso-frontend-jjtl (P-2026-10-04-0939)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`frontend/src/components/editor-v2/EditorV2.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 94722697c` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane sim-hide-events · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, sim-hide-events took the trunk (P-2026-10-04-1213)` (P16, RC-17). `Outcome: done`. The merge of `sim-hide-events` into the trunk gets its own prompt (`lane-run merge sim-hide-events --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
