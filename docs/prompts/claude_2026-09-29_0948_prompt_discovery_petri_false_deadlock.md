# Prompt: discovery, a reported false deadlock on a DemoPetri-like net

Prompt-ID: P-2026-09-29-0955
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the simulation engine, Petri semantics). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-petridl`, branch `petri-deadlock-disc` (cut by the chat from `alfonso-frontend-jjtl` at `385807485`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-petridl`, branch `petri-deadlock-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Bug report received by Alfonso, 2026-09-29, verbatim:

> Net: t1: p1 -> p2 (out weight 2); t2: p2 (in weight 2) + inhibitor lock -> p3; t3: lock -> (none). Initial marking (p1,p2,p3,lock) = (2,0,0,1). Run: t1, t1, t3, t2. Steps 1-4 correct. After t2 the marking is (0,2,1,0) and the run reports Deadlock, but t2 is enabled (p2=2 >= 2, lock=0). Expected: t2 fires again -> (0,0,2,0), then deadlock. Candidate causes: strict '>' in the weight check; output/capacity check on p3; enabled set not recomputed after firing. Discriminating runs: initial (0,2,0,0) and (0,2,1,0), check whether t2 is enabled.

The chat's reading, to confirm or refute: DemoPetri's `t2` carries the guard `p3.[tokens] < 1` (`docs/demo/models_2026_simulator_demo.md:126`), and the demo script expects exactly this deadlock with the reason `ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]` (`:165-170`). The report does not mention the guard. If the reporter's net had the guard, the deadlock is correct; if it had none, it is a bug.

Goal: decide which, with measurements.

## DOVE (read-only)

- `frontend/src/model/simulation/` (`netCompile.ts`, `netStep.ts`, `guardContext.ts`, the bound `simBound` and any capacity check), their tests; DemoPetri (`/Users/alfonso/jjodel-demo-exports/scene_2_DemoPetri.json`, read only).
- Report: `docs/discovery/discovery_2026-09-29_petri_false_deadlock.md`, opening with `## 0. Answer in brief`, at most 30 lines; plus this prompt's Status and a log entry in `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (§6, the discovery rules, critical zone), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, the Petri rows (R-SIM series: weights, inhibitor, guard, bound).
2. With gitignored `_tmp_*` scripts under `npx tsx` (no dev server), build the reported net on the engine directly and run, each with and without the guard `p3.[tokens] < 1` on t2, and with the bound as DemoPetri sets it (4) and unset: (a) the reported run t1, t1, t3, t2, then the enabled set; (b) initial (0,2,0,0); (c) initial (0,2,1,0). Report the enabled set and the status after each step, [M].
3. Check the three candidate causes against the code with file:line: the weight comparison (`>=` or `>`), any output or capacity check on p3 (bound 4), recomputation of the enabled set after firing.
4. `Recommended:` either «not a bug: the guard» (with the reading that proves it, and whether the deadlock reason is clear enough for a user who forgot the guard), or «bug» with the root cause and a Phase 2 fix plan (files, tests first). Name any point that is Alfonso's decision.
5. One docs commit. Stop with `Outcome: hard-stop`, the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code.

## RIFERIMENTI

- The demo script §2.2 (Petri); the Petri R-SIM rows; `discovery_2026-09-25_sim_step3_petri_core.md`.
