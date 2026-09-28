# Prompt: merge sim-outputs-accepting into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-2343
Chat: C-2026-09-28-1936
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-2343 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `27badf6c2`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-outputs-accepting` into the trunk with one merge commit, `--no-ff`, of the explicit sha `97082df02`, in the shape of `b0e4b9f15` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `fb044365b`. The branch carries, on top of the base, 9 commits:

- `97082df02` docs(sim): R-SIM-91..93 ratified, S4 take-trunk closure (P-2026-09-28-2305)
- `813b1c058` merge: alfonso-frontend-jjtl into sim-outputs-accepting (P-2026-09-28-2305)
- `0c488fad3` docs(prompts): P-2026-09-28-2305 sim-outputs-accepting takes the trunk
- `bdd11814c` docs(sim): provisional R-SIM-50/51/52 rows for the outputs engine slice (P-2026-09-27-1725)
- `5b3b59375` docs(sim): S4 engine slice closure, log entry, Status (P-2026-09-27-1725)
- `ab4b8de8b` feat(sim): the engine reads Accepting and the role-bound outputs (P-2026-09-27-1725)
- `0b098be01` docs(sim): Alfonso answers the outputs and Accepting discovery (P-2026-09-27-1725)
- `5bfbdc5ce` docs(sim): Moore/Mealy outputs and Accepting discovery (P-2026-09-27-1725)
- `6f83971cd` docs: add prompt P-2026-09-27-1725, sim_outputs_accepting discovery

The trunk carries, since the base, 6 commits:

- `27badf6c2` docs: Status flip and log entry for the scenes-base merge (P-2026-09-28-2333)
- `b0e4b9f15` merge: scenes-base into alfonso-frontend-jjtl (P-2026-09-28-2333)
- `0ecd2fb15` docs: add prompt P-2026-09-28-2333, merge scenes-base into alfonso-frontend-jjtl
- `80b4397ea` docs: scenes-after-staging log entry and Status flip (P-2026-09-28-1025)
- `69f7dbea1` docs: four demo scenes read identical after the staging merge (P-2026-09-28-1025)
- `583f2efdf` docs: add prompt P-2026-09-28-1025, four demo scenes after the staging merge

Measured by `lane-run merge` at 2026-09-28 23:43, trunk at `27badf6c2`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 97082df02`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 12 on the branch side, 4 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only fb044365b 97082df02 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1725_prompt_discovery_sim_outputs_accepting.md` (eseguito 2026-09-27 · lane sim-outputs-accepting · ab4b8de8b), `claude_2026-09-28_2305_prompt_sim_outputs_take_trunk.md` (eseguito 2026-09-28 · lane sim-outputs-accepting · 813b1c058 · non fuso nel tronco: hard-stop, le quattro scene le sonda la chat).
- `git worktree list`: `sim-outputs-accepting` in `/Users/alfonso/jjodel-w-outputs`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-28-2343/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `97082df02` is the tip of `sim-outputs-accepting`; the prompt files of the branch read `Status: eseguito` at `97082df02`; `git worktree list` shows `sim-outputs-accepting` only in `/Users/alfonso/jjodel-w-outputs`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 97082df02` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only fb044365b 97082df02 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only fb044365b alfonso-frontend-jjtl` with `git diff --name-only fb044365b 97082df02` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-91` (branch), `R-SIM-92` (branch), `R-SIM-93` (branch); control: `- **R-SIM-94**` none.
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-27: corsia S4, Accepting e output nel motore (R-SIM-91..93)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: Moore/Mealy outputs and Accepting, S4 (P-2026-09-27-1725)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the engine reads Accepting and the role-bound outputs, S4 engine slice (P-2026-09-27-1725)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — docs: provisional R-SIM-86..88 for the outputs engine slice (P-2026-09-27-1725)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: alfonso-frontend-jjtl into sim-outputs-accepting (P-2026-09-28-2305)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — discovery: four demo scenes read identical after the staging merge (P-2026-09-28-1025)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: scenes-base into alfonso-frontend-jjtl (P-2026-09-28-2333)` once (trunk).
4. `git merge --no-ff --no-commit 97082df02`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-outputs-accepting into alfonso-frontend-jjtl (P-2026-09-28-2343)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `97082df02` in `/Users/alfonso/jjodel-w-outputs`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 27badf6c2` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-outputs-accepting merge (P-2026-09-28-2343)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-outputs`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
