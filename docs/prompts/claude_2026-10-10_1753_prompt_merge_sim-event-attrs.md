# Prompt: merge sim-event-attrs into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1753
Chat: C-2026-10-10-1620
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1753 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c43001de4`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-event-attrs` into the trunk with one merge commit, `--no-ff`, of the explicit sha `039ed6f62`, in the shape of `c43001de4` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ae50f7459`. The branch carries, on top of the base, 5 commits:

- `039ed6f62` docs: Status flip for the event attributes Phase 2 (P-2026-10-10-1630)
- `6ccf89d0e` docs: closure of the event attributes lane, R-SIM-144 (P-2026-10-10-1630)
- `ce1a3465f` chore(probe): R-SIM-144 parity and visual checks (P-2026-10-10-1630)
- `8141fa8a3` feat(sim): event reads checked at Reset, unset event attributes warned (P-2026-10-10-1630)
- `b7405daa2` test(sim): event reads at Reset and the unset warning, red (P-2026-10-10-1630)

The trunk carries, since the base, 29 commits:

- `c43001de4` merge: codegen-engine into alfonso-frontend-jjtl (P-2026-10-10-1747)
- `7630ac06a` docs: add prompt P-2026-10-10-1747, merge codegen-engine into alfonso-frontend-jjtl
- `58f48506b` docs: Status flips for the codegen S2 and S4 lanes (P-2026-10-10-0945, P-2026-10-10-0950)
- `c0d0cdef0` docs: Status flip and log entry for the sim-coverage-polish merge (P-2026-10-10-1737)
- `061c31707` docs: Status flip for the lane board span lane (P-2026-10-10-1717)
- `1d63b4909` docs: Status flip and log entry for the lane-board-span merge (P-2026-10-10-1731)
- `94d3a9739` docs: Status flip and log entry for the lane-tracking merge (P-2026-10-10-1648)
- `a0289af13` merge: sim-coverage-polish into alfonso-frontend-jjtl (P-2026-10-10-1737)
- `aaff2de2e` docs: add prompt P-2026-10-10-1737, merge sim-coverage-polish into alfonso-frontend-jjtl
- `a2e854587` docs: Status flip and log entry for the sim-board-keys merge (P-2026-10-10-1726)
- `177dc474b` merge: lane-board-span into alfonso-frontend-jjtl (P-2026-10-10-1731)
- `0a565a976` docs: add prompt P-2026-10-10-1731, merge lane-board-span into alfonso-frontend-jjtl
- `bd97bae49` merge: sim-board-keys into alfonso-frontend-jjtl (P-2026-10-10-1726)
- `19ba64894` docs: add prompt P-2026-10-10-1726, merge sim-board-keys into alfonso-frontend-jjtl
- `2ee2c2ea6` docs: log entry for the lane board span column (P-2026-10-10-1717)
- `960294cd4` feat(harness): lane board shows the span beside the working time
- `7e630c632` docs: Status flip for P-2026-10-10-1646
- `88f6093a4` docs: Status flip for P-2026-10-10-1645
- `0132e7149` docs(log): closure entry, board editor keys and CSS (P-2026-10-10-1645)
- `c1ce5b60f` docs(log): coverage polish lane entry, R-SIM-146 points 4-5 (P-2026-10-10-1646)
- `f515ae45d` chore(probe): coverage polish probe, controls, Clear, four scenes (P-2026-10-10-1646)
- `0f724e1c5` chore(probe): board editor keys and styles, base against after (P-2026-10-10-1645)
- `8a7d60355` feat(sim): board editor arrows move, Shift and an arrow select (P-2026-10-10-1645)
- `22596e50b` refactor(sim): delete the old board editor's dead rules (P-2026-10-10-1645)
- `14382ed70` feat(sim): fixed-width Coverage switch, Clear sees the live marking (P-2026-10-10-1646)
- `69ff1c4ef` test(sim): Clear sees the live marking, fixed-width coverage controls (P-2026-10-10-1646)
- `6e1dd0ddd` test(sim): arrows move, Shift and an arrow select, in the board editor (P-2026-10-10-1645)
- `0bebec308` docs: log entry for the code generation S2 engine (P-2026-10-10-0945)
- `67d74be39` feat(codegen): template engine with Text, origin, indentation and codec (P-2026-10-10-0945)

Measured by `lane-run merge` at 2026-10-10 17:53, trunk at `c43001de4`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 039ed6f62`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 9 on the branch side, 36 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only ae50f7459 039ed6f62 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `sim-event-attrs` in `/Users/alfonso/jjodel-w-eventattrs`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1753/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `039ed6f62` is the tip of `sim-event-attrs`; the prompt files of the branch read `Status: eseguito` at `039ed6f62`; `git worktree list` shows `sim-event-attrs` only in `/Users/alfonso/jjodel-w-eventattrs`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 039ed6f62` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only ae50f7459 039ed6f62 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ae50f7459 alfonso-frontend-jjtl` with `git diff --name-only ae50f7459 039ed6f62` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: event reads checked at Reset, the unset warning, R-SIM-144 (P-2026-10-10-1630)` once (branch).
   - `docs/log-inbox/codegen-engine.md`: the heading `## 2026-10-10 — feat(codegen): template engine, Text with origin, block indentation, codec (P-2026-10-10-0945)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board shows the span beside the working time (P-2026-10-10-1717)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-tracking into alfonso-frontend-jjtl (P-2026-10-10-1648)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: merge-into-trunk.md misreads a governance go-ahead and counts check:docs as 4/4` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-span into alfonso-frontend-jjtl (P-2026-10-10-1731)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: board editor arrows move, Shift and an arrow select, old CSS removed (P-2026-10-10-1645)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-board-keys into alfonso-frontend-jjtl (P-2026-10-10-1726)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: fixed-width Coverage switch, Clear sees the live marking (P-2026-10-10-1646)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-coverage-polish into alfonso-frontend-jjtl (P-2026-10-10-1737)` once (trunk).
4. `git merge --no-ff --no-commit 039ed6f62`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `039ed6f62` in `/Users/alfonso/jjodel-w-eventattrs`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c43001de4` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-event-attrs merge (P-2026-10-10-1753)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-eventattrs`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
