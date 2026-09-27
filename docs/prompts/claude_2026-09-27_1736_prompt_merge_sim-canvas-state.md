# Prompt: merge sim-canvas-state into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-27-1736
Chat: C-2026-09-27-1437
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1736 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `d9e88f792`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-canvas-state` into the trunk with one merge commit, `--no-ff`, of the explicit sha `7e0874af6`, in the shape of `04bfb6b58` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7a4976853`. The branch carries, on top of the base, 3 commits:

- `7e0874af6` docs(sim): Alfonso ratifies the backlog and canvas recommendations (C-2026-09-27-1437)
- `3c4a63e74` docs(sim): canvas run-state discovery (P-2026-09-27-1647)
- `7b66f879f` docs: add prompt P-2026-09-27-1647, canvas run-state discovery

The trunk carries, since the base, 17 commits:

- `d9e88f792` docs: Status flip for the sim-e2-panel-bound merge (P-2026-09-27-1723)
- `04bfb6b58` merge: sim-e2-panel-bound into alfonso-frontend-jjtl (P-2026-09-27-1723)
- `42787f7d8` docs: add prompt P-2026-09-27-1723, merge sim-e2-panel-bound into alfonso-frontend-jjtl
- `adc1dc137` docs: Status flip, sim-e2-panel-bound took the trunk (P-2026-09-27-1704)
- `93e964141` docs: Status flip for the sim-binding-compat merge (P-2026-09-27-1705)
- `99d7bfff8` merge: sim-e2-panel-bound takes alfonso-frontend-jjtl (P-2026-09-27-1704)
- `e4813a3cb` merge: sim-binding-compat into alfonso-frontend-jjtl (P-2026-09-27-1705)
- `7e88d4764` docs: add prompt P-2026-09-27-1705, merge sim-binding-compat into alfonso-frontend-jjtl
- `32443277e` docs: add prompt P-2026-09-27-1704, merge alfonso-frontend-jjtl into sim-e2-panel-bound
- `799ee13d5` docs(sim): E2 Status, visual check passed (P-2026-09-27-1611)
- `71807ed61` docs(sim): S11a closure, log entry, Status (P-2026-09-27-1646)
- `3d44abce0` feat(sim): binding compatibility verdicts as a pure module (P-2026-09-27-1646)
- `dccd3206a` docs(sim): E2 closure, R-SIM-81(1) amended, log entry, Status (P-2026-09-27-1611)
- `e08984295` docs: add prompt P-2026-09-27-1646, binding compatibility verdicts
- `babbc161c` feat(sim): activity-final row in Configure General (G6) (P-2026-09-27-1611)
- `917b1546b` feat(sim): Bound proposed by a bounded exploration (G12) (P-2026-09-27-1611)
- `d685b5738` docs: add prompt P-2026-09-27-1611, E2 panel row and Bound by exploration

Measured by `lane-run merge` at 2026-09-27 17:36, trunk at `d9e88f792`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7e0874af6`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 4 on the branch side, 18 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only 7a4976853 7e0874af6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1647_prompt_discovery_sim_canvas_state.md` (eseguito 2026-09-27 · lane sim-canvas-state · measured on 7b66f879f; the report is in the commit that carries this line (a commit cannot name its own sha)).
- `git worktree list`: `sim-canvas-state` in `/Users/alfonso/jjodel-icons`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `7e0874af6` is the tip of `sim-canvas-state`; the prompt files of the branch read `Status: eseguito` at `7e0874af6`; `git worktree list` shows `sim-canvas-state` only in `/Users/alfonso/jjodel-icons`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7e0874af6` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 7a4976853 7e0874af6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7a4976853 alfonso-frontend-jjtl` with `git diff --name-only 7a4976853 7e0874af6` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: the run state on the canvas, S15, G3 canvas side (P-2026-09-27-1647)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: binding compatibility verdicts as a pure module, S11a (P-2026-09-27-1646)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: E2, Bound from a bounded exploration and the activity-final row (P-2026-09-27-1611)` once (trunk).
4. `git merge --no-ff --no-commit 7e0874af6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-canvas-state into alfonso-frontend-jjtl (P-2026-09-27-1736)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `7e0874af6` in `/Users/alfonso/jjodel-icons`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the sim-canvas-state merge (P-2026-09-27-1736)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-icons`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
