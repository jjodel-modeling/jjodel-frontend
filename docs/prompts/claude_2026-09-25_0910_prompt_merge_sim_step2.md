# Prompt: merge simulation step 2 into the trunk, then realign simulation-engine

Prompt-ID: P-2026-09-25-0910
Chat: C-2026-09-25-0016
Status: eseguito 2026-09-25 · lane merge · 2aecc1429

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop and say so. The only other tree this lane touches is `~/jjodel-sim`, in step 7, for a fast-forward this prompt authorizes (P14). Do not touch `~/jjodel`, `~/jjodel-gate`, `~/jjodel-open` (a discovery lane may be running there), or `~/jjodel-harness`.

Single phase, with hard stops. This is a merge, not a feature: no source file is edited by hand.

## COSA

Bring step 2 of the simulator (`P-2026-09-24-1520`) into the trunk with one merge commit, `--no-ff`, in the shape of `94a72edba` and `2dd17270b` (read both bodies first and mirror them). Merge the explicit sha `02794701d`, not the branch name. It carries: Phase 1 report `d4d7b6320`, refactor `4bf12ebf9` (shared JjEL tri-state out of validation), code `e993d1b1a` (guard context, guard evaluator, subset checker), docs `e1baa6cf7`, tests `80dab51b9`, docs `4a014a68f`, Status `02794701d`.

Why now and not after step 3, as planned: the branch and the trunk have diverged both ways, and the trunk holds rules the branch does not (the harness gate merged in `2dd17270b`; R-SIM-21..26 ratified in `84f29b9c6`). By P15 a rule binds only where it is written, so step 3 would start without its own constraints. After this merge `simulation-engine` goes back to being a fast-forward of the trunk, as the convention wants.

## DOVE

The merge commit and one Status commit on `alfonso-frontend-jjtl` in `~/jjodel-release`; then a fast-forward of `simulation-engine` in `~/jjodel-sim`. Measured at 2026-09-25 09:08: merge base `6cdba58cf`; the branch has 7 commits and 12 files (`frontend/src/model/jjelTriState.ts`, `frontend/src/model/simulation/{guardContext,guardEvaluator,subsetChecker}.ts`, their four test files, `frontend/src/model/validation/validationEvaluator.ts`, `docs/log-inbox/simulation.md`, the step 2 report, the prompt Status); the trunk touched 34 files since the base; no file on both sides; `git merge-tree` clean. Re-measure; do not inherit these claims.

## COME

1. Preconditions, each a hard stop if false: `git status` empty in `~/jjodel-release` and in `~/jjodel-sim`; the 1520 Status on `02794701d` reads `eseguito`; `P-2026-09-25-0016` Status on the trunk reads `eseguito`; `git worktree list` shows `alfonso-frontend-jjtl` only in `~/jjodel-release` and `simulation-engine` only in `~/jjodel-sim`; `02794701d` is the tip of `simulation-engine`.

2. Re-measure both sides from the merge base, file by file, and run `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 02794701d`. Any file on both sides or any conflict: stop and report before merging.

3. Semantic probes before the merge (P14). Two known contacts:
   - The inbox lint, now on the trunk, checks every inbox entry, and `docs/log-inbox/simulation.md` on the branch was written before it. In `~/jjodel-release`, overwrite it with the branch version (`git show 02794701d:docs/log-inbox/simulation.md > docs/log-inbox/simulation.md`), run `npm run check:docs` from `frontend/`, record the full output, restore with `git show HEAD:docs/log-inbox/simulation.md > docs/log-inbox/simulation.md`, and confirm `git status` is empty. If the lint rejects anything: hard stop, report message and line, propose the smallest change, wait.
   - `validationEvaluator.ts` was refactored on the branch (`4bf12ebf9`). Confirm with `git log 6cdba58cf..alfonso-frontend-jjtl -- frontend/src/model/validation/` that the trunk did not change anything under `frontend/src/model/validation/` or anything that imports `validationEvaluator.ts`; list the importers on the trunk and say whether any of them changed since the base.

4. `git merge --no-ff 02794701d` in `~/jjodel-release`. Subject: `merge: simulation step 2, guard context and evaluator (P-2026-09-24-1520)`. Body in the shape of the precedents: the shas of COSA; what the trunk gained since `6cdba58cf` (the 1455, 1610 and 1630 lanes, the 0016 merge, R-SIM-21..26 and docs), the probe results of step 3, a sentence saying the merge anticipates the plan and why (one line, from COSA), the RC-13 exception declared, `Model:` and `Co-Authored-By` trailers. No P15 paragraph: the branch does not change `CLAUDE.md`, `AGENTS.md` or `docs/PROTOCOL.md` (verify it with `git diff --name-only 6cdba58cf 02794701d`; if it does, stop). Any conflict: `git merge --abort`, stop, report.

5. Gates on the merge commit, from `frontend/`, with the P14 temporary symlink if needed, leaving the tree as found:
   - `npm run typecheck`: 14 errors, the `CLAUDE.md` §17 baseline set by file and code.
   - `npm run typecheck:scripts`: exit 0.
   - `npx vitest run`: expected 4449 (the trunk after `2dd17270b`) plus the tests the branch adds since `6cdba58cf`. Count the branch tests by file before the merge (run vitest on the four new test files in `~/jjodel-sim`, read-only) and state the expected total before running; 0 failed; the same 9 files red at import.
   - `npm run build`: exit 0.
   - `npm run check:docs`: 4/4; report the telemetry lines (inboxes and Check D).
   - `npm run check:agents`: green.
   - `npm run check:scripts`: 0 hits expected in this tree. A hit in a tracked file: stop.

6. No visual check and no smoke: step 2 has no UI (the 1520 Status records none). Say so.

7. Realign the branch. In `~/jjodel-sim`: assert `pwd` is `/Users/alfonso/jjodel-sim` and `git rev-parse --abbrev-ref HEAD` is `simulation-engine`, `git status` empty, then `git merge --ff-only <merge sha>`. A refusal of the fast-forward: stop and report, never a non-ff merge there. Then run `npm run check:scripts` from `~/jjodel-sim/frontend` (same symlink rule): ticket (1) of the 1630 entry expects a hit in the untracked `_tmp_sim1_verify.ts:186`. Report every hit; do not fix, do not delete: untracked probes are Alfonso's.

8. One docs commit on the trunk: this prompt's Status flipped to `eseguito 2026-09-25 · lane merge · <merge sha>`, pathspec after `--`, subject `docs: Status flip for the simulation step 2 merge (P-2026-09-25-0910)`, `Model:` trailer. No log entry for the merge (precedents): the merge body is the record. The inbox fold stays for its own P13 lane.

9. Closing report: merge sha, probe outputs, gate numbers, the fast-forward result and the new tip of `simulation-engine`, the `check:scripts` hits in `~/jjodel-sim`, and the push order without pushing: `harness-gate`, then the trunk. `simulation-engine` has never been on origin and stays local unless Alfonso says otherwise.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name instead of the sha, squash, a non-ff merge in `~/jjodel-sim`, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P15; `docs/decisions.md` RC-13, RC-14, R-SIM-21..26.
- Merge precedents `94a72edba`, `2dd17270b`; prompt `docs/prompts/claude_2026-09-25_0016_prompt_merge_harness_gate.md` (the probe of its step 3).
- `docs/prompts/claude_2026-09-24_1520_prompt_sim_step2_eval_context.md` and `docs/discovery/discovery_2026-09-24_sim_step2_eval_context.md` on `simulation-engine`.
