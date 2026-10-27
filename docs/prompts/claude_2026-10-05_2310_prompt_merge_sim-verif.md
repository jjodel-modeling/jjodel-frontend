# Prompt: merge sim-verif into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-05-2310
Chat: C-2026-10-05-1110
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-10-05 · lane merge · b4fbccd80 · verifica visiva passata 2026-10-05 (RC-23 della lane 1 passata sui crop, merge senza altre differenze visive)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-05-2310 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `a6fe2cf0d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-verif` into the trunk with one merge commit, `--no-ff`, of the explicit sha `ec6e92707`, in the shape of `a6fe2cf0d` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `57ff86f5d`. The branch carries, on top of the base, 9 commits:

- `ec6e92707` docs: Status flip of the sim-watches lane after the chat's visual GO (P-2026-10-05-1735)
- `30506e980` docs: log entry of the sim-watches lane, invariants and breakpoints (P-2026-10-05-1735)
- `ed800135c` feat(sim): invariants and breakpoints stop Play and the clocks (P-2026-10-05-1735)
- `c539aa2bb` test(sim): invariants and breakpoints, codec, evaluator, Play and clocks (P-2026-10-05-1735)
- `1a6e9db22` docs: adopt the sim-verif discovery into R-SIM-137..141, prompt P-2026-10-05-1735 (watches)
- `2d76487ca` docs: Status flip and log entry for the sim-verif discovery (P-2026-10-05-1655)
- `ac81aca96` docs: discovery of watches, step back, scenarios, coverage (P-2026-10-05-1655)
- `8511a9c16` probe: node bench for watches, step back, scenarios, coverage (P-2026-10-05-1655)
- `d48373101` docs: R-SIM-137..141 and discovery prompt P-2026-10-05-1655 (watches, step back, scenarios, coverage)

The trunk carries, since the base, 16 commits:

- `a6fe2cf0d` merge: console-errors-fix into alfonso-frontend-jjtl (P-2026-10-05-2253)
- `8c76d02c9` docs: add prompt P-2026-10-05-2253, merge console-errors-fix into alfonso-frontend-jjtl
- `0eb09ad8f` docs: Status flip and log entry for the harness-goal-model merge (P-2026-10-05-1801)
- `f23297895` merge: harness-goal-model into alfonso-frontend-jjtl (P-2026-10-05-1801)
- `613a13c37` docs: Status flip, log entry and report addendum for E1 and E2 (P-2026-10-05-1648)
- `09b0a37fe` docs: add prompt P-2026-10-05-1801, merge harness-goal-model into alfonso-frontend-jjtl
- `bd8fe5700` docs: Status flip and log entry for the goal model draft (P-2026-10-05-1725)
- `097f3f187` docs(goals): softgoals, contributions and conflicts, first draft (P-2026-10-05-1725)
- `68e4f312d` fix: no console errors E1 and E2 on the demo scenes (P-2026-10-05-1648)
- `ca3a4b8de` docs: add prompt P-2026-10-05-1725, goal model first draft
- `d2c8acddb` merge: console-errors-disc into console-errors-fix (P-2026-10-05-1648)
- `95730c5a3` docs: add prompt P-2026-10-05-1648, fix console errors E1 and E2 before the freeze
- `49a8a55f5` docs: closure of the console errors discovery, discovery only (P-2026-10-04-1025)
- `ecea25e93` docs: discovery, two console errors on the demo scenes (P-2026-10-04-1025)
- `9e54b5d96` probe: console errors E1 and E2 on the four demo scenes (P-2026-10-04-1025)
- `05ea37570` docs: add prompt P-2026-10-04-1025

Measured by `lane-run merge` at 2026-10-05 23:10, trunk at `a6fe2cf0d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ec6e92707`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 18 on the branch side, 19 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/simulation.md`.
- `git diff --name-only 57ff86f5d ec6e92707 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-05_1655_prompt_discovery_sim_watches_scenarios_coverage.md` (eseguito 2026-10-05 · lane sim-verif · discovery only · probe 8511a9c16 (frontend/scripts/probe/sim-verif-bench.ts, node, the four demo fixtures, 35 PASS, 0 FAIL, EXIT=0; check:scripts exit 0) · report ac81aca96 docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md, read on d48373101 · hard-stop: 12 decisions taken unattended (§8.1), none awaiting Alfonso, five questions with Recommended (§8.3), three Phase 2 lanes in §6 · nothing under frontend/src changed), `claude_2026-10-05_1735_prompt_sim_watches.md` (eseguito 2026-10-05 · lane sim-watches · ed800135c · verifica visiva passata 2026-10-05).
- `git worktree list`: `sim-verif` in `/Users/alfonso/jjodel-w-simverif`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-05-2310/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `ec6e92707` is the tip of `sim-verif`; the prompt files of the branch read `Status: eseguito` at `ec6e92707`; `git worktree list` shows `sim-verif` only in `/Users/alfonso/jjodel-w-simverif`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl ec6e92707` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 57ff86f5d ec6e92707 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 57ff86f5d alfonso-frontend-jjtl` with `git diff --name-only 57ff86f5d ec6e92707` (measured above: `docs/decisions.md`, `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-137` (branch), `R-SIM-138` (branch), `R-SIM-139` (branch), `R-SIM-140` (branch), `R-SIM-141` (branch), `R-GOAL-1` (trunk); control: `- **R-GOAL-2**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-10-05: watches, step back, scenarios and coverage (R-SIM-137..141)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — discovery: watches, step back, scenarios and coverage, R-SIM-137..140 (P-2026-10-05-1655)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — feat: invariants and breakpoints in the simulator, lane sim-watches (P-2026-10-05-1735)` once (branch).
   - `docs/decisions.md`: the heading `## R-GOAL — the goal model of the requirements (decision 2026-10-05)` once (trunk).
   - `docs/log-inbox/goals.md`: the heading `## 2026-10-05 — docs(goals): the requirements' goal model, first draft (P-2026-10-05-1725)` once (trunk).
   - `docs/log-inbox/goals.md`: the heading `## 2026-10-05 — merge: harness-goal-model into alfonso-frontend-jjtl (P-2026-10-05-1801)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — discovery: two console errors on the demo scenes (P-2026-10-04-1025)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — fix: no console errors E1 and E2 on the demo scenes (P-2026-10-05-1648)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-05 — ticket: the M1 ecore JSON keeps one root object per class` once (trunk).
4. `git merge --no-ff --no-commit ec6e92707`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-verif into alfonso-frontend-jjtl (P-2026-10-05-2310)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `ec6e92707` in `/Users/alfonso/jjodel-w-simverif`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard a6fe2cf0d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-verif merge (P-2026-10-05-2310)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simverif`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
