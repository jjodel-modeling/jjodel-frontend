# Prompt: merge sim-io-clock into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-04-1504
Chat: C-2026-10-04-0145
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-10-04 · lane merge · 6704563a8 · verifica visiva passata 2026-10-04 (RC-23 by the chat on the lane crops (light): editor palette and period field, Variant A with tick count equal to the step count, microwave display 01:25 at secs 85 after plus x3, start and five ticks, plus and start disabled while Cooking. Alfonso accepted decision 1 of R-SIM-122 (a tick answers inputs from the board's switch and slider values), 2026-10-04. Tickets, low: the clock's On face pairs a pause icon with the word On (state and action mixed, use Pause/Start); binding captions truncated, more visible on clock tiles. Note: R-RAIL-44 under Superate de-bolded on the trunk (c25c758f4) so the duplicate-row probe no longer trips on D-UI-15.)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-04-1504 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c25c758f4`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-io-clock` into the trunk with one merge commit, `--no-ff`, of the explicit sha `452efc6f1`, in the shape of `b3fe55c5d` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `43685438b`. The branch carries, on top of the base, 5 commits:

- `452efc6f1` docs: closure of the Clock lane, R-SIM-122 and the inbox entry (P-2026-10-04-0150)
- `bed918e5f` test: the Clock of the I/O board, codec, face and driver (P-2026-10-04-0150)
- `52ddd7163` feat: a Clock input device on the I/O board (P-2026-10-04-0150)
- `51b074753` docs: discovery for the Clock device of the I/O board (P-2026-10-04-0150)
- `a454e2576` docs: add prompt P-2026-10-04-0150, clock device on the I/O board

The trunk carries, since the base, 22 commits:

- `c25c758f4` docs: R-RAIL-44 under Superate no longer reads as a second row
- `ec99e8e5b` docs: Status flip and log entry for the sim-hide-events merge (P-2026-10-04-1456)
- `b3fe55c5d` merge: sim-hide-events into alfonso-frontend-jjtl (P-2026-10-04-1456)
- `4dbe84539` docs: add prompt P-2026-10-04-1456, merge sim-hide-events into alfonso-frontend-jjtl
- `452b810ac` docs: Status flip and log entry, sim-hide-events took the trunk (P-2026-10-04-1213)
- `c53a5a8d1` merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)
- `25db14eb0` docs: add prompt P-2026-10-04-1213, merge alfonso-frontend-jjtl into sim-hide-events
- `94722697c` docs: Status flip and log entry for hiding events during a run (P-2026-10-04-0935)
- `8d0021987` feat(sim): hide event nodes and their edges during a run (P-2026-10-04-0935)
- `5b4d6c887` docs: R-B17 ratified by Alfonso
- `18a861da7` docs: retire the dark theme for good (D-UI-15)
- `d6bd5c5f6` docs: Status flip and log entry for the object-edge-delete merge (P-2026-10-04-0939)
- `1bd0b33c0` merge: object-edge-delete into alfonso-frontend-jjtl (P-2026-10-04-0939)
- `4316c8f9e` docs: add prompt P-2026-10-04-0939, merge object-edge-delete into alfonso-frontend-jjtl
- `5e9d4771b` docs: prompt for hiding events on the canvas during a run
- `cd387ab59` docs: closure of object-edge-delete, R-B17 provisional (P-2026-10-04-0130)
- `dc489a6b3` probe: crop the open context menu, not an empty one at the origin (P-2026-10-04-0130)
- `04acc1815` probe: object-as-edge delete on DemoESM, menu, Delete key, undo (P-2026-10-04-0130)
- `5d4e8b0b6` test(editor-v2): object-as-edge resolve and delete (P-2026-10-04-0130)
- `5557a714b` fix(editor-v2): an object-as-edge deletes its object (P-2026-10-04-0130)
- `86d15831b` docs: discovery, an object-as-edge cannot be deleted (P-2026-10-04-0130)
- `ae4ea38e6` docs: add prompt P-2026-10-04-0130, object-as-edge delete

Measured by `lane-run merge` at 2026-10-04 15:04, trunk at `c25c758f4`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 452efc6f1`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 16 on the branch side, 22 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only 43685438b 452efc6f1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-04_0150_prompt_sim_io_clock.md` (eseguito 2026-10-04 · lane sim-io-clock · report 51b074753, feat 52ddd7163, test bed918e5f · R-SIM-122 · typecheck 14, the §17 set; vitest 7310/7310 in 295 files, the 9 known suites red at import; build exit 0, chunk-size warning only; mutation bench 48/48 (simBoardClock.ts 24, boardCodec.ts 11, simBoard.ts 6, simBoardFace.ts 7); check:scripts exit 0 · lane probe on 3083 (frontend/scripts/smoke/_tmp_ioclock_probe.ts, gitignored): clock 22/22 (5 ticks and step 5 at 1000 ms, 21 ticks in 2195 ms at 100 ms, off at Reset, board close, Halted), microwave 8/8 (01:25 after 5 s; Play and the clock together, control without keepPlay fails), the four demo scenes 50/50 base and after, 0 differing paths, header and board card included; crops light and dark in ~/.jjodel-lanes/P-2026-10-04-0150/ · SimBoardEditor.scss untouched · hard-stop for the chat's visual check (RC-23) · non fuso).
- `git worktree list`: `sim-io-clock` in `/Users/alfonso/jjodel-w-ioclock`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-04-1504/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `452efc6f1` is the tip of `sim-io-clock`; the prompt files of the branch read `Status: eseguito` at `452efc6f1`; `git worktree list` shows `sim-io-clock` only in `/Users/alfonso/jjodel-w-ioclock`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 452efc6f1` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 43685438b 452efc6f1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 43685438b alfonso-frontend-jjtl` with `git diff --name-only 43685438b 452efc6f1` (measured above: `docs/decisions.md`, `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-122` (branch), `R-RAIL-44` (trunk); control: `- **R-RAIL-46**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: the I/O board's Clock (R-SIM-122)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: a Clock input device on the I/O board (P-2026-10-04-0150)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: event nodes and their edges hidden on the canvas during a run (P-2026-10-04-0935)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-hide-events into alfonso-frontend-jjtl (P-2026-10-04-1456)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — fix(editor-v2): an object-as-edge deletes its object from its own menu and the Delete key (P-2026-10-04-0130)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: «Reset routing» of a persisted object-as-edge route comes back at reload` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — ticket: an object node delete leaves its vertex and link edges as ghosts under an IR viewpoint` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — merge: object-edge-delete into alfonso-frontend-jjtl (P-2026-10-04-0939)` once (trunk).
4. `git merge --no-ff --no-commit 452efc6f1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-io-clock into alfonso-frontend-jjtl (P-2026-10-04-1504)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `452efc6f1` in `/Users/alfonso/jjodel-w-ioclock`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c25c758f4` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-io-clock merge (P-2026-10-04-1504)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ioclock`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
