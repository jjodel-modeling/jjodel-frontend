# Prompt: input variables for the simulator (a value asked during the run)

Prompt-ID: P-2026-09-28-0034
Chat: C-2026-09-27-1437
Lane: discovery (read-only on the code; the report is the only file written; implementation waits for Alfonso's yes on the design)
Status: eseguito 2026-09-28 · lane sim-input-variables · Phase 1 011157c2b; Phase 2 ffcd0d5ae, 4884a57c3, 2033b731d, b15fe4484 · verifica visiva non eseguita a mano: crops in ~/.jjodel-lanes/shots_input/ · not merged: after 2026-10-04 (R-SIM-88)

Worktree: `~/jjodel-w-input`, branch `sim-input-variables`, cut by the chat from `alfonso-frontend-jjtl` at `b452d9e5c` (checker rules merged); `frontend/node_modules` symlinked (P14); a fresh session started by `lane-run`. Before anything else: `pwd` is that worktree, the branch is `sim-input-variables`, `git log -1` is the commit that adds this file, `git status` is empty; otherwise `Outcome: blocked`.

## COSA

Alfonso asked on 2026-09-27 whether a DecisionNode can carry a boolean `decision` whose value is asked through a dialog when the run reaches the node. Today the value comes only from the model or from the Data initial value (P-2026-09-27-2255, report `docs/discovery/discovery_2026-09-27_sim_decision_boolean.md` on branch `sim-decision-probe`, commit `6cc28c866`: `self.source.[decision]` / `not self.source.[decision]` work with a Data row). The only external input today is the ESM Events (coin, push, stop), which fire transitions but assign no values. In model-checking terms this is an input variable (nuXmv IVAR): a value chosen by the environment at each step.

Answer, with measurements where the code allows it:

1. **Where an input enters today.** The Events path end to end (roles, STC, `netStep`, the panel's Events buttons); the ε-choice path (the «Choose a transition» list); how the Data rows and σ are stored and read (`stateAttributes`, `.[x]`). Files and lines.
2. **Design options**, at least three, each with the roles it needs, the engine change, the panel change, the checker change (P2b rules R1/R2 now on the trunk), what the demo would show, and the risk: (a) a role «Input» on a Data row: when a step reads it and it is unset for this step, the run pauses and asks; (b) an input bound to an Event: the event button asks the value, the value is assigned before the transitions fire; (c) no new role: a guard that reads an unset Data attribute pauses the run and asks, instead of deadlocking. Say for each how it maps to nuXmv IVAR and to the STC vocabulary (`docs/decisions.md` R-SIM rows of the computational model).
3. **Recommended design**, one, with a slice plan (files per slice, tests, probes, the no-layout-shift rule for any new panel element, the dialog shape consistent with the Simulation roles dialog) and the R- rows it would need (drafted, not written).
4. **Cost and timing** against the freeze of 2026-10-01 evening (RC-31): what could be done before it without changing the four demo scenes, and what must wait.

Out of scope: Mealy computed outputs (dropped by Alfonso on 2026-09-28 at 00:07), any code change.

## DOVE

Read anything. Write only `docs/discovery/discovery_2026-09-28_sim_input_variables.md` (opening `## 0. Answer in brief`, at most 40 lines: the answer, the recommendation, the decisions awaiting Alfonso, questions with `Recommended:` lines; the rest as appendix) and this prompt's Status. A probe is allowed (gitignored, port 3031 only) if a measurement needs it.

## COME

1. Read `CLAUDE.md`, the 2255 report (`git show 6cc28c866:docs/discovery/discovery_2026-09-27_sim_decision_boolean.md`), the modal report, the checker report, the computational-model rows in `docs/decisions.md`.
2. The four answers, with file:line evidence.
3. One commit: `docs: sim input variables discovery (P-2026-09-28-0034)`, the report and the Status flip.
4. `Outcome: hard-stop` with the sha and the brief.

Never: a change to any tracked file other than the report and the Status line, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3031.

## RIFERIMENTI

`docs/decisions.md` (R-SIM rows, RC-31); `docs/discovery/discovery_2026-09-27_sim_modal.md`; `docs/discovery/discovery_2026-09-27_sim_checker_gap.md`; `docs/PROTOCOL.md` P13, P16; RC-17, RC-25.
