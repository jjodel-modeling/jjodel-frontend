# Prompt: merge simulation step 3 into the trunk, then realign simulation-engine

Prompt-ID: P-2026-09-25-1247
Chat: C-2026-09-25-1030
Lane: full (more than 3 files)
Status: da eseguire
Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop and say so. The only other tree this lane touches is `~/jjodel-sim`, in step 8, for a fast-forward this prompt authorizes (P14). Do not touch `~/jjodel`, `~/jjodel-open`, `~/jjodel-gate` (the closed `harness-bypass` lane, not merged), or `~/jjodel-harness`.

Single phase, with hard stops. This is a merge, not a feature: no source file is edited by hand.

**Order.** This lane runs after the open-path merge `P-2026-09-25-1115`, in the same tree. Precondition: the 1115 prompt on the trunk reads `Status: eseguito`. If it still reads `da eseguire`, stop and say so: two merges never run at once in `~/jjodel-release`.

## COSA

Bring step 3 of the simulator (the Petri core, waves 3a and 3b: `P-2026-09-25-0935` and `P-2026-09-25-1103`) into the trunk with one merge commit, `--no-ff`, in the shape of `2aecc1429` (step 2) and of the 1115 merge (read both bodies first and mirror them). Merge the explicit sha `8c88f83f7`, the tip of `simulation-engine`, not the branch name. It carries, on top of the merge base `dee18d69b`: the step 3 prompt and report (`2a0883ac2`, `de21a2c93`), the ratification R-SIM-27..33 with the spec amendment (`e4506e78f`), wave 3a (`f36fe1c2e` prompt, `79ee9fba3` code, `0fc65866a` closure), the Status flips `2b8475d24` and `8c88f83f7`, the 3b prompt and report (`e3c0c6776`, `b9fd3a1f7`), the ratification R-SIM-34..37 (`7a93968c5`), wave 3b (`3a2c76b83` prompt, `c400a5163` feat, `11de5af03` refactor, `4361f0fe1` closure). Visual check of 3b passed on 3002 on 2026-09-25.

Why now: step 3 is closed, and the next steps (the `.[x]` operator lane, the Expression and Action types, step 4) must start from a trunk that holds R-SIM-16..37 (P15: a rule binds where it is written).

## DOVE

The merge commit and one Status commit on `alfonso-frontend-jjtl`; then a fast-forward of `simulation-engine` in `~/jjodel-sim`. Measured from chat at 2026-09-25 12:47, before the 1115 merge: merge base `dee18d69b`; the branch changes 28 files; the trunk changed 7 files since the base, all docs (`docs/PROTOCOL.md`, `docs/decisions.md`, the cost-per-feature discovery and script, the 1022 and 1115 prompts, the harness memo); one file on both sides, `docs/decisions.md` (trunk RC-16..19, branch R-SIM-27..37, different sections), and `git merge-tree` reported **no conflict**. The 1115 merge adds the open-path code (reducer, SaveManager, projects, Project, ProjectLoadingScreen, registry, one test) and `docs/log-inbox/versionfixer.md`: none under `sim/` or `model/simulation/`. Re-measure everything after 1115; do not inherit these claims.

## COME

1. Preconditions, each a hard stop if false: `git status` empty in `~/jjodel-release` and in `~/jjodel-sim`; no merge in progress (`git rev-parse -q --verify MERGE_HEAD` empty); the 1115 Status on the trunk reads `eseguito`; the 0935 Phase 2 and 1103 Phase 2 prompts on `8c88f83f7` read `eseguito`; `8c88f83f7` is the tip of `simulation-engine`; `git worktree list` shows `alfonso-frontend-jjtl` only in `~/jjodel-release` and `simulation-engine` only in `~/jjodel-sim`.
2. Re-measure both sides from the merge base, file by file, and run `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8c88f83f7`. Any conflict, or any file other than `docs/decisions.md` on both sides: stop and report before merging. Confirm with `git diff --name-only dee18d69b 8c88f83f7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md` that the branch changes no normative file (P15); if it does, stop.
3. Semantic probes before the merge (P14), read-only:
   - The inbox lint on the trunk checks every inbox entry. Overwrite `docs/log-inbox/simulation.md` in `~/jjodel-release` with the branch version (`git show 8c88f83f7:docs/log-inbox/simulation.md > docs/log-inbox/simulation.md`), run `npm run check:docs` from `frontend/`, record the output, restore with `git show HEAD:docs/log-inbox/simulation.md > docs/log-inbox/simulation.md`, confirm `git status` empty. A rejection: stop, report message and line, propose the smallest change, wait.
   - Removed APIs: on the trunk tip, `command grep -rnw -e simApplyStep -e stepFlowchartBoolean -e applyStepLabel -e SimConfiguration -e StcRoles -e StcDescriptor -e StepLabel -e SimRunStatus frontend/src` must find nothing outside `components/editor-v2/sim/` and `model/simulation/` (positive control: the same grep finds them on `dee18d69b`). A hit elsewhere: stop.
   - The open-path merge touched `reducer.ts` and the load path; confirm that nothing under `sim/` or `model/simulation/` imports from those files (`command grep -rn` on the imports), so the two merges do not interact.
   - P13 convention: the trunk now has one Status flip and a `Lane:` header (RC-17). Report which branch prompt files use the older form; do not rewrite them (history).
4. `git merge --no-ff 8c88f83f7`. Subject: `merge: simulation step 3, Petri core, panel and run-state (P-2026-09-25-0935, P-2026-09-25-1103)`. Body in the shape of the precedents: the shas of COSA; what the trunk gained since `dee18d69b` (the harness memo and RC-16..19, the cost-per-feature discovery, the 1022 prompt, the 1115 merge of the open path); the probe results of step 3; the behaviour changes this merge brings into force (one firing per step instead of fire-all; two tokens meeting in a place at bound 1 halt the run as unsafe; Deadlock turns every input off; fork and join nodes are never highlighted; editing the model interrupts a run; `simTerminal` optional); `Model:` and `Co-Authored-By` trailers. Any conflict: `git merge --abort`, stop, report.
5. Gates on the merge commit, from `frontend/`, with the P14 temporary symlink if needed, leaving the tree as found:
   - `npm run typecheck`: 14 errors, the §17 set by file and code.
   - `npm run typecheck:scripts`: exit 0.
   - `npx vitest run`: state the expected total before running. The trunk after 1115 (its closing report gives the number) plus what the branch adds over `dee18d69b` (4617 on the branch minus 4530 at the base: 87). 0 failed, the same 9 files red at import.
   - `npm run build`: exit 0.
   - `npm run check:docs`: 4/4; report the telemetry lines (inboxes, Check D).
   - `npm run check:agents`: green.
   - `npm run check:scripts`: 0 hits expected in this tree; a hit in a tracked file is a stop.
6. **Visual regression, hard stop.** Tell Alfonso to hard-refresh `http://localhost:3001/` (the trunk's dev server; if it is not running, say so and let him start it) and check: (a) a healthy project opens (the open-path merge is below this one); (b) on a model with the simulator configured, or on the turnstile built by the 3b scenario script if it is still in the scratchpad (give him the path if it exists), Reset, Coin, Push behave as on 3002; (c) the simulation chip on a metamodel shows the four groups. Wait for his answer. On a failure, report and stop; do not revert without instruction.
7. After Alfonso's OK, one docs commit on the trunk: this prompt's Status flipped to `eseguito 2026-09-25 · lane merge · <merge sha> · verifica visiva passata 2026-09-25`, pathspec after `--`, subject `docs: Status flip for the simulation step 3 merge (P-2026-09-25-1247)`, `Model:` trailer. No log entry for the merge (precedents). The two simulation inbox entries stay for the next P13 fold.
8. Realign the branch. In `~/jjodel-sim`: assert `pwd` and branch `simulation-engine`, `git status` empty, then `git merge --ff-only <the Status commit sha>`. A refusal: stop and report, never a non-ff merge there.
9. Closing report, opening with `[P-2026-09-25-1247 · session <id>]`: merge sha, probe outputs, gate numbers, visual result, the new tip of `simulation-engine`, and the push state without pushing (the trunk ahead of origin by the 1115 and 1247 merges and their Status commits; `simulation-engine` and `open-path` never on origin).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name instead of the sha, squash, rebase, a non-ff merge in `~/jjodel-sim`, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P15; `docs/decisions.md` RC-13, RC-14, RC-17, R-SIM-16..37.
- Merge precedents `2aecc1429` and the 1115 merge; prompts `docs/prompts/claude_2026-09-25_0910_prompt_merge_sim_step2.md`, `docs/prompts/claude_2026-09-25_1115_prompt_merge_open_path.md`.
- On `simulation-engine`: the 3a and 3b Phase 2 prompts and the two reports of 2026-09-25, `docs/log-inbox/simulation.md`.
