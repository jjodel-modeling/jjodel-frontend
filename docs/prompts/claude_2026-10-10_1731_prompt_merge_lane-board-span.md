# Prompt: merge lane-board-span into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1731
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-10 · lane merge · 177dc474b · verifica visiva passata 2026-10-10 (chat, unattended: scripts-only (lane board), app untouched; Span verified on 4701 under P-2026-10-10-1717 and on 4700 after the kickstart)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1731 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `bd97bae49`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-board-span` into the trunk with one merge commit, `--no-ff`, of the explicit sha `2ee2c2ea6`, in the shape of `bd97bae49` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `30be4d558`. The branch carries, on top of the base, 2 commits:

- `2ee2c2ea6` docs: log entry for the lane board span column (P-2026-10-10-1717)
- `960294cd4` feat(harness): lane board shows the span beside the working time

The trunk carries, since the base, 17 commits:

- `bd97bae49` merge: sim-board-keys into alfonso-frontend-jjtl (P-2026-10-10-1726)
- `19ba64894` docs: add prompt P-2026-10-10-1726, merge sim-board-keys into alfonso-frontend-jjtl
- `ae50f7459` docs(prompts): event attributes, Phase 2 GO (P-2026-10-10-1630)
- `2b670ddd4` docs(decisions): R-SIM-144, event attributes in guards and actions; spec section 8 row
- `19b77131c` docs: Status flip and log entry for the sim-event-attrs merge (P-2026-10-10-1718)
- `bf252c036` merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1718)
- `88f6093a4` docs: Status flip for P-2026-10-10-1645
- `a2941670e` docs: add prompt P-2026-10-10-1718, merge sim-event-attrs into alfonso-frontend-jjtl
- `0132e7149` docs(log): closure entry, board editor keys and CSS (P-2026-10-10-1645)
- `7dec869e8` docs(prompts): graphVertex S6 GO, Auto layout for containers (P-2026-10-10-0105)
- `01f833e32` docs: Status flip for the event attributes discovery (P-2026-10-10-1630)
- `0f724e1c5` chore(probe): board editor keys and styles, base against after (P-2026-10-10-1645)
- `325cfafec` docs(discovery): event attributes in guards and actions (P-2026-10-10-1630)
- `8a7d60355` feat(sim): board editor arrows move, Shift and an arrow select (P-2026-10-10-1645)
- `22596e50b` refactor(sim): delete the old board editor's dead rules (P-2026-10-10-1645)
- `6e1dd0ddd` test(sim): arrows move, Shift and an arrow select, in the board editor (P-2026-10-10-1645)
- `413f0096d` chore(probe): event attribute reads in guards and actions (P-2026-10-10-1630)

Measured by `lane-run merge` at 2026-10-10 17:31, trunk at `bd97bae49`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2ee2c2ea6`: zero conflicts.
- Files changed since the base: 2 on the branch side, 20 on the trunk side; on both sides: none.
- `git diff --name-only 30be4d558 2ee2c2ea6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `lane-board-span` in `/Users/alfonso/jjodel-w-boardspan`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1731/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `2ee2c2ea6` is the tip of `lane-board-span`; the prompt files of the branch read `Status: eseguito` at `2ee2c2ea6`; `git worktree list` shows `lane-board-span` only in `/Users/alfonso/jjodel-w-boardspan`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2ee2c2ea6` (measured above: zero conflicts). `git diff --name-only 30be4d558 2ee2c2ea6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 30be4d558 alfonso-frontend-jjtl` with `git diff --name-only 30be4d558 2ee2c2ea6` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-144` (trunk); control: `- **R-SIM-147**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board shows the span beside the working time (P-2026-10-10-1717)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-10: the attributes of the event that fired the step (R-SIM-144)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — discovery: event attributes read by guards and actions (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1718)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: board editor arrows move, Shift and an arrow select, old CSS removed (P-2026-10-10-1645)` once (trunk).
4. `git merge --no-ff --no-commit 2ee2c2ea6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-board-span into alfonso-frontend-jjtl (P-2026-10-10-1731)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `2ee2c2ea6` in `/Users/alfonso/jjodel-w-boardspan`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard bd97bae49` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-board-span merge (P-2026-10-10-1731)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardspan`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
