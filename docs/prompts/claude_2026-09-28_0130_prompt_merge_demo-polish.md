# Prompt: merge demo-polish into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-0130
Chat: C-2026-09-27-1437
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-0130 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1f5e505b1`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `demo-polish` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d01f03e5c`, in the shape of `7ece192d9` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `e87df1ff6`. The branch carries, on top of the base, 3 commits:

- `d01f03e5c` docs: demo script save check, log entry and Status (P-2026-09-28-0014)
- `813a73ff5` fix: the theme switch reaches the open editor (P-2026-09-28-0014)
- `c708bb55a` docs: add prompt P-2026-09-28-0014, demo polish F2 F3 F1

The trunk carries, since the base, 36 commits:

- `1f5e505b1` docs: Status flip for the sim-canvas-state merge (P-2026-09-28-0059)
- `7ece192d9` merge: sim-canvas-state into alfonso-frontend-jjtl (P-2026-09-28-0059)
- `a658a00b4` docs: add prompt P-2026-09-28-0059, merge sim-canvas-state into alfonso-frontend-jjtl
- `2e4a09c78` docs: Status flip, demo script, log entry for the sim-checker-rules merge (P-2026-09-28-0023)
- `b452d9e5c` merge: sim-checker-rules into alfonso-frontend-jjtl (P-2026-09-28-0023)
- `5af828d8d` docs(sim): Status flip, canvas run state A2 visual check passed (P-2026-09-27-2324)
- `bd750a74f` docs: add prompt P-2026-09-28-0023, merge sim-checker-rules into alfonso-frontend-jjtl
- `7a03daa1c` docs: Status flip, sim-checker-rules took the trunk (P-2026-09-28-0005)
- `606d9e761` docs(sim): canvas run state slice A2, entry and Status (P-2026-09-27-2324)
- `5dd16be7e` merge: sim-checker-rules takes alfonso-frontend-jjtl (P-2026-09-28-0005)
- `e49b10497` feat(sim): the pending choice on the canvas, slice A2 (P-2026-09-27-2324)
- `00c5c547f` docs: add prompt P-2026-09-28-0005, merge alfonso-frontend-jjtl into sim-checker-rules
- `f5b70578d` docs: add prompt P-2026-09-27-2324, canvas run state slice A2
- `cc75e3aeb` docs: Status flip, sim-canvas-state took the trunk (P-2026-09-27-2304)
- `cadbf254e` merge: sim-canvas-state takes alfonso-frontend-jjtl (P-2026-09-27-2304)
- `92ee825f3` docs: add prompt P-2026-09-27-2304, merge alfonso-frontend-jjtl into sim-canvas-state
- `2b815a87b` docs(sim): P2b closure, R-SIM-70 extended, log entry, Status (P-2026-09-27-2235)
- `8beb4b28e` feat(sim): the checker rules R1-R5 (P2b) (P-2026-09-27-2235)
- `6d8129aae` merge: sim-derived-recursion into sim-checker-rules (P-2026-09-27-2235)
- `a4300095c` docs: add prompt P-2026-09-27-2235
- `b0d75d190` docs(sim): Status flip, canvas run state A1 visual check passed (P-2026-09-27-1647)
- `6bfec18ef` docs(sim): canvas run state slice A1, entry, ticket and Status (P-2026-09-27-1647)
- `4538d824f` feat(sim): run state on the canvas nodes, slice A1 (P-2026-09-27-1647)
- `811cb4ee5` docs(sim): checker gap P2a closure, log entry, Status (P-2026-09-27-1805)
- `e6d25ef5d` docs(sim): S3 closure, R-SIM-74 amended, log entry, Status (P-2026-09-27-1727)
- `0412501ef` feat(sim): guard and action checks in the problems registry (P-2026-09-27-1805)
- `d2a19ccab` feat(sim): the run orders derived attributes per element (P-2026-09-27-1727)
- `805c8ecdd` feat(sim): derived dependencies per element over frozen M (P-2026-09-27-1727)
- `4bbe3790a` docs(sim): Layer Impact Report for the checker gap Phase 2 (P-2026-09-27-1805)
- `4cc0c4c20` docs: add prompt P-2026-09-27-1805, checker gap Phase 2
- `a9acb6634` docs(sim): chat answers the checker gap discovery (P-2026-09-27-1726)
- `be8ad89a7` docs(sim): guard and action checks in the problems list discovery (P-2026-09-27-1726)
- `8baee76b6` docs(sim): Alfonso answers the derived recursion discovery (P-2026-09-27-1727)
- `4868359c9` docs(sim): well-founded recursion in derived attributes discovery (P-2026-09-27-1727)
- `21394e437` docs: add prompt P-2026-09-27-1727, sim_derived_recursion discovery
- `d1d45b9d3` docs: add prompt P-2026-09-27-1726, sim_checker_gap discovery

Measured by `lane-run merge` at 2026-09-28 01:30, trunk at `1f5e505b1`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d01f03e5c`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 4 on the branch side, 38 on the trunk side; on both sides: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only e87df1ff6 d01f03e5c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_0014_prompt_demo_polish.md` (eseguito 2026-09-28 · lane demo-polish · 813a73ff5 · verifica visiva OK (chat, RC-23) · F3 accepted for MODELS, ticket after MODELS).
- `git worktree list`: `demo-polish` in `/Users/alfonso/jjodel-w-polish`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d01f03e5c` is the tip of `demo-polish`; the prompt files of the branch read `Status: eseguito` at `d01f03e5c`; `git worktree list` shows `demo-polish` only in `/Users/alfonso/jjodel-w-polish`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d01f03e5c` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only e87df1ff6 d01f03e5c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only e87df1ff6 alfonso-frontend-jjtl` with `git diff --name-only e87df1ff6 d01f03e5c` (measured above: `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: demo polish, the theme switch reaches the open editor; toolbar labels accepted for MODELS (P-2026-09-28-0014)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: guard and action checks in the problems list, S16 (P-2026-09-27-1726)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: guard and action checks in the problems registry, P2a (P-2026-09-27-1805)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: well-founded recursion in derived attributes, S3 (P-2026-09-27-1727)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: derived attributes ordered per element over frozen M, S3 (P-2026-09-27-1727)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the checker rules R1-R5 at Reset, P2b (P-2026-09-27-2235)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-checker-rules into alfonso-frontend-jjtl (P-2026-09-28-0023)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the run state on the canvas nodes, slice A1 of S15 (P-2026-09-27-1647)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — ticket: every Reset serializes the selected model to ecore, and logs a loop on cyclic models` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: the pending choice on the canvas, slice A2 of S15 (P-2026-09-27-2324)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — ticket: the pending ring does not reach IR object-as-edge edges` once (trunk).
4. `git merge --no-ff --no-commit d01f03e5c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: demo-polish into alfonso-frontend-jjtl (P-2026-09-28-0130)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d01f03e5c` in `/Users/alfonso/jjodel-w-polish`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the demo-polish merge (P-2026-09-28-0130)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-polish`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
