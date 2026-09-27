# Prompt: merge sim-modal into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-27-2049
Chat: C-2026-09-27-1437
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-09-27 · lane merge · 5eccdd4d2 · verifica visiva su 3001 non eseguita in questa corsia (la chat ha chiesto Outcome: done dopo i gate; embargo tolto da Alfonso 2026-09-27 17:39, R-SIM-85)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-2049 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `fa3199b42`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-modal` into the trunk with one merge commit, `--no-ff`, of the explicit sha `78afc0378`, in the shape of `cbfb7bfad` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d9e88f792`. The branch carries, on top of the base, 8 commits:

- `78afc0378` docs(sim): Status flip, the Simulation roles modal verified (P-2026-09-27-1740)
- `ebe2054f8` fix(sim): the first-open footer aligns with the roles footer (P-2026-09-27-1740)
- `1b498b6c1` docs(sim): Status flip and log entry, Simulation roles modal Phase 2 (P-2026-09-27-1740)
- `e34323517` feat(sim): user profiles and compatible selects in the modal, slice C (P-2026-09-27-1740)
- `b582ca7d4` feat(sim): the Simulation roles modal, system presets, slice B (P-2026-09-27-1740)
- `645703645` feat(sim): the pure layer of the Simulation roles modal, slice A (P-2026-09-27-1740)
- `30c28f817` docs(sim): Simulation roles modal discovery (P-2026-09-27-1740)
- `d318b6a40` docs: add prompt P-2026-09-27-1740 and the Simulation roles design reference

The trunk carries, since the base, 16 commits:

- `fa3199b42` docs: Status flip for the sim-demo-script-e1e2 merge (P-2026-09-27-1801)
- `cbfb7bfad` merge: sim-demo-script-e1e2 into alfonso-frontend-jjtl (P-2026-09-27-1801)
- `196e071e7` docs: add prompt P-2026-09-27-1801, merge sim-demo-script-e1e2 into alfonso-frontend-jjtl
- `c5da297cb` docs: Status flip for the enum-step-b merge (P-2026-09-27-1751)
- `c17f27d76` merge: enum-step-b into alfonso-frontend-jjtl (P-2026-09-27-1751)
- `473f6841a` docs(sim): demo script after E1 and E2 (P-2026-09-27-1738)
- `e1ed65b85` docs: add prompt P-2026-09-27-1751, merge enum-step-b into alfonso-frontend-jjtl
- `681e0f0eb` docs: Status flip for the sim-canvas-state merge (P-2026-09-27-1736)
- `5176c70ac` merge: sim-canvas-state into alfonso-frontend-jjtl (P-2026-09-27-1736)
- `52daba803` docs: add prompt P-2026-09-27-1738, demo script after E1 and E2
- `56c473168` docs: add prompt P-2026-09-27-1736, merge sim-canvas-state into alfonso-frontend-jjtl
- `f1ea18733` docs(views): enum step B discovery (P-2026-09-27-1645)
- `7e0874af6` docs(sim): Alfonso ratifies the backlog and canvas recommendations (C-2026-09-27-1437)
- `3c4a63e74` docs(sim): canvas run-state discovery (P-2026-09-27-1647)
- `7b66f879f` docs: add prompt P-2026-09-27-1647, canvas run-state discovery
- `ce4b28b0a` docs: add prompt P-2026-09-27-1645, enum step B discovery

Measured by `lane-run merge` at 2026-09-27 20:49, trunk at `fa3199b42`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 78afc0378`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 25 on the branch side, 12 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only d9e88f792 78afc0378 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1740_prompt_sim_modal.md` (eseguito 2026-09-27 · lane sim-modal · 30c28f817 (Phase 1), 645703645, b582ca7d4, e34323517, ebe2054f8 · verifica visiva OK (chat, RC-23; crops ~/.jjodel-lanes/shots_modal/)).
- `git worktree list`: `sim-modal` in `/Users/alfonso/jjodel-w-modal`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `78afc0378` is the tip of `sim-modal`; the prompt files of the branch read `Status: eseguito` at `78afc0378`; `git worktree list` shows `sim-modal` only in `/Users/alfonso/jjodel-w-modal`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 78afc0378` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only d9e88f792 78afc0378 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d9e88f792 alfonso-frontend-jjtl` with `git diff --name-only d9e88f792 78afc0378` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: the Simulation roles modal, S11b and S11c, Phase 1 (P-2026-09-27-1740)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the Simulation roles modal, S11b and S11c, Phase 2 (P-2026-09-27-1740)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: the run state on the canvas, S15, G3 canvas side (P-2026-09-27-1647)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — docs: demo script after E1 and E2 (P-2026-09-27-1738)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-27 — docs(views): enum step B discovery, load, undo/redo and replay against the guarded setters (P-2026-09-27-1645)` once (trunk).
4. `git merge --no-ff --no-commit 78afc0378`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-modal into alfonso-frontend-jjtl (P-2026-09-27-2049)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `78afc0378` in `/Users/alfonso/jjodel-w-modal`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the sim-modal merge (P-2026-09-27-2049)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-modal`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
